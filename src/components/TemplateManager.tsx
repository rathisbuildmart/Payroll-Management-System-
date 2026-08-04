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
  FileText
} from 'lucide-react';
import { AdminSettings } from '../types';
import { DEFAULT_WHATSAPP_TEMPLATES, DEFAULT_EMAIL_TEMPLATES, processTemplate } from '../utils/whatsappHelper';

interface TemplateManagerProps {
  language: 'en' | 'hi';
  settings: AdminSettings;
  onUpdateSettings: (updated: AdminSettings) => void;
  onSaveAll: () => void;
}

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

  // Form states for adding/editing custom template
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<'whatsapp' | 'email' | 'both'>('both');
  const [formWaBody, setFormWaBody] = useState('');
  const [formEmailSub, setFormEmailSub] = useState('');
  const [formEmailBody, setFormEmailBody] = useState('');

  const [copiedVar, setCopiedVar] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const availableVariables = [
    { key: '{NAME}', label: isEn ? 'Employee Name' : 'कर्मचारी का नाम' },
    { key: '{COMPANY_NAME}', label: isEn ? 'Company Name' : 'कंपनी का नाम' },
    { key: '{DATE}', label: isEn ? 'Date' : 'दिनांक' },
    { key: '{MONTH}', label: isEn ? 'Month Year' : 'माह वर्ष' },
    { key: '{BASIC}', label: isEn ? 'Basic Salary' : 'मूल वेतन' },
    { key: '{NET_SALARY}', label: isEn ? 'Net Salary' : 'कुल शुद्ध वेतन' },
    { key: '{STATUS}', label: isEn ? 'Status' : 'स्थिति' },
    { key: '{DATES}', label: isEn ? 'Leave Dates' : 'छुट्टी की तारीखें' },
    { key: '{LEAVE_TYPE}', label: isEn ? 'Leave Type' : 'छुट्टी का प्रकार' },
    { key: '{CHECK_IN}', label: isEn ? 'Check-in Time' : 'आगमन समय' },
    { key: '{HR_CONTACT}', label: isEn ? 'HR Contact' : 'एचआर संपर्क' },
    { key: '{REMARKS}', label: isEn ? 'Remarks' : 'टिप्पणी' },
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
    setFormWaBody('Hello {NAME},\n\nThis is an official notice from {COMPANY_NAME}.\nDate: {DATE}');
    setFormEmailSub('Notice for {NAME} - {COMPANY_NAME}');
    setFormEmailBody('Dear {NAME},\n\nPlease review this notice from {COMPANY_NAME}.\n\nDate: {DATE}\n\nRegards,\nHR Management');
    setShowAddModal(true);
  };

  const handleOpenEditModal = (tpl: any) => {
    setEditingTemplateId(tpl.id);
    setFormName(tpl.name || '');
    setFormCategory(tpl.category || 'both');
    setFormWaBody(tpl.whatsappBody || '');
    setFormEmailSub(tpl.emailSubject || '');
    setFormEmailBody(tpl.emailBody || '');
    setShowAddModal(true);
  };

  const handleSaveCustomTemplate = () => {
    if (!formName.trim()) {
      alert(isEn ? 'Please enter a template title/name.' : 'कृपया टेम्पलेट का नाम दर्ज करें।');
      return;
    }

    const currentCustoms = settings.customMessageTemplates || [];

    if (editingTemplateId) {
      // Update existing
      const updatedList = currentCustoms.map((t) =>
        t.id === editingTemplateId
          ? {
              ...t,
              name: formName.trim(),
              category: formCategory,
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
      // Add new
      const newTpl = {
        id: `custom_tpl_${Date.now()}`,
        name: formName.trim(),
        category: formCategory,
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
    triggerSaveNotify(isEn ? 'Custom template saved successfully!' : 'कस्टम टेम्पलेट सफलतापूर्वक सहेजा गया!');
  };

  const handleDeleteCustomTemplate = (id: string, name: string) => {
    if (confirm(isEn ? `Are you sure you want to delete template "${name}"?` : `क्या आप वाकई टेम्पलेट "${name}" हटाना चाहते हैं?`)) {
      const updatedList = (settings.customMessageTemplates || []).filter((t) => t.id !== id);
      onUpdateSettings({
        ...settings,
        customMessageTemplates: updatedList
      });
      triggerSaveNotify(isEn ? 'Template deleted.' : 'टेम्पलेट हटा दिया गया।');
    }
  };

  const triggerSaveNotify = (msg: string) => {
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  // Helper for live preview rendering
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
              {isEn ? 'WhatsApp & Email Message Templates Manager' : 'व्हाट्सएप एवं ईमेल संदेश टेम्पलेट प्रबंधक'}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isEn
                ? 'Edit pre-built notification templates or create your own custom HR message templates'
                : 'पहले से बने नोटिफिकेशन टेम्पलेट्स संपादित करें या नए कस्टम एचआर टेम्पलेट जोड़ें'}
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
            <span>{isEn ? '+ Add New Template' : '+ नया टेम्पलेट जोड़ें'}</span>
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
          <span>{isEn ? 'WhatsApp Templates' : 'व्हाट्सएप टेम्पलेट्स'}</span>
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
          <span>{isEn ? 'Email Templates' : 'ईमेल टेम्पलेट्स'}</span>
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
            {isEn ? 'Custom Added Templates' : 'कस्टम जोड़े गए टेम्पलेट'} ({(settings.customMessageTemplates || []).length})
          </span>
        </button>
      </div>

      {/* Variable Cheat-Sheet */}
      <div className="p-3 bg-slate-50 dark:bg-[#0b1812] border border-slate-200/80 dark:border-[#1e3a2f] rounded-xl space-y-1.5">
        <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
          <span>{isEn ? 'Available Dynamic Variables (Click to copy variable tag):' : 'उपलब्ध वैरिएबल टैग (कॉपी करने के लिए क्लिक करें):'}</span>
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
              {isEn ? 'Standard Automated WhatsApp HR Templates:' : 'मानक स्वचालित व्हाट्सएप एचआर टेम्पलेट्स:'}
            </span>
            <button
              type="button"
              onClick={() => {
                onUpdateSettings({
                  ...settings,
                  whatsappTemplates: { ...DEFAULT_WHATSAPP_TEMPLATES }
                });
                triggerSaveNotify(isEn ? 'WhatsApp templates reset to factory defaults.' : 'व्हाट्सएप टेम्पलेट रिसेट किए गए।');
              }}
              className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 flex items-center gap-1 font-bold underline cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{isEn ? 'Reset to Default' : 'डिफ़ॉल्ट पर रिसेट करें'}</span>
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
                className="w-full p-2.5 text-xs font-mono bg-white dark:bg-[#0b1812] border border-slate-200 dark:border-[#1e3a2f] rounded-lg text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-[#03623c]"
              />
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
                className="w-full p-2.5 text-xs font-mono bg-white dark:bg-[#0b1812] border border-slate-200 dark:border-[#1e3a2f] rounded-lg text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-[#03623c]"
              />
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
                className="w-full p-2.5 text-xs font-mono bg-white dark:bg-[#0b1812] border border-slate-200 dark:border-[#1e3a2f] rounded-lg text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-[#03623c]"
              />
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
                className="w-full p-2.5 text-xs font-mono bg-white dark:bg-[#0b1812] border border-slate-200 dark:border-[#1e3a2f] rounded-lg text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-[#03623c]"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EMAIL STANDARD TEMPLATES */}
      {activeTab === 'email' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
              {isEn ? 'Standard Automated Email HR Templates:' : 'मानक स्वचालित ईमेल एचआर टेम्पलेट्स:'}
            </span>
            <button
              type="button"
              onClick={() => {
                onUpdateSettings({
                  ...settings,
                  emailTemplates: { ...DEFAULT_EMAIL_TEMPLATES }
                });
                triggerSaveNotify(isEn ? 'Email templates reset to defaults.' : 'ईमेल डिफ़ॉल्ट रिसेट किए गए।');
              }}
              className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 flex items-center gap-1 font-bold underline cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{isEn ? 'Reset to Default' : 'डिफ़ॉल्ट पर रिसेट करें'}</span>
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
                  className="w-full p-2 text-xs font-bold bg-white dark:bg-[#0b1812] border border-slate-200 dark:border-[#1e3a2f] rounded-lg"
                />
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
                  className="w-full p-2.5 text-xs font-sans bg-white dark:bg-[#0b1812] border border-slate-200 dark:border-[#1e3a2f] rounded-lg"
                />
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
                  className="w-full p-2 text-xs font-bold bg-white dark:bg-[#0b1812] border border-slate-200 dark:border-[#1e3a2f] rounded-lg"
                />
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
                  className="w-full p-2.5 text-xs font-sans bg-white dark:bg-[#0b1812] border border-slate-200 dark:border-[#1e3a2f] rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CUSTOM ADDED TEMPLATES LIST */}
      {activeTab === 'custom' && (
        <div className="space-y-3">
          {(settings.customMessageTemplates || []).length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
              <FileText className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs text-slate-500 font-medium">
                {isEn ? 'No custom templates added yet.' : 'कोई कस्टम टेम्पलेट अभी तक नहीं जोड़ा गया है।'}
              </p>
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="bg-[#03623c] text-white px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{isEn ? 'Create Your First Custom Template' : 'पहला कस्टम टेम्पलेट बनाएं'}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(settings.customMessageTemplates || []).map((tpl) => (
                <div
                  key={tpl.id}
                  className="p-4 bg-slate-50/80 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-700/60 rounded-xl space-y-2.5 hover:border-emerald-300 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 bg-emerald-100 dark:bg-emerald-950 text-[#03623c] dark:text-emerald-300 rounded-lg text-xs font-bold">
                        {tpl.category === 'whatsapp' ? <MessageSquare className="w-3.5 h-3.5" /> : tpl.category === 'email' ? <Mail className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{tpl.name}</h4>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(tpl)}
                        className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-300 hover:bg-slate-200 rounded-lg cursor-pointer"
                        title="Edit Template"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomTemplate(tpl.id, tpl.name)}
                        className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg cursor-pointer"
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
      )}

      {/* Save Button Footer */}
      <div className="pt-2 border-t border-slate-100 dark:border-[#1e3a2f] flex justify-end">
        <button
          type="button"
          onClick={() => {
            onSaveAll();
            triggerSaveNotify(isEn ? 'All template changes saved to Firestore database!' : 'सभी टेम्पलेट परिवर्तन सुरक्षित किए गए!');
          }}
          className="bg-[#03623c] hover:bg-[#024d2e] text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm cursor-pointer transition-all active:scale-98"
        >
          {isEn ? 'Save All Template Configurations' : 'सभी टेम्पलेट कॉन्फ़िगरेशन सहेजें'}
        </button>
      </div>

      {/* ADD / EDIT TEMPLATE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-[180] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold">
                  {editingTemplateId
                    ? (isEn ? 'Edit Custom Template' : 'कस्टम टेम्पलेट संपादित करें')
                    : (isEn ? 'Add New Custom Template' : 'नया कस्टम टेम्पलेट जोड़ें')}
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
              {/* Name */}
              <div className="space-y-1">
                <label className="font-bold text-slate-800 dark:text-slate-200">
                  {isEn ? 'Template Name / Title:' : 'टेम्पलेट का शीर्षक:'}
                </label>
                <input
                  type="text"
                  placeholder={isEn ? 'e.g. Festival Advance Alert or Warning Notice' : 'उदा. त्यौहार बोनस या चेतावनी पत्र'}
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white"
                />
              </div>

              {/* Channel Category */}
              <div className="space-y-1">
                <label className="font-bold text-slate-800 dark:text-slate-200">
                  {isEn ? 'Applicable Channel:' : 'लागू चैनल:'}
                </label>
                <select
                  value={formCategory}
                  onChange={(e: any) => setFormCategory(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white"
                >
                  <option value="both">{isEn ? 'Both WhatsApp & Email' : 'व्हाट्सएप एवं ईमेल दोनों'}</option>
                  <option value="whatsapp">{isEn ? 'WhatsApp Only' : 'केवल व्हाट्सएप'}</option>
                  <option value="email">{isEn ? 'Email Only' : 'केवल ईमेल'}</option>
                </select>
              </div>

              {/* Dynamic Variables Inserter */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1 border border-slate-200/80">
                <div className="text-[10px] font-bold text-slate-500 uppercase">
                  {isEn ? 'Click variable to append into active text fields:' : 'वैरिएबल को फ़ील्ड में जोड़ने के लिए क्लिक करें:'}
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
                    <span>{isEn ? 'WhatsApp Message Body:' : 'व्हाट्सएप संदेश की विषयवस्तु:'}</span>
                  </label>
                  <textarea
                    rows={4}
                    value={formWaBody}
                    onChange={(e) => setFormWaBody(e.target.value)}
                    className="w-full p-2.5 text-xs font-mono border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white"
                  />
                </div>
              )}

              {/* Email Subject & Body */}
              {(formCategory === 'email' || formCategory === 'both') && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 dark:text-slate-200">
                      {isEn ? 'Email Subject Line:' : 'ईमेल विषय (Subject):'}
                    </label>
                    <input
                      type="text"
                      value={formEmailSub}
                      onChange={(e) => setFormEmailSub(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 dark:text-slate-200">
                      {isEn ? 'Email Body:' : 'ईमेल का मुख्य पाठ (Body):'}
                    </label>
                    <textarea
                      rows={4}
                      value={formEmailBody}
                      onChange={(e) => setFormEmailBody(e.target.value)}
                      className="w-full p-2.5 text-xs font-sans border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {/* Live Render Preview */}
              <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-1.5">
                <div className="text-[10px] font-extrabold uppercase text-[#03623c] dark:text-emerald-400 flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{isEn ? 'Live Processed Preview (Rahul Sharma):' : 'लाइव प्रोग्रेसिव पूर्वावलोकन:'}</span>
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
                {isEn ? 'Cancel' : 'रद्द करें'}
              </button>
              <button
                type="button"
                onClick={handleSaveCustomTemplate}
                className="bg-[#03623c] hover:bg-[#024d2e] text-white px-5 py-2 rounded-xl text-xs font-bold cursor-pointer shadow-sm"
              >
                {isEn ? 'Save Template' : 'टेम्पलेट सहेजें'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateManager;
