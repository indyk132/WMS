import React, { useState } from 'react';
import { Package, Search, PlusCircle, AlertTriangle, PlayCircle, Info, RefreshCw, Layers, Plus, Minus, Check } from 'lucide-react';

const polishStatusMap = {
    'In Stock': 'Dostępny',
    'Low Stock': 'Niski stan',
    'Out of Stock': 'Brak na stanie',
};

const getCategoryLabel = (category) => {
    if (category === 'Zywnosc') return 'Żywność';
    return category;
};

const getStockQtyStyle = (stock, threshold) => {
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

export default function Products({ products, onUpdateStock, onRestockItem }) {
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [draftStocks, setDraftStocks] = useState({});
    const [pendingSku, setPendingSku] = useState('');
    const [stockError, setStockError] = useState('');
    const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean))).sort();

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.sku.toLowerCase().includes(search.toLowerCase()) ||
            p.zone.toLowerCase().includes(search.toLowerCase());
        const matchesCat = categoryFilter ? p.category === categoryFilter : true;
        const matchesStatus = statusFilter ? p.status === statusFilter : true;
        return matchesSearch && matchesCat && matchesStatus;
    });

    const saveStockUpdate = async (product) => {
        const draft = draftStocks[product.sku];
        if (draft === undefined) return;

        const delta = Number(draft) - product.stock;
        if (delta === 0) return;

        setStockError('');
        setPendingSku(product.sku);

        try {
            await onUpdateStock(product, delta);
            setDraftStocks(prev => {
                const copy = { ...prev };
                delete copy[product.sku];
                return copy;
            });
        } catch (error) {
            setStockError(error.message || 'Nie udało się zaktualizować stanu.');
        } finally {
            setPendingSku('');
        }
    };

    return (
        <div className="space-y-6 font-sans text-sm text-[#0b1c30]">
            {}
            <div className="flex justify-between items-end mb-2">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900 leading-tight border-none">Katalog Zapasów SKU</h2>
                    <p className="text-zinc-500 text-xs mt-1">Stan zapasów produktów w czasie rzeczywistym, poziomy ostrzegawcze i lokalizacje.</p>
                </div>
                <button
                    onClick={async () => {
                        setStockError('');

                        try {
                            for (const product of products) {
                                if (product.stock < product.reorderThreshold) {
                                    await onRestockItem(product);
                                }
                            }
                        } catch (error) {
                            setStockError(error.message || 'Nie udalo sie uzupelnic brakow.');
                        }
                    }}
                    className="h-9 px-4 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
                >
                    <RefreshCw className="w-4 h-4" /> Automatyczne uzupełnienie braków
                </button>
            </div>

            {stockError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-xs font-semibold">
                    {stockError}
                </div>
            )}

            {}
            <div className="bg-white rounded border border-[#c6c6cd] shadow-sm p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">Szukaj asortymentu</label>
                    <div className="relative">
                        <Search className="w-4 h-4 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Wpisz SKU lub nazwę towaru..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 border border-zinc-350 rounded focus:ring-1 focus:ring-blue-500 bg-white text-xs outline-none"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">Filtruj wg kategorii</label>
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="w-full p-2 border border-zinc-355 rounded bg-white text-xs text-zinc-800 outline-none"
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
                        className="w-full p-2 border border-zinc-355 rounded bg-white text-xs text-zinc-800 outline-none"
                    >
                        <option value="">Wszystkie statusy</option>
                        <option value="In Stock">Dostępny</option>
                        <option value="Low Stock">Niski stan</option>
                        <option value="Out of Stock">Brak na stanie</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded border border-[#c6c6cd] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                        <tr className="bg-zinc-50 font-bold text-zinc-650 text-xs border-b border-[#c6c6cd]">
                            <th className="py-2.5 px-4 font-bold">Kod SKU</th>
                            <th className="py-2.5 px-4 font-bold">Nazwa towaru podzespołu</th>
                            <th className="py-2.5 px-4 font-bold">Kategoria</th>
                            <th className="py-2.5 px-4 font-bold">Położenie</th>
                            <th className="py-2.5 px-4 text-right font-bold">Próg ostrzeżenia (szt.)</th>
                            <th className="py-2.5 px-4 text-right font-bold">Cena jednostkowa (PLN)</th>
                            <th className="py-2.5 px-4 text-center font-bold">Status</th>
                            <th className="py-2.5 px-4 text-right font-bold w-12">Ilość (szt.)</th>
                            <th className="py-2.5 px-4 text-right font-bold w-48">Akcje stanu</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 text-xs font-medium text-zinc-850">
                        {filteredProducts.length === 0 ? (
                            <tr>
                                <td colSpan="9" className="py-10 text-center text-zinc-400 font-bold bg-white">Brak pozycji SKU pasujących do podanych filtrów.</td>
                            </tr>
                        ) : (
                            filteredProducts.map(p => {
                                const draftVal = draftStocks[p.sku] !== undefined ? draftStocks[p.sku] : p.stock;
                                const isChanged = draftVal !== p.stock;

                                return (
                                    <tr key={p.sku} className="hover:bg-zinc-50/70 transition-colors">
                                        <td className="py-3 px-4 font-mono font-bold text-blue-600">{p.sku}</td>
                                        <td className="py-3 px-4 font-normal text-zinc-700">{p.name}</td>
                                        <td className="py-3 px-4 text-zinc-500">{getCategoryLabel(p.category)}</td>
                                        <td className="py-3 px-4 font-mono font-bold text-zinc-650">{p.locationCode || `Korytarz ${p.zone}`}</td>
                                        <td className="py-3 px-4 text-right font-mono text-zinc-500">{p.reorderThreshold}</td>
                                        <td className="py-3 px-4 text-right font-mono text-zinc-650">{(p.price || 199.99).toFixed(2)}</td>
                                        <td className="py-3 px-4 text-center">
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
                                        <td className="py-3 px-4 text-right">
                                            <div className="flex justify-end items-center gap-1.5 flex-nowrap">
                                                <div className="flex items-center border border-zinc-350 rounded overflow-hidden h-7 bg-white">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (draftVal > 0) {
                                                                setDraftStocks(prev => ({ ...prev, [p.sku]: draftVal - 1 }));
                                                            }
                                                        }}
                                                        disabled={pendingSku === p.sku}
                                                        className="w-7 h-full flex items-center justify-center bg-zinc-50 hover:bg-zinc-100 border-r border-zinc-200 transition-colors text-zinc-650 cursor-pointer disabled:opacity-40"
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
                                                        className="w-7 h-full flex items-center justify-center bg-zinc-50 hover:bg-zinc-100 border-l border-zinc-200 transition-colors text-zinc-650 cursor-pointer disabled:opacity-40"
                                                    >
                                                        <Plus className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                                {isChanged && (
                                                    <button
                                                        onClick={() => saveStockUpdate(p)}
                                                        disabled={pendingSku === p.sku}
                                                        className="h-7 w-7 rounded bg-blue-600 hover:bg-blue-750 text-white flex items-center justify-center transition-colors cursor-pointer shadow-sm shrink-0"
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
        </div>
    );
}
