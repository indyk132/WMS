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

const CATEGORY_PREFIXES = {
    'Części samochodowe': 'AUTO-PARTS',
    'Chemia samochodowa': 'AUTO-CHEM',
    'Elektronika': 'ELEC-GEN',
    'Artykuły spożywcze': 'FOOD-GROC',
    'Biuro': 'BIUR-OFF',
    'BHP': 'BHP-SAFE'
};

const PRODUCT_TEMPLATES = {
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

const ZONES = {
    'Części samochodowe': 'C-01-01',
    'Chemia samochodowa': 'C-01-02',
    'Elektronika': 'B-02-01',
    'Artykuły spożywcze': 'A-01-01',
    'Biuro': 'B-02-02',
    'BHP': 'C-01-01'
};

const ZONE_GROUPS = {
    'Części samochodowe': 'Motoryzacja, chemia i BHP',
    'Chemia samochodowa': 'Motoryzacja, chemia i BHP',
    'Elektronika': 'Elektronika i biuro',
    'Artykuły spożywcze': 'Zywnosc',
    'Biuro': 'Elektronika i biuro',
    'BHP': 'Motoryzacja, chemia i BHP'
};

const GROUP_RULES = {
    'Artykuły spożywcze': { group: 'Zywnosc', fallbackLocation: 'A-01-01' },
    'Elektronika': { group: 'Elektronika i biuro', fallbackLocation: 'B-01-01' },
    'Biuro': { group: 'Elektronika i biuro', fallbackLocation: 'B-01-02' },
    'Części samochodowe': { group: 'Motoryzacja, chemia i BHP', fallbackLocation: 'C-01-01' },
    'Chemia samochodowa': { group: 'Motoryzacja, chemia i BHP', fallbackLocation: 'C-01-02' },
    'BHP': { group: 'Motoryzacja, chemia i BHP', fallbackLocation: 'C-01-01' },
};

const ensureLocationExists = async (client, code, group) => {
    await client.query(`
        INSERT INTO ${table('warehouse_locations')} (location_code, zone_group)
        VALUES ($1, $2)
        ON CONFLICT (location_code) DO NOTHING
    `, [code, group]);

    const res = await client.query(`
        SELECT location_id FROM ${table('warehouse_locations')} WHERE location_code = $1
    `, [code]);
    return res.rows[0].location_id;
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

        const targetLocationId = await ensureLocationExists(pool, rule.fallbackLocation, rule.group);

        if (targetLocationId === stock.location_id) {
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

    // Alter orders table to support extra storefront/WMS fields
    await pool.query(`ALTER TABLE ${table('orders')} ADD COLUMN IF NOT EXISTS customer VARCHAR(150)`);
    await pool.query(`ALTER TABLE ${table('orders')} ADD COLUMN IF NOT EXISTS destination VARCHAR(150)`);
    await pool.query(`ALTER TABLE ${table('orders')} ADD COLUMN IF NOT EXISTS priority VARCHAR(30) DEFAULT 'Normalny'`);
    await pool.query(`ALTER TABLE ${table('orders')} ADD COLUMN IF NOT EXISTS warehouse_code VARCHAR(50) DEFAULT 'HUB-PL-01'`);
    await pool.query(`ALTER TABLE ${table('orders')} ADD COLUMN IF NOT EXISTS internal_notes_actor VARCHAR(100) DEFAULT 'System'`);
    await pool.query(`ALTER TABLE ${table('orders')} ADD COLUMN IF NOT EXISTS is_packed BOOLEAN DEFAULT FALSE`);
    await pool.query(`ALTER TABLE ${table('orders')} ADD COLUMN IF NOT EXISTS bin_id VARCHAR(50)`);
    await pool.query(`ALTER TABLE ${table('orders')} ADD COLUMN IF NOT EXISTS picked_by VARCHAR(100)`);
    await pool.query(`ALTER TABLE ${table('orders')} ADD COLUMN IF NOT EXISTS pick_completed_time VARCHAR(30)`);
    await pool.query(`ALTER TABLE ${table('orders')} ADD COLUMN IF NOT EXISTS shipment_date VARCHAR(50)`);
    await pool.query(`ALTER TABLE ${table('orders')} ADD COLUMN IF NOT EXISTS change_logs JSONB DEFAULT '[]'::jsonb`);
    await pool.query(`ALTER TABLE ${table('orders')} ADD COLUMN IF NOT EXISTS activity_history JSONB DEFAULT '[]'::jsonb`);

    // 1. Seed static warehouse locations first
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

    // 2. Seed the 6 base products matching WMS generator + 4 storefront products
    const baseProducts = [
        { sku: 'SKU-10492', name: 'Płyn hamulcowy DOT-4', category: 'Chemia samochodowa', stock: 120, reorderThreshold: 100, price: 34.99, locationCode: 'C-03-01-01', zoneGroup: 'General', barcode: '5900000001001' },
        { sku: 'SKU-20391', name: 'Reflektor LED H7 SuperVolt', category: 'Części samochodowe', stock: 15, reorderThreshold: 40, price: 289.00, locationCode: 'A-01-01-02', zoneGroup: 'General', barcode: '5900000001002' },
        { sku: 'SKU-94021', name: 'Akumulator VoltPro 74Ah 12V', category: 'Części samochodowe', stock: 0, reorderThreshold: 15, price: 449.99, locationCode: 'A-02-01-01', zoneGroup: 'General', barcode: '5900000001003' },
        { sku: 'SKU-50493', name: 'Olej silnikowy Syntetic 5W30', category: 'Chemia samochodowa', stock: 8, reorderThreshold: 20, price: 179.99, locationCode: 'C-02-03-01', zoneGroup: 'General', barcode: '5900000001004' },
        { sku: 'SKU-73012', name: 'Klocki hamulcowe CarbonPremium', category: 'Części samochodowe', stock: 245, reorderThreshold: 80, price: 134.99, locationCode: 'A-03-01-01', zoneGroup: 'General', barcode: '5900000001005' },
        { sku: 'SKU-39402', name: 'Prostownik mikroprocesorowy 12V', category: 'Elektronika', stock: 85, reorderThreshold: 15, price: 249.00, locationCode: 'B-02-01-03', zoneGroup: 'General', barcode: '5900000001006' },
        { sku: 'APX-ACC-W01', name: 'Luksusowy Zegarek Minimalistyczny', category: 'Akcesoria', stock: 14, reorderThreshold: 5, price: 899.00, locationCode: 'B-01-01', zoneGroup: 'Elektronika i biuro', barcode: '5900000002001' },
        { sku: 'APX-FURN-C12', name: 'Ergonomiczne Krzesło Aluminiowe', category: 'Dom i Wnętrze', stock: 8, reorderThreshold: 5, price: 1250.00, locationCode: 'B-01-02', zoneGroup: 'Elektronika i biuro', barcode: '5900000002002' },
        { sku: 'APX-AUD-H03', name: 'Słuchawki Audio Pro (ANC)', category: 'Sprzęt Audio', stock: 31, reorderThreshold: 10, price: 420.00, locationCode: 'B-02-01', zoneGroup: 'Elektronika i biuro', barcode: '5900000002003' },
        { sku: 'APX-ACC-O45', name: 'Ceramiczny Organizer na Biurko', category: 'Akcesoria', stock: 75, reorderThreshold: 20, price: 140.00, locationCode: 'B-02-02', zoneGroup: 'Elektronika i biuro', barcode: '5900000002004' }
    ];

    for (const prod of baseProducts) {
        const prodRes = await pool.query(`
            INSERT INTO ${table('products')} (sku, barcode, name, category, price, reorder_threshold)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (barcode)
            DO UPDATE SET
                sku = EXCLUDED.sku,
                name = EXCLUDED.name,
                category = EXCLUDED.category,
                price = EXCLUDED.price,
                reorder_threshold = EXCLUDED.reorder_threshold
            RETURNING products_id
        `, [prod.sku, prod.barcode, prod.name, prod.category, prod.price, prod.reorderThreshold]);

        const productId = prodRes.rows[0].products_id;
        const locationId = await ensureLocationExists(pool, prod.locationCode, prod.zoneGroup);

        await pool.query(`
            INSERT INTO ${table('storage_stock')} (products_id, location_id, quantity)
            VALUES ($1, $2, $3)
            ON CONFLICT (products_id, location_id)
            DO UPDATE SET quantity = EXCLUDED.quantity
        `, [productId, locationId, prod.stock]);
    }

    // 3. Seed the 200 dynamic products matching WMS generator
    const categories = Object.keys(PRODUCT_TEMPLATES);
    let barcodeCounter = 5900000000001;

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

        const prodRes = await pool.query(`
            INSERT INTO ${table('products')} (sku, barcode, name, category, price, reorder_threshold)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (barcode)
            DO UPDATE SET
                sku = EXCLUDED.sku,
                name = EXCLUDED.name,
                category = EXCLUDED.category,
                price = EXCLUDED.price,
                reorder_threshold = EXCLUDED.reorder_threshold
            RETURNING products_id
        `, [sku, barcode, name, category, price, reorderThreshold]);

        const productId = prodRes.rows[0].products_id;
        const locationId = await ensureLocationExists(pool, locationCode, zoneGroup);

        await pool.query(`
            INSERT INTO ${table('storage_stock')} (products_id, location_id, quantity)
            VALUES ($1, $2, $3)
            ON CONFLICT (products_id, location_id)
            DO UPDATE SET quantity = EXCLUDED.quantity
        `, [productId, locationId, stock]);
    }

    await reconcileProductLocations();
};

module.exports = {
    ensureCatalogSchema,
};
