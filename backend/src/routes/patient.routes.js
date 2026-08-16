const express = require('express');
const router = express.Router();
const validate = require('../middleware/validator');
const { protect, restrictTo } = require('../middleware/auth');
const { registerPatientSchema } = require('../utils/validationSchemas');
const {
  createPatient,
  getAllPatients,
  getPatientById,
  updatePatient,
  deletePatient
} = require('../controllers/patient.controller');

// All patient endpoints are protected
router.use(protect);

router.route('/')
  .get(restrictTo('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'PHARMACIST', 'LAB_TECHNICIAN', 'BILLING'), getAllPatients)
  .post(restrictTo('ADMIN', 'NURSE', 'RECEPTIONIST'), validate(registerPatientSchema), createPatient);

router.route('/:id')
  .get(getPatientById) // Custom middleware for matching patient's own ID can be added, or resolved in controller
  .put(restrictTo('ADMIN', 'NURSE', 'RECEPTIONIST', 'PATIENT'), updatePatient)
  .delete(restrictTo('ADMIN'), deletePatient);

module.exports = router;
