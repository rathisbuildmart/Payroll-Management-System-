import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, XCircle, Clock, Search, Filter, AlertCircle, ShieldCheck, 
  ArrowRight, UserCheck, UserX, Calendar, Building, Check, X, MessageSquare, 
  Sparkles, RefreshCw, FileText, Send, CheckCheck, Download, Printer
} from 'lucide-react';
import { AttendanceChangeRequest, Attendance, Employee, AdminSettings } from '../types';
import MonthlyApprovalReportModal from './MonthlyApprovalReportModal';

interface AttendanceChangeRequestsTabProps {
  changeRequests: AttendanceChangeRequest[];
  employees: Employee[];
  attendanceRecords: Attendance[];
  portalUser?: any;
  isAdminOrDirector: boolean;
  adminSettings?: AdminSettings;
  onApproveRequest: (request: AttendanceChangeRequest, reviewerRemarks?: string) => Promise<void>;
  onRejectRequest: (request: AttendanceChangeRequest, reviewerRemarks?: string) => Promise<void>;
  onBulkApprove?: (requestIds: string[]) => Promise<void>;
}

export default function AttendanceChangeRequestsTab({
  changeRequests,
  employees,
  attendanceRecords,
  portalUser,
  isAdminOrDirector,
  adminSettings,
  onApproveRequest,
  onRejectRequest,
  onBulkApprove
}: AttendanceChangeRequestsTabProps) {
  const [filterStatus, setFilterStatus] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('Pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [rejectModalReq, setRejectModalReq] = useState<AttendanceChangeRequest | null>(null);
  const [rejectionRemarks, setRejectionRemarks] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [monthlyModalOpen, setMonthlyModalOpen] = useState(false);

  // Extract distinct available months from changeRequests
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    changeRequests.forEach(r => {
      if (r.attendanceDate && r.attendanceDate.length >= 7) {
        set.add(r.attendanceDate.substring(0, 7));
      } else if (r.requestedAt && r.requestedAt.length >= 7) {
        set.add(r.requestedAt.substring(0, 7));
      }
    });
    // Add current month if empty
    const currentM = new Date().toISOString().substring(0, 7);
    set.add(currentM);
    return ['All', ...Array.from(set).sort().reverse()];
  }, [changeRequests]);

  // Departments list for filtering
  const departments = useMemo(() => {
    const set = new Set<string>();
    changeRequests.forEach(r => {
      if (r.department) set.add(r.department);
    });
    return ['All', ...Array.from(set)];
  }, [changeRequests]);

  // Counts
  const counts = useMemo(() => {
    const pending = changeRequests.filter(r => r.status === 'Pending').length;
    const approved = changeRequests.filter(r => r.status === 'Approved').length;
    const rejected = changeRequests.filter(r => r.status === 'Rejected').length;
    return { pending, approved, rejected, all: changeRequests.length };
  }, [changeRequests]);

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return changeRequests
      .filter(req => {
        const matchesStatus = filterStatus === 'All' || req.status === filterStatus;
        const matchesDept = selectedDept === 'All' || req.department === selectedDept;
        const matchesMonth = selectedMonth === 'All' || 
          (req.attendanceDate && req.attendanceDate.startsWith(selectedMonth)) ||
          (req.requestedAt && req.requestedAt.startsWith(selectedMonth));

        const q = searchTerm.toLowerCase().trim();
        const matchesSearch = !q || 
          req.employeeName.toLowerCase().includes(q) ||
          req.employeeId.toLowerCase().includes(q) ||
          req.reason.toLowerCase().includes(q) ||
          req.remarks.toLowerCase().includes(q) ||
          req.requestedByName.toLowerCase().includes(q) ||
          req.attendanceDate.includes(q);

        return matchesStatus && matchesDept && matchesMonth && matchesSearch;
      })
      .sort((a, b) => {
        // Pending first, then newest
        if (a.status === 'Pending' && b.status !== 'Pending') return -1;
        if (a.status !== 'Pending' && b.status === 'Pending') return 1;
        return new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime();
      });
  }, [changeRequests, filterStatus, selectedDept, selectedMonth, searchTerm]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllPending = () => {
    const pendingIds = filteredRequests.filter(r => r.status === 'Pending').map(r => r.id);
    if (selectedIds.length === pendingIds.length && pendingIds.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingIds);
    }
  };

  const handleSingleApprove = async (req: AttendanceChangeRequest) => {
    setProcessingId(req.id);
    try {
      await onApproveRequest(req);
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectModalReq) return;
    setProcessingId(rejectModalReq.id);
    try {
      await onRejectRequest(rejectModalReq, rejectionRemarks.trim() || 'Rejected by reviewer');
      setRejectModalReq(null);
      setRejectionRemarks('');
    } finally {
      setProcessingId(null);
    }
  };

  const handleExecuteBulkApprove = async () => {
    if (selectedIds.length === 0 || !onBulkApprove) return;
    if (!window.confirm(`Are you sure you want to approve ${selectedIds.length} attendance change requests?`)) {
      return;
    }
    setIsBulkProcessing(true);
    try {
      await onBulkApprove(selectedIds);
      setSelectedIds([]);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Top Banner with Monthly Report Trigger */}
      <div className="bg-gradient-to-r from-slate-900 via-[#03623c] to-slate-900 p-5 rounded-2xl text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{'Monthly Signable Approval Report'}</span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-white">
            {'Attendance Approval Requests & Director Verification'}
          </h3>
          <p className="text-xs text-emerald-100/80 max-w-2xl">
            {'Generate month-wise consolidated reports for all employees, review pending approval requests, download signable PDFs with HR & Director signature blocks, or export to Excel.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setMonthlyModalOpen(true)}
          className="bg-emerald-400 hover:bg-emerald-300 text-slate-950 px-4 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer shrink-0"
        >
          <FileText className="w-4 h-4 text-slate-950" />
          <span>{'Open Monthly Report & PDF'}</span>
          <Download className="w-3.5 h-3.5 ml-1 text-slate-900" />
        </button>
      </div>

      {/* Stats & Quick Filter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <button
          onClick={() => setFilterStatus('Pending')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            filterStatus === 'Pending'
              ? 'bg-amber-500/10 dark:bg-amber-950/40 border-amber-400 dark:border-amber-700 shadow-xs'
              : 'bg-white dark:bg-[#11221b] border-slate-100 dark:border-[#1e3a2f] hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-300">Pending Review</span>
            <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
            {counts.pending}
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Awaiting Admin/Director</p>
        </button>

        <button
          onClick={() => setFilterStatus('Approved')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            filterStatus === 'Approved'
              ? 'bg-emerald-500/10 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700 shadow-xs'
              : 'bg-white dark:bg-[#11221b] border-slate-100 dark:border-[#1e3a2f] hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Approved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
            {counts.approved}
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Applied to registers</p>
        </button>

        <button
          onClick={() => setFilterStatus('Rejected')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            filterStatus === 'Rejected'
              ? 'bg-rose-500/10 dark:bg-rose-950/40 border-rose-400 dark:border-rose-700 shadow-xs'
              : 'bg-white dark:bg-[#11221b] border-slate-100 dark:border-[#1e3a2f] hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-700 dark:text-rose-300">Rejected</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
            {counts.rejected}
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Declined changes</p>
        </button>

        <button
          onClick={() => setFilterStatus('All')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            filterStatus === 'All'
              ? 'bg-indigo-500/10 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-700 shadow-xs'
              : 'bg-white dark:bg-[#11221b] border-slate-100 dark:border-[#1e3a2f] hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">All Logs</span>
            <FileText className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
            {counts.all}
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Total requests tracked</p>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#11221b] p-4 rounded-2xl border border-slate-100 dark:border-[#1e3a2f] shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Employee, ID, Submitter, or Reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-[#0b1812] border border-slate-200 dark:border-[#1e3a2f] rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#03623c]"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Month Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">Month:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-slate-50 dark:bg-[#0b1812] border border-slate-200 dark:border-[#1e3a2f] text-xs font-semibold text-slate-700 dark:text-slate-200 px-2.5 py-1.5 rounded-xl focus:outline-none cursor-pointer font-mono"
            >
              {availableMonths.map(m => (
                <option key={m} value={m} className="dark:bg-[#11221b]">
                  {m === 'All' ? 'All Months' : m}
                </option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">Dept:</span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-slate-50 dark:bg-[#0b1812] border border-slate-200 dark:border-[#1e3a2f] text-xs font-semibold text-slate-700 dark:text-slate-200 px-2.5 py-1.5 rounded-xl focus:outline-none cursor-pointer"
            >
              {departments.map(d => (
                <option key={d} value={d} className="dark:bg-[#11221b]">{d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons: Bulk Approve + Monthly Report Trigger */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMonthlyModalOpen(true)}
            className="px-3.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-[#03623c] dark:text-emerald-300 text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1.5 hover:bg-emerald-100 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Monthly PDF Report</span>
          </button>

          {isAdminOrDirector && counts.pending > 0 && (
            <div className="flex items-center gap-2">
              {selectedIds.length > 0 && (
                <button
                  onClick={handleExecuteBulkApprove}
                  disabled={isBulkProcessing}
                  className="px-4 py-1.5 bg-[#03623c] hover:bg-[#024d2e] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Approve Selected ({selectedIds.length})</span>
                </button>
              )}
              <button
                onClick={handleSelectAllPending}
                className="px-3 py-1.5 bg-slate-100 dark:bg-[#0b1812] hover:bg-slate-200 border border-slate-200 dark:border-[#1e3a2f] text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                {selectedIds.length === filteredRequests.filter(r => r.status === 'Pending').length && selectedIds.length > 0
                  ? 'Deselect All'
                  : 'Select All Pending'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-3">
        {filteredRequests.length > 0 ? (
          filteredRequests.map((req) => {
            const isPending = req.status === 'Pending';
            const isApproved = req.status === 'Approved';
            const isRejected = req.status === 'Rejected';
            const isSelected = selectedIds.includes(req.id);
            const isProcessing = processingId === req.id;

            return (
              <div 
                key={req.id}
                className={`bg-white dark:bg-[#11221b] rounded-2xl border transition-all p-5 shadow-xs ${
                  isPending 
                    ? 'border-amber-200/80 dark:border-amber-900/60 bg-amber-50/10' 
                    : isApproved
                    ? 'border-slate-200 dark:border-[#1e3a2f]'
                    : 'border-rose-100 dark:border-rose-950/40 bg-rose-50/10'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  
                  {/* Left Column: Employee & Date Info */}
                  <div className="flex items-start gap-3.5">
                    {isAdminOrDirector && isPending && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(req.id)}
                        className="w-4 h-4 mt-1 rounded text-[#03623c] focus:ring-[#03623c] cursor-pointer"
                      />
                    )}

                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#0b1812] border border-slate-200 dark:border-[#1e3a2f] text-[#03623c] dark:text-emerald-400 font-extrabold flex items-center justify-center text-sm shrink-0">
                      {req.employeeName.charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                          {req.employeeName}
                        </h4>
                        <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md font-semibold">
                          {req.employeeId}
                        </span>
                        {req.department && (
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                            • {req.department}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1 font-mono font-bold text-slate-700 dark:text-slate-300">
                          <Calendar className="w-3.5 h-3.5 text-[#03623c] dark:text-emerald-400" />
                          <span>Work Date: {req.attendanceDate}</span>
                        </div>
                        <span>•</span>
                        <span>
                          Requested by: <strong className="text-slate-700 dark:text-slate-300">{req.requestedByName}</strong> ({req.requestedByRole})
                        </span>
                        <span>•</span>
                        <span className="text-[11px]">{new Date(req.requestedAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Status Badge & Actions */}
                  <div className="flex items-center gap-2.5 self-end lg:self-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 ${
                      isPending 
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200' 
                        : isApproved 
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200' 
                        : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200'
                    }`}>
                      {isPending && <Clock className="w-3.5 h-3.5 animate-spin" />}
                      {isApproved && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {isRejected && <XCircle className="w-3.5 h-3.5" />}
                      <span>{req.status}</span>
                    </span>

                    {/* Action buttons for Admin / Director */}
                    {isAdminOrDirector && isPending && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSingleApprove(req)}
                          disabled={isProcessing}
                          className="px-3 py-1.5 bg-[#03623c] hover:bg-[#024d2e] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setRejectModalReq(req)}
                          disabled={isProcessing}
                          className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Change Details Comparison Box */}
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-[#1e3a2f] grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50/60 dark:bg-[#0c1a14]/60 p-3.5 rounded-xl">
                  
                  {/* Current vs Requested Values Visual Diff */}
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {'Modification Requested:'}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <div className="flex items-center gap-1 bg-white dark:bg-[#0b1812] px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#1e3a2f]">
                        <span className="text-slate-400">Status:</span>
                        <span className="line-through text-rose-600 font-semibold">{req.currentStatus}</span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">{req.requestedStatus}</span>
                      </div>

                      {(req.requestedCheckIn || req.requestedCheckOut) && (
                        <div className="flex items-center gap-1 bg-white dark:bg-[#0b1812] px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#1e3a2f] font-mono">
                          <span className="text-slate-400 font-sans">Time:</span>
                          <span className="text-slate-500">{req.currentCheckIn || '—'} - {req.currentCheckOut || '—'}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400 font-sans" />
                          <span className="text-[#03623c] dark:text-emerald-400 font-bold">{req.requestedCheckIn || '—'} - {req.requestedCheckOut || '—'}</span>
                        </div>
                      )}

                      {req.requestedOvertimeHours > 0 && (
                        <div className="flex items-center gap-1 bg-white dark:bg-[#0b1812] px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#1e3a2f]">
                          <span className="text-slate-400">OT:</span>
                          <span className="font-bold text-indigo-600">{req.requestedOvertimeHours} hrs</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Reason & Remarks */}
                  <div className="space-y-1">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {'Reason & Remarks:'}
                    </div>
                    <div className="text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {req.reason}
                      </span>
                      <p className="text-slate-600 dark:text-slate-400 italic text-[11px] mt-0.5 bg-white/80 dark:bg-[#0b1812] p-1.5 rounded-lg border border-slate-150 dark:border-[#1e3a2f]">
                        "{req.remarks}"
                      </p>
                    </div>
                  </div>
                </div>

                {/* Reviewer Note (if approved or rejected) */}
                {req.reviewedBy && (
                  <div className="mt-2.5 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                    <span>
                      Reviewed by: <strong className="text-slate-700 dark:text-slate-300">{req.reviewedBy}</strong> ({req.reviewedByRole || 'Admin'}) {req.reviewedAt && `on ${new Date(req.reviewedAt).toLocaleString()}`}
                    </span>
                    {req.reviewerRemarks && (
                      <span className="italic text-slate-600 dark:text-slate-300">
                        Reviewer note: "{req.reviewerRemarks}"
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-16 bg-white dark:bg-[#11221b] rounded-2xl border border-slate-100 dark:border-[#1e3a2f] text-slate-400">
            <CheckCircle2 className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">No Attendance Change Requests Found</h4>
            <p className="text-xs text-slate-400 mt-1">
              {filterStatus === 'Pending' 
                ? 'All attendance change requests have been processed and approved.'
                : 'No records matching the selected filters.'}
            </p>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModalReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-[#11221b] border border-slate-200 dark:border-[#1e3a2f] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">Reject Attendance Request</h4>
                <p className="text-xs text-slate-500">{rejectModalReq.employeeName} ({rejectModalReq.attendanceDate})</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Reason for Rejection:
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Discrepancy in biometric logs, manual verification failed..."
                value={rejectionRemarks}
                onChange={(e) => setRejectionRemarks(e.target.value)}
                className="w-full border border-slate-200 dark:border-[#1e3a2f] rounded-xl p-3 text-xs bg-white dark:bg-[#0b1812] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setRejectModalReq(null); setRejectionRemarks(''); }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={processingId === rejectModalReq.id}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Approval Report & Signable PDF Modal */}
      <MonthlyApprovalReportModal
        isOpen={monthlyModalOpen}
        onClose={() => setMonthlyModalOpen(false)}
        changeRequests={changeRequests}
        attendanceRecords={attendanceRecords}
        employees={employees}
        adminSettings={adminSettings}
        portalUser={portalUser}
        isAdminOrDirector={isAdminOrDirector}
        onApproveRequest={onApproveRequest}
        onRejectRequest={onRejectRequest}
        onBulkApprove={onBulkApprove}
        initialMonth={selectedMonth !== 'All' ? selectedMonth : undefined}
      />

    </div>
  );
}
