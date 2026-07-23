import React, { useState, useEffect, useMemo } from 'react';
import { 
  Truck, Printer, Boxes, CheckCircle2, AlertTriangle, 
  Key, Search, Clock, ArrowRight, Package, LayoutGrid, AlertCircle
} from 'lucide-react';
import { Product } from '../../services/inventoryApi';

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

interface InboundPlannerProps {
  purchaseOrders: PurchaseOrder[];
  products: Product[];
  zones: any[];
  onUpdateStock: (sku: string, delta: number) => Promise<boolean>;
  onUpdatePurchaseOrder: (poId: string, updatedFields: Partial<PurchaseOrder>) => void;
  logActivity: (msg: string, type: string, details?: string) => void;
  addToast: (title: string, text: string, type: 'error' | 'warning' | 'info' | 'success') => void;
  docks: Dock[];
  setDocks: React.Dispatch<React.SetStateAction<Dock[]>>;
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

export default function InboundPlanner({
  purchaseOrders = [],
  products = [],
  zones = [],
  onUpdateStock,
  onUpdatePurchaseOrder,
  logActivity,
  addToast,
  docks = [],
  setDocks
}: InboundPlannerProps) {
  // State of locked slots from Storage.tsx config
  const [lockedSlots] = useState<string[]>(() => {
    try {
      const saved = window.localStorage.getItem('wms-locked-slots');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modals and Wizard state
  const [selectedPoForDock, setSelectedPoForDock] = useState<PurchaseOrder | null>(null);
  const [activeDockForAssign, setActiveDockForAssign] = useState<string | null>(null);
  const [activeDockForUnload, setActiveDockForUnload] = useState<Dock | null>(null);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);

  // Wizard form data
  const [receivedQtyMap, setReceivedQtyMap] = useState<Record<string, number>>({});
  const [carrierInput, setCarrierInput] = useState('');
  const [plateInput, setPlateInput] = useState('');
  const [customSlotsMap, setCustomSlotsMap] = useState<Record<string, string>>({}); // Overridden slots

  // Putaway recommendations calculation state
  const [putawayRecommendations, setPutawayRecommendations] = useState<Array<{
    sku: string;
    name: string;
    qty: number;
    recommendedSlot: string; // e.g. A-01-01-02-01
    reason: string;
  }>>([]);

  const pendingPOs = useMemo(() => {
    return purchaseOrders.filter(po => po.status === 'Pending');
  }, [purchaseOrders]);

  const activeDocksCount = useMemo(() => {
    return docks.filter(d => d.status === 'Unloading').length;
  }, [docks]);

  // Parse location helper
  const parseLocation = (locationCode: string) => {
    const match = String(locationCode || '').match(/^([A-Z]+)-(\d+)-(\d+)-(\d+)$/i);
    if (!match) return { sector: '', aisle: 1, rack: 1, level: 1 };
    return {
      sector: match[1].toUpperCase(),
      aisle: Number(match[2]),
      rack: Number(match[3]),
      level: Number(match[4])
    };
  };

  // Recommends slot for a given SKU and category
  const getRecommendedSlot = (sku: string, category: string): { slot: string; reason: string } => {
    // 1. Determine recommended zone group
    const catNorm = (category || '').toLowerCase();
    let targetSector = 'A'; // default Ambient
    let targetAisle = 1;
    let sectorName = 'Ambient (Żywność)';

    if (catNorm.includes('tech') || catNorm.includes('biur') || catNorm.includes('elektronik') || catNorm.includes('papier')) {
      targetSector = 'B';
      sectorName = 'Tech/Biuro (Suche)';
    } else if (catNorm.includes('chem') || catNorm.includes('auto') || catNorm.includes('częśc') || catNorm.includes('bhp')) {
      targetSector = 'C';
      sectorName = 'Hazmat (Motoryzacja / Chemia)';
    }

    // List of possible slots in target zone
    // Standard layouts: 2 racks, 4 levels, 3 slots per level
    const candidates: Array<{ slot: string; type: 'matching_sku' | 'empty' | 'fallback'; details: string }> = [];

    for (let aisleNum = 1; aisleNum <= 2; aisleNum++) {
      for (let rackNum = 1; rackNum <= 2; rackNum++) {
        for (let levelNum = 1; levelNum <= 4; levelNum++) {
          for (let slotNum = 1; slotNum <= 3; slotNum++) {
            const slotCode = `${targetSector}-0${aisleNum}-0${rackNum}-0${levelNum}-0${slotNum}`;

            // Check if slot is locked (BHP)
            if (lockedSlots.includes(slotCode)) continue;

            // Check what is currently in this slot based on products location code
            const existingProduct = products.find(p => {
              const loc = parseLocation(p.locationCode);
              const isSameZone = p.zone === `${targetSector}${aisleNum}`;
              const slotIndex = (p.sku.charCodeAt(p.sku.length - 1) % 3) + 1;
              return isSameZone && loc.rack === rackNum && loc.level === levelNum && slotIndex === slotNum;
            });

            if (existingProduct) {
              if (existingProduct.sku === sku) {
                candidates.push({
                  slot: slotCode,
                  type: 'matching_sku',
                  details: `Istniejący stock SKU: ${sku} (konsolidacja)`
                });
              }
            } else {
              candidates.push({
                slot: slotCode,
                type: 'empty',
                details: `Puste gniazdo w strefie ${sectorName}`
              });
            }
          }
        }
      }
    }

    // Sort: matching_sku first, then empty
    const bestMatching = candidates.find(c => c.type === 'matching_sku');
    if (bestMatching) {
      return { slot: bestMatching.slot, reason: bestMatching.details };
    }

    const bestEmpty = candidates.find(c => c.type === 'empty');
    if (bestEmpty) {
      return { slot: bestEmpty.slot, reason: bestEmpty.details };
    }

    // Fallback if all are filled or locked
    // Try other zones
    const alternateSector = targetSector === 'A' ? 'B' : 'A';
    const fallbackCode = `${alternateSector}-01-01-01-01`;
    return {
      slot: fallbackCode,
      reason: 'Brak wolnych gniazd w strefie dedykowanej - przydział strefy zapasowej'
    };
  };

  // Open assign PO to dock modal
  const startAssignPoToDock = (po: PurchaseOrder) => {
    setSelectedPoForDock(po);
    // Find first free dock
    const free = docks.find(d => d.status === 'Free');
    setActiveDockForAssign(free ? free.id : docks[0].id);
  };

  const handleConfirmAssign = () => {
    if (!selectedPoForDock || !activeDockForAssign) return;

    setDocks(prev => prev.map(d => {
      if (d.id === activeDockForAssign) {
        return {
          ...d,
          status: 'Unloading',
          assignedPoId: selectedPoForDock.id,
          carrierName: carrierInput || 'Dostawca Lokalny',
          truckPlate: plateInput || 'REJ-WYBRANY',
        };
      }
      return d;
    }));

    // Update PO notes/status to indicate it is at dock
    onUpdatePurchaseOrder(selectedPoForDock.id, {
      internalNotes: `${selectedPoForDock.internalNotes || ''}\n[DOK]: Pojazd podstawiony pod ${activeDockForAssign}. Rozładunek w toku.`
    });

    logActivity(`Pojazd dostawcy z PO ${selectedPoForDock.id} podstawiony pod Dok ${activeDockForAssign}`, 'info', `Przewoźnik: ${carrierInput || 'Dostawca'}, Blachy: ${plateInput || 'brak'}`);
    addToast('Pojazd podstawiony', `Rozpoczęto obsługę PO ${selectedPoForDock.id} w doku ${activeDockForAssign}`, 'success');

    // Reset inputs
    setSelectedPoForDock(null);
    setActiveDockForAssign(null);
    setCarrierInput('');
    setPlateInput('');
  };

  // Start putaway wizard
  const startPutawayWizard = (dock: Dock) => {
    const po = purchaseOrders.find(p => p.id === dock.assignedPoId);
    if (!po) return;

    setActiveDockForUnload(dock);
    setWizardStep(1);

    // Initializing quantities map
    const qMap: Record<string, number> = {};
    po.items.forEach(item => {
      qMap[item.sku] = item.qtyOrdered;
    });
    setReceivedQtyMap(qMap);

    // Initializing recommendations
    const recs = po.items.map(item => {
      const prod = products.find(p => p.sku === item.sku);
      const cat = prod ? prod.category : 'Żywność';
      const rec = getRecommendedSlot(item.sku, cat);
      return {
        sku: item.sku,
        name: item.name,
        qty: item.qtyOrdered,
        recommendedSlot: rec.slot,
        reason: rec.reason
      };
    });
    setPutawayRecommendations(recs);
    setCustomSlotsMap({});
  };

  // Step transitions
  const handleWizardNext = () => {
    if (wizardStep === 1) {
      // Re-calculate recommendations with entered quantities
      setPutawayRecommendations(prev => prev.map(rec => ({
        ...rec,
        qty: receivedQtyMap[rec.sku] || 0
      })));
      setWizardStep(2);
    } else if (wizardStep === 2) {
      setWizardStep(3);
    }
  };

  // Cancel dock unloading / reset dock
  const handleFreeDock = (dockId: string) => {
    setDocks(prev => prev.map(d => {
      if (d.id === dockId) {
        return { id: d.id, name: d.name, status: 'Free' };
      }
      return d;
    }));
    addToast('Dok zwolniony', `Dok ${dockId} został zwolniony i jest gotowy na przyjęcie kolejnego pojazdu.`, 'info');
  };

  // Execute putaway (Commit stock updates)
  const handleConfirmPutaway = async () => {
    if (!activeDockForUnload) return;

    const poId = activeDockForUnload.assignedPoId;
    if (!poId) return;

    let success = true;
    const putawayDetails: string[] = [];

    for (const rec of putawayRecommendations) {
      const qty = rec.qty;
      const finalSlot = customSlotsMap[rec.sku] || rec.recommendedSlot;
      if (qty <= 0) continue;

      // Update backend / local storage stock
      const res = await onUpdateStock(rec.sku, qty);
      if (!res) success = false;
      putawayDetails.push(`${qty}x ${rec.sku} do ${finalSlot}`);
    }

    if (success) {
      // Update PO status to Completed
      onUpdatePurchaseOrder(poId, {
        status: 'Completed',
        internalNotes: `Zatwierdzono rozładunek i rozlokowanie. Dok: ${activeDockForUnload.id}. Zaksięgowano stany.`
      });

      // Reset dock status to Free
      setDocks(prev => prev.map(d => {
        if (d.id === activeDockForUnload.id) {
          return { id: d.id, name: d.name, status: 'Free' };
        }
        return d;
      }));

      logActivity(`Rozładunek i putaway zakończone dla PO ${poId}`, 'success', `Rozlokowano: ${putawayDetails.join(', ')}`);
      addToast('Przyjęcie zakończone', `Pomyślnie przyjęto towary z PO ${poId}. Stany magazynowe zostały powiększone.`, 'success');
      setActiveDockForUnload(null);
    } else {
      addToast('Błąd zapisu', 'Wystąpił problem przy aktualizowaniu stanów magazynowych w systemie.', 'error');
    }
  };

  // Single slip printing
  const handlePrintPutawaySlip = () => {
    window.print();
  };

  return (
    <div id="wms-inbound-panel" className="space-y-6 font-sans text-sm text-[#334155] animate-fadeIn pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
            <Boxes className="w-5.5 h-5.5 text-blue-600 animate-pulse" /> Planowanie Przyjęć & Doki (Inbound Planner)
          </h2>
          <p className="text-xs text-slate-500 mt-1.5 max-w-xl font-sans">
            Centrum koordynacji bram rozładunkowych. Monitoruj podjazdy dostawców, rejestruj pojazdy, weryfikuj dostawy oraz automatycznie optymalizuj rozlokowanie towarów (Putaway) w strefach magazynowych.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 select-none">
        <div className="bg-[#0f172a] text-white p-4 rounded-xl border border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">Liczba Doków Bramowych</span>
          <div className="text-2xl font-black mt-2 font-sans">3 <span className="text-xs font-normal text-zinc-500">dostępne</span></div>
          <div className="text-[9px] text-zinc-500 mt-1 font-mono">D1, D2, D3</div>
        </div>
        <div className="bg-blue-50/65 p-4 rounded-xl border border-blue-250 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] text-blue-650 font-extrabold uppercase tracking-wider">Aktywne rozładunki</span>
          <div className="text-2xl font-black mt-2 text-blue-950 font-sans">{activeDocksCount}</div>
          <div className="text-[9px] text-blue-550 mt-1">Ciężarówki przy bramach</div>
        </div>
        <div className="bg-amber-50/65 p-4 rounded-xl border border-amber-250 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] text-amber-600 font-extrabold uppercase tracking-wider">Awizacje i PO Pending</span>
          <div className="text-2xl font-black mt-2 text-amber-950 font-sans">{pendingPOs.length}</div>
          <div className="text-[9px] text-amber-500 mt-1">Dostawy do obsłużenia</div>
        </div>
        <div className="bg-emerald-50/65 p-4 rounded-xl border border-emerald-250 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] text-emerald-600 font-extrabold uppercase tracking-wider">Zablokowane Gniazda (BHP)</span>
          <div className="text-2xl font-black mt-2 text-emerald-950 font-sans">{lockedSlots.length}</div>
          <div className="text-[9px] text-emerald-500 mt-1">Wyłączone z algorytmu</div>
        </div>
      </div>

      {/* Visual Docks Layout */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 border-b border-slate-100 pb-3">
          <LayoutGrid className="w-4.5 h-4.5 text-blue-600" />
          Status Bram i Doków Rozładunkowych
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {docks.map(dock => {
            const hasPo = !!dock.assignedPoId;
            return (
              <div 
                key={dock.id} 
                className={`border rounded-2xl p-5 shadow-inner transition-all flex flex-col justify-between relative overflow-hidden h-[240px] ${
                  dock.status === 'Unloading' 
                    ? 'bg-blue-50/20 border-blue-500 ring-2 ring-blue-500/20' 
                    : dock.status === 'Reserved'
                    ? 'bg-amber-50/30 border-amber-400'
                    : 'bg-slate-50/40 border-slate-200 border-dashed hover:bg-slate-50'
                }`}
              >
                {/* Visual design element: dock line */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-200">
                  {dock.status === 'Unloading' && <div className="h-full bg-blue-600 animate-pulse w-full" />}
                  {dock.status === 'Reserved' && <div className="h-full bg-amber-500 w-full" />}
                </div>

                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-slate-400 font-extrabold tracking-wider block uppercase">{dock.id}</span>
                    <h4 className="text-sm font-bold text-slate-900 mt-0.5">{dock.name}</h4>
                  </div>
                  
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${
                    dock.status === 'Unloading' 
                      ? 'bg-blue-100 text-blue-800 border-blue-200 animate-pulse'
                      : dock.status === 'Reserved'
                      ? 'bg-amber-100 text-amber-800 border-amber-200'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}>
                    {dock.status === 'Unloading' ? '🚚 ROZŁADUNEK' : dock.status === 'Reserved' ? '🕒 REZERWACJA' : '🟢 WOLNY'}
                  </span>
                </div>

                {/* Dock content */}
                <div className="my-4 space-y-1">
                  {dock.status === 'Free' ? (
                    <div className="flex flex-col items-center justify-center py-4 text-center">
                      <Truck className="w-8 h-8 text-slate-350 stroke-1" />
                      <span className="text-xs text-slate-400 mt-1.5">Brak pojazdu przy bramie</span>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-1">
                        <span className="text-slate-400">Pojazd / Kierowca:</span>
                        <span className="font-bold text-slate-700">{dock.carrierName}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-1">
                        <span className="text-slate-400">Blachy:</span>
                        <span className="font-mono font-bold text-slate-800">{dock.truckPlate}</span>
                      </div>
                      {dock.assignedPoId ? (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Dokument PO:</span>
                          <span className="font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{dock.assignedPoId}</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">ETA (Planowana):</span>
                          <span className="font-bold text-amber-700 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {dock.eta}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-2 w-full">
                  {dock.status === 'Free' ? (
                    <button
                      onClick={() => {
                        setActiveDockForAssign(dock.id);
                        if (pendingPOs.length > 0) {
                          setSelectedPoForDock(pendingPOs[0]);
                        }
                      }}
                      className="w-full h-8 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded font-bold text-[10px] transition-colors cursor-pointer flex items-center justify-center gap-1"
                    >
                      Podstaw Pojazd
                    </button>
                  ) : dock.status === 'Reserved' ? (
                    <>
                      <button
                        onClick={() => {
                          setDocks(prev => prev.map(d => {
                            if (d.id === dock.id) {
                              return {
                                ...d,
                                status: 'Unloading',
                                assignedPoId: pendingPOs[0]?.id
                              };
                            }
                            return d;
                          }));
                          if (pendingPOs[0]) {
                            onUpdatePurchaseOrder(pendingPOs[0].id, {
                              internalNotes: `Pojazd ${dock.truckPlate} zameldowany i podstawiony pod bramę ${dock.id}.`
                            });
                          }
                        }}
                        className="flex-1 h-8 bg-blue-600 hover:bg-blue-755 text-white rounded font-bold text-[10px] transition-colors cursor-pointer border-none"
                      >
                        Zamelduj w doku
                      </button>
                      <button
                        onClick={() => handleFreeDock(dock.id)}
                        className="px-2 h-8 border border-rose-300 hover:bg-rose-50 text-rose-600 rounded font-bold text-[10px] cursor-pointer bg-white"
                        title="Zwolnij bramę"
                      >
                        X
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startPutawayWizard(dock)}
                        className="flex-1 h-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[10px] transition-all cursor-pointer border-none flex items-center justify-center gap-1 shadow-sm active:scale-[0.98]"
                      >
                        Rozpocznij Putaway
                      </button>
                      <button
                        onClick={() => handleFreeDock(dock.id)}
                        className="px-2 h-8 border border-slate-350 hover:bg-slate-100 text-slate-500 rounded font-bold text-[10px] cursor-pointer bg-white"
                        title="Anuluj i zwolnij"
                      >
                        X
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pending Deliveries Queue */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
            <Clock className="w-4.5 h-4.5 text-blue-600" />
            Kolejka Awizowanych Dostaw (PO Pending)
          </h3>
          <p className="text-xs text-slate-500 mt-1 font-sans">
            Wykaz zapotrzebowań w drodze od dostawców. Podstaw oczekujące pojazdy pod wolne bramy w celu rozpoczęcia operacji magazynowych.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 text-[10.5px] font-extrabold uppercase select-none">
                <th className="py-2.5 px-3">Kod PO-ID</th>
                <th className="py-2.5 px-3">Dostawca</th>
                <th className="py-2.5 px-3">Spodziewany rozładunek</th>
                <th className="py-2.5 px-3">Towary / Sztuki</th>
                <th className="py-2.5 px-3 text-right">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {pendingPOs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-455 italic bg-slate-50/50 rounded-b-xl border border-dashed border-slate-200 mt-2">
                    Brak oczekujących dostaw. Wszystkie zapotrzebowania zostały rozładowane lub anulowane.
                  </td>
                </tr>
              ) : (
                pendingPOs.map(po => {
                  const totalQty = po.items.reduce((acc, i) => acc + i.qtyOrdered, 0);
                  const isAssigned = docks.some(d => d.assignedPoId === po.id);
                  return (
                    <tr key={po.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors text-xs font-semibold">
                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">{po.id}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-800 font-sans">{po.vendorName}</td>
                      <td className="py-3 px-3 text-slate-500 font-mono font-medium">{po.expectedDeliveryDate}</td>
                      <td className="py-3 px-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-slate-850 font-bold font-sans">{po.items[0]?.name} {po.items.length > 1 && `+ ${po.items.length - 1} inne`}</span>
                          <span className="text-[10px] text-slate-400 font-mono">Suma: {totalQty} szt.</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {isAssigned ? (
                          <span className="text-[10px] text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full font-extrabold uppercase select-none">
                            W Doku
                          </span>
                        ) : (
                          <button
                            onClick={() => startAssignPoToDock(po)}
                            className="h-7 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold cursor-pointer transition-colors border-none"
                          >
                            Brama/Podstaw pojazd
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Assign PO to Dock */}
      {selectedPoForDock && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-[9px] font-extrabold text-slate-450 uppercase block">Inbound Gate Assignment</span>
                <h3 className="text-base font-extrabold text-slate-900">Podstawienie pojazdu: PO {selectedPoForDock.id}</h3>
              </div>
              <button 
                onClick={() => setSelectedPoForDock(null)}
                className="text-slate-400 hover:text-slate-600 text-lg border-none bg-transparent cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold uppercase text-[9px] mb-1">Wybierz Dok Rozładowywania</label>
                <select
                  value={activeDockForAssign || ''}
                  onChange={e => setActiveDockForAssign(e.target.value)}
                  className="w-full p-2 border border-slate-250 rounded-lg text-xs outline-none bg-white font-semibold text-slate-800"
                >
                  {docks.map(d => (
                    <option key={d.id} value={d.id} disabled={d.status === 'Unloading'}>
                      {d.name} {d.status === 'Unloading' ? '(Zajęty)' : d.status === 'Reserved' ? '(Zarezerwowany)' : '(Wolny)'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold uppercase text-[9px] mb-1">Przewoźnik / Kierowca</label>
                <input
                  type="text"
                  value={carrierInput}
                  onChange={e => setCarrierInput(e.target.value)}
                  placeholder="np. DHL, Raben, Kierowca własny"
                  className="w-full p-2 border border-slate-250 rounded-lg text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold uppercase text-[9px] mb-1">Numer Rejestracyjny Pojazdu</label>
                <input
                  type="text"
                  value={plateInput}
                  onChange={e => setPlateInput(e.target.value)}
                  placeholder="np. WI 98765, WA 1122AA"
                  className="w-full p-2 border border-slate-250 rounded-lg text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-800 uppercase font-mono"
                />
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-[11px] leading-relaxed text-slate-550 select-none">
                <span className="font-bold text-slate-700 block mb-0.5">Dane Awizacyjne PO:</span>
                Dostawca: <span className="font-bold text-slate-850">{selectedPoForDock.vendorName}</span><br />
                Ilość pozycji: <span className="font-bold text-slate-850">{selectedPoForDock.items.length} asortymentów</span>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedPoForDock(null)}
                className="h-9 px-4 border border-slate-300 hover:bg-slate-50 text-slate-650 rounded-lg font-bold text-xs cursor-pointer bg-white"
              >
                Anuluj
              </button>
              <button
                onClick={handleConfirmAssign}
                className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs cursor-pointer border-none shadow active:scale-[0.98]"
              >
                Potwierdź podstawienie
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal / Wizard: Putaway Wizard */}
      {activeDockForUnload && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 animate-fadeIn print:absolute print:inset-0 print:bg-white print:p-0">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 p-6 shadow-2xl space-y-4 print:border-none print:shadow-none print:w-full print:max-w-none">
            
            {/* Header print hide */}
            <div className="flex justify-between items-center border-b border-slate-150 pb-3 print:hidden">
              <div>
                <span className="text-[9px] font-extrabold text-blue-600 uppercase tracking-widest block">Inbound Putaway Manager</span>
                <h3 className="text-base font-extrabold text-slate-900">
                  Rozładunek & Putaway: Dok {activeDockForUnload.id} ({activeDockForUnload.assignedPoId})
                </h3>
              </div>
              <button
                onClick={() => setActiveDockForUnload(null)}
                className="text-slate-400 hover:text-slate-600 text-lg border-none bg-transparent cursor-pointer font-bold"
              >
                ×
              </button>
            </div>

            {/* Steps indicator print hide */}
            <div className="flex justify-between items-center bg-slate-50 border border-slate-200 rounded-lg p-2.5 select-none print:hidden">
              <div className="flex items-center gap-1.5">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                  wizardStep >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
                }`}>1</span>
                <span className={`text-[10px] font-bold ${wizardStep === 1 ? 'text-blue-650' : 'text-slate-500'}`}>Weryfikacja ilości</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-355" />
              <div className="flex items-center gap-1.5">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                  wizardStep >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
                }`}>2</span>
                <span className={`text-[10px] font-bold ${wizardStep === 2 ? 'text-blue-650' : 'text-slate-500'}`}>Rekomendacja gniazd</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-355" />
              <div className="flex items-center gap-1.5">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                  wizardStep >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
                }`}>3</span>
                <span className={`text-[10px] font-bold ${wizardStep === 3 ? 'text-blue-650' : 'text-slate-500'}`}>Karta Rozlokowania</span>
              </div>
            </div>

            {/* Step 1 Content: Quantity Verification */}
            {wizardStep === 1 && (
              <div className="space-y-4 print:hidden">
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-inner bg-slate-50/20 max-h-[250px] overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-500 text-[10px] font-extrabold uppercase border-b border-slate-200">
                        <th className="py-2 px-3">SKU</th>
                        <th className="py-2 px-3">Nazwa towaru</th>
                        <th className="py-2 px-3 text-center">Zamówiono (PO)</th>
                        <th className="py-2 px-3 text-right">Odebrano (Fizycznie)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {putawayRecommendations.map(item => {
                        const receivedQty = receivedQtyMap[item.sku] ?? item.qty;
                        const hasDiscrepancy = receivedQty !== item.qty;
                        
                        return (
                          <tr 
                            key={item.sku} 
                            className={`border-b border-slate-150 transition-colors ${
                              hasDiscrepancy 
                                ? 'bg-red-50/70 dark:bg-red-950/20 text-red-900 dark:text-red-200 font-semibold' 
                                : 'hover:bg-slate-50/50 dark:hover:bg-slate-850/30'
                            }`}
                          >
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-slate-800">{item.sku}</span>
                                {hasDiscrepancy && (
                                  <span className="bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 select-none border border-red-250 dark:border-red-800">
                                    <AlertTriangle className="w-3 h-3 text-red-500" />
                                    Rozbieżność
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 font-medium text-slate-700 truncate max-w-[200px]">{item.name}</td>
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-505">{item.qty} szt.</td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {hasDiscrepancy && (
                                  <span className="text-[10px] font-bold font-mono text-red-600 dark:text-red-400">
                                    {receivedQty - item.qty > 0 ? `+${receivedQty - item.qty}` : receivedQty - item.qty} szt.
                                  </span>
                                )}
                                <input
                                  type="number"
                                  min="0"
                                  value={receivedQtyMap[item.sku] ?? item.qty}
                                  onChange={e => setReceivedQtyMap(prev => ({
                                    ...prev,
                                    [item.sku]: Math.max(0, Number(e.target.value))
                                  }))}
                                  className={`w-20 p-1 border rounded text-right font-mono font-bold outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 ${
                                    hasDiscrepancy 
                                      ? 'border-red-300 dark:border-red-800 focus:border-red-500 focus:ring-red-500 bg-red-50/50 dark:bg-red-900/20' 
                                      : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500'
                                  }`}
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="bg-amber-50 border border-amber-250 text-amber-900 p-3 rounded-lg flex items-start gap-2 text-[11px] leading-relaxed">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Wskazówka BHP dla operatora rozładunku:</span> Zweryfikuj fizyczne plomby na naczepie przed potwierdzeniem ilości. Różnice między specyfikacją PO a dostawą zostaną zapisane w logu.
                  </div>
                </div>
              </div>
            )}

            {/* Step 2 Content: Slot Recommendations */}
            {wizardStep === 2 && (
              <div className="space-y-4 print:hidden">
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-inner bg-slate-50/20 max-h-[250px] overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-500 text-[10px] font-extrabold uppercase border-b border-slate-200">
                        <th className="py-2 px-3">SKU</th>
                        <th className="py-2 px-3">Rekomendowane Gniazdo</th>
                        <th className="py-2 px-3">Kryterium algorytmu</th>
                        <th className="py-2 px-3 text-right">Nadpisz adres</th>
                      </tr>
                    </thead>
                    <tbody>
                      {putawayRecommendations.map(rec => {
                        const finalSlot = customSlotsMap[rec.sku] || rec.recommendedSlot;
                        return (
                          <tr key={rec.sku} className="border-b border-slate-150">
                            <td className="py-2.5 px-3">
                              <span className="font-mono font-bold text-slate-800 block">{rec.sku}</span>
                              <span className="text-[10px] text-slate-450 block font-medium truncate max-w-[150px]">{rec.name}</span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="font-mono font-black text-blue-650 bg-blue-50/60 border border-blue-200 px-2 py-0.5 rounded text-[11.5px] tracking-wide">
                                {finalSlot}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-505 font-sans font-medium text-[10.5px]">
                              {rec.reason}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <input
                                type="text"
                                placeholder="Nadpisz, np. A-01-01-02-03"
                                value={customSlotsMap[rec.sku] || ''}
                                onChange={e => setCustomSlotsMap(prev => ({
                                  ...prev,
                                  [rec.sku]: e.target.value
                                }))}
                                className="w-36 p-1 border border-slate-300 rounded text-center font-mono text-[10.5px] outline-none focus:border-blue-500 text-slate-850"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="bg-blue-50 border border-blue-250 text-blue-900 p-3 rounded-lg flex items-start gap-2 text-[11px] leading-relaxed select-none">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Algorytm Dynamic Slotting:</span> Rekomendacje wykluczyły {lockedSlots.length} lokalizacji oznaczonych jako zablokowane (BHP) w localStorage, chroniąc przed alokacją na uszkodzonych półkach.
                  </div>
                </div>
              </div>
            )}

            {/* Step 3 Content: Putaway Slip Printing Preview */}
            {wizardStep === 3 && (
              <div className="space-y-4">
                
                {/* Print layout representation */}
                <div id="printable-putaway-slip" className="border border-slate-400 bg-white p-6 rounded-xl shadow-xs text-zinc-950 font-sans print:border-none print:shadow-none print:p-0">
                  <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3 mb-4">
                    <div>
                      <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest block">Logistics OS - Inbound Operations</span>
                      <h4 className="text-lg font-black text-slate-900 font-sans mt-0.5">KARTA ROZLOKOWANIA (PUTAWAY SLIP)</h4>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-slate-800 bg-zinc-100 border px-2 py-0.5 rounded">{activeDockForUnload.assignedPoId}</span>
                      <span className="text-[9px] text-zinc-500 block font-medium mt-1">Wygenerowano: {new Date().toLocaleDateString('pl-PL')}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs border-b border-dashed border-zinc-200 pb-3 mb-4 select-none">
                    <div>
                      <span className="text-[9px] text-zinc-400 uppercase font-bold block">Dok bramowy</span>
                      <span className="font-bold text-zinc-800">{activeDockForUnload.name} ({activeDockForUnload.id})</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-zinc-400 uppercase font-bold block">Pojazd dostawcy</span>
                      <span className="font-bold text-zinc-800">{activeDockForUnload.carrierName} ({activeDockForUnload.truckPlate})</span>
                    </div>
                  </div>

                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b-2 border-slate-900 text-zinc-650 text-[10px] font-extrabold uppercase bg-zinc-50">
                        <th className="py-2 px-2">SKU</th>
                        <th className="py-2 px-2">Nazwa produktu</th>
                        <th className="py-2 px-2 text-center">Ilość przyjęta</th>
                        <th className="py-2 px-2 text-right">Adres docelowy</th>
                        <th className="py-2 px-2 text-right print:hidden">Kod QR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {putawayRecommendations.map(rec => {
                        const finalQty = receivedQtyMap[rec.sku] ?? rec.qty;
                        const finalSlot = customSlotsMap[rec.sku] || rec.recommendedSlot;
                        if (finalQty <= 0) return null;
                        
                        return (
                          <tr key={rec.sku} className="border-b border-zinc-200 font-semibold font-mono text-[11px]">
                            <td className="py-2.5 px-2 font-bold text-zinc-900">{rec.sku}</td>
                            <td className="py-2.5 px-2 font-sans font-medium text-zinc-600 truncate max-w-[150px]">{rec.name}</td>
                            <td className="py-2.5 px-2 text-center font-bold text-zinc-800">{finalQty} szt.</td>
                            <td className="py-2.5 px-2 text-right font-black text-blue-700 text-xs">{finalSlot}</td>
                            <td className="py-2.5 px-2 text-right print:hidden">
                              <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=45x45&data=${encodeURIComponent(finalSlot)}`} 
                                alt="QR"
                                className="w-7 h-7 inline-block border border-zinc-200 rounded"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  <div className="mt-8 flex justify-between items-end border-t border-zinc-200 pt-6 select-none">
                    <div className="w-48 border-t border-zinc-400 text-center text-[9px] text-zinc-400 font-bold uppercase pt-1">
                      Podpis magazyniera
                    </div>
                    <div className="w-48 border-t border-zinc-400 text-center text-[9px] text-zinc-400 font-bold uppercase pt-1">
                      Podpis weryfikatora (Admin)
                    </div>
                  </div>
                </div>

                {/* Print button */}
                <div className="flex justify-center print:hidden select-none">
                  <button
                    onClick={handlePrintPutawaySlip}
                    className="h-8.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5 border-none shadow active:scale-[0.98]"
                  >
                    <Printer className="w-4 h-4" /> Drukuj Kartę Rozlokowania
                  </button>
                </div>
              </div>
            )}

            {/* Footer / Buttons print hide */}
            <div className="flex gap-3 justify-end pt-3 border-t border-slate-100 print:hidden select-none">
              {wizardStep > 1 && (
                <button
                  onClick={() => setWizardStep(prev => (prev - 1) as any)}
                  className="h-9 px-4 border border-slate-300 hover:bg-slate-50 text-slate-650 rounded-lg font-bold text-xs cursor-pointer bg-white"
                >
                  Wstecz
                </button>
              )}
              
              {wizardStep < 3 ? (
                <button
                  onClick={handleWizardNext}
                  className="h-9 px-4 bg-blue-600 hover:bg-blue-755 text-white rounded-lg font-bold text-xs cursor-pointer border-none shadow flex items-center gap-1 active:scale-[0.98]"
                >
                  Dalej <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={handleConfirmPutaway}
                  className="h-9 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs cursor-pointer border-none shadow active:scale-[0.98]"
                >
                  Zatwierdź i zasil stany magazynowe WMS
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Printing Styles in Storage style block */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          #root > div {
            display: none !important;
          }
          #printable-putaway-slip {
            display: block !important;
            width: 100% !important;
            height: auto !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            margin: 0 !important;
            padding: 20px !important;
            box-sizing: border-box !important;
          }
        }
      `}</style>

    </div>
  );
}
