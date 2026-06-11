/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Search, RotateCcw, TrendingUp, X } from 'lucide-react';
import { Product } from '../types';

interface SearchBarProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
}

export default function SearchBar({ products, onSelectProduct }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [history, setHistory] = useState<string[]>(['Watch', 'Chair', 'Pro Audio', 'WMS-ACC']);

  const popularSearches = ['Titanium', 'Ceramic Organizer', 'Audio Driver', 'Minimalist'];

  // Match items based on query
  const getFilteredProducts = () => {
    if (!query.trim()) return [];
    const term = query.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term)
    );
  };

  const filtered = getFilteredProducts();

  const handleSearchSubmit = (searchVal: string) => {
    setQuery(searchVal);
    if (searchVal.trim() && !history.includes(searchVal)) {
      setHistory((prev) => [searchVal, ...prev.slice(0, 4)]);
    }
  };

  const clearHistory = () => {
    setHistory([]);
  };

  return (
    <div className="relative w-full max-w-lg z-30" id="search-main-container">
      {/* Input Frame */}
      <div className="relative flex items-center">
        <input
          type="text"
          placeholder="🔎 Search WMS Database... {{api.query}}"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-500 text-zinc-100 placeholder-zinc-500 text-xs px-10 py-3 rounded-none focus:outline-none transition-colors"
        />
        <div className="absolute left-3.5 text-zinc-500">
          <Search size={14} />
        </div>
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3.5 text-zinc-500 hover:text-white p-0.5 cursor-pointer"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isFocused && (
        <>
          {/* Invisible dim page overlay */}
          <div className="fixed inset-0 z-10" onClick={() => setIsFocused(false)} />

          <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-950 border border-zinc-800 shadow-2xl z-20 overflow-hidden divide-y divide-zinc-900 max-h-[420px] overflow-y-auto">
            
            {/* Context/Historial items when search box is empty */}
            {!query.trim() && (
              <div className="p-4 space-y-4">
                {/* Search History */}
                {history.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono tracking-wider uppercase text-zinc-400 flex items-center gap-1.5">
                        <RotateCcw size={10} /> Search History
                      </span>
                      <button
                        onClick={clearHistory}
                        className="text-[9px] font-mono text-zinc-600 hover:text-zinc-400 hover:underline cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {history.map((h, i) => (
                        <button
                          key={i}
                          onClick={() => handleSearchSubmit(h)}
                          className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-[10px] px-2.5 py-1 font-mono transition-colors cursor-pointer"
                        >
                          {h}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Popular Keywords suggestions */}
                <div>
                  <span className="text-[10px] font-mono tracking-wider uppercase text-zinc-400 flex items-center gap-1.5 mb-2">
                    <TrendingUp size={10} /> Popular Tags
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {popularSearches.map((keyword, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSearchSubmit(keyword)}
                        className="bg-zinc-905 border border-zinc-900 hover:bg-zinc-900 hover:border-zinc-800 text-zinc-300 text-[10px] px-2.5 py-1 font-mono transition-colors cursor-pointer"
                      >
                        {keyword}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Matching Live Query results */}
            {query.trim() && (
              <div className="divide-y divide-zinc-900">
                <div className="p-2 bg-zinc-900/30 text-[9px] font-mono text-zinc-500 uppercase tracking-widest px-3">
                  WMS Matches found: {filtered.length} ({"{{api.query_results_count}}"})
                </div>

                {filtered.length === 0 ? (
                  <div className="p-6 text-center text-zinc-500">
                    <p className="text-xs">No items match your query.</p>
                    <p className="text-[10px] font-mono text-zinc-600 mt-1">
                      Query placeholder: <code className="text-zinc-500">GET /api/search?q={query}</code>
                    </p>
                  </div>
                ) : (
                  filtered.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => {
                        onSelectProduct(product);
                        setIsFocused(false);
                      }}
                      className="p-3 hover:bg-zinc-900 cursor-pointer flex items-center gap-3 transition-colors align-middle"
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-10 w-10 object-cover flex-shrink-0 bg-zinc-800"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0 flex-grow">
                        <div className="flex items-center justify-between gap-2">
                          <h5 className="text-[11px] font-medium text-white truncate">
                            {product.name}
                          </h5>
                          <span className="text-[10px] font-mono text-zinc-300 flex-shrink-0">
                            {product.price}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] font-mono text-zinc-500">
                            {product.sku}
                          </span>
                          <span className="text-[8px] bg-emerald-950 text-emerald-400 border border-emerald-900 px-1 py-0.2 rounded-none font-mono uppercase tracking-widest scale-90">
                            {product.stock.match(/\d+/) ? 'WMS STOCK' : 'SYNCED'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
