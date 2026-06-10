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
