const express = require('express');
const router = express.Router();
const validate = require('../middleware/validator');
const { protect, restrictTo } = require('../middleware/auth');
const { createWardSchema, createBedSchema, createAdmissionSchema } = require('../utils/validationSchemas');
const {
  createWard,
  createBed,
  getWardBedGrid,
  admitPatient,
  dischargePatient
} = require('../controllers/ward.controller');

router.use(protect);

router.post('/wards', restrictTo('ADMIN'), validate(createWardSchema), createWard);
router.post('/beds', restrictTo('ADMIN'), validate(createBedSchema), createBed);
router.get('/grid', restrictTo('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'), getWardBedGrid);
router.post('/admissions', restrictTo('ADMIN', 'NURSE', 'RECEPTIONIST'), validate(createAdmissionSchema), admitPatient);
router.patch('/admissions/:admissionId/discharge', restrictTo('ADMIN', 'NURSE'), dischargePatient);

module.exports = router;
