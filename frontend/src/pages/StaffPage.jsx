import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuthStore } from '../store/useAuthStore';
import { 
  ShieldCheck, 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  Loader2, 
  AlertCircle,
  Briefcase,
  Layers,
  Activity,
  PlusCircle,
  Mail,
  Lock,
  UserCheck
} from 'lucide-react';
import api from '../services/api';

function StaffPage() {
  const [staff, setStaff] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  // Search/Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  // Register Modal State
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'NURSE',
    departmentId: ''
  });
  const [registerError, setRegisterError] = useState(null);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    id: '',
    firstName: '',
    lastName: '',
    departmentId: ''
  });
  const [editError, setEditError] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [staffRes, deptsRes] = await Promise.all([
        api.get('/staff'),
        api.get('/departments')
      ]);

      setStaff(staffRes.data.staff || []);
      setDepartments(deptsRes.data.departments || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch staff directories. Please reload.');
    } finally {
      setLoading(false);
    }
  };

  const fetchFilteredStaff = async () => {
    try {
      let queryParams = {};
      if (roleFilter) queryParams.role = roleFilter;
      if (deptFilter) queryParams.departmentId = deptFilter;
      if (searchQuery) queryParams.search = searchQuery;

      const res = await api.get('/staff', { params: queryParams });
      setStaff(res.data.staff || []);
    } catch (err) {
      console.warn('Failed to filter staff lists', err);
    }
  };

  useEffect(() => {
    if (!loading) {
      fetchFilteredStaff();
    }
  }, [roleFilter, deptFilter, searchQuery]);

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegisterError(null);
    setActionLoading(true);

    try {
      if (!registerForm.email.trim()) throw new Error('Please enter email.');
      if (!registerForm.password || registerForm.password.length < 6) throw new Error('Password must be at least 6 characters.');
      if (!registerForm.firstName.trim() || !registerForm.lastName.trim()) throw new Error('Please fill in complete names.');

      const payload = {
        email: registerForm.email.trim().toLowerCase(),
        password: registerForm.password,
        firstName: registerForm.firstName.trim(),
        lastName: registerForm.lastName.trim(),
        role: registerForm.role,
        departmentId: registerForm.departmentId || undefined
      };

      await api.post('/staff', payload);

      setIsRegisterModalOpen(false);
      setRegisterForm({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'NURSE',
        departmentId: ''
      });
      fetchInitialData();
    } catch (err) {
      console.error(err);
      setRegisterError(err.response?.data?.message || err.message || 'Failed to register staff user.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditError(null);
    setActionLoading(true);

    try {
      if (!editForm.firstName.trim() || !editForm.lastName.trim()) {
        throw new Error('Please enter valid name fields.');
      }

      const payload = {
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        departmentId: editForm.departmentId || null
      };

      await api.put(`/staff/${editForm.id}`, payload);

      setIsEditModalOpen(false);
      setEditForm({ id: '', firstName: '', lastName: '', departmentId: '' });
      fetchInitialData();
    } catch (err) {
      console.error(err);
      setEditError(err.response?.data?.message || err.message || 'Failed to update staff profile.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (staffId) => {
    if (!window.confirm('Are you sure you want to delete this staff account permanently? This action is irreversible.')) return;
    try {
      setActionLoading(true);
      await api.delete(`/staff/${staffId}`);
      fetchInitialData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete staff account.');
    } finally {
      setActionLoading(false);
    }
  };

  // KPIs
  const nurseCount = staff.filter(s => s.user?.role === 'NURSE').length;
  const recepCount = staff.filter(s => s.user?.role === 'RECEPTIONIST').length;

  if (loading) {
    return (
      <div className="h-[70vh] flex flex-col justify-center items-center space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground font-semibold">Accessing administrative registries...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Staff Management Directory</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Register and manage active nurses, clinical personnel, receptionists, and assign operational departments.
          </p>
        </div>

        <button 
          onClick={() => setIsRegisterModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-premium hover:bg-primary/95 transition-all"
        >
          <Plus className="w-4.5 h-4.5" />
          <span>Register Operational Staff</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center space-x-3 text-red-500 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* KPI stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        
        <div className="bg-card border border-border rounded-2xl shadow-premium p-6 flex justify-between items-center hover:shadow-premium-hover transition-all duration-300">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Staff Active</p>
            <p className="text-2xl font-black">{staff.length}</p>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl shadow-premium p-6 flex justify-between items-center hover:shadow-premium-hover transition-all duration-300">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Registered Nurses</p>
            <p className="text-2xl font-black text-indigo-500">{nurseCount}</p>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl shadow-premium p-6 flex justify-between items-center hover:shadow-premium-hover transition-all duration-300">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Receptionist Clerks</p>
            <p className="text-2xl font-black text-amber-500">{recepCount}</p>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Filters bar controls */}
      <div className="bg-card border border-border rounded-2xl shadow-premium p-4 flex flex-col md:flex-row justify-between items-center gap-4">
        
        {/* Search */}
        <div className="relative flex-1 w-full md:w-auto">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text"
            placeholder="Search staff name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full text-xs bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          {/* Role filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-muted/40 border border-border rounded-xl focus:outline-none cursor-pointer"
          >
            <option value="">All Operational Roles</option>
            <option value="NURSE">Nurse</option>
            <option value="RECEPTIONIST">Receptionist</option>
          </select>

          {/* Department filter */}
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-muted/40 border border-border rounded-xl focus:outline-none cursor-pointer"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

      </div>

      {/* Main Staff grid table */}
      <div className="bg-card border border-border rounded-2xl shadow-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/20 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <th className="p-4 pl-6">Staff Profile Name</th>
                <th className="p-4">Registered E-mail</th>
                <th className="p-4">Operational Role</th>
                <th className="p-4">Assigned Department</th>
                <th className="p-4">Date Employed</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {staff.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-xs text-muted-foreground font-semibold">
                    No active staff directory listings matched your query.
                  </td>
                </tr>
              ) : (
                staff.map((member) => (
                  <tr key={member.id} className="hover:bg-muted/10 transition-colors">
                    
                    {/* Name */}
                    <td className="p-4 pl-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                          {member.firstName.charAt(0)}
                        </div>
                        <span className="font-extrabold text-xs">
                          {member.firstName} {member.lastName}
                        </span>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="p-4">
                      <span className="text-xs text-muted-foreground font-medium">{member.user?.email}</span>
                    </td>

                    {/* Role */}
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${
                        member.user?.role === 'NURSE' 
                          ? 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20' 
                          : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                      }`}>
                        {member.user?.role}
                      </span>
                    </td>

                    {/* Department */}
                    <td className="p-4">
                      <span className="text-xs font-semibold text-foreground/80">
                        {member.department?.name || 'Administrative Duty'}
                      </span>
                    </td>

                    {/* Employed date */}
                    <td className="p-4">
                      <span className="text-xs text-muted-foreground">
                        {new Date(member.createdAt).toLocaleDateString()}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => {
                            setEditForm({
                              id: member.id,
                              firstName: member.firstName,
                              lastName: member.lastName,
                              departmentId: member.departmentId || ''
                            });
                            setIsEditModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(member.id)}
                          className="p-1.5 rounded-lg border border-red-500/15 text-red-500 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Register Staff */}
      {isRegisterModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md flex justify-center items-center p-4">
          <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
            
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/10">
              <h3 className="text-base font-extrabold flex items-center space-x-2">
                <PlusCircle className="w-5 h-5 text-primary" />
                <span>Register Staff User Profile</span>
              </h3>
              <button 
                onClick={() => { setIsRegisterModalOpen(false); setRegisterError(null); }}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {registerError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center space-x-2 text-red-500 text-xs font-semibold">
                  <AlertCircle className="w-4.5 h-4.5" />
                  <span>{registerError}</span>
                </div>
              )}

              {/* Names */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">First Name</label>
                  <input 
                    type="text"
                    required
                    placeholder="E.g. Clara"
                    value={registerForm.firstName}
                    onChange={(e) => setRegisterForm(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-muted/40 border border-border rounded-xl focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Last Name</label>
                  <input 
                    type="text"
                    required
                    placeholder="E.g. Oswald"
                    value={registerForm.lastName}
                    onChange={(e) => setRegisterForm(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-muted/40 border border-border rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center space-x-1">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Administrative Email</span>
                </label>
                <input 
                  type="email"
                  required
                  placeholder="E.g. nurse.clara@caresync.com"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-muted/40 border border-border rounded-xl focus:outline-none"
                />
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center space-x-1">
                  <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Secure Password</span>
                </label>
                <input 
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-muted/40 border border-border rounded-xl focus:outline-none"
                />
              </div>

              {/* Role */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Operational Role</label>
                <select
                  value={registerForm.role}
                  onChange={(e) => setRegisterForm(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-muted/40 border border-border rounded-xl focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="NURSE">Nurse Practitioner</option>
                  <option value="RECEPTIONIST">Receptionist Desk Staff</option>
                </select>
              </div>

              {/* Department */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Operational Department Assignment</label>
                <select
                  value={registerForm.departmentId}
                  onChange={(e) => setRegisterForm(prev => ({ ...prev, departmentId: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-muted/40 border border-border rounded-xl focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="">-- No Department Assignment --</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => { setIsRegisterModalOpen(false); setRegisterError(null); }}
                  className="w-1/2 px-4 py-2.5 bg-muted text-foreground border border-border font-bold text-xs rounded-xl hover:bg-muted/80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-1/2 px-4 py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-premium hover:bg-primary/95 flex justify-center items-center"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Register Staff Account'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: Edit Staff */}
      {isEditModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md flex justify-center items-center p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
            
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/10">
              <h3 className="text-base font-extrabold flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-primary" />
                <span>Edit Staff Profile</span>
              </h3>
              <button 
                onClick={() => { setIsEditModalOpen(false); setEditError(null); }}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {editError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center space-x-2 text-red-500 text-xs font-semibold">
                  <AlertCircle className="w-4.5 h-4.5" />
                  <span>{editError}</span>
                </div>
              )}

              {/* Names */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">First Name</label>
                  <input 
                    type="text"
                    required
                    value={editForm.firstName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-muted/40 border border-border rounded-xl focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Last Name</label>
                  <input 
                    type="text"
                    required
                    value={editForm.lastName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-muted/40 border border-border rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              {/* Department */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Operational Department Assignment</label>
                <select
                  value={editForm.departmentId}
                  onChange={(e) => setEditForm(prev => ({ ...prev, departmentId: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-muted/40 border border-border rounded-xl focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="">-- No Department Assignment --</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => { setIsEditModalOpen(false); setEditError(null); }}
                  className="w-1/2 px-4 py-2.5 bg-muted text-foreground border border-border font-bold text-xs rounded-xl hover:bg-muted/80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-1/2 px-4 py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-premium hover:bg-primary/95 flex justify-center items-center"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Staff Profile'}
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

export default StaffPage;
