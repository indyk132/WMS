const express = require('express');
const { listActivities, createActivity } = require('../controllers/activitiesController');

const router = express.Router();

router.get('/activities', listActivities);
router.post('/activities', createActivity);

module.exports = router;
