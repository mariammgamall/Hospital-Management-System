const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');

/**
 * Creates/Writes a Prescription
 */
const createPrescription = async (req, res, next) => {
  try {
    const { medicalRecordId, patientId, doctorId, medicines } = req.body;

    // Check if patient and doctor exist
    const [patient, doctor] = await Promise.all([
      prisma.patient.findUnique({ where: { id: patientId } }),
      prisma.doctor.findUnique({ where: { id: doctorId } })
    ]);

    if (!patient) return next(new AppError('Patient profile not found.', 404));
    if (!doctor) return next(new AppError('Doctor profile not found.', 404));

    // Create prescription with medicines in transaction
    const prescription = await prisma.prescription.create({
      data: {
        medicalRecordId: medicalRecordId || null,
        patientId,
        doctorId,
        medicines: {
          create: medicines.map((m) => ({
            name: m.name,
            dosage: m.dosage,
            frequency: m.frequency,
            duration: m.duration
          }))
        }
      },
      include: {
        medicines: true,
        patient: true,
        doctor: true
      }
    });

    // Auto-update invoice to add medicine billing if appropriate (optional)
    // We can fetch active invoices for this patient's visits and insert medicine items
    if (medicalRecordId) {
      const record = await prisma.medicalRecord.findUnique({
        where: { id: medicalRecordId }
      });
      if (record && record.appointmentId) {
        const invoice = await prisma.invoice.findUnique({
          where: { appointmentId: record.appointmentId }
        });
        if (invoice) {
          const medTotal = medicines.length * 15.00; // Mock standard price per medicine
          await prisma.$transaction([
            prisma.invoiceItem.createMany({
              data: medicines.map((m) => ({
                invoiceId: invoice.id,
                description: `Prescribed: ${m.name} (${m.dosage})`,
                amount: 15.00
              }))
            }),
            prisma.invoice.update({
              where: { id: invoice.id },
              data: {
                totalAmount: { increment: medTotal }
              }
            })
          ]);
        }
      }
    }

    res.status(201).json({
      success: true,
      message: 'Prescription written successfully.',
      prescription
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Gets all prescriptions (filter by patientId / doctorId)
 */
const getAllPrescriptions = async (req, res, next) => {
  try {
    const { patientId, doctorId } = req.query;

    const whereClause = {};
    
    // Enforce data isolation if the logged-in user is a PATIENT
    if (req.user.role === 'PATIENT') {
      const patientProfileId = req.user.patientProfile?.id;
      if (!patientProfileId) {
        return res.status(200).json({
          success: true,
          prescriptions: []
        });
      }
      whereClause.patientId = patientProfileId;
    } else if (patientId) {
      whereClause.patientId = patientId;
    }

    if (doctorId) whereClause.doctorId = doctorId;

    const prescriptions = await prisma.prescription.findMany({
      where: whereClause,
      include: {
        medicines: true,
        patient: true,
        doctor: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      success: true,
      prescriptions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Gets a single prescription by ID
 */
const getPrescriptionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const prescription = await prisma.prescription.findUnique({
      where: { id },
      include: {
        medicines: true,
        patient: true,
        doctor: {
          include: {
            department: true
          }
        }
      }
    });

    if (!prescription) {
      return next(new AppError('Prescription not found.', 404));
    }

    // Enforce data isolation if the logged-in user is a PATIENT
    if (req.user.role === 'PATIENT') {
      const patientProfileId = req.user.patientProfile?.id;
      if (!patientProfileId || prescription.patientId !== patientProfileId) {
        return next(new AppError('You do not have permission to view this prescription.', 403));
      }
    }

    res.status(200).json({
      success: true,
      prescription
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Deletes a prescription record
 */
const deletePrescription = async (req, res, next) => {
  try {
    const { id } = req.params;

    const rx = await prisma.prescription.findUnique({ where: { id } });
    if (!rx) return next(new AppError('Prescription record not found.', 404));

    await prisma.prescription.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: 'Prescription record deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPrescription,
  getAllPrescriptions,
  getPrescriptionById,
  deletePrescription
};
