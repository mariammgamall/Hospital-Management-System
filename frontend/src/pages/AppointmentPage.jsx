import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuthStore } from '../store/useAuthStore';
import { 
  Calendar as CalendarIcon, 
  List, 
  Plus, 
  Trash2, 
  User, 
  Clock, 
  FileText, 
  Search, 
  Filter, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  MoreHorizontal,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import api from '../services/api';
import { getDoctorName } from '../utils/doctorHelper';

function AppointmentPage() {
  const { user } = useAuthStore();
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // View mode: 'list' or 'grid' (calendar style cards)
  const [viewMode, setViewMode] = useState('list');
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Booking modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    dateTime: '',
    reason: ''
  });
  const [modalError, setModalError] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build queries based on role
      let queryParams = {};
      if (user?.role === 'PATIENT') {
        queryParams.patientId = user.patientProfileId;
      } else if (user?.role === 'DOCTOR') {
        queryParams.doctorId = user.doctorProfileId;
      }
      
      const apptsRes = await api.get('/appointments', { params: queryParams });
      setAppointments(apptsRes.data.appointments || []);

      // If user can book appointments (ADMIN, RECEPTIONIST, PATIENT), load doctors and patients
      if (['ADMIN', 'RECEPTIONIST'].includes(user?.role)) {
        const [patientsRes, doctorsRes] = await Promise.all([
          api.get('/patients'),
          api.get('/doctors')
        ]);
        setPatients(patientsRes.data.patients || []);
        setDoctors(doctorsRes.data.doctors || []);
      } else if (user?.role === 'PATIENT') {
        const doctorsRes = await api.get('/doctors');
        setDoctors(doctorsRes.data.doctors || []);
        setFormData(prev => ({ ...prev, patientId: user.patientProfileId }));
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch appointment metadata. Please refresh page.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      let queryParams = {};
      if (user?.role === 'PATIENT') {
        queryParams.patientId = user.patientProfileId;
      } else if (user?.role === 'DOCTOR') {
        queryParams.doctorId = user.doctorProfileId;
      }
      
      // Add filters
      if (statusFilter) queryParams.status = statusFilter;
      if (doctorFilter) queryParams.doctorId = doctorFilter;
      if (searchQuery) queryParams.search = searchQuery;

      const res = await api.get('/appointments', { params: queryParams });
      setAppointments(res.data.appointments || []);
    } catch (err) {
      console.warn('Failed to filter appointments', err);
    }
  };

  // Re-run filtering when dependencies change
  useEffect(() => {
    if (!loading) {
      fetchAppointments();
    }
  }, [statusFilter, doctorFilter, searchQuery]);

  const handleBook = async (e) => {
    e.preventDefault();
    setModalError(null);
    setActionLoading(true);

    try {
      const payload = {
        patientId: user?.role === 'PATIENT' ? user.patientProfileId : formData.patientId,
        doctorId: formData.doctorId,
        dateTime: new Date(formData.dateTime).toISOString(),
        reason: formData.reason
      };

      if (!payload.patientId) throw new Error('Please select a patient.');
      if (!payload.doctorId) throw new Error('Please select a doctor.');
      if (!formData.dateTime) throw new Error('Please select a date and time.');
      if (!formData.reason.trim()) throw new Error('Please enter a clinical reason.');

      await api.post('/appointments', payload);
      
      setIsModalOpen(false);
      // Reset form
      setFormData({
        patientId: user?.role === 'PATIENT' ? user.patientProfileId : '',
        doctorId: '',
        dateTime: '',
        reason: ''
      });
      
      // Refresh
      fetchInitialData();
    } catch (err) {
      console.error(err);
      setModalError(err.response?.data?.message || err.message || 'Failed to book appointment. Doctor slot conflict detected.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (appointmentId, newStatus) => {
    try {
      setActionLoading(true);
      await api.patch(`/appointments/${appointmentId}/status`, { status: newStatus });
      fetchInitialData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to delete this appointment record?')) return;
    try {
      setActionLoading(true);
      await api.delete(`/appointments/${appointmentId}`);
      fetchInitialData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete record.');
    } finally {
      setActionLoading(false);
    }
  };

  // Render status badge helper
  const renderStatusBadge = (status) => {
    const styles = {
      SCHEDULED: 'bg-blue-500/10 text-blue-500 border border-blue-500/20',
      CONFIRMED: 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20',
      COMPLETED: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20',
      CANCELLED: 'bg-red-500/10 text-red-500 border border-red-500/20'
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${styles[status] || ''}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="h-[70vh] flex flex-col justify-center items-center space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground font-semibold">Aligning patient appointment schedules...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Appointments Scheduling</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage active doctor consultations, schedule time-slots, and update clinic progress.
          </p>
        </div>

        {['ADMIN', 'RECEPTIONIST', 'PATIENT'].includes(user?.role) && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-premium hover:bg-primary/95 transition-all"
          >
            <Plus className="w-4.5 h-4.5" />
            <span>Book Consultation Slot</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center space-x-3 text-red-500 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* Control Filters panel */}
      <div className="bg-card border border-border rounded-2xl shadow-premium p-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search bar */}
          <div className="relative flex-1 md:flex-initial min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text"
              placeholder="Search reason or patient..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full text-xs bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Status selector */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-3 pr-8 py-2 text-xs bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          </div>

          {/* Doctor selector (for staff view) */}
          {user?.role !== 'DOCTOR' && user?.role !== 'PATIENT' && (
            <div className="relative">
              <select
                value={doctorFilter}
                onChange={(e) => setDoctorFilter(e.target.value)}
                className="pl-3 pr-8 py-2 text-xs bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
              >
                <option value="">All Specialists</option>
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {getDoctorName(doc)} ({doc.specialty})
                  </option>
                ))}
              </select>
              <User className="absolute right-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            </div>
          )}
        </div>

        {/* View mode toggle */}
        <div className="flex bg-muted/50 p-1 rounded-xl border border-border">
          <button 
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <List className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <CalendarIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Appointment displays */}
      {appointments.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl shadow-premium p-12 text-center flex flex-col items-center justify-center space-y-3">
          <CalendarIcon className="w-12 h-12 text-muted-foreground/60" />
          <h3 className="text-base font-bold">No Appointments Found</h3>
          <p className="text-xs text-muted-foreground max-w-sm">
            There are currently no active appointments corresponding to your selection or filters.
          </p>
        </div>
      ) : viewMode === 'list' ? (
        
        // 1. List View
        <div className="bg-card border border-border rounded-2xl shadow-premium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/20 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="p-4 pl-6">Patient</th>
                  <th className="p-4">Doctor Specialty</th>
                  <th className="p-4">Date & Time</th>
                  <th className="p-4">Reason</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {appointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-muted/10 transition-colors">
                    {/* Patient Info */}
                    <td className="p-4 pl-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                          {appt.patient?.firstName?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-bold text-xs">
                            {appt.patient?.firstName} {appt.patient?.lastName}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-semibold">
                            {appt.patient?.phoneNumber || 'No contact'}
                          </p>
                        </div>
                      </div>
                    </td>
                    
                    {/* Doctor Info */}
                    <td className="p-4">
                      <div>
                        <p className="font-bold text-xs">
                          {getDoctorName(appt.doctor)}
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                          {appt.doctor?.specialty || 'General Practice'}
                        </p>
                      </div>
                    </td>

                    {/* Date/Time */}
                    <td className="p-4">
                      <div className="flex items-center space-x-2 text-xs">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="font-semibold">
                          {new Date(appt.dateTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                      </div>
                    </td>

                    {/* Reason */}
                    <td className="p-4">
                      <p className="text-xs text-muted-foreground max-w-xs truncate font-medium">
                        {appt.reason}
                      </p>
                    </td>

                    {/* Status badge */}
                    <td className="p-4">
                      {renderStatusBadge(appt.status)}
                    </td>

                    {/* Actions panel */}
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {/* Status updates triggers */}
                        {['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'].includes(user?.role) && appt.status !== 'COMPLETED' && appt.status !== 'CANCELLED' && (
                          <div className="relative group">
                            <button className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                            <div className="absolute right-0 bottom-full mb-1 w-32 bg-card border border-border rounded-xl shadow-premium hidden group-hover:block z-20 text-left overflow-hidden">
                              <div className="p-1 text-[10px] font-bold text-muted-foreground uppercase bg-muted/40 border-b border-border text-center">Update Status</div>
                              {appt.status === 'SCHEDULED' && (
                                <button 
                                  onClick={() => handleUpdateStatus(appt.id, 'CONFIRMED')}
                                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-indigo-500/10 hover:text-indigo-500 font-semibold"
                                >
                                  Confirm
                                </button>
                              )}
                              {['SCHEDULED', 'CONFIRMED'].includes(appt.status) && (
                                <button 
                                  onClick={() => handleUpdateStatus(appt.id, 'COMPLETED')}
                                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-emerald-500/10 hover:text-emerald-500 font-semibold"
                                >
                                  Complete
                                </button>
                              )}
                              <button 
                                onClick={() => handleUpdateStatus(appt.id, 'CANCELLED')}
                                className="w-full text-left px-3 py-1.5 text-xs hover:bg-red-500/10 hover:text-red-500 font-semibold border-t border-border/40"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Delete for Admin/Receptionist */}
                        {['ADMIN', 'RECEPTIONIST'].includes(user?.role) && (
                          <button 
                            onClick={() => handleDelete(appt.id)}
                            className="p-1.5 rounded-lg border border-red-500/15 text-red-500 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        
        // 2. Grid View
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {appointments.map((appt) => (
            <div key={appt.id} className="bg-card border border-border rounded-2xl shadow-premium p-6 space-y-4 hover:shadow-premium-hover transition-all duration-300 relative overflow-hidden">
              {/* Badge indicator */}
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-2">
                  <CalendarIcon className="w-4 h-4 text-primary" />
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Appointment Card</span>
                </div>
                {renderStatusBadge(appt.status)}
              </div>

              {/* Core Body Details */}
              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Patient Name</p>
                  <p className="text-sm font-extrabold">{appt.patient?.firstName} {appt.patient?.lastName}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Consulting Specialist</p>
                  <p className="text-xs font-semibold text-foreground/90">
                    {getDoctorName(appt.doctor)} ({appt.doctor?.specialty || 'General Practice'})
                  </p>
                </div>

                <div className="flex justify-between items-center bg-muted/30 p-3 rounded-xl border border-border/50">
                  <div className="flex items-center space-x-2 text-xs">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <span className="font-bold">
                      {new Date(appt.dateTime).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(appt.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Clinical Description</p>
                  <p className="text-xs leading-relaxed text-muted-foreground bg-muted/10 p-2 border border-border/30 rounded-lg">{appt.reason}</p>
                </div>
              </div>

              {/* Row actions */}
              {['ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE'].includes(user?.role) && (
                <div className="flex justify-end space-x-2 pt-2 border-t border-border/55">
                  {appt.status !== 'COMPLETED' && appt.status !== 'CANCELLED' && (
                    <>
                      {appt.status === 'SCHEDULED' && (
                        <button 
                          onClick={() => handleUpdateStatus(appt.id, 'CONFIRMED')}
                          className="px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase bg-indigo-500/10 text-indigo-500 rounded-md border border-indigo-500/25 hover:bg-indigo-500/20"
                        >
                          Confirm
                        </button>
                      )}
                      <button 
                        onClick={() => handleUpdateStatus(appt.id, 'COMPLETED')}
                        className="px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase bg-emerald-500/10 text-emerald-500 rounded-md border border-emerald-500/25 hover:bg-emerald-500/20"
                      >
                        Complete
                      </button>
                      <button 
                        onClick={() => handleUpdateStatus(appt.id, 'CANCELLED')}
                        className="px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase bg-red-500/10 text-red-500 rounded-md border border-red-500/25 hover:bg-red-500/20"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  {['ADMIN', 'RECEPTIONIST'].includes(user?.role) && (
                    <button 
                      onClick={() => handleDelete(appt.id)}
                      className="p-1 text-red-500 hover:bg-red-500/10 rounded-md"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Booking Form Modal Overlay */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md flex justify-center items-center p-4">
          <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/10">
              <h3 className="text-base font-extrabold flex items-center space-x-2">
                <CalendarIcon className="w-5 h-5 text-primary" />
                <span>Book Doctor Appointment</span>
              </h3>
              <button 
                onClick={() => { setIsModalOpen(false); setModalError(null); }}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form body */}
            <form onSubmit={handleBook} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center space-x-2 text-red-500 text-xs font-semibold">
                  <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Patient Selection (for staff) */}
              {['ADMIN', 'RECEPTIONIST'].includes(user?.role) ? (
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select Patient</label>
                  <select
                    required
                    value={formData.patientId}
                    onChange={(e) => setFormData(prev => ({ ...prev, patientId: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
                  >
                    <option value="">-- Select Patient Profile --</option>
                    {patients.map((pat) => (
                      <option key={pat.id} value={pat.id}>
                        {pat.firstName} {pat.lastName} (DOB: {new Date(pat.dateOfBirth).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="bg-primary/5 border border-primary/10 p-3.5 rounded-xl text-xs space-y-1">
                  <p className="font-bold text-primary">Booking for yourself:</p>
                  <p className="font-semibold text-muted-foreground">{user?.firstName} {user?.lastName} ({user?.email})</p>
                </div>
              )}

              {/* Doctor Specialty Selection */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select Specialist</label>
                <select
                  required
                  value={formData.doctorId}
                  onChange={(e) => setFormData(prev => ({ ...prev, doctorId: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
                >
                  <option value="">-- Select Specialist --</option>
                  {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {getDoctorName(doc)} ({doc.specialty})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Time selection */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Date & Time Slot</label>
                <input 
                  type="datetime-local"
                  required
                  value={formData.dateTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateTime: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <span className="text-[10px] text-muted-foreground leading-normal mt-1 block">
                  * Dynamic clash check ensures at least 30-minutes slot buffer safety.
                </span>
              </div>

              {/* Clinical symptoms/reason */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Reason / Symptoms</label>
                <textarea
                  required
                  rows="3"
                  placeholder="E.g. Fever, persistent cough for 3 days, routine cardiology review..."
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setModalError(null); }}
                  className="w-1/2 px-4 py-2.5 bg-muted text-foreground border border-border font-bold text-xs rounded-xl hover:bg-muted/80 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-1/2 px-4 py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-premium hover:bg-primary/95 transition-all flex justify-center items-center"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Reservation'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}

export default AppointmentPage;
