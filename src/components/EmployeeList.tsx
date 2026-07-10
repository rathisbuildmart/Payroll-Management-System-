import React, { useState, useRef } from 'react';
import { Plus, Search, Edit2, Check, X, Filter, UserX, UserCheck, CreditCard, Calendar, Building, DollarSign, Upload, Download, AlertCircle, Camera, Clock } from 'lucide-react';
import { Employee, AdminSettings } from '../types';

interface EmployeeListProps {
  employees: Employee[];
  onAddEmployee: (emp: Employee) => Promise<void>;
  onUpdateEmployee: (emp: Employee) => Promise<void>;
  onBulkAddEmployees: (newEmployees: Employee[]) => Promise<void>;
  language: 'en' | 'hi';
  adminSettings: AdminSettings;
}

const DEPARTMENTS = ['Management', 'Engineering', 'Human Resources', 'Sales', 'Marketing', 'Finance', 'Operations', 'IT Support', 'Other'];
const PAYMENT_METHODS: Employee['paymentMethod'][] = ['Bank Transfer', 'Cash', 'Cheque'];

export default function EmployeeList({ employees, onAddEmployee, onUpdateEmployee, onBulkAddEmployees, language, adminSettings }: EmployeeListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // CSV Bulk Import States
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importedEmployees, setImportedEmployees] = useState<Employee[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [isImportSaving, setIsImportSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sub Tab Selector State
  const [activeSubTab, setActiveSubTab] = useState<'directory' | 'increments'>('directory');

  // Salary Increment Tracker States
  const [selectedEmployeeForIncrement, setSelectedEmployeeForIncrement] = useState<Employee | null>(null);
  const [selectedEmployeeForHistory, setSelectedEmployeeForHistory] = useState<Employee | null>(null);
  const [incDate, setIncDate] = useState(new Date().toISOString().split('T')[0]);
  const [incAmount, setIncAmount] = useState<number>(0);
  const [incNewSalary, setIncNewSalary] = useState<number>(0);
  const [incNextDate, setIncNextDate] = useState<string>('');
  const [incRemarks, setIncRemarks] = useState<string>('');
  const [isSavingIncrement, setIsSavingIncrement] = useState(false);

  // Form states with all custom sub-fields
  const [formData, setFormData] = useState<Partial<Employee>>({
    id: '',
    name: '',
    department: 'Engineering',
    designation: '',
    joiningDate: new Date().toISOString().split('T')[0],
    basicSalary: 25000,
    allowances: 2000,
    deductions: 1000,
    hourlyRate: 150,
    paymentMethod: 'Bank Transfer',
    isActive: true,

    firstName: '',
    lastName: '',
    email: '',
    mobileNo: '',
    personalMobileNo: '',
    personalEmail: '',
    dob: '',
    bloodGroup: '',
    emergencyContactNo: '',
    ctcOffered: 0,
    gender: 'Male',
    employmentType: 'Fresher',
    linkUser: '',
    probationDate: '',

    resLine1: '',
    resLine2: '',
    resCountry: 'India',
    resState: 'Karnataka',
    resCity: '',
    resPinCode: '',

    permLine1: '',
    permLine2: '',
    permCountry: 'India',
    permState: 'Karnataka',
    permCity: '',
    permPinCode: '',

    bankAccountNo: '',
    bankAccountHolderName: '',
    bankName: '',
    ifscCode: '',

    panNo: '',
    pfAccountNo: '',
    esicNo: '',
    aadhaarNo: '',
    uan: '',

    confirmationDate: '',
    branch: '',
    costCenter: '',
    reportingTo: '',
    noticePeriod: '',
    workTiming: '',
    employeeGroup: '',
    weeklyOffProfile: '',
    leaveType: '',
    referenceNumber: '',
    photoUrl: '',
    password: '',
  });

  const t = {
    en: {
      title: "Employee Directory",
      addBtn: "Add New Employee",
      searchPlaceholder: "Search by Name or ID...",
      filterDept: "All Departments",
      colId: "ID",
      colName: "Name",
      colRole: "Role / Department",
      colJoining: "Joining Date",
      colSalary: "Monthly Salary",
      colPayment: "Payment Method",
      colStatus: "Status",
      colActions: "Actions",
      active: "Active",
      inactive: "Inactive",
      editTitle: "Edit Employee Details",
      newTitle: "Register New Employee",
      cancel: "Cancel",
      save: "Save & Sync",
      saving: "Syncing with Sheets...",
      deactivate: "Deactivate",
      activate: "Activate",
      fieldId: "Employee ID (Unique)",
      fieldName: "Full Name",
      fieldDept: "Department",
      fieldRole: "Designation",
      fieldJoining: "Joining Date",
      fieldSalary: "Basic Salary (₹)",
      fieldAllowances: "Allowances (₹)",
      fieldDeductions: "Deductions (₹)",
      fieldHourly: "Overtime Hourly Rate (₹)",
      fieldPayment: "Payment Method",
      fieldActive: "Employee is Active",
      successMsg: "Synchronized successfully!",
      noEmployees: "No employees found. Create one to get started!",
      confirmDeactivate: "Are you sure you want to deactivate this employee?",
      confirmActivate: "Are you sure you want to reactivate this employee?",
      
      // Bulk CSV Import Keys
      bulkImportBtn: "Bulk Import (CSV)",
      bulkImportTitle: "Bulk Import Employee Details",
      downloadTemplate: "Download CSV Template",
      dragDropText: "Drag and drop your CSV file here, or click to browse",
      selectFile: "Select CSV File",
      invalidCsv: "Invalid CSV format or missing headers.",
      noRowsFound: "No valid data rows found in CSV.",
      previewTitle: "Preview Data to Import",
      importSuccess: "Ready to import {count} employees!",
      importErrors: "Some rows had errors and will be skipped:",
      btnConfirmImport: "Confirm & Sync {count} Employees",
      colStatusValid: "Valid",
      colStatusError: "Error",
      requiredHeaderWarning: "Required columns: Employee ID, Full Name. Other columns are optional."
    },
    hi: {
      title: "कर्मचारी निर्देशिका",
      addBtn: "नया कर्मचारी जोड़ें",
      searchPlaceholder: "नाम या आईडी से खोजें...",
      filterDept: "सभी विभाग",
      colId: "आईडी",
      colName: "नाम",
      colRole: "पद / विभाग",
      colJoining: "शामिल होने की तिथि",
      colSalary: "मासिक वेतन",
      colPayment: "भुगतान का प्रकार",
      colStatus: "स्थिति",
      colActions: "कार्रवाई",
      active: "सक्रिय",
      inactive: "निष्क्रिय",
      editTitle: "कर्मचारी विवरण संपादित करें",
      newTitle: "नए कर्मचारी का पंजीकरण",
      cancel: "रद्द करें",
      save: "सुरक्षित और सिंक करें",
      saving: "शीट्स के साथ सिंक हो रहा है...",
      deactivate: "निष्क्रिय करें",
      activate: "सक्रिय करें",
      fieldId: "कर्मचारी आईडी (यूनिक)",
      fieldName: "पूरा नाम",
      fieldDept: "विभाग",
      fieldRole: "पद / डिज़ाइनेशन",
      fieldJoining: "शामिल होने की तिथि",
      fieldSalary: "मूल वेतन (₹)",
      fieldAllowances: "भत्ते / Allowances (₹)",
      fieldDeductions: "कटौती / Deductions (₹)",
      fieldHourly: "ओवरटाइम प्रति घंटा दर (₹)",
      fieldPayment: "भुगतान का प्रकार",
      fieldActive: "कर्मचारी सक्रिय है",
      successMsg: "सफलतापूर्वक सिंक किया गया!",
      noEmployees: "कोई कर्मचारी नहीं मिला। शुरू करने के लिए एक बनाएं!",
      confirmDeactivate: "क्या आप वाकई इस कर्मचारी को निष्क्रिय करना चाहते हैं?",
      confirmActivate: "क्या आप वाकई इस कर्मचारी को फिर से सक्रिय करना चाहते हैं?",

      // Bulk CSV Import Keys
      bulkImportBtn: "थोक आयात (CSV)",
      bulkImportTitle: "CSV फ़ाइल से थोक कर्मचारी डेटा आयात करें",
      downloadTemplate: "CSV टेम्पलेट डाउनलोड करें",
      dragDropText: "अपनी CSV फ़ाइल यहाँ ड्रैग और ड्रॉप करें, या ब्राउज़ करने के लिए क्लिक करें",
      selectFile: "CSV फ़ाइल चुनें",
      invalidCsv: "अमान्य CSV प्रारूप या हेडर गायब हैं।",
      noRowsFound: "CSV में कोई डेटा नहीं मिला।",
      previewTitle: "आयात करने से पहले डेटा का पूर्वावलोकन",
      importSuccess: "सफलतापूर्वक {count} कर्मचारियों का डेटा आयात करने के लिए तैयार है!",
      importErrors: "कुछ पंक्तियों में त्रुटियां थीं और उन्हें छोड़ दिया जाएगा:",
      btnConfirmImport: "पुष्टि करें और {count} कर्मचारियों को सिंक करें",
      colStatusValid: "सही",
      colStatusError: "त्रुटि",
      requiredHeaderWarning: "आवश्यक कॉलम: कर्मचारी आईडी (Employee ID), पूरा नाम (Full Name)। अन्य कॉलम वैकल्पिक हैं।"
    }
  }[language];

  // Filter & Search logic
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          emp.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept === 'All' || emp.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  // CSV Utility functions
  const parseCSV = (text: string) => {
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

    return {
      headers: cleanRows[0].map(h => h.trim().toLowerCase()),
      rows: cleanRows.slice(1)
    };
  };

  const processCSVFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      const { headers, rows } = parseCSV(text);
      
      const findIndex = (aliases: string[]): number => {
        return headers.findIndex(h => aliases.includes(h.toLowerCase().replace(/[\s_-]/g, '')));
      };

      const idIdx = findIndex(['id', 'employeeid', 'empid', 'आईडी']);
      const nameIdx = findIndex(['name', 'fullname', 'employeename', 'नाम', 'पूरानाम']);
      const deptIdx = findIndex(['department', 'dept', 'विभाग']);
      const desigIdx = findIndex(['designation', 'role', 'title', 'designationrole', 'पद', 'डिज़ाइनेशन']);
      const dateIdx = findIndex(['joiningdate', 'dateofjoining', 'doj', 'शामिलहोनेकीतिथि']);
      const salaryIdx = findIndex(['basicsalary', 'basic', 'salary', 'मूलवेतन']);
      const allowanceIdx = findIndex(['allowances', 'allowance', 'भत्ते']);
      const deductionIdx = findIndex(['deductions', 'deduction', 'कटौती']);
      const hourlyIdx = findIndex(['overtimehourlyrate', 'hourlyrate', 'overtimerate', 'ओवरटाइमप्रतिघंटादर']);
      const paymentIdx = findIndex(['paymentmethod', 'payment', 'भुगतानकाप्रकार']);
      const activeIdx = findIndex(['isactive', 'active', 'सक्रिय']);

      if (idIdx === -1 || nameIdx === -1) {
        setImportErrors([t.invalidCsv]);
        setImportedEmployees([]);
        return;
      }

      const tempEmployees: Employee[] = [];
      const tempErrors: string[] = [];

      rows.forEach((row, index) => {
        const rowNum = index + 2;
        const getVal = (idx: number, defVal = ''): string => {
          return idx !== -1 && idx < row.length ? row[idx] : defVal;
        };

        const id = getVal(idIdx).trim();
        const name = getVal(nameIdx).trim();
        const departmentRaw = getVal(deptIdx, 'Engineering').trim();
        const designation = getVal(desigIdx, 'Staff').trim();
        let joiningDate = getVal(dateIdx).trim();
        const basicSalary = parseFloat(getVal(salaryIdx, '0').replace(/[^0-9.]/g, '')) || 0;
        const allowances = parseFloat(getVal(allowanceIdx, '0').replace(/[^0-9.]/g, '')) || 0;
        const deductions = parseFloat(getVal(deductionIdx, '0').replace(/[^0-9.]/g, '')) || 0;
        const hourlyRate = parseFloat(getVal(hourlyIdx, '0').replace(/[^0-9.]/g, '')) || 0;
        const paymentMethodRaw = getVal(paymentIdx, 'Bank Transfer').trim();
        const isActiveRaw = getVal(activeIdx, 'true').trim().toLowerCase();

        if (!id) {
          tempErrors.push(`Row ${rowNum}: Missing Employee ID`);
          return;
        }

        if (!name) {
          tempErrors.push(`Row ${rowNum}: Missing Full Name for ID ${id}`);
          return;
        }

        // Validate department
        let department = 'Engineering';
        const matchedDept = DEPARTMENTS.find(d => d.toLowerCase() === departmentRaw.toLowerCase());
        if (matchedDept) {
          department = matchedDept;
        } else if (departmentRaw) {
          department = departmentRaw;
        }

        // Standardize date
        if (!joiningDate) {
          joiningDate = new Date().toISOString().split('T')[0];
        } else {
          try {
            const d = new Date(joiningDate);
            if (!isNaN(d.getTime())) {
              joiningDate = d.toISOString().split('T')[0];
            } else {
              const parts = joiningDate.split(/[-/.]/);
              if (parts.length === 3) {
                if (parts[0].length === 4) {
                  joiningDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
                } else if (parts[2].length === 4) {
                  joiningDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                }
              } else {
                joiningDate = new Date().toISOString().split('T')[0];
              }
            }
          } catch {
            joiningDate = new Date().toISOString().split('T')[0];
          }
        }

        // Validate paymentMethod
        let paymentMethod: Employee['paymentMethod'] = 'Bank Transfer';
        const payLower = paymentMethodRaw.toLowerCase();
        if (payLower.includes('cash')) {
          paymentMethod = 'Cash';
        } else if (payLower.includes('cheque') || payLower.includes('check')) {
          paymentMethod = 'Cheque';
        }

        // Validate isActive
        const isActive = !(isActiveRaw === 'false' || isActiveRaw === '0' || isActiveRaw === 'no' || isActiveRaw === 'inactive' || isActiveRaw === 'निष्क्रिय');

        tempEmployees.push({
          id,
          name,
          department,
          designation,
          joiningDate,
          basicSalary,
          allowances,
          deductions,
          hourlyRate,
          paymentMethod,
          isActive
        });
      });

      if (tempEmployees.length === 0 && tempErrors.length === 0) {
        setImportErrors([t.noRowsFound]);
      } else {
        setImportErrors(tempErrors);
      }
      setImportedEmployees(tempEmployees);
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processCSVFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processCSVFile(e.dataTransfer.files[0]);
    }
  };

  const downloadTemplate = () => {
    const headers = [
      'Employee ID',
      'Full Name',
      'Department',
      'Designation',
      'Joining Date (YYYY-MM-DD)',
      'Basic Salary',
      'Allowances',
      'Deductions',
      'Overtime Hourly Rate',
      'Payment Method',
      'Is Active'
    ];
    const sampleRows = [
      ['EMP004', 'Vikram Singh', 'Engineering', 'Software Architect', '2026-03-01', '65000', '5000', '2000', '250', 'Bank Transfer', 'true'],
      ['EMP005', 'Meera Nair', 'Human Resources', 'HR Manager', '2026-04-15', '45000', '3000', '1500', '180', 'Bank Transfer', 'true'],
      ['EMP006', 'Karan Johar', 'Sales', 'Sales Agent', '2026-05-10', '20000', '4000', '1000', '120', 'Cash', 'true']
    ];

    const csvContent = [
      headers.join(','),
      ...sampleRows.map(row => row.map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'employee_import_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmImport = async () => {
    if (importedEmployees.length === 0) return;
    setIsImportSaving(true);
    try {
      await onBulkAddEmployees(importedEmployees);
      alert(t.successMsg || 'Imported and synchronized successfully!');
      setIsImportModalOpen(false);
      setImportedEmployees([]);
      setImportErrors([]);
    } catch (err) {
      console.error(err);
      alert('Error updating Google Sheets. Please verify connection.');
    } finally {
      setIsImportSaving(false);
    }
  };

  const openAddModal = () => {
    // Auto generate next ID
    let nextIdNum = employees.length + 1;
    let nextId = `EMP${String(nextIdNum).padStart(3, '0')}`;
    while (employees.some(e => e.id === nextId)) {
      nextIdNum += 1;
      nextId = `EMP${String(nextIdNum).padStart(3, '0')}`;
    }

    setEditingEmployee(null);
    setFormData({
      id: nextId,
      name: '',
      department: adminSettings?.departments?.[0] || 'Engineering',
      designation: '',
      joiningDate: new Date().toISOString().split('T')[0],
      basicSalary: 25000,
      allowances: 2000,
      deductions: 1000,
      hourlyRate: 150,
      paymentMethod: 'Bank Transfer',
      isActive: true,

      hra: 0,
      da: 0,
      conveyanceAllowance: 0,
      advanceSalaryBalance: 0,
      advanceSalaryDeduction: 0,
      clBalance: 12,
      elBalance: 15,

      firstName: '',
      lastName: '',
      email: '',
      mobileNo: '',
      personalMobileNo: '',
      personalEmail: '',
      dob: '',
      bloodGroup: '',
      emergencyContactNo: '',
      ctcOffered: 0,
      gender: 'Male',
      employmentType: 'Fresher',
      linkUser: '',
      probationDate: '',

      resLine1: '',
      resLine2: '',
      resCountry: 'India',
      resState: 'Karnataka',
      resCity: '',
      resPinCode: '',

      permLine1: '',
      permLine2: '',
      permCountry: 'India',
      permState: 'Karnataka',
      permCity: '',
      permPinCode: '',

      bankAccountNo: '',
      bankAccountHolderName: '',
      bankName: '',
      ifscCode: '',

      panNo: '',
      pfAccountNo: '',
      esicNo: '',
      aadhaarNo: '',
      uan: '',

      confirmationDate: '',
      branch: adminSettings?.branches?.[0] || '',
      costCenter: adminSettings?.costCenters?.[0] || '',
      reportingTo: '',
      noticePeriod: '',
      workTiming: adminSettings?.workTimings?.[0] || '',
      employeeGroup: adminSettings?.employeeGroups?.[0] || '',
      weeklyOffProfile: adminSettings?.weeklyOffProfiles?.[0] || '',
      leaveType: adminSettings?.leaveTypes?.[0] || '',
      referenceNumber: '',
      photoUrl: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData({
      id: emp.id,
      name: emp.name,
      department: emp.department,
      designation: emp.designation,
      joiningDate: emp.joiningDate,
      basicSalary: emp.basicSalary,
      allowances: emp.allowances,
      deductions: emp.deductions,
      hourlyRate: emp.hourlyRate,
      paymentMethod: emp.paymentMethod,
      isActive: emp.isActive,

      hra: emp.hra || 0,
      da: emp.da || 0,
      conveyanceAllowance: emp.conveyanceAllowance || 0,
      advanceSalaryBalance: emp.advanceSalaryBalance || 0,
      advanceSalaryDeduction: emp.advanceSalaryDeduction || 0,
      clBalance: emp.clBalance || 0,
      elBalance: emp.elBalance || 0,

      firstName: emp.firstName || '',
      lastName: emp.lastName || '',
      email: emp.email || '',
      mobileNo: emp.mobileNo || '',
      personalMobileNo: emp.personalMobileNo || '',
      personalEmail: emp.personalEmail || '',
      dob: emp.dob || '',
      bloodGroup: emp.bloodGroup || '',
      emergencyContactNo: emp.emergencyContactNo || '',
      ctcOffered: emp.ctcOffered || 0,
      gender: emp.gender || 'Male',
      employmentType: emp.employmentType || 'Fresher',
      linkUser: emp.linkUser || '',
      probationDate: emp.probationDate || '',

      resLine1: emp.resLine1 || '',
      resLine2: emp.resLine2 || '',
      resCountry: emp.resCountry || 'India',
      resState: emp.resState || 'Karnataka',
      resCity: emp.resCity || '',
      resPinCode: emp.resPinCode || '',

      permLine1: emp.permLine1 || '',
      permLine2: emp.permLine2 || '',
      permCountry: emp.permCountry || 'India',
      permState: emp.permState || 'Karnataka',
      permCity: emp.permCity || '',
      permPinCode: emp.permPinCode || '',

      bankAccountNo: emp.bankAccountNo || '',
      bankAccountHolderName: emp.bankAccountHolderName || '',
      bankName: emp.bankName || '',
      ifscCode: emp.ifscCode || '',

      panNo: emp.panNo || '',
      pfAccountNo: emp.pfAccountNo || '',
      esicNo: emp.esicNo || '',
      aadhaarNo: emp.aadhaarNo || '',
      uan: emp.uan || '',

      confirmationDate: emp.confirmationDate || '',
      branch: emp.branch || '',
      costCenter: emp.costCenter || '',
      reportingTo: emp.reportingTo || '',
      noticePeriod: emp.noticePeriod || '',
      workTiming: emp.workTiming || '',
      employeeGroup: emp.employeeGroup || '',
      weeklyOffProfile: emp.weeklyOffProfile || '',
      leaveType: emp.leaveType || '',
      referenceNumber: emp.referenceNumber || '',
      photoUrl: emp.photoUrl || '',
      password: emp.password || '',
    });
    setIsModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ 
        ...prev, 
        [name]: type === 'number' ? Number(value) : value 
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSaving(true);
    try {
      if (editingEmployee) {
        await onUpdateEmployee({ ...formData });
      } else {
        await onAddEmployee({ ...formData });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Error updating Google Sheets. Please verify connection.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActiveStatus = async (emp: Employee) => {
    const confirmation = window.confirm(emp.isActive ? t.confirmDeactivate : t.confirmActivate);
    if (!confirmation) return;

    try {
      await onUpdateEmployee({
        ...emp,
        isActive: !emp.isActive
      });
    } catch (err) {
      console.error(err);
      alert('Failed to update status in Google Sheets.');
    }
  };

  const handleRecordIncrement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeForIncrement) return;
    setIsSavingIncrement(true);
    try {
      const newIncrement = {
        id: Date.now().toString(),
        date: incDate,
        amount: Number(incAmount),
        previousSalary: selectedEmployeeForIncrement.basicSalary,
        newSalary: Number(incNewSalary),
        remarks: incRemarks
      };

      const updatedEmployee: Employee = {
        ...selectedEmployeeForIncrement,
        basicSalary: Number(incNewSalary),
        increments: [...(selectedEmployeeForIncrement.increments || []), newIncrement],
        nextIncrementDate: incNextDate || undefined
      };

      await onUpdateEmployee(updatedEmployee);
      alert('Salary increment successfully recorded and synced to Google Sheets!');
      setSelectedEmployeeForIncrement(null);
      // Reset values
      setIncAmount(0);
      setIncNewSalary(0);
      setIncNextDate('');
      setIncRemarks('');
    } catch (err) {
      console.error(err);
      alert('Failed to record salary increment. Please verify network connection.');
    } finally {
      setIsSavingIncrement(false);
    }
  };

  const getFieldMeta = (fieldId: keyof Employee) => {
    if (['id', 'name', 'department', 'designation', 'joiningDate', 'basicSalary', 'allowances', 'deductions', 'hourlyRate', 'paymentMethod'].includes(fieldId)) {
      return { isHidden: false, isMandatory: true };
    }
    const config = adminSettings?.fields?.find(f => f.id === fieldId);
    return {
      isHidden: config ? config.isHidden : false,
      isMandatory: config ? config.isMandatory : false,
    };
  };

  const renderFormInput = (fieldId: keyof Employee, label: string, type: string = 'text', options?: string[]) => {
    const meta = getFieldMeta(fieldId);
    if (meta.isHidden) return null;

    return (
      <div className="space-y-1">
        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">
          {label} {meta.isMandatory && <span className="text-red-500">*</span>}
        </label>
        {options ? (
          <select
            name={fieldId}
            value={formData[fieldId] as string || ''}
            onChange={handleInputChange}
            required={meta.isMandatory}
            className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1.5 focus:ring-[#03623c] font-medium"
          >
            <option value="">-- Select --</option>
            {options.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            name={fieldId}
            value={type === 'number' ? (formData[fieldId] === undefined ? '' : formData[fieldId]) : (formData[fieldId] as string || '')}
            onChange={handleInputChange}
            required={meta.isMandatory}
            disabled={fieldId === 'id' && !!editingEmployee}
            placeholder={`Enter ${label}`}
            className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1.5 focus:ring-[#03623c] font-medium disabled:bg-gray-50 disabled:text-gray-400"
          />
        )}
      </div>
    );
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 2026 Admin Navigation Tabs for Employee Section */}
      <div className="flex border-b border-gray-200 bg-white p-1 rounded-xl border shadow-xs">
        <button
          onClick={() => setActiveSubTab('directory')}
          className={`flex-1 md:flex-initial text-center py-2 px-6 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            activeSubTab === 'directory'
              ? 'bg-[#03623c] text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-950 hover:bg-gray-50'
          }`}
        >
          {language === 'en' ? 'Employee Directory' : 'कर्मचारी सूची'}
        </button>
        <button
          onClick={() => setActiveSubTab('increments')}
          className={`flex-1 md:flex-initial text-center py-2 px-6 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            activeSubTab === 'increments'
              ? 'bg-[#03623c] text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-950 hover:bg-gray-50'
          }`}
        >
          {language === 'en' ? 'Salary Increments Report' : 'वेतन वृद्धि इतिहास'}
        </button>
      </div>

      {activeSubTab === 'directory' ? (
        <>
          {/* Search and Filters panel */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-1 flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <Search className="w-5 h-5" />
            </span>
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#03623c] text-sm"
              id="emp-search"
            />
          </div>

          {/* Department Filter */}
          <div className="relative min-w-[200px]">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <Filter className="w-4 h-4" />
            </span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#03623c] text-sm appearance-none bg-white"
              id="dept-filter"
            >
              <option value="All">{t.filterDept}</option>
              {(adminSettings?.departments || DEPARTMENTS).map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Bulk Import Button */}
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xxs"
            id="btn-bulk-import-trigger"
          >
            <Upload className="w-4 h-4 text-gray-500" />
            {t.bulkImportBtn}
          </button>

          {/* Add Employee Button */}
          <button
            onClick={openAddModal}
            className="bg-[#03623c] hover:bg-[#024d2e] text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xxs"
            id="btn-add-emp"
          >
            <Plus className="w-4 h-4" />
            {t.addBtn}
          </button>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        {filteredEmployees.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-4 px-6">{t.colId}</th>
                  <th className="py-4 px-6">{t.colName}</th>
                  <th className="py-4 px-6">{t.colRole}</th>
                  <th className="py-4 px-6">{t.colJoining}</th>
                  <th className="py-4 px-6">{t.colSalary}</th>
                  <th className="py-4 px-6">{t.colPayment}</th>
                  <th className="py-4 px-6 text-center">{t.colStatus}</th>
                  <th className="py-4 px-6 text-right">{t.colActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6 font-mono text-xs text-gray-500 font-semibold">{emp.id}</td>
                    <td className="py-4 px-6 font-semibold text-gray-900">
                      <div className="flex items-center gap-3">
                        {emp.photoUrl ? (
                          <img 
                            src={emp.photoUrl} 
                            alt={emp.name} 
                            className="w-8 h-8 rounded-full object-cover border border-gray-200 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#03623c] flex items-center justify-center font-bold text-xs shrink-0 uppercase">
                            {emp.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-gray-900 leading-tight">{emp.name}</div>
                          {emp.email && <div className="text-[10px] text-gray-400 font-normal mt-0.5 normal-case">{emp.email}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <div className="font-semibold text-gray-800 leading-tight">{emp.designation}</div>
                        <div className="text-xs text-gray-400 font-medium">{emp.department}</div>
                        {emp.branch && <div className="text-[10px] text-[#03623c] font-bold mt-0.5">{emp.branch}</div>}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-500 font-mono text-xs">
                      {new Date(emp.joiningDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-gray-800">₹{emp.basicSalary.toLocaleString('en-IN')}</div>
                      <div className="text-xxs text-gray-400">₹{emp.allowances} (Allowance) / -₹{emp.deductions} (Deduct)</div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        <CreditCard className="w-3.5 h-3.5" />
                        {emp.paymentMethod}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        emp.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {emp.isActive ? t.active : t.inactive}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(emp)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Edit Details"
                          id={`edit-${emp.id}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleActiveStatus(emp)}
                          className={`p-1.5 rounded-lg transition-all ${
                            emp.isActive 
                              ? 'text-gray-400 hover:text-red-600 hover:bg-red-50' 
                              : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                          }`}
                          title={emp.isActive ? t.deactivate : t.activate}
                          id={`toggle-${emp.id}`}
                        >
                          {emp.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400 bg-gray-50/50">
            <Building className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-base font-semibold">{t.noEmployees}</p>
          </div>
        )}
      </div>

      {/* Edit / Register Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl max-w-6xl w-full max-h-[95vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50 rounded-t-2xl shrink-0">
              <h3 className="text-sm font-bold text-gray-900 font-display">
                {editingEmployee ? t.editTitle : t.newTitle}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                
                {/* Column 1: Personal Details & Residential Address */}
                <div className="space-y-4">
                  {/* Category Card: Employee Personal Detail */}
                  <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-3">
                    <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider border-b border-gray-100 pb-1.5">
                      Employee Personal Detail
                    </h4>
                    
                    {renderFormInput('id', t.fieldId)}
                    {renderFormInput('name', t.fieldName)}
                    {renderFormInput('firstName', 'First Name')}
                    {renderFormInput('lastName', 'Last Name')}
                    {renderFormInput('email', 'Email', 'email')}
                    {renderFormInput('mobileNo', 'Mobile No')}
                    {renderFormInput('personalMobileNo', 'Personal Mobile No')}
                    {renderFormInput('personalEmail', 'Personal Email', 'email')}
                    {renderFormInput('dob', 'Date of Birth', 'date')}
                    {renderFormInput('bloodGroup', 'Blood Group')}
                    {renderFormInput('emergencyContactNo', 'Emergency Contact No')}
                    {renderFormInput('ctcOffered', 'CTC Offered', 'number')}
                    {renderFormInput('gender', 'Gender', 'text', ['Male', 'Female', 'Other'])}
                    {renderFormInput('employmentType', 'Employment Type', 'text', ['Permanent', 'Contract', 'Fresher', 'Intern', 'Part Time'])}
                    {renderFormInput('linkUser', 'Link User')}
                    {renderFormInput('probationDate', 'Probation Date', 'date')}
                  </div>

                  {/* Category Card: Residential Address */}
                  <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-3">
                    <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider border-b border-gray-100 pb-1.5">
                      Residential Address
                    </h4>
                    {renderFormInput('resLine1', 'Address Line 1')}
                    {renderFormInput('resLine2', 'Address Line 2')}
                    {renderFormInput('resCity', 'City')}
                    {renderFormInput('resState', 'State')}
                    {renderFormInput('resCountry', 'Country')}
                    {renderFormInput('resPinCode', 'PIN/ZIP Code')}
                  </div>
                </div>

                {/* Column 2: Permanent Address, Bank details, & Other Details */}
                <div className="space-y-4">
                  {/* Category Card: Permanent Address */}
                  <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                      <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                        Permanent Address
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            permLine1: prev.resLine1,
                            permLine2: prev.resLine2,
                            permCity: prev.resCity,
                            permState: prev.resState,
                            permCountry: prev.resCountry,
                            permPinCode: prev.resPinCode,
                          }));
                        }}
                        className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
                      >
                        Copy Res Address
                      </button>
                    </div>
                    {renderFormInput('permLine1', 'Address Line 1')}
                    {renderFormInput('permLine2', 'Address Line 2')}
                    {renderFormInput('permCity', 'City')}
                    {renderFormInput('permState', 'State')}
                    {renderFormInput('permCountry', 'Country')}
                    {renderFormInput('permPinCode', 'PIN/ZIP Code')}
                  </div>

                  {/* Category Card: Bank details */}
                  <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-3">
                    <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider border-b border-gray-100 pb-1.5">
                      Bank Detail
                    </h4>
                    {renderFormInput('bankAccountNo', 'Bank Account No')}
                    {renderFormInput('bankAccountHolderName', 'Account Holder Name')}
                    {renderFormInput('bankName', 'Bank Name')}
                    {renderFormInput('ifscCode', 'IFSC Code')}
                  </div>

                  {/* Category Card: Other details */}
                  <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-3">
                    <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider border-b border-gray-100 pb-1.5">
                      Other Detail (Government IDs)
                    </h4>
                    {renderFormInput('panNo', 'PAN No')}
                    {renderFormInput('pfAccountNo', 'PF Account No')}
                    {renderFormInput('esicNo', 'ESIC No')}
                    {renderFormInput('aadhaarNo', 'Aadhaar No')}
                    {renderFormInput('uan', 'UAN')}
                  </div>
                </div>

                {/* Column 3: Employment Detail, Salary Info & Photo Upload */}
                <div className="space-y-4">
                  {/* Category Card: Profile Photo */}
                  <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 flex flex-col items-center justify-center text-center space-y-2.5">
                    <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider border-b border-gray-100 pb-1.5 w-full">
                      Profile Photo
                    </h4>
                    
                    <div className="relative w-24 h-24 rounded-full border border-gray-200 bg-white flex items-center justify-center overflow-hidden shrink-0 group">
                      {formData.photoUrl ? (
                        <img 
                          src={formData.photoUrl} 
                          alt="Profile preview" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Camera className="w-8 h-8 text-gray-300 group-hover:text-gray-400 transition-colors" />
                      )}
                      <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold cursor-pointer transition-all">
                        Upload
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handlePhotoUpload} 
                          className="hidden" 
                        />
                      </label>
                    </div>
                    <p className="text-[10px] text-gray-400 font-medium">PNG or JPG up to 1MB</p>
                  </div>

                  {/* Category Card: Employment Detail */}
                  <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-3">
                    <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider border-b border-gray-100 pb-1.5">
                      Employment Detail
                    </h4>
                    {renderFormInput('joiningDate', t.fieldJoining, 'date')}
                    {renderFormInput('confirmationDate', 'Confirmation Date', 'date')}
                    {renderFormInput('designation', t.fieldRole)}
                    {renderFormInput('department', t.fieldDept, 'text', adminSettings?.departments || DEPARTMENTS)}
                    {renderFormInput('branch', 'Branch', 'text', adminSettings?.branches)}
                    {renderFormInput('costCenter', 'Cost Center', 'text', adminSettings?.costCenters)}
                    {renderFormInput('reportingTo', 'Reporting To')}
                    {renderFormInput('noticePeriod', 'Notice Period')}
                    {renderFormInput('workTiming', 'Work Timing', 'text', adminSettings?.workTimings)}
                    {renderFormInput('employeeGroup', 'Employee Group', 'text', adminSettings?.employeeGroups)}
                    {renderFormInput('weeklyOffProfile', 'Weekly Off Profile', 'text', adminSettings?.weeklyOffProfiles)}
                    {renderFormInput('leaveType', 'Leave Type', 'text', adminSettings?.leaveTypes)}
                    {renderFormInput('referenceNumber', 'Reference Number')}
                  </div>

                  {/* Category Card: Standard Salary & Payroll info */}
                  <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-3">
                    <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider border-b border-gray-100 pb-1.5">
                      Salary Structure & Payroll
                    </h4>
                    {renderFormInput('basicSalary', t.fieldSalary, 'number')}
                    {renderFormInput('allowances', t.fieldAllowances, 'number')}
                    {renderFormInput('deductions', t.fieldDeductions, 'number')}
                    {renderFormInput('hourlyRate', t.fieldHourly, 'number')}
                    {renderFormInput('paymentMethod', t.fieldPayment, 'text', PAYMENT_METHODS)}

                    <div className="border-t border-dashed border-gray-250 my-2.5 pt-2.5">
                      <h5 className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wide mb-2">Advanced Allowances (कस्टम भत्ते)</h5>
                      <div className="grid grid-cols-2 gap-2">
                        {renderFormInput('hra', 'House Rent (HRA) (₹)', 'number')}
                        {renderFormInput('da', 'Dearness (DA) (₹)', 'number')}
                      </div>
                      <div className="mt-2">
                        {renderFormInput('conveyanceAllowance', 'Conveyance Allowance (₹)', 'number')}
                      </div>
                    </div>

                    <div className="border-t border-dashed border-gray-250 my-2.5 pt-2.5">
                      <h5 className="text-[10px] font-extrabold text-amber-600 uppercase tracking-wide mb-2">Advance & Loan (एडवांस और लोन)</h5>
                      <div className="grid grid-cols-2 gap-2">
                        {renderFormInput('advanceSalaryBalance', 'Advance Outstanding (₹)', 'number')}
                        {renderFormInput('advanceSalaryDeduction', 'Monthly EMI/Deduct (₹)', 'number')}
                      </div>
                    </div>

                    <div className="border-t border-dashed border-gray-250 my-2.5 pt-2.5">
                      <h5 className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wide mb-2">Leaves Balance (छुट्टियों का रिकॉर्ड)</h5>
                      <div className="grid grid-cols-2 gap-2">
                        {renderFormInput('clBalance', 'CL Balance (Casual)', 'number')}
                        {renderFormInput('elBalance', 'EL Balance (Earned)', 'number')}
                      </div>
                    </div>

                    <div className="border-t border-dashed border-gray-250 my-2.5 pt-2.5">
                      <h5 className="text-[10px] font-extrabold text-[#03623c] uppercase tracking-wide mb-1.5">Portal Access (पोर्टल लॉगिन पासवर्ड)</h5>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase">
                          Login Password (पासवर्ड)
                        </label>
                        <input
                          type="text"
                          name="password"
                          value={formData.password as string || ''}
                          onChange={handleInputChange}
                          placeholder="Password (default: ID or 123456)"
                          className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1.5 focus:ring-[#03623c] font-medium"
                        />
                        <p className="text-[9px] text-gray-400 font-medium">If left blank, employee can log in using their ID or "123456" as password.</p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Is Active (Only show on Edit) */}
              {editingEmployee && (
                <div className="flex items-center gap-2 pt-2 bg-amber-50/50 p-3 rounded-lg border border-amber-100/50">
                  <input
                    type="checkbox"
                    name="isActive"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded-sm focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="isActive" className="text-xs font-bold text-gray-700 cursor-pointer">
                    {t.fieldActive}
                  </label>
                </div>
              )}

              {/* Modal Footer */}
              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      {t.saving}
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      {t.save}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Beautiful Bulk Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl max-w-3xl w-full p-6 flex flex-col max-h-[90vh] overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-gray-900 font-display">
                  {t.bulkImportTitle}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportedEmployees([]);
                  setImportErrors([]);
                }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content body */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              
              {/* Top Banner with Download Link and instructions */}
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-blue-800">
                    {t.requiredHeaderWarning}
                  </p>
                  <p className="text-[11px] text-gray-500 font-medium">
                    Allowed columns: Employee ID, Full Name, Department, Designation, Joining Date, Basic Salary, Allowances, Deductions, Overtime Hourly Rate, Payment Method, Is Active
                  </p>
                </div>
                <button
                  onClick={downloadTemplate}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-xs font-bold text-blue-700 rounded-lg transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  {t.downloadTemplate}
                </button>
              </div>

              {/* Drag & Drop File Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                  isDragging 
                    ? 'border-blue-500 bg-blue-50/40 scale-[0.99]' 
                    : 'border-gray-200 hover:border-blue-500 hover:bg-gray-50/50'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv"
                  className="hidden"
                />
                <div className="p-3 bg-gray-50 text-gray-400 rounded-full group-hover:bg-blue-50 group-hover:text-blue-500 transition-all">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-gray-700">
                  {t.dragDropText}
                </p>
                <p className="text-[10px] text-gray-400 font-medium font-mono">
                  CSV (Comma Separated Values)
                </p>
              </div>

              {/* Success / Warning logs */}
              {importedEmployees.length > 0 && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-start gap-2.5">
                  <div className="bg-emerald-500 text-white p-1 rounded-full shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-800">
                      {t.importSuccess.replace('{count}', String(importedEmployees.length))}
                    </h4>
                  </div>
                </div>
              )}

              {importErrors.length > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 space-y-1.5">
                  <div className="flex items-start gap-2.5">
                    <div className="bg-red-500 text-white p-1 rounded-full shrink-0">
                      <AlertCircle className="w-3 h-3" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-red-800">
                        {t.importErrors}
                      </h4>
                    </div>
                  </div>
                  <div className="max-h-24 overflow-y-auto pl-7 space-y-0.5">
                    {importErrors.map((err, i) => (
                      <p key={i} className="text-[11px] font-mono font-medium text-red-600">
                        &bull; {err}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Data Preview Table */}
              {importedEmployees.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider pl-1">
                    {t.previewTitle}
                  </h4>
                  <div className="border border-gray-100 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 font-semibold text-gray-500">
                          <th className="py-2 px-3">{t.colId}</th>
                          <th className="py-2 px-3">{t.colName}</th>
                          <th className="py-2 px-3">{t.colRole}</th>
                          <th className="py-2 px-3">{t.colJoining}</th>
                          <th className="py-2 px-3 text-right">{t.colSalary}</th>
                          <th className="py-2 px-3">{t.colPayment}</th>
                          <th className="py-2 px-3 text-center">{t.colStatus}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-medium">
                        {importedEmployees.map((emp) => (
                          <tr key={emp.id} className="hover:bg-gray-50/50">
                            <td className="py-2 px-3 font-mono text-gray-500 font-semibold">{emp.id}</td>
                            <td className="py-2 px-3 font-bold text-gray-900">{emp.name}</td>
                            <td className="py-2 px-3 text-gray-600">
                              {emp.designation} <span className="text-gray-400 text-[10px]">({emp.department})</span>
                            </td>
                            <td className="py-2 px-3 font-mono text-gray-500 text-[10px]">{emp.joiningDate}</td>
                            <td className="py-2 px-3 text-right text-gray-900 font-bold">₹{emp.basicSalary.toLocaleString('en-IN')}</td>
                            <td className="py-2 px-3 text-gray-600">{emp.paymentMethod}</td>
                            <td className="py-2 px-3 text-center">
                              <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                emp.isActive 
                                  ? 'bg-green-50 text-green-700 border border-green-200' 
                                  : 'bg-gray-50 text-gray-600 border border-gray-200'
                              }`}>
                                {emp.isActive ? t.active : t.inactive}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-gray-100 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportedEmployees([]);
                  setImportErrors([]);
                }}
                className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                disabled={importedEmployees.length === 0 || isImportSaving}
                onClick={handleConfirmImport}
                className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isImportSaving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    {t.saving}
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    {t.btnConfirmImport.replace('{count}', String(importedEmployees.length))}
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
        </>
      ) : (
        /* Render Increment History Report */
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-1 flex-col sm:flex-row gap-3">
              {/* Search Input */}
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Search className="w-5 h-5" />
                </span>
                <input
                  type="text"
                  placeholder={language === 'en' ? "Search for employee increments..." : "कर्मचारी वेतन वृद्धि खोजें..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#03623c] text-sm font-semibold text-gray-900"
                />
              </div>

              {/* Department Filter */}
              <div className="relative min-w-[200px]">
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#03623c] text-sm appearance-none bg-white font-semibold text-gray-700"
                >
                  <option value="All">{language === 'en' ? 'All Departments' : 'सभी विभाग'}</option>
                  {DEPARTMENTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
            {filteredEmployees.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-[10px] font-black text-gray-400 uppercase tracking-widest font-display">
                      <th className="py-4 px-6">ID &amp; Employee</th>
                      <th className="py-4 px-6">Department</th>
                      <th className="py-4 px-6">Current Salary</th>
                      <th className="py-4 px-6 text-center">Last Increment Date</th>
                      <th className="py-4 px-6 text-center">Last Increment Amount</th>
                      <th className="py-4 px-6 text-center">Next Increment Due</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {filteredEmployees.map((emp) => {
                      const increments = emp.increments || [];
                      const lastInc = increments.length > 0 ? increments[increments.length - 1] : null;
                      return (
                        <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-4 px-6">
                            <div className="font-extrabold text-gray-900 text-sm">{emp.name}</div>
                            <div className="text-[11px] text-gray-400 font-mono font-bold">{emp.id} &bull; {emp.designation}</div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-gray-100 text-gray-600">
                              {emp.department}
                            </span>
                          </td>
                          <td className="py-4 px-6 font-mono font-extrabold text-gray-900 text-sm">
                            ₹{emp.basicSalary.toLocaleString('en-IN')}
                          </td>
                          <td className="py-4 px-6 text-center font-mono text-gray-500 font-bold">
                            {lastInc ? lastInc.date : '—'}
                          </td>
                          <td className="py-4 px-6 text-center font-mono text-emerald-600 font-bold">
                            {lastInc ? `+₹${lastInc.amount.toLocaleString('en-IN')}` : '—'}
                          </td>
                          <td className="py-4 px-6 text-center">
                            {emp.nextIncrementDate ? (
                              <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 font-mono">
                                {emp.nextIncrementDate}
                              </span>
                            ) : (
                              <span className="text-gray-400 font-bold">Not Scheduled</span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setSelectedEmployeeForHistory(emp)}
                                className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-2.5 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-all active:scale-97 shadow-xxs"
                                title="View Appraisal History"
                              >
                                <Clock className="w-3.5 h-3.5 text-gray-400" />
                                <span>History ({increments.length})</span>
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedEmployeeForIncrement(emp);
                                  setIncAmount(0);
                                  setIncNewSalary(emp.basicSalary);
                                  setIncDate(new Date().toISOString().split('T')[0]);
                                }}
                                className="bg-[#03623c]/10 hover:bg-[#03623c]/20 text-[#03623c] border border-[#03623c]/20 px-2.5 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-all active:scale-97 shadow-xxs"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Record Appraisal</span>
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
              <div className="text-center py-16 text-gray-400">
                <AlertCircle className="w-10 h-10 mx-auto text-gray-200 mb-3" />
                <p className="text-xs font-bold leading-relaxed">No matching employees found for increments tracking.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RECORD INCREMENT MODAL */}
      {selectedEmployeeForIncrement && (
        <div className="fixed inset-0 bg-gray-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-150 pb-3 font-display">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-[#03623c]" />
                Record Salary Increment
              </h3>
              <button 
                onClick={() => setSelectedEmployeeForIncrement(null)}
                className="text-gray-400 hover:text-gray-600 rounded-lg p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordIncrement} className="space-y-4 text-xs font-semibold">
              <div>
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Employee Details</span>
                <p className="mt-1 font-extrabold text-sm text-gray-800">
                  {selectedEmployeeForIncrement.name} <span className="font-mono text-xs text-gray-400">({selectedEmployeeForIncrement.id})</span>
                </p>
                <p className="text-[11px] text-gray-500 font-medium mt-0.5">{selectedEmployeeForIncrement.designation} &bull; {selectedEmployeeForIncrement.department}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Current Salary (₹)</label>
                  <input
                    type="text"
                    disabled
                    value={`₹${selectedEmployeeForIncrement.basicSalary.toLocaleString('en-IN')}`}
                    className="w-full px-3 py-2 border border-gray-150 bg-gray-50 rounded-xl mt-1 font-mono font-bold text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Increment Amount (₹) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 5000"
                    value={incAmount || ''}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setIncAmount(val);
                      setIncNewSalary(selectedEmployeeForIncrement.basicSalary + val);
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl mt-1 focus:outline-none focus:ring-1.5 focus:ring-[#03623c] font-mono font-bold text-gray-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">New Salary (₹) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={incNewSalary || ''}
                    onChange={(e) => setIncNewSalary(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl mt-1 focus:outline-none focus:ring-1.5 focus:ring-[#03623c] font-mono font-bold text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Increment Date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    required
                    value={incDate}
                    onChange={(e) => setIncDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl mt-1 focus:outline-none focus:ring-1.5 focus:ring-[#03623c] font-semibold text-gray-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Next Increment Due Date</label>
                <input
                  type="date"
                  value={incNextDate}
                  onChange={(e) => setIncNextDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl mt-1 focus:outline-none focus:ring-1.5 focus:ring-[#03623c] font-semibold text-gray-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Remarks / Notes</label>
                <textarea
                  placeholder="Reason for increment, e.g., Annual Performance appraisal"
                  value={incRemarks}
                  onChange={(e) => setIncRemarks(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl mt-1 focus:outline-none focus:ring-1.5 focus:ring-[#03623c] text-xs h-16 font-semibold"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedEmployeeForIncrement(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-gray-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingIncrement}
                  className="px-5 py-2 bg-[#03623c] hover:bg-[#024a2d] text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSavingIncrement ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Save & Sync
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INCREMENT HISTORY MODAL */}
      {selectedEmployeeForHistory && (
        <div className="fixed inset-0 bg-gray-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-gray-150 pb-3 shrink-0">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#03623c]" />
                Increment History
              </h3>
              <button 
                onClick={() => setSelectedEmployeeForHistory(null)}
                className="text-gray-400 hover:text-gray-600 rounded-lg p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="shrink-0">
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Employee Details</span>
              <p className="mt-1 font-extrabold text-sm text-gray-800">
                {selectedEmployeeForHistory.name} <span className="font-mono text-xs text-gray-400">({selectedEmployeeForHistory.id})</span>
              </p>
              <p className="text-[11px] text-gray-500 font-medium mt-0.5">{selectedEmployeeForHistory.designation} &bull; {selectedEmployeeForHistory.department}</p>
              <p className="text-[11px] text-[#03623c] font-black mt-1 uppercase">Current Basic Salary: ₹{selectedEmployeeForHistory.basicSalary.toLocaleString('en-IN')}</p>
            </div>

            <div className="overflow-y-auto pr-2 py-2 flex-1 scrollbar-thin">
              {selectedEmployeeForHistory.increments && selectedEmployeeForHistory.increments.length > 0 ? (
                <div className="relative border-l-2 border-emerald-100 ml-3 pl-5 space-y-6">
                  {selectedEmployeeForHistory.increments
                    .slice()
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((inc, index) => (
                      <div key={inc.id || index} className="relative">
                        {/* Timeline Bullet Point */}
                        <span className="absolute -left-[27px] top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 ring-4 ring-white">
                          <span className="h-1.5 w-1.5 rounded-full bg-white" />
                        </span>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-[11px] text-gray-500 bg-gray-50 border px-2 py-0.5 rounded-md font-mono">{inc.date}</span>
                            <span className="font-black text-emerald-600 text-xs font-mono">+₹{inc.amount.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="text-xs font-semibold text-gray-800">
                            Salary Raised from <span className="font-mono text-gray-500">₹{inc.previousSalary?.toLocaleString('en-IN') || '—'}</span> &rarr; <span className="font-mono text-emerald-700">₹{inc.newSalary?.toLocaleString('en-IN') || '—'}</span>
                          </div>
                          {inc.remarks && (
                            <p className="text-[11px] text-gray-500 italic bg-gray-50 p-2 rounded-lg border border-gray-100 font-medium mt-1">
                              &ldquo;{inc.remarks}&rdquo;
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-400 space-y-2">
                  <AlertCircle className="w-8 h-8 mx-auto text-gray-200" />
                  <p className="text-xs font-bold">No increments history found.</p>
                  <p className="text-[10px] text-gray-400 max-w-xs mx-auto">Use the &ldquo;Record Increment&rdquo; button to log salary appraisal events.</p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setSelectedEmployeeForHistory(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-gray-600 text-xs cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
