import React, { useState, useMemo } from 'react';
import { 
  Plus, Filter, TrendingUp, AlertTriangle, Layers, Database, 
  CheckCircle2, Users, Clock, Activity, ArrowUpRight, ShieldAlert,
  Percent, ArrowDown, PackageCheck, AlertCircle, RefreshCw, Package, Truck
} from 'lucide-react';
import { Product } from '../../services/inventoryApi';
import { defaultImages } from '../../data/warehouseData';

interface DashboardProps {
    products: Product[];
    zones: any[];
    onAddAllocation: (newAlloc: any) => void;
    allocationsLog: any[];
    onRestockProduct?: (product: Product) => void;
    activitiesLog?: any[];
}

export default function Dashboard({
    products,
    zones,
    onAddAllocation,
    allocationsLog = [],
    onRestockProduct,
    activitiesLog = []
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

    // Hourly Pick/Pack Velocity chart state
    const [chartRange, setChartRange] = useState<'today' | 'yesterday' | 'average'>('today');
    const [showPicksLine, setShowPicksLine] = useState(true);
    const [showPacksLine, setShowPacksLine] = useState(true);
    const [qualityPeriod, setQualityPeriod] = useState<'today' | 'yesterday' | 'week'>('today');
    const [cycleCarrier, setCycleCarrier] = useState<'all' | 'dhl' | 'dpd' | 'inpost'>('all');
    const [deliveryCarrier, setDeliveryCarrier] = useState<'dhl' | 'dpd' | 'inpost'>('inpost');

    const chartData = useMemo(() => {
        const hours = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];
        
        let picks = [120, 210, 340, 410, 480, 450, 290, 310, 390, 460, 520, 490, 320, 280, 190, 110];
        let packs = [80, 150, 220, 310, 420, 460, 380, 290, 320, 410, 480, 510, 420, 310, 210, 140];

        if (chartRange === 'yesterday') {
            picks = [100, 180, 290, 380, 440, 410, 260, 280, 350, 415, 490, 460, 290, 240, 160, 95];
            packs = [70, 120, 190, 280, 380, 410, 330, 260, 300, 380, 450, 470, 380, 270, 180, 110];
        } else if (chartRange === 'average') {
            picks = [110, 195, 315, 395, 460, 430, 275, 295, 370, 435, 505, 475, 305, 260, 175, 102];
            packs = [75, 135, 205, 295, 400, 435, 355, 275, 310, 395, 465, 490, 400, 290, 195, 125];
        }

        return hours.map((h, i) => ({
            hour: h,
            picks: picks[i],
            packs: packs[i]
        }));
    }, [chartRange]);

    const getPicksPath = () => {
        let path = "";
        chartData.forEach((d, i) => {
            const x = 60 + i * (880 / 15);
            const y = 260 - (d.picks / 600) * 230;
            if (i === 0) path += `M ${x} ${y}`;
            else path += ` L ${x} ${y}`;
        });
        return path;
    };

    const getPacksPath = () => {
        let path = "";
        chartData.forEach((d, i) => {
            const x = 60 + i * (880 / 15);
            const y = 260 - (d.packs / 600) * 230;
            if (i === 0) path += `M ${x} ${y}`;
            else path += ` L ${x} ${y}`;
        });
        return path;
    };

    const getPicksAreaPath = () => {
        const path = getPicksPath();
        if (!path) return "";
        const firstX = 60;
        const lastX = 60 + 15 * (880 / 15);
        return `${path} L ${lastX} 260 L ${firstX} 260 Z`;
    };

    const getPacksAreaPath = () => {
        const path = getPacksPath();
        if (!path) return "";
        const firstX = 60;
        const lastX = 60 + 15 * (880 / 15);
        return `${path} L ${lastX} 260 L ${firstX} 260 Z`;
    };

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
            'Artykuły spożywcze': ['Żywność (Ambient)'],
            'Elektronika': ['Tech/Biuro (Cold)'],
            'Biuro': ['Tech/Biuro (Cold)'],
            'Motoryzacja': ['Chem/Hazmat (Silesia)'],
            'Części samochodowe': ['Chem/Hazmat (Silesia)'],
            'Chemia samochodowa': ['Chem/Hazmat (Silesia)'],
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

            {lowStockCount > 0 && (
                <div id="dashboard-low-stock-warning" className="bg-amber-50/90 border border-amber-250 p-4 rounded-xl shadow-md flex items-start gap-3.5">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <span className="bg-amber-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded leading-none">NISKI STAN MAGAZYNOWY</span>
                            <h4 className="font-bold text-amber-900 text-xs font-sans">POZYCJE PONIŻEJ PROGU ZAPASU MINIMALNEGO</h4>
                        </div>
                        <p className="text-amber-700 text-xs mt-1.5 leading-relaxed">
                            Wykryto <strong>{lowStockCount} pozycji</strong> z niskim zapasem. Możesz szybko uzupełnić ich stan bezpośrednio z listy poniżej klikając przycisk <strong>Uzupełnij</strong>.
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

            {/* Warehouse Staff Productivity & Packing Quality Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Metryki Wydajności Personelu (2/3 width) */}
                <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-[#e2e8f0] shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                            <Users className="w-4.5 h-4.5 text-[#2563eb]" />
                            <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider">Metryki Wydajności Personelu (Dziś)</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-center">
                            <div className="bg-[#f8fafc] p-4 rounded-lg border border-[#e2e8f0] flex flex-col justify-center min-h-[90px]">
                                <span className="text-[10px] font-bold text-slate-500 block uppercase font-mono mb-1">Piki na godzinę (Avg)</span>
                                <div className="text-xl font-bold text-slate-900 font-mono tracking-tight flex items-center justify-center gap-1">
                                    {laborKPIs.averagePicksPerHour}
                                    <span className="text-xs text-emerald-600 font-bold">&#8593; 3.1%</span>
                                </div>
                            </div>
                            <div className="bg-[#f8fafc] p-4 rounded-lg border border-[#e2e8f0] flex flex-col justify-center min-h-[90px]">
                                <span className="text-[10px] font-bold text-slate-500 block uppercase font-mono mb-1">Dokładność Kompletacji</span>
                                <div className="text-xl font-bold text-emerald-600 font-mono tracking-tight">
                                    {laborKPIs.pickerAccuracy}%
                                </div>
                            </div>
                            <div className="bg-[#f8fafc] p-4 rounded-lg border border-[#e2e8f0] flex flex-col justify-center min-h-[90px]">
                                <span className="text-[10px] font-bold text-slate-500 block uppercase font-mono mb-1">Spakowane Paczki (Suma)</span>
                                <div className="text-xl font-bold text-slate-900 font-mono tracking-tight flex items-center justify-center gap-1">
                                    {qualityPeriod === 'today' ? 322 : qualityPeriod === 'yesterday' ? 289 : 1842}
                                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded leading-none">Norma: 98%</span>
                                </div>
                            </div>
                            <div className="bg-[#f8fafc] p-4 rounded-lg border border-[#e2e8f0] flex flex-col justify-center min-h-[90px]">
                                <span className="text-[10px] font-bold text-slate-500 block uppercase font-mono mb-1">Czas na weryfikację</span>
                                <div className="text-xl font-bold text-indigo-600 font-mono tracking-tight">
                                    {laborKPIs.avgVerificationTime}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Packing Quality Circular Gauge (1/3 width) */}
                <div className="bg-white rounded-xl p-6 border border-[#e2e8f0] shadow-sm flex flex-col justify-between">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                            <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" /> Jakość Pakowania
                            </h3>
                            {/* Period Switcher */}
                            <div className="flex bg-slate-100 p-0.5 rounded border border-slate-200 font-mono text-[9px] select-none">
                                {[
                                    { id: 'today', label: 'Dziś' },
                                    { id: 'yesterday', label: 'Wczoraj' },
                                    { id: 'week', label: '7 dni' }
                                ].map(p => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => setQualityPeriod(p.id as any)}
                                        className={`px-2 py-0.5 rounded font-bold cursor-pointer transition-all border-none ${
                                            qualityPeriod === p.id 
                                                ? 'bg-white text-slate-900 shadow-xs' 
                                                : 'text-slate-500 hover:text-slate-900 bg-transparent'
                                        }`}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Circular Gauge Visualizer */}
                        <div className="flex flex-col items-center justify-center py-2 relative select-none">
                            {(() => {
                                const percentage = qualityPeriod === 'today' ? 99.6 : qualityPeriod === 'yesterday' ? 98.9 : 99.4;
                                const radius = 50;
                                const strokeWidth = 8;
                                const circumference = 2 * Math.PI * radius;
                                const offset = circumference - (percentage / 100) * circumference;
                                
                                return (
                                    <div className="relative flex items-center justify-center">
                                        <svg className="w-36 h-36 transform -rotate-90">
                                            {/* Track circle */}
                                            <circle
                                                cx="72"
                                                cy="72"
                                                r={radius}
                                                stroke="#f1f5f9"
                                                strokeWidth={strokeWidth}
                                                fill="transparent"
                                            />
                                            {/* Value circle */}
                                            <circle
                                                cx="72"
                                                cy="72"
                                                r={radius}
                                                stroke="#10b981"
                                                strokeWidth={strokeWidth}
                                                fill="transparent"
                                                strokeDasharray={circumference}
                                                strokeDashoffset={offset}
                                                strokeLinecap="round"
                                                className="transition-all duration-700 ease-out"
                                            />
                                        </svg>
                                        <div className="absolute flex flex-col items-center justify-center text-center">
                                            <span className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                                                {percentage}%
                                            </span>
                                            <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mt-0.5 font-mono">
                                                Bezbłędność
                                            </span>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Stats list */}
                        <div className="space-y-2 text-xs font-medium border-t border-slate-100 pt-3 text-slate-500">
                            <div className="flex justify-between items-center">
                                <span>Paczki bez reklamacji:</span>
                                <span className="font-mono font-bold text-slate-800">
                                    {qualityPeriod === 'today' ? '321 / 322' : qualityPeriod === 'yesterday' ? '286 / 289' : '1831 / 1842'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Reklamacje RMA:</span>
                                <span className={`font-mono font-bold ${
                                    (qualityPeriod === 'today' ? 1 : qualityPeriod === 'yesterday' ? 3 : 11) > 0 ? 'text-red-500 font-extrabold' : 'text-slate-800'
                                }`}>
                                    {qualityPeriod === 'today' ? '1' : qualityPeriod === 'yesterday' ? '3' : '11'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Główna przyczyna:</span>
                                <span className="text-slate-700 font-bold">
                                    {qualityPeriod === 'today' ? 'Zły gabaryt kartonu' : qualityPeriod === 'yesterday' ? 'Uszkodzenie SKU' : 'Brak etykiety'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Wykres Wydajności Godzinowej (Hourly Pick/Pack Velocity) */}
            <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 shadow-sm flex flex-col space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
                    <div className="text-left font-sans">
                        <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                            <Activity className="w-4 h-4 text-indigo-655" />
                            Wykres Wydajności Godzinowej (Picks / Packs Velocity)
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                            Monitorowanie liczby zebranych SKU oraz spakowanych zamówień w ujęciu godzinowym.
                        </p>
                    </div>

                    {/* Chart Controls */}
                    <div className="flex flex-wrap items-center gap-3 select-none text-xs font-sans">
                        {/* Day Range Selector */}
                        <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 font-mono text-[10px]">
                            {[
                                { id: 'today', label: 'Dziś' },
                                { id: 'yesterday', label: 'Wczoraj' },
                                { id: 'average', label: 'Średnia 7 dni' }
                            ].map(range => (
                                <button
                                    key={range.id}
                                    type="button"
                                    onClick={() => setChartRange(range.id as any)}
                                    className={`px-3 py-1 rounded-md font-bold cursor-pointer transition-all border-none ${
                                        chartRange === range.id
                                            ? 'bg-white text-slate-900 shadow-xs'
                                            : 'text-slate-500 hover:text-slate-900 bg-transparent'
                                    }`}
                                >
                                    {range.label}
                                </button>
                            ))}
                        </div>

                        {/* Line Toggles */}
                        <div className="flex items-center gap-3 font-semibold text-slate-600">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={showPicksLine}
                                    onChange={(e) => setShowPicksLine(e.target.checked)}
                                    className="rounded text-blue-600 focus:ring-blue-500 border-slate-350 w-3.5 h-3.5 cursor-pointer"
                                />
                                <span className="text-[11px] flex items-center gap-1"><span className="w-2.5 h-1 bg-blue-500 rounded-full inline-block"></span> Kompletacja (Picks)</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={showPacksLine}
                                    onChange={(e) => setShowPacksLine(e.target.checked)}
                                    className="rounded text-emerald-600 focus:ring-emerald-500 border-slate-350 w-3.5 h-3.5 cursor-pointer"
                                />
                                <span className="text-[11px] flex items-center gap-1"><span className="w-2.5 h-1 bg-emerald-500 rounded-full inline-block"></span> Pakowanie (Packs)</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* SVG Graph Container */}
                <div className="relative w-full h-[320px] bg-slate-50/30 rounded-xl border border-slate-100 p-4">
                    <svg viewBox="0 0 1000 300" className="w-full h-full overflow-visible">
                        <defs>
                            {/* Blue gradient for Picks */}
                            <linearGradient id="picksGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                            </linearGradient>
                            {/* Emerald gradient for Packs */}
                            <linearGradient id="packsGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                            </linearGradient>
                        </defs>

                        {/* Grid lines & Y Axis values */}
                        {[100, 200, 300, 400, 500, 600].map(val => {
                            const y = 260 - (val / 600) * 230;
                            return (
                                <g key={val}>
                                    <line x1="60" y1={y} x2="940" y2={y} stroke="#e2e8f0" strokeDasharray="3,3" />
                                    <text x="35" y={y + 4} fill="#94a3b8" className="text-[10px] font-mono text-right" textAnchor="end">{val}</text>
                                </g>
                            );
                        })}

                        {/* Baseline */}
                        <line x1="60" y1="260" x2="940" y2="260" stroke="#cbd5e1" strokeWidth="1.5" />

                        {/* X Axis Labels */}
                        {chartData.map((d, i) => {
                            const x = 60 + i * (880 / 15);
                            if (i % 2 !== 0) return null;
                            return (
                                <text key={i} x={x} y="280" fill="#64748b" className="text-[10px] font-mono font-bold" textAnchor="middle">
                                    {d.hour}
                                </text>
                            );
                        })}

                        {/* Picks Area under line */}
                        {showPicksLine && (
                            <path d={getPicksAreaPath()} fill="url(#picksGradient)" />
                        )}

                        {/* Packs Area under line */}
                        {showPacksLine && (
                            <path d={getPacksAreaPath()} fill="url(#packsGradient)" />
                        )}

                        {/* Picks line */}
                        {showPicksLine && (
                            <path d={getPicksPath()} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        )}

                        {/* Packs line */}
                        {showPacksLine && (
                            <path d={getPacksPath()} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        )}

                        {/* Interactive dots and text overlay */}
                        {chartData.map((d, i) => {
                            const x = 60 + i * (880 / 15);
                            const yPicks = 260 - (d.picks / 600) * 230;
                            const yPacks = 260 - (d.packs / 600) * 230;

                            const showPeakValues = d.hour === '10:00' || d.hour === '16:00' || d.hour === '21:00';

                            return (
                                <g key={i}>
                                    {/* Picks Dot */}
                                    {showPicksLine && (
                                        <>
                                            <circle cx={x} cy={yPicks} r="4" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" />
                                            {showPeakValues && (
                                                <text x={x} y={yPicks - 10} fill="#2563eb" className="text-[9px] font-mono font-bold" textAnchor="middle">
                                                    {d.picks}
                                                </text>
                                            )}
                                        </>
                                    )}

                                    {/* Packs Dot */}
                                    {showPacksLine && (
                                        <>
                                            <circle cx={x} cy={yPacks} r="4" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
                                            {showPeakValues && (
                                                <text x={x} y={yPacks + 15} fill="#059669" className="text-[9px] font-mono font-bold" textAnchor="middle">
                                                    {d.packs}
                                                </text>
                                            )}
                                        </>
                                    )}
                                </g>
                            );
                        })}
                    </svg>
                </div>
            </div>

            {/* Grid of SLA and Delivery time indicators */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Wskaźnik Czasu Cyklu Zamówień (Order Cycle Time KPI) */}
                <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 shadow-sm flex flex-col justify-between">
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
                            <div className="text-left font-sans">
                                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-blue-600" />
                                    Czas Cyklu Zamówień (Order Cycle Time SLA)
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">
                                    Średni czas trwania etapów realizacji zamówienia.
                                </p>
                            </div>

                            {/* Carrier Selector */}
                            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 font-mono text-[10px] select-none">
                                {[
                                    { id: 'all', label: 'Wszyscy' },
                                    { id: 'dhl', label: 'DHL' },
                                    { id: 'dpd', label: 'DPD' },
                                    { id: 'inpost', label: 'InPost' }
                                ].map(c => (
                                    <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => setCycleCarrier(c.id as any)}
                                        className={`px-3 py-1 rounded-md font-bold cursor-pointer transition-all border-none ${
                                            cycleCarrier === c.id
                                                ? 'bg-white text-slate-900 shadow-xs'
                                                : 'text-slate-555 hover:text-slate-900 bg-transparent'
                                        }`}
                                    >
                                        {c.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Progress bar visualizer */}
                        {(() => {
                            const durations = {
                                all: { sync: 15, pick: 28, pack: 12, dispatch: 45, label: '1 godz. 40 min' },
                                dhl: { sync: 12, pick: 22, pack: 11, dispatch: 36, label: '1 godz. 21 min' },
                                dpd: { sync: 18, pick: 31, pack: 13, dispatch: 48, label: '1 godz. 50 min' },
                                inpost: { sync: 10, pick: 20, pack: 10, dispatch: 32, label: '1 godz. 12 min' }
                            };
                            const selected = durations[cycleCarrier] || durations.all;
                            const total = selected.sync + selected.pick + selected.pack + selected.dispatch;

                            const percentSync = (selected.sync / total) * 100;
                            const percentPick = (selected.pick / total) * 100;
                            const percentPack = (selected.pack / total) * 100;
                            const percentDispatch = (selected.dispatch / total) * 100;

                            return (
                                <div className="space-y-6">
                                    {/* Total summary */}
                                    <div className="flex justify-between items-baseline select-none">
                                        <span className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider">Lead Time</span>
                                        <span className="text-xl font-black font-mono text-slate-900 tracking-tight">{selected.label}</span>
                                    </div>

                                    {/* Funnel Progress Line */}
                                    <div className="h-6 w-full rounded-full bg-slate-100 overflow-hidden flex shadow-inner border border-slate-250/50">
                                        <div 
                                            className="bg-sky-500 transition-all duration-500 ease-out flex items-center justify-center text-[10px] font-bold text-white font-mono"
                                            style={{ width: `${percentSync}%` }}
                                            title={`Oczekiwanie: ${selected.sync} min`}
                                        >
                                            {percentSync > 12 && `${selected.sync}m`}
                                        </div>
                                        <div 
                                            className="bg-indigo-500 transition-all duration-500 ease-out flex items-center justify-center text-[10px] font-bold text-white font-mono"
                                            style={{ width: `${percentPick}%` }}
                                            title={`Zbiórka (Picking): ${selected.pick} min`}
                                        >
                                            {percentPick > 12 && `${selected.pick}m`}
                                        </div>
                                        <div 
                                            className="bg-purple-500 transition-all duration-500 ease-out flex items-center justify-center text-[10px] font-bold text-white font-mono"
                                            style={{ width: `${percentPack}%` }}
                                            title={`Pakowanie: ${selected.pack} min`}
                                        >
                                            {percentPack > 12 && `${selected.pack}m`}
                                        </div>
                                        <div 
                                            className="bg-blue-650 transition-all duration-500 ease-out flex items-center justify-center text-[10px] font-bold text-white font-mono"
                                            style={{ width: `${percentDispatch}%` }}
                                            title={`Spedycja (Dispatch): ${selected.dispatch} min`}
                                        >
                                            {percentDispatch > 12 && `${selected.dispatch}m`}
                                        </div>
                                    </div>

                                    {/* Sub stage cards in 2x2 grid */}
                                    <div className="grid grid-cols-2 gap-3 text-left">
                                        <div className="p-3 bg-slate-50/55 border border-slate-200/80 rounded-lg">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[9px] font-bold text-sky-700 uppercase font-mono">1. Oczekiwanie</span>
                                                <span className="text-[11px] font-black font-mono text-slate-800">{selected.sync}m</span>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-slate-50/55 border border-slate-200/80 rounded-lg">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[9px] font-bold text-indigo-700 uppercase font-mono">2. Zbiórka</span>
                                                <span className="text-[11px] font-black font-mono text-slate-800">{selected.pick}m</span>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-slate-50/55 border border-slate-200/80 rounded-lg">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[9px] font-bold text-purple-700 uppercase font-mono">3. Pakowanie</span>
                                                <span className="text-[11px] font-black font-mono text-slate-800">{selected.pack}m</span>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-slate-50/55 border border-slate-200/80 rounded-lg">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[9px] font-bold text-blue-700 uppercase font-mono">4. Spedycja</span>
                                                <span className="text-[11px] font-black font-mono text-slate-800">{selected.dispatch}m</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>

                {/* Średni Czas Dostawy Kurierskiej (Average Delivery Time KPI) */}
                <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 shadow-sm flex flex-col justify-between">
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
                            <div className="text-left font-sans">
                                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                    <Truck className="w-4.5 h-4.5 text-indigo-600" />
                                    Czas Dostawy Kurierskiej (Transit Time SLA)
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">
                                    Średni czas dostarczenia paczki do odbiorcy końcowego.
                                </p>
                            </div>

                            {/* Carrier Selector */}
                            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 font-mono text-[10px] select-none">
                                {[
                                    { id: 'inpost', label: 'InPost' },
                                    { id: 'dhl', label: 'DHL' },
                                    { id: 'dpd', label: 'DPD' }
                                ].map(c => (
                                    <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => setDeliveryCarrier(c.id as any)}
                                        className={`px-3 py-1 rounded-md font-bold cursor-pointer transition-all border-none ${
                                            deliveryCarrier === c.id
                                                ? 'bg-white text-slate-900 shadow-xs'
                                                : 'text-slate-555 hover:text-slate-900 bg-transparent'
                                        }`}
                                    >
                                        {c.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Summary & SVG Line Chart */}
                        {(() => {
                            const dataSet = {
                                inpost: { values: [18, 15, 16, 14, 15, 17, 16], avg: '16.4 godz.', pct: '97.2%' },
                                dhl: { values: [24, 21, 23, 20, 22, 25, 23], avg: '22.8 godz.', pct: '95.6%' },
                                dpd: { values: [28, 24, 26, 23, 25, 27, 26], avg: '25.2 godz.', pct: '93.8%' }
                            };
                            const currentData = dataSet[deliveryCarrier] || dataSet.inpost;
                            
                            const points = currentData.values.map((val, idx) => {
                                const x = 40 + idx * 53.3;
                                const y = 90 - ((val - 10) / 20) * 80;
                                return { x, y, val };
                            });

                            const linePath = points.map((p, idx) => 
                                idx === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`
                            ).join(' ');

                            const areaPath = `${linePath} L ${points[points.length - 1].x} 90 L ${points[0].x} 90 Z`;

                            return (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-baseline select-none">
                                        <span className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider">Średni czas dostawy</span>
                                        <div className="text-right">
                                            <span className="text-xl font-black font-mono text-slate-900 tracking-tight block">{currentData.avg}</span>
                                            <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest font-mono">SLA: {currentData.pct} w 24h</span>
                                        </div>
                                    </div>

                                    {/* SVG Container */}
                                    <div className="relative w-full h-[100px] bg-slate-50/50 rounded-xl border border-slate-100 p-2 overflow-visible">
                                        <svg className="w-full h-full overflow-visible" viewBox="0 0 400 100">
                                            <defs>
                                                <linearGradient id="deliveryGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
                                                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                                                </linearGradient>
                                            </defs>

                                            {/* Grid lines */}
                                            {[15, 20, 25].map(v => {
                                                const y = 90 - ((v - 10) / 20) * 80;
                                                return (
                                                    <line key={v} x1="30" y1={y} x2="380" y2={y} stroke="#e2e8f0" strokeDasharray="3,3" />
                                                );
                                            })}

                                            {/* Area */}
                                            <path d={areaPath} fill="url(#deliveryGrad)" />

                                            {/* Line */}
                                            <path d={linePath} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                                            {/* Dots & Labels */}
                                            {points.map((p, idx) => (
                                                <g key={idx}>
                                                    <circle cx={p.x} cy={p.y} r="3" fill="#6366f1" stroke="#ffffff" strokeWidth="1" />
                                                    <text x={p.x} y={p.y - 8} fill="#4f46e5" className="text-[8px] font-mono font-bold" textAnchor="middle">{p.val}h</text>
                                                </g>
                                            ))}

                                            {/* X-Axis labels */}
                                            {['Pon', 'Wt', 'Śr', 'Cz', 'Pt', 'Sob', 'Niedz'].map((day, idx) => (
                                                <text key={day} x={40 + idx * 53.3} y="98" fill="#94a3b8" className="text-[7.5px] font-mono font-bold" textAnchor="middle">{day}</text>
                                            ))}
                                        </svg>
                                    </div>
                                </div>
                            );
                        })()}
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
                                        <div className="flex items-center gap-2 shrink-0 select-none">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold font-mono border ${
                                                prod.stock === 0
                                                    ? 'bg-red-50 text-red-600 border-red-200'
                                                    : 'bg-amber-50 text-amber-700 border-amber-250'
                                            }`}>
                                                {prod.stock} szt.
                                            </span>
                                            <button
                                                onClick={() => onRestockProduct && onRestockProduct(prod)}
                                                className="h-7 px-2.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold flex items-center justify-center transition-all cursor-pointer border-none shadow active:scale-[0.95]"
                                                title="Uzupełnij stan o 100 sztuk u dostawcy"
                                            >
                                                Uzupełnij
                                            </button>
                                        </div>
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

            {/* Dziennik ostatnich alokacji oraz Oś Czasu Aktywności */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                {/* Rejestr Zdarzeń i Alokacji (2/3 szerokości) */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden flex flex-col justify-between">
                    <div>
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
                                    allocationsLog.slice(0, 10).map((log, idx) => {
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
                                                <td className="py-3.5 px-6 text-right text-slate-500 font-mono text-[11px]">{log.user}</td>
                                            </tr>
                                        );
                                    })
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Oś Czasu Aktywności (1/3 szerokości) */}
                <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden flex flex-col justify-between">
                    <div>
                        <div className="px-6 py-4.5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4.5 h-4.5 text-indigo-600" />
                                <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider">
                                    Live Activity Timeline
                                </h3>
                            </div>
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full uppercase tracking-tight font-mono">
                                Live Feed
                            </span>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[380px] scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                            {activitiesLog.length === 0 ? (
                                <div className="py-12 text-center text-slate-400 font-bold bg-white">
                                    Brak zarejestrowanych aktywności w systemie.
                                </div>
                            ) : (
                                <div className="relative border-l-2 border-slate-100 pl-4 ml-3 space-y-6">
                                    {activitiesLog.map((act, idx) => {
                                        let iconColor = 'text-blue-600 bg-blue-50 border-blue-200';
                                        let iconEl = <Package className="w-3.5 h-3.5" />;
                                        let badgeText = 'Operacja';

                                        if (act.type === 'pick') {
                                            iconColor = 'text-indigo-600 bg-indigo-50 border-indigo-200';
                                            iconEl = <Package className="w-3.5 h-3.5 animate-pulse" />;
                                            badgeText = 'Kompletacja';
                                        } else if (act.type === 'pack') {
                                            iconColor = 'text-emerald-600 bg-emerald-50 border-emerald-200';
                                            iconEl = <PackageCheck className="w-3.5 h-3.5" />;
                                            badgeText = 'Pakowanie';
                                        } else if (act.type === 'receive') {
                                            iconColor = 'text-sky-600 bg-sky-50 border-sky-200';
                                            iconEl = <ArrowDown className="w-3.5 h-3.5" />;
                                            badgeText = 'Dostawa';
                                        } else if (act.type === 'rma') {
                                            iconColor = 'text-amber-600 bg-amber-50 border-amber-200';
                                            iconEl = <RefreshCw className="w-3.5 h-3.5" />;
                                            badgeText = 'Zwrot RMA';
                                        } else if (act.type === 'relocate') {
                                            iconColor = 'text-purple-600 bg-purple-50 border-purple-200';
                                            iconEl = <Activity className="w-3.5 h-3.5" />;
                                            badgeText = 'Relokacja';
                                        }

                                        return (
                                            <div key={act.id || idx} className="relative group transition-all duration-200 hover:translate-x-1">
                                                {/* Łącznik kropkowy na linii */}
                                                <span className={`absolute -left-[27px] top-1.5 flex items-center justify-center w-5.5 h-5.5 rounded-full border ${iconColor} shadow-sm z-10`}>
                                                    {iconEl}
                                                </span>

                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border leading-none tracking-wider scale-95 -ml-1 ${
                                                            act.type === 'pick' ? 'text-indigo-700 bg-indigo-50 border-indigo-150' :
                                                            act.type === 'pack' ? 'text-emerald-700 bg-emerald-50 border-emerald-150' :
                                                            act.type === 'receive' ? 'text-sky-700 bg-sky-50 border-sky-150' :
                                                            act.type === 'rma' ? 'text-amber-700 bg-amber-50 border-amber-150' :
                                                            'text-purple-700 bg-purple-50 border-purple-150'
                                                        }`}>
                                                            {badgeText}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-slate-400 font-mono flex items-center gap-1">
                                                            <Clock className="w-3 h-3 text-slate-350" /> {act.timeStr || act.timestamp}
                                                        </span>
                                                    </div>

                                                    <div className="text-[12px] font-black text-slate-800 leading-snug">
                                                        {act.message}
                                                    </div>

                                                    <div className="text-[11px] text-slate-500 font-medium leading-relaxed bg-slate-50 p-2 rounded border border-slate-100/80">
                                                        <div className="flex justify-between items-center text-[10px] text-slate-450 border-b border-slate-200/50 pb-1 mb-1 font-mono">
                                                            <span>Wykonawca:</span>
                                                            <span className="font-bold text-slate-700">{act.user}</span>
                                                        </div>
                                                        {act.details}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
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
