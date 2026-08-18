import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Monitor, 
  ArrowUpRight, 
  TrendingUp, 
  Plus, 
  Search, 
  Star, 
  CheckCircle2, 
  Clock, 
  X, 
  Laptop, 
  Phone, 
  Car, 
  Key, 
  ShieldAlert, 
  RefreshCw,
  Building,
  UserCheck,
  Calendar,
  DollarSign
} from 'lucide-react';
import { PerformanceReview, CompanyAsset, TransferPromotionRecord, Employee } from '../types';

interface EmployeeLifecycleProps {
  employees: Employee[];
  language?: 'en' | 'hi';
}

export default function EmployeeLifecycleModule({ employees, language = 'en' }: EmployeeLifecycleProps) {
  const [activeTab, setActiveTab] = useState<'performance' | 'assets' | 'transfers'>('performance');

  //Performance Reviews
  const [reviews, setReviews] = useState<PerformanceReview[]>(() => {
    const saved = localStorage.getItem('payroll_performance_reviews');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(r => !['REV-001', 'REV-002'].includes(r.id));
        }
      } catch (e) { console.error(e); }
    }
    return [];
  });

  //Assets
  const [assets, setAssets] = useState<CompanyAsset[]>(() => {
    const saved = localStorage.getItem('payroll_company_assets');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(a => !['AST-001', 'AST-002', 'AST-003'].includes(a.id));
        }
      } catch (e) { console.error(e); }
    }
    return [];
  });

  //Transfers & Promotions
  const [transfers, setTransfers] = useState<TransferPromotionRecord[]>(() => {
    const saved = localStorage.getItem('payroll_transfers_promotions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(t => t.id !== 'TPR-001');
        }
      } catch (e) { console.error(e); }
    }
    return [];
  });

  //Save to local storage
  useEffect(() => { localStorage.setItem('payroll_performance_reviews', JSON.stringify(reviews)); }, [reviews]);
  useEffect(() => { localStorage.setItem('payroll_company_assets', JSON.stringify(assets)); }, [assets]);
  useEffect(() => { localStorage.setItem('payroll_transfers_promotions', JSON.stringify(transfers)); }, [transfers]);

  //Modal states
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');

  //Form states
  const [newReview, setNewReview] = useState<Partial<PerformanceReview>>({
    employeeId: '',
    reviewPeriod: 'Q1 2026-2027',
    rating: 4,
    keyAchievements: '',
    areasOfImprovement: '',
    goalsForNextPeriod: '',
    reviewerName: 'AdminHR',
    status: 'Approved'
  });

  const [newAsset, setNewAsset] = useState<Partial<CompanyAsset>>({
    assetTag: '',
    name: '',
    category: 'Laptop',
    serialNumber: '',
    assignedToEmployeeId: '',
    condition: 'New',
    status: 'Available',
    notes: ''
  });

  const [newTransfer, setNewTransfer] = useState<Partial<TransferPromotionRecord>>({
    employeeId: '',
    type: 'Promotion',
    currentDepartment: '',
    newDepartment: '',
    currentDesignation: '',
    newDesignation: '',
    currentSalary: 0,
    newSalary: 0,
    effectiveDate: new Date().toISOString().slice(0, 10),
    status: 'Pending',
    reason: ''
  });

  //Handlers
  const handleCreateReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.employeeId) return;
    const emp = employees.find(e => e.id === newReview.employeeId);
    const rev: PerformanceReview = {
      id: `REV-${String(reviews.length + 1).padStart(3, '0')}`,
      employeeId: newReview.employeeId || '',
      employeeName: emp ? emp.name : newReview.employeeId || '',
      department: emp ? emp.department : 'General',
      reviewPeriod: newReview.reviewPeriod || 'Q1 2026',
      rating: Number(newReview.rating) || 4,
      keyAchievements: newReview.keyAchievements || '',
      areasOfImprovement: newReview.areasOfImprovement || '',
      goalsForNextPeriod: newReview.goalsForNextPeriod || '',
      reviewerName: newReview.reviewerName || 'Admin',
      reviewDate: new Date().toISOString().slice(0, 10),
      status: (newReview.status as any) || 'Approved'
    };
    setReviews([rev, ...reviews]);
    setShowReviewModal(false);
  };

  const handleCreateAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAsset.name || !newAsset.assetTag) return;
    const emp = employees.find(e => e.id === newAsset.assignedToEmployeeId);
    const asset: CompanyAsset = {
      id: `AST-${String(assets.length + 1).padStart(3, '0')}`,
      assetTag: newAsset.assetTag || '',
      name: newAsset.name || '',
      category: (newAsset.category as any) || 'Laptop',
      serialNumber: newAsset.serialNumber || 'N/A',
      assignedToEmployeeId: newAsset.assignedToEmployeeId,
      assignedToEmployeeName: emp ? emp.name : undefined,
      assignedDate: newAsset.assignedToEmployeeId ? new Date().toISOString().slice(0, 10) : undefined,
      condition: (newAsset.condition as any) || 'Good',
      status: newAsset.assignedToEmployeeId ? 'Assigned' : 'Available',
      notes: newAsset.notes || ''
    };
    setAssets([asset, ...assets]);
    setShowAssetModal(false);
  };

  const handleCreateTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTransfer.employeeId) return;
    const emp = employees.find(e => e.id === newTransfer.employeeId);
    const tpr: TransferPromotionRecord = {
      id: `TPR-${String(transfers.length + 1).padStart(3, '0')}`,
      employeeId: newTransfer.employeeId || '',
      employeeName: emp ? emp.name : newTransfer.employeeId || '',
      type: (newTransfer.type as any) || 'Promotion',
      currentDepartment: emp ? emp.department : newTransfer.currentDepartment || '',
      newDepartment: newTransfer.newDepartment || emp?.department || '',
      currentDesignation: emp ? emp.designation : newTransfer.currentDesignation || '',
      newDesignation: newTransfer.newDesignation || emp?.designation || '',
      currentSalary: emp ? emp.basicSalary : Number(newTransfer.currentSalary) || 0,
      newSalary: Number(newTransfer.newSalary) || emp?.basicSalary || 0,
      effectiveDate: newTransfer.effectiveDate || new Date().toISOString().slice(0, 10),
      status: 'Approved',
      approvedBy: 'Admin',
      reason: newTransfer.reason || '',
      createdDate: new Date().toISOString().slice(0, 10)
    };
    setTransfers([tpr, ...transfers]);
    setShowTransferModal(false);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 w-full text-slate-800">
      {/* Banner */}
      <div className="bg-gradient-to-r from-[#022c22] via-[#064e3b] to-[#0f172a] border border-emerald-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/20 border border-emerald-400/30 rounded-2xl text-emerald-300">
              <TrendingUp className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-wide">
                {'Employee Lifecycle'}
              </h1>
              <p className="text-xs text-emerald-100/80 font-medium mt-0.5">
                {'Performance appraisals, company asset tracking, transfers & promotion records'}
              </p>
            </div>
          </div>

          <div className="flex bg-slate-950/60 backdrop-blur-md p-1.5 rounded-2xl border border-emerald-400/30">
            <button
              onClick={() => setActiveTab('performance')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'performance'
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Award className="w-4 h-4" />
              Performance
            </button>
            <button
              onClick={() => setActiveTab('assets')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'assets'
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Monitor className="w-4 h-4" />
              Assets
            </button>
            <button
              onClick={() => setActiveTab('transfers')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'transfers'
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              Transfer & Promotion
            </button>
          </div>
        </div>
      </div>

      {/* PERFORMANCE TAB */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 border border-slate-200 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">
                {'Performance Reviews'} ({reviews.length})
              </span>
            </div>
            <button
              onClick={() => setShowReviewModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#004d3d] hover:bg-[#064e3b] text-white text-xs font-bold rounded-xl transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              {'Add ReviewAppraisal'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map(rev => (
              <div key={rev.id} className="bg-white border border-slate-200 hover:border-emerald-500/50 rounded-2xl p-5 space-y-4 shadow-sm transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                      {rev.id}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{rev.employeeName}</h3>
                    <p className="text-xs text-slate-500">{rev.department} • Period: {rev.reviewPeriod}</p>
                  </div>
                  <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full text-amber-700 font-bold text-xs">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>{rev.rating}5</span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-2 text-xs">
                  <div>
                    <span className="text-slate-600 block font-bold mb-0.5">Key Achievements:</span>
                    <p className="text-slate-800">{rev.keyAchievements}</p>
                  </div>
                  <div>
                    <span className="text-slate-600 block font-bold mb-0.5">Goals for Next Period:</span>
                    <p className="text-emerald-800 font-medium">{rev.goalsForNextPeriod}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                  <span>Reviewer: {rev.reviewerName}</span>
                  <span>Date: {rev.reviewDate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ASSETS TAB */}
      {activeTab === 'assets' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 border border-slate-200 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">
                {'Company Asset Inventory'} ({assets.length})
              </span>
            </div>
            <button
              onClick={() => setShowAssetModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#004d3d] hover:bg-[#064e3b] text-white text-xs font-bold rounded-xl transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              {'Register New Asset'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {assets.map(ast => (
              <div key={ast.id} className="bg-white border border-slate-200 hover:border-emerald-500/50 rounded-2xl p-5 space-y-3 shadow-sm transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800">
                      {ast.category === 'Laptop' ? <Laptop className="w-5 h-5" /> : ast.category === 'Vehicle' ? <Car className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-emerald-800 font-bold">{ast.assetTag}</span>
                      <h3 className="text-sm font-bold text-slate-900">{ast.name}</h3>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    ast.status === 'Assigned' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {ast.status}
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">S/N:</span>
                    <span className="font-mono text-slate-800 font-bold">{ast.serialNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Assigned To:</span>
                    <span className="font-bold text-emerald-800">{ast.assignedToEmployeeName || 'Unassigned'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Condition:</span>
                    <span className="text-slate-800 font-medium">{ast.condition}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TRANSFERS & PROMOTIONS TAB */}
      {activeTab === 'transfers' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 border border-slate-200 rounded-2xl shadow-sm">
            <span className="text-xs font-bold text-slate-700">
              {'Transfers, Promotions & Salary Revisions'} ({transfers.length})
            </span>
            <button
              onClick={() => setShowTransferModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#004d3d] hover:bg-[#064e3b] text-white text-xs font-bold rounded-xl transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              {'Record TransferPromotion'}
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Employee</th>
                    <th className="p-3.5">Type</th>
                    <th className="p-3.5">Department</th>
                    <th className="p-3.5">Designation</th>
                    <th className="p-3.5">Salary Change</th>
                    <th className="p-3.5">Effective Date</th>
                    <th className="p-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transfers.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900">{t.employeeName}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded text-[10px] font-bold">
                          {t.type}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="text-slate-500">{t.currentDepartment}</span> → <span className="text-slate-900 font-bold">{t.newDepartment}</span>
                      </td>
                      <td className="p-3.5">
                        <span className="text-slate-500">{t.currentDesignation}</span> → <span className="text-slate-900 font-bold">{t.newDesignation}</span>
                      </td>
                      <td className="p-3.5 font-mono">
                        ₹{t.currentSalary.toLocaleString('en-IN')} → <span className="text-emerald-800 font-bold">₹{t.newSalary.toLocaleString('en-IN')}</span>
                      </td>
                      <td className="p-3.5 font-mono text-slate-500">{t.effectiveDate}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      {/* PERFORMANCE REVIEW MODAL */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Add Performance Review</h3>
              <button onClick={() => setShowReviewModal(false)}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
            </div>
            <form onSubmit={handleCreateReview} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-600 font-medium block mb-1">Select Employee</label>
                <select
                  required
                  value={newReview.employeeId}
                  onChange={e => setNewReview({ ...newReview, employeeId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                >
                  <option value="">Choose Employee...</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.id})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 font-medium block mb-1">Review Period</label>
                  <input
                    type="text"
                    value={newReview.reviewPeriod}
                    onChange={e => setNewReview({ ...newReview, reviewPeriod: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none" />
                </div>
                <div>
                  <label className="text-slate-600 font-medium block mb-1">Rating (1 to 5)</label>
                  <select
                    value={newReview.rating}
                    onChange={e => setNewReview({ ...newReview, rating: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                  >
                    <option value={5}>5 - Excellent</option>
                    <option value={4}>4 - Good</option>
                    <option value={3}>3 - Average</option>
                    <option value={2}>2 - Below Average</option>
                    <option value={1}>1 - Poor</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-slate-600 font-medium block mb-1">Key Achievements</label>
                <textarea
                  rows={2}
                  value={newReview.keyAchievements}
                  onChange={e => setNewReview({ ...newReview, keyAchievements: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none" />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-[#004d3d] hover:bg-[#064e3b] text-white font-bold rounded-xl shadow-md transition-all"
              >
                Save Review
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ASSET MODAL */}
      {showAssetModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Register Company Asset</h3>
              <button onClick={() => setShowAssetModal(false)}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
            </div>
            <form onSubmit={handleCreateAsset} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 font-medium block mb-1">Asset Tag</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AST-LAP-05"
                    value={newAsset.assetTag}
                    onChange={e => setNewAsset({ ...newAsset, assetTag: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none" />
                </div>
                <div>
                  <label className="text-slate-600 font-medium block mb-1">Category</label>
                  <select
                    value={newAsset.category}
                    onChange={e => setNewAsset({ ...newAsset, category: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="Laptop">Laptop</option>
                    <option value="Mobile Phone">Mobile Phone</option>
                    <option value="Vehicle">Vehicle</option>
                    <option value="ID CardKey">ID CardKey</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-slate-600 font-medium block mb-1">Asset Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dell Latitude Laptop"
                  value={newAsset.name}
                  onChange={e => setNewAsset({ ...newAsset, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none" />
              </div>
              <div>
                <label className="text-slate-600 font-medium block mb-1">Assign to Employee (Optional)</label>
                <select
                  value={newAsset.assignedToEmployeeId}
                  onChange={e => setNewAsset({ ...newAsset, assignedToEmployeeId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                >
                  <option value="">Keep Unassigned (In Inventory)</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.id})</option>)}
                </select>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-[#004d3d] hover:bg-[#064e3b] text-white font-bold rounded-xl shadow-md transition-all"
              >
                Register Asset
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TRANSFER MODAL */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Record TransferPromotion</h3>
              <button onClick={() => setShowTransferModal(false)}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
            </div>
            <form onSubmit={handleCreateTransfer} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-600 font-medium block mb-1">Select Employee</label>
                <select
                  required
                  value={newTransfer.employeeId}
                  onChange={e => {
                    const emp = employees.find(x => x.id === e.target.value);
                    setNewTransfer({
                      ...newTransfer,
                      employeeId: e.target.value,
                      currentDepartment: emp?.department || '',
                      currentDesignation: emp?.designation || '',
                      currentSalary: emp?.basicSalary || 0
                    });
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                >
                  <option value="">Choose Employee...</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.id})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 font-medium block mb-1">Type</label>
                  <select
                    value={newTransfer.type}
                    onChange={e => setNewTransfer({ ...newTransfer, type: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="Promotion">Promotion</option>
                    <option value="Transfer">Transfer</option>
                    <option value="Transfer & Promotion">Transfer & Promotion</option>
                    <option value="Salary Revision">Salary Revision</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-600 font-medium block mb-1">New Salary (₹)</label>
                  <input
                    type="number"
                    value={newTransfer.newSalary}
                    onChange={e => setNewTransfer({ ...newTransfer, newSalary: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 font-medium block mb-1">New Department</label>
                  <input
                    type="text"
                    value={newTransfer.newDepartment}
                    onChange={e => setNewTransfer({ ...newTransfer, newDepartment: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none" />
                </div>
                <div>
                  <label className="text-slate-600 font-medium block mb-1">New Designation</label>
                  <input
                    type="text"
                    value={newTransfer.newDesignation}
                    onChange={e => setNewTransfer({ ...newTransfer, newDesignation: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none" />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-[#004d3d] hover:bg-[#064e3b] text-white font-bold rounded-xl shadow-md transition-all"
              >
                Record TransferPromotion
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
