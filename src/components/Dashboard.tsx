import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell, AreaChart, Area, CartesianGrid } from 'recharts';
import { 
  Users, Calendar, CreditCard, CheckCircle, TrendingUp, Briefcase, 
  Sparkles, Filter, ArrowRight, DollarSign, Activity, FileSpreadsheet, 
  Clock, AlertTriangle, ChevronRight, PieChart as PieIcon, Award,
  Bell, KeyRound, LifeBuoy, CheckCircle2, Lock, Unlock, UserCheck, UserX, X
} from 'lucide-react';
import { motion } from 'motion/react';
import { Employee, Attendance, PayrollRecord, FailedLoginAttempt, LeaveRequest } from '../types';

interface DashboardProps {
  employees: Employee[];
  attendance: Attendance[];
  payroll: PayrollRecord[];
  language: 'en' | 'hi';
  onNavigate?: (tab: 'dashboard' | 'employees' | 'attendance' | 'payroll' | 'notices_support' | 'admin') => void;
  passwordRequests?: any[];
  hrTickets?: any[];
  onNavigateNoticeSubTab?: (subTab: 'passwords' | 'tickets' | 'notices') => void;
  failedLogins?: FailedLoginAttempt[];
  onUpdateEmployee?: (updated: Employee) => Promise<void> | void;
  leaveRequests?: LeaveRequest[];
  onUpdateLeaveRequestStatus?: (id: string, status: 'Approved' | 'Rejected', remarks?: string) => Promise<void> | void;
}

export default function Dashboard({ 
  employees, 
  attendance, 
  payroll, 
  language, 
  onNavigate,
  passwordRequests = [],
  hrTickets = [],
  onNavigateNoticeSubTab,
  failedLogins = [],
  onUpdateEmployee,
  leaveRequests = [],
  onUpdateLeaveRequestStatus
}: DashboardProps) {
  // Format current month string (YYYY-MM) in local timezone to avoid offset issues
  const currentMonthStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }, []);

  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Real-time Dashboard Filters State
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [selectedBranch, setSelectedBranch] = useState<string>('All');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('All');
  const [isLeaveApprovalModalOpen, setIsLeaveApprovalModalOpen] = useState(false);
  const [isDeviceApprovalModalOpen, setIsDeviceApprovalModalOpen] = useState(false);
  const [activeDeviceTab, setActiveDeviceTab] = useState<'All' | 'Locks' | 'Registrations' | 'Logins'>('All');

  const pendingPasswordReqs = useMemo(() => {
    return (passwordRequests || []).filter((r: any) => r.status === 'Pending');
  }, [passwordRequests]);

  const pendingHrTkts = useMemo(() => {
    return (hrTickets || []).filter((r: any) => r.status === 'Pending');
  }, [hrTickets]);

  const deviceLockAlerts = useMemo(() => {
    const alerts: { logId: string; employee: Employee; timestamp: string }[] = [];
    const handledEmployeeIds = new Set<string>();

    (failedLogins || []).forEach(log => {
      if (log.reason === 'Device lock active') {
        const emp = employees.find(e => e.id.toLowerCase() === log.enteredId.toLowerCase());
        if (emp && emp.approvedDeviceId && !emp.allowMultipleDevices && !handledEmployeeIds.has(emp.id)) {
          alerts.push({
            logId: log.id,
            employee: emp,
            timestamp: log.timestamp
          });
          handledEmployeeIds.add(emp.id);
        }
      }
    });
    return alerts;
  }, [failedLogins, employees]);

  const pendingApprovalAlerts = useMemo(() => {
    return employees.filter(emp => emp.isApproved === false);
  }, [employees]);

  const pendingDeviceApprovals = useMemo(() => {
    return employees.filter(emp => !!emp.pendingDeviceApprovalCode);
  }, [employees]);

  const pendingLeaves = useMemo(() => {
    return (leaveRequests || []).filter(req => req.status === 'Pending');
  }, [leaveRequests]);

  const totalPending = pendingPasswordReqs.length + pendingHrTkts.length + deviceLockAlerts.length + pendingApprovalAlerts.length + pendingDeviceApprovals.length + pendingLeaves.length;

  // List of unique months available in system
  const monthOptions = useMemo(() => {
    const months = new Set<string>();
    months.add(currentMonthStr);
    
    payroll.forEach(p => {
      if (p.monthYear) months.add(p.monthYear);
    });
    
    attendance.forEach(a => {
      if (a.date) {
        months.add(a.date.slice(0, 7));
      }
    });

    return Array.from(months).filter(Boolean).sort().reverse();
  }, [payroll, attendance, currentMonthStr]);

  // List of unique departments
  const departmentOptions = useMemo(() => {
    const depts = new Set<string>();
    employees.forEach(emp => {
      if (emp.department) depts.add(emp.department);
    });
    return ['All', ...Array.from(depts)];
  }, [employees]);

  // List of unique branches
  const branchOptions = useMemo(() => {
    const branches = new Set<string>();
    employees.forEach(emp => {
      if (emp.branch) branches.add(emp.branch);
    });
    return ['All', ...Array.from(branches)];
  }, [employees]);

  // List of employees for selection
  const employeeOptions = useMemo(() => {
    return employees.map(emp => ({
      id: emp.id,
      name: emp.isActive !== false ? `${emp.name} (${emp.id})` : `${emp.name} (${emp.id}) - ${language === 'en' ? 'Inactive' : 'निष्क्रिय'}`
    }));
  }, [employees, language]);

  // Dynamic filtered datasets based on Month + Department + Branch + Employee filters
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesDept = selectedDept === 'All' || emp.department === selectedDept;
      const matchesBranch = selectedBranch === 'All' || emp.branch === selectedBranch;
      const matchesEmployee = selectedEmployeeId === 'All' || emp.id === selectedEmployeeId;
      return matchesDept && matchesBranch && matchesEmployee;
    });
  }, [employees, selectedDept, selectedBranch, selectedEmployeeId]);

  const activeEmployees = useMemo(() => {
    return filteredEmployees.filter(e => e.isActive);
  }, [filteredEmployees]);

  const todayAvailability = useMemo(() => {
    // Get all active employees under selected department and branch filters
    const activeStaff = employees.filter(e => {
      if (e.isActive === false) return false;
      const matchesDept = selectedDept === 'All' || e.department === selectedDept;
      const matchesBranch = selectedBranch === 'All' || e.branch === selectedBranch;
      const matchesEmployee = selectedEmployeeId === 'All' || e.id === selectedEmployeeId;
      return matchesDept && matchesBranch && matchesEmployee;
    });

    const presentList: { employee: Employee; record?: Attendance }[] = [];
    const leaveList: { employee: Employee; status: string; reason?: string; request?: LeaveRequest }[] = [];
    const absentList: { employee: Employee }[] = [];

    activeStaff.forEach(emp => {
      // Check attendance record first
      const attRecord = attendance.find(a => a.date === todayStr && a.employeeId === emp.id);
      
      // Check approved leave request covering today
      const activeLeave = (leaveRequests || []).find(req => {
        if (req.employeeId !== emp.id || req.status !== 'Approved') return false;
        const start = req.startDate;
        const end = req.endDate || req.startDate;
        return todayStr >= start && todayStr <= end;
      });

      if (attRecord) {
        if (attRecord.status === 'Present' || attRecord.status === 'Half Day') {
          presentList.push({ employee: emp, record: attRecord });
        } else if (attRecord.status === 'Leave') {
          leaveList.push({ 
            employee: emp, 
            status: attRecord.status, 
            reason: activeLeave?.reason || 'Leave recorded in attendance',
            request: activeLeave
          });
        } else {
          absentList.push({ employee: emp });
        }
      } else if (activeLeave) {
        leaveList.push({ 
          employee: emp, 
          status: 'Leave', 
          reason: activeLeave.reason,
          request: activeLeave
        });
      } else {
        absentList.push({ employee: emp });
      }
    });

    return {
      present: presentList,
      onLeave: leaveList,
      absent: absentList
    };
  }, [employees, attendance, leaveRequests, todayStr, selectedDept, selectedBranch, selectedEmployeeId]);

  // Attendance statistics for selected month / day
  const monthlyAttendance = useMemo(() => {
    return attendance.filter(a => {
      const matchesMonth = a.date.startsWith(selectedMonth);
      const emp = employees.find(e => e.id === a.employeeId);
      const matchesDept = selectedDept === 'All' || (emp && emp.department === selectedDept);
      const matchesBranch = selectedBranch === 'All' || (emp && emp.branch === selectedBranch);
      const matchesEmployee = selectedEmployeeId === 'All' || a.employeeId === selectedEmployeeId;
      return matchesMonth && matchesDept && matchesBranch && matchesEmployee;
    });
  }, [attendance, selectedMonth, selectedDept, selectedBranch, selectedEmployeeId, employees]);

  const todayAttendance = useMemo(() => {
    return attendance.filter(a => {
      const matchesDay = a.date === todayStr;
      const emp = employees.find(e => e.id === a.employeeId);
      const matchesDept = selectedDept === 'All' || (emp && emp.department === selectedDept);
      const matchesBranch = selectedBranch === 'All' || (emp && emp.branch === selectedBranch);
      const matchesEmployee = selectedEmployeeId === 'All' || a.employeeId === selectedEmployeeId;
      return matchesDay && matchesDept && matchesBranch && matchesEmployee;
    });
  }, [attendance, todayStr, selectedDept, selectedBranch, selectedEmployeeId, employees]);

  const presentTodayCount = useMemo(() => {
    return todayAttendance.filter(a => a.status === 'Present' || a.status === 'Half Day').length;
  }, [todayAttendance]);

  const attendanceRate = useMemo(() => {
    if (todayAttendance.length > 0) {
      return Math.round((presentTodayCount / todayAttendance.length) * 100);
    }
    // Fallback: use monthly attendance average
    if (monthlyAttendance.length > 0) {
      const presentCount = monthlyAttendance.filter(a => a.status === 'Present' || a.status === 'Half Day').length;
      return Math.round((presentCount / monthlyAttendance.length) * 100);
    }
    return 100;
  }, [todayAttendance, monthlyAttendance, presentTodayCount]);

  // Payroll calculations based on filtered month, department, branch, and employee
  const filteredPayroll = useMemo(() => {
    return payroll.filter(p => {
      const matchesMonth = p.monthYear === selectedMonth;
      const emp = employees.find(e => e.id === p.employeeId);
      const matchesDept = selectedDept === 'All' || (emp && emp.department === selectedDept);
      const matchesBranch = selectedBranch === 'All' || (emp && emp.branch === selectedBranch);
      const matchesEmployee = selectedEmployeeId === 'All' || p.employeeId === selectedEmployeeId;
      return matchesMonth && matchesDept && matchesBranch && matchesEmployee;
    });
  }, [payroll, selectedMonth, selectedDept, selectedBranch, selectedEmployeeId, employees]);

  const totalPayrollExpense = useMemo(() => {
    return filteredPayroll.reduce((acc, curr) => acc + (Number(curr.totalSalary) || 0), 0);
  }, [filteredPayroll]);

  const paidPayrollExpense = useMemo(() => {
    return filteredPayroll.filter(p => p.paymentStatus === 'Paid').reduce((acc, curr) => acc + (Number(curr.totalSalary) || 0), 0);
  }, [filteredPayroll]);

  const pendingPayrollExpense = useMemo(() => {
    return filteredPayroll.filter(p => p.paymentStatus === 'Pending').reduce((acc, curr) => acc + (Number(curr.totalSalary) || 0), 0);
  }, [filteredPayroll]);

  const payrollComplianceRate = useMemo(() => {
    if (filteredPayroll.length === 0) return 100;
    const paidCount = filteredPayroll.filter(p => p.paymentStatus === 'Paid').length;
    return Math.round((paidCount / filteredPayroll.length) * 100);
  }, [filteredPayroll]);

  // Department-wise breakdown statistics (using filteredEmployees to respect search & filter settings)
  const deptChartData = useMemo(() => {
    const deptMap: { [key: string]: { count: number; salary: number; active: number } } = {};
    filteredEmployees.forEach(emp => {
      const dept = (emp.department || 'Other').trim();
      if (!deptMap[dept]) {
        deptMap[dept] = { count: 0, salary: 0, active: 0 };
      }
      deptMap[dept].count += 1;
      const basicSal = Number(emp.basicSalary);
      deptMap[dept].salary += isNaN(basicSal) ? 0 : basicSal;
      if (emp.isActive) {
        deptMap[dept].active += 1;
      }
    });

    return Object.keys(deptMap).map(key => ({
      name: key,
      employees: deptMap[key].count,
      active: deptMap[key].active,
      salary: deptMap[key].salary,
    }));
  }, [filteredEmployees]);

  // Attendance trends for last 7 calendar days in local timezone
  const last7DaysData = useMemo(() => {
    const days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }).reverse();

    return days.map(date => {
      const dayAttendance = attendance.filter(a => {
        const matchesDay = a.date === date;
        const emp = employees.find(e => e.id === a.employeeId);
        const matchesDept = selectedDept === 'All' || (emp && emp.department === selectedDept);
        const matchesBranch = selectedBranch === 'All' || (emp && emp.branch === selectedBranch);
        const matchesEmployee = selectedEmployeeId === 'All' || a.employeeId === selectedEmployeeId;
        return matchesDay && matchesDept && matchesBranch && matchesEmployee;
      });
      
      const total = dayAttendance.length;
      const present = dayAttendance.filter(a => a.status === 'Present' || a.status === 'Half Day').length;
      const rate = total > 0 ? Math.round((present / total) * 100) : 0; // Default to 0 instead of 100 so empty days have visual differentiation
      
      const parts = date.split('-');
      const label = `${parts[2]}/${parts[1]}`;
      return {
        date: label,
        rate,
        present,
        total,
      };
    });
  }, [attendance, selectedDept, selectedBranch, selectedEmployeeId, employees]);

  // Payroll status pie dataset
  const pieData = useMemo(() => {
    return [
      { name: language === 'en' ? 'Paid' : 'भुगतान हुआ', value: paidPayrollExpense, color: '#10b981' },
      { name: language === 'en' ? 'Pending' : 'लंबित', value: pendingPayrollExpense || (paidPayrollExpense === 0 ? 0.01 : 0), color: '#f59e0b' },
    ];
  }, [paidPayrollExpense, pendingPayrollExpense, language]);

  // Translation configuration
  const t = {
    en: {
      dashboardCockpit: "Analytics Cockpit",
      realtimeInsights: "Real-Time System Insights",
      filterMonth: "Select Payroll Month",
      filterDept: "Department Segment",
      statsTitle: "Overview Metrics",
      totalEmp: "Registered Force",
      activeEmp: "Active Staff",
      presentToday: "Attendance Pulse",
      attendanceRate: "Attendance Ratio",
      monthExpense: "Monthly Payroll Pool",
      paid: "Disbursed Salary",
      pending: "Pending Approval",
      deptDist: "Departmental Resource Distribution",
      trendTitle: "Attendance Velocity (Last 7 Days)",
      breakdown: "Payroll Compliance & Volume",
      currency: "₹",
      headcount: "Staff count",
      salaryPool: "Basic Salary Pool (₹)",
      ratePercent: "Attendance Rate (%)",
      activeStatus: "Active",
      inactiveStatus: "Inactive",
      complianceLabel: "Compliance",
      quickActions: "Operations Launchpad",
      actionAddEmp: "Enlist New Employee",
      actionMarkAtt: "Log Daily Attendance",
      actionCalcPay: "Disburse Monthly Salaries",
      liveHighlights: "Intelligent Alerts",
      highlightActiveRatio: "Staff Utilization",
      highlightPayrollRun: "Disbursement Progress",
      highlightAttendance: "Presence Check",
      goodStanding: "All systems operational",
      pendingAlert: "Pending transactions need approval",
      noRecords: "No system transactions recorded for this combination.",
      viewReport: "Open Live Sheet"
    },
    hi: {
      dashboardCockpit: "एनालिटिक्स कॉकपिट",
      realtimeInsights: "वास्तविक समय सिस्टम इनसाइट्स",
      filterMonth: "पेरोल महीना चुनें",
      filterDept: "विभाग फ़िल्टर",
      statsTitle: "सिस्टम मुख्य मेट्रिक्स",
      totalEmp: "कुल कर्मचारी",
      activeEmp: "सक्रिय स्टाफ",
      presentToday: "आज की उपस्थिति",
      attendanceRate: "उपस्थिति दर",
      monthExpense: "मासिक पेरोल बजट",
      paid: "भुगतान हुआ वेतन",
      pending: "लंबित वेतन",
      deptDist: "विभाग अनुसार संसाधन आवंटन",
      trendTitle: "उपस्थिति रुझान (पिछले 7 दिन)",
      breakdown: "पेरोल अनुपालन और वॉल्यूम",
      currency: "₹",
      headcount: "कर्मचारी संख्या",
      salaryPool: "मूल वेतन बजट (₹)",
      ratePercent: "उपस्थिति दर (%)",
      activeStatus: "सक्रिय",
      inactiveStatus: "निष्क्रिय",
      complianceLabel: "अनुपालन",
      quickActions: "ऑपरेशंस लॉन्चपैड",
      actionAddEmp: "नया कर्मचारी जोड़ें",
      actionMarkAtt: "दैनिक उपस्थिति दर्ज करें",
      actionCalcPay: "मासिक वेतन गणना करें",
      liveHighlights: "इंटेलिजेंट अलर्ट",
      highlightActiveRatio: "स्टाफ उपयोग",
      highlightPayrollRun: "संवितरण प्रगति",
      highlightAttendance: "उपस्थिति की जांच",
      goodStanding: "सभी प्रणालियां सुचारू रूप से कार्यरत हैं",
      pendingAlert: "लंबित भुगतान पर ध्यान देने की आवश्यकता है",
      noRecords: "इस फ़िल्टर कॉम्बिनेशन के लिए कोई रिकॉर्ड उपलब्ध नहीं है।",
      viewReport: "लाइव शीट खोलें"
    }
  }[language];

  // Animated Container Varients
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <div className="space-y-3">
      
      {/* Dynamic Filter Pill Bar */}
      <div className="bg-white rounded-xl border border-gray-200/90 shadow-xs px-3 py-2 flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-emerald-50 text-[#03623c] rounded-lg">
            <Filter className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-[11px] font-black text-gray-950 font-display uppercase tracking-wider">{t.realtimeInsights}</h3>
            <p className="text-[9px] text-gray-600 font-mono font-black leading-none">SEGMENT & TIME COCKPIT</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Month Picker */}
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-extrabold text-gray-700 uppercase font-mono">{t.filterMonth}:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700 px-2 py-1 rounded-lg focus:outline-none focus:border-[#03623c] transition-all cursor-pointer"
            >
              {monthOptions.map(m => {
                // Prettier formatting
                const [year, month] = m.split('-');
                const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                const formattedName = monthNames[parseInt(month) - 1] ? `${monthNames[parseInt(month) - 1]} ${year}` : m;
                return (
                  <option key={m} value={m}>{formattedName}</option>
                );
              })}
            </select>
          </div>

          {/* Department Picker */}
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-extrabold text-gray-700 uppercase font-mono">{t.filterDept}:</span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700 px-2 py-1 rounded-lg focus:outline-none focus:border-[#03623c] transition-all cursor-pointer"
            >
              {departmentOptions.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Branch Picker */}
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-extrabold text-gray-700 uppercase font-mono">
              {language === 'en' ? 'Branch' : 'शाखा'}:
            </span>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700 px-2 py-1 rounded-lg focus:outline-none focus:border-[#03623c] transition-all cursor-pointer"
            >
              {branchOptions.map(branch => (
                <option key={branch} value={branch}>{branch}</option>
              ))}
            </select>
          </div>

          {/* Employee Picker */}
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-extrabold text-gray-700 uppercase font-mono">
              {language === 'en' ? 'Employee' : 'कर्मचारी'}:
            </span>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700 px-2 py-1 rounded-lg focus:outline-none focus:border-[#03623c] transition-all cursor-pointer max-w-[140px]"
            >
              <option value="All">{language === 'en' ? 'All Employees' : 'सभी कर्मचारी'}</option>
              {employeeOptions.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* PENDING ITEMS CONSOLIDATED SUMMARY CARD */}
      {totalPending > 0 && (
        <div 
          style={{ borderRadius: '12px' }}
          className="bg-amber-50 border border-amber-200/80 p-2.5 shadow-3xs relative overflow-hidden text-slate-800"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg shrink-0 animate-pulse">
                <Bell className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-[11px] font-black tracking-tight text-slate-900 uppercase">
                    {language === 'en' ? 'Urgent Actions Required' : 'त्वरित कार्रवाई आवश्यक'}
                  </h3>
                  <span className="bg-rose-100 text-rose-700 text-[9px] font-black px-1.5 py-0.25 rounded-md font-mono animate-bounce">
                    {totalPending} {language === 'en' ? 'Pending' : 'लंबित'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-semibold leading-none mt-0.5 hidden md:block">
                  {language === 'en' 
                    ? `Unresolved login/security or leave applications awaiting administrator decision.`
                    : `आपके निर्णय की प्रतीक्षा में सुरक्षा या अवकाश आवेदन लंबित हैं।`}
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-1.5 shrink-0 items-center">
              {pendingLeaves.length > 0 && (
                <button
                  onClick={() => setIsLeaveApprovalModalOpen(true)}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-[9px] font-black px-2.5 py-1 rounded-lg transition-all shadow-3xs flex items-center gap-1 uppercase tracking-wider cursor-pointer"
                >
                  <Calendar className="w-3 h-3" />
                  <span>{language === 'en' ? 'Approve Leaves' : 'छुट्टियां स्वीकृत करें'} ({pendingLeaves.length})</span>
                </button>
              )}
              {deviceLockAlerts.length + pendingApprovalAlerts.length + pendingDeviceApprovals.length > 0 && (
                <button
                  onClick={() => setIsDeviceApprovalModalOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-black px-2.5 py-1 rounded-lg transition-all shadow-3xs flex items-center gap-1 uppercase tracking-wider cursor-pointer"
                >
                  <Lock className="w-3 h-3" />
                  <span>{language === 'en' ? 'Approve Devices' : 'डिवाइस स्वीकृत करें'} ({deviceLockAlerts.length + pendingApprovalAlerts.length + pendingDeviceApprovals.length})</span>
                </button>
              )}
            </div>
          </div>

          {/* INLINE LIST FOR CRITICAL DEVICE LOCKS & APPROVALS */}
          {(deviceLockAlerts.length > 0 || pendingApprovalAlerts.length > 0 || pendingDeviceApprovals.length > 0 || pendingLeaves.length > 0) && (
            <div className="mt-2 pt-2 border-t border-amber-200/60 space-y-2">
              {/* Consolidated Device & Registration Approvals Row */}
              {deviceLockAlerts.length + pendingApprovalAlerts.length + pendingDeviceApprovals.length > 0 && (
                <div 
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-indigo-50/45 hover:bg-indigo-50/70 border border-indigo-200/50 rounded-lg transition-all animate-fadeIn"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1 bg-indigo-100 text-indigo-700 rounded-md shrink-0">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-black text-slate-800 leading-none">
                        {language === 'en' 
                          ? `Device & Account Security Approvals (${deviceLockAlerts.length + pendingApprovalAlerts.length + pendingDeviceApprovals.length})` 
                          : `डिवाइस और खाता सुरक्षा स्वीकृतियां (${deviceLockAlerts.length + pendingApprovalAlerts.length + pendingDeviceApprovals.length})`}
                      </p>
                      <p className="text-[9.5px] text-slate-505 font-semibold truncate mt-0.5 leading-none">
                        {language === 'en'
                          ? `Includes ${deviceLockAlerts.length} device locks, ${pendingApprovalAlerts.length} registrations, and ${pendingDeviceApprovals.length} logins.`
                          : `इसमें ${deviceLockAlerts.length} डिवाइस लॉक, ${pendingApprovalAlerts.length} पंजीकरण, और ${pendingDeviceApprovals.length} लॉगिन शामिल हैं।`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsDeviceApprovalModalOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-black px-2.5 py-1 rounded-md transition-all shadow-3xs flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <span>{language === 'en' ? 'Review & Approve' : 'समीक्षा और स्वीकृत करें'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Pending Leave Requests - Unified Row */}
              {pendingLeaves.length > 0 && (
                <div 
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-amber-50/45 hover:bg-amber-50/70 border border-amber-200/50 rounded-lg transition-all animate-fadeIn"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1 bg-amber-100 text-amber-700 rounded-md shrink-0">
                      <Calendar className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-black text-slate-800 leading-none">
                        {language === 'en' 
                          ? `Pending Leave Applications (${pendingLeaves.length})` 
                          : `लंबित अवकाश आवेदन (${pendingLeaves.length})`}
                      </p>
                      <p className="text-[9.5px] text-slate-505 font-semibold truncate mt-0.5 leading-none">
                        {language === 'en'
                          ? `There are ${pendingLeaves.length} leave application(s) awaiting decision.`
                          : `निर्णय की प्रतीक्षा में ${pendingLeaves.length} अवकाश आवेदन हैं।`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsLeaveApprovalModalOpen(true)}
                    className="bg-amber-600 hover:bg-amber-700 text-white text-[9px] font-black px-2.5 py-1 rounded-md transition-all shadow-3xs flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <span>{language === 'en' ? 'Review & Approve' : 'समीक्षा और स्वीकृत करें'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Bento Grid layout with stagger */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
      >
        
        {/* Bento Card 1: Headcount & Active Strength */}
        <motion.div 
          variants={itemVariants}
          className="bg-white p-3 rounded-xl border border-gray-200/90 shadow-3xs flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-xs transition-all duration-300 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-850 uppercase tracking-wider font-mono">{t.totalEmp}</span>
            <div className="bg-emerald-50 text-[#03623c] p-1.5 rounded-lg group-hover:bg-[#03623c] group-hover:text-white transition-all duration-300">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-gray-900 font-display leading-none tracking-tight">{filteredEmployees.length}</span>
              <span className="text-[10px] text-gray-600 font-extrabold">registered</span>
            </div>
            
            {/* Visual Mini Progress Bar */}
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-[9px] font-extrabold text-gray-700">
                <span className="flex items-center gap-1">
                  <span className="w-1 bg-emerald-500 rounded-full h-1"></span>
                  {activeEmployees.length} {t.activeStatus}
                </span>
                <span>{filteredEmployees.length - activeEmployees.length} {t.inactiveStatus}</span>
              </div>
              <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${filteredEmployees.length ? (activeEmployees.length / filteredEmployees.length) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bento Card 2: Attendance Rate + Radial Indicator */}
        <motion.div 
          variants={itemVariants}
          className="bg-white p-3 rounded-xl border border-gray-200/90 shadow-3xs flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-xs transition-all duration-300 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-850 uppercase tracking-wider font-mono">{t.presentToday}</span>
            <div className="bg-green-50 text-green-600 p-1.5 rounded-lg group-hover:bg-green-600 group-hover:text-white transition-all duration-300">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <div>
              <div className="flex items-baseline gap-0.5">
                <span className="text-2xl font-extrabold text-gray-900 font-display leading-none tracking-tight">
                  {todayAttendance.length > 0 ? presentTodayCount : '-'}
                </span>
                <span className="text-xs font-extrabold text-gray-600">
                  / {todayAttendance.length > 0 ? todayAttendance.length : activeEmployees.length}
                </span>
              </div>
              <p className="text-[9px] text-gray-600 font-extrabold uppercase mt-0.5 tracking-wider">{t.attendanceRate}</p>
            </div>

            {/* Custom SVG Radial Gauge */}
            <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-gray-100"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="transparent"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-emerald-500 transition-all duration-1000 ease-out"
                  strokeDasharray={`${attendanceRate}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[9px] font-black font-mono text-gray-950">{attendanceRate}%</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bento Card 3: Monthly Financial Total */}
        <motion.div 
          variants={itemVariants}
          className="bg-white p-3 rounded-xl border border-gray-200/90 shadow-3xs flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-xs transition-all duration-300 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-850 uppercase tracking-wider font-mono">{t.monthExpense}</span>
            <div className="bg-emerald-50 text-[#03623c] p-1.5 rounded-lg group-hover:bg-[#03623c] group-hover:text-white transition-all duration-300">
              <CreditCard className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5">
            <div className="flex items-baseline">
              <span className="text-xl font-extrabold text-gray-900 font-mono tracking-tight leading-none">
                {t.currency}{totalPayrollExpense.toLocaleString('en-IN')}
              </span>
            </div>
            
            {/* Paid vs Pending visual bar */}
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-[8px] font-extrabold text-gray-700">
                <span className="text-emerald-700 font-black">Paid: {Math.round((paidPayrollExpense / (totalPayrollExpense || 1)) * 100)}%</span>
                <span className="text-amber-700 font-black">Pending: {Math.round((pendingPayrollExpense / (totalPayrollExpense || 1)) * 100)}%</span>
              </div>
              <div className="w-full h-1 bg-gray-100 rounded-full flex overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full transition-all duration-500"
                  style={{ width: `${totalPayrollExpense ? (paidPayrollExpense / totalPayrollExpense) * 100 : 0}%` }}
                ></div>
                <div 
                  className="bg-amber-400 h-full transition-all duration-500"
                  style={{ width: `${totalPayrollExpense ? (pendingPayrollExpense / totalPayrollExpense) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bento Card 4: Disbursed vs Pending Overview */}
        <motion.div 
          variants={itemVariants}
          className="bg-white p-3 rounded-xl border border-gray-200/90 shadow-3xs flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-xs transition-all duration-300 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-850 uppercase tracking-wider font-mono">{t.paid}</span>
            <div className="bg-emerald-50 text-emerald-600 p-1.5 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
              <CheckCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5 space-y-1.5">
            <div>
              <span className="text-xl font-extrabold text-emerald-600 font-mono tracking-tight leading-none">
                {t.currency}{paidPayrollExpense.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex items-center justify-between text-[9px] font-black border-t border-gray-100 pt-1.5">
              <span className="text-gray-700 uppercase">{t.pending}</span>
              <span className="text-amber-700 font-mono font-extrabold">
                {t.currency}{pendingPayrollExpense.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </motion.div>

      </motion.div>

      {/* Main Grid Content - Multi-Column Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        
        {/* Graph Area 1: Attendance Trends (Last 7 Days) */}
        <div className="bg-white p-3 rounded-xl border border-gray-200/90 shadow-3xs lg:col-span-2 flex flex-col justify-between min-h-[250px]">
          <div className="flex items-center justify-between mb-2 border-b border-gray-50 pb-1.5">
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-[#03623c]" />
              <h4 className="text-[11px] font-bold text-gray-800 uppercase tracking-wider font-display">{t.trendTitle}</h4>
            </div>
            <span className="text-[8px] font-mono bg-emerald-50 text-[#03623c] font-bold px-1.5 py-0.25 rounded border border-emerald-100/50 uppercase">
              Presence velocity
            </span>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7DaysData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#03623c" stopOpacity={0.9}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.4}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} fontWeight={600} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={9} fontWeight={600} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip 
                  cursor={{ fill: 'rgba(241, 245, 249, 0.4)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const hasRecords = data.total > 0;
                      return (
                        <div className="bg-white/95 backdrop-blur-md p-2 rounded-lg border border-gray-200 shadow-md text-[10px] font-sans">
                          <p className="font-bold text-gray-800 mb-0.5">Date: {data.date}</p>
                          {hasRecords ? (
                            <>
                              <p className="text-[#03623c] font-semibold flex items-center gap-1">
                                <span className="w-1 bg-[#03623c] rounded-full h-1"></span>
                                Attendance: {data.rate}%
                              </p>
                              <p className="text-gray-500 font-medium">
                                Present: {data.present} / {data.total}
                              </p>
                            </>
                          ) : (
                            <p className="text-amber-600 font-semibold flex items-center gap-1">
                              <span className="w-1 bg-amber-500 rounded-full h-1 animate-pulse"></span>
                              {language === 'en' ? 'No Records Marked' : 'कोई रिकॉर्ड दर्ज नहीं'}
                            </p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="rate" fill="url(#colorAttendance)" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graph Area 2: Payroll Breakdown Circle */}
        <div className="bg-white p-3 rounded-xl border border-gray-200/90 shadow-3xs flex flex-col justify-between min-h-[250px]">
          <div className="flex items-center justify-between mb-2 border-b border-gray-50 pb-1.5">
            <div className="flex items-center gap-2">
              <PieIcon className="w-3.5 h-3.5 text-emerald-500" />
              <h4 className="text-[11px] font-bold text-gray-800 uppercase tracking-wider font-display">{t.breakdown}</h4>
            </div>
            <span className="text-[8px] font-mono bg-emerald-50 text-emerald-600 font-bold px-1.5 py-0.25 rounded border border-emerald-100 uppercase">
              Ratio: {payrollComplianceRate}%
            </span>
          </div>

          <div className="h-32 flex items-center justify-center relative">
            {totalPayrollExpense > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={36}
                      outerRadius={50}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0];
                          return (
                            <div className="bg-white/95 backdrop-blur-md p-1.5 rounded-lg border border-gray-200 shadow-md text-[9px] font-mono">
                              <span className="font-bold text-gray-800">{data.name}:</span> ₹{data.value.toLocaleString('en-IN')}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Visual center labels */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[8px] font-mono uppercase text-gray-600 font-extrabold">{t.complianceLabel}</span>
                  <span className="text-sm font-extrabold text-emerald-600 font-display leading-none">{payrollComplianceRate}%</span>
                </div>
              </>
            ) : (
              <div className="text-center py-4 text-gray-800 space-y-1">
                <AlertTriangle className="w-5 h-5 mx-auto text-amber-500 animate-pulse" />
                <p className="text-xs font-bold">{t.noRecords}</p>
                <p className="text-[9px] font-mono text-gray-600 font-extrabold">Generate payroll records in the Payroll sheet</p>
              </div>
            )}
          </div>

          {/* Table list format inside bento card */}
          <div className="space-y-1 border-t border-gray-100 pt-2">
            <div className="flex items-center justify-between text-[11px] font-extrabold">
              <span className="flex items-center text-gray-800">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5"></span>
                {language === 'en' ? 'Disbursed' : 'भुगतान हुआ'}
              </span>
              <span className="font-extrabold text-gray-950 font-mono">
                {t.currency}{paidPayrollExpense.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-extrabold">
              <span className="flex items-center text-gray-800">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-1.5"></span>
                {language === 'en' ? 'Pending Disbursal' : 'लंबित वेतन'}
              </span>
              <span className="font-extrabold text-gray-950 font-mono">
                {t.currency}{pendingPayrollExpense.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Double Bar Chart & Launchpad Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        
        {/* Chart Area 3: Department Resource Distribution */}
        <div className="bg-white p-3 rounded-xl border border-gray-200/90 shadow-3xs lg:col-span-2 flex flex-col justify-between min-h-[250px]">
          <div className="flex items-center justify-between mb-2 border-b border-gray-50 pb-1.5">
            <div className="flex items-center gap-2">
              <Briefcase className="w-3.5 h-3.5 text-[#03623c]" />
              <h4 className="text-[11px] font-bold text-gray-800 uppercase tracking-wider font-display">{t.deptDist}</h4>
            </div>
            <span className="text-[8px] font-mono bg-emerald-50 text-[#03623c] font-bold px-1.5 py-0.25 rounded border border-emerald-100/50 uppercase">
              Financial & Staff Pool
            </span>
          </div>

          <div className="h-44 w-full">
            {deptChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSalary" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.4}/>
                    </linearGradient>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#03623c" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#024d2e" stopOpacity={0.4}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} fontWeight={600} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" stroke="#03623c" fontSize={9} fontWeight={600} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={9} fontWeight={600} tickLine={false} axisLine={false} />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white/95 backdrop-blur-md p-2 rounded-lg border border-gray-200 shadow-md text-[10px]">
                            <p className="font-bold text-gray-800 border-b border-gray-100 pb-0.5 mb-1">{data.name}</p>
                            <p className="text-[#03623c] font-semibold">Staff: {data.employees} ({data.active} Active)</p>
                            <p className="text-emerald-700 font-semibold font-mono">Salary Pool: ₹{data.salary.toLocaleString('en-IN')}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend verticalAlign="top" height={24} iconType="circle" wrapperStyle={{ fontSize: 9, fontWeight: 600 }} />
                  <Bar yAxisId="left" dataKey="employees" name={language === 'en' ? "Total Staff" : "कर्मचारी"} fill="url(#colorCount)" radius={[3, 3, 0, 0]} barSize={12} />
                  <Bar yAxisId="right" dataKey="salary" name={language === 'en' ? "Basic Salary Budget" : "कुल मूल वेतन"} fill="url(#colorSalary)" radius={[3, 3, 0, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-gray-400 font-medium">
                No departmental metrics found. Please register employees.
              </div>
            )}
          </div>
        </div>

        {/* Interactive Launchpad / Operations Column */}
        <div className="space-y-3 flex flex-col no-print">
          
          {/* Quick Actions Panel */}
          {onNavigate && (
            <div className="bg-white p-3 rounded-xl border border-gray-200/90 shadow-3xs flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 mb-2 border-b border-gray-50 pb-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                  <h4 className="text-[11px] font-bold text-gray-800 uppercase tracking-wider font-display">{t.quickActions}</h4>
                </div>
                
                <div className="space-y-1.5">
                  <button 
                    onClick={() => onNavigate('employees')}
                    className="w-full flex items-center justify-between p-2 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-emerald-50/30 hover:border-emerald-200 text-xs font-bold text-gray-700 hover:text-[#03623c] transition-all cursor-pointer group"
                  >
                    <span className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-[#03623c]" />
                      {t.actionAddEmp}
                    </span>
                    <ChevronRight className="w-3 h-3 text-gray-400 group-hover:translate-x-0.5 transition-all" />
                  </button>

                  <button 
                    onClick={() => onNavigate('attendance')}
                    className="w-full flex items-center justify-between p-2 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-emerald-50/30 hover:border-emerald-200 text-xs font-bold text-gray-700 hover:text-green-700 transition-all cursor-pointer group"
                  >
                    <span className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-green-500" />
                      {t.actionMarkAtt}
                    </span>
                    <ChevronRight className="w-3 h-3 text-gray-400 group-hover:translate-x-0.5 transition-all" />
                  </button>

                  <button 
                    onClick={() => onNavigate('payroll')}
                    className="w-full flex items-center justify-between p-2 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-emerald-50/30 hover:border-emerald-200 text-xs font-bold text-gray-700 hover:text-[#03623c] transition-all cursor-pointer group"
                  >
                    <span className="flex items-center gap-2">
                      <CreditCard className="w-3.5 h-3.5 text-[#03623c]" />
                      {t.actionCalcPay}
                    </span>
                    <ChevronRight className="w-3 h-3 text-gray-400 group-hover:translate-x-0.5 transition-all" />
                  </button>
                </div>
              </div>

              {/* Monospace Quick Status Clock */}
              <div className="mt-2.5 pt-1.5 border-t border-gray-100 flex items-center justify-between text-[9px] font-mono font-extrabold text-gray-700">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-gray-600" />
                  UTC Sync:
                </span>
                <span className="text-green-700 font-extrabold bg-green-50 px-1 py-0.25 rounded border border-green-200 uppercase tracking-wider">Live</span>
              </div>
            </div>
          )}

          {/* Rule-Based System Alerts Panel */}
          <div className="bg-white p-3 rounded-xl border border-gray-200/90 shadow-3xs flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 mb-2 border-b border-gray-50 pb-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-[#03623c]" />
                <h4 className="text-[11px] font-bold text-gray-800 uppercase tracking-wider font-display">{t.liveHighlights}</h4>
              </div>

              <div className="space-y-2 text-[10.5px] font-semibold text-gray-800">
                {/* Rule 1: Active Staff Ratio */}
                <div className="flex items-start gap-1.5">
                  <div className={`p-0.5 rounded-full shrink-0 mt-0.5 ${activeEmployees.length === filteredEmployees.length ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                    <Activity className="w-2.5 h-2.5" />
                  </div>
                  <div>
                    <p className="font-black text-gray-950 leading-none mb-0.5">{t.highlightActiveRatio}</p>
                    <p className="text-gray-650 text-[9.5px] font-bold leading-tight">
                      {activeEmployees.length}/{filteredEmployees.length} active staff.
                    </p>
                  </div>
                </div>

                {/* Rule 2: Payroll Run Check */}
                <div className="flex items-start gap-1.5">
                  <div className={`p-0.5 rounded-full shrink-0 mt-0.5 ${pendingPayrollExpense === 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                    <CheckCircle className="w-2.5 h-2.5" />
                  </div>
                  <div>
                    <p className="font-black text-gray-950 leading-none mb-0.5">{t.highlightPayrollRun}</p>
                    <p className="text-gray-650 text-[9.5px] font-bold leading-tight">
                      {pendingPayrollExpense === 0 ? t.goodStanding : `₹${pendingPayrollExpense.toLocaleString('en-IN')} pending approval.`}
                    </p>
                  </div>
                </div>

                {/* Rule 3: Today's Attendance Check */}
                <div className="flex items-start gap-1.5">
                  <div className={`p-0.5 rounded-full shrink-0 mt-0.5 ${todayAttendance.length > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-emerald-50 text-[#03623c]'}`}>
                    <Calendar className="w-2.5 h-2.5" />
                  </div>
                  <div>
                    <p className="font-black text-gray-950 leading-none mb-0.5">{t.highlightAttendance}</p>
                    <p className="text-gray-650 text-[9.5px] font-bold leading-tight">
                      {todayAttendance.length > 0 ? `Attendance rate: ${attendanceRate}%.` : "Today's logs pending."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Micro Badge */}
            <div className="mt-2 text-[8px] font-black text-gray-700 uppercase text-center tracking-widest leading-none bg-gray-50 py-1 rounded border border-gray-200/60 font-mono">
              {language === 'en' ? "RATHI BUILDMART PORTAL" : "राठी बिल्डमार्ट पोर्टल"}
            </div>
          </div>

        </div>

      </div>

      {/* TODAY'S LIVE STAFF RADAR (AVAILABLE vs ON LEAVE) */}
      <div className="bg-white p-3.5 rounded-xl border border-gray-200/95 shadow-3xs space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-gray-100 pb-2">
          <div>
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span>{language === 'en' ? "Today's Live Staff Radar" : "आज का लाइव स्टाफ रडार"}</span>
            </h4>
            <p className="text-[10px] text-gray-500 font-bold leading-tight">
              {language === 'en' 
                ? "Real-time presence monitoring based on check-ins and approved leaves."
                : "चेक-इन और स्वीकृत छुट्टियों के आधार पर रियल-टाइम प्रेजेंस मॉनिटरिंग।"}
            </p>
          </div>
          <div className="flex items-center gap-1 font-mono text-[9px] font-extrabold text-slate-500 bg-slate-50 border border-slate-150 px-2 py-0.5 rounded-lg">
            <span>📅 {language === 'en' ? "DATE:" : "तारीख:"}</span>
            <span className="text-slate-950 font-black">{todayStr}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          
          {/* Column 1: Available / Present Today */}
          <div className="bg-emerald-50/40 rounded-xl p-2.5 border border-emerald-100/60 space-y-2">
            <div className="flex items-center justify-between border-b border-emerald-100/50 pb-1.5">
              <span className="text-[11px] font-black text-emerald-800 uppercase tracking-wide flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                {language === 'en' ? 'Available Today' : 'आज उपस्थित/उपलब्ध'}
              </span>
              <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-1.5 py-0.25 rounded-full font-mono">
                {todayAvailability.present.length}
              </span>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {todayAvailability.present.length === 0 ? (
                <div className="py-6 text-center text-[10px] text-emerald-600/60 font-bold">
                  {language === 'en' ? 'No check-ins logged yet.' : 'अभी तक कोई चेक-इन नहीं मिला।'}
                </div>
              ) : (
                todayAvailability.present.map(({ employee, record }) => (
                  <div key={employee.id} className="bg-white p-2 rounded-lg border border-emerald-200/40 shadow-3xs flex items-center justify-between hover:border-emerald-300/80 transition-colors">
                    <div className="min-w-0">
                      <div className="text-[11px] font-black text-slate-800 leading-tight truncate">{employee.name}</div>
                      <div className="text-[9px] text-slate-400 font-mono font-bold uppercase truncate">{employee.id} • {employee.department}</div>
                    </div>
                    {record && (
                      <span className="text-[8.5px] font-black font-mono bg-emerald-50 text-emerald-700 px-1 py-0.25 rounded border border-emerald-150 shrink-0">
                        ⏱️ {record.punchIn ? record.punchIn.slice(0, 5) : 'Present'}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column 2: On Leave Today */}
          <div className="bg-amber-50/40 rounded-xl p-2.5 border border-amber-100/60 space-y-2">
            <div className="flex items-center justify-between border-b border-amber-100/50 pb-1.5">
              <span className="text-[11px] font-black text-amber-800 uppercase tracking-wide flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                {language === 'en' ? 'On Leave Today' : 'आज छुट्टी पर'}
              </span>
              <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-1.5 py-0.25 rounded-full font-mono">
                {todayAvailability.onLeave.length}
              </span>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {todayAvailability.onLeave.length === 0 ? (
                <div className="py-6 text-center text-[10px] text-amber-600/60 font-bold">
                  {language === 'en' ? 'No leaves scheduled today.' : 'आज कोई छुट्टी पर नहीं है।'}
                </div>
              ) : (
                todayAvailability.onLeave.map(({ employee, reason, request }) => (
                  <div key={employee.id} className="bg-white p-2 rounded-lg border border-amber-200/40 shadow-3xs hover:border-amber-300/80 transition-colors">
                    <div className="flex justify-between items-start gap-1">
                      <div className="min-w-0">
                        <div className="text-[11px] font-black text-slate-800 leading-tight truncate">{employee.name}</div>
                        <div className="text-[9px] text-slate-400 font-mono font-bold uppercase truncate">{employee.id} • {employee.department}</div>
                      </div>
                      {request && (
                        <span className="text-[8px] font-black font-mono bg-amber-50 text-amber-700 px-1 py-0.25 rounded border border-amber-150 uppercase shrink-0">
                          {request.leaveType}
                        </span>
                      )}
                    </div>
                    {reason && (
                      <div className="text-[9px] text-slate-500 font-bold mt-1 bg-amber-50/50 p-1 rounded border border-amber-100/40 italic truncate">
                        "{reason}"
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column 3: Absent / Not Checked In */}
          <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/60 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-200/50 pb-1.5">
              <span className="text-[11px] font-black text-slate-700 uppercase tracking-wide flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-pulse"></span>
                {language === 'en' ? 'Absent / Not Checked-In' : 'अनुपस्थित / कोई लॉग नहीं'}
              </span>
              <span className="bg-slate-150 text-slate-700 text-[9px] font-black px-1.5 py-0.25 rounded-full font-mono">
                {todayAvailability.absent.length}
              </span>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {todayAvailability.absent.length === 0 ? (
                <div className="py-6 text-center text-[10px] text-slate-500/60 font-bold">
                  {language === 'en' ? 'All active staff have logged presence.' : 'सभी कर्मचारियों का प्रेजेंस लॉग है।'}
                </div>
              ) : (
                todayAvailability.absent.map(({ employee }) => (
                  <div key={employee.id} className="bg-white p-2 rounded-lg border border-slate-100 shadow-3xs flex items-center justify-between hover:border-slate-200/80 transition-colors">
                    <div className="min-w-0">
                      <div className="text-[11px] font-black text-slate-800 leading-tight truncate">{employee.name}</div>
                      <div className="text-[9px] text-slate-400 font-mono font-bold uppercase truncate">{employee.id} • {employee.department}</div>
                    </div>
                    <span className="text-[8px] font-black font-mono bg-rose-50 text-rose-600 px-1 py-0.25 rounded border border-rose-100 uppercase shrink-0">
                      {language === 'en' ? 'Unreported' : 'रिपोर्ट नहीं'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Leave Approval Modal popup */}
      {isLeaveApprovalModalOpen && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col border border-gray-150 animate-zoomIn">
            
            {/* Modal Header */}
            <div className="bg-slate-50 p-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-rose-600" />
                  <span>
                    {language === 'en' ? 'Pending Leave Applications' : 'लंबित अवकाश आवेदन'}
                  </span>
                  <span className="bg-rose-100 text-rose-700 text-xs font-black px-2 py-0.5 rounded-full font-mono">
                    {pendingLeaves.length}
                  </span>
                </h3>
                <p className="text-[11px] text-gray-500 font-bold mt-0.5">
                  {language === 'en' 
                    ? 'Review, add remarks, and approve or reject employee leave requests.'
                    : 'कर्मचारी अवकाश अनुरोधों की समीक्षा करें, टिप्पणी जोड़ें और स्वीकृत या अस्वीकृत करें।'}
                </p>
              </div>
              <button 
                onClick={() => setIsLeaveApprovalModalOpen(false)}
                className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-4 space-y-4 bg-slate-55">
              {pendingLeaves.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="inline-flex p-3 bg-emerald-50 text-[#03623c] rounded-full mb-3">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-xs font-black text-slate-800">
                    {language === 'en' ? 'All Clear!' : 'सब ठीक है!'}
                  </h4>
                  <p className="text-[11px] text-gray-500 font-bold mt-1">
                    {language === 'en' ? 'No pending leave applications to process.' : 'प्रक्रिया के लिए कोई लंबित अवकाश आवेदन नहीं है।'}
                  </p>
                </div>
              ) : (
                pendingLeaves.map((req) => (
                  <div 
                    key={req.id} 
                    className="flex flex-col gap-3.5 p-4 bg-white border border-gray-200 shadow-3xs rounded-xl hover:border-amber-300 transition-colors duration-200"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-amber-50 text-amber-600 rounded-lg shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-slate-800">{req.employeeName}</span>
                          <span className="text-[9px] font-black font-mono bg-amber-150/50 text-amber-800 px-1.5 py-0.25 rounded">
                            {req.employeeId}
                          </span>
                          <span className="text-[10px] font-bold text-amber-600 uppercase bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100/30">
                            {req.leaveType}
                          </span>
                          <span className="text-[10px] font-extrabold text-slate-500">
                            ({req.durationDays} {req.durationDays === 1 ? (language === 'en' ? 'Day' : 'दिन') : (language === 'en' ? 'Days' : 'दिन')})
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-750 font-black mt-1.5 font-mono">
                          📅 {req.startDate} {req.endDate && req.endDate !== req.startDate ? ` ${language === 'en' ? 'to' : 'से'} ${req.endDate}` : ''}
                        </p>
                        <p className="text-[11px] text-slate-600 font-semibold italic mt-1 bg-slate-50/50 p-2 rounded border border-slate-100">
                          "{req.reason}"
                        </p>
                      </div>
                    </div>
                    
                    {/* Action Block */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 border-t border-gray-100">
                      <div className="flex-1">
                        <input 
                          type="text"
                          placeholder={language === 'en' ? 'Remarks (optional)...' : 'टिप्पणी (वैकल्पिक)...'}
                          id={`modal-remarks-${req.id}`}
                          className="px-3 py-2 text-[11px] border border-gray-200 bg-white rounded-lg font-semibold focus:outline-none focus:border-[#03623c] w-full shadow-3xs"
                        />
                      </div>
                      <div className="flex gap-2 justify-end shrink-0">
                        <button
                          onClick={async () => {
                            if (onUpdateLeaveRequestStatus) {
                              const remarksInput = document.getElementById(`modal-remarks-${req.id}`) as HTMLInputElement;
                              const remarks = remarksInput ? remarksInput.value : '';
                              await onUpdateLeaveRequestStatus(req.id, 'Approved', remarks);
                            }
                          }}
                          className="bg-[#03623c] hover:bg-[#02492d] text-white text-[10px] font-black px-4 py-2 rounded-lg transition-all shadow-3xs flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                          <span>{language === 'en' ? 'Approve' : 'स्वीकार करें'}</span>
                        </button>
                        <button
                          onClick={async () => {
                            if (onUpdateLeaveRequestStatus) {
                              const remarksInput = document.getElementById(`modal-remarks-${req.id}`) as HTMLInputElement;
                              const remarks = remarksInput ? remarksInput.value : '';
                              await onUpdateLeaveRequestStatus(req.id, 'Rejected', remarks);
                            }
                          }}
                          className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black px-4 py-2 rounded-lg transition-all shadow-3xs flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5 text-rose-200" />
                          <span>{language === 'en' ? 'Reject' : 'अस्वीकार'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
              <span className="text-[10px] text-gray-500 font-bold">
                {language === 'en' 
                  ? `Showing ${pendingLeaves.length} unresolved request(s).` 
                  : `कुल ${pendingLeaves.length} लंबित अनुरोध प्रदर्शित हैं।`}
              </span>
              <button
                onClick={() => setIsLeaveApprovalModalOpen(false)}
                className="bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-black px-4 py-2 rounded-lg cursor-pointer"
              >
                {language === 'en' ? 'Close' : 'बंद करें'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Device Lock & Registration Approvals Modal popup */}
      {isDeviceApprovalModalOpen && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col border border-gray-150 animate-zoomIn">
            
            {/* Modal Header */}
            <div className="bg-slate-50 p-4 border-b border-gray-200 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Lock className="w-4 h-4 text-indigo-600" />
                  <span>
                    {language === 'en' ? 'Device & Account Security Approvals' : 'डिवाइस और खाता सुरक्षा स्वीकृतियां'}
                  </span>
                  <span className="bg-indigo-100 text-indigo-700 text-xs font-black px-2 py-0.5 rounded-full font-mono">
                    {deviceLockAlerts.length + pendingApprovalAlerts.length + pendingDeviceApprovals.length}
                  </span>
                </h3>
                <p className="text-[11px] text-gray-500 font-bold mt-0.5">
                  {language === 'en' 
                    ? 'Review, reset device locks, approve registrations, and issue OTPs.'
                    : 'समीक्षा करें, डिवाइस लॉक रीसेट करें, पंजीकरण स्वीकृत करें और ओटीपी जारी करें।'}
                </p>
              </div>
              <button 
                onClick={() => setIsDeviceApprovalModalOpen(false)}
                className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-gray-200 bg-slate-50 px-4 pt-1 gap-2 shrink-0">
              <button
                onClick={() => setActiveDeviceTab('All')}
                className={`px-3 py-2 text-[11px] font-black uppercase tracking-wider border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeDeviceTab === 'All'
                    ? 'border-indigo-600 text-indigo-700 font-black'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <span>{language === 'en' ? 'All' : 'सभी'}</span>
                <span className="bg-slate-200 text-slate-800 text-[9px] font-bold px-1.5 py-0.25 rounded-full font-mono">
                  {deviceLockAlerts.length + pendingApprovalAlerts.length + pendingDeviceApprovals.length}
                </span>
              </button>
              
              <button
                onClick={() => setActiveDeviceTab('Locks')}
                className={`px-3 py-2 text-[11px] font-black uppercase tracking-wider border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeDeviceTab === 'Locks'
                    ? 'border-indigo-600 text-indigo-700 font-black'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <span>{language === 'en' ? 'Locks' : 'डिवाइस लॉक'}</span>
                {deviceLockAlerts.length > 0 && (
                  <span className="bg-rose-100 text-rose-700 text-[9px] font-black px-1.5 py-0.25 rounded-full font-mono">
                    {deviceLockAlerts.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveDeviceTab('Registrations')}
                className={`px-3 py-2 text-[11px] font-black uppercase tracking-wider border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeDeviceTab === 'Registrations'
                    ? 'border-indigo-600 text-indigo-700 font-black'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <span>{language === 'en' ? 'Registrations' : 'नए पंजीकरण'}</span>
                {pendingApprovalAlerts.length > 0 && (
                  <span className="bg-indigo-100 text-indigo-700 text-[9px] font-black px-1.5 py-0.25 rounded-full font-mono">
                    {pendingApprovalAlerts.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveDeviceTab('Logins')}
                className={`px-3 py-2 text-[11px] font-black uppercase tracking-wider border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeDeviceTab === 'Logins'
                    ? 'border-indigo-600 text-indigo-700 font-black'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <span>{language === 'en' ? 'Logins / OTP' : 'लॉगिन / ओटीपी'}</span>
                {pendingDeviceApprovals.length > 0 && (
                  <span className="bg-amber-100 text-amber-700 text-[9px] font-black px-1.5 py-0.25 rounded-full font-mono">
                    {pendingDeviceApprovals.length}
                  </span>
                )}
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-4 space-y-4 bg-slate-50/50 flex-1">
              {deviceLockAlerts.length + pendingApprovalAlerts.length + pendingDeviceApprovals.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="inline-flex p-3 bg-emerald-50 text-[#03623c] rounded-full mb-3">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-xs font-black text-slate-800">
                    {language === 'en' ? 'Security Cleared!' : 'सुरक्षा संबंधी सब ठीक है!'}
                  </h4>
                  <p className="text-[11px] text-gray-500 font-bold mt-1">
                    {language === 'en' ? 'No pending device locks or account security requests.' : 'कोई लंबित डिवाइस लॉक या खाता सुरक्षा अनुरोध नहीं है।'}
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Category 1: Device Lock Alerts list */}
                  {(activeDeviceTab === 'All' || activeDeviceTab === 'Locks') && deviceLockAlerts.length > 0 && (
                    <div className="space-y-3">
                      {(activeDeviceTab === 'All') && (
                        <h4 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest font-mono">
                          ⚠️ {language === 'en' ? 'Active Device Lockouts' : 'सक्रिय डिवाइस लॉकआउट'} ({deviceLockAlerts.length})
                        </h4>
                      )}
                      {deviceLockAlerts.map(({ logId, employee, timestamp }) => (
                        <div 
                          key={`lock-${logId}-${employee.id}`} 
                          className="flex flex-col gap-3.5 p-4 bg-white border border-rose-200 shadow-3xs rounded-xl hover:border-rose-400 transition-all duration-200"
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg shrink-0">
                              <Lock className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-black text-slate-800">{employee.name}</span>
                                <span className="text-[9px] font-black font-mono bg-rose-150/50 text-rose-800 px-1.5 py-0.25 rounded">
                                  {employee.id}
                                </span>
                                <span className="text-[10px] font-extrabold text-slate-500 uppercase bg-slate-100 px-1.5 py-0.5 rounded">
                                  {employee.department} • {employee.branch}
                                </span>
                              </div>
                              <p className="text-[11px] text-rose-600 font-semibold mt-1">
                                {language === 'en' 
                                  ? `Device lockout active. Tried to login from another device at ${timestamp}.`
                                  : `डिवाइस लॉकआउट सक्रिय है। ${timestamp} पर किसी अन्य डिवाइस से लॉगिन करने का प्रयास किया गया था।`}
                              </p>
                            </div>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex gap-2 justify-end pt-2 border-t border-gray-100 shrink-0">
                            <button
                              onClick={async () => {
                                if (onUpdateEmployee) {
                                  await onUpdateEmployee({ ...employee, approvedDeviceId: '' });
                                }
                              }}
                              className="bg-[#03623c] hover:bg-[#02492d] text-white text-[10px] font-black px-3 py-2 rounded-lg transition-all shadow-3xs flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <span>🔄 {language === 'en' ? 'Reset Device Lock' : 'डिवाइस लॉक अनलॉक'}</span>
                            </button>
                            <button
                              onClick={async () => {
                                if (onUpdateEmployee) {
                                  await onUpdateEmployee({ ...employee, allowMultipleDevices: true });
                                }
                              }}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black px-3 py-2 rounded-lg transition-all shadow-3xs flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <span>📱 {language === 'en' ? 'Allow Multi-Device' : 'मल्टी-डिवाइस अनुमति दें'}</span>
                            </button>
                            <button
                              onClick={async () => {
                                if (onUpdateEmployee) {
                                  await onUpdateEmployee({ ...employee, isApproved: false, approvedDeviceId: '' });
                                }
                              }}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-800 text-[10px] font-bold border border-rose-200/60 px-3 py-2 rounded-lg transition-all cursor-pointer"
                            >
                              <span>⚠️ {language === 'en' ? 'Reset Account' : 'खाता रीसेट करें'}</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Category 2: Pending Registrations list */}
                  {(activeDeviceTab === 'All' || activeDeviceTab === 'Registrations') && pendingApprovalAlerts.length > 0 && (
                    <div className="space-y-3 pt-2">
                      {(activeDeviceTab === 'All') && (
                        <h4 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest font-mono">
                          👤 {language === 'en' ? 'Pending Registrations' : 'लंबित पंजीकरण'} ({pendingApprovalAlerts.length})
                        </h4>
                      )}
                      {pendingApprovalAlerts.map((employee) => (
                        <div 
                          key={`reg-${employee.id}`} 
                          className="flex flex-col gap-3.5 p-4 bg-white border border-indigo-150 shadow-3xs rounded-xl hover:border-indigo-300 transition-all duration-200"
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                              <UserCheck className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-black text-slate-800">{employee.name}</span>
                                <span className="text-[9px] font-black font-mono bg-indigo-150/50 text-indigo-800 px-1.5 py-0.25 rounded">
                                  {employee.id}
                                </span>
                                <span className="text-[10px] font-extrabold text-slate-500 uppercase bg-slate-100 px-1.5 py-0.5 rounded">
                                  {employee.department} • {employee.branch}
                                </span>
                              </div>
                              <p className="text-[11px] text-indigo-600 font-semibold mt-1">
                                {language === 'en' 
                                  ? `New employee registration requires administrator approval before first login.`
                                  : `नए कर्मचारी के पंजीकरण के लिए पहले लॉगिन से पहले एडमिनिस्ट्रेटर की स्वीकृति की आवश्यकता होती है।`}
                              </p>
                            </div>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex gap-2 justify-end pt-2 border-t border-gray-100 shrink-0">
                            <button
                              onClick={async () => {
                                if (onUpdateEmployee) {
                                  await onUpdateEmployee({ ...employee, isApproved: true });
                                }
                              }}
                              className="bg-[#03623c] hover:bg-[#02492d] text-white text-[10px] font-black px-4 py-2 rounded-lg transition-all shadow-3xs flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                              <span>{language === 'en' ? 'Approve Now' : 'तुरंत मंजूर करें'}</span>
                            </button>
                            <button
                              onClick={async () => {
                                if (onUpdateEmployee) {
                                  await onUpdateEmployee({ ...employee, isApproved: false, approvedDeviceId: '' });
                                }
                              }}
                              className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black px-4 py-2 rounded-lg transition-all shadow-3xs flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5 text-rose-200" />
                              <span>{language === 'en' ? 'Reject & Reset' : 'अस्वीकृत और रीसेट'}</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Category 3: Pending logins / OTP list */}
                  {(activeDeviceTab === 'All' || activeDeviceTab === 'Logins') && pendingDeviceApprovals.length > 0 && (
                    <div className="space-y-3 pt-2">
                      {(activeDeviceTab === 'All') && (
                        <h4 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest font-mono">
                          🔑 {language === 'en' ? 'Device Login & OTP Requests' : 'डिवाइस लॉगिन और ओटीपी अनुरोध'} ({pendingDeviceApprovals.length})
                        </h4>
                      )}
                      {pendingDeviceApprovals.map((employee) => (
                        <div 
                          key={`login-${employee.id}`} 
                          className="flex flex-col gap-3.5 p-4 bg-white border border-amber-200 shadow-3xs rounded-xl hover:border-amber-400 transition-all duration-200"
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg shrink-0">
                              <KeyRound className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-black text-slate-800">{employee.name}</span>
                                <span className="text-[9px] font-black font-mono bg-amber-150/50 text-amber-800 px-1.5 py-0.25 rounded">
                                  {employee.id}
                                </span>
                                <span className="text-[10px] font-extrabold text-slate-500 uppercase bg-slate-100 px-1.5 py-0.5 rounded">
                                  {employee.department} • {employee.branch}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-700 font-semibold mt-1">
                                {language === 'en' 
                                  ? `Device Request Code: `
                                  : `डिवाइस अनुरोध कोड: `}
                                <span className="font-mono font-black text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded text-[10.5px]">
                                  {employee.pendingDeviceApprovalCode}
                                </span>
                              </p>
                              <div className="mt-2.5 p-2 bg-amber-50/50 rounded-lg border border-amber-100 inline-block">
                                <p className="text-[11px] font-bold text-amber-800 flex items-center gap-1.5">
                                  <span>ℹ️</span>
                                  <span>
                                    {language === 'en' ? 'Active OTP: ' : 'सक्रिय ओटीपी: '}
                                    {employee.pendingDeviceApprovalOtp ? (
                                      <strong className="font-mono font-black text-sm text-slate-900 tracking-wider bg-white px-2 py-0.5 rounded border border-amber-200">
                                        {employee.pendingDeviceApprovalOtp}
                                      </strong>
                                    ) : (
                                      <em className="text-slate-500 font-medium">
                                        {language === 'en' ? 'No OTP generated' : 'ओटीपी जनरेट नहीं किया गया'}
                                      </em>
                                    )}
                                  </span>
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex gap-2 justify-end pt-2 border-t border-gray-100 shrink-0">
                            {!employee.pendingDeviceApprovalOtp ? (
                              <button
                                onClick={async () => {
                                  if (onUpdateEmployee) {
                                    const otp = Math.floor(100000 + Math.random() * 900000).toString();
                                    await onUpdateEmployee({ 
                                      ...employee, 
                                      pendingDeviceApprovalOtp: otp 
                                    });
                                  }
                                }}
                                className="bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-black px-3 py-2 rounded-lg transition-all shadow-3xs flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <span>🔄 {language === 'en' ? 'Generate OTP' : 'ओटीपी जनरेट करें'}</span>
                              </button>
                            ) : (
                              <button
                                onClick={async () => {
                                  if (onUpdateEmployee) {
                                    const otp = Math.floor(100000 + Math.random() * 900000).toString();
                                    await onUpdateEmployee({ 
                                      ...employee, 
                                      pendingDeviceApprovalOtp: otp 
                                    });
                                  }
                                }}
                                className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-black px-3 py-2 rounded-lg transition-all shadow-3xs flex items-center justify-center gap-1.5 cursor-pointer border border-slate-300/60"
                              >
                                <span>🔄 {language === 'en' ? 'Regenerate OTP' : 'ओटीपी पुनः जनरेट करें'}</span>
                              </button>
                            )}
                            <button
                              onClick={async () => {
                                if (onUpdateEmployee) {
                                  await onUpdateEmployee({ 
                                    ...employee, 
                                    approvedDeviceId: 'DIRECT_APPROVED',
                                    pendingDeviceApprovalCode: '',
                                    pendingDeviceApprovalOtp: ''
                                  });
                                }
                              }}
                              className="bg-[#03623c] hover:bg-[#02492d] text-white text-[10px] font-black px-4 py-2 rounded-lg transition-all shadow-3xs flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                              <span>{language === 'en' ? 'Approve Directly' : 'सीधे मंजूर करें'}</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-gray-50 border-t border-gray-200 flex justify-between items-center shrink-0">
              <span className="text-[10px] text-gray-500 font-bold">
                {language === 'en' 
                  ? `Showing security items across selected categories.` 
                  : `चयनित श्रेणियों में सुरक्षा आइटम प्रदर्शित हैं।`}
              </span>
              <button
                onClick={() => setIsDeviceApprovalModalOpen(false)}
                className="bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-black px-4 py-2 rounded-lg cursor-pointer"
              >
                {language === 'en' ? 'Close' : 'बंद करें'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
