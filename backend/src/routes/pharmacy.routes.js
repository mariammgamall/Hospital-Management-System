const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const {
  getInventory,
  addInventoryItem,
  updateInventoryItem,
  getPharmacyPrescriptions
} = require('../controllers/pharmacy.controller');

router.use(protect);

router.get('/inventory', restrictTo('ADMIN', 'PHARMACIST', 'DOCTOR', 'NURSE'), getInventory);
router.post('/inventory', restrictTo('ADMIN', 'PHARMACIST'), addInventoryItem);
router.patch('/inventory/:id', restrictTo('ADMIN', 'PHARMACIST'), updateInventoryItem);

router.get('/prescriptions', restrictTo('ADMIN', 'PHARMACIST', 'DOCTOR', 'NURSE'), getPharmacyPrescriptions);

module.exports = router;
