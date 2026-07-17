/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  ShoppingBag,
  Grid,
  CreditCard,
  User,
  Search,
  BookOpen,
  Layout,
  RefreshCw,
  Eye,
  ArrowRight,
  Database,
  Download,
  SlidersHorizontal,
  ChevronRight,
  List,
  Check,
  Truck,
  RotateCcw,
  Star,
  Plus,
  Minus,
  CheckCircle,
  Code,
  Tag,
  LogOut,
  Sparkles,
  ClipboardCheck,
  LogIn,
  Lock,
  Mail,
  UserPlus,
  Menu,
  ChevronDown,
  Settings,
  X
} from 'lucide-react';

import { Product, Category, CartItem, Order, Address } from './types';
import {
  TEMPLATE_PRODUCTS,
  TEMPLATE_CATEGORIES,
  TEMPLATE_REVIEWS,
  ARCHITECTURE_SECTIONS,
  WIREFRAMES_ASCII
} from './data';

import ProductCard from './components/ProductCard';
import CategoryCard from './components/CategoryCard';
import CartDrawer from './components/CartDrawer';
import SearchBar from './components/SearchBar';
import ProductGallery from './components/ProductGallery';
import OrderSummary from './components/OrderSummary';
import SameDayCountdown from './components/SameDayCountdown';

const mapWmsProductToStorefront = (wmsProd: any): Product => {
  const cleanWmsSku = (wmsProd.sku || '').trim().toLowerCase();
  const templateMatch = TEMPLATE_PRODUCTS.find(
    (t) => (t.sku || '').trim().toLowerCase() === cleanWmsSku
  );

  return {
    id: `${wmsProd.sku}`,
    name: templateMatch ? templateMatch.name : `${wmsProd.name}`,
    description: templateMatch ? templateMatch.description : `Wysokiej jakości produkt z naszego katalogu. Kod SKU: ${wmsProd.sku}.`,
    price: `${Number(wmsProd.price || 0).toFixed(2)} EUR`,
    stock: `${wmsProd.stock} szt.`,
    image: wmsProd.image || (templateMatch ? templateMatch.image : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800'),
    category: templateMatch ? templateMatch.category : `${wmsProd.category || 'Ogólna'}`,
    sku: `${wmsProd.sku}`,
    rating: templateMatch ? templateMatch.rating : `4.8 / 5.0 (12 reviews)`,
    specifications: templateMatch ? templateMatch.specifications : {
      'Kod SKU': wmsProd.sku,
      'Kategoria': wmsProd.category || 'Ogólna',
      'Dostępność': `Dostępne (${wmsProd.stock} szt.)`,
      'Dostawa': 'Wysyłka w 24 godziny'
    }
  };
};

const generateDefaultWmsProducts = (): any[] => {
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

  const list: any[] = [];
  const categories = Object.keys(PRODUCT_TEMPLATES);
  let barcodeCounter = 5900000000001;

  // Add the 6 core WMS test products
  list.push(
    { productId: 1001, sku: 'SKU-10492', name: 'Płyn hamulcowy DOT-4', category: 'Chemia samochodowa', stock: 120, reorderThreshold: 100, price: 34.99, barcode: '590000001001' },
    { productId: 1002, sku: 'SKU-20391', name: 'Reflektor LED H7 SuperVolt', category: 'Części samochodowe', stock: 15, reorderThreshold: 40, price: 289.00, barcode: '590000001002' },
    { productId: 1003, sku: 'SKU-94021', name: 'Akumulator VoltPro 74Ah 12V', category: 'Części samochodowe', stock: 0, reorderThreshold: 15, price: 449.99, barcode: '590000001003' },
    { productId: 1004, sku: 'SKU-50493', name: 'Olej silnikowy Syntetic 5W30', category: 'Chemia samochodowa', stock: 8, reorderThreshold: 20, price: 179.99, barcode: '590000001004' },
    { productId: 1005, sku: 'SKU-73012', name: 'Klocki hamulcowe CarbonPremium', category: 'Części samochodowe', stock: 245, reorderThreshold: 80, price: 134.99, barcode: '590000001005' },
    { productId: 1006, sku: 'SKU-39402', name: 'Prostownik mikroprocesorowy 12V', category: 'Elektronika', stock: 85, reorderThreshold: 15, price: 249.00, barcode: '590000001006' }
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
      zone: locationCode.split('-')[0] + (locationCode.split('-')[1] || ''),
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

export default function App() {
  // Global View Mode: 'blueprint' (Architectural Documentation) vs 'sandbox' (Interactive Shopify Plus Store)
  const [viewMode, setViewMode] = useState<'blueprint' | 'sandbox'>('sandbox');

  // Blueprint documentation state
  const [activeSpecSection, setActiveSpecSection] = useState('section_1');
  const [activeWireframe, setActiveWireframe] = useState('wire_home');

  // Sandbox storefront state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCategoriesDropdownOpen, setIsCategoriesDropdownOpen] = useState(false);
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Shopping Page Tab internally inside Sandbox: 'home' | 'category' | 'checkout' | 'account' | 'login' | 'register'
  const [shopView, setShopView] = useState<'home' | 'category' | 'checkout' | 'account' | 'login' | 'register'>('home');

  // Filters state inside Category Page
  const [filterInStockOnly, setFilterInStockOnly] = useState(false);
  const [priceRange, setPriceRange] = useState<number>(1300);
  const [sortBy, setSortBy] = useState<'low-high' | 'high-low' | 'default'>('default');
  const [isGridView, setIsGridView] = useState(true);

  // Active Variant configuration inside Product detail modal / page
  const [selectedColor, setSelectedColor] = useState('Srebrny');
  const [selectedSize, setSelectedSize] = useState('38mm');

  // Back-in-stock notification state
  const [backInStockEmail, setBackInStockEmail] = useState('');
  const [subscribedProducts, setSubscribedProducts] = useState<Record<string, string[]>>(() => {
    try {
      const stored = localStorage.getItem('storefront_stock_subscriptions');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const isProductOutOfStock = (product: Product): boolean => {
    const lowerStock = (product.stock || '').toLowerCase();
    if (lowerStock.includes('brak') || lowerStock.includes('out of stock')) return true;
    const match = lowerStock.match(/(\d+)/);
    if (match && parseInt(match[1], 10) <= 0) return true;
    return false;
  };

  const handleSubscribeStock = (productId: string, email: string) => {
    const trimmed = email.trim();
    if (!trimmed) return;
    
    setSubscribedProducts(prev => {
      const currentList = prev[productId] || [];
      if (currentList.includes(trimmed)) return prev;
      
      const updated = {
        ...prev,
        [productId]: [...currentList, trimmed]
      };
      
      localStorage.setItem('storefront_stock_subscriptions', JSON.stringify(updated));
      return updated;
    });
    setBackInStockEmail('');
  };

  // Active User session state
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return !!localStorage.getItem('wms_customer_email');
  });

  const [customerEmail, setCustomerEmail] = useState(() => {
    return localStorage.getItem('wms_customer_email') || '';
  });

  const getLoggedInUserDetail = (key: string, defaultValue: string) => {
    const loggedInEmail = localStorage.getItem('wms_customer_email');
    if (!loggedInEmail) return defaultValue;
    const usersJson = localStorage.getItem('wms_store_users');
    if (!usersJson) return defaultValue;
    try {
      const users = JSON.parse(usersJson);
      const user = users.find((u: any) => u.email === loggedInEmail);
      return user ? user[key] || defaultValue : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  };

  // Checkout information state (Prepopulated with user and developer metadata)
  const [firstName, setFirstName] = useState(() => getLoggedInUserDetail('firstName', ''));
  const [lastName, setLastName] = useState(() => getLoggedInUserDetail('lastName', ''));
  const [streetAddress, setStreetAddress] = useState(() => getLoggedInUserDetail('streetAddress', ''));
  const [postalCode, setPostalCode] = useState(() => getLoggedInUserDetail('postalCode', ''));
  const [city, setCity] = useState(() => getLoggedInUserDetail('city', ''));
  const [phone, setPhone] = useState(() => getLoggedInUserDetail('phone', ''));
  const [shippingMethod, setShippingMethod] = useState<'express' | 'air' | 'pickup'>('express');
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromoPct, setAppliedPromoPct] = useState(0);

  const [giftWrapping, setGiftWrapping] = useState(false);
  const [giftStyle, setGiftStyle] = useState('Klasyczny czerwony z wstążką');
  const [giftMessage, setGiftMessage] = useState('');

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register Form State
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regStreetAddress, setRegStreetAddress] = useState('');
  const [regPostalCode, setRegPostalCode] = useState('');
  const [regCity, setRegCity] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regError, setRegError] = useState('');

  const [submittedOrder, setSubmittedOrder] = useState<any>(null);
  const [orderComplete, setOrderComplete] = useState(false);
  const [registeredRma, setRegisteredRma] = useState<string | null>(null);
  const [registeredRmaOrderId, setRegisteredRmaOrderId] = useState<string>('');
  const [rmaReason, setRmaReason] = useState('Damaged casing');
  const [selectedRmaOrderId, setSelectedRmaOrderId] = useState('');
  // Seed default user account if not exists
  useEffect(() => {
    const usersJson = localStorage.getItem('wms_store_users');
    if (!usersJson) {
      const defaultUsers = [
        {
          email: 'klient@apexstore.pl',
          password: 'haslo',
          firstName: 'Alexander',
          lastName: 'Kowalski',
          streetAddress: 'Marszalkowska 104 m. 12',
          postalCode: '00-017',
          city: 'Warszawa',
          phone: '+48 500 600 700'
        }
      ];
      localStorage.setItem('wms_store_users', JSON.stringify(defaultUsers));
    }
  }, []);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const usersJson = localStorage.getItem('wms_store_users');
    if (!usersJson) {
      setLoginError('Błąd bazy danych użytkowników.');
      return;
    }
    try {
      const users = JSON.parse(usersJson);
      const matchedUser = users.find(
        (u: any) => u.email.toLowerCase() === loginEmail.toLowerCase() && u.password === loginPassword
      );
      if (matchedUser) {
        // Successful login
        setIsLoggedIn(true);
        setCustomerEmail(matchedUser.email);
        setFirstName(matchedUser.firstName);
        setLastName(matchedUser.lastName);
        setStreetAddress(matchedUser.streetAddress);
        setPostalCode(matchedUser.postalCode);
        setCity(matchedUser.city);
        setPhone(matchedUser.phone);
        
        localStorage.setItem('wms_customer_email', matchedUser.email);
        setShopView('home');
        
        // Reset fields
        setLoginEmail('');
        setLoginPassword('');
      } else {
        setLoginError('Nieprawidłowy e-mail lub hasło.');
      }
    } catch (err) {
      setLoginError('Błąd podczas logowania.');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    
    if (!regEmail || !regPassword || !regFirstName || !regLastName) {
      setRegError('Proszę wypełnić wszystkie wymagane pola.');
      return;
    }

    const usersJson = localStorage.getItem('wms_store_users') || '[]';
    try {
      const users = JSON.parse(usersJson);
      const exists = users.some((u: any) => u.email.toLowerCase() === regEmail.toLowerCase());
      if (exists) {
        setRegError('Użytkownik o takim adresie e-mail już istnieje.');
        return;
      }

      const newUser = {
        email: regEmail,
        password: regPassword,
        firstName: regFirstName,
        lastName: regLastName,
        streetAddress: regStreetAddress,
        postalCode: regPostalCode,
        city: regCity,
        phone: regPhone
      };

      const updatedUsers = [...users, newUser];
      localStorage.setItem('wms_store_users', JSON.stringify(updatedUsers));

      // Auto login
      setIsLoggedIn(true);
      setCustomerEmail(newUser.email);
      setFirstName(newUser.firstName);
      setLastName(newUser.lastName);
      setStreetAddress(newUser.streetAddress);
      setPostalCode(newUser.postalCode);
      setCity(newUser.city);
      setPhone(newUser.phone);

      localStorage.setItem('wms_customer_email', newUser.email);
      setShopView('home');

      // Reset fields
      setRegEmail('');
      setRegPassword('');
      setRegFirstName('');
      setRegLastName('');
      setRegStreetAddress('');
      setRegPostalCode('');
      setRegCity('');
      setRegPhone('');
    } catch (err) {
      setRegError('Błąd podczas rejestracji.');
    }
  };

  // Real WMS integration states
  const [wmsProducts, setWmsProducts] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('wms-products');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.length >= 200) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Failed to parse stored products in storefront initializer:", e);
    }
    const defaults = generateDefaultWmsProducts();
    try {
      localStorage.setItem('wms-products', JSON.stringify(defaults));
    } catch (e) {
      console.error(e);
    }
    return defaults;
  });
  const [wmsOrders, setWmsOrders] = useState<any[]>([]);
  const [selectedTrackedOrderId, setSelectedTrackedOrderId] = useState<string>('');

  // Load real WMS products and orders from localStorage and live API
  useEffect(() => {
    const syncLocalOrdersWithBackend = async (localOrders: any[]) => {
      const unsyncedOrders = localOrders.filter(o => !o.synced);
      if (unsyncedOrders.length === 0) return;

      console.log(`Found ${unsyncedOrders.length} unsynced orders. Attempting to sync...`);
      let updatedAny = false;

      for (const ord of unsyncedOrders) {
        try {
          const response = await fetch('http://localhost:3001/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ord)
          });
          if (response.ok) {
            ord.synced = true;
            updatedAny = true;
            console.log(`Synced order ${ord.id} to WMS DB.`);
          }
        } catch (err) {
          console.warn(`Failed to sync order ${ord.id}:`, err);
        }
      }

      if (updatedAny) {
        localStorage.setItem('wms-orders', JSON.stringify(localOrders));
      }
    };

    const loadWmsData = async () => {
      let localOrders: any[] = [];
      // 1. Try local storage first
      try {
        const storedProds = localStorage.getItem('wms-products');
        if (storedProds) {
          const parsed = JSON.parse(storedProds);
          if (parsed.length >= 200) {
            setWmsProducts(parsed);
          }
        }
        const storedOrders = localStorage.getItem('wms-orders');
        if (storedOrders) {
          localOrders = JSON.parse(storedOrders);
          setWmsOrders(localOrders);
        }
      } catch (err) {
        console.error("Failed to load WMS data in storefront:", err);
      }

      // 2. Fetch directly from WMS Backend API for live database synchronization
      try {
        let response;
        try {
          response = await fetch('/api/inventory');
        } catch {
          // If relative fails (e.g. running on port 5174 without proxy), try absolute localhost:3001
          response = await fetch('http://localhost:3001/api/inventory');
        }

        if (response && response.ok) {
          const data = await response.json();
          const prodMap = new Map<string, any>();
          
          for (const row of data) {
            const sku = row.sku || `PROD-${row.products_id}`;
            const qty = Number(row.quantity || 0);
            if (prodMap.has(sku)) {
              const existing = prodMap.get(sku);
              existing.stock += qty;
              if (row.location_code && !existing.locations.includes(row.location_code)) {
                existing.locations.push(row.location_code);
              }
              if (row.zone_group && !existing.zoneGroups.includes(row.zone_group)) {
                existing.zoneGroups.push(row.zone_group);
              }
              existing.stockEntries.push({
                stockId: row.id,
                locationId: row.location_id,
                locationCode: row.location_code,
                zoneGroup: row.zone_group,
                quantity: qty
              });
            } else {
              const stock = qty;
              const reorderThreshold = Number(row.reorder_threshold || 20);
              const status = stock === 0 ? 'Out of Stock' : (stock < reorderThreshold ? 'Low Stock' : 'In Stock');
              prodMap.set(sku, {
                productId: row.products_id,
                sku: sku,
                barcode: row.barcode || '',
                name: row.product_name || row.name || 'Produkt',
                category: row.category || 'Towar magazynowy',
                stock: stock,
                reorderThreshold: reorderThreshold,
                zone: row.location_code ? (row.location_code.split('-')[0] + (row.location_code.split('-')[1] || '')) : 'UNASSIGNED',
                status: status,
                price: Number(row.price || 0),
                locationCode: row.location_code || 'UNASSIGNED',
                zoneGroup: row.zone_group || 'General',
                primaryLocationId: row.location_id,
                locations: row.location_code ? [row.location_code] : [],
                zoneGroups: row.zone_group ? [row.zone_group] : [],
                stockEntries: [{
                  stockId: row.id,
                  locationId: row.location_id,
                  locationCode: row.location_code,
                  zoneGroup: row.zone_group,
                  quantity: qty
                }]
              });
            }
          }
          const fetchedProducts = Array.from(prodMap.values());
          if (fetchedProducts.length > 0) {
            setWmsProducts(fetchedProducts);
            localStorage.setItem('wms-products', JSON.stringify(fetchedProducts));
          }
        }
      } catch (err) {
        console.warn("WMS database API connection unavailable, using local cache:", err);
      }

      // 3. Fetch orders directly from WMS Backend API
      try {
        let ordersResponse;
        try {
          ordersResponse = await fetch('/api/orders');
        } catch {
          ordersResponse = await fetch('http://localhost:3001/api/orders');
        }

        if (ordersResponse && ordersResponse.ok) {
          const dbOrders = await ordersResponse.json();
          if (dbOrders) {
            // Merge database orders with local storage orders
            const merged = [...dbOrders];
            for (const localOrd of localOrders) {
              if (!merged.some(o => o.id === localOrd.id)) {
                merged.push(localOrd);
              }
            }
            setWmsOrders(merged);
            localStorage.setItem('wms-orders', JSON.stringify(merged));
          }
        }
      } catch (err) {
        console.warn("WMS database API for orders unavailable, using local cache:", err);
      }

      // 4. Sync unsynced local orders
      if (localOrders.length > 0) {
        await syncLocalOrdersWithBackend(localOrders);
      }
    };
    loadWmsData();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'wms-products' || e.key === 'wms-orders') {
        loadWmsData();
      }
    };

    const handleLocalUpdate = () => {
      loadWmsData();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('wms-data-updated', handleLocalUpdate);

    const interval = setInterval(() => {
      loadWmsData();
    }, 5000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('wms-data-updated', handleLocalUpdate);
      clearInterval(interval);
    };
  }, []);

  // Persist cart items locally using standard LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('wms_checkout_cart');
    if (saved) {
      try {
        setCart(JSON.parse(saved));
      } catch (e) {
        console.error("Cart retrieval parsing anomaly resolved.");
      }
    }
  }, []);

  const saveCartToStorage = (updatedCart: CartItem[]) => {
    setCart(updatedCart);
    localStorage.setItem('wms_checkout_cart', JSON.stringify(updatedCart));
  };

  // Cart operations
  const handleAddToCart = (product: Product, size = '38mm', color = 'Silver') => {
    const existing = cart.find(
      (item) =>
        item.product.id === product.id &&
        item.selectedColor === color &&
        item.selectedSize === size
    );

    let updatedCart: CartItem[];
    if (existing) {
      updatedCart = cart.map((item) =>
        item.id === existing.id ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      updatedCart = [
        ...cart,
        {
          id: `cart_${product.id}_${Date.now()}`,
          product,
          quantity: 1,
          selectedColor: color,
          selectedSize: size
        }
      ];
    }
    saveCartToStorage(updatedCart);
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (id: string, qty: number) => {
    if (qty <= 0) {
      handleRemoveItem(id);
      return;
    }
    const updated = cart.map((item) => (item.id === id ? { ...item, quantity: qty } : item));
    saveCartToStorage(updated);
  };

  const handleRemoveItem = (id: string) => {
    const updated = cart.filter((item) => item.id !== id);
    saveCartToStorage(updated);
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Map storefront order items to WMS order items format
    const wmsOrderItems = cart.map(item => {
      const cleanName = item.product.name.trim();
      const cleanSku = item.product.sku.trim();
      return {
        name: cleanName,
        sku: cleanSku,
        qty: item.quantity
      };
    });

    // Generate unique order ID in format ORD-SXXXXX
    let existingWmsOrders: any[] = [];
    try {
      const stored = localStorage.getItem('wms-orders');
      if (stored) {
        existingWmsOrders = JSON.parse(stored);
      }
    } catch (err) {
      console.error(err);
    }

    let newOrderId = '';
    while (true) {
      const randNum = Math.floor(10000 + Math.random() * 90000);
      newOrderId = `ORD-S${randNum}`;
      if (!existingWmsOrders.some(o => o.id === newOrderId)) {
        break;
      }
    }

    // Get current date formatted like WMS (e.g. 11 Cze, 10:20)
    const d = new Date();
    const months = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'];
    const currentHour = String(d.getHours()).padStart(2, '0');
    const currentMin = String(d.getMinutes()).padStart(2, '0');
    const shipmentDate = `${d.getDate()} ${months[d.getMonth()]}, ${currentHour}:${currentMin}`;

    const pin = shippingMethod === 'pickup' 
      ? `PU-${Math.floor(100000 + Math.random() * 900000)}` 
      : '';

    const newWmsOrder = {
      id: newOrderId,
      customer: `${firstName} ${lastName}`,
      destination: shippingMethod === 'pickup' ? 'Odbiór w HUB-PL-01' : `${city}, PL`,
      status: 'Oczekujące',
      priority: shippingMethod === 'express' ? 'Wysoki' : 'Normalny',
      shipmentDate: shipmentDate,
      items: wmsOrderItems,
      warehouseCode: 'HUB-PL-01',
      internalNotes: `Zamówienie ze sklepu internetowego. Klient: ${firstName} ${lastName}, Tel: ${phone}. E-mail: ${customerEmail}.${
        shippingMethod === 'pickup'
          ? ` Odbiór w HUB-PL-01. PIN: ${pin}.`
          : ` Adres: ${streetAddress}, ${postalCode} ${city}. Dostawca: ${shippingMethod === 'express' ? 'Express Cargo' : 'Air Mail'}.`
      }${
        giftWrapping ? ` | 🎁 OPCJA PREZENTOWA - Styl: ${giftStyle}, Bilecik: "${giftMessage}"` : ''
      }`,
      internalNotesActor: 'Sklep Internetowy',
      isPacked: false,
      synced: false,
      giftWrapping: giftWrapping,
      giftStyle: giftWrapping ? giftStyle : '',
      giftMessage: giftWrapping ? giftMessage : '',
      isPickup: shippingMethod === 'pickup',
      pickupCode: pin
    };

    // Save to WMS orders list
    existingWmsOrders.push(newWmsOrder);
    localStorage.setItem('wms-orders', JSON.stringify(existingWmsOrders));

    // Try to sync with backend immediately
    try {
      const response = await fetch('http://localhost:3001/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWmsOrder)
      });
      if (response.ok) {
        newWmsOrder.synced = true;
        const idx = existingWmsOrders.findIndex(o => o.id === newOrderId);
        if (idx !== -1) {
          existingWmsOrders[idx].synced = true;
          localStorage.setItem('wms-orders', JSON.stringify(existingWmsOrders));
        }
        console.log(`Successfully synced order ${newOrderId} with backend WMS.`);
      }
    } catch (err) {
      console.warn("WMS backend not available during checkout, order saved locally:", err);
    }

    // Deduct stock in WMS products list
    let existingWmsProducts: any[] = [];
    try {
      const storedProds = localStorage.getItem('wms-products');
      if (storedProds) {
        existingWmsProducts = JSON.parse(storedProds);
      }
    } catch (err) {
      console.error(err);
    }

    cart.forEach(item => {
      const cleanSku = item.product.sku.trim();
      const wmsProd = existingWmsProducts.find(p => p.sku === cleanSku);
      if (wmsProd) {
        wmsProd.stock = Math.max(0, wmsProd.stock - item.quantity);
      }
    });
    localStorage.setItem('wms-products', JSON.stringify(existingWmsProducts));

    // Package storefront UI transaction payload
    const transactionPayload = {
      order_id: newOrderId,
      order_number: `APX-${Date.now().toString().slice(-6)}`,
      customer: {
        email: customerEmail,
        firstName,
        lastName,
        phone
      },
      delivery_address: {
        street: shippingMethod === 'pickup' ? 'Odbiór Osobisty HUB-PL-01' : streetAddress,
        postalCode: shippingMethod === 'pickup' ? '00-001' : postalCode,
        city: shippingMethod === 'pickup' ? 'Warszawa' : city,
        country: 'Poland'
      },
      logistics: {
        method: shippingMethod === 'pickup' ? 'Odbiór Osobisty' : (shippingMethod === 'express' ? 'Express Cargo' : 'Air Mail'),
        cost_eur: shippingMethod === 'air' ? 45 : 0
      },
      isPickup: shippingMethod === 'pickup',
      pickupCode: pin,
      financials: {
        applied_promo_percentage: appliedPromoPct * 100,
        subtotal_before_discount: cart.reduce((acc, item) => {
          const match = item.product.price.match(/[\d.,]+/);
          return acc + (match ? parseFloat(match[0].replace(/,/g, '')) : 0) * item.quantity;
        }, 0)
      },
      items: cart.map(item => ({
        id: item.id,
        sku: item.product.sku,
        name: item.product.name,
        qty: item.quantity,
        variant_color: item.selectedColor,
        variant_size: item.selectedSize
      })),
      timestamp: new Date().toISOString()
    };

    setSubmittedOrder(transactionPayload);
    setOrderComplete(true);
    setCart([]);
    localStorage.removeItem('wms_checkout_cart');

    // Trigger storage event so WMS Admin and Terminal views update instantly
    window.dispatchEvent(new Event('storage'));
    // Trigger custom local event so storefront updates its own states instantly
    window.dispatchEvent(new Event('wms-data-updated'));
  };

  // Switch categories dynamically from homepage or category bar
  const handleCategorySelect = (categoryName: string) => {
    setSelectedCategory(categoryName);
    setShopView('category');
    setSelectedProduct(null);
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    // Reset selected variant specs to item default styles
    setSelectedColor('Silver');
    setSelectedSize('38mm');
  };

  const handleApplyPromo = (e: React.MouseEvent) => {
    e.preventDefault();
    if (promoCode.toUpperCase() === 'APEX10') {
      setAppliedPromoPct(0.1);
    } else {
      setAppliedPromoPct(0);
    }
  };

  const downloadDpdReturnLabel = async (rmaCode: string, orderId: string) => {
    try {
      const jspdfModule = await new Promise<any>((resolve, reject) => {
        if ((window as any).jspdf) {
          resolve((window as any).jspdf);
          return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = () => resolve((window as any).jspdf);
        script.onerror = (e) => reject(e);
        document.body.appendChild(script);
      });

      if (!jspdfModule) {
        alert("Błąd podczas ładowania modułu PDF.");
        return;
      }

      const { jsPDF } = jspdfModule.jspdf ? jspdfModule : (window as any).jspdf;
      
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [100, 150]
      });

      // Border
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.rect(2, 2, 96, 146);

      // Header: DPD Logo Block
      doc.setFillColor(0, 0, 0);
      doc.rect(2, 2, 96, 15, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('DPD RETURN SERVICE', 5, 11);

      // Hub Code / Routing symbols (top right of header)
      doc.setFontSize(10);
      doc.text('RET-PL-01', 75, 11);

      // Divider
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.3);
      doc.line(2, 17, 98, 17);

      // Routing Block
      doc.setFillColor(240, 240, 240);
      doc.rect(2, 17, 96, 18, 'F');
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(26);
      doc.text('WAW', 36, 31);
      doc.setFontSize(9);
      doc.text('DEPOT: 02', 6, 28);
      doc.text('ROUTE: B35', 70, 28);

      doc.line(2, 35, 98, 35);

      // Sender Section
      doc.setFontSize(8);
      doc.setFont('Helvetica', 'bold');
      doc.text('NADAWCA (SENDER):', 5, 40);
      doc.setFont('Helvetica', 'normal');
      
      const order = wmsOrders.find((o: any) => o.id === orderId);
      let senderName = order ? order.customer : 'Alexander Kowalski';
      let senderAddress = 'ul. Jasna 12 m. 4';
      let senderCity = '00-010 Warszawa';
      let senderPhone = '+48 501 234 567';

      if (order && order.internalNotes) {
        const notes = order.internalNotes;
        const addrMatch = notes.match(/Adres:\s*([^,.\n]+),\s*(\d{2}-\d{3}\s+[^,.\n]+)/);
        if (addrMatch) {
          senderAddress = addrMatch[1].trim();
          senderCity = addrMatch[2].trim();
        }
        const phoneMatch = notes.match(/Tel:\s*([^,.\n]+)/);
        if (phoneMatch) {
          senderPhone = phoneMatch[1].trim();
        }
      }

      doc.text(`Name: ${senderName}`, 5, 45);
      doc.text(`Address: ${senderAddress}`, 5, 49);
      doc.text(`City: ${senderCity}`, 5, 53);
      doc.text(`Phone: ${senderPhone}`, 5, 57);

      doc.line(2, 61, 98, 61);

      // Recipient Section
      doc.setFont('Helvetica', 'bold');
      doc.text('ODBIORCA (RECIPIENT):', 5, 66);
      doc.setFont('Helvetica', 'normal');
      doc.text('APEX WMS Logistics Center', 5, 71);
      doc.text('ul. Magazynowa 4, Rampa 12', 5, 75);
      doc.text('00-001 Warszawa, Polska', 5, 79);
      doc.text('Ref: APEX-RETURN-DEPT', 5, 83);

      doc.line(2, 87, 98, 87);

      // Package details
      doc.setFont('Helvetica', 'bold');
      doc.text('SZCZEGÓŁY PRZESYŁKI (SHIPMENT DETAILS):', 5, 92);
      doc.setFont('Helvetica', 'normal');
      doc.text(`Zlecenie RMA: ${rmaCode}`, 5, 97);
      doc.text(`Dotyczy zamówienia: ${orderId}`, 5, 101);
      doc.text(`Data zgłoszenia: ${new Date().toLocaleDateString('pl-PL')}`, 5, 105);
      
      let itemsStr = '';
      if (order && order.items) {
        itemsStr = order.items.map((i: any) => `${i.sku} (x${i.qty})`).join(', ');
      } else {
        itemsStr = 'Zwracane produkty';
      }
      if (itemsStr.length > 40) itemsStr = itemsStr.substring(0, 38) + '...';
      doc.text(`Zawartość: ${itemsStr}`, 5, 109);

      doc.line(2, 113, 98, 113);

      // Barcode Section
      const barcodeXStart = 22;
      const barcodeYStart = 117;
      const barcodeHeight = 18;
      const barcodeString = `*${rmaCode}*`;
      
      doc.setFillColor(0, 0, 0);
      let xOffset = barcodeXStart;
      for (let charIdx = 0; charIdx < barcodeString.length; charIdx++) {
        const code = barcodeString.charCodeAt(charIdx);
        const pattern = [
          (code & 1) ? 0.4 : 1.2,
          0.6,
          (code & 2) ? 1.2 : 0.4,
          0.4,
          (code & 4) ? 0.4 : 1.2,
          0.8
        ];
        pattern.forEach((w, pIdx) => {
          if (pIdx % 2 === 0) {
            doc.rect(xOffset, barcodeYStart, w, barcodeHeight, 'F');
          }
          xOffset += w;
        });
      }

      // Print text below barcode
      doc.setFont('Courier', 'bold');
      doc.setFontSize(10);
      doc.text(rmaCode, 33, 140);

      doc.save(`Etykieta_Zwrotna_DPD_${rmaCode}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Wystąpił błąd podczas generowania etykiety PDF.");
    }
  };

  const handleRmaSubmit = async () => {
    const targetOrderId = selectedRmaOrderId || (customerWmsOrders[0] ? customerWmsOrders[0].id : '');
    if (!targetOrderId) return;

    const rmaCode = `RMA-S${Date.now().toString().slice(-5)}`;
    setRegisteredRma(rmaCode);
    setRegisteredRmaOrderId(targetOrderId);

    const updatedWmsOrders = [...wmsOrders];
    const orderIndex = updatedWmsOrders.findIndex(o => o.id === targetOrderId);
    if (orderIndex !== -1) {
      const order = updatedWmsOrders[orderIndex];
      const appendNotes = `\n[RMA]: Klient zgłosił chęć zwrotu. Kod RMA: ${rmaCode}. Powód: ${rmaReason}`;
      order.internalNotes = (order.internalNotes || '') + appendNotes;
      
      localStorage.setItem('wms-orders', JSON.stringify(updatedWmsOrders));
      setWmsOrders(updatedWmsOrders);

      // Create return PO in wms-purchase-orders (Supplies panel)
      let existingPOs: any[] = [];
      try {
        const storedPOs = localStorage.getItem('wms-purchase-orders');
        if (storedPOs) {
          existingPOs = JSON.parse(storedPOs);
        }
      } catch (err) {
        console.error("Failed to parse purchase orders in storefront:", err);
      }

      const returnItems = order.items.map((item: any) => ({
        sku: item.sku,
        name: item.name,
        qtyOrdered: item.qty || 1
      }));

      const d = new Date();
      const months = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'];
      const createdDate = `${d.getDate()} ${months[d.getMonth()]}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      
      const expDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
      const expectedDeliveryDate = `${expDate.getDate()} ${months[expDate.getMonth()]}, 12:00`;

      const rmaPo = {
        id: rmaCode,
        createdDate: createdDate,
        status: 'ReturnPending',
        vendorName: `${order.customer || 'Klient'} (Zwrot RMA)`,
        expectedDeliveryDate: expectedDeliveryDate,
        items: returnItems,
        internalNotes: `Zwrot RMA do zamówienia ${targetOrderId}. Powód: ${rmaReason}`
      };

      existingPOs = [rmaPo, ...existingPOs];
      localStorage.setItem('wms-purchase-orders', JSON.stringify(existingPOs));

      window.dispatchEvent(new Event('storage'));

      try {
        await fetch(`http://localhost:3001/api/orders/${targetOrderId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            notes: order.internalNotes
          })
        });
        console.log(`Successfully registered RMA return request for order ${targetOrderId} in backend.`);
      } catch (err) {
        console.warn("WMS backend not available to register RMA return request:", err);
      }
    }
  };

  // We can dynamically derive extra categories from wmsProducts
  const dynamicCategories = Array.from(
    new Set(wmsProducts.map((p) => (p.category || '').trim()).filter(Boolean))
  ).filter((cat: any) => !TEMPLATE_CATEGORIES.some(t => t.name.trim().toLowerCase() === cat.toLowerCase()));

  const allCategories = [
    ...TEMPLATE_CATEGORIES,
    ...dynamicCategories.map((cat: any) => ({
      id: `cat_${cat.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      name: `${cat}`,
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=800',
      productCount: `${wmsProducts.filter(p => (p.category || '').trim().toLowerCase() === cat.toLowerCase()).length} products`,
      description: `Products from our catalog in category ${cat}.`
    }))
  ];

  // Filtered sandbox results based on category, stock status and price filters
  const getFilteredSandboxProducts = () => {
    const combinedProducts = [
      ...wmsProducts.map(mapWmsProductToStorefront),
      ...TEMPLATE_PRODUCTS
    ];
    
    // Deduplicate by SKU
    const uniqueProducts: Product[] = [];
    const seenSkus = new Set();
    for (const p of combinedProducts) {
      const cleanSku = p.sku.trim();
      if (!seenSkus.has(cleanSku)) {
        seenSkus.add(cleanSku);
        uniqueProducts.push(p);
      }
    }

    return uniqueProducts.filter(p => {
      // Filter by category
      if (selectedCategory) {
        const cleanCat = p.category.trim().toLowerCase();
        if (cleanCat !== selectedCategory.toLowerCase()) return false;
      }
      // Filter by stock
      if (filterInStockOnly) {
        const lowerStock = p.stock.toLowerCase();
        if (lowerStock.includes('brak') || lowerStock.includes('out of stock')) return false;
        
        const match = lowerStock.match(/(\d+)/);
        if (match && parseInt(match[1], 10) <= 0) return false;
      }
      // Filter by pricing
      const match = p.price.match(/[\d.,]+/);
      const val = match ? parseFloat(match[0].replace(/,/g, '')) : 0;
      if (val > priceRange) return false;

      return true;
    }).sort((a, b) => {
      const matchA = a.price.match(/[\d.,]+/);
      const valA = matchA ? parseFloat(matchA[0].replace(/,/g, '')) : 0;
      const matchB = b.price.match(/[\d.,]+/);
      const valB = matchB ? parseFloat(matchB[0].replace(/,/g, '')) : 0;

      if (sortBy === 'low-high') return valA - valB;
      if (sortBy === 'high-low') return valB - valA;
      return 0; // Default
    });
  };

  // Derive customer orders for WMS tracking
  const customerWmsOrders = wmsOrders.filter(order => {
    return order.internalNotes?.includes(customerEmail) || order.customer === `${firstName} ${lastName}`;
  });

  const activeTrackedOrder = customerWmsOrders.find(o => o.id === selectedTrackedOrderId) || customerWmsOrders[0] || null;
  const isAssembly = activeTrackedOrder ? ['Oczekuje na pakowanie', 'Spakowane', 'Wysłane', 'Dostarczone'].includes(activeTrackedOrder.status) : false;
  const isDispatched = activeTrackedOrder ? ['Spakowane', 'Wysłane', 'Dostarczone'].includes(activeTrackedOrder.status) : false;

  const filteredSandboxProducts = getFilteredSandboxProducts();

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans flex flex-col selection:bg-zinc-800 selection:text-white" id="main-blueprint-app">
      
      {/* Premium Side Drawer Menu */}
      <AnimatePresence>
        {isMenuDrawerOpen && (
          <>
            {/* Backdrop Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuDrawerOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />

            {/* Side Drawer Content */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 bottom-0 left-0 w-80 max-w-[85vw] bg-zinc-950 border-r border-zinc-900 shadow-2xl p-6 z-55 flex flex-col justify-between font-sans"
            >
              <div className="space-y-6">
                {/* Header: Title and Close button */}
                <div className="flex items-center justify-between pb-4 border-b border-zinc-900">
                  <div className="flex flex-col">
                    <span className="text-sm font-black uppercase tracking-[0.2em] text-white">APEX STORE</span>
                    <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-mono mt-0.5">Nawigacja</span>
                  </div>
                  <button
                    onClick={() => setIsMenuDrawerOpen(false)}
                    className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg cursor-pointer transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Primary Navigation Links */}
                <div className="space-y-1.5">
                  <button
                    onClick={() => {
                      setShopView('home');
                      setSelectedProduct(null);
                      setSelectedCategory(null);
                      setIsMenuDrawerOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-mono tracking-wide transition-all cursor-pointer ${
                      shopView === 'home' && !selectedProduct
                        ? 'bg-white text-black font-bold'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
                    }`}
                  >
                    <Layout size={14} />
                    Strona główna
                  </button>

                  <button
                    onClick={() => {
                      setShopView('category');
                      setSelectedProduct(null);
                      setSelectedCategory(null);
                      setIsMenuDrawerOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-mono tracking-wide transition-all cursor-pointer ${
                      shopView === 'category' && !selectedCategory && !selectedProduct
                        ? 'bg-white text-black font-bold'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Grid size={14} />
                      Wszystkie produkty
                    </span>
                  </button>

                  <div className="pl-4 py-1.5 space-y-1 border-l border-zinc-900">
                    <span className="text-[9px] uppercase tracking-wider text-zinc-650 block pl-2 mb-1">Kategorie</span>
                    {allCategories.map(cat => {
                      const cleanName = cat.name.trim();
                      const isSelected = selectedCategory === cleanName;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => {
                            setShopView('category');
                            setSelectedCategory(cleanName);
                            setSelectedProduct(null);
                            setIsMenuDrawerOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-md text-[11px] font-mono transition-all cursor-pointer flex justify-between items-center ${
                            isSelected && shopView === 'category'
                              ? 'text-white bg-zinc-900 font-bold'
                              : 'text-zinc-450 hover:text-white hover:bg-zinc-900/30'
                          }`}
                        >
                          <span>{cleanName}</span>
                          {isSelected && <span className="h-1 w-1 rounded-full bg-white" />}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => {
                      setShopView('checkout');
                      setSelectedProduct(null);
                      setIsMenuDrawerOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-mono tracking-wide transition-all cursor-pointer ${
                      shopView === 'checkout'
                        ? 'bg-white text-black font-bold'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <CreditCard size={14} />
                      Bezpieczna kasa
                    </span>
                    {cart.length > 0 && (
                      <span className="text-[9px] bg-emerald-950 border border-emerald-900 text-emerald-400 px-1.5 py-0.25 font-bold font-mono">
                        {cart.reduce((a, b) => a + b.quantity, 0)} szt.
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      if (isLoggedIn) {
                        setShopView('account');
                      } else {
                        setShopView('login');
                      }
                      setSelectedProduct(null);
                      setIsMenuDrawerOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-mono tracking-wide transition-all cursor-pointer ${
                      shopView === 'account'
                        ? 'bg-white text-black font-bold'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
                    }`}
                  >
                    <User size={14} />
                    Panel klienta / RMA
                  </button>
                </div>
              </div>

              {/* Footer inside Drawer: Session Info and WMS status */}
              <div className="pt-4 border-t border-zinc-900 space-y-4">
                {isLoggedIn ? (
                  <div className="space-y-2 text-xs font-mono">
                    <div className="text-[10px] text-zinc-550">ZALOGOWANY JAKO</div>
                    <div className="text-white truncate font-bold">{customerEmail}</div>
                    <button
                      onClick={() => {
                        setIsLoggedIn(false);
                        setCustomerEmail('');
                        localStorage.removeItem('wms_customer_email');
                        setFirstName('');
                        setLastName('');
                        setStreetAddress('');
                        setPostalCode('');
                        setCity('');
                        setPhone('');
                        setShopView('home');
                        setIsMenuDrawerOpen(false);
                      }}
                      className="text-[10px] text-red-400 hover:underline uppercase tracking-wider font-bold transition-colors cursor-pointer text-left block"
                    >
                      Wyloguj się
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <button
                      onClick={() => {
                        setShopView('login');
                        setIsMenuDrawerOpen(false);
                      }}
                      className="px-2 py-2 text-center bg-zinc-900 hover:bg-zinc-850 text-zinc-200 border border-zinc-800 transition-colors cursor-pointer"
                    >
                      Logowanie
                    </button>
                    <button
                      onClick={() => {
                        setShopView('register');
                        setIsMenuDrawerOpen(false);
                      }}
                      className="px-2 py-2 text-center bg-white text-black hover:bg-zinc-200 transition-colors cursor-pointer"
                    >
                      Rejestracja
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between text-[9px] font-mono text-zinc-600">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    WMS LIVE SYNC
                  </div>
                  <span>v1.2.0</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* Premium Shop Header Bar */}
      <header className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-900 px-6 py-4" id="global-nav">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Left Side: Burger Menu & Nav Links */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => setIsMenuDrawerOpen(!isMenuDrawerOpen)}
              className="text-white hover:text-zinc-300 cursor-pointer flex items-center gap-2"
              title="Otwórz menu nawigacji"
            >
              <Menu size={18} />
            </button>
            
            <nav className="hidden md:flex items-center gap-5 text-xs font-medium uppercase tracking-wider text-zinc-400 font-sans">
              <div 
                className="relative group py-2"
                onMouseEnter={() => setIsCategoriesDropdownOpen(true)}
                onMouseLeave={() => setIsCategoriesDropdownOpen(false)}
              >
                <button
                  onClick={() => {
                    setShopView('category');
                    setSelectedCategory(null);
                    setSelectedProduct(null);
                    setIsCategoriesDropdownOpen(false);
                  }}
                  className="hover:text-white cursor-pointer transition-colors flex items-center gap-1.5 uppercase font-sans text-xs tracking-wider"
                >
                  <Grid size={13} className="text-zinc-400 group-hover:text-white transition-colors" />
                  Kategorie
                  <ChevronDown size={12} className="text-zinc-500 group-hover:text-white transition-transform duration-200 group-hover:rotate-180" />
                </button>

                <AnimatePresence>
                  {isCategoriesDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 mt-1 w-64 bg-zinc-950/98 border border-zinc-900 shadow-2xl backdrop-blur-md p-3 space-y-1 z-50 text-left normal-case tracking-normal font-mono"
                    >
                      <div className="text-[10px] font-mono uppercase text-zinc-500 px-2 py-1.5 border-b border-zinc-900 mb-1.5 flex items-center gap-1.5">
                        <Grid size={10} />
                        Kolekcje
                      </div>

                      <button
                        onClick={() => {
                          setShopView('category');
                          setSelectedCategory(null);
                          setSelectedProduct(null);
                          setIsCategoriesDropdownOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-2 text-xs font-mono flex items-center justify-between cursor-pointer transition-all hover:bg-zinc-900/60 hover:text-white ${
                          !selectedCategory ? 'text-white font-bold bg-zinc-900/40 border-l-2 border-white' : 'text-zinc-400 border-l-2 border-transparent'
                        }`}
                      >
                        <span>Pokaż wszystkie</span>
                        {!selectedCategory && <Check size={11} />}
                      </button>

                      {allCategories.map(cat => {
                        const cleanName = cat.name.trim();
                        const isSelected = selectedCategory === cleanName;
                        return (
                          <button
                            key={cat.id}
                            onClick={() => {
                              setShopView('category');
                              setSelectedCategory(cleanName);
                              setSelectedProduct(null);
                              setIsCategoriesDropdownOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-2 text-xs font-mono flex items-center justify-between cursor-pointer transition-all hover:bg-zinc-900/60 hover:text-white ${
                              isSelected ? 'text-white font-bold bg-zinc-900/40 border-l-2 border-white' : 'text-zinc-400 border-l-2 border-transparent'
                            }`}
                          >
                            <span>{cleanName}</span>
                            {isSelected && <Check size={11} />}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button
                onClick={() => {
                  setShopView('category');
                  setSelectedCategory('Elektronika');
                  setSelectedProduct(null);
                }}
                className="hover:text-white cursor-pointer transition-colors"
              >
                Nowości
              </button>
              <button
                onClick={() => {
                  setShopView('category');
                  setSelectedCategory('Artykuły spożywcze');
                  setSelectedProduct(null);
                }}
                className="hover:text-white cursor-pointer transition-colors"
              >
                Wyprzedaż
              </button>
              <span className="text-zinc-600 cursor-default select-none">|</span>
              <span className="text-zinc-500 cursor-default select-none">O nas</span>
              <span className="text-zinc-500 cursor-default select-none">Kontakt</span>
            </nav>
          </div>

          {/* Center Side: Logo */}
          <div
            onClick={() => {
              setShopView('home');
              setSelectedProduct(null);
              setSelectedCategory(null);
            }}
            className="flex flex-col items-center cursor-pointer select-none text-center"
          >
            <h1 className="text-xl font-black uppercase tracking-[0.25em] font-sans text-white leading-none">
              APEX
            </h1>
            <p className="text-[9px] text-zinc-400 tracking-[0.3em] font-medium mt-1 uppercase">
              Premium Store
            </p>
          </div>

          {/* Right Side: Search, Account & Cart */}
          <div className="flex items-center gap-4">
            
            {/* Search toggler/indicator */}
            <button
              onClick={() => {
                setShopView('category');
                setSelectedProduct(null);
              }}
              className="text-zinc-400 hover:text-white cursor-pointer transition-colors"
              title="Szukaj"
            >
              <Search size={18} />
            </button>
            
            {/* Account authentication profile links */}
            <div className="hidden sm:flex items-center gap-2 border-r border-zinc-800 pr-4 mr-2">
              {isLoggedIn ? (
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="text-zinc-400 max-w-[120px] truncate">
                    Witaj, <strong className="text-white">{customerEmail.split('@')[0]}</strong>
                  </span>
                  <button
                    onClick={() => {
                      setIsLoggedIn(false);
                      setCustomerEmail('');
                      localStorage.removeItem('wms_customer_email');
                      setFirstName('');
                      setLastName('');
                      setStreetAddress('');
                      setPostalCode('');
                      setCity('');
                      setPhone('');
                      setShopView('home');
                    }}
                    className="text-[10px] text-zinc-500 hover:text-white uppercase tracking-wider font-bold transition-colors cursor-pointer"
                  >
                    Wyloguj
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-xs font-mono">
                  <button
                    onClick={() => setShopView('login')}
                    className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Zaloguj się
                  </button>
                  <span className="text-zinc-700">/</span>
                  <button
                    onClick={() => setShopView('register')}
                    className="text-white hover:text-zinc-300 font-bold transition-colors cursor-pointer"
                  >
                    Utwórz konto
                  </button>
                </div>
              )}
            </div>

            {/* Cart Icon with red badge */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-1 text-zinc-400 hover:text-white cursor-pointer transition-colors"
              id="btn-cart-nav"
              title="Koszyk"
            >
              <ShoppingBag size={18} />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-650 text-[8px] font-bold text-white ring-2 ring-zinc-950">
                  {cart.reduce((a, b) => a + b.quantity, 0)}
                </span>
              )}
            </button>

            {/* Settings Option */}
            <div className="relative">
              <button
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className="text-zinc-400 hover:text-white cursor-pointer transition-colors p-1 flex items-center justify-center"
                title="Ustawienia integracji WMS"
              >
                <Settings size={18} className={isSettingsOpen ? 'rotate-45 transition-transform duration-300 text-white' : 'transition-transform duration-300'} />
              </button>

              <AnimatePresence>
                {isSettingsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-72 bg-zinc-950/98 border border-zinc-900 shadow-2xl p-4 space-y-4 z-50 text-left normal-case tracking-normal font-mono rounded-xl"
                  >
                    <div className="text-[10px] font-mono uppercase text-zinc-500 border-b border-zinc-900 pb-2 flex items-center justify-between">
                      <span>Panel Ustawień</span>
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" title="Synchronizacja aktywna" />
                    </div>

                    {/* View Mode toggle */}
                    <div className="space-y-1.5">
                      <span className="text-[9px] text-zinc-500 uppercase">Tryb aplikacji</span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            setViewMode('sandbox');
                            setIsSettingsOpen(false);
                          }}
                          className={`px-2 py-1.5 text-[10px] text-center border font-bold cursor-pointer transition-all ${
                            viewMode === 'sandbox'
                              ? 'bg-white text-black border-white'
                              : 'bg-transparent text-zinc-400 border-zinc-800 hover:border-zinc-700'
                          }`}
                        >
                          SKLEP
                        </button>
                        <button
                          onClick={() => {
                            setViewMode('blueprint');
                            setIsSettingsOpen(false);
                          }}
                          className={`px-2 py-1.5 text-[10px] text-center border font-bold cursor-pointer transition-all ${
                            viewMode === 'blueprint'
                              ? 'bg-white text-black border-white'
                              : 'bg-transparent text-zinc-400 border-zinc-800 hover:border-zinc-700'
                          }`}
                        >
                          BLUEPRINT
                        </button>
                      </div>
                    </div>

                    {/* API and Integration Status */}
                    <div className="space-y-1.5 text-[10px] text-zinc-400">
                      <div className="flex justify-between border-b border-zinc-900/60 pb-1">
                        <span className="text-zinc-500">Baza danych:</span>
                        <span className="text-white">WMS (LocalStorage)</span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-900/60 pb-1">
                        <span className="text-zinc-500">API Endpoint:</span>
                        <span className="text-white">localhost:3001</span>
                      </div>
                      <div className="flex justify-between pb-1">
                        <span className="text-zinc-500">Produkty:</span>
                        <span className="text-white">{wmsProducts.length} SKU</span>
                      </div>
                    </div>

                    {/* Reset button */}
                    <button
                      onClick={() => {
                        if (confirm('Czy na pewno chcesz zresetować koszyk i pamięć sesji sklepu?')) {
                          setCart([]);
                          localStorage.removeItem('wms_customer_email');
                          setIsLoggedIn(false);
                          setCustomerEmail('');
                          setIsSettingsOpen(false);
                          window.location.reload();
                        }
                      }}
                      className="w-full bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-900/60 text-[10px] py-1.5 font-bold transition-colors cursor-pointer text-center"
                    >
                      RESETUJ SESJĘ I KOSZYK
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
          </div>

        </div>
      </header>

      {/* Primary Container Viewports */}
      <main className="flex-grow max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col">
        <AnimatePresence mode="wait">
          
          {/* ==================================================== */}
          {/* VIEW MODE A: ARCHITECTURAL TECHNICAL BLUEPRINT      *️/
          {/* ==================================================== */}
          {viewMode === 'blueprint' && (
            <motion.div
              key="blueprint-mode"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              {/* Left specifications list menu drawer */}
              <div className="lg:col-span-3 space-y-4">
                <div className="bg-zinc-950 border border-zinc-900 p-4 sticky top-24">
                  <h3 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-3 font-bold flex items-center gap-1.5">
                    <BookOpen size={12} /> Blueprint Chapters
                  </h3>
                  
                  <nav className="space-y-1">
                    {ARCHITECTURE_SECTIONS.map((sec) => (
                      <button
                        key={sec.id}
                        onClick={() => setActiveSpecSection(sec.id)}
                        className={`w-full text-left px-3 py-2 text-xs font-mono tracking-wide transition-all border-l-2 flex justify-between items-center cursor-pointer ${
                          activeSpecSection === sec.id
                            ? 'bg-zinc-900 text-white font-bold border-white'
                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30 border-transparent'
                        }`}
                      >
                        <span className="truncate">{sec.title.replace(/^\d+\.\s*/, '')}</span>
                        <ChevronRight size={10} className="text-zinc-650" />
                      </button>
                    ))}
                    <button
                      onClick={() => setActiveSpecSection('ascii_wireframes')}
                      className={`w-full text-left px-3 py-2 text-xs font-mono tracking-wide transition-all border-l-2 flex justify-between items-center cursor-pointer ${
                        activeSpecSection === 'ascii_wireframes'
                          ? 'bg-zinc-900 text-white font-bold border-white'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30 border-transparent'
                      }`}
                    >
                      <span className="truncate">16. ASCII WIREFRAMES</span>
                      <ChevronRight size={10} className="text-zinc-650" />
                    </button>
                  </nav>
                  
                  {/* Quick stats panel */}
                  <div className="mt-6 pt-4 border-t border-zinc-900 space-y-2">
                    <div className="text-[10px] uppercase font-mono text-zinc-500">Integration Metrics</div>
                    <div className="bg-black/40 p-2.5 space-y-1.5 border border-zinc-900">
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-zinc-500">WMS Sync Latency</span>
                        <span className="text-emerald-400">&lt; 40ms</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-zinc-500">DCP Connection</span>
                        <span className="text-emerald-400">REST API Ready</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-zinc-500">Security Rule TLS</span>
                        <span className="text-white">HMAC SHA-256</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right content view area */}
              <div className="lg:col-span-9 space-y-6">
                
                {/* Visual Palette Sandbox Design System Swatches (Triggers only on Section 3 select) */}
                {activeSpecSection === 'section_3' && (
                  <div className="bg-zinc-950 border border-zinc-900 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-mono text-zinc-300 font-bold uppercase tracking-widest flex items-center gap-1.5">
                        <Sparkles size={12} className="text-zinc-400" /> Interactive Design Swatch Board
                      </h4>
                      <span className="text-[10px] font-mono text-zinc-500">Contrast WCAG 2.1 AA Compliant</span>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
                      <div className="bg-black border border-zinc-800 p-2 text-center">
                        <div className="h-10 bg-black border border-zinc-800 w-full mb-1" />
                        <div className="text-[10px] font-mono font-bold text-white">Primary</div>
                        <div className="text-[9px] font-mono text-zinc-500">#000000</div>
                      </div>
                      <div className="bg-zinc-950 border border-zinc-800 p-2 text-center">
                        <div className="h-10 bg-zinc-900 w-full mb-1" />
                        <div className="text-[10px] font-mono font-bold text-white">Secondary</div>
                        <div className="text-[9px] font-mono text-zinc-500">#09090C</div>
                      </div>
                      <div className="bg-zinc-950 border border-zinc-800 p-2 text-center">
                        <div className="h-10 bg-white w-full mb-1" />
                        <div className="text-[10px] font-mono font-bold text-white">Contrast Text</div>
                        <div className="text-[9px] font-mono text-zinc-500">#FAFAFA</div>
                      </div>
                      <div className="bg-zinc-950 border border-zinc-800 p-2 text-center">
                        <div className="h-10 bg-emerald-500 w-full mb-1" />
                        <div className="text-[10px] font-mono font-bold text-white">WMS Success</div>
                        <div className="text-[9px] font-mono text-zinc-500">#10B981</div>
                      </div>
                      <div className="bg-zinc-950 border border-zinc-800 p-2 text-center">
                        <div className="h-10 bg-amber-500 w-full mb-1" />
                        <div className="text-[10px] font-mono font-bold text-zinc-100">Warning</div>
                        <div className="text-[9px] font-mono text-zinc-500">#F59E0B</div>
                      </div>
                      <div className="bg-zinc-950 border border-zinc-800 p-2 text-center">
                        <div className="h-10 bg-red-600 w-full mb-1" />
                        <div className="text-[10px] font-mono font-bold text-white">Destructive</div>
                        <div className="text-[9px] font-mono text-zinc-500">#EF4444</div>
                      </div>
                      <div className="bg-zinc-950 border border-zinc-800 p-2 text-center">
                        <div className="h-10 bg-zinc-800 w-full mb-1" />
                        <div className="text-[10px] font-mono font-bold text-white">Borders Limit</div>
                        <div className="text-[9px] font-mono text-zinc-500 font-medium">#27272A</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-renderer for ASCII wireframes navigation */}
                {activeSpecSection === 'ascii_wireframes' ? (
                  <div className="bg-zinc-950 border border-zinc-900 p-6 space-y-6">
                    <div>
                      <h2 className="text-base font-semibold font-display tracking-tight text-white uppercase">
                        Chapter 16: Interactive ASCII Wireframe Blueprints
                      </h2>
                      <p className="text-xs text-zinc-500 mt-1">
                        Select any storefront view mockup to render its structural layout block scheme:
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {WIREFRAMES_ASCII.map((w) => (
                        <button
                          key={w.id}
                          onClick={() => setActiveWireframe(w.id)}
                          className={`px-3 py-1.5 text-xs font-mono border transition-all cursor-pointer ${
                            activeWireframe === w.id
                              ? 'bg-zinc-100 text-black border-white font-bold'
                              : 'bg-zinc-905 border-zinc-800 text-zinc-400 hover:text-white'
                          }`}
                        >
                          {w.title.replace(' WIREFRAME (ASCII)', '')}
                        </button>
                      ))}
                    </div>

                    <div className="bg-black border border-zinc-850 p-4 overflow-x-auto relative">
                      <div className="absolute top-2.5 right-3 text-[9px] font-mono text-zinc-600 uppercase tracking-widest">
                        Terminal Screen
                      </div>
                      <pre className="text-xs text-zinc-300 font-mono leading-relaxed whitespace-pre font-medium p-2.5">
                        {WIREFRAMES_ASCII.find((w) => w.id === activeWireframe)?.layout}
                      </pre>
                    </div>
                  </div>
                ) : (
                  /* Standard architectural specs text block */
                  <div className="bg-zinc-950 border border-zinc-900 p-6 space-y-6">
                    {(() => {
                      const activeSec = ARCHITECTURE_SECTIONS.find((sec) => sec.id === activeSpecSection);
                      if (!activeSec) return null;
                      return (
                        <div className="prose prose-invert max-w-none space-y-4">
                          <h2 className="text-lg font-semibold font-display text-white border-b border-zinc-900 pb-3">
                            {activeSec.title}
                          </h2>
                          <div className="text-zinc-300 text-xs leading-relaxed font-mono whitespace-pre-wrap">
                            {activeSec.content}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ==================================================== */}
          {/* VIEW MODE B: INTERACTIVE SHOPIFY-STYLE STORE SANDBOX */}
          {/* ==================================================== */}
          {viewMode === 'sandbox' && (
            <motion.div
              key="sandbox-mode"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full space-y-6"
            >
              {shopView === 'home' && !selectedProduct ? (
                /* FULL WIDTH HOME PAGE VIEW */
                <motion.div
                  key="home-screen"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-8"
                >
                  {/* Premium Hero Spotlight */}
                  <div className="relative bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden min-h-[380px] grid grid-cols-1 md:grid-cols-12 items-center">
                    {/* Left Column: Image on wrist */}
                    <div className="md:col-span-6 h-full min-h-[300px] md:min-h-[380px] relative">
                      <img
                        src={TEMPLATE_PRODUCTS[0].image}
                        alt={TEMPLATE_PRODUCTS[0].name}
                        className="absolute inset-0 w-full h-full object-cover filter brightness-[0.7] contrast-[1.1]"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-zinc-950/80 md:to-zinc-950" />
                    </div>

                    {/* Right Column: Text and CTA buttons */}
                    <div className="md:col-span-6 p-8 md:p-12 space-y-6 bg-zinc-950">
                      <span className="inline-block px-3 py-1 text-[10px] font-mono tracking-widest bg-zinc-900 text-zinc-350 rounded-full font-bold">
                        BEST SELLER
                      </span>
                      
                      <h2 className="text-3xl md:text-4xl font-extrabold text-white leading-tight font-sans tracking-tight">
                        {TEMPLATE_PRODUCTS[0].name}
                      </h2>
                      
                      <p className="text-sm text-zinc-400 font-sans leading-relaxed">
                        {TEMPLATE_PRODUCTS[0].description}
                      </p>

                      <div className="pt-2 flex flex-wrap gap-3">
                        <button
                          id="btn-hero-add"
                          onClick={() => handleAddToCart(TEMPLATE_PRODUCTS[0])}
                          className="bg-white text-black hover:bg-zinc-200 px-6 py-3 text-xs font-sans font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer rounded-none"
                        >
                          DODAJ DO KOSZYKA
                        </button>
                        <button
                          onClick={() => handleSelectProduct(TEMPLATE_PRODUCTS[0])}
                          className="bg-transparent hover:bg-zinc-900/60 text-white border border-zinc-750 px-6 py-3 text-xs font-sans font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer rounded-none"
                        >
                          SZCZEGÓŁY
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Featured Categories list section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-900">
                      <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-350">
                        Polecane kategorie
                      </h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {allCategories.slice(0, 3).map((cat) => (
                        <CategoryCard
                          key={cat.id}
                          category={cat}
                          onSelect={handleCategorySelect}
                          isSelected={selectedCategory === cat.name}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Bento Grid layout of Logistics features */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-zinc-950 border border-zinc-900 p-5 space-y-2 rounded-xl">
                      <div className="text-xs font-mono font-bold text-zinc-350 uppercase tracking-wider flex items-center gap-1.5">
                        <Truck size={14} className="text-zinc-400" /> Wysyłka w 24h
                      </div>
                      <p className="text-[11px] text-zinc-500 font-mono leading-relaxed">
                        Błyskawiczne nadanie zamówienia. Wszystkie paczki przygotowujemy i wysyłamy w ciągu doby.
                      </p>
                    </div>
                    
                    <div className="bg-zinc-950 border border-zinc-900 p-5 space-y-2 rounded-xl">
                      <div className="text-xs font-mono font-bold text-zinc-350 uppercase tracking-wider flex items-center gap-1.5">
                        <SlidersHorizontal size={14} className="text-zinc-400" /> Synchronizacja zapasów
                      </div>
                      <p className="text-[11px] text-zinc-500 font-mono leading-relaxed">
                        Gwarancja stanów magazynowych. Oferujemy wyłącznie te produkty, które fizycznie znajdują się w naszym magazynie.
                      </p>
                    </div>

                    <div className="bg-zinc-950 border border-zinc-900 p-5 space-y-2 rounded-xl">
                      <div className="text-xs font-mono font-bold text-zinc-350 uppercase tracking-wider flex items-center gap-1.5">
                        <ClipboardCheck size={14} className="text-zinc-400" /> Wygodne zwroty (RMA)
                      </div>
                      <p className="text-[11px] text-zinc-500 font-mono leading-relaxed">
                        Zgłoś zwrot bezpośrednio z panelu klienta w kilka sekund bez konieczności dzwonienia.
                      </p>
                    </div>
                  </div>

                  {/* Best Seller Showcase list */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-900">
                      <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-350">
                        Najczęściej kupowane
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      {TEMPLATE_PRODUCTS.slice(0, 4).map((prod) => (
                        <ProductCard
                          key={prod.id}
                          product={prod}
                          onAddToCart={handleAddToCart}
                          onViewDetails={handleSelectProduct}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : shopView === 'category' && !selectedProduct ? (
                /* FULL WIDTH CATEGORY VIEW */
                <motion.div
                  key="category-screen-full"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6 w-full animate-fadeIn"
                >
                  {/* Breadcrumb line & category header */}
                  <div className="text-xs font-mono text-zinc-500">
                    Strona główna / Produkty {selectedCategory ? `/ ${selectedCategory}` : '/ Wszystkie'}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                    {/* Sidebar Filters */}
                    <div className="md:col-span-3 space-y-6 bg-zinc-950/60 border border-zinc-900/80 p-5 rounded-2xl">
                      <div className="flex justify-between items-center pb-2.5 border-b border-zinc-900">
                        <span className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-350">
                          Filtry
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                          className="text-zinc-500 hover:text-white transition-colors cursor-pointer text-[10px] font-bold"
                        >
                          {isFiltersExpanded ? '▲' : '▼'}
                        </button>
                      </div>

                      {isFiltersExpanded && (
                        <div className="space-y-6 animate-fadeIn">
                          {/* Availability checkbox */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs font-mono text-zinc-350 select-none py-1">
                              <span>Tylko dostępne</span>
                              <button
                                type="button"
                                onClick={() => setFilterInStockOnly(!filterInStockOnly)}
                                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-zinc-800 transition-colors duration-200 ease-in-out focus:outline-none ${
                                  filterInStockOnly ? 'bg-white' : 'bg-black'
                                }`}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-3.8 w-3.8 transform rounded-full shadow-lg transition duration-200 ease-in-out ${
                                    filterInStockOnly ? 'translate-x-4.2 bg-black' : 'translate-x-0.2 bg-white'
                                  }`}
                                />
                              </button>
                            </div>
                          </div>

                          {/* Price range filter */}
                          <div className="pt-4 border-t border-zinc-900 space-y-2.5">
                            <div className="flex justify-between text-[10px] font-mono uppercase text-zinc-500">
                              <span>Cena maksymalna</span>
                              <span className="text-white font-bold">{priceRange} EUR</span>
                            </div>
                            <input
                              type="range"
                              min="100"
                              max="1300"
                              step="50"
                              value={priceRange}
                              onChange={(e) => setPriceRange(parseInt(e.target.value))}
                              className="w-full accent-white bg-zinc-900 cursor-pointer h-1 rounded-lg appearance-none"
                            />
                          </div>

                          {/* Sort Selector */}
                          <div className="pt-4 border-t border-zinc-900 space-y-2">
                            <span className="text-[10px] font-mono uppercase text-zinc-500 block">Sortowanie</span>
                            <select
                              value={sortBy}
                              onChange={(e) => setSortBy(e.target.value as any)}
                              className="w-full bg-black border border-zinc-900 text-xs text-white font-mono rounded-lg py-2 px-2.5 focus:outline-none focus:border-zinc-700"
                            >
                              <option value="default">Domyślnie</option>
                              <option value="low-high">Cena: od najniższej</option>
                              <option value="high-low">Cena: od najwyższej</option>
                            </select>
                          </div>

                          {/* Category Filter list */}
                          <div className="pt-4 border-t border-zinc-900 space-y-2">
                            <span className="text-[10px] font-mono uppercase text-zinc-500 block mb-1">Kategoria</span>
                            <div className="space-y-1">
                              <button
                                type="button"
                                onClick={() => handleCategorySelect(null)}
                                className={`w-full text-left px-2.5 py-1.5 text-xs font-mono flex items-center justify-between cursor-pointer rounded-lg transition-colors ${
                                  !selectedCategory
                                    ? 'text-white font-bold bg-zinc-900/60 border-l-2 border-white pl-2'
                                    : 'text-zinc-400 hover:text-zinc-200 border-l-2 border-transparent'
                                }`}
                              >
                                <span>Pokaż wszystkie</span>
                                {!selectedCategory && <Check size={11} />}
                              </button>
                              {allCategories.map((cat) => {
                                const cleanName = cat.name.trim();
                                const isSelected = selectedCategory === cleanName;
                                return (
                                  <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => handleCategorySelect(cleanName)}
                                    className={`w-full text-left px-2.5 py-1.5 text-xs font-mono flex items-center justify-between cursor-pointer rounded-lg transition-colors ${
                                      isSelected
                                        ? 'text-white font-bold bg-zinc-900/60 border-l-2 border-white pl-2'
                                        : 'text-zinc-400 hover:text-zinc-200 border-l-2 border-transparent'
                                    }`}
                                  >
                                    <span>{cleanName}</span>
                                    {isSelected && <Check size={11} />}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Product Grid Area */}
                    <div className="md:col-span-9 space-y-4">
                      {/* Product display header */}
                      <div className="flex items-center justify-between text-xs font-mono text-zinc-400 pb-2 border-b border-zinc-900/60">
                        <div>Wyświetlanie {filteredSandboxProducts.length} produktów</div>
                        
                        {/* Grid/List toggles */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setIsGridView(true)}
                            className={`p-1.5 border transition cursor-pointer ${
                              isGridView ? 'bg-zinc-900 border-zinc-700 text-white' : 'border-transparent text-zinc-500 hover:text-white'
                            }`}
                          >
                            <Grid size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsGridView(false)}
                            className={`p-1.5 border transition cursor-pointer ${
                              !isGridView ? 'bg-zinc-900 border-zinc-700 text-white' : 'border-transparent text-zinc-500 hover:text-white'
                            }`}
                          >
                            <List size={13} />
                          </button>
                        </div>
                      </div>

                      {filteredSandboxProducts.length === 0 ? (
                        <div className="border border-zinc-900 py-16 text-center space-y-2 bg-zinc-950/40 rounded-2xl">
                          <SlidersHorizontal size={24} className="text-zinc-700 mx-auto" />
                          <p className="text-sm font-medium text-zinc-400">Brak produktów pasujących do wybranych filtrów.</p>
                          <button
                            type="button"
                            onClick={() => { setFilterInStockOnly(false); setPriceRange(1300); setSelectedCategory(null); }}
                            className="text-xs text-zinc-300 underline font-mono hover:text-white cursor-pointer"
                          >
                            Wyczyść wszystkie filtry
                          </button>
                        </div>
                      ) : isGridView ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
                          {filteredSandboxProducts.map((p) => (
                            <ProductCard
                              key={p.id}
                              product={p}
                              onAddToCart={handleAddToCart}
                              onViewDetails={handleSelectProduct}
                            />
                          ))}
                        </div>
                      ) : (
                        /* LIST VIEW LAYOUT */
                        <div className="space-y-3">
                          {filteredSandboxProducts.map((p) => (
                            <div
                              key={p.id}
                              className="bg-zinc-900/20 border border-zinc-900 p-4 rounded-xl flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
                            >
                              <div className="flex gap-4 items-center">
                                <img src={p.image} alt={p.name} className="h-16 w-16 object-cover bg-zinc-950 rounded-lg" referrerPolicy="no-referrer" />
                                <div>
                                  <div className="text-[10px] font-mono text-zinc-500 uppercase">{p.category}</div>
                                  <h4 className="text-sm font-semibold text-white mb-0.5">{p.name}</h4>
                                  <p className="text-[11px] font-mono text-zinc-400">SKU: {p.sku}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-6 self-stretch sm:self-auto justify-between border-t border-zinc-900 sm:border-t-0 pt-3 sm:pt-0">
                                <div className="text-right">
                                  <div className="text-[9px] font-mono text-zinc-500">Cena</div>
                                  <div className="text-xs font-bold font-mono text-white">{p.price}</div>
                                </div>
                                <button
                                  id={`btn-list-add-${p.id}`}
                                  type="button"
                                  onClick={() => handleAddToCart(p)}
                                  className="bg-white text-black hover:bg-zinc-200 px-4 py-2 text-xs font-mono font-bold cursor-pointer transition-colors rounded-lg"
                                >
                                  Dodaj +
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ) : (
                /* GRID LAYOUT WITH SIDEBAR FOR ALL OTHER PAGES */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Category selector & state navigation sidebar */}
                  <div className="lg:col-span-3 space-y-4">
                    
                    {/* Local Navigation menu for the shop views */}
                    <div className="bg-zinc-950 border border-zinc-900 p-4 space-y-3">
                      <h3 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">
                        Nawigacja
                      </h3>
                  <div className="space-y-1">
                    <button
                      onClick={() => { setShopView('home'); setSelectedProduct(null); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-mono transition-colors cursor-pointer ${
                        shopView === 'home' && !selectedProduct
                          ? 'bg-zinc-900 text-white font-bold'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-900/30'
                      }`}
                    >
                      <Layout size={13} />
                      Strona główna
                    </button>
                    

                    <button
                      onClick={() => { setShopView('checkout'); setSelectedProduct(null); }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs font-mono transition-colors cursor-pointer ${
                        shopView === 'checkout'
                          ? 'bg-zinc-900 text-white font-bold'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-900/30'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <CreditCard size={13} /> Bezpieczna kasa
                      </span>
                      {cart.length > 0 && (
                        <span className="text-[9px] bg-emerald-950 border border-emerald-900 text-emerald-400 px-1 rounded-none font-bold">
                          {cart.reduce((a, b) => a + b.quantity, 0)} szt.
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        if (isLoggedIn) {
                          setShopView('account');
                        } else {
                          setShopView('login');
                        }
                        setSelectedProduct(null);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-mono transition-colors cursor-pointer ${
                        shopView === 'account'
                          ? 'bg-zinc-900 text-white font-bold'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-900/30'
                      }`}
                    >
                      <User size={13} />
                      Panel klienta / RMA
                    </button>
                  </div>
                </div>
              </div>

              {/* Main Catalog or Details View Center Screen */}
              <div className="lg:col-span-9 space-y-6">
                
                {/* Live Autocomplete Search Bar */}
                <div className="flex flex-col sm:flex-row items-center gap-4 justify-between bg-zinc-950 border border-zinc-900 p-4">
                  <SearchBar products={TEMPLATE_PRODUCTS} onSelectProduct={handleSelectProduct} />
                  
                  <div className="flex gap-2 items-center flex-shrink-0">
                    <button
                      onClick={() => setIsCartOpen(true)}
                      className="bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-mono px-4 py-2.5 flex items-center gap-2 border border-zinc-850 cursor-pointer"
                    >
                      <ShoppingBag size={14} />
                      Koszyk ({cart.reduce((a, b) => a + b.quantity, 0)})
                    </button>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  
                  {/* Dynamic Product Details View */}
                  {selectedProduct ? (
                    <motion.div
                      key="selected-product-screen"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="bg-zinc-950 border border-zinc-900 p-6 space-y-8"
                    >
                      {/* Back button */}
                      <button
                        onClick={() => setSelectedProduct(null)}
                        className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1.5 cursor-pointer"
                      >
                        ← Powrót do listy
                      </button>

                      {/* Product layout: Gallery left, Options right */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <ProductGallery primaryImage={selectedProduct.image} name={selectedProduct.name} />
                        </div>
                        
                        <div className="space-y-6">
                          {/* Category Tag & SKU */}
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="text-zinc-500 uppercase tracking-widest">{selectedProduct.category}</span>
                            <span className="text-zinc-400">{selectedProduct.sku}</span>
                          </div>

                          {/* Dynamic Name */}
                          <h2 className="text-xl font-bold font-display text-white">
                            {selectedProduct.name}
                          </h2>

                          {/* Active rating reviews */}
                          <div className="flex items-center gap-2 text-xs">
                            <div className="flex text-zinc-300">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} size={13} fill="currentColor" className="text-zinc-200" />
                              ))}
                            </div>
                            <span className="text-zinc-500 font-mono">
                              {selectedProduct.rating}
                            </span>
                          </div>

                          <div className="border-t border-b border-zinc-900 py-4 flex items-center justify-between">
                            <div>
                              <div className="text-[10px] font-mono text-zinc-500 uppercase">Cena detaliczna brutto</div>
                              <div className="text-lg font-bold font-mono text-white mt-0.5">
                                {selectedProduct.price}
                              </div>
                            </div>

                            {isProductOutOfStock(selectedProduct) ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono uppercase bg-red-950/25 text-red-400 border border-red-900/30 rounded-none shadow-sm h-7 select-none">
                                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                                Brak na stanie
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono uppercase bg-zinc-900 text-zinc-300 border border-zinc-800 rounded-none shadow-sm h-7">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                {selectedProduct.stock}
                              </span>
                            )}
                          </div>

                          <SameDayCountdown />

                          {/* Configuration selectors */}
                          <div className="space-y-4">
                            {/* Color Selector */}
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                                Kolor wariantu: {selectedColor}
                              </label>
                              <div className="flex gap-2">
                                {['Srebrny', 'Gwiezdna szarość', 'Szampański'].map((c) => (
                                  <button
                                    key={c}
                                    onClick={() => setSelectedColor(c)}
                                    className={`px-3 py-1.5 text-xs font-mono border transition-all cursor-pointer ${
                                      selectedColor === c
                                        ? 'bg-white text-black border-white font-bold'
                                        : 'bg-black border-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-800'
                                    }`}
                                  >
                                    {c}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Size selector */}
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                                Wymiary / Rozmiar: {selectedSize}
                              </label>
                              <div className="flex gap-2">
                                {['38mm', '42mm', 'ErgoX', 'Duży rozmiar'].map((sz) => (
                                  <button
                                    key={sz}
                                    onClick={() => setSelectedSize(sz)}
                                    className={`px-3 py-1.5 text-xs font-mono border transition-all cursor-pointer ${
                                      selectedSize === sz
                                        ? 'bg-value bg-white text-black border-white font-bold'
                                        : 'bg-black border-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-800'
                                    }`}
                                  >
                                    {sz}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* CTA Trigger and immediate add or Back-in-stock Email notifier */}
                          {isProductOutOfStock(selectedProduct) ? (
                            (() => {
                              const productSubs = subscribedProducts[selectedProduct.id] || [];
                              const hasSubscribed = productSubs.length > 0;

                              return hasSubscribed ? (
                                <div className="w-full bg-zinc-900/60 border border-zinc-800 p-4 text-center space-y-2 select-none rounded-xl">
                                  <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mx-auto">
                                    <Check size={16} />
                                  </div>
                                  <p className="text-xs font-mono font-bold text-zinc-200">Zapisano powiadomienie!</p>
                                  <p className="text-[10px] text-zinc-500 leading-normal max-w-xs mx-auto">
                                    Wyślemy e-mail na adres <strong>{productSubs[productSubs.length - 1]}</strong> natychmiast, gdy produkt będzie dostępny.
                                  </p>
                                </div>
                              ) : (
                                <div className="w-full bg-zinc-950/80 border border-zinc-900 p-4 space-y-3 rounded-xl">
                                  <div className="flex items-center gap-2 text-zinc-400 select-none">
                                    <Mail size={14} className="text-indigo-400 animate-pulse" />
                                    <span className="text-[10px] font-mono uppercase tracking-wider font-bold">Chwilowy brak towaru</span>
                                  </div>
                                  <p className="text-[11px] text-zinc-500 leading-relaxed text-left select-none">
                                    Wpisz swój adres e-mail, aby automatycznie otrzymać powiadomienie, gdy ten produkt powróci do magazynu.
                                  </p>
                                  <div className="flex gap-2">
                                    <input
                                      type="email"
                                      placeholder="Twój adres e-mail..."
                                      value={backInStockEmail}
                                      onChange={(e) => setBackInStockEmail(e.target.value)}
                                      className="flex-1 bg-black border border-zinc-800 text-xs px-3 py-2 text-zinc-200 outline-none focus:border-zinc-700 font-sans"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleSubscribeStock(selectedProduct.id, backInStockEmail)}
                                      className="bg-white text-black hover:bg-zinc-200 px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer border-none"
                                    >
                                      Zapisz mnie
                                    </button>
                                  </div>
                                </div>
                              );
                            })()
                          ) : (
                            <button
                              id="btn-add-product-cta"
                              onClick={() => handleAddToCart(selectedProduct, selectedSize, selectedColor)}
                              className="w-full bg-white text-black hover:bg-zinc-200 py-3.5 text-xs font-mono font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <ShoppingBag size={14} /> Dodaj do koszyka
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Specifications Grid */}
                      <div className="pt-6 border-t border-zinc-900 space-y-4">
                        <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-widest font-bold">
                          Specyfikacja produktu
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {Object.entries(selectedProduct.specifications).map(([key, value]) => (
                            <div key={key} className="flex justify-between p-2.5 bg-zinc-900/10 border border-zinc-900 text-xs">
                              <span className="font-mono text-zinc-500 font-medium">{key}</span>
                              <span className="font-mono text-zinc-300 font-semibold">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Reviews module */}
                      <div className="pt-6 border-t border-zinc-900 space-y-4">
                        <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-widest font-bold">
                          Opinie klientów (Zweryfikowane transakcje)
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {TEMPLATE_REVIEWS.map((r) => (
                            <div key={r.id} className="bg-zinc-905 border border-zinc-900 p-4 space-y-2">
                              <div className="flex items-center justify-between text-xs font-mono">
                                <span className="text-zinc-300 font-bold">{r.author}</span>
                                <span className="text-zinc-600">{r.date}</span>
                              </div>
                              <div className="flex text-zinc-400">
                                {[...Array(r.rating)].map((_, i) => (
                                  <Star key={i} size={11} fill="currentColor" className="text-zinc-300" />
                                ))}
                              </div>
                              <p className="text-xs text-zinc-400 leading-normal font-mono">
                                {r.comment}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Up-sell Recommendations */}
                      <div className="pt-8 border-t border-zinc-900 space-y-4">
                        <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-widest font-bold">
                          Polecane produkty
                        </h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {TEMPLATE_PRODUCTS.filter(p => p.id !== selectedProduct.id).slice(0, 3).map(p => (
                            <div
                              key={p.id}
                              onClick={() => handleSelectProduct(p)}
                              className="bg-zinc-950 border border-zinc-900 p-3 flex gap-3 items-center cursor-pointer hover:border-zinc-700 transition"
                            >
                              <img src={p.image} alt={p.name} className="h-12 w-12 object-cover" referrerPolicy="no-referrer" />
                              <div className="min-w-0">
                                <h4 className="text-[11px] text-zinc-200 font-medium truncate">{p.name}</h4>
                                <p className="text-[10px] font-mono text-zinc-500 mt-0.5">{p.price}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ) : shopView === 'checkout' ? (
                    
                    /* CHECKOUT PAGE VIEW */
                    <motion.div
                      key="checkout-screen"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-6"
                    >
                      <div className="pb-3 border-b border-zinc-900 flex justify-between items-center">
                        <h2 className="text-base font-semibold font-display uppercase tracking-tight text-white">
                          🔒 Bezpieczna kasa jednostronicowa
                        </h2>
                        <span className="text-xs font-mono text-emerald-400">Standard TLS 1.3</span>
                      </div>

                      {orderComplete && submittedOrder ? (
                        /* SUCCESS ORDER STATE MODAL SCREEN */
                        <div className="bg-zinc-950 border border-emerald-900 p-6 space-y-6 text-center max-w-xl mx-auto">
                          <div className="h-12 w-12 bg-emerald-950 border border-emerald-500 rounded-full flex items-center justify-center text-emerald-400 mx-auto">
                            <Check size={24} />
                          </div>
                          
                          <div className="space-y-2">
                            <h3 className="text-lg font-bold font-display text-white">Dziękujemy! Twoje zamówienie zostało złożone</h3>
                            <p className="text-xs text-zinc-400 font-mono">
                              Numer zamówienia: <span className="text-white font-bold">{submittedOrder.order_id}</span>
                            </p>
                            
                            {submittedOrder.isPickup ? (
                              <div className="mt-4 p-5 bg-zinc-900/60 border border-zinc-800 text-left space-y-3 font-mono max-w-md mx-auto">
                                <div className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                                  <span>📍</span> ODBIÓR OSOBISTY W HUB-PL-01
                                </div>
                                <div className="p-3 bg-black border border-zinc-850 flex flex-col items-center justify-center space-y-1">
                                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest">KOD PIN ODBIORU</span>
                                  <span className="text-xl font-black text-emerald-400 tracking-wider font-mono">{submittedOrder.pickupCode}</span>
                                </div>
                                <div className="text-[10px] text-zinc-400 leading-relaxed">
                                  <p className="font-bold text-zinc-300">📍 Punkt odbioru:</p>
                                  <p>Magazyn Centralny HUB-PL-01 (ul. Logistyczna 12, Warszawa)</p>
                                  <p className="mt-1 font-bold text-zinc-300">⏰ Godziny pracy:</p>
                                  <p>Pon - Pt: 08:00 - 20:00, Sob: 09:00 - 15:00</p>
                                  <p className="mt-2 text-zinc-500 italic">Podaj powyższy kod PIN pracownikowi magazynu przy wydawaniu paczki.</p>
                                </div>
                              </div>
                            ) : (
                              <p className="text-[11px] text-zinc-500 leading-normal max-w-md mx-auto">
                                Twoje zamówienie zostało pomyślnie zarejestrowane w naszym systemie i przekazane do realizacji.
                              </p>
                            )}
                          </div>

                          <div className="flex gap-3 justify-center pt-3">
                            <button
                              onClick={() => { setOrderComplete(false); setShopView('home'); }}
                              className="bg-zinc-100 text-black hover:bg-zinc-300 font-mono text-xs px-5 py-2.5 font-bold uppercase tracking-wider cursor-pointer transition-colors"
                            >
                              Kontynuuj zakupy
                            </button>
                            <button
                              onClick={() => setShopView('account')}
                              className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-mono text-xs px-5 py-2.5 hover:text-white border border-zinc-800 cursor-pointer transition-colors"
                            >
                              Śledź w panelu
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* SECURE CHECKOUT FORM SHEET */
                        <form onSubmit={handleCheckoutSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                          <div className="lg:col-span-7 space-y-6">
                            
                            {/* Step A: Customer and billing email */}
                            <div className="bg-zinc-950 border border-zinc-905 p-5 space-y-4">
                              <div className="flex items-center gap-2 border-b border-zinc-900 pb-2">
                                <span className="h-5 w-5 bg-zinc-900 flex items-center justify-center text-[10px] font-mono text-white font-bold border border-zinc-800">1</span>
                                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200">Tożsamość klienta</h3>
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-mono uppercase text-zinc-400 block">Adres e-mail</label>
                                <input
                                  type="email"
                                  required
                                  value={customerEmail}
                                  onChange={(e) => setCustomerEmail(e.target.value)}
                                  className="w-full bg-black border border-zinc-805 text-xs text-white px-3 py-2.5 rounded-none focus:outline-none focus:border-zinc-500 font-mono"
                                />
                                <span className="text-[9px] text-zinc-500 font-mono block">Uzupełnione automatycznie na podstawie danych klienta.</span>
                              </div>
                            </div>

                            {/* Step B: Postal address parameters */}
                            <div className="bg-zinc-950 border border-zinc-905 p-5 space-y-4">
                              <div className="flex items-center gap-2 border-b border-zinc-900 pb-2">
                                <span className="h-5 w-5 bg-zinc-900 flex items-center justify-center text-[10px] font-mono text-white font-bold border border-zinc-800">2</span>
                                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200">Adres dostawy</h3>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-mono uppercase text-zinc-500">Imię</label>
                                  <input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full bg-black border border-zinc-850 text-xs text-white p-2 text-zinc-300 font-mono focus:outline-none focus:border-zinc-500" />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-mono uppercase text-zinc-500">Nazwisko</label>
                                  <input type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full bg-black border border-zinc-850 text-xs text-white p-2 text-zinc-300 font-mono focus:outline-none focus:border-zinc-500" />
                                </div>
                              </div>

                              {shippingMethod === 'pickup' ? (
                                <div className="p-4 border border-zinc-800 bg-zinc-900/40 space-y-2 text-left font-mono">
                                  <div className="flex items-center gap-2 text-zinc-200 text-xs font-bold">
                                    <span>📍</span> Punkt Odbioru: Magazyn Centralny HUB-PL-01
                                  </div>
                                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                                    Adres: ul. Logistyczna 12, 00-001 Warszawa<br />
                                    Godziny otwarcia: Pon - Pt: 08:00 - 20:00, Sob: 09:00 - 15:00<br />
                                    Czas przygotowania: zazwyczaj w 2 godziny.
                                  </p>
                                </div>
                              ) : (
                                <>
                                  <div className="space-y-1.5">
                                    <label className="text-[10px] font-mono uppercase text-zinc-500">Ulica i numer mieszkania</label>
                                    <input type="text" required value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} className="w-full bg-black border border-zinc-855 text-xs text-white p-2.5 text-zinc-300 font-mono focus:outline-none focus:border-zinc-500" />
                                  </div>

                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                      <label className="text-[10px] font-mono uppercase text-zinc-500">Kod pocztowy</label>
                                      <input type="text" required value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className="w-full bg-black border border-zinc-855 text-xs text-white p-2 text-zinc-300 font-mono focus:outline-none focus:border-zinc-500" />
                                    </div>
                                    <div className="space-y-1.5">
                                      <label className="text-[10px] font-mono uppercase text-zinc-500">Miasto</label>
                                      <input type="text" required value={city} onChange={(e) => setCity(e.target.value)} className="w-full bg-black border border-zinc-855 text-xs text-white p-2 text-zinc-300 font-mono focus:outline-none focus:border-zinc-500" />
                                    </div>
                                  </div>
                                </>
                              )}

                              <div className="space-y-1.5">
                                <label className="text-[10px] font-mono uppercase text-zinc-500">Telefon kontaktowy</label>
                                <input type="text" required value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-black border border-zinc-855 text-xs text-white p-2 text-zinc-300 font-mono focus:outline-none focus:border-zinc-500" />
                              </div>
                            </div>

                            {/* Step C: Shipping method courier logs */}
                            <div className="bg-zinc-950 border border-zinc-905 p-5 space-y-4">
                              <div className="flex items-center gap-2 border-b border-zinc-900 pb-2">
                                <span className="h-5 w-5 bg-zinc-900 flex items-center justify-center text-[10px] font-mono text-white font-bold border border-zinc-800">3</span>
                                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200">Logistyka i koszt transportu</h3>
                              </div>

                              <div className="space-y-2">
                                <label className="flex items-center justify-between p-3 border border-zinc-850 hover:border-zinc-700 bg-black/60 cursor-pointer text-xs font-mono select-none">
                                  <span className="flex items-center gap-2">
                                    <input
                                      type="radio"
                                      name="shipping"
                                      checked={shippingMethod === 'express'}
                                      onChange={() => setShippingMethod('express')}
                                      className="accent-white h-3.5 w-3.5"
                                    />
                                    <span>Przesyłka kurierska Express (Dostawa następnego dnia)</span>
                                  </span>
                                  <span className="text-emerald-400 font-bold">DARMOWA</span>
                                </label>

                                <label className="flex items-center justify-between p-3 border border-zinc-850 hover:border-zinc-700 bg-black/60 cursor-pointer text-xs font-mono select-none">
                                  <span className="flex items-center gap-2">
                                    <input
                                      type="radio"
                                      name="shipping"
                                      checked={shippingMethod === 'air'}
                                      onChange={() => setShippingMethod('air')}
                                      className="accent-white h-3.5 w-3.5"
                                    />
                                    <span>Priorytetowa przesyłka lotnicza</span>
                                  </span>
                                  <span className="text-zinc-300 font-bold">45.00 EUR</span>
                                </label>

                                <label className="flex items-center justify-between p-3 border border-zinc-850 hover:border-zinc-700 bg-black/60 cursor-pointer text-xs font-mono select-none">
                                  <span className="flex items-center gap-2">
                                    <input
                                      type="radio"
                                      name="shipping"
                                      checked={shippingMethod === 'pickup'}
                                      onChange={() => setShippingMethod('pickup')}
                                      className="accent-white h-3.5 w-3.5"
                                    />
                                    <span>Odbiór osobisty w Magazynie Centralnym HUB-PL-01</span>
                                  </span>
                                  <span className="text-emerald-400 font-bold">DARMOWY</span>
                                </label>
                              </div>
                            </div>

                            {/* Step C.5: Gift Wrapping Options */}
                            <div className="bg-zinc-950 border border-zinc-900 p-5 space-y-4">
                              <div className="flex items-center gap-2 border-b border-zinc-900 pb-2">
                                <span className="h-5 w-5 bg-zinc-900 flex items-center justify-center text-[10px] font-mono text-white font-bold border border-zinc-800">3.5</span>
                                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200">🎁 Opcje pakowania na prezent</h3>
                              </div>

                              <label className="flex items-start gap-2.5 p-3 border border-zinc-850 hover:border-zinc-700 bg-black/60 cursor-pointer text-xs font-mono select-none text-left">
                                <input
                                  type="checkbox"
                                  checked={giftWrapping}
                                  onChange={(e) => setGiftWrapping(e.target.checked)}
                                  className="accent-white h-4 w-4 mt-0.5"
                                />
                                <div className="space-y-0.5">
                                  <span className="font-bold text-zinc-200 block">Zapakuj zamówienie na prezent (+15.00 EUR)</span>
                                  <span className="text-[10px] text-zinc-500 block">Zamówienie owiniemy papierem ozdobnym i dołączymy odręczny bilecik z Twoją dedykacją.</span>
                                </div>
                              </label>

                              {giftWrapping && (
                                <div className="space-y-3.5 pt-2 animate-fadeIn">
                                  <div className="space-y-1.5 text-left">
                                    <label className="text-[9px] uppercase tracking-wider text-zinc-500 font-mono">Wybierz styl opakowania</label>
                                    <select
                                      value={giftStyle}
                                      onChange={(e) => setGiftStyle(e.target.value)}
                                      className="w-full bg-black border border-zinc-850 p-2.5 text-xs text-zinc-300 font-mono focus:outline-none focus:border-zinc-750"
                                    >
                                      <option value="Klasyczny czerwony z wstążką">Klasyczny czerwony z wstążką</option>
                                      <option value="Elegancki czarny ze złotem">Elegancki czarny ze złotem</option>
                                      <option value="Ekologiczny kraft ze sznurkiem">Ekologiczny kraft ze sznurkiem</option>
                                    </select>
                                  </div>

                                  <div className="space-y-1.5 text-left">
                                    <label className="text-[9px] uppercase tracking-wider text-zinc-500 font-mono">Treść dedykacji na bileciku (maks. 200 znaków)</label>
                                    <textarea
                                      value={giftMessage}
                                      onChange={(e) => setGiftMessage(e.target.value.slice(0, 200))}
                                      placeholder="Wpisz treść życzeń..."
                                      rows={3}
                                      className="w-full bg-black border border-zinc-850 p-2.5 text-xs text-zinc-300 font-mono focus:outline-none focus:border-zinc-750 placeholder-zinc-700"
                                    />
                                    <span className="text-[9px] text-zinc-500 block text-right">Pozostało: {200 - giftMessage.length} znaków</span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Step D: Mocked Payment and checkout dispatch */}
                            <div className="bg-zinc-950 border border-zinc-905 p-5 space-y-4">
                              <div className="flex items-center gap-2 border-b border-zinc-900 pb-2">
                                <span className="h-5 w-5 bg-zinc-900 flex items-center justify-center text-[10px] font-mono text-white font-bold border border-zinc-800">4</span>
                                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200">Bezpieczny kanał płatności</h3>
                              </div>
                              
                              <p className="text-[11px] text-zinc-400 font-mono leading-normal bg-zinc-900/40 p-2.5 border border-zinc-900">
                                Symulowana bramka płatności. Standardowe pola kart kredytowych są zintegrowane z naszym procesorem zamówień sandbox.
                              </p>

                              <div className="space-y-3 font-mono">
                                <div className="space-y-1">
                                  <label className="text-[9px] uppercase tracking-wider text-zinc-500">Numer karty (Karta testowa)</label>
                                  <input type="text" placeholder="xxxx xxxx xxxx 2411" disabled className="w-full bg-black border border-zinc-850 p-2.5 text-xs text-zinc-500 placeholder-zinc-700 cursor-not-allowed rounded-none" />
                                </div>
                              </div>

                              <button
                                type="submit"
                                disabled={cart.length === 0}
                                className="w-full bg-emerald-500 text-black hover:bg-emerald-400 py-3.5 text-xs font-mono font-bold uppercase tracking-widest text-center transition-colors shadow-lg disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
                              >
                                Kupuję i płacę 🚀
                              </button>
                            </div>

                          </div>

                          {/* Order summaries ledger */}
                          <div className="lg:col-span-5 space-y-4">
                            <div className="bg-zinc-950 border border-zinc-900 p-4 space-y-3">
                              <span className="text-[10px] font-mono uppercase text-zinc-500 block">Kod kuponu promocyjnego</span>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="Kupon (Spróbuj WMS10)"
                                  value={promoCode}
                                  onChange={(e) => setPromoCode(e.target.value)}
                                  className="bg-black border border-zinc-850 text-xs px-3 py-2 text-white w-full rounded-none font-mono focus:outline-none focus:border-zinc-500 uppercase"
                                />
                                <button
                                  type="button"
                                  onClick={handleApplyPromo}
                                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-4 py-2 font-mono text-xs cursor-pointer tracking-wider font-bold"
                                >
                                  Zastosuj
                                </button>
                              </div>
                              {appliedPromoPct > 0 && (
                                <p className="text-[10px] font-mono text-emerald-400">Kupon został pomyślnie dodany! Odliczono 10% rabatu.</p>
                              )}
                            </div>

                            <OrderSummary
                              cartItems={cart.length > 0 ? cart : [
                                {
                                  id: 'default_summary_item',
                                  product: TEMPLATE_PRODUCTS[0],
                                  quantity: 1,
                                  selectedColor: 'Silver',
                                  selectedSize: '38mm'
                                }
                              ]}
                              couponDiscountPct={appliedPromoPct}
                              shippingCost={shippingMethod === 'air' ? 45 : 0}
                              giftWrappingCost={giftWrapping ? 15 : 0}
                            />
                          </div>
                        </form>
                      )}
                    </motion.div>
                  ) : shopView === 'login' ? (
                    
                    /* LOGIN VIEW */
                    <motion.div
                      key="login-screen"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="bg-zinc-950 border border-zinc-900 p-6 space-y-6 max-w-md mx-auto"
                    >
                      <div className="pb-3 border-b border-zinc-900 text-center">
                        <div className="h-10 w-10 bg-white text-black flex items-center justify-center font-black rounded-full shadow-lg mx-auto mb-3">
                          <LogIn size={20} />
                        </div>
                        <h2 className="text-base font-semibold font-display uppercase tracking-tight text-white">
                          Zaloguj się do konta
                        </h2>
                        <p className="text-[10px] text-zinc-500 font-mono mt-1">Podaj dane logowania, aby kontynuować zakupy</p>
                      </div>

                      {loginError && (
                        <div className="bg-red-950/20 border border-red-900 text-red-400 p-3 text-xs font-mono text-center">
                          {loginError}
                        </div>
                      )}

                      <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs font-mono">
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase text-zinc-400 block">Adres E-mail</label>
                          <div className="relative flex items-center">
                            <span className="absolute left-3.5 text-zinc-650"><Mail size={13} /></span>
                            <input
                              type="email"
                              required
                              value={loginEmail}
                              onChange={(e) => setLoginEmail(e.target.value)}
                              className="w-full bg-black border border-zinc-805 text-xs text-white pl-10 pr-3 py-2.5 rounded-none focus:outline-none focus:border-zinc-500 font-mono"
                              placeholder="klient@apexstore.pl"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase text-zinc-400 block">Hasło</label>
                          <div className="relative flex items-center">
                            <span className="absolute left-3.5 text-zinc-650"><Lock size={13} /></span>
                            <input
                              type="password"
                              required
                              value={loginPassword}
                              onChange={(e) => setLoginPassword(e.target.value)}
                              className="w-full bg-black border border-zinc-805 text-xs text-white pl-10 pr-3 py-2.5 rounded-none focus:outline-none focus:border-zinc-500 font-mono"
                              placeholder="••••••••"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-white text-black hover:bg-zinc-200 py-3 text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          Zaloguj się
                        </button>
                      </form>

                      <div className="text-center pt-2 border-t border-zinc-900">
                        <p className="text-[10px] text-zinc-500">
                          Nie masz jeszcze konta?{' '}
                          <button
                            onClick={() => {
                              setLoginError('');
                              setShopView('register');
                            }}
                            className="text-white hover:underline font-bold bg-transparent border-none p-0 cursor-pointer"
                          >
                            Utwórz konto
                          </button>
                        </p>
                      </div>
                    </motion.div>
                  ) : shopView === 'register' ? (

                    /* REGISTER VIEW */
                    <motion.div
                      key="register-screen"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="bg-zinc-950 border border-zinc-900 p-6 space-y-6 max-w-lg mx-auto"
                    >
                      <div className="pb-3 border-b border-zinc-900 text-center">
                        <div className="h-10 w-10 bg-white text-black flex items-center justify-center font-black rounded-full shadow-lg mx-auto mb-3">
                          <UserPlus size={20} />
                        </div>
                        <h2 className="text-base font-semibold font-display uppercase tracking-tight text-white">
                          Utwórz nowe konto
                        </h2>
                        <p className="text-[10px] text-zinc-500 font-mono mt-1">Zarejestruj się, aby dokonywać zakupów i śledzić dostawy</p>
                      </div>

                      {regError && (
                        <div className="bg-red-950/20 border border-red-900 text-red-400 p-3 text-xs font-mono text-center">
                          {regError}
                        </div>
                      )}

                      <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs font-mono">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] uppercase text-zinc-400 block">Adres E-mail *</label>
                            <input
                              type="email"
                              required
                              value={regEmail}
                              onChange={(e) => setRegEmail(e.target.value)}
                              className="w-full bg-black border border-zinc-805 text-xs text-white px-3 py-2.5 rounded-none focus:outline-none focus:border-zinc-500 font-mono"
                              placeholder="np. jan@domena.pl"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] uppercase text-zinc-400 block">Hasło *</label>
                            <input
                              type="password"
                              required
                              value={regPassword}
                              onChange={(e) => setRegPassword(e.target.value)}
                              className="w-full bg-black border border-zinc-805 text-xs text-white px-3 py-2.5 rounded-none focus:outline-none focus:border-zinc-500 font-mono"
                              placeholder="Hasło zabezpieczające"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] uppercase text-zinc-400 block">Imię *</label>
                            <input
                              type="text"
                              required
                              value={regFirstName}
                              onChange={(e) => setRegFirstName(e.target.value)}
                              className="w-full bg-black border border-zinc-805 text-xs text-white px-3 py-2 text-zinc-300 font-mono focus:outline-none focus:border-zinc-500"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] uppercase text-zinc-400 block">Nazwisko *</label>
                            <input
                              type="text"
                              required
                              value={regLastName}
                              onChange={(e) => setRegLastName(e.target.value)}
                              className="w-full bg-black border border-zinc-805 text-xs text-white px-3 py-2 text-zinc-300 font-mono focus:outline-none focus:border-zinc-500"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase text-zinc-400 block">Ulica i numer mieszkania</label>
                          <input
                            type="text"
                            value={regStreetAddress}
                            onChange={(e) => setRegStreetAddress(e.target.value)}
                            className="w-full bg-black border border-zinc-805 text-xs text-white px-3 py-2.5 text-zinc-300 font-mono focus:outline-none focus:border-zinc-500"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="space-y-1.5 sm:col-span-1">
                            <label className="text-[10px] uppercase text-zinc-400 block">Kod pocztowy</label>
                            <input
                              type="text"
                              value={regPostalCode}
                              onChange={(e) => setRegPostalCode(e.target.value)}
                              className="w-full bg-black border border-zinc-805 text-xs text-white px-3 py-2 text-zinc-300 font-mono focus:outline-none focus:border-zinc-500"
                              placeholder="np. 00-001"
                            />
                          </div>

                          <div className="space-y-1.5 sm:col-span-2">
                            <label className="text-[10px] uppercase text-zinc-400 block">Miasto</label>
                            <input
                              type="text"
                              value={regCity}
                              onChange={(e) => setRegCity(e.target.value)}
                              className="w-full bg-black border border-zinc-805 text-xs text-white px-3 py-2 text-zinc-300 font-mono focus:outline-none focus:border-zinc-500"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase text-zinc-400 block">Telefon kontaktowy</label>
                          <input
                            type="text"
                            value={regPhone}
                            onChange={(e) => setRegPhone(e.target.value)}
                            className="w-full bg-black border border-zinc-805 text-xs text-white px-3 py-2 text-zinc-300 font-mono focus:outline-none focus:border-zinc-500"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-white text-black hover:bg-zinc-200 py-3 text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          Zarejestruj się i zaloguj
                        </button>
                      </form>

                      <div className="text-center pt-2 border-t border-zinc-900">
                        <p className="text-[10px] text-zinc-500">
                          Masz już konto?{' '}
                          <button
                            onClick={() => {
                              setRegError('');
                              setShopView('login');
                            }}
                            className="text-white hover:underline font-bold bg-transparent border-none p-0 cursor-pointer"
                          >
                            Zaloguj się
                          </button>
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    
                    /* CUSTOMER PORTAL / ACCOUNT DASHBOARD VIEW */
                    <motion.div
                      key="account-screen"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="bg-zinc-950 border border-zinc-900 p-6 space-y-8 animate-fadeIn"
                    >
                      <div className="pb-3 border-b border-zinc-900 flex justify-between items-center sm:flex-row flex-col gap-2 align-middle">
                        <div>
                          <h2 className="text-base font-semibold font-display tracking-tight text-white uppercase">
                            Panel Logistyczny Klienta
                          </h2>
                          <p className="text-xs text-zinc-500 font-mono mt-0.5">Zalogowana sesja: <code className="text-zinc-400">{customerEmail}</code></p>
                        </div>
                        <button
                          onClick={() => { setShopView('home'); }}
                          className="text-[10px] font-mono text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer border border-zinc-850 p-2 uppercase hover:bg-zinc-900"
                        >
                          <LogOut size={12} /> Wyjdź
                        </button>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        
                        {/* Left side profile metadata */}
                        <div className="lg:col-span-4 space-y-4">
                          <div className="bg-black/40 border border-zinc-900 p-4 space-y-4 font-mono">
                            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block pb-1 border-b border-zinc-950">
                              Zarejestrowane Dane
                            </span>
                            
                            <div className="space-y-2 text-xs">
                              <div>
                                <div className="text-zinc-650">E-mail klienta:</div>
                                <div className="text-zinc-200">{customerEmail}</div>
                              </div>
                              <div>
                                <div className="text-zinc-650">Imię i nazwisko:</div>
                                <div className="text-zinc-200">{firstName} {lastName}</div>
                              </div>
                              <div>
                                <div className="text-zinc-650">Adres domyślny:</div>
                                <div className="text-zinc-200">
                                  {streetAddress ? `${streetAddress}, ${postalCode} ${city}` : 'Brak adresu'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right side active orders tracker logs and Return portal */}
                        <div className="lg:col-span-8 space-y-6">
                                   {/* Live Dispatch tracker timeline */}
                          <div className="border border-zinc-900 bg-black/30 p-5 space-y-5">
                            <div className="flex items-center justify-between text-xs font-mono">
                              <span className="text-emerald-400 font-bold uppercase">Śledzenie aktywnego zamówienia</span>
                              {activeTrackedOrder ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-zinc-500">Zamówienie:</span>
                                  <select
                                    value={selectedTrackedOrderId || activeTrackedOrder.id}
                                    onChange={(e) => setSelectedTrackedOrderId(e.target.value)}
                                    className="bg-black border border-zinc-800 text-[10px] text-zinc-300 p-1 font-mono focus:outline-none"
                                  >
                                    {customerWmsOrders.map(o => (
                                      <option key={o.id} value={o.id}>{o.id} ({o.status})</option>
                                    ))}
                                  </select>
                                </div>
                              ) : (
                                <span className="text-zinc-550">Ref: Brak aktywnych zamówień</span>
                              )}
                            </div>

                            {/* Horizontal timeline of stock processing */}
                            <div className="grid grid-cols-3 text-center border-t border-zinc-900 pt-5 relative">
                              <div className={`absolute top-0 transform -translate-y-1.5 h-3 w-3 ${activeTrackedOrder ? 'bg-emerald-400' : 'bg-zinc-800'} left-[16.6%] border-2 border-black rounded-full`} />
                              <div className={`absolute top-0 transform -translate-y-1.5 h-3 w-3 ${isAssembly ? 'bg-emerald-400' : 'bg-zinc-800'} left-[50%] border-2 border-black rounded-full`} />
                              <div className={`absolute top-0 transform -translate-y-1.5 h-3 w-3 ${isDispatched ? 'bg-emerald-400' : 'bg-zinc-800'} left-[83.3%] border-2 border-black rounded-full`} />
                              
                              <div className="space-y-1">
                                <div className={`text-xs font-bold ${activeTrackedOrder ? 'text-emerald-400' : 'text-zinc-500'} font-mono`}>1. PRZYJĘTE</div>
                                <p className="text-[9px] text-zinc-500 font-mono">{activeTrackedOrder ? `Status: ${activeTrackedOrder.status}` : 'Zarejestrowane w systemie'}</p>
                              </div>

                              <div className="space-y-1">
                                <div className={`text-xs font-bold ${isAssembly ? 'text-emerald-400' : 'text-zinc-500'} font-mono`}>2. KOMPLETACJA</div>
                                <p className="text-[9px] text-zinc-500 font-mono">Kolejka kompletowania</p>
                              </div>

                              <div className="space-y-1">
                                <div className={`text-xs font-bold ${isDispatched ? 'text-emerald-400' : 'text-zinc-550'} font-mono`}>3. WYSŁANE</div>
                                <p className="text-[9px] text-zinc-650 font-mono">Przekazano przewoźnikowi</p>
                              </div>
                            </div>
                          </div>

                          {/* Modular interactive Dynamic RMA claim section (requested in section 10) */}
                          <div className="border border-zinc-900 bg-zinc-950 p-5 space-y-4">
                            <span className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-300 block">
                              Automatyczny portal zwrotów i RMA
                            </span>

                            <p className="text-[11px] text-zinc-500 font-mono leading-normal">
                              Aby zarejestrować zwrot zakupionych produktów, wypełnij poniższy formularz RMA. Kontakt telefoniczny nie jest wymagany:
                            </p>

                            {registeredRma ? (
                              <div className="p-3 bg-emerald-950/20 border border-emerald-900 text-xs font-mono text-emerald-400 space-y-2">
                                <h5 className="font-bold uppercase flex items-center gap-1.5">
                                  <ClipboardCheck size={14} /> Zgłoszenie RMA zostało zarejestrowane
                                </h5>
                                <p className="text-[11px]">
                                  Numer referencyjny RMA: <strong className="text-white">{registeredRma}</strong>
                                </p>
                                <p className="text-[10px] text-zinc-300">
                                  Etykieta zwrotna została wygenerowana. Pobierz ją i naklej na paczkę. Po otrzymaniu przesyłki przez nasz magazyn zwrot zostanie automatycznie zarejestrowany.
                                </p>
                                <div className="pt-2">
                                  <button
                                    type="button"
                                    onClick={() => downloadDpdReturnLabel(registeredRma, registeredRmaOrderId)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-[10.5px] font-bold px-3 py-1.5 uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1.5 border-none rounded active:scale-95 shadow-sm"
                                  >
                                    <Download size={13} /> Pobierz etykietę zwrotną DPD (PDF)
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-3 font-mono text-xs">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <label className="text-[10px] uppercase text-zinc-500 font-mono">Wybierz zamówienie</label>
                                    <select 
                                      value={selectedRmaOrderId}
                                      onChange={(e) => setSelectedRmaOrderId(e.target.value)}
                                      className="bg-black border border-zinc-800 text-xs text-zinc-300 p-2 w-full rounded-none focus:outline-none"
                                    >
                                      {customerWmsOrders.length > 0 ? (
                                        customerWmsOrders.map(o => (
                                          <option key={o.id} value={o.id}>Ref: {o.id} ({o.status})</option>
                                        ))
                                      ) : (
                                        <>
                                          <option value="WMS-98124">Ref: WMS-98124 (Kwota: 899.00 EUR)</option>
                                          <option value="WMS-45123">Ref: WMS-45123 (Kwota: 1,250.00 EUR)</option>
                                        </>
                                      )}
                                    </select>
                                  </div>
                                  
                                  <div className="space-y-1">
                                    <label className="text-[10px] uppercase text-zinc-500 font-mono">Powód zwrotu</label>
                                    <input
                                      type="text"
                                      value={rmaReason}
                                      onChange={(e) => setRmaReason(e.target.value)}
                                      className="bg-black border border-zinc-800 text-xs text-white p-2 w-full rounded-none focus:outline-none focus:border-zinc-505"
                                    />
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={handleRmaSubmit}
                                  className="bg-white text-black hover:bg-zinc-200 font-mono text-[11px] font-bold px-4 py-2 uppercase tracking-wide cursor-pointer transition-colors"
                                >
                                  Zarejestruj zwrot (RMA)
                                </button>
                              </div>
                            )}

                          </div>

                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Cart Drawer Panel Slideout */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={() => { setIsCartOpen(false); setShopView('checkout'); setSelectedProduct(null); }}
      />

      {/* Footer bar */}
      <footer className="bg-zinc-950 border-t border-zinc-900 py-6 px-4 mt-12" id="global-footer">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono text-zinc-500">
          <div>
            &copy; 2026 Apex Premium Store. Wszelkie prawa zastrzeżone.
          </div>
          <div className="flex gap-4">
            <span className="text-[10px]" title="System synchronization lock stats">
              Połączenie: <span className="text-emerald-400">● ZABEZPIECZONE</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
