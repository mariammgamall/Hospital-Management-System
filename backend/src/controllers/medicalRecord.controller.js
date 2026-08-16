const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');

/**
 * Creates a Medical Record (EMR)
 */
const createMedicalRecord = async (req, res, next) => {
  try {
    const { patientId, doctorId, appointmentId, diagnosis, symptoms, notes } = req.body;

    // Check if appointment is specified and already has EMR
    if (appointmentId) {
      const existingRecord = await prisma.medicalRecord.findUnique({
        where: { appointmentId }
      });
      if (existingRecord) {
        return next(new AppError('A medical record already exists for this appointment.', 400));
      }
    }

    const record = await prisma.medicalRecord.create({
      data: {
        patientId,
        doctorId,
        appointmentId: appointmentId || null,
        diagnosis,
        symptoms,
        notes
      },
      include: {
        patient: true,
        doctor: true
      }
    });

    // If appointment is specified, automatically update its status to COMPLETED
    if (appointmentId) {
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: 'COMPLETED' }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Medical record created successfully.',
      record
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Gets all medical records (filters by patient/doctor)
 */
const getAllMedicalRecords = async (req, res, next) => {
  try {
    const { patientId, doctorId } = req.query;

    const whereClause = {};
    
    // Enforce data isolation if the logged-in user is a PATIENT
    if (req.user.role === 'PATIENT') {
      const patientProfileId = req.user.patientProfile?.id;
      if (!patientProfileId) {
        return res.status(200).json({
          success: true,
          records: []
        });
      }
      whereClause.patientId = patientProfileId;
    } else if (patientId) {
      whereClause.patientId = patientId;
    }

    if (doctorId) whereClause.doctorId = doctorId;

    const records = await prisma.medicalRecord.findMany({
      where: whereClause,
      include: {
        patient: true,
        doctor: true,
        prescriptions: {
          include: {
            medicines: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      success: true,
      records
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Gets a single medical record by ID
 */
const getMedicalRecordById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const record = await prisma.medicalRecord.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: true,
        prescriptions: {
          include: {
            medicines: true
          }
        }
      }
    });

    if (!record) {
      return next(new AppError('Medical record not found.', 404));
    }

    // Enforce data isolation if the logged-in user is a PATIENT
    if (req.user.role === 'PATIENT') {
      const patientProfileId = req.user.patientProfile?.id;
      if (!patientProfileId || record.patientId !== patientProfileId) {
        return next(new AppError('You do not have permission to view this medical record.', 403));
      }
    }

    res.status(200).json({
      success: true,
      record
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Deletes a medical record
 */
const deleteMedicalRecord = async (req, res, next) => {
  try {
    const { id } = req.params;

    const record = await prisma.medicalRecord.findUnique({ where: { id } });
    if (!record) return next(new AppError('Medical record not found.', 404));

    await prisma.medicalRecord.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: 'Medical record deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createMedicalRecord,
  getAllMedicalRecords,
  getMedicalRecordById,
  deleteMedicalRecord
};
