import React, { useState } from 'react';
import { 
  Megaphone, 
  KeyRound, 
  LifeBuoy, 
  Trash2, 
  CheckCircle2, 
  Plus, 
  AlertCircle,
  Search,
  Filter,
  Calendar,
  Clock,
  Pin,
  Paperclip,
  Edit2,
  Eye,
  Archive,
  Tag,
  Building2,
  X,
  ExternalLink,
  Sparkles,
  Check
} from 'lucide-react';
import RichTextEditor from './RichTextEditor';
import RichTextRenderer from './RichTextRenderer';

interface NoticesSupportProps {
  language: 'en' | 'hi';
  announcements: any[];
  setAnnouncements: React.Dispatch<React.SetStateAction<any[]>>;
  hrTickets: any[];
  setHrTickets: React.Dispatch<React.SetStateAction<any[]>>;
  passwordRequests: any[];
  setPasswordRequests: React.Dispatch<React.SetStateAction<any[]>>;
  portalUser: any;
  activeSubTab?: 'announcements' | 'passwords' | 'tickets';
  setActiveSubTab?: (tab: 'announcements' | 'passwords' | 'tickets') => void;
}

export default function NoticesSupport({
  language,
  announcements = [],
  setAnnouncements,
  hrTickets = [],
  setHrTickets,
  passwordRequests = [],
  setPasswordRequests,
  portalUser,
  activeSubTab: controlledSubTab,
  setActiveSubTab: setControlledSubTab
}: NoticesSupportProps) {
  const todayStr = new Date().toISOString().split('T')[0];

  // Sub-tabs: 'announcements' | 'passwords' | 'tickets'
  const [localSubTab, setLocalSubTab] = useState<'announcements' | 'passwords' | 'tickets'>('announcements');
  const activeSubTab = controlledSubTab !== undefined ? controlledSubTab : localSubTab;
  const setActiveSubTab = setControlledSubTab !== undefined ? setControlledSubTab : setLocalSubTab;

  // New Notice form states
  const [newNoticeTitle, setNewNoticeTitle] = useState('');
  const [newNoticeTitleHi, setNewNoticeTitleHi] = useState('');
  const [newNoticeContent, setNewNoticeContent] = useState('');
  const [newNoticeContentHi, setNewNoticeContentHi] = useState('');
  const [newNoticeBadge, setNewNoticeBadge] = useState<'Critical' | 'Holiday' | 'General' | 'Policy' | 'Urgent'>('General');
  const [newNoticeScheduledDate, setNewNoticeScheduledDate] = useState(todayStr);
  const [newNoticeExpiryDate, setNewNoticeExpiryDate] = useState('');
  const [newNoticeIsPinned, setNewNoticeIsPinned] = useState(false);
  const [newNoticeTargetDept, setNewNoticeTargetDept] = useState('All');
  const [newNoticeAttachmentUrl, setNewNoticeAttachmentUrl] = useState('');

  // Editing Notice State
  const [editingNotice, setEditingNotice] = useState<any | null>(null);

  // Search/Filter states
  const [noticeSearch, setNoticeSearch] = useState('');
  const [noticeStatusFilter, setNoticeStatusFilter] = useState<'all' | 'Active' | 'Scheduled' | 'Expired'>('all');
  const [noticeBadgeFilter, setNoticeBadgeFilter] = useState<string>('all');

  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketStatusFilter, setTicketStatusFilter] = useState<'all' | 'Pending' | 'Resolved'>('all');
  const [passwordSearch, setPasswordSearch] = useState('');
  const [passwordStatusFilter, setPasswordStatusFilter] = useState<'all' | 'Pending' | 'Resolved'>('all');

  // Helper to determine status
  const getNoticeStatus = (ann: any): 'Active' | 'Scheduled' | 'Expired' => {
    if (ann.expiryDate && ann.expiryDate < todayStr) return 'Expired';
    if (ann.scheduledDate && ann.scheduledDate > todayStr) return 'Scheduled';
    return 'Active';
  };

  const handleAddNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoticeTitle.trim() || !newNoticeContent.trim()) return;

    const newAnn = {
      id: `ann-${Date.now()}`,
      title: newNoticeTitle.trim(),
      titleHi: newNoticeTitleHi.trim() || newNoticeTitle.trim(),
      date: newNoticeScheduledDate || todayStr,
      scheduledDate: newNoticeScheduledDate || todayStr,
      expiryDate: newNoticeExpiryDate.trim() || undefined,
      content: newNoticeContent.trim(),
      contentHi: newNoticeContentHi.trim() || newNoticeContent.trim(),
      badge: newNoticeBadge,
      badgeHi: newNoticeBadge === 'Critical' ? 'महत्वपूर्ण' : newNoticeBadge === 'Holiday' ? 'छुट्टी' : newNoticeBadge === 'Policy' ? 'नीति' : newNoticeBadge === 'Urgent' ? 'अति आवश्यक' : 'सामान्य',
      isPinned: newNoticeIsPinned,
      targetDepartment: newNoticeTargetDept,
      attachmentUrl: newNoticeAttachmentUrl.trim() || undefined,
      publishedBy: portalUser?.name || 'System Administrator'
    };

    setAnnouncements(prev => [newAnn, ...prev]);

    // Reset fields
    setNewNoticeTitle('');
    setNewNoticeTitleHi('');
    setNewNoticeContent('');
    setNewNoticeContentHi('');
    setNewNoticeBadge('General');
    setNewNoticeScheduledDate(todayStr);
    setNewNoticeExpiryDate('');
    setNewNoticeIsPinned(false);
    setNewNoticeTargetDept('All');
    setNewNoticeAttachmentUrl('');
  };

  const handleUpdateNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNotice || !editingNotice.title.trim() || !editingNotice.content.trim()) return;

    setAnnouncements(prev => prev.map(ann => {
      if (ann.id !== editingNotice.id) return ann;
      return {
        ...ann,
        title: editingNotice.title.trim(),
        titleHi: editingNotice.titleHi.trim() || editingNotice.title.trim(),
        content: editingNotice.content.trim(),
        contentHi: editingNotice.contentHi.trim() || editingNotice.content.trim(),
        badge: editingNotice.badge,
        badgeHi: editingNotice.badge === 'Critical' ? 'महत्वपूर्ण' : editingNotice.badge === 'Holiday' ? 'छुट्टी' : editingNotice.badge === 'Policy' ? 'नीति' : editingNotice.badge === 'Urgent' ? 'अति आवश्यक' : 'सामान्य',
        scheduledDate: editingNotice.scheduledDate || todayStr,
        date: editingNotice.scheduledDate || todayStr,
        expiryDate: editingNotice.expiryDate || undefined,
        isPinned: !!editingNotice.isPinned,
        targetDepartment: editingNotice.targetDepartment || 'All',
        attachmentUrl: editingNotice.attachmentUrl || undefined
      };
    }));

    setEditingNotice(null);
  };

  // Filtered lists
  const filteredNotices = announcements.filter(ann => {
    const searchLower = noticeSearch.toLowerCase();
    const matchesSearch = 
      ann.title.toLowerCase().includes(searchLower) ||
      (ann.titleHi && ann.titleHi.toLowerCase().includes(searchLower)) ||
      ann.content.toLowerCase().includes(searchLower) ||
      (ann.contentHi && ann.contentHi.toLowerCase().includes(searchLower));

    const status = getNoticeStatus(ann);
    const matchesStatus = noticeStatusFilter === 'all' || status === noticeStatusFilter;
    const matchesBadge = noticeBadgeFilter === 'all' || ann.badge === noticeBadgeFilter;

    return matchesSearch && matchesStatus && matchesBadge;
  }).sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));

  // Notice Stats Counters
  const totalNoticesCount = announcements.length;
  const activeNoticesCount = announcements.filter(a => getNoticeStatus(a) === 'Active').length;
  const scheduledNoticesCount = announcements.filter(a => getNoticeStatus(a) === 'Scheduled').length;
  const expiredNoticesCount = announcements.filter(a => getNoticeStatus(a) === 'Expired').length;

  const filteredTickets = hrTickets.filter(tk => {
    const searchLower = ticketSearch.toLowerCase();
    const matchesSearch = 
      tk.id.toLowerCase().includes(searchLower) ||
      tk.name.toLowerCase().includes(searchLower) ||
      tk.empId.toLowerCase().includes(searchLower) ||
      tk.message.toLowerCase().includes(searchLower);
    
    const matchesStatus = ticketStatusFilter === 'all' || tk.status === ticketStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredPasswordRequests = passwordRequests.filter(req => {
    const searchLower = passwordSearch.toLowerCase();
    const matchesSearch = 
      req.empId.toLowerCase().includes(searchLower) ||
      req.email.toLowerCase().includes(searchLower) ||
      (req.mobile && req.mobile.includes(searchLower));

    const matchesStatus = passwordStatusFilter === 'all' || req.status === passwordStatusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 bg-slate-50/40 p-1 rounded-2xl">
      {/* Top Banner & Header */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="p-1.5 bg-[#03623c]/8 text-[#03623c] rounded-lg">
                <Megaphone className="w-5 h-5" />
              </span>
              {language === 'en' ? 'Notices & HR Support Helpdesk' : 'घोषणाएँ और एचआर सहायता हेल्पडेस्क'}
            </h1>
            <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
              {language === 'en' 
                ? 'Central administrative control center to publish circulars, schedule future announcements, set expiry dates, clear password reset requests, and resolve employee tickets.'
                : 'कंपनी परिपत्र प्रकाशित करने, भविष्य के नोटिस शेड्यूल करने, समाप्ति तिथि सेट करने, पासवर्ड अनुरोधों और कर्मचारी सहायता टिकटों को हल करने का केंद्रीय प्रशासनिक केंद्र।'}
            </p>
          </div>
        </div>
      </div>

      {/* Submenus (Tabs Navigation) */}
      <div className="flex flex-row flex-nowrap border-b border-slate-200 overflow-x-auto whitespace-nowrap scrollbar-none gap-2 font-sans">
        <button
          onClick={() => setActiveSubTab('announcements')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-black rounded-t-xl border-t border-x transition-all cursor-pointer shrink-0 ${
            activeSubTab === 'announcements'
              ? 'bg-white border-slate-200 text-[#03623c] -mb-[1px] shadow-3xs'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-white/80'
          }`}
          id="tab-sub-announcements"
        >
          <Megaphone className="w-3.5 h-3.5" />
          <span>{language === 'en' ? 'Manage Announcements' : 'घोषणाओं का प्रबंधन'}</span>
          <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-[#03623c]/10 text-[#03623c] font-mono ml-1">
            {announcements.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('passwords')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-black rounded-t-xl border-t border-x transition-all cursor-pointer relative shrink-0 ${
            activeSubTab === 'passwords'
              ? 'bg-white border-slate-200 text-[#03623c] -mb-[1px] shadow-3xs'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-white/80'
          }`}
          id="tab-sub-passwords"
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>{language === 'en' ? 'Forgot Password Gateways' : 'पासवर्ड रीसेट गेटवे'}</span>
          {passwordRequests.filter(r => r.status === 'Pending').length > 0 && (
            <span className="px-2 py-0.5 text-[9px] font-black rounded-full bg-amber-500 text-slate-950 font-mono ml-1 animate-pulse">
              {passwordRequests.filter(r => r.status === 'Pending').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('tickets')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-black rounded-t-xl border-t border-x transition-all cursor-pointer relative shrink-0 ${
            activeSubTab === 'tickets'
              ? 'bg-white border-slate-200 text-[#03623c] -mb-[1px] shadow-3xs'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-white/80'
          }`}
          id="tab-sub-tickets"
        >
          <LifeBuoy className="w-3.5 h-3.5" />
          <span>{language === 'en' ? 'HR Helpdesk Support Tickets' : 'सहायता हेल्पडेस्क टिकट'}</span>
          {hrTickets.filter(tk => tk.status === 'Pending').length > 0 && (
            <span className="px-2 py-0.5 text-[9px] font-black rounded-full bg-emerald-600 text-white font-mono ml-1 animate-pulse">
              {hrTickets.filter(tk => tk.status === 'Pending').length}
            </span>
          )}
        </button>
      </div>

      {/* Primary Tab Viewport Area */}
      <div className="space-y-4">
        {/* SUBTAB 1: MANAGE ANNOUNCEMENTS */}
        {activeSubTab === 'announcements' && (
          <div className="space-y-5 font-sans">
            {/* Notice Stats KPI Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
              <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-3xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {language === 'en' ? 'Total Circulars' : 'कुल परिपत्र'}
                  </span>
                  <span className="text-xl font-black text-slate-900 font-mono">{totalNoticesCount}</span>
                </div>
                <div className="p-2.5 bg-slate-100 text-slate-600 rounded-xl">
                  <Megaphone className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white border border-emerald-100/60 rounded-2xl p-4 shadow-3xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
                    {language === 'en' ? 'Active / Live' : 'सक्रिय नोटिस'}
                  </span>
                  <span className="text-xl font-black text-emerald-700 font-mono">{activeNoticesCount}</span>
                </div>
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Sparkles className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white border border-amber-100/60 rounded-2xl p-4 shadow-3xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">
                    {language === 'en' ? 'Scheduled Later' : 'शेड्यूल नोटिस'}
                  </span>
                  <span className="text-xl font-black text-amber-700 font-mono">{scheduledNoticesCount}</span>
                </div>
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white border border-rose-100/60 rounded-2xl p-4 shadow-3xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block">
                    {language === 'en' ? 'Expired' : 'समाप्त नोटिस'}
                  </span>
                  <span className="text-xl font-black text-rose-600 font-mono">{expiredNoticesCount}</span>
                </div>
                <div className="p-2.5 bg-rose-50 text-rose-500 rounded-xl">
                  <Archive className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start font-sans">
              {/* Left: Create / Schedule Notice Form */}
              <div className="lg:col-span-5 bg-white border border-gray-100 rounded-2xl p-5 space-y-4 shadow-3xs">
                <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-[#03623c]" />
                    {language === 'en' ? 'Publish or Schedule Notice' : 'नोटिस प्रकाशित या शेड्यूल करें'}
                  </h3>
                  <span className="text-[9px] font-mono font-extrabold text-[#03623c] bg-[#03623c]/10 px-2 py-0.5 rounded-full">
                    {language === 'en' ? 'Smart Scheduler' : 'स्मार्ट शेड्यूल'}
                  </span>
                </div>

                <form onSubmit={handleAddNotice} className="space-y-4">
                  <div className="grid grid-cols-1 gap-3.5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        {language === 'en' ? 'Title (English)' : 'शीर्षक (अंग्रेजी)'} <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={newNoticeTitle}
                        onChange={(e) => setNewNoticeTitle(e.target.value)}
                        placeholder="e.g. Independence Day Office Closed"
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#03623c]/10 focus:border-[#03623c] bg-white text-slate-800 transition-all shadow-3xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        {language === 'en' ? 'Title (Hindi)' : 'शीर्षक (हिंदी)'}
                      </label>
                      <input
                        type="text"
                        value={newNoticeTitleHi}
                        onChange={(e) => setNewNoticeTitleHi(e.target.value)}
                        placeholder="उदा., स्वतंत्रता दिवस पर कार्यालय अवकाश"
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#03623c]/10 focus:border-[#03623c] bg-white text-slate-800 transition-all shadow-3xs"
                      />
                    </div>
                  </div>

                  <RichTextEditor
                    label={language === 'en' ? 'Content (English)' : 'विवरण (अंग्रेजी)'}
                    value={newNoticeContent}
                    onChange={setNewNoticeContent}
                    placeholder="Write detailed notification circular description in English... Add bold, lists, or links using the rich toolbar above."
                    language={language}
                    minHeight="100px"
                  />

                  <RichTextEditor
                    label={language === 'en' ? 'Content (Hindi)' : 'विवरण (हिंदी)'}
                    value={newNoticeContentHi}
                    onChange={setNewNoticeContentHi}
                    placeholder="परिपत्र का विस्तृत विवरण हिंदी में लिखें... आवश्यकतानुसार बोल्ड, लिस्ट एवं लिंक जोड़ें।"
                    language={language}
                    minHeight="90px"
                  />

                  {/* Date & Scheduling options */}
                  <div className="p-3.5 bg-slate-50/70 border border-slate-100 rounded-xl space-y-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-700 uppercase tracking-wider">
                      <Calendar className="w-3.5 h-3.5 text-[#03623c]" />
                      <span>{language === 'en' ? 'Publish Schedule & Auto Expiry' : 'प्रकाशन शेड्यूल एवं ऑटो-समाप्ति'}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                          {language === 'en' ? 'Schedule Date (Go Live)' : 'शेड्यूल तिथि (लाइव तिथि)'}
                        </label>
                        <input
                          type="date"
                          value={newNoticeScheduledDate}
                          onChange={(e) => setNewNoticeScheduledDate(e.target.value)}
                          className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#03623c] shadow-3xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                          {language === 'en' ? 'Expiry Date (Optional)' : 'समाप्ति तिथि (ऐच्छिक)'}
                        </label>
                        <input
                          type="date"
                          value={newNoticeExpiryDate}
                          onChange={(e) => setNewNoticeExpiryDate(e.target.value)}
                          className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#03623c] shadow-3xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Target Dept & Category & Attachment */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        {language === 'en' ? 'Target Audience:' : 'लक्षित विभाग:'}
                      </label>
                      <select
                        value={newNoticeTargetDept}
                        onChange={(e) => setNewNoticeTargetDept(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold bg-white text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#03623c] shadow-3xs"
                      >
                        <option value="All">All Departments (सभी विभाग)</option>
                        <option value="Management">Management (प्रबंधन)</option>
                        <option value="Sales">Sales (बिक्री)</option>
                        <option value="Engineering">Engineering (इंजीनियरिंग)</option>
                        <option value="Human Resources">Human Resources (एचआर)</option>
                        <option value="Operations">Operations (ऑपरेशंस)</option>
                        <option value="Finance">Finance (वित्त)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        {language === 'en' ? 'Category Badge:' : 'श्रेणी टैग:'}
                      </label>
                      <select
                        value={newNoticeBadge}
                        onChange={(e: any) => setNewNoticeBadge(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold bg-white text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#03623c] shadow-3xs"
                      >
                        <option value="General">General (सामान्य)</option>
                        <option value="Critical">Critical (महत्वपूर्ण)</option>
                        <option value="Urgent">Urgent (अति आवश्यक)</option>
                        <option value="Holiday">Holiday (अवकाश)</option>
                        <option value="Policy">Policy (नीति)</option>
                      </select>
                    </div>
                  </div>

                  {/* Circular PDF/Doc Attachment Link */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Paperclip className="w-3 h-3 text-slate-400" />
                      {language === 'en' ? 'Attachment / Circular Link (Optional)' : 'संलग्नक / परिपत्र लिंक (ऐच्छिक)'}
                    </label>
                    <input
                      type="url"
                      value={newNoticeAttachmentUrl}
                      onChange={(e) => setNewNoticeAttachmentUrl(e.target.value)}
                      placeholder="e.g. https://drive.google.com/file/d/..."
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#03623c] bg-white text-slate-800 transition-all shadow-3xs"
                    />
                  </div>

                  {/* Pin to top Checkbox */}
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={newNoticeIsPinned}
                        onChange={(e) => setNewNoticeIsPinned(e.target.checked)}
                        className="w-4 h-4 text-[#03623c] rounded border-slate-300 focus:ring-[#03623c]"
                      />
                      <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1">
                        <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        {language === 'en' ? 'Pin to top of Notice Board' : 'सूचना पट्ट के शीर्ष पर पिन करें'}
                      </span>
                    </label>

                    <button
                      type="submit"
                      className="bg-[#03623c] hover:bg-[#02492d] text-white font-black text-xs px-5 py-2.5 rounded-xl transition-colors uppercase tracking-wider cursor-pointer shadow-sm flex items-center gap-1.5"
                    >
                      <Megaphone className="w-3.5 h-3.5" />
                      {newNoticeScheduledDate > todayStr 
                        ? (language === 'en' ? 'Schedule Notice' : 'नोटिस शेड्यूल करें')
                        : (language === 'en' ? 'Publish Notice' : 'सूचना प्रकाशित करें')}
                    </button>
                  </div>
                </form>
              </div>

              {/* Right: Notices List with Search, Filter & Actions */}
              <div className="lg:col-span-7 bg-white border border-gray-100 rounded-2xl p-5 space-y-4 shadow-3xs">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-gray-50 pb-3">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <span>📢</span>
                    <span>{language === 'en' ? 'Announcements & Circulars' : 'घोषणाएं एवं परिपत्र सूची'}</span>
                  </h3>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={noticeSearch}
                        onChange={(e) => setNoticeSearch(e.target.value)}
                        placeholder={language === 'en' ? 'Search notices...' : 'नोटिस खोजें...'}
                        className="border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#03623c] max-w-[150px] sm:max-w-[180px] shadow-3xs"
                      />
                    </div>

                    <select
                      value={noticeStatusFilter}
                      onChange={(e: any) => setNoticeStatusFilter(e.target.value)}
                      className="border border-slate-200 rounded-xl px-2.5 py-1.5 text-[11px] font-bold bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#03623c] shadow-3xs"
                    >
                      <option value="all">{language === 'en' ? 'All Status' : 'सभी स्थितियां'}</option>
                      <option value="Active">{language === 'en' ? 'Active Live' : 'सक्रिय'}</option>
                      <option value="Scheduled">{language === 'en' ? 'Scheduled' : 'शेड्यूल'}</option>
                      <option value="Expired">{language === 'en' ? 'Expired' : 'समाप्त'}</option>
                    </select>

                    <select
                      value={noticeBadgeFilter}
                      onChange={(e: any) => setNoticeBadgeFilter(e.target.value)}
                      className="border border-slate-200 rounded-xl px-2.5 py-1.5 text-[11px] font-bold bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#03623c] shadow-3xs"
                    >
                      <option value="all">{language === 'en' ? 'All Badges' : 'सभी श्रेणियां'}</option>
                      <option value="General">General</option>
                      <option value="Critical">Critical</option>
                      <option value="Urgent">Urgent</option>
                      <option value="Holiday">Holiday</option>
                      <option value="Policy">Policy</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                  {filteredNotices.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic text-center py-12 bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl font-medium">
                      {language === 'en' ? 'No notices match your filter criteria.' : 'आपकी फ़िल्टर शर्तों से मेल खाता कोई नोटिस नहीं है।'}
                    </p>
                  ) : (
                    filteredNotices.map((ann) => {
                      const status = getNoticeStatus(ann);

                      let badgeCol = 'bg-slate-50 text-slate-600 border-slate-200';
                      if (ann.badge === 'Critical') badgeCol = 'bg-red-50 text-red-600 border-red-150';
                      if (ann.badge === 'Urgent') badgeCol = 'bg-rose-50 text-rose-700 border-rose-200';
                      if (ann.badge === 'Holiday') badgeCol = 'bg-amber-50 text-amber-700 border-amber-150';
                      if (ann.badge === 'Policy') badgeCol = 'bg-emerald-50 text-emerald-800 border-emerald-150';

                      let statusBadge = (
                        <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded border bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1 font-mono">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          {language === 'en' ? 'Active' : 'सक्रिय'}
                        </span>
                      );

                      if (status === 'Scheduled') {
                        statusBadge = (
                          <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded border bg-amber-50 text-amber-800 border-amber-200 flex items-center gap-1 font-mono">
                            <Clock className="w-2.5 h-2.5 text-amber-600" />
                            {language === 'en' ? `Scheduled: ${ann.scheduledDate}` : `शेड्यूल: ${ann.scheduledDate}`}
                          </span>
                        );
                      } else if (status === 'Expired') {
                        statusBadge = (
                          <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded border bg-rose-50 text-rose-700 border-rose-200 flex items-center gap-1 font-mono">
                            <Archive className="w-2.5 h-2.5 text-rose-600" />
                            {language === 'en' ? `Expired: ${ann.expiryDate}` : `समाप्त: ${ann.expiryDate}`}
                          </span>
                        );
                      }

                      return (
                        <div 
                          key={ann.id} 
                          className={`bg-white border p-4 rounded-xl shadow-3xs flex justify-between items-start gap-4 transition-all ${
                            ann.isPinned ? 'border-amber-300 bg-amber-50/10' : 'border-slate-100 hover:border-[#03623c]/20'
                          }`}
                        >
                          <div className="space-y-2 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              {ann.isPinned && (
                                <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-250 flex items-center gap-1 font-mono">
                                  <Pin className="w-2.5 h-2.5 fill-amber-600 text-amber-600" />
                                  PINNED
                                </span>
                              )}

                              <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${badgeCol} font-mono`}>
                                {language === 'en' ? ann.badge : ann.badgeHi}
                              </span>

                              {statusBadge}

                              {ann.targetDepartment && ann.targetDepartment !== 'All' && (
                                <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono flex items-center gap-1">
                                  <Building2 className="w-2.5 h-2.5 text-slate-500" />
                                  {ann.targetDepartment}
                                </span>
                              )}
                            </div>

                            <h5 className="text-xs font-extrabold text-slate-900 font-sans leading-snug">
                              {language === 'en' ? ann.title : ann.titleHi}
                            </h5>

                            <RichTextRenderer
                              content={language === 'en' ? ann.content : ann.contentHi}
                              language={language}
                            />

                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-50">
                              <div className="flex items-center gap-3 text-[9px] text-slate-400 font-mono">
                                <span>📅 {ann.scheduledDate || ann.date}</span>
                                {ann.expiryDate && <span>⌛ Exp: {ann.expiryDate}</span>}
                                <span>• By {ann.publishedBy || 'System Admin'}</span>
                              </div>

                              {ann.attachmentUrl && (
                                <a
                                  href={ann.attachmentUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[9px] font-bold text-[#03623c] hover:underline flex items-center gap-1 bg-[#03623c]/5 px-2 py-0.5 rounded border border-[#03623c]/10"
                                >
                                  <Paperclip className="w-2.5 h-2.5" />
                                  {language === 'en' ? 'View Circular Document' : 'परिपत्र दस्तावेज देखें'}
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => setEditingNotice(ann)}
                              className="text-slate-400 hover:text-[#03623c] p-1.5 rounded-lg hover:bg-emerald-50 transition-all cursor-pointer border border-transparent hover:border-emerald-100"
                              title={language === 'en' ? 'Edit Notice' : 'सूचना संपादित करें'}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setAnnouncements(prev => prev.filter(a => a.id !== ann.id));
                              }}
                              className="text-slate-300 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50/60 transition-all cursor-pointer border border-transparent hover:border-red-100"
                              title={language === 'en' ? 'Remove Notice' : 'सूचना हटाएँ'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 2: FORGOT PASSWORD GATEWAYS */}
        {activeSubTab === 'passwords' && (
          <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4 shadow-3xs font-sans">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-gray-50 pb-3">
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-500" />
                  {language === 'en' ? 'Forgot Password Reset Requests Queue' : 'पासवर्ड रीसेट अनुरोध कतार'}
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">
                  {language === 'en' ? 'Manage requests submitted by employees to reset their payroll portal passwords.' : 'पेरोल पोर्टल पासवर्ड रीसेट करने के लिए कर्मचारियों द्वारा प्रस्तुत अनुरोधों को प्रबंधित करें।'}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={passwordSearch}
                  onChange={(e) => setPasswordSearch(e.target.value)}
                  placeholder={language === 'en' ? 'Search employee ID/email...' : 'कर्मचारी आईडी/ईमेल खोजें...'}
                  className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#03623c] shadow-3xs"
                />
                <select
                  value={passwordStatusFilter}
                  onChange={(e: any) => setPasswordStatusFilter(e.target.value)}
                  className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#03623c] shadow-3xs"
                >
                  <option value="all">{language === 'en' ? 'All Status' : 'सभी स्थिति'}</option>
                  <option value="Pending">{language === 'en' ? 'Pending' : 'लंबित'}</option>
                  <option value="Resolved">{language === 'en' ? 'Resolved' : 'हल हो गया'}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPasswordRequests.length === 0 ? (
                <div className="col-span-full py-12 text-center text-slate-400 italic bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl font-medium">
                  {language === 'en' ? 'No password reset requests logged.' : 'कोई पासवर्ड रीसेट अनुरोध दर्ज नहीं है।'}
                </div>
              ) : (
                filteredPasswordRequests.map((req) => (
                  <div key={req.id} className="bg-white border border-slate-100 p-4.5 rounded-xl shadow-3xs flex flex-col justify-between space-y-3 hover:border-amber-400/40 transition-all">
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-black font-mono text-[#03623c] bg-[#03623c]/10 border border-[#03623c]/20 px-2 py-0.5 rounded">
                          {req.empId}
                        </span>
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
                          req.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-150' : 'bg-emerald-50 text-emerald-800 border-emerald-150'
                        }`}>
                          {req.status}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs font-semibold">
                        <p className="text-slate-400">
                          {language === 'en' ? 'Email Address:' : 'ईमेल पता:'} <span className="font-mono font-bold text-slate-800 block text-[11px] truncate">{req.email}</span>
                        </p>
                        <p className="text-slate-400 mt-1">
                          {language === 'en' ? 'Mobile Number:' : 'मोबाइल नंबर:'} <span className="font-mono font-bold text-slate-800 block text-[11px]">{req.mobile}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-50 text-[10px] gap-2">
                      <span className="text-[9px] font-mono text-slate-400 font-bold">
                        {new Date(req.date).toLocaleString()}
                      </span>
                      
                      {req.status === 'Pending' ? (
                        <button
                          type="button"
                          onClick={() => {
                            setPasswordRequests(prev => prev.map(p => p.id === req.id ? { ...p, status: 'Resolved' } : p));
                          }}
                          className="bg-emerald-50 hover:bg-emerald-600 border border-emerald-200 hover:border-emerald-600 text-[#03623c] hover:text-white font-extrabold text-[9px] px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer uppercase tracking-wider shadow-3xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {language === 'en' ? 'Resolve Reset' : 'हल करें'}
                        </button>
                      ) : (
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-150 px-2 py-1 rounded-lg">
                          ✓ Completed
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* SUBTAB 3: HR HELPDESK SUPPORT TICKETS */}
        {activeSubTab === 'tickets' && (
          <div className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 space-y-5 shadow-3xs font-sans">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-gray-50 pb-4">
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <LifeBuoy className="w-4 h-4 text-[#03623c] animate-spin-slow" />
                  {language === 'en' ? 'Active HR Helpdesk Support Inquiries' : 'सक्रिय कर्मचारी सहायता हेल्पडेस्क टिकट'}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 font-semibold leading-relaxed">
                  {language === 'en' ? 'Review, update, and resolve support queries submitted by on-duty workers.' : 'कर्मचारियों द्वारा प्रस्तुत सहायता प्रश्नों की समीक्षा करें, उन्हें अपडेट करें और हल करें।'}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={ticketSearch}
                    onChange={(e) => setTicketSearch(e.target.value)}
                    placeholder={language === 'en' ? 'Search ID/Employee...' : 'टिकट खोजें...'}
                    className="border border-slate-200 rounded-xl pl-8 pr-3.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#03623c] w-full sm:w-48 shadow-3xs bg-white text-slate-800"
                  />
                </div>
                <div className="relative">
                  <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    value={ticketStatusFilter}
                    onChange={(e: any) => setTicketStatusFilter(e.target.value)}
                    className="border border-slate-200 rounded-xl pl-8 pr-3.5 py-1.5 text-xs font-bold bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#03623c] shadow-3xs"
                  >
                    <option value="all">{language === 'en' ? 'All Status' : 'सभी स्थिति'}</option>
                    <option value="Pending">{language === 'en' ? 'Pending' : 'लंबित'}</option>
                    <option value="Resolved">{language === 'en' ? 'Resolved' : 'हल हो गया'}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Support Tickets Table */}
            <div className="overflow-x-auto border border-slate-100 rounded-2xl shadow-3xs bg-white">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    <th className="px-6 py-4 font-mono w-28">{language === 'en' ? 'Ticket ID' : 'टिकट आईडी'}</th>
                    <th className="px-6 py-4 w-52">{language === 'en' ? 'Employee Details' : 'कर्मचारी विवरण'}</th>
                    <th className="px-6 py-4 w-36">{language === 'en' ? 'Category' : 'श्रेणी'}</th>
                    <th className="px-6 py-4">{language === 'en' ? 'Support Inquiry Message' : 'सहायता प्रश्न संदेश'}</th>
                    <th className="px-6 py-4 w-28">{language === 'en' ? 'Status' : 'स्थिति'}</th>
                    <th className="px-6 py-4 text-right w-36">{language === 'en' ? 'Action' : 'कार्रवाई'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                  {filteredTickets.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-slate-400 italic bg-white font-semibold">
                        {language === 'en' ? 'No support tickets found.' : 'कोई सहायता टिकट नहीं मिला।'}
                      </td>
                    </tr>
                  ) : (
                    filteredTickets.map((ticket) => (
                      <tr key={ticket.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-4 font-mono">
                          <span className="text-[10px] font-bold text-slate-400 block">
                            {ticket.id}
                          </span>
                          <span className="text-[9px] text-slate-400 block mt-0.5">
                            {new Date(ticket.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' })}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-extrabold text-slate-900 leading-snug">
                            {ticket.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            ID: <span className="text-slate-600 font-bold">{ticket.empId}</span>
                          </div>
                          <div className="text-[9px] text-slate-400 truncate max-w-[180px] mt-0.5">
                            {ticket.email}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[9px] font-black text-[#03623c] bg-[#03623c]/5 px-2.5 py-1 rounded-lg border border-[#03623c]/10 uppercase tracking-wider font-sans">
                            {language === 'en' ? ticket.category : (ticket.categoryHi || ticket.category)}
                          </span>
                        </td>
                        <td className="px-6 py-4 max-w-sm">
                          <p className="text-[11px] text-slate-600 font-semibold leading-relaxed max-h-16 overflow-y-auto pr-1 whitespace-pre-line" title={ticket.message}>
                            {ticket.message}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${
                            ticket.status === 'Pending' 
                              ? 'bg-amber-50 text-amber-700 border-amber-200/60' 
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                          }`}>
                            {ticket.status === 'Pending' ? (language === 'en' ? 'Pending' : 'लंबित') : (language === 'en' ? 'Resolved' : 'हल हो गया')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          {ticket.status === 'Pending' ? (
                            <button
                              type="button"
                              onClick={() => {
                                setHrTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, status: 'Resolved' } : t));
                              }}
                              className="bg-[#03623c]/5 hover:bg-[#03623c] border border-[#03623c]/10 hover:border-[#03623c] text-[#03623c] hover:text-white font-extrabold text-[10px] px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer uppercase shadow-3xs inline-flex"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                              {language === 'en' ? 'Resolve Support' : 'समाधान करें'}
                            </button>
                          ) : (
                            <span className="text-[10px] text-emerald-700 font-black bg-emerald-50 border border-emerald-100/60 px-3 py-1.5 rounded-xl inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              {language === 'en' ? 'Resolved' : 'हल किया गया'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* EDIT ANNOUNCEMENT MODAL */}
      {editingNotice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#03623c]" />
                {language === 'en' ? 'Edit Announcement Circular' : 'घोषणा परिपत्र संपादित करें'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingNotice(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateNotice} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    {language === 'en' ? 'Title (English)' : 'शीर्षक (अंग्रेजी)'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editingNotice.title || ''}
                    onChange={(e) => setEditingNotice({ ...editingNotice, title: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#03623c]/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    {language === 'en' ? 'Title (Hindi)' : 'शीर्षक (हिंदी)'}
                  </label>
                  <input
                    type="text"
                    value={editingNotice.titleHi || ''}
                    onChange={(e) => setEditingNotice({ ...editingNotice, titleHi: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#03623c]/20"
                  />
                </div>
              </div>

              <RichTextEditor
                label={language === 'en' ? 'Content (English)' : 'विवरण (अंग्रेजी)'}
                value={editingNotice.content || ''}
                onChange={(val) => setEditingNotice({ ...editingNotice, content: val })}
                language={language}
                minHeight="100px"
              />

              <RichTextEditor
                label={language === 'en' ? 'Content (Hindi)' : 'विवरण (हिंदी)'}
                value={editingNotice.contentHi || ''}
                onChange={(val) => setEditingNotice({ ...editingNotice, contentHi: val })}
                language={language}
                minHeight="90px"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    {language === 'en' ? 'Schedule Date' : 'शेड्यूल तिथि'}
                  </label>
                  <input
                    type="date"
                    value={editingNotice.scheduledDate || editingNotice.date || todayStr}
                    onChange={(e) => setEditingNotice({ ...editingNotice, scheduledDate: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    {language === 'en' ? 'Expiry Date' : 'समाप्ति तिथि'}
                  </label>
                  <input
                    type="date"
                    value={editingNotice.expiryDate || ''}
                    onChange={(e) => setEditingNotice({ ...editingNotice, expiryDate: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    {language === 'en' ? 'Category Badge:' : 'श्रेणी टैग:'}
                  </label>
                  <select
                    value={editingNotice.badge || 'General'}
                    onChange={(e: any) => setEditingNotice({ ...editingNotice, badge: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold bg-white text-slate-700"
                  >
                    <option value="General">General</option>
                    <option value="Critical">Critical</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Holiday">Holiday</option>
                    <option value="Policy">Policy</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    {language === 'en' ? 'Target Department:' : 'लक्षित विभाग:'}
                  </label>
                  <select
                    value={editingNotice.targetDepartment || 'All'}
                    onChange={(e) => setEditingNotice({ ...editingNotice, targetDepartment: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold bg-white text-slate-700"
                  >
                    <option value="All">All Departments</option>
                    <option value="Management">Management</option>
                    <option value="Sales">Sales</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Operations">Operations</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  {language === 'en' ? 'Attachment Link:' : 'संलग्नक लिंक:'}
                </label>
                <input
                  type="url"
                  value={editingNotice.attachmentUrl || ''}
                  onChange={(e) => setEditingNotice({ ...editingNotice, attachmentUrl: e.target.value })}
                  placeholder="https://drive.google.com/..."
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={!!editingNotice.isPinned}
                    onChange={(e) => setEditingNotice({ ...editingNotice, isPinned: e.target.checked })}
                    className="w-4 h-4 text-[#03623c] rounded border-slate-300 focus:ring-[#03623c]"
                  />
                  <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1">
                    <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    {language === 'en' ? 'Pin to Top' : 'शीर्ष पर पिन करें'}
                  </span>
                </label>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingNotice(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    {language === 'en' ? 'Cancel' : 'रद्द करें'}
                  </button>

                  <button
                    type="submit"
                    className="bg-[#03623c] hover:bg-[#02492d] text-white font-black text-xs px-5 py-2 rounded-xl transition-colors uppercase tracking-wider cursor-pointer shadow-sm flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {language === 'en' ? 'Save Changes' : 'बदलाव सहेजें'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

