import React, { useState, useEffect, useMemo } from 'react';
import { 
  Truck, Clock, Key, Plus, X, ArrowRight, Play, 
  MapPin, CheckCircle2, AlertTriangle, ShieldAlert
} from 'lucide-react';
import { sounds } from '../../components/SoundEffects';

interface PurchaseOrderItem {
  sku: string;
  name: string;
  qtyOrdered: number;
}

interface PurchaseOrder {
  id: string;
  createdDate: string;
  status: 'Pending' | 'Completed' | 'Cancelled' | 'Merged' | 'ReturnPending' | 'ReturnReceived';
  vendorName: string;
  expectedDeliveryDate: string;
  items: PurchaseOrderItem[];
  internalNotes?: string;
}

interface Dock {
  id: string; // D1, D2, D3
  name: string;
  status: 'Free' | 'Reserved' | 'Unloading';
  assignedPoId?: string;
  carrierName?: string;
  truckPlate?: string;
  eta?: string;
}

interface YardTruck {
  id: string; // TRK-XXXX
  carrierName: string;
  truckPlate: string;
  status: 'Queue' | 'Parked' | 'Docked';
  parkingSlot?: string; // P1 - P5
  assignedPoId?: string; // e.g. PO-00813
}

interface YardManagerProps {
  docks: Dock[];
  setDocks: React.Dispatch<React.SetStateAction<Dock[]>>;
  yardTrucks: YardTruck[];
  setYardTrucks: React.Dispatch<React.SetStateAction<YardTruck[]>>;
  purchaseOrders: PurchaseOrder[];
  logActivity: (msg: string, type: string, details?: string) => void;
  addToast: (title: string, text: string, type: 'error' | 'warning' | 'info' | 'success') => void;
}

export default function YardManager({
  docks = [],
  setDocks,
  yardTrucks = [],
  setYardTrucks,
  purchaseOrders = [],
  logActivity,
  addToast
}: YardManagerProps) {
  // Modal state for directing a truck to a dock
  const [selectedTruckForDocking, setSelectedTruckForDocking] = useState<YardTruck | null>(null);
  
  // Modal state for manual arrival registration
  const [isManualArrivalOpen, setIsManualArrivalOpen] = useState(false);
  const [manualCarrier, setManualCarrier] = useState('');
  const [manualPlate, setManualPlate] = useState('');
  const [manualPoId, setManualPoId] = useState('');

  // Local storage sync for yard trucks
  useEffect(() => {
    window.localStorage.setItem('wms-yard-trucks', JSON.stringify(yardTrucks));
  }, [yardTrucks]);

  // Read sound settings from WMS config
  const isSoundEnabled = () => {
    return window.localStorage.getItem('wms-sound-enabled') !== 'false';
  };

  // 1. Simulation of incoming trucks at the gate queue
  useEffect(() => {
    const interval = setInterval(() => {
      // Maximum 3 trucks in queue at the gate
      const queueTrucks = yardTrucks.filter(t => t.status === 'Queue');
      if (queueTrucks.length < 3 && Math.random() < 0.3) {
        const carriers = ['DHL Freight', 'Schenker', 'Raben Logistics', 'DPD Cargo', 'FedEx Trade', 'GLS Express'];
        const prefixes = ['WI', 'WA', 'KR', 'PO', 'GD', 'DW', 'EL', 'ZS'];
        const plates = `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${Math.floor(10000 + Math.random() * 90000)}`;
        
        // Find a random pending PO to assign, or leave empty
        const pendingPos = purchaseOrders.filter(po => 
          po.status === 'Pending' && 
          !yardTrucks.some(t => t.assignedPoId === po.id) &&
          !docks.some(d => d.assignedPoId === po.id)
        );
        const assignedPo = pendingPos.length > 0 ? pendingPos[0].id : '';

        const newTruck: YardTruck = {
          id: `TRK-${Math.floor(1000 + Math.random() * 9000)}`,
          carrierName: carriers[Math.floor(Math.random() * carriers.length)],
          truckPlate: plates,
          status: 'Queue',
          assignedPoId: assignedPo
        };

        setYardTrucks(prev => [...prev, newTruck]);

        if (isSoundEnabled()) {
          sounds.playBeep();
        }

        addToast(
          'Nowy transport na bramie', 
          `Pojazd ${plates} (${newTruck.carrierName}) oczekuje w kolejce wjazdowej.`, 
          'info'
        );
      }
    }, 20000); // Check every 20 seconds

    return () => clearInterval(interval);
  }, [yardTrucks, purchaseOrders, docks]);

  // 2. Queue & Parking slots configuration
  const queueTrucks = useMemo(() => {
    return yardTrucks.filter(t => t.status === 'Queue');
  }, [yardTrucks]);

  // Maps parking slots P1-P5 to their occupying truck
  const parkingSlotsMap = useMemo(() => {
    const map: Record<string, YardTruck | null> = {
      P1: null, P2: null, P3: null, P4: null, P5: null
    };
    yardTrucks.forEach(t => {
      if (t.status === 'Parked' && t.parkingSlot) {
        map[t.parkingSlot] = t;
      }
    });
    return map;
  }, [yardTrucks]);

  // Find first free parking slot
  const firstFreeParkingSlot = useMemo(() => {
    for (let slot of ['P1', 'P2', 'P3', 'P4', 'P5']) {
      if (!parkingSlotsMap[slot]) return slot;
    }
    return null;
  }, [parkingSlotsMap]);

  // 3. Move truck from Gate Queue to Parking slot
  const handleAssignToParking = (truckId: string) => {
    const freeSlot = firstFreeParkingSlot;
    if (!freeSlot) {
      addToast('Brak miejsc', 'Wszystkie miejsca parkingowe P1-P5 są zajęte.', 'warning');
      return;
    }

    setYardTrucks(prev => prev.map(t => {
      if (t.id === truckId) {
        return {
          ...t,
          status: 'Parked',
          parkingSlot: freeSlot
        };
      }
      return t;
    }));

    const truck = yardTrucks.find(t => t.id === truckId);
    if (truck) {
      logActivity(
        `Wjazd pojazdu ${truck.truckPlate} na parking (miejsce ${freeSlot})`,
        'relocate',
        `Przewoźnik: ${truck.carrierName}`
      );
      if (isSoundEnabled()) {
        sounds.playSuccess();
      }
    }
  };

  // 4. Manually register a new arrival directly to parking or queue
  const handleManualArrivalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCarrier || !manualPlate) {
      alert('Wypełnij pola przewoźnika i rejestracji.');
      return;
    }

    const freeSlot = firstFreeParkingSlot;
    const newTruck: YardTruck = {
      id: `TRK-${Math.floor(1000 + Math.random() * 9000)}`,
      carrierName: manualCarrier,
      truckPlate: manualPlate.toUpperCase(),
      status: freeSlot ? 'Parked' : 'Queue',
      parkingSlot: freeSlot || undefined,
      assignedPoId: manualPoId || undefined
    };

    setYardTrucks(prev => [...prev, newTruck]);
    
    const assignedLocation = freeSlot ? `Parking: ${freeSlot}` : 'Kolejka zewnętrzna';
    logActivity(
      `Ręczna rejestracja pojazdu ${newTruck.truckPlate}`,
      'receive',
      `Przypisano lokalizację: ${assignedLocation}. Dostawca: ${newTruck.carrierName}`
    );

    if (isSoundEnabled()) {
      sounds.playSuccess();
    }
    addToast('Pojazd zarejestrowany', `Pojazd ${newTruck.truckPlate} skierowany na: ${assignedLocation}`, 'success');

    // Reset form
    setManualCarrier('');
    setManualPlate('');
    setManualPoId('');
    setIsManualArrivalOpen(false);
  };

  // Remove / reject truck from entrance queue
  const handleRemoveFromQueue = (truckId: string) => {
    setYardTrucks(prev => prev.filter(t => t.id !== truckId));
    addToast('Pojazd wycofany', 'Ciężarówka została usunięta z kolejki wjazdowej.', 'info');
  };

  // 5. Send truck from Parking Lot to Dock Gate
  const handleConfirmDocking = (dockId: string) => {
    if (!selectedTruckForDocking) return;

    const truck = selectedTruckForDocking;

    // Update WMS docks state (shared)
    setDocks(prevDocks => prevDocks.map(d => {
      if (d.id === dockId) {
        return {
          ...d,
          status: 'Unloading',
          assignedPoId: truck.assignedPoId,
          carrierName: truck.carrierName,
          truckPlate: truck.truckPlate,
        };
      }
      return d;
    }));

    // Update yard trucks status: set to docked and clear its parking space
    setYardTrucks(prev => prev.map(t => {
      if (t.id === truck.id) {
        return {
          ...t,
          status: 'Docked',
          parkingSlot: undefined // Free up parking space!
        };
      }
      return t;
    }));

    // If PO exists, append docking note in PO internal notes
    if (truck.assignedPoId) {
      // Through props, we let App.tsx PO handler manage the update when PO is received.
      // But we log it to WMS timeline immediately:
      logActivity(
        `Podstawienie pojazdu ${truck.truckPlate} pod Dok ${dockId} z parkingu ${truck.parkingSlot}`,
        'receive',
        `Przewoźnik: ${truck.carrierName}, Dokument PO: ${truck.assignedPoId}`
      );
    } else {
      logActivity(
        `Podstawienie pojazdu ${truck.truckPlate} pod Dok ${dockId} (brak powiązanego PO)`,
        'receive',
        `Przewoźnik: ${truck.carrierName}`
      );
    }

    if (isSoundEnabled()) {
      sounds.playSuccess();
    }
    addToast('Pojazd zadokowany', `Skierowano ${truck.truckPlate} pod Dok ${dockId}. Slot ${truck.parkingSlot} jest wolny.`, 'success');
    setSelectedTruckForDocking(null);
  };

  // 6. Complete unloading / send truck away (un-docking)
  const handleDepartFromDock = (dockId: string) => {
    const dock = docks.find(d => d.id === dockId);
    if (!dock) return;

    // Remove the truck record from yardTrucks list
    if (dock.truckPlate) {
      setYardTrucks(prev => prev.filter(t => t.truckPlate !== dock.truckPlate));
    }

    // Reset the dock in shared state
    setDocks(prev => prev.map(d => {
      if (d.id === dockId) {
        return { id: d.id, name: d.name, status: 'Free' };
      }
      return d;
    }));

    logActivity(
      `Odjazd pojazdu ${dock.truckPlate || 'Dostawcy'} z Doku ${dockId}`,
      'info',
      `Zwolniono bramę rozładunkową.`
    );
    addToast('Brama zwolniona', `Pojazd ${dock.truckPlate || ''} zakończył obsługę i odjechał. Dok ${dockId} jest wolny.`, 'info');
  };

  return (
    <div id="wms-yard-panel" className="space-y-6 font-sans text-sm text-[#334155] animate-fadeIn pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
            <Truck className="w-5.5 h-5.5 text-blue-650" /> Zarządzanie Placem i Ruchem (Yard Management - YMS)
          </h2>
          <p className="text-xs text-slate-500 mt-1.5 max-w-xl font-sans">
            Koordynacja logistyki placu. Wpuszczaj transporty na parking postojowy (P1-P5), przydzielaj ciężarówki do wolnych doków rozładunkowych i zarządzaj kolejnością rozładunku.
          </p>
        </div>
        <button
          onClick={() => setIsManualArrivalOpen(true)}
          className="h-9 px-4 rounded bg-blue-600 hover:bg-blue-750 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border-none shadow active:scale-[0.97]"
        >
          <Plus className="w-4 h-4" /> Rejestruj Pojazd (Gate)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Visual Parking Lot Map */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 border-b border-slate-100 pb-3 select-none">
            <MapPin className="w-4.5 h-4.5 text-blue-600" />
            Plan Placu Magazynowego: Parking Postojowy (P1 - P5)
          </h3>

          <div className="grid grid-cols-5 gap-3.5 pt-2">
            {['P1', 'P2', 'P3', 'P4', 'P5'].map(slot => {
              const truck = parkingSlotsMap[slot];
              return (
                <div 
                  key={slot}
                  className={`border-2 rounded-2xl p-4 flex flex-col justify-between items-center text-center h-[280px] relative overflow-hidden transition-all ${
                    truck 
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                      : 'bg-slate-50 border-slate-200 border-dashed hover:bg-slate-100/70'
                  }`}
                >
                  {/* Asphalt background design stripe */}
                  <div className={`absolute top-0 bottom-0 w-1 ${truck ? 'bg-amber-400' : 'bg-slate-200'} left-1/2 -translate-x-1/2 opacity-25 border-dashed border-r`} />

                  <div className="relative z-10 w-full flex justify-between items-start select-none">
                    <span className={`text-[10px] font-black font-mono border px-1.5 py-0.5 rounded ${
                      truck ? 'bg-white/10 border-white/20 text-white' : 'bg-slate-200 border-slate-300 text-slate-550'
                    }`}>
                      {slot}
                    </span>
                    {truck && (
                      <span className="text-[8px] bg-amber-500 text-slate-950 px-1 py-0.2 rounded font-extrabold tracking-wider uppercase">
                        Zajęty
                      </span>
                    )}
                  </div>

                  <div className="relative z-10 my-4 flex flex-col items-center justify-center">
                    <Truck className={`w-12 h-12 stroke-1 ${truck ? 'text-white' : 'text-slate-300'}`} />
                    {truck ? (
                      <div className="mt-3 space-y-1">
                        <span className="font-mono font-black text-xs text-amber-400 bg-white/10 px-2 py-0.5 rounded tracking-wider uppercase">
                          {truck.truckPlate}
                        </span>
                        <span className="block text-[10px] font-bold text-slate-300 truncate max-w-[110px]">{truck.carrierName}</span>
                        {truck.assignedPoId && (
                          <span className="block text-[9.5px] font-mono text-blue-400 bg-blue-950/40 border border-blue-900/60 px-1.5 py-0.2 rounded mt-1 inline-block">
                            {truck.assignedPoId}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 mt-2 font-medium select-none">WOLNE MIEJSCE</span>
                    )}
                  </div>

                  <div className="relative z-10 w-full">
                    {truck ? (
                      <button
                        onClick={() => setSelectedTruckForDocking(truck)}
                        className="w-full h-8 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-[10px] transition-colors cursor-pointer border-none shadow active:scale-[0.97]"
                      >
                        Kieruj do doku
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setManualCarrier('');
                          setManualPlate('');
                          setManualPoId('');
                          setIsManualArrivalOpen(true);
                        }}
                        className="w-full h-8 bg-white border border-slate-300 hover:bg-slate-200 text-slate-650 rounded font-bold text-[10px] transition-colors cursor-pointer"
                      >
                        Zamelduj
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Gate Entrance Queue */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between h-[360px]">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 border-b border-slate-100 pb-3 select-none">
              <Clock className="w-4.5 h-4.5 text-blue-600" />
              Kolejka przed Bramą Wjazdową
            </h3>
            
            <div className="overflow-y-auto max-h-[220px] space-y-3.5 pr-1 pt-1.5">
              {queueTrucks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center select-none bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  <span className="text-xs font-bold text-slate-700 mt-1.5">Brak aut przed bramą</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Plac YMS pracuje płynnie.</span>
                </div>
              ) : (
                queueTrucks.map(truck => (
                  <div 
                    key={truck.id} 
                    className="p-3 bg-amber-50/45 border border-amber-200 rounded-xl flex items-start justify-between gap-3 text-xs shadow-inner animate-in slide-in-from-right-2 duration-150"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-slate-900 bg-white border px-1.5 py-0.2 rounded uppercase">{truck.truckPlate}</span>
                        {truck.assignedPoId && <span className="font-mono text-[9px] text-blue-600 bg-blue-50 border px-1 rounded">{truck.assignedPoId}</span>}
                      </div>
                      <p className="font-sans font-bold text-slate-750">{truck.carrierName}</p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 self-center">
                      <button
                        onClick={() => handleAssignToParking(truck.id)}
                        disabled={!firstFreeParkingSlot}
                        className="h-7 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold cursor-pointer border-none shadow disabled:opacity-50 disabled:cursor-not-allowed"
                        title={firstFreeParkingSlot ? 'Wpuść na parking postojowy' : 'Brak wolnych miejsc parkingowych'}
                      >
                        Wpuść
                      </button>
                      <button
                        onClick={() => handleRemoveFromQueue(truck.id)}
                        className="h-7 w-7 border border-rose-200 text-rose-500 hover:bg-rose-50 rounded flex items-center justify-center cursor-pointer bg-white"
                        title="Odrzuć wjazd"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-[11px] leading-relaxed text-slate-500 select-none">
            <span className="font-bold text-slate-750 block mb-0.5">Symulacja YMS:</span> Nowe ciężarówki dojeżdżają pod bramę co 20-30 sekund. Wolne miejsca parkingowe są oznaczane jako zielone.
          </div>
        </div>

      </div>

      {/* Shared Docks Status Control Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 border-b border-slate-100 pb-3 select-none">
          <Truck className="w-4.5 h-4.5 text-blue-600" />
          Aktywne Dokowania (Doki Rozładunkowe D1 - D3)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {docks.map(dock => {
            const isOccupied = dock.status === 'Unloading';
            return (
              <div 
                key={dock.id} 
                className={`border rounded-xl p-4 flex items-center justify-between shadow-xs ${
                  isOccupied ? 'bg-blue-50/20 border-blue-300' : 'bg-slate-50/50 border-slate-200 border-dashed'
                }`}
              >
                <div className="space-y-1 min-w-0">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase font-mono">{dock.id}</span>
                  <h4 className="text-xs font-bold text-slate-900">{dock.name}</h4>
                  {isOccupied ? (
                    <div className="space-y-0.5">
                      <span className="font-mono font-bold text-blue-650 bg-blue-50 px-1 rounded block w-max text-[10px] uppercase">
                        {dock.truckPlate} ({dock.carrierName})
                      </span>
                      {dock.assignedPoId && (
                        <span className="text-[9.5px] text-slate-450 block font-mono">PO-ID: {dock.assignedPoId}</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[10.5px] text-slate-400 italic block">Brak aktywnego rozładunku</span>
                  )}
                </div>

                {isOccupied && (
                  <button
                    onClick={() => handleDepartFromDepartModal(dock.id)}
                    className="h-7 px-3 border border-rose-300 hover:bg-rose-50 text-rose-600 rounded text-[10px] font-bold cursor-pointer bg-white whitespace-nowrap"
                  >
                    Odpraw pojazd
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal: Direct Truck to Dock */}
      {selectedTruckForDocking && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-[9px] font-extrabold text-blue-650 uppercase tracking-widest block">Direct Truck to Dock Gate</span>
                <h3 className="text-base font-extrabold text-slate-900">Dysponowanie dokowania: {selectedTruckForDocking.truckPlate}</h3>
              </div>
              <button 
                onClick={() => setSelectedTruckForDocking(null)}
                className="text-slate-400 hover:text-slate-600 text-lg border-none bg-transparent cursor-pointer font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <p className="font-sans font-bold text-slate-700">Wybierz bramę rozładunkową (Dok) dla pojazdu:</p>
              
              <div className="space-y-2">
                {docks.map(dock => {
                  const isBusy = dock.status === 'Unloading';
                  return (
                    <button
                      key={dock.id}
                      onClick={() => handleConfirmDocking(dock.id)}
                      disabled={isBusy}
                      className={`w-full p-3 border rounded-xl flex items-center justify-between text-left transition-all ${
                        isBusy 
                          ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-60' 
                          : 'bg-white border-slate-250 hover:bg-blue-50/50 hover:border-blue-400 text-slate-800 cursor-pointer'
                      }`}
                    >
                      <div>
                        <span className="font-bold block text-slate-900">{dock.name}</span>
                        <span className="text-[10px] text-slate-450 font-mono">Brama {dock.id}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${
                        isBusy ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      }`}>
                        {isBusy ? 'ZAJĘTA' : 'WOLNA'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedTruckForDocking(null)}
                className="h-9 px-4 border border-slate-300 hover:bg-slate-50 text-slate-650 rounded-lg font-bold text-xs cursor-pointer bg-white"
              >
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Manual Arrival Registration */}
      {isManualArrivalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 animate-fadeIn">
          <form onSubmit={handleManualArrivalSubmit} className="bg-white rounded-2xl max-w-md w-full border border-slate-200 p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-[9px] font-extrabold text-blue-650 uppercase block">Manual Gate Registration</span>
                <h3 className="text-base font-extrabold text-slate-900">Ręczna rejestracja przyjazdu</h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsManualArrivalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg border-none bg-transparent cursor-pointer font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold uppercase text-[9px] mb-1">Nazwa Przewoźnika / Spedytor</label>
                <input
                  type="text"
                  required
                  value={manualCarrier}
                  onChange={e => setManualCarrier(e.target.value)}
                  placeholder="np. Raben, DHL, Kurier"
                  className="w-full p-2 border border-slate-250 rounded-lg text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-805"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold uppercase text-[9px] mb-1">Numer Rejestracyjny Ciężarówki</label>
                <input
                  type="text"
                  required
                  value={manualPlate}
                  onChange={e => setManualPlate(e.target.value)}
                  placeholder="np. WI 9812A, WA 77221"
                  className="w-full p-2 border border-slate-250 rounded-lg text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 uppercase font-mono text-slate-805"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold uppercase text-[9px] mb-1">Powiązane PO-ID (Zlecenie dostawy, Opcjonalnie)</label>
                <select
                  value={manualPoId}
                  onChange={e => setManualPoId(e.target.value)}
                  className="w-full p-2 border border-slate-250 rounded-lg text-xs outline-none bg-white text-slate-800"
                >
                  <option value="">Brak powiązanego PO (Dostawa ogólna)</option>
                  {purchaseOrders.filter(po => po.status === 'Pending').map(po => (
                    <option key={po.id} value={po.id}>{po.id} - {po.vendorName}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsManualArrivalOpen(false)}
                className="h-9 px-4 border border-slate-300 hover:bg-slate-50 text-slate-650 rounded-lg font-bold text-xs cursor-pointer bg-white"
              >
                Anuluj
              </button>
              <button
                type="submit"
                className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs cursor-pointer border-none shadow active:scale-[0.98]"
              >
                Zarejestruj przyjazd
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );

  // Helper helper to bypass click warning
  function handleDepartFromDepartModal(dockId: string) {
    if (confirm("Czy na pewno chcesz odprawić ciężarówkę i zwolnić tę bramę dokową?")) {
      handleDepartFromDock(dockId);
    }
  }
}
