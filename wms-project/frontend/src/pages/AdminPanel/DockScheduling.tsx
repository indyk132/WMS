import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calendar, Clock, Plus, X, Check, Truck, 
  Trash2, Play, Users, BarChart3, ShieldCheck, MapPin,
  ChevronLeft, ChevronRight, AlertTriangle, Printer,
  RefreshCw, FileText, ToggleLeft, ToggleRight, Sparkles
} from 'lucide-react';
import { sounds } from '../../components/SoundEffects';

// Type definitions
interface PurchaseOrderItem {
  sku: string;
  name: string;
  qtyOrdered: number;
  isAdr?: boolean;
  isColdChain?: boolean;
}

interface PurchaseOrder {
  id: string;
  createdDate: string;
  status: 'Pending' | 'Completed' | 'Cancelled' | 'Merged' | 'ReturnPending' | 'ReturnReceived';
  vendorName: string;
  expectedDeliveryDate: string;
  items: PurchaseOrderItem[];
  internalNotes?: string;
}

interface Dock {
  id: string;
  name: string;
  status: 'Free' | 'Reserved' | 'Unloading';
  assignedPoId?: string;
  carrierName?: string;
  truckPlate?: string;
  eta?: string;
  type?: 'ADR' | 'Cold' | 'Standard';
}

interface YardTruck {
  id: string;
  carrierName: string;
  truckPlate: string;
  status: 'Queue' | 'Parked' | 'Docked';
  parkingSlot?: string;
  assignedPoId?: string;
}

interface Appointment {
  id: string;
  date: string; // ISO format (YYYY-MM-DD)
  hour: string;
  dockId: string;
  poId: string;
  vendorName: string;
  carrierName: string;
  truckPlate: string;
  status: 'Scheduled' | 'CheckedIn' | 'Completed';
}

interface DockSchedulingProps {
  purchaseOrders: PurchaseOrder[];
  yardTrucks: YardTruck[];
  setYardTrucks: React.Dispatch<React.SetStateAction<YardTruck[]>>;
  docks: Dock[];
  setDocks: React.Dispatch<React.SetStateAction<Dock[]>>;
  logActivity: (msg: string, type: string, details?: string) => void;
  addToast: (title: string, text: string, type: 'error' | 'warning' | 'info' | 'success') => void;
}

const HOURS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
const DAY_NAMES = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek'];

// Date Helpers
const getMonday = (d: Date) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  return new Date(date.setDate(diff));
};

export default function DockScheduling({
  purchaseOrders = [],
  yardTrucks = [],
  setYardTrucks,
  docks = [],
  setDocks,
  logActivity,
  addToast
}: DockSchedulingProps) {
  // Navigation & View States
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [selectedDockId, setSelectedDockId] = useState('D1');
  const [viewMode, setViewMode] = useState<'weekly' | 'daily'>('weekly');
  const [selectedDayIndex, setSelectedDayIndex] = useState(0); // 0 = Poniedziałek, etc. (used in daily comparative view)

  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // Modals state
  const [bookingSlot, setBookingSlot] = useState<{ date: string; hour: string } | null>(null);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [showDriverPass, setShowDriverPass] = useState<Appointment | null>(null);
  const [isRescheduling, setIsRescheduling] = useState(false);

  // Booking / Rescheduling Form State
  const [formPoId, setFormPoId] = useState('');
  const [formCarrier, setFormCarrier] = useState('');
  const [formPlate, setFormPlate] = useState('');
  const [rescheduleDock, setRescheduleDock] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleHour, setRescheduleHour] = useState('');

  // Calculate current week dates (Monday to Friday)
  const activeMonday = useMemo(() => getMonday(currentDate), [currentDate]);
  
  const weekDates = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => {
      const d = new Date(activeMonday);
      d.setDate(activeMonday.getDate() + i);
      return d.toISOString().split('T')[0];
    });
  }, [activeMonday]);

  // Load and initialize appointments from localStorage
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('wms-dock-appointments-v2');
      if (saved) {
        setAppointments(JSON.parse(saved));
      } else {
        // Pre-populate with mock appointments in the current active week
        const mondayDate = weekDates[0];
        const wednesdayDate = weekDates[2];
        const initialMock: Appointment[] = [
          {
            id: 'APT-10029',
            date: mondayDate,
            hour: '09:00',
            dockId: 'D1',
            poId: 'PO-00812',
            vendorName: 'AutoParts Distrib Polska',
            carrierName: 'Raben Logistics',
            truckPlate: 'WI 82910',
            status: 'Scheduled'
          },
          {
            id: 'APT-10034',
            date: wednesdayDate,
            hour: '14:00',
            dockId: 'D2',
            poId: 'PO-00813',
            vendorName: 'Hurtownia Spożywcza EuroFoods Sp. z o.o.',
            carrierName: 'DHL Freight',
            truckPlate: 'WA 99128',
            status: 'Scheduled'
          }
        ];
        setAppointments(initialMock);
        window.localStorage.setItem('wms-dock-appointments-v2', JSON.stringify(initialMock));
      }
    } catch (e) {
      console.error("Failed to load appointments:", e);
    }
  }, [weekDates]);

  // Save appointments to localStorage whenever they change
  const saveAppointments = (list: Appointment[]) => {
    setAppointments(list);
    window.localStorage.setItem('wms-dock-appointments-v2', JSON.stringify(list));
  };

  // Synchronize appointment status when a PO is Completed in WMS
  const syncedAppointments = useMemo(() => {
    return appointments.map(appt => {
      const relatedPo = purchaseOrders.find(po => po.id === appt.poId);
      if (relatedPo && relatedPo.status === 'Completed' && appt.status !== 'Completed') {
        return { ...appt, status: 'Completed' as const };
      }
      return appt;
    });
  }, [appointments, purchaseOrders]);

  // KPI metrics calculations
  const kpis = useMemo(() => {
    const totalBooked = syncedAppointments.length;
    const currentWeekBookings = syncedAppointments.filter(a => weekDates.includes(a.date));
    
    // Utilization rate of selected dock in current week
    const totalPossibleSlots = 50; // 10 hours * 5 days
    const currentDockBookings = currentWeekBookings.filter(a => a.dockId === selectedDockId).length;
    const utilizationRate = Math.round((currentDockBookings / totalPossibleSlots) * 100);

    const pendingPos = purchaseOrders.filter(po => po.status === 'Pending').map(po => po.id);
    const assignedPoIds = syncedAppointments.map(a => a.poId);
    const unassignedCount = pendingPos.filter(poId => !assignedPoIds.includes(poId)).length;

    return {
      totalBooked,
      utilizationRate,
      unassignedCount
    };
  }, [syncedAppointments, selectedDockId, purchaseOrders, weekDates]);

  // Navigation handlers
  const handlePrevWeek = () => {
    sounds.playBeep();
    setCurrentDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  };

  const handleNextWeek = () => {
    sounds.playBeep();
    setCurrentDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  };

  const handleToday = () => {
    sounds.playBeep();
    setCurrentDate(new Date());
  };

  // Compatibility validation for ADR and Cold-chain
  const activeSelectedPo = useMemo(() => {
    return purchaseOrders.find(po => po.id === formPoId);
  }, [formPoId, purchaseOrders]);

  const poSecurityInfo = useMemo(() => {
    if (!activeSelectedPo) return null;
    const hasAdr = activeSelectedPo.items.some(item => item.isAdr);
    const hasCold = activeSelectedPo.items.some(item => item.isColdChain);
    return { hasAdr, hasCold };
  }, [activeSelectedPo]);

  const checkDockCompatibility = (poId: string, dockId: string) => {
    const po = purchaseOrders.find(o => o.id === poId);
    if (!po) return { compatible: true };

    const hasAdr = po.items.some(item => item.isAdr);
    const hasCold = po.items.some(item => item.isColdChain);

    if (hasAdr && dockId !== 'D1') {
      return {
        compatible: false,
        reason: 'Dokument PO zawiera chemikalia ADR. Towary niebezpieczne muszą być rozładowywane wyłącznie na dedykowanym Doku 1 (Strefa ADR).'
      };
    }

    if (hasCold && dockId !== 'D2') {
      return {
        compatible: false,
        reason: 'Dokument PO zawiera towary mrożone/chłodnicze. Rozładunek temperaturowy wymaga przyłącza chłodniczego w Doku 2.'
      };
    }

    return { compatible: true };
  };

  const compatibilityStatus = useMemo(() => {
    if (!formPoId) return { compatible: true };
    return checkDockCompatibility(formPoId, selectedDockId);
  }, [formPoId, selectedDockId, purchaseOrders]);

  // Open booking dialog
  const handleOpenBooking = (date: string, hour: string) => {
    sounds.playBeep();
    setBookingSlot({ date, hour });
    
    // Reset form states and pre-select first pending PO if available
    const pendingPos = purchaseOrders.filter(po => 
      po.status === 'Pending' && !syncedAppointments.some(a => a.poId === po.id)
    );
    if (pendingPos.length > 0) {
      setFormPoId(pendingPos[0].id);
    } else {
      setFormPoId('');
    }
    setFormCarrier('');
    setFormPlate('');
  };

  // Submit new appointment booking
  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingSlot) return;

    if (!formPoId) {
      addToast('Brak zamówienia PO', 'Wybierz zamówienie PO do awizacji.', 'warning');
      return;
    }

    const comp = checkDockCompatibility(formPoId, selectedDockId);
    if (!comp.compatible) {
      sounds.playError();
      addToast('Brak zgodności doku', comp.reason || '', 'error');
      return;
    }

    const po = purchaseOrders.find(o => o.id === formPoId);
    if (!po) return;

    // Check collision
    const isConflict = syncedAppointments.some(a => 
      a.date === bookingSlot.date && 
      a.hour === bookingSlot.hour && 
      a.dockId === selectedDockId
    );

    if (isConflict) {
      sounds.playError();
      addToast('Brak wolnego okna', 'Ten przedział godzinowy w wybranym doku jest już zarezerwowany.', 'error');
      return;
    }

    const newAppointment: Appointment = {
      id: `APT-${Math.floor(10000 + Math.random() * 90000)}`,
      date: bookingSlot.date,
      hour: bookingSlot.hour,
      dockId: selectedDockId,
      poId: formPoId,
      vendorName: po.vendorName,
      carrierName: formCarrier.trim() || 'Logistyka Własna',
      truckPlate: formPlate.trim().toUpperCase() || 'BRAK TABLIC',
      status: 'Scheduled'
    };

    const updated = [...appointments, newAppointment];
    saveAppointments(updated);
    
    logActivity(
      `Utworzono awizację dostawy ${formPoId} na dzień ${bookingSlot.date} o godzinie ${bookingSlot.hour}`,
      'yms',
      `Przypisano Dok: ${selectedDockId}, Przewoźnik: ${newAppointment.carrierName}, Pojazd: ${newAppointment.truckPlate}`
    );

    sounds.playSuccess();
    addToast('Awizacja utworzona', `Zarezerwowano termin ${bookingSlot.date} o godz. ${bookingSlot.hour} w Doku ${selectedDockId.replace('D', '')}.`, 'success');
    setBookingSlot(null);
  };

  // Rescheduling handler
  const handleStartReschedule = () => {
    sounds.playBeep();
    if (!selectedAppt) return;
    setRescheduleDock(selectedAppt.dockId);
    setRescheduleDate(selectedAppt.date);
    setRescheduleHour(selectedAppt.hour);
    setIsRescheduling(true);
  };

  const handleConfirmReschedule = () => {
    if (!selectedAppt) return;

    // Compatibility check
    const comp = checkDockCompatibility(selectedAppt.poId, rescheduleDock);
    if (!comp.compatible) {
      sounds.playError();
      addToast('Brak zgodności doku', comp.reason || '', 'error');
      return;
    }

    // Check collision (excluding the current appointment itself)
    const isConflict = syncedAppointments.some(a => 
      a.id !== selectedAppt.id &&
      a.date === rescheduleDate && 
      a.hour === rescheduleHour && 
      a.dockId === rescheduleDock
    );

    if (isConflict) {
      sounds.playError();
      addToast('Brak wolnego okna', 'Wybrany przedział godzinowy w doku jest już zajęty.', 'error');
      return;
    }

    const updated = appointments.map(a => a.id === selectedAppt.id ? {
      ...a,
      date: rescheduleDate,
      hour: rescheduleHour,
      dockId: rescheduleDock
    } : a);

    saveAppointments(updated);
    setSelectedAppt(null);
    setIsRescheduling(false);

    logActivity(
      `Przeplanowano awizację dla PO ${selectedAppt.poId}`,
      'yms',
      `Nowy termin: ${rescheduleDate} o ${rescheduleHour} w Doku ${rescheduleDock}`
    );

    sounds.playSuccess();
    addToast('Termin zaktualizowany', 'Pomyślnie zmieniono czas i bramę rozładunkową.', 'success');
  };

  // Delete / Cancel Appointment
  const handleDeleteAppointment = (apptId: string) => {
    sounds.playBeep();
    const appt = syncedAppointments.find(a => a.id === apptId);
    if (!appt) return;

    const filtered = appointments.filter(a => a.id !== apptId);
    saveAppointments(filtered);
    
    logActivity(
      `Anulowano awizację dostawy dla zamówienia PO ${appt.poId}`,
      'yms',
      `Usunięto rezerwację slotu ${appt.date} ${appt.hour} w bramie ${appt.dockId}`
    );

    addToast('Awizacja anulowana', `Usunięto rezerwację dla dostawy ${appt.poId}.`, 'info');
    setSelectedAppt(null);
  };

  // Gate Check-In YMS registration
  const handleCheckInToYard = (appt: Appointment) => {
    sounds.playSuccess();

    const poAlreadyActive = yardTrucks.some(t => t.assignedPoId === appt.poId) || docks.some(d => d.assignedPoId === appt.poId);
    if (poAlreadyActive) {
      addToast('Pojazd już na placu', 'Dostawa dla tego zamówienia PO jest już zarejestrowana na placu YMS.', 'warning');
      setSelectedAppt(null);
      return;
    }

    // Add truck to yardTrucks queue
    const newTruck: YardTruck = {
      id: `TRK-${Math.floor(1000 + Math.random() * 9000)}`,
      carrierName: appt.carrierName,
      truckPlate: appt.truckPlate,
      status: 'Queue',
      assignedPoId: appt.poId
    };
    setYardTrucks(prev => [...prev, newTruck]);

    // Update dock status to Reserved
    setDocks(prev => prev.map(d => d.id === appt.dockId ? {
      ...d,
      status: 'Reserved',
      assignedPoId: appt.poId,
      carrierName: appt.carrierName,
      truckPlate: appt.truckPlate
    } : d));

    // Update appointment status to CheckedIn
    const updated = appointments.map(a => a.id === appt.id ? { ...a, status: 'CheckedIn' as const } : a);
    saveAppointments(updated);

    logActivity(
      `Pojazd ${appt.truckPlate} (${appt.carrierName}) zameldowany na bramie wjazdowej`,
      'yms',
      `Powiązana awizacja dostawy: ${appt.poId} skierowana do Dok: ${appt.dockId}`
    );

    addToast('Pojazd zameldowany', `Ciężarówka ${appt.truckPlate} została dodana do kolejki YMS.`, 'success');
    setSelectedAppt(null);
  };

  const handlePrintPass = () => {
    sounds.playSuccess();
    addToast('Drukarka YMS', 'Trwa wysyłanie dokumentu przepustki wjazdowej do drukarki bramy głównej...', 'success');
    setShowDriverPass(null);
  };

  return (
    <div id="wms-dock-scheduling" className="space-y-6 font-sans text-sm text-zinc-300 animate-fadeIn pb-12">
      
      {/* Header with Title and Week Navigation */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-zinc-950 p-6 border border-zinc-900 shadow-xl text-left">
        <div>
          <div className="flex items-center gap-2 text-zinc-400 text-xs uppercase tracking-widest font-mono mb-1">
            <Calendar className="text-emerald-500" size={12} />
            <span>Yard Management System (YMS)</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white font-display">
            Terminarz Awizacji i Rezerwacji Bram Rozładunkowych
          </h1>
          <p className="text-[11px] text-zinc-500 mt-1 max-w-xl">
            Rezerwuj sloty czasowe (08:00 - 17:00) dla dostaw Purchase Orders w bramach D1-D3. Kontroluj restrykcje ADR oraz temperatur i melduj transport na placu.
          </p>
        </div>

        {/* Date / Navigation toolbar */}
        <div className="flex flex-wrap items-center gap-2.5 font-mono text-xs">
          <div className="flex items-center bg-black border border-zinc-850 p-1">
            <button
              onClick={handlePrevWeek}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 border-none bg-transparent cursor-pointer"
              title="Poprzedni tydzień"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-4 text-xs font-bold text-zinc-200">
              {weekDates[0].split('-').reverse().slice(0, 2).join('.')} - {weekDates[4].split('-').reverse().slice(0, 2).join('.')} {weekDates[4].split('-')[0]}
            </span>
            <button
              onClick={handleNextWeek}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 border-none bg-transparent cursor-pointer"
              title="Następny tydzień"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <button
            onClick={handleToday}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-350 hover:text-white font-bold cursor-pointer transition-colors"
          >
            Bieżący tydzień
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-zinc-950 border border-zinc-900 p-5 flex items-center justify-between shadow-xl text-left font-mono">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Łączne rezerwacje</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">{kpis.totalBooked}</span>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/20 px-2 py-0.5 border border-emerald-900/40">ZAKONTRAKTOWANE</span>
            </div>
            <span className="text-[9px] text-zinc-500 block">Zapisane sloty w bazie systemowej.</span>
          </div>
          <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-emerald-400">
            <Clock size={22} className="animate-pulse" />
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-900 p-5 flex items-center justify-between shadow-xl text-left font-mono">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Utylizacja Dok {selectedDockId}</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">{kpis.utilizationRate}%</span>
              <span className="text-[10px] text-blue-400 font-bold bg-blue-950/20 px-2 py-0.5 border border-blue-900/40">ZAPEŁNIENIE</span>
            </div>
            <span className="text-[9px] text-zinc-500 block">Procent zajętych godzin w tym tygodniu.</span>
          </div>
          <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-blue-400">
            <BarChart3 size={22} />
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-900 p-5 flex items-center justify-between shadow-xl text-left font-mono">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Oczekujące PO bez slotu</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-rose-500">{kpis.unassignedCount}</span>
              <span className="text-[10px] text-rose-400 font-bold bg-rose-950/20 px-2 py-0.5 border border-rose-900/40">DO REZERWACJI</span>
            </div>
            <span className="text-[9px] text-zinc-500 block">Zlecenia PO oczekujące na przydział bramy.</span>
          </div>
          <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-rose-500">
            <Truck size={22} />
          </div>
        </div>

      </div>

      {/* View Switcher and Ramps Grid Card */}
      <div className="bg-zinc-950 border border-zinc-900 p-6 shadow-xl space-y-6">
        
        {/* Dock selection and View toggler bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-900 pb-4">
          <div className="text-left font-mono">
            <h3 className="font-bold text-white text-xs uppercase tracking-wider">
              {viewMode === 'weekly' ? `HARMONOGRAM TYGODNIOWY - BRAMA ${selectedDockId}` : `WIDOK PORÓWNAWCZY BRAM - ${DAY_NAMES[selectedDayIndex]}`}
            </h3>
            <p className="text-[10px] text-zinc-500 mt-0.5">
              {viewMode === 'weekly' 
                ? 'Analiza obłożenia jednej wybranej bramy w ujęciu tygodniowym.' 
                : 'Zestawienie wszystkich ramp wyładowczych side-by-side na wybrany dzień.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode Switcher */}
            <div className="flex bg-black border border-zinc-850 p-1 font-mono text-[10px]">
              <button
                type="button"
                onClick={() => {
                  sounds.playBeep();
                  setViewMode('weekly');
                }}
                className={`px-3 py-1.5 font-bold cursor-pointer transition-all border-none ${
                  viewMode === 'weekly' ? 'bg-zinc-900 text-white' : 'text-zinc-550 hover:text-zinc-300 bg-transparent'
                }`}
              >
                Widok Tygodniowy
              </button>
              <button
                type="button"
                onClick={() => {
                  sounds.playBeep();
                  setViewMode('daily');
                }}
                className={`px-3 py-1.5 font-bold cursor-pointer transition-all border-none ${
                  viewMode === 'daily' ? 'bg-zinc-900 text-white' : 'text-zinc-550 hover:text-zinc-300 bg-transparent'
                }`}
              >
                Widok Bram (All Docks)
              </button>
            </div>

            {/* Sub-selector bar depending on ViewMode */}
            {viewMode === 'weekly' ? (
              <div className="flex bg-black border border-zinc-850 p-1 select-none font-mono text-[10px]">
                {['D1', 'D2', 'D3'].map(id => {
                  const dock = docks.find(d => d.id === id);
                  let label = `Dok ${id.replace('D', '')}`;
                  if (id === 'D1') label = 'Dok 1 (ADR)';
                  if (id === 'D2') label = 'Dok 2 (Cold)';

                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        sounds.playBeep();
                        setSelectedDockId(id);
                      }}
                      className={`px-3 py-1.5 font-bold cursor-pointer transition-all border-none ${
                        selectedDockId === id ? 'bg-zinc-900 text-white' : 'text-zinc-550 hover:text-zinc-300 bg-transparent'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex bg-black border border-zinc-850 p-1 select-none font-mono text-[10px]">
                {DAY_NAMES.map((dayName, idx) => (
                  <button
                    key={dayName}
                    type="button"
                    onClick={() => {
                      sounds.playBeep();
                      setSelectedDayIndex(idx);
                    }}
                    className={`px-3 py-1.5 font-bold cursor-pointer transition-all border-none ${
                      selectedDayIndex === idx ? 'bg-zinc-900 text-white' : 'text-zinc-550 hover:text-zinc-300 bg-transparent'
                    }`}
                  >
                    {dayName.slice(0, 3)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Calendar Weekly Time Grid (Standard View) */}
        {viewMode === 'weekly' ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse text-left select-none font-mono text-xs">
              <thead>
                <tr className="border-b border-zinc-900">
                  <th className="py-3 px-2 text-[10px] text-zinc-500 font-extrabold uppercase w-24 text-center">Godzina</th>
                  {DAY_NAMES.map((dayName, idx) => (
                    <th key={dayName} className="py-3 px-3 text-[10px] text-zinc-400 font-extrabold uppercase text-center w-[18%]">
                      {dayName}
                      <span className="block text-[9px] text-zinc-650 font-normal mt-0.5">
                        {weekDates[idx].split('-').reverse().slice(0, 2).join('.')}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HOURS.map(hour => (
                  <tr key={hour} className="border-b border-zinc-900/60 group">
                    {/* Hour label */}
                    <td className="py-4 px-2 font-bold text-zinc-500 text-center bg-zinc-950/40 border-r border-zinc-900">
                      {hour}
                    </td>
                    
                    {/* Day Columns */}
                    {DAY_NAMES.map((dayName, idx) => {
                      const colDate = weekDates[idx];
                      const appt = syncedAppointments.find(a => 
                        a.date === colDate && 
                        a.hour === hour && 
                        a.dockId === selectedDockId
                      );

                      if (appt) {
                        let statusStyles = 'bg-blue-950/20 border-blue-900 text-blue-300 hover:bg-blue-950/30';
                        if (appt.status === 'CheckedIn') statusStyles = 'bg-yellow-950/20 border-yellow-900 text-yellow-300 hover:bg-yellow-950/30';
                        if (appt.status === 'Completed') statusStyles = 'bg-emerald-950/20 border-emerald-900 text-emerald-300 hover:bg-emerald-950/30';

                        return (
                          <td key={dayName} className="py-2 px-2.5">
                            <div
                              onClick={() => {
                                sounds.playBeep();
                                setSelectedAppt(appt);
                              }}
                              className={`p-2 border flex flex-col items-start gap-1 cursor-pointer transition-all hover:scale-[1.01] hover:shadow-lg ${statusStyles}`}
                            >
                              <div className="flex justify-between items-center w-full">
                                <span className="font-black text-[9px] tracking-wide">{appt.poId}</span>
                                <span className="text-[7px] uppercase font-black tracking-widest px-1 py-0.2 rounded border bg-black/40">
                                  {appt.status === 'Scheduled' ? 'ZAPLANOWANA' : appt.status === 'CheckedIn' ? 'YARD QUEUE' : 'UKOŃCZONA'}
                                </span>
                              </div>
                              <span className="text-[9px] font-bold tracking-tight truncate max-w-[110px] block" title={appt.vendorName}>{appt.vendorName}</span>
                              <div className="flex items-center gap-1 text-[8px] text-zinc-500 mt-0.5">
                                <Truck size={10} className="text-zinc-500" />
                                <span>{appt.truckPlate}</span>
                              </div>
                            </div>
                          </td>
                        );
                      }

                      // Empty slot cell with booking activator button
                      return (
                        <td key={dayName} className="py-2.5 px-3 align-middle text-center">
                          <button
                            type="button"
                            onClick={() => handleOpenBooking(colDate, hour)}
                            className="opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 mx-auto px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white rounded font-bold text-[9px] uppercase transition-all cursor-pointer shadow-md"
                          >
                            <Plus size={10} />
                            Awizuj
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Calendar Daily Comparative View (docks side-by-side) */
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse text-left select-none font-mono text-xs">
              <thead>
                <tr className="border-b border-zinc-900">
                  <th className="py-3 px-2 text-[10px] text-zinc-500 font-extrabold uppercase w-24 text-center">Godzina</th>
                  {['D1', 'D2', 'D3'].map(id => {
                    const dock = docks.find(d => d.id === id);
                    let label = `DOK ${id.replace('D', '')}`;
                    let subtitle = 'Standard Cargo';
                    if (id === 'D1') { label = 'DOK 1 (ADR)'; subtitle = 'Wymogi Chemiczne'; }
                    if (id === 'D2') { label = 'DOK 2 (COLD)'; subtitle = 'Wymogi Chłodnicze'; }

                    return (
                      <th key={id} className="py-3 px-4 text-[10px] text-zinc-400 font-extrabold uppercase text-center w-[30%]">
                        <span className="block text-zinc-200">{label}</span>
                        <span className="block text-[8px] text-zinc-550 font-normal tracking-wide mt-0.5">{subtitle}</span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {HOURS.map(hour => (
                  <tr key={hour} className="border-b border-zinc-900/60 group">
                    {/* Hour label */}
                    <td className="py-4 px-2 font-bold text-zinc-500 text-center bg-zinc-950/40 border-r border-zinc-900">
                      {hour}
                    </td>

                    {/* Dock Columns */}
                    {['D1', 'D2', 'D3'].map(dockId => {
                      const colDate = weekDates[selectedDayIndex];
                      const appt = syncedAppointments.find(a => 
                        a.date === colDate && 
                        a.hour === hour && 
                        a.dockId === dockId
                      );

                      if (appt) {
                        let statusStyles = 'bg-blue-950/20 border-blue-900 text-blue-300 hover:bg-blue-950/30';
                        if (appt.status === 'CheckedIn') statusStyles = 'bg-yellow-950/20 border-yellow-900 text-yellow-300 hover:bg-yellow-950/30';
                        if (appt.status === 'Completed') statusStyles = 'bg-emerald-950/20 border-emerald-900 text-emerald-300 hover:bg-emerald-950/30';

                        return (
                          <td key={dockId} className="py-2 px-3">
                            <div
                              onClick={() => {
                                sounds.playBeep();
                                setSelectedAppt(appt);
                              }}
                              className={`p-2 border flex flex-col items-start gap-1 cursor-pointer transition-all hover:scale-[1.01] hover:shadow-lg ${statusStyles}`}
                            >
                              <div className="flex justify-between items-center w-full">
                                <span className="font-black text-[9px] tracking-wide">{appt.poId}</span>
                                <span className="text-[7px] uppercase font-black tracking-widest px-1 py-0.2 rounded border bg-black/40 font-mono">
                                  {appt.status === 'Scheduled' ? 'ZAPLANOWANA' : appt.status === 'CheckedIn' ? 'YARD QUEUE' : 'UKOŃCZONA'}
                                </span>
                              </div>
                              <span className="text-[9px] font-bold tracking-tight truncate max-w-[170px] block" title={appt.vendorName}>{appt.vendorName}</span>
                              <div className="flex items-center gap-1.5 text-[8px] text-zinc-500 mt-0.5">
                                <span className="bg-black/30 border border-zinc-800 px-1 py-0.1 rounded text-[7.5px] uppercase">{appt.carrierName}</span>
                                <span className="font-mono text-zinc-400">{appt.truckPlate}</span>
                              </div>
                            </div>
                          </td>
                        );
                      }

                      // Empty slot cell
                      return (
                        <td key={dockId} className="py-2.5 px-3 align-middle text-center">
                          <button
                            type="button"
                            onClick={() => {
                              // Temporarily change selectedDockId to clicked dock for the form creation context
                              setSelectedDockId(dockId);
                              handleOpenBooking(colDate, hour);
                            }}
                            className="opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 mx-auto px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white rounded font-bold text-[9px] uppercase transition-all cursor-pointer shadow-md"
                          >
                            <Plus size={10} />
                            Awizuj
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Booking Appointment Modal */}
      {bookingSlot && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleCreateBooking}
            className="bg-zinc-950 border border-zinc-850 rounded-none w-full max-w-md shadow-2xl p-6 animate-in zoom-in-95 duration-150 text-left font-mono text-xs text-zinc-350"
          >
            <div className="flex items-center justify-between border-b border-zinc-900 pb-4 mb-4 select-none">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-zinc-900 border border-zinc-800 text-emerald-400">
                  <Calendar size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white uppercase tracking-wider">NOWA AWIZACJA</h4>
                  <p className="text-[9px] text-zinc-500 font-bold uppercase mt-0.5 tracking-wider">
                    {bookingSlot.date} &bull; {bookingSlot.hour} &bull; DOK: {selectedDockId}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  sounds.playBeep();
                  setBookingSlot(null);
                }}
                className="p-1 hover:bg-zinc-900 border-none bg-transparent text-zinc-500 hover:text-white cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              
              {/* Purchase Order Selector */}
              <div>
                <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">WYBIERZ DOSTAWĘ PO</label>
                <select
                  value={formPoId}
                  onChange={(e) => {
                    sounds.playBeep();
                    setFormPoId(e.target.value);
                  }}
                  className="w-full px-3 py-2 bg-black border border-zinc-850 text-zinc-200 font-mono font-bold text-xs focus:border-zinc-550 outline-none"
                  required
                >
                  <option value="">-- Wybierz PO z listy --</option>
                  {purchaseOrders.filter(po => 
                    po.status === 'Pending' && !syncedAppointments.some(a => a.poId === po.id)
                  ).map(po => (
                    <option key={po.id} value={po.id}>
                      {po.id} - {po.vendorName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Warning labels for ADR/Cold-Chain */}
              {poSecurityInfo && (
                <div className="space-y-2">
                  {poSecurityInfo.hasAdr && (
                    <div className="p-3 bg-yellow-950/20 border border-yellow-800 text-yellow-400 flex items-start gap-2 text-[10px]">
                      <AlertTriangle size={14} className="shrink-0 mt-0.5 animate-bounce" />
                      <div>
                        <span className="font-bold uppercase tracking-wider block">⚠️ RESTREKCJA ADR (CHEMIKALIA)</span>
                        Ta dostawa zawiera towary niebezpieczne. Wymagane kierowanie wyłącznie na dedykowaną rampę rozładunkową Dok 1.
                      </div>
                    </div>
                  )}
                  {poSecurityInfo.hasCold && (
                    <div className="p-3 bg-blue-950/20 border border-blue-900 text-blue-300 flex items-start gap-2 text-[10px]">
                      <Sparkles size={14} className="shrink-0 mt-0.5 animate-pulse" />
                      <div>
                        <span className="font-bold uppercase tracking-wider block">❄️ OCHRONA COLD-CHAIN</span>
                        Dostawa temperaturowa. Wymagane kierowanie wyłącznie na Dok 2 wyposażony w złącze chłodnicze.
                      </div>
                    </div>
                  )}

                  {/* Block warning if slot incompatibility */}
                  {!compatibilityStatus.compatible && (
                    <div className="p-3 bg-red-950/30 border border-red-900 text-red-400 flex items-start gap-2 text-[10px]">
                      <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold uppercase tracking-wider block">❌ NIEZGODNOŚĆ BRAMY ROZŁADUNKU</span>
                        {compatibilityStatus.reason}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Carrier input */}
              <div>
                <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">PRZEWOŹNIK / SPEDYTOR</label>
                <input
                  type="text"
                  value={formCarrier}
                  onChange={(e) => setFormCarrier(e.target.value)}
                  placeholder="np. DHL Freight, Raben Logistics, DPD"
                  className="w-full px-3.5 py-2 bg-black border border-zinc-850 text-zinc-200 focus:border-zinc-700 outline-none"
                  required
                />
              </div>

              {/* Plate Number input */}
              <div>
                <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">NUMER REJESTRACYJNY POJAZDU</label>
                <input
                  type="text"
                  value={formPlate}
                  onChange={(e) => setFormPlate(e.target.value)}
                  placeholder="np. WI 82910, WA 99128"
                  className="w-full px-3.5 py-2 bg-black border border-zinc-850 text-zinc-200 focus:border-zinc-700 outline-none uppercase font-mono"
                  required
                />
              </div>

            </div>

            <div className="flex justify-end gap-3 pt-5 border-t border-zinc-900 mt-5 select-none">
              <button
                type="button"
                onClick={() => {
                  sounds.playBeep();
                  setBookingSlot(null);
                }}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold rounded-none text-xs cursor-pointer border border-zinc-800 transition-colors"
              >
                Anuluj
              </button>
              <button
                type="submit"
                disabled={!formPoId || !compatibilityStatus.compatible}
                className={`px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold uppercase tracking-wider rounded-none transition-all border-none flex items-center gap-1.5 ${
                  formPoId && compatibilityStatus.compatible
                    ? 'opacity-100 cursor-pointer active:scale-[0.98]'
                    : 'opacity-40 cursor-not-allowed'
                }`}
              >
                <Check size={14} className="stroke-[3]" />
                Zatwierdź awizację
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Appointment Details & Action Modal */}
      {selectedAppt && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-850 rounded-none w-full max-w-md shadow-2xl p-6 animate-in zoom-in-95 duration-150 text-left font-mono text-xs text-zinc-350">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-4 mb-4 select-none">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-zinc-900 border border-zinc-800 text-emerald-400">
                  <Truck size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white uppercase tracking-wider">SZCZEGÓŁY AWIZACJI</h4>
                  <p className="text-[9px] text-zinc-500 font-bold uppercase mt-0.5 tracking-wider">
                    DOK: {selectedAppt.dockId} &bull; {selectedAppt.date} &bull; Slot: {selectedAppt.hour}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  sounds.playBeep();
                  setSelectedAppt(null);
                  setIsRescheduling(false);
                }}
                className="p-1 hover:bg-zinc-900 border-none bg-transparent text-zinc-500 hover:text-white cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {!isRescheduling ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3.5 bg-black/40 p-4 border border-zinc-900">
                  <div>
                    <span className="text-[9px] text-zinc-500 font-bold uppercase block select-none">KOD PO</span>
                    <span className="font-black text-white text-xs block mt-0.5">{selectedAppt.poId}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-500 font-bold uppercase block select-none">STATUS SLOTU</span>
                    <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded border inline-block mt-0.5 ${
                      selectedAppt.status === 'Scheduled' ? 'bg-blue-950/40 border-blue-800 text-blue-400' :
                      selectedAppt.status === 'CheckedIn' ? 'bg-yellow-950/40 border-yellow-800 text-yellow-400 animate-pulse' :
                      'bg-emerald-950/40 border-emerald-800 text-emerald-400'
                    }`}>
                      {selectedAppt.status === 'Scheduled' ? 'Zaplanowana' : selectedAppt.status === 'CheckedIn' ? 'Na placu (YMS)' : 'Rozładowana'}
                    </span>
                  </div>
                  <div className="col-span-2 border-t border-zinc-900 pt-2">
                    <span className="text-[9px] text-zinc-500 font-bold uppercase block select-none">DOSTAWCA / VENDOR</span>
                    <span className="text-zinc-200 font-bold block mt-0.5">{selectedAppt.vendorName}</span>
                  </div>
                  <div className="col-span-2 border-t border-zinc-900 pt-2">
                    <span className="text-[9px] text-zinc-500 font-bold uppercase block select-none">POJAZD & SPEDYTOR</span>
                    <p className="text-zinc-200 font-bold block mt-0.5 flex items-center gap-1.5">
                      <span className="bg-zinc-900 px-2 py-0.5 border border-zinc-800 text-[10px]">{selectedAppt.carrierName}</span>
                      <span className="bg-zinc-900 px-2 py-0.5 border border-zinc-800 text-[10px] tracking-wide uppercase">{selectedAppt.truckPlate}</span>
                    </p>
                  </div>
                </div>

                {selectedAppt.status === 'Scheduled' && (
                  <div className="bg-zinc-900/40 border border-zinc-850 p-3.5 flex items-start gap-2.5">
                    <Clock size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-zinc-400 leading-relaxed font-mono">
                      Ciężarówka zameldowała się na bramie wjazdowej? Kliknij **Gate Check-In**, aby umieścić pojazd na placu i otworzyć szlaban.
                    </p>
                  </div>
                )}

                <div className="flex justify-between items-center pt-5 border-t border-zinc-900 mt-5 select-none">
                  <div>
                    {selectedAppt.status === 'Scheduled' && (
                      <button
                        type="button"
                        onClick={() => handleDeleteAppointment(selectedAppt.id)}
                        className="h-9 px-3 bg-red-950/20 hover:bg-red-950/40 border border-red-900/60 hover:border-red-800 text-red-400 font-bold rounded-none text-xs cursor-pointer flex items-center gap-1.5 transition-colors"
                      >
                        <Trash2 size={12} />
                        Anuluj
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {selectedAppt.status === 'Scheduled' && (
                      <button
                        type="button"
                        onClick={handleStartReschedule}
                        className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-bold rounded-none text-xs cursor-pointer transition-colors"
                      >
                        Przeplanuj
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        sounds.playBeep();
                        setShowDriverPass(selectedAppt);
                        setSelectedAppt(null);
                      }}
                      className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-bold rounded-none text-xs cursor-pointer transition-colors flex items-center gap-1.5"
                    >
                      <Printer size={12} />
                      Przepustka
                    </button>

                    {selectedAppt.status === 'Scheduled' && (
                      <button
                        type="button"
                        onClick={() => handleCheckInToYard(selectedAppt)}
                        className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-none text-xs cursor-pointer transition-all border-none flex items-center gap-1.5 active:scale-[0.98]"
                      >
                        <Play size={12} className="fill-current" />
                        Check-In
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Rescheduling Panel */
              <div className="space-y-4 animate-fadeIn">
                <div className="p-3 bg-yellow-950/20 border border-yellow-800/40 text-yellow-400 text-[10px]">
                  <strong>TRYB PRZEPLANOWANIA SLOTU</strong> - Zmień parametry awizacji dla zlecenia {selectedAppt.poId}.
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">WYBIERZ BRAMĘ (DOK)</label>
                    <select
                      value={rescheduleDock}
                      onChange={(e) => setRescheduleDock(e.target.value)}
                      className="w-full px-2 py-1.5 bg-black border border-zinc-850 text-zinc-200 focus:border-zinc-700 outline-none"
                    >
                      <option value="D1">Dok 1 (Rampa ADR)</option>
                      <option value="D2">Dok 2 (Rampa Chłodnicza)</option>
                      <option value="D3">Dok 3 (Standard)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">WYBIERZ DATĘ</label>
                    <select
                      value={rescheduleDate}
                      onChange={(e) => setRescheduleDate(e.target.value)}
                      className="w-full px-2 py-1.5 bg-black border border-zinc-850 text-zinc-200 focus:border-zinc-700 outline-none"
                    >
                      {weekDates.map((dateStr, idx) => (
                        <option key={dateStr} value={dateStr}>
                          {dateStr} ({DAY_NAMES[idx]})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">WYBIERZ GODZINĘ (SLOT)</label>
                    <select
                      value={rescheduleHour}
                      onChange={(e) => setRescheduleHour(e.target.value)}
                      className="w-full px-2 py-1.5 bg-black border border-zinc-850 text-zinc-200 focus:border-zinc-700 outline-none"
                    >
                      {HOURS.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-5 border-t border-zinc-900 mt-5">
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playBeep();
                      setIsRescheduling(false);
                    }}
                    className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-bold rounded-none text-xs cursor-pointer transition-colors"
                  >
                    Anuluj
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmReschedule}
                    className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-none text-xs cursor-pointer transition-all border-none flex items-center gap-1.5 active:scale-[0.98]"
                  >
                    <Check size={14} className="stroke-[3]" />
                    Zatwierdź przeplanowanie
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Driver Entry Pass Print Preview Modal */}
      {showDriverPass && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-850 rounded-none w-full max-w-xl shadow-2xl p-6 animate-in zoom-in-95 duration-150 text-left font-mono text-xs text-zinc-300">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-4 mb-5 select-none">
              <h4 className="font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                <Printer size={16} className="text-emerald-400" /> PODGLĄD WYDRUKU PRZEPUSTKI WJAZDOWEJ
              </h4>
              <button
                type="button"
                onClick={() => {
                  sounds.playBeep();
                  setShowDriverPass(null);
                }}
                className="p-1 hover:bg-zinc-900 border-none bg-transparent text-zinc-500 hover:text-white cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Boarding-pass styled ticket */}
            <div className="w-full bg-white text-slate-900 p-5 rounded-none border border-slate-350 shadow-2xl flex flex-col gap-4 relative overflow-hidden">
              {/* Cut-out circular notches for boarding pass effect */}
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-zinc-950 border border-zinc-850" />
              <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-zinc-950 border border-zinc-850" />

              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3">
                <div>
                  <h3 className="text-lg font-black tracking-tight text-slate-950">PRZEPUSTKA WJAZDOWANA YMS</h3>
                  <p className="text-[8px] text-slate-550 font-bold uppercase tracking-widest mt-0.5">HUB-PL-01 GATE ENTRY PASS</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold border border-slate-905 px-2 py-0.5 bg-slate-950 text-white rounded">
                    DOKASSIGN-{showDriverPass.dockId}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-[10px]">
                <div className="space-y-1">
                  <span className="text-[7.5px] text-slate-400 font-bold uppercase select-none block">KOD AWIZACJI / APPT ID</span>
                  <span className="font-bold text-slate-950">{showDriverPass.id}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[7.5px] text-slate-400 font-bold uppercase select-none block">NUMER PO / ORDER ID</span>
                  <span className="font-bold text-slate-950">{showDriverPass.poId}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[7.5px] text-slate-400 font-bold uppercase select-none block">PRZEWOŹNIK / CARRIER</span>
                  <span className="font-bold text-slate-950">{showDriverPass.carrierName}</span>
                </div>

                <div className="col-span-3 border-t border-slate-150 pt-2 grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <span className="text-[7.5px] text-slate-400 font-bold uppercase select-none block">DATA AWIZACJI / DATE</span>
                    <span className="font-bold text-slate-950">{showDriverPass.date}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[7.5px] text-slate-400 font-bold uppercase select-none block">SLOT / TIME SLOT</span>
                    <span className="font-bold text-slate-950">{showDriverPass.hour}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[7.5px] text-slate-400 font-bold uppercase select-none block">NUMER REJ. / PLATE</span>
                    <span className="font-mono font-bold text-slate-950 uppercase">{showDriverPass.truckPlate}</span>
                  </div>
                </div>
              </div>

              {/* Dotted separator line */}
              <div className="border-t border-dashed border-slate-300 my-2" />

              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="space-y-2 text-slate-700 text-[9px] max-w-sm text-left">
                  <p className="font-bold text-slate-950 uppercase select-none tracking-wider text-[8px]">INSTRUKCJA DLA KIEROWCY / INSTRUCTIONS:</p>
                  <p>1. Zgłoś się 15 minut przed czasem na parkingu buforowym P-East.</p>
                  <p>2. Po wywołaniu przez komunikat YMS podjedź pod wyznaczoną bramę: <strong>Dok {showDriverPass.dockId.replace('D', '')}</strong>.</p>
                  <p>3. Przy rozładunku okaż powyższy kod QR pracownikowi rampy.</p>
                </div>

                {/* Mock Barcode/QR Code scanner block */}
                <div className="flex flex-col items-center gap-1.5 p-3 bg-zinc-50 border border-slate-200 rounded shrink-0">
                  <div className="w-16 h-16 bg-white border border-slate-300 p-1 flex items-center justify-center">
                    {/* Simulated visual QR code block layout */}
                    <div className="w-full h-full border border-black p-0.5 flex flex-col gap-0.5">
                      <div className="flex justify-between h-3">
                        <div className="w-3 h-3 bg-black" />
                        <div className="w-3 h-3 bg-black" />
                      </div>
                      <div className="flex-1 flex justify-around items-center">
                        <div className="w-2 h-2 bg-black" />
                        <div className="w-1.5 h-1.5 bg-black" />
                        <div className="w-2 h-2 bg-black" />
                      </div>
                      <div className="flex justify-between h-3">
                        <div className="w-3 h-3 bg-black" />
                        <div className="w-1.5 h-1.5 bg-black" />
                      </div>
                    </div>
                  </div>
                  <span className="text-[7px] text-slate-400 uppercase tracking-widest font-mono">DOCK-VERIFY-PASS</span>
                </div>
              </div>

            </div>

            <div className="flex justify-end gap-3 pt-5 border-t border-zinc-900 mt-5">
              <button
                type="button"
                onClick={() => {
                  sounds.playBeep();
                  setShowDriverPass(null);
                }}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold rounded-none text-xs cursor-pointer border border-zinc-800 transition-colors"
              >
                Anuluj
              </button>
              <button
                type="button"
                onClick={handlePrintPass}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-none text-xs cursor-pointer transition-all border-none flex items-center gap-1.5 active:scale-[0.98]"
              >
                <Printer size={14} />
                Drukuj przepustkę wjazdową (Zebra A4)
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
