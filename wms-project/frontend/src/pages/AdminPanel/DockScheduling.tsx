import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calendar, Clock, Plus, X, Check, Truck, 
  Trash2, Play, Users, BarChart3, ShieldCheck, MapPin
} from 'lucide-react';
import { sounds } from '../../components/SoundEffects';

// Type definitions
interface PurchaseOrderItem {
  sku: string;
  name: string;
  qtyOrdered: number;
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
  day: 'Poniedziałek' | 'Wtorek' | 'Środa' | 'Czwartek' | 'Piątek';
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
const DAYS = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek'] as const;

export default function DockScheduling({
  purchaseOrders = [],
  yardTrucks = [],
  setYardTrucks,
  docks = [],
  setDocks,
  logActivity,
  addToast
}: DockSchedulingProps) {
  const [selectedDockId, setSelectedDockId] = useState('D1');
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // Modals state
  const [bookingSlot, setBookingSlot] = useState<{ day: typeof DAYS[number]; hour: string } | null>(null);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);

  // Booking Form State
  const [formPoId, setFormPoId] = useState('');
  const [formCarrier, setFormCarrier] = useState('');
  const [formPlate, setFormPlate] = useState('');

  // 1. Load and initialize appointments from localStorage
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('wms-dock-appointments');
      if (saved) {
        setAppointments(JSON.parse(saved));
      } else {
        // Pre-populate with realistic mock appointments if none exist
        const initialMock: Appointment[] = [
          {
            id: 'APT-10029',
            day: 'Poniedziałek',
            hour: '09:00',
            dockId: 'D1',
            poId: 'PO-00810',
            vendorName: 'Janmar Części Sp. z o.o.',
            carrierName: 'Raben Logistics',
            truckPlate: 'WI 82910',
            status: 'Scheduled'
          },
          {
            id: 'APT-10034',
            day: 'Środa',
            hour: '14:00',
            dockId: 'D2',
            poId: 'PO-00812',
            vendorName: 'Inter-Cars S.A.',
            carrierName: 'DHL Freight',
            truckPlate: 'WA 99128',
            status: 'Scheduled'
          }
        ];
        setAppointments(initialMock);
        window.localStorage.setItem('wms-dock-appointments', JSON.stringify(initialMock));
      }
    } catch (e) {
      console.error("Failed to load appointments:", e);
    }
  }, []);

  // Save appointments to localStorage whenever they change
  const saveAppointments = (list: Appointment[]) => {
    setAppointments(list);
    window.localStorage.setItem('wms-dock-appointments', JSON.stringify(list));
  };

  // 2. Synchronize appointment status when a PO is Completed in WMS
  const syncedAppointments = useMemo(() => {
    return appointments.map(appt => {
      const relatedPo = purchaseOrders.find(po => po.id === appt.poId);
      if (relatedPo && relatedPo.status === 'Completed' && appt.status !== 'Completed') {
        return { ...appt, status: 'Completed' as const };
      }
      return appt;
    });
  }, [appointments, purchaseOrders]);

  // 3. KPI metrics calculations
  const kpis = useMemo(() => {
    const totalBooked = syncedAppointments.length;
    
    // Total slot cells count = 10 hours * 5 days = 50 slots per dock. Total 150 slots across 3 docks.
    const totalPossibleSlots = 50;
    const currentDockBookings = syncedAppointments.filter(a => a.dockId === selectedDockId).length;
    const utilizationRate = Math.round((currentDockBookings / totalPossibleSlots) * 100);

    const pendingPos = purchaseOrders.filter(po => po.status === 'Pending').map(po => po.id);
    const assignedPoIds = syncedAppointments.map(a => a.poId);
    const unassignedCount = pendingPos.filter(poId => !assignedPoIds.includes(poId)).length;

    return {
      totalBooked,
      utilizationRate,
      unassignedCount
    };
  }, [syncedAppointments, selectedDockId, purchaseOrders]);

  // 4. Open booking dialog
  const handleOpenBooking = (day: typeof DAYS[number], hour: string) => {
    sounds.playBeep();
    setBookingSlot({ day, hour });
    
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

  // 5. Submit new appointment booking
  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingSlot) return;

    if (!formPoId) {
      addToast('Brak zamówienia PO', 'Wybierz zamówienie PO do awizacji.', 'warning');
      return;
    }

    const po = purchaseOrders.find(o => o.id === formPoId);
    if (!po) return;

    // Check collision for selected day, hour and dock
    const isConflict = syncedAppointments.some(a => 
      a.day === bookingSlot.day && 
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
      day: bookingSlot.day,
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
      `Utworzono awizację dostawy ${formPoId} na ${bookingSlot.day} ${bookingSlot.hour}`,
      'yms',
      `Przypisano Dok: ${selectedDockId}, Przewoźnik: ${newAppointment.carrierName}, Pojazd: ${newAppointment.truckPlate}`
    );

    sounds.playSuccess();
    addToast('Awizacja utworzona', `Zarezerwowano ${bookingSlot.day} o godz. ${bookingSlot.hour} na bramie ${selectedDockId}.`, 'success');
    setBookingSlot(null);
  };

  // 6. Delete / Cancel Appointment
  const handleDeleteAppointment = (apptId: string) => {
    sounds.playBeep();
    const appt = syncedAppointments.find(a => a.id === apptId);
    if (!appt) return;

    const filtered = appointments.filter(a => a.id !== apptId);
    saveAppointments(filtered);
    
    logActivity(
      `Anulowano awizację dostawy dla zamówienia PO ${appt.poId}`,
      'yms',
      `Usunięto rezerwację okna czasowego w bramie ${appt.dockId}`
    );

    addToast('Awizacja anulowana', `Usunięto rezerwację dla dostawy ${appt.poId}.`, 'info');
    setSelectedAppt(null);
  };

  // 7. Check-In: Send truck to YMS and reserve dock in real time
  const handleCheckInToYard = (appt: Appointment) => {
    sounds.playSuccess();

    // Check if the PO is already checked in or docked to prevent duplicates
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

  return (
    <div id="wms-dock-scheduling" className="space-y-6 font-sans text-sm text-[#334155] animate-fadeIn pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-left">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
            <Calendar className="w-5.5 h-5.5 text-blue-650" /> Terminarz Awizacji i Rezerwacji Bram (YMS Calendar)
          </h2>
          <p className="text-xs text-slate-500 mt-1.5 max-w-xl">
            Zarządzaj awizacjami dostaw od dostawców (Purchase Orders). Rezerwuj okna czasowe w bramkach rozładowczych (Doki 1-3) i melduj kierowców w systemie Yard Management.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        <div className="bg-white border border-slate-200 rounded-xl p-4.5 flex items-center justify-between shadow-xs text-left">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase select-none">Zarezerwowane okna</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 font-mono">{kpis.totalBooked}</span>
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded">awizacji</span>
            </div>
            <span className="text-[10px] text-slate-450 block">Łączna liczba zarezerwowanych dostaw w tym tygodniu.</span>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
            <Clock className="w-6 h-6 stroke-1.5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4.5 flex items-center justify-between shadow-xs text-left">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase select-none">Obłożenie Dok {selectedDockId}</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 font-mono">{kpis.utilizationRate}%</span>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">utylizacji</span>
            </div>
            <span className="text-[10px] text-slate-450 block">Stopień zajętości godzinowej wybranej bramy.</span>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <BarChart3 className="w-6 h-6 stroke-1.5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4.5 flex items-center justify-between shadow-xs text-left">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase select-none">Oczekujące PO bez slotu</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-rose-700 font-mono">{kpis.unassignedCount}</span>
              <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded">zleceń PO</span>
            </div>
            <span className="text-[10px] text-slate-450 block">Aktywne dostawy PO czekające na przydział okna.</span>
          </div>
          <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
            <Truck className="w-6 h-6 stroke-1.5" />
          </div>
        </div>

      </div>

      {/* Dock selector and calendar grid */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        
        {/* Dock selector bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-150 pb-3">
          <div className="text-left">
            <h3 className="font-bold text-slate-900 text-sm">Harmonogram okienek czasowych</h3>
            <p className="text-xs text-slate-500 mt-0.5">Wybierz dok, aby zarządzać jego rezerwacjami.</p>
          </div>

          <div className="flex bg-slate-100 p-1.5 rounded-lg border border-slate-250 select-none">
            {['D1', 'D2', 'D3'].map(id => {
              const dock = docks.find(d => d.id === id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    sounds.playBeep();
                    setSelectedDockId(id);
                  }}
                  className={`px-4 py-1.5 rounded-md font-bold text-xs cursor-pointer transition-all ${
                    selectedDockId === id
                      ? 'bg-white text-blue-650 shadow-sm border border-slate-200'
                      : 'text-slate-500 border-none bg-transparent hover:text-slate-800'
                  }`}
                >
                  {dock ? dock.name : `Dok ${id.replace('D', '')}`}
                </button>
              );
            })}
          </div>
        </div>

        {/* Calendar Weekly Time Grid */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-left select-none">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-3 px-2 text-[10px] text-slate-400 font-extrabold uppercase w-24 text-center">Godzina</th>
                {DAYS.map(day => (
                  <th key={day} className="py-3 px-3 text-[10px] text-slate-450 font-extrabold uppercase text-center w-[18%]">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HOURS.map(hour => (
                <tr key={hour} className="border-b border-slate-100 group">
                  {/* Hour labels */}
                  <td className="py-4 px-2 font-mono font-bold text-slate-450 text-center bg-slate-50 border-r border-slate-100 text-xs">
                    {hour}
                  </td>
                  
                  {/* Day Columns */}
                  {DAYS.map(day => {
                    // Find if there is an active appointment
                    const appt = syncedAppointments.find(a => 
                      a.day === day && 
                      a.hour === hour && 
                      a.dockId === selectedDockId
                    );

                    if (appt) {
                      let statusStyles = 'bg-blue-50/70 border-blue-200 text-blue-900';
                      if (appt.status === 'CheckedIn') statusStyles = 'bg-amber-50/70 border-amber-250 text-amber-900';
                      if (appt.status === 'Completed') statusStyles = 'bg-emerald-50/70 border-emerald-250 text-emerald-900';

                      return (
                        <td key={day} className="py-1.5 px-2">
                          <div
                            onClick={() => {
                              sounds.playBeep();
                              setSelectedAppt(appt);
                            }}
                            className={`p-2 rounded-xl border flex flex-col items-start gap-1 cursor-pointer transition-all hover:scale-[1.01] hover:shadow-sm ${statusStyles}`}
                          >
                            <div className="flex justify-between items-center w-full">
                              <span className="font-mono font-black text-[10px] tracking-wide">{appt.poId}</span>
                              <span className="text-[7.5px] uppercase font-black tracking-widest px-1.5 py-0.2 rounded border">
                                {appt.status === 'Scheduled' ? 'ZAPLANOWANA' : appt.status === 'CheckedIn' ? 'YARD QUEUE' : 'UKOŃCZONA'}
                              </span>
                            </div>
                            <span className="text-[9px] font-extrabold tracking-tight truncate max-w-[110px] block" title={appt.vendorName}>{appt.vendorName}</span>
                            <div className="flex items-center gap-1 text-[8.5px] text-slate-500 font-mono mt-0.5">
                              <Truck className="w-3 h-3 text-slate-400" />
                              <span>{appt.truckPlate}</span>
                            </div>
                          </div>
                        </td>
                      );
                    }

                    // Empty slot cell with booking activator button
                    return (
                      <td key={day} className="py-2.5 px-3 align-middle text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenBooking(day, hour)}
                          className="opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 mx-auto px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-350 text-slate-450 hover:text-slate-800 rounded-md font-bold text-[10px] uppercase transition-all cursor-pointer shadow-inner"
                        >
                          <Plus className="w-3 h-3" />
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

      </div>

      {/* Booking Appointment Modal */}
      {bookingSlot && (
        <div className="fixed inset-0 bg-[#0b1329]/65 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleCreateBooking}
            className="bg-white border border-slate-250 rounded-2xl w-full max-w-md shadow-2xl p-6 animate-in zoom-in-95 duration-150 text-left font-sans"
          >
            <div className="flex items-center justify-between border-b border-slate-150 pb-4 mb-4 select-none">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-650 rounded-xl">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-slate-950 uppercase tracking-wide">Dodaj nową awizację</h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5 tracking-wider">
                    {bookingSlot.day} &bull; {bookingSlot.hour} &bull; Dok: {selectedDockId}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  sounds.playBeep();
                  setBookingSlot(null);
                }}
                className="p-1 hover:bg-slate-150 rounded-full border-none bg-transparent text-slate-450 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              
              {/* Purchase Order Selector */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Wybierz dostawę PO (Pending POs)</label>
                <select
                  value={formPoId}
                  onChange={(e) => {
                    sounds.playBeep();
                    setFormPoId(e.target.value);
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono font-bold text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                >
                  {purchaseOrders.filter(po => 
                    po.status === 'Pending' && !syncedAppointments.some(a => a.poId === po.id)
                  ).length === 0 ? (
                    <option value="">Brak oczekujących zleceń PO</option>
                  ) : (
                    purchaseOrders.filter(po => 
                      po.status === 'Pending' && !syncedAppointments.some(a => a.poId === po.id)
                    ).map(po => (
                      <option key={po.id} value={po.id}>
                        {po.id} - {po.vendorName}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Carrier input */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Przewoźnik / Spedytor</label>
                <input
                  type="text"
                  value={formCarrier}
                  onChange={(e) => setFormCarrier(e.target.value)}
                  placeholder="np. DHL Freight, Raben Logistics, DPD"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-350 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-550 outline-none shadow-inner"
                  required
                />
              </div>

              {/* Plate Number input */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Numer rejestracyjny ciągnika / naczepy</label>
                <input
                  type="text"
                  value={formPlate}
                  onChange={(e) => setFormPlate(e.target.value)}
                  placeholder="np. WI 82910, WA 99128"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-350 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-550 outline-none font-mono uppercase shadow-inner"
                  required
                />
              </div>

            </div>

            <div className="flex justify-end gap-3 pt-5 border-t border-slate-150 mt-5 select-none">
              <button
                type="button"
                onClick={() => {
                  sounds.playBeep();
                  setBookingSlot(null);
                }}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-750 font-bold rounded-lg text-xs cursor-pointer bg-white"
              >
                Anuluj
              </button>
              <button
                type="submit"
                disabled={!formPoId}
                className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all border-none flex items-center gap-1.5 ${
                  formPoId
                    ? 'bg-blue-650 hover:bg-blue-700 text-white shadow-md cursor-pointer active:scale-[0.97]'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                }`}
              >
                <Check className="w-4 h-4 stroke-[3]" />
                Zatwierdź awizację
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Appointment Details & Gate Check-In Modal */}
      {selectedAppt && (
        <div className="fixed inset-0 bg-[#0b1329]/65 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-250 rounded-2xl w-full max-w-md shadow-2xl p-6 animate-in zoom-in-95 duration-150 text-left font-sans">
            <div className="flex items-center justify-between border-b border-slate-150 pb-4 mb-4 select-none">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-650 rounded-xl">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-slate-950 uppercase tracking-wide">Szczegóły awizacji</h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5 tracking-wider">
                    DOK: {selectedAppt.dockId} &bull; {selectedAppt.day} {selectedAppt.hour}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  sounds.playBeep();
                  setSelectedAppt(null);
                }}
                className="p-1 hover:bg-slate-150 rounded-full border-none bg-transparent text-slate-450 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-semibold text-slate-650">
              <div className="grid grid-cols-2 gap-3.5 bg-slate-50 p-4 rounded-xl border border-slate-150">
                <div>
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase block select-none">KOD ZLECENIA PO</span>
                  <span className="font-mono font-black text-slate-900 text-xs block mt-0.5">{selectedAppt.poId}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase block select-none">STATUS AWIZACJI</span>
                  <span className={`px-2 py-0.5 text-[8.5px] font-black uppercase tracking-wider rounded border inline-block mt-0.5 ${
                    selectedAppt.status === 'Scheduled' ? 'bg-blue-50 border-blue-200 text-blue-800' :
                    selectedAppt.status === 'CheckedIn' ? 'bg-amber-50 border-amber-250 text-amber-800 animate-pulse' :
                    'bg-emerald-50 border-emerald-250 text-emerald-800'
                  }`}>
                    {selectedAppt.status === 'Scheduled' ? 'Zaplanowana' : selectedAppt.status === 'CheckedIn' ? 'Na placu' : 'Ukończona'}
                  </span>
                </div>
                <div className="col-span-2 border-t border-slate-200 pt-2">
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase block select-none">DOSTAWCA / VENDOR</span>
                  <span className="text-slate-900 font-extrabold block mt-0.5">{selectedAppt.vendorName}</span>
                </div>
                <div className="col-span-2 border-t border-slate-200 pt-2">
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase block select-none">DANE PRZEWOŹNIKA i POJAZDU</span>
                  <p className="text-slate-900 font-extrabold block mt-0.5 flex items-center gap-1.5">
                    <span className="bg-slate-200 px-2 py-0.5 rounded border text-[10px]">{selectedAppt.carrierName}</span>
                    <span className="font-mono bg-slate-200 px-2 py-0.5 rounded border text-[10px] tracking-wide uppercase">{selectedAppt.truckPlate}</span>
                  </p>
                </div>
              </div>

              {selectedAppt.status === 'Scheduled' && (
                <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-3.5 flex items-start gap-3">
                  <Clock className="w-5.5 h-5.5 text-blue-650 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-slate-650 leading-relaxed font-semibold">
                    Kierowca przyjechał na bramę wjazdową? Kliknij **Check-In**, aby automatycznie zameldować ciężarówkę w kolejce systemu YMS i zarezerwować dla niej Dok {selectedAppt.dockId}.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-5 border-t border-slate-150 mt-5 select-none">
              <div>
                {selectedAppt.status === 'Scheduled' && (
                  <button
                    type="button"
                    onClick={() => handleDeleteAppointment(selectedAppt.id)}
                    className="h-9 px-3 border border-red-200 hover:bg-red-50 text-red-650 font-bold rounded-lg text-xs cursor-pointer bg-white flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Anuluj rezerwację
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playBeep();
                    setSelectedAppt(null);
                  }}
                  className="px-4 py-2 border border-slate-350 hover:bg-slate-50 text-slate-750 font-bold rounded-lg text-xs cursor-pointer bg-white"
                >
                  Zamknij
                </button>
                
                {selectedAppt.status === 'Scheduled' && (
                  <button
                    type="button"
                    onClick={() => handleCheckInToYard(selectedAppt)}
                    className="px-4.5 py-2 bg-blue-650 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all border-none flex items-center gap-1.5 shadow-md cursor-pointer active:scale-[0.97]"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Gate Check-In
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
