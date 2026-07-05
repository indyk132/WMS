import React, { useState, useMemo, useEffect } from 'react';
import { 
  GitMerge, Sparkles, Filter, CheckSquare, Square, Play, 
  Trash2, CheckCircle2, TrendingUp, Boxes, Layers, RefreshCw 
} from 'lucide-react';
import { sounds } from '../../components/SoundEffects';

interface OrderItem {
  sku: string;
  name: string;
  qty: number;
}

interface Order {
  id: string;
  customer: string;
  destination: string;
  status: string;
  priority: string;
  shipmentDate: string;
  items: OrderItem[];
  binId?: string;
  waveId?: string;
}

interface Wave {
  id: string;
  createdAt: string;
  carrier: string;
  profile: 'All' | 'Single-Item' | 'Multi-Item';
  priority: 'All' | 'High';
  status: 'Created' | 'Released' | 'Completed';
  orderIds: string[];
}

interface WavePickingProps {
  orders: Order[];
  onUpdateOrder: (orderId: string, updatedFields: Partial<Order>) => void;
  logActivity: (message: string, type: string, details?: string) => void;
  addToast: (title: string, text: string, type: 'error' | 'warning' | 'info' | 'success') => void;
}

export default function WavePicking({
  orders = [],
  onUpdateOrder,
  logActivity,
  addToast
}: WavePickingProps) {
  const [waves, setWaves] = useState<Wave[]>([]);
  
  // Filter / Builder states
  const [carrierFilter, setCarrierFilter] = useState<string>('All');
  const [profileFilter, setProfileFilter] = useState<'All' | 'Single-Item' | 'Multi-Item'>('All');
  const [priorityFilter, setPriorityFilter] = useState<'All' | 'High'>('All');

  // Selected orders in the builder table
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  // 1. Load active waves from localStorage
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('wms-picking-waves');
      if (saved) {
        setWaves(JSON.parse(saved));
      } else {
        // Initialize with default mock waves
        const initialMock: Wave[] = [
          {
            id: 'WAVE-001',
            createdAt: new Date().toLocaleDateString('pl-PL'),
            carrier: 'DPD',
            profile: 'Single-Item',
            priority: 'All',
            status: 'Released',
            orderIds: []
          }
        ];
        setWaves(initialMock);
        window.localStorage.setItem('wms-picking-waves', JSON.stringify(initialMock));
      }
    } catch (e) {
      console.error("Failed to load waves:", e);
    }
  }, []);

  const saveWaves = (list: Wave[]) => {
    setWaves(list);
    window.localStorage.setItem('wms-picking-waves', JSON.stringify(list));
  };

  // Helper to determine order total items
  const getOrderTotalQty = (order: Order) => {
    return (order.items || []).reduce((sum, item) => sum + (item.qty || 1), 0);
  };

  // 2. Identify orders available to be assigned to a wave
  // Must be in status 'Oczekujące' or 'Do kompletacji' and NOT already in a wave
  const unassignedOrders = useMemo(() => {
    const assignedIds = new Set(waves.flatMap(w => w.orderIds));
    return orders.filter(o => 
      (o.status === 'Oczekujące' || o.status === 'Do kompletacji' || o.status === 'W realizacji') && 
      !assignedIds.has(o.id)
    );
  }, [orders, waves]);

  // 3. Filter orders in the builder list based on selected criteria
  const filteredOrders = useMemo(() => {
    return unassignedOrders.filter(o => {
      // Filter carrier
      if (carrierFilter !== 'All') {
        const notes = (o.items ? '' : '') + (o.id || ''); // dummy
        // Check if destination or address or courier matches (we mock matching via deterministic hashes if empty)
        const carrierSeed = o.destination.toLowerCase();
        if (!carrierSeed.includes(carrierFilter.toLowerCase()) && carrierFilter !== 'DPD') {
          // If no direct match, mock carrier match deterministically
          const hash = o.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
          const mockCarriers = ['DPD', 'DHL', 'InPost', 'GLS', 'UPS'];
          if (mockCarriers[hash % mockCarriers.length] !== carrierFilter) {
            return false;
          }
        }
      }

      // Filter Profile: Single-item (exactly 1 item total) vs Multi-item (>= 2 items total)
      if (profileFilter !== 'All') {
        const totalQty = getOrderTotalQty(o);
        if (profileFilter === 'Single-Item' && totalQty !== 1) return false;
        if (profileFilter === 'Multi-Item' && totalQty < 2) return false;
      }

      // Filter Priority
      if (priorityFilter !== 'All') {
        if (priorityFilter === 'High' && o.priority !== 'High') return false;
      }

      return true;
    });
  }, [unassignedOrders, carrierFilter, profileFilter, priorityFilter]);

  // Auto-select filtered orders when filter changes to make it quick
  useEffect(() => {
    setSelectedOrderIds(filteredOrders.map(o => o.id));
  }, [filteredOrders]);

  // 4. Calculate dynamic progress for each active wave
  const wavesWithProgress = useMemo(() => {
    let updatedNeeded = false;
    const list = waves.map(wave => {
      const waveOrders = orders.filter(o => wave.orderIds.includes(o.id));
      if (waveOrders.length === 0) {
        return { ...wave, progressPct: 0, completedCount: 0, totalCount: 0 };
      }

      const completedCount = waveOrders.filter(o => 
        o.status === 'Spakowane' || o.status === 'Wysłane'
      ).length;
      
      const progressPct = Math.round((completedCount / waveOrders.length) * 100);

      // Auto-complete wave if all orders are packed and wave is released
      if (progressPct === 100 && wave.status === 'Released') {
        wave.status = 'Completed';
        updatedNeeded = true;
      }

      return {
        ...wave,
        progressPct,
        completedCount,
        totalCount: waveOrders.length
      };
    });

    if (updatedNeeded) {
      setTimeout(() => saveWaves(list), 50);
    }

    return list;
  }, [waves, orders]);

  // 5. Create a new wave
  const handleCreateWave = () => {
    sounds.playBeep();
    if (selectedOrderIds.length === 0) {
      addToast('Brak zamówień', 'Wybierz przynajmniej jedno zamówienie do utworzenia fali.', 'warning');
      return;
    }

    const newWave: Wave = {
      id: `WAVE-0${Math.floor(100 + Math.random() * 900)}`,
      createdAt: new Date().toLocaleDateString('pl-PL'),
      carrier: carrierFilter === 'All' ? 'Wielu Kurierów' : carrierFilter,
      profile: profileFilter,
      priority: priorityFilter,
      status: 'Created',
      orderIds: [...selectedOrderIds]
    };

    const updated = [...waves, newWave];
    saveWaves(updated);

    logActivity(
      `Utworzono nową Falę Zbiórki ${newWave.id}`,
      'wave',
      `Liczba zamówień w fali: ${newWave.orderIds.length}. Kryteria - Profil: ${newWave.profile}, Przewoźnik: ${newWave.carrier}`
    );

    addToast('Utworzono falę', `Zapisano ${newWave.id} zawierającą ${newWave.orderIds.length} zamówień.`, 'success');
    setSelectedOrderIds([]);
  };

  // 6. Release Wave (Uwolnij do zbiórki)
  const handleReleaseWave = (waveId: string) => {
    sounds.playSuccess();
    const wave = waves.find(w => w.id === waveId);
    if (!wave) return;

    // Mass update order statuses to 'Do kompletacji' and bind waveId
    wave.orderIds.forEach(orderId => {
      onUpdateOrder(orderId, {
        status: 'Do kompletacji',
        waveId: wave.id
      });
    });

    // Update wave status to 'Released'
    const updated = waves.map(w => w.id === waveId ? { ...w, status: 'Released' as const } : w);
    saveWaves(updated);

    logActivity(
      `Uwolniono do kompletacji Falę Zbiórki ${wave.id}`,
      'wave',
      `Status wszystkich ${wave.orderIds.length} zamówień w fali został zmieniony na 'Do kompletacji'.`
    );

    addToast('Fala uwolniona', `Zlecenia z fali ${wave.id} trafiły do terminali zbieraczy.`, 'success');
  };

  // 7. Delete Wave
  const handleDeleteWave = (waveId: string) => {
    sounds.playBeep();
    const filtered = waves.filter(w => w.id !== waveId);
    saveWaves(filtered);

    // Revert orders in wave back to unassigned if wave was not completed
    const wave = waves.find(w => w.id === waveId);
    if (wave && wave.status === 'Released') {
      wave.orderIds.forEach(orderId => {
        onUpdateOrder(orderId, {
          status: 'Oczekujące',
          waveId: undefined
        });
      });
    }

    logActivity(`Usunięto Falę Zbiórki ${waveId}`, 'wave', 'Wycofano przypisania zamówień.');
    addToast('Fala usunięta', `Usunięto falę ${waveId} z systemu.`, 'info');
  };

  // 8. Overall wave stats
  const stats = useMemo(() => {
    const active = wavesWithProgress.filter(w => w.status !== 'Completed').length;
    const unassignedCount = unassignedOrders.length;
    
    const completedWaves = wavesWithProgress.filter(w => w.status === 'Completed').length;
    const totalWaves = wavesWithProgress.length || 1;
    const completedPct = Math.round((completedWaves / totalWaves) * 100);

    return {
      active,
      unassignedCount,
      completedPct
    };
  }, [wavesWithProgress, unassignedOrders]);

  const toggleSelectOrder = (id: string) => {
    sounds.playBeep();
    setSelectedOrderIds(prev => 
      prev.includes(id) ? prev.filter(oid => oid !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    sounds.playBeep();
    if (selectedOrderIds.length === filteredOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredOrders.map(o => o.id));
    }
  };

  return (
    <div id="wms-wave-picking-panel" className="space-y-6 font-sans text-sm text-[#334155] animate-fadeIn pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-left">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
            <GitMerge className="w-5.5 h-5.5 text-blue-650" /> Moduł Zbiórki Falowej (Wave Picking Release)
          </h2>
          <p className="text-xs text-slate-500 mt-1.5 max-w-xl">
            Grupuj pojedyncze zamówienia klientów w zoptymalizowane Fale Zbiórki na podstawie wspólnego kuriera lub gabarytu, aby zminimalizować czas przejazdu zbieraczy po hali.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        <div className="bg-white border border-slate-200 rounded-xl p-4.5 flex items-center justify-between shadow-xs text-left">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase select-none">Aktywne fale</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 font-mono">{stats.active}</span>
              <span className="text-xs font-semibold text-blue-650 bg-blue-50 px-1.5 py-0.2 rounded">w toku</span>
            </div>
            <span className="text-[10px] text-slate-450 block">Liczba fal aktualnie kompletowanych i pakowanych.</span>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
            <Layers className="w-6 h-6 stroke-1.5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4.5 flex items-center justify-between shadow-xs text-left">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase select-none">Zlecenia poza falami</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 font-mono">{stats.unassignedCount}</span>
              <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded">zamówień</span>
            </div>
            <span className="text-[10px] text-slate-450 block">Otwarte zamówienia czekające na konsolidację.</span>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <Boxes className="w-6 h-6 stroke-1.5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4.5 flex items-center justify-between shadow-xs text-left">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase select-none">Wskaźnik ukończenia fal</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-700 font-mono">{stats.completedPct}%</span>
              <span className="text-xs font-semibold text-emerald-650 bg-emerald-50 px-1.5 py-0.2 rounded">zamkniętych</span>
            </div>
            <span className="text-[10px] text-slate-450 block">Ukończone i odprawione fale spedycyjne.</span>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <TrendingUp className="w-6 h-6 stroke-1.5" />
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Wave Builder Form and pending orders list */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5 text-left">
          
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center select-none">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Sparkles className="w-4.5 h-4.5 text-blue-650" />
                Generator Nowej Fali
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Sfiltruj i wybierz zamówienia wychodzące w celu utworzenia zoptymalizowanej fali zbiórki.</p>
            </div>
            <button
              onClick={handleCreateWave}
              disabled={selectedOrderIds.length === 0}
              className={`h-9 px-4 rounded-lg font-bold text-xs uppercase transition-all flex items-center gap-1.5 border-none shadow-sm cursor-pointer ${
                selectedOrderIds.length > 0 
                  ? 'bg-blue-650 text-white hover:bg-blue-750 active:scale-[0.98]' 
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <GitMerge className="w-4 h-4" />
              Grupuj w Falę ({selectedOrderIds.length})
            </button>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Przewoźnik (Kurier)</label>
              <select
                value={carrierFilter}
                onChange={(e) => setCarrierFilter(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="All">Wszyscy kurierzy</option>
                <option value="DPD">DPD</option>
                <option value="DHL">DHL</option>
                <option value="InPost">InPost</option>
                <option value="GLS">GLS</option>
                <option value="UPS">UPS</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Profil zamówienia</label>
              <select
                value={profileFilter}
                onChange={(e) => setProfileFilter(e.target.value as any)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="All">Wszystkie profile</option>
                <option value="Single-Item">Tylko Jednoelementowe (Single-item)</option>
                <option value="Multi-Item">Tylko Wieloelementowe (Multi-item)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Priorytet zlecenia</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as any)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="All">Wszystkie priorytety</option>
                <option value="High">Tylko Wysoki (Urgent)</option>
              </select>
            </div>
          </div>

          {/* Builder Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse select-none">
              <thead>
                <tr className="border-b border-slate-150 text-[10px] text-slate-400 font-extrabold uppercase">
                  <th className="py-2.5 px-3 w-10 text-center">
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="p-1 hover:bg-slate-100 rounded border-none bg-transparent cursor-pointer text-slate-500"
                    >
                      {selectedOrderIds.length === filteredOrders.length && filteredOrders.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-blue-650" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </th>
                  <th className="py-2.5 px-3">Kod zamówienia</th>
                  <th className="py-2.5 px-3">Odbiorca</th>
                  <th className="py-2.5 px-3 text-center">Pozycje SKU</th>
                  <th className="py-2.5 px-3">Priorytet</th>
                  <th className="py-2.5 px-3">Metoda wysyłki</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-semibold select-none">
                      Brak pasujących oczekujących zamówień dla wybranych kryteriów.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map(order => {
                    const isSelected = selectedOrderIds.includes(order.id);
                    const totalQty = getOrderTotalQty(order);

                    // Mock carrier name representation for UI
                    const hash = order.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
                    const mockCarriers = ['DPD', 'DHL', 'InPost', 'GLS', 'UPS'];
                    const carrier = mockCarriers[hash % mockCarriers.length];

                    return (
                      <tr 
                        key={order.id}
                        className={`border-b border-slate-100 text-xs font-semibold hover:bg-slate-50 transition-colors ${
                          isSelected ? 'bg-blue-50/20' : ''
                        }`}
                      >
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => toggleSelectOrder(order.id)}
                            className="p-1 hover:bg-slate-100 rounded border-none bg-transparent cursor-pointer text-slate-500"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-blue-650" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400" />
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">{order.id}</td>
                        <td className="py-3 px-3 truncate max-w-[150px]" title={order.customer}>{order.customer}</td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-extrabold ${
                            totalQty === 1 
                              ? 'bg-purple-50 text-purple-700 border border-purple-200' 
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          }`}>
                            {totalQty} szt. {totalQty === 1 ? '(Single)' : '(Multi)'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                            order.priority === 'High' 
                              ? 'bg-rose-50 border border-rose-200 text-rose-700' 
                              : 'bg-slate-50 border border-slate-200 text-slate-655'
                          }`}>
                            {order.priority === 'High' ? 'Pilny' : 'Standard'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-mono text-[10px] bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-700">
                            {carrier}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>

        {/* Right: Active Waves Panel */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 text-left">
          
          <div className="border-b border-slate-100 pb-3 select-none">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <GitMerge className="w-4.5 h-4.5 text-blue-650" />
              Aktywne Fale Zbiórki
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Śledź stan realizacji i uwalniaj utworzone partie do kompletacji.</p>
          </div>

          <div className="space-y-4.5 pt-1">
            {wavesWithProgress.length === 0 ? (
              <div className="py-12 text-center text-slate-400 select-none">
                <Boxes className="w-10 h-10 text-slate-300 mx-auto" />
                <span className="text-xs font-bold text-slate-600 mt-2 block">Brak aktywnych fal</span>
                <span className="text-[10px] text-slate-400 mt-1 block">Utwórz pierwszą falę, aby rozdzielić pracę.</span>
              </div>
            ) : (
              wavesWithProgress.map(wave => {
                const total = wave.totalCount || wave.orderIds.length;
                const completed = wave.completedCount || 0;
                
                return (
                  <div 
                    key={wave.id} 
                    className="p-4 border border-slate-200 rounded-xl space-y-3 shadow-xs hover:border-slate-300 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-mono font-black text-xs text-slate-900">{wave.id}</span>
                        <div className="flex flex-wrap gap-1.5 mt-1 font-semibold text-[8.5px] select-none text-slate-450">
                          <span className="bg-slate-100 px-1.5 py-0.2 rounded border border-slate-250 uppercase">{wave.carrier}</span>
                          <span className="bg-slate-100 px-1.5 py-0.2 rounded border border-slate-250 uppercase">{wave.profile}</span>
                        </div>
                      </div>
                      
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                        wave.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-250 shadow-sm' :
                        wave.status === 'Released' ? 'bg-blue-50 text-blue-700 border border-blue-200 animate-pulse' :
                        'bg-slate-50 text-slate-655 border border-slate-200'
                      }`}>
                        {wave.status === 'Completed' ? 'Ukończona' : wave.status === 'Released' ? 'W zbiórce' : 'Utworzona'}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between text-[10px] text-slate-500 font-semibold select-none">
                        <span>Postęp wysyłki:</span>
                        <span className="font-mono font-bold">{completed} / {total} paczek ({wave.progressPct}%)</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            wave.status === 'Completed' ? 'bg-emerald-500' : 'bg-blue-600'
                          }`} 
                          style={{ width: `${wave.progressPct}%` }} 
                        />
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-100 select-none">
                      {wave.status === 'Created' && (
                        <button
                          type="button"
                          onClick={() => handleReleaseWave(wave.id)}
                          className="flex-1 h-8 bg-blue-650 hover:bg-blue-700 text-white rounded font-bold text-[10px] uppercase transition-colors cursor-pointer border-none flex items-center justify-center gap-1 active:scale-[0.98]"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          Uwolnij do kompletacji
                        </button>
                      )}
                      
                      {wave.status !== 'Completed' && (
                        <button
                          type="button"
                          onClick={() => handleDeleteWave(wave.id)}
                          className="h-8 px-2.5 border border-slate-200 hover:bg-rose-50 hover:border-rose-250 hover:text-rose-700 text-slate-500 rounded transition-all cursor-pointer flex items-center justify-center"
                          title="Usuń falę i cofnij zamówienia"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      
                      {wave.status === 'Completed' && (
                        <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-emerald-700 bg-emerald-50/50 border border-emerald-200 px-3 py-1 rounded-lg w-full justify-center">
                          <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                          Kompletna i Spakowana
                        </div>
                      )}
                    </div>

                  </div>
                );
              })
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
