import React, { useState } from 'react';
import { 
  Calendar, User, Clock, AlertCircle, CheckCircle, 
  XCircle, FileText, ChevronLeft, ChevronRight, HelpCircle
} from 'lucide-react';
import { Employee, Attendance, AdminSettings } from '../types';
import { isAttendanceLate, isAttendanceEarlyGoing } from '../utils/shift';

interface MonthlyCalendarReportProps {
  isAdmin: boolean;
  employeeList?: Employee[];
  attendanceRecords: Attendance[];
  adminSettings: AdminSettings;
  language: 'en' | 'hi';
  currentEmployee?: Employee; // Required if !isAdmin
}

export default function MonthlyCalendarReport({
  isAdmin,
  employeeList = [],
  attendanceRecords,
  adminSettings,
  language,
  currentEmployee
}: MonthlyCalendarReportProps) {
  // Determine who we are viewing
  const initialEmpId = isAdmin 
    ? (employeeList.length > 0 ? employeeList[0].id : '')
    : (currentEmployee?.id || '');

  const [selectedEmpId, setSelectedEmpId] = useState<string>(initialEmpId);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1); // 1-12

  // Multi-language translation dictionary
  const t = {
    en: {
      title: "Monthly Attendance Calendar",
      subtitle: "Detailed calendar view showing daily log statuses, timings, and exceptions.",
      selectEmployee: "Select Employee to View Report",
      selectMonth: "Month",
      selectYear: "Year",
      statsSummary: "Monthly Highlights",
      statsPresent: "Present",
      statsAbsent: "Absent",
      statsHalfDay: "Half Day",
      statsLeave: "Paid Leaves",
      statsMissPunch: "Miss Punch",
      statsLate: "Late In",
      statsEarly: "Early Out",
      legendTitle: "Color Codes & Indicators",
      legendPresent: "Present (In / Out times)",
      legendAbsent: "Absent",
      legendHalfDay: "Half Day worked",
      legendLeave: "Approved Leave / Holiday",
      legendMissPunch: "Missed Punch (Forgot Out / In)",
      legendLate: "Late Arrival (Grace Exceeded)",
      legendEarly: "Early Leaving",
      notSpecified: "No employee selected",
      allCaughtUp: "Looks good! All daily states compiled cleanly.",
      noRecords: "No logs registered for this month yet.",
      calendarHeader: "Shift Ledger Grid"
    },
    hi: {
      title: "मासिक उपस्थिति कैलेंडर",
      subtitle: "दैनिक लॉग स्थिति, समय और विसंगतियों को दर्शाने वाला विस्तृत कैलेंडर दृश्य।",
      selectEmployee: "रिपोर्ट देखने के लिए कर्मचारी चुनें",
      selectMonth: "महीना",
      selectYear: "वर्ष",
      statsSummary: "मासिक मुख्य सांख्यिकी",
      statsPresent: "उपस्थित दिन",
      statsAbsent: "अनुपस्थित दिन",
      statsHalfDay: "हाफ डे",
      statsLeave: "सवैतनिक अवकाश",
      statsMissPunch: "मिस पंच",
      statsLate: "देरी से आगमन",
      statsEarly: "जल्दी प्रस्थान",
      legendTitle: "कलर कोड और संकेतक",
      legendPresent: "उपस्थित (आगमन / प्रस्थान समय)",
      legendAbsent: "अनुपस्थित",
      legendHalfDay: "आधा दिन काम किया",
      legendLeave: "स्वीकृत अवकाश / छुट्टी",
      legendMissPunch: "मिस पंच (चेक-आउट भूल गए)",
      legendLate: "देरी से आगमन (अनुमति सीमा पार)",
      legendEarly: "जल्दी प्रस्थान",
      notSpecified: "कोई कर्मचारी नहीं चुना गया",
      allCaughtUp: "सब ठीक है! सभी दैनिक विवरण सुचारू रूप से संकलित हैं।",
      noRecords: "इस महीने के लिए कोई लॉग दर्ज नहीं किया गया है।",
      calendarHeader: "शिफ्ट लेजर ग्रिड"
    }
  }[language];

  // Helper arrays
  const YEARS = [2025, 2026, 2027, 2028];
  const MONTHS = [
    { name: 'January', hindi: 'जनवरी', value: 1 },
    { name: 'February', hindi: 'फरवरी', value: 2 },
    { name: 'March', hindi: 'मार्च', value: 3 },
    { name: 'April', hindi: 'अप्रैल', value: 4 },
    { name: 'May', hindi: 'मई', value: 5 },
    { name: 'June', hindi: 'जून', value: 6 },
    { name: 'July', hindi: 'जुलाई', value: 7 },
    { name: 'August', hindi: 'अगस्त', value: 8 },
    { name: 'September', hindi: 'सितंबर', value: 9 },
    { name: 'October', hindi: 'अक्टूबर', value: 10 },
    { name: 'November', hindi: 'नवंबर', value: 11 },
    { name: 'December', hindi: 'दिसंबर', value: 12 },
  ];

  const WEEKDAYS = language === 'en' 
    ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    : ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'];

  // Find currently selected employee
  const selectedEmployee = isAdmin 
    ? employeeList.find(e => e.id === selectedEmpId)
    : currentEmployee;

  // Format monthYear string (e.g. "2026-07")
  const formattedPeriod = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

  // Filter attendance records for current employee & month
  const monthlyLogs = attendanceRecords.filter(r => 
    r.employeeId === selectedEmployee?.id && 
    r.date.startsWith(formattedPeriod)
  );

  // Stats Counters
  const countPresent = monthlyLogs.filter(r => r.status === 'Present').length;
  const countAbsent = monthlyLogs.filter(r => r.status === 'Absent').length;
  const countHalfDay = monthlyLogs.filter(r => r.status === 'Half Day').length;
  const countLeave = monthlyLogs.filter(r => r.status === 'Leave').length;
  const countMissPunch = monthlyLogs.filter(r => r.status === 'Miss Punch').length;

  const countLate = monthlyLogs.filter(r => 
    isAttendanceLate(r, selectedEmployee?.workTiming, adminSettings?.defaultCheckIn || '09:00')
  ).length;

  const countEarly = monthlyLogs.filter(r => 
    isAttendanceEarlyGoing(r, selectedEmployee?.workTiming, adminSettings?.defaultCheckOut || '18:00')
  ).length;

  // Calendar Construction logic
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const startDayOfWeek = new Date(selectedYear, selectedMonth - 1, 1).getDay(); // 0 = Sunday, 1 = Monday ...

  // Create grid cells
  const gridCells = [];
  // 1. Padding for previous month's ending
  for (let i = 0; i < startDayOfWeek; i++) {
    gridCells.push({ isEmpty: true, dayNum: 0, dateStr: '' });
  }
  // 2. Days of current month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    gridCells.push({
      isEmpty: false,
      dayNum: day,
      dateStr
    });
  }

  // Navigate months
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
      
      {/* Header Info Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="space-y-1">
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Calendar className="w-5.5 h-5.5 text-[#03623c]" />
            <span>{t.title}</span>
          </h3>
          <p className="text-xs text-slate-400 font-medium">{t.subtitle}</p>
        </div>

        {/* Navigation / Selection controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Month Stepper */}
          <div className="inline-flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1 shadow-3xs">
            <button 
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-white rounded-lg transition-colors text-slate-600 hover:text-slate-900 cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-extrabold px-3 text-slate-700 min-w-[100px] text-center">
              {language === 'en' 
                ? MONTHS.find(m => m.value === selectedMonth)?.name 
                : MONTHS.find(m => m.value === selectedMonth)?.hindi
              } {selectedYear}
            </span>
            <button 
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-white rounded-lg transition-colors text-slate-600 hover:text-slate-900 cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick selectors drop downs */}
          <div className="flex items-center gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="border border-slate-200 px-2 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#03623c]"
            >
              {MONTHS.map(m => (
                <option key={m.value} value={m.value}>
                  {language === 'en' ? m.name : m.hindi}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="border border-slate-200 px-2 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#03623c]"
            >
              {YEARS.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Admin Specific Employee Selector */}
      {isAdmin && (
        <div className="bg-slate-50/70 border border-slate-200/50 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#03623c] flex items-center justify-center font-bold">
              <User className="w-4 h-4" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.selectEmployee}</label>
              <p className="text-xs font-extrabold text-slate-700">{selectedEmployee ? `${selectedEmployee.name} (${selectedEmployee.id})` : t.notSpecified}</p>
            </div>
          </div>

          <div className="flex-1 max-w-sm">
            <select
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              className="w-full border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#03623c] cursor-pointer"
            >
              <option value="">-- {t.selectEmployee} --</option>
              {employeeList.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.id}) - {emp.department}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {selectedEmployee ? (
        <div className="space-y-6">
          
          {/* Stats highlight blocks */}
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-1.5 sm:gap-3">
            <div className="bg-emerald-50/30 border border-emerald-100 rounded-lg sm:rounded-xl p-1.5 sm:p-3 text-center shadow-3xs">
              <span className="text-[8px] sm:text-[9px] font-extrabold sm:font-black text-slate-400 uppercase tracking-wider sm:tracking-widest block truncate">{t.statsPresent}</span>
              <span className="text-sm sm:text-lg font-bold sm:font-black text-emerald-700 font-mono mt-0.5 block">{countPresent}</span>
            </div>
            <div className="bg-rose-50/30 border border-rose-100 rounded-lg sm:rounded-xl p-1.5 sm:p-3 text-center shadow-3xs">
              <span className="text-[8px] sm:text-[9px] font-extrabold sm:font-black text-slate-400 uppercase tracking-wider sm:tracking-widest block truncate">{t.statsAbsent}</span>
              <span className="text-sm sm:text-lg font-bold sm:font-black text-rose-600 font-mono mt-0.5 block">{countAbsent}</span>
            </div>
            <div className="bg-amber-50/30 border border-amber-100 rounded-lg sm:rounded-xl p-1.5 sm:p-3 text-center shadow-3xs">
              <span className="text-[8px] sm:text-[9px] font-extrabold sm:font-black text-slate-400 uppercase tracking-wider sm:tracking-widest block truncate">{t.statsHalfDay}</span>
              <span className="text-sm sm:text-lg font-bold sm:font-black text-amber-600 font-mono mt-0.5 block">{countHalfDay}</span>
            </div>
            <div className="bg-blue-50/30 border border-blue-100 rounded-lg sm:rounded-xl p-1.5 sm:p-3 text-center shadow-3xs">
              <span className="text-[8px] sm:text-[9px] font-extrabold sm:font-black text-slate-400 uppercase tracking-wider sm:tracking-widest block truncate">{t.statsLeave}</span>
              <span className="text-sm sm:text-lg font-bold sm:font-black text-blue-600 font-mono mt-0.5 block">{countLeave}</span>
            </div>
            <div className="bg-slate-50 border border-slate-200/60 rounded-lg sm:rounded-xl p-1.5 sm:p-3 text-center shadow-3xs">
              <span className="text-[8px] sm:text-[9px] font-extrabold sm:font-black text-slate-400 uppercase tracking-wider sm:tracking-widest block truncate">{t.statsMissPunch}</span>
              <span className="text-sm sm:text-lg font-bold sm:font-black text-slate-700 font-mono mt-0.5 block">{countMissPunch}</span>
            </div>
            <div className="bg-orange-50/30 border border-orange-100 rounded-lg sm:rounded-xl p-1.5 sm:p-3 text-center shadow-3xs">
              <span className="text-[8px] sm:text-[9px] font-extrabold sm:font-black text-[#03623c] uppercase tracking-wider sm:tracking-widest block truncate">{t.statsLate}</span>
              <span className="text-sm sm:text-lg font-bold sm:font-black text-orange-600 font-mono mt-0.5 block">{countLate}</span>
            </div>
            <div className="bg-pink-50/30 border border-pink-100 rounded-lg sm:rounded-xl p-1.5 sm:p-3 text-center shadow-3xs col-span-3 sm:col-span-1">
              <span className="text-[8px] sm:text-[9px] font-extrabold sm:font-black text-slate-400 uppercase tracking-wider sm:tracking-widest block truncate">{t.statsEarly}</span>
              <span className="text-sm sm:text-lg font-bold sm:font-black text-pink-600 font-mono mt-0.5 block">{countEarly}</span>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs bg-slate-50/20">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
              <span className="text-xs font-extrabold text-slate-600 uppercase tracking-widest">{t.calendarHeader}</span>
              <span className="text-[10px] font-mono font-bold text-[#03623c] bg-[#03623c]/5 px-2 py-0.5 rounded-lg">
                {selectedEmployee.name} ({selectedEmployee.department})
              </span>
            </div>

            {/* Weekdays Row */}
            <div className="grid grid-cols-7 border-b border-slate-200 text-center bg-slate-50/60">
              {WEEKDAYS.map((day, idx) => (
                <div 
                  key={idx} 
                  className={`py-2 text-[10px] font-extrabold uppercase tracking-widest ${
                    idx === 0 || idx === 6 ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Cells */}
            <div className="grid grid-cols-7 gap-px bg-slate-200">
              {gridCells.map((cell, idx) => {
                if (cell.isEmpty) {
                  return (
                    <div key={`empty-${idx}`} className="bg-slate-50/50 min-h-[48px] sm:min-h-[90px] p-1 sm:p-2"></div>
                  );
                }

                // Look up record
                const rec = monthlyLogs.find(r => r.date === cell.dateStr);

                // Check late & early flags
                const isLate = rec ? isAttendanceLate(rec, selectedEmployee.workTiming, adminSettings?.defaultCheckIn || '09:00') : false;
                const isEarly = rec ? isAttendanceEarlyGoing(rec, selectedEmployee.workTiming, adminSettings?.defaultCheckOut || '18:00') : false;

                // Cell styling based on status
                let cellBg = 'bg-white hover:bg-slate-50/70';
                let statusLabel = '';
                let statusColor = '';

                if (rec) {
                  switch (rec.status) {
                    case 'Present':
                      cellBg = 'bg-emerald-50/15 hover:bg-emerald-50/30';
                      statusLabel = language === 'en' ? 'P' : 'उप';
                      statusColor = 'text-emerald-700 bg-emerald-100/50 border-emerald-200';
                      break;
                    case 'Absent':
                      cellBg = 'bg-rose-50/20 hover:bg-rose-50/30';
                      statusLabel = language === 'en' ? 'A' : 'अनु';
                      statusColor = 'text-rose-600 bg-rose-100/50 border-rose-200';
                      break;
                    case 'Half Day':
                      cellBg = 'bg-amber-50/20 hover:bg-amber-50/30';
                      statusLabel = language === 'en' ? 'HD' : 'आधा';
                      statusColor = 'text-amber-700 bg-amber-100/50 border-amber-200';
                      break;
                    case 'Leave':
                      cellBg = 'bg-blue-50/15 hover:bg-blue-50/30';
                      statusLabel = language === 'en' ? 'L' : 'छुट्टी';
                      statusColor = 'text-blue-700 bg-blue-100/50 border-blue-200';
                      break;
                    case 'Miss Punch':
                      cellBg = 'bg-orange-50/15 hover:bg-orange-50/30';
                      statusLabel = language === 'en' ? 'MP' : 'मिस';
                      statusColor = 'text-slate-700 bg-orange-100/50 border-orange-200 border-dashed';
                      break;
                  }
                }

                return (
                  <div 
                    key={cell.dateStr} 
                    className={`${cellBg} min-h-[48px] sm:min-h-[95px] p-1 sm:p-2 flex flex-col justify-between transition-colors relative border-r border-b border-slate-100`}
                  >
                    {/* Top row: Day Number & Status Label */}
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-700 font-mono">
                        {cell.dayNum}
                      </span>
                      {rec && (
                        <span className={`text-[8px] sm:text-[9px] font-black px-1 sm:px-1.5 py-0.2 sm:py-0.5 rounded border ${statusColor} scale-90`}>
                          {statusLabel}
                        </span>
                      )}
                    </div>

                    {/* Middle row: Timings */}
                    <div className="my-0.5 sm:my-1.5 text-center">
                      {rec && (rec.status === 'Present' || rec.status === 'Half Day' || rec.status === 'Miss Punch') ? (
                        <div className="space-y-px sm:space-y-0.5">
                          {/* Desktop Timings */}
                          <div className="hidden sm:block space-y-0.5">
                            <div className="flex items-center justify-center gap-0.5 text-[9px] font-mono font-bold text-slate-600">
                              <span>In:</span>
                              <span className={isLate ? 'text-orange-600 font-extrabold' : ''}>
                                {rec.checkIn || '--:--'}
                              </span>
                            </div>
                            <div className="flex items-center justify-center gap-0.5 text-[9px] font-mono font-bold text-slate-600">
                              <span>Out:</span>
                              <span className={isEarly ? 'text-pink-600 font-extrabold' : ''}>
                                {rec.checkOut || '--:--'}
                              </span>
                            </div>
                          </div>
                          {/* Mobile Timings */}
                          <div className="block sm:hidden text-[7px] font-mono font-bold text-slate-600 leading-none">
                            <div className={isLate ? 'text-orange-600 font-black' : ''}>
                              {rec.checkIn || '--:--'}
                            </div>
                            <div className="text-slate-300 text-[6px] my-[1px]">↓</div>
                            <div className={isEarly ? 'text-pink-600 font-black' : ''}>
                              {rec.checkOut || '--:--'}
                            </div>
                          </div>
                        </div>
                      ) : rec && rec.status === 'Leave' ? (
                        <span className="text-[7.5px] sm:text-[9.5px] italic font-bold sm:font-semibold text-blue-600 truncate block">
                          {rec.remarks || 'Leave'}
                        </span>
                      ) : rec && rec.status === 'Absent' ? (
                        <span className="text-[7.5px] sm:text-[9.5px] italic font-bold sm:font-semibold text-rose-500 block">
                          Absent
                        </span>
                      ) : (
                        <span className="text-[8px] sm:text-[9px] text-slate-300 font-bold block">-</span>
                      )}
                    </div>

                    {/* Bottom row: Mini badge icons for late / early */}
                    <div className="flex flex-wrap gap-0.5 justify-center min-h-[10px] sm:min-h-[14px]">
                      {isLate && (
                        <span className="bg-orange-50 text-orange-600 text-[7px] sm:text-[8px] font-black px-0.5 sm:px-1 rounded-sm border border-orange-200/50 scale-90 uppercase">
                          Late
                        </span>
                      )}
                      {isEarly && (
                        <span className="bg-pink-50 text-pink-600 text-[7px] sm:text-[8px] font-black px-0.5 sm:px-1 rounded-sm border border-pink-200/50 scale-90 uppercase">
                          Early
                        </span>
                      )}
                      {rec && rec.status === 'Miss Punch' && (
                        <span className="bg-slate-100 text-slate-600 text-[7px] sm:text-[8px] font-black px-0.5 sm:px-1 rounded-sm border border-slate-200 scale-90 uppercase">
                          Miss
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Color Legend and Helpful guide */}
          <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                <span>{t.legendTitle}</span>
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-100 border border-emerald-200 block"></span>
                  <span>{t.legendPresent}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded bg-rose-100 border border-rose-200 block"></span>
                  <span>{t.legendAbsent}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded bg-amber-100 border border-amber-200 block"></span>
                  <span>{t.legendHalfDay}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded bg-blue-100 border border-blue-200 block"></span>
                  <span>{t.legendLeave}</span>
                </div>
                <div className="flex items-center gap-2 col-span-2">
                  <span className="w-2.5 h-2.5 rounded bg-orange-100 border border-orange-200 border-dashed block"></span>
                  <span>{t.legendMissPunch}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-4">
              <div className="flex items-start gap-2 text-[11px] text-slate-500 font-semibold">
                <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-extrabold text-slate-700">{t.legendLate} / {t.legendEarly}</p>
                  <p className="leading-relaxed">
                    {language === 'en' 
                      ? "Late badge is triggered if check-in exceeds the allowed shift start grace period. Early badge is shown if checkout is before the end of the shift."
                      : "शिफ्ट के निर्धारित आगमन समय और ग्रेस पीरियड से अधिक देरी होने पर 'Late' बैज दिखाई देता है। शिफ्ट समाप्त होने से पहले प्रस्थान करने पर 'Early' बैज दिखाई देता है।"
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      ) : (
        <div className="text-center py-16 text-slate-400">
          <User className="w-12 h-12 mx-auto text-slate-200 mb-2" />
          <p className="text-xs font-bold">{t.notSpecified}</p>
        </div>
      )}

    </div>
  );
}
