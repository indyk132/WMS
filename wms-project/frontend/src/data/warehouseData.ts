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
