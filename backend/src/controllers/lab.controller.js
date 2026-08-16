const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');

/**
 * Get lab test orders
 */
const getLabTests = async (req, res, next) => {
  try {
    let whereClause = {};

    // Patient role restricts viewing to own lab tests
    if (req.user.role === 'PATIENT') {
      if (!req.user.patientProfile) {
        return res.status(200).json({ status: 'success', data: [] });
      }
      whereClause.patientId = req.user.patientProfile.id;
    }

    const tests = await prisma.labTest.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ status: 'success', data: tests });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new lab test order
 */
const createLabTest = async (req, res, next) => {
  try {
    const { patientId, patientName, testName, category, referenceRange, unit, notes } = req.body;

    let doctorId = null;
    let doctorName = null;

    if (req.user.role === 'DOCTOR' && req.user.doctorProfile) {
      doctorId = req.user.doctorProfile.id;
      doctorName = req.user.doctorProfile.contactInfo || req.user.email;
    } else {
      doctorName = req.user.email;
    }

    const labTest = await prisma.labTest.create({
      data: {
        patientId,
        patientName,
        doctorId,
        doctorName,
        testName,
        category: category || 'General Diagnostic',
        referenceRange,
        unit,
        notes,
        status: 'PENDING'
      }
    });

    res.status(201).json({ status: 'success', data: labTest });
  } catch (error) {
    next(error);
  }
};

/**
 * Update lab test result (Lab Technician or Admin)
 */
const updateLabTestResult = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { result, referenceRange, unit, notes, status, technicianName } = req.body;

    const updated = await prisma.labTest.update({
      where: { id },
      data: {
        ...(result !== undefined && { result }),
        ...(referenceRange !== undefined && { referenceRange }),
        ...(unit !== undefined && { unit }),
        ...(notes !== undefined && { notes }),
        ...(status !== undefined && { status }),
        technicianName: technicianName || req.user.email
      }
    });

    res.status(200).json({ status: 'success', data: updated });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLabTests,
  createLabTest,
  updateLabTestResult
};
