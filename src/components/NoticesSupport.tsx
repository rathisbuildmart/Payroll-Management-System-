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
  Filter
} from 'lucide-react';

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
  // Sub-tabs: 'announcements' | 'passwords' | 'tickets'
  const [localSubTab, setLocalSubTab] = useState<'announcements' | 'passwords' | 'tickets'>('announcements');
  const activeSubTab = controlledSubTab !== undefined ? controlledSubTab : localSubTab;
  const setActiveSubTab = setControlledSubTab !== undefined ? setControlledSubTab : setLocalSubTab;

  // New Notice form states
  const [newNoticeTitle, setNewNoticeTitle] = useState('');
  const [newNoticeTitleHi, setNewNoticeTitleHi] = useState('');
  const [newNoticeContent, setNewNoticeContent] = useState('');
  const [newNoticeContentHi, setNewNoticeContentHi] = useState('');
  const [newNoticeBadge, setNewNoticeBadge] = useState<'Critical' | 'Holiday' | 'General' | 'Policy'>('General');

  // Search/Filter states
  const [noticeSearch, setNoticeSearch] = useState('');
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketStatusFilter, setTicketStatusFilter] = useState<'all' | 'Pending' | 'Resolved'>('all');
  const [passwordSearch, setPasswordSearch] = useState('');
  const [passwordStatusFilter, setPasswordStatusFilter] = useState<'all' | 'Pending' | 'Resolved'>('all');

  const handleAddNotice = (e: React.FormEvent) => {
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

    setAnnouncements(prev => [newAnn, ...prev]);

    // Reset fields
    setNewNoticeTitle('');
    setNewNoticeTitleHi('');
    setNewNoticeContent('');
    setNewNoticeContentHi('');
    setNewNoticeBadge('General');
  };

  // Filtered lists
  const filteredNotices = announcements.filter(ann => {
    const searchLower = noticeSearch.toLowerCase();
    const matchesSearch = 
      ann.title.toLowerCase().includes(searchLower) ||
      (ann.titleHi && ann.titleHi.toLowerCase().includes(searchLower)) ||
      ann.content.toLowerCase().includes(searchLower) ||
      (ann.contentHi && ann.contentHi.toLowerCase().includes(searchLower));
    return matchesSearch;
  });

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
      {/* Top Banner & Header - extremely clean and light, no dark black tints */}
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
                ? 'Central administrative control center to publish general announcements, clear forgot password logs, and resolve employee service tickets.'
                : 'सामान्य कंपनी सूचनाएं प्रकाशित करने, पासवर्ड रीसेट अनुरोधों को साफ़ करने और कर्मचारी सेवा हेल्पडेस्क टिकटों का समाधान करने के लिए केंद्रीय प्रशासनिक नियंत्रण केंद्र।'}
            </p>
          </div>
        </div>
      </div>

      {/* Submenus (Tabs Navigation) - strictly in 1 LINE, no wrap, smooth scroll, clean light layout */}
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start font-sans">
            {/* Left: Create Notice Form - clean light design */}
            <div className="lg:col-span-5 bg-white border border-gray-100 rounded-2xl p-5 space-y-4 shadow-3xs">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5 border-b border-gray-50 pb-3">
                <Plus className="w-4 h-4 text-[#03623c]" />
                {language === 'en' ? 'Publish Circular / Notice' : 'नया परिपत्र / सूचना प्रकाशित करें'}
              </h3>

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

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    {language === 'en' ? 'Content (English)' : 'विवरण (अंग्रेजी)'} <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={newNoticeContent}
                    onChange={(e) => setNewNoticeContent(e.target.value)}
                    placeholder="Write detailed notification circular description in English..."
                    className="w-full border border-slate-200 rounded-xl p-3.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#03623c]/10 focus:border-[#03623c] bg-white text-slate-800 resize-none transition-all shadow-3xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    {language === 'en' ? 'Content (Hindi)' : 'विवरण (हिंदी)'}
                  </label>
                  <textarea
                    rows={3}
                    value={newNoticeContentHi}
                    onChange={(e) => setNewNoticeContentHi(e.target.value)}
                    placeholder="परिपत्र का विस्तृत विवरण हिंदी में लिखें..."
                    className="w-full border border-slate-250 rounded-xl p-3.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#03623c]/10 focus:border-[#03623c] bg-white text-slate-800 resize-none transition-all shadow-3xs"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pt-1.5">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      {language === 'en' ? 'Badge Type:' : 'कैटेगरी:'}
                    </span>
                    <select
                      value={newNoticeBadge}
                      onChange={(e: any) => setNewNoticeBadge(e.target.value)}
                      className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold bg-white text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#03623c] shadow-3xs"
                    >
                      <option value="General">General</option>
                      <option value="Critical">Critical</option>
                      <option value="Holiday">Holiday</option>
                      <option value="Policy">Policy</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full sm:w-auto bg-[#03623c] hover:bg-[#02492d] text-white font-black text-xs px-5 py-2.5 rounded-xl transition-colors uppercase tracking-wider cursor-pointer shadow-sm"
                  >
                    {language === 'en' ? 'Publish Notice' : 'सूचना प्रकाशित करें'}
                  </button>
                </div>
              </form>
            </div>

            {/* Right: Notices List with Search - clean light design */}
            <div className="lg:col-span-7 bg-white border border-gray-100 rounded-2xl p-5 space-y-4 shadow-3xs">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-gray-50 pb-3">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <span>📢</span>
                  <span>{language === 'en' ? 'Active Announcements' : 'सक्रिय नोटिस बोर्ड'}</span>
                </h3>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={noticeSearch}
                    onChange={(e) => setNoticeSearch(e.target.value)}
                    placeholder={language === 'en' ? 'Search notices...' : 'नोटिस खोजें...'}
                    className="border border-slate-200 rounded-xl pl-8 pr-3.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#03623c] max-w-xs shadow-3xs"
                  />
                </div>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {filteredNotices.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic text-center py-12 bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl font-medium">
                    {language === 'en' ? 'No notices match your search.' : 'आपकी खोज से मेल खाता कोई नोटिस नहीं है।'}
                  </p>
                ) : (
                  filteredNotices.map((ann) => {
                    let badgeCol = 'bg-slate-50 text-slate-600 border-slate-200';
                    if (ann.badge === 'Critical') badgeCol = 'bg-red-50 text-red-600 border-red-150';
                    if (ann.badge === 'Holiday') badgeCol = 'bg-amber-50 text-amber-700 border-amber-150';
                    if (ann.badge === 'Policy') badgeCol = 'bg-emerald-50 text-emerald-800 border-emerald-150';

                    return (
                      <div key={ann.id} className="bg-white border border-slate-100 p-4 rounded-xl shadow-3xs flex justify-between items-start gap-4 hover:border-[#03623c]/20 transition-all">
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${badgeCol} font-mono`}>
                              {language === 'en' ? ann.badge : ann.badgeHi}
                            </span>
                            <h5 className="text-xs font-extrabold text-slate-900 font-sans leading-snug">
                              {language === 'en' ? ann.title : ann.titleHi}
                            </h5>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
                            {language === 'en' ? ann.content : ann.contentHi}
                          </p>
                          <span className="text-[9px] text-slate-400 font-mono block pt-0.5">{ann.date} • Published by System Administrator</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setAnnouncements(prev => prev.filter(a => a.id !== ann.id));
                          }}
                          className="text-slate-300 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50/60 transition-all shrink-0 cursor-pointer border border-transparent hover:border-red-100"
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

        {/* SUBTAB 3: HR HELPDESK SUPPORT TICKETS - styled to absolute light, spacious perfection as requested */}
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

            {/* Premium, spacious, light table - perfect responsive enterprise style */}
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
    </div>
  );
}
