import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, Mail, Calendar, Phone, MapPin, Heart, FileText, Loader2, AlertCircle } from 'lucide-react';

function SignupPage() {
  const { register, isLoading, error } = useAuthStore();
  const navigate = useNavigate();

  // Form states
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    gender: 'Male',
    dateOfBirth: '',
    phoneNumber: '',
    address: '',
    bloodType: '',
    medicalHistory: ''
  });

  const [localError, setLocalError] = useState('');
  const [showOptional, setShowOptional] = useState(false);

  // Live password security analyzer
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, text: 'None', color: 'bg-muted', textClass: 'text-muted-foreground', percentage: 'w-0' };
    
    let checks = 0;
    if (pwd.length >= 8) checks++;
    if (/[A-Z]/.test(pwd)) checks++;
    if (/[a-z]/.test(pwd)) checks++;
    if (/[0-9]/.test(pwd)) checks++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/.test(pwd)) checks++;
    
    // Context violation check (excludes first name, last name, and email prefix)
    const lowerPassword = pwd.toLowerCase();
    const lowerFirstName = formData.firstName.trim().toLowerCase();
    const lowerLastName = formData.lastName.trim().toLowerCase();
    const lowerEmailPrefix = formData.email.split('@')[0]?.trim().toLowerCase();
    
    const hasContextViolation = 
      (lowerFirstName && lowerPassword.includes(lowerFirstName)) ||
      (lowerLastName && lowerPassword.includes(lowerLastName)) ||
      (lowerEmailPrefix && lowerPassword.includes(lowerEmailPrefix));

    if (hasContextViolation && checks > 0) {
      checks = Math.max(1, checks - 1); // penalize score for containing personal info
    }

    if (checks <= 2) return { score: checks, text: 'Weak', color: 'bg-destructive', textClass: 'text-destructive', percentage: 'w-1/3' };
    if (checks <= 4) return { score: checks, text: 'Moderate', color: 'bg-amber-500', textClass: 'text-amber-500', percentage: 'w-2/3' };
    return { score: checks, text: 'Strong', color: 'bg-emerald-500', textClass: 'text-emerald-500', percentage: 'w-full' };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    // Basic Validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.gender || !formData.dateOfBirth) {
      setLocalError('Please fill out all required fields.');
      return;
    }

    // Verify password strength requirements
    const isLengthMet = formData.password.length >= 8;
    const hasUpper = /[A-Z]/.test(formData.password);
    const hasLower = /[a-z]/.test(formData.password);
    const hasDigit = /[0-9]/.test(formData.password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/.test(formData.password);
    
    const lowerPassword = formData.password.toLowerCase();
    const lowerFirstName = formData.firstName.trim().toLowerCase();
    const lowerLastName = formData.lastName.trim().toLowerCase();
    const lowerEmailPrefix = formData.email.split('@')[0]?.trim().toLowerCase();
    
    const hasNameOrEmail = 
      (lowerFirstName && lowerPassword.includes(lowerFirstName)) ||
      (lowerLastName && lowerPassword.includes(lowerLastName)) ||
      (lowerEmailPrefix && lowerPassword.includes(lowerEmailPrefix));

    if (!isLengthMet || !hasUpper || !hasLower || !hasDigit || !hasSpecial) {
      setLocalError('Password does not meet the high-strength complexity requirements.');
      return;
    }
    if (hasNameOrEmail) {
      setLocalError('Password must not contain your first name, last name, or email prefix.');
      return;
    }

    try {
      // Build the registration payload matching the schema
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        gender: formData.gender,
        dateOfBirth: new Date(formData.dateOfBirth).toISOString(),
        phoneNumber: formData.phoneNumber.trim() || undefined,
        address: formData.address.trim() || undefined,
        bloodType: formData.bloodType || undefined,
        medicalHistory: formData.medicalHistory.trim() || undefined
      };

      await register(payload);
      navigate('/dashboard');
    } catch (err) {
      // Handled in store
    }
  };

  const password = formData.password;
  const strength = getPasswordStrength(password);
  const lowerPassword = password.toLowerCase();
  
  const isNameOrEmailViolated = 
    (formData.firstName.trim() && lowerPassword.includes(formData.firstName.trim().toLowerCase())) ||
    (formData.lastName.trim() && lowerPassword.includes(formData.lastName.trim().toLowerCase())) ||
    (formData.email.split('@')[0]?.trim() && lowerPassword.includes(formData.email.split('@')[0].trim().toLowerCase()));

  const reqs = [
    { label: 'Minimum 8 characters', met: password.length >= 8 },
    { label: 'Uppercase letter (A-Z)', met: /[A-Z]/.test(password) },
    { label: 'Lowercase letter (a-z)', met: /[a-z]/.test(password) },
    { label: 'Numeric digit (0-9)', met: /[0-9]/.test(password) },
    { label: 'Special character (!@#$... )', met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/.test(password) },
    { label: 'No personal details (name/email)', met: password.length > 0 && !isNameOrEmailViolated }
  ];

  return (
    <div className="w-full bg-card border border-border rounded-2xl shadow-premium p-8 space-y-6">
      
      {/* Brand & Heading */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight">Create Account</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Sign up to access your digital patient health portal.
        </p>
      </div>

      {/* General error banners */}
      {(error || localError) && (
        <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm flex items-start space-x-3 border border-destructive/20 animate-fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span className="font-medium leading-relaxed">{localError || error}</span>
        </div>
      )}

      {/* Signup Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Name Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="firstName" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              First Name *
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
              <input
                id="firstName"
                name="firstName"
                type="text"
                required
                value={formData.firstName}
                onChange={handleChange}
                disabled={isLoading}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-input bg-muted/25 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="lastName" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Last Name *
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
              <input
                id="lastName"
                name="lastName"
                type="text"
                required
                value={formData.lastName}
                onChange={handleChange}
                disabled={isLoading}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-input bg-muted/25 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {/* Email Address */}
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Email Address *
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-input bg-muted/25 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Choose Password *
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
            <input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="Choose a strong password"
              disabled={isLoading}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-input bg-muted/25 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
            />
          </div>
        </div>

        {/* Real-time Password Security Strength Indicator */}
        {password.length > 0 && (
          <div className="p-4 rounded-xl border border-border bg-muted/15 space-y-3 animate-fade-in text-[11px] shadow-sm">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-muted-foreground uppercase tracking-wider">Password Strength:</span>
              <span className={`font-bold uppercase tracking-wider ${strength.textClass}`}>{strength.text}</span>
            </div>
            
            <div className="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden">
              <div 
                className={`h-full ${strength.color} ${strength.percentage} transition-all duration-300 ease-out`}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 pt-1 font-medium">
              {reqs.map((req, i) => (
                <div key={i} className="flex items-center space-x-1.5">
                  <span className={`shrink-0 text-[10px] ${req.met ? 'text-emerald-500 font-extrabold' : 'text-muted-foreground/30 font-bold'}`}>
                    {req.met ? '✔' : '✘'}
                  </span>
                  <span className={req.met ? 'text-foreground font-semibold' : 'text-muted-foreground/70'}>
                    {req.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gender & DOB Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5 min-w-0">
            <label htmlFor="gender" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Gender *
            </label>
            <select
              id="gender"
              name="gender"
              required
              value={formData.gender}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full px-3 py-2.5 rounded-xl border border-input bg-muted/25 text-sm focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer disabled:opacity-50"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="space-y-1.5 min-w-0">
            <label htmlFor="dateOfBirth" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Date of Birth *
            </label>
            <div className="relative min-w-0 w-full overflow-hidden">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground shrink-0 z-10 pointer-events-none" />
              <input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                required
                value={formData.dateOfBirth}
                onChange={handleChange}
                disabled={isLoading}
                className="w-full pl-11 pr-3 py-2.5 rounded-xl border border-input bg-muted/25 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50 appearance-none min-w-0 max-w-full"
              />
            </div>
          </div>
        </div>

        {/* Collapsible Optional Medical Details */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowOptional(!showOptional)}
            className="text-xs font-bold text-primary flex items-center space-x-1.5 hover:underline focus:outline-none"
          >
            <span>{showOptional ? 'Hide' : 'Add'} Optional Medical Profile Details</span>
            <span className="text-[10px]">{showOptional ? '▲' : '▼'}</span>
          </button>
          
          {showOptional && (
            <div className="mt-4 p-4 rounded-xl border border-border bg-muted/20 space-y-4 animate-slide-up">
              
              {/* Phone & Blood Type */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="phoneNumber" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      id="phoneNumber"
                      name="phoneNumber"
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      placeholder="+20 100 ..."
                      disabled={isLoading}
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-input bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="bloodType" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Blood Type
                  </label>
                  <div className="relative">
                    <Heart className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <select
                      id="bloodType"
                      name="bloodType"
                      value={formData.bloodType}
                      onChange={handleChange}
                      disabled={isLoading}
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-input bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
                    >
                      <option value="">-- Blood Type --</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <label htmlFor="address" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    id="address"
                    name="address"
                    type="text"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Heliopolis, Cairo"
                    disabled={isLoading}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-input bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Medical History */}
              <div className="space-y-1.5">
                <label htmlFor="medicalHistory" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Medical History Notes
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                  <textarea
                    id="medicalHistory"
                    name="medicalHistory"
                    rows={2}
                    value={formData.medicalHistory}
                    onChange={handleChange}
                    placeholder="Describe chronic conditions, allergies, or past surgeries..."
                    disabled={isLoading}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-input bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Submit action */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-premium hover:bg-primary/95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Creating Account...</span>
            </>
          ) : (
            <span>Create Patient Account</span>
          )}
        </button>
      </form>

      {/* Navigation back to login */}
      <div className="text-center text-xs text-muted-foreground font-semibold">
        Already have a patient portal account?{' '}
        <Link to="/login" className="text-primary hover:underline font-bold">
          Sign In
        </Link>
      </div>

    </div>
  );
}

export default SignupPage;
