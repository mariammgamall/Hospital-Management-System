const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');

/**
 * Creates/Generates a new Invoice manually
 */
const createInvoice = async (req, res, next) => {
  try {
    const { patientId, appointmentId, status, totalAmount, paidAmount, items } = req.body;

    // Verify patient
    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) return next(new AppError('Patient profile not found.', 404));

    const invoice = await prisma.invoice.create({
      data: {
        patientId,
        appointmentId: appointmentId || null,
        status: status || 'PENDING',
        totalAmount,
        paidAmount: paidAmount || 0,
        items: {
          create: items.map((item) => ({
            description: item.description,
            amount: item.amount
          }))
        }
      },
      include: {
        items: true,
        patient: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Invoice generated successfully.',
      invoice
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Gets all invoices with Filtering and Searches
 */
const getAllInvoices = async (req, res, next) => {
  try {
    const { status, patientId, search } = req.query;

    const whereClause = {};
    
    // Enforce data isolation if the logged-in user is a PATIENT
    if (req.user.role === 'PATIENT') {
      const patientProfileId = req.user.patientProfile?.id;
      if (!patientProfileId) {
        return res.status(200).json({
          success: true,
          invoices: []
        });
      }
      whereClause.patientId = patientProfileId;
    } else if (patientId) {
      whereClause.patientId = patientId;
    }

    if (status) whereClause.status = status;

    if (search) {
      whereClause.OR = [
        {
          patient: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } }
            ]
          }
        }
      ];
    }

    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      include: {
        patient: true,
        items: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      success: true,
      invoices
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Gets a single invoice by ID with line items detail
 */
const getInvoiceById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        patient: true,
        items: true,
        appointment: {
          include: {
            doctor: true
          }
        }
      }
    });

    if (!invoice) {
      return next(new AppError('Invoice not found.', 404));
    }

    // Enforce data isolation if the logged-in user is a PATIENT
    if (req.user.role === 'PATIENT') {
      const patientProfileId = req.user.patientProfile?.id;
      if (!patientProfileId || invoice.patientId !== patientProfileId) {
        return next(new AppError('You do not have permission to view this invoice.', 403));
      }
    }

    res.status(200).json({
      success: true,
      invoice
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Updates an Invoice Payment (e.g. marking as PAID or changing paid amount)
 */
const updateInvoicePayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { paidAmount } = req.body;

    const invoice = await prisma.invoice.findUnique({
      where: { id }
    });

    if (!invoice) return next(new AppError('Invoice not found.', 404));

    const newPaidAmount = parseFloat(paidAmount);
    let newStatus = 'PENDING';
    
    if (newPaidAmount >= invoice.totalAmount) {
      newStatus = 'PAID';
    } else if (newPaidAmount > 0) {
      newStatus = 'PARTIALLY_PAID';
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus
      },
      include: {
        patient: true
      }
    });

    res.status(200).json({
      success: true,
      message: `Invoice payment updated. Status set to ${newStatus}.`,
      invoice: updated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Deletes an Invoice
 */
const deleteInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) return next(new AppError('Invoice not found.', 404));

    await prisma.invoice.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: 'Invoice deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createInvoice,
  getAllInvoices,
  getInvoiceById,
  updateInvoicePayment,
  deleteInvoice
};
