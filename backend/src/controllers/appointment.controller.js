const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');

/**
 * Books a new appointment with slot conflict checks
 */
const bookAppointment = async (req, res, next) => {
  try {
    const { patientId, doctorId, dateTime, reason } = req.body;
    const bookingDate = new Date(dateTime);

    // Enforce data isolation if the logged-in user is a PATIENT
    if (req.user.role === 'PATIENT') {
      const patientProfileId = req.user.patientProfile?.id;
      if (!patientProfileId || patientId !== patientProfileId) {
        return next(new AppError('You do not have permission to book an appointment for another patient.', 403));
      }
    }

    // 1. Verify patient & doctor exist
    const [patient, doctor] = await Promise.all([
      prisma.patient.findUnique({ where: { id: patientId } }),
      prisma.doctor.findUnique({ where: { id: doctorId } })
    ]);

    if (!patient) return next(new AppError('Patient profile not found.', 404));
    if (!doctor) return next(new AppError('Doctor profile not found.', 404));

    // 2. Conflict detection: Doctor can't have double booking within 30 minutes slot buffer
    const slotStart = new Date(bookingDate.getTime() - 29 * 60 * 1000);
    const slotEnd = new Date(bookingDate.getTime() + 29 * 60 * 1000);

    const conflictingBooking = await prisma.appointment.findFirst({
      where: {
        doctorId,
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
        dateTime: {
          gte: slotStart,
          lte: slotEnd
        }
      }
    });

    if (conflictingBooking) {
      return next(new AppError('Time slot conflict detected. Doctor already has an active appointment within 30 minutes of this slot.', 409));
    }

    // 3. Create the appointment
    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId,
        dateTime: bookingDate,
        reason,
        status: 'SCHEDULED'
      },
      include: {
        patient: true,
        doctor: {
          include: {
            department: true
          }
        }
      }
    });

    // 4. Create invoice stub automatically (optional but helpful for billing integration)
    // Consists of initial doctor consultation invoice
    await prisma.invoice.create({
      data: {
        patientId,
        appointmentId: appointment.id,
        status: 'PENDING',
        totalAmount: 150.00, // Standard consultation fee
        paidAmount: 0.0,
        items: {
          create: {
            description: 'Standard Doctor Consultation Fee',
            amount: 150.00
          }
        }
      }
    });

    // 5. Create notification for doctor
    await prisma.notification.create({
      data: {
        userId: doctor.userId,
        title: 'New Appointment Scheduled',
        message: `Patient ${patient.firstName} ${patient.lastName} has scheduled an appointment on ${bookingDate.toLocaleString()}.`
      }
    });

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully.',
      appointment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all appointments with Filters, Search, and Date Range queries
 */
const getAllAppointments = async (req, res, next) => {
  try {
    const { doctorId, patientId, status, startDate, endDate, search } = req.query;

    const whereClause = {};

    // Enforce data isolation if the logged-in user is a PATIENT
    if (req.user.role === 'PATIENT') {
      const patientProfileId = req.user.patientProfile?.id;
      if (!patientProfileId) {
        return res.status(200).json({
          success: true,
          appointments: []
        });
      }
      whereClause.patientId = patientProfileId;
    } else if (patientId) {
      whereClause.patientId = patientId;
    }

    if (doctorId) whereClause.doctorId = doctorId;
    if (status) whereClause.status = status;

    if (startDate || endDate) {
      whereClause.dateTime = {};
      if (startDate) whereClause.dateTime.gte = new Date(startDate);
      if (endDate) whereClause.dateTime.lte = new Date(endDate);
    }

    if (search) {
      whereClause.OR = [
        { reason: { contains: search, mode: 'insensitive' } },
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

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        patient: true,
        doctor: {
          include: {
            department: true
          }
        },
        invoice: true
      },
      orderBy: { dateTime: 'asc' }
    });

    res.status(200).json({
      success: true,
      appointments
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Updates Appointment Status (SCHEDULED -> CONFIRMED -> COMPLETED -> CANCELLED)
 */
const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { patient: true, doctor: true }
    });

    if (!appointment) {
      return next(new AppError('Appointment not found.', 404));
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status },
      include: { patient: true, doctor: true }
    });

    // Create notifications for patients/doctors on cancellations/confirmations
    const recipientUserId = status === 'CANCELLED' ? appointment.doctor.userId : appointment.patient.userId;
    if (recipientUserId) {
      await prisma.notification.create({
        data: {
          userId: recipientUserId,
          title: `Appointment ${status.charAt(0) + status.slice(1).toLowerCase()}`,
          message: `Your appointment originally scheduled for ${appointment.dateTime.toLocaleString()} is now ${status.toLowerCase()}.`
        }
      });
    }

    res.status(200).json({
      success: true,
      message: `Appointment status updated to ${status}.`,
      appointment: updated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Deletes an Appointment
 */
const deleteAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const appointment = await prisma.appointment.findUnique({ where: { id } });
    if (!appointment) return next(new AppError('Appointment not found.', 404));

    await prisma.appointment.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: 'Appointment record deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  bookAppointment,
  getAllAppointments,
  updateAppointmentStatus,
  deleteAppointment
};
