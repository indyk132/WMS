import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Filter, ChevronLeft, ChevronRight, Trash2, Edit, X, Scale, CreditCard, Layers } from 'lucide-react';
import { Product } from '../../services/inventoryApi';

interface SalesProductsProps {
    products: Product[];
    onAddProduct: (newProduct: any) => Promise<void>;
    onUpdateProduct: (productId: any, updatedFields: any) => Promise<void>;
    onDeleteProduct: (productId: any) => Promise<void>;
}

export default function SalesProducts({
    products,
    onAddProduct,
    onUpdateProduct,
    onDeleteProduct,
}: SalesProductsProps) {
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [zoneFilter, setZoneFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    
    // Selection state for detail view
    const [selectedProductDetailId, setSelectedProductDetailId] = useState<any | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Modal states
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form fields
    const [formSku, setFormSku] = useState('');
    const [formName, setFormName] = useState('');
    const [formCategory, setFormCategory] = useState('Elektronika');
    const [formPrice, setFormPrice] = useState(199.99);
    const [formWeight, setFormWeight] = useState(1.5);
    const [formReorderThreshold, setFormReorderThreshold] = useState(20);
    const [formBarcode, setFormBarcode] = useState('');
    const [formDimensions, setFormDimensions] = useState('20 x 20 x 20 cm');

    // LocalStorage for weights persistence
    const [weights, setWeights] = useState<Record<string, number>>(() => {
        try {
            const stored = localStorage.getItem('wms-product-weights');
            return stored ? JSON.parse(stored) : {};
        } catch {
            return {};
        }
    });

    // LocalStorage for dimensions persistence
    const [dimensions, setDimensions] = useState<Record<string, string>>(() => {
        try {
            const stored = localStorage.getItem('wms-product-dimensions');
            return stored ? JSON.parse(stored) : {};
        } catch {
            return {};
        }
    });

    // LocalStorage for images persistence
    const [productImages, setProductImages] = useState<Record<string, string>>(() => {
        try {
            const stored = localStorage.getItem('wms-product-images');
            return stored ? JSON.parse(stored) : {};
        } catch {
            return {};
        }
    });

    const getWeight = (sku: string) => {
        if (weights[sku] !== undefined) return weights[sku];
        let hash = 0;
        for (let i = 0; i < sku.length; i++) {
            hash = sku.charCodeAt(i) + ((hash << 5) - hash);
        }
        const val = Math.abs(hash % 100) / 10 + 0.15; // 0.15 to 10.15 kg
        return parseFloat(val.toFixed(2));
    };

    const saveWeight = (sku: string, w: number) => {
        const updated = { ...weights, [sku]: w };
        setWeights(updated);
        localStorage.setItem('wms-product-weights', JSON.stringify(updated));
    };

    const getDimensions = (sku: string, category?: string) => {
        if (dimensions[sku]) return dimensions[sku];
        if (category === 'Elektronika') return '15 x 10 x 5 cm';
        if (category === 'Narzędzia') return '30 x 15 x 10 cm';
        if (category === 'Odzież BHP') return '40 x 30 x 2 cm';
        if (category === 'Opakowania') return '40 x 30 x 20 cm';
        return '20 x 20 x 20 cm';
    };

    const saveDimensions = (sku: string, dim: string) => {
        const updated = { ...dimensions, [sku]: dim };
        setDimensions(updated);
        localStorage.setItem('wms-product-dimensions', JSON.stringify(updated));
    };

    const getImage = (sku: string) => {
        return productImages[sku] || '';
    };

    const saveImage = (sku: string, url: string) => {
        const updated = { ...productImages, [sku]: url };
        setProductImages(updated);
        localStorage.setItem('wms-product-images', JSON.stringify(updated));
    };

    const parseLocationCode = (code: string) => {
        const match = String(code || '').match(/^([A-Z]+)-(\d+)-(\d+)-(\d+)$/i) || 
                      String(code || '').match(/^([A-Z]+)-(\d+)-(\d+)$/i);
        if (!match) return { sector: 'A', aisle: '01', rack: '01' };
        return {
            sector: match[1].toUpperCase(),
            aisle: match[2].padStart(2, '0'),
            rack: match[3].padStart(2, '0')
        };
    };

    // Derived values
    const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean))).sort();
    const zones = Array.from(new Set(products.map(p => p.zone).filter(Boolean))).sort();

    const filteredProducts = products.filter(p => {
        const matchesSearch = (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
            (p.sku || '').toLowerCase().includes(search.toLowerCase());
        
        const matchesCat = categoryFilter ? p.category === categoryFilter : true;
        
        const matchesZone = zoneFilter ? p.zone === zoneFilter : true;

        let matchesStatus = true;
        if (statusFilter) {
            const calculatedStatus = p.stock === 0 ? 'Out' : p.stock <= p.reorderThreshold ? 'Low' : 'In';
            if (statusFilter === 'in_stock') matchesStatus = calculatedStatus === 'In';
            else if (statusFilter === 'low_stock') matchesStatus = calculatedStatus === 'Low';
            else if (statusFilter === 'out_of_stock') matchesStatus = calculatedStatus === 'Out';
        }

        return matchesSearch && matchesCat && matchesZone && matchesStatus;
    });

    // Pagination
    const rowsPerPage = 5;
    const totalPages = Math.ceil(filteredProducts.length / rowsPerPage) || 1;
    const startIndex = (currentPage - 1) * rowsPerPage;
    const paginatedProducts = filteredProducts.slice(startIndex, startIndex + rowsPerPage);

    // Reset pagination on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [search, categoryFilter, statusFilter, zoneFilter]);

    const handleOpenAdd = () => {
        setFormSku(`EL-${Math.floor(1000 + Math.random() * 9000)}-X`);
        setFormName('');
        setFormCategory(categories[0] || 'Elektronika');
        setFormPrice(149.99);
        setFormWeight(0.5);
        setFormReorderThreshold(20);
        setFormBarcode('');
        setFormDimensions('20 x 20 x 20 cm');
        setErrorMessage('');
        setIsAddModalOpen(true);
    };

    const handleOpenEdit = (p: Product) => {
        console.log('handleOpenEdit called with product:', p);
        setSelectedProduct(p);
        setFormSku(p.sku || '');
        setFormName(p.name || '');
        setFormCategory(p.category || 'Elektronika');
        setFormPrice(p.price || 0);
        setFormWeight(getWeight(p.sku || ''));
        setFormReorderThreshold(p.reorderThreshold ?? 20);
        setFormBarcode(p.barcode || '');
        setFormDimensions(getDimensions(p.sku || '', p.category));
        setErrorMessage('');
        setIsEditModalOpen(true);
    };

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formSku.trim() || !formName.trim() || !formCategory.trim()) {
            setErrorMessage('Wszystkie wymagane pola muszą być uzupełnione.');
            return;
        }

        setIsSubmitting(true);
        setErrorMessage('');

        try {
            await onAddProduct({
                sku: formSku,
                name: formName,
                category: formCategory,
                price: Number(formPrice),
                reorderThreshold: Number(formReorderThreshold),
                barcode: formBarcode || formSku,
            });
            saveWeight(formSku, Number(formWeight));
            saveDimensions(formSku, formDimensions);
            setIsAddModalOpen(false);
        } catch (err: any) {
            setErrorMessage(err.message || 'Nie udało się dodać produktu.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProduct) {
            console.warn('handleEditSubmit: selectedProduct is null');
            return;
        }

        console.log('handleEditSubmit: selectedProduct.productId =', selectedProduct.productId, 'form fields:', {
            formSku, formName, formCategory, formPrice, formWeight, formBarcode, formDimensions, formReorderThreshold
        });

        if (!formSku.trim() || !formName.trim() || !formCategory.trim()) {
            setErrorMessage('Wszystkie wymagane pola muszą być uzupełnione.');
            return;
        }

        setIsSubmitting(true);
        setErrorMessage('');

        try {
            await onUpdateProduct(selectedProduct.productId, {
                sku: formSku,
                name: formName,
                category: formCategory,
                price: Number(formPrice),
                reorder_threshold: Number(formReorderThreshold),
                reorderThreshold: Number(formReorderThreshold),
                barcode: formBarcode,
            });
            console.log('onUpdateProduct success. Saving weights/dimensions to localStorage...');
            saveWeight(formSku, Number(formWeight));
            saveDimensions(formSku, formDimensions);
            setIsEditModalOpen(false);
            
            // If currently viewing, refresh states
            if (selectedProductDetailId === selectedProduct.productId || selectedProductDetailId === selectedProduct.sku) {
                console.log('Updating selectedProductDetailId state to new SKU:', formSku);
                setSelectedProductDetailId(formSku);
            }
        } catch (err: any) {
            console.error('handleEditSubmit failed:', err);
            setErrorMessage(err.message || 'Nie udało się zapisać zmian.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (p: Product) => {
        if (!window.confirm(`Czy na pewno chcesz trwale usunąć produkt ${p.name} (${p.sku}) ze sprzedaży?`)) {
            return;
        }

        try {
            await onDeleteProduct(p.productId);
            // Clean up overrides
            const copyWeights = { ...weights };
            delete copyWeights[p.sku];
            setWeights(copyWeights);
            localStorage.setItem('wms-product-weights', JSON.stringify(copyWeights));

            const copyDims = { ...dimensions };
            delete copyDims[p.sku];
            setDimensions(copyDims);
            localStorage.setItem('wms-product-dimensions', JSON.stringify(copyDims));

            const copyImgs = { ...productImages };
            delete copyImgs[p.sku];
            setProductImages(copyImgs);
            localStorage.setItem('wms-product-images', JSON.stringify(copyImgs));

            if (selectedProductDetailId === p.productId || selectedProductDetailId === p.sku) {
                setSelectedProductDetailId(null);
            }
        } catch (err: any) {
            alert(err.message || 'Nie udało się usunąć produktu.');
        }
    };

    const productDetail = selectedProductDetailId
        ? products.find(p => p.productId === selectedProductDetailId || p.sku === selectedProductDetailId)
        : null;

    const reserved = productDetail ? Math.floor(productDetail.stock * 0.25) : 0;
    const available = productDetail ? Math.max(0, productDetail.stock - reserved) : 0;
    const loc = productDetail ? parseLocationCode(productDetail.locationCode || productDetail.zone) : { sector: 'A', aisle: '01', rack: '01' };
    const dims = productDetail ? getDimensions(productDetail.sku, productDetail.category) : '';
    const ean = productDetail ? (productDetail.barcode || `590${Math.floor(1000000000 + Math.random() * 9000000000)}`) : '';
    const productImage = productDetail ? getImage(productDetail.sku) : '';

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !productDetail) return;

        if (!file.type.startsWith('image/')) {
            alert('Wybierz poprawny plik graficzny (obrazek).');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const MAX_WIDTH = 600;
                const MAX_HEIGHT = 600;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
                    saveImage(productDetail.sku, dataUrl);
                } else {
                    saveImage(productDetail.sku, event.target?.result as string);
                }
            };
            img.onerror = () => {
                saveImage(productDetail.sku, event.target?.result as string);
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const handleUploadImageUrl = () => {
        if (!productDetail) return;
        const url = window.prompt('Wprowadź adres URL zdjęcia produktu:', productImage);
        if (url !== null) {
            saveImage(productDetail.sku, url);
        }
    };

    const handleRemoveImage = () => {
        if (!productDetail) return;
        if (window.confirm('Czy na pewno chcesz usunąć zdjęcie produktu?')) {
            saveImage(productDetail.sku, '');
        }
    };

    return (
        <div className="space-y-6 font-sans text-sm text-[#0b1c30] animate-fadeIn">
            {productDetail ? (
                /* Sub-view: Product Details page */
                <div className="space-y-6 font-sans text-sm text-[#0b1c30] animate-fadeIn">
                    {/* Breadcrumbs */}
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 select-none">
                        <button 
                            onClick={() => setSelectedProductDetailId(null)}
                            className="hover:text-blue-600 transition-colors font-semibold cursor-pointer border-none bg-transparent"
                        >
                            Katalog Produktów
                        </button>
                        <span>&gt;</span>
                        <span className="font-extrabold text-zinc-800">Szczegóły Produktu</span>
                    </div>

                    {/* Title Banner */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-150 pb-4">
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-3 flex-wrap">
                                <h2 className="text-2xl font-black tracking-tight text-zinc-900 leading-none">{productDetail.name}</h2>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                    AKTYWNY
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-zinc-400 font-bold text-xs uppercase tracking-wider">SKU:</span>
                                <span className="bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded text-xs font-mono font-bold text-zinc-755">{productDetail.sku}</span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => productDetail && handleOpenEdit(productDetail)}
                                className="h-10 px-4 rounded-lg border border-zinc-350 text-zinc-700 font-bold text-xs flex items-center gap-2 hover:bg-zinc-50 transition-all shadow-3xs bg-white cursor-pointer"
                            >
                                <Edit className="w-4 h-4 text-zinc-500" /> Edytuj dane
                            </button>
                        </div>
                    </div>

                    {/* Main Grid Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        
                        {/* Left Column: Image Card */}
                        <div className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm p-6 flex flex-col items-center justify-center min-h-[300px] text-center space-y-4">
                            {productImage ? (
                                <img src={productImage} alt={productDetail.name} className="max-h-48 object-contain rounded-lg shadow-sm" />
                            ) : (
                                <>
                                    <div className="w-20 h-20 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-300 border border-dashed border-zinc-200">
                                        <Layers className="w-10 h-10 text-zinc-300" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-bold text-zinc-500 text-xs">Brak zdjęcia produktu</p>
                                        <p className="text-[10px] text-zinc-400">Dodaj zdjęcie do oferty sprzedażowej</p>
                                    </div>
                                </>
                            )}
                            <div className="flex flex-wrap gap-2 justify-center">
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-3 py-1.5 rounded-lg border border-zinc-350 bg-white hover:bg-zinc-50 text-zinc-700 font-bold transition-all text-xs cursor-pointer shadow-3xs flex items-center gap-1.5"
                                >
                                    Wgraj z dysku
                                </button>
                                <button 
                                    onClick={handleUploadImageUrl}
                                    className="px-3 py-1.5 rounded-lg border border-zinc-350 bg-white hover:bg-zinc-50 text-zinc-700 font-bold transition-all text-xs cursor-pointer shadow-3xs flex items-center gap-1.5"
                                >
                                    Podaj URL
                                </button>
                                {productImage && (
                                    <button 
                                        onClick={handleRemoveImage}
                                        className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-bold transition-all text-xs cursor-pointer flex items-center gap-1.5"
                                    >
                                        Usuń
                                    </button>
                                )}
                            </div>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleFileUpload} 
                                accept="image/*" 
                                className="hidden" 
                            />
                        </div>

                        {/* Middle Column: KPI + Basic info */}
                        <div className="md:col-span-2 space-y-6">
                            
                            {/* KPI cards row */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="bg-white border border-[#e5e7eb] rounded-xl p-4 shadow-sm space-y-1">
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none block">STAN MAGAZYNOWY</span>
                                    <p className="text-2xl font-black text-zinc-900 leading-tight">
                                        {productDetail.stock.toLocaleString('pl-PL')} <span className="text-xs text-zinc-400 font-bold">szt.</span>
                                    </p>
                                </div>
                                <div className="bg-white border border-[#e5e7eb] rounded-xl p-4 shadow-sm space-y-1">
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none block">ZAREZERWOWANE</span>
                                    <p className="text-2xl font-black text-zinc-900 leading-tight">
                                        {reserved.toLocaleString('pl-PL')} <span className="text-xs text-zinc-400 font-bold">szt.</span>
                                    </p>
                                </div>
                                <div className="bg-white border border-[#e5e7eb] rounded-xl p-4 shadow-sm space-y-1">
                                    <span className="text-[10px] font-bold text-[#2170e4] uppercase tracking-widest leading-none block">DOSTĘPNE</span>
                                    <p className="text-2xl font-black text-[#2170e4] leading-tight">
                                        {available.toLocaleString('pl-PL')} <span className="text-xs text-[#2170e4] font-bold">szt.</span>
                                    </p>
                                </div>
                            </div>

                            {/* Sub Grid for Basic Info & Location */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                
                                {/* Informacje Podstawowe */}
                                <div className="bg-white border border-[#e5e7eb] rounded-xl p-5 shadow-sm space-y-4">
                                    <h3 className="font-extrabold text-zinc-900 text-xs uppercase tracking-wider pb-2 border-b border-zinc-100 flex items-center gap-2">
                                        <CreditCard className="w-4 h-4 text-blue-600" />
                                        Informacje Podstawowe
                                    </h3>
                                    <div className="space-y-3 text-xs font-semibold">
                                        <div className="flex justify-between items-center">
                                            <span className="text-zinc-500">Cena jednostkowa</span>
                                            <span className="font-bold text-zinc-850 font-mono">
                                                {(productDetail.price || 0).toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} PLN
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-zinc-500">Waga brutto</span>
                                            <span className="font-bold text-zinc-850 font-mono">{getWeight(productDetail.sku)} kg</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-zinc-500">Wymiary (Dł x Szer x Wys)</span>
                                            <span className="font-bold text-zinc-850 font-mono">{dims}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-zinc-500">Kod EAN</span>
                                            <span className="font-bold text-zinc-700 bg-zinc-50 border border-zinc-200 px-1.5 py-0.5 rounded font-mono text-[10px] tracking-wide">{ean}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Lokalizacja w Magazynie */}
                                <div className="bg-white border border-[#e5e7eb] rounded-xl p-5 shadow-sm space-y-4">
                                    <h3 className="font-extrabold text-zinc-900 text-xs uppercase tracking-wider pb-2 border-b border-zinc-100 flex items-center gap-2">
                                        <Scale className="w-4 h-4 text-blue-600" />
                                        Lokalizacja w Magazynie
                                    </h3>
                                    <div className="grid grid-cols-3 gap-2 text-center select-none font-bold">
                                        <div className="bg-blue-50/40 border border-blue-150 rounded-lg p-2">
                                            <span className="text-[9px] text-zinc-400 block tracking-wider mb-1 font-bold">STREFA</span>
                                            <span className="text-base font-black text-[#2170e4] font-mono">{loc.sector}</span>
                                        </div>
                                        <div className="bg-blue-50/40 border border-blue-150 rounded-lg p-2">
                                            <span className="text-[9px] text-zinc-400 block tracking-wider mb-1 font-bold">ALEJKA</span>
                                            <span className="text-base font-black text-[#2170e4] font-mono">{loc.aisle}</span>
                                        </div>
                                        <div className="bg-blue-50/40 border border-blue-150 rounded-lg p-2">
                                            <span className="text-[9px] text-zinc-400 block tracking-wider mb-1 font-bold">REGAŁ</span>
                                            <span className="text-base font-black text-[#2170e4] font-mono">{loc.rack}</span>
                                        </div>
                                    </div>
                                    <div className="bg-blue-50/30 border border-blue-150 rounded-xl p-3 text-[10px] text-blue-750 flex items-start gap-2 select-none leading-snug">
                                        <span className="text-blue-600 font-bold shrink-0 mt-0.5">ℹ️</span>
                                        <span>Lokalizacja zoptymalizowana dla szybkiej kompletacji.</span>
                                    </div>
                                </div>

                            </div>
                        </div>

                    </div>
                    
                    {/* Back Button */}
                    <div className="flex justify-start pt-2 select-none">
                        <button
                            onClick={() => setSelectedProductDetailId(null)}
                            className="px-4 py-2 border border-zinc-350 rounded-lg bg-white hover:bg-zinc-50 text-zinc-700 font-bold text-xs transition-colors cursor-pointer"
                        >
                            &larr; Powrót do listy
                        </button>
                    </div>
                </div>
            ) : (
                /* Main List View */
                <>
                    {/* Header Block */}
                    <div className="flex justify-between items-end mb-2">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 leading-tight border-none">Katalog Produktów</h2>
                            <p className="text-zinc-500 text-xs mt-1">Zarządzaj asortymentem i danymi magazynowymi (ceny, waga i statusy handlowe).</p>
                        </div>
                        <button
                            onClick={handleOpenAdd}
                            className="h-10 px-4 rounded-lg bg-[#2170e4] hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-md border-none"
                        >
                            <Plus className="w-4 h-4" /> Dodaj produkt
                        </button>
                    </div>

                    {/* Filter Bar */}
                    <div className="bg-white rounded-lg border border-[#e5e7eb] shadow-sm p-4 flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative w-full md:w-80">
                            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Szukaj po SKU lub nazwie..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 border border-zinc-250 rounded-lg text-xs bg-white text-zinc-900 outline-none focus:border-blue-500"
                            />
                        </div>

                        <div className="flex flex-wrap gap-3 w-full md:w-auto md:ml-auto items-center">
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="h-9 px-3 border border-zinc-250 rounded-lg text-xs bg-white text-zinc-700 outline-none focus:border-blue-500 cursor-pointer min-w-[150px]"
                            >
                                <option value="">Wszystkie Kategorie</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat === 'Zywnosc' ? 'Żywność' : cat}</option>
                                ))}
                            </select>

                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="h-9 px-3 border border-zinc-250 rounded-lg text-xs bg-white text-zinc-700 outline-none focus:border-blue-500 cursor-pointer min-w-[130px]"
                            >
                                <option value="">Dostępność</option>
                                <option value="in_stock">W magazynie</option>
                                <option value="low_stock">Niski stan</option>
                                <option value="out_of_stock">Brak</option>
                            </select>

                            <select
                                value={zoneFilter}
                                onChange={(e) => setZoneFilter(e.target.value)}
                                className="h-9 px-3 border border-zinc-250 rounded-lg text-xs bg-white text-zinc-700 outline-none focus:border-blue-500 cursor-pointer min-w-[130px]"
                            >
                                <option value="">Wszystkie Strefy</option>
                                {zones.map(z => (
                                    <option key={z} value={z}>Strefa {z}</option>
                                ))}
                            </select>

                            <button 
                                onClick={() => {
                                    setSearch('');
                                    setCategoryFilter('');
                                    setStatusFilter('');
                                    setZoneFilter('');
                                }}
                                className="h-9 px-4 rounded-lg border border-zinc-300 text-zinc-700 font-bold text-xs bg-white hover:bg-zinc-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                                <Filter className="w-3.5 h-3.5 text-zinc-500" /> Filtruj
                            </button>
                        </div>
                    </div>

                    {/* Products Table */}
                    <div className="bg-white rounded-lg border border-[#e5e7eb] shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-zinc-50 font-bold text-zinc-650 text-xs border-b border-[#e5e7eb]">
                                        <th className="py-3 px-5 font-bold">Kod SKU</th>
                                        <th className="py-3 px-5 font-bold">Nazwa produktu</th>
                                        <th className="py-3 px-5 font-bold">Kategoria</th>
                                        <th className="py-3 px-5 text-right font-bold">Cena (PLN)</th>
                                        <th className="py-3 px-5 text-right font-bold">Waga (kg)</th>
                                        <th className="py-3 px-5 text-center font-bold">Status</th>
                                        <th className="py-3 px-5 text-center font-bold w-24">Akcje</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-200 text-xs font-semibold text-zinc-800">
                                    {paginatedProducts.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="py-10 text-center text-zinc-400 font-bold bg-white">Brak produktów pasujących do filtrów.</td>
                                        </tr>
                                    ) : (
                                        paginatedProducts.map(p => {
                                            const calculatedStatus = p.stock === 0 ? 'Out' : p.stock <= p.reorderThreshold ? 'Low' : 'In';
                                            const statusLabel = calculatedStatus === 'In' ? 'W magazynie' : calculatedStatus === 'Low' ? 'Niski stan' : 'Brak';
                                            const statusBadgeClass = calculatedStatus === 'In'
                                                ? 'bg-blue-55 text-blue-700 border-blue-200'
                                                : calculatedStatus === 'Low'
                                                    ? 'bg-amber-50 text-amber-700 border-amber-250 animate-pulse'
                                                    : 'bg-red-50 text-red-750 border-red-200';

                                            return (
                                                <tr key={p.sku} className="hover:bg-zinc-50/70 transition-colors">
                                                    <td className="py-3.5 px-5 font-mono font-bold text-[#2170e4]">
                                                        <button
                                                            onClick={() => setSelectedProductDetailId(p.sku)}
                                                            className="font-mono font-bold text-[#2170e4] hover:underline cursor-pointer outline-none bg-transparent border-none text-left"
                                                        >
                                                            {p.sku}
                                                        </button>
                                                    </td>
                                                    <td className="py-3.5 px-5 font-normal text-zinc-705">
                                                        <button 
                                                            onClick={() => setSelectedProductDetailId(p.sku)}
                                                            className="hover:underline cursor-pointer border-none bg-transparent text-left outline-none text-zinc-700 font-bold"
                                                        >
                                                            {p.name}
                                                        </button>
                                                    </td>
                                                    <td className="py-3.5 px-5 text-zinc-500">{p.category === 'Zywnosc' ? 'Żywność' : p.category}</td>
                                                    <td className="py-3.5 px-5 text-right font-mono font-bold text-zinc-850">
                                                        {(p.price || 0).toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="py-3.5 px-5 text-right font-mono text-zinc-655">
                                                        {getWeight(p.sku).toFixed(2)}
                                                    </td>
                                                    <td className="py-3.5 px-5 text-center select-none">
                                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-block border ${statusBadgeClass}`}>
                                                            {statusLabel}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-5 text-center select-none">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                onClick={() => handleOpenEdit(p)}
                                                                className="p-1 hover:bg-zinc-100 rounded text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer border-none bg-transparent"
                                                                title="Edytuj szczegóły handlowe"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(p)}
                                                                className="p-1 hover:bg-red-50 rounded text-red-550 hover:text-red-700 transition-colors cursor-pointer border-none bg-transparent"
                                                                title="Usuń produkt ze sprzedaży"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
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

                        {/* Table Footer / Pagination */}
                        <div className="px-5 py-3 border-t border-[#e5e7eb] bg-zinc-50 flex items-center justify-between">
                            <span className="text-zinc-500 text-xs font-semibold">
                                Pokazano {filteredProducts.length === 0 ? 0 : startIndex + 1}-{Math.min(startIndex + rowsPerPage, filteredProducts.length)} z {filteredProducts.length} produktów
                            </span>

                            <div className="flex items-center gap-1.5 select-none">
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
                                                    ? 'bg-[#2170e4] text-white shadow-sm font-black'
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
                </>
            )}

            {/* Modal ADD PRODUCT */}
            {isAddModalOpen && (
                <>
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs" onClick={() => setIsAddModalOpen(false)} />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                        <form
                            onSubmit={handleAddSubmit}
                            className="bg-white rounded-xl border border-zinc-200 w-full max-w-md shadow-2xl overflow-hidden font-sans text-xs pointer-events-auto flex flex-col max-h-[90vh]"
                        >
                            <div className="px-5 py-4 bg-[#0f172a] text-white flex justify-between items-center select-none border-b border-slate-800">
                                <div className="flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-blue-400" />
                                    <h3 className="font-extrabold text-sm tracking-tight">Kreator nowego produktu handlowego</h3>
                                </div>
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="text-zinc-400 hover:text-white cursor-pointer font-bold text-lg bg-transparent border-none">×</button>
                            </div>

                            <div className="p-5 space-y-4 overflow-y-auto">
                                {errorMessage && (
                                    <div className="p-3 bg-red-50 border border-red-200 text-red-750 font-bold rounded-lg leading-snug">
                                        ⚠️ {errorMessage}
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-zinc-650 uppercase tracking-widest mb-1.5">Kod SKU *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formSku}
                                            onChange={(e) => setFormSku(e.target.value.toUpperCase())}
                                            className="w-full p-2 border border-zinc-300 rounded outline-none focus:ring-1 focus:ring-blue-500 text-zinc-955 font-mono text-[11px] bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-zinc-655 uppercase tracking-widest mb-1.5">Kod Kreskowy (Barcode)</label>
                                        <input
                                            type="text"
                                            value={formBarcode}
                                            onChange={(e) => setFormBarcode(e.target.value)}
                                            placeholder={formSku}
                                            className="w-full p-2 border border-zinc-300 rounded outline-none focus:ring-1 focus:ring-blue-500 text-zinc-955 font-mono text-[11px] bg-white"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-650 uppercase tracking-widest mb-1.5">Nazwa produktu *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="np. Przemysłowy Skaner Kodów Kreskowych T700"
                                        value={formName}
                                        onChange={(e) => setFormName(e.target.value)}
                                        className="w-full p-2 border border-zinc-300 rounded outline-none focus:ring-1 focus:ring-blue-500 text-zinc-950 bg-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-650 uppercase tracking-widest mb-1.5">Kategoria *</label>
                                    <select
                                        value={formCategory}
                                        onChange={(e) => setFormCategory(e.target.value)}
                                        className="w-full p-2 border border-zinc-300 rounded outline-none focus:ring-1 focus:ring-blue-550 text-zinc-950 bg-white cursor-pointer"
                                    >
                                        <option value="Elektronika">Elektronika</option>
                                        <option value="Narzędzia">Narzędzia</option>
                                        <option value="Odzież BHP">Odzież BHP</option>
                                        <option value="Opakowania">Opakowania</option>
                                        <option value="Zywnosc">Żywność</option>
                                        <option value="BHP">BHP</option>
                                        <option value="Chemia">Chemia</option>
                                        <option value="Biuro">Biuro</option>
                                        <option value="Motoryzacja">Motoryzacja</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-zinc-650 uppercase tracking-widest mb-1.5">Cena (PLN) *</label>
                                        <div className="relative">
                                            <CreditCard className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                required
                                                value={formPrice}
                                                onChange={(e) => setFormPrice(parseFloat(e.target.value) || 0)}
                                                className="w-full pl-8 pr-2 py-2 border border-zinc-300 rounded outline-none focus:ring-1 focus:ring-blue-500 text-zinc-950 bg-white font-mono"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold text-zinc-650 uppercase tracking-widest mb-1.5">Waga (kg) *</label>
                                        <div className="relative">
                                            <Scale className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0.01"
                                                required
                                                value={formWeight}
                                                onChange={(e) => setFormWeight(parseFloat(e.target.value) || 0.1)}
                                                className="w-full pl-8 pr-2 py-2 border border-zinc-300 rounded outline-none focus:ring-1 focus:ring-blue-500 text-zinc-950 bg-white font-mono"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-zinc-650 uppercase tracking-widest mb-1.5">Wymiary (Dł x Szer x Wys)</label>
                                        <input
                                            type="text"
                                            value={formDimensions}
                                            onChange={(e) => setFormDimensions(e.target.value)}
                                            placeholder="np. 20 x 20 x 20 cm"
                                            className="w-full p-2 border border-zinc-300 rounded outline-none focus:ring-1 focus:ring-blue-500 text-zinc-950 bg-white font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-zinc-650 uppercase tracking-widest mb-1.5">Próg ostrzeżenia *</label>
                                        <input
                                            type="number"
                                            min="0"
                                            required
                                            value={formReorderThreshold}
                                            onChange={(e) => setFormReorderThreshold(parseInt(e.target.value) || 20)}
                                            className="w-full p-2 border border-zinc-300 rounded outline-none focus:ring-1 focus:ring-blue-500 text-zinc-950 bg-white font-mono"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="px-5 py-3.5 bg-slate-50 border-t border-zinc-200 flex justify-end gap-3 select-none">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="px-4 py-2 rounded border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 font-bold transition-colors cursor-pointer"
                                >
                                    Anuluj
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 rounded bg-[#2170e4] hover:bg-blue-700 text-white font-bold transition-colors disabled:opacity-40 cursor-pointer border-none"
                                >
                                    {isSubmitting ? 'Dodawanie...' : 'Utwórz produkt'}
                                </button>
                            </div>
                        </form>
                    </div>
                </>
            )}

            {/* Modal EDIT PRODUCT */}
            {isEditModalOpen && selectedProduct && (
                <>
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs" onClick={() => setIsEditModalOpen(false)} />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                        <form
                            onSubmit={handleEditSubmit}
                            className="bg-white rounded-xl border border-zinc-200 w-full max-w-md shadow-2xl overflow-hidden font-sans text-xs pointer-events-auto flex flex-col max-h-[90vh]"
                        >
                            <div className="px-5 py-4 bg-[#0f172a] text-white flex justify-between items-center select-none border-b border-slate-800">
                                <div className="flex items-center gap-2">
                                    <Edit className="w-4 h-4 text-blue-400" />
                                    <h3 className="font-extrabold text-sm tracking-tight">Modyfikacja danych produktu: {selectedProduct.sku}</h3>
                                </div>
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="text-zinc-400 hover:text-white cursor-pointer font-bold text-lg bg-transparent border-none">×</button>
                            </div>

                            <div className="p-5 space-y-4 overflow-y-auto">
                                {errorMessage && (
                                    <div className="p-3 bg-red-50 border border-red-200 text-red-750 font-bold rounded-lg leading-snug">
                                        ⚠️ {errorMessage}
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-zinc-650 uppercase tracking-widest mb-1.5">Kod SKU *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formSku}
                                            onChange={(e) => setFormSku(e.target.value.toUpperCase())}
                                            className="w-full p-2 border border-zinc-300 rounded outline-none focus:ring-1 focus:ring-blue-500 text-zinc-950 font-mono text-[11px] bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-zinc-650 uppercase tracking-widest mb-1.5">Kod Kreskowy (Barcode)</label>
                                        <input
                                            type="text"
                                            value={formBarcode}
                                            onChange={(e) => setFormBarcode(e.target.value)}
                                            className="w-full p-2 border border-zinc-300 rounded outline-none focus:ring-1 focus:ring-blue-500 text-zinc-950 font-mono text-[11px] bg-white"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-650 uppercase tracking-widest mb-1.5">Nazwa produktu *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formName}
                                        onChange={(e) => setFormName(e.target.value)}
                                        className="w-full p-2 border border-zinc-350 rounded outline-none focus:ring-1 focus:ring-blue-500 text-zinc-955 bg-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-655 uppercase tracking-widest mb-1.5">Kategoria *</label>
                                    <select
                                        value={formCategory}
                                        onChange={(e) => setFormCategory(e.target.value)}
                                        className="w-full p-2 border border-zinc-300 rounded outline-none focus:ring-1 focus:ring-blue-500 text-zinc-955 bg-white cursor-pointer"
                                    >
                                        <option value="Elektronika">Elektronika</option>
                                        <option value="Narzędzia">Narzędzia</option>
                                        <option value="Odzież BHP">Odzież BHP</option>
                                        <option value="Opakowania">Opakowania</option>
                                        <option value="Zywnosc">Żywność</option>
                                        <option value="BHP">BHP</option>
                                        <option value="Chemia">Chemia</option>
                                        <option value="Biuro">Biuro</option>
                                        <option value="Motoryzacja">Motoryzacja</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-zinc-650 uppercase tracking-widest mb-1.5">Cena (PLN) *</label>
                                        <div className="relative">
                                            <CreditCard className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                required
                                                value={formPrice}
                                                onChange={(e) => setFormPrice(parseFloat(e.target.value) || 0)}
                                                className="w-full pl-8 pr-2 py-2 border border-zinc-300 rounded outline-none focus:ring-1 focus:ring-blue-500 text-zinc-950 bg-white font-mono"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold text-zinc-650 uppercase tracking-widest mb-1.5">Waga (kg) *</label>
                                        <div className="relative">
                                            <Scale className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0.01"
                                                required
                                                value={formWeight}
                                                onChange={(e) => setFormWeight(parseFloat(e.target.value) || 0.15)}
                                                className="w-full pl-8 pr-2 py-2 border border-zinc-300 rounded outline-none focus:ring-1 focus:ring-blue-500 text-zinc-950 bg-white font-mono"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-zinc-650 uppercase tracking-widest mb-1.5">Wymiary (Dł x Szer x Wys)</label>
                                        <input
                                            type="text"
                                            value={formDimensions}
                                            onChange={(e) => setFormDimensions(e.target.value)}
                                            placeholder="np. 20 x 20 x 20 cm"
                                            className="w-full p-2 border border-zinc-300 rounded outline-none focus:ring-1 focus:ring-blue-500 text-zinc-955 bg-white font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-zinc-655 uppercase tracking-widest mb-1.5">Próg ostrzeżenia *</label>
                                        <input
                                            type="number"
                                            min="0"
                                            required
                                            value={formReorderThreshold}
                                            onChange={(e) => setFormReorderThreshold(parseInt(e.target.value) || 20)}
                                            className="w-full p-2 border border-zinc-300 rounded outline-none focus:ring-1 focus:ring-blue-500 text-zinc-950 bg-white font-mono"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="px-5 py-3.5 bg-slate-50 border-t border-zinc-200 flex justify-end gap-3 select-none">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-4 py-2 rounded border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 font-bold transition-colors cursor-pointer"
                                >
                                    Anuluj
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 rounded bg-[#2170e4] hover:bg-blue-700 text-white font-bold transition-colors disabled:opacity-40 cursor-pointer border-none"
                                >
                                    {isSubmitting ? 'Zapisywanie...' : 'Zapisz zmiany'}
                                </button>
                            </div>
                        </form>
                    </div>
                </>
            )}
        </div>
    );
}
