import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Search, 
  Plus, 
  Filter, 
  User, 
  Calendar, 
  Phone, 
  MapPin, 
  Heart, 
  Trash2, 
  Edit, 
  Loader2, 
  Activity, 
  FileText, 
  Bed, 
  CreditCard,
  X,
  FileCheck
} from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/useAuthStore';

function PatientPage() {
  const { user } = useAuthStore();
  const [patients, setPatients] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [gender, setGender] = useState('');
  const [bloodType, setBloodType] = useState('');

  // Active view tabs: 'LIST', 'CREATE', 'PROFILE'
  const [activeTab, setActiveTab] = useState('LIST');
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Forms state
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    gender: 'Male',
    dateOfBirth: '',
    bloodType: 'O+',
    phoneNumber: '',
    address: '',
    medicalHistory: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Confirmation Modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState(null);

  useEffect(() => {
    if (activeTab === 'LIST') {
      fetchPatients();
    }
  }, [page, gender, bloodType, activeTab]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const res = await api.get('/patients', {
        params: {
          page,
          limit: 10,
          search: search || undefined,
          gender: gender || undefined,
          bloodType: bloodType || undefined
        }
      });
      setPatients(res.data.patients || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error('Failed to load patients list');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPatients();
  };

  const handleFetchProfile = async (id) => {
    try {
      setProfileLoading(true);
      setSelectedPatientId(id);
      setActiveTab('PROFILE');
      const res = await api.get(`/patients/${id}`);
      setSelectedPatient(res.data.patient);
    } catch (err) {
      console.error('Failed to load patient clinical history profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.firstName) errors.firstName = 'First name is required.';
    if (!formData.lastName) errors.lastName = 'Last name is required.';
    if (!formData.dateOfBirth) errors.dateOfBirth = 'Date of birth is required.';
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Invalid email address.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreatePatient = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      await api.post('/patients', formData);
      setActiveTab('LIST');
      setPage(1);
      // Reset Form
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        gender: 'Male',
        dateOfBirth: '',
        bloodType: 'O+',
        phoneNumber: '',
        address: '',
        medicalHistory: ''
      });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create patient account.';
      setFormErrors({ form: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePatient = async () => {
    try {
      await api.delete(`/patients/${patientToDelete.id}`);
      setShowDeleteModal(false);
      setPatientToDelete(null);
      fetchPatients();
    } catch (err) {
      console.error('Failed to delete patient');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 border-b border-border pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Patient Directory</h1>
          <p className="text-sm text-muted-foreground font-medium mt-1">
            Register and audit hospital inpatient records.
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

          {activeTab === 'LIST' && (
            <button
              onClick={() => setActiveTab('CREATE')}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground font-bold text-sm rounded-xl shadow-premium hover:bg-primary/95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Register Patient</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. MAIN ACTIVE LAYOUT VIEWPORTS */}

      {/* VIEW A: LIST TABLE GRID */}
      {activeTab === 'LIST' && (
        <div className="space-y-6">
          {/* Query Filter Area */}
          <div className="bg-card border border-border rounded-2xl shadow-premium p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
            <form onSubmit={handleSearchSubmit} className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search patients by name or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-input bg-muted/20 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent"
              />
            </form>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex items-center space-x-2 bg-muted/20 border border-border px-3 py-1.5 rounded-xl text-xs w-full sm:w-auto justify-between">
                <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                <select 
                  value={gender} 
                  onChange={(e) => { setGender(e.target.value); setPage(1); }}
                  className="bg-transparent focus:outline-none font-bold"
                >
                  <option value="">All Genders</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex items-center space-x-2 bg-muted/20 border border-border px-3 py-1.5 rounded-xl text-xs w-full sm:w-auto justify-between">
                <Heart className="w-3.5 h-3.5 text-muted-foreground" />
                <select 
                  value={bloodType} 
                  onChange={(e) => { setBloodType(e.target.value); setPage(1); }}
                  className="bg-transparent focus:outline-none font-bold"
                >
                  <option value="">All Blood Types</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
            </div>
          </div>

          {/* Directory Listings Table */}
          <div className="bg-card border border-border rounded-2xl shadow-premium overflow-hidden">
            {loading ? (
              <div className="p-16 flex justify-center items-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : patients.length === 0 ? (
              <div className="p-16 text-center text-sm text-muted-foreground font-semibold">
                No active patients registered.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border text-xs text-muted-foreground uppercase font-bold">
                      <th className="p-4">Name</th>
                      <th className="p-4">Gender</th>
                      <th className="p-4">DOB / Age</th>
                      <th className="p-4">Contact</th>
                      <th className="p-4">Blood</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {patients.map((p) => {
                      const age = new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear();
                      return (
                        <tr key={p.id} className="hover:bg-muted/10 transition-colors">
                          <td className="p-4 font-bold text-primary hover:underline cursor-pointer" onClick={() => handleFetchProfile(p.id)}>
                            {p.firstName} {p.lastName}
                          </td>
                          <td className="p-4 font-semibold text-xs text-muted-foreground">{p.gender}</td>
                          <td className="p-4 font-medium">
                            {new Date(p.dateOfBirth).toLocaleDateString()} <span className="text-xs text-muted-foreground font-bold">({age}y)</span>
                          </td>
                          <td className="p-4 font-medium text-xs text-muted-foreground">{p.phoneNumber || 'N/A'}</td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 text-[10px] font-black rounded bg-red-500/10 text-red-500 border border-red-500/20">
                              {p.bloodType || 'N/A'}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="inline-flex space-x-2">
                              <button 
                                onClick={() => handleFetchProfile(p.id)}
                                className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                title="Clinical EMR Profile"
                              >
                                <User className="w-4 h-4" />
                              </button>
                              {user?.role === 'ADMIN' && (
                                <button 
                                  onClick={() => { setPatientToDelete(p); setShowDeleteModal(true); }}
                                  className="p-1.5 rounded-lg border border-red-500/20 hover:bg-red-500/10 text-red-500 transition-colors"
                                  title="Remove patient record"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-border bg-muted/10 flex justify-between items-center text-xs">
                <span className="text-muted-foreground font-semibold">
                  Page {page} of {totalPages}
                </span>
                <div className="flex space-x-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="px-3 py-1.5 border border-border bg-card rounded-lg disabled:opacity-50 text-xs font-semibold hover:bg-muted"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                    className="px-3 py-1.5 border border-border bg-card rounded-lg disabled:opacity-50 text-xs font-semibold hover:bg-muted"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW B: CREATE NEW PATIENT FORM */}
      {activeTab === 'CREATE' && (
        <div className="max-w-2xl mx-auto bg-card border border-border rounded-2xl shadow-premium p-8 space-y-6">
          <h3 className="text-xl font-extrabold">Register Inpatient Profile</h3>
          
          {formErrors.form && (
            <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-xs font-bold border border-destructive/20">
              {formErrors.form}
            </div>
          )}

          <form onSubmit={handleCreatePatient} className="space-y-4">
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-input text-sm bg-muted/20 focus:outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Date of Birth</label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-input text-sm bg-muted/20 focus:outline-none"
                />
                {formErrors.dateOfBirth && <span className="text-[10px] text-destructive font-semibold">{formErrors.dateOfBirth}</span>}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Blood Group</label>
                <select
                  value={formData.bloodType}
                  onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-input text-sm bg-muted/20 focus:outline-none"
                >
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Work Email (Optional)</label>
                <input
                  type="email"
                  placeholder="Creates user portal account"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-input text-sm bg-muted/20 focus:outline-none"
                />
                {formErrors.email && <span className="text-[10px] text-destructive font-semibold">{formErrors.email}</span>}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Phone Number</label>
                <input
                  type="tel"
                  placeholder="e.g. +1 555-0199"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-input text-sm bg-muted/20 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Home Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-input text-sm bg-muted/20 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Past Medical History (EMR Details)</label>
              <textarea
                rows={3}
                placeholder="List major diagnoses, surgeries, or chronic conditions..."
                value={formData.medicalHistory}
                onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-input text-sm bg-muted/20 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/95 transition-all shadow-premium"
            >
              {submitting ? 'Registering Patient Record...' : 'Confirm Registration'}
            </button>
          </form>
        </div>
      )}

      {/* VIEW C: DETAILED CLINICAL HISTORY PROFILE */}
      {activeTab === 'PROFILE' && (
        <div className="space-y-6">
          {profileLoading ? (
            <div className="p-16 flex justify-center items-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : !selectedPatient ? (
            <div className="p-16 text-center text-sm text-muted-foreground">
              Patient profile not found.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Profile Card Summary */}
              <div className="lg:col-span-4 bg-card border border-border rounded-2xl shadow-premium p-6 space-y-6">
                <div className="text-center space-y-3">
                  <div className="w-20 h-20 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center text-2xl font-black">
                    {selectedPatient.firstName.charAt(0)}{selectedPatient.lastName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{selectedPatient.firstName} {selectedPatient.lastName}</h3>
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">{selectedPatient.gender}</p>
                  </div>
                </div>

                <div className="border-t border-border pt-4 space-y-3 text-xs">
                  <div className="flex items-center space-x-2.5 text-muted-foreground">
                    <Calendar className="w-4 h-4 text-primary shrink-0" />
                    <span className="font-semibold text-foreground">
                      Born: {new Date(selectedPatient.dateOfBirth).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2.5 text-muted-foreground">
                    <Phone className="w-4 h-4 text-primary shrink-0" />
                    <span className="font-semibold text-foreground">
                      {selectedPatient.phoneNumber || 'No phone logged'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2.5 text-muted-foreground">
                    <MapPin className="w-4 h-4 text-primary shrink-0" />
                    <span className="font-semibold text-foreground leading-relaxed">
                      {selectedPatient.address || 'No address logged'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2.5 text-muted-foreground">
                    <Heart className="w-4 h-4 text-red-500 shrink-0" />
                    <span className="font-bold text-red-500 uppercase tracking-wider bg-red-500/10 border border-red-500/10 px-2.5 py-0.5 rounded">
                      Blood: {selectedPatient.bloodType || 'N/A'}
                    </span>
                  </div>
                </div>

                {selectedPatient.medicalHistory && (
                  <div className="border-t border-border pt-4 space-y-1.5">
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Clinical History</p>
                    <p className="text-xs leading-relaxed text-muted-foreground font-medium whitespace-pre-line">
                      {selectedPatient.medicalHistory}
                    </p>
                  </div>
                )}
              </div>

              {/* Patient EMR Timeline Tabs */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Clinical Consultations Logs */}
                <div className="bg-card border border-border rounded-2xl shadow-premium p-6 space-y-4">
                  <h3 className="text-base font-bold flex items-center space-x-2 border-b border-border pb-3">
                    <FileText className="w-5 h-5 text-primary" />
                    <span>Clinical EMR Timeline</span>
                  </h3>
                  
                  {selectedPatient.medicalRecords?.length === 0 ? (
                    <p className="text-center text-xs text-muted-foreground py-6">No clinical history records logged.</p>
                  ) : (
                    <div className="space-y-6 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-border">
                      {selectedPatient.medicalRecords.map((rec) => (
                        <div key={rec.id} className="relative pl-10 space-y-2">
                          {/* Dot indicator */}
                          <div className="absolute left-2 top-1.5 transform -translate-x-1/2 w-3.5 h-3.5 rounded-full border-2 border-card bg-primary shadow-premium"></div>
                          
                          <div className="flex justify-between items-center text-xs text-muted-foreground font-semibold">
                            <span>Visit: {new Date(rec.createdAt).toLocaleDateString()}</span>
                            <span>Diagnosed by: {rec.doctor.contactInfo || 'Staff'}</span>
                          </div>

                          <div className="p-4 rounded-xl border border-border bg-muted/25 space-y-3 text-xs leading-relaxed">
                            <p className="font-bold text-foreground">Diagnosis: <span className="text-primary">{rec.diagnosis}</span></p>
                            <p className="text-muted-foreground"><strong className="text-foreground">Symptoms:</strong> {rec.symptoms}</p>
                            {rec.notes && <p className="text-muted-foreground"><strong className="text-foreground">Clinical Notes:</strong> {rec.notes}</p>}
                            
                            {rec.prescriptions?.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-border space-y-2">
                                <p className="font-bold text-foreground flex items-center space-x-1.5">
                                  <FileCheck className="w-4 h-4 text-emerald-500" />
                                  <span>Attached Prescriptions:</span>
                                </p>
                                <ul className="list-disc pl-4 text-[11px] text-muted-foreground font-semibold space-y-1">
                                  {rec.prescriptions.map((rx) => rx.medicines.map((m) => (
                                    <li key={m.id}>
                                      {m.name} - {m.dosage} ({m.frequency} for {m.duration})
                                    </li>
                                  )))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Admission & Billing Overviews */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Bed Grid Admissions */}
                  <div className="bg-card border border-border rounded-2xl shadow-premium p-6 space-y-4">
                    <h4 className="text-sm font-bold flex items-center space-x-2 border-b border-border pb-3">
                      <Bed className="w-4.5 h-4.5 text-primary" />
                      <span>Bed Occupancy Logs</span>
                    </h4>
                    
                    {selectedPatient.admissions?.length === 0 ? (
                      <p className="text-center text-xs text-muted-foreground py-4">No inpatient records found.</p>
                    ) : (
                      <div className="space-y-3 text-xs">
                        {selectedPatient.admissions.map((adm) => (
                          <div key={adm.id} className="p-3 border border-border bg-muted/25 rounded-xl flex justify-between items-center">
                            <div>
                              <p className="font-bold">{adm.bed.ward.name} ({adm.bed.number})</p>
                              <p className="text-[10px] text-muted-foreground font-semibold">Admitted: {new Date(adm.admissionDate).toLocaleDateString()}</p>
                            </div>
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                              adm.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'
                            }`}>
                              {adm.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Financial Invoices */}
                  <div className="bg-card border border-border rounded-2xl shadow-premium p-6 space-y-4">
                    <h4 className="text-sm font-bold flex items-center space-x-2 border-b border-border pb-3">
                      <CreditCard className="w-4.5 h-4.5 text-primary" />
                      <span>Financial Invoices</span>
                    </h4>
                    
                    {selectedPatient.invoices?.length === 0 ? (
                      <p className="text-center text-xs text-muted-foreground py-4">No invoices generated.</p>
                    ) : (
                      <div className="space-y-3 text-xs">
                        {selectedPatient.invoices.map((inv) => (
                          <div key={inv.id} className="p-3 border border-border bg-muted/25 rounded-xl flex justify-between items-center">
                            <div>
                              <p className="font-bold">Total Bill: {inv.totalAmount.toFixed(2)} EGP</p>
                              <p className="text-[10px] text-muted-foreground font-semibold">Paid: {inv.paidAmount.toFixed(2)} EGP</p>
                            </div>
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                              inv.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-500' :
                              inv.status === 'PENDING' ? 'bg-amber-500/10 text-amber-500' :
                              'bg-purple-500/10 text-purple-500'
                            }`}>
                              {inv.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>

              </div>

            </div>
          )}
        </div>
      )}

      {/* 3. CONFIRMATION DELETION MODAL */}
      {showDeleteModal && patientToDelete && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-card border border-border shadow-2xl rounded-2xl p-6 space-y-4 animate-slide-up">
            <h3 className="text-lg font-bold">Remove Inpatient Record</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you absolutely certain you wish to remove the patient records of <strong>{patientToDelete.firstName} {patientToDelete.lastName}</strong>? This action cascades clinical history logs and invoices!
            </p>
            <div className="flex space-x-3 pt-2">
              <button 
                onClick={() => { setShowDeleteModal(false); setPatientToDelete(null); }}
                className="w-1/2 py-2 border border-border rounded-xl text-xs font-bold hover:bg-muted"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeletePatient}
                className="w-1/2 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-500 shadow-lg"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}

export default PatientPage;
