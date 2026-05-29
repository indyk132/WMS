import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Barcode, Play, CheckCircle2, AlertTriangle, Layers, MapPin, 
  Check, RefreshCw, ShoppingCart, Timer, Award, User, ClipboardList, Target
} from 'lucide-react';
import { sounds } from './SoundEffects';

export function PickerView({ orders, onUpdateOrder, workerName, onBackToMenu }) {
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [pickedItems, setPickedItems] = useState({}); 
  const [kpiStats, setKpiStats] = useState({ picksToday: 12, accuracy: 99.4, speedMin: 1.4 });
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  
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

  
  const activeOrders = orders.filter(o => o.status === 'W realizacji' || o.status === 'Oczekujące');
  const selectedOrder = orders.find(o => o.id === selectedOrderId);

  const handleStartPick = (orderId) => {
    sounds.playSuccess();
    setSelectedOrderId(orderId);
    setSecondsElapsed(0);
  };

  const handleProcessGlobalScan = (scannedSku) => {
    sounds.playBeep();
    const cleanSku = scannedSku.toUpperCase().trim();
    
    if (!selectedOrder) return;
    
    
    const matchedItem = (selectedOrder.items || []).find(item => item.sku.toUpperCase().trim() === cleanSku);
    
    if (!matchedItem) {
      sounds.playError();
      alert(`BŁĄD SKANOWANIA! Towar o kodzie SKU "${scannedSku}" nie należy do tego zlecenia!`);
      return;
    }
    
    const key = `${selectedOrderId}-${matchedItem.sku}`;
    const currentlyPicked = pickedItems[key] || 0;
    const targetQty = matchedItem.quantity || matchedItem.qty || 0;
    
    if (currentlyPicked >= targetQty) {
      sounds.playError();
      alert(`BŁĄD: SKU "${matchedItem.sku}" został już w pełni skompletowany!`);
      return;
    }
    
    
    sounds.playSuccess();
    setPickedItems(prev => ({
      ...prev,
      [key]: currentlyPicked + 1
    }));
    
    setKpiStats(prev => ({
      ...prev,
      picksToday: prev.picksToday + 1
    }));
  };

  const handleGlobalScanPrompt = () => {
    sounds.playBeep();
    const userInput = prompt("ZESKANUJ SKU: wpisz kod kreskowy towaru (np. SKU-10492):", "SKU-");
    if (userInput) {
      handleProcessGlobalScan(userInput);
    }
  };

  const handleManualAdjustQty = (sku, delta) => {
    sounds.playBeep();
    const key = `${selectedOrderId}-${sku}`;
    const currentlyPicked = pickedItems[key] || 0;
    const targetItem = (selectedOrder.items || []).find(item => item.sku === sku);
    const targetQty = targetItem ? (targetItem.quantity || targetItem.qty || 0) : 0;

    const nextPicked = Math.max(0, Math.min(targetQty, currentlyPicked + delta));

    if (nextPicked !== currentlyPicked) {
      if (delta > 0) {
        sounds.playSuccess();
        setKpiStats(prev => ({ ...prev, picksToday: prev.picksToday + 1 }));
      } else {
        sounds.playBeep();
        setKpiStats(prev => ({ ...prev, picksToday: Math.max(0, prev.picksToday - 1) }));
      }
      
      setPickedItems(prev => ({
        ...prev,
        [key]: nextPicked
      }));
    }
  };

  
  useEffect(() => {
    if (!selectedOrderId) return;

    let scannedBuffer = "";
    const handleKeyPress = (e) => {
      
      if (e.target.tagName === 'INPUT') return;

      if (e.key === "Enter") {
        if (scannedBuffer.trim().length > 0) {
          handleProcessGlobalScan(scannedBuffer.trim());
        }
        scannedBuffer = "";
      } else {
        if (e.key.length === 1) {
          scannedBuffer += e.key;
        }
      }
    };
    window.addEventListener("keypress", handleKeyPress);
    return () => window.removeEventListener("keypress", handleKeyPress);
  }, [selectedOrderId, selectedOrder, pickedItems]);

  const handleCompleteOrderPick = () => {
    sounds.playSuccess();
    
    
    
    if (onUpdateOrder) {
      onUpdateOrder(selectedOrderId, {
        status: 'Wysłane',
        internalNotes: `${selectedOrder.internalNotes || ''}\n[PICKER]: Kompletacja zakończona przez ${workerName}. Czas: ${Math.floor(secondsElapsed / 60)}m ${secondsElapsed % 60}s.`,
        internalNotesActor: workerName
      });
    }

    alert(`Zlecenie ${selectedOrderId} skompletowane pomyślnie! Przekazano do stacji pakowania.`);
    setSelectedOrderId(null);
  };

  return (
    <div className="w-full flex-grow bg-[#f4f6f9] text-zinc-800 flex flex-col font-sans">
      <header className="bg-white border-b border-zinc-200 px-4 py-3 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBackToMenu}
            className="p-1.5 hover:bg-zinc-50 text-[#0052CC] hover:text-[#0041a3] rounded-lg transition-colors cursor-pointer border border-zinc-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-zinc-900">Terminal Zbieracza</h2>
            <p className="text-[10px] font-mono text-zinc-500 uppercase">Zalogowano: {workerName}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-right">
          <div className="hidden sm:block">
            <span className="text-[8px] font-mono text-zinc-400 uppercase block">Zebrane Dziś</span>
            <span className="text-xs font-bold font-mono text-[#0052CC]">{kpiStats.picksToday} szt.</span>
          </div>
          <div className="hidden sm:block">
            <span className="text-[8px] font-mono text-zinc-400 uppercase block">Dokładność</span>
            <span className="text-xs font-bold font-mono text-emerald-600">{kpiStats.accuracy}%</span>
          </div>
          {selectedOrderId && (
            <div className="bg-zinc-50 px-2.5 py-1 rounded border border-zinc-200 flex items-center gap-2">
              <Timer className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              <span className="font-mono text-xs font-bold text-amber-700">
                {Math.floor(secondsElapsed / 60)}:{(secondsElapsed % 60).toString().padStart(2, '0')}
              </span>
            </div>
          )}
        </div>
      </header>

      <div className="flex-grow overflow-hidden flex flex-col p-4 md:p-6 gap-6">
        {!selectedOrderId ? (
          <div className="flex-grow flex flex-col gap-4 overflow-hidden">
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-1">Dostępne zlecenia kompletacji</h3>
              <p className="text-[11px] text-zinc-500">Wybierz zlecenie z listy, aby rozpocząć proces zbierania towarów.</p>
            </div>

            <div className="flex-grow overflow-y-auto pr-1 space-y-3">
              {activeOrders.length === 0 ? (
                <div className="bg-white border border-dashed border-zinc-300 rounded-2xl p-10 text-center flex flex-col items-center justify-center gap-3 shadow-sm">
                  <ClipboardList className="w-12 h-12 text-zinc-300" />
                  <p className="text-xs font-bold text-zinc-500">Brak aktywnych zleceń do zebrania.</p>
                  <span className="text-[10px] text-zinc-400">Wszystkie zamówienia zostały w pełni skompletowane.</span>
                </div>
              ) : (
                activeOrders.map(order => {
                  const itemsCount = (order.items || []).reduce((sum, i) => sum + (i.quantity || i.qty || 0), 0);
                  const isHigh = order.priority === 'Wysoki';
                  return (
                    <div 
                      key={order.id} 
                      className="bg-white border border-zinc-200 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 hover:border-[#0052CC]/40 hover:shadow-lg hover:shadow-blue-50/20 transition-all shadow-sm"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-sm font-bold text-zinc-900">{order.id}</span>
                          <span className={`text-[9px] px-2 py-0.5 rounded font-extrabold uppercase border ${
                            isHigh 
                              ? 'bg-red-50 border-red-200 text-red-655' 
                              : 'bg-zinc-100 border-zinc-200 text-zinc-650'
                          }`}>
                            {isHigh ? 'Wysoki Priorytet' : 'Normalny'}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 font-mono leading-none">
                          Kontrahent: <span className="text-zinc-750 font-semibold">{order.customer || order.customerName}</span> • Pozycje: <span className="text-[#0052CC] font-bold">{itemsCount} szt.</span>
                        </p>
                      </div>

                      <button
                        onClick={() => handleStartPick(order.id)}
                        className="w-full sm:w-auto h-11 px-5 bg-[#0052CC] hover:bg-[#0041a3] active:scale-[0.98] text-white text-xs font-display font-black uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow transition-all shrink-0"
                      >
                        <Play className="w-3.5 h-3.5" />
                        ROZPOCZNIJ ZBIÓRKĘ
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          
          <div className="flex-grow flex flex-col md:flex-row gap-6 overflow-hidden">
            <div className="flex-grow flex flex-col gap-4 overflow-hidden">
              <div className="bg-white p-4 border border-zinc-200 rounded-2xl shadow-sm shrink-0 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-400 font-mono uppercase">Zlecenie</span>
                      <span className="font-mono text-sm font-black text-zinc-900">{selectedOrder.id}</span>
                    </div>
                    <p className="text-[11px] text-zinc-500">
                      Destynacja: <span className="text-zinc-700 font-semibold">{selectedOrder.destination || selectedOrder.shippingAddress}</span>
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <button
                      onClick={handleGlobalScanPrompt}
                      className="flex-grow sm:flex-none h-9 px-4 bg-[#0052CC] hover:bg-[#0041a3] text-white text-xs font-display font-black uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow transition-all"
                    >
                      <Barcode className="w-4 h-4" />
                      SYMULUJ SKANOWANIE 📲
                    </button>
                    <button
                      onClick={() => { sounds.playBeep(); setSelectedOrderId(null); }}
                      className="flex-grow sm:flex-none h-9 px-4 bg-zinc-50 hover:bg-red-50 text-zinc-650 hover:text-red-655 text-[10px] font-display font-bold uppercase rounded border border-zinc-200 transition-all cursor-pointer"
                    >
                      Przerwij zbiórkę
                    </button>
                  </div>
                </div>

                <div className="bg-zinc-50 border border-zinc-200 px-3.5 py-2.5 rounded-xl flex flex-col sm:flex-row items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-550 animate-pulse shrink-0" />
                  <div className="text-[11px] font-mono text-zinc-500 flex-grow leading-tight text-left">
                    <strong>DETEKTOR LASEROWY AKTYWNY</strong>: Skieruj czytnik na kod kreskowy towaru (lub wpisz kod SKU poniżej i naciśnij klawisz Enter).
                  </div>
                  <input
                    type="text"
                    placeholder="Wpis SKU z lasera..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.target.value.trim().length > 0) {
                        handleProcessGlobalScan(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="w-full sm:w-48 bg-white border border-zinc-300 rounded px-2.5 py-1 text-xs font-mono text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#0052CC] focus:border-zinc-300 outline-none"
                  />
                </div>
              </div>

              <div className="flex-grow overflow-y-auto pr-1 space-y-2.5">
                {(selectedOrder.items || []).map((item, idx) => {
                  const key = `${selectedOrder.id}-${item.sku}`;
                  const picked = pickedItems[key] || 0;
                  const target = item.quantity || item.qty || 0;
                  const isDone = picked >= target;

                  return (
                    <div 
                      key={item.sku || idx}
                      className={`border rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all ${
                        isDone 
                          ? 'bg-emerald-50/20 border-emerald-550/30 text-zinc-500 shadow-inner' 
                          : 'bg-white border-zinc-200 text-zinc-800 shadow-sm'
                      }`}
                    >
                      <div className="space-y-2 flex-grow w-full">
                        <div className="flex justify-between items-start gap-4 w-full">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-blue-650">{item.sku}</span>
                            <span className="font-display font-black text-sm text-zinc-900">{item.product || item.name}</span>
                          </div>

                          <div className="flex items-center gap-1 bg-zinc-50 border border-zinc-200 p-0.5 rounded-lg shrink-0">
                            <button
                              type="button"
                              onClick={() => handleManualAdjustQty(item.sku, -1)}
                              disabled={picked <= 0}
                              className="w-6 h-6 flex items-center justify-center text-xs font-black rounded text-zinc-500 hover:text-red-655 hover:bg-red-50 cursor-pointer disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                              title="Zmniejsz ilość (-1)"
                            >
                              -
                            </button>
                            <span className="h-3 w-px bg-zinc-200" />
                            <button
                              type="button"
                              onClick={() => handleManualAdjustQty(item.sku, 1)}
                              disabled={isDone}
                              className="w-6 h-6 flex items-center justify-center text-xs font-black rounded text-zinc-500 hover:text-emerald-700 hover:bg-emerald-50 cursor-pointer disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                              title="Zwiększ ilość (+1)"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-zinc-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-amber-500" />
                            Lokalizacja: <strong className="text-zinc-800 font-bold bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded font-mono">
                              {item.zone || 'A1'}
                            </strong>
                          </span>
                          <span>Poziom/Gniazdo: <strong className="text-zinc-650 font-bold">P{(idx % 4) + 1}-G{(idx % 3) + 1}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 w-full sm:w-auto shrink-0 sm:justify-end">
                        <div className="text-right font-mono pr-2">
                          <span className="text-[10px] text-zinc-500 block uppercase">Pobrane</span>
                          <span className={`text-base font-extrabold ${isDone ? 'text-emerald-600' : 'text-amber-700'}`}>
                            {picked} / {target} szt.
                          </span>
                        </div>

                        {isDone ? (
                          <div className="w-11 h-11 bg-emerald-50 border border-emerald-250 rounded-xl flex items-center justify-center text-emerald-600 shrink-0 animate-in zoom-in shadow-sm">
                            <Check className="w-5 h-5" />
                          </div>
                        ) : (
                          <div className="w-11 h-11 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-center text-zinc-400 shrink-0">
                            <Barcode className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="w-full md:w-80 shrink-0 flex flex-col gap-4">
              <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 border-b border-zinc-200 pb-2">Status Kompletacji</h4>
                
                <div className="space-y-2">
                  {(() => {
                    const totalTarget = (selectedOrder.items || []).reduce((sum, i) => sum + (i.quantity || i.qty || 0), 0);
                    const totalPicked = (selectedOrder.items || []).reduce((sum, i) => {
                      const key = `${selectedOrder.id}-${i.sku}`;
                      return sum + (pickedItems[key] || 0);
                    }, 0);
                    const percent = totalTarget > 0 ? Math.round((totalPicked / totalTarget) * 100) : 0;
                    const allDone = percent === 100;

                    return (
                      <>
                        <div className="flex justify-between text-xs font-mono">
                          <span>Postęp całkowity</span>
                          <span className={allDone ? 'text-emerald-700 font-bold' : 'text-amber-750'}>{percent}%</span>
                        </div>
                        <div className="w-full bg-zinc-100 rounded-full h-3 overflow-hidden border border-zinc-200 flex">
                          <div 
                            className={`h-full transition-all duration-300 rounded-full ${allDone ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                            style={{ width: `${percent}%` }}
                          />
                        </div>

                        <div className="pt-4">
                          <button
                            onClick={handleCompleteOrderPick}
                            disabled={!allDone}
                            className={`w-full h-12 rounded-xl font-display font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                              allDone 
                                ? 'bg-emerald-650 hover:bg-emerald-700 text-white shadow-md cursor-pointer active:scale-[0.98]' 
                                : 'bg-zinc-100 text-zinc-400 cursor-not-allowed border border-zinc-200'
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            POTWIERDŹ KOMPLETACJĘ
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 flex items-center gap-3 shadow-inner">
                <Target className="w-8 h-8 text-[#0052CC] shrink-0" />
                <div>
                  <h5 className="text-[10px] font-bold text-zinc-450 uppercase">Wskazówka Trasy</h5>
                  <p className="text-xs text-zinc-700 mt-0.5 font-medium leading-tight">
                    Rozpocznij od korytarza w strefie A, idź zgodnie z ruchem wskazówek zegara w stronę Cold Storage.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
