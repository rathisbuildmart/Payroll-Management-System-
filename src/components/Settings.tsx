import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Building, 
  ToggleLeft, 
  List, 
  Plus, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Lock, 
  HelpCircle, 
  Undo, 
  ShieldAlert, 
  Search, 
  Filter, 
  Megaphone, 
  LifeBuoy, 
  KeyRound, 
  CheckCircle2, 
  Database, 
  Upload, 
  Download, 
  RefreshCw, 
  AlertTriangle, 
  History, 
  Edit2, 
  X,
  MapPin,
  Locate,
  Mail,
  Send
} from 'lucide-react';
import { AdminSettings, FieldSetting, FailedLoginAttempt, UserRoleAccount, AuditLog } from '../types';

interface SettingsProps {
  settings: AdminSettings;
  onSaveSettings: (settings: AdminSettings) => void;
  language: 'en' | 'hi';
  failedLogins?: FailedLoginAttempt[];
  onClearFailedLogins?: () => void;

  announcements?: any[];
  setAnnouncements?: React.Dispatch<React.SetStateAction<any[]>>;
  hrTickets?: any[];
  setHrTickets?: React.Dispatch<React.SetStateAction<any[]>>;
  passwordRequests?: any[];
  setPasswordRequests?: React.Dispatch<React.SetStateAction<any[]>>;

  employees?: any[];
  attendance?: any[];
  payroll?: any[];
  onImportData?: (data: { employees?: any[]; attendance?: any[]; payroll?: any[]; adminSettings?: AdminSettings }) => void;
  onClearSheetsSession?: () => void;
  
  auditLogs?: AuditLog[];
  onClearAuditLogs?: () => void;
  portalUser?: any;
}

export const DEFAULT_FIELDS_CONFIG: FieldSetting[] = [
  // Employee Detail
  { id: 'firstName', label: 'First Name', group: 'detail', isHidden: false, isMandatory: true },
  { id: 'lastName', label: 'Last Name', group: 'detail', isHidden: false, isMandatory: false },
  { id: 'email', label: 'Email', group: 'detail', isHidden: false, isMandatory: true },
  { id: 'mobileNo', label: 'Mobile No.', group: 'detail', isHidden: false, isMandatory: false },
  { id: 'personalMobileNo', label: 'Personal Mobile No.', group: 'detail', isHidden: false, isMandatory: false },
  { id: 'personalEmail', label: 'Personal Email', group: 'detail', isHidden: false, isMandatory: false },
  { id: 'dob', label: 'Date of Birth', group: 'detail', isHidden: false, isMandatory: false },
  { id: 'bloodGroup', label: 'Blood Group', group: 'detail', isHidden: false, isMandatory: false },
  { id: 'emergencyContactNo', label: 'Emergency Contact No.', group: 'detail', isHidden: false, isMandatory: false },
  { id: 'ctcOffered', label: 'CTC Offered', group: 'detail', isHidden: false, isMandatory: false },
  { id: 'gender', label: 'Gender', group: 'detail', isHidden: false, isMandatory: true },
  { id: 'employmentType', label: 'Employment Type', group: 'detail', isHidden: false, isMandatory: false },
  { id: 'linkUser', label: 'Link User', group: 'detail', isHidden: true, isMandatory: false },
  { id: 'probationDate', label: 'Probation Date', group: 'detail', isHidden: false, isMandatory: false },

  // Residential Address
  { id: 'resLine1', label: 'Residential Line 1', group: 'residential', isHidden: false, isMandatory: false },
  { id: 'resLine2', label: 'Residential Line 2', group: 'residential', isHidden: false, isMandatory: false },
  { id: 'resCountry', label: 'Residential Country', group: 'residential', isHidden: false, isMandatory: false },
  { id: 'resState', label: 'Residential State', group: 'residential', isHidden: false, isMandatory: false },
  { id: 'resCity', label: 'Residential City', group: 'residential', isHidden: false, isMandatory: false },
  { id: 'resPinCode', label: 'Residential PIN/ZIP Code', group: 'residential', isHidden: false, isMandatory: false },

  // Permanent Address
  { id: 'permLine1', label: 'Permanent Line 1', group: 'permanent', isHidden: false, isMandatory: false },
  { id: 'permLine2', label: 'Permanent Line 2', group: 'permanent', isHidden: false, isMandatory: false },
  { id: 'permCountry', label: 'Permanent Country', group: 'permanent', isHidden: false, isMandatory: false },
  { id: 'permState', label: 'Permanent State', group: 'permanent', isHidden: false, isMandatory: false },
  { id: 'permCity', label: 'Permanent City', group: 'permanent', isHidden: false, isMandatory: false },
  { id: 'permPinCode', label: 'Permanent PIN/ZIP Code', group: 'permanent', isHidden: false, isMandatory: false },

  // Bank Detail
  { id: 'bankAccountNo', label: 'Bank Account No.', group: 'bank', isHidden: false, isMandatory: false },
  { id: 'bankAccountHolderName', label: 'Bank Account Holder name', group: 'bank', isHidden: false, isMandatory: false },
  { id: 'bankName', label: 'Bank Name', group: 'bank', isHidden: false, isMandatory: false },
  { id: 'ifscCode', label: 'IFSC code', group: 'bank', isHidden: false, isMandatory: false },

  // Other Detail
  { id: 'panNo', label: 'PAN No.', group: 'other', isHidden: false, isMandatory: false },
  { id: 'pfAccountNo', label: 'PF Account No.', group: 'other', isHidden: false, isMandatory: false },
  { id: 'esicNo', label: 'ESIC No.', group: 'other', isHidden: false, isMandatory: false },
  { id: 'aadhaarNo', label: 'Aadhaar No.', group: 'other', isHidden: false, isMandatory: false },
  { id: 'uan', label: 'UAN', group: 'other', isHidden: false, isMandatory: false },

  // Employment Detail
  { id: 'confirmationDate', label: 'Confirmation Date', group: 'employment', isHidden: false, isMandatory: false },
  { id: 'branch', label: 'Branch', group: 'employment', isHidden: false, isMandatory: false },
  { id: 'costCenter', label: 'Cost Center', group: 'employment', isHidden: false, isMandatory: false },
  { id: 'reportingTo', label: 'Reporting To', group: 'employment', isHidden: false, isMandatory: false },
  { id: 'noticePeriod', label: 'Notice Period', group: 'employment', isHidden: false, isMandatory: false },
  { id: 'workTiming', label: 'Work Timing', group: 'employment', isHidden: false, isMandatory: false },
  { id: 'employeeGroup', label: 'Employee group', group: 'employment', isHidden: false, isMandatory: false },
  { id: 'weeklyOffProfile', label: 'Weekly Off Profile', group: 'employment', isHidden: false, isMandatory: false },
  { id: 'leaveType', label: 'Leave Type', group: 'employment', isHidden: false, isMandatory: false },
  { id: 'referenceNumber', label: 'Reference Number', group: 'employment', isHidden: false, isMandatory: false },
  { id: 'photoUrl', label: 'Profile Photo', group: 'employment', isHidden: false, isMandatory: false },
];

export const INITIAL_ADMIN_SETTINGS: AdminSettings = {
  companyName: 'Rathi Buildmart',
  companyAddress: 'Karnataka, India',
  companyLogo: '',
  currency: '₹',
  defaultCheckIn: '09:00',
  defaultCheckOut: '18:00',
  defaultOvertimeRate: 150,
  pfContributionRate: 12,
  esicContributionRate: 0.75,
  departments: ['Management', 'Engineering', 'Human Resources', 'Sales', 'Marketing', 'Finance', 'Operations', 'IT Support', 'Other'],
  branches: ['Bangalore HQ', 'Mysore Branch', 'Hubli Hub', 'Mangalore Office'],
  costCenters: ['Production Tech', 'HR Admin', 'Marketing Hub', 'Sales Ops'],
  employeeGroups: ['Direct Contract', 'Permanent Staff', 'Consultant', 'Intern'],
  workTimings: ['General Shift (09:00 AM - 06:00 PM)', 'Night Shift (09:00 PM - 06:00 AM)', 'Morning Shift (06:00 AM - 03:00 PM)'],
  weeklyOffProfiles: ['Sunday Off', 'Saturday & Sunday Off', 'Rotational Off'],
  leaveTypes: ['Casual Leave (CL)', 'Sick Leave (SL)', 'Earned Leave (EL)', 'Maternity Leave', 'LWP'],
  fields: DEFAULT_FIELDS_CONFIG,
  adminUsername: 'admin',
  adminPassword: 'admin123',
  enableHra: true,
  enableDa: true,
  enableConveyance: true,
  enableProfessionalTax: true,
  enablePaidLeaveCalculation: true,
  paidLeaveStartAfterMonths: 0,
  roleAccounts: [
    {
      id: 'acc-1',
      username: 'director',
      password: 'director123',
      role: 'director',
      name: 'Director Desk',
      createdAt: '2026-07-15T00:00:00.000Z'
    },
    {
      id: 'acc-2',
      username: 'hr',
      password: 'hr123',
      role: 'hr',
      name: 'HR Manager',
      createdAt: '2026-07-15T00:00:00.000Z'
    },
    {
      id: 'acc-3',
      username: 'manager',
      password: 'manager123',
      role: 'branch_manager',
      name: 'Branch Manager',
      createdAt: '2026-07-15T00:00:00.000Z',
      branch: 'Bangalore HQ'
    }
  ],
  rolePermissions: {
    admin: ['dashboard', 'employees', 'attendance', 'payroll', 'leaves', 'ledger', 'admin'],
    director: ['dashboard', 'employees', 'attendance', 'payroll', 'leaves', 'ledger'],
    sub_admin: ['dashboard', 'employees', 'attendance', 'leaves'],
    hr: ['dashboard', 'employees', 'attendance', 'payroll', 'leaves', 'ledger'],
    branch_manager: ['dashboard', 'employees', 'attendance', 'leaves'],
    employee: []
  },
  enableEmployeePayslips: false,
  enableGeofencing: false,
  enableMobileAttendance: true,
  smtpHost: 'smtp.gmail.com',
  smtpPort: 587,
  smtpUsername: 'misrpr@rathibuildmart.com',
  smtpPassword: '',
  senderName: 'Rathi LMS System',
  senderEmail: 'rbmlms@rathibuildmart.com',
  enablePasswordLoginOtp: false
};

export default function Settings({ 
  settings, 
  onSaveSettings, 
  language, 
  failedLogins = [], 
  onClearFailedLogins,
  announcements = [],
  setAnnouncements,
  hrTickets = [],
  setHrTickets,
  passwordRequests = [],
  setPasswordRequests,
  employees = [],
  attendance = [],
  payroll = [],
  onImportData,
  onClearSheetsSession,
  auditLogs = [],
  onClearAuditLogs,
  portalUser
}: SettingsProps) {
  const [activeSubTab, setActiveSubTab] = useState<'company' | 'fields' | 'masters' | 'policy' | 'security' | 'database' | 'roles_permissions' | 'audit_logs' | 'email_smtp'>('company');
  const [localSettings, setLocalSettings] = useState<AdminSettings>(settings);
  
  // User Roles & Access states
  const [newAccName, setNewAccName] = useState('');
  const [newAccUsername, setNewAccUsername] = useState('');
  const [newAccPassword, setNewAccPassword] = useState('');
  const [newAccEmail, setNewAccEmail] = useState('');
  const [newAccMobileNo, setNewAccMobileNo] = useState('');
  const [newAccRole, setNewAccRole] = useState<'admin' | 'director' | 'sub_admin' | 'hr' | 'branch_manager'>('hr');
  const [newAccBranch, setNewAccBranch] = useState('');
  const [newAccBranches, setNewAccBranches] = useState<string[]>([]);
  const [roleFormError, setRoleFormError] = useState('');
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editingAccountPassword, setEditingAccountPassword] = useState<string>('');
  const [editingAccount, setEditingAccount] = useState<UserRoleAccount | null>(null);
  const [newMasterVal, setNewMasterVal] = useState<string>('');
  const [activeMasterList, setActiveMasterList] = useState<keyof Pick<AdminSettings, 'departments' | 'branches' | 'costCenters' | 'employeeGroups' | 'workTimings' | 'weeklyOffProfiles' | 'leaveTypes'>>('departments');
  const [activeConfigRole, setActiveConfigRole] = useState<'director' | 'sub_admin' | 'hr' | 'branch_manager'>('director');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [confirmReset, setConfirmReset] = useState<boolean>(false);

  // SMTP Tester states
  const [testRecipient, setTestRecipient] = useState('');
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Geofencing Outlet Registration States
  const [newOutletName, setNewOutletName] = useState('');
  const [newOutletLat, setNewOutletLat] = useState('');
  const [newOutletLng, setNewOutletLng] = useState('');
  const [newOutletRadius, setNewOutletRadius] = useState<number>(100);
  const [isFetchingAdminCoords, setIsFetchingAdminCoords] = useState(false);

  const fetchAdminLocation = () => {
    setIsFetchingAdminCoords(true);
    
    const handleSuccess = (position: GeolocationPosition) => {
      setNewOutletLat(position.coords.latitude.toFixed(6));
      setNewOutletLng(position.coords.longitude.toFixed(6));
      setIsFetchingAdminCoords(false);
    };

    const handleFailure = (error: GeolocationPositionError) => {
      console.warn("High accuracy GPS failed, retrying with low accuracy...", error);
      // Retry with low accuracy
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setNewOutletLat(position.coords.latitude.toFixed(6));
          setNewOutletLng(position.coords.longitude.toFixed(6));
          setIsFetchingAdminCoords(false);
        },
        (fallbackError) => {
          console.warn("GPS error on fallback:", fallbackError);
          // Set Bangalore coordinates as fallback instead of failing/crashing
          setNewOutletLat("12.971600");
          setNewOutletLng("77.594600");
          setIsFetchingAdminCoords(false);
        },
        { enableHighAccuracy: false, timeout: 15000 }
      );
    };

    navigator.geolocation.getCurrentPosition(handleSuccess, handleFailure, { 
      enableHighAccuracy: true, 
      timeout: 5000 
    });
  };

  const handleAddGeofenceOutlet = () => {
    if (!newOutletName.trim() || !newOutletLat.trim() || !newOutletLng.trim()) {
      alert(language === 'en' ? "Please fill in all fields to add a secure outlet!" : "सक्रिय सुरक्षित आउटलेट जोड़ने के लिए कृपया सभी फ़ील्ड भरें!");
      return;
    }
    const latNum = parseFloat(newOutletLat);
    const lngNum = parseFloat(newOutletLng);
    if (isNaN(latNum) || isNaN(lngNum)) {
      alert(language === 'en' ? "Please enter valid numeric latitude and longitude coordinates." : "कृपया मान्य संख्यात्मक अक्षांश और देशांतर निर्देशांक दर्ज करें।");
      return;
    }

    const newOutlet = {
      id: 'outlet-' + Date.now(),
      name: newOutletName.trim(),
      latitude: latNum,
      longitude: lngNum,
      radiusMeters: Number(newOutletRadius) || 100
    };

    const currentOutlets = localSettings.geofenceOutlets || [];
    setLocalSettings({
      ...localSettings,
      geofenceOutlets: [...currentOutlets, newOutlet]
    });

    // Reset Form
    setNewOutletName('');
    setNewOutletLat('');
    setNewOutletLng('');
    setNewOutletRadius(100);
  };

  const handleRemoveGeofenceOutlet = (id: string) => {
    const currentOutlets = localSettings.geofenceOutlets || [];
    setLocalSettings({
      ...localSettings,
      geofenceOutlets: currentOutlets.filter(o => o.id !== id)
    });
  };

  // Corporate notices & HR Helpdesk management states
  const [newNoticeTitle, setNewNoticeTitle] = useState('');
  const [newNoticeTitleHi, setNewNoticeTitleHi] = useState('');
  const [newNoticeContent, setNewNoticeContent] = useState('');
  const [newNoticeContentHi, setNewNoticeContentHi] = useState('');
  const [newNoticeBadge, setNewNoticeBadge] = useState<'Critical' | 'Holiday' | 'General' | 'Policy'>('General');

  // Security Log Search/Filter States
  const [securitySearch, setSecuritySearch] = useState('');
  const [securityReasonFilter, setSecurityReasonFilter] = useState<'all' | 'Incorrect Password' | 'User ID not found' | 'Admin Incorrect Password'>('all');

  // Audit Logs Search & Filter States
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState<'all' | 'create' | 'update' | 'approve' | 'reject'>('all');

  // Database Backup, Sync, and Troubleshoot States
  const [importData, setImportData] = useState<any>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<string | null>(null);

  const handleExport = () => {
    try {
      const exportPayload = {
        employees,
        attendance,
        payroll,
        adminSettings: settings,
        exportedAt: new Date().toISOString(),
        source: window.location.href
      };
      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `payroll_db_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert("Export failed: " + (e?.message || e));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    setImportSummary(null);
    setImportData(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed || (typeof parsed !== 'object')) {
          throw new Error(language === 'en' ? "Invalid JSON format." : "अमान्य JSON प्रारूप।");
        }
        
        const empsCount = Array.isArray(parsed.employees) ? parsed.employees.length : 0;
        const attCount = Array.isArray(parsed.attendance) ? parsed.attendance.length : 0;
        const payCount = Array.isArray(parsed.payroll) ? parsed.payroll.length : 0;
        
        if (empsCount === 0 && attCount === 0 && payCount === 0) {
          throw new Error(language === 'en' ? "Backup file is empty." : "बैकअप फ़ाइल खाली है।");
        }

        setImportData(parsed);
        setImportSummary(
          language === 'en'
            ? `Backup file verified. It contains: ${empsCount} employees, ${attCount} attendance entries, and ${payCount} payroll records.`
            : `बैकअप फ़ाइल सत्यापित की गई। इसमें: ${empsCount} कर्मचारी, ${attCount} उपस्थिति रिकॉर्ड, और ${payCount} पेरोल रिकॉर्ड शामिल हैं।`
        );
      } catch (err: any) {
        setImportError(err?.message || String(err));
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (!importData || !onImportData) return;
    onImportData(importData);
    setImportSummary(null);
    setImportData(null);
  };

  // Work Timing Specific Builder States
  const [shiftName, setShiftName] = useState<string>('');
  const [shiftStart, setShiftStart] = useState<string>('09:00');
  const [shiftEnd, setShiftEnd] = useState<string>('18:00');

  const t = {
    en: {
      adminTitle: "Admin Panel & System Settings",
      adminSub: "Configure enterprise rules, form field visibility, mandatory fields, and default list options",
      savedAlert: "Settings saved successfully! Controls updated instantly.",
      tabCompany: "Company Profile",
      tabFields: "Field Settings (Mandatory/Hide)",
      tabMasters: "Dropdown Masters",
      tabPolicy: "Policy & Payroll Rules",
      tabSecurity: "Login Security Audit",
      tabNoticesSupport: "Notices & HR Helpdesk",
      tabDatabase: "Database & Backups",
      tabEmailSmtp: "SMTP Email Settings",
      
      // Company
      compName: "Company Name",
      compAddress: "Company Address",
      currencySymbol: "Currency Symbol",
      logoUrl: "Company Logo URL (Optional)",
      saveAll: "Save & Synchronize",
      resetDefault: "Reset to Default",

      // Field Config
      fieldColName: "Field Label",
      fieldColGroup: "Section / Group",
      fieldColHidden: "Status",
      fieldColMandatory: "Mandatory?",
      mandatoryNote: "Fields set as 'Mandatory' will be validated during Employee Registration.",
      visible: "Visible",
      hidden: "Hidden",
      toggleVisibility: "Toggle Visibility",
      toggleMandatory: "Toggle Required Status",

      // Groups
      groupAll: "All Fields",
      groupDetail: "Employee Details",
      groupResidential: "Residential Address",
      groupPermanent: "Permanent Address",
      groupBank: "Bank Details",
      groupOther: "Other / Tax Details",
      groupEmployment: "Employment Details",

      // Masters
      masterSelect: "Select List to Manage:",
      masterPlaceholder: "Add new option...",
      masterAdd: "Add Option",
      noOptions: "No options configured in this list.",
      listDept: "Departments",
      listBranches: "Branches",
      listCost: "Cost Centers",
      listGroups: "Employee Groups",
      listTimings: "Work Timings",
      listWeeklyOff: "Weekly Off Profiles",
      listLeaves: "Leave Types",

      // Policy
      policyTitle: "Attendance & Payroll Policy",
      defaultShift: "Standard Work Timing",
      checkIn: "Default Check-In",
      checkOut: "Default Check-Out",
      overtimeRate: "Overtime Hourly Rate (₹)",
      pfRate: "PF Employee Contribution (%)",
      esicRate: "ESIC Contribution (%)",
      allowancesCalcTitle: "Allowances & Deductions Active Toggles",
      enableHraLabel: "Enable House Rent Allowance (HRA) Calculation",
      enableDaLabel: "Enable Dearness Allowance (DA) Calculation",
      enableConveyanceLabel: "Enable Conveyance Allowance Calculation",
      enableProfessionalTaxLabel: "Enable Professional Tax (PT) Deduction",
      enablePaidLeaveLabel: "Enable Paid Leave (PL) & Earned Leave Calculation",
      paidLeaveStartAfterLabel: "Paid Leave Starts After (Months of Service required)",
      paidLeaveStartImmediately: "Start Immediately Upon Joining",
      toggleCalcSub: "Toggle which salary components are dynamically processed in payroll generation.",
      enableEmployeePayslipsLabel: "Enable Payslip View & Download for Employees",
      employeePortalSettingsTitle: "Employee Portal Control Settings",
    },
    hi: {
      adminTitle: "एडमिन पैनल और सिस्टम सेटिंग्स",
      adminSub: "कंपनी नियम, फॉर्म फ़ील्ड्स को दिखाना/छिपाना, अनिवार्य फ़ील्ड्स और ड्रॉपडाउन सूची का प्रबंधन करें।",
      savedAlert: "सेटिंग्स सफलतापूर्वक सहेज ली गईं! सभी नियम तुरंत लागू हो गए हैं।",
      tabCompany: "कंपनी प्रोफाइल",
      tabFields: "फ़ील्ड सेटिंग्स (अनिवार्य/छिपाएं)",
      tabMasters: "ड्रॉपडाउन मास्टर सूचियाँ",
      tabPolicy: "नीति और पेरोल नियम",
      tabSecurity: "लॉगिन सुरक्षा ऑडिट",
      tabNoticesSupport: "कंपनी नोटिस और हेल्पडेस्क",
      tabDatabase: "डेटाबेस और बैकअप",
      tabEmailSmtp: "ईमेल और SMTP सेटिंग्स",
      
      // Company
      compName: "कंपनी का नाम",
      compAddress: "कंपनी का पता",
      currencySymbol: "मुद्रा प्रतीक",
      logoUrl: "कंपनी लोगो URL (वैकल्पिक)",
      saveAll: "सहेजें और लागू करें",
      resetDefault: "डिफ़ॉल्ट पर रीसेट करें",

      // Field Config
      fieldColName: "फ़ील्ड नाम",
      fieldColGroup: "अनुभाग / समूह",
      fieldColHidden: "स्थिति",
      fieldColMandatory: "अनिवार्य?",
      mandatoryNote: "अनिवार्य चिह्नित फ़ील्ड्स कर्मचारी पंजीकरण के समय अनिवार्य रूप से भरे होने चाहिए।",
      visible: "दिखाई दे रहा है",
      hidden: "छिपा हुआ है",
      toggleVisibility: "दृश्यता बदलें",
      toggleMandatory: "अनिवार्य स्थिति बदलें",

      // Groups
      groupAll: "सभी फ़ील्ड्स",
      groupDetail: "कर्मचारी विवरण",
      groupResidential: "स्थानीय पता",
      groupPermanent: "स्थायी पता",
      groupBank: "बैंक विवरण",
      groupOther: "अन्य / टैक्स विवरण",
      groupEmployment: "रोजगार विवरण",

      // Masters
      masterSelect: "प्रबंधन के लिए सूची चुनें:",
      masterPlaceholder: "नया विकल्प जोड़ें...",
      masterAdd: "विकल्प जोड़ें",
      noOptions: "इस सूची में कोई विकल्प कॉन्फ़िगर नहीं किया गया है।",
      listDept: "विभाग (Departments)",
      listBranches: "शाखाएं (Branches)",
      listCost: "लागत केंद्र (Cost Centers)",
      listGroups: "कर्मचारी समूह (Employee Groups)",
      listTimings: "कार्य समय (Work Timings)",
      listWeeklyOff: "साप्ताहिक अवकाश (Weekly Off Profiles)",
      listLeaves: "अवकाश के प्रकार (Leave Types)",

      // Policy
      policyTitle: "उपस्थिति और पेरोल नीति",
      defaultShift: "मानक कार्य समय विवरण",
      checkIn: "डिफ़ॉल्ट चेक-इन समय",
      checkOut: "डिफ़ॉल्ट चेक-आउट समय",
      overtimeRate: "ओवरटाइम प्रति घंटा दर (₹)",
      pfRate: "PF कर्मचारी योगदान (%)",
      esicRate: "ESIC कर्मचारी योगदान (%)",
      allowancesCalcTitle: "भत्ते और कटौतियां सक्रिय टॉगल",
      enableHraLabel: "मकान किराया (HRA) गणना चालू करें",
      enableDaLabel: "महंगाई भत्ता (DA) गणना चालू करें",
      enableConveyanceLabel: "यातायात भत्ता (Conveyance) गणना चालू करें",
      enableProfessionalTaxLabel: "व्यावसायिक कर (PT) कटौती चालू करें",
      enablePaidLeaveLabel: "सवैतनिक अवकाश (Paid Leave / EL) गणना चालू करें",
      paidLeaveStartAfterLabel: "सवैतनिक अवकाश कितने महीने बाद शुरू हो (सेवा अवधि)",
      paidLeaveStartImmediately: "शामिल होने के तुरंत बाद शुरू करें",
      toggleCalcSub: "चुनें कि पेरोल गणना के दौरान कौन से वेतन घटक सक्रिय रूप से संसाधित किए जाते हैं।",
      enableEmployeePayslipsLabel: "कर्मचारियों के लिए पे-स्लिप देखने और डाउनलोड करने की सुविधा चालू करें",
      employeePortalSettingsTitle: "कर्मचारी पोर्टल नियंत्रण सेटिंग्स",
    }
  }[language];

  const handleFieldToggle = (fieldId: keyof Pick<AdminSettings, 'fields'>['fields'][number]['id'], property: 'isHidden' | 'isMandatory') => {
    const updatedFields = localSettings.fields.map(field => {
      if (field.id === fieldId) {
        return {
          ...field,
          [property]: !field[property],
        };
      }
      return field;
    });
    setLocalSettings({ ...localSettings, fields: updatedFields });
  };

  const formatTo12Hour = (time24: string): string => {
    if (!time24) return '09:00 AM';
    const parts = time24.split(':');
    let hour = parseInt(parts[0], 10);
    const minute = (parts[1] || '00').padStart(2, '0');
    if (isNaN(hour)) hour = 9;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    if (hour === 0) hour = 12;
    return `${String(hour).padStart(2, '0')}:${minute} ${ampm}`;
  };

  const handleAddMasterItem = () => {
    let valToAdd = '';
    
    if (activeMasterList === 'workTimings') {
      if (!shiftName.trim()) {
        alert(language === 'en' ? "Please enter a shift name!" : "कृपया शिफ्ट का नाम दर्ज करें!");
        return;
      }
      const startFormatted = formatTo12Hour(shiftStart);
      const endFormatted = formatTo12Hour(shiftEnd);
      valToAdd = `${shiftName.trim()} (${startFormatted} - ${endFormatted})`;
    } else {
      if (!newMasterVal.trim()) return;
      valToAdd = newMasterVal.trim();
    }

    const currentList = localSettings[activeMasterList] as string[];
    if (currentList.includes(valToAdd)) {
      alert(language === 'en' ? "Option already exists!" : "यह विकल्प पहले से मौजूद है!");
      return;
    }
    const updatedList = [...currentList, valToAdd];
    setLocalSettings({
      ...localSettings,
      [activeMasterList]: updatedList
    });
    
    if (activeMasterList === 'workTimings') {
      setShiftName('');
    } else {
      setNewMasterVal('');
    }
  };

  const handleRemoveMasterItem = (itemToRemove: string) => {
    const currentList = localSettings[activeMasterList] as string[];
    const updatedList = currentList.filter(item => item !== itemToRemove);
    setLocalSettings({
      ...localSettings,
      [activeMasterList]: updatedList
    });
  };

  const roleAccounts = localSettings.roleAccounts || [];
  const rolePermissions = localSettings.rolePermissions || {
    admin: ['dashboard', 'employees', 'attendance', 'payroll', 'leaves', 'ledger', 'admin'],
    director: ['dashboard', 'employees', 'attendance', 'payroll', 'leaves', 'ledger'],
    sub_admin: ['dashboard', 'employees', 'attendance', 'leaves'],
    hr: ['dashboard', 'employees', 'attendance', 'payroll', 'leaves', 'ledger'],
    branch_manager: ['dashboard', 'employees', 'attendance', 'leaves'],
    employee: []
  };

  const PERMISSION_MODULES = [
    { id: 'dashboard', labelEn: 'System Dashboard', labelHi: 'सिस्टम डैशबोर्ड' },
    { id: 'employees', labelEn: 'Employee Registry', labelHi: 'कर्मचारी सूची' },
    { id: 'attendance', labelEn: 'Attendance & Logs', labelHi: 'उपस्थिति और लॉग्स' },
    { id: 'payroll', labelEn: 'Payroll & Payslips', labelHi: 'पेरोल और वेतन पर्ची' },
    { id: 'leaves', labelEn: 'Leaves & Holidays', labelHi: 'छुट्टियां और अवकाश' },
    { id: 'ledger', labelEn: 'Employee Ledger', labelHi: 'कर्मचारी बहीखाता (Ledger)' },
    { id: 'admin', labelEn: 'System Settings', labelHi: 'सिस्टम सेटिंग्स' },
  ];

  const getActionForColumn = (modId: string, colIndex: number) => {
    if (colIndex === 0) {
      return { id: 'view', label: language === 'en' ? 'View' : 'देखें' };
    }
    if (colIndex === 1) {
      if (['employees', 'attendance', 'payroll', 'leaves'].includes(modId)) {
        let label = language === 'en' ? 'Add' : 'जोड़ें';
        if (modId === 'attendance') label = language === 'en' ? 'Bulk Punch' : 'बल्क पंच';
        if (modId === 'payroll') label = language === 'en' ? 'Calculate' : 'गणना';
        if (modId === 'leaves') label = language === 'en' ? 'Add Holiday' : 'अवकाश जोड़ें';
        return { id: 'add', label };
      }
    }
    if (colIndex === 2) {
      if (['employees', 'attendance', 'payroll', 'leaves', 'admin'].includes(modId)) {
        let label = language === 'en' ? 'Edit' : 'संशोधित';
        if (modId === 'attendance') label = language === 'en' ? 'Adjust Log' : 'एडजस्ट';
        if (modId === 'payroll') label = language === 'en' ? 'Adjust' : 'संयोजन';
        if (modId === 'leaves') label = language === 'en' ? 'Edit Holiday' : 'अवकाश बदलें';
        return { id: 'edit', label };
      }
    }
    if (colIndex === 3) {
      if (['employees', 'attendance', 'payroll', 'leaves'].includes(modId)) {
        let id = 'delete';
        let label = language === 'en' ? 'Delete' : 'हटाएं';
        if (modId === 'employees') label = language === 'en' ? 'Deactivate' : 'निष्क्रिय करें';
        if (modId === 'attendance') { id = 'approve'; label = language === 'en' ? 'Approve' : 'स्वीकृत करें'; }
        if (modId === 'payroll') label = language === 'en' ? 'Mark Paid' : 'भुगतान चिह्नित';
        if (modId === 'leaves') label = language === 'en' ? 'Delete Holiday' : 'अवकाश हटाएं';
        return { id, label };
      }
    }
    return null;
  };

  const handleToggleFineGrainedPermission = (role: string, modId: string, actionId: string) => {
    const updatedPermissions = { ...rolePermissions };
    const currentList = [...(updatedPermissions[role] || [])];
    const permKey = `${modId}:${actionId}`;

    let listWithFineGrained = [...currentList];
    
    const parentModuleInList = currentList.includes(modId);
    if (parentModuleInList) {
      listWithFineGrained = currentList.filter(p => p !== modId);
      [0, 1, 2, 3].forEach(colIndex => {
        const act = getActionForColumn(modId, colIndex);
        if (act) {
          const key = `${modId}:${act.id}`;
          if (!listWithFineGrained.includes(key)) {
            listWithFineGrained.push(key);
          }
        }
      });
    }

    if (listWithFineGrained.includes(permKey)) {
      listWithFineGrained = listWithFineGrained.filter(p => p !== permKey);
    } else {
      listWithFineGrained.push(permKey);
    }

    updatedPermissions[role] = listWithFineGrained;
    setLocalSettings({
      ...localSettings,
      rolePermissions: updatedPermissions
    });
  };

  const isPermissionChecked = (role: string, modId: string, actionId: string) => {
    const list = rolePermissions[role] || [];
    return list.includes(`${modId}:${actionId}`) || list.includes(modId);
  };

  const handleAddRoleAccount = () => {
    if (!newAccName.trim() || !newAccUsername.trim() || !newAccPassword.trim()) {
      setRoleFormError(language === 'en' ? 'Please fill in all fields' : 'कृपया सभी फ़ील्ड भरें');
      return;
    }
    
    // Check if username already exists
    const exists = roleAccounts.some(acc => acc.username.toLowerCase() === newAccUsername.trim().toLowerCase());
    if (exists || newAccUsername.trim().toLowerCase() === (localSettings.adminUsername || 'admin').toLowerCase()) {
      setRoleFormError(language === 'en' ? 'Username already exists' : 'उपयोगकर्ता नाम पहले से मौजूद है');
      return;
    }

    const newAcc: UserRoleAccount = {
      id: 'acc-' + Date.now(),
      name: newAccName.trim(),
      username: newAccUsername.trim(),
      password: newAccPassword.trim(),
      email: newAccEmail.trim() || undefined,
      mobileNo: newAccMobileNo.trim() || undefined,
      role: newAccRole,
      branch: (newAccRole === 'branch_manager' || newAccRole === 'director' || newAccRole === 'sub_admin') && newAccBranches.length > 0 ? newAccBranches[0] : undefined,
      branches: (newAccRole === 'branch_manager' || newAccRole === 'director' || newAccRole === 'sub_admin') ? newAccBranches : undefined,
      createdAt: new Date().toISOString()
    };

    setLocalSettings({
      ...localSettings,
      roleAccounts: [...roleAccounts, newAcc]
    });

    // Reset form
    setNewAccName('');
    setNewAccUsername('');
    setNewAccPassword('');
    setNewAccEmail('');
    setNewAccMobileNo('');
    setNewAccRole('hr');
    setNewAccBranch('');
    setNewAccBranches([]);
    setRoleFormError('');
  };

  const handleDeleteRoleAccount = (id: string) => {
    setLocalSettings({
      ...localSettings,
      roleAccounts: roleAccounts.filter(acc => acc.id !== id)
    });
  };

  const handleUpdateAccountPassword = (accountId: string, newPass: string) => {
    if (!newPass.trim()) return;
    const updatedAccounts = roleAccounts.map(acc => {
      if (acc.id === accountId) {
        return { ...acc, password: newPass.trim() };
      }
      return acc;
    });
    setLocalSettings({
      ...localSettings,
      roleAccounts: updatedAccounts
    });
    setEditingAccountId(null);
    setEditingAccountPassword('');
  };

  const handleResetSmtpToDefaults = () => {
    setLocalSettings({
      ...localSettings,
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpUsername: 'misrpr@rathibuildmart.com',
      smtpPassword: '',
      senderName: 'Rathi LMS System',
      senderEmail: 'rbmlms@rathibuildmart.com'
    });
  };

  const handleTestSmtp = async () => {
    if (!testRecipient.trim()) {
      alert(language === 'en' ? "Please enter a valid recipient email address!" : "कृपया एक मान्य प्राप्तकर्ता ईमेल पता दर्ज करें!");
      return;
    }
    
    setIsTestingSmtp(true);
    setTestResult(null);
    
    try {
      const response = await fetch('/api/test-smtp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipient: testRecipient.trim(),
          smtpHost: localSettings.smtpHost || '',
          smtpPort: Number(localSettings.smtpPort || 587),
          smtpUsername: localSettings.smtpUsername || '',
          smtpPassword: localSettings.smtpPassword || '',
          senderName: localSettings.senderName || '',
          senderEmail: localSettings.senderEmail || '',
          language
        })
      });
      
      const resData = await response.json();
      if (resData.success) {
        setTestResult({
          success: true,
          message: language === 'en' 
            ? `Live SMTP Dispatch Success! A secure test verification email has been successfully delivered to ${testRecipient.trim()} via ${localSettings.smtpHost}.`
            : `लाइव SMTP प्रेषण सफल! ${localSettings.smtpHost} के माध्यम से ${testRecipient.trim()} को एक सुरक्षित परीक्षण सत्यापन ईमेल सफलतापूर्वक भेजा गया है।`
        });
      } else {
        setTestResult({
          success: false,
          message: resData.error || (language === 'en' ? "SMTP dispatch failed. Please verify credentials." : "SMTP प्रेषण विफल। कृपया क्रेडेंशियल सत्यापित करें।")
        });
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.message || (language === 'en' ? "Connection timed out or network error." : "कनेक्शन का समय समाप्त या नेटवर्क त्रुटि।")
      });
    } finally {
      setIsTestingSmtp(false);
    }
  };

  const handleSave = () => {
    onSaveSettings(localSettings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  const handleResetToDefault = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 5000);
      return;
    }
    setLocalSettings(INITIAL_ADMIN_SETTINGS);
    onSaveSettings(INITIAL_ADMIN_SETTINGS);
    setSaveSuccess(true);
    setConfirmReset(false);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  const filteredFields = localSettings.fields.filter(f => {
    if (filterGroup === 'all') return true;
    return f.group === filterGroup;
  });

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden" id="admin-settings-container">
      {/* Admin Title Banner */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-950 text-white p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#03623c] rounded-lg text-white">
            <SettingsIcon className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <h2 className="text-base font-bold font-display tracking-tight text-white">{t.adminTitle}</h2>
            <p className="text-[11px] text-slate-300 font-medium">{t.adminSub}</p>
          </div>
        </div>
      </div>

      {/* Save Alert Banner */}
      {saveSuccess && (
        <div className="bg-emerald-50 border-y border-emerald-200 text-emerald-800 px-5 py-3 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{t.savedAlert}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row min-h-[500px]">
        {/* Left Sub-Tabs Nav */}
        <aside className="w-full md:w-56 border-r border-gray-100 bg-slate-50/60 p-4 shrink-0 flex flex-row md:flex-col gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('company')}
            className={`flex items-center md:items-start gap-2.5 px-3 py-2 text-xs font-bold rounded-md transition-all text-left whitespace-nowrap md:whitespace-normal cursor-pointer ${
              activeSubTab === 'company'
                ? 'bg-slate-200 text-slate-900 shadow-xs border border-slate-300/40'
                : 'text-gray-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Building className="w-3.5 h-3.5 shrink-0 md:mt-0.5" />
            <span>{t.tabCompany}</span>
          </button>
          
          <button
            onClick={() => setActiveSubTab('fields')}
            className={`flex items-center md:items-start gap-2.5 px-3 py-2 text-xs font-bold rounded-md transition-all text-left whitespace-nowrap md:whitespace-normal cursor-pointer ${
              activeSubTab === 'fields'
                ? 'bg-slate-200 text-slate-900 shadow-xs border border-slate-300/40'
                : 'text-gray-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <ToggleLeft className="w-3.5 h-3.5 shrink-0 md:mt-0.5" />
            <span>{t.tabFields}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('masters')}
            className={`flex items-center md:items-start gap-2.5 px-3 py-2 text-xs font-bold rounded-md transition-all text-left whitespace-nowrap md:whitespace-normal cursor-pointer ${
              activeSubTab === 'masters'
                ? 'bg-slate-200 text-slate-900 shadow-xs border border-slate-300/40'
                : 'text-gray-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <List className="w-3.5 h-3.5 shrink-0 md:mt-0.5" />
            <span>{t.tabMasters}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('policy')}
            className={`flex items-center md:items-start gap-2.5 px-3 py-2 text-xs font-bold rounded-md transition-all text-left whitespace-nowrap md:whitespace-normal cursor-pointer ${
              activeSubTab === 'policy'
                ? 'bg-slate-200 text-slate-900 shadow-xs border border-slate-300/40'
                : 'text-gray-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <SettingsIcon className="w-3.5 h-3.5 shrink-0 md:mt-0.5" />
            <span>{t.tabPolicy}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('security')}
            className={`flex items-center md:items-start gap-2.5 px-3 py-2 text-xs font-bold rounded-md transition-all text-left whitespace-nowrap md:whitespace-normal cursor-pointer relative ${
              activeSubTab === 'security'
                ? 'bg-slate-200 text-slate-900 shadow-xs border border-slate-300/40'
                : 'text-gray-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <ShieldAlert className={`w-3.5 h-3.5 shrink-0 md:mt-0.5 ${failedLogins.length > 0 ? 'text-amber-500 animate-pulse' : ''}`} />
            <span>{t.tabSecurity}</span>
            {failedLogins.length > 0 && (
              <span className="absolute top-1.5 right-1.5 md:relative md:top-0 md:right-0 md:ml-auto bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none">
                {failedLogins.length}
              </span>
            )}
          </button>



          <button
            onClick={() => setActiveSubTab('database')}
            className={`flex items-center md:items-start gap-2.5 px-3 py-2 text-xs font-bold rounded-md transition-all text-left whitespace-nowrap md:whitespace-normal cursor-pointer relative ${
              activeSubTab === 'database'
                ? 'bg-slate-200 text-slate-900 shadow-xs border border-slate-300/40'
                : 'text-gray-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5 shrink-0 md:mt-0.5" />
            <span>{t.tabDatabase}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('email_smtp')}
            className={`flex items-center md:items-start gap-2.5 px-3 py-2 text-xs font-bold rounded-md transition-all text-left whitespace-nowrap md:whitespace-normal cursor-pointer relative ${
              activeSubTab === 'email_smtp'
                ? 'bg-slate-200 text-slate-900 shadow-xs border border-slate-300/40'
                : 'text-gray-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Mail className="w-3.5 h-3.5 shrink-0 md:mt-0.5" />
            <span>{(t as any).tabEmailSmtp}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('roles_permissions')}
            className={`flex items-center md:items-start gap-2.5 px-3 py-2 text-xs font-bold rounded-md transition-all text-left whitespace-nowrap md:whitespace-normal cursor-pointer relative ${
              activeSubTab === 'roles_permissions'
                ? 'bg-slate-200 text-slate-900 shadow-xs border border-slate-300/40'
                : 'text-gray-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 shrink-0 md:mt-0.5" />
            <span>{language === 'en' ? 'User Roles & Access' : 'भूमिकाएं और अनुमतियां'}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('audit_logs')}
            className={`flex items-center md:items-start gap-2.5 px-3 py-2 text-xs font-bold rounded-md transition-all text-left whitespace-nowrap md:whitespace-normal cursor-pointer relative ${
              activeSubTab === 'audit_logs'
                ? 'bg-slate-200 text-slate-900 shadow-xs border border-slate-300/40'
                : 'text-gray-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5 shrink-0 md:mt-0.5" />
            <span>{language === 'en' ? 'User Audit Report' : 'यूजर ऑडिट रिपोर्ट'}</span>
          </button>

          <div className="hidden md:block pt-6 mt-6 border-t border-gray-200/60">
            <button
              onClick={handleResetToDefault}
              className={`flex items-center gap-1.5 w-full text-left px-3 py-1.5 text-[10px] font-bold rounded transition-all cursor-pointer ${
                confirmReset 
                  ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                  : 'text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-700 border border-red-200/50'
              }`}
            >
              <Undo className="w-3 h-3" />
              {confirmReset ? (language === 'en' ? "Confirm Reset!" : "पुष्टि करें!") : t.resetDefault}
            </button>
          </div>
        </aside>

        {/* Right Content Sheet */}
        <div className="flex-1 p-5 md:p-6">
          
          {/* Sub Tab: Company Profile */}
          {activeSubTab === 'company' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">{t.compName}</label>
                <input 
                  type="text" 
                  value={localSettings.companyName}
                  onChange={(e) => setLocalSettings({...localSettings, companyName: e.target.value})}
                  className="w-full border border-gray-200 px-3 py-1.5 rounded text-xs font-semibold focus:ring-1 focus:ring-[#03623c] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">{t.compAddress}</label>
                <textarea 
                  rows={3}
                  value={localSettings.companyAddress}
                  onChange={(e) => setLocalSettings({...localSettings, companyAddress: e.target.value})}
                  className="w-full border border-gray-200 px-3 py-1.5 rounded text-xs font-semibold focus:ring-1 focus:ring-[#03623c] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">{t.currencySymbol}</label>
                  <input 
                    type="text" 
                    value={localSettings.currency}
                    onChange={(e) => setLocalSettings({...localSettings, currency: e.target.value})}
                    className="w-full border border-gray-200 px-3 py-1.5 rounded text-xs font-semibold focus:ring-1 focus:ring-[#03623c] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">{t.logoUrl}</label>
                  <input 
                    type="text" 
                    placeholder="https://example.com/logo.png"
                    value={localSettings.companyLogo || ''}
                    onChange={(e) => setLocalSettings({...localSettings, companyLogo: e.target.value})}
                    className="w-full border border-gray-200 px-3 py-1.5 rounded text-xs font-semibold focus:ring-1 focus:ring-[#03623c] focus:outline-none"
                  />
                </div>
              </div>

              {/* Admin login credentials card */}
              <div className="border-t border-dashed border-gray-200 pt-4 mt-4 space-y-4">
                <h4 className="text-xs font-black text-[#03623c] uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  Admin Login Credentials (एडमिन क्रेडेंशियल्स)
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Admin Username (लॉगिन आईडी)</label>
                    <input 
                      type="text" 
                      value={localSettings.adminUsername || 'admin'}
                      onChange={(e) => setLocalSettings({...localSettings, adminUsername: e.target.value})}
                      className="w-full border border-gray-200 px-3 py-1.5 rounded text-xs font-semibold focus:ring-1 focus:ring-[#03623c] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Admin Password (पासवर्ड)</label>
                    <input 
                      type="text" 
                      value={localSettings.adminPassword || 'admin123'}
                      onChange={(e) => setLocalSettings({...localSettings, adminPassword: e.target.value})}
                      className="w-full border border-gray-200 px-3 py-1.5 rounded text-xs font-semibold focus:ring-1 focus:ring-[#03623c] focus:outline-none"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 font-medium">Use these credentials on the portal login screen to sign in as the System Administrator.</p>
              </div>
            </div>
          )}

          {/* Sub Tab: Form Fields configuration */}
          {activeSubTab === 'fields' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded p-3 text-[11px] text-amber-800 leading-relaxed font-semibold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p>{t.mandatoryNote}</p>
                  <p className="mt-1 text-slate-500 font-medium">Core properties (Employee ID, Name, Department, Designation, Joining Date, Basic Salary) are always visible and system-mandated.</p>
                </div>
              </div>

              {/* Group Category Filters */}
              <div className="flex flex-wrap gap-1.5 border-b border-gray-100 pb-3">
                {[
                  { id: 'all', label: t.groupAll },
                  { id: 'detail', label: t.groupDetail },
                  { id: 'residential', label: t.groupResidential },
                  { id: 'permanent', label: t.groupPermanent },
                  { id: 'bank', label: t.groupBank },
                  { id: 'other', label: t.groupOther },
                  { id: 'employment', label: t.groupEmployment }
                ].map(grp => (
                  <button
                    key={grp.id}
                    onClick={() => setFilterGroup(grp.id)}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-full border cursor-pointer transition-colors ${
                      filterGroup === grp.id
                        ? 'bg-[#03623c] text-white border-[#03623c]'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border-gray-200'
                    }`}
                  >
                    {grp.label}
                  </button>
                ))}
              </div>

              {/* Field settings table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white max-h-[500px] overflow-y-auto shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-gray-200 sticky top-0">
                    <tr>
                      <th className="py-2.5 px-4">{t.fieldColName}</th>
                      <th className="py-2.5 px-4">{t.fieldColGroup}</th>
                      <th className="py-2.5 px-4 text-center w-28">{t.fieldColHidden}</th>
                      <th className="py-2.5 px-4 text-center w-28">{t.fieldColMandatory}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredFields.map(f => {
                      const groupLabels: Record<string, string> = {
                        detail: t.groupDetail,
                        residential: t.groupResidential,
                        permanent: t.groupPermanent,
                        bank: t.groupBank,
                        other: t.groupOther,
                        employment: t.groupEmployment
                      };

                      return (
                        <tr key={f.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-2 px-4 font-bold text-gray-800">{f.label}</td>
                          <td className="py-2 px-4 text-gray-500 font-medium">{groupLabels[f.group]}</td>
                          
                          {/* Hide Toggle */}
                          <td className="py-2 px-4 text-center">
                            <button
                              onClick={() => handleFieldToggle(f.id, 'isHidden')}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-extrabold cursor-pointer transition-colors border shadow-2xs ${
                                f.isHidden
                                  ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              }`}
                              title={t.toggleVisibility}
                            >
                              {f.isHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              {f.isHidden ? t.hidden : t.visible}
                            </button>
                          </td>

                          {/* Required Toggle */}
                          <td className="py-2 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleFieldToggle(f.id, 'isMandatory')}
                              disabled={f.isHidden}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-extrabold cursor-pointer transition-colors border shadow-2xs ${
                                f.isHidden
                                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                  : f.isMandatory
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                              }`}
                              title={f.isHidden ? "Hidden fields cannot be mandatory" : t.toggleMandatory}
                            >
                              {f.isMandatory ? <Lock className="w-3 h-3" /> : null}
                              {f.isMandatory ? (language === 'en' ? 'Required' : 'अनिवार्य') : (language === 'en' ? 'Optional' : 'वैकल्पिक')}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub Tab: Dropdown Masters Dynamic Management */}
          {activeSubTab === 'masters' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">{t.masterSelect}</label>
                <select
                  value={activeMasterList}
                  onChange={(e) => setActiveMasterList(e.target.value as any)}
                  className="w-full border border-gray-200 px-3 py-2 rounded text-xs font-semibold bg-white cursor-pointer focus:ring-1 focus:ring-[#03623c] focus:outline-none"
                >
                  <option value="departments">{t.listDept}</option>
                  <option value="branches">{t.listBranches}</option>
                  <option value="costCenters">{t.listCost}</option>
                  <option value="employeeGroups">{t.listGroups}</option>
                  <option value="workTimings">{t.listTimings}</option>
                  <option value="weeklyOffProfiles">{t.listWeeklyOff}</option>
                  <option value="leaveTypes">{t.listLeaves}</option>
                </select>
              </div>

              {/* Master options listing */}
              <div className="border border-gray-200 rounded-lg p-4 bg-slate-50/50 space-y-3.5 shadow-2xs">
                {activeMasterList === 'workTimings' ? (
                  <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3 shadow-3xs">
                    <div className="font-extrabold text-[11px] text-[#03623c] uppercase tracking-wider">
                      {language === 'en' ? 'Shift Timing Builder' : 'शिफ्ट समय निर्माता'}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                          {language === 'en' ? 'Shift Name' : 'शिफ्ट का नाम'}
                        </label>
                        <input
                          type="text"
                          value={shiftName}
                          placeholder={language === 'en' ? "e.g. General Shift, Night Shift" : "जैसे सामान्य शिफ्ट"}
                          onChange={(e) => setShiftName(e.target.value)}
                          className="w-full border border-gray-200 px-3 py-1.5 rounded-lg text-xs bg-white focus:ring-1 focus:ring-[#03623c] focus:outline-none font-semibold text-gray-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                          {language === 'en' ? 'Check-In Time' : 'आगमन समय'}
                        </label>
                        <input
                          type="time"
                          value={shiftStart}
                          onChange={(e) => setShiftStart(e.target.value)}
                          className="w-full border border-gray-200 px-3 py-1.5 rounded-lg text-xs bg-white focus:ring-1 focus:ring-[#03623c] focus:outline-none font-semibold text-gray-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                          {language === 'en' ? 'Check-Out Time' : 'प्रस्थान समय'}
                        </label>
                        <input
                          type="time"
                          value={shiftEnd}
                          onChange={(e) => setShiftEnd(e.target.value)}
                          className="w-full border border-gray-200 px-3 py-1.5 rounded-lg text-xs bg-white focus:ring-1 focus:ring-[#03623c] focus:outline-none font-semibold text-gray-800"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-gray-100">
                      <div className="text-[11px] text-gray-500 font-semibold">
                        <span>{language === 'en' ? 'Compiled Preview:' : 'संकलित पूर्वावलोकन:'} </span>
                        <code className="bg-[#03623c]/5 px-2 py-0.5 rounded font-mono font-bold text-[#03623c] text-xs">
                          {shiftName.trim() || 'Shift'} ({formatTo12Hour(shiftStart)} - {formatTo12Hour(shiftEnd)})
                        </code>
                      </div>
                      <button
                        onClick={handleAddMasterItem}
                        className="bg-[#03623c] hover:bg-[#024d2e] text-white px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-3xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {language === 'en' ? 'Add Shift' : 'शिफ्ट जोड़ें'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMasterVal}
                      placeholder={t.masterPlaceholder}
                      onChange={(e) => setNewMasterVal(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddMasterItem()}
                      className="flex-1 border border-gray-200 px-3 py-1.5 rounded text-xs bg-white focus:ring-1 focus:ring-[#03623c] focus:outline-none"
                    />
                    <button
                      onClick={handleAddMasterItem}
                      className="bg-[#03623c] hover:bg-[#024d2e] text-white px-3 py-1.5 rounded text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {t.masterAdd}
                    </button>
                  </div>
                )}

                <div className="bg-white rounded border border-gray-100 max-h-[250px] overflow-y-auto divide-y divide-gray-100">
                  {((localSettings[activeMasterList] as string[]) || []).length === 0 ? (
                    <p className="p-4 text-center text-xs text-gray-400 font-semibold">{t.noOptions}</p>
                  ) : (
                    ((localSettings[activeMasterList] as string[]) || []).map((item, index) => (
                      <div key={index} className="flex items-center justify-between py-2 px-3 hover:bg-slate-50 transition-colors">
                        <span className="text-xs font-bold text-gray-800">{item}</span>
                        <button
                          onClick={() => handleRemoveMasterItem(item)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Sub Tab: Policy and Payroll Default Rules */}
          {activeSubTab === 'policy' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-gray-800 border-b border-gray-100 pb-2 flex items-center gap-1.5">
                <SettingsIcon className="w-4 h-4 text-[#03623c]" />
                {t.policyTitle}
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">{t.checkIn}</label>
                  <input 
                    type="time" 
                    value={localSettings.defaultCheckIn}
                    onChange={(e) => setLocalSettings({...localSettings, defaultCheckIn: e.target.value})}
                    className="w-full border border-gray-200 px-3 py-1.5 rounded text-xs font-semibold focus:ring-1 focus:ring-[#03623c] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">{t.checkOut}</label>
                  <input 
                    type="time" 
                    value={localSettings.defaultCheckOut}
                    onChange={(e) => setLocalSettings({...localSettings, defaultCheckOut: e.target.value})}
                    className="w-full border border-gray-200 px-3 py-1.5 rounded text-xs font-semibold focus:ring-1 focus:ring-[#03623c] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">{t.overtimeRate}</label>
                  <input 
                    type="number" 
                    value={localSettings.defaultOvertimeRate}
                    onChange={(e) => setLocalSettings({...localSettings, defaultOvertimeRate: Number(e.target.value) || 0})}
                    className="w-full border border-gray-200 px-3 py-1.5 rounded text-xs font-semibold focus:ring-1 focus:ring-[#03623c] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">{t.pfRate}</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={localSettings.pfContributionRate}
                    onChange={(e) => setLocalSettings({...localSettings, pfContributionRate: Number(e.target.value) || 0})}
                    className="w-full border border-gray-200 px-3 py-1.5 rounded text-xs font-semibold focus:ring-1 focus:ring-[#03623c] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">{t.esicRate}</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={localSettings.esicContributionRate}
                    onChange={(e) => setLocalSettings({...localSettings, esicContributionRate: Number(e.target.value) || 0})}
                    className="w-full border border-gray-200 px-3 py-1.5 rounded text-xs font-semibold focus:ring-1 focus:ring-[#03623c] focus:outline-none"
                  />
                </div>
              </div>

              {/* Allowance & Deduction Toggles */}
              <div className="border-t border-gray-100 pt-4 mt-4">
                <h4 className="text-xs font-bold text-gray-800 mb-1">{t.allowancesCalcTitle}</h4>
                <p className="text-[10px] text-gray-500 mb-3">{t.toggleCalcSub}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center gap-3 p-3 bg-gray-50/40 hover:bg-gray-55/60 rounded-lg border border-gray-100 cursor-pointer transition-colors">
                    <input 
                      type="checkbox"
                      checked={localSettings.enableHra !== false}
                      onChange={(e) => setLocalSettings({...localSettings, enableHra: e.target.checked})}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                    />
                    <div>
                      <span className="block text-xs font-bold text-gray-800">{t.enableHraLabel}</span>
                      <span className="text-[10px] text-gray-400 font-medium">HRA (मकान किराया)</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-gray-50/40 hover:bg-gray-55/60 rounded-lg border border-gray-100 cursor-pointer transition-colors">
                    <input 
                      type="checkbox"
                      checked={localSettings.enableDa !== false}
                      onChange={(e) => setLocalSettings({...localSettings, enableDa: e.target.checked})}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                    />
                    <div>
                      <span className="block text-xs font-bold text-gray-800">{t.enableDaLabel}</span>
                      <span className="text-[10px] text-gray-400 font-medium">Dearness (DA भत्ता)</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-gray-50/40 hover:bg-gray-55/60 rounded-lg border border-gray-100 cursor-pointer transition-colors">
                    <input 
                      type="checkbox"
                      checked={localSettings.enableConveyance !== false}
                      onChange={(e) => setLocalSettings({...localSettings, enableConveyance: e.target.checked})}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                    />
                    <div>
                      <span className="block text-xs font-bold text-gray-800">{t.enableConveyanceLabel}</span>
                      <span className="text-[10px] text-gray-400 font-medium">Conveyance (यातायात)</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-gray-50/40 hover:bg-gray-55/60 rounded-lg border border-gray-100 cursor-pointer transition-colors">
                    <input 
                      type="checkbox"
                      checked={localSettings.enableProfessionalTax !== false}
                      onChange={(e) => setLocalSettings({...localSettings, enableProfessionalTax: e.target.checked})}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                    />
                    <div>
                      <span className="block text-xs font-bold text-gray-800">{t.enableProfessionalTaxLabel}</span>
                      <span className="text-[10px] text-gray-400 font-medium">Professional Tax (PT)</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-gray-50/40 hover:bg-gray-55/60 rounded-lg border border-gray-100 cursor-pointer transition-colors">
                    <input 
                      type="checkbox"
                      checked={localSettings.enablePaidLeaveCalculation !== false}
                      onChange={(e) => setLocalSettings({...localSettings, enablePaidLeaveCalculation: e.target.checked})}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                    />
                    <div>
                      <span className="block text-xs font-bold text-gray-800">{t.enablePaidLeaveLabel}</span>
                      <span className="text-[10px] text-gray-400 font-medium">Paid Leave (PL)</span>
                    </div>
                  </label>
                </div>
              </div>

              {localSettings.enablePaidLeaveCalculation !== false && (
                <div className="border-t border-gray-100 pt-4 mt-4 bg-emerald-50/20 p-3 rounded-lg border border-emerald-100/50">
                  <h4 className="text-xs font-bold text-emerald-900 mb-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block"></span>
                    {language === 'en' ? "Paid Leave Policy Settings" : "सवैतनिक अवकाश नीति सेटिंग्स"}
                  </h4>
                  <div className="mt-3 max-w-md">
                    <label className="block text-xs font-bold text-gray-700 mb-1">{t.paidLeaveStartAfterLabel}</label>
                    <select
                      value={localSettings.paidLeaveStartAfterMonths || 0}
                      onChange={(e) => setLocalSettings({...localSettings, paidLeaveStartAfterMonths: Number(e.target.value) || 0})}
                      className="w-full border border-gray-200 px-3 py-1.5 rounded text-xs font-semibold focus:ring-1 focus:ring-[#03623c] focus:outline-none bg-white"
                    >
                      <option value={0}>{t.paidLeaveStartImmediately}</option>
                      <option value={1}>{language === 'en' ? "After 1 Month of Service" : "1 महीने की सेवा के बाद"}</option>
                      <option value={2}>{language === 'en' ? "After 2 Months of Service" : "2 महीने की सेवा के बाद"}</option>
                      <option value={3}>{language === 'en' ? "After 3 Months (Standard Probation)" : "3 महीने बाद (मानक परिवीक्षा)"}</option>
                      <option value={6}>{language === 'en' ? "After 6 Months of Service" : "6 महीने की सेवा के बाद"}</option>
                      <option value={12}>{language === 'en' ? "After 1 Year of Service" : "1 वर्ष की सेवा के बाद"}</option>
                    </select>
                    <p className="text-[10px] text-gray-400 font-medium mt-1">
                      {language === 'en' 
                        ? "Paid Leave (Earned Leave) will only be credited/applicable if employee's tenure (joining date) meets this waiting period."
                        : "सवैतनिक अवकाश (अर्जित अवकाश) केवल तभी लागू/जमा होगा जब कर्मचारी का कार्यकाल (शामिल होने की तिथि) इस प्रतीक्षा अवधि को पूरा करता है।"}
                    </p>
                  </div>
                </div>
              )}

              {/* Employee Portal Access Configuration */}
              <div className="border-t border-gray-100 pt-4 mt-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full inline-block"></span>
                  {t.employeePortalSettingsTitle}
                </h4>
                <p className="text-[10px] text-gray-400 font-medium mb-3">
                  {language === 'en' 
                    ? "Configure feature visibility and permissions for logged-in employees."
                    : "लॉग इन किए गए कर्मचारियों के लिए फीचर दृश्यता और अनुमतियों को कॉन्फ़िगर करें।"}
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <label className="flex items-center gap-3 p-3 bg-white hover:bg-slate-50 rounded-lg border border-gray-150 cursor-pointer transition-colors shadow-2xs">
                    <input 
                      type="checkbox"
                      checked={localSettings.enableEmployeePayslips === true}
                      onChange={(e) => setLocalSettings({...localSettings, enableEmployeePayslips: e.target.checked})}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded cursor-pointer"
                    />
                    <div>
                      <span className="block text-xs font-bold text-gray-800">{t.enableEmployeePayslipsLabel}</span>
                      <span className="text-[9px] text-slate-400 font-medium block mt-0.5">
                        {language === 'en'
                          ? "Currently: " + (localSettings.enableEmployeePayslips ? "ON" : "OFF (Deactivated for Employees)")
                          : "वर्तमान स्थिति: " + (localSettings.enableEmployeePayslips ? "सक्रिय (ON)" : "निष्क्रिय (OFF - कर्मचारियों के लिए बंद)")}
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-white hover:bg-slate-50 rounded-lg border border-gray-150 cursor-pointer transition-colors shadow-2xs">
                    <input 
                      type="checkbox"
                      checked={localSettings.enableMobileAttendance !== false}
                      onChange={(e) => setLocalSettings({...localSettings, enableMobileAttendance: e.target.checked})}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded cursor-pointer"
                    />
                    <div>
                      <span className="block text-xs font-bold text-gray-800">
                        {language === 'en' ? "Enable Mobile Attendance & Punching" : "कर्मचारी मोबाइल स्व-उपस्थिति सक्षम करें"}
                      </span>
                      <span className="text-[9px] text-slate-400 font-medium block mt-0.5">
                        {language === 'en'
                          ? "Currently: " + (localSettings.enableMobileAttendance !== false ? "ON" : "OFF (Disabled for Employees)")
                          : "वर्तमान स्थिति: " + (localSettings.enableMobileAttendance !== false ? "सक्रिय (ON)" : "निष्क्रिय (OFF - बंद)")}
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-white hover:bg-slate-50 rounded-lg border border-gray-150 cursor-pointer transition-colors shadow-2xs col-span-1 sm:col-span-2 lg:col-span-1">
                    <input 
                      type="checkbox"
                      checked={localSettings.enablePasswordLoginOtp === true}
                      onChange={(e) => setLocalSettings({...localSettings, enablePasswordLoginOtp: e.target.checked})}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded cursor-pointer"
                    />
                    <div>
                      <span className="block text-xs font-bold text-gray-800">
                        {language === 'en' ? "2FA Password Login OTP" : "पासवर्ड लॉगिन पर 2FA ओटीपी"}
                      </span>
                      <span className="text-[9px] text-slate-400 font-medium block mt-0.5">
                        {language === 'en'
                          ? "Currently: " + (localSettings.enablePasswordLoginOtp ? "ON (Mandatory OTP)" : "OFF (Password Only)")
                          : "वर्तमान स्थिति: " + (localSettings.enablePasswordLoginOtp ? "चालू (ओटीपी जरूरी)" : "बंद (केवल पासवर्ड)")}
                      </span>
                    </div>
                  </label>
                </div>

                {/* Secure GPS Geofencing Configuration */}
                <div className="border-t border-gray-200/60 pt-4 mt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-emerald-600" />
                        {language === 'en' ? "Secure Mobile Geofencing & Location Lock" : "सुरक्षित मोबाइल जियोफेंसिंग और लोकेशन लॉक"}
                      </h5>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                        {language === 'en' 
                          ? "Restrict employee attendance marking to designated office branches or outlet geofences."
                          : "कर्मचारी उपस्थिति दर्ज करने की प्रक्रिया को केवल नामित कार्यालय शाखाओं या आउटलेट जियोफेंस तक सीमित करें।"}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={localSettings.enableGeofencing === true}
                        onChange={(e) => setLocalSettings({...localSettings, enableGeofencing: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                      <span className="ml-2 text-xs font-bold text-slate-700">
                        {localSettings.enableGeofencing ? (language === 'en' ? "ACTIVE" : "सक्रिय") : (language === 'en' ? "INACTIVE" : "निष्क्रिय")}
                      </span>
                    </label>
                  </div>

                  {localSettings.enableGeofencing && (
                    <div className="mt-4 bg-white border border-slate-200 rounded-lg p-4 space-y-4 shadow-2xs">
                      {/* Register New Branch Form */}
                      <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-150">
                        <span className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2.5">
                          {language === 'en' ? "Register Secure Branch Geofence" : "नया सुरक्षित जियोफेंस शाखा पंजीकृत करें"}
                        </span>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">
                              {language === 'en' ? "Branch Name" : "शाखा का नाम"}
                            </label>
                            <div className="space-y-1.5">
                              <select
                                value={(localSettings.branches || []).includes(newOutletName) ? newOutletName : (newOutletName === '' ? '' : 'custom')}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === 'custom') {
                                    setNewOutletName('');
                                  } else {
                                    setNewOutletName(val);
                                  }
                                }}
                                className="w-full bg-white border border-slate-200 px-3 py-1.5 rounded text-xs font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                              >
                                <option value="">{language === 'en' ? "-- Select Registered Branch --" : "-- पंजीकृत शाखा चुनें --"}</option>
                                {(localSettings.branches || []).map((b) => (
                                  <option key={b} value={b}>{b}</option>
                                ))}
                                <option value="custom">{language === 'en' ? "Other / Custom Branch..." : "अन्य / कस्टम शाखा..."}</option>
                              </select>
                              
                              {(!localSettings.branches || localSettings.branches.length === 0 || !(localSettings.branches || []).includes(newOutletName)) && (
                                <input 
                                  type="text"
                                  value={newOutletName}
                                  onChange={(e) => setNewOutletName(e.target.value)}
                                  placeholder={language === 'en' ? "Type branch name manually..." : "शाखा का नाम टाइप करें..."}
                                  className="w-full bg-white border border-slate-200 px-3 py-1.5 rounded text-xs font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                                />
                              )}
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">
                              {language === 'en' ? "Geofence Radius (Meters)" : "अनुमत जियोफेंस दायरा (मीटर)"}
                            </label>
                            <select
                              value={newOutletRadius}
                              onChange={(e) => setNewOutletRadius(Number(e.target.value) || 100)}
                              className="w-full bg-white border border-slate-200 px-3 py-1.5 rounded text-xs font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                            >
                              <option value={50}>50 {language === 'en' ? "Meters (High Security / Inside Office Only)" : "मीटर (उच्च सुरक्षा - केवल ऑफिस के अंदर)"}</option>
                              <option value={100}>100 {language === 'en' ? "Meters (Recommended Office Standard)" : "मीटर (अनुशंसित मानक)"}</option>
                              <option value={200}>200 {language === 'en' ? "Meters (Large Facility / Compound)" : "मीटर (बड़ा परिसर/फैक्ट्री)"}</option>
                              <option value={500}>500 {language === 'en' ? "Meters (Wider Area Boundary)" : "मीटर (विस्तृत क्षेत्र)"}</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">
                              {language === 'en' ? "Latitude (e.g., 21.2514)" : "अक्षांश (Latitude - जैसे, 21.2514)"}
                            </label>
                            <input 
                              type="text"
                              value={newOutletLat}
                              onChange={(e) => setNewOutletLat(e.target.value)}
                              placeholder="e.g. 21.251412"
                              className="w-full bg-white border border-slate-200 px-3 py-1.5 rounded text-xs font-mono font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">
                              {language === 'en' ? "Longitude (e.g., 81.6296)" : "देशांतर (Longitude - जैसे, 81.6296)"}
                            </label>
                            <div className="flex gap-2">
                              <input 
                                type="text"
                                value={newOutletLng}
                                onChange={(e) => setNewOutletLng(e.target.value)}
                                placeholder="e.g. 81.629615"
                                className="w-full bg-white border border-slate-200 px-3 py-1.5 rounded text-xs font-mono font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={fetchAdminLocation}
                                disabled={isFetchingAdminCoords}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-60 border border-slate-250 text-slate-700 text-xs font-bold rounded flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                                title={language === 'en' ? "Capture current GPS location" : "वर्तमान स्थान का जीपीएस कैप्चर करें"}
                              >
                                <Locate className={`w-3.5 h-3.5 ${isFetchingAdminCoords ? 'animate-spin text-emerald-600' : ''}`} />
                                <span>{isFetchingAdminCoords ? "..." : (language === 'en' ? "Get GPS" : "स्थान प्राप्त करें")}</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex justify-end">
                          <button
                            type="button"
                            onClick={handleAddGeofenceOutlet}
                            className="bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold px-4 py-2 rounded-md shadow-2xs flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>{language === 'en' ? "Lock Location & Save" : "लोकेशन लॉक करें और जोड़ें"}</span>
                          </button>
                        </div>
                      </div>

                      {/* Registered Locations List */}
                      <div>
                        <span className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                          {language === 'en' ? "Active Safe Geofences" : "सक्रिय सुरक्षित जियोफेंस सूची"}
                        </span>

                        {(!localSettings.geofenceOutlets || localSettings.geofenceOutlets.length === 0) ? (
                          <div className="text-center py-6 px-4 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-slate-400 text-xs font-medium">
                            {language === 'en' 
                              ? "No location geofences configured. Register at least one branch coordinates above to activate mobile punch restrictions." 
                              : "कोई जियोफेंस कॉन्फ़िगर नहीं किया गया है। मोबाइल उपस्थिति को लॉक करने के लिए ऊपर शाखा कोऑर्डिनेट्स जोड़ें।"}
                          </div>
                        ) : (
                          <div className="overflow-x-auto border border-slate-150 rounded-lg">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-55 border-b border-slate-150 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                                <tr>
                                  <th className="px-3 py-2">{language === 'en' ? "Branch Name" : "शाखा का नाम"}</th>
                                  <th className="px-3 py-2">{language === 'en' ? "GPS Coordinates" : "जीपीएस कोऑर्डिनेट्स"}</th>
                                  <th className="px-3 py-2">{language === 'en' ? "Safe Radius" : "सुरक्षित दायरा"}</th>
                                  <th className="px-3 py-2 text-right">{language === 'en' ? "Action" : "कार्रवाई"}</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                {localSettings.geofenceOutlets.map((outlet) => (
                                  <tr key={outlet.id} className="hover:bg-slate-50/55">
                                    <td className="px-3 py-2.5 font-bold text-slate-900">{outlet.name}</td>
                                    <td className="px-3 py-2.5 font-mono text-slate-500">
                                      Lat: {outlet.latitude.toFixed(6)}, Lng: {outlet.longitude.toFixed(6)}
                                    </td>
                                    <td className="px-3 py-2.5">
                                      <span className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                        {outlet.radiusMeters}m
                                      </span>
                                    </td>
                                    <td className="px-3 py-2.5 text-right">
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveGeofenceOutlet(outlet.id)}
                                        className="text-red-600 hover:text-red-700 p-1 rounded hover:bg-red-50 cursor-pointer transition-colors inline-flex"
                                        title={language === 'en' ? "Delete branch geofence lock" : "शाखा जियोफेंस लॉक हटाएं"}
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'security' && (
            <div className="space-y-6">
              <div className="border-b border-gray-150 pb-4">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-500" />
                  {language === 'en' ? 'Portal Security Audit Log' : 'पोर्टल सुरक्षा ऑडिट लॉग'}
                </h3>
                <p className="text-[11px] text-gray-500 font-medium mt-1">
                  {language === 'en' 
                    ? 'Monitor failed login attempts to recognize potential security breaches, unauthorized entry attempts, or employees struggling with forgotten passwords.'
                    : 'भूले हुए पासवर्ड या संभावित अनधिकृत पहुंच का पता लगाने के लिए असफल लॉगिन प्रयासों की निगरानी करें।'}
                </p>
              </div>

              {/* Stats Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-rose-100 bg-rose-50/50 flex flex-col justify-between shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">
                    {language === 'en' ? 'Total Unsuccessful Attempts' : 'कुल असफल प्रयास'}
                  </span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-black text-rose-950 font-mono">
                      {failedLogins.length}
                    </span>
                    <span className="text-[10px] text-rose-600 font-semibold font-mono">
                      {language === 'en' ? 'logs' : 'लॉग'}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/50 flex flex-col justify-between shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                    {language === 'en' ? 'Unique IDs Targeted' : 'लक्षित विशिष्ट आईडी'}
                  </span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-black text-amber-950 font-mono">
                      {new Set(failedLogins.map(l => l.enteredId.toLowerCase())).size}
                    </span>
                    <span className="text-[10px] text-amber-600 font-semibold font-mono">
                      {language === 'en' ? 'user IDs' : 'उपयोगकर्ता आईडी'}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/50 flex flex-col justify-between shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                    {language === 'en' ? 'System Audit Status' : 'सिस्टम ऑडिट स्थिति'}
                  </span>
                  <div className="flex items-center gap-2 mt-2">
                    {failedLogins.length >= 8 ? (
                      <span className="inline-flex items-center gap-1 text-xs font-black text-rose-700 bg-rose-100 px-2.5 py-1 rounded-full animate-pulse">
                        ⚠️ {language === 'en' ? 'High Fail Rate' : 'उच्च विफलता दर'}
                      </span>
                    ) : failedLogins.length > 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
                        ℹ️ {language === 'en' ? 'Minor Incidents' : 'मामूली घटनाएं'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                        ✓ {language === 'en' ? 'Secure & Stable' : 'सुरक्षित और स्थिर'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Alert Insights Box */}
              {(() => {
                const idCounts: { [key: string]: number } = {};
                failedLogins.forEach(log => {
                  const k = log.enteredId.toUpperCase();
                  idCounts[k] = (idCounts[k] || 0) + 1;
                });
                const flaggedIds = Object.entries(idCounts).filter(([_, count]) => count >= 3);

                if (flaggedIds.length > 0) {
                  return (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 animate-fade-in">
                      <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-amber-900 uppercase tracking-wide">
                          {language === 'en' ? 'Security Action Warning Required' : 'सुरक्षा चेतावनी - ध्यान दें'}
                        </h4>
                        <p className="text-[10px] text-amber-800 font-semibold leading-relaxed">
                          {language === 'en' 
                            ? 'The following User/Employee IDs have 3 or more unsuccessful login attempts. This could suggest forgotten passwords or unauthorized brute-forcing attempts:' 
                            : 'निम्नलिखित उपयोगकर्ता/कर्मचारी आईडी पर 3 या अधिक असफल प्रयास दर्ज किए गए हैं:'}
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {flaggedIds.map(([id, count]) => (
                            <span key={id} className="inline-flex items-center bg-amber-200 text-amber-950 text-[10px] font-black px-2.5 py-1 rounded-md font-mono border border-amber-300 shadow-xs">
                              {id} ({count} {language === 'en' ? 'fails' : 'प्रयास'})
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Filter controls bar */}
              <div className="bg-slate-50 border border-gray-200 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 font-sans">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
                  {/* Search input */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text"
                      placeholder={language === 'en' ? 'Search Employee ID...' : 'कर्मचारी आईडी खोजें...'}
                      value={securitySearch}
                      onChange={(e) => setSecuritySearch(e.target.value)}
                      className="pl-9 pr-4 py-1.5 border border-gray-200 bg-white rounded-lg text-xs font-bold w-full sm:w-48 focus:outline-none focus:ring-1 focus:ring-[#03623c] font-mono shadow-2xs"
                    />
                  </div>

                  {/* Filter Reason dropdown */}
                  <div className="flex items-center gap-1.5 bg-white border border-gray-200 px-2.5 py-1 rounded-lg shadow-2xs">
                    <Filter className="w-3 h-3 text-gray-400" />
                    <select
                      value={securityReasonFilter}
                      onChange={(e: any) => setSecurityReasonFilter(e.target.value)}
                      className="text-xs font-bold text-gray-700 bg-transparent border-none focus:outline-none focus:ring-0 cursor-pointer"
                    >
                      <option value="all">{language === 'en' ? 'All Reasons' : 'सभी कारण'}</option>
                      <option value="Incorrect Password">{language === 'en' ? 'Incorrect Password' : 'गलत पासवर्ड'}</option>
                      <option value="User ID not found">{language === 'en' ? 'ID Not Found' : 'आईडी नहीं मिली'}</option>
                      <option value="Admin Incorrect Password">{language === 'en' ? 'Admin Bad Password' : 'एडमिन गलत पासवर्ड'}</option>
                    </select>
                  </div>
                </div>

                {/* Clear Audit log button */}
                {failedLogins.length > 0 && onClearFailedLogins && (
                  <button
                    onClick={() => {
                      if (window.confirm(language === 'en' ? 'Are you sure you want to permanently clear all unsuccessful login attempts logs?' : 'क्या आप स्थायी रूप से सभी असफल लॉगिन लॉग साफ़ करना चाहते हैं?')) {
                        onClearFailedLogins();
                      }
                    }}
                    className="text-xs font-black text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200/50 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-97"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {language === 'en' ? 'Clear Security Log' : 'सुरक्षा लॉग साफ़ करें'}
                  </button>
                )}
              </div>

              {/* Log Table / List */}
              {(() => {
                const filteredLogs = failedLogins.filter(log => {
                  const matchesSearch = log.enteredId.toLowerCase().includes(securitySearch.toLowerCase());
                  const matchesReason = securityReasonFilter === 'all' || log.reason === securityReasonFilter;
                  return matchesSearch && matchesReason;
                });

                if (filteredLogs.length === 0) {
                  return (
                    <div className="border border-dashed border-gray-250 rounded-2xl p-10 text-center font-sans">
                      <p className="text-sm text-gray-500 italic">
                        {language === 'en' ? 'No failed login attempts found.' : 'कोई असफल लॉगिन प्रयास नहीं मिला।'}
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="overflow-x-auto border border-gray-200 rounded-xl bg-white shadow-2xs max-h-[400px] overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs font-sans">
                      <thead className="bg-slate-50 border-b border-gray-200 text-slate-600 font-black uppercase text-[10px] tracking-wider sticky top-0 z-10">
                        <tr>
                          <th className="p-3">{language === 'en' ? 'Entered ID' : 'दर्ज की गई आईडी'}</th>
                          <th className="p-3">{language === 'en' ? 'Timestamp' : 'समय और तारीख'}</th>
                          <th className="p-3">{language === 'en' ? 'Failure Reason' : 'विफलता का कारण'}</th>
                          <th className="p-3">{language === 'en' ? 'IP Address' : 'आईपी पता'}</th>
                          <th className="p-3">{language === 'en' ? 'Browser Details' : 'ब्राउज़र विवरण'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-semibold text-slate-700">
                        {filteredLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-3">
                              <span className="text-[10px] font-black font-mono text-rose-600 bg-rose-50 border border-rose-150 px-2.5 py-1 rounded">
                                {log.enteredId}
                              </span>
                            </td>
                            <td className="p-3 text-slate-500 font-mono text-[10px]">
                              {new Date(log.timestamp).toLocaleString()}
                            </td>
                            <td className="p-3">
                              <span className="text-rose-700 font-extrabold">{log.reason}</span>
                            </td>
                            <td className="p-3 font-mono text-[10px] text-slate-500">
                              {log.ipAddress || '-'}
                            </td>
                            <td className="p-3 max-w-[240px] truncate text-slate-400 font-medium text-[10px]" title={log.browserInfo}>
                              {log.browserInfo || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          )}

          {activeSubTab === 'database' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold text-gray-800 border-b border-gray-100 pb-2 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-slate-600" />
                  {language === 'en' ? 'Database Synchronization & Session Management' : 'डेटाबेस सिंक्रनाइज़ेशन और सत्र प्रबंधन'}
                </h3>
                <p className="text-[10px] text-gray-500 mt-1 leading-normal font-sans">
                  {language === 'en' 
                    ? 'Manage your cloud storage connections, troubleshoot Google Sheets sync errors, or backup and restore your complete HRMS database.' 
                    : 'अपने क्लाउड स्टोरेज कनेक्शन प्रबंधित करें, Google Sheets सिंक त्रुटियों को दूर करें, या अपने संपूर्ण HRMS डेटाबेस का बैकअप लें और उसे पुनर्स्थापित करें।'}
                </p>
              </div>

              {/* Troubleshooting Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 shadow-3xs font-sans">
                <div className="flex items-start gap-3">
                  <div className="bg-amber-100 p-2 rounded-xl text-amber-700 shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-800">
                      {language === 'en' ? 'Troubleshoot "Failed to Fetch" Sync Errors' : '"Failed to Fetch" सिंक त्रुटियों का समाधान करें'}
                    </h4>
                    <p className="text-[10px] text-slate-500 leading-normal font-semibold">
                      {language === 'en'
                        ? 'If you are seeing a persistent Google Sheets sync error or "Failed to Fetch", it is typically caused by cookie tracking protection, local ad-blockers, or an expired/invalid Google OAuth token. Clearing your Google Sheets credentials cache allows you to log back in cleanly and recreate the connection.'
                        : 'यदि आप लगातार Google Sheets सिंक त्रुटि या "Failed to Fetch" देख रहे हैं, तो यह आमतौर पर कुकी ट्रैकिंग सुरक्षा, स्थानीय विज्ञापन-अवरोधकों (ad-blockers), या एक समाप्त/अमान्य Google OAuth टोकन के कारण होता है। अपने Google Sheets क्रेडेंशियल कैश को साफ़ करने से आप आसानी से दोबारा लॉग इन कर सकते हैं।'}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (onClearSheetsSession) {
                        onClearSheetsSession();
                        alert(language === 'en' 
                          ? 'Google Sheets token cache cleared. Please refresh the page and authorize Google Sheets again.' 
                          : 'Google Sheets टोकन कैश साफ़ कर दिया गया है। कृपया पृष्ठ को रीफ़्रेश करें और Google Sheets को फिर से अधिकृत करें।');
                      }
                    }}
                    className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    {language === 'en' ? 'Clear Google Sheets Cache & Reset Session' : 'Google Sheets कैश साफ़ करें और सत्र रीसेट करें'}
                  </button>
                </div>
              </div>

              {/* Import/Export Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-3xs font-sans">
                <div className="flex items-start gap-3">
                  <div className="bg-indigo-100 p-2 rounded-xl text-indigo-700 shrink-0">
                    <Database className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-800">
                      {language === 'en' ? 'JSON Database Backup & Direct Instance Syncing' : 'JSON डेटाबेस बैकअप और डायरेक्ट इंस्टेंस सिंकिंग'}
                    </h4>
                    <p className="text-[10px] text-slate-500 leading-normal font-semibold">
                      {language === 'en'
                        ? 'Want to transfer your live production data from https://hrmsrbm.onrender.com/ into this development workspace? You can export the whole database in 1-click as a JSON backup file from your live instance, and import it here. The data will merge cleanly and automatically synchronize to your active Cloud Firestore.'
                        : 'क्या आप https://hrmsrbm.onrender.com/ से अपने वास्तविक लाइव डेटा को इस विकास कार्यक्षेत्र में स्थानांतरित करना चाहते हैं? आप अपने लाइव इंस्टेंस से संपूर्ण डेटाबेस को 1-क्लिक में JSON बैकअप फ़ाइल के रूप में निर्यात कर सकते हैं, और इसे यहाँ आयात कर सकते हैं। डेटा आसानी से मर्ज हो जाएगा और आपके सक्रिय क्लाउड फायरस्टोर में स्वतः सिंक्रनाइज़ हो जाएगा।'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                  {/* Export Section */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between space-y-3">
                    <div>
                      <h5 className="text-[11px] font-bold text-slate-800 mb-1">
                        {language === 'en' ? 'Export Database' : 'डेटाबेस निर्यात करें'}
                      </h5>
                      <p className="text-[9px] text-slate-500 leading-normal">
                        {language === 'en'
                          ? 'Download all employees, attendance archives, payroll records, and customized settings configuration as a local JSON backup.'
                          : 'सभी कर्मचारियों, उपस्थिति अभिलेखागार, पेरोल रिकॉर्ड और अनुकूलित सेटिंग्स कॉन्फ़िगरेशन को स्थानीय JSON बैकअप के रूप में डाउनलोड करें।'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleExport}
                      className="w-full bg-slate-200 hover:bg-slate-300 text-slate-800 text-[10px] font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all border border-slate-300"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {language === 'en' ? 'Download JSON Backup' : 'JSON बैकअप डाउनलोड करें'}
                    </button>
                  </div>

                  {/* Import Section */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between space-y-3">
                    <div>
                      <h5 className="text-[11px] font-bold text-slate-800 mb-1">
                        {language === 'en' ? 'Import Database' : 'डेटाबेस आयात करें'}
                      </h5>
                      <p className="text-[9px] text-slate-500 leading-normal">
                        {language === 'en'
                          ? 'Upload a previously exported JSON backup file to overwrite current workspace records and sync to Cloud Firestore.'
                          : 'वर्तमान कार्यक्षेत्र रिकॉर्ड को अधिलेखित करने और क्लाउड फायरस्टोर से सिंक करने के लिए पहले निर्यात की गई JSON बैकअप फ़ाइल अपलोड करें।'}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block w-full cursor-pointer">
                        <span className="sr-only">Choose backup file</span>
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleFileChange}
                          className="block w-full text-[9px] text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[9px] file:font-black file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                        />
                      </label>

                      {importError && (
                        <div className="text-[9px] text-red-600 font-bold bg-red-50 p-2 rounded border border-red-200">
                          {importError}
                        </div>
                      )}

                      {importSummary && (
                        <div className="text-[9px] text-emerald-700 font-bold bg-emerald-50 p-2 rounded border border-emerald-150 space-y-2">
                          <p>{importSummary}</p>
                          <button
                            type="button"
                            onClick={handleConfirmImport}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black py-1.5 rounded transition-all cursor-pointer flex items-center justify-center gap-1"
                          >
                            <Upload className="w-3 h-3" />
                            {language === 'en' ? 'Confirm Overwrite & Import Now' : 'अधिलेखन की पुष्टि करें और अभी आयात करें'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'roles_permissions' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold text-gray-800 border-b border-gray-100 pb-2 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-emerald-600" />
                  {language === 'en' ? 'User Roles & Access Permissions' : 'मल्टी-यूज़र भूमिकाएं और अनुमतियां'}
                </h3>
                <p className="text-[10px] text-gray-500 mt-1 leading-normal font-sans">
                  {language === 'en'
                    ? 'Define custom login accounts for different stakeholders (Admin, Director, HR, Branch Manager) and configure which dashboard modules they are allowed to access.'
                    : 'विभिन्न हितधारकों (एडमिन, डायरेक्टर, एचआर, ब्रांच मैनेजर) के लिए लॉगिन खाते परिभाषित करें और कॉन्फ़िगर करें कि उन्हें किन डैशबोर्ड मॉड्यूल तक पहुंचने की अनुमति है।'}
                </p>
              </div>

              {/* 1. Permissions Matrix */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 shadow-3xs font-sans">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    {language === 'en' ? 'Granular Permission Matrix' : 'विस्तृत अनुमति नियंत्रण मैट्रिक्स'}
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                    {language === 'en'
                      ? 'Select a user role, then toggle checkboxes to configure granular action-level access (View, Add, Edit, Delete/Approve) for each page module.'
                      : 'उपयोगकर्ता भूमिका चुनें, फिर प्रत्येक पृष्ठ मॉड्यूल के लिए विस्तृत कार्रवाई-स्तरीय पहुंच (देखें, जोड़ें, संपादित करें, हटाएं / स्वीकृत करें) कॉन्फ़िगर करने के लिए चेकबॉक्स पर क्लिक करें।'}
                  </p>
                </div>

                {/* Role Selector Tabs */}
                <div className="flex flex-wrap gap-2 p-1.5 bg-slate-150/50 rounded-xl border border-slate-200">
                  {[
                    { id: 'director', label: language === 'en' ? 'Director' : 'डायरेक्टर' },
                    { id: 'sub_admin', label: language === 'en' ? 'Sub Admin' : 'सब एडमिन' },
                    { id: 'hr', label: language === 'en' ? 'HR Manager' : 'एचआर मैनेजर' },
                    { id: 'branch_manager', label: language === 'en' ? 'Branch Manager' : 'शाखा प्रबंधक' },
                  ].map(roleItem => (
                    <button
                      key={roleItem.id}
                      type="button"
                      onClick={() => setActiveConfigRole(roleItem.id as any)}
                      className={`flex-1 min-w-[120px] px-3 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                        activeConfigRole === roleItem.id
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                      }`}
                    >
                      {roleItem.label}
                    </button>
                  ))}
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-3xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-extrabold text-[10px] uppercase tracking-wider">
                        <th className="p-3.5 font-black">{language === 'en' ? 'Module Name' : 'मॉड्यूल का नाम'}</th>
                        <th className="p-3.5 text-center">{language === 'en' ? '1. View / Access' : '1. देखें / पहुंच'}</th>
                        <th className="p-3.5 text-center">{language === 'en' ? '2. Add / Create' : '2. जोड़ें / बनाएं'}</th>
                        <th className="p-3.5 text-center">{language === 'en' ? '3. Edit / Modify' : '3. बदलें / संशोधित'}</th>
                        <th className="p-3.5 text-center">{language === 'en' ? '4. Delete / Action' : '4. हटाएं / कार्रवाई'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {PERMISSION_MODULES.map((mod) => (
                        <tr key={mod.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-3.5">
                            <div className="font-bold text-slate-900">{language === 'en' ? mod.labelEn : mod.labelHi}</div>
                            <div className="text-[9px] text-slate-400 font-mono mt-0.5">ID: {mod.id}</div>
                          </td>
                          
                          {[0, 1, 2, 3].map((colIndex) => {
                            const act = getActionForColumn(mod.id, colIndex);
                            return (
                              <td key={colIndex} className="p-3.5 text-center">
                                {act ? (
                                  <div className="flex flex-col items-center justify-center gap-1.5">
                                    <input
                                      type="checkbox"
                                      checked={isPermissionChecked(activeConfigRole, mod.id, act.id)}
                                      onChange={() => handleToggleFineGrainedPermission(activeConfigRole, mod.id, act.id)}
                                      className="w-4.5 h-4.5 rounded-md text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer transition-all focus:scale-105"
                                    />
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">
                                      {act.label}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-slate-300 text-xs font-mono">-</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="text-[9px] text-amber-600 font-bold bg-amber-50 p-2 rounded-lg border border-amber-200">
                  {language === 'en'
                    ? '* Note: System Administrator ("admin") always has permanent access to all sections and cannot be restricted.'
                    : '* ध्यान दें: सिस्टम एडमिनिस्ट्रेटर ("admin") के पास हमेशा सभी अनुभागों के लिए स्थायी पहुंच होती है और इसे प्रतिबंधित नहीं किया जा सकता है।'}
                </div>
              </div>

              {/* 2. User Accounts List & Form */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
                {/* Accounts list table */}
                <div className="lg:col-span-2 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800">
                    {language === 'en' ? 'Active Multi-User Accounts' : 'सक्रिय मल्टी-यूज़र खाते'}
                  </h4>
                  
                  <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold text-[10px] uppercase">
                          <th className="p-3">{language === 'en' ? 'User Details' : 'विवरण'}</th>
                          <th className="p-3">{language === 'en' ? 'Role' : 'भूमिका'}</th>
                          <th className="p-3">{language === 'en' ? 'Branch' : 'शाखा'}</th>
                          <th className="p-3 text-right">{language === 'en' ? 'Action' : 'कार्रवाई'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                        {/* Always show the main admin */}
                        <tr className="bg-emerald-50/20">
                          <td className="p-3">
                            <p className="font-extrabold text-slate-900">{language === 'en' ? 'Primary Administrator' : 'मुख्य एडमिन'}</p>
                            <p className="text-[10px] text-slate-400 font-mono">@{localSettings.adminUsername || 'admin'}</p>
                            
                            {editingAccountId === 'admin' ? (
                              <div className="mt-1.5 flex items-center gap-2 animate-fadeIn">
                                <input
                                  type="text"
                                  value={editingAccountPassword}
                                  onChange={(e) => setEditingAccountPassword(e.target.value)}
                                  className="border border-emerald-300 px-2 py-0.5 rounded text-[10px] font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 w-28 bg-white"
                                  placeholder={language === 'en' ? 'New password' : 'नया पासवर्ड'}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!editingAccountPassword.trim()) return;
                                    setLocalSettings({
                                      ...localSettings,
                                      adminPassword: editingAccountPassword.trim()
                                    });
                                    setEditingAccountId(null);
                                    setEditingAccountPassword('');
                                  }}
                                  className="bg-emerald-600 text-white text-[9px] font-bold px-2 py-1 rounded hover:bg-emerald-700 cursor-pointer"
                                >
                                  {language === 'en' ? 'Save' : 'सहेजें'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { setEditingAccountId(null); setEditingAccountPassword(''); }}
                                  className="text-slate-400 hover:text-slate-600 text-[9px] font-bold px-1.5 py-1 rounded hover:bg-slate-100 cursor-pointer"
                                >
                                  {language === 'en' ? 'Cancel' : 'रद्द करें'}
                                </button>
                              </div>
                            ) : (
                              <div className="mt-1.5 flex items-center gap-1.5">
                                <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-600">
                                  🔑 ••••••••
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingAccountId('admin');
                                    setEditingAccountPassword(localSettings.adminPassword || 'admin123');
                                  }}
                                  className="text-emerald-600 hover:text-emerald-700 text-[10px] font-black underline cursor-pointer hover:bg-emerald-50 px-1.5 py-0.5 rounded transition-all"
                                >
                                  {language === 'en' ? 'Edit Pass' : 'पासवर्ड बदलें'}
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="p-3">
                            <span className="bg-emerald-100 text-emerald-800 text-[9px] px-2 py-0.5 rounded-full font-black uppercase">
                              Admin
                            </span>
                          </td>
                          <td className="p-3 text-slate-400 text-[10px] font-medium">-</td>
                          <td className="p-3 text-right text-slate-400 text-[10px] font-medium">
                            {language === 'en' ? 'System Default' : 'सिस्टम डिफॉल्ट'}
                          </td>
                        </tr>

                        {roleAccounts.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-6 text-center text-slate-400 text-[10px] font-medium">
                              {language === 'en' ? 'No additional user accounts configured.' : 'कोई अन्य उपयोगकर्ता खाता कॉन्फ़िगर नहीं किया गया है।'}
                            </td>
                          </tr>
                        ) : (
                          roleAccounts.map((acc) => (
                            <tr key={acc.id} className="hover:bg-slate-50/50">
                              <td className="p-3">
                                <p className="font-extrabold text-slate-900">{acc.name}</p>
                                <p className="text-[10px] text-slate-400 font-mono">@{acc.username}</p>
                                {acc.email && (
                                  <p className="text-[10px] text-slate-500 mt-0.5">📧 {acc.email}</p>
                                )}
                                {acc.mobileNo && (
                                  <p className="text-[10px] text-slate-500 mt-0.5">📞 {acc.mobileNo}</p>
                                )}
                                <div className="mt-1.5 flex items-center gap-1.5">
                                  <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-600">
                                    🔑 ••••••••
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setEditingAccount(acc)}
                                    className="text-emerald-600 hover:text-emerald-700 text-[10px] font-black underline cursor-pointer hover:bg-emerald-50 px-1.5 py-0.5 rounded transition-all"
                                  >
                                    {language === 'en' ? 'Edit Details' : 'विवरण/शाखा संपादित करें'}
                                  </button>
                                </div>
                              </td>
                              <td className="p-3">
                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase ${
                                  acc.role === 'admin' 
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : acc.role === 'director'
                                    ? 'bg-blue-100 text-blue-800'
                                    : acc.role === 'sub_admin'
                                    ? 'bg-indigo-100 text-indigo-800'
                                    : acc.role === 'hr'
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {acc.role.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="p-3 text-[10px] text-slate-600">
                                {acc.branches && acc.branches.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {acc.branches.map(b => (
                                      <span key={b} className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[9px] font-bold">
                                        {b}
                                      </span>
                                    ))}
                                  </div>
                                ) : acc.branch ? (
                                  <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[9px] font-bold">
                                    {acc.branch}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 font-medium">{language === 'en' ? 'All Branches' : 'सभी शाखाएं'}</span>
                                )}
                              </td>
                              <td className="p-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    type="button"
                                    onClick={() => setEditingAccount(acc)}
                                    className="text-emerald-600 hover:text-emerald-800 p-1 rounded-md hover:bg-emerald-50 cursor-pointer animate-fadeIn"
                                    title={language === 'en' ? 'Edit Account' : 'खाता संपादित करें'}
                                  >
                                    <Edit2 className="w-4 h-4 inline" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteRoleAccount(acc.id)}
                                    className="text-rose-600 hover:text-rose-800 p-1 rounded-md hover:bg-rose-50 cursor-pointer animate-fadeIn"
                                    title={language === 'en' ? 'Delete Account' : 'खाता हटाएं'}
                                  >
                                    <Trash2 className="w-4 h-4 inline" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Form to add new account */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-3xs">
                  <h4 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-2">
                    {language === 'en' ? 'Create User Account' : 'नया लॉगिन खाता बनाएं'}
                  </h4>

                  {roleFormError && (
                    <div className="text-[10px] text-rose-600 font-bold bg-rose-50 p-2.5 rounded border border-rose-200">
                      {roleFormError}
                    </div>
                  )}

                  <div className="space-y-3 text-xs font-semibold">
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">{language === 'en' ? 'Full Name' : 'पूरा नाम'}</label>
                      <input
                        type="text"
                        value={newAccName}
                        onChange={(e) => setNewAccName(e.target.value)}
                        placeholder="Rahul Sharma"
                        className="w-full border border-gray-200 px-3 py-1.5 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-bold mb-1">{language === 'en' ? 'Login Username' : 'लॉगिन आईडी (Username)'}</label>
                      <input
                        type="text"
                        value={newAccUsername}
                        onChange={(e) => setNewAccUsername(e.target.value)}
                        placeholder="rahul_hr"
                        className="w-full border border-gray-200 px-3 py-1.5 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none font-mono text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-bold mb-1">{language === 'en' ? 'Password' : 'पासवर्ड'}</label>
                      <input
                        type="text"
                        value={newAccPassword}
                        onChange={(e) => setNewAccPassword(e.target.value)}
                        placeholder="hr1234"
                        className="w-full border border-gray-200 px-3 py-1.5 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none font-mono text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-bold mb-1">{language === 'en' ? 'Email ID' : 'ईमेल आईडी'}</label>
                      <input
                        type="email"
                        value={newAccEmail}
                        onChange={(e) => setNewAccEmail(e.target.value)}
                        placeholder="rahul@rathi.com"
                        className="w-full border border-gray-200 px-3 py-1.5 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-bold mb-1">{language === 'en' ? 'Mobile No.' : 'मोबाइल नंबर'}</label>
                      <input
                        type="text"
                        value={newAccMobileNo}
                        onChange={(e) => setNewAccMobileNo(e.target.value)}
                        placeholder="9876543210"
                        className="w-full border border-gray-200 px-3 py-1.5 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-bold mb-1">{language === 'en' ? 'Assigned Role' : 'सौंपी गई भूमिका'}</label>
                      <select
                        value={newAccRole}
                        onChange={(e: any) => {
                          setNewAccRole(e.target.value);
                          if (e.target.value !== 'branch_manager' && e.target.value !== 'director' && e.target.value !== 'sub_admin') {
                            setNewAccBranch('');
                            setNewAccBranches([]);
                          }
                        }}
                        className="w-full border border-gray-200 px-3 py-1.5 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none font-bold text-slate-700"
                      >
                        <option value="admin">{language === 'en' ? 'System Admin (सह-प्रशासक)' : 'सिस्टम एडमिन (सह-प्रशासक)'}</option>
                        <option value="director">{language === 'en' ? 'Director (डायरेक्टर)' : 'डायरेक्टर'}</option>
                        <option value="sub_admin">{language === 'en' ? 'Sub Admin (सब एडमिन)' : 'सब एडमिन'}</option>
                        <option value="hr">{language === 'en' ? 'HR Manager (एचआर मैनेजर)' : 'एचआर मैनेजर'}</option>
                        <option value="branch_manager">{language === 'en' ? 'Branch Manager (ब्रांच मैनेजर)' : 'ब्रांच मैनेजर'}</option>
                      </select>
                    </div>

                    {(newAccRole === 'branch_manager' || newAccRole === 'director' || newAccRole === 'sub_admin') && (
                      <div className="space-y-2 border border-slate-100 p-2.5 rounded-lg bg-slate-50/50">
                        <label className="block text-slate-600 font-bold">
                          {language === 'en' ? 'Restricted Branches' : 'शाखा प्रतिबंध'}
                        </label>
                        
                        <div className="max-h-28 overflow-y-auto space-y-1.5 p-1.5 bg-white border border-slate-200 rounded">
                          {localSettings.branches.length === 0 ? (
                            <p className="text-[10px] text-slate-400 italic p-1">No branches configured yet</p>
                          ) : (
                            localSettings.branches.map((br) => {
                              const isChecked = newAccBranches.includes(br);
                              return (
                                <label key={br} className="flex items-center gap-2 px-2 py-1 hover:bg-slate-50 rounded cursor-pointer select-none text-[11px] font-medium text-slate-700">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {
                                      if (isChecked) {
                                        setNewAccBranches(newAccBranches.filter(b => b !== br));
                                      } else {
                                        setNewAccBranches([...newAccBranches, br]);
                                      }
                                    }}
                                    className="w-3.5 h-3.5 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
                                  />
                                  <span>{br}</span>
                                </label>
                              );
                            })
                          )}
                        </div>
                        <p className="text-[9px] text-slate-400 mt-1 leading-normal">
                          {language === 'en'
                            ? 'Check the branch(es) this manager is allowed to see. Leave all unchecked to allow viewing ALL branches.'
                            : 'उन शाखाओं को चेक करें जिन्हें यह मैनेजर देख सकता है। सभी शाखाओं को देखने की अनुमति देने के लिए सभी को अनचेक छोड़ दें।'}
                        </p>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleAddRoleAccount}
                      className="w-full bg-[#03623c] hover:bg-[#024d2e] text-white text-xs font-black py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs mt-2"
                    >
                      <Plus className="w-4 h-4" />
                      {language === 'en' ? 'Add User Account' : 'खाता जोड़ें'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'audit_logs' && (
            <div className="space-y-6">
              <div className="bg-slate-100/50 border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="font-extrabold text-gray-900 text-sm">
                    {language === 'en' ? 'User Audit Log Report' : 'यूजर ऑडिट लॉग रिपोर्ट'}
                  </h3>
                  <p className="text-xs text-slate-500 leading-normal font-medium">
                    {language === 'en'
                      ? 'Detailed history of all modifications, entries, and approval events.'
                      : 'सभी संशोधनों, प्रविष्टियों और अनुमोदन घटनाओं का विस्तृत इतिहास।'}
                  </p>
                </div>
                
                {/* Clear button - restricted to Admin */}
                <div className="shrink-0">
                  {portalUser?.role === 'admin' ? (
                    <button
                      onClick={() => {
                        if (confirm(language === 'en' ? 'Are you sure you want to permanently clear all audit logs?' : 'क्या आप वाकई सभी ऑडिट लॉग को स्थायी रूप से हटाना चाहते हैं?')) {
                          if (onClearAuditLogs) onClearAuditLogs();
                        }
                      }}
                      className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-3xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{language === 'en' ? 'Clear Audit Logs' : 'ऑडिट लॉग साफ़ करें'}</span>
                    </button>
                  ) : (
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 border border-gray-200 text-gray-500 rounded-xl text-[10px] font-bold">
                        <Lock className="w-3 h-3 text-gray-400" />
                        <span>{language === 'en' ? 'Admin only can clear logs' : 'केवल एडमिन लॉग साफ़ कर सकते हैं'}</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Search & Filter Controls */}
              {(() => {
                const filtered = auditLogs.filter(log => {
                  const query = auditSearchQuery.toLowerCase().trim();
                  const matchesQuery = !query || 
                    log.actorUsername.toLowerCase().includes(query) ||
                    log.employeeName.toLowerCase().includes(query) ||
                    log.employeeId.toLowerCase().includes(query) ||
                    log.date.includes(query) ||
                    log.fieldChanged.toLowerCase().includes(query);

                  const matchesAction = auditActionFilter === 'all' || log.actionType === auditActionFilter;

                  return matchesQuery && matchesAction;
                });

                return (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={auditSearchQuery}
                          onChange={(e) => setAuditSearchQuery(e.target.value)}
                          placeholder={language === 'en' ? 'Search by actor, employee, field...' : 'खोजें: अभिनेता, कर्मचारी, क्षेत्र...'}
                          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#03623c] bg-white font-medium"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-400 shrink-0" />
                        <select
                          value={auditActionFilter}
                          onChange={(e: any) => setAuditActionFilter(e.target.value as any)}
                          className="border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 focus:outline-none bg-white font-bold"
                        >
                          <option value="all">{language === 'en' ? 'All Actions' : 'सभी क्रियाएं'}</option>
                          <option value="create">{language === 'en' ? 'Creates' : 'नई प्रविष्टियां'}</option>
                          <option value="update">{language === 'en' ? 'Updates' : 'संशोधन'}</option>
                          <option value="approve">{language === 'en' ? 'Approvals' : 'स्वीकृति'}</option>
                          <option value="reject">{language === 'en' ? 'Rejections' : 'अस्वीकृति'}</option>
                        </select>
                      </div>
                    </div>

                    {/* Audit Logs Table */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-3xs overflow-hidden">
                      {filtered.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                <th className="py-4 px-6">{language === 'en' ? 'Timestamp' : 'समय सीमा'}</th>
                                <th className="py-4 px-6">{language === 'en' ? 'Actor' : 'कर्ता'}</th>
                                <th className="py-4 px-6">{language === 'en' ? 'Target' : 'लक्ष्य'}</th>
                                <th className="py-4 px-6 text-center">{language === 'en' ? 'Action' : 'क्रिया'}</th>
                                <th className="py-4 px-6">{language === 'en' ? 'Changes' : 'बदलाव'}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 font-medium">
                              {filtered.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50/25 transition-colors">
                                  <td className="py-4 px-6 whitespace-nowrap font-mono text-gray-400 text-xxs font-bold">
                                    {new Date(log.timestamp).toLocaleString(language === 'en' ? 'en-US' : 'hi-IN')}
                                  </td>
                                  <td className="py-4 px-6 whitespace-nowrap">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-extrabold text-gray-800">{log.actorUsername}</span>
                                      <span className="text-[8px] bg-slate-100 text-slate-600 font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                                        {log.actorRole}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-4 px-6 whitespace-nowrap">
                                    <div>
                                      <div className="font-bold text-gray-900">{log.employeeName}</div>
                                      <div className="text-[10px] font-mono text-gray-400 font-bold mt-0.5">
                                        {log.employeeId} · {log.date}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-4 px-6 text-center whitespace-nowrap">
                                    <span
                                      className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest ${
                                        log.actionType === 'create'
                                          ? 'bg-blue-50 text-blue-700 border border-blue-100'
                                          : log.actionType === 'approve'
                                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                          : log.actionType === 'reject'
                                          ? 'bg-rose-50 text-rose-700 border border-rose-100'
                                          : 'bg-amber-50 text-amber-700 border border-amber-100'
                                      }`}
                                    >
                                      {log.actionType}
                                    </span>
                                  </td>
                                  <td className="py-4 px-6">
                                    <div className="space-y-1 max-w-[320px]">
                                      <div className="text-xxs text-slate-400">
                                        {language === 'en' ? 'Field: ' : 'क्षेत्र: '}
                                        <span className="font-bold text-slate-700 font-mono bg-slate-100 px-1 py-0.5 rounded">
                                          {log.fieldChanged}
                                        </span>
                                      </div>
                                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-700">
                                        <span className="text-gray-400 line-through truncate max-w-[120px]" title={log.oldValue}>
                                          {log.oldValue}
                                        </span>
                                        <span className="text-gray-400">➔</span>
                                        <span className="font-extrabold text-emerald-800 truncate max-w-[150px]" title={log.newValue}>
                                          {log.newValue}
                                        </span>
                                      </div>
                                      {log.remarks && (
                                        <p className="text-[10px] text-gray-400 italic font-medium bg-amber-50/40 px-1.5 py-1 rounded border border-amber-100">
                                          {log.remarks}
                                        </p>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-16 text-gray-400">
                          <AlertCircle className="w-12 h-12 mx-auto text-gray-200 mb-2" />
                          <p className="text-xs font-bold">
                            {language === 'en' ? 'No audit records matching filters.' : 'फ़िल्टर से मेल खाते कोई ऑडिट रिकॉर्ड नहीं मिले।'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Sub Tab: SMTP Custom Email Server Settings */}
          {activeSubTab === 'email_smtp' && (
            <div className="space-y-6 font-sans">
              
              {/* Header card matching the style */}
              <div className="bg-[#03623c]/5 border border-[#03623c]/15 rounded-xl p-5 shadow-3xs">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-[#03623c] rounded-xl text-white mt-0.5 animate-pulse">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                        {language === 'en' 
                          ? 'PART 4: SMTP EMAIL SERVER & SENDER ALIAS SETTINGS' 
                          : 'भाग 4: SMTP ईमेल सर्वर और प्रेषक उपनाम सेटिंग्स'}
                      </h3>
                      <p className="text-[11px] text-slate-500 font-semibold mt-1 max-w-2xl leading-relaxed">
                        {language === 'en'
                          ? 'Configure custom SMTP connection details to send 2-Step Verification and passkey reset emails to Trainees directly through your corporate mail server using a custom sender alias name.'
                          : 'अपने कॉर्पोरेट मेल सर्वर का उपयोग करके सीधे प्रशिक्षुओं को 2-चरण सत्यापन और पासकी रीसेट ईमेल भेजने के लिए कस्टम SMTP कनेक्शन विवरण कॉन्फ़िगर करें।'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Pulse Badge */}
                  <div className="self-start md:self-auto flex items-center gap-2 bg-slate-100 border border-slate-200/60 px-3 py-1 rounded-full shrink-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase text-slate-600 tracking-wider font-mono">
                      {language === 'en' ? 'Live Delivery Gateway' : 'लाइव डिलीवरी गेटवे'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                    {language === 'en' ? 'SMTP Outbound Host' : 'SMTP आउटबाउंड होस्ट'}
                  </label>
                  <input
                    type="text"
                    value={localSettings.smtpHost || ''}
                    placeholder="e.g. smtp.gmail.com"
                    onChange={(e) => setLocalSettings({ ...localSettings, smtpHost: e.target.value })}
                    className="w-full border border-gray-200 px-3 py-2 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#03623c]/20 focus:border-[#03623c] focus:outline-none text-slate-800 transition-all bg-white shadow-2xs"
                  />
                </div>
                
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                    {language === 'en' ? 'SMTP Port' : 'SMTP पोर्ट'}
                  </label>
                  <input
                    type="number"
                    value={localSettings.smtpPort ?? ''}
                    placeholder="e.g. 587"
                    onChange={(e) => setLocalSettings({ ...localSettings, smtpPort: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full border border-gray-200 px-3 py-2 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#03623c]/20 focus:border-[#03623c] focus:outline-none text-slate-800 transition-all bg-white shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                    {language === 'en' ? 'SMTP Password' : 'SMTP पासवर्ड'}
                  </label>
                  <input
                    type="password"
                    value={localSettings.smtpPassword || ''}
                    placeholder="••••••••••••••••"
                    onChange={(e) => setLocalSettings({ ...localSettings, smtpPassword: e.target.value })}
                    className="w-full border border-gray-200 px-3 py-2 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#03623c]/20 focus:border-[#03623c] focus:outline-none text-slate-800 transition-all bg-white shadow-2xs font-mono"
                  />
                </div>

                <div className="md:col-span-4">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                    {language === 'en' ? 'SMTP Username' : 'SMTP यूज़रनेम (ईमेल)'}
                  </label>
                  <input
                    type="text"
                    value={localSettings.smtpUsername || ''}
                    placeholder="e.g. misrpr@rathibuildmart.com"
                    onChange={(e) => setLocalSettings({ ...localSettings, smtpUsername: e.target.value })}
                    className="w-full border border-gray-200 px-3 py-2 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#03623c]/20 focus:border-[#03623c] focus:outline-none text-slate-800 transition-all bg-white shadow-2xs"
                  />
                </div>
              </div>

              {/* Warning/Guide Banner */}
              <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-4 text-[11px] text-amber-800 leading-relaxed font-semibold">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-extrabold text-amber-900 text-xs mb-1">
                      {language === 'en' ? 'Gmail/Google Workspace SMTP Configuration Notice:' : 'जीमेल/गूगल वर्कस्पेस SMTP कॉन्फ़िगरेशन सूचना:'}
                    </h4>
                    <p className="font-medium text-slate-600 leading-relaxed">
                      {language === 'en'
                        ? 'If you are using Google Mail (smtp.gmail.com) as your host, ensure 2-Step Verification is ON under your Google Account Security, generate a 16-character App Password (without spaces), and paste it into the SMTP Password field above.'
                        : 'यदि आप होस्ट के रूप में गूगल मेल (smtp.gmail.com) का उपयोग कर रहे हैं, तो सुनिश्चित करें कि आपके गूगल खाता सुरक्षा के तहत 2-चरण सत्यापन चालू है, एक 16-अक्षर का ऐप पासवर्ड (बिना रिक्त स्थान के) जेनरेट करें, और उसे ऊपर SMTP पासवर्ड फ़ील्ड में पेस्ट करें।'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Second row of inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                    {language === 'en' ? 'Sender Display Name (Alias)' : 'प्रेषक का नाम (Sender Name)'}
                  </label>
                  <input
                    type="text"
                    value={localSettings.senderName || ''}
                    placeholder="e.g. Rathi LMS System"
                    onChange={(e) => setLocalSettings({ ...localSettings, senderName: e.target.value })}
                    className="w-full border border-gray-200 px-3 py-2 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#03623c]/20 focus:border-[#03623c] focus:outline-none text-slate-800 transition-all bg-white shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                    {language === 'en' ? 'Sender Email Address' : 'प्रेषक का ईमेल (Sender Email)'}
                  </label>
                  <input
                    type="email"
                    value={localSettings.senderEmail || ''}
                    placeholder="e.g. rbmlms@rathibuildmart.com"
                    onChange={(e) => setLocalSettings({ ...localSettings, senderEmail: e.target.value })}
                    className="w-full border border-gray-200 px-3 py-2 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#03623c]/20 focus:border-[#03623c] focus:outline-none text-slate-800 transition-all bg-white shadow-2xs"
                  />
                </div>
              </div>

              {/* Reset & Save Form Actions specifically for SMTP */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleResetSmtpToDefaults}
                  className="bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-3xs"
                >
                  {language === 'en' ? 'Reset Defaults' : 'डिफ़ॉल्ट रीसेट करें'}
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="bg-[#03623c] hover:bg-[#024d2e] text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-2xs"
                >
                  {language === 'en' ? 'Save SMTP Configurations' : 'SMTP कॉन्फ़िगरेशन सहेजें'}
                </button>
              </div>

              {/* Subsection: Dispatch Tester */}
              <div className="border-t border-dashed border-slate-200 pt-6 mt-6 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="p-1 bg-amber-100 text-amber-700 rounded-lg shrink-0">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping inline-block align-middle mb-0.5 mr-0.5" />
                    <span className="font-extrabold uppercase tracking-widest text-[9px] font-mono">LIVE</span>
                  </span>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest font-mono">
                    {language === 'en' ? 'LIVE SMTP GATEWAY DISPATCH TESTER' : 'लाइव SMTP गेटवे प्रेषण परीक्षक'}
                  </h4>
                </div>
                
                <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                  {language === 'en'
                    ? 'Enter any recipient email to instantly test the configured SMTP routing and sender name alias.'
                    : 'कॉन्फ़िगर किए गए SMTP रूटिंग और प्रेषक नाम उपनाम का तुरंत परीक्षण करने के लिए कोई भी प्राप्तकर्ता ईमेल दर्ज करें।'}
                </p>

                <div className="flex flex-col sm:flex-row gap-2 max-w-2xl">
                  <input
                    type="email"
                    value={testRecipient}
                    placeholder="Enter recipient email address..."
                    onChange={(e) => setTestRecipient(e.target.value)}
                    className="flex-1 border border-gray-200 px-4 py-2 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none text-slate-800 transition-all bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleTestSmtp}
                    disabled={isTestingSmtp}
                    className="bg-[#4f46e5] hover:bg-[#4338ca] text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-2 shrink-0 disabled:opacity-55 disabled:cursor-not-allowed"
                  >
                    {isTestingSmtp ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        {language === 'en' ? 'Dispatching...' : 'भेजा जा रहा है...'}
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        {language === 'en' ? 'Dispatch Test' : 'परीक्षण भेजें'}
                      </>
                    )}
                  </button>
                </div>

                {/* Tester output alert */}
                {testResult && (
                  <div className={`p-4 rounded-xl text-[11px] font-semibold leading-relaxed border transition-all animate-fadeIn ${
                    testResult.success 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200/60' 
                      : 'bg-red-50 text-red-800 border-red-200/60'
                  }`}>
                    <div className="flex items-start gap-2.5">
                      {testResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="font-bold">{testResult.success ? "SUCCESS" : "ERROR / FAILURE"}</p>
                        <p className="mt-0.5 text-slate-600 font-medium">{testResult.message}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* Action Row */}
          <div className="mt-8 pt-5 border-t border-gray-150 flex items-center justify-between">
            <button
              onClick={handleSave}
              className="bg-[#03623c] hover:bg-[#024d2e] text-white px-5 py-2 rounded-md text-xs font-bold shadow-xs transition-colors cursor-pointer"
              id="btn-save-admin-settings"
            >
              {t.saveAll}
            </button>
            <span className="text-[10px] text-gray-400 font-medium">
              * Note: Settings are synced locally for immediate response.
            </span>
          </div>

          {/* Edit User Account Modal */}
          {editingAccount && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs font-sans">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden">
                {/* Modal Header */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50 rounded-t-2xl shrink-0">
                  <h3 className="text-sm font-bold text-gray-900 font-display">
                    {language === 'en' ? 'Edit User Account' : 'खाता विवरण व शाखा संपादित करें'}
                  </h3>
                  <button 
                    onClick={() => setEditingAccount(null)}
                    className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Modal Form */}
                <div className="p-5 overflow-y-auto space-y-4 text-xs font-semibold">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">{language === 'en' ? 'Full Name' : 'पूरा नाम'}</label>
                    <input
                      type="text"
                      value={editingAccount.name}
                      onChange={(e) => setEditingAccount({ ...editingAccount, name: e.target.value })}
                      className="w-full border border-gray-200 px-3 py-1.5 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">{language === 'en' ? 'Login Username' : 'लॉगिन आईडी (Username)'}</label>
                    <input
                      type="text"
                      value={editingAccount.username}
                      onChange={(e) => setEditingAccount({ ...editingAccount, username: e.target.value })}
                      className="w-full border border-gray-200 px-3 py-1.5 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none font-mono text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">{language === 'en' ? 'Email ID' : 'ईमेल आईडी'}</label>
                    <input
                      type="email"
                      value={editingAccount.email || ''}
                      onChange={(e) => setEditingAccount({ ...editingAccount, email: e.target.value })}
                      className="w-full border border-gray-200 px-3 py-1.5 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none text-slate-800"
                      placeholder="example@rathi.com"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">{language === 'en' ? 'Mobile No.' : 'मोबाइल नंबर'}</label>
                    <input
                      type="text"
                      value={editingAccount.mobileNo || ''}
                      onChange={(e) => setEditingAccount({ ...editingAccount, mobileNo: e.target.value })}
                      className="w-full border border-gray-200 px-3 py-1.5 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none text-slate-800"
                      placeholder="9876543210"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">{language === 'en' ? 'Password' : 'पासवर्ड'}</label>
                    <input
                      type="text"
                      value={editingAccount.password || ''}
                      onChange={(e) => setEditingAccount({ ...editingAccount, password: e.target.value })}
                      className="w-full border border-gray-200 px-3 py-1.5 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none font-mono text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">{language === 'en' ? 'Assigned Role' : 'सौंपी गई भूमिका'}</label>
                    <select
                      value={editingAccount.role}
                      onChange={(e: any) => {
                        const r = e.target.value;
                        setEditingAccount({
                          ...editingAccount,
                          role: r,
                          branches: (r === 'branch_manager' || r === 'director' || r === 'sub_admin') ? (editingAccount.branches || []) : undefined,
                          branch: (r === 'branch_manager' || r === 'director' || r === 'sub_admin') ? (editingAccount.branches?.[0] || '') : undefined
                        });
                      }}
                      className="w-full border border-gray-200 px-3 py-1.5 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none font-bold text-slate-700"
                    >
                      <option value="admin">{language === 'en' ? 'System Admin (सह-प्रशासक)' : 'सिस्टम एडमिन (सह-प्रशासक)'}</option>
                      <option value="director">{language === 'en' ? 'Director (डायरेक्टर)' : 'डायरेक्टर'}</option>
                      <option value="sub_admin">{language === 'en' ? 'Sub Admin (सब एडमिन)' : 'सब एडमिन'}</option>
                      <option value="hr">{language === 'en' ? 'HR Manager (एचआर मैनेजर)' : 'एचआर मैनेजर'}</option>
                      <option value="branch_manager">{language === 'en' ? 'Branch Manager (ब्रांच मैनेजर)' : 'ब्रांच मैनेजर'}</option>
                    </select>
                  </div>

                  {(editingAccount.role === 'branch_manager' || editingAccount.role === 'director' || editingAccount.role === 'sub_admin') && (
                    <div className="space-y-2 border border-slate-100 p-2.5 rounded-lg bg-slate-50/50">
                      <label className="block text-slate-600 font-bold">
                        {language === 'en' ? 'Restricted Branches' : 'शाखा प्रतिबंध (चुनें)'}
                      </label>
                      
                      <div className="max-h-28 overflow-y-auto space-y-1.5 p-1.5 bg-white border border-slate-200 rounded">
                        {localSettings.branches.length === 0 ? (
                          <p className="text-[10px] text-slate-400 italic p-1">No branches configured yet</p>
                        ) : (
                          localSettings.branches.map((br) => {
                            const currentBranches = editingAccount.branches || [];
                            const isChecked = currentBranches.includes(br);
                            return (
                              <label key={br} className="flex items-center gap-2 px-2 py-1 hover:bg-slate-50 rounded cursor-pointer select-none text-[11px] font-medium text-slate-700">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    let updated;
                                    if (isChecked) {
                                      updated = currentBranches.filter(b => b !== br);
                                    } else {
                                      updated = [...currentBranches, br];
                                    }
                                    setEditingAccount({
                                      ...editingAccount,
                                      branches: updated,
                                      branch: updated[0] || ''
                                    });
                                  }}
                                  className="w-3.5 h-3.5 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
                                />
                                <span>{br}</span>
                              </label>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Actions */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditingAccount(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer"
                  >
                    {language === 'en' ? 'Cancel' : 'रद्द करें'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!editingAccount.name.trim() || !editingAccount.username.trim()) {
                        alert(language === 'en' ? 'Name and username are required' : 'नाम और उपयोगकर्ता नाम आवश्यक हैं');
                        return;
                      }
                      const updated = roleAccounts.map(acc => acc.id === editingAccount.id ? editingAccount : acc);
                      setLocalSettings({
                        ...localSettings,
                        roleAccounts: updated
                      });
                      setEditingAccount(null);
                    }}
                    className="px-4 py-2 text-xs font-bold text-white bg-[#03623c] hover:bg-[#024d2e] rounded-xl cursor-pointer"
                  >
                    {language === 'en' ? 'Save Changes' : 'बदलाव सहेजें'}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
