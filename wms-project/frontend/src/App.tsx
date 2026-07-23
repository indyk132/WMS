import React, { useEffect, useState, useRef } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import ProfileModal from './components/ProfileModal';
import Login from './pages/Login';
import Home from './pages/Home';
import Dashboard from './pages/AdminPanel/Dashboard';
import Orders from './pages/AdminPanel/Orders';
import Products from './pages/AdminPanel/Products';
import SalesProducts from './pages/AdminPanel/SalesProducts';
import Storage from './pages/AdminPanel/Storage';
import UsersPermissions from './pages/AdminPanel/Users';
import Statistics from './pages/AdminPanel/Statistics';
import Settings from './pages/AdminPanel/Settings';
import WorkerTerminalStandAlone from './pages/WorkerTerminalStandAlone';
import Supplies from './pages/AdminPanel/Supplies';
import RmaManager from './pages/AdminPanel/RmaManager';
import ShippingHub from './pages/AdminPanel/ShippingHub';
import InboundPlanner from './pages/AdminPanel/InboundPlanner';
import SlottingOptimizer from './pages/AdminPanel/SlottingOptimizer';
import YardManager from './pages/AdminPanel/YardManager';
import ReorderPlanner from './pages/AdminPanel/ReorderPlanner';
import SpaceCompactor from './pages/AdminPanel/SpaceCompactor';
import PredictiveRelocation from './pages/AdminPanel/PredictiveRelocation';
import DockScheduling from './pages/AdminPanel/DockScheduling';
import WavePicking from './pages/AdminPanel/WavePicking';
import PutawayAssistant from './pages/AdminPanel/PutawayAssistant';
import LpnManager from './pages/AdminPanel/LpnManager';
import TruckLoader3D from './pages/AdminPanel/TruckLoader3D';
import ClickCollect from './pages/AdminPanel/ClickCollect';
import PickPathOptimizer from './pages/AdminPanel/PickPathOptimizer';
import AdrManager from './pages/AdminPanel/AdrManager';
import { adjustInventoryStock, fetchInventoryProducts, Product, createInventoryProduct, updateInventoryProduct, deleteInventoryProduct } from './services/inventoryApi';
import { createUser, fetchUsers, updateUser, deleteUser, User } from './services/usersApi';
import { fetchOrders as fetchOrdersApi, createOrder as createOrderApi, updateOrder as updateOrderApi, deleteOrder as deleteOrderApi } from './services/ordersApi';
import { fetchActivities, logActivityApi } from './services/activitiesApi';
import { LayoutDashboard, FileText, Map, ShieldAlert, Boxes, LogOut, Package, Home as HomeIcon, BarChart3, Settings as SettingsNavIcon, Layers, ShoppingBag, Truck, Info, AlertCircle, AlertTriangle, CheckCircle2, RotateCcw, Send, Combine, ShoppingCart, Shrink, Sparkles, Calendar, GitMerge, CornerDownRight, Tag, Compass, ChevronDown, ChevronRight, MapPin } from 'lucide-react';
import { sounds } from './components/SoundEffects';

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

const getDeterministicRandom = (seed: string) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  }
  return function() {
    h = Math.imul(h ^ h >>> 16, 2246822507);
    h = Math.imul(h ^ h >>> 13, 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
};

const generateMockStaffNames = () => {
  const firstNames = ['Jan', 'Marcin', 'Piotr', 'Krzysztof', 'Tomasz', 'Andrzej', 'Paweł', 'Janusz', 'Mateusz', 'Michał', 'Jakub', 'Adam', 'Łukasz', 'Kamil', 'Rafał', 'Wojciech', 'Robert', 'Sebastian', 'Patryk', 'Maciej', 'Mariusz', 'Dariusz', 'Grzegorz', 'Jacek', 'Zofia', 'Hanna', 'Anna', 'Katarzyna', 'Małgorzata', 'Agnieszka'];
  const lastNames = ['Nowak', 'Kowalski', 'Wiśniewski', 'Wójcik', 'Kowalczyk', 'Kamiński', 'Lewandowski', 'Zieliński', 'Szymański', 'Woźniak', 'Dąbrowski', 'Kozłowski', 'Mazur', 'Jankowski', 'Kwiatkowski', 'Wojciechowski', 'Krawczyk', 'Kaczmarek', 'Piotrowski', 'Grabowski'];
  
  const pickers: string[] = ['Jan Kowalski'];
  const packers: string[] = ['Mariusz Pakosz'];
  
  for (let i = 0; i < firstNames.length; i++) {
    for (let j = 0; j < lastNames.length; j++) {
      const name = `${firstNames[i]} ${lastNames[j]}`;
      if (name === 'Jan Kowalski' || name === 'Mariusz Pakosz') continue;
      const hash = i * 17 + j * 31;
      if (hash % 2 === 0) {
        pickers.push(name);
      } else {
        packers.push(name);
      }
      if (pickers.length + packers.length >= 150) break;
    }
    if (pickers.length + packers.length >= 150) break;
  }
  return { pickers, packers };
};

const generateMockOrders = () => {
  const customers = [
    'Acme Corp Logistics', 'Global Imports LLC', 'TechNova Dist.', 'VeloSpeed Sp. z o.o.',
    'ElectroWorld S.A.', 'Apex Logistics Europe', 'Krak-Tech Solutions', 'Baltic Shipping',
    'Euro-Food Sp. z o.o.', 'Bio-Chemia Polska', 'Hurtownia Części Auto', 'Centrum Poznań',
    'Import-Export Gdańsk', 'Logistyka Polska S.A.', 'Silesia Parts Sp. z o.o.'
  ];
  const destinations = [
    'Seattle, WA', 'Miami, FL', 'Austin, TX', 'Poznań, PL', 'Warszawa, PL', 'Gdańsk, PL',
    'Kraków, PL', 'Gdynia, PL', 'Wrocław, PL', 'Katowice, PL', 'Łódź, PL', 'Szczecin, PL',
    'Bydgoszcz, PL', 'Lublin, PL', 'Białystok, PL'
  ];
  const productPool = [
    { name: 'Kawa ziarnista Arabica 1kg', sku: 'FOOD-KAWA-001', price: 49.99 },
    { name: 'Klocki hamulcowe przednie', sku: 'AUTO-KLOCKI-001', price: 120.00 },
    { name: 'Akumulator 74Ah 12V', sku: 'AUTO-AKU-001', price: 299.00 },
    { name: 'Skaner kodów kreskowych USB', sku: 'ELEC-SKAN-001', price: 189.99 },
    { name: 'Bateria do skanera 2600mAh', sku: 'ELEC-BAT-001', price: 39.99 },
    { name: 'Papier A4 500 arkuszy', sku: 'BIUR-PAP-001', price: 19.99 },
    { name: 'Etykiety logistyczne 100x150', sku: 'BIUR-ETY-001', price: 25.00 },
    { name: 'Rękawice nitrylowe 100 szt', sku: 'CHEM-REK-001', price: 15.50 },
    { name: 'Płyn do dezynfekcji 5L', sku: 'CHEM-PLY-001', price: 45.00 }
  ];

  const { pickers, packers } = generateMockStaffNames();
  
  const ordersList: any[] = [];
  let orderIdNum = 89500;
  
  const rand = getDeterministicRandom("wms-orders-seed-2026");
  
  for (let i = 0; i < 250; i++) {
    const orderId = `ORD-${orderIdNum--}`;
    const daysAgo = Math.floor(rand() * 28);
    const hour = String(Math.floor(8 + rand() * 12)).padStart(2, '0');
    const min = String(Math.floor(rand() * 60)).padStart(2, '0');
    const timeStr = `${hour}:${min}`;
    const shipmentDate = getRelativeDateStr(daysAgo, timeStr);
    
    const cust = customers[Math.floor(rand() * customers.length)];
    const dest = destinations[Math.floor(rand() * destinations.length)];
    const prio = rand() < 0.2 ? 'Wysoki' : 'Normalny';
    const wh = rand() < 0.6 ? 'HUB-PL-01' : 'HUB-PL-02';
    
    let status = 'Oczekujące';
    if (i < 50) status = 'Do kompletacji';
    else if (i < 65) status = 'W kompletacji';
    else if (i < 115) status = 'Oczekuje na pakowanie';
    else if (i < 175) status = 'Spakowane';
    else if (i < 225) status = 'Wysłane';
    else if (i < 240) status = 'Dostarczone';
    else status = 'Oczekujące';
    
    const itemsCount = Math.floor(1 + rand() * 3);
    const orderItems: any[] = [];
    const chosenSkus = new Set();
    
    for (let k = 0; k < itemsCount; k++) {
      const p = productPool[Math.floor(rand() * productPool.length)];
      if (!chosenSkus.has(p.sku)) {
        chosenSkus.add(p.sku);
        orderItems.push({
          name: p.name,
          sku: p.sku,
          qty: Math.floor(1 + rand() * 15)
        });
      }
    }
    
    let notes = '';
    let actor = 'System';
    const hasBeenPicked = ['Oczekuje na pakowanie', 'Spakowane', 'Wysłane', 'Dostarczone'].includes(status);
    const hasBeenPacked = ['Spakowane', 'Wysłane', 'Dostarczone'].includes(status);
    
    let binId = '';
    let pickedBy = '';
    let pickCompletedTime = '';

    if (hasBeenPicked) {
      const picker = pickers[Math.floor(rand() * pickers.length)];
      notes += `[PICKER]: Kompletacja zakończona przez ${picker}. Czas: ${Math.floor(1 + rand() * 4)}m ${Math.floor(rand() * 60)}s.`;
      actor = picker;
      pickedBy = picker;
      binId = `BIN-${String(Math.floor(1 + rand() * 50)).padStart(3, '0')}`;
      pickCompletedTime = timeStr;
    }
    
    if (hasBeenPacked) {
      const packer = packers[Math.floor(rand() * packers.length)];
      notes += `\n[PACKER]: Spakowano do Karton Średni M o wadze ${(1 + rand() * 6).toFixed(2)}kg przez ${packer}. Wygenerowano etykietę DPD.`;
      actor = packer;
    }
    
    ordersList.push({
      id: orderId,
      customer: cust,
      destination: dest,
      status,
      priority: prio,
      shipmentDate,
      items: orderItems,
      warehouseCode: wh,
      internalNotes: notes.trim(),
      internalNotesActor: actor,
      isPacked: hasBeenPacked,
      binId: hasBeenPicked ? binId : undefined,
      pickedBy: hasBeenPicked ? pickedBy : undefined,
      pickCompletedTime: hasBeenPicked ? pickCompletedTime : undefined
    });
  }
  
  return ordersList;
};

export default function App() {
    const [currentUser, setCurrentUser] = useState<User | null>(() => readStoredUser());
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    const getSideNavItems = () => {
        if (!currentUser) return [];
        const role = currentUser.role;

        switch (role) {
            case 'Sales Manager':
                return [
                    { id: 'statistics', label: 'Statystyki i Raporty', icon: BarChart3 },
                    { id: 'orders', label: 'Zarządzanie Zamówieniami', icon: FileText },
                    { id: 'rma', label: 'Obsługa Zwrotów (RMA)', icon: RotateCcw },
                    { id: 'click_collect', label: 'Punkt Odbioru (BOPIS)', icon: MapPin },
                    { id: 'inventory', label: 'Stany Zapasów SKU', icon: Package },
                    { id: 'products', label: 'Katalog Produktów', icon: Layers },
                    { id: 'storefront', label: 'Sklep Internetowy ↗', icon: ShoppingBag, isExternal: true },
                ];
            case 'Logistics Planner':
                return [
                    { id: 'overview', label: 'Podgląd Magazynu', icon: LayoutDashboard },
                    { id: 'statistics', label: 'Statystyki i Raporty', icon: BarChart3 },
                    { id: 'supplies', label: 'Dostawy (Zamówienia PO)', icon: Truck },
                    { id: 'inbound', label: 'Planowanie Przyjęć (Inbound)', icon: Boxes },
                    { id: 'putaway', label: 'Rozmieszczenie (Dock-to-Stock)', icon: CornerDownRight },
                    { id: 'yard', label: 'Zarządzanie Placem (YMS)', icon: Truck },
                    { id: 'dock_scheduling', label: 'Awizacje i Bramy (YMS)', icon: Calendar },
                    { id: 'reorders', label: 'Planowanie Uzupełnień (Min-Max)', icon: ShoppingCart },
                    { id: 'slotting', label: 'Optymalizacja Zapasów (ABC/XYZ)', icon: Combine },
                    { id: 'compactor', label: 'Konsolidacja Miejsc (BHP)', icon: Shrink },
                    { id: 'pick_path', label: 'Optymalizacja Tras', icon: Compass },
                    { id: 'inventory', label: 'Stany Zapasów SKU', icon: Package },
                    { id: 'products', label: 'Katalog Produktów', icon: Layers },
                    { id: 'zones', label: 'Strefy Magazynowe', icon: Map },
                    { id: 'adr_manager', label: 'Zgodność Chemiczna (ADR)', icon: AlertTriangle },
                    { id: 'storefront', label: 'Sklep Internetowy ↗', icon: ShoppingBag, isExternal: true },
                ];
            case 'Inventory Auditor':
                return [
                    { id: 'overview', label: 'Podgląd Magazynu', icon: LayoutDashboard },
                    { id: 'slotting', label: 'Optymalizacja Zapasów (ABC/XYZ)', icon: Combine },
                    { id: 'compactor', label: 'Konsolidacja Miejsc (BHP)', icon: Shrink },
                    { id: 'inventory', label: 'Stany Zapasów SKU', icon: Package },
                    { id: 'products', label: 'Katalog Produktów', icon: Layers },
                    { id: 'zones', label: 'Strefy Magazynowe', icon: Map },
                    { id: 'adr_manager', label: 'Zgodność Chemiczna (ADR)', icon: AlertTriangle },
                    { id: 'storefront', label: 'Sklep Internetowy ↗', icon: ShoppingBag, isExternal: true },
                ];
            case 'Picker':
            case 'Packer':
                return [
                    { id: 'overview', label: 'Podgląd Magazynu', icon: LayoutDashboard },
                    { id: 'inventory', label: 'Stany Zapasów SKU', icon: Package },
                ];
            case 'Warehouse Manager':
                return [
                    { id: 'overview', label: 'Podgląd Magazynu', icon: LayoutDashboard },
                    { id: 'statistics', label: 'Statystyki i Raporty', icon: BarChart3 },
                    { id: 'orders', label: 'Zarządzanie Zamówieniami', icon: FileText },
                    { id: 'wave_picking', label: 'Zbiórka Falowa', icon: GitMerge },
                    { id: 'supplies', label: 'Dostawy (Zamówienia PO)', icon: Truck },
                    { id: 'inbound', label: 'Planowanie Przyjęć (Inbound)', icon: Boxes },
                    { id: 'putaway', label: 'Rozmieszczenie (Dock-to-Stock)', icon: CornerDownRight },
                    { id: 'lpn_manager', label: 'Obsługa Palet (LPN)', icon: Tag },
                    { id: 'yard', label: 'Zarządzanie Placem (YMS)', icon: Truck },
                    { id: 'dock_scheduling', label: 'Awizacje i Bramy (YMS)', icon: Calendar },
                    { id: 'reorders', label: 'Planowanie Uzupełnień (Min-Max)', icon: ShoppingCart },
                    { id: 'slotting', label: 'Optymalizacja Zapasów (ABC/XYZ)', icon: Combine },
                    { id: 'compactor', label: 'Konsolidacja Miejsc (BHP)', icon: Shrink },
                    { id: 'predictive', label: 'Optymalizacja Fast-Pick', icon: Sparkles },
                    { id: 'pick_path', label: 'Optymalizacja Tras', icon: Compass },
                    { id: 'rma', label: 'Obsługa Zwrotów (RMA)', icon: RotateCcw },
                    { id: 'shipping', label: 'Centrum Wysyłek (Broker)', icon: Send },
                    { id: 'truck_loader', label: 'Symulator 3D Załadunku', icon: Truck },
                    { id: 'click_collect', label: 'Punkt Odbioru (BOPIS)', icon: MapPin },
                    { id: 'inventory', label: 'Stany Zapasów SKU', icon: Package },
                    { id: 'products', label: 'Katalog Produktów', icon: Layers },
                    { id: 'zones', label: 'Strefy Magazynowe', icon: Map },
                    { id: 'adr_manager', label: 'Zgodność Chemiczna (ADR)', icon: AlertTriangle },
                    { id: 'storefront', label: 'Sklep Internetowy ↗', icon: ShoppingBag, isExternal: true },
                ];
            case 'Admin':
            default:
                return [
                    { id: 'overview', label: 'Podgląd Magazynu', icon: LayoutDashboard },
                    { id: 'statistics', label: 'Statystyki i Raporty', icon: BarChart3 },
                    { id: 'orders', label: 'Zarządzanie Zamówieniami', icon: FileText },
                    { id: 'wave_picking', label: 'Zbiórka Falowa', icon: GitMerge },
                    { id: 'supplies', label: 'Dostawy (Zamówienia PO)', icon: Truck },
                    { id: 'inbound', label: 'Planowanie Przyjęć (Inbound)', icon: Boxes },
                    { id: 'putaway', label: 'Rozmieszczenie (Dock-to-Stock)', icon: CornerDownRight },
                    { id: 'lpn_manager', label: 'Obsługa Palet (LPN)', icon: Tag },
                    { id: 'yard', label: 'Zarządzanie Placem (YMS)', icon: Truck },
                    { id: 'dock_scheduling', label: 'Awizacje i Bramy (YMS)', icon: Calendar },
                    { id: 'reorders', label: 'Planowanie Uzupełnień (Min-Max)', icon: ShoppingCart },
                    { id: 'slotting', label: 'Optymalizacja Zapasów (ABC/XYZ)', icon: Combine },
                    { id: 'compactor', label: 'Konsolidacja Miejsc (BHP)', icon: Shrink },
                    { id: 'predictive', label: 'Optymalizacja Fast-Pick', icon: Sparkles },
                    { id: 'pick_path', label: 'Optymalizacja Tras', icon: Compass },
                    { id: 'rma', label: 'Obsługa Zwrotów (RMA)', icon: RotateCcw },
                    { id: 'shipping', label: 'Centrum Wysyłek (Broker)', icon: Send },
                    { id: 'truck_loader', label: 'Symulator 3D Załadunku', icon: Truck },
                    { id: 'click_collect', label: 'Punkt Odbioru (BOPIS)', icon: MapPin },
                    { id: 'inventory', label: 'Stany Zapasów SKU', icon: Package },
                    { id: 'products', label: 'Katalog Produktów', icon: Layers },
                    { id: 'zones', label: 'Strefy Magazynowe', icon: Map },
                    { id: 'permissions', label: 'Uprawnienia Użytkowników', icon: ShieldAlert },
                    { id: 'adr_manager', label: 'Zgodność Chemiczna (ADR)', icon: AlertTriangle },
                    { id: 'settings', label: 'Ustawienia Systemu', icon: SettingsNavIcon },
                    { id: 'storefront', label: 'Sklep Internetowy ↗', icon: ShoppingBag, isExternal: true },
                ];
        }
    };

    const sideNavItems = getSideNavItems();
    const isTabAllowed = (tabId: string) => sideNavItems.some(item => item.id === tabId);
    const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);
    const [readNotificationIds, setReadNotificationIds] = useState<string[]>(() => {
        try {
            const stored = window.localStorage.getItem('wms-read-notifications');
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });

    const [inLobby, setInLobby] = useState(() => readStoredInLobby());
    const [currentTab, setCurrentTab] = useState(() => readStoredTab());

    // Global Font Sizing Adjuster Effect
    useEffect(() => {
        const handleFontScale = () => {
            try {
                const storedScale = window.localStorage.getItem('wms-ui-font-scale') || '100%';
                document.documentElement.style.fontSize = storedScale;
            } catch (e) {
                console.error('Failed to load font size scale:', e);
            }
        };
        
        handleFontScale();

        window.addEventListener('storage', handleFontScale);
        window.addEventListener('wms-font-scale-changed', handleFontScale);
        
        return () => {
            window.removeEventListener('storage', handleFontScale);
            window.removeEventListener('wms-font-scale-changed', handleFontScale);
        };
    }, []);

    // Global Theme (Dark/Light Mode) Effect
    useEffect(() => {
        const handleThemeChange = () => {
            try {
                const storedTheme = window.localStorage.getItem('wms-ui-theme') || 'light';
                document.documentElement.classList.toggle('dark', storedTheme === 'dark');
            } catch (e) {
                console.error('Failed to load theme settings:', e);
            }
        };

        handleThemeChange();

        window.addEventListener('storage', handleThemeChange);
        window.addEventListener('wms-theme-changed', handleThemeChange);

        return () => {
            window.removeEventListener('storage', handleThemeChange);
            window.removeEventListener('wms-theme-changed', handleThemeChange);
        };
    }, []);

    // Auto-redirect if the stored tab is not allowed for the user's role
    useEffect(() => {
        if (currentUser && sideNavItems.length > 0) {
            const isAllowed = sideNavItems.some(item => item.id === currentTab);
            if (!isAllowed) {
                const fallbackTab = sideNavItems[0].id;
                setCurrentTab(fallbackTab);
                window.localStorage.setItem('wms-current-tab', fallbackTab);
            }
        }
    }, [currentUser, currentTab, sideNavItems]);

    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(() => {
        try {
            const stored = window.localStorage.getItem('wms-expanded-categories');
            return stored ? JSON.parse(stored) : {
                dashboard: true,
                inbound: true,
                yms: false,
                outbound: true,
                optimization: false,
                master_data: false,
                admin: false,
            };
        } catch {
            return {
                dashboard: true,
                inbound: true,
                yms: false,
                outbound: true,
                optimization: false,
                master_data: false,
                admin: false,
            };
        }
    });

    const toggleCategory = (catKey: string) => {
        setExpandedCategories(prev => {
            const next = { ...prev, [catKey]: !prev[catKey] };
            window.localStorage.setItem('wms-expanded-categories', JSON.stringify(next));
            return next;
        });
    };

    const navigationCategories = [
        {
            key: 'dashboard',
            label: 'Pulpit i Analizy',
            itemIds: ['overview', 'statistics']
        },
        {
            key: 'inbound',
            label: 'Procesy Przyjęć',
            itemIds: ['supplies', 'inbound', 'putaway', 'lpn_manager']
        },
        {
            key: 'yms',
            label: 'Plac i Bramy (YMS)',
            itemIds: ['yard', 'dock_scheduling']
        },
        {
            key: 'outbound',
            label: 'Procesy Wydań',
            itemIds: ['orders', 'wave_picking', 'shipping', 'truck_loader', 'rma', 'click_collect']
        },
        {
            key: 'optimization',
            label: 'Optymalizacja i Strategia',
            itemIds: ['reorders', 'slotting', 'compactor', 'predictive', 'pick_path', 'adr_manager']
        },
        {
            key: 'master_data',
            label: 'Kartoteki i Strefy',
            itemIds: ['inventory', 'products', 'zones']
        },
        {
            key: 'admin',
            label: 'Administracja i Narzędzia',
            itemIds: ['permissions', 'settings', 'storefront']
        }
    ];

    const [searchQuery, setSearchQuery] = useState('');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
        const stored = window.localStorage.getItem('wms-sound-enabled');
        return stored !== 'false';
    });

    const toggleSound = () => {
        setSoundEnabled(prev => {
            const next = !prev;
            window.localStorage.setItem('wms-sound-enabled', String(next));
            return next;
        });
    };

    const [toasts, setToasts] = useState<any[]>([]);

    const addToast = (title: string, text: string, type: 'error' | 'warning' | 'info' | 'success') => {
        const id = `toast-${Date.now()}-${Math.random()}`;
        setToasts(prev => [...prev, { id, title, text, type }]);
        
        if (soundEnabled) {
            if (type === 'error') {
                sounds.playError();
            } else if (type === 'success') {
                sounds.playSuccess();
            } else {
                sounds.playBeep();
            }
        }

        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 5000);
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const [inventorySync, setInventorySync] = useState({ isLoading: false, error: '' });
    const [usersSync, setUsersSync] = useState({ isLoading: false, error: '' });
    const [ordersSync, setOrdersSync] = useState({ isLoading: false, error: '' });

    const generateDefaultProducts = (): Product[] => {
        const CATEGORY_PREFIXES: Record<string, string> = {
            'Części samochodowe': 'AUTO-PARTS',
            'Chemia samochodowa': 'AUTO-CHEM',
            'Elektronika': 'ELEC-GEN',
            'Artykuły spożywcze': 'FOOD-GROC',
            'Biuro': 'BIUR-OFF',
            'BHP': 'BHP-SAFE'
        };

        const PRODUCT_TEMPLATES: Record<string, string[]> = {
            'Części samochodowe': [
                'Filtr oleju Carbon', 'Filtr powietrza Active', 'Świeca zapłonowa Laser', 'Kabel zapłonowy Volt',
                'Pasek klinowy Torque', 'Tarcza hamulcowa RotMax', 'Amortyzator GasPro', 'Sprężyna zawieszenia',
                'Łącznik stabilizatora', 'Końcówka drążka', 'Wahacz zawieszenia', 'Przegub napędowy',
                'Termostat silnika', 'Uszczelka głowicy', 'Pompa wody Flow', 'Sonda lambda Sens',
                'Filtr paliwa Diesel', 'Filtr kabinowy Carbon', 'Żarówka reflektora H4', 'Żarówka kierunkowskazu'
            ],
            'Chemia samochodowa': [
                'Szampon samochodowy Shine', 'Wosk hydrofobowy Coat', 'Płyn do spryskiwaczy Letni', 'Odmrażacz do szyb DeIce',
                'Preparat do kokpitu Matte', 'Środek do czyszczenia felg', 'Płyn do chłodnic Glycol', 'Środek do usuwania owadów',
                'Pasta polerska Scratch', 'Preparat do uszczelek', 'Płyn do mycia szyb Streakless', 'Zapach samochodowy Pine',
                'Odtłuszczacz do hamulców', 'Smar silikonowy spray', 'Środek do konserwacji skóry', 'Penetrant wielofunkcyjny'
            ],
            'Elektronika': [
                'Zasilacz stabilizowany', 'Przewód USB-C nylonowy', 'Ładowarka sieciowa Multi', 'Adapter HDMI-DVI',
                'Kabel ethernet Cat6', 'Bateria akumulatorowa', 'Karta pamięci microSD', 'Czytnik kart pamięci',
                'Rozdzielacz USB Hub', 'Przejściówka jack', 'Bezpiecznik elektryczny', 'Taśma izolacyjna PVC'
            ],
            'Artykuły spożywcze': [
                'Kawa ziarnista Arabica', 'Herbata czarna Ceylon', 'Czekolada gorzka 70%', 'Płatki owsiane górskie',
                'Sok pomarańczowy 100%', 'Woda mineralna gazowana', 'Makaron penne semolina', 'Ryż basmati długoziarnisty',
                'Dżem truskawkowy słodki', 'Miód wielokwiatowy', 'Oliwa z oliwek Extra', 'Orzechy nerkowca 200g',
                'Przyprawa pieprz czarny', 'Sól morska jodowana', 'Herbatniki maślane', 'Napój izotoniczny Active'
            ],
            'Biuro': [
                'Segregator biurowy A4', 'Notatnik w linie Grid', 'Długopis żelowy czarny', 'Etykiety samoprzylepne',
                'Zakreślacz neonowy yellow', 'Zszywacz biurowy', 'Zszywki metalowe', 'Spinacze biurowe 100szt',
                'Korektor w taśmie', 'Nożyczki biurowe', 'Taśma klejąca transparent', 'Teczka z gumką A4'
            ],
            'BHP': [
                'Rękawice robocze powlekane', 'Maska ochronna FFP2', 'Kask budowlany z atestem', 'Okulary ochronne przezroczyste',
                'Kamizelka ostrzegawcza', 'Nauszniki przeciwhałasowe', 'Apteczka pierwszej pomocy', 'Buty robocze ochronne',
                'Taśma ostrzegawcza biało-czerwona', 'Półmaska lakiernicza', 'Taśma antypoślizgowa'
            ]
        };

        const ZONES: Record<string, string> = {
            'Części samochodowe': 'C-01-01',
            'Chemia samochodowa': 'C-01-02',
            'Elektronika': 'B-02-01',
            'Artykuły spożywcze': 'A-01-01',
            'Biuro': 'B-02-02',
            'BHP': 'C-01-01'
        };

        const ZONE_GROUPS: Record<string, string> = {
            'Części samochodowe': 'Motoryzacja, chemia i BHP',
            'Chemia samochodowa': 'Motoryzacja, chemia i BHP',
            'Elektronika': 'Elektronika i biuro',
            'Artykuły spożywcze': 'Zywnosc',
            'Biuro': 'Elektronika i biuro',
            'BHP': 'Motoryzacja, chemia i BHP'
        };

        const list: Product[] = [];
        const categories = Object.keys(PRODUCT_TEMPLATES);
        let barcodeCounter = 5900000000001;

        // Dodaj 6 podstawowych produktów testowych
        list.push(
            { productId: 1001, sku: 'SKU-10492', name: 'Płyn hamulcowy DOT-4', category: 'Chemia samochodowa', stock: 120, reorderThreshold: 100, zone: 'C3', status: 'In Stock', price: 34.99, locationCode: 'C-03-01-01', zoneGroup: 'General', primaryLocationId: 1, locations: ['C-03-01-01'], zoneGroups: ['General'], stockEntries: [{ stockId: 1, locationId: 1, locationCode: 'C-03-01-01', zoneGroup: 'General', quantity: 120 }] },
            { productId: 1002, sku: 'SKU-20391', name: 'Reflektor LED H7 SuperVolt', category: 'Części samochodowe', stock: 15, reorderThreshold: 40, zone: 'A1', status: 'Low Stock', price: 289.00, locationCode: 'A-01-01-02', zoneGroup: 'General', primaryLocationId: 2, locations: ['A-01-01-02'], zoneGroups: ['General'], stockEntries: [{ stockId: 2, locationId: 2, locationCode: 'A-01-01-02', zoneGroup: 'General', quantity: 15 }] },
            { productId: 1003, sku: 'SKU-94021', name: 'Akumulator VoltPro 74Ah 12V', category: 'Części samochodowe', stock: 0, reorderThreshold: 15, zone: 'A2', status: 'Out of Stock', price: 449.99, locationCode: 'A-02-01-01', zoneGroup: 'General', primaryLocationId: 3, locations: [], zoneGroups: ['General'], stockEntries: [] },
            { productId: 1004, sku: 'SKU-50493', name: 'Olej silnikowy Syntetic 5W30', category: 'Chemia samochodowa', stock: 8, reorderThreshold: 20, zone: 'C2', status: 'Low Stock', price: 179.99, locationCode: 'C-02-03-01', zoneGroup: 'General', primaryLocationId: 4, locations: ['C-02-03-01'], zoneGroups: ['General'], stockEntries: [{ stockId: 4, locationId: 4, locationCode: 'C-02-03-01', zoneGroup: 'General', quantity: 8 }] },
            { productId: 1005, sku: 'SKU-73012', name: 'Klocki hamulcowe CarbonPremium', category: 'Części samochodowe', stock: 245, reorderThreshold: 80, zone: 'A3', status: 'In Stock', price: 134.99, locationCode: 'A-03-01-01', zoneGroup: 'General', primaryLocationId: 5, locations: ['A-03-01-01'], zoneGroups: ['General'], stockEntries: [{ stockId: 5, locationId: 5, locationCode: 'A-03-01-01', zoneGroup: 'General', quantity: 245 }] },
            { productId: 1006, sku: 'SKU-39402', name: 'Prostownik mikroprocesorowy 12V', category: 'Elektronika', stock: 85, reorderThreshold: 15, zone: 'B2', status: 'In Stock', price: 249.00, locationCode: 'B-02-01-03', zoneGroup: 'General', primaryLocationId: 6, locations: ['B-02-01-03'], zoneGroups: ['General'], stockEntries: [{ stockId: 6, locationId: 6, locationCode: 'B-02-01-03', zoneGroup: 'General', quantity: 85 }] }
        );

        for (let i = 1; i <= 200; i++) {
            const category = categories[i % categories.length];
            const templates = PRODUCT_TEMPLATES[category];
            const baseName = templates[i % templates.length];
            
            const prefix = CATEGORY_PREFIXES[category];
            const sku = `${prefix}-${String(i).padStart(4, '0')}`;
            const barcode = String(barcodeCounter++);
            
            const name = `${baseName} Model-${i}`;
            
            let price = 0;
            if (category === 'Artykuły spożywcze') {
                price = Number((2.50 + (i % 5) * 3.5).toFixed(2));
            } else if (category === 'Części samochodowe') {
                price = Number((40 + (i % 8) * 45).toFixed(2));
            } else {
                price = Number((10 + (i % 6) * 15).toFixed(2));
            }

            const reorderThreshold = 15 + (i % 10);
            const stock = 20 + (i % 50);
            const locationCode = ZONES[category];
            const zoneGroup = ZONE_GROUPS[category];
            const status = stock === 0 ? 'Out of Stock' : (stock < reorderThreshold ? 'Low Stock' : 'In Stock');

            list.push({
                productId: i,
                sku,
                barcode,
                name,
                category,
                stock,
                reorderThreshold,
                zone: locationCode.split('-')[0] + locationCode.split('-')[1],
                status,
                price,
                locationCode,
                zoneGroup,
                primaryLocationId: i,
                locations: [locationCode],
                zoneGroups: [zoneGroup],
                stockEntries: [{ stockId: i, locationId: i, locationCode, zoneGroup, quantity: stock }],
                vatRate: category === 'Artykuły spożywcze' ? 5 : 23
            });
        }
        return list;
    };

    const defaultProducts: Product[] = generateDefaultProducts();

    const [products, setProducts] = useState<Product[]>(() => {
        try {
            const stored = window.localStorage.getItem('wms-products');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed.length >= 200) return parsed;
            }
        } catch (e) {
            console.error("Failed to parse stored products:", e);
        }
        return defaultProducts;
    });

    const [orders, setOrders] = useState<any[]>(() => {
        try {
            const stored = window.localStorage.getItem('wms-orders');
            if (stored) return JSON.parse(stored);
        } catch (e) {
            console.error("Failed to parse stored orders:", e);
        }
        return generateMockOrders();
    });

    const [isRefreshing, setIsRefreshing] = useState(false);

    const [purchaseOrders, setPurchaseOrders] = useState<any[]>(() => {
        try {
            const saved = window.localStorage.getItem('wms-purchase-orders');
            if (saved) return JSON.parse(saved);
        } catch (e) {
            console.error("Failed to parse stored purchase orders:", e);
        }

        const initialMockPOs = [
            {
                id: 'PO-00812',
                createdDate: getRelativeDateStr(2, '09:15'),
                status: 'Completed',
                vendorName: 'AutoParts Distrib Polska',
                expectedDeliveryDate: getRelativeDateStr(2, '14:30'),
                items: [
                    { sku: 'SKU-10492', name: 'Płyn hamulcowy DOT-4', qtyOrdered: 100 }
                ],
                internalNotes: 'Dostawa standardowa od dostawcy chemia.'
            },
            {
                id: 'PO-00813',
                createdDate: getRelativeDateStr(1, '11:00'),
                status: 'Pending',
                vendorName: 'Hurtownia Spożywcza EuroFoods Sp. z o.o.',
                expectedDeliveryDate: getRelativeDateStr(0, '16:00'),
                items: [
                    { sku: 'FOOD-KAWA-001', name: 'Kawa ziarnista Arabica', qtyOrdered: 200 }
                ],
                internalNotes: 'Zapotrzebowanie wygenerowane z Dashboardu - niski stan.'
            },
            {
                id: 'PO-00814',
                createdDate: getRelativeDateStr(0, '08:45'),
                status: 'Pending',
                vendorName: 'ElectroDistrib PL S.A.',
                expectedDeliveryDate: getRelativeDateStr(1, '10:00'),
                items: [
                    { sku: 'SKU-39402', name: 'Prostownik mikroprocesorowy 12V', qtyOrdered: 150 }
                ],
                internalNotes: 'Pilna dostawa elektroniki przed sezonem.'
            },
            {
                id: 'PO-00815',
                createdDate: getRelativeDateStr(0, '09:00'),
                status: 'Pending',
                vendorName: 'Chemia Przemysłowa S.A.',
                expectedDeliveryDate: getRelativeDateStr(0, '12:00'),
                items: [
                    { sku: 'CHEM-ADR-003', name: 'Rozpuszczalnik organiczny (ADR Klasa 3)', qtyOrdered: 80, isAdr: true }
                ],
                internalNotes: 'Wymagany rozładunek na dedykowanej rampie ADR (Dok 1).'
            },
            {
                id: 'PO-00816',
                createdDate: getRelativeDateStr(0, '09:30'),
                status: 'Pending',
                vendorName: 'Mrożonki Polskie Sp. z o.o.',
                expectedDeliveryDate: getRelativeDateStr(0, '15:00'),
                items: [
                    { sku: 'COLD-FOOD-902', name: 'Lody rzemieślnicze waniliowe', qtyOrdered: 300, isColdChain: true }
                ],
                internalNotes: 'Wymagany rozładunek w doku chłodniczym (Dok 2).'
            },
            {
                id: 'RMA-PO-00813',
                createdDate: getRelativeDateStr(0, '10:00'),
                status: 'ReturnPending',
                vendorName: 'DHL Freight',
                expectedDeliveryDate: getRelativeDateStr(0, '12:00'),
                items: [
                    { sku: 'FOOD-KAWA-001', name: 'Kawa ziarnista Arabica', qtyOrdered: 5, reason: 'Odstąpienie od umowy' }
                ],
                trackingNumber: 'DPD-RET-990231',
                carrier: 'DHL Freight',
                internalNotes: 'Zgłoszenie zwrotu od klienta. Powód: Odstąpienie od umowy.'
            }
        ];

        window.localStorage.setItem('wms-purchase-orders', JSON.stringify(initialMockPOs));
        return initialMockPOs;
    });

    const [docks, setDocks] = useState<any[]>(() => {
        try {
            const saved = window.localStorage.getItem('wms-inbound-docks');
            if (saved) return JSON.parse(saved);
        } catch {}
        return [
            { id: 'D1', name: 'Dok Rozładunkowy D1', status: 'Free' },
            { id: 'D2', name: 'Dok Rozładunkowy D2', status: 'Free' },
            { id: 'D3', name: 'Dok Rozładunkowy D3', status: 'Free' }
        ];
    });

    const [yardTrucks, setYardTrucks] = useState<any[]>(() => {
        try {
            const saved = window.localStorage.getItem('wms-yard-trucks');
            if (saved) return JSON.parse(saved);
        } catch {}
        return [
            { id: 'TRK-001', carrierName: 'Raben Logistics', truckPlate: 'WI 90912', status: 'Parked', parkingSlot: 'P1', assignedPoId: 'PO-00813' },
            { id: 'TRK-002', carrierName: 'DHL Freight', truckPlate: 'WA 87121', status: 'Parked', parkingSlot: 'P2', assignedPoId: 'PO-00814' },
            { id: 'TRK-003', carrierName: 'Schenker', truckPlate: 'GD 55219', status: 'Queue', assignedPoId: '' }
        ];
    });

    const getSupplierForCategory = (category: string) => {
        const norm = (category || '').toLowerCase();
        if (norm.includes('spożywcz') || norm.includes('żywność')) return 'Hurtownia Spożywcza EuroFoods Sp. z o.o.';
        if (norm.includes('elektronik') || norm.includes('audio')) return 'ElectroDistrib PL S.A.';
        if (norm.includes('biur') || norm.includes('akcesor')) return 'OfficeMax Supply Poland';
        if (norm.includes('częśc') || norm.includes('chem') || norm.includes('auto')) return 'AutoParts Distrib Polska';
        return 'Global Warehousing Supplies';
    };

    const handleCreatePurchaseOrder = (newPO: any) => {
        setPurchaseOrders(prev => {
            const updated = [newPO, ...prev];
            window.localStorage.setItem('wms-purchase-orders', JSON.stringify(updated));
            return updated;
        });
    };

    const handleUpdatePurchaseOrder = (poId: string, updatedFields: any) => {
        setPurchaseOrders(prev => {
            const updated = prev.map(p => p.id === poId ? { ...p, ...updatedFields } : p);
            window.localStorage.setItem('wms-purchase-orders', JSON.stringify(updated));
            return updated;
        });
    };

    const handleCancelPurchaseOrder = (poId: string) => {
        setPurchaseOrders(prev => {
            const updated = prev.map(p => p.id === poId ? { ...p, status: 'Cancelled' } : p);
            window.localStorage.setItem('wms-purchase-orders', JSON.stringify(updated));
            return updated;
        });
    };

    const handleReceivePurchaseOrder = async (poId: string) => {
        try {
            const po = purchaseOrders.find(p => p.id === poId);
            if (!po || po.status !== 'Pending') return;

            for (const item of po.items) {
                const prod = products.find(p => p.sku === item.sku);
                if (prod) {
                    await handleUpdateStock(prod, item.qtyOrdered);
                    
                    handleAddAllocation({
                        timestamp: new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                        sku: item.sku,
                        productName: item.name,
                        zone: prod.locationCode || 'A-01-01',
                        qty: Math.ceil(item.qtyOrdered / 10),
                        type: 'Przyjęcie towaru (Dostawa)',
                        user: currentUser ? `${currentUser.firstName} ${currentUser.lastName} (${currentUser.employeeId})` : 'System Admin (EMP-8492)'
                    });
                }
            }

            setPurchaseOrders(prev => {
                const updated = prev.map(p => p.id === poId ? { ...p, status: 'Completed' } : p);
                window.localStorage.setItem('wms-purchase-orders', JSON.stringify(updated));
                return updated;
            });

            const operator = currentUser ? `${currentUser.firstName} ${currentUser.lastName} (${currentUser.employeeId})` : 'System Admin (EMP-8492)';
            const itemsSummary = po.items.map((item: any) => `${item.name} (SKU: ${item.sku}, Ilość: ${item.qtyOrdered})`).join(', ');
            logActivity(
                'receive',
                operator,
                `Przyjęto dostawę ${poId}`,
                `Dostawca: ${po.vendorName}. Produkty: ${itemsSummary}`
            );
            addToast(
                'Dostawa przyjęta',
                `Pomyślnie przyjęto dostawę ${poId} od ${po.vendorName}.`,
                'success'
            );
        } catch (err: any) {
            console.error("Receive PO failed:", err);
            alert(`Błąd podczas przyjmowania dostawy: ${err.message}`);
        }
    };

    const handleReceiveRmaReturn = async (rmaId: string, itemsReport?: { sku: string, qtyResale: number, qtyDamaged: number, status: string }[]) => {
        try {
            const po = purchaseOrders.find(p => p.id === rmaId);
            if (!po || po.status !== 'ReturnPending') return;

            for (const item of po.items) {
                const prod = products.find(p => p.sku === item.sku);
                if (prod) {
                    const reportItem = itemsReport?.find(r => r.sku === item.sku);
                    const qtyResale = reportItem ? reportItem.qtyResale : item.qtyOrdered;
                    const qtyDamaged = reportItem ? reportItem.qtyDamaged : 0;
                    
                    if (qtyResale > 0) {
                        await handleUpdateStock(prod, qtyResale);
                    }
                    
                    handleAddAllocation({
                        timestamp: new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                        sku: item.sku,
                        productName: item.name,
                        zone: prod.locationCode || 'A-01-01',
                        qty: Math.ceil((qtyResale + qtyDamaged) / 10) || 1,
                        type: 'Przyjęcie zwrotu (RMA)',
                        user: currentUser ? `${currentUser.firstName} ${currentUser.lastName} (${currentUser.employeeId})` : 'System Admin (EMP-8492)'
                    });
                }
            }

            const finalStatus = itemsReport?.some(r => r.status === 'Rejected') ? 'ReturnRejected' : 
                                itemsReport?.every(r => r.qtyDamaged > 0 && r.qtyResale === 0) ? 'ReturnDamaged' : 'ReturnReceived';

            setPurchaseOrders(prev => {
                const updated = prev.map(p => p.id === rmaId ? { ...p, status: finalStatus, itemsReport } : p);
                window.localStorage.setItem('wms-purchase-orders', JSON.stringify(updated));
                return updated;
            });

            const operator = currentUser ? `${currentUser.firstName} ${currentUser.lastName} (${currentUser.employeeId})` : 'System Admin (EMP-8492)';
            const itemsSummary = po.items.map((item: any) => {
                const rItem = itemsReport?.find(r => r.sku === item.sku);
                const resaleStr = rItem ? `na stan: ${rItem.qtyResale}` : `pełne: ${item.qtyOrdered}`;
                const damagedStr = rItem && rItem.qtyDamaged > 0 ? `, uszkodzone: ${rItem.qtyDamaged}` : '';
                return `${item.name} (${resaleStr}${damagedStr})`;
            }).join(', ');

            logActivity(
                'rma',
                operator,
                `Zatwierdzono zwrot RMA ${rmaId}`,
                `Zwrot od klienta. Szczegóły: ${itemsSummary}`
            );
            addToast(
                'Zwrot RMA przyjęty',
                `Pomyślnie zatwierdzono zwrot RMA dla zamówienia ${rmaId}.`,
                'success'
            );
        } catch (err: any) {
            console.error("Receive RMA return failed:", err);
            alert(`Błąd podczas przyjmowania zwrotu RMA: ${err.message}`);
        }
    };

    const handleCreateRmaReturn = (rma: any) => {
        setPurchaseOrders(prev => {
            const updated = [rma, ...prev];
            window.localStorage.setItem('wms-purchase-orders', JSON.stringify(updated));
            return updated;
        });
        const operator = currentUser ? `${currentUser.firstName} ${currentUser.lastName} (${currentUser.employeeId})` : 'System Admin (EMP-8492)';
        logActivity(
            'rma',
            operator,
            `Zgłoszono nowe RMA ${rma.id}`,
            `Zamówienie bazowe: ${rma.id.replace('RMA-', '')}. Przewoźnik: ${rma.vendorName}.`
        );
        addToast(
            'Zgłoszono zwrot RMA',
            `Pomyślnie utworzono zgłoszenie RMA dla zamówienia ${rma.id.replace('RMA-', '')}.`,
            'info'
        );
    };

    const handleGroupPurchaseOrders = (poIds: string[]) => {
        const selected = purchaseOrders.filter(p => poIds.includes(p.id) && p.status === 'Pending');
        if (selected.length < 2) {
            alert('Wybierz co najmniej 2 oczekujące dostawy do zgrupowania.');
            return;
        }

        const consolidatedItems: Record<string, { sku: string; name: string; qtyOrdered: number }> = {};
        let consolidatedVendor = selected[0].vendorName;
        const sameSupplier = selected.every(p => p.vendorName === consolidatedVendor);
        if (!sameSupplier) {
            consolidatedVendor = 'Skonsolidowani Dostawcy';
        }

        selected.forEach(po => {
            po.items.forEach((item: any) => {
                if (consolidatedItems[item.sku]) {
                    consolidatedItems[item.sku].qtyOrdered += item.qtyOrdered;
                } else {
                    consolidatedItems[item.sku] = { ...item };
                }
            });
        });

        const newPoId = `PO-GRP${Math.floor(1000 + Math.random() * 9000)}`;
        const newPO = {
            id: newPoId,
            createdDate: new Date().toLocaleDateString('pl-PL', { day: '2-digit', month: 'short' }) + ', ' + new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
            status: 'Pending',
            vendorName: consolidatedVendor,
            expectedDeliveryDate: selected[0].expectedDeliveryDate,
            items: Object.values(consolidatedItems),
            internalNotes: `Zgrupowane i skonsolidowane zlecenia: ${selected.map(p => p.id).join(', ')}.`
        };

        setPurchaseOrders(prev => {
            const updated = prev.map(p => poIds.includes(p.id) ? { ...p, status: 'Merged' } : p);
            const final = [newPO, ...updated];
            window.localStorage.setItem('wms-purchase-orders', JSON.stringify(final));
            return final;
        });
    };

    const handleRefreshAll = async () => {
        setIsRefreshing(true);
        try {
            await Promise.all([
                loadInventory(),
                loadOrders()
            ]);
        } catch (e) {
            console.error("Refresh failed:", e);
        } finally {
            setIsRefreshing(false);
        }
    };

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
        { id: 'EMP-9921', employeeId: 'EMP-9921', userId: '9921', firstName: 'Mariusz', lastName: 'Pakosz', email: 'm.pakosz@logistics-os.com', role: 'Packer', zoneAssignment: 'Station B', status: 'Active', avatarUrl: null },
        { id: 'EMP-2039', employeeId: 'EMP-2039', userId: '2039', firstName: 'Zofia', lastName: 'Bielska', email: 'sales@logistics-os.com', role: 'Sales Manager', zoneAssignment: 'Office / Sales', status: 'Active', avatarUrl: null },
        { id: 'EMP-3048', employeeId: 'EMP-3048', userId: '3048', firstName: 'Maciej', lastName: 'Kaczmarek', email: 'planner@logistics-os.com', role: 'Logistics Planner', zoneAssignment: 'Global Access', status: 'Active', avatarUrl: null },
        { id: 'EMP-4059', employeeId: 'EMP-4059', userId: '4059', firstName: 'Hanna', lastName: 'Wiśniewska', email: 'auditor@logistics-os.com', role: 'Inventory Auditor', zoneAssignment: 'Aisle 1-12 & B1-B7', status: 'Active', avatarUrl: null }
    ]);

    const [activitiesLog, setActivitiesLog] = useState<any[]>(() => {
        try {
            const stored = window.localStorage.getItem('wms-activities-log');
            if (stored) return JSON.parse(stored);
        } catch (e) {
            console.error("Failed to parse stored activities log:", e);
        }
        return [
            {
                id: 'act-init-1',
                timestamp: new Date(Date.now() - 3600000).toLocaleString('pl-PL'),
                timeStr: new Date(Date.now() - 3600000).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
                type: 'pick',
                user: 'Jan Kowalski (EMP-1102)',
                message: 'Zakończono pobieranie zamówienia ORD-89498',
                details: 'Lokacja: A-04-12, strefa kompletacji'
            },
            {
                id: 'act-init-2',
                timestamp: new Date(Date.now() - 7200000).toLocaleString('pl-PL'),
                timeStr: new Date(Date.now() - 7200000).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
                type: 'pack',
                user: 'Mariusz Pakosz (EMP-9921)',
                message: 'Spakowano i zweryfikowano zamówienie ORD-89495',
                details: 'Karton Średni M, waga 4.5kg, etykieta DPD'
            },
            {
                id: 'act-init-3',
                timestamp: new Date(Date.now() - 10800000).toLocaleString('pl-PL'),
                timeStr: new Date(Date.now() - 10800000).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
                type: 'receive',
                user: 'Maciej Kaczmarek (EMP-3048)',
                message: 'Przyjęto dostawę PO-00812',
                details: '100 sztuk SKU-10492, dostawca AutoParts'
            },
            {
                id: 'act-init-4',
                timestamp: new Date(Date.now() - 14400000).toLocaleString('pl-PL'),
                timeStr: new Date(Date.now() - 14400000).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
                type: 'rma',
                user: 'Hanna Wiśniewska (EMP-4059)',
                message: 'Zatwierdzono zwrot RMA-003',
                details: '1 sztuka SKU-20391, uszkodzenie w transporcie'
            },
            {
                id: 'act-init-5',
                timestamp: new Date(Date.now() - 18000000).toLocaleString('pl-PL'),
                timeStr: new Date(Date.now() - 18000000).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
                type: 'relocate',
                user: 'Wojtek Nowak (EMP-9104)',
                message: 'Wykonano relokację SKU-20391',
                details: 'Przeniesiono do nowej lokacji B-02-05'
            }
        ];
    });

    const logActivity = async (type: 'pick' | 'pack' | 'receive' | 'rma' | 'relocate', user: string, message: string, details: string) => {
        const newLog = {
            id: `act-${Date.now()}-${Math.random()}`,
            timestamp: new Date().toLocaleString('pl-PL'),
            timeStr: new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
            type,
            user,
            message,
            details
        };
        setActivitiesLog(prev => [newLog, ...prev].slice(0, 50));
        try {
            await logActivityApi({ type, user, message, details });
        } catch (err) {
            console.error("Failed to log activity to backend:", err);
        }
    };

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

    const loadOrders = async (shouldIgnore = () => false) => {
        setOrdersSync({ isLoading: true, error: '' });

        try {
            const backendOrders = await fetchOrdersApi();
            if (shouldIgnore()) return;

            const enriched = backendOrders.map((ord: any) => {
                return {
                    ...ord,
                    waybillNumber: ord.waybillNumber || `DPD${String(ord.id || ord.order_number || '').replace('ORD-', '')}PL`,
                    waybillPdfDate: ord.waybillPdfDate || new Date(ord.order_date || Date.now()).toLocaleDateString('pl-PL'),
                    pickingZones: ord.pickingZones || [
                        { name: 'Strefa A', percentage: 100 }
                    ],
                    activityHistory: ord.activityHistory || [
                        { 
                            id: `act-init-${ord.id || ord.order_number}`, 
                            title: 'Utworzono zlecenie wyjazdu', 
                            actor: ord.internalNotesActor || 'System', 
                            date: new Date(ord.order_date || Date.now()).toLocaleDateString('pl-PL') 
                        }
                    ],
                    changeLogs: ord.changeLogs || []
                };
            });

            setOrders(enriched);
            setOrdersSync({ isLoading: false, error: '' });
        } catch (error) {
            if (shouldIgnore()) return;

            console.error('Orders backend unavailable:', error);
            setOrdersSync({
                isLoading: false,
                error: 'Backend orders niedostępny - używam danych lokalnych.',
            });
        }
    };

    const loadActivities = async (shouldIgnore = () => false) => {
        try {
            const backendActivities = await fetchActivities();
            if (shouldIgnore()) return;
            if (backendActivities && backendActivities.length > 0) {
                setActivitiesLog(backendActivities);
            }
        } catch (error) {
            console.error('Activities backend unavailable:', error);
        }
    };

    useEffect(() => {
        let shouldIgnore = false;

        loadInventory(() => shouldIgnore);
        loadOrders(() => shouldIgnore);
        loadActivities(() => shouldIgnore);

        return () => {
            shouldIgnore = true;
        };
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            loadOrders(() => false);
            loadActivities(() => false);
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        loadUsers();
    }, []);

    useEffect(() => {
        window.localStorage.setItem('wms-products', JSON.stringify(products));
    }, [products]);

    useEffect(() => {
        window.localStorage.setItem('wms-orders', JSON.stringify(orders));
    }, [orders]);

    useEffect(() => {
        window.localStorage.setItem('wms-activities-log', JSON.stringify(activitiesLog));
    }, [activitiesLog]);

    useEffect(() => {
        window.localStorage.setItem('wms-inbound-docks', JSON.stringify(docks));
    }, [docks]);

    useEffect(() => {
        window.localStorage.setItem('wms-yard-trucks', JSON.stringify(yardTrucks));
    }, [yardTrucks]);

    useEffect(() => {
        const handleStorage = (e: StorageEvent) => {
            if (e.key === 'wms-orders' && e.newValue) {
                try {
                    const parsed = JSON.parse(e.newValue);
                    if (JSON.stringify(parsed) !== JSON.stringify(orders)) {
                        const oldOrdersMap = new Map(orders.map(o => [o.id, o]));
                        parsed.forEach((newOrd: any) => {
                            const oldOrd = oldOrdersMap.get(newOrd.id);
                            if (oldOrd && oldOrd.status !== newOrd.status) {
                                if (newOrd.status === 'Oczekuje na pakowanie') {
                                    addToast(
                                        'Kompletacja zakończona',
                                        `Zamówienie ${newOrd.id} zostało skompletowane przez ${newOrd.pickedBy || 'Pickera'}. Pojemnik: ${newOrd.binId || 'Pojemnik'}`,
                                        'success'
                                    );
                                } else if (newOrd.status === 'Spakowane') {
                                    addToast(
                                        'Zamówienie spakowane',
                                        `Zamówienie ${newOrd.id} zostało spakowane przez ${newOrd.packedBy || 'Pakowacza'}.`,
                                        'success'
                                    );
                                } else if (newOrd.status === 'Wysłane') {
                                    addToast(
                                        'Zamówienie wysłane',
                                        `Zamówienie ${newOrd.id} zostało wysłane.`,
                                        'success'
                                    );
                                }
                            }
                        });
                        setOrders(parsed);
                    }
                } catch (err) {
                    console.error("Sync error wms-orders:", err);
                }
            }
            if (e.key === 'wms-products' && e.newValue) {
                try {
                    const parsed = JSON.parse(e.newValue);
                    if (JSON.stringify(parsed) !== JSON.stringify(products)) {
                        setProducts(parsed);
                    }
                } catch (err) {
                    console.error("Sync error wms-products:", err);
                }
            }
            if (e.key === 'wms-purchase-orders' && e.newValue) {
                try {
                    const parsed = JSON.parse(e.newValue);
                    if (JSON.stringify(parsed) !== JSON.stringify(purchaseOrders)) {
                        setPurchaseOrders(parsed);
                    }
                } catch (err) {
                    console.error("Sync error wms-purchase-orders:", err);
                }
            }
            if (e.key === 'wms-activities-log' && e.newValue) {
                try {
                    const parsed = JSON.parse(e.newValue);
                    if (JSON.stringify(parsed) !== JSON.stringify(activitiesLog)) {
                        setActivitiesLog(parsed);
                    }
                } catch (err) {
                    console.error("Sync error wms-activities-log:", err);
                }
            }
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, [orders, products, purchaseOrders, activitiesLog]);

    useEffect(() => {
        if (currentUser) {
            const allowed = getSideNavItems();
            if (allowed.length > 0 && !allowed.some(item => item.id === currentTab)) {
                setCurrentTab(allowed[0].id);
                window.localStorage.setItem('wms-current-tab', allowed[0].id);
            }
        }
    }, [currentUser, currentTab]);

    useEffect(() => {
        if (!currentUser) return;

        let lastActiveTime = Date.now();

        const resetTimer = () => {
            lastActiveTime = Date.now();
        };

        window.addEventListener('mousemove', resetTimer);
        window.addEventListener('mousedown', resetTimer);
        window.addEventListener('keypress', resetTimer);
        window.addEventListener('scroll', resetTimer);
        window.addEventListener('click', resetTimer);
        window.addEventListener('touchstart', resetTimer);

        const intervalId = setInterval(() => {
            try {
                const stored = localStorage.getItem('wms-warehouse-settings');
                if (stored) {
                    const settingsObj = JSON.parse(stored);
                    const timeoutMinutes = Number(settingsObj.sessionTimeout);
                    if (timeoutMinutes && timeoutMinutes > 0) {
                        const elapsed = Date.now() - lastActiveTime;
                        if (elapsed >= timeoutMinutes * 60 * 1000) {
                            handleLogout();
                            addToast(
                                'Sesja wygasła',
                                'Zostałeś automatycznie wylogowany z powodu bezczynności.',
                                'warning'
                            );
                        }
                    }
                }
            } catch (err) {
                console.error('Failed to parse settings for session timeout', err);
            }
        }, 10000); // Check every 10 seconds

        return () => {
            window.removeEventListener('mousemove', resetTimer);
            window.removeEventListener('mousedown', resetTimer);
            window.removeEventListener('keypress', resetTimer);
            window.removeEventListener('scroll', resetTimer);
            window.removeEventListener('click', resetTimer);
            window.removeEventListener('touchstart', resetTimer);
            clearInterval(intervalId);
        };
    }, [currentUser]);

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

        if (newAlloc.type === 'Uzupełnienie zapasów (dostawca)') {
            return;
        }

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

    const handleAddOrder = async (newOrder: any) => {
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

        try {
            await createOrderApi(enrichedOrder);
        } catch (err) {
            console.error("Failed to save order to backend:", err);
        }

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

    const handleUpdateOrder = async (orderId: string, updatedFields: any) => {
        const oldOrder = orders.find(o => o.id === orderId);
        const oldStatus = oldOrder ? oldOrder.status : '';
        const newStatus = updatedFields.status;

        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updatedFields } : o));
        try {
            await updateOrderApi(orderId, updatedFields);
        } catch (err) {
            console.error("Failed to update order on backend:", err);
        }

        if (newStatus && newStatus !== oldStatus) {
            if (newStatus === 'Oczekuje na pakowanie') {
                const picker = updatedFields.pickedBy || (currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Jan Kowalski');
                const bin = updatedFields.binId || 'Pojemnik';
                logActivity(
                    'pick', 
                    picker, 
                    `Skompletowano zamówienie ${orderId}`, 
                    `Pojemnik: ${bin}`
                );
                addToast(
                    'Kompletacja zakończona',
                    `Zamówienie ${orderId} zostało skompletowane przez ${picker}. Pojemnik: ${bin}`,
                    'success'
                );
            } else if (newStatus === 'Spakowane' || newStatus === 'Wysłane') {
                const packer = updatedFields.packedBy || updatedFields.internalNotesActor || (currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Mariusz Pakosz');
                const labelInfo = updatedFields.waybillPdfDate ? `Etykieta DPD wygenerowana` : 'Zlecenie gotowe do wysyłki';
                logActivity(
                    'pack', 
                    packer, 
                    newStatus === 'Wysłane' ? `Wysłano zamówienie ${orderId}` : `Spakowano zamówienie ${orderId}`, 
                    `${labelInfo}`
                );
                addToast(
                    newStatus === 'Wysłane' ? 'Zamówienie wysłane' : 'Zamówienie spakowane',
                    `Zamówienie ${orderId} zostało ${newStatus === 'Wysłane' ? 'wysłane' : 'spakowane'} przez ${packer}.`,
                    'success'
                );
            }
        }
    };

    const handleUpdateOrderStatus = async (orderId: string, status: string) => {
        const oldOrder = orders.find(o => o.id === orderId);
        const oldStatus = oldOrder ? oldOrder.status : '';

        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
        try {
            await updateOrderApi(orderId, { status });
        } catch (err) {
            console.error("Failed to update order status on backend:", err);
        }

        if (status && status !== oldStatus) {
            if (status === 'Oczekuje na pakowanie') {
                logActivity(
                    'pick', 
                    currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'System Admin', 
                    `Skompletowano zamówienie ${orderId}`, 
                    `Status zmieniony z poziomu Admina`
                );
                addToast(
                    'Kompletacja zakończona',
                    `Zamówienie ${orderId} zostało skompletowane. Status zmieniony z poziomu Admina.`,
                    'success'
                );
            } else if (status === 'Spakowane' || status === 'Wysłane') {
                logActivity(
                    'pack', 
                    currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'System Admin', 
                    status === 'Wysłane' ? `Wysłano zamówienie ${orderId}` : `Spakowano zamówienie ${orderId}`, 
                    `Status zmieniony z poziomu Admina`
                );
                addToast(
                    status === 'Wysłane' ? 'Zamówienie wysłane' : 'Zamówienie spakowane',
                    `Zamówienie ${orderId} zostało ${status === 'Wysłane' ? 'wysłane' : 'spakowane'}.`,
                    'success'
                );
            }
        }
    };

    const handleAddOrderChangeLog = async (orderId: string, title: string, description: string) => {
        let updatedOrder: any = null;
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
                updatedOrder = { 
                    ...o, 
                    changeLogs: [newLog, ...logs],
                    activityHistory: [newAct, ...history]
                };
                return updatedOrder;
            }
            return o;
        }));

        if (updatedOrder) {
            try {
                await updateOrderApi(orderId, {
                    changeLogs: updatedOrder.changeLogs,
                    activityHistory: updatedOrder.activityHistory
                });
            } catch (err) {
                console.error("Failed to add changelog on backend:", err);
            }
        }
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
        try {
            await adjustInventoryStock({
                productId: product.productId,
                sku: product.sku,
                delta,
                locationId: product.primaryLocationId,
            });
            await loadInventory();
        } catch (error) {
            console.warn('Backend update stock failed, updating local state:', error);
            setProducts(prev => {
                return prev.map(p => {
                    if (p.sku === product.sku) {
                        return {
                            ...p,
                            stock: Math.max(0, p.stock + delta),
                        };
                    }
                    return p;
                });
            });
        }
    };

    const handleUpdateThreshold = async (product: Product, threshold: number) => {
        try {
            await updateInventoryProduct(product.productId, { reorderThreshold: threshold });
            await loadInventory();
        } catch (error) {
            console.warn('Backend update threshold failed, updating local state:', error);
            setProducts(prev => {
                return prev.map(p => {
                    if (p.productId === product.productId) {
                        return {
                            ...p,
                            reorderThreshold: threshold,
                        };
                    }
                    return p;
                });
            });
        }
    };

    const handleUpdateBulkCategoryVat = (category: string, vatRate: number) => {
        setProducts(prev => {
            const updated = prev.map(p => p.category === category ? { ...p, vatRate } : p);
            window.localStorage.setItem('wms-products', JSON.stringify(updated));
            return updated;
        });

        const operatorName = currentUser ? `${currentUser.firstName} ${currentUser.lastName} (${currentUser.employeeId})` : 'System Admin (EMP-8492)';
        logActivity(
            'system',
            operatorName,
            `Masowa zmiana stawki VAT`,
            `Dla kategorii "${category}" ustawiono nową stawkę VAT: ${vatRate}%`
        );

        addToast(
            'Zmiana stawki VAT',
            `Pomyślnie zaktualizowano stawkę VAT na ${vatRate}% dla wszystkich produktów w kategorii "${category}".`,
            'success'
        );
    };

    const handleUpdateProductLocation = async (sku: string, newLocationCode: string, newZone: string) => {
        try {
            const product = products.find(p => p.sku === sku);
            if (!product) return false;
            await updateInventoryProduct(product.productId, { locationCode: newLocationCode, zone: newZone });
            await loadInventory();
            return true;
        } catch (error) {
            console.warn('Backend update location failed, updating local state:', error);
            setProducts(prev => {
                return prev.map(p => {
                    if (p.sku === sku) {
                        return {
                            ...p,
                            locationCode: newLocationCode,
                            zone: newZone,
                        };
                    }
                    return p;
                });
            });
            return true;
        }
    };

    const handleConsolidateStock = async (sku: string, sourceLoc: string, targetLoc: string, qty: number, targetZone: string) => {
        try {
            setProducts(prev => {
                return prev.map(p => {
                    if (p.sku === sku) {
                        const newStockEntries = p.stockEntries.map(e => {
                            if (e.locationCode === sourceLoc) {
                                return { ...e, quantity: Math.max(0, e.quantity - qty) };
                            }
                            if (e.locationCode === targetLoc) {
                                return { ...e, quantity: e.quantity + qty };
                            }
                            return e;
                        }).filter(e => e.quantity > 0);

                        const newLocations = newStockEntries.map(e => e.locationCode);
                        const primaryLoc = newStockEntries.length > 0 ? newStockEntries[0].locationCode : targetLoc;

                        return {
                            ...p,
                            locationCode: primaryLoc,
                            locations: newLocations,
                            stockEntries: newStockEntries,
                            zone: targetZone
                        };
                    }
                    return p;
                });
            });
            return true;
        } catch (error) {
            console.error('Consolidation failed:', error);
            return false;
        }
    };

    const handleRestockItem = async (product: Product) => {
        try {
            const newPoId = `PO-${Math.floor(10000 + Math.random() * 90000)}`;
            const vendor = getSupplierForCategory(product.category);

            const newPO = {
                id: newPoId,
                createdDate: new Date().toLocaleDateString('pl-PL', { day: '2-digit', month: 'short' }) + ', ' + new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
                status: 'Pending',
                vendorName: vendor,
                expectedDeliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString('pl-PL', { day: '2-digit', month: 'short' }) + ', 12:00',
                items: [
                    { sku: product.sku, name: product.name, qtyOrdered: 100 }
                ],
                internalNotes: `Automatyczne zapotrzebowanie wygenerowane z Dashboardu - niski stan SKU.`
            };

            setPurchaseOrders(prev => {
                const updated = [newPO, ...prev];
                window.localStorage.setItem('wms-purchase-orders', JSON.stringify(updated));
                return updated;
            });

            handleAddAllocation({
                timestamp: new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                sku: product.sku,
                productName: product.name,
                zone: product.locationCode || 'A-01-01',
                qty: 10,
                type: 'Zlecenie zakupiu PO (Draft)',
                user: currentUser ? `${currentUser.firstName} ${currentUser.lastName} (${currentUser.employeeId})` : 'System Admin (EMP-8492)'
            });

            const operator = currentUser ? `${currentUser.firstName} ${currentUser.lastName} (${currentUser.employeeId})` : 'System Admin (EMP-8492)';
            logActivity(
                'receive',
                operator,
                `Zlecono uzupełnienie zapasów (Restock) dla SKU: ${product.sku}`,
                `Utworzono draft zamówienia PO ${newPoId} na 100 szt.`
            );
            addToast(
                'Zlecono uzupełnienie zapasów',
                `Utworzono draft zamówienia PO ${newPoId} dla SKU: ${product.sku} (x100 szt.).`,
                'info'
            );

            alert(`Wygenerowano zapotrzebowanie zakupowe ${newPoId} na 100 sztuk. Przejdź do zakładki "Dostawy", aby zatwierdzić przyjęcie towaru od dostawcy.`);
        } catch (err: any) {
            console.error("Restock failed:", err);
            alert(`Nie udało się wygenerować zapotrzebowania: ${err.message}`);
        }
    };

    const handleRelocateProduct = (sku: string, newLocationCode: string, newZone: string) => {
        const prod = products.find(p => p.sku === sku);
        const prodName = prod ? prod.name : 'Towar';
        const currentQtyPallets = prod ? Math.ceil(prod.stock / 10) || 1 : 1;

        setProducts(prev => prev.map(p => {
            if (p.sku === sku) {
                return {
                    ...p,
                    locationCode: newLocationCode,
                    zone: newZone
                };
            }
            return p;
        }));

        handleAddAllocation({
            timestamp: new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            sku: sku,
            productName: prodName,
            zone: newZone,
            qty: currentQtyPallets,
            type: 'Relokacja wewnętrzna',
            user: currentUser ? `${currentUser.firstName} ${currentUser.lastName} (${currentUser.employeeId})` : 'System Admin (EMP-8492)'
        });

        const operator = currentUser ? `${currentUser.firstName} ${currentUser.lastName} (${currentUser.employeeId})` : 'System Admin (EMP-8492)';
        logActivity(
            'relocate',
            operator,
            `Przeniesiono produkt ${sku}`,
            `Nowa lokacja: ${newLocationCode} (Strefa ${newZone}). Nazwa: ${prodName}`
        );
        addToast(
            'Zakończono relokację',
            `Przeniesiono produkt ${sku} do strefy ${newZone} (lokacja ${newLocationCode}).`,
            'info'
        );
    };

    const handleCreateProduct = async (newProd: any) => {
        try {
            await createInventoryProduct(newProd);
            await loadInventory();
        } catch (error) {
            console.warn('Backend create failed, creating in local state:', error);
            const mockId = Math.floor(Math.random() * 1000000);
            const mappedProd: Product = {
                productId: mockId,
                sku: newProd.sku,
                barcode: newProd.barcode || newProd.sku,
                name: newProd.name,
                category: newProd.category,
                stock: 0,
                reorderThreshold: newProd.reorderThreshold ?? 20,
                zone: 'RAMPA-PRZYJEC',
                locationCode: 'RAMPA-PRZYJEC',
                zoneGroup: 'General',
                primaryLocationId: null,
                status: 'Out of Stock',
                price: newProd.price ?? 0,
                locations: ['RAMPA-PRZYJEC'],
                stockEntries: [],
                zoneGroups: ['General'],
            };
            setProducts(prev => [...prev, mappedProd].sort((a, b) => a.name.localeCompare(b.name)));
        }
    };

    const handleUpdateProduct = async (id: any, fields: any) => {
        try {
            await updateInventoryProduct(id, fields);
            await loadInventory();
        } catch (error) {
            console.warn('Backend update failed, updating local state:', error);
            setProducts(prev => {
                return prev.map(p => {
                    if (p.productId === id) {
                        return {
                            ...p,
                            ...fields,
                            reorderThreshold: fields.reorderThreshold ?? fields.reorder_threshold ?? p.reorderThreshold,
                        };
                    }
                    return p;
                });
            });
        }
    };

    const handleDeleteProduct = async (id: any) => {
        try {
            await deleteInventoryProduct(id);
            await loadInventory();
        } catch (error) {
            console.warn('Backend delete failed, deleting from local state:', error);
            setProducts(prev => prev.filter(p => p.productId !== id));
        }
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

    // Dynamic Notifications calculated from current WMS state
    const notifications = React.useMemo(() => {
        const list: any[] = [];

        // 1. Critical out of stock products
        products.forEach(p => {
            if (p.stock === 0) {
                list.push({
                    id: `stock-empty-${p.sku}`,
                    type: 'error',
                    text: `Krytyczny brak zapasu: ${p.sku} (${p.name})`,
                    time: 'Przed chwilą',
                    targetTab: 'inventory',
                    targetId: p.sku
                });
            } else if (p.stock <= p.reorderThreshold) {
                list.push({
                    id: `stock-low-${p.sku}`,
                    type: 'warning',
                    text: `Niski stan magazynowy: ${p.sku} (${p.name})`,
                    time: '2 godz. temu',
                    targetTab: 'inventory',
                    targetId: p.sku
                });
            }
        });

        // 2. Zone utilization capacities
        zones.forEach(z => {
            if (z.capacityPercent > 85) {
                list.push({
                    id: `zone-cap-${z.id}`,
                    type: 'warning',
                    text: `Wysoka zajętość strefy ${z.id} (${z.capacityPercent}%)`,
                    time: '1 godz. temu',
                    targetTab: 'zones',
                    targetId: z.id
                });
            }
            if (z.isLocked) {
                list.push({
                    id: `zone-lock-${z.id}`,
                    type: 'error',
                    text: `Korytarz ${z.id} został zablokowany`,
                    time: 'Wczoraj',
                    targetTab: 'zones',
                    targetId: z.id
                });
            }
        });

        // 3. Pending/Waiting orders
        orders.forEach(o => {
            if (o.status === 'Oczekujące' || o.status === 'Do kompletacji') {
                list.push({
                    id: `order-pending-${o.id}`,
                    type: 'info',
                    text: `Zlecenie oczekuje na kompletację: ${o.id}`,
                    time: 'Przed chwilą',
                    targetTab: 'orders',
                    targetId: o.id
                });
            }
        });

        // 4. Simulated system/API events matching screenshot aesthetics
        list.push({
            id: 'system-courier-api',
            type: 'error',
            text: 'Błąd połączenia z API kuriera (DHL)',
            time: 'Przed chwilą',
            targetTab: 'settings',
            targetId: 'courier-api'
        });

        list.push({
            id: 'system-order-status-change',
            type: 'info',
            text: 'Zmieniono status zamówienia ORD-89240',
            time: '10 min. temu',
            targetTab: 'orders',
            targetId: 'ORD-89240'
        });

        // Filter notifications based on tab authorization for the logged-in role
        const allowedTabIds = sideNavItems.map((item: any) => item.id);
        return list.filter(item => allowedTabIds.includes(item.targetTab));
    }, [products, zones, orders, sideNavItems]);

    const prevNotificationIdsRef = useRef<string[]>([]);
    useEffect(() => {
        if (prevNotificationIdsRef.current.length === 0) {
            prevNotificationIdsRef.current = notifications.map(n => n.id);
            return;
        }

        const currentIds = notifications.map(n => n.id);
        const oldIds = prevNotificationIdsRef.current;
        const newNotifications = notifications.filter(n => !oldIds.includes(n.id));

        newNotifications.forEach(n => {
            let toastType: 'error' | 'warning' | 'info' | 'success' = 'info';
            let title = 'Powiadomienie systemowe';
            if (n.type === 'error') {
                toastType = 'error';
                title = 'Alarm krytyczny';
            } else if (n.type === 'warning') {
                toastType = 'warning';
                title = 'Ostrzeżenie';
            }
            addToast(title, n.text, toastType);
        });

        prevNotificationIdsRef.current = currentIds;
    }, [notifications]);

    const handleMarkAllAsRead = () => {
        const allIds = notifications.map(n => n.id);
        setReadNotificationIds(allIds);
        window.localStorage.setItem('wms-read-notifications', JSON.stringify(allIds));
    };

    const handleNotificationClick = (targetTab: string, notificationId: string, targetId?: string) => {
        setCurrentTab(targetTab);
        window.localStorage.setItem('wms-current-tab', targetTab);
        
        if (targetId) {
            setHighlightedItemId(targetId);
            setTimeout(() => {
                setHighlightedItemId(null);
            }, 3000); // Highlight for 3 seconds
        }

        if (!readNotificationIds.includes(notificationId)) {
            const newReadIds = [...readNotificationIds, notificationId];
            setReadNotificationIds(newReadIds);
            window.localStorage.setItem('wms-read-notifications', JSON.stringify(newReadIds));
        }
    };

    const isTerminalRoute = window.location.pathname === '/terminal' || window.location.hash === '#/terminal';

    if (isTerminalRoute) {
        return (
            <WorkerTerminalStandAlone 
                orders={orders} 
                onUpdateOrder={handleUpdateOrder} 
                staffList={staffList}
                products={products}
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

                <div className="flex flex-col gap-1 px-3 flex-grow select-none overflow-y-auto max-h-[calc(100vh-220px)] scrollbar-thin">
                    {navigationCategories.map((category) => {
                        const allowedItems = sideNavItems.filter((item: any) => category.itemIds.includes(item.id));
                        if (allowedItems.length === 0) return null;

                        const isExpanded = !!expandedCategories[category.key];
                        
                        return (
                            <div key={category.key} className="space-y-1">
                                <button
                                    onClick={() => toggleCategory(category.key)}
                                    className="w-full flex items-center justify-between px-3 py-2 text-zinc-500 hover:text-zinc-300 font-sans text-[10px] font-black uppercase tracking-wider bg-transparent border-none outline-none cursor-pointer mt-2 first:mt-0 text-left"
                                >
                                    <span>{category.label}</span>
                                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                </button>
                                
                                {isExpanded && (
                                    <ul className="flex flex-col gap-1 pl-3 border-l border-zinc-800 ml-3">
                                        {allowedItems.map((item: any) => {
                                            const Icon = item.icon;
                                            const isActive = currentTab === item.id;
                                            return (
                                                <li key={item.id}>
                                                    <button
                                                        onClick={() => {
                                                            if (item.isExternal) {
                                                                window.open('http://localhost:3001/', '_blank');
                                                            } else {
                                                                setCurrentTab(item.id);
                                                                window.localStorage.setItem('wms-current-tab', item.id);
                                                                setIsMobileMenuOpen(false);
                                                            }
                                                        }}
                                                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all font-sans text-xs font-bold cursor-pointer border-none bg-transparent text-left outline-none ${
                                                            isActive
                                                                ? 'bg-white/5 border-l-4 border-[#2170e4] text-[#d8e2ff] font-extrabold pl-2 scale-[1.01]'
                                                                : 'text-zinc-400 hover:text-white hover:bg-white/5'
                                                        }`}
                                                    >
                                                        <Icon className="w-4 h-4 text-zinc-400" />
                                                        <span>{item.label}</span>
                                                    </button>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </div>
                        );
                    })}
                </div>

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
                    notifications={notifications}
                    readNotificationIds={readNotificationIds}
                    onMarkAllAsRead={handleMarkAllAsRead}
                    onNotificationClick={handleNotificationClick}
                    onRefreshData={handleRefreshAll}
                    isRefreshing={isRefreshing}
                    soundEnabled={soundEnabled}
                    onToggleSound={toggleSound}
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

                    {currentTab === 'overview' && isTabAllowed('overview') && (
                        <Dashboard
                            products={products}
                            zones={zones}
                            allocationsLog={allocationsLog}
                            onAddAllocation={handleAddAllocation}
                            onRestockProduct={handleRestockItem}
                            activitiesLog={activitiesLog}
                        />
                    )}

                    {currentTab === 'statistics' && isTabAllowed('statistics') && (
                        <Statistics
                            orders={orders}
                            products={products}
                            zones={zones}
                            staffList={staffList}
                            onRelocateProduct={handleRelocateProduct}
                        />
                    )}

                    {currentTab === 'orders' && isTabAllowed('orders') && (
                        <Orders
                            orders={orders}
                            products={products}
                            onAddOrder={handleAddOrder}
                            onUpdateOrder={handleUpdateOrder}
                            onUpdateOrderStatus={handleUpdateOrderStatus}
                            onAddOrderChangeLog={handleAddOrderChangeLog}
                            highlightedOrderId={highlightedItemId}
                        />
                    )}

                    {currentTab === 'wave_picking' && isTabAllowed('wave_picking') && (
                        <WavePicking
                            orders={orders}
                            onUpdateOrder={handleUpdateOrder}
                            logActivity={(message, type, details) => {
                                logActivity('wave', currentUser ? currentUser.name : 'System', message, details || '');
                            }}
                            addToast={addToast}
                        />
                    )}

                    {currentTab === 'supplies' && isTabAllowed('supplies') && (
                        <Supplies
                            purchaseOrders={purchaseOrders}
                            products={products}
                            onCreatePurchaseOrder={handleCreatePurchaseOrder}
                            onUpdatePurchaseOrder={handleUpdatePurchaseOrder}
                            onReceivePurchaseOrder={handleReceivePurchaseOrder}
                            onCancelPurchaseOrder={handleCancelPurchaseOrder}
                            onGroupPurchaseOrders={handleGroupPurchaseOrders}
                            onReceiveRmaReturn={handleReceiveRmaReturn}
                        />
                    )}

                    {currentTab === 'rma' && isTabAllowed('rma') && (
                        <RmaManager
                            purchaseOrders={purchaseOrders}
                            orders={orders}
                            products={products}
                            onCreateRmaReturn={handleCreateRmaReturn}
                            onReceiveRmaReturn={handleReceiveRmaReturn}
                        />
                    )}

                    {currentTab === 'shipping' && isTabAllowed('shipping') && (
                        <ShippingHub
                            orders={orders}
                            onUpdateOrder={handleUpdateOrder}
                            addToast={addToast}
                        />
                    )}

                    {currentTab === 'truck_loader' && isTabAllowed('truck_loader') && (
                        <TruckLoader3D
                            orders={orders}
                            onUpdateOrder={handleUpdateOrder}
                            logActivity={(message, type, details) => {
                                logActivity('shipping', currentUser ? currentUser.name : 'System', message, details || '');
                            }}
                            addToast={addToast}
                        />
                    )}

                    {currentTab === 'click_collect' && isTabAllowed('click_collect') && (
                        <ClickCollect
                            orders={orders}
                            onUpdateOrder={handleUpdateOrder}
                            currentUser={currentUser}
                            logActivity={(message, type, details) => {
                                logActivity('shipping', currentUser ? currentUser.name : 'System', message, details || '');
                            }}
                            addToast={addToast}
                        />
                    )}

                    {currentTab === 'inbound' && isTabAllowed('inbound') && (
                        <InboundPlanner
                            purchaseOrders={purchaseOrders}
                            products={products}
                            zones={zones}
                            onUpdateStock={handleUpdateStock}
                            onUpdatePurchaseOrder={handleUpdatePurchaseOrder}
                            logActivity={(message, type, details) => {
                                const allowedType = type === 'success' ? 'receive' : 'relocate';
                                logActivity(allowedType, currentUser ? currentUser.name : 'System', message, details || '');
                            }}
                            addToast={addToast}
                            docks={docks}
                            setDocks={setDocks}
                        />
                    )}

                    {currentTab === 'putaway' && isTabAllowed('putaway') && (
                        <PutawayAssistant
                            products={products}
                            purchaseOrders={purchaseOrders}
                            onUpdateProductLocation={handleUpdateProductLocation}
                            logActivity={(message, type, details) => {
                                logActivity('relocate', currentUser ? currentUser.name : 'System', message, details || '');
                            }}
                            addToast={addToast}
                        />
                    )}

                    {currentTab === 'lpn_manager' && isTabAllowed('lpn_manager') && (
                        <LpnManager
                            products={products}
                            onUpdateProductLocation={handleUpdateProductLocation}
                            logActivity={(message, type, details) => {
                                logActivity('relocate', currentUser ? currentUser.name : 'System', message, details || '');
                            }}
                            addToast={addToast}
                        />
                    )}

                    {currentTab === 'yard' && isTabAllowed('yard') && (
                        <YardManager
                            docks={docks}
                            setDocks={setDocks}
                            yardTrucks={yardTrucks}
                            setYardTrucks={setYardTrucks}
                            purchaseOrders={purchaseOrders}
                            logActivity={(message, type, details) => {
                                logActivity('receive', currentUser ? currentUser.name : 'System', message, details || '');
                            }}
                            addToast={addToast}
                        />
                    )}

                    {currentTab === 'dock_scheduling' && isTabAllowed('dock_scheduling') && (
                        <DockScheduling
                            purchaseOrders={purchaseOrders}
                            yardTrucks={yardTrucks}
                            setYardTrucks={setYardTrucks}
                            docks={docks}
                            setDocks={setDocks}
                            logActivity={(message, type, details) => {
                                logActivity('receive', currentUser ? currentUser.name : 'System', message, details || '');
                            }}
                            addToast={addToast}
                        />
                    )}

                    {currentTab === 'reorders' && isTabAllowed('reorders') && (
                        <ReorderPlanner
                            products={products}
                            purchaseOrders={purchaseOrders}
                            onCreatePurchaseOrder={handleCreatePurchaseOrder}
                            logActivity={(message, type, details) => {
                                logActivity('receive', currentUser ? currentUser.name : 'System', message, details || '');
                            }}
                            addToast={addToast}
                        />
                    )}

                    {currentTab === 'slotting' && isTabAllowed('slotting') && (
                        <SlottingOptimizer
                            products={products}
                            orders={orders}
                            zones={zones}
                            onUpdateProductLocation={handleUpdateProductLocation}
                            logActivity={(message, type, details) => {
                                logActivity('relocate', currentUser ? currentUser.name : 'System', message, details || '');
                            }}
                            addToast={addToast}
                        />
                    )}

                    {currentTab === 'compactor' && isTabAllowed('compactor') && (
                        <SpaceCompactor
                            products={products}
                            zones={zones}
                            onConsolidateStock={handleConsolidateStock}
                            logActivity={(message, type, details) => {
                                logActivity('relocate', currentUser ? currentUser.name : 'System', message, details || '');
                            }}
                            addToast={addToast}
                        />
                    )}

                    {currentTab === 'predictive' && isTabAllowed('predictive') && (
                        <PredictiveRelocation
                            products={products}
                            orders={orders}
                            onUpdateProductLocation={handleUpdateProductLocation}
                            logActivity={(message, type, details) => {
                                logActivity('relocate', currentUser ? currentUser.name : 'System', message, details || '');
                            }}
                            addToast={addToast}
                        />
                    )}

                    {currentTab === 'pick_path' && isTabAllowed('pick_path') && (
                        <PickPathOptimizer
                            products={products}
                            orders={orders}
                            logActivity={(message, type, details) => {
                                logActivity('relocate', currentUser ? currentUser.name : 'System', message, details || '');
                            }}
                            addToast={addToast}
                        />
                    )}

                    {currentTab === 'adr_manager' && isTabAllowed('adr_manager') && (
                        <AdrManager
                            products={products}
                            onUpdateProductLocation={handleUpdateProductLocation}
                            logActivity={(message, type, details) => {
                                logActivity('relocate', currentUser ? currentUser.name : 'System', message, details || '');
                            }}
                            addToast={addToast}
                        />
                    )}

                    {currentTab === 'inventory' && isTabAllowed('inventory') && (
                        <Products
                            products={products}
                            onUpdateStock={handleUpdateStock}
                            onRestockItem={handleRestockItem}
                            onUpdateThreshold={handleUpdateThreshold}
                            onUpdateBulkCategoryVat={handleUpdateBulkCategoryVat}
                            highlightedSku={highlightedItemId}
                        />
                    )}

                    {currentTab === 'products' && isTabAllowed('products') && (
                        <SalesProducts
                            products={products}
                            onAddProduct={handleCreateProduct}
                            onUpdateProduct={handleUpdateProduct}
                            onDeleteProduct={handleDeleteProduct}
                        />
                    )}

                    {currentTab === 'zones' && isTabAllowed('zones') && (
                        <Storage
                            zones={zones}
                            products={products}
                            onToggleLockZone={handleToggleLockZone}
                            highlightedZoneId={highlightedItemId}
                        />
                    )}

                    {currentTab === 'permissions' && isTabAllowed('permissions') && (
                        <UsersPermissions
                            staffList={staffList}
                            onAddStaff={handleAddStaff}
                            onUpdateStaff={handleUpdateStaff}
                            onDeleteStaff={handleDeleteStaff}
                            usersSync={usersSync}
                        />
                    )}

                    {currentTab === 'settings' && isTabAllowed('settings') && (
                        <Settings highlightedField={highlightedItemId} />
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

            {/* System Toast Notifications */}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 max-w-sm w-full select-none pointer-events-none">
                {toasts.map(toast => {
                    let borderClass = 'border-blue-500 bg-white/95 text-slate-800 shadow-blue-100/50';
                    let iconColor = 'text-blue-500 bg-blue-50';
                    let iconEl = <Info className="w-5 h-5" />;

                    if (toast.type === 'error') {
                        borderClass = 'border-rose-500 bg-white/95 text-slate-800 shadow-rose-100/50';
                        iconColor = 'text-rose-500 bg-rose-50';
                        iconEl = <AlertCircle className="w-5 h-5" />;
                    } else if (toast.type === 'warning') {
                        borderClass = 'border-amber-500 bg-white/95 text-slate-800 shadow-amber-100/50';
                        iconColor = 'text-amber-500 bg-amber-50';
                        iconEl = <AlertTriangle className="w-5 h-5" />;
                    } else if (toast.type === 'success') {
                        borderClass = 'border-emerald-500 bg-white/95 text-slate-800 shadow-emerald-100/50';
                        iconColor = 'text-emerald-500 bg-emerald-50';
                        iconEl = <CheckCircle2 className="w-5 h-5" />;
                    }

                    return (
                        <div 
                            key={toast.id} 
                            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border border-l-4 shadow-xl backdrop-blur-md transition-all duration-300 transform translate-y-0 opacity-100 animate-in slide-in-from-right-10 duration-200 ${borderClass}`}
                        >
                            <div className={`p-1.5 rounded-lg flex-shrink-0 ${iconColor}`}>
                                {iconEl}
                            </div>
                            <div className="flex-grow min-w-0">
                                <h4 className="text-[12px] font-black tracking-tight text-slate-900 leading-tight">
                                    {toast.title}
                                </h4>
                                <p className="text-[11px] font-medium text-slate-500 mt-1 leading-normal">
                                    {toast.text}
                                </p>
                            </div>
                            <button 
                                onClick={() => removeToast(toast.id)} 
                                className="text-slate-450 hover:text-slate-700 bg-transparent border-none cursor-pointer flex-shrink-0 text-sm font-bold font-mono"
                                title="Zamknij"
                            >
                                ×
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
