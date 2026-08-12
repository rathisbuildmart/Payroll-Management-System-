import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  Users, 
  Briefcase, 
  Calendar, 
  ArrowRight, 
  ChevronRight, 
  Filter, 
  Search, 
  Award, 
  FileText, 
  ShieldAlert,
  Send,
  UserCheck,
  RefreshCw
} from 'lucide-react';
import { Candidate, JobPosting, OnboardingTask } from '../types';

interface HiringScorecardProps {
  candidates: Candidate[];
  jobPostings: JobPosting[];
  onboardingTasks?: OnboardingTask[];
  onUpdateStage: (candidateId: string, newStage: Candidate['stage']) => void;
  onScheduleInterview?: (candidateId: string, date: string) => void;
  language?: 'en' | 'hi';
}

export default function HiringScorecard({
  candidates,
  jobPostings,
  onboardingTasks = [],
  onUpdateStage,
  onScheduleInterview,
  language = 'en'
}: HiringScorecardProps) {
  const [delayFilter, setDelayFilter] = useState<'ALL' | 'CRITICAL' | 'MODERATE' | 'ON_TRACK'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('ALL');

  //Helper to calculate days spent in pipeline since appliedDate
  const getDaysInPipeline = (appliedDateStr: string): number => {
    if (!appliedDateStr) return 1;
    let applied = new Date(appliedDateStr);
    
    //Fallback for DD/MM/YYYY or DD-MM-YYYY format
    if (isNaN(applied.getTime())) {
      const parts = appliedDateStr.split(/[-/]/);
      if (parts.length === 3) {
        if (parts[2].length === 4) {
          applied = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        } else if (parts[0].length === 4) {
          applied = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        }
      }
    }

    if (isNaN(applied.getTime())) return 1;

    const today = new Date();
    //Clear time portion for clean date-only comparison
    today.setHours(0, 0, 0, 0);
    const appliedClean = new Date(applied);
    appliedClean.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - appliedClean.getTime();
    if (diffTime <= 0) return 1; //Applied today or future date
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1;
  };

  //Helper to categorize delay severity
  const getDelaySeverity = (candidate: Candidate): {
    status: 'CRITICAL' | 'MODERATE' | 'ON_TRACK';
    label: string;
    labelHi: string;
    color: string;
    bg: string;
    border: string;
    badge: string;
    reason: string;
    reasonHi: string;
  } => {
    const days = getDaysInPipeline(candidate.appliedDate);

    //If already hired or rejected
    if (candidate.stage === 'Hired') {
      return {
        status: 'ON_TRACK',
        label: 'Completed/Hired',
        labelHi: "",
        color: 'text-emerald-800',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
        reason: 'Successfully onboarded',
        reasonHi: ""
      };
    }
    if (candidate.stage === 'Rejected') {
      return {
        status: 'ON_TRACK',
        label: 'Closed',
        labelHi: "",
        color: 'text-slate-600',
        bg: 'bg-slate-50',
        border: 'border-slate-200',
        badge: 'bg-slate-100 text-slate-700 border-slate-300 font-medium',
        reason: 'Application closed',
        reasonHi: ""
      };
    }

    //Check for specific bottleneck conditions
    if ((candidate.stage === 'Interview' || candidate.stage === 'HR Interview' || candidate.stage === 'Director Interview') && candidate.interviewDate) {
      const intDate = new Date(candidate.interviewDate);
      const today = new Date();
      if (intDate < today) {
        return {
          status: 'CRITICAL',
          label: 'Interview Feedback Overdue',
          labelHi: "",
          color: 'text-rose-800',
          bg: 'bg-rose-50',
          border: 'border-rose-200',
          badge: 'bg-rose-100 text-rose-800 border-rose-300 font-bold',
          reason: `Interview was on ${candidate.interviewDate}. Feedback or stage movement required.`,
          reasonHi: ""
        };
      }
    }

    if (days >= 10) {
      return {
        status: 'CRITICAL',
        label: 'Critical Delay',
        labelHi: "",
        color: 'text-rose-800',
        bg: 'bg-rose-50',
        border: 'border-rose-200',
        badge: 'bg-rose-100 text-rose-800 border-rose-300 font-bold',
        reason: `Pending in '${candidate.stage}' for over 10 days without resolution.`,
        reasonHi: ""
      };
    }

    if (days >= 5) {
      return {
        status: 'MODERATE',
        label: 'Moderate Delay',
        labelHi: "",
        color: 'text-amber-800',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        badge: 'bg-amber-100 text-amber-800 border-amber-300 font-bold',
        reason: `In '${candidate.stage}' stage for ${days} days. Nudge recommended.`,
        reasonHi: ""
      };
    }

    return {
      status: 'ON_TRACK',
      label: 'On Track',
      labelHi: "",
      color: 'text-blue-800',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      badge: 'bg-blue-100 text-blue-800 border-blue-300 font-bold',
      reason: 'SLA within normal timeline (0-4 days)',
      reasonHi: ""
    };
  };

  //Compute Analytics
  const activeCandidates = candidates.filter(c => c.stage !== 'Rejected');
  const criticalDelayed = activeCandidates.filter(c => getDelaySeverity(c).status === 'CRITICAL');
  const moderateDelayed = activeCandidates.filter(c => getDelaySeverity(c).status === 'MODERATE');
  const onTrackCount = activeCandidates.filter(c => getDelaySeverity(c).status === 'ON_TRACK');

  //Avg Days in Pipeline calculation
  const totalPipelineDays = activeCandidates.reduce((acc, c) => acc + getDaysInPipeline(c.appliedDate), 0);
  const avgPipelineDays = activeCandidates.length > 0 ? (totalPipelineDays / activeCandidates.length).toFixed(1) : '0';

  //Bottleneck Stage Identification
  const stageCounts: Record<string, number> = {
    Applied: 0,
    Screening: 0,
    Interview: 0,
    Offered: 0
  };
  activeCandidates.forEach(c => {
    if (stageCounts[c.stage] !== undefined) {
      stageCounts[c.stage] += 1;
    }
  });

  const topBottleneckStage = Object.entries(stageCounts).sort((a, b) => b[1] - a[1])[0] || ['Screening', 0];

  //Filter list for table
  const filteredCandidateList = candidates.filter(c => {
    const severity = getDelaySeverity(c);
    const matchesDelay = 
      delayFilter === 'ALL' ||
      (delayFilter === 'CRITICAL' && severity.status === 'CRITICAL') ||
      (delayFilter === 'MODERATE' && severity.status === 'MODERATE') ||
      (delayFilter === 'ON_TRACK' && severity.status === 'ON_TRACK');

    const matchesStage = selectedStageFilter === 'ALL' || c.stage === selectedStageFilter;
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm) || (c.jobTitle && c.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesDelay && matchesStage && matchesSearch;
  });

  return (
    <div className="space-y-6 text-slate-800">
      {/* SCORECARD SUMMARY METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Critical Delays Card */}
        <div className="bg-white border border-rose-200 rounded-2xl p-5 space-y-3 relative overflow-hidden shadow-sm hover:border-rose-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">
              {'Critical SLA Delays (>10 Days)'}
            </span>
            <div className="p-2 bg-rose-50 rounded-xl border border-rose-200">
              <ShieldAlert className="w-5 h-5 text-rose-700" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900">{criticalDelayed.length}</span>
            <span className="text-xs font-bold text-rose-700">
              {((criticalDelayed.length / (activeCandidates.length || 1)) * 100).toFixed(0)}% of pipeline
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            {'Candidates stagnant & requiring immediate action'}
          </p>
        </div>

        {/* Moderate Delays Card */}
        <div className="bg-white border border-amber-200 rounded-2xl p-5 space-y-3 relative overflow-hidden shadow-sm hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
              {'Moderate Delays (5-9 Days)'}
            </span>
            <div className="p-2 bg-amber-50 rounded-xl border border-amber-200">
              <Clock className="w-5 h-5 text-amber-700" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900">{moderateDelayed.length}</span>
            <span className="text-xs font-bold text-amber-700">Needs Follow-up</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            {'SLA threshold approaching'}
          </p>
        </div>

        {/* Average Time in Pipeline */}
        <div className="bg-white border border-emerald-200 rounded-2xl p-5 space-y-3 relative overflow-hidden shadow-sm hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              {'Avg Time to Process'}
            </span>
            <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-200">
              <TrendingUp className="w-5 h-5 text-emerald-700" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900">{avgPipelineDays} <span className="text-sm font-normal text-slate-500">Days</span></span>
            <span className="text-xs font-bold text-emerald-800">Target ≤ 7 Days</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            {'Average candidate stage velocity'}
          </p>
        </div>

        {/* Bottleneck Stage Identified */}
        <div className="bg-white border border-indigo-200 rounded-2xl p-5 space-y-3 relative overflow-hidden shadow-sm hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider">
              {'Pipeline Bottleneck'}
            </span>
            <div className="p-2 bg-indigo-50 rounded-xl border border-indigo-200">
              <AlertTriangle className="w-5 h-5 text-indigo-700" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 truncate">{topBottleneckStage[0]}</span>
            <span className="text-xs font-bold text-indigo-800 px-2.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-200">
              {topBottleneckStage[1]} Candidates
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            {'Stage with highest candidate congestion'}
          </p>
        </div>
      </div>

      {/* DELAY ANALYSIS & ACTION CONTROL PANEL */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-5 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
              {'Candidate SLA Delay Scorecard & Action Tracker'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {'Detailed breakdown of candidates by delay severity, bottleneck reasons & quick advancement controls.'}
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setDelayFilter('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                delayFilter === 'ALL'
                  ? 'bg-[#004d3d] text-white shadow-sm'
                  : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {'All Candidates'} ({candidates.length})
            </button>
            <button
              onClick={() => setDelayFilter('CRITICAL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                delayFilter === 'CRITICAL'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              {'Critical Delays'} ({criticalDelayed.length})
            </button>
            <button
              onClick={() => setDelayFilter('MODERATE')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                delayFilter === 'MODERATE'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              {'Moderate'} ({moderateDelayed.length})
            </button>
            <button
              onClick={() => setDelayFilter('ON_TRACK')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                delayFilter === 'ON_TRACK'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100'
              }`}
            >
              {'On Track'} ({onTrackCount.length})
            </button>
          </div>
        </div>

        {/* Search & Stage Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder={'Search candidate name or phone...'}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600" />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedStageFilter}
              onChange={e => setSelectedStageFilter(e.target.value)}
              className="bg-white border border-slate-300 text-xs text-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-600 w-full sm:w-auto font-medium"
            >
              <option value="ALL">{'All Stages'}</option>
              <option value="Applied">Applied</option>
              <option value="Screening">Screening</option>
              <option value="Interview">Interview</option>
              <option value="Offered">Offered</option>
              <option value="Hired">SelectedHired</option>
            </select>
          </div>
        </div>

        {/* CANDIDATE DELAY SCORECARD TABLE */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3.5">Candidate Details</th>
                <th className="p-3.5">Applied Role</th>
                <th className="p-3.5">Current Stage</th>
                <th className="p-3.5">Days in Pipeline</th>
                <th className="p-3.5">SLA Delay AnalysisReason</th>
                <th className="p-3.5 text-right">ActionBump Stage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredCandidateList.map(can => {
                const days = getDaysInPipeline(can.appliedDate);
                const severity = getDelaySeverity(can);

                return (
                  <tr key={can.id} className="hover:bg-slate-50 transition-colors">
                    {/* Candidate */}
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900 text-sm">{can.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {can.phone} • {can.email || 'No Email'}
                      </div>
                    </td>

                    {/* Job */}
                    <td className="p-3.5">
                      <span className="font-semibold text-emerald-800">{can.jobTitle || 'General Pool'}</span>
                      <span className="text-[10px] text-slate-500 block">{can.experienceYears} Yrs Exp</span>
                    </td>

                    {/* Stage */}
                    <td className="p-3.5">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 border border-slate-300 text-slate-800">
                        {can.stage}
                      </span>
                    </td>

                    {/* Days */}
                    <td className="p-3.5 font-mono font-bold text-slate-900">
                      <span className="text-sm">{days}</span> <span className="text-[10px] text-slate-500 font-sans font-normal">Days</span>
                    </td>

                    {/* Delay Analysis & Reason */}
                    <td className="p-3.5">
                      <div className="space-y-1">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${severity.badge}`}>
                          {severity.status === 'CRITICAL' && <AlertTriangle className="w-3 h-3" />}
                          {severity.status === 'MODERATE' && <Clock className="w-3 h-3" />}
                          {severity.status === 'ON_TRACK' && <CheckCircle2 className="w-3 h-3" />}
                          <span>{language === 'en' ? severity.label : severity.labelHi}</span>
                        </span>
                        <p className="text-[11px] text-slate-700 font-medium leading-tight">
                          {language === 'en' ? severity.reason : severity.reasonHi}
                        </p>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {can.stage === 'Applied' && (
                          <button
                            onClick={() => onUpdateStage(can.id, 'Screening')}
                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-800 hover:text-white rounded-xl text-[10px] font-bold border border-indigo-200 transition-all shadow-2xs"
                          >
                            Move to Screening
                          </button>
                        )}
                        {can.stage === 'Screening' && (
                          <button
                            onClick={() => onUpdateStage(can.id, 'HR Interview')}
                            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-600 text-amber-800 hover:text-white rounded-xl text-[10px] font-bold border border-amber-200 transition-all shadow-2xs"
                          >
                            Move to HR Interview
                          </button>
                        )}
                        {(can.stage === 'HR Interview' || can.stage === 'Interview') && (
                          <button
                            onClick={() => onUpdateStage(can.id, 'Director Interview')}
                            className="px-3 py-1.5 bg-purple-50 hover:bg-purple-600 text-purple-800 hover:text-white rounded-xl text-[10px] font-bold border border-purple-200 transition-all shadow-2xs"
                          >
                            Move to Director Round
                          </button>
                        )}
                        {can.stage === 'Director Interview' && (
                          <button
                            onClick={() => onUpdateStage(can.id, 'Offered')}
                            className="px-3 py-1.5 bg-cyan-50 hover:bg-cyan-600 text-cyan-800 hover:text-white rounded-xl text-[10px] font-bold border border-cyan-200 transition-all shadow-2xs"
                          >
                            Release Offer
                          </button>
                        )}
                        {can.stage === 'Offered' && (
                          <button
                            onClick={() => onUpdateStage(can.id, 'Hired')}
                            className="px-3 py-1.5 bg-[#004d3d] hover:bg-[#064e3b] text-white rounded-xl text-[10px] font-bold transition-all shadow-sm"
                          >
                            Confirm Joining (Hired)
                          </button>
                        )}
                        {can.stage !== 'Hired' && can.stage !== 'Rejected' && (
                          <button
                            onClick={() => onUpdateStage(can.id, 'Rejected')}
                            className="p-1.5 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white rounded-xl border border-rose-200 transition-all"
                            title="Reject Candidate"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredCandidateList.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No candidate records found matching selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
