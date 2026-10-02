export const INITIAL_PRODUCTS = [
    { sku: 'SKU-10492', name: 'Płyn hamulcowy DOT-4', category: 'Artykuły chemiczne', stock: 120, reorderThreshold: 100, zone: 'C3', status: 'In Stock', price: 34.99, stockEntries: [{ locationCode: 'C-03-01-01', quantity: 50 }, { locationCode: 'C-03-02-02', quantity: 70 }] },
    { sku: 'SKU-20391', name: 'Reflektor LED H7 SuperVolt', category: 'Części samochodowe', stock: 15, reorderThreshold: 40, zone: 'A1', status: 'Low Stock', price: 289.00, stockEntries: [{ locationCode: 'A-01-01-02', quantity: 15 }] },
    { sku: 'SKU-94021', name: 'Akumulator VoltPro 74Ah 12V', category: 'Części samochodowe', stock: 0, reorderThreshold: 15, zone: 'A2', status: 'Out of Stock', price: 449.99, stockEntries: [] },
    { sku: 'SKU-50493', name: 'Olej silnikowy Syntetic 5W30', category: 'Artykuły chemiczne', stock: 8, reorderThreshold: 20, zone: 'C2', status: 'Low Stock', price: 179.99, stockEntries: [{ locationCode: 'C-02-03-01', quantity: 8 }] },
    { sku: 'SKU-73012', name: 'Klocki hamulcowe CarbonPremium', category: 'Części samochodowe', stock: 245, reorderThreshold: 80, zone: 'A3', status: 'In Stock', price: 134.99, stockEntries: [{ locationCode: 'A-03-01-01', quantity: 120 }, { locationCode: 'A-03-02-04', quantity: 125 }] },
    { sku: 'SKU-39402', name: 'Prostownik mikroprocesorowy 12V', category: 'Elektronika', stock: 85, reorderThreshold: 15, zone: 'B2', status: 'In Stock', price: 249.00, stockEntries: [{ locationCode: 'B-02-01-03', quantity: 45 }, { locationCode: 'B-02-03-02', quantity: 40 }] }
];

export const WORKERS = {
    pickers: [
        { id: 'EMP-1102', name: 'Jan Kowalski', shift: 'Zmiana A - Poranna', password: 'picker' },
        { id: 'EMP-9104', name: 'Wojtek Nowak', shift: 'Zmiana A - Poranna', password: 'manager' }
    ],
    packers: [
        { id: 'EMP-9921', name: 'Mariusz Pakosz', shift: 'Zmiana B - Popołudniowa', password: 'packer' },
        { id: 'EMP-8492', name: 'System Admin', shift: 'Zmiana B - Popołudniowa', password: 'admin' }
    ]
};

export const defaultImages: Record<string, string> = {
    'SKU-10492': 'https://images.unsplash.com/photo-1506015391300-4802dc74de2e?w=400&q=80', // Płyn hamulcowy DOT-4 (Brakes/Mechanic)
    'SKU-20391': 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=400&q=80', // Reflektor LED H7 SuperVolt (Headlight close up)
    'SKU-94021': 'https://images.unsplash.com/photo-1615906655593-ad0386982a0f?w=400&q=80', // Akumulator VoltPro 74Ah 12V (Car battery mechanic)
    'SKU-50493': 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=400&q=80', // Olej silnikowy Syntetic 5W30 (Engine bay)
    'SKU-73012': 'https://images.unsplash.com/photo-1616422285623-13ff0162193c?w=400&q=80', // Klocki hamulcowe CarbonPremium (Brake rotor)
    'SKU-39402': 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&q=80', // Prostownik mikroprocesorowy 12V (Electronics bench)
    'FOOD-KAWA-001': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&q=80', // Kawa ziarnista Arabica 1kg (Coffee beans)
    'AUTO-KLOCKI-001': 'https://images.unsplash.com/photo-1616422285623-13ff0162193c?w=400&q=80', // Klocki hamulcowe przednie (Brake rotor)
    'AUTO-AKU-001': 'https://images.unsplash.com/photo-1615906655593-ad0386982a0f?w=400&q=80', // Akumulator 74Ah 12V (Car battery mechanic)
    'ELEC-SKAN-001': 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&q=80', // Skaner kodów kreskowych USB (Scanner scanning box)
    'ELEC-BAT-001': 'https://images.unsplash.com/photo-1608564697071-ddf911d81370?w=400&q=80', // Bateria do skanera 2600mAh (AA batteries)
    'BIUR-PAP-001': 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=400&q=80', // Papier A4 500 arkuszy (Stack of paper)
    'BIUR-ETY-001': 'https://images.unsplash.com/photo-1607082350899-7e105aa886ae?w=400&q=80', // Etykiety logistyczne 100x150 (Label boxes)
    'CHEM-REK-001': 'https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?w=400&q=80', // Rękawice nitrylowe 100 szt (Nitrile gloves)
    'CHEM-PLY-001': 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&q=80' // Płyn do dezynfekcji 5L (Disinfectant spray)
};

// ----------------------------------------------------
// RMA (REVERSE LOGISTICS) INTERFACES & INITIAL DATA
// ----------------------------------------------------
export type ConditionGrade = 'GRADE_A' | 'GRADE_B' | 'GRADE_C';

export interface RmaItem {
    sku: string;
    name: string;
    quantity: number;
    price: number;
    conditionGrade: ConditionGrade; // A: Resalable, B: Outlet, C: Damaged/Scrap
    reason: string;
    inspectionNote?: string;
    targetLocation?: string;
}

export interface RmaReturn {
    id: string; // np. RMA-89211
    originalOrderId: string; // np. ORD-89498
    customerName: string;
    returnTrackingNumber: string; // np. DPD-RET-98124
    carrier: string;
    createdAt: string;
    status: 'Oczekuje na przyjęcie' | 'W trakcie inspekcji' | 'Zatwierdzony (Na stan)' | 'Odrzucony';
    items: RmaItem[];
    totalRefundPln: number;
    resolution: 'Zwrot na stan (Resale)' | 'Przecena outletowa' | 'Utylizacja RW' | 'Odrzucenie reklamacji';
    assignedRmaSlot?: string;
    inspectedBy?: string;
    inspectedAt?: string;
}

export const INITIAL_RMA_RETURNS: RmaReturn[] = [
    {
        id: 'RMA-89201',
        originalOrderId: 'ORD-89498',
        customerName: 'Hurtownia Części Auto Sp. z o.o.',
        returnTrackingNumber: 'DPD-RET-9812401',
        carrier: 'DPD Standard',
        createdAt: '22 Wrz, 14:15',
        status: 'Oczekuje na przyjęcie',
        totalRefundPln: 269.98,
        resolution: 'Zwrot na stan (Resale)',
        assignedRmaSlot: 'RMA-01-01',
        items: [
            {
                sku: 'SKU-73012',
                name: 'Klocki hamulcowe CarbonPremium',
                quantity: 2,
                price: 134.99,
                conditionGrade: 'GRADE_A',
                reason: 'Nietrafiony dobór modelu pojazdu przez klienta',
                inspectionNote: 'Opakowanie fabryczne nienaruszone, plomba zachowana.',
                targetLocation: 'A-03-01-01'
            }
        ]
    },
    {
        id: 'RMA-89202',
        originalOrderId: 'ORD-89480',
        customerName: 'ElectroWorld S.A.',
        returnTrackingNumber: 'INPOST-RET-771290',
        carrier: 'InPost Paczkomat',
        createdAt: '21 Wrz, 11:30',
        status: 'W trakcie inspekcji',
        totalRefundPln: 249.00,
        resolution: 'Przecena outletowa',
        assignedRmaSlot: 'RMA-01-02',
        inspectedBy: 'Jan Kowalski (EMP-1102)',
        items: [
            {
                sku: 'SKU-39402',
                name: 'Prostownik mikroprocesorowy 12V',
                quantity: 1,
                price: 249.00,
                conditionGrade: 'GRADE_B',
                reason: 'Uszkodzenie kartonu zewnętrznego w transporcie',
                inspectionNote: 'Sprawny technicznie, pognieciony karton – zakwalifikowano do outletu -20%.',
                targetLocation: 'B-02-01-03'
            }
        ]
    },
    {
        id: 'RMA-89203',
        originalOrderId: 'ORD-89455',
        customerName: 'TechNova Dist. Sp. k.',
        returnTrackingNumber: 'DHL-RET-441029',
        carrier: 'DHL Express',
        createdAt: '20 Wrz, 09:40',
        status: 'Zatwierdzony (Na stan)',
        totalRefundPln: 578.00,
        resolution: 'Zwrot na stan (Resale)',
        assignedRmaSlot: 'RMA-01-03',
        inspectedBy: 'Mariusz Pakosz (EMP-9921)',
        inspectedAt: '20 Wrz, 15:20',
        items: [
            {
                sku: 'SKU-20391',
                name: 'Reflektor LED H7 SuperVolt',
                quantity: 2,
                price: 289.00,
                conditionGrade: 'GRADE_A',
                reason: 'Odstąpienie od umowy w terminie 14 dni',
                inspectionNote: 'Produkt fabrycznie nowy, sprawdzony testerem.',
                targetLocation: 'A-01-01-02'
            }
        ]
    },
    {
        id: 'RMA-89204',
        originalOrderId: 'ORD-89410',
        customerName: 'Logistyka Polska S.A.',
        returnTrackingNumber: 'DPD-RET-992384',
        carrier: 'DPD Standard',
        createdAt: '19 Wrz, 16:00',
        status: 'Zatwierdzony (Na stan)',
        totalRefundPln: 179.99,
        resolution: 'Utylizacja RW',
        assignedRmaSlot: 'RMA-01-04',
        inspectedBy: 'Wojtek Nowak (EMP-9104)',
        inspectedAt: '19 Wrz, 17:30',
        items: [
            {
                sku: 'SKU-50493',
                name: 'Olej silnikowy Syntetic 5W30',
                quantity: 1,
                price: 179.99,
                conditionGrade: 'GRADE_C',
                reason: 'Rozszczelnienie kanistra podczas transportu kurierskiego',
                inspectionNote: 'Wyciek płynu w paczce. Protokół szkody sporządzony z kurierem DPD.',
                targetLocation: 'UTYLIZACJA-RW'
            }
        ]
    }
];

// ----------------------------------------------------
// BATCH, LOT & EXPOSURE (FEFO/FIFO) LOGISTICS
// ----------------------------------------------------
export interface ProductBatch {
    id: string;
    sku: string;
    lotNumber: string;
    expiryDate: string; // YYYY-MM-DD
    manufactureDate: string;
    quantity: number;
    locationCode: string;
    status: 'AVAILABLE' | 'EXPIRING_SOON' | 'QUARANTINE';
}

export const INITIAL_PRODUCT_BATCHES: ProductBatch[] = [
    {
        id: 'BAT-101',
        sku: 'SKU-001',
        lotNumber: 'LOT-2026-0814A',
        manufactureDate: '2026-01-15',
        expiryDate: '2026-11-15',
        quantity: 34,
        locationCode: 'A-01-01',
        status: 'EXPIRING_SOON'
    },
    {
        id: 'BAT-102',
        sku: 'SKU-001',
        lotNumber: 'LOT-2026-0902B',
        manufactureDate: '2026-03-10',
        expiryDate: '2027-03-10',
        quantity: 50,
        locationCode: 'A-01-02',
        status: 'AVAILABLE'
    },
    {
        id: 'BAT-103',
        sku: 'SKU-004',
        lotNumber: 'LOT-2026-0740X',
        manufactureDate: '2025-10-01',
        expiryDate: '2026-10-25',
        quantity: 12,
        locationCode: 'A-01-04',
        status: 'EXPIRING_SOON'
    },
    {
        id: 'BAT-104',
        sku: 'SKU-50493',
        lotNumber: 'LOT-2026-0419C',
        manufactureDate: '2026-02-01',
        expiryDate: '2028-02-01',
        quantity: 45,
        locationCode: 'C-01-01',
        status: 'AVAILABLE'
    },
    {
        id: 'BAT-105',
        sku: 'SKU-002',
        lotNumber: 'LOT-2026-0511Q',
        manufactureDate: '2025-06-15',
        expiryDate: '2026-10-18',
        quantity: 8,
        locationCode: 'B-01-02',
        status: 'QUARANTINE'
    }
];
