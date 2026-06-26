import React, { useState, useMemo, useEffect } from 'react';
import { 
  RotateCcw, Plus, Search, X, CheckCircle, AlertCircle, 
  Filter, FileText, Calendar, Printer, ShieldAlert, ArrowLeftRight, Check, Trash2, Package
} from 'lucide-react';
import { Product } from '../../services/inventoryApi';

interface RmaItem {
  sku: string;
  name: string;
  qtyOrdered: number; // returned quantity
  reason: string;
}

interface RmaReportItem {
  sku: string;
  qtyResale: number;
  qtyDamaged: number;
  status: 'Approved' | 'Rejected';
}

interface RmaReturn {
  id: string; // RMA-ORD-XXXXX
  createdDate: string;
  status: 'ReturnPending' | 'ReturnReceived' | 'ReturnDamaged' | 'ReturnRejected';
  vendorName: string; // Carrier name
  expectedDeliveryDate: string;
  items: RmaItem[];
  internalNotes?: string;
  itemsReport?: RmaReportItem[];
  trackingNumber?: string;
  carrier?: string;
}

interface RmaManagerProps {
  purchaseOrders: any[];
  orders: any[];
  products: Product[];
  onCreateRmaReturn: (rma: any) => void;
  onReceiveRmaReturn: (rmaId: string, itemsReport: RmaReportItem[]) => void;
}

export default function RmaManager({
  purchaseOrders = [],
  orders = [],
  products = [],
  onCreateRmaReturn,
  onReceiveRmaReturn
}: RmaManagerProps) {
  // Lists
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  
  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  
  // Printing State
  const [printingRma, setPrintingRma] = useState<RmaReturn | null>(null);

  // Verification details
  const [selectedRmaForVerify, setSelectedRmaForVerify] = useState<RmaReturn | null>(null);
  const [verifyResale, setVerifyResale] = useState<Record<string, number>>({});
  const [verifyDamaged, setVerifyDamaged] = useState<Record<string, number>>({});
  const [verifyStatus, setVerifyStatus] = useState<Record<string, 'Approved' | 'Rejected'>>({});

  // Form states for creating RMA
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});
  const [selectedReasons, setSelectedReasons] = useState<Record<string, string>>({});
  const [selectedCarrier, setSelectedCarrier] = useState('DPD');
  const [customCarrier, setCustomCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [generalReason, setGeneralReason] = useState('Odstąpienie od umowy');
  const [generalNotes, setGeneralNotes] = useState('');

  // 1. Filter Purchase Orders to show only RMA
  const rmaList = useMemo(() => {
    return purchaseOrders.filter((po: any) => {
      const isRma = po.id.startsWith('RMA-') || 
                    ['ReturnPending', 'ReturnReceived', 'ReturnDamaged', 'ReturnRejected'].includes(po.status);
      return isRma;
    }) as RmaReturn[];
  }, [purchaseOrders]);

  // 2. Statistics
  const stats = useMemo(() => {
    let pending = 0;
    let received = 0;
    let damaged = 0;
    let rejected = 0;
    
    rmaList.forEach(r => {
      if (r.status === 'ReturnPending') pending++;
      else if (r.status === 'ReturnReceived') received++;
      else if (r.status === 'ReturnDamaged') damaged++;
      else if (r.status === 'ReturnRejected') rejected++;
    });

    return {
      total: rmaList.length,
      pending,
      received,
      damaged,
      rejected
    };
  }, [rmaList]);

  // 3. Search and filter logic
  const filteredRmaList = useMemo(() => {
    return rmaList.filter(rma => {
      // Status filter
      if (statusFilter !== 'All' && rma.status !== statusFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const baseOrder = orders.find(o => o.id === rma.id.replace('RMA-', ''));
        const customerName = baseOrder?.customer?.toLowerCase() || '';
        const matchId = rma.id.toLowerCase().includes(query);
        const matchBaseOrder = rma.id.replace('RMA-', '').toLowerCase().includes(query);
        const matchCarrier = rma.vendorName?.toLowerCase().includes(query);
        const matchTracking = rma.trackingNumber?.toLowerCase().includes(query) || false;
        const matchCustomer = customerName.includes(query);
        const matchSku = rma.items.some(it => it.sku.toLowerCase().includes(query) || it.name.toLowerCase().includes(query));

        return matchId || matchBaseOrder || matchCarrier || matchTracking || matchCustomer || matchSku;
      }

      return true;
    });
  }, [rmaList, statusFilter, searchQuery, orders]);

  // 4. Delivered Orders (recommendations for return)
  const deliveredOrders = useMemo(() => {
    return orders.filter(o => o.status === 'Dostarczone' || o.status === 'Wysłane');
  }, [orders]);

  const searchedDeliveredOrders = useMemo(() => {
    if (!orderSearchQuery.trim()) return deliveredOrders.slice(0, 5);
    const query = orderSearchQuery.toLowerCase();
    return orders.filter(o => 
      (o.status === 'Dostarczone' || o.status === 'Wysłane') && 
      (o.id.toLowerCase().includes(query) || o.customer?.toLowerCase().includes(query))
    ).slice(0, 10);
  }, [deliveredOrders, orderSearchQuery, orders]);

  const selectedOrderDetails = useMemo(() => {
    return orders.find(o => o.id === selectedOrderId);
  }, [selectedOrderId, orders]);

  // Reset verification states on open
  const openVerifyModal = (rma: RmaReturn) => {
    setSelectedRmaForVerify(rma);
    
    const initialResale: Record<string, number> = {};
    const initialDamaged: Record<string, number> = {};
    const initialStatus: Record<string, 'Approved' | 'Rejected'> = {};

    rma.items.forEach(it => {
      initialResale[it.sku] = it.qtyOrdered;
      initialDamaged[it.sku] = 0;
      initialStatus[it.sku] = 'Approved';
    });

    setVerifyResale(initialResale);
    setVerifyDamaged(initialDamaged);
    setVerifyStatus(initialStatus);
    setIsVerifyModalOpen(true);
  };

  // Submit Audit/Verification
  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRmaForVerify) return;

    // Check for negative numbers or quantities exceeding returned quantity
    for (const it of selectedRmaForVerify.items) {
      const resale = verifyResale[it.sku] ?? 0;
      const damaged = verifyDamaged[it.sku] ?? 0;
      
      if (resale < 0 || damaged < 0) {
        alert('Ilości nie mogą być ujemne!');
        return;
      }
      if (resale + damaged > it.qtyOrdered) {
        alert(`Suma ilości dla ${it.name} (${resale + damaged}) nie może przekroczyć zgłoszonej ilości zwrotu (${it.qtyOrdered}).`);
        return;
      }
    }

    const itemsReport = selectedRmaForVerify.items.map(it => {
      return {
        sku: it.sku,
        qtyResale: Number(verifyResale[it.sku] ?? it.qtyOrdered),
        qtyDamaged: Number(verifyDamaged[it.sku] ?? 0),
        status: verifyStatus[it.sku] || 'Approved'
      };
    });

    onReceiveRmaReturn(selectedRmaForVerify.id, itemsReport);
    setIsVerifyModalOpen(false);
    setSelectedRmaForVerify(null);
  };

  // Reset Create RMA states
  const openCreateModal = () => {
    setSelectedOrderId('');
    setOrderSearchQuery('');
    setSelectedItems({});
    setSelectedQuantities({});
    setSelectedReasons({});
    setSelectedCarrier('DPD');
    setCustomCarrier('');
    setTrackingNumber('');
    setGeneralReason('Odstąpienie od umowy');
    setGeneralNotes('');
    setIsCreateModalOpen(true);
  };

  // Select order for return and pre-populate items
  const handleSelectOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    const order = orders.find(o => o.id === orderId);
    if (order) {
      const initItems: Record<string, boolean> = {};
      const initQtys: Record<string, number> = {};
      const initReasons: Record<string, string> = {};

      order.items.forEach((it: any) => {
        initItems[it.sku] = true;
        initQtys[it.sku] = it.qty;
        initReasons[it.sku] = 'Odstąpienie od umowy';
      });

      setSelectedItems(initItems);
      setSelectedQuantities(initQtys);
      setSelectedReasons(initReasons);
    }
  };

  // Submit Create RMA
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId) {
      alert('Wybierz zamówienie bazowe.');
      return;
    }

    const order = orders.find(o => o.id === selectedOrderId);
    if (!order) return;

    const rmaId = `RMA-${order.id}`;
    if (rmaList.some(r => r.id === rmaId)) {
      alert(`Zgłoszenie RMA dla zamówienia ${order.id} już istnieje!`);
      return;
    }

    const rmaItems = order.items
      .filter((it: any) => selectedItems[it.sku])
      .map((it: any) => {
        const qty = Number(selectedQuantities[it.sku] ?? it.qty);
        return {
          sku: it.sku,
          name: it.name,
          qtyOrdered: qty,
          reason: selectedReasons[it.sku] || generalReason
        };
      });

    if (rmaItems.length === 0) {
      alert('Wybierz co najmniej jeden produkt do zwrotu.');
      return;
    }

    // Verify quantities do not exceed original order quantities
    for (const item of rmaItems) {
      const originalItem = order.items.find((it: any) => it.sku === item.sku);
      if (originalItem && item.qtyOrdered > originalItem.qty) {
        alert(`Ilość zwracana dla SKU ${item.sku} (${item.qtyOrdered}) przekracza ilość z zamówienia (${originalItem.qty}).`);
        return;
      }
      if (item.qtyOrdered <= 0) {
        alert(`Ilość zwracana dla SKU ${item.sku} musi być większa od zera.`);
        return;
      }
    }

    const finalCarrier = selectedCarrier === 'Inny' ? customCarrier : selectedCarrier;

    const newRma = {
      id: rmaId,
      createdDate: new Date().toLocaleDateString('pl-PL', { day: '2-digit', month: 'short' }) + ', ' + new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
      status: 'ReturnPending',
      vendorName: finalCarrier || 'DPD',
      expectedDeliveryDate: new Date().toLocaleDateString('pl-PL', { day: '2-digit', month: 'short' }),
      items: rmaItems,
      internalNotes: `Powód główny: ${generalReason}. List przewozowy: ${trackingNumber || 'Brak'}. Uwagi: ${generalNotes}`.trim(),
      trackingNumber,
      carrier: finalCarrier
    };

    onCreateRmaReturn(newRma);
    setIsCreateModalOpen(false);
  };

  // Trigger browser print dialog for selected RMA protocol
  const triggerPrint = (rma: RmaReturn) => {
    setPrintingRma(rma);
  };

  useEffect(() => {
    if (printingRma) {
      const timer = setTimeout(() => {
        window.print();
        setPrintingRma(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [printingRma]);

  // Translate statuses for UI display
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ReturnPending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Oczekuje na weryfikację
          </span>
        );
      case 'ReturnReceived':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5" />
            Zwrócony (Na stanie)
          </span>
        );
      case 'ReturnDamaged':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5" />
            Uszkodzony (Zniszczony)
          </span>
        );
      case 'ReturnRejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <ShieldAlert className="w-3.5 h-3.5" />
            Zwrot Odrzucony
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-50 text-gray-700 border border-gray-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50 p-6 overflow-y-auto">
      
      {/* Upper header with title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <RotateCcw className="w-7 h-7 text-indigo-600 animate-spin-slow" />
            Carrier & RMA Manager
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Zarządzanie zwrotami kurierskimi i kontrola jakościowa zwracanego stocku (WMS RMA Registry)
          </p>
        </div>
        
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Zgłoś zwrot RMA
        </button>
      </div>

      {/* Statistics dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Wszystkie zgłoszenia</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{stats.total}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Oczekujące weryfikacji</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{stats.pending}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Przyjęte na stan</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{stats.received}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <X className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Uszkodzone / Quarantine</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{stats.damaged}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 col-span-2 lg:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Zwroty odrzucone</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{stats.rejected}</p>
          </div>
        </div>

      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Szukaj po RMA, zamówieniu, przewoźniku, SKU, kliencie..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium placeholder-slate-400 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mr-2 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Status:
          </span>
          {[
            { id: 'All', label: 'Wszystkie' },
            { id: 'ReturnPending', label: 'Oczekujące' },
            { id: 'ReturnReceived', label: 'Przyjęte' },
            { id: 'ReturnDamaged', label: 'Uszkodzone' },
            { id: 'ReturnRejected', label: 'Odrzucone' }
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setStatusFilter(btn.id)}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all whitespace-nowrap ${
                statusFilter === btn.id
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

      </div>

      {/* RMA List Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-0 flex-1">
        <div className="overflow-x-auto min-h-0 flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4 font-black">ID RMA / Data</th>
                <th className="py-3 px-4 font-black">Zamówienie Bazowe</th>
                <th className="py-3 px-4 font-black">Klient</th>
                <th className="py-3 px-4 font-black">Kurier i Tracking</th>
                <th className="py-3 px-4 font-black">Status</th>
                <th className="py-3 px-4 font-black">Zwracane SKU</th>
                <th className="py-3 px-4 font-black text-right">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredRmaList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    <RotateCcw className="w-10 h-10 text-slate-300 mx-auto mb-2.5 animate-pulse" />
                    Brak zgłoszeń RMA spełniających kryteria wyszukiwania.
                  </td>
                </tr>
              ) : (
                filteredRmaList.map((rma) => {
                  const baseOrder = orders.find(o => o.id === rma.id.replace('RMA-', ''));
                  return (
                    <tr key={rma.id} className="hover:bg-slate-50/50 transition-colors">
                      
                      {/* RMA ID and Created Date */}
                      <td className="py-4 px-4">
                        <div className="font-mono font-black text-slate-900">{rma.id}</div>
                        <div className="text-[11px] font-medium text-slate-400 mt-0.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {rma.createdDate}
                        </div>
                      </td>

                      {/* Base Order ID */}
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg font-mono">
                          <FileText className="w-3.5 h-3.5 text-slate-500" />
                          {rma.id.replace('RMA-', '')}
                        </span>
                      </td>

                      {/* Customer Info */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-800">{baseOrder?.customer || 'Nieznany klient'}</div>
                        <div className="text-[11px] font-medium text-slate-400 mt-0.5">{baseOrder?.destination || 'Brak adresu'}</div>
                      </td>

                      {/* Carrier & Tracking */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-700 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                          {rma.vendorName || rma.carrier || 'Kurier'}
                        </div>
                        <div className="text-[11px] font-bold font-mono text-slate-400 mt-0.5">
                          {rma.trackingNumber ? `List: ${rma.trackingNumber}` : 'Brak nr przewozowego'}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        {getStatusBadge(rma.status)}
                      </td>

                      {/* Returned SKU Summary */}
                      <td className="py-4 px-4 max-w-xs">
                        <div className="flex flex-col gap-1">
                          {rma.items.map((item, idx) => {
                            const report = rma.itemsReport?.find(r => r.sku === item.sku);
                            return (
                              <div key={idx} className="text-xs font-medium text-slate-600 truncate flex items-center justify-between gap-1.5">
                                <span className="truncate">
                                  <strong className="font-mono bg-slate-100 px-1 py-0.5 rounded text-[10px] text-slate-600 mr-1">{item.sku}</strong>
                                  {item.name}
                                </span>
                                <span className="font-bold text-slate-800 shrink-0">
                                  {item.qtyOrdered} szt.
                                  {report && (
                                    <span className="text-[10px] text-slate-400 font-normal ml-1">
                                      ({report.qtyResale} resale, {report.qtyDamaged} scrap)
                                    </span>
                                  )}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          
                          {/* Quality Verification Button */}
                          {rma.status === 'ReturnPending' && (
                            <button
                              onClick={() => openVerifyModal(rma)}
                              className="inline-flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition-all"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Weryfikacja
                            </button>
                          )}

                          {/* Print Receipt Protocol */}
                          {rma.status !== 'ReturnPending' && (
                            <button
                              onClick={() => triggerPrint(rma)}
                              className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 transition-all"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              Protokół
                            </button>
                          )}
                          
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE RMA RETURN MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-3xl rounded-3xl border border-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-indigo-600" />
                  Kreator zgłoszeń RMA (Zwroty od klienta)
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">Rejestracja nowej paczki zwrotnej od kontrahenta w systemie WMS</p>
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Form */}
            <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Step 1: Find order */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  1. Znajdź i wybierz zrealizowane zamówienie bazowe (ORD)
                </label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Wpisz ID zamówienia lub nazwę klienta..."
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800"
                  />
                </div>

                {/* List of matching orders */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  {searchedDeliveredOrders.map((order) => (
                    <div
                      key={order.id}
                      type="button"
                      onClick={() => handleSelectOrder(order.id)}
                      className={`p-3 rounded-2xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                        selectedOrderId === order.id
                          ? 'border-indigo-600 bg-indigo-50/50 shadow-sm ring-1 ring-indigo-600'
                          : 'border-slate-200 hover:bg-slate-50 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-black text-xs text-slate-900">{order.id}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          order.status === 'Dostarczone' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="font-bold text-slate-700 text-xs mt-1.5 truncate">{order.customer}</div>
                      <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                        <span>{order.destination}</span>
                        <span className="font-medium font-mono">{order.items?.length || 0} poz.</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 2: Select returned items & quantities */}
              {selectedOrderDetails ? (
                <div className="space-y-4 border-t border-slate-100 pt-5">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                    2. Wybierz zwracane pozycje i określ ilości
                  </label>
                  
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-150 space-y-3">
                    {selectedOrderDetails.items.map((item: any) => (
                      <div key={item.sku} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                        
                        {/* Checkbox and Name */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={!!selectedItems[item.sku]}
                            onChange={(e) => setSelectedItems(prev => ({ ...prev, [item.sku]: e.target.checked }))}
                            id={`check-${item.sku}`}
                            className="w-4.5 h-4.5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                          />
                          <div className="min-w-0">
                            <label htmlFor={`check-${item.sku}`} className="font-bold text-slate-800 text-xs cursor-pointer hover:underline block truncate">
                              {item.name}
                            </label>
                            <span className="text-[10px] font-bold font-mono text-slate-400 block mt-0.5">
                              SKU: {item.sku} | Kupiono: {item.qty} szt.
                            </span>
                          </div>
                        </div>

                        {/* Quantity and Reason inputs */}
                        {selectedItems[item.sku] && (
                          <div className="flex items-center gap-3 shrink-0">
                            
                            {/* Return Qty */}
                            <div className="w-24">
                              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                                Ilość zwrotu
                              </label>
                              <input
                                type="number"
                                min={1}
                                max={item.qty}
                                value={selectedQuantities[item.sku] ?? item.qty}
                                onChange={(e) => {
                                  const val = Math.min(item.qty, Math.max(1, Number(e.target.value)));
                                  setSelectedQuantities(prev => ({ ...prev, [item.sku]: val }));
                                }}
                                className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 text-center"
                              />
                            </div>

                            {/* Reason for SKU */}
                            <div className="w-40">
                              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                                Przyczyna
                              </label>
                              <select
                                value={selectedReasons[item.sku] || 'Odstąpienie od umowy'}
                                onChange={(e) => setSelectedReasons(prev => ({ ...prev, [item.sku]: e.target.value }))}
                                className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700"
                              >
                                <option value="Odstąpienie od umowy">Odstąpienie od umowy</option>
                                <option value="Niezgodność z opisem">Niezgodność z opisem</option>
                                <option value="Wada fabryczna">Wada fabryczna</option>
                                <option value="Błędny rozmiar/artykul">Błędny rozmiar/artykuł</option>
                                <option value="Uszkodzenie w transporcie">Uszkodzenie w transporcie</option>
                                <option value="Inny powód">Inny powód</option>
                              </select>
                            </div>

                          </div>
                        )}

                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-xs text-slate-450 font-medium">
                  Wybierz zamówienie z listy powyżej, aby skonfigurować zwracane pozycje.
                </div>
              )}

              {/* Step 3: Courier details & general reason */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-5">
                
                {/* Courier selection */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Przewoźnik Zwrotny
                  </label>
                  <select
                    value={selectedCarrier}
                    onChange={(e) => setSelectedCarrier(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="DPD">DPD</option>
                    <option value="InPost">InPost (Kurier / Paczkomat)</option>
                    <option value="DHL">DHL Express</option>
                    <option value="GLS">GLS</option>
                    <option value="Poczta Polska">Poczta Polska</option>
                    <option value="FedEx">FedEx</option>
                    <option value="Inny">Inny przewoźnik (Wpisz ręcznie)</option>
                  </select>

                  {selectedCarrier === 'Inny' && (
                    <input
                      type="text"
                      placeholder="Nazwa innego przewoźnika..."
                      value={customCarrier}
                      onChange={(e) => setCustomCarrier(e.target.value)}
                      className="w-full mt-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                      required
                    />
                  )}
                </div>

                {/* Tracking number */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Numer listu przewozowego (Tracking)
                  </label>
                  <input
                    type="text"
                    placeholder="Wpisz numer paczki kurierskiej..."
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                  />
                </div>

              </div>

              {/* General notes */}
              <div className="space-y-2 border-t border-slate-100 pt-5">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Dodatkowe uwagi / opis
                </label>
                <textarea
                  rows={2}
                  placeholder="Dodatkowe informacje dla operatora magazynowego, opis uszkodzeń, uwagi ogólne..."
                  value={generalNotes}
                  onChange={(e) => setGeneralNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                ></textarea>
              </div>

            </form>

            {/* Footer Buttons */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold px-4 py-2 rounded-xl transition-all"
              >
                Anuluj
              </button>
              <button
                onClick={handleCreateSubmit}
                disabled={!selectedOrderId}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold px-5 py-2 rounded-xl shadow-lg shadow-indigo-100 transition-all"
              >
                Utwórz zgłoszenie RMA
              </button>
            </div>

          </div>
        </div>
      )}

      {/* QUALITY AUDIT / VERIFICATION MODAL */}
      {isVerifyModalOpen && selectedRmaForVerify && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-3xl rounded-3xl border border-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="bg-amber-50 px-6 py-4 border-b border-amber-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base font-black text-amber-900 tracking-tight flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-600 animate-pulse" />
                  Weryfikacja jakościowa i przyjęcie zwrotu ({selectedRmaForVerify.id})
                </h3>
                <p className="text-[11px] text-amber-800 font-medium">Zweryfikuj fizyczny stan paczki zwrotnej i zaklasyfikuj SKU do odpowiednich stref</p>
              </div>
              <button 
                onClick={() => {
                  setIsVerifyModalOpen(false);
                  setSelectedRmaForVerify(null);
                }}
                className="p-1.5 hover:bg-amber-100 text-amber-700 hover:text-amber-950 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleVerifySubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* RMA general info */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-medium">
                <div>
                  <span className="block text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-0.5">Zamówienie Bazowe</span>
                  <span className="font-mono font-bold text-slate-800">{selectedRmaForVerify.id.replace('RMA-', '')}</span>
                </div>
                <div>
                  <span className="block text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-0.5">Klient</span>
                  <span className="font-bold text-slate-800">
                    {orders.find(o => o.id === selectedRmaForVerify.id.replace('RMA-', ''))?.customer || 'Nieznany klient'}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-0.5">Kurier i Tracking</span>
                  <span className="font-bold text-slate-800">{selectedRmaForVerify.vendorName} ({selectedRmaForVerify.trackingNumber || 'Brak'})</span>
                </div>
                <div>
                  <span className="block text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-0.5">Data Rejestracji</span>
                  <span className="font-bold text-slate-800">{selectedRmaForVerify.createdDate}</span>
                </div>
              </div>

              {selectedRmaForVerify.internalNotes && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-650">
                  <strong className="font-bold text-slate-700 block mb-1">Uwagi rejestracyjne:</strong>
                  {selectedRmaForVerify.internalNotes}
                </div>
              )}

              {/* Items auditing table */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Weryfikacja jakościowa pozycji zwrotu
                </label>

                <div className="space-y-4">
                  {selectedRmaForVerify.items.map((item) => {
                    const resale = verifyResale[item.sku] ?? item.qtyOrdered;
                    const damaged = verifyDamaged[item.sku] ?? 0;
                    const remaining = item.qtyOrdered - resale - damaged;
                    const hasError = resale + damaged > item.qtyOrdered;

                    return (
                      <div 
                        key={item.sku} 
                        className={`p-4 rounded-2xl border transition-all space-y-4 ${
                          hasError ? 'border-rose-450 bg-rose-50/20' : 'border-slate-200 bg-white'
                        }`}
                      >
                        {/* Name and SKU */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                          <div>
                            <span className="font-bold text-slate-800 text-xs block">{item.name}</span>
                            <span className="text-[10px] font-bold font-mono text-slate-400 block mt-0.5">
                              SKU: {item.sku} | Zgłoszona ilość: {item.qtyOrdered} szt.
                            </span>
                          </div>
                          <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">
                            Deklarowany powód: <strong>{item.reason || 'Brak'}</strong>
                          </span>
                        </div>

                        {/* Audit quantities */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 pt-3">
                          
                          {/* Resale Quantity (adds stock) */}
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                              Pełnowartościowe (Resale)
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                min={0}
                                max={item.qtyOrdered}
                                value={resale}
                                onChange={(e) => {
                                  const val = Math.max(0, Number(e.target.value));
                                  setVerifyResale(prev => ({ ...prev, [item.sku]: val }));
                                }}
                                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 text-center"
                              />
                            </div>
                            <span className="text-[9px] text-slate-400 font-medium block mt-1">
                              Zostaną zwrócone na stan SKU w WMS.
                            </span>
                          </div>

                          {/* Damaged Quantity (routed to quarantine / scrap) */}
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                              Uszkodzone (Scrap)
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={item.qtyOrdered}
                              value={damaged}
                              onChange={(e) => {
                                const val = Math.max(0, Number(e.target.value));
                                setVerifyDamaged(prev => ({ ...prev, [item.sku]: val }));
                              }}
                              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 text-center"
                            />
                            <span className="text-[9px] text-slate-400 font-medium block mt-1">
                              Nie powiększą stanu (strefa strat/kwarantanny).
                            </span>
                          </div>

                          {/* Position Acceptance Status */}
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                              Status pozycji
                            </label>
                            <select
                              value={verifyStatus[item.sku] || 'Approved'}
                              onChange={(e) => {
                                const val = e.target.value as 'Approved' | 'Rejected';
                                setVerifyStatus(prev => ({ ...prev, [item.sku]: val }));
                              }}
                              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                            >
                              <option value="Approved">Zatwierdzony zwrot</option>
                              <option value="Rejected">Odrzucony (Brak zwrotu środków)</option>
                            </select>
                            <span className="text-[9px] text-slate-400 font-medium block mt-1">
                              Decyzja o akceptacji roszczenia.
                            </span>
                          </div>

                        </div>

                        {/* Helper validation text */}
                        <div className="flex items-center justify-between text-[11px] font-bold mt-2">
                          {hasError ? (
                            <span className="text-rose-600 flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5" />
                              Suma ilości ({resale + damaged}) przekracza ilość zgłoszoną ({item.qtyOrdered})!
                            </span>
                          ) : remaining > 0 ? (
                            <span className="text-amber-600 flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5" />
                              Uwaga: Nie rozdysponowano {remaining} szt. (braki w paczce?)
                            </span>
                          ) : (
                            <span className="text-emerald-600 flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Ilość zweryfikowana prawidłowo ({resale + damaged}/{item.qtyOrdered}).
                            </span>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>

            </form>

            {/* Footer Buttons */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsVerifyModalOpen(false);
                  setSelectedRmaForVerify(null);
                }}
                className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold px-4 py-2 rounded-xl transition-all"
              >
                Anuluj
              </button>
              <button
                onClick={handleVerifySubmit}
                className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold px-5 py-2 rounded-xl shadow-lg shadow-amber-100 transition-all flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Zatwierdź Odbiór Zwrotu
              </button>
            </div>

          </div>
        </div>
      )}

      {/* PRINT MEDIA PROTOCOL CONTAINER */}
      {printingRma && (
        <div id="print-rma-container" className="hidden print:block p-8 bg-white text-slate-900">
          <div className="border border-slate-900 p-8 rounded-lg max-w-4xl mx-auto space-y-8">
            
            {/* Header / Meta */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-6">
              <div>
                <h1 className="text-2xl font-bold uppercase tracking-tight text-slate-900">Protokół Przyjęcia Zwrotu RMA</h1>
                <p className="text-sm font-mono mt-1 text-slate-600">ID RMA: {printingRma.id}</p>
                <p className="text-xs font-mono text-slate-550">Kod kreskowy RMA: *{printingRma.id}*</p>
              </div>
              <div className="text-right text-xs space-y-1 text-slate-700">
                <p><strong>Magazyn Centralny WMS</strong></p>
                <p>HUB-PL-01 WMS Logistics</p>
                <p>Data wydruku: {new Date().toLocaleString('pl-PL')}</p>
              </div>
            </div>

            {/* RMA General Information */}
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div className="space-y-1.5 p-4 border border-slate-200 rounded-lg">
                <h3 className="font-bold text-slate-900 uppercase text-xs tracking-wider border-b pb-1.5 mb-2">Dane Zlecenia</h3>
                <p><strong>Zamówienie bazowe:</strong> {printingRma.id.replace('RMA-', '')}</p>
                <p><strong>Klient:</strong> {orders.find(o => o.id === printingRma.id.replace('RMA-', ''))?.customer || 'Nieznany klient'}</p>
                <p><strong>Adres dostawy:</strong> {orders.find(o => o.id === printingRma.id.replace('RMA-', ''))?.destination || 'Brak'}</p>
                <p><strong>Data zgłoszenia:</strong> {printingRma.createdDate}</p>
              </div>

              <div className="space-y-1.5 p-4 border border-slate-200 rounded-lg">
                <h3 className="font-bold text-slate-900 uppercase text-xs tracking-wider border-b pb-1.5 mb-2">Szczegóły Paczki</h3>
                <p><strong>Przewoźnik zwrotny:</strong> {printingRma.vendorName || printingRma.carrier || 'Brak'}</p>
                <p><strong>Numer listu przewozowego:</strong> {printingRma.trackingNumber || 'Brak'}</p>
                <p><strong>Status zgłoszenia:</strong> {printingRma.status === 'ReturnReceived' ? 'Zatwierdzony (Towar na stanie)' : 
                   printingRma.status === 'ReturnDamaged' ? 'Uszkodzony (Stratowany)' : 
                   printingRma.status === 'ReturnRejected' ? 'Odrzucony' : 'Weryfikacja w toku'}</p>
              </div>
            </div>

            {printingRma.internalNotes && (
              <div className="p-4 border border-slate-200 rounded-lg text-sm">
                <p className="font-bold mb-1">Uwagi do zwrotu:</p>
                <p className="text-slate-700 italic">{printingRma.internalNotes}</p>
              </div>
            )}

            {/* Table of items */}
            <div className="space-y-2">
              <h3 className="font-bold uppercase text-xs tracking-wider text-slate-900">Zweryfikowane pozycje towarowe</h3>
              <table className="w-full border-collapse border border-slate-350 text-sm">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 uppercase text-[10px] font-bold">
                    <th className="border border-slate-350 py-2 px-3 text-left">SKU</th>
                    <th className="border border-slate-350 py-2 px-3 text-left">Nazwa produktu</th>
                    <th className="border border-slate-350 py-2 px-3 text-center">Zgłoszona</th>
                    <th className="border border-slate-350 py-2 px-3 text-center">Pełnowartościowa (Resale)</th>
                    <th className="border border-slate-350 py-2 px-3 text-center">Uszkodzona (Scrap)</th>
                    <th className="border border-slate-350 py-2 px-3 text-center">Decyzja</th>
                    <th className="border border-slate-350 py-2 px-3 text-left">Powód Zwrotu</th>
                  </tr>
                </thead>
                <tbody>
                  {printingRma.items.map((item) => {
                    const report = printingRma.itemsReport?.find(r => r.sku === item.sku);
                    return (
                      <tr key={item.sku} className="text-xs">
                        <td className="border border-slate-350 py-2 px-3 font-mono font-bold">{item.sku}</td>
                        <td className="border border-slate-350 py-2 px-3 font-medium">{item.name}</td>
                        <td className="border border-slate-350 py-2 px-3 text-center font-bold">{item.qtyOrdered}</td>
                        <td className="border border-slate-350 py-2 px-3 text-center font-bold text-emerald-800">{report?.qtyResale ?? item.qtyOrdered}</td>
                        <td className="border border-slate-350 py-2 px-3 text-center font-bold text-rose-800">{report?.qtyDamaged ?? 0}</td>
                        <td className="border border-slate-350 py-2 px-3 text-center font-bold uppercase">
                          {report?.status === 'Approved' ? 'Zatwierdzono' : report?.status === 'Rejected' ? 'Odrzucono' : 'Ok'}
                        </td>
                        <td className="border border-slate-350 py-2 px-3 text-slate-600">{item.reason || 'Odstąpienie od umowy'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-12 pt-16 text-center text-xs">
              <div className="space-y-12">
                <div className="border-b border-slate-900 pb-1"></div>
                <p className="font-bold uppercase tracking-wider text-slate-700">Data i podpis operatora (Weryfikacja)</p>
              </div>
              <div className="space-y-12">
                <div className="border-b border-slate-900 pb-1"></div>
                <p className="font-bold uppercase tracking-wider text-slate-700">Data i podpis zatwierdzającego (Menedżer)</p>
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
          #print-rma-container {
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
