import React, { useState, useMemo } from 'react';
import { 
  ShoppingCart, AlertTriangle, AlertCircle, CheckCircle2, 
  PackageCheck, HelpCircle, FileText, Landmark, RefreshCw 
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

interface ReorderPlannerProps {
  products: Product[];
  purchaseOrders: PurchaseOrder[];
  onCreatePurchaseOrder: (newPo: any) => void;
  logActivity: (message: string, type: string, details?: string) => void;
  addToast: (title: string, text: string, type: 'error' | 'warning' | 'info' | 'success') => void;
}

export default function ReorderPlanner({
  products = [],
  purchaseOrders = [],
  onCreatePurchaseOrder,
  logActivity,
  addToast
}: ReorderPlannerProps) {
  // Quantities mapping for order inputs (key is SKU)
  const [orderQtyMap, setOrderQtyMap] = useState<Record<string, number>>({});
  // Selected items mapping (key is SKU, value is boolean)
  const [selectedSkus, setSelectedSkus] = useState<Record<string, boolean>>({});

  // Helper to map categories to suppliers
  const getSupplierForCategory = (category: string) => {
    const norm = (category || '').toLowerCase();
    if (norm.includes('spożywcz') || norm.includes('żywność')) return 'Hurtownia Spożywcza EuroFoods Sp. z o.o.';
    if (norm.includes('elektronik') || norm.includes('audio')) return 'ElectroDistrib PL S.A.';
    if (norm.includes('biur') || norm.includes('akcesor')) return 'OfficeMax Supply Poland';
    if (norm.includes('częśc') || norm.includes('chem') || norm.includes('auto')) return 'AutoParts Distrib Polska';
    return 'Global Warehousing Supplies';
  };

  // 1. Filter low stock products (stock <= reorderThreshold)
  const lowStockProducts = useMemo(() => {
    return products.filter(p => p.stock <= p.reorderThreshold);
  }, [products]);

  // Out of stock products
  const outOfStockProducts = useMemo(() => {
    return products.filter(p => p.stock <= 0);
  }, [products]);

  // 2. Initialize default quantities for inputs if not set
  useMemo(() => {
    const initialQtys: Record<string, number> = { ...orderQtyMap };
    const initialSelections: Record<string, boolean> = { ...selectedSkus };
    let changed = false;

    lowStockProducts.forEach(p => {
      // Default suggested order qty: (Threshold * 4) - Stock, minimum of 50
      if (initialQtys[p.sku] === undefined) {
        const suggested = Math.max(50, (p.reorderThreshold * 4) - p.stock);
        initialQtys[p.sku] = suggested;
        changed = true;
      }
      if (initialSelections[p.sku] === undefined) {
        initialSelections[p.sku] = true;
        changed = true;
      }
    });

    if (changed) {
      setOrderQtyMap(initialQtys);
      setSelectedSkus(initialSelections);
    }
  }, [lowStockProducts]);

  // 3. Group low stock products by supplier
  const groupedBySupplier = useMemo(() => {
    const groups: Record<string, Product[]> = {};
    lowStockProducts.forEach(p => {
      const supplier = getSupplierForCategory(p.category);
      if (!groups[supplier]) groups[supplier] = [];
      groups[supplier].push(p);
    });
    return groups;
  }, [lowStockProducts]);

  // Calculate sum of suggested costs
  const totalSuggestedCost = useMemo(() => {
    return lowStockProducts.reduce((sum, p) => {
      const qty = orderQtyMap[p.sku] || Math.max(50, (p.reorderThreshold * 4) - p.stock);
      const isSelected = selectedSkus[p.sku] !== false;
      return sum + (isSelected ? qty * (p.price || 0) : 0);
    }, 0);
  }, [lowStockProducts, orderQtyMap, selectedSkus]);

  // 4. Generate Purchase Order for a supplier
  const handleGeneratePo = (supplierName: string) => {
    const supplierProducts = groupedBySupplier[supplierName] || [];
    const selectedItems = supplierProducts.filter(p => selectedSkus[p.sku] !== false);

    if (selectedItems.length === 0) {
      addToast('Brak zaznaczonych pozycji', 'Zaznacz co najmniej jeden produkt, aby wygenerować zamówienie.', 'warning');
      return;
    }

    const newPoId = `PO-${Math.floor(10000 + Math.random() * 90000)}`;
    const newPO: PurchaseOrder = {
      id: newPoId,
      createdDate: new Date().toLocaleDateString('pl-PL', { day: '2-digit', month: 'short' }) + ', ' + new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
      status: 'Pending',
      vendorName: supplierName,
      expectedDeliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString('pl-PL', { day: '2-digit', month: 'short' }) + ', 12:00',
      items: selectedItems.map(p => ({
        sku: p.sku,
        name: p.name,
        qtyOrdered: Number(orderQtyMap[p.sku] || 50)
      })),
      internalNotes: `Zlecenie zaopatrzenia Min-Max wygenerowane automatycznie dla dostawcy: ${supplierName}.`
    };

    onCreatePurchaseOrder(newPO);

    logActivity(
      `Wygenerowano automatyczne zamówienie zaopatrzenia ${newPoId}`,
      'receive',
      `Dostawca: ${supplierName}, Pozycji: ${newPO.items.length}, Szacunkowy koszt: ${selectedItems.reduce((sum, p) => sum + (orderQtyMap[p.sku] || 0) * p.price, 0).toFixed(2)} PLN`
    );

    addToast(
      'Zamówienie PO wygenerowane', 
      `Utworzono ${newPoId} dla ${supplierName} z ${newPO.items.length} pozycjami.`, 
      'success'
    );

    // Remove ordered skus from alert selection to prevent ordering twice
    setSelectedSkus(prev => {
      const updated = { ...prev };
      selectedItems.forEach(p => {
        updated[p.sku] = false;
      });
      return updated;
    });
  };

  // Toggle selection
  const handleToggleSelect = (sku: string) => {
    setSelectedSkus(prev => ({
      ...prev,
      [sku]: !prev[sku]
    }));
  };

  // Update ordered quantity input
  const handleQtyChange = (sku: string, val: string) => {
    const num = parseInt(val) || 0;
    setOrderQtyMap(prev => ({
      ...prev,
      [sku]: Math.max(1, num)
    }));
  };

  return (
    <div id="wms-reorder-panel" className="space-y-6 font-sans text-sm text-[#334155] animate-fadeIn pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
            <ShoppingCart className="w-5.5 h-5.5 text-blue-650" /> Planowanie Uzupełnień Min-Max (PO Generator)
          </h2>
          <p className="text-xs text-slate-500 mt-1.5 max-w-xl font-sans">
            Planer zaopatrzenia. System wykrywa zapasy, które spadły poniżej zdefiniowanego poziomu krytycznego, grupuje je według dostawców i generuje zlecenia Purchase Order.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        <div className="bg-white border border-slate-200 rounded-xl p-4.5 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase select-none">Alertów niskich stanów</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{lowStockProducts.length}</span>
              <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded">Min-Max</span>
            </div>
            <span className="text-[10px] text-slate-450 block">SKU poniżej progu alarmowego.</span>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <AlertTriangle className="w-6 h-6 stroke-1.5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4.5 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase select-none">Całkowicie wyprzedane</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{outOfStockProducts.length}</span>
              <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded">Out of Stock</span>
            </div>
            <span className="text-[10px] text-slate-450 block">SKU z zerowym stanem zapasów.</span>
          </div>
          <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
            <AlertCircle className="w-6 h-6 stroke-1.5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4.5 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase select-none">Wartość sugerowanego koszyka</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-blue-700 font-mono">{totalSuggestedCost.toLocaleString('pl-PL', { minimumFractionDigits: 2 })}</span>
              <span className="text-xs font-extrabold text-blue-600">PLN</span>
            </div>
            <span className="text-[10px] text-slate-450 block">Szacunkowy koszt zakupu zaznaczonych pozycji.</span>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
            <Landmark className="w-6 h-6 stroke-1.5" />
          </div>
        </div>

      </div>

      {/* Main Content: Grouped by supplier */}
      <div className="space-y-6">
        {lowStockProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center select-none bg-white border border-slate-200 rounded-xl shadow-xs">
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
            <span className="text-sm font-bold text-slate-800 mt-3.5">Brak zapotrzebowania zakupowego</span>
            <span className="text-xs text-slate-400 mt-1 max-w-sm font-sans">
              Wszystkie stany zapasów są na bezpiecznym poziomie (powyżej progu Min dla każdego SKU).
            </span>
          </div>
        ) : (
          Object.entries(groupedBySupplier).map(([supplier, productsList]) => {
            const selectedInGroup = productsList.filter(p => selectedSkus[p.sku] !== false);
            return (
              <div 
                key={supplier}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4"
              >
                {/* Supplier Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-extrabold text-slate-900">{supplier}</h3>
                    <p className="text-[10.5px] text-slate-450">
                      Wykryto <span className="font-bold text-slate-650">{productsList.length} pozycje</span> z niskim zapasem u tego dostawcy.
                    </p>
                  </div>
                  <button
                    onClick={() => handleGeneratePo(supplier)}
                    disabled={selectedInGroup.length === 0}
                    className="h-8.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] rounded transition-colors cursor-pointer border-none shadow disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap active:scale-[0.98]"
                  >
                    Generuj zamówienie PO ({selectedInGroup.length} poz.)
                  </button>
                </div>

                {/* Items Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-150 text-[10px] text-slate-400 font-extrabold uppercase select-none">
                        <th className="py-2 px-3 text-center w-10">Zamów</th>
                        <th className="py-2 px-3">SKU</th>
                        <th className="py-2 px-3">Nazwa produktu</th>
                        <th className="py-2 px-3 text-right">Stan zapasu</th>
                        <th className="py-2 px-3 text-right">Próg Min</th>
                        <th className="py-2 px-3 text-center w-36">Ilość zamawiana</th>
                        <th className="py-2 px-3 text-right">Cena jedn.</th>
                        <th className="py-2 px-3 text-right">Suma szac.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productsList.map(p => {
                        const isChecked = selectedSkus[p.sku] !== false;
                        const qty = orderQtyMap[p.sku] || 50;
                        const itemTotal = qty * (p.price || 0);
                        return (
                          <tr 
                            key={p.sku}
                            className={`border-b border-slate-100 text-xs font-semibold hover:bg-slate-50/50 transition-colors ${
                              !isChecked ? 'opacity-55' : ''
                            }`}
                          >
                            <td className="py-2 px-3 text-center">
                              <input 
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleSelect(p.sku)}
                                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <span className="font-mono font-bold text-slate-905">{p.sku}</span>
                            </td>
                            <td className="py-2 px-3 font-sans font-medium text-slate-650">{p.name}</td>
                            <td className={`py-2 px-3 text-right font-mono font-bold ${
                              p.stock <= 0 ? 'text-rose-650' : 'text-amber-650'
                            }`}>
                              {p.stock} szt.
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-500">
                              {p.reorderThreshold} szt.
                            </td>
                            <td className="py-2 px-3 text-center">
                              <input 
                                type="number"
                                min="1"
                                disabled={!isChecked}
                                value={qty}
                                onChange={e => handleQtyChange(p.sku, e.target.value)}
                                className="w-24 text-center p-1 border border-slate-200 rounded text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono font-bold text-slate-805 bg-white disabled:bg-slate-50 disabled:text-slate-400"
                              />
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-slate-550">
                              {(p.price || 0).toFixed(2)} PLN
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                              {itemTotal.toFixed(2)} PLN
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* History of generated orders */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 border-b border-slate-100 pb-3 select-none">
          <FileText className="w-4.5 h-4.5 text-blue-600" />
          Ostatnio Wygenerowane Zlecenia Zaopatrzenia (POs)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-150 text-[10px] text-slate-400 font-extrabold uppercase select-none">
                <th className="py-2 px-3">Numer PO</th>
                <th className="py-2 px-3">Data utworzenia</th>
                <th className="py-2 px-3">Dostawca / Przewoźnik</th>
                <th className="py-2 px-3 text-center">Liczba pozycji</th>
                <th className="py-2 px-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {purchaseOrders.slice(0, 5).map(po => (
                <tr key={po.id} className="border-b border-slate-100 text-xs font-semibold hover:bg-slate-50/50 transition-colors">
                  <td className="py-2.5 px-3">
                    <span className="font-mono font-bold text-slate-805">{po.id}</span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 font-normal">{po.createdDate}</td>
                  <td className="py-2.5 px-3 text-slate-700">{po.vendorName}</td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-850">
                    {po.items.length}
                  </td>
                  <td className="py-2.5 px-3 select-none">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${
                      po.status === 'Completed' 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-250' 
                        : po.status === 'Pending'
                        ? 'bg-amber-50 text-amber-800 border-amber-250'
                        : 'bg-slate-100 text-slate-550 border-slate-200'
                    }`}>
                      {po.status === 'Completed' ? 'ROZŁADOWANE' : po.status === 'Pending' ? 'OCZEKUJĄCE' : po.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
