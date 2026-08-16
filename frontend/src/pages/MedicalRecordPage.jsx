import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuthStore } from '../store/useAuthStore';
import { 
  FileText, 
  Search, 
  Plus, 
  Trash2, 
  User, 
  Activity, 
  PlusCircle, 
  Calendar, 
  ArrowLeftRight, 
  Printer, 
  X, 
  Loader2, 
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import api from '../services/api';
import { getDoctorName } from '../utils/doctorHelper';


function MedicalRecordPage() {
  const { user } = useAuthStore();
  const [records, setRecords] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Selected record for detailed profile overlay
  const [selectedRecord, setSelectedRecord] = useState(null);
  
  // Create EMR modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    appointmentId: '',
    diagnosis: '',
    symptoms: '',
    notes: ''
  });
  const [modalError, setModalError] = useState(null);

  // Searching / filtering
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Set query parameters based on role
      let queryParams = {};
      if (user?.role === 'PATIENT') {
        queryParams.patientId = user.patientProfileId;
      } else if (user?.role === 'DOCTOR') {
        queryParams.doctorId = user.doctorProfileId;
      }

      const recordsRes = await api.get('/medical-records', { params: queryParams });
      setRecords(recordsRes.data.records || []);

      // If user is DOCTOR or ADMIN, fetch patient profiles and pending appointments for EMR creation
      if (['ADMIN', 'DOCTOR'].includes(user?.role)) {
        const patientsRes = await api.get('/patients');
        setPatients(patientsRes.data.patients || []);
        
        // Fetch appointments to link (status scheduled or confirmed)
        const apptsRes = await api.get('/appointments');
        const pendingAppts = (apptsRes.data.appointments || []).filter(
          a => ['SCHEDULED', 'CONFIRMED'].includes(a.status) && 
          (user.role === 'ADMIN' || a.doctorId === user.doctorProfileId)
        );
        setAppointments(pendingAppts);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch medical record indexes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRecord = async (e) => {
    e.preventDefault();
    setModalError(null);
    setActionLoading(true);

    try {
      const payload = {
        patientId: formData.patientId,
        doctorId: user?.role === 'DOCTOR' ? user.doctorProfileId : undefined, // If admin, select a doctor, or backend resolves
        appointmentId: formData.appointmentId || undefined,
        diagnosis: formData.diagnosis.trim(),
        symptoms: formData.symptoms.trim(),
        notes: formData.notes.trim()
      };

      if (!payload.patientId) throw new Error('Please select a patient profile.');
      if (!payload.diagnosis) throw new Error('Please enter diagnosis text.');
      if (!payload.symptoms) throw new Error('Please enter symptoms list.');

      // If Admin, we need to assign a doctor profile. We can query the first doctor or let the backend assign
      if (user?.role === 'ADMIN') {
        const doctorsRes = await api.get('/doctors');
        const docs = doctorsRes.data.doctors || [];
        if (docs.length === 0) throw new Error('No clinical doctor profiles exist to assign.');
        payload.doctorId = docs[0].id; // Assign to first doctor as backup
      }

      await api.post('/medical-records', payload);
      
      setIsModalOpen(false);
      // Reset form
      setFormData({
        patientId: '',
        appointmentId: '',
        diagnosis: '',
        symptoms: '',
        notes: ''
      });
      
      fetchInitialData();
    } catch (err) {
      console.error(err);
      setModalError(err.response?.data?.message || err.message || 'Failed to construct EMR record.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (recordId) => {
    if (!window.confirm('Are you sure you want to permanently delete this EMR record?')) return;
    try {
      setActionLoading(true);
      await api.delete(`/medical-records/${recordId}`);
      if (selectedRecord?.id === recordId) setSelectedRecord(null);
      fetchInitialData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete record.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrint = (record) => {
    const printWindow = window.open('', '_blank');
    const docName = getDoctorName(record.doctor);

    const calculateAge = (dobString) => {
      if (!dobString) return 'N/A';
      const dob = new Date(dobString);
      const diffMs = Date.now() - dob.getTime();
      const ageDate = new Date(diffMs);
      return Math.abs(ageDate.getUTCFullYear() - 1970);
    };

    const patientAge = calculateAge(record.patient?.dateOfBirth);
    const dateFormatted = new Date(record.createdAt).toLocaleDateString('en-EG', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });

    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>EMR Clinical Summary MR-${record.id.substring(0, 8).toUpperCase()}</title>
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

            /* EMR Body Section */
            .emr-body {
              margin-bottom: 40px;
              position: relative;
            }
            .section-title {
              font-family: 'Lora', serif;
              font-size: 14px;
              font-weight: 700;
              color: #0e8ce4;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 6px;
              margin: 20px 0 10px 0;
            }
            .content-box {
              background-color: #f8fafc;
              border: 1px solid #e2e8f0;
              padding: 15px;
              border-radius: 10px;
              font-size: 13px;
              color: #334155;
              white-space: pre-wrap;
              font-weight: 500;
              line-height: 1.6;
            }
            .diagnosis-box {
              background-color: #eff6ff;
              border: 1px solid #bfdbfe;
              color: #1e40af;
              font-weight: 700;
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
                <h3 class="doctor-name">${docName}</h3>
                <p class="doctor-spec">${record.doctor?.specialty || 'General Practitioner'}</p>
                <p class="doctor-license">Lic No: EGY-MR-4A2D${record.doctor?.id?.substring(0, 4).toUpperCase()}</p>
              </div>
            </div>

            <!-- Patient Meta Bar -->
            <div class="patient-bar">
              <div class="patient-bar-item">
                <span class="patient-bar-label">Patient Name</span>
                <span class="patient-bar-value" title="${record.patient?.firstName} ${record.patient?.lastName}">${record.patient?.firstName} ${record.patient?.lastName}</span>
              </div>
              <div class="patient-bar-item">
                <span class="patient-bar-label">Age / Gender</span>
                <span class="patient-bar-value">${patientAge} Yrs / ${record.patient?.gender}</span>
              </div>
              <div class="patient-bar-item">
                <span class="patient-bar-label">Blood Group</span>
                <span class="patient-bar-value">${record.patient?.bloodType || 'N/A'}</span>
              </div>
              <div class="patient-bar-item">
                <span class="patient-bar-label">Audit Date</span>
                <span class="patient-bar-value">${dateFormatted}</span>
              </div>
            </div>

            <!-- EMR Body Section -->
            <div class="emr-body">
              <div class="section-title">Presented Symptoms & Presentation</div>
              <div class="content-box">${record.symptoms}</div>

              <div class="section-title">Clinical Diagnosis & Assessment</div>
              <div class="content-box diagnosis-box">${record.diagnosis}</div>

              <div class="section-title">Progression Notes & Observations</div>
              <div class="content-box">${record.notes || 'No special clinical notes recorded.'}</div>

              ${record.prescriptions && record.prescriptions.length > 0 ? `
                <div class="section-title">Linked Drug Prescriptions</div>
                <div class="content-box">
                  ${record.prescriptions.map(p => 
                    p.medicines.map(m => `• <strong>${m.name} (${m.dosage})</strong> - ${m.frequency} for ${m.duration}`).join('<br>')
                  ).join('<br><br>')}
                </div>
              ` : ''}
            </div>

            <!-- Footer Section -->
            <div class="footer-section">
              <div class="disclaimer-container">
                <p class="disclaimer">
                  This Electronic Medical Record (EMR) document is a secure system output generated from CareSync HMS clinical data systems.
                  Any alterations void validity instantly. Confidential medical document.
                </p>
                <span class="dispense-note">Record Reference: MR-${record.id.toUpperCase()}</span>
              </div>
              
              <div class="signature-container">
                <!-- Rotated stamp checkmark seal -->
                <svg class="verified-stamp" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#0e8ce4" stroke-width="4" stroke-dasharray="4 2" />
                  <path d="M30 50 L45 65 L70 35" fill="none" stroke="#0e8ce4" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />
                  <text font-family="'Inter', sans-serif" font-size="8" font-weight="800" fill="#0e8ce4" letter-spacing="0.1em">
                    <textPath href="#circlePath" startOffset="50%">AUDITED RECORD</textPath>
                  </text>
                  <path id="circlePath" d="M 17,50 A 33,33 0 1,1 83,50" fill="none" />
                </svg>
                
                <p class="sig-doctor">${docName}</p>
                <div class="sig-line">Consultant Signature</div>
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

  // Filter records by query
  const filteredRecords = records.filter((rec) => {
    const q = searchQuery.toLowerCase();
    const patientName = `${rec.patient?.firstName} ${rec.patient?.lastName}`.toLowerCase();
    const diagnosis = rec.diagnosis.toLowerCase();
    return patientName.includes(q) || diagnosis.includes(q) || rec.id.toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <div className="h-[70vh] flex flex-col justify-center items-center space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground font-semibold">Loading EMR Clinical Registry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">EMR Patient Records</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Access secure Electronic Medical Records (EMRs), clinical progress sheets, and diagnoses.
          </p>
        </div>

        {['ADMIN', 'DOCTOR'].includes(user?.role) && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-premium hover:bg-primary/95 transition-all"
          >
            <Plus className="w-4.5 h-4.5" />
            <span>Create Patient EMR</span>
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
        
        {/* Left Side: EMR List Panel */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Search bar */}
          <div className="bg-card border border-border rounded-2xl shadow-premium p-3 flex items-center space-x-3">
            <Search className="w-4 h-4 text-muted-foreground ml-2 shrink-0" />
            <input 
              type="text"
              placeholder="Search EMR by diagnosis or patient..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-0 text-xs text-foreground focus:outline-none focus:ring-0"
            />
          </div>

          {/* List display */}
          <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
            {filteredRecords.length === 0 ? (
              <div className="bg-card border border-border rounded-2xl shadow-premium p-12 text-center flex flex-col items-center justify-center space-y-3">
                <FileText className="w-12 h-12 text-muted-foreground/60" />
                <h3 className="text-base font-bold">No EMR Logs Found</h3>
                <p className="text-xs text-muted-foreground max-w-xs">
                  No patient clinical records match your filters or user role.
                </p>
              </div>
            ) : (
              filteredRecords.map((rec) => (
                <div 
                  key={rec.id}
                  onClick={() => setSelectedRecord(rec)}
                  className={`bg-card border rounded-2xl shadow-premium p-5 hover:shadow-premium-hover hover:border-primary/45 transition-all duration-200 cursor-pointer relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                    selectedRecord?.id === rec.id ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-primary/10 text-primary rounded-lg shrink-0">
                        <Activity className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase">MR-${rec.id.substring(0, 8).toUpperCase()}</span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-foreground">
                        {rec.patient?.firstName} {rec.patient?.lastName}
                      </h4>
                      <p className="text-xs font-semibold text-primary">
                        Assessment: {rec.diagnosis}
                      </p>
                    </div>

                    <div className="flex items-center space-x-4 text-[10px] text-muted-foreground font-semibold">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{new Date(rec.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span>{getDoctorName(rec.doctor)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handlePrint(rec); }}
                      className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    {user?.role === 'ADMIN' && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(rec.id); }}
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

        {/* Right Side: Detailed Profile overlay panel */}
        <div className="lg:col-span-5">
          {selectedRecord ? (
            <div className="bg-card border border-border rounded-2xl shadow-premium p-6 space-y-6 animate-fade-in position-sticky top-20">
              
              {/* Profile Card Header */}
              <div className="flex justify-between items-start border-b border-border pb-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase bg-primary/10 text-primary border border-primary/20 rounded">
                      EMR Details
                    </span>
                    <span className="text-[10px] text-muted-foreground font-semibold">Ref: MR-${selectedRecord.id.substring(0, 8).toUpperCase()}</span>
                  </div>
                  <h3 className="text-base font-black text-foreground">{selectedRecord.patient?.firstName} {selectedRecord.patient?.lastName}</h3>
                  <p className="text-xs text-muted-foreground">Registered Phone: {selectedRecord.patient?.phoneNumber || 'N/A'}</p>
                </div>
                <button 
                  onClick={() => handlePrint(selectedRecord)}
                  className="flex items-center space-x-1 px-3 py-1.5 border border-primary/20 bg-primary/5 text-primary text-[10px] font-bold tracking-wide uppercase rounded-xl hover:bg-primary/10"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Summary</span>
                </button>
              </div>

              {/* Patient Meta Fields */}
              <div className="grid grid-cols-3 gap-4 py-1 text-center bg-muted/20 border border-border/60 rounded-xl">
                <div>
                  <p className="text-[9px] text-muted-foreground font-bold uppercase">Gender</p>
                  <p className="text-xs font-bold text-foreground mt-0.5">{selectedRecord.patient?.gender}</p>
                </div>
                <div className="border-x border-border">
                  <p className="text-[9px] text-muted-foreground font-bold uppercase">Blood Group</p>
                  <p className="text-xs font-bold text-foreground mt-0.5">{selectedRecord.patient?.bloodType || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-[9px] text-muted-foreground font-bold uppercase">Age</p>
                  <p className="text-xs font-bold text-foreground mt-0.5">
                    {new Date().getFullYear() - new Date(selectedRecord.patient?.dateOfBirth).getFullYear()} Yrs
                  </p>
                </div>
              </div>

              {/* Diagnosis Box */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Clinical Diagnosis</h5>
                <div className="p-3.5 bg-blue-500/5 border border-blue-500/10 rounded-xl text-xs font-bold text-primary leading-relaxed">
                  {selectedRecord.diagnosis}
                </div>
              </div>

              {/* Symptoms Box */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Presented Symptoms</h5>
                <div className="p-3.5 bg-muted/40 border border-border/80 rounded-xl text-xs text-foreground/80 leading-relaxed font-semibold">
                  {selectedRecord.symptoms}
                </div>
              </div>

              {/* Clinical Notes Box */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Progression Notes & Observations</h5>
                <div className="p-3.5 bg-muted/40 border border-border/80 rounded-xl text-xs text-muted-foreground leading-relaxed font-medium whitespace-pre-wrap">
                  {selectedRecord.notes || 'No special observational clinical notes logged.'}
                </div>
              </div>

              {/* Linked Prescriptions Box */}
              {selectedRecord.prescriptions && selectedRecord.prescriptions.length > 0 && (
                <div className="space-y-2 border-t border-border pt-4">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center space-x-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-primary" />
                    <span>Linked Prescriptions</span>
                  </h5>
                  <div className="space-y-2">
                    {selectedRecord.prescriptions.map((pr) => (
                      <div key={pr.id} className="p-3.5 bg-primary/5 border border-primary/10 rounded-xl space-y-2">
                        <div className="flex justify-between items-center text-[10px] text-muted-foreground font-bold">
                          <span>Prescription Ref: RX-${pr.id.substring(0, 6).toUpperCase()}</span>
                          <span>{new Date(pr.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="divide-y divide-border/40 text-xs">
                          {pr.medicines?.map((med) => (
                            <div key={med.id} className="py-2.5 flex justify-between items-start gap-2">
                              <div>
                                <p className="font-extrabold text-foreground">{med.name} ({med.dosage})</p>
                                <p className="text-[10px] text-muted-foreground font-semibold">Frequency: {med.frequency}</p>
                              </div>
                              <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-[9px] font-bold tracking-wider uppercase shrink-0">
                                {med.duration}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Consulting Specialist Details */}
              <div className="pt-4 border-t border-border flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                  D
                </div>
                <div>
                  <p className="text-xs font-extrabold">{getDoctorName(selectedRecord.doctor)}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{selectedRecord.doctor?.specialty || 'General Practitioner'}</p>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl shadow-premium p-12 text-center flex flex-col items-center justify-center space-y-3 h-full min-h-[300px]">
              <FileText className="w-12 h-12 text-muted-foreground/40" />
              <h4 className="text-sm font-bold text-muted-foreground">No Patient EMR Selected</h4>
              <p className="text-xs text-muted-foreground max-w-xs leading-normal">
                Click on any clinical record card in the list to reveal EMR diagnostic data, progression notes, and drug treatments.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Create Patient EMR Modal Overlay */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md flex justify-center items-center p-4">
          <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/10">
              <h3 className="text-base font-extrabold flex items-center space-x-2">
                <PlusCircle className="w-5 h-5 text-primary" />
                <span>Log Patient Clinical Record (EMR)</span>
              </h3>
              <button 
                onClick={() => { setIsModalOpen(false); setModalError(null); }}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleCreateRecord} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {modalError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center space-x-2 text-red-500 text-xs font-semibold">
                  <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Patient select */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Patient Profile</label>
                <select
                  required
                  value={formData.patientId}
                  onChange={(e) => setFormData(prev => ({ ...prev, patientId: e.target.value, appointmentId: '' }))}
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

              {/* Active appointments list to link */}
              {formData.patientId && (
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Link Scheduled Appointment (Optional)</label>
                  <select
                    value={formData.appointmentId}
                    onChange={(e) => setFormData(prev => ({ ...prev, appointmentId: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
                  >
                    <option value="">-- Do Not Link Appointment --</option>
                    {appointments
                      .filter(a => a.patientId === formData.patientId)
                      .map((appt) => (
                        <option key={appt.id} value={appt.id}>
                          {new Date(appt.dateTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })} - {appt.reason.substring(0, 25)}...
                        </option>
                      ))}
                  </select>
                  <span className="text-[9px] text-muted-foreground block leading-tight mt-1">
                    * Linking an appointment will automatically update its status to "Completed" on submission.
                  </span>
                </div>
              )}

              {/* Symptoms Input */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Presented Symptoms</label>
                <input 
                  type="text"
                  required
                  placeholder="E.g. Persistent fever, vomiting, muscle fatigue..."
                  value={formData.symptoms}
                  onChange={(e) => setFormData(prev => ({ ...prev, symptoms: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Diagnosis Input */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Diagnostic Assessment</label>
                <input 
                  type="text"
                  required
                  placeholder="E.g. Acute Viral Bronchitis, Hypertension Stage I..."
                  value={formData.diagnosis}
                  onChange={(e) => setFormData(prev => ({ ...prev, diagnosis: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Progression/Observational notes */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Progressive EMR Notes</label>
                <textarea
                  rows="4"
                  placeholder="Clinical observation records, recommendations, and progression instructions..."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              {/* Buttons */}
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
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create EMR Record'}
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

export default MedicalRecordPage;
