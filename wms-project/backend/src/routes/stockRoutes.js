const express = require('express');
const {
    listStock,
    getStockById,
    setStock,
    updateStockQuantity,
    adjustStockQuantity,
    transferStock,
} = require('../controllers/stockController');

const router = express.Router();

router.get('/stock', listStock);
router.post('/stock', setStock);
router.post('/stock/transfer', transferStock);
router.get('/stock/:id', getStockById);
router.patch('/stock/:id', updateStockQuantity);
router.patch('/stock/:id/adjust', adjustStockQuantity);

module.exports = router;
