import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Barcode, Play, CheckCircle2, AlertTriangle, Layers, 
  Check, RefreshCw, Box, Printer, Scale, ClipboardList, Timer, Award, ShieldCheck
} from 'lucide-react';
import { sounds } from './SoundEffects';

export function PackerView({ orders, onUpdateOrder, workerName, onBackToMenu }) {
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [cartonSize, setCartonSize] = useState('Carton-M'); // Carton-S, Carton-M, Carton-L
  const [weightKg, setWeightKg] = useState(3.45);
  const [isWeightCalibrated, setIsWeightCalibrated] = useState(false);
  const [isCartonScanned, setIsCartonScanned] = useState(false);
  const [kpiStats, setKpiStats] = useState({ packedToday: 18, avgTimeSec: 42 });
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  // Auto-ticking session timer
  useEffect(() => {
    let interval = null;
    if (selectedOrderId) {
      interval = setInterval(() => {
        setSecondsElapsed(prev => prev + 1);
      }, 1000);
    } else {
      setSecondsElapsed(0);
    }
    return () => clearInterval(interval);
  }, [selectedOrderId]);

  // Filter for picked orders ready for packing.
  // In our system, Pickers change status to 'SHIPPED'. Let's show 'SHIPPED' or 'PROCESSING' orders.
  const activeOrders = orders.filter(o => o.status === 'SHIPPED' || o.status === 'PROCESSING');
  const selectedOrder = orders.find(o => o.id === selectedOrderId);

  const handleStartPacking = (orderId) => {
    sounds.playSuccess();
    setSelectedOrderId(orderId);
    setCartonSize('Carton-M');
    setWeightKg(parseFloat((2.5 + Math.random() * 8).toFixed(2))); // Simulate real product weights
    setIsWeightCalibrated(false);
    setIsCartonScanned(false);
    setSecondsElapsed(0);
  };

  const handleReadScaleWeight = () => {
    sounds.playBeep();
    setIsWeightCalibrated(true);
    sounds.playSuccess();
  };

  const handleScanCartonCode = () => {
    sounds.playBeep();
    const cartonBarcode = prompt("Zeskanuj kod kreskowy kartonu wysyłkowego (np. BOX-39048):", `BOX-${Math.floor(10000 + Math.random() * 90000)}`);
    if (cartonBarcode) {
      sounds.playSuccess();
      setIsCartonScanned(true);
    }
  };

  const handleDispatchAndPrint = () => {
    sounds.playSuccess();
    
    // Change order status to 'DELIVERED' representing dispatched outbound shipment
    if (onUpdateOrder) {
      onUpdateOrder(selectedOrderId, {
        status: 'DELIVERED',
        internalNotes: `${selectedOrder.internalNotes || ''}\n[PACKER]: Zweryfikowano i spakowano do ${cartonSize} o wadze ${weightKg}kg przez ${workerName}. Wydrukowano etykietę wysyłkową.`,
        internalNotesActor: workerName,
        waybillPdfDate: new Date().toLocaleDateString('pl-PL')
      });
    }

    alert(`Etykieta wydrukowana! Zamówienie ${selectedOrderId} zostało pomyślnie nadane kurierowi DPD.`);
    setSelectedOrderId(null);
    setKpiStats(prev => ({
      ...prev,
      packedToday: prev.packedToday + 1
    }));
  };

  return (
    <div className="w-full flex-grow bg-[#051425] text-[#d5e3fc] flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="bg-[#122032] border-b border-[#233144] px-4 py-3 flex items-center justify-between shadow-md shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBackToMenu}
            className="p-1.5 hover:bg-[#1d2b3d] text-purple-400 hover:text-white rounded transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-white">Stacja Pakowania i Weryfikacji</h2>
            <p className="text-[10px] font-mono text-[#798098] uppercase">Zalogowano: {workerName}</p>
          </div>
        </div>

        {/* Live KPIs */}
        <div className="flex items-center gap-4 text-right">
          <div className="hidden sm:block">
            <span className="text-[8px] font-mono text-[#798098] uppercase block">Spakowane Dziś</span>
            <span className="text-xs font-bold font-mono text-purple-400">{kpiStats.packedToday} paczek</span>
          </div>
          <div className="hidden sm:block">
            <span className="text-[8px] font-mono text-[#798098] uppercase block">Śr. Czas Pakowania</span>
            <span className="text-xs font-bold font-mono text-emerald-400">{kpiStats.avgTimeSec}s / paczka</span>
          </div>
          {selectedOrderId && (
            <div className="bg-[#051425] px-2.5 py-1 rounded border border-[#233144] flex items-center gap-2">
              <Timer className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
              <span className="font-mono text-xs font-bold text-purple-300">
                {Math.floor(secondsElapsed / 60)}:{(secondsElapsed % 60).toString().padStart(2, '0')}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-grow overflow-hidden flex flex-col p-4 md:p-6 gap-6">
        {!selectedOrderId ? (
          /* Active Packing Tasks List */
          <div className="flex-grow flex flex-col gap-4 overflow-hidden">
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-[#798098] mb-1">Zlecenia gotowe do pakowania i wysyłki</h3>
              <p className="text-[11px] text-[#798098]">Wybierz skompletowane zamówienie, aby zważyć, zweryfikować i wydrukować etykietę DPD.</p>
            </div>

            <div className="flex-grow overflow-y-auto pr-1 space-y-3">
              {activeOrders.length === 0 ? (
                <div className="bg-[#122032] border border-dashed border-[#233144] rounded-xl p-10 text-center flex flex-col items-center justify-center gap-3">
                  <ClipboardList className="w-12 h-12 text-[#233144]" />
                  <p className="text-xs font-bold text-[#798098]">Brak zleceń oczekujących na spakowanie.</p>
                  <span className="text-[10px] text-[#798098]/60">Wszystkie skompletowane zlecenia zostały już wysłane.</span>
                </div>
              ) : (
                activeOrders.map(order => {
                  const itemsCount = (order.items || []).reduce((sum, i) => sum + (i.quantity || i.qty || 0), 0);
                  const isPicked = order.status === 'SHIPPED'; // Picked status is set to SHIPPED by Picker
                  return (
                    <div 
                      key={order.id} 
                      className="bg-[#122032] border border-[#233144] rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-purple-500/50 transition-all shadow-sm"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-sm font-bold text-white">{order.id}</span>
                          <span className={`text-[9px] px-2 py-0.5 rounded font-extrabold uppercase border ${
                            isPicked 
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                              : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                          }`}>
                            {isPicked ? 'Skompletowane (Gotowe)' : 'W kompletacji (Przetwarzane)'}
                          </span>
                        </div>
                        <p className="text-xs text-[#798098] font-mono leading-none">
                          Wysyłka do: <span className="text-[#c6c6cd] font-semibold">{order.destination || order.shippingAddress}</span> • Ilość: <span className="text-purple-300 font-bold">{itemsCount} szt.</span>
                        </p>
                      </div>

                      <button
                        onClick={() => handleStartPacking(order.id)}
                        className="w-full sm:w-auto h-10 px-5 bg-purple-600 hover:bg-purple-500 active:scale-[0.98] text-white text-xs font-display font-black uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow transition-all shrink-0"
                      >
                        <Box className="w-3.5 h-3.5" />
                        SPAKUJ I ZWERYFIKUJ
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          /* Active Packing Session Screen */
          <div className="flex-grow flex flex-col lg:flex-row gap-6 overflow-hidden">
            {/* Left Column: Order items and Carton selections */}
            <div className="flex-grow flex flex-col gap-6 overflow-y-auto pr-1">
              
              {/* Top info card */}
              <div className="bg-[#122032] p-4 border border-[#233144] rounded-xl flex justify-between items-center shrink-0">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#798098] font-mono uppercase">Pakowanie Zlecenia</span>
                    <span className="font-mono text-sm font-black text-white">{selectedOrder.id}</span>
                  </div>
                  <p className="text-[11px] text-[#798098]">
                    Klient: <span className="text-[#c6c6cd] font-semibold">{selectedOrder.customer || selectedOrder.customerName}</span>
                  </p>
                </div>
                <button
                  onClick={() => { sounds.playBeep(); setSelectedOrderId(null); }}
                  className="px-3 py-1.5 bg-[#1d2b3d] hover:bg-red-950/20 text-[#798098] hover:text-red-400 text-[10px] font-display font-bold uppercase rounded transition-all cursor-pointer"
                >
                  Zamknij sesję
                </button>
              </div>

              {/* Items checklist table to verify */}
              <div className="bg-[#122032] border border-[#233144] rounded-xl overflow-hidden shadow-xs">
                <div className="p-3 bg-[#1d2b3d] border-b border-[#233144] flex justify-between items-center">
                  <h4 className="text-xs font-black uppercase tracking-wider text-white">Pozycje do weryfikacji i pakowania</h4>
                  <span className="text-[10px] bg-[#051425] border border-[#233144] px-2 py-0.5 rounded font-mono">
                    Wszystkie sztuki: {(selectedOrder.items || []).reduce((s, i) => s + (i.quantity || i.qty || 0), 0)}
                  </span>
                </div>
                
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#233144] text-[#798098] font-bold">
                      <th className="px-4 py-2.5">SKU</th>
                      <th className="px-4 py-2.5">Nazwa towaru</th>
                      <th className="px-4 py-2.5 text-right">Ilość szt.</th>
                      <th className="px-4 py-2.5 text-center">Stan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#233144]/40 font-mono text-[#d5e3fc]">
                    {(selectedOrder.items || []).map((item, idx) => (
                      <tr key={item.sku || idx} className="hover:bg-[#051425]/40">
                        <td className="px-4 py-3 font-bold text-purple-300">{item.sku}</td>
                        <td className="px-4 py-3 font-sans font-semibold text-white">{item.product || item.name}</td>
                        <td className="px-4 py-3 text-right font-bold">{item.quantity || item.qty}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded text-[9px] uppercase font-extrabold tracking-widest inline-flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" /> Skompletowano
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Package carton size selections */}
              <div className="bg-[#122032] border border-[#233144] rounded-xl p-5 shadow-xs space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-[#798098]">Krok 1: Wybór opakowania kartonowego</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { id: 'Carton-S', name: 'Koperta / Karton S', desc: 'Artykuły małe / dokumenty (do 1 kg)', icon: Box },
                    { id: 'Carton-M', name: 'Karton Średni M', desc: 'Optymalny dla większości SKU (do 10 kg)', icon: Box },
                    { id: 'Carton-L', name: 'Karton Duży L', desc: 'Duże gabaryty / ciężkie (do 30 kg)', icon: Box }
                  ].map(box => {
                    const isSelected = cartonSize === box.id;
                    return (
                      <button
                        key={box.id}
                        onClick={() => { sounds.playBeep(); setCartonSize(box.id); }}
                        className={`p-4 rounded-xl border text-left flex flex-col justify-between gap-3 cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-purple-600/10 border-purple-500 shadow-md ring-1 ring-purple-500/30' 
                            : 'bg-[#051425] border-[#233144] hover:border-[#3a4e69]'
                        }`}
                      >
                        <div className="flex justify-between items-center w-full">
                          <box.icon className={`w-6 h-6 ${isSelected ? 'text-purple-400' : 'text-[#798098]'}`} />
                          {isSelected && (
                            <span className="w-4 h-4 bg-purple-600 rounded-full flex items-center justify-center text-white text-[8px] font-bold">✓</span>
                          )}
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-white uppercase tracking-wider leading-none mb-1">{box.name}</h5>
                          <p className="text-[10px] text-[#798098] leading-tight font-sans font-normal">{box.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Physical scaling scale & Dispatch confirmations */}
            <div className="w-full lg:w-80 shrink-0 flex flex-col gap-6">
              
              {/* Step 2: Weight scale visualizer */}
              <div className="bg-[#122032] border border-[#233144] rounded-2xl p-5 shadow-sm space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-[#798098]">Krok 2: Odczyt wagi paczki</h4>
                
                <div className="bg-[#051425] border border-[#233144] rounded-xl p-5 flex flex-col items-center justify-center gap-1.5 shadow-inner">
                  <span className="text-[9px] font-mono text-[#798098] uppercase">Kalibracja Wagi Magazynowej</span>
                  <div className="text-3xl font-black font-mono tracking-tight text-white leading-none flex items-baseline gap-1 mt-1">
                    {weightKg.toFixed(2)} <span className="text-sm font-semibold text-purple-400">kg</span>
                  </div>
                  <span className={`text-[8px] px-1.5 py-0.5 rounded font-extrabold uppercase font-mono mt-1 ${
                    isWeightCalibrated 
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' 
                      : 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                  }`}>
                    {isWeightCalibrated ? 'TARA / STABILNA' : 'NIEZATWIERDZONA'}
                  </span>
                </div>

                {!isWeightCalibrated ? (
                  <button
                    onClick={handleReadScaleWeight}
                    className="w-full h-11 bg-purple-600 hover:bg-purple-500 text-white font-display font-black text-xs uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow active:scale-[0.98] transition-all"
                  >
                    <Scale className="w-4 h-4" />
                    ZATWIERDŹ WAGĘ PACZKI
                  </button>
                ) : (
                  <div className="h-11 bg-[#152e1e]/20 border border-emerald-500/30 rounded-lg flex items-center justify-center text-emerald-400 text-xs font-bold gap-1.5">
                    <Check className="w-4 h-4" />
                    Waga zatwierdzona pomyślnie
                  </div>
                )}
              </div>

              {/* Step 3: Carton barcode & dispatch print */}
              <div className="bg-[#122032] border border-[#233144] rounded-2xl p-5 shadow-sm space-y-4 flex-grow flex flex-col justify-between">
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-[#798098] border-b border-[#233144] pb-2">Krok 3: Weryfikacja wysyłkowa</h4>
                  
                  <div className="flex flex-col gap-3">
                    {/* Carton scan bar */}
                    {!isCartonScanned ? (
                      <button
                        onClick={handleScanCartonCode}
                        className="w-full h-11 bg-[#233144] hover:bg-[#2e3e54] border border-[#30425a] text-white text-xs font-display font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
                      >
                        <Barcode className="w-4 h-4 text-purple-400" />
                        SKANUJ KOD KARTONU
                      </button>
                    ) : (
                      <div className="h-11 bg-[#152e1e]/20 border border-emerald-500/30 rounded-lg flex items-center justify-center text-emerald-400 text-xs font-bold gap-1.5">
                        <Check className="w-4 h-4" />
                        Karton zweryfikowany (OK)
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#233144]/60 mt-4">
                  {(() => {
                    const isAllComplete = isWeightCalibrated && isCartonScanned;
                    return (
                      <button
                        onClick={handleDispatchAndPrint}
                        disabled={!isAllComplete}
                        className={`w-full h-13 rounded-xl font-display font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2.5 transition-all ${
                          isAllComplete 
                            ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg cursor-pointer active:scale-[0.98]' 
                            : 'bg-[#1d2b3d] text-[#798098]/40 cursor-not-allowed border border-[#233144]'
                        }`}
                      >
                        <Printer className="w-4.5 h-4.5" />
                        DRUKUJ ETYKIETĘ DPD & NADAJ
                      </button>
                    );
                  })()}
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
