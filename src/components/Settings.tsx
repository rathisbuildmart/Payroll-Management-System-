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
  AlertTriangle
} from 'lucide-react';
import { AdminSettings, FieldSetting, FailedLoginAttempt } from '../types';

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
  onClearSheetsSession
}: SettingsProps) {
  const [activeSubTab, setActiveSubTab] = useState<'company' | 'fields' | 'masters' | 'policy' | 'security' | 'notices_support' | 'database'>('company');
  const [localSettings, setLocalSettings] = useState<AdminSettings>(settings);
  const [newMasterVal, setNewMasterVal] = useState<string>('');
  const [activeMasterList, setActiveMasterList] = useState<keyof Pick<AdminSettings, 'departments' | 'branches' | 'costCenters' | 'employeeGroups' | 'workTimings' | 'weeklyOffProfiles' | 'leaveTypes'>>('departments');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [confirmReset, setConfirmReset] = useState<boolean>(false);

  // Corporate notices & HR Helpdesk management states
  const [newNoticeTitle, setNewNoticeTitle] = useState('');
  const [newNoticeTitleHi, setNewNoticeTitleHi] = useState('');
  const [newNoticeContent, setNewNoticeContent] = useState('');
  const [newNoticeContentHi, setNewNoticeContentHi] = useState('');
  const [newNoticeBadge, setNewNoticeBadge] = useState<'Critical' | 'Holiday' | 'General' | 'Policy'>('General');

  // Security Log Search/Filter States
  const [securitySearch, setSecuritySearch] = useState('');
  const [securityReasonFilter, setSecurityReasonFilter] = useState<'all' | 'Incorrect Password' | 'User ID not found' | 'Admin Incorrect Password'>('all');

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
            onClick={() => setActiveSubTab('notices_support')}
            className={`flex items-center md:items-start gap-2.5 px-3 py-2 text-xs font-bold rounded-md transition-all text-left whitespace-nowrap md:whitespace-normal cursor-pointer relative ${
              activeSubTab === 'notices_support'
                ? 'bg-slate-200 text-slate-900 shadow-xs border border-slate-300/40'
                : 'text-gray-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5 shrink-0 md:mt-0.5" />
            <span>{t.tabNoticesSupport}</span>
            {(hrTickets.filter(tk => tk.status === 'Pending').length + passwordRequests.filter(pr => pr.status === 'Pending').length) > 0 && (
              <span className="absolute top-1.5 right-1.5 md:relative md:top-0 md:right-0 md:ml-auto bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none animate-pulse">
                {hrTickets.filter(tk => tk.status === 'Pending').length + passwordRequests.filter(pr => pr.status === 'Pending').length}
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
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
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
              <div className="bg-slate-50 border border-gray-200 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
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
                    <div className="border border-dashed border-gray-250 rounded-2xl p-10 text-center space-y-2 bg-slate-25/40">
                      <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
                        <CheckCircle className="w-6 h-6" />
                      </div>
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest pt-2">
                        {language === 'en' ? 'System Audit Clear' : 'सिस्टम ऑडिट साफ़'}
                      </h4>
                      <p className="text-[10px] text-gray-500 font-medium max-w-sm mx-auto">
                        {language === 'en' 
                          ? 'No unsuccessful attempts match your current search/filters, or the login security log is entirely clear. Excellent!' 
                          : 'सक्रिय फ़िल्टर या खोज के अनुसार कोई असफल प्रयास नहीं मिला, या सुरक्षा लॉग पूरी तरह से खाली है। बहुत बढ़िया!'}
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-gray-200 font-mono">
                            <th className="py-2.5 px-4">{language === 'en' ? 'Status' : 'स्थिति'}</th>
                            <th className="py-2.5 px-4">{language === 'en' ? 'Entered User ID' : 'दर्ज उपयोगकर्ता आईडी'}</th>
                            <th className="py-2.5 px-4">{language === 'en' ? 'Timestamp' : 'समय और दिनांक'}</th>
                            <th className="py-2.5 px-4">{language === 'en' ? 'Reason' : 'विफलता का कारण'}</th>
                            <th className="py-2.5 px-4 hidden md:table-cell">{language === 'en' ? 'Device/Browser' : 'ब्राउज़र विवरण'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filteredLogs.map((log) => {
                            let dateStr = '';
                            try {
                              dateStr = new Date(log.timestamp).toLocaleString(undefined, {
                                dateStyle: 'medium',
                                timeStyle: 'short'
                              });
                            } catch (_) {
                              dateStr = log.timestamp;
                            }

                            let badgeStyle = '';
                            let badgeText = '';
                            let statusDot = '';

                            if (log.reason === 'Admin Incorrect Password') {
                              badgeStyle = 'bg-slate-100 text-slate-800 border-slate-200';
                              badgeText = language === 'en' ? 'System Administrator' : 'सिस्टम व्यवस्थापक';
                              statusDot = 'bg-slate-900 ring-slate-100 animate-pulse';
                            } else if (log.reason === 'Incorrect Password') {
                              badgeStyle = 'bg-amber-100 text-amber-800 border-amber-200';
                              badgeText = language === 'en' ? 'Registered Employee' : 'पंजीकृत कर्मचारी';
                              statusDot = 'bg-amber-500 ring-amber-100';
                            } else {
                              badgeStyle = 'bg-rose-100 text-rose-800 border-rose-200';
                              badgeText = language === 'en' ? 'Unknown/Invalid User' : 'अज्ञात उपयोगकर्ता';
                              statusDot = 'bg-rose-500 ring-rose-100';
                            }

                            return (
                              <tr key={log.id} className="hover:bg-slate-50/50 transition-colors text-xs font-semibold text-slate-700">
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`w-2 h-2 rounded-full ring-4 ${statusDot}`} />
                                    {log.reason === 'User ID not found' ? (
                                      <span className="text-[10px] text-rose-600 font-extrabold uppercase font-mono">{language === 'en' ? 'UNREGISTERED' : 'अपंजीकृत'}</span>
                                    ) : (
                                      <span className="text-[10px] text-amber-600 font-extrabold uppercase font-mono">{language === 'en' ? 'REGISTERED' : 'पंजीकृत'}</span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-4 font-mono text-slate-900 font-bold">
                                  <div className="flex flex-col gap-0.5">
                                    <span>{log.enteredId}</span>
                                    <span className={`inline-self-start text-[9px] font-bold px-1.5 py-0.25 rounded-md border ${badgeStyle} mt-0.5`}>
                                      {badgeText}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-gray-500 font-mono">
                                  {dateStr}
                                </td>
                                <td className="py-3 px-4">
                                  <span className="inline-flex items-center gap-1 text-gray-800">
                                    <Lock className="w-3 h-3 text-gray-400 shrink-0" />
                                    {log.reason === 'Admin Incorrect Password' ? (
                                      <span className="text-rose-700 font-extrabold">{log.reason}</span>
                                    ) : log.reason === 'Incorrect Password' ? (
                                      <span className="text-amber-700 font-bold">{log.reason}</span>
                                    ) : (
                                      <span className="text-slate-500 italic">{log.reason}</span>
                                    )}
                                  </span>
                                </td>
                                <td className="py-3 px-4 hidden md:table-cell text-[10px] text-gray-400 font-mono max-w-xs truncate" title={log.browserInfo}>
                                  {log.browserInfo || 'N/A'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {activeSubTab === 'notices_support' && (
            <div className="space-y-6 animate-fadeIn font-sans">
              
              {/* Header Info */}
              <div className="border-b border-gray-150 pb-4">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest font-mono flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-emerald-600" />
                  {language === 'en' ? 'Notices & HR Support Helpdesk' : 'कंपनी नोटिस और एचआर सहायता हेल्पडेस्क'}
                </h3>
                <p className="text-[10px] text-gray-500 font-bold mt-1">
                  {language === 'en' 
                    ? 'Publish general announcements to the login screen, review forgot password requests, and answer employee helpdesk tickets.'
                    : 'लॉगिन स्क्रीन पर सामान्य कंपनी घोषणाएं प्रकाशित करें, पासवर्ड रीसेट अनुरोधों की समीक्षा करें और कर्मचारियों के हेल्पडेस्क टिकटों का समाधान करें।'}
                </p>
              </div>

              {/* Grid 2 Columns: (1) Notices Publisher, (2) Password reset gateway queue */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Notice Board Manager */}
                <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl space-y-4">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center justify-between font-sans">
                    <span>📢 {language === 'en' ? 'Manage Announcements' : 'घोषणाओं का प्रबंधन'}</span>
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-100 font-mono">
                      {announcements.length} {language === 'en' ? 'Total' : 'कुल'}
                    </span>
                  </h4>

                  {/* Create New Announcement Form */}
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (!newNoticeTitle.trim() || !newNoticeContent.trim()) return;
                    
                    const newAnn = {
                      id: `ann-${Date.now()}`,
                      title: newNoticeTitle.trim(),
                      titleHi: newNoticeTitleHi.trim() || newNoticeTitle.trim(),
                      date: new Date().toISOString().split('T')[0],
                      content: newNoticeContent.trim(),
                      contentHi: newNoticeContentHi.trim() || newNoticeContent.trim(),
                      badge: newNoticeBadge,
                      badgeHi: newNoticeBadge === 'Critical' ? 'महत्वपूर्ण' : newNoticeBadge === 'Holiday' ? 'छुट्टी' : newNoticeBadge === 'Policy' ? 'नीति' : 'सामान्य'
                    };

                    if (setAnnouncements) {
                      setAnnouncements(prev => [newAnn, ...prev]);
                    }
                    
                    // Reset fields
                    setNewNoticeTitle('');
                    setNewNoticeTitleHi('');
                    setNewNoticeContent('');
                    setNewNoticeContentHi('');
                    setNewNoticeBadge('General');
                  }} className="bg-white border border-slate-200 p-3 rounded-lg space-y-3 shadow-xs">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block border-b border-slate-100 pb-1 font-sans">
                      ➕ {language === 'en' ? 'Publish Circular / Notice' : 'नया परिपत्र / सूचना प्रकाशित करें'}
                    </span>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-500 block font-sans">{language === 'en' ? 'Title (English)' : 'शीर्षक (अंग्रेजी)'}</label>
                        <input
                          type="text"
                          required
                          value={newNoticeTitle}
                          onChange={(e) => setNewNoticeTitle(e.target.value)}
                          placeholder="e.g. Office Closed on Independence Day"
                          className="w-full border border-gray-250 rounded-md px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50/40 text-slate-800 font-sans"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-500 block font-sans">{language === 'en' ? 'Title (Hindi)' : 'शीर्षक (हिंदी)'}</label>
                        <input
                          type="text"
                          value={newNoticeTitleHi}
                          onChange={(e) => setNewNoticeTitleHi(e.target.value)}
                          placeholder="उदा., स्वतंत्रता दिवस पर कार्यालय बंद"
                          className="w-full border border-gray-250 rounded-md px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50/40 text-slate-800 font-sans"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-500 block font-sans">{language === 'en' ? 'Content (English)' : 'विवरण (अंग्रेजी)'}</label>
                        <textarea
                          required
                          rows={2}
                          value={newNoticeContent}
                          onChange={(e) => setNewNoticeContent(e.target.value)}
                          placeholder="Write English circular detail..."
                          className="w-full border border-gray-250 rounded-md p-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50/40 text-slate-800 resize-none font-sans"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-500 block font-sans">{language === 'en' ? 'Content (Hindi)' : 'विवरण (हिंदी)'}</label>
                        <textarea
                          rows={2}
                          value={newNoticeContentHi}
                          onChange={(e) => setNewNoticeContentHi(e.target.value)}
                          placeholder="हिंदी परिपत्र विवरण लिखें..."
                          className="w-full border border-gray-250 rounded-md p-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50/40 text-slate-800 resize-none font-sans"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold text-gray-500 font-sans">{language === 'en' ? 'Badge Type:' : 'वर्ग टाइप:'}</span>
                        <select
                          value={newNoticeBadge}
                          onChange={(e: any) => setNewNoticeBadge(e.target.value)}
                          className="border border-gray-250 rounded px-2 py-0.5 text-[10px] font-bold bg-white text-slate-700 cursor-pointer font-sans"
                        >
                          <option value="General">General</option>
                          <option value="Critical">Critical</option>
                          <option value="Holiday">Holiday</option>
                          <option value="Policy">Policy</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-3.5 py-1 rounded-md transition-colors uppercase tracking-wider cursor-pointer font-sans"
                      >
                        {language === 'en' ? 'Publish Notice' : 'सूचना प्रकाशित करें'}
                      </button>
                    </div>
                  </form>

                  {/* Active Notices List */}
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {announcements.length === 0 ? (
                      <p className="text-[11px] text-gray-500 italic text-center py-4 bg-white border border-dashed border-gray-200 rounded-lg font-sans">
                        {language === 'en' ? 'No active notice board items.' : 'कोई सक्रिय नोटिस बोर्ड आइटम नहीं है।'}
                      </p>
                    ) : (
                      announcements.map((ann) => {
                        let badgeCol = 'bg-slate-100 text-slate-700 border-slate-200';
                        if (ann.badge === 'Critical') badgeCol = 'bg-red-50 text-red-700 border-red-200';
                        if (ann.badge === 'Holiday') badgeCol = 'bg-amber-50 text-amber-700 border-amber-200';
                        if (ann.badge === 'Policy') badgeCol = 'bg-blue-50 text-blue-700 border-blue-200';

                        return (
                          <div key={ann.id} className="bg-white border border-slate-150 p-3 rounded-lg shadow-2xs flex justify-between items-start gap-3 font-sans">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-[8px] font-black uppercase px-1.5 py-0.25 rounded border ${badgeCol} font-mono`}>
                                  {language === 'en' ? ann.badge : ann.badgeHi}
                                </span>
                                <h5 className="text-xs font-black text-slate-800 font-sans">
                                  {language === 'en' ? ann.title : ann.titleHi}
                                </h5>
                              </div>
                              <p className="text-[10px] text-slate-600 leading-relaxed font-semibold">
                                {language === 'en' ? ann.content : ann.contentHi}
                              </p>
                              <span className="text-[9px] text-gray-400 font-mono block pt-0.5">{ann.date} • Published by Admin</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                if (setAnnouncements) {
                                  setAnnouncements(prev => prev.filter(a => a.id !== ann.id));
                                }
                              }}
                              className="text-gray-400 hover:text-red-600 p-1 rounded-md hover:bg-slate-50 transition-all shrink-0 cursor-pointer"
                              title={language === 'en' ? 'Remove Notice' : 'सूचना हटाएँ'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Password reset gateway request queue */}
                <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl space-y-4">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center justify-between font-sans">
                    <span className="flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                      {language === 'en' ? 'Forgot Password Gateways' : 'पासवर्ड रीसेट गेटवे अनुरोध'}
                    </span>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-100 font-mono">
                      {passwordRequests.filter(r => r.status === 'Pending').length} Pending
                    </span>
                  </h4>

                  <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                    {passwordRequests.length === 0 ? (
                      <p className="text-[11px] text-gray-500 italic text-center py-8 bg-white border border-dashed border-gray-200 rounded-lg font-sans">
                        {language === 'en' ? 'No password reset requests logged.' : 'कोई पासवर्ड रीसेट अनुरोध दर्ज नहीं है।'}
                      </p>
                    ) : (
                      passwordRequests.map((req) => (
                        <div key={req.id} className="bg-white border border-slate-150 p-3 rounded-lg shadow-2xs space-y-2 font-sans">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-black text-slate-800 font-mono uppercase bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                  {req.empId}
                                </span>
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full font-sans ${
                                  req.status === 'Pending' ? 'bg-amber-100 text-amber-700 border border-amber-200/50' : 'bg-emerald-100 text-emerald-700 border border-emerald-200/50'
                                }`}>
                                  {req.status}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-600 font-semibold mt-1">
                                {language === 'en' ? 'Email:' : 'ईमेल:'} <span className="font-mono font-bold text-slate-900">{req.email}</span>
                              </p>
                              <p className="text-[10px] text-slate-600 font-semibold font-sans">
                                {language === 'en' ? 'Mobile:' : 'मोबाइल:'} <span className="font-mono font-bold text-slate-900">{req.mobile}</span>
                              </p>
                            </div>
                            <span className="text-[8px] font-mono text-gray-400 shrink-0">
                              {new Date(req.date).toLocaleDateString()}
                            </span>
                          </div>

                          {req.status === 'Pending' && (
                            <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                              <button
                                type="button"
                                onClick={() => {
                                  if (setPasswordRequests) {
                                    setPasswordRequests(prev => prev.map(p => p.id === req.id ? { ...p, status: 'Resolved' } : p));
                                  }
                                }}
                                className="bg-emerald-50 hover:bg-emerald-600 border border-emerald-200 hover:border-emerald-600 text-emerald-700 hover:text-white font-bold text-[9px] px-2.5 py-1 rounded transition-all flex items-center gap-1 cursor-pointer uppercase font-sans"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                {language === 'en' ? 'Mark Resolved (Reset)' : 'रीसेट करें (समाधान)'}
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

              {/* HR Helpdesk Tickets Queue Block */}
              <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl space-y-4">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center justify-between font-sans">
                  <span className="flex items-center gap-1.5">
                    <LifeBuoy className="w-4 h-4 text-emerald-600" />
                    {language === 'en' ? 'HR Helpdesk Support Tickets' : 'कर्मचारी सहायता हेल्पडेस्क टिकट'}
                  </span>
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-100 font-mono">
                    {hrTickets.filter(tk => tk.status === 'Pending').length} Pending
                  </span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto max-h-[300px] pr-1">
                  {hrTickets.length === 0 ? (
                    <div className="col-span-full py-8 text-center text-gray-500 italic bg-white border border-dashed border-gray-200 rounded-lg font-sans">
                      {language === 'en' ? 'No support tickets logged.' : 'कोई सहायता टिकट दर्ज नहीं है।'}
                    </div>
                  ) : (
                    hrTickets.map((ticket) => (
                      <div key={ticket.id} className="bg-white border border-slate-200 p-4 rounded-xl shadow-3xs flex flex-col justify-between space-y-3 relative hover:border-slate-350 transition-all font-sans">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[9px] font-black font-mono text-indigo-600 bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded">
                              {ticket.id}
                            </span>
                            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
                              ticket.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}>
                              {ticket.status}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <h5 className="text-xs font-black text-slate-800 font-sans leading-snug">
                              {ticket.name} <span className="text-[10px] font-bold text-slate-400 font-mono ml-1">({ticket.empId})</span>
                            </h5>
                            <p className="text-[9px] font-mono text-gray-400 font-bold">{ticket.email}</p>
                          </div>

                          <div className="p-2.5 bg-slate-50 border border-slate-150 rounded-lg">
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-0.5 font-sans">
                              Category: <span className="text-slate-800 font-extrabold font-sans">{ticket.category}</span>
                            </span>
                            <p className="text-[10px] text-slate-600 font-semibold leading-relaxed line-clamp-3 font-sans" title={ticket.message}>
                              "{ticket.message}"
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                          <span className="text-[8px] font-mono text-gray-400">
                            {new Date(ticket.date).toLocaleString()}
                          </span>
                          
                          {ticket.status === 'Pending' && (
                            <button
                              type="button"
                              onClick={() => {
                                if (setHrTickets) {
                                  setHrTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, status: 'Resolved' } : t));
                                }
                              }}
                              className="bg-emerald-50 hover:bg-emerald-600 border border-emerald-200 hover:border-emerald-600 text-emerald-700 hover:text-white font-bold text-[9px] px-2.5 py-1 rounded transition-all flex items-center gap-1 cursor-pointer uppercase font-mono"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              {language === 'en' ? 'Resolve' : 'समाधान'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

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

        </div>
      </div>
    </div>
  );
}
