const express = require('express');
const router = express.Router();
const validate = require('../middleware/validator');
const { protect, restrictTo } = require('../middleware/auth');
const { createMedicalRecordSchema } = require('../utils/validationSchemas');
const {
  createMedicalRecord,
  getAllMedicalRecords,
  getMedicalRecordById,
  deleteMedicalRecord
} = require('../controllers/medicalRecord.controller');

router.use(protect);

router.route('/')
  .get(restrictTo('ADMIN', 'DOCTOR', 'NURSE', 'PATIENT', 'PHARMACIST', 'LAB_TECHNICIAN'), getAllMedicalRecords)
  .post(restrictTo('ADMIN', 'DOCTOR'), validate(createMedicalRecordSchema), createMedicalRecord);

router.route('/:id')
  .get(restrictTo('ADMIN', 'DOCTOR', 'NURSE', 'PATIENT', 'PHARMACIST', 'LAB_TECHNICIAN'), getMedicalRecordById)
  .delete(restrictTo('ADMIN'), deleteMedicalRecord);

module.exports = router;
