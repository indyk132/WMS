const { pool, table } = require('../db');
const { sendDbError, toOptionalNumber } = require('../utils/httpErrors');

const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

const parsePrice = (value) => {
    if (value === undefined || value === null || value === '') return null;

    const parsed = toOptionalNumber(value);
    return parsed !== null && parsed >= 0 ? parsed : undefined;
};

const listProducts = async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT
                p.products_id,
                p.sku,
                p.barcode,
                p.name,
                p.category,
                p.price,
                p.reorder_threshold,
                p.date_added,
                COALESCE(SUM(s.quantity), 0)::int AS stock
            FROM ${table('products')} p
            LEFT JOIN ${table('storage_stock')} s ON s.products_id = p.products_id
            GROUP BY p.products_id
            ORDER BY p.name
        `);

        res.json(rows);
    } catch (error) {
        sendDbError(res, error, 'Nie udalo sie pobrac produktow.');
    }
};

const getProductById = async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT
                p.products_id,
                p.sku,
                p.barcode,
                p.name,
                p.category,
                p.price,
                p.reorder_threshold,
                p.date_added,
                COALESCE(SUM(s.quantity), 0)::int AS stock,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'stock_id', s.id,
                            'location_id', wl.location_id,
                            'location_code', wl.location_code,
                            'quantity', s.quantity
                        )
                        ORDER BY wl.location_code
                    ) FILTER (WHERE s.id IS NOT NULL),
                    '[]'::json
                ) AS locations
            FROM ${table('products')} p
            LEFT JOIN ${table('storage_stock')} s ON s.products_id = p.products_id
            LEFT JOIN ${table('warehouse_locations')} wl ON wl.location_id = s.location_id
            WHERE p.products_id = $1
            GROUP BY p.products_id
        `, [req.params.id]);

        if (!rows[0]) {
            return res.status(404).json({ error: 'Produkt nie istnieje.' });
        }

        res.json(rows[0]);
    } catch (error) {
        sendDbError(res, error, 'Nie udalo sie pobrac produktu.');
    }
};

const createProduct = async (req, res) => {
    const sku = req.body.sku || null;
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const barcode = req.body.barcode || null;
    const category = req.body.category || 'General';
    const reorderThreshold = Number.isInteger(Number(req.body.reorder_threshold ?? req.body.reorderThreshold))
        ? Number(req.body.reorder_threshold ?? req.body.reorderThreshold)
        : 20;
    const price = parsePrice(req.body.price);

    if (!name) {
        return res.status(400).json({ error: 'Pole name jest wymagane.' });
    }

    if (price === undefined) {
        return res.status(400).json({ error: 'Pole price musi byc liczba nieujemna.' });
    }

    if (reorderThreshold < 0) {
        return res.status(400).json({ error: 'Pole reorder_threshold musi byc liczba nieujemna.' });
    }

    try {
        const { rows } = await pool.query(`
            INSERT INTO ${table('products')} (sku, barcode, name, category, price, reorder_threshold)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING products_id, sku, barcode, name, category, price, reorder_threshold, date_added
        `, [sku, barcode, name, category, price, reorderThreshold]);

        res.status(201).json(rows[0]);
    } catch (error) {
        sendDbError(res, error, 'Nie udalo sie utworzyc produktu.');
    }
};

const updateProduct = async (req, res) => {
    const assignments = [];
    const values = [];

    if (hasOwn(req.body, 'barcode')) {
        values.push(req.body.barcode || null);
        assignments.push(`barcode = $${values.length}`);
    }

    if (hasOwn(req.body, 'sku')) {
        values.push(req.body.sku || null);
        assignments.push(`sku = $${values.length}`);
    }

    if (hasOwn(req.body, 'name')) {
        const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
        if (!name) {
            return res.status(400).json({ error: 'Pole name nie moze byc puste.' });
        }

        values.push(name);
        assignments.push(`name = $${values.length}`);
    }

    if (hasOwn(req.body, 'price')) {
        const price = parsePrice(req.body.price);
        if (price === undefined) {
            return res.status(400).json({ error: 'Pole price musi byc liczba nieujemna.' });
        }

        values.push(price);
        assignments.push(`price = $${values.length}`);
    }

    if (hasOwn(req.body, 'category')) {
        values.push(req.body.category || 'General');
        assignments.push(`category = $${values.length}`);
    }

    if (hasOwn(req.body, 'reorder_threshold') || hasOwn(req.body, 'reorderThreshold')) {
        const reorderThreshold = Number(req.body.reorder_threshold ?? req.body.reorderThreshold);
        if (!Number.isInteger(reorderThreshold) || reorderThreshold < 0) {
            return res.status(400).json({ error: 'Pole reorder_threshold musi byc liczba nieujemna.' });
        }

        values.push(reorderThreshold);
        assignments.push(`reorder_threshold = $${values.length}`);
    }

    if (assignments.length === 0) {
        return res.status(400).json({ error: 'Brak pol do aktualizacji.' });
    }

    values.push(req.params.id);

    try {
        const { rows } = await pool.query(`
            UPDATE ${table('products')}
            SET ${assignments.join(', ')}
            WHERE products_id = $${values.length}
            RETURNING products_id, sku, barcode, name, category, price, reorder_threshold, date_added
        `, values);

        if (!rows[0]) {
            return res.status(404).json({ error: 'Produkt nie istnieje.' });
        }

        res.json(rows[0]);
    } catch (error) {
        sendDbError(res, error, 'Nie udalo sie zaktualizowac produktu.');
    }
};

const deleteProduct = async (req, res) => {
    try {
        const { rows } = await pool.query(`
            DELETE FROM ${table('products')}
            WHERE products_id = $1
            RETURNING products_id, barcode, name
        `, [req.params.id]);

        if (!rows[0]) {
            return res.status(404).json({ error: 'Produkt nie istnieje.' });
        }

        res.json({ deleted: rows[0] });
    } catch (error) {
        sendDbError(res, error, 'Nie udalo sie usunac produktu.');
    }
};

module.exports = {
    listProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
};
