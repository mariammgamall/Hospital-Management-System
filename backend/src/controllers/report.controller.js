const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');

/**
 * Gets report statistics based on dates and filters
 */
const getReports = async (req, res, next) => {
  try {
    const { startDate, endDate, doctorId, departmentId } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default last 30 days
    const end = endDate ? new Date(endDate) : new Date();

    // 1. Appointment Summary Stats
    const appointmentFilter = {
      dateTime: {
        gte: start,
        lte: end
      }
    };
    if (doctorId) appointmentFilter.doctorId = doctorId;
    if (departmentId) {
      appointmentFilter.doctor = {
        departmentId
      };
    }

    const appointments = await prisma.appointment.findMany({
      where: appointmentFilter,
      select: { status: true, dateTime: true }
    });

    const appointmentSummary = {
      total: appointments.length,
      scheduled: appointments.filter((a) => a.status === 'SCHEDULED').length,
      confirmed: appointments.filter((a) => a.status === 'CONFIRMED').length,
      completed: appointments.filter((a) => a.status === 'COMPLETED').length,
      cancelled: appointments.filter((a) => a.status === 'CANCELLED').length
    };

    // 2. Revenue Summary Stats
    const invoiceFilter = {
      createdAt: {
        gte: start,
        lte: end
      }
    };
    if (doctorId) {
      invoiceFilter.appointment = {
        doctorId
      };
    }
    if (departmentId) {
      invoiceFilter.appointment = {
        doctor: {
          departmentId
        }
      };
    }

    const invoices = await prisma.invoice.findMany({
      where: invoiceFilter,
      select: { totalAmount: true, paidAmount: true, status: true }
    });

    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const totalCollected = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
    
    const revenueSummary = {
      totalInvoiced: totalRevenue,
      totalCollected,
      outstandingAmount: totalRevenue - totalCollected,
      paidCount: invoices.filter((i) => i.status === 'PAID').length,
      pendingCount: invoices.filter((i) => i.status === 'PENDING').length,
      partiallyPaidCount: invoices.filter((i) => i.status === 'PARTIALLY_PAID').length
    };

    // 3. Patient Statistics (Demographics - gender, blood types)
    const [genders, bloodTypes, totalPatients] = await Promise.all([
      prisma.patient.groupBy({
        by: ['gender'],
        _count: { gender: true }
      }),
      prisma.patient.groupBy({
        by: ['bloodType'],
        _count: { bloodType: true }
      }),
      prisma.patient.count()
    ]);

    const patientStats = {
      totalRegistered: totalPatients,
      genderDistribution: genders.map((g) => ({
        name: g.gender,
        count: g._count.gender
      })),
      bloodTypeDistribution: bloodTypes.map((bt) => ({
        name: bt.bloodType || 'Unknown',
        count: bt._count.bloodType
      }))
    };

    res.status(200).json({
      success: true,
      timeframe: {
        start,
        end
      },
      reports: {
        appointmentSummary,
        revenueSummary,
        patientStats
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReports
};
