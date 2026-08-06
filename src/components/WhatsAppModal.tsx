import React, { useState } from 'react';
import { 
  Send, 
  X, 
  MessageSquare, 
  Mail, 
  Copy, 
  Check, 
  ExternalLink, 
  Smartphone, 
  Key, 
  FileSpreadsheet, 
  Sparkles,
  Info
} from 'lucide-react';
import { AdminSettings } from '../types';
import { useModalBackHandler } from '../utils/useHistoryBackHandler';
import { 
  buildMessageAutoSenderUrl, 
  buildMessageAutoSenderExcelFormula, 
  buildStandardWhatsAppUrl, 
  buildMailtoUrl, 
  formatPhoneNumber,
  processTemplate,
  DEFAULT_WHATSAPP_TEMPLATES,
  DEFAULT_EMAIL_TEMPLATES
} from '../utils/whatsappHelper';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AdminSettings;
  recipient: {
    name: string;
    mobileNo?: string;
    email?: string;
    employeeId?: string;
  };
  title?: string;
  defaultCategory?: 'payslip' | 'missPunch' | 'leaveStatus' | 'lateWarning' | 'salaryDisbursed' | 'customNotice';
  variables?: Record<string, string | number | undefined>;
  emailSubject?: string;
  emailBody?: string;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  isOpen,
  onClose,
  settings,
  recipient,
  title = 'Send HR WhatsApp & Email Alert',
  defaultCategory = 'customNotice',
  variables = {},
  emailSubject: customEmailSubject,
  emailBody: customEmailBody
}) => {
  useModalBackHandler(isOpen, onClose, 'whatsapp-modal');

  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'whatsapp' | 'email' | 'formula'>('whatsapp');
  const [copiedFormula, setCopiedFormula] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [sentStatus, setSentStatus] = useState<string | null>(null);

  // Default credentials or fallback
  const username = settings.whatsappUsername || 'User';
  const password = settings.whatsappPassword || 'Password';
  const companyName = settings.companyName || 'Rathi Buildmart';

  // Merge default variables with company & recipient details
  const mergedVars: Record<string, string | number | undefined> = {
    NAME: recipient.name,
    COMPANY_NAME: companyName,
    HR_CONTACT: settings.hrContactPhone || settings.hrContactEmail || 'HR Desk',
    DATE: new Date().toISOString().split('T')[0],
    ...variables
  };

  // Resolve template text
  const userWaTemplate = settings.whatsappTemplates?.[defaultCategory] || DEFAULT_WHATSAPP_TEMPLATES[defaultCategory] || DEFAULT_WHATSAPP_TEMPLATES.customNotice;
  const initialWaMessage = processTemplate(userWaTemplate, mergedVars);

  const [waMessage, setWaMessage] = useState(initialWaMessage);

  // Email subject/body resolve
  const defaultSubject = settings.emailTemplates?.payslipSubject || DEFAULT_EMAIL_TEMPLATES.payslipSubject;
  const defaultBody = settings.emailTemplates?.payslipBody || DEFAULT_EMAIL_TEMPLATES.payslipBody;

  const resolvedEmailSubject = customEmailSubject || processTemplate(defaultSubject, mergedVars);
  const resolvedEmailBody = customEmailBody || processTemplate(defaultBody, mergedVars);

  const [emailSub, setEmailSub] = useState(resolvedEmailSubject);
  const [emailText, setEmailText] = useState(resolvedEmailBody);

  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>(defaultCategory);

  // Template switching logic
  const handleSelectTemplate = (key: string) => {
    setSelectedTemplateKey(key);

    // Check if key matches custom template list
    const customTpl = (settings.customMessageTemplates || []).find((t) => t.id === key);
    if (customTpl) {
      if (customTpl.whatsappBody) {
        setWaMessage(processTemplate(customTpl.whatsappBody, mergedVars));
      }
      if (customTpl.emailSubject) {
        setEmailSub(processTemplate(customTpl.emailSubject, mergedVars));
      }
      if (customTpl.emailBody) {
        setEmailText(processTemplate(customTpl.emailBody, mergedVars));
      }
    } else {
      // Standard template keys
      const stdWa = settings.whatsappTemplates?.[key as keyof typeof DEFAULT_WHATSAPP_TEMPLATES] || DEFAULT_WHATSAPP_TEMPLATES[key as keyof typeof DEFAULT_WHATSAPP_TEMPLATES] || DEFAULT_WHATSAPP_TEMPLATES.customNotice;
      setWaMessage(processTemplate(stdWa, mergedVars));

      // Standard email matching if applicable
      if (key === 'payslip') {
        const sub = settings.emailTemplates?.payslipSubject || DEFAULT_EMAIL_TEMPLATES.payslipSubject;
        const body = settings.emailTemplates?.payslipBody || DEFAULT_EMAIL_TEMPLATES.payslipBody;
        setEmailSub(processTemplate(sub, mergedVars));
        setEmailText(processTemplate(body, mergedVars));
      } else if (key === 'missPunch') {
        const sub = settings.emailTemplates?.missPunchSubject || DEFAULT_EMAIL_TEMPLATES.missPunchSubject;
        const body = settings.emailTemplates?.missPunchBody || DEFAULT_EMAIL_TEMPLATES.missPunchBody;
        setEmailSub(processTemplate(sub, mergedVars));
        setEmailText(processTemplate(body, mergedVars));
      } else if (key === 'leaveStatus') {
        const sub = settings.emailTemplates?.leaveSubject || DEFAULT_EMAIL_TEMPLATES.leaveSubject;
        const body = settings.emailTemplates?.leaveBody || DEFAULT_EMAIL_TEMPLATES.leaveBody;
        setEmailSub(processTemplate(sub, mergedVars));
        setEmailText(processTemplate(body, mergedVars));
      }
    }
  };

  const cleanPhone = formatPhoneNumber(recipient.mobileNo);

  // MessageAutoSender API URL
  const autoSenderUrl = buildMessageAutoSenderUrl(
    username,
    password,
    cleanPhone || recipient.mobileNo || '',
    recipient.name,
    waMessage
  );

  // Standard WhatsApp URL
  const standardWaUrl = buildStandardWhatsAppUrl(cleanPhone || recipient.mobileNo || '', waMessage);

  // Excel Formula requested by user:
  // =HYPERLINK("https://app.messageautosender.com/message/new?username="&User&"&password="&Password&"&receiverMobileNo="&B6&"&receiverName=test&message=MESSAGETEST","Manual Test Send")
  const excelFormula = `=HYPERLINK("https://app.messageautosender.com/message/new?username="${username}"&password="${password}"&receiverMobileNo="${cleanPhone || 'MOBILE'}"&receiverName="${recipient.name || 'NAME'}"&message="${waMessage.replace(/"/g, '""')}","Manual Test Send")`;

  const handleCopyFormula = () => {
    navigator.clipboard.writeText(excelFormula);
    setCopiedFormula(true);
    setTimeout(() => setCopiedFormula(false), 2000);
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(waMessage);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleSendAutoSender = () => {
    if (!recipient.mobileNo && !cleanPhone) {
      alert('Recipient mobile number is missing.');
      return;
    }
    window.open(autoSenderUrl, '_blank', 'noopener,noreferrer');
    setSentStatus('WhatsApp Message dispatched via MessageAutoSender API URL!');
  };

  const handleSendStandardWa = () => {
    if (!recipient.mobileNo && !cleanPhone) {
      alert('Recipient mobile number is missing.');
      return;
    }
    window.open(standardWaUrl, '_blank', 'noopener,noreferrer');
    setSentStatus('Opened WhatsApp Web chat window!');
  };

  const handleSendEmail = () => {
    if (!recipient.email) {
      alert('Recipient email address is missing.');
      return;
    }
    const mailto = buildMailtoUrl(recipient.email, emailSub, emailText);
    window.open(mailto, '_blank');
    setSentStatus('Opened default Email client!');
  };

  return (
    <div className="fixed inset-0 z-[160] bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-[#11221b] border border-slate-200 dark:border-[#1e3a2f] rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#03623c] to-[#024d2e] p-4 sm:p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-xs border border-white/20 shrink-0">
              <MessageSquare className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight tracking-tight">{title}</h3>
              <p className="text-xs text-emerald-100 font-medium mt-0.5">
                Recipient: <span className="font-bold text-white">{recipient.name}</span> ({recipient.mobileNo || 'No Mobile'} | {recipient.email || 'No Email'})
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-[#1e3a2f] bg-slate-50 dark:bg-[#0c1a14] px-4 pt-3 shrink-0 gap-2">
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'whatsapp'
                ? 'border-[#03623c] text-[#03623c] dark:text-emerald-400 bg-white dark:bg-[#11221b]'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>WhatsApp (MessageAutoSender)</span>
          </button>

          <button
            onClick={() => setActiveTab('formula')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'formula'
                ? 'border-[#03623c] text-[#03623c] dark:text-emerald-400 bg-white dark:bg-[#11221b]'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-500" />
            <span>Excel Formula Link</span>
          </button>

          <button
            onClick={() => setActiveTab('email')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'email'
                ? 'border-[#03623c] text-[#03623c] dark:text-emerald-400 bg-white dark:bg-[#11221b]'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <Mail className="w-4 h-4 text-blue-500" />
            <span>Email Alert</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-4 grow font-sans">

          {/* Quick Template Switcher Dropdown */}
          <div className="p-3 bg-slate-50 dark:bg-[#0c1a14] border border-slate-200 dark:border-[#1e3a2f] rounded-xl flex items-center justify-between gap-3 text-xs">
            <span className="font-extrabold text-slate-700 dark:text-slate-200 shrink-0 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#03623c] dark:text-emerald-400" />
              <span>Select Template:</span>
            </span>
            <select
              value={selectedTemplateKey}
              onChange={(e) => handleSelectTemplate(e.target.value)}
              className="bg-white dark:bg-[#11221b] border border-slate-200 dark:border-[#1e3a2f] text-slate-800 dark:text-slate-100 rounded-lg px-2.5 py-1.5 font-bold text-xs focus:ring-2 focus:ring-[#03623c] cursor-pointer grow max-w-xs"
            >
              <optgroup label="Standard HR Templates">
                <option value="payslip">1. Payslip Shared Alert</option>
                <option value="missPunch">2. Missed Punch Alert</option>
                <option value="leaveStatus">3. Leave Request Status Update</option>
                <option value="lateWarning">4. Late Arrival Warning</option>
                <option value="salaryDisbursed">5. Salary Disbursed Notice</option>
                <option value="customNotice">6. Custom HR Circular</option>
              </optgroup>

              {(settings.customMessageTemplates || []).length > 0 && (
                <optgroup label="Custom Added Templates">
                  {(settings.customMessageTemplates || []).map((ct) => (
                    <option key={ct.id} value={ct.id}>
                      ★ {ct.name} ({ct.category.toUpperCase()})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {sentStatus && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{sentStatus}</span>
            </div>
          )}

          {/* TAB 1: WHATSAPP MESSAGEAUTOSENDER */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <label className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>WhatsApp Message Content:</span>
                </label>
                <button
                  onClick={handleCopyMessage}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                >
                  {copiedText ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedText ? 'Copied' : 'Copy Message'}</span>
                </button>
              </div>

              <textarea
                value={waMessage}
                onChange={(e) => setWaMessage(e.target.value)}
                rows={6}
                className="w-full p-3.5 text-xs font-mono bg-slate-50 dark:bg-[#0b1812] border border-slate-200 dark:border-[#1e3a2f] rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#03623c] leading-relaxed shadow-inner"
              />

              {/* MessageAutoSender Config Credentials status */}
              <div className="p-3 bg-amber-50/70 dark:bg-[#1a140b] border border-amber-200 dark:border-amber-900/60 rounded-xl text-xs space-y-1">
                <div className="flex items-center justify-between font-bold text-amber-900 dark:text-amber-300">
                  <span className="flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-600" />
                    <span>MessageAutoSender API Credentials:</span>
                  </span>
                  <span className="text-[10px] bg-amber-200 dark:bg-amber-900/80 px-2 py-0.5 rounded font-mono">
                    User: {username}
                  </span>
                </div>
                <p className="text-[11px] text-amber-800 dark:text-amber-400">
                  Target Mobile Number: <span className="font-bold font-mono">{cleanPhone || recipient.mobileNo || 'Not provided'}</span>
                </p>
              </div>

              {/* Direct Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleSendAutoSender}
                  className="w-full bg-[#03623c] hover:bg-[#024d2e] text-white p-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-98"
                >
                  <Send className="w-4 h-4" />
                  <span>Send via MessageAutoSender</span>
                </button>

                <button
                  onClick={handleSendStandardWa}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all active:scale-98"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open WhatsApp Web (wa.me)</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: EXCEL HYPERLINK FORMULA */}
          {activeTab === 'formula' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-900 dark:text-blue-300 space-y-1">
                <div className="font-extrabold flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>MessageAutoSender Excel / Google Sheet Formula Generator</span>
                </div>
                <p className="text-[11px] leading-relaxed text-blue-800 dark:text-blue-300">
                  Copy this exact HYPERLINK formula and paste it into your Google Sheets or Excel payroll sheet to trigger one-click WhatsApp sends directly from your spreadsheets!
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                  Generated Excel HYPERLINK Formula:
                </label>
                <div className="relative">
                  <textarea
                    readOnly
                    value={excelFormula}
                    rows={4}
                    className="w-full p-3 pr-10 text-xs font-mono bg-slate-900 text-emerald-400 border border-slate-800 rounded-xl focus:outline-none leading-relaxed select-all"
                  />
                  <button
                    onClick={handleCopyFormula}
                    className="absolute top-2.5 right-2.5 p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg cursor-pointer transition-all shadow-xs"
                    title="Copy Formula"
                  >
                    {copiedFormula ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-[#0b1812] border border-slate-200 dark:border-[#1e3a2f] rounded-xl space-y-2">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Formula Syntax Breakdown:</h4>
                <div className="font-mono text-[10px] text-slate-600 dark:text-slate-300 space-y-1">
                  <div>• <span className="font-bold text-emerald-600 dark:text-emerald-400">username</span> = "{username}"</div>
                  <div>• <span className="font-bold text-emerald-600 dark:text-emerald-400">password</span> = "{password}"</div>
                  <div>• <span className="font-bold text-emerald-600 dark:text-emerald-400">receiverMobileNo</span> = "{cleanPhone || recipient.mobileNo || 'B6'}"</div>
                  <div>• <span className="font-bold text-emerald-600 dark:text-emerald-400">receiverName</span> = "{recipient.name}"</div>
                </div>
              </div>

              <button
                onClick={handleCopyFormula}
                className="w-full bg-[#03623c] hover:bg-[#024d2e] text-white p-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-98"
              >
                {copiedFormula ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copiedFormula ? 'Formula Copied to Clipboard!' : 'Copy Excel HYPERLINK Formula'}</span>
              </button>
            </div>
          )}

          {/* TAB 3: EMAIL ALERT */}
          {activeTab === 'email' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200">Email Subject:</label>
                <input
                  type="text"
                  value={emailSub}
                  onChange={(e) => setEmailSub(e.target.value)}
                  className="w-full p-2.5 text-xs font-bold bg-slate-50 dark:bg-[#0b1812] border border-slate-200 dark:border-[#1e3a2f] rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#03623c]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200">Email Body:</label>
                <textarea
                  value={emailText}
                  onChange={(e) => setEmailText(e.target.value)}
                  rows={6}
                  className="w-full p-3 text-xs font-sans bg-slate-50 dark:bg-[#0b1812] border border-slate-200 dark:border-[#1e3a2f] rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#03623c] leading-relaxed shadow-inner"
                />
              </div>

              <button
                onClick={handleSendEmail}
                disabled={!recipient.email}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white p-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-98"
              >
                <Mail className="w-4 h-4" />
                <span>Send Email to {recipient.email || '(No Email Specified)'}</span>
              </button>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-[#0c1a14] border-t border-slate-200 dark:border-[#1e3a2f] flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
          >
            Close Window
          </button>
        </div>

      </div>
    </div>
  );
};
