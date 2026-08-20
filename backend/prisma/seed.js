const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // 1. Clean existing data in order of dependency
  console.log('Cleaning existing data...');
  await prisma.notification.deleteMany({});
  await prisma.admission.deleteMany({});
  await prisma.bed.deleteMany({});
  await prisma.ward.deleteMany({});
  await prisma.invoiceItem.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.medicine.deleteMany({});
  await prisma.prescription.deleteMany({});
  await prisma.medicalRecord.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.labTest.deleteMany({});
  await prisma.medicineInventory.deleteMany({});
  await prisma.staff.deleteMany({});
  await prisma.doctor.deleteMany({});
  await prisma.patient.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('All previous database records cleared.');

  // 2. Hash common password
  const salt = bcrypt.genSaltSync(10);
  const commonPasswordHash = bcrypt.hashSync('Password@123', salt);

  // 3. Seed Departments
  console.log('Seeding Departments...');
  const cardiology = await prisma.department.create({
    data: {
      name: 'Cardiology',
      description: 'Specialized diagnosis and treatment of heart conditions and vascular diseases.',
    },
  });

  const pediatrics = await prisma.department.create({
    data: {
      name: 'Pediatrics',
      description: 'Medical care for infants, children, and adolescents.',
    },
  });

  const generalPractice = await prisma.department.create({
    data: {
      name: 'General Practice',
      description: 'Comprehensive primary care, health screenings, and wellness plans.',
    },
  });

  const icuDept = await prisma.department.create({
    data: {
      name: 'ICU',
      description: 'Intensive Care Unit for patients needing critical and continuous monitoring.',
    },
  });

  // 4. Seed Admin User
  console.log('Seeding Users and Profiles...');
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@caresync.com',
      password: commonPasswordHash,
      role: 'ADMIN',
    },
  });

  // 5. Seed Doctors
  const doctor1User = await prisma.user.create({
    data: {
      email: 'doctor.ahmed@caresync.com',
      password: commonPasswordHash,
      role: 'DOCTOR',
    },
  });

  const doctor1 = await prisma.doctor.create({
    data: {
      userId: doctor1User.id,
      specialty: 'Cardiology',
      departmentId: cardiology.id,
      contactInfo: 'Dr. Ahmed Mostafa, Tel: 01012345678',
      schedule: {
        monday: ['09:00-12:00', '14:00-17:00'],
        wednesday: ['09:00-12:00', '14:00-17:00'],
        friday: ['09:00-12:00'],
      },
    },
  });

  const doctor2User = await prisma.user.create({
    data: {
      email: 'doctor.mona@caresync.com',
      password: commonPasswordHash,
      role: 'DOCTOR',
    },
  });

  const doctor2 = await prisma.doctor.create({
    data: {
      userId: doctor2User.id,
      specialty: 'Pediatrics',
      departmentId: pediatrics.id,
      contactInfo: 'Dr. Mona Hassan, Tel: 01187654321',
      schedule: {
        tuesday: ['08:00-12:00', '13:00-16:00'],
        thursday: ['08:00-12:00', '13:00-16:00'],
      },
    },
  });

  const doctor3User = await prisma.user.create({
    data: {
      email: 'doctor.khaled@caresync.com',
      password: commonPasswordHash,
      role: 'DOCTOR',
    },
  });

  const doctor3 = await prisma.doctor.create({
    data: {
      userId: doctor3User.id,
      specialty: 'Family Medicine',
      departmentId: generalPractice.id,
      contactInfo: 'Dr. Khaled Ibrahim, Tel: 01223456789',
      schedule: {
        monday: ['09:00-13:00'],
        tuesday: ['09:00-13:00', '14:00-17:00'],
        thursday: ['09:00-13:00', '14:00-17:00'],
        friday: ['14:00-17:00'],
      },
    },
  });

  // 6. Seed Staff (Nurse, Receptionist, Pharmacist, Lab Tech, Billing)
  const nurseUser = await prisma.user.create({
    data: {
      email: 'nurse@caresync.com',
      password: commonPasswordHash,
      role: 'NURSE',
    },
  });

  const nurseStaff = await prisma.staff.create({
    data: {
      userId: nurseUser.id,
      firstName: 'Fatma',
      lastName: 'Ali',
      departmentId: icuDept.id,
    },
  });

  const receptionistUser = await prisma.user.create({
    data: {
      email: 'receptionist@caresync.com',
      password: commonPasswordHash,
      role: 'RECEPTIONIST',
    },
  });

  const receptionistStaff = await prisma.staff.create({
    data: {
      userId: receptionistUser.id,
      firstName: 'Omar',
      lastName: 'Tarek',
      departmentId: generalPractice.id,
    },
  });

  const pharmacistUser = await prisma.user.create({
    data: {
      email: 'pharmacist@caresync.com',
      password: commonPasswordHash,
      role: 'PHARMACIST',
    },
  });

  await prisma.staff.create({
    data: {
      userId: pharmacistUser.id,
      firstName: 'Youssef',
      lastName: 'Nabil',
      departmentId: generalPractice.id,
    },
  });

  const labTechUser = await prisma.user.create({
    data: {
      email: 'labtech@caresync.com',
      password: commonPasswordHash,
      role: 'LAB_TECHNICIAN',
    },
  });

  await prisma.staff.create({
    data: {
      userId: labTechUser.id,
      firstName: 'Sherif',
      lastName: 'Hossam',
      departmentId: generalPractice.id,
    },
  });

  const billingUser = await prisma.user.create({
    data: {
      email: 'billing@caresync.com',
      password: commonPasswordHash,
      role: 'BILLING',
    },
  });

  await prisma.staff.create({
    data: {
      userId: billingUser.id,
      firstName: 'Noha',
      lastName: 'Mahmoud',
      departmentId: generalPractice.id,
    },
  });

  // 7. Seed Patients (Some with accounts, some without)
  console.log('Seeding Patients...');
  const patient1User = await prisma.user.create({
    data: {
      email: 'mariam@caresync.com',
      password: commonPasswordHash,
      role: 'PATIENT',
    },
  });

  const patient1 = await prisma.patient.create({
    data: {
      userId: patient1User.id,
      firstName: 'Mariam',
      lastName: 'Gamal',
      gender: 'Female',
      dateOfBirth: new Date('2005-10-05'),
      bloodType: 'O+',
      phoneNumber: '01280873442',
      address: '15 El-Nasr Rd, Nasr City, Cairo',
      medicalHistory: 'History of seasonal asthma. Patient has mild Hypertension. No known drug allergies.',
    },
  });

  const patient2User = await prisma.user.create({
    data: {
      email: 'shehab@caresync.com',
      password: commonPasswordHash,
      role: 'PATIENT',
    },
  });

  const patient2 = await prisma.patient.create({
    data: {
      userId: patient2User.id,
      firstName: 'Shehab Eldin',
      lastName: 'Ebied',
      gender: 'Male',
      dateOfBirth: new Date('2006-03-04'),
      bloodType: 'O-',
      phoneNumber: '01099501079',
      address: '24 El-Galaa St, Mohandessin, Giza',
      medicalHistory: 'Diagnosed with Diabetes type 2. Managed with oral hypoglycemics and diet control.',
    },
  });

  const patient3 = await prisma.patient.create({
    data: {
      firstName: 'Tarek',
      lastName: 'El-Sayed',
      gender: 'Male',
      dateOfBirth: new Date('1952-06-07'),
      bloodType: 'B+',
      phoneNumber: '01234567890',
      address: '50 El-Horreya Rd, Heliopolis, Cairo',
      medicalHistory: 'Chronic Hypertension and early-stage Heart Disease. Prescribed daily antihypertensives.',
    },
  });

  const patient4 = await prisma.patient.create({
    data: {
      firstName: 'Heba',
      lastName: 'Abdel-Rahman',
      gender: 'Female',
      dateOfBirth: new Date('1984-03-10'),
      bloodType: 'AB+',
      phoneNumber: '01545678901',
      address: '12 Riad St, Maadi, Cairo',
      medicalHistory: 'History of gestational Diabetes. Recently diagnosed with mild Schistosomiasis, treated successfully.',
    },
  });

  const patient5 = await prisma.patient.create({
    data: {
      firstName: 'Mostafa',
      lastName: 'Mahmoud',
      gender: 'Male',
      dateOfBirth: new Date('1996-05-09'),
      bloodType: 'A-',
      phoneNumber: '01098765432',
      address: '88 El-Bahr St, Mansoura',
      medicalHistory: 'Previously treated for Hepatitis C in 2021 with direct-acting antivirals (DAAs). Now in remission.',
    },
  });

  const patient6 = await prisma.patient.create({
    data: {
      firstName: 'Salma',
      lastName: 'Hassan',
      gender: 'Female',
      dateOfBirth: new Date('1934-09-20'),
      bloodType: 'O+',
      phoneNumber: '01145678901',
      address: '14 Cornish El-Nil, Aswan',
      medicalHistory: 'Osteoporosis management. Occasional joint pain and mild Diabetes.',
    },
  });

  const patient7 = await prisma.patient.create({
    data: {
      firstName: 'Amr',
      lastName: 'Youssef',
      gender: 'Male',
      dateOfBirth: new Date('1972-01-28'),
      bloodType: 'B-',
      phoneNumber: '01276543210',
      address: '35 El-Horeya St, Alexandria',
      medicalHistory: 'Hypertension and elevated cholesterol levels. Monitored regularly.',
    },
  });

  const patient8 = await prisma.patient.create({
    data: {
      firstName: 'Yasmin',
      lastName: 'Soliman',
      gender: 'Female',
      dateOfBirth: new Date('1972-08-24'),
      bloodType: 'AB-',
      phoneNumber: '01587654321',
      address: '7 El-Gezira St, Zamalek, Cairo',
      medicalHistory: 'Hypothyroidism and type 2 Diabetes. Managed with daily medication.',
    },
  });

  const patient9 = await prisma.patient.create({
    data: {
      firstName: 'Kareem',
      lastName: 'Aly',
      gender: 'Male',
      dateOfBirth: new Date('1996-12-12'),
      bloodType: 'A+',
      phoneNumber: '01011223344',
      address: '42 90th St, New Cairo',
      medicalHistory: 'No chronic conditions. Previous mild infection of Schistosomiasis fully treated.',
    },
  });

  const patient10 = await prisma.patient.create({
    data: {
      firstName: 'Nourhan',
      lastName: 'Salem',
      gender: 'Female',
      dateOfBirth: new Date('1952-06-18'),
      bloodType: 'O+',
      phoneNumber: '01122334455',
      address: '19 El-Obour Buildings, Heliopolis, Cairo',
      medicalHistory: 'Eczema and chronic Hypertension. Responds well to topical treatment and ACE inhibitors.',
    },
  });

  // 8. Seed Wards & Beds
  console.log('Seeding Wards and Beds...');
  const wardICU = await prisma.ward.create({
    data: {
      name: 'Intensive Care Unit (ICU-3)',
      floor: 3,
      type: 'ICU',
    },
  });

  const bedICU1 = await prisma.bed.create({
    data: { wardId: wardICU.id, number: 'ICU-301', isAvailable: false }, // Will be occupied by Mariam Gamal
  });
  const bedICU2 = await prisma.bed.create({
    data: { wardId: wardICU.id, number: 'ICU-302', isAvailable: true },
  });
  const bedICU3 = await prisma.bed.create({
    data: { wardId: wardICU.id, number: 'ICU-303', isAvailable: true },
  });

  const wardGeneral = await prisma.ward.create({
    data: {
      name: 'General Medical Ward (GEN-2)',
      floor: 2,
      type: 'General',
    },
  });

  const bedGen1 = await prisma.bed.create({
    data: { wardId: wardGeneral.id, number: 'GEN-201', isAvailable: false }, // Occupied by Tarek El-Sayed
  });
  const bedGen2 = await prisma.bed.create({
    data: { wardId: wardGeneral.id, number: 'GEN-202', isAvailable: true },
  });
  const bedGen3 = await prisma.bed.create({
    data: { wardId: wardGeneral.id, number: 'GEN-203', isAvailable: true },
  });
  const bedGen4 = await prisma.bed.create({
    data: { wardId: wardGeneral.id, number: 'GEN-204', isAvailable: true },
  });

  const wardPediatric = await prisma.ward.create({
    data: {
      name: 'Pediatric Care Ward (PED-1)',
      floor: 1,
      type: 'Pediatric',
    },
  });

  const bedPed1 = await prisma.bed.create({
    data: { wardId: wardPediatric.id, number: 'PED-101', isAvailable: true },
  });
  const bedPed2 = await prisma.bed.create({
    data: { wardId: wardPediatric.id, number: 'PED-102', isAvailable: true },
  });

  // 9. Seed Inpatient Admissions
  console.log('Seeding Admissions...');
  // Active admission 1 (Mariam Gamal in ICU)
  await prisma.admission.create({
    data: {
      patientId: patient1.id,
      bedId: bedICU1.id,
      admissionDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
      reason: 'Post-operative monitoring after elective cardiac bypass surgery.',
      status: 'ACTIVE',
    },
  });

  // Active admission 2 (Tarek El-Sayed in General)
  await prisma.admission.create({
    data: {
      patientId: patient3.id,
      bedId: bedGen1.id,
      admissionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      reason: 'Acute exacerbation of Hypertension and severe chest infection.',
      status: 'ACTIVE',
    },
  });

  // Past admission (Discharged: Heba Abdel-Rahman)
  await prisma.admission.create({
    data: {
      patientId: patient4.id,
      bedId: bedGen2.id,
      admissionDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      dischargeDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),  // 5 days ago
      reason: 'Acute complications from Diabetes and dehydration. Restored electrolytes.',
      status: 'DISCHARGED',
    },
  });

  // 10. Seed Appointments
  console.log('Seeding Appointments...');
  
  // Set up reference dates relative to "today" to avoid outdated static dates
  const today = new Date();
  
  const createDateOffset = (days, hours = 9, minutes = 0) => {
    const d = new Date(today);
    d.setDate(today.getDate() + days);
    d.setHours(hours, minutes, 0, 0);
    return d;
  };

  // Past completed appointment 1
  const apptPast1 = await prisma.appointment.create({
    data: {
      patientId: patient1.id,
      doctorId: doctor1.id,
      dateTime: createDateOffset(-5, 10, 0), // 5 days ago, 10:00 AM
      reason: 'Routine post-op checkup and ECG reading.',
      status: 'COMPLETED',
    },
  });

  // Past completed appointment 2
  const apptPast2 = await prisma.appointment.create({
    data: {
      patientId: patient2.id,
      doctorId: doctor2.id,
      dateTime: createDateOffset(-3, 14, 30), // 3 days ago, 2:30 PM
      reason: 'Consultation with Dr. Mona Hassan regarding pediatric asthma for his child.',
      status: 'COMPLETED',
    },
  });

  // Past cancelled appointment
  await prisma.appointment.create({
    data: {
      patientId: patient5.id,
      doctorId: doctor3.id,
      dateTime: createDateOffset(-2, 11, 0),
      reason: 'Annual health screening.',
      status: 'CANCELLED',
    },
  });

  // Future scheduled appointment 1
  const apptFuture1 = await prisma.appointment.create({
    data: {
      patientId: patient1.id,
      doctorId: doctor1.id,
      dateTime: createDateOffset(2, 9, 30), // 2 days in the future, 9:30 AM
      reason: 'Follow-up consultation for cardiac review.',
      status: 'CONFIRMED',
    },
  });

  // Future scheduled appointment 2
  const apptFuture2 = await prisma.appointment.create({
    data: {
      patientId: patient6.id,
      doctorId: doctor3.id,
      dateTime: createDateOffset(3, 15, 0), // 3 days in future, 3:00 PM
      reason: 'Osteoporosis evaluation and prescription renewal.',
      status: 'SCHEDULED',
    },
  });

  // Future scheduled appointment 3
  const apptFuture3 = await prisma.appointment.create({
    data: {
      patientId: patient7.id,
      doctorId: doctor3.id,
      dateTime: createDateOffset(4, 10, 30), // 4 days in future, 10:30 AM
      reason: 'Checkup for blood cholesterol management.',
      status: 'SCHEDULED',
    },
  });

  // 11. Seed Clinical Medical Records & Prescriptions
  console.log('Seeding Clinical Records and Prescriptions...');

  // Record for past checkup of Mariam Gamal
  const record1 = await prisma.medicalRecord.create({
    data: {
      patientId: patient1.id,
      doctorId: doctor1.id,
      appointmentId: apptPast1.id,
      symptoms: 'Patient reports mild shortness of breath when climbing stairs, but otherwise feels good.',
      diagnosis: 'Stable post-operative cardiac condition with mild exercise intolerance.',
      notes: 'Suture sites are healing perfectly. ECG shows regular sinus rhythm without ST elevations.',
    },
  });

  // Prescription for Mariam Gamal
  const rx1 = await prisma.prescription.create({
    data: {
      medicalRecordId: record1.id,
      patientId: patient1.id,
      doctorId: doctor1.id,
    },
  });

  await prisma.medicine.createMany({
    data: [
      {
        prescriptionId: rx1.id,
        name: 'Atorvastatin',
        dosage: '40mg',
        frequency: 'Once daily at bedtime',
        duration: '30 days',
      },
      {
        prescriptionId: rx1.id,
        name: 'Aspirin (Low Dose)',
        dosage: '81mg',
        frequency: 'Once daily in the morning',
        duration: '90 days',
      },
    ],
  });

  // Record for past checkup of Shehab Eldin Ebied
  const record2 = await prisma.medicalRecord.create({
    data: {
      patientId: patient2.id,
      doctorId: doctor2.id,
      appointmentId: apptPast2.id,
      symptoms: "Parent reports mild skin rash and itching on the child's forearms.",
      diagnosis: 'Mild pediatric contact dermatitis.',
      notes: 'Advised switching to hypoallergenic soap. Apply cream as directed.',
    },
  });

  // Prescription for Shehab Eldin Ebied
  const rx2 = await prisma.prescription.create({
    data: {
      medicalRecordId: record2.id,
      patientId: patient2.id,
      doctorId: doctor2.id,
    },
  });

  await prisma.medicine.create({
    data: {
      prescriptionId: rx2.id,
      name: 'Hydrocortisone 1% Cream',
      dosage: 'Apply a thin layer',
      frequency: 'Twice daily',
      duration: '7 days',
    },
  });

  // 12. Seed Invoices & Financial Items
  console.log('Seeding Invoices and billing items...');

  // Invoice 1: Paid invoice for Mariam Gamal's past appointment
  const invoice1 = await prisma.invoice.create({
    data: {
      patientId: patient1.id,
      appointmentId: apptPast1.id,
      status: 'PAID',
      totalAmount: 700.0,
      paidAmount: 700.0,
    },
  });

  await prisma.invoiceItem.createMany({
    data: [
      {
        invoiceId: invoice1.id,
        description: 'Specialist Cardiology Consultation',
        amount: 450.0,
      },
      {
        invoiceId: invoice1.id,
        description: 'ECG Electrocardiogram Diagnostics',
        amount: 250.0,
      },
    ],
  });

  // Invoice 2: Partially paid invoice for Shehab Eldin Ebied's past appointment
  const invoice2 = await prisma.invoice.create({
    data: {
      patientId: patient2.id,
      appointmentId: apptPast2.id,
      status: 'PARTIALLY_PAID',
      totalAmount: 500.0,
      paidAmount: 200.0,
    },
  });

  await prisma.invoiceItem.createMany({
    data: [
      {
        invoiceId: invoice2.id,
        description: 'Pediatric Consultation',
        amount: 350.0,
      },
      {
        invoiceId: invoice2.id,
        description: 'Clinical Allergy Screening Test',
        amount: 150.0,
      },
    ],
  });

  // Invoice 3: Pending unpaid invoice for Mariam Gamal's active admission/bypass
  const invoice3 = await prisma.invoice.create({
    data: {
      patientId: patient1.id,
      status: 'PENDING',
      totalAmount: 35500.0,
      paidAmount: 0.0,
    },
  });

  await prisma.invoiceItem.createMany({
    data: [
      {
        invoiceId: invoice3.id,
        description: 'Inpatient Ward Room Rent - ICU Bed (3 Days)',
        amount: 9000.0,
      },
      {
        invoiceId: invoice3.id,
        description: 'Cardiovascular Surgery Fees (Co-Pay)',
        amount: 25000.0,
      },
      {
        invoiceId: invoice3.id,
        description: 'IV Fluids & Cardiac Monitoring Equipment Charge',
        amount: 1500.0,
      },
    ],
  });

  // Invoice 4: Unpaid pending invoice for upcoming appointment 2
  const invoice4 = await prisma.invoice.create({
    data: {
      patientId: patient6.id,
      appointmentId: apptFuture2.id,
      status: 'PENDING',
      totalAmount: 200.0,
      paidAmount: 0.0,
    },
  });

  await prisma.invoiceItem.create({
    data: {
      invoiceId: invoice4.id,
      description: 'Family Practice Consultation',
      amount: 200.0,
    },
  });

  // 13. Seed System & User Notifications
  console.log('Seeding Notifications...');
  
  // Admin notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: adminUser.id,
        title: 'New Doctor Registered',
        message: 'Dr. Khaled Ibrahim has been successfully added to General Practice.',
        isRead: true,
      },
      {
        userId: adminUser.id,
        title: 'Financial Threshold Alert',
        message: 'Daily revenue reports show strong performance: 4,245.00 EGP generated today.',
        isRead: false,
      },
    ],
  });

  // Doctor 1 (Ahmed Mostafa) notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: doctor1User.id,
        title: 'Appointment Scheduled',
        message: 'Mariam Gamal has scheduled a Cardiology follow-up in two days.',
        isRead: false,
      },
      {
        userId: doctor1User.id,
        title: 'Patient Admitted to ICU',
        message: 'Your cardiac patient Mariam Gamal has been admitted to Bed ICU-301.',
        isRead: false,
      },
    ],
  });

  // Patient 1 (Mariam Gamal) notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: patient1User.id,
        title: 'Appointment Confirmed',
        message: 'Your follow-up with Dr. Ahmed Mostafa is confirmed for 9:30 AM.',
        isRead: false,
      },
      {
        userId: patient1User.id,
        title: 'Invoice Issued',
        message: 'Invoice #35500 for ICU admission room rent has been generated.',
        isRead: false,
      },
    ],
  });

  // 14. Seed Pharmacy Inventory & Lab Tests
  console.log('Seeding Pharmacy Inventory and Lab Tests...');
  await prisma.medicineInventory.createMany({
    data: [
      { name: 'Atorvastatin 40mg', code: 'MED-001', category: 'Cardiovascular', stockQuantity: 450, unitPrice: 85.0, minThreshold: 50, supplier: 'PharmaCorp Egypt' },
      { name: 'Aspirin (Low Dose) 81mg', code: 'MED-002', category: 'Cardiovascular', stockQuantity: 1200, unitPrice: 15.0, minThreshold: 100, supplier: 'PharmaCorp Egypt' },
      { name: 'Amoxicillin 500mg', code: 'MED-003', category: 'Antibiotics', stockQuantity: 320, unitPrice: 42.5, minThreshold: 40, supplier: 'EIPICO Pharmaceuticals' },
      { name: 'Hydrocortisone 1% Cream', code: 'MED-004', category: 'Dermatology', stockQuantity: 85, unitPrice: 28.0, minThreshold: 15, supplier: 'Sedico Pharma' },
      { name: 'Paracetamol 500mg', code: 'MED-005', category: 'Analgesic', stockQuantity: 2500, unitPrice: 10.0, minThreshold: 200, supplier: 'EVA Pharma' },
      { name: 'Metformin 850mg', code: 'MED-006', category: 'Antidiabetic', stockQuantity: 600, unitPrice: 35.0, minThreshold: 60, supplier: 'EVA Pharma' },
    ],
  });

  await prisma.labTest.createMany({
    data: [
      {
        patientId: patient1.id,
        patientName: 'Mariam Gamal',
        doctorId: doctor1.id,
        doctorName: 'Dr. Ahmed Mostafa',
        testName: 'Complete Blood Count (CBC)',
        category: 'Hematology',
        status: 'COMPLETED',
        result: 'WBC: 6.5 x10^3/uL, RBC: 4.8 x10^6/uL, Hb: 13.5 g/dL, Platelets: 260 x10^3/uL',
        referenceRange: 'Hb: 12.0 - 15.5 g/dL',
        unit: 'g/dL',
        notes: 'Blood parameters within normal physiological limits.',
        technicianName: 'Sherif Hossam',
      },
      {
        patientId: patient1.id,
        patientName: 'Mariam Gamal',
        doctorId: doctor1.id,
        doctorName: 'Dr. Ahmed Mostafa',
        testName: 'Lipid Profile Panel',
        category: 'Biochemistry',
        status: 'COMPLETED',
        result: 'Total Cholesterol: 185 mg/dL, Triglycerides: 140 mg/dL, HDL: 52 mg/dL, LDL: 105 mg/dL',
        referenceRange: '< 200 mg/dL',
        unit: 'mg/dL',
        notes: 'Optimal lipid controls observed following Atorvastatin therapy.',
        technicianName: 'Sherif Hossam',
      },
      {
        patientId: patient2.id,
        patientName: 'Shehab Eldin Ebied',
        doctorId: doctor2.id,
        doctorName: 'Dr. Mona Hassan',
        testName: 'Fasting Blood Sugar (FBS)',
        category: 'Biochemistry',
        status: 'PENDING',
        referenceRange: '70 - 99 mg/dL',
        unit: 'mg/dL',
        notes: 'Patient requested to fast for 8 hours prior to morning blood draw.',
        technicianName: 'Sherif Hossam',
      },
    ],
  });

  console.log('Database seeding successfully completed!');
}

main()
  .catch((e) => {
    console.error('Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
