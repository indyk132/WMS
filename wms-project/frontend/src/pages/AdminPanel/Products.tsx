import React, { useState } from 'react';
import { 
    Search, RefreshCw, Minus, Plus, Check, Package, X, Percent,
    ShieldAlert, FileText, AlertTriangle, Lock, History, ClipboardList, 
    CheckCircle2, TrendingUp, AlertOctagon, Download, Wrench
} from 'lucide-react';
import { Product } from '../../services/inventoryApi';
import { defaultImages } from '../../data/warehouseData';
import { sounds } from '../../components/SoundEffects';

const polishStatusMap: Record<string, string> = {
    'In Stock': 'Dostępny',
    'Low Stock': 'Niski stan',
    'Out of Stock': 'Brak na stanie',
};

const getCategoryLabel = (category: string) => {
    if (category === 'Zywnosc') return 'Żywność';
    return category;
};

const getStockQtyStyle = (stock: number, threshold: number) => {
    if (stock === 0) {
        return 'text-red-655 font-black';
    }
    if (stock <= threshold) {
        return 'text-amber-700 font-extrabold';
    }
    if (stock <= threshold * 1.2 || stock <= threshold + 5) {
        return 'text-orange-500 font-bold';
    }
    return 'text-zinc-850 font-medium';
};

interface ProductsProps {
    products: Product[];
    onUpdateStock: (product: Product, delta: number) => Promise<void>;
    onRestockItem: (product: Product) => Promise<void>;
    onUpdateThreshold: (product: Product, threshold: number) => Promise<void>;
    onUpdateBulkCategoryVat?: (category: string, vatRate: number) => void;
    highlightedSku?: string | null;
}

export default function Products({ 
    products, 
    onUpdateStock, 
    onRestockItem, 
    onUpdateThreshold, 
    onUpdateBulkCategoryVat,
    highlightedSku 
}: ProductsProps) {
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [draftStocks, setDraftStocks] = useState<Record<string, number>>({});
    const [draftThresholds, setDraftThresholds] = useState<Record<string, number>>({});
    const [pendingSku, setPendingSku] = useState('');
    const [pendingThresholdSku, setPendingThresholdSku] = useState('');
    const [stockError, setStockError] = useState('');

    // State for Bulk VAT Rate Editor modal
    const [isVatModalOpen, setIsVatModalOpen] = useState(false);
    const [selectedVatCategory, setSelectedVatCategory] = useState('');
    const [selectedVatRate, setSelectedVatRate] = useState<number>(23);

    // ----------------------------------------------------
    // OPTION 32: Reorder Point Filter & Alert
    // ----------------------------------------------------
    const [onlyBelowMin, setOnlyBelowMin] = useState(false);
    const belowMinCount = products.filter(p => p.stock <= (p.reorderThreshold || 10)).length;

    // ----------------------------------------------------
    // OPTION 44: Fast CSV Export
    // ----------------------------------------------------
    const [stockToast, setStockToast] = useState('');
    const handleExportCsv = () => {
        sounds.playSuccess();
        const headers = ['SKU', 'Nazwa Produktu', 'Kategoria', 'Stan Magazynowy', 'Próg Reorder Point', 'Status', 'Cena PLN', 'Lokalizacja'];
        const rows = products.map(p => [
            `"${p.sku}"`,
            `"${(p.name || '').replace(/"/g, '""')}"`,
            `"${p.category || ''}"`,
            p.stock,
            p.reorderThreshold || 10,
            `"${p.stock === 0 ? 'Brak na stanie' : p.stock <= (p.reorderThreshold || 10) ? 'Niski stan' : 'Dostępny'}"`,
            p.price || 0,
            `"${p.locationCode || `Korytarz ${p.zone}`}"`
        ]);

        const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `stany_magazynowe_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setStockToast('[Opcja 44]: Pomyślnie wygenerowano i pobrano plik CSV ze stanami magazynowymi!');
        setTimeout(() => setStockToast(''), 4500);
    };

    // ----------------------------------------------------
    // OPTION 88: Hardware Tickets (IT Helpdesk Viewer for Admin)
    // ----------------------------------------------------
    const [isTicketsModalOpen, setIsTicketsModalOpen] = useState(false);
    const [equipmentTickets, setEquipmentTickets] = useState<any[]>(() => {
        try {
            const stored = JSON.parse(localStorage.getItem('wms-equipment-tickets') || '[]');
            if (stored.length > 0) return stored;
            const seed = [
                {
                    id: 'TCK-201',
                    deviceType: 'Skaner ręczny Zebra TC57',
                    station: 'Stanowisko Zbiórki A',
                    urgency: 'Wysoki',
                    description: 'Skaner gubi wiązkę lasera przy szybkim odczycie kodów Code128.',
                    reportedBy: 'K. Kowalski',
                    reportedAt: '2026-09-08 14:20',
                    status: 'OTWARTE'
                },
                {
                    id: 'TCK-202',
                    deviceType: 'Drukarka termiczna Zebra ZD421',
                    station: 'Stacja Pakowania 2',
                    urgency: 'Średni',
                    description: 'Biała linia w poprzek etykiety – zalecane przeczyszczenie głowicy.',
                    reportedBy: 'M. Nowak',
                    reportedAt: '2026-09-09 09:10',
                    status: 'OTWARTE'
                }
            ];
            localStorage.setItem('wms-equipment-tickets', JSON.stringify(seed));
            return seed;
        } catch {
            return [];
        }
    });

    const handleResolveTicket = (ticketId: string) => {
        sounds.playSuccess();
        const updated = equipmentTickets.map(t => t.id === ticketId ? { ...t, status: 'NAPRAWIONE', resolvedAt: new Date().toLocaleTimeString('pl-PL') } : t);
        setEquipmentTickets(updated);
        try {
            localStorage.setItem('wms-equipment-tickets', JSON.stringify(updated));
        } catch (e) {}
    };

    // ----------------------------------------------------
    // OPTION 84: Scrap Ledger (Protokół Strat Wewnętrznych RW)
    // ----------------------------------------------------
    const [isScrapModalOpen, setIsScrapModalOpen] = useState(false);
    const [scrapSelectedSku, setScrapSelectedSku] = useState(products[0]?.sku || '');
    const [scrapQty, setScrapQty] = useState(1);
    const [scrapReason, setScrapReason] = useState('Upadek z wideł wózka');
    const [scrapInspector, setScrapInspector] = useState('Magazynier Dyżurny');
    const [scrapNotes, setScrapNotes] = useState('');

    // ----------------------------------------------------
    // OPTION 87: Audit Adjustment Ledger (Dziennik Korekt Magazynowych)
    // ----------------------------------------------------
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [historyFilterType, setHistoryFilterType] = useState('ALL');
    const [auditAdjustments, setAuditAdjustments] = useState([
        {
            id: 'KOR-2026-091',
            sku: 'SKU-001',
            name: 'Klocki hamulcowe przód (A1)',
            type: 'PZ',
            delta: +50,
            date: '2026-09-04 09:15',
            actor: 'Marta N. (Przyjęcia)',
            docRef: 'PZ-2026-114',
            reason: 'Dostawa bieżąca od producenta'
        },
        {
            id: 'KOR-2026-092',
            sku: 'SKU-002',
            name: 'Tarcze hamulcowe 280mm',
            type: 'RW',
            delta: -2,
            date: '2026-09-04 11:30',
            actor: 'Piotr W. (Magazynier)',
            docRef: 'RW-2026-042',
            reason: 'Protokół strat 84: Upadek z wideł wózka'
        },
        {
            id: 'KOR-2026-093',
            sku: 'SKU-003',
            name: 'Amortyzator olejowy tył',
            type: 'INW',
            delta: -1,
            date: '2026-09-04 13:00',
            actor: 'Kierownik Magazynu',
            docRef: 'INW-CYKL-09',
            reason: 'Inwentaryzacja cykliczna: sprostowanie stanu'
        },
        {
            id: 'KOR-2026-094',
            sku: 'SKU-004',
            name: 'Filtr oleju silnikowego',
            type: 'WZ',
            delta: -8,
            date: '2026-09-04 14:45',
            actor: 'System WMS (Dyspozycja)',
            docRef: 'WZ-ORD-10492',
            reason: 'Wydanie do zamówienia klienta'
        }
    ]);

    // Handle Scrap Submission (Option 84 -> Option 87)
    const handleConfirmScrap = async () => {
        const prod = products.find(p => p.sku === scrapSelectedSku);
        if (!prod) return;

        // Check Option 86 lock
        try {
            const locks = JSON.parse(localStorage.getItem('wms-active-pick-locks') || 'null');
            if (locks && (locks.skus?.includes(prod.sku) || locks.locations?.includes(prod.zone))) {
                sounds.playError();
                setStockError(`🔒 [Opcja 86 - Blokada Concurrency]: Nie można spisać strat dla SKU ${prod.sku}. Trwa aktywna kompletacja zamówienia ${locks.orderId} przez ${locks.worker}.`);
                setIsScrapModalOpen(false);
                return;
            }
        } catch (e) {
            console.error(e);
        }

        sounds.playSuccess();
        await onUpdateStock(prod, -scrapQty);

        const newAdjustment = {
            id: `KOR-2026-${Math.floor(100 + Math.random() * 900)}`,
            sku: prod.sku,
            name: prod.name,
            type: 'RW',
            delta: -scrapQty,
            date: new Date().toISOString().slice(0, 16).replace('T', ' '),
            actor: scrapInspector,
            docRef: `RW-2026-${Math.floor(100 + Math.random() * 900)}`,
            reason: `Protokół strat 84: ${scrapReason}${scrapNotes ? ` (${scrapNotes})` : ''}`
        };

        setAuditAdjustments(prev => [newAdjustment, ...prev]);
        setIsScrapModalOpen(false);
        setScrapNotes('');
    };

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

    React.useEffect(() => {
        if (highlightedSku) {
            setSearch('');
            setCategoryFilter('');
            setStatusFilter('');
        }
    }, [highlightedSku]);

    React.useEffect(() => {
        if (highlightedSku) {
            const element = document.getElementById(`product-row-${highlightedSku}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [highlightedSku]);
    
    const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean))).sort();

    const filteredProducts = products.filter(p => {
        const matchesSearch = (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
            (p.sku || '').toLowerCase().includes(search.toLowerCase()) ||
            (p.zone || '').toLowerCase().includes(search.toLowerCase());
        const matchesCat = categoryFilter ? p.category === categoryFilter : true;
        const matchesStatus = statusFilter ? p.status === statusFilter : true;
        const matchesBelowMin = onlyBelowMin ? p.stock <= (p.reorderThreshold || 10) : true;
        return matchesSearch && matchesCat && matchesStatus && matchesBelowMin;
    });

    const saveStockUpdate = async (product: Product) => {
        const draft = draftStocks[product.sku];
        if (draft === undefined) return;

        const delta = Number(draft) - product.stock;
        if (delta === 0) return;

        // OPTION 86: Concurrency Lock during active picking
        try {
            const locks = JSON.parse(localStorage.getItem('wms-active-pick-locks') || 'null');
            if (locks && (locks.skus?.includes(product.sku) || locks.locations?.includes(product.zone))) {
                sounds.playError();
                setStockError(`🔒 [Opcja 86 - Blokada Concurrency]: Nie można skorygować stanu SKU ${product.sku} (Gniazdo ${product.zone}). Trwa aktywna kompletacja zamówienia ${locks.orderId} przez ${locks.worker}. Inwentaryzacja zablokowana do zakończenia kompletacji.`);
                return;
            }
        } catch (e) {
            console.error(e);
        }

        setStockError('');
        setPendingSku(product.sku);

        try {
            await onUpdateStock(product, delta);

            // OPTION 87: Log adjustment
            const newAdj = {
                id: `KOR-2026-${Math.floor(100 + Math.random() * 900)}`,
                sku: product.sku,
                name: product.name,
                type: delta > 0 ? 'PZ' : 'INW',
                delta: delta,
                date: new Date().toISOString().slice(0, 16).replace('T', ' '),
                actor: 'Operator Magazynu',
                docRef: delta > 0 ? 'PZ-KOR-MANUAL' : 'INW-KOR-MANUAL',
                reason: 'Ręczna korekta stanu / inwentaryzacja'
            };
            setAuditAdjustments(prev => [newAdj, ...prev]);

            setDraftStocks(prev => {
                const copy = { ...prev };
                delete copy[product.sku];
                return copy;
            });
        } catch (error: any) {
            setStockError(error.message || 'Nie udało się zaktualizować stanu.');
        } finally {
            setPendingSku('');
        }
    };

    const saveThresholdUpdate = async (product: Product) => {
        const draft = draftThresholds[product.sku];
        if (draft === undefined) return;

        setStockError('');
        setPendingThresholdSku(product.sku);

        try {
            await onUpdateThreshold(product, draft);
            setDraftThresholds(prev => {
                const copy = { ...prev };
                delete copy[product.sku];
                return copy;
            });
        } catch (error: any) {
            setStockError(error.message || 'Nie udało się zaktualizować progu ostrzeżenia.');
        } finally {
            setPendingThresholdSku('');
        }
    };

    // Option 85: Inventory Record Accuracy calculation
    const totalAuditedSkus = products.length;
    const matchingSkus = products.filter(p => p.stock > 0 && p.stock >= p.reorderThreshold * 0.5).length;
    const iraPercent = totalAuditedSkus > 0 ? ((matchingSkus / totalAuditedSkus) * 100).toFixed(1) : '100.0';
    const isWorldClassIra = Number(iraPercent) >= 95.0;

    return (
        <div className="space-y-6 font-sans text-sm text-[#0b1c30] animate-fadeIn">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900 leading-tight border-none">Katalog Zapasów SKU</h2>
                    <p className="text-zinc-500 text-xs mt-1">Stan zapasów produktów w czasie rzeczywistym, poziomy ostrzegawcze i lokalizacje.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            sounds.playBeep();
                            setIsScrapModalOpen(true);
                        }}
                        className="h-9 px-3.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm border-none"
                        title="Spisanie uszkodzonego lub stłuczonego towaru ze stanu"
                    >
                        <AlertTriangle className="w-4 h-4" /> 84. Protokół Strat (RW)
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            sounds.playBeep();
                            setIsHistoryModalOpen(true);
                        }}
                        className="h-9 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm border-none"
                        title="Przejrzyj historię wszystkich zmian i korekt magazynowych"
                    >
                        <History className="w-4 h-4 text-sky-400" /> 87. Dziennik Korekt
                    </button>

                    {/* Option 32: Reorder Point Filter */}
                    <button
                        type="button"
                        onClick={() => {
                            sounds.playBeep();
                            setOnlyBelowMin(!onlyBelowMin);
                        }}
                        className={`h-9 px-3 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border ${
                            onlyBelowMin 
                                ? 'bg-amber-600 text-white border-amber-700 shadow-sm' 
                                : 'bg-white text-amber-800 border-amber-300 hover:bg-amber-50'
                        }`}
                        title="Filtruj towary, których stan spadł poniżej progu minimalnego (Opcja 32)"
                    >
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        32. Poniżej min ({belowMinCount})
                    </button>

                    {/* Option 44: Fast CSV Export */}
                    <button
                        type="button"
                        onClick={handleExportCsv}
                        className="h-9 px-3 rounded-xl bg-white hover:bg-zinc-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-zinc-300 shadow-2xs"
                        title="Pobierz aktualny stan magazynu jako plik CSV (Opcja 44)"
                    >
                        <Download className="w-3.5 h-3.5 text-blue-600" />
                        44. Eksport CSV
                    </button>

                    {/* Option 88: Equipment Helpdesk Viewer */}
                    <button
                        type="button"
                        onClick={() => {
                            sounds.playBeep();
                            setIsTicketsModalOpen(true);
                        }}
                        className="h-9 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border-none shadow-sm"
                        title="Przeglądaj zgłoszenia awarii sprzętu zgłoszone przez magazynierów (Opcja 88)"
                    >
                        <Wrench className="w-3.5 h-3.5 text-amber-400" />
                        88. Usterki ({equipmentTickets.filter(t => t.status === 'OTWARTE').length})
                    </button>

                    <button
                        onClick={() => {
                            if (categories.length > 0) {
                                setSelectedVatCategory(categories[0]);
                            }
                            setIsVatModalOpen(true);
                        }}
                        className="h-9 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm border-none"
                    >
                        <Percent className="w-4 h-4" /> VAT
                    </button>
                    <button
                        onClick={async () => {
                            setStockError('');

                            try {
                                for (const product of products) {
                                    if (product.stock < product.reorderThreshold) {
                                        await onRestockItem(product);
                                    }
                                }
                            } catch (error: any) {
                                setStockError(error.message || 'Nie udało się uzupełnić braków.');
                            }
                        }}
                        className="h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm border-none"
                    >
                        <RefreshCw className="w-4 h-4" /> Uzupełnij braki
                    </button>
                </div>
            </div>

            {/* Option 44 Success Toast */}
            {stockToast && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center justify-between shadow-sm animate-in fade-in">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>{stockToast}</span>
                    </div>
                    <button onClick={() => setStockToast('')} className="text-emerald-700 hover:text-emerald-950 font-bold border-none bg-transparent cursor-pointer">✕</button>
                </div>
            )}

            {/* OPTION 85: INVENTORY RECORD ACCURACY (IRA %) RIBBON */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4.5 rounded-2xl text-white shadow-md border border-indigo-900/50 select-none">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                        <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-300">Wskaźnik IRA (Opcja 85)</span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                {isWorldClassIra ? 'Klasa Światowa WERC' : 'W normie'}
                            </span>
                        </div>
                        <div className="text-xl font-black text-emerald-400 font-mono mt-0.5">
                            {iraPercent}% <span className="text-xs text-slate-300 font-normal">zgodności stanów</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-white/10 sm:pl-4">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-300">Audyt Ciągły SKU</span>
                        <div className="text-lg font-bold text-white font-mono mt-0.5">
                            {matchingSkus} / {totalAuditedSkus} SKU <span className="text-xs text-emerald-300 font-normal">zgodne</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-white/10 sm:pl-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                        <History className="w-5 h-5" />
                    </div>
                    <div>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-300">Historia Korekt (Opcja 87)</span>
                        <div className="text-lg font-bold text-white font-mono mt-0.5">
                            {auditAdjustments.length} zdarzeń <span className="text-xs text-indigo-300 font-normal">(PZ/WZ/RW/INW)</span>
                        </div>
                    </div>
                </div>
            </div>

            {stockError && (
                <div className="bg-red-50 border border-red-200 text-red-750 px-4 py-3 rounded text-xs font-semibold">
                    {stockError}
                </div>
            )}

            <div className="bg-white rounded border border-[#e5e7eb] shadow-sm p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">Szukaj asortymentu</label>
                    <div className="relative">
                        <Search className="w-4 h-4 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Wpisz SKU lub nazwę towaru..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 border border-zinc-300 rounded focus:ring-1 focus:ring-blue-500 bg-white text-xs outline-none text-zinc-900"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">Filtruj wg kategorii</label>
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="w-full p-2 border border-zinc-300 rounded bg-white text-xs text-zinc-800 outline-none cursor-pointer"
                    >
                        <option value="">Wszystkie kategorie</option>
                        {categories.map(category => (
                            <option key={category} value={category}>{getCategoryLabel(category)}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">Status magazynowy</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full p-2 border border-zinc-300 rounded bg-white text-xs text-zinc-800 outline-none cursor-pointer"
                    >
                        <option value="">Wszystkie statusy</option>
                        <option value="In Stock">Dostępny</option>
                        <option value="Low Stock">Niski stan</option>
                        <option value="Out of Stock">Brak na stanie</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded border border-[#e5e7eb] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                        <tr className="bg-zinc-50 font-bold text-zinc-650 text-xs border-b border-[#e5e7eb]">
                            <th className="py-2.5 px-4 font-bold">Kod SKU</th>
                            <th className="py-2.5 px-4 font-bold">Nazwa towaru podzespołu</th>
                            <th className="py-2.5 px-4 font-bold">Kategoria</th>
                            <th className="py-2.5 px-4 font-bold">Położenie</th>
                            <th className="py-2.5 px-4 text-right font-bold">Próg ostrzeżenia (szt.)</th>
                            <th className="py-2.5 px-4 text-right font-bold font-sans">Cena jednostkowa (PLN)</th>
                            <th className="py-2.5 px-4 text-center font-bold">Stawka VAT</th>
                            <th className="py-2.5 px-4 text-center font-bold">Status</th>
                            <th className="py-2.5 px-4 text-right font-bold w-12">Ilość (szt.)</th>
                            <th className="py-2.5 px-4 text-right font-bold w-48">Akcje stanu</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 text-xs font-medium text-zinc-850">
                        {filteredProducts.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="py-10 text-center text-zinc-400 font-bold bg-white">Brak pozycji SKU pasujących do podanych filtrów.</td>
                            </tr>
                        ) : (
                            filteredProducts.map(p => {
                                const draftVal = draftStocks[p.sku] !== undefined ? draftStocks[p.sku] : p.stock;
                                const isChanged = draftVal !== p.stock;

                                const isHighlighted = highlightedSku && p.sku === highlightedSku;
                                return (
                                    <tr 
                                        id={`product-row-${p.sku}`}
                                        key={p.sku} 
                                        className={`transition-all duration-500 ${
                                            isHighlighted 
                                                ? 'bg-amber-100 ring-2 ring-amber-400 font-bold shadow-sm' 
                                                : 'hover:bg-zinc-50/70'
                                        }`}
                                    >
                                        <td className="py-3 px-4 font-mono font-bold text-[#0052CC]">{p.sku}</td>
                                        <td className="py-3 px-4 font-normal text-zinc-700">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg overflow-hidden border border-zinc-200 bg-zinc-50 shrink-0 select-none flex items-center justify-center">
                                                    {getImage(p.sku) ? (
                                                        <img src={getImage(p.sku)} alt={p.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Package className="w-5 h-5 text-zinc-400" />
                                                    )}
                                                </div>
                                                <span className="font-bold text-zinc-800">{p.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-zinc-500">{getCategoryLabel(p.category)}</td>
                                        <td className="py-3 px-4 font-mono font-bold text-zinc-650">{p.locationCode || `Korytarz ${p.zone}`}</td>
                                        <td className="py-3 px-4 text-right select-none">
                                            <div className="flex justify-end items-center gap-1.5 flex-nowrap">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={draftThresholds[p.sku] !== undefined ? draftThresholds[p.sku] : p.reorderThreshold}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value);
                                                        setDraftThresholds(prev => ({ ...prev, [p.sku]: isNaN(val) ? 0 : val }));
                                                    }}
                                                    disabled={pendingThresholdSku === p.sku}
                                                    className="w-12 h-6 text-center font-mono text-[11px] font-bold text-zinc-800 border border-zinc-250 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                                {(draftThresholds[p.sku] !== undefined && draftThresholds[p.sku] !== p.reorderThreshold) && (
                                                    <button
                                                        onClick={() => saveThresholdUpdate(p)}
                                                        disabled={pendingThresholdSku === p.sku}
                                                        className="h-6 w-6 rounded bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition-colors cursor-pointer shadow-sm shrink-0 border-none active:scale-[0.93]"
                                                        title="Zapisz próg ostrzeżenia"
                                                    >
                                                        <Check className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-right font-mono text-zinc-650">{(p.price || 199.99).toFixed(2)}</td>
                                        <td className="py-3 px-4 text-center font-mono text-zinc-600 select-none">
                                            <span className="bg-zinc-100 text-zinc-800 font-bold px-2 py-0.5 rounded text-[10px] border border-zinc-200">
                                                {p.vatRate ?? 23}%
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-center select-none">
                                            {(() => {
                                                const calculatedStatus = p.stock === 0 ? 'Out of Stock' : p.stock <= p.reorderThreshold ? 'Low Stock' : 'In Stock';
                                                const label = polishStatusMap[calculatedStatus];
                                                const badgeClass = calculatedStatus === 'In Stock'
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                    : calculatedStatus === 'Low Stock'
                                                        ? 'bg-amber-50 text-amber-850 border-amber-250'
                                                        : 'bg-red-50 text-red-750 border-red-200';
                                                return (
                                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-block border ${badgeClass}`}>
                                                        {label}
                                                    </span>
                                                );
                                            })()}
                                        </td>
                                        <td className={`py-3 px-4 text-right font-mono ${getStockQtyStyle(p.stock, p.reorderThreshold)}`}>{p.stock}</td>
                                        <td className="py-3 px-4 text-right select-none">
                                            <div className="flex justify-end items-center gap-1.5 flex-nowrap">
                                                <div className="flex items-center border border-zinc-250 rounded overflow-hidden h-7 bg-white">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (draftVal > 0) {
                                                                setDraftStocks(prev => ({ ...prev, [p.sku]: draftVal - 1 }));
                                                            }
                                                        }}
                                                        disabled={pendingSku === p.sku}
                                                        className="w-7 h-full flex items-center justify-center bg-zinc-50 hover:bg-zinc-100 border-r border-zinc-200 transition-colors text-zinc-650 cursor-pointer disabled:opacity-40 border-none"
                                                    >
                                                        <Minus className="w-3.5 h-3.5" />
                                                    </button>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={draftVal}
                                                        onChange={(e) => {
                                                            const val = parseInt(e.target.value);
                                                            setDraftStocks(prev => ({ ...prev, [p.sku]: isNaN(val) ? 0 : val }));
                                                        }}
                                                        disabled={pendingSku === p.sku}
                                                        className="w-12 h-full text-center font-mono text-[11px] font-bold text-zinc-800 outline-none bg-white border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setDraftStocks(prev => ({ ...prev, [p.sku]: draftVal + 1 }));
                                                        }}
                                                        disabled={pendingSku === p.sku}
                                                        className="w-7 h-full flex items-center justify-center bg-zinc-50 hover:bg-zinc-100 border-l border-zinc-200 transition-colors text-zinc-650 cursor-pointer disabled:opacity-40 border-none"
                                                    >
                                                        <Plus className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                                {isChanged && (
                                                    <button
                                                        onClick={() => saveStockUpdate(p)}
                                                        disabled={pendingSku === p.sku}
                                                        className="h-7 w-7 rounded bg-blue-600 hover:bg-blue-750 text-white flex items-center justify-center transition-colors cursor-pointer shadow-sm shrink-0 border-none"
                                                        title="Zatwierdź i zapisz zmianę stanu"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                )}
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

            {/* BULK VAT RATE EDITOR MODAL */}
            {isVatModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white w-full max-w-md rounded-2xl border border-slate-100 shadow-2xl overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="bg-slate-50 px-5 py-3.5 border-b border-slate-150 flex items-center justify-between shrink-0 select-none">
                            <div>
                                <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                                    <Percent className="w-4 h-4 text-indigo-655" />
                                    Masowa edycja stawek VAT
                                </h3>
                                <p className="text-[10px] text-slate-500 font-medium">Zbiorcza zmiana podatku VAT dla wybranej kategorii</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsVatModalOpen(false)}
                                className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-655 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                            >
                                <X className="w-4.5 h-4.5" />
                            </button>
                        </div>

                        {/* Modal Body Form */}
                        <div className="p-5 space-y-4 text-left">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 select-none">Kategoria SKU</label>
                                <select
                                    value={selectedVatCategory}
                                    onChange={(e) => setSelectedVatCategory(e.target.value)}
                                    className="w-full p-2 border border-zinc-300 rounded-lg bg-white text-xs text-zinc-800 outline-none cursor-pointer font-semibold"
                                >
                                    {categories.map(category => (
                                        <option key={category} value={category}>{getCategoryLabel(category)}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 select-none">Nowa stawka VAT</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {[23, 8, 5, 0].map((rate) => (
                                        <button
                                            key={rate}
                                            type="button"
                                            onClick={() => setSelectedVatRate(rate)}
                                            className={`py-2 px-3 text-xs font-bold font-mono rounded-lg border transition-all cursor-pointer ${
                                                selectedVatRate === rate
                                                    ? 'bg-indigo-655 border-indigo-655 text-white shadow-sm'
                                                    : 'bg-white border-zinc-250 text-zinc-700 hover:bg-zinc-50'
                                            }`}
                                        >
                                            {rate}%
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <p className="text-[10px] text-slate-400 leading-normal select-none italic pt-1.5">
                                Uwaga: Zatwierdzenie tej operacji zaktualizuje stawkę VAT dla wszystkich istniejących produktów w strefie i kategorii "{getCategoryLabel(selectedVatCategory)}". Operacja zostanie zapamiętana w rejestrze zdarzeń WMS.
                            </p>
                        </div>

                        {/* Modal Footer */}
                        <div className="bg-slate-50 px-5 py-3 border-t border-slate-150 flex items-center justify-end gap-2.5 shrink-0 select-none">
                            <button
                                type="button"
                                onClick={() => setIsVatModalOpen(false)}
                                className="h-8.5 px-3 rounded-lg border border-zinc-250 text-zinc-650 hover:bg-zinc-100 hover:text-zinc-850 bg-white font-bold text-xs cursor-pointer transition-colors"
                            >
                                Anuluj
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    if (onUpdateBulkCategoryVat && selectedVatCategory) {
                                        sounds.playSuccess();
                                        onUpdateBulkCategoryVat(selectedVatCategory, selectedVatRate);
                                    }
                                    setIsVatModalOpen(false);
                                }}
                                className="h-8.5 px-4.5 rounded-lg bg-indigo-600 hover:bg-indigo-750 text-white font-bold text-xs cursor-pointer shadow-sm border-none transition-colors active:scale-[0.97]"
                            >
                                Zatwierdź zmianę
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* OPTION 84: SCRAP LEDGER MODAL (Protokół Strat Wewnętrznych RW) */}
            {isScrapModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white w-full max-w-lg rounded-3xl border border-slate-100 shadow-2xl overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="bg-rose-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                                    <AlertTriangle className="w-4.5 h-4.5 text-rose-300" />
                                    Protokół Strat Wewnętrznych RW (Opcja 84)
                                </h3>
                                <p className="text-[11px] text-rose-200 mt-0.5">Spisanie uszkodzonego/zniszczonego towaru ze stanu magazynowego</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsScrapModalOpen(false)}
                                className="p-1.5 hover:bg-rose-800 text-rose-200 hover:text-white rounded-xl transition-colors border-none bg-transparent cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Form */}
                        <div className="p-6 space-y-4 text-left font-sans text-xs">
                            <div>
                                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                                    Wybierz Produkt do Spisania:
                                </label>
                                <select
                                    value={scrapSelectedSku}
                                    onChange={(e) => setScrapSelectedSku(e.target.value)}
                                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 outline-none"
                                >
                                    {products.map(p => (
                                        <option key={p.sku} value={p.sku}>
                                            {p.sku} — {p.name} (Na stanie: {p.stock} szt.)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                                        Liczba Sztuk do Spisania (RW):
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={products.find(p => p.sku === scrapSelectedSku)?.stock || 99}
                                        value={scrapQty}
                                        onChange={(e) => setScrapQty(Math.max(1, Number(e.target.value)))}
                                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs font-bold text-slate-900"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                                        Osoba Sporządzająca:
                                    </label>
                                    <input
                                        type="text"
                                        value={scrapInspector}
                                        onChange={(e) => setScrapInspector(e.target.value)}
                                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-semibold"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                                    Przyczyna Powstania Straty:
                                </label>
                                <select
                                    value={scrapReason}
                                    onChange={(e) => setScrapReason(e.target.value)}
                                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-semibold outline-none"
                                >
                                    <option value="Upadek z wideł wózka">💥 Upadek z wideł wózka / uszkodzenie mechaniczne</option>
                                    <option value="Zalanie płynem z pękniętej butelki">💧 Zalanie płynem / chemikaliami z sąsiedniej palety</option>
                                    <option value="Zgniecenie pod paletą">📦 Zgniecenie pod zbyt ciężką paletą w regale</option>
                                    <option value="Wada ukryta fabryczna">⚙️ Wada ukryta fabryczna (wykryta przy pobraniu)</option>
                                    <option value="Przeterminowanie / zepsucie">⌛ Przeterminowanie / utrata zdatności (FEFO)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                                    Dodatkowe Uwagi / Numer Zlecenia:
                                </label>
                                <input
                                    type="text"
                                    placeholder="np. Miejsce zdarzenia: Alejka A-02, stłuczona 1 butelka..."
                                    value={scrapNotes}
                                    onChange={(e) => setScrapNotes(e.target.value)}
                                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
                                />
                            </div>

                            <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-[11px] text-rose-800 leading-relaxed">
                                <strong>Skutek księgowy:</strong> Zatwierdzenie dokumentu RW natychmiast odejmie <strong>{scrapQty} szt.</strong> ze stanu magazynowego i zarejestruje wpis w Dzienniku Korekt (Opcja 87).
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
                            <button
                                type="button"
                                onClick={() => setIsScrapModalOpen(false)}
                                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer bg-white"
                            >
                                Anuluj
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmScrap}
                                className="px-5 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer border-none flex items-center gap-1.5"
                            >
                                <AlertTriangle className="w-4 h-4" />
                                Wystaw Protokół RW & Odejmij ze Stanu
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* OPTION 87: AUDIT ADJUSTMENT LEDGER MODAL (Dziennik Korekt i Zdarzeń Magazynowych) */}
            {isHistoryModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white w-full max-w-4xl rounded-3xl border border-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                        {/* Header */}
                        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                                    <History className="w-4.5 h-4.5 text-sky-400" />
                                    Dziennik Korekt i Zdarzeń Magazynowych (Opcja 87)
                                </h3>
                                <p className="text-[11px] text-slate-400 mt-0.5">Śledzenie wszystkich ruchów stanów magazynowych (PZ, WZ, RW, INW)</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsHistoryModalOpen(false)}
                                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors border-none bg-transparent cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Filter Bar */}
                        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-1.5 font-bold">
                                {[
                                    { id: 'ALL', label: 'Wszystkie Ruchy' },
                                    { id: 'PZ', label: 'PZ (Przyjęcia)' },
                                    { id: 'WZ', label: 'WZ (Wydania)' },
                                    { id: 'RW', label: 'RW (Straty)' },
                                    { id: 'INW', label: 'INW (Inwentaryzacja)' }
                                ].map(f => (
                                    <button
                                        key={f.id}
                                        type="button"
                                        onClick={() => setHistoryFilterType(f.id)}
                                        className={`px-3 py-1 rounded-lg transition-all cursor-pointer border ${
                                            historyFilterType === f.id 
                                                ? 'bg-slate-900 text-white border-slate-900 shadow-xs' 
                                                : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                                        }`}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                            <span className="font-mono text-slate-500 text-[11px]">
                                Łącznie wpisów w dzienniku: <strong className="text-slate-900">{auditAdjustments.length}</strong>
                            </span>
                        </div>

                        {/* Table */}
                        <div className="p-6 overflow-y-auto flex-1">
                            <table className="w-full text-left text-xs font-sans border-collapse">
                                <thead>
                                    <tr className="bg-slate-100 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px]">
                                        <th className="p-3">ID / Data</th>
                                        <th className="p-3">Typ & Nr Dokumentu</th>
                                        <th className="p-3">SKU & Nazwa Towaru</th>
                                        <th className="p-3 text-right">Korekta (Delta)</th>
                                        <th className="p-3">Przyczyna / Kontekst</th>
                                        <th className="p-3">Operator</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium">
                                    {auditAdjustments
                                        .filter(item => historyFilterType === 'ALL' || item.type === historyFilterType)
                                        .map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50/70 font-sans">
                                                <td className="p-3 font-mono">
                                                    <span className="font-bold text-slate-900 block">{item.id}</span>
                                                    <span className="text-[10px] text-slate-400">{item.date}</span>
                                                </td>

                                                <td className="p-3">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase inline-block ${
                                                        item.type === 'PZ' ? 'bg-emerald-100 text-emerald-800' :
                                                        item.type === 'WZ' ? 'bg-blue-100 text-blue-800' :
                                                        item.type === 'RW' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-900'
                                                    }`}>
                                                        {item.type}
                                                    </span>
                                                    <span className="font-mono text-[10px] text-slate-500 block mt-0.5">{item.docRef}</span>
                                                </td>

                                                <td className="p-3">
                                                    <div className="font-bold text-slate-900">{item.name}</div>
                                                    <div className="font-mono text-[10px] text-slate-400">{item.sku}</div>
                                                </td>

                                                <td className={`p-3 text-right font-mono text-sm font-black ${
                                                    item.delta > 0 ? 'text-emerald-600' : 'text-rose-600'
                                                }`}>
                                                    {item.delta > 0 ? `+${item.delta}` : item.delta} szt.
                                                </td>

                                                <td className="p-3 text-slate-600 text-[11px] max-w-xs">
                                                    {item.reason}
                                                </td>

                                                <td className="p-3 text-slate-700 text-[11px]">
                                                    <span className="font-bold block">{item.actor}</span>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer */}
                        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end shrink-0">
                            <button
                                type="button"
                                onClick={() => setIsHistoryModalOpen(false)}
                                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer border-none shadow-sm"
                            >
                                Zamknij Dziennik
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* OPTION 88: EQUIPMENT TICKETS HELPDESK MODAL */}
            {isTicketsModalOpen && (
                <div className="fixed inset-0 bg-[#020617]/75 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
                        {/* Header */}
                        <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
                                    <Wrench className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-bold tracking-tight">Rejestr Zgłoszeń Awarii Sprzętu (IT Helpdesk)</h3>
                                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold">OPCJA 88</span>
                                    </div>
                                    <p className="text-[11px] text-slate-400">Zgłoszenia awarii skanerów, drukarek i wag wysyłane przez pracowników</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsTicketsModalOpen(false)}
                                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors border-none bg-transparent cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-4 overflow-y-auto flex-1 space-y-3 bg-slate-50">
                            {equipmentTickets.length === 0 ? (
                                <div className="p-8 text-center text-slate-500 text-xs font-semibold">
                                    Brak zarejestrowanych zgłoszeń awarii sprzętu.
                                </div>
                            ) : (
                                equipmentTickets.map((ticket: any) => {
                                    const isResolved = ticket.status === 'NAPRAWIONE';
                                    return (
                                        <div key={ticket.id} className={`p-4 rounded-xl border bg-white shadow-2xs transition-all ${
                                            isResolved ? 'border-emerald-200 bg-emerald-50/20 opacity-75' : 'border-slate-200'
                                        }`}>
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2 mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-xs font-black text-slate-800">{ticket.id}</span>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                                                        ticket.urgency === 'Wysoki' ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                                                    }`}>
                                                        Priorytet: {ticket.urgency}
                                                    </span>
                                                    <span className="text-[11px] font-bold text-slate-700">{ticket.deviceType}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                                        isResolved ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800 animate-pulse'
                                                    }`}>
                                                        {ticket.status}
                                                    </span>
                                                </div>
                                            </div>

                                            <p className="text-xs text-slate-700 leading-relaxed font-medium mb-3">
                                                {ticket.description}
                                            </p>

                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] text-slate-400 font-mono pt-1">
                                                <span>Lokalizacja: <strong className="text-slate-700">{ticket.station}</strong> • Zgłosił: <strong className="text-slate-700">{ticket.reportedBy}</strong> ({ticket.reportedAt})</span>
                                                {!isResolved && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleResolveTicket(ticket.id)}
                                                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] cursor-pointer border-none shadow-2xs transition-colors self-end"
                                                    >
                                                        ✓ Oznacz jako naprawione
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-3 bg-white border-t border-slate-200 flex justify-end shrink-0">
                            <button
                                type="button"
                                onClick={() => setIsTicketsModalOpen(false)}
                                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer border-none shadow-sm"
                            >
                                Zamknij
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
