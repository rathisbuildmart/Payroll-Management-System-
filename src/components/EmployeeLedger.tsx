import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  FileSpreadsheet, 
  Search, 
  Building, 
  Briefcase, 
  Users, 
  CreditCard, 
  Download, 
  Printer, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  TrendingUp, 
  SlidersHorizontal,
  DollarSign
} from 'lucide-react';
import { Employee, PayrollRecord, AdminSettings } from '../types';

interface EmployeeLedgerProps {
  employees: Employee[];
  payrollRecords: PayrollRecord[];
  language: 'en' | 'hi';
  adminSettings?: AdminSettings;
}

export default function EmployeeLedger({ employees, payrollRecords, language, adminSettings }: EmployeeLedgerProps) {
  // Filters State
  const [selectedBranch, setSelectedBranch] = useState<string>('All');
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('All');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('All');
  const [monthFilter, setMonthFilter] = useState<string>('All');
  
  // Pagination State (Show Entries default to 10)
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Translations
  const t = {
    en: {
      title: "Employee Ledger Report",
      subtitle: "Comprehensive month-by-month payroll & transaction history",
      filterBranch: "Branch Selector",
      filterDept: "Department Segment",
      filterEmployee: "Employee ID & Name",
      filterStatus: "Payment Status",
      filterMonth: "Payroll Month",
      showEntries: "Show Entries",
      searchPlaceholder: "Search ID or Name...",
      all: "All",
      tableMonth: "Month",
      tableEmp: "Employee Detail",
      tableBranch: "Branch / Dept",
      tableBasic: "Basic Salary",
      tableGross: "Gross Salary",
      tableDeduction: "Deductions",
      tableNet: "Net Payable",
      tableStatus: "Status",
      tableAction: "Actions",
      paid: "Paid",
      pending: "Pending",
      totalGross: "Total Gross Pool",
      totalDeductions: "Total Deductions",
      totalNet: "Total Net Disbursed",
      totalRecords: "Total Transactions",
      showing: "Showing",
      to: "to",
      of: "of",
      entries: "entries",
      prev: "Previous",
      next: "Next",
      print: "Print Ledger",
      exportCSV: "Export CSV",
      emptyState: "No ledger transactions match the current filter selection.",
      currency: "₹",
    },
    hi: {
      title: "कर्मचारी लेजर रिपोर्ट",
      subtitle: "महीने-दर-महीने वेतन और वित्तीय लेनदेन का विस्तृत इतिहास",
      filterBranch: "शाखा चयन",
      filterDept: "विभाग खंड",
      filterEmployee: "कर्मचारी आईडी और नाम",
      filterStatus: "भुगतान की स्थिति",
      filterMonth: "वेतन महीना",
      showEntries: "प्रविष्टियाँ दिखाएं",
      searchPlaceholder: "आईडी या नाम खोजें...",
      all: "सभी",
      tableMonth: "महीना",
      tableEmp: "कर्मचारी विवरण",
      tableBranch: "शाखा / विभाग",
      tableBasic: "मूल वेतन",
      tableGross: "सकल वेतन",
      tableDeduction: "कटौती",
      tableNet: "निवल देय",
      tableStatus: "स्थिति",
      tableAction: "कार्रवाई",
      paid: "भुगतान किया गया",
      pending: "लंबित",
      totalGross: "कुल सकल राशि",
      totalDeductions: "कुल कटौती",
      totalNet: "कुल निवल वितरित",
      totalRecords: "कुल लेनदेन",
      showing: "दिखाया जा रहा है",
      to: "से",
      of: "का",
      entries: "प्रविष्टियां",
      prev: "पिछला",
      next: "अगला",
      print: "लेजर प्रिंट करें",
      exportCSV: "सीएसवी डाउनलोड",
      emptyState: "वर्तमान फ़िल्टर चयन से कोई लेजर लेनदेन मेल नहीं खाता।",
      currency: "₹",
    }
  }[language];

  // Unique Options lists
  const branchOptions = useMemo(() => {
    const branches = new Set<string>();
    employees.forEach(emp => {
      if (emp.branch) branches.add(emp.branch);
    });
    return [t.all, ...Array.from(branches)];
  }, [employees, t.all]);

  const departmentOptions = useMemo(() => {
    const depts = new Set<string>();
    employees.forEach(emp => {
      if (emp.department) depts.add(emp.department);
    });
    return [t.all, ...Array.from(depts)];
  }, [employees, t.all]);

  const monthOptions = useMemo(() => {
    const months = new Set<string>();
    payrollRecords.forEach(rec => {
      if (rec.monthYear) months.add(rec.monthYear);
    });
    return [t.all, ...Array.from(months).sort().reverse()];
  }, [payrollRecords, t.all]);

  const employeeOptions = useMemo(() => {
    return employees.map(emp => ({
      id: emp.id,
      name: emp.name,
      display: emp.isActive !== false ? `${emp.name} (${emp.id})` : `${emp.name} (${emp.id}) - ${language === 'en' ? 'Inactive' : 'निष्क्रिय'}`
    }));
  }, [employees, language]);

  // Bidirectional Filter Logic
  const filteredLedger = useMemo(() => {
    return payrollRecords.filter(rec => {
      const emp = employees.find(e => e.id.trim().toLowerCase() === rec.employeeId.trim().toLowerCase());
      if (!emp) return false;

      // Filter by Branch
      const matchesBranch = selectedBranch === t.all || emp.branch === selectedBranch;
      
      // Filter by Department
      const matchesDept = selectedDept === t.all || emp.department === selectedDept;
      
      // Filter by Employee ID & Name Selection
      const matchesEmployee = selectedEmployeeId === t.all || rec.employeeId === selectedEmployeeId;

      // Filter by Payment Status
      const matchesStatus = paymentStatusFilter === t.all || rec.paymentStatus === paymentStatusFilter;

      // Filter by Month
      const matchesMonth = monthFilter === t.all || rec.monthYear === monthFilter;

      return matchesBranch && matchesDept && matchesEmployee && matchesStatus && matchesMonth;
    });
  }, [payrollRecords, employees, selectedBranch, selectedDept, selectedEmployeeId, paymentStatusFilter, monthFilter, t.all]);

  // Statistics Totals
  const totals = useMemo(() => {
    return filteredLedger.reduce((acc, curr) => {
      acc.gross += curr.totalSalary || 0;
      acc.deductions += curr.deductions || 0;
      acc.net += curr.netSalary || curr.totalSalary - curr.deductions;
      return acc;
    }, { gross: 0, deductions: 0, net: 0 });
  }, [filteredLedger]);

  // Paginated Ledger Data
  const paginatedLedger = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredLedger.slice(startIndex, startIndex + pageSize);
  }, [filteredLedger, currentPage, pageSize]);

  // Total Pages
  const totalPages = Math.ceil(filteredLedger.length / pageSize) || 1;

  // Handle page size change reset to page 1
  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value));
    setCurrentPage(1);
  };

  // Helper to trigger print view
  const handlePrint = () => {
    window.print();
  };

  // CSV Exporter
  const handleExportCSV = () => {
    const headers = [
      "Month",
      "Employee ID",
      "Employee Name",
      "Branch",
      "Department",
      "Basic Salary",
      "Gross Salary",
      "Deductions",
      "Net Payable",
      "Status"
    ];
    
    const rows = filteredLedger.map(rec => {
      const emp = employees.find(e => e.id === rec.employeeId);
      return [
        rec.monthYear,
        rec.employeeId,
        emp ? emp.name : "Unknown",
        emp?.branch || "-",
        emp?.department || "-",
        rec.basicSalary,
        rec.totalSalary,
        rec.deductions,
        rec.netSalary || rec.totalSalary - rec.deductions,
        rec.paymentStatus
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Employee_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Prettier Month Name formatter
  const formatMonthName = (m: string) => {
    if (m === t.all) return t.all;
    const [year, month] = m.split('-');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const index = parseInt(month) - 1;
    return monthNames[index] ? `${monthNames[index]} ${year}` : m;
  };

  return (
    <div className="space-y-3.5">
      {/* Title & Actions Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 px-4 rounded-xl border border-gray-200/80 shadow-3xs no-print">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-emerald-500/10 text-emerald-600 rounded-lg shrink-0">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-900 tracking-tight leading-none">{t.title}</h1>
            <p className="text-[10px] text-gray-500 mt-1 font-semibold leading-none">{t.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-150 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider font-mono transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{t.print}</span>
          </button>
          
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-[#03623c] hover:bg-[#024d2e] text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider font-mono transition-all cursor-pointer shadow-3xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.exportCSV}</span>
          </button>
        </div>
      </div>

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-2.5 px-3 rounded-xl border border-gray-200 shadow-3xs flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600 shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest font-mono truncate">{t.totalRecords}</p>
            <p className="text-sm font-black text-slate-900 leading-tight">{filteredLedger.length}</p>
          </div>
        </div>

        <div className="bg-white p-2.5 px-3 rounded-xl border border-gray-200 shadow-3xs flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-50 text-orange-600 shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest font-mono truncate">{t.totalGross}</p>
            <p className="text-sm font-black text-slate-900 font-mono leading-tight truncate">{t.currency}{totals.gross.toLocaleString('en-IN')}</p>
          </div>
        </div>

        <div className="bg-white p-2.5 px-3 rounded-xl border border-gray-200 shadow-3xs flex items-center gap-3">
          <div className="p-2 rounded-lg bg-rose-50 text-rose-600 shrink-0">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest font-mono truncate">{t.totalDeductions}</p>
            <p className="text-sm font-black text-slate-900 font-mono leading-tight truncate">{t.currency}{totals.deductions.toLocaleString('en-IN')}</p>
          </div>
        </div>

        <div className="bg-white p-2.5 px-3 rounded-xl border border-gray-200 shadow-3xs flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-50 text-[#03623c] shrink-0">
            <DollarSign className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest font-mono truncate">{t.totalNet}</p>
            <p className="text-sm font-black text-[#03623c] font-mono leading-tight truncate">{t.currency}{totals.net.toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>

      {/* Robust Filtering Control Section */}
      <div className="bg-white p-3 px-4 rounded-xl border border-gray-200 shadow-3xs space-y-2.5 no-print">
        <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
          <div className="flex items-center gap-1.5 text-slate-800 font-black text-[10px] uppercase tracking-wider">
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
            <span>{language === 'en' ? 'Report Parameters & Filters' : 'रिपोर्ट पैरामीटर और फ़िल्टर'}</span>
          </div>
          <div className="text-[10px] text-slate-500 font-bold">
            {t.showing} <span className="text-slate-800">{filteredLedger.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</span> {t.to} <span className="text-slate-800">{Math.min(currentPage * pageSize, filteredLedger.length)}</span> {t.of} <span className="text-slate-800">{filteredLedger.length}</span> {t.entries}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {/* Branch Select */}
          <div className="flex flex-col gap-0.5">
            <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest font-mono leading-tight">{t.filterBranch}</label>
            <div className="relative">
              <Building className="absolute left-2.5 top-2 w-3 h-3 text-gray-400" />
              <select
                value={selectedBranch}
                onChange={(e) => { setSelectedBranch(e.target.value); setCurrentPage(1); }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-7 pr-2 py-1.5 text-[11px] font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all cursor-pointer"
              >
                {branchOptions.map(branch => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Department Select */}
          <div className="flex flex-col gap-0.5">
            <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest font-mono leading-tight">{t.filterDept}</label>
            <div className="relative">
              <Briefcase className="absolute left-2.5 top-2 w-3 h-3 text-gray-400" />
              <select
                value={selectedDept}
                onChange={(e) => { setSelectedDept(e.target.value); setCurrentPage(1); }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-7 pr-2 py-1.5 text-[11px] font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all cursor-pointer"
              >
                {departmentOptions.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Employee ID & Name Select */}
          <div className="flex flex-col gap-0.5">
            <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest font-mono leading-tight">{t.filterEmployee}</label>
            <div className="relative">
              <Users className="absolute left-2.5 top-2 w-3 h-3 text-gray-400" />
              <select
                value={selectedEmployeeId}
                onChange={(e) => { setSelectedEmployeeId(e.target.value); setCurrentPage(1); }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-7 pr-2 py-1.5 text-[11px] font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all cursor-pointer"
              >
                <option value="All">{t.all}</option>
                {employeeOptions.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.display}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Month Filter */}
          <div className="flex flex-col gap-0.5">
            <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest font-mono leading-tight">{t.filterMonth}</label>
            <select
              value={monthFilter}
              onChange={(e) => { setMonthFilter(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all cursor-pointer"
            >
              <option value="All">{t.all}</option>
              {monthOptions.filter(m => m !== t.all).map(m => (
                <option key={m} value={m}>{formatMonthName(m)}</option>
              ))}
            </select>
          </div>

          {/* Payment Status Filter */}
          <div className="flex flex-col gap-0.5">
            <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest font-mono leading-tight">{t.filterStatus}</label>
            <select
              value={paymentStatusFilter}
              onChange={(e) => { setPaymentStatusFilter(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all cursor-pointer"
            >
              <option value="All">{t.all}</option>
              <option value="Paid">{t.paid}</option>
              <option value="Pending">{t.pending}</option>
            </select>
          </div>

          {/* Show Entries */}
          <div className="flex flex-col gap-0.5">
            <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest font-mono leading-tight">{t.showEntries}</label>
            <select
              value={pageSize}
              onChange={handlePageSizeChange}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Ledger Print Layout & Web Table */}
      <div className="bg-white rounded-2xl border border-gray-250 shadow-xs overflow-hidden">
        {/* Printable Only Header */}
        <div className="hidden print:block p-6 border-b border-gray-200 text-center space-y-2">
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{adminSettings?.companyName || "PAYROLL MANAGEMENT SYSTEM"}</h1>
          <p className="text-sm font-semibold text-slate-600">{t.title} - {new Date().toLocaleDateString()}</p>
          <div className="grid grid-cols-4 gap-4 pt-4 text-left border-t border-gray-200">
            <div className="text-xs"><strong>Branch:</strong> {selectedBranch}</div>
            <div className="text-xs"><strong>Department:</strong> {selectedDept}</div>
            <div className="text-xs"><strong>Employee Filter:</strong> {selectedEmployeeId}</div>
            <div className="text-xs"><strong>Month:</strong> {monthFilter}</div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-900 font-bold text-xs uppercase tracking-wider font-mono">
                <th className="px-5 py-4 font-black">{t.tableMonth}</th>
                <th className="px-5 py-4 font-black">{t.tableEmp}</th>
                <th className="px-5 py-4 font-black">{t.tableBranch}</th>
                <th className="px-5 py-4 text-right font-black">{t.tableBasic}</th>
                <th className="px-5 py-4 text-right font-black">{t.tableGross}</th>
                <th className="px-5 py-4 text-right font-black">{t.tableDeduction}</th>
                <th className="px-5 py-4 text-right font-black">{t.tableNet}</th>
                <th className="px-5 py-4 text-center font-black">{t.tableStatus}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {paginatedLedger.length > 0 ? (
                paginatedLedger.map((rec, index) => {
                  const emp = employees.find(e => e.id.trim().toLowerCase() === rec.employeeId.trim().toLowerCase());
                  const netPay = rec.netSalary || rec.totalSalary - rec.deductions;
                  return (
                    <tr 
                      key={`${rec.employeeId}-${rec.monthYear}-${index}`}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-5 py-4 font-bold text-slate-800 whitespace-nowrap">
                        {formatMonthName(rec.monthYear)}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="font-extrabold text-slate-900">{emp ? emp.name : rec.employeeId}</div>
                        <div className="text-[10px] text-gray-500 font-mono font-bold mt-0.5">ID: {rec.employeeId}</div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">{emp?.branch || "Main"}</div>
                        <div className="text-[10px] text-gray-500 font-semibold mt-0.5">{emp?.department || "-"}</div>
                      </td>
                      <td className="px-5 py-4 text-right font-semibold text-slate-800 font-mono whitespace-nowrap">
                        {t.currency}{rec.basicSalary.toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-slate-900 font-mono whitespace-nowrap">
                        {t.currency}{rec.totalSalary.toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-4 text-right font-semibold text-rose-600 font-mono whitespace-nowrap">
                        {t.currency}{rec.deductions.toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-4 text-right font-extrabold text-[#03623c] font-mono whitespace-nowrap">
                        {t.currency}{netPay.toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-4 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          rec.paymentStatus === 'Paid' 
                            ? 'bg-emerald-50 text-[#03623c] border border-emerald-500/25' 
                            : 'bg-amber-50 text-amber-700 border border-amber-500/25'
                        }`}>
                          {rec.paymentStatus === 'Paid' ? t.paid : t.pending}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center text-gray-500 font-medium">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <FileSpreadsheet className="w-8 h-8 text-slate-300" />
                      <p>{t.emptyState}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
            {/* Table Footer Totals */}
            {filteredLedger.length > 0 && (
              <tfoot>
                <tr className="bg-slate-50/50 border-t border-slate-200 font-extrabold text-slate-900 text-xs">
                  <td colSpan={3} className="px-5 py-4 text-left uppercase tracking-wider font-display font-black">
                    {language === 'en' ? 'Report Total Summary' : 'रिपोर्ट कुल सारांश'}
                  </td>
                  <td className="px-5 py-4 text-right font-mono text-slate-800">
                    {t.currency}{filteredLedger.reduce((acc, c) => acc + c.basicSalary, 0).toLocaleString('en-IN')}
                  </td>
                  <td className="px-5 py-4 text-right font-mono text-slate-900">
                    {t.currency}{totals.gross.toLocaleString('en-IN')}
                  </td>
                  <td className="px-5 py-4 text-right font-mono text-rose-600">
                    {t.currency}{totals.deductions.toLocaleString('en-IN')}
                  </td>
                  <td className="px-5 py-4 text-right font-mono text-[#03623c]">
                    {t.currency}{totals.net.toLocaleString('en-IN')}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Printable Footer */}
        <div className="hidden print:block text-right mt-16 p-6 text-xs text-slate-500">
          <p className="font-semibold">{language === 'en' ? 'Authorized Signature' : 'अधिकृत हस्ताक्षर'}</p>
          <div className="mt-12 border-t border-slate-300 w-48 inline-block" />
        </div>

        {/* Pagination Control Bar */}
        <div className="bg-white border-t border-slate-100 px-5 py-4 flex items-center justify-between gap-4 no-print">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            {t.prev}
          </button>

          <div className="text-xs font-extrabold text-slate-800 font-mono">
            Page {currentPage} of {totalPages}
          </div>

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {t.next}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
