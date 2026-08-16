const express = require('express');
const router = express.Router();
const validate = require('../middleware/validator');
const { protect } = require('../middleware/auth');
const { loginSchema, registerPatientSchema } = require('../utils/validationSchemas');
const { registerPatient, login, refreshToken, getMe } = require('../controllers/auth.controller');

// Public Auth Endpoints
router.post('/register', validate(registerPatientSchema), registerPatient);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', refreshToken);

// Protected Auth Endpoints
router.get('/me', protect, getMe);

module.exports = router;
