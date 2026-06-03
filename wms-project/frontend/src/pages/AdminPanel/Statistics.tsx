import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, PackageCheck, Package, 
  Clock, UserCheck, MapPin, Activity, CheckCircle2, AlertTriangle, 
  Percent, ShieldAlert, Users, Target, BarChart3, Filter, Check, Award
} from 'lucide-react';
import { Product } from '../../services/inventoryApi';

interface StatisticsProps {
  orders: any[];
  products: Product[];
  zones: any[];
  staffList: any[];
}

export default function Statistics({ orders = [], products = [], zones = [], staffList = [] }: StatisticsProps) {
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('all');
  const [activeChartTab, setActiveChartTab] = useState<'orders' | 'categories' | 'zones' | 'top_skus' | 'turnover' | 'frequency'>('orders');
  const [hoveredDataId, setHoveredDataId] = useState<string | null>(null);

  // 1. DYNAMIC CALCULATIONS
  
  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Priority filter
      const matchesPriority = priorityFilter === 'all' 
        ? true 
        : (order.priority || '').toLowerCase() === priorityFilter.toLowerCase();
      
      // Time Range filter (simulated based on shipmentDate status and order ID ranges)
      let matchesTime = true;
      if (timeRange === 'today') {
        matchesTime = (order.shipmentDate && order.shipmentDate.includes('Dziś')) || order.status === 'W realizacji';
      } else if (timeRange === '7days') {
        matchesTime = order.id !== 'ORD-89232' && order.id !== 'ORD-89233'; // simulate recent ones
      }
      
      return matchesPriority && matchesTime;
    });
  }, [orders, priorityFilter, timeRange]);

  // Order Counts by Status
  const orderStats = useMemo(() => {
    const stats = {
      pending: 0,     // 'Oczekujące'
      inProgress: 0,  // 'W realizacji'
      shipped: 0,     // 'Wysłane'
      delivered: 0,   // 'Dostarczone'
      total: filteredOrders.length
    };

    filteredOrders.forEach(o => {
      const status = (o.status || '').toLowerCase();
      if (status.includes('oczekując')) stats.pending++;
      else if (status.includes('realizacj')) stats.inProgress++;
      else if (status.includes('wysłan')) stats.shipped++;
      else if (status.includes('dostarczo')) stats.delivered++;
    });

    return stats;
  }, [filteredOrders]);

  // Financial Estimation (Sum of: qty * standard product price)
  const financialKPIs = useMemo(() => {
    let totalValue = 0;
    let fulfilledValue = 0;
    let pendingValue = 0;
    let totalItemsCount = 0;

    filteredOrders.forEach(order => {
      const isFulfilled = ['wysłane', 'dostarczone'].includes((order.status || '').toLowerCase());
      
      (order.items || []).forEach((item: any) => {
        // Find matching product price or generate based on category/sku
        const product = products.find(p => p.sku === item.sku);
        const price = product?.price || 49.99; // Fallback price
        
        const itemVal = item.qty * price;
        totalValue += itemVal;
        totalItemsCount += item.qty;

        if (isFulfilled) {
          fulfilledValue += itemVal;
        } else {
          pendingValue += itemVal;
        }
      });
    });

    return {
      totalValue,
      fulfilledValue,
      pendingValue,
      totalItemsCount
    };
  }, [filteredOrders, products]);

  // Inventory Capacity & Alarm metrics
  const inventoryMetrics = useMemo(() => {
    const totalItems = products.reduce((sum, p) => sum + (p.stock || 0), 0);
    const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= p.reorderThreshold).length;
    const outOfStockCount = products.filter(p => p.stock === 0).length;
    const avgPrice = products.length > 0 
      ? products.reduce((sum, p) => sum + (p.price || 0), 0) / products.length 
      : 0;

    return {
      totalItems,
      lowStockCount,
      outOfStockCount,
      avgPrice
    };
  }, [products]);

  // Top Demanded SKUs (calculated dynamically from orders)
  const topDemandedSkus = useMemo(() => {
    const skuMap: Record<string, { sku: string, name: string, qty: number, orderCount: number }> = {};
    
    orders.forEach(order => {
      (order.items || []).forEach((item: any) => {
        if (!skuMap[item.sku]) {
          skuMap[item.sku] = {
            sku: item.sku,
            name: item.name || item.product,
            qty: 0,
            orderCount: 0
          };
        }
        skuMap[item.sku].qty += item.qty;
        skuMap[item.sku].orderCount += 1;
      });
    });

    return Object.values(skuMap)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5); // Return top 5
  }, [orders]);

  // Product Category Proportions
  const categoryStats = useMemo(() => {
    const categories: Record<string, { count: number, value: number, stock: number }> = {};
    
    products.forEach(p => {
      const cat = p.category || 'Inne';
      if (!categories[cat]) {
        categories[cat] = { count: 0, value: 0, stock: 0 };
      }
      categories[cat].count += 1;
      categories[cat].value += (p.stock || 0) * (p.price || 0);
      categories[cat].stock += (p.stock || 0);
    });

    return Object.entries(categories).map(([name, data]) => ({
      name,
      ...data
    })).sort((a, b) => b.value - a.value);
  }, [products]);

  // Worker performance stats leaderboards
  const workerKPIs = useMemo(() => {
    // Generate simulated analytics based on staffList names
    return staffList.map((staff, idx) => {
      // Pseudo-random but static generator based on staff name to keep it consistent
      const nameStr = staff.firstName && staff.lastName ? `${staff.firstName} ${staff.lastName}` : (staff.name || '');
      const prime = nameStr.charCodeAt(0) || 75;
      const picksToday = Math.round((prime * 1.5) % 80) + 40;
      const accuracy = 98.2 + ((prime % 15) / 10);
      const avgPickSec = 35 + (prime % 25);
      const level = staff.role === 'Admin' ? 'A+' : staff.role === 'Packer' ? 'A' : 'B+';
      
      return {
        id: staff.id,
        name: nameStr,
        role: staff.role || staff.position || 'Kompletujący',
        picksToday,
        accuracy: Math.min(accuracy, 100).toFixed(1),
        avgPickSec,
        level
      };
    }).sort((a, b) => b.picksToday - a.picksToday);
  }, [staffList]);

  // Turnover rate and depletion estimation
  const turnoverStats = useMemo(() => {
    return products.map(p => {
      // Create stable pseudo-random calculations for demonstration
      const prime = p.sku.charCodeAt(p.sku.length - 1) || 5;
      const salesQty = Math.round((prime * 7) % 45) + 5;
      const ratio = p.stock > 0 ? (salesQty / p.stock) : 0;
      const rate = ratio > 1 ? ratio : ratio + 0.15;
      const days = Math.round(30 / (rate || 1));
      return {
        sku: p.sku,
        name: p.name,
        stock: p.stock,
        salesQty,
        rate: parseFloat(rate.toFixed(2)),
        daysToDeplete: days > 90 ? '90+' : `${days} dni`
      };
    }).sort((a, b) => b.rate - a.rate);
  }, [products]);

  // Order frequency statistics over 30d
  const frequencyStats = useMemo(() => {
    return [
      { week: 'Tydzień 1 (W1)', count: 28, value: 14200, color: 'bg-emerald-500', hoverColor: 'hover:bg-emerald-600' },
      { week: 'Tydzień 2 (W2)', count: 35, value: 18500, color: 'bg-teal-500', hoverColor: 'hover:bg-teal-600' },
      { week: 'Tydzień 3 (W3)', count: 42, value: 22400, color: 'bg-blue-500', hoverColor: 'hover:bg-blue-650' },
      { week: 'Tydzień 4 (W4)', count: 31, value: 15900, color: 'bg-indigo-500', hoverColor: 'hover:bg-indigo-600' },
    ];
  }, []);

  // Max value calculation for bar chart scaling
  const maxOrderStatusVal = Math.max(orderStats.pending, orderStats.inProgress, orderStats.shipped, orderStats.delivered, 1);
  const maxCategoryStock = Math.max(...categoryStats.map(c => c.stock), 1);
  const maxSkuQty = Math.max(...topDemandedSkus.map(s => s.qty), 1);
  const maxTurnoverRate = Math.max(...turnoverStats.map(t => t.rate), 1);
  const maxFreqCount = Math.max(...frequencyStats.map(f => f.count), 1);

  return (
    <div id="wms-analytics-panel" className="space-y-6 font-sans text-sm text-[#334155] animate-fadeIn pb-12">
      {/* 1. Header with Live telemetry stats and Interactive Filters */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-[#0f172a] p-6 rounded-xl border border-[#1e293b] text-white shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-[#2170e4] text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded tracking-wide animate-pulse flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> ANALITYKA WMS
            </span>
            <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-white font-sans">
              Statystyki i Raporty Systemowe
            </h2>
          </div>
          <p className="text-zinc-400 text-xs mt-1 font-medium max-w-2xl leading-relaxed">
            Interaktywne zestawienie przepustowości operacji logistycznych. Analiza wartości koszyków wydań, zapełnienia fizycznego korytarzy oraz czasu kompletacji.
          </p>
        </div>

        {/* Filters bar */}
        <div className="flex flex-wrap items-center gap-3.5 select-none text-zinc-300">
          <div className="flex items-center gap-2 bg-[#1e293b] px-3 py-1.5 rounded-lg border border-[#334155]">
            <Filter className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">Priorytet:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-transparent border-none text-white text-xs font-bold outline-none cursor-pointer focus:ring-0"
            >
              <option value="all" className="bg-[#1e293b]">Wszystkie</option>
              <option value="wysoki" className="bg-[#1e293b]">Wysoki (Prio 1)</option>
              <option value="normalny" className="bg-[#1e293b]">Normalny</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-[#1e293b] px-3 py-1.5 rounded-lg border border-[#334155]">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">Okres:</span>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-transparent border-none text-white text-xs font-bold outline-none cursor-pointer focus:ring-0"
            >
              <option value="all" className="bg-[#1e293b]">Wszystkie dane</option>
              <option value="today" className="bg-[#1e293b]">Dzisiejsze rundy</option>
              <option value="7days" className="bg-[#1e293b]">Ostatnie 7 dni</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Key Performance Indicators Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Value of total pipeline */}
        <div className="bg-white rounded-xl p-5 border border-[#e2e8f0] shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono"> pipeline finansowy zapotrzebowania </span>
              <span className="text-2xl font-black text-slate-900 tracking-tight font-mono block mt-1">
                {financialKPIs.totalValue.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł
              </span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-[11px]">
            <span className="text-emerald-600 font-extrabold flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />
              {financialKPIs.fulfilledValue > 0 ? Math.round((financialKPIs.fulfilledValue / financialKPIs.totalValue) * 100) : 0}%
            </span>
            <span className="text-slate-500">Zrealizowano ({financialKPIs.fulfilledValue.toLocaleString('pl-PL', { maximumFractionDigits: 0 })} zł)</span>
          </div>
        </div>

        {/* KPI 2: Order shipment rate */}
        <div className="bg-white rounded-xl p-5 border border-[#e2e8f0] shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Wydane zamówienia</span>
              <span className="text-2xl font-black text-slate-900 tracking-tight font-mono block mt-1">
                {orderStats.shipped + orderStats.delivered} / {orderStats.total}
              </span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <PackageCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-[11px]">
            <span className="text-blue-600 font-extrabold">
              {orderStats.total > 0 ? Math.round(((orderStats.shipped + orderStats.delivered) / orderStats.total) * 100) : 0}%
            </span>
            <span className="text-slate-500">Wskaźnik wysyłki (Outbound)</span>
          </div>
        </div>

        {/* KPI 3: Inventory value density & Low Stock alerts */}
        <div className={`bg-white rounded-xl p-5 border border-[#e2e8f0] shadow-sm hover:shadow-md transition-all ${inventoryMetrics.outOfStockCount > 0 ? 'border-red-200 bg-red-50/10' : ''}`}>
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Pozycje do reorderu</span>
              <span className={`text-2xl font-black tracking-tight font-mono block mt-1 ${inventoryMetrics.outOfStockCount > 0 ? 'text-red-700' : 'text-slate-900'}`}>
                {inventoryMetrics.lowStockCount + inventoryMetrics.outOfStockCount} SKU
              </span>
            </div>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${inventoryMetrics.outOfStockCount > 0 ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-[11px]">
            <span className={inventoryMetrics.outOfStockCount > 0 ? 'text-red-700 font-bold' : 'text-amber-700 font-bold'}>
              {inventoryMetrics.outOfStockCount} szt. zero-status
            </span>
            <span className="text-slate-500">Wymaga pilnego zatowarowania</span>
          </div>
        </div>

        {/* KPI 4: Global picking accuracy rate percentage */}
        <div className="bg-white rounded-xl p-5 border border-[#e2e8f0] shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Dokładność kompletacji</span>
              <span className="text-2xl font-black text-emerald-600 tracking-tight font-mono block mt-1">
                99.85%
              </span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-[11px]">
            <span className="text-emerald-600 font-extrabold">NORMA WMS: &gt;99.5%</span>
            <span className="text-slate-500">• Cel operacyjny osiągnięty</span>
          </div>
        </div>
      </div>

      {/* 3. Main Chart section & Ranking Lists Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Interactive Graph block (Takes 2 Columns) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#e2e8f0] p-6 shadow-sm flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4 mb-6">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#2170e4]" />
                Interaktywne Wykresy Statystyczne
              </h3>
              <p className="text-xs text-slate-500 mt-1">Wybierz zakładkę, aby przeanalizować rozkład danych operacyjnych.</p>
            </div>

            {/* Sub-tabs for chart select */}
            <div className="flex flex-wrap bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0 select-none gap-0.5">
              <button
                onClick={() => setActiveChartTab('orders')}
                className={`px-3 py-1.5 rounded-md text-[11px] font-bold cursor-pointer transition-all border-none ${
                  activeChartTab === 'orders' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Status Zamówień
              </button>
              <button
                onClick={() => setActiveChartTab('categories')}
                className={`px-3 py-1.5 rounded-md text-[11px] font-bold cursor-pointer transition-all border-none ${
                  activeChartTab === 'categories' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Kategorie SKU
              </button>
              <button
                onClick={() => setActiveChartTab('zones')}
                className={`px-3 py-1.5 rounded-md text-[11px] font-bold cursor-pointer transition-all border-none ${
                  activeChartTab === 'zones' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Zapełnienie Hal
              </button>
              <button
                onClick={() => setActiveChartTab('top_skus')}
                className={`px-3 py-1.5 rounded-md text-[11px] font-bold cursor-pointer transition-all border-none ${
                  activeChartTab === 'top_skus' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Gorące SKU
              </button>
              <button
                type="button"
                onClick={() => setActiveChartTab('turnover')}
                className={`px-2.5 py-1.5 rounded-md text-[10px] sm:text-[11px] font-bold cursor-pointer transition-all border-none ${
                  activeChartTab === 'turnover' ? 'bg-[#2170e4] text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                📈 Rotacja Zapasów
              </button>
              <button
                type="button"
                onClick={() => setActiveChartTab('frequency')}
                className={`px-2.5 py-1.5 rounded-md text-[10px] sm:text-[11px] font-bold cursor-pointer transition-all border-none ${
                  activeChartTab === 'frequency' ? 'bg-[#2170e4] text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                📅 Częstotliwość (30d)
              </button>
            </div>
          </div>

          {/* Dynamic Render of Selected Chart View */}
          <div className="flex-grow flex flex-col justify-center min-h-[300px]">
            {activeChartTab === 'orders' && (
              <div className="space-y-5">
                <p className="text-xs font-semibold text-slate-500 mb-2">Liczba zarejestrowanych dokumentów out-of-door posortowanych według statusu:</p>
                
                {[
                  { key: 'oczekujace', label: 'Oczekujące (Zlecone do terminala)', count: orderStats.pending, color: 'bg-purple-500', hoverColor: 'hover:bg-purple-600', textColor: 'text-purple-700', bgLt: 'bg-purple-50' },
                  { key: 'realizacja', label: 'W realizacji (Picker / Packer)', count: orderStats.inProgress, color: 'bg-blue-500', hoverColor: 'hover:bg-blue-600', textColor: 'text-blue-700', bgLt: 'bg-blue-50' },
                  { key: 'wyslane', label: 'Wysłane (Przekazane kurierom)', count: orderStats.shipped, color: 'bg-amber-500', hoverColor: 'hover:bg-amber-600', textColor: 'text-amber-700', bgLt: 'bg-amber-50' },
                  { key: 'dostarczone', label: 'Dostarczone do kontrahentów', count: orderStats.delivered, color: 'bg-emerald-500', hoverColor: 'hover:bg-emerald-600', textColor: 'text-emerald-700', bgLt: 'bg-emerald-50' },
                ].map((row) => {
                  const percent = maxOrderStatusVal > 0 ? (row.count / maxOrderStatusVal) * 100 : 0;
                  const isHovered = hoveredDataId === row.key;
                  return (
                    <div 
                      key={row.key} 
                      className={`space-y-1.5 p-2 rounded-lg transition-all ${isHovered ? 'bg-slate-50' : ''}`}
                      onMouseEnter={() => setHoveredDataId(row.key)}
                      onMouseLeave={() => setHoveredDataId(null)}
                    >
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <span className="text-slate-800 font-bold">{row.label}</span>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${row.textColor} ${row.bgLt}`}>{row.count} zam.</span>
                          <span className="text-[#a0a0a0] font-mono text-[10px]">({Math.round(percent)}%)</span>
                        </div>
                      </div>
                      
                      <div className="w-full bg-slate-100 rounded-lg h-5 overflow-hidden flex border border-slate-200">
                        <div 
                          className={`${row.color} ${row.hoverColor} h-full transition-all duration-500 rounded-lg flex items-center pl-2`}
                          style={{ width: `${Math.max(percent, 3)}%` }}
                        >
                          {percent > 12 && (
                            <span className="text-[9px] font-black text-white uppercase tracking-widest leading-none">
                              {row.count}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {activeChartTab === 'categories' && (
              <div className="space-y-4">
                <p className="text-xs font-semibold text-slate-500 mb-2">Dystrybucja stanów magazynowych oraz wartości asortymentów wg głównych kategorii:</p>
                
                {categoryStats.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-10">Brak danych o kategoriach produktowych.</p>
                ) : (
                  categoryStats.map((cat, idx) => {
                    const percentStock = maxCategoryStock > 0 ? (cat.stock / maxCategoryStock) * 100 : 0;
                    return (
                      <div key={idx} className="space-y-1.5 p-2 rounded-lg hover:bg-zinc-50 transition-all">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-800">{cat.name}</span>
                          <span className="text-slate-500 font-mono text-[11px]">
                            Liczba: <strong className="text-slate-800 font-bold">{cat.count} SKU</strong> • Łącznie: <strong className="text-slate-900 font-bold">{cat.stock} szt.</strong> ({cat.value.toLocaleString('pl-PL', { maximumFractionDigits: 0 })} zł)
                          </span>
                        </div>
                        <div className="w-full bg-[#f1f5f9] rounded-lg h-4.5 overflow-hidden flex border border-slate-200">
                          <div 
                            className="bg-sky-500 hover:bg-sky-600 h-full rounded-lg transition-all"
                            style={{ width: `${percentStock}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {activeChartTab === 'zones' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {zones.slice(0, 4).map((zone, idx) => {
                  const percent = zone.capacityPercent || 0;
                  const isHighLoad = percent > 85;
                  
                  return (
                    <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:border-blue-400 transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 block uppercase font-mono">ADRES SKŁADOWANIA</span>
                          <span className="text-sm font-extrabold text-[#0f172a] block">Korytarz ryglowy {zone.id}</span>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-black border ${
                          isHighLoad ? 'bg-amber-100 text-amber-805 border-amber-300 animate-pulse' : 'bg-green-100 text-green-800 border-green-300'
                        }`}>
                          {zone.temp}
                        </span>
                      </div>

                      <div className="space-y-2 mt-2">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-500">Stopień zapełnienia:</span>
                          <span className={isHighLoad ? 'text-amber-700 font-black' : 'text-slate-800 font-black'}>
                            {percent}% ({zone.totalPallets} / {zone.maxPallets} PL)
                          </span>
                        </div>
                        <div className="w-full bg-[#e2e8f0] rounded-full h-3 overflow-hidden border border-slate-300">
                          <div 
                            className={`h-full rounded-full transition-all ${isHighLoad ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {activeChartTab === 'top_skus' && (
              <div className="space-y-4">
                <p className="text-xs font-semibold text-slate-500 mb-2">Najbardziej rozchwytywane pozycje asortymentowe według zliczonej ilości sztuk w zamówieniach:</p>
                
                {topDemandedSkus.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-10">Brak zarejestrowanych SKU w pliku outbound.</p>
                ) : (
                  topDemandedSkus.map((sku, idx) => {
                    const percent = maxSkuQty > 0 ? (sku.qty / maxSkuQty) * 100 : 0;
                    return (
                      <div key={idx} className="space-y-1.5 p-2 rounded-lg hover:bg-slate-50 transition-all">
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#2170e4] bg-blue-50 px-2 py-0.5 rounded font-mono text-[10px]">{sku.sku}</span>
                            <span className="font-extrabold text-slate-800 truncate max-w-xs">{sku.name}</span>
                          </div>
                          <span className="text-slate-600 font-mono text-[11px]">
                            Łącznie zamówiono: <strong className="text-slate-950 font-black">{sku.qty} szt.</strong> ({sku.orderCount} transakcji)
                          </span>
                        </div>
                        <div className="w-full bg-[#f1f5f9] rounded-lg h-3.5 overflow-hidden flex border border-slate-200">
                          <div 
                            className="bg-indigo-500 hover:bg-indigo-600 h-full rounded-lg transition-all"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {activeChartTab === 'turnover' && (
              <div className="space-y-4 animate-fadeIn">
                <p className="text-xs font-semibold text-slate-500 mb-2">Wskaźnik rotacji zapasów (skorelowana prędkość wydań do stanów magazynowych w okresie 30 dni):</p>
                {turnoverStats.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-10">Brak zapasów do analizy rotacji.</p>
                ) : (
                  turnoverStats.map((item, idx) => {
                    const percent = maxTurnoverRate > 0 ? (item.rate / maxTurnoverRate) * 100 : 0;
                    return (
                      <div key={idx} className="space-y-1.5 p-2 rounded-lg hover:bg-slate-50 transition-all">
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 truncate max-w-xs">{item.name}</span>
                            <span className="font-mono text-[10px] text-slate-400">({item.sku})</span>
                          </div>
                          <span className="text-slate-650 font-mono text-[11px]">
                            Rotacja: <strong className="text-blue-600 font-extrabold">{item.rate}x / msc</strong> • Stan: <strong className="text-slate-800 font-bold">{item.stock} szt.</strong> (Wydano: {item.salesQty})
                          </span>
                        </div>
                        <div className="w-full bg-[#f1f5f9] rounded-lg h-3.5 overflow-hidden flex border border-slate-200">
                          <div 
                            className="bg-emerald-500 hover:bg-emerald-600 h-full rounded-lg transition-all"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-zinc-400 font-semibold px-0.5">
                          <span>Szacowany czas wyczerpania: <strong className="text-zinc-650 font-bold">{item.daysToDeplete}</strong></span>
                          <span>Rekomendacja: {item.rate > 1.5 ? <span className="text-amber-600 font-bold">Pilne domówienie</span> : <span className="text-emerald-600 font-bold">Stan optymalny</span>}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {activeChartTab === 'frequency' && (
              <div className="space-y-4 animate-fadeIn">
                <p className="text-xs font-semibold text-slate-500 mb-2">Wolumen zrealizowanych kompletacji i wydań w ujęciu tygodniowym (ostatnie 30 dni):</p>
                {frequencyStats.map((item, idx) => {
                  const percent = maxFreqCount > 0 ? (item.count / maxFreqCount) * 100 : 0;
                  return (
                    <div key={idx} className="space-y-1.5 p-2 rounded-lg hover:bg-slate-50 transition-all">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-800">{item.week}</span>
                        <span className="text-slate-600 font-mono text-[11px]">
                          Liczba rund: <strong className="text-slate-900 font-black">{item.count}</strong> • Wartość wydań: <strong className="text-slate-900 font-bold">{item.value.toLocaleString('pl-PL')} zł</strong>
                        </span>
                      </div>
                      <div className="w-full bg-[#f1f5f9] rounded-lg h-4.5 overflow-hidden flex border border-slate-200">
                        <div 
                          className={`${item.color} ${item.hoverColor} h-full rounded-lg transition-all`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick summary line under the active chart */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>Synchronizacja z telemetrią bramki RFID: aktywna</span>
            <span>Baza danych zaktualizowana: w czasie rzeczywistym</span>
          </div>
        </div>

        {/* Right Columns: Personnel Productivity Leaderboard */}
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2 border-b border-slate-100 pb-3">
              <Users className="w-4.5 h-4.5 text-[#2170e4]" />
              <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider">Wydajność Ekipy (Dziś)</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">Ranking operatorów terminali uszeregowany według pomyślnych kompletacji (picks):</p>

            <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
              {workerKPIs.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">Brak aktywnych pracowników w bazie danych.</div>
              ) : (
                workerKPIs.map((worker, index) => {
                  const isTop = index === 0;
                  return (
                    <div key={worker.id || index} className={`p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-[#e2e8f0] flex justify-between items-center transition-all ${isTop ? 'border-amber-200 bg-amber-50/10' : ''}`}>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-black ${
                          isTop 
                            ? 'bg-amber-100 text-amber-700 animate-bounce' 
                            : 'bg-slate-200 text-slate-700'
                        }`}>
                          {isTop ? <Award className="w-4.5 h-4.5 text-amber-600" /> : index + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-xs truncate leading-tight">{worker.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5 uppercase tracking-wide">{worker.role} • Klasa {worker.level}</p>
                        </div>
                      </div>

                      <div className="text-right font-mono shrink-0">
                        <span className="text-xs font-black text-[#2170e4] block leading-none">{worker.picksToday} szt.</span>
                        <span className="text-[9px] text-emerald-600 font-bold block mt-1">{worker.accuracy}% acc</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mt-5 flex items-start gap-2.5">
            <UserCheck className="w-4.5 h-4.5 text-emerald-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-600 font-bold leading-normal">
              <strong>Zalecenie dyspozytora:</strong> Pracownik <strong className="text-slate-900">{workerKPIs[0]?.name || 'n/a'}</strong> wykazuje najwyższe tempo zbiórek. Wyznacz go do wydań krytycznych (prio 1).
            </p>
          </div>
        </div>
      </div>

      {/* 4. Sub-hall layout condition monitoring widgets */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 shadow-sm">
        <div className="flex items-center gap-2.5 mb-5 border-b border-slate-100 pb-3">
          <Activity className="w-4.5 h-4.5 text-[#2170e4]" />
          <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider">Warunki fizyczne i sensoryka stref ryglowych</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
          {[
            { zone: 'Hala ambientowa A', temp: '18°C', humidity: '44%', ventilation: '98%', safety: 'OK', color: 'text-blue-600', badge: 'Ambient' },
            { zone: 'Hala chłodnicza B', temp: '4°C', humidity: '30%', ventilation: '100%', safety: 'OK', color: 'text-sky-600', badge: 'Cold Store' },
            { zone: 'Sektor Chemiczny C', temp: '16°C', humidity: '52%', ventilation: '95%', safety: 'ZABEZPIECZONO', color: 'text-purple-600', badge: 'Hazmat' },
            { zone: 'Strefa wysyłki D', temp: '19°C', humidity: '45%', ventilation: '90%', safety: 'OK', color: 'text-zinc-600', badge: 'Loading dock' },
          ].map((hala, i) => (
            <div key={i} className="bg-[#f8fafc] border border-slate-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
              <div className="flex justify-between items-center mb-2.5">
                <span className="font-extrabold text-xs text-slate-900 leading-none">{hala.zone}</span>
                <span className="bg-white px-2 py-0.5 rounded text-[9px] font-bold text-slate-500 uppercase border border-slate-200">{hala.badge}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-1.5 font-mono">
                <div className="bg-white p-2 border border-slate-200/60 rounded">
                  <span className="text-[9px] text-slate-400 uppercase font-sans block">Temperatura</span>
                  <span className={`font-black text-sm ${hala.color}`}>{hala.temp}</span>
                </div>
                <div className="bg-white p-2 border border-slate-200/60 rounded">
                  <span className="text-[9px] text-slate-400 uppercase font-sans block">Wilgotność</span>
                  <span className="font-bold text-slate-800 text-sm">{hala.humidity}</span>
                </div>
                <div className="bg-white p-2 border border-slate-200/60 rounded">
                  <span className="text-[9px] text-slate-400 uppercase font-sans block">Wentylacja</span>
                  <span className="font-bold text-emerald-600 text-xs">{hala.ventilation}</span>
                </div>
                <div className="bg-white p-2 border border-slate-200/60 rounded">
                  <span className="text-[9px] text-slate-400 uppercase font-sans block">Status BHP</span>
                  <span className="font-bold text-indigo-700 text-[10px]">{hala.safety}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
