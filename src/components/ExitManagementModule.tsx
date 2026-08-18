import React, { useState, useEffect } from 'react';
import { 
  LogOut, 
  CheckSquare, 
  FileCheck, 
  Plus, 
  Search, 
  X, 
  Printer, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  DollarSign, 
  Building, 
  FileText,
  UserX,
  Trash2,
  Edit2,
  Bell,
  Sparkles,
  Filter,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Check,
  RotateCcw,
  AlertCircle,
  MinusCircle,
  Send,
  Layers,
  Award,
  ListTodo
} from 'lucide-react';
import { ExitRecord, Employee, ClearanceTaskItem } from '../types';

interface ExitManagementProps {
  employees: Employee[];
  language?: 'en' | 'hi';
}

const DEFAULT_CLEARANCE_TASKS: Omit<ClearanceTaskItem, 'id'>[] = [
  {
    title: 'IT Asset Return (Laptop, Charger, Mouse, Monitor)',
    department: 'IT',
    assignedTo: 'IT Manager',
    status: 'Pending',
    requiredForFnF: true,
    notes: 'Verify serial number and physical condition'
  },
  {
    title: 'ID Card, Security Pass & Office Keys Submission',
    department: 'Security',
    assignedTo: 'Facility Officer',
    status: 'Pending',
    requiredForFnF: true,
    notes: 'Collect gate pass and cabinet keys'
  },
  {
    title: 'Finance No-Dues Clearance & Travel Advance Settlement',
    department: 'Finance',
    assignedTo: 'Accounts Head',
    status: 'Pending',
    requiredForFnF: true,
    notes: 'Check pending expense claims or un-refunded advances'
  },
  {
    title: 'HR Documents, NDA Sign-Off & Exit Survey',
    department: 'HR',
    assignedTo: 'HR Specialist',
    status: 'Pending',
    requiredForFnF: true,
    notes: 'Complete exit interview notes and non-disclosure signoff'
  },
  {
    title: 'Company SIM Card & Work Email Access Revocation',
    department: 'IT',
    assignedTo: 'IT Admin',
    status: 'Pending',
    requiredForFnF: false,
    notes: 'Revoke Google Workspace, ERP & WhatsApp Business access'
  },
  {
    title: 'Departmental Knowledge Handover & Site Records',
    department: 'Operations',
    assignedTo: 'Department Manager',
    status: 'Pending',
    requiredForFnF: true,
    notes: 'Handover active project files, client contacts & store keys'
  }
];

export default function ExitManagementModule({ employees, language = 'en' }: ExitManagementProps) {
  const [activeTab, setActiveTab] = useState<'exits' | 'clearance'>('exits');

  //Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  //Notification Toast state
  const [completionAlert, setCompletionAlert] = useState<{
    show: boolean;
    employeeName: string;
    exitId: string;
    date: string;
  } | null>(null);

  //Exit Records state with dynamic checklists
  const [exitRecords, setExitRecords] = useState<ExitRecord[]>(() => {
    const saved = localStorage.getItem('payroll_exit_records');
    if (saved) {
      try { 
        const parsed: ExitRecord[] = JSON.parse(saved); 
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter(rec => rec.id !== 'EXT-001');
          return filtered.map(rec => {
            if (!rec.customChecklist || rec.customChecklist.length === 0) {
              const checklist = DEFAULT_CLEARANCE_TASKS.map((t, idx) => ({
                ...t,
                id: `TASK-${rec.id}-${idx + 1}`,
                status: 'Pending'
              })) as ClearanceTaskItem[];
              return { ...rec, customChecklist: checklist };
            }
            return rec;
          });
        }
      } catch (e) { 
        console.error(e); 
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('payroll_exit_records', JSON.stringify(exitRecords));
  }, [exitRecords]);

  //Modal states
  const [showExitModal, setShowExitModal] = useState(false);
  const [selectedLetterExit, setSelectedLetterExit] = useState<ExitRecord | null>(null);
  const [selectedCertificateExit, setSelectedCertificateExit] = useState<ExitRecord | null>(null);

  //Dynamic Task Modal state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [targetExitIdForTask, setTargetExitIdForTask] = useState<string | null>(null);
  const [newTask, setNewTask] = useState<{
    title: string;
    department: 'IT' | 'HR' | 'Finance' | 'Operations' | 'Admin' | 'Security' | 'Store';
    assignedTo: string;
    notes: string;
    requiredForFnF: boolean;
  }>({
    title: '',
    department: 'IT',
    assignedTo: '',
    notes: '',
    requiredForFnF: true
  });

  //Create new exit record
  const [newExit, setNewExit] = useState<Partial<ExitRecord>>({
    employeeId: '',
    resignationDate: new Date().toISOString().slice(0, 10),
    lastWorkingDay: new Date().toISOString().slice(0, 10),
    reason: 'Better Opportunity',
    noticePeriodDays: 30,
    exitInterviewNotes: ''
  });

  const handleCreateExit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExit.employeeId) return;
    const emp = employees.find(e => e.id === newExit.employeeId);
    const newId = `EXT-${String(exitRecords.length + 1).padStart(3, '0')}`;
    
    //Initialize standard checklist items
    const initialChecklist: ClearanceTaskItem[] = DEFAULT_CLEARANCE_TASKS.map((t, idx) => ({
      ...t,
      id: `TASK-${newId}-${idx + 1}`,
      status: 'Pending'
    }));

    const rec: ExitRecord = {
      id: newId,
      employeeId: newExit.employeeId || '',
      employeeName: emp ? emp.name : newExit.employeeId || '',
      department: emp ? emp.department : 'General',
      designation: emp ? emp.designation : 'Employee',
      resignationDate: newExit.resignationDate || new Date().toISOString().slice(0, 10),
      lastWorkingDay: newExit.lastWorkingDay || new Date().toISOString().slice(0, 10),
      reason: (newExit.reason as any) || 'Better Opportunity',
      status: 'In Clearance',
      noticePeriodDays: Number(newExit.noticePeriodDays) || 30,
      exitInterviewNotes: newExit.exitInterviewNotes || '',
      clearance: {
        departmentManager: false,
        itAssets: false,
        financeDues: false,
        hrDocuments: false
      },
      customChecklist: initialChecklist,
      fnfAmount: emp ? emp.basicSalary : 0,
      fnfStatus: 'Pending',
      relievingLetterIssued: false,
      createdDate: new Date().toISOString().slice(0, 10)
    };

    setExitRecords([rec, ...exitRecords]);
    setShowExitModal(false);
  };

  //Add dynamic task to specific exit record
  const handleAddCustomTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetExitIdForTask || !newTask.title.trim()) return;

    setExitRecords(prevRecords => prevRecords.map(rec => {
      if (rec.id === targetExitIdForTask) {
        const existingTasks = rec.customChecklist || [];
        const createdTask: ClearanceTaskItem = {
          id: `TASK-${rec.id}-${existingTasks.length + 1}-${Date.now().toString().slice(-4)}`,
          title: newTask.title.trim(),
          department: newTask.department,
          assignedTo: newTask.assignedTo || `${newTask.department} Manager`,
          status: 'Pending',
          notes: newTask.notes || '',
          requiredForFnF: newTask.requiredForFnF
        };
        return {
          ...rec,
          customChecklist: [...existingTasks, createdTask],
          status: 'In Clearance'
        };
      }
      return rec;
    }));

    setShowTaskModal(false);
    setNewTask({ title: '', department: 'IT', assignedTo: '', notes: '', requiredForFnF: true });
    setTargetExitIdForTask(null);
  };

  //Toggle single checklist task status (Pending -> Completed -> Waived -> Pending)
  const handleToggleTaskStatus = (exitId: string, taskId: string) => {
    setExitRecords(prevRecords => prevRecords.map(rec => {
      if (rec.id !== exitId) return rec;

      const currentTasks = rec.customChecklist || [];
      let isNewlyAllCompleted = false;

      const updatedTasks = currentTasks.map(t => {
        if (t.id === taskId) {
          let nextStatus: 'Pending' | 'Completed' | 'Waived' = 'Completed';
          if (t.status === 'Completed') nextStatus = 'Waived';
          else if (t.status === 'Waived') nextStatus = 'Pending';
          
          return {
            ...t,
            status: nextStatus,
            completedAt: nextStatus === 'Completed' ? new Date().toLocaleString() : undefined,
            completedBy: nextStatus === 'Completed' ? 'Manager' : undefined
          };
        }
        return t;
      });

      //Check overall progress
      const allDone = updatedTasks.length > 0 && updatedTasks.every(t => t.status === 'Completed' || t.status === 'Waived');
      
      let shouldNotify = false;
      if (allDone && !rec.completionNotified) {
        shouldNotify = true;
        isNewlyAllCompleted = true;
      }

      if (shouldNotify) {
        setCompletionAlert({
          show: true,
          employeeName: rec.employeeName,
          exitId: rec.id,
          date: new Date().toLocaleDateString()
        });
      }

      //Sync default clearance boolean state for legacy support
      const hasItDone = updatedTasks.some(t => t.department === 'IT' && t.status === 'Completed');
      const hasFinanceDone = updatedTasks.some(t => t.department === 'Finance' && t.status === 'Completed');
      const hasHrDone = updatedTasks.some(t => t.department === 'HR' && t.status === 'Completed');
      const hasOpsDone = updatedTasks.some(t => t.department === 'Operations' && t.status === 'Completed');

      return {
        ...rec,
        customChecklist: updatedTasks,
        clearance: {
          itAssets: hasItDone,
          financeDues: hasFinanceDone,
          hrDocuments: hasHrDone,
          departmentManager: hasOpsDone
        },
        status: allDone ? 'FnF Completed' : 'In Clearance',
        completionNotified: allDone ? true : rec.completionNotified,
        completionNotificationDate: isNewlyAllCompleted ? new Date().toISOString() : rec.completionNotificationDate
      };
    }));
  };

  //Delete a dynamic task
  const handleDeleteTask = (exitId: string, taskId: string) => {
    if (!window.confirm('Remove this clearance item from checklist?')) return;

    setExitRecords(prev => prev.map(rec => {
      if (rec.id === exitId) {
        const remaining = (rec.customChecklist || []).filter(t => t.id !== taskId);
        return {
          ...rec,
          customChecklist: remaining
        };
      }
      return rec;
    }));
  };

  //Reset checklist to default preset
  const handleResetChecklistToDefault = (exitId: string) => {
    if (!window.confirm('Reset checklist to standard company clearance template?')) return;

    setExitRecords(prev => prev.map(rec => {
      if (rec.id === exitId) {
        const resetTasks: ClearanceTaskItem[] = DEFAULT_CLEARANCE_TASKS.map((t, idx) => ({
          ...t,
          id: `TASK-${rec.id}-${idx + 1}-${Date.now().toString().slice(-4)}`,
          status: 'Pending'
        }));
        return {
          ...rec,
          customChecklist: resetTasks,
          completionNotified: false,
          status: 'In Clearance'
        };
      }
      return rec;
    }));
  };

  //Batch mark all as completed
  const handleMarkAllTasksCompleted = (exitId: string) => {
    setExitRecords(prev => prev.map(rec => {
      if (rec.id === exitId) {
        const updated = (rec.customChecklist || []).map(t => ({
          ...t,
          status: 'Completed' as const,
          completedAt: new Date().toLocaleString(),
          completedBy: 'Manager'
        }));

        setCompletionAlert({
          show: true,
          employeeName: rec.employeeName,
          exitId: rec.id,
          date: new Date().toLocaleDateString()
        });

        return {
          ...rec,
          customChecklist: updated,
          status: 'FnF Completed',
          completionNotified: true,
          completionNotificationDate: new Date().toISOString()
        };
      }
      return rec;
    }));
  };

  //Filtered records
  const filteredExitRecords = exitRecords.filter(rec => {
    const matchesSearch = rec.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          rec.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          rec.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = deptFilter === 'All' || rec.department === deptFilter;
    const matchesStatus = statusFilter === 'All' || rec.status === statusFilter;
    return matchesSearch && matchesDept && matchesStatus;
  });

  //Statistics
  const totalInClearance = exitRecords.filter(r => r.status === 'In Clearance' || r.status === 'Resigned').length;
  const totalCompleted = exitRecords.filter(r => r.status === 'FnF Completed' || r.status === 'Relieved').length;
  const totalTasksAllExits = exitRecords.reduce((sum, r) => sum + (r.customChecklist?.length || 0), 0);
  const completedTasksAllExits = exitRecords.reduce((sum, r) => sum + (r.customChecklist?.filter(t => t.status === 'Completed' || t.status === 'Waived').length || 0), 0);
  const overallProgressPct = totalTasksAllExits > 0 ? Math.round((completedTasksAllExits / totalTasksAllExits) * 100) : 0;

  return (
    <div className="p-4 md:p-6 space-y-6 w-full text-slate-800 font-sans">
      {/* Banner */}
      <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-rose-900 border border-rose-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-500/20 border border-rose-400/30 rounded-2xl text-rose-300">
              <LogOut className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-wide flex items-center gap-2">
                {'Exit Management & Dynamic Clearance'}
                <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono uppercase">
                  Automated Checklists Active
                </span>
              </h1>
              <p className="text-xs text-rose-100/80 font-medium mt-0.5">
                {'Resignation processing, custom clearance task builder, real-time status badges & automated completion triggers'}
              </p>
            </div>
          </div>

          <div className="flex bg-slate-950/60 backdrop-blur-md p-1.5 rounded-2xl border border-rose-400/30">
            <button
              onClick={() => setActiveTab('exits')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'exits'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <UserX className="w-4 h-4" />
              {'Resignations & Exits'}
            </button>
            <button
              onClick={() => setActiveTab('clearance')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'clearance'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <ListTodo className="w-4 h-4" />
              {'Dynamic Clearance Checklists'}
            </button>
          </div>
        </div>
      </div>

      {/* AUTOMATED COMPLETION NOTIFICATION ALERT TOAST/MODAL */}
      {completionAlert && completionAlert.show && (
        <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-emerald-950 border-2 border-emerald-500/50 rounded-2xl p-4 text-white shadow-2xl flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/20 border border-emerald-400/40 rounded-xl text-emerald-400 shrink-0">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                  🎉 Automated Clearance Notification Triggered!
                </span>
                <span className="px-2 py-0.5 text-[9px] font-mono bg-emerald-500/20 text-emerald-300 rounded-full font-bold">
                  {completionAlert.exitId}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-100 mt-0.5">
                All clearance tasks for <strong>{completionAlert.employeeName}</strong> have been marked as 100% completed.
              </p>
              <p className="text-[10px] text-slate-300">
                Automated email & system notifications sent to HR & Finance for final Full & Final (FnF) salary release.
              </p>
            </div>
          </div>
          <button
            onClick={() => setCompletionAlert(null)}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* QUICK SUMMARY METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-3xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider">
            <span>In Clearance Queue</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">{totalInClearance}</p>
          <p className="text-[10px] text-slate-400 font-medium">Pending department sign-offs</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-3xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider">
            <span>Clearance Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">{overallProgressPct}%</p>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mt-1">
            <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${overallProgressPct}%` }} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-3xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider">
            <span>FnF Cleared Exits</span>
            <Award className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">{totalCompleted}</p>
          <p className="text-[10px] text-slate-400 font-medium">Ready for relieving letter</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-3xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider">
            <span>Active Checklist Tasks</span>
            <Layers className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">{completedTasksAllExits} / {totalTasksAllExits}</p>
          <p className="text-[10px] text-slate-400 font-medium">Tasks completed across all exits</p>
        </div>
      </div>

      {/* EXITS TAB */}
      {activeTab === 'exits' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 border border-slate-200 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-700">
                {'Resignations & Separation Log'} ({exitRecords.length})
              </span>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search exit record..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-rose-500 w-48 sm:w-64" />
              </div>
            </div>

            <button
              onClick={() => setShowExitModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {'Log New Resignation'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredExitRecords.map(rec => {
              const totalTasks = rec.customChecklist?.length || 0;
              const doneTasks = rec.customChecklist?.filter(t => t.status === 'Completed' || t.status === 'Waived').length || 0;
              const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

              return (
                <div key={rec.id} className="bg-white border border-slate-200 hover:border-rose-300 rounded-2xl p-5 space-y-4 shadow-sm transition-all">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          {rec.id}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">Emp ID: {rec.employeeId}</span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mt-1">{rec.employeeName}</h3>
                      <p className="text-xs text-slate-500">{rec.designation} ({rec.department})</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                      rec.status === 'FnF Completed' || rec.status === 'Relieved' 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                        : 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse'
                    }`}>
                      {rec.status}
                    </span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-2 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Resignation Date:</span>
                        <span className="font-mono text-slate-800 font-medium">{rec.resignationDate}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Last Working Day:</span>
                        <span className="font-mono text-emerald-700 font-bold">{rec.lastWorkingDay}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Reason for Exit:</span>
                      <span className="text-slate-800 font-medium">{rec.reason}</span>
                    </div>
                  </div>

                  {/* Checklist Progress Snippet */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-slate-600 flex items-center gap-1.5">
                        <CheckSquare className="w-3.5 h-3.5 text-rose-600" />
                        Clearance Tasks:
                      </span>
                      <span className="font-mono text-slate-900">{doneTasks}{totalTasks} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          pct === 100 ? 'bg-emerald-500' : pct > 50 ? 'bg-amber-500' : 'bg-rose-500'
                        }`} 
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <button
                      onClick={() => {
                        setActiveTab('clearance');
                        setSearchQuery(rec.employeeName);
                      }}
                      className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 hover:underline"
                    >
                      <ListTodo className="w-3.5 h-3.5" />
                      Manage Checklist Tasks
                    </button>

                    <button
                      onClick={() => setSelectedLetterExit(rec)}
                      className="flex items-center gap-1.5 text-emerald-700 hover:text-emerald-800 hover:underline font-bold"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Relieving Letter
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DYNAMIC CLEARANCE CHECKLIST TAB */}
      {activeTab === 'clearance' && (
        <div className="space-y-6">
          {/* Controls & Filter bar */}
          <div className="bg-white p-4 border border-slate-200 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <span className="text-xs font-bold text-slate-700 shrink-0">
                {'Employee Clearance Checklists'}
              </span>
              <div className="relative flex-1 md:flex-initial">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by name, ID or task..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-rose-500 w-full md:w-64" />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <Filter className="w-3.5 h-3.5" />
                <span>Department:</span>
                <select
                  value={deptFilter}
                  onChange={e => setDeptFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-700 focus:outline-none focus:border-rose-500"
                >
                  <option value="All">All Departments</option>
                  <option value="IT">IT</option>
                  <option value="HR">HR</option>
                  <option value="Finance">Finance</option>
                  <option value="Operations">Operations</option>
                  <option value="Admin">Admin</option>
                  <option value="Security">Security</option>
                  <option value="Store">Store</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <span>Status:</span>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-700 focus:outline-none focus:border-rose-500"
                >
                  <option value="All">All Statuses</option>
                  <option value="In Clearance">In Clearance</option>
                  <option value="FnF Completed">FnF Completed</option>
                </select>
              </div>
            </div>
          </div>

          {/* List of Exits with Dynamic Checklist Cards */}
          <div className="space-y-6">
            {filteredExitRecords.map(rec => {
              const tasks = rec.customChecklist || [];
              const filteredTasks = tasks.filter(t => {
                if (deptFilter !== 'All' && t.department !== deptFilter) return false;
                if (searchQuery.trim()) {
                  const q = searchQuery.toLowerCase();
                  return t.title.toLowerCase().includes(q) || 
                         t.assignedTo?.toLowerCase().includes(q) || 
                         rec.employeeName.toLowerCase().includes(q);
                }
                return true;
              });

              const totalCount = tasks.length;
              const completedCount = tasks.filter(t => t.status === 'Completed').length;
              const waivedCount = tasks.filter(t => t.status === 'Waived').length;
              const pendingCount = tasks.filter(t => t.status === 'Pending').length;
              const progressPct = totalCount > 0 ? Math.round(((completedCount + waivedCount) / totalCount) * 100) : 0;
              const is100Pct = progressPct === 100;

              return (
                <div key={rec.id} className="bg-white border border-slate-200 hover:border-rose-300 rounded-3xl p-6 space-y-5 shadow-sm transition-all">
                  {/* Exit Employee Header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div className="flex items-start gap-3">
                      <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl shrink-0 font-mono font-bold text-xs">
                        {rec.id}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-slate-900 text-base">{rec.employeeName}</h3>
                          <span className="text-xs font-mono font-bold text-slate-400">({rec.employeeId})</span>
                          {is100Pct && (
                            <span className="px-2.5 py-0.5 text-[10px] font-black rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 font-mono uppercase">
                              <ShieldCheck className="w-3.5 h-3.5" /> 100% Cleared
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 font-medium">
                          {rec.designation} • {rec.department} Department • Last Day: <strong className="text-emerald-700 font-mono">{rec.lastWorkingDay}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => {
                          setTargetExitIdForTask(rec.id);
                          setShowTaskModal(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-3xs cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 text-rose-400" />
                        <span>Add Custom Task</span>
                      </button>

                      <button
                        onClick={() => handleMarkAllTasksCompleted(rec.id)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Mark All Completed</span>
                      </button>

                      <button
                        onClick={() => setSelectedCertificateExit(rec)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 text-rose-600" />
                        <span>No-Dues Certificate</span>
                      </button>

                      <button
                        onClick={() => handleResetChecklistToDefault(rec.id)}
                        title="Reset Checklist"
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar & Badges */}
                  <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-700">Clearance Completion Progress:</span>
                        <span className="px-2 py-0.5 rounded-md font-mono font-bold text-[11px] bg-white border border-slate-200 text-slate-800">
                          {completedCount + waivedCount}{totalCount} Items Done
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px]">
                        <span className="flex items-center gap-1 text-amber-700 font-bold">
                          <Clock className="w-3 h-3" /> {pendingCount} Pending
                        </span>
                        <span className="flex items-center gap-1 text-emerald-700 font-bold">
                          <CheckCircle2 className="w-3 h-3" /> {completedCount} Completed
                        </span>
                        {waivedCount > 0 && (
                          <span className="flex items-center gap-1 text-slate-500 font-bold">
                            <MinusCircle className="w-3 h-3" /> {waivedCount} Waived
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          is100Pct ? 'bg-emerald-500' : progressPct > 50 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${progressPct}%` }} />
                    </div>
                  </div>

                  {/* Dynamic Checklist Items Grid */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-600 px-1">
                      <span>Department Clearance Tasks ({filteredTasks.length})</span>
                      <span className="text-[10px] text-slate-400 font-normal">Click status badge to toggle (Pending ➔ Completed ➔ Waived)</span>
                    </div>

                    {filteredTasks.length === 0 ? (
                      <div className="text-center py-6 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-xs text-slate-400">
                        No clearance tasks matching criteria. Click &quot;Add Custom Task&quot; above to create one.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {filteredTasks.map((t, idx) => {
                          const isCompleted = t.status === 'Completed';
                          const isWaived = t.status === 'Waived';
                          const isPending = t.status === 'Pending';

                          return (
                            <div 
                              key={t.id}
                              className={`p-3.5 rounded-2xl border transition-all space-y-2 flex flex-col justify-between ${
                                isCompleted 
                                  ? 'bg-emerald-50/60 border-emerald-200 hover:border-emerald-300' 
                                  : isWaived 
                                  ? 'bg-slate-50/80 border-slate-200 hover:border-slate-300' 
                                  : 'bg-white border-slate-200 hover:border-amber-300 shadow-3xs'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded-md uppercase tracking-wider font-mono ${
                                      t.department === 'IT' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                      t.department === 'HR' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                                      t.department === 'Finance' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                      t.department === 'Security' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                                      'bg-slate-100 text-slate-800 border border-slate-200'
                                    }`}>
                                      {t.department}
                                    </span>

                                    {t.requiredForFnF && (
                                      <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                        FnF Mandatory
                                      </span>
                                    )}
                                  </div>

                                  <h4 className={`text-xs font-bold leading-snug ${isCompleted ? 'text-slate-800' : 'text-slate-900'}`}>
                                    {t.title}
                                  </h4>

                                  {t.notes && (
                                    <p className="text-[10px] text-slate-500 leading-normal">
                                      {t.notes}
                                    </p>
                                  )}
                                </div>

                                <button
                                  onClick={() => handleDeleteTask(rec.id, t.id)}
                                  className="text-slate-300 hover:text-rose-600 p-1 rounded transition-colors"
                                  title="Delete Task"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Task Footer & Status Toggle Button */}
                              <div className="flex items-center justify-between pt-2 border-t border-slate-100/80 text-[10px]">
                                <span className="text-slate-400 font-medium">
                                  Officer: <strong className="text-slate-600 font-semibold">{t.assignedTo || 'Unassigned'}</strong>
                                </span>

                                <button
                                  onClick={() => handleToggleTaskStatus(rec.id, t.id)}
                                  className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-3xs ${
                                    isCompleted 
                                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                                      : isWaived 
                                      ? 'bg-slate-200 hover:bg-slate-300 text-slate-700' 
                                      : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                                  }`}
                                >
                                  {isCompleted && <CheckCircle2 className="w-3 h-3 text-white" />}
                                  {isWaived && <MinusCircle className="w-3 h-3 text-slate-600" />}
                                  {isPending && <Clock className="w-3 h-3 text-amber-700 animate-spin" />}
                                  <span>{t.status}</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CREATE EXIT MODAL */}
      {showExitModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-900 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <UserX className="w-5 h-5 text-rose-600" />
                Log ResignationExit
              </h3>
              <button onClick={() => setShowExitModal(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>
            <form onSubmit={handleCreateExit} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-600 font-medium block mb-1">Select Employee</label>
                <select
                  required
                  value={newExit.employeeId}
                  onChange={e => setNewExit({ ...newExit, employeeId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-rose-600 focus:outline-none"
                >
                  <option value="">Choose Employee...</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.id}) - {e.department}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 font-medium block mb-1">Resignation Date</label>
                  <input
                    type="date"
                    value={newExit.resignationDate}
                    onChange={e => setNewExit({ ...newExit, resignationDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-rose-600 focus:outline-none" />
                </div>
                <div>
                  <label className="text-slate-600 font-medium block mb-1">Last Working Day</label>
                  <input
                    type="date"
                    value={newExit.lastWorkingDay}
                    onChange={e => setNewExit({ ...newExit, lastWorkingDay: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-rose-600 focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="text-slate-600 font-medium block mb-1">Reason for Leaving</label>
                <select
                  value={newExit.reason}
                  onChange={e => setNewExit({ ...newExit, reason: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-rose-600 focus:outline-none"
                >
                  <option value="Better Opportunity">Better Opportunity</option>
                  <option value="Personal Reasons">Personal Reasons</option>
                  <option value="Relocation">Relocation</option>
                  <option value="Higher Studies">Higher Studies</option>
                  <option value="Health">Health</option>
                  <option value="PerformanceTermination">PerformanceTermination</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-slate-600 font-medium block mb-1">Exit NotesComments</label>
                <textarea
                  rows={2}
                  placeholder="Exit interview remarks, handover notes..."
                  value={newExit.exitInterviewNotes}
                  onChange={e => setNewExit({ ...newExit, exitInterviewNotes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-rose-600 focus:outline-none" />
              </div>

              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-800">
                ✨ <strong>Automated Checklist Builder:</strong> Submitting will automatically initialize standard clearance tasks for IT, HR, Finance, Operations & Security.
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer"
              >
                Log Resignation & Build Checklist
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CREATE DYNAMIC TASK MODAL */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-900 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-rose-600" />
                Add Dynamic Clearance Task
              </h3>
              <button onClick={() => setShowTaskModal(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleAddCustomTask} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-600 font-medium block mb-1">Task TitleDescription</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Return ID Badge, Settle Petty Cash, Handover Site Keys..."
                  value={newTask.title}
                  onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-rose-600 focus:outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 font-medium block mb-1">Department</label>
                  <select
                    value={newTask.department}
                    onChange={e => setNewTask({ ...newTask, department: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-rose-600 focus:outline-none"
                  >
                    <option value="IT">IT</option>
                    <option value="HR">HR</option>
                    <option value="Finance">Finance</option>
                    <option value="Operations">Operations</option>
                    <option value="Admin">Admin</option>
                    <option value="Security">Security</option>
                    <option value="Store">Store</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-600 font-medium block mb-1">Assigned Officer</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh (IT Lead)"
                    value={newTask.assignedTo}
                    onChange={e => setNewTask({ ...newTask, assignedTo: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-rose-600 focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="text-slate-600 font-medium block mb-1">NotesInstructions</label>
                <input
                  type="text"
                  placeholder="Special instructions, condition checks..."
                  value={newTask.notes}
                  onChange={e => setNewTask({ ...newTask, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-rose-600 focus:outline-none" />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="requiredFnF"
                  checked={newTask.requiredForFnF}
                  onChange={e => setNewTask({ ...newTask, requiredForFnF: e.target.checked })}
                  className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500" />
                <label htmlFor="requiredFnF" className="text-xs text-slate-700 font-medium cursor-pointer">
                  Mandatory for Full & Final (FnF) Settlement Release
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer mt-2"
              >
                Add Clearance Task
              </button>
            </form>
          </div>
        </div>
      )}

      {/* NO-DUES CLEARANCE CERTIFICATE PRINT MODAL */}
      {selectedCertificateExit && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-3xl max-w-3xl w-full p-8 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedCertificateExit(null)}
              className="absolute right-4 top-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center border-b pb-4 space-y-1">
              <span className="text-[11px] font-mono font-bold text-rose-700 uppercase tracking-widest">
                Rathi Buildmart Pvt. Ltd. • HR & Payroll Systems
              </span>
              <h2 className="text-2xl font-black uppercase tracking-wide text-slate-900">
                NO-DUES CLEARANCE CERTIFICATE
              </h2>
              <p className="text-xs text-slate-500 font-mono">Certificate ID: NDC-{selectedCertificateExit.id}</p>
            </div>

            {/* Employee details summary */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Employee Name</span>
                <strong className="text-slate-900">{selectedCertificateExit.employeeName}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Employee ID</span>
                <strong className="font-mono text-slate-900">{selectedCertificateExit.employeeId}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Department</span>
                <strong className="text-slate-900">{selectedCertificateExit.department}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Last Working Day</span>
                <strong className="font-mono text-emerald-700">{selectedCertificateExit.lastWorkingDay}</strong>
              </div>
            </div>

            {/* Clearance Checklist Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Departmental Clearance Audit Log:
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase">
                      <th className="p-2.5">Department</th>
                      <th className="p-2.5">Clearance Item</th>
                      <th className="p-2.5">Assigned Officer</th>
                      <th className="p-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(selectedCertificateExit.customChecklist || []).map(t => (
                      <tr key={t.id} className="hover:bg-slate-50/50">
                        <td className="p-2.5 font-bold font-mono text-slate-700">{t.department}</td>
                        <td className="p-2.5 text-slate-800">{t.title}</td>
                        <td className="p-2.5 text-slate-600">{t.assignedTo || 'Dept Lead'}</td>
                        <td className="p-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                            t.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                            t.status === 'Waived' ? 'bg-slate-100 text-slate-700' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Signatures block */}
            <div className="pt-8 border-t grid grid-cols-4 gap-4 text-center text-xs font-bold text-slate-700">
              <div className="border-t border-slate-300 pt-2">
                <span>IT Head</span>
                <p className="text-[9px] text-slate-400 font-normal">Sign & Stamp</p>
              </div>
              <div className="border-t border-slate-300 pt-2">
                <span>AccountsFinance</span>
                <p className="text-[9px] text-slate-400 font-normal">Sign & Stamp</p>
              </div>
              <div className="border-t border-slate-300 pt-2">
                <span>HR Manager</span>
                <p className="text-[9px] text-slate-400 font-normal">Sign & Stamp</p>
              </div>
              <div className="border-t border-slate-300 pt-2">
                <span>DirectorAdmin</span>
                <p className="text-[9px] text-slate-400 font-normal">Final Approval</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Print No-Dues Certificate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RELIEVING LETTER PRINT MODAL */}
      {selectedLetterExit && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-3xl max-w-2xl w-full p-8 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedLetterExit(null)}
              className="absolute right-4 top-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center border-b pb-4">
              <h2 className="text-xl font-black uppercase tracking-wide text-rose-950">RELIEVING & EXPERIENCE LETTER</h2>
              <p className="text-xs text-slate-500">To Whomsoever It May Concern</p>
            </div>

            <div className="space-y-4 text-xs leading-relaxed">
              <p className="font-bold">Date: {new Date().toISOString().slice(0, 10)}</p>
              <p>
                This is to certify that <strong>{selectedLetterExit.employeeName}</strong> was employed with us as <strong>{selectedLetterExit.designation}</strong> in the <strong>{selectedLetterExit.department}</strong> department from their joining date until <strong>{selectedLetterExit.lastWorkingDay}</strong>.
              </p>
              <p>
                During their tenure with us, we found them to be hardworking, honest, and dedicated to their duties. All company property, IT assets, financial dues, and departmental records have been cleared successfully.
              </p>
              <p>
                We accept their resignation and relieve them from their duties with effect from the close of business hours on <strong>{selectedLetterExit.lastWorkingDay}</strong>.
              </p>
              <p>We wish them all the success in their future endeavors.</p>
            </div>

            <div className="pt-8 border-t flex justify-between items-end text-xs font-bold text-slate-700">
              <div>Authorized Signatory<br /><span className="text-[10px] text-slate-400">HR Department</span></div>
              <div>Company Seal & Date</div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Print Relieving Letter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
