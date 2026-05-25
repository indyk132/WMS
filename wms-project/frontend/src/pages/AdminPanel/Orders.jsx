import React, { useState } from 'react';
import { Download, Plus, Filter, ChevronLeft, ChevronRight, CheckSquare, Square, MoreVertical, Search, Home, CalendarRange } from 'lucide-react';
import { OrderDetail } from '../../components/OrderDetail';

function normalizeOrder(order) {
    if (!order) return null;
    
    const normalizedItems = (order.items || []).map((item, index) => {
        return {
            lp: item.lp || (index + 1),
            sku: item.sku || 'SKU-UNKNOWN',
            product: item.product || item.name || 'Nieznany produkt',
            quantity: item.quantity || item.qty || 0,
            zone: item.zone || 'A1',
            status: item.status || 'Skompletowano'
        };
    });

    return {
        ...order,
        customerName: order.customerName || order.customer || 'Nieznany Klient',
        email: order.email || 'kontakt@wms-logistics.pl',
        phone: order.phone || '+48 500 600 700',
        shippingAddress: order.shippingAddress || order.destination || 'Brak adresu dostawy',
        shippingMethod: order.shippingMethod || 'DPD Standard',
        estimatedDelivery: order.estimatedDelivery || order.shipmentDate || 'Nieustalony',
        internalNotes: order.internalNotes || '',
        internalNotesActor: order.internalNotesActor || 'System',
        waybillNumber: order.waybillNumber || `DPD${order.id?.replace('ORD-', '') || '000000'}PL`,
        waybillPdfDate: order.waybillPdfDate || new Date().toLocaleDateString('pl-PL'),
        pickingZones: order.pickingZones || [
            { name: 'Strefa A', percentage: 100 }
        ],
        activityHistory: order.activityHistory || [
            { id: 'act-1', title: 'Utworzono zlecenie wyjazdu', actor: 'System', date: order.shipmentDate || 'Nieustalony' }
        ],
        changeLogs: order.changeLogs || [],
        items: normalizedItems
    };
}

export default function Orders({ orders, products, onAddOrder, onUpdateOrder, onUpdateOrderStatus, onAddOrderChangeLog }) {
    const [selectedOrders, setSelectedOrders] = useState([]);
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [statusFilter, setStatusFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Form states
    const [clientName, setClientName] = useState('');
    const [clientDest, setClientDest] = useState('');
    const [selectedSku, setSelectedSku] = useState('');
    const [orderQty, setOrderQty] = useState(12);
    const [orderPriority, setOrderPriority] = useState('Normal');

    const rowsPerPage = 5;

    const handleSelectAll = () => {
        if (selectedOrders.length === orders.length) {
            setSelectedOrders([]);
        } else {
            setSelectedOrders(orders.map(o => o.id));
        }
    };

    const handleSelectRow = (id) => {
        if (selectedOrders.includes(id)) {
            setSelectedOrders(selectedOrders.filter(o => o !== id));
        } else {
            setSelectedOrders([...selectedOrders, id]);
        }
    };

    const createOrder = (e) => {
        e.preventDefault();
        if (!clientName || !clientDest || !selectedSku) return;

        const prod = products.find(p => p.sku === selectedSku);

        onAddOrder({
            id: `ORD-${Math.floor(10000 + Math.random() * 90000)}`,
            customer: clientName,
            destination: clientDest,
            status: 'PENDING',
            priority: orderPriority,
            shipmentDate: 'Oct 25, 09:30',
            items: [{ name: prod ? prod.name : 'Unknown SKU', qty: parseInt(orderQty) || 10 }]
        });

        setIsNewOrderModalOpen(false);
        setClientName('');
        setClientDest('');
        setSelectedSku('');
        setOrderQty(12);
        setOrderPriority('Normal');
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

    // Filter orders
    const filteredOrders = orders.filter(order => {
        const matchesStatus = statusFilter ? order.status === statusFilter : true;
        const matchesPriority = priorityFilter ? order.priority === priorityFilter : true;
        const matchesSearch = searchQuery
            ? order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.destination.toLowerCase().includes(searchQuery.toLowerCase())
            : true;
        return matchesStatus && matchesPriority && matchesSearch;
    });

    // Paginated listings
    const totalPages = Math.ceil(filteredOrders.length / rowsPerPage) || 1;
    const startIndex = (currentPage - 1) * rowsPerPage;
    const paginatedOrders = filteredOrders.slice(startIndex, startIndex + rowsPerPage);

    const currentSelectedOrder = orders.find(o => o.id === selectedOrderId);

    if (selectedOrderId && currentSelectedOrder) {
        const normalized = normalizeOrder(currentSelectedOrder);
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
        <div className="space-y-6 font-sans text-sm text-[#0b1c30]">
            {/* Page Header */}
            <div className="flex justify-between items-end mb-2">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900 leading-tight">Aktywne Zamówienia</h2>
                    <p className="text-zinc-500 text-xs mt-1">Zarządzaj, filtruj i śledź wysyłki wyjazdowe.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={triggerCsvExport}
                        className="h-9 px-4 rounded border border-[#c6c6cd] text-zinc-700 font-semibold text-xs flex items-center gap-2 hover:bg-zinc-50 transition-colors shadow-sm bg-white cursor-pointer"
                    >
                        <Download className="w-4 h-4 text-zinc-500" /> Eksportuj CSV
                    </button>

                    <button
                        onClick={() => setIsNewOrderModalOpen(true)}
                        className="h-9 px-4 rounded bg-[#0058be] hover:bg-blue-750 text-white font-bold text-xs flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
                    >
                        <Plus className="w-4 h-4" /> Nowe Zamówienie
                    </button>
                </div>
            </div>

            {/* Main Container */}
            <div className="bg-white rounded border border-[#c6c6cd] shadow-sm flex flex-col overflow-hidden">
                {/* Toolbar Controls */}
                <div className="px-5 py-3 border-b border-[#c6c6cd] flex flex-col md:flex-row gap-4 items-center bg-zinc-50">
                    <div className="flex items-center gap-2 shrink-0">
                        <Filter className="w-4 h-4 text-zinc-500" />
                        <span className="font-bold text-zinc-850 text-xs uppercase tracking-wider">Filtry kryteriów</span>
                    </div>

                    <div className="h-4 w-px bg-zinc-250 hidden md:block"></div>

                    {/* Quick inline search */}
                    <div className="relative w-full md:w-64">
                        <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Filtruj wg klienta, zamówienia..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 border border-zinc-300 rounded text-xs bg-white outline-none focus:border-blue-500"
                        />
                    </div>

                    <div className="flex gap-3 flex-wrap">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="h-8 pl-2 pr-6 rounded border border-zinc-300 bg-white text-xs text-zinc-800 outline-none cursor-pointer"
                        >
                            <option value="">Status: Wszystkie</option>
                            <option value="PROCESSING">PROCESSING</option>
                            <option value="SHIPPED">SHIPPED</option>
                            <option value="PENDING">PENDING</option>
                            <option value="DELIVERED">DELIVERED</option>
                        </select>

                        <select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                            className="h-8 pl-2 pr-6 rounded border border-zinc-300 bg-white text-xs text-zinc-800 outline-none cursor-pointer"
                        >
                            <option value="">Priorytet: Wszystkie</option>
                            <option value="High">Wysoki (High)</option>
                            <option value="Normal">Normalny (Normal)</option>
                        </select>
                    </div>

                    {/* Mock timespan picker */}
                    <div className="ml-auto flex items-center border border-zinc-300 rounded bg-white overflow-hidden h-8 text-xs font-semibold">
                        <button className="px-3 border-r border-zinc-200 hover:bg-zinc-50 text-zinc-700">Dziś</button>
                        <button className="px-3 border-r border-zinc-200 bg-zinc-100 text-zinc-900 font-bold">Ten Tydzień</button>
                        <button className="px-3 hover:bg-zinc-50 text-zinc-700 flex items-center gap-1.5">
                            <CalendarRange className="w-3.5 h-3.5" /> Niestandardowy
                        </button>
                    </div>
                </div>

                {/* Dense Outbound Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                        <tr className="border-b border-[#c6c6cd] bg-zinc-50 text-zinc-600 font-bold text-xs sticky top-0">
                            <th className="py-3 px-4 w-12 text-center">
                                <button onClick={handleSelectAll} className="p-1 rounded hover:bg-zinc-200 inline-block">
                                    {selectedOrders.length === orders.length ? (
                                        <CheckSquare className="w-4 h-4 text-blue-600" />
                                    ) : (
                                        <Square className="w-4 h-4 text-zinc-400" />
                                    )}
                                </button>
                            </th>
                            <th className="py-3 px-4">Order ID</th>
                            <th className="py-3 px-4">Klient (Customer)</th>
                            <th className="py-3 px-4">Miejsce przeznaczenia</th>
                            <th className="py-3 px-4">Zawartość (Towar)</th>
                            <th className="py-3 px-4">Status wysyłki</th>
                            <th className="py-3 px-4">Priorytet</th>
                            <th className="py-3 px-4 text-right">Planowany załadunek</th>
                            <th className="py-3 px-4 w-12 text-center"></th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 text-xs font-medium text-zinc-800">
                        {paginatedOrders.length === 0 ? (
                            <tr>
                                <td colSpan="9" className="py-8 text-center text-zinc-500 font-bold bg-white">Brak zamówień odpowiadających kryteriom filtrowania.</td>
                            </tr>
                        ) : (
                            paginatedOrders.map(order => {
                                const isChecked = selectedOrders.includes(order.id);
                                return (
                                    <tr key={order.id} className={`hover:bg-zinc-50/70 transition-colors ${isChecked ? 'bg-blue-50/20' : ''}`}>
                                        <td className="py-3 px-4 text-center">
                                            <button onClick={() => handleSelectRow(order.id)} className="p-1 text-zinc-500">
                                                {isChecked ? (
                                                    <CheckSquare className="w-4 h-4 text-blue-600" />
                                                ) : (
                                                    <Square className="w-4 h-4 text-zinc-300" />
                                                )}
                                            </button>
                                        </td>
                                        <td className="py-3 px-4">
                                            <button
                                                onClick={() => setSelectedOrderId(order.id)}
                                                className="font-mono font-bold text-blue-650 hover:underline text-left cursor-pointer outline-none"
                                            >
                                                {order.id}
                                            </button>
                                        </td>
                                        <td className="py-3 px-4 font-bold text-zinc-900">{order.customer}</td>
                                        <td className="py-3 px-4 text-zinc-600">{order.destination}</td>
                                        <td className="py-3 px-4 text-zinc-800">
                                            {order.items?.map((item, idx) => (
                                                <span key={idx} className="bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded text-[10px] font-semibold text-zinc-700 inline-block mr-1">
                            {item.name} ({item.qty} PL)
                          </span>
                                            ))}
                                        </td>
                                        <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide border ${
                            order.status === 'PROCESSING'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : order.status === 'SHIPPED'
                                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                                    : order.status === 'DELIVERED'
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : 'bg-zinc-100 text-zinc-605 border-zinc-250'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                              order.status === 'PROCESSING'
                                  ? 'bg-blue-600'
                                  : order.status === 'SHIPPED'
                                      ? 'bg-purple-600'
                                      : order.status === 'DELIVERED'
                                          ? 'bg-emerald-600'
                                          : 'bg-zinc-500'
                          }`}></span>
                            {order.status}
                        </span>
                                        </td>
                                        <td className="py-3 px-4">
                        <span className={`font-bold inline-flex items-center gap-1 ${order.priority === 'High' ? 'text-red-600' : 'text-zinc-650'}`}>
                          {order.priority === 'High' ? '⚠️ High' : 'Normal'}
                        </span>
                                        </td>
                                        <td className="py-3 px-4 text-right font-mono font-semibold text-zinc-600">{order.shipmentDate}</td>
                                        <td className="py-3 px-4 text-center">
                                            <button className="p-1 hover:bg-zinc-150 rounded text-zinc-400 hover:text-zinc-800 transition-colors cursor-pointer">
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

                {/* Table Pagination Footer bar */}
                <div className="px-5 py-3 border-t border-[#c6c6cd] bg-zinc-50 flex items-center justify-between mt-auto">
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
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 cursor-pointer'
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

            {/* Outbound System Creator Modal */}
            {isNewOrderModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg border border-zinc-300 w-full max-w-md shadow-2xl overflow-hidden font-sans text-sm">
                        <div className="px-5 py-4 bg-[#0b1c30] text-white flex justify-between items-center">
                            <h3 className="font-bold tracking-tight">Kreator nowego zlecenia wyjazdu (Outbound Order)</h3>
                            <button onClick={() => setIsNewOrderModalOpen(false)} className="text-zinc-400 hover:text-white cursor-pointer font-bold text-lg">×</button>
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
                                    className="w-full p-2 border border-zinc-300 rounded outline-none focus:ring-1 focus:ring-blue-500 text-zinc-950"
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
                                    className="w-full p-2 border border-zinc-300 rounded outline-none focus:ring-1 focus:ring-blue-500 text-zinc-950"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">WYBIERZ SKU (Asortyment)</label>
                                    <select
                                        value={selectedSku}
                                        onChange={(e) => setSelectedSku(e.target.value)}
                                        required
                                        className="w-full p-2 border border-zinc-300 rounded outline-none text-zinc-950 bg-white"
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
                                        onChange={(e) => setOrderQty(e.target.value)}
                                        className="w-full p-2 border border-zinc-300 rounded outline-none text-zinc-950"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">PRIORYTET WYSYŁKI</label>
                                <div className="flex gap-6 mt-1.5">
                                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold">
                                        <input
                                            type="radio"
                                            name="orderPriority"
                                            checked={orderPriority === 'Normal'}
                                            onChange={() => setOrderPriority('Normal')}
                                            className="text-blue-600"
                                        />
                                        Zwykły (Normal)
                                    </label>
                                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-red-600">
                                        <input
                                            type="radio"
                                            name="orderPriority"
                                            checked={orderPriority === 'High'}
                                            onChange={() => setOrderPriority('High')}
                                            className="text-red-600 focus:ring-red-500"
                                        />
                                        Wysoki (High) ⚠️
                                    </label>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-zinc-200 mt-6 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsNewOrderModalOpen(false)}
                                    className="px-4 py-2 border border-zinc-300 hover:bg-zinc-50 text-zinc-700 font-semibold rounded text-xs cursor-pointer"
                                >
                                    Anuluj
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs cursor-pointer shadow"
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
