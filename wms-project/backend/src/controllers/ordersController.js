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
        o.order_number,
        o.status,
        o.order_date,
        o.order_realisation,
        o.notes,
        COALESCE(
            json_agg(
                json_build_object(
                    'id', oi.id,
                    'products_id', oi.products_id,
                    'barcode', p.barcode,
                    'product_name', p.name,
                    'price', p.price,
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

const fetchOrderById = async (client, orderId) => {
    const { rows } = await client.query(`
        ${orderSelect()}
        WHERE o.order_id = $1
        GROUP BY o.order_id
    `, [orderId]);

    return rows[0] || null;
};

const validateOrderItem = (item) => {
    const productsId = parsePositiveInteger(item.products_id);
    const orderQuantity = parsePositiveInteger(item.order_quantity);
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
        const order = await fetchOrderById(pool, req.params.id);

        if (!order) {
            return res.status(404).json({ error: 'Zamowienie nie istnieje.' });
        }

        res.json(order);
    } catch (error) {
        sendDbError(res, error, 'Nie udalo sie pobrac zamowienia.');
    }
};

const createOrder = async (req, res) => {
    const orderNumber = typeof req.body.order_number === 'string' && req.body.order_number.trim()
        ? req.body.order_number.trim()
        : generateOrderNumber();
    const status = typeof req.body.status === 'string' && req.body.status.trim()
        ? req.body.status.trim()
        : 'Nowe';
    const notes = req.body.notes || '';
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    const validatedItems = [];

    for (const item of items) {
        const validated = validateOrderItem(item);
        if (!validated) {
            return res.status(400).json({
                error: 'Kazda pozycja wymaga products_id, dodatniego order_quantity i poprawnego picked_quantity.',
            });
        }

        validatedItems.push(validated);
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const orderResult = await client.query(`
            INSERT INTO ${table('orders')} (order_number, status, notes)
            VALUES ($1, $2, $3)
            RETURNING order_id
        `, [orderNumber, status, notes]);

        const orderId = orderResult.rows[0].order_id;

        for (const item of validatedItems) {
            await client.query(`
                INSERT INTO ${table('order_items')} (
                    order_id,
                    products_id,
                    order_quantity,
                    picked_quantity
                )
                VALUES ($1, $2, $3, $4)
            `, [orderId, item.productsId, item.orderQuantity, item.pickedQuantity]);
        }

        const order = await fetchOrderById(client, orderId);
        await client.query('COMMIT');

        res.status(201).json(order);
    } catch (error) {
        await client.query('ROLLBACK');
        sendDbError(res, error, 'Nie udalo sie utworzyc zamowienia.');
    } finally {
        client.release();
    }
};

const updateOrder = async (req, res) => {
    const assignments = [];
    const values = [];

    if (hasOwn(req.body, 'order_number')) {
        const orderNumber = typeof req.body.order_number === 'string'
            ? req.body.order_number.trim()
            : '';

        if (!orderNumber) {
            return res.status(400).json({ error: 'Pole order_number nie moze byc puste.' });
        }

        values.push(orderNumber);
        assignments.push(`order_number = $${values.length}`);
    }

    if (hasOwn(req.body, 'status')) {
        const status = typeof req.body.status === 'string' ? req.body.status.trim() : '';

        if (!status) {
            return res.status(400).json({ error: 'Pole status nie moze byc puste.' });
        }

        values.push(status);
        assignments.push(`status = $${values.length}`);
    }

    if (hasOwn(req.body, 'order_realisation')) {
        values.push(req.body.order_realisation || null);
        assignments.push(`order_realisation = $${values.length}`);
    }

    if (hasOwn(req.body, 'notes')) {
        values.push(req.body.notes || '');
        assignments.push(`notes = $${values.length}`);
    }

    if (assignments.length === 0) {
        return res.status(400).json({ error: 'Brak pol do aktualizacji.' });
    }

    values.push(req.params.id);

    try {
        const { rows } = await pool.query(`
            UPDATE ${table('orders')}
            SET ${assignments.join(', ')}
            WHERE order_id = $${values.length}
            RETURNING order_id
        `, values);

        if (!rows[0]) {
            return res.status(404).json({ error: 'Zamowienie nie istnieje.' });
        }

        const order = await fetchOrderById(pool, rows[0].order_id);
        res.json(order);
    } catch (error) {
        sendDbError(res, error, 'Nie udalo sie zaktualizowac zamowienia.');
    }
};

const deleteOrder = async (req, res) => {
    try {
        const { rows } = await pool.query(`
            DELETE FROM ${table('orders')}
            WHERE order_id = $1
            RETURNING order_id, order_number
        `, [req.params.id]);

        if (!rows[0]) {
            return res.status(404).json({ error: 'Zamowienie nie istnieje.' });
        }

        res.json({ deleted: rows[0] });
    } catch (error) {
        sendDbError(res, error, 'Nie udalo sie usunac zamowienia.');
    }
};

const addOrderItem = async (req, res) => {
    const orderId = parsePositiveInteger(req.params.id);
    const item = validateOrderItem(req.body);

    if (!orderId || !item) {
        return res.status(400).json({
            error: 'Wymagane sa poprawne order_id, products_id, order_quantity i picked_quantity.',
        });
    }

    try {
        const order = await fetchOrderById(pool, orderId);

        if (!order) {
            return res.status(404).json({ error: 'Zamowienie nie istnieje.' });
        }

        await pool.query(`
            INSERT INTO ${table('order_items')} (
                order_id,
                products_id,
                order_quantity,
                picked_quantity
            )
            VALUES ($1, $2, $3, $4)
        `, [orderId, item.productsId, item.orderQuantity, item.pickedQuantity]);

        const updatedOrder = await fetchOrderById(pool, orderId);
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

        const order = await fetchOrderById(pool, current.order_id);
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

        const order = await fetchOrderById(pool, rows[0].order_id);
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
