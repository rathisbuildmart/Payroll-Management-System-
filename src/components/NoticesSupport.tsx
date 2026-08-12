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

  //Sub-tabs: 'announcements' | 'passwords' | 'tickets'
  const [localSubTab, setLocalSubTab] = useState<'announcements' | 'passwords' | 'tickets'>('announcements');
  const activeSubTab = controlledSubTab !== undefined ? controlledSubTab : localSubTab;
  const setActiveSubTab = setControlledSubTab !== undefined ? setControlledSubTab : setLocalSubTab;

  //Role-based permissions check
  const userRole = portalUser?.role || 'employee';
  const isPasswordGatewayAllowed = ['super_admin', 'admin', 'hr', 'sub_admin', 'director'].includes(userRole);
  const isTicketsAllowed = userRole !== 'recruiter';
  const canManageNotices = ['super_admin', 'admin', 'hr', 'sub_admin', 'director'].includes(userRole);

  React.useEffect(() => {
    if (!isPasswordGatewayAllowed && activeSubTab === 'passwords') {
      setActiveSubTab('announcements');
    }
    if (!isTicketsAllowed && activeSubTab === 'tickets') {
      setActiveSubTab('announcements');
    }
  }, [isPasswordGatewayAllowed, isTicketsAllowed, activeSubTab, setActiveSubTab]);

  //New Notice form states
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

  //Editing Notice State
  const [editingNotice, setEditingNotice] = useState<any | null>(null);

  //Search/Filter states
  const [noticeSearch, setNoticeSearch] = useState('');
  const [noticeStatusFilter, setNoticeStatusFilter] = useState<'all' | 'Active' | 'Scheduled' | 'Expired'>('all');
  const [noticeBadgeFilter, setNoticeBadgeFilter] = useState<string>('all');

  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketStatusFilter, setTicketStatusFilter] = useState<'all' | 'Pending' | 'Resolved'>('all');
  const [passwordSearch, setPasswordSearch] = useState('');
  const [passwordStatusFilter, setPasswordStatusFilter] = useState<'all' | 'Pending' | 'Resolved'>('all');

  //Helper to determine status
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
      badgeHi: "",
      isPinned: newNoticeIsPinned,
      targetDepartment: newNoticeTargetDept,
      attachmentUrl: newNoticeAttachmentUrl.trim() || undefined,
      publishedBy: portalUser?.name || 'System Administrator'
    };

    setAnnouncements(prev => [newAnn, ...prev]);

    //Reset fields
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
        badgeHi: "",
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

  //Filtered lists
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

  //Notice Stats Counters
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
              {userRole === 'recruiter' 
                ? ('Company Notices & Circulars')
                : ('Notices & HR Support Helpdesk')}
            </h1>
            <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
              {userRole === 'recruiter'
                ? ('Central noticeboard to view official company circulars, policy updates, and general announcements.')
                : ('Central administrative control center to publish circulars, schedule future announcements, set expiry dates, clear password reset requests, and resolve employee tickets.')}
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
          <span>{'Announcements & Circulars'}</span>
          <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-[#03623c]/10 text-[#03623c] font-mono ml-1">
            {announcements.length}
          </span>
        </button>

        {isPasswordGatewayAllowed && (
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
            <span>{'Forgot Password Gateways'}</span>
            {passwordRequests.filter(r => r.status === 'Pending').length > 0 && (
              <span className="px-2 py-0.5 text-[9px] font-black rounded-full bg-amber-500 text-slate-950 font-mono ml-1 animate-pulse">
                {passwordRequests.filter(r => r.status === 'Pending').length}
              </span>
            )}
          </button>
        )}

        {isTicketsAllowed && (
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
            <span>{'HR Helpdesk Support Tickets'}</span>
            {hrTickets.filter(tk => tk.status === 'Pending').length > 0 && (
              <span className="px-2 py-0.5 text-[9px] font-black rounded-full bg-emerald-600 text-white font-mono ml-1 animate-pulse">
                {hrTickets.filter(tk => tk.status === 'Pending').length}
              </span>
            )}
          </button>
        )}
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
                    {'Total Circulars'}
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
                    {'ActiveLive'}
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
                    {'Scheduled Later'}
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
                    {'Expired'}
                  </span>
                  <span className="text-xl font-black text-rose-600 font-mono">{expiredNoticesCount}</span>
                </div>
                <div className="p-2.5 bg-rose-50 text-rose-500 rounded-xl">
                  <Archive className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start font-sans">
              {/* Left: CreateSchedule Notice Form */}
              {canManageNotices && (
                <div className="lg:col-span-5 bg-white border border-gray-100 rounded-2xl p-5 space-y-4 shadow-3xs">
                <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-[#03623c]" />
                    {'Publish or Schedule Notice'}
                  </h3>
                  <span className="text-[9px] font-mono font-extrabold text-[#03623c] bg-[#03623c]/10 px-2 py-0.5 rounded-full">
                    {'Smart Scheduler'}
                  </span>
                </div>

                <form onSubmit={handleAddNotice} className="space-y-4">
                  <div className="grid grid-cols-1 gap-3.5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        {'Title (English)'} <span className="text-rose-500"></span>
                      </label>
                      <input
                        type="text"
                        required
                        value={newNoticeTitle}
                        onChange={(e) => setNewNoticeTitle(e.target.value)}
                        placeholder="e.g. Independence Day Office Closed"
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#03623c]/10 focus:border-[#03623c] bg-white text-slate-800 transition-all shadow-3xs" />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        {'Title (Hindi)'}
                      </label>
                      <input
                        type="text"
                        value={newNoticeTitleHi}
                        onChange={(e) => setNewNoticeTitleHi(e.target.value)}
                        placeholder="e.g. Office Holiday Notice"
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#03623c]/10 focus:border-[#03623c] bg-white text-slate-800 transition-all shadow-3xs" />
                    </div>
                  </div>

                  <RichTextEditor
                    label={'Content (English)'}
                    value={newNoticeContent}
                    onChange={setNewNoticeContent}
                    placeholder="Write detailed notification circular description in English... Add bold, lists, or links using the rich toolbar above."
                    language={language}
                    minHeight="100px" />

                  <RichTextEditor
                    label={'Content (Hindi)'}
                    value={newNoticeContentHi}
                    onChange={setNewNoticeContentHi}
                    placeholder="      ...  ,    "
                    language={language}
                    minHeight="90px" />

                  {/* Date & Scheduling options */}
                  <div className="p-3.5 bg-slate-50/70 border border-slate-100 rounded-xl space-y-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-700 uppercase tracking-wider">
                      <Calendar className="w-3.5 h-3.5 text-[#03623c]" />
                      <span>{'Publish Schedule & Auto Expiry'}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                          {'Schedule Date (Go Live)'}
                        </label>
                        <input
                          type="date"
                          value={newNoticeScheduledDate}
                          onChange={(e) => setNewNoticeScheduledDate(e.target.value)}
                          className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#03623c] shadow-3xs" />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                          {'Expiry Date (Optional)'}
                        </label>
                        <input
                          type="date"
                          value={newNoticeExpiryDate}
                          onChange={(e) => setNewNoticeExpiryDate(e.target.value)}
                          className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#03623c] shadow-3xs" />
                      </div>
                    </div>
                  </div>

                  {/* Target Dept & Category & Attachment */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        {'Target Audience:'}
                      </label>
                      <select
                        value={newNoticeTargetDept}
                        onChange={(e) => setNewNoticeTargetDept(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold bg-white text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#03623c] shadow-3xs"
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

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        {'Category Badge:'}
                      </label>
                      <select
                        value={newNoticeBadge}
                        onChange={(e: any) => setNewNoticeBadge(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold bg-white text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#03623c] shadow-3xs"
                      >
                        <option value="General">General</option>
                        <option value="Critical">Critical</option>
                        <option value="Urgent">Urgent</option>
                        <option value="Holiday">Holiday</option>
                        <option value="Policy">Policy</option>
                      </select>
                    </div>
                  </div>

                  {/* Circular PDF/Doc Attachment Link */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Paperclip className="w-3 h-3 text-slate-400" />
                      {'AttachmentCircular Link (Optional)'}
                    </label>
                    <input
                      type="url"
                      value={newNoticeAttachmentUrl}
                      onChange={(e) => setNewNoticeAttachmentUrl(e.target.value)}
                      placeholder="e.g. https://drive.google.com/file/d/..."
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#03623c] bg-white text-slate-800 transition-all shadow-3xs" />
                  </div>

                  {/* Pin to top Checkbox */}
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={newNoticeIsPinned}
                        onChange={(e) => setNewNoticeIsPinned(e.target.checked)}
                        className="w-4 h-4 text-[#03623c] rounded border-slate-300 focus:ring-[#03623c]" />
                      <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1">
                        <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        {'Pin to top of Notice Board'}
                      </span>
                    </label>

                    <button
                      type="submit"
                      className="bg-[#03623c] hover:bg-[#02492d] text-white font-black text-xs px-5 py-2.5 rounded-xl transition-colors uppercase tracking-wider cursor-pointer shadow-sm flex items-center gap-1.5"
                    >
                      <Megaphone className="w-3.5 h-3.5" />
                      {newNoticeScheduledDate > todayStr 
                        ? ('Schedule Notice')
                        : ('Publish Notice')}
                    </button>
                  </div>
                </form>
              </div>
              )}

              {/* Right: Notices List with Search, Filter & Actions */}
              <div className={`${canManageNotices ? 'lg:col-span-7' : 'lg:col-span-12'} bg-white border border-gray-100 rounded-2xl p-5 space-y-4 shadow-3xs`}>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-gray-50 pb-3">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <span>📢</span>
                    <span>{'Announcements & Circulars'}</span>
                  </h3>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={noticeSearch}
                        onChange={(e) => setNoticeSearch(e.target.value)}
                        placeholder={'Search notices...'}
                        className="border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#03623c] max-w-[150px] sm:max-w-[180px] shadow-3xs" />
                    </div>

                    <select
                      value={noticeStatusFilter}
                      onChange={(e: any) => setNoticeStatusFilter(e.target.value)}
                      className="border border-slate-200 rounded-xl px-2.5 py-1.5 text-[11px] font-bold bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#03623c] shadow-3xs"
                    >
                      <option value="all">{'All Status'}</option>
                      <option value="Active">{'Active Live'}</option>
                      <option value="Scheduled">{'Scheduled'}</option>
                      <option value="Expired">{'Expired'}</option>
                    </select>

                    <select
                      value={noticeBadgeFilter}
                      onChange={(e: any) => setNoticeBadgeFilter(e.target.value)}
                      className="border border-slate-200 rounded-xl px-2.5 py-1.5 text-[11px] font-bold bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#03623c] shadow-3xs"
                    >
                      <option value="all">{'All Badges'}</option>
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
                      {'No notices match your filter criteria.'}
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
                          {'Active'}
                        </span>
                      );

                      if (status === 'Scheduled') {
                        statusBadge = (
                          <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded border bg-amber-50 text-amber-800 border-amber-200 flex items-center gap-1 font-mono">
                            <Clock className="w-2.5 h-2.5 text-amber-600" />
                            {`Scheduled: ${ann.scheduledDate}`}
                          </span>
                        );
                      } else if (status === 'Expired') {
                        statusBadge = (
                          <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded border bg-rose-50 text-rose-700 border-rose-200 flex items-center gap-1 font-mono">
                            <Archive className="w-2.5 h-2.5 text-rose-600" />
                            {`Expired: ${ann.expiryDate}`}
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
                              language={language} />

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
                                  {'View Circular Document'}
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )}
                            </div>
                          </div>

                          {canManageNotices && (
                            <div className="flex items-center gap-1 shrink-0">
                              {/* Edit Button */}
                              <button
                                type="button"
                                onClick={() => setEditingNotice(ann)}
                                className="text-slate-400 hover:text-[#03623c] p-1.5 rounded-lg hover:bg-emerald-50 transition-all cursor-pointer border border-transparent hover:border-emerald-100"
                                title={'Edit Notice'}
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
                                title={'Remove Notice'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
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
                  {'Forgot Password Reset Requests Queue'}
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">
                  {'Manage requests submitted by employees to reset their payroll portal passwords.'}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={passwordSearch}
                  onChange={(e) => setPasswordSearch(e.target.value)}
                  placeholder={'Search employee ID/email...'}
                  className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#03623c] shadow-3xs" />
                <select
                  value={passwordStatusFilter}
                  onChange={(e: any) => setPasswordStatusFilter(e.target.value)}
                  className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#03623c] shadow-3xs"
                >
                  <option value="all">{'All Status'}</option>
                  <option value="Pending">{'Pending'}</option>
                  <option value="Resolved">{'Resolved'}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPasswordRequests.length === 0 ? (
                <div className="col-span-full py-12 text-center text-slate-400 italic bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl font-medium">
                  {'No password reset requests logged.'}
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
                          {'Email Address:'} <span className="font-mono font-bold text-slate-800 block text-[11px] truncate">{req.email}</span>
                        </p>
                        <p className="text-slate-400 mt-1">
                          {'Mobile Number:'} <span className="font-mono font-bold text-slate-800 block text-[11px]">{req.mobile}</span>
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
                          {'Resolve Reset'}
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
                  {'Active HR Helpdesk Support Inquiries'}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 font-semibold leading-relaxed">
                  {'Review, update, and resolve support queries submitted by on-duty workers.'}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={ticketSearch}
                    onChange={(e) => setTicketSearch(e.target.value)}
                    placeholder={'Search ID/Employee...'}
                    className="border border-slate-200 rounded-xl pl-8 pr-3.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#03623c] w-full sm:w-48 shadow-3xs bg-white text-slate-800" />
                </div>
                <div className="relative">
                  <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    value={ticketStatusFilter}
                    onChange={(e: any) => setTicketStatusFilter(e.target.value)}
                    className="border border-slate-200 rounded-xl pl-8 pr-3.5 py-1.5 text-xs font-bold bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#03623c] shadow-3xs"
                  >
                    <option value="all">{'All Status'}</option>
                    <option value="Pending">{'Pending'}</option>
                    <option value="Resolved">{'Resolved'}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Support Tickets Table */}
            <div className="overflow-x-auto border border-slate-100 rounded-2xl shadow-3xs bg-white">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    <th className="px-6 py-4 font-mono w-28">{'Ticket ID'}</th>
                    <th className="px-6 py-4 w-52">{'Employee Details'}</th>
                    <th className="px-6 py-4 w-36">{'Category'}</th>
                    <th className="px-6 py-4">{'Support Inquiry Message'}</th>
                    <th className="px-6 py-4 w-28">{'Status'}</th>
                    <th className="px-6 py-4 text-right w-36">{'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                  {filteredTickets.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-slate-400 italic bg-white font-semibold">
                        {'No support tickets found.'}
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
                            {ticket.status === 'Pending' ? ('Pending') : ('Resolved')}
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
                              {'Resolve Support'}
                            </button>
                          ) : (
                            <span className="text-[10px] text-emerald-700 font-black bg-emerald-50 border border-emerald-100/60 px-3 py-1.5 rounded-xl inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              {'Resolved'}
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
                {'Edit Announcement Circular'}
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
                    {'Title (English)'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editingNotice.title || ''}
                    onChange={(e) => setEditingNotice({ ...editingNotice, title: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#03623c]/20" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    {'Title (Hindi)'}
                  </label>
                  <input
                    type="text"
                    value={editingNotice.titleHi || ''}
                    onChange={(e) => setEditingNotice({ ...editingNotice, titleHi: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#03623c]/20" />
                </div>
              </div>

              <RichTextEditor
                label={'Content (English)'}
                value={editingNotice.content || ''}
                onChange={(val) => setEditingNotice({ ...editingNotice, content: val })}
                language={language}
                minHeight="100px" />

              <RichTextEditor
                label={'Content (Hindi)'}
                value={editingNotice.contentHi || ''}
                onChange={(val) => setEditingNotice({ ...editingNotice, contentHi: val })}
                language={language}
                minHeight="90px" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    {'Schedule Date'}
                  </label>
                  <input
                    type="date"
                    value={editingNotice.scheduledDate || editingNotice.date || todayStr}
                    onChange={(e) => setEditingNotice({ ...editingNotice, scheduledDate: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono font-bold" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    {'Expiry Date'}
                  </label>
                  <input
                    type="date"
                    value={editingNotice.expiryDate || ''}
                    onChange={(e) => setEditingNotice({ ...editingNotice, expiryDate: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    {'Category Badge:'}
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
                    {'Target Department:'}
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
                  {'Attachment Link:'}
                </label>
                <input
                  type="url"
                  value={editingNotice.attachmentUrl || ''}
                  onChange={(e) => setEditingNotice({ ...editingNotice, attachmentUrl: e.target.value })}
                  placeholder="https://drive.google.com/..."
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold" />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={!!editingNotice.isPinned}
                    onChange={(e) => setEditingNotice({ ...editingNotice, isPinned: e.target.checked })}
                    className="w-4 h-4 text-[#03623c] rounded border-slate-300 focus:ring-[#03623c]" />
                  <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1">
                    <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    {'Pin to Top'}
                  </span>
                </label>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingNotice(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    {'Cancel'}
                  </button>

                  <button
                    type="submit"
                    className="bg-[#03623c] hover:bg-[#02492d] text-white font-black text-xs px-5 py-2 rounded-xl transition-colors uppercase tracking-wider cursor-pointer shadow-sm flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {'Save Changes'}
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

