import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Barcode, Play, CheckCircle2, MapPin, 
  Check, Timer, Target, AlertTriangle, XCircle, Volume2, ShieldAlert,
  Layers, ShoppingCart
} from 'lucide-react';
import { sounds } from './SoundEffects';
import { defaultImages } from '../data/warehouseData';

interface PickerViewProps {
  orders: any[];
  onUpdateOrder: (id: string, updates: any) => void;
  workerName: string;
  products: any[];
  onBackToMenu: () => void;
}

const isFoodProduct = (sku: string, category?: string) => {
  const cleanSku = sku.toUpperCase();
  return cleanSku.startsWith('FOOD-') || 
         category === 'Artykuły spożywcze' || 
         category === 'Zywnosc' || 
         category === 'Żywność';
};

const getMockLotInfo = (sku: string, isFood: boolean) => {
  const cleanSku = sku.replace(/[^a-zA-Z0-9]/g, '');
  if (isFood) {
    return {
      fifoLot: `L-F-${cleanSku}-01`,
      fifoExp: '2026-07-10',
      newerLot: `L-F-${cleanSku}-02`,
      newerExp: '2026-12-15'
    };
  } else {
    return {
      fifoLot: `L-${cleanSku}-99`,
      fifoExp: null,
      newerLot: null,
      newerExp: null
    };
  }
};

export function PickerView({ orders, onUpdateOrder, workerName, products, onBackToMenu }: PickerViewProps) {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Helper to parse location code for sorting
  const parseLocationCode = (code: string) => {
    if (!code) {
      return { aisle: 'ZZZ', bay: 999, level: 999, position: 999 };
    }
    if (code === 'RAMPA-PRZYJEC') {
      return { aisle: 'AAA-RAMP', bay: 0, level: 0, position: 0 };
    }
    const parts = code.split('-');
    const aisle = parts[0] || 'ZZZ';
    const bay = parseInt(parts[1], 10) || 0;
    const level = parseInt(parts[2], 10) || 0;
    const position = parseInt(parts[3], 10) || 0;
    return { aisle, bay, level, position };
  };

  // Sort order items according to pick path optimization
  const getSortedItems = () => {
    if (!selectedOrder || !selectedOrder.items) return [];
    
    // Create a map of sku to product details for quick location lookup
    const productMap = new Map((products || []).map(p => [p.sku, p]));
    
    return [...selectedOrder.items].sort((a, b) => {
      const prodA = productMap.get(a.sku);
      const prodB = productMap.get(b.sku);
      
      const locA = parseLocationCode(prodA?.locationCode);
      const locB = parseLocationCode(prodB?.locationCode);
      
      if (locA.aisle !== locB.aisle) {
        return locA.aisle.localeCompare(locB.aisle);
      }
      if (locA.bay !== locB.bay) {
        return locA.bay - locB.bay;
      }
      if (locA.level !== locB.level) {
        return locA.level - locB.level;
      }
      return locA.position - locB.position;
    });
  };

  const [pickedItems, setPickedItems] = useState<Record<string, number>>({}); 
  const [kpiStats, setKpiStats] = useState({ picksToday: 42, accuracy: 99.8, speedMin: 1.2 });
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  // Stateful notifications instead of alert/prompt
  const [feedback, setFeedback] = useState<{ id: string; type: 'success' | 'error'; text: string } | null>(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [simulatorBarcodeInput, setSimulatorBarcodeInput] = useState('');

  // Bin modal states
  const [isBinModalOpen, setIsBinModalOpen] = useState(false);
  const [selectedBinId, setSelectedBinId] = useState('');

  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const binInputRef = useRef<HTMLInputElement>(null);

  // Batch Picking states
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [batchOrders, setBatchOrders] = useState<any[]>([]);
  const [batchBinIds, setBatchBinIds] = useState<Record<string, string>>({});
  const [currentBatchStepIndex, setCurrentBatchStepIndex] = useState(0);
  const [batchPickedItems, setBatchPickedItems] = useState<Record<string, number>>({});
  const [isBatchBinModalOpen, setIsBatchBinModalOpen] = useState(false);
  const [batchConfirmations, setBatchConfirmations] = useState<Record<string, boolean>>({});
  const [isBatchSkuScanned, setIsBatchSkuScanned] = useState(false);
  const [batchScanInput, setBatchScanInput] = useState('');
  const batchScanInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    let interval: any = null;
    if (selectedOrderId || isBatchMode) {
      interval = setInterval(() => {
        setSecondsElapsed(prev => prev + 1);
      }, 1000);
    } else {
      setSecondsElapsed(0);
    }
    return () => clearInterval(interval);
  }, [selectedOrderId, isBatchMode]);

  useEffect(() => {
    if (isBinModalOpen) {
      setTimeout(() => {
        binInputRef.current?.focus();
      }, 150);
    }
  }, [isBinModalOpen]);

  const activeOrders = orders.filter(o => o.status === 'Do kompletacji' || o.status === 'W kompletacji');
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
    
    if (onUpdateOrder) {
      onUpdateOrder(orderId, { status: 'W kompletacji' });
    }

    // Auto focus scan input
    setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 200);
  };

  // 1. Compiled batch items for route optimization
  const compiledBatchItems = useMemo(() => {
    if (!isBatchMode || batchOrders.length === 0) return [];
    
    const skuMap: Record<string, {
      sku: string;
      name: string;
      locationCode: string;
      allocations: Array<{ orderId: string; basketName: string; qty: number }>;
      totalQty: number;
    }> = {};

    const productMap = new Map((products || []).map(p => [p.sku, p]));
    const basketNames = ['Kosz A', 'Kosz B', 'Kosz C'];

    batchOrders.forEach((order, index) => {
      const basketName = basketNames[index] || `Kosz ${index + 1}`;
      if (!order.items) return;
      order.items.forEach((item: any) => {
        const prod = productMap.get(item.sku);
        const loc = prod?.locationCode || 'UNASSIGNED';
        
        if (!skuMap[item.sku]) {
          skuMap[item.sku] = {
            sku: item.sku,
            name: item.name,
            locationCode: loc,
            allocations: [],
            totalQty: 0
          };
        }
        
        skuMap[item.sku].allocations.push({
          orderId: order.id,
          basketName,
          qty: item.qtyOrdered || item.quantity || item.qty || 1
        });
        skuMap[item.sku].totalQty += item.qtyOrdered || item.quantity || item.qty || 1;
      });
    });

    return Object.values(skuMap).sort((a, b) => {
      const locA = parseLocationCode(a.locationCode);
      const locB = parseLocationCode(b.locationCode);
      
      if (locA.aisle !== locB.aisle) {
        return locA.aisle.localeCompare(locB.aisle);
      }
      if (locA.bay !== locB.bay) {
        return locA.bay - locB.bay;
      }
      if (locA.level !== locB.level) {
        return locA.level - locB.level;
      }
      return locA.position - locB.position;
    });
  }, [isBatchMode, batchOrders, products]);

  // 2. Start batch picking
  const handleStartBatchPick = () => {
    const pending = orders.filter(o => o.status === 'Do kompletacji' || o.status === 'W kompletacji').slice(0, 3);
    
    if (pending.length < 2) {
      showFeedback('error', 'Potrzebujesz co najmniej 2 zamówień w kolejce do zbiórki partii.');
      return;
    }

    sounds.playSuccess();
    setBatchOrders(pending);
    setIsBatchMode(true);
    setCurrentBatchStepIndex(0);
    setBatchPickedItems({});
    setBatchConfirmations({});
    setIsBatchSkuScanned(false);
    setBatchScanInput('');
    setSecondsElapsed(0);
    
    const initialBins: Record<string, string> = {};
    const basketNames = ['Kosz A', 'Kosz B', 'Kosz C'];
    pending.forEach((o, idx) => {
      initialBins[o.id] = basketNames[idx] || `Kosz ${idx + 1}`;
    });
    setBatchBinIds(initialBins);

    if (onUpdateOrder) {
      pending.forEach(o => {
        onUpdateOrder(o.id, { status: 'W kompletacji' });
      });
    }

    showFeedback('success', `Rozpoczęto zbiórkę partii dla ${pending.length} zamówień.`);
    
    setTimeout(() => {
      batchScanInputRef.current?.focus();
    }, 250);
  };

  // 3. Process scan during batch mode
  const handleProcessBatchScan = (scannedSku: string) => {
    sounds.playBeep();
    const cleanInput = scannedSku.toUpperCase().trim();
    const currentItem = compiledBatchItems[currentBatchStepIndex];

    if (!currentItem) return;

    if (currentItem.sku.toUpperCase().trim() === cleanInput) {
      setIsBatchSkuScanned(true);
      showFeedback('success', `Zeskanowano poprawnie SKU ${currentItem.sku}. Rozłóż sztuki do wózka.`);
    } else {
      sounds.playError();
      showFeedback('error', `Błędne SKU! Oczekiwano: ${currentItem.sku}, zeskanowano: ${cleanInput}`);
    }
    setBatchScanInput('');
  };

  // 4. Confirm item placement in basket
  const handleConfirmBasketAllocation = (orderId: string, basketName: string, qty: number) => {
    sounds.playSuccess();
    const currentItem = compiledBatchItems[currentBatchStepIndex];
    if (!currentItem) return;

    const confirmationKey = `${currentItem.sku}-${basketName}`;
    setBatchConfirmations(prev => ({
      ...prev,
      [confirmationKey]: true
    }));

    // Record picked quantity for this order
    const pickedKey = `${orderId}-${currentItem.sku}`;
    setBatchPickedItems(prev => ({
      ...prev,
      [pickedKey]: qty
    }));
  };

  // 5. Complete whole batch pick
  const handleCompleteBatchPick = () => {
    sounds.playSuccess();
    const currentTime = new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
    const productMap = new Map((products || []).map(p => [p.sku, p]));

    if (onUpdateOrder) {
      batchOrders.forEach(order => {
        const binId = batchBinIds[order.id] || 'Kosz A';
        
        const updatedItems = (order.items || []).map((item: any) => {
          const prod = productMap.get(item.sku);
          const isFood = isFoodProduct(item.sku, prod?.category);
          const lotInfo = getMockLotInfo(item.sku, isFood);
          
          const pickedKey = `${order.id}-${item.sku}`;
          const pickedQty = batchPickedItems[pickedKey] || item.qtyOrdered || item.quantity || item.qty || 1;
          
          return {
            ...item,
            picked_quantity: pickedQty,
            pickedLot: lotInfo.fifoLot,
            expirationDate: lotInfo.fifoExp || null
          };
        });

        onUpdateOrder(order.id, {
          status: 'Oczekuje na pakowanie',
          binId: binId.toUpperCase().trim(),
          pickedBy: workerName,
          pickCompletedTime: currentTime,
          items: updatedItems,
          internalNotes: `${order.internalNotes || ''}\n[PICKER-BATCH]: Kompletacja partii zakończona przez ${workerName}. Pojemnik wózka: ${binId}. Czas: ${Math.floor(secondsElapsed / 60)}m ${secondsElapsed % 60}s.`,
          internalNotesActor: workerName
        });
      });
    }

    showFeedback('success', `Zbiórka partii ${batchOrders.map(o => o.id).join(', ')} ukończona!`);
    setIsBatchMode(false);
    setBatchOrders([]);
    setIsBatchBinModalOpen(false);
  };

  const handleProcessGlobalScan = (scannedSku: string) => {
    sounds.playBeep();
    const cleanInput = scannedSku.toUpperCase().trim();
    
    if (!selectedOrder) return;
    
    // Find if the input matches any item by SKU, FIFO Lot, or newer Lot
    let matchedItem: any = null;
    let scanType: 'sku' | 'fifo_lot' | 'newer_lot' = 'sku';
    let foodProductFlag = false;
    let lotInfo: any = null;

    const productMap = new Map((products || []).map(p => [p.sku, p]));

    for (const item of (selectedOrder.items || [])) {
      const prod = productMap.get(item.sku);
      const isFood = isFoodProduct(item.sku, prod?.category);
      const info = getMockLotInfo(item.sku, isFood);

      if (item.sku.toUpperCase().trim() === cleanInput) {
        matchedItem = item;
        scanType = 'sku';
        foodProductFlag = isFood;
        lotInfo = info;
        break;
      } else if (info.fifoLot.toUpperCase().trim() === cleanInput) {
        matchedItem = item;
        scanType = 'fifo_lot';
        foodProductFlag = isFood;
        lotInfo = info;
        break;
      } else if (info.newerLot && info.newerLot.toUpperCase().trim() === cleanInput) {
        matchedItem = item;
        scanType = 'newer_lot';
        foodProductFlag = isFood;
        lotInfo = info;
        break;
      }
    }
    
    if (!matchedItem) {
      showFeedback('error', `BŁĄD DEKODOWANIA! Kod "${scannedSku}" nie odpowiada żadnemu SKU ani partii w tym zleceniu!`);
      return;
    }

    if (scanType === 'newer_lot' && foodProductFlag) {
      showFeedback('error', `BLOKADA FIFO! Skanowana partia "${cleanInput}" nie jest najstarsza. Zgodnie z FIFO musisz pobrać partię: ${lotInfo.fifoLot}.`);
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

    if (foodProductFlag) {
      if (scanType === 'sku') {
        showFeedback('success', `Pomyślnie zeskanowano SKU: ${matchedItem.sku} (+1 szt.). Automatycznie przypisano partię FIFO: ${lotInfo.fifoLot}.`);
      } else {
        showFeedback('success', `Pomyślnie zeskanowano partię FIFO: ${lotInfo.fifoLot} (+1 szt.).`);
      }
    } else {
      showFeedback('success', `Pomyślnie zeskanowano SKU: ${matchedItem.sku} (+1 szt.).`);
    }
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

  const handleCompleteOrderPick = (binName: string) => {
    sounds.playSuccess();
    const cleanBin = binName.toUpperCase().trim() || 'BIN-000';
    const currentTime = new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
    
    if (onUpdateOrder && selectedOrderId && selectedOrder) {
      const productMap = new Map((products || []).map(p => [p.sku, p]));
      const updatedItems = (selectedOrder.items || []).map((item: any) => {
        const prod = productMap.get(item.sku);
        const isFood = isFoodProduct(item.sku, prod?.category);
        const lotInfo = getMockLotInfo(item.sku, isFood);
        
        const key = `${selectedOrderId}-${item.sku}`;
        const pickedQty = pickedItems[key] || 0;
        
        return {
          ...item,
          picked_quantity: pickedQty,
          pickedLot: lotInfo.fifoLot,
          expirationDate: lotInfo.fifoExp || null
        };
      });

      onUpdateOrder(selectedOrderId, {
        status: 'Oczekuje na pakowanie',
        binId: cleanBin,
        pickedBy: workerName,
        pickCompletedTime: currentTime,
        items: updatedItems,
        internalNotes: `${selectedOrder.internalNotes || ''}\n[PICKER]: Kompletacja zakończona przez ${workerName}. Pojemnik: ${cleanBin}. Czas: ${Math.floor(secondsElapsed / 60)}m ${secondsElapsed % 60}s.`,
        internalNotesActor: workerName
      });
    }

    showFeedback('success', `Zlecenie ${selectedOrderId} pomyślnie zebrane. Pojemnik: ${cleanBin}.`);
    setSelectedOrderId(null);
    setIsBinModalOpen(false);
    setSelectedBinId('');
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

        {!selectedOrderId && !isBatchMode ? (
          <div className="flex-grow flex flex-col gap-4 overflow-hidden max-w-4xl mx-auto w-full">
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 select-none shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-[#0052CC] mb-1.5">ZLECENIA OUTBOUND DO REALIZACJI</h3>
                <p className="text-xs text-zinc-650 leading-relaxed font-semibold">
                  Zabierz wózek widłowy lub koszyk paletowy, wybierz pierwsze najwyższe priorytetowo zlecenie i rozpocznij kompletację.
                </p>
              </div>
              <button
                type="button"
                onClick={handleStartBatchPick}
                className="w-full sm:w-auto h-11 px-5 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 active:scale-[0.98] text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all shrink-0 border-none select-none"
              >
                <Layers className="w-4 h-4 text-white" />
                Zbiórka partii (Batch Pick)
              </button>
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
                        <div className="text-xs text-zinc-500 mt-2 font-medium max-w-xl truncate" title={(order.items || []).map((item: any) => `${item.product || item.name} (${item.quantity || item.qty || 0} szt.)`).join(', ')}>
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide mr-1.5">Zawartość:</span>
                          {(order.items || []).map((item: any) => `${item.product || item.name} (${item.quantity || item.qty || 0})`).join(', ')}
                        </div>
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
        ) : isBatchMode ? (
          <div className="flex-grow flex flex-col lg:flex-row gap-6 overflow-hidden max-w-7xl mx-auto w-full">
            {/* Left Column: Tasks */}
            <div className="flex-grow flex flex-col gap-4 overflow-hidden lg:w-2/3">
              
              <div className="bg-white p-4 border border-zinc-200 rounded-2xl shrink-0 space-y-3.5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1 text-left">
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-indigo-600 font-mono uppercase tracking-widest font-bold">ZBIÓRKA PARTII BATCH</span>
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-250 text-[9px] uppercase tracking-wider font-extrabold rounded-lg select-none">
                        Wózek Sekcyjny (A, B, C)
                      </span>
                    </div>
                    <p className="text-xs text-zinc-650">
                      Kompletowanie partii zamówień: <span className="text-zinc-900 font-bold">{batchOrders.map(o => o.id).join(', ')}</span>
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playBeep();
                        if (confirm("Czy na pewno chcesz anulować zbiórkę partii? Stany zostaną zresetowane.")) {
                          setIsBatchMode(false);
                          setBatchOrders([]);
                        }
                      }}
                      className="px-3.5 h-9 border border-red-200 hover:bg-red-50 text-red-650 rounded-xl font-bold text-xs cursor-pointer bg-white transition-colors"
                    >
                      Anuluj partię
                    </button>
                  </div>
                </div>

                <div className="space-y-1 select-none">
                  <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500">
                    <span>POSTĘP ŚCIEŻKI ZBIÓRKI</span>
                    <span>
                      Krok {currentBatchStepIndex + 1} z {compiledBatchItems.length} ({compiledBatchItems.length > 0 ? Math.round((currentBatchStepIndex / compiledBatchItems.length) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="h-2.5 bg-zinc-150 rounded-full overflow-hidden border border-zinc-200 shadow-inner">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-600 to-indigo-650 transition-all duration-300"
                      style={{ width: `${compiledBatchItems.length > 0 ? (currentBatchStepIndex / compiledBatchItems.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>

              {compiledBatchItems[currentBatchStepIndex] ? (() => {
                const currentItem = compiledBatchItems[currentBatchStepIndex];
                const allAllocationsConfirmed = currentItem.allocations.every(
                  alloc => batchConfirmations[`${currentItem.sku}-${alloc.basketName}`] === true
                );

                return (
                  <div className="flex-grow flex flex-col bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="bg-gradient-to-r from-blue-700 to-indigo-850 p-4 text-white flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-indigo-300 animate-bounce" />
                        <div>
                          <span className="text-[9px] text-indigo-200 font-bold uppercase tracking-wider block leading-none">NASTĘPNA LOKALIZACJA</span>
                          <span className="text-xl font-mono font-black tracking-wide block mt-1">{currentItem.locationCode}</span>
                        </div>
                      </div>
                      <div className="bg-white/10 px-3 py-1 rounded text-xs font-mono font-bold border border-white/20 select-none">
                        Pobierz łącznie: {currentItem.totalQty} szt.
                      </div>
                    </div>

                    <div className="p-4 flex gap-4 border-b border-zinc-150 shrink-0 select-none bg-zinc-50/50">
                      <img 
                        src={getProductImage(currentItem.sku)} 
                        alt={currentItem.name} 
                        className="w-16 h-16 object-cover rounded-xl border border-zinc-200 shadow-xs" 
                      />
                      <div className="space-y-1 text-left min-w-0">
                        <span className="font-mono text-xs font-bold text-zinc-400 bg-white border px-1.5 py-0.5 rounded shadow-sm inline-block">{currentItem.sku}</span>
                        <h4 className="font-sans font-black text-sm text-zinc-900 leading-snug truncate">{currentItem.name}</h4>
                      </div>
                    </div>

                    <div className="flex-grow p-4 overflow-y-auto space-y-4">
                      <span className="text-[10px] font-black tracking-widest text-[#0052CC] block uppercase mb-1">PODZIAŁ DO WÓZKA SEKCYJNEGO</span>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {currentItem.allocations.map(alloc => {
                          const isConfirmed = batchConfirmations[`${currentItem.sku}-${alloc.basketName}`] === true;
                          return (
                            <div 
                              key={alloc.basketName}
                              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between items-center text-center gap-3 relative overflow-hidden ${
                                isConfirmed 
                                  ? 'bg-emerald-50/55 border-emerald-250 text-emerald-950 shadow-inner' 
                                  : 'bg-white border-zinc-200 shadow-sm'
                              }`}
                            >
                              <div className="space-y-0.5">
                                <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-full border tracking-wide uppercase ${
                                  isConfirmed 
                                    ? 'bg-emerald-100 border-emerald-250 text-emerald-800' 
                                    : alloc.basketName === 'Kosz A'
                                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                                    : alloc.basketName === 'Kosz B'
                                    ? 'bg-blue-50 border-blue-200 text-blue-800'
                                    : 'bg-purple-50 border-purple-200 text-purple-800'
                                }`}>
                                  {alloc.basketName}
                                </span>
                                <span className="text-[9px] text-zinc-450 block mt-1 font-mono uppercase font-bold">Zamówienie: {alloc.orderId}</span>
                              </div>

                              <div className="my-2.5">
                                <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider select-none">Odłóż ilość:</span>
                                <span className={`text-3xl font-black font-mono leading-none ${isConfirmed ? 'text-emerald-700' : 'text-zinc-950'}`}>
                                  {alloc.qty} <span className="text-xs font-bold font-sans">szt.</span>
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleConfirmBasketAllocation(alloc.orderId, alloc.basketName, alloc.qty)}
                                disabled={!isBatchSkuScanned || isConfirmed}
                                className={`w-full h-9 rounded-xl font-black text-[10px] uppercase border transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                                  isConfirmed 
                                    ? 'bg-emerald-600 border-emerald-650 hover:bg-emerald-700 text-white' 
                                    : 'bg-slate-900 border-slate-950 hover:bg-slate-800 text-white disabled:opacity-30 disabled:cursor-not-allowed'
                                }`}
                              >
                                {isConfirmed ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    ODŁOŻONE
                                  </>
                                ) : (
                                  'POTWIERDŹ ODŁOŻENIE'
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="bg-zinc-50 border-t border-zinc-150 p-4 shrink-0 flex flex-col sm:flex-row justify-between items-center gap-4">
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleProcessBatchScan(batchScanInput);
                        }}
                        className="w-full sm:w-80 flex gap-2"
                      >
                        <div className="relative flex-grow">
                          <Barcode className="w-4 h-4 text-zinc-400 absolute left-3 top-3.5 select-none" />
                          <input 
                            ref={batchScanInputRef}
                            type="text"
                            placeholder="Zeskanuj kod SKU produktu..."
                            value={batchScanInput}
                            onChange={(e) => setBatchScanInput(e.target.value)}
                            disabled={isBatchSkuScanned}
                            className="w-full h-11 pl-9 pr-3 border border-zinc-200 rounded-xl text-xs font-mono font-bold outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white disabled:bg-zinc-100 disabled:text-zinc-400"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={isBatchSkuScanned || !batchScanInput.trim()}
                          className="h-11 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-bold uppercase rounded-xl border-none cursor-pointer shadow-xs transition-colors shrink-0"
                        >
                          Skanuj
                        </button>
                      </form>

                      {allAllocationsConfirmed ? (
                        currentBatchStepIndex < compiledBatchItems.length - 1 ? (
                          <button
                            type="button"
                            onClick={() => {
                              sounds.playSuccess();
                              setCurrentBatchStepIndex(prev => prev + 1);
                              setIsBatchSkuScanned(false);
                              setTimeout(() => {
                                batchScanInputRef.current?.focus();
                              }, 200);
                            }}
                            className="w-full sm:w-auto h-11 px-6 bg-indigo-650 hover:bg-indigo-750 active:scale-[0.98] text-white text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer shadow-md transition-all shrink-0 border-none animate-bounce"
                          >
                            Następny regał &rarr;
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              sounds.playSuccess();
                              setIsBatchBinModalOpen(true);
                            }}
                            className="w-full sm:w-auto h-11 px-6 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer shadow-md transition-all shrink-0 border-none animate-pulse"
                          >
                            Zakończ zbiórkę partii
                          </button>
                        )
                      ) : (
                        <div className="text-zinc-500 text-xs font-semibold select-none flex items-center gap-1.5">
                          <AlertTriangle className="w-4.5 h-4.5 text-amber-500 shrink-0 animate-bounce" />
                          {isBatchSkuScanned 
                            ? 'Odłóż sztuki do wykazanych koszy i kliknij przyciski potwierdzające.' 
                            : 'Zeskanuj kod SKU produktu, aby odblokować przyciski włożenia.'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })() : (
                <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-4 shadow-sm">
                  <CheckCircle2 className="w-14 h-14 text-emerald-500" />
                  <p className="text-sm font-bold text-zinc-800">BRAK POZYCJI W PARTII</p>
                </div>
              )}

            </div>

            {/* Right Column: Route map list */}
            <div className="lg:w-1/3 bg-white p-4 border border-zinc-200 rounded-2xl flex flex-col gap-4 overflow-hidden select-none shrink-0 shadow-sm max-h-[450px] lg:max-h-none">
              <div>
                <span className="text-[10px] text-zinc-550 font-mono uppercase tracking-widest font-bold">Kolejność Regałów (Route Map)</span>
                <p className="text-[11px] text-zinc-500 mt-0.5">Zoptymalizowana ścieżka zbiórki dla tej partii.</p>
              </div>

              <div className="flex-grow overflow-y-auto space-y-2.5 pr-1">
                {compiledBatchItems.map((item, idx) => {
                  const isCurrent = idx === currentBatchStepIndex;
                  const isPassed = idx < currentBatchStepIndex;
                  return (
                    <div 
                      key={item.sku}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                        isCurrent 
                          ? 'bg-indigo-50 border-indigo-250 font-bold text-indigo-950 shadow-xs' 
                          : isPassed 
                          ? 'bg-zinc-50 border-zinc-150 text-zinc-400 opacity-60' 
                          : 'bg-white border-zinc-150 text-zinc-750 hover:bg-zinc-50/50'
                      }`}
                    >
                      <div className="space-y-0.5 flex-1 min-w-0 text-left">
                        <div className="flex items-center gap-1.5">
                          <MapPin className={`w-3.5 h-3.5 ${isCurrent ? 'text-indigo-650' : 'text-zinc-400'}`} />
                          <span className="font-mono font-bold tracking-wide">{item.locationCode}</span>
                        </div>
                        <p className="truncate font-sans font-medium">{item.name}</p>
                      </div>
                      <div className="font-mono font-bold shrink-0 ml-3 text-right">
                        {item.totalQty} szt.
                      </div>
                    </div>
                  );
                })}
              </div>
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
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-250 text-[9px] uppercase tracking-wider font-extrabold rounded-lg flex items-center gap-1 shadow-sm select-none animate-pulse">
                        <MapPin className="w-2.5 h-2.5 text-emerald-600" />
                        Optymalizacja Ścieżki
                      </span>
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
                {getSortedItems().map((item: any, idx: number) => {
                  const key = `${selectedOrder?.id}-${item.sku}`;
                  const picked = pickedItems[key] || 0;
                  const target = item.quantity || item.qty || 0;
                  const isDone = picked >= target;

                  // Find product's real location
                  const matchedProd = (products || []).find(p => p.sku === item.sku);
                  const displayLocation = matchedProd?.locationCode || `Korytarz ${item.zone || 'A1'}`;

                  const isFood = isFoodProduct(item.sku, matchedProd?.category);
                  const lotInfo = getMockLotInfo(item.sku, isFood);

                  return (
                    <div 
                      key={item.sku || idx}
                      className={`border rounded-2xl p-4.5 flex flex-col sm:flex-row items-start sm:items-center gap-5 transition-all ${
                        isDone 
                          ? 'bg-emerald-50/40 border-emerald-250 text-zinc-500 shadow-inner' 
                          : 'bg-white border-zinc-200 text-zinc-800 shadow-sm'
                      }`}
                    >
                      <div className="w-16 h-16 rounded-xl overflow-hidden border border-zinc-200 bg-zinc-50 shrink-0 select-none flex items-center justify-center">
                        {getProductImage(item.sku) ? (
                          <img src={getProductImage(item.sku)} alt={item.product || item.name} className="w-full h-full object-cover" />
                        ) : (
                          <Barcode className="w-6 h-6 text-zinc-350" />
                        )}
                      </div>

                      <div className="space-y-2.5 flex-grow w-full">
                        <div className="flex justify-between items-start gap-4 w-full">
                          <div className="space-y-1 text-left">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-xs font-extrabold bg-zinc-100 text-[#0052CC] px-2 py-0.5 rounded">{item.sku}</span>
                              <span className="font-sans font-black text-base text-zinc-950">{item.product || item.name}</span>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-zinc-500 mt-1">
                              <span className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 px-2.5 py-1 rounded-lg">
                                <MapPin className="w-3.5 h-3.5 text-amber-600 animate-bounce" />
                                LOKALIZACJA: <strong className="text-zinc-950 font-extrabold font-mono text-xs ml-0.5">{displayLocation}</strong>
                              </span>
                              <span className="bg-zinc-50 border border-zinc-200 px-2.5 py-1 rounded-lg text-amber-850 font-semibold flex items-center gap-1">
                                <Timer className="w-3.5 h-3.5 text-amber-500" />
                                KROK ŚCIEŻKI: <strong className="text-zinc-950 font-black font-mono text-xs">{idx + 1}</strong>
                              </span>
                            </div>

                            <div className="mt-2.5">
                              {isFood ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-250 text-amber-850 text-[10px] font-mono font-bold uppercase rounded-lg shadow-inner select-none animate-pulse">
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                  Wymagany lot FIFO: <strong className="text-zinc-950 font-black ml-0.5">{lotInfo.fifoLot}</strong> <span className="text-zinc-400">|</span> Ważność: {lotInfo.fifoExp}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-50 border border-zinc-200 text-zinc-500 text-[10px] font-mono font-bold uppercase rounded-lg">
                                  Partia: <strong className="text-zinc-800 font-bold ml-0.5">{lotInfo.fifoLot}</strong>
                                </span>
                              )}
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
                            onClick={() => {
                              sounds.playBeep();
                              setSelectedBinId('');
                              setIsBinModalOpen(true);
                            }}
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

      {/* Modal Zakończ kompletację / Wybierz pojemnik */}
      {isBinModalOpen && (
        <div id="assign-bin-modal" className="fixed inset-0 bg-[#0b1329]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-250 rounded-2xl w-full max-w-md shadow-2xl p-6 animate-in zoom-in-95 duration-150 text-left font-sans">
            <div className="flex items-center gap-3 text-zinc-950 border-b border-zinc-150 pb-4 mb-4 select-none">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-sm text-zinc-950 uppercase tracking-wide">Zakończ kompletację</h4>
                <p className="text-[10px] text-zinc-500 font-bold uppercase mt-0.5 tracking-wider">Krok 2/2: Przypisanie Pojemnika</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-zinc-650 leading-relaxed font-semibold">
                Przypisz skompletowane zamówienie <strong className="text-blue-600 font-mono font-black">{selectedOrderId}</strong> do pojemnika transportowego (np. kuwety lub wózka typu BIN).
              </p>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Wybierz z sugerowanych wolnych pojemników</label>
                <div className="flex flex-wrap gap-2 mb-4 select-none">
                  {['BIN-008', 'BIN-015', 'BIN-018', 'BIN-024', 'BIN-035', 'BIN-042'].map(bin => (
                    <button
                      key={bin}
                      type="button"
                      onClick={() => {
                        sounds.playBeep();
                        setSelectedBinId(bin);
                      }}
                      className={`px-3 py-1.5 rounded-lg border font-mono font-bold text-xs cursor-pointer transition-all hover:bg-blue-50/50 ${
                        selectedBinId === bin
                          ? 'bg-blue-50 border-blue-550 text-blue-700 shadow-sm'
                          : 'bg-zinc-50 border-zinc-200 text-zinc-650'
                      }`}
                    >
                      {bin}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Wpisz lub zeskanuj kod pojemnika</label>
                <div className="relative">
                  <input
                    ref={binInputRef}
                    type="text"
                    required
                    placeholder="np. BIN-024"
                    value={selectedBinId}
                    onChange={(e) => setSelectedBinId(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-zinc-300 rounded-xl text-zinc-900 outline-none focus:ring-2 focus:ring-[#0052CC] font-mono text-sm uppercase shadow-inner"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                    <Barcode className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 select-none">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playBeep();
                    setIsBinModalOpen(false);
                    setSelectedBinId('');
                  }}
                  className="px-4 py-2 border border-zinc-300 hover:bg-zinc-50 text-zinc-750 font-bold rounded-lg text-xs cursor-pointer bg-white"
                >
                  Anuluj
                </button>
                <button
                  type="button"
                  onClick={() => handleCompleteOrderPick(selectedBinId)}
                  disabled={!selectedBinId.trim() || selectedBinId.trim().length < 3}
                  className={`px-5 py-2 rounded-lg text-xs font-bold transition-all border-none flex items-center gap-1.5 ${
                    selectedBinId.trim() && selectedBinId.trim().length >= 3
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md cursor-pointer active:scale-[0.97]'
                      : 'bg-zinc-100 text-zinc-400 cursor-not-allowed border border-zinc-200'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Zakończ kompletację
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isBatchBinModalOpen && (
        <div id="assign-batch-bins-modal" className="fixed inset-0 bg-[#0b1329]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-250 rounded-2xl w-full max-w-md shadow-2xl p-6 animate-in zoom-in-95 duration-150 text-left font-sans">
            <div className="flex items-center gap-3 text-zinc-950 border-b border-zinc-150 pb-4 mb-4 select-none">
              <div className="p-2 bg-indigo-50 text-indigo-650 rounded-xl">
                <ShoppingCart className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="font-black text-sm text-zinc-950 uppercase tracking-wide">Zakończ zbiórkę partii</h4>
                <p className="text-[10px] text-zinc-500 font-bold uppercase mt-0.5 tracking-wider">Krok końcowy: Przypisanie Pojemników</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-zinc-650 leading-relaxed font-semibold">
                Każde zamówienie w partii zostało przypisane do odpowiedniej sekcji wózka. Potwierdź lub wpisz docelowe kody pojemników (kuwet), do których trafiają towary:
              </p>

              <div className="space-y-3">
                {batchOrders.map((order, idx) => {
                  const basketNames = ['Kosz A', 'Kosz B', 'Kosz C'];
                  const basketName = basketNames[idx] || `Kosz ${idx + 1}`;
                  return (
                    <div key={order.id} className="space-y-1">
                      <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500 uppercase tracking-wide select-none">
                        <span>{basketName} &rarr; ZAMÓWIENIE <strong className="text-zinc-800 font-mono">{order.id}</strong></span>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={batchBinIds[order.id] || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setBatchBinIds(prev => ({ ...prev, [order.id]: val }));
                          }}
                          placeholder={`np. ${basketName.toUpperCase().replace(' ', '-')}`}
                          className="w-full pl-9 pr-3.5 py-2 bg-white border border-zinc-300 rounded-xl text-zinc-900 outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs uppercase shadow-inner"
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                          <Barcode className="w-4.5 h-4.5" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end gap-3 pt-3 select-none">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playBeep();
                    setIsBatchBinModalOpen(false);
                  }}
                  className="px-4 py-2 border border-zinc-300 hover:bg-zinc-50 text-zinc-750 font-bold rounded-lg text-xs cursor-pointer bg-white"
                >
                  Wróć do zbiórki
                </button>
                <button
                  type="button"
                  onClick={handleCompleteBatchPick}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all border-none flex items-center gap-1.5 shadow-md cursor-pointer active:scale-[0.97]"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Zatwierdź i Wyślij
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
