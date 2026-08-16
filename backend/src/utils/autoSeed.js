const bcrypt = require('bcryptjs');
const prisma = require('./prisma');

async function autoSeedDefaultUsers() {
  try {
    console.log('Zero users detected in database. Executing automatic initialization seed...');

    const salt = bcrypt.genSaltSync(10);
    const commonPasswordHash = bcrypt.hashSync('password123', salt);

    // 1. Departments
    const cardiology = await prisma.department.create({
      data: { name: 'Cardiology', description: 'Specialized diagnosis and treatment of heart conditions.' }
    });
    const pediatrics = await prisma.department.create({
      data: { name: 'Pediatrics', description: 'Medical care for infants, children, and adolescents.' }
    });
    const generalPractice = await prisma.department.create({
      data: { name: 'General Practice', description: 'Comprehensive primary care and wellness plans.' }
    });
    const icuDept = await prisma.department.create({
      data: { name: 'ICU', description: 'Intensive care unit for critically ill patients.' }
    });

    // 2. Admin
    await prisma.user.create({
      data: {
        email: 'admin@caresync.com',
        password: commonPasswordHash,
        role: 'ADMIN'
      }
    });

    // 3. Doctors
    const doc1 = await prisma.user.create({
      data: { email: 'doctor.ahmed@caresync.com', password: commonPasswordHash, role: 'DOCTOR' }
    });
    await prisma.doctor.create({
      data: {
        userId: doc1.id,
        specialty: 'Cardiology',
        departmentId: cardiology.id,
        contactInfo: 'Dr. Ahmed Mostafa, Tel: 01012345678',
        schedule: { monday: ['09:00-17:00'], wednesday: ['09:00-17:00'] }
      }
    });

    const doc2 = await prisma.user.create({
      data: { email: 'doctor.mona@caresync.com', password: commonPasswordHash, role: 'DOCTOR' }
    });
    await prisma.doctor.create({
      data: {
        userId: doc2.id,
        specialty: 'Pediatrics',
        departmentId: pediatrics.id,
        contactInfo: 'Dr. Mona Hassan, Tel: 01187654321',
        schedule: { tuesday: ['08:00-16:00'], thursday: ['08:00-16:00'] }
      }
    });

    const doc3 = await prisma.user.create({
      data: { email: 'doctor.khaled@caresync.com', password: commonPasswordHash, role: 'DOCTOR' }
    });
    await prisma.doctor.create({
      data: {
        userId: doc3.id,
        specialty: 'Family Medicine',
        departmentId: generalPractice.id,
        contactInfo: 'Dr. Khaled Ibrahim, Tel: 01223456789',
        schedule: { monday: ['09:00-17:00'], friday: ['14:00-17:00'] }
      }
    });

    // 4. Staff (Nurse, Receptionist, Pharmacist, Lab Tech, Billing)
    const nurseUser = await prisma.user.create({
      data: { email: 'nurse@caresync.com', password: commonPasswordHash, role: 'NURSE' }
    });
    await prisma.staff.create({
      data: { userId: nurseUser.id, firstName: 'Fatma', lastName: 'Ali', departmentId: icuDept.id }
    });

    const recepUser = await prisma.user.create({
      data: { email: 'receptionist@caresync.com', password: commonPasswordHash, role: 'RECEPTIONIST' }
    });
    await prisma.staff.create({
      data: { userId: recepUser.id, firstName: 'Omar', lastName: 'Tarek', departmentId: generalPractice.id }
    });

    const pharmUser = await prisma.user.create({
      data: { email: 'pharmacist@caresync.com', password: commonPasswordHash, role: 'PHARMACIST' }
    });
    await prisma.staff.create({
      data: { userId: pharmUser.id, firstName: 'Youssef', lastName: 'Nabil', departmentId: generalPractice.id }
    });

    const labtechUser = await prisma.user.create({
      data: { email: 'labtech@caresync.com', password: commonPasswordHash, role: 'LAB_TECHNICIAN' }
    });
    await prisma.staff.create({
      data: { userId: labtechUser.id, firstName: 'Sherif', lastName: 'Hossam', departmentId: generalPractice.id }
    });

    const billingUser = await prisma.user.create({
      data: { email: 'billing@caresync.com', password: commonPasswordHash, role: 'BILLING' }
    });
    await prisma.staff.create({
      data: { userId: billingUser.id, firstName: 'Noha', lastName: 'Mahmoud', departmentId: generalPractice.id }
    });

    // 5. Patients
    const pat1User = await prisma.user.create({
      data: { email: 'mariam@caresync.com', password: commonPasswordHash, role: 'PATIENT' }
    });
    await prisma.patient.create({
      data: {
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

    const pat2User = await prisma.user.create({
      data: { email: 'shehab@caresync.com', password: commonPasswordHash, role: 'PATIENT' }
    });
    await prisma.patient.create({
      data: {
        userId: pat2User.id,
        firstName: 'Shehab Eldin',
        lastName: 'Ebied',
        gender: 'Male',
        dateOfBirth: new Date('1998-04-12'),
        bloodType: 'A+',
        phoneNumber: '01198765432',
        address: '22 Tahrir Square, Downtown, Cairo',
        medicalHistory: 'Routine checkups only.'
      }
    });

    // 6. Pharmacy Inventory & Lab Tests initial seed
    await prisma.medicineInventory.createMany({
      data: [
        { name: 'Amoxicillin 500mg', code: 'MED-101', category: 'Antibiotics', stockQuantity: 150, unitPrice: 25.50, supplier: 'EIPICO' },
        { name: 'Paracetamol 500mg', code: 'MED-102', category: 'Analgesic', stockQuantity: 12, unitPrice: 10.00, supplier: 'Pharco' },
        { name: 'Ibuprofen 400mg', code: 'MED-103', category: 'NSAID', stockQuantity: 80, unitPrice: 18.00, supplier: 'Amoun' }
      ]
    });

    await prisma.labTest.createMany({
      data: [
        { patientName: 'Mariam Gamal', doctorName: 'Dr. Ahmed Mostafa', technicianName: 'Sherif Hossam', testName: 'Complete Blood Count (CBC)', category: 'Hematology', status: 'COMPLETED', result: 'Hb: 13.5 g/dL, WBC: 6.5 x10^3/uL', referenceRange: '12.0 - 15.5 g/dL', unit: 'g/dL', notes: 'Normal limits.' }
      ]
    });

    console.log('Automatic database initialization seed completed successfully!');
  } catch (err) {
    console.error('Auto seed execution error (ignored if already seeded):', err);
  }
}

module.exports = { autoSeedDefaultUsers };
