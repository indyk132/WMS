import React, { useState, useMemo } from 'react';
import { 
  Shrink, Layers, RefreshCw, AlertTriangle, CheckCircle2, 
  MapPin, ArrowRight, Activity, Percent, Database
} from 'lucide-react';
import { Product } from '../../services/inventoryApi';
import { sounds } from '../../components/SoundEffects';

interface SpaceCompactorProps {
  products: Product[];
  zones: any[];
  onConsolidateStock: (sku: string, sourceLoc: string, targetLoc: string, qty: number, targetZone: string) => Promise<boolean>;
  logActivity: (message: string, type: string, details?: string) => void;
  addToast: (title: string, text: string, type: 'error' | 'warning' | 'info' | 'success') => void;
}

export default function SpaceCompactor({
  products = [],
  zones = [],
  onConsolidateStock,
  logActivity,
  addToast
}: SpaceCompactorProps) {
  const [selectedConsolidation, setSelectedConsolidation] = useState<{
    product: Product;
    sourceLoc: string;
    targetLoc: string;
    qty: number;
    targetZone: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Read sound settings from local WMS config
  const isSoundEnabled = () => {
    return window.localStorage.getItem('wms-sound-enabled') !== 'false';
  };

  // 1. Calculations: Fragmentation and reclaimed slots
  const stats = useMemo(() => {
    const totalCount = products.length;
    const fragmentedProducts = products.filter(p => p.stockEntries && p.stockEntries.length > 1);
    const fragmentedCount = fragmentedProducts.length;
    const fragmentationRate = totalCount > 0 ? (fragmentedCount / totalCount) * 100 : 0;

    // Number of reclaimable slots is the sum of (number of entries - 1) for all fragmented products
    const reclaimableSlots = fragmentedProducts.reduce((sum, p) => sum + (p.stockEntries.length - 1), 0);

    return {
      totalCount,
      fragmentedCount,
      fragmentationRate: parseFloat(fragmentationRate.toFixed(1)),
      reclaimableSlots
    };
  }, [products]);

  // 2. Generate suggested consolidation tasks
  const suggestedConsolidations = useMemo(() => {
    const suggestions: Array<{
      product: Product;
      sourceLoc: string;
      sourceQty: number;
      targetLoc: string;
      targetQty: number;
      targetZone: string;
      saving: number; // slots saved (usually 1 per task)
    }> = [];

    products.forEach(p => {
      if (p.stockEntries && p.stockEntries.length > 1) {
        // Sort stock entries descending by quantity. 
        // We will consolidate EVERYTHING into the entry with the LARGEST stock quantity.
        const sortedEntries = [...p.stockEntries].sort((a, b) => b.quantity - a.quantity);
        const targetEntry = sortedEntries[0]; // Target location (has largest stock)

        // All other entries are source entries to merge into target
        for (let i = 1; i < sortedEntries.length; i++) {
          const sourceEntry = sortedEntries[i];
          
          // Determine target zone: first two characters of locationCode (e.g. A-01 -> A1)
          const zoneMatch = targetEntry.locationCode.match(/^([A-Z]+)-0?(\d+)/i);
          const targetZone = zoneMatch ? `${zoneMatch[1].toUpperCase()}${Number(zoneMatch[2])}` : 'A1';

          suggestions.push({
            product: p,
            sourceLoc: sourceEntry.locationCode,
            sourceQty: sourceEntry.quantity,
            targetLoc: targetEntry.locationCode,
            targetQty: targetEntry.quantity,
            targetZone,
            saving: 1
          });
        }
      }
    });

    return suggestions;
  }, [products]);

  // 3. Zone Occupancy calculations
  const zoneOccupancy = useMemo(() => {
    const counts: Record<string, number> = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 };
    // Nominal capacity is 24 slots per aisle (each aisle has 2 racks * 4 levels * 3 slots)
    const nominalCapacity = 24;

    products.forEach(p => {
      if (p.stockEntries) {
        p.stockEntries.forEach(entry => {
          const zoneMatch = entry.locationCode.match(/^([A-Z]+)-0?(\d+)/i);
          if (zoneMatch) {
            const z = `${zoneMatch[1].toUpperCase()}${Number(zoneMatch[2])}`;
            if (counts[z] !== undefined) {
              counts[z]++;
            }
          }
        });
      }
    });

    return Object.entries(counts).map(([name, used]) => {
      const pct = Math.min(100, (used / nominalCapacity) * 100);
      return {
        name,
        used,
        total: nominalCapacity,
        percentage: parseFloat(pct.toFixed(0))
      };
    });
  }, [products]);

  // 4. Execute consolidation in WMS
  const handleExecuteConsolidation = async () => {
    if (!selectedConsolidation) return;
    setIsProcessing(true);

    const { product, sourceLoc, targetLoc, qty, targetZone } = selectedConsolidation;
    const success = await onConsolidateStock(product.sku, sourceLoc, targetLoc, qty, targetZone);

    if (success) {
      logActivity(
        `Wykonano konsolidację zapasów SKU ${product.sku}`,
        'relocate',
        `Połączono ${qty} szt. z lokalizacji ${sourceLoc} do ${targetLoc} (Zwolniono gniazdo ${sourceLoc})`
      );

      if (isSoundEnabled()) {
        sounds.playSuccess();
      }

      addToast(
        'Konsolidacja zakończona', 
        `Pomyślnie scalono zapas produktu w gnieździe ${targetLoc}.`, 
        'success'
      );
      setSelectedConsolidation(null);
    } else {
      addToast('Błąd zapisu', 'Wystąpił problem przy scalaniu zapasów w bazie danych.', 'error');
    }
    setIsProcessing(false);
  };

  return (
    <div id="wms-compactor-panel" className="space-y-6 font-sans text-sm text-[#334155] animate-fadeIn pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
            <Shrink className="w-5.5 h-5.5 text-blue-650" /> Kompaktor i Konsolidator Regałów (Space Optimizer)
          </h2>
          <p className="text-xs text-slate-500 mt-1.5 max-w-xl font-sans">
            Konsolidacja zapasów. System analizuje rozproszone stany magazynowe tego samego SKU w wielu lokalizacjach i generuje zlecenia relokacji w celu uwolnienia pustych gniazd.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        <div className="bg-white border border-slate-200 rounded-xl p-4.5 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase select-none">Współczynnik fragmentacji</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 font-mono">{stats.fragmentationRate}%</span>
              <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded">Split Stock</span>
            </div>
            <span className="text-[10px] text-slate-450 block">Odsetek SKU leżących w $\ge$ 2 lokalizacjach.</span>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <Percent className="w-6 h-6 stroke-1.5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4.5 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase select-none">Miejsca do odzyskania</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 font-mono">{stats.reclaimableSlots}</span>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">Reclaimable</span>
            </div>
            <span className="text-[10px] text-slate-450 block">Potencjalnie wolne gniazda po konsolidacji.</span>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <Layers className="w-6 h-6 stroke-1.5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4.5 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase select-none">Skanowane SKU</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-blue-700 font-mono">{stats.totalCount}</span>
              <span className="text-xs font-extrabold text-blue-600">SKU</span>
            </div>
            <span className="text-[10px] text-slate-450 block">Łączna liczba zarejestrowanych produktów.</span>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
            <Database className="w-6 h-6 stroke-1.5" />
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: List of suggested consolidations */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Activity className="w-4.5 h-4.5 text-blue-600" />
              Sugerowane Zadania Konsolidacji Miejsc
            </h3>
            <p className="text-xs text-slate-500 mt-1 font-sans">
              Algorytm wykrył rozproszone zapasy. Zleć relokację, aby scalić zapasy w jedną lokalizację regałową i zwolnić gniazdo.
            </p>
          </div>

          <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
            {suggestedConsolidations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center select-none bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                <span className="text-xs font-bold text-slate-700 mt-2">Brak fragmentacji zapasów</span>
                <span className="text-[10px] text-slate-450 mt-1 max-w-xs leading-normal">
                  Układ regałów jest maksymalnie skondensowany. Żadne SKU nie leży niepotrzebnie w wielu lokalizacjach.
                </span>
              </div>
            ) : (
              suggestedConsolidations.map((sug, idx) => (
                <div 
                  key={`${sug.product.sku}-${sug.sourceLoc}-${idx}`}
                  className="p-3.5 bg-blue-50/20 border border-slate-200/80 rounded-xl flex items-start justify-between gap-3 text-xs shadow-inner animate-in fade-in duration-100"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 select-none">
                      <span className="font-mono font-bold text-slate-900 bg-white border px-1.5 py-0.5 rounded shadow-sm shrink-0">
                        {sug.product.sku}
                      </span>
                      <span className="font-extrabold px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[9.5px] uppercase shrink-0">
                        Fragmentacja
                      </span>
                    </div>
                    <p className="font-sans font-bold text-slate-800 truncate">{sug.product.name}</p>
                    
                    <div className="flex items-center gap-2 text-[10px] text-slate-550 select-none">
                      <span className="font-mono text-slate-450">Przenieś:</span>
                      <span className="font-mono font-black text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-100">
                        {sug.sourceQty} szt. z {sug.sourceLoc}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono text-slate-450">Scal do:</span>
                      <span className="font-mono font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100">
                        {sug.targetLoc} (aktualnie {sug.targetQty} szt.)
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedConsolidation({
                      product: sug.product,
                      sourceLoc: sug.sourceLoc,
                      targetLoc: sug.targetLoc,
                      qty: sug.sourceQty,
                      targetZone: sug.targetZone
                    })}
                    className="h-8 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded font-bold text-[10px] transition-colors cursor-pointer border-none shadow whitespace-nowrap self-center active:scale-[0.97]"
                  >
                    Konsoliduj
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Zone Occupancy Statistics */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 border-b border-slate-100 pb-3 select-none">
              <MapPin className="w-4.5 h-4.5 text-blue-600" />
              Zapełnienie Regałów według Stref
            </h3>
            <p className="text-xs text-slate-500 mt-1 font-sans">
              Procentowy stopień zajętości slotów nominalnych w poszczególnych alejkach WMS.
            </p>
          </div>

          <div className="space-y-4 pt-1 select-none">
            {zoneOccupancy.map(zone => {
              // Color helper
              const isHigh = zone.percentage > 85;
              const isMedium = zone.percentage > 50;
              const barColor = isHigh ? 'bg-rose-500' : isMedium ? 'bg-amber-500' : 'bg-blue-600';
              const badgeColor = isHigh ? 'bg-rose-50 text-rose-700 border-rose-250' : isMedium ? 'bg-amber-50 text-amber-800 border-amber-250' : 'bg-blue-50 text-blue-700 border-blue-200';

              return (
                <div key={zone.name} className="space-y-1 text-xs">
                  <div className="flex justify-between items-center font-bold">
                    <span className="font-mono text-slate-800 uppercase">Strefa {zone.name}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] border ${badgeColor}`}>
                      {zone.percentage}% ({zone.used} / {zone.total} slotów)
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-150 shadow-inner">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`} 
                      style={{ width: `${zone.percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Modal: Confirm Consolidation */}
      {selectedConsolidation && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-[9px] font-extrabold text-blue-650 uppercase tracking-widest block">Execute Stock Consolidation</span>
                <h3 className="text-base font-extrabold text-slate-900">Potwierdzenie Relokacji Scalającej</h3>
              </div>
              <button 
                onClick={() => setSelectedConsolidation(null)}
                className="text-slate-400 hover:text-slate-600 text-lg border-none bg-transparent cursor-pointer font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <span className="font-mono font-bold text-slate-900 bg-slate-150 px-1.5 py-0.5 rounded shadow-sm">
                  {selectedConsolidation.product.sku}
                </span>
                <p className="font-sans font-bold text-slate-800 mt-1.5">{selectedConsolidation.product.name}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 select-none text-center">
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
                  <span className="text-[9px] text-rose-500 font-bold uppercase block mb-1">Z LOKALIZACJI</span>
                  <span className="font-mono font-black text-rose-800 block text-xs">{selectedConsolidation.sourceLoc}</span>
                  <span className="text-[10px] text-slate-450 mt-1 block">Zapas: {selectedConsolidation.qty} szt.</span>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                  <span className="text-[9px] text-emerald-500 font-bold uppercase block mb-1">DO LOKALIZACJI</span>
                  <span className="font-mono font-black text-emerald-800 block text-xs">{selectedConsolidation.targetLoc}</span>
                  <span className="text-[10px] text-slate-450 mt-1 block">Scal do tego gniazda</span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-[11px] leading-relaxed text-slate-550 select-none">
                <span className="font-bold text-slate-705 block mb-0.5">BHP / Logistyka:</span>
                Zatwierdzenie relokacji przeniesie całe zapasy z gniazda źródłowego do docelowego. Lokalizacja <span className="font-bold text-rose-700">{selectedConsolidation.sourceLoc}</span> zostanie w pełni zwolniona i oznaczona w systemie jako pusta, gotowa do przyjęcia nowego towaru.
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedConsolidation(null)}
                className="h-9 px-4 border border-slate-300 hover:bg-slate-50 text-slate-650 rounded-lg font-bold text-xs cursor-pointer bg-white"
                disabled={isProcessing}
              >
                Anuluj
              </button>
              <button
                onClick={handleExecuteConsolidation}
                className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs cursor-pointer border-none shadow flex items-center gap-1.5 disabled:opacity-50 active:scale-[0.98]"
                disabled={isProcessing}
              >
                {isProcessing ? 'Zapisywanie...' : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    Zatwierdź i Scal Zapas
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
