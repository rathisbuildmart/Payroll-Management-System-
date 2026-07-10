import React, { useState } from 'react';
import { 
  Calendar, Award, Sparkles, MapPin, Briefcase, FileSpreadsheet, Search, CheckCircle, 
  Info, AlertCircle, Plus, CalendarDays, Clock, User, Download, Palmtree
} from 'lucide-react';
import { Employee, Attendance } from '../types';

interface LeavesHolidaysProps {
  employees: Employee[];
  attendance: Attendance[];
  language: 'en' | 'hi';
  isEmployeeView?: boolean;
  employeeId?: string;
}

// 2026 Holidays list from Rathi's Build Mart Official Calendar
export const HOLIDAYS_2026 = [
  {
    occasion: "Republic Day",
    hindiOccasion: "गणतंत्र दिवस",
    type: "National Holiday",
    hindiType: "राष्ट्रीय अवकाश",
    date: "January 26, 2026",
    duration: "1 Day",
    hindiDuration: "1 दिन",
    imgUrl: "🇮🇳"
  },
  {
    occasion: "Holi",
    hindiOccasion: "होली",
    type: "Festival Leave",
    hindiType: "त्योहार अवकाश",
    date: "March 4, 2026",
    duration: "1 Day",
    hindiDuration: "1 दिन",
    imgUrl: "🎨"
  },
  {
    occasion: "Eid-ul-Fitr",
    hindiOccasion: "ईद-उल-फितर",
    type: "Religious Leave (Muslim Community)",
    hindiType: "धार्मिक अवकाश (मुस्लिम समाज)",
    date: "March 20, 2026",
    duration: "1 Day",
    hindiDuration: "1 दिन",
    imgUrl: "🌙"
  },
  {
    occasion: "Independence Day",
    hindiOccasion: "स्वतंत्रता दिवस",
    type: "National Holiday",
    hindiType: "राष्ट्रीय अवकाश",
    date: "August 15, 2026",
    duration: "1 Day",
    hindiDuration: "1 दिन",
    imgUrl: "🇮🇳"
  },
  {
    occasion: "Dussehra",
    hindiOccasion: "दशहरा",
    type: "Festival Leave",
    hindiType: "त्योहार अवकाश",
    date: "October 20, 2026",
    duration: "Half Day",
    hindiDuration: "आधा दिन",
    imgUrl: "🏹"
  },
  {
    occasion: "Diwali",
    hindiOccasion: "दीपावली",
    type: "Festival Leave",
    hindiType: "त्योहार अवकाश",
    date: "November 7, November 8, November 9",
    duration: "3 Days",
    hindiDuration: "3 दिन",
    imgUrl: "🪔"
  },
  {
    occasion: "Christmas",
    hindiOccasion: "क्रिसमस",
    type: "Religious Leave (Christian Community)",
    hindiType: "धार्मिक अवकाश (ईसाई समाज)",
    date: "December 25, 2026",
    duration: "1 Day",
    hindiDuration: "1 दिन",
    imgUrl: "🎄"
  }
];

export default function LeavesHolidays({ 
  employees, 
  attendance, 
  language, 
  isEmployeeView = false, 
  employeeId 
}: LeavesHolidaysProps) {
  const [subTab, setSubTab] = useState<'balance' | 'calendar'>('balance');
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');

  // Helper to calculate accumulated months since joining
  const calculateTenureMonths = (joiningDateStr: string): number => {
    if (!joiningDateStr) return 0;
    const joinDate = new Date(joiningDateStr);
    const now = new Date();
    if (isNaN(joinDate.getTime())) return 0;
    
    // Difference in months inclusive of starting and ending months
    const diff = (now.getFullYear() - joinDate.getFullYear()) * 12 + (now.getMonth() - joinDate.getMonth()) + 1;
    return Math.max(0, diff);
  };

  // Helper to get all Leave days marked in attendance for an employee
  const getUsedLeavesCount = (empId: string): number => {
    return attendance.filter(r => r.employeeId === empId && r.status === 'Leave').length;
  };

  // Extract unique departments for filtering
  const departments = ['All', ...Array.from(new Set(employees.map(e => e.department).filter(Boolean)))];

  // Map employee and compute leave balances
  const leaveDataList = employees.map(emp => {
    const openingEL = emp.elBalance || 0;
    const openingCL = emp.clBalance || 0;
    const tenureMonths = calculateTenureMonths(emp.joiningDate);
    const accumulatedEL = tenureMonths; // 1 EL per month
    const totalGrantedEL = openingEL + accumulatedEL;
    const usedEL = getUsedLeavesCount(emp.id);
    const remainingEL = totalGrantedEL - usedEL;

    return {
      id: emp.id,
      name: emp.name,
      department: emp.department,
      designation: emp.designation,
      joiningDate: emp.joiningDate,
      openingEL,
      openingCL,
      accumulatedEL,
      totalGrantedEL,
      usedEL,
      remainingEL
    };
  });

  // Filtered lists
  const filteredLeaveList = leaveDataList.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = departmentFilter === 'All' || item.department === departmentFilter;
    return matchesSearch && matchesDept;
  });

  // If viewing as a single employee (Employee Portal)
  const employeeLeaveData = employeeId ? leaveDataList.find(d => d.id.toLowerCase() === employeeId.toLowerCase()) : null;

  const t = {
    en: {
      leaveBalanceReport: "Paid Leaves & Balance Report",
      holidayCalendar: "Holiday Calendar 2026",
      leavesBalance: "Leaves Balance",
      officialCalendar: "Official Holiday Calendar",
      searchEmp: "Search employee name or ID...",
      dept: "Department",
      allDepts: "All Departments",
      empId: "Employee ID",
      empName: "Employee Name",
      joinDate: "Joining Date",
      openingEL: "Opening Balance",
      monthlyEL: "Monthly Earned",
      totalGranted: "Total Granted",
      usedLeaves: "Leaves Used",
      remainingEL: "Available Balance",
      clBalance: "CL Balance",
      summary: "Summary",
      notes: "Important Notes & Leave Policies",
      note1: "Only Sundays are considered as Week Off (WO).",
      note2: "One Paid Leave day is provided in each month as Earned Leave (EL).",
      note3: "No other leave types are applicable.",
      myLeaveReport: "My Leave Balance & Holidays",
      startingBal: "Starting (Opening) Balance",
      monthlyEarned: "Monthly Accumulation",
      totalAccumulated: "Total Allocated Leaves",
      totalUsed: "Paid Leaves Used",
      availableBal: "Current Available Balance",
      brandTitle: "RATHI'S BUILD MART",
      brandSub: "नींव से निर्माण तक",
      branches: "Raipur | Jagdalpur | Bilaspur",
      trust: "BUILDING TRUST. BUILDING FUTURE."
    },
    hi: {
      leaveBalanceReport: "अर्जित अवकाश एवं शेष रिपोर्ट",
      holidayCalendar: "त्योहारों का कैलेंडर 2026",
      leavesBalance: "छुट्टियों का रिकॉर्ड (बैलेंस)",
      officialCalendar: "आधिकारिक अवकाश तालिका",
      searchEmp: "कर्मचारी का नाम या आईडी खोजें...",
      dept: "विभाग",
      allDepts: "सभी विभाग",
      empId: "कर्मचारी आईडी",
      empName: "कर्मचारी का नाम",
      joinDate: "शामिल होने की तिथि",
      openingEL: "शुरुआती बैलेंस",
      monthlyEL: "मासिक अर्जित",
      totalGranted: "कुल स्वीकृत",
      usedLeaves: "उपयोग की गई छुट्टियां",
      remainingEL: "शेष बैलेंस",
      clBalance: "CL बैलेंस",
      summary: "संक्षिप्त विवरण",
      notes: "महत्वपूर्ण निर्देश एवं अवकाश नीतियां",
      note1: "केवल रविवार को ही साप्ताहिक अवकाश (WO) माना जाता है।",
      note2: "प्रति माह एक दिन का सवेतन अवकाश (Paid Leave) अर्जित अवकाश (EL) के रूप में प्रदान किया जाता है।",
      note3: "अन्य कोई अवकाश प्रकार लागू नहीं हैं।",
      myLeaveReport: "मेरा अवकाश रिकॉर्ड और कैलेंडर",
      startingBal: "शुरुआती बैलेंस (Opening)",
      monthlyEarned: "मासिक संचय (1 दिन/माह)",
      totalAccumulated: "कुल स्वीकृत छुट्टियां",
      totalUsed: "उपयोग की गई छुट्टियां",
      availableBal: "वर्तमान शेष बैलेंस",
      brandTitle: "राठीज़ बिल्डमार्ट",
      brandSub: "नींव से निर्माण तक",
      branches: "रायपुर | जगदलपुर | बिलासपुर",
      trust: "विश्वास की नींव, भविष्य का निर्माण।"
    }
  }[language];

  return (
    <div className="space-y-6" id="leaves-holidays-component">
      {/* Tab Selectors */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xxs">
        <div className="flex gap-2">
          <button
            onClick={() => setSubTab('balance')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              subTab === 'balance' 
                ? 'bg-emerald-600 text-white shadow-md' 
                : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>{t.leavesBalance}</span>
          </button>
          <button
            onClick={() => setSubTab('calendar')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              subTab === 'calendar' 
                ? 'bg-emerald-600 text-white shadow-md' 
                : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{t.holidayCalendar}</span>
          </button>
        </div>

        <div className="text-[11px] font-bold text-slate-500 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-emerald-600" />
          <span>{language === 'en' ? "1 Day Paid Leave Added Automatically Each Month" : "प्रति माह 1 दिन सवेतन अवकाश स्वतः जुड़ता है"}</span>
        </div>
      </div>

      {/* LEAVES BALANCE SECTION */}
      {subTab === 'balance' && (
        <div className="space-y-6">
          {isEmployeeView && employeeLeaveData ? (
            /* INDIVIDUAL EMPLOYEE VIEW */
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-150 pb-4">
                <div className="bg-emerald-50 text-emerald-700 p-2.5 rounded-xl">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800">{employeeLeaveData.name} ({employeeLeaveData.id})</h3>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{employeeLeaveData.designation} &bull; {employeeLeaveData.department}</p>
                </div>
              </div>

              {/* Bento Grid Leaves Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 shadow-xxs">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{t.startingBal}</p>
                  <p className="text-xl font-black text-slate-700 mt-1 font-mono">{employeeLeaveData.openingEL} Days</p>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 shadow-xxs">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{t.monthlyEarned}</p>
                  <p className="text-xl font-black text-slate-700 mt-1 font-mono">+{employeeLeaveData.accumulatedEL} Days</p>
                  <p className="text-[9px] text-slate-400 mt-0.5 font-bold">1 Day per month since joining</p>
                </div>

                <div className="bg-blue-50/55 p-4 rounded-xl border border-blue-100 shadow-xxs">
                  <p className="text-[9px] font-black text-blue-500 uppercase tracking-wider">{t.totalAccumulated}</p>
                  <p className="text-xl font-black text-blue-700 mt-1 font-mono">{employeeLeaveData.totalGrantedEL} Days</p>
                </div>

                <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100 shadow-xxs">
                  <p className="text-[9px] font-black text-rose-500 uppercase tracking-wider">{t.totalUsed}</p>
                  <p className="text-xl font-black text-rose-700 mt-1 font-mono">{employeeLeaveData.usedEL} Days</p>
                  <p className="text-[9px] text-slate-400 mt-0.5 font-bold">Days marked 'Leave' in Logs</p>
                </div>

                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-150 shadow-xxs sm:col-span-2 md:col-span-1">
                  <p className="text-[9px] font-black text-emerald-600 uppercase tracking-wider">{t.availableBal}</p>
                  <p className="text-2xl font-black text-emerald-700 mt-1 font-mono">{employeeLeaveData.remainingEL} Days</p>
                </div>
              </div>

              {/* Extra CL Display if applicable */}
              {employeeLeaveData.openingCL > 0 && (
                <div className="bg-amber-50/40 border border-amber-100 rounded-xl p-3 flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-2 text-amber-800">
                    <Info className="w-4 h-4 text-amber-600" />
                    <span>Casual Leave (CL) Balance also available</span>
                  </div>
                  <span className="font-mono text-amber-700 font-bold bg-amber-100/50 px-2.5 py-1 rounded-lg">{employeeLeaveData.openingCL} Days</span>
                </div>
              )}
            </div>
          ) : (
            /* ADMIN COMPREHENSIVE TABLE VIEW */
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              
              {/* Header Filters */}
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row gap-3 items-center justify-between">
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>{t.leaveBalanceReport}</span>
                </h3>

                <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto">
                  {/* Search */}
                  <div className="relative flex-1 sm:w-64">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                      <Search className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="text"
                      placeholder={t.searchEmp}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white font-medium"
                    />
                  </div>

                  {/* Department Filter */}
                  <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="appearance-none border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white cursor-pointer"
                  >
                    {departments.map(d => (
                      <option key={d} value={d}>
                        {d === 'All' ? t.allDepts : d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Leave Report Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">{t.empId}</th>
                      <th className="py-3 px-4">{t.empName}</th>
                      <th className="py-3 px-4">{t.dept}</th>
                      <th className="py-3 px-4 text-center">{t.joinDate}</th>
                      <th className="py-3 px-4 text-center">{t.openingEL}</th>
                      <th className="py-3 px-4 text-center">{t.monthlyEL}</th>
                      <th className="py-3 px-4 text-center">{t.totalGranted}</th>
                      <th className="py-3 px-4 text-center text-rose-600">{t.usedLeaves}</th>
                      <th className="py-3 px-4 text-center text-emerald-700 bg-emerald-50/30">{t.remainingEL}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredLeaveList.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-slate-400 font-bold">
                          No employees found matching the filters
                        </td>
                      </tr>
                    ) : (
                      filteredLeaveList.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-800">{item.id}</td>
                          <td className="py-3 px-4 text-slate-900 font-bold">
                            <div>{item.name}</div>
                            <span className="text-[10px] text-slate-400 font-medium">{item.designation}</span>
                          </td>
                          <td className="py-3 px-4 text-slate-600">{item.department}</td>
                          <td className="py-3 px-4 text-center font-mono text-slate-500 text-[10px]">{item.joiningDate}</td>
                          <td className="py-3 px-4 text-center font-mono text-slate-700">{item.openingEL}</td>
                          <td className="py-3 px-4 text-center font-mono text-slate-600" title={`${calculateTenureMonths(item.joiningDate)} months of tenure`}>
                            +{item.accumulatedEL}
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-extrabold text-blue-600 bg-blue-50/10">
                            {item.totalGrantedEL}
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-rose-600">
                            {item.usedEL}
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-black text-emerald-700 bg-emerald-50/30">
                            {item.remainingEL}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* POLICY NOTE CARD (Matching Uploaded Image rules) */}
          <div className="bg-slate-900 text-slate-200 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <h4 className="text-xs font-extrabold text-[#10b981] uppercase tracking-widest flex items-center gap-2">
              <Award className="w-4 h-4" />
              <span>{t.notes}</span>
            </h4>
            <ul className="space-y-2 text-xs font-bold text-slate-300">
              <li className="flex items-start gap-2.5">
                <span className="text-[#10b981] mt-0.5">•</span>
                <span>{t.note1}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#10b981] mt-0.5">•</span>
                <span>{t.note2}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#10b981] mt-0.5">•</span>
                <span>{t.note3}</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* HOLIDAY CALENDAR SECTION */}
      {subTab === 'calendar' && (
        <div className="space-y-6">
          {/* BEAUTIFUL RATHI'S BUILD MART HOLIDAY POSTER PANEL */}
          <div className="bg-white border border-slate-250 rounded-2xl shadow-md overflow-hidden font-sans">
            {/* Header Poster Top (Mirroring the uploaded image brand style) */}
            <div className="relative bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 py-8 px-6 text-center text-white border-b-4 border-amber-500 flex flex-col items-center">
              {/* Floating Orange Corner Accent */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500 to-amber-600 transform rotate-45 translate-x-12 -translate-y-12"></div>
              
              {/* Brand Header */}
              <div className="mb-4">
                <div className="flex items-center justify-center gap-2">
                  <h2 className="text-2xl font-black tracking-tighter text-white font-display">
                    {t.brandTitle}
                  </h2>
                </div>
                <p className="text-[11px] font-black tracking-widest text-amber-500 uppercase mt-1">
                  {t.brandSub}
                </p>
                <p className="text-[9px] text-slate-400 mt-0.5 font-bold tracking-wider">
                  {t.branches}
                </p>
              </div>

              {/* Middle Divider */}
              <div className="w-24 h-[2px] bg-amber-500 my-2"></div>

              {/* Calendar Title */}
              <h1 className="text-3xl font-black text-white tracking-wider mt-1 uppercase font-display">
                {language === 'en' ? 'HOLIDAY CALENDAR' : 'अवकाश कैलेंडर'} <span className="text-amber-500 font-mono">2026</span>
              </h1>
              <p className="text-[10px] text-slate-300 tracking-widest uppercase font-black mt-1">
                {t.trust}
              </p>
            </div>

            {/* List Table directly matching Image layout */}
            <div className="overflow-x-auto p-4 md:p-6 bg-slate-50/50">
              <table className="w-full text-left border-collapse text-xs bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <thead>
                  <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider">
                    <th className="py-3 px-4 text-center w-16">#</th>
                    <th className="py-3 px-4">{language === 'en' ? 'OCCASION / LEAVE' : 'अवकाश / अवसर'}</th>
                    <th className="py-3 px-4">{language === 'en' ? 'TYPE' : 'प्रकार'}</th>
                    <th className="py-3 px-4">{language === 'en' ? 'DATE' : 'दिनांक'}</th>
                    <th className="py-3 px-4 text-center">{language === 'en' ? 'DURATION' : 'अवधि'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 font-bold text-slate-700">
                  {HOLIDAYS_2026.map((h, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-4 text-center text-lg">{h.imgUrl}</td>
                      <td className="py-4 px-4 text-slate-900 font-extrabold text-sm">
                        {language === 'en' ? h.occasion : h.hindiOccasion}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${
                          h.type.includes('National') 
                            ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                            : h.type.includes('Religious') 
                              ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {language === 'en' ? h.type : h.hindiType}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-800 font-semibold font-mono text-xs">
                        {h.date}
                      </td>
                      <td className="py-4 px-4 text-center font-extrabold text-slate-900">
                        {language === 'en' ? h.duration : h.hindiDuration}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Poster Policy Footer (Matches bottom notes in uploaded image) */}
            <div className="bg-slate-100 border-t border-slate-200 p-5 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div className="space-y-1.5">
                <span className="text-[10px] font-black text-amber-600 uppercase tracking-wider block">
                  NOTE:
                </span>
                <ul className="space-y-1 text-[11px] font-bold text-slate-600 leading-normal">
                  <li className="flex items-start gap-1.5">
                    <span className="text-amber-500">•</span>
                    <span>{t.note1}</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-amber-500">•</span>
                    <span>{t.note2}</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-amber-500">•</span>
                    <span>{t.note3}</span>
                  </li>
                </ul>
              </div>

              {/* Little vector stamp representing trust */}
              <div className="flex justify-end pr-4 text-slate-300">
                <div className="border-4 border-dashed border-slate-250 p-3 rounded-2xl flex flex-col items-center justify-center w-36 h-36">
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                  <span className="text-[9px] font-black text-slate-500 text-center uppercase tracking-widest mt-2">
                    Verified<br/>Holiday List
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
