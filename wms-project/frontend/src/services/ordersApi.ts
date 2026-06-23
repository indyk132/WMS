const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export interface OrderItem {
    id?: number;
    products_id?: number;
    barcode?: string;
    product_name?: string;
    name: string;
    sku: string;
    price?: number;
    qty: number;
    order_quantity?: number;
    picked_quantity?: number;
    pickedLot?: string;
    expirationDate?: string;
}

export interface Order {
    id: string; // matches order_number
    order_id?: number;
    order_number?: string;
    status: string;
    order_date?: string;
    order_realisation?: string | null;
    internalNotes: string;
    customer: string;
    destination: string;
    priority: string;
    warehouseCode: string;
    internalNotesActor: string;
    isPacked: boolean;
    binId?: string;
    pickedBy?: string;
    pickCompletedTime?: string;
    shipmentDate: string;
    items: OrderItem[];
    waybillNumber?: string;
    waybillPdfDate?: string;
    pickingZones?: { name: string; percentage: number }[];
    activityHistory?: { id: string; title: string; actor: string; date: string }[];
    changeLogs?: any[];
}

const requestJson = async (path: string, options: RequestInit = {}) => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        },
        ...options,
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(payload?.error || `API returned ${response.status}`);
    }

    return payload;
};

export const fetchOrders = async (): Promise<Order[]> => {
    return requestJson('/api/orders');
};

export const createOrder = async (order: Partial<Order>): Promise<Order> => {
    return requestJson('/api/orders', {
        method: 'POST',
        body: JSON.stringify(order),
    });
};

export const updateOrder = async (id: string, updates: Partial<Order>): Promise<Order> => {
    return requestJson(`/api/orders/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
    });
};

export const deleteOrder = async (id: string): Promise<{ deleted: { order_id: number; order_number: string } }> => {
    return requestJson(`/api/orders/${encodeURIComponent(id)}`, {
        method: 'DELETE',
    });
};
