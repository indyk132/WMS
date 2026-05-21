const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const DEFAULT_REORDER_THRESHOLD = 20;

const resolveStatus = (quantity, threshold = DEFAULT_REORDER_THRESHOLD) => {
    if (quantity <= 0) return 'Out of Stock';
    if (quantity < threshold) return 'Low Stock';
    return 'In Stock';
};

const resolveZone = (locationCode) => {
    if (!locationCode) return 'UNASSIGNED';

    const match = String(locationCode).match(/^([A-Z]+)-0?(\d+)/i);
    if (!match) return String(locationCode);

    return `${match[1].toUpperCase()}${Number(match[2])}`;
};

const toNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeInventoryRows = (rows) => {
    const productsById = new Map();

    rows.forEach((row) => {
        const productId = row.products_id ?? row.product_id ?? row.id ?? row.barcode ?? row.product_name;
        const key = String(productId);
        const quantity = toNumber(row.quantity ?? row.stock);
        const existing = productsById.get(key);
        const locationCode = row.location_code || row.zone || 'UNASSIGNED';
        const locationId = row.location_id || null;
        const stockId = row.id || null;

        if (existing) {
            existing.stock += quantity;
            existing.locations.push(locationCode);
            existing.stockEntries.push({ stockId, locationId, locationCode, quantity });
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
            primaryLocationId: locationId,
            status: resolveStatus(stock, reorderThreshold),
            price: toNumber(row.price),
            locations: [locationCode],
            stockEntries: [{ stockId, locationId, locationCode, quantity }],
        });
    });

    return Array.from(productsById.values()).sort((a, b) => a.name.localeCompare(b.name));
};

export const fetchInventoryProducts = async () => {
    const response = await fetch(`${API_BASE_URL}/api/inventory`);

    if (!response.ok) {
        throw new Error(`Inventory API returned ${response.status}`);
    }

    const payload = await response.json();
    const rows = Array.isArray(payload) ? payload : payload.data || [];

    return normalizeInventoryRows(rows);
};

export const adjustInventoryStock = async ({ productId, sku, delta, locationId }) => {
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
