import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, Check, Save, UserCheck, UserX, AlertTriangle, Clock, RefreshCw, 
  ListCollapse, ThumbsUp, ThumbsDown, CheckCircle, XCircle, AlertCircle, FileSpreadsheet, List,
  Filter, Building, Users, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Employee, Attendance, AdminSettings } from '../types';
import { 
  getShiftTimings, 
  getHalfDayCheckOut, 
  getShiftDurationHours, 
  isAttendanceLate, 
  isAttendanceEarlyGoing 
} from '../utils/shift';
import PunchImportModal from './PunchImportModal';
import MonthlyCalendarReport from './MonthlyCalendarReport';

interface AttendanceTrackerProps {
  employees: Employee[];
  attendanceRecords: Attendance[];
  onSaveAttendance: (date: string, records: Attendance[]) => Promise<void>;
  onUpdateAttendanceRecords?: (records: Attendance[]) => Promise<void>;
  language: 'en' | 'hi';
  adminSettings?: AdminSettings;
}

export default function AttendanceTracker({ 
  employees, 
  attendanceRecords, 
  onSaveAttendance, 
  onUpdateAttendanceRecords,
  language,
  adminSettings
}: AttendanceTrackerProps) {
  const [activeTab, setActiveTab] = useState<'daily' | 'misspunch' | 'halfday' | 'calendar'>('daily');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [localRecords, setLocalRecords] = useState<{ [empId: string]: Attendance }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  
  // States for approvals
  const [pendingChanges, setPendingChanges] = useState<Attendance[]>([]);
  const [isSavingApprovals, setIsSavingApprovals] = useState(false);

  const handlePunchImportComplete = async (importedRecords: Attendance[]) => {
    if (onUpdateAttendanceRecords) {
      await onUpdateAttendanceRecords(importedRecords);
      
      // Update local state immediately if any match the currently selected date
      const recordsForDate = importedRecords.filter(r => r.date === selectedDate);
      if (recordsForDate.length > 0) {
        setLocalRecords(prev => {
          const copy = { ...prev };
          recordsForDate.forEach(r => {
            copy[r.employeeId] = r;
          });
          return copy;
        });
      }
      alert(language === 'en' ? 'Biometric records imported successfully!' : 'बायोमेट्रिक पंच लॉग सफलतापूर्वक आयात किए गए!');
    } else {
      alert('Import service not registered on parent.');
    }
  };

  // Filters state
  const [selectedBranch, setSelectedBranch] = useState('All');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('All');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const branchOptions = useMemo(() => {
    const branches = new Set<string>();
    employees.forEach(emp => {
      if (emp.branch) branches.add(emp.branch);
    });
    return ['All', ...Array.from(branches)];
  }, [employees]);

  const departmentOptions = useMemo(() => {
    const depts = new Set<string>();
    employees.forEach(emp => {
      if (emp.department) depts.add(emp.department);
    });
    return ['All', ...Array.from(depts)];
  }, [employees]);

  const employeeOptions = useMemo(() => {
    return employees.map(emp => ({
      id: emp.id,
      name: `${emp.name} (${emp.id})`
    }));
  }, [employees]);

  const filteredActiveEmployees = useMemo(() => {
    return employees.filter(emp => {
      if (!emp.isActive) return false;
      const matchesBranch = selectedBranch === 'All' || emp.branch === selectedBranch;
      const matchesDept = selectedDept === 'All' || emp.department === selectedDept;
      const matchesEmployee = selectedEmployeeId === 'All' || emp.id === selectedEmployeeId;
      return matchesBranch && matchesDept && matchesEmployee;
    });
  }, [employees, selectedBranch, selectedDept, selectedEmployeeId]);

  const paginatedActiveEmployees = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredActiveEmployees.slice(start, start + pageSize);
  }, [filteredActiveEmployees, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredActiveEmployees.length / pageSize) || 1;

  const activeEmployees = filteredActiveEmployees;

  const t = {
    en: {
      title: "Attendance Tracker",
      selectDate: "Select Work Date",
      bulkPresent: "Mark All Present",
      bulkAbsent: "Mark All Absent",
      colEmp: "Employee Info",
      colStatus: "Attendance Status",
      colTiming: "Working Hours",
      colOvertime: "Overtime (Hrs)",
      colRemarks: "Remarks / Notes",
      present: "Present",
      absent: "Absent",
      halfDay: "Half Day",
      leave: "On Leave",
      checkIn: "In",
      checkOut: "Out",
      saveBtn: "Save & Sync Attendance",
      saving: "Uploading to Sheets...",
      savedSuccess: "Attendance recorded successfully!",
      noEmployees: "Please register active employees first under the Employee tab.",
      autoOvertimeTitle: "Auto-calculate Overtime",
      
      // Approvals specific
      subTabDaily: "Daily Attendance Register",
      subTabMissPunch: "Miss Punch Approvals",
      subTabHalfDay: "Half Day Register",
      subTabCalendar: "Monthly Calendar Report",
      approvalStatus: "Approval Status",
      action: "Action",
      approved: "Approved",
      rejected: "Rejected",
      pending: "Pending",
      saveApprovals: "Save & Sync Approvals",
      noMissPunch: "No missed punch logs found.",
      noHalfDays: "No half-day attendance logs found.",
      date: "Date",
      approvalUpdated: "Approvals saved and synced with Google Sheets successfully!"
    },
    hi: {
      title: "उपस्थिति ट्रैकर",
      selectDate: "कार्य तिथि चुनें",
      bulkPresent: "सबको उपस्थित करें",
      bulkAbsent: "सबको अनुपस्थित करें",
      colEmp: "कर्मचारी विवरण",
      colStatus: "उपस्थिति की स्थिति",
      colTiming: "काम के घंटे",
      colOvertime: "ओवरटाइम (घंटे)",
      colRemarks: "टिप्पणी / नोट्स",
      present: "उपस्थित",
      absent: "अनुपस्थित",
      halfDay: "हाफ डे",
      leave: "छुट्टी पर",
      checkIn: "आगमन",
      checkOut: "प्रस्थान",
      saveBtn: "उपस्थिति सुरक्षित करें",
      saving: "शीट्स में अपलोड हो रहा है...",
      savedSuccess: "उपस्थिति सफलतापूर्वक दर्ज की गई!",
      noEmployees: "कृपया पहले कर्मचारी टैब के तहत सक्रिय कर्मचारियों को पंजीकृत करें।",
      autoOvertimeTitle: "ऑटो ओवरटाइम गणना",

      // Approvals specific
      subTabDaily: "दैनिक उपस्थिति रजिस्टर",
      subTabMissPunch: "मिस पंच मंजूरी",
      subTabHalfDay: "हाफ डे रजिस्टर",
      subTabCalendar: "मासिक कैलेंडर रिपोर्ट",
      approvalStatus: "मंजूरी की स्थिति",
      action: "कार्रवाई",
      approved: "मंजूर किया",
      rejected: "अस्वीकृत",
      pending: "लंबित",
      saveApprovals: "अनुमोदन सहेजें",
      noMissPunch: "कोई मिस पंच रिकॉर्ड नहीं मिला।",
      noHalfDays: "कोई हाफ-डे रिकॉर्ड नहीं मिला।",
      date: "तारीख",
      approvalUpdated: "अनुमोदन सहेजे गए और Google Sheets के साथ सफलतापूर्वक सिंक किए गए!"
    }
  }[language];

  // Load existing records or set defaults when selectedDate or employees list changes
  useEffect(() => {
    const recordsForDate = attendanceRecords.filter(r => r.date === selectedDate);
    const newLocalRecords: { [empId: string]: Attendance } = {};

    activeEmployees.forEach(emp => {
      const existing = recordsForDate.find(r => r.employeeId === emp.id);
      if (existing) {
        newLocalRecords[emp.id] = { ...existing };
      } else {
        const timings = getShiftTimings(emp.workTiming, adminSettings?.defaultCheckIn || '09:00', adminSettings?.defaultCheckOut || '18:00');
        newLocalRecords[emp.id] = {
          date: selectedDate,
          employeeId: emp.id,
          status: 'Present',
          checkIn: timings.checkIn,
          checkOut: timings.checkOut,
          overtimeHours: 0,
          remarks: '',
          approvalStatus: 'Pending'
        };
      }
    });

    setLocalRecords(newLocalRecords);
  }, [selectedDate, attendanceRecords, employees]);

  const handleStatusChange = (empId: string, status: Attendance['status']) => {
    const emp = employees.find(e => e.id === empId);
    const timings = getShiftTimings(emp?.workTiming, adminSettings?.defaultCheckIn || '09:00', adminSettings?.defaultCheckOut || '18:00');

    setLocalRecords(prev => {
      const rec = prev[empId];
      let checkIn = rec.checkIn;
      let checkOut = rec.checkOut;
      let overtimeHours = rec.overtimeHours;
      let approvalStatus = rec.approvalStatus || 'Pending';

      if (status === 'Absent' || status === 'Leave') {
        checkIn = '';
        checkOut = '';
        overtimeHours = 0;
      } else if (status === 'Present' && (rec.status === 'Miss Punch' || !checkIn || checkIn === '' || !checkOut || checkOut === '')) {
        checkIn = timings.checkIn;
        checkOut = timings.checkOut;
      } else if (status === 'Half Day' && (!checkIn || checkIn === timings.checkIn)) {
        checkIn = timings.checkIn;
        checkOut = getHalfDayCheckOut(timings.checkIn);
        overtimeHours = 0;
      } else if (status === 'Miss Punch') {
        checkIn = rec.checkIn || timings.checkIn;
        checkOut = '';
        overtimeHours = 0;
        approvalStatus = 'Pending';
      }

      return {
        ...prev,
        [empId]: {
          ...rec,
          status,
          checkIn,
          checkOut,
          overtimeHours,
          approvalStatus
        }
      };
    });
  };

  const handleTimeChange = (empId: string, field: 'checkIn' | 'checkOut', value: string) => {
    setLocalRecords(prev => {
      const rec = prev[empId];
      const updated = { ...rec, [field]: value };

      if (field === 'checkOut' && rec.checkIn && value) {
        const emp = employees.find(e => e.id === empId);
        const timings = getShiftTimings(emp?.workTiming, adminSettings?.defaultCheckIn || '09:00', adminSettings?.defaultCheckOut || '18:00');
        const regularHours = getShiftDurationHours(timings.checkIn, timings.checkOut);

        const [inH, inM] = rec.checkIn.split(':').map(Number);
        const [outH, outM] = value.split(':').map(Number);

        if (!isNaN(inH) && !isNaN(outH)) {
          let totalHours = (outH + outM / 60) - (inH + inM / 60);
          if (totalHours < 0) totalHours += 24; // overnight shift

          if (totalHours > regularHours) {
            const calculatedOvertime = Math.round((totalHours - regularHours) * 10) / 10;
            updated.overtimeHours = Math.max(0, calculatedOvertime);
          } else {
            updated.overtimeHours = 0;
          }
        }
      }

      return { ...prev, [empId]: updated };
    });
  };

  const handleNumericChange = (empId: string, value: number) => {
    setLocalRecords(prev => ({
      ...prev,
      [empId]: { ...prev[empId], overtimeHours: Math.max(0, value) }
    }));
  };

  const handleRemarksChange = (empId: string, value: string) => {
    setLocalRecords(prev => ({
      ...prev,
      [empId]: { ...prev[empId], remarks: value }
    }));
  };

  const markBulkStatus = (status: Attendance['status']) => {
    setLocalRecords(prev => {
      const bulk = { ...prev };
      Object.keys(bulk).forEach(empId => {
        const emp = employees.find(e => e.id === empId);
        const timings = getShiftTimings(emp?.workTiming, adminSettings?.defaultCheckIn || '09:00', adminSettings?.defaultCheckOut || '18:00');

        bulk[empId] = {
          ...bulk[empId],
          status,
          checkIn: (status === 'Present' ? timings.checkIn : status === 'Half Day' ? timings.checkIn : ''),
          checkOut: (status === 'Present' ? timings.checkOut : status === 'Half Day' ? getHalfDayCheckOut(timings.checkIn) : ''),
          overtimeHours: 0,
        };
      });
      return bulk;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const recordsToSave = Object.values(localRecords) as Attendance[];
      await onSaveAttendance(selectedDate, recordsToSave);
      alert(t.savedSuccess);
    } catch (err) {
      console.error(err);
      alert('Error updating Google Sheets. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handling Miss Punch and Half Day Approvals
  const missPunchLogs = attendanceRecords
    .filter(r => r.status === 'Miss Punch')
    .sort((a, b) => b.date.localeCompare(a.date));

  const halfDayLogs = attendanceRecords
    .filter(r => r.status === 'Half Day')
    .sort((a, b) => b.date.localeCompare(a.date));

  const handleApprovalChange = (record: Attendance, field: 'approvalStatus' | 'checkIn' | 'checkOut' | 'remarks' | 'status', value: any) => {
    setPendingChanges(prev => {
      const existsIdx = prev.findIndex(r => r.employeeId === record.employeeId && r.date === record.date);
      const updatedRecord = existsIdx > -1 
        ? { ...prev[existsIdx], [field]: value } 
        : { ...record, [field]: value };

      // If approved, let's automatically add default times if they are empty
      if (field === 'approvalStatus' && value === 'Approved') {
        if (updatedRecord.status === 'Miss Punch') {
          const emp = employees.find(e => e.id === record.employeeId);
          const timings = getShiftTimings(emp?.workTiming, adminSettings?.defaultCheckIn || '09:00', adminSettings?.defaultCheckOut || '18:00');
          if (!updatedRecord.checkIn || updatedRecord.checkIn === '') updatedRecord.checkIn = timings.checkIn;
          if (!updatedRecord.checkOut || updatedRecord.checkOut === '') updatedRecord.checkOut = timings.checkOut;
          // Toggling to Present once approved is standard, or keeping it Miss Punch but marked approved
        }
      }

      if (existsIdx > -1) {
        const copy = [...prev];
        copy[existsIdx] = updatedRecord;
        return copy;
      } else {
        return [...prev, updatedRecord];
      }
    });
  };

  const getLogCurrentValue = (log: Attendance, field: keyof Attendance) => {
    const pending = pendingChanges.find(p => p.employeeId === log.employeeId && p.date === log.date);
    return pending ? pending[field] : log[field];
  };

  const handleSaveApprovals = async () => {
    if (pendingChanges.length === 0) {
      alert('No pending approval changes to save.');
      return;
    }

    setIsSavingApprovals(true);
    try {
      if (onUpdateAttendanceRecords) {
        await onUpdateAttendanceRecords(pendingChanges);
        setPendingChanges([]);
        alert(t.approvalUpdated);
      } else {
        alert('Approvals service not registered.');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save approvals. Please check Google Sheets authorization.');
    } finally {
      setIsSavingApprovals(false);
    }
  };

  const getEmployeeName = (empId: string) => {
    const emp = employees.find(e => e.id === empId);
    return emp ? emp.name : empId;
  };

  const getEmployeeDept = (empId: string) => {
    const emp = employees.find(e => e.id === empId);
    return emp ? `${emp.department} · ${emp.designation}` : '';
  };

  return (
    <div className="space-y-6">
      
      {/* Tab Navigation header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-200 pb-3 gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-800 tracking-tight flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#03623c]" />
            {t.title}
          </h2>
          <p className="text-xs text-gray-400 font-medium">Verify employee logs, approve missed punches, and monitor half days.</p>
        </div>

        {/* Navigation Tabs segment */}
        <div className="inline-flex p-1 bg-gray-100 rounded-xl gap-1 border border-gray-200/50">
          <button
            onClick={() => { setActiveTab('daily'); setPendingChanges([]); }}
            className={`px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${
              activeTab === 'daily' 
                ? 'bg-white text-gray-800 shadow-xs border border-gray-200/20' 
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {t.subTabDaily}
          </button>
          <button
            onClick={() => { setActiveTab('misspunch'); setPendingChanges([]); }}
            className={`px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1.5 ${
              activeTab === 'misspunch' 
                ? 'bg-white text-gray-800 shadow-xs border border-gray-200/20' 
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <span>{t.subTabMissPunch}</span>
            {missPunchLogs.filter(l => (l.approvalStatus || 'Pending') === 'Pending').length > 0 && (
              <span className="bg-amber-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-black animate-pulse">
                {missPunchLogs.filter(l => (l.approvalStatus || 'Pending') === 'Pending').length}
              </span>
            )}
          </button>
          <button
            onClick={() => { setActiveTab('halfday'); setPendingChanges([]); }}
            className={`px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1.5 ${
              activeTab === 'halfday' 
                ? 'bg-white text-gray-800 shadow-xs border border-gray-200/20' 
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <span>{t.subTabHalfDay}</span>
            {halfDayLogs.filter(l => (l.approvalStatus || 'Pending') === 'Pending').length > 0 && (
              <span className="bg-amber-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-black">
                {halfDayLogs.filter(l => (l.approvalStatus || 'Pending') === 'Pending').length}
              </span>
            )}
          </button>
          <button
            onClick={() => { setActiveTab('calendar'); setPendingChanges([]); }}
            className={`px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${
              activeTab === 'calendar' 
                ? 'bg-white text-gray-800 shadow-xs border border-gray-200/20' 
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {t.subTabCalendar}
          </button>
        </div>
      </div>

      {/* DAILY ATTENDANCE REGISTER */}
      {activeTab === 'daily' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-500" />
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">{t.selectDate}</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#03623c] bg-white cursor-pointer text-gray-800"
                  id="attendance-date"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="px-4 py-2 border border-[#03623c]/20 bg-[#03623c]/5 text-[#03623c] hover:bg-[#03623c]/10 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer hover:shadow-3xs"
                id="bulk-import-punch"
              >
                <FileSpreadsheet className="w-4 h-4" />
                {language === 'en' ? 'Upload Punch Machine Data' : 'पंच मशीन डाटा अपलोड करें'}
              </button>
              <button
                onClick={() => markBulkStatus('Present')}
                className="px-4 py-2 border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                id="bulk-present"
              >
                <UserCheck className="w-4 h-4" />
                {t.bulkPresent}
              </button>
              <button
                onClick={() => markBulkStatus('Absent')}
                className="px-4 py-2 border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                id="bulk-absent"
              >
                <UserX className="w-4 h-4" />
                {t.bulkAbsent}
              </button>
            </div>
          </div>

          {/* Robust Filters segment */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-[#03623c]" />
              <span className="text-xs font-bold text-gray-800 uppercase tracking-wider font-mono">Filters:</span>
            </div>

            {/* Department Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-extrabold text-gray-500 uppercase font-mono">Dept:</span>
              <select
                value={selectedDept}
                onChange={(e) => { setSelectedDept(e.target.value); setCurrentPage(1); }}
                className="bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700 px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-[#03623c] transition-all cursor-pointer"
              >
                {departmentOptions.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* Branch Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-extrabold text-gray-500 uppercase font-mono">Branch:</span>
              <select
                value={selectedBranch}
                onChange={(e) => { setSelectedBranch(e.target.value); setCurrentPage(1); }}
                className="bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700 px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-[#03623c] transition-all cursor-pointer"
              >
                {branchOptions.map(branch => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </select>
            </div>

            {/* Employee ID Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-extrabold text-gray-500 uppercase font-mono">Employee:</span>
              <select
                value={selectedEmployeeId}
                onChange={(e) => { setSelectedEmployeeId(e.target.value); setCurrentPage(1); }}
                className="bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700 px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-[#03623c] transition-all cursor-pointer max-w-[150px]"
              >
                <option value="All">{language === 'en' ? 'All Employees' : 'सभी कर्मचारी'}</option>
                {employeeOptions.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            {filteredActiveEmployees.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <th className="py-4 px-6 min-w-[200px]">{t.colEmp}</th>
                      <th className="py-4 px-6 text-center min-w-[280px]">{t.colStatus}</th>
                      <th className="py-4 px-6 text-center min-w-[180px]">{t.colTiming}</th>
                      <th className="py-4 px-6 text-center min-w-[100px]">{t.colOvertime}</th>
                      <th className="py-4 px-6">{t.colRemarks}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {paginatedActiveEmployees.map((emp) => {
                      const timings = getShiftTimings(emp.workTiming, adminSettings?.defaultCheckIn || '09:00', adminSettings?.defaultCheckOut || '18:00');
                      const record = localRecords[emp.id] || {
                        date: selectedDate,
                        employeeId: emp.id,
                        status: 'Present',
                        checkIn: timings.checkIn,
                        checkOut: timings.checkOut,
                        overtimeHours: 0,
                        remarks: '',
                      };

                      const isLate = isAttendanceLate(record, emp.workTiming, adminSettings?.defaultCheckIn || '09:00');
                      const isEarly = isAttendanceEarlyGoing(record, emp.workTiming, adminSettings?.defaultCheckOut || '18:00');

                      return (
                        <tr key={emp.id} className="hover:bg-gray-50/30 transition-colors">
                          <td className="py-4 px-6">
                            <div>
                              <div className="font-semibold text-gray-900">{emp.name}</div>
                              <div className="text-xs font-mono text-gray-400 font-medium">{emp.id} · {emp.designation}</div>
                            </div>
                          </td>

                          <td className="py-4 px-6 text-center">
                            {record.status === 'Miss Punch' ? (
                              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 bg-amber-50/70 border border-amber-200 p-1.5 rounded-xl">
                                <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-extrabold text-amber-800 uppercase tracking-wider animate-pulse">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                  <span>{language === 'en' ? 'Miss Punch' : 'मिस पंच'}</span>
                                </div>
                                <div className="flex gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleStatusChange(emp.id, 'Present')}
                                    className="px-2.5 py-1 bg-[#03623c] hover:bg-[#024d2e] text-white font-extrabold text-[10px] rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-3xs"
                                  >
                                    <Check className="w-3 h-3" />
                                    <span>{language === 'en' ? 'Approve' : 'मंजूर करें'}</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleStatusChange(emp.id, 'Absent')}
                                    className="px-2 py-1 bg-white hover:bg-red-50 border border-gray-200 hover:border-red-200 text-gray-500 hover:text-red-600 font-bold text-[10px] rounded-lg transition-colors cursor-pointer"
                                  >
                                    {language === 'en' ? 'Absent' : 'अनुपस्थित'}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="inline-flex p-1 bg-gray-100 rounded-xl gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(emp.id, 'Present')}
                                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                                    record.status === 'Present' 
                                      ? 'bg-[#03623c] text-white shadow-xs' 
                                      : 'text-gray-600 hover:text-gray-900'
                                  }`}
                                >
                                  {t.present}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(emp.id, 'Half Day')}
                                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                                    record.status === 'Half Day' 
                                      ? 'bg-amber-500 text-white shadow-xs' 
                                      : 'text-gray-600 hover:text-gray-900'
                                  }`}
                                >
                                  {t.halfDay}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(emp.id, 'Absent')}
                                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                                    record.status === 'Absent' 
                                      ? 'bg-red-600 text-white shadow-xs' 
                                      : 'text-gray-600 hover:text-gray-900'
                                  }`}
                                >
                                  {t.absent}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(emp.id, 'Leave')}
                                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                                    record.status === 'Leave' 
                                      ? 'bg-teal-600 text-white shadow-xs' 
                                      : 'text-gray-600 hover:text-gray-900'
                                  }`}
                                >
                                  {t.leave}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(emp.id, 'Miss Punch')}
                                  className="px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                                >
                                  {language === 'en' ? 'Miss Punch' : 'मिस पंच'}
                                </button>
                              </div>
                            )}
                          </td>

                          <td className="py-4 px-6 text-center">
                            {record.status === 'Present' || record.status === 'Half Day' || record.status === 'Miss Punch' ? (
                              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                                <div className="flex flex-col items-start gap-1">
                                  <div className="flex items-center gap-1">
                                    <span className="text-xxs text-gray-400 font-bold uppercase">{t.checkIn}</span>
                                    <input
                                      type="time"
                                      value={record.checkIn}
                                      onChange={(e) => handleTimeChange(emp.id, 'checkIn', e.target.value)}
                                      className={`border rounded-lg px-1.5 py-1 text-xs font-semibold text-gray-700 bg-white focus:outline-none focus:ring-1 ${
                                        isLate 
                                          ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/20' 
                                          : 'border-gray-200 focus:ring-[#03623c]'
                                      }`}
                                    />
                                  </div>
                                  {isLate && (
                                    <span className="text-[10px] text-rose-600 font-black flex items-center gap-1 pl-10" title="Late Arrival">
                                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                                      <span>{language === 'en' ? 'Late' : 'देरी'}</span>
                                    </span>
                                  )}
                                </div>

                                <div className="flex flex-col items-start gap-1">
                                  <div className="flex items-center gap-1">
                                    <span className="text-xxs text-gray-400 font-bold uppercase">{t.checkOut}</span>
                                    <input
                                      type="time"
                                      value={record.checkOut}
                                      onChange={(e) => handleTimeChange(emp.id, 'checkOut', e.target.value)}
                                      className={`border rounded-lg px-1.5 py-1 text-xs font-semibold text-gray-700 bg-white focus:outline-none focus:ring-1 ${
                                        isEarly 
                                          ? 'border-amber-300 focus:ring-amber-500 bg-amber-50/20' 
                                          : 'border-gray-200 focus:ring-[#03623c]'
                                      }`}
                                    />
                                  </div>
                                  {isEarly && (
                                    <span className="text-[10px] text-amber-600 font-black flex items-center gap-1 pl-11" title="Early Departure">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                      <span>{language === 'en' ? 'Early' : 'जल्दी'}</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )}
                          </td>

                          <td className="py-4 px-6 text-center">
                            {record.status === 'Present' || record.status === 'Half Day' || record.status === 'Miss Punch' ? (
                              <div className="inline-flex items-center gap-1">
                                <input
                                  type="number"
                                  step="0.5"
                                  min="0"
                                  value={record.overtimeHours || ''}
                                  placeholder="0"
                                  onChange={(e) => handleNumericChange(emp.id, Number(e.target.value))}
                                  className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-xs text-center font-semibold text-gray-700 bg-white focus:outline-none"
                                />
                                <span className="text-xxs text-gray-400 font-medium">h</span>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )}
                          </td>

                          <td className="py-4 px-6">
                            <input
                              type="text"
                              value={record.remarks}
                              onChange={(e) => handleRemarksChange(emp.id, e.target.value)}
                              placeholder="e.g. Medical emergency, Late entry"
                              className="w-full border border-gray-200 rounded-lg px-3 py-1 text-xs text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#03623c]"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Entries control & Pagination */}
              <div className="bg-gray-50 border-t border-gray-100 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-700">Show Entries:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                    className="bg-white border border-gray-200 text-xs font-semibold text-gray-700 px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-[#03623c] cursor-pointer"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>

                <div className="text-xs text-gray-500 font-medium">
                  Showing <span className="font-bold text-slate-800">{filteredActiveEmployees.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</span> to <span className="font-bold text-slate-800">{Math.min(currentPage * pageSize, filteredActiveEmployees.length)}</span> of <span className="font-bold text-slate-800">{filteredActiveEmployees.length}</span> entries
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <span className="text-xs font-bold text-gray-800 font-mono">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              </>
            ) : (
              <div className="text-center py-16 text-gray-400 bg-gray-50/50">
                <AlertTriangle className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-base font-semibold">{t.noEmployees}</p>
              </div>
            )}

            {filteredActiveEmployees.length > 0 && (
              <div className="bg-gray-50 border-t border-gray-100 p-4 flex justify-between items-center">
                <span className="text-xs text-gray-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {t.autoOvertimeTitle}
                </span>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-[#03623c] hover:bg-[#024d2e] disabled:bg-[#03623c]/50 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                  id="save-attendance"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      {t.saving}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {t.saveBtn}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MISS PUNCH APPROVALS */}
      {activeTab === 'misspunch' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-extrabold text-amber-800">Miss Punch Operations:</span>
              <p className="text-amber-700/95 mt-0.5 font-medium leading-relaxed">
                Review missed punches, enter missing check-in/out times, and change their Approval Status. Approved miss-punches will enable full payout calculation during payroll run computation. Click <span className="font-bold">Save & Sync Approvals</span> below to commit your reviews.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            {missPunchLogs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      <th className="py-4 px-6">{t.date}</th>
                      <th className="py-4 px-6">{t.colEmp}</th>
                      <th className="py-4 px-6 text-center">{t.colTiming}</th>
                      <th className="py-4 px-6 text-center">{t.approvalStatus}</th>
                      <th className="py-4 px-6">{t.colRemarks}</th>
                      <th className="py-4 px-6 text-right">{t.action}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {missPunchLogs.map((log) => {
                      const currentStatus = getLogCurrentValue(log, 'approvalStatus') || 'Pending';
                      const checkInVal = getLogCurrentValue(log, 'checkIn') || '';
                      const checkOutVal = getLogCurrentValue(log, 'checkOut') || '';
                      const remarksVal = getLogCurrentValue(log, 'remarks') || '';
                      const isRowEdited = pendingChanges.some(p => p.employeeId === log.employeeId && p.date === log.date);

                      return (
                        <tr key={`${log.employeeId}-${log.date}`} className={`hover:bg-gray-50/30 transition-colors ${isRowEdited ? 'bg-amber-50/20' : ''}`}>
                          <td className="py-4 px-6 font-mono font-bold text-gray-900">{log.date}</td>
                          <td className="py-4 px-6">
                            <div>
                              <div className="font-bold text-gray-900">{getEmployeeName(log.employeeId)}</div>
                              <div className="text-[10px] font-mono text-gray-400 mt-0.5">{log.employeeId} · {getEmployeeDept(log.employeeId)}</div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <div className="inline-flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                <span className="text-[9px] text-gray-400 font-black uppercase">In</span>
                                <input
                                  type="time"
                                  value={checkInVal}
                                  onChange={(e) => handleApprovalChange(log, 'checkIn', e.target.value)}
                                  className="border border-gray-200 rounded-lg px-1.5 py-1 text-xs text-gray-700 bg-white focus:outline-none"
                                />
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-[9px] text-gray-400 font-black uppercase">Out</span>
                                <input
                                  type="time"
                                  value={checkOutVal}
                                  onChange={(e) => handleApprovalChange(log, 'checkOut', e.target.value)}
                                  className="border border-gray-200 rounded-lg px-1.5 py-1 text-xs text-gray-700 bg-white focus:outline-none"
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <select
                              value={currentStatus}
                              onChange={(e) => handleApprovalChange(log, 'approvalStatus', e.target.value)}
                              className={`border rounded-lg px-2.5 py-1 text-xs font-bold focus:outline-none ${
                                currentStatus === 'Approved' 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                  : currentStatus === 'Rejected' 
                                    ? 'bg-red-50 text-red-700 border-red-200' 
                                    : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                              }`}
                            >
                              <option value="Pending">{t.pending}</option>
                              <option value="Approved">{t.approved}</option>
                              <option value="Rejected">{t.rejected}</option>
                            </select>
                          </td>
                          <td className="py-4 px-6">
                            <input
                              type="text"
                              value={remarksVal}
                              onChange={(e) => handleApprovalChange(log, 'remarks', e.target.value)}
                              placeholder="Adjustment remarks..."
                              className="border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700 bg-white focus:outline-none w-full max-w-[180px]"
                            />
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  handleApprovalChange(log, 'approvalStatus', 'Approved');
                                }}
                                className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg cursor-pointer transition-all"
                                title="Quick Approve"
                              >
                                <ThumbsUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  handleApprovalChange(log, 'approvalStatus', 'Rejected');
                                }}
                                className="p-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg cursor-pointer transition-all"
                                title="Quick Reject"
                              >
                                <ThumbsDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-16 text-gray-400 bg-gray-50/50">
                <AlertCircle className="w-12 h-12 mx-auto text-gray-200 mb-2" />
                <p className="text-xs font-bold">{t.noMissPunch}</p>
              </div>
            )}

            {/* Sync bar */}
            {missPunchLogs.length > 0 && (
              <div className="bg-gray-50 border-t border-gray-100 p-4 flex justify-between items-center">
                <span className="text-xs text-gray-500 font-semibold">
                  Pending Changes: <span className="text-emerald-700">{pendingChanges.length} unsaved updates</span>
                </span>
                <button
                  onClick={handleSaveApprovals}
                  disabled={isSavingApprovals || pendingChanges.length === 0}
                  className="bg-[#03623c] hover:bg-[#024d2e] disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  {isSavingApprovals ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      {t.saving}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {t.saveApprovals}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* HALF DAY REGISTER & APPROVALS */}
      {activeTab === 'halfday' && (
        <div className="space-y-4">
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-extrabold text-indigo-800">Half Day Registers & Approvals:</span>
              <p className="text-indigo-700/95 mt-0.5 font-medium leading-relaxed">
                Log and change approval decisions for half-day duties. Toggle approval status of half-day attendance logs securely. Sync and reload anytime.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            {halfDayLogs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      <th className="py-4 px-6">{t.date}</th>
                      <th className="py-4 px-6">{t.colEmp}</th>
                      <th className="py-4 px-6 text-center">{t.colTiming}</th>
                      <th className="py-4 px-6 text-center">{t.approvalStatus}</th>
                      <th className="py-4 px-6">{t.colRemarks}</th>
                      <th className="py-4 px-6 text-right">{t.action}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {halfDayLogs.map((log) => {
                      const currentStatus = getLogCurrentValue(log, 'approvalStatus') || 'Pending';
                      const checkInVal = getLogCurrentValue(log, 'checkIn') || '';
                      const checkOutVal = getLogCurrentValue(log, 'checkOut') || '';
                      const remarksVal = getLogCurrentValue(log, 'remarks') || '';
                      const isRowEdited = pendingChanges.some(p => p.employeeId === log.employeeId && p.date === log.date);

                      return (
                        <tr key={`${log.employeeId}-${log.date}`} className={`hover:bg-gray-50/30 transition-colors ${isRowEdited ? 'bg-indigo-50/20' : ''}`}>
                          <td className="py-4 px-6 font-mono font-bold text-gray-900">{log.date}</td>
                          <td className="py-4 px-6">
                            <div>
                              <div className="font-bold text-gray-900">{getEmployeeName(log.employeeId)}</div>
                              <div className="text-[10px] font-mono text-gray-400 mt-0.5">{log.employeeId} · {getEmployeeDept(log.employeeId)}</div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <div className="inline-flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                <span className="text-[9px] text-gray-400 font-black uppercase">In</span>
                                <input
                                  type="time"
                                  value={checkInVal}
                                  onChange={(e) => handleApprovalChange(log, 'checkIn', e.target.value)}
                                  className="border border-gray-200 rounded-lg px-1.5 py-1 text-xs text-gray-700 bg-white focus:outline-none"
                                />
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-[9px] text-gray-400 font-black uppercase">Out</span>
                                <input
                                  type="time"
                                  value={checkOutVal}
                                  onChange={(e) => handleApprovalChange(log, 'checkOut', e.target.value)}
                                  className="border border-gray-200 rounded-lg px-1.5 py-1 text-xs text-gray-700 bg-white focus:outline-none"
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <select
                              value={currentStatus}
                              onChange={(e) => handleApprovalChange(log, 'approvalStatus', e.target.value)}
                              className={`border rounded-lg px-2.5 py-1 text-xs font-bold focus:outline-none ${
                                currentStatus === 'Approved' 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                  : currentStatus === 'Rejected' 
                                    ? 'bg-red-50 text-red-700 border-red-200' 
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              <option value="Pending">{t.pending}</option>
                              <option value="Approved">{t.approved}</option>
                              <option value="Rejected">{t.rejected}</option>
                            </select>
                          </td>
                          <td className="py-4 px-6">
                            <input
                              type="text"
                              value={remarksVal}
                              onChange={(e) => handleApprovalChange(log, 'remarks', e.target.value)}
                              placeholder="Remarks..."
                              className="border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700 bg-white focus:outline-none w-full max-w-[180px]"
                            />
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  handleApprovalChange(log, 'approvalStatus', 'Approved');
                                }}
                                className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg cursor-pointer transition-all"
                                title="Quick Approve"
                              >
                                <ThumbsUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  handleApprovalChange(log, 'approvalStatus', 'Rejected');
                                }}
                                className="p-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg cursor-pointer transition-all"
                                title="Quick Reject"
                              >
                                <ThumbsDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-16 text-gray-400 bg-gray-50/50">
                <AlertCircle className="w-12 h-12 mx-auto text-gray-200 mb-2" />
                <p className="text-xs font-bold">{t.noHalfDays}</p>
              </div>
            )}

            {/* Sync bar */}
            {halfDayLogs.length > 0 && (
              <div className="bg-gray-50 border-t border-gray-100 p-4 flex justify-between items-center">
                <span className="text-xs text-gray-500 font-semibold">
                  Pending Changes: <span className="text-indigo-700">{pendingChanges.length} unsaved updates</span>
                </span>
                <button
                  onClick={handleSaveApprovals}
                  disabled={isSavingApprovals || pendingChanges.length === 0}
                  className="bg-[#03623c] hover:bg-[#024d2e] disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  {isSavingApprovals ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      {t.saving}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {t.saveApprovals}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CALENDAR VIEW */}
      {activeTab === 'calendar' && (
        <MonthlyCalendarReport
          isAdmin={true}
          employeeList={employees}
          attendanceRecords={attendanceRecords}
          adminSettings={adminSettings || { defaultCheckIn: '09:00', defaultCheckOut: '18:00' } as any}
          language={language}
        />
      )}

      {/* Biometric Punch Import Modal */}
      <PunchImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        employees={employees}
        onImportComplete={handlePunchImportComplete}
        language={language}
        adminSettings={adminSettings}
      />

    </div>
  );
}
