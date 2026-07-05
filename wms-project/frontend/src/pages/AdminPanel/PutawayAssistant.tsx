import React, { useState, useMemo, useEffect } from 'react';
import { 
  CornerDownRight, Sparkles, AlertTriangle, CheckCircle2, 
  MapPin, Scale, ChevronRight, Boxes, Clock, ArrowRight, Save
} from 'lucide-react';
import { Product } from '../../services/inventoryApi';
import { sounds } from '../../components/SoundEffects';

interface PutawayAssistantProps {
  products: Product[];
  purchaseOrders: any[];
  onUpdateProductLocation: (sku: string, newLocationCode: string, newZone: string) => Promise<boolean>;
  logActivity: (message: string, type: string, details?: string) => void;
  addToast: (title: string, text: string, type: 'error' | 'warning' | 'info' | 'success') => void;
}

interface PutawayItem {
  product: Product;
  sku: string;
  name: string;
  category: string;
  weightKg: number;
  qtyToPlace: number;
  currentLoc: string;
  suggestedLoc: string;
  suggestedZone: string;
  reason: string;
}

export default function PutawayAssistant({
  products = [],
  purchaseOrders = [],
  onUpdateProductLocation,
  logActivity,
  addToast
}: PutawayAssistantProps) {
  const [isProcessing, setIsProcessing] = useState<Record<string, boolean>>({});
  const [customLocations, setCustomLocations] = useState<Record<string, string>>({});

  // Helper to generate deterministic properties (weight, quantity) from SKU hash for realism
  const getSkuHash = (sku: string) => {
    let hash = 0;
    for (let i = 0; i < sku.length; i++) {
      hash = sku.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  };

  // 1. Identify SKU items that are currently in receiving zones
  const putawayItems = useMemo(() => {
    const list: PutawayItem[] = [];

    // Filter products whose location indicates receiving dock, OR
    // mock a fallback list of first 5 products to guarantee interactive data
    const receivingProducts = products.filter(p => 
      !p.locationCode || 
      p.locationCode.startsWith('DOCK') || 
      p.locationCode.includes('PRZYJEC') || 
      p.locationCode === 'UNASSIGNED'
    );

    const candidates = receivingProducts.length >= 3 ? receivingProducts : products.slice(0, 5);

    candidates.forEach(p => {
      const hash = getSkuHash(p.sku);
      // Weight: 3kg to 28kg
      const weightKg = (hash % 26) + 3;
      // Quantity received in PO: 10 to 60 pcs
      const qtyToPlace = (hash % 50) + 10;
      
      const currentLoc = p.locationCode && p.locationCode !== 'UNASSIGNED' ? p.locationCode : 'DOCK-RECEIVING-1';

      // Zoning logic based on category and weight (BHP level rule)
      let sector = 'A'; // default (Electronics / Accessories)
      const cat = (p.category || '').toLowerCase();
      if (cat.includes('części') || cat.includes('samochodowe') || cat.includes('motoryzacja')) {
        sector = 'C';
      } else if (cat.includes('opony') || cat.includes('gumowe') || cat.includes('chemia')) {
        sector = 'B';
      }

      // Level logic: Heavy items (>= 15kg) must go to Level 1 (ground)
      const isHeavy = weightKg >= 15;
      const level = isHeavy ? '01' : `0${(hash % 3) + 2}`; // Level 2, 3 or 4

      const aisle = `0${(hash % 2) + 1}`; // 01 or 02
      const bay = `0${(hash % 3) + 1}`; // 01, 02, or 03

      const suggestedLoc = `${sector}-${aisle}-${bay}-${level}-01`;
      const suggestedZone = `${sector}${(hash % 2) + 1}`;

      // Build explanation reason
      const reason = `${isHeavy ? 'Ciężki towar (BHP - Poziom 1)' : 'Lekki towar (Poziom górny)'}, Sektor ${sector} (${p.category || 'Kategoria ogólna'})`;

      list.push({
        product: p,
        sku: p.sku,
        name: p.name,
        category: p.category || 'Ogólna',
        weightKg,
        qtyToPlace,
        currentLoc,
        suggestedLoc,
        suggestedZone,
        reason
      });
    });

    return list;
  }, [products]);

  // 2. Initialize inputs for custom overrides
  useEffect(() => {
    const initialOverrides: Record<string, string> = {};
    putawayItems.forEach(item => {
      initialOverrides[item.sku] = item.suggestedLoc;
    });
    setCustomLocations(prev => ({ ...prev, ...initialOverrides }));
  }, [putawayItems]);

  // 3. Stats calculations
  const stats = useMemo(() => {
    const awaitingCount = putawayItems.length;
    const totalQty = putawayItems.reduce((sum, item) => sum + item.qtyToPlace, 0);
    // Mock dock clearance rate
    const clearanceRate = awaitingCount === 0 ? 100 : Math.round((1 - (awaitingCount / (products.length || 1))) * 100);

    return {
      awaitingCount,
      totalQty,
      clearanceRate
    };
  }, [putawayItems, products]);

  // 4. Execute Putaway placement
  const handleExecutePutaway = async (item: PutawayItem) => {
    const sku = item.sku;
    const targetLoc = (customLocations[sku] || item.suggestedLoc).trim().toUpperCase();
    
    // Validate target location code format: X-XX-XX-XX-XX
    const locPattern = /^[A-Z]-\d{2}-\d{2}-\d{2}-\d{2}$/;
    if (!locPattern.test(targetLoc)) {
      sounds.playError();
      addToast('Niepoprawny format', 'Adres regału musi pasować do formatu WMS (np. C-01-02-01-01).', 'warning');
      return;
    }

    setIsProcessing(prev => ({ ...prev, [sku]: true }));

    // Extract zone code from target location (e.g. C-01... -> C1)
    const sector = targetLoc.charAt(0);
    const targetZone = `${sector}1`; // default zone mapping

    const success = await onUpdateProductLocation(sku, targetLoc, targetZone);

    if (success) {
      logActivity(
        `Rozmieszczono dostawę SKU ${sku} na regał (Dock-to-Stock)`,
        'relocate',
        `Przeniesiono ${item.qtyToPlace} szt. z ${item.currentLoc} do lokalizacji ${targetLoc}. Waga: ${item.weightKg}kg.`
      );

      // Play success audio
      if (window.localStorage.getItem('wms-sound-enabled') !== 'false') {
        sounds.playSuccess();
      }

      addToast(
        'Rozmieszczono towar',
        `Produkt ${sku} został pomyślnie zlokalizowany w gnieździe ${targetLoc}.`,
        'success'
      );
    } else {
      addToast('Błąd zapisu', 'Wystąpił błąd podczas zapisu lokalizacji produktu w WMS.', 'error');
    }

    setIsProcessing(prev => ({ ...prev, [sku]: false }));
  };

  return (
    <div id="wms-putaway-panel" className="space-y-6 font-sans text-sm text-[#334155] animate-fadeIn pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-left">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
            <CornerDownRight className="w-5.5 h-5.5 text-blue-650" /> Asystent Rozmieszczenia Przyjęć (Dock-to-Stock)
          </h2>
          <p className="text-xs text-slate-500 mt-1.5 max-w-xl">
            Sugeruje optymalne lokalizacje na regałach dla świeżo przyjętych towarów z doku w oparciu o kategorię (sektory A/B/C) oraz wagę (BHP: ciężkie produkty na dolnych półkach).
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        <div className="bg-white border border-slate-200 rounded-xl p-4.5 flex items-center justify-between shadow-xs text-left">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase select-none">Oczekuje na regał</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 font-mono">{stats.awaitingCount}</span>
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded">SKU</span>
            </div>
            <span className="text-[10px] text-slate-450 block">Liczba towarów w strefie przyjęć (bufor).</span>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
            <Boxes className="w-6 h-6 stroke-1.5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4.5 flex items-center justify-between shadow-xs text-left">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase select-none">Suma sztuk do ulokowania</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 font-mono">{stats.totalQty}</span>
              <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded">sztuk</span>
            </div>
            <span className="text-[10px] text-slate-450 block">Wolumen fizyczny towaru do przewiezienia.</span>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <Scale className="w-6 h-6 stroke-1.5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4.5 flex items-center justify-between shadow-xs text-left">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase select-none">Oczyszczenie bufora doku</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-700 font-mono">{stats.clearanceRate}%</span>
              <span className="text-xs font-semibold text-emerald-650 bg-emerald-50 px-1.5 py-0.2 rounded">wolne</span>
            </div>
            <span className="text-[10px] text-slate-450 block">Stopień rozlokowania towarów z przyjęć.</span>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <Clock className="w-6 h-6 stroke-1.5" />
          </div>
        </div>

      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        
        <div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 select-none text-left">
            <Sparkles className="w-4.5 h-4.5 text-blue-650" />
            Pozycje oczekujące w strefie przyjęć
          </h3>
          <p className="text-xs text-slate-500 mt-1 text-left">
            Zatwierdź sugerowaną lokację regałową lub wprowadź korektę, aby zapisać zmianę i rozmieścić towar na półkach.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-150 text-[10px] text-slate-400 font-extrabold uppercase select-none">
                <th className="py-2.5 px-3">SKU / Produkt</th>
                <th className="py-2.5 px-3">Waga i Gabaryt</th>
                <th className="py-2.5 px-3">Aktualny bufor</th>
                <th className="py-2.5 px-3">Rekomendacja WMS (BHP / Strefa)</th>
                <th className="py-2.5 px-3 w-44">Docelowy regał</th>
                <th className="py-2.5 px-3 text-center w-28">Akcja</th>
              </tr>
            </thead>
            <tbody>
              {putawayItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-semibold select-none">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                    <span className="text-xs font-bold text-slate-700 mt-2 block">Doki są czyste!</span>
                    <span className="text-[10px] text-slate-450 mt-1 block">Wszystkie przyjęte towary zostały pomyślnie rozmieszczone na regałach.</span>
                  </td>
                </tr>
              ) : (
                putawayItems.map(item => {
                  const isHeavy = item.weightKg >= 15;
                  
                  return (
                    <tr 
                      key={item.sku}
                      className="border-b border-slate-100 text-xs font-semibold hover:bg-slate-50/50 transition-colors"
                    >
                      {/* SKU & Name */}
                      <td className="py-3.5 px-3 text-left">
                        <div className="flex flex-col">
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 inline-block w-fit mb-0.5">{item.sku}</span>
                          <span className="font-sans font-medium text-slate-650 max-w-[180px] truncate" title={item.name}>{item.name}</span>
                        </div>
                      </td>

                      {/* Weight & Category */}
                      <td className="py-3.5 px-3">
                        <div className="flex flex-col text-left gap-1 select-none">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold w-fit flex items-center gap-1 ${
                            isHeavy ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-slate-50 border border-slate-200 text-slate-650'
                          }`}>
                            <Scale className="w-3 h-3" />
                            {item.weightKg} kg {isHeavy ? '(Ciężki)' : ''}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">{item.category}</span>
                        </div>
                      </td>

                      {/* Current buffer location */}
                      <td className="py-3.5 px-3">
                        <div className="flex flex-col text-left select-none">
                          <span className="font-mono text-slate-900 bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded w-fit">{item.currentLoc}</span>
                          <span className="text-[9px] text-slate-400 font-medium mt-1">Ilość: {item.qtyToPlace} szt.</span>
                        </div>
                      </td>

                      {/* Suggestion reason */}
                      <td className="py-3.5 px-3">
                        <div className="flex flex-col text-left select-none gap-1">
                          <div className="flex items-center gap-1">
                            <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">{item.suggestedLoc}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-medium leading-relaxed max-w-[200px]" title={item.reason}>{item.reason}</span>
                        </div>
                      </td>

                      {/* Custom target location override input */}
                      <td className="py-3.5 px-3">
                        <div className="relative">
                          <input
                            type="text"
                            value={customLocations[item.sku] !== undefined ? customLocations[item.sku] : item.suggestedLoc}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCustomLocations(prev => ({ ...prev, [item.sku]: val }));
                            }}
                            placeholder="np. C-01-02-01-01"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none uppercase shadow-inner"
                          />
                        </div>
                      </td>

                      {/* Putaway execute button */}
                      <td className="py-3.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleExecutePutaway(item)}
                          disabled={isProcessing[item.sku]}
                          className="h-8.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded font-bold text-[10px] uppercase tracking-wider transition-colors cursor-pointer border-none shadow active:scale-[0.97] disabled:opacity-50 flex items-center gap-1 mx-auto"
                        >
                          <CornerDownRight className="w-3.5 h-3.5" />
                          {isProcessing[item.sku] ? 'Zapis...' : 'Rozmieść'}
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
  );
}
