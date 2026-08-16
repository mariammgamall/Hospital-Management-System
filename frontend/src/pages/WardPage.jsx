import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuthStore } from '../store/useAuthStore';
import { 
  BedDouble, 
  Plus, 
  X, 
  Loader2, 
  AlertCircle,
  TrendingUp,
  UserCheck,
  UserMinus,
  Briefcase,
  Layers,
  MapPin,
  Building,
  Activity,
  LogOut,
  FolderPlus
} from 'lucide-react';
import api from '../services/api';

function WardPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modal Admission states
  const [isAdmitModalOpen, setIsAdmitModalOpen] = useState(false);
  const [admitForm, setAdmitForm] = useState({
    patientId: '',
    bedId: '',
    reason: ''
  });
  const [admitError, setAdmitError] = useState(null);

  // Modal Ward creation states
  const [isWardModalOpen, setIsWardModalOpen] = useState(false);
  const [wardForm, setWardForm] = useState({
    name: '',
    floor: '1',
    type: 'General'
  });
  const [wardError, setWardError] = useState(null);

  // Modal Bed creation states
  const [isBedModalOpen, setIsBedModalOpen] = useState(false);
  const [bedForm, setBedForm] = useState({
    wardId: '',
    number: ''
  });
  const [bedError, setBedError] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get Ward Grid
      const gridRes = await api.get('/wards/grid');
      setData(gridRes.data);

      // Get patient profiles for admission
      if (['ADMIN', 'NURSE', 'RECEPTIONIST'].includes(user?.role)) {
        const patientsRes = await api.get('/patients');
        setPatients(patientsRes.data.patients || []);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch real-time bed layouts. Please reload.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdmitSubmit = async (e) => {
    e.preventDefault();
    setAdmitError(null);
    setActionLoading(true);

    try {
      if (!admitForm.patientId) throw new Error('Please select a patient.');
      if (!admitForm.bedId) throw new Error('Please select a bed.');
      if (!admitForm.reason.trim()) throw new Error('Please enter admission description.');

      const payload = {
        patientId: admitForm.patientId,
        bedId: admitForm.bedId,
        reason: admitForm.reason.trim()
      };

      await api.post('/wards/admissions', payload);
      
      setIsAdmitModalOpen(false);
      setAdmitForm({ patientId: '', bedId: '', reason: '' });
      fetchInitialData();
    } catch (err) {
      console.error(err);
      setAdmitError(err.response?.data?.message || err.message || 'Failed to admit patient.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDischarge = async (admissionId) => {
    if (!window.confirm('Confirm discharge for this patient? This will free up their bed immediately.')) return;
    try {
      setActionLoading(true);
      await api.patch(`/wards/admissions/${admissionId}/discharge`);
      fetchInitialData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to discharge patient.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateWard = async (e) => {
    e.preventDefault();
    setWardError(null);
    setActionLoading(true);

    try {
      if (!wardForm.name.trim()) throw new Error('Please enter a ward name.');
      
      const payload = {
        name: wardForm.name.trim(),
        floor: parseInt(wardForm.floor),
        type: wardForm.type
      };

      await api.post('/wards/wards', payload);
      
      setIsWardModalOpen(false);
      setWardForm({ name: '', floor: '1', type: 'General' });
      fetchInitialData();
    } catch (err) {
      console.error(err);
      setWardError(err.response?.data?.message || err.message || 'Failed to build ward.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateBed = async (e) => {
    e.preventDefault();
    setBedError(null);
    setActionLoading(true);

    try {
      if (!bedForm.wardId) throw new Error('Please select a ward.');
      if (!bedForm.number.trim()) throw new Error('Please enter bed number.');

      const payload = {
        wardId: bedForm.wardId,
        number: bedForm.number.trim()
      };

      await api.post('/wards/beds', payload);

      setIsBedModalOpen(false);
      setBedForm({ wardId: '', number: '' });
      fetchInitialData();
    } catch (err) {
      console.error(err);
      setBedError(err.response?.data?.message || err.message || 'Failed to add bed.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[70vh] flex flex-col justify-center items-center space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground font-semibold">Calibrating ward occupancy grids...</p>
      </div>
    );
  }

  const stats = data?.stats || { totalBeds: 0, availableBeds: 0, occupiedBeds: 0 };
  const wards = data?.wards || [];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Wards & Bed Occupancy</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Real-time visual monitoring of hospital wards, inpatient bed allocations, and clinical admissions.
          </p>
        </div>

        {user?.role === 'ADMIN' && (
          <div className="flex space-x-3">
            <button 
              onClick={() => setIsWardModalOpen(true)}
              className="flex items-center space-x-2 px-3 py-2 border border-border bg-card text-foreground font-bold text-xs rounded-xl hover:bg-muted transition-all"
            >
              <FolderPlus className="w-4 h-4 text-primary" />
              <span>Create Ward</span>
            </button>
            <button 
              onClick={() => setIsBedModalOpen(true)}
              className="flex items-center space-x-2 px-3.5 py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-premium hover:bg-primary/95 transition-all"
            >
              <Plus className="w-4.5 h-4.5" />
              <span>Add Bed Unit</span>
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center space-x-3 text-red-500 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* KPI Cards section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        
        {/* KPI: Total beds */}
        <div className="bg-card border border-border rounded-2xl shadow-premium p-6 flex justify-between items-center hover:shadow-premium-hover transition-all duration-300">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Beds Registered</p>
            <p className="text-2xl font-black">{stats.totalBeds}</p>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl">
            <BedDouble className="w-5 h-5" />
          </div>
        </div>

        {/* KPI: Available beds */}
        <div className="bg-card border border-border rounded-2xl shadow-premium p-6 flex justify-between items-center hover:shadow-premium-hover transition-all duration-300">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Vacant Beds</p>
            <p className="text-2xl font-black text-emerald-500">{stats.availableBeds}</p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        {/* KPI: Occupied beds */}
        <div className="bg-card border border-border rounded-2xl shadow-premium p-6 flex justify-between items-center hover:shadow-premium-hover transition-all duration-300">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Admitted Inpatients</p>
            <p className="text-2xl font-black text-amber-500">{stats.occupiedBeds}</p>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl">
            <Activity className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Main Ward Loop Section */}
      {wards.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl shadow-premium p-12 text-center flex flex-col items-center justify-center space-y-3">
          <Building className="w-12 h-12 text-muted-foreground/50" />
          <h3 className="text-base font-bold">No Hospital Wards Registered</h3>
          <p className="text-xs text-muted-foreground max-w-sm">
            Administrator accounts must create wards (e.g. ICU, General Unit) and assign bed keys.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {wards.map((ward) => (
            <div key={ward.id} className="bg-card border border-border rounded-2xl shadow-premium p-6 space-y-4">
              
              {/* Ward Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-border/75 pb-4 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase bg-primary/10 text-primary border border-primary/20 rounded">
                      {ward.type} Ward
                    </span>
                    <span className="text-xs text-muted-foreground font-semibold flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
                      Floor {ward.floor}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-foreground">{ward.name} Ward</h3>
                </div>

                <div className="text-[10px] text-muted-foreground font-bold bg-muted/40 px-3 py-1.5 rounded-lg border border-border/40">
                  Vacant: {ward.beds.filter(b => b.isAvailable).length} / Total Beds: {ward.beds.length}
                </div>
              </div>

              {/* Beds Grid */}
              {ward.beds.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground font-semibold">
                  No beds mapped in this ward unit.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {ward.beds.map((bed) => {
                    // Find active admission details if occupied
                    const activeAdm = bed.admissions?.[0];
                    return (
                      <div 
                        key={bed.id}
                        className={`border rounded-2xl shadow-premium p-4 flex flex-col justify-between space-y-4 transition-all duration-300 ${
                          bed.isAvailable 
                            ? 'bg-card border-border hover:border-emerald-500/40 hover:shadow-premium-hover' 
                            : 'bg-primary/5 border-primary/45'
                        }`}
                      >
                        {/* Bed Header */}
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <BedDouble className={`w-4 h-4 ${bed.isAvailable ? 'text-emerald-500' : 'text-primary'}`} />
                            <span className="text-xs font-black">{bed.number}</span>
                          </div>
                          
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            bed.isAvailable 
                              ? 'bg-emerald-500/10 text-emerald-500' 
                              : 'bg-primary/10 text-primary'
                          }`}>
                            {bed.isAvailable ? 'Vacant' : 'Occupied'}
                          </span>
                        </div>

                        {/* Occupation Body */}
                        {!bed.isAvailable && activeAdm ? (
                          <div className="space-y-2">
                            <div className="space-y-0.5">
                              <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Patient Admitted</p>
                              <p className="text-xs font-extrabold text-foreground">{activeAdm.patient?.firstName} {activeAdm.patient?.lastName}</p>
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Admission Reason</p>
                              <p className="text-xs text-muted-foreground font-medium leading-relaxed bg-muted/10 p-2 rounded-lg border border-border/30 max-h-16 overflow-y-auto">
                                {activeAdm.reason}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="py-4 text-center text-xs text-muted-foreground/60 font-medium">
                            Ready for clinical admission.
                          </div>
                        )}

                        {/* Actions */}
                        {['ADMIN', 'NURSE', 'RECEPTIONIST'].includes(user?.role) && (
                          <div className="pt-2.5 border-t border-border/55 flex justify-end">
                            {bed.isAvailable ? (
                              <button 
                                onClick={() => { setAdmitForm({ patientId: '', bedId: bed.id, reason: '' }); setIsAdmitModalOpen(true); }}
                                className="flex items-center space-x-1 text-[10px] text-emerald-500 font-bold uppercase tracking-wider hover:underline"
                              >
                                <UserCheck className="w-3.5 h-3.5 mr-1" />
                                <span>Admit Inpatient</span>
                              </button>
                            ) : (
                              ['ADMIN', 'NURSE'].includes(user?.role) && (
                                <button 
                                  onClick={() => handleDischarge(activeAdm.id)}
                                  className="flex items-center space-x-1 text-[10px] text-red-500 font-bold uppercase tracking-wider hover:underline"
                                >
                                  <UserMinus className="w-3.5 h-3.5 mr-1" />
                                  <span>Discharge</span>
                                </button>
                              )
                            )}
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          ))}
        </div>
      )}

      {/* Modal: Admit Patient */}
      {isAdmitModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md flex justify-center items-center p-4">
          <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
            
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/10">
              <h3 className="text-base font-extrabold flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-primary" />
                <span>Admit Patient to Bed Unit</span>
              </h3>
              <button 
                onClick={() => { setIsAdmitModalOpen(false); setAdmitError(null); }}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdmitSubmit} className="p-6 space-y-4">
              {admitError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center space-x-2 text-red-500 text-xs font-semibold">
                  <AlertCircle className="w-4.5 h-4.5" />
                  <span>{admitError}</span>
                </div>
              )}

              {/* Patient */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select Patient</label>
                <select
                  required
                  value={admitForm.patientId}
                  onChange={(e) => setAdmitForm(prev => ({ ...prev, patientId: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
                >
                  <option value="">-- Choose Patient Profile --</option>
                  {patients.map((pat) => (
                    <option key={pat.id} value={pat.id}>
                      {pat.firstName} {pat.lastName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bed pre-selection read-only feedback */}
              <div className="bg-primary/5 p-3 rounded-xl border border-primary/10 text-xs space-y-1">
                <p className="font-bold text-primary">Assigned Bed Target Key:</p>
                <p className="font-semibold text-muted-foreground">
                  {wards.flatMap(w => w.beds).find(b => b.id === admitForm.bedId)?.number || 'No Bed Unit Picked'}
                </p>
              </div>

              {/* Reason */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Admission Symptoms / Clinical Reason</label>
                <textarea
                  required
                  rows="3"
                  placeholder="E.g. Inpatient recovery after orthopedic surgery, respiratory support monitoring..."
                  value={admitForm.reason}
                  onChange={(e) => setAdmitForm(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-muted/40 border border-border rounded-xl focus:outline-none resize-none"
                />
              </div>

              <div className="flex space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => { setIsAdmitModalOpen(false); setAdmitError(null); }}
                  className="w-1/2 px-4 py-2.5 bg-muted text-foreground border border-border font-bold text-xs rounded-xl hover:bg-muted/80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-1/2 px-4 py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-premium hover:bg-primary/95 flex justify-center items-center"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Complete Admission'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: Create Ward */}
      {isWardModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md flex justify-center items-center p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
            
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/10">
              <h3 className="text-base font-extrabold flex items-center space-x-2">
                <Building className="w-5 h-5 text-primary" />
                <span>Build New Ward Unit</span>
              </h3>
              <button 
                onClick={() => { setIsWardModalOpen(false); setWardError(null); }}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWard} className="p-6 space-y-4">
              {wardError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center space-x-2 text-red-500 text-xs font-semibold">
                  <AlertCircle className="w-4.5 h-4.5" />
                  <span>{wardError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ward Name</label>
                <input 
                  type="text"
                  required
                  placeholder="E.g. Intensive Care Unit, Pediatric Ward A"
                  value={wardForm.name}
                  onChange={(e) => setWardForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-muted/40 border border-border rounded-xl focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Floor Level</label>
                  <input 
                    type="number"
                    min="0"
                    required
                    value={wardForm.floor}
                    onChange={(e) => setWardForm(prev => ({ ...prev, floor: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-muted/40 border border-border rounded-xl focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ward Type Category</label>
                  <select
                    value={wardForm.type}
                    onChange={(e) => setWardForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-muted/40 border border-border rounded-xl focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="General">General</option>
                    <option value="ICU">ICU</option>
                    <option value="Pediatric">Pediatric</option>
                    <option value="Isolation">Isolation</option>
                  </select>
                </div>
              </div>

              <div className="flex space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => { setIsWardModalOpen(false); setWardError(null); }}
                  className="w-1/2 px-4 py-2.5 bg-muted text-foreground border border-border font-bold text-xs rounded-xl hover:bg-muted/80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-1/2 px-4 py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-premium hover:bg-primary/95 flex justify-center items-center"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Build Ward'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: Create Bed */}
      {isBedModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md flex justify-center items-center p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
            
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/10">
              <h3 className="text-base font-extrabold flex items-center space-x-2">
                <BedDouble className="w-5 h-5 text-primary" />
                <span>Add Bed Unit</span>
              </h3>
              <button 
                onClick={() => { setIsBedModalOpen(false); setBedError(null); }}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBed} className="p-6 space-y-4">
              {bedError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center space-x-2 text-red-500 text-xs font-semibold">
                  <AlertCircle className="w-4.5 h-4.5" />
                  <span>{bedError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select Destination Ward</label>
                <select
                  required
                  value={bedForm.wardId}
                  onChange={(e) => setBedForm(prev => ({ ...prev, wardId: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-muted/40 border border-border rounded-xl focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="">-- Choose Ward --</option>
                  {wards.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} (Floor {w.floor})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Bed Number / Label Key</label>
                <input 
                  type="text"
                  required
                  placeholder="E.g. Bed-C3, ICU-04"
                  value={bedForm.number}
                  onChange={(e) => setBedForm(prev => ({ ...prev, number: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-muted/40 border border-border rounded-xl focus:outline-none"
                />
              </div>

              <div className="flex space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => { setIsBedModalOpen(false); setBedError(null); }}
                  className="w-1/2 px-4 py-2.5 bg-muted text-foreground border border-border font-bold text-xs rounded-xl hover:bg-muted/80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-1/2 px-4 py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-premium hover:bg-primary/95 flex justify-center items-center"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Bed'}
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

export default WardPage;
