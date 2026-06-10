import React, { useState } from 'react';
import { 
  Plus, Filter, TrendingUp, AlertTriangle, Layers, Database, 
  CheckCircle2, Users, Clock, Activity, ArrowUpRight, ShieldAlert,
  Percent, ArrowDown, PackageCheck, AlertCircle, RefreshCw
} from 'lucide-react';
import { Product } from '../../services/inventoryApi';
import { defaultImages } from '../../data/warehouseData';

interface DashboardProps {
    products: Product[];
    zones: any[];
    onAddAllocation: (newAlloc: any) => void;
    allocationsLog: any[];
}

export default function Dashboard({
    products,
    zones,
    onAddAllocation,
    allocationsLog = []
}: DashboardProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [productImages] = useState<Record<string, string>>(() => {
        try {
            const stored = localStorage.getItem('wms-product-images');
            return stored ? JSON.parse(stored) : {};
        } catch {
            return {};
        }
    });

    const getImage = (sku: string) => {
        return productImages[sku] || defaultImages[sku] || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&q=80';
    };
    const [formSku, setFormSku] = useState('');
    const [formZone, setFormZone] = useState('A1');
    const [formQty, setFormQty] = useState(12);
    const [formType, setFormType] = useState('Przyjęcie towaru');
    const [filterActiveOnly, setFilterActiveOnly] = useState(false);
    const [modalError, setModalError] = useState('');

    const totalSkusCount = products.length;
    const outOfStockCount = products.filter(p => p.stock === 0).length;
    const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= p.reorderThreshold).length;
    const totalPalletsCount = zones.reduce((sum, z) => sum + (z.totalPallets || 0), 0);
    const maxPalletsCapacity = zones.reduce((sum, z) => sum + (z.maxPallets || 80), 0);
    const warehouseUtilization = maxPalletsCapacity > 0 ? Math.round((totalPalletsCount / maxPalletsCapacity) * 100) : 0;

    // Simulated Labor and Throughput KPIs
    const laborKPIs = {
        activeStaff: 4,
        averagePicksPerHour: 58.2,
        pickerAccuracy: 99.8,
        ordersPackedToday: 322,
        avgVerificationTime: '42s'
    };

    const getZoneGroup = (zoneId: string) => {
        if (zoneId?.startsWith('A')) return 'Żywność (Ambient)';
        if (zoneId?.startsWith('B')) return 'Tech/Biuro (Cold)';
        if (zoneId?.startsWith('C')) return 'Chem/Hazmat (Silesia)';
        return 'Ogólna';
    };

    const isCategoryAllowedInZone = (category: string, zoneId: string) => {
        const zoneGroup = getZoneGroup(zoneId);
        const allowedGroups = {
            'Zywnosc': ['Żywność (Ambient)'],
            'Elektronika': ['Tech/Biuro (Cold)'],
            'Biuro': ['Tech/Biuro (Cold)'],
            'Motoryzacja': ['Chem/Hazmat (Silesia)'],
            'Chemia': ['Chem/Hazmat (Silesia)'],
            'BHP': ['Chem/Hazmat (Silesia)'],
        }[category] || [];

        return allowedGroups.includes(zoneGroup) || zoneGroup === 'Ogólna';
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formSku) {
            setModalError('Wybierz kod SKU asortymentu przed zapisaniem.');
            return;
        }

        const prod = products.find(p => p.sku === formSku) || { name: 'Nieznany towar', category: 'General' };

        if (!isCategoryAllowedInZone(prod.category, formZone)) {
            setModalError(`Niezgodność strefy z instrukcją składowania: Kategoria „${prod.category}” nie może zostać przypisana do strefy „${getZoneGroup(formZone)}” ze względów bezpieczeństwa pożarowego / sanitarnego.`);
            return;
        }

        setModalError('');
        onAddAllocation({
            timestamp: new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            sku: formSku,
            productName: prod.name,
            zone: formZone,
            qty: parseInt(formQty as any) || 12,
            type: formType,
            user: 'System Admin (EMP-8492)'
        });

        setIsModalOpen(false);
        setFormSku('');
        setFormQty(12);
    };

    const activeAlertsCount = (outOfStockCount > 0 ? 1 : 0) + (warehouseUtilization > 85 ? 1 : 0);

    return (
        <div id="wms-operations-control-tower" className="space-y-6 font-sans text-sm text-[#334155] animate-fadeIn pb-12">
            {/* Header section with real time tag */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0f172a] p-6 rounded-xl border border-[#1e293b] text-white shadow-xl">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="bg-[#2563eb] text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded tracking-wider animate-pulse flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Live Tower
                        </span>
                        <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-white font-sans">
                            Operations Control Tower v4.2
                        </h2>
                    </div>
                    <p className="text-zinc-400 text-xs mt-1 font-medium max-w-2xl leading-relaxed">
                        Centrum telemetrii i dyspozycji zasobów w czasie rzeczywistym. Monitorowanie przepływu towarów, stref składowania oraz wydajności operatorów terminali.
                    </p>
                </div>
                
                <div className="flex gap-3 shrink-0 self-start md:self-center select-none">
                    <button
                        id="toggle-filter-btn"
                        onClick={() => setFilterActiveOnly(!filterActiveOnly)}
                        className={`h-10 px-4 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                            filterActiveOnly
                                ? 'bg-amber-500 hover:bg-amber-600 border border-transparent text-white shadow-lg'
                                : 'bg-[#1e293b] border border-[#334155] text-zinc-350 hover:bg-[#334155] hover:text-white'
                        }`}
                    >
                        <Filter className="w-4 h-4" />
                        {filterActiveOnly ? 'Wyłącz filtr ostrzeżeń' : 'Filtruj ostrzeżenia'}
                    </button>

                    <button
                        id="create-allocation-btn"
                        onClick={() => {
                            setModalError('');
                            setIsModalOpen(true);
                        }}
                        className="h-10 px-5 rounded-lg bg-[#2563eb] hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg hover:shadow-blue-500/20 active:scale-[0.98] border-none"
                    >
                        <Plus className="w-4 h-4" />
                        Nowa Alokacja
                    </button>
                </div>
            </div>

            {/* Critical Notifications Overlay */}
            {outOfStockCount > 0 && (
                <div id="dashboard-critical-warning" className="bg-red-50/90 border border-red-200 p-4 rounded-xl shadow-md flex items-start gap-3.5 animate-pulse">
                    <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <span className="bg-red-650 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded leading-none">ALARM POZIOMU ZAPASU</span>
                            <h4 className="font-bold text-red-900 text-xs font-sans">KRYTYCZNE BRAKI SKU NA ZAPASIE</h4>
                        </div>
                        <p className="text-red-700 text-xs mt-1.5 leading-relaxed">
                            Wykryto <strong>{outOfStockCount} pozycje</strong> ze stanem zerowym. Wymaga to natychmiastowej dyspozycji i weryfikacji przychodzących dokumentów ASN w panelu Inbound.
                        </p>
                    </div>
                </div>
            )}

            {/* Core telemetry KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total SKUs */}
                <div className="bg-white rounded-xl p-5 border border-[#e2e8f0] shadow-sm transition-all hover:shadow-md hover:border-[#cbd5e1] group">
                    <div className="flex justify-between items-start mb-3">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest font-mono">Baza SKU</span>
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-mono">
                            <Database className="w-4.5 h-4.5" />
                        </div>
                    </div>
                    <div className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono">{totalSkusCount}</div>
                    <div className="flex items-center gap-1.5 text-xs text-blue-600 font-bold mt-2">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>+2 w tym tygodniu</span>
                    </div>
                </div>

                {/* KPI 2: Utilization (Real-time storage status) */}
                <div className={`bg-white rounded-xl p-5 border border-[#e2e8f0] shadow-sm transition-all hover:shadow-md ${warehouseUtilization > 85 ? 'border-amber-300 bg-amber-50/10' : ''}`}>
                    <div className="flex justify-between items-start mb-3">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest font-mono">Zajętość Paletowa</span>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono ${warehouseUtilization > 85 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                            <Percent className="w-4.5 h-4.5" />
                        </div>
                    </div>
                    <div className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
                        {warehouseUtilization}%
                    </div>
                    <div className="text-xs text-slate-500 font-medium mt-2 flex items-center gap-1">
                        <span className="font-bold text-slate-700 font-mono">{totalPalletsCount}/{maxPalletsCapacity}</span> zajętych gniazd paletowych PL
                    </div>
                </div>

                {/* KPI 3: Out of stock status */}
                <div className={`bg-white rounded-xl p-5 border border-[#e2e8f0] shadow-sm transition-all hover:shadow-md ${outOfStockCount > 0 ? 'border-red-200 bg-red-50/10' : ''}`}>
                    <div className="flex justify-between items-start mb-3">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest font-mono">Brak Na Stanie</span>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono ${outOfStockCount > 0 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                            <AlertCircle className="w-4.5 h-4.5" />
                        </div>
                    </div>
                    <div className={`text-3xl font-extrabold tracking-tight font-mono ${outOfStockCount > 0 ? 'text-red-655 font-black' : 'text-emerald-700'}`}>
                        {outOfStockCount}
                    </div>
                    <div className="text-xs font-semibold mt-2">
                        {outOfStockCount > 0 ? (
                            <span className="text-red-600 flex items-center gap-1 leading-none">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span> Wymaga korekty stanów
                            </span>
                        ) : (
                            <span className="text-emerald-700 flex items-center gap-1 leading-none">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Stan optymalny
                            </span>
                        )}
                    </div>
                </div>

                {/* KPI 4: Pending Receipts */}
                <div className="bg-white rounded-xl p-5 border border-[#e2e8f0] shadow-sm transition-all hover:shadow-md hover:border-[#cbd5e1]">
                    <div className="flex justify-between items-start mb-3">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest font-mono">W realizacji</span>
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-mono animate-pulse">
                            <Clock className="w-4.5 h-4.5" />
                        </div>
                    </div>
                    <div className="text-3xl font-extrabold text-[#0f172a] tracking-tight font-mono">42</div>
                    <div className="text-xs text-slate-500 font-medium mt-2">
                        Zamówienia w picker/packer queue
                    </div>
                </div>
            </div>

            {/* Warehouse Staff Productivity Section */}
            <div className="bg-white rounded-xl p-6 border border-[#e2e8f0] shadow-sm">
                <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                    <Users className="w-4.5 h-4.5 text-[#2563eb]" />
                    <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider">Metryki Wydajności Personelu (Dziś)</h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="bg-[#f8fafc] p-4 rounded-lg border border-[#e2e8f0]">
                        <span className="text-[10px] font-bold text-slate-500 block uppercase font-mono mb-1">Piki na godzinę (Avg)</span>
                        <div className="text-xl font-bold text-slate-900 font-mono tracking-tight flex items-center justify-center gap-1">
                            {laborKPIs.averagePicksPerHour}
                            <span className="text-xs text-emerald-600 font-bold">&#8593; 3.1%</span>
                        </div>
                    </div>
                    <div className="bg-[#f8fafc] p-4 rounded-lg border border-[#e2e8f0]">
                        <span className="text-[10px] font-bold text-slate-500 block uppercase font-mono mb-1">Dokładność Kompletacji</span>
                        <div className="text-xl font-bold text-emerald-600 font-mono tracking-tight">
                            {laborKPIs.pickerAccuracy}%
                        </div>
                    </div>
                    <div className="bg-[#f8fafc] p-4 rounded-lg border border-[#e2e8f0]">
                        <span className="text-[10px] font-bold text-slate-500 block uppercase font-mono mb-1">Spakowane Paczki</span>
                        <div className="text-xl font-bold text-slate-900 font-mono tracking-tight flex items-center justify-center gap-1">
                            {laborKPIs.ordersPackedToday}
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded leading-none">Norma: 98%</span>
                        </div>
                    </div>
                    <div className="bg-[#f8fafc] p-4 rounded-lg border border-[#e2e8f0]">
                        <span className="text-[10px] font-bold text-slate-500 block uppercase font-mono mb-1">Czas na weryfikację</span>
                        <div className="text-xl font-bold text-indigo-600 font-mono tracking-tight">
                            {laborKPIs.avgVerificationTime}
                        </div>
                    </div>
                </div>
            </div>

            {/* Dynamic Charts visual & SKU watchlist */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Visual Storage load bars */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-[#e2e8f0] p-6 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-3">
                            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                <Layers className="w-4 h-4 text-[#2563eb]" />
                                Obciążenie Regałowe Korytarzy WMS
                            </h3>
                            <span className="text-[10px] text-slate-400 font-mono uppercase font-bold tracking-tight">Capacities benchmark</span>
                        </div>
                        <p className="text-xs text-slate-500 mb-6">Wizualizacja stopnia zapełnienia fizycznych lokalizacji składowania we wszystkich zdefiniowanych strefach.</p>
                    </div>

                    <div className="space-y-6 my-2">
                        {(() => {
                            const groupedZones = zones.reduce((acc: any, zone: any) => {
                                const block = zone.block || 'Ogólna';
                                if (!acc[block]) acc[block] = [];
                                acc[block].push(zone);
                                return acc;
                            }, {});

                            return Object.entries(groupedZones).map(([blockName, blockZones]: any) => {
                                const isHazmat = blockName === 'HAZMAT';
                                return (
                                    <div key={blockName} className="space-y-2 border-l-2 border-slate-100 pl-3">
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-[11px] font-bold text-blue-600 uppercase tracking-widest font-mono">
                                                BUDYNEK {blockName}
                                            </h4>
                                            {isHazmat && <span className="bg-amber-100 text-amber-800 text-[8.5px] px-1 rounded font-bold">Instrukcja pożarowa SEVESO</span>}
                                        </div>
                                        
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 pt-1">
                                            {blockZones.map((zone: any) => {
                                                const cap = zone.capacityPercent;
                                                const selectStyle = cap > 90 
                                                    ? 'bg-red-500' 
                                                    : cap >= 80 
                                                        ? 'bg-amber-500' 
                                                        : 'bg-emerald-500';
                                                
                                                if (filterActiveOnly && cap <= 80) return null;

                                                return (
                                                    <div key={zone.id} className="space-y-1 bg-slate-50/50 p-2.5 rounded border border-[#f1f5f9]">
                                                        <div className="flex justify-between text-xs font-semibold text-slate-700 font-mono">
                                                            <span className="font-bold">Korytarz {zone.id}</span>
                                                            <span className="text-[11px]">{zone.totalPallets} / {zone.maxPallets} PL ({cap}%)</span>
                                                        </div>
                                                        <div className="w-full bg-[#f1f5f9] rounded-full h-2.5 overflow-hidden flex border border-[#e2e8f0]">
                                                            <div className={`${selectStyle} h-full transition-all duration-500 rounded-full`} style={{ width: `${cap}%` }} />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                    </div>

                    <div className="border-t border-slate-100 pt-3.5 flex justify-between items-center text-[11px] text-slate-500 mt-6 leading-none select-none font-mono">
                        <div className="flex flex-wrap gap-4">
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-red-500 rounded-sm"></span> Przepełniony (&gt;90%)</span>
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-amber-500 rounded-sm"></span> Wysokie obciążenie (80-90%)</span>
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm"></span> Optymalny (&lt;80%)</span>
                        </div>
                    </div>
                </div>

                {/* SKU critical watch list */}
                <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 shadow-sm flex flex-col justify-between">
                    <div>
                        <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-1">
                            Katalog SKU pod nadzorem
                        </h3>
                        <p className="text-xs text-slate-500 mb-4">Gniazda, które wymagają natychmiastowego zgłoszenia dyspozycji lub uzupełnienia.</p>
                        
                        <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                            {(() => {
                                const criticalProducts = products.filter(p => p.stock === 0 || p.stock <= p.reorderThreshold);
                                if (criticalProducts.length === 0) {
                                    return (
                                        <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50">
                                            <CheckCircle2 className="w-9 h-9 text-emerald-500 mb-2" />
                                            <p className="font-bold text-slate-700 text-xs">Stan asortymentu optymalny</p>
                                            <p className="text-[10px] text-slate-400 mt-1 max-w-[200px] leading-relaxed">
                                                Żadne SKU nie znajduje się obecnie poniżej progu alarmowego.
                                            </p>
                                        </div>
                                    );
                                }
                                return criticalProducts.map(prod => (
                                    <div key={prod.sku} className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-lg border border-[#e2e8f0] flex justify-between items-center gap-3 transition-colors">
                                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                            <div className="w-8 h-8 rounded overflow-hidden border border-slate-200 bg-white shrink-0 select-none flex items-center justify-center">
                                                {getImage(prod.sku) ? (
                                                    <img src={getImage(prod.sku)} alt={prod.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Package className="w-4 h-4 text-slate-400" />
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-bold text-slate-900 text-xs truncate">{prod.name}</p>
                                                <p className="text-[10px] text-slate-500 font-mono mt-0.5">{prod.sku} • Lok: {prod.locationCode || `Zn: ${prod.zone}`}</p>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold font-mono shrink-0 border ${
                                            prod.stock === 0
                                                ? 'bg-red-50 text-red-600 border-red-200'
                                                : 'bg-amber-50 text-amber-700 border-amber-250'
                                        }`}>
                                            {prod.stock} szt.
                                        </span>
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>
                    
                    <div id="safety-alarm-status" className="bg-slate-50 p-3 rounded-lg border border-[#e2e8f0] flex items-center gap-2.5 mt-4">
                        <Activity className="w-4 h-4 text-emerald-500 flex-shrink-0 animate-pulse" />
                        <span className="text-[11px] text-slate-600 font-bold leading-normal">
                            System ochrony przeciwpożarowej i czujniki temperatury: <strong className="text-emerald-700 font-black">STAN OK</strong>
                        </span>
                    </div>
                </div>
            </div>

            {/* Dziennik ostatnich alokacji */}
            <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden mt-6">
                <div className="px-6 py-4.5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-2">
                        <Database className="w-4.5 h-4.5 text-[#2563eb]" />
                        <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider">
                            Rejestr Zdarzeń i Alokacji (Live Feed)
                        </h3>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-250 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-mono uppercase">
                        <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-ping"></span> Sync Active
                    </span>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                        <tr className="bg-slate-50/30 text-slate-400 font-bold border-b border-slate-100 text-[10px] font-mono uppercase tracking-wider">
                            <th className="py-3 px-6">Timestamp</th>
                            <th className="py-3 px-6">Rodzaj operacji</th>
                            <th className="py-3 px-6">Kod SKU</th>
                            <th className="py-3 px-6">Opis Towaru</th>
                            <th className="py-3 px-6">Lokacja</th>
                            <th className="py-3 px-6 text-right">Ilość Palet</th>
                            <th className="py-3 px-6 text-right">Zleceniodawca</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 truncate text-[12px] font-medium text-slate-700">
                        {allocationsLog.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="py-12 text-center text-slate-400 font-bold bg-white">Brak zapisanych alokacji w rejestrze systemowym. Kliknij „Nowa Alokacja”, aby zainicjować system.</td>
                            </tr>
                        ) : (
                            allocationsLog.map((log, idx) => {
                                const isInbound = log.type && log.type.includes('Przyjęcie');
                                return (
                                    <tr key={idx} className="hover:bg-slate-50-70 transition-all">
                                        <td className="py-3.5 px-6 font-mono text-slate-450 text-[11px]">{log.timestamp}</td>
                                        <td className="py-3.5 px-6 select-none">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                                                isInbound
                                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                                    : 'bg-blue-50 text-blue-750 border-blue-200'
                                            }`}>
                                                <Activity className="w-3 h-3" />
                                                {log.type}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-6 font-mono font-bold text-[#0052cc]">{log.sku}</td>
                                        <td className="py-3.5 px-6 font-semibold text-slate-900">{log.productName}</td>
                                        <td className="py-3.5 px-6 font-mono font-bold text-slate-600 bg-slate-50/50 text-center rounded">{log.zone}</td>
                                        <td className="py-3.5 px-6 text-right font-mono font-extrabold text-[#0f172a]">{log.qty} PL</td>
                                        <td className="py-3.5 px-6 text-right">{log.user}</td>
                                    </tr>
                                );
                            })
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Smart modal replacement for alert-filled allocators */}
            {isModalOpen && (
                <div id="new-allocation-modal" className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs font-sans">
                    <div className="bg-white rounded-xl border border-slate-200 w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
                        <div className="px-5 py-4 bg-[#0f172a] text-white flex justify-between items-center select-none border-b border-slate-800">
                            <div className="flex items-center gap-2">
                                <Database className="w-5 h-5 text-[#2563eb]" />
                                <h3 className="font-extrabold tracking-tight text-white text-sm">Nowa Alokacja Palet WMS</h3>
                            </div>
                            <button 
                                onClick={() => setIsModalOpen(false)} 
                                className="text-slate-400 hover:text-white transition-colors cursor-pointer text-xl font-bold bg-transparent border-none"
                                title="Zamknij"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            {modalError && (
                                <div className="bg-red-50 border border-red-200 text-red-750 p-3.5 rounded-lg text-xs font-bold leading-normal flex items-start gap-2">
                                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                                    <span>{modalError}</span>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 font-mono">1. WYBIERZ TOWAR (Etykieta SKU)</label>
                                <select
                                    required
                                    value={formSku}
                                    onChange={(e) => setFormSku(e.target.value)}
                                    className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] text-slate-900 bg-white"
                                >
                                    <option value="">-- Wskaż korytarz lub kod kreskowy SKU --</option>
                                    {products.map(p => (
                                        <option key={p.sku} value={p.sku}>
                                            {p.sku} • {p.name} (Stan: {p.stock} szt.)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 font-mono">2. ADRES DOCELOWY</label>
                                    <select
                                        value={formZone}
                                        onChange={(e) => setFormZone(e.target.value)}
                                        className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] text-slate-900 bg-white"
                                    >
                                        {zones.map(z => (
                                            <option key={z.id} value={z.id}>Korytarz {z.id} ({getZoneGroup(z.id)})</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 font-mono">3. METRAŻ REGAŁU (PL)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={formQty}
                                        onChange={(e) => setFormQty(e.target.value as any)}
                                        className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] text-slate-900 bg-white font-mono"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 font-mono">4. TYP RUCHU MAGAZYNOWEGO</label>
                                <div className="flex gap-5 mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 select-none">
                                        <input
                                            type="radio"
                                            name="formType"
                                            checked={formType === 'Przyjęcie towaru'}
                                            onChange={() => setFormType('Przyjęcie towaru')}
                                            className="text-[#2563eb] focus:ring-[#2563eb]/30 h-4 w-4"
                                        />
                                        Rozładunek Inbound
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 select-none">
                                        <input
                                            type="radio"
                                            name="formType"
                                            checked={formType === 'Relokacja wewnętrzna'}
                                            onChange={() => setFormType('Relokacja wewnętrzna')}
                                            className="text-[#2563eb] focus:ring-[#2563eb]/30 h-4 w-4"
                                        />
                                        Relokacja ryglowa
                                    </label>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 mt-6 flex justify-end gap-3 flex-wrap">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-lg text-xs cursor-pointer bg-white"
                                >
                                    Anuluj
                                </button>
                                <button
                                    type="submit"
                                    className="px-4.5 py-2 bg-[#0f172a] hover:bg-slate-800 text-white font-bold rounded-lg text-xs cursor-pointer shadow-md transition-colors border-none"
                                >
                                    Przypisz korytarz
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
