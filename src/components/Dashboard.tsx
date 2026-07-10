import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell, AreaChart, Area, CartesianGrid } from 'recharts';
import { 
  Users, Calendar, CreditCard, CheckCircle, TrendingUp, Briefcase, 
  Sparkles, Filter, ArrowRight, DollarSign, Activity, FileSpreadsheet, 
  Clock, AlertTriangle, ChevronRight, PieChart as PieIcon, Award
} from 'lucide-react';
import { motion } from 'motion/react';
import { Employee, Attendance, PayrollRecord } from '../types';

interface DashboardProps {
  employees: Employee[];
  attendance: Attendance[];
  payroll: PayrollRecord[];
  language: 'en' | 'hi';
  onNavigate?: (tab: 'dashboard' | 'employees' | 'attendance' | 'payroll') => void;
}

export default function Dashboard({ employees, attendance, payroll, language, onNavigate }: DashboardProps) {
  // Format current month string (YYYY-MM)
  const currentMonthStr = useMemo(() => new Date().toISOString().slice(0, 7), []);
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Real-time Dashboard Filters State
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [selectedDept, setSelectedDept] = useState<string>('All');

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

  // Dynamic filtered datasets based on Month + Department filters
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesDept = selectedDept === 'All' || emp.department === selectedDept;
      return matchesDept;
    });
  }, [employees, selectedDept]);

  const activeEmployees = useMemo(() => {
    return filteredEmployees.filter(e => e.isActive);
  }, [filteredEmployees]);

  // Attendance statistics for selected month / day
  const monthlyAttendance = useMemo(() => {
    return attendance.filter(a => {
      const matchesMonth = a.date.startsWith(selectedMonth);
      const emp = employees.find(e => e.id === a.employeeId);
      const matchesDept = selectedDept === 'All' || (emp && emp.department === selectedDept);
      return matchesMonth && matchesDept;
    });
  }, [attendance, selectedMonth, selectedDept, employees]);

  const todayAttendance = useMemo(() => {
    return attendance.filter(a => {
      const matchesDay = a.date === todayStr;
      const emp = employees.find(e => e.id === a.employeeId);
      const matchesDept = selectedDept === 'All' || (emp && emp.department === selectedDept);
      return matchesDay && matchesDept;
    });
  }, [attendance, todayStr, selectedDept, employees]);

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

  // Payroll calculations based on filtered month & department
  const filteredPayroll = useMemo(() => {
    return payroll.filter(p => {
      const matchesMonth = p.monthYear === selectedMonth;
      const emp = employees.find(e => e.id === p.employeeId);
      const matchesDept = selectedDept === 'All' || (emp && emp.department === selectedDept);
      return matchesMonth && matchesDept;
    });
  }, [payroll, selectedMonth, selectedDept, employees]);

  const totalPayrollExpense = useMemo(() => {
    return filteredPayroll.reduce((acc, curr) => acc + curr.totalSalary, 0);
  }, [filteredPayroll]);

  const paidPayrollExpense = useMemo(() => {
    return filteredPayroll.filter(p => p.paymentStatus === 'Paid').reduce((acc, curr) => acc + curr.totalSalary, 0);
  }, [filteredPayroll]);

  const pendingPayrollExpense = useMemo(() => {
    return filteredPayroll.filter(p => p.paymentStatus === 'Pending').reduce((acc, curr) => acc + curr.totalSalary, 0);
  }, [filteredPayroll]);

  const payrollComplianceRate = useMemo(() => {
    if (filteredPayroll.length === 0) return 100;
    const paidCount = filteredPayroll.filter(p => p.paymentStatus === 'Paid').length;
    return Math.round((paidCount / filteredPayroll.length) * 100);
  }, [filteredPayroll]);

  // Department-wise breakdown statistics
  const deptChartData = useMemo(() => {
    const deptMap: { [key: string]: { count: number; salary: number; active: number } } = {};
    employees.forEach(emp => {
      const dept = emp.department || 'Other';
      if (!deptMap[dept]) {
        deptMap[dept] = { count: 0, salary: 0, active: 0 };
      }
      deptMap[dept].count += 1;
      deptMap[dept].salary += emp.basicSalary;
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
  }, [employees]);

  // Attendance trends for last 7 calendar days
  const last7DaysData = useMemo(() => {
    const days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return days.map(date => {
      const dayAttendance = attendance.filter(a => {
        const matchesDay = a.date === date;
        const emp = employees.find(e => e.id === a.employeeId);
        const matchesDept = selectedDept === 'All' || (emp && emp.department === selectedDept);
        return matchesDay && matchesDept;
      });
      
      const total = dayAttendance.length;
      const present = dayAttendance.filter(a => a.status === 'Present' || a.status === 'Half Day').length;
      const rate = total > 0 ? Math.round((present / total) * 100) : 100;
      
      const parts = date.split('-');
      const label = `${parts[2]}/${parts[1]}`;
      return {
        date: label,
        rate,
        present,
        total,
      };
    });
  }, [attendance, selectedDept, employees]);

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
    <div className="space-y-4">
      
      {/* Dynamic Filter Pill Bar */}
      <div className="bg-white rounded-xl border border-gray-200/90 shadow-xs px-4 py-3 flex flex-wrap items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-50 text-[#03623c] rounded-lg">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black text-gray-950 font-display uppercase tracking-wider">{t.realtimeInsights}</h3>
            <p className="text-[10px] text-gray-800 font-mono font-black">SEGMENT & TIME COCKPIT</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Month Picker */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-extrabold text-gray-800 uppercase font-mono">{t.filterMonth}:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700 px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-[#03623c] transition-all cursor-pointer"
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
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-extrabold text-gray-800 uppercase font-mono">{t.filterDept}:</span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700 px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-[#03623c] transition-all cursor-pointer"
            >
              {departmentOptions.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bento Grid layout with stagger */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        
        {/* Bento Card 1: Headcount & Active Strength */}
        <motion.div 
          variants={itemVariants}
          className="bg-white p-4 rounded-xl border border-gray-200/90 shadow-xs flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-sm transition-all duration-300 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-850 uppercase tracking-wider font-mono">{t.totalEmp}</span>
            <div className="bg-emerald-50 text-[#03623c] p-2 rounded-lg group-hover:bg-[#03623c] group-hover:text-white transition-all duration-300">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-gray-900 font-display leading-none tracking-tight">{filteredEmployees.length}</span>
              <span className="text-xs text-gray-800 font-extrabold">registered</span>
            </div>
            
            {/* Visual Mini Progress Bar */}
            <div className="mt-3.5 space-y-1">
              <div className="flex justify-between text-[10px] font-extrabold text-gray-800">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                  {activeEmployees.length} {t.activeStatus}
                </span>
                <span>{filteredEmployees.length - activeEmployees.length} {t.inactiveStatus}</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
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
          className="bg-white p-4 rounded-xl border border-gray-200/90 shadow-xs flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-sm transition-all duration-300 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-850 uppercase tracking-wider font-mono">{t.presentToday}</span>
            <div className="bg-green-50 text-green-600 p-2 rounded-lg group-hover:bg-green-600 group-hover:text-white transition-all duration-300">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-gray-900 font-display leading-none tracking-tight">
                  {todayAttendance.length > 0 ? presentTodayCount : '-'}
                </span>
                <span className="text-sm font-extrabold text-gray-800">
                  / {todayAttendance.length > 0 ? todayAttendance.length : activeEmployees.length}
                </span>
              </div>
              <p className="text-[10px] text-gray-800 font-extrabold uppercase mt-1 tracking-wider">{t.attendanceRate}</p>
            </div>

            {/* Custom SVG Radial Gauge */}
            <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
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
                <span className="text-[10px] font-black font-mono text-gray-950">{attendanceRate}%</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bento Card 3: Monthly Financial Total */}
        <motion.div 
          variants={itemVariants}
          className="bg-white p-4 rounded-xl border border-gray-200/90 shadow-xs flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-sm transition-all duration-300 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-850 uppercase tracking-wider font-mono">{t.monthExpense}</span>
            <div className="bg-emerald-50 text-[#03623c] p-2 rounded-lg group-hover:bg-[#03623c] group-hover:text-white transition-all duration-300">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="flex items-baseline">
              <span className="text-2.5xl font-extrabold text-gray-900 font-mono tracking-tight leading-none">
                {t.currency}{totalPayrollExpense.toLocaleString('en-IN')}
              </span>
            </div>
            
            {/* Paid vs Pending visual bar */}
            <div className="mt-3.5 space-y-1">
              <div className="flex justify-between text-[9px] font-extrabold text-gray-800">
                <span className="text-emerald-700 font-black">Paid: {Math.round((paidPayrollExpense / (totalPayrollExpense || 1)) * 100)}%</span>
                <span className="text-amber-700 font-black">Pending: {Math.round((pendingPayrollExpense / (totalPayrollExpense || 1)) * 100)}%</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full flex overflow-hidden">
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
          className="bg-white p-4 rounded-xl border border-gray-200/90 shadow-xs flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-sm transition-all duration-300 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-850 uppercase tracking-wider font-mono">{t.paid}</span>
            <div className="bg-emerald-50 text-emerald-600 p-2 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 space-y-2">
            <div>
              <span className="text-2xl font-extrabold text-emerald-600 font-mono tracking-tight leading-none">
                {t.currency}{paidPayrollExpense.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] font-black border-t border-gray-100 pt-2">
              <span className="text-gray-800 uppercase">{t.pending}</span>
              <span className="text-amber-700 font-mono font-extrabold">
                {t.currency}{pendingPayrollExpense.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </motion.div>

      </motion.div>

      {/* Main Grid Content - Multi-Column Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Graph Area 1: Attendance Trends (Last 7 Days) */}
        <div className="bg-white p-4 rounded-xl border border-gray-200/90 shadow-xs lg:col-span-2 flex flex-col justify-between min-h-[340px]">
          <div className="flex items-center justify-between mb-4 border-b border-gray-50 pb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#03623c]" />
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider font-display">{t.trendTitle}</h4>
            </div>
            <span className="text-[9px] font-mono bg-emerald-50 text-[#03623c] font-bold px-2 py-0.5 rounded border border-emerald-100/50 uppercase">
              Presence velocity
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7DaysData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#03623c" stopOpacity={0.9}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.4}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} fontWeight={600} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} fontWeight={600} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip 
                  cursor={{ fill: 'rgba(241, 245, 249, 0.4)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white/95 backdrop-blur-md p-2.5 rounded-lg border border-gray-200 shadow-lg text-[11px] font-sans">
                          <p className="font-bold text-gray-800 mb-1">Date: {data.date}</p>
                          <p className="text-[#03623c] font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-[#03623c] rounded-full"></span>
                            Attendance: {data.rate}%
                          </p>
                          <p className="text-gray-500 font-medium">
                            Present: {data.present} / {data.total}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="rate" fill="url(#colorAttendance)" radius={[6, 6, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graph Area 2: Payroll Breakdown Circle */}
        <div className="bg-white p-4 rounded-xl border border-gray-200/90 shadow-xs flex flex-col justify-between min-h-[340px]">
          <div className="flex items-center justify-between mb-4 border-b border-gray-50 pb-2">
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-emerald-500" />
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider font-display">{t.breakdown}</h4>
            </div>
            <span className="text-[9px] font-mono bg-emerald-50 text-emerald-600 font-bold px-2 py-0.5 rounded border border-emerald-100 uppercase">
              Ratio: {payrollComplianceRate}%
            </span>
          </div>

          <div className="h-44 flex items-center justify-center relative">
            {totalPayrollExpense > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
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
                            <div className="bg-white/95 backdrop-blur-md p-2 rounded-lg border border-gray-200 shadow-md text-xxs font-mono">
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
                  <span className="text-xxs font-mono uppercase text-gray-800 font-extrabold">{t.complianceLabel}</span>
                  <span className="text-base font-extrabold text-emerald-600 font-display">{payrollComplianceRate}%</span>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-800 space-y-1">
                <AlertTriangle className="w-6 h-6 mx-auto text-amber-500 animate-pulse" />
                <p className="text-xs font-bold">{t.noRecords}</p>
                <p className="text-[10px] font-mono text-gray-700 font-extrabold">Generate payroll records in the Payroll sheet</p>
              </div>
            )}
          </div>

          {/* Table list format inside bento card */}
          <div className="space-y-1.5 border-t border-gray-100 pt-3">
            <div className="flex items-center justify-between text-xs font-extrabold">
              <span className="flex items-center text-gray-800">
                <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
                {language === 'en' ? 'Disbursed' : 'भुगतान हुआ'}
              </span>
              <span className="font-extrabold text-gray-950 font-mono">
                {t.currency}{paidPayrollExpense.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs font-extrabold">
              <span className="flex items-center text-gray-800">
                <span className="w-2 h-2 bg-amber-500 rounded-full mr-2"></span>
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Chart Area 3: Department Resource Distribution */}
        <div className="bg-white p-4 rounded-xl border border-gray-200/90 shadow-xs lg:col-span-2 flex flex-col justify-between min-h-[340px]">
          <div className="flex items-center justify-between mb-4 border-b border-gray-50 pb-2">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#03623c]" />
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider font-display">{t.deptDist}</h4>
            </div>
            <span className="text-[9px] font-mono bg-emerald-50 text-[#03623c] font-bold px-2 py-0.5 rounded border border-emerald-100/50 uppercase">
              Financial & Staff Pool
            </span>
          </div>

          <div className="h-64 w-full">
            {deptChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptChartData} margin={{ top: 10, right: -15, left: -25, bottom: 0 }}>
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
                          <div className="bg-white/95 backdrop-blur-md p-2.5 rounded-lg border border-gray-200 shadow-md text-xs">
                            <p className="font-bold text-gray-800 border-b border-gray-100 pb-1 mb-1">{data.name}</p>
                            <p className="text-[#03623c] font-semibold">Staff: {data.employees} ({data.active} Active)</p>
                            <p className="text-emerald-700 font-semibold font-mono">Salary Pool: ₹{data.salary.toLocaleString('en-IN')}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 10, fontWeight: 600 }} />
                  <Bar yAxisId="left" dataKey="employees" name={language === 'en' ? "Total Staff" : "कर्मचारी"} fill="url(#colorCount)" radius={[4, 4, 0, 0]} barSize={16} />
                  <Bar yAxisId="right" dataKey="salary" name={language === 'en' ? "Basic Salary Budget" : "कुल मूल वेतन"} fill="url(#colorSalary)" radius={[4, 4, 0, 0]} barSize={16} />
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
        <div className="space-y-4 flex flex-col no-print">
          
          {/* Quick Actions Panel */}
          {onNavigate && (
            <div className="bg-white p-4 rounded-xl border border-gray-200/90 shadow-xs flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3 border-b border-gray-50 pb-2">
                  <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider font-display">{t.quickActions}</h4>
                </div>
                
                <div className="space-y-2">
                  <button 
                    onClick={() => onNavigate('employees')}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-emerald-50/30 hover:border-emerald-200 text-xs font-bold text-gray-700 hover:text-[#03623c] transition-all cursor-pointer group"
                  >
                    <span className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#03623c]" />
                      {t.actionAddEmp}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:translate-x-0.5 transition-all" />
                  </button>

                  <button 
                    onClick={() => onNavigate('attendance')}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-emerald-50/30 hover:border-emerald-200 text-xs font-bold text-gray-700 hover:text-green-700 transition-all cursor-pointer group"
                  >
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-green-500" />
                      {t.actionMarkAtt}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:translate-x-0.5 transition-all" />
                  </button>

                  <button 
                    onClick={() => onNavigate('payroll')}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-emerald-50/30 hover:border-emerald-200 text-xs font-bold text-gray-700 hover:text-[#03623c] transition-all cursor-pointer group"
                  >
                    <span className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[#03623c]" />
                      {t.actionCalcPay}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:translate-x-0.5 transition-all" />
                  </button>
                </div>
              </div>

              {/* Monospace Quick Status Clock */}
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[10px] font-mono font-extrabold text-gray-800">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-gray-700" />
                  UTC Sync Status:
                </span>
                <span className="text-green-700 font-extrabold bg-green-50 px-1.5 py-0.5 rounded border border-green-200 uppercase tracking-wider">Live</span>
              </div>
            </div>
          )}

          {/* Rule-Based System Alerts Panel */}
          <div className="bg-white p-4 rounded-xl border border-gray-200/90 shadow-xs flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3 border-b border-gray-50 pb-2">
                <AlertTriangle className="w-4 h-4 text-[#03623c]" />
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider font-display">{t.liveHighlights}</h4>
              </div>

              <div className="space-y-3 text-[11px] font-semibold text-gray-900">
                {/* Rule 1: Active Staff Ratio */}
                <div className="flex items-start gap-2">
                  <div className={`p-1 rounded-full shrink-0 mt-0.5 ${activeEmployees.length === filteredEmployees.length ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                    <Activity className="w-3 h-3" />
                  </div>
                  <div>
                    <p className="font-black text-gray-900 leading-none mb-1">{t.highlightActiveRatio}</p>
                    <p className="text-gray-800 text-[10px] font-bold">
                      {activeEmployees.length} active out of {filteredEmployees.length} total staff.
                    </p>
                  </div>
                </div>

                {/* Rule 2: Payroll Run Check */}
                <div className="flex items-start gap-2">
                  <div className={`p-1 rounded-full shrink-0 mt-0.5 ${pendingPayrollExpense === 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                    <CheckCircle className="w-3 h-3" />
                  </div>
                  <div>
                    <p className="font-black text-gray-900 leading-none mb-1">{t.highlightPayrollRun}</p>
                    <p className="text-gray-800 text-[10px] font-bold">
                      {pendingPayrollExpense === 0 ? t.goodStanding : `${t.currency}${pendingPayrollExpense.toLocaleString('en-IN')} pending approvals.`}
                    </p>
                  </div>
                </div>

                {/* Rule 3: Today's Attendance Check */}
                <div className="flex items-start gap-2">
                  <div className={`p-1 rounded-full shrink-0 mt-0.5 ${todayAttendance.length > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-emerald-50 text-[#03623c]'}`}>
                    <Calendar className="w-3 h-3" />
                  </div>
                  <div>
                    <p className="font-black text-gray-900 leading-none mb-1">{t.highlightAttendance}</p>
                    <p className="text-gray-800 text-[10px] font-bold">
                      {todayAttendance.length > 0 ? `Attendance recorded with a rate of ${attendanceRate}%.` : "Today's attendance log has not been completed."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Micro Badge */}
            <div className="mt-4 text-[9px] font-black text-gray-850 uppercase text-center tracking-widest leading-none bg-gray-100 py-1.5 rounded border border-gray-200/60">
              {language === 'en' ? "RATHI BUILDMART PORTAL" : "राठी बिल्डमार्ट पोर्टल"}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
