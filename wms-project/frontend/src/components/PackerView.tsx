import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Barcode, Play, CheckCircle2, AlertTriangle, Layers, 
  Check, RefreshCw, Box, Printer, Scale, Timer, Award, 
  User, Clock, RotateCcw, AlertCircle, Truck
} from 'lucide-react';
import { sounds } from './SoundEffects';
import { defaultImages } from '../data/warehouseData';

interface PackerViewProps {
  orders: any[];
  onUpdateOrder: (id: string, updates: any) => void;
  workerName: string;
  currentUser: any;
  onBackToMenu: () => void;
}

export function PackerView({ orders, onUpdateOrder, workerName, currentUser, onBackToMenu }: PackerViewProps) {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [cartonSize, setCartonSize] = useState('Carton-M'); 
  const [weightKg, setWeightKg] = useState(3.45);
  const [isGiftConfirmed, setIsGiftConfirmed] = useState(false);
  const [isWeightCalibrated, setIsWeightCalibrated] = useState(true);
  const [isCartonScanned, setIsCartonScanned] = useState(true);
  const [kpiStats, setKpiStats] = useState({ packedToday: 18, avgTimeSec: 42 });
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [packedItems, setPackedItems] = useState<Record<string, { qty: number; finalized: boolean }>>({}); 
  const [processingOrderData, setProcessingOrderData] = useState<any | null>(null);
  const [packedPromptOrder, setPackedPromptOrder] = useState<any | null>(null);

  // Replacement for blocking alerts & prompts
  const [localToast, setLocalToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isSkuModalOpen, setIsSkuModalOpen] = useState(false);
  const [skuModalInput, setSkuModalInput] = useState('');
  const [isCartonModalOpen, setIsCartonModalOpen] = useState(false);
  const [cartonModalInput, setCartonModalInput] = useState('');
  const [shouldSimulateApiError, setShouldSimulateApiError] = useState(false);

  // Product images state & fallbacks
  const [productImages] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem('wms-product-images');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const getProductImage = (sku: string) => {
    return productImages[sku] || defaultImages[sku] || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&q=80';
  };

  const showLocalToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setLocalToast({ msg, type });
    setTimeout(() => setLocalToast(null), 4500);
  };

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

  const activeOrders = orders.filter(o => o.status === 'Oczekuje na pakowanie' || o.status === 'Spakowane');
  const selectedOrder = orders.find(o => o.id === selectedOrderId);

  const areAllItemsPacked = selectedOrder 
    ? (selectedOrder.items || []).every((item: any) => {
        const pStatus = packedItems[item.sku];
        return pStatus && pStatus.finalized && pStatus.qty === (item.quantity || item.qty);
      })
    : false;

  // Auto-dispatch when all items are packed
  useEffect(() => {
    if (selectedOrderId && selectedOrder && areAllItemsPacked && !processingOrderData) {
      const timer = setTimeout(() => {
        handleStartDispatchProcessing();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [areAllItemsPacked, selectedOrderId, selectedOrder, processingOrderData]);

  const [focusedSku, setFocusedSku] = useState<string | null>(null);

  const proceedWithPacking = (orderId: string) => {
    setSelectedOrderId(orderId);
    setCartonSize('Carton-M');
    setWeightKg(parseFloat((2.5 + Math.random() * 8).toFixed(2))); 
    setIsWeightCalibrated(true);
    setIsCartonScanned(true);
    setSecondsElapsed(0);
    setPackedItems({}); 
    setFocusedSku(null); 
  };

  const handleStartPacking = (orderId: string) => {
    sounds.playSuccess();
    const order = orders.find(o => o.id === orderId);
    if (order && order.isPacked) {
      setPackedPromptOrder(order);
    } else {
      proceedWithPacking(orderId);
    }
  };

  const handleRetryLabelGeneration = (order: any) => {
    sounds.playSuccess();
    setSelectedOrderId(order.id);
    setCartonSize('Carton-M');
    const weight = parseFloat((2.5 + Math.random() * 8).toFixed(2));
    setWeightKg(weight);
    setIsWeightCalibrated(true);
    setIsCartonScanned(true);
    setProcessingOrderData({
      orderId: order.id,
      clientName: order.customer || order.customerName || "Klient detaliczny",
      weight: weight,
      cartonSize: 'Karton Średni M',
      cartonCode: `BOX-M-${order.id}`
    });
    setPackedPromptOrder(null);
  };

  const handleRowClick = (sku: string) => {
    const item = (selectedOrder?.items || []).find((i: any) => i.sku === sku);
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
        // Dla zwykłych pracowników kliknięcie wiersza otwiera modal ręcznego wpisu SKU z pre-definiowanym kodem towaru
        sounds.playBeep();
        setSkuModalInput(sku);
        setIsSkuModalOpen(true);
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

  const handleProcessGlobalScan = (scannedSku: string) => {
    sounds.playBeep();
    const cleanSku = scannedSku.toUpperCase().trim();
    
    if (!selectedOrder) return;
    
    const matchedItem = (selectedOrder.items || []).find((item: any) => item.sku.toUpperCase().trim() === cleanSku);
    
    if (!matchedItem) {
      sounds.playError();
      showLocalToast(`BŁĄD SKANOWANIA! Towar o kodzie SKU "${scannedSku}" nie należy do tego zlecenia!`, 'error');
      return;
    }
    
    const sku = matchedItem.sku;
    const currentStatus = packedItems[sku] || { qty: 0, finalized: false };
    const targetQty = matchedItem.quantity || matchedItem.qty || 0;
    
    if (currentStatus.finalized) {
      sounds.playError();
      showLocalToast(`Towar SKU "${sku}" został już oznaczony jako spakowany!`, 'error');
      return;
    }

    if (currentStatus.qty >= targetQty) {
      sounds.playError();
      showLocalToast(`BŁĄD: Ilość dla SKU "${sku}" została już w pełni zweryfikowana!`, 'error');
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
      setFocusedSku(null);
    } else {
      setFocusedSku(sku);
    }
  };

  const handleGlobalScanPrompt = () => {
    sounds.playBeep();
    setSkuModalInput('SKU-');
    setIsSkuModalOpen(true);
  };

  const handleManualAdjustQty = (sku: string, delta: number) => {
    sounds.playBeep();
    const targetItem = (selectedOrder?.items || []).find((item: any) => item.sku === sku);
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

  const handleFinalizePackItem = (sku: string) => {
    sounds.playSuccess();
    const targetItem = (selectedOrder?.items || []).find((item: any) => item.sku === sku);
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
  }, [selectedOrderId, selectedOrder, packedItems]);

  const handleReadScaleWeight = () => {
    sounds.playBeep();
    setIsWeightCalibrated(true);
    sounds.playSuccess();
  };

  const handleScanCartonCode = () => {
    sounds.playBeep();
    setCartonModalInput(`BOX-${Math.floor(10000 + Math.random() * 90000)}`);
    setIsCartonModalOpen(true);
  };

  const handleStartDispatchProcessing = () => {
    if (selectedOrder?.giftWrapping && !isGiftConfirmed) {
      sounds.playError();
      showLocalToast('Błąd! Zlecenie wymaga pakowania ozdobnego. Potwierdź pakowanie przyciskiem na panelu prezentowym.', 'error');
      return;
    }
    sounds.playSuccess();
    if (onUpdateOrder && selectedOrderId) {
      onUpdateOrder(selectedOrderId, {
        isPacked: true,
        packedBy: workerName,
        internalNotes: `${selectedOrder?.internalNotes || ''}\n[PACKER]: Spakowano do ${cartonSize === 'Carton-S' ? 'Koperta / Karton S' : cartonSize === 'Carton-L' ? 'Karton Duży L' : 'Karton Średni M'} o wadze ${weightKg.toFixed(2)}kg przez ${workerName}.${
          selectedOrder?.giftWrapping ? ` | 🎁 ZAPAKOWANO NA PREZENT (Styl: ${selectedOrder.giftStyle})` : ''
        }`,
        internalNotesActor: workerName,
      });
    }
    setProcessingOrderData({
      orderId: selectedOrderId,
      clientName: selectedOrder?.customer || selectedOrder?.customerName || "Klient detaliczny",
      weight: weightKg,
      cartonSize: cartonSize === 'Carton-S' ? 'Koperta / Karton S' : cartonSize === 'Carton-L' ? 'Karton Duży L' : 'Karton Średni M',
      cartonCode: `BOX-${cartonSize.replace('Carton-', '')}-${selectedOrderId}`
    });
  };

  const handleCompleteDispatch = (pData: any) => {
    if (onUpdateOrder) {
      const isPickupOrder = selectedOrder?.isPickup;
      onUpdateOrder(pData.orderId, {
        status: isPickupOrder ? 'Gotowe do odbioru' : 'Spakowane',
        isPacked: true,
        packedBy: workerName,
        shippingMethod: isPickupOrder ? 'Odbiór Osobisty' : pData.selectedCourier,
        waybillNumber: isPickupOrder ? (selectedOrder?.pickupCode || 'BOPIS') : pData.waybillNumber,
        internalNotes: `${selectedOrder?.internalNotes || ''}\n[PACKER]: Zweryfikowano i spakowano do ${pData.cartonSize} o wadze ${pData.weight.toFixed(2)}kg przez ${workerName}.${
          isPickupOrder
            ? ` Przygotowano do odbioru osobistego (BOPIS) w HUB-PL-01. PIN: ${selectedOrder?.pickupCode || 'BOPIS'}.`
            : ` Wygenerowano etykietę ${pData.selectedCourier}. Numer listu: ${pData.waybillNumber}.`
        }`,
        internalNotesActor: workerName,
        waybillPdfDate: new Date().toLocaleDateString('pl-PL')
      });
    }
    setSelectedOrderId(null);
    setProcessingOrderData(null);
    setShouldSimulateApiError(false);
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
          setShouldSimulateApiError(false);
        }}
        onComplete={handleCompleteDispatch}
        forceError={shouldSimulateApiError}
        isPickup={selectedOrder?.isPickup}
        pickupCode={selectedOrder?.pickupCode}
      />
    );
  }

  return (
    <div className="w-full flex-grow bg-[#f5f7fa] text-zinc-800 flex flex-col font-sans" onClick={() => setFocusedSku(null)}>
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
              <h2 className="text-sm font-black uppercase tracking-wider text-zinc-900 animate-fadeIn">Stacja Pakowania</h2>
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
          
          <div className="hidden md:block text-right">
            <span className="text-[8px] font-mono text-zinc-400 uppercase block font-bold">Dokładność</span>
            <span className="text-xs font-bold font-mono text-emerald-600">99.4%</span>
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
                <div className="relative z-10 space-y-3">
                  <div>
                    <span className="text-[10px] font-black text-zinc-400 uppercase font-mono block">
                      KONSOLA OPERATORA WMS
                    </span>
                    <h3 className="text-xl md:text-2xl font-black text-zinc-950 mt-1">
                      Witaj ponownie, <span className="text-[#0052CC]">{workerName || "WMS-Robotnik"}!</span>
                    </h3>
                  </div>
                  
                  <p className="text-xs text-zinc-600 leading-relaxed max-w-xl">
                    Przed Tobą zestawienie zamówień gotowych do weryfikacji i zabezpieczenia.
                    Wybierz zlecenie z kolejki poniżej, aby otworzyć terminal pakowacza.
                  </p>
                </div>
                
                <div className="relative z-10 flex flex-wrap gap-2.5 mt-5">
                  <span className="px-3 py-1 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-650 font-mono text-[9px] font-bold uppercase tracking-wider">
                    Hala Logistyczna: Sektor C
                  </span>
                  <span className="px-3 py-1 bg-emerald-50/50 border border-emerald-250 rounded-lg text-emerald-700 font-mono text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Waga Pre-Kalibrowana: OK
                  </span>
                </div>
              </div>

              <div className="bg-white border border-zinc-200 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between shadow-sm min-h-[170px]">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-black text-zinc-400 uppercase font-mono block">
                        WYDAJNOŚĆ ZMIANY
                      </span>
                      <h3 className="text-base font-black text-zinc-950 mt-1 font-display">
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
                            ? "from-amber-500 to-orange-500"
                            : "from-emerald-500 to-teal-500"
                        } rounded-full transition-all duration-500`}
                        style={{ width: `${Math.min(100, (kpiStats.packedToday / 30) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className={`text-[10px] font-bold ${(kpiStats.packedToday / 30) * 100 < 85 ? 'text-amber-600' : 'text-emerald-700'} flex items-center gap-1 mt-4 animate-bounce`}>
                  Cel dzienny zmiany wyrobiony w {Math.min(100, Math.round((kpiStats.packedToday / 30) * 100))}%
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center border-b border-zinc-200 pb-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4.5 h-4.5 text-[#0052CC]" />
                <h3 className="text-sm font-black uppercase tracking-wider text-zinc-950">
                  Kolejka zleceń do pakowania ({activeOrders.length})
                </h3>
              </div>
            </div>

            <div className="flex-grow overflow-y-auto pr-1">
              {activeOrders.length === 0 ? (
                <div className="bg-white border border-dashed border-zinc-250 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-4 shadow-xs">
                  <Box className="w-16 h-16 text-zinc-350 animate-pulse" />
                  <p className="text-sm font-bold text-zinc-500">Brak zleceń oczekujących na spakowanie.</p>
                </div>
              ) : (
                <div className="bg-white border border-zinc-200 rounded-2xl shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-zinc-550/[0.03] text-zinc-400 text-[10px] font-bold border-b border-zinc-200 uppercase tracking-wider font-mono select-none">
                          <th className="py-3.5 px-5">Zamówienie</th>
                          <th className="py-3.5 px-5">Pojemnik</th>
                          <th className="py-3.5 px-5">Zbieracz</th>
                          <th className="py-3.5 px-5">Godzina</th>
                          <th className="py-3.5 px-5">Klient</th>
                          <th className="py-3.5 px-5">Zawartość</th>
                          <th className="py-3.5 px-5 text-right">Akcja</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-150 text-xs font-semibold text-zinc-700">
                        {activeOrders.map((order: any) => {
                          const isPacked = order.status === 'Spakowane';
                          return (
                            <tr 
                              key={order.id} 
                              className="hover:bg-[#0052cc]/[0.02] transition-colors group"
                            >
                              {/* Zamówienie ID */}
                              <td className="py-3.5 px-5 font-mono font-extrabold text-[#0052CC] text-sm">
                                {order.id.startsWith('#') ? order.id : `#${order.id}`}
                              </td>

                              {/* Pojemnik Badge */}
                              <td className="py-3.5 px-5 select-none">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-blue-200 bg-blue-50/40 text-blue-700 font-mono text-[11px] font-black tracking-wide">
                                  <Box className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                  {order.binId || 'BRAK'}
                                </span>
                              </td>

                              {/* Zbieracz (Picker) */}
                              <td className="py-3.5 px-5 font-sans font-bold text-zinc-800">
                                {order.pickedBy || 'System'}
                              </td>

                              {/* Godzina (Time) */}
                              <td className="py-3.5 px-5 font-mono text-zinc-550">
                                {order.pickCompletedTime || '--:--'}
                              </td>

                              {/* Klient */}
                              <td className="py-3.5 px-5 font-medium text-zinc-650 truncate max-w-[150px]" title={order.customer || order.customerName}>
                                {order.customer || order.customerName || 'Klient detaliczny'}
                              </td>

                              {/* Zawartość (Product names) */}
                              <td className="py-3.5 px-5">
                                <div className="text-[11px] text-zinc-500 font-medium max-w-[220px] truncate" title={(order.items || []).map((item: any) => `${item.product || item.name} (${item.quantity || item.qty || 0} szt.)`).join(', ')}>
                                  {(order.items || []).map((item: any) => `${item.product || item.name} (${item.quantity || item.qty || 0})`).join(', ')}
                                </div>
                              </td>

                              {/* Akcja button */}
                              <td className="py-3.5 px-5 text-right select-none">
                                <button
                                  onClick={() => handleStartPacking(order.id)}
                                  className={`h-9 px-4 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer ml-auto border-none shadow-sm transition-all duration-150 active:scale-[0.98] ${
                                    isPacked
                                      ? 'bg-zinc-150 text-zinc-500 border border-zinc-200 hover:bg-zinc-205'
                                      : 'bg-[#0052CC] hover:bg-[#0041a3] text-white hover:shadow-blue-500/10'
                                  }`}
                                >
                                  <Play className="w-3 h-3 fill-current" />
                                  {isPacked ? 'Zapakowane' : 'Zapakuj'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-grow flex flex-col lg:flex-row gap-6 overflow-hidden">
            <div className="flex-grow flex flex-col gap-6 overflow-y-auto pr-1">
              <div className="bg-white p-4 border border-zinc-200 rounded-xl flex justify-between items-center shrink-0 shadow-sm animate-fadeIn">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400 font-mono uppercase">Pakowanie Zlecenia</span>
                    <span className="font-mono text-sm font-black text-zinc-900">{selectedOrder?.id}</span>
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Klient: <span className="text-zinc-800 font-semibold">{selectedOrder?.customer || selectedOrder?.customerName}</span>
                  </p>
                </div>
                <button
                  onClick={() => { sounds.playBeep(); setSelectedOrderId(null); }}
                  className="px-3 py-1.5 bg-zinc-50 hover:bg-red-50 hover:text-red-655 text-zinc-650 text-[10px] font-display font-bold uppercase rounded border border-zinc-200 transition-all cursor-pointer"
                >
                  Zamknij sesję
                </button>
              </div>

              {selectedOrder?.giftWrapping && (
                <div className={`p-4 border-2 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all duration-300 shadow-sm text-left ${
                  isGiftConfirmed 
                    ? 'bg-emerald-50/30 border-emerald-500/40' 
                    : 'bg-gradient-to-r from-red-50/70 to-amber-50/70 border-red-500/60'
                }`}>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🎁</span>
                      <h4 className="text-xs font-black uppercase text-zinc-950 tracking-wider">
                        ZLECENIE PREZENTOWE
                      </h4>
                      <span className="px-2 py-0.5 bg-red-100 border border-red-200 text-red-750 font-mono text-[9px] rounded-md font-bold uppercase tracking-wider">
                        Styl: {selectedOrder?.giftStyle || 'Klasyczny'}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-zinc-400 font-mono font-bold block uppercase">Tekst dedykacji na bilecik okolicznościowy:</span>
                      <blockquote className="border-l-4 border-amber-500 pl-3 py-1 bg-white/60 p-2.5 rounded text-xs font-mono text-zinc-800 italic leading-relaxed max-w-xl">
                        "{selectedOrder?.giftMessage || 'Brak dedykacji (tylko pakowanie)'}"
                      </blockquote>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      sounds.playSuccess();
                      setIsGiftConfirmed(prev => !prev);
                    }}
                    className={`px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-sm active:scale-95 transition-all border-none ${
                      isGiftConfirmed 
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                        : 'bg-red-655 hover:bg-red-750 text-white animate-pulse'
                    }`}
                  >
                    {isGiftConfirmed ? <CheckCircle2 className="w-4 h-4" /> : <span>🎁</span>}
                    {isGiftConfirmed ? 'Potwierdzono' : 'Potwierdź pakowanie'}
                  </button>
                </div>
              )}

              <div className="bg-white border border-zinc-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0 shadow-sm animate-fadeIn">
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
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={handleGlobalScanPrompt}
                      className="flex-1 sm:flex-none h-10 px-4 bg-purple-50/50 border border-purple-200 hover:bg-purple-50 text-purple-700 text-xs font-bold uppercase rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all border-none"
                    >
                      <Barcode className="w-4 h-4" />
                      Wpisz kod SKU ręcznie
                    </button>
                  </div>
              </div>

              <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm animate-fadeIn">
                <div className="p-3 bg-zinc-50 border-b border-zinc-200 flex justify-between items-center">
                  <h4 className="text-xs font-black uppercase tracking-wider text-zinc-950 font-display">Pozycje do weryfikacji i pakowania</h4>
                  <span className="text-[10px] bg-white border border-zinc-200 px-2 py-0.5 rounded font-mono text-zinc-500">
                    Wszystkie sztuki: {(selectedOrder?.items || []).reduce((s: number, i: any) => s + (i.quantity || i.qty || 0), 0)}
                  </span>
                </div>
                
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 text-zinc-500 font-bold bg-zinc-50/50">
                      <th className="px-4 py-2.5 text-center w-24">Zdjęcie</th>
                      <th className="px-4 py-2.5">SKU</th>
                      <th className="px-4 py-2.5">Nazwa towaru</th>
                      <th className="px-4 py-2.5 text-right">Ilość (szt.)</th>
                      <th className="px-4 py-2.5 text-center">Stan / Weryfikacja</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 font-mono text-zinc-800">
                    {(selectedOrder?.items || []).map((item: any, idx: number) => {
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
                          {/* Zdjęcie na samej lewej stronie */}
                          <td className="px-4 py-3 text-center select-none w-24">
                            <div className="w-18 h-18 rounded-lg overflow-hidden border border-zinc-200 bg-zinc-50 flex items-center justify-center mx-auto shadow-sm">
                              {getProductImage(item.sku) ? (
                                <img src={getProductImage(item.sku)} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <Box className="w-8 h-8 text-zinc-350" />
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-3 font-bold text-[#0052CC] select-none">{item.sku}</td>
                          
                          <td className="px-4 py-3 font-sans font-semibold text-zinc-900 relative">
                            <div className="flex flex-col gap-1 text-left">
                              <span className={`transition-all ${isFocused ? 'text-purple-750 font-extrabold' : ''}`}>{item.product || item.name}</span>
                              {isFocused && (
                                <div 
                                  onClick={(e) => e.stopPropagation()} 
                                  className="mt-2 flex items-center justify-center gap-4 bg-white border border-purple-200 rounded-lg p-2 max-w-[200px] shadow-sm select-none"
                                >
                                  <button
                                    type="button"
                                    onClick={() => handleManualAdjustQty(item.sku, -1)}
                                    className="w-8 h-8 rounded-full bg-red-50 border border-red-200 hover:bg-red-100 text-red-655 font-black flex items-center justify-center transition-all cursor-pointer text-lg active:scale-90 border-none"
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
                                      className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-250 hover:bg-emerald-100 text-emerald-700 font-black flex items-center justify-center transition-all cursor-pointer text-lg active:scale-90 border-none"
                                      title="Zwiększ o 1 szt."
                                    >
                                      +
                                    </button>
                                  ) : (
                                    <div 
                                      className="w-8 h-8 opacity-20 border border-zinc-200 rounded-full flex items-center justify-center text-zinc-400 font-bold text-lg select-none cursor-not-allowed"
                                      title="Osiągnięto limit"
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
                                  : "text-zinc-450"
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
                                <span className="px-1.5 py-0.5 bg-purple-50 border border-purple-200 text-purple-700 rounded text-[9px] uppercase font-extrabold tracking-widest animate-pulse select-none">
                                  Weryfikacja...
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleFinalizePackItem(item.sku);
                                  }}
                                  className="px-2 py-0.5 bg-purple-600 hover:bg-purple-700 text-white text-[9px] font-black uppercase rounded cursor-pointer transition-all active:scale-95 border-none"
                                >
                                  Spakuj
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-2 select-none">
                                <span className="px-2 py-1 bg-emerald-50 border border-emerald-250 text-emerald-700 rounded text-[9px] uppercase font-extrabold tracking-widest inline-flex items-center gap-1 shadow-sm">
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

              <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-4 animate-fadeIn">
                <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 font-display">Krok 1: Wybór opakowania kartonowego</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { id: 'Carton-S', name: 'Koperta / Karton S', desc: 'Artykuły małe / dokumenty (do 1 kg)' },
                    { id: 'Carton-M', name: 'Karton Średni M', desc: 'Optymalny dla większości SKU (do 10 kg)' },
                    { id: 'Carton-L', name: 'Karton Duży L', desc: 'Duże gabaryty / ciężkie (do 30 kg)' }
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
                          <Box className={`w-5 h-5 ${isSelected ? 'text-purple-650' : 'text-zinc-400'}`} />
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

            <div className="w-full lg:w-80 shrink-0 flex flex-col gap-6 animate-fadeIn">
              <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-4 flex-grow flex flex-col justify-between">
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 border-b border-zinc-200 pb-2 font-display">Podsumowanie Przesyłki</h4>
                  
                  <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 shadow-inner">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase">Waga paczki</span>
                    <div className="text-3xl font-black font-mono tracking-tight text-zinc-950 leading-none flex items-baseline gap-1 mt-1">
                      {weightKg.toFixed(2)} <span className="text-sm font-semibold text-purple-650">kg</span>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-500 font-medium">Typ opakowania:</span>
                      <span className="font-bold text-zinc-800">
                        {cartonSize === 'Carton-S' ? 'Koperta / Karton S' : cartonSize === 'Carton-L' ? 'Karton Duży L' : 'Karton Średni M'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-500 font-medium">Status pakowania:</span>
                      <span className={`font-bold ${areAllItemsPacked ? 'text-emerald-600' : 'text-amber-600 animate-pulse'}`}>
                        {areAllItemsPacked ? 'Wszystko spakowane ✓' : 'Weryfikacja w toku...'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-200 mt-4">
                  <button
                    onClick={handleStartDispatchProcessing}
                    disabled={!areAllItemsPacked}
                    className={`w-full h-13 rounded-xl font-display font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2.5 transition-all border-none ${
                      areAllItemsPacked 
                        ? 'bg-[#0052CC] hover:bg-[#0041a3] text-white shadow-lg cursor-pointer active:scale-[0.98]' 
                        : 'bg-zinc-100 text-zinc-400 cursor-not-allowed border border-zinc-200'
                    }`}
                  >
                    <Printer className="w-4.5 h-4.5" />
                    DRUKUJ ETYKIETĘ DPD & NADAJ
                  </button>

                  {isUserAdminOrManager && areAllItemsPacked && (
                    <div className="mt-3.5 flex items-center justify-center gap-2 select-none border border-dashed border-purple-200 bg-purple-50/30 rounded-lg py-1.5 px-3">
                      <input
                        type="checkbox"
                        id="simulate-api-error-chk"
                        checked={shouldSimulateApiError}
                        onChange={(e) => setShouldSimulateApiError(e.target.checked)}
                        className="w-4 h-4 text-purple-650 border-zinc-350 rounded focus:ring-purple-550 cursor-pointer"
                      />
                      <label 
                        htmlFor="simulate-api-error-chk" 
                        className="text-[10px] font-bold text-purple-700 uppercase tracking-wide cursor-pointer hover:text-purple-900 font-sans"
                      >
                        🧪 Symuluj błąd API DPD (Test)
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <footer className="bg-zinc-100 border-t border-zinc-250 px-6 py-3 flex flex-col sm:flex-row items-center justify-between text-[10px] font-mono text-zinc-500 shrink-0 mt-auto select-none gap-2">
        <div>
          © 2026 STACJA PAKOWANIA I WERYFIKACJI v4.5.3 – CENTRALNY INTERFEJS LOGISTYCZNY DPD
        </div>
        <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Bezpieczne połączenie SSL secured
        </div>
      </footer>

      {/* LOCAL ALERTS TOAST CARRIER */}
      {localToast && (
        <div className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl border flex items-center gap-3 shadow-2xl ${
          localToast.type === 'error' 
            ? 'bg-red-50 border-red-200 text-red-800' 
            : 'bg-emerald-50 border-emerald-250 text-emerald-800'
        }`}>
          {localToast.type === 'error' ? <AlertCircle className="w-5 h-5 text-red-500" /> : <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
          <span className="text-xs font-bold leading-tight font-sans">{localToast.msg}</span>
        </div>
      )}

      {/* CUSTOM SKU SCANNER MODAL */}
      {isSkuModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-300 rounded-xl w-full max-w-sm shadow-2xl p-5 font-sans" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 text-zinc-900 border-b border-zinc-100 pb-3 mb-4 select-none">
              <Barcode className="w-5 h-5 text-purple-600" />
              <h4 className="font-extrabold text-sm tracking-tight text-zinc-900">Ręczna Symulacja SKU (Weryfikacja)</h4>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (skuModalInput.trim()) {
                handleProcessGlobalScan(skuModalInput.trim());
                setSkuModalInput('');
                setIsSkuModalOpen(false);
              }
            }} className="space-y-4 text-xs text-zinc-700">
              <p className="leading-relaxed font-semibold">
                Zastąpienie skanera radiowego. Wprowadź kod kreskowy SKU towaru, aby zaliczyć pakowanie sztuki:
              </p>

              <div>
                <label className="block text-[10px] font-bold text-zinc-650 uppercase tracking-widest mb-1.5">KOD KRESKOWY SKU</label>
                <input
                  type="text"
                  required
                  placeholder="np. SKU-10492"
                  value={skuModalInput}
                  onChange={(e) => setSkuModalInput(e.target.value)}
                  className="w-full p-2.5 bg-white border border-zinc-300 rounded-xl text-zinc-950 font-mono text-sm uppercase outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 select-none">
                <button
                  type="button"
                  onClick={() => setIsSkuModalOpen(false)}
                  className="px-4 py-2 border border-zinc-300 hover:bg-zinc-50 text-zinc-700 font-bold rounded-lg text-xs cursor-pointer bg-white"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-4.5 py-2 bg-purple-650 hover:bg-[#8553da] text-white font-bold rounded-lg text-xs cursor-pointer shadow border-none"
                >
                  Określ SKU
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOM CARTON SCANNER MODAL */}
      {isCartonModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-300 rounded-xl w-full max-w-sm shadow-2xl p-5 font-sans" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 text-zinc-900 border-b border-zinc-100 pb-3 mb-4 select-none">
              <Box className="w-5 h-5 text-blue-600" />
              <h4 className="font-extrabold text-sm tracking-tight text-zinc-900">Zaczytaj Kod Kartonu Wysyłkowego</h4>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (cartonModalInput.trim()) {
                sounds.playSuccess();
                setIsCartonScanned(true);
                setIsCartonModalOpen(false);
                showLocalToast(`Karton zweryfikowany: ${cartonModalInput.trim()}`, 'success');
              }
            }} className="space-y-4 text-xs text-zinc-700">
              <p className="leading-relaxed font-semibold">
                Zeskanuj etykietę kartonu transportowego, aby powiązać go ze zleceniem wydań i nadać gabaryt:
              </p>

              <div>
                <label className="block text-[10px] font-bold text-zinc-650 uppercase tracking-widest mb-1.5">BARCODE KARTONU (BOX-xxxxx)</label>
                <input
                  type="text"
                  required
                  placeholder="np. BOX-39048"
                  value={cartonModalInput}
                  onChange={(e) => setCartonModalInput(e.target.value)}
                  className="w-full p-2.5 bg-white border border-zinc-300 rounded-xl text-zinc-950 font-mono text-sm uppercase outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 select-none">
                <button
                  type="button"
                  onClick={() => setIsCartonModalOpen(false)}
                  className="px-4 py-2 border border-zinc-300 hover:bg-zinc-50 text-zinc-700 font-bold rounded-lg text-xs cursor-pointer bg-white"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-4.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs cursor-pointer shadow border-none"
                >
                  Zatwierdź Karton
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {packedPromptOrder && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-300 rounded-2xl w-full max-w-md shadow-2xl p-6 font-sans" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 text-amber-600 border-b border-zinc-150 pb-3 mb-4 select-none">
              <AlertTriangle className="w-6 h-6 shrink-0 text-amber-500 animate-pulse" />
              <h4 className="font-extrabold text-base tracking-tight text-zinc-900">Zamówienie zostało już spakowane</h4>
            </div>

            <div className="space-y-4 text-xs text-zinc-700">
              <p className="leading-relaxed font-semibold">
                Zlecenie <strong className="text-blue-600 font-mono text-sm">{packedPromptOrder.id}</strong> zostało już zweryfikowane i spakowane przez operatora.
              </p>
              <p className="text-zinc-500 font-medium">
                Prawdopodobnie wystąpił błąd podczas generowania etykiety kurierskiej lub proces został przerwany. Wybierz jedną z poniższych akcji:
              </p>

              <div className="flex flex-col gap-2.5 pt-2 select-none">
                <button
                  onClick={() => handleRetryLabelGeneration(packedPromptOrder)}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all border-none"
                >
                  <RefreshCw className="w-4 h-4 animate-spin-slow" />
                  Spróbuj wygenerować etykietę ponownie
                </button>
                
                <button
                  onClick={() => {
                    proceedWithPacking(packedPromptOrder.id);
                    setPackedPromptOrder(null);
                  }}
                  className="w-full h-11 bg-zinc-50 hover:bg-zinc-100 text-zinc-800 font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer border border-zinc-200 transition-all"
                >
                  <Play className="w-3.5 h-3.5 text-zinc-600 fill-zinc-600" />
                  Akceptuję i przechodzę do zamówienia
                </button>

                <button
                  onClick={() => setPackedPromptOrder(null)}
                  className="w-full h-11 bg-white hover:bg-zinc-50 text-zinc-500 font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer border border-zinc-300 hover:border-zinc-400 transition-all"
                >
                  Wróć do listy zamówień
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface ProcessingOrderScreenProps {
  orderId: string;
  clientName: string;
  weight: number;
  cartonSize: string;
  cartonCode: string;
  workerName: string;
  currentUser: any;
  kpiStats: any;
  onBack: () => void;
  onComplete: (data: any) => void;
  forceError?: boolean;
  isPickup?: boolean;
  pickupCode?: string;
}

export function ProcessingOrderScreen({ 
  orderId,
  clientName,
  weight,
  cartonSize,
  cartonCode,
  workerName,
  currentUser,
  kpiStats,
  onBack,
  onComplete,
  forceError = false
}: ProcessingOrderScreenProps) {
  const [processState, setProcessState] = useState<'carrier_selection' | 'processing' | 'error' | 'success'>('carrier_selection'); 
  const [selectedCourier, setSelectedCourier] = useState<'InPost' | 'DPD' | 'DHL' | 'GLS' | 'UPS'>('DPD');
  const [waybillNumber, setWaybillNumber] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);
  
  const [stepStates, setStepStates] = useState<Record<string, 'pending' | 'active' | 'complete' | 'failed'>>({
    inventory: 'active',      
    orderStatus: 'pending',    
    courierLabel: 'pending'    
  });

  const [currentTime, setCurrentTime] = useState(() => {
    const d = new Date();
    return d.toTimeString().split(' ')[0];
  });

  // Calculate carrier rates dynamically based on weight & box size markup
  const calculatedRates = useMemo(() => {
    let ratesConfig = {
      InPost: { base: 12.0, perKg: 1.5 },
      DPD: { base: 15.0, perKg: 1.2 },
      DHL: { base: 17.0, perKg: 1.0 },
      GLS: { base: 16.0, perKg: 1.1 },
      UPS: { base: 22.0, perKg: 0.8 },
    };
    try {
      const saved = window.localStorage.getItem('wms-carrier-rates');
      if (saved) ratesConfig = JSON.parse(saved);
    } catch (e) {}

    // Markup based on carton size
    const cartonMarkups: Record<string, number> = {
      'Koperta / Karton S': 0,
      'Karton Średni M': 3.5,
      'Karton Duży L': 7.0
    };
    const markup = cartonMarkups[cartonSize] || 0;

    const results = Object.entries(ratesConfig).map(([carrier, rate]) => {
      const price = rate.base + (weight * rate.perKg) + markup;
      return {
        carrier: carrier as 'InPost' | 'DPD' | 'DHL' | 'GLS' | 'UPS',
        price: parseFloat(price.toFixed(2)),
        deliveryDays: carrier === 'UPS' ? 1 : carrier === 'GLS' ? 2 : 1
      };
    });

    // Sort by price to find the cheapest
    return results.sort((a, b) => a.price - b.price);
  }, [weight, cartonSize]);

  const cheapestCarrier = useMemo(() => {
    if (calculatedRates.length === 0) return 'DPD';
    return calculatedRates[0].carrier;
  }, [calculatedRates]);

  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setCurrentTime(d.toTimeString().split(' ')[0]);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let timer: any;
    if (processState === 'processing') {
      timer = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [processState]);

  // Simulated API call sequence for shipping label generation
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
          if (forceError) {
            setStepStates(prev => ({ 
              ...prev, 
              courierLabel: 'failed' 
            }));
            setProcessState('error');
            sounds.playError();
            showToast("Błąd API: Przekroczono limit czasu połączenia!", "error");
          } else {
            setStepStates(prev => ({ 
              ...prev, 
              courierLabel: 'complete' 
            }));
            
            // Generate mock tracking number
            const carrierPrefixes: Record<string, string> = {
              InPost: 'INP',
              DPD: 'DPD',
              DHL: 'DHL',
              GLS: 'GLS',
              UPS: '1Z'
            };
            const prefix = carrierPrefixes[selectedCourier] || 'WAY';
            const suffix = selectedCourier === 'UPS' ? '9E12803A' : '';
            const mockWaybill = `${prefix}${Math.floor(100000000 + Math.random() * 900000000)}${suffix}`;
            setWaybillNumber(mockWaybill);

            setProcessState('success');
            sounds.playSuccess();
            showToast(`Wygenerowano list przewozowy ${selectedCourier}`, "success");
          }
        }, 1800);

        return () => clearTimeout(t3);
      }, 1500);

      return () => clearTimeout(t2);
    }, 1200);

    return () => clearTimeout(t1);
  }, [processState, forceError, selectedCourier]);

  const showToast = (msg: string, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleStartProcessing = () => {
    sounds.playSuccess();
    setProcessState('processing');
    setStepStates({
      inventory: 'active',
      orderStatus: 'pending',
      courierLabel: 'pending'
    });
    setElapsedTime(0);
  };

  const handleRetry = () => {
    sounds.playBeep();
    setProcessState('processing');
    setStepStates({
      inventory: 'complete',
      orderStatus: 'complete',
      courierLabel: 'active'
    });
    showToast(`Ponowna próba autoryzacji SSL dla bramki ${selectedCourier}...`, "info");

    setTimeout(() => {
      setStepStates(prev => ({ 
        ...prev, 
        courierLabel: 'complete' 
      }));
      
      const carrierPrefixes: Record<string, string> = {
        InPost: 'INP',
        DPD: 'DPD',
        DHL: 'DHL',
        GLS: 'GLS',
        UPS: '1Z'
      };
      const prefix = carrierPrefixes[selectedCourier] || 'WAY';
      const suffix = selectedCourier === 'UPS' ? '9E12803A' : '';
      const mockWaybill = `${prefix}${Math.floor(100000000 + Math.random() * 900000000)}${suffix}`;
      setWaybillNumber(mockWaybill);

      setProcessState('success');
      sounds.playSuccess();
      showToast(`Wygenerowano list przewozowy ${selectedCourier}`, "success");
    }, 2000);
  };

  const handleLocalPrintLabel = () => {
    sounds.playSuccess();
    showToast(`Zlecono wydruk etykiety Zebra dla zlecenia ${orderId}. Waga: ${weight.toFixed(2)} kg.`, "success");
  };

  const handleFinalizeAndCompleteOrder = () => {
    sounds.playSuccess();
    onComplete({
      orderId,
      clientName,
      weight,
      cartonSize,
      cartonCode,
      selectedCourier,
      waybillNumber
    });
  };

  return (
    <div className="w-full min-h-screen bg-[#f5f7fa] text-zinc-800 flex flex-col font-sans select-none animate-fadeIn">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg border shadow-2xl flex items-center gap-2.5 max-w-sm animate-fadeIn ${
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
            className="p-1.5 hover:bg-zinc-50 text-purple-650 hover:text-purple-850 rounded-full transition-all cursor-pointer border border-purple-200 bg-white"
            title="Anuluj i wróć do sesji pakowania"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-sm font-black uppercase tracking-wider text-zinc-900">Stacja Pakowania</h2>
            </div>
            <p className="text-[10px] font-mono text-zinc-500 uppercase flex items-center gap-1.5 mt-0.5">
              Zalogowano: <span className="text-zinc-800 font-bold">{workerName}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-right">
          <div className="hidden md:block">
            <span className="text-[8px] font-mono text-zinc-500 uppercase block tracking-wider font-bold">Spakowane Dziś</span>
            <span className="text-xs font-black font-mono text-[#0052CC] leading-none mt-0.5 block">{kpiStats.packedToday} paczek</span>
          </div>
          
          <div className="hidden md:block text-right">
            <span className="text-[8px] font-mono text-zinc-400 block font-bold">Śr. Czas</span>
            <span className="text-xs font-bold font-mono text-purple-650">{kpiStats.avgTimeSec}s</span>
          </div>
          
          <div className="bg-zinc-50 border border-zinc-250 text-blue-650 px-3 py-1.5 rounded-lg flex items-center gap-2 font-mono text-xs font-black shadow-inner">
            <Clock className="w-4.5 h-4.5 text-blue-600 animate-pulse" />
            <span>{currentTime}</span>
          </div>
        </div>
      </header>

      <div className="flex-grow flex flex-col p-4 md:p-6 gap-6 items-center justify-start max-w-6xl mx-auto w-full">
        <div className="w-full max-w-4xl mt-2 mb-2 flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-left">
          <div>
            <span className="text-[9px] font-black tracking-widest text-[#0052CC] uppercase font-mono block">
              FINALIZACJA ETYKIETY WYSYŁKOWEJ i SPEDYCJA
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-zinc-950 tracking-tight mt-1 animate-fadeIn">Przetwarzanie Zlecenia</h2>
            <p className="font-mono text-zinc-500 text-xs mt-1">
              Numer identyfikacyjny ERP: <span className="text-[#0052CC] font-bold tracking-wide">{orderId}</span>
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto select-none">
            <span className="text-[10px] uppercase font-bold text-zinc-500 font-mono">Stan Przetwarzania: </span>
            <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
              processState === 'error' ? 'bg-red-50 text-red-750 border-red-200' :
              processState === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-250 shadow-sm animate-pulse' :
              processState === 'carrier_selection' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
              'bg-white text-purple-700 border-purple-200 animate-pulse'
            }`}>
              {processState === 'error' ? "Błąd Autoryzacji" : 
               processState === 'success' ? "UKOŃCZONE" : 
               processState === 'carrier_selection' ? "KALKULACJA STAWEK" : "W TOKU (API)"}
            </span>
          </div>
        </div>

        {processState === 'carrier_selection' ? (
          /* Carrier Selector rate calculator panel */
          <div className="w-full max-w-4xl bg-white border border-zinc-200 rounded-2xl shadow-xl p-6 sm:p-8 space-y-6 text-left animate-fadeIn">
            {isPickup ? (
              <>
                <div className="border-b border-zinc-150 pb-4">
                  <h3 className="text-base font-extrabold text-zinc-900 flex items-center gap-2">
                    <MapPin className="w-5.5 h-5.5 text-emerald-605 animate-pulse text-emerald-600" /> Odbiór osobisty w Magazynie Centralnym (BOPIS)
                  </h3>
                  <p className="text-xs text-zinc-550 mt-1 font-medium font-sans">
                    To zamówienie zostało wyznaczone jako odbiór osobisty. Nie jest wymagane generowanie zewnętrznej etykiety spedytora.
                  </p>
                </div>

                <div className="p-5 rounded-2xl border border-emerald-250 bg-emerald-50/20 text-center flex flex-col items-center gap-2">
                  <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-wider select-none">PUNKT ODBIORU W WMS</span>
                  <strong className="text-sm font-extrabold text-slate-800">Magazyn Centralny HUB-PL-01 (ul. Logistyczna 12, Warszawa)</strong>
                  <div className="my-1.5 p-3 bg-white border border-emerald-200 rounded-lg flex flex-col items-center gap-1 min-w-[200px]">
                    <span className="text-[9px] text-zinc-500 font-bold uppercase font-mono">Dedykowany PIN odbioru:</span>
                    <strong className="text-xl font-mono text-emerald-650 font-black text-emerald-600">{pickupCode}</strong>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-150">
                  <button
                    type="button"
                    onClick={onBack}
                    className="h-11 px-5 border border-zinc-300 hover:bg-zinc-50 text-zinc-650 rounded-xl font-bold text-xs cursor-pointer bg-white"
                  >
                    Powrót
                  </button>
                  <button
                    type="button"
                    onClick={handleStartProcessing}
                    className="h-11 px-6 bg-emerald-650 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer shadow-md border-none flex items-center gap-1.5 active:scale-[0.98] transition-transform"
                  >
                    Rozpocznij kompletowanie &rarr;
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="border-b border-zinc-150 pb-4">
                  <h3 className="text-base font-extrabold text-zinc-900 flex items-center gap-2">
                    <Truck className="w-5.5 h-5.5 text-blue-650 animate-bounce" /> Kalkulator Taryf Spedycyjnych Brokera WMS
                  </h3>
                  <p className="text-xs text-zinc-550 mt-1 font-medium font-sans">
                    Waga paczki wynosi <strong className="text-zinc-900 font-mono">{weight.toFixed(2)} kg</strong>, a gabaryt to <strong className="text-zinc-900 uppercase">{cartonSize}</strong>. Poniżej wyliczono stawki dla zakontraktowanych kurierów:
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {calculatedRates.map(rate => {
                    const isCheapest = rate.carrier === cheapestCarrier;
                    const isSelected = rate.carrier === selectedCourier;
                    
                    // Styling helpers
                    let carrierColor = 'text-amber-600 bg-amber-50 border-amber-200';
                    if (rate.carrier === 'DHL') carrierColor = 'text-yellow-600 bg-yellow-50 border-yellow-250';
                    if (rate.carrier === 'InPost') carrierColor = 'text-zinc-800 bg-zinc-50 border-zinc-300';
                    if (rate.carrier === 'GLS') carrierColor = 'text-blue-750 bg-blue-50 border-blue-200';
                    if (rate.carrier === 'UPS') carrierColor = 'text-amber-900 bg-amber-50/50 border-amber-800/30';

                    return (
                      <div
                        key={rate.carrier}
                        onClick={() => {
                          sounds.playBeep();
                          setSelectedCourier(rate.carrier);
                        }}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer text-center flex flex-col justify-between items-center gap-3 relative overflow-hidden select-none hover:shadow-md ${
                          isSelected 
                            ? 'border-indigo-650 bg-indigo-50/20 ring-1 ring-indigo-500 shadow-sm' 
                            : 'border-zinc-200 bg-white hover:border-zinc-300'
                        }`}
                      >
                        {isCheapest && (
                          <span className="absolute top-0 right-0 bg-emerald-600 text-white font-sans font-black text-[7.5px] uppercase tracking-widest px-2 py-0.6 rounded-bl">
                            AI TANIO
                          </span>
                        )}

                        <div className="space-y-0.5">
                          <span className={`text-[10px] font-mono font-black px-2.5 py-0.5 rounded-full border tracking-wide uppercase ${carrierColor}`}>
                            {rate.carrier}
                          </span>
                          <span className="text-[9px] text-zinc-400 block mt-1 font-semibold">{rate.deliveryDays === 1 ? '1 dzień roboczy' : `${rate.deliveryDays} dni robocze`}</span>
                        </div>

                        <div className="my-1 text-center">
                          <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider select-none">Koszt dostawy:</span>
                          <span className="text-xl font-black font-mono text-zinc-950">{rate.price.toFixed(2)} <span className="text-xs font-bold font-sans">PLN</span></span>
                        </div>

                        <div className="w-full flex items-center justify-center">
                          <input 
                            type="radio" 
                            name="selectedCourier"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-4 h-4 text-indigo-600 border-zinc-300 focus:ring-indigo-500 cursor-pointer"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-150">
                  <button
                    type="button"
                    onClick={onBack}
                    className="h-11 px-5 border border-zinc-300 hover:bg-zinc-50 text-zinc-650 rounded-xl font-bold text-xs cursor-pointer bg-white"
                  >
                    Powrót
                  </button>
                  <button
                    type="button"
                    onClick={handleStartProcessing}
                    className="h-11 px-6 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer shadow-md border-none flex items-center gap-1.5 active:scale-[0.98] transition-transform"
                  >
                    Rozpocznij generowanie listu &rarr;
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="w-full max-w-4xl bg-white border border-zinc-200 rounded-2xl shadow-xl overflow-hidden flex flex-col lg:flex-row min-h-[460px] animate-fadeIn">
            <div className="w-full lg:w-[45%] p-6 sm:p-8 bg-zinc-50 border-r border-zinc-200 flex flex-col justify-center items-center">
              {processState === 'processing' && (
                <div className="flex flex-col items-center justify-center text-center space-y-5 animate-fadeIn">
                  <div className="relative w-24 h-24 flex items-center justify-center">
                    <svg className="absolute w-full h-full text-purple-600 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="1"></circle>
                      <path d="M12 2a10 10 0 0 1 10 10" className="stroke-[3] text-purple-500"></path>
                    </svg>
                    <div className="w-16 h-16 rounded-full bg-white border border-zinc-200 flex items-center justify-center shadow-inner">
                      <Truck className="w-7 h-7 text-[#0052CC] animate-bounce" />
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-base font-black text-zinc-950 uppercase tracking-wide">
                      Generowanie etykiety {selectedCourier}
                    </h3>
                    <p className="text-[10px] text-zinc-500 uppercase font-mono tracking-widest mt-1.5">
                      UPŁYNĘŁO: <span className="text-[#0052CC] font-bold">{elapsedTime}s</span>
                    </p>
                  </div>
                  
                  <p className="text-xs text-zinc-500 leading-relaxed max-w-[240px]">
                    Trwa aktualizacja bazy danych ERP oraz przesyłanie gabarytów opakowania ({weight.toFixed(2)} kg) do bramki API {selectedCourier}.
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
                      {selectedCourier}-API Timeout (Error)
                    </span>
                  </div>
                  
                  <p className="text-xs text-zinc-500 leading-relaxed max-w-[240px]">
                    Serwer integracyjny {selectedCourier} nie zgłosił pomyślnego zwrotu dla przesyłki o kodzie referencyjnym {orderId} z powodu przekroczenia limitu czasu.
                  </p>
                </div>
              )}

              {processState === 'success' && (
                <div className="w-full flex flex-col items-center justify-center gap-4 animate-fadeIn">
                  {isPickup ? (
                    <>
                      <span className="text-[10px] font-mono text-emerald-700 font-bold uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        PODGLĄD POTWIERDZENIA (BOPIS)
                      </span>
                      
                      {/* BOPIS Ticket Preview Card */}
                      <div className="w-full max-w-[280px] bg-white text-slate-900 p-4 rounded-xl border border-emerald-300 shadow-2xl flex flex-col gap-3.5 font-sans leading-none relative select-none text-left animate-scaleIn">
                        <div className="flex justify-between items-start border-b-2 border-slate-950 pb-2.5">
                          <div>
                            <p className="text-base font-black text-slate-950 tracking-tight uppercase">ODBIÓR OSOBISTY</p>
                            <p className="text-[8px] text-slate-600 font-bold uppercase tracking-wider mt-0.5">Magazyn Centralny HUB-PL-01</p>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-bold border border-emerald-500 text-emerald-600 px-1.5 py-0.5 rounded uppercase font-mono">BOPIS</span>
                            <p className="text-[9px] text-slate-700 mt-1.5 font-bold font-mono">Waga: {weight.toFixed(2)} kg</p>
                          </div>
                        </div>

                        <div className="space-y-1 text-[9px] text-slate-800">
                          <p className="font-semibold text-slate-400 uppercase tracking-wider select-none">PUNKT WYDANIA / HUB:</p>
                          <p className="font-bold text-slate-950">HUB-PL-01 WARSZAWA</p>
                          <p className="text-slate-500">Aleja Logistyczna 12, Warszawa</p>
                        </div>

                        <div className="space-y-1 text-[9px] text-slate-800 border-t border-slate-150 pt-2">
                          <p className="font-semibold text-slate-400 uppercase tracking-wider select-none">KLIENT / RECIPIENT:</p>
                          <p className="font-bold text-slate-950 text-[10px] leading-snug">{clientName}</p>
                          
                          <div className="pt-2 border-t border-dashed border-slate-200 space-y-1 select-none">
                            <p><span className="font-semibold text-slate-400 font-mono">OPAKOWANIE:</span> <span className="font-bold text-slate-950 uppercase">{cartonSize}</span></p>
                            <p><span className="font-semibold text-slate-400 font-mono">ID KARTONU:</span> <span className="font-mono text-slate-950 font-bold">{cartonCode}</span></p>
                          </div>
                        </div>

                        <div className="flex flex-col items-center justify-center p-3 bg-zinc-50 border border-zinc-200 rounded gap-1 mt-1 font-mono">
                          <span className="text-[8px] text-zinc-500 font-bold uppercase">Kod PIN odbioru:</span>
                          <span className="text-base font-black text-emerald-600 tracking-wider">{pickupCode}</span>
                        </div>

                        <button
                          onClick={handleLocalPrintLabel}
                          className="w-full py-2.5 bg-emerald-650 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-[10px] tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer uppercase shadow border-none font-mono"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Drukuj potwierdzenie (A4)
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="text-[10px] font-mono text-emerald-700 font-bold uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        PODGLĄD WYDRUKU ({selectedCourier} LABEL)
                      </span>
                      
                      {/* Zebra Thermal Shipping Label Preview Card */}
                      <div className="w-full max-w-[280px] bg-white text-slate-900 p-4 rounded-xl border border-slate-350 shadow-2xl flex flex-col gap-3.5 font-sans leading-none relative select-none text-left">
                        <div className="flex justify-between items-start border-b-2 border-slate-950 pb-2.5">
                          <div>
                            <p className="text-base font-black text-slate-950 tracking-tight uppercase">{selectedCourier} EXPRESS</p>
                            <p className="text-[8px] text-slate-600 font-bold uppercase tracking-wider mt-0.5">Domestic Courier Service</p>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-bold border border-slate-950 px-1.5 py-0.5 font-mono">PL-WMS</span>
                            <p className="text-[9px] text-slate-700 mt-1.5 font-bold font-mono">Waga: {weight.toFixed(2)} kg</p>
                          </div>
                        </div>

                        <div className="space-y-1 text-[9px] text-slate-800">
                          <p className="font-semibold text-slate-400 uppercase tracking-wider select-none">NADAWCA / SENDER:</p>
                          <p className="font-bold text-slate-950">MAGAZYN CENTRALNY WMS</p>
                          <p className="text-slate-500">Aleja Logistyczna 12, Warszawa</p>
                        </div>

                        <div className="space-y-1 text-[9px] text-slate-800 border-t border-slate-150 pt-2">
                          <p className="font-semibold text-slate-400 uppercase tracking-wider select-none">ODBIORCA / RECIPIENT:</p>
                          <p className="font-bold text-slate-950 text-[10px] leading-snug">{clientName}</p>
                          
                          <div className="pt-2 border-t border-dashed border-slate-200 space-y-1 select-none">
                            <p><span className="font-semibold text-slate-400 font-mono">PUDŁO:</span> <span className="font-bold text-slate-950 uppercase">{cartonSize}</span></p>
                            <p><span className="font-semibold text-slate-400 font-mono">ID KARTONU:</span> <span className="font-mono text-slate-950 font-bold">{cartonCode}</span></p>
                          </div>
                        </div>

                        <div className="flex flex-col items-center justify-center p-2 bg-white border border-slate-200 rounded gap-1.5 mt-1 select-none pointer-events-none">
                          <div className="flex h-11 w-full justify-between max-w-[210px] shrink-0">
                            {[1,3,1,1,4,2,1,3,1,2,1,3,4,1,2,1,1,3,1,1,4,1,2,1,3,1,1,2,3,4].map((w, idx) => (
                              <div key={idx} className="bg-slate-950" style={{ width: `${w * 1.3}px` }} />
                            ))}
                          </div>
                          <p className="font-mono text-[9px] font-bold text-slate-900 tracking-[0.16em]">
                            *{waybillNumber}*
                          </p>
                        </div>

                        <button
                          onClick={handleLocalPrintLabel}
                          className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 active:scale-[0.98] text-white font-bold text-[10px] tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer uppercase shadow border-none font-mono"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Drukuj etykietę (Zebra)
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="w-full lg:w-[55%] p-6 sm:p-8 flex flex-col justify-between gap-6 text-left">
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-zinc-200 pb-2 select-none">
                  <h4 className="text-[10px] uppercase font-black tracking-widest text-zinc-400 font-mono">
                    Przebieg Procesu (Execution Sequence)
                  </h4>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handleStartProcessing}
                      className="text-[9px] font-bold text-purple-750 hover:text-purple-900 flex items-center gap-1 cursor-pointer transition-all bg-purple-50 border border-purple-250 px-2 py-0.5 rounded"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Resetuj Symulację
                    </button>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-mono text-[10px] border ${
                      stepStates.inventory === 'complete' ? 'bg-emerald-50 border-emerald-250 text-emerald-700 shadow-sm animate-zoomIn' : 'bg-zinc-50 border-zinc-200 text-zinc-400'
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
                      stepStates.orderStatus === 'active' ? 'bg-white border-purple-400 text-purple-600 animate-pulse' : 'bg-zinc-50 border-zinc-200 text-zinc-400'
                    }`}>
                      {stepStates.orderStatus === 'complete' ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <span>2</span>}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <h5 className="font-bold text-xs text-zinc-900">Weryfikacja kompletacji i zmiana statusu paczki</h5>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider border ${
                          stepStates.orderStatus === 'complete' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                          stepStates.orderStatus === 'active' ? 'bg-purple-50 text-purple-700 border-purple-200 animate-pulse' : 'bg-transparent text-zinc-450 border-zinc-200'
                        }`}>{stepStates.orderStatus === 'complete' ? "Ukończono" : stepStates.orderStatus === 'active' ? "W toku" : "Oczekuje"}</span>
                      </div>
                      <p className="text-[11px] text-zinc-500">Autoryzacja i zatwierdzenie statusu zamówienia w bazie systemowej.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-mono text-[10px] border ${
                      stepStates.courierLabel === 'complete' ? 'bg-emerald-50 border-emerald-250 text-emerald-700 shadow-sm' :
                      stepStates.courierLabel === 'failed' ? 'bg-red-50 border-red-250 text-red-655' :
                      stepStates.courierLabel === 'active' ? 'bg-white border-purple-400 text-purple-600 animate-pulse' : 'bg-zinc-50 border-zinc-200 text-zinc-405'
                    }`}>
                      {stepStates.courierLabel === 'complete' ? <Check className="w-3.5 h-3.5 stroke-[3]" /> :
                       stepStates.courierLabel === 'failed' ? <AlertCircle className="w-3.5 h-3.5 text-red-500 animate-bounce" /> : <span>3</span>}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <h5 className="font-bold text-xs text-zinc-900">
                          {isPickup ? 'Autoryzacja kodu PIN Click-and-Collect' : `Generowanie etykiety kurierskiej kuriera ${selectedCourier}`}
                        </h5>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider border ${
                          stepStates.courierLabel === 'complete' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          stepStates.courierLabel === 'failed' ? 'bg-red-50 text-red-750 border-red-200 animate-pulse' :
                          stepStates.courierLabel === 'active' ? 'bg-purple-50 text-purple-700 border-purple-200 animate-pulse' : 'bg-transparent text-zinc-450 border-zinc-200'
                        }`}>{stepStates.courierLabel === 'complete' ? (isPickup ? "Zatwierdzono" : "Wygenerowano") : stepStates.courierLabel === 'failed' ? "BŁĄD API" : stepStates.courierLabel === 'active' ? (isPickup ? "Weryfikacja" : "Wysyłanie") : "Oczekuje"}</span>
                      </div>
                      {stepStates.courierLabel === 'failed' ? (
                        <p className="text-[11px] text-red-655 font-semibold font-mono">Courier API Connection Timeout. Serwer '{selectedCourier}-PROD-PL-01' nie odpowiedział.</p>
                      ) : (
                        <p className="text-[11px] text-zinc-500">
                          {isPickup ? `Zapisanie unikalnego kodu odbioru BOPIS: ${pickupCode}` : `Łączenie z serwerem zewnętrznym kuriera ${selectedCourier} w celu wygenerowania listu przewozowego.`}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-200">
                {processState === 'error' && (
                  <div className="p-4 border border-red-200 rounded-xl bg-red-50/50 flex flex-col gap-4 animate-slideIn text-left">
                    <div>
                      <h6 className="font-bold text-xs text-red-750 uppercase tracking-wider animate-pulse">Błąd połączenia podczas autoryzacji listu przewozowego</h6>
                      <p className="text-[11px] text-zinc-500 mt-1 font-medium leading-relaxed">
                        Połączenie z serwerem {selectedCourier} wygasło. Możesz kliknąć poniżej aby podjąć ponowną próbę autoryzacji sesji SSL.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={handleRetry}
                        className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-550 hover:from-red-550 hover:to-red-400 text-white text-xs font-black uppercase tracking-wider rounded-lg flex items-center gap-2 cursor-pointer shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all border-none"
                      >
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Spróbuj Ponownie (Retry)
                      </button>
                      <button
                        onClick={() => showToast("Telefon wsparcia WMS-IT: +48 22 555 18 18", "info")}
                        className="px-4 py-2.5 bg-white hover:bg-zinc-50 border border-zinc-250 text-zinc-700 text-xs font-bold rounded-lg flex items-center gap-2 cursor-pointer transition-all"
                      >
                        Wsparcie IT
                      </button>
                    </div>
                  </div>
                )}

                {processState === 'success' && (
                  <div className="p-4 border border-emerald-250 rounded-xl bg-emerald-50/30 flex flex-col gap-4 animate-slideIn text-left">
                    <div>
                      <h6 className="font-bold text-xs text-emerald-800 uppercase tracking-wider">Proces zakończony sukcesem</h6>
                      <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                        List przewozowy {selectedCourier} został poprawnie wygenerowany. Zapisz i zamknij zlecenie, aby przenieść je do statusu 'Spakowane'.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={handleFinalizeAndCompleteOrder}
                        className="px-5 py-3 bg-gradient-to-r from-emerald-600 to-emerald-550 hover:from-emerald-550 hover:to-emerald-400 text-white text-xs font-black uppercase tracking-widest rounded-xl flex items-center gap-2.5 cursor-pointer shadow-md hover:scale-[1.01] active:scale-[0.98] transition-all border-none"
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
                      onClick={() => setProcessState('carrier_selection')}
                      className="border border-zinc-250 hover:bg-zinc-50 bg-white text-zinc-750 font-bold px-4 py-2.5 rounded-lg text-xs uppercase tracking-wider cursor-pointer transition-all"
                    >
                      &larr; Wstecz (Taryfy)
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
