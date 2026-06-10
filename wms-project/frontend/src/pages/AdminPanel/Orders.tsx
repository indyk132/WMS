import React, { useState } from 'react';
import { Download, Plus, Filter, ChevronLeft, ChevronRight, CheckSquare, Square, MoreVertical, Search, CalendarRange } from 'lucide-react';
import { OrderDetail } from '../../components/OrderDetail';
import { Product } from '../../services/inventoryApi';

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
    const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFilter, setDateFilter] = useState('week');

    const [clientName, setClientName] = useState('');
    const [clientDest, setClientDest] = useState('');
    const [selectedSku, setSelectedSku] = useState('');
    const [orderQty, setOrderQty] = useState(12);
    const [orderPriority, setOrderPriority] = useState('Normalny');

    const rowsPerPage = 5;

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

    const triggerCsvExport = () => {
        const header = 'Order ID,Customer,Destination,Status,Priority,Shipment Date\n';
        const rows = orders.map(o => `${o.id},${o.customer},${o.destination},${o.status},${o.priority},${o.shipmentDate}`).join('\n');
        const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Active_Orders_LogisticsOS_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredOrders = orders.filter(order => {
        const matchesStatus = statusFilter ? order.status === statusFilter : true;
        const matchesPriority = priorityFilter ? order.priority === priorityFilter : true;
        const matchesSearch = searchQuery
            ? order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.destination.toLowerCase().includes(searchQuery.toLowerCase())
            : true;

        let matchesDate = true;
        if (dateFilter === 'today') {
            const todayStr = getTodayDateStr();
            matchesDate = order.shipmentDate?.includes(todayStr);
        } else if (dateFilter === 'week') {
            matchesDate = isDateWithinLastNDays(order.shipmentDate, 7);
        }

        return matchesStatus && matchesPriority && matchesSearch && matchesDate;
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
            />
        );
    }

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
                    </div>

                    <div className="ml-auto flex items-center border border-zinc-305 rounded bg-white overflow-hidden h-8 text-xs font-semibold select-none">
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
                                                </div>
                                                {order.binId && (
                                                    <div className="text-[10px] text-zinc-400 font-mono flex items-center gap-1 select-none">
                                                        Pojemnik: <span className="font-bold text-[#0052cc] bg-blue-50/50 px-1 py-0.2 rounded border border-blue-100">{order.binId}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 font-bold text-zinc-900">{order.customer}</td>
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
                                            <button className="p-1 hover:bg-zinc-150 rounded text-zinc-400 hover:text-zinc-850 transition-colors cursor-pointer bg-transparent border-none">
                                                <MoreVertical className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                        </tbody>
                    </table>
                </div>

                <div className="px-5 py-3 border-t border-[#e5e7eb] bg-zinc-50 flex items-center justify-between mt-auto">
                    <span className="text-zinc-500 text-xs font-semibold">
                        Wyświetlono {startIndex + 1}-{Math.min(startIndex + rowsPerPage, filteredOrders.length)} z {filteredOrders.length} zamówień
                    </span>

                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                            disabled={currentPage === 1}
                            className="p-1.5 rounded border border-zinc-350 bg-white hover:bg-zinc-50 disabled:opacity-40 transition-colors text-zinc-700 cursor-pointer"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        {[...Array(totalPages)].map((_, idx) => {
                            const p = idx + 1;
                            return (
                                <button
                                    key={p}
                                    onClick={() => setCurrentPage(p)}
                                    className={`w-7.5 h-7.5 rounded text-xs font-bold leading-none ${
                                        currentPage === p
                                            ? 'bg-blue-600 text-white shadow-sm font-black'
                                            : 'border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-750 cursor-pointer'
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
        </div>
    );
}
