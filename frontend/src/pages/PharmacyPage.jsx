import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuthStore } from '../store/useAuthStore';
import axios from 'axios';
import { Pill, Plus, Search, AlertTriangle, CheckCircle, Package, Printer, X } from 'lucide-react';
import OfficialStampSeal from '../components/OfficialStampSeal';

export default function PharmacyPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'prescriptions'
  const [inventory, setInventory] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  
  // Add item modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: 'Antibiotics',
    stockQuantity: 100,
    unitPrice: 25.0,
    minThreshold: 20,
    supplier: 'EIPICO Pharma'
  });

  useEffect(() => {
    fetchPharmacyData();
  }, []);

  const fetchPharmacyData = async () => {
    setIsLoading(true);
    try {
      const [invRes, rxRes] = await Promise.all([
        axios.get('/api/v1/pharmacy/inventory'),
        axios.get('/api/v1/pharmacy/prescriptions')
      ]);
      setInventory(invRes.data.data || []);
      setPrescriptions(rxRes.data.data || []);
    } catch (err) {
      console.error("Error fetching pharmacy data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateInventory = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/v1/pharmacy/inventory', formData);
      setIsAddModalOpen(false);
      setFormData({
        name: '',
        code: '',
        category: 'Antibiotics',
        stockQuantity: 100,
        unitPrice: 25.0,
        minThreshold: 20,
        supplier: ''
      });
      fetchPharmacyData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add inventory item.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canManage = ['ADMIN', 'PHARMACIST'].includes(user?.role);

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Pill className="w-8 h-8 text-primary" />
            Pharmacy & Medication Inventory
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage pharmaceutical stock, track thresholds, and process clinical prescription dispensations.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold px-4 py-2.5 rounded-lg shadow-sm hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            <span>Add Medicine</span>
          </button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border space-x-6">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'inventory'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Medicine Inventory ({inventory.length})
        </button>
        <button
          onClick={() => setActiveTab('prescriptions')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'prescriptions'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Prescription Dispensations ({prescriptions.length})
        </button>
      </div>

      {/* Main Content Area */}
      {activeTab === 'inventory' ? (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search medicine name, code, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Table */}
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Medicine Name</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">In Stock</th>
                    <th className="px-4 py-3">Unit Price</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Supplier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading ? (
                    <tr>
                      <td colSpan="7" className="text-center py-8 text-muted-foreground">Loading pharmacy inventory...</td>
                    </tr>
                  ) : filteredInventory.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-8 text-muted-foreground">No inventory items found.</td>
                    </tr>
                  ) : (
                    filteredInventory.map((item) => {
                      const isLowStock = item.stockQuantity <= item.minThreshold;
                      return (
                        <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs font-semibold">{item.code}</td>
                          <td className="px-4 py-3 font-medium text-foreground">{item.name}</td>
                          <td className="px-4 py-3 text-muted-foreground">{item.category}</td>
                          <td className="px-4 py-3 font-bold">{item.stockQuantity} units</td>
                          <td className="px-4 py-3 text-emerald-600 font-semibold">${item.unitPrice.toFixed(2)}</td>
                          <td className="px-4 py-3">
                            {isLowStock ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-500/10 text-red-500">
                                <AlertTriangle className="w-3 h-3" /> Low Stock
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">
                                <CheckCircle className="w-3 h-3" /> In Stock
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{item.supplier || 'Standard Supplier'}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {prescriptions.map((rx) => (
            <div key={rx.id} className="bg-card rounded-xl border border-border p-5 shadow-sm space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-base text-foreground">
                    Patient: {rx.patient?.firstName} {rx.patient?.lastName}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Doctor: {rx.doctor?.contactInfo || 'Physician'} • {new Date(rx.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedPrescription(rx)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  View & Print Voucher
                </button>
              </div>

              <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Prescribed Medicines</div>
                <div className="space-y-1">
                  {rx.medicines?.map((m) => (
                    <div key={m.id} className="text-xs flex justify-between">
                      <span className="font-semibold text-foreground">• {m.name} ({m.dosage})</span>
                      <span className="text-muted-foreground">{m.frequency} - {m.duration}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Print Prescription Modal */}
      {selectedPrescription && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 shadow-2xl space-y-6 relative border border-border">
            {/* Modal Controls */}
            <div className="flex items-center justify-between no-print pb-3 border-b border-border">
              <h3 className="font-bold text-lg">Official Pharmacy Dispensation Slip</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-primary text-primary-foreground font-semibold text-sm rounded-lg flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" /> Print Document
                </button>
                <button
                  onClick={() => setSelectedPrescription(null)}
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
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">HMS CENTRAL PHARMACY</h2>
                  <p className="text-xs text-slate-500">Official Clinical Medication Dispensation Voucher</p>
                </div>
                <div className="text-right text-xs text-slate-500 font-mono">
                  <div>Voucher #: PH-2026-{selectedPrescription.id.slice(0, 6).toUpperCase()}</div>
                  <div>Date: {new Date(selectedPrescription.createdAt).toLocaleDateString()}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="font-bold text-slate-500 uppercase">Patient Name:</span>
                  <div className="font-bold text-slate-800 text-sm">{selectedPrescription.patient?.firstName} {selectedPrescription.patient?.lastName}</div>
                </div>
                <div>
                  <span className="font-bold text-slate-500 uppercase">Prescribing Doctor:</span>
                  <div className="font-bold text-slate-800 text-sm">{selectedPrescription.doctor?.contactInfo || 'Clinical Consultant'}</div>
                </div>
              </div>

              <div>
                <table className="w-full text-left text-xs border border-slate-200 divide-y divide-slate-200">
                  <thead className="bg-slate-100 font-bold uppercase text-slate-700">
                    <tr>
                      <th className="p-2">Item Description</th>
                      <th className="p-2">Dosage</th>
                      <th className="p-2">Frequency</th>
                      <th className="p-2">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedPrescription.medicines?.map((med) => (
                      <tr key={med.id}>
                        <td className="p-2 font-bold">{med.name}</td>
                        <td className="p-2">{med.dosage}</td>
                        <td className="p-2">{med.frequency}</td>
                        <td className="p-2">{med.duration}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Official Stamp & Seal Component */}
              <OfficialStampSeal 
                doctorName={selectedPrescription.doctor?.contactInfo || "Dr. Youssef Nabil"}
                roleTitle="Chief Clinical Pharmacist & Dispensing Lead"
                docRef={`RX-STAMP-${selectedPrescription.id.slice(0, 8)}`}
              />
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Add Inventory Modal */}
      {isAddModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 border border-border">
            <h3 className="font-bold text-lg">Add New Medicine to Stock</h3>
            <form onSubmit={handleCreateInventory} className="space-y-3">
              <div>
                <label className="text-xs font-semibold">Medicine Name</label>
                <input
                  type="text"
                  required
                  placeholder="E.g. Amoxicillin 500mg"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full p-2 bg-card border border-border rounded-lg text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold">Code</label>
                  <input
                    type="text"
                    required
                    placeholder="MED-101"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    className="w-full p-2 bg-card border border-border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold">Category</label>
                  <input
                    type="text"
                    required
                    placeholder="Antibiotics"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full p-2 bg-card border border-border rounded-lg text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold">Stock Quantity</label>
                  <input
                    type="number"
                    required
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({...formData, stockQuantity: e.target.value})}
                    className="w-full p-2 bg-card border border-border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold">Unit Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({...formData, unitPrice: e.target.value})}
                    className="w-full p-2 bg-card border border-border rounded-lg text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold">Supplier Name</label>
                <input
                  type="text"
                  placeholder="E.g. EIPICO Pharmaceuticals"
                  value={formData.supplier}
                  onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                  className="w-full p-2 bg-card border border-border rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground font-semibold text-sm rounded-lg"
                >
                  Save Item
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
