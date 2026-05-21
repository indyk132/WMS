const express = require('express');
const {
    listOrders,
    getOrderById,
    createOrder,
    updateOrder,
    deleteOrder,
    addOrderItem,
    updateOrderItem,
    deleteOrderItem,
} = require('../controllers/ordersController');

const router = express.Router();

router.get('/orders', listOrders);
router.post('/orders', createOrder);
router.get('/orders/:id', getOrderById);
router.patch('/orders/:id', updateOrder);
router.delete('/orders/:id', deleteOrder);
router.post('/orders/:id/items', addOrderItem);
router.patch('/orders/items/:itemId', updateOrderItem);
router.delete('/orders/items/:itemId', deleteOrderItem);

module.exports = router;
