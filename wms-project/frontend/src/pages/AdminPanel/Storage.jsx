import React, { useState } from 'react';
import { ZoomIn, ZoomOut, Filter, ShieldAlert, Thermometer, Calendar, Key, CheckCircle, HelpCircle, Search, LayoutGrid, Layers } from 'lucide-react';

export default function Storage({ zones, products, onToggleLockZone }) {
    const [selectedZoneId, setSelectedZoneId] = useState('A1');
    const [zoomLevel, setZoomLevel] = useState(100);
    const [rackSearch, setRackSearch] = useState('');
    const [selectedSlot, setSelectedSlot] = useState(null);

    const parseLocation = (locationCode) => {
        const match = String(locationCode || '').match(/^([A-Z]+)-(\d+)-(\d+)-(\d+)$/i);
        if (!match) return { sector: '', aisle: 1, rack: 1, level: 1 };
        return {
            sector: match[1].toUpperCase(),
            aisle: Number(match[2]),
            rack: Number(match[3]),
            level: Number(match[4])
        };
    };

    // Find currently selected zone object
    const selectedZone = zones.find(z => z.id === selectedZoneId) || zones[0];

    // Helper colors for capacities
    const getCapacityColorClass = (pct) => {
        if (pct > 90) return 'bg-[#ef4444] hover:bg-red-600 text-white'; // Full
        if (pct > 20) return 'bg-[#eab308] hover:bg-yellow-500 text-zinc-900'; // Partial (Yellow)
        return 'bg-[#22c55e] hover:bg-green-600 text-white'; // Empty
    };

    const handleSelectZone = (id) => {
        setSelectedZoneId(id);
    };

    // Find products associated with this zone
    const allocatedProducts = products.filter(p => p.zone === selectedZoneId);

    return (
        <div className="space-y-6 font-sans text-sm text-[#0b1c30]">
            {/* Page Header Area */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 mb-2">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900 leading-tight">Mapa Obiektu: Skrzydło Północne</h2>
                    <p className="text-zinc-500 text-xs mt-1">Symulacja na żywo korytarzy magazynowych i stopnia ich wykorzystania.</p>
                </div>
                <div className="flex gap-4 items-center flex-wrap">
                    <div className="flex items-center gap-2 text-xs font-semibold">
                        <div className="w-3.5 h-3.5 rounded-sm bg-[#ef4444]"></div>
                        <span className="text-zinc-500">Pełny (&gt;90%)</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold">
                        <div className="w-3.5 h-3.5 rounded-sm bg-[#eab308]"></div>
                        <span className="text-zinc-500">Częściowy (20-90%)</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold">
                        <div className="w-3.5 h-3.5 rounded-sm bg-[#22c55e]"></div>
                        <span className="text-zinc-500">Pusty (&lt;20%)</span>
                    </div>
                    <div className="h-6 w-px bg-zinc-350 mx-2 hidden xl:block"></div>
                    <button className="h-9 px-4 border border-zinc-300 rounded text-xs font-semibold hover:bg-zinc-50 transition-colors flex items-center gap-2 bg-white cursor-pointer select-none">
                        <Filter className="w-4 h-4 text-zinc-500" />
                        Filtruj korytarze
                    </button>
                </div>
            </div>

            {/* Main Grid mapping with Sidebar detail layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                {/* Interactive 2D Map Canvas (React Grid) */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-white border border-[#c6c6cd] rounded-lg p-6 shadow-sm flex flex-col min-h-[460px]">
                        <div className="flex justify-between items-center mb-6 border-b border-zinc-200 pb-4">
                            <h3 className="font-bold text-zinc-800 text-sm">Siatka Rozmieszczenia na Planie</h3>
                        <div className="flex gap-1.5">
                            <button
                                onClick={() => setZoomLevel(Math.min(zoomLevel + 10, 130))}
                                className="w-8 h-8 rounded border border-zinc-300 flex items-center justify-center hover:bg-zinc-100 text-zinc-650 cursor-pointer"
                                title="Przybliż"
                            >
                                <ZoomIn className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setZoomLevel(Math.max(zoomLevel - 10, 70))}
                                className="w-8 h-8 rounded border border-zinc-300 flex items-center justify-center hover:bg-zinc-100 text-zinc-650 cursor-pointer"
                                title="Oddal"
                            >
                                <ZoomOut className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Map Grid Container scaled with zoom state */}
                    <div className="flex-1 bg-zinc-50/60 rounded border border-zinc-250 p-6 overflow-auto flex items-center justify-center">
                        <div
                            className="w-full space-y-8 select-none min-w-[500px]"
                            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center center', transition: 'transform 0.15s ease' }}
                        >
                            {/* BLOCK A - AMBIENT */}
                            <div>
                                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1 mb-2">BLOK A - ŻYWNOŚĆ</div>
                                <div className="grid grid-cols-7 gap-2.5">
                                    {zones.filter(z => z.block === 'AMBIENT').map(zone => {
                                        const isSelected = selectedZoneId === zone.id;
                                        return (
                                            <button
                                                key={zone.id}
                                                onClick={() => handleSelectZone(zone.id)}
                                                className={`p-3 rounded flex flex-col items-center justify-center aspect-square font-mono font-bold border cursor-pointer relative transition-all ${getCapacityColorClass(zone.capacityPercent)} ${
                                                    isSelected
                                                        ? 'ring-4 ring-black border-transparent scale-[1.05] shadow-lg z-10'
                                                        : 'border-zinc-300 shadow-sm'
                                                }`}
                                            >
                                                <span className="text-[11px] font-bold">{zone.id}</span>
                                                <span className="text-[7px] opacity-80 mt-0.5 font-sans uppercase">Żywność</span>
                                                <span className="text-[8px] opacity-80 mt-0.5">{zone.capacityPercent}%</span>

                                                {zone.isLocked && (
                                                    <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-red-850 border border-white flex items-center justify-center text-[8px] font-sans font-extrabold text-white" title="ZABLOKOWANA">
                                                        🔒
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* BLOCK B - COLD STORAGE */}
                            <div>
                                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1 mb-2">BLOK B - ELEKTRONIKA I BIURO</div>
                                <div className="grid grid-cols-7 gap-2.5">
                                    {zones.filter(z => z.block === 'COLD STORAGE').map(zone => {
                                        const isSelected = selectedZoneId === zone.id;
                                        return (
                                            <button
                                                key={zone.id}
                                                onClick={() => handleSelectZone(zone.id)}
                                                className={`p-3 rounded flex flex-col items-center justify-center aspect-square font-mono font-bold border cursor-pointer relative transition-all ${getCapacityColorClass(zone.capacityPercent)} ${
                                                    isSelected
                                                        ? 'ring-4 ring-black border-transparent scale-[1.05] shadow-lg z-10'
                                                        : 'border-zinc-300 shadow-sm'
                                                }`}
                                            >
                                                <span className="text-[11px] font-bold">{zone.id}</span>
                                                <span className="text-[7px] opacity-80 mt-0.5 font-sans uppercase">Tech/Biuro</span>
                                                <span className="text-[8px] opacity-85 mt-0.5">{zone.capacityPercent}%</span>

                                                {zone.isLocked && (
                                                    <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-red-850 border border-white flex items-center justify-center text-[8px] font-sans font-extrabold text-white" title="ZABLOKOWANA">
                                                        🔒
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* BLOCK C - HAZMAT */}
                            <div>
                                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1 mb-2">BLOK C - MOTORYZACJA, CHEMIA I BHP</div>
                                <div className="grid grid-cols-5 gap-2.5">
                                    {zones.filter(z => z.block === 'HAZMAT').map(zone => {
                                        const isSelected = selectedZoneId === zone.id;
                                        return (
                                            <button
                                                key={zone.id}
                                                onClick={() => handleSelectZone(zone.id)}
                                                className={`p-3 rounded flex flex-col items-center justify-center aspect-square font-mono font-bold border cursor-pointer relative transition-all overflow-hidden ${getCapacityColorClass(zone.capacityPercent)} ${
                                                    isSelected
                                                        ? 'ring-4 ring-black border-transparent scale-[1.05] shadow-lg z-10'
                                                        : 'border-zinc-300 shadow-sm animate-pulse'
                                                }`}
                                            >
                                                {/* Hazard diagonal stripes pattern overlay */}
                                                <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(0,0,0,1) 5px, rgba(0,0,0,1) 10px)' }} />

                                                <span className="text-[11px] font-bold relative z-10">{zone.id}</span>
                                                <span className="text-[7px] opacity-85 mt-0.5 relative z-10 font-sans uppercase">Auto/Chem</span>
                                                <span className="text-[8px] opacity-85 mt-0.5 relative z-10">{zone.capacityPercent}%</span>

                                                {zone.isLocked && (
                                                    <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-red-850 border border-white flex items-center justify-center text-[8px] font-sans font-extrabold text-white relative z-20" title="ZABLOKOWANA">
                                                        🔒
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            {/* Wizualizacja Regałów i Półek */}
            <div className="bg-white border border-[#c6c6cd] rounded-lg p-6 shadow-sm flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200 pb-4">
                    <div>
                        <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                            <LayoutGrid className="w-4 h-4 text-blue-600" />
                            Szczegółowy Układ Regałów w Korytarzu {selectedZone.id}
                        </h3>
                        <p className="text-zinc-500 text-xs mt-1">Interaktywny podgląd pionowy regałów, półek i fizycznej alokacji towarów.</p>
                    </div>

                    <div className="relative w-full sm:w-64">
                        <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                        <input
                            type="text"
                            placeholder="Szukaj SKU lub produktu..."
                            value={rackSearch}
                            onChange={(e) => setRackSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-1.5 border border-zinc-300 rounded text-xs outline-none focus:ring-1 focus:ring-blue-500 text-zinc-950 bg-white"
                        />
                    </div>
                </div>

                {/* Rack Grid representation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2].map(rackNum => {
                        return (
                            <div key={rackNum} className="bg-zinc-900 text-white rounded-lg p-4 shadow-lg border border-zinc-950 flex flex-col">
                                <div className="flex justify-between items-center mb-4 border-b border-zinc-800 pb-2">
                                    <span className="text-xs font-extrabold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                                        <Layers className="w-3.5 h-3.5" />
                                        REGAŁ R{rackNum}
                                    </span>
                                    <span className="text-[10px] text-zinc-400 font-semibold font-mono">Korytarz {selectedZone.id} - Regał R{rackNum}</span>
                                </div>

                                {/* Shelf grid levels (levels 4 down to 1) */}
                                <div className="space-y-4">
                                    {[4, 3, 2, 1].map(levelNum => {
                                        return (
                                            <div key={levelNum} className="flex items-center gap-3">
                                                {/* Level index label */}
                                                <div className="w-6 text-[10px] font-bold text-zinc-500 text-center font-mono" title={`Poziom ${levelNum}`}>
                                                    P{levelNum}
                                                </div>

                                                {/* 3 slots on this shelf level */}
                                                <div className="grid grid-cols-3 gap-2.5 flex-1">
                                                    {[1, 2, 3].map(slotNum => {
                                                        // Find if a product matches this location
                                                        const prod = allocatedProducts.find(p => {
                                                            const loc = parseLocation(p.locationCode);
                                                            const slotIndex = (p.sku.charCodeAt(p.sku.length - 1) % 3) + 1;
                                                            return loc.rack === rackNum && loc.level === levelNum && slotIndex === slotNum;
                                                        });

                                                        const isOccupied = !!prod;
                                                        const isLit = prod && rackSearch && (
                                                            prod.sku.toLowerCase().includes(rackSearch.toLowerCase()) || 
                                                            prod.name.toLowerCase().includes(rackSearch.toLowerCase())
                                                        );

                                                        return (
                                                            <div key={slotNum} className="relative">
                                                                {isOccupied ? (
                                                                    <div
                                                                        onClick={() => setSelectedSlot({ rack: rackNum, level: levelNum, slot: slotNum, product: prod, isOccupied: true })}
                                                                        className={`p-2 rounded text-[11px] font-bold border leading-snug cursor-pointer transition-all hover:scale-[1.03] select-none h-[64px] flex flex-col justify-between ${
                                                                            isLit
                                                                                ? 'ring-4 ring-yellow-400 border-transparent bg-yellow-50 text-zinc-950 shadow-lg animate-pulse'
                                                                                : selectedSlot?.rack === rackNum && selectedSlot?.level === levelNum && selectedSlot?.slot === slotNum
                                                                                    ? 'ring-2 ring-white border-transparent bg-blue-600 text-white shadow-md'
                                                                                    : selectedZone.id.startsWith('C')
                                                                                        ? 'bg-amber-950/70 border-amber-800 text-amber-100 hover:bg-amber-900/80 hover:border-amber-700'
                                                                                        : selectedZone.id.startsWith('B')
                                                                                            ? 'bg-emerald-950/70 border-emerald-800 text-emerald-100 hover:bg-emerald-900/80 hover:border-emerald-700'
                                                                                            : 'bg-blue-950/70 border-blue-800 text-blue-100 hover:bg-blue-900/80 hover:border-blue-700'
                                                                        }`}
                                                                    >
                                                                        <div className="flex justify-between items-center text-[8px] opacity-75 leading-none">
                                                                            <span className="font-mono font-semibold truncate max-w-[45px]">{prod.sku}</span>
                                                                            <span className="font-extrabold bg-white/10 px-0.5 rounded text-[8px]">{prod.quantity} szt.</span>
                                                                        </div>
                                                                        <div className="truncate text-[10px] leading-tight mt-0.5">{prod.name}</div>
                                                                        <div className="text-[7px] opacity-55 font-mono mt-0.5 text-right">R{rackNum}-P{levelNum}-G{slotNum}</div>
                                                                    </div>
                                                                ) : (
                                                                    <div
                                                                        onClick={() => setSelectedSlot({ rack: rackNum, level: levelNum, slot: slotNum, isOccupied: false })}
                                                                        className={`p-2 rounded text-[9px] border border-zinc-800/80 border-dashed bg-zinc-950/30 text-zinc-650 hover:bg-zinc-900/40 cursor-pointer flex flex-col justify-center items-center text-center font-mono leading-none h-[64px] transition-all hover:scale-[1.02] ${
                                                                            selectedSlot?.rack === rackNum && selectedSlot?.level === levelNum && selectedSlot?.slot === slotNum
                                                                                ? 'ring-2 ring-blue-500 border-transparent bg-zinc-900 text-white'
                                                                                : ''
                                                                        }`}
                                                                    >
                                                                        <span className="text-zinc-600 font-extrabold mb-0.5 text-[8px] tracking-wide">WOLNE</span>
                                                                        <span className="text-[7px] text-zinc-600">R{rackNum}-P{levelNum}-G{slotNum}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    
                                    {/* Rack base horizontal support frame */}
                                    <div className="h-2 bg-zinc-800 border-t border-zinc-950 rounded-b w-full mt-2" />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Selected Shelf Slot Drawer details */}
                {selectedSlot && (
                    <div className="bg-zinc-50 border border-zinc-200 rounded p-4 text-xs font-semibold leading-relaxed flex flex-col gap-4 relative animate-in slide-in-from-bottom-2 duration-150">
                        <button
                            onClick={() => setSelectedSlot(null)}
                            className="absolute top-2.5 right-3 text-zinc-400 hover:text-zinc-700 cursor-pointer font-bold text-sm"
                            title="Zamknij"
                        >
                            ×
                        </button>
                        
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-zinc-200 pb-2">
                            <div>
                                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Wybrane Gniazdo Magazynowe</span>
                                <h4 className="text-sm font-bold font-mono text-zinc-900 mt-0.5">
                                    Adres: {selectedZone.id[0]}-0{selectedZone.id[1]}-0{selectedSlot.rack}-0{selectedSlot.level}-0{selectedSlot.slot}
                                </h4>
                            </div>
                            <span className="text-[10px] text-zinc-500 bg-white border border-zinc-200 px-2 py-0.5 rounded self-start sm:self-center font-mono">
                                Sektor {selectedZone.id[0]} | Korytarz {selectedZone.id[1]} | Regał {selectedSlot.rack} | Poziom {selectedSlot.level} | Gniazdo {selectedSlot.slot}
                            </span>
                        </div>

                        {selectedSlot.isOccupied ? (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                                <div className="sm:col-span-2 space-y-2">
                                    <div>
                                        <span className="text-[9px] text-zinc-400 uppercase">Nazwa Towaru</span>
                                        <p className="text-xs font-bold text-zinc-950">{selectedSlot.product.name}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="text-[9px] text-zinc-400 uppercase">Kod SKU</span>
                                            <p className="font-mono text-xs font-bold text-blue-600">{selectedSlot.product.sku}</p>
                                        </div>
                                        <div>
                                            <span className="text-[9px] text-zinc-400 uppercase">Kategoria</span>
                                            <p className="text-xs font-bold text-zinc-800">{selectedSlot.product.category}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3 bg-white p-3 rounded border border-zinc-200">
                                    <div className="flex justify-between items-center border-b border-zinc-100 pb-1.5">
                                        <span className="text-[9px] text-zinc-500 uppercase font-bold">Zapas na półce</span>
                                        <span className="font-mono font-extrabold text-xs text-zinc-950 bg-zinc-50 border px-1.5 py-0.5 rounded">{selectedSlot.product.quantity} szt.</span>
                                    </div>
                                    <div className="flex justify-between items-center leading-none">
                                        <span className="text-[9px] text-zinc-500 uppercase font-bold">Wartość SKU</span>
                                        <span className="font-mono font-bold text-xs text-zinc-700">{(selectedSlot.product.price || 0).toFixed(2)} PLN</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <p className="text-zinc-500 text-xs italic">Ta lokalizacja regałowa jest pusta i gotowa na przyjęcie nowych partii towarów (Inbound Receive) lub relokację wewnętrzną.</p>
                            </div>
                        )}

                        <div className="flex justify-end gap-2.5 pt-2 border-t border-zinc-200/60">
                            {selectedSlot.isOccupied ? (
                                <>
                                    <button
                                        onClick={() => alert(`Zlecenie kompletacji SKU ${selectedSlot.product.sku} z regału R${selectedSlot.rack} poziom P${selectedSlot.level} zostało przekazane do terminala mobilnego.`)}
                                        className="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-[11px] transition-colors cursor-pointer shadow-sm"
                                    >
                                        Kompletuj (Pick)
                                    </button>
                                    <button
                                        onClick={() => {
                                            const qty = prompt("Wpisz ilość sztuk do dodania:", "10");
                                            if (qty && !isNaN(qty)) {
                                                alert(`Uzupełniono lokalizację o +${qty} sztuk towaru.`);
                                            }
                                        }}
                                        className="h-8 px-3 border border-zinc-300 hover:bg-zinc-100 text-zinc-700 font-bold text-[11px] rounded transition-colors cursor-pointer bg-white"
                                    >
                                        Uzupełnij (Restock)
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => alert(`Rozpoczęto alokację nowego asortymentu w gnieździe R${selectedSlot.rack}-P${selectedSlot.level}-G${selectedSlot.slot}.`)}
                                    className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[11px] transition-colors cursor-pointer shadow-sm"
                                >
                                    Przydziel Towar (Allocate)
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
            </div>

                {/* Selected Zone Specs Panel */}
                <div className="lg:col-span-4 bg-white border border-[#c6c6cd] rounded-lg p-6 shadow-sm flex flex-col gap-6 text-sm">
                    <div>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">PARAMETRY WYBRANEJ STREFY</span>
                        <div className="flex justify-between items-start mt-1">
                            <h2 className="text-2xl font-bold font-mono tracking-tight text-zinc-900">Korytarz {selectedZone.id}</h2>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border shrink-0 inline-flex items-center gap-1 ${
                                selectedZone.capacityPercent > 90
                                    ? 'bg-red-50 text-red-750 border-red-200'
                                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${selectedZone.capacityPercent > 90 ? 'bg-red-600' : 'bg-emerald-500'}`} />
                                {selectedZone.capacityPercent}% Obciążenia
                            </span>
                        </div>

                        {selectedZone.isLocked && (
                            <div className="bg-red-50 border border-red-200 text-red-800 p-2 text-xs font-bold rounded mt-3 flex items-center gap-1.5">
                                <span>🔒 KORYTARZ JEST ZABLOKOWANY</span>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                        <div className="bg-zinc-50 p-3.5 rounded border border-zinc-200">
                            <span className="text-[10px] font-semibold text-zinc-650 uppercase">Asortymentów (SKUs)</span>
                            <p className="text-2xl font-extrabold text-zinc-900 mt-1">{selectedZone.activeSKUs}</p>
                        </div>
                        <div className="bg-zinc-50 p-3.5 rounded border border-zinc-200">
                            <span className="text-[10px] font-semibold text-zinc-650 uppercase">Zajęte Palety</span>
                            <p className="text-2xl font-extrabold text-zinc-900 mt-1">{selectedZone.totalPallets} / {selectedZone.maxPallets}</p>
                        </div>
                    </div>

                    <div className="space-y-3.5 border-t border-zinc-150 pt-5">
                        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Warunki Środowiskowe</h4>

                        <div className="flex items-center justify-between py-1 border-b border-zinc-100">
              <span className="text-xs font-medium text-zinc-500 flex items-center gap-2">
                <Thermometer className="w-4.5 h-4.5 text-zinc-400" /> Temperatura
              </span>
                            <span className="font-mono font-bold text-zinc-800">{selectedZone.temp}</span>
                        </div>

                        <div className="flex items-center justify-between py-1 border-b border-zinc-100">
              <span className="text-xs font-medium text-zinc-500 flex items-center gap-2">
                <ShieldAlert className="w-4.5 h-4.5 text-zinc-400" /> Klasa Hazmat
              </span>
                            <span className="font-mono font-bold text-red-650">{selectedZone.hazmatStatus}</span>
                        </div>

                        <div className="flex items-center justify-between py-1 border-b border-zinc-100">
              <span className="text-xs font-medium text-zinc-500 flex items-center gap-2">
                <Calendar className="w-4.5 h-4.5 text-zinc-400" /> Ostatni Audyt
              </span>
                            <span className="font-mono font-bold text-zinc-800">{selectedZone.lastAuditDaysAgo} dni temu</span>
                        </div>
                    </div>

                    {/* List of commodities contained */}
                    <div className="space-y-2 border-t border-zinc-150 pt-5 flex-1">
                        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Przypisane towary na stanie korytarza</h4>
                        <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                            {allocatedProducts.length === 0 ? (
                                <p className="text-xs text-zinc-400 italic">Korytarz pusty lub towary wymagają relokacji.</p>
                            ) : (
                                allocatedProducts.map(p => (
                                    <div key={p.sku} className="p-2 bg-zinc-50 border border-zinc-150 rounded flex justify-between items-center text-[11px] font-semibold">
                                        <span className="truncate text-zinc-800 mr-2">{p.name}</span>
                                        <span className="font-mono text-blue-600 bg-white border px-1.5 py-0.5 rounded shrink-0">{p.sku}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-zinc-150 flex gap-3 mt-auto">
                        <button
                            onClick={() => alert(`Przeglądanie inwentarza fizycznego korytarza ${selectedZone.id}: Wykryto ${allocatedProducts.length} asortymentów.`)}
                            className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold transition-all text-xs cursor-pointer shadow"
                        >
                            Szczegóły korytarza
                        </button>
                        <button
                            onClick={() => onToggleLockZone(selectedZone.id)}
                            className={`flex-1 h-10 border text-xs font-bold rounded hover:bg-zinc-100 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                selectedZone.isLocked
                                    ? 'border-red-400 text-red-600 bg-red-50 hover:bg-red-100'
                                    : 'border-zinc-300 text-zinc-700 bg-white'
                            }`}
                        >
                            <Key className="w-4 h-4" />
                            {selectedZone.isLocked ? 'Odblokuj' : 'Blokada korytarza'}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
