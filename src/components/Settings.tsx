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
  Filter
} from 'lucide-react';
import { AdminSettings, FieldSetting, FailedLoginAttempt } from '../types';

interface SettingsProps {
  settings: AdminSettings;
  onSaveSettings: (settings: AdminSettings) => void;
  language: 'en' | 'hi';
  failedLogins?: FailedLoginAttempt[];
  onClearFailedLogins?: () => void;
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

export default function Settings({ settings, onSaveSettings, language, failedLogins = [], onClearFailedLogins }: SettingsProps) {
  const [activeSubTab, setActiveSubTab] = useState<'company' | 'fields' | 'masters' | 'policy' | 'security'>('company');
  const [localSettings, setLocalSettings] = useState<AdminSettings>(settings);
  const [newMasterVal, setNewMasterVal] = useState<string>('');
  const [activeMasterList, setActiveMasterList] = useState<keyof Pick<AdminSettings, 'departments' | 'branches' | 'costCenters' | 'employeeGroups' | 'workTimings' | 'weeklyOffProfiles' | 'leaveTypes'>>('departments');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [confirmReset, setConfirmReset] = useState<boolean>(false);

  // Security Log Search/Filter States
  const [securitySearch, setSecuritySearch] = useState('');
  const [securityReasonFilter, setSecurityReasonFilter] = useState<'all' | 'Incorrect Password' | 'User ID not found' | 'Admin Incorrect Password'>('all');

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

  const handleAddMasterItem = () => {
    if (!newMasterVal.trim()) return;
    const currentList = localSettings[activeMasterList] as string[];
    if (currentList.includes(newMasterVal.trim())) {
      alert("Option already exists!");
      return;
    }
    const updatedList = [...currentList, newMasterVal.trim()];
    setLocalSettings({
      ...localSettings,
      [activeMasterList]: updatedList
    });
    setNewMasterVal('');
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
