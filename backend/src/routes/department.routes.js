const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const {
  createDepartment,
  getAllDepartments,
  deleteDepartment
} = require('../controllers/department.controller');

router.use(protect);

router.route('/')
  .get(getAllDepartments)
  .post(restrictTo('ADMIN'), createDepartment);

router.delete('/:id', restrictTo('ADMIN'), deleteDepartment);

module.exports = router;
