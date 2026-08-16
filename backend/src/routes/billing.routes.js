const express = require('express');
const router = express.Router();
const validate = require('../middleware/validator');
const { protect, restrictTo } = require('../middleware/auth');
const { createInvoiceSchema } = require('../utils/validationSchemas');
const {
  createInvoice,
  getAllInvoices,
  getInvoiceById,
  updateInvoicePayment,
  deleteInvoice
} = require('../controllers/billing.controller');

router.use(protect);

router.route('/')
  .get(restrictTo('ADMIN', 'RECEPTIONIST', 'PATIENT', 'BILLING'), getAllInvoices)
  .post(restrictTo('ADMIN', 'RECEPTIONIST', 'BILLING'), validate(createInvoiceSchema), createInvoice);

router.route('/:id')
  .get(restrictTo('ADMIN', 'RECEPTIONIST', 'PATIENT', 'BILLING'), getInvoiceById)
  .delete(restrictTo('ADMIN'), deleteInvoice);

router.patch('/:id/pay', restrictTo('ADMIN', 'RECEPTIONIST', 'BILLING'), updateInvoicePayment);

module.exports = router;
