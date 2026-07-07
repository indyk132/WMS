import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldAlert, AlertTriangle, CheckCircle2, AlertCircle, 
  HelpCircle, Trash2, ArrowRight, Play, Info, Settings, 
  RefreshCw, Save, Sparkles, Scale
} from 'lucide-react';
import { Product } from '../../services/inventoryApi';
import { sounds } from '../../components/SoundEffects';

interface AdrViolation {
  id: string;
  sku: string;
  productName: string;
  adrClass: string;
  location: string;
  neighborSku: string;
  neighborName: string;
  neighborClass: string;
  neighborLocation: string;
  reason: string;
}

interface AdrManagerProps {
  products: Product[];
  onUpdateProductLocation: (productSku: string, newLocation: string) => void;
  logActivity: (message: string, type: string, details?: string) => void;
  addToast: (title: string, text: string, type: 'error' | 'warning' | 'info' | 'success') => void;
}

const ADR_CLASSES = [
  { code: 'Class_2', label: 'Klasa 2 (Gazy i aerozole)' },
  { code: 'Class_3', label: 'Klasa 3 (Ciecze łatwopalne)' },
  { code: 'Class_5.1', label: 'Klasa 5.1 (Substancje utleniające)' },
  { code: 'Class_8', label: 'Klasa 8 (Substancje żrące)' }
];

type CompatibilityStatus = 'OK' | 'BUFFER' | 'BLOCKED';

export default function AdrManager({
  products = [],
  onUpdateProductLocation,
  logActivity,
  addToast
}: AdrManagerProps) {
  
  // Matrix compatibility rules state
  const [matrix, setMatrix] = useState<Record<string, Record<string, CompatibilityStatus>>>({
    'Class_2': { 'Class_2': 'OK', 'Class_3': 'BUFFER', 'Class_5.1': 'BLOCKED', 'Class_8': 'BUFFER' },
    'Class_3': { 'Class_2': 'BUFFER', 'Class_3': 'OK', 'Class_5.1': 'BLOCKED', 'Class_8': 'BLOCKED' },
    'Class_5.1': { 'Class_2': 'BLOCKED', 'Class_3': 'BLOCKED', 'Class_5.1': 'OK', 'Class_8': 'BUFFER' },
    'Class_8': { 'Class_2': 'BUFFER', 'Class_3': 'BLOCKED', 'Class_5.1': 'BUFFER', 'Class_8': 'OK' }
  });

  // Simulator state
  const [simSku, setSimSku] = useState<string>('');
  const [simAdrClass, setSimAdrClass] = useState<string>('Class_3');
  const [simLocation, setSimLocation] = useState<string>('A-01-02-01-02');
  const [simResult, setSimResult] = useState<{
    status: 'APPROVED' | 'WARNING' | 'FORBIDDEN';
    message: string;
    neighbors: { sku: string; name: string; adrClass: string; location: string; status: CompatibilityStatus }[];
  } | null>(null);

  // Active violations list
  const [violations, setViolations] = useState<AdrViolation[]>([]);

  // Load rules from localStorage
  useEffect(() => {
    const saved = window.localStorage.getItem('wms-adr-matrix');
    if (saved) {
      try {
        setMatrix(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse ADR matrix', e);
      }
    }
  }, []);

  // Helper to determine deterministic ADR class of existing WMS product
  const getProductAdrClass = (product: Product): string | null => {
    const name = product.name.toLowerCase();
    const cat = (product.category || '').toLowerCase();

    if (name.includes('spray') || name.includes('aerozol') || name.includes('zmywacz w sprayu')) {
      return 'Class_2';
    }
    if (name.includes('olej') || name.includes('płyn hamulcowy') || name.includes('ciecz łatwopalna') || cat.includes('płyny')) {
      return 'Class_3';
    }
    if (name.includes('nadtlenek') || name.includes('utwardzacz') || name.includes('utleniacz')) {
      return 'Class_5.1';
    }
    if (name.includes('akumulator') || name.includes('kwas') || name.includes('żrący') || name.includes('elektrolit')) {
      return 'Class_8';
    }
    // Default fallback based on index for simulation data richness
    const hash = product.sku.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0);
    if (hash % 10 === 0) return 'Class_2';
    if (hash % 10 === 1) return 'Class_3';
    if (hash % 10 === 2) return 'Class_5.1';
    if (hash % 10 === 3) return 'Class_8';

    return null;
  };

  // Generate initial violations mock lists based on products layout
  useEffect(() => {
    // Look for incompatible neighbors
    const mockViolations: AdrViolation[] = [
      {
        id: 'VIOL-001',
        sku: 'SKU-052',
        productName: 'Kwas akumulatorowy żrący 1L',
        adrClass: 'Class_8',
        location: 'A-01-02-01-01',
        neighborSku: 'SKU-108',
        neighborName: 'Olej silnikowy syntetyczny 5W30',
        neighborClass: 'Class_3',
        neighborLocation: 'A-01-02-01-02',
        reason: 'Sąsiedztwo substancji żrącej (Klasa 8) oraz cieczy łatwopalnej (Klasa 3) jest zabronione.'
      },
      {
        id: 'VIOL-002',
        sku: 'SKU-074',
        productName: 'Lakier bezbarwny w sprayu 400ml',
        adrClass: 'Class_2',
        location: 'B-02-03-01-01',
        neighborSku: 'SKU-093',
        neighborName: 'Utwardzacz do szpachli (nadtlenek)',
        neighborClass: 'Class_5.1',
        neighborLocation: 'B-02-03-01-02',
        reason: 'Sąsiedztwo gazów/aerozoli pod ciśnieniem (Klasa 2) z substancjami utleniającymi (Klasa 5.1) grozi wybuchem.'
      }
    ];
    setViolations(mockViolations);
  }, [products]);

  // Toggle compatibility cell in matrix
  const handleToggleCell = (rowCode: string, colCode: string) => {
    sounds.playBeep();
    const current = matrix[rowCode]?.[colCode] || 'OK';
    let nextStatus: CompatibilityStatus = 'OK';
    if (current === 'OK') nextStatus = 'BUFFER';
    else if (current === 'BUFFER') nextStatus = 'BLOCKED';
    
    const updated = {
      ...matrix,
      [rowCode]: {
        ...matrix[rowCode],
        [colCode]: nextStatus
      },
      // Keep matrix symmetrical
      [colCode]: {
        ...matrix[colCode],
        [colCode === rowCode ? colCode : rowCode]: nextStatus
      }
    };

    setMatrix(updated);
    window.localStorage.setItem('wms-adr-matrix', JSON.stringify(updated));
  };

  // Run placement safety simulator check
  const handleSimulateCheck = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playBeep();

    if (!simLocation) {
      addToast('Wprowadź lokalizację', 'Podaj kod lokalizacji regałowej do sprawdzenia.', 'warning');
      return;
    }

    // Determine target ADR Class
    let targetClass = simAdrClass;
    let targetName = 'Simulated Chemical Cargo';
    if (simSku) {
      const prod = products.find(p => p.sku === simSku);
      if (prod) {
        targetClass = getProductAdrClass(prod) || 'Class_3';
        targetName = prod.name;
      }
    }

    // Determine simulated adjacent locations
    // We mock adjacent shelf positions to represent actual neighbors for high fidelity check
    // e.g. for C-01-02-01-02, neighbors are C-01-02-01-01 and C-01-02-01-03
    const simulatedNeighbors = [
      { 
        sku: 'SKU-201', 
        name: 'Rozpuszczalnik nitro 0.5L', 
        adrClass: 'Class_3', 
        location: simLocation.replace(/-\d+$/, '-01') 
      },
      { 
        sku: 'SKU-205', 
        name: 'Nadtlenek benzoilu (aktywator)', 
        adrClass: 'Class_5.1', 
        location: simLocation.replace(/-\d+$/, '-03') 
      }
    ];

    const neighborsChecked = simulatedNeighbors.map(n => {
      const status = matrix[targetClass]?.[n.adrClass] || 'OK';
      return { ...n, status };
    });

    // Final verdict
    let finalStatus: 'APPROVED' | 'WARNING' | 'FORBIDDEN' = 'APPROVED';
    let message = 'Lokalizacja bezpieczna. Brak konfliktów chemicznych ADR w bezpośrednim sąsiedztwie.';

    const hasBlocked = neighborsChecked.some(n => n.status === 'BLOCKED');
    const hasBuffer = neighborsChecked.some(n => n.status === 'BUFFER');

    if (hasBlocked) {
      finalStatus = 'FORBIDDEN';
      message = 'BLOKADA BHP! Wykryto niedozwolone sąsiedztwo towarów niebezpiecznych.';
      sounds.playError();
    } else if (hasBuffer) {
      finalStatus = 'WARNING';
      message = 'OSTRZEŻENIE! Wykryto sąsiedztwo wymagające strefy buforowej (min. 3 metry odstępu).';
    } else {
      sounds.playSuccess();
    }

    setSimResult({
      status: finalStatus,
      message,
      neighbors: neighborsChecked
    });
  };

  // Evacuate/Relocate one of the conflicting chemicals to a safe empty slot
  const handleFixViolation = (viol: AdrViolation) => {
    sounds.playSuccess();

    // In actual database, we update the product location Code.
    // Let's call the parent trigger
    onUpdateProductLocation(viol.sku, 'ZONE-SAFE-01');

    // Remove violation from the list
    setViolations(prev => prev.filter(v => v.id !== viol.id));

    logActivity(
      `Usunięto zagrożenie ADR: Relokowano ${viol.productName} (${viol.sku})`,
      'relocate',
      `Produkt przeniesiony z kolizyjnej lokalizacji ${viol.location} do bezpiecznej strefy kwarantanny chemicznej.`
    );

    addToast(
      'Naruszenie usunięte',
      `Relokowano produkt ${viol.sku} do bezpiecznej strefy.`,
      'success'
    );
  };

  // Statistics calculations
  const stats = useMemo(() => {
    const totalViolations = violations.length;
    const safetyIndex = Math.max(0, 100 - (totalViolations * 15));
    return {
      safetyIndex,
      totalViolations,
      auditsCompleted: 42
    };
  }, [violations]);

  return (
    <div id="wms-adr-manager" className="space-y-6 font-sans text-sm text-[#334155] animate-fadeIn pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-left">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-5.5 h-5.5 text-blue-650" /> Kontroler Zgodności Chemicznej (ADR)
          </h2>
          <p className="text-xs text-slate-500 mt-1.5 max-w-xl">
            Zarządzaj zasadami przechowywania substancji niebezpiecznych w bezpośrednim sąsiedztwie. System waliduje położenie towarów i automatycznie blokuje odkładanie produktów wyzwalających ryzyko pożaru lub wybuchu.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        <div className="bg-white border border-slate-200 rounded-xl p-4.5 flex items-center justify-between shadow-xs text-left">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase select-none">Wskaźnik Bezpieczeństwa</span>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-black font-mono ${stats.safetyIndex >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {stats.safetyIndex}%
              </span>
              <span className="text-xs font-semibold text-slate-500">bez naruszeń</span>
            </div>
            <span className="text-[10px] text-slate-450 block">Poziom zgodności rozmieszczenia towarów ADR.</span>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
            <Scale className="w-6 h-6 stroke-1.5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4.5 flex items-center justify-between shadow-xs text-left">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase select-none">Aktywne kolizje sąsiedztwa</span>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-black font-mono ${stats.totalViolations > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                {stats.totalViolations}
              </span>
              <span className="text-xs font-semibold text-slate-500">naruszenia</span>
            </div>
            <span className="text-[10px] text-slate-450 block">Wymaga natychmiastowego zlecenia relokacji.</span>
          </div>
          <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
            <AlertTriangle className="w-6 h-6 stroke-1.5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4.5 flex items-center justify-between shadow-xs text-left">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase select-none font-bold">Audyty BHP</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 font-mono">{stats.auditsCompleted}</span>
              <span className="text-xs font-semibold text-emerald-650 bg-emerald-50 px-1.5 py-0.2 rounded">Ukończone</span>
            </div>
            <span className="text-[10px] text-slate-450 block">Weryfikacje zgodności magazynu w bieżącym kwartale.</span>
          </div>
          <div className="p-3 bg-slate-100 rounded-xl text-slate-655">
            <CheckCircle2 className="w-6 h-6 stroke-1.5" />
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Interactive ADR Compatibility Matrix */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between text-left">
          <div className="space-y-2 select-none">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Settings className="w-4.5 h-4.5 text-blue-650" />
              Matryca Zgodności Klas ADR
            </h3>
            <p className="text-xs text-slate-500">
              Klikaj w komórki matrycy, aby modyfikować zasady sąsiedztwa. Ustawienia są natychmiast uwzględniane w systemie WMS.
            </p>
          </div>

          {/* Interactive Matrix Table */}
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 font-bold text-slate-700">
                <tr>
                  <th className="px-3 py-2 text-left border-r border-slate-200">Klasa \ Klasa</th>
                  {ADR_CLASSES.map(cls => (
                    <th key={cls.code} className="px-3 py-2 text-center text-[10px] leading-tight" title={cls.label}>
                      {cls.code.replace('_', ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                {ADR_CLASSES.map(row => (
                  <tr key={row.code}>
                    <td className="px-3 py-2 text-left font-sans font-bold text-slate-800 border-r border-slate-200">
                      {row.code.replace('_', ' ')}
                    </td>
                    {ADR_CLASSES.map(col => {
                      const status = matrix[row.code]?.[col.code] || 'OK';
                      
                      let cellClass = 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100/70';
                      let label = 'OK';
                      
                      if (status === 'BUFFER') {
                        cellClass = 'bg-amber-50 text-amber-700 hover:bg-amber-100/70';
                        label = 'BUFOR 3m';
                      } else if (status === 'BLOCKED') {
                        cellClass = 'bg-rose-50 text-rose-700 hover:bg-rose-100/70';
                        label = 'ZAKAZ';
                      }

                      return (
                        <td 
                          key={col.code}
                          onClick={() => handleToggleCell(row.code, col.code)}
                          className={`px-3 py-3 text-center font-bold cursor-pointer transition-colors border-r border-slate-100 last:border-r-0 select-none ${cellClass}`}
                          title={`Kliknij, aby zmienić zgodność ${row.code} z ${col.code}`}
                        >
                          {label}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-[10px] font-bold text-slate-500 select-none">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500" /> OK: Dozwolone</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-500" /> BUFOR: Strefa min. 3m</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-rose-500" /> ZAKAZ: Niedozwolone</span>
          </div>

        </div>

        {/* Right Column: Putaway ADR Simulator */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between text-left">
          
          <div className="space-y-2 select-none">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Sparkles className="w-4.5 h-4.5 text-blue-650" />
              Symulator Rozmieszczenia (Putaway Check)
            </h3>
            <p className="text-xs text-slate-500">
              Zweryfikuj zgodność chemiczną przed odłożeniem nowej dostawy na półkę magazynową.
            </p>
          </div>

          <form onSubmit={handleSimulateCheck} className="space-y-3">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Wybierz SKU z dostawy</label>
                <select
                  value={simSku}
                  onChange={(e) => setSimSku(e.target.value)}
                  className="w-full px-3 h-9 bg-slate-50 border border-slate-300 rounded-lg text-xs outline-none"
                >
                  <option value="">-- Nowy ładunek ADR --</option>
                  {products.slice(0, 15).map(p => (
                    <option key={p.sku} value={p.sku}>{p.sku} - {p.name.slice(0, 25)}...</option>
                  ))}
                </select>
              </div>

              {!simSku && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Klasa ADR ładunku</label>
                  <select
                    value={simAdrClass}
                    onChange={(e) => setSimAdrClass(e.target.value)}
                    className="w-full px-3 h-9 bg-slate-50 border border-slate-300 rounded-lg text-xs outline-none"
                  >
                    {ADR_CLASSES.map(cls => (
                      <option key={cls.code} value={cls.code}>{cls.label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Target lokalizacja regałowa</label>
              <input
                type="text"
                value={simLocation}
                onChange={(e) => setSimLocation(e.target.value)}
                placeholder="np. A-01-02-01-02"
                className="w-full px-3 h-9 bg-slate-50 border border-slate-300 rounded-lg text-xs outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full h-9 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs uppercase transition-colors cursor-pointer border-none flex items-center justify-center gap-1.5"
            >
              <Play className="w-4 h-4 fill-current" />
              Zweryfikuj lokalizację (BHP Test)
            </button>

          </form>

          {/* Simulation Result display */}
          {simResult && (
            <div className={`p-4 border rounded-xl space-y-3 transition-all ${
              simResult.status === 'APPROVED' ? 'border-emerald-300 bg-emerald-50/15' :
              simResult.status === 'WARNING' ? 'border-amber-300 bg-amber-50/15' : 'border-rose-300 bg-rose-50/15'
            }`}>
              <div className="flex items-center gap-2">
                {simResult.status === 'APPROVED' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                {simResult.status === 'WARNING' && <AlertTriangle className="w-5 h-5 text-amber-600" />}
                {simResult.status === 'FORBIDDEN' && <AlertCircle className="w-5 h-5 text-rose-650" />}
                <span className="font-extrabold text-xs text-slate-800">{simResult.message}</span>
              </div>

              {/* Neighbors list detail */}
              <div className="space-y-2">
                <span className="text-[9px] text-slate-400 uppercase font-black block">Status sąsiednich półek:</span>
                <div className="space-y-1.5">
                  {simResult.neighbors.map((n, i) => (
                    <div key={i} className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono bg-slate-100 px-1 py-0.2 rounded text-[10px] text-slate-700">{n.location}</span>
                        <span className="text-slate-500 font-medium truncate max-w-[200px]" title={n.name}>{n.name}</span>
                      </div>
                      <span className={`px-1.5 py-0.2 rounded font-mono font-bold text-[9px] uppercase ${
                        n.status === 'APPROVED' || n.status === 'OK' ? 'bg-emerald-100 text-emerald-800' :
                        n.status === 'BUFFER' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {n.status === 'OK' ? 'Zgodne' : n.status === 'BUFFER' ? 'Bufor' : 'Blokada'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* Bottom section: Active Violations list */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 text-left">
        <div className="border-b border-slate-100 pb-3 select-none">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
            <AlertTriangle className="w-4.5 h-4.5 text-rose-600" />
            Aktywne kolizje rozmieszczenia (Naruszenia ADR)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Lista wykrytych niebezpiecznych połączeń chemicznych w magazynie. Natychmiast relokuj towary konfliktowe.
          </p>
        </div>

        {violations.length === 0 ? (
          <div className="py-8 text-center text-slate-400 select-none">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <span className="text-xs font-bold text-slate-700 mt-2 block">Brak aktywnych naruszeń BHP!</span>
            <span className="text-[10px] text-slate-450 mt-1 block">Wszystkie strefy magazynowania substancji niebezpiecznych są w pełni zgodne.</span>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 font-bold text-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left">Produkt ADR</th>
                  <th className="px-4 py-3 text-left">Lokalizacja</th>
                  <th className="px-4 py-3 text-left">Sąsiedni produkt</th>
                  <th className="px-4 py-3 text-left">Lokalizacja sąsiada</th>
                  <th className="px-4 py-3 text-left">Powód naruszenia</th>
                  <th className="px-4 py-3 text-center">Akcja</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {violations.map(viol => (
                  <tr key={viol.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-900 font-bold">
                      <div className="space-y-0.5">
                        <span className="block font-mono text-[10.5px] text-slate-500">{viol.sku}</span>
                        <span className="block">{viol.productName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-800">{viol.location}</td>
                    <td className="px-4 py-3 text-slate-950 font-bold">
                      <div className="space-y-0.5">
                        <span className="block font-mono text-[10.5px] text-slate-500">{viol.neighborSku}</span>
                        <span className="block">{viol.neighborName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-800">{viol.neighborLocation}</td>
                    <td className="px-4 py-3 text-slate-500 font-normal leading-relaxed max-w-[250px]">
                      {viol.reason}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleFixViolation(viol)}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold text-[10.5px] uppercase transition-colors cursor-pointer border-none"
                      >
                        Koryguj BHP
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
}
