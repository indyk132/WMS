import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Barcode, Play, CheckCircle2, MapPin, 
  Check, Timer, Target, AlertTriangle, XCircle, Volume2, ShieldAlert
} from 'lucide-react';
import { sounds } from './SoundEffects';

interface PickerViewProps {
  orders: any[];
  onUpdateOrder: (id: string, updates: any) => void;
  workerName: string;
  onBackToMenu: () => void;
}

export function PickerView({ orders, onUpdateOrder, workerName, onBackToMenu }: PickerViewProps) {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [pickedItems, setPickedItems] = useState<Record<string, number>>({}); 
  const [kpiStats, setKpiStats] = useState({ picksToday: 42, accuracy: 99.8, speedMin: 1.2 });
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  // Stateful notifications instead of alert/prompt
  const [feedback, setFeedback] = useState<{ id: string; type: 'success' | 'error'; text: string } | null>(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [simulatorBarcodeInput, setSimulatorBarcodeInput] = useState('');

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let interval: any = null;
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

  // Trigger non-blocking audio-visual alerts
  const showFeedback = (type: 'success' | 'error', text: string) => {
    const id = Math.random().toString();
    setFeedback({ id, type, text });

    if (type === 'error') {
      sounds.playError();
    } else {
      sounds.playSuccess();
    }

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      setFeedback(curr => (curr?.id === id ? null : curr));
    }, 4500);
  };

  const handleStartPick = (orderId: string) => {
    sounds.playSuccess();
    setSelectedOrderId(orderId);
    setSecondsElapsed(0);
    showFeedback('success', `Inicjalizacja ścieżki zbiórki dla zamówienia ${orderId}.`);
    
    // Auto focus scan input
    setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 200);
  };

  const handleProcessGlobalScan = (scannedSku: string) => {
    sounds.playBeep();
    const cleanSku = scannedSku.toUpperCase().trim();
    
    if (!selectedOrder) return;
    
    const matchedItem = (selectedOrder.items || []).find((item: any) => item.sku.toUpperCase().trim() === cleanSku);
    
    if (!matchedItem) {
      showFeedback('error', `BŁĄD DEKODOWANIA! Artykuł SKU "${scannedSku}" nie występuje na liście pakowej obecnego zlecenia!`);
      return;
    }
    
    const key = `${selectedOrderId}-${matchedItem.sku}`;
    const currentlyPicked = pickedItems[key] || 0;
    const targetQty = matchedItem.quantity || matchedItem.qty || 0;
    
    if (currentlyPicked >= targetQty) {
      showFeedback('error', `OPERACJA ZABLOKOWANA! Pozycja SKU "${matchedItem.sku}" została już skompletowana w 100%!`);
      return;
    }
    
    const nextPicked = currentlyPicked + 1;
    setPickedItems(prev => ({
      ...prev,
      [key]: nextPicked
    }));
    
    setKpiStats(prev => ({
      ...prev,
      picksToday: prev.picksToday + 1
    }));

    showFeedback('success', `Pomyślnie zeskanowano SKU: ${matchedItem.sku} (+1 szt.).`);
  };

  const handleManualAdjustQty = (sku: string, delta: number) => {
    sounds.playBeep();
    const key = `${selectedOrderId}-${sku}`;
    const currentlyPicked = pickedItems[key] || 0;
    const targetItem = (selectedOrder?.items || []).find((item: any) => item.sku === sku);
    const targetQty = targetItem ? (targetItem.quantity || targetItem.qty || 0) : 0;

    const nextPicked = Math.max(0, Math.min(targetQty, currentlyPicked + delta));

    if (nextPicked !== currentlyPicked) {
      if (delta > 0) {
        setKpiStats(prev => ({ ...prev, picksToday: prev.picksToday + 1 }));
        showFeedback('success', `Zwiększono ręcznie: ${sku} (+1 szt.).`);
      } else {
        setKpiStats(prev => ({ ...prev, picksToday: Math.max(0, prev.picksToday - 1) }));
        showFeedback('success', `Zmniejszono ręcznie: ${sku} (-1 szt.).`);
      }
      
      setPickedItems(prev => ({
        ...prev,
        [key]: nextPicked
      }));
    }
  };

  // Listen to physical USB/Bluetooth handheld barcode scanner emulator
  useEffect(() => {
    if (!selectedOrderId) return;

    let scannedBuffer = "";
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;

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
    
    if (onUpdateOrder && selectedOrderId) {
      onUpdateOrder(selectedOrderId, {
        status: 'Wysłane',
        internalNotes: `${selectedOrder?.internalNotes || ''}\n[PICKER]: Kompletacja zakończona przez ${workerName}. Czas: ${Math.floor(secondsElapsed / 60)}m ${secondsElapsed % 60}s.`,
        internalNotesActor: workerName
      });
    }

    showFeedback('success', `Zlecenie ${selectedOrderId} pomyślnie zebrane. Przekazano na taśmociąg pakowania.`);
    setSelectedOrderId(null);
  };

  const handleSimulatorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (simulatorBarcodeInput.trim()) {
      handleProcessGlobalScan(simulatorBarcodeInput.trim());
      setSimulatorBarcodeInput('');
      setIsSimulatorOpen(false);
    }
  };

  return (
    <div id="picker-terminal-fullscreen" className="w-full min-h-screen bg-[#f5f7fa] text-zinc-800 flex flex-col font-sans select-none antialiased">
      {/* Upper high-visibility status board */}
      <header className="bg-white border-b border-zinc-200 px-4 py-3 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBackToMenu}
            className="p-1.5 hover:bg-zinc-50 text-[#0052CC] hover:text-[#0041a3] rounded-full transition-all cursor-pointer border border-zinc-200"
            title="Powrót do menu"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-zinc-950 leading-none">TERMINAL ZBIERACZA RF</h2>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wide">OPERATOR: <span className="text-zinc-800 font-bold">{workerName}</span></p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 text-right">
          <div className="hidden sm:block">
            <span className="text-[8px] font-mono text-zinc-500 uppercase block tracking-wider font-bold">WYDAJNOŚĆ DZIŚ</span>
            <span className="text-xs font-black font-mono text-[#0052CC] leading-none mt-0.5 block">{kpiStats.picksToday} szt.</span>
          </div>
          <div className="hidden sm:block">
            <span className="text-[8px] font-mono text-zinc-500 uppercase block tracking-wider font-bold">ACCURACY RATE</span>
            <span className="text-xs font-black font-mono text-emerald-600 leading-none mt-0.5 block">{kpiStats.accuracy}%</span>
          </div>
          {selectedOrderId && (
            <div className="bg-zinc-50 px-3 py-1.5 rounded-lg border border-purple-200 flex items-center gap-2 font-mono text-xs font-black text-purple-700 shadow-inner">
              <Timer className="w-4 h-4 text-purple-500 animate-pulse" />
              <span>{Math.floor(secondsElapsed / 60)}:{(secondsElapsed % 60).toString().padStart(2, '0')}</span>
            </div>
          )}
        </div>
      </header>

      {/* Main operational screen */}
      <div className="flex-grow flex flex-col p-4 md:p-6 gap-6 overflow-hidden">
        
        {/* Audio-visual system notification inside container */}
        {feedback && (
          <div className={`p-4 rounded-xl border flex items-start gap-3 shadow-xl tracking-tight transition-all animate-bounce ${
            feedback.type === 'error' 
              ? 'bg-red-50 border-red-200 text-red-800' 
              : 'bg-emerald-50 border-emerald-250 text-emerald-800'
          }`}>
            {feedback.type === 'error' ? (
              <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <span className={`text-[10px] uppercase font-black tracking-widest block ${feedback.type === 'error' ? 'text-red-500' : 'text-emerald-650'}`}>
                {feedback.type === 'error' ? 'ALARM / NIEZGODNOŚĆ' : 'ZDARZENIE SYSTEMOWE'}
              </span>
              <p className="text-xs font-bold leading-normal mt-0.5">{feedback.text}</p>
            </div>
          </div>
        )}

        {!selectedOrderId ? (
          <div className="flex-grow flex flex-col gap-4 overflow-hidden max-w-4xl mx-auto w-full">
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 select-none shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-widest text-[#0052CC] mb-1.5">ZLECENIA OUTBOUND DO REALIZACJI</h3>
              <p className="text-xs text-zinc-650 leading-relaxed font-semibold">
                Zabierz wózek widłowy lub koszyk paletowy, wybierz pierwsze najwyższe priorytetowo zlecenie i rozpocznij kompletację.
              </p>
            </div>

            <div className="flex-grow overflow-y-auto space-y-3.5 pr-1">
              {activeOrders.length === 0 ? (
                <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-4 shadow-sm">
                  <CheckCircle2 className="w-14 h-14 text-emerald-500" />
                  <p className="text-sm font-bold text-zinc-800">KOLEJKA ZBIÓRKI JEST PUSTA</p>
                  <span className="text-xs text-zinc-550 font-medium">Wszystkie dokumenty wydań magazynowych zostały pomyślnie skompletowane. Dobra robota!</span>
                </div>
              ) : (
                activeOrders.map((order: any) => {
                  const itemsCount = (order.items || []).reduce((sum: number, i: any) => sum + (i.quantity || i.qty || 0), 0);
                  const isHigh = order.priority === 'Wysoki';
                  return (
                    <div 
                      key={order.id} 
                      className="bg-white border border-zinc-200 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 hover:border-[#0052CC]/50 transition-all shadow-sm group"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-3">
                          <code className="text-base font-extrabold text-[#0052CC] font-mono">{order.id}</code>
                          <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase border ${
                            isHigh 
                              ? 'bg-red-50 border-red-200 text-red-650' 
                              : 'bg-zinc-100 border-zinc-200 text-zinc-650'
                          }`}>
                            {isHigh ? 'KRYTYCZNE (PRIO 1)' : 'STANDARD'}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-650 leading-normal">
                          Kontrahent: <strong className="text-zinc-900">{order.customer || order.customerName}</strong> • Pozycji łącznie: <strong className="text-[#0052CC] font-extrabold">{itemsCount} szt.</strong>
                        </p>
                      </div>

                      <button
                        onClick={() => handleStartPick(order.id)}
                        className="w-full sm:w-auto h-12 px-6 bg-[#0052CC] hover:bg-[#0041a3] active:scale-[0.98] text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-blue-500/10 transition-all shrink-0 border-none"
                      >
                        <Play className="w-4 h-4 fill-white text-white" />
                        Pobierz do zbiórki
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          <div className="flex-grow flex flex-col lg:flex-row gap-6 overflow-hidden max-w-7xl mx-auto w-full">
            
            {/* Left Column: Tasks */}
            <div className="flex-grow flex flex-col gap-4 overflow-hidden">
              <div className="bg-white p-4 border border-zinc-200 rounded-2xl shrink-0 space-y-3.5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1 text-left">
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">KARTA PRACY</span>
                      <code className="font-mono text-sm font-black text-[#0052CC]">{selectedOrder?.id}</code>
                    </div>
                    <p className="text-xs text-zinc-650">
                      Adres przeznaczenia: <span className="text-zinc-900 font-bold">{selectedOrder?.destination || selectedOrder?.shippingAddress}</span>
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2.5 w-full sm:w-auto">
                    <button
                      onClick={() => {
                        sounds.playBeep();
                        setIsSimulatorOpen(true);
                      }}
                      className="flex-grow sm:flex-none h-11 px-5 bg-[#0052CC] hover:bg-[#0041a3] text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-blue-550/15 border-none transition-all"
                    >
                      <Barcode className="w-4.5 h-4.5" />
                      Ręczny skan (Klawiatura)
                    </button>
                    
                    <button
                      onClick={() => { sounds.playBeep(); setSelectedOrderId(null); }}
                      className="flex-grow sm:flex-none h-11 px-4 bg-white hover:bg-red-50 text-zinc-650 hover:text-red-650 text-xs font-bold uppercase rounded-xl border border-zinc-250 hover:border-red-200 transition-all cursor-pointer"
                    >
                      Boksuj / Odłóż zlecenie
                    </button>
                  </div>
                </div>

                {/* Laser scan listener notification block */}
                <div className="bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl flex flex-col sm:flex-row items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping shrink-0" />
                  <div className="text-[11px] font-mono text-zinc-500 flex-grow leading-tight text-left">
                    <strong className="text-zinc-850">OCZEKIWANIE NA BARCODE LASERA</strong>: Nakieruj sprzęt skanujący (np. Zebra TC57 / Honeywell) bezpośrednio na regał lub kod kreskowy opakowania.
                  </div>
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    placeholder="Szybki wpis lasera i Enter..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = (e.target as HTMLInputElement).value;
                        if (val.trim().length > 0) {
                          handleProcessGlobalScan(val);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }
                    }}
                    className="w-full sm:w-56 bg-white border border-zinc-300 rounded-xl px-3.5 py-1.5 text-xs font-mono text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#0052CC] focus:border-transparent outline-none h-9 shadow-inner"
                  />
                </div>
              </div>

              {/* Items List - High Visibility with massive 2-meter readable fonts */}
              <div className="flex-grow overflow-y-auto space-y-3.5 pr-1">
                {(selectedOrder?.items || []).map((item: any, idx: number) => {
                  const key = `${selectedOrder?.id}-${item.sku}`;
                  const picked = pickedItems[key] || 0;
                  const target = item.quantity || item.qty || 0;
                  const isDone = picked >= target;

                  return (
                    <div 
                      key={item.sku || idx}
                      className={`border rounded-2xl p-4.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all ${
                        isDone 
                          ? 'bg-emerald-50/40 border-emerald-250 text-zinc-500 shadow-inner' 
                          : 'bg-white border-zinc-200 text-zinc-800 shadow-sm'
                      }`}
                    >
                      <div className="space-y-2.5 flex-grow w-full">
                        <div className="flex justify-between items-start gap-4 w-full">
                          <div className="space-y-1 text-left">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-xs font-extrabold bg-zinc-100 text-zinc-750 px-2 py-0.5 rounded">{item.sku}</span>
                              <span className="font-sans font-black text-base text-zinc-950">{item.product || item.name}</span>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-zinc-500 mt-1">
                              <span className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 px-2.5 py-1 rounded-lg">
                                <MapPin className="w-3.5 h-3.5 text-amber-600 animate-bounce" />
                                KORYTARZ REGAŁU: <strong className="text-zinc-950 font-extrabold font-mono text-xs ml-0.5">{item.zone || 'A1'}</strong>
                              </span>
                              <span className="bg-zinc-50 border border-zinc-200 px-2.5 py-1 rounded-lg">Poz/Gniazdo: <strong className="text-zinc-750 font-black">P{(idx % 4) + 1}-G{(idx % 3) + 1}</strong></span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 bg-zinc-100 border border-zinc-200 p-0.5 rounded-lg shrink-0 select-none">
                            <button
                              type="button"
                              onClick={() => handleManualAdjustQty(item.sku, -1)}
                              disabled={picked <= 0}
                              className="w-7 h-7 flex items-center justify-center text-sm font-black rounded-md text-zinc-500 hover:text-red-650 hover:bg-zinc-200 cursor-pointer disabled:opacity-20 transition-all border-none bg-transparent"
                              title="Zmniejsz ręcznie (-1)"
                            >
                              -
                            </button>
                            <span className="h-3.5 w-px bg-zinc-300" />
                            <button
                              type="button"
                              onClick={() => handleManualAdjustQty(item.sku, 1)}
                              disabled={isDone}
                              className="w-7 h-7 flex items-center justify-center text-sm font-black rounded-md text-zinc-500 hover:text-emerald-700 hover:bg-zinc-200 cursor-pointer disabled:opacity-20 transition-all border-none bg-transparent"
                              title="Zwiększ ręcznie (+1)"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 w-full sm:w-auto shrink-0 sm:justify-end select-none">
                        <div className="text-right font-mono pr-2">
                          <span className="text-[10px] text-zinc-500 block uppercase font-sans font-bold">ZEBRANO / PLAN</span>
                          <span className={`text-xl font-black ${isDone ? 'text-emerald-600' : 'text-amber-600 animate-pulse'}`}>
                            {picked} / {target} szt.
                          </span>
                        </div>

                        {isDone ? (
                          <div className="w-12 h-12 bg-emerald-50 border border-emerald-250 rounded-xl flex items-center justify-center text-emerald-600 shrink-0 shadow-sm">
                            <Check className="w-6 h-6 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-zinc-50 border border-zinc-250 rounded-xl flex items-center justify-center text-zinc-400 shrink-0 shadow-inner">
                            <Barcode className="w-5 h-5 animate-pulse" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Order Confirmation Board */}
            <div className="w-full lg:w-80 shrink-0 flex flex-col gap-4 select-none">
              <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-zinc-150 pb-2.5">
                  <Play className="w-4 h-4 text-[#0052CC]" />
                  <h4 className="text-xs font-black uppercase tracking-widest text-[#0052CC]">SUMARYCZNY POSTĘP TRASY</h4>
                </div>
                
                <div className="space-y-3">
                  {(() => {
                    const totalTarget = (selectedOrder?.items || []).reduce((sum: number, i: any) => sum + (i.quantity || i.qty || 0), 0);
                    const totalPicked = (selectedOrder?.items || []).reduce((sum: number, i: any) => {
                      const key = `${selectedOrder?.id}-${i.sku}`;
                      return sum + (pickedItems[key] || 0);
                    }, 0);
                    const percent = totalTarget > 0 ? Math.round((totalPicked / totalTarget) * 100) : 0;
                    const allDone = percent === 100;

                    return (
                      <>
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-zinc-500 font-sans font-bold">Zapełnienie wózka:</span>
                          <span className={allDone ? 'text-emerald-600 font-extrabold' : 'text-amber-600 font-extrabold'}>{totalPicked} / {totalTarget} (szt.)</span>
                        </div>
                        <div className="w-full bg-zinc-100 rounded-full h-3.5 overflow-hidden flex border border-zinc-200 shadow-inner">
                          <div 
                            className={`h-full transition-all duration-300 rounded-full ${allDone ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                            style={{ width: `${percent}%` }}
                          />
                        </div>

                        <div className="pt-4">
                          <button
                            onClick={handleCompleteOrderPick}
                            disabled={!allDone}
                            className={`w-full h-12 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all border-none ${
                              allDone 
                                ? 'bg-emerald-650 hover:bg-emerald-700 text-white shadow-md cursor-pointer active:scale-[0.98]' 
                                : 'bg-zinc-100 text-zinc-400 cursor-not-allowed border border-zinc-200'
                            }`}
                          >
                            <CheckCircle2 className="w-4.5 h-4.5" />
                            POTWIERDŹ KOMPLETACJĘ
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="bg-white border border-zinc-200 rounded-2xl p-5 flex items-start gap-3 shadow-sm text-left">
                <Target className="w-9 h-9 text-[#0052CC] shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-[10px] font-bold text-zinc-550 uppercase tracking-wider font-sans">Eko-Ścieżka Kompletacji</h5>
                  <p className="text-xs text-zinc-650 mt-1 leading-normal">
                    Zasada pick-by-path: System uszeregował SKU tak, aby zminimalizować czas przejazdu wózka magazynowego.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Embedded dialog for simulating scans cleanly instead of prompts */}
      {isSimulatorOpen && (
        <div id="barcode-simulator-drawer" className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-350 rounded-xl w-full max-w-sm shadow-2xl p-5 animate-in zoom-in-95 duration-100">
            <div className="flex items-center gap-2 text-zinc-950 border-b border-zinc-100 pb-3 mb-4 select-none">
              <Barcode className="w-5 h-5 text-[#0052CC]" />
              <h4 className="font-extrabold text-sm text-zinc-950">Wprowadzanie Kodu Kreskowego</h4>
            </div>

            <form onSubmit={handleSimulatorSubmit} className="space-y-4 font-sans text-xs text-left">
              <p className="text-zinc-650 leading-relaxed font-semibold">
                Zasymuluj odczyt lasera radiowego. Wpisz kod kreskowy SKU towaru (np. <code className="text-[#0052CC] font-bold font-mono">SKU-10492</code>) aby zasymulować pik:
              </p>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">KOD KRESKOWY SKU / REGAŁU</label>
                <input
                  type="text"
                  required
                  placeholder="np. SKU-10492"
                  value={simulatorBarcodeInput}
                  onChange={(e) => setSimulatorBarcodeInput(e.target.value)}
                  className="w-full p-2.5 bg-white border border-zinc-300 rounded-xl text-zinc-900 outline-none focus:ring-2 focus:ring-[#0052CC] font-mono text-sm uppercase shadow-inner"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 select-none">
                <button
                  type="button"
                  onClick={() => setIsSimulatorOpen(false)}
                  className="px-4 py-2 border border-zinc-300 hover:bg-zinc-50 text-zinc-700 font-bold rounded-lg text-xs cursor-pointer bg-white"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-4.5 py-2 bg-[#0052CC] hover:bg-[#0041a3] text-white font-bold rounded-lg text-xs cursor-pointer shadow-sm transition-colors border-none"
                >
                  Zatwierdź Odczyt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
