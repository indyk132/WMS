import React, { useState } from 'react';
import { ZoomIn, ZoomOut, Filter, ShieldAlert, Thermometer, Calendar, Key, CheckCircle, HelpCircle } from 'lucide-react';

export default function Storage({ zones, products, onToggleLockZone }) {
    const [selectedZoneId, setSelectedZoneId] = useState('A1');
    const [zoomLevel, setZoomLevel] = useState(100);

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
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900 leading-tight">Facility Map: North Wing</h2>
                    <p className="text-zinc-500 text-xs mt-1">Live simulation of storage aisles and capacity utilization.</p>
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
                <div className="lg:col-span-8 bg-white border border-[#c6c6cd] rounded-lg p-6 shadow-sm flex flex-col min-h-[460px]">
                    <div className="flex justify-between items-center mb-6 border-b border-zinc-200 pb-4">
                        <h3 className="font-bold text-zinc-800 text-sm">Floorplan Allocation Grid</h3>
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
                                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1 mb-2">BLOCK A - AMBIENT SECTOR</div>
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
                                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1 mb-2">BLOCK B - COLD STORAGE SECTOR</div>
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
                                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1 mb-2">BLOCK C - HAZMAT SECTOR (Strefa niebezpieczna)</div>
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

                {/* Selected Zone Specs Panel */}
                <div className="lg:col-span-4 bg-white border border-[#c6c6cd] rounded-lg p-6 shadow-sm flex flex-col gap-6 text-sm">
                    <div>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">SELECTED ZONE VARIABLES</span>
                        <div className="flex justify-between items-start mt-1">
                            <h2 className="text-2xl font-bold font-mono tracking-tight text-zinc-900">Aisle {selectedZone.id}</h2>
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
                                <span>🔒 KO KORYTARZ JEST ZABLOKOWANY (Locked)</span>
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
