const { pool, table } = require('../db');
const { sendDbError } = require('../utils/httpErrors');

const listLocations = async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT
                wl.location_id,
                wl.location_code,
                wl.zone_group,
                COUNT(DISTINCT s.products_id)::int AS product_count,
                COALESCE(SUM(s.quantity), 0)::int AS total_quantity
            FROM ${table('warehouse_locations')} wl
            LEFT JOIN ${table('storage_stock')} s ON s.location_id = wl.location_id
            GROUP BY wl.location_id
            ORDER BY wl.location_code
        `);

        res.json(rows);
    } catch (error) {
        sendDbError(res, error, 'Nie udalo sie pobrac lokalizacji.');
    }
};

const getLocationById = async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT
                wl.location_id,
                wl.location_code,
                wl.zone_group,
                COUNT(DISTINCT s.products_id)::int AS product_count,
                COALESCE(SUM(s.quantity), 0)::int AS total_quantity,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'stock_id', s.id,
                            'products_id', p.products_id,
                            'barcode', p.barcode,
                            'sku', p.sku,
                            'product_name', p.name,
                            'category', p.category,
                            'price', p.price,
                            'quantity', s.quantity
                        )
                        ORDER BY p.name
                    ) FILTER (WHERE s.id IS NOT NULL),
                    '[]'::json
                ) AS stock
            FROM ${table('warehouse_locations')} wl
            LEFT JOIN ${table('storage_stock')} s ON s.location_id = wl.location_id
            LEFT JOIN ${table('products')} p ON p.products_id = s.products_id
            WHERE wl.location_id = $1
            GROUP BY wl.location_id
        `, [req.params.id]);

        if (!rows[0]) {
            return res.status(404).json({ error: 'Lokalizacja nie istnieje.' });
        }

        res.json(rows[0]);
    } catch (error) {
        sendDbError(res, error, 'Nie udalo sie pobrac lokalizacji.');
    }
};

const createLocation = async (req, res) => {
    const locationCode = typeof req.body.location_code === 'string'
        ? req.body.location_code.trim().toUpperCase()
        : '';
    const zoneGroup = typeof req.body.zone_group === 'string'
        ? req.body.zone_group.trim()
        : 'General';

    if (!locationCode) {
        return res.status(400).json({ error: 'Pole location_code jest wymagane.' });
    }

    try {
        const { rows } = await pool.query(`
            INSERT INTO ${table('warehouse_locations')} (location_code, zone_group)
            VALUES ($1, $2)
            RETURNING location_id, location_code, zone_group
        `, [locationCode, zoneGroup || 'General']);

        res.status(201).json(rows[0]);
    } catch (error) {
        sendDbError(res, error, 'Nie udalo sie utworzyc lokalizacji.');
    }
};

const updateLocation = async (req, res) => {
    const locationCode = typeof req.body.location_code === 'string'
        ? req.body.location_code.trim().toUpperCase()
        : '';
    const zoneGroup = typeof req.body.zone_group === 'string'
        ? req.body.zone_group.trim()
        : null;

    if (!locationCode) {
        return res.status(400).json({ error: 'Pole location_code jest wymagane.' });
    }

    try {
        const { rows } = await pool.query(`
            UPDATE ${table('warehouse_locations')}
            SET
                location_code = $1,
                zone_group = COALESCE($3, zone_group)
            WHERE location_id = $2
            RETURNING location_id, location_code, zone_group
        `, [locationCode, req.params.id, zoneGroup]);

        if (!rows[0]) {
            return res.status(404).json({ error: 'Lokalizacja nie istnieje.' });
        }

        res.json(rows[0]);
    } catch (error) {
        sendDbError(res, error, 'Nie udalo sie zaktualizowac lokalizacji.');
    }
};

const deleteLocation = async (req, res) => {
    try {
        const { rows } = await pool.query(`
            DELETE FROM ${table('warehouse_locations')}
            WHERE location_id = $1
            RETURNING location_id, location_code, zone_group
        `, [req.params.id]);

        if (!rows[0]) {
            return res.status(404).json({ error: 'Lokalizacja nie istnieje.' });
        }

        res.json({ deleted: rows[0] });
    } catch (error) {
        sendDbError(res, error, 'Nie udalo sie usunac lokalizacji.');
    }
};

module.exports = {
    listLocations,
    getLocationById,
    createLocation,
    updateLocation,
    deleteLocation,
};
