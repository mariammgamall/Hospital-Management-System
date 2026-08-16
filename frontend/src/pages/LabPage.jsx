import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuthStore } from '../store/useAuthStore';
import axios from 'axios';
import { FlaskConical, Plus, Search, CheckCircle, Clock, Printer, X, FileText } from 'lucide-react';
import OfficialStampSeal from '../components/OfficialStampSeal';

export default function LabPage() {
  const { user } = useAuthStore();
  const [labTests, setLabTests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTest, setSelectedTest] = useState(null);
  
  // Update result modal
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [activeTestToUpdate, setActiveTestToUpdate] = useState(null);
  const [resultForm, setResultForm] = useState({
    result: '',
    referenceRange: '70 - 99 mg/dL',
    unit: 'mg/dL',
    notes: 'Normal physiological range.',
    status: 'COMPLETED'
  });

  // Create test order modal
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderForm, setOrderForm] = useState({
    patientId: '',
    patientName: '',
    testName: 'Complete Blood Count (CBC)',
    category: 'Hematology',
    referenceRange: 'Hb: 12.0 - 15.5 g/dL',
    unit: 'g/dL',
    notes: 'Urgent diagnostic screening'
  });

  useEffect(() => {
    fetchLabTests();
  }, []);

  const fetchLabTests = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get('/api/v1/lab/tests');
      setLabTests(res.data.data || []);
    } catch (err) {
      console.error("Error fetching lab tests:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateResult = async (e) => {
    e.preventDefault();
    if (!activeTestToUpdate) return;
    try {
      await axios.patch(`/api/v1/lab/tests/${activeTestToUpdate.id}`, {
        ...resultForm,
        technicianName: user?.email || 'Sherif Hossam'
      });
      setIsUpdateModalOpen(false);
      setActiveTestToUpdate(null);
      fetchLabTests();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update lab test result.");
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/v1/lab/tests', orderForm);
      setIsOrderModalOpen(false);
      setOrderForm({
        patientId: '',
        patientName: '',
        testName: 'Complete Blood Count (CBC)',
        category: 'Hematology',
        referenceRange: 'Hb: 12.0 - 15.5 g/dL',
        unit: 'g/dL',
        notes: ''
      });
      fetchLabTests();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create lab test order.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredTests = labTests.filter(t =>
    t.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.testName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isTechOrAdmin = ['ADMIN', 'LAB_TECHNICIAN'].includes(user?.role);
  const isDoctorOrAdmin = ['ADMIN', 'DOCTOR'].includes(user?.role);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <FlaskConical className="w-8 h-8 text-primary" />
            Clinical Diagnostics & Laboratory
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Order diagnostic tests, record pathology findings, and issue official stamped lab reports.
          </p>
        </div>

        {isDoctorOrAdmin && (
          <button
            onClick={() => setIsOrderModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold px-4 py-2.5 rounded-lg shadow-sm hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            <span>Order Lab Test</span>
          </button>
        )}
      </div>

      {/* Filter and Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search patient, test name, or category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Lab Test Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          <div className="col-span-2 text-center py-12 text-muted-foreground">Loading diagnostic tests...</div>
        ) : filteredTests.length === 0 ? (
          <div className="col-span-2 text-center py-12 text-muted-foreground">No laboratory test orders found.</div>
        ) : (
          filteredTests.map((test) => {
            const isCompleted = test.status === 'COMPLETED';
            return (
              <div key={test.id} className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">
                      {test.category}
                    </span>
                    <h3 className="font-bold text-base text-foreground mt-1">{test.testName}</h3>
                    <p className="text-xs text-muted-foreground">Patient: <span className="font-semibold text-foreground">{test.patientName}</span></p>
                  </div>
                  {isCompleted ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500">
                      <CheckCircle className="w-3.5 h-3.5" /> Completed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500">
                      <Clock className="w-3.5 h-3.5" /> Pending
                    </span>
                  )}
                </div>

                <div className="bg-muted/30 p-3 rounded-lg text-xs space-y-1">
                  <div><span className="font-bold text-muted-foreground">Doctor:</span> {test.doctorName || 'Clinical Physician'}</div>
                  {isCompleted ? (
                    <div><span className="font-bold text-muted-foreground">Result:</span> <span className="font-mono font-bold text-emerald-600">{test.result}</span></div>
                  ) : (
                    <div><span className="font-bold text-muted-foreground">Status:</span> Awaiting Laboratory Draw & Analysis</div>
                  )}
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-border">
                  {isTechOrAdmin && !isCompleted && (
                    <button
                      onClick={() => {
                        setActiveTestToUpdate(test);
                        setResultForm({
                          result: test.result || '',
                          referenceRange: test.referenceRange || '70 - 99 mg/dL',
                          unit: test.unit || 'mg/dL',
                          notes: test.notes || 'Parameters analyzed successfully.',
                          status: 'COMPLETED'
                        });
                        setIsUpdateModalOpen(true);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:opacity-90 transition-opacity"
                    >
                      Enter Findings
                    </button>
                  )}
                  {isCompleted && (
                    <button
                      onClick={() => setSelectedTest(test)}
                      className="px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground rounded-lg inline-flex items-center gap-1 hover:opacity-90 transition-opacity"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print Stamped Report
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Official Stamped Lab Report Modal */}
      {selectedTest && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 shadow-2xl space-y-6 relative border border-border">
            <div className="flex items-center justify-between no-print pb-3 border-b border-border">
              <h3 className="font-bold text-lg">Certified Stamped Laboratory Diagnostic Report</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-primary text-primary-foreground font-semibold text-sm rounded-lg flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" /> Print Report
                </button>
                <button
                  onClick={() => setSelectedTest(null)}
                  className="p-2 hover:bg-muted rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Print Container (Locked to single-page A4) */}
            <div className="p-6 bg-white text-slate-900 rounded-xl border border-slate-200 shadow-inner space-y-4 max-h-[270mm] overflow-hidden printable-area">
              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">HMS CLINICAL PATHOLOGY LAB</h2>
                  <p className="text-xs text-slate-500">Official Diagnostic Analysis & Certified Lab Findings</p>
                </div>
                <div className="text-right text-xs text-slate-500 font-mono">
                  <div>Report #: LAB-2026-{selectedTest.id.slice(0, 6).toUpperCase()}</div>
                  <div>Date: {new Date(selectedTest.createdAt).toLocaleDateString()}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="font-bold text-slate-500 uppercase">Patient Name:</span>
                  <div className="font-bold text-slate-800 text-sm">{selectedTest.patientName}</div>
                </div>
                <div>
                  <span className="font-bold text-slate-500 uppercase">Ordering Doctor:</span>
                  <div className="font-bold text-slate-800 text-sm">{selectedTest.doctorName || 'Clinical Physician'}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">Test Details & Clinical Results</div>
                <table className="w-full text-left text-xs border border-slate-200 divide-y divide-slate-200">
                  <thead className="bg-slate-100 font-bold uppercase text-slate-700">
                    <tr>
                      <th className="p-2">Test Name</th>
                      <th className="p-2">Observed Findings / Result</th>
                      <th className="p-2">Reference Range</th>
                      <th className="p-2">Units</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2 font-bold">{selectedTest.testName} ({selectedTest.category})</td>
                      <td className="p-2 font-mono font-bold text-emerald-800">{selectedTest.result}</td>
                      <td className="p-2">{selectedTest.referenceRange || 'N/A'}</td>
                      <td className="p-2">{selectedTest.unit || 'N/A'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {selectedTest.notes && (
                <div className="text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-700">Pathology Technician Remarks:</span>
                  <p className="text-slate-600 mt-0.5">{selectedTest.notes}</p>
                </div>
              )}

              {/* Official Stamp & Seal Component */}
              <OfficialStampSeal 
                doctorName={selectedTest.technicianName || "Sherif Hossam"}
                roleTitle="Senior Laboratory Technician & Pathology Specialist"
                docRef={`LAB-STAMP-${selectedTest.id.slice(0, 8)}`}
              />
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Enter Result Modal */}
      {isUpdateModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 border border-border">
            <h3 className="font-bold text-lg">Enter Lab Test Results</h3>
            <form onSubmit={handleUpdateResult} className="space-y-3">
              <div>
                <label className="text-xs font-semibold">Test Findings / Numerical Result</label>
                <textarea
                  required
                  rows="3"
                  placeholder="E.g. Hb: 13.5 g/dL, WBC: 6.5 x10^3/uL..."
                  value={resultForm.result}
                  onChange={(e) => setResultForm({...resultForm, result: e.target.value})}
                  className="w-full p-2 bg-card border border-border rounded-lg text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold">Reference Range</label>
                  <input
                    type="text"
                    value={resultForm.referenceRange}
                    onChange={(e) => setResultForm({...resultForm, referenceRange: e.target.value})}
                    className="w-full p-2 bg-card border border-border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold">Unit</label>
                  <input
                    type="text"
                    value={resultForm.unit}
                    onChange={(e) => setResultForm({...resultForm, unit: e.target.value})}
                    className="w-full p-2 bg-card border border-border rounded-lg text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold">Technician Clinical Notes</label>
                <input
                  type="text"
                  value={resultForm.notes}
                  onChange={(e) => setResultForm({...resultForm, notes: e.target.value})}
                  className="w-full p-2 bg-card border border-border rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsUpdateModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white font-semibold text-sm rounded-lg"
                >
                  Save & Validate Report
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Order Test Modal */}
      {isOrderModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 border border-border">
            <h3 className="font-bold text-lg">Order New Laboratory Diagnostic</h3>
            <form onSubmit={handleCreateOrder} className="space-y-3">
              <div>
                <label className="text-xs font-semibold">Patient Name</label>
                <input
                  type="text"
                  required
                  placeholder="Mariam Gamal"
                  value={orderForm.patientName}
                  onChange={(e) => setOrderForm({...orderForm, patientName: e.target.value})}
                  className="w-full p-2 bg-card border border-border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold">Test Name</label>
                <input
                  type="text"
                  required
                  placeholder="Complete Blood Count (CBC)"
                  value={orderForm.testName}
                  onChange={(e) => setOrderForm({...orderForm, testName: e.target.value})}
                  className="w-full p-2 bg-card border border-border rounded-lg text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold">Category</label>
                  <input
                    type="text"
                    required
                    placeholder="Hematology"
                    value={orderForm.category}
                    onChange={(e) => setOrderForm({...orderForm, category: e.target.value})}
                    className="w-full p-2 bg-card border border-border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold">Unit</label>
                  <input
                    type="text"
                    placeholder="g/dL"
                    value={orderForm.unit}
                    onChange={(e) => setOrderForm({...orderForm, unit: e.target.value})}
                    className="w-full p-2 bg-card border border-border rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsOrderModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground font-semibold text-sm rounded-lg"
                >
                  Submit Order
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
