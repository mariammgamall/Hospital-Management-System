const bcrypt = require('bcryptjs');
const prisma = require('./prisma');

async function autoSeedDefaultUsers() {
  try {
    console.log('Checking database seed state...');

    const salt = bcrypt.genSaltSync(10);
    const commonPasswordHash = bcrypt.hashSync('Password@123', salt);

    // 1. Ensure Departments exist using upsert
    const cardiology = await prisma.department.upsert({
      where: { name: 'Cardiology' },
      update: {},
      create: { name: 'Cardiology', description: 'Specialized diagnosis and treatment of heart conditions.' }
    });
    const pediatrics = await prisma.department.upsert({
      where: { name: 'Pediatrics' },
      update: {},
      create: { name: 'Pediatrics', description: 'Medical care for infants, children, and adolescents.' }
    });
    const generalPractice = await prisma.department.upsert({
      where: { name: 'General Practice' },
      update: {},
      create: { name: 'General Practice', description: 'Comprehensive primary care and wellness plans.' }
    });
    const icuDept = await prisma.department.upsert({
      where: { name: 'ICU' },
      update: {},
      create: { name: 'ICU', description: 'Intensive care unit for critically ill patients.' }
    });

    // 2. Admin User
    await prisma.user.upsert({
      where: { email: 'admin@caresync.com' },
      update: { password: commonPasswordHash },
      create: {
        email: 'admin@caresync.com',
        password: commonPasswordHash,
        role: 'ADMIN'
      }
    });

    // 3. Doctors
    const doc1User = await prisma.user.upsert({
      where: { email: 'doctor.ahmed@caresync.com' },
      update: { password: commonPasswordHash },
      create: { email: 'doctor.ahmed@caresync.com', password: commonPasswordHash, role: 'DOCTOR' }
    });
    const doc1 = await prisma.doctor.upsert({
      where: { userId: doc1User.id },
      update: {},
      create: {
        userId: doc1User.id,
        specialty: 'Cardiology',
        departmentId: cardiology.id,
        contactInfo: 'Dr. Ahmed Mostafa, Tel: 01012345678',
        schedule: { monday: ['09:00-17:00'], wednesday: ['09:00-17:00'] }
      }
    });

    const doc2User = await prisma.user.upsert({
      where: { email: 'doctor.mona@caresync.com' },
      update: { password: commonPasswordHash },
      create: { email: 'doctor.mona@caresync.com', password: commonPasswordHash, role: 'DOCTOR' }
    });
    await prisma.doctor.upsert({
      where: { userId: doc2User.id },
      update: {},
      create: {
        userId: doc2User.id,
        specialty: 'Pediatrics',
        departmentId: pediatrics.id,
        contactInfo: 'Dr. Mona Hassan, Tel: 01187654321',
        schedule: { tuesday: ['08:00-16:00'], thursday: ['08:00-16:00'] }
      }
    });

    const doc3User = await prisma.user.upsert({
      where: { email: 'doctor.khaled@caresync.com' },
      update: { password: commonPasswordHash },
      create: { email: 'doctor.khaled@caresync.com', password: commonPasswordHash, role: 'DOCTOR' }
    });
    await prisma.doctor.upsert({
      where: { userId: doc3User.id },
      update: {},
      create: {
        userId: doc3User.id,
        specialty: 'Family Medicine',
        departmentId: generalPractice.id,
        contactInfo: 'Dr. Khaled Ibrahim, Tel: 01223456789',
        schedule: { monday: ['09:00-17:00'], friday: ['14:00-17:00'] }
      }
    });

    // 4. Staff (Nurse, Receptionist, Pharmacist, Lab Tech, Billing)
    const nurseUser = await prisma.user.upsert({
      where: { email: 'nurse@caresync.com' },
      update: { password: commonPasswordHash },
      create: { email: 'nurse@caresync.com', password: commonPasswordHash, role: 'NURSE' }
    });
    await prisma.staff.upsert({
      where: { userId: nurseUser.id },
      update: {},
      create: { userId: nurseUser.id, firstName: 'Fatma', lastName: 'Ali', departmentId: icuDept.id }
    });

    const recepUser = await prisma.user.upsert({
      where: { email: 'receptionist@caresync.com' },
      update: { password: commonPasswordHash },
      create: { email: 'receptionist@caresync.com', password: commonPasswordHash, role: 'RECEPTIONIST' }
    });
    await prisma.staff.upsert({
      where: { userId: recepUser.id },
      update: {},
      create: { userId: recepUser.id, firstName: 'Omar', lastName: 'Tarek', departmentId: generalPractice.id }
    });

    const pharmUser = await prisma.user.upsert({
      where: { email: 'pharmacist@caresync.com' },
      update: { password: commonPasswordHash },
      create: { email: 'pharmacist@caresync.com', password: commonPasswordHash, role: 'PHARMACIST' }
    });
    await prisma.staff.upsert({
      where: { userId: pharmUser.id },
      update: {},
      create: { userId: pharmUser.id, firstName: 'Youssef', lastName: 'Nabil', departmentId: generalPractice.id }
    });

    const labtechUser = await prisma.user.upsert({
      where: { email: 'labtech@caresync.com' },
      update: { password: commonPasswordHash },
      create: { email: 'labtech@caresync.com', password: commonPasswordHash, role: 'LAB_TECHNICIAN' }
    });
    await prisma.staff.upsert({
      where: { userId: labtechUser.id },
      update: {},
      create: { userId: labtechUser.id, firstName: 'Sherif', lastName: 'Hossam', departmentId: generalPractice.id }
    });

    const billingUser = await prisma.user.upsert({
      where: { email: 'billing@caresync.com' },
      update: { password: commonPasswordHash },
      create: { email: 'billing@caresync.com', password: commonPasswordHash, role: 'BILLING' }
    });
    await prisma.staff.upsert({
      where: { userId: billingUser.id },
      update: {},
      create: { userId: billingUser.id, firstName: 'Noha', lastName: 'Mahmoud', departmentId: generalPractice.id }
    });

    // 5. Patients
    const pat1User = await prisma.user.upsert({
      where: { email: 'mariam@caresync.com' },
      update: { password: commonPasswordHash },
      create: { email: 'mariam@caresync.com', password: commonPasswordHash, role: 'PATIENT' }
    });
    const patient1 = await prisma.patient.upsert({
      where: { userId: pat1User.id },
      update: {},
      create: {
        userId: pat1User.id,
        firstName: 'Mariam',
        lastName: 'Gamal',
        gender: 'Female',
        dateOfBirth: new Date('2005-10-05'),
        bloodType: 'O+',
        phoneNumber: '01280873442',
        address: '15 El-Nasr Rd, Nasr City, Cairo',
        medicalHistory: 'History of seasonal asthma. Mild Hypertension.'
      }
    });

    const pat2User = await prisma.user.upsert({
      where: { email: 'shehab@caresync.com' },
      update: { password: commonPasswordHash },
      create: { email: 'shehab@caresync.com', password: commonPasswordHash, role: 'PATIENT' }
    });
    const patient2 = await prisma.patient.upsert({
      where: { userId: pat2User.id },
      update: {},
      create: {
        userId: pat2User.id,
        firstName: 'Shehab Eldin',
        lastName: 'Ebied',
        gender: 'Male',
        dateOfBirth: new Date('1998-04-12'),
        bloodType: 'A+',
        phoneNumber: '01198765432',
        address: '22 Tahrir Square, Downtown, Cairo',
        medicalHistory: 'Diagnosed with Diabetes type 2. Managed with oral hypoglycemics and diet control.'
      }
    });

    // 6. Appointments & Clinical Records for Mariam Gamal
    const mariamAppts = await prisma.appointment.findMany({ where: { patientId: patient1.id } });
    if (mariamAppts.length === 0) {
      const appt1 = await prisma.appointment.create({
        data: {
          patientId: patient1.id,
          doctorId: doc1.id,
          dateTime: new Date(Date.now() - 86400000 * 3), // 3 days ago
          reason: 'Routine post-op checkup and ECG reading',
          status: 'COMPLETED'
        }
      });

      await prisma.appointment.create({
        data: {
          patientId: patient1.id,
          doctorId: doc1.id,
          dateTime: new Date(Date.now() + 86400000 * 2), // 2 days in future
          reason: 'Follow-up consultation for cardiac review',
          status: 'CONFIRMED'
        }
      });

      const recordMariam = await prisma.medicalRecord.create({
        data: {
          patientId: patient1.id,
          doctorId: doc1.id,
          appointmentId: appt1.id,
          symptoms: 'Patient reports mild shortness of breath when climbing stairs, but otherwise feels good.',
          diagnosis: 'Stable post-operative cardiac condition with mild exercise intolerance.',
          notes: 'Suture sites are healing perfectly. ECG shows regular sinus rhythm without ST elevations.'
        }
      });

      const rxMariam = await prisma.prescription.create({
        data: {
          medicalRecordId: recordMariam.id,
          patientId: patient1.id,
          doctorId: doc1.id
        }
      });

      await prisma.medicine.createMany({
        data: [
          { prescriptionId: rxMariam.id, name: 'Atorvastatin 40mg', dosage: '40mg', frequency: 'Once daily at bedtime', duration: '30 days' },
          { prescriptionId: rxMariam.id, name: 'Aspirin 81mg', dosage: '81mg', frequency: 'Once daily in morning', duration: '90 days' }
        ]
      });

      const invMariam = await prisma.invoice.create({
        data: {
          patientId: patient1.id,
          appointmentId: appt1.id,
          status: 'PAID',
          totalAmount: 700.00,
          paidAmount: 700.00
        }
      });

      await prisma.invoiceItem.createMany({
        data: [
          { invoiceId: invMariam.id, description: 'Specialist Cardiology Consultation', amount: 450.00 },
          { invoiceId: invMariam.id, description: 'ECG Electrocardiogram Diagnostics', amount: 250.00 }
        ]
      });

      const invMariam2 = await prisma.invoice.create({
        data: {
          patientId: patient1.id,
          status: 'PENDING',
          totalAmount: 35500.00,
          paidAmount: 0.00
        }
      });

      await prisma.invoiceItem.createMany({
        data: [
          { invoiceId: invMariam2.id, description: 'Inpatient Ward Room Rent - ICU Bed (3 Days)', amount: 9000.00 },
          { invoiceId: invMariam2.id, description: 'Cardiovascular Surgery Fees (Co-Pay)', amount: 25000.00 }
        ]
      });
    }

    // 7. Appointments & Clinical Records for Shehab Eldin Ebied
    const shehabAppts = await prisma.appointment.findMany({ where: { patientId: patient2.id } });
    if (shehabAppts.length === 0) {
      const apptShehab1 = await prisma.appointment.create({
        data: {
          patientId: patient2.id,
          doctorId: doc2.id,
          dateTime: new Date(Date.now() - 86400000 * 2), // 2 days ago
          reason: 'Consultation with Dr. Mona Hassan regarding pediatric asthma & allergy control',
          status: 'COMPLETED'
        }
      });

      const apptShehab2 = await prisma.appointment.create({
        data: {
          patientId: patient2.id,
          doctorId: doc3.id,
          dateTime: new Date(Date.now() + 86400000 * 3), // 3 days in future
          reason: 'General Practice Wellness & Diabetes Checkup',
          status: 'SCHEDULED'
        }
      });

      const recordShehab = await prisma.medicalRecord.create({
        data: {
          patientId: patient2.id,
          doctorId: doc2.id,
          appointmentId: apptShehab1.id,
          symptoms: 'Parent reports mild skin rash and itching on forearms.',
          diagnosis: 'Mild pediatric contact dermatitis & seasonal allergy.',
          notes: 'Advised switching to hypoallergenic soap. Apply cream as directed.'
        }
      });

      const rxShehab = await prisma.prescription.create({
        data: {
          medicalRecordId: recordShehab.id,
          patientId: patient2.id,
          doctorId: doc2.id
        }
      });

      await prisma.medicine.create({
        data: {
          prescriptionId: rxShehab.id,
          name: 'Hydrocortisone 1% Cream',
          dosage: 'Apply a thin layer',
          frequency: 'Twice daily',
          duration: '7 days'
        }
      });

      const invShehab = await prisma.invoice.create({
        data: {
          patientId: patient2.id,
          appointmentId: apptShehab1.id,
          status: 'PARTIALLY_PAID',
          totalAmount: 500.00,
          paidAmount: 200.00
        }
      });

      await prisma.invoiceItem.createMany({
        data: [
          { invoiceId: invShehab.id, description: 'Pediatric & Allergy Consultation', amount: 350.00 },
          { invoiceId: invShehab.id, description: 'Clinical Allergy Screening Test', amount: 150.00 }
        ]
      });
    }

    // 8. Pharmacy Inventory & Lab Tests
    const medCount = await prisma.medicineInventory.count();
    if (medCount === 0) {
      await prisma.medicineInventory.createMany({
        data: [
          { name: 'Atorvastatin 40mg', code: 'MED-001', category: 'Cardiovascular', stockQuantity: 450, unitPrice: 85.0, minThreshold: 50, supplier: 'PharmaCorp Egypt' },
          { name: 'Aspirin 81mg', code: 'MED-002', category: 'Cardiovascular', stockQuantity: 1200, unitPrice: 15.0, minThreshold: 100, supplier: 'PharmaCorp Egypt' },
          { name: 'Amoxicillin 500mg', code: 'MED-003', category: 'Antibiotics', stockQuantity: 320, unitPrice: 42.5, minThreshold: 40, supplier: 'EIPICO Pharmaceuticals' },
          { name: 'Hydrocortisone 1% Cream', code: 'MED-004', category: 'Dermatology', stockQuantity: 85, unitPrice: 28.0, minThreshold: 15, supplier: 'Sedico Pharma' },
          { name: 'Paracetamol 500mg', code: 'MED-005', category: 'Analgesic', stockQuantity: 2500, unitPrice: 10.0, minThreshold: 200, supplier: 'EVA Pharma' }
        ]
      });
    }

    const labCount = await prisma.labTest.count();
    if (labCount === 0) {
      await prisma.labTest.createMany({
        data: [
          {
            patientId: patient1.id,
            patientName: 'Mariam Gamal',
            doctorId: doc1.id,
            doctorName: 'Dr. Ahmed Mostafa',
            testName: 'Complete Blood Count (CBC)',
            category: 'Hematology',
            status: 'COMPLETED',
            result: 'WBC: 6.5 x10^3/uL, RBC: 4.8 x10^6/uL, Hb: 13.5 g/dL',
            referenceRange: 'Hb: 12.0 - 15.5 g/dL',
            unit: 'g/dL',
            notes: 'Normal physiological limits.',
            technicianName: 'Sherif Hossam'
          },
          {
            patientId: patient2.id,
            patientName: 'Shehab Eldin Ebied',
            doctorId: doc2.id,
            doctorName: 'Dr. Mona Hassan',
            testName: 'Fasting Blood Sugar (FBS)',
            category: 'Biochemistry',
            status: 'PENDING',
            referenceRange: '70 - 99 mg/dL',
            unit: 'mg/dL',
            notes: 'Patient requested to fast for 8 hours prior to morning blood draw.',
            technicianName: 'Sherif Hossam'
          }
        ]
      });
    }

    console.log('Automatic database initialization seed completed successfully!');
  } catch (err) {
    console.error('Auto seed execution error:', err);
  }
}

module.exports = { autoSeedDefaultUsers };
