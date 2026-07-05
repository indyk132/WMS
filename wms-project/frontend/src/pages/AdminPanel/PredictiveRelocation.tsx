import React, { useState, useMemo } from 'react';
import { 
  Sparkles, TrendingUp, AlertTriangle, ArrowRight, CheckCircle2, 
  MapPin, Clock, BarChart3, HelpCircle, RefreshCw, Zap
} from 'lucide-react';
import { Product } from '../../services/inventoryApi';
import { sounds } from '../../components/SoundEffects';

interface PredictiveRelocationProps {
  products: Product[];
  orders: any[];
  onUpdateProductLocation: (sku: string, newLocationCode: string, newZone: string) => Promise<boolean>;
  logActivity: (message: string, type: string, details?: string) => void;
  addToast: (title: string, text: string, type: 'error' | 'warning' | 'info' | 'success') => void;
}

export default function PredictiveRelocation({
  products = [],
  orders = [],
  onUpdateProductLocation,
  logActivity,
  addToast
}: PredictiveRelocationProps) {
  const [isProcessing, setIsProcessing] = useState<Record<string, boolean>>({});

  // Helper to generate a deterministic hash value from SKU to mock realistic historical sales velocity
  const getSkuHash = (sku: string) => {
    let hash = 0;
    for (let i = 0; i < sku.length; i++) {
      hash = sku.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  };

  // 1. Calculate sales velocity and forecast demand for each SKU
  const skuMetrics = useMemo(() => {
    // Sum units ordered in current orders to add to the baseline
    const orderSums: Record<string, number> = {};
    orders.forEach(o => {
      if (o.items) {
        o.items.forEach((item: any) => {
          if (item.sku) {
            orderSums[item.sku] = (orderSums[item.sku] || 0) + (item.quantity || item.qty || 1);
          }
        });
      }
    });

    return products.map(p => {
      const hash = getSkuHash(p.sku);
      // Base mock sales: 3 to 18 units based on SKU hash
      const baseSales = (hash % 15) + 3;
      const actualSales = orderSums[p.sku] || 0;
      
      const totalUnitsSoldLast14Days = baseSales + actualSales;
      // 7-day forecast demand: (velocity/day) * 7 * seasonalMultiplier
      const forecastedDemand = Math.round((totalUnitsSoldLast14Days / 14) * 7 * 1.4);

      return {
        product: p,
        totalSold: totalUnitsSoldLast14Days,
        forecastedDemand,
      };
    });
  }, [products, orders]);

  // 2. Identify products in slow locations needing relocation
  const recommendations = useMemo(() => {
    const list: Array<{
      product: Product;
      forecastedDemand: number;
      currentLoc: string;
      suggestedLoc: string;
      suggestedZone: string;
      timeSavedSec: number;
    }> = [];

    skuMetrics.forEach(metric => {
      const p = metric.product;
      const loc = p.locationCode || 'UNASSIGNED';
      
      // We look for high demand items (forecast >= 10) currently stored:
      // - On high levels (Level 3 or 4: location code contains -03- or -04-)
      // - OR in Sector B/C (location starts with B- or C-)
      const isHighLevel = loc.includes('-03-') || loc.includes('-04-');
      const isSlowSector = loc.startsWith('B-') || loc.startsWith('C-');

      if (metric.forecastedDemand >= 10 && (isHighLevel || isSlowSector)) {
        const hash = getSkuHash(p.sku);
        // Deterministic target slot in Fast-Pick (Sektor A, level 1)
        const targetAisle = (hash % 3) + 1; // A-01 to A-03
        const targetBay = (hash % 4) + 1; // Bay 1 to 4
        const targetLoc = `A-0${targetAisle}-0${targetBay}-01-01`; // Level 1, position 1
        const targetZone = `A${targetAisle}`;

        // Estimated picker time saved per pick (s): higher level/far sector -> ground strefa A
        let timeSaved = 15; // default base
        if (isHighLevel) timeSaved += 20; // vertical save
        if (isSlowSector) timeSaved += 15; // horizontal save

        // If target slot is already the current slot, skip
        if (loc !== targetLoc) {
          list.push({
            product: p,
            forecastedDemand: metric.forecastedDemand,
            currentLoc: loc,
            suggestedLoc: targetLoc,
            suggestedZone: targetZone,
            timeSavedSec: timeSaved
          });
        }
      }
    });

    return list.sort((a, b) => b.forecastedDemand - a.forecastedDemand);
  }, [skuMetrics]);

  // 3. Overall performance stats
  const kpis = useMemo(() => {
    const totalItems = products.length;
    const totalQualified = recommendations.length;
    const estimatedTimeSavedMin = Math.round(
      recommendations.reduce((sum, item) => sum + (item.timeSavedSec * item.forecastedDemand), 0) / 60
    );

    return {
      totalItems,
      totalQualified,
      estimatedTimeSavedMin
    };
  }, [products, recommendations]);

  // 4. Top 5 forecasted demand vs stock chart data
  const topForecasted = useMemo(() => {
    return [...skuMetrics]
      .sort((a, b) => b.forecastedDemand - a.forecastedDemand)
      .slice(0, 5);
  }, [skuMetrics]);

  // 5. Execute Relocation
  const handleRelocate = async (sku: string, suggestedLoc: string, suggestedZone: string, timeSaved: number, forecast: number) => {
    setIsProcessing(prev => ({ ...prev, [sku]: true }));
    const success = await onUpdateProductLocation(sku, suggestedLoc, suggestedZone);

    if (success) {
      logActivity(
        `Wykonano predykcyjną relokację Fast-Pick dla SKU ${sku}`,
        'relocate',
        `Przeniesiono do strefy szybkiej kompletacji: ${suggestedLoc}. Prognozowany zysk: ${timeSaved}s na pobranie.`
      );

      // Play success chime
      if (window.localStorage.getItem('wms-sound-enabled') !== 'false') {
        sounds.playSuccess();
      }

      addToast(
        'Relokacja zakończona', 
        `Produkt ${sku} został przeniesiony do lokalizacji Fast-Pick: ${suggestedLoc}.`, 
        'success'
      );
    } else {
      addToast('Błąd relokacji', 'Wystąpił problem przy aktualizacji strefy produktu.', 'error');
    }
    setIsProcessing(prev => ({ ...prev, [sku]: false }));
  };

  return (
    <div id="wms-predictive-panel" className="space-y-6 font-sans text-sm text-[#334155] animate-fadeIn pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5.5 h-5.5 text-blue-650" /> Optymalizacja Strefy Szybkiej Kompletacji (Fast-Pick AI)
          </h2>
          <p className="text-xs text-slate-500 mt-1.5 max-w-xl font-sans">
            Predyktywny Asystent Relokacji. System analizuje rotację SKU, przewiduje popyt na kolejne 7 dni i typuje towary o wysokim wolumenie sprzedaży do przeniesienia z regałów wolnych (poziom 3/4) na regały dolne (strefa A, poziom 1).
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        <div className="bg-white border border-slate-200 rounded-xl p-4.5 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase select-none">Prognozowane oszczędności</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 font-mono">~{kpis.estimatedTimeSavedMin}</span>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">min/tydz.</span>
            </div>
            <span className="text-[10px] text-slate-450 block">Czas zaoszczędzony przez zbieraczy na trasie.</span>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <Clock className="w-6 h-6 stroke-1.5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4.5 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase select-none">Produkty do optymalizacji</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 font-mono">{kpis.totalQualified}</span>
              <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded">Fast-Pick Recommendations</span>
            </div>
            <span className="text-[10px] text-slate-450 block">SKU o dużym popycie leżące w trudnych strefach.</span>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <Zap className="w-6 h-6 stroke-1.5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4.5 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase select-none">Wskaźnik popytu</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-blue-700 font-mono">ABC/XYZ</span>
              <span className="text-xs font-extrabold text-blue-650 bg-blue-50 px-1.5 py-0.2 rounded font-sans">Active AI</span>
            </div>
            <span className="text-[10px] text-slate-450 block">Analiza krocząca 14 dni sprzedaży.</span>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
            <TrendingUp className="w-6 h-6 stroke-1.5" />
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Recommendations Table */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 select-none">
              <Sparkles className="w-4.5 h-4.5 text-blue-600" />
              Sugerowane Relokacje do Strefy Fast-Pick
            </h3>
            <p className="text-xs text-slate-500 mt-1 font-sans">
              Zatwierdź relokację, aby system przeniósł towar z poziomu górnego / strefy wolnej na najniższy poziom strefy szybkiej zbiórki (A-01 do A-03).
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-150 text-[10px] text-slate-400 font-extrabold uppercase select-none">
                  <th className="py-2.5 px-3">SKU / Produkt</th>
                  <th className="py-2.5 px-3 text-center">Prognoza 7d</th>
                  <th className="py-2.5 px-3">Obecny regał</th>
                  <th className="py-2.5 px-3">Sugerowany Fast-Pick</th>
                  <th className="py-2.5 px-3 text-right">Zysk czasowy</th>
                  <th className="py-2.5 px-3 text-center w-28">Akcja</th>
                </tr>
              </thead>
              <tbody>
                {recommendations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center select-none text-slate-400">
                      <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                      <span className="text-xs font-bold text-slate-700 mt-2 block">Brak zalecanych relokacji</span>
                      <span className="text-[10px] text-slate-450 mt-1 block">Wszystkie produkty o wysokiej rotacji znajdują się w strefie szybkiego pobierania.</span>
                    </td>
                  </tr>
                ) : (
                  recommendations.map(rec => (
                    <tr 
                      key={rec.product.sku}
                      className="border-b border-slate-100 text-xs font-semibold hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="py-3 px-3">
                        <div className="flex flex-col text-left">
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 inline-block w-fit mb-0.5">{rec.product.sku}</span>
                          <span className="font-sans font-medium text-slate-650 max-w-[180px] truncate" title={rec.product.name}>{rec.product.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-mono font-extrabold text-blue-750 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                          {rec.forecastedDemand} szt.
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">{rec.currentLoc}</span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1">
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">{rec.suggestedLoc}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                        -{rec.timeSavedSec}s / pick
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleRelocate(rec.product.sku, rec.suggestedLoc, rec.suggestedZone, rec.timeSavedSec, rec.forecastedDemand)}
                          disabled={isProcessing[rec.product.sku]}
                          className="h-8.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded font-bold text-[10px] uppercase transition-colors cursor-pointer border-none shadow active:scale-[0.97] disabled:opacity-50"
                        >
                          {isProcessing[rec.product.sku] ? 'Zapis...' : 'Relokuj'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Predictive Demand Chart */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 border-b border-slate-100 pb-3 select-none">
              <BarChart3 className="w-4.5 h-4.5 text-blue-650" />
              Prognoza AI Popytu vs Zapasy (Top 5)
            </h3>
            <p className="text-xs text-slate-500 mt-1 font-sans">
              Porównanie prognozowanego 7-dniowego popytu z aktualnym fizycznym stanem magazynowym.
            </p>
          </div>

          <div className="space-y-4.5 pt-1 select-none">
            {topForecasted.map(item => {
              const stock = item.product.stock;
              const forecast = item.forecastedDemand;
              const isLowStock = stock < forecast;
              const maxVal = Math.max(stock, forecast) || 1;
              const forecastPct = (forecast / maxVal) * 100;
              const stockPct = (stock / maxVal) * 100;

              return (
                <div key={item.product.sku} className="space-y-1.5 text-xs text-left">
                  <div className="flex justify-between items-center font-bold">
                    <span className="font-mono text-slate-800 uppercase">{item.product.sku}</span>
                    {isLowStock && (
                      <span className="px-1.5 py-0.2 bg-rose-50 border border-rose-250 text-[9px] text-rose-700 font-extrabold rounded animate-pulse">
                        RYZYKO BRAKU!
                      </span>
                    )}
                  </div>
                  
                  {/* Forecast bar */}
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                      <span>Prognoza 7d:</span>
                      <span className="font-mono text-blue-650 font-bold">{forecast} szt.</span>
                    </div>
                    <div className="h-1.8 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-650 rounded-full" style={{ width: `${forecastPct}%` }} />
                    </div>
                  </div>

                  {/* Stock bar */}
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                      <span>Aktualny zapas:</span>
                      <span className={`font-mono font-bold ${isLowStock ? 'text-rose-650 font-black' : 'text-slate-650'}`}>{stock} szt.</span>
                    </div>
                    <div className="h-1.8 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${isLowStock ? 'bg-rose-500' : 'bg-slate-500'}`} 
                        style={{ width: `${stockPct}%` }} 
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
