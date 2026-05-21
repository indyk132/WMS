import React, { useState } from 'react';
import { Package, Search, PlusCircle, AlertTriangle, PlayCircle, Info, RefreshCw, Layers } from 'lucide-react';

export default function Products({ products, onUpdateStock, onRestockItem }) {
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [stockAmounts, setStockAmounts] = useState({});
    const [pendingSku, setPendingSku] = useState('');
    const [stockError, setStockError] = useState('');
    const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean))).sort();

    // Sku list filter
    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.sku.toLowerCase().includes(search.toLowerCase()) ||
            p.zone.toLowerCase().includes(search.toLowerCase());
        const matchesCat = categoryFilter ? p.category === categoryFilter : true;
        const matchesStatus = statusFilter ? p.status === statusFilter : true;
        return matchesSearch && matchesCat && matchesStatus;
    });

    const getStockAmount = (sku) => {
        const value = Number(stockAmounts[sku] || 1);
        return Number.isInteger(value) && value > 0 ? value : 1;
    };

    const setStockAmount = (sku, value) => {
        setStockAmounts(prev => ({ ...prev, [sku]: value }));
    };

    const adjustStock = async (product, direction) => {
        const amount = getStockAmount(product.sku);
        const delta = direction === 'add' ? amount : -amount;

        setStockError('');
        setPendingSku(product.sku);

        try {
            await onUpdateStock(product, delta);
        } catch (error) {
            setStockError(error.message || 'Nie udalo sie zaktualizowac stanu.');
        } finally {
            setPendingSku('');
        }
    };

    return (
        <div className="space-y-6 font-sans text-sm text-[#0b1c30]">
            {/* Page Header */}
            <div className="flex justify-between items-end mb-2">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900 leading-tight border-none">SKUs Inventory Directory</h2>
                    <p className="text-zinc-500 text-xs mt-1">Real-time product stock level, reorder threshold values, and aisle positions.</p>
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

            {/* Criteria Filter Controls */}
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
                        className="w-full p-2 border border-zinc-350 rounded bg-white text-xs text-zinc-800 outline-none"
                    >
                        <option value="">Wszystkie asortymenty</option>
                        {categories.map(category => (
                            <option key={category} value={category}>{category}</option>
                        ))}
                        <option value="Części samochodowe">Części samochodowe</option>
                        <option value="Artykuły chemiczne">Artykuły chemiczne</option>
                        <option value="Wyposażenie biura">Wyposażenie biura</option>
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">Status magazynowy</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full p-2 border border-zinc-350 rounded bg-white text-xs text-zinc-800 outline-none"
                    >
                        <option value="">Wszystkie statusy</option>
                        <option value="In Stock">Dostępny (In Stock)</option>
                        <option value="Low Stock">Niski stan (Low Stock)</option>
                        <option value="Out of Stock">Brak na stanie (Out of Stock)</option>
                    </select>
                </div>
            </div>

            {/* SKU Table list */}
            <div className="bg-white rounded border border-[#c6c6cd] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                        <tr className="bg-zinc-50 font-bold text-zinc-650 text-xs border-b border-[#c6c6cd]">
                            <th className="py-2.5 px-4 font-bold">Kod SKU</th>
                            <th className="py-2.5 px-4 font-bold">Nazwa towaru podzespołu</th>
                            <th className="py-2.5 px-4 font-bold">Kategoria</th>
                            <th className="py-2.5 px-4 font-bold">Położenie (Aisle)</th>
                            <th className="py-2.5 px-4 text-right font-bold">Próg ostrzeżenia</th>
                            <th className="py-2.5 px-4 text-right font-bold">Cena jednostkowa</th>
                            <th className="py-2.5 px-4 text-center font-bold">Status</th>
                            <th className="py-2.5 px-4 text-right font-bold w-12">Ilość szt.</th>
                            <th className="py-2.5 px-4 text-right font-bold w-48">Akcje stanu</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 text-xs font-medium text-zinc-850">
                        {filteredProducts.length === 0 ? (
                            <tr>
                                <td colSpan="9" className="py-10 text-center text-zinc-400 font-bold bg-white">Brak pozycji SKU pasujących do podanych filtrów.</td>
                            </tr>
                        ) : (
                            filteredProducts.map(p => (
                                <tr key={p.sku} className="hover:bg-zinc-50/70 transition-colors">
                                    <td className="py-3 px-4 font-mono font-bold text-blue-600">{p.sku}</td>
                                    <td className="py-3 px-4 font-bold text-zinc-900">{p.name}</td>
                                    <td className="py-3 px-4 text-zinc-500">{p.category}</td>
                                    <td className="py-3 px-4 font-mono font-bold text-zinc-650">{p.locationCode || `Aisle ${p.zone}`}</td>
                                    <td className="py-3 px-4 text-right font-mono text-zinc-500">{p.reorderThreshold} szt.</td>
                                    <td className="py-3 px-4 text-right font-mono text-zinc-650">{(p.price || 199.99).toFixed(2)} PLN</td>
                                    <td className="py-3 px-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-block border ${
                          p.status === 'In Stock'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : p.status === 'Low Stock'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-red-50 text-red-750 border-red-200'
                      }`}>
                        {p.status}
                      </span>
                                    </td>
                                    <td className="py-3 px-4 text-right font-mono font-extrabold text-[#0b1c30]">{p.stock}</td>
                                    <td className="py-3 px-4 text-right">
                                      <div className="flex justify-end gap-1.5 flex-nowrap">
                                        <input
                                            type="number"
                                            min="1"
                                            value={stockAmounts[p.sku] || 1}
                                            onChange={(event) => setStockAmount(p.sku, event.target.value)}
                                            className="w-16 px-2 py-1 border border-zinc-300 rounded text-[10px] font-mono text-right outline-none focus:border-blue-500"
                                            title="Ilosc do dodania lub usuniecia"
                                        />
                                        <button
                                            onClick={() => adjustStock(p, 'add')}
                                            disabled={pendingSku === p.sku}
                                            className="px-2 py-1 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-850 font-bold text-[10px] rounded transition-colors cursor-pointer"
                                            title="Dodaj podana ilosc do stanu"
                                        >
                                            Dodaj
                                        </button>
                                        <button
                                            onClick={() => adjustStock(p, 'remove')}
                                            disabled={p.stock <= 0 || pendingSku === p.sku}
                                            className="px-2 py-1 border border-zinc-250 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-[10px] rounded transition-colors disabled:opacity-40 cursor-pointer"
                                            title="Usun podana ilosc ze stanu"
                                        >
                                            Usun
                                        </button>
                                      </div>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
