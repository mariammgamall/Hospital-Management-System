import React, { useState, useEffect } from 'react';
import { 
  BarChart as BarChartIcon, 
  Search, 
  Calendar, 
  Printer, 
  Loader2, 
  AlertCircle,
  TrendingUp,
  DollarSign,
  Users,
  Building,
  User,
  Activity,
  Layers,
  Filter
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
import { getDoctorName } from '../utils/doctorHelper';


function ReportPage() {
  const [data, setData] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [departmentId, setDepartmentId] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load filters metadata
      const [docsRes, deptsRes] = await Promise.all([
        api.get('/doctors'),
        api.get('/departments')
      ]);
      setDoctors(docsRes.data.doctors || []);
      setDepartments(deptsRes.data.departments || []);

      // Load initial reports
      const reportsRes = await api.get('/reports');
      setData(reportsRes.data.reports || null);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch analytics metrics. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = async (e) => {
    if (e) e.preventDefault();
    try {
      setActionLoading(true);
      setError(null);

      let params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (doctorId) params.doctorId = doctorId;
      if (departmentId) params.departmentId = departmentId;

      const res = await api.get('/reports', { params });
      setData(res.data.reports || null);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to update reports with filters.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetFilters = async () => {
    setStartDate('');
    setEndDate('');
    setDoctorId('');
    setDepartmentId('');
    try {
      setActionLoading(true);
      const res = await api.get('/reports');
      setData(res.data.reports || null);
    } catch (err) {
      console.warn('Failed to reset filters', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const aptSummary = data?.appointmentSummary || { total: 0, scheduled: 0, confirmed: 0, completed: 0, cancelled: 0 };
    const revSummary = data?.revenueSummary || { totalInvoiced: 0, totalCollected: 0, outstandingAmount: 0 };
    const patSummary = data?.patientStats || { totalRegistered: 0 };

    const dateFormatted = new Date().toLocaleDateString('en-EG', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });

    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Executive Clinical Analytics Report</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Lora:ital,wght@0,500;0,600;0,700;1,600;1,700&display=swap" rel="stylesheet">
          <style>
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              font-family: 'Inter', sans-serif;
              color: #0f172a;
              margin: 0;
              padding: 40px;
              line-height: 1.5;
              background-color: #ffffff;
            }
            .prescription-container {
              max-width: 800px;
              margin: 0 auto;
              border: 1px solid #e2e8f0;
              padding: 40px 50px;
              border-radius: 16px;
              box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
              position: relative;
              background-color: #ffffff;
            }
            
            /* Letterhead Header Section */
            .header-section {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #0e8ce4;
              padding-bottom: 24px;
              margin-bottom: 24px;
            }
            .clinic-info {
              display: flex;
              flex-direction: column;
              max-width: 60%;
            }
            .clinic-brand {
              display: flex;
              align-items: center;
              gap: 10px;
              margin-bottom: 8px;
            }
            .clinic-logo {
              width: 32px;
              height: 32px;
              color: #0e8ce4;
            }
            .clinic-title {
              margin: 0;
              font-family: 'Lora', serif;
              font-size: 24px;
              color: #0e8ce4;
              font-weight: 700;
              letter-spacing: -0.02em;
            }
            .clinic-details {
              margin: 0;
              font-size: 11px;
              color: #64748b;
              font-weight: 500;
              line-height: 1.6;
            }
            .doctor-info {
              text-align: right;
              max-width: 35%;
            }
            .doctor-name {
              margin: 0 0 4px 0;
              font-family: 'Lora', serif;
              font-size: 18px;
              color: #0f172a;
              font-weight: 700;
            }
            .doctor-spec {
              margin: 0 0 4px 0;
              font-size: 12px;
              color: #0e8ce4;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            .doctor-license {
              margin: 0;
              font-size: 11px;
              color: #64748b;
              font-weight: 500;
            }

            /* Patient Info Bar */
            .patient-bar {
              display: grid;
              grid-template-columns: 2fr 1.5fr 1.5fr;
              gap: 12px;
              background-color: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 10px;
              padding: 12px 18px;
              margin-bottom: 30px;
            }
            .patient-bar-item {
              display: flex;
              flex-direction: column;
              gap: 2px;
            }
            .patient-bar-label {
              font-size: 9px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.08em;
              color: #64748b;
            }
            .patient-bar-value {
              font-size: 12px;
              font-weight: 600;
              color: #1e293b;
            }

            /* Tables & KPIs */
            .section-title {
              font-family: 'Lora', serif;
              font-size: 14px;
              font-weight: 700;
              color: #0e8ce4;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 6px;
              margin: 25px 0 12px 0;
            }
            .kpi-row {
              display: grid;
              grid-template-columns: 1fr 1fr 1fr;
              gap: 16px;
              margin-bottom: 24px;
            }
            .kpi-card {
              background-color: #f8fafc;
              border: 1px solid #e2e8f0;
              padding: 16px;
              border-radius: 12px;
              text-align: center;
            }
            .kpi-label {
              font-size: 9px;
              font-weight: 800;
              text-transform: uppercase;
              color: #64748b;
              letter-spacing: 0.08em;
            }
            .kpi-value {
              font-size: 22px;
              font-weight: 800;
              color: #0f172a;
              margin-top: 4px;
              font-family: 'Lora', serif;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 24px;
            }
            th {
              text-align: left;
              padding: 10px 14px;
              font-size: 10px;
              color: #64748b;
              font-weight: 800;
              text-transform: uppercase;
              border-bottom: 2px solid #e2e8f0;
              letter-spacing: 0.05em;
            }
            td {
              padding: 12px 14px;
              border-bottom: 1px solid #f1f5f9;
              font-size: 12px;
              font-weight: 500;
              color: #334155;
            }
            tr:nth-child(even) td {
              background-color: #f8fafc;
            }

            /* Footer Section */
            .footer-section {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              margin-top: 60px;
              border-top: 1px solid #e2e8f0;
              padding-top: 24px;
              position: relative;
            }
            .disclaimer-container {
              max-width: 60%;
            }
            .disclaimer {
              font-size: 10px;
              color: #94a3b8;
              line-height: 1.6;
              margin-bottom: 8px;
            }
            .dispense-note {
              font-size: 10px;
              color: #64748b;
              font-weight: 600;
              background-color: #f8fafc;
              border: 1px solid #e2e8f0;
              padding: 6px 12px;
              border-radius: 6px;
              display: inline-block;
            }
            .signature-container {
              text-align: center;
              position: relative;
              width: 220px;
            }
            .verified-stamp {
              position: absolute;
              top: -85px;
              left: 60px;
              width: 100px;
              height: 100px;
              transform: rotate(-10deg);
              opacity: 0.9;
              pointer-events: none;
            }
            .sig-doctor {
              font-size: 13px;
              font-weight: 700;
              color: #0f172a;
              margin-bottom: 4px;
              font-family: 'Lora', serif;
            }
            .sig-line {
              border-top: 1px solid #cbd5e1;
              margin-top: 45px;
              padding-top: 6px;
              font-size: 10px;
              color: #64748b;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
          </style>
        </head>
        <body>
          <div class="prescription-container">
            
            <!-- Letterhead Section -->
            <div class="header-section">
              <div class="clinic-info">
                <div class="clinic-brand">
                  <svg class="clinic-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                    <path d="M12 5v14"/>
                    <path d="M5 12h14"/>
                  </svg>
                  <h1 class="clinic-title">CareSync Medical Center</h1>
                </div>
                <p class="clinic-details">
                  100 CareSync Avenue, Heliopolis, Cairo, Egypt<br>
                  Web: www.caresync-hms.com | Support Tel: +20 2 2808 7344<br>
                  Official Digital Audit Output Registry Document
                </p>
              </div>
              <div class="doctor-info">
                <h3 class="doctor-name">Audit System</h3>
                <p class="doctor-spec">Business Intelligence</p>
                <p class="doctor-license">CareSync Analytics Hub</p>
              </div>
            </div>

            <!-- Report Meta Bar -->
            <div class="patient-bar">
              <div class="patient-bar-item">
                <span class="patient-bar-label">Reporting Timeframe</span>
                <span class="patient-bar-value">${startDate || 'All-Time'} to ${endDate || 'Current Date'}</span>
              </div>
              <div class="patient-bar-item">
                <span class="patient-bar-label">Specialist Filter</span>
                <span class="patient-bar-value">${doctorId ? 'Single Specialist Mode' : 'All Doctors'}</span>
              </div>
              <div class="patient-bar-item">
                <span class="patient-bar-label">Run Date</span>
                <span class="patient-bar-value">${dateFormatted}</span>
              </div>
            </div>

            <!-- KPIs -->
            <div class="kpi-row">
              <div class="kpi-card">
                <span class="kpi-label">Active Patients</span>
                <div class="kpi-value">${patSummary.totalRegistered}</div>
              </div>
              <div class="kpi-card">
                <span class="kpi-label">Consultations</span>
                <div class="kpi-value">${aptSummary.total}</div>
              </div>
              <div class="kpi-card">
                <span class="kpi-label">Receivables Outstanding</span>
                <div class="kpi-value">${revSummary.outstandingAmount.toFixed(2)} EGP</div>
              </div>
            </div>

            <!-- Appointment table -->
            <div class="section-title">Appointment Status Progression Summary</div>
            <table>
              <thead>
                <tr>
                  <th>Status Categories</th>
                  <th style="text-align: right;">Consultation Volume</th>
                  <th style="text-align: right;">Percentage Share</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Completed Treatments</td>
                  <td style="text-align: right; font-weight: 700;">${aptSummary.completed}</td>
                  <td style="text-align: right; font-weight: 700;">${aptSummary.total ? ((aptSummary.completed / aptSummary.total)*100).toFixed(1) : 0}%</td>
                </tr>
                <tr>
                  <td>Scheduled Waitlists</td>
                  <td style="text-align: right; font-weight: 700;">${aptSummary.scheduled}</td>
                  <td style="text-align: right; font-weight: 700;">${aptSummary.total ? ((aptSummary.scheduled / aptSummary.total)*100).toFixed(1) : 0}%</td>
                </tr>
                <tr>
                  <td>Confirmed Slots</td>
                  <td style="text-align: right; font-weight: 700;">${aptSummary.confirmed}</td>
                  <td style="text-align: right; font-weight: 700;">${aptSummary.total ? ((aptSummary.confirmed / aptSummary.total)*100).toFixed(1) : 0}%</td>
                </tr>
                <tr>
                  <td>Cancelled Slots</td>
                  <td style="text-align: right; font-weight: 700;">${aptSummary.cancelled}</td>
                  <td style="text-align: right; font-weight: 700;">${aptSummary.total ? ((aptSummary.cancelled / aptSummary.total)*100).toFixed(1) : 0}%</td>
                </tr>
              </tbody>
            </table>

            <!-- Financial Table -->
            <div class="section-title">Financial Revenue Audit Summary</div>
            <table>
              <thead>
                <tr>
                  <th>Revenue Metrics</th>
                  <th style="text-align: right;">Billed Amount EGP</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Gross Invoiced Services Value</td>
                  <td style="text-align: right; font-weight: 700;">${revSummary.totalInvoiced.toFixed(2)} EGP</td>
                </tr>
                <tr>
                  <td>Net Cash Collected</td>
                  <td style="text-align: right; font-weight: 700; color: #0e8ce4;">${revSummary.totalCollected.toFixed(2)} EGP</td>
                </tr>
                <tr>
                  <td>Total Outstanding Receivables</td>
                  <td style="text-align: right; font-weight: 700; color: #f59e0b;">${revSummary.outstandingAmount.toFixed(2)} EGP</td>
                </tr>
              </tbody>
            </table>

            <!-- Footer Section -->
            <div class="footer-section">
              <div class="disclaimer-container">
                <p class="disclaimer">
                  This Analytics Report document is an executive audit output generated from CareSync HMS Business Intelligence systems.
                  Any alterations void validity instantly. Confidential audit document.
                </p>
                <span class="dispense-note">Stamp: AUDITED RECORD</span>
              </div>
              
              <div class="signature-container">
                <!-- Rotated stamp checkmark seal -->
                <svg class="verified-stamp" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#0e8ce4" stroke-width="4" stroke-dasharray="4 2" />
                  <path d="M30 50 L45 65 L70 35" fill="none" stroke="#0e8ce4" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />
                  <text font-family="'Inter', sans-serif" font-size="8" font-weight="800" fill="#0e8ce4" letter-spacing="0.1em">
                    <textPath href="#circlePath" startOffset="50%">AUDITED SYSTEM</textPath>
                  </text>
                  <path id="circlePath" d="M 17,50 A 33,33 0 1,1 83,50" fill="none" />
                </svg>
                
                <p class="sig-doctor">System BI Suite</p>
                <div class="sig-line">Executive Signature</div>
              </div>
            </div>

          </div>
          
          <script>
            if (document.fonts) {
              document.fonts.ready.then(function() {
                setTimeout(function() {
                  window.print();
                }, 300);
              });
            } else {
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                }, 300);
              };
            }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(content);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className="h-[70vh] flex flex-col justify-center items-center space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground font-semibold">Compiling business analytics sheets...</p>
      </div>
    );
  }

  // Raw data mapping
  const aptSummary = data?.appointmentSummary || { total: 0, scheduled: 0, confirmed: 0, completed: 0, cancelled: 0 };
  const revSummary = data?.revenueSummary || { totalInvoiced: 0, totalCollected: 0, outstandingAmount: 0, paidCount: 0, pendingCount: 0, partiallyPaidCount: 0 };
  const patSummary = data?.patientStats || { totalRegistered: 0, genderDistribution: [], bloodTypeDistribution: [] };

  // Data mapping for charts
  const aptChartData = [
    { name: 'Completed', value: aptSummary.completed, color: '#06b6d4' },
    { name: 'Scheduled', value: aptSummary.scheduled, color: '#0e8ce4' },
    { name: 'Confirmed', value: aptSummary.confirmed, color: '#6366f1' },
    { name: 'Cancelled', value: aptSummary.cancelled, color: '#ef4444' }
  ].filter(item => item.value > 0);

  const revChartData = [
    { name: 'Collected', amount: revSummary.totalCollected, fill: '#0e8ce4' },
    { name: 'Outstanding', amount: revSummary.outstandingAmount, fill: '#f59e0b' }
  ];

  const bloodTypeData = patSummary.bloodTypeDistribution?.map((bt) => ({
    name: bt.name,
    patients: bt.count
  })) || [];

  const genderData = patSummary.genderDistribution?.map((g) => ({
    name: g.name,
    value: g.count
  })) || [];

  const COLORS = ['#0e8ce4', '#ec4899', '#f59e0b', '#06b6d4'];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Analytics & Reports</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Access secure executive business reports, operational charts, financial audits, and statistics.
          </p>
        </div>

        <button 
          onClick={handlePrint}
          className="flex items-center space-x-2 px-4 py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-premium hover:bg-primary/95 transition-all animate-pulse"
        >
          <Printer className="w-4.5 h-4.5" />
          <span>Export Executive Summary</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center space-x-3 text-red-500 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* Dynamic Filters Form */}
      <form onSubmit={handleApplyFilters} className="bg-card border border-border rounded-2xl shadow-premium p-5 space-y-4">
        <div className="flex items-center space-x-2 border-b border-border/60 pb-3">
          <Filter className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Reporting Range Filters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Start Date */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Start Date</label>
            <input 
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* End Date */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">End Date</label>
            <input 
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Doctor filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Specialist Consultant</label>
            <select
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-muted/40 border border-border rounded-xl focus:outline-none appearance-none cursor-pointer"
            >
              <option value="">-- All Specialists --</option>
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {getDoctorName(doc)} ({doc.specialty})
                </option>
              ))}
            </select>
          </div>

          {/* Department filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Operational Department</label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-muted/40 border border-border rounded-xl focus:outline-none appearance-none cursor-pointer"
            >
              <option value="">-- All Departments --</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-4 py-2 border border-border bg-card text-foreground font-bold text-xs rounded-xl hover:bg-muted"
          >
            Reset Filters
          </button>
          <button
            type="submit"
            disabled={actionLoading}
            className="px-4 py-2 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-premium hover:bg-primary/95 flex items-center space-x-2"
          >
            {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Apply Audit Filter</span>}
          </button>
        </div>
      </form>

      {/* Executive KPIs overview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Patients */}
        <div className="bg-card border border-border rounded-2xl shadow-premium p-6 flex justify-between items-center hover:shadow-premium-hover transition-all duration-300">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Registered Patients</p>
            <p className="text-2xl font-black">{patSummary.totalRegistered}</p>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Total Appointments */}
        <div className="bg-card border border-border rounded-2xl shadow-premium p-6 flex justify-between items-center hover:shadow-premium-hover transition-all duration-300">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Audited Appointments</p>
            <p className="text-2xl font-black text-indigo-500">{aptSummary.total}</p>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        {/* Collected cash */}
        <div className="bg-card border border-border rounded-2xl shadow-premium p-6 flex justify-between items-center hover:shadow-premium-hover transition-all duration-300">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Collected Revenue</p>
            <p className="text-2xl font-black text-primary">{revSummary.totalCollected.toFixed(2)} EGP</p>
          </div>
          <div className="p-3 bg-primary/10 text-primary rounded-2xl">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Outstanding cash */}
        <div className="bg-card border border-border rounded-2xl shadow-premium p-6 flex justify-between items-center hover:shadow-premium-hover transition-all duration-300">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Receivables Outstanding</p>
            <p className="text-2xl font-black text-amber-500">{revSummary.outstandingAmount.toFixed(2)} EGP</p>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl">
            <Activity className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Analytics charts grid splits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Revenue Collected vs Outstanding */}
        <div className="bg-card border border-border rounded-2xl shadow-premium p-6 space-y-4">
          <h3 className="text-sm font-bold flex items-center space-x-2">
            <TrendingUp className="w-4.5 h-4.5 text-primary" />
            <span>Revenue Breakdown (EGP)</span>
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(156,163,175,0.08)" vertical={false} />
                <XAxis dataKey="name" fontSize={11} stroke="#9ca3af" tickLine={false} />
                <YAxis fontSize={11} stroke="#9ca3af" tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: '1px solid var(--border)', 
                    backgroundColor: 'var(--card)',
                    color: 'var(--foreground)'
                  }} 
                />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]} maxBarSize={45}>
                  {revChartData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Appointment Status Distribution */}
        <div className="bg-card border border-border rounded-2xl shadow-premium p-6 space-y-4">
          <h3 className="text-sm font-bold">Appointment status progressions</h3>
          <div className="h-64 flex flex-col justify-center items-center">
            {aptChartData.length === 0 ? (
              <p className="text-xs text-muted-foreground">No appointments recorded for status distributions.</p>
            ) : (
              <div className="relative h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={aptChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {aptChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
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

        {/* Chart 3: Patient Blood Type Distribution */}
        <div className="bg-card border border-border rounded-2xl shadow-premium p-6 space-y-4">
          <h3 className="text-sm font-bold">Blood type distributions</h3>
          <div className="h-64 w-full">
            {bloodTypeData.length === 0 ? (
              <div className="h-full flex justify-center items-center text-xs text-muted-foreground">No patient distribution data.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bloodTypeData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(156,163,175,0.08)" vertical={false} />
                  <XAxis dataKey="name" fontSize={11} stroke="#9ca3af" tickLine={false} />
                  <YAxis fontSize={11} stroke="#9ca3af" tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: '1px solid var(--border)', 
                      backgroundColor: 'var(--card)'
                    }} 
                  />
                  <Bar dataKey="patients" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 4: Gender demographics */}
        <div className="bg-card border border-border rounded-2xl shadow-premium p-6 space-y-4">
          <h3 className="text-sm font-bold">Gender Demographics Distribution</h3>
          <div className="h-64 flex flex-col justify-center items-center">
            {genderData.length === 0 ? (
              <p className="text-xs text-muted-foreground">No demographic registries loaded.</p>
            ) : (
              <div className="relative h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genderData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {genderData.map((entry, index) => (
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

    </div>
  );
}

export default ReportPage;
