import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  UserSquare2, 
  Calendar, 
  FileText, 
  FileCheck, 
  Receipt, 
  BedDouble, 
  ShieldCheck, 
  BarChart3, 
  Bell, 
  LogOut, 
  Menu, 
  X, 
  Moon, 
  Sun, 
  ChevronRight, 
  UserCircle,
  Pill,
  FlaskConical
} from 'lucide-react';
import api from '../services/api';

function AppLayout({ children }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(
    document.documentElement.classList.contains('dark') || 
    localStorage.getItem('theme') === 'dark'
  );
  
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Initialize notifications & theme settings
  useEffect(() => {
    fetchNotifications();
    
    // Check local storage for theme preference
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.warn('Failed to load notifications');
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      fetchNotifications();
    } catch (err) {
      console.warn('Failed to clear notifications');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  // Define sidebar navigation options tailored per user role across all 8 RBAC roles
  const navigationItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'PHARMACIST', 'LAB_TECHNICIAN', 'BILLING', 'PATIENT']
    },
    {
      name: 'Patients',
      path: '/patients',
      icon: Users,
      roles: ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'BILLING']
    },
    {
      name: 'Doctors',
      path: '/doctors',
      icon: UserSquare2,
      roles: ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'PATIENT']
    },
    {
      name: 'Appointments',
      path: '/appointments',
      icon: Calendar,
      roles: ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'PATIENT']
    },
    {
      name: 'EMR Records',
      path: '/medical-records',
      icon: FileText,
      roles: ['ADMIN', 'DOCTOR', 'NURSE', 'PATIENT']
    },
    {
      name: 'Prescriptions',
      path: '/prescriptions',
      icon: FileCheck,
      roles: ['ADMIN', 'DOCTOR', 'NURSE', 'PHARMACIST', 'PATIENT']
    },
    {
      name: 'Pharmacy Stock',
      path: '/pharmacy',
      icon: Pill,
      roles: ['ADMIN', 'PHARMACIST', 'DOCTOR', 'NURSE']
    },
    {
      name: 'Lab Diagnostics',
      path: '/lab',
      icon: FlaskConical,
      roles: ['ADMIN', 'DOCTOR', 'LAB_TECHNICIAN', 'PATIENT']
    },
    {
      name: 'Billing & Invoices',
      path: '/billing',
      icon: Receipt,
      roles: ['ADMIN', 'BILLING', 'RECEPTIONIST', 'PATIENT']
    },
    {
      name: 'Wards & Beds',
      path: '/wards',
      icon: BedDouble,
      roles: ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST']
    },
    {
      name: 'Staff Directory',
      path: '/staff',
      icon: ShieldCheck,
      roles: ['ADMIN']
    },
    {
      name: 'Analytics Reports',
      path: '/reports',
      icon: BarChart3,
      roles: ['ADMIN', 'BILLING']
    }
  ];

  // Filter items matching the logged user role
  const filteredNavItems = navigationItems.filter(
    (item) => user && item.roles.includes(user.role)
  );

  return (
    <div className="min-h-screen flex bg-background text-foreground transition-colors duration-200">
      
      {/* 1. Desktop Collapsible Sidebar */}
      <aside className={`hidden md:flex flex-col border-r border-border bg-card transition-all duration-300 ${
        sidebarOpen ? 'w-64' : 'w-20'
      }`}>
        {/* Brand Header */}
        <div className={`h-16 flex items-center border-b border-border ${sidebarOpen ? 'justify-between px-4' : 'justify-center px-2'}`}>
          <div 
            onClick={() => !sidebarOpen && setSidebarOpen(true)}
            className={`flex items-center space-x-3 overflow-hidden ${!sidebarOpen ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
            title={!sidebarOpen ? 'Expand Sidebar' : ''}
          >
            <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0">
              <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
              </svg>
            </div>
            {sidebarOpen && (
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
                CareSync HMS
              </span>
            )}
          </div>
          
          {sidebarOpen && (
            <button 
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded-md hover:bg-muted text-muted-foreground transition-colors shrink-0"
              title="Collapse Sidebar"
            >
              <ChevronRight className="w-4 h-4 transform rotate-180" />
            </button>
          )}
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                  isActive 
                    ? 'bg-primary text-primary-foreground shadow-premium' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {sidebarOpen && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Card panel at bottom */}
        {sidebarOpen && user && (
          <div className="p-4 border-t border-border bg-muted/30">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                {user.email.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold truncate">
                  {user.firstName || 'CareSync'} {user.lastName || 'Staff'}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                  {user.role}
                </p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* 2. Mobile Nav Drawer Drawer Overlay */}
      <div 
        className={`md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-md transition-opacity duration-300 ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileOpen(false)}
      >
        <aside 
          className={`w-72 max-w-[80vw] h-full bg-card border-r border-border flex flex-col p-4 space-y-6 transition-transform duration-300 transform ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 text-primary rounded-lg">
                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                </svg>
              </div>
              <span className="font-extrabold text-lg tracking-tight">CareSync</span>
            </div>
            <button onClick={() => setMobileOpen(false)} className="p-1 rounded hover:bg-muted">
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 space-y-1.5 overflow-y-auto">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-3 rounded-xl font-semibold text-sm ${
                    isActive 
                      ? 'bg-primary text-primary-foreground shadow-premium' 
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3 py-3 rounded-xl text-red-500 font-semibold hover:bg-red-500/10 text-sm"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </aside>
      </div>

      {/* 3. Main layout containers and top navbar */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* Top Header Navbar */}
        <header className="h-16 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center">
            {/* Hamburger trigger */}
            <button 
              onClick={() => setMobileOpen(true)}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground md:hidden mr-3"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {/* Header path titles */}
            <h2 className="text-base font-semibold tracking-tight md:text-lg">
              {location.pathname.substring(1).charAt(0).toUpperCase() + location.pathname.substring(2)}
            </h2>
          </div>

          <div className="flex items-center space-x-3">
            {/* Theme switcher */}
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-border bg-muted/20 text-muted-foreground hover:bg-muted transition-colors"
            >
              {darkMode ? <Sun className="w-4.5 h-4.5 text-amber-500" /> : <Moon className="w-4.5 h-4.5" />}
            </button>

            {/* Notifications Popover Dropdown */}
            <div className="relative">
              <button 
                onClick={() => {
                  setNotifOpen(!notifOpen);
                  if (!notifOpen) fetchNotifications();
                }}
                className="p-2 rounded-lg border border-border bg-muted/20 text-muted-foreground hover:bg-muted transition-colors relative"
              >
                <Bell className="w-4.5 h-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 transform translate-x-1 -translate-y-1 w-5 h-5 text-[10px] font-extrabold bg-primary text-primary-foreground rounded-full flex items-center justify-center border border-card animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>
              
              {notifOpen && (
                <div className="absolute right-0 mt-2.5 w-80 bg-card border border-border shadow-premium rounded-xl overflow-hidden z-50 animate-slide-up">
                  <div className="p-3 border-b border-border bg-muted/20 flex justify-between items-center text-xs">
                    <span className="font-bold">System Alerts ({unreadCount})</span>
                    {unreadCount > 0 && (
                      <button 
                        onClick={markAllNotificationsAsRead}
                        className="text-primary font-bold hover:underline"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  
                  <div className="max-h-64 overflow-y-auto divide-y divide-border">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-muted-foreground">
                        No active notifications.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className={`p-3 text-xs space-y-1 ${n.isRead ? 'opacity-70' : 'bg-primary/5'}`}>
                          <p className="font-semibold">{n.title}</p>
                          <p className="text-muted-foreground leading-relaxed">{n.message}</p>
                          <p className="text-[10px] text-muted-foreground/60">{new Date(n.createdAt).toLocaleDateString()}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="h-6 w-[1px] bg-border hidden sm:block"></div>

            {/* Profile Dropdown buttons */}
            <div className="flex items-center space-x-3">
              <button 
                onClick={handleLogout}
                title="Log Out"
                className="p-2 rounded-lg border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-colors flex items-center justify-center"
              >
                <LogOut className="w-4 h-4" />
              </button>

              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center text-xs shadow-premium">
                {user ? user.email.charAt(0).toUpperCase() : '?'}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Dashboard */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
