const { pool, table } = require('../db');
const { sendDbError, toInteger } = require('../utils/httpErrors');

const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

const parsePositiveInteger = (value) => {
    const parsed = toInteger(value);
    return parsed !== null && parsed > 0 ? parsed : null;
};

const parseNonNegativeInteger = (value) => {
    const parsed = toInteger(value);
    return parsed !== null && parsed >= 0 ? parsed : null;
};

const generateOrderNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');

    return `ORD/${year}/${month}/${now.getTime()}`;
};

const orderSelect = () => `
    SELECT
        o.order_id,
        o.order_number AS "id",
        o.order_number,
        o.status,
        o.order_date,
        o.order_realisation,
        o.notes AS "internalNotes",
        o.customer,
        o.destination,
        o.priority,
        o.warehouse_code AS "warehouseCode",
        o.internal_notes_actor AS "internalNotesActor",
        o.is_packed AS "isPacked",
        o.bin_id AS "binId",
        o.picked_by AS "pickedBy",
        o.pick_completed_time AS "pickCompletedTime",
        o.shipment_date AS "shipmentDate",
        COALESCE(o.change_logs, '[]'::jsonb) AS "changeLogs",
        COALESCE(o.activity_history, '[]'::jsonb) AS "activityHistory",
        COALESCE(
            json_agg(
                json_build_object(
                    'id', oi.id,
                    'products_id', oi.products_id,
                    'barcode', p.barcode,
                    'product_name', p.name,
                    'name', p.name,
                    'sku', p.sku,
                    'price', p.price,
                    'qty', oi.order_quantity,
                    'order_quantity', oi.order_quantity,
                    'picked_quantity', oi.picked_quantity
                )
                ORDER BY oi.id
            ) FILTER (WHERE oi.id IS NOT NULL),
            '[]'::json
        ) AS items
    FROM ${table('orders')} o
    LEFT JOIN ${table('order_items')} oi ON oi.order_id = o.order_id
    LEFT JOIN ${table('products')} p ON p.products_id = oi.products_id
`;

const fetchOrderByIdOrNumber = async (client, idOrNumber) => {
    const isNumeric = /^\d+$/.test(idOrNumber);
    const queryStr = isNumeric
        ? `${orderSelect()} WHERE o.order_id = $1 GROUP BY o.order_id`
        : `${orderSelect()} WHERE o.order_number = $1 GROUP BY o.order_id`;

    const { rows } = await client.query(queryStr, [isNumeric ? parseInt(idOrNumber, 10) : idOrNumber]);
    return rows[0] || null;
};

const validateOrderItem = (item) => {
    const productsId = parsePositiveInteger(item.products_id);
    const orderQuantity = parsePositiveInteger(item.order_quantity ?? item.qty);
    const pickedQuantity = item.picked_quantity === undefined
        ? 0
        : parseNonNegativeInteger(item.picked_quantity);

    if (!productsId || !orderQuantity || pickedQuantity === null) {
        return null;
    }

    if (pickedQuantity > orderQuantity) {
        return null;
    }

    return {
        productsId,
        orderQuantity,
        pickedQuantity,
    };
};

const listOrders = async (req, res) => {
    try {
        const { rows } = await pool.query(`
            ${orderSelect()}
            GROUP BY o.order_id
            ORDER BY o.order_date DESC, o.order_id DESC
        `);

        res.json(rows);
    } catch (error) {
        sendDbError(res, error, 'Nie udalo sie pobrac zamowien.');
    }
};

const getOrderById = async (req, res) => {
    try {
        const order = await fetchOrderByIdOrNumber(pool, req.params.id);

        if (!order) {
            return res.status(404).json({ error: 'Zamowienie nie istnieje.' });
        }

        res.json(order);
    } catch (error) {
        sendDbError(res, error, 'Nie udalo sie pobrac zamowienia.');
    }
};

const createOrder = async (req, res) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Extract and sanitize order number
        const orderNumber = typeof req.body.order_number === 'string' && req.body.order_number.trim()
            ? req.body.order_number.trim()
            : (req.body.id && typeof req.body.id === 'string' && req.body.id.trim()
                ? req.body.id.trim()
                : generateOrderNumber());

        // Check if order number already exists (idempotency)
        const checkExisting = await client.query(
            `SELECT order_id FROM ${table('orders')} WHERE order_number = $1`,
            [orderNumber]
        );
        if (checkExisting.rows[0]) {
            await client.query('COMMIT');
            const existingOrder = await fetchOrderByIdOrNumber(pool, checkExisting.rows[0].order_id);
            return res.status(200).json(existingOrder);
        }

        const status = typeof req.body.status === 'string' && req.body.status.trim()
            ? req.body.status.trim()
            : 'Nowe';
        const notes = req.body.notes || req.body.internalNotes || '';
        const customer = req.body.customer || '';
        const destination = req.body.destination || '';
        const priority = req.body.priority || 'Normalny';
        const warehouseCode = req.body.warehouse_code || req.body.warehouseCode || 'HUB-PL-01';
        const internalNotesActor = req.body.internal_notes_actor || req.body.internalNotesActor || 'System';
        const isPacked = req.body.is_packed !== undefined ? req.body.is_packed : (req.body.isPacked || false);
        const binId = req.body.bin_id || req.body.binId || null;
        const pickedBy = req.body.picked_by || req.body.pickedBy || null;
        const pickCompletedTime = req.body.pick_completed_time || req.body.pickCompletedTime || null;
        const shipmentDate = req.body.shipment_date || req.body.shipmentDate || null;
        const changeLogs = req.body.changeLogs || req.body.change_logs || [];
        const activityHistory = req.body.activityHistory || req.body.activity_history || [];

        const orderResult = await client.query(`
            INSERT INTO ${table('orders')} (
                order_number, status, notes, customer, destination, priority,
                warehouse_code, internal_notes_actor, is_packed, bin_id,
                picked_by, pick_completed_time, shipment_date, change_logs, activity_history
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            RETURNING order_id
        `, [
            orderNumber, status, notes, customer, destination, priority,
            warehouseCode, internalNotesActor, isPacked, binId,
            pickedBy, pickCompletedTime, shipmentDate,
            JSON.stringify(changeLogs), JSON.stringify(activityHistory)
        ]);

        const orderId = orderResult.rows[0].order_id;
        const items = Array.isArray(req.body.items) ? req.body.items : [];

        for (const item of items) {
            let productsId = item.products_id;
            if (!productsId && item.sku) {
                const prodRes = await client.query(
                    `SELECT products_id FROM ${table('products')} WHERE sku = $1 OR barcode = $1 LIMIT 1`,
                    [item.sku]
                );
                if (prodRes.rows[0]) {
                    productsId = prodRes.rows[0].products_id;
                }
            }
            if (!productsId && item.barcode) {
                const prodRes = await client.query(
                    `SELECT products_id FROM ${table('products')} WHERE barcode = $1 OR sku = $1 LIMIT 1`,
                    [item.barcode]
                );
                if (prodRes.rows[0]) {
                    productsId = prodRes.rows[0].products_id;
                }
            }
            if (!productsId && item.name) {
                const prodRes = await client.query(
                    `SELECT products_id FROM ${table('products')} WHERE LOWER(name) = LOWER($1) LIMIT 1`,
                    [item.name.trim()]
                );
                if (prodRes.rows[0]) {
                    productsId = prodRes.rows[0].products_id;
                }
            }

            if (!productsId) {
                throw new Error(`Nie znaleziono produktu o SKU/nazwie: ${item.sku || item.name || 'brak danych'}`);
            }

            const orderQty = item.order_quantity || item.qty || 1;
            const pickedQty = item.picked_quantity || item.pickedQty || 0;

            await client.query(`
                INSERT INTO ${table('order_items')} (order_id, products_id, order_quantity, picked_quantity)
                VALUES ($1, $2, $3, $4)
            `, [orderId, productsId, orderQty, pickedQty]);
        }

        await client.query('COMMIT');

        const newOrder = await fetchOrderByIdOrNumber(pool, orderId);
        res.status(201).json(newOrder);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error in createOrder:', error);
        res.status(500).json({ error: error.message || 'Nie udalo sie utworzyc zamowienia.' });
    } finally {
        client.release();
    }
};

const updateOrder = async (req, res) => {
    const idOrNumber = req.params.id;

    // Resolve order_id
    let order_id = null;
    try {
        const checkRes = await pool.query(
            /^\d+$/.test(idOrNumber)
                ? `SELECT order_id FROM ${table('orders')} WHERE order_id = $1`
                : `SELECT order_id FROM ${table('orders')} WHERE order_number = $1`,
            [/^\d+$/.test(idOrNumber) ? parseInt(idOrNumber, 10) : idOrNumber]
        );
        if (checkRes.rows[0]) {
            order_id = checkRes.rows[0].order_id;
        }
    } catch (e) {
        console.error(e);
    }

    if (!order_id) {
        return res.status(404).json({ error: 'Zamowienie nie istnieje.' });
    }

    const assignments = [];
    const values = [];

    const mapField = (bodyKey, dbCol) => {
        if (hasOwn(req.body, bodyKey)) {
            values.push(req.body[bodyKey]);
            assignments.push(`${dbCol} = $${values.length}`);
        }
    };

    const mapJsonField = (bodyKey, dbCol) => {
        if (hasOwn(req.body, bodyKey)) {
            const val = req.body[bodyKey];
            values.push(typeof val === 'string' ? val : JSON.stringify(val));
            assignments.push(`${dbCol} = $${values.length}`);
        }
    };

    mapField('order_number', 'order_number');
    mapField('status', 'status');
    mapField('order_realisation', 'order_realisation');
    mapField('notes', 'notes');
    mapField('internalNotes', 'notes');
    mapField('customer', 'customer');
    mapField('destination', 'destination');
    mapField('priority', 'priority');
    mapField('warehouseCode', 'warehouse_code');
    mapField('warehouse_code', 'warehouse_code');
    mapField('internalNotesActor', 'internal_notes_actor');
    mapField('internal_notes_actor', 'internal_notes_actor');
    mapField('isPacked', 'is_packed');
    mapField('is_packed', 'is_packed');
    mapField('binId', 'bin_id');
    mapField('bin_id', 'bin_id');
    mapField('pickedBy', 'picked_by');
    mapField('picked_by', 'picked_by');
    mapField('pickCompletedTime', 'pick_completed_time');
    mapField('pick_completed_time', 'pick_completed_time');
    mapField('shipmentDate', 'shipment_date');
    mapField('shipment_date', 'shipment_date');
    
    mapJsonField('changeLogs', 'change_logs');
    mapJsonField('change_logs', 'change_logs');
    mapJsonField('activityHistory', 'activity_history');
    mapJsonField('activity_history', 'activity_history');

    if (assignments.length === 0) {
        return res.status(400).json({ error: 'Brak pol do aktualizacji.' });
    }

    values.push(order_id);
    const updateQuery = `
        UPDATE ${table('orders')}
        SET ${assignments.join(', ')}
        WHERE order_id = $${values.length}
        RETURNING order_id
    `;

    try {
        const { rows } = await pool.query(updateQuery, values);

        if (!rows[0]) {
            return res.status(404).json({ error: 'Zamowienie nie istnieje.' });
        }

        const order = await fetchOrderByIdOrNumber(pool, rows[0].order_id);
        res.json(order);
    } catch (error) {
        sendDbError(res, error, 'Nie udalo sie zaktualizowac zamowienia.');
    }
};

const deleteOrder = async (req, res) => {
    const idOrNumber = req.params.id;
    const isNumeric = /^\d+$/.test(idOrNumber);
    const deleteQuery = isNumeric
        ? `DELETE FROM ${table('orders')} WHERE order_id = $1 RETURNING order_id, order_number`
        : `DELETE FROM ${table('orders')} WHERE order_number = $1 RETURNING order_id, order_number`;

    try {
        const { rows } = await pool.query(deleteQuery, [isNumeric ? parseInt(idOrNumber, 10) : idOrNumber]);

        if (!rows[0]) {
            return res.status(404).json({ error: 'Zamowienie nie istnieje.' });
        }

        res.json({ deleted: rows[0] });
    } catch (error) {
        sendDbError(res, error, 'Nie udalo sie usunac zamowienia.');
    }
};

const addOrderItem = async (req, res) => {
    const idOrNumber = req.params.id;
    const item = validateOrderItem(req.body);

    if (!idOrNumber || !item) {
        return res.status(400).json({
            error: 'Wymagane sa poprawne id/numer zamowienia, products_id, order_quantity i picked_quantity.',
        });
    }

    try {
        const order = await fetchOrderByIdOrNumber(pool, idOrNumber);

        if (!order) {
            return res.status(404).json({ error: 'Zamowienie nie istnieje.' });
        }

        const realOrderId = order.order_id;

        await pool.query(`
            INSERT INTO ${table('order_items')} (
                order_id,
                products_id,
                order_quantity,
                picked_quantity
            )
            VALUES ($1, $2, $3, $4)
        `, [realOrderId, item.productsId, item.orderQuantity, item.pickedQuantity]);

        const updatedOrder = await fetchOrderByIdOrNumber(pool, idOrNumber);
        res.status(201).json(updatedOrder);
    } catch (error) {
        sendDbError(res, error, 'Nie udalo sie dodac pozycji zamowienia.');
    }
};

const updateOrderItem = async (req, res) => {
    const itemId = parsePositiveInteger(req.params.itemId);

    if (!itemId) {
        return res.status(400).json({ error: 'Niepoprawne id pozycji zamowienia.' });
    }

    try {
        const currentResult = await pool.query(`
            SELECT id, order_id, order_quantity, picked_quantity
            FROM ${table('order_items')}
            WHERE id = $1
        `, [itemId]);

        const current = currentResult.rows[0];

        if (!current) {
            return res.status(404).json({ error: 'Pozycja zamowienia nie istnieje.' });
        }

        const assignments = [];
        const values = [];
        let nextOrderQuantity = current.order_quantity;
        let nextPickedQuantity = current.picked_quantity;

        if (hasOwn(req.body, 'products_id')) {
            const productsId = parsePositiveInteger(req.body.products_id);
            if (!productsId) {
                return res.status(400).json({ error: 'Pole products_id musi byc dodatnia liczba calkowita.' });
            }

            values.push(productsId);
            assignments.push(`products_id = $${values.length}`);
        }

        if (hasOwn(req.body, 'order_quantity')) {
            nextOrderQuantity = parsePositiveInteger(req.body.order_quantity);
            if (!nextOrderQuantity) {
                return res.status(400).json({ error: 'Pole order_quantity musi byc dodatnia liczba calkowita.' });
            }

            values.push(nextOrderQuantity);
            assignments.push(`order_quantity = $${values.length}`);
        }

        if (hasOwn(req.body, 'picked_quantity')) {
            nextPickedQuantity = parseNonNegativeInteger(req.body.picked_quantity);
            if (nextPickedQuantity === null) {
                return res.status(400).json({ error: 'Pole picked_quantity musi byc liczba nieujemna.' });
            }

            values.push(nextPickedQuantity);
            assignments.push(`picked_quantity = $${values.length}`);
        }

        if (nextPickedQuantity > nextOrderQuantity) {
            return res.status(400).json({ error: 'picked_quantity nie moze przekraczac order_quantity.' });
        }

        if (assignments.length === 0) {
            return res.status(400).json({ error: 'Brak pol do aktualizacji.' });
        }

        values.push(itemId);

        await pool.query(`
            UPDATE ${table('order_items')}
            SET ${assignments.join(', ')}
            WHERE id = $${values.length}
        `, values);

        const order = await fetchOrderByIdOrNumber(pool, current.order_id);
        res.json(order);
    } catch (error) {
        sendDbError(res, error, 'Nie udalo sie zaktualizowac pozycji zamowienia.');
    }
};

const deleteOrderItem = async (req, res) => {
    const itemId = parsePositiveInteger(req.params.itemId);

    if (!itemId) {
        return res.status(400).json({ error: 'Niepoprawne id pozycji zamowienia.' });
    }

    try {
        const { rows } = await pool.query(`
            DELETE FROM ${table('order_items')}
            WHERE id = $1
            RETURNING id, order_id
        `, [itemId]);

        if (!rows[0]) {
            return res.status(404).json({ error: 'Pozycja zamowienia nie istnieje.' });
        }

        const order = await fetchOrderByIdOrNumber(pool, rows[0].order_id);
        res.json(order);
    } catch (error) {
        sendDbError(res, error, 'Nie udalo sie usunac pozycji zamowienia.');
    }
};

module.exports = {
    listOrders,
    getOrderById,
    createOrder,
    updateOrder,
    deleteOrder,
    addOrderItem,
    updateOrderItem,
    deleteOrderItem,
};
