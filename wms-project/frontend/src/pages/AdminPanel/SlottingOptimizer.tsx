import React, { useState, useMemo } from 'react';
import { 
  Combine, BarChart3, ShieldAlert, ArrowRight, Package, 
  LayoutGrid, CheckCircle2, AlertTriangle, RefreshCw, Layers
} from 'lucide-react';
import { Product } from '../../services/inventoryApi';

interface SlottingOptimizerProps {
  products: Product[];
  orders: any[];
  zones: any[];
  onUpdateProductLocation: (sku: string, newLocationCode: string, newZone: string) => Promise<boolean>;
  logActivity: (message: string, type: string, details?: string) => void;
  addToast: (title: string, text: string, type: 'error' | 'warning' | 'info' | 'success') => void;
}

export default function SlottingOptimizer({
  products = [],
  orders = [],
  zones = [],
  onUpdateProductLocation,
  logActivity,
  addToast
}: SlottingOptimizerProps) {
  const [selectedCell, setSelectedCell] = useState<{ abc: string; xyz: string } | null>(null);
  const [relocationTarget, setRelocationTarget] = useState<{
    product: Product;
    currentLoc: string;
    targetLoc: string;
    targetZone: string;
    classStr: string;
  } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // State of locked slots from Storage.tsx config
  const [lockedSlots] = useState<string[]>(() => {
    try {
      const saved = window.localStorage.getItem('wms-locked-slots');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Helper: parse location code
  const parseLocation = (locationCode: string) => {
    const match = String(locationCode || '').match(/^([A-Z]+)-(\d+)-(\d+)-(\d+)$/i);
    if (!match) return { sector: '', aisle: 1, rack: 1, level: 1 };
    return {
      sector: match[1].toUpperCase(),
      aisle: Number(match[2]),
      rack: Number(match[3]),
      level: Number(match[4])
    };
  };

  // 1. ABC/XYZ Classification Algorithm
  const classification = useMemo(() => {
    const freqMap: Record<string, number> = {};
    const qtyListMap: Record<string, number[]> = {};

    // Count order frequency and quantities per SKU
    orders.forEach(order => {
      if (!order.items) return;
      order.items.forEach((item: any) => {
        freqMap[item.sku] = (freqMap[item.sku] || 0) + 1;
        if (!qtyListMap[item.sku]) qtyListMap[item.sku] = [];
        qtyListMap[item.sku].push(item.qty || item.quantity || 1);
      });
    });

    const totalTransactions = Object.values(freqMap).reduce((a, b) => a + b, 0);

    // Sort products by frequency
    const sortedProducts = [...products].sort((a, b) => {
      const fA = freqMap[a.sku] || 0;
      const fB = freqMap[b.sku] || 0;
      return fB - fA;
    });

    let runningSum = 0;
    const abcMap: Record<string, 'A' | 'B' | 'C'> = {};
    const xyzMap: Record<string, 'X' | 'Y' | 'Z'> = {};
    const cvMap: Record<string, number> = {};

    sortedProducts.forEach(prod => {
      const freq = freqMap[prod.sku] || 0;
      runningSum += freq;
      const pct = totalTransactions > 0 ? (runningSum / totalTransactions) * 100 : 100;

      if (freq === 0) {
        abcMap[prod.sku] = 'C';
      } else if (pct <= 70) {
        abcMap[prod.sku] = 'A';
      } else if (pct <= 90) {
        abcMap[prod.sku] = 'B';
      } else {
        abcMap[prod.sku] = 'C';
      }

      // Calculate XYZ based on CV (Coefficient of Variation)
      const qList = qtyListMap[prod.sku] || [];
      if (qList.length <= 1) {
        xyzMap[prod.sku] = 'Z';
        cvMap[prod.sku] = 0;
      } else {
        const mean = qList.reduce((a, b) => a + b, 0) / qList.length;
        const variance = qList.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / qList.length;
        const stdDev = Math.sqrt(variance);
        const cv = mean > 0 ? stdDev / mean : 0;
        cvMap[prod.sku] = parseFloat(cv.toFixed(2));

        if (cv < 0.3) {
          xyzMap[prod.sku] = 'X';
        } else if (cv < 0.7) {
          xyzMap[prod.sku] = 'Y';
        } else {
          xyzMap[prod.sku] = 'Z';
        }
      }
    });

    return { abcMap, xyzMap, cvMap, freqMap };
  }, [products, orders]);

  // 2. Recommend optimal slot helper
  const findOptimalAlternativeSlot = (sku: string, targetClass: 'A' | 'C'): { slot: string; zone: string } | null => {
    const targetSector = targetClass === 'A' ? 'A' : 'C';
    const targetLevels = targetClass === 'A' ? [1, 2] : [4];

    // Try finding in aisles 1..2, racks 1..2, levels, slots 1..3
    for (let aisleNum = 1; aisleNum <= 2; aisleNum++) {
      for (let rackNum = 1; rackNum <= 2; rackNum++) {
        for (let levelNum of targetLevels) {
          for (let slotNum = 1; slotNum <= 3; slotNum++) {
            const slotCode = `${targetSector}-0${aisleNum}-0${rackNum}-0${levelNum}-0${slotNum}`;

            // Ensure slot is not locked (BHP)
            if (lockedSlots.includes(slotCode)) continue;

            // Check if occupied by another product
            const occupied = products.some(p => {
              const loc = parseLocation(p.locationCode);
              const isSameZone = p.zone === `${targetSector}${aisleNum}`;
              const slotIndex = (p.sku.charCodeAt(p.sku.length - 1) % 3) + 1;
              return isSameZone && loc.rack === rackNum && loc.level === levelNum && slotIndex === slotNum;
            });

            if (!occupied) {
              // Convert back to products location code format (SECTOR-AISLE-RACK-LEVEL)
              const productsLocCode = `${targetSector}-0${aisleNum}-0${rackNum}-0${levelNum}`;
              return {
                slot: productsLocCode,
                zone: `${targetSector}${aisleNum}`
              };
            }
          }
        }
      }
    }
    return null;
  };

  // 3. Suboptimal Slotting Detector
  const suboptimalDetections = useMemo(() => {
    const list: Array<{
      product: Product;
      currentLoc: string;
      abcClass: 'A' | 'B' | 'C';
      xyzClass: 'X' | 'Y' | 'Z';
      issue: 'A_in_far_C' | 'A_on_high_level' | 'C_on_ground_level';
      reason: string;
      suggestedLoc: string;
      suggestedZone: string;
    }> = [];

    products.forEach(prod => {
      const abc = classification.abcMap[prod.sku] || 'C';
      const xyz = classification.xyzMap[prod.sku] || 'Z';
      const loc = parseLocation(prod.locationCode);
      const slotIndex = (prod.sku.charCodeAt(prod.sku.length - 1) % 3) + 1;
      const fullLocStr = `${prod.locationCode}-0${slotIndex}`; // Display slot number

      if (abc === 'A') {
        // Class A should not be in sector C or on level 4
        if (loc.sector === 'C') {
          const rec = findOptimalAlternativeSlot(prod.sku, 'A');
          list.push({
            product: prod,
            currentLoc: fullLocStr,
            abcClass: abc,
            xyzClass: xyz,
            issue: 'A_in_far_C',
            reason: 'Towar szybko rotujący (Klasa A) leży w dalekiej strefie C (Hazmat). Przeniesienie skróci czas zbiórki.',
            suggestedLoc: rec ? `${rec.slot}-0${slotIndex}` : 'A-01-01-01-0' + slotIndex,
            suggestedZone: rec ? rec.zone : 'A1'
          });
        } else if (loc.level === 4) {
          const rec = findOptimalAlternativeSlot(prod.sku, 'A');
          list.push({
            product: prod,
            currentLoc: fullLocStr,
            abcClass: abc,
            xyzClass: xyz,
            issue: 'A_on_high_level',
            reason: 'Towar szybko rotujący (Klasa A) umieszczony na najwyższym poziomie P4. Wymaga wózka wysokiego składowania.',
            suggestedLoc: rec ? `${rec.slot}-0${slotIndex}` : 'A-01-01-01-0' + slotIndex,
            suggestedZone: rec ? rec.zone : 'A1'
          });
        }
      } else if (abc === 'C') {
        // Class C should not be in sector A level 1
        if (loc.sector === 'A' && loc.level === 1) {
          const rec = findOptimalAlternativeSlot(prod.sku, 'C');
          list.push({
            product: prod,
            currentLoc: fullLocStr,
            abcClass: abc,
            xyzClass: xyz,
            issue: 'C_on_ground_level',
            reason: 'Towar wolno rotujący (Klasa C) zajmuje najbardziej ergonomiczny parter (P1) w Sektorze A. Blokuje miejsce dla klasy A.',
            suggestedLoc: rec ? `${rec.slot}-0${slotIndex}` : 'C-01-01-04-0' + slotIndex,
            suggestedZone: rec ? rec.zone : 'C1'
          });
        }
      }
    });

    return list;
  }, [products, classification]);

  // 4. Matrix distribution count
  const matrixCounts = useMemo(() => {
    const counts: Record<string, number> = {
      AX: 0, AY: 0, AZ: 0,
      BX: 0, BY: 0, BZ: 0,
      CX: 0, CY: 0, CZ: 0
    };

    products.forEach(p => {
      const abc = classification.abcMap[p.sku] || 'C';
      const xyz = classification.xyzMap[p.sku] || 'Z';
      counts[`${abc}${xyz}`] = (counts[`${abc}${xyz}`] || 0) + 1;
    });

    return counts;
  }, [products, classification]);

  // Handle relocation execution
  const executeRelocation = async () => {
    if (!relocationTarget) return;

    setIsUpdating(true);
    // Remove the slot suffix from suggestedLoc for WMS db compatibility (needs SECTOR-AISLE-RACK-LEVEL)
    const cleanedLocationCode = relocationTarget.targetLoc.replace(/-\d+$/, '');
    
    const success = await onUpdateProductLocation(
      relocationTarget.product.sku, 
      cleanedLocationCode, 
      relocationTarget.targetZone
    );

    if (success) {
      logActivity(
        `Zakończono relokację optymalizacyjną SKU ${relocationTarget.product.sku}`,
        'relocate',
        `Przeniesiono z ${relocationTarget.currentLoc} do ${relocationTarget.targetLoc} (Klasa: ${relocationTarget.classStr})`
      );
      addToast(
        'Relokacja zakończona', 
        `Pomyślnie przeniesiono ${relocationTarget.product.sku} na nową lokalizację BHP.`, 
        'success'
      );
      setRelocationTarget(null);
    } else {
      addToast('Błąd zapisu', 'Wystąpił problem przy przenoszeniu produktu w bazie danych.', 'error');
    }
    setIsUpdating(false);
  };

  // Filtered products list based on clicked matrix cell
  const filteredProducts = useMemo(() => {
    if (!selectedCell) return products;
    return products.filter(p => {
      const abc = classification.abcMap[p.sku] || 'C';
      const xyz = classification.xyzMap[p.sku] || 'Z';
      return abc === selectedCell.abc && xyz === selectedCell.xyz;
    });
  }, [products, selectedCell, classification]);

  return (
    <div id="wms-slotting-panel" className="space-y-6 font-sans text-sm text-[#334155] animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
            <Combine className="w-5.5 h-5.5 text-blue-650" /> Optymalizacja Rozmieszczenia Zapasów (Slotting ABC/XYZ)
          </h2>
          <p className="text-xs text-slate-500 mt-1.5 max-w-xl font-sans">
            Analiza statystyczna popytu. System klasyfikuje produkty pod kątem częstotliwości zbiórki (ABC) i stabilności zapotrzebowania (XYZ), wykrywając nieoptymalne ułożenia BHP na regałach.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Matrix and rules */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* ABC/XYZ Matrix */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 select-none">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 border-b border-slate-100 pb-3">
              <BarChart3 className="w-4.5 h-4.5 text-blue-600" />
              Macierz Dystrybucji SKU (ABC / XYZ)
            </h3>
            
            <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
              {/* Corner header */}
              <div className="p-2 font-extrabold text-slate-400 uppercase text-[9px] flex items-center justify-center">ABC \ XYZ</div>
              <div className="p-2 font-bold bg-slate-50 border border-slate-150 rounded text-slate-700">X (Stały)</div>
              <div className="p-2 font-bold bg-slate-50 border border-slate-150 rounded text-slate-700">Y (Zmienny)</div>
              <div className="p-2 font-bold bg-slate-50 border border-slate-150 rounded text-slate-700">Z (Rzadki)</div>

              {/* Row A */}
              <div className="p-2 font-bold bg-slate-100 border border-slate-200 rounded flex items-center justify-center text-slate-800">A (Szybki)</div>
              {(['X', 'Y', 'Z'] as const).map(xyz => {
                const count = matrixCounts[`A${xyz}`] || 0;
                const isSelected = selectedCell?.abc === 'A' && selectedCell?.xyz === xyz;
                return (
                  <div
                    key={`A${xyz}`}
                    onClick={() => setSelectedCell(isSelected ? null : { abc: 'A', xyz })}
                    className={`p-3 rounded-lg border font-mono font-black text-sm cursor-pointer transition-all flex flex-col justify-center items-center ${
                      isSelected 
                        ? 'bg-blue-600 text-white border-transparent ring-2 ring-blue-500/30 scale-102 shadow'
                        : count > 0 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-slate-50/50 text-slate-350 border-slate-150'
                    }`}
                  >
                    <span>{count}</span>
                    <span className="text-[8px] opacity-75 mt-0.5">SKU</span>
                  </div>
                );
              })}

              {/* Row B */}
              <div className="p-2 font-bold bg-slate-100 border border-slate-200 rounded flex items-center justify-center text-slate-800">B (Średni)</div>
              {(['X', 'Y', 'Z'] as const).map(xyz => {
                const count = matrixCounts[`B${xyz}`] || 0;
                const isSelected = selectedCell?.abc === 'B' && selectedCell?.xyz === xyz;
                return (
                  <div
                    key={`B${xyz}`}
                    onClick={() => setSelectedCell(isSelected ? null : { abc: 'B', xyz })}
                    className={`p-3 rounded-lg border font-mono font-black text-sm cursor-pointer transition-all flex flex-col justify-center items-center ${
                      isSelected 
                        ? 'bg-blue-600 text-white border-transparent ring-2 ring-blue-500/30 scale-102 shadow'
                        : count > 0 
                        ? 'bg-amber-50 text-amber-800 border-amber-250 hover:bg-amber-100'
                        : 'bg-slate-50/50 text-slate-350 border-slate-150'
                    }`}
                  >
                    <span>{count}</span>
                    <span className="text-[8px] opacity-75 mt-0.5">SKU</span>
                  </div>
                );
              })}

              {/* Row C */}
              <div className="p-2 font-bold bg-slate-100 border border-slate-200 rounded flex items-center justify-center text-slate-800">C (Wolny)</div>
              {(['X', 'Y', 'Z'] as const).map(xyz => {
                const count = matrixCounts[`C${xyz}`] || 0;
                const isSelected = selectedCell?.abc === 'C' && selectedCell?.xyz === xyz;
                return (
                  <div
                    key={`C${xyz}`}
                    onClick={() => setSelectedCell(isSelected ? null : { abc: 'C', xyz })}
                    className={`p-3 rounded-lg border font-mono font-black text-sm cursor-pointer transition-all flex flex-col justify-center items-center ${
                      isSelected 
                        ? 'bg-blue-600 text-white border-transparent ring-2 ring-blue-500/30 scale-102 shadow'
                        : count > 0 
                        ? 'bg-slate-100 text-slate-700 border-slate-250 hover:bg-slate-200'
                        : 'bg-slate-50/50 text-slate-350 border-slate-150'
                    }`}
                  >
                    <span>{count}</span>
                    <span className="text-[8px] opacity-75 mt-0.5">SKU</span>
                  </div>
                );
              })}
            </div>

            {selectedCell && (
              <div className="flex justify-between items-center text-xs bg-blue-50 border border-blue-200 text-blue-800 p-2.5 rounded-lg animate-in slide-in-from-top-1 duration-100">
                <span>Wybrano filtr: <span className="font-bold">Klasa {selectedCell.abc}{selectedCell.xyz}</span> ({filteredProducts.length} SKU)</span>
                <button 
                  onClick={() => setSelectedCell(null)}
                  className="font-bold hover:text-blue-950 border-none bg-transparent cursor-pointer text-[10px] uppercase"
                >
                  Wyczyść
                </button>
              </div>
            )}
          </div>

          {/* Slotting Rules Description */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm space-y-3.5 select-none text-xs">
            <h4 className="font-extrabold text-slate-800 uppercase tracking-wider text-[10px]">Zasady Rozlokowania Zapasów</h4>
            <div className="space-y-3 font-sans leading-relaxed text-slate-600">
              <div className="flex gap-2">
                <span className="font-black text-blue-650 shrink-0">ABC:</span>
                <span>Analizuje liczbę transakcji wydań (częstotliwość kompletacji). Produkty z klasy A (70% zlecanych wydań) muszą znajdować się jak najbliżej pakowalni, aby skrócić trasy.</span>
              </div>
              <div className="flex gap-2">
                <span className="font-black text-blue-650 shrink-0">XYZ:</span>
                <span>Analizuje wariancję ilościową (współczynnik zmienności CV). Klasa X (niska zmienność) charakteryzuje się stabilnym popytem, podczas gdy klasa Z to rzadkie, nieregularne piki.</span>
              </div>
              <div className="flex gap-2">
                <span className="font-black text-rose-600 shrink-0">BHP:</span>
                <span>Szybko rotujące towary (A) nie mogą być na najwyższym poziomie regałów (P4) ze względu na konieczność użycia reach-trucka ani w strefach odległych (sektory C).</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Suboptimal Detections & Relocations list */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 flex flex-col h-[480px]">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <ShieldAlert className="w-4.5 h-4.5 text-rose-500" />
                Detektor Nieoptymalnych Lokalizacji BHP
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-sans">
                Wykryte niezgodności BHP i ergonomii w strefach składowania. Wygeneruj relokacje, aby przenieść towary na optymalne półki.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
              {suboptimalDetections.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center select-none bg-slate-50 rounded-xl border border-dashed border-slate-200 h-full">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                  <span className="text-xs font-bold text-slate-700 mt-2">Układ magazynu optymalny</span>
                  <span className="text-[10px] text-slate-400 mt-1 max-w-xs">Wszystkie produkty o szybkiej i wolnej rotacji są rozmieszczone zgodnie z regułami BHP i logistyki.</span>
                </div>
              ) : (
                suboptimalDetections.map(det => {
                  const classStr = `${det.abcClass}${det.xyzClass}`;
                  return (
                    <div 
                      key={det.product.sku} 
                      className="p-3.5 bg-rose-50/30 border border-rose-200/70 rounded-xl flex items-start justify-between gap-3 text-xs shadow-inner animate-in fade-in duration-100"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 select-none">
                          <span className="font-mono font-bold text-slate-900 bg-white border px-1.5 py-0.5 rounded shadow-sm shrink-0">{det.product.sku}</span>
                          <span className="font-extrabold px-1.5 py-0.5 bg-rose-100 text-rose-700 border border-rose-200 rounded text-[9.5px] uppercase shrink-0">
                            Klasa {classStr}
                          </span>
                        </div>
                        <p className="font-sans font-bold text-slate-800 truncate">{det.product.name}</p>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-550 select-none">
                          <span className="font-mono text-slate-450">Obecnie:</span>
                          <span className="font-mono font-bold text-rose-700 bg-rose-50 px-1 rounded">{det.currentLoc}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span className="font-mono text-slate-450">Rekomendacja WMS:</span>
                          <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1 rounded">{det.suggestedLoc}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-sans leading-relaxed">{det.reason}</p>
                      </div>

                      <button
                        onClick={() => setRelocationTarget({
                          product: det.product,
                          currentLoc: det.currentLoc,
                          targetLoc: det.suggestedLoc,
                          targetZone: det.suggestedZone,
                          classStr
                        })}
                        className="h-8 px-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded font-bold text-[10px] transition-colors cursor-pointer border-none shadow-sm whitespace-nowrap self-center"
                      >
                        Relokuj
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filtered Products Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
          <Package className="w-4.5 h-4.5 text-blue-600" />
          Katalog Zapasów z Klasyfikacją dynamiczną
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 text-[10px] font-extrabold uppercase select-none">
                <th className="py-2.5 px-3">SKU</th>
                <th className="py-2.5 px-3">Nazwa produktu</th>
                <th className="py-2.5 px-3">Klasa ABC/XYZ</th>
                <th className="py-2.5 px-3">Lokalizacja WMS</th>
                <th className="py-2.5 px-3 text-center">Liczba wydań</th>
                <th className="py-2.5 px-3 text-right">Zapas</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(p => {
                const abc = classification.abcMap[p.sku] || 'C';
                const xyz = classification.xyzMap[p.sku] || 'Z';
                const freq = classification.freqMap[p.sku] || 0;
                const slotIndex = (p.sku.charCodeAt(p.sku.length - 1) % 3) + 1;
                return (
                  <tr key={p.sku} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors text-xs font-semibold">
                    <td className="py-2.5 px-3">
                      <span className="font-mono font-bold text-slate-800">{p.sku}</span>
                    </td>
                    <td className="py-2.5 px-3 font-sans font-medium text-slate-650">{p.name}</td>
                    <td className="py-2.5 px-3 select-none">
                      <span className={`px-2 py-0.5 rounded text-[9.5px] font-extrabold border ${
                        abc === 'A' 
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                          : abc === 'B' 
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                        {abc}{xyz}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-500">
                      {p.locationCode}-0{slotIndex}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">
                      {freq}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{p.stock} szt.</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Confirm Relocation */}
      {relocationTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-[9px] font-extrabold text-blue-650 uppercase tracking-widest block">Potwierdzenie Relokacji WMS</span>
                <h3 className="text-base font-extrabold text-slate-900">Przemieszczenie: {relocationTarget.product.sku}</h3>
              </div>
              <button 
                onClick={() => setRelocationTarget(null)}
                className="text-slate-400 hover:text-slate-600 text-lg border-none bg-transparent cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              <p className="font-sans font-bold text-slate-800">{relocationTarget.product.name}</p>

              <div className="grid grid-cols-2 gap-4 select-none">
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-center">
                  <span className="text-[9px] text-rose-500 font-bold uppercase block mb-1">Z LOKALIZACJI</span>
                  <span className="font-mono font-black text-rose-800 text-xs">{relocationTarget.currentLoc}</span>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                  <span className="text-[9px] text-emerald-500 font-bold uppercase block mb-1">DO LOKALIZACJI (BHP)</span>
                  <span className="font-mono font-black text-emerald-800 text-xs">{relocationTarget.targetLoc}</span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-[11px] leading-relaxed text-slate-550 select-none">
                <span className="font-bold text-slate-700 block mb-0.5">Uzasadnienie zlecenia:</span>
                Przeniesienie szybko rotującego produktu klasy <span className="font-bold text-slate-800">{relocationTarget.classStr}</span> na niski poziom/ergonomiczną strefę pozwoli na skrócenie czasów pobierania (Pick Time) na terminalach zbieraczy.
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setRelocationTarget(null)}
                className="h-9 px-4 border border-slate-300 hover:bg-slate-50 text-slate-650 rounded-lg font-bold text-xs cursor-pointer bg-white"
                disabled={isUpdating}
              >
                Anuluj
              </button>
              <button
                onClick={executeRelocation}
                className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs cursor-pointer border-none shadow flex items-center gap-1.5 disabled:opacity-50"
                disabled={isUpdating}
              >
                {isUpdating ? 'Zapisywanie...' : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    Zatwierdź i Relokuj w WMS
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
