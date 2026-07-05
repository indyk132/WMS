import React, { useState, useMemo, useEffect } from 'react';
import { 
  Tag, Sparkles, Plus, Trash2, Printer, Check, X, 
  MapPin, Archive, Layers, ListFilter, ClipboardCheck, ArrowRight
} from 'lucide-react';
import { Product } from '../../services/inventoryApi';
import { sounds } from '../../components/SoundEffects';

interface LpnItem {
  sku: string;
  name: string;
  qty: number;
}

interface Lpn {
  id: string;
  createdAt: string;
  locationCode: string;
  status: 'Inbound' | 'Stored';
  items: LpnItem[];
}

interface LpnManagerProps {
  products: Product[];
  onUpdateProductLocation: (sku: string, newLocationCode: string, newZone: string) => Promise<boolean>;
  logActivity: (message: string, type: string, details?: string) => void;
  addToast: (title: string, text: string, type: 'error' | 'warning' | 'info' | 'success') => void;
}

export default function LpnManager({
  products = [],
  onUpdateProductLocation,
  logActivity,
  addToast
}: LpnManagerProps) {
  const [lpns, setLpns] = useState<Lpn[]>([]);
  
  // Modals / forms states
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [activeLabelLpn, setActiveLabelLpn] = useState<Lpn | null>(null);
  const [activeRelocLpn, setActiveRelocLpn] = useState<Lpn | null>(null);

  // Creator Form state
  const [creatorItems, setCreatorItems] = useState<LpnItem[]>([]);
  const [selectedSku, setSelectedSku] = useState('');
  const [selectedQty, setSelectedQty] = useState(10);

  // Relocation Form state
  const [relocLocation, setRelocLocation] = useState('');
  const [isRelocating, setIsRelocating] = useState(false);

  // 1. Load LPNs list from localStorage
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('wms-lpn-list');
      if (saved) {
        setLpns(JSON.parse(saved));
      } else {
        // Pre-populate with realistic mock LPNs
        const initialMock: Lpn[] = [
          {
            id: 'LPN-10293',
            createdAt: new Date().toLocaleDateString('pl-PL'),
            locationCode: 'C-01-02-01-01',
            status: 'Stored',
            items: [
              { sku: 'SKU-00810', name: 'Klocki hamulcowe przód (A1)', qty: 25 },
              { sku: 'SKU-00811', name: 'Tarcze hamulcowe wentylowane', qty: 10 }
            ]
          },
          {
            id: 'LPN-10295',
            createdAt: new Date().toLocaleDateString('pl-PL'),
            locationCode: 'DOCK-RECEIVING-1',
            status: 'Inbound',
            items: [
              { sku: 'SKU-00812', name: 'Świece zapłonowe Bosch Platinum', qty: 60 }
            ]
          }
        ];
        setLpns(initialMock);
        window.localStorage.setItem('wms-lpn-list', JSON.stringify(initialMock));
      }
    } catch (e) {
      console.error("Failed to load LPNs:", e);
    }
  }, []);

  const saveLpns = (list: Lpn[]) => {
    setLpns(list);
    window.localStorage.setItem('wms-lpn-list', JSON.stringify(list));
  };

  // 2. Pre-select first SKU product on creator open
  useEffect(() => {
    if (products.length > 0 && !selectedSku) {
      setSelectedSku(products[0].sku);
    }
  }, [products, selectedSku]);

  // 3. Stats KPIs
  const stats = useMemo(() => {
    const totalCount = lpns.length;
    const inboundCount = lpns.filter(l => l.status === 'Inbound').length;
    const storedCount = lpns.filter(l => l.status === 'Stored').length;
    const totalQty = lpns.reduce((sum, l) => 
      sum + l.items.reduce((s, item) => s + item.qty, 0)
    , 0);

    return {
      totalCount,
      inboundCount,
      storedCount,
      totalQty
    };
  }, [lpns]);

  // 4. Add item to creator temporary list
  const handleAddItemToCreator = () => {
    sounds.playBeep();
    if (!selectedSku) return;

    const prod = products.find(p => p.sku === selectedSku);
    if (!prod) return;

    // Check duplicate
    if (creatorItems.some(i => i.sku === selectedSku)) {
      addToast('Produkt już dodany', 'Ten produkt znajduje się już na liście paletowej.', 'warning');
      return;
    }

    const newItem: LpnItem = {
      sku: selectedSku,
      name: prod.name,
      qty: Number(selectedQty) || 10
    };

    setCreatorItems(prev => [...prev, newItem]);
  };

  const handleRemoveItemFromCreator = (sku: string) => {
    sounds.playBeep();
    setCreatorItems(prev => prev.filter(i => i.sku !== sku));
  };

  // 5. Submit Creator and save new LPN
  const handleCreateLpn = (e: React.FormEvent) => {
    e.preventDefault();
    if (creatorItems.length === 0) {
      addToast('Brak pozycji', 'Dodaj przynajmniej jeden produkt na paletę.', 'warning');
      return;
    }

    const newLpn: Lpn = {
      id: `LPN-${Math.floor(100000 + Math.random() * 900000)}`,
      createdAt: new Date().toLocaleDateString('pl-PL'),
      locationCode: 'DOCK-RECEIVING-1',
      status: 'Inbound',
      items: [...creatorItems]
    };

    const updated = [...lpns, newLpn];
    saveLpns(updated);

    logActivity(
      `Utworzono paletę zbiorczą ${newLpn.id} (LPN)`,
      'receive',
      `Powiązano ${creatorItems.length} SKU (łącznie ${creatorItems.reduce((s, i) => s + i.qty, 0)} szt.) w buforze DOCK-RECEIVING-1.`
    );

    sounds.playSuccess();
    addToast('Utworzono paletę LPN', `Zapisano ${newLpn.id} w buforze strefy przyjęć.`, 'success');
    
    // Reset Form
    setCreatorItems([]);
    setIsCreatorOpen(false);
  };

  // 6. Delete LPN
  const handleDeleteLpn = (lpnId: string) => {
    sounds.playBeep();
    const filtered = lpns.filter(l => l.id !== lpnId);
    saveLpns(filtered);

    logActivity(`Rozformowano paletę LPN ${lpnId}`, 'relocate', 'Dane nośnika zbiorczego zostały usunięte z rejestru.');
    addToast('Paleta usunięta', `Rozformowano nośnik ${lpnId}.`, 'info');
  };

  // 7. Execute LPN Putaway / Relocation (Mass updates location of SKUs in WMS products state)
  const handleExecuteRelocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRelocLpn) return;

    const targetLoc = relocLocation.trim().toUpperCase();
    const locPattern = /^[A-Z]-\d{2}-\d{2}-\d{2}-\d{2}$/;
    if (!locPattern.test(targetLoc)) {
      sounds.playError();
      addToast('Niepoprawny format', 'Adres regału musi pasować do formatu WMS (np. C-01-02-01-01).', 'warning');
      return;
    }

    setIsRelocating(true);

    // Extract zone code
    const sector = targetLoc.charAt(0);
    const targetZone = `${sector}1`;

    // Relocate all items on the pallet sequentially in WMS
    let allSucceeded = true;
    for (const item of activeRelocLpn.items) {
      const success = await onUpdateProductLocation(item.sku, targetLoc, targetZone);
      if (!success) allSucceeded = false;
    }

    if (allSucceeded) {
      // Update LPN object status to Stored and update locationCode
      const updated = lpns.map(l => l.id === activeRelocLpn.id ? {
        ...l,
        locationCode: targetLoc,
        status: 'Stored' as const
      } : l);
      saveLpns(updated);

      logActivity(
        `Wykonano relokację palety LPN ${activeRelocLpn.id}`,
        'relocate',
        `Przeniesiono całą paletę do lokalizacji ${targetLoc}. Zaktualizowano stany dla ${activeRelocLpn.items.length} SKU.`
      );

      sounds.playSuccess();
      addToast('Paleta rozlokowana', `Nośnik ${activeRelocLpn.id} przeniesiony do ${targetLoc}.`, 'success');
      setActiveRelocLpn(null);
      setRelocLocation('');
    } else {
      addToast('Błąd relokacji', 'Wystąpił problem podczas zmiany lokalizacji niektórych SKU.', 'error');
    }

    setIsRelocating(false);
  };

  return (
    <div id="wms-lpn-manager" className="space-y-6 font-sans text-sm text-[#334155] animate-fadeIn pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-left">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
            <Tag className="w-5.5 h-5.5 text-blue-650" /> Obsługa Etykiet Zbiorczych Palet (LPN Manager)
          </h2>
          <p className="text-xs text-slate-500 mt-1.5 max-w-xl">
            Twórz jednostki paletowe (License Plate Number) w strefie przyjęć i rozkładaj całą ich zawartość na regałach jednym kliknięciem. Drukuje termiczne etykiety logistyczne z kodem kreskowym.
          </p>
        </div>
        
        <button
          onClick={() => {
            sounds.playBeep();
            setIsCreatorOpen(true);
          }}
          className="h-10 px-4.5 bg-blue-650 hover:bg-blue-755 text-white font-bold text-xs uppercase rounded-lg border-none shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Zbuduj nową paletę LPN
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        
        <div className="bg-white border border-slate-200 rounded-xl p-4.5 flex items-center justify-between shadow-xs text-left">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase select-none">Aktywne palety LPN</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 font-mono">{stats.totalCount}</span>
              <span className="text-xs font-semibold text-blue-650 bg-blue-50 px-1.5 py-0.2 rounded">sztuk</span>
            </div>
            <span className="text-[10px] text-slate-450 block">Łączna liczba zarejestrowanych palet.</span>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
            <Layers className="w-6 h-6 stroke-1.5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4.5 flex items-center justify-between shadow-xs text-left">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase select-none">Bufor Przyjęć (Inbound)</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-700 font-mono">{stats.inboundCount}</span>
              <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded">palet</span>
            </div>
            <span className="text-[10px] text-slate-450 block">Palety czekające na odłożenie z doku.</span>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <Archive className="w-6 h-6 stroke-1.5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4.5 flex items-center justify-between shadow-xs text-left">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase select-none">Zmagazynowane (Stored)</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-700 font-mono">{stats.storedCount}</span>
              <span className="text-xs font-semibold text-emerald-650 bg-emerald-50 px-1.5 py-0.2 rounded">palet</span>
            </div>
            <span className="text-[10px] text-slate-450 block">Palety zlokalizowane w gniazdach.</span>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <ClipboardCheck className="w-6 h-6 stroke-1.5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4.5 flex items-center justify-between shadow-xs text-left">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase select-none">Sztuk na paletach</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 font-mono">{stats.totalQty}</span>
              <span className="text-xs font-semibold text-slate-600 bg-slate-50 px-1.5 py-0.2 rounded">towarów</span>
            </div>
            <span className="text-[10px] text-slate-450 block">Łączny wolumen w nośnikach LPN.</span>
          </div>
          <div className="p-3 bg-slate-100 rounded-xl text-slate-650">
            <ListFilter className="w-6 h-6 stroke-1.5" />
          </div>
        </div>

      </div>

      {/* LPN List Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        
        <div className="text-left select-none">
          <h3 className="font-bold text-slate-900 text-sm">Zarejestrowane jednostki paletowe LPN</h3>
          <p className="text-xs text-slate-500 mt-0.5">Spis nośników zbiorczych. Kliknij „Relokacja”, aby przemieścić całą paletę wraz z zawartością.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-150 text-[10px] text-slate-400 font-extrabold uppercase select-none">
                <th className="py-2.5 px-3">Kod LPN</th>
                <th className="py-2.5 px-3">Data utworzenia</th>
                <th className="py-2.5 px-3">Aktualna lokalizacja</th>
                <th className="py-2.5 px-3">Zawartość palety (SKU)</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-center w-48">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {lpns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-semibold select-none">
                    Brak aktywnych palet LPN w rejestrze. Kliknij przycisk u góry, aby utworzyć pierwszą paletę.
                  </td>
                </tr>
              ) : (
                lpns.map(lpn => {
                  const totalItemsQty = lpn.items.reduce((s, i) => s + i.qty, 0);

                  return (
                    <tr 
                      key={lpn.id}
                      className="border-b border-slate-100 text-xs font-semibold hover:bg-slate-50/50 transition-colors"
                    >
                      {/* LPN Code */}
                      <td className="py-3 px-3">
                        <span className="font-mono font-black text-slate-900 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[11px]">{lpn.id}</span>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-3 text-slate-500 select-none">{lpn.createdAt}</td>

                      {/* Location */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          <span className="font-mono text-slate-900 bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded">{lpn.locationCode}</span>
                        </div>
                      </td>

                      {/* Contents */}
                      <td className="py-3 px-3">
                        <div className="space-y-1.5 text-[11px]">
                          {lpn.items.map(item => (
                            <div key={item.sku} className="flex items-center gap-1.5">
                              <span className="font-mono text-[10px] text-slate-450 border-r pr-1.5">{item.sku}</span>
                              <span className="text-slate-700 truncate max-w-[200px]" title={item.name}>{item.name}</span>
                              <span className="bg-slate-100 text-slate-800 font-extrabold px-1.5 py-0.2 rounded font-mono text-[10px]">{item.qty} szt.</span>
                            </div>
                          ))}
                          <div className="text-[10px] text-slate-400 font-bold border-t border-slate-100 pt-1 select-none">
                            Łącznie: {totalItemsQty} sztuk towaru
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider select-none ${
                          lpn.status === 'Stored' ? 'bg-emerald-50 text-emerald-800 border border-emerald-250' : 'bg-amber-50 text-amber-805 border border-amber-200'
                        }`}>
                          {lpn.status === 'Stored' ? 'Zmagazynowana' : 'Przyjęta (Inbound)'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-2 select-none">
                          <button
                            type="button"
                            onClick={() => {
                              sounds.playBeep();
                              setActiveRelocLpn(lpn);
                            }}
                            className="h-8 px-2.5 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded text-[10px] uppercase transition-colors cursor-pointer bg-white"
                          >
                            Relokacja
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => {
                              sounds.playBeep();
                              setActiveLabelLpn(lpn);
                            }}
                            className="h-8 px-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded transition-colors cursor-pointer bg-white"
                            title="Drukuj etykietę paletową Zebra"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteLpn(lpn.id)}
                            className="h-8 px-2 border border-red-100 hover:bg-red-50 text-red-650 rounded transition-all cursor-pointer bg-white"
                            title="Rozformuj paletę"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* LPN Creator Wizard Modal */}
      {isCreatorOpen && (
        <div className="fixed inset-0 bg-[#0b1329]/65 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleCreateLpn}
            className="bg-white border border-slate-250 rounded-2xl w-full max-w-lg shadow-2xl p-6 animate-in zoom-in-95 duration-150 text-left font-sans"
          >
            <div className="flex items-center justify-between border-b border-slate-150 pb-4 mb-4 select-none">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-650 rounded-xl">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-slate-950 uppercase tracking-wide">Generator Palet LPN</h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5 tracking-wider">
                    Tworzenie nowego nośnika w strefie przyjęć
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  sounds.playBeep();
                  setIsCreatorOpen(false);
                  setCreatorItems([]);
                }}
                className="p-1 hover:bg-slate-150 rounded-full border-none bg-transparent text-slate-450 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              
              {/* Product Selector Row */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-end">
                <div className="sm:col-span-6">
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1.5">Wybierz produkt z katalogu</label>
                  <select
                    value={selectedSku}
                    onChange={(e) => setSelectedSku(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                  >
                    {products.map(p => (
                      <option key={p.sku} value={p.sku}>
                        {p.sku} - {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1.5">Ilość (szt.)</label>
                  <input
                    type="number"
                    value={selectedQty}
                    onChange={(e) => setSelectedQty(Number(e.target.value))}
                    min={1}
                    className="w-full px-3 py-1.8 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                  />
                </div>

                <div className="sm:col-span-3">
                  <button
                    type="button"
                    onClick={handleAddItemToCreator}
                    className="w-full h-9 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-[10px] uppercase border-none cursor-pointer shadow active:scale-[0.98]"
                  >
                    Dodaj pozycję
                  </button>
                </div>
              </div>

              {/* Creator items preview */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Zawartość budowanej palety</label>
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[160px] overflow-y-auto bg-slate-50/50">
                  {creatorItems.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 font-semibold select-none">
                      Lista jest pusta. Dodaj przynajmniej jeden produkt powyżej.
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <tbody>
                        {creatorItems.map(item => (
                          <tr key={item.sku} className="border-b border-slate-100 text-[11px] font-semibold hover:bg-slate-150/30">
                            <td className="py-2.5 px-3 font-mono text-slate-800">{item.sku}</td>
                            <td className="py-2.5 px-3 text-slate-700 truncate max-w-[180px]">{item.name}</td>
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{item.qty} szt.</td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveItemFromCreator(item.sku)}
                                className="p-1 hover:bg-red-50 text-red-650 rounded border-none bg-transparent cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

            </div>

            <div className="flex justify-end gap-3 pt-5 border-t border-slate-150 mt-5 select-none">
              <button
                type="button"
                onClick={() => {
                  sounds.playBeep();
                  setIsCreatorOpen(false);
                  setCreatorItems([]);
                }}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-755 font-bold rounded-lg text-xs cursor-pointer bg-white"
              >
                Anuluj
              </button>
              <button
                type="submit"
                disabled={creatorItems.length === 0}
                className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all border-none flex items-center gap-1.5 ${
                  creatorItems.length > 0
                    ? 'bg-blue-650 hover:bg-blue-700 text-white shadow-md cursor-pointer active:scale-[0.97]'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                }`}
              >
                <Check className="w-4 h-4 stroke-[3]" />
                Utwórz Paletę LPN
              </button>
            </div>
          </form>
        </div>
      )}

      {/* LPN Pallet Relocate Modal */}
      {activeRelocLpn && (
        <div className="fixed inset-0 bg-[#0b1329]/65 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleExecuteRelocation}
            className="bg-white border border-slate-250 rounded-2xl w-full max-w-md shadow-2xl p-6 animate-in zoom-in-95 duration-150 text-left font-sans"
          >
            <div className="flex items-center justify-between border-b border-slate-150 pb-4 mb-4 select-none">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-650 rounded-xl">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-slate-950 uppercase tracking-wide">Zbiorcza relokacja palety</h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5 tracking-wider">
                    PRZENIESIENIE NOŚNIKA {activeRelocLpn.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  sounds.playBeep();
                  setActiveRelocLpn(null);
                  setRelocLocation('');
                }}
                className="p-1 hover:bg-slate-150 rounded-full border-none bg-transparent text-slate-450 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-semibold">
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase select-none">Obecne położenie:</span>
                  <span className="font-mono font-bold text-slate-900">{activeRelocLpn.locationCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase select-none">Zawartość nośnika:</span>
                  <span className="text-slate-800">{activeRelocLpn.items.length} SKU (łącznie {activeRelocLpn.items.reduce((s, i) => s + i.qty, 0)} szt.)</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Wprowadź docelowy adres regału</label>
                <input
                  type="text"
                  value={relocLocation}
                  onChange={(e) => setRelocLocation(e.target.value)}
                  placeholder="np. C-01-02-01-01"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none font-mono uppercase text-sm font-bold shadow-inner"
                  required
                  autoFocus
                />
                <span className="text-[10px] text-slate-450 block mt-1.5 leading-relaxed">
                  Zatwierdzenie automatycznie zaktualizuje lokalizację regałową dla wszystkich powiązanych SKU na tej palecie w bazie WMS.
                </span>
              </div>

            </div>

            <div className="flex justify-end gap-3 pt-5 border-t border-slate-150 mt-5 select-none">
              <button
                type="button"
                onClick={() => {
                  sounds.playBeep();
                  setActiveRelocLpn(null);
                  setRelocLocation('');
                }}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-755 font-bold rounded-lg text-xs cursor-pointer bg-white"
              >
                Anuluj
              </button>
              <button
                type="submit"
                disabled={isRelocating || !relocLocation}
                className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all border-none flex items-center gap-1.5 ${
                  !isRelocating && relocLocation
                    ? 'bg-blue-650 hover:bg-blue-700 text-white shadow-md cursor-pointer active:scale-[0.97]'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                }`}
              >
                <ArrowRight className="w-4 h-4" />
                {isRelocating ? 'Przenoszenie...' : 'Przemieść paletę'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Zebra Thermal Label Print Preview Modal */}
      {activeLabelLpn && (
        <div className="fixed inset-0 bg-[#0b1329]/65 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-250 rounded-2xl w-full max-w-md shadow-2xl p-6 animate-in zoom-in-95 duration-150 text-left font-sans">
            <div className="flex items-center justify-between border-b border-slate-150 pb-4 mb-4 select-none">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-650 rounded-xl">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-slate-950 uppercase tracking-wide font-sans">Etykieta Paletowa Zebra LPN</h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5 tracking-wider">
                    PODGLĄD WYDRUKU TERMICZNEGO (100x150mm)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  sounds.playBeep();
                  setActiveLabelLpn(null);
                }}
                className="p-1 hover:bg-slate-150 rounded-full border-none bg-transparent text-slate-450 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Thermal Label representation */}
            <div className="bg-slate-100 p-4.5 rounded-xl border border-slate-250 flex justify-center">
              <div className="bg-white border-2 border-black w-[280px] h-[400px] p-4 flex flex-col justify-between font-mono text-black text-left shadow-sm">
                
                {/* GS1 Standard Header block */}
                <div className="border-b-2 border-black pb-2 flex justify-between items-start">
                  <div className="text-[10px] font-black leading-tight">
                    <span>WMS SYSTEM CO.</span>
                    <br />
                    <span>PL-LOGISTICS UNIT</span>
                  </div>
                  <span className="border border-black px-1 text-[8.5px] font-black uppercase">GS1-LPN</span>
                </div>

                {/* Main LPN Identifier in giant text */}
                <div className="text-center py-2 border-b-2 border-black">
                  <span className="text-[8px] font-bold block uppercase select-none">LICENSE PLATE NUMBER (LPN)</span>
                  <span className="text-xl font-black block tracking-widest mt-1">{activeLabelLpn.id}</span>
                </div>

                {/* Content Table Block */}
                <div className="flex-1 py-2 flex flex-col justify-start gap-1 overflow-hidden border-b-2 border-black text-[9px] font-bold">
                  <div className="flex justify-between border-b border-black pb-0.5 text-[8.5px] uppercase select-none text-slate-500">
                    <span>SKU / KOD</span>
                    <span>OPIS</span>
                    <span>ILOSC</span>
                  </div>
                  {activeLabelLpn.items.map(item => (
                    <div key={item.sku} className="flex justify-between items-center leading-tight py-0.5">
                      <span className="font-black">{item.sku}</span>
                      <span className="truncate max-w-[150px] font-semibold">{item.name}</span>
                      <span className="font-black pr-1">{item.qty}</span>
                    </div>
                  ))}
                </div>

                {/* 1D Zebra Barcode (Mock CSS lines representation) */}
                <div className="pt-2 flex flex-col items-center justify-end gap-1.5">
                  <div className="w-full flex items-center justify-center gap-[1px] h-10 select-none overflow-hidden">
                    {/* Simulated vertical stripes of standard barcode */}
                    {Array.from({ length: 48 }).map((_, idx) => {
                      const widths = [1, 2, 3, 1, 4, 2];
                      const w = widths[idx % widths.length];
                      return (
                        <div 
                          key={idx} 
                          className="bg-black h-full shrink-0" 
                          style={{ 
                            width: `${w}px`,
                            opacity: idx % 2 === 0 ? 1 : 0 
                          }} 
                        />
                      );
                    })}
                  </div>
                  <span className="text-[8px] font-bold font-mono tracking-widest">{activeLabelLpn.id}</span>
                </div>

              </div>
            </div>

            <div className="flex justify-end gap-3 pt-5 border-t border-slate-150 mt-5 select-none">
              <button
                type="button"
                onClick={() => {
                  sounds.playBeep();
                  setActiveLabelLpn(null);
                }}
                className="px-4 py-2 border border-slate-350 hover:bg-slate-50 text-slate-755 font-bold rounded-lg text-xs cursor-pointer bg-white"
              >
                Zamknij
              </button>
              <button
                type="button"
                onClick={() => {
                  sounds.playSuccess();
                  addToast('Etykieta wydrukowana', `Wysłano polecenie druku dla nośnika ${activeLabelLpn.id} do Zebra ZT411.`, 'success');
                  setActiveLabelLpn(null);
                }}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all border-none flex items-center gap-1.5 shadow active:scale-[0.97] cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Drukuj etykietę (Zebra)
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
