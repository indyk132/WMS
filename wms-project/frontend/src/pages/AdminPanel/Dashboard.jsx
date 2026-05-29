import React, { useState } from 'react';
import { Plus, Filter, TrendingUp, RefreshCw, AlertTriangle, Layers, Database, CheckCircle2 } from 'lucide-react';

export default function Dashboard({
                                      products,
                                      zones,
                                      onAddAllocation,
                                      allocationsLog = [],
                                      onFilterToggle
                                  }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formSku, setFormSku] = useState('');
    const [formZone, setFormZone] = useState('A1');
    const [formQty, setFormQty] = useState(1);
    const [formType, setFormType] = useState('Inbound Receive');
    const [filterActiveOnly, setFilterActiveOnly] = useState(false);

    const totalSkusCount = products.length;
    const outOfStockCount = products.filter(p => p.status === 'Out of Stock').length;
    const lowStockCount = products.filter(p => p.status === 'Low Stock').length;
    const totalStockSum = products.reduce((acc, p) => acc + p.stock, 0);

    const getZoneGroup = (zoneId) => {
        if (zoneId?.startsWith('A')) return 'Żywność';
        if (zoneId?.startsWith('B')) return 'Elektronika i biuro';
        if (zoneId?.startsWith('C')) return 'Motoryzacja, chemia i BHP';
        return 'Ogólna';
    };

    const isCategoryAllowedInZone = (category, zoneId) => {
        const zoneGroup = getZoneGroup(zoneId);
        const allowedGroups = {
            Zywnosc: ['Żywność'],
            Elektronika: ['Elektronika i biuro'],
            Biuro: ['Elektronika i biuro'],
            Motoryzacja: ['Motoryzacja, chemia i BHP'],
            Chemia: ['Motoryzacja, chemia i BHP'],
            BHP: ['Motoryzacja, chemia i BHP'],
        }[category] || [];

        return allowedGroups.includes(zoneGroup);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formSku) return;

        
        const prod = products.find(p => p.sku === formSku) || { name: 'Nieznany towar' };

        if (!isCategoryAllowedInZone(prod.category, formZone)) {
            alert(`Nie można dodać kategorii ${prod.category} do strefy ${getZoneGroup(formZone)}.`);
            return;
        }

        onAddAllocation({
            timestamp: new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
            sku: formSku,
            productName: prod.name,
            zone: formZone,
            qty: parseInt(formQty) || 12,
            type: formType,
            user: 'Terry Crews (EMP-1102)'
        });

        
        setIsModalOpen(false);
        setFormSku('');
        setFormQty(1);
    };

    return (
        <div className="space-y-6 font-sans text-sm text-[#0b1c30]">
            {outOfStockCount > 0 && (
                <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded shadow-sm flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-650 shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <h4 className="font-bold text-red-800 text-xs uppercase tracking-wider">STAN KRYTYCZNY</h4>
                        <p className="text-red-700 text-xs mt-1 leading-relaxed">
                            Wykryto {outOfStockCount} pozycje bez żadnych zapasów na regałach. Strefa COLD STORAGE oraz HAZMAT wymaga natychmiastowej dyspozycji i weryfikacji dostaw.
                        </p>
                    </div>
                </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900 leading-tight">
                        Podgląd Magazynu
                    </h2>
                    <p className="text-zinc-500 text-xs mt-1 leading-relaxed">
                        Stan stref magazynowych w czasie rzeczywistym.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setFilterActiveOnly(!filterActiveOnly)}
                        className={`h-9 px-4 rounded border text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                            filterActiveOnly
                                ? 'bg-blue-50 border-blue-400 text-blue-700'
                                : 'border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700'
                        }`}
                    >
                        <Filter className="w-4 h-4 text-zinc-500" />
                        Filtruj ostrzeżenia
                    </button>

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="h-9 px-4 rounded bg-zinc-900 hover:bg-zinc-850 text-white text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Nowa Alokacja
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white/90 backdrop-blur rounded-lg p-5 border border-zinc-200 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">SUMA SKU</span>
                        <span className="w-7 h-7 rounded bg-zinc-100 flex items-center justify-center text-zinc-800 font-semibold text-xs">SKU</span>
                    </div>
                    <div className="text-2xl font-extrabold text-zinc-900 mb-1">
                        {totalSkusCount.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-blue-600 font-medium">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>+2.4% vs zeszły tydzień</span>
                    </div>
                </div>

                {outOfStockCount > 0 ? (
                    <div className="bg-white/95 backdrop-blur rounded-lg p-5 border border-red-250 shadow-sm bg-gradient-to-br from-white to-red-50/10 animate-pulse">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-[11px] font-bold text-red-650 uppercase tracking-widest">BRAK NA STANIE</span>
                            <AlertTriangle className="w-4.5 h-4.5 text-red-600" />
                        </div>
                        <div className="text-2xl font-extrabold text-red-750 mb-1">
                            {outOfStockCount}
                        </div>
                        <div className="text-xs text-red-650 font-medium">
                            Wymaga pilnej weryfikacji
                        </div>
                    </div>
                ) : (
                    <div className="bg-white/90 backdrop-blur rounded-lg p-5 border border-zinc-200 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">BRAK NA STANIE</span>
                            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />
                        </div>
                        <div className="text-2xl font-extrabold text-zinc-900 mb-1">
                            0
                        </div>
                        <div className="text-xs text-emerald-600 font-medium">
                            Stan idealny - brak braków
                        </div>
                    </div>
                )}

                {lowStockCount > 0 ? (
                    <div className="bg-white/95 backdrop-blur rounded-lg p-5 border border-amber-250 shadow-sm bg-gradient-to-br from-white to-amber-50/10">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-widest">NISKI STAN</span>
                            <AlertTriangle className="w-4.5 h-4.5 text-amber-500" />
                        </div>
                        <div className="text-2xl font-extrabold text-amber-800 mb-1">
                            {lowStockCount}
                        </div>
                        <div className="text-xs text-zinc-500 font-medium font-sans">
                            Poniżej progu bezpieczeństwa
                        </div>
                    </div>
                ) : (
                    <div className="bg-white/90 backdrop-blur rounded-lg p-5 border border-zinc-200 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">NISKI STAN</span>
                            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />
                        </div>
                        <div className="text-2xl font-extrabold text-zinc-900 mb-1">
                            0
                        </div>
                        <div className="text-xs text-emerald-600 font-medium">
                            Wszystkie stany w normie
                        </div>
                    </div>
                )}

                <div className="bg-white/90 backdrop-blur rounded-lg p-5 border border-zinc-200 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">NADCHODZĄCE DOSTAWY</span>
                        <Database className="w-4.5 h-4.5 text-blue-600" />
                    </div>
                    <div className="text-2xl font-extrabold text-zinc-900 mb-1">
                        42
                    </div>
                    <div className="text-xs text-zinc-500 font-medium">
                        Planowany rozładunek do 48 godz.
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-lg border border-zinc-200 p-6 shadow-sm flex flex-col justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wide mb-1 flex items-center gap-2">
                            <Layers className="w-4 h-4 text-blue-600" />
                            Obciążenie stref według grup regałowych
                        </h3>
                        <p className="text-zinc-500 text-xs mb-4">Wizualizacja zajętości procentowej stanów w strefach halowych.</p>
                    </div>

                    <div className="space-y-6 my-2">
                        {(() => {
                            const groupedZones = zones.reduce((acc, zone) => {
                                const block = zone.block || 'Ogólna';
                                if (!acc[block]) acc[block] = [];
                                acc[block].push(zone);
                                return acc;
                            }, {});

                            return Object.entries(groupedZones).map(([blockName, blockZones]) => (
                                <div key={blockName} className="space-y-2">
                                    <h4 className="text-[11px] font-black text-blue-600 uppercase tracking-wider border-b border-zinc-100 pb-1.5 mt-4 first:mt-0 font-mono">
                                        Strefa {blockName}
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5">
                                        {blockZones.map(zone => {
                                            const cap = zone.capacityPercent;
                                            const barColor = cap > 90 ? 'bg-red-500' : cap >= 20 ? 'bg-amber-500' : 'bg-emerald-500';
                                            return (
                                                <div key={zone.id} className="space-y-1">
                                                    <div className="flex justify-between text-xs font-semibold text-zinc-800">
                                                        <span className="font-mono">Regał {zone.id}</span>
                                                        <span>{zone.totalPallets} / {zone.maxPallets} szt. ({cap}%)</span>
                                                    </div>
                                                    <div className="w-full bg-zinc-100 rounded-full h-3 overflow-hidden border border-zinc-200 flex">
                                                        <div className={`${barColor} h-full transition-all duration-500 rounded-full`} style={{ width: `${cap}%` }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ));
                        })()}
                    </div>

                    <div className="border-t border-zinc-150 pt-4 flex justify-between items-center text-xs text-zinc-500 mt-4">
                        <div className="flex gap-4">
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-red-500 rounded-sm"></span> Krytyczne (&gt;90%)</span>
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-amber-500 rounded-sm"></span> Normalne (20-90%)</span>
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm"></span> Niskie (&lt;20%)</span>
                        </div>
                        <span className="font-bold text-blue-600 hover:underline cursor-pointer">Szczegółowa pojemność hal</span>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-zinc-200 p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wide mb-4">
                        Krytyczny stan SKU (Lista obserwacyjna)
                    </h3>
                    <div className="space-y-3 max-h-[295px] overflow-y-auto pr-1">
                        {(() => {
                            const criticalProducts = products.filter(p => p.status === 'Out of Stock' || p.status === 'Low Stock');
                            if (criticalProducts.length === 0) {
                                return (
                                    <div className="flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-zinc-200 rounded-lg bg-zinc-50/50">
                                        <CheckCircle2 className="w-8 h-8 text-emerald-500/70 mb-2" />
                                        <p className="font-bold text-zinc-700 text-xs">Wszystkie stany w normie</p>
                                        <p className="text-[11px] text-zinc-500 mt-1 max-w-[200px] leading-relaxed">
                                            Brak krytycznych pozycji SKU na liście obserwacyjnej.
                                        </p>
                                    </div>
                                );
                            }
                            return criticalProducts.slice(0, 5).map(prod => (
                                <div key={prod.sku} className="p-3 bg-zinc-50 rounded border border-zinc-200/60 flex justify-between items-center gap-2">
                                    <div className="min-w-0">
                                        <p className="font-bold text-zinc-850 truncate">{prod.name}</p>
                                        <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{prod.sku} • Strefa {prod.zone}</p>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                                        prod.status === 'Out of Stock'
                                            ? 'bg-red-100 text-red-750 border border-red-200'
                                             : 'bg-amber-100 text-amber-800 border border-amber-200'
                                    }`}>
                                        {prod.stock} szt.
                                    </span>
                                </div>
                            ));
                        })()}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-[#c6c6cd] shadow-sm overflow-hidden mt-6">
                <div className="px-5 py-4 border-b border-[#c6c6cd] flex justify-between items-center">
                    <h3 className="font-bold text-zinc-900 uppercase tracking-wide">
                        Dziennik ostatnich alokacji towaru
                    </h3>
                    <span className="text-[11px] font-mono text-zinc-500">Auto-odświeżanie aktywne</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                        <tr className="bg-zinc-50 font-bold text-zinc-700 text-xs border-b border-[#c6c6cd]">
                            <th className="py-2.5 px-4">Godzina</th>
                            <th className="py-2.5 px-4">Typ operacji</th>
                            <th className="py-2.5 px-4">SKU</th>
                            <th className="py-2.5 px-4">Nazwa towaru</th>
                            <th className="py-2.5 px-4">Korytarz</th>
                            <th className="py-2.5 px-4 text-right">Ilość (PL)</th>
                            <th className="py-2.5 px-4 text-right">Operator</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 truncate text-[12px] text-zinc-800">
                        {allocationsLog.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="py-6 text-center text-zinc-500 font-medium">Brak niedawnych alokacji. Kliknij "Nowa Alokacja" u góry, aby dodać.</td>
                            </tr>
                        ) : (
                            allocationsLog.map((log, idx) => (
                                <tr key={idx} className="hover:bg-zinc-50 transition-colors">
                                    <td className="py-2 px-4 font-semibold text-zinc-500">{log.timestamp}</td>
                                    <td className="py-2 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.type.includes('Inbound')
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}>
                        {log.type === 'Inbound Receive' ? 'Rozładunek (Inbound)' : 'Przeniesienie wewnętrzne'}
                      </span>
                                    </td>
                                    <td className="py-2 px-4 font-mono font-semibold text-blue-600">{log.sku}</td>
                                    <td className="py-2 px-4 font-medium text-zinc-800">{log.productName}</td>
                                    <td className="py-2 px-4 font-mono font-bold text-zinc-650">{log.zone}</td>
                                    <td className="py-2 px-4 text-right font-mono font-bold">{log.qty} PL</td>
                                    <td className="py-2 px-4 text-right">{log.user}</td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg border border-zinc-300 w-full max-w-md shadow-2xl overflow-hidden font-sans">
                        <div className="px-5 py-4 bg-[#0b1c30] text-white flex justify-between items-center">
                            <h3 className="font-bold tracking-tight">Utwórz nową alokację palet wejściowych</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-white transition-colors cursor-pointer text-lg font-bold">×</button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">WYBIERZ SKU (Asortyment)</label>
                                <select
                                    required
                                    value={formSku}
                                    onChange={(e) => setFormSku(e.target.value)}
                                    className="w-full p-2 border border-zinc-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-zinc-900 bg-white"
                                >
                                    <option value="">Wybierz towar do przydziału...</option>
                                    {products.map(p => (
                                        <option key={p.sku} value={p.sku}>
                                            {p.sku} • {p.name} (Obecnie: {p.stock} szt.)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">STREFA DOCELOWA</label>
                                    <select
                                        value={formZone}
                                        onChange={(e) => setFormZone(e.target.value)}
                                        className="w-full p-2 border border-zinc-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-zinc-950 bg-white"
                                    >
                                        {zones.map(z => (
                                            <option key={z.id} value={z.id}>Korytarz {z.id} ({getZoneGroup(z.id)})</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">ILOŚĆ PALET (PL)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={formQty}
                                        onChange={(e) => setFormQty(e.target.value)}
                                        className="w-full p-2 border border-zinc-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-zinc-950"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">TYP PRZYDZIAŁU</label>
                                <div className="flex gap-4 mt-1">
                                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold">
                                        <input
                                            type="radio"
                                            name="formType"
                                            checked={formType === 'Inbound Receive'}
                                            onChange={() => setFormType('Inbound Receive')}
                                            className="text-blue-600 focus:ring-blue-500"
                                        />
                                        Rozładunek (Inbound)
                                    </label>
                                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold">
                                        <input
                                            type="radio"
                                            name="formType"
                                            checked={formType === 'Internal Relocation'}
                                            onChange={() => setFormType('Internal Relocation')}
                                            className="text-blue-600 focus:ring-blue-500"
                                        />
                                        Przeniesienie wewnętrzne
                                    </label>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-zinc-200 mt-6 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 border border-zinc-300 hover:bg-zinc-50 text-zinc-700 font-semibold rounded text-xs cursor-pointer"
                                >
                                    Anuluj
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-[#0b1c30] hover:bg-zinc-850 text-white font-bold rounded text-xs cursor-pointer shadow"
                                >
                                    Zapisz alokację
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
