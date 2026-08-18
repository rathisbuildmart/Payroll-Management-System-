import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Briefcase, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  ChevronRight, 
  Mail, 
  Phone, 
  Calendar, 
  DollarSign, 
  Check, 
  X, 
  Building, 
  Printer, 
  Sparkles,
  Award,
  Layers,
  ArrowRight,
  Users
} from 'lucide-react';
import { JobPosting, Candidate, CandidateFollowUp, OnboardingTask, OfferLetter, Employee, AdminSettings, ArchivedCandidateRecord } from '../types';
import RecruitmentKanbanBoard from './RecruitmentKanbanBoard';
import HiringScorecard from './HiringScorecard';
import JobOpeningsModule from './JobOpeningsModule';
import { syncArchivedCandidatesToSheets } from '../services/sheets';

interface HiringOnboardingProps {
  employees: Employee[];
  language?: 'en' | 'hi';
  adminSettings?: AdminSettings;
  spreadsheetId?: string | null;
  googleToken?: string | null;
}

export default function HiringOnboarding({ employees, language = 'en', adminSettings, spreadsheetId, googleToken }: HiringOnboardingProps) {
  const [activeTab, setActiveTab] = useState<'recruitment' | 'onboarding'>('recruitment');
  const [recruitmentSubTab, setRecruitmentSubTab] = useState<'jobs' | 'candidates' | 'scorecard'>('jobs');
  const [onboardingSubTab, setOnboardingSubTab] = useState<'tasks' | 'offers'>('tasks');

  //Local state with localStorage cache
  const [jobs, setJobs] = useState<JobPosting[]>(() => {
    const saved = localStorage.getItem('payroll_jobs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(j => !['JOB-001', 'JOB-002', 'JOB-003', 'JOB-004'].includes(j.id));
        }
      } catch (e) { console.error(e); }
    }
    return [];
  });

  const [candidates, setCandidates] = useState<Candidate[]>(() => {
    const saved = localStorage.getItem('payroll_candidates');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(c => !['CAN-001', 'CAN-002', 'CAN-003', 'CAN-004', 'CAN-005'].includes(c.id));
        }
      } catch (e) { console.error(e); }
    }
    return [];
  });

  const [onboardingTasks, setOnboardingTasks] = useState<OnboardingTask[]>(() => {
    const saved = localStorage.getItem('payroll_onboarding_tasks');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(t => !['ONT-001', 'ONT-002', 'ONT-003'].includes(t.id));
        }
      } catch (e) { console.error(e); }
    }
    return [];
  });

  const [offerLetters, setOfferLetters] = useState<OfferLetter[]>(() => {
    const saved = localStorage.getItem('payroll_offer_letters');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(o => o.id !== 'OFF-001');
        }
      } catch (e) { console.error(e); }
    }
    return [];
  });

  //Sync state to local storage
  useEffect(() => { localStorage.setItem('payroll_jobs', JSON.stringify(jobs)); }, [jobs]);
  useEffect(() => { localStorage.setItem('payroll_candidates', JSON.stringify(candidates)); }, [candidates]);
  useEffect(() => { localStorage.setItem('payroll_onboarding_tasks', JSON.stringify(onboardingTasks)); }, [onboardingTasks]);
  useEffect(() => { localStorage.setItem('payroll_offer_letters', JSON.stringify(offerLetters)); }, [offerLetters]);

  //Modals state
  const [showJobModal, setShowJobModal] = useState(false);
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [printOffer, setPrintOffer] = useState<OfferLetter | null>(null);

  //Search & Filter
  const [searchTerm, setSearchTerm] = useState('');

  //Form states
  const [newJob, setNewJob] = useState<Partial<JobPosting>>({
    title: '',
    department: 'Sales',
    location: 'Raipur HQ',
    type: 'Full-time',
    openings: 1,
    status: 'Open',
    postedDate: new Date().toISOString().slice(0, 10),
    description: '',
    requirements: '',
    directorName: '',
    targetDate: ''
  });

  const [newCandidate, setNewCandidate] = useState<Partial<Candidate>>({
    name: '',
    email: '',
    phone: '',
    jobId: '',
    experienceYears: 0,
    stage: 'Applied',
    appliedDate: new Date().toISOString().slice(0, 10),
    notes: '',
    expectedSalary: 0,
    gender: 'Male',
    highestEducation: '',
    hrName: '',
    location: '',
    resumeUrl: '',
    source: ''
  });

  const [newTask, setNewTask] = useState<Partial<OnboardingTask>>({
    employeeId: '',
    taskName: '',
    category: 'Documents',
    dueDate: new Date().toISOString().slice(0, 10),
    status: 'Pending',
    assignedTo: 'HR Manager'
  });

  const [newOffer, setNewOffer] = useState<Partial<OfferLetter>>({
    candidateName: '',
    email: '',
    phone: '',
    department: 'Sales',
    designation: 'Executive',
    offeredCtc: 240000,
    joiningDate: new Date().toISOString().slice(0, 10),
    status: 'Draft',
    issuedDate: new Date().toISOString().slice(0, 10),
    termsNotes: ''
  });

  //Action handlers
  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJob.title) return;
    const job: JobPosting = {
      id: `JOB-${String(jobs.length + 1).padStart(3, '0')}`,
      title: newJob.title || '',
      department: newJob.department || 'General',
      location: newJob.location || 'Raipur HQ',
      type: (newJob.type as any) || 'Full-time',
      openings: Number(newJob.openings) || 1,
      status: (newJob.status as any) || 'Open',
      postedDate: newJob.postedDate || new Date().toISOString().slice(0, 10),
      description: newJob.description || '',
      requirements: newJob.requirements || '',
      directorName: newJob.directorName || '',
      targetDate: newJob.targetDate || ''
    };
    setJobs([job, ...jobs]);
    setShowJobModal(false);
    setNewJob({
      title: '',
      department: 'Sales',
      location: 'Raipur HQ',
      type: 'Full-time',
      openings: 1,
      status: 'Open',
      postedDate: new Date().toISOString().slice(0, 10),
      description: '',
      requirements: '',
      directorName: '',
      targetDate: ''
    });
  };

  const handleCreateCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCandidate.name || !newCandidate.phone) return;
    const selectedJob = jobs.find(j => j.id === newCandidate.jobId);
    const candidate: Candidate = {
      id: `CAN-${String(candidates.length + 1).padStart(3, '0')}`,
      jobId: newCandidate.jobId,
      jobTitle: selectedJob ? selectedJob.title : 'General Position',
      name: newCandidate.name || '',
      email: newCandidate.email || '',
      phone: newCandidate.phone || '',
      experienceYears: Number(newCandidate.experienceYears) || 0,
      stage: (newCandidate.stage as any) || 'Applied',
      appliedDate: newCandidate.appliedDate || new Date().toISOString().slice(0, 10),
      interviewDate: newCandidate.interviewDate,
      notes: newCandidate.notes || '',
      expectedSalary: Number(newCandidate.expectedSalary) || 0,
      gender: newCandidate.gender || 'Male',
      highestEducation: newCandidate.highestEducation || '',
      hrName: newCandidate.hrName || '',
      location: newCandidate.location || '',
      resumeUrl: newCandidate.resumeUrl || '',
      source: newCandidate.source || ''
    };
    setCandidates([candidate, ...candidates]);
    setShowCandidateModal(false);
    setNewCandidate({
      name: '',
      email: '',
      phone: '',
      jobId: '',
      experienceYears: 0,
      stage: 'Applied',
      appliedDate: new Date().toISOString().slice(0, 10),
      notes: '',
      expectedSalary: 0,
      gender: 'Male',
      highestEducation: '',
      hrName: '',
      location: '',
      resumeUrl: '',
      source: ''
    });
  };

  const handleUpdateCandidateStage = (candidateId: string, newStage: Candidate['stage'], newNotes?: string) => {
    const todayStr = new Date().toISOString().slice(0, 10);
    let rejectedCandidateObj: Candidate | null = null;

    const updatedCandidates = candidates.map(c => {
      if (c.id === candidateId) {
        if (newStage === 'Rejected') {
          const rej: Candidate = {
            ...c,
            stage: 'Rejected',
            isArchived: true,
            rejectedDate: todayStr,
            rejectionReason: newNotes || 'Offer Declined / Candidate Rejected',
            notes: newNotes !== undefined ? newNotes : c.notes
          };
          rejectedCandidateObj = rej;
          return rej;
        }
        return {
          ...c,
          stage: newStage,
          isArchived: false,
          ...(newNotes !== undefined ? { notes: newNotes } : {})
        };
      }
      return c;
    });

    setCandidates(updatedCandidates);
    localStorage.setItem('payroll_candidates', JSON.stringify(updatedCandidates));

    // Automatically sync rejected candidate to Central Archived Candidates Storage & Google Sheet
    if (rejectedCandidateObj) {
      try {
        const canObj = rejectedCandidateObj as Candidate;
        const currentArchived: ArchivedCandidateRecord[] = JSON.parse(localStorage.getItem('cached_archived_candidates') || '[]');
        const filtered = currentArchived.filter(a => a.id !== candidateId);
        const newArchivedRecord: ArchivedCandidateRecord = {
          id: canObj.id,
          name: canObj.name,
          jobTitle: canObj.jobTitle || 'General Pool',
          phone: canObj.phone,
          email: canObj.email,
          stage: 'Rejected',
          rejectionReason: canObj.rejectionReason || 'Declined',
          archivedAt: new Date().toISOString(),
          archivedBy: canObj.hrName || 'HR Recruiter',
          candidateData: canObj
        };
        const updatedArchived = [newArchivedRecord, ...filtered];
        localStorage.setItem('cached_archived_candidates', JSON.stringify(updatedArchived));

        // Asynchronously push to Google Sheets Archive_Candidates tab
        const token = googleToken || (typeof window !== 'undefined' ? localStorage.getItem('google_access_token') : null);
        const sheetId = spreadsheetId || (typeof window !== 'undefined' ? localStorage.getItem('google_spreadsheet_id') : null);
        if (token && sheetId) {
          let targetArchiveSheetId = sheetId;
          try {
            const s = JSON.parse(localStorage.getItem('payroll_admin_settings') || '{}');
            if (s.useDedicatedArchiveSheet && s.archiveSpreadsheetId) {
              targetArchiveSheetId = s.archiveSpreadsheetId;
            }
          } catch (e) {}
          syncArchivedCandidatesToSheets(targetArchiveSheetId, token, updatedArchived).catch(e => console.warn('Background archive sync:', e));
        }
      } catch (e) {
        console.warn('Error archiving rejected candidate:', e);
      }
    }
  };

  const handleAddFollowUp = (candidateId: string, followUp: CandidateFollowUp) => {
    setCandidates(candidates.map(c => {
      if (c.id === candidateId) {
        const history = c.followUpHistory || [];
        return {
          ...c,
          stage: followUp.stageAtTime || c.stage,
          interviewRound: (followUp.round as any) || c.interviewRound,
          interviewType: followUp.interviewType || c.interviewType,
          interviewerName: followUp.interviewer || c.interviewerName,
          notes: `${c.notes ? c.notes + '\n' : ''}[${followUp.date} - ${followUp.round} (${followUp.interviewType})]: ${followUp.discussionSummary}`,
          followUpHistory: [followUp, ...history]
        };
      }
      return c;
    }));
  };

  const handleRestoreCandidate = (candidateId: string) => {
    const updatedCandidates = candidates.map(c => {
      if (c.id === candidateId) {
        return {
          ...c,
          stage: 'Applied' as const,
          isArchived: false,
          rejectionReason: undefined,
          rejectedDate: undefined,
          notes: `${c.notes ? c.notes + '\n' : ''}[Restored on ${new Date().toISOString().slice(0, 10)}]: Candidate restored to Applied pipeline.`
        };
      }
      return c;
    });

    setCandidates(updatedCandidates);
    localStorage.setItem('payroll_candidates', JSON.stringify(updatedCandidates));

    // Remove from cached_archived_candidates
    try {
      const currentArchived: ArchivedCandidateRecord[] = JSON.parse(localStorage.getItem('cached_archived_candidates') || '[]');
      const updatedArchived = currentArchived.filter(a => a.id !== candidateId);
      localStorage.setItem('cached_archived_candidates', JSON.stringify(updatedArchived));

      const token = googleToken || (typeof window !== 'undefined' ? localStorage.getItem('google_access_token') : null);
      const sheetId = spreadsheetId || (typeof window !== 'undefined' ? localStorage.getItem('google_spreadsheet_id') : null);
      if (token && sheetId) {
        let targetArchiveSheetId = sheetId;
        try {
          const s = JSON.parse(localStorage.getItem('payroll_admin_settings') || '{}');
          if (s.useDedicatedArchiveSheet && s.archiveSpreadsheetId) {
            targetArchiveSheetId = s.archiveSpreadsheetId;
          }
        } catch (e) {}
        syncArchivedCandidatesToSheets(targetArchiveSheetId, token, updatedArchived).catch(e => console.warn('Background restore sync:', e));
      }
    } catch (e) {
      console.warn('Error removing restored candidate from archive cache:', e);
    }
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.employeeId || !newTask.taskName) return;
    const emp = employees.find(e => e.id === newTask.employeeId);
    const task: OnboardingTask = {
      id: `ONT-${String(onboardingTasks.length + 1).padStart(3, '0')}`,
      employeeId: newTask.employeeId || '',
      employeeName: emp ? emp.name : newTask.employeeId || '',
      taskName: newTask.taskName || '',
      category: (newTask.category as any) || 'Documents',
      dueDate: newTask.dueDate || new Date().toISOString().slice(0, 10),
      status: (newTask.status as any) || 'Pending',
      assignedTo: newTask.assignedTo || 'HR Team'
    };
    setOnboardingTasks([task, ...onboardingTasks]);
    setShowTaskModal(false);
  };

  const handleToggleTaskStatus = (taskId: string) => {
    setOnboardingTasks(onboardingTasks.map(t => {
      if (t.id === taskId) {
        const nextStatus = t.status === 'Completed' ? 'Pending' : t.status === 'Pending' ? 'In Progress' : 'Completed';
        return {
          ...t,
          status: nextStatus,
          completedDate: nextStatus === 'Completed' ? new Date().toISOString().slice(0, 10) : undefined
        };
      }
      return t;
    }));
  };

  const handleCreateOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOffer.candidateName || !newOffer.offeredCtc) return;
    const offer: OfferLetter = {
      id: `OFF-${String(offerLetters.length + 1).padStart(3, '0')}`,
      candidateName: newOffer.candidateName || '',
      email: newOffer.email || '',
      phone: newOffer.phone || '',
      department: newOffer.department || 'Sales',
      designation: newOffer.designation || 'Executive',
      offeredCtc: Number(newOffer.offeredCtc) || 240000,
      joiningDate: newOffer.joiningDate || new Date().toISOString().slice(0, 10),
      status: (newOffer.status as any) || 'Draft',
      issuedDate: newOffer.issuedDate || new Date().toISOString().slice(0, 10),
      termsNotes: newOffer.termsNotes || ''
    };
    setOfferLetters([offer, ...offerLetters]);
    setShowOfferModal(false);
  };

  const filteredJobs = jobs.filter(j => 
    j.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    j.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCandidates = candidates.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  const filteredTasks = onboardingTasks.filter(t => 
    t.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.taskName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6 w-full text-slate-800">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#022c22] via-[#064e3b] to-[#0f172a] border border-emerald-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/20 border border-emerald-400/30 rounded-2xl text-emerald-300">
                <UserPlus className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-wide">
                  {'Hiring & Onboarding'}
                </h1>
                <p className="text-xs text-emerald-100/80 font-medium mt-0.5">
                  {'Recruitment pipeline, candidate tracking, job openings & new joinee onboarding'}
                </p>
              </div>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex bg-slate-950/60 backdrop-blur-md p-1.5 rounded-2xl border border-emerald-400/30">
            <button
              onClick={() => setActiveTab('recruitment')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'recruitment'
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              {'Recruitment'}
            </button>
            <button
              onClick={() => setActiveTab('onboarding')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'onboarding'
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <FileText className="w-4 h-4" />
              {'Onboarding'}
            </button>
          </div>
        </div>
      </div>

      {/* RECRUITMENT TAB */}
      {activeTab === 'recruitment' && (
        <div className="space-y-6">
          {/* Sub-tabs & Quick Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 border border-slate-200 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRecruitmentSubTab('jobs')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  recruitmentSubTab === 'jobs'
                    ? 'bg-[#004d3d] text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {'Job Openings'} ({jobs.length})
              </button>
              <button
                onClick={() => setRecruitmentSubTab('candidates')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  recruitmentSubTab === 'candidates'
                    ? 'bg-[#004d3d] text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {'Candidate Pipeline'} ({candidates.length})
              </button>
              <button
                onClick={() => setRecruitmentSubTab('scorecard')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  recruitmentSubTab === 'scorecard'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                {'SLA Delay Scorecard'}
              </button>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {recruitmentSubTab === 'candidates' && (
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder={'Search candidates...'}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white" />
                </div>
              )}
            </div>
          </div>

          {/* Job Openings View with Scoreboard Chart & Detailed Cards */}
          {recruitmentSubTab === 'jobs' && (
            <JobOpeningsModule
              jobs={jobs}
              candidates={candidates}
              adminSettings={adminSettings}
              employees={employees}
              onAddJob={(newJobData) => {
                const job: JobPosting = {
                  id: `JOB-${String(jobs.length + 1).padStart(3, '0')}`,
                  title: newJobData.title || '',
                  department: newJobData.department || 'Sales',
                  location: newJobData.location || 'Raipur HQ',
                  type: (newJobData.type as any) || 'Full-time',
                  openings: Number(newJobData.openings) || 1,
                  status: (newJobData.status as any) || 'Open',
                  postedDate: newJobData.postedDate || new Date().toISOString().slice(0, 10),
                  description: newJobData.description || '',
                  requirements: newJobData.requirements || '',
                  targetCtcMin: Number(newJobData.targetCtcMin) || 20000,
                  targetCtcMax: Number(newJobData.targetCtcMax) || 35000,
                  hiringManager: newJobData.hiringManager || 'HR Team',
                  urgency: (newJobData.urgency as any) || 'Medium',
                  directorName: newJobData.directorName || '',
                  targetDate: newJobData.targetDate || ''
                };
                setJobs([job, ...jobs]);
              }}
              onUpdateJob={(id, updated) => {
                setJobs(jobs.map(j => j.id === id ? { ...j, ...updated } : j));
              }}
              onDeleteJob={(id) => {
                setJobs(jobs.filter(j => j.id !== id));
              }}
              onFilterPipelineByJob={(jobId) => {
                setRecruitmentSubTab('candidates');
              }}
              onUpdateCandidateStage={handleUpdateCandidateStage}
              language={language} />
          )}

          {/* Candidate Pipeline Kanban View */}
          {recruitmentSubTab === 'candidates' && (
            <RecruitmentKanbanBoard
              candidates={candidates}
              jobPostings={jobs}
              onUpdateStage={handleUpdateCandidateStage}
              onAddFollowUp={handleAddFollowUp}
              onRestoreCandidate={handleRestoreCandidate}
              spreadsheetId={spreadsheetId}
              googleToken={googleToken}
              onAddCandidate={(newCand) => {
                const candidate: Candidate = {
                  id: `CAN-${String(candidates.length + 1).padStart(3, '0')}`,
                  jobId: newCand.jobId,
                  jobTitle: newCand.jobTitle || 'General Position',
                  name: newCand.name || '',
                  email: newCand.email || '',
                  phone: newCand.phone || '',
                  experienceYears: Number(newCand.experienceYears) || 0,
                  stage: newCand.stage || 'Applied',
                  appliedDate: newCand.appliedDate || new Date().toISOString().slice(0, 10),
                  interviewDate: newCand.interviewDate,
                  notes: newCand.notes || '',
                  expectedSalary: Number(newCand.expectedSalary) || 0
                };
                setCandidates([candidate, ...candidates]);
              }}
              onScheduleInterview={(candidateId, date) => {
                setCandidates(candidates.map(c => c.id === candidateId ? { ...c, interviewDate: date } : c));
              }}
              language={language} />
          )}

          {/* Hiring & Onboarding SLA Delay Scorecard */}
          {recruitmentSubTab === 'scorecard' && (
            <HiringScorecard
              candidates={candidates}
              jobPostings={jobs}
              onboardingTasks={onboardingTasks}
              onUpdateStage={handleUpdateCandidateStage}
              onScheduleInterview={(candidateId, date) => {
                setCandidates(candidates.map(c => c.id === candidateId ? { ...c, interviewDate: date } : c));
              }}
              language={language} />
          )}
        </div>
      )}

      {/* ONBOARDING TAB */}
      {activeTab === 'onboarding' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 border border-slate-200 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setOnboardingSubTab('tasks')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  onboardingSubTab === 'tasks'
                    ? 'bg-[#004d3d] text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {'Onboarding Tasks'} ({onboardingTasks.length})
              </button>
              <button
                onClick={() => setOnboardingSubTab('offers')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  onboardingSubTab === 'offers'
                    ? 'bg-[#004d3d] text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {'Offer Letters'} ({offerLetters.length})
              </button>
            </div>

            <div className="flex items-center gap-3">
              {onboardingSubTab === 'tasks' ? (
                <button
                  onClick={() => setShowTaskModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#004d3d] hover:bg-[#064e3b] text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  {'Add Onboarding Task'}
                </button>
              ) : (
                <button
                  onClick={() => setShowOfferModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#004d3d] hover:bg-[#064e3b] text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  {'Generate Offer Letter'}
                </button>
              )}
            </div>
          </div>

          {/* Tasks Table */}
          {onboardingSubTab === 'tasks' && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Employee</th>
                      <th className="p-3.5">Task Description</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5">Assigned To</th>
                      <th className="p-3.5">Due Date</th>
                      <th className="p-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTasks.map(task => (
                      <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5">
                          <button
                            onClick={() => handleToggleTaskStatus(task.id)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                              task.status === 'Completed'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : task.status === 'In Progress'
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {task.status === 'Completed' && <CheckCircle2 className="w-3 h-3" />}
                            {task.status}
                          </button>
                        </td>
                        <td className="p-3.5 font-bold text-slate-900">
                          {task.employeeName}
                          <span className="block text-[10px] font-mono text-slate-500">{task.employeeId}</span>
                        </td>
                        <td className="p-3.5 font-medium text-slate-800">{task.taskName}</td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-medium text-slate-700">
                            {task.category}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-600">{task.assignedTo || 'Unassigned'}</td>
                        <td className="p-3.5 font-mono text-slate-600">{task.dueDate}</td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => handleToggleTaskStatus(task.id)}
                            className="text-xs text-emerald-700 hover:text-emerald-800 hover:underline font-bold"
                          >
                            Toggle Status
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Offer Letters View */}
          {onboardingSubTab === 'offers' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {offerLetters.map(offer => (
                <div key={offer.id} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm hover:border-emerald-500/40 transition-all">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                        {offer.id}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-1">{offer.candidateName}</h3>
                      <p className="text-xs text-slate-500">{offer.designation} ({offer.department})</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {offer.status}
                    </span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Offered Annual CTC:</span>
                      <span className="font-bold text-emerald-800">₹{(offer.offeredCtc).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Expected Joining:</span>
                      <span className="font-mono text-slate-900 font-bold">{offer.joiningDate}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => setPrintOffer(offer)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all border border-slate-200"
                    >
                      <Printer className="w-3.5 h-3.5 text-emerald-700" />
                      ViewPrint Letter
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CREATE JOB MODAL */}
      {showJobModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Create New Job Opening</h3>
              <button onClick={() => setShowJobModal(false)}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
            </div>
            <form onSubmit={handleCreateJob} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-600 font-medium block mb-1">Job Title</label>
                <input
                  type="text"
                  required
                  value={newJob.title}
                  onChange={e => setNewJob({ ...newJob, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 font-medium block mb-1">Department</label>
                  <input
                    type="text"
                    value={newJob.department}
                    onChange={e => setNewJob({ ...newJob, department: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none" />
                </div>
                <div>
                  <label className="text-slate-600 font-medium block mb-1">Openings</label>
                  <input
                    type="number"
                    value={newJob.openings}
                    onChange={e => setNewJob({ ...newJob, openings: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="text-slate-600 font-medium block mb-1">Job Description</label>
                <textarea
                  rows={3}
                  value={newJob.description}
                  onChange={e => setNewJob({ ...newJob, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none" />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-[#004d3d] hover:bg-[#064e3b] text-white font-bold rounded-xl shadow-md transition-all"
              >
                Save Job Opening
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CREATE CANDIDATE MODAL */}
      {showCandidateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-slate-900 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Add Candidate Application</h3>
              <button onClick={() => setShowCandidateModal(false)}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
            </div>
            <form onSubmit={handleCreateCandidate} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-600 font-medium block mb-1">Select Job</label>
                <select
                  value={newCandidate.jobId}
                  onChange={e => setNewCandidate({ ...newCandidate, jobId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                >
                  <option value="">General Application</option>
                  {jobs.map(j => <option key={j.id} value={j.id}>{j.title} ({j.department})</option>)}
                </select>
              </div>
              <div>
                <label className="text-slate-600 font-medium block mb-1">Candidate Full Name</label>
                <input
                  type="text"
                  required
                  value={newCandidate.name}
                  onChange={e => setNewCandidate({ ...newCandidate, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 font-medium block mb-1">Phone *</label>
                  <input
                    type="text"
                    required
                    value={newCandidate.phone}
                    onChange={e => setNewCandidate({ ...newCandidate, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none" />
                </div>
                <div>
                  <label className="text-slate-600 font-medium block mb-1">Email</label>
                  <input
                    type="email"
                    value={newCandidate.email || ''}
                    onChange={e => setNewCandidate({ ...newCandidate, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 font-medium block mb-1">Gender</label>
                  <select
                    value={newCandidate.gender || 'Male'}
                    onChange={e => setNewCandidate({ ...newCandidate, gender: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-600 font-medium block mb-1">Highest Education</label>
                  <input
                    type="text"
                    placeholder="e.g. B.TechMBAGraduate"
                    value={newCandidate.highestEducation || ''}
                    onChange={e => setNewCandidate({ ...newCandidate, highestEducation: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 font-medium block mb-1">HR Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Priya Sharma"
                    value={newCandidate.hrName || ''}
                    onChange={e => setNewCandidate({ ...newCandidate, hrName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none" />
                </div>
                <div>
                  <label className="text-slate-600 font-medium block mb-1">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Raipur HQ"
                    value={newCandidate.location || ''}
                    onChange={e => setNewCandidate({ ...newCandidate, location: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 font-medium block mb-1">Source</label>
                  <input
                    type="text"
                    placeholder="e.g. NaukriReferral"
                    value={newCandidate.source || ''}
                    onChange={e => setNewCandidate({ ...newCandidate, source: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none" />
                </div>
                <div>
                  <label className="text-slate-600 font-medium block mb-1">Exp (Years)</label>
                  <input
                    type="number"
                    value={newCandidate.experienceYears}
                    onChange={e => setNewCandidate({ ...newCandidate, experienceYears: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="text-slate-600 font-medium block mb-1">Resume Link (URL)</label>
                <input
                  type="text"
                  placeholder="https://drive.google.com/..."
                  value={newCandidate.resumeUrl || ''}
                  onChange={e => setNewCandidate({ ...newCandidate, resumeUrl: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none" />
              </div>

              <div>
                <label className="text-slate-600 font-medium block mb-1">Notes - Remark</label>
                <textarea
                  rows={2}
                  placeholder="Remarks..."
                  value={newCandidate.notes || ''}
                  onChange={e => setNewCandidate({ ...newCandidate, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none" />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#004d3d] hover:bg-[#064e3b] text-white font-bold rounded-xl shadow-md transition-all"
              >
                Add Candidate
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CREATE OFFER MODAL */}
      {showOfferModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Generate Offer Letter</h3>
              <button onClick={() => setShowOfferModal(false)}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
            </div>
            <form onSubmit={handleCreateOffer} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-600 font-medium block mb-1">Candidate Name</label>
                <input
                  type="text"
                  required
                  value={newOffer.candidateName}
                  onChange={e => setNewOffer({ ...newOffer, candidateName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 font-medium block mb-1">Department</label>
                  <input
                    type="text"
                    value={newOffer.department}
                    onChange={e => setNewOffer({ ...newOffer, department: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none" />
                </div>
                <div>
                  <label className="text-slate-600 font-medium block mb-1">Designation</label>
                  <input
                    type="text"
                    value={newOffer.designation}
                    onChange={e => setNewOffer({ ...newOffer, designation: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 font-medium block mb-1">Annual CTC (₹)</label>
                  <input
                    type="number"
                    value={newOffer.offeredCtc}
                    onChange={e => setNewOffer({ ...newOffer, offeredCtc: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none" />
                </div>
                <div>
                  <label className="text-slate-600 font-medium block mb-1">Joining Date</label>
                  <input
                    type="date"
                    value={newOffer.joiningDate}
                    onChange={e => setNewOffer({ ...newOffer, joiningDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none" />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-[#004d3d] hover:bg-[#064e3b] text-white font-bold rounded-xl shadow-md transition-all"
              >
                Create Offer Letter
              </button>
            </form>
          </div>
        </div>
      )}

      {/* PRINT OFFER LETTER MODAL */}
      {printOffer && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-2xl max-w-2xl w-full p-8 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setPrintOffer(null)}
              className="absolute right-4 top-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center border-b pb-4">
              <h2 className="text-xl font-bold uppercase tracking-wide text-emerald-950">OFFER LETTER</h2>
              <p className="text-xs text-slate-500">Confidential Employment Offer</p>
            </div>

            <div className="space-y-4 text-xs leading-relaxed">
              <p className="font-bold">Date: {printOffer.issuedDate}</p>
              <p>Dear <strong>{printOffer.candidateName}</strong>,</p>
              <p>
                We are pleased to offer you the position of <strong>{printOffer.designation}</strong> in the <strong>{printOffer.department}</strong> department.
              </p>
              <div className="bg-slate-50 p-4 rounded-xl border space-y-1">
                <p>• <strong>Offered Annual CTC:</strong> ₹{printOffer.offeredCtc.toLocaleString('en-IN')}</p>
                <p>• <strong>Expected Joining Date:</strong> {printOffer.joiningDate}</p>
              </div>
              <p>
                Please sign and return a copy of this offer letter as your acceptance of these terms. We look forward to welcoming you to our team!
              </p>
            </div>

            <div className="pt-8 border-t flex justify-between items-end text-xs font-bold text-slate-700">
              <div>Authorized Signatory<br /><span className="text-[10px] text-slate-400">HR Department</span></div>
              <div>Candidate Signature<br /><span className="text-[10px] text-slate-400">{printOffer.candidateName}</span></div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2"
              >
                <Printer className="w-4 h-4" /> Print Offer Letter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
