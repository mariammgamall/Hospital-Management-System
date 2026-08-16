const express = require('express');
const router = express.Router();
const validate = require('../middleware/validator');
const { protect, restrictTo } = require('../middleware/auth');
const { createStaffSchema } = require('../utils/validationSchemas');
const {
  createStaff,
  getAllStaff,
  updateStaff,
  deleteStaff
} = require('../controllers/staff.controller');

router.use(protect);
router.use(restrictTo('ADMIN'));

router.route('/')
  .get(getAllStaff)
  .post(validate(createStaffSchema), createStaff);

router.route('/:id')
  .put(updateStaff)
  .delete(deleteStaff);

module.exports = router;
