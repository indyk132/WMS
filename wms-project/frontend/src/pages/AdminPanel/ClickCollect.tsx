import React, { useState, useMemo } from 'react';
import { Search, MapPin, CheckCircle2, User, Clock, Package, AlertTriangle, ShieldCheck } from 'lucide-react';

interface ClickCollectProps {
    orders: any[];
    onUpdateOrder: (updatedOrder: any) => void;
    currentUser: any;
    logActivity: (message: string, type: string, details?: string) => void;
    addToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export default function ClickCollect({
    orders,
    onUpdateOrder,
    currentUser,
    logActivity,
    addToast
}: ClickCollectProps) {
    const [pinInput, setPinInput] = useState('');
    const [searchedOrder, setSearchedOrder] = useState<any | null>(null);
    const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

    // Filter for orders picked up today via click and collect
    const todayPickups = useMemo(() => {
        return orders.filter(o => 
            o.isPickup && 
            o.status === 'Dostarczone'
        );
    }, [orders]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const cleanedPin = pinInput.trim().toUpperCase();
        if (!cleanedPin) {
            addToast('Proszę wpisać kod PIN', 'warning');
            return;
        }

        const found = orders.find(o => o.isPickup && o.pickupCode?.toUpperCase() === cleanedPin);
        if (found) {
            setSearchedOrder(found);
            // Reset item checklist
            const initialChecklist: Record<string, boolean> = {};
            found.items.forEach((item: any) => {
                initialChecklist[item.sku] = false;
            });
            setCheckedItems(initialChecklist);
            addToast(`Znaleziono zamówienie: ${found.id}`, 'success');
        } else {
            setSearchedOrder(null);
            addToast('Nie znaleziono zamówienia o podanym kodzie PIN', 'error');
        }
    };

    const toggleItemCheck = (sku: string) => {
        setCheckedItems(prev => ({
            ...prev,
            [sku]: !prev[sku]
        }));
    };

    const handleReleaseOrder = () => {
        if (!searchedOrder) return;

        // Check if all items are checked
        const allChecked = searchedOrder.items.every((item: any) => checkedItems[item.sku]);
        if (!allChecked) {
            addToast('Proszę zweryfikować i zaznaczyć wszystkie pozycje z listy przed wydaniem towaru!', 'warning');
            return;
        }

        const updatedOrder = {
            ...searchedOrder,
            status: 'Dostarczone',
            shipmentDate: new Date().toLocaleDateString('pl-PL', { hour: '2-digit', minute: '2-digit' })
        };

        onUpdateOrder(updatedOrder);
        setSearchedOrder(updatedOrder); // Update local view state

        // Log the activity
        logActivity(
            `Wydano zamówienie BOPIS ${searchedOrder.id} klientowi w punkcie odbioru.`,
            'info',
            `Osoba odbierająca: ${searchedOrder.customer}. Pracownik: ${currentUser?.name || 'WMS'}`
        );

        addToast(`Pomyślnie wydano zamówienie ${searchedOrder.id}!`, 'success');
    };

    return (
        <div className="space-y-6">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-800 pb-5">
                <div>
                    <div className="flex items-center gap-2 text-zinc-400 text-xs uppercase tracking-widest font-mono mb-1">
                        <MapPin size={12} className="text-emerald-500 animate-pulse" />
                        <span>Punkt wydań osobistych</span>
                    </div>
                    <h1 className="text-xl font-bold tracking-tight text-white font-display">
                        Obsługa Odbiorów Click-and-Collect (BOPIS)
                    </h1>
                </div>
            </div>

            {/* Main grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left column: Search and Verification Card */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Search PIN form */}
                    <div className="bg-zinc-950 border border-zinc-900 p-6 shadow-xl space-y-4">
                        <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
                            Weryfikacja Kodu Klienta
                        </h2>
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                                <input
                                    type="text"
                                    placeholder="Wpisz kod PIN (np. PU-123456)..."
                                    value={pinInput}
                                    onChange={(e) => setPinInput(e.target.value)}
                                    className="w-full bg-black border border-zinc-850 hover:border-zinc-700 focus:border-zinc-500 text-xs text-white pl-10 pr-4 py-3 rounded-none focus:outline-none font-mono"
                                />
                            </div>
                            <button
                                type="submit"
                                className="bg-zinc-100 hover:bg-zinc-200 text-black px-6 py-3 text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer"
                            >
                                Wyszukaj
                            </button>
                        </form>
                    </div>

                    {/* Order Details Verification Section */}
                    {searchedOrder ? (
                        <div className="bg-zinc-950 border border-zinc-900 p-6 shadow-xl space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-zinc-900 pb-4 gap-2">
                                <div>
                                    <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">KOD ZAMÓWIENIA</div>
                                    <h3 className="text-base font-bold text-white font-mono">{searchedOrder.id}</h3>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">STATUS WMS</div>
                                    <span className={`inline-block px-2.5 py-0.5 text-[10px] font-mono font-bold border ${
                                        searchedOrder.status === 'Dostarczone'
                                            ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800'
                                            : searchedOrder.status === 'Gotowe do odbioru'
                                            ? 'bg-blue-950/40 text-blue-400 border-blue-800'
                                            : 'bg-yellow-950/40 text-yellow-400 border-yellow-800'
                                    }`}>
                                        {searchedOrder.status}
                                    </span>
                                </div>
                            </div>

                            {/* Customer information card */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-900/30 p-4 border border-zinc-900 font-mono text-xs">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-zinc-400">
                                        <User size={14} className="text-zinc-500" />
                                        <span>Klient:</span>
                                        <strong className="text-zinc-200">{searchedOrder.customer}</strong>
                                    </div>
                                    <div className="flex items-center gap-2 text-zinc-400">
                                        <Clock size={14} className="text-zinc-500" />
                                        <span>Złożono:</span>
                                        <span className="text-zinc-300">{searchedOrder.shipmentDate || 'Nieznany'}</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-zinc-400">
                                        <MapPin size={14} className="text-zinc-500" />
                                        <span>Punkt wydania:</span>
                                        <span className="text-zinc-200">HUB-PL-01 (Warszawa)</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-zinc-400">
                                        <ShieldCheck size={14} className="text-emerald-500" />
                                        <span>PIN klienta:</span>
                                        <strong className="text-emerald-400">{searchedOrder.pickupCode}</strong>
                                    </div>
                                </div>
                            </div>

                            {/* Alert if not packed yet */}
                            {searchedOrder.status !== 'Gotowe do odbioru' && searchedOrder.status !== 'Dostarczone' && (
                                <div className="bg-yellow-950/30 border border-yellow-800 p-4 flex gap-3 text-left">
                                    <AlertTriangle className="text-yellow-500 shrink-0 mt-0.5" size={16} />
                                    <div>
                                        <h4 className="text-xs font-bold text-yellow-400 font-mono">Zamówienie w trakcie kompletacji</h4>
                                        <p className="text-[10px] text-yellow-500/80 font-mono mt-0.5 leading-relaxed">
                                            Status zamówienia to: <strong>{searchedOrder.status}</strong>. Paczka nie została jeszcze formalnie spakowana i oznaczona jako gotowa w terminalu. Weryfikacja fizycznych sztuk jest zalecana.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* SKU checklist */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                                    <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                                        Pozycje w paczce (Zweryfikuj)
                                    </span>
                                    <span className="text-[10px] font-mono text-zinc-500">Zaznacz wydawany towar</span>
                                </div>

                                <div className="space-y-2">
                                    {searchedOrder.items.map((item: any) => (
                                        <div
                                            key={item.sku}
                                            onClick={() => searchedOrder.status !== 'Dostarczone' && toggleItemCheck(item.sku)}
                                            className={`p-3 border flex items-center justify-between transition-colors font-mono cursor-pointer ${
                                                checkedItems[item.sku] || searchedOrder.status === 'Dostarczone'
                                                    ? 'bg-emerald-950/15 border-emerald-800 hover:bg-emerald-950/20'
                                                    : 'bg-black border-zinc-850 hover:border-zinc-700'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`h-4 w-4 border flex items-center justify-center transition-colors ${
                                                    checkedItems[item.sku] || searchedOrder.status === 'Dostarczone'
                                                        ? 'bg-emerald-500 border-emerald-400 text-black'
                                                        : 'border-zinc-700 bg-zinc-900'
                                                }`}>
                                                    {(checkedItems[item.sku] || searchedOrder.status === 'Dostarczone') && <CheckCircle2 size={12} className="stroke-[3]" />}
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-zinc-200">{item.name}</div>
                                                    <div className="text-[9px] text-zinc-500">{item.sku}</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs font-bold text-zinc-200">x{item.qty}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Release Action Button */}
                            {searchedOrder.status === 'Dostarczone' ? (
                                <div className="p-4 border border-zinc-800 bg-zinc-900/40 text-center font-mono text-xs text-zinc-400 flex items-center justify-center gap-2">
                                    <CheckCircle2 className="text-emerald-500" size={16} />
                                    <span>Paczka została pomyślnie wydana klientowi.</span>
                                </div>
                            ) : (
                                <button
                                    onClick={handleReleaseOrder}
                                    className="w-full bg-emerald-500 text-black hover:bg-emerald-400 py-3.5 text-xs font-mono font-bold uppercase tracking-widest text-center transition-colors shadow-lg cursor-pointer"
                                >
                                    Potwierdź i Wydaj Paczkę Klientowi 📦
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="bg-zinc-950 border border-zinc-900 p-12 text-center text-zinc-500 font-mono text-xs space-y-2">
                            <Package className="mx-auto h-8 w-8 text-zinc-700 animate-bounce" />
                            <p>Wpisz kod PIN odbioru klienta, aby rozpocząć proces weryfikacji i wydania towaru.</p>
                        </div>
                    )}
                </div>

                {/* Right column: Recent BOPIS Pickups today */}
                <div className="space-y-6">
                    <div className="bg-zinc-950 border border-zinc-900 p-6 shadow-xl space-y-4">
                        <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
                                Dzisiejsze wydania ({todayPickups.length})
                            </h2>
                            <span className="text-[9px] bg-zinc-900 text-zinc-500 px-2 py-0.5 font-mono">BOPIS</span>
                        </div>

                        {todayPickups.length > 0 ? (
                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                                {todayPickups.map((o) => (
                                    <div key={o.id} className="p-3 bg-zinc-900/40 border border-zinc-900 hover:border-zinc-800 transition-colors font-mono space-y-2 text-left">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-zinc-300">{o.id}</span>
                                            <span className="text-[9px] text-emerald-400 font-bold bg-emerald-950/20 px-2 py-0.5 border border-emerald-900/40">WYDANO</span>
                                        </div>
                                        <div className="text-[10px] text-zinc-400 space-y-1">
                                            <p><span className="text-zinc-600">Odbiorca:</span> {o.customer}</p>
                                            <p><span className="text-zinc-600">Czas wydania:</span> {o.shipmentDate || 'Dzisiaj'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-zinc-600 font-mono text-[11px] space-y-1">
                                <Clock size={16} className="mx-auto text-zinc-700" />
                                <p>Brak dzisiejszych wydań osobistych.</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
