import React, { useState, useEffect, useMemo } from 'react';
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
  Edit2,
  Box,
  Mail,
  Send,
  Globe,
  ExternalLink,
  X,
  Calculator,
  Code
} from 'lucide-react';
import { defaultImages } from '../data/warehouseData';
import { sounds } from './SoundEffects';

export interface OrderItem {
  lp: number;
  sku: string;
  product: string;
  quantity: number;
  zone: string;
  status: string;
  pickedLot?: string;
  expirationDate?: string;
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
  courierNote?: string;
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
  orders?: any[];
}

export function OrderDetail({ order, onBack, onUpdateStatus, onAddChangeLog, onUpdateOrder, orders = [] }: OrderDetailProps) {
  const [copied, setCopied] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [noteText, setNoteText] = useState(order.internalNotes || '');

  const [productImages] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem('wms-product-images');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const customerHistory = useMemo(() => {
    const actualOrders = (orders || []).filter(o => 
      o.id !== order.id && 
      (o.customer === order.customer || o.customerName === order.customerName || (o.email && o.email === order.email))
    ).map(o => ({
      id: o.id,
      date: o.shipmentDate || 'Brak daty',
      amount: o.totalValue || '120.00 PLN',
      shippingMethod: o.shippingMethod || 'DPD',
      status: o.status,
      isMock: false,
      comment: ''
    }));

    const nameHash = (order.customerName || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const mockOrders = [
      {
        id: `ORD-${84000 + (nameHash % 999)}`,
        date: '14.05.2026',
        amount: `${100 + (nameHash % 400)}.00 PLN`,
        shippingMethod: nameHash % 2 === 0 ? 'DHL Express' : 'InPost Paczkomat',
        status: 'Dostarczone',
        isMock: true,
        comment: 'Dostawa standardowa, bez zastrzeżeń.'
      },
      {
        id: `ORD-${79000 + (nameHash % 999)}`,
        date: '28.04.2026',
        amount: `${50 + (nameHash % 150)}.50 PLN`,
        shippingMethod: 'DPD Standard',
        status: nameHash % 3 === 0 ? 'Zwrócone (RMA)' : 'Dostarczone',
        isMock: true,
        comment: nameHash % 3 === 0 ? 'Zwrot z powodu błędnego rozmiaru (VAS).' : 'Dostarczono przed czasem.'
      }
    ];

    const combined = [...actualOrders, ...mockOrders];
    const totalCount = combined.length + 1;
    const returnedCount = combined.filter(o => o.status && o.status.includes('Zwrócone')).length;
    const returnRate = Math.round((returnedCount / totalCount) * 100);

    let riskLevel: 'Niski' | 'Średni' | 'Wysoki' = 'Niski';
    if (returnRate > 40) riskLevel = 'Wysoki';
    else if (returnRate > 15) riskLevel = 'Średni';

    return {
      orders: combined,
      totalCount,
      returnRate,
      riskLevel
    };
  }, [orders, order]);

  const getImage = (sku: string) => {
    return productImages[sku] || defaultImages[sku] || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&q=80';
  };

  // Custom modal inputs instead of prompts
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editClientName, setEditClientName] = useState(order.customerName);
  const [editEmail, setEditEmail] = useState(order.email);
  const [editPhone, setEditPhone] = useState(order.phone);

  // Print & Cancel states
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);

  // ----------------------------------------------------
  // OPTION 91: International CMR Consignment Note Generator (Druk CMR)
  // ----------------------------------------------------
  const [isCmrModalOpen, setIsCmrModalOpen] = useState(false);
  const [cmrCopyType, setCmrCopyType] = useState<'1' | '2' | '3' | '4'>('1');

  // ----------------------------------------------------
  // OPTION 100: Dispatch Email Notification Generator
  // ----------------------------------------------------
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState(`Twoje zamówienie #${order.id} w drodze! Numer listu: ${order.waybillNumber || 'DPD-PL-99214'}`);

  const handleSendEmailNotification = () => {
    sounds.playSuccess();
    onAddChangeLog(order.id, 'Wysłano e-mail do klienta', `Powiadomienie ze statusem wysyłki wysłane na ${order.email}`);
    setIsEmailModalOpen(false);
    triggerToast(`[Opcja 100]: Wysłano e-mail z linkiem do śledzenia przesyłki na adres: ${order.email}!`);
  };

  // ----------------------------------------------------
  // OPTION 93: Zip Code Validator
  // ----------------------------------------------------
  const postalCodeMatch = (order.shippingAddress || '').match(/\b\d{2}-\d{3}\b/);
  const hasValidPolishZip = !!postalCodeMatch;
  const extractedZip = postalCodeMatch ? postalCodeMatch[0] : null;

  // ----------------------------------------------------
  // OPTION 57: Courier Autodetection (Format Listu Przewozowego)
  // ----------------------------------------------------
  const detectedCourier = useMemo(() => {
    const raw = (order.waybillNumber || '').replace(/[\s-]/g, '').toUpperCase();
    if (!raw) return { name: 'Brak numeru', badge: 'bg-slate-100 text-slate-500 border-slate-250', icon: '❓' };
    if (/^6\d{23}$/.test(raw) || raw.length === 24) {
      return { name: 'InPost (Paczkomat / Kurier)', badge: 'bg-amber-100 text-amber-900 border-amber-300', icon: '📦' };
    }
    if (/^0000\d{10}$/.test(raw) || raw.startsWith('DPD') || /^\d{14}$/.test(raw)) {
      return { name: 'DPD Classic / Express', badge: 'bg-red-100 text-red-900 border-red-300', icon: '🔴' };
    }
    if (/^JJD\d+$/.test(raw) || raw.startsWith('DHL') || /^\d{10,11}$/.test(raw)) {
      return { name: 'DHL Express', badge: 'bg-yellow-100 text-yellow-900 border-yellow-300', icon: '🟡' };
    }
    if (/^PX\d+$/.test(raw) || raw.startsWith('00359')) {
      return { name: 'Pocztex / Poczta Polska', badge: 'bg-rose-100 text-rose-900 border-rose-300', icon: '📮' };
    }
    if (/^\d{12}$/.test(raw) || raw.startsWith('FDX')) {
      return { name: 'FedEx Express', badge: 'bg-purple-100 text-purple-900 border-purple-300', icon: '🟣' };
    }
    return { name: 'Przewoźnik Standardowy', badge: 'bg-slate-100 text-slate-800 border-slate-300', icon: '🚚' };
  }, [order.waybillNumber]);

  // ----------------------------------------------------
  // OPTION 69: ISO Country Code Validator
  // ----------------------------------------------------
  const countryValidation = useMemo(() => {
    const addr = (order.shippingAddress || '').toUpperCase();
    if (addr.includes('POLSKA') || addr.includes(', PL') || addr.endsWith(' PL') || /\b\d{2}-\d{3}\b/.test(addr)) {
      return { code: 'PL', name: 'Polska', flag: '🇵🇱', isEu: true, standardZip: 'Format PL (XX-XXX)' };
    }
    if (addr.includes('GERMANY') || addr.includes('NIEMCY') || addr.includes(', DE') || addr.endsWith(' DE')) {
      return { code: 'DE', name: 'Niemcy', flag: '🇩🇪', isEu: true, standardZip: 'Format DE (5 cyfr)' };
    }
    if (addr.includes('CZECH') || addr.includes('CZECHY') || addr.includes(', CZ')) {
      return { code: 'CZ', name: 'Czechy', flag: '🇨🇿', isEu: true, standardZip: 'Format CZ (XXX XX)' };
    }
    if (addr.includes('SLOVAKIA') || addr.includes('SŁOWACJA') || addr.includes(', SK')) {
      return { code: 'SK', name: 'Słowacja', flag: '🇸🇰', isEu: true, standardZip: 'Format SK (XXX XX)' };
    }
    if (addr.includes('FRANCE') || addr.includes('FRANCJA') || addr.includes(', FR')) {
      return { code: 'FR', name: 'Francja', flag: '🇫🇷', isEu: true, standardZip: 'Format FR (5 cyfr)' };
    }
    return { code: 'PL', name: 'Polska (Domyślny)', flag: '🇵🇱', isEu: true, standardZip: 'Kraj UE' };
  }, [order.shippingAddress]);

  // ----------------------------------------------------
  // OPTION 58: Zebra ZPL II Label Generator
  // ----------------------------------------------------
  const [isZplModalOpen, setIsZplModalOpen] = useState(false);
  const zplGeneratedCode = useMemo(() => {
    const waybill = order.waybillNumber || 'DPD-PL-99214';
    const recipient = (order.customerName || 'Klient').replace(/[^a-zA-Z0-9\s]/g, '');
    const addr = (order.shippingAddress || 'ul. Logistyczna 1, Warszawa').replace(/[^a-zA-Z0-9\s,.-]/g, '');
    const totalQty = (order.items || []).reduce((s, i) => s + (i.quantity || 0), 0);
    const weight = (totalQty * 0.35 + 0.4).toFixed(2);

    return `^XA
^PW800
^LL1200
^FO50,40^ADN,36,20^FDWMS LOGISTICS DC-1 WARSZAWA^FS
^FO50,90^GB700,2,2^FS
^FO50,110^ADN,18,10^FDZLECENIE WYJAZDOWE: ${order.id}^FS
^FO50,140^ADN,22,12^FDODBIORCA: ${recipient}^FS
^FO50,175^ADN,18,10^FDADRES: ${addr}^FS
^FO50,210^ADN,18,10^FDKURIER: ${order.shippingMethod || 'DPD'} | PACZKA 1/1 | WAGA: ${weight} KG^FS
^FO50,250^GB700,2,2^FS
^FO120,290^BY3,3,110^BCN,110,Y,N,N^FD${waybill}^FS
^FO50,450^GB700,2,2^FS
^FO50,470^ADN,18,10^FDILOSC POZYCJI: ${(order.items || []).length} SKU | LACZNIE SZTUK: ${totalQty}^FS
^FO50,500^ADN,14,8^FDWYGENEROWANO PRZEZ WMS OPERATOR: ${new Date().toLocaleDateString('pl-PL')}^FS
^XZ`;
  }, [order]);

  const handleCopyZpl = () => {
    navigator.clipboard.writeText(zplGeneratedCode);
    triggerToast('[Opcja 58]: Skopiowano surowy kod Zebra ZPL II do schowka!');
  };

  const handleDownloadZpl = () => {
    const blob = new Blob([zplGeneratedCode], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `etykieta_${order.id}.zpl`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('[Opcja 58]: Pobrano plik etykiety termicznej .zpl!');
  };

  // ----------------------------------------------------
  // OPTION 64: Dimensional Weight Calculator (Waga Gabarytowa)
  // ----------------------------------------------------
  const [isDimWeightModalOpen, setIsDimWeightModalOpen] = useState(false);
  const [dimLength, setDimLength] = useState(35);
  const [dimWidth, setDimWidth] = useState(25);
  const [dimHeight, setDimHeight] = useState(15);
  const actualOrderWeight = useMemo(() => {
    const totalQty = (order.items || []).reduce((s, i) => s + (i.quantity || 0), 0);
    return Math.round((totalQty * 0.35 + 0.4) * 100) / 100;
  }, [order.items]);

  const dimVolumetricWeight = useMemo(() => {
    return Math.round(((dimLength * dimWidth * dimHeight) / 5000) * 100) / 100;
  }, [dimLength, dimWidth, dimHeight]);

  const billableWeight = Math.max(actualOrderWeight, dimVolumetricWeight);

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
      case 'Do kompletacji':
        return 'bg-amber-500';
      case 'W kompletacji':
        return 'bg-purple-600';
      case 'Oczekuje na pakowanie':
        return 'bg-teal-600';
      case 'Spakowane':
        return 'bg-indigo-600';
      case 'Wysłane':
        return 'bg-emerald-600';
      case 'Dostarczone':
        return 'bg-emerald-700';
      case 'Oczekujące':
      default:
        return 'bg-slate-500';
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
                <option value="Oczekujące">Oczekujące</option>
                <option value="Do kompletacji">Do kompletacji</option>
                <option value="W kompletacji">W kompletacji</option>
                <option value="Oczekuje na pakowanie">Oczekuje na pakowanie</option>
                <option value="Spakowane">Spakowane</option>
                <option value="Wysłane">Wysłane</option>
                <option value="Dostarczone">Dostarczone</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-slate-450">
                <span className="text-[10px]">&#9662;</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto shrink-0 select-none">
          <button
            onClick={() => {
              sounds.playBeep();
              setIsCmrModalOpen(true);
            }}
            className="flex-1 md:flex-none px-3.5 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
            title="Wygeneruj międzynarodowy list przewozowy CMR"
          >
            <FileText className="w-4 h-4 text-rose-600" /> 91. Druk CMR
          </button>

          <button
            onClick={() => {
              sounds.playBeep();
              setIsEmailModalOpen(true);
            }}
            className="flex-1 md:flex-none px-3.5 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
            title="Generuj i wyślij e-mail z linkiem do śledzenia przesyłki"
          >
            <Mail className="w-4 h-4 text-sky-600" /> 100. E-mail Klienta
          </button>

          <button
            onClick={() => {
              sounds.playBeep();
              setIsZplModalOpen(true);
            }}
            className="flex-1 md:flex-none px-3.5 py-2 border border-purple-200 bg-purple-50/50 hover:bg-purple-100 text-purple-800 font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
            title="Podgląd i pobieranie kodu ZPL II dla przemysłowych drukarek etykiet Zebra"
          >
            <Code className="w-4 h-4 text-purple-600" /> 58. ZPL Zebra
          </button>

          <button
            onClick={() => {
              sounds.playBeep();
              setIsDimWeightModalOpen(true);
            }}
            className="flex-1 md:flex-none px-3.5 py-2 border border-amber-200 bg-amber-50/50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
            title="Kalkulator wagi gabarytowej i porównanie z wagą rzeczywistą przesyłki"
          >
            <Calculator className="w-4 h-4 text-amber-600" /> 64. Waga Gabarytowa
          </button>

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

                  {/* OPTION 93: ZIP CODE VALIDATOR BADGE */}
                  <div className="mt-1.5">
                    {hasValidPolishZip ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        93. Format Kodu PL poprawny: <strong>{extractedZip}</strong>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-250">
                        <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                        93. Brak standardowego kodu PL (XX-XXX) — sprawdź przed wydrukiem etykiety!
                      </span>
                    )}
                  </div>
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

                {/* OPTION 57 & OPTION 69: Courier Recognition & Country validation */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2.5 border-t border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">57. Kurier (z listu)</span>
                    <span className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      <Truck className="w-3 h-3 text-indigo-600 shrink-0" />
                      {detectedCourier}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">69. Kraj doręczenia</span>
                    <span className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                      <span className="text-xs">{countryValidation.flag}</span>
                      <strong>{countryValidation.code}</strong> - {countryValidation.name}
                    </span>
                  </div>
                </div>
                {order.binId && (
                  <div className="pt-3 border-t border-slate-100 mt-3 flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Przypisany pojemnik</span>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-blue-200 bg-blue-50/50 text-[#0052cc] font-mono text-[11px] font-black tracking-wide select-none">
                        <Box className="w-3.5 h-3.5 text-blue-500" />
                        {order.binId}
                      </span>
                    </div>
                  </div>
                )}
                {order.courierNote && (
                  <div className="pt-3 border-t border-slate-100 mt-3 flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Instrukcja dla kuriera</span>
                    <p className="text-xs text-slate-800 font-medium italic mt-0.5 bg-slate-50 border border-slate-200 p-2.5 rounded-lg whitespace-pre-wrap">{order.courierNote}</p>
                  </div>
                )}
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
                        <td className="py-3 px-4 text-slate-900 font-medium">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded overflow-hidden border border-slate-200 bg-slate-50 shrink-0 select-none flex items-center justify-center">
                              {getImage(item.sku) ? (
                                <img src={getImage(item.sku)} alt={item.product || 'Artykuł WMS'} className="w-full h-full object-cover" />
                              ) : (
                                <Box className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span>{item.product || 'Artykuł WMS'}</span>
                              {item.pickedLot && (
                                <span className="text-[10px] text-slate-450 font-mono mt-0.5">
                                  Partia: <strong className="text-slate-600">{item.pickedLot}</strong>
                                  {item.expirationDate && (
                                    <> (Ważność: <span className="text-amber-600">{item.expirationDate}</span>)</>
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
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

          {/* Customer Delivery History Timeline */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <History className="w-4.5 h-4.5 text-blue-650" /> Historia wysyłek & Profil ryzyka
            </h3>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-2 text-center select-none">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Suma zamówień</span>
                <strong className="text-sm font-black text-slate-800 font-mono mt-0.5 block">{customerHistory.totalCount}</strong>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Wskaźnik zwrotów</span>
                <strong className={`text-sm font-black font-mono mt-0.5 block ${
                  customerHistory.returnRate > 30 ? 'text-red-600' : 'text-slate-800'
                }`}>{customerHistory.returnRate}%</strong>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Poziom ryzyka</span>
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase mt-1 ${
                  customerHistory.riskLevel === 'Wysoki' ? 'bg-red-50 text-red-750 border border-red-200' :
                  customerHistory.riskLevel === 'Średni' ? 'bg-amber-50 text-amber-700 border border-amber-250' :
                  'bg-emerald-50 text-emerald-700 border border-emerald-250'
                }`}>{customerHistory.riskLevel}</span>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
              {/* Current active order */}
              <div className="relative pl-6 border-l-2 border-blue-500 pb-1 text-xs">
                <div className="absolute -left-[6.5px] top-1.5 w-3 h-3 rounded-full bg-blue-500 border border-white" />
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-extrabold text-slate-900">BIEŻĄCE ZLECENIE ({order.id})</span>
                    <span className="text-[10px] text-slate-450 block font-mono mt-0.5">{order.estimatedDelivery || 'W realizacji'}</span>
                  </div>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[8.5px] uppercase tracking-wider">{order.status}</span>
                </div>
              </div>

              {/* Past orders */}
              {customerHistory.orders.map((prevOrder, idx) => {
                let statusColor = 'bg-slate-100 text-slate-600 border border-slate-250';
                let leftLineColor = 'border-slate-200';
                let dotColor = 'bg-slate-350';

                if (prevOrder.status.includes('Dostarczone') || prevOrder.status.includes('Wysłane') || prevOrder.status.includes('Gotowe')) {
                  statusColor = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
                  leftLineColor = 'border-slate-200';
                  dotColor = 'bg-emerald-500';
                } else if (prevOrder.status.includes('Zwrócone') || prevOrder.status.includes('RMA')) {
                  statusColor = 'bg-red-50 text-red-700 border border-red-200';
                  leftLineColor = 'border-slate-200';
                  dotColor = 'bg-red-500';
                }

                return (
                  <div key={prevOrder.id || idx} className={`relative pl-6 border-l-2 ${leftLineColor} pb-1 text-xs`}>
                    <div className={`absolute -left-[6.5px] top-1.5 w-3 h-3 rounded-full ${dotColor} border border-white`} />
                    <div className="flex justify-between items-start gap-1">
                      <div>
                        <span className="font-bold text-slate-800">{prevOrder.id}</span>
                        <span className="text-[10px] text-slate-405 font-mono block mt-0.5">{prevOrder.date} • {prevOrder.shippingMethod}</span>
                      </div>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded font-bold text-[8.5px] uppercase tracking-wider shrink-0 ${statusColor}`}>
                        {prevOrder.status}
                      </span>
                    </div>
                    {prevOrder.comment && (
                      <p className="text-[10px] text-slate-500 leading-normal italic mt-1.5 bg-slate-50/50 p-1.5 rounded border border-slate-100">{prevOrder.comment}</p>
                    )}
                  </div>
                );
              })}
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

      {/* OPTION 91: International CMR Consignment Note Modal */}
      {isCmrModalOpen && (
        <div id="cmr-print-modal" className="fixed inset-0 bg-[#020617]/75 z-50 flex items-center justify-center p-3 md:p-6 overflow-y-auto">
          <div className="bg-white rounded-xl border border-slate-200 w-full max-w-4xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 my-auto flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold tracking-tight">Międzynarodowy Samochodowy List Przewozowy (CMR)</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono font-bold">OPCJA 91</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Standard Konwencji Genewskiej CMR z 19 maja 1956 r. • Zlecenie: {order.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsCmrModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Copy selector bar */}
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Wybór egzemplarza:</span>
                <div className="inline-flex rounded-lg border border-slate-300 bg-white p-1 shadow-xs text-xs font-semibold">
                  <button
                    onClick={() => setCmrCopyType('1')}
                    className={`px-3 py-1 rounded text-xs transition-colors ${cmrCopyType === '1' ? 'bg-red-600 text-white shadow-xs font-bold' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    1. Nadawca (Czerwony)
                  </button>
                  <button
                    onClick={() => setCmrCopyType('2')}
                    className={`px-3 py-1 rounded text-xs transition-colors ${cmrCopyType === '2' ? 'bg-blue-600 text-white shadow-xs font-bold' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    2. Odbiorca (Niebieski)
                  </button>
                  <button
                    onClick={() => setCmrCopyType('3')}
                    className={`px-3 py-1 rounded text-xs transition-colors ${cmrCopyType === '3' ? 'bg-emerald-600 text-white shadow-xs font-bold' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    3. Przewoźnik (Zielony)
                  </button>
                  <button
                    onClick={() => setCmrCopyType('4')}
                    className={`px-3 py-1 rounded text-xs transition-colors ${cmrCopyType === '4' ? 'bg-slate-800 text-white shadow-xs font-bold' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    4. Administracja (Czarny)
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-xs cursor-pointer transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" /> Drukuj CMR
                </button>
              </div>
            </div>

            {/* Document sheet preview */}
            <div className="p-5 overflow-y-auto flex-1 bg-slate-100/70">
              <div className={`bg-white border-2 rounded-lg p-6 shadow-md max-w-3xl mx-auto font-sans text-xs ${
                cmrCopyType === '1' ? 'border-red-400' :
                cmrCopyType === '2' ? 'border-blue-400' :
                cmrCopyType === '3' ? 'border-emerald-400' : 'border-slate-400'
              }`}>
                {/* Header ribbon of the CMR copy */}
                <div className={`py-1.5 px-3 mb-4 rounded text-white text-[11px] font-black uppercase tracking-wider flex justify-between items-center ${
                  cmrCopyType === '1' ? 'bg-red-600' :
                  cmrCopyType === '2' ? 'bg-blue-600' :
                  cmrCopyType === '3' ? 'bg-emerald-600' : 'bg-slate-800'
                }`}>
                  <span>
                    {cmrCopyType === '1' && 'EGZEMPLARZ 1 / COPY 1 / EXEMPLAIRE 1 — DLA NADAWCY (FOR SENDER)'}
                    {cmrCopyType === '2' && 'EGZEMPLARZ 2 / COPY 2 / EXEMPLAIRE 2 — DLA ODBIORCY (FOR CONSIGNEE)'}
                    {cmrCopyType === '3' && 'EGZEMPLARZ 3 / COPY 3 / EXEMPLAIRE 3 — DLA PRZEWOŹNIKA (FOR CARRIER)'}
                    {cmrCopyType === '4' && 'EGZEMPLARZ 4 / COPY 4 / EXEMPLAIRE 4 — DO AKT ADMINISTRACYJNYCH'}
                  </span>
                  <span className="font-mono">CMR-{order.id}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 border border-slate-300">
                  {/* Box 1: Sender */}
                  <div className="p-2.5 border-b border-r border-slate-300">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">1. Nadawca (nazwisko lub nazwa, adres, kraj) / Sender</div>
                    <p className="font-bold text-slate-900 mt-1">WMS LOGISTICS SP. Z O.O.</p>
                    <p className="text-slate-600 text-[11px]">Centrum Dystrybucyjne DC-1</p>
                    <p className="text-slate-600 text-[11px]">ul. Magazynowa 12, 02-222 Warszawa</p>
                    <p className="text-slate-500 font-mono text-[10px]">POLSKA / POLAND (NIP: PL5210002233)</p>
                  </div>

                  {/* Box 2: Consignee */}
                  <div className="p-2.5 border-b border-slate-300">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">2. Odbiorca (nazwisko lub nazwa, adres, kraj) / Consignee</div>
                    <p className="font-bold text-slate-900 mt-1">{order.customerName}</p>
                    <p className="text-slate-600 text-[11px]">{order.shippingAddress}</p>
                    <p className="text-slate-500 font-mono text-[10px]">Tel: {order.phone} • E-mail: {order.email}</p>
                  </div>

                  {/* Box 3: Place of Delivery */}
                  <div className="p-2.5 border-b border-r border-slate-300">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">3. Miejsce przeznaczenia (miejscowość, kraj) / Place of delivery</div>
                    <p className="font-semibold text-slate-800 mt-1">{order.shippingAddress}</p>
                  </div>

                  {/* Box 4: Place and Date of taking over */}
                  <div className="p-2.5 border-b border-slate-300">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">4. Miejsce i data załadowania / Place & date of taking over</div>
                    <p className="font-semibold text-slate-800 mt-1">Warszawa DC-1, {new Date().toLocaleDateString('pl-PL')}</p>
                  </div>

                  {/* Box 5: Documents attached */}
                  <div className="p-2.5 border-b border-r border-slate-300 col-span-2 bg-slate-50/50">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">5. Załączone dokumenty / Documents attached</div>
                    <p className="font-mono text-slate-700 mt-0.5">Faktura WZ/2026/{order.id.replace('ORD-', '')}, Specyfikacja towarowa, Świadectwo Fitosanitarne WE</p>
                  </div>

                  {/* Box 6-12: Goods description table */}
                  <div className="col-span-2 p-2.5 border-b border-slate-300">
                    <div className="text-[10px] font-bold text-slate-500 uppercase mb-2">6-12. Cechy, ilość sztuk, sposób opakowania, rodzaj towaru / Marks, quantity, description of goods</div>
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-[10px] text-slate-500 uppercase">
                          <th className="py-1">Poz.</th>
                          <th className="py-1">SKU / Kod</th>
                          <th className="py-1">Nazwa asortymentu</th>
                          <th className="py-1 text-right">Ilość szt.</th>
                          <th className="py-1 text-right">Waga szac.</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[11px]">
                        {(order.items || []).map((it, idx) => (
                          <tr key={idx}>
                            <td className="py-1 text-slate-400 font-mono">{idx + 1}</td>
                            <td className="py-1 font-mono font-bold text-slate-700">{it.sku}</td>
                            <td className="py-1 text-slate-800">{it.product}</td>
                            <td className="py-1 text-right font-bold text-slate-900">{it.quantity} szt.</td>
                            <td className="py-1 text-right text-slate-500 font-mono">{(it.quantity * 0.25).toFixed(2)} kg</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="mt-2 pt-2 border-t border-slate-200 flex justify-between text-[11px] font-bold text-slate-800">
                      <span>Łączna liczba jednostek: {(order.items || []).reduce((acc, it) => acc + (it.quantity || 0), 0)} szt.</span>
                      <span>Waga brutto całości: {((order.items || []).reduce((acc, it) => acc + (it.quantity || 0), 0) * 0.25 + 0.4).toFixed(2)} kg (1 karton/paczka)</span>
                    </div>
                  </div>

                  {/* Box 13: Sender instructions */}
                  <div className="p-2.5 border-b border-r border-slate-300">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">13. Instrukcje nadawcy / Sender's instructions</div>
                    <p className="text-slate-700 mt-1">Przesyłka wrażliwa na wilgoć i ujemne temperatury. Transport w temperaturze kontrolowanej +5°C do +18°C.</p>
                  </div>

                  {/* Box 16: Carrier */}
                  <div className="p-2.5 border-b border-slate-300">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">16. Przewoźnik / Carrier</div>
                    <p className="font-bold text-slate-900 mt-1">{order.shippingMethod || 'DPD International Freight / Raben'}</p>
                    <p className="text-slate-600 font-mono text-[10px]">Numer listu: {order.waybillNumber || 'DPD-PL-99214-CMR'}</p>
                  </div>

                  {/* Signatures */}
                  <div className="p-3 border-r border-slate-300 flex flex-col justify-between h-24">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">22. Podpis i stempel nadawcy</div>
                    <div className="border-t border-dashed border-slate-300 pt-1 text-[10px] text-slate-400 text-center">WMS Expedition Center DC-1</div>
                  </div>

                  <div className="p-3 border-r border-slate-300 flex flex-col justify-between h-24">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">23. Podpis i stempel przewoźnika</div>
                    <div className="border-t border-dashed border-slate-300 pt-1 text-[10px] text-slate-400 text-center">{order.shippingMethod || 'Kierowca / Przewoźnik'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsCmrModalOpen(false)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-lg text-xs cursor-pointer"
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OPTION 100: Dispatch Email Notification Generator Modal */}
      {isEmailModalOpen && (
        <div id="email-preview-modal" className="fixed inset-0 bg-[#020617]/75 z-50 flex items-center justify-center p-3 md:p-6 overflow-y-auto">
          <div className="bg-white rounded-xl border border-slate-200 w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 my-auto flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold tracking-tight">Powiadomienie E-mail o Wysyłce Zamówienia</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">OPCJA 100</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Generowanie wiadomości transakcyjnej z bezpośrednim linkiem śledzenia do kuriera</p>
                </div>
              </div>
              <button 
                onClick={() => setIsEmailModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Email form controls */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3 shrink-0 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Adres Odbiorcy:</label>
                  <input
                    type="text"
                    readOnly
                    value={order.email || 'klient@example.pl'}
                    className="w-full p-2 border border-slate-300 bg-white rounded-lg text-slate-800 font-mono font-medium outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Przewoźnik / Nr listu:</label>
                  <input
                    type="text"
                    readOnly
                    value={`${order.shippingMethod || 'DPD'} — ${order.waybillNumber || 'DPD-PL-99214'}`}
                    className="w-full p-2 border border-slate-300 bg-white rounded-lg text-slate-800 font-mono font-medium outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Temat Wiadomości:</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full p-2 border border-slate-350 bg-white rounded-lg text-slate-900 font-semibold outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Live Email HTML Preview */}
            <div className="p-4 overflow-y-auto flex-1 bg-slate-100/70">
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden text-xs max-w-xl mx-auto font-sans">
                {/* Email Header Banner */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-5 text-white text-center">
                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Truck className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-base font-extrabold">Twoja paczka jest w drodze! 📦</h4>
                  <p className="text-xs text-emerald-100 mt-1">Zamówienie #{order.id} zostało przekazane kurierowi.</p>
                </div>

                {/* Email Body */}
                <div className="p-5 space-y-4 text-slate-700">
                  <p>Cześć <strong className="text-slate-900">{order.customerName}</strong>,</p>
                  <p className="leading-relaxed">
                    Mamy świetną wiadomość! Twoje zamówienie zostało spakowane i przekazane kurierowi <strong>{order.shippingMethod || 'DPD'}</strong>.
                  </p>

                  {/* Tracking Card in Email */}
                  <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-lg text-center space-y-2">
                    <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Numer listu przewozowego:</p>
                    <p className="text-sm font-mono font-black text-emerald-950 tracking-wider">{order.waybillNumber || 'DPD-PL-99214'}</p>
                    <a
                      href={`https://track.dpd.com.pl/parcelStatus.aspx?trackingNumber=${order.waybillNumber || 'DPD-PL-99214'}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-xs transition-colors no-underline cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Śledź przesyłkę online
                    </a>
                  </div>

                  {/* Items summary */}
                  <div>
                    <h5 className="font-bold text-slate-900 mb-2 border-b border-slate-100 pb-1">Zawartość przesyłki:</h5>
                    <div className="space-y-1.5">
                      {(order.items || []).map((it, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs py-1 border-b border-slate-50">
                          <span className="text-slate-800">{it.product} <span className="text-slate-400 font-mono">({it.sku})</span></span>
                          <span className="font-bold text-slate-900">{it.quantity} szt.</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Delivery address */}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-[11px]">
                    <span className="font-bold text-slate-700 block mb-0.5">Adres dostawy:</span>
                    <span className="text-slate-600">{order.shippingAddress}</span>
                  </div>

                  <p className="text-slate-500 text-[11px] pt-2">
                    Pozdrawiamy serdecznie,<br />
                    <strong>Zespół WMS Logistics</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsEmailModalOpen(false)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-lg text-xs cursor-pointer"
              >
                Anuluj
              </button>
              <button
                type="button"
                onClick={handleSendEmailNotification}
                className="inline-flex items-center gap-1.5 px-4.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-md transition-colors cursor-pointer border-none"
              >
                <Send className="w-3.5 h-3.5" /> Wyślij E-mail do Klienta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* OPTION 58: ZEBRA ZPL II MODAL                         */}
      {/* ---------------------------------------------------- */}
      {isZplModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-150 flex flex-col max-h-[90vh]">
            <div className="p-4 bg-purple-900 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-purple-300" />
                <h3 className="font-bold text-sm tracking-wide">58. Generator Kodu Zebra ZPL II</h3>
              </div>
              <button
                onClick={() => setIsZplModalOpen(false)}
                className="p-1 rounded-lg hover:bg-purple-800 text-purple-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 flex items-start gap-2">
                <Printer className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Etykieta termiczna 100x150 mm (ZPL II Code 128)</p>
                  <p className="text-purple-700 mt-0.5">
                    Kod gotowy do bezpośredniego przesłania przez RAW TCP/IP (port 9100) lub sterownik Zebra Generic Text na drukarki ZT411 / ZD421.
                  </p>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-bold text-slate-700 font-mono">Surowy kod rozkazowy ZPL:</span>
                  <span className="text-[10px] text-slate-400 font-mono">800x1200 dots (203 DPI)</span>
                </div>
                <pre className="p-3.5 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-xl overflow-x-auto max-h-64 border border-slate-800 select-all leading-relaxed">
                  {zplGeneratedCode}
                </pre>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1 font-mono">
                <div>• Zlecenie: <strong>{order.id}</strong></div>
                <div>• Kod kreskowy Code128: <strong>{order.waybillNumber || 'DPD-PL-99214'}</strong></div>
                <div>• Odbiorca: <strong>{order.customerName}</strong></div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsZplModalOpen(false)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-lg text-xs cursor-pointer"
              >
                Zamknij
              </button>
              <button
                type="button"
                onClick={handleCopyZpl}
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-purple-300 bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold rounded-lg text-xs transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" /> Kopiuj kod ZPL
              </button>
              <button
                type="button"
                onClick={handleDownloadZpl}
                className="inline-flex items-center gap-1.5 px-4.5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs shadow-md transition-colors cursor-pointer border-none"
              >
                <Download className="w-3.5 h-3.5" /> Pobierz plik .zpl
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* OPTION 64: DIMENSIONAL WEIGHT CALCULATOR MODAL       */}
      {/* ---------------------------------------------------- */}
      {isDimWeightModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-150 flex flex-col max-h-[90vh]">
            <div className="p-4 bg-amber-600 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-amber-200" />
                <h3 className="font-bold text-sm tracking-wide">64. Kalkulator Wagi Gabarytowej (IATA / Kurierzy)</h3>
              </div>
              <button
                onClick={() => setIsDimWeightModalOpen(false)}
                className="p-1 rounded-lg hover:bg-amber-700 text-amber-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <p className="text-xs text-slate-600">
                W logistyce kurierskiej (DPD, DHL, InPost) opłata naliczana jest od wyższej wartości: wagi rzeczywistej vs wagi gabarytowej według wzoru: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono font-bold text-slate-800">(Dł x Szer x Wys) / 5000</code>.
              </p>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Długość [cm]</label>
                  <input
                    type="number"
                    min="1"
                    value={dimLength}
                    onChange={(e) => setDimLength(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-800 text-center focus:outline-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Szerokość [cm]</label>
                  <input
                    type="number"
                    min="1"
                    value={dimWidth}
                    onChange={(e) => setDimWidth(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-800 text-center focus:outline-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Wysokość [cm]</label>
                  <input
                    type="number"
                    min="1"
                    value={dimHeight}
                    onChange={(e) => setDimHeight(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-800 text-center focus:outline-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Waga rzeczywista</span>
                  <span className="text-lg font-black text-slate-800 font-mono">{actualOrderWeight} kg</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Suma z pozycji SKU</span>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block font-mono">Waga gabarytowa (V)</span>
                  <span className="text-lg font-black text-amber-900 font-mono">{dimVolumetricWeight} kg</span>
                  <span className="text-[10px] text-amber-700 block mt-0.5">Dł×Szer×Wys / 5000</span>
                </div>
              </div>

              <div className={`p-4 rounded-xl border flex items-center justify-between ${
                dimVolumetricWeight > actualOrderWeight 
                  ? 'bg-rose-50 border-rose-200 text-rose-900' 
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider block">Waga taryfowa (rozliczeniowa):</span>
                  <p className="text-xl font-black font-mono mt-0.5">{billableWeight} kg</p>
                </div>
                <div className="text-right text-xs">
                  {dimVolumetricWeight > actualOrderWeight ? (
                    <span className="inline-flex items-center gap-1 font-bold text-rose-700">
                      <AlertTriangle className="w-4 h-4" /> Uwaga: dopłata gabarytowa!
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                      <Check className="w-4 h-4" /> Rozliczenie wg wagi rzeczywistej
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsDimWeightModalOpen(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg text-xs cursor-pointer border-none shadow-xs"
              >
                Zamknij kalkulator
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
