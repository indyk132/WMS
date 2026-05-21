const express = require('express');
const {
    listLocations,
    getLocationById,
    createLocation,
    updateLocation,
    deleteLocation,
} = require('../controllers/locationsController');

const router = express.Router();

router.get('/locations', listLocations);
router.post('/locations', createLocation);
router.get('/locations/:id', getLocationById);
router.patch('/locations/:id', updateLocation);
router.delete('/locations/:id', deleteLocation);

module.exports = router;
