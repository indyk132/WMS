import React, { useEffect, useState } from 'react';
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
import { adjustInventoryStock, fetchInventoryProducts, Product, createInventoryProduct, updateInventoryProduct, deleteInventoryProduct } from './services/inventoryApi';
import { createUser, fetchUsers, updateUser, deleteUser, User } from './services/usersApi';
import { LayoutDashboard, FileText, Map, ShieldAlert, Boxes, LogOut, Package, Home as HomeIcon, BarChart3, Settings as SettingsNavIcon, Layers, ShoppingBag } from 'lucide-react';

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
                    { id: 'inventory', label: 'Stany Zapasów SKU', icon: Package },
                    { id: 'products', label: 'Katalog Produktów', icon: Layers },
                    { id: 'storefront', label: 'Sklep Internetowy ↗', icon: ShoppingBag, isExternal: true },
                ];
            case 'Logistics Planner':
                return [
                    { id: 'overview', label: 'Podgląd Magazynu', icon: LayoutDashboard },
                    { id: 'statistics', label: 'Statystyki i Raporty', icon: BarChart3 },
                    { id: 'orders', label: 'Zarządzanie Zamówieniami', icon: FileText },
                    { id: 'inventory', label: 'Stany Zapasów SKU', icon: Package },
                    { id: 'zones', label: 'Strefy Magazynowe', icon: Map },
                    { id: 'storefront', label: 'Sklep Internetowy ↗', icon: ShoppingBag, isExternal: true },
                ];
            case 'Inventory Auditor':
                return [
                    { id: 'overview', label: 'Podgląd Magazynu', icon: LayoutDashboard },
                    { id: 'inventory', label: 'Stany Zapasów SKU', icon: Package },
                    { id: 'products', label: 'Katalog Produktów', icon: Layers },
                    { id: 'zones', label: 'Strefy Magazynowe', icon: Map },
                    { id: 'storefront', label: 'Sklep Internetowy ↗', icon: ShoppingBag, isExternal: true },
                ];
            case 'Picker':
            case 'Packer':
                return [
                    { id: 'overview', label: 'Podgląd Magazynu', icon: LayoutDashboard },
                    { id: 'inventory', label: 'Stany Zapasów SKU', icon: Package },
                ];
            case 'Admin':
            case 'Warehouse Manager':
            default:
                return [
                    { id: 'overview', label: 'Podgląd Magazynu', icon: LayoutDashboard },
                    { id: 'statistics', label: 'Statystyki i Raporty', icon: BarChart3 },
                    { id: 'orders', label: 'Zarządzanie Zamówieniami', icon: FileText },
                    { id: 'inventory', label: 'Stany Zapasów SKU', icon: Package },
                    { id: 'products', label: 'Katalog Produktów', icon: Layers },
                    { id: 'zones', label: 'Strefy Magazynowe', icon: Map },
                    { id: 'permissions', label: 'Uprawnienia Użytkowników', icon: ShieldAlert },
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
    const [searchQuery, setSearchQuery] = useState('');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [inventorySync, setInventorySync] = useState({ isLoading: false, error: '' });
    const [usersSync, setUsersSync] = useState({ isLoading: false, error: '' });

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
                stockEntries: [{ stockId: i, locationId: i, locationCode, zoneGroup, quantity: stock }]
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

    useEffect(() => {
        window.localStorage.setItem('wms-products', JSON.stringify(products));
    }, [products]);

    useEffect(() => {
        window.localStorage.setItem('wms-orders', JSON.stringify(orders));
    }, [orders]);

    useEffect(() => {
        const handleStorage = (e: StorageEvent) => {
            if (e.key === 'wms-orders' && e.newValue) {
                try {
                    const parsed = JSON.parse(e.newValue);
                    if (JSON.stringify(parsed) !== JSON.stringify(orders)) {
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
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, [orders, products]);

    useEffect(() => {
        if (currentUser) {
            const allowed = getSideNavItems();
            if (allowed.length > 0 && !allowed.some(item => item.id === currentTab)) {
                setCurrentTab(allowed[0].id);
                window.localStorage.setItem('wms-current-tab', allowed[0].id);
            }
        }
    }, [currentUser, currentTab]);

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

        return list;
    }, [products, zones, orders]);

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

                <ul className="flex flex-col gap-1 px-3 flex-grow select-none">
                    {sideNavItems.map((item: any) => {
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
                    notifications={notifications}
                    readNotificationIds={readNotificationIds}
                    onMarkAllAsRead={handleMarkAllAsRead}
                    onNotificationClick={handleNotificationClick}
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
                        />
                    )}

                    {currentTab === 'statistics' && isTabAllowed('statistics') && (
                        <Statistics
                            orders={orders}
                            products={products}
                            zones={zones}
                            staffList={staffList}
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

                    {currentTab === 'inventory' && isTabAllowed('inventory') && (
                        <Products
                            products={products}
                            onUpdateStock={handleUpdateStock}
                            onRestockItem={handleRestockItem}
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
        </div>
    );
}
