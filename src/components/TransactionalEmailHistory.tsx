import React, { useState, useMemo } from 'react';
import { safeFetchJson } from '../utils/apiHelper';
import { 
  Mail, 
  KeyRound, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Search, 
  RefreshCw, 
  Send, 
  Eye, 
  EyeOff, 
  Copy, 
  Trash2, 
  Download, 
  Server, 
  Filter, 
  Check, 
  User, 
  X,
  Sparkles,
  Info,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { TransactionalEmailLog, AdminSettings } from '../types';

interface TransactionalEmailHistoryProps {
  emailLogs: TransactionalEmailLog[];
  onClearEmailLogs: () => void;
  language: 'en' | 'hi';
  adminSettings: AdminSettings;
  onSendTestEmail?: (recipient: string, type: 'OTP' | 'Welcome Message' | 'Custom Notice', subject: string, customBody?: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  onResendEmail?: (log: TransactionalEmailLog) => Promise<{ success: boolean; message?: string; error?: string }>;
}

export default function TransactionalEmailHistory({
  emailLogs = [],
  onClearEmailLogs,
  language = 'en',
  adminSettings,
  onSendTestEmail,
  onResendEmail
}: TransactionalEmailHistoryProps) {
  //Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  //Modal & Interactive states
  const [selectedLogForModal, setSelectedLogForModal] = useState<TransactionalEmailLog | null>(null);
  const [visibleOtps, setVisibleOtps] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isResending, setIsResending] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  //Manual Email Dispatch Tool states
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [dispatchRecipient, setDispatchRecipient] = useState('');
  const [dispatchName, setDispatchName] = useState('');
  const [dispatchType, setDispatchType] = useState<'OTP' | 'Welcome Message' | 'Custom Notice'>('OTP');
  const [dispatchSubject, setDispatchSubject] = useState('');
  const [dispatchBody, setDispatchBody] = useState('');
  const [isSendingCustom, setIsSendingCustom] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const isEn = language === 'en';

  //Stats Calculations
  const stats = useMemo(() => {
    const total = emailLogs.length;
    const smtpSent = emailLogs.filter(l => l.status === 'Sent (SMTP)').length;
    const simulated = emailLogs.filter(l => l.status === 'Simulated').length;
    const failed = emailLogs.filter(l => l.status === 'Failed').length;
    const otps = emailLogs.filter(l => l.type === 'OTP').length;
    const welcome = emailLogs.filter(l => l.type === 'Welcome Message').length;
    return { total, smtpSent, simulated, failed, otps, welcome };
  }, [emailLogs]);

  //Filtered & Sorted Logs
  const filteredLogs = useMemo(() => {
    return emailLogs
      .filter(log => {
        //Type filter
        if (selectedType !== 'ALL' && log.type !== selectedType) return false;
        //Status filter
        if (selectedStatus !== 'ALL' && log.status !== selectedStatus) return false;
        //Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchRecipient = log.recipientEmail.toLowerCase().includes(q);
          const matchName = log.recipientName?.toLowerCase().includes(q);
          const matchSubject = log.subject.toLowerCase().includes(q);
          const matchOtp = log.otpCode?.toLowerCase().includes(q);
          const matchPurpose = log.purpose?.toLowerCase().includes(q);
          return matchRecipient || matchName || matchSubject || matchOtp || matchPurpose;
        }
        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.sentAt).getTime();
        const timeB = new Date(b.sentAt).getTime();
        return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
      });
  }, [emailLogs, selectedType, selectedStatus, searchQuery, sortOrder]);

  const toggleOtpVisibility = (id: string) => {
    setVisibleOtps(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTriggerResend = async (log: TransactionalEmailLog) => {
    setIsResending(log.id);
    setActionSuccessMsg(null);
    try {
      if (onResendEmail) {
        const res = await onResendEmail(log);
        if (res.success) {
          setActionSuccessMsg(`Successfully resent email to ${log.recipientEmail}`);
        } else {
          alert(res.error || ('Failed to resend email'));
        }
      } else {
        //Fallback fetch
        const { data } = await safeFetchJson('/api/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: log.recipientEmail,
            otp: log.otpCode || Math.floor(100000 + Math.random() * 900000).toString(),
            empName: log.recipientName || 'Employee',
            purpose: log.purpose?.includes('Reset') ? 'password_reset' : 'login',
            language,
            smtpSettings: {
              host: adminSettings.smtpHost,
              port: adminSettings.smtpPort,
              username: adminSettings.smtpUsername,
              password: adminSettings.smtpPassword,
              senderName: adminSettings.senderName,
              senderEmail: adminSettings.senderEmail
            }
          })
        });
        if (data?.success) {
          setActionSuccessMsg(`Resent email successfully!`);
        } else {
          alert(data?.error || 'Failed to resend email');
        }
      }
    } catch (e: any) {
      alert(e.message || 'Error resending email');
    } finally {
      setIsResending(null);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    }
  };

  const handleSendCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchRecipient.trim()) return;
    setIsSendingCustom(true);
    try {
      if (onSendTestEmail) {
        const res = await onSendTestEmail(dispatchRecipient.trim(), dispatchType, dispatchSubject || 'Transactional Notice', dispatchBody);
        if (res.success) {
          setActionSuccessMsg(`Email sent to ${dispatchRecipient}`);
          setShowDispatchModal(false);
          setDispatchRecipient('');
          setDispatchSubject('');
          setDispatchBody('');
        } else {
          alert(res.error || 'Failed to dispatch email.');
        }
      } else {
        const { data } = await safeFetchJson('/api/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: dispatchRecipient.trim(),
            otp: Math.floor(100000 + Math.random() * 900000).toString(),
            empName: dispatchName || 'Team Member',
            purpose: 'login',
            language,
            smtpSettings: {
              host: adminSettings.smtpHost,
              port: adminSettings.smtpPort,
              username: adminSettings.smtpUsername,
              password: adminSettings.smtpPassword,
              senderName: adminSettings.senderName,
              senderEmail: adminSettings.senderEmail
            }
          })
        });
        if (data?.success) {
          setActionSuccessMsg(`Transactional message dispatched successfully!`);
          setShowDispatchModal(false);
          setDispatchRecipient('');
        } else {
          alert(data?.error || 'Dispatch error');
        }
      }
    } catch (e: any) {
      alert(e.message || 'Error dispatching custom message');
    } finally {
      setIsSendingCustom(false);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    }
  };

  const exportLogsAsCSV = () => {
    if (filteredLogs.length === 0) return;
    const headers = ['ID', 'Date & Time', 'Recipient Email', 'Recipient Name', 'Type', 'Subject', 'OTP Code', 'Status', 'Method', 'Error Message'];
    const rows = filteredLogs.map(l => [
      l.id,
      new Date(l.sentAt).toLocaleString(),
      `"${l.recipientEmail}"`,
      `"${l.recipientName || ''}"`,
      `"${l.type}"`,
      `"${l.subject.replace(/"/g, '""')}"`,
      `"${l.otpCode || ''}"`,
      `"${l.status}"`,
      `"${l.method || ''}"`,
      `"${(l.errorMessage || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `transactional_email_history_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Action Notification Toast */}
      {actionSuccessMsg && (
        <div className="bg-emerald-500 text-white px-4 py-3 rounded-xl shadow-lg flex items-center justify-between text-xs font-bold animate-fade-in border border-emerald-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button onClick={() => setActionSuccessMsg(null)} className="hover:opacity-80 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Header & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#0f1d18] p-5 rounded-2xl border border-slate-200/80 dark:border-[#1e3a2f] shadow-xs">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {'Transactional Email History'}
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {'Admin Audit'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {'Complete transparent delivery audit of OTP security codes, onboarding welcome emails, and leave updates.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowDispatchModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-[#03623c] hover:bg-[#024d2e] text-white rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{'Send TestCustom Email'}</span>
          </button>

          <button
            onClick={exportLogsAsCSV}
            disabled={filteredLogs.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{'Export CSV'}</span>
          </button>

          {confirmClear ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  onClearEmailLogs();
                  setConfirmClear(false);
                }}
                className="px-3 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all cursor-pointer"
              >
                {'Confirm Clear'}
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                className="px-2.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 rounded-xl cursor-pointer"
              >
                {'Cancel'}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmClear(true)}
              disabled={emailLogs.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-xl border border-rose-200/60 dark:border-rose-900/40 transition-all cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{'Clear History'}</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-[#0f1d18] p-4 rounded-xl border border-slate-200/80 dark:border-[#1e3a2f] shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">
            <span>{'Total Dispatches'}</span>
            <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {stats.total || 0}
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
            {'Recorded in system'}
          </span>
        </div>

        <div className="bg-white dark:bg-[#0f1d18] p-4 rounded-xl border border-slate-200/80 dark:border-[#1e3a2f] shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">
            <span>{'Sent (SMTP)'}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {stats.smtpSent || 0}
          </div>
          <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-1 block">
            {(stats.total || 0) > 0 ? `${Math.round(((stats.smtpSent || 0) / stats.total) * 100)}% delivery rate` : 'Live Gateway'}
          </span>
        </div>

        <div className="bg-white dark:bg-[#0f1d18] p-4 rounded-xl border border-slate-200/80 dark:border-[#1e3a2f] shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">
            <span>{'Simulated Fallback'}</span>
            <Server className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {stats.simulated || 0}
          </div>
          <span className="text-[10px] text-amber-600/80 dark:text-amber-400/80 mt-1 block">
            {'Local / Terminal mode'}
          </span>
        </div>

        <div className="bg-white dark:bg-[#0f1d18] p-4 rounded-xl border border-slate-200/80 dark:border-[#1e3a2f] shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">
            <span>{'OTP Security Codes'}</span>
            <KeyRound className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
            {stats.otps}
          </div>
          <span className="text-[10px] text-blue-600/80 dark:text-blue-400/80 mt-1 block">
            {'Login & Password Reset'}
          </span>
        </div>

        <div className="bg-white dark:bg-[#0f1d18] p-4 rounded-xl border border-slate-200/80 dark:border-[#1e3a2f] shadow-2xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">
            <span>{'Failed Delivery'}</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
            {stats.failed}
          </div>
          <span className="text-[10px] text-rose-500 mt-1 block">
            {stats.failed > 0 ? ('Check SMTP settings') : ('Zero failed errors')}
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-[#0f1d18] p-4 rounded-2xl border border-slate-200/80 dark:border-[#1e3a2f] shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="relative md:col-span-5">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={'Search recipient email, name, subject or OTP code...'}
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Type Filter */}
          <div className="md:col-span-3">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-medium cursor-pointer"
            >
              <option value="ALL">{'All Email Types'}</option>
              <option value="OTP">{'OTP Security Codes'}</option>
              <option value="Welcome Message">{'Welcome & Onboarding'}</option>
              <option value="Leave Update">{'Leave Approval Updates'}</option>
              <option value="SMTP Test">{'SMTP Gateway Tests'}</option>
              <option value="Custom Notice">{'CustomOther Notices'}</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="md:col-span-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-medium cursor-pointer"
            >
              <option value="ALL">{'All Delivery Statuses'}</option>
              <option value="Sent (SMTP)">{'Sent (SMTP)'}</option>
              <option value="Simulated">{'Simulated'}</option>
              <option value="Failed">{'Failed'}</option>
            </select>
          </div>

          {/* Sort Order */}
          <div className="md:col-span-2">
            <button
              onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
              className="w-full flex items-center justify-between px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer"
            >
              <span>{sortOrder === 'newest' ? ('Newest First') : ('Oldest First')}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${sortOrder === 'oldest' ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filter Badges Summary */}
        {(selectedType !== 'ALL' || selectedStatus !== 'ALL' || searchQuery.trim()) && (
          <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-400 text-[11px] font-semibold">{'Active Filters:'}</span>
            {selectedType !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[11px] font-medium">
                Type: {selectedType}
                <button onClick={() => setSelectedType('ALL')} className="hover:opacity-75 cursor-pointer"><X className="w-3 h-3" /></button>
              </span>
            )}
            {selectedStatus !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[11px] font-medium">
                Status: {selectedStatus}
                <button onClick={() => setSelectedStatus('ALL')} className="hover:opacity-75 cursor-pointer"><X className="w-3 h-3" /></button>
              </span>
            )}
            {searchQuery.trim() && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[11px] font-medium">
                "{searchQuery}"
                <button onClick={() => setSearchQuery('')} className="hover:opacity-75 cursor-pointer"><X className="w-3 h-3" /></button>
              </span>
            )}
            <button
              onClick={() => {
                setSelectedType('ALL');
                setSelectedStatus('ALL');
                setSearchQuery('');
              }}
              className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer ml-auto"
            >
              {'Reset All'}
            </button>
          </div>
        )}
      </div>

      {/* Main Email Logs Table */}
      <div className="bg-white dark:bg-[#0f1d18] rounded-2xl border border-slate-200/80 dark:border-[#1e3a2f] shadow-xs overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto mb-3">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
              {emailLogs.length === 0 
                ? ('No Transactional Email Logs Recorded Yet')
                : ('No Emails Match Your Search Criteria')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
              {emailLogs.length === 0 
                ? ('Transactional emails dispatched for user OTPs, onboarding passwords, or leave updates will appear here automatically.')
                : ('Try adjusting your filter selection or clear the search query.')}
            </p>
            {emailLogs.length > 0 && (
              <button
                onClick={() => {
                  setSelectedType('ALL');
                  setSelectedStatus('ALL');
                  setSearchQuery('');
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 cursor-pointer transition-all"
              >
                {'Clear Filters'}
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">{'Sent Timestamp'}</th>
                  <th className="py-3 px-4">{'Recipient'}</th>
                  <th className="py-3 px-4">{'Type'}</th>
                  <th className="py-3 px-4">{'OTP Code'}</th>
                  <th className="py-3 px-4">{'Subject & Purpose'}</th>
                  <th className="py-3 px-4">{'Delivery Gateway'}</th>
                  <th className="py-3 px-4 text-right">{'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredLogs.map((log) => {
                  const isOtpVisible = visibleOtps[log.id];
                  const isSmtp = log.status === 'Sent (SMTP)';
                  const isSimulated = log.status === 'Simulated';
                  const isFailed = log.status === 'Failed';

                  return (
                    <tr 
                      key={log.id} 
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Date & Time */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {new Date(log.sentAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {new Date(log.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                      </td>

                      {/* Recipient */}
                      <td className="py-3 px-4 max-w-[200px]">
                        <div className="font-bold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{log.recipientName || 'Employee User'}</span>
                        </div>
                        <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono truncate">
                          {log.recipientEmail}
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                          log.type === 'OTP' 
                            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60'
                            : log.type === 'Welcome Message'
                            ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60'
                            : log.type === 'Leave Update'
                            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}>
                          {log.type === 'OTP' && <KeyRound className="w-3 h-3" />}
                          {log.type === 'Welcome Message' && <Sparkles className="w-3 h-3" />}
                          {log.type === 'Leave Update' && <Clock className="w-3 h-3" />}
                          {log.type === 'SMTP Test' && <Server className="w-3 h-3" />}
                          <span>{log.type}</span>
                        </span>
                      </td>

                      {/* OTP Code with MaskUnmask & Copy */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {log.otpCode ? (
                          <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 font-mono text-xs">
                            <span className="font-black text-emerald-700 dark:text-emerald-400 tracking-wider">
                              {isOtpVisible ? log.otpCode : '••••••'}
                            </span>
                            <button
                              onClick={() => toggleOtpVisibility(log.id)}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer rounded"
                              title={isOtpVisible ? 'Hide OTP' : 'Show OTP'}
                            >
                              {isOtpVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>
                            <button
                              onClick={() => copyToClipboard(log.otpCode!, `otp-${log.id}`)}
                              className="text-slate-400 hover:text-emerald-600 p-0.5 cursor-pointer rounded ml-0.5"
                              title="Copy OTP Code"
                            >
                              {copiedId === `otp-${log.id}` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600 text-[11px] italic">—</span>
                        )}
                      </td>

                      {/* Subject & Purpose */}
                      <td className="py-3 px-4 max-w-[260px]">
                        <div className="font-medium text-slate-800 dark:text-slate-200 truncate" title={log.subject}>
                          {log.subject}
                        </div>
                        {log.purpose && (
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {log.purpose}
                          </div>
                        )}
                      </td>

                      {/* Status Gateway */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {isSmtp && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              <span>{'Sent (SMTP)'}</span>
                            </span>
                          )}
                          {isSimulated && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                              <Server className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                              <span>{'Simulated'}</span>
                            </span>
                          )}
                          {isFailed && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800" title={log.errorMessage}>
                              <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                              <span>{'Failed Error'}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedLogForModal(log)}
                            className="px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-all cursor-pointer"
                          >
                            {'View Log'}
                          </button>

                          <button
                            onClick={() => handleTriggerResend(log)}
                            disabled={isResending === log.id}
                            className="p-1.5 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-lg transition-all cursor-pointer disabled:opacity-50"
                            title={'Resend EmailRe-trigger OTP'}
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isResending === log.id ? 'animate-spin' : ''}`} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Email Log Details Modal */}
      {selectedLogForModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#0f1d18] rounded-2xl border border-slate-200 dark:border-[#1e3a2f] shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {'Transactional Email Log Details'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">ID: {selectedLogForModal.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLogForModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">{'Recipient'}</span>
                  <div className="font-bold text-slate-900 dark:text-white">{selectedLogForModal.recipientName || 'User'}</div>
                  <div className="text-emerald-700 dark:text-emerald-400 font-mono text-[11px]">{selectedLogForModal.recipientEmail}</div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">{'Sent Timestamp'}</span>
                  <div className="font-medium text-slate-800 dark:text-slate-200">
                    {new Date(selectedLogForModal.sentAt).toLocaleString()}
                  </div>
                  <div className="text-slate-400 text-[10px]">Method: {selectedLogForModal.method || 'SMTP'}</div>
                </div>
              </div>

              {selectedLogForModal.otpCode && (
                <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                      {'Verified Security One-Time Password (OTP)'}
                    </span>
                    <span className="text-xl font-black font-mono text-emerald-700 dark:text-emerald-400 tracking-widest block mt-0.5">
                      {selectedLogForModal.otpCode}
                    </span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(selectedLogForModal.otpCode!, 'modal-otp')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all cursor-pointer shadow-xs"
                  >
                    {copiedId === 'modal-otp' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === 'modal-otp' ? ('Copied!') : ('Copy OTP')}</span>
                  </button>
                </div>
              )}

              <div className="space-y-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">{'Subject Title'}</span>
                  <div className="p-2.5 bg-slate-100 dark:bg-slate-900 rounded-xl font-medium text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800">
                    {selectedLogForModal.subject}
                  </div>
                </div>

                {selectedLogForModal.bodyPreview && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">{'Message PayloadPreview'}</span>
                    <div className="p-3 bg-slate-900 text-emerald-400 rounded-xl font-mono text-[11px] leading-relaxed border border-slate-800 whitespace-pre-wrap">
                      {selectedLogForModal.bodyPreview}
                    </div>
                  </div>
                )}

                {selectedLogForModal.errorMessage && (
                  <div>
                    <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block mb-1">{'SMTP Gateway Error Diagnostics'}</span>
                    <div className="p-3 bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 rounded-xl text-[11px] border border-rose-200 dark:border-rose-900 font-mono">
                      {selectedLogForModal.errorMessage}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={() => handleTriggerResend(selectedLogForModal)}
                disabled={isResending === selectedLogForModal.id}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-[#03623c] hover:bg-[#024d2e] text-white rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isResending === selectedLogForModal.id ? 'animate-spin' : ''}`} />
                <span>{'Resend to Recipient'}</span>
              </button>

              <button
                onClick={() => setSelectedLogForModal(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
              >
                {'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual TestCustom Email Modal */}
      {showDispatchModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#0f1d18] rounded-2xl border border-slate-200 dark:border-[#1e3a2f] shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="p-4 bg-[#03623c] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                <h3 className="text-sm font-bold">
                  {'Dispatch TestCustom Transactional Email'}
                </h3>
              </div>
              <button onClick={() => setShowDispatchModal(false)} className="text-white/80 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendCustomSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {'Recipient Email Address *'}
                </label>
                <input
                  type="email"
                  required
                  value={dispatchRecipient}
                  onChange={(e) => setDispatchRecipient(e.target.value)}
                  placeholder="e.g. employee@rathibuildmart.com"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500/30" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {'Recipient Name'}
                  </label>
                  <input
                    type="text"
                    value={dispatchName}
                    onChange={(e) => setDispatchName(e.target.value)}
                    placeholder="e.g. Rajesh Kumar"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500/30" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {'Message Type'}
                  </label>
                  <select
                    value={dispatchType}
                    onChange={(e) => setDispatchType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500/30 cursor-pointer"
                  >
                    <option value="OTP">OTP Verification Code</option>
                    <option value="Welcome Message">Welcome & Credentials</option>
                    <option value="Custom Notice">Custom Notice</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {'Subject Header (Optional)'}
                </label>
                <input
                  type="text"
                  value={dispatchSubject}
                  onChange={(e) => setDispatchSubject(e.target.value)}
                  placeholder="e.g. Test Transactional Gateway Verification"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500/30" />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDispatchModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl cursor-pointer"
                >
                  {'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSendingCustom || !dispatchRecipient.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-[#03623c] hover:bg-[#024d2e] text-white rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  <Send className={`w-3.5 h-3.5 ${isSendingCustom ? 'animate-bounce' : ''}`} />
                  <span>{isSendingCustom ? ('Sending...') : ('Dispatch Email')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
