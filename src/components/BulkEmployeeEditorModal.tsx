import React, { useState, useMemo } from 'react';
import { 
  X, Check, DollarSign, Percent, TrendingUp, Filter, Search, 
  Building, UserCheck, AlertCircle, Sparkles, Sliders, RefreshCw, 
  ArrowRight, ShieldCheck, CheckSquare, Square, FileSpreadsheet, Download
} from 'lucide-react';
import { Employee, AdminSettings, SalaryIncrement, getCurrentBasicSalary } from '../types';

interface BulkEmployeeEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  onSaveBulkUpdates: (updatedEmployees: Employee[]) => Promise<void>;
  adminSettings: AdminSettings;
  language?: 'en' | 'hi';
}

export default function BulkEmployeeEditorModal({
  isOpen,
  onClose,
  employees,
  onSaveBulkUpdates,
  adminSettings,
  language = 'en'
}: BulkEmployeeEditorModalProps) {
  // Local working copy of employees for editable state
  const [draftEmployees, setDraftEmployees] = useState<Employee[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('ALL');
  const [filterBranch, setFilterBranch] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ACTIVE');

  // Batch Operation Form States
  const [activeBatchAction, setActiveBatchAction] = useState<'salary_pct' | 'salary_flat' | 'department' | 'branch' | 'shift' | 'designation' | null>(null);
  const [batchPercent, setBatchPercent] = useState<number>(10);
  const [batchFlatAmount, setBatchFlatAmount] = useState<number>(2000);
  const [batchDepartment, setBatchDepartment] = useState<string>('');
  const [batchBranch, setBatchBranch] = useState<string>('');
  const [batchShift, setBatchShift] = useState<string>('');
  const [batchDesignation, setBatchDesignation] = useState<string>('');
  const [batchIncrementRemarks, setBatchIncrementRemarks] = useState<string>('Annual Appraisal / Bulk Revision');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Initialize draft employees when modal opens
  React.useEffect(() => {
    if (isOpen) {
      // Deep clone to allow safe rollbacks/edits
      const clone = employees.map(emp => ({ ...emp }));
      setDraftEmployees(clone);
      // Default select all active
      const activeIds = new Set(clone.filter(e => e.isActive !== false).map(e => e.id));
      setSelectedIds(activeIds);
      setSaveSuccessMessage(null);
    }
  }, [isOpen, employees]);

  // Unique departments and branches for filters
  const departments = useMemo(() => {
    const set = new Set<string>();
    employees.forEach(e => { if (e.department) set.add(e.department); });
    return Array.from(set).sort();
  }, [employees]);

  const branches = useMemo(() => {
    const set = new Set<string>();
    employees.forEach(e => { if (e.branch) set.add(e.branch); });
    return Array.from(set).sort();
  }, [employees]);

  // Filtered employees in the view
  const visibleEmployees = useMemo(() => {
    return draftEmployees.filter(emp => {
      if (filterStatus === 'ACTIVE' && emp.isActive === false) return false;
      if (filterStatus === 'INACTIVE' && emp.isActive !== false) return false;
      if (filterDepartment !== 'ALL' && emp.department !== filterDepartment) return false;
      if (filterBranch !== 'ALL' && emp.branch !== filterBranch) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = emp.id?.toLowerCase().includes(q);
        const matchesName = emp.name?.toLowerCase().includes(q);
        const matchesRole = emp.designation?.toLowerCase().includes(q);
        return matchesId || matchesName || matchesRole;
      }
      return true;
    });
  }, [draftEmployees, filterStatus, filterDepartment, filterBranch, searchQuery]);

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllVisible = () => {
    const next = new Set(selectedIds);
    visibleEmployees.forEach(emp => next.add(emp.id));
    setSelectedIds(next);
  };

  const handleDeselectAllVisible = () => {
    const next = new Set(selectedIds);
    visibleEmployees.forEach(emp => next.delete(emp.id));
    setSelectedIds(next);
  };

  // Inline Cell Update Handler
  const handleCellChange = (id: string, field: keyof Employee, value: any) => {
    setDraftEmployees(prev => prev.map(emp => {
      if (emp.id === id) {
        return { ...emp, [field]: value };
      }
      return emp;
    }));
  };

  // Mass Actions Execution
  const handleApplyPercentageIncrement = () => {
    if (batchPercent === 0 || selectedIds.size === 0) return;
    const factor = 1 + (batchPercent / 100);

    setDraftEmployees(prev => prev.map(emp => {
      if (selectedIds.has(emp.id)) {
        const currentSalary = emp.basicSalary || 0;
        const newSalary = Math.round(currentSalary * factor);
        return {
          ...emp,
          basicSalary: newSalary
        };
      }
      return emp;
    }));
    setActiveBatchAction(null);
  };

  const handleApplyFlatIncrement = () => {
    if (batchFlatAmount === 0 || selectedIds.size === 0) return;

    setDraftEmployees(prev => prev.map(emp => {
      if (selectedIds.has(emp.id)) {
        const currentSalary = emp.basicSalary || 0;
        const newSalary = Math.max(0, currentSalary + batchFlatAmount);
        return {
          ...emp,
          basicSalary: newSalary
        };
      }
      return emp;
    }));
    setActiveBatchAction(null);
  };

  const handleApplyBatchDepartment = () => {
    if (!batchDepartment.trim() || selectedIds.size === 0) return;
    setDraftEmployees(prev => prev.map(emp => {
      if (selectedIds.has(emp.id)) {
        return { ...emp, department: batchDepartment.trim() };
      }
      return emp;
    }));
    setActiveBatchAction(null);
  };

  const handleApplyBatchBranch = () => {
    if (!batchBranch.trim() || selectedIds.size === 0) return;
    setDraftEmployees(prev => prev.map(emp => {
      if (selectedIds.has(emp.id)) {
        return { ...emp, branch: batchBranch.trim() };
      }
      return emp;
    }));
    setActiveBatchAction(null);
  };

  const handleApplyBatchShift = () => {
    if (!batchShift.trim() || selectedIds.size === 0) return;
    setDraftEmployees(prev => prev.map(emp => {
      if (selectedIds.has(emp.id)) {
        return { ...emp, workTiming: batchShift.trim() };
      }
      return emp;
    }));
    setActiveBatchAction(null);
  };

  const handleApplyBatchDesignation = () => {
    if (!batchDesignation.trim() || selectedIds.size === 0) return;
    setDraftEmployees(prev => prev.map(emp => {
      if (selectedIds.has(emp.id)) {
        return { ...emp, designation: batchDesignation.trim() };
      }
      return emp;
    }));
    setActiveBatchAction(null);
  };

  // Calculate modified count and stats
  const modifiedEmployees = useMemo(() => {
    const list: { original: Employee; updated: Employee; isSalaryChanged: boolean }[] = [];
    const origMap = new Map(employees.map(e => [e.id, e]));

    draftEmployees.forEach(draft => {
      const orig = origMap.get(draft.id);
      if (!orig) return;

      const isSalaryChanged = orig.basicSalary !== draft.basicSalary;
      const isDeptChanged = orig.department !== draft.department;
      const isRoleChanged = orig.designation !== draft.designation;
      const isBranchChanged = orig.branch !== draft.branch;
      const isShiftChanged = orig.workTiming !== draft.workTiming;
      const isAllowancesChanged = orig.allowances !== draft.allowances;

      if (isSalaryChanged || isDeptChanged || isRoleChanged || isBranchChanged || isShiftChanged || isAllowancesChanged) {
        list.push({ original: orig, updated: draft, isSalaryChanged });
      }
    });

    return list;
  }, [employees, draftEmployees]);

  // Payroll Impact Metrics
  const originalTotalPayroll = useMemo(() => {
    return employees.filter(e => e.isActive !== false).reduce((sum, e) => sum + (e.basicSalary || 0), 0);
  }, [employees]);

  const draftTotalPayroll = useMemo(() => {
    return draftEmployees.filter(e => e.isActive !== false).reduce((sum, e) => sum + (e.basicSalary || 0), 0);
  }, [draftEmployees]);

  const payrollDifference = draftTotalPayroll - originalTotalPayroll;
  const payrollPctChange = originalTotalPayroll > 0 ? ((payrollDifference / originalTotalPayroll) * 100).toFixed(1) : '0';

  // Export current draft table to CSV
  const handleExportDraftCSV = () => {
    const headers = ['Employee ID', 'Full Name', 'Department', 'Designation', 'Branch', 'Basic Salary (Monthly)', 'Allowances', 'Work Timing / Shift', 'Status'];
    const rows = draftEmployees.map(e => [
      `"${e.id}"`,
      `"${e.name}"`,
      `"${e.department || ''}"`,
      `"${e.designation || ''}"`,
      `"${e.branch || ''}"`,
      e.basicSalary || 0,
      e.allowances || 0,
      `"${e.workTiming || ''}"`,
      `"${e.isActive !== false ? 'Active' : 'Inactive'}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Bulk_Employee_Data_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Commit and Save to main database / Google Sheets
  const handleSaveAll = async () => {
    if (modifiedEmployees.length === 0) {
      onClose();
      return;
    }

    setIsSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      // Final employees array with salary increment records attached
      const finalEmployees = draftEmployees.map(draft => {
        const orig = employees.find(e => e.id === draft.id);
        if (!orig) return draft;

        // If salary increased/changed, add to salary increment history
        if (orig.basicSalary !== draft.basicSalary && draft.basicSalary > 0) {
          const currentIncList: SalaryIncrement[] = Array.isArray(draft.increments) ? [...draft.increments] : [];
          const newInc: SalaryIncrement = {
            id: String(Date.now() + Math.floor(Math.random() * 1000)),
            date: today,
            amount: draft.basicSalary - (orig.basicSalary || 0),
            previousSalary: orig.basicSalary || 0,
            newSalary: draft.basicSalary,
            remarks: batchIncrementRemarks || 'Bulk Salary Revision'
          };
          return {
            ...draft,
            increments: [newInc, ...currentIncList]
          };
        }
        return draft;
      });

      await onSaveBulkUpdates(finalEmployees);
      setSaveSuccessMessage(`Successfully updated ${modifiedEmployees.length} employee records!`);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      alert(`Failed to save bulk updates: ${err?.message || err}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0c1913] rounded-2xl border border-gray-200 dark:border-[#1e3a2f] shadow-2xl max-w-7xl w-full flex flex-col max-h-[95vh] overflow-hidden">
        
        {/* Top Header */}
        <div className="px-5 py-3.5 border-b border-gray-100 dark:border-[#1e3a2f] flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight">
                  {language === 'hi' ? 'कर्मचारी बल्क अपडेट व सैलरी रिवीज़न' : 'Bulk Employee & Salary Revision Hub'}
                </h3>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-[10px] font-extrabold uppercase">
                  Live Batch Editor
                </span>
              </div>
              <p className="text-xs text-gray-300">
                {language === 'hi'
                  ? 'सैलरी, पद, विभाग या ब्रांच को एक साथ अपडेट करें और तुरंत शीट में सेव करें।'
                  : 'Mass update salaries, designations, departments, branches, and shifts with 1-click batch tools.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportDraftCSV}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
              title="Export Current Table View to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Real-time Payroll Impact Banner */}
        <div className="px-5 py-2.5 bg-emerald-50/80 dark:bg-[#11271e] border-b border-emerald-200/60 dark:border-[#1e3a2f] flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 text-emerald-950 dark:text-emerald-300 font-bold">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Total Active Basic Payroll:</span>
              <span className="font-mono text-sm font-black text-slate-900 dark:text-white">
                ₹{draftTotalPayroll.toLocaleString('en-IN')}
              </span>
            </div>

            {payrollDifference !== 0 && (
              <div className={`px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 text-[11px] ${
                payrollDifference > 0 
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300' 
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300'
              }`}>
                <span>{payrollDifference > 0 ? '▲' : '▼'}</span>
                <span>₹{Math.abs(payrollDifference).toLocaleString('en-IN')} ({payrollDifference > 0 ? '+' : ''}{payrollPctChange}%)</span>
              </div>
            )}

            <div className="text-slate-500 dark:text-slate-400 text-[11px]">
              Modified: <strong className="text-slate-800 dark:text-slate-200">{modifiedEmployees.length}</strong> employees
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
              Selected: <strong className="text-emerald-700 dark:text-emerald-400 font-bold">{selectedIds.size}</strong> of {visibleEmployees.length} visible
            </span>
          </div>
        </div>

        {/* Toolbar & Filter Controls */}
        <div className="p-3 bg-slate-50 dark:bg-[#0f1d17] border-b border-slate-200 dark:border-[#1e3a2f] space-y-2.5 shrink-0">
          {/* Top Row: Search & Filters */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
              {/* Search */}
              <div className="relative min-w-[200px] flex-1 max-w-xs">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by ID, name, role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-[#11221b] border border-slate-200 dark:border-[#1e3a2f] rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Department Filter */}
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="py-1.5 px-2.5 bg-white dark:bg-[#11221b] border border-slate-200 dark:border-[#1e3a2f] rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none"
              >
                <option value="ALL">All Departments ({departments.length})</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>

              {/* Branch Filter */}
              <select
                value={filterBranch}
                onChange={(e) => setFilterBranch(e.target.value)}
                className="py-1.5 px-2.5 bg-white dark:bg-[#11221b] border border-slate-200 dark:border-[#1e3a2f] rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none"
              >
                <option value="ALL">All Branches ({branches.length})</option>
                {branches.map(b => <option key={b} value={b}>{b}</option>)}
              </select>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="py-1.5 px-2.5 bg-white dark:bg-[#11221b] border border-slate-200 dark:border-[#1e3a2f] rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none"
              >
                <option value="ACTIVE">Active Staff Only</option>
                <option value="INACTIVE">Inactive / Exited Only</option>
                <option value="ALL">All Staff (Active + Inactive)</option>
              </select>
            </div>

            {/* Quick Selection Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleSelectAllVisible}
                className="px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1e3a2f] rounded-lg transition-colors cursor-pointer border border-slate-300 dark:border-[#1e3a2f]"
              >
                Select All ({visibleEmployees.length})
              </button>
              <button
                type="button"
                onClick={handleDeselectAllVisible}
                className="px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1e3a2f] rounded-lg transition-colors cursor-pointer border border-slate-300 dark:border-[#1e3a2f]"
              >
                Clear Selection
              </button>
            </div>
          </div>

          {/* Mass Action Trigger Bar */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/80 dark:border-[#1e3a2f]">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1">
              <Sliders className="w-3.5 h-3.5 text-emerald-600" />
              Apply to {selectedIds.size} Selected:
            </span>

            {/* % Hike */}
            <button
              type="button"
              onClick={() => setActiveBatchAction(activeBatchAction === 'salary_pct' ? null : 'salary_pct')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                activeBatchAction === 'salary_pct'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-[#11221b] border border-slate-200 dark:border-[#1e3a2f] text-slate-700 dark:text-slate-200 hover:bg-emerald-50 hover:text-emerald-800'
              }`}
            >
              <Percent className="w-3 h-3 text-emerald-600" />
              <span>% Salary Hike</span>
            </button>

            {/* Flat Amount Hike */}
            <button
              type="button"
              onClick={() => setActiveBatchAction(activeBatchAction === 'salary_flat' ? null : 'salary_flat')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                activeBatchAction === 'salary_flat'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-[#11221b] border border-slate-200 dark:border-[#1e3a2f] text-slate-700 dark:text-slate-200 hover:bg-emerald-50 hover:text-emerald-800'
              }`}
            >
              <DollarSign className="w-3 h-3 text-emerald-600" />
              <span>+Flat Amount ₹</span>
            </button>

            {/* Change Department */}
            <button
              type="button"
              onClick={() => setActiveBatchAction(activeBatchAction === 'department' ? null : 'department')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                activeBatchAction === 'department'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-[#11221b] border border-slate-200 dark:border-[#1e3a2f] text-slate-700 dark:text-slate-200 hover:bg-blue-50 hover:text-blue-800'
              }`}
            >
              <Building className="w-3 h-3 text-blue-600" />
              <span>Change Dept</span>
            </button>

            {/* Change Branch */}
            <button
              type="button"
              onClick={() => setActiveBatchAction(activeBatchAction === 'branch' ? null : 'branch')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                activeBatchAction === 'branch'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white dark:bg-[#11221b] border border-slate-200 dark:border-[#1e3a2f] text-slate-700 dark:text-slate-200 hover:bg-purple-50 hover:text-purple-800'
              }`}
            >
              <span>Change Branch</span>
            </button>

            {/* Change Shift */}
            <button
              type="button"
              onClick={() => setActiveBatchAction(activeBatchAction === 'shift' ? null : 'shift')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                activeBatchAction === 'shift'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-[#11221b] border border-slate-200 dark:border-[#1e3a2f] text-slate-700 dark:text-slate-200 hover:bg-indigo-50 hover:text-indigo-800'
              }`}
            >
              <span>Change Shift</span>
            </button>

            {/* Change Designation */}
            <button
              type="button"
              onClick={() => setActiveBatchAction(activeBatchAction === 'designation' ? null : 'designation')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                activeBatchAction === 'designation'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white dark:bg-[#11221b] border border-slate-200 dark:border-[#1e3a2f] text-slate-700 dark:text-slate-200 hover:bg-amber-50 hover:text-amber-800'
              }`}
            >
              <span>Change Role</span>
            </button>
          </div>

          {/* Expanded Batch Action Controls Panel */}
          {activeBatchAction && (
            <div className="p-3 bg-emerald-50 dark:bg-[#132c21] border border-emerald-200 dark:border-[#1e3a2f] rounded-xl flex flex-wrap items-center gap-3 animate-in fade-in duration-150">
              
              {activeBatchAction === 'salary_pct' && (
                <div className="flex flex-wrap items-center gap-3 w-full">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-emerald-950 dark:text-emerald-200">Increment %:</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="-50"
                        max="200"
                        step="0.5"
                        value={batchPercent}
                        onChange={(e) => setBatchPercent(parseFloat(e.target.value) || 0)}
                        className="w-24 px-2.5 py-1 bg-white dark:bg-[#0c1913] border border-emerald-300 dark:border-[#1e3a2f] rounded-lg text-xs font-bold text-slate-900 dark:text-white"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                    <label className="text-xs font-bold text-emerald-950 dark:text-emerald-200">Remarks:</label>
                    <input
                      type="text"
                      value={batchIncrementRemarks}
                      onChange={(e) => setBatchIncrementRemarks(e.target.value)}
                      placeholder="e.g. Annual Appraisal 2026"
                      className="flex-1 px-2.5 py-1 bg-white dark:bg-[#0c1913] border border-emerald-300 dark:border-[#1e3a2f] rounded-lg text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyPercentageIncrement}
                    disabled={selectedIds.size === 0}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Apply +{batchPercent}% to {selectedIds.size} Staff
                  </button>
                </div>
              )}

              {activeBatchAction === 'salary_flat' && (
                <div className="flex flex-wrap items-center gap-3 w-full">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-emerald-950 dark:text-emerald-200">Flat Hike (₹):</label>
                    <input
                      type="number"
                      step="500"
                      value={batchFlatAmount}
                      onChange={(e) => setBatchFlatAmount(parseFloat(e.target.value) || 0)}
                      className="w-28 px-2.5 py-1 bg-white dark:bg-[#0c1913] border border-emerald-300 dark:border-[#1e3a2f] rounded-lg text-xs font-bold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                    <label className="text-xs font-bold text-emerald-950 dark:text-emerald-200">Remarks:</label>
                    <input
                      type="text"
                      value={batchIncrementRemarks}
                      onChange={(e) => setBatchIncrementRemarks(e.target.value)}
                      placeholder="e.g. Performance Incentive / Standard Hike"
                      className="flex-1 px-2.5 py-1 bg-white dark:bg-[#0c1913] border border-emerald-300 dark:border-[#1e3a2f] rounded-lg text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyFlatIncrement}
                    disabled={selectedIds.size === 0}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Apply +₹{batchFlatAmount.toLocaleString('en-IN')} to {selectedIds.size} Staff
                  </button>
                </div>
              )}

              {activeBatchAction === 'department' && (
                <div className="flex items-center gap-3 w-full">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">Select New Department:</label>
                  <input
                    type="text"
                    list="batch-dept-list"
                    value={batchDepartment}
                    onChange={(e) => setBatchDepartment(e.target.value)}
                    placeholder="Enter or select department..."
                    className="w-64 px-2.5 py-1 bg-white dark:bg-[#0c1913] border border-blue-300 rounded-lg text-xs text-slate-900 dark:text-white"
                  />
                  <datalist id="batch-dept-list">
                    {departments.map(d => <option key={d} value={d} />)}
                  </datalist>
                  <button
                    type="button"
                    onClick={handleApplyBatchDepartment}
                    disabled={!batchDepartment.trim() || selectedIds.size === 0}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Update Dept for {selectedIds.size} Staff
                  </button>
                </div>
              )}

              {activeBatchAction === 'branch' && (
                <div className="flex items-center gap-3 w-full">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">Select New Branch:</label>
                  <input
                    type="text"
                    list="batch-branch-list"
                    value={batchBranch}
                    onChange={(e) => setBatchBranch(e.target.value)}
                    placeholder="Enter or select branch location..."
                    className="w-64 px-2.5 py-1 bg-white dark:bg-[#0c1913] border border-purple-300 rounded-lg text-xs text-slate-900 dark:text-white"
                  />
                  <datalist id="batch-branch-list">
                    {branches.map(b => <option key={b} value={b} />)}
                  </datalist>
                  <button
                    type="button"
                    onClick={handleApplyBatchBranch}
                    disabled={!batchBranch.trim() || selectedIds.size === 0}
                    className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Update Branch for {selectedIds.size} Staff
                  </button>
                </div>
              )}

              {activeBatchAction === 'shift' && (
                <div className="flex items-center gap-3 w-full">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">Select New Shift:</label>
                  <select
                    value={batchShift}
                    onChange={(e) => setBatchShift(e.target.value)}
                    className="w-72 px-2.5 py-1 bg-white dark:bg-[#0c1913] border border-indigo-300 rounded-lg text-xs text-slate-900 dark:text-white"
                  >
                    <option value="">-- Choose Shift --</option>
                    <option value="Shift 1 (10:00 AM - 08:00 PM)">Shift 1 (10:00 AM - 08:00 PM)</option>
                    <option value="Shift 2 (09:00 AM - 06:00 PM)">Shift 2 (09:00 AM - 06:00 PM)</option>
                    <option value="Shift 3 (08:00 AM - 05:00 PM)">Shift 3 (08:00 AM - 05:00 PM)</option>
                    <option value="Night Shift (08:00 PM - 06:00 AM)">Night Shift (08:00 PM - 06:00 AM)</option>
                    <option value="General Shift (10:00 AM - 07:00 PM)">General Shift (10:00 AM - 07:00 PM)</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleApplyBatchShift}
                    disabled={!batchShift.trim() || selectedIds.size === 0}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Update Shift for {selectedIds.size} Staff
                  </button>
                </div>
              )}

              {activeBatchAction === 'designation' && (
                <div className="flex items-center gap-3 w-full">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">New Designation / Role:</label>
                  <input
                    type="text"
                    value={batchDesignation}
                    onChange={(e) => setBatchDesignation(e.target.value)}
                    placeholder="e.g. Senior Accounts Officer"
                    className="w-64 px-2.5 py-1 bg-white dark:bg-[#0c1913] border border-amber-300 rounded-lg text-xs text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleApplyBatchDesignation}
                    disabled={!batchDesignation.trim() || selectedIds.size === 0}
                    className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Update Role for {selectedIds.size} Staff
                  </button>
                </div>
              )}

            </div>
          )}
        </div>

        {/* Main Editable Spreadsheet Grid */}
        <div className="flex-1 overflow-auto bg-slate-100 dark:bg-[#070f0b] p-3">
          <div className="bg-white dark:bg-[#0f1d17] border border-slate-200 dark:border-[#1e3a2f] rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead className="sticky top-0 bg-slate-900 text-white font-bold z-10 shadow-xxs">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={visibleEmployees.length > 0 && visibleEmployees.every(e => selectedIds.has(e.id))}
                      onChange={(e) => {
                        if (e.target.checked) handleSelectAllVisible();
                        else handleDeselectAllVisible();
                      }}
                      className="rounded border-slate-600 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-2.5 px-3">Emp ID</th>
                  <th className="py-2.5 px-3">Full Name</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Designation / Role</th>
                  <th className="py-2.5 px-3">Branch Location</th>
                  <th className="py-2.5 px-3 text-right">Basic Salary (₹)</th>
                  <th className="py-2.5 px-3 text-right">Allowances (₹)</th>
                  <th className="py-2.5 px-3">Work Shift / Timing</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-[#1e3a2f]">
                {visibleEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      No employees match the selected filters or search query.
                    </td>
                  </tr>
                ) : (
                  visibleEmployees.map((emp) => {
                    const isSelected = selectedIds.has(emp.id);
                    const orig = employees.find(e => e.id === emp.id);
                    const isSalaryModified = orig && orig.basicSalary !== emp.basicSalary;
                    const isDeptModified = orig && orig.department !== emp.department;
                    const isRoleModified = orig && orig.designation !== emp.designation;
                    const isBranchModified = orig && orig.branch !== emp.branch;
                    const isAllowancesModified = orig && orig.allowances !== emp.allowances;
                    const isShiftModified = orig && orig.workTiming !== emp.workTiming;

                    const hasAnyModification = isSalaryModified || isDeptModified || isRoleModified || isBranchModified || isAllowancesModified || isShiftModified;

                    return (
                      <tr 
                        key={emp.id} 
                        className={`transition-colors ${
                          hasAnyModification 
                            ? 'bg-amber-50/60 dark:bg-[#1a2d24]' 
                            : isSelected 
                              ? 'bg-emerald-50/30 dark:bg-[#12241c]' 
                              : 'hover:bg-slate-50 dark:hover:bg-[#11221b]'
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-2 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(emp.id)}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                        </td>

                        {/* ID */}
                        <td className="py-2 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                          {emp.id}
                        </td>

                        {/* Name */}
                        <td className="py-2 px-3 font-bold text-slate-900 dark:text-white min-w-[140px]">
                          <div className="flex items-center gap-1.5">
                            <span>{emp.name}</span>
                            {hasAnyModification && (
                              <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded text-[9px] font-black uppercase tracking-tight">
                                Edited
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Department */}
                        <td className="py-2 px-3 min-w-[130px]">
                          <input
                            type="text"
                            value={emp.department || ''}
                            onChange={(e) => handleCellChange(emp.id, 'department', e.target.value)}
                            className={`w-full px-2 py-1 bg-white dark:bg-[#0c1913] border rounded text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                              isDeptModified ? 'border-amber-400 font-bold bg-amber-50 dark:bg-amber-950/30' : 'border-slate-200 dark:border-[#1e3a2f]'
                            }`}
                          />
                        </td>

                        {/* Designation */}
                        <td className="py-2 px-3 min-w-[140px]">
                          <input
                            type="text"
                            value={emp.designation || ''}
                            onChange={(e) => handleCellChange(emp.id, 'designation', e.target.value)}
                            className={`w-full px-2 py-1 bg-white dark:bg-[#0c1913] border rounded text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                              isRoleModified ? 'border-amber-400 font-bold bg-amber-50 dark:bg-amber-950/30' : 'border-slate-200 dark:border-[#1e3a2f]'
                            }`}
                          />
                        </td>

                        {/* Branch */}
                        <td className="py-2 px-3 min-w-[120px]">
                          <input
                            type="text"
                            value={emp.branch || ''}
                            onChange={(e) => handleCellChange(emp.id, 'branch', e.target.value)}
                            className={`w-full px-2 py-1 bg-white dark:bg-[#0c1913] border rounded text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                              isBranchModified ? 'border-amber-400 font-bold bg-amber-50 dark:bg-amber-950/30' : 'border-slate-200 dark:border-[#1e3a2f]'
                            }`}
                          />
                        </td>

                        {/* Basic Salary */}
                        <td className="py-2 px-3 text-right min-w-[110px]">
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              step="500"
                              value={emp.basicSalary || 0}
                              onChange={(e) => handleCellChange(emp.id, 'basicSalary', parseFloat(e.target.value) || 0)}
                              className={`w-full px-2 py-1 text-right font-mono font-bold bg-white dark:bg-[#0c1913] border rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                                isSalaryModified 
                                  ? 'border-emerald-500 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40' 
                                  : 'border-slate-200 dark:border-[#1e3a2f] text-slate-900 dark:text-white'
                              }`}
                            />
                            {isSalaryModified && orig && (
                              <span className="block text-[9.5px] font-mono text-slate-400 text-right mt-0.5">
                                Old: ₹{orig.basicSalary.toLocaleString('en-IN')}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Allowances */}
                        <td className="py-2 px-3 text-right min-w-[95px]">
                          <input
                            type="number"
                            min="0"
                            step="200"
                            value={emp.allowances || 0}
                            onChange={(e) => handleCellChange(emp.id, 'allowances', parseFloat(e.target.value) || 0)}
                            className={`w-full px-2 py-1 text-right font-mono bg-white dark:bg-[#0c1913] border rounded text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                              isAllowancesModified ? 'border-amber-400 font-bold' : 'border-slate-200 dark:border-[#1e3a2f]'
                            }`}
                          />
                        </td>

                        {/* Work Timing */}
                        <td className="py-2 px-3 min-w-[140px]">
                          <input
                            type="text"
                            value={emp.workTiming || ''}
                            onChange={(e) => handleCellChange(emp.id, 'workTiming', e.target.value)}
                            placeholder="e.g. Shift 1"
                            className={`w-full px-2 py-1 bg-white dark:bg-[#0c1913] border rounded text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                              isShiftModified ? 'border-amber-400 font-bold' : 'border-slate-200 dark:border-[#1e3a2f]'
                            }`}
                          />
                        </td>

                        {/* Status */}
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleCellChange(emp.id, 'isActive', emp.isActive === false ? true : false)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase transition-all cursor-pointer ${
                              emp.isActive !== false
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                            }`}
                          >
                            {emp.isActive !== false ? 'Active' : 'Inactive'}
                          </button>
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Bottom Footer Actions */}
        <div className="px-5 py-3 border-t border-gray-200 dark:border-[#1e3a2f] bg-slate-50 dark:bg-[#0c1913] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                // Reset all changes back to original
                setDraftEmployees(employees.map(e => ({ ...e })));
              }}
              disabled={modifiedEmployees.length === 0}
              className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-xl transition-all cursor-pointer disabled:opacity-40"
            >
              Reset All Edits
            </button>
            {modifiedEmployees.length > 0 && (
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                <span>{modifiedEmployees.length} employee records modified</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-200 hover:bg-slate-300 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={isSaving || modifiedEmployees.length === 0}
              onClick={handleSaveAll}
              className="px-6 py-2 bg-[#03623c] hover:bg-[#024d2e] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98"
            >
              {isSaving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Saving & Syncing to Sheets...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>
                    {language === 'hi'
                      ? `बल्क अपडेट सेव करें (${modifiedEmployees.length})`
                      : `Save All Bulk Updates (${modifiedEmployees.length})`}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
