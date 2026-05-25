const { pool, table } = require('../db');
const { sendDbError, toInteger } = require('../utils/httpErrors');

const CATEGORY_ZONE_GROUPS = {
    Zywnosc: ['Zywnosc', 'Przyjecia mieszane'],
    Elektronika: ['Elektronika i biuro', 'Przyjecia mieszane'],
    Biuro: ['Elektronika i biuro', 'Przyjecia mieszane'],
    Motoryzacja: ['Motoryzacja, chemia i BHP', 'Przyjecia mieszane'],
    Chemia: ['Motoryzacja, chemia i BHP', 'Przyjecia mieszane'],
    BHP: ['Motoryzacja, chemia i BHP', 'Przyjecia mieszane'],
};

const isCategoryAllowedInZoneGroup = (category, zoneGroup) => {
    const allowedGroups = CATEGORY_ZONE_GROUPS[category] || ['Przyjecia mieszane'];
    return allowedGroups.includes(zoneGroup);
};

const getInventoryStatus = async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT
                s.id,
                p.products_id,
                p.sku,
                p.name AS product_name,
                p.category,
                p.barcode,
                p.price,
                p.reorder_threshold,
                wl.location_id,
                wl.location_code,
                wl.zone_group,
                COALESCE(s.quantity, 0) AS quantity
            FROM ${table('products')} p
            LEFT JOIN ${table('storage_stock')} s ON s.products_id = p.products_id
            LEFT JOIN ${table('warehouse_locations')} wl ON s.location_id = wl.location_id
            ORDER BY wl.location_code, p.name
        `);

        res.json(rows);
    } catch (error) {
        sendDbError(res, error, 'Nie udalo sie pobrac stanu magazynu.');
    }
};

const getPreferredLocationId = async (client, product, requestedLocationId) => {
    if (requestedLocationId) {
        const locationResult = await client.query(`
            SELECT location_id, zone_group
            FROM ${table('warehouse_locations')}
            WHERE location_id = $1
        `, [requestedLocationId]);

        return locationResult.rows[0] || null;
    }

    const existingLocation = await client.query(`
        SELECT location_id, zone_group
        FROM ${table('storage_stock')}
        JOIN ${table('warehouse_locations')} USING (location_id)
        WHERE products_id = $1
        ORDER BY id
        LIMIT 1
    `, [product.products_id]);

    if (existingLocation.rows[0]) {
        return existingLocation.rows[0];
    }

    const categoryPrefix = {
        Zywnosc: 'A-%',
        Elektronika: 'B-%',
        Biuro: 'B-%',
        Motoryzacja: 'C-%',
        Chemia: 'C-%',
        BHP: 'C-%',
    }[product.category] || 'A-%';

    const preferredLocation = await client.query(`
        SELECT location_id, zone_group
        FROM ${table('warehouse_locations')}
        WHERE location_code LIKE $1
        ORDER BY location_code
        LIMIT 1
    `, [categoryPrefix]);

    if (preferredLocation.rows[0]) {
        return preferredLocation.rows[0];
    }

    const fallbackLocation = await client.query(`
        SELECT location_id, zone_group
        FROM ${table('warehouse_locations')}
        ORDER BY location_code
        LIMIT 1
    `);

    return fallbackLocation.rows[0] || null;
};

const adjustInventoryQuantity = async (req, res) => {
    const delta = toInteger(req.body.delta);
    const requestedLocationId = req.body.location_id ? toInteger(req.body.location_id) : null;
    const productLookup = req.body.products_id || req.body.productId || req.body.sku || req.body.barcode;

    if (!productLookup || delta === null || delta === 0) {
        return res.status(400).json({ error: 'Wymagane sa productId/sku oraz niezerowe delta.' });
    }

    if (req.body.location_id && !requestedLocationId) {
        return res.status(400).json({ error: 'location_id musi byc liczba calkowita.' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const productResult = await client.query(`
            SELECT products_id, sku, barcode, category
            FROM ${table('products')}
            WHERE products_id::text = $1 OR sku = $1 OR barcode = $1
            LIMIT 1
        `, [String(productLookup)]);

        const product = productResult.rows[0];

        if (!product) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Produkt nie istnieje.' });
        }

        if (delta > 0) {
            const location = await getPreferredLocationId(client, product, requestedLocationId);

            if (!location) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'Brak lokalizacji docelowej dla produktu.' });
            }

            if (!isCategoryAllowedInZoneGroup(product.category, location.zone_group)) {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    error: `Produkt z kategorii ${product.category} nie moze byc dodany do grupy ${location.zone_group}.`,
                });
            }

            const existingStock = await client.query(`
                SELECT id
                FROM ${table('storage_stock')}
                WHERE products_id = $1 AND location_id = $2
                FOR UPDATE
            `, [product.products_id, location.location_id]);

            if (existingStock.rows[0]) {
                await client.query(`
                    UPDATE ${table('storage_stock')}
                    SET quantity = quantity + $1
                    WHERE id = $2
                `, [delta, existingStock.rows[0].id]);
            } else {
                await client.query(`
                    INSERT INTO ${table('storage_stock')} (products_id, location_id, quantity)
                    VALUES ($1, $2, $3)
                `, [product.products_id, location.location_id, delta]);
            }
        } else {
            let remaining = Math.abs(delta);

            const stockResult = await client.query(`
                SELECT s.id, s.quantity
                FROM ${table('storage_stock')} s
                JOIN ${table('warehouse_locations')} wl ON wl.location_id = s.location_id
                WHERE s.products_id = $1 AND s.quantity > 0
                ORDER BY wl.location_code
                FOR UPDATE OF s
            `, [product.products_id]);

            const available = stockResult.rows.reduce((sum, row) => sum + row.quantity, 0);

            if (available < remaining) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'Nie mozna zdjac wiecej niz obecny stan produktu.' });
            }

            for (const stock of stockResult.rows) {
                if (remaining <= 0) break;

                const reduction = Math.min(stock.quantity, remaining);
                const nextQuantity = stock.quantity - reduction;

                await client.query(`
                    UPDATE ${table('storage_stock')}
                    SET quantity = $1
                    WHERE id = $2
                `, [nextQuantity, stock.id]);

                remaining -= reduction;
            }
        }

        await client.query('COMMIT');
        res.json({ products_id: product.products_id, sku: product.sku, delta });
    } catch (error) {
        await client.query('ROLLBACK');
        sendDbError(res, error, 'Nie udalo sie skorygowac stanu produktu.');
    } finally {
        client.release();
    }
};

module.exports = {
    getInventoryStatus,
    adjustInventoryQuantity,
};
