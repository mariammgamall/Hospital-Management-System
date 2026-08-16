import React from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Navigate } from 'react-router-dom';

function AuthLayout({ children }) {
  const { accessToken } = useAuthStore();

  // If already authenticated, redirect immediately to dashboard
  if (accessToken) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-background font-sans">
      {/* Decorative branding side column on large viewports */}
      <div className="hidden lg:flex lg:col-span-5 relative bg-gradient-to-tr from-primary-900 via-primary-700 to-primary-500 overflow-hidden flex-col justify-between p-12 text-white">
        {/* Modern micro background particles */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        {/* Brand header */}
        <div className="relative z-10 flex items-center space-x-3">
          <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/15">
            <svg className="w-6 h-6 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
            </svg>
          </div>
          <span className="font-extrabold text-2xl tracking-tight">CareSync</span>
        </div>

        {/* Dynamic promotional quote */}
        <div className="relative z-10 space-y-4 max-w-sm">
          <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-white/10 backdrop-blur-sm rounded-full border border-white/10">
            Clinical Platform v1.0
          </span>
          <h2 className="text-4xl font-extrabold tracking-tight leading-tight">
            Seamless clinical care starts here.
          </h2>
          <p className="text-primary-100 text-sm leading-relaxed">
            Unifying patient records, real-time bed tracking, appointments scheduling, and automated financial billing in one secure dashboard.
          </p>
        </div>

        {/* Footer legalities */}
        <div className="relative z-10 text-xs text-primary-200">
          &copy; {new Date().getFullYear()} CareSync Health Systems. All rights reserved.
        </div>
      </div>

      {/* Main card panel content */}
      <div className="col-span-1 lg:col-span-7 flex flex-col justify-center items-center p-6 sm:p-12 md:p-16">
        <div className="w-full max-w-md animate-fade-in">
          {children}
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
