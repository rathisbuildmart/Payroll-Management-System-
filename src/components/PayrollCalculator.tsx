import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, CreditCard, Check, Printer, FileText, DollarSign, Calculator, AlertCircle, Save, TrendingUp, Users, ArrowUpRight, ShieldCheck, ArrowDownRight, Landmark, Building, Sparkles, Filter, ChevronLeft, ChevronRight, RefreshCcw, FileDown, PlusCircle, Trash2, HelpCircle, Info, MessageSquare, ChevronDown, Banknote, FileSpreadsheet, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Employee, Attendance, PayrollRecord, OneTimeDeduction, AdminSettings, getCurrentBasicSalary } from '../types';
import { WhatsAppModal } from './WhatsAppModal';
import { parseGoogleDriveImageUrl } from '../utils/driveUtils';
import MasterAttendanceSalarySheetModal from './MasterAttendanceSalarySheetModal';

interface PayrollCalculatorProps {
  employees: Employee[];
  attendanceRecords: Attendance[];
  payrollRecords: PayrollRecord[];
  onSavePayroll: (records: PayrollRecord[]) => Promise<void>;
  onUpdateEmployees?: (updatedEmployees: Employee[]) => Promise<void>;
  language: 'en' | 'hi';
  adminSettings?: AdminSettings;
  portalUser?: any;
}

const MONTHS = [
  { name: 'January', hindi: 'जनवरी', value: '01' },
  { name: 'February', hindi: 'फरवरी', value: '02' },
  { name: 'March', hindi: 'मार्च', value: '03' },
  { name: 'April', hindi: 'अप्रैल', value: '04' },
  { name: 'May', hindi: 'मई', value: '05' },
  { name: 'June', hindi: 'जून', value: '06' },
  { name: 'July', hindi: 'जुलाई', value: '07' },
  { name: 'August', hindi: 'अगस्त', value: '08' },
  { name: 'September', hindi: 'सितंबर', value: '09' },
  { name: 'October', hindi: 'अक्टूबर', value: '10' },
  { name: 'November', hindi: 'नवंबर', value: '11' },
  { name: 'December', hindi: 'दिसंबर', value: '12' },
];

import { isAttendanceLate, isAttendanceEarlyGoing } from '../utils/shift';

export default function PayrollCalculator({ employees, attendanceRecords, payrollRecords, onSavePayroll, onUpdateEmployees, language, adminSettings, portalUser }: PayrollCalculatorProps) {
  const hasPermission = (action: 'view' | 'add' | 'edit' | 'delete') => {
    if (!portalUser) return true;
    if (portalUser.role === 'admin') return true;
    const permissions = adminSettings?.rolePermissions?.[portalUser.role] || [];
    if (permissions.includes('payroll')) return true;
    return permissions.includes(`payroll:${action}`);
  };
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string>(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [workingDays, setWorkingDays] = useState<number>(26);
  const [localPayroll, setLocalPayroll] = useState<PayrollRecord[]>([]);
  const [activePayslip, setActivePayslip] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmPayEmpId, setConfirmPayEmpId] = useState<string | null>(null);
  const [confirmPayAll, setConfirmPayAll] = useState<boolean>(false);

  // States for manual payroll adjustments modal
  const [editingRecord, setEditingRecord] = useState<PayrollRecord | null>(null);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [isMasterSheetOpen, setIsMasterSheetOpen] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'ledger' | 'refunds'>('ledger');

  // WhatsApp & Email modal state
  const [waModalOpen, setWaModalOpen] = useState(false);
  const [waRecipient, setWaRecipient] = useState<{ name: string; mobileNo?: string; email?: string }>({ name: '' });
  const [waCategory, setWaCategory] = useState<'payslip' | 'salaryDisbursed' | 'customNotice'>('payslip');
  const [waVars, setWaVars] = useState<Record<string, string | number | undefined>>({});

  // One-time deductions list and their monthly refund tracking
  const [oneTimeDeductions, setOneTimeDeductions] = useState<OneTimeDeduction[]>(() => {
    try {
      const saved = localStorage.getItem('payroll_one_time_deductions');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    // Pre-populate with beautiful standard demo data so the report lists items by default
    const defaultDeductions: OneTimeDeduction[] = [
      {
        id: 'REF001',
        employeeId: 'EMP001',
        type: 'Uniform',
        totalAmount: 3000,
        monthlyRefundInstallment: 500,
        refundedAmount: 1000,
        createdAt: '2026-04-10',
        status: 'Partially Refunded',
        description: 'Standard uniform deduction (Refunded in 6 parts)'
      },
      {
        id: 'REF002',
        employeeId: 'EMP002',
        type: 'Tour',
        totalAmount: 5000,
        monthlyRefundInstallment: 1000,
        refundedAmount: 5000,
        createdAt: '2026-02-15',
        status: 'Fully Refunded',
        description: 'Tour allowance initial one-time charge (Refunded in 5 parts)'
      },
      {
        id: 'REF003',
        employeeId: 'EMP003',
        type: 'Uniform',
        totalAmount: 3000,
        monthlyRefundInstallment: 600,
        refundedAmount: 0,
        createdAt: '2026-07-01',
        status: 'Pending',
        description: 'Factory protective gear charge'
      }
    ];
    localStorage.setItem('payroll_one_time_deductions', JSON.stringify(defaultDeductions));
    return defaultDeductions;
  });

  // Track the deductions in localStorage on updates
  useEffect(() => {
    localStorage.setItem('payroll_one_time_deductions', JSON.stringify(oneTimeDeductions));
  }, [oneTimeDeductions]);

  // Form states for creating new one-time deduction & refund plans
  const [newDeductEmpId, setNewDeductEmpId] = useState('');
  const [newDeductType, setNewDeductType] = useState<'Uniform' | 'Tour' | 'Other'>('Uniform');
  const [newDeductTotal, setNewDeductTotal] = useState<number>(3000);
  const [newDeductInstallment, setNewDeductInstallment] = useState<number>(500);
  const [newDeductDesc, setNewDeductDesc] = useState('');

  // Filters state
  const [selectedBranch, setSelectedBranch] = useState('All');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('All');
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<'All' | 'Bank Transfer' | 'Cash' | 'Cheque'>('All');
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
      name: emp.isActive !== false ? `${emp.name} (${emp.id})` : `${emp.name} (${emp.id}) - ${language === 'en' ? 'Inactive' : 'निष्क्रिय'}`
    }));
  }, [employees, language]);

  // Compute filtered payroll list
  const filteredPayroll = useMemo(() => {
    return localPayroll.filter(record => {
      const emp = employees.find(e => e.id === record.employeeId);
      if (!emp) return false;
      const matchesBranch = selectedBranch === 'All' || emp.branch === selectedBranch;
      const matchesDept = selectedDept === 'All' || emp.department === selectedDept;
      const matchesEmployee = selectedEmployeeId === 'All' || emp.id === selectedEmployeeId;
      const empMode = emp.paymentMethod || 'Bank Transfer';
      const matchesPaymentMode = selectedPaymentMode === 'All' || empMode === selectedPaymentMode;
      return matchesBranch && matchesDept && matchesEmployee && matchesPaymentMode;
    });
  }, [localPayroll, employees, selectedBranch, selectedDept, selectedEmployeeId, selectedPaymentMode]);

  // Calculate payment mode breakdown statistics
  const paymentSummary = useMemo(() => {
    let bankTotal = 0, bankCount = 0;
    let cashTotal = 0, cashCount = 0;
    let chequeTotal = 0, chequeCount = 0;

    filteredPayroll.forEach(rec => {
      const emp = employees.find(e => e.id === rec.employeeId);
      const mode = emp?.paymentMethod || 'Bank Transfer';
      const amt = rec.netSalary !== undefined ? rec.netSalary : (rec.totalSalary || 0);

      if (mode === 'Cash') {
        cashTotal += amt;
        cashCount += 1;
      } else if (mode === 'Cheque') {
        chequeTotal += amt;
        chequeCount += 1;
      } else {
        bankTotal += amt;
        bankCount += 1;
      }
    });

    return {
      bankTotal, bankCount,
      cashTotal, cashCount,
      chequeTotal, chequeCount,
      grandTotal: bankTotal + cashTotal + chequeTotal,
      totalCount: filteredPayroll.length
    };
  }, [filteredPayroll, employees]);

  const paginatedPayroll = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPayroll.slice(start, start + pageSize);
  }, [filteredPayroll, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredPayroll.length / pageSize) || 1;

  const activeEmployees = employees.filter(e => e.isActive);
  const selectedMonthYear = `${selectedYear}-${selectedMonth}`;

  // Unified Payroll Calculation Engine (Supports HRA, DA, Conveyance, PF, ESIC, PT, TDS, Advances & Leaves)
  const calculateSingleEmployeePayroll = (emp: Employee, overrideRecord?: Partial<PayrollRecord>): PayrollRecord => {
    const empAtt = attendanceRecords.filter(r => r.employeeId === emp.id && r.date.startsWith(selectedMonthYear));
    
    const daysPresent = empAtt.filter(r => r.status === 'Present' || (r.status === 'Miss Punch' && r.approvalStatus === 'Approved')).length;
    const daysHalfDay = empAtt.filter(r => r.status === 'Half Day').length;
    const daysLeave = empAtt.filter(r => r.status === 'Leave').length; // Paid Leave
    const daysMissPunch = empAtt.filter(r => r.status === 'Miss Punch' && r.approvalStatus !== 'Approved').length;
    
    // Compute pro-rated earned basic (Miss punches or pending aren't fully counted unless approved, keeping simple)
    // Check if Paid Leave is applicable for this employee based on Policy & service tenure at payroll month
    const joinDate = emp.joiningDate ? new Date(emp.joiningDate) : null;
    let isEligibleForPaidLeave = adminSettings?.enablePaidLeaveCalculation !== false && emp.isPaidLeaveApplicable !== false;
    
    if (isEligibleForPaidLeave && joinDate) {
      const payYear = Number(selectedYear);
      const payMonth = Number(selectedMonth) - 1; // 0-indexed
      const diffMonths = (payYear - joinDate.getFullYear()) * 12 + (payMonth - joinDate.getMonth());
      const probationMonths = adminSettings?.paidLeaveStartAfterMonths || 0;
      if (diffMonths < probationMonths) {
        isEligibleForPaidLeave = false;
      }
    }

    const actualPaidLeaves = isEligibleForPaidLeave ? daysLeave : 0;
    const workedDaysVal = daysPresent + (0.5 * daysHalfDay) + actualPaidLeaves;
    const earnedRatio = Math.min(1, workedDaysVal / workingDays);
    const currentEmpBasic = getCurrentBasicSalary(emp);
    const earnedBasic = Math.round(currentEmpBasic * (workedDaysVal === 0 ? 0 : earnedRatio));

    // Overtime
    const overtimeHoursTotal = empAtt.reduce((sum, curr) => sum + (curr.overtimeHours || 0), 0);
    const overtimePay = Math.round(overtimeHoursTotal * (emp.hourlyRate || 150));

    // Base default structures from employee profile or Indian standards (conditional on adminSettings and employee-specific toggles)
    const defaultHra = (adminSettings?.enableHra !== false && emp.isHraApplicable !== false)
      ? (emp.hra !== undefined && emp.hra > 0 ? emp.hra : Math.round(currentEmpBasic * 0.40))
      : 0;
    const defaultDa = (adminSettings?.enableDa !== false && emp.isDaApplicable !== false)
      ? (emp.da !== undefined && emp.da > 0 ? emp.da : Math.round(currentEmpBasic * 0.10))
      : 0;
    const defaultConveyance = (adminSettings?.enableConveyance !== false && emp.isConveyanceApplicable !== false)
      ? (emp.conveyanceAllowance !== undefined && emp.conveyanceAllowance > 0 ? emp.conveyanceAllowance : (currentEmpBasic > 25000 ? 1600 : 800))
      : 0;
    const defaultAdvanceDeduction = emp.advanceSalaryDeduction !== undefined && emp.advanceSalaryDeduction > 0 ? Math.min(emp.advanceSalaryBalance || 0, emp.advanceSalaryDeduction) : 0;

    // Compute late coming and early going fine: 5 min grace, 3 free days, ₹100/day after
    let lateEarlyDaysCount = 0;
    const activeAtt = empAtt.filter(r => r.status === 'Present' || r.status === 'Half Day');
    activeAtt.forEach(r => {
      const isLate = isAttendanceLate(r, emp.workTiming, adminSettings?.defaultCheckIn || "09:00");
      const isEarly = isAttendanceEarlyGoing(r, emp.workTiming, adminSettings?.defaultCheckOut || "18:00");
      if (isLate || isEarly) {
        lateEarlyDaysCount++;
      }
    });
    const attendanceFine = Math.max(0, lateEarlyDaysCount - 3) * 100;

    // Compute monthly wise part-part refund of one-time deductions (e.g. Uniform / Tour)
    const activeRefunds = oneTimeDeductions.filter(d => d.employeeId === emp.id && d.status !== 'Fully Refunded');
    const computedRefundAmount = activeRefunds.reduce((sum, d) => sum + Math.min(d.monthlyRefundInstallment, d.totalAmount - d.refundedAmount), 0);
    const oneTimeRefundAmount = overrideRecord?.oneTimeRefundAmount !== undefined ? overrideRecord.oneTimeRefundAmount : computedRefundAmount;

    // Use current overrides or default values
    const hra = overrideRecord?.hra !== undefined ? overrideRecord.hra : defaultHra;
    const da = overrideRecord?.da !== undefined ? overrideRecord.da : defaultDa;
    const conveyanceAllowance = overrideRecord?.conveyanceAllowance !== undefined ? overrideRecord.conveyanceAllowance : defaultConveyance;
    const festivalBonus = overrideRecord?.festivalBonus !== undefined ? overrideRecord.festivalBonus : 0;
    const performanceIncentive = overrideRecord?.performanceIncentive !== undefined ? overrideRecord.performanceIncentive : 0;
    const leaveAdjustment = overrideRecord?.leaveAdjustment !== undefined ? overrideRecord.leaveAdjustment : 0;
    const advanceDeduction = overrideRecord?.advanceDeduction !== undefined ? overrideRecord.advanceDeduction : defaultAdvanceDeduction;

    // Prorate standard HRA/DA/Conveyance based on attendance ratio (standard practice) or keep fixed?
    // Let's keep HRA/DA/Conveyance fixed/monthly full, but pro-rate Basic (very common to prevent penalizing allowances, or we can proration, let's keep them fully paid as configured)
    const standardAllowancesTotal = emp.allowances;
    const customAllowancesTotal = hra + da + conveyanceAllowance;
    const grossSalary = earnedBasic + standardAllowancesTotal + customAllowancesTotal + overtimePay + festivalBonus + performanceIncentive + leaveAdjustment + oneTimeRefundAmount;

    // PF contribution: 12% of pro-rated basic salary (conditional on employee-specific toggle)
    const providentFund = emp.isPfApplicable !== false ? Math.round(earnedBasic * 0.12) : 0;

    // ESIC contribution: 0.75% of Gross Salary if gross is <= 21,000 INR (conditional on employee-specific toggle)
    const esic = emp.isEsicApplicable !== false ? (grossSalary <= 21000 ? Math.round(grossSalary * 0.0075) : 0) : 0;

    // Professional Tax (PT): ₹200 if Gross >= 10000 INR (conditional on adminSettings and employee-specific toggle)
    const professionalTax = (emp.isPtApplicable !== false && adminSettings?.enableProfessionalTax !== false) 
      ? (grossSalary >= 10000 ? 200 : 0)
      : 0;

    // Indian Income Tax TDS (Estimated Bracket based on annual projected Gross)
    const annualEstGross = grossSalary * 12;
    let computedTds = 0;
    if (annualEstGross > 700000) {
      if (annualEstGross <= 1000000) {
        computedTds = Math.round(((annualEstGross - 700000) * 0.05) / 12);
      } else if (annualEstGross <= 1200000) {
        computedTds = Math.round((15000 + (annualEstGross - 1000000) * 0.10) / 12);
      } else {
        computedTds = Math.round((35000 + (annualEstGross - 1200000) * 0.15) / 12);
      }
    }

    const finalTds = overrideRecord?.tds !== undefined ? overrideRecord.tds : computedTds;
    const finalPt = overrideRecord?.professionalTax !== undefined ? overrideRecord.professionalTax : professionalTax;
    const finalPf = overrideRecord?.providentFund !== undefined ? overrideRecord.providentFund : providentFund;
    const finalEsic = overrideRecord?.esic !== undefined ? overrideRecord.esic : esic;

    // Statutory deductions total
    const statutoryDeductionsTotal = finalPf + finalEsic + finalPt + finalTds;
    
    // Total standard and custom deductions including attendance fine
    const totalDeductions = emp.deductions + statutoryDeductionsTotal + attendanceFine;

    // Net Payable = Gross - Deductions - Advance repaid
    const netSalary = Math.max(0, grossSalary - totalDeductions - advanceDeduction);

    return {
      monthYear: selectedMonthYear,
      employeeId: emp.id,
      basicSalary: getCurrentBasicSalary(emp),
      allowances: standardAllowancesTotal + customAllowancesTotal + festivalBonus + performanceIncentive + leaveAdjustment + oneTimeRefundAmount,
      deductions: totalDeductions,
      overtimePay,
      totalSalary: grossSalary, // Gross Salary
      paymentDate: overrideRecord?.paymentDate || '',
      paymentStatus: overrideRecord?.paymentStatus || 'Pending',

      // Detailed breakdown fields saved in metadata
      hra,
      da,
      conveyanceAllowance,
      festivalBonus,
      performanceIncentive,
      leaveAdjustment,
      advanceDeduction,
      tds: finalTds,
      professionalTax: finalPt,
      providentFund: finalPf,
      esic: finalEsic,
      netSalary,
      oneTimeRefundAmount,
      lateEarlyDays: lateEarlyDaysCount,
      attendanceFine,
    };
  };

  // 1. PDF Payslip Generation using jspdf
  const downloadPayslipPDF = (record: PayrollRecord, emp: any) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const navyColor = [15, 23, 42]; // Slate-900 theme
    const goldColor = [16, 185, 129]; // Emerald-500
    const lightGray = [248, 250, 252]; // Slate-50 background
    
    // Header banner
    doc.setFillColor(navyColor[0], navyColor[1], navyColor[2]);
    doc.rect(0, 0, 210, 18, 'F');
    
    // Header Text
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('RATHI BUILD MART - PAYSLIP', 105, 11, { align: 'center' });

    // Company address
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.setFont('Helvetica', 'normal');
    doc.text('Headquarters: NH-6, Rathi Estate, Raipur, Chhattisgarh, India', 105, 24, { align: 'center' });
    doc.text(`Salary Slip for the Pay Period: ${record.monthYear}`, 105, 28, { align: 'center' });

    // Separator line
    doc.setDrawColor(226, 232, 240);
    doc.line(10, 32, 200, 32);

    // Section 1: Employee metadata
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(navyColor[0], navyColor[1], navyColor[2]);
    doc.text('EMPLOYEE DETAILS', 10, 39);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    
    // Column 1
    doc.text(`Employee ID: ${record.employeeId}`, 10, 45);
    doc.text(`Employee Name: ${emp?.name || 'N/A'}`, 10, 50);
    doc.text(`Designation: ${emp?.designation || 'N/A'}`, 10, 55);
    doc.text(`Department: ${emp?.department || 'N/A'}`, 10, 60);
    doc.text(`Joining Date: ${emp?.joiningDate || 'N/A'}`, 10, 65);

    // Column 2
    doc.text(`Bank Account No: ${emp?.bankAccountNo || 'N/A'}`, 110, 45);
    doc.text(`Bank Name: ${emp?.bankName || 'N/A'}`, 110, 50);
    doc.text(`IFSC Code: ${emp?.ifscCode || 'N/A'}`, 110, 55);
    doc.text(`PAN Number: ${emp?.panNo || 'N/A'}`, 110, 60);
    doc.text(`UAN / PF Number: ${emp?.uan || emp?.pfAccountNo || 'N/A'}`, 110, 65);

    doc.line(10, 70, 200, 70);

    // Attendance Overview
    const empAtt = attendanceRecords.filter(r => r.employeeId === record.employeeId && r.date.startsWith(selectedMonthYear));
    const daysPresent = empAtt.filter(r => r.status === 'Present' || (r.status === 'Miss Punch' && r.approvalStatus === 'Approved')).length;
    const daysHalfDay = empAtt.filter(r => r.status === 'Half Day').length;
    const daysLeave = empAtt.filter(r => r.status === 'Leave').length;
    const daysAbsent = empAtt.filter(r => r.status === 'Absent').length;
    const workedDays = daysPresent + (0.5 * daysHalfDay) + daysLeave;
    const overtimeHoursTotal = empAtt.reduce((sum, curr) => sum + (curr.overtimeHours || 0), 0);
    
    doc.setFont('Helvetica', 'bold');
    doc.text('ATTENDANCE RECORD', 10, 76);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Calendar Days: ${workingDays} Days`, 10, 81);
    doc.text(`Days Present: ${daysPresent} Days`, 55, 81);
    doc.text(`Paid Leaves: ${daysLeave} Days`, 105, 81);
    doc.text(`Effective Worked: ${workedDays} Days`, 155, 81);

    doc.line(10, 85, 200, 85);

    // Header of breakdown table
    doc.setFillColor(navyColor[0], navyColor[1], navyColor[2]);
    doc.rect(10, 90, 90, 7, 'F');
    doc.rect(110, 90, 90, 7, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('SALARY ALLOWANCES (EARNINGS)', 15, 95);
    doc.text('AMOUNT (₹)', 80, 95);
    doc.text('STATUTORY DEDUCTIONS', 115, 95);
    doc.text('AMOUNT (₹)', 180, 95);

    // Custom allowances/deductions values
    const hra = record.hra !== undefined ? record.hra : Math.round(record.basicSalary * 0.40);
    const da = record.da !== undefined ? record.da : 0;
    const conv = record.conveyanceAllowance !== undefined ? record.conveyanceAllowance : 0;
    const festBonus = record.festivalBonus !== undefined ? record.festivalBonus : 0;
    const perfInc = record.performanceIncentive !== undefined ? record.performanceIncentive : 0;
    const leaveAdj = record.leaveAdjustment !== undefined ? record.leaveAdjustment : 0;
    const standardAllowances = emp?.allowances || 0;

    const pf = record.providentFund !== undefined ? record.providentFund : Math.round(record.basicSalary * 0.12);
    const esic = record.esic !== undefined ? record.esic : 0;
    const pt = record.professionalTax !== undefined ? record.professionalTax : 0;
    const tds = record.tds !== undefined ? record.tds : 0;
    const advDec = record.advanceDeduction !== undefined ? record.advanceDeduction : 0;
    const standardDeductions = emp?.deductions || 0;

    const earnings = [
      { name: 'Basic Pay (Earned)', amount: record.basicSalary },
      { name: 'House Rent Allowance (HRA)', amount: hra },
      { name: 'Dearness Allowance (DA)', amount: da },
      { name: 'Conveyance Allowance', amount: conv },
      { name: 'Standard Allowances', amount: standardAllowances },
      { name: 'Overtime Earnings', amount: record.overtimePay },
      { name: 'Festival / Diwali Bonus', amount: festBonus },
      { name: 'Performance Incentives', amount: perfInc },
      { name: 'CL/EL Leave Adjustment', amount: leaveAdj },
    ];

    const deductions = [
      { name: 'Provident Fund (PF 12%)', amount: pf },
      { name: 'Employee State Insur (ESIC)', amount: esic },
      { name: 'Professional Tax (PT)', amount: pt },
      { name: 'Income Tax (TDS)', amount: tds },
      { name: 'Advance Outstanding Repay', amount: advDec },
      { name: 'Other Deductions', amount: standardDeductions },
    ];

    const maxLength = Math.max(earnings.length, deductions.length);
    let currentY = 102;
    doc.setTextColor(51, 65, 85);
    doc.setFont('Helvetica', 'normal');

    for (let i = 0; i < maxLength; i++) {
      const earn = earnings[i];
      const deduct = deductions[i];

      // Alternating row styling
      if (i % 2 === 0) {
        doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
        if (earn) doc.rect(10, currentY - 3, 90, 5, 'F');
        if (deduct) doc.rect(110, currentY - 3, 90, 5, 'F');
      }

      if (earn) {
        doc.text(earn.name, 15, currentY);
        doc.text(`Rs. ${earn.amount.toLocaleString('en-IN')}`, 80, currentY);
      }

      if (deduct) {
        doc.text(deduct.name, 115, currentY);
        doc.text(`Rs. ${deduct.amount.toLocaleString('en-IN')}`, 180, currentY);
      }

      currentY += 5;
    }

    // Dividers
    doc.line(10, currentY, 200, currentY);
    currentY += 5;
    doc.setFont('Helvetica', 'bold');
    
    const grossSalary = earnings.reduce((sum, e) => sum + e.amount, 0);
    const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
    const netSalaryPay = Math.max(0, grossSalary - totalDeductions);

    doc.text('GROSS SALARY:', 15, currentY);
    doc.text(`Rs. ${grossSalary.toLocaleString('en-IN')}`, 80, currentY);
    
    doc.text('TOTAL DEDUCTIONS:', 115, currentY);
    doc.text(`Rs. ${totalDeductions.toLocaleString('en-IN')}`, 180, currentY);

    currentY += 8;
    // Draw Net Payout Highlights Block
    doc.setFillColor(241, 245, 249);
    doc.rect(10, currentY - 4, 190, 8, 'F');
    doc.setTextColor(2, 24, 16);
    doc.setFontSize(9.5);
    doc.text('NET SALARY DISBURSED:', 15, currentY);
    doc.text(`Rs. ${netSalaryPay.toLocaleString('en-IN')}  /-  (Rupees Only)`, 110, currentY);

    currentY += 15;
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7.5);
    doc.setFont('Helvetica', 'normal');
    doc.text('This is a computer-generated salary statement certificate synced securely to company Google Drive ledger and does not require a physical stamp.', 10, currentY);

    currentY += 14;
    doc.line(10, currentY, 50, currentY);
    doc.line(150, currentY, 190, currentY);
    currentY += 4;
    doc.text('Employee Signature', 20, currentY);
    doc.text('Authorized Signatory', 160, currentY);

    doc.save(`Payslip_${emp?.name?.replace(/\s+/g, '_') || 'Employee'}_${record.monthYear}.pdf`);
  };

  // Helper: Convert Amount Number to Words in Indian English
  const numberToWordsINR = (num: number): string => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const strNum = Math.floor(Math.abs(num)).toString();
    if (strNum.length > 9) return `Rs. ${num.toLocaleString('en-IN')}`;
    const n = ('000000000' + strNum).slice(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return `Rs. ${num.toLocaleString('en-IN')}`;
    let str = '';
    str += (Number(n[1]) !== 0) ? (a[Number(n[1])] || b[Number(n[1][0])] + ' ' + a[Number(n[1][1])]) + 'Lakh ' : '';
    str += (Number(n[2]) !== 0) ? (a[Number(n[2])] || b[Number(n[2][0])] + ' ' + a[Number(n[2][1])]) + 'Thousand ' : '';
    str += (Number(n[3]) !== 0) ? (a[Number(n[3])] || b[Number(n[3][0])] + ' ' + a[Number(n[3][1])]) + 'Hundred ' : '';
    str += (Number(n[4]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[4])] || b[Number(n[4][0])] + ' ' + a[Number(n[4][1])]) : '';
    str += (Number(n[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[Number(n[5][0])] + ' ' + a[Number(n[5][1])]) : '';
    return str.trim() ? str.trim() + ' Rupees Only' : 'Zero Rupees';
  };

  // 2. Bank Bulk Upload CSV Format Generator (HDFC, SBI, ICICI) - Exports ONLY Bank Transfer Employees
  const handleBankExport = (bank: 'SBI' | 'HDFC' | 'ICICI') => {
    let headers: string[] = [];
    let rows: string[][] = [];
    
    const bankRecords = localPayroll.filter(rec => {
      const emp = employees.find(e => e.id === rec.employeeId);
      const mode = emp?.paymentMethod || 'Bank Transfer';
      return mode === 'Bank Transfer';
    });

    if (bankRecords.length === 0) {
      alert(language === 'en' ? 'No Bank Transfer mode employees found in current payroll.' : 'वर्तमान पेरोल में कोई बैंक ट्रांसफ़र मोड वाला कर्मचारी नहीं मिला।');
      return;
    }

    bankRecords.forEach((rec, idx) => {
      const emp = employees.find(e => e.id === rec.employeeId);
      const accNo = emp?.bankAccountNo || '';
      const name = emp?.bankAccountHolderName || emp?.name || 'Unknown';
      const ifsc = emp?.ifscCode || '';
      const amount = rec.netSalary !== undefined ? rec.netSalary : rec.totalSalary;

      if (bank === 'SBI') {
        if (idx === 0) {
          headers = ['Serial No', 'Beneficiary Name', 'Account Number', 'Amount (INR)', 'IFSC Code', 'Transaction Type'];
        }
        rows.push([
          String(idx + 1),
          `"${name}"`,
          `"${accNo}"`,
          String(amount),
          `"${ifsc}"`,
          'NEFT'
        ]);
      } else if (bank === 'HDFC') {
        if (idx === 0) {
          headers = ['Beneficiary Account Number', 'Amount', 'Beneficiary Name', 'IFSC Code', 'Remarks'];
        }
        rows.push([
          `"${accNo}"`,
          String(amount),
          `"${name}"`,
          `"${ifsc}"`,
          `Salary_${selectedMonthYear}`
        ]);
      } else if (bank === 'ICICI') {
        if (idx === 0) {
          headers = ['Payment Mode', 'Beneficiary Name', 'Beneficiary Account Number', 'Amount', 'IFSC', 'Remarks'];
        }
        rows.push([
          'NEFT',
          `"${name}"`,
          `"${accNo}"`,
          String(amount),
          `"${ifsc}"`,
          `Salary_${selectedMonthYear}`
        ]);
      }
    });

    if (rows.length === 0) {
      alert('No payroll data to export.');
      return;
    }

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${bank}_Bulk_Salary_Disbursal_${selectedMonthYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 3. Cash Disbursal Advice Report Generator (.csv) - Exports ONLY Cash Payment Employees
  const handleCashExport = () => {
    const cashRecords = localPayroll.filter(rec => {
      const emp = employees.find(e => e.id === rec.employeeId);
      return emp?.paymentMethod === 'Cash';
    });

    if (cashRecords.length === 0) {
      alert(language === 'en' ? 'No Cash payment mode employees found in current payroll.' : 'वर्तमान पेरोल में कोई नकद भुगतान वाला कर्मचारी नहीं मिला।');
      return;
    }

    const headers = ['S.No', 'Employee ID', 'Employee Name', 'Department', 'Designation', 'Mobile No', 'Basic Salary (INR)', 'Allowances (INR)', 'Deductions (INR)', 'Overtime Pay (INR)', 'Net Cash Payable (INR)', 'Payment Status', 'Cash Received Signature'];
    const rows: string[][] = [];

    cashRecords.forEach((rec, idx) => {
      const emp = employees.find(e => e.id === rec.employeeId);
      const amount = rec.netSalary !== undefined ? rec.netSalary : rec.totalSalary;
      rows.push([
        String(idx + 1),
        `"${rec.employeeId}"`,
        `"${emp?.name || ''}"`,
        `"${emp?.department || ''}"`,
        `"${emp?.designation || ''}"`,
        `"${emp?.mobileNo || emp?.personalMobileNo || ''}"`,
        String(rec.basicSalary || 0),
        String(rec.allowances || 0),
        String(rec.deductions || 0),
        String(rec.overtimePay || 0),
        String(amount),
        `"${rec.paymentStatus}"`,
        '""'
      ]);
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Cash_Salary_Disbursal_Report_${selectedMonthYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 4. Combined Master Payroll Sheet Generator (.csv) - Exports ALL Modes (Bank + Cash + Cheque)
  const handleCombinedExport = () => {
    if (localPayroll.length === 0) {
      alert(language === 'en' ? 'No payroll records available to export.' : 'निर्यात करने के लिए कोई पेरोल रिकॉर्ड उपलब्ध नहीं है।');
      return;
    }

    const headers = [
      'S.No', 
      'Employee ID', 
      'Employee Name', 
      'Department', 
      'Designation', 
      'Payment Method', 
      'Bank Account No', 
      'IFSC Code', 
      'Basic Salary (INR)', 
      'Allowances (INR)', 
      'Deductions (INR)', 
      'Overtime Pay (INR)', 
      'Net Salary Payable (INR)', 
      'Payment Status', 
      'Payment Date'
    ];

    const rows: string[][] = [];

    localPayroll.forEach((rec, idx) => {
      const emp = employees.find(e => e.id === rec.employeeId);
      const mode = emp?.paymentMethod || 'Bank Transfer';
      const amount = rec.netSalary !== undefined ? rec.netSalary : rec.totalSalary;
      rows.push([
        String(idx + 1),
        `"${rec.employeeId}"`,
        `"${emp?.name || ''}"`,
        `"${emp?.department || ''}"`,
        `"${emp?.designation || ''}"`,
        `"${mode}"`,
        `"${emp?.bankAccountNo || '-'}"`,
        `"${emp?.ifscCode || '-'}"`,
        String(rec.basicSalary || 0),
        String(rec.allowances || 0),
        String(rec.deductions || 0),
        String(rec.overtimePay || 0),
        String(amount),
        `"${rec.paymentStatus}"`,
        `"${rec.paymentDate || 'Pending'}"`
      ]);
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Combined_Payroll_Master_Report_${selectedMonthYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 5. PDF Cash Disbursal Payment Voucher Generator
  const handleCashVoucherPDF = (singleRec?: PayrollRecord) => {
    const recordsToPrint = singleRec 
      ? [singleRec] 
      : localPayroll.filter(rec => {
          const emp = employees.find(e => e.id === rec.employeeId);
          return emp?.paymentMethod === 'Cash';
        });

    if (recordsToPrint.length === 0) {
      alert(language === 'en' ? 'No cash payment mode records found.' : 'कोई नकद भुगतान मोड वाला रिकॉर्ड नहीं मिला।');
      return;
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    recordsToPrint.forEach((rec, idx) => {
      if (idx > 0) doc.addPage();
      const emp = employees.find(e => e.id === rec.employeeId);
      const amount = rec.netSalary !== undefined ? rec.netSalary : rec.totalSalary;

      // Header Banner
      doc.setFillColor(3, 98, 60);
      doc.rect(10, 10, 190, 22, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('RATHI BUILD MART - CASH PAYMENT VOUCHER', 105, 19, { align: 'center' });
      doc.setFontSize(9);
      doc.setFont('Helvetica', 'normal');
      doc.text(`Voucher Ref: CASH-PAY-${selectedMonthYear}-${rec.employeeId}`, 105, 26, { align: 'center' });

      let startY = 40;

      // Voucher details box
      doc.setDrawColor(203, 213, 225);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(10, startY, 190, 36, 2, 2, 'FD');

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(10);
      doc.setFont('Helvetica', 'bold');
      doc.text(`Employee Name: ${emp?.name || 'N/A'}`, 15, startY + 8);
      doc.text(`Employee ID: ${rec.employeeId}`, 120, startY + 8);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Department: ${emp?.department || 'N/A'}`, 15, startY + 16);
      doc.text(`Designation: ${emp?.designation || 'N/A'}`, 120, startY + 16);
      doc.text(`Payroll Month: ${selectedMonthYear}`, 15, startY + 24);
      doc.text(`Payment Mode: CASH DISBURSAL`, 120, startY + 24);
      doc.text(`Mobile: ${emp?.mobileNo || emp?.personalMobileNo || 'N/A'}`, 15, startY + 32);
      doc.text(`Disbursal Date: ${rec.paymentDate || new Date().toISOString().split('T')[0]}`, 120, startY + 32);

      startY += 44;

      // Salary components box
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(10, startY, 190, 40, 2, 2, 'FD');

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text('PAYROLL COMPUTATION BREAKDOWN', 15, startY + 8);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Basic Pay: Rs. ${(rec.basicSalary || 0).toLocaleString('en-IN')}`, 15, startY + 16);
      doc.text(`Allowances & Bonus: Rs. ${(rec.allowances || 0).toLocaleString('en-IN')}`, 15, startY + 23);
      doc.text(`Overtime Pay: Rs. ${(rec.overtimePay || 0).toLocaleString('en-IN')}`, 15, startY + 30);

      doc.text(`Deductions / Advances: Rs. ${(rec.deductions || 0).toLocaleString('en-IN')}`, 110, startY + 16);
      doc.text(`Payment Status: ${rec.paymentStatus}`, 110, startY + 23);

      startY += 48;

      // Net Amount Disbursed Highlight Box
      doc.setFillColor(236, 253, 245);
      doc.setDrawColor(16, 185, 129);
      doc.roundedRect(10, startY, 190, 18, 2, 2, 'FD');

      doc.setTextColor(6, 78, 59);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(`TOTAL NET CASH DISBURSED: Rs. ${amount.toLocaleString('en-IN')} /-`, 15, startY + 8);
      doc.setFontSize(9);
      doc.setFont('Helvetica', 'normal');
      doc.text(`Amount in Words: ${numberToWordsINR(amount)}`, 15, startY + 14);

      startY += 26;

      // Denomination Memo Box
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(10, startY, 190, 28, 2, 2, 'FD');
      doc.setTextColor(30, 41, 59);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text('CASH CURRENCY DENOMINATION MEMO (FOR OFFICE USE)', 15, startY + 6);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('Rs. 500 x ______ = ______    |    Rs. 200 x ______ = ______    |    Rs. 100 x ______ = ______', 15, startY + 13);
      doc.text('Rs. 50   x ______ = ______    |    Rs. 20   x ______ = ______    |    Coins / Change  = ______', 15, startY + 20);

      startY += 38;

      // Signature section
      doc.setDrawColor(148, 163, 184);
      doc.line(15, startY + 20, 75, startY + 20);
      doc.line(130, startY + 20, 185, startY + 20);

      doc.setFontSize(8.5);
      doc.setFont('Helvetica', 'bold');
      doc.text('Employee Signature (Cash Received)', 18, startY + 25);
      doc.text('Cashier / Authorized Signatory', 133, startY + 25);

      doc.setFontSize(7.5);
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('I hereby acknowledge receipt of the above net salary amount in cash in full and final settlement for the month.', 15, startY + 32);
    });

    doc.save(`Cash_Payment_Vouchers_${selectedMonthYear}.pdf`);
  };

  // 3. Historical Annual Financial Summary Data Loader
  const getAnnualAnalytics = () => {
    const monthsGrouped: { [key: string]: { gross: number; net: number; pf: number; esic: number; tds: number; pt: number; count: number } } = {};
    
    payrollRecords.forEach(p => {
      const my = p.monthYear;
      if (!monthsGrouped[my]) {
        monthsGrouped[my] = { gross: 0, net: 0, pf: 0, esic: 0, tds: 0, pt: 0, count: 0 };
      }
      monthsGrouped[my].gross += p.totalSalary || 0;
      monthsGrouped[my].net += p.netSalary !== undefined ? p.netSalary : p.totalSalary;
      monthsGrouped[my].pf += p.providentFund || 0;
      monthsGrouped[my].esic += p.esic || 0;
      monthsGrouped[my].tds += p.tds || 0;
      monthsGrouped[my].pt += p.professionalTax || 0;
      monthsGrouped[my].count += 1;
    });

    return Object.entries(monthsGrouped).map(([monthYear, data]) => ({
      monthYear,
      ...data
    })).sort((a, b) => a.monthYear.localeCompare(b.monthYear));
  };

  const t = {
    en: {
      title: "Salary slips & Payroll",
      selectMonth: "Select Payroll Month",
      year: "Year",
      month: "Month",
      workingDays: "Total Working Days",
      calculateBtn: "Recalculate Sheet",
      saveBtn: "Save & Sync Payroll",
      saving: "Saving Payroll...",
      markAllPaid: "Mark All Paid",
      colEmp: "Employee",
      colAttendance: "Attendance Info",
      colSalary: "Earnings & Deducts",
      colOvertime: "Overtime Pay",
      colTotal: "Net Salary",
      colStatus: "Payment Status",
      colAction: "Payslip / Actions",
      paid: "Paid",
      pending: "Pending",
      markPaidBtn: "Mark Paid",
      payslipBtn: "Payslip",
      noRecords: "No attendance or payroll records found for this period. Mark attendance first, then compute.",
      savedSuccess: "Payroll records saved to Google Sheets!",
      confirmPay: "Mark Rajesh's salary as paid?",
      confirmAllPay: "Are you sure you want to mark ALL pending payroll records for this month as paid?",
      payslipHeader: "EMPLOYEE SALARY SLIP",
      payslipTitle: "Payroll Management System",
      payslipMonth: "Salary Month/Year",
      payslipEmpDetails: "Employee Details",
      empId: "ID",
      empName: "Name",
      empDept: "Department",
      empRole: "Designation",
      joiningDate: "Joining Date",
      paymentMethod: "Payment Method",
      slipEarnings: "Earnings (क्र. संख्या)",
      slipDeductions: "Deductions (क्र. संख्या)",
      basicPay: "Basic Salary",
      allowance: "Allowances",
      overtime: "Overtime Pay",
      earnedBasic: "Earned Basic",
      deducts: "Total Deductions",
      netPayable: "Net Payable Amount",
      authorizedSign: "Authorized Signatory",
      receiptSign: "Employee Signature",
      attendanceBreakdown: "Attendance Breakdown",
      attPresent: "Present",
      attHalf: "Half Day",
      attAbsent: "Absent",
      attLeave: "Leave",
      printSlip: "Print Payslip",
      closeSlip: "Close"
    },
    hi: {
      title: "वेतन और पेरोल",
      selectMonth: "पेरोल महीना चुनें",
      year: "वर्ष",
      month: "महीना",
      workingDays: "कुल कार्य दिवस",
      calculateBtn: "पुनर्गणना करें",
      saveBtn: "पेरोल सुरक्षित करें",
      saving: "पेरोल सिंक हो रहा है...",
      markAllPaid: "सभी का भुगतान करें",
      colEmp: "कर्मचारी",
      colAttendance: "उपस्थिति विवरण",
      colSalary: "कमाई और कटौती",
      colOvertime: "ओवरटाइम भुगतान",
      colTotal: "नेट वेतन",
      colStatus: "भुगतान की स्थिति",
      colAction: "पे-स्लिप / कार्रवाई",
      paid: "भुगतान हुआ",
      pending: "लंबित",
      markPaidBtn: "भुगतान करें",
      payslipBtn: "पे-स्लिप",
      noRecords: "इस अवधि के लिए कोई उपस्थिति या पेरोल रिकॉर्ड नहीं मिला। पहले उपस्थिति दर्ज करें, फिर गणना करें।",
      savedSuccess: "पेरोल रिकॉर्ड सफलतापूर्वक गूगल शीट्स में सुरक्षित किए गए!",
      confirmPay: "क्या आप इस कर्मचारी का वेतन भुगतान चिह्नित करना चाहते हैं?",
      confirmAllPay: "क्या आप वाकई इस महीने के सभी लंबित पेरोल भुगतानों को पूरा करना चाहते हैं?",
      payslipHeader: "कर्मचारी वेतन पर्ची (पे-स्लिप)",
      payslipTitle: "पेरोल मैनेजमेंट सिस्टम",
      payslipMonth: "वेतन का महीना / वर्ष",
      payslipEmpDetails: "कर्मचारी का विवरण",
      empId: "आईडी",
      empName: "नाम",
      empDept: "विभाग",
      empRole: "पद",
      joiningDate: "शामिल होने की तिथि",
      paymentMethod: "भुगतान का माध्यम",
      slipEarnings: "कमाई विवरण",
      slipDeductions: "कटौती विवरण",
      basicPay: "मूल वेतन",
      allowance: "भत्ते",
      overtime: "ओवरटाइम भुगतान",
      earnedBasic: "अर्जित मूल वेतन",
      deducts: "कुल कटौती",
      netPayable: "शुद्ध देय राशि (नेट सैलरी)",
      authorizedSign: "प्राधिकृत हस्ताक्षरकर्ता",
      receiptSign: "कर्मचारी के हस्ताक्षर",
      attendanceBreakdown: "उपस्थिति का विवरण",
      attPresent: "उपस्थित दिन",
      attHalf: "हाफ डे",
      attAbsent: "अनुपस्थित",
      attLeave: "छुट्टियां",
      printSlip: "प्रिंट करें",
      closeSlip: "बंद करें"
    }
  }[language];

  // Calculate or load payroll records
  useEffect(() => {
    // Check if payroll records exist for this MonthYear in state
    const savedRecords = payrollRecords.filter(p => p.monthYear === selectedMonthYear);

    if (savedRecords.length > 0) {
      // Use saved records
      setLocalPayroll(savedRecords);
    } else {
      // Automatically compute payroll based on employees + attendance
      const computed: PayrollRecord[] = activeEmployees.map(emp => {
        return calculateSingleEmployeePayroll(emp);
      });

      setLocalPayroll(computed);
    }
  }, [selectedMonthYear, attendanceRecords, payrollRecords, employees, workingDays]);

  const handleAddDeductionPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPermission('add')) {
      alert(language === 'en' ? 'You do not have permission to add deduction & refund plans.' : 'आपके पास कटौती और रिफंड योजना जोड़ने की अनुमति नहीं है।');
      return;
    }
    if (!newDeductEmpId) {
      alert('Please select an employee!');
      return;
    }
    const newPlan: OneTimeDeduction = {
      id: `REF_${Date.now()}`,
      employeeId: newDeductEmpId,
      type: newDeductType,
      totalAmount: Number(newDeductTotal),
      monthlyRefundInstallment: Number(newDeductInstallment),
      refundedAmount: 0,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'Pending',
      description: newDeductDesc || `${newDeductType} deduction plan`
    };

    setOneTimeDeductions(prev => [newPlan, ...prev]);
    setNewDeductDesc('');
    alert('Deduction & Refund Plan added successfully! It will now be processed automatically month-by-month inside active payroll sheets.');
    
    // Automatically recalculate current sheet to immediately reflect refund additions!
    setTimeout(() => {
      handleRecalculate();
    }, 200);
  };

  const handleDeleteDeductionPlan = (id: string) => {
    if (!hasPermission('delete')) {
      alert(language === 'en' ? 'You do not have permission to delete plans.' : 'आपके पास योजनाओं को हटाने की अनुमति नहीं है।');
      return;
    }
    if (confirm('Are you sure you want to delete this deduction & refund plan?')) {
      setOneTimeDeductions(prev => prev.filter(d => d.id !== id));
      setTimeout(() => {
        handleRecalculate();
      }, 200);
    }
  };

  const downloadRefundReportPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Outer frame / header styling - elegant deep green theme
    doc.setFillColor(3, 98, 60); 
    doc.rect(0, 0, 210, 28, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('ONE-TIME DEDUCTIONS & MONTHLY REFUNDS REPORT', 15, 11);
    doc.setFontSize(9);
    doc.setFont('Helvetica', 'normal');
    doc.text('Deduction tracking, month-wise refunds progress & outstanding balances', 15, 17);
    doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 15, 23);

    // Summary statistics boxes
    const totalDeductedVal = oneTimeDeductions.reduce((sum, d) => sum + d.totalAmount, 0);
    const totalRefundedVal = oneTimeDeductions.reduce((sum, d) => sum + d.refundedAmount, 0);
    const totalPendingVal = totalDeductedVal - totalRefundedVal;

    doc.setFillColor(245, 247, 246);
    doc.rect(15, 34, 180, 16, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('TOTAL DEDUCTED', 20, 39);
    doc.text('TOTAL REFUNDED', 80, 39);
    doc.text('OUTSTANDING TO REFUND', 140, 39);

    doc.setFontSize(11);
    doc.setTextColor(3, 98, 60);
    doc.text(`Rs. ${totalDeductedVal.toLocaleString('en-IN')}`, 20, 45);
    doc.text(`Rs. ${totalRefundedVal.toLocaleString('en-IN')}`, 80, 45);
    doc.text(`Rs. ${totalPendingVal.toLocaleString('en-IN')}`, 140, 45);

    // Table setup
    doc.setFillColor(235, 235, 235);
    doc.rect(15, 56, 180, 8, 'F');
    doc.setFontSize(8.5);
    doc.setTextColor(50, 50, 50);
    doc.setFont('Helvetica', 'bold');
    doc.text('Employee', 17, 61);
    doc.text('Type', 65, 61);
    doc.text('Total Amt', 92, 61);
    doc.text('Installment', 115, 61);
    doc.text('Refunded', 140, 61);
    doc.text('Outstanding', 162, 61);
    doc.text('Status', 183, 61);

    let y = 70;
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    
    oneTimeDeductions.forEach(d => {
      const emp = employees.find(e => e.id === d.employeeId);
      const name = emp ? `${emp.name} (${d.employeeId})` : d.employeeId;
      const remaining = d.totalAmount - d.refundedAmount;

      doc.text(name.slice(0, 22), 17, y);
      doc.text(d.type, 65, y);
      doc.text(`Rs. ${d.totalAmount}`, 92, y);
      doc.text(`Rs. ${d.monthlyRefundInstallment}`, 115, y);
      doc.text(`Rs. ${d.refundedAmount}`, 140, y);
      doc.text(`Rs. ${remaining}`, 162, y);
      doc.text(d.status, 183, y);

      doc.setDrawColor(230, 230, 230);
      doc.line(15, y + 2, 195, y + 2);
      y += 8;

      if (y > 275) {
        doc.addPage();
        y = 20;
      }
    });

    // Add a professional footer
    doc.setFontSize(7.5);
    doc.setTextColor(150, 150, 150);
    doc.text('Confidential - Generated by Payroll Management System', 15, 288);
    
    doc.save(`OneTime_Deductions_Refund_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleRecalculate = () => {
    if (!hasPermission('add')) {
      alert(language === 'en' ? 'You do not have permission to calculate payroll.' : 'आपके पास पेरोल की गणना करने की अनुमति नहीं है।');
      return;
    }
    const computed: PayrollRecord[] = activeEmployees.map(emp => {
      return calculateSingleEmployeePayroll(emp);
    });

    setLocalPayroll(computed);
  };

  const handleMarkPaid = async (empId: string) => {
    if (!hasPermission('delete')) {
      alert(language === 'en' ? 'You do not have permission to record payment status.' : 'आपके पास भुगतान स्थिति दर्ज करने की अनुमति नहीं है।');
      return;
    }
    if (confirmPayEmpId !== empId) {
      setConfirmPayEmpId(empId);
      setTimeout(() => setConfirmPayEmpId(null), 5000);
      return;
    }
    setConfirmPayEmpId(null);

    let advanceDeductionAmt = 0;
    const updated = localPayroll.map(p => {
      if (p.employeeId === empId) {
        advanceDeductionAmt = p.advanceDeduction || 0;
        return {
          ...p,
          paymentStatus: 'Paid' as const,
          paymentDate: new Date().toISOString().split('T')[0]
        };
      }
      return p;
    });

    setLocalPayroll(updated);

    // Process one-time deduction refunds for this employee
    const employeeRecord = localPayroll.find(p => p.employeeId === empId);
    if (employeeRecord && employeeRecord.oneTimeRefundAmount && employeeRecord.oneTimeRefundAmount > 0) {
      setOneTimeDeductions(prev => {
        let remainingRefundToApply = employeeRecord.oneTimeRefundAmount || 0;
        return prev.map(d => {
          if (d.employeeId === empId && d.status !== 'Fully Refunded' && remainingRefundToApply > 0) {
            const maxRefundable = d.totalAmount - d.refundedAmount;
            const refundApplied = Math.min(remainingRefundToApply, maxRefundable);
            remainingRefundToApply -= refundApplied;
            const newRefunded = d.refundedAmount + refundApplied;
            const newStatus = newRefunded >= d.totalAmount ? 'Fully Refunded' as const : 'Partially Refunded' as const;
            return {
              ...d,
              refundedAmount: newRefunded,
              status: newStatus
            };
          }
          return d;
        });
      });
    }
    
    // Save to Google sheets directly
    setIsSaving(true);
    try {
      // Deduct advance balance in employee profile if callback is registered and deduction is positive
      if (onUpdateEmployees && advanceDeductionAmt > 0) {
        const empToUpdate = employees.find(e => e.id === empId);
        if (empToUpdate) {
          const currentBalance = empToUpdate.advanceSalaryBalance || 0;
          const updatedEmp = {
            ...empToUpdate,
            advanceSalaryBalance: Math.max(0, currentBalance - advanceDeductionAmt)
          };
          await onUpdateEmployees([updatedEmp]);
        }
      }

      // Merge with non-selected-month history so we don't wipe out other months
      const otherMonthsHistory = payrollRecords.filter(p => p.monthYear !== selectedMonthYear);
      const combined = [...otherMonthsHistory, ...updated];
      await onSavePayroll(combined);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkAllPaid = async () => {
    if (!hasPermission('delete')) {
      alert(language === 'en' ? 'You do not have permission to record payment status.' : 'आपके पास भुगतान स्थिति दर्ज करने की अनुमति नहीं है।');
      return;
    }
    if (!confirmPayAll) {
      setConfirmPayAll(true);
      setTimeout(() => setConfirmPayAll(false), 5000);
      return;
    }
    setConfirmPayAll(false);

    const updated = localPayroll.map(p => ({
      ...p,
      paymentStatus: 'Paid' as const,
      paymentDate: new Date().toISOString().split('T')[0]
    }));

    setLocalPayroll(updated);

    // Process one-time deduction refunds for all paid employees in bulk
    setOneTimeDeductions(prev => {
      let currentDeductions = [...prev];
      localPayroll.forEach(p => {
        if (p.oneTimeRefundAmount && p.oneTimeRefundAmount > 0) {
          let remainingRefundToApply = p.oneTimeRefundAmount;
          currentDeductions = currentDeductions.map(d => {
            if (d.employeeId === p.employeeId && d.status !== 'Fully Refunded' && remainingRefundToApply > 0) {
              const maxRefundable = d.totalAmount - d.refundedAmount;
              const refundApplied = Math.min(remainingRefundToApply, maxRefundable);
              remainingRefundToApply -= refundApplied;
              const newRefunded = d.refundedAmount + refundApplied;
              const newStatus = newRefunded >= d.totalAmount ? 'Fully Refunded' as const : 'Partially Refunded' as const;
              return {
                ...d,
                refundedAmount: newRefunded,
                status: newStatus
              };
            }
            return d;
          });
        }
      });
      return currentDeductions;
    });
    
    setIsSaving(true);
    try {
      // Bulk update employees who had advance deductions
      if (onUpdateEmployees) {
        const empsToUpdate: Employee[] = [];
        localPayroll.forEach(p => {
          if (p.advanceDeduction && p.advanceDeduction > 0) {
            const empToUpdate = employees.find(e => e.id === p.employeeId);
            if (empToUpdate) {
              const currentBalance = empToUpdate.advanceSalaryBalance || 0;
              empsToUpdate.push({
                ...empToUpdate,
                advanceSalaryBalance: Math.max(0, currentBalance - p.advanceDeduction)
              });
            }
          }
        });
        if (empsToUpdate.length > 0) {
          await onUpdateEmployees(empsToUpdate);
        }
      }

      const otherMonthsHistory = payrollRecords.filter(p => p.monthYear !== selectedMonthYear);
      const combined = [...otherMonthsHistory, ...updated];
      await onSavePayroll(combined);
      alert('All marked as Paid and synchronized!');
    } catch (err) {
      console.error(err);
      alert('Failed to save to Google Sheets.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePayroll = async () => {
    if (!hasPermission('add')) {
      alert(language === 'en' ? 'You do not have permission to save payroll sheets.' : 'आपके पास पेरोल शीट सहेजने की अनुमति नहीं है।');
      return;
    }
    setIsSaving(true);
    try {
      const otherMonthsHistory = payrollRecords.filter(p => p.monthYear !== selectedMonthYear);
      const combined = [...otherMonthsHistory, ...localPayroll];
      await onSavePayroll(combined);
      alert(t.savedSuccess);
    } catch (err) {
      console.error(err);
      alert('Failed to save to Google Sheets.');
    } finally {
      setIsSaving(false);
    }
  };

  const openPayslip = (record: PayrollRecord) => {
    const emp = employees.find(e => e.id === record.employeeId);
    const empAtt = attendanceRecords.filter(r => r.employeeId === record.employeeId && r.date.startsWith(selectedMonthYear));
    
    const daysPresent = empAtt.filter(r => r.status === 'Present').length;
    const daysHalfDay = empAtt.filter(r => r.status === 'Half Day').length;
    const daysLeave = empAtt.filter(r => r.status === 'Leave').length;
    const daysAbsent = empAtt.filter(r => r.status === 'Absent').length;
    const overtimeHoursTotal = empAtt.reduce((sum, curr) => sum + (curr.overtimeHours || 0), 0);

    // Compute earned basic for slip
    const workedDaysVal = daysPresent + (0.5 * daysHalfDay) + daysLeave;
    const earnedRatio = Math.min(1, workedDaysVal / workingDays);
    const earnedBasic = Math.round(record.basicSalary * (workedDaysVal === 0 ? 0 : earnedRatio));

    setActivePayslip({
      record,
      employee: emp,
      attendance: {
        present: daysPresent,
        halfDay: daysHalfDay,
        leave: daysLeave,
        absent: daysAbsent,
        overtimeHrs: overtimeHoursTotal
      },
      earnedBasic,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const statsTranslations = {
    en: {
      totalNetSalary: "Total Net Payroll",
      totalPaid: "Disbursed (Paid)",
      totalPending: "Outstanding (Pending)",
      disbursalCompletion: "Disbursal Status",
      averageSalary: "Average Net Payout",
      activeEmployees: "Employees Evaluated",
      paidText: "Paid",
      pendingText: "Pending",
      of: "of",
      slips: "slips paid"
    },
    hi: {
      totalNetSalary: "कुल नेट पेरोल",
      totalPaid: "भुगतान की गई राशि",
      totalPending: "लंबित राशि (बाकी)",
      disbursalCompletion: "भुगतान की स्थिति",
      averageSalary: "औसत नेट भुगतान",
      activeEmployees: "मूल्यांकित कर्मचारी",
      paidText: "भुगतान हुआ",
      pendingText: "लंबित",
      of: "का",
      slips: "पर्चियों का भुगतान"
    }
  }[language];

  // Live recalculate on adjustment input changes
  const handleAdjustmentChange = (field: keyof PayrollRecord, value: number) => {
    if (!editingRecord) return;
    
    const nextRecord = {
      ...editingRecord,
      [field]: value
    } as PayrollRecord;
    
    // Live update allowances
    const allowances = Number(nextRecord.hra || 0) + 
                       Number(nextRecord.da || 0) + 
                       Number(nextRecord.conveyanceAllowance || 0) + 
                       Number(nextRecord.festivalBonus || 0) + 
                       Number(nextRecord.performanceIncentive || 0) + 
                       Number(nextRecord.leaveAdjustment || 0);

    // Live update deductions
    const deductions = Number(nextRecord.providentFund || 0) + 
                       Number(nextRecord.esic || 0) + 
                       Number(nextRecord.professionalTax || 0) + 
                       Number(nextRecord.tds || 0) + 
                       Number(nextRecord.advanceDeduction || 0);

    // Gross = Earned Basic + Overtime Pay + Allowances
    const totalSalary = Number(nextRecord.basicSalary || 0) + 
                        Number(nextRecord.overtimePay || 0) + 
                        Number(allowances);
    
    nextRecord.allowances = allowances;
    nextRecord.deductions = deductions;
    nextRecord.totalSalary = totalSalary;
    nextRecord.netSalary = Math.max(0, totalSalary - deductions);

    setEditingRecord(nextRecord);
  };

  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    setLocalPayroll(prev => prev.map(r => r.employeeId === editingRecord.employeeId ? editingRecord : r));
    setIsAdjustModalOpen(false);
    setEditingRecord(null);
  };

  // Stats calculations
  const totalNetSalary = localPayroll.reduce((sum, r) => sum + r.totalSalary, 0);
  const totalPaid = localPayroll.filter(r => r.paymentStatus === 'Paid').reduce((sum, r) => sum + r.totalSalary, 0);
  const totalPending = localPayroll.filter(r => r.paymentStatus === 'Pending').reduce((sum, r) => sum + r.totalSalary, 0);
  const totalEmployeesCount = localPayroll.length;
  const paidCount = localPayroll.filter(r => r.paymentStatus === 'Paid').length;
  const pendingCount = localPayroll.filter(r => r.paymentStatus === 'Pending').length;
  const completionPercentage = totalEmployeesCount > 0 ? Math.round((paidCount / totalEmployeesCount) * 100) : 0;

  return (
    <div className="space-y-6">
      
      {/* 2026 Premium Bento Stat Grid - Enhanced high contrast with dark mode support */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* KPI Card 1: Total Net Payroll */}
        <div className="relative overflow-hidden bg-white dark:bg-[#11221b] border border-slate-200 dark:border-[#1e3a2f] p-5 rounded-xl shadow-xs transition-all duration-300 hover:shadow-md hover:border-[#03623c]/40 group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#03623c]/5 dark:bg-emerald-500/10 rounded-full blur-2xl -mr-8 -mt-8 transition-all duration-500 group-hover:bg-[#03623c]/10"></div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-800 dark:text-slate-300 uppercase tracking-widest">{statsTranslations.totalNetSalary}</span>
            <span className="p-2 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/60 text-[#03623c] dark:text-emerald-400 shrink-0 border border-emerald-100/50 dark:border-emerald-800/50">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-display tracking-tight leading-none">
              ₹{totalNetSalary.toLocaleString('en-IN')}
            </h3>
            <div className="flex items-center gap-1.5 mt-2.5 text-xs font-extrabold text-slate-800 dark:text-slate-300">
              <Users className="w-3.5 h-3.5 text-[#03623c] dark:text-emerald-400" />
              <span>{totalEmployeesCount} <span className="text-slate-700 dark:text-slate-400 font-bold">{statsTranslations.activeEmployees}</span></span>
            </div>
          </div>
        </div>

        {/* KPI Card 2: Paid Disbursed */}
        <div className="relative overflow-hidden bg-white dark:bg-[#11221b] border border-slate-200 dark:border-[#1e3a2f] p-5 rounded-xl shadow-xs transition-all duration-300 hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-700 group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-2xl -mr-8 -mt-8 transition-all duration-500 group-hover:bg-emerald-500/10"></div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-800 dark:text-slate-300 uppercase tracking-widest">{statsTranslations.totalPaid}</span>
            <span className="p-2 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0 border border-emerald-100/50 dark:border-emerald-800/50">
              <Check className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-display tracking-tight leading-none">
              ₹{totalPaid.toLocaleString('en-IN')}
            </h3>
            <div className="flex items-center gap-1.5 mt-2.5 text-xs font-extrabold text-slate-800 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></span>
              <span>{paidCount} <span className="text-slate-700 dark:text-slate-400 font-bold">{statsTranslations.paidText}</span></span>
            </div>
          </div>
        </div>

        {/* KPI Card 3: Pending Outstanding */}
        <div className="relative overflow-hidden bg-white dark:bg-[#11221b] border border-slate-200 dark:border-[#1e3a2f] p-5 rounded-xl shadow-xs transition-all duration-300 hover:shadow-md hover:border-amber-200 dark:hover:border-amber-700 group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 dark:bg-amber-500/10 rounded-full blur-2xl -mr-8 -mt-8 transition-all duration-500 group-hover:bg-amber-500/10"></div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-800 dark:text-slate-300 uppercase tracking-widest">{statsTranslations.totalPending}</span>
            <span className="p-2 rounded-lg bg-amber-50/70 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 shrink-0 border border-amber-100/50 dark:border-amber-800/50">
              <CreditCard className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-display tracking-tight leading-none">
              ₹{totalPending.toLocaleString('en-IN')}
            </h3>
            <div className="flex items-center gap-1.5 mt-2.5 text-xs font-extrabold text-slate-800 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              <span>{pendingCount} <span className="text-slate-700 dark:text-slate-400 font-bold">{statsTranslations.pendingText}</span></span>
            </div>
          </div>
        </div>

        {/* KPI Card 4: Disbursal Meter */}
        <div className="relative overflow-hidden bg-white dark:bg-[#11221b] border border-slate-200 dark:border-[#1e3a2f] p-5 rounded-xl shadow-xs transition-all duration-300 hover:shadow-md hover:border-[#03623c]/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-800 dark:text-slate-300 uppercase tracking-widest">{statsTranslations.disbursalCompletion}</span>
            <span className="text-xs font-extrabold text-[#03623c] dark:text-emerald-400 font-mono bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-100/50 dark:border-emerald-800/50">{completionPercentage}%</span>
          </div>
          <div className="mt-5">
            <div className="w-full bg-slate-100 dark:bg-slate-800/80 rounded-full h-2.5 overflow-hidden border border-slate-200/40 dark:border-slate-700/50 p-[2px]">
              <div 
                className="bg-gradient-to-r from-emerald-500 via-[#03623c] to-[#024d2e] h-1.5 rounded-full transition-all duration-500 shadow-3xs" 
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center mt-3 text-xs font-extrabold text-slate-800 dark:text-slate-200">
              <span>{paidCount} {statsTranslations.of} {totalEmployeesCount} {statsTranslations.slips}</span>
              <span className="font-mono text-[10px] text-slate-600 dark:text-slate-400">{completionPercentage}% Completed</span>
            </div>
          </div>
        </div>

      </div>

      {/* Premium sub-tab switcher */}
      <div className="flex border-b border-slate-200 dark:border-[#1e3a2f] bg-white dark:bg-[#11221b] rounded-t-xl overflow-hidden mt-6 shadow-xs">
        <button
          onClick={() => setActiveSubTab('ledger')}
          className={`flex-1 py-3.5 text-xs font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeSubTab === 'ledger'
              ? 'border-[#03623c] dark:border-emerald-400 text-[#03623c] dark:text-emerald-400 bg-slate-50/50 dark:bg-emerald-950/30'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 bg-white dark:bg-[#11221b]'
          }`}
        >
          <Check className="w-4 h-4 text-[#03623c] dark:text-emerald-400" />
          <span>Monthly Payroll Ledger (मासिक पेरोल सूची)</span>
        </button>
        <button
          onClick={() => setActiveSubTab('refunds')}
          className={`flex-1 py-3.5 text-xs font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeSubTab === 'refunds'
              ? 'border-[#03623c] dark:border-emerald-400 text-[#03623c] dark:text-emerald-400 bg-slate-50/50 dark:bg-emerald-950/30'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 bg-white dark:bg-[#11221b]'
          }`}
        >
          <RefreshCcw className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>One-Time Deductions & Refunds Report (कटौती एवं रिफंड)</span>
        </button>
      </div>

      {activeSubTab === 'ledger' && (
        <>
          {/* Dynamic Annual Analytics Dashboard Panel */}
      {showAnalytics && (
        <div className="bg-white dark:bg-[#11221b] text-slate-900 dark:text-slate-100 p-6 rounded-xl border border-slate-200 dark:border-[#1e3a2f] shadow-md transition-all duration-300">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                <span>Annual Financial Summary & Statutory Ledger (वार्षिक वित्तीय सारांश)</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-1 font-medium">Aggregated real-time statutory payments, taxes collected (TDS/PT) & PF accumulations</p>
            </div>
            <button 
              onClick={() => setShowAnalytics(false)} 
              className="text-slate-400 hover:text-white text-xs font-bold bg-slate-800 border border-slate-750 px-3 py-1.5 rounded-lg cursor-pointer"
            >
              Close Panel ✕
            </button>
          </div>

          {getAnnualAnalytics().length === 0 ? (
            <div className="text-center py-10 bg-slate-950/40 rounded-lg border border-dashed border-slate-800">
              <AlertCircle className="w-10 h-10 mx-auto text-amber-500/80 mb-2.5" />
              <h4 className="text-xs font-bold text-slate-300">No Historical Records Saved Yet</h4>
              <p className="text-xxs text-slate-500 max-w-sm mx-auto mt-1 leading-normal">
                Save and sync this month's payroll ledger below to generate professional statutory charts and annual reporting.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Dynamic Bar/Trend lines representing historical payouts */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                
                {/* Statutory summary box 1 */}
                <div className="bg-slate-950/40 p-4 rounded-lg border border-slate-800/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total PF Deposited (EPF/MP)</span>
                  <div className="text-xl font-extrabold text-white mt-1">
                    ₹{getAnnualAnalytics().reduce((sum, item) => sum + item.pf, 0).toLocaleString('en-IN')}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1.5 font-bold font-mono">Accumulated 12% employee share ledger</p>
                </div>

                {/* Statutory summary box 2 */}
                <div className="bg-slate-950/40 p-4 rounded-lg border border-slate-800/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total TDS Tax Collected</span>
                  <div className="text-xl font-extrabold text-[#10b981] mt-1">
                    ₹{getAnnualAnalytics().reduce((sum, item) => sum + item.tds, 0).toLocaleString('en-IN')}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1.5 font-bold font-mono">Deducted for direct Central IT Dept filing</p>
                </div>

                {/* Statutory summary box 3 */}
                <div className="bg-slate-950/40 p-4 rounded-lg border border-slate-800/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Professional Tax (PT)</span>
                  <div className="text-xl font-extrabold text-blue-400 mt-1">
                    ₹{getAnnualAnalytics().reduce((sum, item) => sum + item.pt, 0).toLocaleString('en-IN')}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1.5 font-bold font-mono">Chhattisgarh State Treasury allocation</p>
                </div>

              </div>

              {/* Table ledger */}
              <div className="overflow-x-auto rounded-lg border border-slate-800">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider">
                      <th className="py-3.5 px-4">Period Month</th>
                      <th className="py-3.5 px-4">Gross Disbursed</th>
                      <th className="py-3.5 px-4">Net Paid Salary</th>
                      <th className="py-3.5 px-4 text-slate-300">PF Contribution</th>
                      <th className="py-3.5 px-4 text-slate-300">ESIC Share</th>
                      <th className="py-3.5 px-4 text-amber-400">TDS Tax</th>
                      <th className="py-3.5 px-4">State PT</th>
                      <th className="py-3.5 px-4 text-center">Active Slips</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 bg-slate-950/20 font-mono">
                    {getAnnualAnalytics().map((item) => (
                      <tr key={item.monthYear} className="hover:bg-slate-850/50 transition-colors">
                        <td className="py-3 px-4 font-bold text-white font-sans">{item.monthYear}</td>
                        <td className="py-3 px-4 text-slate-300">₹{item.gross.toLocaleString('en-IN')}</td>
                        <td className="py-3 px-4 text-emerald-400 font-bold">₹{item.net.toLocaleString('en-IN')}</td>
                        <td className="py-3 px-4 text-indigo-300">₹{item.pf.toLocaleString('en-IN')}</td>
                        <td className="py-3 px-4 text-blue-300">₹{item.esic.toLocaleString('en-IN')}</td>
                        <td className="py-3 px-4 text-amber-400 font-bold">₹{item.tds.toLocaleString('en-IN')}</td>
                        <td className="py-3 px-4 text-slate-400">₹{item.pt.toLocaleString('en-IN')}</td>
                        <td className="py-3 px-4 text-center font-sans font-bold text-slate-300 bg-slate-950/40">{item.count} slips</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modern High-End Selector & Controls Dock */}
      <div className="bg-white dark:bg-[#11221b] p-5 rounded-xl border border-slate-200 dark:border-[#1e3a2f] shadow-xs flex flex-col lg:flex-row lg:items-end justify-between gap-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 flex-1 max-w-3xl">
          
          {/* Year selector */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest">{t.year}</label>
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full appearance-none border border-slate-200 dark:border-[#1e3a2f] rounded-lg pl-3 pr-8 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#03623c] bg-white dark:bg-[#0b1812] shadow-2xs text-slate-800 dark:text-slate-100 transition-all cursor-pointer"
                id="payroll-year"
              >
                {['2025', '2026', '2027', '2028'].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                <Calendar className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Month selector */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest">{t.month}</label>
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full appearance-none border border-slate-200 dark:border-[#1e3a2f] rounded-lg pl-3 pr-8 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#03623c] bg-white dark:bg-[#0b1812] shadow-2xs text-slate-800 dark:text-slate-100 transition-all cursor-pointer"
                id="payroll-month"
              >
                {MONTHS.map(m => (
                  <option key={m.value} value={m.value}>
                    {language === 'en' ? m.name : m.hindi}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                <Calendar className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Working days input */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest">{t.workingDays}</label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="31"
                value={workingDays}
                onChange={(e) => setWorkingDays(Number(e.target.value))}
                className="w-full border border-slate-200 dark:border-[#1e3a2f] rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#03623c] bg-white dark:bg-[#0b1812] shadow-2xs text-slate-800 dark:text-slate-100 transition-all"
                id="payroll-working-days"
              />
            </div>
          </div>
        </div>

        {/* Buttons strip with elegant styling */}
        <div className="flex flex-wrap gap-2.5 pt-2 lg:pt-0">
          {/* Main Master Attendance & Salary Sheet Button */}
          <button
            onClick={() => setIsMasterSheetOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 hover:from-emerald-500 hover:to-teal-700 text-white text-xs font-bold rounded-lg flex items-center gap-2 cursor-pointer transition-all shadow-md hover:shadow-lg active:scale-98 border border-emerald-400/30"
            id="btn-master-attendance-salary-sheet"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
            <span>{language === 'en' ? 'Master Attendance & Salary Sheet (Day-wise + Excel/PDF)' : 'मास्टर अटेंडेंस व सैलरी शीट (डे-वाइज़ + एक्सेल/PDF)'}</span>
          </button>

          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className={`px-4 py-2.5 border text-xs font-bold rounded-lg flex items-center gap-2 cursor-pointer transition-all active:scale-98 ${
              showAnalytics 
                ? 'bg-amber-600 border-amber-600 text-white shadow-md hover:bg-amber-700' 
                : 'border-slate-200 dark:border-[#1e3a2f] hover:border-slate-300 bg-slate-50 dark:bg-[#0b1812] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
            }`}
            id="toggle-analytics"
          >
            <TrendingUp className="w-4 h-4 text-amber-500" />
            <span>{language === 'en' ? 'Annual Analytics' : 'वार्षिक विश्लेषण'}</span>
          </button>

          {/* Export Dropdown with Bank + Cash + Combined options */}
          <div className="relative group">
            <button className="px-4 py-2.5 border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300 text-xs font-bold rounded-lg flex items-center gap-2 cursor-pointer transition-all hover:shadow-2xs active:scale-98">
              <Landmark className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>{language === 'en' ? 'Export Payroll Reports 📊' : 'पेरोल एवं बैंक रिपोर्ट निर्यात'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-indigo-500" />
            </button>
            <div className="absolute right-0 mt-1 w-72 bg-white dark:bg-[#11221b] border border-slate-200 dark:border-[#1e3a2f] rounded-xl shadow-xl py-2 z-30 hidden group-hover:block hover:block divide-y divide-slate-100 dark:divide-[#1e3a2f]">
              
              {/* Section 1: Combined Master Sheet */}
              <div className="px-1 py-1">
                <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-mono">
                  {language === 'en' ? 'Combined Master Export' : 'संयुक्त मास्टर रिपोर्ट'}
                </div>
                <button 
                  onClick={() => setIsMasterSheetOpen(true)}
                  className="w-full text-left px-3 py-2 text-xs text-slate-800 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-[#183328] rounded-lg font-bold flex items-center gap-2.5 transition-colors cursor-pointer bg-emerald-50/40"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <div className="text-emerald-900 font-black">{language === 'en' ? 'Day-Wise Attendance + Salary Sheet' : 'डे-वाइज़ अटेंडेंस + सैलरी शीट'}</div>
                    <div className="text-[10px] text-emerald-700 font-normal">Custom Columns + Excel (.xlsx) & PDF</div>
                  </div>
                </button>
                <button 
                  onClick={handleCombinedExport}
                  className="w-full text-left px-3 py-2 text-xs text-slate-800 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-[#183328] rounded-lg font-bold flex items-center gap-2.5 transition-colors cursor-pointer mt-1"
                >
                  <Download className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <div>{language === 'en' ? 'All Modes Master CSV' : 'सभी मोड मास्टर CSV'}</div>
                    <div className="text-[10px] text-slate-400 font-normal">Bank + Cash + Cheque Records</div>
                  </div>
                </button>
              </div>

              {/* Section 2: Cash Disbursal Reports */}
              <div className="px-1 py-1">
                <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-600 font-mono flex items-center gap-1">
                  <Banknote className="w-3.5 h-3.5" />
                  <span>{language === 'en' ? 'Cash Disbursal Reports' : 'नकद भुगतान रिपोर्ट'}</span>
                </div>
                <button 
                  onClick={handleCashExport}
                  className="w-full text-left px-3 py-2 text-xs text-slate-800 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg font-bold flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <div>{language === 'en' ? 'Cash Disbursal Advice (.csv)' : 'नकद भुगतान सूची (.csv)'}</div>
                    <div className="text-[10px] text-slate-400 font-normal">With Signature & Net Pay Columns</div>
                  </div>
                </button>
                <button 
                  onClick={() => handleCashVoucherPDF()}
                  className="w-full text-left px-3 py-2 text-xs text-slate-800 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg font-bold flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <div>{language === 'en' ? 'Cash Payment Vouchers (.pdf)' : 'नकद भुगतान रसीद/वाउचर (.pdf)'}</div>
                    <div className="text-[10px] text-slate-400 font-normal">Printable Cash Receipt Slips</div>
                  </div>
                </button>
              </div>

              {/* Section 3: Bank Bulk Transfer Files */}
              <div className="px-1 py-1">
                <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 font-mono flex items-center gap-1">
                  <Landmark className="w-3.5 h-3.5" />
                  <span>{language === 'en' ? 'Bank Transfer Files' : 'बैंक ट्रांसफ़र फ़ाइलें'}</span>
                </div>
                <button 
                  onClick={() => handleBankExport('SBI')} 
                  className="w-full text-left px-3 py-2 text-xs text-slate-800 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg font-bold flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Building className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>SBI Bulk Salary Upload (.csv)</span>
                </button>
                <button 
                  onClick={() => handleBankExport('HDFC')} 
                  className="w-full text-left px-3 py-2 text-xs text-slate-800 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg font-bold flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Building className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>HDFC Bank Bulk Format (.csv)</span>
                </button>
                <button 
                  onClick={() => handleBankExport('ICICI')} 
                  className="w-full text-left px-3 py-2 text-xs text-slate-800 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg font-bold flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Building className="w-4 h-4 text-orange-600 shrink-0" />
                  <span>ICICI Corporate Format (.csv)</span>
                </button>
              </div>

            </div>
          </div>

          <button
            onClick={handleRecalculate}
            className="px-4 py-2.5 border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-bold rounded-lg flex items-center gap-2 cursor-pointer text-slate-700 transition-all hover:shadow-2xs active:scale-98"
            id="recalc-payroll"
          >
            <Calculator className="w-4 h-4 text-slate-500" />
            <span>{t.calculateBtn}</span>
          </button>
          
          <button
            onClick={handleMarkAllPaid}
            className={`px-4 py-2.5 border text-xs font-bold rounded-lg flex items-center gap-2 cursor-pointer transition-all hover:shadow-2xs active:scale-98 ${
              confirmPayAll 
                ? 'border-amber-300 bg-amber-50 text-amber-800 animate-pulse'
                : 'border-emerald-200/80 bg-emerald-50 hover:bg-emerald-100/90 text-emerald-800'
            }`}
            id="mark-all-paid"
          >
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{confirmPayAll ? (language === 'en' ? 'Click to Confirm All' : 'सभी की पुष्टि करें') : t.markAllPaid}</span>
          </button>
        </div>
      </div>

      {/* Payment Summary Breakdown Cards Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Bank Total */}
        <div className="bg-white dark:bg-[#11221b] p-3.5 rounded-xl border border-indigo-100 dark:border-indigo-900/40 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider font-mono flex items-center gap-1">
              <Landmark className="w-3 h-3" />
              <span>{language === 'en' ? 'Bank Transfer' : 'बैंक ट्रांसफ़र'}</span>
            </div>
            <div className="text-base font-extrabold text-slate-900 dark:text-slate-100 mt-0.5 font-mono">
              ₹{paymentSummary.bankTotal.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
              {paymentSummary.bankCount} {language === 'en' ? 'Employees' : 'कर्मचारी'}
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Building className="w-4 h-4" />
          </div>
        </div>

        {/* Cash Total */}
        <div className="bg-white dark:bg-[#11221b] p-3.5 rounded-xl border border-amber-100 dark:border-amber-900/40 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider font-mono flex items-center gap-1">
              <Banknote className="w-3 h-3" />
              <span>{language === 'en' ? 'Cash Payout' : 'नकद भुगतान'}</span>
            </div>
            <div className="text-base font-extrabold text-slate-900 dark:text-slate-100 mt-0.5 font-mono">
              ₹{paymentSummary.cashTotal.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
              {paymentSummary.cashCount} {language === 'en' ? 'Employees' : 'कर्मचारी'}
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>

        {/* Cheque Total */}
        <div className="bg-white dark:bg-[#11221b] p-3.5 rounded-xl border border-purple-100 dark:border-purple-900/40 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-extrabold text-purple-600 dark:text-purple-400 uppercase tracking-wider font-mono flex items-center gap-1">
              <CreditCard className="w-3 h-3" />
              <span>{language === 'en' ? 'Cheque Payout' : 'चेक भुगतान'}</span>
            </div>
            <div className="text-base font-extrabold text-slate-900 dark:text-slate-100 mt-0.5 font-mono">
              ₹{paymentSummary.chequeTotal.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
              {paymentSummary.chequeCount} {language === 'en' ? 'Employees' : 'कर्मचारी'}
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4" />
          </div>
        </div>

        {/* Grand Total */}
        <div className="bg-gradient-to-br from-emerald-800 to-teal-900 text-white p-3.5 rounded-xl shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-extrabold text-emerald-200 uppercase tracking-wider font-mono">
              {language === 'en' ? 'Total Payroll' : 'कुल पेरोल'}
            </div>
            <div className="text-base font-extrabold mt-0.5 font-mono">
              ₹{paymentSummary.grandTotal.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-emerald-200/80 font-semibold mt-0.5">
              {paymentSummary.totalCount} {language === 'en' ? 'Total Disbursed' : 'कुल कर्मचारी'}
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center shrink-0">
            <Calculator className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Dynamic Filters Row */}
      <div className="bg-white dark:bg-[#11221b] p-4 rounded-xl border border-slate-200 dark:border-[#1e3a2f] shadow-[0_8px_30px_rgba(0,0,0,0.015)] flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">Filters:</span>
        </div>

        {/* Department Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase font-mono">Dept:</span>
          <select
            value={selectedDept}
            onChange={(e) => { setSelectedDept(e.target.value); setCurrentPage(1); }}
            className="bg-slate-50 dark:bg-[#0b1812] border border-slate-200 dark:border-[#1e3a2f] text-xs font-semibold text-slate-700 dark:text-slate-200 px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-indigo-600 transition-all cursor-pointer"
          >
            {departmentOptions.map(dept => (
              <option key={dept} value={dept} className="dark:bg-[#11221b]">{dept}</option>
            ))}
          </select>
        </div>

        {/* Branch Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase font-mono">Branch:</span>
          <select
            value={selectedBranch}
            onChange={(e) => { setSelectedBranch(e.target.value); setCurrentPage(1); }}
            className="bg-slate-50 dark:bg-[#0b1812] border border-slate-200 dark:border-[#1e3a2f] text-xs font-semibold text-slate-700 dark:text-slate-200 px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-indigo-600 transition-all cursor-pointer"
          >
            {branchOptions.map(branch => (
              <option key={branch} value={branch} className="dark:bg-[#11221b]">{branch}</option>
            ))}
          </select>
        </div>

        {/* Employee ID Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase font-mono">Employee:</span>
          <select
            value={selectedEmployeeId}
            onChange={(e) => { setSelectedEmployeeId(e.target.value); setCurrentPage(1); }}
            className="bg-slate-50 dark:bg-[#0b1812] border border-slate-200 dark:border-[#1e3a2f] text-xs font-semibold text-slate-700 dark:text-slate-200 px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-indigo-600 transition-all cursor-pointer max-w-[150px]"
          >
            <option value="All" className="dark:bg-[#11221b]">{language === 'en' ? 'All Employees' : 'सभी कर्मचारी'}</option>
            {employeeOptions.map(emp => (
              <option key={emp.id} value={emp.id} className="dark:bg-[#11221b]">{emp.name}</option>
            ))}
          </select>
        </div>

        {/* Payment Mode Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase font-mono">Payment Mode:</span>
          <select
            value={selectedPaymentMode}
            onChange={(e) => { setSelectedPaymentMode(e.target.value as any); setCurrentPage(1); }}
            className="bg-slate-50 dark:bg-[#0b1812] border border-slate-200 dark:border-[#1e3a2f] text-xs font-bold text-slate-800 dark:text-slate-200 px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-indigo-600 transition-all cursor-pointer"
          >
            <option value="All" className="dark:bg-[#11221b]">{language === 'en' ? 'All Modes (सब)' : 'सभी माध्यम'}</option>
            <option value="Bank Transfer" className="dark:bg-[#11221b]">🏦 Bank Transfer</option>
            <option value="Cash" className="dark:bg-[#11221b]">💵 Cash Mode</option>
            <option value="Cheque" className="dark:bg-[#11221b]">📝 Cheque Mode</option>
          </select>
        </div>
      </div>

      {/* Main List Box with exquisite, clean modern table design */}
      <div className="bg-white dark:bg-[#11221b] rounded-xl border border-slate-200 dark:border-[#1e3a2f] shadow-[0_8px_30px_rgba(0,0,0,0.015)] overflow-hidden">
        {filteredPayroll.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 dark:bg-[#0c1a14] border-b border-slate-200 dark:border-[#1e3a2f] text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest">
                  <th className="py-4 px-6">{t.colEmp}</th>
                  <th className="py-4 px-6">{t.colAttendance}</th>
                  <th className="py-4 px-6">{t.colSalary}</th>
                  <th className="py-4 px-6">{t.colOvertime}</th>
                  <th className="py-4 px-6 text-slate-800 dark:text-slate-200 font-bold">{t.colTotal}</th>
                  <th className="py-4 px-6 text-center">{t.colStatus}</th>
                  <th className="py-4 px-6 text-right">{t.colAction}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1e3a2f]/60 text-xs">
                {paginatedPayroll.map((rec) => {
                  const emp = employees.find(e => e.id === rec.employeeId);
                  const empAtt = attendanceRecords.filter(r => r.employeeId === rec.employeeId && r.date.startsWith(selectedMonthYear));
                  
                  const daysPresent = empAtt.filter(r => r.status === 'Present' || (r.status === 'Miss Punch' && r.approvalStatus === 'Approved')).length;
                  const daysHalfDay = empAtt.filter(r => r.status === 'Half Day').length;
                  const daysLeave = empAtt.filter(r => r.status === 'Leave').length;
                  const daysAbsent = empAtt.filter(r => r.status === 'Absent').length;
                  const daysMissPunch = empAtt.filter(r => r.status === 'Miss Punch' && r.approvalStatus !== 'Approved').length;

                  return (
                    <tr key={rec.employeeId} className="hover:bg-slate-50/60 dark:hover:bg-[#183328]/40 transition-colors duration-200">
                      
                      {/* Employee Cell */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3.5">
                          {emp?.photoUrl ? (
                            <img 
                              src={parseGoogleDriveImageUrl(emp.photoUrl)} 
                              alt={emp.name} 
                              className="w-9 h-9 rounded-full object-cover border border-slate-200/80 dark:border-[#1e3a2f] shrink-0 shadow-2xs"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs border border-indigo-100 dark:border-indigo-800/50 uppercase shrink-0">
                              {emp?.name ? emp.name.split(' ').map(n => n[0]).join('').substring(0, 2) : 'EM'}
                            </div>
                          )}
                          <div className="space-y-0.5">
                            <div className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-snug">{emp?.name || 'Unknown'}</div>
                            <div className="text-[10px] text-slate-400 font-semibold font-mono flex items-center gap-1.5 flex-wrap">
                              <span>{rec.employeeId}</span>
                              <span className="text-slate-200 dark:text-slate-600">•</span>
                              <span className="bg-slate-100 dark:bg-[#0b1812] px-1.5 py-0.2 rounded-sm text-[9px] font-sans text-slate-500 dark:text-slate-400 font-bold">{emp?.designation}</span>
                              <span className="text-slate-200 dark:text-slate-600">•</span>
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold flex items-center gap-1 border ${
                                emp?.paymentMethod === 'Cash' 
                                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/80' 
                                  : emp?.paymentMethod === 'Cheque'
                                  ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800/80'
                                  : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/80'
                              }`}>
                                {emp?.paymentMethod === 'Cash' ? '💵 Cash' : emp?.paymentMethod === 'Cheque' ? '📝 Cheque' : '🏦 Bank'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Attendance breakdown pills */}
                      <td className="py-4 px-6">
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold font-mono">
                          <span className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800/50 px-2 py-0.5 rounded-md shadow-3xs" title="Present Days">{daysPresent}P</span>
                          <span className="bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-100 dark:border-amber-800/50 px-2 py-0.5 rounded-md shadow-3xs" title="Half Days">{daysHalfDay}H</span>
                          <span className="bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800/50 px-2 py-0.5 rounded-md shadow-3xs" title="Paid Leaves">{daysLeave}L</span>
                          <span className="bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-100 dark:border-rose-800/50 px-2 py-0.5 rounded-md shadow-3xs" title="Absent">{daysAbsent}A</span>
                          {daysMissPunch > 0 && (
                            <span className="bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 px-2 py-0.5 rounded-md shadow-3xs animate-pulse font-sans font-bold flex items-center gap-1 shrink-0" title="Pending Miss Punch Approvals">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              <span>{daysMissPunch} {language === 'en' ? 'Miss Punch (Pending)' : 'लंबित मिस पंच'}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Pro-rated basic & allowance details */}
                      <td className="py-4 px-6">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">₹{rec.basicSalary.toLocaleString('en-IN')}</div>
                          <div className="text-[10px] text-slate-400 font-semibold leading-none flex items-center gap-1">
                            <span className="text-emerald-600 dark:text-emerald-400">+₹{rec.allowances}</span>
                            <span>/</span>
                            <span className="text-rose-600 dark:text-rose-400">-₹{rec.deductions}</span>
                          </div>
                        </div>
                      </td>

                      {/* Overtime display */}
                      <td className="py-4 px-6">
                        <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">₹{rec.overtimePay.toLocaleString('en-IN')}</span>
                      </td>

                      {/* Total calculated pay */}
                      <td className="py-4 px-6">
                        <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm font-mono tracking-tight bg-slate-100/50 dark:bg-[#0b1812] border border-slate-150 dark:border-[#1e3a2f] px-2.5 py-1 rounded-lg">
                          ₹{rec.totalSalary.toLocaleString('en-IN')}
                        </span>
                      </td>

                      {/* Micro glowing badge for payment mode & status */}
                      <td className="py-4 px-6 text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          {/* Payment Mode Selector Dropdown */}
                          <select
                            value={emp?.paymentMethod || 'Bank Transfer'}
                            onChange={(e) => {
                              const newMode = e.target.value as 'Bank Transfer' | 'Cash' | 'Cheque';
                              if (emp && onUpdateEmployees) {
                                onUpdateEmployees([{ ...emp, paymentMethod: newMode }]);
                              }
                            }}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border focus:outline-none cursor-pointer transition-all ${
                              emp?.paymentMethod === 'Cash'
                                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                                : emp?.paymentMethod === 'Cheque'
                                ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-700'
                                : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                            }`}
                            title="Click to change Payment Mode"
                          >
                            <option value="Bank Transfer" className="bg-white dark:bg-[#11221b] text-slate-800 dark:text-slate-200">🏦 Bank Transfer</option>
                            <option value="Cash" className="bg-white dark:bg-[#11221b] text-slate-800 dark:text-slate-200">💵 Cash</option>
                            <option value="Cheque" className="bg-white dark:bg-[#11221b] text-slate-800 dark:text-slate-200">📝 Cheque</option>
                          </select>

                          {/* Status Badge */}
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border transition-all duration-300 ${
                            rec.paymentStatus === 'Paid' 
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 shadow-[0_2px_10px_rgba(16,185,129,0.06)]' 
                              : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 animate-pulse shadow-[0_2px_10px_rgba(245,158,11,0.06)]'
                          }`}>
                            {rec.paymentStatus === 'Paid' ? (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]"></span>
                                <span>{t.paid}</span>
                              </>
                            ) : (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                <span>{t.pending}</span>
                              </>
                            )}
                          </span>
                        </div>
                      </td>

                      {/* Responsive row actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end items-center gap-2">
                          
                          {/* Cash Payment Voucher button if mode is Cash */}
                          {emp?.paymentMethod === 'Cash' && (
                            <button
                              onClick={() => handleCashVoucherPDF(rec)}
                              className="bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all hover:shadow-3xs active:scale-97"
                              title="Print Cash Payment Receipt Voucher"
                            >
                              <FileText className="w-3.5 h-3.5 text-amber-600" />
                              <span>Voucher</span>
                            </button>
                          )}
                          
                          {/* Adjustments on-the-fly */}
                          <button
                            onClick={() => {
                              if (!hasPermission('edit')) {
                                alert(language === 'en' ? 'You do not have permission to adjust payroll.' : 'आपके पास पेरोल संयोजित करने की अनुमति नहीं है।');
                                return;
                              }
                              setEditingRecord(rec);
                              setIsAdjustModalOpen(true);
                            }}
                            className="bg-white dark:bg-[#0b1812] hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-slate-200 dark:border-[#1e3a2f] hover:border-amber-250 text-amber-700 dark:text-amber-300 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all hover:shadow-3xs active:scale-97"
                            title="Adjust Salary Components"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            <span>{language === 'en' ? 'Adjust' : 'बदलाव'}</span>
                          </button>

                          {/* Payslip View */}
                          <button
                            onClick={() => openPayslip(rec)}
                            className="bg-white dark:bg-[#0b1812] hover:bg-slate-50 dark:hover:bg-[#183328] border border-slate-200 dark:border-[#1e3a2f] text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all hover:shadow-3xs active:scale-97"
                            id={`slip-${rec.employeeId}`}
                            title="View Slip"
                          >
                            <FileText className="w-3.5 h-3.5 text-slate-400" />
                            <span>{t.payslipBtn}</span>
                          </button>

                          {/* Send WhatsApp Payslip */}
                          <button
                            onClick={() => {
                              const emp = employees.find(e => e.id === rec.employeeId);
                              setWaRecipient({
                                name: emp?.name || rec.employeeId,
                                mobileNo: emp?.mobileNo || emp?.personalMobileNo,
                                email: emp?.email || emp?.personalEmail
                              });
                              setWaCategory('payslip');
                              setWaVars({
                                MONTH: selectedMonthYear,
                                BASIC: rec.basicSalary,
                                NET_SALARY: rec.netSalary || rec.totalSalary,
                                STATUS: rec.paymentStatus,
                                PAY_DATE: rec.paymentDate || 'Pending'
                              });
                              setWaModalOpen(true);
                            }}
                            className="bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all hover:shadow-3xs active:scale-97"
                            title="Send WhatsApp / Email Payslip"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>WhatsApp</span>
                          </button>

                          {/* Pay Now Gradient */}
                          {rec.paymentStatus === 'Pending' && (
                            <button
                              onClick={() => handleMarkPaid(rec.employeeId)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-3xs active:scale-97 ${
                                confirmPayEmpId === rec.employeeId
                                  ? 'bg-amber-500 hover:bg-amber-600 text-white animate-pulse'
                                  : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-[0_4px_12px_rgba(79,70,229,0.2)]'
                              }`}
                              id={`pay-${rec.employeeId}`}
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>{confirmPayEmpId === rec.employeeId ? (language === 'en' ? 'Click to Confirm' : 'पुष्टि करें') : t.markPaidBtn}</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Entries control & Pagination */}
            <div className="bg-slate-50 dark:bg-[#0c1a14] border-t border-slate-200 dark:border-[#1e3a2f] px-6 py-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Show Entries:</span>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                  className="bg-white dark:bg-[#0b1812] border border-slate-250 dark:border-[#1e3a2f] text-xs font-semibold text-slate-700 dark:text-slate-200 px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-indigo-600 cursor-pointer"
                >
                  <option value={10} className="dark:bg-[#11221b]">10</option>
                  <option value={25} className="dark:bg-[#11221b]">25</option>
                  <option value={50} className="dark:bg-[#11221b]">50</option>
                  <option value={100} className="dark:bg-[#11221b]">100</option>
                </select>
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Showing <span className="font-bold text-slate-800 dark:text-slate-200">{filteredPayroll.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</span> to <span className="font-bold text-slate-800 dark:text-slate-200">{Math.min(currentPage * pageSize, filteredPayroll.length)}</span> of <span className="font-bold text-slate-800 dark:text-slate-200">{filteredPayroll.length}</span> entries
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#0b1812] border border-slate-200 dark:border-[#1e3a2f] rounded-lg hover:bg-slate-50 dark:hover:bg-[#183328] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#0b1812] border border-slate-200 dark:border-[#1e3a2f] rounded-lg hover:bg-slate-50 dark:hover:bg-[#183328] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-[#0c1a14]/50">
            <AlertCircle className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-xs font-bold text-slate-400 dark:text-slate-400 max-w-md mx-auto leading-relaxed">{t.noRecords}</p>
          </div>
        )}

        {/* Sync panel footer with glass reflection */}
        {filteredPayroll.length > 0 && (
          <div className="bg-slate-50/80 dark:bg-[#0c1a14] border-t border-slate-150 dark:border-[#1e3a2f] p-5 flex justify-end">
            <button
              onClick={handleSavePayroll}
              disabled={isSaving}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-5 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-xs cursor-pointer active:scale-98 hover:shadow-[0_4px_15px_rgba(79,70,229,0.25)]"
              id="sync-payroll"
            >
              {isSaving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>{t.saving}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{t.saveBtn}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
        </>
      )}

      {/* 2. One-Time Deductions & Refunds Subtab content */}
      {activeSubTab === 'refunds' && (
        <div className="space-y-6">
          {/* Quick Help Box */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex gap-3 text-indigo-900 mt-6">
            <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1 font-medium">
              <p className="font-bold">एक-बारगी कटौती एवं मासिक रिफंड प्रणाली (Deduction & Refund System Rulebook):</p>
              <p>1. Uniform या Tour जैसी एक-बारगी लगने वाली कटौतियों को दर्ज करें।</p>
              <p>2. प्रत्येक माह की पेरोल गणना में इस राशि का एक निश्चित भाग (मासिक किस्त) कर्मचारी के वेतन में जोड़कर वापस (Refund) कर दिया जाता है।</p>
              <p>3. जैसे ही पेरोल शीट 'Paid' मार्क होती है, शेष रिफंड राशि को घटा दिया जाता है और स्थिति अपडेट हो जाती है।</p>
            </div>
          </div>

          {/* Form and Stats Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* New deduction creation form card */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                <PlusCircle className="w-4 h-4 text-[#03623c]" />
                <span>नयी कटौती और रिफंड योजना जोड़ें</span>
              </h3>

              <form onSubmit={handleAddDeductionPlan} className="space-y-4 font-sans">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">कर्मचारी का चयन करें (Select Employee)</label>
                  <select
                    value={newDeductEmpId}
                    onChange={(e) => setNewDeductEmpId(e.target.value)}
                    required
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-[#03623c] bg-white cursor-pointer"
                  >
                    <option value="">-- चुनें (Choose Employee) --</option>
                    {employees.filter(emp => emp.isActive !== false).map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.id}) - {emp.designation}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">कटौती का प्रकार (Deduction Type)</label>
                  <select
                    value={newDeductType}
                    onChange={(e) => setNewDeductType(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-[#03623c] bg-white cursor-pointer"
                  >
                    <option value="Uniform">Uniform (यूनिफॉर्म चार्ज)</option>
                    <option value="Tour">Tour (दौरा / टूर व्यय)</option>
                    <option value="Other">Other (अन्य कटौती)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">कुल राशि (Total Amount)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={newDeductTotal}
                      onChange={(e) => setNewDeductTotal(Number(e.target.value))}
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-bold font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-[#03623c]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">मासिक किस्त (Monthly Part)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={newDeductInstallment}
                      onChange={(e) => setNewDeductInstallment(Number(e.target.value))}
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-bold font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-[#03623c]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">विवरण / नोट (Description)</label>
                  <textarea
                    rows={2}
                    value={newDeductDesc}
                    onChange={(e) => setNewDeductDesc(e.target.value)}
                    placeholder="जैसे: Winter uniform kit 2026..."
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-[#03623c]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#03623c] hover:bg-[#024d2e] text-white p-3 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs active:scale-98"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>योजना लागू करें (Save Plan)</span>
                </button>
              </form>
            </div>

            {/* Refund list and live progress panel */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col justify-between">
              <div>
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">
                    कटौती वापसी एवं शेष विवरण रिपोर्ट (Active Plans & Outstanding Balances)
                  </h3>
                  <button
                    onClick={downloadRefundReportPDF}
                    className="text-xs font-bold bg-indigo-50 hover:bg-indigo-100 border border-indigo-150 text-indigo-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all active:scale-98"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>Download Report (PDF)</span>
                  </button>
                </div>

                {oneTimeDeductions.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 text-xs font-medium flex flex-col items-center gap-2.5">
                    <RefreshCcw className="w-8 h-8 text-slate-300 animate-spin" />
                    <span>कोई भी सक्रिय योजना नहीं मिली। ऊपर फॉर्म का उपयोग करके एक नई योजना जोड़ें।</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse font-sans">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[10px] uppercase tracking-wider">
                          <th className="py-3 px-4">कर्मचारी (Employee)</th>
                          <th className="py-3 px-4">प्रकार (Type)</th>
                          <th className="py-3 px-4">कुल कटौती</th>
                          <th className="py-3 px-4">किस्त (Monthly)</th>
                          <th className="py-3 px-4">वापस मिला (Refunded)</th>
                          <th className="py-3 px-4">बचा हुआ (Outstanding)</th>
                          <th className="py-3 px-4">स्थिति (Status)</th>
                          <th className="py-3 px-4 text-center">क्रिया</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {oneTimeDeductions.map(d => {
                          const emp = employees.find(e => e.id === d.employeeId);
                          const outstanding = d.totalAmount - d.refundedAmount;
                          const progressPercent = Math.min(100, Math.round((d.refundedAmount / d.totalAmount) * 100));

                          return (
                            <tr key={d.id} className="hover:bg-slate-50/50 transition-colors font-medium">
                              <td className="py-3 px-4">
                                <div className="font-bold text-slate-900">{emp?.name || d.employeeId}</div>
                                <div className="text-[10px] text-slate-400 font-mono font-bold">ID: {d.employeeId}</div>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  d.type === 'Uniform' ? 'bg-amber-50 text-amber-800 border border-amber-100' :
                                  d.type === 'Tour' ? 'bg-indigo-50 text-indigo-800 border border-indigo-100' :
                                  'bg-slate-100 text-slate-800 border border-slate-200'
                                }`}>
                                  {d.type}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-bold font-mono text-slate-800">₹{d.totalAmount}</td>
                              <td className="py-3 px-4 font-bold font-mono text-slate-700">₹{d.monthlyRefundInstallment}</td>
                              <td className="py-3 px-4">
                                <div className="font-bold font-mono text-emerald-700">₹{d.refundedAmount}</div>
                                <div className="w-16 bg-slate-100 h-1 rounded-full overflow-hidden mt-1 p-[0.5px]">
                                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${progressPercent}%` }} />
                                </div>
                              </td>
                              <td className="py-3 px-4 font-black font-mono text-rose-600 bg-rose-50/10">₹{outstanding}</td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                  d.status === 'Fully Refunded' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' :
                                  d.status === 'Partially Refunded' ? 'bg-indigo-50 text-indigo-800 border border-indigo-100' :
                                  'bg-amber-50 text-amber-800 border border-amber-100 animate-pulse'
                                }`}>
                                  {d.status === 'Fully Refunded' ? 'पूर्ण भुगतान' : d.status === 'Partially Refunded' ? 'आंशिक' : 'लंबित'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <button
                                  onClick={() => handleDeleteDeductionPlan(d.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all cursor-pointer"
                                  title="Delete plan"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2026 Ultra-Premium Payslip Modal - Beautifully frosted glass effect with double border & invoice aesthetics */}
      {activePayslip && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto transition-all duration-300">
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-[0_24px_70px_rgba(0,0,0,0.15)] max-w-2xl w-full p-8 space-y-6 relative transition-all duration-300" id="printable-payslip">
            
            {/* Elegant Background Watermark for 2026 feel */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden select-none opacity-[0.015] flex items-center justify-center">
              <Sparkles className="w-96 h-96 text-indigo-900" />
            </div>

            {/* Header / Brand info with distinct luxury styling */}
            <div className="border-b border-slate-200 pb-5 text-center relative">
              <div className="flex items-center justify-center gap-2 mb-1.5">
                <div className="w-6 h-6 rounded bg-indigo-600 text-white flex items-center justify-center font-extrabold text-[10px] shadow-3xs font-display">P</div>
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest font-display">{t.payslipTitle}</h2>
              </div>
              <p className="text-[9px] font-mono text-slate-400 uppercase tracking-widest leading-none">Verified Corporate Cloud Records System</p>
              
              <div className="mt-4 inline-block">
                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100/60 px-4 py-1.5 rounded-full uppercase tracking-wider">{t.payslipHeader}</span>
              </div>
              <p className="text-xs text-slate-500 font-mono font-bold mt-3 bg-slate-50 inline-block px-3 py-1 rounded-md border border-slate-150">{t.payslipMonth}: {selectedMonthYear}</p>
            </div>

            {/* Employee details with crisp grid layouts */}
            <div className="bg-slate-50/80 p-5 rounded-lg border border-slate-200/60 relative">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3.5 flex items-center gap-1">
                <Users className="w-3 h-3 text-indigo-500" />
                <span>{t.payslipEmpDetails}</span>
              </h4>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-xs">
                <div className="space-y-1.5">
                  <p className="text-slate-500 font-medium flex justify-between border-b border-slate-100 pb-1">
                    <span>{t.empId}:</span> 
                    <span className="font-mono font-bold text-slate-900">{activePayslip.employee?.id}</span>
                  </p>
                  <p className="text-slate-500 font-medium flex justify-between border-b border-slate-100 pb-1">
                    <span>{t.empName}:</span> 
                    <span className="font-bold text-slate-900">{activePayslip.employee?.name}</span>
                  </p>
                  <p className="text-slate-500 font-medium flex justify-between pb-0">
                    <span>{t.empDept}:</span> 
                    <span className="font-bold text-slate-900">{activePayslip.employee?.department}</span>
                  </p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-slate-500 font-medium flex justify-between border-b border-slate-100 pb-1">
                    <span>{t.empRole}:</span> 
                    <span className="font-bold text-slate-900">{activePayslip.employee?.designation}</span>
                  </p>
                  <p className="text-slate-500 font-medium flex justify-between border-b border-slate-100 pb-1">
                    <span>{t.joiningDate}:</span> 
                    <span className="font-bold text-slate-800">{activePayslip.employee?.joiningDate}</span>
                  </p>
                  <p className="text-slate-500 font-medium flex justify-between pb-0">
                    <span>{t.paymentMethod}:</span> 
                    <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.2 rounded text-[10px]">{activePayslip.employee?.paymentMethod}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Attendance detailed layout */}
            <div className="bg-indigo-50/40 p-4 rounded-lg border border-indigo-100/50">
              <h4 className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest mb-3 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{t.attendanceBreakdown}</span>
              </h4>
              <div className="grid grid-cols-5 text-center text-xs divide-x divide-indigo-100/30">
                <div className="px-1">
                  <p className="text-slate-400 text-[10px] mb-1 font-bold">{t.attPresent}</p>
                  <p className="font-extrabold text-slate-800 text-sm font-mono">{activePayslip.attendance.present}</p>
                </div>
                <div className="px-1">
                  <p className="text-slate-400 text-[10px] mb-1 font-bold">{t.attHalf}</p>
                  <p className="font-extrabold text-slate-800 text-sm font-mono">{activePayslip.attendance.halfDay}</p>
                </div>
                <div className="px-1">
                  <p className="text-slate-400 text-[10px] mb-1 font-bold">{t.attLeave}</p>
                  <p className="font-extrabold text-slate-800 text-sm font-mono">{activePayslip.attendance.leave}</p>
                </div>
                <div className="px-1">
                  <p className="text-slate-400 text-[10px] mb-1 font-bold">{t.attAbsent}</p>
                  <p className="font-extrabold text-rose-600 text-sm font-mono">{activePayslip.attendance.absent}</p>
                </div>
                <div className="px-1">
                  <p className="text-slate-400 text-[10px] mb-1 font-bold">Overtime</p>
                  <p className="font-extrabold text-[#03623c] text-sm font-mono">{activePayslip.attendance.overtimeHrs} hr</p>
                </div>
              </div>
            </div>

            {/* Financial columns detail setup */}
            <div className="grid grid-cols-1 sm:grid-cols-2 border border-slate-200 rounded-lg overflow-hidden divide-y sm:divide-y-0 sm:divide-x divide-slate-200 text-xs shadow-3xs">
              {/* Earnings column */}
              <div>
                <div className="bg-slate-50 p-3 border-b border-slate-200 font-bold uppercase tracking-wider text-slate-700 text-[10px] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>{t.slipEarnings} (अर्जित भत्ते)</span>
                </div>
                <div className="p-4 space-y-2 text-slate-600">
                  <div className="flex justify-between font-medium pb-1 border-b border-slate-100">
                    <span>Basic Salary (Earned)</span>
                    <span className="font-bold text-slate-800 font-mono">₹{activePayslip.earnedBasic.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>House Rent (HRA)</span>
                    <span className="font-bold text-slate-800 font-mono">₹{(activePayslip.record.hra !== undefined ? activePayslip.record.hra : Math.round(activePayslip.record.basicSalary * 0.40)).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Dearness (DA)</span>
                    <span className="font-bold text-slate-800 font-mono">₹{(activePayslip.record.da || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Conveyance Allowance</span>
                    <span className="font-bold text-slate-800 font-mono">₹{(activePayslip.record.conveyanceAllowance || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Overtime Pay</span>
                    <span className="font-bold text-slate-800 font-mono">₹{activePayslip.record.overtimePay.toLocaleString('en-IN')}</span>
                  </div>
                  {activePayslip.record.festivalBonus > 0 && (
                    <div className="flex justify-between font-bold text-indigo-700 bg-indigo-50/50 px-1.5 py-0.5 rounded">
                      <span>Festival Bonus 🎁</span>
                      <span className="font-mono">₹{activePayslip.record.festivalBonus.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {activePayslip.record.performanceIncentive > 0 && (
                    <div className="flex justify-between font-bold text-emerald-700 bg-emerald-50/50 px-1.5 py-0.5 rounded">
                      <span>Performance Incentive</span>
                      <span className="font-mono">₹{activePayslip.record.performanceIncentive.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {activePayslip.record.leaveAdjustment > 0 && (
                    <div className="flex justify-between font-bold text-blue-700 bg-blue-50/50 px-1.5 py-0.5 rounded">
                      <span>Paid Leave Adjust</span>
                      <span className="font-mono">₹{activePayslip.record.leaveAdjustment.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-dashed border-slate-200 pt-2 font-bold text-slate-800">
                    <span>Gross Salary</span>
                    <span className="font-mono">₹{activePayslip.record.totalSalary.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Deductions column */}
              <div>
                <div className="bg-slate-50 p-3 border-b border-slate-200 font-bold uppercase tracking-wider text-slate-700 text-[10px] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  <span>{t.slipDeductions} (कटौतियां)</span>
                </div>
                <div className="p-4 space-y-2 text-slate-600">
                  <div className="flex justify-between font-medium">
                    <span>Provident Fund (PF 12%)</span>
                    <span className="font-bold text-slate-800 font-mono">₹{(activePayslip.record.providentFund || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Employee Insurance (ESIC)</span>
                    <span className="font-bold text-slate-800 font-mono">₹{(activePayslip.record.esic || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Professional Tax (PT)</span>
                    <span className="font-bold text-slate-800 font-mono">₹{(activePayslip.record.professionalTax || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Income Tax (TDS)</span>
                    <span className="font-bold text-slate-800 font-mono">₹{(activePayslip.record.tds || 0).toLocaleString('en-IN')}</span>
                  </div>
                  {activePayslip.record.advanceDeduction > 0 && (
                    <div className="flex justify-between font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                      <span>Advance Repayment 💸</span>
                      <span className="font-mono">-₹{activePayslip.record.advanceDeduction.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-medium border-t border-dashed border-slate-200 pt-2 font-bold text-rose-600">
                    <span>Total Deductions</span>
                    <span className="font-mono">₹{activePayslip.record.deductions.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Row with outstanding high-fidelity gradients */}
            <div className="bg-slate-900 text-white p-5 rounded-lg flex items-center justify-between shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#03623c]/20 rounded-full blur-2xl"></div>
              <div className="space-y-0.5 relative z-10">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{t.netPayable}</span>
                <p className="text-xxs text-emerald-400 font-bold font-mono uppercase tracking-wider">Computed & Secured Digital Receipt</p>
              </div>
              <span className="text-2xl font-extrabold font-mono text-white relative z-10">₹{(activePayslip.record.netSalary !== undefined ? activePayslip.record.netSalary : activePayslip.record.totalSalary).toLocaleString('en-IN')}</span>
            </div>

            {/* Signature Block with neat typography */}
            <div className="grid grid-cols-2 pt-8 text-xs text-center text-slate-500">
              <div>
                <div className="w-36 mx-auto border-b border-slate-300 pb-1 font-bold text-slate-800">Rajeev Verma</div>
                <p className="mt-1.5 font-bold text-[10px] text-slate-400 uppercase tracking-widest">{t.authorizedSign}</p>
              </div>
              <div>
                <div className="w-36 mx-auto border-b border-slate-300 pb-1 min-h-[16px]"></div>
                <p className="mt-1.5 font-bold text-[10px] text-slate-400 uppercase tracking-widest">{t.receiptSign}</p>
              </div>
            </div>

            {/* Control panel buttons for modal */}
            <div className="border-t border-slate-100 pt-5 flex justify-end gap-2.5 no-print">
              <button
                onClick={() => downloadPayslipPDF(activePayslip.record, activePayslip.employee)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-3xs active:scale-97"
                title="Download Professional PDF slip"
              >
                <FileText className="w-3.5 h-3.5 text-white" />
                <span>Download PDF (पीडीएफ डाउनलोड)</span>
              </button>
              <button
                onClick={handlePrint}
                className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-3xs active:scale-97"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>{t.printSlip}</span>
              </button>
              <button
                onClick={() => setActivePayslip(null)}
                className="bg-slate-900 hover:bg-slate-850 text-white px-5 py-2.5 rounded-lg text-xs font-bold transition-all shadow-3xs cursor-pointer active:scale-97"
              >
                <span>{t.closeSlip}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 2026 Live Manual Salary Adjustment Modal */}
      {isAdjustModalOpen && editingRecord && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-[0_24px_70px_rgba(0,0,0,0.18)] max-w-2xl w-full p-6 space-y-5 relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest">
                  {language === 'en' ? 'Adjust Salary Structure' : 'वेतन संरचना समायोजन'}
                </h3>
              </div>
              <button 
                onClick={() => {
                  setIsAdjustModalOpen(false);
                  setEditingRecord(null);
                }} 
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/60 flex justify-between items-center text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Employee</span>
                <span className="font-extrabold text-slate-900 text-sm">
                  {employees.find(e => e.id === editingRecord.employeeId)?.name || editingRecord.employeeId}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Payroll Month</span>
                <span className="font-bold text-slate-700 font-mono">{editingRecord.monthYear}</span>
              </div>
            </div>

            <form onSubmit={handleSaveAdjustment} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                
                {/* Allowances block */}
                <div className="space-y-3 bg-emerald-50/20 p-3 rounded-lg border border-emerald-100/40">
                  <h4 className="font-bold text-emerald-800 uppercase tracking-wider text-[10px] flex items-center gap-1 border-b border-emerald-100/40 pb-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Allowances & Earnings (अर्जित भत्ते)</span>
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Basic Pay (अर्जित मूल वेतन)</label>
                      <input 
                        type="number" 
                        value={editingRecord.basicSalary} 
                        onChange={(e) => handleAdjustmentChange('basicSalary', Number(e.target.value))}
                        className="w-full border border-slate-200 rounded px-2.5 py-1 font-mono text-xs font-bold bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Overtime Pay (ओवरटाइम)</label>
                      <input 
                        type="number" 
                        value={editingRecord.overtimePay} 
                        onChange={(e) => handleAdjustmentChange('overtimePay', Number(e.target.value))}
                        className="w-full border border-slate-200 rounded px-2.5 py-1 font-mono text-xs font-bold bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">HRA (मकान किराया)</label>
                      <input 
                        type="number" 
                        value={editingRecord.hra !== undefined ? editingRecord.hra : Math.round(editingRecord.basicSalary * 0.40)} 
                        onChange={(e) => handleAdjustmentChange('hra', Number(e.target.value))}
                        className="w-full border border-slate-200 rounded px-2.5 py-1 font-mono text-xs font-bold bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Dearness (DA भत्त्ता)</label>
                      <input 
                        type="number" 
                        value={editingRecord.da || 0} 
                        onChange={(e) => handleAdjustmentChange('da', Number(e.target.value))}
                        className="w-full border border-slate-200 rounded px-2.5 py-1 font-mono text-xs font-bold bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Conveyance (यातायात)</label>
                      <input 
                        type="number" 
                        value={editingRecord.conveyanceAllowance || 0} 
                        onChange={(e) => handleAdjustmentChange('conveyanceAllowance', Number(e.target.value))}
                        className="w-full border border-slate-200 rounded px-2.5 py-1 font-mono text-xs font-bold bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Festival Bonus (बोनस)</label>
                      <input 
                        type="number" 
                        value={editingRecord.festivalBonus || 0} 
                        onChange={(e) => handleAdjustmentChange('festivalBonus', Number(e.target.value))}
                        className="w-full border border-slate-200 rounded px-2.5 py-1 font-mono text-xs font-bold bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Incentive (प्रोत्साहन)</label>
                      <input 
                        type="number" 
                        value={editingRecord.performanceIncentive || 0} 
                        onChange={(e) => handleAdjustmentChange('performanceIncentive', Number(e.target.value))}
                        className="w-full border border-slate-200 rounded px-2.5 py-1 font-mono text-xs font-bold bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Paid Leave Credit</label>
                      <input 
                        type="number" 
                        value={editingRecord.leaveAdjustment || 0} 
                        onChange={(e) => handleAdjustmentChange('leaveAdjustment', Number(e.target.value))}
                        className="w-full border border-slate-200 rounded px-2.5 py-1 font-mono text-xs font-bold bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Deductions block */}
                <div className="space-y-3 bg-rose-50/20 p-3 rounded-lg border border-rose-100/40">
                  <h4 className="font-bold text-rose-800 uppercase tracking-wider text-[10px] flex items-center gap-1 border-b border-rose-100/40 pb-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Statutory & Personal Deductions (कटौतियां)</span>
                  </h4>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Provident Fund (PF)</label>
                      <input 
                        type="number" 
                        value={editingRecord.providentFund || 0} 
                        onChange={(e) => handleAdjustmentChange('providentFund', Number(e.target.value))}
                        className="w-full border border-slate-200 rounded px-2.5 py-1 font-mono text-xs font-bold bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">State Insurance (ESIC)</label>
                      <input 
                        type="number" 
                        value={editingRecord.esic || 0} 
                        onChange={(e) => handleAdjustmentChange('esic', Number(e.target.value))}
                        className="w-full border border-slate-200 rounded px-2.5 py-1 font-mono text-xs font-bold bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Professional Tax (PT)</label>
                      <input 
                        type="number" 
                        value={editingRecord.professionalTax || 0} 
                        onChange={(e) => handleAdjustmentChange('professionalTax', Number(e.target.value))}
                        className="w-full border border-slate-200 rounded px-2.5 py-1 font-mono text-xs font-bold bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Income Tax (TDS)</label>
                      <input 
                        type="number" 
                        value={editingRecord.tds || 0} 
                        onChange={(e) => handleAdjustmentChange('tds', Number(e.target.value))}
                        className="w-full border border-slate-200 rounded px-2.5 py-1 font-mono text-xs font-bold bg-white"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Advance EMI Repayment (एडवांस सैलरी किस्त)</label>
                      <input 
                        type="number" 
                        value={editingRecord.advanceDeduction || 0} 
                        onChange={(e) => handleAdjustmentChange('advanceDeduction', Number(e.target.value))}
                        className="w-full border border-slate-200 rounded px-2.5 py-1 font-mono text-xs font-bold bg-white"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Dynamic Live Net Recalculator Ledger bar */}
              <div className="bg-slate-900 text-white rounded-lg p-4 grid grid-cols-3 text-center divide-x divide-slate-800">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Gross Salary</span>
                  <span className="font-mono text-sm font-extrabold text-slate-200">₹{editingRecord.totalSalary.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Total Deducts</span>
                  <span className="font-mono text-sm font-extrabold text-rose-400">₹{editingRecord.deductions.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Net Take-Home Salary</span>
                  <span className="font-mono text-sm font-extrabold text-emerald-400">
                    ₹{(editingRecord.netSalary !== undefined ? editingRecord.netSalary : (editingRecord.totalSalary - editingRecord.deductions)).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Footer controls */}
              <div className="border-t border-slate-100 pt-4 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdjustModalOpen(false);
                    setEditingRecord(null);
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  {language === 'en' ? 'Cancel' : 'रद्द करें'}
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-3xs hover:shadow-[0_4px_12px_rgba(79,70,229,0.2)]"
                >
                  {language === 'en' ? 'Apply Adjustments' : 'समायोजन लागू करें'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* WhatsApp Automation Dispatch Modal */}
      {adminSettings && (
        <WhatsAppModal
          isOpen={waModalOpen}
          onClose={() => setWaModalOpen(false)}
          settings={adminSettings}
          recipient={waRecipient}
          defaultCategory={waCategory}
          variables={waVars}
        />
      )}

      {/* Master Attendance & Salary Sheet Modal */}
      <MasterAttendanceSalarySheetModal
        isOpen={isMasterSheetOpen}
        onClose={() => setIsMasterSheetOpen(false)}
        employees={employees}
        attendanceRecords={attendanceRecords}
        payrollRecords={payrollRecords}
        initialMonthYear={selectedMonthYear}
        language={language}
      />
    </div>
  );
}
