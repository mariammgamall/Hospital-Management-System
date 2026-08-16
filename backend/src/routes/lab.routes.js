const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const {
  getLabTests,
  createLabTest,
  updateLabTestResult
} = require('../controllers/lab.controller');

router.use(protect);

router.get('/tests', getLabTests);
router.post('/tests', restrictTo('ADMIN', 'DOCTOR', 'LAB_TECHNICIAN'), createLabTest);
router.patch('/tests/:id', restrictTo('ADMIN', 'LAB_TECHNICIAN'), updateLabTestResult);

module.exports = router;
