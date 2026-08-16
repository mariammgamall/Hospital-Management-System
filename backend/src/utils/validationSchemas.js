const { z } = require('zod');

// Password security helpers
const passwordValidationSchema = z.string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/, 'Password must contain at least one special character');

const checkPasswordContext = (data) => {
  const { password, firstName, lastName, email } = data;
  if (!password) return true;
  const lowerPassword = password.toLowerCase();
  
  if (firstName && lowerPassword.includes(firstName.toLowerCase())) {
    return false;
  }
  if (lastName && lowerPassword.includes(lastName.toLowerCase())) {
    return false;
  }
  if (email) {
    const emailParts = email.split('@');
    if (emailParts[0] && lowerPassword.includes(emailParts[0].toLowerCase())) {
      return false;
    }
  }
  return true;
};

// Authentication schemas
const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
  }),
});

const registerPatientSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: passwordValidationSchema,
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    gender: z.enum(['Male', 'Female', 'Other']),
    dateOfBirth: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid date format for birth date',
    }),
    bloodType: z.string().optional(),
    phoneNumber: z.string().optional(),
    address: z.string().optional(),
    medicalHistory: z.string().optional(),
  }).refine(checkPasswordContext, {
    message: 'Password must not contain your first name, last name, or email prefix',
    path: ['password'],
  }),
});

// Doctor schemas
const createDoctorSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: passwordValidationSchema,
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    specialty: z.string().min(1, 'Specialty is required'),
    departmentId: z.string().uuid('Invalid Department ID'),
    contactInfo: z.string().optional(),
    schedule: z.record(z.array(z.string())).optional().default({}),
  }).refine(checkPasswordContext, {
    message: 'Password must not contain your first name, last name, or email prefix',
    path: ['password'],
  }),
});

// Staff schemas
const createStaffSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: passwordValidationSchema,
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    role: z.enum(['NURSE', 'RECEPTIONIST']),
    departmentId: z.string().uuid('Invalid Department ID').optional(),
  }).refine(checkPasswordContext, {
    message: 'Password must not contain your first name, last name, or email prefix',
    path: ['password'],
  }),
});

// Appointment schemas
const createAppointmentSchema = z.object({
  body: z.object({
    patientId: z.string().uuid('Invalid Patient ID'),
    doctorId: z.string().uuid('Invalid Doctor ID'),
    dateTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid date/time format',
    }),
    reason: z.string().min(3, 'Reason must be at least 3 characters long'),
    status: z.enum(['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED']).optional(),
  }),
});

// Medical Record schemas
const createMedicalRecordSchema = z.object({
  body: z.object({
    patientId: z.string().uuid('Invalid Patient ID'),
    doctorId: z.string().uuid('Invalid Doctor ID'),
    appointmentId: z.string().uuid('Invalid Appointment ID').optional(),
    diagnosis: z.string().min(1, 'Diagnosis is required'),
    symptoms: z.string().min(1, 'Symptoms description is required'),
    notes: z.string().optional(),
  }),
});

// Prescription schemas
const createPrescriptionSchema = z.object({
  body: z.object({
    medicalRecordId: z.string().uuid('Invalid Medical Record ID').optional(),
    patientId: z.string().uuid('Invalid Patient ID'),
    doctorId: z.string().uuid('Invalid Doctor ID'),
    medicines: z.array(
      z.object({
        name: z.string().min(1, 'Medicine name is required'),
        dosage: z.string().min(1, 'Dosage description is required'),
        frequency: z.string().min(1, 'Frequency is required'),
        duration: z.string().min(1, 'Duration is required'),
      })
    ).min(1, 'At least one medicine must be prescribed'),
  }),
});

// Billing schemas
const createInvoiceSchema = z.object({
  body: z.object({
    patientId: z.string().uuid('Invalid Patient ID'),
    appointmentId: z.string().uuid('Invalid Appointment ID').optional(),
    status: z.enum(['PENDING', 'PAID', 'PARTIALLY_PAID']).optional().default('PENDING'),
    totalAmount: z.number().min(0, 'Total amount must be greater than or equal to 0'),
    paidAmount: z.number().min(0, 'Paid amount must be greater than or equal to 0').optional().default(0),
    items: z.array(
      z.object({
        description: z.string().min(1, 'Item description is required'),
        amount: z.number().min(0, 'Amount must be greater than or equal to 0'),
      })
    ).min(1, 'At least one invoice item is required'),
  }),
});

// Inpatient Wards & Admissions schemas
const createAdmissionSchema = z.object({
  body: z.object({
    patientId: z.string().uuid('Invalid Patient ID'),
    bedId: z.string().uuid('Invalid Bed ID'),
    reason: z.string().min(3, 'Reason must be at least 3 characters long'),
  }),
});

const createWardSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Ward name is required'),
    floor: z.number().int('Floor must be an integer'),
    type: z.string().min(1, 'Ward type is required'),
  }),
});

const createBedSchema = z.object({
  body: z.object({
    wardId: z.string().uuid('Invalid Ward ID'),
    number: z.string().min(1, 'Bed number is required'),
  }),
});

module.exports = {
  loginSchema,
  registerPatientSchema,
  createDoctorSchema,
  createStaffSchema,
  createAppointmentSchema,
  createMedicalRecordSchema,
  createPrescriptionSchema,
  createInvoiceSchema,
  createAdmissionSchema,
  createWardSchema,
  createBedSchema,
};
