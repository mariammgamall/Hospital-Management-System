import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  User, 
  Calendar, 
  Mail, 
  Award,
  Clock,
  Briefcase,
  Loader2, 
  Trash2,
  X
} from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/useAuthStore';

function DoctorPage() {
  const { user } = useAuthStore();
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters & Queries
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [specialty, setSpecialty] = useState('');

  // Active Tabs: 'LIST', 'CREATE', 'PROFILE'
  const [activeTab, setActiveTab] = useState('LIST');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    specialty: '',
    departmentId: '',
    contactInfo: '',
    schedule: {
      Monday: ['09:00-12:00', '14:00-17:00'],
      Wednesday: ['09:00-12:00', '14:00-17:00'],
      Friday: ['09:00-12:00', '14:00-17:00']
    }
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDoctors();
    fetchDepartments();
  }, [departmentId, specialty, activeTab]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const res = await api.get('/doctors', {
        params: {
          search: search || undefined,
          departmentId: departmentId || undefined,
          specialty: specialty || undefined
        }
      });
      setDoctors(res.data.doctors || []);
    } catch (err) {
      console.error('Failed to load doctors list');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/departments');
      setDepartments(res.data.departments || []);
    } catch (err) {
      console.warn('Failed to load departments');
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDoctors();
  };

  const handleFetchProfile = async (id) => {
    try {
      setProfileLoading(true);
      setActiveTab('PROFILE');
      const res = await api.get(`/doctors/${id}`);
      setSelectedDoctor(res.data.doctor);
    } catch (err) {
      console.error('Failed to load doctor profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.email) errors.email = 'Email address is required.';
    if (!formData.password) errors.password = 'Initial password is required.';
    if (!formData.firstName) errors.firstName = 'First name is required.';
    if (!formData.lastName) errors.lastName = 'Last name is required.';
    if (!formData.specialty) errors.specialty = 'Medical specialty is required.';
    if (!formData.departmentId) errors.departmentId = 'Department assignment is required.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateDoctor = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      await api.post('/doctors', formData);
      setActiveTab('LIST');
      // Reset Form state
      setFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        specialty: '',
        departmentId: '',
        contactInfo: '',
        schedule: {
          Monday: ['09:00-12:00', '14:00-17:00'],
          Wednesday: ['09:00-12:00', '14:00-17:00'],
          Friday: ['09:00-12:00', '14:00-17:00']
        }
      });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to register doctor profile.';
      setFormErrors({ form: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDoctor = async (id) => {
    if (!confirm('Are you absolutely certain you wish to delete this doctor? This action cascades user account and active appointments!')) return;
    try {
      await api.delete(`/doctors/${id}`);
      fetchDoctors();
    } catch (err) {
      console.error('Failed to delete doctor account');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* 1. Header Navigation Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 border-b border-border pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Clinician Registry</h1>
          <p className="text-sm text-muted-foreground font-medium mt-1">
            Maintain specialist schedules and doctor rosters.
          </p>
        </div>

        <div className="flex space-x-3">
          {activeTab !== 'LIST' && (
            <button
              onClick={() => setActiveTab('LIST')}
              className="px-4 py-2 border border-border bg-card hover:bg-muted text-sm font-semibold rounded-xl transition-colors"
            >
              Back to Directory
            </button>
          )}

          {activeTab === 'LIST' && user?.role === 'ADMIN' && (
            <button
              onClick={() => setActiveTab('CREATE')}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground font-bold text-sm rounded-xl shadow-premium hover:bg-primary/95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Doctor</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. ACTIVE PANEL VIEWS */}

      {/* VIEW A: DOCTORS LISTINGS */}
      {activeTab === 'LIST' && (
        <div className="space-y-6">
          
          {/* Query filter bar */}
          <div className="bg-card border border-border rounded-2xl shadow-premium p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
            <form onSubmit={handleSearchSubmit} className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search specialists by name or department..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-input bg-muted/20 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent"
              />
            </form>

            <div className="flex gap-3 w-full md:w-auto">
              <div className="flex items-center space-x-2 bg-muted/20 border border-border px-3 py-1.5 rounded-xl text-xs w-full justify-between">
                <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
                <select 
                  value={departmentId} 
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="bg-transparent focus:outline-none font-bold"
                >
                  <option value="">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2 bg-muted/20 border border-border px-3 py-1.5 rounded-xl text-xs w-full justify-between">
                <Award className="w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Specialty filter..."
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="bg-transparent focus:outline-none font-bold placeholder-muted-foreground w-20"
                />
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          {loading ? (
            <div className="p-16 flex justify-center items-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : doctors.length === 0 ? (
            <div className="p-16 text-center text-sm text-muted-foreground font-semibold bg-card border border-border rounded-2xl shadow-premium">
              No specialists matched the filter criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {doctors.map((doc) => (
                <div 
                  key={doc.id}
                  className="bg-card border border-border rounded-2xl shadow-premium overflow-hidden hover:shadow-premium-hover hover:border-primary/30 transition-all duration-300 flex flex-col justify-between"
                >
                  {/* Doctor basic header */}
                  <div className="p-6 space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-sm shrink-0">
                        {doc.specialty.charAt(0)}{doc.specialty.charAt(1).toUpperCase()}
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="font-bold text-base truncate hover:underline cursor-pointer" onClick={() => handleFetchProfile(doc.id)}>
                          {doc.contactInfo || 'Dr. Specialist'}
                        </h4>
                        <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded bg-primary/15 text-primary border border-primary/20">
                          {doc.specialty}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs border-t border-border pt-4 text-muted-foreground font-semibold">
                      <div className="flex items-center space-x-2">
                        <Briefcase className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="text-foreground">{doc.department.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="truncate">{doc.user.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="p-4 bg-muted/20 border-t border-border flex justify-between items-center text-xs">
                    <button 
                      onClick={() => handleFetchProfile(doc.id)}
                      className="px-3.5 py-1.5 font-bold bg-card border border-border rounded-xl hover:bg-muted text-foreground transition-colors"
                    >
                      Audit Schedule
                    </button>
                    
                    {user?.role === 'ADMIN' && (
                      <button 
                        onClick={() => handleDeleteDoctor(doc.id)}
                        className="p-2 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW B: CREATE NEW DOCTOR ACCOUNT */}
      {activeTab === 'CREATE' && (
        <div className="max-w-2xl mx-auto bg-card border border-border rounded-2xl shadow-premium p-8 space-y-6">
          <h3 className="text-xl font-extrabold">Register Specialist Doctor</h3>

          {formErrors.form && (
            <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-xs font-bold border border-destructive/20">
              {formErrors.form}
            </div>
          )}

          <form onSubmit={handleCreateDoctor} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">First Name</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-input text-sm bg-muted/20 focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {formErrors.firstName && <span className="text-[10px] text-destructive font-semibold">{formErrors.firstName}</span>}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-input text-sm bg-muted/20 focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {formErrors.lastName && <span className="text-[10px] text-destructive font-semibold">{formErrors.lastName}</span>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Specialty</label>
                <input
                  type="text"
                  placeholder="e.g. Cardiology, Orthopedics"
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-input text-sm bg-muted/20 focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {formErrors.specialty && <span className="text-[10px] text-destructive font-semibold">{formErrors.specialty}</span>}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Assigned Hospital Department</label>
                <select
                  value={formData.departmentId}
                  onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-input text-sm bg-muted/20 focus:outline-none"
                >
                  <option value="">Select Department...</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                {formErrors.departmentId && <span className="text-[10px] text-destructive font-semibold">{formErrors.departmentId}</span>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Professional Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. alex.brown@caresync.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-input text-sm bg-muted/20 focus:outline-none"
                />
                {formErrors.email && <span className="text-[10px] text-destructive font-semibold">{formErrors.email}</span>}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Roster Login Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-input text-sm bg-muted/20 focus:outline-none"
                />
                {formErrors.password && <span className="text-[10px] text-destructive font-semibold">{formErrors.password}</span>}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Roster Details & Contacts</label>
              <input
                type="text"
                placeholder="Dr. FirstName LastName, Ph: +1..."
                value={formData.contactInfo}
                onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-input text-sm bg-muted/20 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/95 transition-all shadow-premium"
            >
              {submitting ? 'Registering Doctor Account...' : 'Confirm Account Provisioning'}
            </button>
          </form>
        </div>
      )}

      {/* VIEW C: DETAILED DOCTOR PROFILE SCHEDULES */}
      {activeTab === 'PROFILE' && (
        <div className="space-y-6">
          {profileLoading ? (
            <div className="p-16 flex justify-center items-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : !selectedDoctor ? (
            <div className="p-16 text-center text-sm text-muted-foreground bg-card border border-border rounded-2xl">
              Specialist profile not found.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Doctor Details Profile */}
              <div className="lg:col-span-5 bg-card border border-border rounded-2xl shadow-premium p-6 space-y-6">
                <div className="text-center space-y-3">
                  <div className="w-20 h-20 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center text-2xl font-black">
                    {selectedDoctor.specialty.charAt(0)}{selectedDoctor.specialty.charAt(1).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{selectedDoctor.contactInfo || 'Dr. Specialist'}</h3>
                    <p className="text-xs text-primary font-bold uppercase tracking-wider mt-1">{selectedDoctor.specialty}</p>
                  </div>
                </div>

                <div className="border-t border-border pt-4 space-y-3 text-xs leading-relaxed">
                  <div className="flex items-center space-x-2.5 text-muted-foreground">
                    <Briefcase className="w-4 h-4 text-primary shrink-0" />
                    <span className="font-semibold text-foreground">Department: {selectedDoctor.department.name}</span>
                  </div>

                  <div className="flex items-center space-x-2.5 text-muted-foreground">
                    <Mail className="w-4 h-4 text-primary shrink-0" />
                    <span className="font-semibold text-foreground">{selectedDoctor.user.email}</span>
                  </div>
                </div>

                {/* Weekly Shifts Grid */}
                <div className="border-t border-border pt-4 space-y-3">
                  <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center space-x-1.5">
                    <Clock className="w-4 h-4 text-primary" />
                    <span>Weekly Roster Shifts</span>
                  </h4>
                  
                  <div className="space-y-2">
                    {Object.entries(selectedDoctor.schedule || {}).map(([day, slots]) => (
                      <div key={day} className="flex justify-between items-center text-xs p-2.5 border border-border bg-muted/25 rounded-xl">
                        <span className="font-bold text-foreground">{day}</span>
                        <div className="flex gap-1.5">
                          {slots.map((s, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold border border-primary/15">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Doctor Appointments Agenda */}
              <div className="lg:col-span-7 bg-card border border-border rounded-2xl shadow-premium p-6 space-y-4">
                <h3 className="text-base font-bold flex items-center space-x-2 border-b border-border pb-3">
                  <Calendar className="w-5 h-5 text-primary" />
                  <span>Roster Slots Agenda</span>
                </h3>

                {selectedDoctor.appointments?.length === 0 ? (
                  <p className="text-center text-xs text-muted-foreground py-8">No scheduled appointments logged for this doctor.</p>
                ) : (
                  <div className="space-y-3">
                    {selectedDoctor.appointments.map((app) => (
                      <div key={app.id} className="p-4 border border-border bg-muted/25 rounded-xl flex justify-between items-center text-xs">
                        <div className="space-y-1.5">
                          <p className="font-bold text-foreground">
                            Patient: {app.patient.firstName} {app.patient.lastName}
                          </p>
                          <p className="text-muted-foreground font-semibold leading-relaxed">Reason: {app.reason}</p>
                          <p className="text-[10px] text-muted-foreground">Slot: {new Date(app.dateTime).toLocaleString()}</p>
                        </div>
                        
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded shrink-0 ${
                          app.status === 'CONFIRMED' ? 'bg-emerald-500/10 text-emerald-500' :
                          app.status === 'SCHEDULED' ? 'bg-blue-500/10 text-blue-500' :
                          app.status === 'COMPLETED' ? 'bg-muted text-muted-foreground' :
                          'bg-red-500/10 text-red-500'
                        }`}>
                          {app.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      )}

    </div>
  );
}

export default DoctorPage;
