import React, { useState, useMemo } from 'react';
import { 
  X, Download, Printer, Filter, Search, Calendar, Building, CheckCircle2, 
  XCircle, Clock, FileText, Check, AlertCircle, Sparkles, CheckCheck, 
  ArrowRight, ShieldCheck, UserCheck, User, Users, RefreshCw
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { AttendanceChangeRequest, Attendance, Employee, AdminSettings } from '../types';

interface MonthlyApprovalReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  changeRequests: AttendanceChangeRequest[];
  attendanceRecords: Attendance[];
  employees: Employee[];
  adminSettings?: AdminSettings;
  portalUser?: any;
  isAdminOrDirector: boolean;
  onApproveRequest?: (request: AttendanceChangeRequest, reviewerRemarks?: string) => Promise<void>;
  onRejectRequest?: (request: AttendanceChangeRequest, reviewerRemarks?: string) => Promise<void>;
  onBulkApprove?: (requestIds: string[]) => Promise<void>;
  initialMonth?: string; // YYYY-MM
}

const MONTHS = [
  { name: 'January', value: '01' },
  { name: 'February', value: '02' },
  { name: 'March', value: '03' },
  { name: 'April', value: '04' },
  { name: 'May', value: '05' },
  { name: 'June', value: '06' },
  { name: 'July', value: '07' },
  { name: 'August', value: '08' },
  { name: 'September', value: '09' },
  { name: 'October', value: '10' },
  { name: 'November', value: '11' },
  { name: 'December', value: '12' },
];

export default function MonthlyApprovalReportModal({
  isOpen,
  onClose,
  changeRequests = [],
  attendanceRecords = [],
  employees = [],
  adminSettings,
  portalUser,
  isAdminOrDirector,
  onApproveRequest,
  onRejectRequest,
  onBulkApprove,
  initialMonth
}: MonthlyApprovalReportModalProps) {
  if (!isOpen) return null;

  const now = new Date();
  const currentYearStr = String(now.getFullYear());
  const currentMonthStr = String(now.getMonth() + 1).padStart(2, '0');

  const defaultYear = initialMonth ? initialMonth.split('-')[0] : currentYearStr;
  const defaultMonth = initialMonth ? initialMonth.split('-')[1] : currentMonthStr;

  const [selectedYear, setSelectedYear] = useState(defaultYear);
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [filterStatus, setFilterStatus] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedBranch, setSelectedBranch] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Rejection modal
  const [rejectModalReq, setRejectModalReq] = useState<AttendanceChangeRequest | null>(null);
  const [rejectionRemarks, setRejectionRemarks] = useState('');

  const targetMonthPrefix = `${selectedYear}-${selectedMonth}`;
  const monthName = MONTHS.find(m => m.value === selectedMonth)?.name || selectedMonth;
  const companyName = adminSettings?.companyName || 'Rathi Buildmart';

  // Department and branch filters
  const departments = useMemo(() => {
    const set = new Set<string>();
    employees.forEach(e => { if (e.department) set.add(e.department); });
    changeRequests.forEach(r => { if (r.department) set.add(r.department); });
    return ['All', ...Array.from(set)];
  }, [employees, changeRequests]);

  const branches = useMemo(() => {
    const set = new Set<string>();
    employees.forEach(e => { if (e.branch) set.add(e.branch); });
    changeRequests.forEach(r => { if (r.branch) set.add(r.branch); });
    return ['All', ...Array.from(set)];
  }, [employees, changeRequests]);

  // Unified items for this month: Combine changeRequests and pending/evaluated attendance records for that month
  const monthlyItems = useMemo(() => {
    const list: AttendanceChangeRequest[] = [];
    const seenKeys = new Set<string>();

    // 1. Add all changeRequests that match target month
    changeRequests.forEach(req => {
      const matchDate = req.attendanceDate && req.attendanceDate.startsWith(targetMonthPrefix);
      const matchRequestedAt = req.requestedAt && req.requestedAt.startsWith(targetMonthPrefix);
      if (matchDate || matchRequestedAt) {
        list.push(req);
        seenKeys.add(`${req.employeeId}_${req.attendanceDate}`);
      }
    });

    // 2. Add any attendance records from this month that had miss punch or half day approvals and aren't in change requests
    attendanceRecords.forEach(att => {
      if (att.date && att.date.startsWith(targetMonthPrefix)) {
        if ((att.status === 'Miss Punch' || att.status === 'Half Day') && att.approvalStatus) {
          const key = `${att.employeeId}_${att.date}`;
          if (!seenKeys.has(key)) {
            const emp = employees.find(e => e.id === att.employeeId);
            list.push({
              id: `rec_${att.employeeId}_${att.date}`,
              attendanceDate: att.date,
              employeeId: att.employeeId,
              employeeName: emp?.name || att.employeeId,
              department: emp?.department || '',
              branch: emp?.branch || '',
              designation: emp?.designation || '',
              currentStatus: 'Absent',
              currentCheckIn: '',
              currentCheckOut: '',
              currentOvertimeHours: 0,
              requestedStatus: att.status,
              requestedCheckIn: att.checkIn || '',
              requestedCheckOut: att.checkOut || '',
              requestedOvertimeHours: att.overtimeHours || 0,
              reason: att.status === 'Miss Punch' ? 'Missed Punch Regularization' : 'Half Day Duty Regularization',
              remarks: att.remarks || 'Attendance log recorded',
              requestedByUsername: 'system',
              requestedByName: emp?.name || 'Self/System',
              requestedByRole: 'Employee',
              requestedAt: `${att.date}T09:00:00.000Z`,
              status: att.approvalStatus === 'Approved' ? 'Approved' : att.approvalStatus === 'Rejected' ? 'Rejected' : 'Pending',
              reviewedBy: att.approvalStatus === 'Approved' ? 'HR / Administrator' : undefined,
              reviewedAt: att.approvalStatus === 'Approved' ? `${att.date}T18:00:00.000Z` : undefined
            });
            seenKeys.add(key);
          }
        }
      }
    });

    return list;
  }, [changeRequests, attendanceRecords, targetMonthPrefix, employees]);

  // Statistics for this month
  const stats = useMemo(() => {
    const total = monthlyItems.length;
    const pending = monthlyItems.filter(i => i.status === 'Pending').length;
    const approved = monthlyItems.filter(i => i.status === 'Approved').length;
    const rejected = monthlyItems.filter(i => i.status === 'Rejected').length;
    const uniqueEmployees = new Set(monthlyItems.map(i => i.employeeId)).size;

    return { total, pending, approved, rejected, uniqueEmployees };
  }, [monthlyItems]);

  // Filtered list
  const filteredItems = useMemo(() => {
    return monthlyItems.filter(item => {
      const matchesStatus = filterStatus === 'All' || item.status === filterStatus;
      const matchesDept = selectedDept === 'All' || item.department === selectedDept;
      const matchesBranch = selectedBranch === 'All' || item.branch === selectedBranch;
      
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch = !q ||
        item.employeeName.toLowerCase().includes(q) ||
        item.employeeId.toLowerCase().includes(q) ||
        (item.department && item.department.toLowerCase().includes(q)) ||
        (item.branch && item.branch.toLowerCase().includes(q)) ||
        item.reason.toLowerCase().includes(q) ||
        item.remarks.toLowerCase().includes(q) ||
        item.attendanceDate.includes(q) ||
        item.requestedByName.toLowerCase().includes(q);

      return matchesStatus && matchesDept && matchesBranch && matchesSearch;
    }).sort((a, b) => {
      // Pending first, then by date descending
      if (a.status === 'Pending' && b.status !== 'Pending') return -1;
      if (a.status !== 'Pending' && b.status === 'Pending') return 1;
      return b.attendanceDate.localeCompare(a.attendanceDate);
    });
  }, [monthlyItems, filterStatus, selectedDept, selectedBranch, searchTerm]);

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSelectAllPending = () => {
    const pendingIds = filteredItems.filter(r => r.status === 'Pending').map(r => r.id);
    if (selectedIds.length === pendingIds.length && pendingIds.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingIds);
    }
  };

  // Approval actions
  const handleSingleApprove = async (req: AttendanceChangeRequest) => {
    if (!onApproveRequest) return;
    setProcessingId(req.id);
    try {
      await onApproveRequest(req, `Approved in Monthly Report (${monthName} ${selectedYear})`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectModalReq || !onRejectRequest) return;
    setProcessingId(rejectModalReq.id);
    try {
      await onRejectRequest(rejectModalReq, rejectionRemarks.trim() || `Rejected in Monthly Report (${monthName} ${selectedYear})`);
      setRejectModalReq(null);
      setRejectionRemarks('');
    } finally {
      setProcessingId(null);
    }
  };

  const handleExecuteBulkApprove = async () => {
    if (selectedIds.length === 0 || !onBulkApprove) return;
    if (!window.confirm(`Are you sure you want to approve all ${selectedIds.length} selected requests for ${monthName} ${selectedYear}?`)) {
      return;
    }
    setIsBulkProcessing(true);
    try {
      await onBulkApprove(selectedIds);
      setSelectedIds([]);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // PDF Export Engine with Official Signatures Section
  const handleExportPDF = () => {
    if (filteredItems.length === 0) {
      alert(`No approval requests found for ${monthName} ${selectedYear} matching current filters.`);
      return;
    }

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = 297;
    const pageHeight = 210;
    const margin = 10;
    const usableWidth = pageWidth - (margin * 2); // 277mm

    // Helper: Draw Master Header & KPI Banner
    const drawPageHeader = (pageNum: number) => {
      // Header Top Banner
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, pageWidth, 22, 'F');

      // Company Title & Report Title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`${companyName.toUpperCase()} - MONTHLY ATTENDANCE APPROVAL & PENDING REGISTER`, margin, 9.5);

      // Report Metadata Line
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(203, 213, 225); // slate-300
      const generatedDateStr = new Date().toLocaleString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      const generatedByStr = portalUser?.name || portalUser?.username || 'Administrator';
      doc.text(
        `Period: ${monthName} ${selectedYear}  |  Generated On: ${generatedDateStr}  |  Generated By: ${generatedByStr}  |  Branch/Dept: ${selectedDept === 'All' ? 'All Departments' : selectedDept}`,
        margin,
        16.5
      );

      // KPI Summary Bar (Page 1 only)
      if (pageNum === 1) {
        doc.setFillColor(241, 245, 249); // slate-100
        doc.setDrawColor(203, 213, 225); // slate-300
        doc.rect(margin, 25, usableWidth, 9, 'FD');

        doc.setTextColor(30, 41, 59); // slate-800
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.text(
          `Total Requests: ${stats.total}   |   Pending Director/Admin Review: ${stats.pending}   |   Approved: ${stats.approved}   |   Rejected: ${stats.rejected}   |   Total Staff Involved: ${stats.uniqueEmployees}`,
          margin + 3,
          30.8
        );
      }
    };

    // Helper: Draw Table Header
    const drawTableHeader = (startYPos: number) => {
      doc.setFillColor(226, 232, 240); // slate-200
      doc.setDrawColor(148, 163, 184); // slate-400
      doc.rect(margin, startYPos, usableWidth, 7.5, 'FD');

      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42); // slate-900

      // Exact Column Coordinates (Total = 277mm)
      doc.text('S.No', margin + 1, startYPos + 5);                     // X = 11 (width ~8)
      doc.text('ID & Employee Name', margin + 10, startYPos + 5);      // X = 20 (width ~50)
      doc.text('Dept / Branch', margin + 60, startYPos + 5);           // X = 70 (width ~36)
      doc.text('Work Date', margin + 96, startYPos + 5);               // X = 106 (width ~22)
      doc.text('Current -> Requested', margin + 118, startYPos + 5);   // X = 128 (width ~52)
      doc.text('Reason & Justification', margin + 170, startYPos + 5); // X = 180 (width ~52)
      doc.text('Status', margin + 222, startYPos + 5);                 // X = 232 (width ~22)
      doc.text('Reviewer / Sign', margin + 244, startYPos + 5);        // X = 254 (width ~33)
    };

    // Draw Page 1 Header & Table Header
    drawPageHeader(1);
    let startY = 37;
    drawTableHeader(startY);
    startY += 7.5;

    // Draw Data Rows
    filteredItems.forEach((item, index) => {
      // Check if row exceeds printable height (leave room for signatures or footer)
      if (startY > pageHeight - 45) {
        // Page footer
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text(`Monthly Attendance Approval Register - ${companyName} (${monthName} ${selectedYear})`, margin, pageHeight - 6);
        doc.text(`Page ${doc.getNumberOfPages()}`, pageWidth - margin - 12, pageHeight - 6);

        doc.addPage('a4', 'landscape');
        drawPageHeader(doc.getNumberOfPages());
        startY = 25;
        drawTableHeader(startY);
        startY += 7.5;
      }

      // Alternate Row Background
      if (index % 2 === 1) {
        doc.setFillColor(248, 250, 252); // slate-50
      } else {
        doc.setFillColor(255, 255, 255); // pure white
      }
      doc.setDrawColor(226, 232, 240);
      doc.rect(margin, startY, usableWidth, 8, 'FD');

      // 1. S.No
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(71, 85, 105);
      doc.text(String(index + 1), margin + 1, startY + 5.2);

      // 2. ID & Employee Name (Line 1: Name, Line 2: ID & Designation)
      const empName = item.employeeName && item.employeeName !== item.employeeId
        ? item.employeeName
        : `Employee ${item.employeeId}`;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(15, 23, 42);
      doc.text(empName, margin + 10, startY + 3.3, { maxWidth: 48 });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.5);
      doc.setTextColor(100, 116, 139);
      const subEmp = `ID: ${item.employeeId}${item.designation ? ` | ${item.designation}` : ''}`;
      doc.text(subEmp, margin + 10, startY + 6.6, { maxWidth: 48 });

      // 3. Dept / Branch (Line 1: Dept, Line 2: Branch)
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(30, 41, 59);
      doc.text(item.department || '-', margin + 60, startY + 3.3, { maxWidth: 34 });

      doc.setFontSize(5.5);
      doc.setTextColor(100, 116, 139);
      doc.text(item.branch || 'Main Branch', margin + 60, startY + 6.6, { maxWidth: 34 });

      // 4. Work Date
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(30, 41, 59);
      doc.text(item.attendanceDate, margin + 96, startY + 5.2);

      // 5. Current -> Requested (Line 1: Status Change, Line 2: Timing / OT)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(15, 23, 42);
      const changeMain = `${item.currentStatus || 'Absent'} -> ${item.requestedStatus}`;
      doc.text(changeMain, margin + 118, startY + 3.3, { maxWidth: 50 });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.5);
      doc.setTextColor(71, 85, 105);
      let changeSub = '';
      if (item.requestedCheckIn && item.requestedCheckOut) {
        changeSub = `${item.requestedCheckIn} - ${item.requestedCheckOut}`;
      } else if (item.requestedCheckIn) {
        changeSub = `In: ${item.requestedCheckIn}`;
      }
      if (item.requestedOvertimeHours && item.requestedOvertimeHours > 0) {
        changeSub += `${changeSub ? ' | ' : ''}OT: ${item.requestedOvertimeHours}h`;
      }
      if (!changeSub) changeSub = 'Full Day Regularization';
      doc.text(changeSub, margin + 118, startY + 6.6, { maxWidth: 50 });

      // 6. Reason & Justification (Line 1: Reason, Line 2: Remarks)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(30, 41, 59);
      doc.text(item.reason || 'Regularization', margin + 170, startY + 3.3, { maxWidth: 50 });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.5);
      doc.setTextColor(100, 116, 139);
      doc.text(item.remarks || '-', margin + 170, startY + 6.6, { maxWidth: 50 });

      // 7. Status (with Color Pill)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      if (item.status === 'Approved') {
        doc.setTextColor(5, 150, 105); // emerald-600
        doc.text('APPROVED', margin + 222, startY + 5.2);
      } else if (item.status === 'Rejected') {
        doc.setTextColor(225, 29, 72); // rose-600
        doc.text('REJECTED', margin + 222, startY + 5.2);
      } else {
        doc.setTextColor(217, 119, 6); // amber-600
        doc.text('PENDING', margin + 222, startY + 5.2);
      }

      // 8. Reviewer / Sign
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(30, 41, 59);
      const reviewerMain = item.reviewedBy || 'Pending Review';
      doc.text(reviewerMain, margin + 244, startY + 3.3, { maxWidth: 31 });

      doc.setFontSize(5.5);
      doc.setTextColor(100, 116, 139);
      const reviewerSub = item.reviewedAt ? item.reviewedAt.slice(0, 10) : 'Awaiting Sign';
      doc.text(reviewerSub, margin + 244, startY + 6.6, { maxWidth: 31 });

      startY += 8;
    });

    // Check if there is enough space for the 3 signature boxes at the bottom
    if (startY > pageHeight - 38) {
      doc.addPage('a4', 'landscape');
      drawPageHeader(doc.getNumberOfPages());
      startY = 26;
    } else {
      startY = Math.max(startY + 6, pageHeight - 34);
    }

    // Three Official Corporate Verification / Signature Blocks
    const boxWidth = 87;
    const boxHeight = 24;
    const boxGap = 8;

    const drawSignatureBox = (
      boxX: number,
      boxY: number,
      title: string,
      tag: string,
      line1: string,
      line2: string,
      signLine: string
    ) => {
      // 1. Box Container (Explicitly White Background)
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(203, 213, 225); // slate-300
      doc.rect(boxX, boxY, boxWidth, boxHeight, 'FD');

      // 2. Box Header Banner
      doc.setFillColor(241, 245, 249); // slate-100
      doc.rect(boxX, boxY, boxWidth, 6, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.line(boxX, boxY + 6, boxX + boxWidth, boxY + 6);

      // 3. Header Title & Tag
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text(title, boxX + 2.5, boxY + 4.2);

      doc.setFontSize(5.5);
      doc.setTextColor(3, 98, 60); // emerald-800
      doc.text(`[ ${tag} ]`, boxX + boxWidth - 2.5, boxY + 4.2, { align: 'right' });

      // 4. Line 1 (Name / Officer)
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(51, 65, 85);
      doc.text(line1, boxX + 2.5, boxY + 10.5);

      // 5. Line 2 (Date / Recommendation / Status)
      doc.text(line2, boxX + 2.5, boxY + 15);

      // 6. Signature Line
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text(signLine, boxX + 2.5, boxY + 20.5);
    };

    // Box 1: Prepared & Verified by HR
    const box1X = margin;
    drawSignatureBox(
      box1X,
      startY,
      '1. PREPARED & VERIFIED (HR)',
      'Verified',
      `Officer: ${portalUser?.name || 'HR Executive / Manager'}`,
      `Date: ${new Date().toLocaleDateString('en-IN')} | Status: Verified for Audit`,
      'HR Signature & Stamp: ___________________'
    );

    // Box 2: Checked & Recommended by Dept Head
    const box2X = box1X + boxWidth + boxGap;
    drawSignatureBox(
      box2X,
      startY,
      '2. CHECKED (BRANCH / DEPT HEAD)',
      'Recommended',
      `Dept: ${selectedDept === 'All' ? 'All Operations' : selectedDept}`,
      'Recommendation: [X] Approved for Regularization',
      'Manager Signature: _____________________'
    );

    // Box 3: Final Approval & Sanction by Director
    const box3X = box2X + boxWidth + boxGap;
    drawSignatureBox(
      box3X,
      startY,
      '3. FINAL APPROVAL (DIRECTOR)',
      'Final Sanction',
      'Authority: Director / Managing Board',
      'Status: [  ] Sanctioned for Payroll  [  ] Approved w/ Edits',
      'Director Seal & Sign: ____________________'
    );

    // Footer on final page
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Monthly Attendance Approval Register - ${companyName} (${monthName} ${selectedYear})`, margin, pageHeight - 4);
    doc.text(`Page ${doc.getNumberOfPages()}`, pageWidth - margin - 12, pageHeight - 4);

    // Download PDF
    doc.save(`Monthly_Attendance_Approval_Report_${selectedYear}_${selectedMonth}.pdf`);
  };

  // CSV Export Engine
  const handleExportCSV = () => {
    if (filteredItems.length === 0) {
      alert(`No approval records found for ${monthName} ${selectedYear}.`);
      return;
    }

    const headers = [
      'S.No',
      'Employee ID',
      'Employee Name',
      'Department',
      'Branch',
      'Designation',
      'Work Date',
      'Current Status',
      'Current Check In',
      'Current Check Out',
      'Requested Status',
      'Requested Check In',
      'Requested Check Out',
      'Requested OT (Hours)',
      'Reason for Request',
      'Remarks',
      'Approval Status',
      'Requested By',
      'Requested At',
      'Reviewed By',
      'Reviewed At',
      'Reviewer Remarks'
    ];

    const rows = filteredItems.map((item, index) => [
      index + 1,
      `"${item.employeeId}"`,
      `"${item.employeeName}"`,
      `"${item.department || ''}"`,
      `"${item.branch || ''}"`,
      `"${item.designation || ''}"`,
      `"${item.attendanceDate}"`,
      `"${item.currentStatus}"`,
      `"${item.currentCheckIn || ''}"`,
      `"${item.currentCheckOut || ''}"`,
      `"${item.requestedStatus}"`,
      `"${item.requestedCheckIn || ''}"`,
      `"${item.requestedCheckOut || ''}"`,
      item.requestedOvertimeHours || 0,
      `"${(item.reason || '').replace(/"/g, '""')}"`,
      `"${(item.remarks || '').replace(/"/g, '""')}"`,
      `"${item.status}"`,
      `"${item.requestedByName || ''}"`,
      `"${item.requestedAt ? new Date(item.requestedAt).toLocaleString() : ''}"`,
      `"${item.reviewedBy || ''}"`,
      `"${item.reviewedAt ? new Date(item.reviewedAt).toLocaleString() : ''}"`,
      `"${(item.reviewerRemarks || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Monthly_Attendance_Approval_Report_${selectedYear}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Direct Print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white dark:bg-[#11221b] border border-slate-200 dark:border-[#1e3a2f] rounded-3xl w-full max-w-7xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-[#03623c] to-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 shadow-md">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider text-emerald-300">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{'Monthly Approval & Pending Register'}</span>
            </div>
            <h2 className="text-lg sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>{companyName} — Monthly Employee Approval Report</span>
            </h2>
            <p className="text-xs text-emerald-100/80 font-medium">
              {'Consolidated month-wise attendance regularizations, miss-punches & change requests for all employees with signable audit certificates.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleExportPDF}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              title="Download Signable PDF with HR and Director Signatures"
            >
              <Download className="w-4 h-4" />
              <span>{'Download Signable PDF'}</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Export to Excel / CSV"
            >
              <FileText className="w-4 h-4 text-emerald-300" />
              <span>{'Export Excel/CSV'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white p-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
              title="Print Report"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Month Selector & Controls Bar */}
        <div className="p-4 bg-slate-50 dark:bg-[#0c1a14] border-b border-slate-200 dark:border-[#1e3a2f] flex flex-wrap items-center justify-between gap-3 shrink-0">
          
          {/* Period Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white dark:bg-[#11221b] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#1e3a2f] shadow-2xs">
              <Calendar className="w-4 h-4 text-[#03623c] dark:text-emerald-400" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase font-mono">Period:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none cursor-pointer"
              >
                {MONTHS.map(m => (
                  <option key={m.value} value={m.value} className="dark:bg-[#11221b] text-slate-900 dark:text-slate-100">
                    {m.name}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none cursor-pointer font-mono"
              >
                {['2024', '2025', '2026', '2027', '2028'].map(y => (
                  <option key={y} value={y} className="dark:bg-[#11221b] text-slate-900 dark:text-slate-100">
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Department Filter */}
            <div className="flex items-center gap-1 bg-white dark:bg-[#11221b] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#1e3a2f] shadow-2xs">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] font-bold text-slate-500 uppercase font-mono">Dept:</span>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                {departments.map(d => (
                  <option key={d} value={d} className="dark:bg-[#11221b]">{d}</option>
                ))}
              </select>
            </div>

            {/* Branch Filter */}
            {branches.length > 2 && (
              <div className="flex items-center gap-1 bg-white dark:bg-[#11221b] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#1e3a2f] shadow-2xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase font-mono">Branch:</span>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  {branches.map(b => (
                    <option key={b} value={b} className="dark:bg-[#11221b]">{b}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px] flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Employee, ID, Reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-7 py-1.5 text-xs bg-white dark:bg-[#11221b] border border-slate-200 dark:border-[#1e3a2f] rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#03623c]"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Stats Metrics Cards */}
        <div className="p-4 bg-white dark:bg-[#11221b] border-b border-slate-100 dark:border-[#1e3a2f] grid grid-cols-2 sm:grid-cols-5 gap-3 shrink-0">
          <button
            onClick={() => setFilterStatus('All')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              filterStatus === 'All'
                ? 'bg-slate-100 dark:bg-slate-800 border-slate-400 dark:border-slate-600'
                : 'bg-slate-50/60 dark:bg-[#0b1812] border-slate-100 dark:border-[#1e3a2f]'
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[10px] font-extrabold uppercase font-mono tracking-wider">Total Month</span>
              <FileText className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-slate-100 font-mono">
              {stats.total}
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">{stats.uniqueEmployees} employees</span>
          </button>

          <button
            onClick={() => setFilterStatus('Pending')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              filterStatus === 'Pending'
                ? 'bg-amber-500/10 dark:bg-amber-950/40 border-amber-400 dark:border-amber-700'
                : 'bg-slate-50/60 dark:bg-[#0b1812] border-slate-100 dark:border-[#1e3a2f]'
            }`}
          >
            <div className="flex items-center justify-between text-amber-600 mb-1">
              <span className="text-[10px] font-extrabold uppercase font-mono tracking-wider">Pending Review</span>
              <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            </div>
            <div className="text-xl font-black text-amber-600 font-mono">
              {stats.pending}
            </div>
            <span className="text-[10px] text-amber-600/80 block mt-0.5">Req. Director/Admin</span>
          </button>

          <button
            onClick={() => setFilterStatus('Approved')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              filterStatus === 'Approved'
                ? 'bg-emerald-500/10 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700'
                : 'bg-slate-50/60 dark:bg-[#0b1812] border-slate-100 dark:border-[#1e3a2f]'
            }`}
          >
            <div className="flex items-center justify-between text-emerald-600 mb-1">
              <span className="text-[10px] font-extrabold uppercase font-mono tracking-wider">Approved</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="text-xl font-black text-emerald-600 font-mono">
              {stats.approved}
            </div>
            <span className="text-[10px] text-emerald-600/80 block mt-0.5">Ready for payroll</span>
          </button>

          <button
            onClick={() => setFilterStatus('Rejected')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              filterStatus === 'Rejected'
                ? 'bg-rose-500/10 dark:bg-rose-950/40 border-rose-400 dark:border-rose-700'
                : 'bg-slate-50/60 dark:bg-[#0b1812] border-slate-100 dark:border-[#1e3a2f]'
            }`}
          >
            <div className="flex items-center justify-between text-rose-600 mb-1">
              <span className="text-[10px] font-extrabold uppercase font-mono tracking-wider">Rejected</span>
              <XCircle className="w-3.5 h-3.5 text-rose-500" />
            </div>
            <div className="text-xl font-black text-rose-600 font-mono">
              {stats.rejected}
            </div>
            <span className="text-[10px] text-rose-600/80 block mt-0.5">Declined records</span>
          </button>

          {/* Quick Bulk Action for Director */}
          <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl flex flex-col justify-between">
            <span className="text-[10px] font-extrabold uppercase font-mono text-emerald-800 dark:text-emerald-300">Director Actions</span>
            {isAdminOrDirector && stats.pending > 0 ? (
              <div className="flex items-center gap-1.5 mt-1">
                <button
                  onClick={handleSelectAllPending}
                  className="px-2 py-1 bg-white dark:bg-[#11221b] border border-emerald-300 dark:border-emerald-800 text-[10px] font-bold rounded-lg text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 cursor-pointer"
                >
                  {selectedIds.length === filteredItems.filter(r => r.status === 'Pending').length && selectedIds.length > 0
                    ? 'Deselect'
                    : 'Select All'}
                </button>
                {selectedIds.length > 0 && (
                  <button
                    onClick={handleExecuteBulkApprove}
                    disabled={isBulkProcessing}
                    className="px-2.5 py-1 bg-[#03623c] text-white text-[10px] font-black rounded-lg hover:bg-[#024d2e] flex items-center gap-1 shadow-3xs cursor-pointer disabled:opacity-50"
                  >
                    <CheckCheck className="w-3 h-3" />
                    <span>Approve ({selectedIds.length})</span>
                  </button>
                )}
              </div>
            ) : (
              <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 mt-1 flex items-center gap-1">
                <Check className="w-3 h-3" /> All Pending Cleared
              </span>
            )}
          </div>
        </div>

        {/* Main Table Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {filteredItems.length > 0 ? (
            <div className="border border-slate-200 dark:border-[#1e3a2f] rounded-2xl overflow-hidden shadow-xs bg-white dark:bg-[#11221b]">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-[#0c1a14] border-b border-slate-200 dark:border-[#1e3a2f] text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      {isAdminOrDirector && (
                        <th className="py-3 px-4 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={selectedIds.length > 0 && selectedIds.length === filteredItems.filter(r => r.status === 'Pending').length}
                            onChange={handleSelectAllPending}
                            className="w-3.5 h-3.5 rounded text-[#03623c] focus:ring-[#03623c] cursor-pointer"
                          />
                        </th>
                      )}
                      <th className="py-3 px-4">{'Employee Details'}</th>
                      <th className="py-3 px-4">{'Work Date'}</th>
                      <th className="py-3 px-4">{'Change Details (Current → Requested)'}</th>
                      <th className="py-3 px-4">{'Reason & Remarks'}</th>
                      <th className="py-3 px-4 text-center">{'Approval Status'}</th>
                      <th className="py-3 px-4">{'Reviewer / Decision'}</th>
                      {isAdminOrDirector && (
                        <th className="py-3 px-4 text-right">{'Actions'}</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#1e3a2f] font-medium">
                    {filteredItems.map((item) => {
                      const isPending = item.status === 'Pending';
                      const isApproved = item.status === 'Approved';
                      const isRejected = item.status === 'Rejected';
                      const isSelected = selectedIds.includes(item.id);
                      const isProcessing = processingId === item.id;

                      return (
                        <tr 
                          key={item.id}
                          className={`hover:bg-slate-50/50 dark:hover:bg-[#162e24] transition-colors ${
                            isSelected ? 'bg-emerald-50/30 dark:bg-emerald-950/20' : ''
                          }`}
                        >
                          {isAdminOrDirector && (
                            <td className="py-3 px-4 text-center">
                              {isPending && (
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleSelect(item.id)}
                                  className="w-3.5 h-3.5 rounded text-[#03623c] focus:ring-[#03623c] cursor-pointer"
                                />
                              )}
                            </td>
                          )}

                          <td className="py-3 px-4">
                            <div>
                              <span className="font-extrabold text-slate-900 dark:text-slate-100 block">
                                {item.employeeName}
                              </span>
                              <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5 mt-0.5">
                                <span>{item.employeeId}</span>
                                {item.department && <span>• {item.department}</span>}
                                {item.branch && <span>• {item.branch}</span>}
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                            {item.attendanceDate}
                          </td>

                          <td className="py-3 px-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-xs">
                                <span className="line-through text-rose-500 font-semibold">{item.currentStatus || 'Absent'}</span>
                                <ArrowRight className="w-3 h-3 text-slate-400" />
                                <span className="text-[#03623c] dark:text-emerald-400 font-extrabold">{item.requestedStatus}</span>
                              </div>
                              {(item.requestedCheckIn || item.requestedCheckOut) && (
                                <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                                  Time: {item.requestedCheckIn || '—'} to {item.requestedCheckOut || '—'}
                                </div>
                              )}
                              {item.requestedOvertimeHours > 0 && (
                                <span className="inline-block bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[9px] font-black px-1.5 py-0.2 rounded-md">
                                  OT: {item.requestedOvertimeHours}h
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-4 max-w-[200px]">
                            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                              {item.reason}
                            </div>
                            {item.remarks && (
                              <div className="text-[10px] text-slate-400 italic truncate" title={item.remarks}>
                                "{item.remarks}"
                              </div>
                            )}
                            <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                              By: {item.requestedByName} ({item.requestedByRole})
                            </div>
                          </td>

                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              isPending
                                ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200'
                                : isApproved
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200'
                                : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200'
                            }`}>
                              {isPending && <Clock className="w-3 h-3 animate-spin" />}
                              {isApproved && <CheckCircle2 className="w-3 h-3" />}
                              {isRejected && <XCircle className="w-3 h-3" />}
                              <span>{item.status}</span>
                            </span>
                          </td>

                          <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300">
                            {item.reviewedBy ? (
                              <div>
                                <span className="font-bold text-slate-800 dark:text-slate-200 block">{item.reviewedBy}</span>
                                {item.reviewerRemarks && (
                                  <span className="text-[10px] text-slate-400 italic block">"{item.reviewerRemarks}"</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">Awaiting Sign</span>
                            )}
                          </td>

                          {isAdminOrDirector && (
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              {isPending ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleSingleApprove(item)}
                                    disabled={isProcessing}
                                    className="p-1.5 bg-[#03623c] hover:bg-[#024d2e] text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                                    title="Approve Request"
                                  >
                                    <Check className="w-3 h-3" />
                                    <span>Approve</span>
                                  </button>
                                  <button
                                    onClick={() => setRejectModalReq(item)}
                                    disabled={isProcessing}
                                    className="p-1.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                                    title="Reject Request"
                                  >
                                    <X className="w-3 h-3" />
                                    <span>Reject</span>
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[10px] font-mono text-slate-400 font-bold">Processed</span>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 bg-slate-50 dark:bg-[#0c1a14] rounded-2xl border border-dashed border-slate-200 dark:border-[#1e3a2f] p-8 text-slate-400">
              <CheckCircle2 className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
              <h4 className="text-base font-bold text-slate-700 dark:text-slate-300">
                {'No Requests Found for '}{monthName} {selectedYear}
              </h4>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                {'There are no attendance regularization or change requests logged for the selected filters. All employee records are verified and up-to-date.'}
              </p>
            </div>
          )}

          {/* Official Signatures & Verification Preview Section */}
          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-[#1e3a2f]">
            <h4 className="text-xs font-black uppercase font-mono tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#03623c]" />
              <span>{'Official Sign-off & Verification Certificates (Included in PDF)'}</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Box 1: Prepared & Verified By HR */}
              <div className="p-4 bg-slate-50 dark:bg-[#0c1a14] rounded-2xl border border-slate-200 dark:border-[#1e3a2f] space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1e3a2f] pb-2">
                  <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300">
                    {'1. Verified by HR'}
                  </span>
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                    {'Prepared'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {'Certified that all attendance regularizations have been cross-checked with biometric records and reason justifications.'}
                </p>
                <div className="pt-2 text-xs font-mono text-slate-700 dark:text-slate-300">
                  <div>Officer: <strong>{portalUser?.name || 'HR Department'}</strong></div>
                  <div>Status: <strong>Verified</strong></div>
                  <div className="mt-2 text-[10px] text-slate-400 border-t border-dashed pt-1">
                    Signature: __________________
                  </div>
                </div>
              </div>

              {/* Box 2: Recommended by Branch/Dept Head */}
              <div className="p-4 bg-slate-50 dark:bg-[#0c1a14] rounded-2xl border border-slate-200 dark:border-[#1e3a2f] space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1e3a2f] pb-2">
                  <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300">
                    {'2. Branch / Dept Head'}
                  </span>
                  <span className="text-[9px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                    {'Recommended'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {'Recommended for regularization and payroll calculation based on site duty and management approvals.'}
                </p>
                <div className="pt-2 text-xs font-mono text-slate-700 dark:text-slate-300">
                  <div>Department: <strong>{selectedDept === 'All' ? 'All Operations' : selectedDept}</strong></div>
                  <div>Recommendation: <strong>Approved</strong></div>
                  <div className="mt-2 text-[10px] text-slate-400 border-t border-dashed pt-1">
                    Signature: __________________
                  </div>
                </div>
              </div>

              {/* Box 3: Final Approval by Director */}
              <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 space-y-2">
                <div className="flex items-center justify-between border-b border-emerald-200 dark:border-emerald-900/60 pb-2">
                  <span className="text-[10px] font-black uppercase text-emerald-900 dark:text-emerald-200">
                    {'3. Director / Super Admin'}
                  </span>
                  <span className="text-[9px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-black">
                    {'Final Sanction'}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80">
                  {'Final approval and sanction accorded for inclusion in monthly payroll processing and bank salary disbursement.'}
                </p>
                <div className="pt-2 text-xs font-mono text-emerald-950 dark:text-emerald-200">
                  <div>Authority: <strong>Director / Managing Board</strong></div>
                  <div>Final Status: <strong>Sanctioned</strong></div>
                  <div className="mt-2 text-[10px] text-emerald-700 border-t border-dashed border-emerald-300 pt-1">
                    Director Seal & Sign: __________________
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-[#0c1a14] border-t border-slate-200 dark:border-[#1e3a2f] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Showing <strong className="text-slate-800 dark:text-slate-200">{filteredItems.length}</strong> records for <strong className="text-[#03623c] dark:text-emerald-400 font-mono">{monthName} {selectedYear}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPDF}
              className="bg-[#03623c] hover:bg-[#024d2e] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{'Download Official PDF'}</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 dark:bg-[#11221b] text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-300 transition-all cursor-pointer"
            >
              {'Close'}
            </button>
          </div>
        </div>

      </div>

      {/* Reject Modal */}
      {rejectModalReq && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-[#11221b] border border-slate-200 dark:border-[#1e3a2f] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">Reject Attendance Request</h4>
                <p className="text-xs text-slate-500">{rejectModalReq.employeeName} ({rejectModalReq.attendanceDate})</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Reason for Rejection:
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Discrepancy in biometric logs, manual verification failed..."
                value={rejectionRemarks}
                onChange={(e) => setRejectionRemarks(e.target.value)}
                className="w-full border border-slate-200 dark:border-[#1e3a2f] rounded-xl p-3 text-xs bg-white dark:bg-[#0b1812] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setRejectModalReq(null); setRejectionRemarks(''); }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={processingId === rejectModalReq.id}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
