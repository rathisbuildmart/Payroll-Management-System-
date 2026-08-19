import React, { useState, useMemo } from 'react';
import { 
  ShieldAlert, ShieldCheck, Download, Printer, Search, Calendar, 
  Filter, FileText, ArrowRight, UserCheck, UserX, Clock, User, 
  Building, RefreshCw, CheckCircle2, XCircle, Sparkles, Check, ChevronLeft, ChevronRight
} from 'lucide-react';
import { AuditLog, AttendanceChangeRequest, Employee } from '../types';

interface AttendanceAuditReportTabProps {
  auditLogs: AuditLog[];
  changeRequests: AttendanceChangeRequest[];
  employees: Employee[];
  isAdminOrDirector: boolean;
  portalUser?: any;
}

export default function AttendanceAuditReportTab({
  auditLogs = [],
  changeRequests = [],
  employees = [],
  isAdminOrDirector,
  portalUser
}: AttendanceAuditReportTabProps) {
  // If not admin/director, show restricted screen
  if (!isAdminOrDirector) {
    return (
      <div className="bg-white dark:bg-[#11221b] rounded-2xl border border-slate-200 dark:border-[#1e3a2f] p-12 text-center max-w-2xl mx-auto my-8 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
          Restricted Administrator Access
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          The Master Attendance Modification & Audit History Report is confidential and strictly accessible only to company Directors and Super Administrators.
        </p>
      </div>
    );
  }

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedActionType, setSelectedActionType] = useState('All');
  const [selectedActorRole, setSelectedActorRole] = useState('All');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Combine audit logs and change requests into a unified comprehensive audit stream
  const unifiedHistory = useMemo(() => {
    const list: Array<{
      id: string;
      timestamp: string;
      date: string;
      employeeId: string;
      employeeName: string;
      department?: string;
      actorUsername: string;
      actorRole: string;
      actionType: 'create' | 'update' | 'approve' | 'reject' | 'direct_admin_edit';
      fieldChanged: string;
      oldValue: string;
      newValue: string;
      reason?: string;
      remarks?: string;
      reviewerName?: string;
      reviewerRole?: string;
    }> = [];

    // Add Audit Logs
    auditLogs.forEach(log => {
      // Filter out non-attendance logs if any
      const emp = employees.find(e => e.id === log.employeeId);
      list.push({
        id: log.id,
        timestamp: log.timestamp,
        date: log.date || '',
        employeeId: log.employeeId || '',
        employeeName: log.employeeName || (emp?.name || log.employeeId || 'Unknown'),
        department: emp?.department || '',
        actorUsername: log.actorUsername,
        actorRole: log.actorRole,
        actionType: (log.actionType as any) || 'update',
        fieldChanged: log.fieldChanged || 'Attendance Record',
        oldValue: log.oldValue || '—',
        newValue: log.newValue || '—',
        reason: (log as any).reason || 'Manual Update',
        remarks: log.remarks || ''
      });
    });

    // Add Change Requests
    changeRequests.forEach(req => {
      list.push({
        id: `req-${req.id}`,
        timestamp: req.requestedAt,
        date: req.attendanceDate,
        employeeId: req.employeeId,
        employeeName: req.employeeName,
        department: req.department || '',
        actorUsername: req.requestedByUsername,
        actorRole: req.requestedByRole,
        actionType: req.status === 'Approved' ? 'approve' : req.status === 'Rejected' ? 'reject' : 'update',
        fieldChanged: `Status & Timings (${req.status})`,
        oldValue: `${req.currentStatus} (${req.currentCheckIn || '—'} - ${req.currentCheckOut || '—'})`,
        newValue: `${req.requestedStatus} (${req.requestedCheckIn || '—'} - ${req.requestedCheckOut || '—'})`,
        reason: req.reason,
        remarks: req.remarks,
        reviewerName: req.reviewedBy,
        reviewerRole: req.reviewedByRole
      });
    });

    // Sort descending by timestamp
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [auditLogs, changeRequests, employees]);

  // Filtered History
  const filteredHistory = useMemo(() => {
    return unifiedHistory.filter(item => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch = !q ||
        item.employeeName.toLowerCase().includes(q) ||
        item.employeeId.toLowerCase().includes(q) ||
        item.actorUsername.toLowerCase().includes(q) ||
        (item.reason && item.reason.toLowerCase().includes(q)) ||
        (item.remarks && item.remarks.toLowerCase().includes(q)) ||
        item.date.includes(q);

      const matchesAction = selectedActionType === 'All' || item.actionType === selectedActionType;
      const matchesActor = selectedActorRole === 'All' || item.actorRole.toLowerCase().includes(selectedActorRole.toLowerCase());

      let matchesDate = true;
      if (fromDate) {
        matchesDate = matchesDate && (item.date >= fromDate || item.timestamp.slice(0, 10) >= fromDate);
      }
      if (toDate) {
        matchesDate = matchesDate && (item.date <= toDate || item.timestamp.slice(0, 10) <= toDate);
      }

      return matchesSearch && matchesAction && matchesActor && matchesDate;
    });
  }, [unifiedHistory, searchTerm, selectedActionType, selectedActorRole, fromDate, toDate]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / pageSize));
  const paginatedHistory = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredHistory.slice(start, start + pageSize);
  }, [filteredHistory, currentPage, pageSize]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredHistory.length === 0) {
      alert('No audit logs to export.');
      return;
    }

    const headers = [
      'Timestamp',
      'Attendance Date',
      'Employee ID',
      'Employee Name',
      'Department',
      'Action Performed By',
      'Role',
      'Action Type',
      'Field Changed',
      'Previous Value',
      'New Value',
      'Reason for Change',
      'Justification Remarks',
      'Reviewer'
    ];

    const rows = filteredHistory.map(item => [
      `"${new Date(item.timestamp).toLocaleString()}"`,
      `"${item.date}"`,
      `"${item.employeeId}"`,
      `"${item.employeeName}"`,
      `"${item.department || ''}"`,
      `"${item.actorUsername}"`,
      `"${item.actorRole}"`,
      `"${item.actionType}"`,
      `"${item.fieldChanged}"`,
      `"${item.oldValue}"`,
      `"${item.newValue}"`,
      `"${(item.reason || '').replace(/"/g, '""')}"`,
      `"${(item.remarks || '').replace(/"/g, '""')}"`,
      `"${item.reviewerName || ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Attendance_Audit_History_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  // Metrics
  const stats = useMemo(() => {
    return {
      totalLogs: unifiedHistory.length,
      updates: unifiedHistory.filter(h => h.actionType === 'update').length,
      approvals: unifiedHistory.filter(h => h.actionType === 'approve').length,
      rejections: unifiedHistory.filter(h => h.actionType === 'reject').length,
      creates: unifiedHistory.filter(h => h.actionType === 'create').length
    };
  }, [unifiedHistory]);

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header & Metrics */}
      <div className="bg-white dark:bg-[#11221b] p-6 rounded-2xl border border-slate-100 dark:border-[#1e3a2f] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Attendance Modification & Audit History (Admin Only)
              </h3>
              <span className="bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                Restricted Report
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Complete tamper-proof audit trail of all attendance edits, reasons, remarks, approvals, and administrator overrides.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-slate-100 dark:bg-[#0b1812] hover:bg-slate-200 border border-slate-200 dark:border-[#1e3a2f] text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-3xs"
            >
              <Download className="w-4 h-4 text-[#03623c]" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-[#03623c] hover:bg-[#024d2e] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-3xs"
            >
              <Printer className="w-4 h-4" />
              <span>Print Report</span>
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-5 border-t border-slate-100 dark:border-[#1e3a2f]">
          <div className="p-3 bg-slate-50 dark:bg-[#0c1a14] rounded-xl border border-slate-200/60 dark:border-[#1e3a2f]">
            <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">Total Trail Events</span>
            <div className="text-xl font-black text-slate-900 dark:text-slate-100 font-mono mt-0.5">{stats.totalLogs}</div>
          </div>
          <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-200/60 dark:border-indigo-900/40">
            <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase font-mono">Modifications</span>
            <div className="text-xl font-black text-indigo-900 dark:text-indigo-200 font-mono mt-0.5">{stats.updates}</div>
          </div>
          <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40">
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase font-mono">Approved Requests</span>
            <div className="text-xl font-black text-emerald-900 dark:text-emerald-200 font-mono mt-0.5">{stats.approvals}</div>
          </div>
          <div className="p-3 bg-rose-50/50 dark:bg-rose-950/20 rounded-xl border border-rose-200/60 dark:border-rose-900/40">
            <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase font-mono">Rejected Requests</span>
            <div className="text-xl font-black text-rose-900 dark:text-rose-200 font-mono mt-0.5">{stats.rejections}</div>
          </div>
          <div className="p-3 bg-teal-50/50 dark:bg-teal-950/20 rounded-xl border border-teal-200/60 dark:border-teal-900/40">
            <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400 uppercase font-mono">Initial Entries</span>
            <div className="text-xl font-black text-teal-900 dark:text-teal-200 font-mono mt-0.5">{stats.creates}</div>
          </div>
        </div>
      </div>

      {/* Filter and Query Strip */}
      <div className="bg-white dark:bg-[#11221b] p-4 rounded-2xl border border-slate-100 dark:border-[#1e3a2f] shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Employee, ID, Reason, Remarks, or Actor..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
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

          {/* Action Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">Action:</span>
            <select
              value={selectedActionType}
              onChange={(e) => { setSelectedActionType(e.target.value); setCurrentPage(1); }}
              className="bg-slate-50 dark:bg-[#0b1812] border border-slate-200 dark:border-[#1e3a2f] text-xs font-semibold text-slate-700 dark:text-slate-200 px-2.5 py-1.5 rounded-xl focus:outline-none cursor-pointer"
            >
              <option value="All">All Actions</option>
              <option value="update">Modifications</option>
              <option value="approve">Approved Requests</option>
              <option value="reject">Rejected Requests</option>
              <option value="create">Initial Daily Entries</option>
            </select>
          </div>

          {/* Date Range */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">Date:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setCurrentPage(1); }}
              className="bg-slate-50 dark:bg-[#0b1812] border border-slate-200 dark:border-[#1e3a2f] text-xs px-2 py-1 rounded-xl text-slate-700 dark:text-slate-200"
              title="From Date"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setCurrentPage(1); }}
              className="bg-slate-50 dark:bg-[#0b1812] border border-slate-200 dark:border-[#1e3a2f] text-xs px-2 py-1 rounded-xl text-slate-700 dark:text-slate-200"
              title="To Date"
            />
          </div>
        </div>

        <div className="text-xs font-mono text-slate-500 dark:text-slate-400 font-semibold">
          Showing {filteredHistory.length} logs
        </div>
      </div>

      {/* History Ledger Table */}
      <div className="bg-white dark:bg-[#11221b] rounded-2xl border border-slate-100 dark:border-[#1e3a2f] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#0c1a14] border-b border-slate-100 dark:border-[#1e3a2f] text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 min-w-[150px]">Date & Time</th>
                <th className="py-3.5 px-4 min-w-[180px]">Employee</th>
                <th className="py-3.5 px-4 min-w-[150px]">Actor / Role</th>
                <th className="py-3.5 px-4 min-w-[110px] text-center">Action</th>
                <th className="py-3.5 px-4 min-w-[240px]">Change Detail</th>
                <th className="py-3.5 px-4 min-w-[200px]">Reason & Justification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1e3a2f] text-xs">
              {paginatedHistory.length > 0 ? (
                paginatedHistory.map((item) => {
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-[#162e24] transition-colors">
                      
                      {/* Date & Time */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                          {item.date || new Date(item.timestamp).toISOString().slice(0, 10)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* Employee */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{item.employeeName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{item.employeeId} {item.department ? `• ${item.department}` : ''}</div>
                      </td>

                      {/* Actor */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{item.actorUsername}</div>
                        <div className="text-[10px] text-slate-400 uppercase font-mono">{item.actorRole}</div>
                      </td>

                      {/* Action Type */}
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide inline-flex items-center gap-1 ${
                          item.actionType === 'approve' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' :
                          item.actionType === 'reject' ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300' :
                          item.actionType === 'create' ? 'bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300' :
                          'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300'
                        }`}>
                          {item.actionType}
                        </span>
                      </td>

                      {/* Change Detail */}
                      <td className="py-3 px-4">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                          {item.fieldChanged}
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap font-mono text-[11px]">
                          <span className="line-through text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded">
                            {item.oldValue}
                          </span>
                          <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                            {item.newValue}
                          </span>
                        </div>
                      </td>

                      {/* Reason & Remarks */}
                      <td className="py-3 px-4">
                        {item.reason && (
                          <div className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">
                            {item.reason}
                          </div>
                        )}
                        {item.remarks && (
                          <div className="text-slate-600 dark:text-slate-400 italic text-[11px] mt-0.5">
                            "{item.remarks}"
                          </div>
                        )}
                        {item.reviewerName && (
                          <div className="text-[10px] text-slate-400 mt-1">
                            Reviewed by: <strong>{item.reviewerName}</strong>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    <FileText className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="font-semibold">No Audit Logs Found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">All attendance modifications and requests will be automatically recorded here.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 bg-slate-50/70 dark:bg-[#0c1a14] border-t border-slate-100 dark:border-[#1e3a2f] flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({filteredHistory.length} total entries)
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 text-xs font-semibold bg-white dark:bg-[#0b1812] border border-slate-200 dark:border-[#1e3a2f] rounded-lg disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1 text-xs font-semibold bg-white dark:bg-[#0b1812] border border-slate-200 dark:border-[#1e3a2f] rounded-lg disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
