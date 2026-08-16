const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const { getReports } = require('../controllers/report.controller');

router.get('/', protect, restrictTo('ADMIN'), getReports);

module.exports = router;
