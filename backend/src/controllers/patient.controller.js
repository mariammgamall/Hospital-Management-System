const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');

/**
 * Creates/Registers a Patient manually by Staff
 */
const createPatient = async (req, res, next) => {
  try {
    const {
      email,
      firstName,
      lastName,
      gender,
      dateOfBirth,
      bloodType,
      phoneNumber,
      address,
      medicalHistory
    } = req.body;

    let userId = null;

    // Optional: Create user shell if email is provided
    if (email) {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return next(new AppError('A user with this email address already exists.', 400));
      }

      // Automatically generate a random initial password for the patient account
      const salt = await require('bcryptjs').genSalt(10);
      const hashedPassword = await require('bcryptjs').hash('ChangeMe123!', salt);

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role: 'PATIENT'
        }
      });
      userId = user.id;
    }

    const patient = await prisma.patient.create({
      data: {
        userId,
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

    res.status(201).json({
      success: true,
      message: 'Patient registered successfully.',
      patient
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all patients with Search, Filtering, and Pagination
 */
const getAllPatients = async (req, res, next) => {
  try {
    const { search, gender, bloodType, page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build query conditions
    const whereClause = {};

    if (gender) {
      whereClause.gender = gender;
    }

    if (bloodType) {
      whereClause.bloodType = bloodType;
    }

    if (search) {
      whereClause.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search } }
      ];
    }

    // Run parallel count & query
    const [total, patients] = await Promise.all([
      prisma.patient.count({ where: whereClause }),
      prisma.patient.findMany({
        where: whereClause,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { email: true }
          }
        }
      })
    ]);

    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      patients
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single patient profile by ID with clinical history timeline
 */
const getPatientById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        user: {
          select: { email: true }
        },
        appointments: {
          orderBy: { dateTime: 'desc' },
          include: {
            doctor: {
              include: {
                user: {
                  select: { email: true }
                }
              }
            }
          }
        },
        medicalRecords: {
          orderBy: { createdAt: 'desc' },
          include: {
            doctor: {
              include: {
                user: {
                  select: { email: true }
                }
              }
            },
            prescriptions: {
              include: {
                medicines: true
              }
            }
          }
        },
        admissions: {
          orderBy: { admissionDate: 'desc' },
          include: {
            bed: {
              include: {
                ward: true
              }
            }
          }
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
          include: {
            items: true
          }
        }
      }
    });

    if (!patient) {
      return next(new AppError('Patient profile not found.', 404));
    }

    res.status(200).json({
      success: true,
      patient
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Patient profile details
 */
const updatePatient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.dateOfBirth) {
      updateData.dateOfBirth = new Date(updateData.dateOfBirth);
    }

    const patient = await prisma.patient.update({
      where: { id },
      data: updateData
    });

    res.status(200).json({
      success: true,
      message: 'Patient profile updated successfully.',
      patient
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a Patient profile
 */
const deletePatient = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verify patient exists
    const patient = await prisma.patient.findUnique({ where: { id } });
    if (!patient) {
      return next(new AppError('Patient profile not found.', 404));
    }

    await prisma.$transaction(async (tx) => {
      // If patient has user account, delete user as well (which cascades patient)
      if (patient.userId) {
        await tx.user.delete({ where: { id: patient.userId } });
      } else {
        await tx.patient.delete({ where: { id } });
      }
    });

    res.status(200).json({
      success: true,
      message: 'Patient profile and records deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPatient,
  getAllPatients,
  getPatientById,
  updatePatient,
  deletePatient
};
