const { pool, table } = require('../db');
const { sendDbError, toInteger } = require('../utils/httpErrors');

const CATEGORY_ZONE_GROUPS = {
    Zywnosc: ['Zywnosc', 'Przyjecia mieszane'],
    'Artykuły spożywcze': ['Zywnosc', 'Przyjecia mieszane'],
    Elektronika: ['Elektronika i biuro', 'Przyjecia mieszane'],
    Biuro: ['Elektronika i biuro', 'Przyjecia mieszane'],
    Motoryzacja: ['Motoryzacja, chemia i BHP', 'Przyjecia mieszane'],
    'Części samochodowe': ['Motoryzacja, chemia i BHP', 'Przyjecia mieszane'],
    'Chemia samochodowa': ['Motoryzacja, chemia i BHP', 'Przyjecia mieszane'],
    Chemia: ['Motoryzacja, chemia i BHP', 'Przyjecia mieszane'],
    BHP: ['Motoryzacja, chemia i BHP', 'Przyjecia mieszane'],
};

const isCategoryAllowedInZoneGroup = (category, zoneGroup) => {
    const allowedGroups = CATEGORY_ZONE_GROUPS[category] || ['Przyjecia mieszane'];
    return allowedGroups.includes(zoneGroup);
};

const parseNonNegativeInteger = (value) => {
    const parsed = toInteger(value);
    return parsed !== null && parsed >= 0 ? parsed : null;
};

const parsePositiveInteger = (value) => {
    const parsed = toInteger(value);
    return parsed !== null && parsed > 0 ? parsed : null;
};

const stockSelect = () => `
    SELECT
        s.id,
        s.products_id,
        p.sku,
        p.name AS product_name,
        p.category,
        p.barcode,
        p.price,
        p.reorder_threshold,
        s.location_id,
        wl.location_code,
        wl.zone_group,
        s.quantity
    FROM ${table('storage_stock')} s
    JOIN ${table('products')} p ON p.products_id = s.products_id
    JOIN ${table('warehouse_locations')} wl ON wl.location_id = s.location_id
`;

const fetchStockById = async (client, stockId) => {
    const { rows } = await client.query(`
        ${stockSelect()}
        WHERE s.id = $1
    `, [stockId]);

    return rows[0] || null;
};

const listStock = async (req, res) => {
    try {
        const validation = await pool.query(`
            SELECT p.category, wl.zone_group
            FROM ${table('products')} p
            CROSS JOIN ${table('warehouse_locations')} wl
            WHERE p.products_id = $1 AND wl.location_id = $2
        `, [productsId, locationId]);

        const target = validation.rows[0];

        if (!target) {
            return res.status(404).json({ error: 'Produkt albo lokalizacja nie istnieje.' });
        }

        if (!isCategoryAllowedInZoneGroup(target.category, target.zone_group)) {
            return res.status(400).json({
                error: `Produkt z kategorii ${target.category} nie moze byc dodany do grupy ${target.zone_group}.`,
            });
        }

        const { rows } = await pool.query(`
            ${stockSelect()}
            ORDER BY wl.location_code, p.name
        `);

        res.json(rows);
    } catch (error) {
        sendDbError(res, error, 'Nie udalo sie pobrac stanow magazynowych.');
    }
};

const getStockById = async (req, res) => {
    try {
        const stock = await fetchStockById(pool, req.params.id);

        if (!stock) {
            return res.status(404).json({ error: 'Pozycja stanu nie istnieje.' });
        }

        res.json(stock);
    } catch (error) {
        sendDbError(res, error, 'Nie udalo sie pobrac pozycji stanu.');
    }
};

const setStock = async (req, res) => {
    const productsId = parsePositiveInteger(req.body.products_id);
    const locationId = parsePositiveInteger(req.body.location_id);
    const quantity = parseNonNegativeInteger(req.body.quantity);

    if (!productsId || !locationId || quantity === null) {
        return res.status(400).json({
            error: 'Wymagane sa products_id, location_id oraz nieujemne quantity.',
        });
    }

    try {
        const { rows } = await pool.query(`
            INSERT INTO ${table('storage_stock')} (products_id, location_id, quantity)
            VALUES ($1, $2, $3)
            ON CONFLICT (products_id, location_id)
            DO UPDATE SET quantity = EXCLUDED.quantity
            RETURNING id
        `, [productsId, locationId, quantity]);

        const stock = await fetchStockById(pool, rows[0].id);
        res.status(201).json(stock);
    } catch (error) {
        sendDbError(res, error, 'Nie udalo sie ustawic stanu magazynowego.');
    }
};

const updateStockQuantity = async (req, res) => {
    const quantity = parseNonNegativeInteger(req.body.quantity);

    if (quantity === null) {
        return res.status(400).json({ error: 'Pole quantity musi byc liczba nieujemna.' });
    }

    try {
        const { rows } = await pool.query(`
            UPDATE ${table('storage_stock')}
            SET quantity = $1
            WHERE id = $2
            RETURNING id
        `, [quantity, req.params.id]);

        if (!rows[0]) {
            return res.status(404).json({ error: 'Pozycja stanu nie istnieje.' });
        }

        const stock = await fetchStockById(pool, rows[0].id);
        res.json(stock);
    } catch (error) {
        sendDbError(res, error, 'Nie udalo sie zaktualizowac stanu.');
    }
};

const adjustStockQuantity = async (req, res) => {
    const delta = toInteger(req.body.delta);

    if (delta === null) {
        return res.status(400).json({ error: 'Pole delta musi byc liczba calkowita.' });
    }

    try {
        const { rows } = await pool.query(`
            UPDATE ${table('storage_stock')}
            SET quantity = quantity + $1
            WHERE id = $2 AND quantity + $1 >= 0
            RETURNING id
        `, [delta, req.params.id]);

        if (!rows[0]) {
            const exists = await pool.query(`
                SELECT id FROM ${table('storage_stock')}
                WHERE id = $1
            `, [req.params.id]);

            if (!exists.rows[0]) {
                return res.status(404).json({ error: 'Pozycja stanu nie istnieje.' });
            }

            return res.status(400).json({ error: 'Korekta spowodowalaby stan ujemny.' });
        }

        const stock = await fetchStockById(pool, rows[0].id);
        res.json(stock);
    } catch (error) {
        sendDbError(res, error, 'Nie udalo sie skorygowac stanu.');
    }
};

const transferStock = async (req, res) => {
    const productsId = parsePositiveInteger(req.body.products_id);
    const fromLocationId = parsePositiveInteger(req.body.from_location_id);
    const toLocationId = parsePositiveInteger(req.body.to_location_id);
    const quantity = parsePositiveInteger(req.body.quantity);

    if (!productsId || !fromLocationId || !toLocationId || !quantity) {
        return res.status(400).json({
            error: 'Wymagane sa products_id, from_location_id, to_location_id oraz dodatnie quantity.',
        });
    }

    if (fromLocationId === toLocationId) {
        return res.status(400).json({ error: 'Lokalizacja zrodlowa i docelowa musza byc rozne.' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const targetValidation = await client.query(`
            SELECT p.category, wl.zone_group
            FROM ${table('products')} p
            CROSS JOIN ${table('warehouse_locations')} wl
            WHERE p.products_id = $1 AND wl.location_id = $2
        `, [productsId, toLocationId]);

        const target = targetValidation.rows[0];

        if (!target) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Produkt albo lokalizacja docelowa nie istnieje.' });
        }

        if (!isCategoryAllowedInZoneGroup(target.category, target.zone_group)) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                error: `Produkt z kategorii ${target.category} nie moze byc przeniesiony do grupy ${target.zone_group}.`,
            });
        }

        const sourceResult = await client.query(`
            SELECT id, quantity
            FROM ${table('storage_stock')}
            WHERE products_id = $1 AND location_id = $2
            FOR UPDATE
        `, [productsId, fromLocationId]);

        const source = sourceResult.rows[0];

        if (!source || source.quantity < quantity) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Brak wystarczajacego stanu w lokalizacji zrodlowej.' });
        }

        const sourceQuantity = source.quantity - quantity;

        if (sourceQuantity === 0) {
            await client.query(`
                DELETE FROM ${table('storage_stock')}
                WHERE id = $1
            `, [source.id]);
        } else {
            await client.query(`
                UPDATE ${table('storage_stock')}
                SET quantity = $1
                WHERE id = $2
            `, [sourceQuantity, source.id]);
        }

        const targetResult = await client.query(`
            SELECT id, quantity
            FROM ${table('storage_stock')}
            WHERE products_id = $1 AND location_id = $2
            FOR UPDATE
        `, [productsId, toLocationId]);

        let targetId;

        if (targetResult.rows[0]) {
            const updatedTarget = await client.query(`
                UPDATE ${table('storage_stock')}
                SET quantity = quantity + $1
                WHERE id = $2
                RETURNING id
            `, [quantity, targetResult.rows[0].id]);

            targetId = updatedTarget.rows[0].id;
        } else {
            const insertedTarget = await client.query(`
                INSERT INTO ${table('storage_stock')} (products_id, location_id, quantity)
                VALUES ($1, $2, $3)
                RETURNING id
            `, [productsId, toLocationId, quantity]);

            targetId = insertedTarget.rows[0].id;
        }

        const targetStock = await fetchStockById(client, targetId);
        await client.query('COMMIT');

        res.json({
            transferred_quantity: quantity,
            source_quantity: sourceQuantity,
            target_stock: targetStock,
        });
    } catch (error) {
        await client.query('ROLLBACK');
        sendDbError(res, error, 'Nie udalo sie przeniesc stanu.');
    } finally {
        client.release();
    }
};

module.exports = {
    listStock,
    getStockById,
    setStock,
    updateStockQuantity,
    adjustStockQuantity,
    transferStock,
};
