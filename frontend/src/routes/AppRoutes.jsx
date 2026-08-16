import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import AppLayout from '../layouts/AppLayout';
import AuthLayout from '../layouts/AuthLayout';

// Pages imports
import LoginPage from '../pages/LoginPage';
import SignupPage from '../pages/SignupPage';
import DashboardPage from '../pages/DashboardPage';
import PatientPage from '../pages/PatientPage';
import DoctorPage from '../pages/DoctorPage';
import AppointmentPage from '../pages/AppointmentPage';
import MedicalRecordPage from '../pages/MedicalRecordPage';
import PrescriptionPage from '../pages/PrescriptionPage';
import PharmacyPage from '../pages/PharmacyPage';
import LabPage from '../pages/LabPage';
import BillingPage from '../pages/BillingPage';
import WardPage from '../pages/WardPage';
import StaffPage from '../pages/StaffPage';
import ReportPage from '../pages/ReportPage';

/**
 * Route protection wrapper based on authentication state
 */
function ProtectedRoute({ children }) {
  const { accessToken, initialize, isLoading } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold tracking-wide text-muted-foreground">Hydrating session...</p>
        </div>
      </div>
    );
  }

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  return <AppLayout>{children}</AppLayout>;
}

/**
 * Route protection based on User Role permissions
 */
function RoleProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="h-[60vh] flex flex-col justify-center items-center text-center space-y-4">
        <div className="p-3 bg-red-500/10 text-red-500 rounded-full">
          <svg className="w-12 h-12" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <h3 className="text-xl font-bold">Access Restrained</h3>
        <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
          You do not hold permissions required to view this clinical page. Contact your system admin if this is an error.
        </p>
      </div>
    );
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* 1. Public Authentication Route */}
      <Route 
        path="/login" 
        element={
          <AuthLayout>
            <LoginPage />
          </AuthLayout>
        } 
      />

      <Route 
        path="/signup" 
        element={
          <AuthLayout>
            <SignupPage />
          </AuthLayout>
        } 
      />

      {/* 2. Protected Role-based Application Routes */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/patients" 
        element={
          <ProtectedRoute>
            <RoleProtectedRoute allowedRoles={['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'BILLING']}>
              <PatientPage />
            </RoleProtectedRoute>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/doctors" 
        element={
          <ProtectedRoute>
            <RoleProtectedRoute allowedRoles={['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'PATIENT']}>
              <DoctorPage />
            </RoleProtectedRoute>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/appointments" 
        element={
          <ProtectedRoute>
            <AppointmentPage />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/medical-records" 
        element={
          <ProtectedRoute>
            <RoleProtectedRoute allowedRoles={['ADMIN', 'DOCTOR', 'NURSE', 'PATIENT']}>
              <MedicalRecordPage />
            </RoleProtectedRoute>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/prescriptions" 
        element={
          <ProtectedRoute>
            <RoleProtectedRoute allowedRoles={['ADMIN', 'DOCTOR', 'NURSE', 'PHARMACIST', 'PATIENT']}>
              <PrescriptionPage />
            </RoleProtectedRoute>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/pharmacy" 
        element={
          <ProtectedRoute>
            <RoleProtectedRoute allowedRoles={['ADMIN', 'PHARMACIST', 'DOCTOR', 'NURSE']}>
              <PharmacyPage />
            </RoleProtectedRoute>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/lab" 
        element={
          <ProtectedRoute>
            <RoleProtectedRoute allowedRoles={['ADMIN', 'DOCTOR', 'LAB_TECHNICIAN', 'PATIENT']}>
              <LabPage />
            </RoleProtectedRoute>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/billing" 
        element={
          <ProtectedRoute>
            <RoleProtectedRoute allowedRoles={['ADMIN', 'BILLING', 'RECEPTIONIST', 'PATIENT']}>
              <BillingPage />
            </RoleProtectedRoute>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/wards" 
        element={
          <ProtectedRoute>
            <RoleProtectedRoute allowedRoles={['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST']}>
              <WardPage />
            </RoleProtectedRoute>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/staff" 
        element={
          <ProtectedRoute>
            <RoleProtectedRoute allowedRoles={['ADMIN']}>
              <StaffPage />
            </RoleProtectedRoute>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/reports" 
        element={
          <ProtectedRoute>
            <RoleProtectedRoute allowedRoles={['ADMIN', 'BILLING']}>
              <ReportPage />
            </RoleProtectedRoute>
          </ProtectedRoute>
        } 
      />

      {/* Fallback routes */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default AppRoutes;

