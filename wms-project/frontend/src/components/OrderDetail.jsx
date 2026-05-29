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
} from 'lucide-react';

export function OrderDetail({ order, onBack, onUpdateStatus, onAddChangeLog, onUpdateOrder }) {
  const [copied, setCopied] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [noteText, setNoteText] = useState(order.internalNotes || '');

  useEffect(() => {
    setNoteText(order.internalNotes || '');
  }, [order.id, order.internalNotes]);

  const handleCopyWaybill = () => {
    navigator.clipboard.writeText(order.waybillNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStatusChange = (e) => {
    const nextStatus = e.target.value;
    if (nextStatus) {
      onUpdateStatus(order.id, nextStatus);
      onAddChangeLog(
        order.id,
        'Zmiana Statusu',
        `Zmieniono status zamówienia na: ${nextStatus}`,
      );
    }
  };

  const handleSaveNotes = () => {
    if (onUpdateOrder) {
      onUpdateOrder(order.id, { internalNotes: noteText });
    } else {
      order.internalNotes = noteText;
    }
    setIsEditingNotes(false);
    onAddChangeLog(
      order.id,
      'Zaktualizowano notatki',
      'Wprowadzono korektę w notatkach wewnętrznych magazynu',
    );
  };

  const computeTotalItems = () => {
    return order.items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getPolishStatusLabel = (status) => {
    return status;
  };

  const getStatusColorDot = (status) => {
    switch (status) {
      case 'W realizacji':
        return 'bg-[#0058be]';
      case 'Wysłane':
        return 'bg-[#76777d]';
      case 'Oczekujące':
        return 'bg-amber-500';
      case 'Dostarczone':
        return 'bg-green-600';
      case 'Anulowane':
        return 'bg-[#ba1a1a]';
      default:
        return 'bg-purple-600';
    }
  };

  const handlePrintLabel = () => {
    onAddChangeLog(order.id, 'Etykieta wydrukowana', 'Wydrukowano etykietę adresową DPD');
    alert(`Drukowanie etykiety dla zamówienia ${order.id}...`);
  };

  const handleCancelOrder = () => {
    if (confirm('Czy na pewno chcesz anulować to zamówienie?')) {
      onUpdateStatus(order.id, 'CANCELLED');
      onAddChangeLog(order.id, 'Anulowano zamówienie', 'System anulował zlecenie');
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200" id="order-details-pane">
      {}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <button
              onClick={onBack}
              className="text-[#0058be] hover:underline text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Zamówienia
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <h2 className="text-xl font-bold text-[#0b1c30]">Szczegóły Zamówienia</h2>
            <span className="px-2 py-0.5 rounded bg-[#d8e2ff] text-[#001a42] font-mono text-xs border border-[#c6c6cd]/50">
              {order.id}
            </span>
            <span className="px-3 py-1 rounded-full bg-[#dce9ff] text-[#0b1c30] font-semibold text-xs flex items-center gap-1.5 shadow-2xs">
              <span className={`w-2 h-2 rounded-full ${getStatusColorDot(order.status)}`}></span>{' '}
              {getPolishStatusLabel(order.status)}
            </span>

            {}
            <div className="relative inline-block">
              <select
                onChange={handleStatusChange}
                value={order.status}
                className="appearance-none bg-white border border-[#76777d] rounded pl-3 pr-8 py-1 font-semibold text-xs text-[#0b1c30] focus:ring-2 focus:ring-[#0058be] cursor-pointer outline-none"
              >
                <option value="" disabled>
                  Zmień status
                </option>
                <option value="Nowe">Nowe</option>
                <option value="W realizacji">W realizacji</option>
                <option value="Wysłane">Wysłane</option>
                <option value="Dostarczone">Dostarczone</option>
                <option value="Anulowane">Anulowane</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#45464d]">
                <span className="text-xs">&darr;</span>
              </div>
            </div>
          </div>
        </div>

        {}
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={handlePrintLabel}
            className="flex-1 md:flex-none px-4 py-2 border border-[#76777d] bg-white hover:bg-[#eff4ff] text-[#0b1c30] font-semibold text-xs rounded transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
          >
            <Printer className="w-4 h-4 text-[#45464d]" /> Drukuj Etykietę
          </button>
          <button
            onClick={() => {
              const freshName = prompt('Zmień nazwę/firmę klienta:', order.customerName);
              if (freshName) {
                if (onUpdateOrder) {
                  onUpdateOrder(order.id, { customerName: freshName, customer: freshName });
                } else {
                  order.customerName = freshName;
                }
                onAddChangeLog(order.id, 'Aktualizacja kontrahenta', `Zmieniono nazwę na: ${freshName}`);
              }
            }}
            className="flex-1 md:flex-none px-4 py-2 border border-[#76777d] bg-white hover:bg-[#eff4ff] text-[#0b1c30] font-semibold text-xs rounded transition-colors cursor-pointer shadow-2xs"
          >
            Edytuj Zamówienie
          </button>
          <button
            disabled={order.status === 'CANCELLED'}
            onClick={handleCancelOrder}
            className="flex-1 md:flex-none px-4 py-2 border border-[#ba1a1a] text-[#ba1a1a] bg-white hover:bg-[#ffdad6] hover:border-[#ba1a1a]/40 font-semibold text-xs rounded transition-colors cursor-pointer disabled:opacity-40"
          >
            Anuluj
          </button>
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {}
            <div className="bg-white border border-[#c6c6cd] rounded-lg p-5 shadow-xs transition-shadow hover:shadow-sm">
              <h3 className="font-semibold text-sm text-[#0b1c30] mb-4 flex items-center gap-2 border-b border-[#c6c6cd] pb-2">
                <User className="w-[18px] h-[18px] text-[#0058be]" /> Dane Klienta
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="text-[10px] font-semibold text-[#45464d] uppercase mb-1 tracking-wider">
                    Nazwa / Imię i Nazwisko
                  </div>
                  <div className="text-xs font-semibold text-[#0b1c30]">{order.customerName}</div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-[#45464d] uppercase mb-1 tracking-wider">
                    Email
                  </div>
                  <div className="text-xs text-[#0058be] hover:underline cursor-pointer">{order.email}</div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-[#45464d] uppercase mb-1 tracking-wider">
                    Telefon
                  </div>
                  <div className="text-xs font-mono text-[#0b1c30] font-medium">{order.phone}</div>
                </div>
              </div>
            </div>

            {}
            <div className="bg-white border border-[#c6c6cd] rounded-lg p-5 shadow-xs transition-shadow hover:shadow-sm">
              <h3 className="font-semibold text-sm text-[#0b1c30] mb-4 flex items-center gap-2 border-b border-[#c6c6cd] pb-2">
                <Truck className="w-[18px] h-[18px] text-[#0058be]" /> Informacje o Wysyłce
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="text-[10px] font-semibold text-[#45464d] uppercase mb-1 tracking-wider">
                    Adres Dostawy
                  </div>
                  <div className="text-xs text-[#0b1c30] leading-relaxed whitespace-pre-line font-medium">
                    {order.shippingAddress}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] font-semibold text-[#45464d] uppercase mb-1 tracking-wider">
                      Metoda
                    </div>
                    <div className="text-xs font-semibold text-[#0b1c30]">{order.shippingMethod}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold text-[#45464d] uppercase mb-1 tracking-wider">
                      Szacowana Dostawa
                    </div>
                    <div className="text-xs font-mono text-[#0b1c30]">{order.estimatedDelivery}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {}
          <div className="bg-white border border-[#c6c6cd] rounded-lg shadow-xs overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-[#c6c6cd] bg-[#eff4ff] flex justify-between items-center">
              <h3 className="font-semibold text-sm text-[#0b1c30] flex items-center gap-2">
                <Layers className="w-[18px] h-[18px] text-[#0058be]" /> Pozycje Zamówienia
              </h3>
              <span className="text-[10px] font-semibold bg-white border border-[#c6c6cd] px-2.5 py-1 rounded shadow-3xs text-[#0b1c30]">
                Razem sztuk: {computeTotalItems()}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#c6c6cd] bg-[#f8f9ff] text-[11px] text-[#45464d] font-semibold uppercase">
                    <th className="px-4 py-3 w-12 text-center text-xs">Lp.</th>
                    <th className="px-4 py-3 text-xs">SKU</th>
                    <th className="px-4 py-3 text-xs">Produkt</th>
                    <th className="px-4 py-3 text-right text-xs">Ilość</th>
                    <th className="px-4 py-3 text-xs">Strefa</th>
                    <th className="px-4 py-3 text-xs">Status</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-normal text-[#0b1c30] divide-y divide-[#c6c6cd]/30">
                  {order.items.map((item) => (
                    <tr
                      key={item.lp}
                      className="border-b border-[#c6c6cd]/50 hover:bg-[#eff4ff]/40 transition-colors duration-75"
                    >
                      <td className="px-4 py-3 text-center text-[#45464d] font-medium">
                        {item.lp}
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold text-[#0b1c30]">
                        {item.sku}
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#0b1c30]">{item.product}</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-[#0b1c30]">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3">
                        <span className="bg-[#cbdbf5] px-1.5 py-0.5 rounded font-mono text-[11px] shadow-3xs font-medium text-[#0b1c30]">
                          {item.zone}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {item.status === 'Skompletowano' ? (
                          <span className="text-[#0058be] font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-[14px] h-[14px] text-[#0058be]" /> Skompletowano
                          </span>
                        ) : (
                          <span className="text-[#76777d] font-semibold flex items-center gap-1">
                            <Clock className="w-[14px] h-[14px] text-[#76777d]" /> {item.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {}
        <div className="flex flex-col gap-6">
          {}
          <div className="bg-white border border-[#c6c6cd] rounded-lg p-5 shadow-xs transition-shadow hover:shadow-sm">
            <h3 className="font-semibold text-sm text-[#0b1c30] mb-4 flex items-center gap-2 border-b border-[#c6c6cd] pb-2">
              <FileText className="w-[18px] h-[18px] text-[#0058be]" /> Logistyka i Dokumenty
            </h3>
            <div className="space-y-4">
              <div className="p-3 bg-[#f8f9ff] border border-[#c6c6cd] rounded shadow-3xs">
                <div className="text-[10px] font-semibold text-[#45464d] uppercase mb-1 tracking-wider">
                  Numer Listu Przewozowego
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-mono text-xs font-semibold text-[#0b1c30]">
                    {order.waybillNumber}
                  </span>
                  <button
                    onClick={handleCopyWaybill}
                    className="text-[#0058be] hover:text-[#2170e4] p-1 transition-all cursor-pointer"
                    title="Kopiuj numer"
                  >
                    {copied ? (
                      <span className="text-[10px] text-green-600 font-bold">Copied!</span>
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-[#f8f9ff] border border-[#c6c6cd] rounded flex justify-between items-center shadow-3xs">
                <div>
                  <div className="text-[10px] font-semibold text-[#45464d] uppercase mb-1 tracking-wider">
                    List Przewozowy (PDF)
                  </div>
                  <div className="text-[11px] text-[#45464d]">
                    Wygenerowano: {order.waybillPdfDate}
                  </div>
                </div>
                <button
                  onClick={() => alert('Pobieranie dokumentu PDF...')}
                  className="text-[#0058be] hover:underline p-1 cursor-pointer"
                  title="Pobierz PDF"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>

              <div>
                <div className="text-[10px] font-semibold text-[#45464d] uppercase mb-2 tracking-wider">
                  Trasa Kompletacji
                </div>
                <div className="flex gap-2 flex-wrap">
                  {order.pickingZones.map((zone) => (
                    <span
                      key={zone.name}
                      className="px-2.5 py-1 bg-[#dce9ff] border border-[#c6c6cd] rounded font-mono text-[11px] shadow-3xs font-medium text-[#0b1c30]"
                    >
                      {zone.name} ({zone.percentage}%)
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {}
          <div className="bg-[#eff4ff] border border-[#c6c6cd] rounded-lg p-5">
            <h3 className="font-semibold text-sm text-[#0b1c30] mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileEdit className="w-[18px] h-[18px]" /> Notatki Wewnętrzne
              </span>
              {!isEditingNotes ? (
                <button
                  onClick={() => setIsEditingNotes(true)}
                  className="text-xs text-[#0058be] hover:underline cursor-pointer"
                >
                  Edytuj
                </button>
              ) : (
                <button
                  onClick={handleSaveNotes}
                  className="text-xs text-green-600 hover:underline cursor-pointer font-bold"
                >
                  Zapisz
                </button>
              )}
            </h3>

            {isEditingNotes ? (
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="w-full text-xs font-normal text-[#45464d] bg-white p-3 rounded border border-[#c6c6cd] focus:outline-none focus:ring-1 focus:ring-[#0058be]"
                rows={3}
              />
            ) : (
              <p className="text-xs text--[#45464d] italic bg-white p-3 rounded border border-[#c6c6cd] border-dashed leading-relaxed shadow-3xs">
                "{order.internalNotes || 'Brak notatek wewnętrznych.'}"
              </p>
            )}

            <div className="mt-2 text-right text-[10px] font-semibold text-[#76777d]">
              Dodane przez: {order.internalNotesActor}
            </div>
          </div>

          {}
          <div className="bg-white border border-[#c6c6cd] rounded-lg p-5 shadow-xs transition-shadow hover:shadow-sm">
            <h3 className="font-semibold text-sm text-[#0b1c30] mb-4 flex items-center gap-2 border-b border-[#c6c6cd] pb-2">
              <History className="w-[18px] h-[18px] text-[#0058be]" /> Historia aktywności
            </h3>
            <div className="space-y-4">
              {order.activityHistory.length === 0 ? (
                <div className="text-center py-4 text-[#45464d] text-xs">
                  Brak zapisów w osi czasu.
                </div>
              ) : (
                order.activityHistory.map((act, index) => {
                  const isFirst = index === 0;
                  const isLast = index === order.activityHistory.length - 1;
                  return (
                    <div key={act.id} className="relative pl-6">
                      {!isLast && (
                        <div className="absolute left-[7px] top-2 bottom-[-20px] w-[2px] bg-[#c6c6cd]"></div>
                      )}
                      <div
                        className={`absolute left-0 top-1 w-4.5 h-4.5 rounded-full ring-4 ring-white shadow-3xs flex items-center justify-center ${
                          isFirst ? 'bg-[#0058be]' : 'bg-[#cbdbf5]'
                        }`}
                      ></div>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-[#0b1c30] leading-snug">
                          {act.title}
                        </span>
                        <div className="flex justify-between items-center text-[10px] text-[#45464d] mt-1">
                          <span className="font-medium text-[10px]">{act.actor}</span>
                          <span className="font-mono tracking-tight text-[10px]">{act.date}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {}
          <div className="bg-white border border-[#c6c6cd] rounded-lg p-5 shadow-xs transition-shadow hover:shadow-sm">
            <h3 className="font-semibold text-sm text-[#0b1c30] mb-4 flex items-center gap-2 border-b border-[#c6c6cd] pb-2">
              <ScrollText className="w-[18px] h-[18px] text-[#0058be]" /> Logi zmian
            </h3>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {order.changeLogs.length === 0 ? (
                <div className="text-center py-6 text-[#45464d] text-xs">
                  Brak logów modyfikacji dla tego zamówienia.
                </div>
              ) : (
                order.changeLogs.map((log) => (
                  <div key={log.id} className="pb-3 border-b border-[#c6c6cd]/30 last:border-0">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-bold text-[#0b1c30] leading-tight">
                        {log.title}
                      </span>
                      <span className="font-mono text-[10px] text-[#45464d]">
                        {log.date}
                      </span>
                    </div>
                    <p className="text-xs text-[#45464d] leading-relaxed">
                      {log.description}
                    </p>
                    <div className="text-[10px] text-[#76777d] mt-1 italic font-semibold">
                      Aktor: {log.actor}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
