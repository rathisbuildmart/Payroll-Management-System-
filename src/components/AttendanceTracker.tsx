import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, Check, Save, UserCheck, UserX, AlertTriangle, Clock, RefreshCw, 
  ListCollapse, ThumbsUp, ThumbsDown, CheckCircle, XCircle, AlertCircle, FileSpreadsheet, List,
  Filter, Building, Users, ChevronLeft, ChevronRight, History, Flame, MessageSquare,
  Lock, Unlock, ShieldAlert, ShieldCheck, Key, Settings, Sparkles, CheckCheck, Send, Eye, FileText, ArrowRight, Edit3, FileCheck2
} from 'lucide-react';
import { Employee, Attendance, AdminSettings, AuditLog, AttendanceChangeRequest } from '../types';
import { 
  getShiftTimings, 
  getHalfDayCheckOut, 
  getShiftDurationHours, 
  isAttendanceLate, 
  isAttendanceEarlyGoing 
} from '../utils/shift';
import PunchImportModal from './PunchImportModal';
import MonthlyCalendarReport from './MonthlyCalendarReport';
import AttendanceHeatmap from './AttendanceHeatmap';
import { WhatsAppModal } from './WhatsAppModal';
import AttendanceChangeRequestModal from './AttendanceChangeRequestModal';
import AttendanceChangeRequestsTab from './AttendanceChangeRequestsTab';
import AttendanceAuditReportTab from './AttendanceAuditReportTab';
import MonthlyApprovalReportModal from './MonthlyApprovalReportModal';

interface AttendanceTrackerProps {
  employees: Employee[];
  attendanceRecords: Attendance[];
  onSaveAttendance: (date: string, records: Attendance[]) => Promise<void>;
  onUpdateAttendanceRecords?: (records: Attendance[]) => Promise<void>;
  language: 'en' | 'hi';
  adminSettings?: AdminSettings;
  onUpdateSettings?: (settings: AdminSettings) => Promise<void>;
  portalUser?: any;
  auditLogs?: AuditLog[];
  onAddAuditLogs?: (logs: AuditLog[]) => void;
  attendanceChangeRequests?: AttendanceChangeRequest[];
  onSaveChangeRequests?: (requests: AttendanceChangeRequest[]) => Promise<void>;
}

export default function AttendanceTracker({ 
  employees, 
  attendanceRecords, 
  onSaveAttendance, 
  onUpdateAttendanceRecords,
  language,
  adminSettings,
  onUpdateSettings,
  portalUser,
  auditLogs = [],
  onAddAuditLogs,
  attendanceChangeRequests = [],
  onSaveChangeRequests
}: AttendanceTrackerProps) {
  const hasPermission = (action: 'view' | 'add' | 'edit' | 'approve') => {
    if (!portalUser) return true;
    if (portalUser.role === 'admin') return true;
    const permissions = adminSettings?.rolePermissions?.[portalUser.role] || [];
    if (permissions.includes('attendance')) return true;
    return permissions.includes(`attendance:${action}`);
  };

  // Determine user administrative role and direct edit capabilities
  const isAdminOrDirector = useMemo(() => {
    if (!portalUser) return true;
    const r = (portalUser.role || '').toLowerCase();
    return r.includes('admin') || r.includes('director') || r.includes('super');
  }, [portalUser]);

  // Evaluate Lock and HR Direct Edit Access
  const isHrDirectAccessActive = useMemo(() => {
    const lockSettings = adminSettings?.attendanceLockSettings;
    if (!lockSettings || !lockSettings.hrDirectAccessEnabled) return false;
    if (!lockSettings.hrAccessExpiresAt) return true; // permanent
    return new Date(lockSettings.hrAccessExpiresAt).getTime() > Date.now();
  }, [adminSettings?.attendanceLockSettings]);

  // Direct edit allowed if Admin/Director OR if HR has active granted access
  const canDirectEdit = isAdminOrDirector || isHrDirectAccessActive;
  const isLockedForUser = !canDirectEdit;

  const [activeTab, setActiveTab] = useState<'daily' | 'requests' | 'audit_report' | 'misspunch' | 'halfday' | 'calendar' | 'heatmap'>('daily');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [localRecords, setLocalRecords] = useState<{ [empId: string]: Attendance }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  
  //States for approvals
  const [pendingChanges, setPendingChanges] = useState<Attendance[]>([]);
  const [isSavingApprovals, setIsSavingApprovals] = useState(false);

  // Change request modal states
  const [changeModalOpen, setChangeModalOpen] = useState(false);
  const [selectedEmpForChange, setSelectedEmpForChange] = useState<Employee | null>(null);
  const [selectedRecordForChange, setSelectedRecordForChange] = useState<Attendance | null>(null);

  // Admin Access Control Modal State
  const [accessControlModalOpen, setAccessControlModalOpen] = useState(false);
  const [accessDurationMins, setAccessDurationMins] = useState(60); // default 1 hour
  const [monthlyApprovalModalOpen, setMonthlyApprovalModalOpen] = useState(false);

  // Local change requests mirror
  const [localChangeRequests, setLocalChangeRequests] = useState<AttendanceChangeRequest[]>(attendanceChangeRequests);

  useEffect(() => {
    setLocalChangeRequests(attendanceChangeRequests);
  }, [attendanceChangeRequests]);

  //WhatsApp modal state
  const [waModalOpen, setWaModalOpen] = useState(false);
  const [waRecipient, setWaRecipient] = useState<{ name: string; mobileNo?: string; email?: string }>({ name: '' });
  const [waCategory, setWaCategory] = useState<'missPunch' | 'lateWarning' | 'customNotice'>('missPunch');
  const [waVars, setWaVars] = useState<Record<string, string | number | undefined>>({});

  const handlePunchImportComplete = async (importedRecords: Attendance[]) => {
    if (onUpdateAttendanceRecords) {
      await onUpdateAttendanceRecords(importedRecords);
      
      //Update local state immediately if any match the currently selected date
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
      alert('Biometric records imported successfully!');
    } else {
      alert('Import service not registered on parent.');
    }
  };

  //Filters state
  const [selectedBranch, setSelectedBranch] = useState('All');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('All');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  //Particular record history modal states
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyModalEmpId, setHistoryModalEmpId] = useState('');
  const [historyModalDate, setHistoryModalDate] = useState('');
  const [historyModalEmpName, setHistoryModalEmpName] = useState('');

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
    return employees
      .filter(emp => emp.isActive !== false)
      .map(emp => ({
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

  // Auto-adjust current page if it exceeds total pages
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

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
      colRemarks: "RemarksNotes",
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
      
      //Approvals specific
      subTabDaily: "Daily Attendance Register",
      subTabMissPunch: "Miss Punch Approvals",
      subTabHalfDay: "Half Day Register",
      subTabCalendar: "Monthly Calendar Report",
      subTabHeatmap: "Attendance Heatmap",
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
      title: "Attendance Tracker",
      selectDate: "Select Work Date",
      bulkPresent: "Mark All Present",
      bulkAbsent: "Mark All Absent",
      colEmp: "Employee Info",
      colStatus: "Attendance Status",
      colTiming: "Working Hours",
      colOvertime: "Overtime (Hrs)",
      colRemarks: "RemarksNotes",
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
      
      //Approvals specific
      subTabDaily: "Daily Attendance Register",
      subTabMissPunch: "Miss Punch Approvals",
      subTabHalfDay: "Half Day Register",
      subTabCalendar: "Monthly Calendar Report",
      subTabHeatmap: "Attendance Heatmap",
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
    }
  }[language];

  //Load existing records or set defaults when selectedDate or employees list changes
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
    if (!hasPermission('edit')) {
      alert('You do not have permission to edit attendance.');
      return;
    }

    // If attendance is locked for this user (e.g. HR without active direct access), open the Change Request Modal
    if (isLockedForUser) {
      handleOpenChangeModalForEmp(empId, status);
      return;
    }

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
    if (!hasPermission('edit')) {
      alert('You do not have permission to edit attendance.');
      return;
    }

    if (isLockedForUser) {
      handleOpenChangeModalForEmp(empId);
      return;
    }

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
          if (totalHours < 0) totalHours += 24; //overnight shift

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
    if (!hasPermission('edit')) {
      alert('You do not have permission to edit attendance.');
      return;
    }
    if (isLockedForUser) {
      handleOpenChangeModalForEmp(empId);
      return;
    }
    setLocalRecords(prev => ({
      ...prev,
      [empId]: { ...prev[empId], overtimeHours: Math.max(0, value) }
    }));
  };

  const handleRemarksChange = (empId: string, value: string) => {
    if (!hasPermission('edit')) {
      alert('You do not have permission to edit attendance.');
      return;
    }
    if (isLockedForUser) {
      handleOpenChangeModalForEmp(empId);
      return;
    }
    setLocalRecords(prev => ({
      ...prev,
      [empId]: { ...prev[empId], remarks: value }
    }));
  };

  const markBulkStatus = (status: Attendance['status']) => {
    if (isLockedForUser) {
      alert('Attendance register is currently LOCKED. Individual change requests must be submitted for Director/Admin approval, or request Admin to grant temporary HR Direct Edit Access.');
      return;
    }

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

  // Open Change Request modal for a given employee
  const handleOpenChangeModalForEmp = (empId: string, preselectedStatus?: Attendance['status']) => {
    const emp = employees.find(e => e.id === empId);
    if (!emp) return;
    const rec = localRecords[empId] || {
      date: selectedDate,
      employeeId: empId,
      status: preselectedStatus || 'Present',
      checkIn: '',
      checkOut: '',
      overtimeHours: 0,
      remarks: ''
    };

    const targetRec = preselectedStatus ? { ...rec, status: preselectedStatus } : rec;
    setSelectedEmpForChange(emp);
    setSelectedRecordForChange(targetRec);
    setChangeModalOpen(true);
  };

  // Submit attendance change request (when locked or requested by user)
  const handleSubmitChangeRequest = async (requestData: Omit<AttendanceChangeRequest, 'id' | 'requestedAt' | 'status'>) => {
    const newRequest: AttendanceChangeRequest = {
      ...requestData,
      id: `REQ-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      requestedAt: new Date().toISOString(),
      status: 'Pending',
      actionType: 'change_request'
    };

    const updatedList = [newRequest, ...localChangeRequests];
    setLocalChangeRequests(updatedList);

    if (onSaveChangeRequests) {
      await onSaveChangeRequests(updatedList);
    }

    // Add Audit Log
    if (onAddAuditLogs) {
      const log: AuditLog = {
        id: `audit-${Math.random().toString(36).substring(2, 9)}`,
        timestamp: new Date().toISOString(),
        actorUsername: portalUser?.username || 'hr_user',
        actorRole: portalUser?.role || 'hr',
        employeeId: requestData.employeeId,
        employeeName: requestData.employeeName,
        date: requestData.attendanceDate,
        actionType: 'update',
        fieldChanged: `Attendance Change Request (${requestData.currentStatus} ➔ ${requestData.requestedStatus})`,
        oldValue: `${requestData.currentStatus} (${requestData.currentCheckIn || '—'} - ${requestData.currentCheckOut || '—'})`,
        newValue: `${requestData.requestedStatus} (${requestData.requestedCheckIn || '—'} - ${requestData.requestedCheckOut || '—'})`,
        remarks: `Reason: ${requestData.reason} | Note: ${requestData.remarks}`
      };
      onAddAuditLogs([log]);
    }

    alert(`Attendance change request for ${requestData.employeeName} submitted successfully! It is now pending approval by the Director / Admin.`);
  };

  // Direct Admin Edit & Audit Record Apply
  const handleDirectApply = async (updatedRecord: Attendance, reason: string, remarks: string) => {
    // Update local state
    setLocalRecords(prev => ({
      ...prev,
      [updatedRecord.employeeId]: updatedRecord
    }));

    // Update global state & Google Sheets
    const currentList = Object.values({
      ...localRecords,
      [updatedRecord.employeeId]: updatedRecord
    }) as Attendance[];

    await onSaveAttendance(selectedDate, currentList);

    const empName = getEmployeeName(updatedRecord.employeeId);

    // Add Comprehensive Audit Log
    if (onAddAuditLogs) {
      const log: AuditLog = {
        id: `audit-${Math.random().toString(36).substring(2, 9)}`,
        timestamp: new Date().toISOString(),
        actorUsername: portalUser?.username || 'admin',
        actorRole: portalUser?.role || 'admin',
        employeeId: updatedRecord.employeeId,
        employeeName: empName,
        date: selectedDate,
        actionType: 'update',
        fieldChanged: `Direct Override: ${updatedRecord.status}`,
        oldValue: `${selectedRecordForChange?.status || 'Present'} (${selectedRecordForChange?.checkIn || '—'} - ${selectedRecordForChange?.checkOut || '—'})`,
        newValue: `${updatedRecord.status} (${updatedRecord.checkIn || '—'} - ${updatedRecord.checkOut || '—'})`,
        remarks: `Reason: ${reason} | Remarks: ${remarks}`
      };
      onAddAuditLogs([log]);
    }

    // Also record into change requests log as direct_admin_edit for full reporting transparency
    const historyItem: AttendanceChangeRequest = {
      id: `DIR-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      attendanceDate: selectedDate,
      employeeId: updatedRecord.employeeId,
      employeeName: empName,
      department: employees.find(e => e.id === updatedRecord.employeeId)?.department || '',
      currentStatus: selectedRecordForChange?.status || 'Present',
      currentCheckIn: selectedRecordForChange?.checkIn || '',
      currentCheckOut: selectedRecordForChange?.checkOut || '',
      currentOvertimeHours: selectedRecordForChange?.overtimeHours || 0,
      requestedStatus: updatedRecord.status,
      requestedCheckIn: updatedRecord.checkIn || '',
      requestedCheckOut: updatedRecord.checkOut || '',
      requestedOvertimeHours: updatedRecord.overtimeHours || 0,
      reason,
      remarks,
      requestedByUsername: portalUser?.username || 'admin',
      requestedByName: portalUser?.name || portalUser?.username || 'Administrator',
      requestedByRole: portalUser?.role || 'admin',
      requestedAt: new Date().toISOString(),
      status: 'Approved',
      actionType: 'direct_admin_edit',
      reviewedBy: portalUser?.name || portalUser?.username || 'Administrator',
      reviewedByRole: portalUser?.role || 'admin',
      reviewedAt: new Date().toISOString(),
      reviewerRemarks: 'Applied via Direct Administrator Override'
    };

    const updatedList = [historyItem, ...localChangeRequests];
    setLocalChangeRequests(updatedList);
    if (onSaveChangeRequests) {
      await onSaveChangeRequests(updatedList);
    }

    alert(`Attendance for ${empName} updated successfully and recorded in the Audit History.`);
  };

  // Approve Change Request
  const handleApproveRequest = async (request: AttendanceChangeRequest, reviewerRemarks?: string) => {
    const targetRecord: Attendance = {
      date: request.attendanceDate,
      employeeId: request.employeeId,
      status: request.requestedStatus,
      checkIn: request.requestedCheckIn,
      checkOut: request.requestedCheckOut,
      overtimeHours: request.requestedOvertimeHours,
      remarks: request.remarks ? `[Approved Request: ${request.reason}] ${request.remarks}` : `Approved: ${request.reason}`,
      approvalStatus: 'Approved'
    };

    if (request.attendanceDate === selectedDate) {
      setLocalRecords(prev => ({
        ...prev,
        [request.employeeId]: targetRecord
      }));
    }

    if (onUpdateAttendanceRecords) {
      await onUpdateAttendanceRecords([targetRecord]);
    } else {
      const dateRecords = attendanceRecords.filter(r => r.date === request.attendanceDate && r.employeeId !== request.employeeId);
      await onSaveAttendance(request.attendanceDate, [...dateRecords, targetRecord]);
    }

    const updatedRequests = localChangeRequests.map(r => {
      if (r.id === request.id) {
        return {
          ...r,
          status: 'Approved' as const,
          reviewedBy: portalUser?.name || portalUser?.username || 'Admin/Director',
          reviewedByRole: portalUser?.role || 'admin',
          reviewedAt: new Date().toISOString(),
          reviewerRemarks: reviewerRemarks || 'Approved by Director/Admin'
        };
      }
      return r;
    });

    setLocalChangeRequests(updatedRequests);
    if (onSaveChangeRequests) {
      await onSaveChangeRequests(updatedRequests);
    }

    if (onAddAuditLogs) {
      const log: AuditLog = {
        id: `audit-${Math.random().toString(36).substring(2, 9)}`,
        timestamp: new Date().toISOString(),
        actorUsername: portalUser?.username || 'admin',
        actorRole: portalUser?.role || 'admin',
        employeeId: request.employeeId,
        employeeName: request.employeeName,
        date: request.attendanceDate,
        actionType: 'approve',
        fieldChanged: `Approved Attendance Change (${request.currentStatus} ➔ ${request.requestedStatus})`,
        oldValue: `${request.currentStatus} (${request.currentCheckIn || '—'} - ${request.currentCheckOut || '—'})`,
        newValue: `${request.requestedStatus} (${request.requestedCheckIn || '—'} - ${request.requestedCheckOut || '—'})`,
        remarks: `Reason: ${request.reason} | Note: ${reviewerRemarks || request.remarks}`
      };
      onAddAuditLogs([log]);
    }

    alert(`Attendance change request for ${request.employeeName} on ${request.attendanceDate} approved and applied!`);
  };

  // Reject Change Request
  const handleRejectRequest = async (request: AttendanceChangeRequest, reviewerRemarks?: string) => {
    const updatedRequests = localChangeRequests.map(r => {
      if (r.id === request.id) {
        return {
          ...r,
          status: 'Rejected' as const,
          reviewedBy: portalUser?.name || portalUser?.username || 'Admin/Director',
          reviewedByRole: portalUser?.role || 'admin',
          reviewedAt: new Date().toISOString(),
          reviewerRemarks: reviewerRemarks || 'Declined by reviewer'
        };
      }
      return r;
    });

    setLocalChangeRequests(updatedRequests);
    if (onSaveChangeRequests) {
      await onSaveChangeRequests(updatedRequests);
    }

    if (onAddAuditLogs) {
      const log: AuditLog = {
        id: `audit-${Math.random().toString(36).substring(2, 9)}`,
        timestamp: new Date().toISOString(),
        actorUsername: portalUser?.username || 'admin',
        actorRole: portalUser?.role || 'admin',
        employeeId: request.employeeId,
        employeeName: request.employeeName,
        date: request.attendanceDate,
        actionType: 'reject',
        fieldChanged: `Rejected Attendance Change Request`,
        oldValue: `${request.requestedStatus}`,
        newValue: `Kept: ${request.currentStatus}`,
        remarks: `Reason: ${reviewerRemarks || 'Disapproved by Director/Admin'}`
      };
      onAddAuditLogs([log]);
    }

    alert(`Attendance change request for ${request.employeeName} rejected.`);
  };

  // Bulk Approve Change Requests
  const handleBulkApprove = async (requestIds: string[]) => {
    const toApprove = localChangeRequests.filter(r => requestIds.includes(r.id) && r.status === 'Pending');
    if (toApprove.length === 0) return;

    const recordsToUpdate: Attendance[] = [];
    const auditLogsToCreate: AuditLog[] = [];

    const updatedRequests = localChangeRequests.map(r => {
      if (requestIds.includes(r.id) && r.status === 'Pending') {
        const targetRecord: Attendance = {
          date: r.attendanceDate,
          employeeId: r.employeeId,
          status: r.requestedStatus,
          checkIn: r.requestedCheckIn,
          checkOut: r.requestedCheckOut,
          overtimeHours: r.requestedOvertimeHours,
          remarks: r.remarks ? `[Approved Request: ${r.reason}] ${r.remarks}` : `Approved: ${r.reason}`,
          approvalStatus: 'Approved'
        };
        recordsToUpdate.push(targetRecord);

        auditLogsToCreate.push({
          id: `audit-${Math.random().toString(36).substring(2, 9)}`,
          timestamp: new Date().toISOString(),
          actorUsername: portalUser?.username || 'admin',
          actorRole: portalUser?.role || 'admin',
          employeeId: r.employeeId,
          employeeName: r.employeeName,
          date: r.attendanceDate,
          actionType: 'approve',
          fieldChanged: `Bulk Approved: ${r.currentStatus} ➔ ${r.requestedStatus}`,
          oldValue: r.currentStatus,
          newValue: r.requestedStatus,
          remarks: `Bulk approved by ${portalUser?.username || 'Admin'}`
        });

        return {
          ...r,
          status: 'Approved' as const,
          reviewedBy: portalUser?.name || portalUser?.username || 'Admin/Director',
          reviewedByRole: portalUser?.role || 'admin',
          reviewedAt: new Date().toISOString(),
          reviewerRemarks: 'Bulk approved by Director/Admin'
        };
      }
      return r;
    });

    if (onUpdateAttendanceRecords) {
      await onUpdateAttendanceRecords(recordsToUpdate);
    }

    setLocalChangeRequests(updatedRequests);
    if (onSaveChangeRequests) {
      await onSaveChangeRequests(updatedRequests);
    }

    if (onAddAuditLogs && auditLogsToCreate.length > 0) {
      onAddAuditLogs(auditLogsToCreate);
    }

    alert(`Successfully approved ${toApprove.length} attendance change requests!`);
  };

  // Admin Lock & Access Control Handlers
  const handleToggleLockSetting = async (lockState: boolean) => {
    if (!adminSettings || !onUpdateSettings) return;
    const updatedSettings: AdminSettings = {
      ...adminSettings,
      attendanceLockSettings: {
        ...(adminSettings.attendanceLockSettings || { isLocked: true }),
        isLocked: lockState
      }
    };
    await onUpdateSettings(updatedSettings);
    alert(lockState ? 'Attendance locking is now ENABLED. All HR updates require approval.' : 'Attendance locking is now DISABLED. Direct edits allowed.');
  };

  const handleGrantTimedHrAccess = async (minutes: number) => {
    if (!adminSettings || !onUpdateSettings) return;
    const expiresAt = minutes > 0 ? new Date(Date.now() + minutes * 60000).toISOString() : undefined;
    const updatedSettings: AdminSettings = {
      ...adminSettings,
      attendanceLockSettings: {
        ...(adminSettings.attendanceLockSettings || { isLocked: true }),
        hrDirectAccessEnabled: true,
        hrAccessExpiresAt: expiresAt,
        hrAccessGrantedBy: portalUser?.username || 'admin',
        hrAccessGrantedAt: new Date().toISOString()
      }
    };
    await onUpdateSettings(updatedSettings);
    alert(minutes > 0 ? `HR Direct Edit Access granted for ${minutes} minutes!` : 'HR Direct Edit Access granted permanently!');
  };

  const handleRevokeHrAccess = async () => {
    if (!adminSettings || !onUpdateSettings) return;
    const updatedSettings: AdminSettings = {
      ...adminSettings,
      attendanceLockSettings: {
        ...(adminSettings.attendanceLockSettings || { isLocked: true }),
        hrDirectAccessEnabled: false,
        hrAccessExpiresAt: undefined
      }
    };
    await onUpdateSettings(updatedSettings);
    alert('HR Direct Edit Access has been revoked. Attendance is now strictly locked for HR.');
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const recordsToSave = Object.values(localRecords) as Attendance[];
      
      //Compare and generate audit logs
      const newAuditLogs: AuditLog[] = [];
      const actorUsername = portalUser?.username || 'admin';
      const actorRole = portalUser?.role || 'admin';
      
      recordsToSave.forEach(rec => {
        const prevRec = attendanceRecords.find(
          r => r.employeeId === rec.employeeId && r.date === selectedDate
        );

        const empName = getEmployeeName(rec.employeeId);

        if (!prevRec) {
          //New record created
          newAuditLogs.push({
            id: `audit-${Math.random().toString(36).substring(2, 9)}`,
            timestamp: new Date().toISOString(),
            actorUsername,
            actorRole,
            employeeId: rec.employeeId,
            employeeName: empName,
            date: selectedDate,
            actionType: 'create',
            fieldChanged: 'attendance',
            oldValue: 'None',
            newValue: `${rec.status} (${rec.checkIn || 'No-In'} - ${rec.checkOut || 'No-Out'})`,
            remarks: rec.remarks || 'Daily Attendance initial entry'
          });
        } else {
          //Check what fields changed
          const fieldsToCompare: ('status' | 'checkIn' | 'checkOut' | 'overtimeHours' | 'remarks')[] = [
            'status', 'checkIn', 'checkOut', 'overtimeHours', 'remarks'
          ];

          fieldsToCompare.forEach(field => {
            const oldVal = String(prevRec[field] !== undefined ? prevRec[field] : '');
            const newVal = String(rec[field] !== undefined ? rec[field] : '');

            if (oldVal !== newVal) {
              newAuditLogs.push({
                id: `audit-${Math.random().toString(36).substring(2, 9)}`,
                timestamp: new Date().toISOString(),
                actorUsername,
                actorRole,
                employeeId: rec.employeeId,
                employeeName: empName,
                date: selectedDate,
                actionType: 'update',
                fieldChanged: field,
                oldValue: oldVal || 'empty',
                newValue: newVal || 'empty',
                remarks: rec.remarks || 'Manual adjustment'
              });
            }
          });
        }
      });

      await onSaveAttendance(selectedDate, recordsToSave);
      
      if (newAuditLogs.length > 0 && onAddAuditLogs) {
        onAddAuditLogs(newAuditLogs);
      }

      alert(t.savedSuccess);
    } catch (err) {
      console.error(err);
      alert('Error updating Google Sheets. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  //Handling Miss Punch and Half Day Approvals
  const missPunchLogs = attendanceRecords
    .filter(r => r.status === 'Miss Punch' || (r.approvalStatus && r.approvalStatus !== 'Pending' && (r.remarks?.toLowerCase().includes('miss punch') || r.remarks?.toLowerCase().includes('mispunch'))))
    .sort((a, b) => b.date.localeCompare(a.date));

  const halfDayLogs = attendanceRecords
    .filter(r => r.status === 'Half Day' || (r.approvalStatus && r.approvalStatus !== 'Pending' && r.remarks?.toLowerCase().includes('half day')))
    .sort((a, b) => b.date.localeCompare(a.date));

  const handleApprovalChange = (record: Attendance, field: 'approvalStatus' | 'checkIn' | 'checkOut' | 'remarks' | 'status', value: any) => {
    if (field === 'approvalStatus') {
      if (!hasPermission('approve')) {
        alert('You do not have permission to approve attendance.');
        return;
      }
    } else {
      if (!hasPermission('edit')) {
        alert('You do not have permission to edit attendance.');
        return;
      }
    }
    setPendingChanges(prev => {
      const existsIdx = prev.findIndex(r => r.employeeId === record.employeeId && r.date === record.date);
      const updatedRecord = existsIdx > -1 
        ? { ...prev[existsIdx], [field]: value } 
        : { ...record, [field]: value };

      //If approved, automatically add default times if empty and convert status to Present for Miss Punch
      if (field === 'approvalStatus' && value === 'Approved') {
        if (updatedRecord.status === 'Miss Punch' || record.status === 'Miss Punch') {
          const emp = employees.find(e => e.id === record.employeeId);
          const timings = getShiftTimings(emp?.workTiming, adminSettings?.defaultCheckIn || '09:00', adminSettings?.defaultCheckOut || '18:00');
          if (!updatedRecord.checkIn || updatedRecord.checkIn === '') updatedRecord.checkIn = timings.checkIn;
          if (!updatedRecord.checkOut || updatedRecord.checkOut === '') updatedRecord.checkOut = timings.checkOut;
          updatedRecord.status = 'Present';
          if (!updatedRecord.remarks || updatedRecord.remarks === 'On-time') {
            updatedRecord.remarks = 'Miss Punch Approved';
          }
        }
      } else if (field === 'approvalStatus' && (value === 'Pending' || value === 'Rejected')) {
        if (updatedRecord.status === 'Present' && (record.status === 'Miss Punch' || updatedRecord.remarks?.toLowerCase().includes('miss punch'))) {
          updatedRecord.status = 'Miss Punch';
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
        //Compare and generate audit logs for approvals
        const approvalAuditLogs: AuditLog[] = [];
        const actorUsername = portalUser?.username || 'admin';
        const actorRole = portalUser?.role || 'admin';

        pendingChanges.forEach(rec => {
          const prevRec = attendanceRecords.find(
            r => r.employeeId === rec.employeeId && r.date === rec.date
          );
          const empName = getEmployeeName(rec.employeeId);

          if (!prevRec) {
            approvalAuditLogs.push({
              id: `audit-${Math.random().toString(36).substring(2, 9)}`,
              timestamp: new Date().toISOString(),
              actorUsername,
              actorRole,
              employeeId: rec.employeeId,
              employeeName: empName,
              date: rec.date,
              actionType: 'create',
              fieldChanged: 'attendance',
              oldValue: 'None',
              newValue: `${rec.status} (${rec.checkIn || 'No-In'} - ${rec.checkOut || 'No-Out'})`,
              remarks: rec.remarks || 'Approval entry created'
            });
          } else {
            const fieldsToCompare: ('status' | 'checkIn' | 'checkOut' | 'approvalStatus' | 'remarks')[] = [
              'status', 'checkIn', 'checkOut', 'approvalStatus', 'remarks'
            ];

            fieldsToCompare.forEach(field => {
              const oldVal = String(prevRec[field] !== undefined ? prevRec[field] : '');
              const newVal = String(rec[field] !== undefined ? rec[field] : '');

              if (oldVal !== newVal) {
                let actionType: 'create' | 'update' | 'approve' | 'reject' | 'delete_logs' = 'update';
                if (field === 'approvalStatus') {
                  if (newVal === 'Approved') actionType = 'approve';
                  else if (newVal === 'Rejected') actionType = 'reject';
                }

                approvalAuditLogs.push({
                  id: `audit-${Math.random().toString(36).substring(2, 9)}`,
                  timestamp: new Date().toISOString(),
                  actorUsername,
                  actorRole,
                  employeeId: rec.employeeId,
                  employeeName: empName,
                  date: rec.date,
                  actionType,
                  fieldChanged: field,
                  oldValue: oldVal || 'empty',
                  newValue: newVal || 'empty',
                  remarks: rec.remarks || 'Approval status update'
                });
              }
            });
          }
        });

        await onUpdateAttendanceRecords(pendingChanges);

        if (approvalAuditLogs.length > 0 && onAddAuditLogs) {
          onAddAuditLogs(approvalAuditLogs);
        }

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
        <div className="inline-flex p-1 bg-gray-100 dark:bg-[#0c1a14] rounded-xl gap-1 border border-gray-200/50 dark:border-[#1e3a2f] max-w-full overflow-x-auto no-scrollbar shrink-0">
          <button
            onClick={() => { setActiveTab('daily'); setPendingChanges([]); }}
            className={`px-2.5 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold rounded-lg cursor-pointer transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'daily' 
                ? 'bg-white dark:bg-[#11221b] text-gray-800 dark:text-slate-100 shadow-xs border border-gray-200/20 dark:border-[#1e3a2f]' 
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
            }`}
          >
            {t.subTabDaily}
          </button>

          {/* Change Requests Tab Button */}
          <button
            onClick={() => { setActiveTab('requests'); setPendingChanges([]); }}
            className={`px-2.5 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'requests' 
                ? 'bg-white dark:bg-[#11221b] text-indigo-700 dark:text-indigo-300 shadow-xs border border-indigo-200/50 dark:border-indigo-900/40' 
                : 'text-gray-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>{'Approval Requests'}</span>
            {localChangeRequests.filter(r => r.status === 'Pending').length > 0 && (
              <span className="bg-indigo-600 text-white text-[9px] px-1.5 py-0.5 rounded-full font-black animate-pulse">
                {localChangeRequests.filter(r => r.status === 'Pending').length}
              </span>
            )}
          </button>

          {/* Audit & History Report (Admin/Director) */}
          {(isAdminOrDirector || hasPermission('view')) && (
            <button
              onClick={() => { setActiveTab('audit_report'); setPendingChanges([]); }}
              className={`px-2.5 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeTab === 'audit_report' 
                  ? 'bg-white dark:bg-[#11221b] text-emerald-800 dark:text-emerald-300 shadow-xs border border-emerald-200/50 dark:border-emerald-900/40' 
                  : 'text-gray-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{'Audit & History Report'}</span>
              <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.2 rounded-md">Admin</span>
            </button>
          )}

          <button
            onClick={() => { setActiveTab('misspunch'); setPendingChanges([]); }}
            className={`px-2.5 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'misspunch' 
                ? 'bg-white dark:bg-[#11221b] text-gray-800 dark:text-slate-100 shadow-xs border border-gray-200/20 dark:border-[#1e3a2f]' 
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
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
            className={`px-2.5 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'halfday' 
                ? 'bg-white dark:bg-[#11221b] text-gray-800 dark:text-slate-100 shadow-xs border border-gray-200/20 dark:border-[#1e3a2f]' 
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
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
            className={`px-2.5 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold rounded-lg cursor-pointer transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'calendar' 
                ? 'bg-white dark:bg-[#11221b] text-gray-800 dark:text-slate-100 shadow-xs border border-gray-200/20 dark:border-[#1e3a2f]' 
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
            }`}
          >
            {t.subTabCalendar}
          </button>
          <button
            onClick={() => { setActiveTab('heatmap'); setPendingChanges([]); }}
            className={`px-2.5 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'heatmap' 
                ? 'bg-white dark:bg-[#11221b] text-gray-800 dark:text-slate-100 shadow-xs border border-gray-200/20 dark:border-[#1e3a2f]' 
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>{(t as any).subTabHeatmap || 'Attendance Heatmap'}</span>
          </button>
        </div>
      </div>

      {/* Lock & Security Status Banner */}
      <div className="bg-linear-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-4 rounded-2xl shadow-sm border border-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border ${
            isLockedForUser
              ? 'bg-amber-500/20 border-amber-400/40 text-amber-300'
              : isHrDirectAccessActive
              ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
              : 'bg-indigo-500/20 border-indigo-400/40 text-indigo-300'
          }`}>
            {isLockedForUser ? (
              <Lock className="w-5 h-5" />
            ) : (
              <Unlock className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold tracking-wide uppercase">
                {isLockedForUser
                  ? 'Attendance Locked (Approval Workflow Enforced)'
                  : isHrDirectAccessActive
                  ? 'HR Temporary Direct Access Active'
                  : 'Direct Admin Control Mode'}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isLockedForUser
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                  : 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
              }`}>
                {isLockedForUser ? 'Approval Required' : 'Direct Edit Permitted'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {isLockedForUser
                ? 'Updates from HR require Reason & Remarks with Director/Admin approval before saving.'
                : isHrDirectAccessActive
                ? `Admin granted direct editing access to HR (Expires: ${adminSettings?.attendanceLockSettings?.hrAccessExpiresAt ? new Date(adminSettings.attendanceLockSettings.hrAccessExpiresAt).toLocaleTimeString() : 'Session'}).`
                : 'Directors & Administrators have full direct override privileges with automatic audit tracking.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
          <button
            onClick={() => setMonthlyApprovalModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
            title="Open Monthly Approval Requests & Signable Report"
          >
            <FileText className="w-4 h-4" />
            <span>Monthly Approval Report</span>
          </button>

          {isAdminOrDirector && (
            <button
              onClick={() => setAccessControlModalOpen(true)}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Lock & HR Access Control</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('requests')}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <Clock className="w-4 h-4" />
            <span>View Pending Requests</span>
            {localChangeRequests.filter(r => r.status === 'Pending').length > 0 && (
              <span className="bg-white text-indigo-700 text-[10px] px-1.5 py-0.2 rounded-full font-black">
                {localChangeRequests.filter(r => r.status === 'Pending').length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* DAILY ATTENDANCE REGISTER */}
      {activeTab === 'daily' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#11221b] p-5 rounded-2xl border border-gray-100 dark:border-[#1e3a2f] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-500 dark:text-slate-400" />
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">{t.selectDate}</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border border-gray-200 dark:border-[#1e3a2f] rounded-xl px-3 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#03623c] bg-white dark:bg-[#0b1812] cursor-pointer text-gray-800 dark:text-slate-100"
                  id="attendance-date" />
              </div>
            </div>

            {hasPermission('add') && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className="px-4 py-2 border border-[#03623c]/20 bg-[#03623c]/5 dark:bg-emerald-950/60 text-[#03623c] dark:text-emerald-400 hover:bg-[#03623c]/10 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer hover:shadow-3xs"
                  id="bulk-import-punch"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  {'Upload Punch Machine Data'}
                </button>
                <button
                  onClick={() => markBulkStatus('Present')}
                  className="px-4 py-2 border border-green-200 dark:border-emerald-800 bg-green-50 dark:bg-emerald-950/60 text-green-700 dark:text-emerald-300 hover:bg-green-100 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  id="bulk-present"
                >
                  <UserCheck className="w-4 h-4" />
                  {t.bulkPresent}
                </button>
                <button
                  onClick={() => markBulkStatus('Absent')}
                  className="px-4 py-2 border border-red-200 dark:border-rose-900/60 bg-red-50 dark:bg-rose-950/60 text-red-700 dark:text-rose-300 hover:bg-red-100 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  id="bulk-absent"
                >
                  <UserX className="w-4 h-4" />
                  {t.bulkAbsent}
                </button>
              </div>
            )}
          </div>

          {/* Robust Filters segment */}
          <div className="bg-white dark:bg-[#11221b] p-4 rounded-2xl border border-gray-100 dark:border-[#1e3a2f] shadow-xs flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-[#03623c] dark:text-emerald-400" />
              <span className="text-xs font-bold text-gray-800 dark:text-slate-200 uppercase tracking-wider font-mono">Filters:</span>
            </div>

            {/* Department Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-extrabold text-gray-500 dark:text-slate-400 uppercase font-mono">Dept:</span>
              <select
                value={selectedDept}
                onChange={(e) => { setSelectedDept(e.target.value); setCurrentPage(1); }}
                className="bg-gray-50 dark:bg-[#0b1812] border border-gray-200 dark:border-[#1e3a2f] text-xs font-semibold text-gray-700 dark:text-slate-200 px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-[#03623c] transition-all cursor-pointer"
              >
                {departmentOptions.map(dept => (
                  <option key={dept} value={dept} className="dark:bg-[#11221b]">{dept}</option>
                ))}
              </select>
            </div>

            {/* Branch Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-extrabold text-gray-500 dark:text-slate-400 uppercase font-mono">Branch:</span>
              <select
                value={selectedBranch}
                onChange={(e) => { setSelectedBranch(e.target.value); setCurrentPage(1); }}
                className="bg-gray-50 dark:bg-[#0b1812] border border-gray-200 dark:border-[#1e3a2f] text-xs font-semibold text-gray-700 dark:text-slate-200 px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-[#03623c] transition-all cursor-pointer"
              >
                {branchOptions.map(branch => (
                  <option key={branch} value={branch} className="dark:bg-[#11221b]">{branch}</option>
                ))}
              </select>
            </div>

            {/* Employee ID Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-extrabold text-gray-500 dark:text-slate-400 uppercase font-mono">Employee:</span>
              <select
                value={selectedEmployeeId}
                onChange={(e) => { setSelectedEmployeeId(e.target.value); setCurrentPage(1); }}
                className="bg-gray-50 dark:bg-[#0b1812] border border-gray-200 dark:border-[#1e3a2f] text-xs font-semibold text-gray-700 dark:text-slate-200 px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-[#03623c] transition-all cursor-pointer max-w-[150px]"
              >
                <option value="All" className="dark:bg-[#11221b]">{'All Employees'}</option>
                {employeeOptions.map(emp => (
                  <option key={emp.id} value={emp.id} className="dark:bg-[#11221b]">{emp.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white dark:bg-[#11221b] rounded-2xl border border-gray-100 dark:border-[#1e3a2f] shadow-xs overflow-hidden">
            {filteredActiveEmployees.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-[#0c1a14] border-b border-gray-100 dark:border-[#1e3a2f] text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                      <th className="py-4 px-6 min-w-[200px]">{t.colEmp}</th>
                      <th className="py-4 px-6 text-center min-w-[280px]">{t.colStatus}</th>
                      <th className="py-4 px-6 text-center min-w-[180px]">{t.colTiming}</th>
                      <th className="py-4 px-6 text-center min-w-[100px]">{t.colOvertime}</th>
                      <th className="py-4 px-6">{t.colRemarks}</th>
                      <th className="py-4 px-6 text-center min-w-[90px]">{'History'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-[#1e3a2f] text-sm">
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
                        <tr key={emp.id} className="hover:bg-gray-50/30 dark:hover:bg-[#162e24] transition-colors">
                          <td className="py-3 sm:py-4 px-2.5 sm:px-6">
                            <div>
                              <div className="font-semibold text-gray-900 dark:text-slate-100 text-xs sm:text-sm">{emp.name}</div>
                              <div className="text-[10px] sm:text-xs font-mono text-gray-400 dark:text-slate-400 font-medium">{emp.id} · {emp.designation}</div>
                            </div>
                          </td>

                          <td className="py-3 sm:py-4 px-1.5 sm:px-6 text-center">
                            {record.status === 'Miss Punch' ? (
                              <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 p-1 sm:p-1.5 rounded-xl">
                                <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-lg text-[9px] sm:text-[10px] font-extrabold text-amber-800 dark:text-amber-300 uppercase tracking-wider animate-pulse whitespace-nowrap">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                  <span>{'Miss Punch'}</span>
                                </div>
                                <div className="flex gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleStatusChange(emp.id, 'Present')}
                                    className="px-2 sm:px-2.5 py-0.5 sm:py-1 bg-[#03623c] hover:bg-[#024d2e] text-white font-extrabold text-[9px] sm:text-[10px] rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-3xs whitespace-nowrap"
                                  >
                                    <Check className="w-3 h-3" />
                                    <span>{'Approve'}</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleStatusChange(emp.id, 'Absent')}
                                    className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-white dark:bg-[#0b1812] hover:bg-red-50 dark:hover:bg-rose-950/50 border border-gray-200 dark:border-[#1e3a2f] text-gray-500 dark:text-slate-300 hover:text-red-600 font-bold text-[9px] sm:text-[10px] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                                  >
                                    {'Absent'}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="inline-flex p-0.5 sm:p-1 bg-gray-100 dark:bg-[#0b1812] rounded-xl gap-0.5 sm:gap-1 max-w-full overflow-x-auto shrink-0 border border-transparent dark:border-[#1e3a2f]">
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(emp.id, 'Present')}
                                  className={`px-1.5 sm:px-3 py-1 text-[10px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                                    record.status === 'Present' 
                                      ? 'bg-[#03623c] text-white shadow-xs' 
                                      : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white'
                                  }`}
                                >
                                  {t.present}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(emp.id, 'Half Day')}
                                  className={`px-1.5 sm:px-3 py-1 text-[10px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                                    record.status === 'Half Day' 
                                      ? 'bg-amber-500 text-white shadow-xs' 
                                      : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white'
                                  }`}
                                >
                                  {t.halfDay}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(emp.id, 'Absent')}
                                  className={`px-1.5 sm:px-3 py-1 text-[10px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                                    record.status === 'Absent' 
                                      ? 'bg-red-600 text-white shadow-xs' 
                                      : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white'
                                  }`}
                                >
                                  {t.absent}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(emp.id, 'Leave')}
                                  className={`px-1.5 sm:px-3 py-1 text-[10px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                                    record.status === 'Leave' 
                                      ? 'bg-teal-600 text-white shadow-xs' 
                                      : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white'
                                  }`}
                                >
                                  {t.leave}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(emp.id, 'Miss Punch')}
                                  className="px-1.5 sm:px-2.5 py-1 text-[10px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 hover:bg-amber-100"
                                >
                                  {'Miss Punch'}
                                </button>
                              </div>
                            )}
                          </td>

                          <td className="py-3 sm:py-4 px-2 sm:px-6 text-center">
                            {record.status === 'Present' || record.status === 'Half Day' || record.status === 'Miss Punch' ? (
                              <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-3">
                                <div className="flex flex-col items-start gap-0.5 sm:gap-1">
                                  <div className="flex items-center gap-1">
                                    <span className="text-[9px] sm:text-xxs text-gray-400 dark:text-slate-400 font-bold uppercase">{t.checkIn}</span>
                                    <input
                                      type="time"
                                      value={record.checkIn}
                                      onChange={(e) => handleTimeChange(emp.id, 'checkIn', e.target.value)}
                                      className={`border rounded-lg px-1 sm:px-1.5 py-0.5 sm:py-1 text-[11px] sm:text-xs font-semibold text-gray-700 dark:text-slate-100 bg-white dark:bg-[#0b1812] focus:outline-none focus:ring-1 ${
                                        isLate 
                                          ? 'border-rose-300 dark:border-rose-800 focus:ring-rose-500 bg-rose-50/20' 
                                          : 'border-gray-200 dark:border-[#1e3a2f] focus:ring-[#03623c]'
                                      }`} />
                                  </div>
                                  {isLate && (
                                    <span className="text-[9px] sm:text-[10px] text-rose-600 dark:text-rose-400 font-black flex items-center gap-1 pl-2 sm:pl-10" title="Late Arrival">
                                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                                      <span>{'Late'}</span>
                                    </span>
                                  )}
                                </div>

                                <div className="flex flex-col items-start gap-0.5 sm:gap-1">
                                  <div className="flex items-center gap-1">
                                    <span className="text-[9px] sm:text-xxs text-gray-400 dark:text-slate-400 font-bold uppercase">{t.checkOut}</span>
                                    <input
                                      type="time"
                                      value={record.checkOut}
                                      onChange={(e) => handleTimeChange(emp.id, 'checkOut', e.target.value)}
                                      className={`border rounded-lg px-1 sm:px-1.5 py-0.5 sm:py-1 text-[11px] sm:text-xs font-semibold text-gray-700 dark:text-slate-100 bg-white dark:bg-[#0b1812] focus:outline-none focus:ring-1 ${
                                        isEarly 
                                          ? 'border-amber-300 dark:border-amber-800 focus:ring-amber-500 bg-amber-50/20' 
                                          : 'border-gray-200 dark:border-[#1e3a2f] focus:ring-[#03623c]'
                                      }`} />
                                  </div>
                                  {isEarly && (
                                    <span className="text-[9px] sm:text-[10px] text-amber-600 dark:text-amber-400 font-black flex items-center gap-1 pl-2 sm:pl-11" title="Early Departure">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                      <span>{'Early'}</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400 dark:text-slate-500 text-xs">—</span>
                            )}
                          </td>

                          <td className="py-3 sm:py-4 px-2 sm:px-6 text-center">
                            {record.status === 'Present' || record.status === 'Half Day' || record.status === 'Miss Punch' ? (
                              <div className="inline-flex items-center gap-1">
                                <input
                                  type="number"
                                  step="0.5"
                                  min="0"
                                  value={record.overtimeHours || ''}
                                  placeholder="0"
                                  onChange={(e) => handleNumericChange(emp.id, Number(e.target.value))}
                                  className="w-16 border border-gray-200 dark:border-[#1e3a2f] rounded-lg px-2 py-1 text-xs text-center font-semibold text-gray-700 dark:text-slate-100 bg-white dark:bg-[#0b1812] focus:outline-none" />
                                <span className="text-xxs text-gray-400 dark:text-slate-400 font-medium">h</span>
                              </div>
                            ) : (
                              <span className="text-gray-400 dark:text-slate-500 text-xs">—</span>
                            )}
                          </td>

                          <td className="py-4 px-6">
                            <input
                              type="text"
                              value={record.remarks}
                              onChange={(e) => handleRemarksChange(emp.id, e.target.value)}
                              placeholder="e.g. Medical emergency, Late entry"
                              className="w-full border border-gray-200 dark:border-[#1e3a2f] rounded-lg px-3 py-1 text-xs text-gray-700 dark:text-slate-100 bg-white dark:bg-[#0b1812] focus:outline-none focus:ring-1 focus:ring-[#03623c]" />
                          </td>
                          <td className="py-4 px-6 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Request / Update button */}
                              <button
                                type="button"
                                onClick={() => handleOpenChangeModalForEmp(emp.id)}
                                className={`p-1 px-2.5 border rounded-lg transition-all cursor-pointer inline-flex items-center gap-1 text-[10px] font-bold shadow-3xs ${
                                  isLockedForUser
                                    ? 'bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                                    : 'bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300'
                                }`}
                                title={isLockedForUser ? 'Submit Change Request for Approval' : 'Audit & Direct Override'}
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>{isLockedForUser ? 'Request Update' : 'Update & Audit'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setHistoryModalEmpId(emp.id);
                                  setHistoryModalDate(selectedDate);
                                  setHistoryModalEmpName(emp.name);
                                  setHistoryModalOpen(true);
                                }}
                                className="p-1 px-2 bg-slate-50 dark:bg-[#0b1812] hover:bg-slate-100 dark:hover:bg-[#162e24] border border-slate-200 dark:border-[#1e3a2f] text-slate-700 dark:text-slate-200 hover:text-emerald-700 rounded-lg transition-all cursor-pointer inline-flex items-center gap-1 text-[10px] font-bold"
                                title={'View change history'}
                              >
                                <History className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                                <span>{'History'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setWaRecipient({
                                    name: emp.name,
                                    mobileNo: emp.mobileNo || emp.personalMobileNo,
                                    email: emp.email || emp.personalEmail
                                  });
                                  if (record.status === 'Miss Punch') {
                                    setWaCategory('missPunch');
                                    setWaVars({ DATE: selectedDate });
                                  } else {
                                    setWaCategory('lateWarning');
                                    setWaVars({ DATE: selectedDate, CHECK_IN: record.checkIn || '10:15 AM' });
                                  }
                                  setWaModalOpen(true);
                                }}
                                className="p-1 px-2 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-lg transition-all cursor-pointer inline-flex items-center gap-1 text-[10px] font-bold"
                                title="Send WhatsApp Alert"
                              >
                                <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span>WhatsApp</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Entries control & Pagination */}
              <div className="bg-gray-50 dark:bg-[#0c1a14] border-t border-gray-100 dark:border-[#1e3a2f] px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-700 dark:text-slate-300">Show Entries:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                    className="bg-white dark:bg-[#0b1812] border border-gray-200 dark:border-[#1e3a2f] text-xs font-semibold text-gray-700 dark:text-slate-200 px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-[#03623c] cursor-pointer"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>

                <div className="text-xs text-gray-500 dark:text-slate-400 font-medium">
                  Showing <span className="font-bold text-slate-800 dark:text-slate-100">{filteredActiveEmployees.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</span> to <span className="font-bold text-slate-800 dark:text-slate-100">{Math.min(currentPage * pageSize, filteredActiveEmployees.length)}</span> of <span className="font-bold text-slate-800 dark:text-slate-100">{filteredActiveEmployees.length}</span> entries
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#0b1812] border border-gray-200 dark:border-[#1e3a2f] rounded-lg hover:bg-gray-50 dark:hover:bg-[#162e24] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <span className="text-xs font-bold text-gray-800 dark:text-slate-200 font-mono">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#0b1812] border border-gray-200 dark:border-[#1e3a2f] rounded-lg hover:bg-gray-50 dark:hover:bg-[#162e24] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
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
                {hasPermission('edit') && (
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
                )}
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

                      //Limit calculation: Count other APPROVED miss punches for the same employee in the same month
                      const logMonth = log.date.substring(0, 7); //YYYY-MM
                      const approvedCountForMonth = attendanceRecords.filter(r => 
                        r.employeeId === log.employeeId && 
                        r.status === 'Miss Punch' && 
                        r.approvalStatus === 'Approved' && 
                        r.date.substring(0, 7) === logMonth &&
                        r.date !== log.date
                      ).length;

                      const userRole = portalUser?.role || 'admin';
                      const isHRorBranchManager = userRole === 'hr' || userRole === 'branch_manager';
                      const isLimitExceeded = approvedCountForMonth >= 3;
                      const isApprovalBlockedForUser = isLimitExceeded && isHRorBranchManager;

                      return (
                        <tr key={`${log.employeeId}-${log.date}`} className={`hover:bg-gray-50/30 transition-colors ${isRowEdited ? 'bg-amber-50/20' : ''}`}>
                          <td className="py-4 px-6 font-mono font-bold text-gray-900">
                            <div>
                              <span>{log.date}</span>
                              {isLimitExceeded && (
                                <span className="block text-[9px] font-extrabold text-amber-600 mt-0.5">
                                  {`[Approved: ${approvedCountForMonth} //3]`}
                                </span>
                              )}
                            </div>
                          </td>
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
                                  className="border border-gray-200 rounded-lg px-1.5 py-1 text-xs text-gray-700 bg-white focus:outline-none" />
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-[9px] text-gray-400 font-black uppercase">Out</span>
                                <input
                                  type="time"
                                  value={checkOutVal}
                                  onChange={(e) => handleApprovalChange(log, 'checkOut', e.target.value)}
                                  className="border border-gray-200 rounded-lg px-1.5 py-1 text-xs text-gray-700 bg-white focus:outline-none" />
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <div className="space-y-1">
                              <select
                                value={currentStatus}
                                onChange={(e) => {
                                  if (e.target.value === 'Approved' && isApprovalBlockedForUser) {
                                    alert(`Direct HR approval limit exceeded (${approvedCountForMonth} //3) for this employee in ${logMonth}. Only Directors can approve this request.`);
                                    return;
                                  }
                                  handleApprovalChange(log, 'approvalStatus', e.target.value);
                                }}
                                className={`border rounded-lg px-2.5 py-1 text-xs font-bold focus:outline-none ${
                                  currentStatus === 'Approved' 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                    : currentStatus === 'Rejected' 
                                      ? 'bg-red-50 text-red-700 border-red-200' 
                                      : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                                }`}
                              >
                                <option value="Pending">{t.pending}</option>
                                <option value="Approved" disabled={isApprovalBlockedForUser}>
                                  {t.approved} {isApprovalBlockedForUser ? (' (Req. Director)') : ''}
                                </option>
                                <option value="Rejected">{t.rejected}</option>
                              </select>
                              {isApprovalBlockedForUser && (
                                <span className="block text-[8px] font-black text-red-600 uppercase tracking-tighter">
                                  {'⚠️ Director Approval Req.'}
                                </span>
                              )}
                              {isLimitExceeded && !isHRorBranchManager && (
                                <span className="block text-[8px] font-black text-emerald-600 uppercase tracking-tighter">
                                  {'✨ Director Override Active'}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <input
                              type="text"
                              value={remarksVal}
                              onChange={(e) => handleApprovalChange(log, 'remarks', e.target.value)}
                              placeholder="Adjustment remarks..."
                              className="border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700 bg-white focus:outline-none w-full max-w-[180px]" />
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setHistoryModalEmpId(log.employeeId);
                                  setHistoryModalDate(log.date);
                                  setHistoryModalEmpName(getEmployeeName(log.employeeId));
                                  setHistoryModalOpen(true);
                                }}
                                className="p-1 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg cursor-pointer transition-all"
                                title={'View change history'}
                              >
                                <History className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (isApprovalBlockedForUser) {
                                    alert(`Direct HR approval limit exceeded (${approvedCountForMonth} //3) for this employee in ${logMonth}. Only Directors can approve this request.`);
                                    return;
                                  }
                                  handleApprovalChange(log, 'approvalStatus', 'Approved');
                                }}
                                disabled={isApprovalBlockedForUser}
                                className={`p-1 border rounded-lg cursor-pointer transition-all ${
                                  isApprovalBlockedForUser 
                                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50' 
                                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                                }`}
                                title={isApprovalBlockedForUser 
                                  ? "Requires Director Approval" 
                                  : "Quick Approve"
                                }
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
                                  className="border border-gray-200 rounded-lg px-1.5 py-1 text-xs text-gray-700 bg-white focus:outline-none" />
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-[9px] text-gray-400 font-black uppercase">Out</span>
                                <input
                                  type="time"
                                  value={checkOutVal}
                                  onChange={(e) => handleApprovalChange(log, 'checkOut', e.target.value)}
                                  className="border border-gray-200 rounded-lg px-1.5 py-1 text-xs text-gray-700 bg-white focus:outline-none" />
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
                              className="border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700 bg-white focus:outline-none w-full max-w-[180px]" />
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setHistoryModalEmpId(log.employeeId);
                                  setHistoryModalDate(log.date);
                                  setHistoryModalEmpName(getEmployeeName(log.employeeId));
                                  setHistoryModalOpen(true);
                                }}
                                className="p-1 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg cursor-pointer transition-all"
                                title={'View change history'}
                              >
                                <History className="w-3.5 h-3.5" />
                              </button>
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

      {/* ATTENDANCE CHANGE REQUESTS TAB */}
      {activeTab === 'requests' && (
        <AttendanceChangeRequestsTab
          changeRequests={localChangeRequests}
          employees={employees}
          attendanceRecords={attendanceRecords}
          portalUser={portalUser}
          isAdminOrDirector={isAdminOrDirector}
          adminSettings={adminSettings}
          onApproveRequest={handleApproveRequest}
          onRejectRequest={handleRejectRequest}
          onBulkApprove={handleBulkApprove}
        />
      )}

      {/* ATTENDANCE AUDIT & HISTORY REPORT TAB (Admin Only) */}
      {activeTab === 'audit_report' && (
        <AttendanceAuditReportTab
          auditLogs={auditLogs}
          changeRequests={localChangeRequests}
          employees={employees}
          isAdminOrDirector={isAdminOrDirector}
          portalUser={portalUser}
        />
      )}

      {/* CALENDAR VIEW */}
      {activeTab === 'calendar' && (
        <MonthlyCalendarReport
          isAdmin={true}
          employeeList={employees}
          attendanceRecords={attendanceRecords}
          adminSettings={adminSettings || { defaultCheckIn: '09:00', defaultCheckOut: '18:00' } as any}
          language={language} />
      )}

      {/* HEATMAP VIEW */}
      {activeTab === 'heatmap' && (
        <AttendanceHeatmap
          employees={employees}
          attendanceRecords={attendanceRecords}
          adminSettings={adminSettings}
          language={language} />
      )}

      {/* Biometric Punch Import Modal */}
      <PunchImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        employees={employees}
        onImportComplete={handlePunchImportComplete}
        language={language}
        adminSettings={adminSettings} />

      {/* Particular Attendance Audit Logs Modal */}
      {historyModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-[#11221b] rounded-3xl w-full max-w-2xl border border-gray-100 dark:border-[#1e3a2f] shadow-2xl flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 dark:border-[#1e3a2f] flex items-center justify-between bg-gray-50/50 dark:bg-[#0c1a14] rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl border border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 dark:text-slate-100 text-sm">
                    {'Attendance Audit Trail'}
                  </h3>
                  <p className="text-xs text-gray-400 dark:text-slate-400 font-bold font-mono mt-0.5 uppercase tracking-wide">
                    {historyModalEmpName} ({historyModalEmpId}) · {historyModalDate}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setHistoryModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-[#1e3a2f] flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {(() => {
                const filteredLogs = auditLogs.filter(
                  log => log.employeeId === historyModalEmpId && log.date === historyModalDate
                );

                if (filteredLogs.length === 0) {
                  return (
                    <div className="text-center py-12 text-gray-400 dark:text-slate-500">
                      <AlertCircle className="w-12 h-12 mx-auto text-gray-200 dark:text-slate-700 mb-2" />
                      <p className="text-xs font-bold">
                        {'No manual modifications logged for this attendance record.'}
                      </p>
                      <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">
                        {'Modifications made during this session will be recorded upon saving.'}
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    {filteredLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-4 rounded-2xl border border-gray-100 dark:border-[#1e3a2f] bg-gray-50/30 dark:bg-[#0b1812] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-gray-200 dark:hover:border-[#2e5243] transition-all"
                      >
                        <div className="space-y-1 text-left">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold text-gray-800 dark:text-slate-200">
                              {log.actorUsername}
                            </span>
                            <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black px-1.5 py-0.5 rounded-lg uppercase tracking-wider">
                              {log.actorRole}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-slate-400">
                            {'Field Changed: '}
                            <span className="font-bold text-gray-700 dark:text-slate-200 font-mono text-[10px] bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 px-1 py-0.5 rounded-md">
                              {log.fieldChanged}
                            </span>
                          </div>
                          <div className="text-xs flex flex-wrap items-center gap-1.5 mt-1">
                            <span className="text-gray-400 dark:text-slate-500 line-through">{log.oldValue}</span>
                            <span className="text-gray-400">➔</span>
                            <span className="font-bold text-emerald-700 dark:text-emerald-400">{log.newValue}</span>
                          </div>
                          {log.remarks && (
                            <p className="text-[10px] text-gray-400 dark:text-slate-400 font-medium italic mt-1 bg-amber-50/50 dark:bg-amber-950/40 p-1.5 rounded-lg border border-amber-100 dark:border-amber-900/50">
                              Remark: {log.remarks}
                            </p>
                          )}
                        </div>

                        <div className="text-right flex flex-col items-end gap-1.5 shrink-0">
                          <span
                            className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest ${
                              log.actionType === 'create'
                                ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800'
                                : log.actionType === 'approve'
                                ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800'
                                : log.actionType === 'reject'
                                ? 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-100 dark:border-rose-800'
                                : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-100 dark:border-amber-800'
                            }`}
                          >
                            {log.actionType}
                          </span>
                          <span className="text-[10px] font-mono text-gray-400 dark:text-slate-400 font-bold">
                            {new Date(log.timestamp).toLocaleString(
                              'en-US'
                            )}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 dark:border-[#1e3a2f] flex justify-end bg-gray-50/30 dark:bg-[#0c1a14] rounded-b-3xl">
              <button
                onClick={() => setHistoryModalOpen(false)}
                className="px-5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                {'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Change Request / Admin Direct Override Modal */}
      {selectedEmpForChange && selectedRecordForChange && (
        <AttendanceChangeRequestModal
          isOpen={changeModalOpen}
          onClose={() => {
            setChangeModalOpen(false);
            setSelectedEmpForChange(null);
            setSelectedRecordForChange(null);
          }}
          employee={selectedEmpForChange}
          attendanceDate={selectedDate}
          currentRecord={selectedRecordForChange}
          portalUser={portalUser}
          canDirectEdit={canDirectEdit}
          isLockedForUser={isLockedForUser}
          onSubmitRequest={handleSubmitChangeRequest}
          onDirectApply={handleDirectApply}
        />
      )}

      {/* Admin Lock & HR Access Delegation Control Modal */}
      {accessControlModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-[#11221b] rounded-3xl w-full max-w-xl border border-gray-100 dark:border-[#1e3a2f] shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 bg-linear-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/10 rounded-2xl border border-white/20">
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight">
                    Attendance Lock & HR Access Control
                  </h3>
                  <p className="text-xs text-slate-300">
                    Manage system-wide lock rules and grant temporary direct access to HR.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAccessControlModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
              {/* Feature 1: Master Lock Switch */}
              <div className="p-4 rounded-2xl border border-gray-200 dark:border-[#1e3a2f] bg-gray-50 dark:bg-[#0c1a14] flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-gray-900 dark:text-slate-100">
                      Attendance Locking (Approval Workflow)
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      adminSettings?.attendanceLockSettings?.isLocked !== false
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}>
                      {adminSettings?.attendanceLockSettings?.isLocked !== false ? 'LOCKED' : 'UNLOCKED'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    When locked, HR users cannot modify records directly. Every change requires a Reason, Remark, and Director/Admin approval.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleLockSetting(adminSettings?.attendanceLockSettings?.isLocked === false)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs shrink-0 ${
                    adminSettings?.attendanceLockSettings?.isLocked !== false
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {adminSettings?.attendanceLockSettings?.isLocked !== false ? 'Unlock System' : 'Lock System'}
                </button>
              </div>

              {/* Feature 2: HR Direct Access Delegation */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Unlock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>HR Temporary Direct Edit Delegation</span>
                  </label>
                  {isHrDirectAccessActive && (
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 animate-pulse">
                      Active
                    </span>
                  )}
                </div>

                {/* Current Status Box */}
                {isHrDirectAccessActive ? (
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        HR Direct Edit Access is Currently Active
                      </span>
                      <button
                        onClick={handleRevokeHrAccess}
                        className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-3xs"
                      >
                        Revoke Access Now
                      </button>
                    </div>
                    <div className="text-[11px] space-y-0.5 text-emerald-800 dark:text-emerald-300">
                      <p>• Granted By: <span className="font-bold">{adminSettings?.attendanceLockSettings?.hrAccessGrantedBy || 'Admin'}</span></p>
                      <p>• Expires At: <span className="font-bold font-mono">{adminSettings?.attendanceLockSettings?.hrAccessExpiresAt ? new Date(adminSettings.attendanceLockSettings.hrAccessExpiresAt).toLocaleString() : 'Permanent Session'}</span></p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0c1a14] border border-gray-200 dark:border-[#1e3a2f] space-y-3">
                    <p className="text-xs text-gray-600 dark:text-slate-300">
                      Grant temporary direct editing access to HR staff (e.g. for bulk corrections or shift changes). When granted, HR can update attendance without submitting individual approval requests.
                    </p>

                    {/* Quick Access Durations */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        onClick={() => handleGrantTimedHrAccess(15)}
                        className="p-2.5 bg-white dark:bg-[#11221b] hover:bg-indigo-50 dark:hover:bg-indigo-950 border border-gray-200 dark:border-[#1e3a2f] hover:border-indigo-300 text-gray-800 dark:text-slate-100 rounded-xl text-xs font-bold text-center transition-all cursor-pointer shadow-3xs"
                      >
                        15 Mins
                      </button>
                      <button
                        onClick={() => handleGrantTimedHrAccess(30)}
                        className="p-2.5 bg-white dark:bg-[#11221b] hover:bg-indigo-50 dark:hover:bg-indigo-950 border border-gray-200 dark:border-[#1e3a2f] hover:border-indigo-300 text-gray-800 dark:text-slate-100 rounded-xl text-xs font-bold text-center transition-all cursor-pointer shadow-3xs"
                      >
                        30 Mins
                      </button>
                      <button
                        onClick={() => handleGrantTimedHrAccess(60)}
                        className="p-2.5 bg-white dark:bg-[#11221b] hover:bg-indigo-50 dark:hover:bg-indigo-950 border border-gray-200 dark:border-[#1e3a2f] hover:border-indigo-300 text-gray-800 dark:text-slate-100 rounded-xl text-xs font-bold text-center transition-all cursor-pointer shadow-3xs"
                      >
                        1 Hour
                      </button>
                      <button
                        onClick={() => handleGrantTimedHrAccess(1440)}
                        className="p-2.5 bg-white dark:bg-[#11221b] hover:bg-indigo-50 dark:hover:bg-indigo-950 border border-gray-200 dark:border-[#1e3a2f] hover:border-indigo-300 text-gray-800 dark:text-slate-100 rounded-xl text-xs font-bold text-center transition-all cursor-pointer shadow-3xs"
                      >
                        Full Day
                      </button>
                    </div>

                    {/* Custom Minutes Input */}
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-[#1e3a2f]">
                      <span className="text-xs font-bold text-gray-600 dark:text-slate-400">Custom Duration:</span>
                      <input
                        type="number"
                        min="5"
                        max="4320"
                        value={accessDurationMins}
                        onChange={(e) => setAccessDurationMins(Math.max(5, Number(e.target.value)))}
                        className="w-20 border border-gray-200 dark:border-[#1e3a2f] rounded-lg px-2.5 py-1 text-xs font-bold bg-white dark:bg-[#11221b] text-gray-800 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 outline-none"
                      />
                      <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">Minutes</span>
                      <button
                        onClick={() => handleGrantTimedHrAccess(accessDurationMins)}
                        className="ml-auto px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-3xs"
                      >
                        Grant Access
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Audit Transparency Notice */}
              <div className="p-3 bg-slate-100 dark:bg-[#0c1a14] rounded-xl border border-slate-200 dark:border-[#1e3a2f] text-slate-600 dark:text-slate-400 text-[11px] flex items-start gap-2">
                <FileCheck2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Audit Trail Guarantee:</strong> Even when HR direct access is active, every change made to status, times, or remarks is automatically recorded with actor username, timestamp, and before/after values in the <strong>Audit & History Report</strong>.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 dark:border-[#1e3a2f] bg-gray-50 dark:bg-[#0c1a14] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAccessControlModalOpen(false)}
                className="px-5 py-2.5 bg-gray-200 dark:bg-slate-800 hover:bg-gray-300 dark:hover:bg-slate-700 text-gray-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Modal Dispatcher */}
      {adminSettings && (
        <WhatsAppModal
          isOpen={waModalOpen}
          onClose={() => setWaModalOpen(false)}
          settings={adminSettings}
          recipient={waRecipient}
          defaultCategory={waCategory}
          variables={waVars} />
      )}

      {/* Monthly Approval Requests & Signable Report Modal */}
      <MonthlyApprovalReportModal
        isOpen={monthlyApprovalModalOpen}
        onClose={() => setMonthlyApprovalModalOpen(false)}
        changeRequests={localChangeRequests}
        attendanceRecords={attendanceRecords}
        employees={employees}
        adminSettings={adminSettings}
        portalUser={portalUser}
        isAdminOrDirector={isAdminOrDirector}
        onApproveRequest={handleApproveRequest}
        onRejectRequest={handleRejectRequest}
        onBulkApprove={handleBulkApprove}
      />

    </div>
  );
}
