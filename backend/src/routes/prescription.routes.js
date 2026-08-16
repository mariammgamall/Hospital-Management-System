const express = require('express');
const router = express.Router();
const validate = require('../middleware/validator');
const { protect, restrictTo } = require('../middleware/auth');
const { createPrescriptionSchema } = require('../utils/validationSchemas');
const {
  createPrescription,
  getAllPrescriptions,
  getPrescriptionById,
  deletePrescription
} = require('../controllers/prescription.controller');

router.use(protect);

router.route('/')
  .get(restrictTo('ADMIN', 'DOCTOR', 'NURSE', 'PATIENT', 'PHARMACIST'), getAllPrescriptions)
  .post(restrictTo('ADMIN', 'DOCTOR'), validate(createPrescriptionSchema), createPrescription);

router.route('/:id')
  .get(restrictTo('ADMIN', 'DOCTOR', 'NURSE', 'PATIENT', 'PHARMACIST'), getPrescriptionById)
  .delete(restrictTo('ADMIN'), deletePrescription);

module.exports = router;
