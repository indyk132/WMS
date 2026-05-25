const { pool, table } = require('../db');

const LOCATIONS = [
    { code: 'A-01-01', group: 'Zywnosc' },
    { code: 'A-01-02', group: 'Zywnosc' },
    { code: 'A-02-01', group: 'Zywnosc' },
    { code: 'A-02-02', group: 'Zywnosc' },
    { code: 'A-03-01', group: 'Zywnosc' },
    { code: 'B-01-01', group: 'Elektronika i biuro' },
    { code: 'B-01-02', group: 'Elektronika i biuro' },
    { code: 'B-02-01', group: 'Elektronika i biuro' },
    { code: 'B-02-02', group: 'Elektronika i biuro' },
    { code: 'C-01-01', group: 'Motoryzacja, chemia i BHP' },
    { code: 'C-01-02', group: 'Motoryzacja, chemia i BHP' },
    { code: 'C-02-01', group: 'Motoryzacja, chemia i BHP' },
    { code: 'RAMPA-PRZYJEC', group: 'Przyjecia mieszane' },
];

const PRODUCTS = [
    { sku: 'FOOD-KAWA-001', barcode: '5901234567890', name: 'Kawa ziarnista Arabica 1kg', category: 'Zywnosc', price: 59.99, reorderThreshold: 25, location: 'A-01-01', quantity: 35 },
    { sku: 'FOOD-MLEKO-001', barcode: '5909876543210', name: 'Mleko UHT 3.2% 1L', category: 'Zywnosc', price: 3.49, reorderThreshold: 80, location: 'A-01-01', quantity: 160 },
    { sku: 'FOOD-CZEK-001', barcode: '5905556667771', name: 'Czekolada gorzka 70% 100g', category: 'Zywnosc', price: 4.50, reorderThreshold: 60, location: 'A-01-02', quantity: 120 },
    { sku: 'FOOD-PLATKI-001', barcode: '5904443332220', name: 'Platki owsiane gorskie 500g', category: 'Zywnosc', price: 2.99, reorderThreshold: 70, location: 'A-02-01', quantity: 95 },
    { sku: 'FOOD-SOK-001', barcode: '5901112223334', name: 'Sok pomaranczowy 1L', category: 'Zywnosc', price: 5.20, reorderThreshold: 50, location: 'A-02-02', quantity: 75 },
    { sku: 'FOOD-RYZ-001', barcode: '5902000000011', name: 'Ryz basmati 1kg', category: 'Zywnosc', price: 8.99, reorderThreshold: 40, location: 'A-03-01', quantity: 68 },
    { sku: 'FOOD-MAK-001', barcode: '5902000000012', name: 'Makaron penne 500g', category: 'Zywnosc', price: 4.19, reorderThreshold: 45, location: 'A-03-01', quantity: 84 },
    { sku: 'FOOD-MAKA-001', barcode: '5902000000013', name: 'Maka pszenna typ 500 1kg', category: 'Zywnosc', price: 3.29, reorderThreshold: 55, location: 'A-02-01', quantity: 110 },

    { sku: 'ELEC-SKAN-001', barcode: '5903000000011', name: 'Skaner kodow kreskowych USB', category: 'Elektronika', price: 189.00, reorderThreshold: 8, location: 'B-01-01', quantity: 16 },
    { sku: 'ELEC-DRUK-001', barcode: '5903000000012', name: 'Drukarka etykiet termiczna', category: 'Elektronika', price: 499.00, reorderThreshold: 5, location: 'B-01-02', quantity: 9 },
    { sku: 'ELEC-TAB-001', barcode: '5903000000013', name: 'Tablet magazynowy 10 cali', category: 'Elektronika', price: 899.00, reorderThreshold: 6, location: 'B-02-01', quantity: 11 },
    { sku: 'ELEC-BAT-001', barcode: '5903000000014', name: 'Bateria do skanera 2600mAh', category: 'Elektronika', price: 79.00, reorderThreshold: 20, location: 'B-02-02', quantity: 34 },

    { sku: 'AUTO-OLEJ-001', barcode: '5904000000011', name: 'Olej silnikowy 5W30 4L', category: 'Motoryzacja', price: 179.99, reorderThreshold: 15, location: 'C-01-01', quantity: 22 },
    { sku: 'AUTO-HAM-001', barcode: '5904000000012', name: 'Plyn hamulcowy DOT-4 1L', category: 'Motoryzacja', price: 34.99, reorderThreshold: 25, location: 'C-01-02', quantity: 47 },
    { sku: 'AUTO-KLOCKI-001', barcode: '5904000000013', name: 'Klocki hamulcowe przednie', category: 'Motoryzacja', price: 134.99, reorderThreshold: 18, location: 'C-02-01', quantity: 31 },
    { sku: 'AUTO-AKU-001', barcode: '5904000000014', name: 'Akumulator 74Ah 12V', category: 'Motoryzacja', price: 449.99, reorderThreshold: 10, location: 'C-02-01', quantity: 14 },

    { sku: 'CHEM-REK-001', barcode: '5905000000011', name: 'Rekawice nitrylowe 100 szt', category: 'BHP', price: 24.99, reorderThreshold: 40, location: 'C-01-01', quantity: 72 },
    { sku: 'CHEM-PLY-001', barcode: '5905000000012', name: 'Plyn do dezynfekcji 5L', category: 'Chemia', price: 39.99, reorderThreshold: 25, location: 'C-01-02', quantity: 33 },
    { sku: 'BIUR-PAP-001', barcode: '5906000000011', name: 'Papier A4 500 arkuszy', category: 'Biuro', price: 21.99, reorderThreshold: 30, location: 'B-02-02', quantity: 58 },
    { sku: 'BIUR-ETY-001', barcode: '5906000000012', name: 'Etykiety logistyczne 100x150', category: 'Biuro', price: 49.99, reorderThreshold: 20, location: 'B-01-02', quantity: 27 },
];

const GROUP_RULES = {
    Zywnosc: { group: 'Zywnosc', fallbackLocation: 'A-01-01' },
    Elektronika: { group: 'Elektronika i biuro', fallbackLocation: 'B-01-01' },
    Biuro: { group: 'Elektronika i biuro', fallbackLocation: 'B-01-02' },
    Motoryzacja: { group: 'Motoryzacja, chemia i BHP', fallbackLocation: 'C-01-01' },
    Chemia: { group: 'Motoryzacja, chemia i BHP', fallbackLocation: 'C-01-02' },
    BHP: { group: 'Motoryzacja, chemia i BHP', fallbackLocation: 'C-01-01' },
};

const reconcileProductLocations = async () => {
    const { rows } = await pool.query(`
        SELECT
            s.id,
            s.products_id,
            s.quantity,
            p.category,
            wl.location_id,
            wl.zone_group
        FROM ${table('storage_stock')} s
        JOIN ${table('products')} p ON p.products_id = s.products_id
        JOIN ${table('warehouse_locations')} wl ON wl.location_id = s.location_id
        WHERE p.category IS NOT NULL
    `);

    for (const stock of rows) {
        const rule = GROUP_RULES[stock.category];

        if (!rule || stock.zone_group === rule.group || stock.zone_group === 'Przyjecia mieszane') {
            continue;
        }

        const targetLocationResult = await pool.query(`
            SELECT location_id
            FROM ${table('warehouse_locations')}
            WHERE location_code = $1
        `, [rule.fallbackLocation]);

        const targetLocationId = targetLocationResult.rows[0]?.location_id;

        if (!targetLocationId || targetLocationId === stock.location_id) {
            continue;
        }

        const targetStockResult = await pool.query(`
            SELECT id
            FROM ${table('storage_stock')}
            WHERE products_id = $1 AND location_id = $2
        `, [stock.products_id, targetLocationId]);

        if (targetStockResult.rows[0]) {
            await pool.query(`
                UPDATE ${table('storage_stock')}
                SET quantity = quantity + $1
                WHERE id = $2
            `, [stock.quantity, targetStockResult.rows[0].id]);
        } else {
            await pool.query(`
                INSERT INTO ${table('storage_stock')} (products_id, location_id, quantity)
                VALUES ($1, $2, $3)
            `, [stock.products_id, targetLocationId, stock.quantity]);
        }

        await pool.query(`
            DELETE FROM ${table('storage_stock')}
            WHERE id = $1
        `, [stock.id]);
    }
};

const ensureCatalogSchema = async () => {
    await pool.query(`ALTER TABLE ${table('products')} ADD COLUMN IF NOT EXISTS sku VARCHAR(50)`);
    await pool.query(`ALTER TABLE ${table('products')} ADD COLUMN IF NOT EXISTS category VARCHAR(80) DEFAULT 'General'`);
    await pool.query(`ALTER TABLE ${table('products')} ADD COLUMN IF NOT EXISTS reorder_threshold INT DEFAULT 20 CHECK (reorder_threshold >= 0)`);
    await pool.query(`ALTER TABLE ${table('warehouse_locations')} ADD COLUMN IF NOT EXISTS zone_group VARCHAR(80) DEFAULT 'General'`);
    await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS products_sku_unique_idx ON ${table('products')} (sku) WHERE sku IS NOT NULL`);

    for (const location of LOCATIONS) {
        await pool.query(`
            INSERT INTO ${table('warehouse_locations')} (location_code, zone_group)
            VALUES ($1, $2)
            ON CONFLICT (location_code) DO NOTHING
        `, [location.code, location.group]);

        await pool.query(`
            UPDATE ${table('warehouse_locations')}
            SET zone_group = $2
            WHERE location_code = $1
        `, [location.code, location.group]);
    }

    for (const product of PRODUCTS) {
        const productResult = await pool.query(`
            INSERT INTO ${table('products')} (sku, barcode, name, category, price, reorder_threshold)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (barcode)
            DO UPDATE SET
                sku = EXCLUDED.sku,
                barcode = EXCLUDED.barcode,
                name = EXCLUDED.name,
                category = EXCLUDED.category,
                price = EXCLUDED.price,
                reorder_threshold = EXCLUDED.reorder_threshold
            RETURNING products_id
        `, [
            product.sku,
            product.barcode,
            product.name,
            product.category,
            product.price,
            product.reorderThreshold,
        ]);

        const locationResult = await pool.query(`
            SELECT location_id
            FROM ${table('warehouse_locations')}
            WHERE location_code = $1
        `, [product.location]);

        await pool.query(`
            INSERT INTO ${table('storage_stock')} (products_id, location_id, quantity)
            VALUES ($1, $2, $3)
            ON CONFLICT (products_id, location_id)
            DO NOTHING
        `, [
            productResult.rows[0].products_id,
            locationResult.rows[0].location_id,
            product.quantity,
        ]);
    }

    await reconcileProductLocations();
};

module.exports = {
    ensureCatalogSchema,
};
