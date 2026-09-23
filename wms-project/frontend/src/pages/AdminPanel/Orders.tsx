import React, { useState } from 'react';
import { Download, Plus, Filter, ChevronLeft, ChevronRight, CheckSquare, Square, MoreVertical, Search, CalendarRange, AlertCircle, StickyNote, Copy, Check, Sparkles, Clock, Star, CheckCircle2, RotateCcw, ShieldCheck, X, Box, ArrowRight, Truck } from 'lucide-react';
import { OrderDetail } from '../../components/OrderDetail';
import { useDebounce } from '../../hooks/useDebounce';
import { sounds } from '../../components/SoundEffects';
import { Product } from '../../services/inventoryApi';
import { RmaReturn, ConditionGrade, INITIAL_RMA_RETURNS } from '../../data/warehouseData';

const polishMonthMap: Record<string, number> = {
    'Sty': 0, 'Lut': 1, 'Mar': 2, 'Kwi': 3, 'Maj': 4, 'Cze': 5,
    'Lip': 6, 'Sie': 7, 'Wrz': 8, 'Paź': 9, 'Lis': 10, 'Gru': 11
};

const getTodayDateStr = () => {
    const d = new Date();
    const months = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'];
    return `${d.getDate()} ${months[d.getMonth()]}`;
};

const isDateWithinLastNDays = (dateStr: string, n: number) => {
    if (!dateStr || dateStr === 'Nieustalony' || dateStr === 'Ukończono') return false;

    const match = dateStr.match(/^(\d+)\s+([a-zA-ZáćęłńóśźżĄĆĘŁŃÓŚŹŻ]{3})/);
    if (!match) return false;

    const day = parseInt(match[1]);
    const monthStr = match[2];
    const month = polishMonthMap[monthStr];
    if (month === undefined) return false;

    const d = new Date();
    const orderDate = new Date(d.getFullYear(), month, day);

    const diffTime = Math.abs(d.getTime() - orderDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays <= n;
};

const getStatusLabel = (status: string) => {
    return status;
};

const getStatusBadgeStyles = (status: string) => {
    switch (status) {
        case 'Do kompletacji':
            return {
                badge: 'bg-amber-50 text-amber-700 border-amber-250',
                dot: 'bg-amber-500'
            };
        case 'W kompletacji':
            return {
                badge: 'bg-purple-50 text-purple-705 border-purple-200 animate-pulse',
                dot: 'bg-purple-600'
            };
        case 'Oczekuje na pakowanie':
            return {
                badge: 'bg-teal-50 text-teal-700 border-teal-200',
                dot: 'bg-teal-600'
            };
        case 'Spakowane':
            return {
                badge: 'bg-indigo-50 text-indigo-705 border-indigo-200',
                dot: 'bg-indigo-600'
            };
        case 'Wysłane':
            return {
                badge: 'bg-emerald-50 text-emerald-700 border-emerald-250',
                dot: 'bg-emerald-600'
            };
        case 'Dostarczone':
            return {
                badge: 'bg-emerald-100 text-emerald-850 border-emerald-300',
                dot: 'bg-emerald-700'
            };
        case 'Oczekujące':
        default:
            return {
                badge: 'bg-slate-50 text-slate-700 border-slate-205',
                dot: 'bg-slate-500'
            };
    }
};

const getPageNumbers = (currentPage: number, totalPages: number) => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) {
            pages.push(i);
        }
    } else {
        if (currentPage <= 4) {
            for (let i = 1; i <= 5; i++) {
                pages.push(i);
            }
            pages.push('...');
            pages.push(totalPages);
        } else if (currentPage >= totalPages - 3) {
            pages.push(1);
            pages.push('...');
            for (let i = totalPages - 4; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            pages.push(1);
            pages.push('...');
            pages.push(currentPage - 1);
            pages.push(currentPage);
            pages.push(currentPage + 1);
            pages.push('...');
            pages.push(totalPages);
        }
    }
    return pages;
};

interface OrdersProps {
    orders: any[];
    products: Product[];
    onAddOrder: (newOrder: any) => void;
    onUpdateOrder: (id: string, fields: any) => void;
    onUpdateOrderStatus: (id: string, status: string) => void;
    onAddOrderChangeLog: (id: string, title: string, description: string) => void;
    highlightedOrderId?: string | null;
}

export default function Orders({
    orders,
    products,
    onAddOrder,
    onUpdateOrder,
    onUpdateOrderStatus,
    onAddOrderChangeLog,
    highlightedOrderId
}: OrdersProps) {
    const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const [dateFilter, setDateFilter] = useState('all');

    const [clientName, setClientName] = useState('');
    const [clientDest, setClientDest] = useState('');
    const [selectedSku, setSelectedSku] = useState('');
    const [orderQty, setOrderQty] = useState(12);
    const [orderPriority, setOrderPriority] = useState('Normalny');

    const handleSelectAll = () => {
        if (selectedOrders.length === orders.length) {
            setSelectedOrders([]);
        } else {
            setSelectedOrders(orders.map(o => o.id));
        }
    };

    const handleSelectRow = (id: string) => {
        if (selectedOrders.includes(id)) {
            setSelectedOrders(selectedOrders.filter(o => o !== id));
        } else {
            setSelectedOrders([...selectedOrders, id]);
        }
    };

    const createOrder = (e: React.FormEvent) => {
        e.preventDefault();
        if (!clientName || !clientDest || !selectedSku) return;

        const prod = products.find(p => p.sku === selectedSku);
        const d = new Date();
        const months = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'];
        const currentHour = String(d.getHours()).padStart(2, '0');
        const currentMin = String(d.getMinutes()).padStart(2, '0');
        const shipmentDate = `${d.getDate()} ${months[d.getMonth()]}, ${currentHour}:${currentMin}`;

        onAddOrder({
            id: `ORD-${Math.floor(10000 + Math.random() * 90000)}`,
            customer: clientName,
            destination: clientDest,
            status: 'Oczekujące',
            priority: orderPriority,
            shipmentDate: shipmentDate,
            items: [{ name: prod ? prod.name : 'Unknown SKU', qty: parseInt(orderQty as any) || 10, sku: selectedSku }]
        });

        setIsNewOrderModalOpen(false);
        setClientName('');
        setClientDest('');
        setSelectedSku('');
        setOrderQty(12);
        setOrderPriority('Normalny');
    };

    const [hasNotesOnly, setHasNotesOnly] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [activePreset, setActivePreset] = useState<string>('all');

    // ----------------------------------------------------
    // RMA (REVERSE LOGISTICS) STATE & HANDLERS
    // ----------------------------------------------------
    const [rmaReturns, setRmaReturns] = useState<RmaReturn[]>(() => {
        try {
            const saved = window.localStorage.getItem('wms-rma-returns');
            if (saved) return JSON.parse(saved);
        } catch (e) {
            console.error('Failed to parse RMA returns:', e);
        }
        window.localStorage.setItem('wms-rma-returns', JSON.stringify(INITIAL_RMA_RETURNS));
        return INITIAL_RMA_RETURNS;
    });

    const [isCreateRmaModalOpen, setIsCreateRmaModalOpen] = useState(false);
    const [selectedOrderForRma, setSelectedOrderForRma] = useState<any | null>(null);
    const [rmaReason, setRmaReason] = useState('Nietrafiony dobór modelu / rozmiaru');
    const [rmaCarrier, setRmaCarrier] = useState('DPD Standard');
    const [rmaConditionGrade, setRmaConditionGrade] = useState<ConditionGrade>('GRADE_A');
    const [rmaNote, setRmaNote] = useState('');

    const handleOpenCreateRma = (order: any) => {
        sounds.playBeep();
        setSelectedOrderForRma(order);
        setRmaReason('Nietrafiony dobór modelu / rozmiaru');
        setRmaCarrier(order.shippingMethod || 'DPD Standard');
        setRmaConditionGrade('GRADE_A');
        setRmaNote('');
        setIsCreateRmaModalOpen(true);
    };

    const handleSaveRma = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOrderForRma) return;

        sounds.playSuccess();
        const randId = `RMA-${Math.floor(89200 + Math.random() * 800)}`;
        const returnTracking = `${rmaCarrier.toUpperCase().split(' ')[0]}-RET-${Math.floor(100000 + Math.random() * 900000)}`;

        const orderItems = selectedOrderForRma.items || [];
        const rmaItems = orderItems.map((item: any) => ({
            sku: item.sku || 'SKU-UNKNOWN',
            name: item.name || item.product || 'Artykuł magazynowy',
            quantity: item.quantity || item.qty || 1,
            price: item.price || 120.00,
            conditionGrade: rmaConditionGrade,
            reason: rmaReason,
            inspectionNote: rmaNote || 'Wstępne zgłoszenie zwrotu zarejestrowane w panelu dyspozytorskim.',
            targetLocation: rmaConditionGrade === 'GRADE_A' ? 'A-01-01-01' : rmaConditionGrade === 'GRADE_B' ? 'B-02-01-01' : 'UTYLIZACJA-RW'
        }));

        const totalRefund = rmaItems.reduce((acc: number, it: any) => acc + (it.price * it.quantity), 0);

        const newRma: RmaReturn = {
            id: randId,
            originalOrderId: selectedOrderForRma.id,
            customerName: selectedOrderForRma.customer || selectedOrderForRma.customerName || 'Klient',
            returnTrackingNumber: returnTracking,
            carrier: rmaCarrier,
            createdAt: `${new Date().getDate()} Wrz, ${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`,
            status: 'Oczekuje na przyjęcie',
            items: rmaItems,
            totalRefundPln: Math.round(totalRefund * 100) / 100,
            resolution: rmaConditionGrade === 'GRADE_A' ? 'Zwrot na stan (Resale)' : rmaConditionGrade === 'GRADE_B' ? 'Przecena outletowa' : 'Utylizacja RW',
            assignedRmaSlot: `RMA-01-0${Math.floor(1 + Math.random() * 5)}`
        };

        const updated = [newRma, ...rmaReturns];
        setRmaReturns(updated);
        window.localStorage.setItem('wms-rma-returns', JSON.stringify(updated));

        if (onAddOrderChangeLog) {
            onAddOrderChangeLog(selectedOrderForRma.id, 'Zgłoszenie Zwrotu RMA', `Zarejestrowano zwrot ${randId} (List zwrotny: ${returnTracking})`);
        }

        setIsCreateRmaModalOpen(false);
        setSelectedOrderForRma(null);
        setRmaNote('');
    };

    const copyToClipboard = (text: string, label: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        navigator.clipboard.writeText(text);
        sounds.playSuccess();
        setCopiedId(text);
        setTimeout(() => setCopiedId(null), 2500);
    };

    const triggerCsvExport = () => {
        sounds.playSuccess();
        const header = 'ID Zamówienia,Klient,Adres Przeznaczenia,Status,Priorytet,Data Wysyłki,Pozycje SKU,Liczba Sztuk,Kurier,Numer Listu\n';
        const rows = orders.map(o => {
            const itemsStr = (o.items || []).map((i: any) => `${i.sku || i.name} (${i.quantity || i.qty || 1}szt)`).join('; ');
            const totalQty = (o.items || []).reduce((acc: number, i: any) => acc + (i.quantity || i.qty || 1), 0);
            return `"${o.id}","${o.customer || o.customerName || ''}","${o.destination || o.shippingAddress || ''}","${o.status || ''}","${o.priority || 'Normalny'}","${o.shipmentDate || ''}","${itemsStr}","${totalQty}","${o.shippingMethod || 'DPD'}","${o.waybillNumber || ''}"`;
        }).join('\n');
        
        const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `WMS_Zamowienia_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const applyPreset = (presetId: string) => {
        sounds.playBeep();
        setActivePreset(presetId);
        switch (presetId) {
            case 'to_pick':
                setStatusFilter('Do kompletacji');
                setPriorityFilter('');
                setHasNotesOnly(false);
                break;
            case 'picking':
                setStatusFilter('W kompletacji');
                setPriorityFilter('');
                setHasNotesOnly(false);
                break;
            case 'packed':
                setStatusFilter('Spakowane');
                setPriorityFilter('');
                setHasNotesOnly(false);
                break;
            case 'shipped':
                setStatusFilter('Wysłane');
                setPriorityFilter('');
                setHasNotesOnly(false);
                break;
            case 'high_priority':
                setStatusFilter('');
                setPriorityFilter('Wysoki');
                setHasNotesOnly(false);
                break;
            case 'notes_only':
                setStatusFilter('');
                setPriorityFilter('');
                setHasNotesOnly(true);
                break;
            case 'rma':
                setStatusFilter('');
                setPriorityFilter('');
                setHasNotesOnly(false);
                break;
            case 'all':
            default:
                setStatusFilter('');
                setPriorityFilter('');
                setHasNotesOnly(false);
                break;
        }
    };

    const filteredOrders = orders.filter(order => {
        const customerInstruction = order.customerNotes || order.specialInstructions || order.deliveryNote || order.customerInstruction || order.customerNote;
        const matchesNotesOnly = hasNotesOnly ? Boolean(customerInstruction && String(customerInstruction).trim().length > 0) : true;
        const matchesStatus = statusFilter ? order.status === statusFilter : true;
        const matchesPriority = priorityFilter ? order.priority === priorityFilter : true;
        const matchesSearch = debouncedSearchQuery
            ? (order.id && String(order.id).toLowerCase().includes(debouncedSearchQuery.toLowerCase())) ||
            (order.customer && String(order.customer).toLowerCase().includes(debouncedSearchQuery.toLowerCase())) ||
            (order.destination && String(order.destination).toLowerCase().includes(debouncedSearchQuery.toLowerCase())) ||
            (customerInstruction && String(customerInstruction).toLowerCase().includes(debouncedSearchQuery.toLowerCase()))
            : true;

        let matchesDate = true;
        if (dateFilter === 'today') {
            const todayStr = getTodayDateStr();
            matchesDate = order.shipmentDate?.includes(todayStr);
        } else if (dateFilter === 'week') {
            matchesDate = isDateWithinLastNDays(order.shipmentDate, 7);
        }

        return matchesStatus && matchesPriority && matchesSearch && matchesDate && matchesNotesOnly;
    });

    React.useEffect(() => {
        if (highlightedOrderId) {
            setSearchQuery('');
            setStatusFilter('');
            setPriorityFilter('');
            setDateFilter('all');
        }
    }, [highlightedOrderId]);

    React.useEffect(() => {
        if (highlightedOrderId) {
            const index = filteredOrders.findIndex(o => o.id === highlightedOrderId);
            if (index !== -1) {
                const targetPage = Math.floor(index / rowsPerPage) + 1;
                setCurrentPage(targetPage);
                
                setTimeout(() => {
                    const element = document.getElementById(`order-row-${highlightedOrderId}`);
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, 100);
            }
        }
    }, [highlightedOrderId, filteredOrders]);

    const totalPages = Math.ceil(filteredOrders.length / rowsPerPage) || 1;
    const startIndex = (currentPage - 1) * rowsPerPage;
    const paginatedOrders = filteredOrders.slice(startIndex, startIndex + rowsPerPage);

    const renderItems = (items: any[]) => {
        if (!items || items.length === 0) return <span className="text-zinc-400">Brak pozycji</span>;

        if (items.length <= 2) {
            return (
                <div className="flex flex-col gap-1 items-start">
                    {items.map((item, idx) => (
                        <span key={idx} className="bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded text-[10px] font-semibold text-zinc-700 whitespace-nowrap">
                            {item.name || item.product} ({item.quantity ?? item.qty} PL)
                        </span>
                    ))}
                </div>
            );
        }

        const visibleItems = items.slice(0, 2);
        const extraCount = items.length - 2;

        return (
            <div className="flex flex-col gap-1 items-start select-none">
                {visibleItems.map((item, idx) => (
                    <span key={idx} className="bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded text-[10px] font-semibold text-zinc-700 whitespace-nowrap">
                        {item.name || item.product} ({item.quantity ?? item.qty} PL)
                    </span>
                ))}
                <div className="relative group mt-0.5">
                    <span className="text-[10px] font-bold text-blue-600 hover:text-blue-800 cursor-help underline decoration-dotted transition-colors">
                        + {extraCount} {extraCount === 1 ? 'inna pozycja' : extraCount < 5 ? 'inne pozycje' : 'innych pozycji'}
                    </span>
                    <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover:block z-40 bg-zinc-900 text-white text-[10px] rounded p-2 shadow-lg min-w-[200px] border border-zinc-800 transition-all pointer-events-none">
                        <p className="font-bold border-b border-zinc-800 pb-1 mb-1 text-zinc-400 uppercase tracking-wider text-[9px]">Pełna zawartość:</p>
                        <div className="space-y-1">
                            {items.map((item, idx) => (
                                <div key={idx} className="flex justify-between gap-3 text-zinc-200 font-medium">
                                    <span className="truncate max-w-[140px]">{item.name || item.product}</span>
                                    <span className="font-mono text-blue-400 shrink-0">{item.quantity ?? item.qty} PL</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const currentSelectedOrder = orders.find(o => o.id === selectedOrderId);

    if (selectedOrderId && currentSelectedOrder) {
        
        const normalizedItems = (currentSelectedOrder.items || []).map((item: any, index: number) => {
            return {
                lp: item.lp || (index + 1),
                sku: item.sku || 'SKU-UNKNOWN',
                product: item.product || item.name || 'Nieznany produkt',
                quantity: item.quantity || item.qty || 0,
                zone: item.zone || 'A1',
                status: item.status || 'Skompletowano'
            };
        });

        const normalized = {
            ...currentSelectedOrder,
            customerName: currentSelectedOrder.customerName || currentSelectedOrder.customer || 'Nieznany Klient',
            email: currentSelectedOrder.email || 'kontakt@wms-logistics.pl',
            phone: currentSelectedOrder.phone || '+48 500 600 700',
            shippingAddress: currentSelectedOrder.shippingAddress || currentSelectedOrder.destination || 'Brak adresu dostawy',
            shippingMethod: currentSelectedOrder.shippingMethod || 'DPD Standard',
            estimatedDelivery: currentSelectedOrder.estimatedDelivery || currentSelectedOrder.shipmentDate || 'Nieustalony',
            internalNotes: currentSelectedOrder.internalNotes || '',
            internalNotesActor: currentSelectedOrder.internalNotesActor || 'System',
            waybillNumber: currentSelectedOrder.waybillNumber || `DPD${currentSelectedOrder.id?.replace('ORD-', '') || '000000'}PL`,
            waybillPdfDate: currentSelectedOrder.waybillPdfDate || new Date().toLocaleDateString('pl-PL'),
            pickingZones: currentSelectedOrder.pickingZones || [
                { name: 'Strefa A', percentage: 100 }
            ],
            activityHistory: currentSelectedOrder.activityHistory || [
                { id: 'act-1', title: 'Utworzono zlecenie wyjazdu', actor: 'System', date: currentSelectedOrder.shipmentDate || 'Nieustalony' }
            ],
            changeLogs: currentSelectedOrder.changeLogs || [],
            items: normalizedItems
        };

        return (
            <OrderDetail
                order={normalized}
                onBack={() => setSelectedOrderId(null)}
                onUpdateStatus={onUpdateOrderStatus}
                onAddChangeLog={onAddOrderChangeLog}
                onUpdateOrder={onUpdateOrder}
                orders={orders}
            />
        );
    }

    const totalOrdersCount = orders.length;
    const completedOrdersCount = orders.filter(o => o.status === 'Wysłane' || o.status === 'Dostarczone' || o.isPacked).length;
    const progressPercent = totalOrdersCount > 0 ? Math.round((completedOrdersCount / totalOrdersCount) * 100) : 0;

    return (
        <div className="space-y-6 font-sans text-sm text-[#0b1c30] animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">Zarządzanie Zamówieniami (Outbound)</h2>
                    <p className="text-slate-500 text-xs mt-1 border-none">Dyspozycja wysyłek kurierskich oraz kontrola kompletacji i pakowania.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={triggerCsvExport}
                        className="h-10 px-4 rounded-lg border border-slate-300 text-slate-700 font-bold text-xs flex items-center gap-2 hover:bg-slate-50 transition-all shadow-3xs bg-white cursor-pointer"
                        title="Pobierz wszystkie aktywne zamówienia w formacie CSV"
                    >
                        <Download className="w-4 h-4 text-slate-500" /> Eksportuj CSV
                    </button>

                    <button
                        onClick={() => setIsNewOrderModalOpen(true)}
                        className="h-10 px-4 rounded-lg bg-[#2563eb] hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer border-none shadow-md"
                    >
                        <Plus className="w-4 h-4" /> Nowe Zamówienie
                    </button>
                </div>
            </div>

            {/* FULFILLMENT PROGRESS BAR WIDGET (851) */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl p-4 shadow-sm border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
                        {progressPercent}%
                    </div>
                    <div>
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                            <span>Postęp Realizacji Dnia:</span>
                            <span className="text-emerald-400 font-mono">{completedOrdersCount} / {totalOrdersCount} zrealizowanych</span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                            {progressPercent >= 80 ? '🔥 Wysoka wydajność kompletacji na zmianie!' : 'Przetwarzanie bieżącej kolejki zleceń wysyłkowych.'}
                        </p>
                    </div>
                </div>

                <div className="w-full md:w-72 flex flex-col gap-1 shrink-0">
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                        <span>Wskaźnik SLA</span>
                        <span className="text-blue-400 font-bold">{progressPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-700">
                        <div 
                            className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* SAVED VIEW PRESETS BAR (844) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs select-none">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 shrink-0">
                    <Star className="w-3 h-3 text-amber-500 fill-amber-400" /> Widoki:
                </span>
                {[
                    { id: 'all', label: 'Wszystkie', count: orders.length },
                    { id: 'to_pick', label: 'Do kompletacji', count: orders.filter(o => o.status === 'Do kompletacji').length },
                    { id: 'picking', label: 'W kompletacji', count: orders.filter(o => o.status === 'W kompletacji').length },
                    { id: 'packed', label: 'Spakowane', count: orders.filter(o => o.status === 'Spakowane').length },
                    { id: 'shipped', label: 'Wysłane', count: orders.filter(o => o.status === 'Wysłane' || o.status === 'Dostarczone').length },
                    { id: 'high_priority', label: '⚡ Pilne VIP', count: orders.filter(o => o.priority === 'Wysoki').length },
                    { id: 'notes_only', label: '📝 Z Uwagami', count: orders.filter(o => o.customerNotes || o.specialInstructions || o.deliveryNote).length },
                    { id: 'rma', label: '🔄 Zwroty RMA', count: rmaReturns.length },
                ].map(preset => (
                    <button
                        key={preset.id}
                        onClick={() => applyPreset(preset.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 border ${
                            activePreset === preset.id
                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        <span>{preset.label}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                            activePreset === preset.id ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                            {preset.count}
                        </span>
                    </button>
                ))}
            </div>

            {activePreset === 'rma' ? (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fadeIn">
                    <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <RotateCcw className="w-5 h-5 text-indigo-600" />
                                <h3 className="text-base font-bold text-slate-900">Rejestr Przesyłek Zwrotnych & Reklamacji (RMA)</h3>
                                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                                    {rmaReturns.length} zgłoszeń
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                                Obsługa logistyki odzysku (Reverse Logistics), inspekcja jakościowa i kwalifikacja towarów do ponownej sprzedaży lub likwidacji szkody.
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    const deliveredOrder = orders.find(o => o.status === 'Wysłane' || o.status === 'Dostarczone') || orders[0];
                                    handleOpenCreateRma(deliveredOrder);
                                }}
                                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer border-none"
                            >
                                <Plus className="w-4 h-4" /> Nowe Zgłoszenie RMA
                            </button>
                        </div>
                    </div>

                    {/* RMA KPI summary stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50/40 border-b border-slate-200 text-xs">
                        <div className="p-3 bg-white border border-slate-200 rounded-lg">
                            <span className="text-[10px] text-slate-500 font-mono uppercase block font-bold">Oczekujące na przyjęcie</span>
                            <span className="text-lg font-black text-amber-600 font-mono mt-0.5 block">
                                {rmaReturns.filter(r => r.status === 'Oczekuje na przyjęcie').length} przesyłki
                            </span>
                        </div>
                        <div className="p-3 bg-white border border-slate-200 rounded-lg">
                            <span className="text-[10px] text-slate-500 font-mono uppercase block font-bold">W trakcie inspekcji</span>
                            <span className="text-lg font-black text-blue-600 font-mono mt-0.5 block">
                                {rmaReturns.filter(r => r.status === 'W trakcie inspekcji').length}
                            </span>
                        </div>
                        <div className="p-3 bg-white border border-slate-200 rounded-lg">
                            <span className="text-[10px] text-slate-500 font-mono uppercase block font-bold">Przyjęte na stan (PZ)</span>
                            <span className="text-lg font-black text-emerald-600 font-mono mt-0.5 block">
                                {rmaReturns.filter(r => r.status === 'Zatwierdzony (Na stan)').length}
                            </span>
                        </div>
                        <div className="p-3 bg-white border border-slate-200 rounded-lg">
                            <span className="text-[10px] text-slate-500 font-mono uppercase block font-bold">Wartość zwrotów</span>
                            <span className="text-lg font-black text-slate-900 font-mono mt-0.5 block">
                                {rmaReturns.reduce((acc, r) => acc + (r.totalRefundPln || 0), 0).toFixed(2)} PLN
                            </span>
                        </div>
                    </div>

                    {/* RMA Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                                    <th className="py-3 px-4">Numer RMA / Data</th>
                                    <th className="py-3 px-4">Zamówienie Bazowe</th>
                                    <th className="py-3 px-4">Klient</th>
                                    <th className="py-3 px-4">List Zwrotny & Kurier</th>
                                    <th className="py-3 px-4">Ocena (Grading)</th>
                                    <th className="py-3 px-4">Status & Bufor</th>
                                    <th className="py-3 px-4 text-right">Kwota Zwrotu</th>
                                    <th className="py-3 px-4 text-center">Akcja</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                                {rmaReturns.map((rma) => (
                                    <tr key={rma.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="py-3 px-4">
                                            <span className="font-mono font-black text-indigo-700 block">{rma.id}</span>
                                            <span className="text-[10px] text-slate-400">{rma.createdAt}</span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedOrderId(rma.originalOrderId)}
                                                className="text-blue-600 hover:underline font-mono font-bold cursor-pointer bg-transparent border-none p-0"
                                            >
                                                {rma.originalOrderId}
                                            </button>
                                        </td>
                                        <td className="py-3 px-4 font-semibold text-slate-800">
                                            {rma.customerName}
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-1 font-mono font-semibold text-slate-900">
                                                <Truck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                                <span>{rma.returnTrackingNumber}</span>
                                            </div>
                                            <span className="text-[10px] text-slate-500">{rma.carrier}</span>
                                        </td>
                                        <td className="py-3 px-4">
                                            {rma.items[0]?.conditionGrade === 'GRADE_A' && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    Klasa A (Pełnowartościowy)
                                                </span>
                                            )}
                                            {rma.items[0]?.conditionGrade === 'GRADE_B' && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                                    Klasa B (Outlet -20%)
                                                </span>
                                            )}
                                            {rma.items[0]?.conditionGrade === 'GRADE_C' && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                                    Klasa C (Utylizacja RW)
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex flex-col gap-0.5">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold w-fit ${
                                                    rma.status === 'Zatwierdzony (Na stan)' ? 'bg-emerald-100 text-emerald-800' :
                                                    rma.status === 'W trakcie inspekcji' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                                                }`}>
                                                    {rma.status}
                                                </span>
                                                {rma.assignedRmaSlot && (
                                                    <span className="text-[10px] font-mono text-purple-700 font-bold">
                                                        Slot: {rma.assignedRmaSlot}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                                            {rma.totalRefundPln.toFixed(2)} PLN
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedOrderId(rma.originalOrderId)}
                                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-bold transition-all cursor-pointer border border-slate-200"
                                            >
                                                Karta zlecenia
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded border border-[#e5e7eb] shadow-sm flex flex-col overflow-hidden">
                    <div className="px-5 py-3 border-b border-[#e5e7eb] flex flex-col md:flex-row gap-4 items-center bg-zinc-50">
                    <div className="flex items-center gap-2 shrink-0 select-none">
                        <Filter className="w-4 h-4 text-zinc-500" />
                        <span className="font-bold text-zinc-850 text-xs uppercase tracking-wider">Filtry kryteriów</span>
                    </div>

                    <div className="h-4 w-px bg-zinc-200 hidden md:block"></div>

                    <div className="relative w-full md:w-96">
                        <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Filtruj wg klienta, zamówienia..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 border border-zinc-300 rounded text-xs bg-white outline-none focus:border-blue-500 text-zinc-900"
                        />
                    </div>

                    <div className="flex gap-3 flex-wrap">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="h-8 pl-2 pr-6 rounded border border-zinc-300 bg-white text-xs text-zinc-800 outline-none cursor-pointer"
                        >
                            <option value="">Status: Wszystkie</option>
                            <option value="Oczekujące">Oczekujące</option>
                            <option value="Do kompletacji">Do kompletacji</option>
                            <option value="W kompletacji">W kompletacji</option>
                            <option value="Oczekuje na pakowanie">Oczekuje na pakowanie</option>
                            <option value="Spakowane">Spakowane</option>
                            <option value="Wysłane">Wysłane</option>
                            <option value="Dostarczone">Dostarczone</option>
                        </select>

                        <select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                            className="h-8 pl-2 pr-6 rounded border border-zinc-300 bg-white text-xs text-zinc-800 outline-none cursor-pointer"
                        >
                            <option value="">Priorytet: Wszystkie</option>
                            <option value="Wysoki">Wysoki</option>
                            <option value="Normalny">Normalny</option>
                        </select>

                        <button
                            type="button"
                            onClick={() => setHasNotesOnly(!hasNotesOnly)}
                            className={`h-8 px-3 rounded border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                hasNotesOnly 
                                    ? 'bg-amber-400 border-amber-500 text-slate-950 shadow-xs' 
                                    : 'bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-50'
                            }`}
                            title="Filtruj tylko zamówienia z instrukcjami klienta"
                        >
                            <StickyNote className={`w-3.5 h-3.5 ${hasNotesOnly ? 'text-slate-950' : 'text-amber-600'}`} />
                            <span>Uwagi klienta</span>
                            {hasNotesOnly && <span className="w-2 h-2 rounded-full bg-slate-950 animate-pulse"></span>}
                        </button>
                    </div>

                    <div className="ml-auto flex items-center border border-zinc-305 rounded bg-white overflow-hidden h-8 text-xs font-semibold select-none">
                        <button
                            onClick={() => setDateFilter('all')}
                            className={`px-3 border-r border-zinc-200 transition-colors cursor-pointer ${
                                dateFilter === 'all' ? 'bg-zinc-900 text-white font-bold' : 'hover:bg-zinc-50 text-zinc-700'
                            }`}
                        >
                            Wszystkie
                        </button>
                        <button
                            onClick={() => setDateFilter(dateFilter === 'today' ? 'all' : 'today')}
                            className={`px-3 border-r border-zinc-200 transition-colors cursor-pointer ${
                                dateFilter === 'today' ? 'bg-zinc-900 text-white font-bold' : 'hover:bg-zinc-50 text-zinc-700'
                            }`}
                        >
                            Dziś
                        </button>
                        <button
                            onClick={() => setDateFilter(dateFilter === 'week' ? 'all' : 'week')}
                            className={`px-3 border-r border-zinc-200 transition-colors cursor-pointer ${
                                dateFilter === 'week' ? 'bg-zinc-900 text-white font-bold' : 'hover:bg-zinc-50 text-zinc-700'
                            }`}
                        >
                            Ten Tydzień
                        </button>
                        <button
                            onClick={() => setDateFilter(dateFilter === 'custom' ? 'all' : 'custom')}
                            className={`px-3 transition-colors cursor-pointer flex items-center gap-1.5 ${
                                dateFilter === 'custom' ? 'bg-zinc-900 text-white font-bold' : 'hover:bg-zinc-50 text-zinc-700'
                            }`}
                        >
                            <CalendarRange className="w-3.5 h-3.5" /> Niestandardowy
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left order-collapse">
                        <thead>
                        <tr className="border-b border-[#e5e7eb] bg-zinc-50 text-zinc-600 font-bold text-xs sticky top-0">
                            <th className="py-3 px-4 w-12 text-center">
                                <button onClick={handleSelectAll} className="p-1 rounded hover:bg-zinc-200 inline-block bg-transparent border-none cursor-pointer">
                                    {selectedOrders.length === orders.length ? (
                                        <CheckSquare className="w-4 h-4 text-blue-600" />
                                    ) : (
                                        <Square className="w-4 h-4 text-zinc-400" />
                                    )}
                                </button>
                            </th>
                            <th className="py-3 px-4 font-bold">Order ID</th>
                            <th className="py-3 px-4 font-bold">Klient</th>
                            <th className="py-3 px-4 font-bold">Miejsce przeznaczenia</th>
                            <th className="py-3 px-4 font-bold">Zawartość</th>
                            <th className="py-3 px-4 font-bold">Status wysyłki</th>
                            <th className="py-3 px-4 font-bold">Priorytet</th>
                            <th className="py-3 px-4 text-right font-bold">Planowany załadunek</th>
                            <th className="py-3 px-4 w-12 text-center"></th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 text-xs font-semibold text-zinc-800">
                        {paginatedOrders.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="py-8 text-center text-zinc-505 font-bold bg-white">Brak zamówień odpowiadających kryteriom filtrowania.</td>
                            </tr>
                        ) : (
                            paginatedOrders.map(order => {
                                const isChecked = selectedOrders.includes(order.id);
                                const isHighlighted = highlightedOrderId && order.id === highlightedOrderId;
                                return (
                                    <tr 
                                        id={`order-row-${order.id}`}
                                        key={order.id} 
                                        className={`transition-all duration-500 hover:bg-zinc-50/70 ${
                                            isHighlighted 
                                                ? 'bg-amber-100 ring-2 ring-amber-400 font-bold' 
                                                : isChecked 
                                                    ? 'bg-blue-50/20' 
                                                    : ''
                                        }`}
                                    >
                                        <td className="py-3 px-4 text-center">
                                            <button onClick={() => handleSelectRow(order.id)} className="p-1 text-zinc-500 bg-transparent border-none cursor-pointer">
                                                {isChecked ? (
                                                    <CheckSquare className="w-4 h-4 text-blue-600" />
                                                ) : (
                                                    <Square className="w-4 h-4 text-zinc-300" />
                                                )}
                                            </button>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    {(order.isPacked || order.status === 'Dostarczone') && (
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-250 whitespace-nowrap">
                                                            Spakowana
                                                        </span>
                                                    )}
                                                    <button
                                                        onClick={() => setSelectedOrderId(order.id)}
                                                        className="font-mono font-bold text-[#0058be] hover:underline text-left cursor-pointer outline-none bg-transparent border-none"
                                                    >
                                                        {order.id}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => copyToClipboard(order.id, 'Numer zamówienia', e)}
                                                        className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors cursor-pointer bg-transparent border-none"
                                                        title="Kopiuj numer zamówienia do schowka"
                                                    >
                                                        {copiedId === order.id ? (
                                                            <Check className="w-3.5 h-3.5 text-emerald-600 animate-bounce" />
                                                        ) : (
                                                            <Copy className="w-3.5 h-3.5" />
                                                        )}
                                                    </button>
                                                </div>
                                                {order.binId && (
                                                    <div className="text-[10px] text-zinc-400 font-mono flex items-center gap-1 select-none">
                                                        Pojemnik: <span className="font-bold text-[#0052cc] bg-blue-50/50 px-1 py-0.2 rounded border border-blue-100">{order.binId}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 font-bold text-zinc-900">
                                            <div>{order.customer}</div>
                                            {(() => {
                                                const custNote = order.customerNotes || order.specialInstructions || order.deliveryNote || order.customerInstruction || order.customerNote;
                                                if (custNote) {
                                                    return (
                                                        <div className="mt-1 px-2 py-1 bg-amber-100 border border-amber-300 rounded text-[10.5px] font-extrabold text-amber-950 flex items-center gap-1.5 shadow-2xs">
                                                            <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0 animate-pulse" />
                                                            <span className="truncate max-w-[200px]" title={custNote}>
                                                                Uwagi: {custNote}
                                                            </span>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </td>
                                        <td className="py-3 px-4 text-zinc-650">{order.destination}</td>
                                        <td className="py-3 px-4 text-zinc-800">
                                            {renderItems(order.items)}
                                        </td>
                                        <td className="py-3 px-4">
                                            {(() => {
                                                const styles = getStatusBadgeStyles(order.status);
                                                return (
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide border ${styles.badge}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${styles.dot}`}></span>
                                                        {getStatusLabel(order.status)}
                                                    </span>
                                                );
                                            })()}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`font-bold inline-flex items-center gap-1 ${order.priority === 'Wysoki' ? 'text-red-655' : 'text-zinc-650'}`}>
                                                {order.priority === 'Wysoki' ? '⚠️ Wysoki' : 'Normalny'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right font-mono font-semibold text-zinc-600">{order.shipmentDate}</td>
                                        <td className="py-3 px-4 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                {(order.status === 'Wysłane' || order.status === 'Dostarczone') && (
                                                    <button 
                                                        onClick={() => handleOpenCreateRma(order)}
                                                        className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 cursor-pointer flex items-center gap-1 transition-colors"
                                                        title="Zgłoś zwrot lub reklamację (RMA) dla tego zamówienia"
                                                    >
                                                        <RotateCcw className="w-3 h-3 text-indigo-600" />
                                                        RMA
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => setSelectedOrderId(order.id)}
                                                    className="p-1 hover:bg-zinc-150 rounded text-zinc-400 hover:text-zinc-850 transition-colors cursor-pointer bg-transparent border-none"
                                                    title="Szczegóły zlecenia"
                                                >
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                        </tbody>
                    </table>
                </div>

                <div className="px-5 py-3 border-t border-[#e5e7eb] bg-zinc-50 flex flex-col sm:flex-row gap-3 items-center justify-between mt-auto">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-5">
                        <span className="text-zinc-500 text-xs font-semibold">
                            Wyświetlono {filteredOrders.length === 0 ? 0 : startIndex + 1}-{Math.min(startIndex + rowsPerPage, filteredOrders.length)} z {filteredOrders.length} zamówień
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-semibold select-none">
                            <span>Wierszy na stronie:</span>
                            <select
                                value={rowsPerPage}
                                onChange={(e) => {
                                    setRowsPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="h-7 px-1.5 rounded border border-zinc-300 bg-white text-xs outline-none cursor-pointer text-zinc-700 focus:border-blue-500"
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 select-none">
                        <button
                            onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                            disabled={currentPage === 1}
                            className="p-1.5 rounded border border-zinc-350 bg-white hover:bg-zinc-50 disabled:opacity-40 transition-colors text-zinc-700 cursor-pointer"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        {getPageNumbers(currentPage, totalPages).map((p, idx) => {
                            if (p === '...') {
                                return (
                                    <span key={`dots-${idx}`} className="w-7.5 h-7.5 flex items-center justify-center text-zinc-400 text-xs font-semibold select-none">
                                        ...
                                    </span>
                                );
                            }
                            return (
                                <button
                                    key={p}
                                    onClick={() => setCurrentPage(Number(p))}
                                    className={`w-7.5 h-7.5 rounded text-xs font-bold leading-none ${
                                        currentPage === p
                                            ? 'bg-blue-600 text-white shadow-sm font-black'
                                            : 'border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-755 cursor-pointer'
                                    }`}
                                >
                                    {p}
                                </button>
                            );
                        })}

                        <button
                            onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="p-1.5 rounded border border-zinc-350 bg-white hover:bg-zinc-50 disabled:opacity-40 transition-colors text-zinc-700 cursor-pointer"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
            )}

            {isNewOrderModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg border border-zinc-300 w-full max-w-md shadow-2xl overflow-hidden font-sans text-sm pb-1">
                        <div className="px-5 py-4 bg-[#0f172a] text-white flex justify-between items-center select-none border-b border-slate-800">
                            <h3 className="font-extrabold text-sm tracking-tight">Kreator nowego zlecenia wyjazdu (Outbound)</h3>
                            <button onClick={() => setIsNewOrderModalOpen(false)} className="text-zinc-400 hover:text-white cursor-pointer font-bold text-lg bg-transparent border-none">×</button>
                        </div>

                        <form onSubmit={createOrder} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">NAZWA ODBIORCY / KLIENTA</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="np. Acme Logistics Sp. z o.o."
                                    value={clientName}
                                    onChange={(e) => setClientName(e.target.value)}
                                    className="w-full p-2 border border-zinc-300 rounded outline-none focus:ring-1 focus:ring-blue-500 text-zinc-950 bg-white"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">ADRES DOCELOWY / MIEJSCOWOŚĆ</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="np. Poznań, PL lub Berlin, DE"
                                    value={clientDest}
                                    onChange={(e) => setClientDest(e.target.value)}
                                    className="w-full p-2 border border-zinc-300 rounded outline-none focus:ring-1 focus:ring-blue-500 text-zinc-950 bg-white"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">WYBIERZ SKU (Asortyment)</label>
                                    <select
                                        value={selectedSku}
                                        onChange={(e) => setSelectedSku(e.target.value)}
                                        required
                                        className="w-full p-2 border border-zinc-305 rounded outline-none text-zinc-950 bg-white"
                                    >
                                        <option value="">Wybierz...</option>
                                        {products.map(p => (
                                            <option key={p.sku} value={p.sku}>{p.sku} (Dostępne: {p.stock})</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">ILOŚĆ ZLECANA (palety)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="1000"
                                        value={orderQty}
                                        onChange={(e) => setOrderQty(e.target.value as any)}
                                        className="w-full p-2 border border-zinc-300 rounded outline-none text-zinc-950 bg-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">PRIORYTET WYSYŁKI</label>
                                <div className="flex gap-6 mt-1.5">
                                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-zinc-700">
                                        <input
                                            type="radio"
                                            name="orderPriority"
                                            checked={orderPriority === 'Normalny'}
                                            onChange={() => setOrderPriority('Normalny')}
                                            className="text-blue-600"
                                        />
                                        Normalny
                                    </label>
                                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-red-600">
                                        <input
                                            type="radio"
                                            name="orderPriority"
                                            checked={orderPriority === 'Wysoki'}
                                            onChange={() => setOrderPriority('Wysoki')}
                                            className="text-red-655 focus:ring-red-500"
                                        />
                                        Wysoki ⚠️
                                    </label>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-zinc-200 mt-6 flex justify-end gap-3 flex-wrap">
                                <button
                                    type="button"
                                    onClick={() => setIsNewOrderModalOpen(false)}
                                    className="px-4 py-2 border border-zinc-300 hover:bg-zinc-50 text-zinc-700 font-semibold rounded text-xs cursor-pointer bg-white"
                                >
                                    Anuluj
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs cursor-pointer shadow border-none"
                                >
                                    Utwórz zlecenia wyjazdu
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* CREATE RMA RETURN MODAL */}
            {isCreateRmaModalOpen && selectedOrderForRma && (
                <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-lg shadow-2xl overflow-hidden font-sans text-sm animate-in zoom-in-95 duration-150">
                        <div className="px-5 py-4 bg-indigo-900 text-white flex justify-between items-center select-none border-b border-indigo-800">
                            <div className="flex items-center gap-2">
                                <RotateCcw className="w-5 h-5 text-indigo-300" />
                                <h3 className="font-extrabold text-sm tracking-tight">Rejestracja Nowego Zwrotu RMA</h3>
                            </div>
                            <button onClick={() => setIsCreateRmaModalOpen(false)} className="text-indigo-200 hover:text-white cursor-pointer font-bold text-lg bg-transparent border-none">×</button>
                        </div>

                        <form onSubmit={handleSaveRma} className="p-5 space-y-4">
                            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs space-y-1">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Zamówienie bazowe:</span>
                                    <strong className="font-mono text-slate-900">{selectedOrderForRma.id}</strong>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Odbiorca:</span>
                                    <strong className="text-slate-900">{selectedOrderForRma.customer || selectedOrderForRma.customerName}</strong>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Przyczyna zwrotu / reklamacji
                                </label>
                                <select
                                    value={rmaReason}
                                    onChange={(e) => setRmaReason(e.target.value)}
                                    className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 outline-none focus:border-indigo-500"
                                >
                                    <option value="Nietrafiony dobór modelu / rozmiaru">Nietrafiony dobór modelu / rozmiaru</option>
                                    <option value="Odstąpienie od umowy (14 dni konsumenckie)">Odstąpienie od umowy (14 dni konsumenckie)</option>
                                    <option value="Uszkodzenie kartonu / towaru w transporcie kurierskim">Uszkodzenie kartonu / towaru w transporcie kurierskim</option>
                                    <option value="Wada fabryczna artykułu / niezgodność ze specyfikacją">Wada fabryczna artykułu / niezgodność ze specyfikacją</option>
                                    <option value="Pomyłka w wysyłce (błędne SKU)">Pomyłka w wysyłce (błędne SKU)</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Operator przesyłki zwrotnej
                                    </label>
                                    <select
                                        value={rmaCarrier}
                                        onChange={(e) => setRmaCarrier(e.target.value)}
                                        className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 outline-none"
                                    >
                                        <option value="DPD Standard">DPD Standard</option>
                                        <option value="InPost Paczkomat">InPost Paczkomat</option>
                                        <option value="DHL Express">DHL Express</option>
                                        <option value="Pocztex">Pocztex</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Wstępna klasyfikacja stanu
                                    </label>
                                    <select
                                        value={rmaConditionGrade}
                                        onChange={(e) => setRmaConditionGrade(e.target.value as ConditionGrade)}
                                        className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 outline-none"
                                    >
                                        <option value="GRADE_A">Klasa A (Pełnowartościowy)</option>
                                        <option value="GRADE_B">Klasa B (Outlet / Naruszone pudełko)</option>
                                        <option value="GRADE_C">Klasa C (Uszkodzony / Likwidacja RW)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Notatka dyspozytorska / uwagi klienta
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder="Dodaj szczegóły zgłoszenia reklamacyjnego..."
                                    value={rmaNote}
                                    onChange={(e) => setRmaNote(e.target.value)}
                                    className="w-full p-2 border border-slate-300 rounded-lg text-xs outline-none focus:border-indigo-500 text-slate-900"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateRmaModalOpen(false)}
                                    className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                                >
                                    Anuluj
                                </button>
                                <button
                                    type="submit"
                                    className="px-4.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer border-none flex items-center gap-1.5"
                                >
                                    <RotateCcw className="w-4 h-4" /> Utwórz Zgłoszenie RMA
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
