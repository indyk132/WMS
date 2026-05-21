const express = require('express');
const router = express.Router();
const { getInventoryStatus, adjustInventoryQuantity } = require('../controllers/inventoryController');

router.get('/inventory', getInventoryStatus);
router.post('/inventory/adjust', adjustInventoryQuantity);

module.exports = router;
