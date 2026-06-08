const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const DEFAULT_REORDER_THRESHOLD = 20;

export interface StockEntry {
    stockId: number | null;
    locationId: number | null;
    locationCode: string;
    zoneGroup: string;
    quantity: number;
}

export interface Product {
    productId: any;
    sku: string;
    barcode: string;
    name: string;
    category: string;
    stock: number;
    reorderThreshold: number;
    zone: string;
    locationCode: string;
    zoneGroup: string;
    primaryLocationId: number | null;
    status: 'In Stock' | 'Low Stock' | 'Out of Stock';
    price: number;
    locations: string[];
    stockEntries: StockEntry[];
    zoneGroups: string[];
}

const resolveStatus = (quantity: number, threshold: number = DEFAULT_REORDER_THRESHOLD): 'In Stock' | 'Low Stock' | 'Out of Stock' => {
    if (quantity <= 0) return 'Out of Stock';
    if (quantity < threshold) return 'Low Stock';
    return 'In Stock';
};

const resolveZone = (locationCode: string): string => {
    if (!locationCode) return 'UNASSIGNED';

    const match = String(locationCode).match(/^([A-Z]+)-0?(\d+)/i);
    if (!match) return String(locationCode);

    return `${match[1].toUpperCase()}${Number(match[2])}`;
};

const toNumber = (value: any, fallback = 0): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeInventoryRows = (rows: any[]): Product[] => {
    const productsById = new Map<string, Product>();

    rows.forEach((row) => {
        const productId = row.products_id ?? row.product_id ?? row.id ?? row.barcode ?? row.product_name;
        const key = String(productId);
        const quantity = toNumber(row.quantity ?? row.stock);
        const existing = productsById.get(key);
        const locationCode = row.location_code || row.zone || 'UNASSIGNED';
        const zoneGroup = row.zone_group || 'General';
        const locationId = row.location_id || null;
        const stockId = row.id || null;

        if (existing) {
            existing.stock += quantity;
            existing.locations.push(locationCode);
            existing.stockEntries.push({ stockId, locationId, locationCode, zoneGroup, quantity });
            if (!existing.zoneGroups.includes(zoneGroup)) {
                existing.zoneGroups.push(zoneGroup);
            }
            existing.status = resolveStatus(existing.stock, existing.reorderThreshold);
            return;
        }

        const reorderThreshold = toNumber(row.reorder_threshold ?? row.reorderThreshold, DEFAULT_REORDER_THRESHOLD);
        const stock = quantity;

        productsById.set(key, {
            productId: row.products_id ?? row.product_id ?? productId,
            sku: row.sku || row.barcode || `PROD-${productId}`,
            barcode: row.barcode || '',
            name: row.product_name || row.name || 'Unnamed product',
            category: row.category || 'Towar magazynowy',
            stock,
            reorderThreshold,
            zone: resolveZone(locationCode),
            locationCode,
            zoneGroup,
            primaryLocationId: locationId,
            status: resolveStatus(stock, reorderThreshold),
            price: toNumber(row.price),
            locations: [locationCode],
            stockEntries: [{ stockId, locationId, locationCode, zoneGroup, quantity }],
            zoneGroups: [zoneGroup],
        });
    });

    return Array.from(productsById.values()).sort((a, b) => a.name.localeCompare(b.name));
};

export const fetchInventoryProducts = async (): Promise<Product[]> => {
    const response = await fetch(`${API_BASE_URL}/api/inventory`);

    if (!response.ok) {
        throw new Error(`Inventory API returned ${response.status}`);
    }

    const payload = await response.json();
    const rows = Array.isArray(payload) ? payload : payload.data || [];

    return normalizeInventoryRows(rows);
};

export const adjustInventoryStock = async ({ productId, sku, delta, locationId }: { productId: any; sku: string; delta: number; locationId?: number | null }) => {
    const response = await fetch(`${API_BASE_URL}/api/inventory/adjust`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            productId,
            sku,
            delta,
            location_id: locationId || undefined,
        }),
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(payload?.error || `Inventory adjust returned ${response.status}`);
    }

    return payload;
};

export const createInventoryProduct = async (product: { sku: string; name: string; category: string; price: number; reorderThreshold: number; barcode?: string }) => {
    const response = await fetch(`${API_BASE_URL}/api/products`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(product),
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(payload?.error || `Failed to create product: ${response.status}`);
    }

    return payload;
};

export const updateInventoryProduct = async (productId: any, product: Partial<Product>) => {
    const response = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(product),
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(payload?.error || `Failed to update product: ${response.status}`);
    }

    return payload;
};

export const deleteInventoryProduct = async (productId: any) => {
    const response = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
        method: 'DELETE',
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(payload?.error || `Failed to delete product: ${response.status}`);
    }

    return payload;
};
