import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuthStore } from '../store/useAuthStore';
import { 
  Receipt, 
  Search, 
  Plus, 
  PlusCircle,
  Trash2, 
  Printer, 
  X, 
  Loader2, 
  AlertCircle,
  CreditCard,
  DollarSign,
  Briefcase,
  Layers,
  ChevronRight,
  TrendingUp,
  FileCheck
} from 'lucide-react';
import api from '../services/api';

function BillingPage() {
  const { user } = useAuthStore();
  const [invoices, setInvoices] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  // Search/Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Invoice for Payment or Detail
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  
  // Pay Modal State
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payError, setPayError] = useState(null);

  // Create Invoice Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    status: 'PENDING',
    items: [
      { description: 'Consultation Charge', amount: '150.00' }
    ]
  });
  const [createError, setCreateError] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      let queryParams = {};
      if (user?.role === 'PATIENT') {
        queryParams.patientId = user.patientProfileId;
      }

      const res = await api.get('/billing', { params: queryParams });
      setInvoices(res.data.invoices || []);

      if (['ADMIN', 'RECEPTIONIST'].includes(user?.role)) {
        const patientsRes = await api.get('/patients');
        setPatients(patientsRes.data.patients || []);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch invoice ledger. Please reload.');
    } finally {
      setLoading(false);
    }
  };

  const fetchFilteredInvoices = async () => {
    try {
      let queryParams = {};
      if (user?.role === 'PATIENT') {
        queryParams.patientId = user.patientProfileId;
      }
      if (statusFilter) queryParams.status = statusFilter;
      if (searchQuery) queryParams.search = searchQuery;

      const res = await api.get('/billing', { params: queryParams });
      setInvoices(res.data.invoices || []);
    } catch (err) {
      console.warn('Failed to filter invoices', err);
    }
  };

  useEffect(() => {
    if (!loading) {
      fetchFilteredInvoices();
    }
  }, [statusFilter, searchQuery]);

  // Dynamic Item row manipulations
  const handleAddItemRow = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', amount: '0.00' }]
    }));
  };

  const handleRemoveItemRow = (index) => {
    if (formData.items.length === 1) return;
    const updated = [...formData.items];
    updated.splice(index, 1);
    setFormData(prev => ({ ...prev, items: updated }));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...formData.items];
    updated[index][field] = value;
    setFormData(prev => ({ ...prev, items: updated }));
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    setCreateError(null);
    setActionLoading(true);

    try {
      if (!formData.patientId) throw new Error('Please select a patient.');
      if (formData.items.some(it => !it.description || parseFloat(it.amount) < 0)) {
        throw new Error('Please enter valid descriptions and non-negative costs.');
      }

      const items = formData.items.map(it => ({
        description: it.description.trim(),
        amount: parseFloat(it.amount)
      }));

      const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

      const payload = {
        patientId: formData.patientId,
        status: formData.status,
        totalAmount,
        paidAmount: formData.status === 'PAID' ? totalAmount : 0.0,
        items
      };

      await api.post('/billing', payload);
      
      setIsCreateModalOpen(false);
      setFormData({
        patientId: '',
        status: 'PENDING',
        items: [{ description: 'Consultation Charge', amount: '150.00' }]
      });
      fetchInitialData();
    } catch (err) {
      console.error(err);
      setCreateError(err.response?.data?.message || err.message || 'Failed to generate invoice.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePaySubmit = async (e) => {
    e.preventDefault();
    setPayError(null);
    setActionLoading(true);

    try {
      const amount = parseFloat(payAmount);
      if (isNaN(amount) || amount < 0 || amount > selectedInvoice.totalAmount) {
        throw new Error(`Please enter a valid amount between 0.00 EGP and ${selectedInvoice.totalAmount.toFixed(2)} EGP`);
      }

      await api.patch(`/billing/${selectedInvoice.id}/pay`, { paidAmount: amount });
      
      setIsPayModalOpen(false);
      setSelectedInvoice(null);
      setPayAmount('');
      fetchInitialData();
    } catch (err) {
      console.error(err);
      setPayError(err.response?.data?.message || err.message || 'Failed to submit payment.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (invId) => {
    if (!window.confirm('Are you sure you want to permanently purge this invoice?')) return;
    try {
      setActionLoading(true);
      await api.delete(`/billing/${invId}`);
      if (selectedInvoice?.id === invId) setSelectedInvoice(null);
      fetchInitialData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete invoice.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrint = (inv) => {
    const printWindow = window.open('', '_blank');
    
    const calculateAge = (dobString) => {
      if (!dobString) return 'N/A';
      const dob = new Date(dobString);
      const diffMs = Date.now() - dob.getTime();
      const ageDate = new Date(diffMs);
      return Math.abs(ageDate.getUTCFullYear() - 1970);
    };

    const patientAge = calculateAge(inv.patient?.dateOfBirth);
    const dateFormatted = new Date(inv.createdAt).toLocaleDateString('en-EG', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });

    const stampText = inv.status === 'PAID' ? 'PAID STATEMENT' : inv.status === 'PARTIALLY_PAID' ? 'PARTIAL PAYMENT' : 'STATEMENT DUE';
    const stampColor = inv.status === 'PAID' ? '#0e8ce4' : inv.status === 'PARTIALLY_PAID' ? '#6366f1' : '#f59e0b';

    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice Statement INV-${inv.id.substring(0, 8).toUpperCase()}</title>
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
              grid-template-columns: 2fr 1fr 1fr 1.2fr;
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
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }

            /* Table Styles */
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
            .right {
              text-align: right;
            }
            tr:nth-child(even) td {
              background-color: #f8fafc;
            }

            .summary-table {
              width: 280px;
              margin-left: auto;
              margin-right: 0;
              margin-top: 15px;
            }
            .summary-table td {
              padding: 8px 10px;
              font-size: 12px;
              border-bottom: 1px solid #e2e8f0;
            }
            .summary-table tr.total-row td {
              font-size: 14px;
              font-weight: 800;
              color: #0e8ce4;
              border-bottom: 2px solid #0e8ce4;
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
              padding-top: 8px;
              font-size: 11px;
              color: #64748b;
              font-weight: 600;
            }

            @media print {
              body {
                padding: 0;
                background-color: transparent;
              }
              .prescription-container {
                border: none;
                box-shadow: none;
                padding: 10px 0;
                max-width: 100%;
              }
              @page {
                size: A4;
                margin: 15mm 15mm;
              }
            }
          </style>
        </head>
        <body>
          <div class="prescription-container">
            <!-- CareSync Official Header -->
            <div class="header-section">
              <div class="clinic-info">
                <div class="clinic-brand">
                  <svg class="clinic-logo" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M12 8v8M8 12h8" />
                  </svg>
                  <h1 class="clinic-title">CareSync Medical Center</h1>
                </div>
                <p class="clinic-details">100 CareSync Avenue, Heliopolis, Cairo</p>
                <p class="clinic-details">Tel: +20 2 2808 7344 | Finance Dept: ext 402</p>
              </div>
              
              <div class="doctor-info">
                <h2 class="doctor-name">Accounts & Audit</h2>
                <p class="doctor-spec">Finance Department</p>
                <p class="doctor-license">Official Transaction Ledger</p>
              </div>
            </div>
            
            <!-- Patient Demographics Info Bar -->
            <div class="patient-bar">
              <div class="patient-bar-item">
                <span class="patient-bar-label">Patient Name</span>
                <span class="patient-bar-value" title="${inv.patient?.firstName} ${inv.patient?.lastName}">
                  ${inv.patient?.firstName} ${inv.patient?.lastName}
                </span>
              </div>
              <div class="patient-bar-item">
                <span class="patient-bar-label">Age / Sex</span>
                <span class="patient-bar-value">
                  ${patientAge} Yrs / ${inv.patient?.gender ? inv.patient.gender.charAt(0).toUpperCase() + inv.patient.gender.slice(1).toLowerCase() : 'N/A'}
                </span>
              </div>
              <div class="patient-bar-item">
                <span class="patient-bar-label">Statement Date</span>
                <span class="patient-bar-value">${dateFormatted}</span>
              </div>
              <div class="patient-bar-item">
                <span class="patient-bar-label">Invoice Code</span>
                <span class="patient-bar-value" style="font-family: monospace; font-weight: 700;">
                  INV-${inv.id.substring(0, 8).toUpperCase()}
                </span>
              </div>
            </div>

            <!-- Invoiced items details -->
            <div class="section-title">Itemized Healthcare Services</div>
            <table>
              <thead>
                <tr>
                  <th>Healthcare Item / Service Description</th>
                  <th class="right">Charged Amount</th>
                </tr>
              </thead>
              <tbody>
                ${inv.items.map(it => `
                  <tr>
                    <td style="font-weight: 600;">${it.description}</td>
                    <td class="right" style="font-family: monospace; font-weight: 700;">${it.amount.toFixed(2)} EGP</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <!-- Financial summaries -->
            <table class="summary-table">
              <tr>
                <td style="font-weight: 600; color: #64748b;">Gross Total Amount:</td>
                <td class="right" style="font-family: monospace; font-weight: 700;">${inv.totalAmount.toFixed(2)} EGP</td>
              </tr>
              <tr>
                <td style="font-weight: 600; color: #64748b;">Amount Paid (Credits):</td>
                <td class="right" style="font-family: monospace; font-weight: 700; color: #10b981;">${inv.paidAmount.toFixed(2)} EGP</td>
              </tr>
              <tr class="total-row">
                <td style="font-weight: 800;">Outstanding Balance:</td>
                <td class="right" style="font-family: monospace; font-weight: 800;">${(inv.totalAmount - inv.paidAmount).toFixed(2)} EGP</td>
              </tr>
            </table>

            <!-- Footer & Signature Block -->
            <div class="footer-section">
              <div class="disclaimer-container">
                <div class="disclaimer">
                  This document is an electronically generated clinical invoice ledger statement. All billing amounts are listed in Egyptian Pounds (EGP). Payment policies require settled statements upon discharge.
                </div>
                <div class="dispense-note">
                  Billing Officer: _______________________ Settle Date: ____/____/______
                </div>
              </div>
              
              <div class="signature-container">
                <!-- Rotated official transaction stamp seal -->
                <div class="verified-stamp">
                  <svg viewBox="0 0 100 100" width="100" height="100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="${stampColor}" stroke-width="2" stroke-dasharray="4,3" />
                    <circle cx="50" cy="50" r="38" fill="none" stroke="${stampColor}" stroke-width="1" />
                    <path id="curve" fill="none" d="M 17,50 A 33,33 0 1,1 83,50" />
                    <text fill="${stampColor}" font-size="6" font-family="'Inter', sans-serif" font-weight="800" letter-spacing="1">
                      <textPath href="#curve" startOffset="50%" text-anchor="middle">
                        OFFICIAL TRANSACTION
                      </textPath>
                    </text>
                    <g transform="translate(35, 38)">
                      <path d="M5 11l3 3 7-7" fill="none" stroke="${stampColor}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
                    </g>
                    <text x="50" y="66" fill="${stampColor}" font-size="7" font-family="'Inter', sans-serif" font-weight="900" text-anchor="middle" letter-spacing="0.5">
                      ${stampText}
                    </text>
                    <text x="50" y="75" fill="#64748b" font-size="5" font-family="'Inter', sans-serif" font-weight="600" text-anchor="middle">
                      CARESYNC AUDIT
                    </text>
                  </svg>
                </div>
                <div class="sig-doctor">Accounts Audit Dept</div>
                <div class="sig-line">Authorized Signatory Office</div>
              </div>
            </div>

          </div>
          
          <script>
            if (document.fonts) {
              document.fonts.ready.then(function() {
                setTimeout(function() {
                  window.print();
                }, 250);
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

  // KPIs
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalCollected = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
  const totalOutstanding = totalInvoiced - totalCollected;

  // Status style helper
  const getStatusStyle = (status) => {
    const styles = {
      PAID: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20',
      PENDING: 'bg-amber-500/10 text-amber-600 border border-amber-500/20',
      PARTIALLY_PAID: 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20'
    };
    return styles[status] || '';
  };

  if (loading) {
    return (
      <div className="h-[70vh] flex flex-col justify-center items-center space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground font-semibold">Consolidating hospital ledger accounts...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Billing & Invoices</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Review accounts, settle patient invoices, and audit transactional clinical service logs.
          </p>
        </div>

        {['ADMIN', 'RECEPTIONIST'].includes(user?.role) && (
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-premium hover:bg-primary/95 transition-all"
          >
            <Plus className="w-4.5 h-4.5" />
            <span>Generate Manual Invoice</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center space-x-3 text-red-500 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* KPI Cards section */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
        
        {/* KPI: Total Invoiced */}
        <div className="bg-card border border-border rounded-2xl shadow-premium p-6 flex justify-between items-center hover:shadow-premium-hover transition-all duration-300">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Invoiced</p>
            <p className="text-2xl font-black">{totalInvoiced.toFixed(2)} EGP</p>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        {/* KPI: Total Collected */}
        <div className="bg-card border border-border rounded-2xl shadow-premium p-6 flex justify-between items-center hover:shadow-premium-hover transition-all duration-300">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Revenue Collected</p>
            <p className="text-2xl font-black">{totalCollected.toFixed(2)} EGP</p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl">
            <FileCheck className="w-5 h-5" />
          </div>
        </div>

        {/* KPI: Outstanding */}
        <div className="bg-card border border-border rounded-2xl shadow-premium p-6 flex justify-between items-center hover:shadow-premium-hover transition-all duration-300">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Outstanding</p>
            <p className="text-2xl font-black">{totalOutstanding.toFixed(2)} EGP</p>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Grid Layout splits */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Ledger List */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Controls filter bar */}
          <div className="bg-card border border-border rounded-2xl shadow-premium p-4 flex flex-col sm:flex-row justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text"
                placeholder="Search patient name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full text-xs bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Status selector */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="">All Payments Statuses</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="PARTIALLY_PAID">Partially Paid</option>
            </select>
          </div>

          {/* Table display */}
          <div className="bg-card border border-border rounded-2xl shadow-premium overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/20 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <th className="p-4 pl-6">Invoice ID</th>
                    <th className="p-4">Patient Billed</th>
                    <th className="p-4">Total Amount</th>
                    <th className="p-4">Outstanding</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-12 text-center text-xs text-muted-foreground font-semibold">
                        No invoices logged in this category.
                      </td>
                    </tr>
                  ) : (
                    invoices.map((inv) => (
                      <tr 
                        key={inv.id} 
                        onClick={() => setSelectedInvoice(inv)}
                        className={`hover:bg-muted/10 transition-colors cursor-pointer ${
                          selectedInvoice?.id === inv.id ? 'bg-primary/5' : ''
                        }`}
                      >
                        <td className="p-4 pl-6">
                          <span className="font-extrabold text-xs">INV-${inv.id.substring(0, 8).toUpperCase()}</span>
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-xs">{inv.patient?.firstName} {inv.patient?.lastName}</p>
                          <p className="text-[9px] text-muted-foreground">{inv.patient?.phoneNumber || 'No contact'}</p>
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-xs">{inv.totalAmount.toFixed(2)} EGP</span>
                        </td>
                        <td className="p-4">
                          <span className={`font-bold text-xs ${inv.totalAmount - inv.paidAmount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {(inv.totalAmount - inv.paidAmount).toFixed(2)} EGP
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(inv.status)}`}>
                            {inv.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-4 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end space-x-2">
                            {['ADMIN', 'RECEPTIONIST'].includes(user?.role) && inv.status !== 'PAID' && (
                              <button 
                                onClick={() => { setSelectedInvoice(inv); setPayAmount(inv.totalAmount); setIsPayModalOpen(true); }}
                                className="px-2.5 py-1 text-[10px] bg-primary text-primary-foreground font-bold rounded-lg shadow-sm hover:bg-primary/95 transition-all"
                              >
                                Collect Pay
                              </button>
                            )}
                            <button 
                              onClick={() => handlePrint(inv)}
                              className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            {user?.role === 'ADMIN' && (
                              <button 
                                onClick={() => handleDelete(inv.id)}
                                className="p-1.5 rounded-lg border border-red-500/20 text-red-500 hover:bg-red-500/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Side: Ledger Line Items Preview */}
        <div className="lg:col-span-4">
          {selectedInvoice ? (
            <div className="bg-card border border-border rounded-2xl shadow-premium p-6 space-y-6 animate-fade-in position-sticky top-20">
              
              {/* Header */}
              <div className="flex justify-between items-start border-b border-border pb-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${getStatusStyle(selectedInvoice.status)}`}>
                      {selectedInvoice.status.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-semibold">Code: INV-${selectedInvoice.id.substring(0, 6).toUpperCase()}</span>
                  </div>
                  <h3 className="text-base font-black text-foreground">{selectedInvoice.patient?.firstName} {selectedInvoice.patient?.lastName}</h3>
                  <p className="text-xs text-muted-foreground">Date: {new Date(selectedInvoice.createdAt).toLocaleString()}</p>
                </div>
              </div>

              {/* Items Summary list */}
              <div className="space-y-3">
                <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Services Rendered Items</div>
                <div className="divide-y divide-border/60 text-xs">
                  {selectedInvoice.items?.map((item) => (
                    <div key={item.id} className="py-2.5 flex justify-between items-center">
                      <span className="font-semibold text-muted-foreground">{item.description}</span>
                      <span className="font-bold text-foreground">{item.amount.toFixed(2)} EGP</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total calculations */}
              <div className="bg-muted/30 border border-border p-4 rounded-2xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-muted-foreground">Total Invoiced Gross:</span>
                  <span className="font-bold text-foreground">{selectedInvoice.totalAmount.toFixed(2)} EGP</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-muted-foreground">Credited Paid Cash:</span>
                  <span className="font-bold text-emerald-600">{selectedInvoice.paidAmount.toFixed(2)} EGP</span>
                </div>
                <div className="h-[1px] bg-border my-1"></div>
                <div className="flex justify-between items-center text-sm font-black">
                  <span className="text-foreground">Outstanding Balance:</span>
                  <span className="text-amber-600">{(selectedInvoice.totalAmount - selectedInvoice.paidAmount).toFixed(2)} EGP</span>
                </div>
              </div>

              {/* Payment buttons */}
              {['ADMIN', 'RECEPTIONIST'].includes(user?.role) && selectedInvoice.status !== 'PAID' && (
                <button 
                  onClick={() => { setPayAmount(selectedInvoice.totalAmount); setIsPayModalOpen(true); }}
                  className="w-full py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-premium hover:bg-primary/95 transition-all flex justify-center items-center space-x-2"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Settle Outstanding Balances</span>
                </button>
              )}

            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl shadow-premium p-12 text-center flex flex-col items-center justify-center space-y-3 h-full min-h-[300px]">
              <Receipt className="w-12 h-12 text-muted-foreground/40" />
              <h4 className="text-sm font-bold text-muted-foreground">No Invoice Selected</h4>
              <p className="text-xs text-muted-foreground max-w-xs leading-normal">
                Select any invoice row in the ledger list to access raw service itemizations, payments history, balance splits, and processing controls.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Modal: Process/Collect Pay */}
      {isPayModalOpen && selectedInvoice && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md flex justify-center items-center p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
            
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/10">
              <h3 className="text-base font-extrabold flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-primary" />
                <span>Collect Service Fees Payment</span>
              </h3>
              <button 
                onClick={() => { setIsPayModalOpen(false); setPayError(null); }}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePaySubmit} className="p-6 space-y-4">
              {payError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center space-x-2 text-red-500 text-xs font-semibold">
                  <AlertCircle className="w-4.5 h-4.5" />
                  <span>{payError}</span>
                </div>
              )}

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Patient: <strong>{selectedInvoice.patient?.firstName} {selectedInvoice.patient?.lastName}</strong></p>
                <p className="text-xs text-muted-foreground">Outstanding Total Amount: <strong>{selectedInvoice.totalAmount.toFixed(2)} EGP</strong></p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Amount Billed Paid (EGP)</label>
                <input 
                  type="number"
                  step="0.01"
                  required
                  max={selectedInvoice.totalAmount}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-muted/40 border border-border rounded-xl focus:outline-none"
                />
                <span className="text-[10px] text-muted-foreground block leading-tight">
                  * Submitting an amount equal to or exceeding total will change invoice status to PAID. Partial amounts set status to PARTIALLY PAID.
                </span>
              </div>

              <div className="flex space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => { setIsPayModalOpen(false); setPayError(null); }}
                  className="w-1/2 px-4 py-2.5 bg-muted text-foreground border border-border font-bold text-xs rounded-xl hover:bg-muted/80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-1/2 px-4 py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-premium hover:bg-primary/95 flex justify-center items-center"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Settle Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: Generate Manual Invoice */}
      {isCreateModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md flex justify-center items-center p-4">
          <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
            
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/10">
              <h3 className="text-base font-extrabold flex items-center space-x-2">
                <PlusCircle className="w-5 h-5 text-primary" />
                <span>Create Manual Invoice</span>
              </h3>
              <button 
                onClick={() => { setIsCreateModalOpen(false); setCreateError(null); }}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {createError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center space-x-2 text-red-500 text-xs font-semibold">
                  <AlertCircle className="w-4.5 h-4.5" />
                  <span>{createError}</span>
                </div>
              )}

              {/* Patient Selector */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select Patient</label>
                <select
                  required
                  value={formData.patientId}
                  onChange={(e) => setFormData(prev => ({ ...prev, patientId: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map((pat) => (
                    <option key={pat.id} value={pat.id}>
                      {pat.firstName} {pat.lastName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Initial Payment Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-muted/40 border border-border rounded-xl focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="PENDING">Pending (Unpaid)</option>
                  <option value="PAID">Paid (Settle immediately)</option>
                </select>
              </div>

              {/* Dynamic Items list */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Line Charges Items</span>
                  <button 
                    type="button" 
                    onClick={handleAddItemRow}
                    className="flex items-center space-x-1 text-primary hover:text-primary/80 font-bold text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.items.map((it, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-muted/20 p-2 border border-border rounded-lg relative">
                      <input 
                        type="text"
                        required
                        placeholder="Service charge description"
                        value={it.description}
                        onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                        className="w-3/5 px-2 py-1 text-xs bg-card border border-border rounded"
                      />
                      <input 
                        type="number"
                        step="0.01"
                        required
                        value={it.amount}
                        onChange={(e) => handleItemChange(idx, 'amount', e.target.value)}
                        className="w-1/5 px-2 py-1 text-xs bg-card border border-border rounded"
                      />
                      {formData.items.length > 1 && (
                        <button 
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          className="w-1/5 text-red-500 hover:bg-red-500/10 rounded p-1 flex justify-center"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Summary sum display */}
              <div className="p-3 bg-muted/40 border border-border rounded-xl text-right font-black text-xs space-x-2">
                <span className="text-muted-foreground">Estimated Total Amount:</span>
                <span className="text-primary">
                  {formData.items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0).toFixed(2)} EGP
                </span>
              </div>

              <div className="flex space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => { setIsCreateModalOpen(false); setCreateError(null); }}
                  className="w-1/2 px-4 py-2.5 bg-muted text-foreground border border-border font-bold text-xs rounded-xl hover:bg-muted/80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-1/2 px-4 py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-premium hover:bg-primary/95 flex justify-center items-center"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate Invoice'}
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

export default BillingPage;
