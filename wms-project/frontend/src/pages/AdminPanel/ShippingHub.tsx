import React, { useState, useMemo, useEffect } from 'react';
import { 
  Send, Search, X, CheckCircle, AlertCircle, Filter, 
  FileText, Calendar, Printer, Settings, Check, DollarSign, 
  Barcode, Truck, Layers, Eye, RefreshCw, ClipboardCheck
} from 'lucide-react';

interface OrderItem {
  name: string;
  sku: string;
  qty: number;
}

interface Order {
  id: string;
  customer: string;
  destination: string;
  shippingAddress?: string;
  status: string;
  priority: string;
  shipmentDate: string;
  items: OrderItem[];
  binId?: string;
  packedBy?: string;
  internalNotes?: string;
  waybillNumber?: string;
  waybillPdfDate?: string;
  shippingMethod?: string;
}

interface CarrierRates {
  base: number;
  perKg: number;
}

interface RatesConfig {
  InPost: CarrierRates;
  DPD: CarrierRates;
  DHL: CarrierRates;
  GLS: CarrierRates;
  UPS: CarrierRates;
}

interface ShippingHubProps {
  orders: Order[];
  onUpdateOrder: (orderId: string, updatedFields: Partial<Order>) => void;
  addToast: (title: string, text: string, type: 'error' | 'warning' | 'info' | 'success') => void;
}

interface Manifest {
  id: string;
  carrier: string;
  date: string;
  orders: string[];
  totalWeight: number;
  totalPackages: number;
}

export default function ShippingHub({
  orders = [],
  onUpdateOrder,
  addToast
}: ShippingHubProps) {
  // Tabs: 'unshipped' | 'shipped' | 'manifests' | 'pricing'
  const [activeTab, setActiveTab] = useState<'unshipped' | 'shipped' | 'manifests' | 'pricing'>('unshipped');
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  
  // Carrier pricing config in state (loaded from localstorage or default)
  const [rates, setRates] = useState<RatesConfig>(() => {
    try {
      const saved = window.localStorage.getItem('wms-carrier-rates');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse carrier rates:", e);
    }
    return {
      InPost: { base: 12.0, perKg: 1.5 },
      DPD: { base: 15.0, perKg: 1.2 },
      DHL: { base: 17.0, perKg: 1.0 },
      GLS: { base: 16.0, perKg: 1.1 },
      UPS: { base: 22.0, perKg: 0.8 },
    };
  });

  // Manifests state (loaded from localstorage or default)
  const [manifests, setManifests] = useState<Manifest[]>(() => {
    try {
      const saved = window.localStorage.getItem('wms-shipping-manifests');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse manifests:", e);
    }
    return [];
  });

  // Selected orders for bulk shipping / actions
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [selectedCarriers, setSelectedCarriers] = useState<Record<string, string>>({});

  // Simulation states
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingLog, setProcessingLog] = useState<string[]>([]);
  const [currentlyProcessingOrder, setCurrentlyProcessingOrder] = useState('');

  // Print view state
  const [printLayoutType, setPrintLayoutType] = useState<'labels' | 'manifest' | null>(null);
  const [printOrders, setPrintOrders] = useState<Order[]>([]);
  const [printManifest, setPrintManifest] = useState<Manifest | null>(null);

  // Manifest creator state
  const [isManifestModalOpen, setIsManifestModalOpen] = useState(false);
  const [manifestCarrier, setManifestCarrier] = useState('DPD');

  // Parse weight helper
  const getOrderWeight = (order: Order) => {
    const match = order.internalNotes?.match(/o wadze (\d+(\.\d+)?)kg/);
    if (match && match[1]) {
      return parseFloat(match[1]);
    }
    // Fallback based on quantity of items
    const itemsCount = order.items?.reduce((acc, it) => acc + (it.qty || 1), 0) || 1;
    return parseFloat((itemsCount * 0.65 + 0.95).toFixed(2));
  };

  // Calculate pricing comparison for an order
  const calculateRatesForOrder = (order: Order) => {
    const weight = getOrderWeight(order);
    return {
      InPost: weight <= 25 ? rates.InPost.base + rates.InPost.perKg * weight : null,
      DPD: rates.DPD.base + rates.DPD.perKg * weight,
      DHL: rates.DHL.base + rates.DHL.perKg * weight,
      GLS: rates.GLS.base + rates.GLS.perKg * weight,
      UPS: rates.UPS.base + rates.UPS.perKg * weight,
    };
  };

  // Find cheapest carrier for an order
  const getCheapestCarrier = (order: Order) => {
    const calculated = calculateRatesForOrder(order);
    let cheapest: keyof RatesConfig = 'DPD';
    let minPrice = Infinity;

    (Object.keys(calculated) as Array<keyof RatesConfig>).forEach((carrier) => {
      const price = calculated[carrier];
      if (price !== null && price < minPrice) {
        minPrice = price;
        cheapest = carrier;
      }
    });

    return { carrier: cheapest, price: minPrice };
  };

  // Save rates to localstorage
  const handleSaveRates = (e: React.FormEvent) => {
    e.preventDefault();
    window.localStorage.setItem('wms-carrier-rates', JSON.stringify(rates));
    addToast('Stawki zapisane', 'Pomyślnie zaktualizowano cennik u kurierów.', 'success');
  };

  // Unshipped orders (status === 'Spakowane')
  const unshippedOrders = useMemo(() => {
    return orders.filter(o => o.status === 'Spakowane');
  }, [orders]);

  // Shipped orders (status === 'Wysłane')
  const shippedOrders = useMemo(() => {
    return orders.filter(o => o.status === 'Wysłane');
  }, [orders]);

  // Filter lists based on search query
  const filteredUnshipped = useMemo(() => {
    return unshippedOrders.filter(o => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return o.id.toLowerCase().includes(q) || 
             o.customer.toLowerCase().includes(q) || 
             (o.shippingAddress || o.destination).toLowerCase().includes(q);
    });
  }, [unshippedOrders, searchQuery]);

  const filteredShipped = useMemo(() => {
    return shippedOrders.filter(o => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return o.id.toLowerCase().includes(q) || 
             o.customer.toLowerCase().includes(q) || 
             o.waybillNumber?.toLowerCase().includes(q);
    });
  }, [shippedOrders, searchQuery]);

  // Handle individual carrier selection change in table
  const handleCarrierChange = (orderId: string, carrier: string) => {
    setSelectedCarriers(prev => ({ ...prev, [orderId]: carrier }));
  };

  // Auto pre-populate cheapest carriers for all unshipped
  useEffect(() => {
    const carrierUpdates: Record<string, string> = {};
    unshippedOrders.forEach((o) => {
      if (!selectedCarriers[o.id]) {
        carrierUpdates[o.id] = getCheapestCarrier(o).carrier;
      }
    });
    if (Object.keys(carrierUpdates).length > 0) {
      setSelectedCarriers(prev => ({ ...prev, ...carrierUpdates }));
    }
  }, [unshippedOrders]);

  // Selection toggle
  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrderIds(filteredUnshipped.map(o => o.id));
    } else {
      setSelectedOrderIds([]);
    }
  };

  const toggleSelectOrder = (orderId: string, checked: boolean) => {
    if (checked) {
      setSelectedOrderIds(prev => [...prev, orderId]);
    } else {
      setSelectedOrderIds(prev => prev.filter(id => id !== orderId));
    }
  };

  // Dispatches / Generates labels in bulk (Simulation)
  const handleBulkDispatch = async () => {
    if (selectedOrderIds.length === 0) {
      alert('Zaznacz co najmniej jedno zamówienie do wysyłki.');
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);
    setProcessingLog([]);

    const ordersToProcess = orders.filter(o => selectedOrderIds.includes(o.id));
    
    for (let i = 0; i < ordersToProcess.length; i++) {
      const order = ordersToProcess[i];
      const carrier = selectedCarriers[order.id] || 'DPD';
      
      setCurrentlyProcessingOrder(order.id);
      setProcessingProgress(Math.round((i / ordersToProcess.length) * 100));

      const logMsg = (msg: string) => {
        setProcessingLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
      };

      logMsg(`Rozpoczynanie procesu wysyłki dla ${order.id}...`);
      await new Promise(resolve => setTimeout(resolve, 400));
      
      logMsg(`Łączenie z serwerem API ${carrier}...`);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      logMsg(`Przesyłanie wagi paczki (${getOrderWeight(order).toFixed(2)} kg) oraz adresu dostawy...`);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Generate simulated waybill
      const randomNum = Math.floor(1000000000 + Math.random() * 9000000000);
      const waybill = `${carrier.substring(0, 3).toUpperCase()}-${randomNum}`;
      
      logMsg(`Wygenerowano list przewozowy: ${waybill}. Zapisywanie danych.`);

      onUpdateOrder(order.id, {
        status: 'Wysłane',
        waybillNumber: waybill,
        waybillPdfDate: new Date().toLocaleDateString('pl-PL', { day: '2-digit', month: 'short', year: 'numeric' }),
        shippingMethod: carrier + ' Standard'
      });

      await new Promise(resolve => setTimeout(resolve, 300));
    }

    setProcessingProgress(100);
    setProcessingLog(prev => [`[${new Date().toLocaleTimeString()}] ZAKOŃCZONO PROCES Z LEKKIM SUKCESEM!`, ...prev]);
    
    addToast(
      'Przesyłki nadane',
      `Pomyślnie nadano ${ordersToProcess.length} paczek kurierskich.`,
      'success'
    );

    setTimeout(() => {
      setIsProcessing(false);
      setSelectedOrderIds([]);
      setActiveTab('shipped');
    }, 1500);
  };

  // Bulk Print selected waybills
  const handleBulkPrint = (selectedIds: string[]) => {
    if (selectedIds.length === 0) {
      alert('Zaznacz co najmniej jedno zamówienie, aby wydrukować etykiety.');
      return;
    }
    const selectedOrders = orders.filter(o => selectedIds.includes(o.id) && o.status === 'Wysłane');
    if (selectedOrders.length === 0) {
      alert('Brak wygenerowanych listów przewozowych dla wybranych pozycji.');
      return;
    }
    setPrintOrders(selectedOrders);
    setPrintLayoutType('labels');
  };

  // Open Manifest Modal
  const openManifestModal = () => {
    if (shippedOrders.length === 0) {
      alert('Brak wysłanych przesyłek dzisiaj do wygenerowania manifestu.');
      return;
    }
    setIsManifestModalOpen(true);
  };

  // Generate Manifest
  const handleCreateManifest = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Find all shipped orders with selected carrier that are NOT yet in any manifest
    const alreadyManifested = manifests.flatMap(m => m.orders);
    const candidateOrders = shippedOrders.filter(o => 
      o.shippingMethod?.startsWith(manifestCarrier) && !alreadyManifested.includes(o.id)
    );

    if (candidateOrders.length === 0) {
      alert(`Brak nowych przesyłek dla kuriera ${manifestCarrier} gotowych do odprawy.`);
      return;
    }

    const manifestId = `MAN-${manifestCarrier.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const totalWeight = candidateOrders.reduce((acc, o) => acc + getOrderWeight(o), 0);

    const newManifest: Manifest = {
      id: manifestId,
      carrier: manifestCarrier,
      date: new Date().toLocaleDateString('pl-PL', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
      orders: candidateOrders.map(o => o.id),
      totalWeight: parseFloat(totalWeight.toFixed(2)),
      totalPackages: candidateOrders.length
    };

    const updated = [newManifest, ...manifests];
    setManifests(updated);
    window.localStorage.setItem('wms-shipping-manifests', JSON.stringify(updated));

    setIsManifestModalOpen(false);
    addToast('Manifest wygenerowany', `Wygenerowano manifest ${manifestId} dla ${manifestCarrier} (ilość: ${candidateOrders.length} paczek).`, 'success');
  };

  // Print manifest
  const handlePrintManifest = (manifest: Manifest) => {
    setPrintManifest(manifest);
    setPrintOrders(orders.filter(o => manifest.orders.includes(o.id)));
    setPrintLayoutType('manifest');
  };

  // Delete manifest
  const handleDeleteManifest = (id: string) => {
    if (confirm(`Czy na pewno usunąć manifest ${id}? Przesyłki zostaną zwolnione do ponownej odprawy.`)) {
      const updated = manifests.filter(m => m.id !== id);
      setManifests(updated);
      window.localStorage.setItem('wms-shipping-manifests', JSON.stringify(updated));
    }
  };

  // Trigger print dialog when print layout is populated
  useEffect(() => {
    if (printLayoutType) {
      const timer = setTimeout(() => {
        window.print();
        setPrintLayoutType(null);
        setPrintOrders([]);
        setPrintManifest(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [printLayoutType]);

  // Statistics summaries
  const statsSummary = useMemo(() => {
    // Total shipped costs (calculated by assigned carrier prices)
    let totalCost = 0;
    shippedOrders.forEach((o) => {
      const carrier = o.shippingMethod?.replace(' Standard', '') || 'DPD';
      const weight = getOrderWeight(o);
      const carrierRates = rates[carrier as keyof RatesConfig] || rates.DPD;
      totalCost += carrierRates.base + carrierRates.perKg * weight;
    });

    return {
      unshippedCount: unshippedOrders.length,
      shippedCount: shippedOrders.length,
      totalCost: parseFloat(totalCost.toFixed(2)),
      manifestsCount: manifests.length
    };
  }, [shippedOrders, unshippedOrders, manifests, rates]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50 p-6 overflow-y-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Truck className="w-7 h-7 text-indigo-600" />
            Shipping Hub & Smart Broker
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Zarządzanie spedycją, porównywanie stawek kurierskich (Broker) i masowe generowanie listów przewozowych DPD, InPost, DHL, GLS, UPS
          </p>
        </div>
      </div>

      {/* KPI Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Do wysłania (Spakowane)</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{statsSummary.unshippedCount} szt.</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Wysłane przesyłki</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{statsSummary.shippedCount} szt.</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Koszty spedycji (dzienne)</p>
            <p className="text-xl font-black text-slate-950 font-mono mt-0.5">{statsSummary.totalCost.toFixed(2)} PLN</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-650 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Aktywne Manifesty</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{statsSummary.manifestsCount} szt.</p>
          </div>
        </div>

      </div>

      {/* Tabs list */}
      <div className="flex border-b border-slate-200 mb-6 gap-2 overflow-x-auto">
        {[
          { id: 'unshipped', label: 'Paczkowane (Do wysyłki)', count: unshippedOrders.length },
          { id: 'shipped', label: 'Nadane / Wysłane', count: shippedOrders.length },
          { id: 'manifests', label: 'Manifesty Kurierskie', count: manifests.length },
          { id: 'pricing', label: 'Konfiguracja stawek kurierów' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              setSearchQuery('');
            }}
            className={`pb-3 px-4 font-bold text-sm border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === tab.id
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                activeTab === tab.id ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab: READY TO SHIP / UNSHIPPED */}
      {activeTab === 'unshipped' && (
        <div className="space-y-4 flex-1 flex flex-col min-h-0">
          
          {/* Action bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Szukaj zamówień po ID, adresie, odbiorcy..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            <div className="flex items-center gap-3">
              {selectedOrderIds.length > 0 && (
                <span className="text-xs font-bold text-indigo-600">
                  Wybrano: {selectedOrderIds.length} zamówień
                </span>
              )}
              
              <button
                onClick={handleBulkDispatch}
                disabled={selectedOrderIds.length === 0}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-100 transition-all"
              >
                <Send className="w-4 h-4" />
                Generuj etykiety masowo
              </button>
            </div>

          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-0 flex-1">
            <div className="overflow-x-auto min-h-0 flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4 w-12 text-center select-none">
                      <input
                        type="checkbox"
                        checked={filteredUnshipped.length > 0 && selectedOrderIds.length === filteredUnshipped.length}
                        onChange={(e) => toggleSelectAll(e.target.checked)}
                        className="rounded border-slate-350 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                    </th>
                    <th className="py-3 px-4 font-black">Zlecenie</th>
                    <th className="py-3 px-4 font-black">Kontrahent / Adres</th>
                    <th className="py-3 px-4 font-black text-center">Waga paczki</th>
                    <th className="py-3 px-4 font-black">Porównywarka Stawek (Broker)</th>
                    <th className="py-3 px-4 font-black text-right">Wybrany Kurier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredUnshipped.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                        <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2.5 animate-pulse" />
                        Brak paczek oczekujących na wysyłkę. Wszystkie spakowane zlecenia zostały przekazane do kurierów!
                      </td>
                    </tr>
                  ) : (
                    filteredUnshipped.map((order) => {
                      const weight = getOrderWeight(order);
                      const calculated = calculateRatesForOrder(order);
                      const cheapest = getCheapestCarrier(order);
                      const currentSelected = selectedCarriers[order.id] || cheapest.carrier;

                      return (
                        <tr key={order.id} className={`hover:bg-slate-50/50 transition-colors ${selectedOrderIds.includes(order.id) ? 'bg-indigo-50/20' : ''}`}>
                          
                          {/* Checkbox */}
                          <td className="py-4 px-4 text-center select-none">
                            <input
                              type="checkbox"
                              checked={selectedOrderIds.includes(order.id)}
                              onChange={(e) => toggleSelectOrder(order.id, e.target.checked)}
                              className="rounded border-slate-350 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                            />
                          </td>

                          {/* Order ID */}
                          <td className="py-4 px-4">
                            <span className="font-mono font-black text-slate-900 block">{order.id}</span>
                            <span className="text-[10px] text-slate-450 mt-1 font-medium block">
                              Pakował: {order.packedBy || 'System Packer'}
                            </span>
                          </td>

                          {/* Client & Dest */}
                          <td className="py-4 px-4">
                            <div className="font-bold text-slate-800">{order.customer}</div>
                            <div className="text-slate-450 mt-0.5 truncate max-w-xs" title={order.shippingAddress || order.destination}>
                              {order.shippingAddress || order.destination}
                            </div>
                          </td>

                          {/* Weight */}
                          <td className="py-4 px-4 text-center font-bold font-mono text-slate-700">
                            {weight.toFixed(2)} kg
                          </td>

                          {/* Rates comparison layout */}
                          <td className="py-4 px-4">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {(Object.keys(calculated) as Array<keyof RatesConfig>).map((carrier) => {
                                const price = calculated[carrier];
                                const isCheapest = cheapest.carrier === carrier;
                                const isSelected = currentSelected === carrier;

                                if (price === null) return null; // limit Exceeded for InPost

                                return (
                                  <div
                                    key={carrier}
                                    onClick={() => handleCarrierChange(order.id, carrier)}
                                    className={`px-2 py-1 rounded-lg border text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1 ${
                                      isSelected
                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm font-black'
                                        : isCheapest
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100/50'
                                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                                    }`}
                                  >
                                    <span>{carrier}:</span>
                                    <span className="font-mono">{price.toFixed(2)} zł</span>
                                    {isCheapest && <span className="text-[8px] bg-emerald-500 text-white font-bold px-1 rounded">MIN</span>}
                                  </div>
                                );
                              })}
                            </div>
                          </td>

                          {/* Chosen carrier */}
                          <td className="py-4 px-4 text-right">
                            <select
                              value={currentSelected}
                              onChange={(e) => handleCarrierChange(order.id, e.target.value)}
                              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                              {weight <= 25 && <option value="InPost">InPost (Kurier)</option>}
                              <option value="DPD">DPD Polska</option>
                              <option value="DHL">DHL Express</option>
                              <option value="GLS">GLS</option>
                              <option value="UPS">UPS Worldwide</option>
                            </select>
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Tab: SHIPPED / LABELS GENERATED */}
      {activeTab === 'shipped' && (
        <div className="space-y-4 flex-1 flex flex-col min-h-0">
          
          {/* Action bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Szukaj wysłanych po ID, kurierze, liście przewozowym..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={openManifestModal}
                className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-lg shadow-purple-100 transition-all"
              >
                <ClipboardCheck className="w-4 h-4" />
                Generuj Manifest Kuriera
              </button>

              <button
                onClick={() => handleBulkPrint(filteredShipped.map(o => o.id))}
                className="inline-flex items-center gap-2 bg-slate-850 hover:bg-slate-900 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-md transition-all"
              >
                <Printer className="w-4 h-4" />
                Drukuj zbiorczo etykiety
              </button>
            </div>

          </div>

          {/* Shipped table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-0 flex-1">
            <div className="overflow-x-auto min-h-0 flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4 font-black">Zlecenie WMS</th>
                    <th className="py-3 px-4 font-black">Kontrahent</th>
                    <th className="py-3 px-4 font-black">Przewoźnik spedycji</th>
                    <th className="py-3 px-4 font-black">Numer listu przewozowego</th>
                    <th className="py-3 px-4 font-black text-center">Waga</th>
                    <th className="py-3 px-4 font-black">Data odprawy</th>
                    <th className="py-3 px-4 font-black text-right">Akcje</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredShipped.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                        Brak nadanych przesyłek pasujących do wyszukiwania.
                      </td>
                    </tr>
                  ) : (
                    filteredShipped.map((order) => {
                      const weight = getOrderWeight(order);
                      return (
                        <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                          
                          <td className="py-4 px-4 font-mono font-black text-slate-900">
                            {order.id}
                          </td>

                          <td className="py-4 px-4 font-bold text-slate-800">
                            {order.customer}
                          </td>

                          <td className="py-4 px-4">
                            <span className="font-bold text-slate-700">{order.shippingMethod}</span>
                          </td>

                          <td className="py-4 px-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 font-mono font-bold text-slate-700">
                              <Barcode className="w-4 h-4 text-slate-550 shrink-0" />
                              {order.waybillNumber}
                            </span>
                          </td>

                          <td className="py-4 px-4 text-center font-bold font-mono text-slate-700">
                            {weight.toFixed(2)} kg
                          </td>

                          <td className="py-4 px-4 font-medium text-slate-500">
                            {order.waybillPdfDate}
                          </td>

                          <td className="py-4 px-4 text-right">
                            <button
                              onClick={() => handleBulkPrint([order.id])}
                              className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-[10px] font-black px-2.5 py-1.5 rounded-lg transition-all"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              Drukuj etykietę
                            </button>
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Tab: SHIPPING MANIFESTS */}
      {activeTab === 'manifests' && (
        <div className="space-y-4 flex-1 flex flex-col min-h-0">
          
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-0 flex-1">
            <div className="overflow-x-auto min-h-0 flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4 font-black">ID Manifestu</th>
                    <th className="py-3 px-4 font-black">Przewoźnik spedycyjny</th>
                    <th className="py-3 px-4 font-black">Data wygenerowania</th>
                    <th className="py-3 px-4 font-black text-center">Liczba paczek</th>
                    <th className="py-3 px-4 font-black text-center">Waga całkowita</th>
                    <th className="py-3 px-4 font-black text-right">Akcje</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {manifests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                        Nie wygenerowano jeszcze żadnych manifestów wysyłkowych. Kliknij przycisk „Generuj Manifest Kuriera” w zakładce „Nadane” aby odprawić paczki u wybranego kuriera.
                      </td>
                    </tr>
                  ) : (
                    manifests.map((manifest) => (
                      <tr key={manifest.id} className="hover:bg-slate-50/50 transition-colors">
                        
                        <td className="py-4 px-4 font-mono font-black text-slate-900">
                          {manifest.id}
                        </td>

                        <td className="py-4 px-4 font-bold text-slate-800">
                          {manifest.carrier}
                        </td>

                        <td className="py-4 px-4 font-medium text-slate-500">
                          {manifest.date}
                        </td>

                        <td className="py-4 px-4 text-center font-bold font-mono text-slate-700">
                          {manifest.totalPackages} szt.
                        </td>

                        <td className="py-4 px-4 text-center font-bold font-mono text-slate-700">
                          {manifest.totalWeight} kg
                        </td>

                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handlePrintManifest(manifest)}
                              className="inline-flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold px-2.5 py-1.5 rounded-lg transition-all"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              Drukuj manifest
                            </button>
                            <button
                              onClick={() => handleDeleteManifest(manifest.id)}
                              className="inline-flex items-center justify-center bg-rose-50 hover:bg-rose-100 text-rose-600 p-1.5 rounded-lg transition-all border-none"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Tab: PRICING CONFIGURATION */}
      {activeTab === 'pricing' && (
        <form onSubmit={handleSaveRates} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 max-w-2xl space-y-6">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-1 flex items-center gap-2">
              <Settings className="w-4 h-4 text-indigo-600" />
              Cenniki bazowe i taryfy kurierskie (Smart Broker Rates)
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">Ustal bazowe koszty oraz dopłaty wagowe dla poszczególnych przewoźników spedycyjnych w celu optymalizacji i rekomendacji najtańszych wysyłek</p>
          </div>

          <div className="divide-y divide-slate-100">
            {(Object.keys(rates) as Array<keyof RatesConfig>).map((carrier) => (
              <div key={carrier} className="py-4 grid grid-cols-3 gap-4 items-center">
                <span className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                  {carrier === 'InPost' ? 'InPost Paczkomat/Kurier' : carrier}
                </span>

                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1">Cena bazowa (PLN)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={rates[carrier].base}
                    onChange={(e) => setRates(prev => ({
                      ...prev,
                      [carrier]: { ...prev[carrier], base: parseFloat(e.target.value) || 0 }
                    }))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 text-right"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1">Dopłata wagowa (PLN za kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={rates[carrier].perKg}
                    onChange={(e) => setRates(prev => ({
                      ...prev,
                      [carrier]: { ...prev[carrier], perKg: parseFloat(e.target.value) || 0 }
                    }))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 text-right"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-100 transition-all"
            >
              <Check className="w-4 h-4" />
              Zapisz ustawienia taryfowe
            </button>
          </div>
        </form>
      )}

      {/* DISPATCH SIMULATION PROGRESS MODAL */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-xl rounded-3xl border border-slate-100 shadow-2xl overflow-hidden flex flex-col p-6 space-y-6">
            
            <div className="text-center space-y-2">
              <RefreshCw className="w-8 h-8 text-indigo-600 mx-auto animate-spin" />
              <h3 className="text-base font-black text-slate-900 tracking-tight">Trwa generowanie etykiet kurierskich...</h3>
              <p className="text-xs text-slate-400 font-medium">Proces integracji EDI, autoryzacji sesji SSL i rejestracji listów przewozowych w systemach kurierów</p>
            </div>

            {/* Progress bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-black text-slate-500 font-mono">
                <span>Zlecenie: {currentlyProcessingOrder}</span>
                <span>{processingProgress}%</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                  style={{ width: `${processingProgress}%` }}
                ></div>
              </div>
            </div>

            {/* Log output */}
            <div className="bg-slate-950 p-4 rounded-2xl h-48 overflow-y-auto flex flex-col-reverse text-[10px] font-mono text-emerald-400 border border-slate-800 shadow-inner leading-relaxed">
              {processingLog.map((log, idx) => (
                <div key={idx} className="whitespace-pre-line">{log}</div>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* COURIER MANIFEST CREATION MODAL */}
      {isManifestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl border border-slate-100 shadow-2xl overflow-hidden flex flex-col">
            
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Nowy Manifest Spedycyjny</h3>
                <p className="text-[10px] text-slate-400 font-semibold">Zamknięcie paczek i wydrukowanie protokołu przekazania kurierowi</p>
              </div>
              <button 
                onClick={() => setIsManifestModalOpen(false)}
                className="p-1 hover:bg-slate-200 text-slate-400 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateManifest} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  Wybierz przewoźnika do odprawy
                </label>
                <select
                  value={manifestCarrier}
                  onChange={(e) => setManifestCarrier(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="DPD">DPD Polska</option>
                  <option value="InPost">InPost (Kurier)</option>
                  <option value="DHL">DHL Express</option>
                  <option value="GLS">GLS</option>
                  <option value="UPS">UPS Worldwide</option>
                </select>
                <span className="text-[9px] text-slate-400 font-medium block">
                  System wyodrębni wszystkie dzisiejsze wysyłki dla tego kuriera, które nie zostały jeszcze przypisane do żadnego protokołu przekazania.
                </span>
              </div>

              <div className="bg-slate-50 p-4 border border-slate-150 rounded-2xl text-xs space-y-1">
                <span className="font-bold text-slate-700 block mb-1">Podsumowanie dostępnych przesyłek:</span>
                {['DPD', 'InPost', 'DHL', 'GLS', 'UPS'].map(c => {
                  const alreadyManifested = manifests.flatMap(m => m.orders);
                  const count = shippedOrders.filter(o => 
                    o.shippingMethod?.startsWith(c) && !alreadyManifested.includes(o.id)
                  ).length;
                  return (
                    <div key={c} className="flex justify-between font-mono">
                      <span>{c}:</span>
                      <span className={count > 0 ? 'text-indigo-600 font-bold' : 'text-slate-400'}>{count} paczek</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsManifestModalOpen(false)}
                  className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl transition-all"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="bg-purple-650 hover:bg-purple-750 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg shadow-purple-100 transition-all"
                >
                  Generuj Manifest
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* PRINT MEDIA TEMPLATES CONTAINER */}
      {printLayoutType === 'labels' && printOrders.length > 0 && (
        <div id="print-labels-container" className="hidden print:block p-4 bg-white text-black font-sans">
          {printOrders.map((order, idx) => {
            const weight = getOrderWeight(order);
            const carrier = order.shippingMethod?.replace(' Standard', '') || 'DPD';
            
            return (
              <div 
                key={order.id} 
                className="print-label-card border-2 border-black p-4 w-[100mm] h-[150mm] mx-auto my-8 bg-white flex flex-col justify-between"
                style={{ pageBreakAfter: 'always', breakAfter: 'page' }}
              >
                
                {/* Carrier header */}
                <div className="flex justify-between items-center border-b-2 border-black pb-2 select-none">
                  <span className="text-lg font-black tracking-tighter uppercase">{carrier} SHIPPING</span>
                  <span className="text-xs font-mono font-bold border border-black px-1.5 py-0.5 rounded">STANDARD</span>
                </div>

                {/* Sender & Receiver Details */}
                <div className="grid grid-cols-2 gap-2 text-[9px] border-b border-black py-2">
                  <div className="border-r border-black pr-2">
                    <span className="block font-bold uppercase text-[7px] text-zinc-500 mb-0.5">NADAWCA (Sender)</span>
                    <p className="font-bold">HUB-PL-01 WMS Logistics</p>
                    <p>Hala Spedycyjna 1, Stanowisko 4</p>
                    <p>60-001 Poznań, PL</p>
                  </div>
                  <div className="pl-2">
                    <span className="block font-bold uppercase text-[7px] text-zinc-500 mb-0.5">ODBIORCA (Receiver)</span>
                    <p className="font-bold text-xs">{order.customer}</p>
                    <p className="font-semibold">{order.shippingAddress || order.destination}</p>
                  </div>
                </div>

                {/* Packet specifications */}
                <div className="grid grid-cols-3 gap-1 text-center border-b border-black py-1.5 text-[8.5px]">
                  <div>
                    <span className="block text-[7px] text-zinc-500">WAGA (Weight)</span>
                    <strong className="font-mono font-bold text-slate-800">{weight.toFixed(2)} kg</strong>
                  </div>
                  <div>
                    <span className="block text-[7px] text-zinc-500">ZLECENIE (Order ID)</span>
                    <strong className="font-mono font-bold text-slate-800">{order.id}</strong>
                  </div>
                  <div>
                    <span className="block text-[7px] text-zinc-500">DATA (Date)</span>
                    <strong className="font-mono font-bold text-slate-800">{order.waybillPdfDate}</strong>
                  </div>
                </div>

                {/* Barcode & Waybill */}
                <div className="flex-1 flex flex-col items-center justify-center py-3 select-none">
                  
                  {/* Mock Barcode visual */}
                  <div className="flex items-center gap-0.5 h-12 w-full px-2">
                    {[1, 2, 4, 1, 3, 1, 2, 1, 4, 2, 1, 3, 2, 1, 4, 1, 2, 3, 1, 2, 1, 4, 1, 2, 3, 1, 2, 4, 1].map((bar, i) => (
                      <div 
                        key={i} 
                        className="bg-black h-full flex-1" 
                        style={{ flexGrow: bar }}
                      ></div>
                    ))}
                  </div>

                  <span className="text-[10px] font-mono font-black tracking-widest mt-1 text-slate-900">
                    {order.waybillNumber}
                  </span>

                </div>

                {/* Footer code and Routing Info */}
                <div className="border-t-2 border-black pt-2 flex items-center justify-between text-[8px] font-bold select-none">
                  <div>
                    <span className="block text-[6px] text-zinc-400">ROUTING</span>
                    <span>HUB-PL-01 &gt;&gt; DEST-SORT-04</span>
                  </div>
                  <div className="w-8 h-8 bg-black flex items-center justify-center text-white text-xs font-black">
                    {carrier.substring(0, 1).toUpperCase()}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* PRINT MEDIA MANIFEST PROTOCOL */}
      {printLayoutType === 'manifest' && printManifest && printOrders.length > 0 && (
        <div id="print-manifest-container" className="hidden print:block p-8 bg-white text-slate-900 font-sans">
          <div className="border-2 border-slate-950 p-6 rounded-lg max-w-4xl mx-auto space-y-6">
            
            {/* Manifest header */}
            <div className="flex items-start justify-between border-b-2 border-slate-950 pb-6">
              <div>
                <h1 className="text-xl font-black uppercase tracking-tight text-slate-950">Manifest Przekazania Paczek / Odprawa</h1>
                <p className="text-xs font-mono mt-1 text-slate-600">Protokół ID: {printManifest.id}</p>
              </div>
              <div className="text-right text-xs space-y-1 text-slate-700">
                <p><strong>Magazyn Centralny HUB-PL-01</strong></p>
                <p>WMS Spedycja & Logistics OS</p>
                <p>Data manifestu: {printManifest.date}</p>
              </div>
            </div>

            {/* Carrier information details */}
            <div className="bg-slate-50 p-4 border border-slate-200 rounded-lg grid grid-cols-3 gap-4 text-xs font-medium">
              <div>
                <span className="block text-slate-400 font-bold uppercase tracking-wider text-[8px] mb-0.5">Przewoźnik odbierający</span>
                <span className="font-bold text-slate-800 text-sm">{printManifest.carrier}</span>
              </div>
              <div>
                <span className="block text-slate-400 font-bold uppercase tracking-wider text-[8px] mb-0.5">Liczba paczek</span>
                <span className="font-bold text-slate-800 text-sm font-mono">{printManifest.totalPackages} szt.</span>
              </div>
              <div>
                <span className="block text-slate-400 font-bold uppercase tracking-wider text-[8px] mb-0.5">Masa całkowita (brutto)</span>
                <span className="font-bold text-slate-800 text-sm font-mono">{printManifest.totalWeight} kg</span>
              </div>
            </div>

            {/* List of orders */}
            <div className="space-y-2">
              <h3 className="font-bold uppercase text-[10px] tracking-wider text-slate-900">Ewidencja załadunku przesyłek</h3>
              <table className="w-full border-collapse border border-slate-350 text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 uppercase text-[9px] font-bold">
                    <th className="border border-slate-350 py-1.5 px-3 text-left">Lp.</th>
                    <th className="border border-slate-350 py-1.5 px-3 text-left">Zlecenie WMS</th>
                    <th className="border border-slate-350 py-1.5 px-3 text-left">Odbiorca (Klient)</th>
                    <th className="border border-slate-350 py-1.5 px-3 text-left">Adres docelowy</th>
                    <th className="border border-slate-350 py-1.5 px-3 text-left">Numer listu przewozowego</th>
                    <th className="border border-slate-350 py-1.5 px-3 text-center">Waga</th>
                  </tr>
                </thead>
                <tbody>
                  {printOrders.map((order, idx) => (
                    <tr key={order.id}>
                      <td className="border border-slate-350 py-1.5 px-3 font-mono">{idx + 1}</td>
                      <td className="border border-slate-350 py-1.5 px-3 font-mono font-bold">{order.id}</td>
                      <td className="border border-slate-350 py-1.5 px-3 font-bold">{order.customer}</td>
                      <td className="border border-slate-350 py-1.5 px-3 text-slate-600">{order.shippingAddress || order.destination}</td>
                      <td className="border border-slate-350 py-1.5 px-3 font-mono font-bold">{order.waybillNumber}</td>
                      <td className="border border-slate-350 py-1.5 px-3 text-center font-mono">{getOrderWeight(order).toFixed(2)} kg</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-12 pt-16 text-center text-xs select-none">
              <div className="space-y-12">
                <div className="border-b border-slate-900 pb-1"></div>
                <p className="font-bold uppercase tracking-wider text-slate-700">Podpis Kierowcy kuriera ({printManifest.carrier})</p>
              </div>
              <div className="space-y-12">
                <div className="border-b border-slate-900 pb-1"></div>
                <p className="font-bold uppercase tracking-wider text-slate-700">Podpis Dyspozytora WMS (Nadawca)</p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Global CSS style tag for @media print override */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          #root > div {
            display: none !important;
          }
          #print-labels-container, #print-manifest-container {
            display: block !important;
            width: 100% !important;
            height: auto !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
        }
      `}</style>

    </div>
  );
}
