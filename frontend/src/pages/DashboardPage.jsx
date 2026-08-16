import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { 
  Users, 
  Calendar, 
  Bed, 
  DollarSign, 
  Activity, 
  Loader2, 
  PlusCircle, 
  TrendingUp,
  FileText,
  HeartPulse,
  Building,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Briefcase
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import api from '../services/api';
import { Link } from 'react-router-dom';
import { getDoctorName } from '../utils/doctorHelper';

function DashboardPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[75vh] flex flex-col justify-center items-center space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground font-semibold">Compiling clinical metrics...</p>
      </div>
    );
  }

  // --- 1. PATIENT DASHBOARD RENDER ---
  if (user?.role === 'PATIENT') {
    const appointments = data?.appointments || [];
    const medicalRecords = data?.medicalRecords || [];
    const prescriptions = data?.prescriptions || [];
    const invoices = data?.invoices || [];

    const pendingInvoicesCount = invoices.filter(inv => inv.status !== 'PAID').length;

    return (
      <div className="space-y-8 animate-fade-in">
        {/* Welcome Header */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.firstName} {user?.lastName}
          </h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">
            Your patient health records and appointments status portal.
          </p>
        </div>

        {/* Patient stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-card border border-border rounded-2xl shadow-premium p-6 flex items-center justify-between hover:shadow-premium-hover transition-all duration-300">
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Upcoming Visits</p>
              <p className="text-3xl font-black">{appointments.filter(a => new Date(a.dateTime) >= new Date()).length}</p>
            </div>
            <div className="p-3.5 bg-blue-500/10 text-blue-500 rounded-2xl">
              <Calendar className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl shadow-premium p-6 flex items-center justify-between hover:shadow-premium-hover transition-all duration-300">
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">EMR Summaries</p>
              <p className="text-3xl font-black">{medicalRecords.length}</p>
            </div>
            <div className="p-3.5 bg-emerald-500/10 text-emerald-500 rounded-2xl">
              <FileText className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl shadow-premium p-6 flex items-center justify-between hover:shadow-premium-hover transition-all duration-300">
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active Prescriptions</p>
              <p className="text-3xl font-black">{prescriptions.length}</p>
            </div>
            <div className="p-3.5 bg-amber-500/10 text-amber-500 rounded-2xl">
              <HeartPulse className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl shadow-premium p-6 flex items-center justify-between hover:shadow-premium-hover transition-all duration-300">
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pending Invoices</p>
              <p className="text-3xl font-black">{pendingInvoicesCount}</p>
            </div>
            <div className="p-3.5 bg-purple-500/10 text-purple-500 rounded-2xl">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Upcoming appointments & billing */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Upcoming appointments */}
          <div className="lg:col-span-7 bg-card border border-border rounded-2xl shadow-premium p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-primary" />
                <span>Your Appointment Schedule</span>
              </h3>
              <Link to="/appointments" className="text-xs text-primary font-bold hover:underline">View All</Link>
            </div>

            <div className="divide-y divide-border overflow-hidden">
              {appointments.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">No appointments booked yet.</div>
              ) : (
                appointments.slice(0, 5).map(appt => (
                  <div key={appt.id} className="py-4 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-black">{getDoctorName(appt.doctor)}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{appt.doctor?.specialty}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">Reason: "{appt.reason}"</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-xs font-bold text-foreground">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground mr-1" />
                        {new Date(appt.dateTime).toLocaleString('en-EG', { dateStyle: 'medium', timeStyle: 'short' })}
                      </div>
                      <span className={`inline-block mt-1 px-2 py-0.5 text-[9px] font-black rounded ${
                        appt.status === 'CONFIRMED' ? 'bg-emerald-500/10 text-emerald-600' :
                        appt.status === 'SCHEDULED' ? 'bg-blue-500/10 text-blue-600' :
                        'bg-red-500/10 text-red-600'
                      }`}>
                        {appt.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Invoices */}
          <div className="lg:col-span-5 bg-card border border-border rounded-2xl shadow-premium p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-primary" />
                <span>Recent Invoices & Bills</span>
              </h3>
              <Link to="/billing" className="text-xs text-primary font-bold hover:underline">View All</Link>
            </div>

            <div className="divide-y divide-border overflow-hidden">
              {invoices.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">No invoices generated.</div>
              ) : (
                invoices.slice(0, 5).map(inv => (
                  <div key={inv.id} className="py-4 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold">Invoice Ref: INV-{inv.id.substring(0, 6).toUpperCase()}</p>
                      <p className="text-[10px] text-muted-foreground font-semibold">{new Date(inv.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black">{inv.totalAmount.toFixed(2)} EGP</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 text-[9px] font-black rounded ${
                        inv.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-600' :
                        inv.status === 'PENDING' ? 'bg-amber-500/10 text-amber-600' :
                        'bg-purple-500/10 text-purple-600'
                      }`}>
                        {inv.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Clinical History: EMRs & Prescriptions */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* EMR Column */}
          <div className="lg:col-span-6 bg-card border border-border rounded-2xl shadow-premium p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold flex items-center space-x-2">
                <FileText className="w-5 h-5 text-primary" />
                <span>Your Clinical Record Logs</span>
              </h3>
              <Link to="/medical-records" className="text-xs text-primary font-bold hover:underline">View All</Link>
            </div>

            <div className="divide-y divide-border overflow-hidden">
              {medicalRecords.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">No clinical records found.</div>
              ) : (
                medicalRecords.slice(0, 3).map(rec => (
                  <div key={rec.id} className="py-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] text-muted-foreground font-semibold">{new Date(rec.createdAt).toLocaleDateString()}</span>
                        <p className="text-xs font-black text-foreground mt-0.5">Diagnosed: {rec.diagnosis}</p>
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground">By: {getDoctorName(rec.doctor)}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-normal">
                      <strong>Symptoms:</strong> {rec.symptoms}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Rx Column */}
          <div className="lg:col-span-6 bg-card border border-border rounded-2xl shadow-premium p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold flex items-center space-x-2">
                <HeartPulse className="w-5 h-5 text-primary" />
                <span>Prescribed Medications</span>
              </h3>
              <Link to="/prescriptions" className="text-xs text-primary font-bold hover:underline">View All</Link>
            </div>

            <div className="divide-y divide-border overflow-hidden">
              {prescriptions.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">No prescriptions issued.</div>
              ) : (
                prescriptions.slice(0, 3).map(rx => (
                  <div key={rx.id} className="py-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] text-muted-foreground font-semibold">{new Date(rx.createdAt).toLocaleDateString()}</span>
                        <p className="text-xs font-black text-foreground mt-0.5">Drugs: {rx.medicines?.map(m => m.name).join(', ')}</p>
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground">By: {getDoctorName(rx.doctor)}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {rx.medicines?.map(m => (
                        <span key={m.id} className="px-2 py-0.5 bg-muted/60 border border-border text-[9px] rounded font-semibold">
                          {m.name} ({m.dosage}) • {m.frequency}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- 2. DOCTOR DASHBOARD RENDER ---
  if (user?.role === 'DOCTOR') {
    const todayAppointments = data?.todayAppointments || [];
    const patientsCount = data?.patientsCount || 0;
    const recentRecords = data?.recentRecords || [];

    return (
      <div className="space-y-8 animate-fade-in">
        {/* Welcome Header */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.firstName}
          </h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">
            Clinical Practitioner dashboard portal. View and manage patient itineraries.
          </p>
        </div>

        {/* Doctor stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
          <div className="bg-card border border-border rounded-2xl shadow-premium p-6 flex items-center justify-between hover:shadow-premium-hover transition-all duration-300">
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Today's Visits</p>
              <p className="text-3xl font-black">{todayAppointments.length}</p>
            </div>
            <div className="p-3.5 bg-blue-500/10 text-blue-500 rounded-2xl">
              <Calendar className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl shadow-premium p-6 flex items-center justify-between hover:shadow-premium-hover transition-all duration-300">
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Clinical Patients</p>
              <p className="text-3xl font-black">{patientsCount}</p>
            </div>
            <div className="p-3.5 bg-emerald-500/10 text-emerald-500 rounded-2xl">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl shadow-premium p-6 flex items-center justify-between hover:shadow-premium-hover transition-all duration-300">
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">EMRs Logged</p>
              <p className="text-3xl font-black">{recentRecords.length}</p>
            </div>
            <div className="p-3.5 bg-amber-500/10 text-amber-500 rounded-2xl">
              <FileText className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Doctor agenda & logs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Schedule */}
          <div className="lg:col-span-7 bg-card border border-border rounded-2xl shadow-premium p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-primary" />
                <span>Today's Consultation Schedule</span>
              </h3>
              <Link to="/appointments" className="text-xs text-primary font-bold hover:underline">Manage All</Link>
            </div>

            <div className="divide-y divide-border overflow-hidden">
              {todayAppointments.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">No consultations booked for today.</div>
              ) : (
                todayAppointments.map(appt => (
                  <div key={appt.id} className="py-4 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-black">{appt.patient?.firstName} {appt.patient?.lastName}</p>
                      <p className="text-[10px] text-muted-foreground font-semibold">Reason: "{appt.reason}"</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-xs font-bold text-foreground">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground mr-1" />
                        {new Date(appt.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <span className={`inline-block mt-1 px-2 py-0.5 text-[9px] font-black rounded ${
                        appt.status === 'CONFIRMED' ? 'bg-emerald-500/10 text-emerald-600' :
                        appt.status === 'SCHEDULED' ? 'bg-blue-500/10 text-blue-600' :
                        'bg-red-500/10 text-red-600'
                      }`}>
                        {appt.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Records Logged */}
          <div className="lg:col-span-5 bg-card border border-border rounded-2xl shadow-premium p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold flex items-center space-x-2">
                <FileText className="w-5 h-5 text-primary" />
                <span>Recent EMRs You Logged</span>
              </h3>
              <Link to="/records" className="text-xs text-primary font-bold hover:underline">Add New</Link>
            </div>

            <div className="divide-y divide-border overflow-hidden">
              {recentRecords.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">No recent medical records logged.</div>
              ) : (
                recentRecords.slice(0, 5).map(rec => (
                  <div key={rec.id} className="py-3.5">
                    <p className="text-xs font-black">{rec.patient?.firstName} {rec.patient?.lastName}</p>
                    <p className="text-[11px] text-muted-foreground font-semibold">Diagnosis: {rec.diagnosis}</p>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-[9px] text-muted-foreground/75 font-semibold">{new Date(rec.createdAt).toLocaleDateString()}</span>
                      <Link to="/records" className="text-[9px] text-primary font-bold hover:underline">View File</Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- 3. NURSE DASHBOARD RENDER ---
  if (user?.role === 'NURSE') {
    const availableBeds = data?.availableBeds || 0;
    const activeAdmissions = data?.activeAdmissions || [];
    const wardStatus = data?.wardStatus || [];

    return (
      <div className="space-y-8 animate-fade-in">
        {/* Welcome Header */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.firstName}
          </h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">
            Ward lead nurse dashboard. Monitor patient occupancy and available bed registry.
          </p>
        </div>

        {/* Nurse stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
          <div className="bg-card border border-border rounded-2xl shadow-premium p-6 flex items-center justify-between hover:shadow-premium-hover transition-all duration-300">
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Available Beds</p>
              <p className="text-3xl font-black">{availableBeds}</p>
            </div>
            <div className="p-3.5 bg-emerald-500/10 text-emerald-500 rounded-2xl">
              <Bed className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl shadow-premium p-6 flex items-center justify-between hover:shadow-premium-hover transition-all duration-300">
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active Inpatients</p>
              <p className="text-3xl font-black">{activeAdmissions.length}</p>
            </div>
            <div className="p-3.5 bg-blue-500/10 text-blue-500 rounded-2xl">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl shadow-premium p-6 flex items-center justify-between hover:shadow-premium-hover transition-all duration-300">
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Operational Wards</p>
              <p className="text-3xl font-black">{wardStatus.length}</p>
            </div>
            <div className="p-3.5 bg-purple-500/10 text-purple-500 rounded-2xl">
              <Building className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Ward status & Active Occupants */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Active Occupants list */}
          <div className="lg:col-span-7 bg-card border border-border rounded-2xl shadow-premium p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold flex items-center space-x-2">
                <Users className="w-5 h-5 text-primary" />
                <span>Active Inpatient Admissions</span>
              </h3>
              <Link to="/wards" className="text-xs text-primary font-bold hover:underline">Manage Admissions</Link>
            </div>

            <div className="divide-y divide-border overflow-hidden">
              {activeAdmissions.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">No active ward inpatients.</div>
              ) : (
                activeAdmissions.slice(0, 5).map(adm => (
                  <div key={adm.id} className="py-4 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-black">{adm.patient?.firstName} {adm.patient?.lastName}</p>
                      <p className="text-[10px] text-muted-foreground font-semibold">Reason: "{adm.reason}"</p>
                      <p className="text-[9px] text-muted-foreground/75 font-semibold mt-1">Admitted: {new Date(adm.admissionDate).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2.5 py-1 bg-blue-500/10 text-blue-600 font-bold text-[10px] rounded-lg border border-blue-500/20">
                        Bed {adm.bed?.number} ({adm.bed?.ward?.name})
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Ward status summary */}
          <div className="lg:col-span-5 bg-card border border-border rounded-2xl shadow-premium p-6 space-y-4">
            <h3 className="text-base font-bold flex items-center space-x-2">
              <Building className="w-5 h-5 text-primary" />
              <span>Ward Capacity Summary</span>
            </h3>

            <div className="space-y-4 pt-2">
              {wardStatus.map(ward => (
                <div key={ward.id} className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="font-extrabold">{ward.name}</span>
                    <span className="text-muted-foreground">
                      {ward.capacity - ward.available} / {ward.capacity} Beds ({ward.occupancyRate}% Full)
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        ward.occupancyRate >= 85 ? 'bg-red-500' :
                        ward.occupancyRate >= 50 ? 'bg-amber-500' :
                        'bg-emerald-500'
                      }`}
                      style={{ width: `${ward.occupancyRate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- 4. RECEPTIONIST DASHBOARD RENDER ---
  if (user?.role === 'RECEPTIONIST') {
    const todayAppointments = data?.todayAppointments || [];
    const recentPatients = data?.recentPatients || [];

    return (
      <div className="space-y-8 animate-fade-in">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.firstName}
            </h1>
            <p className="text-muted-foreground text-sm font-medium mt-1">
              Front Desk receptionist console. Schedule client visits and manage records.
            </p>
          </div>

          <div className="flex space-x-3">
            <Link
              to="/appointments"
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-premium hover:bg-primary/95 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Book Appointment</span>
            </Link>
            <Link
              to="/patients"
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-premium hover:bg-indigo-700 transition-colors"
            >
              <Users className="w-4 h-4" />
              <span>Register Patient</span>
            </Link>
          </div>
        </div>

        {/* Receptionist Stats */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-2xl shadow-premium p-6 flex items-center justify-between hover:shadow-premium-hover transition-all duration-300">
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Today's Total Appointments</p>
              <p className="text-3xl font-black">{todayAppointments.length}</p>
            </div>
            <div className="p-3.5 bg-blue-500/10 text-blue-500 rounded-2xl">
              <Calendar className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl shadow-premium p-6 flex items-center justify-between hover:shadow-premium-hover transition-all duration-300">
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Recently Registered Patients</p>
              <p className="text-3xl font-black">{recentPatients.length}</p>
            </div>
            <div className="p-3.5 bg-emerald-500/10 text-emerald-500 rounded-2xl">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Action Panel and Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Today's Schedule */}
          <div className="lg:col-span-7 bg-card border border-border rounded-2xl shadow-premium p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-primary" />
                <span>Today's General Consultation Itinerary</span>
              </h3>
              <Link to="/appointments" className="text-xs text-primary font-bold hover:underline">Bookings Calendar</Link>
            </div>

            <div className="divide-y divide-border overflow-hidden">
              {todayAppointments.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">No clinic bookings recorded for today.</div>
              ) : (
                todayAppointments.map(appt => (
                  <div key={appt.id} className="py-4 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-black">{appt.patient?.firstName} {appt.patient?.lastName}</p>
                      <p className="text-[10px] text-muted-foreground font-semibold">Doctor: {getDoctorName(appt.doctor)} ({appt.doctor?.specialty})</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Reason: "{appt.reason}"</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-xs font-bold text-foreground">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground mr-1" />
                        {new Date(appt.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <span className={`inline-block mt-1 px-2 py-0.5 text-[9px] font-black rounded ${
                        appt.status === 'CONFIRMED' ? 'bg-emerald-500/10 text-emerald-600' :
                        appt.status === 'SCHEDULED' ? 'bg-blue-500/10 text-blue-600' :
                        'bg-red-500/10 text-red-600'
                      }`}>
                        {appt.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Registrations */}
          <div className="lg:col-span-5 bg-card border border-border rounded-2xl shadow-premium p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold flex items-center space-x-2">
                <Users className="w-5 h-5 text-primary" />
                <span>Recent Registrations Overview</span>
              </h3>
              <Link to="/patients" className="text-xs text-primary font-bold hover:underline">View Register</Link>
            </div>

            <div className="divide-y divide-border overflow-hidden">
              {recentPatients.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">No recent patient registrations logged.</div>
              ) : (
                recentPatients.slice(0, 5).map(pat => (
                  <div key={pat.id} className="py-3">
                    <p className="text-xs font-black">{pat.firstName} {pat.lastName}</p>
                    <p className="text-[10px] text-muted-foreground font-semibold">Mobile: {pat.phoneNumber || 'N/A'} • Blood: {pat.bloodType || 'N/A'}</p>
                    <p className="text-[9px] text-muted-foreground/75 font-semibold mt-0.5">Joined: {new Date(pat.createdAt).toLocaleDateString()}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- 5. ADMIN DASHBOARD RENDER (DEFAULT) ---
  const kpis = data?.kpis || { totalPatients: 0, todayAppointments: 0, availableBeds: 0, revenueToday: 0 };
  const weeklyChart = data?.charts?.weeklyAppointments || [];
  const genderChart = data?.charts?.patientGender || [];
  const feed = data?.activityFeed || [];

  const COLORS = ['#0e8ce4', '#ec4899', '#f59e0b', '#06b6d4'];

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.firstName || 'CareSync'}
          </h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">
            Clinical status reporting is active and operating normally.
          </p>
        </div>
        
        <div className="flex space-x-3">
          <Link
            to="/appointments"
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-premium hover:bg-primary/95 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Book Appointment</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grids */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Patients */}
        <div className="bg-card border border-border rounded-2xl shadow-premium p-6 flex items-center justify-between hover:shadow-premium-hover transition-all duration-300">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Patients</p>
            <p className="text-3xl font-black">{kpis.totalPatients}</p>
          </div>
          <div className="p-3.5 bg-blue-500/10 text-blue-500 rounded-2xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Today's Appointments */}
        <div className="bg-card border border-border rounded-2xl shadow-premium p-6 flex items-center justify-between hover:shadow-premium-hover transition-all duration-300">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Today's Slots</p>
            <p className="text-3xl font-black">{kpis.todayAppointments}</p>
          </div>
          <div className="p-3.5 bg-amber-500/10 text-amber-500 rounded-2xl">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        {/* Available Beds */}
        <div className="bg-card border border-border rounded-2xl shadow-premium p-6 flex items-center justify-between hover:shadow-premium-hover transition-all duration-300">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Available Beds</p>
            <p className="text-3xl font-black">{kpis.availableBeds}</p>
          </div>
          <div className="p-3.5 bg-emerald-500/10 text-emerald-500 rounded-2xl">
            <Bed className="w-6 h-6" />
          </div>
        </div>

        {/* Revenue Today */}
        <div className="bg-card border border-border rounded-2xl shadow-premium p-6 flex items-center justify-between hover:shadow-premium-hover transition-all duration-300">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Revenue Today</p>
            <p className="text-3xl font-black">{kpis.revenueToday.toFixed(2)} EGP</p>
          </div>
          <div className="p-3.5 bg-purple-500/10 text-purple-500 rounded-2xl">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Visual Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Weekly Appointments Chart */}
        <div className="lg:col-span-8 bg-card border border-border rounded-2xl shadow-premium p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span>Weekly Appointments Overview</span>
            </h3>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156, 163, 175, 0.1)" />
                <XAxis dataKey="day" stroke="#9ca3af" fontSize={11} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: '1px solid var(--border)', 
                    backgroundColor: 'var(--card)',
                    color: 'var(--foreground)'
                  }} 
                />
                <Bar dataKey="appointments" fill="#0e8ce4" radius={[6, 6, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gender Distribution Pie Chart */}
        <div className="lg:col-span-4 bg-card border border-border rounded-2xl shadow-premium p-6 space-y-4">
          <h3 className="text-base font-bold">Patient Demographics</h3>
          <div className="h-72 flex flex-col justify-center">
            {genderChart.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground">No demographic data found.</p>
            ) : (
              <div className="relative h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genderChart}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {genderChart.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Recents Feeds Section */}
      <div className="bg-card border border-border rounded-2xl shadow-premium p-6 space-y-4">
        <h3 className="text-base font-bold flex items-center space-x-2">
          <Activity className="w-5 h-5 text-primary" />
          <span>Recent Activity Feed</span>
        </h3>
        
        <div className="divide-y divide-border max-h-96 overflow-y-auto pr-2">
          {feed.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground font-medium">
              No recent logs recorded.
            </div>
          ) : (
            feed.map((act) => (
              <div key={act.id} className="py-4 flex justify-between items-start space-x-4">
                <div className="space-y-1.5 max-w-2xl">
                  <span className={`px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-md ${
                    act.type === 'APPOINTMENT' ? 'bg-blue-500/10 text-blue-500' :
                    act.type === 'ADMISSION' ? 'bg-emerald-500/10 text-emerald-500' :
                    'bg-purple-500/10 text-purple-500'
                  }`}>
                    {act.type}
                  </span>
                  <p className="text-sm font-semibold">{act.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{act.description}</p>
                </div>
                <div className="text-[10px] text-muted-foreground/75 font-semibold shrink-0">
                  {new Date(act.time).toLocaleDateString()} at {new Date(act.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}

export default DashboardPage;
