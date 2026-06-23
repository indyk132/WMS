import React, { useState, useMemo } from 'react';
import { 
  Truck, Plus, Search, X, CheckCircle, AlertCircle, 
  Trash2, Edit3, Filter, FileText, Calendar, Layers, Combine
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

interface SuppliesProps {
  purchaseOrders: PurchaseOrder[];
  products: Product[];
  onCreatePurchaseOrder: (po: PurchaseOrder) => void;
  onUpdatePurchaseOrder: (poId: string, updatedFields: Partial<PurchaseOrder>) => void;
  onReceivePurchaseOrder: (poId: string) => void;
  onCancelPurchaseOrder: (poId: string) => void;
  onGroupPurchaseOrders: (poIds: string[]) => void;
  onReceiveRmaReturn: (rmaId: string) => void;
}

export default function Supplies({
  purchaseOrders = [],
  products = [],
  onCreatePurchaseOrder,
  onUpdatePurchaseOrder,
  onReceivePurchaseOrder,
  onCancelPurchaseOrder,
  onGroupPurchaseOrders,
  onReceiveRmaReturn
}: SuppliesProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Completed' | 'Cancelled' | 'Merged' | 'ReturnPending' | 'ReturnReceived'>('All');
  
  // Selection state for grouping
  const [selectedPoIds, setSelectedPoIds] = useState<string[]>([]);
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentEditingPo, setCurrentEditingPo] = useState<PurchaseOrder | null>(null);

  // Form states for manual PO creation
  const [formSku, setFormSku] = useState('');
  const [formQty, setFormQty] = useState(100);
  const [formVendor, setFormVendor] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formDate, setFormDate] = useState('');

  // Form states for editing
  const [editQty, setEditQty] = useState(100);
  const [editDate, setEditDate] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Helper for vendor names based on product category
  const getSupplierForCategory = (category: string) => {
    const norm = (category || '').toLowerCase();
    if (norm.includes('spożywcz') || norm.includes('żywność')) return 'Hurtownia Spożywcza EuroFoods Sp. z o.o.';
    if (norm.includes('elektronik') || norm.includes('audio')) return 'ElectroDistrib PL S.A.';
    if (norm.includes('biur') || norm.includes('akcesor')) return 'OfficeMax Supply Poland';
    if (norm.includes('częśc') || norm.includes('chem') || norm.includes('auto')) return 'AutoParts Distrib Polska';
    return 'Global Warehousing Supplies';
  };

  // Handle manual PO Sku selection to autofill vendor
  const handleSkuChange = (sku: string) => {
    setFormSku(sku);
    const selectedProd = products.find(p => p.sku === sku);
    if (selectedProd) {
      setFormVendor(getSupplierForCategory(selectedProd.category));
    }
  };

  // Submit manual PO creation
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSku) {
      alert('Wybierz produkt SKU.');
      return;
    }
    
    const prod = products.find(p => p.sku === formSku);
    if (!prod) return;

    const poId = `PO-${Math.floor(10000 + Math.random() * 90000)}`;
    const formattedDate = formDate 
      ? new Date(formDate).toLocaleDateString('pl-PL', { day: '2-digit', month: 'short' }) + ', ' + new Date(formDate).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
      : new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString('pl-PL', { day: '2-digit', month: 'short' }) + ', 12:00';

    const newPO: PurchaseOrder = {
      id: poId,
      createdDate: new Date().toLocaleDateString('pl-PL', { day: '2-digit', month: 'short' }) + ', ' + new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
      status: 'Pending',
      vendorName: formVendor || 'Dostawca Ogólny',
      expectedDeliveryDate: formattedDate,
      items: [
        { sku: formSku, name: prod.name, qtyOrdered: Number(formQty) }
      ],
      internalNotes: formNotes
    };

    onCreatePurchaseOrder(newPO);
    
    // reset form
    setIsCreateModalOpen(false);
    setFormSku('');
    setFormQty(100);
    setFormVendor('');
    setFormNotes('');
    setFormDate('');
  };

  // Open edit modal
  const openEditModal = (po: PurchaseOrder) => {
    setCurrentEditingPo(po);
    setEditQty(po.items[0]?.qtyOrdered || 100);
    setEditDate('');
    setEditNotes(po.internalNotes || '');
    setIsEditModalOpen(true);
  };

  // Submit edit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEditingPo) return;

    const updatedItems = currentEditingPo.items.map(item => ({
      ...item,
      qtyOrdered: Number(editQty)
    }));

    const formattedDate = editDate 
      ? new Date(editDate).toLocaleDateString('pl-PL', { day: '2-digit', month: 'short' }) + ', ' + new Date(editDate).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
      : currentEditingPo.expectedDeliveryDate;

    onUpdatePurchaseOrder(currentEditingPo.id, {
      items: updatedItems,
      expectedDeliveryDate: formattedDate,
      internalNotes: editNotes
    });

    setIsEditModalOpen(false);
    setCurrentEditingPo(null);
  };

  // Group selection toggle
  const handleSelectPo = (poId: string) => {
    setSelectedPoIds(prev => 
      prev.includes(poId) ? prev.filter(id => id !== poId) : [...prev, poId]
    );
  };

  // Group execution helper
  const handleExecuteGrouping = () => {
    onGroupPurchaseOrders(selectedPoIds);
    setSelectedPoIds([]);
  };

  // Filters logic
  const filteredPOs = useMemo(() => {
    return purchaseOrders.filter(po => {
      const matchesStatus = statusFilter === 'All' || po.status === statusFilter;
      
      const text = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        po.id.toLowerCase().includes(text) ||
        po.vendorName.toLowerCase().includes(text) ||
        po.items.some(i => i.sku.toLowerCase().includes(text) || i.name.toLowerCase().includes(text));

      return matchesStatus && matchesSearch;
    });
  }, [purchaseOrders, statusFilter, searchQuery]);

  // Telemetry counts
  const counts = useMemo(() => {
    const pending = purchaseOrders.filter(p => p.status === 'Pending').length;
    const completed = purchaseOrders.filter(p => p.status === 'Completed').length;
    const cancelled = purchaseOrders.filter(p => p.status === 'Cancelled').length;
    const returnPending = purchaseOrders.filter(p => p.status === 'ReturnPending').length;
    const returnReceived = purchaseOrders.filter(p => p.status === 'ReturnReceived').length;
    return { pending, completed, cancelled, returnPending, returnReceived };
  }, [purchaseOrders]);

  // Check if grouping can be enabled
  const isGroupingEnabled = useMemo(() => {
    if (selectedPoIds.length < 2) return false;
    return selectedPoIds.every(id => {
      const po = purchaseOrders.find(p => p.id === id);
      return po && po.status === 'Pending';
    });
  }, [selectedPoIds, purchaseOrders]);

  return (
    <div id="wms-supplies-panel" className="space-y-6 font-sans text-sm text-[#334155] animate-fadeIn pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
            <Truck className="w-5.5 h-5.5 text-blue-600" /> Dostawy i Zamówienia PO (Zapotrzebowanie)
          </h2>
          <p className="text-xs text-slate-500 mt-1.5 max-w-xl font-sans">
            Kolejkowanie zleceń zakupowych od dostawców (Purchase Orders) oraz zwrotów od klientów (RMA). Uzupełniaj stany SKU, zatwierdzaj dostawy dostawców i przyjmuj towary ze zwrotów od klientów.
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="h-9 px-4 rounded bg-blue-600 hover:bg-blue-750 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border-none shadow active:scale-[0.97]"
        >
          <Plus className="w-4 h-4" /> Nowe Zapotrzebowanie PO
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 select-none">
        <div className="bg-[#0f172a] text-white p-4 rounded-xl border border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">Wszystkie zlecenia PO</span>
          <div className="text-2xl font-black mt-2 font-sans">{purchaseOrders.length}</div>
          <div className="text-[9px] text-zinc-500 mt-1 font-mono">Historia i plany</div>
        </div>
        <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-250 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] text-amber-600 font-extrabold uppercase tracking-wider">Oczekujące (W drodze)</span>
          <div className="text-2xl font-black mt-2 text-amber-950 font-sans">{counts.pending}</div>
          <div className="text-[9px] text-amber-500 mt-1">Oczekuje na dostawcę</div>
        </div>
        <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-250 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] text-emerald-600 font-extrabold uppercase tracking-wider">Zrealizowane (Przyjęte)</span>
          <div className="text-2xl font-black mt-2 text-emerald-950 font-sans">{counts.completed}</div>
          <div className="text-[9px] text-emerald-500 mt-1">Dodano stany w WMS</div>
        </div>
        <div className="bg-violet-50/60 p-4 rounded-xl border border-violet-250 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] text-violet-650 font-extrabold uppercase tracking-wider">Zwroty RMA (Oczekujące / Przyjęte)</span>
          <div className="text-2xl font-black mt-2 text-violet-950 font-sans">
            {counts.returnPending} <span className="text-xs font-normal text-slate-400">/ {counts.returnReceived}</span>
          </div>
          <div className="text-[9px] text-violet-550 mt-1">Zwracane przez klientów</div>
        </div>
        <div className="bg-rose-50/60 p-4 rounded-xl border border-rose-250 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] text-rose-600 font-extrabold uppercase tracking-wider">Anulowane zlecenia</span>
          <div className="text-2xl font-black mt-2 text-rose-950 font-sans">{counts.cancelled}</div>
          <div className="text-[9px] text-rose-500 mt-1">Anulowane przez admina</div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="relative flex-grow max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-9 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            placeholder="Szukaj po PO-ID, dostawcy, SKU..."
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer border-none bg-transparent">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap select-none">
          <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <span className="px-2 text-slate-400 font-extrabold uppercase text-[9px]">Status:</span>
            {(['All', 'Pending', 'Completed', 'Cancelled', 'Merged', 'ReturnPending', 'ReturnReceived'] as const).map(st => {
              const labelMap = { 
                All: 'Wszystkie', 
                Pending: 'Oczekujące PO', 
                Completed: 'Przyjęte PO', 
                Cancelled: 'Anulowane', 
                Merged: 'Zgrupowane',
                ReturnPending: 'Oczekujące RMA',
                ReturnReceived: 'Przyjęte RMA'
              };
              return (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-md text-[10px] font-bold cursor-pointer border-none transition-all ${
                    statusFilter === st ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {labelMap[st]}
                </button>
              );
            })}
          </div>

          {selectedPoIds.length > 0 && (
            <button
              onClick={handleExecuteGrouping}
              disabled={!isGroupingEnabled}
              className={`h-7.5 px-3 rounded text-[10px] font-bold flex items-center gap-1.5 transition-all border-none shadow active:scale-95 cursor-pointer ${
                isGroupingEnabled 
                  ? 'bg-indigo-650 hover:bg-indigo-750 text-white' 
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none'
              }`}
              title="Konsolidacja zaznaczonych zlecenia PO w jedno zamówienie"
            >
              <Combine className="w-3.5 h-3.5" /> Grupuj i Konsoliduj ({selectedPoIds.length})
            </button>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[9px] tracking-wider select-none">
                <th className="py-3 px-4 w-10 text-center">
                  <input 
                    type="checkbox"
                    checked={selectedPoIds.length > 0 && selectedPoIds.length === filteredPOs.filter(p => p.status === 'Pending').length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPoIds(filteredPOs.filter(p => p.status === 'Pending').map(p => p.id));
                      } else {
                        setSelectedPoIds([]);
                      }
                    }}
                    className="rounded text-blue-600 focus:ring-blue-500 border-slate-300 w-3.5 h-3.5 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4">Kod PO</th>
                <th className="py-3 px-4">Data utworzenia</th>
                <th className="py-3 px-4">Dostawca / Vendor</th>
                <th className="py-3 px-4">Oczekiwana dostawa</th>
                <th className="py-3 px-4">Asortyment i ilość</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Akcje operacyjne</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150">
              {filteredPOs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                    Brak zleceń PO w kolejce dostaw o tych kryteriach.
                  </td>
                </tr>
              ) : (
                filteredPOs.map(po => {
                  let statusBadge = 'bg-slate-100 text-slate-500 border-slate-200';
                  if (po.status === 'Pending') statusBadge = 'bg-amber-50 text-amber-700 border-amber-220 animate-pulse';
                  else if (po.status === 'Completed') statusBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                  else if (po.status === 'Cancelled') statusBadge = 'bg-rose-50 text-rose-700 border-rose-200';
                  else if (po.status === 'Merged') statusBadge = 'bg-purple-50 text-purple-650 border-purple-200';
                  else if (po.status === 'ReturnPending') statusBadge = 'bg-violet-50 text-violet-700 border-violet-220 animate-pulse';
                  else if (po.status === 'ReturnReceived') statusBadge = 'bg-emerald-50 text-emerald-800 border-emerald-200';

                  const isPending = po.status === 'Pending';
                  const isReturnPending = po.status === 'ReturnPending';

                  return (
                    <tr key={po.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-3 px-4 text-center">
                        {isPending ? (
                          <input 
                            type="checkbox"
                            checked={selectedPoIds.includes(po.id)}
                            onChange={() => handleSelectPo(po.id)}
                            className="rounded text-blue-600 focus:ring-blue-500 border-slate-300 w-3.5 h-3.5 cursor-pointer"
                          />
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono font-black text-slate-800">{po.id}</td>
                      <td className="py-3 px-4 text-slate-400 font-mono">{po.createdDate}</td>
                      <td className="py-3 px-4 font-bold text-slate-700">{po.vendorName}</td>
                      <td className="py-3 px-4 text-slate-500 font-mono">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{po.expectedDeliveryDate}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          {po.items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="bg-slate-100 border border-slate-200 font-mono rounded px-1.5 py-0.5 text-[9px] font-bold text-slate-600">{item.sku}</span>
                              <span className="text-slate-600 max-w-[150px] truncate" title={item.name}>{item.name}</span>
                              <span className="text-slate-900 font-bold ml-auto font-mono text-[10px] bg-slate-100 border border-slate-200 px-1 py-0.2 rounded">{item.qtyOrdered} szt.</span>
                            </div>
                          ))}
                          {po.internalNotes && (
                            <div className="text-[9px] text-slate-400 italic mt-0.5 max-w-[200px] truncate" title={po.internalNotes}>
                              Notatka: {po.internalNotes}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${statusBadge}`}>
                          {po.status === 'Pending' ? 'Oczekujące PO' : 
                           po.status === 'Completed' ? 'Przyjęte PO' : 
                           po.status === 'Cancelled' ? 'Anulowane' : 
                           po.status === 'Merged' ? 'Zgrupowane' :
                           po.status === 'ReturnPending' ? 'Oczekuje na zwrot' : 'Zwrot Przyjęty'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-sans">
                        {isPending ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                if (confirm(`Zatwierdzić i przyjąć fizyczną dostawę dla zlecenia ${po.id}? Spowoduje to natychmiastowe zwiększenie stanów magazynowych w bazie danych.`)) {
                                  onReceivePurchaseOrder(po.id);
                                }
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-7 px-2.5 rounded text-[10px] cursor-pointer flex items-center gap-1 transition-all active:scale-95 border-none shadow"
                              title="Zatwierdź dostawę i dodaj stany do WMS"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Przyjmij
                            </button>
                            <button
                              onClick={() => openEditModal(po)}
                              className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold h-7 w-7 rounded flex items-center justify-center cursor-pointer transition-all active:scale-95"
                              title="Edytuj zapotrzebowanie"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Czy na pewno anulować zapotrzebowanie ${po.id}?`)) {
                                  onCancelPurchaseOrder(po.id);
                                }
                              }}
                              className="bg-white hover:bg-red-50 text-red-650 border border-slate-200 hover:border-red-200 font-bold h-7 w-7 rounded flex items-center justify-center cursor-pointer transition-all active:scale-95"
                              title="Anuluj zapotrzebowanie"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : isReturnPending ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                if (confirm(`Zatwierdzić i przyjąć fizyczny zwrot paczki dla RMA ${po.id}? Spowoduje to dodanie sztuk z powrotem na stany magazynowe.`)) {
                                  onReceiveRmaReturn(po.id);
                                }
                              }}
                              className="bg-violet-600 hover:bg-violet-750 text-white font-bold h-7 px-2.5 rounded text-[10px] cursor-pointer flex items-center gap-1 transition-all active:scale-95 border-none shadow"
                              title="Przyjmij zwrot RMA na magazyn"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Przyjmij zwrot
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
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

      {/* MODAL 1: Create Manual PO */}
      {isCreateModalOpen && (
        <>
          <div className="fixed inset-0 bg-[#0f172a]/55 backdrop-blur-xs z-50 transition-opacity" onClick={() => setIsCreateModalOpen(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 p-6 animate-fadeIn font-sans text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                <Truck className="w-4.5 h-4.5 text-blue-600" /> Nowe Zapotrzebowanie PO (Dostawca)
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 bg-transparent border-none cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Wybierz produkt SKU</label>
                <div className="relative">
                  <Layers className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={formSku}
                    onChange={e => handleSkuChange(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg bg-slate-50 font-bold focus:outline-none focus:border-blue-500 cursor-pointer appearance-none text-xs"
                    required
                  >
                    <option value="">-- Wybierz produkt z bazy --</option>
                    {products.map(p => (
                      <option key={p.sku} value={p.sku}>
                        {p.sku} - {p.name} ({p.stock} szt.)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Zapotrzebowanie (Ilość sztuk)</label>
                <input
                  type="number"
                  min="1"
                  value={formQty}
                  onChange={e => setFormQty(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:border-blue-500 animate-none"
                  required
                />
                <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                  Podana ilość zostanie wprowadzona do bazy (np. {formQty} szt. = {Math.ceil(formQty / 10)} palet).
                </span>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Dostawca (Vendor)</label>
                <input
                  type="text"
                  value={formVendor}
                  onChange={e => setFormVendor(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:border-blue-500 bg-slate-50"
                  placeholder="Automatyczny lub wpisz własny..."
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Oczekiwana data przyjazdu</label>
                <input
                  type="datetime-local"
                  value={formDate}
                  onChange={e => setFormDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:border-blue-500 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Notatki wewnętrzne</label>
                <textarea
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                  placeholder="Instrukcje logistyczne, rozładunkowe itp."
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3.5 mt-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3.5 py-2 border border-slate-200 rounded text-slate-600 hover:bg-slate-50 font-bold cursor-pointer transition-colors bg-white"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-750 text-white rounded font-bold cursor-pointer transition-colors border-none"
                >
                  Zapisz Zapotrzebowanie
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* MODAL 2: Edit PO */}
      {isEditModalOpen && currentEditingPo && (
        <>
          <div className="fixed inset-0 bg-[#0f172a]/55 backdrop-blur-xs z-50 transition-opacity" onClick={() => setIsEditModalOpen(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 p-6 animate-fadeIn font-sans text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                <Edit3 className="w-4.5 h-4.5 text-blue-600" /> Edytuj Zlecenie {currentEditingPo.id}
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 bg-transparent border-none cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-150 space-y-1">
                <div className="text-[10px] text-slate-400 font-extrabold uppercase">Artykuł SKU</div>
                <div className="font-bold text-slate-700">{currentEditingPo.items[0]?.sku} - {currentEditingPo.items[0]?.name}</div>
                <div className="text-[10px] text-slate-400 font-mono mt-1">Dostawca: {currentEditingPo.vendorName}</div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Edytuj Ilość (sztuki)</label>
                <input
                  type="number"
                  min="1"
                  value={editQty}
                  onChange={e => setEditQty(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Zmień datę przyjazdu</label>
                <input
                  type="datetime-local"
                  value={editDate}
                  onChange={e => setEditDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:border-blue-500 cursor-pointer"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5 font-sans">
                  Obecna data: {currentEditingPo.expectedDeliveryDate}
                </span>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Notatki wewnętrzne</label>
                <textarea
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                  placeholder="Notatki"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3.5 mt-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-3.5 py-2 border border-slate-200 rounded text-slate-600 hover:bg-slate-50 font-bold cursor-pointer transition-colors bg-white"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-750 text-white rounded font-bold cursor-pointer transition-colors border-none"
                >
                  Zatwierdź Zmiany
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
