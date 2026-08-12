import React, { useState, useMemo } from 'react';
import { 
  Flame, Calendar, Filter, Users, Building, TrendingUp, TrendingDown, 
  CheckCircle2, XCircle, AlertTriangle, Clock, Info, ChevronLeft, 
  ChevronRight, Search, Download, Eye, Layers, UserCheck, UserX, HelpCircle
} from 'lucide-react';
import { Employee, Attendance, AdminSettings } from '../types';
import { isAttendanceLate, isAttendanceEarlyGoing } from '../utils/shift';

interface AttendanceHeatmapProps {
  employees: Employee[];
  attendanceRecords: Attendance[];
  adminSettings?: AdminSettings;
  language: 'en' | 'hi';
}

type ViewMode = 'matrix' | 'daily_density' | 'dept_density';

export default function AttendanceHeatmap({
  employees,
  attendanceRecords,
  adminSettings,
  language
}: AttendanceHeatmapProps) {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1); //1-12
  const [viewMode, setViewMode] = useState<ViewMode>('matrix');
  
  //Filters
  const [selectedBranch, setSelectedBranch] = useState('All');
  const [selectedDept, setSelectedDept] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  //Selected Day Modal
  const [inspectDate, setInspectDate] = useState<string | null>(null);

  //Helper arrays
  const YEARS = [2025, 2026, 2027, 2028];
  const MONTHS = [
    { name: 'January', hindi: "", value: 1 },
    { name: 'February', hindi: "", value: 2 },
    { name: 'March', hindi: "", value: 3 },
    { name: 'April', hindi: "", value: 4 },
    { name: 'May', hindi: "", value: 5 },
    { name: 'June', hindi: "", value: 6 },
    { name: 'July', hindi: "", value: 7 },
    { name: 'August', hindi: "", value: 8 },
    { name: 'September', hindi: "", value: 9 },
    { name: 'October', hindi: "", value: 10 },
    { name: 'November', hindi: "", value: 11 },
    { name: 'December', hindi: "", value: 12 },
  ];

  const WEEKDAYS_SHORT = language === 'en' 
    ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const t = {
    en: {
      title: "Attendance Density Heatmap",
      subtitle: "Visual density trends, daily presence percentages, and month-long individual attendance matrices.",
      matrixView: "Employee x Days Matrix",
      dailyDensityView: "Daily Workforce Density",
      deptDensityView: "Department Density",
      month: "Month",
      year: "Year",
      branch: "Branch",
      dept: "Department",
      searchPlaceholder: "Search employee by name or ID...",
      avgPresence: "Avg Presence Rate",
      peakPresence: "Peak Attendance Day",
      highAbsence: "Highest Absence Day",
      activeStaff: "Active Staff",
      present: "Present",
      absent: "Absent",
      halfDay: "Half Day",
      leave: "On Leave",
      missPunch: "Miss Punch",
      lateIn: "Late In",
      legendTitle: "Heatmap Density Legend",
      matrixLegend: "Matrix Status Colors",
      dayDetailsTitle: "Attendance Day Ledger",
      close: "Close",
      noRecords: "No attendance logs found for this period.",
      rate: "Presence Rate",
      totalLogs: "Total Registered Logs",
      exportCsv: "Export Heatmap Data",
      prevMonth: "Previous Month",
      nextMonth: "Next Month",
      currentMonth: "Current Month"
    },
    hi: {
      title: "Attendance Density Heatmap",
      subtitle: "Visual density trends, daily presence percentages, and month-long individual attendance matrices.",
      matrixView: "Employee x Days Matrix",
      dailyDensityView: "Daily Workforce Density",
      deptDensityView: "Department Density",
      month: "Month",
      year: "Year",
      branch: "Branch",
      dept: "Department",
      searchPlaceholder: "Search employee by name or ID...",
      avgPresence: "Avg Presence Rate",
      peakPresence: "Peak Attendance Day",
      highAbsence: "Highest Absence Day",
      activeStaff: "Active Staff",
      present: "Present",
      absent: "Absent",
      halfDay: "Half Day",
      leave: "On Leave",
      missPunch: "Miss Punch",
      lateIn: "Late In",
      legendTitle: "Heatmap Density Legend",
      matrixLegend: "Matrix Status Colors",
      dayDetailsTitle: "Attendance Day Ledger",
      close: "Close",
      noRecords: "No attendance logs found for this period.",
      rate: "Presence Rate",
      totalLogs: "Total Registered Logs",
      exportCsv: "Export Heatmap Data",
      prevMonth: "Previous Month",
      nextMonth: "Next Month",
      currentMonth: "Current Month"
    }
  }[language];

  //Options
  const branchOptions = useMemo(() => {
    const set = new Set<string>();
    employees.forEach(e => { if (e.branch) set.add(e.branch); });
    return ['All', ...Array.from(set)];
  }, [employees]);

  const deptOptions = useMemo(() => {
    const set = new Set<string>();
    employees.forEach(e => { if (e.department) set.add(e.department); });
    return ['All', ...Array.from(set)];
  }, [employees]);

  //Filtered Employees
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      if (!emp.isActive) return false;
      const matchBranch = selectedBranch === 'All' || emp.branch === selectedBranch;
      const matchDept = selectedDept === 'All' || emp.department === selectedDept;
      const matchSearch = !searchQuery.trim() || 
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        emp.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchBranch && matchDept && matchSearch;
    });
  }, [employees, selectedBranch, selectedDept, searchQuery]);

  //Date Math
  const formattedPeriod = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const startDayOfWeek = new Date(selectedYear, selectedMonth - 1, 1).getDay();

  //All days of month array: [1, 2, ..., daysInMonth]
  const monthDays = useMemo(() => {
    const days: { day: number; dateStr: string; dayOfWeek: number }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${formattedPeriod}-${String(d).padStart(2, '0')}`;
      const dayOfWeek = new Date(selectedYear, selectedMonth - 1, d).getDay();
      days.push({ day: d, dateStr, dayOfWeek });
    }
    return days;
  }, [selectedYear, selectedMonth, daysInMonth, formattedPeriod]);

  //Map attendance records for selected period: map[empId][dateStr] = Attendance
  const periodAttendanceMap = useMemo(() => {
    const map: { [empId: string]: { [dateStr: string]: Attendance } } = {};
    attendanceRecords.forEach(r => {
      if (r.date && r.date.startsWith(formattedPeriod)) {
        if (!map[r.employeeId]) map[r.employeeId] = {};
        map[r.employeeId][r.date] = r;
      }
    });
    return map;
  }, [attendanceRecords, formattedPeriod]);

  //Daily Aggregate Metrics across filtered employees
  const dailyMetrics = useMemo(() => {
    const metrics: { 
      [dateStr: string]: { 
        totalEmployees: number;
        presentCount: number;
        halfDayCount: number;
        leaveCount: number;
        absentCount: number;
        missPunchCount: number;
        lateCount: number;
        presenceRate: number; //percentage 0-100
      } 
    } = {};

    const filteredEmpIds = new Set(filteredEmployees.map(e => e.id));

    monthDays.forEach(({ dateStr, dayOfWeek }) => {
      let presentCount = 0;
      let halfDayCount = 0;
      let leaveCount = 0;
      let absentCount = 0;
      let missPunchCount = 0;
      let lateCount = 0;

      filteredEmployees.forEach(emp => {
        const record = periodAttendanceMap[emp.id]?.[dateStr];
        if (record) {
          const effectiveStatus = (record.status === 'Miss Punch' && record.approvalStatus === 'Approved') ? 'Present' : record.status;
          switch (effectiveStatus) {
            case 'Present':
              presentCount++;
              break;
            case 'Half Day':
              halfDayCount++;
              break;
            case 'Leave':
              leaveCount++;
              break;
            case 'Absent':
              absentCount++;
              break;
            case 'Miss Punch':
              missPunchCount++;
              break;
          }
          if (isAttendanceLate(record, emp.workTiming, adminSettings?.defaultCheckIn || '09:00')) {
            lateCount++;
          }
        }
      });

      const totalActive = filteredEmpIds.size;
      //Presence Rate = (Present + 0.5 * HalfDay)TotalActive * 100
      const effectivePresent = presentCount + (halfDayCount * 0.5);
      const presenceRate = totalActive > 0 ? Math.round((effectivePresent / totalActive) * 100) : 0;

      metrics[dateStr] = {
        totalEmployees: totalActive,
        presentCount,
        halfDayCount,
        leaveCount,
        absentCount,
        missPunchCount,
        lateCount,
        presenceRate
      };
    });

    return metrics;
  }, [filteredEmployees, monthDays, periodAttendanceMap, adminSettings]);

  //Overall Month Statistics
  const monthStats = useMemo(() => {
    let sumRate = 0;
    let daysWithData = 0;
    let peakDay = { dateStr: '', rate: -1, count: 0 };
    let highAbsenceDay = { dateStr: '', count: -1 };

    let totalManDaysPresent = 0;
    let totalManDaysHalfDay = 0;
    let totalManDaysLeave = 0;
    let totalManDaysAbsent = 0;
    let totalManDaysMissPunch = 0;

    monthDays.forEach(({ dateStr, dayOfWeek }) => {
      //Exclude Sunday (0) from average rate calculation if no records
      const m = dailyMetrics[dateStr];
      if (m) {
        totalManDaysPresent += m.presentCount;
        totalManDaysHalfDay += m.halfDayCount;
        totalManDaysLeave += m.leaveCount;
        totalManDaysAbsent += m.absentCount;
        totalManDaysMissPunch += m.missPunchCount;

        if (dayOfWeek !== 0) { //Non-Sunday
          sumRate += m.presenceRate;
          daysWithData++;

          if (m.presenceRate > peakDay.rate) {
            peakDay = { dateStr, rate: m.presenceRate, count: m.presentCount };
          }

          if (m.absentCount > highAbsenceDay.count) {
            highAbsenceDay = { dateStr, count: m.absentCount };
          }
        }
      }
    });

    const avgRate = daysWithData > 0 ? Math.round(sumRate / daysWithData) : 0;

    return {
      avgRate,
      peakDay,
      highAbsenceDay,
      totalManDaysPresent,
      totalManDaysHalfDay,
      totalManDaysLeave,
      totalManDaysAbsent,
      totalManDaysMissPunch
    };
  }, [monthDays, dailyMetrics]);

  //Department Density Aggregate: map[dept][dateStr] = presenceRate
  const deptMetrics = useMemo(() => {
    const depts = Array.from(new Set(employees.map(e => e.department).filter(Boolean)));
    const map: { [dept: string]: { [dateStr: string]: { present: number; total: number; rate: number } } } = {};

    depts.forEach(dept => {
      map[dept] = {};
      const deptEmployees = employees.filter(e => e.department === dept && e.isActive);

      monthDays.forEach(({ dateStr }) => {
        let present = 0;
        deptEmployees.forEach(emp => {
          const r = periodAttendanceMap[emp.id]?.[dateStr];
          const status = (r?.status === 'Miss Punch' && r?.approvalStatus === 'Approved') ? 'Present' : r?.status;
          if (status === 'Present') present += 1;
          else if (status === 'Half Day') present += 0.5;
        });

        const total = deptEmployees.length;
        const rate = total > 0 ? Math.round((present / total) * 100) : 0;

        map[dept][dateStr] = { present, total, rate };
      });
    });

    return map;
  }, [employees, monthDays, periodAttendanceMap]);

  //Month navigation handlers
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(y => y - 1);
    } else {
      setSelectedMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(y => y + 1);
    } else {
      setSelectedMonth(m => m + 1);
    }
  };

  const handleCurrentMonth = () => {
    const now = new Date();
    setSelectedYear(now.getFullYear());
    setSelectedMonth(now.getMonth() + 1);
  };

  //Export CSV Handler
  const handleExportCSV = () => {
    const headers = ['Employee ID', 'Employee Name', 'Department', 'Branch', ...monthDays.map(d => d.dateStr)];
    const rows: string[][] = [headers];

    filteredEmployees.forEach(emp => {
      const row = [
        `"${emp.id}"`,
        `"${emp.name.replace(/" /g, '""')}"`,
        `"${(emp.department || '').replace(/" /g, '""')}"`,
        `"${(emp.branch || '').replace(/" /g, '""')}"`
      ];

      monthDays.forEach(({ dateStr }) => {
        const record = periodAttendanceMap[emp.id]?.[dateStr];
        const status = record?.status || 'No Log';
        const timing = record?.checkIn ? ` (${record.checkIn}-${record.checkOut || ''})` : '';
        row.push(`"${status}${timing}"`);
      });

      rows.push(row);
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Attendance_Report_${formattedPeriod}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  //Helper for density cell bg color (0-100%)
  const getDensityBgColor = (rate: number, isWeekend: boolean) => {
    if (isWeekend && rate === 0) return 'bg-slate-100/70 border-slate-200/50 text-slate-400';
    if (rate >= 85) return 'bg-emerald-600 text-white font-extrabold border-emerald-700 shadow-3xs';
    if (rate >= 70) return 'bg-emerald-500 text-white font-extrabold border-emerald-600';
    if (rate >= 50) return 'bg-emerald-300 text-emerald-950 font-bold border-emerald-400';
    if (rate >= 30) return 'bg-amber-300 text-amber-950 font-bold border-amber-400';
    if (rate > 0) return 'bg-rose-400 text-white font-bold border-rose-500';
    return 'bg-slate-50 text-slate-300 border-slate-200/60';
  };

  //Helper for Matrix Status Cell styling
  const getStatusCellClass = (status?: string, isSunday?: boolean, approvalStatus?: string) => {
    let effectiveStatus = status;
    if (status === 'Miss Punch' && approvalStatus === 'Approved') {
      effectiveStatus = 'Present';
    }
    if (!effectiveStatus) {
      return isSunday 
        ? 'bg-slate-100/80 text-slate-400 border-slate-200/50' 
        : 'bg-slate-50/50 text-slate-300 border-slate-100';
    }
    switch (effectiveStatus) {
      case 'Present':
        return 'bg-emerald-500 text-white font-extrabold shadow-3xs border-emerald-600';
      case 'Half Day':
        return 'bg-amber-400 text-amber-950 font-extrabold border-amber-500';
      case 'Leave':
        return 'bg-blue-500 text-white font-extrabold border-blue-600';
      case 'Absent':
        return 'bg-rose-500 text-white font-extrabold border-rose-600';
      case 'Miss Punch':
        return 'bg-purple-500 text-white font-extrabold border-purple-600 border-dashed';
      default:
        return 'bg-slate-100 text-slate-500';
    }
  };

  const getStatusSymbol = (status?: string, isSunday?: boolean, approvalStatus?: string) => {
    let effectiveStatus = status;
    if (status === 'Miss Punch' && approvalStatus === 'Approved') {
      effectiveStatus = 'Present';
    }
    if (!effectiveStatus) return isSunday ? 'OFF' : '•';
    switch (effectiveStatus) {
      case 'Present': return 'P';
      case 'Half Day': return 'HD';
      case 'Leave': return 'L';
      case 'Absent': return 'A';
      case 'Miss Punch': return 'MP';
      default: return '•';
    }
  };

  return (
    <div className="bg-white dark:bg-[#11221b] border border-slate-200/80 dark:border-[#1e3a2f] rounded-2xl p-4 sm:p-6 shadow-sm space-y-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-[#1e3a2f]">
        <div className="space-y-1">
          <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Flame className="w-5.5 h-5.5 text-amber-500 animate-pulse" />
            <span>{t.title}</span>
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-400 font-medium">{t.subtitle}</p>
        </div>

        {/* Navigation & Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Switcher */}
          <div className="inline-flex p-1 bg-slate-100 dark:bg-[#0c1a14] rounded-xl gap-1 border border-slate-200/60 dark:border-[#1e3a2f]">
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'matrix' 
                  ? 'bg-white dark:bg-[#183328] text-slate-800 dark:text-slate-100 shadow-xs border border-slate-200/20 dark:border-emerald-700/50' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-[#03623c] dark:text-emerald-400" />
              <span>{t.matrixView}</span>
            </button>

            <button
              onClick={() => setViewMode('daily_density')}
              className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'daily_density' 
                  ? 'bg-white dark:bg-[#183328] text-slate-800 dark:text-slate-100 shadow-xs border border-slate-200/20 dark:border-emerald-700/50' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>{t.dailyDensityView}</span>
            </button>

            <button
              onClick={() => setViewMode('dept_density')}
              className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'dept_density' 
                  ? 'bg-white dark:bg-[#183328] text-slate-800 dark:text-slate-100 shadow-xs border border-slate-200/20 dark:border-emerald-700/50' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Building className="w-3.5 h-3.5 text-blue-500" />
              <span>{t.deptDensityView}</span>
            </button>
          </div>

          {/* Month Stepper Navigation Control */}
          <div className="inline-flex items-center gap-1 bg-slate-50 dark:bg-[#0c1a14] border border-slate-200 dark:border-[#1e3a2f] rounded-xl p-1 shadow-3xs">
            <button 
              onClick={handlePrevMonth}
              className="px-2.5 py-1.5 hover:bg-white dark:hover:bg-[#183328] rounded-lg transition-all text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 text-xs font-bold cursor-pointer active:scale-95"
              title={t.prevMonth}
            >
              <ChevronLeft className="w-4 h-4 text-[#03623c] dark:text-emerald-400" />
              <span className="hidden sm:inline">{t.prevMonth}</span>
            </button>

            <div className="flex items-center gap-1 px-1">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-white dark:bg-[#11221b] border border-slate-200 dark:border-[#1e3a2f] text-xs font-black text-slate-800 dark:text-slate-100 px-2 py-1 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#03623c] cursor-pointer"
              >
                {MONTHS.map(m => (
                  <option key={m.value} value={m.value} className="dark:bg-[#11221b]">
                    {language === 'en' ? m.name : m.hindi}
                  </option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-white dark:bg-[#11221b] border border-slate-200 dark:border-[#1e3a2f] text-xs font-black text-slate-800 dark:text-slate-100 px-2 py-1 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#03623c] cursor-pointer"
              >
                {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => (
                  <option key={y} value={y} className="dark:bg-[#11221b]">
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button 
              onClick={handleNextMonth}
              className="px-2.5 py-1.5 hover:bg-white dark:hover:bg-[#183328] rounded-lg transition-all text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 text-xs font-bold cursor-pointer active:scale-95"
              title={t.nextMonth}
            >
              <span className="hidden sm:inline">{t.nextMonth}</span>
              <ChevronRight className="w-4 h-4 text-[#03623c] dark:text-emerald-400" />
            </button>

            <button
              onClick={handleCurrentMonth}
              className="px-2 py-1.5 bg-emerald-50 dark:bg-emerald-950/70 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 rounded-lg transition-all text-[11px] font-black cursor-pointer active:scale-95 ml-0.5"
              title={t.currentMonth}
            >
              {t.currentMonth}
            </button>
          </div>

          {/* Export CSVBackup Button */}
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-[#03623c] hover:bg-[#024a2d] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            title="Download CSV report for selected month"
          >
            <Download className="w-3.5 h-3.5 text-emerald-200" />
            <span>{t.exportCsv}</span>
          </button>
        </div>
      </div>

      {/* Top Key Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Average Monthly Presence Rate */}
        <div className="bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/40 rounded-2xl p-4 shadow-3xs">
          <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400">{t.avgPresence}</span>
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300 font-mono">{monthStats.avgRate}%</span>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
              {monthStats.avgRate >= 80 ? 'High Density' : monthStats.avgRate >= 60 ? 'Moderate' : 'Low Density'}
            </span>
          </div>
          <div className="mt-2 w-full bg-emerald-200/60 dark:bg-emerald-900/40 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-emerald-600 dark:bg-emerald-400 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, monthStats.avgRate)}%` }}
            ></div>
          </div>
        </div>

        {/* Peak Attendance Day */}
        <div className="bg-amber-50/40 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-800/40 rounded-2xl p-4 shadow-3xs">
          <div className="flex items-center justify-between text-amber-800 dark:text-amber-300">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400">{t.peakPresence}</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2">
            <span className="text-xl font-black text-amber-700 dark:text-amber-300 font-mono block">
              {monthStats.peakDay.dateStr ? monthStats.peakDay.dateStr.split('-').reverse().join(' //') : '—'}
            </span>
            <span className="text-[10px] font-extrabold text-amber-800 dark:text-amber-300/80 mt-0.5 block">
              {monthStats.peakDay.rate >= 0 ? `${monthStats.peakDay.rate}% Presence (${monthStats.peakDay.count} present)` : 'No records'}
            </span>
          </div>
        </div>

        {/* Highest Absence Day */}
        <div className="bg-rose-50/40 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-800/40 rounded-2xl p-4 shadow-3xs">
          <div className="flex items-center justify-between text-rose-800 dark:text-rose-300">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400">{t.highAbsence}</span>
            <UserX className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2">
            <span className="text-xl font-black text-rose-600 dark:text-rose-400 font-mono block">
              {monthStats.highAbsenceDay.dateStr ? monthStats.highAbsenceDay.dateStr.split('-').reverse().join(' //') : '—'}
            </span>
            <span className="text-[10px] font-extrabold text-rose-700 dark:text-rose-300/80 mt-0.5 block">
              {monthStats.highAbsenceDay.count >= 0 ? `${monthStats.highAbsenceDay.count} Absences Logged` : '0 Absences'}
            </span>
          </div>
        </div>

        {/* Man-Days Summary */}
        <div className="bg-slate-50 dark:bg-[#0c1a14] border border-slate-200/70 dark:border-[#1e3a2f] rounded-2xl p-4 shadow-3xs">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400">{t.activeStaff}</span>
            <Users className="w-4 h-4 text-[#03623c] dark:text-emerald-400" />
          </div>
          <div className="mt-1.5 grid grid-cols-2 gap-1 text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300">
            <div><span className="text-emerald-600 dark:text-emerald-400 font-black">{monthStats.totalManDaysPresent}</span> P</div>
            <div><span className="text-amber-600 dark:text-amber-400 font-black">{monthStats.totalManDaysHalfDay}</span> HD</div>
            <div><span className="text-blue-600 dark:text-blue-400 font-black">{monthStats.totalManDaysLeave}</span> L</div>
            <div><span className="text-rose-600 dark:text-rose-400 font-black">{monthStats.totalManDaysAbsent}</span> A</div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-50/80 dark:bg-[#0c1a14] p-3.5 rounded-2xl border border-slate-200/60 dark:border-[#1e3a2f] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <Filter className="w-4 h-4 text-[#03623c] dark:text-emerald-400" />
            <span className="text-xs font-black uppercase font-mono tracking-wider">Filters:</span>
          </div>

          {/* Dept Dropdown */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-white dark:bg-[#11221b] border border-slate-200 dark:border-[#1e3a2f] text-xs font-bold text-slate-700 dark:text-slate-200 px-2.5 py-1.5 rounded-xl focus:outline-none focus:border-[#03623c] cursor-pointer"
          >
            <option value="All">{'All Depts'}</option>
            {deptOptions.filter(d => d !== 'All').map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* Branch Dropdown */}
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="bg-white dark:bg-[#11221b] border border-slate-200 dark:border-[#1e3a2f] text-xs font-bold text-slate-700 dark:text-slate-200 px-2.5 py-1.5 rounded-xl focus:outline-none focus:border-[#03623c] cursor-pointer"
          >
            <option value="All">{'All Branches'}</option>
            {branchOptions.filter(b => b !== 'All').map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full bg-white dark:bg-[#11221b] border border-slate-200 dark:border-[#1e3a2f] text-xs font-semibold text-slate-800 dark:text-slate-100 pl-8 pr-3 py-1.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#03623c]" />
        </div>
      </div>

      {/* VIEW MODE 1: MATRIX HEATMAP (EMPLOYEES x DAYS) */}
      {viewMode === 'matrix' && (
        <div className="space-y-3">
          <div className="overflow-x-auto border border-slate-200 dark:border-[#1e3a2f] rounded-2xl bg-white dark:bg-[#11221b] shadow-3xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 dark:bg-[#0c1a14] text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-[#1e3a2f]">
                  <th className="py-3 px-4 min-w-[180px] sticky left-0 bg-slate-100 dark:bg-[#0c1a14] z-10 border-r border-slate-200 dark:border-[#1e3a2f]">
                    Employee ({filteredEmployees.length})
                  </th>
                  {monthDays.map(({ day, dayOfWeek }) => {
                    const isSunday = dayOfWeek === 0;
                    return (
                      <th 
                        key={day} 
                        className={`py-2 px-1 text-center min-w-[28px] border-r border-slate-200/60 dark:border-[#1e3a2f]/60 ${
                          isSunday ? 'bg-amber-100/50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 font-black' : ''
                        }`}
                      >
                        <div>{day}</div>
                        <div className="text-[7.5px] font-normal text-slate-400 dark:text-slate-400 uppercase">
                          {WEEKDAYS_SHORT[dayOfWeek][0]}
                        </div>
                      </th>
                    );
                  })}
                  <th className="py-3 px-3 text-center min-w-[60px] bg-slate-100 dark:bg-[#0c1a14] border-l border-slate-200 dark:border-[#1e3a2f]">
                    Rate %
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1e3a2f] text-xs font-semibold">
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((emp) => {
                    let presentSum = 0;
                    let totalDaysWithRecords = 0;

                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/60 dark:hover:bg-[#162e24] transition-colors">
                        {/* Sticky Employee Info Column */}
                        <td className="py-2.5 px-4 sticky left-0 bg-white dark:bg-[#11221b] hover:bg-slate-50/90 dark:hover:bg-[#162e24] z-10 border-r border-slate-200 dark:border-[#1e3a2f] shadow-3xs">
                          <div className="font-bold text-slate-900 dark:text-slate-100 truncate max-w-[160px]">{emp.name}</div>
                          <div className="text-[9.5px] font-mono text-slate-400 dark:text-slate-400 font-medium truncate max-w-[160px]">
                            {emp.id} · {emp.department}
                          </div>
                        </td>

                        {/* Day Matrix Cells */}
                        {monthDays.map(({ day, dateStr, dayOfWeek }) => {
                          const record = periodAttendanceMap[emp.id]?.[dateStr];
                          const isSunday = dayOfWeek === 0;
                          const cellClass = getStatusCellClass(record?.status, isSunday, record?.approvalStatus);
                          const symbol = getStatusSymbol(record?.status, isSunday, record?.approvalStatus);

                          const effectiveStatus = (record?.status === 'Miss Punch' && record?.approvalStatus === 'Approved') ? 'Present' : record?.status;
                          if (effectiveStatus === 'Present') presentSum += 1;
                          else if (effectiveStatus === 'Half Day') presentSum += 0.5;
                          if (record && !isSunday) totalDaysWithRecords += 1;

                          return (
                            <td key={dateStr} className="p-0.5 text-center border-r border-slate-100 dark:border-[#1e3a2f]/40">
                              <button
                                type="button"
                                onClick={() => setInspectDate(dateStr)}
                                title={`${emp.name} (${dateStr}): ${record?.status || (isSunday ? 'Sunday Off' : 'No Log')} ${record?.checkIn ? `[${record.checkIn} - ${record.checkOut || 'Out'}]` : ''}`}
                                className={`w-full h-7 rounded flex items-center justify-center text-[9px] cursor-pointer transition-transform hover:scale-110 ${cellClass}`}
                              >
                                {symbol}
                              </button>
                            </td>
                          );
                        })}

                        {/* Employee Attendance Rate % */}
                        <td className="py-2.5 px-2 text-center border-l border-slate-200 dark:border-[#1e3a2f] bg-slate-50/50 dark:bg-[#0c1a14]/50">
                          {(() => {
                            const empRate = totalDaysWithRecords > 0 
                              ? Math.round((presentSum / totalDaysWithRecords) * 100) 
                              : 0;
                            return (
                              <span className={`text-[10px] font-black font-mono px-1.5 py-0.5 rounded ${
                                empRate >= 80 ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80' :
                                empRate >= 60 ? 'text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80' : 'text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/80'
                              }`}>
                                {empRate}%
                              </span>
                            );
                          })()}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={monthDays.length + 2} className="py-12 text-center text-slate-400 font-medium">
                      {t.noRecords}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Matrix Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-[#0c1a14] p-3 rounded-xl border border-slate-200/50 dark:border-[#1e3a2f]">
            <span className="text-[10px] font-black uppercase font-mono text-slate-400">{t.matrixLegend}:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded bg-emerald-500 text-white font-extrabold text-[9px] flex items-center justify-center">P</span>
              <span>Present</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded bg-amber-400 text-amber-950 font-extrabold text-[9px] flex items-center justify-center">HD</span>
              <span>Half Day</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded bg-blue-500 text-white font-extrabold text-[9px] flex items-center justify-center">L</span>
              <span>Leave</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded bg-rose-500 text-white font-extrabold text-[9px] flex items-center justify-center">A</span>
              <span>Absent</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded bg-purple-500 text-white font-extrabold text-[9px] flex items-center justify-center">MP</span>
              <span>Miss Punch</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded bg-slate-100 dark:bg-[#183328] text-slate-400 dark:text-slate-300 font-extrabold text-[8px] flex items-center justify-center">OFF</span>
              <span>SundayOff</span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: DAILY WORKFORCE DENSITY HEATMAP */}
      {viewMode === 'daily_density' && (
        <div className="space-y-4">
          <div className="border border-slate-200 dark:border-[#1e3a2f] rounded-2xl overflow-hidden bg-white dark:bg-[#11221b] shadow-3xs">
            <div className="bg-slate-50 dark:bg-[#0c1a14] px-4 py-3 border-b border-slate-200 dark:border-[#1e3a2f] flex justify-between items-center">
              <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-widest flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-500" />
                Workforce Attendance Rate Density Calendar
              </span>
              <span className="text-[10px] font-mono font-bold text-[#03623c] dark:text-emerald-400 bg-[#03623c]/5 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-lg border border-[#03623c]/20">
                {MONTHS.find(m => m.value === selectedMonth)?.name} {selectedYear}
              </span>
            </div>

            {/* Weekdays Row */}
            <div className="grid grid-cols-7 border-b border-slate-200 dark:border-[#1e3a2f] text-center bg-slate-50/60 dark:bg-[#0c1a14]/60">
              {WEEKDAYS_SHORT.map((day, idx) => (
                <div 
                  key={idx} 
                  className={`py-2 text-[10px] font-extrabold uppercase tracking-widest ${
                    idx === 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Density Grid */}
            <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-[#1e3a2f]">
              {/* Padding empty start days */}
              {Array.from({ length: startDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="bg-slate-50/40 dark:bg-[#0b1812]/40 min-h-[75px] sm:min-h-[90px] p-2"></div>
              ))}

              {monthDays.map(({ day, dateStr, dayOfWeek }) => {
                const metric = dailyMetrics[dateStr];
                const isSunday = dayOfWeek === 0;
                const densityClass = getDensityBgColor(metric?.presenceRate || 0, isSunday);

                return (
                  <div
                    key={dateStr}
                    onClick={() => setInspectDate(dateStr)}
                    className={`min-h-[75px] sm:min-h-[95px] p-2 flex flex-col justify-between border-r border-b border-slate-100 dark:border-[#1e3a2f]/50 transition-all cursor-pointer hover:scale-[1.02] hover:z-10 ${densityClass}`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-black font-mono">
                        {day}
                      </span>
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-black/20 text-white font-mono">
                        {metric?.presenceRate || 0}%
                      </span>
                    </div>

                    <div className="my-1 text-center font-mono text-[9.5px]">
                      <div className="font-bold">
                        {metric?.presentCount || 0}{metric?.totalEmployees || 0}
                      </div>
                      <div className="text-[8px] opacity-80">
                        Present
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[8px] font-mono opacity-90 border-t border-white/20 pt-1">
                      <span>A: {metric?.absentCount || 0}</span>
                      <span>HD: {metric?.halfDayCount || 0}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Density Scale Legend */}
          <div className="bg-slate-50 dark:bg-[#0c1a14] p-4 rounded-xl border border-slate-200/60 dark:border-[#1e3a2f] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200">{t.legendTitle}:</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-600 dark:text-slate-300 font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded bg-emerald-600 border border-emerald-700 text-white text-[9px] flex items-center justify-center font-black">85%+</span>
                <span>High Presence</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded bg-emerald-500 border border-emerald-600 text-white text-[9px] flex items-center justify-center font-black">70%+</span>
                <span>Good</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded bg-emerald-300 border border-emerald-400 text-emerald-950 text-[9px] flex items-center justify-center font-black">50%+</span>
                <span>Moderate</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded bg-amber-300 border border-amber-400 text-amber-950 text-[9px] flex items-center justify-center font-black">30%+</span>
                <span>Low</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded bg-rose-400 border border-rose-500 text-white text-[9px] flex items-center justify-center font-black">&lt;30%</span>
                <span>Critical</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 3: DEPARTMENT DENSITY HEATMAP */}
      {viewMode === 'dept_density' && (
        <div className="space-y-3">
          <div className="overflow-x-auto border border-slate-200 dark:border-[#1e3a2f] rounded-2xl bg-white dark:bg-[#11221b] shadow-3xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 dark:bg-[#0c1a14] text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-[#1e3a2f]">
                  <th className="py-3 px-4 min-w-[160px] sticky left-0 bg-slate-100 dark:bg-[#0c1a14] z-10 border-r border-slate-200 dark:border-[#1e3a2f]">
                    Department
                  </th>
                  {monthDays.map(({ day, dayOfWeek }) => (
                    <th 
                      key={day} 
                      className={`py-2 px-1 text-center min-w-[32px] border-r border-slate-200/60 dark:border-[#1e3a2f]/60 ${
                        dayOfWeek === 0 ? 'bg-amber-100/50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 font-black' : ''
                      }`}
                    >
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1e3a2f] text-xs font-semibold">
                {Object.keys(deptMetrics).length > 0 ? (
                  Object.entries(deptMetrics).map(([dept, dateMap]) => (
                    <tr key={dept} className="hover:bg-slate-50/60 dark:hover:bg-[#162e24] transition-colors">
                      <td className="py-3 px-4 sticky left-0 bg-white dark:bg-[#11221b] hover:bg-slate-50/90 dark:hover:bg-[#162e24] z-10 border-r border-slate-200 dark:border-[#1e3a2f] shadow-3xs font-extrabold text-slate-800 dark:text-slate-100">
                        {dept}
                      </td>

                      {monthDays.map(({ dateStr, dayOfWeek }) => {
                        const m = dateMap[dateStr];
                        const isSunday = dayOfWeek === 0;
                        const cellBg = getDensityBgColor(m?.rate || 0, isSunday);

                        return (
                          <td key={dateStr} className="p-0.5 text-center border-r border-slate-100 dark:border-[#1e3a2f]/40">
                            <div 
                              title={`${dept} (${dateStr}): ${m?.rate || 0}% presence (${m?.present || 0} //${m?.total || 0})`}
                              className={`w-full h-8 rounded flex items-center justify-center text-[9px] font-mono cursor-pointer ${cellBg}`}
                            >
                              {m?.rate || 0}%
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={monthDays.length + 1} className="py-12 text-center text-slate-400 font-medium">
                      {t.noRecords}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* INSPECT DATE MODAL */}
      {inspectDate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-[#11221b] rounded-3xl w-full max-w-2xl border border-slate-100 dark:border-[#1e3a2f] shadow-2xl flex flex-col max-h-[85vh]">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-[#1e3a2f] flex items-center justify-between bg-slate-50 dark:bg-[#0c1a14] rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl border border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                    {t.dayDetailsTitle}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono font-bold mt-0.5">
                    {inspectDate} · Presence Rate: {dailyMetrics[inspectDate]?.presenceRate || 0}%
                  </p>
                </div>
              </div>

              <button
                onClick={() => setInspectDate(null)}
                className="px-3 py-1.5 bg-white dark:bg-[#0b1812] border border-slate-200 dark:border-[#1e3a2f] hover:bg-slate-100 dark:hover:bg-[#162e24] rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              >
                {t.close}
              </button>
            </div>

            {/* Content List */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold">
                <div className="p-2 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100">
                  <div className="text-lg font-black font-mono">{dailyMetrics[inspectDate]?.presentCount || 0}</div>
                  <div className="text-[10px] uppercase font-mono">Present</div>
                </div>
                <div className="p-2 bg-amber-50 text-amber-800 rounded-xl border border-amber-100">
                  <div className="text-lg font-black font-mono">{dailyMetrics[inspectDate]?.halfDayCount || 0}</div>
                  <div className="text-[10px] uppercase font-mono">Half Day</div>
                </div>
                <div className="p-2 bg-blue-50 text-blue-800 rounded-xl border border-blue-100">
                  <div className="text-lg font-black font-mono">{dailyMetrics[inspectDate]?.leaveCount || 0}</div>
                  <div className="text-[10px] uppercase font-mono">Leave</div>
                </div>
                <div className="p-2 bg-rose-50 text-rose-800 rounded-xl border border-rose-100">
                  <div className="text-lg font-black font-mono">{dailyMetrics[inspectDate]?.absentCount || 0}</div>
                  <div className="text-[10px] uppercase font-mono">Absent</div>
                </div>
              </div>

              {/* Roster Table for this Day */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase font-mono">
                      <th className="py-2.5 px-4">Employee</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">InOut Timings</th>
                      <th className="py-2.5 px-3">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold">
                    {filteredEmployees.map(emp => {
                      const rec = periodAttendanceMap[emp.id]?.[inspectDate];
                      return (
                        <tr key={emp.id} className="hover:bg-slate-50/50">
                          <td className="py-2 px-4">
                            <div className="font-extrabold text-slate-800">{emp.name}</div>
                            <div className="text-[9.5px] text-slate-400 font-mono">{emp.id} · {emp.department}</div>
                          </td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold font-mono border ${
                              rec?.status === 'Present' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              rec?.status === 'Half Day' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              rec?.status === 'Leave' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              rec?.status === 'Absent' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                              'bg-slate-50 text-slate-400 border-slate-200'
                            }`}>
                              {rec?.status || 'No Log'}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-mono text-[11px] text-slate-700">
                            {rec?.checkIn ? `${rec.checkIn} - ${rec.checkOut || '--:--'}` : '—'}
                          </td>
                          <td className="py-2 px-3 text-slate-500 text-[11px]">
                            {rec?.remarks || '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
