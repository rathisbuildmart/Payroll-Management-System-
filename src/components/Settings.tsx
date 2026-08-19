import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Send,
  MessageSquare,
  Smartphone,
  FileSpreadsheet,
  Key,
  Copy,
  ExternalLink,
  Sparkles,
  RefreshCcw,
  Info,
  Crown,
  UserPlus,
  Globe,
  Shield,
  Table,
  Columns,
  Layers,
  Users,
  CheckSquare,
  FileText,
  SlidersHorizontal,
  Check,
  ShieldCheck,
  FolderLock,
  Archive
} from 'lucide-react';
import { AdminSettings, FieldSetting, FailedLoginAttempt, UserRoleAccount, AuditLog, TransactionalEmailLog, CustomRole } from '../types';
import AdminWelcomeModal from './AdminWelcomeModal';
import { getCostCenterPrefix } from '../utils/costCenterUtils';
import TransactionalEmailHistory from './TransactionalEmailHistory';
import FirebaseStorageMonitor from './FirebaseStorageMonitor';
import TemplateManager from './TemplateManager';
import ArchiveStorageManager from './ArchiveStorageManager';
import { 
  DEFAULT_WHATSAPP_TEMPLATES, 
  DEFAULT_EMAIL_TEMPLATES, 
  buildMessageAutoSenderUrl, 
  buildMessageAutoSenderExcelFormula,
  buildStandardWhatsAppUrl,
  formatPhoneNumber
} from '../utils/whatsappHelper';

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
  setEmployees?: React.Dispatch<React.SetStateAction<any[]>>;
  candidates?: any[];
  setCandidates?: React.Dispatch<React.SetStateAction<any[]>>;
  attendance?: any[];
  setAttendance?: React.Dispatch<React.SetStateAction<any[]>>;
  archivedEmployees?: any[];
  setArchivedEmployees?: React.Dispatch<React.SetStateAction<any[]>>;
  archivedCandidates?: any[];
  setArchivedCandidates?: React.Dispatch<React.SetStateAction<any[]>>;
  archivedAttendance?: any[];
  setArchivedAttendance?: React.Dispatch<React.SetStateAction<any[]>>;
  spreadsheetId?: string | null;
  googleToken?: string | null;
  payroll?: any[];
  onImportData?: (data: { employees?: any[]; attendance?: any[]; payroll?: any[]; adminSettings?: AdminSettings }) => void;
  onClearSheetsSession?: () => void;
  
  auditLogs?: AuditLog[];
  onClearAuditLogs?: () => void;
  portalUser?: any;

  emailLogs?: TransactionalEmailLog[];
  onClearEmailLogs?: () => void;
  onSendTestEmail?: (recipient: string, type: 'OTP' | 'Welcome Message' | 'Custom Notice', subject: string, customBody?: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  onResendEmail?: (log: TransactionalEmailLog) => Promise<{ success: boolean; message?: string; error?: string }>;
}

export const DEFAULT_FIELDS_CONFIG: FieldSetting[] = [
  //Employee Detail
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

  //Residential Address
  { id: 'resLine1', label: 'Residential Line 1', group: 'residential', isHidden: false, isMandatory: false },
  { id: 'resLine2', label: 'Residential Line 2', group: 'residential', isHidden: false, isMandatory: false },
  { id: 'resCountry', label: 'Residential Country', group: 'residential', isHidden: false, isMandatory: false },
  { id: 'resState', label: 'Residential State', group: 'residential', isHidden: false, isMandatory: false },
  { id: 'resCity', label: 'Residential City', group: 'residential', isHidden: false, isMandatory: false },
  { id: 'resPinCode', label: 'Residential PIN/ZIP Code', group: 'residential', isHidden: false, isMandatory: false },

  //Permanent Address
  { id: 'permLine1', label: 'Permanent Line 1', group: 'permanent', isHidden: false, isMandatory: false },
  { id: 'permLine2', label: 'Permanent Line 2', group: 'permanent', isHidden: false, isMandatory: false },
  { id: 'permCountry', label: 'Permanent Country', group: 'permanent', isHidden: false, isMandatory: false },
  { id: 'permState', label: 'Permanent State', group: 'permanent', isHidden: false, isMandatory: false },
  { id: 'permCity', label: 'Permanent City', group: 'permanent', isHidden: false, isMandatory: false },
  { id: 'permPinCode', label: 'Permanent PIN/ZIP Code', group: 'permanent', isHidden: false, isMandatory: false },

  //Bank Detail
  { id: 'bankAccountNo', label: 'Bank Account No.', group: 'bank', isHidden: false, isMandatory: false },
  { id: 'bankAccountHolderName', label: 'Bank Account Holder name', group: 'bank', isHidden: false, isMandatory: false },
  { id: 'bankName', label: 'Bank Name', group: 'bank', isHidden: false, isMandatory: false },
  { id: 'ifscCode', label: 'IFSC code', group: 'bank', isHidden: false, isMandatory: false },

  //Other Detail
  { id: 'panNo', label: 'PAN No.', group: 'other', isHidden: false, isMandatory: false },
  { id: 'pfAccountNo', label: 'PF Account No.', group: 'other', isHidden: false, isMandatory: false },
  { id: 'esicNo', label: 'ESIC No.', group: 'other', isHidden: false, isMandatory: false },
  { id: 'aadhaarNo', label: 'Aadhaar No.', group: 'other', isHidden: false, isMandatory: false },
  { id: 'uan', label: 'UAN', group: 'other', isHidden: false, isMandatory: false },

  //Employment Detail
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

export interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  isCustom?: boolean;
}

export const BUILTIN_ROLES: RoleDefinition[] = [
  { id: 'super_admin', name: 'Super Admin', description: 'Full root access to all modules, reports, system settings and user controls' },
  { id: 'admin', name: 'Admin', description: 'Complete administrative access across all operational modules, master logs and reports' },
  { id: 'director', name: 'Director', description: 'Executive level access to reports, finances, attendance, payroll & analytics' },
  { id: 'hr', name: 'HR Manager', description: 'Full access to employees, hiring, lifecycle, attendance, payroll & leaves' },
  { id: 'sub_admin', name: 'Sub Admin', description: 'Management of staff records, attendance, assets and leave requests' },
  { id: 'branch_manager', name: 'Branch Manager', description: 'Branch-specific access to employee logs, attendance & leaves' },
  { id: 'asset_manager', name: 'Asset Manager', description: 'Dedicated IT & Asset inventory management with non-salary employee view' },
  { id: 'recruiter', name: 'Recruiter', description: 'Candidate hiring, onboarding & initial registration workflow' },
  { id: 'employee', name: 'Employee', description: 'Self-service portal for own attendance punch, leaves & payslip' },
];

export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: ['dashboard', 'employees', 'hiring_onboarding', 'employee_lifecycle', 'asset_management', 'attendance', 'payroll', 'leaves', 'exit_management', 'ledger', 'admin', 'notices_support'],
  admin: ['dashboard', 'employees', 'hiring_onboarding', 'employee_lifecycle', 'asset_management', 'attendance', 'payroll', 'leaves', 'exit_management', 'ledger', 'admin', 'notices_support'],
  director: ['dashboard', 'employees', 'hiring_onboarding', 'employee_lifecycle', 'asset_management', 'attendance', 'payroll', 'leaves', 'exit_management', 'ledger', 'notices_support'],
  sub_admin: ['dashboard', 'employees', 'hiring_onboarding', 'employee_lifecycle', 'asset_management', 'attendance', 'leaves', 'notices_support'],
  hr: ['dashboard', 'employees', 'hiring_onboarding', 'employee_lifecycle', 'asset_management', 'attendance', 'payroll', 'leaves', 'exit_management', 'ledger', 'notices_support'],
  asset_manager: ['asset_management', 'employees', 'notices_support'],
  recruiter: ['hiring_onboarding', 'exit_management', 'employees', 'notices_support'],
  branch_manager: ['employees', 'hiring_onboarding', 'attendance', 'leaves', 'notices_support'],
  employee: ['attendance', 'leaves', 'notices_support']
};

export const DEFAULT_ROLE_COLUMN_PERMISSIONS: Record<string, string[]> = {
  super_admin: ['all'],
  admin: ['all'],
  director: ['all'],
  hr: ['all'],
  sub_admin: ['id', 'name', 'role', 'branch', 'joiningDate', 'status', 'mobileNo', 'personalDetails', 'addresses', 'gpsAndMobile', 'deviceInfo', 'export_csv', 'export_inactive', 'export_profile_pdf', 'export_payslip_pdf', 'export_attendance', 'bulk_import'],
  branch_manager: ['id', 'name', 'role', 'branch', 'joiningDate', 'status', 'mobileNo', 'personalDetails', 'addresses', 'gpsAndMobile', 'deviceInfo', 'export_csv', 'export_inactive', 'export_profile_pdf', 'export_attendance'],
  recruiter: ['id', 'name', 'role', 'branch', 'joiningDate', 'mobileNo', 'personalDetails', 'addresses', 'export_profile_pdf', 'bulk_import'],
  asset_manager: ['id', 'name', 'role', 'branch', 'status', 'mobileNo', 'deviceInfo'],
  employee: ['id', 'name', 'role', 'branch', 'personalDetails', 'addresses', 'salary', 'bankDetails', 'identityDetails', 'pfEsicDetails', 'export_profile_pdf', 'export_payslip_pdf', 'export_attendance']
};

export interface PermissionColumnCategory {
  category: string;
  description: string;
  items: {
    id: string;
    label: string;
    desc: string;
    sensitive?: boolean;
  }[];
}

export const PERMISSION_COLUMNS: PermissionColumnCategory[] = [
  {
    category: 'Basic Identity & Profile Info',
    description: 'General identification, contact, and personal details',
    items: [
      { id: 'id', label: 'Employee ID', desc: 'Employee Code / Badge Number (e.g. EMP001)' },
      { id: 'name', label: 'Name & Profile Photo', desc: 'Full Name, Avatar and Work Email' },
      { id: 'role', label: 'Designation & Department', desc: 'Job Title, Department & Employee Group' },
      { id: 'branch', label: 'Branch & Cost Center', desc: 'Assigned Branch location & Cost center tag' },
      { id: 'mobileNo', label: 'Work Mobile & Official Contact', desc: 'Official phone number & contact info' },
      { id: 'personalDetails', label: 'Personal Information', desc: 'Personal Mobile, Personal Email, DOB, Gender, Blood Group & Emergency Contact' },
    ]
  },
  {
    category: 'Residential & Permanent Addresses',
    description: 'Home address registry, street, city, state, pin code & country',
    items: [
      { id: 'addresses', label: 'Residential & Permanent Addresses', desc: 'Residential and Permanent Address Lines, City, State, Country and Pin Code', sensitive: true },
    ]
  },
  {
    category: 'Employment & Tenure',
    description: 'Dates and lifecycle status attributes',
    items: [
      { id: 'joiningDate', label: 'Joining Date', desc: 'Official date of joining the organization' },
      { id: 'confirmationDate', label: 'Confirmation Date', desc: 'Probation confirmation / review date' },
      { id: 'status', label: 'Employment Status (Active/Inactive)', desc: 'Active / Inactive badge and status toggle' },
    ]
  },
  {
    category: 'Standard Salary Structure & Rates (Highly Sensitive)',
    description: 'Compensation breakdown, base salary, allowances, deductions & increments',
    items: [
      { id: 'salary', label: 'Standard Salary Structure & Rates', desc: 'Basic Pay, HRA, DA, Allowances, Deductions, Gross Pay & Hourly Rate', sensitive: true },
      { id: 'paymentMethod', label: 'Payment Method Mode', desc: 'Payment mode (Bank Transfer, Cheque, Cash)', sensitive: true },
      { id: 'increments_tab', label: 'Salary Increment Tracker History', desc: 'View past appraisals, revisions & increment tracker tab', sensitive: true },
    ]
  },
  {
    category: 'Banking, Tax & Statutory Registry (Highly Sensitive)',
    description: 'Government compliance, PAN, Aadhaar, Bank Account, PF & ESIC details',
    items: [
      { id: 'bankDetails', label: 'Bank Account & IFSC Details', desc: 'Bank Name, Account Number, Account Holder & Branch IFSC', sensitive: true },
      { id: 'identityDetails', label: 'Statutory Registry & IDs (PAN & Aadhaar)', desc: 'Government identity proofs (PAN Card & Aadhaar Card Number)', sensitive: true },
      { id: 'pfEsicDetails', label: 'PF, ESIC & UAN Compliance IDs', desc: 'EPF Account No, UAN & ESIC Insurance Code', sensitive: true },
    ]
  },
  {
    category: 'Device & Attendance Controls',
    description: 'Mobile clocking flags and hardware binding locks',
    items: [
      { id: 'gpsAndMobile', label: 'GPS Geofencing & Mobile Punch', desc: 'Mobile punch enablement & Geofence toggle' },
      { id: 'deviceInfo', label: 'Device Binding & Hardware Lock', desc: 'Registered smartphone device ID & fingerprint lock' },
    ]
  },
  {
    category: 'Reports & Export Controls',
    description: 'Role-based access to download employee records, slips, and audit rosters',
    items: [
      { id: 'export_csv', label: 'Export Full Employee CSV Directory', desc: 'Ability to download full directory spreadsheet', sensitive: true },
      { id: 'export_inactive', label: 'Export Inactive Records Archive', desc: 'Ability to export archived ex-employees', sensitive: true },
      { id: 'export_profile_pdf', label: 'Export / Print Employee Profile PDF', desc: 'Ability to print or download employee profile cards' },
      { id: 'export_payslip_pdf', label: 'Export / Download Monthly Payslips', desc: 'Ability to download monthly salary slips & PDF certificates' },
      { id: 'export_attendance', label: 'Export Attendance Reports (Excel/CSV/PDF)', desc: 'Ability to export attendance daily logs and monthly summaries' },
      { id: 'bulk_import', label: 'Bulk CSV Import & Upload', desc: 'Ability to bulk import new employee rosters via CSV', sensitive: true },
    ]
  }
];

export const isRoleColumnAllowed = (
  role: string | undefined,
  columnKey: string,
  adminSettings?: AdminSettings
): boolean => {
  if (!role) return false;
  if (role === 'super_admin' || role === 'admin') return true;
  
  const configured = adminSettings?.roleColumnPermissions?.[role];
  if (configured && Array.isArray(configured)) {
    if (configured.includes('all')) return true;
    return configured.includes(columnKey);
  }
  
  const defaultList = DEFAULT_ROLE_COLUMN_PERMISSIONS[role];
  if (defaultList && Array.isArray(defaultList)) {
    if (defaultList.includes('all')) return true;
    return defaultList.includes(columnKey);
  }
  
  // Custom roles without explicit config default to standard non-sensitive columns
  return ['id', 'name', 'role', 'branch', 'status', 'mobileNo'].includes(columnKey);
};

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
  costCenters: [
    'Raipur Store',
    'Raipur Store Cash',
    'Raipur Warehouse',
    'Raipur Warehouse Cash',
    'Jagdalpur Store',
    'Jagdalpur Store Cash',
    'Bilaspur Store Cash',
    'Production Tech',
    'HR Admin'
  ],
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
  hrContactEmail: 'hr@rathibuildmart.com',
  hrContactPhone: '+91 91111 22222',
  hrContactManager: 'Rathi HR Desk',
  itContactEmail: 'it.support@rathibuildmart.com',
  itContactPhone: '+91 98888 77777',
  itContactManager: 'Rathi IT Management Desk',
  rulesShiftTiming: '09:30 AM - 06:30 PM',
  rulesHalfDaySlot: 'Before 01:30 PM',
  rulesLatePunchGrace: '09:45 AM',
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
    },
    {
      id: 'acc-4',
      username: 'asset_mgr',
      password: 'asset123',
      role: 'asset_manager',
      name: 'Asset & IT Manager',
      createdAt: '2026-07-15T00:00:00.000Z'
    }
  ],
  rolePermissions: DEFAULT_ROLE_PERMISSIONS,
  roleColumnPermissions: DEFAULT_ROLE_COLUMN_PERMISSIONS,
  customRoles: [],
  enableEmployeePayslips: false,
  enableGeofencing: false,
  enableMobileAttendance: true,
  smtpHost: 'smtp.gmail.com',
  smtpPort: 587,
  smtpUsername: 'misrpr@rathibuildmart.com',
  smtpPassword: '',
  senderName: 'Rathi LMS System',
  senderEmail: 'rbmlms@rathibuildmart.com',
  whatsappUsername: 'rathis',
  whatsappPassword: 'Rathis@ravs#2025!',
  whatsappSenderNo: '8518880943',
  enablePasswordLoginOtp: false,
  enableAdminWelcomePopup: true,
  salaryVisibilitySettings: {
    enabled: true,
    visibilityDurationDays: 7,
    autoHideAfterDays: true,
    showEarningsAndDeductionsBreakdown: true,
    customNoticeWhenExpired: 'Salary breakdown for this pay cycle has completed its active 7-day viewing window. Past statements remain available under the Payslips tab.'
  }
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
  setEmployees = () => {},
  candidates = [],
  setCandidates,
  attendance = [],
  setAttendance = () => {},
  archivedEmployees = [],
  setArchivedEmployees = () => {},
  archivedCandidates = [],
  setArchivedCandidates = () => {},
  archivedAttendance = [],
  setArchivedAttendance = () => {},
  spreadsheetId,
  googleToken,
  payroll = [],
  onImportData,
  onClearSheetsSession,
  auditLogs = [],
  onClearAuditLogs,
  portalUser,
  emailLogs = [],
  onClearEmailLogs,
  onSendTestEmail,
  onResendEmail
}: SettingsProps) {
  const [activeSubTab, setActiveSubTab] = useState<'company' | 'fields' | 'masters' | 'policy' | 'security' | 'database' | 'archive_storage' | 'roles_permissions' | 'audit_logs' | 'email_smtp' | 'whatsapp_auto' | 'email_logs'>('company');
  const [localSettings, setLocalSettings] = useState<AdminSettings>(settings);
  const [showWelcomePreviewModal, setShowWelcomePreviewModal] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);
  
  //WhatsApp test states
  const [waTestMobile, setWaTestMobile] = useState(() => settings.whatsappSenderNo || '8518880943');
  const [waTestName, setWaTestName] = useState('Rahul Sharma');
  const [copiedWaFormula, setCopiedWaFormula] = useState(false);
  const [formulaMode, setFormulaMode] = useState<'direct' | 'cellRef'>('direct');
  const [waTestStatus, setWaTestStatus] = useState<string | null>(null);
  
  //User Roles & Access states
  const [newAccName, setNewAccName] = useState('');
  const [newAccUsername, setNewAccUsername] = useState('');
  const [newAccPassword, setNewAccPassword] = useState('');
  const [newAccEmail, setNewAccEmail] = useState('');
  const [newAccMobileNo, setNewAccMobileNo] = useState('');
  const [newAccRole, setNewAccRole] = useState<string>('hr');
  const [newAccBranch, setNewAccBranch] = useState('');
  const [newAccBranches, setNewAccBranches] = useState<string[]>([]);
  const [roleFormError, setRoleFormError] = useState('');
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editingAccountPassword, setEditingAccountPassword] = useState<string>('');
  const [editingAccount, setEditingAccount] = useState<UserRoleAccount | null>(null);
  const [newMasterVal, setNewMasterVal] = useState<string>('');
  const [activeMasterList, setActiveMasterList] = useState<keyof Pick<AdminSettings, 'departments' | 'branches' | 'costCenters' | 'employeeGroups' | 'workTimings' | 'weeklyOffProfiles' | 'leaveTypes' | 'jobOpeningsList'>>('departments');
  const [activeConfigRole, setActiveConfigRole] = useState<string>('super_admin');
  const [rolesSubSection, setRolesSubSection] = useState<'columns' | 'matrix' | 'accounts' | 'custom_roles'>('columns');
  
  //Custom Roles CRUD states
  const [isNewRoleModalOpen, setIsNewRoleModalOpen] = useState(false);
  const [newRoleId, setNewRoleId] = useState('');
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [newRoleCopyFrom, setNewRoleCopyFrom] = useState('hr');
  const [roleModalError, setRoleModalError] = useState('');
  const [editingCustomRole, setEditingCustomRole] = useState<CustomRole | null>(null);
  const [editRoleName, setEditRoleName] = useState('');
  const [editRoleDesc, setEditRoleDesc] = useState('');

  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [confirmReset, setConfirmReset] = useState<boolean>(false);

  //SMTP Tester states
  const [testRecipient, setTestRecipient] = useState('');
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  //Geofencing Outlet Registration States
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
      //Retry with low accuracy
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setNewOutletLat(position.coords.latitude.toFixed(6));
          setNewOutletLng(position.coords.longitude.toFixed(6));
          setIsFetchingAdminCoords(false);
        },
        (fallbackError) => {
          console.warn("GPS error on fallback:", fallbackError);
          //Set Bangalore coordinates as fallback instead of failing/crashing
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
      alert("Please fill in all fields to add a secure outlet!");
      return;
    }
    const latNum = parseFloat(newOutletLat);
    const lngNum = parseFloat(newOutletLng);
    if (isNaN(latNum) || isNaN(lngNum)) {
      alert("Please enter valid numeric latitude and longitude coordinates.");
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

    //Reset Form
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

  //Corporate notices & HR Helpdesk management states
  const [newNoticeTitle, setNewNoticeTitle] = useState('');
  const [newNoticeTitleHi, setNewNoticeTitleHi] = useState('');
  const [newNoticeContent, setNewNoticeContent] = useState('');
  const [newNoticeContentHi, setNewNoticeContentHi] = useState('');
  const [newNoticeBadge, setNewNoticeBadge] = useState<'Critical' | 'Holiday' | 'General' | 'Policy'>('General');

  //Security Log Search/Filter States
  const [securitySearch, setSecuritySearch] = useState('');
  const [securityReasonFilter, setSecurityReasonFilter] = useState<'all' | 'Incorrect Password' | 'User ID not found' | 'Admin Incorrect Password'>('all');

  //Audit Logs Search & Filter States
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState<'all' | 'create' | 'update' | 'approve' | 'reject'>('all');

  //Database Backup, Sync, and Troubleshoot States
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
          throw new Error("Invalid JSON format.");
        }
        
        const empsCount = Array.isArray(parsed.employees) ? parsed.employees.length : 0;
        const attCount = Array.isArray(parsed.attendance) ? parsed.attendance.length : 0;
        const payCount = Array.isArray(parsed.payroll) ? parsed.payroll.length : 0;
        
        if (empsCount === 0 && attCount === 0 && payCount === 0) {
          throw new Error("Backup file is empty.");
        }

        setImportData(parsed);
        setImportSummary(
          `Backup file verified. It contains: ${empsCount} employees, ${attCount} attendance entries, and ${payCount} payroll records.`
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

  //Work Timing Specific Builder States
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
      
      //Company
      compName: "Company Name",
      compAddress: "Company Address",
      currencySymbol: "Currency Symbol",
      logoUrl: "Company Logo URL (Optional)",
      saveAll: "Save & Synchronize",
      resetDefault: "Reset to Default",

      //Field Config
      fieldColName: "Field Label",
      fieldColGroup: "SectionGroup",
      fieldColHidden: "Status",
      fieldColMandatory: "Mandatory?",
      mandatoryNote: "Fields set as 'Mandatory' will be validated during Employee Registration.",
      visible: "Visible",
      hidden: "Hidden",
      toggleVisibility: "Toggle Visibility",
      toggleMandatory: "Toggle Required Status",

      //Groups
      groupAll: "All Fields",
      groupDetail: "Employee Details",
      groupResidential: "Residential Address",
      groupPermanent: "Permanent Address",
      groupBank: "Bank Details",
      groupOther: "OtherTax Details",
      groupEmployment: "Employment Details",

      //Masters
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

      //Policy
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
      
      //Company
      compName: "Company Name",
      compAddress: "Company Address",
      currencySymbol: "Currency Symbol",
      logoUrl: "Company Logo URL (Optional)",
      saveAll: "Save & Synchronize",
      resetDefault: "Reset to Default",

      //Field Config
      fieldColName: "Field Label",
      fieldColGroup: "SectionGroup",
      fieldColHidden: "Status",
      fieldColMandatory: "Mandatory?",
      mandatoryNote: "Fields set as 'Mandatory' will be validated during Employee Registration.",
      visible: "Visible",
      hidden: "Hidden",
      toggleVisibility: "Toggle Visibility",
      toggleMandatory: "Toggle Required Status",

      //Groups
      groupAll: "All Fields",
      groupDetail: "Employee Details",
      groupResidential: "Residential Address",
      groupPermanent: "Permanent Address",
      groupBank: "Bank Details",
      groupOther: "OtherTax Details",
      groupEmployment: "Employment Details",

      //Masters
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

      //Policy
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
        alert("Please enter a shift name!");
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
      alert("Option already exists!");
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

  const masterFileInputRef = useRef<HTMLInputElement>(null);

  const exportAllMastersCSV = () => {
    const headers = ['Category', 'Option Name', 'Cost Center ID Prefix (Optional)'];
    const rows: string[][] = [];

    const categories: Array<{ key: keyof Pick<AdminSettings, 'departments' | 'branches' | 'costCenters' | 'employeeGroups' | 'workTimings' | 'weeklyOffProfiles' | 'leaveTypes' | 'jobOpeningsList'>; name: string }> = [
      { key: 'departments', name: 'Departments' },
      { key: 'branches', name: 'Branches' },
      { key: 'costCenters', name: 'Cost Centers' },
      { key: 'employeeGroups', name: 'Employee Groups' },
      { key: 'workTimings', name: 'Work Timings' },
      { key: 'weeklyOffProfiles', name: 'Weekly Off Profiles' },
      { key: 'leaveTypes', name: 'Leave Types' },
      { key: 'jobOpeningsList', name: 'Job OpeningsPositions' }
    ];

    categories.forEach(cat => {
      const items = (localSettings[cat.key] as string[]) || [];
      items.forEach(item => {
        let prefix = '';
        if (cat.key === 'costCenters') {
          prefix = getCostCenterPrefix(item, localSettings.costCenterCodes);
        }
        rows.push([cat.name, item, prefix]);
      });
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    link.download = `all_dropdown_masters_${dateStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportCurrentMasterCSV = () => {
    const listNameMap: Record<string, string> = {
      departments: 'Departments',
      branches: 'Branches',
      costCenters: 'Cost Centers',
      employeeGroups: 'Employee Groups',
      workTimings: 'Work Timings',
      weeklyOffProfiles: 'Weekly Off Profiles',
      leaveTypes: 'Leave Types',
      jobOpeningsList: 'Job OpeningsPositions'
    };

    const categoryName = listNameMap[activeMasterList] || activeMasterList;
    const items = (localSettings[activeMasterList] as string[]) || [];
    const headers = ['Category', 'Option Name', 'Cost Center ID Prefix (Optional)'];

    const rows = items.map(item => {
      let prefix = '';
      if (activeMasterList === 'costCenters') {
        prefix = getCostCenterPrefix(item, localSettings.costCenterCodes);
      }
      return [categoryName, item, prefix];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    link.download = `${activeMasterList}_master_export_${dateStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadMasterTemplate = () => {
    const headers = ['Category', 'Option Name', 'Cost Center ID Prefix (Optional)'];
    const sampleRows = [
      ['Departments', 'Quality Assurance', ''],
      ['Branches', 'Delhi NCR Office', ''],
      ['Cost Centers', 'Jaipur Hub', 'JPR'],
      ['Employee Groups', 'Contractual Staff', ''],
      ['Work Timings', 'General Shift (09:00 AM - 06:00 PM)', ''],
      ['Weekly Off Profiles', 'Sunday Only', ''],
      ['Leave Types', 'Maternity Leave', '']
    ];

    const csvContent = [
      headers.join(','),
      ...sampleRows.map(row => row.map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dropdown_masters_template.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleMasterCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r\n|\n/).map(l => l.trim()).filter(Boolean);
      if (lines.length === 0) {
        alert('CSV file is empty!');
        return;
      }

      const parseCSVLine = (line: string): string[] => {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
              current += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      };

      const rows = lines.map(parseCSVLine);
      const firstRow = rows[0] || [];
      const isHeader = firstRow.some(col => 
        ['category', 'option name', 'name', 'cost center', 'department', 'branch', 'option'].includes(col.toLowerCase())
      );

      const dataRows = isHeader ? rows.slice(1) : rows;

      let catIdx = -1;
      let nameIdx = -1;
      let prefixIdx = -1;

      if (isHeader) {
        firstRow.forEach((col, idx) => {
          const lower = col.toLowerCase().replace(/[\s_*-]/g, '');
          if (['category', 'type', 'list', 'master'].includes(lower)) catIdx = idx;
          if (['optionname', 'name', 'title', 'value', 'item', 'option'].includes(lower)) nameIdx = idx;
          if (['costcenteridprefix', 'idprefix', 'prefix', 'code'].includes(lower)) prefixIdx = idx;
        });
      }

      if (nameIdx === -1) {
        if (catIdx === 0) nameIdx = 1;
        else nameIdx = catIdx === -1 ? 0 : 1;
      }

      let addedCount = 0;
      const updatedSettings = { ...localSettings };
      const updatedCostCenterCodes = { ...(localSettings.costCenterCodes || {}) };

      const normalizeCat = (catStr: string): keyof Pick<AdminSettings, 'departments' | 'branches' | 'costCenters' | 'employeeGroups' | 'workTimings' | 'weeklyOffProfiles' | 'leaveTypes'> | null => {
        const s = catStr.toLowerCase().replace(/[\s_-]/g, '');
        if (s.includes('dept') || s.includes('department')) return 'departments';
        if (s.includes('branch')) return 'branches';
        if (s.includes('cost')) return 'costCenters';
        if (s.includes('group')) return 'employeeGroups';
        if (s.includes('timing') || s.includes('shift')) return 'workTimings';
        if (s.includes('weeklyoff') || s.includes('off')) return 'weeklyOffProfiles';
        if (s.includes('leave')) return 'leaveTypes';
        return null;
      };

      dataRows.forEach(row => {
        if (!row || row.length === 0) return;
        const optName = (row[nameIdx] || (catIdx === -1 ? row[0] : '') || '').trim();
        if (!optName) return;

        let targetCat: keyof Pick<AdminSettings, 'departments' | 'branches' | 'costCenters' | 'employeeGroups' | 'workTimings' | 'weeklyOffProfiles' | 'leaveTypes'> | null = null;
        if (catIdx !== -1 && row[catIdx]) {
          targetCat = normalizeCat(row[catIdx]);
        }
        if (!targetCat) {
          targetCat = activeMasterList;
        }

        const currentItems = (updatedSettings[targetCat] as string[]) || [];
        if (!currentItems.some(item => item.toLowerCase() === optName.toLowerCase())) {
          updatedSettings[targetCat] = [...currentItems, optName] as any;
          addedCount++;

          if (targetCat === 'costCenters' && prefixIdx !== -1 && row[prefixIdx]) {
            const prefixVal = row[prefixIdx].trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
            if (prefixVal) {
              updatedCostCenterCodes[optName] = prefixVal;
            }
          }
        }
      });

      if (addedCount > 0) {
        updatedSettings.costCenterCodes = updatedCostCenterCodes;
        setLocalSettings(updatedSettings);
        alert(
          `Successfully imported ${addedCount} new dropdown option(s) into Master Lists!`
        );
      } else {
        alert(
          'No new dropdown options were added (items may already exist).'
        );
      }
    };

    reader.readAsText(file);
    e.target.value = '';
  };

  const roleAccounts = localSettings.roleAccounts || [];
  const customRoles: CustomRole[] = localSettings.customRoles || [];

  const allRoles: RoleDefinition[] = useMemo(() => {
    const customDefs: RoleDefinition[] = customRoles.map(cr => ({
      id: cr.id,
      name: cr.name,
      description: cr.description || `Custom defined role: ${cr.name}`,
      isCustom: true
    }));
    return [...BUILTIN_ROLES, ...customDefs];
  }, [customRoles]);

  const rolePermissions = {
    ...DEFAULT_ROLE_PERMISSIONS,
    ...(localSettings.rolePermissions || {})
  };

  const roleColumnPermissions = {
    ...DEFAULT_ROLE_COLUMN_PERMISSIONS,
    ...(localSettings.roleColumnPermissions || {})
  };

  const isColumnChecked = (role: string, columnKey: string): boolean => {
    if (role === 'super_admin' || role === 'admin') return true;
    const list = roleColumnPermissions[role] || DEFAULT_ROLE_COLUMN_PERMISSIONS[role] || [];
    if (list.includes('all')) return true;
    return list.includes(columnKey);
  };

  const handleToggleColumnPermission = (role: string, columnKey: string) => {
    if (role === 'super_admin' || role === 'admin') return;
    const currentList = [...(roleColumnPermissions[role] || DEFAULT_ROLE_COLUMN_PERMISSIONS[role] || [])];
    
    let updatedList: string[] = [];
    if (currentList.includes('all')) {
      const allItemIds = PERMISSION_COLUMNS.flatMap(cat => cat.items.map(it => it.id));
      updatedList = allItemIds.filter(id => id !== columnKey);
    } else if (currentList.includes(columnKey)) {
      updatedList = currentList.filter(id => id !== columnKey);
    } else {
      updatedList = [...currentList, columnKey];
    }

    setLocalSettings({
      ...localSettings,
      roleColumnPermissions: {
        ...roleColumnPermissions,
        [role]: updatedList
      }
    });
  };

  const handleSelectAllColumnsForRole = (role: string) => {
    setLocalSettings({
      ...localSettings,
      roleColumnPermissions: {
        ...roleColumnPermissions,
        [role]: ['all']
      }
    });
  };

  const handleHideSensitiveForRole = (role: string) => {
    const nonSensitiveIds = PERMISSION_COLUMNS.flatMap(cat => 
      cat.items.filter(it => !it.sensitive).map(it => it.id)
    );
    setLocalSettings({
      ...localSettings,
      roleColumnPermissions: {
        ...roleColumnPermissions,
        [role]: nonSensitiveIds
      }
    });
  };

  const handleResetColumnPermissions = (role: string) => {
    const defaultCols = DEFAULT_ROLE_COLUMN_PERMISSIONS[role] || ['id', 'name', 'role', 'branch', 'status', 'mobileNo'];
    setLocalSettings({
      ...localSettings,
      roleColumnPermissions: {
        ...roleColumnPermissions,
        [role]: defaultCols
      }
    });
  };

  const handleAddCustomRole = () => {
    setRoleModalError('');
    const cleanId = newRoleId.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const cleanName = newRoleName.trim();
    if (!cleanId) {
      setRoleModalError('Role Identifier (code) is required (e.g. auditor, store_manager).');
      return;
    }
    if (!cleanName) {
      setRoleModalError('Role Display Name is required (e.g. Store Manager).');
      return;
    }
    if (allRoles.some(r => r.id.toLowerCase() === cleanId)) {
      setRoleModalError(`Role identifier "${cleanId}" already exists. Please choose another.`);
      return;
    }

    const newRoleObj: CustomRole = {
      id: cleanId,
      name: cleanName,
      description: newRoleDesc.trim() || `Custom defined role: ${cleanName}`,
      isCustom: true,
      createdAt: new Date().toISOString()
    };

    const templatePermissions = rolePermissions[newRoleCopyFrom] || DEFAULT_ROLE_PERMISSIONS[newRoleCopyFrom] || [];
    const templateColPermissions = roleColumnPermissions[newRoleCopyFrom] || DEFAULT_ROLE_COLUMN_PERMISSIONS[newRoleCopyFrom] || [];

    setLocalSettings({
      ...localSettings,
      customRoles: [...customRoles, newRoleObj],
      rolePermissions: {
        ...rolePermissions,
        [cleanId]: [...templatePermissions]
      },
      roleColumnPermissions: {
        ...roleColumnPermissions,
        [cleanId]: [...templateColPermissions]
      }
    });

    setActiveConfigRole(cleanId);
    setIsNewRoleModalOpen(false);
    setNewRoleId('');
    setNewRoleName('');
    setNewRoleDesc('');
    setNewRoleCopyFrom('hr');
  };

  const handleUpdateCustomRole = () => {
    if (!editingCustomRole) return;
    if (!editRoleName.trim()) {
      alert('Role Name cannot be empty.');
      return;
    }
    const updatedCustomRoles = customRoles.map(cr => {
      if (cr.id === editingCustomRole.id) {
        return {
          ...cr,
          name: editRoleName.trim(),
          description: editRoleDesc.trim() || cr.description
        };
      }
      return cr;
    });

    setLocalSettings({
      ...localSettings,
      customRoles: updatedCustomRoles
    });

    setEditingCustomRole(null);
  };

  const handleDeleteCustomRole = (roleId: string) => {
    if (BUILTIN_ROLES.some(br => br.id === roleId)) {
      alert('Built-in system roles cannot be deleted.');
      return;
    }
    const assignedAccounts = roleAccounts.filter(acc => acc.role === roleId);
    if (assignedAccounts.length > 0) {
      alert(`Cannot delete role "${roleId}" because ${assignedAccounts.length} user account(s) (${assignedAccounts.map(a => a.name).join(', ')}) are currently assigned to it. Please reassign their roles first.`);
      return;
    }

    if (!confirm(`Are you sure you want to delete custom role "${roleId}"? All permissions for this role will also be removed.`)) {
      return;
    }

    const updatedCustomRoles = customRoles.filter(cr => cr.id !== roleId);
    const updatedRolePerms = { ...rolePermissions };
    delete updatedRolePerms[roleId];
    const updatedColPerms = { ...roleColumnPermissions };
    delete updatedColPerms[roleId];

    setLocalSettings({
      ...localSettings,
      customRoles: updatedCustomRoles,
      rolePermissions: updatedRolePerms,
      roleColumnPermissions: updatedColPerms
    });

    if (activeConfigRole === roleId) {
      setActiveConfigRole('super_admin');
    }
  };

  const PERMISSION_MODULES = [
    { id: 'dashboard', labelEn: 'System Dashboard', labelHi: "" },
    { id: 'employees', labelEn: 'Employee Registry', labelHi: "" },
    { id: 'hiring_onboarding', labelEn: 'Hiring & Onboarding', labelHi: "" },
    { id: 'employee_lifecycle', labelEn: 'Lifecycle & Progression', labelHi: "" },
    { id: 'asset_management', labelEn: 'Asset Management', labelHi: "" },
    { id: 'attendance', labelEn: 'Attendance & Logs', labelHi: "" },
    { id: 'payroll', labelEn: 'Payroll & Payslips', labelHi: "" },
    { id: 'leaves', labelEn: 'Leaves & Holidays', labelHi: "" },
    { id: 'exit_management', labelEn: 'Exit & Clearance', labelHi: "" },
    { id: 'ledger', labelEn: 'Employee Ledger', labelHi: "" },
    { id: 'notices_support', labelEn: 'Notices & HR Helpdesk', labelHi: "" },
    { id: 'admin', labelEn: 'System Settings', labelHi: "" },
  ];

  const getActionForColumn = (modId: string, colIndex: number) => {
    if (colIndex === 0) {
      return { id: 'view', label: 'View' };
    }
    if (colIndex === 1) {
      let label = 'Add';
      if (modId === 'attendance') label = 'Bulk Punch';
      if (modId === 'payroll') label = 'Calculate';
      if (modId === 'leaves') label = 'Add Holiday';
      if (modId === 'hiring_onboarding') label = 'Add Candidate';
      if (modId === 'employee_lifecycle') label = 'Issue Item';
      if (modId === 'asset_management') label = 'Add Asset';
      if (modId === 'exit_management') label = 'Add Exit';
      if (modId === 'ledger') label = 'Add Entry';
      if (modId === 'notices_support') label = 'Create Notice';
      if (modId === 'admin') label = 'Add User';
      return { id: 'add', label };
    }
    if (colIndex === 2) {
      let label = 'Edit';
      if (modId === 'attendance') label = 'Adjust Log';
      if (modId === 'payroll') label = 'Adjust';
      if (modId === 'leaves') label = 'Edit Holiday';
      if (modId === 'hiring_onboarding') label = 'Update Stage';
      if (modId === 'employee_lifecycle') label = 'Edit Record';
      if (modId === 'asset_management') label = 'Assign Asset';
      if (modId === 'exit_management') label = 'Clearance';
      if (modId === 'notices_support') label = 'Edit Notice';
      if (modId === 'admin') label = 'Edit Config';
      return { id: 'edit', label };
    }
    if (colIndex === 3) {
      let id = 'delete';
      let label = 'Delete';
      if (modId === 'employees') label = 'Deactivate';
      if (modId === 'attendance') { id = 'approve'; label = 'Approve'; }
      if (modId === 'payroll') label = 'Mark Paid';
      if (modId === 'leaves') label = 'Delete Holiday';
      if (modId === 'hiring_onboarding') { id = 'approve'; label = 'Hire Candidate'; }
      if (modId === 'employee_lifecycle') label = 'End Promotion';
      if (modId === 'asset_management') label = 'Return Asset';
      if (modId === 'exit_management') { id = 'approve'; label = 'Approve Exit'; }
      if (modId === 'notices_support') label = 'Delete Notice';
      if (modId === 'admin') label = 'Clear Logs';
      return { id, label };
    }
    return null;
  };

  const handleToggleFineGrainedPermission = (role: string, modId: string, actionId: string) => {
    const updatedPermissions = { ...rolePermissions };
    const currentList = [...(updatedPermissions[role] || DEFAULT_ROLE_PERMISSIONS[role] || [])];
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
    const list = rolePermissions[role] || DEFAULT_ROLE_PERMISSIONS[role] || [];
    return list.includes(`${modId}:${actionId}`) || list.includes(modId);
  };

  const handleSelectAllForRole = (role: string) => {
    const allModuleIds = PERMISSION_MODULES.map(m => m.id);
    setLocalSettings({
      ...localSettings,
      rolePermissions: {
        ...rolePermissions,
        [role]: allModuleIds
      }
    });
  };

  const handleResetRolePermissions = (role: string) => {
    setLocalSettings({
      ...localSettings,
      rolePermissions: {
        ...rolePermissions,
        [role]: DEFAULT_ROLE_PERMISSIONS[role] || []
      }
    });
  };

  const handleAddRoleAccount = () => {
    if (!newAccName.trim() || !newAccUsername.trim() || !newAccPassword.trim()) {
      setRoleFormError('Please fill in all fields');
      return;
    }
    
    //Check if username already exists
    const exists = roleAccounts.some(acc => acc.username.toLowerCase() === newAccUsername.trim().toLowerCase());
    if (exists || newAccUsername.trim().toLowerCase() === (localSettings.adminUsername || 'admin').toLowerCase()) {
      setRoleFormError('Username already exists');
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
      branch: newAccBranches.length > 0 ? newAccBranches[0] : undefined,
      branches: newAccBranches.length > 0 ? newAccBranches : undefined,
      createdAt: new Date().toISOString()
    };

    setLocalSettings({
      ...localSettings,
      roleAccounts: [...roleAccounts, newAcc]
    });

    //Reset form
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
      alert("Please enter a valid recipient email address!");
      return;
    }
    
    setIsTestingSmtp(true);
    setTestResult(null);
    
    try {
      const response = await fetch(' //api/test-smtp', {
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
          message: `Live SMTP Dispatch Success! A secure test verification email has been successfully delivered to ${testRecipient.trim()} via ${localSettings.smtpHost}.`
        });
      } else {
        setTestResult({
          success: false,
          message: resData.error || ("SMTP dispatch failed. Please verify credentials.")
        });
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.message || ("Connection timed out or network error.")
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
    <div className="bg-white dark:bg-[#11221b] rounded-lg border border-gray-200 dark:border-[#1e3a2f] shadow-sm overflow-hidden" id="admin-settings-container">
      {/* Admin Title Banner */}
      <div className="bg-gradient-to-r from-[#03623c] to-[#024d2e] dark:from-[#06120c] dark:to-[#0f241a] text-white p-6 border-b border-emerald-700/30 dark:border-[#1e3a2f]">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#03623c] rounded-lg text-white">
            <SettingsIcon className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <h2 className="text-base font-bold font-display tracking-tight text-white">{t.adminTitle}</h2>
            <p className="text-[11px] text-slate-300 dark:text-slate-400 font-medium">{t.adminSub}</p>
          </div>
        </div>
      </div>

      {/* Save Alert Banner */}
      {saveSuccess && (
        <div className="bg-emerald-50 dark:bg-emerald-950/60 border-y border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 px-5 py-3 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{t.savedAlert}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row min-h-[500px]">
        {/* Left Sub-Tabs Nav */}
        <aside className="w-full md:w-56 border-r border-gray-100 dark:border-[#1e3a2f] bg-slate-50/60 dark:bg-[#0b1812] p-4 shrink-0 flex flex-row md:flex-col gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('company')}
            className={`flex items-center md:items-start gap-2.5 px-3 py-2 text-xs font-bold rounded-md transition-all text-left whitespace-nowrap md:whitespace-normal cursor-pointer ${
              activeSubTab === 'company'
                ? 'bg-[#03623c] text-white shadow-xs border border-[#024d2e] dark:bg-[#03623c] dark:text-white dark:border-emerald-600'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Building className="w-3.5 h-3.5 shrink-0 md:mt-0.5" />
            <span>{t.tabCompany}</span>
          </button>
          
          <button
            onClick={() => setActiveSubTab('fields')}
            className={`flex items-center md:items-start gap-2.5 px-3 py-2 text-xs font-bold rounded-md transition-all text-left whitespace-nowrap md:whitespace-normal cursor-pointer ${
              activeSubTab === 'fields'
                ? 'bg-[#03623c] text-white shadow-xs border border-[#024d2e] dark:bg-[#03623c] dark:text-white dark:border-emerald-600'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ToggleLeft className="w-3.5 h-3.5 shrink-0 md:mt-0.5" />
            <span>{t.tabFields}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('masters')}
            className={`flex items-center md:items-start gap-2.5 px-3 py-2 text-xs font-bold rounded-md transition-all text-left whitespace-nowrap md:whitespace-normal cursor-pointer ${
              activeSubTab === 'masters'
                ? 'bg-[#03623c] text-white shadow-xs border border-[#024d2e] dark:bg-[#03623c] dark:text-white dark:border-emerald-600'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <List className="w-3.5 h-3.5 shrink-0 md:mt-0.5" />
            <span>{t.tabMasters}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('policy')}
            className={`flex items-center md:items-start gap-2.5 px-3 py-2 text-xs font-bold rounded-md transition-all text-left whitespace-nowrap md:whitespace-normal cursor-pointer ${
              activeSubTab === 'policy'
                ? 'bg-[#03623c] text-white shadow-xs border border-[#024d2e] dark:bg-[#03623c] dark:text-white dark:border-emerald-600'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <SettingsIcon className="w-3.5 h-3.5 shrink-0 md:mt-0.5" />
            <span>{t.tabPolicy}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('security')}
            className={`flex items-center md:items-start gap-2.5 px-3 py-2 text-xs font-bold rounded-md transition-all text-left whitespace-nowrap md:whitespace-normal cursor-pointer relative ${
              activeSubTab === 'security'
                ? 'bg-[#03623c] text-white shadow-xs border border-[#024d2e] dark:bg-[#03623c] dark:text-white dark:border-emerald-600'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
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
                ? 'bg-[#03623c] text-white shadow-xs border border-[#024d2e] dark:bg-[#03623c] dark:text-white dark:border-emerald-600'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5 shrink-0 md:mt-0.5" />
            <span>{t.tabDatabase}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('archive_storage')}
            className={`flex items-center md:items-start gap-2.5 px-3 py-2 text-xs font-bold rounded-md transition-all text-left whitespace-nowrap md:whitespace-normal cursor-pointer relative ${
              activeSubTab === 'archive_storage'
                ? 'bg-[#03623c] text-white shadow-xs border border-[#024d2e] dark:bg-[#03623c] dark:text-white dark:border-emerald-600'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Archive className="w-3.5 h-3.5 shrink-0 md:mt-0.5 text-emerald-400" />
            <span>{'Archive & Storage'}</span>
            {(archivedEmployees.length + archivedCandidates.length) > 0 && (
              <span className="ml-auto bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.2 text-[9px] font-mono rounded-full font-bold">
                {archivedEmployees.length + archivedCandidates.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('email_smtp')}
            className={`flex items-center md:items-start gap-2.5 px-3 py-2 text-xs font-bold rounded-md transition-all text-left whitespace-nowrap md:whitespace-normal cursor-pointer relative ${
              activeSubTab === 'email_smtp'
                ? 'bg-[#03623c] text-white shadow-xs border border-[#024d2e] dark:bg-[#03623c] dark:text-white dark:border-emerald-600'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5 shrink-0 md:mt-0.5" />
            <span>{(t as any).tabEmailSmtp}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('whatsapp_auto')}
            className={`flex items-center md:items-start gap-2.5 px-3 py-2 text-xs font-bold rounded-md transition-all text-left whitespace-nowrap md:whitespace-normal cursor-pointer relative ${
              activeSubTab === 'whatsapp_auto'
                ? 'bg-[#03623c] text-white shadow-xs border border-[#024d2e] dark:bg-[#03623c] dark:text-white dark:border-emerald-600'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 shrink-0 md:mt-0.5 text-emerald-500" />
            <span>{'WhatsApp & Email Auto'}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('roles_permissions')}
            className={`flex items-center md:items-start gap-2.5 px-3 py-2 text-xs font-bold rounded-md transition-all text-left whitespace-nowrap md:whitespace-normal cursor-pointer relative ${
              activeSubTab === 'roles_permissions'
                ? 'bg-[#03623c] text-white shadow-xs border border-[#024d2e] dark:bg-[#03623c] dark:text-white dark:border-emerald-600'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 shrink-0 md:mt-0.5" />
            <span>{'User Roles & Access'}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('audit_logs')}
            className={`flex items-center md:items-start gap-2.5 px-3 py-2 text-xs font-bold rounded-md transition-all text-left whitespace-nowrap md:whitespace-normal cursor-pointer relative ${
              activeSubTab === 'audit_logs'
                ? 'bg-[#03623c] text-white shadow-xs border border-[#024d2e] dark:bg-[#03623c] dark:text-white dark:border-emerald-600'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5 shrink-0 md:mt-0.5" />
            <span>{'User Audit Report'}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('email_logs')}
            className={`flex items-center md:items-start gap-2.5 px-3 py-2 text-xs font-bold rounded-md transition-all text-left whitespace-nowrap md:whitespace-normal cursor-pointer relative ${
              activeSubTab === 'email_logs'
                ? 'bg-[#03623c] text-white shadow-xs border border-[#024d2e] dark:bg-[#03623c] dark:text-white dark:border-emerald-600'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5 shrink-0 md:mt-0.5 text-blue-500" />
            <span>{'Email History'}</span>
            {emailLogs.length > 0 && (
              <span className="ml-auto bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.2 text-[9px] font-mono rounded-full font-bold">
                {emailLogs.length}
              </span>
            )}
          </button>

          <div className="hidden md:block pt-6 mt-6 border-t border-gray-200/60 dark:border-[#1e3a2f]">
            <button
              onClick={handleResetToDefault}
              className={`flex items-center gap-1.5 w-full text-left px-3 py-1.5 text-[10px] font-bold rounded transition-all cursor-pointer ${
                confirmReset 
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 animate-pulse'
                  : 'text-red-600 dark:text-rose-400 bg-red-50 dark:bg-rose-950/30 hover:bg-red-100 dark:hover:bg-rose-900/40 hover:text-red-700 dark:hover:text-rose-300 border border-red-200/50 dark:border-rose-900/50'
              }`}
            >
              <Undo className="w-3 h-3" />
              {confirmReset ? ("Confirm Reset!") : t.resetDefault}
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
                  className="w-full border border-gray-200 px-3 py-1.5 rounded text-xs font-semibold focus:ring-1 focus:ring-[#03623c] focus:outline-none" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">{t.compAddress}</label>
                <textarea 
                  rows={3}
                  value={localSettings.companyAddress}
                  onChange={(e) => setLocalSettings({...localSettings, companyAddress: e.target.value})}
                  className="w-full border border-gray-200 px-3 py-1.5 rounded text-xs font-semibold focus:ring-1 focus:ring-[#03623c] focus:outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">{t.currencySymbol}</label>
                  <input 
                    type="text" 
                    value={localSettings.currency}
                    onChange={(e) => setLocalSettings({...localSettings, currency: e.target.value})}
                    className="w-full border border-gray-200 px-3 py-1.5 rounded text-xs font-semibold focus:ring-1 focus:ring-[#03623c] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">{t.logoUrl}</label>
                  <input 
                    type="text" 
                    placeholder="https://example.com/logo.png"
                    value={localSettings.companyLogo || ''}
                    onChange={(e) => setLocalSettings({...localSettings, companyLogo: e.target.value})}
                    className="w-full border border-gray-200 px-3 py-1.5 rounded text-xs font-semibold focus:ring-1 focus:ring-[#03623c] focus:outline-none" />
                </div>
              </div>

              {/* Admin login credentials card */}
              <div className="border-t border-dashed border-gray-200 pt-4 mt-4 space-y-4">
                <h4 className="text-xs font-black text-[#03623c] uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  Admin Login Credentials
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Admin Username</label>
                    <input 
                      type="text" 
                      value={localSettings.adminUsername || 'admin'}
                      onChange={(e) => setLocalSettings({...localSettings, adminUsername: e.target.value})}
                      className="w-full border border-gray-200 px-3 py-1.5 rounded text-xs font-semibold focus:ring-1 focus:ring-[#03623c] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Admin Password</label>
                    <input 
                      type="text" 
                      value={localSettings.adminPassword || 'admin123'}
                      onChange={(e) => setLocalSettings({...localSettings, adminPassword: e.target.value})}
                      className="w-full border border-gray-200 px-3 py-1.5 rounded text-xs font-semibold focus:ring-1 focus:ring-[#03623c] focus:outline-none" />
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 font-medium">Use these credentials on the portal login screen to sign in as the System Administrator.</p>
              </div>

              {/* Login Screen Portal Info Customization */}
              <div className="border-t border-dashed border-gray-200 pt-4 mt-4 space-y-4">
                <h4 className="text-xs font-black text-[#03623c] uppercase tracking-wider flex items-center gap-1.5">
                  <Megaphone className="w-3.5 h-3.5" />
                  Login Info Desk Settings
                </h4>
                
                <div className="space-y-2">
                  <span className="text-[11px] font-black uppercase text-[#03623c] tracking-wider block">
                    1. HR Helpdesk Contact
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">HR Manager / Desk</label>
                      <input 
                        type="text" 
                        value={localSettings.hrContactManager || ''}
                        onChange={(e) => setLocalSettings({...localSettings, hrContactManager: e.target.value})}
                        placeholder="e.g. Rathi HR Desk"
                        className="w-full border border-gray-200 px-3 py-1.5 rounded text-xs font-semibold focus:ring-1 focus:ring-[#03623c] focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">HR Email</label>
                      <input 
                        type="email" 
                        value={localSettings.hrContactEmail || ''}
                        onChange={(e) => setLocalSettings({...localSettings, hrContactEmail: e.target.value})}
                        placeholder="e.g. hr@rathibuildmart.com"
                        className="w-full border border-gray-200 px-3 py-1.5 rounded text-xs font-semibold focus:ring-1 focus:ring-[#03623c] focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">HR Phone</label>
                      <input 
                        type="text" 
                        value={localSettings.hrContactPhone || ''}
                        onChange={(e) => setLocalSettings({...localSettings, hrContactPhone: e.target.value})}
                        placeholder="e.g. +91 91111 22222"
                        className="w-full border border-gray-200 px-3 py-1.5 rounded text-xs font-semibold focus:ring-1 focus:ring-[#03623c] focus:outline-none" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 border-t border-gray-200/80 pt-3">
                  <span className="text-[11px] font-black uppercase text-teal-700 tracking-wider block">
                    2. IT Management & Tech Support
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">IT Manager / Desk</label>
                      <input 
                        type="text" 
                        value={localSettings.itContactManager || ''}
                        onChange={(e) => setLocalSettings({...localSettings, itContactManager: e.target.value})}
                        placeholder="e.g. IT & System Management Desk"
                        className="w-full border border-gray-200 px-3 py-1.5 rounded text-xs font-semibold focus:ring-1 focus:ring-[#03623c] focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">IT Email</label>
                      <input 
                        type="email" 
                        value={localSettings.itContactEmail || ''}
                        onChange={(e) => setLocalSettings({...localSettings, itContactEmail: e.target.value})}
                        placeholder="e.g. it.support@rathibuildmart.com"
                        className="w-full border border-gray-200 px-3 py-1.5 rounded text-xs font-semibold focus:ring-1 focus:ring-[#03623c] focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">IT Phone</label>
                      <input 
                        type="text" 
                        value={localSettings.itContactPhone || ''}
                        onChange={(e) => setLocalSettings({...localSettings, itContactPhone: e.target.value})}
                        placeholder="e.g. +91 98888 77777"
                        className="w-full border border-gray-200 px-3 py-1.5 rounded text-xs font-semibold focus:ring-1 focus:ring-[#03623c] focus:outline-none" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Standard Shift</label>
                    <input 
                      type="text" 
                      value={localSettings.rulesShiftTiming || ''}
                      onChange={(e) => setLocalSettings({...localSettings, rulesShiftTiming: e.target.value})}
                      placeholder="e.g. 09:30 AM - 06:30 PM"
                      className="w-full border border-gray-200 px-3 py-1.5 rounded text-xs font-semibold focus:ring-1 focus:ring-[#03623c] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Half-Day Limit</label>
                    <input 
                      type="text" 
                      value={localSettings.rulesHalfDaySlot || ''}
                      onChange={(e) => setLocalSettings({...localSettings, rulesHalfDaySlot: e.target.value})}
                      placeholder="e.g. Before 01:30 PM"
                      className="w-full border border-gray-200 px-3 py-1.5 rounded text-xs font-semibold focus:ring-1 focus:ring-[#03623c] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Late Mark Grace</label>
                    <input 
                      type="text" 
                      value={localSettings.rulesLatePunchGrace || ''}
                      onChange={(e) => setLocalSettings({...localSettings, rulesLatePunchGrace: e.target.value})}
                      placeholder="e.g. 09:45 AM"
                      className="w-full border border-gray-200 px-3 py-1.5 rounded text-xs font-semibold focus:ring-1 focus:ring-[#03623c] focus:outline-none" />
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 font-medium">These details appear dynamically on the portal login screen notices under "HR & Mgmt" and "Timings" tabs.</p>
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
                              {f.isMandatory ? ('Required') : ('Optional')}
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
              {/* Bulk Master CSV Header Card */}
              <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-emerald-100/80 pb-3">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <Upload className="w-4 h-4 text-emerald-700" />
                      {'Bulk Master Options Upload & Export (CSV)'}
                    </h4>
                    <p className="text-[11px] text-emerald-700 font-medium">
                      {'Download current dropdown options, edit in Excel/CSV, and re-upload to update all master lists in bulk.'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <input
                      type="file"
                      ref={masterFileInputRef}
                      onChange={handleMasterCSVUpload}
                      accept=".csv,.txt"
                      className="hidden" />
                    <button
                      type="button"
                      onClick={() => masterFileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#03623c] hover:bg-[#024d2e] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-3xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {'Bulk Upload CSV'}
                    </button>
                    <button
                      type="button"
                      onClick={exportAllMastersCSV}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-emerald-100 border border-emerald-200 text-xs font-bold text-emerald-800 rounded-lg transition-colors cursor-pointer shadow-3xs"
                      title="Export all 7 master dropdown lists to a single CSV"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {'Export All Masters'}
                    </button>
                    <button
                      type="button"
                      onClick={exportCurrentMasterCSV}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-blue-50 border border-blue-200 text-xs font-bold text-blue-700 rounded-lg transition-colors cursor-pointer shadow-3xs"
                      title="Export selected list to CSV"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {'Export Current List'}
                    </button>
                    <button
                      type="button"
                      onClick={downloadMasterTemplate}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-100 border border-gray-200 text-xs font-semibold text-gray-700 rounded-lg transition-colors cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-gray-500" />
                      {'Sample Template'}
                    </button>
                  </div>
                </div>

                {/* CSV Format Quick Guide */}
                <div className="bg-white/80 rounded-lg p-2.5 border border-emerald-100/60 text-[11px] text-emerald-950 space-y-1">
                  <div className="font-bold flex items-center gap-1 text-emerald-900">
                    <span>💡 {'How to fill data in Excel/CSV:'}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1 font-mono text-[10px]">
                    <div className="bg-emerald-50/50 p-1.5 rounded border border-emerald-100">
                      <strong className="text-emerald-900 font-sans block text-[11px]">Column A: Category</strong>
                      Departments, Branches, Cost Centers, Employee Groups, Work Timings, Weekly Off Profiles, Leave Types
                    </div>
                    <div className="bg-emerald-50/50 p-1.5 rounded border border-emerald-100">
                      <strong className="text-emerald-900 font-sans block text-[11px]">Column B: Option Name</strong>
                      Quality Assurance, General Shift (09:00 AM - 06:00 PM), Sunday Only, Maternity Leave, etc.
                    </div>
                    <div className="bg-emerald-50/50 p-1.5 rounded border border-emerald-100">
                      <strong className="text-emerald-900 font-sans block text-[11px]">Column C: Prefix Code (Optional)</strong>
                      For Cost Centers only (e.g., JPR for Jaipur Hub, RPR for Raipur Store)
                    </div>
                  </div>
                </div>
              </div>

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
                  <option value="jobOpeningsList">{'Job OpeningsRecruitment Positions'}</option>
                </select>
              </div>

              {/* Master options listing */}
              <div className="border border-gray-200 rounded-lg p-4 bg-slate-50/50 space-y-3.5 shadow-2xs">
                {activeMasterList === 'workTimings' ? (
                  <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3 shadow-3xs">
                    <div className="font-extrabold text-[11px] text-[#03623c] uppercase tracking-wider">
                      {'Shift Timing Builder'}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                          {'Shift Name'}
                        </label>
                        <input
                          type="text"
                          value={shiftName}
                          placeholder={"e.g. General Shift, Night Shift"}
                          onChange={(e) => setShiftName(e.target.value)}
                          className="w-full border border-gray-200 px-3 py-1.5 rounded-lg text-xs bg-white focus:ring-1 focus:ring-[#03623c] focus:outline-none font-semibold text-gray-800" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                          {'Check-In Time'}
                        </label>
                        <input
                          type="time"
                          value={shiftStart}
                          onChange={(e) => setShiftStart(e.target.value)}
                          className="w-full border border-gray-200 px-3 py-1.5 rounded-lg text-xs bg-white focus:ring-1 focus:ring-[#03623c] focus:outline-none font-semibold text-gray-800" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                          {'Check-Out Time'}
                        </label>
                        <input
                          type="time"
                          value={shiftEnd}
                          onChange={(e) => setShiftEnd(e.target.value)}
                          className="w-full border border-gray-200 px-3 py-1.5 rounded-lg text-xs bg-white focus:ring-1 focus:ring-[#03623c] focus:outline-none font-semibold text-gray-800" />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-gray-100">
                      <div className="text-[11px] text-gray-500 font-semibold">
                        <span>{'Compiled Preview:'} </span>
                        <code className="bg-[#03623c]/5 px-2 py-0.5 rounded font-mono font-bold text-[#03623c] text-xs">
                          {shiftName.trim() || 'Shift'} ({formatTo12Hour(shiftStart)} - {formatTo12Hour(shiftEnd)})
                        </code>
                      </div>
                      <button
                        onClick={handleAddMasterItem}
                        className="bg-[#03623c] hover:bg-[#024d2e] text-white px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-3xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {'Add Shift'}
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
                      className="flex-1 border border-gray-200 px-3 py-1.5 rounded text-xs bg-white focus:ring-1 focus:ring-[#03623c] focus:outline-none" />
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
                    ((localSettings[activeMasterList] as string[]) || []).map((item, index) => {
                      const prefix = activeMasterList === 'costCenters' ? getCostCenterPrefix(item, localSettings.costCenterCodes) : '';
                      return (
                        <div key={index} className="flex items-center justify-between py-2 px-3 hover:bg-slate-50 transition-colors">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-gray-800">{item}</span>
                            {activeMasterList === 'costCenters' && (
                              <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                                <span className="font-semibold text-gray-500">ID Prefix:</span>
                                <span className="text-emerald-800 dark:text-emerald-200 font-bold">{prefix}</span>
                                <span className="text-[9px] text-emerald-600/70 font-normal">({prefix}001, {prefix}002...)</span>
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => handleRemoveMasterItem(item)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })
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
                    className="w-full border border-gray-200 px-3 py-1.5 rounded text-xs font-semibold focus:ring-1 focus:ring-[#03623c] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">{t.checkOut}</label>
                  <input 
                    type="time" 
                    value={localSettings.defaultCheckOut}
                    onChange={(e) => setLocalSettings({...localSettings, defaultCheckOut: e.target.value})}
                    className="w-full border border-gray-200 px-3 py-1.5 rounded text-xs font-semibold focus:ring-1 focus:ring-[#03623c] focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">{t.overtimeRate}</label>
                  <input 
                    type="number" 
                    value={localSettings.defaultOvertimeRate}
                    onChange={(e) => setLocalSettings({...localSettings, defaultOvertimeRate: Number(e.target.value) || 0})}
                    className="w-full border border-gray-200 px-3 py-1.5 rounded text-xs font-semibold focus:ring-1 focus:ring-[#03623c] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">{t.pfRate}</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={localSettings.pfContributionRate}
                    onChange={(e) => setLocalSettings({...localSettings, pfContributionRate: Number(e.target.value) || 0})}
                    className="w-full border border-gray-200 px-3 py-1.5 rounded text-xs font-semibold focus:ring-1 focus:ring-[#03623c] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">{t.esicRate}</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={localSettings.esicContributionRate}
                    onChange={(e) => setLocalSettings({...localSettings, esicContributionRate: Number(e.target.value) || 0})}
                    className="w-full border border-gray-200 px-3 py-1.5 rounded text-xs font-semibold focus:ring-1 focus:ring-[#03623c] focus:outline-none" />
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
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded" />
                    <div>
                      <span className="block text-xs font-bold text-gray-800">{t.enableHraLabel}</span>
                      <span className="text-[10px] text-gray-400 font-medium">HRA</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-gray-50/40 hover:bg-gray-55/60 rounded-lg border border-gray-100 cursor-pointer transition-colors">
                    <input 
                      type="checkbox"
                      checked={localSettings.enableDa !== false}
                      onChange={(e) => setLocalSettings({...localSettings, enableDa: e.target.checked})}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded" />
                    <div>
                      <span className="block text-xs font-bold text-gray-800">{t.enableDaLabel}</span>
                      <span className="text-[10px] text-gray-400 font-medium">Dearness (DA Allowance)</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-gray-50/40 hover:bg-gray-55/60 rounded-lg border border-gray-100 cursor-pointer transition-colors">
                    <input 
                      type="checkbox"
                      checked={localSettings.enableConveyance !== false}
                      onChange={(e) => setLocalSettings({...localSettings, enableConveyance: e.target.checked})}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded" />
                    <div>
                      <span className="block text-xs font-bold text-gray-800">{t.enableConveyanceLabel}</span>
                      <span className="text-[10px] text-gray-400 font-medium">Conveyance</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-gray-50/40 hover:bg-gray-55/60 rounded-lg border border-gray-100 cursor-pointer transition-colors">
                    <input 
                      type="checkbox"
                      checked={localSettings.enableProfessionalTax !== false}
                      onChange={(e) => setLocalSettings({...localSettings, enableProfessionalTax: e.target.checked})}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded" />
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
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded" />
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
                    {"Paid Leave Policy Settings"}
                  </h4>
                  <div className="mt-3 max-w-md">
                    <label className="block text-xs font-bold text-gray-700 mb-1">{t.paidLeaveStartAfterLabel}</label>
                    <select
                      value={localSettings.paidLeaveStartAfterMonths || 0}
                      onChange={(e) => setLocalSettings({...localSettings, paidLeaveStartAfterMonths: Number(e.target.value) || 0})}
                      className="w-full border border-gray-200 px-3 py-1.5 rounded text-xs font-semibold focus:ring-1 focus:ring-[#03623c] focus:outline-none bg-white"
                    >
                      <option value={0}>{t.paidLeaveStartImmediately}</option>
                      <option value={1}>{"After 1 Month of Service"}</option>
                      <option value={2}>{"After 2 Months of Service"}</option>
                      <option value={3}>{"After 3 Months (Standard Probation)"}</option>
                      <option value={6}>{"After 6 Months of Service"}</option>
                      <option value={12}>{"After 1 Year of Service"}</option>
                    </select>
                    <p className="text-[10px] text-gray-400 font-medium mt-1">
                      {"Paid Leave (Earned Leave) will only be credited/applicable if employee's tenure (joining date) meets this waiting period."}
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
                  {"Configure feature visibility and permissions for logged-in employees."}
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <label className="flex items-center gap-3 p-3 bg-white hover:bg-slate-50 rounded-lg border border-gray-150 cursor-pointer transition-colors shadow-2xs">
                    <input 
                      type="checkbox"
                      checked={localSettings.enableEmployeePayslips === true}
                      onChange={(e) => setLocalSettings({...localSettings, enableEmployeePayslips: e.target.checked})}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded cursor-pointer" />
                    <div>
                      <span className="block text-xs font-bold text-gray-800">{t.enableEmployeePayslipsLabel}</span>
                      <span className="text-[9px] text-slate-400 font-medium block mt-0.5">
                        {"Currently: " + (localSettings.enableEmployeePayslips ? "Active (ON)" : "Disabled (OFF - Hidden for Employees)")}
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-white hover:bg-slate-50 rounded-lg border border-gray-150 cursor-pointer transition-colors shadow-2xs">
                    <input 
                      type="checkbox"
                      checked={localSettings.enableMobileAttendance !== false}
                      onChange={(e) => setLocalSettings({...localSettings, enableMobileAttendance: e.target.checked})}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded cursor-pointer" />
                    <div>
                      <span className="block text-xs font-bold text-gray-800">
                        {"Enable Mobile Attendance & Punching"}
                      </span>
                      <span className="text-[9px] text-slate-400 font-medium block mt-0.5">
                        {"Currently: " + (localSettings.enableMobileAttendance !== false ? "Active (ON)" : "Disabled (OFF)")}
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-white hover:bg-slate-50 rounded-lg border border-gray-150 cursor-pointer transition-colors shadow-2xs col-span-1 sm:col-span-2 lg:col-span-1">
                    <input 
                      type="checkbox"
                      checked={localSettings.enablePasswordLoginOtp === true}
                      onChange={(e) => setLocalSettings({...localSettings, enablePasswordLoginOtp: e.target.checked})}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded cursor-pointer" />
                    <div>
                      <span className="block text-xs font-bold text-gray-800">
                        {"2FA Password Login OTP"}
                      </span>
                      <span className="text-[9px] text-slate-400 font-medium block mt-0.5">
                        {"Currently: " + (localSettings.enablePasswordLoginOtp ? "Active (ON - Mandatory OTP)" : "Disabled (OFF)")}
                      </span>
                    </div>
                  </label>

                  <div className="flex flex-col justify-between p-3 bg-gradient-to-br from-amber-50/80 via-white to-emerald-50/40 rounded-lg border border-amber-200/80 shadow-2xs col-span-1 sm:col-span-2 lg:col-span-1 gap-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={localSettings.enableAdminWelcomePopup !== false}
                        onChange={(e) => setLocalSettings({...localSettings, enableAdminWelcomePopup: e.target.checked})}
                        className="w-4 h-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded cursor-pointer"
                        id="chk-enable-admin-welcome-popup" />
                      <div>
                        <span className="block text-xs font-bold text-gray-900 flex items-center gap-1">
                          <Crown className="w-3.5 h-3.5 text-amber-500" />
                          {"Admin 'Welcome Boss' Animation Popup"}
                        </span>
                        <span className="text-[9px] text-slate-500 font-medium block mt-0.5">
                          {"Currently: " + (localSettings.enableAdminWelcomePopup !== false ? "Active (ON - Greeting Enabled)" : "Disabled (OFF)")}
                        </span>
                      </div>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowWelcomePreviewModal(true)}
                      className="self-start text-[10px] font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer border border-amber-300/60"
                      id="btn-preview-welcome-popup"
                    >
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      {"Preview Animation"}
                    </button>
                  </div>
                </div>

                {/* Secure GPS Geofencing Configuration */}
                <div className="border-t border-gray-200/60 pt-4 mt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-emerald-600" />
                        {"Secure Mobile Geofencing & Location Lock"}
                      </h5>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                        {"Restrict employee attendance marking to designated office branches or outlet geofences."}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={localSettings.enableGeofencing === true}
                        onChange={(e) => setLocalSettings({...localSettings, enableGeofencing: e.target.checked})}
                        className="sr-only peer" />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                      <span className="ml-2 text-xs font-bold text-slate-700">
                        {localSettings.enableGeofencing ? ("ACTIVE") : ("INACTIVE")}
                      </span>
                    </label>
                  </div>

                  {localSettings.enableGeofencing && (
                    <div className="mt-4 bg-white border border-slate-200 rounded-lg p-4 space-y-4 shadow-2xs">
                      {/* Register New Branch Form */}
                      <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-150">
                        <span className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2.5">
                          {"Register Secure Branch Geofence"}
                        </span>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">
                              {"Branch Name"}
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
                                <option value="">{"-- Select Registered Branch --"}</option>
                                {(localSettings.branches || []).map((b) => (
                                  <option key={b} value={b}>{b}</option>
                                ))}
                                <option value="custom">{"OtherCustom Branch..."}</option>
                              </select>
                              
                              {(!localSettings.branches || localSettings.branches.length === 0 || !(localSettings.branches || []).includes(newOutletName)) && (
                                <input 
                                  type="text"
                                  value={newOutletName}
                                  onChange={(e) => setNewOutletName(e.target.value)}
                                  placeholder={"Type branch name manually..."}
                                  className="w-full bg-white border border-slate-200 px-3 py-1.5 rounded text-xs font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none" />
                              )}
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">
                              {"Geofence Radius (Meters)"}
                            </label>
                            <select
                              value={newOutletRadius}
                              onChange={(e) => setNewOutletRadius(Number(e.target.value) || 100)}
                              className="w-full bg-white border border-slate-200 px-3 py-1.5 rounded text-xs font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                            >
                              <option value={50}>50 {"Meters (High SecurityInside Office Only)"}</option>
                              <option value={100}>100 {"Meters (Recommended Office Standard)"}</option>
                              <option value={200}>200 {"Meters (Large FacilityCompound)"}</option>
                              <option value={500}>500 {"Meters (Wider Area Boundary)"}</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">
                              {"Latitude (e.g., 21.2514)"}
                            </label>
                            <input 
                              type="text"
                              value={newOutletLat}
                              onChange={(e) => setNewOutletLat(e.target.value)}
                              placeholder="e.g. 21.251412"
                              className="w-full bg-white border border-slate-200 px-3 py-1.5 rounded text-xs font-mono font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">
                              {"Longitude (e.g., 81.6296)"}
                            </label>
                            <div className="flex gap-2">
                              <input 
                                type="text"
                                value={newOutletLng}
                                onChange={(e) => setNewOutletLng(e.target.value)}
                                placeholder="e.g. 81.629615"
                                className="w-full bg-white border border-slate-200 px-3 py-1.5 rounded text-xs font-mono font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none" />
                              <button
                                type="button"
                                onClick={fetchAdminLocation}
                                disabled={isFetchingAdminCoords}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-60 border border-slate-250 text-slate-700 text-xs font-bold rounded flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                                title={"Capture current GPS location"}
                              >
                                <Locate className={`w-3.5 h-3.5 ${isFetchingAdminCoords ? 'animate-spin text-emerald-600' : ''}`} />
                                <span>{isFetchingAdminCoords ? "..." : ("Get GPS")}</span>
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
                            <span>{"Lock Location & Save"}</span>
                          </button>
                        </div>
                      </div>

                      {/* Registered Locations List */}
                      <div>
                        <span className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                          {"Active Safe Geofences"}
                        </span>

                        {(!localSettings.geofenceOutlets || localSettings.geofenceOutlets.length === 0) ? (
                          <div className="text-center py-6 px-4 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-slate-400 text-xs font-medium">
                            {"No location geofences configured. Register at least one branch coordinates above to activate mobile punch restrictions."}
                          </div>
                        ) : (
                          <div className="overflow-x-auto border border-slate-150 rounded-lg">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-55 border-b border-slate-150 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                                <tr>
                                  <th className="px-3 py-2">{"Branch Name"}</th>
                                  <th className="px-3 py-2">{"GPS Coordinates"}</th>
                                  <th className="px-3 py-2">{"Safe Radius"}</th>
                                  <th className="px-3 py-2 text-right">{"Action"}</th>
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
                                        title={"Delete branch geofence lock"}
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
              <div className="border-b border-gray-150 dark:border-[#1e3a2f] pb-4">
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                  {'Portal Security Audit Log'}
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-slate-400 font-medium mt-1">
                  {'Monitor failed login attempts to recognize potential security breaches, unauthorized entry attempts, or employees struggling with forgotten passwords.'}
                </p>
              </div>

              {/* Stats Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-[#11221b] flex flex-col justify-between shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                    {'Total Unsuccessful Attempts'}
                  </span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                      {failedLogins.length}
                    </span>
                    <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold font-mono">
                      {'logs'}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-white dark:bg-[#11221b] flex flex-col justify-between shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    {'Unique IDs Targeted'}
                  </span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                      {new Set(failedLogins.map(l => l.enteredId.toLowerCase())).size}
                    </span>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold font-mono">
                      {'user IDs'}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-white dark:bg-[#11221b] flex flex-col justify-between shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    {'System Audit Status'}
                  </span>
                  <div className="flex items-center gap-2 mt-2">
                    {failedLogins.length >= 8 ? (
                      <span className="inline-flex items-center gap-1 text-xs font-black text-rose-700 dark:text-rose-200 bg-rose-100 dark:bg-rose-950/80 px-2.5 py-1 rounded-full animate-pulse border border-rose-200 dark:border-rose-800">
                        ⚠️ {'High Fail Rate'}
                      </span>
                    ) : failedLogins.length > 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-200 bg-amber-100 dark:bg-amber-950/80 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800">
                        ℹ️ {'Minor Incidents'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                        ✓ {'Secure & Stable'}
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
                    <div className="bg-amber-50/80 dark:bg-[#1c160c] border border-amber-200 dark:border-amber-800/80 rounded-xl p-4 flex gap-3 animate-fade-in shadow-xs">
                      <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-amber-900 dark:text-amber-300 uppercase tracking-wide">
                          {'Security Action Warning Required'}
                        </h4>
                        <p className="text-[10px] text-amber-800 dark:text-amber-200 font-semibold leading-relaxed">
                          {'The following User/Employee IDs have 3 or more unsuccessful login attempts. This could suggest forgotten passwords or unauthorized brute-forcing attempts:'}
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {flaggedIds.map(([id, count]) => (
                            <span key={id} className="inline-flex items-center bg-amber-200 dark:bg-amber-900 text-amber-950 dark:text-amber-100 text-[10px] font-black px-2.5 py-1 rounded-md font-mono border border-amber-300 dark:border-amber-700 shadow-xs">
                              {id} ({count} {'fails'})
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
              <div className="bg-slate-50 dark:bg-[#0b1812] border border-gray-200 dark:border-[#1e3a2f] rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 font-sans">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
                  {/* Search input */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text"
                      placeholder={'Search Employee ID...'}
                      value={securitySearch}
                      onChange={(e) => setSecuritySearch(e.target.value)}
                      className="pl-9 pr-4 py-1.5 border border-gray-200 dark:border-[#1e3a2f] bg-white dark:bg-[#11221b] text-slate-800 dark:text-slate-100 rounded-lg text-xs font-bold w-full sm:w-48 focus:outline-none focus:ring-1 focus:ring-[#03623c] font-mono shadow-2xs" />
                  </div>

                  {/* Filter Reason dropdown */}
                  <div className="flex items-center gap-1.5 bg-white dark:bg-[#11221b] border border-gray-200 dark:border-[#1e3a2f] px-2.5 py-1 rounded-lg shadow-2xs">
                    <Filter className="w-3 h-3 text-gray-400" />
                    <select
                      value={securityReasonFilter}
                      onChange={(e: any) => setSecurityReasonFilter(e.target.value)}
                      className="text-xs font-bold text-gray-700 dark:text-slate-200 bg-transparent border-none focus:outline-none focus:ring-0 cursor-pointer"
                    >
                      <option value="all" className="dark:bg-[#11221b]">{'All Reasons'}</option>
                      <option value="Incorrect Password" className="dark:bg-[#11221b]">{'Incorrect Password'}</option>
                      <option value="User ID not found" className="dark:bg-[#11221b]">{'ID Not Found'}</option>
                      <option value="Admin Incorrect Password" className="dark:bg-[#11221b]">{'Admin Bad Password'}</option>
                    </select>
                  </div>
                </div>

                {/* Clear Audit log button */}
                {failedLogins.length > 0 && onClearFailedLogins && (
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to permanently clear all unsuccessful login attempts logs?')) {
                        onClearFailedLogins();
                      }
                    }}
                    className="text-xs font-black text-rose-600 dark:text-rose-400 hover:text-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-3 py-1.5 rounded-lg border border-rose-200/50 dark:border-rose-900/50 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-97"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {'Clear Security Log'}
                  </button>
                )}
              </div>

              {/* Log TableList */}
              {(() => {
                const filteredLogs = failedLogins.filter(log => {
                  const matchesSearch = log.enteredId.toLowerCase().includes(securitySearch.toLowerCase());
                  const matchesReason = securityReasonFilter === 'all' || log.reason === securityReasonFilter;
                  return matchesSearch && matchesReason;
                });

                if (filteredLogs.length === 0) {
                  return (
                    <div className="border border-dashed border-gray-250 dark:border-[#1e3a2f] rounded-2xl p-10 text-center font-sans">
                      <p className="text-sm text-gray-500 dark:text-slate-400 italic">
                        {'No failed login attempts found.'}
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="overflow-x-auto border border-gray-200 dark:border-[#1e3a2f] rounded-xl bg-white dark:bg-[#11221b] shadow-2xs max-h-[400px] overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs font-sans">
                      <thead className="bg-slate-50 dark:bg-[#0f2b20] border-b border-gray-200 dark:border-[#1e3a2f] text-slate-600 dark:text-slate-300 font-black uppercase text-[10px] tracking-wider sticky top-0 z-10">
                        <tr>
                          <th className="p-3">{'Entered ID'}</th>
                          <th className="p-3">{'Timestamp'}</th>
                          <th className="p-3">{'Failure Reason'}</th>
                          <th className="p-3">{'IP Address'}</th>
                          <th className="p-3">{'Browser Details'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-[#1e3a2f] font-semibold text-slate-700 dark:text-slate-200">
                        {filteredLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="p-3">
                              <span className="text-[10px] font-black font-mono text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border border-rose-150 dark:border-rose-800/50 px-2.5 py-1 rounded">
                                {log.enteredId}
                              </span>
                            </td>
                            <td className="p-3 text-slate-500 dark:text-slate-400 font-mono text-[10px]">
                              {new Date(log.timestamp).toLocaleString()}
                            </td>
                            <td className="p-3">
                              <span className="text-rose-700 dark:text-rose-400 font-extrabold">{log.reason}</span>
                            </td>
                            <td className="p-3 font-mono text-[10px] text-slate-500 dark:text-slate-400">
                              {log.ipAddress || '-'}
                            </td>
                            <td className="p-3 max-w-[240px] truncate text-slate-400 dark:text-slate-400 font-medium text-[10px]" title={log.browserInfo}>
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
                  {'Database Synchronization & Session Management'}
                </h3>
                <p className="text-[10px] text-gray-500 mt-1 leading-normal font-sans">
                  {'Manage your cloud storage connections, monitor live storage consumption (KB/MB), troubleshoot Google Sheets sync errors, or backup and restore your complete HRMS database.'}
                </p>
              </div>

              {/* Live Firebase Cloud Storage Monitor */}
              <FirebaseStorageMonitor
                language={language}
                employees={employees}
                attendance={attendance}
                payroll={payroll}
                adminSettings={settings}
                failedLogins={failedLogins}
                emailLogs={emailLogs}
                announcements={announcements}
                hrTickets={hrTickets}
                passwordRequests={passwordRequests}
                auditLogs={auditLogs}
                onClearEmailLogs={onClearEmailLogs}
                onClearAuditLogs={onClearAuditLogs} />

              {/* Troubleshooting Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 shadow-3xs font-sans">
                <div className="flex items-start gap-3">
                  <div className="bg-amber-100 p-2 rounded-xl text-amber-700 shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-800">
                      {'Troubleshoot "Failed to Fetch" Sync Errors'}
                    </h4>
                    <p className="text-[10px] text-slate-500 leading-normal font-semibold">
                      {'If you are seeing a persistent Google Sheets sync error or "Failed to Fetch", it is typically caused by cookie tracking protection, local ad-blockers, or an expired/invalid Google OAuth token. Clearing your Google Sheets credentials cache allows you to log back in cleanly and recreate the connection.'}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (onClearSheetsSession) {
                        onClearSheetsSession();
                        alert('Google Sheets token cache cleared. Please refresh the page and authorize Google Sheets again.');
                      }
                    }}
                    className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    {'Clear Google Sheets Cache & Reset Session'}
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
                      {'JSON Database Backup & Direct Instance Syncing'}
                    </h4>
                    <p className="text-[10px] text-slate-500 leading-normal font-semibold">
                      {'Want to transfer your live production data from https://hrmsrbm.onrender.cominto this development workspace? You can export the whole database in 1-click as a JSON backup file from your live instance, and import it here. The data will merge cleanly and automatically synchronize to your active Cloud Firestore.'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                  {/* Export Section */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between space-y-3">
                    <div>
                      <h5 className="text-[11px] font-bold text-slate-800 mb-1">
                        {'Export Database'}
                      </h5>
                      <p className="text-[9px] text-slate-500 leading-normal">
                        {'Download all employees, attendance archives, payroll records, and customized settings configuration as a local JSON backup.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleExport}
                      className="w-full bg-slate-200 hover:bg-slate-300 text-slate-800 text-[10px] font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all border border-slate-300"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {'Download JSON Backup'}
                    </button>
                  </div>

                  {/* Import Section */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between space-y-3">
                    <div>
                      <h5 className="text-[11px] font-bold text-slate-800 mb-1">
                        {'Import Database'}
                      </h5>
                      <p className="text-[9px] text-slate-500 leading-normal">
                        {'Upload a previously exported JSON backup file to overwrite current workspace records and sync to Cloud Firestore.'}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block w-full cursor-pointer">
                        <span className="sr-only">Choose backup file</span>
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleFileChange}
                          className="block w-full text-[9px] text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[9px] file:font-black file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer" />
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
                            {'Confirm Overwrite & Import Now'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sub Tab: Archive & Storage Optimizer */}
          {activeSubTab === 'archive_storage' && (
            <ArchiveStorageManager
              employees={employees}
              setEmployees={setEmployees}
              candidates={candidates}
              setCandidates={setCandidates}
              attendance={attendance}
              setAttendance={setAttendance}
              archivedEmployees={archivedEmployees}
              setArchivedEmployees={setArchivedEmployees}
              archivedCandidates={archivedCandidates}
              setArchivedCandidates={setArchivedCandidates}
              archivedAttendance={archivedAttendance}
              setArchivedAttendance={setArchivedAttendance}
              settings={localSettings}
              onSaveSettings={(newSettings) => {
                setLocalSettings(newSettings);
                onSaveSettings(newSettings);
              }}
              spreadsheetId={spreadsheetId}
              googleToken={googleToken}
              portalUser={portalUser}
              language={language}
            />
          )}

          {activeSubTab === 'roles_permissions' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold text-gray-800 border-b border-gray-100 pb-2 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-emerald-600" />
                  {'User Roles, Column Visibility & Access Permissions'}
                </h3>
                <p className="text-[10px] text-gray-500 mt-1 leading-normal font-sans">
                  {'Control precisely which roles (Admin, HR, Recruiter, Branch Manager, or Custom Roles) can view specific table columns (Salary, Bank, Aadhaar/PAN, Statutory), manage dashboard modules, or configure custom role definitions.'}
                </p>
              </div>

              {/* Roles Sub-Navigation Tabs */}
              <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 dark:bg-[#11221b] rounded-2xl border border-slate-200 dark:border-[#1e3a2f]">
                <button
                  type="button"
                  onClick={() => setRolesSubSection('columns')}
                  className={`flex-1 min-w-[160px] py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    rolesSubSection === 'columns'
                      ? 'bg-[#03623c] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-[#183126]'
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  {'1. Column & Report Visibility'}
                </button>

                <button
                  type="button"
                  onClick={() => setRolesSubSection('matrix')}
                  className={`flex-1 min-w-[160px] py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    rolesSubSection === 'matrix'
                      ? 'bg-[#03623c] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-[#183126]'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {'2. Module Action Permissions'}
                </button>

                <button
                  type="button"
                  onClick={() => setRolesSubSection('custom_roles')}
                  className={`flex-1 min-w-[160px] py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    rolesSubSection === 'custom_roles'
                      ? 'bg-[#03623c] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-[#183126]'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  {'3. Custom Roles'}{customRoles.length > 0 ? ` (${customRoles.length})` : ''}
                </button>

                <button
                  type="button"
                  onClick={() => setRolesSubSection('accounts')}
                  className={`flex-1 min-w-[160px] py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    rolesSubSection === 'accounts'
                      ? 'bg-[#03623c] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-[#183126]'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  {'4. User Accounts'}{roleAccounts.length > 0 ? ` (${roleAccounts.length + 1})` : ''}
                </button>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* SUBSECTION 1: COLUMN & FIELD VISIBILITY MATRIX */}
              {/* ------------------------------------------------------------- */}
              {rolesSubSection === 'columns' && (
                <div className="space-y-5 font-sans">
                  {/* Role Selector Header */}
                  <div className="bg-slate-50 dark:bg-[#11221b] border border-slate-200 dark:border-[#1e3a2f] rounded-2xl p-4.5 space-y-3 shadow-3xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-2">
                          <Shield className="w-4 h-4 text-emerald-600" />
                          {'Select Target Role to Configure Column & Field Access'}
                        </h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {'Changes take effect immediately across all Employee Directory views, reports, and detail cards for users with this role.'}
                        </p>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSelectAllColumnsForRole(activeConfigRole)}
                          className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-[10px] font-black transition-all cursor-pointer shadow-3xs"
                          title="Allow this role to view all columns & reports"
                        >
                          ✓ Show All Columns
                        </button>
                        <button
                          type="button"
                          onClick={() => handleHideSensitiveForRole(activeConfigRole)}
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-lg text-[10px] font-black transition-all cursor-pointer shadow-3xs"
                          title="Instantly hide salary, bank account, aadhaar/pan, and statutory data"
                        >
                          🔒 Hide Financial/Sensitive
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResetColumnPermissions(activeConfigRole)}
                          className="px-2.5 py-1.5 bg-slate-200/80 hover:bg-slate-300 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-lg text-[10px] font-black transition-all cursor-pointer shadow-3xs"
                          title="Reset to recommended standard defaults"
                        >
                          ↺ Reset Defaults
                        </button>
                      </div>
                    </div>

                    {/* Role selector pill buttons */}
                    <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-200/70 dark:border-[#1e3a2f]">
                      {allRoles.map(r => {
                        const isSuperOrAdmin = r.id === 'super_admin' || r.id === 'admin';
                        return (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => setActiveConfigRole(r.id)}
                            className={`px-3.5 py-2 rounded-xl text-[11px] font-black tracking-wide transition-all cursor-pointer flex items-center gap-1.5 ${
                              activeConfigRole === r.id
                                ? 'bg-emerald-700 text-white shadow-xs scale-102'
                                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:border-emerald-400'
                            }`}
                          >
                            <span>{r.name}</span>
                            {r.isCustom && (
                              <span className={`text-[8px] font-black px-1.5 py-0.2 rounded uppercase ${
                                activeConfigRole === r.id ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-800'
                              }`}>
                                Custom
                              </span>
                            )}
                            {isSuperOrAdmin && (
                              <span className={`text-[8px] font-black px-1.5 py-0.2 rounded uppercase ${
                                activeConfigRole === r.id ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                Unrestricted
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Active Role Banner Notice */}
                  {(() => {
                    const activeRoleObj = allRoles.find(r => r.id === activeConfigRole);
                    const isSuperOrAdmin = activeConfigRole === 'super_admin' || activeConfigRole === 'admin';

                    return (
                      <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                        isSuperOrAdmin 
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60'
                          : 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900/60'
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl ${
                            isSuperOrAdmin ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'
                          }`}>
                            <Shield className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="text-xs font-black text-slate-900 dark:text-white">
                                {activeRoleObj?.name || activeConfigRole}
                              </h5>
                              <span className="text-[9px] font-mono font-bold text-slate-500 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                                ID: {activeConfigRole}
                              </span>
                              {activeRoleObj?.isCustom && (
                                <span className="text-[9px] font-black text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                                  Custom Role
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 font-medium">
                              {activeRoleObj?.description || 'Role permissions configuration'}
                            </p>
                          </div>
                        </div>

                        {isSuperOrAdmin && (
                          <div className="text-right shrink-0">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100/90 text-emerald-900 dark:bg-emerald-900/80 dark:text-emerald-100 rounded-xl text-[10px] font-extrabold">
                              <Lock className="w-3 h-3" />
                              {'All columns always visible (Master Administrator)'}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Column Categories Grid */}
                  <div className="space-y-4">
                    {PERMISSION_COLUMNS.map((categoryGroup, idx) => {
                      const categoryCols = categoryGroup.items;
                      const enabledCount = categoryCols.filter(c => isColumnChecked(activeConfigRole, c.id)).length;
                      const allCategoryEnabled = enabledCount === categoryCols.length;
                      const isSuperOrAdmin = activeConfigRole === 'super_admin' || activeConfigRole === 'admin';

                      return (
                        <div
                          key={categoryGroup.category || idx}
                          className="bg-white dark:bg-[#11221b] border border-slate-200 dark:border-[#1e3a2f] rounded-2xl overflow-hidden shadow-3xs"
                        >
                          {/* Category Header */}
                          <div className="p-3.5 bg-slate-50/80 dark:bg-[#0b1812] border-b border-slate-200 dark:border-[#1e3a2f] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-emerald-500" />
                              <div>
                                <h5 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                                  {categoryGroup.category}
                                </h5>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                  {categoryGroup.description}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2.5 shrink-0">
                              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800">
                                {isSuperOrAdmin ? 'All Allowed' : `${enabledCount} / ${categoryCols.length} Enabled`}
                              </span>
                              {!isSuperOrAdmin && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const targetState = !allCategoryEnabled;
                                    const rolePermissionsMap = localSettings.roleColumnPermissions || DEFAULT_ROLE_COLUMN_PERMISSIONS;
                                    const currentAllowed = rolePermissionsMap[activeConfigRole] || DEFAULT_ROLE_COLUMN_PERMISSIONS[activeConfigRole] || [];
                                    const catKeys = categoryCols.map(c => c.id);
                                    let newAllowed: string[];
                                    if (targetState) {
                                      newAllowed = Array.from(new Set([...currentAllowed, ...catKeys]));
                                    } else {
                                      newAllowed = currentAllowed.filter(k => !catKeys.includes(k));
                                    }
                                    setLocalSettings({
                                      ...localSettings,
                                      roleColumnPermissions: {
                                        ...rolePermissionsMap,
                                        [activeConfigRole]: newAllowed
                                      }
                                    });
                                  }}
                                  className="text-[10px] font-black text-emerald-700 hover:text-emerald-900 dark:text-emerald-400 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 cursor-pointer transition-all"
                                >
                                  {allCategoryEnabled ? 'Disable All in Category' : 'Enable All in Category'}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Columns Checklist Grid */}
                          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {categoryCols.map(col => {
                              const checked = isColumnChecked(activeConfigRole, col.id);
                              return (
                                <label
                                  key={col.id}
                                  className={`p-3 rounded-xl border transition-all select-none flex items-start gap-2.5 cursor-pointer ${
                                    checked
                                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60 shadow-3xs'
                                      : 'bg-slate-50/40 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-70 hover:opacity-100'
                                  } ${isSuperOrAdmin ? 'cursor-not-allowed' : ''}`}
                                >
                                  <input
                                    type="checkbox"
                                    disabled={isSuperOrAdmin}
                                    checked={checked}
                                    onChange={() => handleToggleColumnPermission(activeConfigRole, col.id)}
                                    className="mt-0.5 w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                                        {col.label}
                                      </span>
                                      {col.sensitive && (
                                        <span className="text-[8px] font-black uppercase px-1.5 py-0.2 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                                          Sensitive
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                                      {col.id}
                                    </p>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                                      {col.desc}
                                    </p>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* SUBSECTION 2: MODULE ACTION PERMISSIONS MATRIX */}
              {/* ------------------------------------------------------------- */}
              {rolesSubSection === 'matrix' && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 shadow-3xs font-sans">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        {'Granular Module Permission Matrix'}
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                        {'Select a user role, then toggle checkboxes to configure granular action-level access (View, Add, Edit, Delete/Approve) for each page module.'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSelectAllForRole(activeConfigRole)}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                      >
                        ✓ Select All Modules
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResetRolePermissions(activeConfigRole)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                      >
                        ↺ Reset to Default
                      </button>
                    </div>
                  </div>

                  {/* Role Selector Tabs */}
                  <div className="flex flex-wrap gap-2 p-1.5 bg-slate-150/50 rounded-xl border border-slate-200">
                    {allRoles.map(roleItem => (
                      <button
                        key={roleItem.id}
                        type="button"
                        onClick={() => setActiveConfigRole(roleItem.id)}
                        className={`flex-1 min-w-[120px] px-3 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                          activeConfigRole === roleItem.id
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                        }`}
                      >
                        {roleItem.name} {roleItem.isCustom ? '(Custom)' : ''}
                      </button>
                    ))}
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-3xs">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-extrabold text-[10px] uppercase tracking-wider">
                          <th className="p-3.5 font-black">{'Module Name'}</th>
                          <th className="p-3.5 text-center">{'1. ViewAccess'}</th>
                          <th className="p-3.5 text-center">{'2. AddCreate'}</th>
                          <th className="p-3.5 text-center">{'3. EditModify'}</th>
                          <th className="p-3.5 text-center">{'4. DeleteAction'}</th>
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
                                        className="w-4.5 h-4.5 rounded-md text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer transition-all focus:scale-105" />
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
                    {'* Note: System Administrator ("admin" & "super_admin") always has permanent access to all sections and cannot be restricted.'}
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* SUBSECTION 3: CUSTOM ROLES MANAGEMENT (ADD, EDIT, DELETE) */}
              {/* ------------------------------------------------------------- */}
              {rolesSubSection === 'custom_roles' && (
                <div className="space-y-5 font-sans">
                  {/* Header & Add Button */}
                  <div className="bg-slate-50 dark:bg-[#11221b] border border-slate-200 dark:border-[#1e3a2f] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-3xs">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        {'Custom Roles Management'}
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {'Define tailored organizational roles (e.g. Auditor, Store Keeper, Site Supervisor, Regional Lead) with specialized column visibility and page permissions.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setNewRoleId('');
                        setNewRoleName('');
                        setNewRoleDesc('');
                        setRoleModalError('');
                        setIsNewRoleModalOpen(true);
                      }}
                      className="bg-[#03623c] hover:bg-[#024d2e] text-white px-4 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      {'Create New Role'}
                    </button>
                  </div>

                  {/* Roles Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {allRoles.map(role => {
                      const userCount = roleAccounts.filter(acc => acc.role === role.id).length + (role.id === 'admin' ? 1 : 0);
                      const isBuiltin = !role.isCustom;

                      return (
                        <div
                          key={role.id}
                          className="bg-white dark:bg-[#11221b] border border-slate-200 dark:border-[#1e3a2f] rounded-2xl p-4.5 space-y-3 shadow-3xs flex flex-col justify-between"
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h5 className="text-xs font-black text-slate-900 dark:text-white">
                                  {role.name}
                                </h5>
                                <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                                  role: {role.id}
                                </p>
                              </div>
                              <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                isBuiltin ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                              }`}>
                                {isBuiltin ? 'Built-In' : 'Custom'}
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                              {role.description}
                            </p>
                          </div>

                          <div className="pt-3 border-t border-slate-100 dark:border-[#1e3a2f] flex items-center justify-between gap-2">
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                              👥 {userCount} {userCount === 1 ? 'user' : 'users'} assigned
                            </span>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveConfigRole(role.id);
                                  setRolesSubSection('columns');
                                }}
                                className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 dark:text-emerald-400 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 px-2 py-1 rounded-md border border-emerald-200 dark:border-emerald-800 cursor-pointer"
                                title="Configure column visibility for this role"
                              >
                                Columns ➔
                              </button>

                              {role.isCustom && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingCustomRole(role);
                                      setEditRoleName(role.name);
                                      setEditRoleDesc(role.description || '');
                                    }}
                                    className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded cursor-pointer"
                                    title="Edit Custom Role"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCustomRole(role.id)}
                                    className="p-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded cursor-pointer"
                                    title="Delete Custom Role"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* SUBSECTION 4: MULTI-USER LOGIN ACCOUNTS */}
              {/* ------------------------------------------------------------- */}
              {rolesSubSection === 'accounts' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
                  {/* Accounts list table */}
                  <div className="lg:col-span-2 space-y-3">
                    <h4 className="text-xs font-bold text-slate-800">
                      {'Active Multi-User Accounts'}
                    </h4>
                    
                    <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold text-[10px] uppercase">
                            <th className="p-3">{'User Details'}</th>
                            <th className="p-3">{'Assigned Role'}</th>
                            <th className="p-3">{'Branch Scope'}</th>
                            <th className="p-3 text-right">{'Action'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                          {/* Always show the main admin */}
                          <tr className="bg-emerald-50/20">
                            <td className="p-3">
                              <p className="font-extrabold text-slate-900">{'Primary Administrator'}</p>
                              <p className="text-[10px] text-slate-400 font-mono">@{localSettings.adminUsername || 'admin'}</p>
                              
                              {editingAccountId === 'admin' ? (
                                <div className="mt-1.5 flex items-center gap-2 animate-fadeIn">
                                  <input
                                    type="text"
                                    value={editingAccountPassword}
                                    onChange={(e) => setEditingAccountPassword(e.target.value)}
                                    className="border border-emerald-300 px-2 py-0.5 rounded text-[10px] font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 w-28 bg-white"
                                    placeholder={'New password'} />
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
                                    {'Save'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => { setEditingAccountId(null); setEditingAccountPassword(''); }}
                                    className="text-slate-400 hover:text-slate-600 text-[9px] font-bold px-1.5 py-1 rounded hover:bg-slate-100 cursor-pointer"
                                  >
                                    {'Cancel'}
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
                                    {'Edit Pass'}
                                  </button>
                                </div>
                              )}
                            </td>
                            <td className="p-3">
                              <span className="bg-emerald-100 text-emerald-800 text-[9px] px-2 py-0.5 rounded-full font-black uppercase">
                                Super Admin
                              </span>
                            </td>
                            <td className="p-3 text-slate-400 text-[10px] font-medium">-</td>
                            <td className="p-3 text-right text-slate-400 text-[10px] font-medium">
                              {'Master Account'}
                            </td>
                          </tr>

                          {roleAccounts.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="p-6 text-center text-slate-400 text-[10px] font-medium">
                                {'No additional user accounts configured.'}
                              </td>
                            </tr>
                          ) : (
                            roleAccounts.map((acc) => {
                              const roleDef = allRoles.find(r => r.id === acc.role);
                              return (
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
                                        {'Edit Details'}
                                      </button>
                                    </div>
                                  </td>
                                  <td className="p-3">
                                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase ${
                                      acc.role === 'admin' || acc.role === 'super_admin'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : acc.role === 'director'
                                        ? 'bg-blue-100 text-blue-800'
                                        : acc.role === 'sub_admin'
                                        ? 'bg-indigo-100 text-indigo-800'
                                        : acc.role === 'hr'
                                        ? 'bg-purple-100 text-purple-800'
                                        : roleDef?.isCustom
                                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                        : 'bg-slate-100 text-slate-800'
                                    }`}>
                                      {roleDef?.name || acc.role.replace('_', ' ')}
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
                                      <span className="text-slate-400 font-medium">{'All Branches'}</span>
                                    )}
                                  </td>
                                  <td className="p-3 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <button
                                        type="button"
                                        onClick={() => setEditingAccount(acc)}
                                        className="text-emerald-600 hover:text-emerald-800 p-1 rounded-md hover:bg-emerald-50 cursor-pointer animate-fadeIn"
                                        title={'Edit Account'}
                                      >
                                        <Edit2 className="w-4 h-4 inline" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteRoleAccount(acc.id)}
                                        className="text-rose-600 hover:text-rose-800 p-1 rounded-md hover:bg-rose-50 cursor-pointer animate-fadeIn"
                                        title={'Delete Account'}
                                      >
                                        <Trash2 className="w-4 h-4 inline" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Form to add new account */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-3xs">
                    <h4 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-2">
                      {'Create User Account'}
                    </h4>

                    {roleFormError && (
                      <div className="text-[10px] text-rose-600 font-bold bg-rose-50 p-2.5 rounded border border-rose-200">
                        {roleFormError}
                      </div>
                    )}

                    <div className="space-y-3 text-xs font-semibold">
                      <div>
                        <label className="block text-slate-600 font-bold mb-1">{'Full Name'}</label>
                        <input
                          type="text"
                          value={newAccName}
                          onChange={(e) => setNewAccName(e.target.value)}
                          placeholder="Rahul Sharma"
                          className="w-full border border-gray-200 px-3 py-1.5 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none text-slate-800" />
                      </div>

                      <div>
                        <label className="block text-slate-600 font-bold mb-1">{'Login Username'}</label>
                        <input
                          type="text"
                          value={newAccUsername}
                          onChange={(e) => setNewAccUsername(e.target.value)}
                          placeholder="rahul_hr"
                          className="w-full border border-gray-200 px-3 py-1.5 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none font-mono text-slate-800" />
                      </div>

                      <div>
                        <label className="block text-slate-600 font-bold mb-1">{'Password'}</label>
                        <input
                          type="text"
                          value={newAccPassword}
                          onChange={(e) => setNewAccPassword(e.target.value)}
                          placeholder="hr1234"
                          className="w-full border border-gray-200 px-3 py-1.5 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none font-mono text-slate-800" />
                      </div>

                      <div>
                        <label className="block text-slate-600 font-bold mb-1">{'Email ID'}</label>
                        <input
                          type="email"
                          value={newAccEmail}
                          onChange={(e) => setNewAccEmail(e.target.value)}
                          placeholder="rahul@rathi.com"
                          className="w-full border border-gray-200 px-3 py-1.5 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none text-slate-800" />
                      </div>

                      <div>
                        <label className="block text-slate-600 font-bold mb-1">{'Mobile No.'}</label>
                        <input
                          type="text"
                          value={newAccMobileNo}
                          onChange={(e) => setNewAccMobileNo(e.target.value)}
                          placeholder="9876543210"
                          className="w-full border border-gray-200 px-3 py-1.5 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none text-slate-800" />
                      </div>

                      <div>
                        <label className="block text-slate-600 font-bold mb-1">{'Assigned Role'}</label>
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
                          {allRoles.map(r => (
                            <option key={r.id} value={r.id}>
                              {r.name} {r.isCustom ? '(Custom Role)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      {newAccRole !== 'super_admin' && (
                        <div className="space-y-2 border border-slate-100 p-2.5 rounded-lg bg-slate-50/50">
                          <label className="block text-slate-600 font-bold">
                            {'Restricted Branches'}
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
                                      className="w-3.5 h-3.5 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer" />
                                    <span>{br}</span>
                                  </label>
                                );
                              })
                            )}
                          </div>
                          <p className="text-[9px] text-slate-400 mt-1 leading-normal">
                            {'Check the branch(es) this manager is allowed to see. Leave all unchecked to allow viewing ALL branches.'}
                          </p>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleAddRoleAccount}
                        className="w-full bg-[#03623c] hover:bg-[#024d2e] text-white text-xs font-black py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs mt-2"
                      >
                        <Plus className="w-4 h-4" />
                        {'Add User Account'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeSubTab === 'audit_logs' && (
            <div className="space-y-6">
              <div className="bg-slate-100/50 border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="font-extrabold text-gray-900 text-sm">
                    {'User Audit Log Report'}
                  </h3>
                  <p className="text-xs text-slate-500 leading-normal font-medium">
                    {'Detailed history of all modifications, entries, and approval events.'}
                  </p>
                </div>
                
                {/* Clear button - restricted to Admin */}
                <div className="shrink-0">
                  {portalUser?.role === 'admin' ? (
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to permanently clear all audit logs?')) {
                          if (onClearAuditLogs) onClearAuditLogs();
                        }
                      }}
                      className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-3xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{'Clear Audit Logs'}</span>
                    </button>
                  ) : (
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 border border-gray-200 text-gray-500 rounded-xl text-[10px] font-bold">
                        <Lock className="w-3 h-3 text-gray-400" />
                        <span>{'Admin only can clear logs'}</span>
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
                          placeholder={'Search by actor, employee, field...'}
                          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#03623c] bg-white font-medium" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-400 shrink-0" />
                        <select
                          value={auditActionFilter}
                          onChange={(e: any) => setAuditActionFilter(e.target.value as any)}
                          className="border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 focus:outline-none bg-white font-bold"
                        >
                          <option value="all">{'All Actions'}</option>
                          <option value="create">{'Creates'}</option>
                          <option value="update">{'Updates'}</option>
                          <option value="approve">{'Approvals'}</option>
                          <option value="reject">{'Rejections'}</option>
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
                                <th className="py-4 px-6">{'Timestamp'}</th>
                                <th className="py-4 px-6">{'Actor'}</th>
                                <th className="py-4 px-6">{'Target'}</th>
                                <th className="py-4 px-6 text-center">{'Action'}</th>
                                <th className="py-4 px-6">{'Changes'}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 font-medium">
                              {filtered.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50/25 transition-colors">
                                  <td className="py-4 px-6 whitespace-nowrap font-mono text-gray-400 text-xxs font-bold">
                                    {new Date(log.timestamp).toLocaleString('en-US')}
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
                                        {'Field: '}
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
                            {'No audit records matching filters.'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Sub Tab: Transactional Email History */}
          {activeSubTab === 'email_logs' && (
            <TransactionalEmailHistory
              emailLogs={emailLogs}
              onClearEmailLogs={onClearEmailLogs || (() => {})}
              language={language}
              adminSettings={localSettings}
              onSendTestEmail={onSendTestEmail}
              onResendEmail={onResendEmail} />
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
                        {'PART 4: SMTP EMAIL SERVER & SENDER ALIAS SETTINGS'}
                      </h3>
                      <p className="text-[11px] text-slate-500 font-semibold mt-1 max-w-2xl leading-relaxed">
                        {'Configure custom SMTP connection details to send 2-Step Verification and passkey reset emails to Trainees directly through your corporate mail server using a custom sender alias name.'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Pulse Badge */}
                  <div className="self-start md:self-auto flex items-center gap-2 bg-slate-100 border border-slate-200/60 px-3 py-1 rounded-full shrink-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase text-slate-600 tracking-wider font-mono">
                      {'Live Delivery Gateway'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                    {'SMTP Outbound Host'}
                  </label>
                  <input
                    type="text"
                    value={localSettings.smtpHost || ''}
                    placeholder="e.g. smtp.gmail.com"
                    onChange={(e) => {
                      let val = e.target.value;
                      if (val.toLowerCase().includes('smpt')) {
                        val = val.replace(/smpt/gi, 'smtp');
                      }
                      if (val.toLowerCase().includes('stmp')) {
                        val = val.replace(/stmp/gi, 'smtp');
                      }
                      setLocalSettings({ ...localSettings, smtpHost: val });
                    }}
                    className="w-full border border-gray-200 px-3 py-2 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#03623c]/20 focus:border-[#03623c] focus:outline-none text-slate-800 transition-all bg-white shadow-2xs" />
                </div>
                
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                    {'SMTP Port'}
                  </label>
                  <input
                    type="number"
                    value={localSettings.smtpPort ?? ''}
                    placeholder="e.g. 587"
                    onChange={(e) => setLocalSettings({ ...localSettings, smtpPort: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full border border-gray-200 px-3 py-2 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#03623c]/20 focus:border-[#03623c] focus:outline-none text-slate-800 transition-all bg-white shadow-2xs" />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                    {'SMTP Password'}
                  </label>
                  <input
                    type="password"
                    value={localSettings.smtpPassword || ''}
                    placeholder="••••••••••••••••"
                    onChange={(e) => setLocalSettings({ ...localSettings, smtpPassword: e.target.value })}
                    className="w-full border border-gray-200 px-3 py-2 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#03623c]/20 focus:border-[#03623c] focus:outline-none text-slate-800 transition-all bg-white shadow-2xs font-mono" />
                </div>

                <div className="md:col-span-4">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                    {'SMTP Username'}
                  </label>
                  <input
                    type="text"
                    value={localSettings.smtpUsername || ''}
                    placeholder="e.g. misrpr@rathibuildmart.com"
                    onChange={(e) => setLocalSettings({ ...localSettings, smtpUsername: e.target.value })}
                    className="w-full border border-gray-200 px-3 py-2 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#03623c]/20 focus:border-[#03623c] focus:outline-none text-slate-800 transition-all bg-white shadow-2xs" />
                </div>
              </div>

              {/* Warning/Guide Banner */}
              <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-4 text-[11px] text-amber-800 leading-relaxed font-semibold">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-extrabold text-amber-900 text-xs mb-1">
                      {'Gmail/Google Workspace SMTP Configuration Notice:'}
                    </h4>
                    <p className="font-medium text-slate-600 leading-relaxed">
                      {'If you are using Google Mail (smtp.gmail.com) as your host, ensure 2-Step Verification is ON under your Google Account Security, generate a 16-character App Password (without spaces), and paste it into the SMTP Password field above.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Second row of inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                    {'Sender Display Name (Alias)'}
                  </label>
                  <input
                    type="text"
                    value={localSettings.senderName || ''}
                    placeholder="e.g. Rathi LMS System"
                    onChange={(e) => setLocalSettings({ ...localSettings, senderName: e.target.value })}
                    className="w-full border border-gray-200 px-3 py-2 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#03623c]/20 focus:border-[#03623c] focus:outline-none text-slate-800 transition-all bg-white shadow-2xs" />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                    {'Sender Email Address'}
                  </label>
                  <input
                    type="email"
                    value={localSettings.senderEmail || ''}
                    placeholder="e.g. rbmlms@rathibuildmart.com"
                    onChange={(e) => setLocalSettings({ ...localSettings, senderEmail: e.target.value })}
                    className="w-full border border-gray-200 px-3 py-2 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#03623c]/20 focus:border-[#03623c] focus:outline-none text-slate-800 transition-all bg-white shadow-2xs" />
                </div>
              </div>

              {/* Reset & Save Form Actions specifically for SMTP */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleResetSmtpToDefaults}
                  className="bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-3xs"
                >
                  {'Reset Defaults'}
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="bg-[#03623c] hover:bg-[#024d2e] text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-2xs"
                >
                  {'Save SMTP Configurations'}
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
                    {'LIVE SMTP GATEWAY DISPATCH TESTER'}
                  </h4>
                </div>
                
                <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                  {'Enter any recipient email to instantly test the configured SMTP routing and sender name alias.'}
                </p>

                <div className="flex flex-col sm:flex-row gap-2 max-w-2xl">
                  <input
                    type="email"
                    value={testRecipient}
                    placeholder="Enter recipient email address..."
                    onChange={(e) => setTestRecipient(e.target.value)}
                    className="flex-1 border border-gray-200 px-4 py-2 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none text-slate-800 transition-all bg-white" />
                  <button
                    type="button"
                    onClick={handleTestSmtp}
                    disabled={isTestingSmtp}
                    className="bg-[#4f46e5] hover:bg-[#4338ca] text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-2 shrink-0 disabled:opacity-55 disabled:cursor-not-allowed"
                  >
                    {isTestingSmtp ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        {'Dispatching...'}
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        {'Dispatch Test'}
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
                        <p className="font-bold">{testResult.success ? "SUCCESS" : "ERRORFAILURE"}</p>
                        <p className="mt-0.5 text-slate-600 font-medium">{testResult.message}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* Sub Tab: WhatsApp & Email Automation Settings */}
          {activeSubTab === 'whatsapp_auto' && (
            <div className="space-y-6 font-sans">
              
              {/* Header card matching the style */}
              <div className="bg-[#03623c]/5 border border-[#03623c]/15 rounded-xl p-5 shadow-3xs">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-[#03623c] rounded-xl text-white mt-0.5">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
                        {'PART 5: WHATSAPP (MessageAutoSender) & EMAIL AUTOMATION'}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-300 font-semibold mt-1 max-w-2xl leading-relaxed">
                        {'Set up API connection details for MessageAutoSender to send automated WhatsApp payslips, miss punch alerts, leave updates, and late warnings directly to employees.'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Status Badge */}
                  <div className="self-start md:self-auto flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3 py-1 rounded-full shrink-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase text-emerald-800 dark:text-emerald-300 tracking-wider font-mono">
                      MessageAutoSender API Ready
                    </span>
                  </div>
                </div>
              </div>

              {/* MessageAutoSender Gateway Credentials Form */}
              <div className="bg-white dark:bg-[#11221b] border border-gray-200 dark:border-[#1e3a2f] rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#1e3a2f] pb-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Key className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>MessageAutoSender API Gateway Credentials</span>
                  </h4>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localSettings.enableWhatsappAutomation ?? true}
                      onChange={(e) => setLocalSettings({ ...localSettings, enableWhatsappAutomation: e.target.checked })}
                      className="sr-only peer" />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#03623c]"></div>
                    <span className="ml-2 text-xs font-bold text-slate-700 dark:text-slate-300">Enable Automation</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
                      MessageAutoSender Username (User ID)
                    </label>
                    <input
                      type="text"
                      value={localSettings.whatsappUsername || ''}
                      placeholder="e.g. centraldata@rathibuildmart.com"
                      onChange={(e) => setLocalSettings({ ...localSettings, whatsappUsername: e.target.value })}
                      className="w-full border border-gray-200 dark:border-[#1e3a2f] px-3 py-2 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#03623c]/20 focus:border-[#03623c] focus:outline-none text-slate-800 dark:text-slate-100 bg-white dark:bg-[#0b1812]" />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
                      MessageAutoSender API Password
                    </label>
                    <input
                      type="password"
                      value={localSettings.whatsappPassword || ''}
                      placeholder="••••••••••••"
                      onChange={(e) => setLocalSettings({ ...localSettings, whatsappPassword: e.target.value })}
                      className="w-full border border-gray-200 dark:border-[#1e3a2f] px-3 py-2 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#03623c]/20 focus:border-[#03623c] focus:outline-none text-slate-800 dark:text-slate-100 bg-white dark:bg-[#0b1812]" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                        Default Sender Mobile NoChannel
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const targetNum = localSettings.whatsappSenderNo || '8518880943';
                          if (!localSettings.whatsappSenderNo) {
                            setLocalSettings(prev => ({ ...prev, whatsappSenderNo: targetNum }));
                          }
                          setWaTestMobile(targetNum);
                          setWaTestStatus(`Default sender number (${targetNum}) set for test receiver!`);
                          setTimeout(() => setWaTestStatus(null), 4000);
                        }}
                        className="text-[10px] text-[#03623c] dark:text-emerald-400 hover:underline font-bold flex items-center gap-1 cursor-pointer bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60 transition-all hover:bg-emerald-100"
                        title="Copy default sender number to test receiver box"
                      >
                        <RefreshCcw className="w-3 h-3 text-[#03623c] dark:text-emerald-400" />
                        <span>Use for Test</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={localSettings.whatsappSenderNo || ''}
                      placeholder="e.g. 8518880943 or 919876543210"
                      onChange={(e) => {
                        const val = e.target.value;
                        setLocalSettings({ ...localSettings, whatsappSenderNo: val });
                        setWaTestMobile(val);
                      }}
                      className="w-full border border-gray-200 dark:border-[#1e3a2f] px-3 py-2 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#03623c]/20 focus:border-[#03623c] focus:outline-none text-slate-800 dark:text-slate-100 bg-white dark:bg-[#0b1812]" />
                  </div>
                </div>

                {/* HTTP 401 Guidance Box */}
                <div className="p-3.5 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs space-y-1">
                  <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>MessageAutoSender Gateway authentication:</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    Ensure your valid registered <strong>User ID</strong> and <strong>Password</strong> are entered above. If MessageAutoSender displays <em>"HTTP Status 401 - Full authentication is required"</em>, it indicates invalid or expired credentials on <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded font-mono">app.messageautosender.com</code>.
                  </p>
                </div>

                {waTestStatus && (
                  <div className="bg-emerald-50 dark:bg-emerald-950/90 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between shadow-xs">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      {waTestStatus}
                    </span>
                    <button type="button" onClick={() => setWaTestStatus(null)} className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-900 font-black text-sm px-1 cursor-pointer">×</button>
                  </div>
                )}
              </div>

              {/* Excel HYPERLINK Formula & Live Test Component */}
              <div className="bg-gradient-to-br from-amber-500/10 to-emerald-500/10 border border-amber-300 dark:border-amber-900/60 rounded-2xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
                      Excel & Google Sheets HYPERLINK Formula Generator
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const sender = localSettings.whatsappSenderNo || '8518880943';
                        if (!localSettings.whatsappUsername) {
                          setLocalSettings(prev => ({ ...prev, whatsappUsername: 'rathis', whatsappPassword: 'Rathis@ravs#2025!', whatsappSenderNo: sender }));
                        } else if (!localSettings.whatsappSenderNo) {
                          setLocalSettings(prev => ({ ...prev, whatsappSenderNo: sender }));
                        }
                        setWaTestMobile(sender);
                        setWaTestName('Rahul Sharma');
                        setWaTestStatus(`Sample receiver & default sender synced (${sender})!`);
                        setTimeout(() => setWaTestStatus(null), 4000);
                      }}
                      className="bg-amber-100 dark:bg-amber-950/80 hover:bg-amber-200 text-amber-900 dark:text-amber-200 px-3 py-1 rounded-lg text-xs font-bold border border-amber-300 dark:border-amber-800 flex items-center gap-1.5 cursor-pointer transition-all active:scale-98"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Fill Test Sample Data</span>
                    </button>
                    <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-extrabold px-2.5 py-1 rounded-md border border-amber-300/60 font-mono">
                      =HYPERLINK Formula
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                  Use this formula in your Excel or Google Sheets payroll files. It automatically compiles the direct MessageAutoSender API URL with your credentials!
                </p>

                {/* Interactive Test Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white dark:bg-[#0b1812] p-3 rounded-xl border border-gray-200 dark:border-[#1e3a2f]">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Test Receiver Mobile:</label>
                      {localSettings.whatsappSenderNo && waTestMobile !== localSettings.whatsappSenderNo && (
                        <button
                          type="button"
                          onClick={() => setWaTestMobile(localSettings.whatsappSenderNo || '')}
                          className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline font-bold"
                        >
                          Sync Default Sender ({localSettings.whatsappSenderNo})
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={waTestMobile}
                      onChange={(e) => setWaTestMobile(e.target.value)}
                      placeholder="e.g. 8518880943"
                      className="w-full border border-gray-200 dark:border-[#1e3a2f] px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-slate-50 dark:bg-[#11221b] text-slate-800 dark:text-slate-100" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Test Receiver Name:</label>
                    <input
                      type="text"
                      value={waTestName}
                      onChange={(e) => setWaTestName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full border border-gray-200 dark:border-[#1e3a2f] px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-50 dark:bg-[#11221b] text-slate-800 dark:text-slate-100" />
                  </div>
                </div>

                {/* Generated Formula Display with Tabs */}
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-800 dark:text-slate-200">Generated Formula:</span>
                      <div className="flex bg-slate-200 dark:bg-slate-800 p-0.5 rounded-lg text-[10px]">
                        <button
                          type="button"
                          onClick={() => setFormulaMode('direct')}
                          className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${formulaMode === 'direct' ? 'bg-white dark:bg-[#0b1812] text-emerald-700 dark:text-emerald-400 shadow-2xs' : 'text-slate-600 dark:text-slate-400'}`}
                        >
                          Direct Value URL
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormulaMode('cellRef')}
                          className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${formulaMode === 'cellRef' ? 'bg-white dark:bg-[#0b1812] text-emerald-700 dark:text-emerald-400 shadow-2xs' : 'text-slate-600 dark:text-slate-400'}`}
                        >
                          Excel Cell Ref (User & B6)
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const targetMobile = formatPhoneNumber(waTestMobile || localSettings.whatsappSenderNo || '8518880943');
                        const targetUser = localSettings.whatsappUsername || 'rathis';
                        const targetPass = localSettings.whatsappPassword || 'Rathis@ravs#2025!';
                        
                        const formStr = formulaMode === 'direct'
                          ? `=HYPERLINK("https://app.messageautosender.com/message/new?username=${targetUser}&password=${targetPass}&receiverMobileNo=${targetMobile}&receiverName=${encodeURIComponent(waTestName || 'test')}&message=MESSAGETEST", "Manual Test Send")`
                          : buildMessageAutoSenderExcelFormula(
                              'User',
                              'Password',
                              'B6',
                              'C6',
                              'MESSAGETEST',
                              'Manual Test Send'
                            );
                        
                        navigator.clipboard.writeText(formStr);
                        setCopiedWaFormula(true);
                        setTimeout(() => setCopiedWaFormula(false), 2000);
                      }}
                      className="text-emerald-700 dark:text-emerald-400 hover:underline font-bold flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                    >
                      {copiedWaFormula ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedWaFormula ? 'Formula Copied!' : 'Copy Formula'}</span>
                    </button>
                  </div>

                  <div className="p-3 bg-slate-900 text-emerald-400 rounded-xl font-mono text-xs overflow-x-auto border border-slate-800 shadow-inner select-all leading-relaxed">
                    {formulaMode === 'direct'
                      ? `=HYPERLINK("https://app.messageautosender.com/message/new?username=${localSettings.whatsappUsername || 'rathis'}&password=${localSettings.whatsappPassword || 'Rathis@ravs#2025!'}&receiverMobileNo=${formatPhoneNumber(waTestMobile || localSettings.whatsappSenderNo || '8518880943')}&receiverName=${encodeURIComponent(waTestName || 'test')}&message=MESSAGETEST", "Manual Test Send")`
                      : buildMessageAutoSenderExcelFormula(
                          'User',
                          'Password',
                          'B6',
                          'C6',
                          'MESSAGETEST',
                          'Manual Test Send'
                        )
                    }
                  </div>
                </div>

                {/* Live Generated API URL Display Box */}
                <div className="p-3 bg-slate-900 text-slate-100 rounded-xl space-y-1.5 border border-slate-800 shadow-inner">
                  <div className="flex items-center justify-between text-[11px] font-bold text-emerald-400">
                    <span className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Live Direct API Request URL Preview:</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const liveUrl = buildMessageAutoSenderUrl(
                          localSettings.whatsappUsername || 'rathis',
                          localSettings.whatsappPassword || 'Rathis@ravs#2025!',
                          waTestMobile || localSettings.whatsappSenderNo || '8518880943',
                          waTestName || 'Test User',
                          `Test WhatsApp Notification from ${localSettings.companyName || 'Rathi Buildmart'} HR`
                        );
                        navigator.clipboard.writeText(liveUrl);
                        setWaTestStatus('Live API URL copied to clipboard!');
                        setTimeout(() => setWaTestStatus(null), 3000);
                      }}
                      className="text-emerald-400 hover:text-emerald-300 font-medium text-[10px] flex items-center gap-1 cursor-pointer bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700 transition-all hover:bg-slate-700"
                    >
                      <Copy className="w-3 h-3 text-emerald-400" />
                      <span>Copy URL</span>
                    </button>
                  </div>
                  <div className="text-[11px] font-mono break-all text-emerald-300 bg-slate-950/90 p-2.5 rounded-lg border border-slate-800 select-all leading-relaxed">
                    {buildMessageAutoSenderUrl(
                      localSettings.whatsappUsername || 'rathis',
                      localSettings.whatsappPassword || 'Rathis@ravs#2025!',
                      waTestMobile || localSettings.whatsappSenderNo || '8518880943',
                      waTestName || 'Test User',
                      `Test WhatsApp Notification from ${localSettings.companyName || 'Rathi Buildmart'} HR`
                    )}
                  </div>
                </div>

                {/* Launch Test Action */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Direct API URL Target Mobile: <code className="bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px] font-bold font-mono text-emerald-800 dark:text-emerald-300">{formatPhoneNumber(waTestMobile || localSettings.whatsappSenderNo || '8518880943')}</code>
                  </span>
                  <a
                    href={buildMessageAutoSenderUrl(
                      localSettings.whatsappUsername || 'rathis',
                      localSettings.whatsappPassword || 'Rathis@ravs#2025!',
                      waTestMobile || localSettings.whatsappSenderNo || '8518880943',
                      waTestName || 'Test User',
                      `Test WhatsApp Notification from ${localSettings.companyName || 'Rathi Buildmart'} HR`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      const targetMobile = waTestMobile || localSettings.whatsappSenderNo || '8518880943';
                      setWaTestStatus(`MessageAutoSender test launched for ${targetMobile}! Check the opened tab.`);
                      setTimeout(() => setWaTestStatus(null), 5000);
                    }}
                    className="bg-[#03623c] hover:bg-[#024d2e] text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs transition-all active:scale-98 inline-flex"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Launch Live WhatsApp Test</span>
                  </a>
                </div>
              </div>

              {/* Recruitment & Hiring WhatsApp Automation Settings */}
              <div className="bg-white dark:bg-[#11221b] border border-amber-200 dark:border-amber-900/60 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#1e3a2f] pb-3">
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
                        {'Recruitment & Interview Automation Settings'}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        {'Configure default interview venue, times, and stage change WhatsApp & Email dispatch options.'}
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localSettings.recruitmentAutoNotify ?? true}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setLocalSettings({ ...localSettings, recruitmentAutoNotify: val });
                        localStorage.setItem('recruitment_auto_notify_enabled', String(val));
                      }}
                      className="sr-only peer" />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                    <span className="ml-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                      {'Auto Send WhatsApp on Stage Move'}
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
                      {'Default Interview VenueLink'}
                    </label>
                    <input
                      type="text"
                      value={localSettings.defaultInterviewVenue ?? 'Rathi Buildmart HQ, Raipur'}
                      placeholder="e.g. Rathi Buildmart HQ, Raipur"
                      onChange={(e) => setLocalSettings({ ...localSettings, defaultInterviewVenue: e.target.value })}
                      className="w-full border border-gray-200 dark:border-[#1e3a2f] px-3 py-2 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 focus:outline-none text-slate-800 dark:text-slate-100 bg-white dark:bg-[#0b1812]" />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
                      {'Default Interview Time'}
                    </label>
                    <input
                      type="time"
                      value={localSettings.defaultInterviewTime ?? '11:00'}
                      onChange={(e) => setLocalSettings({ ...localSettings, defaultInterviewTime: e.target.value })}
                      className="w-full border border-gray-200 dark:border-[#1e3a2f] px-3 py-2 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 focus:outline-none text-slate-800 dark:text-slate-100 bg-white dark:bg-[#0b1812]" />
                  </div>
                </div>
              </div>

              {/* WhatsApp & Email Templates Manager */}
              <TemplateManager
                language={language}
                settings={localSettings}
                onUpdateSettings={(updated) => setLocalSettings(updated)}
                onSaveAll={handleSave} />
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
                    {'Edit User Account'}
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
                    <label className="block text-slate-600 font-bold mb-1">{'Full Name'}</label>
                    <input
                      type="text"
                      value={editingAccount.name}
                      onChange={(e) => setEditingAccount({ ...editingAccount, name: e.target.value })}
                      className="w-full border border-gray-200 px-3 py-1.5 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none text-slate-800" />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">{'Login Username'}</label>
                    <input
                      type="text"
                      value={editingAccount.username}
                      onChange={(e) => setEditingAccount({ ...editingAccount, username: e.target.value })}
                      className="w-full border border-gray-200 px-3 py-1.5 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none font-mono text-slate-800" />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">{'Email ID'}</label>
                    <input
                      type="email"
                      value={editingAccount.email || ''}
                      onChange={(e) => setEditingAccount({ ...editingAccount, email: e.target.value })}
                      className="w-full border border-gray-200 px-3 py-1.5 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none text-slate-800"
                      placeholder="example@rathi.com" />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">{'Mobile No.'}</label>
                    <input
                      type="text"
                      value={editingAccount.mobileNo || ''}
                      onChange={(e) => setEditingAccount({ ...editingAccount, mobileNo: e.target.value })}
                      className="w-full border border-gray-200 px-3 py-1.5 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none text-slate-800"
                      placeholder="9876543210" />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">{'Password'}</label>
                    <input
                      type="text"
                      value={editingAccount.password || ''}
                      onChange={(e) => setEditingAccount({ ...editingAccount, password: e.target.value })}
                      className="w-full border border-gray-200 px-3 py-1.5 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none font-mono text-slate-800" />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">{'Assigned Role'}</label>
                    <select
                      value={editingAccount.role}
                      onChange={(e: any) => {
                        const r = e.target.value;
                        setEditingAccount({
                          ...editingAccount,
                          role: r,
                          branches: editingAccount.branches || [],
                          branch: editingAccount.branches?.[0] || ''
                        });
                      }}
                      className="w-full border border-gray-200 px-3 py-1.5 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none font-bold text-slate-700"
                    >
                      {allRoles.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.name} {r.isCustom ? '(Custom Role)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {editingAccount.role !== 'super_admin' && (
                    <div className="space-y-2 border border-slate-100 p-2.5 rounded-lg bg-slate-50/50">
                      <label className="block text-slate-600 font-bold">
                        {'Restricted Branches'}
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
                                  className="w-3.5 h-3.5 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer" />
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
                    {'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!editingAccount.name.trim() || !editingAccount.username.trim()) {
                        alert('Name and username are required');
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
                    {'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add Custom Role Modal */}
          {isNewRoleModalOpen && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs font-sans">
              <div className="bg-white dark:bg-[#11221b] rounded-2xl border border-gray-100 dark:border-[#1e3a2f] shadow-2xl max-w-md w-full flex flex-col overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-[#1e3a2f] flex items-center justify-between bg-gray-50 dark:bg-[#0b1812] rounded-t-2xl shrink-0">
                  <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    {'Create New Custom Role'}
                  </h3>
                  <button 
                    onClick={() => {
                      setIsNewRoleModalOpen(false);
                      setRoleModalError('');
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-5 space-y-4 text-xs font-semibold">
                  {roleModalError && (
                    <div className="text-[10px] text-rose-600 font-bold bg-rose-50 dark:bg-rose-950/50 p-2.5 rounded-lg border border-rose-200 dark:border-rose-900">
                      {roleModalError}
                    </div>
                  )}

                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 font-bold mb-1">
                      {'Role System Identifier (Code)'} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newRoleId}
                      onChange={(e) => setNewRoleId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                      placeholder="e.g. audit_officer, store_manager"
                      className="w-full border border-gray-200 dark:border-[#1e3a2f] px-3 py-2 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:outline-none font-mono text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900" />
                    <p className="text-[10px] text-slate-400 mt-1">
                      {'Lowercase letters, numbers, and underscores only. Used in system permissions.'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 font-bold mb-1">
                      {'Display Name'} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newRoleName}
                      onChange={(e) => setNewRoleName(e.target.value)}
                      placeholder="e.g. Audit Officer, Store Manager"
                      className="w-full border border-gray-200 dark:border-[#1e3a2f] px-3 py-2 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:outline-none text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900" />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 font-bold mb-1">
                      {'Role Description'}
                    </label>
                    <textarea
                      rows={2}
                      value={newRoleDesc}
                      onChange={(e) => setNewRoleDesc(e.target.value)}
                      placeholder="e.g. Responsible for store audit, branch verification and stock inspections."
                      className="w-full border border-gray-200 dark:border-[#1e3a2f] px-3 py-2 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:outline-none text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 resize-none" />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 font-bold mb-1">
                      {'Clone Permissions From Template'}
                    </label>
                    <select
                      value={newRoleCopyFrom}
                      onChange={(e) => setNewRoleCopyFrom(e.target.value)}
                      className="w-full border border-gray-200 dark:border-[#1e3a2f] px-3 py-2 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:outline-none font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900"
                    >
                      <option value="hr">{'HR Manager (Standard HR Access)'}</option>
                      <option value="asset_manager">{'Asset Manager (Non-Salary Asset Access)'}</option>
                      <option value="recruiter">{'Recruiter (Hiring & Candidate Access)'}</option>
                      <option value="branch_manager">{'Branch Manager (Branch Scope)'}</option>
                      <option value="director">{'Director (Executive Overview)'}</option>
                      <option value="employee">{'Employee (Self-Service View)'}</option>
                    </select>
                  </div>
                </div>

                <div className="p-4 border-t border-gray-100 dark:border-[#1e3a2f] bg-gray-50 dark:bg-[#0b1812] flex items-center justify-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewRoleModalOpen(false);
                      setRoleModalError('');
                    }}
                    className="px-4 py-2 text-xs font-bold text-slate-500 dark:text-slate-300 hover:text-slate-700 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer"
                  >
                    {'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={handleAddCustomRole}
                    className="px-4 py-2 text-xs font-bold text-white bg-[#03623c] hover:bg-[#024d2e] rounded-xl cursor-pointer shadow-xs flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {'Create Custom Role'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Edit Custom Role Modal */}
          {editingCustomRole && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs font-sans">
              <div className="bg-white dark:bg-[#11221b] rounded-2xl border border-gray-100 dark:border-[#1e3a2f] shadow-2xl max-w-md w-full flex flex-col overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-[#1e3a2f] flex items-center justify-between bg-gray-50 dark:bg-[#0b1812] rounded-t-2xl shrink-0">
                  <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
                    <Edit2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    {'Edit Custom Role'}
                  </h3>
                  <button 
                    onClick={() => setEditingCustomRole(null)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-5 space-y-4 text-xs font-semibold">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 font-bold mb-1">
                      {'Role System Identifier'}
                    </label>
                    <input
                      type="text"
                      disabled
                      value={editingCustomRole.id}
                      className="w-full border border-gray-200 dark:border-[#1e3a2f] px-3 py-2 rounded-xl font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 cursor-not-allowed" />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 font-bold mb-1">
                      {'Display Name'} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editRoleName}
                      onChange={(e) => setEditRoleName(e.target.value)}
                      className="w-full border border-gray-200 dark:border-[#1e3a2f] px-3 py-2 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:outline-none text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900" />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 font-bold mb-1">
                      {'Role Description'}
                    </label>
                    <textarea
                      rows={3}
                      value={editRoleDesc}
                      onChange={(e) => setEditRoleDesc(e.target.value)}
                      className="w-full border border-gray-200 dark:border-[#1e3a2f] px-3 py-2 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:outline-none text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 resize-none" />
                  </div>
                </div>

                <div className="p-4 border-t border-gray-100 dark:border-[#1e3a2f] bg-gray-50 dark:bg-[#0b1812] flex items-center justify-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditingCustomRole(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 dark:text-slate-300 hover:text-slate-700 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer"
                  >
                    {'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={handleUpdateCustomRole}
                    className="px-4 py-2 text-xs font-bold text-white bg-[#03623c] hover:bg-[#024d2e] rounded-xl cursor-pointer shadow-xs"
                  >
                    {'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Admin Welcome Boss Preview Modal */}
          {showWelcomePreviewModal && (
            <AdminWelcomeModal
              isOpen={showWelcomePreviewModal}
              onClose={() => setShowWelcomePreviewModal(false)}
              adminName={portalUser?.name || 'Boss'}
              role={portalUser?.role || 'admin'}
              language={language}
              companyName={localSettings.companyName} />
          )}

        </div>
      </div>
    </div>
  );
}
