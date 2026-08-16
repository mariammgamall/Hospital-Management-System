const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');

const JWT_SECRET = process.env.JWT_SECRET || 'hms_super_secret_access_token_key_12345!';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'hms_super_secret_refresh_token_key_54321!';
const JWT_ACCESS_EXPIRATION = process.env.JWT_ACCESS_EXPIRATION || '15m';
const JWT_REFRESH_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION || '7d';

const signAccessToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_ACCESS_EXPIRATION });
};

const signRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRATION });
};

/**
 * Registers a new patient
 */
const registerPatient = async (req, res, next) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      gender,
      dateOfBirth,
      bloodType,
      phoneNumber,
      address,
      medicalHistory
    } = req.body;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return next(new AppError('A user with this email address already exists.', 400));
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user and patient profile in a transactional run
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role: 'PATIENT'
        }
      });

      const patient = await tx.patient.create({
        data: {
          userId: user.id,
          firstName,
          lastName,
          gender,
          dateOfBirth: new Date(dateOfBirth),
          bloodType,
          phoneNumber,
          address,
          medicalHistory
        }
      });

      return { user, patient };
    });

    // Generate JWT access and refresh tokens
    const accessToken = signAccessToken(result.user.id);
    const refreshToken = signRefreshToken(result.user.id);

    res.status(201).json({
      success: true,
      message: 'Patient registered successfully.',
      accessToken,
      refreshToken,
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        patientProfileId: result.patient.id,
        firstName: result.patient.firstName,
        lastName: result.patient.lastName
      }
    });
  } catch (error) {
    next(error);
  }
};

const { autoSeedDefaultUsers } = require('../utils/autoSeed');

/**
 * Logs in users of all roles
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const formattedEmail = (email || '').trim().toLowerCase();

    // Auto Seed check for fresh/empty cloud database
    try {
      const totalUsers = await prisma.user.count();
      if (totalUsers === 0) {
        await autoSeedDefaultUsers();
      }
    } catch (dbErr) {
      console.log('Database count check notice (auto-seeding if tables created):', dbErr.message);
    }

    // Check user email (case-insensitive)
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: formattedEmail,
          mode: 'insensitive'
        }
      },
      include: {
        patientProfile: true,
        doctorProfile: true,
        staffProfile: true
      }
    });

    if (!user) {
      return next(new AppError('Invalid email or password.', 401));
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return next(new AppError('Invalid email or password.', 401));
    }

    // Generate JWTs
    const accessToken = signAccessToken(user.id);
    const refreshToken = signRefreshToken(user.id);

    // Extract display profile info
    let profileData = {};
    if (user.role === 'PATIENT' && user.patientProfile) {
      profileData = {
        patientProfileId: user.patientProfile.id,
        firstName: user.patientProfile.firstName,
        lastName: user.patientProfile.lastName
      };
    } else if (user.role === 'DOCTOR' && user.doctorProfile) {
      profileData = {
        doctorProfileId: user.doctorProfile.id,
        firstName: user.doctorProfile.contactInfo ? user.doctorProfile.contactInfo.split(',')[0] : 'Dr.',
        lastName: 'Doctor'
      };
    } else if (user.staffProfile) {
      profileData = {
        staffProfileId: user.staffProfile.id,
        firstName: user.staffProfile.firstName,
        lastName: user.staffProfile.lastName
      };
    } else {
      profileData = {
        firstName: 'System',
        lastName: 'Admin'
      };
    }

    res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        ...profileData
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh expired access tokens
 */
const refreshToken = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return next(new AppError('Refresh token is required.', 400));
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_REFRESH_SECRET);
    } catch (err) {
      return next(new AppError('Invalid or expired refresh token. Please login again.', 401));
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user) {
      return next(new AppError('User belonging to refresh token no longer exists.', 401));
    }

    const accessToken = signAccessToken(user.id);
    const newRefreshToken = signRefreshToken(user.id);

    res.status(200).json({
      success: true,
      accessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Gets authenticated user details
 */
const getMe = async (req, res, next) => {
  try {
    const user = req.user;
    
    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        patientProfile: user.patientProfile,
        doctorProfile: user.doctorProfile,
        staffProfile: user.staffProfile
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerPatient,
  login,
  refreshToken,
  getMe
};
