const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');

/**
 * Creates/Registers a new Doctor profile
 */
const createDoctor = async (req, res, next) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      specialty,
      departmentId,
      contactInfo,
      schedule
    } = req.body;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return next(new AppError('A user with this email address already exists.', 400));
    }

    // Verify department exists
    const dept = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!dept) {
      return next(new AppError('The specified department does not exist.', 404));
    }

    // Hash the password
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create User & Doctor profile in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role: 'DOCTOR'
        }
      });

      const doctorName = `Dr. ${firstName} ${lastName}`;
      const doctor = await tx.doctor.create({
        data: {
          userId: user.id,
          specialty,
          departmentId,
          contactInfo: contactInfo || doctorName,
          schedule: schedule || {}
        }
      });

      return { user, doctor };
    });

    res.status(201).json({
      success: true,
      message: 'Doctor account and profile created successfully.',
      doctor: result.doctor
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Gets all doctors with filtering and search
 */
const getAllDoctors = async (req, res, next) => {
  try {
    const { search, specialty, departmentId } = req.query;

    const whereClause = {};

    if (specialty) {
      whereClause.specialty = { contains: specialty, mode: 'insensitive' };
    }

    if (departmentId) {
      whereClause.departmentId = departmentId;
    }

    if (search) {
      whereClause.OR = [
        { specialty: { contains: search, mode: 'insensitive' } },
        { contactInfo: { contains: search, mode: 'insensitive' } },
        {
          department: {
            name: { contains: search, mode: 'insensitive' }
          }
        }
      ];
    }

    const doctors = await prisma.doctor.findMany({
      where: whereClause,
      include: {
        department: true,
        user: {
          select: { email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      success: true,
      doctors
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Gets a single Doctor profile by ID with upcoming appointments list
 */
const getDoctorById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const doctor = await prisma.doctor.findUnique({
      where: { id },
      include: {
        department: true,
        user: {
          select: { email: true }
        },
        appointments: {
          orderBy: { dateTime: 'asc' },
          include: {
            patient: true
          }
        }
      }
    });

    if (!doctor) {
      return next(new AppError('Doctor profile not found.', 404));
    }

    res.status(200).json({
      success: true,
      doctor
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Updates a Doctor profile
 */
const updateDoctor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { specialty, departmentId, contactInfo, schedule } = req.body;

    const updateData = {};
    if (specialty) updateData.specialty = specialty;
    if (contactInfo) updateData.contactInfo = contactInfo;
    if (schedule) updateData.schedule = schedule;

    if (departmentId) {
      const dept = await prisma.department.findUnique({ where: { id: departmentId } });
      if (!dept) {
        return next(new AppError('The specified department does not exist.', 404));
      }
      updateData.departmentId = departmentId;
    }

    const doctor = await prisma.doctor.update({
      where: { id },
      data: updateData,
      include: {
        department: true
      }
    });

    res.status(200).json({
      success: true,
      message: 'Doctor profile updated successfully.',
      doctor
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Deletes a Doctor account and profile
 */
const deleteDoctor = async (req, res, next) => {
  try {
    const { id } = req.params;

    const doctor = await prisma.doctor.findUnique({ where: { id } });
    if (!doctor) {
      return next(new AppError('Doctor profile not found.', 404));
    }

    // Cascade delete of User record (which cascade-deletes the doctor)
    await prisma.user.delete({ where: { id: doctor.userId } });

    res.status(200).json({
      success: true,
      message: 'Doctor account and profile deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDoctor,
  getAllDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor
};
