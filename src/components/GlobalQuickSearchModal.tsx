import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, X, User, Calendar, FileText, DollarSign, Award, 
  Briefcase, Phone, Mail, MapPin, Building, ChevronRight,
  Clock, ShieldCheck, ArrowUpRight, Sparkles, UserCheck, UserX,
  Layers, Settings as SettingsIcon, Database, CheckSquare
} from 'lucide-react';
import { Employee, Attendance, PayrollRecord } from '../types';

export interface GlobalQuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  attendanceRecords?: Attendance[];
  payrollRecords?: PayrollRecord[];
  onNavigateTab?: (tab: string) => void;
  onSelectEmployeeForDetail?: (emp: Employee) => void;
  onOpenEmployeeLedger?: (empId: string) => void;
  onOpenAttendanceForEmp?: (empId: string) => void;
  onOpenPayslipForEmp?: (empId: string) => void;
}

export const GlobalQuickSearchModal: React.FC<GlobalQuickSearchModalProps> = ({
  isOpen,
  onClose,
  employees = [],
  onNavigateTab,
  onSelectEmployeeForDetail,
  onOpenEmployeeLedger,
  onOpenAttendanceForEmp,
  onOpenPayslipForEmp
}) => {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'employees' | 'modules' | 'active' | 'inactive'>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // App navigation modules for quick jump
  const systemModules = useMemo(() => [
    { id: 'dashboard', title: 'Dashboard & Overview', desc: 'KPI cards, real-time analytics & charts', tab: 'dashboard', icon: Layers, color: 'text-blue-600 bg-blue-50' },
    { id: 'employees', title: 'Employee Directory & Profiles', desc: 'Manage active/inactive staff records & details', tab: 'employees', icon: User, color: 'text-emerald-600 bg-emerald-50' },
    { id: 'attendance', title: 'Attendance Tracker & Punches', desc: 'Mark daily attendance, overtime & punch imports', tab: 'attendance', icon: Calendar, color: 'text-amber-600 bg-amber-50' },
    { id: 'requests', title: 'Monthly Attendance Approval & Reports', desc: 'Approve regularization requests & sign PDF reports', tab: 'attendance', icon: CheckSquare, color: 'text-teal-600 bg-teal-50' },
    { id: 'payroll', title: 'Salary & Payroll Calculator', desc: 'Process monthly salaries, deductions & payslips', tab: 'payroll', icon: DollarSign, color: 'text-emerald-700 bg-emerald-50' },
    { id: 'ledger', title: 'Employee Ledger & Payment Status', desc: 'Track salary payouts, advance balance & history', tab: 'ledger', icon: FileText, color: 'text-purple-600 bg-purple-50' },
    { id: 'leaves', title: 'Leaves & Holiday Calendar', desc: 'Apply leaves, balance tracking & national holidays', tab: 'leaves', icon: Clock, color: 'text-rose-600 bg-rose-50' },
    { id: 'lifecycle', title: 'Employee Lifecycle & Performance', desc: 'Appraisals, promotions, transfers & assets', tab: 'lifecycle', icon: Award, color: 'text-indigo-600 bg-indigo-50' },
    { id: 'exit', title: 'Exit & Resignation Management', desc: 'Offboarding, clearance checklists & exit interviews', tab: 'exit', icon: UserX, color: 'text-rose-700 bg-rose-50' },
    { id: 'adminSettings', title: 'Admin Settings & Retention Policies', desc: 'Configure company policies, shift timings & rules', tab: 'adminSettings', icon: SettingsIcon, color: 'text-slate-600 bg-slate-100' },
    { id: 'archive', title: 'Archive & Multi-Sheet Storage', desc: 'Google Sheets multi-tab archive & remaining days', tab: 'archive', icon: Database, color: 'text-cyan-600 bg-cyan-50' }
  ], []);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    let list = employees;
    if (activeCategory === 'active') {
      list = list.filter(e => e.isActive !== false);
    } else if (activeCategory === 'inactive') {
      list = list.filter(e => e.isActive === false);
    }

    if (!query.trim()) {
      return activeCategory === 'modules' ? [] : list.slice(0, 15);
    }

    const q = query.toLowerCase().trim();
    return list.filter(e => {
      const matchName = (e.name || '').toLowerCase().includes(q);
      const matchId = (e.id || '').toLowerCase().includes(q);
      const matchDept = (e.department || '').toLowerCase().includes(q);
      const matchDesig = (e.designation || '').toLowerCase().includes(q);
      const matchBranch = (e.branch || '').toLowerCase().includes(q);
      const matchPhone = (e.mobileNo || e.personalMobileNo || '').toLowerCase().includes(q);
      const matchEmail = (e.email || e.personalEmail || '').toLowerCase().includes(q);

      return matchName || matchId || matchDept || matchDesig || matchBranch || matchPhone || matchEmail;
    });
  }, [employees, query, activeCategory]);

  // Filtered modules
  const filteredModules = useMemo(() => {
    if (activeCategory === 'employees' || activeCategory === 'active' || activeCategory === 'inactive') {
      return [];
    }
    if (!query.trim()) {
      return systemModules.slice(0, 4);
    }
    const q = query.toLowerCase().trim();
    return systemModules.filter(m => 
      m.title.toLowerCase().includes(q) || 
      m.desc.toLowerCase().includes(q) ||
      m.tab.toLowerCase().includes(q)
    );
  }, [systemModules, query, activeCategory]);

  // Auto focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Handle global escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 px-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-[#0d1c15] border border-slate-200 dark:border-[#1e3a2f] w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="p-4 border-b border-slate-100 dark:border-[#1e3a2f] flex items-center gap-3 bg-slate-50/70 dark:bg-[#11221b]">
          <Search className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Global search by Employee Name, ID (RS001), Phone, Dept, or Module..."
            className="w-full bg-transparent border-none text-slate-900 dark:text-slate-100 placeholder-slate-400 text-sm font-semibold focus:outline-none focus:ring-0"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-[#1e3a2f] transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-1 text-[10px] font-mono font-bold text-slate-400 bg-slate-200 dark:bg-[#1e3a2f] rounded-lg">
              ESC to close
            </kbd>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="px-4 py-2 border-b border-slate-100 dark:border-[#1e3a2f] flex items-center gap-1.5 overflow-x-auto text-xs bg-white dark:bg-[#0d1c15] shrink-0">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
              activeCategory === 'all'
                ? 'bg-emerald-600 text-white shadow-3xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#11221b]'
            }`}
          >
            All Results ({filteredEmployees.length + filteredModules.length})
          </button>
          <button
            onClick={() => setActiveCategory('employees')}
            className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
              activeCategory === 'employees'
                ? 'bg-emerald-600 text-white shadow-3xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#11221b]'
            }`}
          >
            Employees ({employees.length})
          </button>
          <button
            onClick={() => setActiveCategory('active')}
            className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
              activeCategory === 'active'
                ? 'bg-emerald-600 text-white shadow-3xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#11221b]'
            }`}
          >
            Active ({employees.filter(e => e.isActive !== false).length})
          </button>
          <button
            onClick={() => setActiveCategory('inactive')}
            className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
              activeCategory === 'inactive'
                ? 'bg-emerald-600 text-white shadow-3xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#11221b]'
            }`}
          >
            Left / Inactive ({employees.filter(e => e.isActive === false).length})
          </button>
          <button
            onClick={() => setActiveCategory('modules')}
            className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
              activeCategory === 'modules'
                ? 'bg-emerald-600 text-white shadow-3xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#11221b]'
            }`}
          >
            Modules & Pages ({systemModules.length})
          </button>
        </div>

        {/* Results List */}
        <div ref={listRef} className="overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-[#1e3a2f]/40 p-2 space-y-1">
          {/* Quick System Modules Section */}
          {filteredModules.length > 0 && (
            <div className="pb-2">
              <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-between">
                <span>Quick Module Jump</span>
                <span>{filteredModules.length} Modules</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 px-1">
                {filteredModules.map(mod => {
                  const Icon = mod.icon;
                  return (
                    <button
                      key={mod.id}
                      onClick={() => {
                        if (onNavigateTab) onNavigateTab(mod.tab);
                        onClose();
                      }}
                      className="p-2.5 rounded-2xl border border-slate-100 dark:border-[#1e3a2f]/60 hover:border-emerald-300 dark:hover:border-emerald-700/60 bg-white dark:bg-[#11221b] hover:bg-emerald-50/50 dark:hover:bg-[#162c22] text-left flex items-center gap-3 transition-all cursor-pointer group shadow-3xs"
                    >
                      <div className={`p-2 rounded-xl ${mod.color} shrink-0`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 truncate">
                          {mod.title}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {mod.desc}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Employees List Section */}
          <div>
            <div className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-between">
              <span>Employee Directory Matches</span>
              <span>{filteredEmployees.length} Matches</span>
            </div>

            {filteredEmployees.length === 0 ? (
              <div className="py-8 px-4 text-center">
                <UserX className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  No employees found matching "{query}"
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Try checking the spelling or searching by Employee ID, Branch, or Phone.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredEmployees.map(emp => (
                  <div
                    key={emp.id}
                    className="p-3 rounded-2xl bg-white dark:bg-[#11221b] border border-slate-100 dark:border-[#1e3a2f]/60 hover:border-emerald-300 dark:hover:border-emerald-600/60 hover:bg-emerald-50/30 dark:hover:bg-[#162c22] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-3xs group"
                  >
                    {/* Left: Avatar & Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-bold text-sm flex items-center justify-center shadow-xs shrink-0">
                        {emp.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                            {emp.name}
                          </span>
                          <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-slate-100 dark:bg-[#1e3a2f] text-slate-700 dark:text-emerald-300 rounded-md">
                            {emp.id}
                          </span>
                          {emp.isActive === false ? (
                            <span className="px-2 py-0.5 text-[9px] font-black bg-rose-100 text-rose-700 rounded-md">
                              Inactive / Exited
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-md">
                              Active
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                          {emp.designation && (
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              {emp.designation}
                            </span>
                          )}
                          {emp.department && (
                            <span>• <strong className="text-emerald-700 dark:text-emerald-400">{emp.department}</strong></span>
                          )}
                          {emp.branch && (
                            <span>• {emp.branch}</span>
                          )}
                          {emp.mobileNo && (
                            <span className="flex items-center gap-1 font-mono text-[10px]">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {emp.mobileNo}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Quick Action Buttons */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0 flex-wrap">
                      <button
                        onClick={() => {
                          if (onSelectEmployeeForDetail) onSelectEmployeeForDetail(emp);
                          if (onNavigateTab) onNavigateTab('employees');
                          onClose();
                        }}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-emerald-600 hover:text-white dark:bg-[#193328] dark:hover:bg-emerald-600 text-slate-700 dark:text-slate-200 text-[11px] font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1"
                        title="View Employee Profile"
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>Profile</span>
                      </button>

                      <button
                        onClick={() => {
                          if (onOpenEmployeeLedger) onOpenEmployeeLedger(emp.id);
                          if (onNavigateTab) onNavigateTab('ledger');
                          onClose();
                        }}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-purple-600 hover:text-white dark:bg-[#193328] dark:hover:bg-purple-600 text-slate-700 dark:text-slate-200 text-[11px] font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1"
                        title="View Ledger & Payments"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Ledger</span>
                      </button>

                      <button
                        onClick={() => {
                          if (onOpenAttendanceForEmp) onOpenAttendanceForEmp(emp.id);
                          if (onNavigateTab) onNavigateTab('attendance');
                          onClose();
                        }}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-amber-600 hover:text-white dark:bg-[#193328] dark:hover:bg-amber-600 text-slate-700 dark:text-slate-200 text-[11px] font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1"
                        title="View Attendance & Punches"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Attendance</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer info bar */}
        <div className="p-3 bg-slate-50 dark:bg-[#0b1812] border-t border-slate-100 dark:border-[#1e3a2f] flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-medium text-[11px]">Instant Search across {employees.length} Employees</span>
          </div>
          <span className="text-[10px] text-slate-400 hidden sm:inline">Press ESC to dismiss</span>
        </div>
      </div>
    </div>
  );
};

export default GlobalQuickSearchModal;
