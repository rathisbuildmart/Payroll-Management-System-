import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Calendar, 
  Phone, 
  Mail, 
  Briefcase, 
  DollarSign, 
  FileText, 
  ChevronRight, 
  ChevronLeft, 
  MoreVertical, 
  X, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Star,
  UserPlus,
  ArrowRight,
  Filter,
  Eye,
  MessageSquare,
  Sparkles,
  Send,
  Building,
  RotateCcw,
  FileSpreadsheet,
  Check,
  History,
  PhoneCall,
  UserCheck,
  Download
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { Candidate, JobPosting, AdminSettings, CandidateFollowUp, ArchivedCandidateRecord } from '../types';
import { WhatsAppModal } from './WhatsAppModal';
import { syncRecruitmentToSheets, syncArchivedCandidatesToSheets } from '../services/sheets';

interface RecruitmentKanbanBoardProps {
  candidates: Candidate[];
  jobPostings: JobPosting[];
  onUpdateStage: (candidateId: string, newStage: Candidate['stage'], newNotes?: string) => void;
  onAddCandidate: (candidate: Partial<Candidate>) => void;
  onScheduleInterview?: (candidateId: string, date: string) => void;
  onAddFollowUp?: (candidateId: string, followUp: CandidateFollowUp) => void;
  onRestoreCandidate?: (candidateId: string) => void;
  spreadsheetId?: string | null;
  googleToken?: string | null;
  language?: 'en' | 'hi';
}

const STAGES: { key: Candidate['stage']; label: string; labelHi: string; color: string; dot: string; badge: string }[] = [
  { key: 'Applied', label: 'Applied', labelHi: 'Applied', color: 'text-blue-600', dot: 'bg-blue-500', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  { key: 'Screening', label: 'Screening', labelHi: 'Screening', color: 'text-indigo-600', dot: 'bg-indigo-500', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { key: 'HR Interview', label: 'HR Interview', labelHi: 'HR Interview', color: 'text-amber-600', dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  { key: 'Director Interview', label: 'Director Interview', labelHi: 'Director Interview', color: 'text-purple-600', dot: 'bg-purple-500', badge: 'bg-purple-50 text-purple-700 border-purple-200' },
  { key: 'Offered', label: 'Offered', labelHi: 'Offered', color: 'text-cyan-600', dot: 'bg-cyan-500', badge: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  { key: 'Hired', label: 'SelectedHired', labelHi: 'SelectedHired', color: 'text-emerald-600', dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
];

export default function RecruitmentKanbanBoard({
  candidates,
  jobPostings,
  onUpdateStage,
  onAddCandidate,
  onScheduleInterview,
  onAddFollowUp,
  onRestoreCandidate,
  spreadsheetId,
  googleToken,
  language = 'en'
}: RecruitmentKanbanBoardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJobId, setSelectedJobId] = useState<string>('ALL');
  const [draggedCandidateId, setDraggedCandidateId] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRejectedArchiveModal, setShowRejectedArchiveModal] = useState(false);
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);

  //Follow-Up Form State (inside Drawer)
  const [followUpRound, setFollowUpRound] = useState<string>('First Round');
  const [followUpType, setFollowUpType] = useState<'Telephonic' | 'Physical' | 'Online'>('Telephonic');
  const [followUpInterviewer, setFollowUpInterviewer] = useState<string>('');
  const [followUpSummary, setFollowUpSummary] = useState<string>('');
  const [followUpStageUpdate, setFollowUpStageUpdate] = useState<Candidate['stage'] | ''>('');
  const [followUpNextDate, setFollowUpNextDate] = useState<string>('');

  //Rejection Reason Modal state
  const [rejectModalCandidate, setRejectModalCandidate] = useState<Candidate | null>(null);
  const [rejectionPreset, setRejectionPreset] = useState<string>('Offer Declined by candidate - reason for refusal');
  const [rejectionNotes, setRejectionNotes] = useState<string>('Offer Declined by candidate - reason for refusal');

  //Auto WhatsApp & Email Notifications Toggle State
  const [autoNotifyEnabled, setAutoNotifyEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('recruitment_auto_notify_enabled');
    return saved !== null ? saved === 'true' : true;
  });

  //Schedule Interview Modal State
  const [scheduleModalCandidate, setScheduleModalCandidate] = useState<Candidate | null>(null);
  const [targetInterviewStage, setTargetInterviewStage] = useState<Candidate['stage']>('HR Interview');
  const [interviewDateInput, setInterviewDateInput] = useState<string>('');
  const [interviewTimeInput, setInterviewTimeInput] = useState<string>('11:00');
  const [interviewRoundInput, setInterviewRoundInput] = useState<string>('First Round');
  const [interviewTypeInput, setInterviewTypeInput] = useState<'Telephonic' | 'Physical' | 'Online'>('Telephonic');
  const [interviewerNameInput, setInterviewerNameInput] = useState<string>('');
  const [interviewVenueInput, setInterviewVenueInput] = useState<string>('Rathi Buildmart HQ, Raipur');
  const [interviewNotesInput, setInterviewNotesInput] = useState<string>('');

  //WhatsApp Dispatch Modal State
  const [whatsappModalRecipient, setWhatsappModalRecipient] = useState<{
    isOpen: boolean;
    candidate: Candidate | null;
    title: string;
    category: 'customNotice' | 'payslip';
    message: string;
  }>({
    isOpen: false,
    candidate: null,
    title: 'Send HR WhatsApp & Email',
    category: 'customNotice',
    message: ''
  });

  const getAdminSettings = (): AdminSettings => {
    try {
      const saved = localStorage.getItem('payroll_admin_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return ({
      companyName: 'Rathi Buildmart',
      companyAddress: 'Raipur, Chhattisgarh',
      currency: '₹',
      language: 'en'
    } as unknown) as AdminSettings;
  };

  const handleManualSyncToSheets = async () => {
    const tokenToUse = googleToken || localStorage.getItem('google_access_token');
    const sheetIdToUse = spreadsheetId || localStorage.getItem('google_spreadsheet_id');

    if (!sheetIdToUse || !tokenToUse) {
      alert('Google Sheets is not connected. Please connect your Google Account in Settings to sync recruitment & archive data.');
      return;
    }

    setIsSyncingSheets(true);
    try {
      // 1. Sync Recruitment tables (Job_Openings, Active_Candidates, Candidate_FollowUps, Rejected_Candidates)
      const result = await syncRecruitmentToSheets(sheetIdToUse, tokenToUse, jobPostings, candidates);

      // 2. Sync Rejected candidates to dedicated Archive_Candidates sheet
      const rejectedList = candidates.filter(c => c.stage === 'Rejected' || c.isArchived);
      let targetArchiveSheetId = sheetIdToUse;
      try {
        const savedSettings = JSON.parse(localStorage.getItem('payroll_admin_settings') || '{}');
        if (savedSettings.useDedicatedArchiveSheet && savedSettings.archiveSpreadsheetId) {
          targetArchiveSheetId = savedSettings.archiveSpreadsheetId;
        }
      } catch (e) {}

      const archivedRecords: ArchivedCandidateRecord[] = rejectedList.map(can => ({
        id: can.id,
        name: can.name,
        jobTitle: can.jobTitle || 'General Pool',
        phone: can.phone,
        email: can.email,
        stage: can.stage,
        rejectionReason: can.rejectionReason || 'Declined / Not Suitable',
        archivedAt: can.rejectedDate || new Date().toISOString(),
        archivedBy: can.hrName || 'HR Recruiter',
        candidateData: can
      }));

      await syncArchivedCandidatesToSheets(targetArchiveSheetId, tokenToUse, archivedRecords);

      setIsSyncingSheets(false);
      if (result.success) {
        alert(`✅ Synchronized successfully! All Active Candidates, Job Openings, and ${rejectedList.length} Rejected Candidates have been synced to Google Sheet (Archive_Candidates & Recruitment sheets).`);
      } else {
        alert(`❌ Sync Failed: ${result.message}`);
      }
    } catch (err: any) {
      setIsSyncingSheets(false);
      alert(`Sync notice: ${err.message || 'Error occurred while syncing'}`);
    }
  };

  const handleExportExcel = () => {
    const listToExport = filteredActiveCandidates;
    if (listToExport.length === 0) {
      alert('No active candidates available to export.');
      return;
    }

    const exportRows = listToExport.map(c => {
      const job = jobPostings.find(j => j.id === c.jobId);
      const lastFollowUp = c.followUpHistory && c.followUpHistory.length > 0 ? c.followUpHistory[0] : null;
      return {
        'Candidate ID': c.id,
        'Candidate Name': c.name,
        'Phone Number': c.phone,
        'Email Address': c.email || '-',
        'Applied Position (Job Title)': c.jobTitle || job?.title || 'General Pool',
        'BranchLocation': c.location || job?.location || 'Raipur HQ',
        'Current Stage': c.stage,
        'Interview Round': c.interviewRound || 'First Round',
        'Interview Mode': c.interviewType === 'Physical' ? 'Physical' : c.interviewType === 'Online' ? 'Online' : 'Telephonic',
        'Scheduled Interview Date & Time': c.interviewDate || '-',
        'Interviewer Name': c.interviewerName || c.hrName || '-',
        'Expected Monthly Salary (₹)': c.expectedSalary || 0,
        'Experience (Years)': c.experienceYears || 0,
        'Applied Date': c.appliedDate || '-',
        'Last Follow-Up Date': lastFollowUp ? `${lastFollowUp.date} ${lastFollowUp.time || ''}` : '-',
        'Last Follow-Up Discussion Summary': lastFollowUp ? lastFollowUp.discussionSummary : (c.notes || '-'),
        'All Notes & Remarks': c.notes || '-'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Active_Candidates');
    XLSX.writeFile(workbook, `Candidate_Recruitment_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleExportPDF = () => {
    const listToExport = filteredActiveCandidates;
    if (listToExport.length === 0) {
      alert('No active candidates available to export.');
      return;
    }

    const adminSettings = getAdminSettings();
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const todayStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    //Top Header Banner
    doc.setFillColor(0, 77, 61);
    doc.rect(0, 0, 297, 22, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(adminSettings.companyName || 'Rathi Buildmart', 14, 9);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.text('Active Candidates Recruitment, Branch Matrix & Follow-Up Report', 14, 16);

    doc.setFontSize(8);
    doc.text(`Generated: ${todayStr}`, 230, 9);
    doc.text(`Total Active Candidates: ${listToExport.length}`, 230, 15);

    //1. Calculate Branch x Stage Summary Matrix
    const branches = Array.from(new Set(listToExport.map(c => {
      const job = jobPostings.find(j => j.id === c.jobId);
      return c.location || job?.location || 'Raipur HQ';
    }))).sort();

    const stageKeys: Candidate['stage'][] = ['Applied', 'Screening', 'HR Interview', 'Director Interview', 'Offered', 'Hired'];
    const stageLabels = ['Applied', 'Screening', 'HR Int.', 'Director Int.', 'Offered', 'Hired'];

    //Build count map: branch -> stage -> count
    const matrix: Record<string, Record<string, number>> = {};
    branches.forEach(b => {
      matrix[b] = {};
      stageKeys.forEach(s => { matrix[b][s] = 0; });
    });

    listToExport.forEach(c => {
      const job = jobPostings.find(j => j.id === c.jobId);
      const b = c.location || job?.location || 'Raipur HQ';
      if (matrix[b]) {
        const stage = c.stage === 'Interview' ? 'HR Interview' : c.stage;
        if (matrix[b][stage] !== undefined) {
          matrix[b][stage]++;
        } else {
          matrix[b]['Applied']++;
        }
      }
    });

    let currentY = 26;

    //Title for Summary Matrix
    doc.setFillColor(236, 253, 245);
    doc.rect(10, currentY, 277, 6, 'F');
    doc.setTextColor(6, 78, 59);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('1. STAGE-WISE & BRANCH-WISE CANDIDATE SUMMARY MATRIX', 12, currentY + 4.2);

    currentY += 8;

    //Draw Summary Table Header
    doc.setFillColor(241, 245, 249);
    doc.rect(10, currentY, 277, 6, 'F');
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');

    doc.text('BranchLocation', 12, currentY + 4);
    let colX = 75;
    stageLabels.forEach(lbl => {
      doc.text(lbl, colX, currentY + 4);
      colX += 30;
    });
    doc.text('Total', colX, currentY + 4);

    currentY += 6.5;

    //Draw Rows per Branch
    const stageTotals: Record<string, number> = {};
    stageKeys.forEach(s => { stageTotals[s] = 0; });
    let grandTotal = 0;

    branches.forEach((b, idx) => {
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(10, currentY - 1, 277, 5, 'F');
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(b.length > 30 ? b.substring(0, 28) + '...' : b, 12, currentY + 2.8);

      doc.setFont('helvetica', 'normal');
      let rowTotal = 0;
      colX = 75;
      stageKeys.forEach(s => {
        const count = matrix[b][s] || 0;
        rowTotal += count;
        stageTotals[s] += count;
        doc.text(count > 0 ? String(count) : '-', colX + 3, currentY + 2.8);
        colX += 30;
      });

      doc.setFont('helvetica', 'bold');
      doc.text(String(rowTotal), colX + 2, currentY + 2.8);
      grandTotal += rowTotal;

      doc.setDrawColor(226, 232, 240);
      doc.line(10, currentY + 3.8, 287, currentY + 3.8);

      currentY += 5;
    });

    //Draw Summary Totals Row
    doc.setFillColor(226, 232, 240);
    doc.rect(10, currentY - 0.5, 277, 5.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text('TOTAL ACTIVE CANDIDATES (BRANCH-WISE)', 12, currentY + 3.2);

    colX = 75;
    stageKeys.forEach(s => {
      doc.text(String(stageTotals[s]), colX + 3, currentY + 3.2);
      colX += 30;
    });
    doc.text(String(grandTotal), colX + 2, currentY + 3.2);

    currentY += 9;

    //2. Calculate Job Role x Stage Summary Matrix
    if (currentY > 165) {
      doc.addPage('a4', 'landscape');
      currentY = 16;
    }

    const roles = Array.from(new Set(listToExport.map(c => {
      const job = jobPostings.find(j => j.id === c.jobId);
      return c.jobTitle || job?.title || 'General Pool';
    }))).sort();

    const roleMatrix: Record<string, Record<string, number>> = {};
    roles.forEach(r => {
      roleMatrix[r] = {};
      stageKeys.forEach(s => { roleMatrix[r][s] = 0; });
    });

    listToExport.forEach(c => {
      const job = jobPostings.find(j => j.id === c.jobId);
      const r = c.jobTitle || job?.title || 'General Pool';
      if (roleMatrix[r]) {
        const stage = c.stage === 'Interview' ? 'HR Interview' : c.stage;
        if (roleMatrix[r][stage] !== undefined) {
          roleMatrix[r][stage]++;
        } else {
          roleMatrix[r]['Applied']++;
        }
      }
    });

    //Title for Job Role Summary Matrix
    doc.setFillColor(236, 253, 245);
    doc.rect(10, currentY, 277, 6, 'F');
    doc.setTextColor(6, 78, 59);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('2. STAGE-WISE & JOB ROLE-WISE CANDIDATE SUMMARY MATRIX', 12, currentY + 4.2);

    currentY += 8;

    //Draw Job Role Table Header
    doc.setFillColor(241, 245, 249);
    doc.rect(10, currentY, 277, 6, 'F');
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');

    doc.text('Job RoleOpening Title', 12, currentY + 4);
    colX = 75;
    stageLabels.forEach(lbl => {
      doc.text(lbl, colX, currentY + 4);
      colX += 30;
    });
    doc.text('Total', colX, currentY + 4);

    currentY += 6.5;

    const roleStageTotals: Record<string, number> = {};
    stageKeys.forEach(s => { roleStageTotals[s] = 0; });
    let roleGrandTotal = 0;

    roles.forEach((r, idx) => {
      if (currentY > 180) {
        doc.addPage('a4', 'landscape');
        currentY = 16;
      }

      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(10, currentY - 1, 277, 5, 'F');
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(r.length > 30 ? r.substring(0, 28) + '...' : r, 12, currentY + 2.8);

      doc.setFont('helvetica', 'normal');
      let rowTotal = 0;
      colX = 75;
      stageKeys.forEach(s => {
        const count = roleMatrix[r][s] || 0;
        rowTotal += count;
        roleStageTotals[s] += count;
        doc.text(count > 0 ? String(count) : '-', colX + 3, currentY + 2.8);
        colX += 30;
      });

      doc.setFont('helvetica', 'bold');
      doc.text(String(rowTotal), colX + 2, currentY + 2.8);
      roleGrandTotal += rowTotal;

      doc.setDrawColor(226, 232, 240);
      doc.line(10, currentY + 3.8, 287, currentY + 3.8);

      currentY += 5;
    });

    //Draw Role Summary Totals Row
    doc.setFillColor(226, 232, 240);
    doc.rect(10, currentY - 0.5, 277, 5.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text('TOTAL ACTIVE CANDIDATES (ROLE-WISE)', 12, currentY + 3.2);

    colX = 75;
    stageKeys.forEach(s => {
      doc.text(String(roleStageTotals[s]), colX + 3, currentY + 3.2);
      colX += 30;
    });
    doc.text(String(roleGrandTotal), colX + 2, currentY + 3.2);

    currentY += 9;

    //3. Candidate List Header Section
    if (currentY > 165) {
      doc.addPage('a4', 'landscape');
      currentY = 16;
    }

    doc.setFillColor(236, 253, 245);
    doc.rect(10, currentY, 277, 6, 'F');
    doc.setTextColor(6, 78, 59);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('3. DETAILED CANDIDATES LIST, SCHEDULES & FOLLOW-UP LOGS', 12, currentY + 4.2);

    currentY += 8;

    //Table Column Headers for candidates
    const drawCandidateTableHeader = (y: number) => {
      doc.setFillColor(240, 244, 243);
      doc.rect(10, y, 277, 7, 'F');
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');

      doc.text('Candidate Info & Phone', 12, y + 4.8);
      doc.text('Applied Job & Branch', 62, y + 4.8);
      doc.text('Stage', 112, y + 4.8);
      doc.text('Round & Mode', 138, y + 4.8);
      doc.text('Interview Schedule & HR', 170, y + 4.8);
      doc.text('Last Follow-Up Details & Discussion', 212, y + 4.8);
    };

    drawCandidateTableHeader(currentY);
    currentY += 8;

    listToExport.forEach((c, idx) => {
      if (currentY > 180) {
        doc.addPage('a4', 'landscape');
        currentY = 16;
        drawCandidateTableHeader(currentY);
        currentY += 8;
      }

      const job = jobPostings.find(j => j.id === c.jobId);
      const branchName = c.location || job?.location || 'Raipur HQ';
      const lastFollowUp = c.followUpHistory && c.followUpHistory.length > 0 ? c.followUpHistory[0] : null;
      const modeText = c.interviewType === 'Physical' ? 'Physical' : c.interviewType === 'Online' ? 'Online' : 'Telephonic';
      
      const followUpSummaryText = lastFollowUp 
        ? `[${lastFollowUp.date} - ${lastFollowUp.round} (${lastFollowUp.interviewType || 'Phone'})]: ${lastFollowUp.discussionSummary}` 
        : (c.notes || 'No follow-up logged');

      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(10, currentY - 2, 277, 14, 'F');
      }

      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);

      //Name & ID
      doc.setFont('helvetica', 'bold');
      doc.text(`${c.name}`, 12, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(`${c.id} | Ph: ${c.phone}`, 12, currentY + 3.8);
      if (c.email) {
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(6.5);
        doc.text(`${c.email}`, 12, currentY + 7.2);
        doc.setFontSize(7.5);
        doc.setTextColor(15, 23, 42);
      }

      //Job & Branch
      doc.setFont('helvetica', 'bold');
      doc.text(`${c.jobTitle || job?.title || 'General Pool'}`, 62, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(`Branch: ${branchName}`, 62, currentY + 3.8);
      doc.text(`Exp: ${c.experienceYears}y | Exp. CTC: ₹${(c.expectedSalary || 0).toLocaleString('en-IN')}`, 62, currentY + 7.2);

      //Stage
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 77, 61);
      doc.text(`${c.stage}`, 112, currentY);
      doc.setTextColor(15, 23, 42);

      //Round & Mode
      doc.setFont('helvetica', 'normal');
      doc.text(`${c.interviewRound || 'First Round'}`, 138, currentY);
      doc.text(`Mode: ${modeText}`, 138, currentY + 3.8);

      //Interview Date & HR
      doc.text(`${c.interviewDate || 'Not Scheduled'}`, 170, currentY);
      doc.text(`By: ${c.interviewerName || c.hrName || 'HR Team'}`, 170, currentY + 3.8);

      //Discussion Summary ("Kya Baat Hua")
      doc.setFont('helvetica', 'normal');
      const splitSummary = doc.splitTextToSize(followUpSummaryText, 72);
      doc.text(splitSummary.slice(0, 3), 212, currentY);

      doc.setDrawColor(226, 232, 240);
      doc.line(10, currentY + 9, 287, currentY + 9);

      currentY += 13.5;
    });

    doc.save(`Candidate_Recruitment_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const openRejectModal = (candidate: Candidate) => {
    setRejectModalCandidate(candidate);
    const defaultReason = 'Offer Declined by candidate - reason for refusal';
    setRejectionPreset(defaultReason);
    setRejectionNotes(candidate.notes ? `${candidate.notes}\n[Rejected]: ${defaultReason}` : defaultReason);
  };

  const openScheduleInterviewModal = (cand: Candidate, stage: Candidate['stage'] = 'HR Interview') => {
    const adminSettings = getAdminSettings();
    setScheduleModalCandidate(cand);
    setTargetInterviewStage(stage === 'Director Interview' ? 'Director Interview' : 'HR Interview');
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    setInterviewDateInput(cand.interviewDate ? cand.interviewDate.split(' ')[0] : tomorrow);
    setInterviewTimeInput(cand.interviewTime || adminSettings.defaultInterviewTime || '11:00');
    setInterviewRoundInput(cand.interviewRound || (stage === 'Director Interview' ? 'Director Interview' : 'First Round'));
    setInterviewTypeInput(cand.interviewType || 'Telephonic');
    setInterviewerNameInput(cand.interviewerName || (stage === 'Director Interview' ? 'DirectorManagement' : (cand.hrName || 'HR Team')));
    setInterviewVenueInput(cand.interviewVenue || adminSettings.defaultInterviewVenue || 'Rathi Buildmart HQ, Raipur');
    setInterviewNotesInput(cand.notes || '');
  };

  const openWhatsAppForCandidate = (cand: Candidate, customMessage?: string, titleStr?: string) => {
    const jobTitle = cand.jobTitle || 'General Pool';
    const defaultMsg = customMessage || `Dear ${cand.name},\n\nThis is regarding your application for *${jobTitle}* at Rathi Buildmart.\n\nPlease connect with us for further recruitment updates.\n\nRegards,\nHR Team - Rathi Buildmart`;
    setWhatsappModalRecipient({
      isOpen: true,
      candidate: cand,
      title: titleStr || `Send WhatsAppEmail to ${cand.name}`,
      category: 'customNotice',
      message: defaultMsg
    });
  };

  const triggerAutoWhatsAppForStage = (cand: Candidate, stage: Candidate['stage'], customDate?: string, venue?: string) => {
    const adminSettings = getAdminSettings();
    const defaultVenue = venue || cand.interviewVenue || adminSettings.defaultInterviewVenue || 'Rathi Buildmart HQ, RaipurTelephonic';
    const intDate = customDate || cand.interviewDate || 'To be notified';
    const jobTitle = cand.jobTitle || 'General Pool';
    let message = '';
    let title = 'Send WhatsApp & Email Notification';

    if (stage === 'HR Interview') {
      title = 'Send HR Interview Invitation';
      message = `Dear ${cand.name},\n\nYour *${cand.interviewRound || 'First Round'} (${cand.interviewType || 'Telephonic'})* for *${jobTitle}* at ${adminSettings.companyName || 'Rathi Buildmart'} is scheduled.\n\n📅 *Date & Time*: ${intDate}\n📍 *Venue/Mode*: ${defaultVenue}\n👤 *Interviewer*: ${cand.interviewerName || 'HR Team'}\n\nPlease confirm availability. For queries, reply to this message.\n\nRegards,\nHR Team - ${adminSettings.companyName || 'Rathi Buildmart'}`;
    } else if (stage === 'Director Interview') {
      title = 'Send Director Interview Invitation';
      message = `Dear ${cand.name},\n\nCongratulations! You are shortlisted for *Director Interview (${cand.interviewType || 'Physical'})* for *${jobTitle}* at ${adminSettings.companyName || 'Rathi Buildmart'}.\n\n📅 *Date & Time*: ${intDate}\n📍 *Venue*: ${defaultVenue}\n\nPlease carry your resume and salary documents.\n\nRegards,\nManagement - ${adminSettings.companyName || 'Rathi Buildmart'}`;
    } else if (stage === 'Offered') {
      title = 'Send Offer Notification';
      message = `Dear ${cand.name},\n\nWe are pleased to offer you the position of *${jobTitle}* at ${adminSettings.companyName || 'Rathi Buildmart'} with an expected monthly salary of ₹${(cand.expectedSalary || 25000).toLocaleString('en-IN')} //month.\n\nOur HR team is releasing your official Offer Letter. Please confirm acceptance.\n\nRegards,\nHR Team - ${adminSettings.companyName || 'Rathi Buildmart'}`;
    } else if (stage === 'Hired') {
      title = 'Send Welcome Onboarding Message';
      message = `Dear ${cand.name},\n\nWelcome to ${adminSettings.companyName || 'Rathi Buildmart'} family! 🎉 Your appointment for *${jobTitle}* is confirmed.\n\nOur onboarding team will guide you on Day 1 document verification.\n\nRegards,\nHR Operations Team`;
    } else {
      title = `Stage Updated: ${stage}`;
      message = `Dear ${cand.name},\n\nYour application status for *${jobTitle}* at ${adminSettings.companyName || 'Rathi Buildmart'} has been updated to *${stage}*.\n\nThank you!\nHR Team`;
    }

    setWhatsappModalRecipient({
      isOpen: true,
      candidate: cand,
      title,
      category: 'customNotice',
      message
    });
  };

  const handleMoveCandidateStage = (cand: Candidate, targetStage: Candidate['stage']) => {
    if (targetStage === 'Rejected') {
      openRejectModal(cand);
      return;
    }

    if (targetStage === 'HR Interview' || targetStage === 'Director Interview') {
      openScheduleInterviewModal(cand, targetStage);
      return;
    }

    onUpdateStage(cand.id, targetStage);

    if (autoNotifyEnabled) {
      triggerAutoWhatsAppForStage(cand, targetStage);
    }
  };

  const handleConfirmScheduleInterview = () => {
    if (!scheduleModalCandidate) return;
    const combinedDateTime = interviewDateInput 
      ? `${interviewDateInput}${interviewTimeInput ? ' (' + interviewTimeInput + ')' : ''}`
      : '';

    const notesText = interviewNotesInput || (scheduleModalCandidate.notes 
      ? `${scheduleModalCandidate.notes}\n[Scheduled ${interviewRoundInput} - ${interviewTypeInput}]: ${targetInterviewStage} on ${combinedDateTime}`
      : `Interview Scheduled: ${interviewRoundInput} (${interviewTypeInput}) on ${combinedDateTime}`);

    //Create follow up log
    const followUpLog: CandidateFollowUp = {
      id: `FOL-${Date.now()}`,
      candidateId: scheduleModalCandidate.id,
      candidateName: scheduleModalCandidate.name,
      timestamp: new Date().toISOString(),
      date: interviewDateInput || new Date().toISOString().slice(0, 10),
      time: interviewTimeInput || '11:00',
      round: interviewRoundInput,
      interviewType: interviewTypeInput,
      interviewer: interviewerNameInput || 'HR Team',
      stageAtTime: targetInterviewStage,
      discussionSummary: `Interview Scheduled for ${combinedDateTime} at ${interviewVenueInput}. ${interviewNotesInput}`
    };

    if (onAddFollowUp) {
      onAddFollowUp(scheduleModalCandidate.id, followUpLog);
    }

    onUpdateStage(scheduleModalCandidate.id, targetInterviewStage, notesText);

    if (onScheduleInterview && combinedDateTime) {
      onScheduleInterview(scheduleModalCandidate.id, combinedDateTime);
    }

    if (selectedCandidate?.id === scheduleModalCandidate.id) {
      const history = selectedCandidate.followUpHistory || [];
      setSelectedCandidate({
        ...selectedCandidate,
        stage: targetInterviewStage,
        interviewDate: combinedDateTime,
        interviewRound: interviewRoundInput as any,
        interviewType: interviewTypeInput,
        interviewerName: interviewerNameInput,
        interviewVenue: interviewVenueInput,
        notes: notesText,
        followUpHistory: [followUpLog, ...history]
      });
    }

    const updatedCand = {
      ...scheduleModalCandidate,
      stage: targetInterviewStage,
      interviewDate: combinedDateTime,
      interviewRound: interviewRoundInput as any,
      interviewType: interviewTypeInput,
      interviewerName: interviewerNameInput,
      interviewVenue: interviewVenueInput,
      notes: notesText
    };

    setScheduleModalCandidate(null);

    if (autoNotifyEnabled) {
      triggerAutoWhatsAppForStage(updatedCand, targetInterviewStage, combinedDateTime, interviewVenueInput);
    }
  };

  const handleAddFollowUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate || !followUpSummary.trim()) return;

    const todayStr = new Date().toISOString().slice(0, 10);
    const nowTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newFollowUp: CandidateFollowUp = {
      id: `FOL-${Date.now()}`,
      candidateId: selectedCandidate.id,
      candidateName: selectedCandidate.name,
      timestamp: new Date().toISOString(),
      date: todayStr,
      time: nowTimeStr,
      round: followUpRound,
      interviewType: followUpType,
      interviewer: followUpInterviewer || 'HR Recruiter',
      stageAtTime: (followUpStageUpdate || selectedCandidate.stage) as Candidate['stage'],
      discussionSummary: followUpSummary,
      nextFollowUpDate: followUpNextDate || undefined
    };

    if (onAddFollowUp) {
      onAddFollowUp(selectedCandidate.id, newFollowUp);
    }

    if (followUpStageUpdate && followUpStageUpdate !== selectedCandidate.stage) {
      onUpdateStage(selectedCandidate.id, followUpStageUpdate as Candidate['stage'], `${selectedCandidate.notes || ''}\n[${todayStr} - ${followUpRound}]: ${followUpSummary}`);
    }

    const updatedHistory = [newFollowUp, ...(selectedCandidate.followUpHistory || [])];
    setSelectedCandidate({
      ...selectedCandidate,
      stage: (followUpStageUpdate || selectedCandidate.stage) as Candidate['stage'],
      interviewRound: followUpRound as any,
      interviewType: followUpType,
      interviewerName: followUpInterviewer || selectedCandidate.interviewerName,
      followUpHistory: updatedHistory,
      notes: `${selectedCandidate.notes || ''}\n[${todayStr} - ${followUpRound} (${followUpType})]: ${followUpSummary}`
    });

    setFollowUpSummary('');
    setFollowUpInterviewer('');
    setFollowUpNextDate('');
    setFollowUpStageUpdate('');
    alert('Follow-up discussion logged successfully!');
  };

  //Filter candidates: Separate Active vs Rejected (Auto-removed from active view)
  const activeCandidatesList = candidates.filter(c => c.stage !== 'Rejected' && !c.isArchived);
  const rejectedCandidatesList = candidates.filter(c => c.stage === 'Rejected' || c.isArchived);

  //Filter active candidates by search & job role
  const filteredActiveCandidates = activeCandidatesList.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      (c.jobTitle && c.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesJob = selectedJobId === 'ALL' || c.jobId === selectedJobId;
    return matchesSearch && matchesJob;
  });

  //Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedCandidateId(id);
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStage: Candidate['stage']) => {
    e.preventDefault();
    const candidateId = e.dataTransfer.getData('text/plain') || draggedCandidateId;
    if (candidateId) {
      const targetCand = candidates.find(c => c.id === candidateId);
      if (targetCand) {
        handleMoveCandidateStage(targetCand, targetStage);
      } else {
        onUpdateStage(candidateId, targetStage);
      }
      setDraggedCandidateId(null);
    }
  };

  //New Candidate Form State
  const [newCandidate, setNewCandidate] = useState<Partial<Candidate>>({
    name: '',
    email: '',
    phone: '',
    jobId: '',
    experienceYears: 1,
    expectedSalary: 25000,
    stage: 'Applied',
    notes: '',
    gender: 'Male',
    highestEducation: '',
    hrName: '',
    location: '',
    resumeUrl: '',
    source: ''
  });

  const handleCreateCandidateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCandidate.name || !newCandidate.phone) return;
    const selectedJob = jobPostings.find(j => j.id === newCandidate.jobId);
    onAddCandidate({
      ...newCandidate,
      jobTitle: selectedJob ? selectedJob.title : 'General Pool',
      appliedDate: new Date().toISOString().slice(0, 10),
      stage: 'Applied'
    });
    setNewCandidate({
      name: '',
      email: '',
      phone: '',
      jobId: '',
      experienceYears: 1,
      expectedSalary: 25000,
      stage: 'Applied',
      notes: '',
      gender: 'Male',
      highestEducation: '',
      hrName: '',
      location: '',
      resumeUrl: '',
      source: ''
    });
    setShowAddModal(false);
  };

  return (
    <div className="space-y-4">
      {/* Top Summary & Report KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-slate-500 text-[11px] font-medium block">
              Active Pipeline Candidates
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-slate-900">{activeCandidatesList.length}</span>
              <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                In Process
              </span>
            </div>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-slate-500 text-[11px] font-medium block">
              Interviews Scheduled
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-amber-700">
                {activeCandidatesList.filter(c => c.interviewDate).length}
              </span>
              <span className="text-xs text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Upcoming
              </span>
            </div>
          </div>
          <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl border border-amber-100">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        {/* REJECTED CANDIDATES METRIC (Auto-Removed from active view) */}
        <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-3.5 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-rose-800 text-[11px] font-bold block flex items-center gap-1">
              <span>Total Rejected Candidates</span>
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-rose-700">{rejectedCandidatesList.length}</span>
              <span className="text-[10px] text-rose-800 font-bold bg-rose-100 px-2 py-0.5 rounded-full border border-rose-200">
                Removed from Board
              </span>
            </div>
            <button
              onClick={() => setShowRejectedArchiveModal(true)}
              className="mt-1.5 text-[11px] text-rose-800 hover:text-rose-950 font-bold underline flex items-center gap-1"
            >
              <Eye className="w-3 h-3" />
              <span>View Rejected Candidates Archive</span>
            </button>
          </div>
          <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl border border-rose-200">
            <XCircle className="w-5 h-5" />
          </div>
        </div>

        {/* GOOGLE SHEETS SYNC BUTTON & STATUS */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-[11px] font-medium">Google Sheets Live Sync</span>
            <span className={`w-2 h-2 rounded-full ${spreadsheetId ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <button
              type="button"
              onClick={handleManualSyncToSheets}
              disabled={isSyncingSheets}
              className="w-full py-2 px-3 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <FileSpreadsheet className={`w-4 h-4 ${isSyncingSheets ? 'animate-spin' : ''}`} />
              <span>{isSyncingSheets ? 'Syncing Reports...' : 'Sync to Google Sheet'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search & Filter Header */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-4 border border-slate-200 rounded-2xl shadow-sm">
        <div className="flex flex-1 flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search candidate name, phone, email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white" />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedJobId}
              onChange={e => setSelectedJobId(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-600 focus:bg-white w-full sm:w-auto font-medium"
            >
              <option value="ALL">All Job Openings</option>
              {jobPostings.map(j => (
                <option key={j.id} value={j.id}>{j.title} ({j.department})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Export Excel Button */}
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-all shadow-2xs"
            title="Export Candidate List & Follow-Up details to Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Excel</span>
          </button>

          {/* Export PDF Button */}
          <button
            type="button"
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 rounded-xl text-xs font-bold transition-all shadow-2xs"
            title="Export Candidate List & Follow-Up details to PDF document"
          >
            <FileText className="w-4 h-4 text-rose-600" />
            <span>PDF</span>
          </button>

          {/* Auto WhatsAppEmail Toggle Button */}
          <button
            type="button"
            onClick={() => {
              const nextVal = !autoNotifyEnabled;
              setAutoNotifyEnabled(nextVal);
              localStorage.setItem('recruitment_auto_notify_enabled', String(nextVal));
            }}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all shadow-2xs ${
              autoNotifyEnabled
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
            }`}
            title="Toggle Automatic WhatsApp & Email Notifications on stage change"
          >
            <MessageSquare className={`w-4 h-4 ${autoNotifyEnabled ? 'text-emerald-600 fill-emerald-100' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">Auto WhatsApp:</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
              autoNotifyEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-400 text-white'
            }`}>
              {autoNotifyEnabled ? 'ON' : 'OFF'}
            </span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#004d3d] hover:bg-[#064e3b] text-white text-xs font-bold rounded-xl transition-all shadow-md shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            Add Candidate
          </button>
        </div>
      </div>

      {/* KANBAN BOARD ACTIVE COLUMNS (REJECTED CANDIDATES AUTOMATICALLY REMOVED HERE) */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 min-h-[600px] overflow-x-auto pb-4">
        {STAGES.map(col => {
          const stageCandidates = filteredActiveCandidates.filter(c => c.stage === col.key || (col.key === 'HR Interview' && c.stage === 'Interview'));

          return (
            <div
              key={col.key}
              onDragOver={handleDragOver}
              onDrop={e => handleDrop(e, col.key)}
              className="bg-slate-100/80 border border-slate-200/80 rounded-2xl p-3 flex flex-col transition-all duration-150 min-w-[220px] shadow-inner"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`}></span>
                  <h3 className={`text-xs font-bold text-slate-800`}>
                    {col.label}
                  </h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-slate-700 border border-slate-300 shadow-2xs">
                  {stageCandidates.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[700px] pr-1">
                {stageCandidates.map(can => {
                  return (
                    <div
                      key={can.id}
                      draggable
                      onDragStart={e => handleDragStart(e, can.id)}
                      className="bg-white border border-slate-200 hover:border-emerald-500 rounded-xl p-3 space-y-2.5 text-xs shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing group relative"
                    >
                      {/* Top Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                            {can.name}
                          </h4>
                          <span className="text-[10px] text-slate-500 block font-medium">
                            {can.jobTitle || 'General Pool'}
                          </span>
                        </div>
                        <span className="text-[9px] font-mono text-emerald-800 bg-emerald-50 font-bold px-1.5 py-0.5 rounded border border-emerald-200">
                          {can.id}
                        </span>
                      </div>

                      {/* Contact & Info */}
                      <div className="space-y-1 text-[11px] text-slate-600 border-t border-slate-100 pt-2">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span className="font-mono">{can.phone}</span>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center gap-1">
                            <Briefcase className="w-3 h-3 text-slate-400" />
                            <span>{can.experienceYears} yrs exp</span>
                          </div>
                          {can.expectedSalary && (
                            <div className="font-bold text-slate-800 font-mono text-[10px]">
                              ₹{(can.expectedSalary / 1000).toFixed(0)}k/mo
                            </div>
                          )}
                        </div>

                        {/* Interview Mode Badge */}
                        <div className="flex items-center justify-between pt-1 text-[10px]">
                          <span className="font-semibold text-slate-500">Mode:</span>
                          <span className={`px-2 py-0.5 rounded font-bold border ${
                            can.interviewType === 'Physical'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : can.interviewType === 'Online'
                              ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}>
                            {can.interviewType === 'Physical' ? '🏢 Physical' : can.interviewType === 'Online' ? '💻 Online' : '📞 Telephonic'}
                          </span>
                        </div>

                        {/* Interview Date if set */}
                        {can.interviewDate && (
                          <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-lg p-1.5 flex items-center justify-between mt-1 text-[10px] font-medium">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-amber-600 shrink-0" />
                              <span className="font-bold">{can.interviewDate}</span>
                            </div>
                            <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                              {can.interviewRound || 'Round 1'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action buttons on card */}
                      <div className="flex items-center justify-between border-t border-slate-100 pt-2 gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCandidate(can);
                            setFollowUpRound(can.interviewRound || 'First Round');
                            setFollowUpType(can.interviewType || 'Telephonic');
                          }}
                          className="flex-1 py-1 px-2 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 rounded-lg font-bold text-[10px] transition-colors flex items-center justify-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Detail & History</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => openWhatsAppForCandidate(can)}
                          className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors"
                          title="Send WhatsApp Message"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => openRejectModal(can)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-colors"
                          title="RejectOffer Declined"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {stageCandidates.length === 0 && (
                  <div className="h-32 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center p-3 text-slate-400">
                    <Users className="w-6 h-6 mb-1 opacity-50" />
                    <span className="text-[10px] font-medium">No candidates in {col.label}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* CANDIDATE DETAIL DRAWER & FOLLOW-UP LOG MODAL */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-end z-50 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200 overflow-y-auto">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#004d3d] text-white flex items-center justify-center font-bold text-base shadow-sm">
                  {selectedCandidate.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <span>{selectedCandidate.name}</span>
                    <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                      {selectedCandidate.id}
                    </span>
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">{selectedCandidate.jobTitle || 'General Pool'}</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedCandidate(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="p-5 space-y-5 text-xs text-slate-700">
              {/* Candidate Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <div>
                  <span className="text-slate-500 block text-[10px] font-medium">Current Stage</span>
                  <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded text-[11px] inline-block mt-0.5">
                    {selectedCandidate.stage}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-medium">Interview Mode</span>
                  <span className="font-bold text-slate-800 bg-slate-200/80 px-2 py-0.5 rounded text-[11px] inline-block mt-0.5">
                    {selectedCandidate.interviewType === 'Physical' ? '🏢 Physical' : selectedCandidate.interviewType === 'Online' ? '💻 Online' : '📞 Telephonic'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-medium">Interview Round</span>
                  <span className="font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded text-[11px] inline-block mt-0.5">
                    {selectedCandidate.interviewRound || 'First Round'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-medium">Experience</span>
                  <span className="font-bold text-slate-900">{selectedCandidate.experienceYears} Years</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-medium">Expected CTC</span>
                  <span className="font-bold text-slate-900">₹{(selectedCandidate.expectedSalary || 0).toLocaleString('en-IN')} /mo</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-medium">Phone</span>
                  <span className="font-mono text-slate-900 font-bold">{selectedCandidate.phone}</span>
                </div>
              </div>

              {/* Quick Contact Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => openWhatsAppForCandidate(selectedCandidate)}
                  className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-sm text-xs"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Send WhatsAppEmail</span>
                </button>

                <button
                  type="button"
                  onClick={() => openScheduleInterviewModal(selectedCandidate)}
                  className="py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-sm text-xs"
                >
                  <Calendar className="w-4 h-4" />
                  <span>ScheduleChange Interview</span>
                </button>
              </div>

              {/* LOG FOLLOW-UP CONVERSATION FORM */}
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-emerald-900 border-b border-emerald-200/80 pb-2">
                  <History className="w-4 h-4 text-emerald-700 shrink-0" />
                  <h4 className="font-bold text-sm">
                    Log Candidate Follow-Up & Discussion Notes
                  </h4>
                </div>

                <form onSubmit={handleAddFollowUpSubmit} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-800 font-bold block mb-1">Interview Round</label>
                      <select
                        value={followUpRound}
                        onChange={e => setFollowUpRound(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2 font-medium text-slate-900 focus:outline-none focus:border-emerald-600"
                      >
                        <option value="First Round">First Round</option>
                        <option value="Second Round">Second Round</option>
                        <option value="HR Interview">HR Interview</option>
                        <option value="Director Interview">Director Interview</option>
                        <option value="Technical Round">Technical Round</option>
                        <option value="Final Round">Final Discussion</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-800 font-bold block mb-1">Interview Mode</label>
                      <div className="grid grid-cols-3 gap-1">
                        {[
                          { key: 'Telephonic', label: '📞 Phone' },
                          { key: 'Physical', label: '🏢 Physical' },
                          { key: 'Online', label: '💻 Online' }
                        ].map(m => (
                          <button
                            key={m.key}
                            type="button"
                            onClick={() => setFollowUpType(m.key as any)}
                            className={`py-1.5 px-2 text-[10px] font-bold rounded-lg border transition-all text-center ${
                              followUpType === m.key
                                ? 'bg-emerald-700 text-white border-emerald-800 shadow-2xs'
                                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-800 font-bold block mb-1">Conducted ByInterviewer Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Vikas Sahu (HR Exec)"
                        value={followUpInterviewer}
                        onChange={e => setFollowUpInterviewer(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2 font-medium text-slate-900 focus:outline-none focus:border-emerald-600" />
                    </div>

                    <div>
                      <label className="text-slate-800 font-bold block mb-1">Move to Stage (Optional)</label>
                      <select
                        value={followUpStageUpdate}
                        onChange={e => setFollowUpStageUpdate(e.target.value as any)}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2 font-medium text-slate-900 focus:outline-none focus:border-emerald-600"
                      >
                        <option value="">Keep Stage: {selectedCandidate.stage}</option>
                        {STAGES.map(s => (
                          <option key={s.key} value={s.key}>{s.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-800 font-bold block mb-1">
                      Discussion Summary Notes *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={followUpSummary}
                      onChange={e => setFollowUpSummary(e.target.value)}
                      placeholder="Candidate expressed interest, discussed notice period (15 days), agreed to 28k salary. Scheduled Round 2..."
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-medium text-slate-900 focus:outline-none focus:border-emerald-600 text-xs" />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#004d3d] hover:bg-[#064e3b] text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save Follow-Up Entry & Sync</span>
                  </button>
                </form>
              </div>

              {/* TIMELINE OF CANDIDATE FOLLOW-UP & INTERVIEW HISTORY */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <History className="w-4 h-4 text-emerald-700" />
                  <span>Candidate Interview & Follow-Up History Log</span>
                </h4>

                <div className="space-y-2.5 border-l-2 border-emerald-200 pl-4 ml-2 pt-1">
                  {selectedCandidate.followUpHistory && selectedCandidate.followUpHistory.length > 0 ? (
                    selectedCandidate.followUpHistory.map((hist) => (
                      <div key={hist.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-1.5 shadow-2xs relative">
                        <div className="absolute -left-[23px] top-3.5 w-3 h-3 rounded-full bg-emerald-600 border-2 border-white"></div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-900">{hist.round}</span>
                          <span className="font-mono text-slate-500 font-medium">{hist.date} {hist.time || ''}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className={`px-1.5 py-0.5 rounded font-bold border ${
                            hist.interviewType === 'Physical' ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          }`}>
                            {hist.interviewType === 'Physical' ? '🏢 Physical' : hist.interviewType === 'Online' ? '💻 Online' : '📞 Telephonic'}
                          </span>
                          <span className="text-slate-600 font-medium">By: {hist.interviewer || 'HR'}</span>
                          <span className="text-slate-500 font-bold ml-auto">Stage: {hist.stageAtTime}</span>
                        </div>
                        <div className="p-2 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium text-xs leading-relaxed">
                          {hist.discussionSummary}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center bg-slate-50 border border-slate-200 rounded-xl text-slate-500">
                      No follow-up entries logged yet. Use the form above to record conversation details.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REJECTED CANDIDATES ARCHIVE MODAL (AUTO-TRANSFERRED CANDIDATES REPORT) */}
      {showRejectedArchiveModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white border border-rose-200 rounded-3xl max-w-4xl w-full p-6 space-y-4 text-xs shadow-2xl text-slate-900 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2 text-rose-700">
                <XCircle className="w-5 h-5 shrink-0" />
                <h3 className="font-bold text-base">
                  ArchivedRejected Candidates Report
                </h3>
              </div>
              <button onClick={() => setShowRejectedArchiveModal(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 flex items-center justify-between text-rose-900">
              <div>
                <span className="font-bold block text-sm">Total Rejected: {rejectedCandidatesList.length} Candidates</span>
                <span className="text-[11px] text-rose-700">These candidates were automatically removed from the active recruitment pipeline.</span>
              </div>
              <button
                onClick={handleManualSyncToSheets}
                className="py-2 px-3 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-sm shrink-0"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Sync to Google Sheet</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs text-slate-800">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-3">Candidate</th>
                    <th className="p-3">PhoneEmail</th>
                    <th className="p-3">Job Position</th>
                    <th className="p-3">Rejection Reason</th>
                    <th className="p-3">Date</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {rejectedCandidatesList.map(cand => (
                    <tr key={cand.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-bold text-slate-900">
                        <div>{cand.name}</div>
                        <span className="font-mono text-[10px] text-rose-700 font-bold">{cand.id}</span>
                      </td>
                      <td className="p-3 font-mono text-[11px]">
                        <div>{cand.phone}</div>
                        <div className="text-slate-500 text-[10px]">{cand.email}</div>
                      </td>
                      <td className="p-3 font-medium">{cand.jobTitle || 'General Pool'}</td>
                      <td className="p-3 text-rose-800 font-bold bg-rose-50/50 rounded-lg max-w-xs">
                        {cand.rejectionReason || cand.notes || 'Declined'}
                      </td>
                      <td className="p-3 font-mono">{cand.rejectedDate || cand.appliedDate}</td>
                      <td className="p-3 text-right">
                        {onRestoreCandidate && (
                          <button
                            type="button"
                            onClick={() => {
                              onRestoreCandidate(cand.id);
                              alert(`${cand.name} restored to active Applied stage!`);
                            }}
                            className="py-1 px-2.5 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 border border-emerald-300 rounded-xl font-bold transition-all flex items-center gap-1 text-[11px] ml-auto"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Restore to Pipeline</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}

                  {rejectedCandidatesList.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                        No rejected candidates recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ADD CANDIDATE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 space-y-4 text-xs shadow-2xl text-slate-900 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                Add Candidate to Pipeline
              </h3>
              <button onClick={() => setShowAddModal(false)}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
            </div>

            <form onSubmit={handleCreateCandidateSubmit} className="space-y-3">
              <div>
                <label className="text-slate-700 font-medium block mb-1">Candidate Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Verma"
                  value={newCandidate.name}
                  onChange={e => setNewCandidate({ ...newCandidate, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 9876543210"
                    value={newCandidate.phone}
                    onChange={e => setNewCandidate({ ...newCandidate, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none" />
                </div>
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. rahul@example.com"
                    value={newCandidate.email}
                    onChange={e => setNewCandidate({ ...newCandidate, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Select Job Role</label>
                  <select
                    value={newCandidate.jobId}
                    onChange={e => setNewCandidate({ ...newCandidate, jobId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="">General Pool</option>
                    {jobPostings.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Experience (Years)</label>
                  <input
                    type="number"
                    value={newCandidate.experienceYears}
                    onChange={e => setNewCandidate({ ...newCandidate, experienceYears: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Expected Monthly Salary (₹)</label>
                  <input
                    type="number"
                    value={newCandidate.expectedSalary}
                    onChange={e => setNewCandidate({ ...newCandidate, expectedSalary: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none" />
                </div>
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Interview Mode</label>
                  <select
                    value={newCandidate.interviewType || 'Telephonic'}
                    onChange={e => setNewCandidate({ ...newCandidate, interviewType: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="Telephonic">Telephonic</option>
                    <option value="Physical">PhysicalIn-Person</option>
                    <option value="Online">Online Meet</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#004d3d] hover:bg-[#064e3b] text-white font-bold rounded-xl mt-2 shadow-md transition-all"
              >
                Add Candidate
              </button>
            </form>
          </div>
        </div>
      )}

      {/* REJECT CANDIDATE MODAL */}
      {rejectModalCandidate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white border border-rose-200 rounded-3xl max-w-lg w-full p-6 space-y-4 text-xs shadow-2xl text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2 text-rose-700">
                <XCircle className="w-5 h-5 shrink-0" />
                <h3 className="font-bold text-base">
                  Reject CandidateOffer Declined
                </h3>
              </div>
              <button onClick={() => setRejectModalCandidate(null)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 space-y-1">
              <div className="font-bold text-slate-900 text-sm flex items-center justify-between">
                <span>{rejectModalCandidate.name}</span>
                <span className="font-mono text-xs text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md font-bold">{rejectModalCandidate.id}</span>
              </div>
              <div className="text-slate-600 font-medium">
                Candidate will be automatically removed from the active pipeline and archived to Google Sheets.
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-slate-800 font-bold block mb-1.5">Rejection Reason Preset</label>
                <div className="space-y-1.5">
                  {[
                    { label: 'Offer Declined by candidate - reason for refusal', desc: 'Declined' },
                    { label: 'Salary expectation too highBudget mismatch', desc: 'High Salary' },
                    { label: 'Candidate joined another companyAccepted other offer', desc: 'Joined Else' },
                    { label: 'Did not clear technicalinterview assessment', desc: 'Not Qualified' },
                    { label: 'Candidate unreachableNo response', desc: 'No Response' }
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setRejectionPreset(preset.label);
                        setRejectionNotes(preset.label);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl border transition-all text-xs flex items-center justify-between ${
                        rejectionPreset === preset.label
                          ? 'bg-rose-50 border-rose-500 font-bold text-rose-900 shadow-3xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="font-semibold">{preset.label}</span>
                      <span className="text-[10px] text-slate-500 font-normal ml-2 shrink-0">{preset.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-slate-800 font-bold block mb-1">Rejection RemarksNotes</label>
                <textarea
                  rows={2}
                  value={rejectionNotes}
                  onChange={e => setRejectionNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 focus:bg-white focus:border-rose-600 focus:outline-none text-xs font-medium" />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalCandidate(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateStage(rejectModalCandidate.id, 'Rejected', rejectionNotes);
                    if (selectedCandidate?.id === rejectModalCandidate.id) {
                      setSelectedCandidate(null);
                    }
                    setRejectModalCandidate(null);
                  }}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md transition-all"
                >
                  Confirm & Archive
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCHEDULE INTERVIEW MODAL WITH ROUNDS & MODES */}
      {scheduleModalCandidate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white border border-amber-200 rounded-3xl max-w-lg w-full p-6 space-y-4 text-xs shadow-2xl text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2 text-amber-700">
                <Calendar className="w-5 h-5 shrink-0" />
                <h3 className="font-bold text-base">
                  Schedule Candidate Interview
                </h3>
              </div>
              <button onClick={() => setScheduleModalCandidate(null)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 space-y-1">
              <div className="font-bold text-slate-900 text-sm flex items-center justify-between">
                <span>{scheduleModalCandidate.name}</span>
                <span className="font-mono text-xs text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md font-bold">{scheduleModalCandidate.id}</span>
              </div>
              <div className="text-slate-600 font-medium">
                {scheduleModalCandidate.jobTitle || 'General Pool'} • Phone: <span className="font-mono">{scheduleModalCandidate.phone}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-800 font-bold block mb-1">Interview Round</label>
                  <select
                    value={interviewRoundInput}
                    onChange={e => setInterviewRoundInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 focus:bg-white focus:border-amber-600"
                  >
                    <option value="First Round">First Round</option>
                    <option value="Second Round">Second Round</option>
                    <option value="HR Interview">HR Interview</option>
                    <option value="Director Interview">Director Interview</option>
                    <option value="Technical Round">Technical Round</option>
                    <option value="Final Round">Final Round</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-800 font-bold block mb-1">Interview Mode</label>
                  <select
                    value={interviewTypeInput}
                    onChange={e => setInterviewTypeInput(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 focus:bg-white focus:border-amber-600"
                  >
                    <option value="Telephonic">Telephonic (📞 Phone)</option>
                    <option value="Physical">PhysicalIn-Person (🏢 Physical)</option>
                    <option value="Online">Online Meet (💻 Online)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-800 font-bold block mb-1">Interview Date</label>
                  <input
                    type="date"
                    value={interviewDateInput}
                    onChange={e => setInterviewDateInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium" />
                </div>
                <div>
                  <label className="text-slate-800 font-bold block mb-1">Time</label>
                  <input
                    type="time"
                    value={interviewTimeInput}
                    onChange={e => setInterviewTimeInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium" />
                </div>
              </div>

              <div>
                <label className="text-slate-800 font-bold block mb-1">Interviewer Name</label>
                <input
                  type="text"
                  placeholder="e.g. Vikas Sahu (HR Head)"
                  value={interviewerNameInput}
                  onChange={e => setInterviewerNameInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium" />
              </div>

              <div>
                <label className="text-slate-800 font-bold block mb-1">VenueLink</label>
                <input
                  type="text"
                  placeholder="e.g. Rathi Buildmart HQ, Raipur"
                  value={interviewVenueInput}
                  onChange={e => setInterviewVenueInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium" />
              </div>

              <div>
                <label className="text-slate-800 font-bold block mb-1">InstructionsNotes</label>
                <textarea
                  rows={2}
                  value={interviewNotesInput}
                  onChange={e => setInterviewNotesInput(e.target.value)}
                  placeholder="Carry original documents..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 text-xs font-medium" />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setScheduleModalCandidate(null)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmScheduleInterview}
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Schedule Interview</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WHATSAPP DISPATCH MODAL */}
      {whatsappModalRecipient.isOpen && whatsappModalRecipient.candidate && (
        <WhatsAppModal
          isOpen={whatsappModalRecipient.isOpen}
          onClose={() => setWhatsappModalRecipient({ ...whatsappModalRecipient, isOpen: false })}
          settings={getAdminSettings()}
          recipient={{
            name: whatsappModalRecipient.candidate.name,
            mobileNo: whatsappModalRecipient.candidate.phone,
            email: whatsappModalRecipient.candidate.email,
            employeeId: whatsappModalRecipient.candidate.id
          }}
          title={whatsappModalRecipient.title}
          defaultCategory={whatsappModalRecipient.category}
          emailSubject={`Rathi Buildmart Recruitment Update - ${whatsappModalRecipient.candidate.name}`}
          emailBody={whatsappModalRecipient.message}
          variables={{
            employeeName: whatsappModalRecipient.candidate.name,
            companyName: getAdminSettings().companyName || 'Rathi Buildmart',
            customMessage: whatsappModalRecipient.message
          }} />
      )}
    </div>
  );
}
