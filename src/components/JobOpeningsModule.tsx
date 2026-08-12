import React, { useState } from 'react';
import { 
  Briefcase, 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  DollarSign, 
  UserCheck, 
  Clock, 
  Building, 
  Award, 
  TrendingUp, 
  Eye, 
  Edit3, 
  Trash2, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  ChevronRight, 
  ArrowUpRight,
  Phone,
  Mail,
  UserPlus,
  ShieldCheck
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  PieChart, 
  Pie, 
  Cell,
  Line,
  ComposedChart
} from 'recharts';
import { JobPosting, Candidate, AdminSettings, Employee } from '../types';

interface JobOpeningsModuleProps {
  jobs: JobPosting[];
  candidates: Candidate[];
  onAddJob: (job: Partial<JobPosting>) => void;
  onUpdateJob: (id: string, updated: Partial<JobPosting>) => void;
  onDeleteJob: (id: string) => void;
  onFilterPipelineByJob: (jobId: string) => void;
  onUpdateCandidateStage: (candidateId: string, stage: Candidate['stage']) => void;
  language?: 'en' | 'hi';
  adminSettings?: AdminSettings;
  employees?: Employee[];
}

export default function JobOpeningsModule({
  jobs,
  candidates,
  onAddJob,
  onUpdateJob,
  onDeleteJob,
  onFilterPipelineByJob,
  onUpdateCandidateStage,
  language = 'en',
  adminSettings,
  employees = []
}: JobOpeningsModuleProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [selectedLocation, setSelectedLocation] = useState('ALL');
  const [selectedDesignation, setSelectedDesignation] = useState('ALL');
  const [selectedDirector, setSelectedDirector] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  const [selectedJobForModal, setSelectedJobForModal] = useState<JobPosting | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingJob, setEditingJob] = useState<JobPosting | null>(null);

  //Custom input states for Add/Edit Modal
  const [isCustomTitle, setIsCustomTitle] = useState(false);
  const [isCustomLocation, setIsCustomLocation] = useState(false);
  const [isCustomDirector, setIsCustomDirector] = useState(false);

  //Master lists for Dropdowns/1. BranchesLocations
  const availableBranches = Array.from(new Set([
    ...(adminSettings?.branches || []),
    ...employees.map(e => e.branch).filter(Boolean) as string[],
    ...jobs.map(j => j.location).filter(Boolean) as string[],
    'Raipur HQ',
    'Jagdalpur Branch',
    'Bilaspur Branch',
    'Bhilai Depot',
    'Durg Hub',
    'Korba Office'
  ]));

  //2. Directors
  const directorRoleNames = (adminSettings?.roleAccounts || [])
    .filter(a => a.role === 'director' || a.role === 'admin' || a.role === 'sub_admin')
    .map(a => a.name);

  const employeeDirectors = employees
    .filter(e => (e.designation || '').toLowerCase().includes('director') || (e.department || '').toLowerCase().includes('management'))
    .map(e => e.name);

  const availableDirectors = Array.from(new Set([
    ...directorRoleNames,
    ...employeeDirectors,
    ...jobs.map(j => j.directorName).filter(Boolean) as string[],
    'Mr. Rajesh Rathi',
    'Mr. Amit Rathi',
    'Mr. Vikas Rathi',
    'Board of Directors',
    'HR Director'
  ]));

  //3. Job Designations
  const settingsDesignations = adminSettings?.jobOpeningsList || [];
  const employeeDesignations = employees.map(e => e.designation).filter(Boolean) as string[];
  const defaultDesignations = [
    'Senior Sales Executive',
    'AccountantBilling Clerk',
    'Warehouse & Logistics Supervisor',
    'IT & Tally Administrator',
    'Store Manager',
    'Dispatch Officer',
    'Civil EngineerSite Supervisor',
    'Area Sales Manager',
    'HR Executive & Recruiter',
    'Billing & Accounts Assistant',
    'Purchase & Stock Manager'
  ];

  const availableDesignations = Array.from(new Set([
    ...settingsDesignations,
    ...employeeDesignations,
    ...jobs.map(j => j.title).filter(Boolean) as string[],
    ...defaultDesignations
  ]));

  //Form State
  const [formData, setFormData] = useState<Partial<JobPosting>>({
    title: availableDesignations[0] || 'Senior Sales Executive',
    department: 'Sales',
    location: availableBranches[0] || 'Raipur HQ',
    type: 'Full-time',
    openings: 1,
    status: 'Open',
    postedDate: new Date().toISOString().slice(0, 10),
    description: '',
    requirements: '',
    targetCtcMin: 20000,
    targetCtcMax: 35000,
    hiringManager: 'HR Team',
    urgency: 'Medium',
    experienceLevel: '2-4 Years',
    directorName: availableDirectors[0] || 'Mr. Rajesh Rathi',
    targetDate: ''
  });

  //Calculate Metrics
  const totalOpeningsCount = jobs.filter(j => j.status === 'Open').reduce((acc, j) => acc + (j.openings || 1), 0);
  const totalJobsCount = jobs.length;
  const hiredCandidates = candidates.filter(c => c.stage === 'Hired');
  const totalHiredCount = hiredCandidates.length;
  const totalApplicantsCount = candidates.length;

  //Department list
  const departments = Array.from(new Set([...jobs.map(j => j.department), 'Sales', 'Finance', 'Operations', 'HR', 'IT']));

  //Filter Jobs
  const filteredJobs = jobs.filter(j => {
    const matchesSearch = j.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (j.directorName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = selectedDepartment === 'ALL' || j.department === selectedDepartment;
    const matchesLocation = selectedLocation === 'ALL' || j.location === selectedLocation;
    const matchesDesignation = selectedDesignation === 'ALL' || j.title === selectedDesignation;
    const matchesDirector = selectedDirector === 'ALL' || (j.directorName || '') === selectedDirector;
    const matchesStatus = selectedStatus === 'ALL' || j.status === selectedStatus;

    return matchesSearch && matchesDept && matchesLocation && matchesDesignation && matchesDirector && matchesStatus;
  });

  const hasActiveFilters = selectedDepartment !== 'ALL' || selectedLocation !== 'ALL' || selectedDesignation !== 'ALL' || selectedDirector !== 'ALL' || selectedStatus !== 'ALL' || searchTerm.trim() !== '';

  //Monthly Hiring & Application Stats ("kab kitna hired hua")
  const monthlyDataMap: Record<string, { month: string; applied: number; hired: number; interviewed: number }> = {
    'May 2026': { month: 'May 2026', applied: 12, hired: 2, interviewed: 5 },
    'Jun 2026': { month: 'Jun 2026', applied: 18, hired: 3, interviewed: 8 },
    'Jul 2026': { month: 'Jul 2026', applied: 24, hired: 4, interviewed: 11 },
    'Aug 2026': { month: 'Aug 2026', applied: candidates.length, hired: totalHiredCount, interviewed: candidates.filter(c => c.stage === 'Interview' || c.stage === 'Offered' || c.stage === 'Hired').length }
  };

  //Dynamically augment from actual candidates
  candidates.forEach(c => {
    if (c.appliedDate) {
      const dateObj = new Date(c.appliedDate);
      if (!isNaN(dateObj.getTime())) {
        const monthLabel = dateObj.toLocaleString('en-US', { month: 'short', year: 'numeric' });
        if (!monthlyDataMap[monthLabel]) {
          monthlyDataMap[monthLabel] = { month: monthLabel, applied: 0, hired: 0, interviewed: 0 };
        }
        monthlyDataMap[monthLabel].applied += 1;
        if (c.stage === 'Hired') monthlyDataMap[monthLabel].hired += 1;
        if (c.stage === 'Interview' || c.stage === 'Offered' || c.stage === 'Hired') monthlyDataMap[monthLabel].interviewed += 1;
      }
    }
  });

  const timelineChartData = Object.values(monthlyDataMap);

  //Department Breakdown Chart Data
  const deptBreakdownMap: Record<string, { department: string; openings: number; hired: number }> = {};
  jobs.forEach(j => {
    if (!deptBreakdownMap[j.department]) {
      deptBreakdownMap[j.department] = { department: j.department, openings: 0, hired: 0 };
    }
    deptBreakdownMap[j.department].openings += j.openings || 1;
  });
  candidates.filter(c => c.stage === 'Hired').forEach(c => {
    const job = jobs.find(j => j.id === c.jobId || j.title === c.jobTitle);
    const dept = job ? job.department : 'General';
    if (!deptBreakdownMap[dept]) {
      deptBreakdownMap[dept] = { department: dept, openings: 0, hired: 0 };
    }
    deptBreakdownMap[dept].hired += 1;
  });
  const deptChartData = Object.values(deptBreakdownMap);

  const COLORS = ['#004d3d', '#059669', '#d97706', '#2563eb', '#7c3aed', '#dc2626'];

  //Open Add Modal
  const handleOpenAddModal = () => {
    setEditingJob(null);
    setIsCustomTitle(false);
    setIsCustomLocation(false);
    setIsCustomDirector(false);
    setFormData({
      title: availableDesignations[0] || 'Senior Sales Executive',
      department: 'Sales',
      location: availableBranches[0] || 'Raipur HQ',
      type: 'Full-time',
      openings: 1,
      status: 'Open',
      postedDate: new Date().toISOString().slice(0, 10),
      description: '',
      requirements: '',
      targetCtcMin: 20000,
      targetCtcMax: 35000,
      hiringManager: 'HR Team',
      urgency: 'Medium',
      experienceLevel: '2-4 Years',
      directorName: availableDirectors[0] || 'Mr. Rajesh Rathi',
      targetDate: ''
    });
    setShowAddModal(true);
  };

  //Open Edit Modal
  const handleOpenEditModal = (job: JobPosting) => {
    setEditingJob(job);
    setIsCustomTitle(!availableDesignations.includes(job.title));
    setIsCustomLocation(!availableBranches.includes(job.location));
    setIsCustomDirector(job.directorName ? !availableDirectors.includes(job.directorName) : false);
    setFormData({ ...job });
    setShowAddModal(true);
  };

  //Submit Job Add/Edit
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;
    if (editingJob) {
      onUpdateJob(editingJob.id, formData);
    } else {
      onAddJob(formData);
    }
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 text-slate-800">
      {/* SCORECARD METRICS BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Open Vacancies Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 relative overflow-hidden shadow-sm hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {'Active Vacancies'}
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900">{totalOpeningsCount}</span>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {jobs.filter(j => j.status === 'Open').length} Open Positions
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            Across {departments.length} company departments
          </p>
        </div>

        {/* Total Candidates Applied */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 relative overflow-hidden shadow-sm hover:border-blue-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {'Applications Received'}
            </span>
            <div className="p-2 bg-blue-50 text-blue-800 rounded-xl border border-blue-200">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900">{totalApplicantsCount}</span>
            <span className="text-xs font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              {(totalApplicantsCount / (totalOpeningsCount || 1)).toFixed(1)} applicants / role
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            Active candidate pool in recruitment pipeline
          </p>
        </div>

        {/* Total Hired Candidates */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 relative overflow-hidden shadow-sm hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {'Total Hired Joiners'}
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-emerald-800">{totalHiredCount}</span>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {totalOpeningsCount > 0 ? ((totalHiredCount / totalOpeningsCount) * 100).toFixed(0) : 100}% Target Met
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            {'Successfully onboarded new team members'}
          </p>
        </div>

        {/* Time to Hire & Budget */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 relative overflow-hidden shadow-sm hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {'Avg Time to Hire'}
            </span>
            <div className="p-2 bg-amber-50 text-amber-800 rounded-xl border border-amber-200">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900">14 <span className="text-sm font-normal text-slate-500">Days</span></span>
            <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              Fast Track
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            Industry Benchmark: 21 Days
          </p>
        </div>
      </div>

      {/* CHARTS & HIRING SCORECARD ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline Chart: Kab Kitna Hired Hua */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-700" />
                {'Monthly Hiring & Applications Timeline'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {'Month-by-month breakdown of candidate applications vs final hires.'}
              </p>
            </div>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-800 font-mono text-xs font-bold rounded-xl border border-emerald-200">
              2026 Trend
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={timelineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#ffffff', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="applied" name="Applications Received" fill="#94a3b8" radius={[6, 6, 0, 0]} barSize={24} />
                <Bar dataKey="interviewed" name="Interviewed Candidates" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={24} />
                <Bar dataKey="hired" name="Final Hired Candidates" fill="#004d3d" radius={[6, 6, 0, 0]} barSize={24} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Distribution */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building className="w-5 h-5 text-indigo-600" />
              {'Department Vacancies'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Openings distribution across departments
            </p>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptChartData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} />
                <YAxis dataKey="department" type="category" tick={{ fontSize: 11, fill: '#334155' }} width={80} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                <Bar dataKey="openings" name="Vacancies" fill="#004d3d" radius={[0, 6, 6, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            {deptChartData.map((d, idx) => (
              <div key={d.department} className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">{d.department}</span>
                <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                  {d.openings} Openings
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RECENT HIRED CANDIDATES TIMELINE SUMMARY TABLE */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
              {'Hired Candidates & Onboarded Joiners Log (Kab Kitna Hired)'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              History of candidates who cleared all interview rounds and received job offers.
            </p>
          </div>
          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-300">
            {candidates.filter(c => c.stage === 'Hired' || c.stage === 'Offered').length} ConfirmedOffered
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3">Candidate Name</th>
                <th className="p-3">Job Designation</th>
                <th className="p-3">Status</th>
                <th className="p-3">Applied Date</th>
                <th className="p-3">Offered Salary</th>
                <th className="p-3">PhoneContact</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {candidates.filter(c => c.stage === 'Hired' || c.stage === 'Offered').map(c => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-bold text-slate-900">{c.name}</td>
                  <td className="p-3 font-semibold text-emerald-800">{c.jobTitle || 'Role Assigned'}</td>
                  <td className="p-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                      c.stage === 'Hired' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-amber-100 text-amber-800 border-amber-300'
                    }`}>
                      {c.stage}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-slate-600">{c.appliedDate}</td>
                  <td className="p-3 font-bold text-slate-900">₹{(c.expectedSalary || 0).toLocaleString('en-IN')}mo</td>
                  <td className="p-3 font-mono text-slate-600">{c.phone}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => onUpdateCandidateStage(c.id, c.stage === 'Offered' ? 'Hired' : 'Hired')}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-lg border border-emerald-200 transition-all"
                    >
                      {c.stage === 'Hired' ? 'Onboarded' : 'Confirm Joining'}
                    </button>
                  </td>
                </tr>
              ))}
              {candidates.filter(c => c.stage === 'Hired' || c.stage === 'Offered').length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400">
                    No hired candidates record found yet. Advance candidates to Offered or Hired stage to track here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* JOB OPENINGS LISTING HEADER & SEARCH */}
      <div className="bg-white p-4 border border-slate-200 rounded-2xl shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder={'Search job title, branch, director, ID...'}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white font-medium" />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Action Button */}
          <button
            onClick={handleOpenAddModal}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-[#004d3d] hover:bg-[#064e3b] text-white text-xs font-bold rounded-xl transition-all shadow-md shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {'Post New Job Opening'}
          </button>
        </div>

        {/* Filter Dropdowns Row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">
            <Filter className="w-3.5 h-3.5 text-emerald-700" />
            <span>{'Filters:'}</span>
          </div>

          {/* 1. Job Designation Filter Dropdown */}
          <select
            value={selectedDesignation}
            onChange={e => setSelectedDesignation(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-xs text-slate-800 font-semibold rounded-xl px-3 py-1.5 focus:outline-none focus:border-emerald-600 focus:bg-white"
          >
            <option value="ALL">{'All Job Designations'}</option>
            {availableDesignations.map(title => (
              <option key={title} value={title}>{title}</option>
            ))}
          </select>

          {/* 2. BranchJob Location Filter Dropdown */}
          <select
            value={selectedLocation}
            onChange={e => setSelectedLocation(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-xs text-slate-800 font-semibold rounded-xl px-3 py-1.5 focus:outline-none focus:border-emerald-600 focus:bg-white"
          >
            <option value="ALL">{'All BranchesLocations'}</option>
            {availableBranches.map(br => (
              <option key={br} value={br}>{br}</option>
            ))}
          </select>

          {/* 3. Director Filter Dropdown */}
          <select
            value={selectedDirector}
            onChange={e => setSelectedDirector(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-xs text-slate-800 font-semibold rounded-xl px-3 py-1.5 focus:outline-none focus:border-emerald-600 focus:bg-white"
          >
            <option value="ALL">{'All Directors'}</option>
            {availableDirectors.map(dir => (
              <option key={dir} value={dir}>{dir}</option>
            ))}
          </select>

          {/* 4. Department Filter Dropdown */}
          <select
            value={selectedDepartment}
            onChange={e => setSelectedDepartment(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-xs text-slate-800 font-semibold rounded-xl px-3 py-1.5 focus:outline-none focus:border-emerald-600 focus:bg-white"
          >
            <option value="ALL">{'All Departments'}</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          {/* 5. Status Filter Dropdown */}
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-xs text-slate-800 font-semibold rounded-xl px-3 py-1.5 focus:outline-none focus:border-emerald-600 focus:bg-white"
          >
            <option value="ALL">{'All Status'}</option>
            <option value="Open">Open</option>
            <option value="On Hold">On Hold</option>
            <option value="Closed">Closed</option>
          </select>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setSelectedDepartment('ALL');
                setSelectedLocation('ALL');
                setSelectedDesignation('ALL');
                setSelectedDirector('ALL');
                setSelectedStatus('ALL');
                setSearchTerm('');
              }}
              className="text-[11px] font-bold text-rose-600 hover:text-rose-800 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 transition-all flex items-center gap-1 cursor-pointer ml-auto"
            >
              <X className="w-3.5 h-3.5" />
              <span>{'Reset Filters'}</span>
            </button>
          )}
        </div>
      </div>

      {/* RICH JOB OPENINGS CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredJobs.map(job => {
          //Calculate applicant breakdown for this specific job
          const jobCandidates = candidates.filter(c => c.jobId === job.id || c.jobTitle === job.title);
          const appliedCount = jobCandidates.filter(c => c.stage === 'Applied' || c.stage === 'Screening').length;
          const interviewCount = jobCandidates.filter(c => c.stage === 'Interview' || c.stage === 'HR Interview' || c.stage === 'Director Interview').length;
          const offerCount = jobCandidates.filter(c => c.stage === 'Offered').length;
          const hiredCount = jobCandidates.filter(c => c.stage === 'Hired').length;

          return (
            <div 
              key={job.id} 
              className="bg-white border border-slate-200 hover:border-emerald-500/60 rounded-3xl p-5 space-y-4 transition-all shadow-sm hover:shadow-md flex flex-col justify-between group relative"
            >
              {/* Top Header */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      {job.id}
                    </span>
                    {job.urgency === 'High' && (
                      <span className="text-[9px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                        Urgent Hire
                      </span>
                    )}
                  </div>

                  {/* Status Dropdown */}
                  <select
                    value={job.status}
                    onChange={e => onUpdateJob(job.id, { status: e.target.value as any })}
                    className={`text-[10px] font-bold rounded-full px-2.5 py-1 border focus:outline-none cursor-pointer ${
                      job.status === 'Open' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                      job.status === 'On Hold' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                      'bg-slate-100 text-slate-700 border-slate-300'
                    }`}
                  >
                    <option value="Open">Open</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                    {job.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 font-medium">
                    <span>{job.department}</span>
                    <span>•</span>
                    <span className="font-semibold text-slate-700">{job.location}</span>
                    <span>•</span>
                    <span className="text-slate-700 font-semibold">{job.type}</span>
                  </div>

                  {/* Director Badge */}
                  {job.directorName && (
                    <div className="mt-1.5 inline-flex items-center gap-1.5 text-[10px] font-bold text-[#004d3d] bg-emerald-50/90 px-2.5 py-0.5 rounded-md border border-emerald-200/80">
                      <UserCheck className="w-3 h-3 text-[#004d3d]" />
                      <span>Director: {job.directorName}</span>
                    </div>
                  )}
                </div>

                {/* Salary Range & Manager Badges */}
                <div className="grid grid-cols-2 gap-2 pt-2 text-[11px]">
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 flex items-center gap-1.5 text-slate-700">
                    <DollarSign className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <div>
                      <span className="text-[9px] text-slate-400 block font-medium">Target Salary</span>
                      <span className="font-bold text-slate-900">
                        ₹{job.targetCtcMin ? (job.targetCtcMin / 1000).toFixed(0) : '20'}k - ₹{job.targetCtcMax ? (job.targetCtcMax / 1000).toFixed(0) : '35'}k/m
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 flex items-center gap-1.5 text-slate-700">
                    <Users className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <div>
                      <span className="text-[9px] text-slate-400 block font-medium">Vacancies</span>
                      <span className="font-bold text-slate-900">{job.openings} Open Position(s)</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 pt-1 font-normal">
                  {job.description || 'No description provided.'}
                </p>
              </div>

              {/* CANDIDATE PIPELINE MINI STAGE BADGES */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-700">Applicants Pipeline ({jobCandidates.length})</span>
                  <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                    {hiredCount} Hired
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] font-bold">
                  <div className="bg-slate-100 text-slate-700 p-1.5 rounded-lg border border-slate-200">
                    <span className="block text-slate-400 text-[9px]">Applied</span>
                    <span className="text-slate-900">{appliedCount}</span>
                  </div>
                  <div className="bg-blue-50 text-blue-800 p-1.5 rounded-lg border border-blue-200">
                    <span className="block text-blue-500 text-[9px]">Interview</span>
                    <span>{interviewCount}</span>
                  </div>
                  <div className="bg-amber-50 text-amber-800 p-1.5 rounded-lg border border-amber-200">
                    <span className="block text-amber-600 text-[9px]">Offered</span>
                    <span>{offerCount}</span>
                  </div>
                  <div className="bg-emerald-50 text-emerald-800 p-1.5 rounded-lg border border-emerald-200">
                    <span className="block text-emerald-600 text-[9px]">Hired</span>
                    <span>{hiredCount}</span>
                  </div>
                </div>

                {/* Card Action Controls */}
                <div className="flex items-center justify-between gap-2 pt-2">
                  <button
                    onClick={() => setSelectedJobForModal(job)}
                    className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-200 flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Details</span>
                  </button>

                  <button
                    onClick={() => onFilterPipelineByJob(job.id)}
                    className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 flex items-center gap-1 transition-all"
                    title="Open Pipeline for this Job"
                  >
                    <span>Pipeline</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleOpenEditModal(job)}
                    className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition-all"
                    title="Edit Job"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onDeleteJob(job.id)}
                    className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl border border-rose-200 transition-all"
                    title="Delete Job"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredJobs.length === 0 && (
          <div className="col-span-full bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-500 space-y-3">
            <Briefcase className="w-8 h-8 mx-auto text-slate-400" />
            <p className="font-semibold text-sm">No job openings found matching filter criteria.</p>
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-[#004d3d] text-white text-xs font-bold rounded-xl inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Post New Job
            </button>
          </div>
        )}
      </div>

      {/* DETAILED JOB OVERVIEW MODAL */}
      {selectedJobForModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl text-slate-900 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                    {selectedJobForModal.id}
                  </span>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                    selectedJobForModal.status === 'Open' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-slate-100 text-slate-700 border-slate-300'
                  }`}>
                    {selectedJobForModal.status}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 mt-1">{selectedJobForModal.title}</h2>
                <p className="text-xs text-slate-500 font-medium">{selectedJobForModal.department} • {selectedJobForModal.location} • Posted {selectedJobForModal.postedDate}</p>
              </div>
              <button onClick={() => setSelectedJobForModal(null)} className="p-1 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Key Specs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Vacancies Needed</span>
                <span className="font-bold text-slate-900 text-sm">{selectedJobForModal.openings} Position(s)</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Employment Type</span>
                <span className="font-bold text-slate-900 text-sm">{selectedJobForModal.type}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Target Salary Bracket</span>
                <span className="font-bold text-emerald-800 text-sm">₹{(selectedJobForModal.targetCtcMin || 20000).toLocaleString('en-IN')} - ₹{(selectedJobForModal.targetCtcMax || 35000).toLocaleString('en-IN')}</span>
              </div>
              {selectedJobForModal.directorName && (
                <div>
                  <span className="text-slate-400 block text-[10px]">Director Name</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedJobForModal.directorName}</span>
                </div>
              )}
              {selectedJobForModal.targetDate && (
                <div>
                  <span className="text-slate-400 block text-[10px]">Target Date</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedJobForModal.targetDate}</span>
                </div>
              )}
            </div>

            {/* Description & Requirements */}
            <div className="space-y-3 text-xs">
              <div>
                <h4 className="font-bold text-slate-900 mb-1">Job Description</h4>
                <p className="text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
                  {selectedJobForModal.description || 'No description available.'}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-1">Key Requirements & Skills Needed</h4>
                <p className="text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
                  {selectedJobForModal.requirements || 'Standard departmental qualifications apply.'}
                </p>
              </div>
            </div>

            {/* Applicants List for this Job */}
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <h4 className="font-bold text-slate-900 text-xs flex items-center justify-between">
                <span>Candidates Applied for this Role</span>
                <span className="text-emerald-800 font-mono">
                  {candidates.filter(c => c.jobId === selectedJobForModal.id || c.jobTitle === selectedJobForModal.title).length} Candidates
                </span>
              </h4>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {candidates.filter(c => c.jobId === selectedJobForModal.id || c.jobTitle === selectedJobForModal.title).map(c => (
                  <div key={c.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{c.name}</span>
                      <span className="text-[10px] text-slate-500 block font-mono">{c.phone} • {c.experienceYears} Yrs Exp</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-slate-800 border border-slate-300">
                        {c.stage}
                      </span>
                      {c.stage !== 'Hired' && (
                        <button
                          onClick={() => onUpdateCandidateStage(c.id, 'Hired')}
                          className="px-2.5 py-1 bg-[#004d3d] text-white text-[10px] font-bold rounded-lg hover:bg-[#064e3b]"
                        >
                          Hire Candidate
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {candidates.filter(c => c.jobId === selectedJobForModal.id || c.jobTitle === selectedJobForModal.title).length === 0 && (
                  <p className="text-center text-slate-400 py-4 text-xs">No candidate applications recorded yet for this job opening.</p>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <button
                onClick={() => {
                  onFilterPipelineByJob(selectedJobForModal.id);
                  setSelectedJobForModal(null);
                }}
                className="px-4 py-2 bg-[#004d3d] hover:bg-[#064e3b] text-white font-bold text-xs rounded-xl shadow-sm"
              >
                View Pipeline in Kanban Board
              </button>

              <button
                onClick={() => setSelectedJobForModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADDEDIT JOB MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 space-y-4 text-xs shadow-2xl text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {editingJob ? 'Edit Job Opening' : 'Post New Job Opening'}
              </h3>
              <button onClick={() => setShowAddModal(false)}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-3">
              {/* Job Designation Title Dropdown */}
              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  {'Job Designation Title *'}
                </label>
                {!isCustomTitle ? (
                  <select
                    required
                    value={availableDesignations.includes(formData.title || '') ? formData.title : '__CUSTOM__'}
                    onChange={e => {
                      if (e.target.value === '__CUSTOM__') {
                        setIsCustomTitle(true);
                        setFormData({ ...formData, title: '' });
                      } else {
                        setFormData({ ...formData, title: e.target.value });
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-semibold focus:bg-white focus:border-emerald-600 focus:outline-none"
                  >
                    {availableDesignations.map(title => (
                      <option key={title} value={title}>{title}</option>
                    ))}
                    <option value="__CUSTOM__">+ {'Enter Custom Designation...'}</option>
                  </select>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="e.g. Senior Regional Sales Manager"
                      value={formData.title || ''}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none font-medium" />
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomTitle(false);
                        setFormData({ ...formData, title: availableDesignations[0] || '' });
                      }}
                      className="px-3 py-2 bg-slate-200 hover:bg-slate-300 rounded-xl text-xs font-bold text-slate-700 shrink-0 cursor-pointer"
                    >
                      Select List
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Department</label>
                  <select
                    value={formData.department}
                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none font-medium"
                  >
                    <option value="Sales">Sales</option>
                    <option value="Finance">FinanceAccounts</option>
                    <option value="Operations">OperationsDispatch</option>
                    <option value="HR">HR & Admin</option>
                    <option value="IT">IT & Systems</option>
                  </select>
                </div>

                {/* Job Location (Branch) Dropdown */}
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    {'BranchJob Location *'}
                  </label>
                  {!isCustomLocation ? (
                    <select
                      required
                      value={availableBranches.includes(formData.location || '') ? formData.location : '__CUSTOM__'}
                      onChange={e => {
                        if (e.target.value === '__CUSTOM__') {
                          setIsCustomLocation(true);
                          setFormData({ ...formData, location: '' });
                        } else {
                          setFormData({ ...formData, location: e.target.value });
                        }
                      }}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-semibold focus:bg-white focus:border-emerald-600 focus:outline-none"
                    >
                      {availableBranches.map(br => (
                        <option key={br} value={br}>{br}</option>
                      ))}
                      <option value="__CUSTOM__">+ {'Enter Custom Branch...'}</option>
                    </select>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        placeholder="e.g. Raipur HQDurg Outlet"
                        value={formData.location || ''}
                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none font-medium" />
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomLocation(false);
                          setFormData({ ...formData, location: availableBranches[0] || '' });
                        }}
                        className="px-3 py-2 bg-slate-200 hover:bg-slate-300 rounded-xl text-xs font-bold text-slate-700 shrink-0 cursor-pointer"
                      >
                        Select List
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Job Type</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none font-medium"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-medium block mb-1">No. of Openings</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.openings}
                    onChange={e => setFormData({ ...formData, openings: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none font-medium" />
                </div>

                <div>
                  <label className="text-slate-700 font-medium block mb-1">Urgency</label>
                  <select
                    value={formData.urgency || 'Medium'}
                    onChange={e => setFormData({ ...formData, urgency: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none font-medium"
                  >
                    <option value="High">High (Urgent)</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Min Monthly Salary (₹)</label>
                  <input
                    type="number"
                    value={formData.targetCtcMin}
                    onChange={e => setFormData({ ...formData, targetCtcMin: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none font-medium" />
                </div>

                <div>
                  <label className="text-slate-700 font-medium block mb-1">Max Monthly Salary (₹)</label>
                  <input
                    type="number"
                    value={formData.targetCtcMax}
                    onChange={e => setFormData({ ...formData, targetCtcMax: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none font-medium" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Director Name Dropdown */}
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    {'Director Name'}
                  </label>
                  {!isCustomDirector ? (
                    <select
                      value={availableDirectors.includes(formData.directorName || '') ? formData.directorName : '__CUSTOM__'}
                      onChange={e => {
                        if (e.target.value === '__CUSTOM__') {
                          setIsCustomDirector(true);
                          setFormData({ ...formData, directorName: '' });
                        } else {
                          setFormData({ ...formData, directorName: e.target.value });
                        }
                      }}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-semibold focus:bg-white focus:border-emerald-600 focus:outline-none"
                    >
                      {availableDirectors.map(dir => (
                        <option key={dir} value={dir}>{dir}</option>
                      ))}
                      <option value="__CUSTOM__">+ {'Enter Custom Director...'}</option>
                    </select>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. Mr. Rajesh Rathi"
                        value={formData.directorName || ''}
                        onChange={e => setFormData({ ...formData, directorName: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none font-medium" />
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomDirector(false);
                          setFormData({ ...formData, directorName: availableDirectors[0] || '' });
                        }}
                        className="px-3 py-2 bg-slate-200 hover:bg-slate-300 rounded-xl text-xs font-bold text-slate-700 shrink-0 cursor-pointer"
                      >
                        Select List
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-slate-700 font-medium block mb-1">Target Date</label>
                  <input
                    type="date"
                    value={formData.targetDate || ''}
                    onChange={e => setFormData({ ...formData, targetDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none font-medium" />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-medium block mb-1">Description & Key Duties</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Summarize key responsibilities..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none" />
              </div>

              <div>
                <label className="text-slate-700 font-medium block mb-1">Requirements & Experience Needed</label>
                <input
                  type="text"
                  value={formData.requirements}
                  onChange={e => setFormData({ ...formData, requirements: e.target.value })}
                  placeholder="e.g. 3+ yrs experience in Tally PrimeB2B Sales"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none" />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#004d3d] hover:bg-[#064e3b] text-white font-bold rounded-xl mt-2 shadow-md transition-all"
              >
                {editingJob ? 'Save Job Changes' : 'Publish Job Opening'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
