import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  MessageSquare,
  Mail,
  Copy,
  Check,
  RotateCcw,
  Tag,
  Eye,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  Info,
  Filter,
  Search,
  SlidersHorizontal
} from 'lucide-react';
import { AdminSettings } from '../types';
import { DEFAULT_WHATSAPP_TEMPLATES, DEFAULT_EMAIL_TEMPLATES, processTemplate } from '../utils/whatsappHelper';

interface TemplateManagerProps {
  language: 'en' | 'hi';
  settings: AdminSettings;
  onUpdateSettings: (updated: AdminSettings) => void;
  onSaveAll: () => void;
}

export const TEMPLATE_PURPOSES = [
  { id: 'General Notice', labelEn: 'General NoticeHR Circular', labelHi: "" },
  { id: 'Attendance', labelEn: 'Attendance & Late Punch', labelHi: "" },
  { id: 'Payroll & Salary', labelEn: 'Payroll & SalaryPayslips', labelHi: "" },
  { id: 'Leave & Holidays', labelEn: 'Leave & Holidays', labelHi: "" },
  { id: 'Recruitment & Interview', labelEn: 'Recruitment & Interview', labelHi: "" },
  { id: 'Warnings & Discipline', labelEn: 'Warnings & Discipline', labelHi: "" },
  { id: 'Performance & Review', labelEn: 'Performance & Appraisals', labelHi: "" },
  { id: 'Other', labelEn: 'Other HRMiscellaneous', labelHi: "" },
];

export const TemplateManager: React.FC<TemplateManagerProps> = ({
  language,
  settings,
  onUpdateSettings,
  onSaveAll
}) => {
  const isEn = language === 'en';

  const [activeTab, setActiveTab] = useState<'whatsapp' | 'email' | 'custom'>('whatsapp');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);

  //Form states for adding/editing custom template
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<'whatsapp' | 'email' | 'both'>('both');
  const [formPurpose, setFormPurpose] = useState<string>('General Notice');
  const [formWaBody, setFormWaBody] = useState('');
  const [formEmailSub, setFormEmailSub] = useState('');
  const [formEmailBody, setFormEmailBody] = useState('');

  //Filter states for Custom Templates list
  const [filterPurpose, setFilterPurpose] = useState<string>('all');
  const [filterChannel, setFilterChannel] = useState<'all' | 'whatsapp' | 'email' | 'both'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [copiedVar, setCopiedVar] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const availableVariables = [
    { key: '{NAME}', label: 'Employee Name' },
    { key: '{COMPANY_NAME}', label: 'Company Name' },
    { key: '{DATE}', label: 'Date' },
    { key: '{MONTH}', label: 'Month Year' },
    { key: '{BASIC}', label: 'Basic Salary' },
    { key: '{NET_SALARY}', label: 'Net Salary' },
    { key: '{STATUS}', label: 'Status' },
    { key: '{DATES}', label: 'Leave Dates' },
    { key: '{LEAVE_TYPE}', label: 'Leave Type' },
    { key: '{CHECK_IN}', label: 'Check-in Time' },
    { key: '{HR_CONTACT}', label: 'HR Contact' },
    { key: '{REMARKS}', label: 'Remarks' },
  ];

  const handleCopyVariable = (varKey: string, targetField?: 'wa' | 'emailSub' | 'emailBody') => {
    if (targetField === 'wa') {
      setFormWaBody((prev) => `${prev} ${varKey}`);
    } else if (targetField === 'emailSub') {
      setFormEmailSub((prev) => `${prev} ${varKey}`);
    } else if (targetField === 'emailBody') {
      setFormEmailBody((prev) => `${prev} ${varKey}`);
    } else {
      navigator.clipboard.writeText(varKey);
      setCopiedVar(varKey);
      setTimeout(() => setCopiedVar(null), 1500);
    }
  };

  const handleOpenAddModal = () => {
    setEditingTemplateId(null);
    setFormName('');
    setFormCategory('both');
    setFormPurpose('General Notice');
    setFormWaBody('Hello {NAME},\n\nThis is an official notice from {COMPANY_NAME}.\nDate: {DATE}');
    setFormEmailSub('Notice for {NAME} - {COMPANY_NAME}');
    setFormEmailBody('Dear {NAME},\n\nPlease review this notice from {COMPANY_NAME}.\n\nDate: {DATE}\n\nRegards,\nHR Management');
    setShowAddModal(true);
  };

  const handleOpenEditModal = (tpl: any) => {
    setEditingTemplateId(tpl.id);
    setFormName(tpl.name || '');
    setFormCategory(tpl.category || 'both');
    setFormPurpose(tpl.purpose || 'General Notice');
    setFormWaBody(tpl.whatsappBody || '');
    setFormEmailSub(tpl.emailSubject || '');
    setFormEmailBody(tpl.emailBody || '');
    setShowAddModal(true);
  };

  const handleSaveCustomTemplate = () => {
    if (!formName.trim()) {
      alert('Please enter a template title/name.');
      return;
    }

    const currentCustoms = settings.customMessageTemplates || [];

    if (editingTemplateId) {
      //Update existing
      const updatedList = currentCustoms.map((t) =>
        t.id === editingTemplateId
          ? {
              ...t,
              name: formName.trim(),
              category: formCategory,
              purpose: formPurpose,
              whatsappBody: formWaBody,
              emailSubject: formEmailSub,
              emailBody: formEmailBody
            }
          : t
      );
      onUpdateSettings({
        ...settings,
        customMessageTemplates: updatedList
      });
    } else {
      //Add new
      const newTpl = {
        id: `custom_tpl_${Date.now()}`,
        name: formName.trim(),
        category: formCategory,
        purpose: formPurpose,
        whatsappBody: formWaBody,
        emailSubject: formEmailSub,
        emailBody: formEmailBody,
        createdAt: new Date().toISOString()
      };
      onUpdateSettings({
        ...settings,
        customMessageTemplates: [...currentCustoms, newTpl]
      });
    }

    setShowAddModal(false);
    triggerSaveNotify('Custom template saved successfully!');
  };

  const handleDeleteCustomTemplate = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete template "${name}"?`)) {
      const updatedList = (settings.customMessageTemplates || []).filter((t) => t.id !== id);
      onUpdateSettings({
        ...settings,
        customMessageTemplates: updatedList
      });
      triggerSaveNotify('Template deleted.');
    }
  };

  const triggerSaveNotify = (msg: string) => {
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  //Helper for live preview rendering
  const sampleVars = {
    NAME: 'Rahul Sharma',
    COMPANY_NAME: settings.companyName || 'Rathi Buildmart',
    DATE: '2026-07-29',
    MONTH: 'July 2026',
    BASIC: '25,000',
    NET_SALARY: '32,500',
    STATUS: 'Approved',
    DATES: '01-Aug to 03-Aug',
    LEAVE_TYPE: 'Casual Leave',
    CHECK_IN: '09:45 AM',
    HR_CONTACT: settings.hrContactPhone || '+91 9876543210',
    REMARKS: 'Quarterly review notice'
  };

  return (
    <div className="bg-white dark:bg-[#11221b] border border-slate-200 dark:border-[#1e3a2f] rounded-2xl p-5 shadow-xs space-y-5">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-[#1e3a2f] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 text-[#03623c] dark:text-emerald-400 rounded-xl">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
              {'WhatsApp & Email Message Templates Manager'}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {'Edit pre-built notification templates or create your own custom HR message templates'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="bg-[#03623c] hover:bg-[#024d2e] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{'+ Add New Template'}</span>
          </button>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-100 dark:border-[#1e3a2f] pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('whatsapp')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'whatsapp'
              ? 'bg-[#03623c] text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>{'WhatsApp Templates'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('email')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'email'
              ? 'bg-[#03623c] text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>{'Email Templates'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('custom')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'custom'
              ? 'bg-[#03623c] text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>
            {'Custom Added Templates'} ({(settings.customMessageTemplates || []).length})
          </span>
        </button>
      </div>

      {/* Variable Cheat-Sheet */}
      <div className="p-3 bg-slate-50 dark:bg-[#0b1812] border border-slate-200/80 dark:border-[#1e3a2f] rounded-xl space-y-1.5">
        <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
          <span>{'Available Dynamic Variables (Click to copy variable tag):'}</span>
          {copiedVar && <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-mono">Copied {copiedVar}!</span>}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {availableVariables.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => handleCopyVariable(v.key)}
              className="px-2 py-0.5 bg-white dark:bg-slate-800 hover:bg-emerald-50 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-md text-[10px] font-mono font-medium flex items-center gap-1 cursor-pointer transition-all hover:border-emerald-300"
              title={`Copy ${v.key} (${v.label})`}
            >
              <span className="font-bold text-[#03623c] dark:text-emerald-400">{v.key}</span>
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: WHATSAPP STANDARD TEMPLATES */}
      {activeTab === 'whatsapp' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
              {'Standard Automated WhatsApp HR Templates:'}
            </span>
            <button
              type="button"
              onClick={() => {
                onUpdateSettings({
                  ...settings,
                  whatsappTemplates: { ...DEFAULT_WHATSAPP_TEMPLATES }
                });
                triggerSaveNotify('WhatsApp templates reset to factory defaults.');
              }}
              className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 flex items-center gap-1 font-bold underline cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{'Reset to Default'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Payslip */}
            <div className="space-y-1.5 p-3.5 bg-slate-50/60 dark:bg-slate-800/20 border border-slate-200/80 dark:border-slate-800 rounded-xl">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                <span>1. Payslip Shared Alert</span>
                <span className="text-[10px] text-slate-400 font-mono">key: payslip</span>
              </label>
              <textarea
                rows={4}
                value={settings.whatsappTemplates?.payslip || DEFAULT_WHATSAPP_TEMPLATES.payslip}
                onChange={(e) => {
                  onUpdateSettings({
                    ...settings,
                    whatsappTemplates: {
                      ...DEFAULT_WHATSAPP_TEMPLATES,
                      ...settings.whatsappTemplates,
                      payslip: e.target.value
                    }
                  });
                }}
                className="w-full p-2.5 text-xs font-mono bg-white dark:bg-[#0b1812] border border-slate-200 dark:border-[#1e3a2f] rounded-lg text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-[#03623c]" />
            </div>

            {/* Missed Punch */}
            <div className="space-y-1.5 p-3.5 bg-slate-50/60 dark:bg-slate-800/20 border border-slate-200/80 dark:border-slate-800 rounded-xl">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                <span>2. Missed Punch Alert</span>
                <span className="text-[10px] text-slate-400 font-mono">key: missPunch</span>
              </label>
              <textarea
                rows={4}
                value={settings.whatsappTemplates?.missPunch || DEFAULT_WHATSAPP_TEMPLATES.missPunch}
                onChange={(e) => {
                  onUpdateSettings({
                    ...settings,
                    whatsappTemplates: {
                      ...DEFAULT_WHATSAPP_TEMPLATES,
                      ...settings.whatsappTemplates,
                      missPunch: e.target.value
                    }
                  });
                }}
                className="w-full p-2.5 text-xs font-mono bg-white dark:bg-[#0b1812] border border-slate-200 dark:border-[#1e3a2f] rounded-lg text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-[#03623c]" />
            </div>

            {/* Leave Status */}
            <div className="space-y-1.5 p-3.5 bg-slate-50/60 dark:bg-slate-800/20 border border-slate-200/80 dark:border-slate-800 rounded-xl">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                <span>3. Leave Request Status Update</span>
                <span className="text-[10px] text-slate-400 font-mono">key: leaveStatus</span>
              </label>
              <textarea
                rows={4}
                value={settings.whatsappTemplates?.leaveStatus || DEFAULT_WHATSAPP_TEMPLATES.leaveStatus}
                onChange={(e) => {
                  onUpdateSettings({
                    ...settings,
                    whatsappTemplates: {
                      ...DEFAULT_WHATSAPP_TEMPLATES,
                      ...settings.whatsappTemplates,
                      leaveStatus: e.target.value
                    }
                  });
                }}
                className="w-full p-2.5 text-xs font-mono bg-white dark:bg-[#0b1812] border border-slate-200 dark:border-[#1e3a2f] rounded-lg text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-[#03623c]" />
            </div>

            {/* Late Warning */}
            <div className="space-y-1.5 p-3.5 bg-slate-50/60 dark:bg-slate-800/20 border border-slate-200/80 dark:border-slate-800 rounded-xl">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                <span>4. Late Arrival Warning Notice</span>
                <span className="text-[10px] text-slate-400 font-mono">key: lateWarning</span>
              </label>
              <textarea
                rows={4}
                value={settings.whatsappTemplates?.lateWarning || DEFAULT_WHATSAPP_TEMPLATES.lateWarning}
                onChange={(e) => {
                  onUpdateSettings({
                    ...settings,
                    whatsappTemplates: {
                      ...DEFAULT_WHATSAPP_TEMPLATES,
                      ...settings.whatsappTemplates,
                      lateWarning: e.target.value
                    }
                  });
                }}
                className="w-full p-2.5 text-xs font-mono bg-white dark:bg-[#0b1812] border border-slate-200 dark:border-[#1e3a2f] rounded-lg text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-[#03623c]" />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EMAIL STANDARD TEMPLATES */}
      {activeTab === 'email' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
              {'Standard Automated Email HR Templates:'}
            </span>
            <button
              type="button"
              onClick={() => {
                onUpdateSettings({
                  ...settings,
                  emailTemplates: { ...DEFAULT_EMAIL_TEMPLATES }
                });
                triggerSaveNotify('Email templates reset to defaults.');
              }}
              className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 flex items-center gap-1 font-bold underline cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{'Reset to Default'}</span>
            </button>
          </div>

          <div className="space-y-4">
            {/* Payslip Email */}
            <div className="p-3.5 bg-slate-50/60 dark:bg-slate-800/20 border border-slate-200/80 dark:border-slate-800 rounded-xl space-y-2">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">1. Payslip Issue Email Template</div>
              <div className="space-y-1">
                <label className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">Subject Line:</label>
                <input
                  type="text"
                  value={settings.emailTemplates?.payslipSubject || DEFAULT_EMAIL_TEMPLATES.payslipSubject}
                  onChange={(e) => {
                    onUpdateSettings({
                      ...settings,
                      emailTemplates: {
                        ...DEFAULT_EMAIL_TEMPLATES,
                        ...settings.emailTemplates,
                        payslipSubject: e.target.value
                      }
                    });
                  }}
                  className="w-full p-2 text-xs font-bold bg-white dark:bg-[#0b1812] border border-slate-200 dark:border-[#1e3a2f] rounded-lg" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">Body Message:</label>
                <textarea
                  rows={4}
                  value={settings.emailTemplates?.payslipBody || DEFAULT_EMAIL_TEMPLATES.payslipBody}
                  onChange={(e) => {
                    onUpdateSettings({
                      ...settings,
                      emailTemplates: {
                        ...DEFAULT_EMAIL_TEMPLATES,
                        ...settings.emailTemplates,
                        payslipBody: e.target.value
                      }
                    });
                  }}
                  className="w-full p-2.5 text-xs font-sans bg-white dark:bg-[#0b1812] border border-slate-200 dark:border-[#1e3a2f] rounded-lg" />
              </div>
            </div>

            {/* Miss Punch Email */}
            <div className="p-3.5 bg-slate-50/60 dark:bg-slate-800/20 border border-slate-200/80 dark:border-slate-800 rounded-xl space-y-2">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">2. Missed Punch Alert Email Template</div>
              <div className="space-y-1">
                <label className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">Subject Line:</label>
                <input
                  type="text"
                  value={settings.emailTemplates?.missPunchSubject || DEFAULT_EMAIL_TEMPLATES.missPunchSubject}
                  onChange={(e) => {
                    onUpdateSettings({
                      ...settings,
                      emailTemplates: {
                        ...DEFAULT_EMAIL_TEMPLATES,
                        ...settings.emailTemplates,
                        missPunchSubject: e.target.value
                      }
                    });
                  }}
                  className="w-full p-2 text-xs font-bold bg-white dark:bg-[#0b1812] border border-slate-200 dark:border-[#1e3a2f] rounded-lg" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">Body Message:</label>
                <textarea
                  rows={4}
                  value={settings.emailTemplates?.missPunchBody || DEFAULT_EMAIL_TEMPLATES.missPunchBody}
                  onChange={(e) => {
                    onUpdateSettings({
                      ...settings,
                      emailTemplates: {
                        ...DEFAULT_EMAIL_TEMPLATES,
                        ...settings.emailTemplates,
                        missPunchBody: e.target.value
                      }
                    });
                  }}
                  className="w-full p-2.5 text-xs font-sans bg-white dark:bg-[#0b1812] border border-slate-200 dark:border-[#1e3a2f] rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CUSTOM ADDED TEMPLATES LIST */}
      {activeTab === 'custom' && (() => {
        const customTemplates = settings.customMessageTemplates || [];

        //Apply Purpose, Channel, and Text search filtering
        const filteredCustomTemplates = customTemplates.filter((tpl) => {
          const tplPurpose = tpl.purpose || 'General Notice';
          if (filterPurpose !== 'all' && tplPurpose !== filterPurpose) {
            return false;
          }
          if (filterChannel !== 'all' && tpl.category !== filterChannel) {
            return false;
          }
          if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            const matchName = tpl.name.toLowerCase().includes(q);
            const matchWa = (tpl.whatsappBody || '').toLowerCase().includes(q);
            const matchEmailSub = (tpl.emailSubject || '').toLowerCase().includes(q);
            const matchEmailBody = (tpl.emailBody || '').toLowerCase().includes(q);
            const matchPurpose = tplPurpose.toLowerCase().includes(q);
            if (!matchName && !matchWa && !matchEmailSub && !matchEmailBody && !matchPurpose) {
              return false;
            }
          }
          return true;
        });

        const hasActiveFilters = filterPurpose !== 'all' || filterChannel !== 'all' || searchQuery.trim() !== '';

        return (
          <div className="space-y-4">
            {/* Filter Controls Bar */}
            <div className="p-3.5 bg-slate-50/90 dark:bg-[#0b1812] border border-slate-200/80 dark:border-[#1e3a2f] rounded-2xl space-y-3 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-100 dark:bg-emerald-950 text-[#03623c] dark:text-emerald-300 rounded-lg">
                    <Filter className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-black uppercase text-slate-800 dark:text-slate-100 tracking-wider">
                    {'Filter Custom Templates'}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                    {filteredCustomTemplates.length}{customTemplates.length}
                  </span>
                </div>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={() => {
                      setFilterPurpose('all');
                      setFilterChannel('all');
                      setSearchQuery('');
                    }}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-800 dark:text-rose-400 flex items-center gap-1 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-900 transition-all cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>{'Clear All Filters'}</span>
                  </button>
                )}
              </div>

              {/* Main Filter Inputs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* 1. Purpose Filter Dropdown */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Tag className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>{'Template Purpose:'}</span>
                  </label>
                  <select
                    value={filterPurpose}
                    onChange={(e) => setFilterPurpose(e.target.value)}
                    className="w-full p-2 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-[#03623c]"
                  >
                    <option value="all">{'All Template Purposes'}</option>
                    {TEMPLATE_PURPOSES.map((p) => {
                      const count = customTemplates.filter((t) => (t.purpose || 'General Notice') === p.id).length;
                      return (
                        <option key={p.id} value={p.id}>
                          {isEn ? p.labelEn : p.labelHi} ({count})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* 2. Channel Filter Dropdown */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <SlidersHorizontal className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>{'Channel:'}</span>
                  </label>
                  <select
                    value={filterChannel}
                    onChange={(e: any) => setFilterChannel(e.target.value)}
                    className="w-full p-2 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-[#03623c]"
                  >
                    <option value="all">{'All Channels (WA & Email)'}</option>
                    <option value="both">{'Both WhatsApp & Email'}</option>
                    <option value="whatsapp">{'WhatsApp Only'}</option>
                    <option value="email">{'Email Only'}</option>
                  </select>
                </div>

                {/* 3. Search Box */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Search className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>{'Search Template:'}</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder={'Search by title or text...'}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full p-2 pl-7 text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-[#03623c]" />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2.5" />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Purpose Pill Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">
                  {'Quick Purpose:'}
                </span>
                <button
                  type="button"
                  onClick={() => setFilterPurpose('all')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    filterPurpose === 'all'
                      ? 'bg-[#03623c] text-white shadow-2xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {'All'} ({customTemplates.length})
                </button>
                {TEMPLATE_PURPOSES.map((p) => {
                  const count = customTemplates.filter((t) => (t.purpose || 'General Notice') === p.id).length;
                  if (count === 0 && filterPurpose !== p.id) return null;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setFilterPurpose(p.id)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        filterPurpose === p.id
                          ? 'bg-[#03623c] text-white shadow-2xs'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>{p.id}</span>
                      <span className={`text-[9px] px-1 py-0.2 rounded-full ${filterPurpose === p.id ? 'bg-emerald-800 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Template List or Empty state */}
            {customTemplates.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-500 font-medium">
                  {'No custom templates added yet.'}
                </p>
                <button
                  type="button"
                  onClick={handleOpenAddModal}
                  className="bg-[#03623c] text-white px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{'Create Your First Custom Template'}</span>
                </button>
              </div>
            ) : filteredCustomTemplates.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
                <Filter className="w-6 h-6 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-600 dark:text-slate-300 font-bold">
                  {'No custom templates match the selected filter.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setFilterPurpose('all');
                    setFilterChannel('all');
                    setSearchQuery('');
                  }}
                  className="text-xs text-[#03623c] font-bold underline cursor-pointer"
                >
                  {'Reset filters to show all'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredCustomTemplates.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="p-4 bg-slate-50/80 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-700/60 rounded-xl space-y-2.5 hover:border-emerald-300 transition-all shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 bg-emerald-100 dark:bg-emerald-950 text-[#03623c] dark:text-emerald-300 rounded-lg text-xs font-bold">
                            {tpl.category === 'whatsapp' ? <MessageSquare className="w-3.5 h-3.5" /> : tpl.category === 'email' ? <Mail className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                          </span>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{tpl.name}</h4>
                        </div>

                        {/* Badges: Purpose + Channel */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/70 text-[#03623c] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-md text-[10px] font-bold flex items-center gap-1">
                            <Tag className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span>{tpl.purpose || 'General Notice'}</span>
                          </span>

                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-md text-[10px] font-bold">
                            {tpl.category === 'both' ? 'WA & Email' : tpl.category === 'whatsapp' ? 'WhatsApp' : 'Email'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(tpl)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg cursor-pointer transition-all"
                          title="Edit Template"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCustomTemplate(tpl.id, tpl.name)}
                          className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer transition-all"
                          title="Delete Template"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {tpl.whatsappBody && (
                      <div className="text-[11px] font-mono text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 line-clamp-2">
                        <span className="font-bold text-emerald-600">WA:</span> {tpl.whatsappBody}
                      </div>
                    )}

                    {tpl.emailSubject && (
                      <div className="text-[11px] text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 line-clamp-1">
                        <span className="font-bold text-blue-600">Email Sub:</span> {tpl.emailSubject}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* Save Button Footer */}
      <div className="pt-2 border-t border-slate-100 dark:border-[#1e3a2f] flex justify-end">
        <button
          type="button"
          onClick={() => {
            onSaveAll();
            triggerSaveNotify('All template changes saved to Firestore database!');
          }}
          className="bg-[#03623c] hover:bg-[#024d2e] text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm cursor-pointer transition-all active:scale-98"
        >
          {'Save All Template Configurations'}
        </button>
      </div>

      {/* ADDEDIT TEMPLATE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-[180] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold">
                  {editingTemplateId
                    ? ('Edit Custom Template')
                    : ('Add New Custom Template')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-slate-800 text-slate-300 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs font-sans grow">
              {/* Info banner about usage */}
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl flex items-start gap-2 text-blue-800 dark:text-blue-300">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <span className="font-extrabold">{'Where is this template used?'}</span>
                  <p className="mt-0.5 text-blue-700 dark:text-blue-300">
                    {'After saving, this template will appear in the "Select Template" dropdown inside the WhatsApp & Email Notification Modal across Attendance, Payslips, Ledger, and Recruitment boards.'}
                  </p>
                </div>
              </div>

              {/* Name */}
              <div className="space-y-1">
                <label className="font-bold text-slate-800 dark:text-slate-200">
                  {'Template NameTitle:'}
                </label>
                <input
                  type="text"
                  placeholder={'e.g. Festival Advance Alert or Warning Notice'}
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white" />
              </div>

              {/* Purpose Category */}
              <div className="space-y-1">
                <label className="font-bold text-slate-800 dark:text-slate-200">
                  {'Template PurposeDepartment:'}
                </label>
                <select
                  value={formPurpose}
                  onChange={(e) => setFormPurpose(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white"
                >
                  {TEMPLATE_PURPOSES.map((p) => (
                    <option key={p.id} value={p.id}>
                      {isEn ? p.labelEn : p.labelHi}
                    </option>
                  ))}
                </select>
              </div>

              {/* Channel Category */}
              <div className="space-y-1">
                <label className="font-bold text-slate-800 dark:text-slate-200">
                  {'Applicable Channel:'}
                </label>
                <select
                  value={formCategory}
                  onChange={(e: any) => setFormCategory(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white"
                >
                  <option value="both">{'Both WhatsApp & Email'}</option>
                  <option value="whatsapp">{'WhatsApp Only'}</option>
                  <option value="email">{'Email Only'}</option>
                </select>
              </div>

              {/* Dynamic Variables Inserter */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1 border border-slate-200/80">
                <div className="text-[10px] font-bold text-slate-500 uppercase">
                  {'Click variable to append into active text fields:'}
                </div>
                <div className="flex flex-wrap gap-1">
                  {availableVariables.map((v) => (
                    <button
                      key={v.key}
                      type="button"
                      onClick={() => {
                        if (formCategory !== 'email') handleCopyVariable(v.key, 'wa');
                        if (formCategory !== 'whatsapp') handleCopyVariable(v.key, 'emailBody');
                      }}
                      className="px-2 py-0.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-[10px] font-mono text-[#03623c] dark:text-emerald-400 font-bold hover:bg-emerald-50 cursor-pointer"
                    >
                      + {v.key}
                    </button>
                  ))}
                </div>
              </div>

              {/* WhatsApp Body */}
              {(formCategory === 'whatsapp' || formCategory === 'both') && (
                <div className="space-y-1">
                  <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                    <span>{'WhatsApp Message Body:'}</span>
                  </label>
                  <textarea
                    rows={4}
                    value={formWaBody}
                    onChange={(e) => setFormWaBody(e.target.value)}
                    className="w-full p-2.5 text-xs font-mono border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white" />
                </div>
              )}

              {/* Email Subject & Body */}
              {(formCategory === 'email' || formCategory === 'both') && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 dark:text-slate-200">
                      {'Email Subject Line:'}
                    </label>
                    <input
                      type="text"
                      value={formEmailSub}
                      onChange={(e) => setFormEmailSub(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white" />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 dark:text-slate-200">
                      {'Email Body:'}
                    </label>
                    <textarea
                      rows={4}
                      value={formEmailBody}
                      onChange={(e) => setFormEmailBody(e.target.value)}
                      className="w-full p-2.5 text-xs font-sans border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white" />
                  </div>
                </div>
              )}

              {/* Live Render Preview */}
              <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-1.5">
                <div className="text-[10px] font-extrabold uppercase text-[#03623c] dark:text-emerald-400 flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{'Live Processed Preview (Rahul Sharma):'}</span>
                </div>
                {formWaBody && (
                  <p className="text-[11px] font-mono text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 p-2 rounded border border-emerald-200/60 whitespace-pre-wrap">
                    {processTemplate(formWaBody, sampleVars)}
                  </p>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                {'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSaveCustomTemplate}
                className="bg-[#03623c] hover:bg-[#024d2e] text-white px-5 py-2 rounded-xl text-xs font-bold cursor-pointer shadow-sm"
              >
                {'Save Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateManager;
