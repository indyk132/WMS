import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Printer,
  Copy,
  Download,
  CheckCircle2,
  Clock,
  User,
  Truck,
  Layers,
  FileText,
  FileEdit,
  History,
  ScrollText,
  AlertTriangle,
  Check,
  Edit2
} from 'lucide-react';

export interface OrderItem {
  lp: number;
  sku: string;
  product: string;
  quantity: number;
  zone: string;
  status: string;
}

export interface ActivityLog {
  id: string;
  title: string;
  actor: string;
  date: string;
}

export interface ChangeLog {
  id: string;
  title: string;
  description: string;
  date: string;
  actor: string;
}

export interface OrderDetailStruct {
  id: string;
  customerName: string;
  customer: string;
  email: string;
  phone: string;
  shippingAddress: string;
  shippingMethod: string;
  estimatedDelivery: string;
  internalNotes: string;
  internalNotesActor: string;
  waybillNumber: string;
  waybillPdfDate: string;
  status: string;
  pickingZones: { name: string; percentage: number }[];
  activityHistory: ActivityLog[];
  changeLogs: ChangeLog[];
  items: OrderItem[];
}

interface OrderDetailProps {
  order: OrderDetailStruct;
  onBack: () => void;
  onUpdateStatus: (id: string, status: string) => void;
  onAddChangeLog: (id: string, title: string, description: string) => void;
  onUpdateOrder: (id: string, fields: Partial<OrderDetailStruct>) => void;
}

export function OrderDetail({ order, onBack, onUpdateStatus, onAddChangeLog, onUpdateOrder }: OrderDetailProps) {
  const [copied, setCopied] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [noteText, setNoteText] = useState(order.internalNotes || '');

  // Custom modal inputs instead of prompts
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editClientName, setEditClientName] = useState(order.customerName);
  const [editEmail, setEditEmail] = useState(order.email);
  const [editPhone, setEditPhone] = useState(order.phone);

  // Print & Cancel states
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);

  useEffect(() => {
    setNoteText(order.internalNotes || '');
  }, [order.id, order.internalNotes]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleCopyWaybill = () => {
    navigator.clipboard.writeText(order.waybillNumber);
    setCopied(true);
    triggerToast('Skopiowano list przewozowy DPD do schowka.');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextStatus = e.target.value;
    if (nextStatus) {
      onUpdateStatus(order.id, nextStatus);
      onAddChangeLog(
        order.id,
        'Zmiana Statusu',
        `Zmieniono status zamówienia na: ${nextStatus}`,
      );
      triggerToast(`Udało się zaktualizować status zamówienia na: ${nextStatus}`);
    }
  };

  const handleSaveNotes = () => {
    onUpdateOrder(order.id, { internalNotes: noteText });
    setIsEditingNotes(false);
    onAddChangeLog(
      order.id,
      'Zaktualizowano notatki',
      'Wprowadzono korektę w notatkach wewnętrznych magazynu',
    );
    triggerToast('Notatki wewnętrzne zostały pomyślnie zsynchronizowane.');
  };

  const computeTotalItems = () => {
    return order.items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getStatusColorDot = (status: string) => {
    switch (status) {
      case 'W realizacji':
        return 'bg-blue-600';
      case 'Wysłane':
        return 'bg-emerald-600';
      case 'Oczekujące':
        return 'bg-amber-500';
      case 'Dostarczone':
        return 'bg-emerald-700';
      case 'Anulowane':
        return 'bg-red-600';
      default:
        return 'bg-indigo-600';
    }
  };

  const handlePrintLabel = () => {
    onAddChangeLog(order.id, 'Etykieta wydrukowana', 'Wydrukowano etykietę adresową DPD');
    triggerToast(`[WMS-PRINTER] Trwa wydruk etykiety Zebra na stacji pakowania dla paczki: ${order.id}...`);
  };

  const confirmCancelOrder = () => {
    onUpdateStatus(order.id, 'Anulowane');
    onAddChangeLog(order.id, 'Anulowano zamówienie', 'System anulował zlecenie');
    setIsCancelConfirmOpen(false);
    triggerToast('Zamówienie zostało pomyślnie oznaczone jako ANULOWANE.');
  };

  const handleSaveClientDetails = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateOrder(order.id, {
      customerName: editClientName,
      customer: editClientName,
      email: editEmail,
      phone: editPhone
    });
    onAddChangeLog(order.id, 'Aktualizacja kontrahenta', `Zmieniono dane klienta na: ${editClientName}`);
    setIsClientModalOpen(false);
    triggerToast('Pomyślnie zapisano poprawki w profilu kontrahenta.');
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200 text-sm text-slate-700" id="order-details-pane">
      {/* Dynamic inline notification instead of raw alerts */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#1e293b] text-white px-4 py-3 rounded-xl border border-slate-700 shadow-2xl flex items-center gap-2.5 max-w-sm animate-in slide-in-from-bottom-6 duration-150">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-[11px] font-bold tracking-tight leading-snug">{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <div className="flex items-center gap-3 mb-1.5 select-none">
            <button
              onClick={onBack}
              className="text-[#2563eb] hover:text-blue-700 hover:underline text-xs font-bold flex items-center gap-1 cursor-pointer bg-transparent border-none outline-none"
            >
              <ArrowLeft className="w-4 h-4" /> Powrót do listy zamówień
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xl font-extrabold text-[#0f172a] font-sans">Karta Zamówienia</span>
            <span className="px-2.5 py-0.5 rounded-md bg-slate-900 text-white font-mono text-xs font-bold">
              {order.id}
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-800 font-bold text-xs flex items-center gap-1.5 border border-slate-200 shadow-3xs select-none">
              <span className={`w-2 h-2 rounded-full ${getStatusColorDot(order.status)} animate-pulse`}></span>{' '}
              {order.status}
            </span>

            <div className="relative inline-block ml-2 select-none">
              <select
                onChange={handleStatusChange}
                value={order.status}
                className="appearance-none bg-white border border-slate-350 rounded-lg pl-3 pr-8 py-1 font-bold text-xs text-slate-800 focus:ring-2 focus:ring-[#2563eb]/20 outline-none cursor-pointer h-8"
              >
                <option value="" disabled>Zmień status</option>
                <option value="Nowe">Nowe</option>
                <option value="W realizacji">W realizacji</option>
                <option value="Wysłane">Wysłane</option>
                <option value="Dostarczone">Dostarczone</option>
                <option value="Anulowane">Anulowane</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-slate-450">
                <span className="text-[10px]">&#9662;</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto shrink-0 select-none">
          <button
            onClick={handlePrintLabel}
            className="flex-1 md:flex-none px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-3xs"
          >
            <Printer className="w-4 h-4 text-slate-500" /> Drukuj Etykietę Zebra
          </button>
          <button
            onClick={() => {
              setEditClientName(order.customerName);
              setEditEmail(order.email);
              setEditPhone(order.phone);
              setIsClientModalOpen(true);
            }}
            className="flex-1 md:flex-none px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
          >
            <Edit2 className="w-4 h-4 text-slate-500" /> Edytuj Klienta
          </button>
          <button
            disabled={order.status === 'Anulowane'}
            onClick={() => setIsCancelConfirmOpen(true)}
            className="flex-1 md:flex-none px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-bold text-xs rounded-lg transition-all cursor-pointer shadow-sm border-none"
          >
            Anuluj Zlecenie
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Dane Klienta Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-100 pb-2.5">
                <User className="w-4.5 h-4.5 text-[#2563eb]" /> 1. Profil Kontrahenta
              </h3>
              <div className="space-y-3.5">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Klient / Firma</span>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">{order.customerName}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">E-mail</span>
                    <p className="text-xs font-semibold text-[#2563eb] truncate mt-0.5">{order.email}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Telefon kontaktowy</span>
                    <p className="text-xs font-semibold text-slate-900 font-mono mt-0.5">{order.phone}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Informacje o Wysyłce Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-100 pb-2.5">
                <Truck className="w-4.5 h-4.5 text-[#2563eb]" /> 2. Wysyłka & Logistyka
              </h3>
              <div className="space-y-3.5">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Adres Dostawy</span>
                  <p className="text-xs font-bold text-slate-900 mt-0.5" title={order.shippingAddress}>{order.shippingAddress}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Operator spedycji</span>
                    <p className="text-xs font-bold text-slate-800 mt-0.5">{order.shippingMethod}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono font-sans font-bold text-slate-400">Wyjazd</span>
                    <p className="text-xs font-semibold text-teal-650 font-mono mt-0.5">{order.estimatedDelivery}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table Card */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-150 bg-slate-50/50 flex justify-between items-center select-none">
              <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <Layers className="w-4.5 h-4.5 text-[#2563eb]" /> Szczegółowe Pozycje SKU ({order.items.length})
              </h3>
              <span className="text-[10px] font-mono text-slate-500 font-bold">Status kompletacji paczki</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 text-[10px] font-bold border-b border-slate-200 uppercase tracking-wider font-mono">
                    <th className="py-2.5 px-4 w-12 text-center">LP</th>
                    <th className="py-2.5 px-4">Kod SKU</th>
                    <th className="py-2.5 px-4">Opis Artykułu</th>
                    <th className="py-2.5 px-4">Strefa WMS</th>
                    <th className="py-2.5 px-4 text-center w-28">Zlecono (szt)</th>
                    <th className="py-2.5 px-4 text-right">Stan SKU</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-705">
                  {order.items.map((item, idx) => {
                    const isDone = order.status === 'Wysłane' || order.status === 'Dostarczone';
                    return (
                      <tr key={item.sku || idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 text-center font-mono text-slate-400">{item.lp || (idx + 1)}</td>
                        <td className="py-3 px-4 font-mono font-bold text-[#0052cc]">{item.sku}</td>
                        <td className="py-3 px-4 text-slate-900 font-medium">{item.product || 'Artykuł WMS'}</td>
                        <td className="py-3 px-4 font-mono text-slate-500">{item.zone || 'A1'}</td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-[#0f172a]">{item.quantity} szt.</td>
                        <td className="py-3 px-4 text-right select-none">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            isDone 
                              ? 'bg-emerald-50 text-emerald-800' 
                              : 'bg-amber-50 text-amber-800 animate-pulse'
                          }`}>
                            {isDone ? 'Spakowano' : 'Do zebrania'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-150 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs select-none">
              <span className="text-slate-500 font-medium">Suma wszystkich asortymentów: <strong className="text-slate-800 font-mono font-extrabold">{computeTotalItems()} szt.</strong></span>
              <div className="flex gap-2">
                <span className="px-2.5 py-1 bg-white border border-slate-200 rounded text-[11px] font-mono text-slate-650 flex items-center gap-1">
                  Waybill: <strong>{order.waybillNumber}</strong>
                  <Copy 
                    className="w-3 h-3 text-slate-400 hover:text-[#2563eb] cursor-pointer" 
                    title="Kopiuj list przewozowy DPD" 
                    onClick={handleCopyWaybill} 
                  />
                </span>
                <button 
                  onClick={() => triggerToast('Trwa eksport pliku XML dla integracji EDI...')}
                  className="bg-[#0f172a] hover:bg-slate-800 text-white font-bold text-[10px] uppercase tracking-wide rounded px-2.5 py-1 cursor-pointer transition-colors border-none"
                >
                  Ekspediuj EDI (XML)
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* Notes Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-100 pb-2.5">
                <ScrollText className="w-4.5 h-4.5 text-[#2563eb]" /> Dyspozycje Magazynowe (VAS)
              </h3>
              
              {isEditingNotes ? (
                <div className="space-y-3 font-sans">
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    className="w-full p-2.5 text-xs text-slate-800 border border-slate-350 bg-white rounded-lg focus:ring-1 focus:ring-blue-500 outline-none h-28 font-medium leading-relaxed"
                    placeholder="Wpisz instrukcje VAS, np. przepakować, dołożyć firmową broszurę, sprawdzić plomby."
                  />
                  <div className="flex justify-end gap-2 select-none">
                    <button
                      onClick={() => setIsEditingNotes(false)}
                      className="px-2.5 py-1 text-[11px] text-slate-500 bg-white border border-slate-300 rounded hover:bg-slate-50 cursor-pointer"
                    >
                      Anuluj
                    </button>
                    <button
                      onClick={handleSaveNotes}
                      className="px-3 py-1 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded cursor-pointer border-none"
                    >
                      Zapisz dyspozycje
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-200 text-xs text-slate-700 leading-relaxed italic min-h-[90px] whitespace-pre-wrap font-medium">
                    {order.internalNotes ? order.internalNotes : 'Brak dyspozycji specjalnych dla pakera (np. brak przepakowania, pakowanie standardowe).'}
                  </div>
                  <button
                    onClick={() => setIsEditingNotes(true)}
                    className="text-[#2563eb] hover:text-blue-700 text-xs font-bold flex items-center gap-1 select-none cursor-pointer bg-transparent border-none outline-none"
                  >
                    <FileEdit className="w-3.5 h-3.5" /> Edytuj dyspozycje specjalne
                  </button>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 pt-3.5 mt-5 text-[11px] text-slate-400 font-mono select-none">
              Ostatnia modyfikacja: <strong className="text-slate-600">{order.internalNotesActor || 'SYSTEM_OS'}</strong>
            </div>
          </div>

          {/* Activity Log Tracker Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <History className="w-4.5 h-4.5 text-[#2563eb]" /> Rejestr Operacji SAP/WMS
            </h3>

            <div className="relative border-l border-slate-200 pl-4 ml-2.5 space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {order.activityHistory.map((act) => (
                <div key={act.id} className="relative text-xs leading-normal">
                  <div className="absolute -left-[23px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#2563eb] border border-white ring-4 ring-slate-50" />
                  <div className="font-bold text-slate-800">{act.title}</div>
                  <div className="text-[10px] text-slate-450 mt-0.5 font-mono">{act.date} • Operator: {act.actor}</div>
                </div>
              ))}

              {order.changeLogs.map((log) => (
                <div key={log.id} className="relative text-xs leading-normal">
                  <div className="absolute -left-[23px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#cbd5e1] border border-white ring-4 ring-slate-50" />
                  <div className="font-bold text-slate-800">{log.title}</div>
                  <p className="text-slate-500 font-medium mt-0.5">{log.description}</p>
                  <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{log.date} • Operator: {log.actor}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Popups & Dialogs Replaced elegantly */}

      {/* Client Edit drawer modal */}
      {isClientModalOpen && (
        <div id="edit-client-modal" className="fixed inset-0 bg-[#020617]/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-[#0f172a] text-white flex justify-between items-center select-none border-b border-slate-800">
              <h3 className="font-extrabold text-sm tracking-tight">Korekta Karty Kontrahenta</h3>
              <button 
                onClick={() => setIsClientModalOpen(false)} 
                className="text-slate-400 hover:text-white transition-colors cursor-pointer text-lg font-bold bg-transparent border-none"
              >✕</button>
            </div>

            <form onSubmit={handleSaveClientDetails} className="p-5 space-y-4 font-sans text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nazwa Odbiorcy / Kontrahent</label>
                <input
                  type="text"
                  required
                  value={editClientName}
                  onChange={(e) => setEditClientName(e.target.value)}
                  className="w-full p-2.5 border border-slate-350 bg-white rounded-lg focus:ring-1 focus:ring-[#2563eb] text-slate-900 outline-none font-semibold text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">E-mail</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full p-2.5 border border-slate-350 bg-white rounded-lg focus:ring-1 focus:ring-[#2563eb] text-slate-900 outline-none font-semibold text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Telefon</label>
                  <input
                    type="text"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full p-2.5 border border-slate-350 bg-white rounded-lg focus:ring-1 focus:ring-[#2563eb] text-slate-900 outline-none font-semibold text-xs font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-6 flex justify-end gap-3 select-none">
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-lg text-xs cursor-pointer bg-white"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-4.5 py-2 bg-[#0f172a] hover:bg-slate-800 text-white font-bold rounded-lg text-xs cursor-pointer shadow-md transition-colors border-none"
                >
                  Zapisz Zmiany
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancellation confirmation modal */}
      {isCancelConfirmOpen && (
        <div id="cancel-confirm-modal" className="fixed inset-0 bg-[#020617]/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-5 space-y-4 font-sans text-xs">
              <div className="flex items-center gap-3.5 border-b border-slate-100 pb-3">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-656">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-red-950">Anulowanie Zamówienia</h4>
                  <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase mt-0.5">Zlecenie: {order.id}</p>
                </div>
              </div>

              <p className="text-slate-600 leading-relaxed font-semibold">
                Czy na pewno chcesz anulować to zamówienie wyjazdowe? Tej operacji nie można wycofać, a przypisane fizycznie stany na stacji pakowania zostaną zwolnione do systemu.
              </p>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 select-none">
                <button
                  onClick={() => setIsCancelConfirmOpen(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-705 font-bold rounded-lg text-xs cursor-pointer bg-white"
                >
                  Nie, wróć
                </button>
                <button
                  onClick={confirmCancelOrder}
                  className="px-4.5 py-2 bg-red-650 hover:bg-red-700 text-white font-bold rounded-lg text-xs cursor-pointer shadow-md transition-colors border-none"
                >
                  Oznacz jako anulowane
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
