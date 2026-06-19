import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, DollarSign, PackageCheck, Package, 
  Clock, UserCheck, MapPin, Activity, CheckCircle2, AlertTriangle, 
  Users, Target, BarChart3, Filter, Award, Search, X, ChevronDown, Calendar, ArrowUpDown,
  Move, CheckCircle
} from 'lucide-react';
import { Product } from '../../services/inventoryApi';

interface StatisticsProps {
  orders: any[];
  products: Product[];
  zones: any[];
  staffList: any[];
  onRelocateProduct?: (sku: string, newLocationCode: string, newZone: string) => void;
}

interface AnalyticsEvent {
  type: 'new' | 'completed' | 'pick' | 'pack';
  date: Date;
  warehouseCode: string;
  workerName?: string;
  orderId: string;
}

const polishMonthMap: Record<string, number> = {
  'Sty': 0, 'Lut': 1, 'Mar': 2, 'Kwi': 3, 'Maj': 4, 'Cze': 5,
  'Lip': 6, 'Sie': 7, 'Wrz': 8, 'Paź': 9, 'Lis': 10, 'Gru': 11
};

const parseOrderDate = (dateStr: string): Date | null => {
  if (!dateStr || dateStr === 'Nieustalony' || dateStr === 'Ukończono') return null;
  const match = dateStr.match(/^(\d+)\s+([a-zA-ZáćęłńóśźżĄĆĘŁŃÓŚŹŻ]{3})/);
  if (!match) return null;
  const day = parseInt(match[1], 10);
  const monthStr = match[2];
  const month = polishMonthMap[monthStr];
  if (month === undefined) return null;
  const d = new Date();
  return new Date(d.getFullYear(), month, day);
};

const formatDayMonth = (d: Date) => {
  const months = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'];
  return `${d.getDate()} ${months[d.getMonth()]}`;
};

const formatDateISO = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDaysInRange = (start: Date, end: Date) => {
  const arr = [];
  const dt = new Date(start);
  while (dt <= end) {
    arr.push(new Date(dt));
    dt.setDate(dt.getDate() + 1);
  }
  return arr;
};

// Deterministic random number generator based on string seed
const getDeterministicRandom = (seed: string) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  }
  return function() {
    h = Math.imul(h ^ h >>> 16, 2246822507);
    h = Math.imul(h ^ h >>> 13, 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
};

const generateMockStaff = () => {
  const firstNames = ['Jan', 'Marcin', 'Piotr', 'Krzysztof', 'Tomasz', 'Andrzej', 'Paweł', 'Janusz', 'Mateusz', 'Michał', 'Jakub', 'Adam', 'Łukasz', 'Kamil', 'Rafał', 'Wojciech', 'Robert', 'Sebastian', 'Patryk', 'Maciej', 'Mariusz', 'Dariusz', 'Grzegorz', 'Jacek', 'Zofia', 'Hanna', 'Anna', 'Katarzyna', 'Małgorzata', 'Agnieszka'];
  const lastNames = ['Nowak', 'Kowalski', 'Wiśniewski', 'Wójcik', 'Kowalczyk', 'Kamiński', 'Lewandowski', 'Zieliński', 'Szymański', 'Woźniak', 'Dąbrowski', 'Kozłowski', 'Mazur', 'Jankowski', 'Kwiatkowski', 'Wojciechowski', 'Krawczyk', 'Kaczmarek', 'Piotrowski', 'Grabowski'];
  
  const staff: any[] = [];
  let idCounter = 1000;
  for (let i = 0; i < firstNames.length; i++) {
    for (let j = 0; j < lastNames.length; j++) {
      const name = `${firstNames[i]} ${lastNames[j]}`;
      const hash = i * 17 + j * 31;
      const role = hash % 2 === 0 ? 'Picker' : 'Packer';
      const wh = hash % 3 === 0 ? 'HUB-PL-01' : 'HUB-PL-02';
      
      staff.push({
        id: `EMP-${idCounter++}`,
        firstName: firstNames[i],
        lastName: lastNames[j],
        name,
        role,
        warehouseCode: wh
      });
      if (staff.length >= 150) return staff;
    }
  }
  return staff;
};

const formatLabel = (label: string, totalItemsCount: number) => {
  const dateMatch = label.match(/^(\d+)\s+([a-zA-ZáćęłńóśźżĄĆĘŁŃÓŚŹŻ]{3})/);
  if (dateMatch) {
    if (totalItemsCount > 12) {
      return dateMatch[1];
    }
    return label;
  }
  
  if (label.includes(' ')) {
    const parts = label.split(' ');
    if (totalItemsCount > 6) {
      return parts[0];
    }
    return label;
  }
  
  return label;
};

interface BarChartProps {
  title: string;
  data: { label: string; value: number }[];
  colorFrom: string;
  colorTo: string;
  icon: React.ReactNode;
  yLabel?: string;
  onBarClick?: (name: string) => void;
}

function BarChart({ title, data, colorFrom, colorTo, icon, yLabel = 'operacji', onBarClick }: BarChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  
  const maxValue = useMemo(() => {
    const vals = data.map(d => d.value);
    return Math.max(...vals, 1);
  }, [data]);

  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 shadow-sm flex flex-col h-[400px] relative transition-all hover:shadow-md">
      {/* Title */}
      <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="text-[#2170e4]">{icon}</div>
          <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">{title}</h3>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">Kliknij słupek po szczegóły</span>
      </div>

      {data.length === 0 ? (
        <div className="flex-grow flex items-center justify-center text-xs text-slate-400">
          Brak danych do wyświetlenia w tym zakresie
        </div>
      ) : (
        <div className="flex-grow flex flex-col justify-end">
          {/* Main Chart Area */}
          <div className="flex-grow flex items-end justify-between gap-1.5 h-56 relative border-b border-slate-200 pb-1">
            {/* Grid Y-lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[8px] text-slate-400">
              <div className="border-b border-slate-100/70 w-full pt-0.5 pr-1 text-right">{Math.round(maxValue)}</div>
              <div className="border-b border-slate-100/70 w-full pt-0.5 pr-1 text-right">{Math.round(maxValue * 0.75)}</div>
              <div className="border-b border-slate-100/70 w-full pt-0.5 pr-1 text-right">{Math.round(maxValue * 0.5)}</div>
              <div className="border-b border-slate-100/70 w-full pt-0.5 pr-1 text-right">{Math.round(maxValue * 0.25)}</div>
              <div className="w-full pr-1 text-right">0</div>
            </div>

            {/* Bars */}
            <div className="w-full h-full flex items-end justify-around relative z-10 pt-4">
              {data.map((item, idx) => {
                const heightPercent = (item.value / maxValue) * 100;
                const isHovered = hoveredIdx === idx;
                
                return (
                  <div
                    key={idx}
                    className="flex-grow flex flex-col items-center group relative cursor-pointer"
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    onClick={() => onBarClick && onBarClick(item.label)}
                    style={{ height: '100%', justifyContent: 'flex-end' }}
                  >
                    {/* Tooltip */}
                    {isHovered && (
                      <div className="absolute -top-11 z-30 bg-[#0f172a] text-white px-2.5 py-1 rounded-md text-[10px] md:text-xs font-semibold shadow-xl border border-[#334155] whitespace-nowrap animate-fadeIn flex flex-col items-center">
                        <span className="font-bold">{item.label}</span>
                        <span className="text-blue-400 font-mono font-bold mt-0.5">{item.value} {yLabel}</span>
                        <div className="w-1.5 h-1.5 bg-[#0f172a] rotate-45 border-r border-b border-[#334155] absolute -bottom-1"></div>
                      </div>
                    )}

                    {/* Bar Column */}
                    <div
                      style={{ height: `${Math.max(heightPercent, 2)}%` }}
                      className={`w-full max-w-[28px] bg-gradient-to-t ${colorFrom} ${colorTo} rounded-t-sm transition-all duration-300 ${
                        isHovered ? 'brightness-110 shadow-sm' : ''
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* X-axis labels */}
          <div className="flex justify-around items-start pt-2.5 h-10 select-none">
            {data.map((item, idx) => {
              const formattedLabel = formatLabel(item.label, data.length);
              const isHovered = hoveredIdx === idx;
              return (
                <div
                  key={idx}
                  className={`text-[8px] md:text-[9px] font-bold text-center truncate ${
                    isHovered ? 'text-blue-600 font-extrabold' : 'text-slate-400'
                  }`}
                  style={{ width: `${100 / data.length}%` }}
                  title={item.label}
                >
                  {formattedLabel}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Statistics({ orders = [], products = [], zones = [], staffList = [], onRelocateProduct }: StatisticsProps) {
  const [activeTab, setActiveTab] = useState<'packers' | 'pickers' | 'new_orders' | 'completed_orders' | 'sku_rotation'>('packers');
  const [dateRangeType, setDateRangeType] = useState<'day' | 'week' | 'month' | 'custom'>('month');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('all');
  
  // Worker filters
  const [workerSearchText, setWorkerSearchText] = useState('');
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([]);
  const [workerSearchQuery, setWorkerSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [topLimit, setTopLimit] = useState<10 | 20 | 50 | 'all'>(20);
  const [viewType, setViewType] = useState<'chart' | 'table'>('chart');
  
  // Detailed Analysis state
  const [selectedWorkerName, setSelectedWorkerName] = useState<string | null>(null);

  // Sorting for table
  const [sortField, setSortField] = useState<'rank' | 'name' | 'value'>('rank');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Combined operation staff (mock seed + real staff)
  const combinedStaff = useMemo(() => {
    const mockList = generateMockStaff();
    const realList = staffList.map(s => ({
      id: s.employeeId || s.id,
      firstName: s.firstName,
      lastName: s.lastName,
      name: `${s.firstName} ${s.lastName}`,
      role: s.role,
      warehouseCode: s.warehouseCode || 'HUB-PL-01'
    }));
    
    const seen = new Set();
    const list: any[] = [];
    [...realList, ...mockList].forEach(s => {
      if (s.name && !seen.has(s.name) && s.role !== 'Admin') {
        seen.add(s.name);
        list.push(s);
      }
    });
    return list;
  }, [staffList]);

  // Picker & Packer subsets for deterministic seeding
  const pickersList = useMemo(() => combinedStaff.filter(s => s.role === 'Picker' || s.role === 'Logistics Planner' || s.role === 'Inventory Auditor'), [combinedStaff]);
  const packersList = useMemo(() => combinedStaff.filter(s => s.role === 'Packer' || s.role === 'Warehouse Manager' || s.role === 'Sales Manager'), [combinedStaff]);

  // Unique worker names for chips search dropdown
  const dropdownMatches = useMemo(() => {
    if (!workerSearchQuery) return [];
    return combinedStaff.filter(s => 
      s.name.toLowerCase().includes(workerSearchQuery.toLowerCase()) &&
      !selectedWorkers.includes(s.name)
    ).slice(0, 6);
  }, [workerSearchQuery, combinedStaff, selectedWorkers]);

  // Date check logic
  const isWithinDateRange = useMemo(() => {
    return (date: Date) => {
      const now = new Date();
      
      if (dateRangeType === 'day') {
        return date.getDate() === now.getDate() &&
               date.getMonth() === now.getMonth() &&
               date.getFullYear() === now.getFullYear();
      }
      
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      if (dateRangeType === 'week') {
        const oneWeekAgo = new Date(startOfToday.getTime() - 6 * 24 * 60 * 60 * 1000);
        oneWeekAgo.setHours(0, 0, 0, 0);
        return date >= oneWeekAgo && date <= now;
      }
      
      if (dateRangeType === 'month') {
        const oneMonthAgo = new Date(startOfToday.getTime() - 29 * 24 * 60 * 60 * 1000);
        oneMonthAgo.setHours(0, 0, 0, 0);
        return date >= oneMonthAgo && date <= now;
      }
      
      if (dateRangeType === 'custom') {
        const targetTime = date.getTime();
        if (startDate) {
          const sD = new Date(startDate);
          sD.setHours(0, 0, 0, 0);
          if (targetTime < sD.getTime()) return false;
        }
        if (endDate) {
          const eD = new Date(endDate);
          eD.setHours(23, 59, 59, 999);
          if (targetTime > eD.getTime()) return false;
        }
        return true;
      }
      
      return true;
    };
  }, [dateRangeType, startDate, endDate]);

  // Unified telemetry events database
  const allEvents = useMemo(() => {
    const events: AnalyticsEvent[] = [];
    const now = new Date();

    // Parse live orders and append their analytics
    orders.forEach(o => {
      let dateObj = parseOrderDate(o.shipmentDate);
      if (!dateObj) {
        const orderNum = parseInt(o.id.replace(/\D/g, ''), 10) || 0;
        dateObj = new Date(now.getTime() - (orderNum % 25) * 24 * 60 * 60 * 1000);
      }
      
      const wh = o.warehouseCode || (parseInt(o.id.replace(/\D/g, ''), 10) % 2 === 0 ? 'HUB-PL-01' : 'HUB-PL-02');
      
      events.push({
        type: 'new',
        date: dateObj,
        warehouseCode: wh,
        orderId: o.id
      });
      
      if (['spakowane', 'wysłane', 'dostarczone'].includes((o.status || '').toLowerCase())) {
        events.push({
          type: 'completed',
          date: dateObj,
          warehouseCode: wh,
          orderId: o.id
        });
      }
      
      if (o.internalNotes) {
        const lines = o.internalNotes.split('\n');
        lines.forEach((line: string) => {
          if (line.includes('[PICKER]')) {
            const parts = line.split('przez ');
            if (parts.length > 1) {
              const namePart = parts[1].split('.')[0].split(' Czas:')[0].trim();
              if (namePart) {
                events.push({
                  type: 'pick',
                  date: dateObj,
                  warehouseCode: wh,
                  workerName: namePart,
                  orderId: o.id
                });
              }
            }
          }
          if (line.includes('[PACKER]')) {
            const parts = line.split('przez ');
            if (parts.length > 1) {
              const namePart = parts[1].split('.')[0].split(' Wygenerowano')[0].trim();
              if (namePart) {
                events.push({
                  type: 'pack',
                  date: dateObj,
                  warehouseCode: wh,
                  workerName: namePart,
                  orderId: o.id
                });
              }
            }
          }
        });
      }
    });

    return events;
  }, [orders]);

  // Helper check for employee search text & multiselect chip inputs
  const matchesWorkerFilter = useMemo(() => {
    return (name?: string) => {
      if (!name) return false;
      
      // Text search
      if (workerSearchText && !name.toLowerCase().includes(workerSearchText.toLowerCase())) {
        return false;
      }
      
      // Multiselect chips
      if (selectedWorkers.length > 0 && !selectedWorkers.includes(name)) {
        return false;
      }
      
      return true;
    };
  }, [workerSearchText, selectedWorkers]);

  // Filtered events based on date, warehouse and employee selection
  const filteredEvents = useMemo(() => {
    return allEvents.filter(e => {
      // Date range filter
      if (!isWithinDateRange(e.date)) return false;
      
      // Warehouse filter
      if (warehouseFilter !== 'all' && e.warehouseCode !== warehouseFilter) return false;
      
      // Worker filter
      const isFilteredByWorker = workerSearchText || selectedWorkers.length > 0;
      if (isFilteredByWorker) {
        if (e.workerName) {
          return matchesWorkerFilter(e.workerName);
        } else {
          // If order, verify if it was processed by any worker matching filter
          const relatesToMatchedWorker = allEvents.some(ae => 
            ae.orderId === e.orderId && 
            (ae.type === 'pick' || ae.type === 'pack') && 
            ae.workerName && matchesWorkerFilter(ae.workerName)
          );
          return relatesToMatchedWorker;
        }
      }
      
      return true;
    });
  }, [allEvents, isWithinDateRange, warehouseFilter, matchesWorkerFilter, workerSearchText, selectedWorkers]);

  // KPI calculations
  const kpiStats = useMemo(() => {
    let newOrdersCount = 0;
    let completedOrdersCount = 0;
    let packedCount = 0;
    let pickedCount = 0;
    
    filteredEvents.forEach(e => {
      if (e.type === 'new') newOrdersCount++;
      else if (e.type === 'completed') completedOrdersCount++;
      else if (e.type === 'pack') packedCount++;
      else if (e.type === 'pick') pickedCount++;
    });
    
    return {
      newOrdersCount,
      completedOrdersCount,
      packedCount,
      pickedCount
    };
  }, [filteredEvents]);

  // Packers aggregation
  const packersDataAll = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredEvents.forEach(e => {
      if (e.type === 'pack' && e.workerName) {
        counts[e.workerName] = (counts[e.workerName] || 0) + 1;
      }
    });
    
    // Seed with 0 if no specific workers filtered to keep full roster visible
    const isFiltered = workerSearchText || selectedWorkers.length > 0;
    if (!isFiltered) {
      combinedStaff.forEach(s => {
        if (s.role === 'Packer' || s.role === 'Warehouse Manager' || s.role === 'Sales Manager') {
          if (counts[s.name] === undefined) counts[s.name] = 0;
        }
      });
    }
    
    return Object.entries(counts)
      .map(([label, value]) => ({ label, value }))
      .filter(item => {
        if (isFiltered) return matchesWorkerFilter(item.label);
        return true;
      })
      .sort((a, b) => b.value - a.value);
  }, [filteredEvents, combinedStaff, matchesWorkerFilter, workerSearchText, selectedWorkers]);

  // Sliced Packers data by limit selector
  const packerData = useMemo(() => {
    if (topLimit === 'all') return packersDataAll;
    return packersDataAll.slice(0, topLimit);
  }, [packersDataAll, topLimit]);

  // Pickers aggregation
  const pickersDataAll = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredEvents.forEach(e => {
      if (e.type === 'pick' && e.workerName) {
        counts[e.workerName] = (counts[e.workerName] || 0) + 1;
      }
    });
    
    const isFiltered = workerSearchText || selectedWorkers.length > 0;
    if (!isFiltered) {
      combinedStaff.forEach(s => {
        if (s.role === 'Picker' || s.role === 'Inventory Auditor' || s.role === 'Logistics Planner') {
          if (counts[s.name] === undefined) counts[s.name] = 0;
        }
      });
    }
    
    return Object.entries(counts)
      .map(([label, value]) => ({ label, value }))
      .filter(item => {
        if (isFiltered) return matchesWorkerFilter(item.label);
        return true;
      })
      .sort((a, b) => b.value - a.value);
  }, [filteredEvents, combinedStaff, matchesWorkerFilter, workerSearchText, selectedWorkers]);

  // Sliced Pickers data by limit selector
  const pickerData = useMemo(() => {
    if (topLimit === 'all') return pickersDataAll;
    return pickersDataAll.slice(0, topLimit);
  }, [pickersDataAll, topLimit]);

  // Order volumes timeline aggregation
  const timeSeriesData = useMemo(() => {
    const now = new Date();
    
    if (dateRangeType === 'day') {
      const hours = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
      const newCounts: Record<string, number> = {};
      const compCounts: Record<string, number> = {};
      
      hours.forEach(h => {
        newCounts[h] = 0;
        compCounts[h] = 0;
      });
      
      filteredEvents.forEach(e => {
        if (e.type === 'new' || e.type === 'completed') {
          const hour = e.date.getHours();
          let slot = '22:00';
          if (hour < 10) slot = '08:00';
          else if (hour < 12) slot = '10:00';
          else if (hour < 14) slot = '12:00';
          else if (hour < 16) slot = '14:00';
          else if (hour < 18) slot = '16:00';
          else if (hour < 20) slot = '18:00';
          else if (hour < 22) slot = '20:00';
          
          if (e.type === 'new') newCounts[slot]++;
          else compCounts[slot]++;
        }
      });
      
      return {
        newOrders: hours.map(h => ({ label: h, value: newCounts[h] })),
        completedOrders: hours.map(h => ({ label: h, value: compCounts[h] }))
      };
    }
    
    // Group by Day for ranges
    let startDateObj = new Date();
    let endDateObj = new Date();
    
    if (dateRangeType === 'week') {
      startDateObj = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
    } else if (dateRangeType === 'month') {
      startDateObj = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
    } else if (dateRangeType === 'custom') {
      startDateObj = startDate ? new Date(startDate) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      endDateObj = endDate ? new Date(endDate) : new Date();
    }
    
    startDateObj.setHours(0, 0, 0, 0);
    endDateObj.setHours(23, 59, 59, 999);
    
    const days = getDaysInRange(startDateObj, endDateObj);
    const newCounts: Record<string, number> = {};
    const compCounts: Record<string, number> = {};
    
    days.forEach(d => {
      const label = formatDayMonth(d);
      newCounts[label] = 0;
      compCounts[label] = 0;
    });
    
    filteredEvents.forEach(e => {
      if (e.type === 'new' || e.type === 'completed') {
        const label = formatDayMonth(e.date);
        if (newCounts[label] !== undefined) {
          if (e.type === 'new') newCounts[label]++;
          else compCounts[label]++;
        }
      }
    });
    
    return {
      newOrders: days.map(d => {
        const label = formatDayMonth(d);
        return { label, value: newCounts[label] };
      }),
      completedOrders: days.map(d => {
        const label = formatDayMonth(d);
        return { label, value: compCounts[label] };
      })
    };
  }, [filteredEvents, dateRangeType, startDate, endDate]);

  // Determine active dataset & layouts
  const activeData = useMemo(() => {
    if (activeTab === 'packers') return packerData;
    if (activeTab === 'pickers') return pickerData;
    if (activeTab === 'new_orders') return timeSeriesData.newOrders;
    return timeSeriesData.completedOrders;
  }, [activeTab, packerData, pickerData, timeSeriesData]);

  // Raw counts before limit slicing (used to determine >30 threshold)
  const rawListLength = useMemo(() => {
    if (activeTab === 'packers') return packersDataAll.length;
    if (activeTab === 'pickers') return pickersDataAll.length;
    return activeData.length;
  }, [activeTab, packersDataAll, pickersDataAll, activeData]);

  const shouldSwitchToAltView = (activeTab === 'packers' || activeTab === 'pickers') && rawListLength > 30;

  // Sorting table data
  const sortedTableData = useMemo(() => {
    const list = activeData.map((item, idx) => ({
      rank: idx + 1,
      name: item.label,
      value: item.value
    }));
    
    return list.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'rank') {
        comparison = a.rank - b.rank;
      } else if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name, 'pl');
      } else if (sortField === 'value') {
        comparison = a.value - b.value;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [activeData, sortField, sortDirection]);

  const handleSort = (field: 'rank' | 'name' | 'value') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Detailed Analysis modes helper values
  const daysCount = useMemo(() => {
    const now = new Date();
    if (dateRangeType === 'day') return 1;
    if (dateRangeType === 'week') return 7;
    if (dateRangeType === 'month') return 30;
    if (dateRangeType === 'custom') {
      const start = startDate ? new Date(startDate) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();
      const diffTime = Math.abs(end.getTime() - start.getTime());
      return Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)), 1);
    }
    return 30;
  }, [dateRangeType, startDate, endDate]);

  const selectedWorkerInfo = useMemo(() => {
    if (!selectedWorkerName) return null;
    
    // Find worker role
    const worker = combinedStaff.find(s => s.name === selectedWorkerName);
    const role = worker?.role || 'Pracownik';
    
    // Gather all operations
    const packerCount = allEvents.filter(e => e.type === 'pack' && e.workerName === selectedWorkerName && isWithinDateRange(e.date)).length;
    const pickerCount = allEvents.filter(e => e.type === 'pick' && e.workerName === selectedWorkerName && isWithinDateRange(e.date)).length;
    const totalOps = packerCount + pickerCount;
    
    // Find rank in respective list
    let rankPos = 1;
    let listLength = 1;
    if (role === 'Packer') {
      rankPos = packersDataAll.findIndex(item => item.label === selectedWorkerName) + 1;
      listLength = packersDataAll.length;
    } else {
      rankPos = pickersDataAll.findIndex(item => item.label === selectedWorkerName) + 1;
      listLength = pickersDataAll.length;
    }
    if (rankPos === 0) rankPos = listLength + 1;

    // Timeline activity grouped by days/hours
    const trendData: { label: string; value: number }[] = [];
    const now = new Date();
    
    if (dateRangeType === 'day') {
      const hours = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
      const counts: Record<string, number> = {};
      hours.forEach(h => counts[h] = 0);
      
      allEvents.forEach(e => {
        if (e.workerName === selectedWorkerName && isWithinDateRange(e.date)) {
          const hour = e.date.getHours();
          let slot = '22:00';
          if (hour < 10) slot = '08:00';
          else if (hour < 12) slot = '10:00';
          else if (hour < 14) slot = '12:00';
          else if (hour < 16) slot = '14:00';
          else if (hour < 18) slot = '16:00';
          else if (hour < 20) slot = '18:00';
          else if (hour < 22) slot = '20:00';
          counts[slot]++;
        }
      });
      hours.forEach(h => trendData.push({ label: h, value: counts[h] }));
    } else {
      let startDateObj = new Date();
      let endDateObj = new Date();
      if (dateRangeType === 'week') startDateObj = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
      else if (dateRangeType === 'month') startDateObj = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
      else if (dateRangeType === 'custom') {
        startDateObj = startDate ? new Date(startDate) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        endDateObj = endDate ? new Date(endDate) : new Date();
      }
      startDateObj.setHours(0, 0, 0, 0);
      endDateObj.setHours(23, 59, 59, 999);
      
      const days = getDaysInRange(startDateObj, endDateObj);
      const counts: Record<string, number> = {};
      days.forEach(d => counts[formatDayMonth(d)] = 0);
      
      allEvents.forEach(e => {
        if (e.workerName === selectedWorkerName && isWithinDateRange(e.date)) {
          const label = formatDayMonth(e.date);
          if (counts[label] !== undefined) counts[label]++;
        }
      });
      days.forEach(d => {
        const label = formatDayMonth(d);
        trendData.push({ label, value: counts[label] });
      });
    }

    return {
      name: selectedWorkerName,
      role,
      packerCount,
      pickerCount,
      totalOps,
      dailyAverage: (totalOps / daysCount).toFixed(1),
      rankPos,
      listLength,
      trendData
    };
  }, [selectedWorkerName, combinedStaff, allEvents, isWithinDateRange, dateRangeType, startDate, endDate, daysCount, packersDataAll, pickersDataAll]);

  // Max value for horizontal chart sizing
  const horizontalMaxVal = useMemo(() => {
    const vals = activeData.map(d => d.value);
    return Math.max(...vals, 1);
  }, [activeData]);

  return (
    <div id="wms-analytics-panel" className="space-y-6 font-sans text-sm text-[#334155] animate-fadeIn pb-12 relative overflow-hidden">
      {/* 1. Header with Filters */}
      <div className="flex flex-col gap-5 bg-[#0f172a] p-6 rounded-xl border border-[#1e293b] text-white shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-blue-600 text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded tracking-wide animate-pulse flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> ANALITYKA WMS
            </span>
            <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-white font-sans">
              Statystyki i Wydajność Magazynu
            </h2>
          </div>
          <p className="text-zinc-400 text-xs mt-1 font-medium max-w-2xl leading-relaxed">
            Wydajność operacyjna ekipy kompletacyjnej (50-500 pracowników). Szybkie wyszukiwanie, multiselect, wykresy dynamiczne w pionie i poziomie oraz tabele rankingowe.
          </p>
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-[#1e293b] text-zinc-300">
          {/* Date range type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-blue-400" /> Zakres dat
            </label>
            <select
              value={dateRangeType}
              onChange={(e) => setDateRangeType(e.target.value as any)}
              className="bg-[#1e293b] border border-[#334155] text-white text-xs font-bold rounded-lg px-3 py-2 outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="day">Dzień (Dzisiaj)</option>
              <option value="week">Tydzień (Ostatnie 7 dni)</option>
              <option value="month">Miesiąc (Ostatnie 30 dni)</option>
              <option value="custom">Własny zakres...</option>
            </select>
          </div>

          {/* Warehouse */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-blue-400" /> Magazyn / Dział
            </label>
            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="bg-[#1e293b] border border-[#334155] text-white text-xs font-bold rounded-lg px-3 py-2 outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">Wszystkie magazyny</option>
              <option value="HUB-PL-01">HUB-PL-01 - Główny W-A1</option>
              <option value="HUB-PL-02">HUB-PL-02 - Pomocniczy W-B2</option>
            </select>
          </div>

          {/* General Text Worker Search */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
              <Search className="w-3.5 h-3.5 text-blue-400" /> Wyszukiwarka pracownika
            </label>
            <div className="relative">
              <input
                type="text"
                value={workerSearchText}
                onChange={(e) => setWorkerSearchText(e.target.value)}
                placeholder="Wpisz imię lub nazwisko..."
                className="w-full bg-[#1e293b] border border-[#334155] text-white text-xs font-bold rounded-lg pl-8 pr-3 py-2 outline-none focus:border-blue-500"
              />
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
              {workerSearchText && (
                <button 
                  onClick={() => setWorkerSearchText('')} 
                  className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Multiselect workers dropdown with chips */}
          <div className="relative flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-blue-400" /> Wielokrotny wybór (Chipy)
            </label>
            <div className="flex flex-wrap gap-1 p-1 bg-[#1e293b] border border-[#334155] rounded-lg min-h-[36px] items-center text-xs">
              {selectedWorkers.map(name => (
                <span key={name} className="bg-blue-600/90 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded flex items-center gap-1">
                  {name.split(' ')[0]}
                  <button 
                    onClick={() => setSelectedWorkers(prev => prev.filter(n => n !== name))}
                    className="hover:text-red-300 font-extrabold focus:outline-none"
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                placeholder={selectedWorkers.length === 0 ? "Wybierz pracowników..." : ""}
                value={workerSearchQuery}
                onChange={(e) => {
                  setWorkerSearchQuery(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                className="bg-transparent border-none text-white text-xs outline-none focus:ring-0 flex-grow min-w-[60px]"
              />
              {selectedWorkers.length > 0 && (
                <button 
                  onClick={() => setSelectedWorkers([])}
                  className="text-[9px] text-zinc-400 hover:text-white font-extrabold ml-auto mr-1"
                >
                  Usuń
                </button>
              )}
            </div>

            {/* Dropdown overlay */}
            {isDropdownOpen && dropdownMatches.length > 0 && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setIsDropdownOpen(false)} />
                <div className="absolute top-full left-0 right-0 z-40 bg-[#1e293b] border border-[#334155] rounded-lg mt-1 max-h-40 overflow-y-auto shadow-2xl">
                  {dropdownMatches.map(worker => (
                    <div
                      key={worker.id}
                      onClick={() => {
                        setSelectedWorkers(prev => [...prev, worker.name]);
                        setWorkerSearchQuery('');
                        setIsDropdownOpen(false);
                      }}
                      className="px-3 py-1.5 text-xs text-zinc-200 hover:bg-blue-600 hover:text-white cursor-pointer transition-all flex justify-between items-center border-b border-[#334155]/30"
                    >
                      <span>{worker.name}</span>
                      <span className="text-[8px] uppercase bg-slate-800 text-zinc-400 px-1.5 rounded">{worker.role}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Conditional Custom Date fields */}
          {dateRangeType === 'custom' && (
            <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Od</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-[#1e293b] border border-[#334155] text-white text-xs font-bold rounded-lg px-3 py-1.5 outline-none focus:border-blue-500 cursor-pointer"
                />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Do</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-[#1e293b] border border-[#334155] text-white text-xs font-bold rounded-lg px-3 py-1.5 outline-none focus:border-blue-500 cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-[#e2e8f0] shadow-sm hover:shadow-md transition-all flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Nowe zamówienia</span>
            <span className="text-3xl font-black text-slate-900 tracking-tight font-mono block mt-1">
              {kpiStats.newOrdersCount}
            </span>
            <span className="text-[11px] text-slate-500 block">Zlecone w wybranym okresie</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-[#e2e8f0] shadow-sm hover:shadow-md transition-all flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Zrealizowane zamówienia</span>
            <span className="text-3xl font-black text-emerald-600 tracking-tight font-mono block mt-1">
              {kpiStats.completedOrdersCount}
            </span>
            <span className="text-[11px] text-slate-500 block">Zamknięte i wysłane paczki</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-[#e2e8f0] shadow-sm hover:shadow-md transition-all flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Spakowane paczki</span>
            <span className="text-3xl font-black text-blue-600 tracking-tight font-mono block mt-1">
              {kpiStats.packedCount}
            </span>
            <span className="text-[11px] text-slate-500 block">Liczba spakowanych paczek</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <PackageCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-[#e2e8f0] shadow-sm hover:shadow-md transition-all flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Zebrane zamówienia</span>
            <span className="text-3xl font-black text-teal-600 tracking-tight font-mono block mt-1">
              {kpiStats.pickedCount}
            </span>
            <span className="text-[11px] text-slate-500 block">Kompletacje pickerów</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Main Switchable Full Width Graph Panel */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 shadow-sm flex flex-col space-y-6">
        
        {/* Tab switcher header & controllers */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          {/* Main tabs */}
          <div className="flex flex-wrap bg-slate-100 p-0.5 rounded-lg border border-slate-200 select-none gap-0.5 max-w-max">
            {[
              { id: 'packers', label: 'Pakowacze' },
              { id: 'pickers', label: 'Zbieracze (pickerzy)' },
              { id: 'new_orders', label: 'Nowe zamówienia' },
              { id: 'completed_orders', label: 'Zrealizowane zamówienia' },
              { id: 'sku_rotation', label: 'Rotacja SKU (ABC)' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setSortField('rank');
                  setSortDirection('asc');
                }}
                className={`px-4 py-1.5 rounded-md text-[11px] font-black uppercase tracking-wider cursor-pointer transition-all border-none ${
                  activeTab === tab.id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Conditional Controls for Worker statistics */}
          {(activeTab === 'packers' || activeTab === 'pickers') && (
            <div className="flex flex-wrap items-center gap-3 select-none">
              {/* TOP limit selector */}
              <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                <span className="px-2 text-slate-500 font-extrabold uppercase text-[9px] tracking-wide">Pokazuj:</span>
                {[10, 20, 50, 'all'].map(limit => (
                  <button
                    key={limit}
                    onClick={() => setTopLimit(limit as any)}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer border-none transition-all ${
                      topLimit === limit ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {limit === 'all' ? 'Wszyscy' : `TOP ${limit}`}
                  </button>
                ))}
              </div>

              {/* View layout selector */}
              <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                <button
                  onClick={() => setViewType('chart')}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer border-none transition-all ${
                    viewType === 'chart' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Wykres
                </button>
                <button
                  onClick={() => setViewType('table')}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer border-none transition-all ${
                    viewType === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Tabela
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Display area */}
        <div className="min-h-[300px]">
          {/* 3A: Alternative Layout for workers > 30 (scrollable horizontal bar chart or ranking table) */}
          {shouldSwitchToAltView ? (
            <div>
              {viewType === 'chart' ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                      Ranking pracowników (Wykres poziomy, przewijalny z {rawListLength} osób):
                    </p>
                    <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded font-black">
                      Wykres poziomy (Duży zbiór)
                    </span>
                  </div>

                  <div className="max-h-[500px] overflow-y-auto space-y-2.5 pr-2 border border-slate-100 rounded-xl p-3 bg-slate-50/30">
                    {activeData.map((item, idx) => {
                      const percent = horizontalMaxVal > 0 ? (item.value / horizontalMaxVal) * 100 : 0;
                      return (
                        <div 
                          key={idx}
                          onClick={() => setSelectedWorkerName(item.label)}
                          className="flex items-center gap-3 p-2 bg-white hover:bg-blue-50/40 rounded-xl border border-slate-200/80 cursor-pointer transition-all hover:border-blue-300 shadow-xs"
                        >
                          <span className="text-xs font-bold text-slate-400 w-8 text-right font-mono">#{idx + 1}</span>
                          <span className="text-xs font-extrabold text-slate-800 w-36 truncate">{item.label}</span>
                          <div className="flex-grow h-6 bg-slate-100/60 rounded-lg overflow-hidden relative border border-slate-200/50">
                            <div 
                              className={`h-full bg-gradient-to-r ${
                                activeTab === 'packers' ? 'from-blue-600 to-blue-400' : 'from-teal-600 to-teal-400'
                              } rounded-lg transition-all duration-500`}
                              style={{ width: `${Math.max(percent, 1.5)}%` }}
                            />
                            <span className="absolute inset-y-0 right-3 flex items-center text-[10px] font-bold text-slate-500">
                              {item.value} {activeTab === 'packers' ? 'paczek' : 'kompletacji'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* 3B: Sortable Ranking Table */
                <div className="space-y-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Ranking pracowników w formie tabelarycznej:
                  </p>
                  <div className="overflow-x-auto border border-[#e2e8f0] rounded-xl shadow-xs">
                    <table className="min-w-full bg-white text-xs select-none">
                      <thead className="bg-[#f8fafc] border-b border-[#e2e8f0] font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                        <tr>
                          <th onClick={() => handleSort('rank')} className="py-3 px-4 text-left cursor-pointer hover:bg-slate-100/80 transition-colors">
                            <div className="flex items-center gap-1.5">Pozycja <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                          </th>
                          <th onClick={() => handleSort('name')} className="py-3 px-4 text-left cursor-pointer hover:bg-slate-100/80 transition-colors">
                            <div className="flex items-center gap-1.5">Pracownik <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                          </th>
                          <th className="py-3 px-4 text-left">Dział / Rola</th>
                          <th onClick={() => handleSort('value')} className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100/80 transition-colors">
                            <div className="flex items-center gap-1.5 justify-end">Liczba operacji <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
                          </th>
                          <th className="py-3 px-4 text-right">Udział w całości</th>
                          <th className="py-3 px-4 text-right">Średnia dzienna</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e2e8f0]">
                        {sortedTableData.map((row) => {
                          const totalSum = activeData.reduce((s, i) => s + i.value, 0) || 1;
                          const share = ((row.value / totalSum) * 100).toFixed(1);
                          const dailyAvg = (row.value / daysCount).toFixed(1);
                          
                          return (
                            <tr
                              key={row.name}
                              onClick={() => setSelectedWorkerName(row.name)}
                              className="hover:bg-blue-50/30 cursor-pointer transition-colors border-b border-slate-100"
                            >
                              <td className="py-3 px-4 font-mono font-bold text-slate-500">#{row.rank}</td>
                              <td className="py-3 px-4 font-extrabold text-slate-900">{row.name}</td>
                              <td className="py-3 px-4 font-medium text-slate-500">
                                {activeTab === 'packers' ? 'Pakowacz WMS' : 'Kompletujący (Picker)'}
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-bold text-blue-600">{row.value}</td>
                              <td className="py-3 px-4 text-right font-mono font-semibold text-slate-500">{share}%</td>
                              <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">{dailyAvg} /d</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* 3C: Standard vertical charts (for workers <= 30 or date timelines) */
            <div className="space-y-4">
              {activeTab === 'packers' && (
                <BarChart
                  title="Wydajność Pakowaczy (Spakowane paczki)"
                  data={packerData}
                  colorFrom="from-blue-600"
                  colorTo="to-blue-400"
                  icon={<Package className="w-4.5 h-4.5" />}
                  yLabel="paczek"
                  onBarClick={setSelectedWorkerName}
                />
              )}
              {activeTab === 'pickers' && (
                <BarChart
                  title="Wydajność Zbieraczy (Zebrane zamówienia)"
                  data={pickerData}
                  colorFrom="from-teal-600"
                  colorTo="to-teal-400"
                  icon={<UserCheck className="w-4.5 h-4.5" />}
                  yLabel="zamówień"
                  onBarClick={setSelectedWorkerName}
                />
              )}
              {activeTab === 'new_orders' && (
                <BarChart
                  title="Wolumen Nowych Zamówień"
                  data={timeSeriesData.newOrders}
                  colorFrom="from-indigo-600"
                  colorTo="to-indigo-400"
                  icon={<PackageCheck className="w-4.5 h-4.5" />}
                  yLabel="zamówień"
                />
              )}
              {activeTab === 'completed_orders' && (
                <BarChart
                  title="Wolumen Zrealizowanych Zamówień"
                  data={timeSeriesData.completedOrders}
                  colorFrom="from-emerald-600"
                  colorTo="to-emerald-400"
                  icon={<CheckCircle2 className="w-4.5 h-4.5" />}
                  yLabel="zamówień"
                />
              )}
              {activeTab === 'sku_rotation' && (
                <SkuRotationSection
                  orders={orders}
                  products={products}
                  onRelocateProduct={onRelocateProduct}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* 4. Single Worker Detailed Analysis Side Drawer Panel */}
      {selectedWorkerName && selectedWorkerInfo && (
        <>
          {/* Dark Glass Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-[#0f172a]/55 backdrop-blur-xs z-40 transition-opacity duration-300 ease-in-out"
            onClick={() => setSelectedWorkerName(null)}
          />
          
          {/* Slide Over panel */}
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white border-l border-slate-200 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out animate-slideInRight h-full">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-[#0f172a] text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm tracking-wide shadow-md uppercase">
                  {selectedWorkerInfo.name.split(' ').map((n: string) => n[0]).join('')}
                </div>
                <div>
                  <h4 className="font-extrabold text-sm tracking-tight">{selectedWorkerInfo.name}</h4>
                  <p className="text-[10px] text-zinc-400 font-mono mt-0.5 uppercase tracking-wider">
                    {selectedWorkerInfo.role === 'Packer' ? 'Pakowacz WMS' : 'Picker / Kompletujący'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedWorkerName(null)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-grow overflow-y-auto p-6 space-y-6">
              
              {/* Detailed Metrics Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Spakowane paczki</span>
                  <span className="text-xl font-black text-slate-900 block font-mono">{selectedWorkerInfo.packerCount}</span>
                </div>
                <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Zebrane zamówienia</span>
                  <span className="text-xl font-black text-slate-900 block font-mono">{selectedWorkerInfo.pickerCount}</span>
                </div>
                <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Średnia dzienna</span>
                  <span className="text-xl font-black text-blue-600 block font-mono">{selectedWorkerInfo.dailyAverage} ops</span>
                </div>
                <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Pozycja w rankingu</span>
                  <span className="text-xl font-black text-emerald-600 block font-mono">
                    #{selectedWorkerInfo.rankPos} <span className="text-[10px] text-slate-400 font-sans font-bold">z {selectedWorkerInfo.listLength}</span>
                  </span>
                </div>
              </div>

              {/* Worker Trend activity chart */}
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  Wykres aktywności w czasie ({dateRangeType === 'day' ? 'Dzisiaj' : 'Historia'})
                </p>
                <div className="h-52">
                  <BarChart
                    title=""
                    data={selectedWorkerInfo.trendData}
                    colorFrom={selectedWorkerInfo.role === 'Packer' ? 'from-blue-600' : 'from-teal-600'}
                    colorTo={selectedWorkerInfo.role === 'Packer' ? 'to-blue-400' : 'to-teal-400'}
                    icon={<Activity className="w-4 h-4" />}
                    yLabel="akcji"
                  />
                </div>
              </div>

              {/* Activity recommendation */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
                <Target className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h5 className="font-bold text-xs text-blue-900 uppercase tracking-wide">Ocena telemetryczna</h5>
                  <p className="text-[11px] text-blue-700 leading-normal font-medium">
                    Pracownik {selectedWorkerInfo.name} wykazuje stabilne tempo pracy w wybranym okresie. Średnia dzienna wynosi {selectedWorkerInfo.dailyAverage} operacji, plasując go w grupie wydajnościowej klasy A. Brak wykrytych anomalii kompletacji.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </>
      )}

      {/* 5. Physical telemetry monitoring (premium footer layout) */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 shadow-sm">
        <div className="flex items-center gap-2.5 mb-5 border-b border-slate-100 pb-3">
          <Activity className="w-4.5 h-4.5 text-[#2170e4]" />
          <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider">Warunki fizyczne i sensoryka stref ryglowych</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
          {[
            { zone: 'Hala ambientowa A', temp: '18°C', humidity: '44%', ventilation: '98%', safety: 'OK', color: 'text-blue-600', badge: 'Ambient' },
            { zone: 'Hala chłodnicza B', temp: '4°C', humidity: '30%', ventilation: '100%', safety: 'OK', color: 'text-sky-600', badge: 'Cold Store' },
            { zone: 'Sektor Chemiczny C', temp: '16°C', humidity: '52%', ventilation: '95%', safety: 'ZABEZPIECZONO', color: 'text-purple-600', badge: 'Hazmat' },
            { zone: 'Strefa wysyłki D', temp: '19°C', humidity: '45%', ventilation: '90%', safety: 'OK', color: 'text-zinc-600', badge: 'Loading dock' },
          ].map((hala, i) => (
            <div key={i} className="bg-[#f8fafc] border border-slate-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
              <div className="flex justify-between items-center mb-2.5">
                <span className="font-extrabold text-xs text-slate-900 leading-none">{hala.zone}</span>
                <span className="bg-white px-2 py-0.5 rounded text-[9px] font-bold text-slate-500 uppercase border border-slate-200">{hala.badge}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-1.5 font-mono">
                <div className="bg-white p-2 border border-slate-200/60 rounded">
                  <span className="text-[9px] text-slate-400 uppercase font-sans block">Temperatura</span>
                  <span className={`font-black text-sm ${hala.color}`}>{hala.temp}</span>
                </div>
                <div className="bg-white p-2 border border-slate-200/60 rounded">
                  <span className="text-[9px] text-slate-400 uppercase font-sans block">Wilgotność</span>
                  <span className="font-bold text-slate-800 text-sm">{hala.humidity}</span>
                </div>
                <div className="bg-white p-2 border border-slate-200/60 rounded">
                  <span className="text-[9px] text-slate-400 uppercase font-sans block">Wentylacja</span>
                  <span className="font-bold text-emerald-600 text-xs">{hala.ventilation}</span>
                </div>
                <div className="bg-white p-2 border border-slate-200/60 rounded">
                  <span className="text-[9px] text-slate-400 uppercase font-sans block">Status BHP</span>
                  <span className="font-bold text-indigo-700 text-[10px]">{hala.safety}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// SKU Rotation ABC Analysis Sub-component
// ==========================================
interface SkuRotationSectionProps {
  orders: any[];
  products: Product[];
  onRelocateProduct?: (sku: string, newLocationCode: string, newZone: string) => void;
}

function SkuRotationSection({ orders, products, onRelocateProduct }: SkuRotationSectionProps) {
  const [classFilter, setClassFilter] = useState<'All' | 'A' | 'B' | 'C'>('All');
  const [onlyRecommendations, setOnlyRecommendations] = useState<boolean | 'danger'>(false);
  const [searchQuery, setSearchQuery] = useState('');

  const demandMap = useMemo(() => {
    const map: Record<string, { qty: number; orderCount: number }> = {};
    products.forEach(p => {
      map[p.sku] = { qty: 0, orderCount: 0 };
    });

    orders.forEach(o => {
      if (o.items && Array.isArray(o.items)) {
        o.items.forEach((item: any) => {
          const sku = item.sku || item.productCode;
          if (sku) {
            const qty = parseInt(item.quantity || item.qty || 0);
            if (map[sku]) {
              map[sku].qty += qty;
              map[sku].orderCount += 1;
            } else {
              map[sku] = { qty, orderCount: 1 };
            }
          }
        });
      }
    });
    return map;
  }, [orders, products]);

  const totalQtySold = useMemo(() => {
    return Object.values(demandMap).reduce((sum, d) => sum + d.qty, 0);
  }, [demandMap]);

  const classifiedProducts = useMemo(() => {
    const sorted = [...products].sort((a, b) => {
      const demA = demandMap[a.sku]?.qty || 0;
      const demB = demandMap[b.sku]?.qty || 0;
      if (demB !== demA) return demB - demA;
      const cntA = demandMap[a.sku]?.orderCount || 0;
      const cntB = demandMap[b.sku]?.orderCount || 0;
      return cntB - cntA;
    });

    let cumulativeQty = 0;
    return sorted.map((p, index) => {
      const qty = demandMap[p.sku]?.qty || 0;
      cumulativeQty += qty;

      let abcClass: 'A' | 'B' | 'C' = 'C';
      if (totalQtySold > 0) {
        const percentage = (cumulativeQty / totalQtySold) * 100;
        if (percentage <= 70) abcClass = 'A';
        else if (percentage <= 90) abcClass = 'B';
        else abcClass = 'C';
      } else {
        const rankPercent = (index / products.length) * 100;
        if (rankPercent <= 20) abcClass = 'A';
        else if (rankPercent <= 50) abcClass = 'B';
        else abcClass = 'C';
      }

      const rec = getZoneRecommendation(abcClass, p.category, p.zone, p.locationCode);

      return {
        product: p,
        qtySold: qty,
        orderCount: demandMap[p.sku]?.orderCount || 0,
        abcClass,
        recommendation: rec.recommendation,
        recType: rec.type,
        targetLocation: getTargetLocation(abcClass, p.category)
      };
    });
  }, [products, demandMap, totalQtySold]);

  function getTargetLocation(abcClass: 'A' | 'B' | 'C', category: string) {
    const normCat = (category || '').toLowerCase().trim();
    const isFood = normCat.includes('spożywcz') || normCat.includes('żywność') || normCat.includes('zywnosc') || normCat.includes('food');
    const isOffice = normCat.includes('elektronik') || normCat.includes('biur') || normCat.includes('office') || normCat.includes('audio') || normCat.includes('akcesor') || normCat.includes('dom');

    let targetZone = 'C1';
    let targetZoneGroup = 'C';
    if (isFood) {
      targetZone = 'A1';
      targetZoneGroup = 'A';
    } else if (isOffice) {
      targetZone = 'B1';
      targetZoneGroup = 'B';
    }

    if (abcClass === 'A') {
      return { code: `${targetZoneGroup}-01-01`, zone: targetZone };
    } else if (abcClass === 'C') {
      const slowZone = targetZoneGroup === 'A' ? 'A2' : targetZoneGroup === 'B' ? 'B2' : 'C2';
      return { code: `${targetZoneGroup}-02-04`, zone: slowZone };
    }
    return null;
  }

  function getZoneRecommendation(abcClass: 'A' | 'B' | 'C', category: string, zone: string, locationCode: string) {
    const normCat = (category || '').toLowerCase().trim();
    const zoneUpper = (zone || '').toUpperCase();
    const locUpper = (locationCode || '').toUpperCase();

    const isFood = normCat.includes('spożywcz') || normCat.includes('żywność') || normCat.includes('zywnosc') || normCat.includes('food');
    const isOffice = normCat.includes('elektronik') || normCat.includes('biur') || normCat.includes('office') || normCat.includes('audio') || normCat.includes('akcesor') || normCat.includes('dom');
    const isChemHazmat = normCat.includes('chem') || normCat.includes('częśc') || normCat.includes('czesc') || normCat.includes('motor') || normCat.includes('bhp') || normCat.includes('auto');

    const locParts = locUpper.split('-');
    const shelfLevel = locParts.length >= 3 ? parseInt(locParts[2]) : null;
    const isHighShelf = shelfLevel !== null && shelfLevel >= 3;
    const isLowShelf = shelfLevel !== null && shelfLevel <= 2;

    let expectedZoneLetter = '';
    let targetFastZone = '';
    let targetSlowZone = '';

    if (isFood) {
      expectedZoneLetter = 'A';
      targetFastZone = 'A1';
      targetSlowZone = 'A2';
    } else if (isOffice) {
      expectedZoneLetter = 'B';
      targetFastZone = 'B1';
      targetSlowZone = 'B2';
    } else if (isChemHazmat) {
      expectedZoneLetter = 'C';
      targetFastZone = 'C1';
      targetSlowZone = 'C2';
    }

    if (!expectedZoneLetter) {
      return { recommendation: 'Prawidłowa lokalizacja', type: 'ok' as const };
    }

    const currentZoneLetter = zoneUpper.charAt(0);

    if (currentZoneLetter !== expectedZoneLetter) {
      return {
        recommendation: `⚠️ Niezgodność strefy BHP! Kategoria „${category}” leży w strefie ${zoneUpper}. Wymagana strefa ${expectedZoneLetter}.`,
        type: 'danger' as const
      };
    }

    if (abcClass === 'A') {
      const isFastZone = zoneUpper === targetFastZone;
      if (!isFastZone && isHighShelf) {
        return {
          recommendation: `Zalecana relokacja do strefy szybkiej ${targetFastZone} na dolną półkę (poziom 1/2) najbliżej stołów pakowych.`,
          type: 'warning' as const
        };
      }
      if (!isFastZone) {
        return {
          recommendation: `Zalecana relokacja do strefy szybkiej ${targetFastZone} bliżej stołów pakowych.`,
          type: 'warning' as const
        };
      }
      if (isHighShelf) {
        return {
          recommendation: `Przenieś na dolną półkę (poziom 1/2) w strefie ${zoneUpper} dla szybszej kompletacji.`,
          type: 'warning' as const
        };
      }
      return { recommendation: 'Optymalna lokalizacja (Strefa szybka, dolny poziom)', type: 'ok' as const };
    }

    if (abcClass === 'C') {
      const isFastZone = zoneUpper === targetFastZone;
      if (isFastZone) {
        return {
          recommendation: `Zwolnij miejsce w strefie szybkiej: przenieś do strefy ${targetSlowZone} lub na wyższe półki.`,
          type: 'warning' as const
        };
      }
      if (isLowShelf) {
        return {
          recommendation: `Przenieś na wyższe półki (poziom 3/4) w celu zwolnienia dolnego poziomu dla towarów klasy A.`,
          type: 'warning' as const
        };
      }
      return { recommendation: 'Optymalna lokalizacja (Strefa głęboka, górny poziom)', type: 'ok' as const };
    }

    return { recommendation: 'Optymalna lokalizacja', type: 'ok' as const };
  }

  const filteredProducts = useMemo(() => {
    return classifiedProducts.filter(item => {
      if (classFilter !== 'All' && item.abcClass !== classFilter) return false;
      if (onlyRecommendations === true && item.recType === 'ok') return false;
      if (onlyRecommendations === 'danger' && item.recType !== 'danger') return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return item.product.sku.toLowerCase().includes(query) || item.product.name.toLowerCase().includes(query);
      }
      return true;
    });
  }, [classifiedProducts, classFilter, onlyRecommendations, searchQuery]);

  const telemetry = useMemo(() => {
    const classACount = classifiedProducts.filter(p => p.abcClass === 'A').length;
    const classBCount = classifiedProducts.filter(p => p.abcClass === 'B').length;
    const classCCount = classifiedProducts.filter(p => p.abcClass === 'C').length;
    const recsCount = classifiedProducts.filter(p => p.recType !== 'ok').length;
    const safetyViolations = classifiedProducts.filter(p => p.recType === 'danger').length;

    return { classACount, classBCount, classCCount, recsCount, safetyViolations };
  }, [classifiedProducts]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 select-none">
        <div className="bg-[#0f172a] text-white p-4 rounded-xl border border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">Suma SKU</span>
          <div className="text-xl font-black mt-1.5 font-sans">{products.length}</div>
          <div className="text-[9px] text-zinc-500 mt-1 font-mono">Baza produktów WMS</div>
        </div>
        <div className="bg-red-50/50 p-4 rounded-xl border border-red-150 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] text-red-600 font-extrabold uppercase tracking-wider">Klasa A (Szybkie)</span>
          <div className="text-xl font-black mt-1.5 text-red-950 font-sans">{telemetry.classACount} SKU</div>
          <div className="text-[9px] text-red-500 mt-1">Generują ok. 70% operacji</div>
        </div>
        <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-150 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] text-indigo-600 font-extrabold uppercase tracking-wider">Klasa B (Średnie)</span>
          <div className="text-xl font-black mt-1.5 text-indigo-950 font-sans">{telemetry.classBCount} SKU</div>
          <div className="text-[9px] text-indigo-500 mt-1">Generują ok. 20% operacji</div>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] text-slate-600 font-extrabold uppercase tracking-wider">Klasa C (Wolne)</span>
          <div className="text-xl font-black mt-1.5 text-slate-950 font-sans">{telemetry.classCCount} SKU</div>
          <div className="text-[9px] text-slate-500 mt-1">Generują ok. 10% operacji</div>
        </div>
        <div className={`p-4 rounded-xl border shadow-sm flex flex-col justify-between ${telemetry.safetyViolations > 0 ? 'bg-rose-50 border-rose-200 animate-pulse' : telemetry.recsCount > 0 ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
          <span className={`text-[10px] font-extrabold uppercase tracking-wider ${telemetry.safetyViolations > 0 ? 'text-rose-600' : telemetry.recsCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {telemetry.safetyViolations > 0 ? 'Krytyczne BHP' : 'Rekomendacje'}
          </span>
          <div className={`text-xl font-black mt-1.5 font-sans ${telemetry.safetyViolations > 0 ? 'text-rose-950' : telemetry.recsCount > 0 ? 'text-amber-950' : 'text-emerald-950'}`}>
            {telemetry.safetyViolations > 0 ? `${telemetry.safetyViolations} pozycji` : `${telemetry.recsCount} pozycji`}
          </div>
          <div className={`text-[9px] mt-1 ${telemetry.safetyViolations > 0 ? 'text-rose-600 font-bold' : telemetry.recsCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {telemetry.safetyViolations > 0 ? 'Niezgodność stref BHP!' : 'Wymaga optymalizacji'}
          </div>
        </div>
      </div>

      {telemetry.safetyViolations > 0 && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-start gap-3.5 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-rose-900 text-xs font-sans uppercase">Krytyczny Alert Zgodności Magazynowej (BHP / HACCP)</h4>
            <p className="text-rose-700 text-xs mt-1.5 leading-relaxed">
              Niektóre z towarów leżą w strefach zagrażających bezpieczeństwu sanitarnemu bądź pożarowemu (np. chemia obok artykułów spożywczych). Przeprowadź natychmiastową relokację za pomocą akcji <strong>Relokuj</strong>.
            </p>
          </div>
        </div>
      )}

      <div className="bg-[#f8fafc] border border-slate-200 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 font-sans">
        <div className="relative flex-grow max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-9 py-2 border border-slate-200 rounded-lg bg-white text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            placeholder="Szukaj SKU, nazwy produktu..."
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer border-none bg-transparent">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <span className="px-2 text-slate-400 font-extrabold uppercase text-[9px] select-none">Klasa ABC:</span>
            {(['All', 'A', 'B', 'C'] as const).map(cls => (
              <button
                key={cls}
                onClick={() => setClassFilter(cls)}
                className={`px-3 py-1 rounded-md text-[10px] font-bold cursor-pointer border-none transition-all ${
                  classFilter === cls ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {cls === 'All' ? 'Wszystkie' : `Klasa ${cls}`}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs px-2.5 h-7">
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyRecommendations === true}
                onChange={e => setOnlyRecommendations(e.target.checked ? true : false)}
                className="rounded text-blue-600 focus:ring-blue-500 border-slate-300 w-3.5 h-3.5 cursor-pointer"
              />
              <span className="text-[10px] font-bold text-slate-600">Optymalizuj</span>
            </label>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs px-2.5 h-7">
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyRecommendations === 'danger'}
                onChange={e => setOnlyRecommendations(e.target.checked ? 'danger' : false)}
                className="rounded text-rose-600 focus:ring-rose-500 border-rose-300 w-3.5 h-3.5 cursor-pointer"
              />
              <span className="text-[10px] font-bold text-rose-600">Tylko błędy BHP</span>
            </label>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[9px] tracking-wider select-none">
                <th className="py-3 px-4 w-12 text-center">Rank</th>
                <th className="py-3 px-4">Kod SKU</th>
                <th className="py-3 px-4">Nazwa artykułu</th>
                <th className="py-3 px-4">Kategoria</th>
                <th className="py-3 px-4 text-center">Klasa ABC</th>
                <th className="py-3 px-4 text-right">Zapotrzebowanie</th>
                <th className="py-3 px-4">Bieżąca lokalizacja</th>
                <th className="py-3 px-5">Rekomendacja operacyjna</th>
                <th className="py-3 px-4 text-center">Akcja</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 font-medium font-sans">
                    Brak produktów spełniających wybrane kryteria.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((item, idx) => {
                  let badgeBg = 'bg-slate-100 text-slate-600 border-slate-200';
                  if (item.abcClass === 'A') badgeBg = 'bg-red-50 text-red-700 border-red-200 font-black';
                  else if (item.abcClass === 'B') badgeBg = 'bg-indigo-50 text-indigo-700 border-indigo-200 font-bold';

                  let recBadge = 'bg-emerald-50 text-emerald-700 border-emerald-100';
                  if (item.recType === 'danger') {
                    recBadge = 'bg-rose-50 text-rose-700 border-rose-250 font-semibold animate-pulse';
                  } else if (item.recType === 'warning') {
                    recBadge = 'bg-amber-50 text-amber-700 border-amber-250';
                  }

                  return (
                    <tr key={item.product.sku} className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-400 font-sans">#{idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-black text-slate-800">{item.product.sku}</td>
                      <td className="py-3 px-4 font-bold text-slate-700 max-w-[180px] truncate font-sans" title={item.product.name}>
                        {item.product.name}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-medium font-sans">{item.product.category}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${badgeBg}`}>
                          Klasa {item.abcClass}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-slate-600">
                        {item.qtySold} szt. <span className="text-[9px] text-slate-400 font-normal">({item.orderCount} ord.)</span>
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 text-[9px] font-black text-slate-600">
                            {item.product.zone}
                          </span>
                          <span className="text-slate-500">{item.product.locationCode || 'Brak'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-5 font-sans">
                        <div className={`p-1.5 rounded-lg border text-[10px] leading-relaxed flex items-start gap-1.5 ${recBadge}`}>
                          {item.recType === 'danger' && <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-rose-600" />}
                          {item.recType === 'ok' && <CheckCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-500" />}
                          {item.recType === 'warning' && <Move className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-500" />}
                          <span>{item.recommendation}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-sans">
                        {item.recType !== 'ok' && item.targetLocation && onRelocateProduct ? (
                          <button
                            onClick={() => {
                              if (confirm(`Czy na pewno zlecić fizyczną relokację wewnętrzną dla towaru ${item.product.name} (${item.product.sku}) z lokalizacji ${item.product.locationCode} do strefy ${item.targetLocation!.zone} (Lokalizacja: ${item.targetLocation!.code})?`)) {
                                onRelocateProduct(item.product.sku, item.targetLocation!.code, item.targetLocation!.zone);
                                alert(`Zlecenie relokacji zostało zarejestrowane i wykonane w systemie!`);
                              }
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-2 py-1 rounded text-[10px] cursor-pointer flex items-center gap-1 mx-auto transition-all active:scale-[0.93] border-none shadow active:shadow-inner"
                            title={`Przenieś do ${item.targetLocation.code}`}
                          >
                            <Move className="w-3 h-3" /> Relokuj
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[10px] font-medium">-</span>
                        )}
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
