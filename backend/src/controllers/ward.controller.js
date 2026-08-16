const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');

/**
 * Creates a Ward (e.g. ICU, Pediatric)
 */
const createWard = async (req, res, next) => {
  try {
    const { name, floor, type } = req.body;

    const ward = await prisma.ward.create({
      data: { name, floor, type }
    });

    res.status(201).json({
      success: true,
      message: 'Ward created successfully.',
      ward
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Creates a Bed inside a Ward
 */
const createBed = async (req, res, next) => {
  try {
    const { wardId, number } = req.body;

    // Verify ward exists
    const ward = await prisma.ward.findUnique({ where: { id: wardId } });
    if (!ward) return next(new AppError('Ward not found.', 404));

    const bed = await prisma.bed.create({
      data: { wardId, number, isAvailable: true }
    });

    res.status(201).json({
      success: true,
      message: `Bed ${number} added to Ward successfully.`,
      bed
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Gets a Floor/Ward map with full Bed Grid View (Real-time availability status)
 */
const getWardBedGrid = async (req, res, next) => {
  try {
    const wards = await prisma.ward.findMany({
      include: {
        beds: {
          orderBy: { number: 'asc' },
          include: {
            admissions: {
              where: { status: 'ACTIVE' },
              include: {
                patient: true
              }
            }
          }
        }
      },
      orderBy: { floor: 'asc' }
    });

    // Aggregate statistics
    let totalBeds = 0;
    let availableBeds = 0;

    wards.forEach((w) => {
      w.beds.forEach((b) => {
        totalBeds++;
        if (b.isAvailable) availableBeds++;
      });
    });

    res.status(200).json({
      success: true,
      stats: {
        totalBeds,
        availableBeds,
        occupiedBeds: totalBeds - availableBeds
      },
      wards
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admits a Patient to a specific Bed (Occupies bed)
 */
const admitPatient = async (req, res, next) => {
  try {
    const { patientId, bedId, reason } = req.body;

    // 1. Verify patient & bed
    const [patient, bed] = await Promise.all([
      prisma.patient.findUnique({ where: { id: patientId } }),
      prisma.bed.findUnique({ where: { id: bedId } })
    ]);

    if (!patient) return next(new AppError('Patient profile not found.', 404));
    if (!bed) return next(new AppError('Bed not found.', 404));

    // 2. Check if bed is available
    if (!bed.isAvailable) {
      return next(new AppError('The requested bed is already occupied.', 400));
    }

    // 3. Check if patient is already admitted
    const activeAdmission = await prisma.admission.findFirst({
      where: { patientId, status: 'ACTIVE' }
    });
    if (activeAdmission) {
      return next(new AppError('Patient is already admitted to another bed.', 400));
    }

    // 4. Perform Admission in a transaction
    const admission = await prisma.$transaction(async (tx) => {
      // Create admission record
      const adm = await tx.admission.create({
        data: {
          patientId,
          bedId,
          reason,
          status: 'ACTIVE'
        }
      });

      // Update Bed to not available
      await tx.bed.update({
        where: { id: bedId },
        data: { isAvailable: false }
      });

      return adm;
    });

    res.status(201).json({
      success: true,
      message: 'Patient admitted successfully.',
      admission
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Discharges a Patient from their Bed (Frees bed)
 */
const dischargePatient = async (req, res, next) => {
  try {
    const { admissionId } = req.params;

    // 1. Find admission
    const admission = await prisma.admission.findUnique({
      where: { id: admissionId },
      include: { bed: true }
    });

    if (!admission) return next(new AppError('Admission record not found.', 404));
    if (admission.status === 'DISCHARGED') {
      return next(new AppError('Patient has already been discharged.', 400));
    }

    // 2. Free Bed & Discharge in a transaction
    await prisma.$transaction([
      prisma.admission.update({
        where: { id: admissionId },
        data: {
          dischargeDate: new Date(),
          status: 'DISCHARGED'
        }
      }),
      prisma.bed.update({
        where: { id: admission.bedId },
        data: { isAvailable: true }
      })
    ]);

    res.status(200).json({
      success: true,
      message: 'Patient discharged successfully. Bed is now available.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createWard,
  createBed,
  getWardBedGrid,
  admitPatient,
  dischargePatient
};
