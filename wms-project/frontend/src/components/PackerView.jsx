import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Barcode, Play, CheckCircle2, AlertTriangle, Layers, 
  Check, RefreshCw, Box, Printer, Scale, ClipboardList, Timer, Award, ShieldCheck,
  User, Clock, RotateCcw, AlertCircle, HelpCircle, Boxes, Truck
} from 'lucide-react';
import { sounds } from './SoundEffects';

export function PackerView({ orders, onUpdateOrder, workerName, currentUser, onBackToMenu }) {
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [cartonSize, setCartonSize] = useState('Carton-M'); 
  const [weightKg, setWeightKg] = useState(3.45);
  const [isWeightCalibrated, setIsWeightCalibrated] = useState(false);
  const [isCartonScanned, setIsCartonScanned] = useState(false);
  const [kpiStats, setKpiStats] = useState({ packedToday: 18, avgTimeSec: 42 });
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [packedItems, setPackedItems] = useState({}); 
  const [processingOrderData, setProcessingOrderData] = useState(null);

  const [currentTime, setCurrentTime] = useState(() => {
    const d = new Date();
    return d.toTimeString().split(' ')[0]; 
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setCurrentTime(d.toTimeString().split(' ')[0]);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isUserAdminOrManager = currentUser && (
    currentUser.isAdmin || 
    currentUser.staffRole === 'Super Admin' || 
    currentUser.staffRole === 'Warehouse Manager' ||
    currentUser.empId === 'EMP-8492' || 
    currentUser.empId === 'EMP-9104' ||
    (currentUser.name && (
      currentUser.name.toUpperCase().includes('ADMIN') || 
      currentUser.name.toUpperCase().includes('KIEROWNIK') || 
      currentUser.name.toUpperCase().includes('MANAGER')
    ))
  );

  
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

  
  
  const activeOrders = orders.filter(o => o.status === 'Wysłane' || o.status === 'W realizacji');
  const selectedOrder = orders.find(o => o.id === selectedOrderId);

  
  const areAllItemsPacked = selectedOrder 
    ? (selectedOrder.items || []).every(item => {
        const status = packedItems[item.sku];
        return status && status.finalized && status.qty === (item.quantity || item.qty);
      })
    : false;

  const [focusedSku, setFocusedSku] = useState(null);

  const handleStartPacking = (orderId) => {
    sounds.playSuccess();
    setSelectedOrderId(orderId);
    setCartonSize('Carton-M');
    setWeightKg(parseFloat((2.5 + Math.random() * 8).toFixed(2))); 
    setIsWeightCalibrated(false);
    setIsCartonScanned(false);
    setSecondsElapsed(0);
    setPackedItems({}); 
    setFocusedSku(null); 
  };

  const handleRowClick = (sku) => {
    const item = (selectedOrder.items || []).find(i => i.sku === sku);
    if (!item) return;

    const targetQty = item.quantity || item.qty || 0;
    const currentStatus = packedItems[sku] || { qty: 0, finalized: false };

    
    if (currentStatus.qty === 0) {
      if (isUserAdminOrManager) {
        sounds.playSuccess();
        const nextQty = 1;
        setPackedItems(prev => ({
          ...prev,
          [sku]: {
            qty: nextQty,
            finalized: nextQty === targetQty
          }
        }));

        if (nextQty === targetQty) {
          setFocusedSku(null);
        } else {
          setFocusedSku(sku);
        }
      } else {
        
        sounds.playError();
        alert(`BŁĄD: Towar o SKU "${sku}" nie został jeszcze zeskanowany czytnikiem!`);
      }
    } else {
      
      if (focusedSku === sku) {
        sounds.playBeep();
        setFocusedSku(null); 
      } else {
        setFocusedSku(sku); 
      }
    }
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
    
    const sku = matchedItem.sku;
    const currentStatus = packedItems[sku] || { qty: 0, finalized: false };
    const targetQty = matchedItem.quantity || matchedItem.qty || 0;
    
    if (currentStatus.finalized) {
      sounds.playError();
      alert(`Towar SKU "${sku}" został już oznaczony jako spakowany!`);
      return;
    }

    if (currentStatus.qty >= targetQty) {
      sounds.playError();
      alert(`BŁĄD: Ilość dla SKU "${sku}" została już w pełni zweryfikowana!`);
      return;
    }
    
    
    sounds.playSuccess();
    const nextQty = currentStatus.qty + 1;
    setPackedItems(prev => ({
      ...prev,
      [sku]: {
        qty: nextQty,
        finalized: nextQty === targetQty
      }
    }));

    if (nextQty === targetQty) {
      if (focusedSku === sku) {
        setTimeout(() => setFocusedSku(null), 300);
      } else {
        setFocusedSku(null);
      }
    } else {
      setFocusedSku(sku);
    }
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
    const targetItem = (selectedOrder.items || []).find(item => item.sku === sku);
    if (!targetItem) return;
    const targetQty = targetItem.quantity || targetItem.qty || 0;
    
    const currentStatus = packedItems[sku] || { qty: 0, finalized: false };
    const nextQty = Math.max(0, Math.min(targetQty, currentStatus.qty + delta)); 

    setPackedItems(prev => ({
      ...prev,
      [sku]: {
        qty: nextQty,
        finalized: nextQty === targetQty
      }
    }));

    if (nextQty === targetQty) {
      sounds.playSuccess();
      setTimeout(() => {
        setFocusedSku(null);
      }, 300);
    } else if (nextQty === 0) {
      setFocusedSku(null); 
    }
  };

  const handleFinalizePackItem = (sku) => {
    sounds.playSuccess();
    const targetItem = (selectedOrder.items || []).find(item => item.sku === sku);
    if (!targetItem) return;
    const targetQty = targetItem.quantity || targetItem.qty || 0;
    
    setPackedItems(prev => ({
      ...prev,
      [sku]: {
        qty: targetQty,
        finalized: true
      }
    }));

    setTimeout(() => {
      setFocusedSku(null);
    }, 300);
  };

  
  useEffect(() => {
    if (!selectedOrderId || !selectedOrder) return;

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
  }, [selectedOrderId, selectedOrder, packedItems]);

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
  const handleStartDispatchProcessing = () => {
    sounds.playSuccess();
    setProcessingOrderData({
      orderId: selectedOrderId,
      clientName: selectedOrder.customer || selectedOrder.customerName || "Klient detaliczny",
      weight: weightKg,
      cartonSize: cartonSize === 'Carton-S' ? 'Koperta / Karton S' : cartonSize === 'Carton-L' ? 'Karton Duży L' : 'Karton Średni M',
      cartonCode: `BOX-${cartonSize.replace('Carton-', '')}-${selectedOrderId}`
    });
  };

  const handleCompleteDispatch = (pData) => {
    if (onUpdateOrder) {
      onUpdateOrder(pData.orderId, {
        status: 'Dostarczone',
        internalNotes: `${selectedOrder.internalNotes || ''}\n[PACKER]: Zweryfikowano i spakowano do ${pData.cartonSize} o wadze ${pData.weight.toFixed(2)}kg przez ${workerName}. Wygenerowano etykietę DPD.`,
        internalNotesActor: workerName,
        waybillPdfDate: new Date().toLocaleDateString('pl-PL')
      });
    }
    setSelectedOrderId(null);
    setProcessingOrderData(null);
    setKpiStats(prev => ({
      ...prev,
      packedToday: prev.packedToday + 1
    }));
  };

  if (processingOrderData) {
    return (
      <ProcessingOrderScreen
        orderId={processingOrderData.orderId}
        clientName={processingOrderData.clientName}
        weight={processingOrderData.weight}
        cartonSize={processingOrderData.cartonSize}
        cartonCode={processingOrderData.cartonCode}
        workerName={workerName}
        currentUser={currentUser}
        kpiStats={kpiStats}
        onBack={() => {
          sounds.playBeep();
          setProcessingOrderData(null);
        }}
        onComplete={handleCompleteDispatch}
      />
    );
  }

  return (
    <div className="w-full flex-grow bg-[#f4f6f9] text-zinc-800 flex flex-col font-sans" onClick={() => setFocusedSku(null)}>
      
      <header className="bg-white border-b border-zinc-200 px-4 py-3 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBackToMenu}
            className="p-1.5 hover:bg-zinc-50 text-[#0052CC] hover:text-[#0041a3] rounded-full transition-all cursor-pointer border border-zinc-200"
            title="Powrót do menu głównego"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-sm font-black uppercase tracking-wider text-zinc-900">Stacja Pakowania i Weryfikacji</h2>
            </div>
            <p className="text-[10px] font-mono text-zinc-500 uppercase flex items-center gap-1.5 mt-0.5">
              <User className="w-3 h-3 text-zinc-400" />
              Zalogowano: <span className="text-zinc-800 font-bold">{workerName}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-right">
          <div className="hidden md:block">
            <span className="text-[8px] font-mono text-zinc-500 uppercase block tracking-wider font-bold">Spakowane Dziś</span>
            <span className="text-xs font-black font-mono text-[#0052CC] leading-none mt-0.5 block">{kpiStats.packedToday} paczek</span>
          </div>
          
          <div className="hidden md:block">
            <span className="text-[8px] font-mono text-zinc-500 uppercase block tracking-wider font-bold">Śr. Czas Pakowania</span>
            <span className="text-xs font-black font-mono text-purple-650 leading-none mt-0.5 block">{kpiStats.avgTimeSec}s / paczka</span>
          </div>
          
          <div className="hidden md:block">
            <span className="text-[8px] font-mono text-zinc-500 uppercase block tracking-wider font-bold font-sans">Dokładność</span>
            <span className="text-xs font-black font-mono text-emerald-600 leading-none mt-0.5 block">99.4%</span>
          </div>
          
          {selectedOrderId ? (
            <div className="bg-zinc-50 px-3 py-1.5 rounded-lg border border-purple-200 flex items-center gap-2 font-mono text-xs font-black text-purple-700 shadow-inner">
              <Timer className="w-4 h-4 text-purple-500 animate-pulse" />
              <span>{Math.floor(secondsElapsed / 60)}:{(secondsElapsed % 60).toString().padStart(2, '0')}</span>
            </div>
          ) : (
            <div className="bg-zinc-50 border border-zinc-250 text-blue-650 px-3 py-1.5 rounded-lg flex items-center gap-2 font-mono text-xs font-black shadow-inner">
              <Clock className="w-4.5 h-4.5 text-blue-600 animate-pulse" />
              <span>{currentTime}</span>
            </div>
          )}
        </div>
      </header>

      <div className="flex-grow overflow-hidden flex flex-col p-4 md:p-6 gap-6">
        {!selectedOrderId ? (
          
          <div className="flex-grow flex flex-col gap-6 overflow-hidden select-none">
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0">
              
              <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between shadow-sm min-h-[170px]">
                <div className="absolute right-6 bottom-3 text-zinc-100 pointer-events-none">
                  <ClipboardList className="w-36 h-36 stroke-[0.4]" />
                </div>
                
                <div className="relative z-10 space-y-3">
                  <div>
                    <span className="text-[10px] font-black text-zinc-400 uppercase font-mono block" style={{ letterSpacing: '0.15em' }}>
                      KONSOLA OPERATORA WMS
                    </span>
                    <h3 className="text-xl md:text-2xl font-black text-zinc-950 mt-1">
                      Witaj ponownie, <span className="text-[#0052CC]">{workerName || "WMS-Robotnik #39"}!</span>
                    </h3>
                  </div>
                  
                  <p className="text-xs text-zinc-650 leading-relaxed max-w-xl">
                    Przed Tobą zestawienie zamówień gotowych do weryfikacji i zabezpieczenia.
                    Wybierz zlecenie z kolejki poniżej, aby otworzyć terminal pakowacza.
                  </p>
                </div>
                
                <div className="relative z-10 flex flex-wrap gap-2.5 mt-5">
                  <span className="px-3 py-1 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-600 font-mono text-[9px] font-bold uppercase tracking-wider">
                    Hala Logistyczna: Sektor C
                  </span>
                  <span className="px-3 py-1 bg-emerald-50/50 border border-emerald-200 rounded-lg text-emerald-700 font-mono text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Waga Pre-Kalibrowana: OK
                  </span>
                </div>
              </div>

              <div className="bg-white border border-zinc-200 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between shadow-sm min-h-[170px]">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-black text-zinc-400 uppercase font-mono block" style={{ letterSpacing: '0.15em' }}>
                        WYDAJNOŚĆ ZMIANY
                      </span>
                      <h3 className="text-base font-black text-zinc-950 mt-1">
                        Raport dzienny
                      </h3>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-650">
                      <Award className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-baseline gap-1 font-mono">
                      <span className="text-3xl font-black text-zinc-950">{kpiStats.packedToday}</span>
                      <span className="text-xs text-zinc-500">/ 30 paczek</span>
                    </div>
                    
                    <div className="w-full h-2.5 bg-zinc-100 border border-zinc-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r ${
                          (kpiStats.packedToday / 30) * 100 < 85
                            ? "from-amber-500 to-orange-500 shadow-[0_0_8px_rgba(245,158,11,0.2)]"
                            : "from-emerald-500 to-teal-500 shadow-[0_0_8px_rgba(16,185,129,0.2)]"
                        } rounded-full transition-all duration-500`}
                        style={{ width: `${Math.min(100, (kpiStats.packedToday / 30) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className={`text-[10px] font-bold ${(kpiStats.packedToday / 30) * 100 < 85 ? 'text-amber-600' : 'text-emerald-700'} flex items-center gap-1 mt-4`}>
                  <span className="text-xs font-sans">📈</span>
                  Cel dzienny zmiany wyrobiony w {Math.min(100, Math.round((kpiStats.packedToday / 30) * 100))}%
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center border-b border-zinc-200 pb-2">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4.5 h-4.5 text-[#0052CC]" />
                <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900">
                  Kolejka zleceń do pakowania ({activeOrders.length})
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded border border-zinc-200 bg-white text-zinc-500 font-mono text-[9px] font-bold uppercase tracking-wider">
                Stan bufora: dopuszczalny
              </span>
            </div>

            <div className="flex-grow overflow-y-auto pr-1">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {activeOrders.length === 0 ? (
                  <div className="col-span-3 bg-white border border-dashed border-zinc-250 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-4">
                    <ClipboardList className="w-16 h-16 text-zinc-300" />
                    <p className="text-sm font-bold text-zinc-500">Brak zleceń oczekujących na spakowanie.</p>
                    <span className="text-xs text-zinc-400">Wszystkie skompletowane zlecenia zostały już wysłane.</span>
                  </div>
                ) : (
                  activeOrders.map(order => {
                     const itemsCount = (order.items || []).reduce((sum, i) => sum + (i.quantity || i.qty || 0), 0);
                     return (
                      <div 
                        key={order.id} 
                        className="bg-white border border-zinc-200 rounded-2xl p-5 flex flex-col justify-between gap-5 hover:border-[#0052CC]/40 hover:shadow-lg hover:shadow-blue-50/20 transition-all shadow-sm"
                      >
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="px-2.5 py-1 rounded border border-blue-200 bg-blue-50/50 text-[#0052CC] font-mono text-[10px] font-extrabold uppercase tracking-wide">
                              {order.id}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-600 font-mono text-[8px] font-extrabold uppercase tracking-widest animate-pulse">
                              Skompletowane
                            </span>
                          </div>

                          <h4 className="text-base font-black text-zinc-900 leading-tight">
                            {order.customer || order.customerName || "Klient detaliczny"}
                          </h4>

                          <div className="space-y-2">
                            <span className="text-[9px] font-bold text-zinc-400 uppercase font-mono block tracking-wider">
                              Artykuły ({itemsCount} szt.):
                            </span>
                            <ul className="space-y-1.5 text-xs text-zinc-650">
                              {(order.items || []).map((item, idx) => (
                                <li key={idx} className="flex items-baseline gap-2 font-sans font-semibold text-xs">
                                  <span className="font-mono text-[#0052CC] font-extrabold text-sm shrink-0">
                                    {item.quantity || item.qty}x
                                  </span>
                                  <span className="truncate text-zinc-700">
                                    {item.product || item.name}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <button
                          onClick={() => handleStartPacking(order.id)}
                          className="w-full h-11 bg-[#0052CC] hover:bg-[#0041a3] active:scale-[0.98] text-white text-xs font-display font-black uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow transition-all shrink-0"
                        >
                          <Play className="w-3.5 h-3.5 fill-white text-white" />
                          ROZPOCZNIJ PAKOWANIE
                        </button>
                      </div>
                     );
                  })
                )}
              </div>
            </div>
          </div>
        ) : (
          
          <div className="flex-grow flex flex-col lg:flex-row gap-6 overflow-hidden">
            
            <div className="flex-grow flex flex-col gap-6 overflow-y-auto pr-1">
              
              <div className="bg-white p-4 border border-zinc-200 rounded-xl flex justify-between items-center shrink-0 shadow-sm">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400 font-mono uppercase">Pakowanie Zlecenia</span>
                    <span className="font-mono text-sm font-black text-zinc-900">{selectedOrder.id}</span>
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Klient: <span className="text-zinc-800 font-semibold">{selectedOrder.customer || selectedOrder.customerName}</span>
                  </p>
                </div>
                <button
                  onClick={() => { sounds.playBeep(); setSelectedOrderId(null); }}
                  className="px-3 py-1.5 bg-zinc-50 hover:bg-red-50 hover:text-red-655 text-zinc-650 text-[10px] font-display font-bold uppercase rounded border border-zinc-200 transition-all cursor-pointer"
                >
                  Zamknij sesję
                </button>
              </div>

              <div className="bg-white border border-zinc-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-50 border border-purple-200 text-purple-650 rounded-lg flex items-center justify-center animate-pulse">
                    <Barcode className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-zinc-900 tracking-wide flex items-center gap-2">
                      DETEKTOR LASEROWY WERYFIKACJI
                      <span className="px-1.5 py-0.5 bg-purple-50 border border-purple-200 text-purple-700 font-mono text-[8px] rounded uppercase font-bold tracking-widest animate-pulse">
                        Aktywny
                      </span>
                    </h4>
                    <p className="text-[10px] text-zinc-500">Zeskanuj SKU towaru czytnikiem laserowym lub wpisz ręcznie.</p>
                  </div>
                </div>
                {isUserAdminOrManager && (
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={handleGlobalScanPrompt}
                      className="flex-1 sm:flex-none h-10 px-4 bg-purple-50/50 border border-purple-200 hover:bg-purple-50 text-purple-700 text-xs font-bold uppercase rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <Barcode className="w-4 h-4" />
                      Wpisz kod SKU (Test)
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
                <div className="p-3 bg-zinc-50 border-b border-zinc-200 flex justify-between items-center">
                  <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 font-display">Pozycje do weryfikacji i pakowania</h4>
                  <span className="text-[10px] bg-white border border-zinc-200 px-2 py-0.5 rounded font-mono text-zinc-500">
                    Wszystkie sztuki: {(selectedOrder.items || []).reduce((s, i) => s + (i.quantity || i.qty || 0), 0)}
                  </span>
                </div>
                
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 text-zinc-500 font-bold bg-zinc-50/50">
                      <th className="px-4 py-2.5">SKU</th>
                      <th className="px-4 py-2.5">Nazwa towaru</th>
                      <th className="px-4 py-2.5 text-right">Ilość (szt.)</th>
                      <th className="px-4 py-2.5 text-center">Stan / Weryfikacja</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-150 font-mono text-zinc-800">
                    {(selectedOrder.items || []).map((item, idx) => {
                      const itemStatus = packedItems[item.sku] || { qty: 0, finalized: false };
                      const targetQty = item.quantity || item.qty || 0;
                      const isFocused = focusedSku === item.sku;
                      return (
                        <tr 
                          key={item.sku || idx} 
                          onClick={(e) => {
                            e.stopPropagation(); 
                            handleRowClick(item.sku);
                          }}
                          className={`cursor-pointer transition-colors border-l-4 ${
                            isFocused 
                              ? 'bg-purple-50/60 border-purple-500 shadow-sm' 
                              : itemStatus.finalized
                                ? 'bg-emerald-50/20 border-emerald-500/30 hover:bg-zinc-50/50'
                                : 'border-transparent hover:bg-zinc-50/50'
                          }`}
                        >
                          <td className="px-4 py-3 font-bold text-[#0052CC] select-none">{item.sku}</td>
                          
                          <td className="px-4 py-3 font-sans font-semibold text-zinc-900 relative">
                            <div className="flex flex-col gap-1">
                              <span className={`transition-all ${isFocused ? 'text-purple-700 font-extrabold' : ''}`}>{item.product || item.name}</span>
                              {isFocused && (
                                <div 
                                  onClick={(e) => e.stopPropagation()} 
                                  className="mt-2 flex items-center justify-center gap-4 bg-white border border-purple-200 rounded-lg p-2 max-w-[200px] shadow-sm select-none"
                                >
                                  <button
                                    type="button"
                                    onClick={() => handleManualAdjustQty(item.sku, -1)}
                                    className="w-8 h-8 rounded-full bg-red-50 border border-red-200 hover:bg-red-100 text-red-655 font-black flex items-center justify-center transition-all cursor-pointer text-lg active:scale-90"
                                    title="Zmniejsz o 1 szt."
                                  >
                                    -
                                  </button>
                                  
                                  <span className="text-lg font-black text-purple-700 font-mono min-w-[32px] text-center">
                                    {itemStatus.qty}
                                  </span>
                                  
                                  {itemStatus.qty < targetQty ? (
                                    <button
                                      type="button"
                                      onClick={() => handleManualAdjustQty(item.sku, 1)}
                                      className="w-8 h-8 rounded-full bg-emerald-550 border border-emerald-250 hover:bg-emerald-100 text-emerald-700 font-black flex items-center justify-center transition-all cursor-pointer text-lg active:scale-90"
                                      title="Zwiększ o 1 szt."
                                    >
                                      +
                                    </button>
                                  ) : (
                                    <div 
                                      className="w-8 h-8 opacity-20 border border-zinc-200 rounded-full flex items-center justify-center text-zinc-400 font-bold text-lg select-none cursor-not-allowed"
                                      title="Osiągnięto limit (Możesz tylko usunąć)"
                                    >
                                      +
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                          
                          <td className="px-4 py-3 text-right font-bold font-mono select-none">
                            <span className={
                              itemStatus.finalized 
                                ? "text-emerald-600 font-black text-sm" 
                                : itemStatus.qty > 0 
                                  ? "text-purple-650 text-sm" 
                                  : "text-zinc-400"
                            }>
                              {itemStatus.qty}
                            </span>
                            <span className="text-zinc-400 font-medium"> / {targetQty}</span>
                          </td>
                          
                          <td className="px-4 py-3 text-center">
                            {itemStatus.qty === 0 ? (
                              <div className="flex items-center justify-center gap-2 select-none">
                                <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Oczekuje na skan</span>
                              </div>
                            ) : !itemStatus.finalized ? (
                              <div className="flex items-center justify-center gap-2.5">
                                <span className="px-2 py-0.5 bg-purple-50 border border-purple-200 text-purple-700 rounded text-[9px] uppercase font-extrabold tracking-widest animate-pulse select-none">
                                  Weryfikacja...
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleFinalizePackItem(item.sku);
                                  }}
                                  className="px-2 py-0.5 bg-purple-600 hover:bg-purple-700 text-white text-[9px] font-black uppercase rounded cursor-pointer transition-all active:scale-95"
                                >
                                  Spakuj
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-2 select-none">
                                <span className="px-2 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded text-[9px] uppercase font-extrabold tracking-widest inline-flex items-center gap-1 shadow-sm">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> SPAKOWANE (OK)
                                </span>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 font-display">Krok 1: Wybór opakowania kartonowego</h4>
                
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
                            ? 'bg-purple-50/50 border-purple-500 shadow-sm ring-1 ring-purple-500/20' 
                            : 'bg-white border-zinc-200 hover:border-zinc-350'
                        }`}
                      >
                        <div className="flex justify-between items-center w-full">
                          <box.icon className={`w-6 h-6 ${isSelected ? 'text-purple-650' : 'text-zinc-400'}`} />
                          {isSelected && (
                            <span className="w-4 h-4 bg-purple-600 rounded-full flex items-center justify-center text-white text-[8px] font-bold">✓</span>
                          )}
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-zinc-900 uppercase tracking-wider leading-none mb-1">{box.name}</h5>
                          <p className="text-[10px] text-zinc-500 leading-tight font-sans font-normal">{box.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="w-full lg:w-80 shrink-0 flex flex-col gap-6">
              
              <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 font-display">Krok 2: Odczyt wagi paczki</h4>
                
                <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-5 flex flex-col items-center justify-center gap-1.5 shadow-inner">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase">Kalibracja Wagi Magazynowej</span>
                  <div className="text-3xl font-black font-mono tracking-tight text-zinc-950 leading-none flex items-baseline gap-1 mt-1">
                    {weightKg.toFixed(2)} <span className="text-sm font-semibold text-purple-650">kg</span>
                  </div>
                  <span className={`text-[8px] px-1.5 py-0.5 rounded font-extrabold uppercase font-mono mt-1 ${
                    isWeightCalibrated 
                      ? 'bg-emerald-50 border border-emerald-250 text-emerald-700' 
                      : 'bg-amber-50 border border-amber-250 text-amber-700 font-semibold'
                  }`}>
                    {isWeightCalibrated ? 'TARA / STABILNA' : 'NIEZATWIERDZONA'}
                  </span>
                </div>

                {!isWeightCalibrated ? (
                  <button
                    onClick={handleReadScaleWeight}
                    className="w-full h-11 bg-purple-600 hover:bg-purple-700 text-white font-display font-black text-xs uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow active:scale-[0.98] transition-all"
                  >
                    <Scale className="w-4 h-4" />
                    ZATWIERDŹ WAGĘ PACZKI
                  </button>
                ) : (
                  <div className="h-11 bg-emerald-50 border border-emerald-250 rounded-lg flex items-center justify-center text-emerald-700 text-xs font-bold gap-1.5">
                    <Check className="w-4 h-4" />
                    Waga zatwierdzona pomyślnie
                  </div>
                )}
              </div>

              <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-4 flex-grow flex flex-col justify-between">
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 border-b border-zinc-200 pb-2 font-display">Krok 3: Weryfikacja wysyłkowa</h4>
                  
                  <div className="flex flex-col gap-3">
                    {!isCartonScanned ? (
                      <button
                        onClick={handleScanCartonCode}
                        className="w-full h-11 bg-zinc-550 hover:bg-zinc-100 border border-zinc-250 text-zinc-800 text-xs font-display font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
                      >
                        <Barcode className="w-4 h-4 text-purple-650" />
                        SKANUJ KOD KARTONU
                      </button>
                    ) : (
                      <div className="h-11 bg-emerald-50 border border-emerald-250 rounded-lg flex items-center justify-center text-emerald-700 text-xs font-bold gap-1.5">
                        <Check className="w-4 h-4" />
                        Karton zweryfikowany (OK)
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-200 mt-4">
                  {(() => {
                    const isAllComplete = isWeightCalibrated && isCartonScanned && areAllItemsPacked;
                    return (
                      <button
                        onClick={handleStartDispatchProcessing}
                        disabled={!isAllComplete}
                        className={`w-full h-13 rounded-xl font-display font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2.5 transition-all ${
                          isAllComplete 
                            ? 'bg-[#0052CC] hover:bg-[#0041a3] text-white shadow-lg cursor-pointer active:scale-[0.98]' 
                            : 'bg-zinc-100 text-zinc-400 cursor-not-allowed border border-zinc-200'
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
      
      <footer className="bg-zinc-100 border-t border-zinc-200 px-6 py-3 flex flex-col sm:flex-row items-center justify-between text-[10px] font-mono text-zinc-500 shrink-0 mt-auto select-none gap-2">
        <div>
          © 2026 STACJA PAKOWANIA I WERYFIKACJI v4.5.3 – CENTRALNY INTERFEJS LOGISTYCZNY DPD
        </div>
        <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Wydajne szyfrowanie terminala SSL secured
        </div>
      </footer>
    </div>
  );
}




export function ProcessingOrderScreen({ 
  orderId = "ORD-2023-8891A",
  clientName = "Apex Logistics Europe",
  weight = 12.40,
  cartonSize = "Karton Średni M",
  cartonCode = "BOX-M-ORD-2023-8891A",
  workerName = "SYSTEM ADMIN",
  currentUser = null,
  kpiStats = { packedToday: 18, avgTimeSec: 42 },
  onBack = () => console.log("Powrót"),
  onComplete = () => console.log("Zakończono")
}) {
  
  const [processState, setProcessState] = useState('processing'); 
  const [elapsedTime, setElapsedTime] = useState(0);
  const [toast, setToast] = useState(null);
  
  
  const [stepStates, setStepStates] = useState({
    inventory: 'active',      
    orderStatus: 'pending',    
    courierLabel: 'pending'    
  });

  
  const [currentTime, setCurrentTime] = useState(() => {
    const d = new Date();
    return d.toTimeString().split(' ')[0];
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setCurrentTime(d.toTimeString().split(' ')[0]);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  
  useEffect(() => {
    let timer;
    if (processState === 'processing') {
      timer = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [processState]);

  
  useEffect(() => {
    if (processState !== 'processing') return;

    
    const t1 = setTimeout(() => {
      setStepStates(prev => ({ 
        ...prev, 
        inventory: 'complete', 
        orderStatus: 'active' 
      }));
      showToast("Aktualizacja stanów ERP: Zakończono pomyślnie", "success");

      
      const t2 = setTimeout(() => {
        setStepStates(prev => ({ 
          ...prev, 
          orderStatus: 'complete', 
          courierLabel: 'active' 
        }));
        showToast("Zmieniono status zlecenia na 'Zatwierdzone'", "success");

        
        const t3 = setTimeout(() => {
          setStepStates(prev => ({ 
            ...prev, 
            courierLabel: 'failed' 
          }));
          setProcessState('error');
          sounds.playError();
          showToast("Błąd API: Przekroczono limit czasu połączenia!", "error");
        }, 1800);

        return () => clearTimeout(t3);
      }, 1500);

      return () => clearTimeout(t2);
    }, 1200);

    return () => clearTimeout(t1);
  }, [processState]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleRetry = () => {
    sounds.playBeep();
    setProcessState('processing');
    setStepStates({
      inventory: 'complete',
      orderStatus: 'complete',
      courierLabel: 'active'
    });
    showToast("Ponowna autoryzacja SSL. Generowanie żądania...", "info");

    setTimeout(() => {
      setStepStates(prev => ({ 
        ...prev, 
        courierLabel: 'complete' 
      }));
      setProcessState('success');
      sounds.playSuccess();
      showToast("Pomyślnie wygenerowano list przewozowy DPD", "success");
    }, 2000);
  };

  const handleResetSimulation = () => {
    sounds.playBeep();
    setProcessState('processing');
    setStepStates({
      inventory: 'active',
      orderStatus: 'pending',
      courierLabel: 'pending'
    });
    setElapsedTime(0);
    showToast("Zrestartowano proces weryfikacji", "info");
  };

  const handleLocalPrintLabel = () => {
    sounds.playSuccess();
    alert(`Zlecono wydruk etykiety Zebra dla zlecenia ${orderId}. Waga: ${weight.toFixed(2)} kg.`);
  };

  const handleFinalizeAndCompleteOrder = () => {
    sounds.playSuccess();
    onComplete({
      orderId,
      clientName,
      weight,
      cartonSize,
      cartonCode
    });
  };

  return (
    <div className="w-full min-h-screen bg-[#f4f6f9] text-zinc-800 flex flex-col font-sans select-none">
      
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg border shadow-2xl flex items-center gap-2.5 max-w-sm ${
          toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
          toast.type === 'info' ? 'bg-blue-50 border-blue-200 text-blue-800' :
          'bg-emerald-50 border-emerald-250 text-emerald-800'
        }`}>
          {toast.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          )}
          <span className="text-xs font-semibold">{toast.msg}</span>
        </div>
      )}

      <header className="bg-white border-b border-zinc-200 px-4 py-3 flex items-center justify-between shadow-sm shrink-0 w-full">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-1.5 hover:bg-zinc-50 text-purple-650 hover:text-purple-800 rounded-full transition-all cursor-pointer border border-purple-200"
            title="Anuluj i wróć do sesji pakowania"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-sm font-black uppercase tracking-wider text-zinc-900">Stacja Pakowania i Weryfikacji</h2>
            </div>
            <p className="text-[10px] font-mono text-zinc-500 uppercase flex items-center gap-1.5 mt-0.5">
              <User className="w-3 h-3 text-zinc-400" />
              Zalogowano: <span className="text-zinc-800 font-bold">{workerName}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-right">
          <div className="hidden md:block">
            <span className="text-[8px] font-mono text-zinc-500 uppercase block tracking-wider font-bold">Spakowane Dziś</span>
            <span className="text-xs font-black font-mono text-[#0052CC] leading-none mt-0.5 block">{kpiStats.packedToday} paczek</span>
          </div>
          
          <div className="hidden md:block">
            <span className="text-[8px] font-mono text-zinc-500 uppercase block tracking-wider font-bold">Śr. Czas Pakowania</span>
            <span className="text-xs font-black font-mono text-purple-655 leading-none mt-0.5 block">{kpiStats.avgTimeSec}s / paczka</span>
          </div>
          
          <div className="hidden md:block">
            <span className="text-[8px] font-mono text-zinc-500 uppercase block tracking-wider font-bold">Dokładność</span>
            <span className="text-xs font-black font-mono text-emerald-600 leading-none mt-0.5 block">99.4%</span>
          </div>
          
          <div className="bg-zinc-50 border border-zinc-250 text-blue-650 px-3 py-1.5 rounded-lg flex items-center gap-2 font-mono text-xs font-black shadow-inner">
            <Clock className="w-4.5 h-4.5 text-blue-600 animate-pulse" />
            <span>{currentTime}</span>
          </div>
        </div>
      </header>

      <div className="flex-grow flex flex-col p-4 md:p-6 gap-6 items-center justify-start max-w-6xl mx-auto w-full">
        
        <div className="w-full max-w-4xl mt-2 mb-2 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-[9px] font-black tracking-widest text-[#0052CC] uppercase font-mono block">
              FINALIZACJA ETYKIETY WYSYŁKOWEJ DPD
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-zinc-950 tracking-tight mt-1">Przetwarzanie Zlecenia / Processing Order</h2>
            <p className="font-mono text-zinc-500 text-xs mt-1">
              Numer identyfikacyjny ERP: <span className="text-[#0052CC] font-bold tracking-wide">{orderId}</span>
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <span className="text-[10px] uppercase font-bold text-zinc-500 font-mono">Stan Przetwarzania: </span>
            <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
              processState === 'error' ? 'bg-red-50 text-red-750 border-red-200' :
              processState === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-250 shadow-sm' :
              'bg-white text-purple-700 border-purple-200 animate-pulse'
            }`}>
              {processState === 'error' ? "Błąd Autoryzacji" : processState === 'success' ? "UKOŃCZONE" : `W TOKU (API)`}
            </span>
          </div>
        </div>

        <div className="w-full max-w-4xl bg-white border border-zinc-200 rounded-2xl shadow-xl overflow-hidden flex flex-col lg:flex-row min-h-[460px]">
          
          <div className="w-full lg:w-[45%] p-6 sm:p-8 bg-zinc-50 border-r border-zinc-200 flex flex-col justify-center items-center">
            
            {processState === 'processing' && (
              <div className="flex flex-col items-center justify-center text-center space-y-5 animate-fadeIn">
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <svg className="absolute w-full h-full text-purple-600 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.1"></circle>
                    <path d="M12 2a10 10 0 0 1 10 10" className="stroke-[3] text-purple-500"></path>
                  </svg>
                  <div className="w-16 h-16 rounded-full bg-white border border-zinc-200 flex items-center justify-center shadow-inner">
                    <Truck className="w-7 h-7 text-[#0052CC] animate-bounce" />
                  </div>
                </div>
                
                <div>
                  <h3 className="text-base font-black text-zinc-950 uppercase tracking-wide">
                    Generowanie etykiety kurierskiej
                  </h3>
                  <p className="text-[10px] text-zinc-500 uppercase font-mono tracking-widest mt-1.5">
                    UPŁYNĘŁO: <span className="text-[#0052CC] font-bold">{elapsedTime}s</span>
                  </p>
                </div>
                
                <p className="text-xs text-zinc-500 leading-relaxed max-w-[240px]">
                  Trwa aktualizacja bazy danych ERP oraz przesyłanie gabarytów opakowania ({weight.toFixed(2)} kg) do bramki DPD API.
                </p>
              </div>
            )}

            {processState === 'error' && (
              <div className="flex flex-col items-center justify-center text-center space-y-5 animate-fadeIn">
                <div className="w-20 h-20 rounded-full bg-red-50 border border-red-200 text-red-655 flex items-center justify-center shadow-sm animate-pulse">
                  <AlertTriangle className="w-9 h-9 stroke-[2.5]" />
                </div>
                
                <div>
                  <h3 className="text-base font-black text-red-700 uppercase tracking-wide">
                    Błąd Autoryzacji Bramki
                  </h3>
                  <span className="px-2 py-0.5 bg-red-50 border border-red-200 rounded font-mono text-[8px] text-red-750 uppercase tracking-widest font-bold mt-1.5 inline-block">
                    DPD-API Timeout (Error)
                  </span>
                </div>
                
                <p className="text-xs text-zinc-500 leading-relaxed max-w-[240px]">
                  Serwer integracyjny DPD nie zgłosił pomyślnego zwrotu dla przesyłki o kodzie referencyjnym {orderId} z powodu przekroczenia limitu czasu (Wymagany protokół SSL).
                </p>
              </div>
            )}

            {processState === 'success' && (
              <div className="w-full flex flex-col items-center justify-center gap-4 animate-fadeIn">
                <span className="text-[10px] font-mono text-emerald-700 font-bold uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  PODGLĄD WYDRUKU (DPD LABEL)
                </span>
                
                <div className="w-full max-w-[280px] bg-white text-slate-900 p-4 rounded-xl border border-slate-300 shadow-2xl flex flex-col gap-3 font-sans leading-none relative select-none">
                  
                  <div className="flex justify-between items-start border-b-2 border-slate-950 pb-2.5">
                    <div>
                      <p className="text-base font-black text-slate-950 tracking-tight">DPD POLSKA</p>
                      <p className="text-[8px] text-slate-600 font-bold uppercase tracking-wider mt-0.5">Domestic Express</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold border border-slate-950 px-1.5 py-0.5">PL-OK</span>
                      <p className="text-[9px] text-slate-700 mt-1 font-bold">Waga: {weight.toFixed(2)} kg</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-[9px] text-slate-800">
                    <p className="font-semibold text-slate-500 uppercase tracking-wider">ODBIORCA / RECIPIENT:</p>
                    <p className="font-bold text-slate-950 text-[10px]">{clientName}</p>
                    <div className="pt-1.5 border-t border-dashed border-slate-350 space-y-1">
                      <p><span className="font-semibold text-slate-550">OPAKOWANIE:</span> <span className="font-bold text-slate-950 uppercase">{cartonSize}</span></p>
                      <p><span className="font-semibold text-slate-550">ID KARTONU:</span> <span className="font-mono text-slate-950 font-bold">{cartonCode}</span></p>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center p-2 bg-white border border-slate-200 rounded gap-1.5 mt-1 select-none pointer-events-none">
                    <div className="flex h-11 w-full justify-between max-w-[210px] shrink-0">
                      {[1,3,1,1,4,2,1,3,1,2,1,3,4,1,2,1,1,3,1,1,4,1,2,1,3,1,1,2,3,4].map((w, idx) => (
                        <div key={idx} className="bg-slate-950" style={{ width: `${w * 1.3}px` }} />
                      ))}
                    </div>
                    <p className="font-mono text-[9px] font-bold text-slate-900 tracking-[0.18em]">
                      *DPD20260528{orderId.replace('-', '')}PL*
                    </p>
                  </div>

                  <button
                    onClick={handleLocalPrintLabel}
                    className="w-full py-2 bg-slate-950 hover:bg-slate-850 active:scale-[0.98] text-white font-bold text-[10px] tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer uppercase shadow"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Drukuj etykietę (Zebra)
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="w-full lg:w-[55%] p-6 sm:p-8 flex flex-col justify-between gap-6">
            
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-zinc-200 pb-2">
                <h4 className="text-[10px] uppercase font-black tracking-widest text-zinc-400 font-mono">
                  Przebieg Procesu (Execution Sequence)
                </h4>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleResetSimulation}
                    className="text-[9px] font-bold text-purple-750 hover:text-purple-900 flex items-center gap-1 cursor-pointer transition-all bg-purple-50 border border-purple-200 px-2 py-0.5 rounded"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Resetuj Symulację
                  </button>
                </div>
              </div>

              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-mono text-[10px] border ${
                    stepStates.inventory === 'complete' ? 'bg-emerald-50 border-emerald-250 text-emerald-700 shadow-sm' : 'bg-zinc-50 border-zinc-200 text-zinc-405'
                  }`}>
                    {stepStates.inventory === 'complete' ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <span>1</span>}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <h5 className="font-bold text-xs text-zinc-900">Aktualizacja stanów magazynowych (WMS/ERP)</h5>
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">Ukończono</span>
                    </div>
                    <p className="text-[11px] text-zinc-500">Korygowanie stanu magazynowego na lokacji fizycznej zlecenia.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-mono text-[10px] border ${
                    stepStates.orderStatus === 'complete' ? 'bg-emerald-50 border-emerald-250 text-emerald-700 shadow-sm' :
                    stepStates.orderStatus === 'active' ? 'bg-white border-purple-400 text-purple-600 animate-pulse' : 'bg-zinc-50 border-zinc-200 text-zinc-405'
                  }`}>
                    {stepStates.orderStatus === 'complete' ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <span>2</span>}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <h5 className="font-bold text-xs text-zinc-900">Weryfikacja kompletacji i zmiana statusu paczki</h5>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider border ${
                        stepStates.orderStatus === 'complete' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                        stepStates.orderStatus === 'active' ? 'bg-purple-50 text-purple-700 border-purple-200 animate-pulse' : 'bg-transparent text-zinc-400 border-transparent'
                      }`}>{stepStates.orderStatus === 'complete' ? "Ukończono" : stepStates.orderStatus === 'active' ? "W toku" : "Oczekuje"}</span>
                    </div>
                    <p className="text-[11px] text-zinc-500">Autoryzacja i zatwierdzenie statusu zamówienia w bazie systemowej.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-mono text-[10px] border ${
                    stepStates.courierLabel === 'complete' ? 'bg-emerald-50 border-emerald-250 text-emerald-700 shadow-sm' :
                    stepStates.courierLabel === 'failed' ? 'bg-red-50 border-red-200 text-red-655' :
                    stepStates.courierLabel === 'active' ? 'bg-white border-purple-400 text-purple-600 animate-pulse' : 'bg-zinc-50 border-zinc-200 text-zinc-405'
                  }`}>
                    {stepStates.courierLabel === 'complete' ? <Check className="w-3.5 h-3.5 stroke-[3]" /> :
                     stepStates.courierLabel === 'failed' ? <AlertCircle className="w-3.5 h-3.5 text-red-500" /> : <span>3</span>}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <h5 className="font-bold text-xs text-zinc-900">Generowanie etykiety kurierskiej kuriera DPD</h5>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider border ${
                        stepStates.courierLabel === 'complete' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        stepStates.courierLabel === 'failed' ? 'bg-red-50 text-red-750 border-red-200' :
                        stepStates.courierLabel === 'active' ? 'bg-purple-50 text-purple-700 border-purple-200 animate-pulse' : 'bg-transparent text-zinc-400 border-transparent'
                      }`}>{stepStates.courierLabel === 'complete' ? "Wygenerowano" : stepStates.courierLabel === 'failed' ? "BŁĄD API" : stepStates.courierLabel === 'active' ? "Wysyłanie" : "Oczekuje"}</span>
                    </div>
                    {stepStates.courierLabel === 'failed' ? (
                      <p className="text-[11px] text-red-655 font-semibold font-mono">Courier API Connection Timeout. Serwer 'DPD-PROD-PL-01' nie odpowiedział w oczekiwanym oknie 30000ms.</p>
                    ) : (
                      <p className="text-[11px] text-zinc-500">Łączenie z serwerem zewnętrznym kuriera DPD w celu wygenerowania listu przewozowego.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-200">
              
              {processState === 'error' && (
                <div className="p-4 border border-red-200 rounded-xl bg-red-50/50 flex flex-col gap-4 animate-slideIn">
                  <div>
                    <h6 className="font-bold text-xs text-red-750 uppercase tracking-wider">Generowanie listu przewozowego skończyło się błędem</h6>
                    <p className="text-[11px] text-zinc-500 mt-1">
                      Połączenie z serwerem DPD wygasło. Spróbuj ponownie autoryzować SSL lub skorzystaj z infolinii wsparcia technicznego.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={handleRetry}
                      className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-550 hover:from-red-550 hover:to-red-400 text-white text-xs font-black uppercase tracking-wider rounded-lg flex items-center gap-2 cursor-pointer shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all"
                    >
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Spróbuj Ponownie (Retry)
                    </button>
                    <button
                      onClick={() => alert("Telefon wsparcia WMS-IT: +48 22 555 18 18 (Czynny 24/7)")}
                      className="px-4 py-2.5 bg-white hover:bg-zinc-50 border border-zinc-250 text-zinc-700 text-xs font-bold rounded-lg flex items-center gap-2 cursor-pointer transition-all"
                    >
                      Skontaktuj się z Pomocą
                    </button>
                  </div>
                </div>
              )}

              {processState === 'success' && (
                <div className="p-4 border border-emerald-200 rounded-xl bg-emerald-50/30 flex flex-col gap-4 animate-slideIn">
                  <div>
                    <h6 className="font-bold text-xs text-emerald-800 uppercase tracking-wider">Proces zakończony sukcesem</h6>
                    <p className="text-[11px] text-zinc-500 mt-1">
                      List przewozowy DPD został poprawnie wygenerowany i wysłany do bufora Zebra. Zatwierdź paczkę, aby przenieść zlecenie do statusu 'WYSŁANE'.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={handleFinalizeAndCompleteOrder}
                      className="px-5 py-3 bg-gradient-to-r from-emerald-600 to-emerald-550 hover:from-emerald-550 hover:to-emerald-400 text-white text-xs font-black uppercase tracking-widest rounded-xl flex items-center gap-2.5 cursor-pointer shadow-md hover:scale-[1.01] active:scale-[0.98] transition-all"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      ZATWIERDŹ I ZAMKNIJ ZLECENIE
                    </button>
                  </div>
                </div>
              )}

              {processState !== 'success' && (
                <div className="flex justify-end mt-4">
                  <button 
                    onClick={onBack}
                    className="border border-zinc-250 hover:bg-zinc-50 bg-white text-zinc-750 font-bold px-4 py-2.5 rounded-lg text-xs uppercase tracking-wider cursor-pointer transition-all"
                  >
                    Anuluj / Wróć
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
