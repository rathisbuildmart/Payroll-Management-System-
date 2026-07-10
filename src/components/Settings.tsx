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
  Undo
} from 'lucide-react';
import { AdminSettings, FieldSetting } from '../types';

interface SettingsProps {
  settings: AdminSettings;
  onSaveSettings: (settings: AdminSettings) => void;
  language: 'en' | 'hi';
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
};

export default function Settings({ settings, onSaveSettings, language }: SettingsProps) {
  const [activeSubTab, setActiveSubTab] = useState<'company' | 'fields' | 'masters' | 'policy'>('company');
  const [localSettings, setLocalSettings] = useState<AdminSettings>(settings);
  const [newMasterVal, setNewMasterVal] = useState<string>('');
  const [activeMasterList, setActiveMasterList] = useState<keyof Pick<AdminSettings, 'departments' | 'branches' | 'costCenters' | 'employeeGroups' | 'workTimings' | 'weeklyOffProfiles' | 'leaveTypes'>>('departments');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [filterGroup, setFilterGroup] = useState<string>('all');

  const t = {
    en: {
      adminTitle: "Admin Panel & System Settings",
      adminSub: "Configure enterprise rules, form field visibility, mandatory fields, and default list options",
      savedAlert: "Settings saved successfully! Controls updated instantly.",
      tabCompany: "Company Profile",
      tabFields: "Field Settings (Mandatory/Hide)",
      tabMasters: "Dropdown Masters",
      tabPolicy: "Policy & Payroll Rules",
      
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
    },
    hi: {
      adminTitle: "एडमिन पैनल और सिस्टम सेटिंग्स",
      adminSub: "कंपनी नियम, फॉर्म फ़ील्ड्स को दिखाना/छिपाना, अनिवार्य फ़ील्ड्स और ड्रॉपडाउन सूची का प्रबंधन करें।",
      savedAlert: "सेटिंग्स सफलतापूर्वक सहेज ली गईं! सभी नियम तुरंत लागू हो गए हैं।",
      tabCompany: "कंपनी प्रोफाइल",
      tabFields: "फ़ील्ड सेटिंग्स (अनिवार्य/छिपाएं)",
      tabMasters: "ड्रॉपडाउन मास्टर सूचियाँ",
      tabPolicy: "नीति और पेरोल नियम",
      
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
    if (window.confirm("Are you sure you want to reset all admin settings to standard default values? This will overwrite your current configuration.")) {
      setLocalSettings(INITIAL_ADMIN_SETTINGS);
      onSaveSettings(INITIAL_ADMIN_SETTINGS);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    }
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
            className={`flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-md transition-all text-left whitespace-nowrap cursor-pointer ${
              activeSubTab === 'company'
                ? 'bg-slate-200 text-slate-900 shadow-xs border border-slate-300/40'
                : 'text-gray-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            {t.tabCompany}
          </button>
          
          <button
            onClick={() => setActiveSubTab('fields')}
            className={`flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-md transition-all text-left whitespace-nowrap cursor-pointer ${
              activeSubTab === 'fields'
                ? 'bg-slate-200 text-slate-900 shadow-xs border border-slate-300/40'
                : 'text-gray-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <ToggleLeft className="w-3.5 h-3.5" />
            {t.tabFields}
          </button>

          <button
            onClick={() => setActiveSubTab('masters')}
            className={`flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-md transition-all text-left whitespace-nowrap cursor-pointer ${
              activeSubTab === 'masters'
                ? 'bg-slate-200 text-slate-900 shadow-xs border border-slate-300/40'
                : 'text-gray-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            {t.tabMasters}
          </button>

          <button
            onClick={() => setActiveSubTab('policy')}
            className={`flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-md transition-all text-left whitespace-nowrap cursor-pointer ${
              activeSubTab === 'policy'
                ? 'bg-slate-200 text-slate-900 shadow-xs border border-slate-300/40'
                : 'text-gray-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <SettingsIcon className="w-3.5 h-3.5" />
            {t.tabPolicy}
          </button>

          <div className="hidden md:block pt-6 mt-6 border-t border-gray-200/60">
            <button
              onClick={handleResetToDefault}
              className="flex items-center gap-1.5 w-full text-left px-3 py-1.5 text-[10px] font-bold text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-700 border border-red-200/50 rounded transition-all cursor-pointer"
            >
              <Undo className="w-3 h-3" />
              {t.resetDefault}
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
