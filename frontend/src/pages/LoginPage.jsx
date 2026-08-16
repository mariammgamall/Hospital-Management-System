import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, Loader2, AlertCircle } from 'lucide-react';

function LoginPage() {
  const { login, isLoading, error } = useAuthStore();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    // Basic Validation
    if (!email || !password) {
      setLocalError('Please fill out all required fields.');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters long.');
      return;
    }

    try {
      await login(email.trim(), password);
      navigate('/dashboard');
    } catch (err) {
      // Handled in store
    }
  };

  return (
    <div className="w-full bg-card border border-border rounded-2xl shadow-premium p-8 space-y-6">
      
      {/* Brand & Heading */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight">Clinical Portal</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Authenticate using your registered hospital account.
        </p>
      </div>

      {/* General error banners */}
      {(error || localError) && (
        <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm flex items-start space-x-3 border border-destructive/20 animate-fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span className="font-medium leading-relaxed">{localError || error}</span>
        </div>
      )}

      {/* Credentials Inputs Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Email Address */}
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Work Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. nurse.alex@caresync.com"
              disabled={isLoading}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-input bg-muted/25 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Security Password
            </label>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              disabled={isLoading}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-input bg-muted/25 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
            />
          </div>
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
              <span>Verifying Session...</span>
            </>
          ) : (
            <span>Sign In</span>
          )}
        </button>
      </form>

      {/* Link to Patient Sign Up */}
      <div className="text-center text-xs text-muted-foreground font-semibold pt-2">
        New Patient?{' '}
        <Link to="/signup" className="text-primary hover:underline font-bold">
          Create an Account & Sign Up
        </Link>
      </div>

    </div>
  );
}

export default LoginPage;
