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
  ClipboardCheck
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

const mapWmsProductToStorefront = (wmsProd: any): Product => {
  return {
    id: `{{product.id}}_${wmsProd.sku}`,
    name: `{{product.name}} ${wmsProd.name}`,
    description: `{{product.description}} High-quality item from our WMS catalog. SKU code ${wmsProd.sku}.`,
    price: `{{product.price}} ${Number(wmsProd.price || 0).toFixed(2)} EUR`,
    stock: `{{product.stock}} ${wmsProd.stock} units available in WMS`,
    image: wmsProd.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800',
    category: `{{product.category}} ${wmsProd.category || 'General'}`,
    sku: `{{product.sku}} ${wmsProd.sku}`,
    rating: `{{product.rating}} 4.8 / 5.0 (12 reviews)`,
    specifications: {
      'SKU Code': wmsProd.sku,
      'Category': wmsProd.category || 'General',
      'Stock Level': `${wmsProd.stock} units`,
      'Warehouse Location': wmsProd.zone || 'Zone A'
    }
  };
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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Shopping Page Tab internally inside Sandbox: 'home' | 'category' | 'checkout' | 'account'
  const [shopView, setShopView] = useState<'home' | 'category' | 'checkout' | 'account'>('home');

  // Filters state inside Category Page
  const [filterInStockOnly, setFilterInStockOnly] = useState(false);
  const [priceRange, setPriceRange] = useState<number>(1300);
  const [sortBy, setSortBy] = useState<'low-high' | 'high-low' | 'default'>('default');
  const [isGridView, setIsGridView] = useState(true);

  // Active Variant configuration inside Product detail modal / page
  const [selectedColor, setSelectedColor] = useState('Silver');
  const [selectedSize, setSelectedSize] = useState('38mm');

  // Checkout information state (Prepopulated with user and developer metadata)
  const [customerEmail, setCustomerEmail] = useState('indyks132@gmail.com');
  const [firstName, setFirstName] = useState('Alexander');
  const [lastName, setLastName] = useState('Kowalski');
  const [streetAddress, setStreetAddress] = useState('Marszalkowska 104 m. 12');
  const [postalCode, setPostalCode] = useState('00-017');
  const [city, setCity] = useState('Warszawa');
  const [phone, setPhone] = useState('+48 500 600 700');
  const [shippingMethod, setShippingMethod] = useState<'express' | 'air'>('express');
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromoPct, setAppliedPromoPct] = useState(0);

  // Order submission payload state
  const [submittedOrder, setSubmittedOrder] = useState<any>(null);
  const [orderComplete, setOrderComplete] = useState(false);
  const [registeredRma, setRegisteredRma] = useState<string | null>(null);
  const [rmaReason, setRmaReason] = useState('Damaged casing');

  // Real WMS integration states
  const [wmsProducts, setWmsProducts] = useState<any[]>([]);
  const [wmsOrders, setWmsOrders] = useState<any[]>([]);
  const [selectedTrackedOrderId, setSelectedTrackedOrderId] = useState<string>('');

  // Load real WMS products and orders from localStorage
  useEffect(() => {
    const loadWmsData = () => {
      try {
        const storedProds = localStorage.getItem('wms-products');
        if (storedProds) {
          setWmsProducts(JSON.parse(storedProds));
        }
        const storedOrders = localStorage.getItem('wms-orders');
        if (storedOrders) {
          setWmsOrders(JSON.parse(storedOrders));
        }
      } catch (err) {
        console.error("Failed to load WMS data in storefront:", err);
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

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('wms-data-updated', handleLocalUpdate);
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
          id: `{{cartItem.id}}_${product.id}_${Date.now()}`,
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

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Map storefront order items to WMS order items format
    const wmsOrderItems = cart.map(item => {
      const cleanName = item.product.name.replace(/{{product\.name}}\s*/, '').trim();
      const cleanSku = item.product.sku.replace(/{{product\.sku}}\s*/, '').trim();
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

    const newWmsOrder = {
      id: newOrderId,
      customer: `${firstName} ${lastName}`,
      destination: `${city}, PL`,
      status: 'Oczekujące',
      priority: shippingMethod === 'express' ? 'Wysoki' : 'Normalny',
      shipmentDate: shipmentDate,
      items: wmsOrderItems,
      warehouseCode: 'HUB-PL-01',
      internalNotes: `Zamówienie ze sklepu internetowego. Klient: ${firstName} ${lastName}, Tel: ${phone}. E-mail: ${customerEmail}. Adres: ${streetAddress}, ${postalCode} ${city}. Dostawca: ${shippingMethod === 'express' ? 'WMS Express Cargo' : 'WMS Air Mail'}`,
      internalNotesActor: 'Sklep Internetowy',
      isPacked: false
    };

    // Save to WMS orders list
    existingWmsOrders.push(newWmsOrder);
    localStorage.setItem('wms-orders', JSON.stringify(existingWmsOrders));

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
      const cleanSku = item.product.sku.replace(/{{product\.sku}}\s*/, '').trim();
      const wmsProd = existingWmsProducts.find(p => p.sku === cleanSku);
      if (wmsProd) {
        wmsProd.stock = Math.max(0, wmsProd.stock - item.quantity);
      }
    });
    localStorage.setItem('wms-products', JSON.stringify(existingWmsProducts));

    // Package storefront UI transaction payload
    const transactionPayload = {
      order_id: newOrderId,
      order_number: `WMS-${Date.now().toString().slice(-6)}`,
      customer: {
        email: customerEmail,
        firstName,
        lastName,
        phone
      },
      delivery_address: {
        street: streetAddress,
        postalCode,
        city,
        country: 'Poland'
      },
      logistics: {
        method: shippingMethod === 'express' ? 'WMS Express Cargo' : 'WMS Air Mail',
        cost_eur: shippingMethod === 'express' ? 0 : 45
      },
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
    if (promoCode.toUpperCase() === 'WMS10') {
      setAppliedPromoPct(0.1);
    } else {
      setAppliedPromoPct(0);
    }
  };

  // We can dynamically derive extra categories from wmsProducts
  const dynamicCategories = Array.from(
    new Set(wmsProducts.map((p) => p.category).filter(Boolean))
  ).filter((cat: any) => !TEMPLATE_CATEGORIES.some(t => t.name.includes(cat)));

  const allCategories = [
    ...TEMPLATE_CATEGORIES,
    ...dynamicCategories.map((cat: any) => ({
      id: `{{category.id}}_${cat.toLowerCase()}`,
      name: `{{category.name}} ${cat}`,
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=800',
      productCount: `{{category.productCount}} ${wmsProducts.filter(p => p.category === cat).length} products`,
      description: `{{category.description}} Products from WMS catalog in category ${cat}.`
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
      const cleanSku = p.sku.replace(/{{product\.sku}}\s*/, '').trim();
      if (!seenSkus.has(cleanSku)) {
        seenSkus.add(cleanSku);
        uniqueProducts.push(p);
      }
    }

    return uniqueProducts.filter(p => {
      // Filter by category
      if (selectedCategory) {
        const cleanCat = p.category.replace(/{{product\.category}}\s*/, '').trim().toLowerCase();
        if (cleanCat !== selectedCategory.toLowerCase()) return false;
      }
      // Filter by stock
      if (filterInStockOnly) {
        if (!p.stock.includes('available')) return false;
        // Also check if stock number is > 0
        const match = p.stock.match(/(\d+)\s+units/);
        if (match && parseInt(match[1]) <= 0) return false;
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
      
      {/* 100k+ EUR Principal Grade Enterprise Header Bar */}
      <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-900 px-4 py-4" id="global-nav">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo & Platform Info */}
          <div className="flex items-center gap-3.5">
            <div className="h-9 w-9 bg-white flex items-center justify-center text-black font-bold font-display" title="High-End Monolith Engine">
              W
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold uppercase tracking-wider font-display">
                  WMS Omnichannel Front-End Suite
                </h1>
                <span className="text-[9px] font-mono bg-zinc-900 text-zinc-400 border border-zinc-800 px-1.5 py-0.2">
                  v15.0-STAGE
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 font-mono">
                Principal-Grade Architecture & Active Product Sandbox
              </p>
            </div>
          </div>

          {/* Master View Mode Selector Hub */}
          <div className="flex items-center gap-2 bg-zinc-900/60 p-1 border border-zinc-850 rounded-none w-full md:w-auto">
            <button
              id="mode-btn-sandbox"
              onClick={() => setViewMode('sandbox')}
              className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 text-xs font-mono font-medium transition-all cursor-pointer ${
                viewMode === 'sandbox'
                  ? 'bg-white text-zinc-950 font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
              }`}
            >
              <Layout size={13} />
              Interactive Storefront
            </button>
            <button
              id="mode-btn-blueprint"
              onClick={() => setViewMode('blueprint')}
              className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 text-xs font-mono font-medium transition-all cursor-pointer ${
                viewMode === 'blueprint'
                  ? 'bg-white text-zinc-950 font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
              }`}
            >
              <FileText size={13} />
              Technical Blueprints
            </button>
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
              className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              
              {/* Category selector & state navigation sidebar */}
              <div className="lg:col-span-3 space-y-4">
                
                {/* Local Navigation menu for the shop views */}
                <div className="bg-zinc-950 border border-zinc-900 p-4 space-y-3">
                  <h3 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">
                    System Navigation
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
                      Display Home
                    </button>
                    
                    <button
                      onClick={() => { setShopView('category'); setSelectedProduct(null); }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs font-mono transition-colors cursor-pointer ${
                        shopView === 'category' && !selectedProduct
                          ? 'bg-zinc-900 text-white font-bold'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-900/30'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Grid size={13} /> All Categories
                      </span>
                      {selectedCategory && (
                        <span className="text-[9px] px-1 bg-zinc-800 text-zinc-300">
                          {selectedCategory}
                        </span>
                      )}
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
                        <CreditCard size={13} /> Safe Checkout
                      </span>
                      {cart.length > 0 && (
                        <span className="text-[9px] bg-emerald-950 border border-emerald-900 text-emerald-400 px-1 rounded-none font-bold">
                          {cart.reduce((a, b) => a + b.quantity, 0)} items
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => { setShopView('account'); setSelectedProduct(null); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-mono transition-colors cursor-pointer ${
                        shopView === 'account'
                          ? 'bg-zinc-900 text-white font-bold'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-900/30'
                      }`}
                    >
                      <User size={13} />
                      Customer Dashboard/RMA
                    </button>
                  </div>
                </div>

                {/* Filter and variables tracker panel */}
                <div className="bg-zinc-950 border border-zinc-900 p-4 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-900">
                    <h3 className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-bold">
                      WMS API Parameters
                    </h3>
                    <Database size={12} className="text-zinc-600 animate-pulse" />
                  </div>

                  {/* Schema Inspector on selected object */}
                  <div className="space-y-3">
                    <p className="text-[10px] text-zinc-500 font-mono leading-relaxed">
                      All catalog details are rendered directly via JSON WMS fields:
                    </p>
                    
                    <div className="bg-black/80 border border-zinc-900 p-2 text-[10px] font-mono space-y-1.5 overflow-hidden">
                      <div className="text-zinc-500">{'/* Product map */'}</div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500">Title:</span>
                        <span className="text-white">{'{{product.name}}'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500">Retail:</span>
                        <span className="text-white">{'{{product.price}}'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500">Storage:</span>
                        <span className="text-white">{'{{product.stock}}'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500">Picture:</span>
                        <span className="text-white">{'{{product.image}}'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500">Category:</span>
                        <span className="text-white">{'{{product.category}}'}</span>
                      </div>
                    </div>

                    <div className="p-2.5 bg-zinc-900/40 text-[10px] font-mono text-zinc-400 border border-zinc-900 leading-normal">
                      <span className="font-bold block text-zinc-300 uppercase mb-1">Logistics Note:</span>
                      Selecting size or colors triggers a strict WMS SKU look-up dynamically. Try selecting products to check.
                    </div>
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
                      Cart Drawer ({cart.reduce((a, b) => a + b.quantity, 0)})
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
                        ← Back to lists
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
                              <div className="text-[10px] font-mono text-zinc-500 uppercase">WMS Retail gross price</div>
                              <div className="text-lg font-bold font-mono text-white mt-0.5">
                                {selectedProduct.price}
                              </div>
                            </div>

                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono uppercase bg-zinc-900 text-zinc-300 border border-zinc-800 rounded-none shadow-sm h-7">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              {selectedProduct.stock}
                            </span>
                          </div>

                          {/* Configuration selectors */}
                          <div className="space-y-4">
                            {/* Color Selector */}
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                                Variant Color: {selectedColor}
                              </label>
                              <div className="flex gap-2">
                                {['Silver', 'SpaceGray', 'Champagne'].map((c) => (
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
                                Dimension / Size: {selectedSize}
                              </label>
                              <div className="flex gap-2">
                                {['38mm', '42mm', 'ErgoX', 'LargeSize'].map((sz) => (
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

                          {/* CTA Trigger and immediate add */}
                          <button
                            id="btn-add-product-cta"
                            onClick={() => handleAddToCart(selectedProduct, selectedSize, selectedColor)}
                            className="w-full bg-white text-black hover:bg-zinc-200 py-3.5 text-xs font-mono font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <ShoppingBag size={14} /> Add to WMS Cart Drawer
                          </button>
                        </div>
                      </div>

                      {/* Specifications Grid */}
                      <div className="pt-6 border-t border-zinc-900 space-y-4">
                        <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-widest font-bold">
                          Technical Specification Sheet
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
                          Customer Reviews (WMS-Verified Transactions)
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
                          WMS Connected Up-sell / Cross-sell Products
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
                  ) : shopView === 'home' ? (
                    
                    /* HOME PAGE VIEW */
                    <motion.div
                      key="home-screen"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-8"
                    >
                      {/* Premium Hero Spotlight with detailed description overlay */}
                      <div className="relative bg-zinc-950 border border-zinc-900 overflow-hidden min-h-[340px] flex items-center p-6 md:p-8">
                        {/* Background subtle graphical design overlay */}
                        <div className="absolute right-0 bottom-0 top-0 w-1/2 opacity-30 select-none hidden md:block">
                          <img
                            src={TEMPLATE_PRODUCTS[0].image}
                            alt="Hero Spotlight background"
                            className="w-full h-full object-cover blur-xs contrast-125 saturate-50"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
                        </div>

                        <div className="relative max-w-lg space-y-5 z-10">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[9px] font-mono uppercase tracking-widest bg-emerald-950 text-emerald-400 border border-emerald-900">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Live Best-Seller Synced From WMS
                          </span>

                          <h2 className="text-2xl md:text-3xl font-bold font-display tracking-tight text-white leading-tight">
                            {TEMPLATE_PRODUCTS[0].name}
                          </h2>
                          
                          <p className="text-xs text-zinc-400 font-mono leading-relaxed max-w-sm">
                            {TEMPLATE_PRODUCTS[0].description}
                          </p>

                          <div className="pt-2 flex items-baseline gap-2">
                            <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">MAPPED WMS price</span>
                            <span className="text-xl font-bold font-mono text-white">
                              {TEMPLATE_PRODUCTS[0].price}
                            </span>
                          </div>

                          <div className="pt-2 flex flex-wrap gap-2.5">
                            <button
                              id="btn-hero-add"
                              onClick={() => handleAddToCart(TEMPLATE_PRODUCTS[0])}
                              className="bg-white text-black hover:bg-zinc-200 px-5 py-2.5 text-xs font-mono font-bold uppercase tracking-widest cursor-pointer transition-colors"
                            >
                              Add to cart 🛒
                            </button>
                            <button
                              onClick={() => handleSelectProduct(TEMPLATE_PRODUCTS[0])}
                              className="bg-zinc-900 hover:bg-zinc-800 text-zinc-200 px-5 py-2.5 text-xs font-mono font-medium border border-zinc-800 cursor-pointer transition-colors"
                            >
                              Inspect Variables
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Featured Categories list section */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-zinc-900">
                          <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-300">
                            Featured Categories
                          </h3>
                          <span className="text-[10px] font-mono text-zinc-600">GET /api/categories</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {allCategories.map((cat) => (
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
                        <div className="bg-zinc-950 border border-zinc-900 p-5 space-y-2">
                          <div className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                            <Truck size={14} className="text-zinc-400" /> Dispatch in 24 hrs
                          </div>
                          <p className="text-[11px] text-zinc-500 font-mono leading-relaxed">
                            Simultaneous API connection guarantees that as soon as your cart is processed, logistics labels are printed instantly.
                          </p>
                        </div>
                        
                        <div className="bg-zinc-950 border border-zinc-900 p-5 space-y-2">
                          <div className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                            <SlidersHorizontal size={14} className="text-zinc-400" /> Live Inventory Sync
                          </div>
                          <p className="text-[11px] text-zinc-500 font-mono leading-relaxed">
                            No speculative pre-sales. Real-time WMS stock balancing means 100% fulfill rates.
                          </p>
                        </div>

                        <div className="bg-zinc-950 border border-zinc-900 p-5 space-y-2">
                          <div className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                            <ClipboardCheck size={14} className="text-zinc-400" /> Digital RMA Board
                          </div>
                          <p className="text-[11px] text-zinc-500 font-mono leading-relaxed">
                            Register product returns with automated validation checks straight from your private log cabinet.
                          </p>
                        </div>
                      </div>

                      {/* Best Seller Showcase list */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-zinc-900">
                          <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-300">
                            Dynamic Best-sellers matrix
                          </h3>
                          <span className="text-[10px] font-mono text-zinc-650">GET /api/products?limit=4</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                          {TEMPLATE_PRODUCTS.map((prod) => (
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
                  ) : shopView === 'category' ? (
                    
                    /* CATEGORY VIEW & FILTER GRID */
                    <motion.div
                      key="category-screen"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-6"
                    >
                      {/* Breadcrumb line & category header */}
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-mono text-zinc-500">
                          Home / Products {selectedCategory ? `/ ${selectedCategory}` : '/ All'}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setIsGridView(true)}
                            className={`p-1.5 border transition cursor-pointer ${
                              isGridView ? 'bg-zinc-805 border-zinc-500 text-white' : 'border-zinc-900 text-zinc-500 hover:text-white'
                            }`}
                          >
                            <Grid size={14} />
                          </button>
                          <button
                            onClick={() => setIsGridView(false)}
                            className={`p-1.5 border transition cursor-pointer ${
                              !isGridView ? 'bg-zinc-805 border-zinc-500 text-white' : 'border-zinc-900 text-zinc-500 hover:text-white'
                            }`}
                          >
                            <List size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        {/* Sidebar Filters */}
                        <div className="md:col-span-3 space-y-4 bg-zinc-950 border border-zinc-900 p-4 h-fit">
                          <div className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-300 pb-2 border-b border-zinc-900">
                            Filter Matrix
                          </div>

                          {/* Category select links */}
                          <div className="space-y-1">
                            <span className="text-[10px] font-mono uppercase text-zinc-500 block mb-1.5">Collection</span>
                            <button
                              onClick={() => setSelectedCategory(null)}
                              className={`w-full text-left px-2 py-1.5 text-xs font-mono flex items-center justify-between cursor-pointer ${
                                !selectedCategory ? 'text-white font-bold bg-zinc-900/60' : 'text-zinc-400 hover:text-zinc-200'
                              }`}
                            >
                              <span>Show All</span>
                              {!selectedCategory && <Check size={11} />}
                            </button>
                            {allCategories.map(cat => {
                              const cleanName = cat.name.replace(/{{category\.name}}\s*/, '').trim();
                              const isSelected = selectedCategory === cleanName;
                              return (
                                <button
                                  key={cat.id}
                                  onClick={() => handleCategorySelect(cleanName)}
                                  className={`w-full text-left px-2 py-1.5 text-xs font-mono flex items-center justify-between cursor-pointer ${
                                    isSelected ? 'text-white font-bold bg-zinc-900/60' : 'text-zinc-400 hover:text-zinc-200'
                                  }`}
                                >
                                  <span>{cleanName}</span>
                                  {isSelected && <Check size={11} />}
                                </button>
                              );
                            })}
                          </div>

                          {/* Availability checkbox */}
                          <div className="pt-2 border-t border-zinc-900">
                            <span className="text-[10px] font-mono uppercase text-zinc-500 block mb-2">Availability</span>
                            <label className="flex items-center gap-2 text-xs font-mono text-zinc-300 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={filterInStockOnly}
                                onChange={(e) => setFilterInStockOnly(e.target.checked)}
                                className="bg-black border border-zinc-805 accent-white h-3.5 w-3.5 rounded-none"
                              />
                              In Stock Only
                            </label>
                          </div>

                          {/* Price range filter */}
                          <div className="pt-2 border-t border-zinc-900 space-y-1.5">
                            <div className="flex justify-between text-[10px] font-mono uppercase text-zinc-500">
                              <span>Max Price</span>
                              <span className="text-white">{priceRange} EUR</span>
                            </div>
                            <input
                              type="range"
                              min="100"
                              max="1300"
                              step="50"
                              value={priceRange}
                              onChange={(e) => setPriceRange(parseInt(e.target.value))}
                              className="w-full accent-white bg-zinc-900 cursor-pointer"
                            />
                          </div>

                          {/* Sort Selector */}
                          <div className="pt-2 border-t border-zinc-900 space-y-1.5">
                            <span className="text-[10px] font-mono uppercase text-zinc-500 block">Sort By Order</span>
                            <select
                              value={sortBy}
                              onChange={(e) => setSortBy(e.target.value as any)}
                              className="w-full bg-black border border-zinc-800 text-xs text-white font-mono rounded-none py-1.5 px-2 focus:outline-none focus:border-zinc-500"
                            >
                              <option value="default">Release Default</option>
                              <option value="low-high">Price: Low to High</option>
                              <option value="high-low">Price: High to Low</option>
                            </select>
                          </div>
                        </div>

                        {/* Product lists display area */}
                        <div className="md:col-span-9 space-y-4">
                          <div className="p-3 bg-zinc-900/10 border border-zinc-900 flex justify-between items-center text-xs font-mono">
                            <span className="text-zinc-400">Showing {filteredSandboxProducts.length} items from database</span>
                            <span className="text-[10px] text-zinc-600">GET /api/products?filtered=true</span>
                          </div>

                          {filteredSandboxProducts.length === 0 ? (
                            <div className="border border-zinc-900 py-16 text-center space-y-2">
                              <SlidersHorizontal size={24} className="text-zinc-700 mx-auto" />
                              <p className="text-sm font-medium text-zinc-400">No products match your active filters.</p>
                              <button
                                onClick={() => { setFilterInStockOnly(false); setPriceRange(1300); setSelectedCategory(null); }}
                                className="text-xs text-zinc-300 underline font-mono hover:text-white cursor-pointer"
                              >
                                Clear all filters
                              </button>
                            </div>
                          ) : isGridView ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fadeIn">
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
                                  className="bg-zinc-950 border border-zinc-905 p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
                                >
                                  <div className="flex gap-4 items-center">
                                    <img src={p.image} alt={p.name} className="h-16 w-16 object-cover bg-zinc-900" referrerPolicy="no-referrer" />
                                    <div>
                                      <div className="text-[10px] font-mono text-zinc-500 uppercase">{p.category}</div>
                                      <h4 className="text-sm font-medium text-white mb-0.5">{p.name}</h4>
                                      <p className="text-[11px] font-mono text-zinc-400">{p.sku}</p>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-6 self-stretch sm:self-auto justify-between border-t border-zinc-900 sm:border-t-0 pt-3 sm:pt-0">
                                    <div className="text-right">
                                      <div className="text-[9px] font-mono text-zinc-500">Retail price</div>
                                      <div className="text-xs font-bold font-mono text-zinc-200">{p.price}</div>
                                    </div>
                                    <button
                                      id={`btn-list-add-${p.id}`}
                                      onClick={() => handleAddToCart(p)}
                                      className="bg-zinc-100 text-black hover:bg-zinc-300 px-4 py-2 text-xs font-mono font-bold cursor-pointer transition-colors"
                                    >
                                      Add +
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
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
                          🔒 Secure Integrated Single-Page Checkout
                        </h2>
                        <span className="text-xs font-mono text-emerald-400">Enterprise Standard TLS 1.3</span>
                      </div>

                      {orderComplete && submittedOrder ? (
                        /* SUCCESS ORDER STATE MODAL SCREEN */
                        <div className="bg-zinc-950 border border-emerald-900 p-6 space-y-6 text-center max-w-xl mx-auto">
                          <div className="h-12 w-12 bg-emerald-950 border border-emerald-500 rounded-full flex items-center justify-center text-emerald-400 mx-auto">
                            <Check size={24} />
                          </div>
                          
                          <div className="space-y-2">
                            <h3 className="text-lg font-bold font-display text-white">Order Synced and Dispatched to WMS</h3>
                            <p className="text-xs text-zinc-400 font-mono">
                              Unique Transaction Reference: <span className="text-white font-bold">{submittedOrder.order_id}</span>
                            </p>
                            <p className="text-[11px] text-zinc-500 leading-normal max-w-md mx-auto">
                              The inventory units have been reserved in the logistics database, and shipping orders have been forwarded to the local WMS scanner node.
                            </p>
                          </div>

                          {/* Raw API Response Log payload */}
                          <div className="bg-black border border-zinc-900 p-4 text-left space-y-2">
                            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest flex items-center justify-between pb-1 border-b border-zinc-950">
                              <span>Forwarded API Payload (POST /api/order)</span>
                              <span className="text-emerald-400">201 CREATED</span>
                            </div>
                            <pre className="text-[10px] text-emerald-400 font-mono overflow-x-auto whitespace-pre leading-relaxed p-1.5 max-h-[220px]">
                              {JSON.stringify(submittedOrder, null, 2)}
                            </pre>
                          </div>

                          <div className="flex gap-3 justify-center pt-3">
                            <button
                              onClick={() => { setOrderComplete(false); setShopView('home'); }}
                              className="bg-zinc-100 text-black hover:bg-zinc-300 font-mono text-xs px-5 py-2.5 font-bold uppercase tracking-wider cursor-pointer transition-colors"
                            >
                              Continue Shopping
                            </button>
                            <button
                              onClick={() => setShopView('account')}
                              className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-mono text-xs px-5 py-2.5 hover:text-white border border-zinc-800 cursor-pointer transition-colors"
                            >
                              Track in Dashboard
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
                                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200">Customer Identity</h3>
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-mono uppercase text-zinc-400 block">Email Address (WMS Sync ID)</label>
                                <input
                                  type="email"
                                  required
                                  value={customerEmail}
                                  onChange={(e) => setCustomerEmail(e.target.value)}
                                  className="w-full bg-black border border-zinc-805 text-xs text-white px-3 py-2.5 rounded-none focus:outline-none focus:border-zinc-500 font-mono"
                                />
                                <span className="text-[9px] text-zinc-500 font-mono block">Prepopulated via local customer context.</span>
                              </div>
                            </div>

                            {/* Step B: Postal address parameters */}
                            <div className="bg-zinc-950 border border-zinc-905 p-5 space-y-4">
                              <div className="flex items-center gap-2 border-b border-zinc-900 pb-2">
                                <span className="h-5 w-5 bg-zinc-900 flex items-center justify-center text-[10px] font-mono text-white font-bold border border-zinc-800">2</span>
                                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200">Delivery Postal Address</h3>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-mono uppercase text-zinc-500">First Name</label>
                                  <input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full bg-black border border-zinc-850 text-xs text-white p-2 text-zinc-300 font-mono focus:outline-none focus:border-zinc-500" />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-mono uppercase text-zinc-500">Last Name</label>
                                  <input type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full bg-black border border-zinc-850 text-xs text-white p-2 text-zinc-300 font-mono focus:outline-none focus:border-zinc-500" />
                                </div>
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-[10px] font-mono uppercase text-zinc-500">Street Address & Apartment</label>
                                <input type="text" required value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} className="w-full bg-black border border-zinc-855 text-xs text-white p-2.5 text-zinc-300 font-mono focus:outline-none focus:border-zinc-500" />
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-mono uppercase text-zinc-500">Postal Code (CEP / ZIP)</label>
                                  <input type="text" required value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className="w-full bg-black border border-zinc-855 text-xs text-white p-2 text-zinc-300 font-mono focus:outline-none focus:border-zinc-500" />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-mono uppercase text-zinc-500">City</label>
                                  <input type="text" required value={city} onChange={(e) => setCity(e.target.value)} className="w-full bg-black border border-zinc-855 text-xs text-white p-2 text-zinc-300 font-mono focus:outline-none focus:border-zinc-500" />
                                </div>
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-[10px] font-mono uppercase text-zinc-500">Phone Connection</label>
                                <input type="text" required value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-black border border-zinc-855 text-xs text-white p-2 text-zinc-300 font-mono focus:outline-none focus:border-zinc-500" />
                              </div>
                            </div>

                            {/* Step C: Shipping method courier logs */}
                            <div className="bg-zinc-950 border border-zinc-905 p-5 space-y-4">
                              <div className="flex items-center gap-2 border-b border-zinc-900 pb-2">
                                <span className="h-5 w-5 bg-zinc-900 flex items-center justify-center text-[10px] font-mono text-white font-bold border border-zinc-800">3</span>
                                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200">Logistics & Carrying Cost</h3>
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
                                    <span>WMS Express Cargo (Next Day Door-to-Door)</span>
                                  </span>
                                  <span className="text-emerald-400 font-bold">FREE</span>
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
                                    <span>WMS Priority Air Cargo</span>
                                  </span>
                                  <span className="text-zinc-300 font-bold">45.00 EUR</span>
                                </label>
                              </div>
                            </div>

                            {/* Step D: Mocked Payment and checkout dispatch */}
                            <div className="bg-zinc-950 border border-zinc-905 p-5 space-y-4">
                              <div className="flex items-center gap-2 border-b border-zinc-900 pb-2">
                                <span className="h-5 w-5 bg-zinc-900 flex items-center justify-center text-[10px] font-mono text-white font-bold border border-zinc-800">4</span>
                                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200">Secured Payment Pipeline</h3>
                              </div>
                              
                              <p className="text-[11px] text-zinc-400 font-mono leading-normal bg-zinc-900/40 p-2.5 border border-zinc-900">
                                Simulated payment gateway pipeline. Standard credit card fields are integrated with our sandbox order processor.
                              </p>

                              <div className="space-y-3 font-mono">
                                <div className="space-y-1">
                                  <label className="text-[9px] uppercase tracking-wider text-zinc-500">Security Number (Mocked Credit Card)</label>
                                  <input type="text" placeholder="xxxx xxxx xxxx 2411" disabled className="w-full bg-black border border-zinc-850 p-2.5 text-xs text-zinc-500 placeholder-zinc-700 cursor-not-allowed rounded-none" />
                                </div>
                              </div>

                              <button
                                type="submit"
                                disabled={cart.length === 0}
                                className="w-full bg-emerald-500 text-black hover:bg-emerald-400 py-3.5 text-xs font-mono font-bold uppercase tracking-widest text-center transition-colors shadow-lg disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
                              >
                                Place order & dispatch to WMS 🚀
                              </button>
                            </div>

                          </div>

                          {/* Order summaries ledger */}
                          <div className="lg:col-span-5 space-y-4">
                            <div className="bg-zinc-950 border border-zinc-900 p-4 space-y-3">
                              <span className="text-[10px] font-mono uppercase text-zinc-500 block">Promo Voucher Code</span>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="Voucher (Try WMS10)"
                                  value={promoCode}
                                  onChange={(e) => setPromoCode(e.target.value)}
                                  className="bg-black border border-zinc-850 text-xs px-3 py-2 text-white w-full rounded-none font-mono focus:outline-none focus:border-zinc-500 uppercase"
                                />
                                <button
                                  type="button"
                                  onClick={handleApplyPromo}
                                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-4 py-2 font-mono text-xs cursor-pointer tracking-wider font-bold"
                                >
                                  Apply
                                </button>
                              </div>
                              {appliedPromoPct > 0 && (
                                <p className="text-[10px] font-mono text-emerald-400">Coupon successfully applied! 10% discount subtracted.</p>
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
                              shippingCost={shippingMethod === 'express' ? 0 : 45}
                            />
                          </div>
                        </form>
                      )}
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
                            Customer Logistics Console
                          </h2>
                          <p className="text-xs text-zinc-500 font-mono mt-0.5">Logged session context: <code className="text-zinc-400">indyks132@gmail.com</code></p>
                        </div>
                        <button
                          onClick={() => { setShopView('home'); }}
                          className="text-[10px] font-mono text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer border border-zinc-850 p-2 uppercase hover:bg-zinc-900"
                        >
                          <LogOut size={12} /> Exit Session
                        </button>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        
                        {/* Left side profile metadata */}
                        <div className="lg:col-span-4 space-y-4">
                          <div className="bg-black/40 border border-zinc-900 p-4 space-y-4 font-mono">
                            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block pb-1 border-b border-zinc-950">
                              Registered Coordinates
                            </span>
                            
                            <div className="space-y-2 text-xs">
                              <div>
                                <div className="text-zinc-650">Customer Email:</div>
                                <div className="text-zinc-200">indyks132@gmail.com</div>
                              </div>
                              <div>
                                <div className="text-zinc-650">Contact Full Name:</div>
                                <div className="text-zinc-200">Alexander Kowalski</div>
                              </div>
                              <div>
                                <div className="text-zinc-650">Default Postal:</div>
                                <div className="text-zinc-200">Marszalkowska 104 m. 12, 00-017 Warszawa</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right side active orders tracker logs and Return portal */}
                        <div className="lg:col-span-8 space-y-6">
                                   {/* Live Dispatch tracker timeline */}
                          <div className="border border-zinc-900 bg-black/30 p-5 space-y-5">
                            <div className="flex items-center justify-between text-xs font-mono">
                              <span className="text-emerald-400 font-bold uppercase">Active Logistics order Track</span>
                              {activeTrackedOrder ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-zinc-500">Order:</span>
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
                                <div className={`text-xs font-bold ${activeTrackedOrder ? 'text-emerald-400' : 'text-zinc-500'} font-mono`}>1. RECEIVED</div>
                                <p className="text-[9px] text-zinc-500 font-mono">{activeTrackedOrder ? `Status: ${activeTrackedOrder.status}` : 'Pushed to WMS stack'}</p>
                              </div>

                              <div className="space-y-1">
                                <div className={`text-xs font-bold ${isAssembly ? 'text-emerald-400' : 'text-zinc-500'} font-mono`}>2. ASSEMBLY</div>
                                <p className="text-[9px] text-zinc-500 font-mono">Picking index queue</p>
                              </div>

                              <div className="space-y-1">
                                <div className={`text-xs font-bold ${isDispatched ? 'text-emerald-400' : 'text-zinc-550'} font-mono`}>3. DISPATCHED</div>
                                <p className="text-[9px] text-zinc-650 font-mono">{activeTrackedOrder?.binId ? `Pojemnik: ${activeTrackedOrder.binId}` : 'Courier pickup track'}</p>
                              </div>
                            </div>
                          </div>

                          {/* Modular interactive Dynamic RMA claim section (requested in section 10) */}
                          <div className="border border-zinc-900 bg-zinc-950 p-5 space-y-4">
                            <span className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-300 block">
                              Automated WMS Return and RMA Portal
                            </span>

                            <p className="text-[11px] text-zinc-500 font-mono leading-normal">
                              To register a dynamic return of any purchased inventory items directly with WMS storage receptors, fill out the RMA ticket. No call required:
                            </p>

                            {registeredRma ? (
                              <div className="p-3 bg-emerald-950/20 border border-emerald-900 text-xs font-mono text-emerald-400 space-y-2">
                                <h5 className="font-bold uppercase flex items-center gap-1.5">
                                  <ClipboardCheck size={14} /> RMA Claim Successfully Logged
                                </h5>
                                <p className="text-[11px]">
                                  RMA Reference: <strong className="text-white">{registeredRma}</strong>
                                </p>
                                <p className="text-[10px] text-zinc-300">
                                  Your return authorization label has been generated. When physical items arrive at warehouse index node [WMS-IN-03], stock balances will adapt automatically.
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-3 font-mono text-xs">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <label className="text-[10px] uppercase text-zinc-500 font-mono">Select Order</label>
                                    <select className="bg-black border border-zinc-800 text-xs text-zinc-300 p-2 w-full rounded-none focus:outline-none">
                                      {customerWmsOrders.length > 0 ? (
                                        customerWmsOrders.map(o => (
                                          <option key={o.id}>Ref: {o.id} ({o.status})</option>
                                        ))
                                      ) : (
                                        <>
                                          <option>Ref: WMS-98124 (Amount: 899.00 EUR)</option>
                                          <option>Ref: WMS-45123 (Amount: 1,250.00 EUR)</option>
                                        </>
                                      )}
                                    </select>
                                  </div>
                                  
                                  <div className="space-y-1">
                                    <label className="text-[10px] uppercase text-zinc-500 font-mono">Return Claim Reason</label>
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
                                  onClick={() => setRegisteredRma(`RMA-${Date.now().toString().slice(-6)}-WMS`)}
                                  className="bg-white text-black hover:bg-zinc-200 font-mono text-[11px] font-bold px-4 py-2 uppercase tracking-wide cursor-pointer transition-colors"
                                >
                                  Register RMA in WMS Server
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
            &copy; 2026 WMS Omnichannel Front-End Portal. All rights reserved.
          </div>
          <div className="flex gap-4">
            <span className="text-[10px]" title="System synchronization lock stats">
              WMS Sync Endpoint Status: <span className="text-emerald-400">● ONLINE</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
