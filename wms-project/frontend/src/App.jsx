import React, { useEffect, useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import Login from './pages/Login';
import Home from './pages/Home';
import Dashboard from './pages/AdminPanel/Dashboard';
import Orders from './pages/AdminPanel/Orders';
import Products from './pages/AdminPanel/Products';
import Storage from './pages/AdminPanel/Storage';
import UsersPermissions from './pages/AdminPanel/Users';
import { adjustInventoryStock, fetchInventoryProducts } from './services/inventoryApi';
import { createUser, fetchUsers } from './services/usersApi';
import { LayoutDashboard, FileText, Map, ShieldAlert, Boxes, LogOut, Package, HomeIcon } from 'lucide-react';

const readStoredUser = () => {
    if (typeof window === 'undefined') return null;

    try {
        return JSON.parse(window.localStorage.getItem('wms-current-user'));
    } catch {
        return null;
    }
};

export default function App() {
    const [currentUser, setCurrentUser] = useState(() => readStoredUser());

    const [inLobby, setInLobby] = useState(true);
    const [currentTab, setCurrentTab] = useState('overview'); // overview, orders, products, zones, permissions
    const [searchQuery, setSearchQuery] = useState('');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [inventorySync, setInventorySync] = useState({ isLoading: false, error: '' });
    const [usersSync, setUsersSync] = useState({ isLoading: false, error: '' });

    // Core reactive dataset
    const [products, setProducts] = useState([
        { sku: 'SKU-10492', name: 'Płyn hamulcowy DOT-4', category: 'Artykuły chemiczne', stock: 120, reorderThreshold: 100, zone: 'C3', status: 'In Stock', price: 34.99 },
        { sku: 'SKU-20391', name: 'Reflektor LED H7 SuperVolt', category: 'Części samochodowe', stock: 15, reorderThreshold: 40, zone: 'A1', status: 'Low Stock', price: 289.00 },
        { sku: 'SKU-94021', name: 'Akumulator VoltPro 74Ah 12V', category: 'Części samochodowe', stock: 0, reorderThreshold: 15, zone: 'A2', status: 'Out of Stock', price: 449.99 },
        { sku: 'SKU-50493', name: 'Olej silnikowy Syntetic 5W30', category: 'Artykuły chemiczne', stock: 8, reorderThreshold: 20, zone: 'C2', status: 'Low Stock', price: 179.99 },
        { sku: 'SKU-73012', name: 'Klocki hamulcowe CarbonPremium', category: 'Części samochodowe', stock: 245, reorderThreshold: 80, zone: 'A3', status: 'In Stock', price: 134.99 },
        { sku: 'SKU-39402', name: 'Prostownik mikroprocesorowy 12V', category: 'Elektronika', stock: 85, reorderThreshold: 15, zone: 'B2', status: 'In Stock', price: 249.00 }
    ]);

    const [orders, setOrders] = useState([
        {
            id: 'ORD-89241',
            customer: 'Acme Corp Logistics',
            destination: 'Seattle, WA',
            status: 'PROCESSING',
            priority: 'High',
            shipmentDate: 'Oct 24, 14:30',
            items: [{ name: 'Reflektor LED H7 SuperVolt', qty: 15 }]
        },
        {
            id: 'ORD-89240',
            customer: 'Global Imports LLC',
            destination: 'Miami, FL',
            status: 'SHIPPED',
            priority: 'Normal',
            shipmentDate: 'Oct 23, 09:15',
            items: [{ name: 'Klocki hamulcowe CarbonPremium', qty: 50 }]
        },
        {
            id: 'ORD-89239',
            customer: 'TechNova Dist.',
            destination: 'Austin, TX',
            status: 'PENDING',
            priority: 'Normal',
            shipmentDate: 'Unscheduled',
            items: [{ name: 'Akumulator VoltPro 74Ah', qty: 25 }]
        }
    ]);

    const [zones, setZones] = useState([
        { id: 'A1', block: 'AMBIENT', capacityPercent: 94, activeSKUs: 3, totalPallets: 32, maxPallets: 34, temp: 'Ambient (18°C)', hazmatStatus: 'None', lastAuditDaysAgo: 1, isLocked: false },
        { id: 'A2', block: 'AMBIENT', capacityPercent: 91, activeSKUs: 4, totalPallets: 31, maxPallets: 34, temp: 'Ambient (19°C)', hazmatStatus: 'None', lastAuditDaysAgo: 2, isLocked: false },
        { id: 'A3', block: 'AMBIENT', capacityPercent: 55, activeSKUs: 2, totalPallets: 19, maxPallets: 34, temp: 'Ambient (18°C)', hazmatStatus: 'None', lastAuditDaysAgo: 3, isLocked: false },
        { id: 'A4', block: 'AMBIENT', capacityPercent: 70, activeSKUs: 2, totalPallets: 24, maxPallets: 34, temp: 'Ambient (18°C)', hazmatStatus: 'None', lastAuditDaysAgo: 1, isLocked: false },
        { id: 'A5', block: 'AMBIENT', capacityPercent: 15, activeSKUs: 1, totalPallets: 5, maxPallets: 34, temp: 'Ambient (17°C)', hazmatStatus: 'None', lastAuditDaysAgo: 4, isLocked: false },
        { id: 'A6', block: 'AMBIENT', capacityPercent: 18, activeSKUs: 1, totalPallets: 6, maxPallets: 34, temp: 'Ambient (18°C)', hazmatStatus: 'None', lastAuditDaysAgo: 2, isLocked: false },
        { id: 'A7', block: 'AMBIENT', capacityPercent: 62, activeSKUs: 3, totalPallets: 21, maxPallets: 34, temp: 'Ambient (18°C)', hazmatStatus: 'None', lastAuditDaysAgo: 1, isLocked: false },

        { id: 'B1', block: 'COLD STORAGE', capacityPercent: 52, activeSKUs: 3, totalPallets: 13, maxPallets: 25, temp: 'Cold (-4°C)', hazmatStatus: 'None', lastAuditDaysAgo: 1, isLocked: false },
        { id: 'B2', block: 'COLD STORAGE', capacityPercent: 92, activeSKUs: 5, totalPallets: 23, maxPallets: 25, temp: 'Cold (-5°C)', hazmatStatus: 'None', lastAuditDaysAgo: 2, isLocked: false },
        { id: 'B3', block: 'COLD STORAGE', capacityPercent: 96, activeSKUs: 6, totalPallets: 24, maxPallets: 25, temp: 'Cold (-3°C)', hazmatStatus: 'None', lastAuditDaysAgo: 3, isLocked: false },
        { id: 'B4', block: 'COLD STORAGE', capacityPercent: 8, activeSKUs: 1, totalPallets: 2, maxPallets: 25, temp: 'Cold (-4°C)', hazmatStatus: 'None', lastAuditDaysAgo: 2, isLocked: false },
        { id: 'B5', block: 'COLD STORAGE', capacityPercent: 12, activeSKUs: 1, totalPallets: 3, maxPallets: 25, temp: 'Cold (-4°C)', hazmatStatus: 'None', lastAuditDaysAgo: 4, isLocked: false },
        { id: 'B6', block: 'COLD STORAGE', capacityPercent: 48, activeSKUs: 3, totalPallets: 12, maxPallets: 25, temp: 'Cold (-4°C)', hazmatStatus: 'None', lastAuditDaysAgo: 1, isLocked: false },
        { id: 'B7', block: 'COLD STORAGE', capacityPercent: 60, activeSKUs: 4, totalPallets: 15, maxPallets: 25, temp: 'Cold (-4°C)', hazmatStatus: 'None', lastAuditDaysAgo: 3, isLocked: false },

        { id: 'C1', block: 'HAZMAT', capacityPercent: 10, activeSKUs: 1, totalPallets: 2, maxPallets: 20, temp: 'Ventilated (21°C)', hazmatStatus: 'Class 3 Flammable', lastAuditDaysAgo: 1, isLocked: false },
        { id: 'C2', block: 'HAZMAT', capacityPercent: 15, activeSKUs: 2, totalPallets: 3, maxPallets: 20, temp: 'Ventilated (21°C)', hazmatStatus: 'Class 3 Flammable', lastAuditDaysAgo: 2, isLocked: false },
        { id: 'C3', block: 'HAZMAT', capacityPercent: 45, activeSKUs: 3, totalPallets: 9, maxPallets: 20, temp: 'Ventilated (20°C)', hazmatStatus: 'Class 8 Corrosive', lastAuditDaysAgo: 1, isLocked: false },
        { id: 'C4', block: 'HAZMAT', capacityPercent: 95, activeSKUs: 5, totalPallets: 19, maxPallets: 20, temp: 'Ventilated (21°C)', hazmatStatus: 'Class 3 Flammable', lastAuditDaysAgo: 1, isLocked: true },
        { id: 'C5', block: 'HAZMAT', capacityPercent: 90, activeSKUs: 4, totalPallets: 18, maxPallets: 20, temp: 'Ventilated (21°C)', hazmatStatus: 'Class 8 Corrosive', lastAuditDaysAgo: 2, isLocked: false }
    ]);

    const [staffList, setStaffList] = useState([
        { id: 'EMP-8492', firstName: 'Alice', lastName: 'Smith', email: 'alice.s@logistics-os.com', role: 'Super Admin', zoneAssignment: 'Global Access', status: 'Active' },
        { id: 'EMP-9104', firstName: 'Marcus', lastName: 'Reid', email: 'm.reid@logistics-os.com', role: 'Warehouse Manager', zoneAssignment: 'Zone A, Zone B', status: 'Active' },
        { id: 'EMP-1102', firstName: 'Terry', lastName: 'Crews', email: 't.crews@logistics-os.com', role: 'Picker', zoneAssignment: 'Aisle 4-12', status: 'Active' },
        { id: 'EMP-9921', firstName: 'Sarah', lastName: 'Jenkins', email: 's.jenkins@logistics-os.com', role: 'Packer', zoneAssignment: 'Station B', status: 'Suspended' }
    ]);

    const [allocationsLog, setAllocationsLog] = useState([
        { timestamp: '09:35', sku: 'SKU-10492', productName: 'Płyn hamulcowy DOT-4', zone: 'C3', qty: 12, type: 'Inbound Receive', user: 'Terry Crews (EMP-1102)' },
        { timestamp: '09:12', sku: 'SKU-20391', productName: 'Reflektor LED H7 SuperVolt', zone: 'A1', qty: 5, type: 'Internal Relocation', user: 'Marcus Reid (EMP-9104)' }
    ]);

    const loadUsers = async () => {
        setUsersSync({ isLoading: true, error: '' });

        try {
            const backendUsers = await fetchUsers();
            setStaffList(backendUsers);
            setUsersSync({ isLoading: false, error: '' });
        } catch (error) {
            console.error('Users backend unavailable:', error);
            setUsersSync({
                isLoading: false,
                error: 'Backend users niedostepny - uzywam danych lokalnych.',
            });
        }
    };

    const loadInventory = async (shouldIgnore = () => false) => {
        setInventorySync({ isLoading: true, error: '' });

        try {
            const backendProducts = await fetchInventoryProducts();
            if (shouldIgnore()) return;

            setProducts(backendProducts);
            setInventorySync({ isLoading: false, error: '' });
        } catch (error) {
            if (shouldIgnore()) return;

            console.error('Inventory backend unavailable:', error);
            setInventorySync({
                isLoading: false,
                error: 'Backend inventory niedostepny - uzywam danych lokalnych.',
            });
        }
    };

    useEffect(() => {
        let shouldIgnore = false;

        loadInventory(() => shouldIgnore);

        return () => {
            shouldIgnore = true;
        };
    }, []);

    useEffect(() => {
        loadUsers();
    }, []);

    // Handle Login and Logout
    const handleLoginSuccess = (userObj) => {
        setCurrentUser(userObj);
        window.localStorage.setItem('wms-current-user', JSON.stringify(userObj));
        setInLobby(true);
        loadUsers();
    };

    const handleLogout = () => {
        setCurrentUser(null);
        window.localStorage.removeItem('wms-current-user');
        setInLobby(false);
    };

    // State mutators for dashboard allocations and products
    const handleAddAllocation = (newAlloc) => {
        setAllocationsLog([newAlloc, ...allocationsLog]);

        // Dynamically adjust inventory stock levels and zone capacity
        setProducts(prev => {
            return prev.map(p => {
                if (p.sku === newAlloc.sku) {
                    const updatedStock = p.stock + (newAlloc.qty * 10); // Standard multiply factor of pallets
                    let computedStatus = 'In Stock';
                    if (updatedStock === 0) computedStatus = 'Out of Stock';
                    else if (updatedStock < p.reorderThreshold) computedStatus = 'Low Stock';
                    return {
                        ...p,
                        stock: updatedStock,
                        status: computedStatus
                    };
                }
                return p;
            });
        });

        // Update zone pallet metrics
        setZones(prev => {
            return prev.map(z => {
                if (z.id === newAlloc.zone) {
                    const newPallets = Math.min(z.maxPallets, z.totalPallets + newAlloc.qty);
                    const computedPercent = Math.round((newPallets / z.maxPallets) * 100);
                    return {
                        ...z,
                        totalPallets: newPallets,
                        capacityPercent: computedPercent
                    };
                }
                return z;
            });
        });
    };

    // Outbound order adding
    const handleAddOrder = (newOrder) => {
        setOrders([newOrder, ...orders]);

        // Reduce corresponding items stock!
        newOrder.items.forEach(orderItem => {
            setProducts(prev => {
                return prev.map(p => {
                    if (p.name.includes(orderItem.name) || orderItem.name.includes(p.name)) {
                        const updatedStock = Math.max(0, p.stock - orderItem.qty);
                        let computedStatus = 'In Stock';
                        if (updatedStock === 0) computedStatus = 'Out of Stock';
                        else if (updatedStock < p.reorderThreshold) computedStatus = 'Low Stock';
                        return {
                            ...p,
                            stock: updatedStock,
                            status: computedStatus
                        };
                    }
                    return p;
                });
            });
        });
    };

    // Modify SKU stock through backend and reload inventory.
    const handleUpdateStock = async (product, delta) => {
        await adjustInventoryStock({
            productId: product.productId,
            sku: product.sku,
            delta,
            locationId: product.primaryLocationId,
        });

        await loadInventory();
    };

    const handleRestockItem = (product) => {
        return handleUpdateStock(product, 100);
    };

    // Toggle security locks on aisle
    const handleToggleLockZone = (zoneId) => {
        setZones(prev => {
            return prev.map(z => {
                if (z.id === zoneId) {
                    return { ...z, isLocked: !z.isLocked };
                }
                return z;
            });
        });
    };

    // Add staff user
    const handleAddStaff = async (newStaff) => {
        const savedUser = await createUser(newStaff);
        setStaffList(prev => [...prev, savedUser]);
        return savedUser;
    };

    // Conditional Rendering
    if (!currentUser) {
        return <Login onLoginSuccess={handleLoginSuccess} />;
    }

    if (inLobby) {
        return <Home onEnterDashboard={() => setInLobby(false)} currentUser={currentUser} />;
    }

    // Sidebar navigation options
    const sideNavItems = [
        { id: 'overview', label: 'Inventory Overview', icon: LayoutDashboard },
        { id: 'orders', label: 'Order Management', icon: FileText },
        { id: 'products', label: 'SKUs Inventory', icon: Package },
        { id: 'zones', label: 'Warehouse Zones', icon: Map },
        { id: 'permissions', label: 'User Permissions', icon: ShieldAlert },
    ];

    return (
        <div className="bg-[#f8f9ff] text-[#0b1c30] min-h-screen font-sans shrink-0 antialiased flex">

            {/* Sidebar Navigation */}
            <nav className={`fixed left-0 top-0 h-full w-[260px] bg-[#131b2e] border-r border-[#1f2937] flex flex-col py-6 z-40 transition-transform duration-300 lg:translate-x-0 ${
                isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
            }`}>
                {/* Brand header elements */}
                <div className="px-6 mb-8 flex items-center gap-3">
                    <div className="w-9 h-9 rounded bg-[#2170e4] flex items-center justify-center text-white shadow-md">
                        <Boxes className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="font-bold text-base tracking-tight text-white leading-tight">Logistics OS</h1>
                        <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest mt-0.5 leading-none">Warehouse Control</p>
                    </div>
                </div>

                {/* Side panels menu list */}
                <ul className="flex flex-col gap-1 px-3 flex-grow">
                    {sideNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentTab === item.id;
                        return (
                            <li key={item.id}>
                                <button
                                    onClick={() => {
                                        setCurrentTab(item.id);
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-all font-sans text-xs font-bold ${
                                        isActive
                                            ? 'bg-white/5 border-l-4 border-[#2170e4] text-[#d8e2ff] font-extrabold pl-3 scale-[1.02]'
                                            : 'text-zinc-400 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    <Icon className="w-4.5 h-4.5 text-zinc-400 group-hover:text-white" />
                                    <span>{item.label}</span>
                                </button>
                            </li>
                        );
                    })}
                </ul>

                {/* Footer info & Logout button */}
                <div className="mt-auto px-4 pt-4 border-t border-white/10 space-y-3">
                    <button
                        onClick={() => setInLobby(true)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-md text-xs font-bold transition-all"
                    >
                        <HomeIcon className="w-4 h-4 text-zinc-400" />
                        <span>Powrót do lobby</span>
                    </button>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-md text-xs font-bold transition-all"
                    >
                        <LogOut className="w-4 h-4 text-zinc-400" />
                        <span>Wyloguj (Sign Out)</span>
                    </button>
                </div>
            </nav>

            {/* Main Workspace Frame container */}
            <div className="flex-1 lg:ml-[260px] flex flex-col min-h-screen">

                {/* Core Header Viewport link */}
                <Header
                    currentTab={currentTab}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    currentUser={currentUser}
                    onLogout={handleLogout}
                    onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                />

                {/* Mobile menu dim overlay */}
                {isMobileMenuOpen && (
                    <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
                )}

                {/* Dynamic Page switcher */}
                <main className="mt-14 p-6 flex-grow max-w-[1600px] w-full mx-auto flex flex-col gap-6">
                    {inventorySync.isLoading && (
                        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded text-xs font-semibold">
                            Laczenie z backendem inventory...
                        </div>
                    )}

                    {inventorySync.error && (
                        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded text-xs font-semibold">
                            {inventorySync.error}
                        </div>
                    )}

                    {currentTab === 'overview' && (
                        <Dashboard
                            products={products}
                            zones={zones}
                            allocationsLog={allocationsLog}
                            onAddAllocation={handleAddAllocation}
                        />
                    )}

                    {currentTab === 'orders' && (
                        <Orders
                            orders={orders}
                            products={products}
                            onAddOrder={handleAddOrder}
                        />
                    )}

                    {currentTab === 'products' && (
                        <Products
                            products={products}
                            onUpdateStock={handleUpdateStock}
                            onRestockItem={handleRestockItem}
                        />
                    )}

                    {currentTab === 'zones' && (
                        <Storage
                            zones={zones}
                            products={products}
                            onToggleLockZone={handleToggleLockZone}
                        />
                    )}

                    {currentTab === 'permissions' && (
                        <UsersPermissions
                            staffList={staffList}
                            onAddStaff={handleAddStaff}
                            usersSync={usersSync}
                        />
                    )}
                </main>

                {/* Footer brand info */}
                <Footer />
            </div>
        </div>
    );
}
