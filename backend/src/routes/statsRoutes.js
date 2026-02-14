const express = require('express');
const router = express.Router();
const { getPublicStats } = require('../controllers/statsController');

// GET /api/stats - Public homepage stats (no auth required)
router.get('/', getPublicStats);

module.exports = router;
