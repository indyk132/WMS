const express = require('express');
const {
    listProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
} = require('../controllers/productsController');

const router = express.Router();

router.get('/products', listProducts);
router.post('/products', createProduct);
router.get('/products/:id', getProductById);
router.patch('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

module.exports = router;
