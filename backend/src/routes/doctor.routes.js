const express = require('express');
const router = express.Router();
const validate = require('../middleware/validator');
const { protect, restrictTo } = require('../middleware/auth');
const { createDoctorSchema } = require('../utils/validationSchemas');
const {
  createDoctor,
  getAllDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor
} = require('../controllers/doctor.controller');

router.use(protect);

router.route('/')
  .get(getAllDoctors)
  .post(restrictTo('ADMIN'), validate(createDoctorSchema), createDoctor);

router.route('/:id')
  .get(getDoctorById)
  .put(restrictTo('ADMIN', 'DOCTOR'), updateDoctor)
  .delete(restrictTo('ADMIN'), deleteDoctor);

module.exports = router;
