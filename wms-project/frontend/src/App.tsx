import React, { useEffect, useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import ProfileModal from './components/ProfileModal';
import Login from './pages/Login';
import Home from './pages/Home';
import Dashboard from './pages/AdminPanel/Dashboard';
import Orders from './pages/AdminPanel/Orders';
import Products from './pages/AdminPanel/Products';
import Storage from './pages/AdminPanel/Storage';
import UsersPermissions from './pages/AdminPanel/Users';
import Statistics from './pages/AdminPanel/Statistics';
import Settings from './pages/AdminPanel/Settings';
import WorkerTerminalStandAlone from './pages/WorkerTerminalStandAlone';
import { adjustInventoryStock, fetchInventoryProducts, Product } from './services/inventoryApi';
import { createUser, fetchUsers, updateUser, deleteUser, User } from './services/usersApi';
import { LayoutDashboard, FileText, Map, ShieldAlert, Boxes, LogOut, Package, Home as HomeIcon, BarChart3, Settings as SettingsNavIcon } from 'lucide-react';

const getRelativeDateStr = (daysAgo: number, timeStr: string) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const months = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'];
    return `${d.getDate()} ${months[d.getMonth()]}, ${timeStr}`;
};

const readStoredUser = () => {
    if (typeof window === 'undefined') return null;

    try {
        const item = window.localStorage.getItem('wms-current-user');
        return item ? JSON.parse(item) : null;
    } catch {
        return null;
    }
};

const readStoredInLobby = () => {
    if (typeof window === 'undefined') return true;
    const stored = window.localStorage.getItem('wms-in-lobby');
    return stored !== 'false';
};

const readStoredTab = () => {
    if (typeof window === 'undefined') return 'overview';
    return window.localStorage.getItem('wms-current-tab') || 'overview';
};

export default function App() {
    const [currentUser, setCurrentUser] = useState<User | null>(() => readStoredUser());
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    const [inLobby, setInLobby] = useState(() => readStoredInLobby());
    const [currentTab, setCurrentTab] = useState(() => readStoredTab());
    const [searchQuery, setSearchQuery] = useState('');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [inventorySync, setInventorySync] = useState({ isLoading: false, error: '' });
    const [usersSync, setUsersSync] = useState({ isLoading: false, error: '' });

    const [products, setProducts] = useState<Product[]>([
        { productId: 1, sku: 'SKU-10492', name: 'Płyn hamulcowy DOT-4', category: 'Artykuły chemiczne', stock: 120, reorderThreshold: 100, zone: 'C3', status: 'In Stock', price: 34.99, locationCode: 'C-03-01-01', zoneGroup: 'General', primaryLocationId: 1, locations: ['C-03-01-01'], zoneGroups: ['General'], stockEntries: [{ stockId: 1, locationId: 1, locationCode: 'C-03-01-01', zoneGroup: 'General', quantity: 120 }] },
        { productId: 2, sku: 'SKU-20391', name: 'Reflektor LED H7 SuperVolt', category: 'Części samochodowe', stock: 15, reorderThreshold: 40, zone: 'A1', status: 'Low Stock', price: 289.00, locationCode: 'A-01-01-02', zoneGroup: 'General', primaryLocationId: 2, locations: ['A-01-01-02'], zoneGroups: ['General'], stockEntries: [{ stockId: 2, locationId: 2, locationCode: 'A-01-01-02', zoneGroup: 'General', quantity: 15 }] },
        { productId: 3, sku: 'SKU-94021', name: 'Akumulator VoltPro 74Ah 12V', category: 'Części samochodowe', stock: 0, reorderThreshold: 15, zone: 'A2', status: 'Out of Stock', price: 449.99, locationCode: 'A-02-01-01', zoneGroup: 'General', primaryLocationId: 3, locations: [], zoneGroups: ['General'], stockEntries: [] },
        { productId: 4, sku: 'SKU-50493', name: 'Olej silnikowy Syntetic 5W30', category: 'Artykuły chemiczne', stock: 8, reorderThreshold: 20, zone: 'C2', status: 'Low Stock', price: 179.99, locationCode: 'C-02-03-01', zoneGroup: 'General', primaryLocationId: 4, locations: ['C-02-03-01'], zoneGroups: ['General'], stockEntries: [{ stockId: 4, locationId: 4, locationCode: 'C-02-03-01', zoneGroup: 'General', quantity: 8 }] },
        { productId: 5, sku: 'SKU-73012', name: 'Klocki hamulcowe CarbonPremium', category: 'Części samochodowe', stock: 245, reorderThreshold: 80, zone: 'A3', status: 'In Stock', price: 134.99, locationCode: 'A-03-01-01', zoneGroup: 'General', primaryLocationId: 5, locations: ['A-03-01-01'], zoneGroups: ['General'], stockEntries: [{ stockId: 5, locationId: 5, locationCode: 'A-03-01-01', zoneGroup: 'General', quantity: 245 }] },
        { productId: 6, sku: 'SKU-39402', name: 'Prostownik mikroprocesorowy 12V', category: 'Elektronika', stock: 85, reorderThreshold: 15, zone: 'B2', status: 'In Stock', price: 249.00, locationCode: 'B-02-01-03', zoneGroup: 'General', primaryLocationId: 6, locations: ['B-02-01-03'], zoneGroups: ['General'], stockEntries: [{ stockId: 6, locationId: 6, locationCode: 'B-02-01-03', zoneGroup: 'General', quantity: 85 }] }
    ]);

    const [orders, setOrders] = useState<any[]>([
        {
            id: 'ORD-89241',
            customer: 'Acme Corp Logistics',
            destination: 'Seattle, WA',
            status: 'W realizacji',
            priority: 'Wysoki',
            shipmentDate: getRelativeDateStr(0, '14:30'),
            items: [{ name: 'Kawa ziarnista Arabica 1kg', sku: 'FOOD-KAWA-001', qty: 15 }]
        },
        {
            id: 'ORD-89240',
            customer: 'Global Imports LLC',
            destination: 'Miami, FL',
            status: 'Wysłane',
            priority: 'Normalny',
            shipmentDate: getRelativeDateStr(1, '09:15'),
            items: [{ name: 'Klocki hamulcowe przednie', sku: 'AUTO-KLOCKI-001', qty: 50 }]
        },
        {
            id: 'ORD-89239',
            customer: 'TechNova Dist.',
            destination: 'Austin, TX',
            status: 'Oczekujące',
            priority: 'Normalny',
            shipmentDate: 'Nieustalony',
            items: [{ name: 'Akumulator 74Ah 12V', sku: 'AUTO-AKU-001', qty: 25 }]
        },
        {
            id: 'ORD-89238',
            customer: 'VeloSpeed Sp. z o.o.',
            destination: 'Poznań, PL',
            status: 'Oczekujące',
            priority: 'Normalny',
            shipmentDate: 'Nieustalony',
            items: [
                { name: 'Skaner kodów kreskowych USB', sku: 'ELEC-SKAN-001', qty: 5 },
                { name: 'Bateria do skanera 2600mAh', sku: 'ELEC-BAT-001', qty: 20 }
            ]
        },
        {
            id: 'ORD-89237',
            customer: 'ElectroWorld S.A.',
            destination: 'Warszawa, PL',
            status: 'W realizacji',
            priority: 'Wysoki',
            shipmentDate: getRelativeDateStr(0, '11:00'),
            items: [
                { name: 'Papier A4 500 arkuszy', sku: 'BIUR-PAP-001', qty: 30 },
                { name: 'Etykiety logistyczne 100x150', sku: 'BIUR-ETY-001', qty: 15 }
            ]
        },
        {
            id: 'ORD-89236',
            customer: 'Apex Logistics Europe',
            destination: 'Gdańsk, PL',
            status: 'Dostarczone',
            priority: 'Normalny',
            shipmentDate: 'Ukończono',
            items: [
                { name: 'Rękawice nitrylowe 100 szt', sku: 'CHEM-REK-001', qty: 10 },
                { name: 'Płyn do dezynfekcji 5L', sku: 'CHEM-PLY-001', qty: 5 }
            ]
        },
        {
            id: 'ORD-89235',
            customer: 'Krak-Tech Solutions',
            destination: 'Kraków, PL',
            status: 'Oczekujące',
            priority: 'Normalny',
            shipmentDate: 'Nieustalony',
            items: [
                { name: 'Tablet magazynowy 10 cali', sku: 'ELEC-TAB-001', qty: 2 },
                { name: 'Drukarka etykiet termiczna', sku: 'ELEC-DRUK-001', qty: 3 }
            ]
        },
        {
            id: 'ORD-89234',
            customer: 'Baltic Shipping',
            destination: 'Gdynia, PL',
            status: 'Wysłane',
            priority: 'Normalny',
            shipmentDate: getRelativeDateStr(3, '16:45'),
            items: [
                { name: 'Olej silnikowy 5W30 4L', sku: 'AUTO-OLEJ-001', qty: 8 },
                { name: 'Płyn hamulcowy DOT-4 1L', sku: 'AUTO-HAM-001', qty: 12 }
            ]
        },
        {
            id: 'ORD-89233',
            customer: 'Euro-Food Sp. z o.o.',
            destination: 'Wrocław, PL',
            status: 'Oczekujące',
            priority: 'Normalny',
            shipmentDate: 'Nieustalony',
            items: [
                { name: 'Mleko UHT 3.2% 1L', sku: 'FOOD-MLEKO-001', qty: 200 },
                { name: 'Ryż basmati 1kg', sku: 'FOOD-RYZ-001', qty: 50 }
            ]
        },
        {
            id: 'ORD-89232',
            customer: 'Bio-Chemia Polska',
            destination: 'Katowice, PL',
            status: 'Oczekujące',
            priority: 'Normalny',
            shipmentDate: 'Nieustalony',
            items: [
                { name: 'Płyn do dezynfekcji 5L', sku: 'CHEM-PLY-001', qty: 20 },
                { name: 'Rękawice nitrylowe 100 szt', sku: 'CHEM-REK-001', qty: 100 }
            ]
        }
    ]);

    const [zones, setZones] = useState<any[]>([
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

    const [staffList, setStaffList] = useState<User[]>([
        { id: 'EMP-8492', employeeId: 'EMP-8492', userId: '8492', firstName: 'System', lastName: 'Admin', email: 'admin@logistics-os.com', role: 'Admin', zoneAssignment: 'Global Access', status: 'Active', avatarUrl: null },
        { id: 'EMP-9104', employeeId: 'EMP-9104', userId: '9104', firstName: 'Wojtek', lastName: 'Nowak', email: 'manager@logistics-os.com', role: 'Warehouse Manager', zoneAssignment: 'Global Access', status: 'Active', avatarUrl: null },
        { id: 'EMP-1102', employeeId: 'EMP-1102', userId: '1102', firstName: 'Jan', lastName: 'Kowalski', email: 'j.kowalski@logistics-os.com', role: 'Picker', zoneAssignment: 'Aisle 4-12', status: 'Active', avatarUrl: null },
        { id: 'EMP-9921', employeeId: 'EMP-9921', userId: '9921', firstName: 'Mariusz', lastName: 'Pakosz', email: 'm.pakosz@logistics-os.com', role: 'Packer', zoneAssignment: 'Station B', status: 'Active', avatarUrl: null }
    ]);

    const [allocationsLog, setAllocationsLog] = useState<any[]>([
        { timestamp: '09:35', sku: 'SKU-10492', productName: 'Płyn hamulcowy DOT-4', zone: 'C3', qty: 12, type: 'Przyjęcie towaru', user: 'Jan Kowalski (EMP-1102)' },
        { timestamp: '09:12', sku: 'SKU-20391', productName: 'Reflektor LED H7 SuperVolt', zone: 'A1', qty: 5, type: 'Relokacja wewnętrzna', user: 'Wojtek Nowak (EMP-9104)' }
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
                error: 'Backend users niedostępny - używam danych lokalnych.',
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
                error: 'Backend inventory niedostępny - używam danych lokalnych.',
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

    const handleLoginSuccess = (userObj: User) => {
        setCurrentUser(userObj);
        window.localStorage.setItem('wms-current-user', JSON.stringify(userObj));
        setInLobby(true);
        window.localStorage.setItem('wms-in-lobby', 'true');
        loadUsers();
    };

    const handleLogout = () => {
        setCurrentUser(null);
        window.localStorage.removeItem('wms-current-user');
        window.localStorage.removeItem('wms-in-lobby');
        window.localStorage.removeItem('wms-current-tab');
        setInLobby(true);
    };

    const handleAddAllocation = (newAlloc: any) => {
        setAllocationsLog([newAlloc, ...allocationsLog]);

        setProducts(prev => {
            return prev.map(p => {
                if (p.sku === newAlloc.sku) {
                    const updatedStock = p.stock + (newAlloc.qty * 10); 
                    let computedStatus: 'In Stock' | 'Low Stock' | 'Out of Stock' = 'In Stock';
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

    const handleAddOrder = (newOrder: any) => {
        const enrichedOrder = {
            ...newOrder,
            internalNotesActor: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'System',
            waybillNumber: `DPD${newOrder.id.replace('ORD-', '')}PL`,
            waybillPdfDate: new Date().toLocaleDateString('pl-PL'),
            pickingZones: [
                { name: 'Strefa A', percentage: 100 }
            ],
            activityHistory: [
                { 
                    id: `act-${Date.now()}`, 
                    title: 'Utworzono zlecenie wyjazdu', 
                    actor: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'System', 
                    date: new Date().toLocaleDateString('pl-PL') 
                }
            ],
            changeLogs: []
        };
        
        setOrders([enrichedOrder, ...orders]);

        newOrder.items.forEach((orderItem: any) => {
            setProducts(prev => {
                return prev.map(p => {
                    if (p.name.includes(orderItem.name) || orderItem.name.includes(p.name)) {
                        const updatedStock = Math.max(0, p.stock - orderItem.qty);
                        let computedStatus: 'In Stock' | 'Low Stock' | 'Out of Stock' = 'In Stock';
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

    const handleUpdateOrder = (orderId: string, updatedFields: any) => {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updatedFields } : o));
    };

    const handleUpdateOrderStatus = (orderId: string, status: string) => {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    };

    const handleAddOrderChangeLog = (orderId: string, title: string, description: string) => {
        setOrders(prev => prev.map(o => {
            if (o.id === orderId) {
                const logs = o.changeLogs || [];
                const newLog = {
                    id: `log-${Date.now()}-${Math.random()}`,
                    title,
                    description,
                    date: new Date().toLocaleString('pl-PL'),
                    actor: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Użytkownik'
                };
                const history = o.activityHistory || [];
                const newAct = {
                    id: `act-${Date.now()}-${Math.random()}`,
                    title: `${title}: ${description}`,
                    actor: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Użytkownik',
                    date: new Date().toLocaleString('pl-PL')
                };
                return { 
                    ...o, 
                    changeLogs: [newLog, ...logs],
                    activityHistory: [newAct, ...history]
                };
            }
            return o;
        }));
    };

    const handleDeleteStaff = async (staffId: string) => {
        try {
            await deleteUser(staffId);
        } catch (error) {
            console.error('Delete user backend failed, doing local deletion:', error);
        }
        setStaffList(prev => prev.filter(u => (u.employeeId || u.id) !== staffId));
    };

    const handleUpdateStaff = async (staffId: string, updates: any) => {
        let updatedUser = { id: staffId, ...updates };
        try {
            const apiRes = await updateUser(staffId, updates);
            updatedUser = apiRes;
        } catch (error) {
            console.error('Update user backend failed, doing local update:', error);
        }
        setStaffList(prev => prev.map(u => (u.employeeId || u.id) === staffId ? { ...u, ...updatedUser } : u));
        return updatedUser;
    };

    const handleUpdateStock = async (product: Product, delta: number) => {
        await adjustInventoryStock({
            productId: product.productId,
            sku: product.sku,
            delta,
            locationId: product.primaryLocationId,
        });

        await loadInventory();
    };

    const handleRestockItem = (product: Product) => {
        return handleUpdateStock(product, 100);
    };

    const handleToggleLockZone = (zoneId: string) => {
        setZones(prev => {
            return prev.map(z => {
                if (z.id === zoneId) {
                    return { ...z, isLocked: !z.isLocked };
                }
                return z;
            });
        });
    };

    const handleAddStaff = async (newStaff: any) => {
        const savedUser = await createUser(newStaff);
        setStaffList(prev => [...prev, savedUser]);
        return savedUser;
    };

    const isTerminalRoute = window.location.pathname === '/terminal' || window.location.hash === '#/terminal';

    if (isTerminalRoute) {
        return (
            <WorkerTerminalStandAlone 
                orders={orders} 
                onUpdateOrder={handleUpdateOrder} 
                staffList={staffList}
            />
        );
    }

    if (!currentUser) {
        return <Login onLoginSuccess={handleLoginSuccess} />;
    }

    if (inLobby) {
        return (
            <Home
                onEnterDashboard={() => {
                    setInLobby(false);
                    window.localStorage.setItem('wms-in-lobby', 'false');
                }}
                currentUser={currentUser}
            />
        );
    }

    const sideNavItems = [
        { id: 'overview', label: 'Podgląd Magazynu', icon: LayoutDashboard },
        { id: 'statistics', label: 'Statystyki i Raporty', icon: BarChart3 },
        { id: 'orders', label: 'Zarządzanie Zamówieniami', icon: FileText },
        { id: 'products', label: 'Stany Zapasów SKU', icon: Package },
        { id: 'zones', label: 'Strefy Magazynowe', icon: Map },
        { id: 'permissions', label: 'Uprawnienia Użytkowników', icon: ShieldAlert },
        { id: 'settings', label: 'Ustawienia Systemu', icon: SettingsNavIcon },
    ];

    return (
        <div className="bg-[#f5f7fa] text-[#0b1c30] min-h-screen font-sans shrink-0 antialiased flex">
            <nav className={`fixed left-0 top-0 h-full w-[260px] bg-[#131b2e] border-r border-[#1f2937] flex flex-col py-6 z-40 transition-transform duration-300 lg:translate-x-0 ${
                isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
            }`}>
                <div className="px-6 mb-8 flex items-center gap-3 select-none">
                    <div className="w-9 h-9 rounded bg-[#2170e4] flex items-center justify-center text-white shadow-md animate-pulse">
                        <Boxes className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="font-bold text-base tracking-tight text-white leading-tight">Logistics OS</h1>
                        <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest mt-0.5 leading-none">Zarządzanie Magazynem</p>
                    </div>
                </div>

                <ul className="flex flex-col gap-1 px-3 flex-grow select-none">
                    {sideNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentTab === item.id;
                        return (
                            <li key={item.id}>
                                <button
                                    onClick={() => {
                                        setCurrentTab(item.id);
                                        window.localStorage.setItem('wms-current-tab', item.id);
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-all font-sans text-xs font-bold cursor-pointer border-none bg-transparent text-left outline-none ${
                                        isActive
                                            ? 'bg-white/5 border-l-4 border-[#2170e4] text-[#d8e2ff] font-extrabold pl-3 scale-[1.02]'
                                            : 'text-zinc-400 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    <Icon className="w-4.5 h-4.5 text-zinc-400" />
                                    <span>{item.label}</span>
                                </button>
                            </li>
                        );
                    })}
                </ul>

                <div className="mt-auto px-4 pt-4 border-t border-white/10 space-y-3 select-none">
                    <button
                        onClick={() => {
                            window.location.hash = '#/terminal';
                            window.location.reload();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-purple-300 hover:text-white hover:bg-purple-500/10 border border-purple-500/30 rounded-md text-xs font-bold transition-all cursor-pointer bg-[#1b253b]/50"
                    >
                        <Boxes className="w-4 h-4 text-purple-400" />
                        <span>Terminal Roboczy WMS 📲</span>
                    </button>

                    <button
                        onClick={() => {
                            setInLobby(true);
                            window.localStorage.setItem('wms-in-lobby', 'true');
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-md text-xs font-bold transition-all cursor-pointer border-none bg-transparent text-left outline-none"
                    >
                        <HomeIcon className="w-4 h-4 text-zinc-400" />
                        <span>Powrót do lobby</span>
                    </button>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-md text-xs font-bold transition-all cursor-pointer border-none bg-transparent text-left outline-none"
                    >
                        <LogOut className="w-4 h-4 text-zinc-400" />
                        <span>Wyloguj się</span>
                    </button>
                </div>
            </nav>

            <div className="flex-1 lg:ml-[260px] flex flex-col min-h-screen">
                <Header
                    currentTab={currentTab}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    currentUser={currentUser}
                    onLogout={handleLogout}
                    onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    onSettingsClick={() => setIsProfileModalOpen(true)}
                />

                {isMobileMenuOpen && (
                    <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
                )}

                <main className="mt-14 p-6 flex-grow max-w-[1600px] w-full mx-auto flex flex-col gap-6">
                    {inventorySync.isLoading && (
                        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded text-xs font-semibold animate-pulse select-none">
                            Łączenie z backendem..."
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

                    {currentTab === 'statistics' && (
                        <Statistics
                            orders={orders}
                            products={products}
                            zones={zones}
                            staffList={staffList}
                        />
                    )}

                    {currentTab === 'orders' && (
                        <Orders
                            orders={orders}
                            products={products}
                            onAddOrder={handleAddOrder}
                            onUpdateOrder={handleUpdateOrder}
                            onUpdateOrderStatus={handleUpdateOrderStatus}
                            onAddOrderChangeLog={handleAddOrderChangeLog}
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
                            onUpdateStaff={handleUpdateStaff}
                            onDeleteStaff={handleDeleteStaff}
                            usersSync={usersSync}
                        />
                    )}

                    {currentTab === 'settings' && (
                        <Settings />
                    )}
                </main>

                <Footer />
            </div>

            <ProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                currentUser={currentUser}
                onUpdateCurrentUser={(updatedUser) => {
                    setCurrentUser(updatedUser);
                    window.localStorage.setItem('wms-current-user', JSON.stringify(updatedUser));
                    // Synchronizacja zmian profilu na liście personelu staffList
                    if (updatedUser && staffList) {
                        setStaffList(prev => prev.map(staff => staff.employeeId === updatedUser.employeeId || staff.id === updatedUser.id ? { ...staff, ...updatedUser } : staff));
                    }
                }}
            />
        </div>
    );
}
