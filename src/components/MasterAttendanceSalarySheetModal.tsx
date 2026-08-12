import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileSpreadsheet, Printer, X, Filter, Settings, CheckSquare, Square, 
  Download, Sparkles, Building, Users, Calendar, DollarSign, Eye, EyeOff,
  CheckCircle2, AlertCircle, RefreshCcw, Search, ChevronDown, Landmark
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { Employee, Attendance, PayrollRecord, AdminSettings, getCurrentBasicSalary } from '../types';
import { useModalBackHandler } from '../utils/useHistoryBackHandler';

interface MasterAttendanceSalarySheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  attendanceRecords: Attendance[];
  payrollRecords: PayrollRecord[];
  adminSettings?: AdminSettings;
  language?: 'en' | 'hi';
}

export interface ColumnVisibilityConfig {
  empCode: boolean;
  empName: boolean;
  designation: boolean;
  department: boolean;
  branch: boolean;
  bankDetails: boolean;
  mobileNo: boolean;
  dayWiseAttendance: boolean;
  totalDays: boolean;
  presentDays: boolean;
  halfDays: boolean;
  leaveDays: boolean;
  absentDays: boolean;
  weeklyOffDays: boolean;
  payableDays: boolean;
  overtimeHours: boolean;
  lateDays: boolean;
  basicSalary: boolean;
  earnedBasic: boolean;
  hra: boolean;
  da: boolean;
  conveyance: boolean;
  overtimePay: boolean;
  bonus: boolean;
  grossSalary: boolean;
  pfDeduction: boolean;
  esicDeduction: boolean;
  ptDeduction: boolean;
  advanceDeduction: boolean;
  otherDeductions: boolean;
  totalDeductions: boolean;
  netSalary: boolean;
  paymentStatus: boolean;
  paymentMode: boolean;
}

const DEFAULT_COLUMNS: ColumnVisibilityConfig = {
  empCode: true,
  empName: true,
  designation: true,
  department: true,
  branch: true,
  bankDetails: false,
  mobileNo: false,
  dayWiseAttendance: true,
  totalDays: true,
  presentDays: true,
  halfDays: true,
  leaveDays: true,
  absentDays: true,
  weeklyOffDays: true,
  payableDays: true,
  overtimeHours: true,
  lateDays: false,
  basicSalary: true,
  earnedBasic: true,
  hra: true,
  da: true,
  conveyance: true,
  overtimePay: true,
  bonus: true,
  grossSalary: true,
  pfDeduction: true,
  esicDeduction: true,
  ptDeduction: true,
  advanceDeduction: true,
  otherDeductions: true,
  totalDeductions: true,
  netSalary: true,
  paymentStatus: true,
  paymentMode: true,
};

const MONTHS = [
  { name: 'January', hindi: "", value: '01' },
  { name: 'February', hindi: "", value: '02' },
  { name: 'March', hindi: "", value: '03' },
  { name: 'April', hindi: "", value: '04' },
  { name: 'May', hindi: "", value: '05' },
  { name: 'June', hindi: "", value: '06' },
  { name: 'July', hindi: "", value: '07' },
  { name: 'August', hindi: "", value: '08' },
  { name: 'September', hindi: "", value: '09' },
  { name: 'October', hindi: "", value: '10' },
  { name: 'November', hindi: "", value: '11' },
  { name: 'December', hindi: "", value: '12' },
];

export const MasterAttendanceSalarySheetModal: React.FC<MasterAttendanceSalarySheetModalProps> = ({
  isOpen,
  onClose,
  employees,
  attendanceRecords,
  payrollRecords,
  adminSettings,
  language = 'en',
}) => {
  const currentYearStr = new Date().getFullYear().toString();
  const currentMonthStr = String(new Date().getMonth() + 1).padStart(2, '0');

  useModalBackHandler(isOpen, onClose, 'master-attendance-salary-sheet');

  const [selectedYear, setSelectedYear] = useState<string>(currentYearStr);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isColumnDrawerOpen, setIsColumnDrawerOpen] = useState(false);

  //Column visibility settings state
  const [cols, setCols] = useState<ColumnVisibilityConfig>(() => {
    try {
      const saved = localStorage.getItem('payroll_master_sheet_columns');
      if (saved) return { ...DEFAULT_COLUMNS, ...JSON.parse(saved) };
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_COLUMNS;
  });

  //Save column visibility settings to local storage
  const handleToggleColumn = (key: keyof ColumnVisibilityConfig) => {
    setCols((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem('payroll_master_sheet_columns', JSON.stringify(updated));
      return updated;
    });
  };

  const handleToggleAllGroup = (groupKeys: (keyof ColumnVisibilityConfig)[], enable: boolean) => {
    setCols((prev) => {
      const copy = { ...prev };
      groupKeys.forEach((k) => {
        copy[k] = enable;
      });
      localStorage.setItem('payroll_master_sheet_columns', JSON.stringify(copy));
      return copy;
    });
  };

  const handleResetColumns = () => {
    setCols(DEFAULT_COLUMNS);
    localStorage.setItem('payroll_master_sheet_columns', JSON.stringify(DEFAULT_COLUMNS));
  };

  const selectedMonthYear = `${selectedYear}-${selectedMonth}`;

  //Get total days in selected month (e.g. 31 for Aug, 30 for Sep, 28/29 for Feb)
  const daysInMonth = useMemo(() => {
    const year = parseInt(selectedYear, 10);
    const month = parseInt(selectedMonth, 10);
    return new Date(year, month, 0).getDate();
  }, [selectedYear, selectedMonth]);

  //Array of dates in the month: ['01', '02', ..., '31']
  const monthDaysArray = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => String(i + 1).padStart(2, '0'));
  }, [daysInMonth]);

  //Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (!emp.isActive && emp.isActive !== undefined) return false;
      if (selectedBranch !== 'all' && (emp.branch || '').toLowerCase() !== selectedBranch.toLowerCase()) return false;
      if (selectedDepartment !== 'all' && (emp.department || '').toLowerCase() !== selectedDepartment.toLowerCase()) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = (emp.name || '').toLowerCase().includes(q);
        const idMatch = (emp.id || '').toLowerCase().includes(q);
        const deptMatch = (emp.department || '').toLowerCase().includes(q);
        if (!nameMatch && !idMatch && !deptMatch) return false;
      }
      return true;
    });
  }, [employees, selectedBranch, selectedDepartment, searchQuery]);

  //Map attendance records indexed by empId_YYYY-MM-DD
  const attendanceMap = useMemo(() => {
    const map = new Map<string, Attendance>();
    attendanceRecords.forEach((rec) => {
      if (rec.date && rec.date.startsWith(selectedMonthYear)) {
        map.set(`${rec.employeeId}_${rec.date}`, rec);
      }
    });
    return map;
  }, [attendanceRecords, selectedMonthYear]);

  //Map payroll records indexed by empId
  const payrollMap = useMemo(() => {
    const map = new Map<string, PayrollRecord>();
    payrollRecords.forEach((rec) => {
      if (rec.monthYear === selectedMonthYear) {
        map.set(rec.employeeId, rec);
      }
    });
    return map;
  }, [payrollRecords, selectedMonthYear]);

  //Process master data for every employee
  const masterSheetData = useMemo(() => {
    return filteredEmployees.map((emp) => {
      const empBasic = getCurrentBasicSalary(emp);
      let presentCount = 0;
      let halfDayCount = 0;
      let leaveCount = 0;
      let absentCount = 0;
      let weeklyOffCount = 0;
      let totalOvertimeHours = 0;
      let lateDaysCount = 0;

      const dailyStatuses: { [day: string]: { code: string; label: string; bgClass: string; textClass: string } } = {};

      monthDaysArray.forEach((day) => {
        const fullDateStr = `${selectedMonthYear}-${day}`;
        const att = attendanceMap.get(`${emp.id}_${fullDateStr}`);
        const dayOfWeek = new Date(fullDateStr).getDay(); //0 = Sunday

        if (att) {
          if (att.overtimeHours) totalOvertimeHours += att.overtimeHours;
          if (att.checkIn && att.checkIn > (adminSettings?.defaultCheckIn || '09:15')) {
            lateDaysCount += 1;
          }

          if (att.status === 'Present') {
            presentCount += 1;
            dailyStatuses[day] = { code: 'P', label: 'Present', bgClass: 'bg-emerald-100', textClass: 'text-emerald-800' };
          } else if (att.status === 'Half Day') {
            halfDayCount += 1;
            dailyStatuses[day] = { code: 'HD', label: 'Half Day', bgClass: 'bg-amber-100', textClass: 'text-amber-800' };
          } else if (att.status === 'Leave') {
            leaveCount += 1;
            dailyStatuses[day] = { code: 'L', label: 'Leave', bgClass: 'bg-indigo-100', textClass: 'text-indigo-800' };
          } else if (att.status === 'Absent') {
            absentCount += 1;
            dailyStatuses[day] = { code: 'A', label: 'Absent', bgClass: 'bg-rose-100', textClass: 'text-rose-800' };
          } else {
            dailyStatuses[day] = { code: 'MP', label: 'Miss Punch', bgClass: 'bg-orange-100', textClass: 'text-orange-800' };
          }
        } else {
          if (dayOfWeek === 0) {
            weeklyOffCount += 1;
            dailyStatuses[day] = { code: 'WO', label: 'Weekly Off', bgClass: 'bg-slate-100', textClass: 'text-slate-600' };
          } else {
            dailyStatuses[day] = { code: '-', label: 'Not Marked', bgClass: 'bg-gray-50', textClass: 'text-gray-400' };
          }
        }
      });

      const payableDays = presentCount + halfDayCount * 0.5 + leaveCount + weeklyOffCount;

      //Payroll record or calculated fallback
      const pr = payrollMap.get(emp.id);

      const perDayRate = empBasic / daysInMonth;
      const earnedBasic = pr?.basicSalary !== undefined ? pr.basicSalary : Math.round(perDayRate * payableDays);

      const hra = pr?.hra !== undefined ? pr.hra : (emp.hra || 0);
      const da = pr?.da !== undefined ? pr.da : (emp.da || 0);
      const conveyance = pr?.conveyanceAllowance !== undefined ? pr.conveyanceAllowance : (emp.conveyanceAllowance || emp.allowances || 0);
      const overtimePay = pr?.overtimePay !== undefined ? pr.overtimePay : Math.round(totalOvertimeHours * (adminSettings?.defaultOvertimeRate || 150));
      const bonus = (pr?.festivalBonus || 0) + (pr?.performanceIncentive || 0);

      const grossSalary = pr?.totalSalary !== undefined ? pr.totalSalary : Math.round(earnedBasic + hra + da + conveyance + overtimePay + bonus);

      const pf = pr?.providentFund !== undefined ? pr.providentFund : (emp.isPfApplicable !== false ? Math.round(earnedBasic * ((adminSettings?.pfContributionRate || 12) / 100)) : 0);
      const esic = pr?.esic !== undefined ? pr.esic : (emp.isEsicApplicable !== false ? Math.round(grossSalary * ((adminSettings?.esicContributionRate || 0.75) / 100)) : 0);
      const pt = pr?.professionalTax !== undefined ? pr.professionalTax : (emp.isPtApplicable !== false && grossSalary > 10000 ? 200 : 0);
      const advanceDeduction = pr?.advanceDeduction !== undefined ? pr.advanceDeduction : (emp.advanceSalaryDeduction || 0);
      const otherDeductions = pr?.deductions !== undefined ? pr.deductions : (emp.deductions || 0);

      const totalDeductions = Math.round(pf + esic + pt + advanceDeduction + otherDeductions);
      const netSalary = pr?.netSalary !== undefined ? pr.netSalary : Math.max(0, grossSalary - totalDeductions);

      return {
        emp,
        dailyStatuses,
        presentCount,
        halfDayCount,
        leaveCount,
        absentCount,
        weeklyOffCount,
        payableDays,
        totalOvertimeHours,
        lateDaysCount,
        empBasic,
        earnedBasic,
        hra,
        da,
        conveyance,
        overtimePay,
        bonus,
        grossSalary,
        pf,
        esic,
        pt,
        advanceDeduction,
        otherDeductions,
        totalDeductions,
        netSalary,
        paymentStatus: pr?.paymentStatus || 'Pending',
        paymentMode: emp.paymentMethod || 'Bank Transfer',
      };
    });
  }, [filteredEmployees, monthDaysArray, selectedMonthYear, attendanceMap, payrollMap, adminSettings, daysInMonth]);

  //Grand summary stats
  const grandTotals = useMemo(() => {
    let gross = 0;
    let deductions = 0;
    let net = 0;
    let presentDaysSum = 0;
    let payableDaysSum = 0;
    let otHoursSum = 0;

    masterSheetData.forEach((row) => {
      gross += row.grossSalary;
      deductions += row.totalDeductions;
      net += row.netSalary;
      presentDaysSum += row.presentCount;
      payableDaysSum += row.payableDays;
      otHoursSum += row.totalOvertimeHours;
    });

    return {
      count: masterSheetData.length,
      gross,
      deductions,
      net,
      presentDaysSum,
      payableDaysSum,
      otHoursSum,
    };
  }, [masterSheetData]);

  if (!isOpen) return null;

  //EXPORT TO EXCEL (.xlsx)
  const handleExportExcel = () => {
    const monthName = MONTHS.find((m) => m.value === selectedMonth)?.name || selectedMonth;
    const sheetName = `${monthName}_${selectedYear}_Salary`;

    //1. Build Header Metadata
    const excelRows: any[] = [];
    excelRows.push({
      'RATHI BUILDMART - MASTER ATTENDANCE & SALARY SHEET': '',
    });
    excelRows.push({
      'RATHI BUILDMART - MASTER ATTENDANCE & SALARY SHEET': `Period: ${monthName} ${selectedYear} | Exported On: ${new Date().toLocaleDateString('en-IN')}`,
    });
    excelRows.push({}); //Empty spacing row/2. Build Column Headers based on active `cols` settings
    masterSheetData.forEach((row, idx) => {
      const exportItem: Record<string, any> = {
        'S.No.': idx + 1,
      };

      if (cols.empCode) exportItem['Emp ID'] = row.emp.id;
      if (cols.empName) exportItem['Employee Name'] = row.emp.name;
      if (cols.designation) exportItem['Designation'] = row.emp.designation || '-';
      if (cols.department) exportItem['Department'] = row.emp.department || '-';
      if (cols.branch) exportItem['Branch'] = row.emp.branch || '-';
      if (cols.bankDetails) exportItem['Bank Account'] = row.emp.bankAccountNo ? `'${row.emp.bankAccountNo}` : '-';
      if (cols.mobileNo) exportItem['Mobile No'] = row.emp.mobileNo || '-';

      //Day wise attendance columns
      if (cols.dayWiseAttendance) {
        monthDaysArray.forEach((d) => {
          const st = row.dailyStatuses[d];
          exportItem[`Day ${d}`] = st ? st.code : '-';
        });
      }

      //Summary counts
      if (cols.totalDays) exportItem['Total Days'] = daysInMonth;
      if (cols.presentDays) exportItem['Present (P)'] = row.presentCount;
      if (cols.halfDays) exportItem['Half Day (HD)'] = row.halfDayCount;
      if (cols.leaveDays) exportItem['Leave (L)'] = row.leaveCount;
      if (cols.absentDays) exportItem['Absent (A)'] = row.absentCount;
      if (cols.weeklyOffDays) exportItem['Weekly Off (WO)'] = row.weeklyOffCount;
      if (cols.payableDays) exportItem['Payable Days'] = row.payableDays;
      if (cols.overtimeHours) exportItem['OT Hours'] = row.totalOvertimeHours;
      if (cols.lateDays) exportItem['Late Days'] = row.lateDaysCount;

      //Salary details
      if (cols.basicSalary) exportItem['Basic Salary'] = row.empBasic;
      if (cols.earnedBasic) exportItem['Earned Basic'] = row.earnedBasic;
      if (cols.hra) exportItem['HRA'] = row.hra;
      if (cols.da) exportItem['DA'] = row.da;
      if (cols.conveyance) exportItem['Conveyance'] = row.conveyance;
      if (cols.overtimePay) exportItem['OT Pay'] = row.overtimePay;
      if (cols.bonus) exportItem['Bonus'] = row.bonus;
      if (cols.grossSalary) exportItem['Gross Salary'] = row.grossSalary;

      //Deductions
      if (cols.pfDeduction) exportItem['PF'] = row.pf;
      if (cols.esicDeduction) exportItem['ESIC'] = row.esic;
      if (cols.ptDeduction) exportItem['PT'] = row.pt;
      if (cols.advanceDeduction) exportItem['Advance Loan'] = row.advanceDeduction;
      if (cols.otherDeductions) exportItem['Other Deducts'] = row.otherDeductions;
      if (cols.totalDeductions) exportItem['Total Deductions'] = row.totalDeductions;

      //Net Salary & Mode
      if (cols.netSalary) exportItem['Net Payable Salary'] = row.netSalary;
      if (cols.paymentStatus) exportItem['Status'] = row.paymentStatus;
      if (cols.paymentMode) exportItem['Payment Mode'] = row.paymentMode;

      excelRows.push(exportItem);
    });

    //3. Add Grand Summary Row
    const grandRow: Record<string, any> = {
      'S.No.': 'TOTAL',
      'Employee Name': `${grandTotals.count} Employees`,
    };
    if (cols.grossSalary) grandRow['Gross Salary'] = grandTotals.gross;
    if (cols.totalDeductions) grandRow['Total Deductions'] = grandTotals.deductions;
    if (cols.netSalary) grandRow['Net Payable Salary'] = grandTotals.net;
    if (cols.presentDays) grandRow['Present (P)'] = grandTotals.presentDaysSum;
    if (cols.payableDays) grandRow['Payable Days'] = grandTotals.payableDaysSum;
    if (cols.overtimeHours) grandRow['OT Hours'] = grandTotals.otHoursSum;

    excelRows.push(grandRow);

    //Create Worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelRows);

    //Auto-fit column widths
    const colWidths = Object.keys(excelRows[0] || {}).map((key) => ({
      wch: Math.max(key.length + 3, 10),
    }));
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    XLSX.writeFile(workbook, `Master_Attendance_Salary_Sheet_${monthName}_${selectedYear}.xlsx`);
  };

  //EXPORT TO PDF
  const handleExportPDF = () => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const monthName = MONTHS.find((m) => m.value === selectedMonth)?.name || selectedMonth;
    const companyName = adminSettings?.companyName || 'Rathi Buildmart';

    //PDF Header Title
    doc.setFillColor(15, 23, 42); //slate-900
    doc.rect(0, 0, 297, 24, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`${companyName.toUpperCase()} - MASTER ATTENDANCE & SALARY SHEET`, 14, 12);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Period: ${monthName} ${selectedYear}  |  Generated On: ${new Date().toLocaleDateString('en-IN')}`, 14, 18);

    doc.setTextColor(30, 41, 59);

    //Attendance Legend Code Bar
    doc.setFillColor(241, 245, 249);
    doc.rect(14, 28, 269, 10, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Attendance Legend: P = Present | HD = Half Day | L = Leave | A = Absent | WO = Weekly Off | MP = Miss Punch', 18, 34);

    let startY = 44;

    //Draw Employee Table Rows
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');

    //Table Header
    doc.setFillColor(226, 232, 240);
    doc.rect(14, startY, 269, 8, 'F');
    doc.text('ID', 16, startY + 5.5);
    doc.text('Employee Name', 32, startY + 5.5);
    doc.text('DeptBranch', 90, startY + 5.5);
    doc.text('P', 140, startY + 5.5);
    doc.text('HD', 150, startY + 5.5);
    doc.text('L', 160, startY + 5.5);
    doc.text('A', 170, startY + 5.5);
    doc.text('Payable', 180, startY + 5.5);
    doc.text('Gross (Rs)', 202, startY + 5.5);
    doc.text('Deducts (Rs)', 230, startY + 5.5);
    doc.text('Net Salary (Rs)', 256, startY + 5.5);

    startY += 8;

    doc.setFont('helvetica', 'normal');
    masterSheetData.forEach((row, i) => {
      if (startY > 185) {
        doc.addPage('a4', 'landscape');
        startY = 20;

        doc.setFillColor(226, 232, 240);
        doc.rect(14, startY, 269, 8, 'F');
        doc.setFont('helvetica', 'bold');
        doc.text('ID', 16, startY + 5.5);
        doc.text('Employee Name', 32, startY + 5.5);
        doc.text('DeptBranch', 90, startY + 5.5);
        doc.text('P', 140, startY + 5.5);
        doc.text('HD', 150, startY + 5.5);
        doc.text('L', 160, startY + 5.5);
        doc.text('A', 170, startY + 5.5);
        doc.text('Payable', 180, startY + 5.5);
        doc.text('Gross (Rs)', 202, startY + 5.5);
        doc.text('Deducts (Rs)', 230, startY + 5.5);
        doc.text('Net Salary (Rs)', 256, startY + 5.5);
        doc.setFont('helvetica', 'normal');
        startY += 8;
      }

      if (i % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, startY, 269, 7, 'F');
      }

      doc.text(row.emp.id.substring(0, 8), 16, startY + 5);
      doc.text(row.emp.name.substring(0, 24), 32, startY + 5);
      doc.text(`${(row.emp.department || '').substring(0, 12)}${(row.emp.branch || '').substring(0, 10)}`, 90, startY + 5);
      doc.text(String(row.presentCount), 140, startY + 5);
      doc.text(String(row.halfDayCount), 150, startY + 5);
      doc.text(String(row.leaveCount), 160, startY + 5);
      doc.text(String(row.absentCount), 170, startY + 5);
      doc.text(String(row.payableDays), 180, startY + 5);
      doc.text(`Rs.${row.grossSalary.toLocaleString('en-IN')}`, 202, startY + 5);
      doc.text(`Rs.${row.totalDeductions.toLocaleString('en-IN')}`, 230, startY + 5);
      doc.text(`Rs.${row.netSalary.toLocaleString('en-IN')}`, 256, startY + 5);

      startY += 7;
    });

    //Grand Summary Footer
    startY += 3;
    doc.setFillColor(15, 23, 42);
    doc.rect(14, startY, 269, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(`GRAND TOTAL (${grandTotals.count} Employees):`, 18, startY + 6.5);
    doc.text(`Total Gross: Rs.${grandTotals.gross.toLocaleString('en-IN')}`, 110, startY + 6.5);
    doc.text(`Total Deductions: Rs.${grandTotals.deductions.toLocaleString('en-IN')}`, 175, startY + 6.5);
    doc.text(`Total Net Salary: Rs.${grandTotals.net.toLocaleString('en-IN')}`, 235, startY + 6.5);

    doc.save(`Master_Attendance_Salary_Sheet_${monthName}_${selectedYear}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 overflow-hidden">
      <div className="relative w-full max-w-[98vw] h-[95vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Top Title Bar */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                {'Master Attendance & Salary Sheet Report'}
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-semibold">
                  Excel & PDF Exportable
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                {'Employee-wise Day-wise Attendance (P, HD, L, A) & Salary Breakdown with Column Customization'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Column Visibility Settings Button */}
            <button
              onClick={() => setIsColumnDrawerOpen(!isColumnDrawerOpen)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
                isColumnDrawerOpen
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-slate-200 border-white/20'
              }`}
              id="btn-toggle-column-settings"
            >
              <Settings className="w-4 h-4 text-amber-300 animate-spin-slow" />
              <span>{'Column Settings'}</span>
            </button>

            {/* Export Excel Button */}
            <button
              onClick={handleExportExcel}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-sm border border-emerald-400/30"
              id="btn-export-master-excel"
            >
              <Download className="w-4 h-4" />
              <span>Export Excel (.xlsx)</span>
            </button>

            {/* Export PDF Button */}
            <button
              onClick={handleExportPDF}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-sm border border-indigo-400/30"
              id="btn-export-master-pdf"
            >
              <Printer className="w-4 h-4" />
              <span>Export PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters & Control Toolbar */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-2.5 text-xs font-medium">
            {/* Year & Month Selectors */}
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
              >
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {language === 'hi' ? m.hindi : m.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer border-l border-slate-200 pl-1.5"
              >
                {['2024', '2025', '2026', '2027'].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Branch Filter */}
            {adminSettings?.branches && adminSettings.branches.length > 0 && (
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs">
                <Building className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[11px] text-slate-400 font-bold">Branch:</span>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
                >
                  <option value="all">All Branches</option>
                  {adminSettings.branches.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Department Filter */}
            {adminSettings?.departments && adminSettings.departments.length > 0 && (
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[11px] text-slate-400 font-bold">Dept:</span>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
                >
                  <option value="all">All Departments</option>
                  {adminSettings.departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Search Input */}
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={'Search NameID...'}
                className="pl-8 pr-3 py-1 bg-white rounded-xl border border-slate-200 text-xs text-slate-800 font-medium outline-none focus:border-emerald-500 w-44 shadow-2xs" />
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-3 text-xs font-semibold text-slate-700">
            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl text-emerald-900">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span>Net Payroll: <strong className="font-extrabold">₹{grandTotals.net.toLocaleString('en-IN')}</strong></span>
            </div>

            <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-xl text-blue-900">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>Employees: <strong className="font-extrabold">{grandTotals.count}</strong></span>
            </div>
          </div>
        </div>

        {/* Collapsible Column Settings Settings Drawer */}
        {isColumnDrawerOpen && (
          <div className="bg-slate-900 text-white p-4 border-b border-slate-800 animate-fadeIn shrink-0 shadow-inner">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-extrabold tracking-wide uppercase text-amber-300">
                  {'Column Visibility Customization Settings'}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetColumns}
                  className="text-[11px] font-bold text-slate-300 hover:text-white underline cursor-pointer"
                >
                  Reset Default Columns
                </button>
                <button
                  onClick={() => setIsColumnDrawerOpen(false)}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              {/* Group 1: Employee Metadata */}
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700 flex flex-col gap-1.5">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Employee Details</span>
                <label className="flex items-center gap-2 cursor-pointer hover:text-amber-300">
                  <input type="checkbox" checked={cols.empCode} onChange={() => handleToggleColumn('empCode')} className="rounded text-amber-500" />
                  <span>Emp CodeID</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:text-amber-300">
                  <input type="checkbox" checked={cols.empName} onChange={() => handleToggleColumn('empName')} className="rounded text-amber-500" />
                  <span>Employee Name</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:text-amber-300">
                  <input type="checkbox" checked={cols.designation} onChange={() => handleToggleColumn('designation')} className="rounded text-amber-500" />
                  <span>Designation</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:text-amber-300">
                  <input type="checkbox" checked={cols.department} onChange={() => handleToggleColumn('department')} className="rounded text-amber-500" />
                  <span>Department</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:text-amber-300">
                  <input type="checkbox" checked={cols.branch} onChange={() => handleToggleColumn('branch')} className="rounded text-amber-500" />
                  <span>Branch</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:text-amber-300">
                  <input type="checkbox" checked={cols.bankDetails} onChange={() => handleToggleColumn('bankDetails')} className="rounded text-amber-500" />
                  <span>Bank Details</span>
                </label>
              </div>

              {/* Group 2: Attendance Grid */}
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700 flex flex-col gap-1.5">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Calendar Attendance</span>
                <label className="flex items-center gap-2 cursor-pointer hover:text-emerald-300 font-bold text-emerald-400">
                  <input
                    type="checkbox"
                    checked={cols.dayWiseAttendance}
                    onChange={() => handleToggleColumn('dayWiseAttendance')}
                    className="rounded text-emerald-500" />
                  <span>Day-Wise Grid (1..{daysInMonth})</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:text-amber-300">
                  <input type="checkbox" checked={cols.totalDays} onChange={() => handleToggleColumn('totalDays')} className="rounded text-amber-500" />
                  <span>Total Month Days</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:text-amber-300">
                  <input type="checkbox" checked={cols.presentDays} onChange={() => handleToggleColumn('presentDays')} className="rounded text-amber-500" />
                  <span>Present Days (P)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:text-amber-300">
                  <input type="checkbox" checked={cols.halfDays} onChange={() => handleToggleColumn('halfDays')} className="rounded text-amber-500" />
                  <span>Half Days (HD)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:text-amber-300">
                  <input type="checkbox" checked={cols.leaveDays} onChange={() => handleToggleColumn('leaveDays')} className="rounded text-amber-500" />
                  <span>Leaves (L)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:text-amber-300">
                  <input type="checkbox" checked={cols.absentDays} onChange={() => handleToggleColumn('absentDays')} className="rounded text-amber-500" />
                  <span>Absents (A)</span>
                </label>
              </div>

              {/* Group 3: Attendance Summary */}
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700 flex flex-col gap-1.5">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Payable Days & OT</span>
                <label className="flex items-center gap-2 cursor-pointer hover:text-amber-300">
                  <input type="checkbox" checked={cols.weeklyOffDays} onChange={() => handleToggleColumn('weeklyOffDays')} className="rounded text-amber-500" />
                  <span>Weekly Off (WO)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:text-amber-300 font-bold text-amber-300">
                  <input type="checkbox" checked={cols.payableDays} onChange={() => handleToggleColumn('payableDays')} className="rounded text-amber-500" />
                  <span>Payable Days</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:text-amber-300">
                  <input type="checkbox" checked={cols.overtimeHours} onChange={() => handleToggleColumn('overtimeHours')} className="rounded text-amber-500" />
                  <span>OT Hours</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:text-amber-300">
                  <input type="checkbox" checked={cols.lateDays} onChange={() => handleToggleColumn('lateDays')} className="rounded text-amber-500" />
                  <span>Late Arrivals Count</span>
                </label>
              </div>

              {/* Group 4: Earnings Breakdown */}
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700 flex flex-col gap-1.5">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Salary Earnings</span>
                <label className="flex items-center gap-2 cursor-pointer hover:text-amber-300">
                  <input type="checkbox" checked={cols.basicSalary} onChange={() => handleToggleColumn('basicSalary')} className="rounded text-amber-500" />
                  <span>Basic Salary</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:text-amber-300">
                  <input type="checkbox" checked={cols.earnedBasic} onChange={() => handleToggleColumn('earnedBasic')} className="rounded text-amber-500" />
                  <span>Earned Basic</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:text-amber-300">
                  <input type="checkbox" checked={cols.hra} onChange={() => handleToggleColumn('hra')} className="rounded text-amber-500" />
                  <span>HRA</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:text-amber-300">
                  <input type="checkbox" checked={cols.da} onChange={() => handleToggleColumn('da')} className="rounded text-amber-500" />
                  <span>DAConveyance</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:text-amber-300 font-bold text-amber-300">
                  <input type="checkbox" checked={cols.grossSalary} onChange={() => handleToggleColumn('grossSalary')} className="rounded text-amber-500" />
                  <span>Gross Salary</span>
                </label>
              </div>

              {/* Group 5: Deductions Breakdown */}
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700 flex flex-col gap-1.5">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Deductions</span>
                <label className="flex items-center gap-2 cursor-pointer hover:text-amber-300">
                  <input type="checkbox" checked={cols.pfDeduction} onChange={() => handleToggleColumn('pfDeduction')} className="rounded text-amber-500" />
                  <span>Provident Fund (PF)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:text-amber-300">
                  <input type="checkbox" checked={cols.esicDeduction} onChange={() => handleToggleColumn('esicDeduction')} className="rounded text-amber-500" />
                  <span>ESIC</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:text-amber-300">
                  <input type="checkbox" checked={cols.ptDeduction} onChange={() => handleToggleColumn('ptDeduction')} className="rounded text-amber-500" />
                  <span>Professional Tax (PT)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:text-amber-300">
                  <input type="checkbox" checked={cols.advanceDeduction} onChange={() => handleToggleColumn('advanceDeduction')} className="rounded text-amber-500" />
                  <span>LoanAdvance</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:text-amber-300 font-bold text-rose-300">
                  <input type="checkbox" checked={cols.totalDeductions} onChange={() => handleToggleColumn('totalDeductions')} className="rounded text-rose-500" />
                  <span>Total Deductions</span>
                </label>
              </div>

              {/* Group 6: Net Salary & Payment Mode */}
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700 flex flex-col gap-1.5">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Net & Payment Mode</span>
                <label className="flex items-center gap-2 cursor-pointer hover:text-emerald-300 font-extrabold text-emerald-300">
                  <input type="checkbox" checked={cols.netSalary} onChange={() => handleToggleColumn('netSalary')} className="rounded text-emerald-500" />
                  <span>Net Payable Salary</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:text-amber-300">
                  <input type="checkbox" checked={cols.paymentStatus} onChange={() => handleToggleColumn('paymentStatus')} className="rounded text-amber-500" />
                  <span>Payment Status</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:text-amber-300">
                  <input type="checkbox" checked={cols.paymentMode} onChange={() => handleToggleColumn('paymentMode')} className="rounded text-amber-500" />
                  <span>Payment Mode</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Live Preview Consolidated Table */}
        <div className="flex-1 overflow-auto bg-slate-100 p-2 sm:p-4">
          <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
            <div className="max-w-full overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-slate-100 font-extrabold uppercase tracking-wider text-[11px] sticky top-0 z-20 shadow-xs">
                    <th className="py-3 px-3 border-b border-slate-800 text-center w-10">S.No</th>
                    {cols.empCode && <th className="py-3 px-3 border-b border-slate-800">Emp ID</th>}
                    {cols.empName && <th className="py-3 px-3 border-b border-slate-800 min-w-[150px]">Employee Name</th>}
                    {cols.designation && <th className="py-3 px-3 border-b border-slate-800">Designation</th>}
                    {cols.department && <th className="py-3 px-3 border-b border-slate-800">Department</th>}
                    {cols.branch && <th className="py-3 px-3 border-b border-slate-800">Branch</th>}
                    {cols.bankDetails && <th className="py-3 px-3 border-b border-slate-800">Bank Account</th>}
                    {cols.mobileNo && <th className="py-3 px-3 border-b border-slate-800">Mobile</th>}

                    {/* Day Wise Attendance Header Columns */}
                    {cols.dayWiseAttendance &&
                      monthDaysArray.map((day) => (
                        <th key={day} className="py-2 px-1 border-b border-slate-800 text-center min-w-[28px] font-mono text-[10px]">
                          {day}
                        </th>
                      ))}

                    {/* Attendance Totals */}
                    {cols.totalDays && <th className="py-3 px-2 border-b border-slate-800 text-center bg-slate-800">Tot</th>}
                    {cols.presentDays && <th className="py-3 px-2 border-b border-slate-800 text-center text-emerald-400 bg-slate-800">P</th>}
                    {cols.halfDays && <th className="py-3 px-2 border-b border-slate-800 text-center text-amber-400 bg-slate-800">HD</th>}
                    {cols.leaveDays && <th className="py-3 px-2 border-b border-slate-800 text-center text-indigo-400 bg-slate-800">L</th>}
                    {cols.absentDays && <th className="py-3 px-2 border-b border-slate-800 text-center text-rose-400 bg-slate-800">A</th>}
                    {cols.weeklyOffDays && <th className="py-3 px-2 border-b border-slate-800 text-center bg-slate-800">WO</th>}
                    {cols.payableDays && <th className="py-3 px-2 border-b border-slate-800 text-center text-amber-300 bg-slate-800">Payable</th>}
                    {cols.overtimeHours && <th className="py-3 px-2 border-b border-slate-800 text-center bg-slate-800">OT Hr</th>}

                    {/* Salary Figures */}
                    {cols.basicSalary && <th className="py-3 px-3 border-b border-slate-800 text-right">Basic</th>}
                    {cols.earnedBasic && <th className="py-3 px-3 border-b border-slate-800 text-right">Earned Basic</th>}
                    {cols.hra && <th className="py-3 px-3 border-b border-slate-800 text-right">HRA</th>}
                    {cols.da && <th className="py-3 px-3 border-b border-slate-800 text-right">DA/Conv</th>}
                    {cols.grossSalary && <th className="py-3 px-3 border-b border-slate-800 text-right bg-slate-800 text-amber-300">Gross</th>}

                    {/* Deductions */}
                    {cols.pfDeduction && <th className="py-3 px-2 border-b border-slate-800 text-right">PF</th>}
                    {cols.esicDeduction && <th className="py-3 px-2 border-b border-slate-800 text-right">ESIC</th>}
                    {cols.ptDeduction && <th className="py-3 px-2 border-b border-slate-800 text-right">PT</th>}
                    {cols.advanceDeduction && <th className="py-3 px-2 border-b border-slate-800 text-right">Advance</th>}
                    {cols.totalDeductions && <th className="py-3 px-3 border-b border-slate-800 text-right bg-slate-800 text-rose-300">Deductions</th>}

                    {/* Net Payable */}
                    {cols.netSalary && <th className="py-3 px-3 border-b border-slate-800 text-right bg-emerald-950 text-emerald-300">Net Payable</th>}
                    {cols.paymentStatus && <th className="py-3 px-3 border-b border-slate-800 text-center">Status</th>}
                    {cols.paymentMode && <th className="py-3 px-3 border-b border-slate-800 text-center">Mode</th>}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                  {masterSheetData.length === 0 ? (
                    <tr>
                      <td colSpan={40} className="py-12 text-center text-slate-400 font-semibold">
                        {'No matching employee or attendance records found.'}
                      </td>
                    </tr>
                  ) : (
                    masterSheetData.map((row, idx) => (
                      <tr key={row.emp.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                        {cols.empCode && <td className="py-2.5 px-3 font-mono font-bold text-slate-600">{row.emp.id}</td>}
                        {cols.empName && (
                          <td className="py-2.5 px-3 font-bold text-slate-900">
                            <div>{row.emp.name}</div>
                            <div className="text-[10px] font-normal text-slate-400">{row.emp.designation}</div>
                          </td>
                        )}
                        {cols.designation && <td className="py-2.5 px-3 text-slate-600">{row.emp.designation || '-'}</td>}
                        {cols.department && <td className="py-2.5 px-3 text-slate-600">{row.emp.department || '-'}</td>}
                        {cols.branch && <td className="py-2.5 px-3 text-slate-600">{row.emp.branch || '-'}</td>}
                        {cols.bankDetails && (
                          <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                            {row.emp.bankAccountNo ? `${row.emp.bankName || 'Bank'}: ${row.emp.bankAccountNo}` : '-'}
                          </td>
                        )}
                        {cols.mobileNo && <td className="py-2.5 px-3 text-slate-600 font-mono">{row.emp.mobileNo || '-'}</td>}

                        {/* Day-Wise Attendance Badge Cells */}
                        {cols.dayWiseAttendance &&
                          monthDaysArray.map((day) => {
                            const st = row.dailyStatuses[day];
                            return (
                              <td key={day} className="py-1 px-0.5 text-center">
                                <span
                                  className={`inline-block w-6 h-6 leading-6 rounded-md font-mono font-bold text-[10px] ${
                                    st ? `${st.bgClass} ${st.textClass}` : 'bg-gray-100 text-gray-400'
                                  }`}
                                  title={`Day ${day}: ${st ? st.label : 'No Record'}`}
                                >
                                  {st ? st.code : '-'}
                                </span>
                              </td>
                            );
                          })}

                        {/* Summary Counts */}
                        {cols.totalDays && <td className="py-2.5 px-2 text-center font-bold bg-slate-50">{daysInMonth}</td>}
                        {cols.presentDays && <td className="py-2.5 px-2 text-center font-bold text-emerald-700 bg-emerald-50/50">{row.presentCount}</td>}
                        {cols.halfDays && <td className="py-2.5 px-2 text-center font-bold text-amber-700 bg-amber-50/50">{row.halfDayCount}</td>}
                        {cols.leaveDays && <td className="py-2.5 px-2 text-center font-bold text-indigo-700 bg-indigo-50/50">{row.leaveCount}</td>}
                        {cols.absentDays && <td className="py-2.5 px-2 text-center font-bold text-rose-700 bg-rose-50/50">{row.absentCount}</td>}
                        {cols.weeklyOffDays && <td className="py-2.5 px-2 text-center font-medium text-slate-500 bg-slate-50">{row.weeklyOffCount}</td>}
                        {cols.payableDays && <td className="py-2.5 px-2 text-center font-extrabold text-amber-900 bg-amber-100/60">{row.payableDays}</td>}
                        {cols.overtimeHours && <td className="py-2.5 px-2 text-center font-mono">{row.totalOvertimeHours}h</td>}

                        {/* Salary Figures */}
                        {cols.basicSalary && <td className="py-2.5 px-3 text-right font-mono text-slate-600">₹{row.empBasic.toLocaleString('en-IN')}</td>}
                        {cols.earnedBasic && <td className="py-2.5 px-3 text-right font-mono font-semibold">₹{row.earnedBasic.toLocaleString('en-IN')}</td>}
                        {cols.hra && <td className="py-2.5 px-3 text-right font-mono text-slate-600">₹{row.hra.toLocaleString('en-IN')}</td>}
                        {cols.da && <td className="py-2.5 px-3 text-right font-mono text-slate-600">₹{(row.da + row.conveyance).toLocaleString('en-IN')}</td>}
                        {cols.grossSalary && (
                          <td className="py-2.5 px-3 text-right font-mono font-extrabold text-slate-900 bg-slate-50">
                            ₹{row.grossSalary.toLocaleString('en-IN')}
                          </td>
                        )}

                        {/* Deductions */}
                        {cols.pfDeduction && <td className="py-2.5 px-2 text-right font-mono text-slate-500">₹{row.pf.toLocaleString('en-IN')}</td>}
                        {cols.esicDeduction && <td className="py-2.5 px-2 text-right font-mono text-slate-500">₹{row.esic.toLocaleString('en-IN')}</td>}
                        {cols.ptDeduction && <td className="py-2.5 px-2 text-right font-mono text-slate-500">₹{row.pt.toLocaleString('en-IN')}</td>}
                        {cols.advanceDeduction && <td className="py-2.5 px-2 text-right font-mono text-slate-500">₹{row.advanceDeduction.toLocaleString('en-IN')}</td>}
                        {cols.totalDeductions && (
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-700 bg-rose-50/50">
                            ₹{row.totalDeductions.toLocaleString('en-IN')}
                          </td>
                        )}

                        {/* Net Payable Salary */}
                        {cols.netSalary && (
                          <td className="py-2.5 px-3 text-right font-mono font-extrabold text-emerald-800 bg-emerald-50">
                            ₹{row.netSalary.toLocaleString('en-IN')}
                          </td>
                        )}

                        {/* Payment Status & Mode */}
                        {cols.paymentStatus && (
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                                row.paymentStatus === 'Paid'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : 'bg-amber-100 text-amber-800 border-amber-300'
                              }`}
                            >
                              {row.paymentStatus}
                            </span>
                          </td>
                        )}

                        {cols.paymentMode && (
                          <td className="py-2.5 px-3 text-center text-slate-600 font-medium">
                            {row.paymentMode}
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>

                {/* Grand Total Footer Row */}
                {masterSheetData.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-900 text-white font-extrabold text-xs">
                      <td colSpan={2} className="py-3 px-3">
                        TOTALS ({grandTotals.count})
                      </td>
                      {cols.empName && <td className="py-3 px-3 text-slate-300">All Employees</td>}
                      {cols.designation && <td></td>}
                      {cols.department && <td></td>}
                      {cols.branch && <td></td>}
                      {cols.bankDetails && <td></td>}
                      {cols.mobileNo && <td></td>}

                      {cols.dayWiseAttendance && <td colSpan={daysInMonth} className="text-center text-slate-400 text-[10px]">MONTH END TOTALS</td>}

                      {cols.totalDays && <td className="text-center"></td>}
                      {cols.presentDays && <td className="text-center text-emerald-300 font-bold">{grandTotals.presentDaysSum}</td>}
                      {cols.halfDays && <td className="text-center"></td>}
                      {cols.leaveDays && <td className="text-center"></td>}
                      {cols.absentDays && <td className="text-center"></td>}
                      {cols.weeklyOffDays && <td className="text-center"></td>}
                      {cols.payableDays && <td className="text-center text-amber-300 font-bold">{grandTotals.payableDaysSum}</td>}
                      {cols.overtimeHours && <td className="text-center">{grandTotals.otHoursSum}h</td>}

                      {cols.basicSalary && <td></td>}
                      {cols.earnedBasic && <td></td>}
                      {cols.hra && <td></td>}
                      {cols.da && <td></td>}
                      {cols.grossSalary && <td className="text-right text-amber-300 font-bold px-3">₹{grandTotals.gross.toLocaleString('en-IN')}</td>}

                      {cols.pfDeduction && <td></td>}
                      {cols.esicDeduction && <td></td>}
                      {cols.ptDeduction && <td></td>}
                      {cols.advanceDeduction && <td></td>}
                      {cols.totalDeductions && <td className="text-right text-rose-300 font-bold px-3">₹{grandTotals.deductions.toLocaleString('en-IN')}</td>}

                      {cols.netSalary && <td className="text-right text-emerald-300 font-extrabold text-sm px-3 bg-emerald-950">₹{grandTotals.net.toLocaleString('en-IN')}</td>}
                      {cols.paymentStatus && <td></td>}
                      {cols.paymentMode && <td></td>}
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>

        {/* Footer info bar */}
        <div className="px-5 py-2.5 bg-slate-800 text-slate-300 text-xs flex flex-wrap items-center justify-between gap-2 shrink-0 border-t border-slate-700">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>
              {'Tip: Click "Column Settings" above to show or hide columns before exporting to Excel or PDF.'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition-all cursor-pointer"
          >
            {'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MasterAttendanceSalarySheetModal;
