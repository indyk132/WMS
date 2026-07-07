import React, { useState, useMemo, useEffect } from 'react';
import { 
  Compass, Map, Sparkles, LayoutGrid, CheckCircle2, 
  ArrowRight, Award, Footprints, Clock, HelpCircle, BarChart3
} from 'lucide-react';
import { Product } from '../../services/inventoryApi';
import { sounds } from '../../components/SoundEffects';

interface PickLocation {
  id: string;
  sku: string;
  name: string;
  aisle: number; // 0 to 5
  shelfSide: 'left' | 'right';
  y: number; // 60 to 280 (vertical offset on rack)
}

interface PickBatch {
  id: string;
  name: string;
  locations: PickLocation[];
}

interface PickPathOptimizerProps {
  products: Product[];
  orders: any[];
  logActivity: (message: string, type: string, details?: string) => void;
  addToast: (title: string, text: string, type: 'error' | 'warning' | 'info' | 'success') => void;
}

export default function PickPathOptimizer({
  products = [],
  orders = [],
  logActivity,
  addToast
}: PickPathOptimizerProps) {
  // Active Algorithm preview
  const [previewAlgo, setPreviewAlgo] = useState<'SShape' | 'Return' | 'LargestGap'>('SShape');
  // System-wide activated algorithm (persisted in localStorage)
  const [activeAlgorithm, setActiveAlgorithm] = useState<string>('SShape');
  
  // Selected batch for visual preview
  const [selectedBatchId, setSelectedBatchId] = useState<string>('BATCH-A');

  // Load activated algorithm from localStorage
  useEffect(() => {
    const saved = window.localStorage.getItem('wms-picking-algorithm');
    if (saved) {
      setActiveAlgorithm(saved);
      setPreviewAlgo(saved as any);
    }
  }, []);

  // Predefined simulated picking batches representing typical order pools
  const batches: PickBatch[] = useMemo(() => [
    {
      id: 'BATCH-A',
      name: 'Batch A (Pary zamówień jednoelementowych - 5 SKU)',
      locations: [
        { id: 'LOC-1', sku: 'SKU-001', name: 'Klocki hamulcowe przód (A1)', aisle: 0, shelfSide: 'left', y: 100 },
        { id: 'LOC-2', sku: 'SKU-002', name: 'Tarcze hamulcowe wentylowane', aisle: 2, shelfSide: 'right', y: 240 },
        { id: 'LOC-3', sku: 'SKU-003', name: 'Filtry oleju Bosch', aisle: 2, shelfSide: 'left', y: 90 },
        { id: 'LOC-4', sku: 'SKU-004', name: 'Amortyzatory gazowe przód', aisle: 4, shelfSide: 'right', y: 160 },
        { id: 'LOC-5', sku: 'SKU-005', name: 'Reflektory LED kpl.', aisle: 5, shelfSide: 'left', y: 270 }
      ]
    },
    {
      id: 'BATCH-B',
      name: 'Batch B (Duża kompletacja koszykowa - 9 SKU)',
      locations: [
        { id: 'LOC-1', sku: 'SKU-001', name: 'Klocki hamulcowe przód (A1)', aisle: 0, shelfSide: 'left', y: 80 },
        { id: 'LOC-2', sku: 'SKU-002', name: 'Tarcze hamulcowe wentylowane', aisle: 1, shelfSide: 'left', y: 220 },
        { id: 'LOC-3', sku: 'SKU-003', name: 'Filtry oleju Bosch', aisle: 1, shelfSide: 'right', y: 140 },
        { id: 'LOC-4', sku: 'SKU-004', name: 'Amortyzatory gazowe przód', aisle: 3, shelfSide: 'left', y: 70 },
        { id: 'LOC-5', sku: 'SKU-005', name: 'Reflektory LED kpl.', aisle: 3, shelfSide: 'right', y: 250 },
        { id: 'LOC-6', sku: 'SKU-006', name: 'Świece zapłonowe kpl.', aisle: 4, shelfSide: 'left', y: 120 },
        { id: 'LOC-7', sku: 'SKU-007', name: 'Płyn hamulcowy DOT-4', aisle: 4, shelfSide: 'right', y: 280 },
        { id: 'LOC-8', sku: 'SKU-008', name: 'Pasek rozrządu Gates', aisle: 5, shelfSide: 'left', y: 100 },
        { id: 'LOC-9', sku: 'SKU-009', name: 'Żarówki H7 Osram Night Breaker', aisle: 5, shelfSide: 'right', y: 190 }
      ]
    },
    {
      id: 'BATCH-C',
      name: 'Batch C (Skupiona zbiórka strefowa - 4 SKU)',
      locations: [
        { id: 'LOC-1', sku: 'SKU-001', name: 'Klocki hamulcowe przód (A1)', aisle: 1, shelfSide: 'right', y: 120 },
        { id: 'LOC-2', sku: 'SKU-002', name: 'Tarcze hamulcowe wentylowane', aisle: 1, shelfSide: 'left', y: 160 },
        { id: 'LOC-3', sku: 'SKU-003', name: 'Filtry oleju Bosch', aisle: 2, shelfSide: 'right', y: 110 },
        { id: 'LOC-4', sku: 'SKU-004', name: 'Amortyzatory gazowe przód', aisle: 2, shelfSide: 'left', y: 150 }
      ]
    }
  ], []);

  const activeBatch = useMemo(() => {
    return batches.find(b => b.id === selectedBatchId) || batches[0];
  }, [selectedBatchId, batches]);

  // Aisle configuration (6 vertical aisles)
  const aisleCoords = useMemo(() => [80, 160, 240, 320, 400, 480], []);

  // 3D/2D coordinates helper for SVG drawing
  // Start/End point (Dock / Pack table area) is at bottom left (40, 320)
  const startPoint = { x: 40, y: 320 };
  const topCorridorY = 40;
  const bottomCorridorY = 300;

  // 3. Algorithm path generators & distance calculations
  const paths = useMemo(() => {
    const locs = activeBatch.locations;
    const visitedAisles = Array.from(new Set(locs.map(l => l.aisle))).sort((a, b) => a - b);

    // ==========================================
    // 1. S-SHAPE (Snake/Wąż) Path
    // ==========================================
    const sShapePoints: {x: number, y: number}[] = [{ ...startPoint }];
    let currentY = bottomCorridorY;

    visitedAisles.forEach((aisleIdx, i) => {
      const aisleX = aisleCoords[aisleIdx];
      
      // Move along corridor to the entrance of the aisle
      sShapePoints.push({ x: aisleX, y: currentY });

      // Determine traversal direction
      const nextY = currentY === bottomCorridorY ? topCorridorY : bottomCorridorY;
      
      // Aisle points sorted in direction of travel
      const aisleLocs = locs.filter(l => l.aisle === aisleIdx)
                            .sort((a, b) => nextY === topCorridorY ? a.y - b.y : b.y - a.y);
      
      aisleLocs.forEach(l => {
        const offset = l.shelfSide === 'left' ? -12 : 12;
        sShapePoints.push({ x: aisleX + offset, y: l.y });
      });

      // Travel to the opposite corridor to exit the aisle
      sShapePoints.push({ x: aisleX, y: nextY });
      currentY = nextY;
    });

    // If ended at the top, return via the last visited aisle or corridor side
    if (currentY === topCorridorY) {
      // Go down the last aisle if no points, or simply head straight back to start
      sShapePoints.push({ x: aisleCoords[aisleCoords.length - 1], y: topCorridorY });
      sShapePoints.push({ x: aisleCoords[aisleCoords.length - 1], y: bottomCorridorY });
    }
    sShapePoints.push({ ...startPoint });

    // ==========================================
    // 2. RETURN (Powrotny) Path
    // ==========================================
    const returnPoints: {x: number, y: number}[] = [{ ...startPoint }];
    
    visitedAisles.forEach(aisleIdx => {
      const aisleX = aisleCoords[aisleIdx];
      // Always enter from the bottom corridor
      returnPoints.push({ x: aisleX, y: bottomCorridorY });
      
      // Find highest point in this aisle (furthest from bottom corridor)
      const aisleLocs = locs.filter(l => l.aisle === aisleIdx).sort((a, b) => a.y - b.y);
      
      if (aisleLocs.length > 0) {
        // Go up, visiting points
        aisleLocs.forEach(l => {
          const offset = l.shelfSide === 'left' ? -12 : 12;
          returnPoints.push({ x: aisleX + offset, y: l.y });
        });
        // Go back down the same aisle to the bottom corridor
        returnPoints.push({ x: aisleX, y: bottomCorridorY });
      }
    });
    returnPoints.push({ ...startPoint });

    // ==========================================
    // 3. LARGEST GAP Path
    // ==========================================
    // Entered from both ends of the aisle, ometting the largest gap between elements
    const largestGapPoints: {x: number, y: number}[] = [{ ...startPoint }];
    let lastCorridor = bottomCorridorY;

    visitedAisles.forEach(aisleIdx => {
      const aisleX = aisleCoords[aisleIdx];
      const aisleLocs = locs.filter(l => l.aisle === aisleIdx).sort((a, b) => a.y - b.y);

      if (aisleLocs.length === 1) {
        // Just one point - enter from closest corridor
        const l = aisleLocs[0];
        const enterY = l.y < (topCorridorY + bottomCorridorY) / 2 ? topCorridorY : bottomCorridorY;
        
        largestGapPoints.push({ x: aisleX, y: enterY });
        largestGapPoints.push({ x: aisleX + (l.shelfSide === 'left' ? -12 : 12), y: l.y });
        largestGapPoints.push({ x: aisleX, y: enterY });
        lastCorridor = enterY;
      } 
      else if (aisleLocs.length >= 2) {
        // Find largest gap between points
        let maxGap = 0;
        let gapIdx = -1;

        // Gaps between consecutive locations
        for (let idx = 0; idx < aisleLocs.length - 1; idx++) {
          const gap = aisleLocs[idx+1].y - aisleLocs[idx].y;
          if (gap > maxGap) {
            maxGap = gap;
            gapIdx = idx;
          }
        }

        // Also check gap from corridors
        const topGap = aisleLocs[0].y - topCorridorY;
        const bottomGap = bottomCorridorY - aisleLocs[aisleLocs.length - 1].y;

        if (topGap > maxGap && topGap > bottomGap) {
          // Enter only from bottom, return to bottom
          largestGapPoints.push({ x: aisleX, y: bottomCorridorY });
          aisleLocs.forEach(l => {
            largestGapPoints.push({ x: aisleX + (l.shelfSide === 'left' ? -12 : 12), y: l.y });
          });
          largestGapPoints.push({ x: aisleX, y: bottomCorridorY });
          lastCorridor = bottomCorridorY;
        } 
        else if (bottomGap > maxGap) {
          // Enter only from top, return to top
          largestGapPoints.push({ x: aisleX, y: topCorridorY });
          aisleLocs.slice().reverse().forEach(l => {
            largestGapPoints.push({ x: aisleX + (l.shelfSide === 'left' ? -12 : 12), y: l.y });
          });
          largestGapPoints.push({ x: aisleX, y: topCorridorY });
          lastCorridor = topCorridorY;
        } 
        else {
          // Double entry: visit top subset from top corridor, return to top.
          // Move corridor, visit bottom subset from bottom corridor, return to bottom.
          largestGapPoints.push({ x: aisleX, y: topCorridorY });
          for (let idx = 0; idx <= gapIdx; idx++) {
            const l = aisleLocs[idx];
            largestGapPoints.push({ x: aisleX + (l.shelfSide === 'left' ? -12 : 12), y: l.y });
          }
          largestGapPoints.push({ x: aisleX, y: topCorridorY });

          // Cross over and enter from bottom
          largestGapPoints.push({ x: aisleX, y: bottomCorridorY });
          for (let idx = aisleLocs.length - 1; idx > gapIdx; idx--) {
            const l = aisleLocs[idx];
            largestGapPoints.push({ x: aisleX + (l.shelfSide === 'left' ? -12 : 12), y: l.y });
          }
          largestGapPoints.push({ x: aisleX, y: bottomCorridorY });
          lastCorridor = bottomCorridorY;
        }
      }
    });
    
    // Return to start
    largestGapPoints.push({ ...startPoint });

    // ==========================================
    // Euclidean distance calculations (scaled)
    // 1px on canvas = 0.4 meters in warehouse
    // ==========================================
    const calcDistanceMeters = (pts: {x: number, y: number}[]) => {
      let dist = 0;
      for (let idx = 0; idx < pts.length - 1; idx++) {
        const dx = pts[idx+1].x - pts[idx].x;
        const dy = pts[idx+1].y - pts[idx].y;
        dist += Math.sqrt(dx*dx + dy*dy);
      }
      return Math.round(dist * 0.4);
    };

    return {
      SShape: {
        points: sShapePoints,
        distanceM: calcDistanceMeters(sShapePoints)
      },
      Return: {
        points: returnPoints,
        distanceM: calcDistanceMeters(returnPoints)
      },
      LargestGap: {
        points: largestGapPoints,
        distanceM: calcDistanceMeters(largestGapPoints)
      }
    };
  }, [activeBatch, aisleCoords]);

  // Calculate times based on average picker speed of 1.2 m/s
  const metrics = useMemo(() => {
    const sShapeDist = paths.SShape.distanceM;
    const returnDist = paths.Return.distanceM;
    const largestGapDist = paths.LargestGap.distanceM;

    const calcTimeStr = (dist: number) => {
      const seconds = dist / 1.2;
      const mins = Math.floor(seconds / 60);
      const secs = Math.round(seconds % 60);
      return `${mins} min ${secs} s`;
    };

    // Find best
    const dists = [
      { name: 'SShape', val: sShapeDist },
      { name: 'Return', val: returnDist },
      { name: 'LargestGap', val: largestGapDist }
    ];
    dists.sort((a, b) => a.val - b.val);
    const bestAlgo = dists[0].name;

    return {
      SShape: {
        dist: sShapeDist,
        timeStr: calcTimeStr(sShapeDist)
      },
      Return: {
        dist: returnDist,
        timeStr: calcTimeStr(returnDist)
      },
      LargestGap: {
        dist: largestGapDist,
        timeStr: calcTimeStr(largestGapDist)
      },
      bestAlgo
    };
  }, [paths]);

  // Activate selected algorithm
  const handleActivateAlgorithm = (algo: string) => {
    sounds.playSuccess();
    setActiveAlgorithm(algo);
    window.localStorage.setItem('wms-picking-algorithm', algo);

    let namePl = 'S-Shape';
    if (algo === 'Return') namePl = 'Powrotny (Return)';
    if (algo === 'LargestGap') namePl = 'Największa Przerwa (Largest Gap)';

    logActivity(
      `Zmieniono domyślny algorytm kompletacji na ${namePl}`,
      'relocate',
      `Nowy algorytm będzie sortować zadania na terminalu zbieracza według optymalizacji ścieżki.`
    );

    addToast('Zmieniono algorytm', `Domyślny schemat trasowania to teraz ${namePl}.`, 'success');
  };

  return (
    <div id="wms-pick-path-optimizer" className="space-y-6 font-sans text-sm text-[#334155] animate-fadeIn pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-left">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
            <Compass className="w-5.5 h-5.5 text-blue-650" /> Optymalizacja Ścieżek Zbiórki SKU
          </h2>
          <p className="text-xs text-slate-500 mt-1.5 max-w-xl">
            Wizualizuj i wybierz optymalny logistyczny algorytm trasowania. Prawidłowy wybór schematu ruchu zbieracza pozwala zmniejszyć dystans chodzenia po hali nawet o 30%.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        <div className="bg-white border border-slate-200 rounded-xl p-4.5 flex items-center justify-between shadow-xs text-left">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase select-none">Aktywny algorytm zbiórki</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-slate-900">
                {activeAlgorithm === 'SShape' ? 'S-Shape (Snake)' :
                 activeAlgorithm === 'Return' ? 'Powrotny (Return)' : 'Największa Przerwa'}
              </span>
            </div>
            <span className="text-[10px] text-slate-450 block">Ustawienie wpływające na terminale pickerów.</span>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
            <Compass className="w-6 h-6 stroke-1.5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4.5 flex items-center justify-between shadow-xs text-left">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase select-none">Średni dystans partii</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 font-mono">
                {metrics[activeAlgorithm as 'SShape' | 'Return' | 'LargestGap'].dist}
              </span>
              <span className="text-xs font-semibold text-slate-500">metrów</span>
            </div>
            <span className="text-[10px] text-slate-450 block">Szacowana długość ścieżki dla wybranego Batcha.</span>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <Footprints className="w-6 h-6 stroke-1.5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4.5 flex items-center justify-between shadow-xs text-left">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase select-none">Szacowana oszczędność czasu</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-700 font-mono">22%</span>
              <span className="text-xs font-semibold text-emerald-650 bg-emerald-50 px-1.5 py-0.2 rounded">w skali roku</span>
            </div>
            <span className="text-[10px] text-slate-450 block">Zysk w stosunku do braku trasowania (sortowania po SKU).</span>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <Clock className="w-6 h-6 stroke-1.5" />
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: 2D Interactive Map View */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
          
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 select-none text-left">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Map className="w-4.5 h-4.5 text-blue-650" />
                Interaktywna ścieżka zbiórki (Wizualizacja 2D)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Wybierz partię zbiórki i kliknij algorytmy u dołu, aby sprawdzić ich przebieg.</p>
            </div>
            
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {batches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* SVG Map Container */}
          <div className="bg-slate-50 border border-slate-250 rounded-xl p-4 flex justify-center items-center overflow-x-auto">
            <svg 
              width="540" 
              height="350" 
              viewBox="0 0 540 350"
              className="bg-slate-50 overflow-visible"
            >
              {/* Grid markings */}
              <rect x="2" y="2" width="536" height="346" rx="10" fill="none" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="4 4" />
              
              {/* Cross corridors */}
              {/* Top corridor */}
              <line x1="40" y1="40" x2="500" y2="40" stroke="#cbd5e1" strokeWidth="12" strokeLinecap="round" opacity="0.3" />
              {/* Bottom corridor */}
              <line x1="40" y1="300" x2="500" y2="300" stroke="#cbd5e1" strokeWidth="12" strokeLinecap="round" opacity="0.3" />

              {/* Visited Corridor overlay */}
              <text x="35" y="25" className="fill-slate-400 font-bold text-[8.5px] uppercase tracking-wider font-mono">Korytarz górny (Top Corridor)</text>
              <text x="35" y="342" className="fill-slate-400 font-bold text-[8.5px] uppercase tracking-wider font-mono">Korytarz dolny (Bottom Corridor)</text>

              {/* Racks & Aisles */}
              {aisleCoords.map((x, idx) => {
                const isVisited = activeBatch.locations.some(l => l.aisle === idx);
                
                return (
                  <g key={idx}>
                    {/* Left Rack Shelf */}
                    <rect 
                      x={x - 12} 
                      y="60" 
                      width="8" 
                      height="220" 
                      rx="2"
                      fill={isVisited ? '#f1f5f9' : '#f8fafc'} 
                      stroke={isVisited ? '#94a3b8' : '#cbd5e1'} 
                      strokeWidth="1" 
                    />
                    {/* Right Rack Shelf */}
                    <rect 
                      x={x + 4} 
                      y="60" 
                      width="8" 
                      height="220" 
                      rx="2"
                      fill={isVisited ? '#f1f5f9' : '#f8fafc'} 
                      stroke={isVisited ? '#94a3b8' : '#cbd5e1'} 
                      strokeWidth="1" 
                    />
                    
                    {/* Aisle label */}
                    <text 
                      x={x} 
                      y="52" 
                      textAnchor="middle" 
                      className={`font-black text-[9px] font-mono ${isVisited ? 'fill-slate-800' : 'fill-slate-400'}`}
                    >
                      A-{idx+1}
                    </text>
                  </g>
                );
              })}

              {/* Draw picking route path */}
              <path
                d={paths[previewAlgo].points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')}
                fill="none"
                stroke={
                  previewAlgo === 'SShape' ? '#2563eb' :
                  previewAlgo === 'Return' ? '#8b5cf6' : '#10b981'
                }
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="path-animation"
                style={{
                  strokeDasharray: '6, 6',
                  animation: 'dash 30s linear infinite'
                }}
              />

              {/* Add keyframes style block directly to make it animate beautifully */}
              <style>
                {`
                  @keyframes dash {
                    to {
                      stroke-dashoffset: -1000;
                    }
                  }
                `}
              </style>

              {/* Start/End Node */}
              <circle cx={startPoint.x} cy={startPoint.y} r="8" fill="#e2e8f0" stroke="#475569" strokeWidth="2.5" />
              <text x={startPoint.x} y={startPoint.y + 3} textAnchor="middle" className="fill-slate-850 font-black text-[8px] font-mono">P</text>
              <text x={startPoint.x + 14} y={startPoint.y + 3} className="fill-slate-500 font-bold text-[8.5px] uppercase font-mono">DOCK-START</text>

              {/* Pick Location Points */}
              {activeBatch.locations.map(loc => {
                const aisleX = aisleCoords[loc.aisle];
                const offset = loc.shelfSide === 'left' ? -12 : 12;
                const pointX = aisleX + offset;

                return (
                  <g key={loc.id}>
                    {/* Pulsing glow ring */}
                    <circle cx={pointX} cy={loc.y} r="8" fill="none" stroke="#f43f5e" strokeWidth="1.5" className="animate-ping" opacity="0.4" />
                    
                    {/* Location dot */}
                    <circle cx={pointX} cy={loc.y} r="5" fill="#f43f5e" stroke="#fff" strokeWidth="1" />
                    
                    {/* Tooltip hover */}
                    <title>{`${loc.sku}: ${loc.name}`}</title>
                  </g>
                );
              })}

            </svg>
          </div>

          {/* Quick tab preview selectors */}
          <div className="grid grid-cols-3 gap-3 select-none">
            <button
              type="button"
              onClick={() => setPreviewAlgo('SShape')}
              className={`py-2 px-3 border rounded-xl font-bold text-xs uppercase transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                previewAlgo === 'SShape' 
                  ? 'bg-blue-650 border-blue-650 text-white shadow' 
                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              S-Shape (Snake)
            </button>

            <button
              type="button"
              onClick={() => setPreviewAlgo('Return')}
              className={`py-2 px-3 border rounded-xl font-bold text-xs uppercase transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                previewAlgo === 'Return' 
                  ? 'bg-purple-600 border-purple-600 text-white shadow' 
                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              Powrotny (Return)
            </button>

            <button
              type="button"
              onClick={() => setPreviewAlgo('LargestGap')}
              className={`py-2 px-3 border rounded-xl font-bold text-xs uppercase transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                previewAlgo === 'LargestGap' 
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow' 
                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Największa Przerwa
            </button>
          </div>

        </div>

        {/* Right: Detailed metrics side-by-side comparison board */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between text-left">
          
          <div className="space-y-4.5">
            
            <div className="border-b border-slate-100 pb-3 select-none">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <BarChart3 className="w-4.5 h-4.5 text-blue-650" />
                Porównanie wskaźników
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Analiza długości trasy w metrach i szacowanego czasu zbiórki.</p>
            </div>

            <div className="space-y-3.5">
              
              {/* S-Shape Metrics Box */}
              <div className={`p-4 border rounded-xl space-y-3 transition-colors ${
                previewAlgo === 'SShape' ? 'border-blue-300 bg-blue-50/10' : 'border-slate-200'
              }`}>
                <div className="flex justify-between items-center select-none">
                  <span className="font-extrabold text-xs text-slate-900">S-Shape (Wąż)</span>
                  {metrics.bestAlgo === 'SShape' && (
                    <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Najkrótszy (Best)
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-black block">Długość ścieżki</span>
                    <span className="text-base font-black text-slate-900 font-mono mt-0.5 block">
                      {metrics.SShape.dist} m
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-black block">Szacowany czas</span>
                    <span className="text-base font-black text-slate-900 font-mono mt-0.5 block">
                      {metrics.SShape.timeStr}
                    </span>
                  </div>
                </div>
              </div>

              {/* Return Metrics Box */}
              <div className={`p-4 border rounded-xl space-y-3 transition-colors ${
                previewAlgo === 'Return' ? 'border-purple-300 bg-purple-50/10' : 'border-slate-200'
              }`}>
                <div className="flex justify-between items-center select-none">
                  <span className="font-extrabold text-xs text-slate-900">Powrotny (Return)</span>
                  {metrics.bestAlgo === 'Return' && (
                    <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Najkrótszy (Best)
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-black block">Długość ścieżki</span>
                    <span className="text-base font-black text-slate-900 font-mono mt-0.5 block">
                      {metrics.Return.dist} m
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-black block">Szacowany czas</span>
                    <span className="text-base font-black text-slate-900 font-mono mt-0.5 block">
                      {metrics.Return.timeStr}
                    </span>
                  </div>
                </div>
              </div>

              {/* Largest Gap Metrics Box */}
              <div className={`p-4 border rounded-xl space-y-3 transition-colors ${
                previewAlgo === 'LargestGap' ? 'border-emerald-300 bg-emerald-50/10' : 'border-slate-200'
              }`}>
                <div className="flex justify-between items-center select-none">
                  <span className="font-extrabold text-xs text-slate-900">Największa Przerwa</span>
                  {metrics.bestAlgo === 'LargestGap' && (
                    <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Najkrótszy (Best)
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-black block">Długość ścieżki</span>
                    <span className="text-base font-black text-slate-900 font-mono mt-0.5 block">
                      {metrics.LargestGap.dist} m
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-black block">Szacowany czas</span>
                    <span className="text-base font-black text-slate-900 font-mono mt-0.5 block">
                      {metrics.LargestGap.timeStr}
                    </span>
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* Activate algorithm selector */}
          <div className="space-y-3 select-none">
            {activeAlgorithm !== previewAlgo ? (
              <button
                type="button"
                onClick={() => handleActivateAlgorithm(previewAlgo)}
                className="w-full h-10.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs uppercase transition-colors cursor-pointer border-none flex items-center justify-center gap-1.5 active:scale-[0.98] shadow-sm"
              >
                Aktywuj schemat: {previewAlgo === 'SShape' ? 'S-Shape' : previewAlgo === 'Return' ? 'Return' : 'Najw. Przerwa'}
              </button>
            ) : (
              <div className="w-full h-10.5 rounded-lg text-emerald-700 bg-emerald-50/60 border border-emerald-250 flex items-center justify-center gap-1.5 text-xs font-black uppercase">
                <CheckCircle2 className="w-4.5 h-4.5 stroke-[2.5]" />
                Algorytm aktywny w systemie
              </div>
            )}
            
            <p className="text-[10px] text-slate-450 leading-relaxed text-center font-medium mt-1">
              * Po aktywacji system WMS będzie sortować lokalizacje zbiórki na terminalach pickerów w celu realizacji wybranego schematu ruchu.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
