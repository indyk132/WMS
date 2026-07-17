import React, { useState } from 'react';
import { Search, RefreshCw, Minus, Plus, Check, Package, X, Percent } from 'lucide-react';
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
        return matchesSearch && matchesCat && matchesStatus;
    });

    const saveStockUpdate = async (product: Product) => {
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

    return (
        <div className="space-y-6 font-sans text-sm text-[#0b1c30] animate-fadeIn">
            <div className="flex justify-between items-end mb-2">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900 leading-tight border-none">Katalog Zapasów SKU</h2>
                    <p className="text-zinc-500 text-xs mt-1">Stan zapasów produktów w czasie rzeczywistym, poziomy ostrzegawcze i lokalizacje.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            if (categories.length > 0) {
                                setSelectedVatCategory(categories[0]);
                            }
                            setIsVatModalOpen(true);
                        }}
                        className="h-9 px-4 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-sm border-none"
                    >
                        <Percent className="w-4 h-4" /> Masowa edycja VAT
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
                        className="h-9 px-4 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-sm border-none"
                    >
                        <RefreshCw className="w-4 h-4" /> Automatyczne uzupełnienie braków
                    </button>
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
        </div>
    );
}
