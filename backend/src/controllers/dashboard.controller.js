const prisma = require('../utils/prisma');

/**
 * Gets role-specific dashboard KPIs, feed activities, and stats
 */
const getDashboardData = async (req, res, next) => {
  try {
    const { role } = req.user;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // 1. PATIENT DASHBOARD
    if (role === 'PATIENT') {
      const patientProfile = req.user.patientProfile;
      if (!patientProfile) {
        return res.status(200).json({
          success: true,
          role,
          message: 'No patient profile linked to this user account.',
          appointments: [],
          medicalRecords: [],
          prescriptions: [],
          invoices: []
        });
      }

      const [appointments, medicalRecords, prescriptions, invoices] = await Promise.all([
        prisma.appointment.findMany({
          where: { patientId: patientProfile.id },
          include: {
            doctor: {
              include: {
                user: {
                  select: { email: true }
                }
              }
            }
          },
          orderBy: { dateTime: 'asc' }
        }),
        prisma.medicalRecord.findMany({
          where: { patientId: patientProfile.id },
          include: {
            doctor: {
              include: {
                user: {
                  select: { email: true }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.prescription.findMany({
          where: { patientId: patientProfile.id },
          include: {
            doctor: {
              include: {
                user: {
                  select: { email: true }
                }
              }
            },
            medicines: true
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.invoice.findMany({
          where: { patientId: patientProfile.id },
          orderBy: { createdAt: 'desc' }
        })
      ]);

      return res.status(200).json({
        success: true,
        role,
        appointments,
        medicalRecords,
        prescriptions,
        invoices
      });
    }

    // 2. DOCTOR DASHBOARD
    if (role === 'DOCTOR') {
      const doctorProfile = req.user.doctorProfile;
      if (!doctorProfile) {
        return res.status(200).json({
          success: true,
          role,
          message: 'No doctor profile linked to this user account.',
          todayAppointments: [],
          patientsCount: 0,
          recentRecords: []
        });
      }

      const [todayAppointments, doctorAppointments, doctorRecords, recentRecords] = await Promise.all([
        prisma.appointment.findMany({
          where: {
            doctorId: doctorProfile.id,
            dateTime: {
              gte: startOfToday,
              lte: endOfToday
            }
          },
          include: { patient: true },
          orderBy: { dateTime: 'asc' }
        }),
        prisma.appointment.findMany({
          where: { doctorId: doctorProfile.id },
          select: { patientId: true }
        }),
        prisma.medicalRecord.findMany({
          where: { doctorId: doctorProfile.id },
          select: { patientId: true }
        }),
        prisma.medicalRecord.findMany({
          where: { doctorId: doctorProfile.id },
          take: 10,
          include: { patient: true },
          orderBy: { createdAt: 'desc' }
        })
      ]);

      // Calculate distinct patient count
      const patientIds = new Set([
        ...doctorAppointments.map(a => a.patientId),
        ...doctorRecords.map(r => r.patientId)
      ]);

      return res.status(200).json({
        success: true,
        role,
        todayAppointments,
        patientsCount: patientIds.size,
        recentRecords
      });
    }

    // 3. NURSE DASHBOARD
    if (role === 'NURSE') {
      const [availableBeds, activeAdmissions, wards] = await Promise.all([
        prisma.bed.count({ where: { isAvailable: true } }),
        prisma.admission.findMany({
          where: { status: 'ACTIVE' },
          include: {
            patient: true,
            bed: { include: { ward: true } }
          },
          orderBy: { admissionDate: 'desc' }
        }),
        prisma.ward.findMany({
          include: { beds: true }
        })
      ]);

      const wardStatus = wards.map(w => {
        const capacity = w.beds.length;
        const available = w.beds.filter(b => b.isAvailable).length;
        const occupied = capacity - available;
        const occupancyRate = capacity > 0 ? Math.round((occupied / capacity) * 100) : 0;
        return {
          id: w.id,
          name: w.name,
          capacity,
          available,
          occupancyRate
        };
      });

      return res.status(200).json({
        success: true,
        role,
        availableBeds,
        activeAdmissions,
        wardStatus
      });
    }

    // 4. RECEPTIONIST DASHBOARD
    if (role === 'RECEPTIONIST') {
      const [todayAppointments, recentPatients] = await Promise.all([
        prisma.appointment.findMany({
          where: {
            dateTime: {
              gte: startOfToday,
              lte: endOfToday
            }
          },
          include: {
            patient: true,
            doctor: {
              include: {
                user: { select: { email: true } }
              }
            }
          },
          orderBy: { dateTime: 'asc' }
        }),
        prisma.patient.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' }
        })
      ]);

      return res.status(200).json({
        success: true,
        role,
        todayAppointments,
        recentPatients
      });
    }

    // 5. ADMIN DASHBOARD (Renders everything)
    const [
      totalPatients,
      todayAppointmentsCount,
      availableBedsCount,
      invoicesToday
    ] = await Promise.all([
      prisma.patient.count(),
      prisma.appointment.count({
        where: {
          dateTime: {
            gte: startOfToday,
            lte: endOfToday
          },
          status: { in: ['SCHEDULED', 'CONFIRMED'] }
        }
      }),
      prisma.bed.count({ where: { isAvailable: true } }),
      prisma.invoice.findMany({
        where: {
          createdAt: {
            gte: startOfToday,
            lte: endOfToday
          }
        },
        select: { totalAmount: true }
      })
    ]);

    const revenueToday = invoicesToday.reduce((sum, inv) => sum + inv.totalAmount, 0);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const appointmentsLastWeek = await prisma.appointment.findMany({
      where: {
        dateTime: { gte: sevenDaysAgo }
      },
      select: { dateTime: true, status: true }
    });

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyAppointmentsChart = [];
    
    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(sevenDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
      const dayName = days[currentDay.getDay()];
      const dayString = currentDay.toLocaleDateString();
      
      const count = appointmentsLastWeek.filter((app) => {
        const appDate = new Date(app.dateTime);
        return appDate.toDateString() === currentDay.toDateString();
      }).length;

      weeklyAppointmentsChart.push({
        day: dayName,
        date: dayString,
        appointments: count
      });
    }

    const genderGroups = await prisma.patient.groupBy({
      by: ['gender'],
      _count: { gender: true }
    });

    const genderPieChart = genderGroups.map((g) => ({
      name: g.gender,
      value: g._count.gender
    }));

    const [recentAppointments, recentAdmissions, recentEMRs] = await Promise.all([
      prisma.appointment.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          patient: true,
          doctor: {
            include: {
              user: { select: { email: true } }
            }
          }
        }
      }),
      prisma.admission.findMany({
        take: 5,
        orderBy: { admissionDate: 'desc' },
        include: {
          patient: true,
          bed: { include: { ward: true } }
        }
      }),
      prisma.medicalRecord.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          patient: true,
          doctor: {
            include: {
              user: { select: { email: true } }
            }
          }
        }
      })
    ]);

    const activityFeed = [];

    recentAppointments.forEach((app) => {
      const name = app.doctor.contactInfo?.split(',')[0] || 'Doctor';
      activityFeed.push({
        id: `app-${app.id}`,
        type: 'APPOINTMENT',
        time: app.createdAt,
        title: `Appointment ${app.status.toLowerCase()}`,
        description: `Patient ${app.patient.firstName} ${app.patient.lastName} scheduled with ${name.startsWith('Dr.') ? name : 'Dr. ' + name} (${app.reason}).`
      });
    });

    recentAdmissions.forEach((adm) => {
      activityFeed.push({
        id: `adm-${adm.id}`,
        type: 'ADMISSION',
        time: adm.admissionDate,
        title: adm.status === 'ACTIVE' ? 'Patient Admitted' : 'Patient Discharged',
        description: `Patient ${adm.patient.firstName} ${adm.patient.lastName} ${adm.status === 'ACTIVE' ? 'admitted to' : 'discharged from'} Bed ${adm.bed.number} (${adm.bed.ward.name}).`
      });
    });

    recentEMRs.forEach((emr) => {
      const name = emr.doctor.contactInfo?.split(',')[0] || 'Doctor';
      activityFeed.push({
        id: `emr-${emr.id}`,
        type: 'CLINICAL',
        time: emr.createdAt,
        title: 'EMR Record Added',
        description: `Diagnosis of "${emr.diagnosis}" logged for patient ${emr.patient.firstName} ${emr.patient.lastName} by ${name.startsWith('Dr.') ? name : 'Dr. ' + name}.`
      });
    });

    activityFeed.sort((a, b) => new Date(b.time) - new Date(a.time));
    const finalFeed = activityFeed.slice(0, 10);

    return res.status(200).json({
      success: true,
      role,
      kpis: {
        totalPatients,
        todayAppointments: todayAppointmentsCount,
        availableBeds: availableBedsCount,
        revenueToday
      },
      charts: {
        weeklyAppointments: weeklyAppointmentsChart,
        patientGender: genderPieChart
      },
      activityFeed: finalFeed
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardData
};
