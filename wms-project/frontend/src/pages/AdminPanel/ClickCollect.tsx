import React, { useState, useMemo } from 'react';
import { Search, MapPin, CheckCircle2, User, Clock, Package, AlertTriangle, ShieldCheck, Key, Smartphone, Lock, RefreshCw, Send, Check } from 'lucide-react';
import { sounds } from '../../components/SoundEffects';

interface ClickCollectProps {
    orders: any[];
    onUpdateOrder: (updatedOrder: any) => void;
    currentUser: any;
    logActivity: (message: string, type: string, details?: string) => void;
    addToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

// 6-Character Alphanumeric Code Generator (A-Z, 2-9 without ambiguous chars)
export const generate6CharBopisCode = (): string => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

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
    
    // Locker Assignment & Generator State (Option 971)
    const [selectedOrderForCode, setSelectedOrderForCode] = useState<string>('');
    const [generatedCode, setGeneratedCode] = useState<string>('');
    const [assignedLocker, setAssignedLocker] = useState<string>('Skrytka A1');
    const [copiedCode, setCopiedCode] = useState(false);

    // Active BOPIS orders ready for pickup
    const pendingBopisOrders = useMemo(() => {
        return orders.filter(o => o.isPickup && o.status !== 'Dostarczone');
    }, [orders]);

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
            addToast('Proszę wpisać 6-znakowy kod PIN (litery i cyfry)', 'warning');
            return;
        }

        const found = orders.find(o => o.isPickup && (
            o.pickupCode?.toUpperCase() === cleanedPin ||
            o.id?.toUpperCase() === cleanedPin
        ));

        if (found) {
            sounds.playSuccess();
            setSearchedOrder(found);
            const initialChecklist: Record<string, boolean> = {};
            (found.items || []).forEach((item: any) => {
                initialChecklist[item.sku] = false;
            });
            setCheckedItems(initialChecklist);
            addToast(`Znaleziono zamówienie: ${found.id} (Kod PIN: ${found.pickupCode || 'Brak'})`, 'success');
        } else {
            sounds.playError();
            setSearchedOrder(null);
            addToast(`Nie znaleziono zamówienia o kodzie "${cleanedPin}". Wymagany format: 6 znaków alfanumerycznych (np. W8K2M9)`, 'error');
        }
    };

    const handleGenerateNewCode = () => {
        if (!selectedOrderForCode) {
            addToast('Wybierz zamówienie z listy oczekujących', 'warning');
            return;
        }
        sounds.playBeep();
        const newCode = generate6CharBopisCode();
        setGeneratedCode(newCode);

        const targetOrder = orders.find(o => o.id === selectedOrderForCode);
        if (targetOrder) {
            const updated = {
                ...targetOrder,
                pickupCode: newCode,
                lockerBox: assignedLocker,
                status: 'Gotowe do odbioru'
            };
            onUpdateOrder(updated);
            logActivity(`Wygenerowano 6-znakowy kod BOPIS ${newCode} dla ${targetOrder.id} (${assignedLocker})`, 'info');
            addToast(`Wygenerowano kod ${newCode} i przypisano do ${assignedLocker}!`, 'success');
        }
    };

    const toggleItemCheck = (sku: string) => {
        sounds.playBeep();
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

                {/* Right column: 6-Char PIN Generator, Locker Grid & Recent Pickups */}
                <div className="space-y-6">
                    {/* GENERATOR KODÓW 6-ZNAKOWYCH BOPIS (OPTION 971) */}
                    <div className="bg-gradient-to-br from-zinc-950 to-indigo-950/40 border border-indigo-900/40 p-5 shadow-xl space-y-4 font-mono">
                        <div className="flex items-center justify-between border-b border-indigo-900/50 pb-2.5">
                            <div className="flex items-center gap-2">
                                <Key className="w-4 h-4 text-indigo-400" />
                                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-200">
                                    Generator 6-znakowych PIN (Alfanumeryczny)
                                </h3>
                            </div>
                            <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
                                6-CHAR A-Z / 2-9
                            </span>
                        </div>

                        <div className="space-y-3 text-xs">
                            <div>
                                <label className="text-[10px] text-zinc-400 block mb-1">Wybierz Zamówienie BOPIS:</label>
                                <select
                                    value={selectedOrderForCode}
                                    onChange={(e) => setSelectedOrderForCode(e.target.value)}
                                    className="w-full bg-black border border-zinc-800 text-zinc-200 p-2 text-xs rounded outline-none focus:border-indigo-500"
                                >
                                    <option value="">-- Wybierz zlecenie do przypisania --</option>
                                    {pendingBopisOrders.map(o => (
                                        <option key={o.id} value={o.id}>
                                            {o.id} • {o.customer} ({o.pickupCode ? `PIN: ${o.pickupCode}` : 'Brak PIN'})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-[10px] text-zinc-400 block mb-1">Przypisz Skrytkę / Punkt:</label>
                                <select
                                    value={assignedLocker}
                                    onChange={(e) => setAssignedLocker(e.target.value)}
                                    className="w-full bg-black border border-zinc-800 text-zinc-200 p-2 text-xs rounded outline-none focus:border-indigo-500"
                                >
                                    {['Skrytka A1', 'Skrytka A2', 'Skrytka B1', 'Skrytka B2', 'Skrytka C1', 'Skrytka C2', 'Skrytka D1', 'Skrytka D2'].map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                type="button"
                                onClick={handleGenerateNewCode}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 text-xs rounded shadow transition-all flex items-center justify-center gap-2 cursor-pointer border-none"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Generuj 6-znakowy Kod BOPIS
                            </button>

                            {generatedCode && (
                                <div className="p-3 bg-indigo-950/60 border border-indigo-700/50 rounded-lg space-y-1.5 animate-fadeIn">
                                    <div className="text-[10px] text-indigo-300 font-bold">AKTYWNY KOD PIN DLA KLIENTA:</div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xl font-black tracking-widest text-emerald-400 bg-black/60 px-3 py-1 rounded border border-emerald-500/40">
                                            {generatedCode}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                navigator.clipboard.writeText(generatedCode);
                                                setCopiedCode(true);
                                                sounds.playSuccess();
                                                setTimeout(() => setCopiedCode(false), 2000);
                                            }}
                                            className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] rounded cursor-pointer transition-all border border-zinc-700 flex items-center gap-1"
                                        >
                                            {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Smartphone className="w-3 h-3" />}
                                            {copiedCode ? 'Skopiowano!' : 'Kopiuj'}
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-zinc-400 mt-1">
                                        📲 SMS: <em>"Twoja paczka czeka w HUB-PL-01 ({assignedLocker}). Kod odbioru: {generatedCode}"</em>
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RECENT PICKUPS */}
                    <div className="bg-zinc-950 border border-zinc-900 p-6 shadow-xl space-y-4">
                        <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
                                Dzisiejsze wydania ({todayPickups.length})
                            </h2>
                            <span className="text-[9px] bg-zinc-900 text-zinc-500 px-2 py-0.5 font-mono">BOPIS</span>
                        </div>

                        {todayPickups.length > 0 ? (
                            <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                                {todayPickups.map((o) => (
                                    <div key={o.id} className="p-3 bg-zinc-900/40 border border-zinc-900 hover:border-zinc-800 transition-colors font-mono space-y-2 text-left">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-zinc-300">{o.id}</span>
                                            <span className="text-[9px] text-emerald-400 font-bold bg-emerald-950/20 px-2 py-0.5 border border-emerald-900/40">WYDANO</span>
                                        </div>
                                        <div className="text-[10px] text-zinc-400 space-y-1">
                                            <p><span className="text-zinc-600">Odbiorca:</span> {o.customer}</p>
                                            <p><span className="text-zinc-600">PIN:</span> <strong className="text-zinc-300">{o.pickupCode || 'BOPIS'}</strong></p>
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
