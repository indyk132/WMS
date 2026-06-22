import React, { useState } from 'react';
import { ZoomIn, ZoomOut, Filter, ShieldAlert, Thermometer, Calendar, Key, Search, LayoutGrid, Layers, Printer } from 'lucide-react';
import { Product } from '../../services/inventoryApi';

interface StorageProps {
    zones: any[];
    products: Product[];
    onToggleLockZone: (zoneId: string) => void;
    highlightedZoneId?: string | null;
}

export default function Storage({ zones, products, onToggleLockZone, highlightedZoneId }: StorageProps) {
    const [selectedZoneId, setSelectedZoneId] = useState('A1');
    const [zoomLevel, setZoomLevel] = useState(100);
    const [rackSearch, setRackSearch] = useState('');
    const [selectedSlot, setSelectedSlot] = useState<any | null>(null);
    const [notification, setNotification] = useState<{ msg: string; type: 'success' | 'info' | 'warning' } | null>(null);

    const [labelsToPrint, setLabelsToPrint] = useState<any[]>([]);
    const [isPrinting, setIsPrinting] = useState(false);

    const preloadAndPrint = (list: any[]) => {
        setIsPrinting(true);
        setLabelsToPrint(list);
        
        let loadedCount = 0;
        const totalCount = list.length;
        
        if (totalCount === 0) {
            setIsPrinting(false);
            return;
        }
        
        list.forEach(lbl => {
            const img = new Image();
            img.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(lbl.code)}`;
            img.onload = () => {
                loadedCount++;
                if (loadedCount === totalCount) {
                    setTimeout(() => {
                        window.print();
                        setLabelsToPrint([]);
                        setIsPrinting(false);
                    }, 250);
                }
            };
            img.onerror = () => {
                loadedCount++;
                if (loadedCount === totalCount) {
                    setTimeout(() => {
                        window.print();
                        setLabelsToPrint([]);
                        setIsPrinting(false);
                    }, 250);
                }
            };
        });
    };

    const handlePrintSingleSlotLabel = () => {
        if (!selectedSlot) return;
        const sector = selectedZone.id[0];
        const aisle = selectedZone.id[1];
        const code = `${sector}-0${aisle}-0${selectedSlot.rack}-0${selectedSlot.level}-0${selectedSlot.slot}`;
        
        const label = {
            code,
            description: `Sektor ${sector} | Korytarz ${aisle} | Regał ${selectedSlot.rack} | Poziom ${selectedSlot.level} | Gniazdo ${selectedSlot.slot}`,
            sku: selectedSlot.isOccupied ? selectedSlot.product.sku : '',
            productName: selectedSlot.isOccupied ? selectedSlot.product.name : ''
        };
        
        preloadAndPrint([label]);
    };

    const handlePrintAllZoneLabels = () => {
        const list: any[] = [];
        const sector = selectedZone.id[0];
        const aisle = selectedZone.id[1];
        
        for (let rackNum = 1; rackNum <= 3; rackNum++) {
            for (let levelNum = 1; levelNum <= 4; levelNum++) {
                for (let slotNum = 1; slotNum <= 3; slotNum++) {
                    const prod = allocatedProducts.find(p => {
                        const loc = parseLocation(p.locationCode);
                        const slotIndex = (p.sku.charCodeAt(p.sku.length - 1) % 3) + 1;
                        return loc.rack === rackNum && loc.level === levelNum && slotIndex === slotNum;
                    });
                    
                    const code = `${sector}-0${aisle}-0${rackNum}-0${levelNum}-0${slotNum}`;
                    list.push({
                        code,
                        description: `Sektor ${sector} | Korytarz ${aisle} | Regał ${rackNum} | Poziom ${levelNum} | Gniazdo ${slotNum}`,
                        sku: prod ? prod.sku : '',
                        productName: prod ? prod.name : ''
                    });
                }
            }
        }
        
        preloadAndPrint(list);
    };

    React.useEffect(() => {
        if (highlightedZoneId) {
            setSelectedZoneId(highlightedZoneId);
            setTimeout(() => {
                const element = document.getElementById(`zone-block-${highlightedZoneId}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
        }
    }, [highlightedZoneId]);

    const showNotification = (msg: string, type: 'success' | 'info' | 'warning' = 'success') => {
        setNotification({ msg, type });
        setTimeout(() => setNotification(null), 4500);
    };

    const parseLocation = (locationCode: string) => {
        const match = String(locationCode || '').match(/^([A-Z]+)-(\d+)-(\d+)-(\d+)$/i);
        if (!match) return { sector: '', aisle: 1, rack: 1, level: 1 };
        return {
            sector: match[1].toUpperCase(),
            aisle: Number(match[2]),
            rack: Number(match[3]),
            level: Number(match[4])
        };
    };

    const selectedZone = zones.find(z => z.id === selectedZoneId) || zones[0];

    const getCapacityStatus = (pct: number) => {
        if (pct > 90) {
            return {
                colorClass: 'bg-[#ef4444]',
                textClass: 'text-[#ef4444]',
                dotClass: 'bg-[#ef4444]',
                label: 'Pełny'
            };
        }
        if (pct > 20) {
            return {
                colorClass: 'bg-[#eab308]',
                textClass: 'text-[#d97706]',
                dotClass: 'bg-[#eab308]',
                label: 'Częściowy'
            };
        }
        return {
            colorClass: 'bg-[#22c55e]',
            textClass: 'text-[#16a34a]',
            dotClass: 'bg-[#22c55e]',
            label: 'Pusty'
        };
    };

    const handleSelectZone = (id: string) => {
        setSelectedZoneId(id);
    };

    const allocatedProducts = products.filter(p => p.zone === selectedZoneId);

    const getZoneGroup = (zoneId: string) => {
        if (zoneId?.startsWith('A')) return 'Żywność';
        if (zoneId?.startsWith('B')) return 'Tech/Biuro';
        if (zoneId?.startsWith('C')) return 'Auto/Chem';
        return 'Ogólna';
    };

    return (
        <div className="space-y-6 font-sans text-sm text-[#0b1c30] animate-fadeIn">
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 mb-2">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900 leading-tight">Mapa Obiektu: Skrzydło Północne</h2>
                    <p className="text-zinc-500 text-xs mt-1">Symulacja na żywo korytarzy magazynowych i stopnia ich wykorzystania.</p>
                </div>
                <div className="flex gap-4 items-center flex-wrap select-none">
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
                    <div className="h-6 w-px bg-zinc-350 mx-2 hidden xl:block animate-pulse"></div>
                    <button className="h-9 px-4 border border-zinc-300 rounded text-xs font-semibold hover:bg-zinc-50 transition-colors flex items-center gap-2 bg-white cursor-pointer select-none">
                        <Filter className="w-4 h-4 text-zinc-500" />
                        Filtruj korytarze
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-white border border-[#e5e7eb] rounded-lg p-6 shadow-sm flex flex-col min-h-[460px]">
                        <div className="flex justify-between items-center mb-6 border-b border-zinc-200 pb-4 select-none">
                            <h3 className="font-bold text-zinc-800 text-sm">Siatka Rozmieszczenia na Planie</h3>
                            <div className="flex gap-1.5 font-sans">
                                <button
                                    onClick={() => setZoomLevel(Math.min(zoomLevel + 10, 130))}
                                    className="w-8 h-8 rounded border border-zinc-300 flex items-center justify-center hover:bg-zinc-100 text-zinc-650 cursor-pointer bg-white"
                                    title="Przybliż"
                                >
                                    <ZoomIn className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setZoomLevel(Math.max(zoomLevel - 10, 70))}
                                    className="w-8 h-8 rounded border border-zinc-300 flex items-center justify-center hover:bg-zinc-100 text-zinc-650 cursor-pointer bg-white"
                                    title="Oddal"
                                >
                                    <ZoomOut className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 bg-zinc-50/60 rounded border border-zinc-200 p-6 overflow-auto flex items-center justify-center">
                            <div
                                className="w-full space-y-8 select-none min-w-[500px]"
                                style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center center', transition: 'transform 0.15s ease' }}
                            >
                                <div>
                                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1 mb-2 font-mono">BLOK A - ŻYWNOŚĆ</div>
                                    <div className="grid grid-cols-7 gap-2.5">
                                        {zones.filter(z => z.block === 'AMBIENT').map(zone => {
                                            const isSelected = selectedZoneId === zone.id;
                                            const status = getCapacityStatus(zone.capacityPercent);
                                            const isHighlighted = highlightedZoneId && zone.id === highlightedZoneId;
                                            return (
                                                <button
                                                    key={zone.id}
                                                    id={`zone-block-${zone.id}`}
                                                    onClick={() => handleSelectZone(zone.id)}
                                                    className={`p-2.5 rounded-lg flex flex-col justify-between border cursor-pointer relative transition-all min-h-[76px] ${
                                                        isSelected
                                                            ? 'ring-2 ring-zinc-950 scale-[1.03] shadow-md z-10 border-transparent'
                                                            : 'bg-white hover:bg-zinc-50 border-zinc-200 shadow-sm'
                                                    } ${
                                                        isHighlighted
                                                            ? 'bg-amber-100 ring-4 ring-amber-400 animate-pulse border-transparent'
                                                            : ''
                                                    }`}
                                                >
                                                    <div className="flex justify-between items-center w-full">
                                                        <span className="text-xs font-bold font-mono text-zinc-850 flex items-center gap-1">
                                                            {zone.id}
                                                            {zone.isLocked && <span className="text-[10px] text-red-655" title="ZABLOKOWANA">🔒</span>}
                                                        </span>
                                                        <div className="flex items-center gap-1">
                                                            <span className={`w-1.5 h-1.5 rounded-full ${status.dotClass}`} />
                                                            <span className={`text-[9px] font-mono font-bold ${status.textClass}`}>{zone.capacityPercent}%</span>
                                                        </div>
                                                    </div>

                                                    <span className="text-[8.5px] text-zinc-400 font-sans uppercase font-bold tracking-wider text-left self-start mt-1.5 mb-1.5 leading-none truncate w-full">
                                                        Żywność
                                                    </span>

                                                    <div className="w-full">
                                                        <div className="w-full bg-zinc-100 rounded-full h-1 overflow-hidden">
                                                            <div className={`h-full rounded-full ${status.colorClass}`} style={{ width: `${zone.capacityPercent}%` }} />
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1 mb-2 font-mono">BLOK B - ELEKTRONIKA I BIURO</div>
                                    <div className="grid grid-cols-7 gap-2.5">
                                        {zones.filter(z => z.block === 'COLD STORAGE').map(zone => {
                                            const isSelected = selectedZoneId === zone.id;
                                            const status = getCapacityStatus(zone.capacityPercent);
                                            const isHighlighted = highlightedZoneId && zone.id === highlightedZoneId;
                                            return (
                                                <button
                                                    key={zone.id}
                                                    id={`zone-block-${zone.id}`}
                                                    onClick={() => handleSelectZone(zone.id)}
                                                    className={`p-2.5 rounded-lg flex flex-col justify-between border cursor-pointer relative transition-all min-h-[76px] ${
                                                        isSelected
                                                            ? 'ring-2 ring-zinc-950 scale-[1.03] shadow-md z-10 border-transparent'
                                                            : 'bg-white hover:bg-zinc-50 border-zinc-200 shadow-sm'
                                                    } ${
                                                        isHighlighted
                                                            ? 'bg-amber-100 ring-4 ring-amber-400 animate-pulse border-transparent'
                                                            : ''
                                                    }`}
                                                >
                                                    <div className="flex justify-between items-center w-full">
                                                        <span className="text-xs font-bold font-mono text-zinc-850 flex items-center gap-1">
                                                            {zone.id}
                                                            {zone.isLocked && <span className="text-[10px] text-red-655" title="ZABLOKOWANA">🔒</span>}
                                                        </span>
                                                        <div className="flex items-center gap-1">
                                                            <span className={`w-1.5 h-1.5 rounded-full ${status.dotClass}`} />
                                                            <span className={`text-[9px] font-mono font-bold ${status.textClass}`}>{zone.capacityPercent}%</span>
                                                        </div>
                                                    </div>

                                                    <span className="text-[8.5px] text-zinc-400 font-sans uppercase font-bold tracking-wider text-left self-start mt-1.5 mb-1.5 leading-none truncate w-full">
                                                        Tech/Biuro
                                                    </span>

                                                    <div className="w-full">
                                                        <div className="w-full bg-zinc-100 rounded-full h-1 overflow-hidden">
                                                            <div className={`h-full rounded-full ${status.colorClass}`} style={{ width: `${zone.capacityPercent}%` }} />
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1 mb-2 font-mono">BLOK C - MOTORYZACJA, CHEMIA I BHP</div>
                                    <div className="grid grid-cols-5 gap-2.5">
                                        {zones.filter(z => z.block === 'HAZMAT').map(zone => {
                                            const isSelected = selectedZoneId === zone.id;
                                            const status = getCapacityStatus(zone.capacityPercent);
                                            const isHighlighted = highlightedZoneId && zone.id === highlightedZoneId;
                                            return (
                                                <button
                                                    key={zone.id}
                                                    id={`zone-block-${zone.id}`}
                                                    onClick={() => handleSelectZone(zone.id)}
                                                    className={`p-2.5 rounded-lg flex flex-col justify-between border cursor-pointer relative overflow-hidden min-h-[76px] transition-all ${
                                                        isSelected
                                                            ? 'ring-2 ring-zinc-950 scale-[1.03] shadow-md z-10 border-transparent'
                                                            : 'bg-white hover:bg-zinc-50 border-zinc-200 shadow-sm'
                                                    } ${
                                                        isHighlighted
                                                            ? 'bg-amber-100 ring-4 ring-amber-400 animate-pulse border-transparent'
                                                            : ''
                                                    }`}
                                                >
                                                    <div className="absolute inset-0 opacity-[0.06] pointer-events-none rounded-lg" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(0,0,0,1) 5px, rgba(0,0,0,1) 10px)' }} />

                                                    <div className="flex justify-between items-center w-full relative z-10">
                                                        <span className="text-xs font-bold font-mono text-zinc-850 flex items-center gap-1">
                                                            {zone.id}
                                                            {zone.isLocked && <span className="text-[10px] text-red-655" title="ZABLOKOWANA">🔒</span>}
                                                        </span>
                                                        <div className="flex items-center gap-1">
                                                            <span className={`w-1.5 h-1.5 rounded-full ${status.dotClass}`} />
                                                            <span className={`text-[9px] font-mono font-bold ${status.textClass}`}>{zone.capacityPercent}%</span>
                                                        </div>
                                                    </div>

                                                    <span className="text-[8.5px] text-zinc-400 font-sans uppercase font-bold tracking-wider text-left self-start mt-1.5 mb-1.5 leading-none truncate w-full relative z-10">
                                                        Auto/Chem
                                                    </span>

                                                    <div className="w-full relative z-10">
                                                        <div className="w-full bg-zinc-100 rounded-full h-1 overflow-hidden">
                                                            <div className={`h-full rounded-full ${status.colorClass}`} style={{ width: `${zone.capacityPercent}%` }} />
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                <div className="bg-white border border-[#e5e7eb] rounded-lg p-6 shadow-sm flex flex-col gap-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200 pb-4 select-none">
                        <div>
                            <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                                <LayoutGrid className="w-4 h-4 text-blue-600" />
                                Układ Regałów w Korytarzu {selectedZone.id}
                            </h3>
                            <p className="text-zinc-500 text-xs mt-1">Interaktywny podgląd pionowy gniazd regałowych.</p>
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[1, 2].map(rackNum => {
                            return (
                                <div key={rackNum} className="bg-zinc-900 text-white rounded-lg p-4 shadow-lg border border-zinc-950 flex flex-col">
                                    <div className="flex justify-between items-center mb-4 border-b border-zinc-800 pb-2">
                                        <span className="text-xs font-extrabold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                                            <Layers className="w-3.5 h-3.5" />
                                            REGAŁ R{rackNum}
                                        </span>
                                        <span className="text-[10px] text-zinc-450 font-semibold font-mono">Regał R{rackNum}</span>
                                    </div>

                                    <div className="space-y-4">
                                        {[4, 3, 2, 1].map(levelNum => {
                                            return (
                                                <div key={levelNum} className="flex items-center gap-3">
                                                    <div className="w-6 text-[10px] font-bold text-zinc-500 text-center font-mono" title={`Poziom ${levelNum}`}>
                                                        P{levelNum}
                                                    </div>

                                                    <div className="grid grid-cols-3 gap-2.5 flex-1">
                                                        {[1, 2, 3].map(slotNum => {
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
                                                                <div key={slotNum} className="relative group">
                                                                    {isOccupied ? (
                                                                        <>
                                                                            <div
                                                                                onClick={() => setSelectedSlot({ rack: rackNum, level: levelNum, slot: slotNum, product: prod, isOccupied: true })}
                                                                                className={`p-2 rounded text-[11px] font-bold border leading-snug cursor-pointer transition-all hover:scale-[1.03] select-none h-[64px] flex flex-col justify-between relative z-10 ${
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
                                                                                <div className="flex justify-between items-center text-[8px] opacity-75 leading-none w-full relative z-10">
                                                                                    <span className="font-mono text-[7px] text-zinc-350">GNIAZDO {slotNum}</span>
                                                                                    <span className="font-extrabold bg-white/15 px-1 py-0.5 rounded text-[8.5px] tracking-wide font-sans">{prod.stock} szt.</span>
                                                                                </div>

                                                                                <div className="text-center font-mono font-black text-[11px] tracking-tight truncate w-full mt-1.5 mb-1.5 relative z-10">
                                                                                    {prod.sku}
                                                                                </div>

                                                                                <div className="text-[7px] opacity-60 font-mono text-right w-full mt-auto relative z-10">
                                                                                    R{rackNum}-P{levelNum}-G{slotNum}
                                                                                </div>
                                                                            </div>

                                                                            <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-44 -translate-x-1/2 scale-95 rounded-md bg-zinc-950 border border-zinc-800 p-2 text-center text-[10px] font-medium text-zinc-350 shadow-xl opacity-0 transition-all duration-150 group-hover:opacity-100 group-hover:scale-100 leading-relaxed">
                                                                                <div className="font-bold text-white mb-0.5 truncate">{prod.name}</div>
                                                                                <div className="text-[9px] text-zinc-400 font-mono">SKU: {prod.sku}</div>
                                                                                <div className="text-[9px] text-zinc-400 font-sans mt-0.5">Ilość: <span className="font-bold text-white">{prod.stock} szt.</span></div>
                                                                                <div className="absolute top-full left-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-[3.5px] rotate-45 bg-zinc-950 border-r border-b border-zinc-800" />
                                                                            </div>
                                                                        </>
                                                                    ) : (
                                                                        <div
                                                                            onClick={() => setSelectedSlot({ rack: rackNum, level: levelNum, slot: slotNum, isOccupied: false })}
                                                                            className={`p-2 rounded text-[9px] border border-zinc-800 border-dashed bg-zinc-950/40 text-zinc-450 hover:text-zinc-200 hover:bg-zinc-900/60 hover:border-zinc-650 cursor-pointer flex flex-col justify-center items-center text-center font-mono leading-none h-[64px] transition-all hover:scale-[1.02] ${
                                                                                selectedSlot?.rack === rackNum && selectedSlot?.level === levelNum && selectedSlot?.slot === slotNum
                                                                                    ? 'ring-2 ring-blue-500 border-transparent bg-zinc-900 text-white'
                                                                                    : ''
                                                                            }`}
                                                                        >
                                                                            <span className={`font-extrabold mb-0.5 text-[8px] tracking-wide ${
                                                                                selectedSlot?.rack === rackNum && selectedSlot?.level === levelNum && selectedSlot?.slot === slotNum
                                                                                    ? 'text-white'
                                                                                    : 'text-zinc-500'
                                                                            }`}>WOLNE</span>
                                                                            <span className={
                                                                                selectedSlot?.rack === rackNum && selectedSlot?.level === levelNum && selectedSlot?.slot === slotNum
                                                                                    ? 'text-zinc-300'
                                                                                    : 'text-zinc-500'
                                                                            }>R{rackNum}-P{levelNum}-G{slotNum}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        
                                        <div className="h-2 bg-zinc-800 border-t border-zinc-950 rounded-b w-full mt-2" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {selectedSlot && (
                        <div className="bg-zinc-50 border border-zinc-200 rounded p-4 text-xs font-semibold leading-relaxed flex flex-col gap-4 relative animate-in slide-in-from-bottom-2 duration-150">
                            <button
                                onClick={() => setSelectedSlot(null)}
                                className="absolute top-2.5 right-3 text-zinc-400 hover:text-zinc-700 cursor-pointer font-bold text-sm bg-transparent border-none"
                                title="Zamknij"
                            >
                                ×
                            </button>
                            
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-zinc-200 pb-2 select-none">
                                <div>
                                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Wybrane Gniazdo Magazynowe</span>
                                    <h4 className="text-sm font-bold font-mono text-zinc-900 mt-0.5">
                                        Adres: {selectedZone.id[0]}-0{selectedZone.id[1]}-0{selectedSlot.rack}-0{selectedSlot.level}-0{selectedSlot.slot}
                                    </h4>
                                </div>
                                <span className="text-[10px] text-zinc-500 bg-white border border-zinc-200 px-2 py-0.5 rounded self-start sm:self-center font-mono shadow-inner">
                                    Sektor {selectedZone.id[0]} | Korytarz {selectedZone.id[1]} | Regał {selectedSlot.rack} | Poziom {selectedSlot.level} | Gniazdo {selectedSlot.slot}
                                </span>
                            </div>

                            {selectedSlot.isOccupied ? (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start select-text">
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
                                                <p className="text-xs font-bold text-zinc-805">{getZoneGroup(selectedZone.id)}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-3 bg-white p-3 rounded border border-zinc-200 select-none">
                                        <div className="flex justify-between items-center border-b border-zinc-100 pb-1.5 leading-none">
                                            <span className="text-[9px] text-zinc-500 uppercase font-bold text-[8.5px]">Zapas</span>
                                            <span className="font-mono font-extrabold text-xs text-zinc-950 bg-zinc-50 border px-1.5 py-0.5 rounded">{selectedSlot.product.stock} szt.</span>
                                        </div>
                                        <div className="flex justify-between items-center leading-none">
                                            <span className="text-[9px] text-zinc-500 uppercase font-bold text-[8.5px]">Wartość</span>
                                            <span className="font-mono font-bold text-xs text-zinc-700">{(selectedSlot.product.price || 199.99).toFixed(2)} PLN</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-zinc-500 text-xs italic">Ta lokalizacja regałowa jest pusta i gotowa na przyjęcie nowych partii towarów (Inbound Receive).</p>
                                </div>
                            )}

                             <div className="flex justify-end gap-2.5 pt-2 border-t border-zinc-200">
                                 {selectedSlot.isOccupied ? (
                                     <>
                                         <button
                                             onClick={handlePrintSingleSlotLabel}
                                             disabled={isPrinting}
                                             className="h-8 px-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1.5 border-none shadow-sm disabled:opacity-50"
                                         >
                                             <Printer className="w-3.5 h-3.5" />
                                             {isPrinting ? 'Czekaj...' : 'Drukuj QR'}
                                         </button>
                                         <button
                                             onClick={() => showNotification(`Zlecenie kompletacji SKU ${selectedSlot.product.sku} z regału R${selectedSlot.rack} poziom P${selectedSlot.level} zostało przekazane do terminala mobilnego.`, 'info')}
                                             className="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-[11px] transition-colors cursor-pointer shadow-sm border-none"
                                         >
                                             Kompletuj (Pick)
                                         </button>
                                         <button
                                             onClick={() => {
                                                 showNotification(`Uzupełniono lokalizację o +10 sztuk towaru (Pomyślny restock).`, 'success');
                                             }}
                                             className="h-8 px-3 border border-zinc-300 hover:bg-zinc-100 text-zinc-700 font-bold text-[11px] rounded transition-colors cursor-pointer bg-white"
                                         >
                                             Uzupełnij (Restock)
                                         </button>
                                     </>
                                 ) : (
                                     <>
                                         <button
                                             onClick={handlePrintSingleSlotLabel}
                                             disabled={isPrinting}
                                             className="h-8 px-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1.5 border-none shadow-sm disabled:opacity-50"
                                         >
                                             <Printer className="w-3.5 h-3.5" />
                                             {isPrinting ? 'Czekaj...' : 'Drukuj QR'}
                                         </button>
                                         <button
                                             onClick={() => showNotification(`Rozpoczęto alokację nowego asortymentu w gnieździe R${selectedSlot.rack}-P${selectedSlot.level}-G${selectedSlot.slot}.`, 'info')}
                                             className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[11px] transition-colors cursor-pointer shadow-sm border-none"
                                         >
                                             Przydziel Towar (Allocate)
                                         </button>
                                     </>
                                 )}
                             </div>
                        </div>
                    )}
                </div>
                </div>

                <div className="lg:col-span-4 bg-white border border-[#e5e7eb] rounded-lg p-6 shadow-sm flex flex-col gap-6 text-sm">
                    <div>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">PARAMETRY WYBRANEJ STREFY</span>
                        <div className="flex justify-between items-start mt-1">
                            <h2 className="text-2xl font-bold font-mono tracking-tight text-zinc-900 leading-none">Korytarz {selectedZone.id}</h2>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border shrink-0 inline-flex items-center gap-1 ${
                                selectedZone.capacityPercent > 90
                                    ? 'bg-red-50 text-red-750 border-red-200'
                                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${selectedZone.capacityPercent > 90 ? 'bg-red-600 animate-pulse' : 'bg-emerald-500'}`} />
                                {selectedZone.capacityPercent}% Obciążenia
                            </span>
                        </div>

                        {selectedZone.isLocked && (
                            <div className="bg-red-50 border border-red-200 text-red-850 p-2 text-xs font-bold rounded mt-3 flex items-center gap-1.5 animate-pulse">
                                <span>🔒 KORYTARZ JEST ZABLOKOWANY</span>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3.5 select-none">
                        <div className="bg-zinc-50 p-3.5 rounded border border-zinc-200">
                            <span className="text-[10px] font-semibold text-zinc-500 uppercase block font-mono">Asortymentów</span>
                            <p className="text-2xl font-extrabold text-[#0b1c30] mt-1 font-mono">{selectedZone.activeSKUs}</p>
                        </div>
                        <div className="bg-zinc-50 p-3.5 rounded border border-zinc-200">
                            <span className="text-[10px] font-semibold text-zinc-500 uppercase block font-mono">Zajęte Palety</span>
                            <p className="text-2xl font-extrabold text-[#0b1c30] mt-1 font-mono">{selectedZone.totalPallets} / {selectedZone.maxPallets}</p>
                        </div>
                    </div>

                    <div className="space-y-3.5 border-t border-zinc-200 pt-5 select-none">
                        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Warunki Środowiskowe</h4>

                        <div className="flex items-center justify-between py-1 border-b border-zinc-150">
                            <span className="text-xs font-medium text-zinc-500 flex items-center gap-2">
                                <Thermometer className="w-4.5 h-4.5 text-zinc-400" /> Temperatura
                            </span>
                            <span className="font-mono font-bold text-zinc-800">{selectedZone.temp || 'Ambient (18°C)'}</span>
                        </div>

                        <div className="flex items-center justify-between py-1 border-b border-zinc-150">
                            <span className="text-xs font-medium text-zinc-500 flex items-center gap-2">
                                <ShieldAlert className="w-4.5 h-4.5 text-zinc-400" /> Klasa Hazmat
                            </span>
                            <span className="font-mono font-bold text-red-655">{selectedZone.hazmatStatus || 'None'}</span>
                        </div>

                        <div className="flex items-center justify-between py-1 border-b border-zinc-150">
                            <span className="text-xs font-medium text-zinc-500 flex items-center gap-2">
                                <Calendar className="w-4.5 h-4.5 text-zinc-400" /> Ostatni Audyt
                            </span>
                            <span className="font-mono font-bold text-zinc-800">{selectedZone.lastAuditDaysAgo || 1} dni temu</span>
                        </div>
                    </div>

                    <div className="space-y-2 border-t border-zinc-200 pt-5 flex-1">
                        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 select-none">Przypisane towary na stanie korytarza</h4>
                        <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                            {allocatedProducts.length === 0 ? (
                                <p className="text-xs text-zinc-400 italic">Korytarz pusty lub towary wymagają relokacji.</p>
                            ) : (
                                allocatedProducts.map(p => (
                                    <div key={p.sku} className="p-2 bg-zinc-50 border border-zinc-150 rounded flex justify-between items-center text-[11px] font-semibold font-mono shadow-sm">
                                        <span className="truncate text-zinc-800 mr-2 font-sans">{p.name}</span>
                                        <span className="font-mono text-[#0052CC] bg-white border border-zinc-200 px-1.5 py-0.5 rounded shrink-0">{p.sku}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-zinc-200 w-full">
                        <button
                            onClick={handlePrintAllZoneLabels}
                            disabled={isPrinting}
                            className="w-full h-10 bg-zinc-900 hover:bg-zinc-800 text-white rounded font-bold transition-all text-xs cursor-pointer flex items-center justify-center gap-1.5 border-none shadow-md disabled:opacity-50"
                        >
                            <Printer className="w-4 h-4" />
                            {isPrinting ? 'Generowanie kodów QR...' : `Drukuj kody QR dla korytarza ${selectedZone.id}`}
                        </button>
                    </div>

                    <div className="pt-4 border-t border-zinc-200 flex gap-3 mt-auto font-sans select-none">
                        <button
                            onClick={() => showNotification(`Przeglądanie inwentarza fizycznego korytarza ${selectedZone.id}: Wykryto ${allocatedProducts.length} asortymentów.`, 'info')}
                            className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold transition-all text-xs cursor-pointer shadow border-none"
                        >
                            Szczegóły korytarza
                        </button>
                        <button
                            onClick={() => onToggleLockZone(selectedZone.id)}
                            className={`flex-1 h-10 border text-xs font-bold rounded hover:bg-zinc-100 transition-all flex items-center justify-center gap-1.5 cursor-pointer bg-white ${
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

            {/* System Etykiet Magazynowych do druku */}
            {labelsToPrint.length > 0 && (
                <div id="print-labels-container" className="hidden print:block bg-white text-zinc-950 font-sans">
                    {labelsToPrint.map((lbl, idx) => (
                        <div key={idx} className="print-label-card">
                            <div className="text-[10px] font-black tracking-widest text-zinc-400 uppercase border-b border-zinc-200 pb-1.5 w-full mb-3 text-center">
                                Logistics OS - Etykieta Regałowa
                            </div>
                            
                            <div className="flex justify-center my-2">
                                <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(lbl.code)}`} 
                                    alt="Kod QR"
                                    className="w-36 h-36 border border-zinc-200 p-1 bg-white"
                                />
                            </div>
                            
                            <div className="text-2xl font-black font-mono tracking-widest text-center text-zinc-900 border-2 border-zinc-900 px-4 py-1.5 rounded-lg bg-zinc-50 my-3">
                                {lbl.code}
                            </div>
                            
                            <div className="text-[9px] text-zinc-500 font-bold text-center font-mono uppercase tracking-wide">
                                {lbl.description}
                            </div>

                            <div className="text-[9px] text-zinc-800 font-black text-center mt-3 border-t border-dashed border-zinc-300 pt-2 w-full truncate font-mono">
                                {lbl.sku ? `SKU: ${lbl.sku} | ${lbl.productName}` : "LOKALIZACJA WOLNA"}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style>{`
                @media print {
                    body {
                        background: white !important;
                        color: black !important;
                    }
                    #root > div:not(#print-labels-container) {
                        display: none !important;
                    }
                    #print-labels-container {
                        display: block !important;
                        width: 100% !important;
                        height: auto !important;
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    .print-label-card {
                        page-break-after: always !important;
                        break-after: page !important;
                        display: flex !important;
                        flex-direction: column !important;
                        align-items: center !important;
                        justify-content: center !important;
                        border: 3px solid #0f172a !important;
                        border-radius: 12px !important;
                        padding: 20px !important;
                        margin: 40px auto !important;
                        width: 100mm !important;
                        height: 100mm !important;
                        box-sizing: border-box !important;
                        background: white !important;
                        box-shadow: none !important;
                    }
                }
            `}</style>

            {notification && (
                <div className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl border flex items-center gap-3 shadow-2xl animate-bounce ${
                    notification.type === 'warning' 
                        ? 'bg-amber-50 border-amber-200 text-amber-800' 
                        : notification.type === 'info'
                        ? 'bg-blue-50 border-blue-200 text-blue-800'
                        : 'bg-emerald-50 border-emerald-250 text-emerald-800'
                }`}>
                    <ShieldAlert className="w-5 h-5 text-[#3b82f6] shrink-0" />
                    <span className="text-xs font-bold leading-tight font-sans text-stone-900">{notification.msg}</span>
                </div>
            )}
        </div>
    );
}
