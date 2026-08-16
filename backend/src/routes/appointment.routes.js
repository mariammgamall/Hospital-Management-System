const express = require('express');
const router = express.Router();
const validate = require('../middleware/validator');
const { protect, restrictTo } = require('../middleware/auth');
const { createAppointmentSchema } = require('../utils/validationSchemas');
const {
  bookAppointment,
  getAllAppointments,
  updateAppointmentStatus,
  deleteAppointment
} = require('../controllers/appointment.controller');

router.use(protect);

router.route('/')
  .get(getAllAppointments)
  .post(validate(createAppointmentSchema), bookAppointment);

router.patch('/:id/status', restrictTo('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'), updateAppointmentStatus);
router.delete('/:id', restrictTo('ADMIN', 'RECEPTIONIST'), deleteAppointment);

module.exports = router;
