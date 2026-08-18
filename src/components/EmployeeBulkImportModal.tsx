import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
  Upload, Download, AlertCircle, Check, X, ArrowRight, Settings2, Eye, 
  FileSpreadsheet, Filter, CheckCircle2, AlertTriangle, RefreshCw, FileText, 
  Search, ShieldCheck, Sparkles, ChevronRight, HelpCircle
} from 'lucide-react';
import { Employee } from '../types';

export interface EmployeeFieldDefinition {
  key: keyof Employee | 'skip';
  label: string;
  category: 'Required' | 'Personal' | 'Contact' | 'Employment' | 'Salary' | 'Banking & Statutory' | 'Address' | 'Payroll Rules' | 'Security';
  description: string;
  type: 'string' | 'number' | 'boolean' | 'date';
  required?: boolean;
  aliases: string[];
}

export const EMPLOYEE_FIELDS: EmployeeFieldDefinition[] = [
  // Required
  { key: 'id', label: 'Employee ID *', category: 'Required', description: 'Unique alphanumeric ID (e.g. RS001)', type: 'string', required: true, aliases: ['id', 'employeeid', 'empid', 'staffid', 'empcode', 'code', 'employeeid*'] },
  { key: 'name', label: 'Full Name *', category: 'Required', description: 'Employee complete name', type: 'string', required: true, aliases: ['name', 'fullname', 'employeename', 'staffname', 'fullname*'] },
  
  // Employment
  { key: 'department', label: 'Department', category: 'Employment', description: 'e.g. Engineering, Sales, HO, MDO', type: 'string', aliases: ['department', 'dept', 'division', 'deptname'] },
  { key: 'designation', label: 'Designation / Role', category: 'Employment', description: 'Job title e.g. Accounts Executive, Sales Coordinator', type: 'string', aliases: ['designation', 'role', 'title', 'jobtitle', 'position'] },
  { key: 'joiningDate', label: 'Joining Date', category: 'Employment', description: 'Date of joining (converts any format to YYYY-MM-DD)', type: 'date', aliases: ['joiningdate', 'dateofjoining', 'doj', 'hiredate', 'startdate', 'joiningdateyyyymmdd'] },
  { key: 'branch', label: 'Branch / Location', category: 'Employment', description: 'Store/Office location (e.g. Raipur)', type: 'string', aliases: ['branch', 'branchname', 'location', 'office'] },
  { key: 'costCenter', label: 'Cost Center', category: 'Employment', description: 'Cost allocation unit (e.g. Raipur Store)', type: 'string', aliases: ['costcenter', 'costcentre'] },
  { key: 'reportingTo', label: 'Reporting Manager', category: 'Employment', description: 'Direct supervisor name', type: 'string', aliases: ['reportingto', 'reportto', 'manager', 'supervisor'] },
  { key: 'noticePeriod', label: 'Notice Period', category: 'Employment', description: 'e.g. 30 Days, 1 Month', type: 'string', aliases: ['noticeperiod', 'notice'] },
  { key: 'workTiming', label: 'Work Timing / Shift', category: 'Employment', description: 'Assigned shift (e.g. Shift 1 (10:00 AM - 08:00 PM))', type: 'string', aliases: ['worktiming', 'shift', 'workshift', 'timing'] },
  { key: 'employeeGroup', label: 'Employee Group', category: 'Employment', description: 'Staff grouping / Grade', type: 'string', aliases: ['employeegroup', 'group', 'grade'] },
  { key: 'weeklyOffProfile', label: 'Weekly Off Profile', category: 'Employment', description: 'e.g. Sunday, Rotational', type: 'string', aliases: ['weeklyoffprofile', 'weeklyoff', 'weekoff'] },
  { key: 'leaveType', label: 'Leave Profile', category: 'Employment', description: 'Leave entitlement policy', type: 'string', aliases: ['leavetype', 'leaveprofile'] },
  { key: 'probationDate', label: 'Probation End Date', category: 'Employment', description: 'End of probation period', type: 'date', aliases: ['probationdate', 'probation', 'probationdateyyyymmdd'] },
  { key: 'confirmationDate', label: 'Confirmation Date', category: 'Employment', description: 'Official confirmation date', type: 'date', aliases: ['confirmationdate', 'confirmation', 'confirmationdateyyyymmdd'] },
  { key: 'employmentType', label: 'Employment Type', category: 'Employment', description: 'Fresher / Experienced / Contract', type: 'string', aliases: ['employmenttype', 'type', 'emptype'] },
  { key: 'referenceNumber', label: 'Reference Number', category: 'Employment', description: 'Recruitment or file reference', type: 'string', aliases: ['referencenumber', 'reference', 'refno'] },
  { key: 'isActive', label: 'Is Active Status', category: 'Employment', description: 'True / Active or False / Inactive', type: 'boolean', aliases: ['isactive', 'active', 'status', 'activestatus'] },

  // Salary & Compensation
  { key: 'basicSalary', label: 'Basic Salary (Monthly)', category: 'Salary', description: 'Monthly basic salary in INR', type: 'number', aliases: ['basicsalary', 'basic', 'salary', 'grosssalary', 'monthlysalary', 'pay'] },
  { key: 'allowances', label: 'Allowances (Monthly)', category: 'Salary', description: 'Monthly fixed allowances', type: 'number', aliases: ['allowances', 'allowance', 'otherallowances'] },
  { key: 'deductions', label: 'Deductions (Monthly)', category: 'Salary', description: 'Monthly regular deductions', type: 'number', aliases: ['deductions', 'deduction', 'otherdeductions'] },
  { key: 'hourlyRate', label: 'Overtime Hourly Rate', category: 'Salary', description: 'INR per overtime hour', type: 'number', aliases: ['overtimehourlyrate', 'hourlyrate', 'overtimerate', 'otrate'] },
  { key: 'paymentMethod', label: 'Payment Method', category: 'Salary', description: 'Bank Transfer / Cash / Cheque', type: 'string', aliases: ['paymentmethod', 'payment', 'paymethod', 'paymode'] },
  { key: 'ctcOffered', label: 'CTC Offered (Annual)', category: 'Salary', description: 'Annual Cost to Company', type: 'number', aliases: ['ctcoffered', 'ctc', 'annualctc', 'package'] },
  { key: 'hra', label: 'HRA Amount', category: 'Salary', description: 'House Rent Allowance', type: 'number', aliases: ['hra', 'hramount'] },
  { key: 'da', label: 'DA Amount', category: 'Salary', description: 'Dearness Allowance', type: 'number', aliases: ['da', 'daamount'] },
  { key: 'conveyanceAllowance', label: 'Conveyance Allowance', category: 'Salary', description: 'Travel / Conveyance amount', type: 'number', aliases: ['conveyanceallowance', 'conveyance', 'travelallowance'] },
  { key: 'advanceSalaryBalance', label: 'Advance / Loan Balance', category: 'Salary', description: 'Outstanding advance loan amount', type: 'number', aliases: ['advancesalarybalance', 'advancebalance', 'loanbalance'] },
  { key: 'advanceSalaryDeduction', label: 'Advance Monthly Deduction', category: 'Salary', description: 'Monthly installment deduction', type: 'number', aliases: ['advancesalarydeduction', 'advancededuction', 'loandeduction'] },
  { key: 'clBalance', label: 'Casual Leave (CL) Balance', category: 'Salary', description: 'Available CL days', type: 'number', aliases: ['clbalance', 'cl', 'casualleave'] },
  { key: 'elBalance', label: 'Earned Leave (EL) Balance', category: 'Salary', description: 'Available EL/Paid Leave days', type: 'number', aliases: ['elbalance', 'el', 'earnedleave', 'pl'] },

  // Personal Details
  { key: 'firstName', label: 'First Name', category: 'Personal', description: 'First name', type: 'string', aliases: ['firstname', 'first'] },
  { key: 'lastName', label: 'Last Name', category: 'Personal', description: 'Last name / Surname', type: 'string', aliases: ['lastname', 'last', 'surname'] },
  { key: 'dob', label: 'Date of Birth (DOB)', category: 'Personal', description: 'Birth date (e.g. 18-Nov-94, 20/05/1992)', type: 'date', aliases: ['dob', 'dateofbirth', 'birthdate', 'dobyyyymmdd'] },
  { key: 'gender', label: 'Gender', category: 'Personal', description: 'Male / Female / Other', type: 'string', aliases: ['gender', 'sex'] },
  { key: 'bloodGroup', label: 'Blood Group', category: 'Personal', description: 'e.g. O+, A+, B+, AB+', type: 'string', aliases: ['bloodgroup', 'blood', 'bloodtype'] },

  // Contact Details
  { key: 'mobileNo', label: 'Mobile No (Primary)', category: 'Contact', description: 'Primary phone number', type: 'string', aliases: ['mobileno', 'mobile', 'phone', 'phoneno', 'contact', 'contactno', 'cell'] },
  { key: 'personalMobileNo', label: 'Personal / Alt Mobile No', category: 'Contact', description: 'Secondary/Personal number', type: 'string', aliases: ['personalmobileno', 'personalmobile', 'altmobile', 'alternatephone', 'altphone'] },
  { key: 'email', label: 'Official / Primary Email', category: 'Contact', description: 'Company/Primary email address', type: 'string', aliases: ['email', 'emailid', 'officialemail', 'workemail', 'mail'] },
  { key: 'personalEmail', label: 'Personal Email', category: 'Contact', description: 'Personal email address', type: 'string', aliases: ['personalemail', 'altemail'] },
  { key: 'emergencyContactNo', label: 'Emergency Contact No', category: 'Contact', description: 'Emergency phone number', type: 'string', aliases: ['emergencycontactno', 'emergencycontact', 'emergencyphone'] },

  // Banking & Statutory
  { key: 'bankAccountNo', label: 'Bank Account Number', category: 'Banking & Statutory', description: 'Bank account number', type: 'string', aliases: ['bankaccountno', 'accountno', 'bankaccno', 'acno', 'accountnumber'] },
  { key: 'bankAccountHolderName', label: 'Account Holder Name', category: 'Banking & Statutory', description: 'Name as per bank records', type: 'string', aliases: ['bankaccountholdername', 'accountholdername', 'holdername'] },
  { key: 'bankName', label: 'Bank Name', category: 'Banking & Statutory', description: 'e.g. SBI, HDFC, ICICI, PNB', type: 'string', aliases: ['bankname', 'bank'] },
  { key: 'ifscCode', label: 'IFSC Code', category: 'Banking & Statutory', description: '11-character bank IFSC code', type: 'string', aliases: ['ifsccode', 'ifsc'] },
  { key: 'panNo', label: 'PAN Card Number', category: 'Banking & Statutory', description: '10-character PAN number', type: 'string', aliases: ['panno', 'pan', 'pancard'] },
  { key: 'aadhaarNo', label: 'Aadhaar Number', category: 'Banking & Statutory', description: '12-digit Aadhaar number', type: 'string', aliases: ['aadhaarno', 'aadhaar', 'aadharno', 'aadhar', 'uidai'] },
  { key: 'pfAccountNo', label: 'PF Account Number', category: 'Banking & Statutory', description: 'Provident Fund member ID', type: 'string', aliases: ['pfaccountno', 'pfno', 'pfnumber'] },
  { key: 'esicNo', label: 'ESIC Number', category: 'Banking & Statutory', description: 'ESIC IP Number', type: 'string', aliases: ['esicno', 'esic', 'esicnumber', 'ipno'] },
  { key: 'uan', label: 'UAN (Universal Account No)', category: 'Banking & Statutory', description: '12-digit PF UAN', type: 'string', aliases: ['uan', 'uanno', 'uannumber'] },

  // Address Details
  { key: 'resLine1', label: 'Residential Address Line 1', category: 'Address', description: 'Current street/flat address', type: 'string', aliases: ['resline1', 'residentialaddressline1', 'currentaddress'] },
  { key: 'resLine2', label: 'Residential Address Line 2', category: 'Address', description: 'Current locality/landmark', type: 'string', aliases: ['resline2', 'residentialaddressline2'] },
  { key: 'resCity', label: 'Residential City', category: 'Address', description: 'City name', type: 'string', aliases: ['rescity', 'residentialcity'] },
  { key: 'resState', label: 'Residential State', category: 'Address', description: 'State name', type: 'string', aliases: ['resstate', 'residentialstate'] },
  { key: 'resCountry', label: 'Residential Country', category: 'Address', description: 'Country (default India)', type: 'string', aliases: ['rescountry', 'residentialcountry'] },
  { key: 'resPinCode', label: 'Residential PIN Code', category: 'Address', description: '6-digit PIN code', type: 'string', aliases: ['respincode', 'residentialpincode', 'reszip'] },

  { key: 'permLine1', label: 'Permanent Address Line 1', category: 'Address', description: 'Permanent street address', type: 'string', aliases: ['permline1', 'permanentaddressline1', 'permanentaddress'] },
  { key: 'permLine2', label: 'Permanent Address Line 2', category: 'Address', description: 'Permanent locality', type: 'string', aliases: ['permline2', 'permanentaddressline2'] },
  { key: 'permCity', label: 'Permanent City', category: 'Address', description: 'Permanent city', type: 'string', aliases: ['permcity', 'permanentcity'] },
  { key: 'permState', label: 'Permanent State', category: 'Address', description: 'Permanent state', type: 'string', aliases: ['permstate', 'permanentstate'] },
  { key: 'permCountry', label: 'Permanent Country', category: 'Address', description: 'Permanent country', type: 'string', aliases: ['permcountry', 'permanentcountry'] },
  { key: 'permPinCode', label: 'Permanent PIN Code', category: 'Address', description: 'Permanent PIN code', type: 'string', aliases: ['permpincode', 'permanentpincode', 'permzip'] },

  // Payroll Applicability Rules
  { key: 'isPfApplicable', label: 'PF Applicable', category: 'Payroll Rules', description: 'Enable/Disable EPF deductions', type: 'boolean', aliases: ['ispfapplicable', 'pfapplicable'] },
  { key: 'isEsicApplicable', label: 'ESIC Applicable', category: 'Payroll Rules', description: 'Enable/Disable ESIC benefits', type: 'boolean', aliases: ['isesicapplicable', 'esicapplicable'] },
  { key: 'isPtApplicable', label: 'PT Applicable', category: 'Payroll Rules', description: 'Enable/Disable Professional Tax', type: 'boolean', aliases: ['isptapplicable', 'ptapplicable'] },
  { key: 'isHraApplicable', label: 'HRA Applicable', category: 'Payroll Rules', description: 'Enable/Disable HRA calculation', type: 'boolean', aliases: ['ishraapplicable', 'hraapplicable'] },
  { key: 'isDaApplicable', label: 'DA Applicable', category: 'Payroll Rules', description: 'Enable/Disable DA calculation', type: 'boolean', aliases: ['isdaapplicable', 'daapplicable'] },
  { key: 'isConveyanceApplicable', label: 'Conveyance Applicable', category: 'Payroll Rules', description: 'Enable/Disable Conveyance', type: 'boolean', aliases: ['isconveyanceapplicable', 'conveyanceapplicable'] },
  { key: 'isPaidLeaveApplicable', label: 'Paid Leave Applicable', category: 'Payroll Rules', description: 'Enable/Disable Paid Leave accrual', type: 'boolean', aliases: ['ispaidleaveapplicable', 'paidleaveapplicable'] },

  // Security & Portal
  { key: 'password', label: 'Portal Password', category: 'Security', description: 'Login password (defaults to ID or 123456)', type: 'string', aliases: ['password', 'pass', 'portalpassword', 'loginpassword'] }
];

/**
 * Universal flexible date parser:
 * Handles:
 * - 1/5/2015, 01/05/2015, 25/11/2024 (DD/MM/YYYY or D/M/YYYY)
 * - 18-Nov-94, 20-May-92, 2-Jun-98, 5-Oct-03, 1-Apr-00, 5-Dec-84 (DD-MMM-YY)
 * - 1994-11-18 (YYYY-MM-DD)
 * - 1994/11/18, 18-11-1994
 */
export function parseFlexibleDate(dateStr: string): string {
  if (!dateStr || !dateStr.trim()) return '';
  const trimmed = dateStr.trim();

  // 1. Direct YYYY-MM-DD check
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // 2. Month name check (e.g. 18-Nov-94, 20-May-1992, 2-Jun-98, 5-Oct-03)
  const monthMap: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
    january: '01', february: '02', march: '03', april: '04', june: '06',
    july: '07', august: '08', september: '09', october: '10', november: '11', december: '12'
  };

  const monthRegex = /^(\d{1,2})[-/\s]([A-Za-z]{3,9})[-/\s](\d{2,4})$/i;
  const matchMonth = trimmed.match(monthRegex);
  if (matchMonth) {
    const day = matchMonth[1].padStart(2, '0');
    const monStr = matchMonth[2].toLowerCase();
    const month = monthMap[monStr];
    let year = matchMonth[3];
    if (year.length === 2) {
      const yrNum = parseInt(year, 10);
      // If 2-digit year: <= 30 is 20xx (e.g. 24 -> 2024, 03 -> 2003), > 30 is 19xx (e.g. 94 -> 1994)
      year = yrNum <= 30 ? `20${year.padStart(2, '0')}` : `19${year}`;
    }
    if (month) {
      return `${year}-${month}-${day}`;
    }
  }

  // 3. Slash or Hyphen separated numeric date (e.g. 1/5/2015, 25/11/2024, 24/02/2026)
  const numParts = trimmed.split(/[-/.]/);
  if (numParts.length === 3) {
    let [p1, p2, p3] = numParts;
    // Format: YYYY-MM-DD or YYYY/MM/DD
    if (p1.length === 4) {
      return `${p1}-${p2.padStart(2, '0')}-${p3.padStart(2, '0')}`;
    }
    // Format: DD/MM/YYYY or D/M/YYYY
    if (p3.length === 4) {
      return `${p3}-${p2.padStart(2, '0')}-${p1.padStart(2, '0')}`;
    }
    // 2-digit year at end: e.g. 1/5/15, 25/11/24, 18/11/94
    if (p3.length === 2) {
      const yrNum = parseInt(p3, 10);
      const fullYr = yrNum <= 30 ? `20${p3.padStart(2, '0')}` : `19${p3}`;
      return `${fullYr}-${p2.padStart(2, '0')}-${p1.padStart(2, '0')}`;
    }
  }

  // 4. Fallback: native JS Date
  try {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
  } catch {
    // ignore
  }

  return trimmed;
}

/**
 * Standardizes normalized key for comparing aliases
 */
export function normalizeHeaderKey(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Auto-detect the best matching Employee field for a given CSV header name
 */
export function autoDetectField(csvHeader: string): keyof Employee | 'skip' {
  const clean = normalizeHeaderKey(csvHeader);
  if (!clean) return 'skip';

  for (const field of EMPLOYEE_FIELDS) {
    if (field.aliases.some(alias => normalizeHeaderKey(alias) === clean)) {
      return field.key;
    }
  }

  // Substring check for high confidence
  if (clean.includes('employeeid') || clean === 'empid' || clean === 'empcode') return 'id';
  if (clean.includes('fullname') || clean === 'employeename') return 'name';
  if (clean.includes('joiningdate') || clean.includes('doj')) return 'joiningDate';
  if (clean.includes('basicsalary') || (clean.includes('salary') && !clean.includes('advance'))) return 'basicSalary';
  if (clean.includes('dob') || clean.includes('dateofbirth')) return 'dob';
  if (clean.includes('department') || clean === 'dept') return 'department';
  if (clean.includes('designation') || clean === 'jobtitle') return 'designation';
  if (clean.includes('worktiming') || clean.includes('shift')) return 'workTiming';
  if (clean.includes('mobileno') || clean.includes('phoneno') || clean === 'mobile' || clean === 'phone') return 'mobileNo';
  if (clean.includes('personalmobile')) return 'personalMobileNo';
  if (clean.includes('bankacc') || clean.includes('accountno')) return 'bankAccountNo';
  if (clean.includes('aadhaar') || clean.includes('aadhar')) return 'aadhaarNo';
  if (clean.includes('pan') && clean.includes('no')) return 'panNo';

  return 'skip';
}

export interface EmployeeBulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmImport?: (employees: Employee[]) => Promise<void>;
  onImportSuccess?: (employees: Employee[]) => Promise<void>;
  existingEmployees: Employee[];
  language?: 'en' | 'hi';
  onExportExisting?: () => void;
}

export default function EmployeeBulkImportModal({
  isOpen,
  onClose,
  onConfirmImport,
  onImportSuccess,
  existingEmployees,
  language = 'en',
  onExportExisting
}: EmployeeBulkImportModalProps) {
  // Step navigation: 1 = Upload, 2 = Heading Selection & Column Mapping, 3 = Data Preview & Validation
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  
  // CSV Raw Data State
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [pastedCsvText, setPastedCsvText] = useState<string>('');
  const [showPasteArea, setShowPasteArea] = useState<boolean>(false);

  // Column Mappings State: index -> Employee key or 'skip'
  const [columnMappings, setColumnMappings] = useState<Record<number, keyof Employee | 'skip'>>({});
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  
  // Preview and Import States
  const [parsedEmployees, setParsedEmployees] = useState<Employee[]>([]);
  const [parsingErrors, setParsingErrors] = useState<string[]>([]);
  const [parsingWarnings, setParsingWarnings] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [previewFilter, setPreviewFilter] = useState<'all' | 'ready' | 'warnings'>('all');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal closes/opens
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      setRawHeaders([]);
      setRawRows([]);
      setColumnMappings({});
      setParsedEmployees([]);
      setParsingErrors([]);
      setParsingWarnings([]);
      setFileName('');
      setPastedCsvText('');
      setShowPasteArea(false);
    }
  }, [isOpen]);

  // Robust CSV parser supporting quotes, commas, newlines
  const parseCSVText = (text: string) => {
    const result: string[][] = [];
    let row: string[] = [];
    let inQuotes = false;
    let currentVal = '';

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentVal += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(currentVal.trim());
        currentVal = '';
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        row.push(currentVal.trim());
        result.push(row);
        row = [];
        currentVal = '';
      } else {
        currentVal += char;
      }
    }

    if (currentVal || row.length > 0) {
      row.push(currentVal.trim());
      result.push(row);
    }

    const cleanRows = result.filter(r => r.some(cell => cell !== ''));
    if (cleanRows.length === 0) {
      return { headers: [], rows: [] };
    }

    const headers = cleanRows[0].map(h => h.trim());
    const dataRows = cleanRows.slice(1);

    return { headers, rows: dataRows };
  };

  // Load and analyze CSV content
  const handleLoadCsvContent = (content: string, name: string = 'Uploaded_File.csv', size: string = '') => {
    const { headers, rows } = parseCSVText(content);
    if (headers.length === 0 || rows.length === 0) {
      setParsingErrors(['No data or headers found in the provided CSV file.']);
      return;
    }

    setRawHeaders(headers);
    setRawRows(rows);
    setFileName(name);
    setFileSize(size);

    // Auto map all columns
    const initialMappings: Record<number, keyof Employee | 'skip'> = {};
    headers.forEach((header, index) => {
      // Check if this column has ANY non-empty data in rows
      const hasAnyData = rows.some(r => r[index] && r[index].trim() !== '');
      if (!hasAnyData) {
        initialMappings[index] = 'skip';
      } else {
        initialMappings[index] = autoDetectField(header);
      }
    });

    setColumnMappings(initialMappings);
    setCurrentStep(2); // Move to Step 2: Review Headings & Mapping
  };

  const handleFileSelected = (file: File) => {
    const reader = new FileReader();
    const sizeStr = (file.size / 1024).toFixed(1) + ' KB';
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        handleLoadCsvContent(text, file.name, sizeStr);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  // Column Analysis & Stats (e.g. non-empty percentage and samples)
  const columnAnalysis = useMemo(() => {
    return rawHeaders.map((header, colIndex) => {
      let filledCount = 0;
      const samples: string[] = [];

      for (let r = 0; r < rawRows.length; r++) {
        const val = rawRows[r]?.[colIndex]?.trim() || '';
        if (val !== '') {
          filledCount++;
          if (samples.length < 3 && !samples.includes(val)) {
            samples.push(val);
          }
        }
      }

      const fillPercentage = rawRows.length > 0 ? Math.round((filledCount / rawRows.length) * 100) : 0;
      const isBlank = filledCount === 0;

      return {
        colIndex,
        header,
        filledCount,
        totalCount: rawRows.length,
        fillPercentage,
        isBlank,
        samples,
        currentMappedField: columnMappings[colIndex] || 'skip'
      };
    });
  }, [rawHeaders, rawRows, columnMappings]);

  // Bulk Actions for Mapping
  const handleAutoMapAll = () => {
    const updated: Record<number, keyof Employee | 'skip'> = {};
    rawHeaders.forEach((header, index) => {
      updated[index] = autoDetectField(header);
    });
    setColumnMappings(updated);
  };

  const handleSkipBlankColumns = () => {
    const updated = { ...columnMappings };
    columnAnalysis.forEach(col => {
      if (col.isBlank) {
        updated[col.colIndex] = 'skip';
      }
    });
    setColumnMappings(updated);
  };

  const handleResetAllToSkip = () => {
    const updated: Record<number, keyof Employee | 'skip'> = {};
    rawHeaders.forEach((_, index) => {
      updated[index] = 'skip';
    });
    setColumnMappings(updated);
  };

  const handleToggleColumnSkip = (colIndex: number) => {
    const current = columnMappings[colIndex];
    if (current === 'skip') {
      const detected = autoDetectField(rawHeaders[colIndex]);
      setColumnMappings(prev => ({ ...prev, [colIndex]: detected }));
    } else {
      setColumnMappings(prev => ({ ...prev, [colIndex]: 'skip' }));
    }
  };

  const handleSelectFieldForColumn = (colIndex: number, fieldKey: keyof Employee | 'skip') => {
    setColumnMappings(prev => ({ ...prev, [colIndex]: fieldKey }));
  };

  // Compile final employee objects based on active column mappings
  const compileEmployeesFromMapping = () => {
    const emps: Employee[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if ID and Name are mapped
    const hasIdMapped = Object.values(columnMappings).includes('id');
    const hasNameMapped = Object.values(columnMappings).includes('name');

    if (!hasIdMapped || !hasNameMapped) {
      errors.push('Both "Employee ID *" and "Full Name *" must be mapped to proceed.');
      setParsingErrors(errors);
      return false;
    }

    rawRows.forEach((row, rowIndex) => {
      const rowNum = rowIndex + 2; // +1 for 1-based index, +1 for header
      const empData: any = {
        isActive: true,
        basicSalary: 25000,
        allowances: 0,
        deductions: 0,
        hourlyRate: 150,
        paymentMethod: 'Bank Transfer',
        department: 'General',
        designation: 'Staff',
        joiningDate: new Date().toISOString().split('T')[0],
        gender: 'Male',
        employmentType: 'Fresher'
      };

      let rawId = '';
      let rawName = '';

      // Extract values according to mappings
      Object.entries(columnMappings).forEach(([colIdxStr, fieldKey]) => {
        if (!fieldKey || fieldKey === 'skip') return;
        const key = fieldKey as keyof Employee;
        const colIdx = parseInt(colIdxStr, 10);
        const rawVal = row[colIdx]?.trim() || '';

        if (!rawVal) return; // Skip empty cells

        const fieldDef = EMPLOYEE_FIELDS.find(f => f.key === key);
        if (!fieldDef) return;

        if (fieldDef.type === 'number') {
          const cleaned = rawVal.replace(/[^0-9.]/g, '');
          (empData as Record<string, any>)[key] = parseFloat(cleaned) || 0;
        } else if (fieldDef.type === 'boolean') {
          const lower = rawVal.toLowerCase();
          (empData as Record<string, any>)[key] = !(lower === 'false' || lower === '0' || lower === 'no' || lower === 'inactive');
        } else if (fieldDef.type === 'date') {
          (empData as Record<string, any>)[key] = parseFlexibleDate(rawVal);
        } else {
          // String
          if (key === 'mobileNo' && rawVal.includes('/')) {
            // Handle dual phone numbers e.g. 9109090326/9131217791
            const parts = rawVal.split('/').map(p => p.trim()).filter(Boolean);
            empData.mobileNo = parts[0] || '';
            if (parts[1] && !empData.personalMobileNo) {
              empData.personalMobileNo = parts[1];
            }
          } else if (key === 'gender') {
            const low = rawVal.toLowerCase();
            empData.gender = low.includes('fem') ? 'Female' : low.includes('oth') ? 'Other' : 'Male';
          } else if (key === 'paymentMethod') {
            const low = rawVal.toLowerCase();
            empData.paymentMethod = low.includes('cash') ? 'Cash' : low.includes('cheque') || low.includes('check') ? 'Cheque' : 'Bank Transfer';
          } else {
            (empData as Record<string, any>)[key] = rawVal;
          }
        }

        if (key === 'id') rawId = rawVal;
        if (key === 'name') rawName = rawVal;
      });

      if (!rawId) {
        errors.push(`Row #${rowNum}: Missing Employee ID. Row was skipped.`);
        return;
      }

      if (!rawName) {
        errors.push(`Row #${rowNum} (ID: ${rawId}): Missing Full Name. Row was skipped.`);
        return;
      }

      // Auto compute first/last name if not provided
      if (!empData.firstName && empData.name) {
        const nameParts = empData.name.split(' ');
        empData.firstName = nameParts[0] || '';
        empData.lastName = nameParts.slice(1).join(' ') || '';
      }

      // Password fallback
      if (!empData.password) {
        empData.password = empData.id || '123456';
      }

      // Bank account holder name fallback
      if (!empData.bankAccountHolderName && empData.name) {
        empData.bankAccountHolderName = empData.name;
      }

      emps.push(empData as Employee);
    });

    setParsedEmployees(emps);
    setParsingErrors(errors);
    setParsingWarnings(warnings);
    return true;
  };

  const handleProceedToPreview = () => {
    const success = compileEmployeesFromMapping();
    if (success) {
      setCurrentStep(3);
    }
  };

  const handleConfirmAndSync = async () => {
    if (parsedEmployees.length === 0) return;
    setIsImporting(true);
    try {
      const handler = onConfirmImport || onImportSuccess;
      if (handler) {
        await handler(parsedEmployees);
      }
      onClose();
    } catch (err: any) {
      setParsingErrors([`Sync error: ${err?.message || 'Failed to sync employees'}`]);
    } finally {
      setIsImporting(false);
    }
  };

  // Download standard CSV template
  const downloadSampleTemplate = () => {
    const headers = EMPLOYEE_FIELDS.filter(f => f.key !== 'skip').map(f => f.label);
    const sampleRow = [
      'RS001', 'Aashish Sahu', 'MDO', 'MIS DME', '2015-05-01', '30613', '2000', '1000', '150', 'Bank Transfer', 'TRUE',
      'Aashish', 'Sahu', 'aashish@example.com', '8435224940', '', '', '1994-11-18', 'O+', '8435224940', '367356', 'Male', 'Fresher',
      '', '', '', 'India', 'Chhattisgarh', 'Raipur', '492001', '', '', 'India', 'Chhattisgarh', 'Raipur', '492001',
      '123456789012', 'Aashish Sahu', 'State Bank of India', 'SBIN0001234', 'ABCDE1234F', '', '', '123456789012', '', '',
      'Raipur', 'Raipur Store', 'Reporting Officer', '30 Days', 'Shift 1 (10:00 AM - 08:00 PM)', 'General', 'Sunday', 'Standard', 'REF001', '123456',
      '0', '0', '0', '0', '0', '12', '15', 'TRUE', 'TRUE', 'TRUE', 'TRUE', 'TRUE', 'TRUE', 'TRUE'
    ];

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), sampleRow.join(',')].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `HRMS_Employee_Import_Template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export current existing employees to CSV
  const exportExistingEmployees = () => {
    if (existingEmployees.length === 0) return;
    const exportFields = EMPLOYEE_FIELDS.filter(f => f.key !== 'skip');
    const headers = exportFields.map(f => f.label);
    
    const rows = existingEmployees.map(emp => {
      return exportFields.map(f => {
        const val = (emp as any)[f.key];
        if (val === undefined || val === null) return '';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      }).join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `HRMS_Existing_Employees_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Summary numbers
  const mappedCount = Object.values(columnMappings).filter(v => v !== 'skip').length;
  const skippedCount = Object.values(columnMappings).filter(v => v === 'skip').length;
  const blankCount = columnAnalysis.filter(c => c.isBlank).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/65 z-50 flex items-center justify-center p-3 sm:p-5 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-5xl w-full flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight">Bulk Import & Column Heading Mapper</h3>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-[10px] font-extrabold uppercase">
                  Smart Auto-Detect
                </span>
              </div>
              <p className="text-xs text-gray-300">
                Seamlessly upload, select headings, ignore blank columns, and normalize date formats.
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator Wizard */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-gray-200 flex items-center justify-between text-xs font-semibold text-gray-600 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentStep(1)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                currentStep === 1 
                  ? 'bg-blue-600 text-white shadow-xs font-bold' 
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 cursor-pointer'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">1</span>
              <span>Upload CSV</span>
            </button>

            <ChevronRight className="w-4 h-4 text-gray-400" />

            <button
              onClick={() => { if (rawHeaders.length > 0) setCurrentStep(2); }}
              disabled={rawHeaders.length === 0}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                currentStep === 2 
                  ? 'bg-blue-600 text-white shadow-xs font-bold' 
                  : rawHeaders.length > 0 
                    ? 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 cursor-pointer' 
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">2</span>
              <span>Heading Selection & Mapping</span>
              {rawHeaders.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded-full text-[10px] font-bold">
                  {rawHeaders.length} Cols
                </span>
              )}
            </button>

            <ChevronRight className="w-4 h-4 text-gray-400" />

            <button
              onClick={() => { if (rawHeaders.length > 0) handleProceedToPreview(); }}
              disabled={rawHeaders.length === 0}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                currentStep === 3 
                  ? 'bg-emerald-600 text-white shadow-xs font-bold' 
                  : rawHeaders.length > 0 
                    ? 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 cursor-pointer' 
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">3</span>
              <span>Review & Sync Data</span>
              {parsedEmployees.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                  {parsedEmployees.length} Rows
                </span>
              )}
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <button
              type="button"
              onClick={exportExistingEmployees}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg shadow-xxs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export Existing ({existingEmployees.length})</span>
            </button>
            <button
              type="button"
              onClick={downloadSampleTemplate}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Sample Template</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* ================= STEP 1: UPLOAD CSV ================= */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              
              {/* Instructions banner */}
              <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Smart CSV Import with Flexible Columns & Date Parsing</span>
                </div>
                <p className="text-xs text-blue-800 leading-relaxed">
                  Upload your employee list in CSV format. Any custom column names, date styles (e.g. <code className="bg-blue-100 px-1 py-0.5 rounded font-mono text-[11px]">1/5/2015</code>, <code className="bg-blue-100 px-1 py-0.5 rounded font-mono text-[11px]">18-Nov-94</code>, <code className="bg-blue-100 px-1 py-0.5 rounded font-mono text-[11px]">25/11/2024</code>), and phone numbers will be automatically analyzed. On the next screen, you can choose exactly which headings to include and skip blank columns.
                </p>
                <div className="pt-1 flex flex-wrap items-center gap-2 text-[11px] text-gray-600 font-medium">
                  <span className="flex items-center gap-1 text-emerald-700 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Auto-ignores empty columns
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-emerald-700 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Multi-phone separator support (e.g. 9109090326/9131217791)
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-emerald-700 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Converts Day-Month-Year dates into standard ISO
                  </span>
                </div>
              </div>

              {/* Drag & Drop Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                  isDragging 
                    ? 'border-blue-500 bg-blue-50/50 scale-[0.99]' 
                    : 'border-gray-300 hover:border-blue-500 hover:bg-slate-50/80 bg-white'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelected(e.target.files[0]);
                    }
                  }}
                  accept=".csv,text/csv"
                  className="hidden"
                />
                
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-xs">
                  <Upload className="w-7 h-7" />
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-bold text-gray-900">
                    Click to browse or drag and drop your CSV file here
                  </p>
                  <p className="text-xs text-gray-500">
                    Supports .CSV with any headers (e.g. RS001, Aashish Sahu, Raipur Store...)
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <span className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors">
                    Browse CSV Files
                  </span>
                  <span className="text-xs text-gray-400">or</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowPasteArea(!showPasteArea);
                    }}
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    {showPasteArea ? 'Hide Direct Paste' : 'Paste CSV Raw Text'}
                  </button>
                </div>
              </div>

              {/* Direct Paste Area (Alternative) */}
              {showPasteArea && (
                <div className="p-4 bg-slate-50 border border-gray-200 rounded-xl space-y-2 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span>Paste CSV Text Directly (with Headers)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setPastedCsvText('')}
                      className="text-[11px] text-gray-400 hover:text-gray-600"
                    >
                      Clear
                    </button>
                  </div>
                  <textarea
                    rows={6}
                    value={pastedCsvText}
                    onChange={(e) => setPastedCsvText(e.target.value)}
                    placeholder="Employee ID *,Full Name *,Department,Designation,Joining Date (YYYY-MM-DD),Basic Salary...&#10;RS001,Aashish Sahu,MDO,MIS DME,1/5/2015,30613..."
                    className="w-full p-3 font-mono text-xs border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={!pastedCsvText.trim()}
                      onClick={() => handleLoadCsvContent(pastedCsvText, 'Pasted_Data.csv')}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      Analyze & Map Columns ➔
                    </button>
                  </div>
                </div>
              )}

              {/* Error messages if any */}
              {parsingErrors.length > 0 && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>Upload Issues Detected</span>
                  </div>
                  {parsingErrors.map((err, i) => (
                    <p key={i} className="text-xs font-mono pl-6">• {err}</p>
                  ))}
                </div>
              )}

            </div>
          )}

          {/* ================= STEP 2: HEADING SELECTION & COLUMN MAPPING ================= */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              {/* File stats and quick actions bar */}
              <div className="p-3.5 bg-slate-900 text-white rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-400">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{fileName || 'Uploaded CSV'}</span>
                      {fileSize && <span className="text-[11px] text-gray-400 font-mono">({fileSize})</span>}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-300 font-medium">
                      <span>Total Rows: <strong className="text-emerald-400">{rawRows.length}</strong></span>
                      <span>•</span>
                      <span>Total Columns: <strong className="text-blue-400">{rawHeaders.length}</strong></span>
                      <span>•</span>
                      <span>Mapped: <strong className="text-emerald-400">{mappedCount}</strong></span>
                      <span>•</span>
                      <span>Skipped: <strong className="text-amber-400">{skippedCount}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAutoMapAll}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xxs transition-colors cursor-pointer"
                    title="Auto-detect mapping for all headers"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Auto-Map All</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSkipBlankColumns}
                    className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-xxs transition-colors cursor-pointer"
                    title="Set all columns that have 0 data in your CSV to Skip"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Skip {blankCount} Blank Columns</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetAllToSkip}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-gray-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                </div>
              </div>

              {/* Search and category filters */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search CSV headings..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1">
                  <span className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5" /> View:
                  </span>
                  {['All', 'Mapped Only', 'Skipped Only', 'Blank (0%)'].map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFilterCategory(cat)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors shrink-0 ${
                        filterCategory === cat
                          ? 'bg-slate-800 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Column Mapping Table */}
              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="max-h-[50vh] overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-gray-100 border-b border-gray-200 text-gray-700 font-bold z-10">
                      <tr>
                        <th className="py-2.5 px-3 w-12 text-center">Inc.</th>
                        <th className="py-2.5 px-3 w-1/3">CSV File Heading</th>
                        <th className="py-2.5 px-3 w-1/4">Sample Data in Your File</th>
                        <th className="py-2.5 px-3 text-center w-8">➔</th>
                        <th className="py-2.5 px-3">Mapped Employee Field</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {columnAnalysis
                        .filter(col => {
                          if (searchTerm) {
                            const term = searchTerm.toLowerCase();
                            const matchHeader = col.header.toLowerCase().includes(term);
                            const matchMapped = String(col.currentMappedField).toLowerCase().includes(term);
                            if (!matchHeader && !matchMapped) return false;
                          }
                          if (filterCategory === 'Mapped Only') return col.currentMappedField !== 'skip';
                          if (filterCategory === 'Skipped Only') return col.currentMappedField === 'skip';
                          if (filterCategory === 'Blank (0%)') return col.isBlank;
                          return true;
                        })
                        .map((col) => {
                          const isMapped = col.currentMappedField !== 'skip';
                          const mappedFieldDef = EMPLOYEE_FIELDS.find(f => f.key === col.currentMappedField);
                          const isRequired = mappedFieldDef?.required;

                          return (
                            <tr 
                              key={col.colIndex} 
                              className={`transition-colors ${
                                isMapped 
                                  ? 'bg-white hover:bg-blue-50/30' 
                                  : 'bg-gray-50/50 hover:bg-gray-100/50 opacity-80'
                              }`}
                            >
                              {/* Toggle checkbox */}
                              <td className="py-2.5 px-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={isMapped}
                                  onChange={() => handleToggleColumnSkip(col.colIndex)}
                                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                                />
                              </td>

                              {/* CSV Column Header */}
                              <td className="py-2.5 px-3">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-gray-900">{col.header || `(Column #${col.colIndex + 1})`}</span>
                                    {col.isBlank ? (
                                      <span className="px-1.5 py-0.2 bg-gray-100 text-gray-500 border border-gray-200 rounded text-[10px] font-semibold">
                                        Blank / Empty
                                      </span>
                                    ) : (
                                      <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold">
                                        {col.fillPercentage}% filled ({col.filledCount}/{col.totalCount})
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-gray-400 font-mono">Column #{col.colIndex + 1}</span>
                                </div>
                              </td>

                              {/* Sample Data Preview */}
                              <td className="py-2.5 px-3">
                                {col.samples.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {col.samples.map((s, si) => (
                                      <span 
                                        key={si}
                                        className="inline-block max-w-[160px] truncate px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-[11px] font-mono"
                                        title={s}
                                      >
                                        {s}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-[11px] text-gray-400 italic">No sample values</span>
                                )}
                              </td>

                              {/* Arrow */}
                              <td className="py-2.5 px-3 text-center text-gray-400">
                                <ArrowRight className={`w-4 h-4 mx-auto ${isMapped ? 'text-blue-600' : 'text-gray-300'}`} />
                              </td>

                              {/* Dropdown to select Employee Field */}
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-2">
                                  <select
                                    value={col.currentMappedField}
                                    onChange={(e) => handleSelectFieldForColumn(col.colIndex, e.target.value as any)}
                                    className={`w-full py-1.5 px-2.5 text-xs rounded-lg border font-medium focus:outline-none focus:ring-2 ${
                                      isMapped 
                                        ? isRequired
                                          ? 'border-emerald-300 bg-emerald-50/30 text-emerald-950 font-bold focus:ring-emerald-500'
                                          : 'border-blue-300 bg-white text-gray-900 focus:ring-blue-500'
                                        : 'border-gray-200 bg-gray-100 text-gray-500 focus:ring-gray-400'
                                    }`}
                                  >
                                    <option value="skip">-- 🚫 Skip this column (Do Not Import) --</option>
                                    
                                    {/* Grouped Options */}
                                    {['Required', 'Employment', 'Salary', 'Personal', 'Contact', 'Banking & Statutory', 'Address', 'Payroll Rules', 'Security'].map(group => (
                                      <optgroup key={group} label={`── ${group} ──`}>
                                        {EMPLOYEE_FIELDS
                                          .filter(f => f.category === group && f.key !== 'skip')
                                          .map(f => (
                                            <option key={f.key} value={f.key}>
                                              {f.label} {f.required ? '★ (Required)' : ''}
                                            </option>
                                          ))}
                                      </optgroup>
                                    ))}
                                  </select>

                                  {isRequired && (
                                    <span className="shrink-0 text-emerald-600" title="Required Mandatory Field">
                                      <ShieldCheck className="w-4 h-4" />
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Step 2 Bottom Info & Requirement Check */}
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 font-bold text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Mandatory Field Check:</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-amber-800">
                    <span className="flex items-center gap-1 font-semibold">
                      Employee ID: {Object.values(columnMappings).includes('id') ? <span className="text-emerald-700 font-bold">✓ Mapped</span> : <span className="text-rose-700 font-bold">✗ Not Mapped</span>}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-semibold">
                      Full Name: {Object.values(columnMappings).includes('name') ? <span className="text-emerald-700 font-bold">✓ Mapped</span> : <span className="text-rose-700 font-bold">✗ Not Mapped</span>}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleProceedToPreview}
                  disabled={!Object.values(columnMappings).includes('id') || !Object.values(columnMappings).includes('name')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <span>Preview Parsed Data ➔</span>
                </button>
              </div>

            </div>
          )}

          {/* ================= STEP 3: REVIEW & SYNC ================= */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              {/* Summary Banner */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Ready to import {parsedEmployees.length} employees</span>
                  </div>
                  <p className="text-xs text-emerald-800">
                    Dates have been converted to standard format, multi-phone numbers separated, and default values applied.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-3 py-1.5 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    ← Adjust Headings
                  </button>
                </div>
              </div>

              {/* Errors/Warnings Banner if any */}
              {parsingErrors.length > 0 && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>{parsingErrors.length} rows had errors and were skipped:</span>
                  </div>
                  <div className="max-h-24 overflow-y-auto space-y-0.5 pl-6 text-[11px] font-mono">
                    {parsingErrors.map((err, i) => (
                      <p key={i}>• {err}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Parsed Data Preview Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Parsed Employee Table Preview ({parsedEmployees.length} Records)
                  </h4>
                  <div className="text-xs text-gray-500 font-medium">
                    Showing all fields formatted for HRMS database
                  </div>
                </div>

                <div className="border border-gray-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-slate-800 text-white font-bold z-10">
                      <tr>
                        <th className="py-2 px-3">ID</th>
                        <th className="py-2 px-3">Full Name</th>
                        <th className="py-2 px-3">Department</th>
                        <th className="py-2 px-3">Designation</th>
                        <th className="py-2 px-3">Joining Date</th>
                        <th className="py-2 px-3">DOB</th>
                        <th className="py-2 px-3 text-right">Basic Salary</th>
                        <th className="py-2 px-3">Payment</th>
                        <th className="py-2 px-3">Mobile No</th>
                        <th className="py-2 px-3">Branch / Cost Center</th>
                        <th className="py-2 px-3">Work Shift</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white font-medium">
                      {parsedEmployees.map((emp, idx) => (
                        <tr key={emp.id || idx} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-mono font-bold text-blue-700">{emp.id}</td>
                          <td className="py-2 px-3 font-bold text-gray-900">{emp.name}</td>
                          <td className="py-2 px-3 text-gray-600">{emp.department || '-'}</td>
                          <td className="py-2 px-3 text-gray-600">{emp.designation || '-'}</td>
                          <td className="py-2 px-3 font-mono text-gray-600 text-[11px]">{emp.joiningDate || '-'}</td>
                          <td className="py-2 px-3 font-mono text-gray-600 text-[11px]">{emp.dob || '-'}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-gray-900">
                            ₹{emp.basicSalary.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2 px-3 text-gray-600">{emp.paymentMethod}</td>
                          <td className="py-2 px-3 font-mono text-gray-600 text-[11px]">
                            {emp.mobileNo || '-'}
                            {emp.personalMobileNo && <span className="block text-[10px] text-gray-400">Alt: {emp.personalMobileNo}</span>}
                          </td>
                          <td className="py-2 px-3 text-gray-600 text-[11px]">
                            {emp.branch || '-'} {emp.costCenter ? `(${emp.costCenter})` : ''}
                          </td>
                          <td className="py-2 px-3 text-gray-600 text-[11px] max-w-[140px] truncate" title={emp.workTiming}>
                            {emp.workTiming || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Bottom Footer Actions */}
        <div className="px-6 py-3.5 border-t border-gray-200 bg-gray-50 flex items-center justify-between gap-3 shrink-0">
          <div>
            {currentStep === 2 && (
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-3 py-1.5 text-xs font-bold text-gray-600 hover:text-gray-800 bg-white border border-gray-200 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                ← Back to Upload
              </button>
            )}
            {currentStep === 3 && (
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-3 py-1.5 text-xs font-bold text-gray-600 hover:text-gray-800 bg-white border border-gray-200 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                ← Modify Mappings
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-800 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>

            {currentStep === 1 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Select CSV File</span>
              </button>
            )}

            {currentStep === 2 && (
              <button
                type="button"
                onClick={handleProceedToPreview}
                disabled={!Object.values(columnMappings).includes('id') || !Object.values(columnMappings).includes('name')}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span>Continue to Preview ({mappedCount} Mapped) ➔</span>
              </button>
            )}

            {currentStep === 3 && (
              <button
                type="button"
                disabled={isImporting || parsedEmployees.length === 0}
                onClick={handleConfirmAndSync}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isImporting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Syncing & Saving to Database...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Confirm & Sync {parsedEmployees.length} Employees</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
