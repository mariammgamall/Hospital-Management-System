const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
  origin: '*', // Customize this for production
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parsing requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date(),
    service: 'Hospital Management System API'
  });
});

// Root API Route redirection
app.get('/', (req, res) => {
  res.json({ message: "Welcome to Hospital Management System REST API. Use /api/v1 for API endpoints." });
});

// Import routers
const authRouter = require('./routes/auth.routes');
const patientRouter = require('./routes/patient.routes');
const doctorRouter = require('./routes/doctor.routes');
const appointmentRouter = require('./routes/appointment.routes');
const medicalRecordRouter = require('./routes/medicalRecord.routes');
const prescriptionRouter = require('./routes/prescription.routes');
const billingRouter = require('./routes/billing.routes');
const wardRouter = require('./routes/ward.routes');
const staffRouter = require('./routes/staff.routes');
const reportRouter = require('./routes/report.routes');
const notificationRouter = require('./routes/notification.routes');
const departmentRouter = require('./routes/department.routes');
const dashboardRouter = require('./routes/dashboard.routes');
const pharmacyRouter = require('./routes/pharmacy.routes');
const labRouter = require('./routes/lab.routes');

// Register routes with REST API version 1 prefix
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/patients', patientRouter);
app.use('/api/v1/doctors', doctorRouter);
app.use('/api/v1/appointments', appointmentRouter);
app.use('/api/v1/medical-records', medicalRecordRouter);
app.use('/api/v1/prescriptions', prescriptionRouter);
app.use('/api/v1/billing', billingRouter);
app.use('/api/v1/wards', wardRouter);
app.use('/api/v1/staff', staffRouter);
app.use('/api/v1/reports', reportRouter);
app.use('/api/v1/notifications', notificationRouter);
app.use('/api/v1/departments', departmentRouter);
app.use('/api/v1/dashboard', dashboardRouter);
app.use('/api/v1/pharmacy', pharmacyRouter);
app.use('/api/v1/lab', labRouter);

// Centralized error handler middleware
const { errorHandler } = require('./middleware/errorHandler');
app.use(errorHandler);

// Listen on port
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`HMS Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
  });
}

module.exports = app;
