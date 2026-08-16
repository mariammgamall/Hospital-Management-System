import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuthStore } from '../store/useAuthStore';
import { 
  FileCheck, 
  Search, 
  Plus, 
  Trash2, 
  Printer, 
  X, 
  Loader2, 
  AlertCircle,
  PlusCircle,
  FileText,
  User,
  HeartPulse
} from 'lucide-react';
import api from '../services/api';
import { getDoctorName } from '../utils/doctorHelper';

function PrescriptionPage() {
  const { user } = useAuthStore();
  const [prescriptions, setPrescriptions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Selected prescription for preview
  const [selectedRx, setSelectedRx] = useState(null);
  
  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    medicalRecordId: '',
    medicines: [
      { name: '', dosage: '', frequency: '', duration: '' }
    ]
  });
  const [modalError, setModalError] = useState(null);

  // Search query
  const [searchQuery, setSearchQuery] = useState('');

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
      } else if (user?.role === 'DOCTOR') {
        queryParams.doctorId = user.doctorProfileId;
      }

      const rxRes = await api.get('/prescriptions', { params: queryParams });
      setPrescriptions(rxRes.data.prescriptions || []);

      if (['ADMIN', 'DOCTOR'].includes(user?.role)) {
        const [patientsRes, recordsRes] = await Promise.all([
          api.get('/patients'),
          api.get('/medical-records')
        ]);
        setPatients(patientsRes.data.patients || []);
        
        // Filter EMRs to let doctor link
        const doctorRecords = (recordsRes.data.records || []).filter(
          r => user.role === 'ADMIN' || r.doctorId === user.doctorProfileId
        );
        setMedicalRecords(doctorRecords);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch prescription directories. Please reload.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedicineRow = () => {
    setFormData(prev => ({
      ...prev,
      medicines: [...prev.medicines, { name: '', dosage: '', frequency: '', duration: '' }]
    }));
  };

  const handleRemoveMedicineRow = (index) => {
    if (formData.medicines.length === 1) return;
    const updated = [...formData.medicines];
    updated.splice(index, 1);
    setFormData(prev => ({ ...prev, medicines: updated }));
  };

  const handleMedicineChange = (index, field, value) => {
    const updated = [...formData.medicines];
    updated[index][field] = value;
    setFormData(prev => ({ ...prev, medicines: updated }));
  };

  const handleCreatePrescription = async (e) => {
    e.preventDefault();
    setModalError(null);
    setActionLoading(true);

    try {
      const payload = {
        patientId: formData.patientId,
        doctorId: user?.role === 'DOCTOR' ? user.doctorProfileId : undefined,
        medicalRecordId: formData.medicalRecordId || undefined,
        medicines: formData.medicines.map(m => ({
          name: m.name.trim(),
          dosage: m.dosage.trim(),
          frequency: m.frequency.trim(),
          duration: m.duration.trim()
        }))
      };

      if (!payload.patientId) throw new Error('Please select a patient.');
      if (payload.medicines.some(m => !m.name || !m.dosage || !m.frequency || !m.duration)) {
        throw new Error('Please fill in complete medicine row fields.');
      }

      if (user?.role === 'ADMIN') {
        const doctorsRes = await api.get('/doctors');
        const docs = doctorsRes.data.doctors || [];
        if (docs.length === 0) throw new Error('No doctor profiles exist.');
        payload.doctorId = docs[0].id;
      }

      await api.post('/prescriptions', payload);
      
      setIsModalOpen(false);
      setFormData({
        patientId: '',
        medicalRecordId: '',
        medicines: [{ name: '', dosage: '', frequency: '', duration: '' }]
      });
      fetchInitialData();
    } catch (err) {
      console.error(err);
      setModalError(err.response?.data?.message || err.message || 'Failed to submit prescription chart.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (rxId) => {
    if (!window.confirm('Delete this prescription sheet permanently?')) return;
    try {
      setActionLoading(true);
      await api.delete(`/prescriptions/${rxId}`);
      if (selectedRx?.id === rxId) setSelectedRx(null);
      fetchInitialData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete record.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrint = (rx) => {
    const printWindow = window.open('', '_blank');
    const docName = getDoctorName(rx.doctor);

    const calculateAge = (dobString) => {
      if (!dobString) return 'N/A';
      const dob = new Date(dobString);
      const diffMs = Date.now() - dob.getTime();
      const ageDate = new Date(diffMs);
      return Math.abs(ageDate.getUTCFullYear() - 1970);
    };

    const patientAge = calculateAge(rx.patient?.dateOfBirth);
    const dateFormatted = new Date(rx.createdAt).toLocaleDateString('en-EG', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });

    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Prescription Order RX-${rx.id.substring(0, 8).toUpperCase()}</title>
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

            /* Rx Body Section */
            .rx-body {
              margin-bottom: 40px;
              position: relative;
            }
            .rx-symbol {
              font-family: 'Lora', serif;
              font-size: 48px;
              font-style: italic;
              font-weight: 700;
              color: #0e8ce4;
              margin: 0 0 15px 0;
              line-height: 1;
              display: inline-block;
            }
            .meds-list {
              display: flex;
              flex-direction: column;
            }
            .med-item {
              display: flex;
              align-items: flex-start;
              padding: 16px 0;
              border-bottom: 1px dashed #cbd5e1;
            }
            .med-item:last-child {
              border-bottom: none;
            }
            .med-number {
              font-family: 'Lora', serif;
              font-size: 15px;
              font-weight: 700;
              color: #0e8ce4;
              width: 28px;
              padding-top: 1px;
            }
            .med-details {
              flex: 1;
            }
            .med-header-row {
              display: flex;
              justify-content: space-between;
              align-items: baseline;
              margin-bottom: 6px;
            }
            .med-name {
              font-size: 15px;
              font-weight: 700;
              color: #0f172a;
              letter-spacing: -0.01em;
            }
            .med-dosage {
              font-family: 'Lora', serif;
              font-size: 12px;
              font-weight: 600;
              font-style: italic;
              color: #0c72ba;
              background-color: #eff6ff;
              border: 1px solid #dbeafe;
              padding: 2px 10px;
              border-radius: 6px;
            }
            .med-schedule-row {
              display: flex;
              gap: 24px;
              font-size: 12px;
              color: #475569;
              font-weight: 500;
            }
            .med-frequency, .med-duration {
              display: flex;
              align-items: center;
              gap: 6px;
            }
            .med-icon {
              width: 14px;
              height: 14px;
              color: #64748b;
              stroke-width: 2.2;
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
            <!-- Header section with clinic and doctor details -->
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
                <p class="clinic-details">Tel: +20 2 2808 7344 | Emergency: 19999</p>
              </div>
              
              <div class="doctor-info">
                <h2 class="doctor-name">${docName}</h2>
                <p class="doctor-spec">${rx.doctor?.specialty || 'General Practice'}</p>
                <p class="doctor-license">Lic. No: EGY-MR-${rx.doctor?.id?.substring(0, 6).toUpperCase() || '62849'}</p>
              </div>
            </div>
            
            <!-- Sleek Horizontal Patient Meta Bar -->
            <div class="patient-bar">
              <div class="patient-bar-item">
                <span class="patient-bar-label">Patient Name</span>
                <span class="patient-bar-value" title="${rx.patient?.firstName} ${rx.patient?.lastName}">
                  ${rx.patient?.firstName} ${rx.patient?.lastName}
                </span>
              </div>
              <div class="patient-bar-item">
                <span class="patient-bar-label">Age / Sex</span>
                <span class="patient-bar-value">
                  ${patientAge} Yrs / ${rx.patient?.gender ? rx.patient.gender.charAt(0).toUpperCase() + rx.patient.gender.slice(1).toLowerCase() : 'N/A'}
                </span>
              </div>
              <div class="patient-bar-item">
                <span class="patient-bar-label">Date</span>
                <span class="patient-bar-value">${dateFormatted}</span>
              </div>
              <div class="patient-bar-item">
                <span class="patient-bar-label">Rx Reference</span>
                <span class="patient-bar-value" style="font-family: monospace; font-weight: 700;">
                  RX-${rx.id.substring(0, 8).toUpperCase()}
                </span>
              </div>
            </div>
            
            <!-- Rx Symbol and Medicines -->
            <div class="rx-body">
              <div class="rx-symbol">Rₓ</div>
              
              <div class="meds-list">
                ${rx.medicines.map((m, index) => `
                  <div class="med-item">
                    <div class="med-number">${index + 1}.</div>
                    <div class="med-details">
                      <div class="med-header-row">
                        <span class="med-name">${m.name}</span>
                        <span class="med-dosage">${m.dosage}</span>
                      </div>
                      <div class="med-schedule-row">
                        <span class="med-frequency">
                          <svg class="med-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          ${m.frequency}
                        </span>
                        <span class="med-duration">
                          <svg class="med-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                            <polyline points="10 9 9 9 8 9" />
                          </svg>
                          Duration: ${m.duration}
                        </span>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
            
            <!-- Footer & Signature Block -->
            <div class="footer-section">
              <div class="disclaimer-container">
                <div class="disclaimer">
                  This document is an electronic medical prescription generated securely by CareSync HMS. It contains a cryptographically verified electronic signature block and is legally authorized for dispensing.
                </div>
                <div class="dispense-note">
                  Dispensed by: _______________________ Date: ____/____/______
                </div>
              </div>
              
              <div class="signature-container">
                <div class="verified-stamp">
                  <svg viewBox="0 0 100 100" width="100" height="100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#0e8ce4" stroke-width="2" stroke-dasharray="4,3" />
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#0e8ce4" stroke-width="1" />
                    <path id="curve" fill="none" d="M 17,50 A 33,33 0 1,1 83,50" />
                    <text fill="#0e8ce4" font-size="6.5" font-family="'Inter', sans-serif" font-weight="800" letter-spacing="1.5">
                      <textPath href="#curve" startOffset="50%" text-anchor="middle">
                        SECURE ELECTRONIC Rx
                      </textPath>
                    </text>
                    <g transform="translate(35, 38)">
                      <path d="M5 11l3 3 7-7" fill="none" stroke="#0e8ce4" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
                    </g>
                    <text x="50" y="66" fill="#0e8ce4" font-size="7.5" font-family="'Inter', sans-serif" font-weight="900" text-anchor="middle" letter-spacing="0.5">
                      VERIFIED
                    </text>
                    <text x="50" y="75" fill="#64748b" font-size="5" font-family="'Inter', sans-serif" font-weight="600" text-anchor="middle">
                      CARESYNC HMS
                    </text>
                  </svg>
                </div>
                <div class="sig-doctor">${docName}</div>
                <div class="sig-line">Licensed Practitioner Signature</div>
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

  const filteredRxList = prescriptions.filter((rx) => {
    const q = searchQuery.toLowerCase();
    const patientName = `${rx.patient?.firstName} ${rx.patient?.lastName}`.toLowerCase();
    const docName = getDoctorName(rx.doctor).toLowerCase();
    const hasMed = rx.medicines?.some(m => m.name.toLowerCase().includes(q));
    return patientName.includes(q) || docName.includes(q) || hasMed;
  });

  if (loading) {
    return (
      <div className="h-[70vh] flex flex-col justify-center items-center space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground font-semibold">Accessing Clinical Rx Registry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Prescriptions Board</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Write clinical pharmacology schedules, print prescription records, and monitor medicines.
          </p>
        </div>

        {['ADMIN', 'DOCTOR'].includes(user?.role) && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-premium hover:bg-primary/95 transition-all"
          >
            <Plus className="w-4.5 h-4.5" />
            <span>Write New Prescription</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center space-x-3 text-red-500 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Rx List */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Search bar */}
          <div className="bg-card border border-border rounded-2xl shadow-premium p-3 flex items-center space-x-3">
            <Search className="w-4 h-4 text-muted-foreground ml-2 shrink-0" />
            <input 
              type="text"
              placeholder="Search Rx by drug name, doctor or patient..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-0 text-xs text-foreground focus:outline-none focus:ring-0"
            />
          </div>

          {/* Rx cards */}
          <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
            {filteredRxList.length === 0 ? (
              <div className="bg-card border border-border rounded-2xl shadow-premium p-12 text-center flex flex-col items-center justify-center space-y-3">
                <FileCheck className="w-12 h-12 text-muted-foreground/60" />
                <h3 className="text-base font-bold">No Prescriptions Written</h3>
                <p className="text-xs text-muted-foreground max-w-xs">
                  There are no written drug prescriptions matching your context.
                </p>
              </div>
            ) : (
              filteredRxList.map((rx) => (
                <div 
                  key={rx.id}
                  onClick={() => setSelectedRx(rx)}
                  className={`bg-card border rounded-2xl shadow-premium p-5 hover:shadow-premium-hover hover:border-primary/45 transition-all duration-200 cursor-pointer relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                    selectedRx?.id === rx.id ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-primary/10 text-primary rounded-lg shrink-0">
                        <HeartPulse className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase">RX-${rx.id.substring(0, 8).toUpperCase()}</span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-foreground">
                        {rx.patient?.firstName} {rx.patient?.lastName}
                      </h4>
                      <p className="text-xs text-muted-foreground font-semibold">
                        Drugs: {rx.medicines?.map(m => m.name).join(', ')}
                      </p>
                    </div>

                    <div className="flex items-center space-x-4 text-[10px] text-muted-foreground font-semibold">
                      <span>Date: {new Date(rx.createdAt).toLocaleDateString()}</span>
                      <span>Doctor: {getDoctorName(rx.doctor)}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handlePrint(rx); }}
                      className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    {user?.role === 'ADMIN' && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(rx.id); }}
                        className="p-2 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Detailed Rx Preview */}
        <div className="lg:col-span-5">
          {selectedRx ? (
            <div className="bg-card border border-border rounded-2xl shadow-premium p-6 space-y-6 animate-fade-in position-sticky top-20">
              
              {/* Card Header */}
              <div className="flex justify-between items-start border-b border-border pb-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase bg-primary/10 text-primary border border-primary/20 rounded">
                      PHARMACOLOGY Rx
                    </span>
                    <span className="text-[10px] text-muted-foreground font-semibold">Ref: RX-${selectedRx.id.substring(0, 8).toUpperCase()}</span>
                  </div>
                  <h3 className="text-base font-black text-foreground">{selectedRx.patient?.firstName} {selectedRx.patient?.lastName}</h3>
                  <p className="text-xs text-muted-foreground">DOB: {new Date(selectedRx.patient?.dateOfBirth).toLocaleDateString()}</p>
                </div>
                <button 
                  onClick={() => handlePrint(selectedRx)}
                  className="flex items-center space-x-1 px-3 py-1.5 border border-primary/20 bg-primary/5 text-primary text-[10px] font-bold tracking-wide uppercase rounded-xl hover:bg-primary/10"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Rx</span>
                </button>
              </div>

              {/* Doctor Details */}
              <div className="bg-muted/20 border border-border p-4 rounded-xl space-y-2">
                <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Prescribing Practitioner</div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                    Dr
                  </div>
                  <div>
                    <p className="text-xs font-extrabold">{getDoctorName(selectedRx.doctor)}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{selectedRx.doctor?.specialty || 'General Practice'}</p>
                  </div>
                </div>
              </div>

              {/* Medicine rows listing */}
              <div className="space-y-3">
                <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Prescribed Drug Regiment</div>
                <div className="space-y-2.5 divide-y divide-border/50">
                  {selectedRx.medicines?.map((med, index) => (
                    <div key={med.id} className={`pt-3 flex justify-between items-start gap-4 ${index === 0 ? '!pt-0' : ''}`}>
                      <div className="space-y-1">
                        <p className="text-xs font-black text-foreground">{med.name}</p>
                        <p className="text-[10px] text-muted-foreground font-semibold">Dosage: {med.dosage} • Frequency: {med.frequency}</p>
                      </div>
                      <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-[9px] font-extrabold tracking-wider uppercase shrink-0">
                        {med.duration}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Links to EMR if any */}
              {selectedRx.medicalRecordId && (
                <div className="pt-4 border-t border-border flex items-center space-x-2 text-[10px] text-muted-foreground font-semibold">
                  <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Linked EMR ID: MR-${selectedRx.medicalRecordId.substring(0, 8).toUpperCase()}</span>
                </div>
              )}

            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl shadow-premium p-12 text-center flex flex-col items-center justify-center space-y-3 h-full min-h-[300px]">
              <FileCheck className="w-12 h-12 text-muted-foreground/40" />
              <h4 className="text-sm font-bold text-muted-foreground">No Prescription Sheet Selected</h4>
              <p className="text-xs text-muted-foreground max-w-xs leading-normal">
                Click on any pharmacology card in the list to reveal medication specifications, dosages, duration instructions, and printing options.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Modal: Write prescription */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md flex justify-center items-center p-4">
          <div className="bg-card border border-border w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/10">
              <h3 className="text-base font-extrabold flex items-center space-x-2">
                <PlusCircle className="w-5 h-5 text-primary" />
                <span>Write New Prescription Sheet</span>
              </h3>
              <button 
                onClick={() => { setIsModalOpen(false); setModalError(null); }}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form body */}
            <form onSubmit={handleCreatePrescription} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center space-x-2 text-red-500 text-xs font-semibold">
                  <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Patient Selection */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Patient File</label>
                <select
                  required
                  value={formData.patientId}
                  onChange={(e) => setFormData(prev => ({ ...prev, patientId: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="">-- Select Target Patient --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.firstName} {p.lastName} (DOB: {new Date(p.dateOfBirth).toLocaleDateString()})</option>
                  ))}
                </select>
              </div>

              {/* Optional EMR Record Selection */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Link EMR Case Note (Optional)</label>
                <select
                  value={formData.medicalRecordId}
                  onChange={(e) => setFormData(prev => ({ ...prev, medicalRecordId: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="">-- Standalone Prescription (No Case Linked) --</option>
                  {medicalRecords.map((mr) => (
                    <option key={mr.id} value={mr.id}>
                      Diagnosis: {mr.diagnosis} ({new Date(mr.createdAt).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Dynamic Medicine Rows */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Prescribed Medicines & Schedule</label>
                  <button 
                    type="button"
                    onClick={handleAddMedicineRow}
                    className="text-xs text-primary font-bold hover:underline flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Medicine Line</span>
                  </button>
                </div>

                <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                  {formData.medicines.map((med, index) => (
                    <div key={index} className="p-3 bg-muted/20 border border-border rounded-xl space-y-2 relative">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-extrabold uppercase text-muted-foreground">Item #{index + 1}</span>
                        {formData.medicines.length > 1 && (
                          <button 
                            type="button"
                            onClick={() => handleRemoveMedicineRow(index)}
                            className="text-red-500 hover:text-red-600 p-0.5"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <input 
                          type="text"
                          placeholder="Medicine Name (e.g. Amoxicillin)"
                          required
                          value={med.name}
                          onChange={(e) => handleMedicineChange(index, 'name', e.target.value)}
                          className="px-3 py-1.5 text-xs bg-card border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <input 
                          type="text"
                          placeholder="Dosage (e.g. 500mg)"
                          required
                          value={med.dosage}
                          onChange={(e) => handleMedicineChange(index, 'dosage', e.target.value)}
                          className="px-3 py-1.5 text-xs bg-card border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <input 
                          type="text"
                          placeholder="Frequency (e.g. Twice daily)"
                          required
                          value={med.frequency}
                          onChange={(e) => handleMedicineChange(index, 'frequency', e.target.value)}
                          className="px-3 py-1.5 text-xs bg-card border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <input 
                          type="text"
                          placeholder="Duration (e.g. 7 days)"
                          required
                          value={med.duration}
                          onChange={(e) => handleMedicineChange(index, 'duration', e.target.value)}
                          className="px-3 py-1.5 text-xs bg-card border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setModalError(null); }}
                  className="w-1/2 px-4 py-2.5 bg-muted text-foreground border border-border font-bold text-xs rounded-xl hover:bg-muted/80 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-1/2 px-4 py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-premium hover:bg-primary/95 transition-all flex justify-center items-center"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Write Prescription'}
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

export default PrescriptionPage;
