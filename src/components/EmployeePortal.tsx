import React, { useState } from 'react';
import { 
  User, Calendar, CreditCard, Check, Printer, FileText, AlertCircle, 
  TrendingUp, Users, ShieldCheck, Building, Sparkles, MapPin, Briefcase, Phone, Mail, FileCheck, DollarSign,
  CalendarDays, Plus
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Employee, Attendance, PayrollRecord, AdminSettings } from '../types';
import LeavesHolidays from './LeavesHolidays';
import { isAttendanceLate, isAttendanceEarlyGoing } from '../utils/shift';
import MonthlyCalendarReport from './MonthlyCalendarReport';

interface EmployeePortalProps {
  employee: Employee;
  attendanceRecords: Attendance[];
  payrollRecords: PayrollRecord[];
  language: 'en' | 'hi';
  adminSettings: AdminSettings;
  onUpdateAttendanceRecords?: (records: Attendance[]) => Promise<void>;
}

export default function EmployeePortal({ 
  employee, 
  attendanceRecords, 
  payrollRecords, 
  language, 
  adminSettings,
  onUpdateAttendanceRecords
}: EmployeePortalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'attendance' | 'payslips' | 'exceptions' | 'leaves' | 'calendar'>('profile');
  const [attendanceYear, setAttendanceYear] = useState<string>(new Date().getFullYear().toString());
  const [attendanceMonth, setAttendanceMonth] = useState<string>(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [activePayslip, setActivePayslip] = useState<any | null>(null);

  // Miss punch ticket raising states
  const [showRaiseModal, setShowRaiseModal] = useState(false);
  const [raiseDate, setRaiseDate] = useState('');
  const [raiseCheckIn, setRaiseCheckIn] = useState('09:00');
  const [raiseCheckOut, setRaiseCheckOut] = useState('18:00');
  const [raiseRemarks, setRaiseRemarks] = useState('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [ticketError, setTicketError] = useState('');
  const [ticketSuccess, setTicketSuccess] = useState('');

  const handleRaiseTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setTicketError('');
    setTicketSuccess('');

    if (!raiseDate) {
      setTicketError(language === 'en' ? 'Please select a date' : 'कृपया तिथि चुनें');
      return;
    }

    setIsSubmittingTicket(true);
    try {
      if (onUpdateAttendanceRecords) {
        const newRecord: Attendance = {
          date: raiseDate,
          employeeId: employee.id,
          status: 'Miss Punch',
          checkIn: raiseCheckIn,
          checkOut: raiseCheckOut,
          overtimeHours: 0,
          remarks: raiseRemarks,
          approvalStatus: 'Pending'
        };

        await onUpdateAttendanceRecords([newRecord]);
        setTicketSuccess(language === 'en' ? 'Missed punch ticket raised successfully!' : 'मिस पंच टिकट सफलतापूर्वक दर्ज कर लिया गया है!');
        setTimeout(() => {
          setShowRaiseModal(false);
          setTicketSuccess('');
          setRaiseRemarks('');
        }, 1800);
      } else {
        setTicketError('Update handler not registered on the portal.');
      }
    } catch (err) {
      console.error(err);
      setTicketError(language === 'en' ? 'Failed to raise ticket' : 'टिकट दर्ज करने में विफल');
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  const t = {
    en: {
      profile: language === 'en' ? "My Profile" : "मेरी प्रोफ़ाइल",
      attendance: language === 'en' ? "Attendance Log" : "उपस्थिति लॉग",
      payslips: language === 'en' ? "My Salary Slips" : "मेरी सैलरी स्लिप",
      exceptions: language === 'en' ? "My Exceptions" : "मेरी विसंगतियां",
      leaves: language === 'en' ? "Leaves & Holidays" : "अवकाश और छुट्टियां",
      calendar: language === 'en' ? "Calendar Report" : "कैलेंडर रिपोर्ट",
      personalInfo: "Personal & Contact Information",
      bankingInfo: "Bank Account Details",
      statutoryInfo: "Statutory Registry & IDs",
      addresses: "Residential & Permanent Addresses",
      employmentInfo: "Employment Status & Structure",
      salaryStructure: "Standard Salary Structure",
      id: "ID",
      name: "Full Name",
      email: "Official Email",
      personalEmail: "Personal Email",
      phone: "Mobile",
      emergencyContact: "Emergency Contact",
      dob: "Date of Birth",
      bloodGroup: "Blood Group",
      gender: "Gender",
      joiningDate: "Joining Date",
      department: "Department",
      designation: "Designation",
      paymentMethod: "Payment Method",
      basicSalary: "Basic Salary",
      allowances: "Standard Allowances",
      deductions: "Standard Deductions",
      hourlyRate: "Overtime Hourly Rate",
      branch: "Work Branch",
      reportingTo: "Reporting Manager",
      employmentType: "Employment Type",
      accHolder: "Account Holder Name",
      bankName: "Bank Name",
      accNo: "Account Number",
      ifsc: "IFSC Code",
      pan: "PAN Number",
      aadhaar: "Aadhaar Card No",
      uan: "UAN (Universal Account No)",
      pfAcc: "PF Account Number",
      esicAcc: "ESIC Number",
      resAddress: "Residential Address",
      permAddress: "Permanent Address",
      notSpecified: "Not Specified",
      calendarDays: "Calendar Days",
      workedDays: "Effective Worked Days",
      presentDays: "Days Present",
      halfDays: "Half Days",
      leaveDays: "Paid Leaves",
      absentDays: "Days Absent",
      overtimeHrs: "Total Overtime",
      selectPeriod: "Select Attendance Period",
      date: "Date",
      status: "Status",
      checkIn: "Check In",
      checkOut: "Check Out",
      overtime: "Overtime",
      remarks: "Remarks",
      monthYear: "Month-Year",
      grossSalary: "Gross Earnings",
      netSalary: "Net Payout",
      paymentStatus: "Payment Status",
      actions: "Actions",
      payslipHeader: "EMPLOYEE SALARY SLIP",
      payslipTitle: "Rathi Build Mart Payroll System",
      payslipMonth: "Salary Month/Year",
      payslipEmpDetails: "Employee Information",
      slipEarnings: "Salary Allowances (Earnings)",
      slipDeductions: "Statutory Deductions",
      netPayable: "Net Payable Amount",
      authorizedSign: "Authorized Signatory",
      receiptSign: "Employee Signature",
      attendanceBreakdown: "Attendance Breakdown",
      printSlip: "Print Payslip",
      closeSlip: "Close",
      downloadPDF: "Download PDF",
      paid: "Paid",
      pending: "Pending",
      noPayslips: "No payroll slips generated for you yet. Contact human resources for salary run computations.",
      noAttendance: "No attendance logs found for this period.",
      noExceptions: "No missed punch or half-day logs found. You are all caught up!",
      exceptionType: "Log Type",
      approvalStatus: "Approval Status",
      adminRemarks: "Approver Notes / Remarks"
    }
  }['en'];

  // Helper arrays
  const YEARS = ['2025', '2026', '2027', '2028'];
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

  // Selected period formatting
  const selectedPeriod = `${attendanceYear}-${attendanceMonth}`;

  // Filter attendance for the logged-in employee & selected period
  const empAttendanceList = attendanceRecords
    .filter(r => r.employeeId === employee.id && r.date.startsWith(selectedPeriod))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Compute attendance stats
  const daysPresent = empAttendanceList.filter(r => r.status === 'Present').length;
  const daysHalfDay = empAttendanceList.filter(r => r.status === 'Half Day').length;
  const daysLeave = empAttendanceList.filter(r => r.status === 'Leave').length;
  const daysAbsent = empAttendanceList.filter(r => r.status === 'Absent').length;
  const workedDays = daysPresent + (0.5 * daysHalfDay) + daysLeave;
  const overtimeHoursTotal = empAttendanceList.reduce((sum, curr) => sum + (curr.overtimeHours || 0), 0);

  // Filter payroll records for this employee
  const empPayslips = payrollRecords
    .filter(r => r.employeeId === employee.id)
    .sort((a, b) => b.monthYear.localeCompare(a.monthYear));

  // Open active payslip details
  const handleOpenPayslip = (record: PayrollRecord) => {
    const periodStr = record.monthYear;
    const periodAtt = attendanceRecords.filter(r => r.employeeId === employee.id && r.date.startsWith(periodStr));

    const pDays = periodAtt.filter(r => r.status === 'Present').length;
    const hDays = periodAtt.filter(r => r.status === 'Half Day').length;
    const lDays = periodAtt.filter(r => r.status === 'Leave').length;
    const aDays = periodAtt.filter(r => r.status === 'Absent').length;
    const oHours = periodAtt.reduce((sum, curr) => sum + (curr.overtimeHours || 0), 0);

    const workedVal = pDays + (0.5 * hDays) + lDays;
    const workingDaysCount = 26; // assume standard 26 days
    const earnedRatio = Math.min(1, workedVal / workingDaysCount);
    const earnedBasic = Math.round(record.basicSalary * (workedVal === 0 ? 0 : earnedRatio));

    setActivePayslip({
      record,
      employee,
      attendance: {
        present: pDays,
        halfDay: hDays,
        leave: lDays,
        absent: aDays,
        overtimeHrs: oHours
      },
      earnedBasic,
      periodName: record.monthYear
    });
  };

  // PDF Generation Helper (same as admin's export style)
  const downloadPayslipPDF = (record: PayrollRecord, emp: Employee) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const navyColor = [15, 23, 42]; // Slate-900 theme
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
    doc.text(`Employee Name: ${emp.name || 'N/A'}`, 10, 50);
    doc.text(`Designation: ${emp.designation || 'N/A'}`, 10, 55);
    doc.text(`Department: ${emp.department || 'N/A'}`, 10, 60);
    doc.text(`Joining Date: ${emp.joiningDate || 'N/A'}`, 10, 65);

    // Column 2
    doc.text(`Bank Account No: ${emp.bankAccountNo || 'N/A'}`, 110, 45);
    doc.text(`Bank Name: ${emp.bankName || 'N/A'}`, 110, 50);
    doc.text(`IFSC Code: ${emp.ifscCode || 'N/A'}`, 110, 55);
    doc.text(`PAN Number: ${emp.panNo || 'N/A'}`, 110, 60);
    doc.text(`UAN / PF Number: ${emp.uan || emp.pfAccountNo || 'N/A'}`, 110, 65);

    doc.line(10, 70, 200, 70);

    // Attendance Overview for PDF
    const periodAtt = attendanceRecords.filter(r => r.employeeId === employee.id && r.date.startsWith(record.monthYear));
    const pDays = periodAtt.filter(r => r.status === 'Present').length;
    const hDays = periodAtt.filter(r => r.status === 'Half Day').length;
    const lDays = periodAtt.filter(r => r.status === 'Leave').length;
    const workedDaysVal = pDays + (0.5 * hDays) + lDays;
    
    doc.setFont('Helvetica', 'bold');
    doc.text('ATTENDANCE RECORD', 10, 76);
    doc.setFont('Helvetica', 'normal');
    doc.text('Calendar Days: 26 Days', 10, 81);
    doc.text(`Days Present: ${pDays} Days`, 55, 81);
    doc.text(`Paid Leaves: ${lDays} Days`, 105, 81);
    doc.text(`Effective Worked: ${workedDaysVal} Days`, 155, 81);

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
    const standardAllowances = emp.allowances || 0;

    const pf = record.providentFund !== undefined ? record.providentFund : Math.round(record.basicSalary * 0.12);
    const esic = record.esic !== undefined ? record.esic : 0;
    const pt = record.professionalTax !== undefined ? record.professionalTax : 0;
    const tds = record.tds !== undefined ? record.tds : 0;
    const advDec = record.advanceDeduction !== undefined ? record.advanceDeduction : 0;
    const standardDeductions = emp.deductions || 0;

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

    doc.save(`Payslip_${emp.name.replace(/\s+/g, '_')}_${record.monthYear}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* 2026 Premium Employee Header banner */}
      <div className="relative bg-slate-900 overflow-hidden rounded-2xl p-6 md:p-8 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        <div className="absolute bottom-0 left-10 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>

        <div className="flex items-center gap-5 relative z-10">
          {employee.photoUrl ? (
            <img 
              src={employee.photoUrl} 
              alt={employee.name} 
              className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover border-2 border-emerald-500/30 shadow-md"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-indigo-600 text-white font-black text-2xl flex items-center justify-center border-2 border-emerald-500/30">
              {employee.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
            </div>
          )}
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest">
              <ShieldCheck className="w-3 h-3" />
              <span>Employee Access Portal</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight">{employee.name}</h1>
            <p className="text-xs text-slate-400 font-bold font-mono">
              ID: {employee.id} <span className="text-slate-600">•</span> {employee.designation} <span className="text-slate-600">•</span> {employee.department}
            </p>
          </div>
        </div>

        {/* Portal Quick Action Navigation */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 relative z-10 w-full md:w-auto justify-center md:justify-end">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-2.5 sm:px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center sm:justify-start gap-2 cursor-pointer w-full sm:w-auto ${
              activeTab === 'profile' 
                ? 'bg-emerald-600 text-white shadow-md' 
                : 'bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/50'
            }`}
          >
            <User className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{t.profile}</span>
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-3 py-2.5 sm:px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center sm:justify-start gap-2 cursor-pointer w-full sm:w-auto ${
              activeTab === 'attendance' 
                ? 'bg-emerald-600 text-white shadow-md' 
                : 'bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/50'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{t.attendance}</span>
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-3 py-2.5 sm:px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center sm:justify-start gap-2 cursor-pointer w-full sm:w-auto ${
              activeTab === 'calendar' 
                ? 'bg-emerald-600 text-white shadow-md' 
                : 'bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/50'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{t.calendar}</span>
          </button>
          <button
            onClick={() => setActiveTab('exceptions')}
            className={`px-3 py-2.5 sm:px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center sm:justify-start gap-1.5 cursor-pointer w-full sm:w-auto ${
              activeTab === 'exceptions' 
                ? 'bg-emerald-600 text-white shadow-md' 
                : 'bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/50'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{t.exceptions}</span>
            {attendanceRecords.filter(r => r.employeeId === employee.id && (r.status === 'Miss Punch' || r.status === 'Half Day') && (r.approvalStatus || 'Pending') === 'Pending').length > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping shrink-0"></span>
            )}
          </button>
          {adminSettings.enableEmployeePayslips === true && (
            <button
              onClick={() => setActiveTab('payslips')}
              className={`px-3 py-2.5 sm:px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center sm:justify-start gap-2 cursor-pointer w-full sm:w-auto ${
                activeTab === 'payslips' 
                  ? 'bg-emerald-600 text-white shadow-md' 
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/50'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{t.payslips}</span>
            </button>
          )}
          <button
            onClick={() => setActiveTab('leaves')}
            className={`px-3 py-2.5 sm:px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center sm:justify-start gap-2 cursor-pointer w-full sm:w-auto ${
              activeTab === 'leaves' 
                ? 'bg-emerald-600 text-white shadow-md' 
                : 'bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/50'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{t.leaves}</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="space-y-6">

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Column 1: Personal & Contacts */}
            <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-xl shadow-xs space-y-4 sm:space-y-5 lg:col-span-2">
              <div className="flex items-center gap-2 pb-2.5 sm:pb-3 border-b border-slate-100">
                <div className="w-6.5 h-6.5 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                  <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider leading-tight">{t.personalInfo}</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.name}</label>
                  <p className="mt-1 font-bold text-slate-800 text-sm">{employee.name}</p>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.id}</label>
                  <p className="mt-1 font-bold font-mono text-slate-800 text-sm">{employee.id}</p>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.email}</label>
                  <p className="mt-1 font-bold text-slate-800 text-sm">{employee.email || t.notSpecified}</p>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.personalEmail}</label>
                  <p className="mt-1 font-bold text-slate-800 text-sm">{employee.personalEmail || t.notSpecified}</p>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.phone}</label>
                  <p className="mt-1 font-bold text-slate-800 text-sm font-mono">{employee.mobileNo || t.notSpecified}</p>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.emergencyContact}</label>
                  <p className="mt-1 font-bold text-slate-800 text-sm font-mono">{employee.emergencyContactNo || t.notSpecified}</p>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.dob}</label>
                  <p className="mt-1 font-bold text-slate-800 text-sm font-mono">{employee.dob || t.notSpecified}</p>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.bloodGroup}</label>
                  <p className="mt-1 font-bold text-slate-800 text-sm">{employee.bloodGroup || t.notSpecified}</p>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.gender}</label>
                  <p className="mt-1 font-bold text-slate-800 text-sm">{employee.gender || t.notSpecified}</p>
                </div>
              </div>

              {/* Residential & Permanent Addresses */}
              <div className="border-t border-slate-100 pt-5 space-y-4">
                <div className="flex items-center gap-2 pb-1">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">{t.addresses}</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.resAddress}</label>
                    <p className="mt-1.5 text-slate-700 leading-relaxed font-semibold">
                      {employee.resLine1 ? (
                        <>
                          {employee.resLine1}, {employee.resLine2 && `${employee.resLine2}, `}
                          {employee.resCity}, {employee.resState} - {employee.resPinCode}
                        </>
                      ) : t.notSpecified}
                    </p>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.permAddress}</label>
                    <p className="mt-1.5 text-slate-700 leading-relaxed font-semibold">
                      {employee.permLine1 ? (
                        <>
                          {employee.permLine1}, {employee.permLine2 && `${employee.permLine2}, `}
                          {employee.permCity}, {employee.permState} - {employee.permPinCode}
                        </>
                      ) : t.notSpecified}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: Salary Structure, Banking, and Statutory info */}
            <div className="space-y-6">
              
              {/* Standard Salary Structure */}
              <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-xl shadow-xs space-y-3.5 sm:space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <div className="w-6.5 h-6.5 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                    <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider leading-tight">{t.salaryStructure}</h3>
                </div>
                <div className="space-y-2.5 text-xs font-semibold text-slate-700">
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                    <span className="text-slate-500 font-bold">{t.basicSalary}</span>
                    <span className="font-mono text-slate-950 font-extrabold text-sm">₹{employee.basicSalary.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                    <span className="text-slate-500 font-bold">{t.allowances}</span>
                    <span className="font-mono text-emerald-700 font-extrabold">₹{employee.allowances.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                    <span className="text-slate-500 font-bold">{t.deductions}</span>
                    <span className="font-mono text-rose-600 font-extrabold">₹{employee.deductions.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                    <span className="text-slate-500 font-bold">{t.hourlyRate}</span>
                    <span className="font-mono text-slate-800 font-bold">₹{employee.hourlyRate || 150}/hr</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-slate-500 font-bold">{t.paymentMethod}</span>
                    <span className="bg-emerald-50 text-emerald-800 text-[10px] px-2 py-0.5 rounded border border-emerald-100 font-extrabold">{employee.paymentMethod}</span>
                  </div>
                </div>
              </div>

              {/* Bank Account details */}
              <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-xl shadow-xs space-y-3.5 sm:space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <div className="w-6.5 h-6.5 sm:w-8 sm:h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold shrink-0">
                    <Building className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider leading-tight">{t.bankingInfo}</h3>
                </div>
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.accHolder}</span>
                    <p className="font-extrabold text-slate-800 mt-0.5">{employee.bankAccountHolderName || employee.name}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.bankName}</span>
                    <p className="font-extrabold text-slate-800 mt-0.5">{employee.bankName || t.notSpecified}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.accNo}</span>
                      <p className="font-mono font-extrabold text-slate-800 mt-0.5 truncate">{employee.bankAccountNo || t.notSpecified}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.ifsc}</span>
                      <p className="font-mono font-extrabold text-slate-800 mt-0.5">{employee.ifscCode || t.notSpecified}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Statutory Registry */}
              <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-xl shadow-xs space-y-3.5 sm:space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <div className="w-6.5 h-6.5 sm:w-8 sm:h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold shrink-0">
                    <FileCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider leading-tight">{t.statutoryInfo}</h3>
                </div>
                <div className="space-y-2.5 text-xs font-semibold text-slate-700">
                  <div className="flex justify-between items-center py-1 border-b border-slate-50">
                    <span className="text-slate-500 font-bold">{t.pan}</span>
                    <span className="font-mono text-slate-900 font-bold uppercase">{employee.panNo || t.notSpecified}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-50">
                    <span className="text-slate-500 font-bold">{t.aadhaar}</span>
                    <span className="font-mono text-slate-900 font-bold">{employee.aadhaarNo || t.notSpecified}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-50">
                    <span className="text-slate-500 font-bold">{t.uan}</span>
                    <span className="font-mono text-slate-900 font-bold">{employee.uan || t.notSpecified}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500 font-bold">{t.pfAcc}</span>
                    <span className="font-mono text-slate-900 font-bold">{employee.pfAccountNo || t.notSpecified}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ATTENDANCE TAB */}
        {activeTab === 'attendance' && (
          <div className="space-y-6">
            
            {/* Range selection dock */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-end justify-between gap-5">
              <div className="flex flex-col sm:flex-row gap-4 items-center flex-1 max-w-xl">
                
                {/* Year picker */}
                <div className="w-full sm:w-1/2 space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Year</label>
                  <select
                    value={attendanceYear}
                    onChange={(e) => setAttendanceYear(e.target.value)}
                    className="w-full appearance-none border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white cursor-pointer"
                  >
                    {YEARS.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                {/* Month picker */}
                <div className="w-full sm:w-1/2 space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Month</label>
                  <select
                    value={attendanceMonth}
                    onChange={(e) => setAttendanceMonth(e.target.value)}
                    className="w-full appearance-none border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white cursor-pointer"
                  >
                    {MONTHS.map(m => (
                      <option key={m.value} value={m.value}>
                        {language === 'en' ? m.name : m.hindi}
                      </option>
                    ))}
                  </select>
                </div>

              </div>

              <div className="text-xs font-bold text-slate-500 bg-slate-50 border border-slate-200/60 px-4 py-2.5 rounded-lg">
                Showing logs for: <span className="text-emerald-700">{selectedPeriod}</span>
              </div>
            </div>

            {/* Attendance Analytics summary block */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-xxs">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.presentDays}</span>
                <p className="text-2xl font-black text-emerald-600 font-mono mt-1">{daysPresent}</p>
              </div>
              <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-xxs">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.halfDays}</span>
                <p className="text-2xl font-black text-amber-500 font-mono mt-1">{daysHalfDay}</p>
              </div>
              <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-xxs">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.leaveDays}</span>
                <p className="text-2xl font-black text-blue-500 font-mono mt-1">{daysLeave}</p>
              </div>
              <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-xxs">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.absentDays}</span>
                <p className="text-2xl font-black text-rose-500 font-mono mt-1">{daysAbsent}</p>
              </div>
              <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-xxs col-span-2 md:col-span-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.overtimeHrs}</span>
                <p className="text-2xl font-black text-slate-800 font-mono mt-1">{overtimeHoursTotal} hrs</p>
              </div>
            </div>

            {/* Daily log table */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
              {empAttendanceList.length > 0 ? (
                <div>
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <th className="py-3 px-6">{t.date}</th>
                          <th className="py-3 px-6">{t.status}</th>
                          <th className="py-3 px-6">{t.checkIn}</th>
                          <th className="py-3 px-6">{t.checkOut}</th>
                          <th className="py-3 px-6">{t.overtime}</th>
                          <th className="py-3 px-6">{t.remarks}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {empAttendanceList.map((rec) => {
                          const isLate = isAttendanceLate(rec, employee.workTiming, adminSettings?.defaultCheckIn || '09:00');
                          const isEarly = isAttendanceEarlyGoing(rec, employee.workTiming, adminSettings?.defaultCheckOut || '18:00');

                          return (
                            <tr key={rec.date} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-3 px-6 font-mono font-bold text-slate-900">{rec.date}</td>
                              <td className="py-3 px-6">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                  rec.status === 'Present' 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                    : rec.status === 'Half Day' 
                                      ? 'bg-amber-50 text-amber-700 border-amber-100'
                                      : rec.status === 'Leave' 
                                        ? 'bg-blue-50 text-blue-700 border-blue-100'
                                        : 'bg-rose-50 text-rose-700 border-rose-100'
                                }`}>
                                  {rec.status}
                                </span>
                              </td>
                              <td className="py-3 px-6 font-mono text-slate-700">
                                <div className="flex flex-col">
                                  <span>{rec.checkIn || '--:--'}</span>
                                  {isLate && (
                                    <span className="text-[9px] text-rose-500 font-extrabold flex items-center gap-0.5 mt-0.5">
                                      <span className="w-1 h-1 rounded-full bg-rose-500 animate-pulse"></span>
                                      <span>{language === 'en' ? 'Late' : 'देरी'}</span>
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-6 font-mono text-slate-700">
                                <div className="flex flex-col">
                                  <span>{rec.checkOut || '--:--'}</span>
                                  {isEarly && (
                                    <span className="text-[9px] text-amber-500 font-extrabold flex items-center gap-0.5 mt-0.5">
                                      <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse"></span>
                                      <span>{language === 'en' ? 'Early' : 'जल्दी'}</span>
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-6 font-mono text-slate-700">
                                {rec.overtimeHours ? `${rec.overtimeHours} hrs` : '--'}
                              </td>
                              <td className="py-3 px-6 text-slate-500 italic max-w-xs truncate">{rec.remarks || '--'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="block md:hidden divide-y divide-slate-100">
                    {empAttendanceList.map((rec) => {
                      const isLate = isAttendanceLate(rec, employee.workTiming, adminSettings?.defaultCheckIn || '09:00');
                      const isEarly = isAttendanceEarlyGoing(rec, employee.workTiming, adminSettings?.defaultCheckOut || '18:00');

                      return (
                        <div key={rec.date} className="p-4 hover:bg-slate-50/50 transition-colors space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-black text-slate-900 text-sm">{rec.date}</span>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              rec.status === 'Present' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                : rec.status === 'Half Day' 
                                  ? 'bg-amber-50 text-amber-700 border-amber-100'
                                  : rec.status === 'Leave' 
                                    ? 'bg-blue-50 text-blue-700 border-blue-100'
                                    : 'bg-rose-50 text-rose-700 border-rose-100'
                            }`}>
                              {rec.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">In Time</span>
                              <div className="font-mono text-slate-700 font-bold mt-0.5 flex items-center gap-1.5">
                                <span>{rec.checkIn || '--:--'}</span>
                                {isLate && (
                                  <span className="text-[9px] bg-rose-50 text-rose-500 border border-rose-100 px-1 py-0.2 rounded font-extrabold">
                                    {language === 'en' ? 'Late' : 'देरी'}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Out Time</span>
                              <div className="font-mono text-slate-700 font-bold mt-0.5 flex items-center gap-1.5">
                                <span>{rec.checkOut || '--:--'}</span>
                                {isEarly && (
                                  <span className="text-[9px] bg-amber-50 text-amber-500 border border-amber-100 px-1 py-0.2 rounded font-extrabold">
                                    {language === 'en' ? 'Early' : 'जल्दी'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {(rec.overtimeHours || rec.remarks) && (
                            <div className="bg-slate-50 p-2.5 rounded-lg text-[11px] space-y-1">
                              {rec.overtimeHours ? (
                                <div className="flex justify-between">
                                  <span className="text-slate-500 font-semibold">Overtime:</span>
                                  <span className="font-mono font-bold text-slate-700">{rec.overtimeHours} hrs</span>
                                </div>
                              ) : null}
                              {rec.remarks ? (
                                <div className="text-slate-500 italic">
                                  <span className="font-semibold not-italic text-slate-600">Notes: </span>{rec.remarks}
                                </div>
                              ) : null}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <AlertCircle className="w-10 h-10 mx-auto text-slate-200 mb-2" />
                  <p className="text-xs font-bold">{t.noAttendance}</p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* PAYSLIPS TAB */}
        {adminSettings.enableEmployeePayslips === true && activeTab === 'payslips' && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            {empPayslips.length > 0 ? (
              <div>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <th className="py-4 px-6">{t.monthYear}</th>
                        <th className="py-4 px-6">{t.basicSalary}</th>
                        <th className="py-4 px-6">{t.grossSalary}</th>
                        <th className="py-4 px-6">{t.slipDeductions}</th>
                        <th className="py-4 px-6 font-bold text-slate-800">{t.netSalary}</th>
                        <th className="py-4 px-6 text-center">{t.paymentStatus}</th>
                        <th className="py-4 px-6 text-right">{t.actions}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {empPayslips.map((rec) => (
                        <tr key={rec.monthYear} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-6 font-mono font-bold text-slate-950 text-sm">{rec.monthYear}</td>
                          <td className="py-4 px-6 font-mono text-slate-700">₹{rec.basicSalary.toLocaleString('en-IN')}</td>
                          <td className="py-4 px-6 font-mono text-slate-700">₹{rec.totalSalary.toLocaleString('en-IN')}</td>
                          <td className="py-4 px-6 font-mono text-rose-600">-₹{rec.deductions.toLocaleString('en-IN')}</td>
                          <td className="py-4 px-6 font-mono text-slate-900 font-extrabold text-sm">
                            ₹{(rec.netSalary !== undefined ? rec.netSalary : rec.totalSalary).toLocaleString('en-IN')}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold border ${
                              rec.paymentStatus === 'Paid' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                : 'bg-amber-50 text-amber-700 border-amber-100'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${rec.paymentStatus === 'Paid' ? 'bg-emerald-500' : 'bg-amber-400'}`}></span>
                              <span>{rec.paymentStatus === 'Paid' ? t.paid : t.pending}</span>
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button
                              onClick={() => handleOpenPayslip(rec)}
                              className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-all active:scale-97"
                            >
                              <FileText className="w-3.5 h-3.5 text-slate-400" />
                              <span>View Slip</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="block md:hidden divide-y divide-slate-100">
                  {empPayslips.map((rec) => (
                    <div key={rec.monthYear} className="p-4 hover:bg-slate-50/50 transition-colors space-y-3.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-black text-slate-950 text-sm">{rec.monthYear}</span>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                          rec.paymentStatus === 'Paid' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                            : 'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                          <span className={`w-1 h-1 rounded-full ${rec.paymentStatus === 'Paid' ? 'bg-emerald-500' : 'bg-amber-400'}`}></span>
                          <span>{rec.paymentStatus === 'Paid' ? t.paid : t.pending}</span>
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gross Pay</span>
                          <p className="font-mono text-slate-700 font-semibold mt-0.5">₹{rec.totalSalary.toLocaleString('en-IN')}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Deductions</span>
                          <p className="font-mono text-rose-600 font-semibold mt-0.5">-₹{rec.deductions.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="col-span-2 border-t border-slate-100 pt-2 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Net Payout</span>
                            <p className="font-mono text-slate-950 font-black text-sm">₹{(rec.netSalary !== undefined ? rec.netSalary : rec.totalSalary).toLocaleString('en-IN')}</p>
                          </div>
                          <button
                            onClick={() => handleOpenPayslip(rec)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-all active:scale-97"
                          >
                            <FileText className="w-3.5 h-3.5 text-slate-500" />
                            <span>View Slip</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-slate-400">
                <AlertCircle className="w-10 h-10 mx-auto text-slate-200 mb-3" />
                <p className="text-xs font-bold max-w-sm mx-auto leading-relaxed">{t.noPayslips}</p>
              </div>
            )}
          </div>
        )}

        {/* EXCEPTIONS (MISS PUNCH / HALF DAY) TAB */}
        {activeTab === 'exceptions' && (
          <div className="space-y-4">
            <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-emerald-500" />
                  <span>{t.exceptions}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-medium">Verify your registered missed punches, half-day records, and their approval statuses.</p>
              </div>
              <button
                onClick={() => {
                  setRaiseDate(new Date().toISOString().split('T')[0]);
                  setRaiseCheckIn(adminSettings?.defaultCheckIn || '09:00');
                  setRaiseCheckOut(adminSettings?.defaultCheckOut || '18:00');
                  setRaiseRemarks('');
                  setTicketError('');
                  setTicketSuccess('');
                  setShowRaiseModal(true);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer transition-all self-start md:self-auto shadow-md"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>{language === 'en' ? 'Raise Missed Punch Ticket' : 'मिस पंच टिकट दर्ज करें'}</span>
              </button>
            </div>

            {/* Raise Missed Punch Modal */}
            {showRaiseModal && (
              <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_24px_70px_rgba(0,0,0,0.2)] max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-emerald-600 animate-pulse" />
                      <span>{language === 'en' ? 'Raise Missed Punch' : 'मिस पंच अनुरोध'}</span>
                    </h3>
                    <button
                      onClick={() => setShowRaiseModal(false)}
                      className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleRaiseTicket} className="space-y-4">
                    {ticketError && (
                      <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-lg text-xs font-bold">
                        {ticketError}
                      </div>
                    )}
                    {ticketSuccess && (
                      <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg text-xs font-bold animate-pulse">
                        {ticketSuccess}
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        {language === 'en' ? 'Date of Missed Punch' : 'मिस पंच की तिथि'}
                      </label>
                      <input
                        type="date"
                        required
                        value={raiseDate}
                        onChange={(e) => setRaiseDate(e.target.value)}
                        className="w-full border border-slate-200 px-3 py-2 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:outline-none font-bold text-xs text-slate-700"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          {language === 'en' ? 'Check-In Time' : 'आगमन समय (In)'}
                        </label>
                        <input
                          type="time"
                          required
                          value={raiseCheckIn}
                          onChange={(e) => setRaiseCheckIn(e.target.value)}
                          className="w-full border border-slate-200 px-3 py-2 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:outline-none font-mono text-xs text-slate-700"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          {language === 'en' ? 'Check-Out Time' : 'प्रस्थान समय (Out)'}
                        </label>
                        <input
                          type="time"
                          required
                          value={raiseCheckOut}
                          onChange={(e) => setRaiseCheckOut(e.target.value)}
                          className="w-full border border-slate-200 px-3 py-2 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:outline-none font-mono text-xs text-slate-700"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        {language === 'en' ? 'Reason / Explanation' : 'मिस पंच का कारण'}
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={raiseRemarks}
                        onChange={(e) => setRaiseRemarks(e.target.value)}
                        placeholder={language === 'en' ? 'e.g. Card forgotten, Biometric reader error' : 'उदा. आरएफआईडी कार्ड भूल गए, मशीन खराब थी'}
                        className="w-full border border-slate-200 px-3 py-2 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:outline-none text-xs text-slate-700"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowRaiseModal(false)}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition-all"
                      >
                        {language === 'en' ? 'Cancel' : 'रद्द करें'}
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingTicket}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1.5"
                      >
                        {isSubmittingTicket ? (language === 'en' ? 'Submitting...' : 'भेजा जा रहा है...') : (language === 'en' ? 'Submit Ticket' : 'टिकट भेजें')}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
              {attendanceRecords.filter(r => r.employeeId === employee.id && (r.status === 'Miss Punch' || r.status === 'Half Day')).length > 0 ? (
                <div>
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <th className="py-4 px-6">{t.date}</th>
                          <th className="py-4 px-6">{t.exceptionType}</th>
                          <th className="py-4 px-6">{t.checkIn} / {t.checkOut}</th>
                          <th className="py-4 px-6 text-center">{t.approvalStatus}</th>
                          <th className="py-4 px-6">{t.adminRemarks}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {attendanceRecords
                          .filter(r => r.employeeId === employee.id && (r.status === 'Miss Punch' || r.status === 'Half Day'))
                          .sort((a, b) => b.date.localeCompare(a.date))
                          .map((rec) => {
                            const status = rec.approvalStatus || 'Pending';
                            return (
                              <tr key={rec.date} className="hover:bg-slate-50/50 transition-colors">
                                <td className="py-4 px-6 font-mono font-bold text-slate-950 text-sm">{rec.date}</td>
                                <td className="py-4 px-6">
                                  <span className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase ${
                                    rec.status === 'Miss Punch' 
                                      ? 'bg-amber-50 text-amber-700 border border-amber-100' 
                                      : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                                  }`}>
                                    {rec.status}
                                  </span>
                                </td>
                                <td className="py-4 px-6 font-mono text-slate-700">
                                  {rec.checkIn || '--:--'} &rarr; {rec.checkOut || '--:--'}
                                </td>
                                <td className="py-4 px-6 text-center">
                                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold border ${
                                    status === 'Approved' 
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                      : status === 'Rejected' 
                                        ? 'bg-red-50 text-red-700 border-red-100' 
                                        : 'bg-amber-50 text-amber-700 border-amber-100'
                                  }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                      status === 'Approved' 
                                        ? 'bg-emerald-500' 
                                        : status === 'Rejected' 
                                          ? 'bg-red-500' 
                                          : 'bg-amber-400 animate-pulse'
                                    }`}></span>
                                    <span>{status === 'Approved' ? 'Approved' : status === 'Rejected' ? 'Rejected' : 'Pending'}</span>
                                  </span>
                                </td>
                                <td className="py-4 px-6 text-slate-500 italic font-semibold">{rec.remarks || '—'}</td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="block md:hidden divide-y divide-slate-100">
                    {attendanceRecords
                      .filter(r => r.employeeId === employee.id && (r.status === 'Miss Punch' || r.status === 'Half Day'))
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map((rec) => {
                        const status = rec.approvalStatus || 'Pending';
                        return (
                          <div key={rec.date} className="p-4 hover:bg-slate-50/50 transition-colors space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-black text-slate-950 text-sm">{rec.date}</span>
                              <span className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase ${
                                rec.status === 'Miss Punch' 
                                  ? 'bg-amber-50 text-amber-700 border border-amber-100' 
                                  : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                              }`}>
                                {rec.status}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Punch Log</span>
                                <p className="font-mono text-slate-700 font-semibold mt-0.5">
                                  {rec.checkIn || '--:--'} &rarr; {rec.checkOut || '--:--'}
                                </p>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Approval Status</span>
                                <div className="mt-0.5">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${
                                    status === 'Approved' 
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                      : status === 'Rejected' 
                                        ? 'bg-red-50 text-red-700 border-red-100' 
                                        : 'bg-amber-50 text-amber-700 border-amber-100'
                                  }`}>
                                    <span className={`w-1 h-1 rounded-full ${
                                      status === 'Approved' 
                                        ? 'bg-emerald-500' 
                                        : status === 'Rejected' 
                                          ? 'bg-red-500' 
                                          : 'bg-amber-400 animate-pulse'
                                    }`}></span>
                                    <span>{status === 'Approved' ? 'Approved' : status === 'Rejected' ? 'Rejected' : 'Pending'}</span>
                                  </span>
                                </div>
                              </div>
                            </div>

                            {rec.remarks && (
                              <div className="bg-slate-50 p-2.5 rounded-lg text-[11px] text-slate-500 italic">
                                <span className="font-semibold not-italic text-slate-600">Remarks: </span>{rec.remarks}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 text-slate-400">
                  <AlertCircle className="w-10 h-10 mx-auto text-slate-200 mb-3" />
                  <p className="text-xs font-bold max-w-sm mx-auto leading-relaxed">{t.noExceptions}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* LEAVES & HOLIDAYS TAB */}
        {activeTab === 'leaves' && (
          <div className="bg-white rounded-2xl border border-slate-200/85 p-5 md:p-6 shadow-md">
            <LeavesHolidays
              employees={[employee]}
              attendance={attendanceRecords}
              language={language}
              isEmployeeView={true}
              employeeId={employee.id}
            />
          </div>
        )}

        {/* CALENDAR REPORT TAB */}
        {activeTab === 'calendar' && (
          <MonthlyCalendarReport
            isAdmin={false}
            attendanceRecords={attendanceRecords}
            adminSettings={adminSettings}
            language={language}
            currentEmployee={employee}
          />
        )}

      </div>

      {/* DETAILED PAYSLIP MODAL (Matches Administrator layout exactly) */}
      {activePayslip && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-xl border border-slate-200 shadow-[0_24px_70px_rgba(0,0,0,0.15)] max-w-2xl w-full p-4 sm:p-8 space-y-4 sm:space-y-6 relative" id="printable-payslip">
            
            <div className="absolute inset-0 pointer-events-none overflow-hidden select-none opacity-[0.015] flex items-center justify-center">
              <Sparkles className="w-96 h-96 text-indigo-900" />
            </div>

            {/* Header info */}
            <div className="border-b border-slate-200 pb-4 sm:pb-5 text-center relative">
              <div className="flex items-center justify-center gap-2 mb-1.5">
                <div className="w-6 h-6 rounded bg-indigo-600 text-white flex items-center justify-center font-extrabold text-[10px] font-display">P</div>
                <h2 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-widest font-display">{t.payslipTitle}</h2>
              </div>
              <p className="text-[8px] sm:text-[9px] font-mono text-slate-400 uppercase tracking-widest leading-none font-bold">Verified Employee Cloud Records System</p>
              
              <div className="mt-3 sm:mt-4 inline-block">
                <span className="text-[10px] sm:text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100/60 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full uppercase tracking-wider">{t.payslipHeader}</span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 font-mono font-bold mt-2.5 sm:mt-3 bg-slate-50 inline-block px-3 py-1 rounded-md border border-slate-150">{t.payslipMonth}: {activePayslip.record.monthYear}</p>
            </div>

            {/* Employee metadata */}
            <div className="bg-slate-50/80 p-4 sm:p-5 rounded-lg border border-slate-200/60 relative">
              <h4 className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5 sm:mb-3.5 flex items-center gap-1">
                <Users className="w-3 h-3 text-indigo-500" />
                <span>{t.payslipEmpDetails}</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                <div className="space-y-1 sm:space-y-1.5 font-semibold">
                  <p className="text-slate-500 flex justify-between border-b border-slate-100 pb-1">
                    <span>{t.id}:</span> 
                    <span className="font-mono font-bold text-slate-900">{activePayslip.record.employeeId}</span>
                  </p>
                  <p className="text-slate-500 flex justify-between border-b border-slate-100 pb-1">
                    <span>{t.name}:</span> 
                    <span className="font-bold text-slate-900">{activePayslip.employee?.name}</span>
                  </p>
                  <p className="text-slate-500 flex justify-between pb-0">
                    <span>{t.department}:</span> 
                    <span className="font-bold text-slate-900">{activePayslip.employee?.department}</span>
                  </p>
                </div>
                <div className="space-y-1 sm:space-y-1.5 font-semibold">
                  <p className="text-slate-500 flex justify-between border-b border-slate-100 pb-1">
                    <span>{t.designation}:</span> 
                    <span className="font-bold text-slate-900">{activePayslip.employee?.designation}</span>
                  </p>
                  <p className="text-slate-500 flex justify-between border-b border-slate-100 pb-1">
                    <span>{t.joiningDate}:</span> 
                    <span className="font-bold text-slate-800">{activePayslip.employee?.joiningDate}</span>
                  </p>
                  <p className="text-slate-500 flex justify-between pb-0">
                    <span>{t.paymentMethod}:</span> 
                    <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.2 rounded text-[10px]">{activePayslip.employee?.paymentMethod}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Attendance detailed log breakdown */}
            <div className="bg-indigo-50/40 p-4 rounded-lg border border-indigo-100/50">
              <h4 className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest mb-3 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{t.attendanceBreakdown}</span>
              </h4>
              <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-5 text-center text-xs gap-y-3 sm:gap-y-0 sm:divide-x divide-indigo-100/30 font-semibold">
                <div className="px-1">
                  <p className="text-slate-400 text-[10px] mb-1 font-bold">{t.presentDays}</p>
                  <p className="font-extrabold text-slate-800 text-sm font-mono">{activePayslip.attendance.present}</p>
                </div>
                <div className="px-1">
                  <p className="text-slate-400 text-[10px] mb-1 font-bold">{t.halfDays}</p>
                  <p className="font-extrabold text-slate-800 text-sm font-mono">{activePayslip.attendance.halfDay}</p>
                </div>
                <div className="px-1">
                  <p className="text-slate-400 text-[10px] mb-1 font-bold">{t.leaveDays}</p>
                  <p className="font-extrabold text-slate-800 text-sm font-mono">{activePayslip.attendance.leave}</p>
                </div>
                <div className="px-1">
                  <p className="text-slate-400 text-[10px] mb-1 font-bold">{t.absentDays}</p>
                  <p className="font-extrabold text-rose-600 text-sm font-mono">{activePayslip.attendance.absent}</p>
                </div>
                <div className="px-1 col-span-2 xs:col-span-1">
                  <p className="text-slate-400 text-[10px] mb-1 font-bold">Overtime</p>
                  <p className="font-extrabold text-emerald-700 text-sm font-mono">{activePayslip.attendance.overtimeHrs} hr</p>
                </div>
              </div>
            </div>

            {/* Table of earnings and deductions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 border border-slate-200 rounded-lg overflow-hidden divide-y sm:divide-y-0 sm:divide-x divide-slate-200 text-xs shadow-3xs">
              
              {/* Earnings column */}
              <div>
                <div className="bg-slate-50 p-3 border-b border-slate-200 font-bold uppercase tracking-wider text-slate-700 text-[10px] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>{t.slipEarnings}</span>
                </div>
                <div className="p-4 space-y-2 text-slate-600 font-semibold">
                  <div className="flex justify-between pb-1 border-b border-slate-100">
                    <span>Basic Salary (Earned)</span>
                    <span className="font-bold text-slate-800 font-mono">₹{activePayslip.earnedBasic.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>House Rent (HRA)</span>
                    <span className="font-bold text-slate-800 font-mono">₹{(activePayslip.record.hra !== undefined ? activePayslip.record.hra : Math.round(activePayslip.record.basicSalary * 0.40)).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dearness (DA)</span>
                    <span className="font-bold text-slate-800 font-mono">₹{(activePayslip.record.da || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Conveyance Allowance</span>
                    <span className="font-bold text-slate-800 font-mono">₹{(activePayslip.record.conveyanceAllowance || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
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
                  <span>{t.slipDeductions}</span>
                </div>
                <div className="p-4 space-y-2 text-slate-600 font-semibold">
                  <div className="flex justify-between">
                    <span>Provident Fund (PF 12%)</span>
                    <span className="font-bold text-slate-800 font-mono">₹{(activePayslip.record.providentFund || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Employee Insurance (ESIC)</span>
                    <span className="font-bold text-slate-800 font-mono">₹{(activePayslip.record.esic || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Professional Tax (PT)</span>
                    <span className="font-bold text-slate-800 font-mono">₹{(activePayslip.record.professionalTax || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Income Tax (TDS)</span>
                    <span className="font-bold text-slate-800 font-mono">₹{(activePayslip.record.tds || 0).toLocaleString('en-IN')}</span>
                  </div>
                  {activePayslip.record.advanceDeduction > 0 && (
                    <div className="flex justify-between font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                      <span>Advance Repayment 💸</span>
                      <span className="font-mono">-₹{activePayslip.record.advanceDeduction.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-dashed border-slate-200 pt-2 font-bold text-rose-600">
                    <span>Total Deductions</span>
                    <span className="font-mono">₹{activePayslip.record.deductions.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Net Total block */}
            <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-lg flex items-center justify-between shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#03623c]/20 rounded-full blur-2xl"></div>
              <div className="space-y-0.5 relative z-10 font-bold">
                <span className="text-[10px] uppercase tracking-widest text-slate-400">{t.netPayable}</span>
                <p className="text-[9px] text-emerald-400 font-mono uppercase tracking-wider">Computed & Secured Digital Receipt</p>
              </div>
              <span className="text-xl sm:text-2xl font-extrabold font-mono text-white relative z-10">₹{(activePayslip.record.netSalary !== undefined ? activePayslip.record.netSalary : activePayslip.record.totalSalary).toLocaleString('en-IN')}</span>
            </div>

            {/* Signature Block */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 sm:gap-y-0 pt-6 sm:pt-8 text-xs text-center text-slate-500 font-bold">
              <div>
                <div className="w-36 mx-auto border-b border-slate-300 pb-1 text-slate-800">Rajeev Verma</div>
                <p className="mt-1.5 text-[10px] text-slate-400 uppercase tracking-widest">{t.authorizedSign}</p>
              </div>
              <div>
                <div className="w-36 mx-auto border-b border-slate-300 pb-1 min-h-[16px]"></div>
                <p className="mt-1.5 text-[10px] text-slate-400 uppercase tracking-widest">{t.receiptSign}</p>
              </div>
            </div>

            {/* Controls */}
            <div className="border-t border-slate-100 pt-4 sm:pt-5 flex flex-col sm:flex-row justify-end gap-2 no-print">
              <button
                onClick={() => downloadPayslipPDF(activePayslip.record, activePayslip.employee)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-3xs active:scale-97 w-full sm:w-auto"
              >
                <FileText className="w-3.5 h-3.5 text-white" />
                <span>{t.downloadPDF}</span>
              </button>
              <button
                onClick={handlePrint}
                className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-3xs active:scale-97 w-full sm:w-auto"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>{t.printSlip}</span>
              </button>
              <button
                onClick={() => setActivePayslip(null)}
                className="bg-slate-900 hover:bg-slate-850 text-white px-5 py-2.5 rounded-lg text-xs font-bold transition-all shadow-3xs cursor-pointer active:scale-97 w-full sm:w-auto text-center"
              >
                <span>{t.closeSlip}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
