import React, { useState } from 'react';
import {
  Archive,
  Database,
  RotateCcw,
  Download,
  Copy,
  Check,
  AlertTriangle,
  Users,
  UserX,
  FileSpreadsheet,
  Clock,
  Search,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Zap,
  Info,
  Code,
  BookOpen,
  Plus,
  Link,
  Unlink,
  Layers,
  Sparkles,
  FileText,
  SlidersHorizontal
} from 'lucide-react';
import {
  Employee,
  Candidate,
  Attendance,
  AdminSettings,
  ArchivedEmployeeRecord,
  ArchivedCandidateRecord,
  ArchiveHistoryLog,
  PortalUser
} from '../types';
import {
  APPS_SCRIPT_INSTRUCTIONS,
  getAppsScriptArchiveCode
} from '../utils/appsScriptArchiveCode';
import { googleSignIn, getAccessToken } from '../services/auth';
import {
  createDedicatedArchiveSpreadsheet,
  ensureArchiveSheetsExist,
  syncArchivedEmployeesToSheets,
  syncArchivedCandidatesToSheets,
  syncArchivedAttendanceToSheets,
  saveEmployees,
  syncRecruitmentToSheets,
  saveAttendance,
  appendArchiveLogToSheets,
  getSpreadsheetLink
} from '../services/sheets';

interface ArchiveStorageManagerProps {
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  candidates?: Candidate[];
  setCandidates?: React.Dispatch<React.SetStateAction<Candidate[]>>;
  attendance: Attendance[];
  setAttendance: React.Dispatch<React.SetStateAction<Attendance[]>>;
  archivedEmployees: ArchivedEmployeeRecord[];
  setArchivedEmployees: React.Dispatch<React.SetStateAction<ArchivedEmployeeRecord[]>>;
  archivedCandidates: ArchivedCandidateRecord[];
  setArchivedCandidates: React.Dispatch<React.SetStateAction<ArchivedCandidateRecord[]>>;
  archivedAttendance: Attendance[];
  setArchivedAttendance: React.Dispatch<React.SetStateAction<Attendance[]>>;
  settings: AdminSettings;
  onSaveSettings: (newSettings: AdminSettings) => void;
  spreadsheetId?: string | null;
  googleToken?: string | null;
  portalUser?: PortalUser | null;
  language?: 'en' | 'hi';
}

export default function ArchiveStorageManager({
  employees,
  setEmployees,
  candidates = [],
  setCandidates,
  attendance,
  setAttendance,
  archivedEmployees,
  setArchivedEmployees,
  archivedCandidates,
  setArchivedCandidates,
  archivedAttendance,
  setArchivedAttendance,
  settings,
  onSaveSettings,
  spreadsheetId,
  googleToken,
  portalUser,
  language = 'en'
}: ArchiveStorageManagerProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'archived_records' | 'apps_script' | 'policies'>('overview');
  const [archiveSubTab, setArchiveSubTab] = useState<'employees' | 'candidates' | 'attendance' | 'logs'>('employees');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDaysThreshold, setSelectedDaysThreshold] = useState<number>(settings.attendanceArchiveRetentionDays || 180);
  const [employeeRetentionDays, setEmployeeRetentionDays] = useState<number>(settings.employeeArchiveRetentionDays ?? 30);
  const [candidateRetentionDays, setCandidateRetentionDays] = useState<number>(settings.candidateArchiveRetentionDays ?? 30);
  const [pendingFilter, setPendingFilter] = useState<'all' | 'due' | 'grace' | 'employees' | 'candidates'>('all');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Custom in-app confirmation modal state (never blocked by iframe)
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    description: string;
    confirmLabel: string;
    variant?: 'rose' | 'emerald' | 'indigo' | 'amber';
    onConfirm: () => void | Promise<void>;
  } | null>(null);

  // Dedicated Sheet modals and state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [newSheetTitle, setNewSheetTitle] = useState('HRMS_Archive_Database');
  const [linkSheetInput, setLinkSheetInput] = useState('');
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [isLinkingSheet, setIsLinkingSheet] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);

  // Live Google Auth token handling
  const [localGoogleToken, setLocalGoogleToken] = useState<string | null>(() => {
    return googleToken || (typeof window !== 'undefined' ? localStorage.getItem('google_access_token') : null);
  });
  const [isAuthorizingGoogle, setIsAuthorizingGoogle] = useState(false);

  const effectiveGoogleToken = googleToken || localGoogleToken;

  const obtainValidToken = async (): Promise<string | null> => {
    let token = effectiveGoogleToken;
    if (!token) {
      token = await getAccessToken();
    }
    if (!token) {
      try {
        setIsAuthorizingGoogle(true);
        const res = await googleSignIn();
        if (res?.accessToken) {
          token = res.accessToken;
          setLocalGoogleToken(token);
          showNotification('✨ Google Account authorized successfully!', 'success');
        }
      } catch (e: any) {
        console.error('Google authorization error:', e);
        showNotification(`Google Authorization: ${e.message || 'Window closed or failed'}`, 'error');
        return null;
      } finally {
        setIsAuthorizingGoogle(false);
      }
    }
    return token;
  };

  // Target archive destination ID
  const effectiveArchiveSpreadsheetId = (settings.useDedicatedArchiveSheet && settings.archiveSpreadsheetId)
    ? settings.archiveSpreadsheetId
    : spreadsheetId;

  const isUsingDedicated = !!(settings.useDedicatedArchiveSheet && settings.archiveSpreadsheetId);

  // Remaining days calculation helper for inactive employees
  const calculateEmployeeRemainingDays = (emp: Employee) => {
    const retDays = settings.employeeArchiveRetentionDays ?? employeeRetentionDays ?? 30;
    if (retDays === 0) {
      return { dateLeftStr: emp.confirmationDate || 'Immediate', daysPassed: 0, remainingDays: 0, isDue: true };
    }

    let dateLeftStr = emp.confirmationDate || '';
    if (!dateLeftStr) {
      try {
        const exitRecords = JSON.parse(localStorage.getItem('hrms_exit_records') || '[]');
        const exit = exitRecords.find((e: any) => e.employeeId === emp.id);
        if (exit?.lastWorkingDay) {
          dateLeftStr = exit.lastWorkingDay;
        }
      } catch (e) {
        console.error(e);
      }
    }

    const dateLeft = dateLeftStr ? new Date(dateLeftStr) : new Date();
    const now = new Date();
    const diffTime = Math.max(0, now.getTime() - (isNaN(dateLeft.getTime()) ? now.getTime() : dateLeft.getTime()));
    const daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const remainingDays = Math.max(0, retDays - daysPassed);
    return {
      dateLeftStr: dateLeftStr || 'Recent',
      daysPassed,
      remainingDays,
      isDue: remainingDays <= 0
    };
  };

  // Remaining days calculation helper for rejected candidates
  const calculateCandidateRemainingDays = (can: Candidate) => {
    const retDays = settings.candidateArchiveRetentionDays ?? candidateRetentionDays ?? 30;
    if (retDays === 0) {
      return { rejectedDateStr: can.rejectedDate || can.appliedDate || 'Immediate', daysPassed: 0, remainingDays: 0, isDue: true };
    }

    const dateStr = can.rejectedDate || can.appliedDate || '';
    const dateObj = dateStr ? new Date(dateStr) : new Date();
    const now = new Date();
    const diffTime = Math.max(0, now.getTime() - (isNaN(dateObj.getTime()) ? now.getTime() : dateObj.getTime()));
    const daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const remainingDays = Math.max(0, retDays - daysPassed);
    return {
      rejectedDateStr: dateStr || 'Recent',
      daysPassed,
      remainingDays,
      isDue: remainingDays <= 0
    };
  };

  // Computed data
  const inactiveEmployees = employees.filter(e => !e.isActive);
  const activeEmployees = employees.filter(e => e.isActive);
  const rejectedCandidates = candidates.filter(c => c.stage === 'Rejected' || c.isArchived);
  const activeCandidates = candidates.filter(c => c.stage !== 'Rejected' && !c.isArchived);

  // Due records based on remaining days
  const dueEmployees = inactiveEmployees.filter(e => calculateEmployeeRemainingDays(e).isDue);
  const graceEmployees = inactiveEmployees.filter(e => !calculateEmployeeRemainingDays(e).isDue);
  const dueCandidates = rejectedCandidates.filter(c => calculateCandidateRemainingDays(c).isDue);
  const graceCandidates = rejectedCandidates.filter(c => !calculateCandidateRemainingDays(c).isDue);

  // Attendance older than selected threshold
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - selectedDaysThreshold);
  const cutoffDateStr = cutoffDate.toISOString().slice(0, 10);
  const oldAttendanceRecords = attendance.filter(a => a.date && a.date < cutoffDateStr);

  const totalActiveRows = activeEmployees.length + activeCandidates.length + (attendance.length - oldAttendanceRecords.length);
  const totalArchivedRows = archivedEmployees.length + archivedCandidates.length + archivedAttendance.length;

  const showNotification = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => {
      setStatusMessage(null);
    }, 5000);
  };

  const dynamicAppsScriptCode = getAppsScriptArchiveCode(
    settings.useDedicatedArchiveSheet ? settings.archiveSpreadsheetId : undefined,
    settings.employeeArchiveRetentionDays ?? employeeRetentionDays ?? 30,
    settings.candidateArchiveRetentionDays ?? candidateRetentionDays ?? 30,
    selectedDaysThreshold
  );

  const handleCopyScript = () => {
    navigator.clipboard.writeText(dynamicAppsScriptCode);
    setCopiedCode(true);
    showNotification('Google Apps Script code copied to clipboard! (With your configured Archive Sheet settings)', 'success');
    setTimeout(() => setCopiedCode(false), 3000);
  };

  const handleCopyArchiveId = () => {
    if (settings.archiveSpreadsheetId) {
      navigator.clipboard.writeText(settings.archiveSpreadsheetId);
      setCopiedId(true);
      showNotification('Archive Spreadsheet ID copied!', 'success');
      setTimeout(() => setCopiedId(false), 2500);
    }
  };

  // -------------------------------------------------------------
  // DEDICATED ARCHIVE SHEET ACTIONS
  // -------------------------------------------------------------

  // 1. Create a brand new dedicated Google Sheet for archives
  const handleCreateDedicatedSheet = async () => {
    setIsCreatingSheet(true);
    try {
      const token = await obtainValidToken();
      if (!token) {
        setIsCreatingSheet(false);
        return;
      }

      const title = newSheetTitle.trim() || 'HRMS_Archive_Database';
      const created = await createDedicatedArchiveSpreadsheet(token, title);
      
      const link = created.webViewLink || `https://docs.google.com/spreadsheets/d/${created.spreadsheetId}/edit`;

      const updatedSettings: AdminSettings = {
        ...settings,
        useDedicatedArchiveSheet: true,
        archiveSpreadsheetId: created.spreadsheetId,
        archiveSpreadsheetName: created.title || title,
        archiveSpreadsheetLink: link
      };

      onSaveSettings(updatedSettings);

      // Seed current local archives to this new sheet immediately
      if (archivedEmployees.length > 0) {
        await syncArchivedEmployeesToSheets(created.spreadsheetId, token, archivedEmployees);
      }
      if (archivedCandidates.length > 0) {
        await syncArchivedCandidatesToSheets(created.spreadsheetId, token, archivedCandidates);
      }
      if (archivedAttendance.length > 0) {
        await syncArchivedAttendanceToSheets(created.spreadsheetId, token, archivedAttendance);
      }

      await appendArchiveLogToSheets(
        created.spreadsheetId,
        token,
        'Dedicated Archive Sheet Created',
        archivedEmployees.length + archivedCandidates.length + archivedAttendance.length,
        'SUCCESS',
        `Created dedicated archive spreadsheet: ${title} (${created.spreadsheetId})`
      );

      setShowCreateModal(false);
      showNotification(`✨ Dedicated Archive Google Sheet "${title}" created successfully and connected!`, 'success');
    } catch (err: any) {
      console.error('Error creating dedicated archive sheet:', err);
      showNotification(`Failed to create dedicated archive sheet: ${err.message || 'Error occurred'}`, 'error');
    } finally {
      setIsCreatingSheet(false);
    }
  };

  // 2. Link an existing Google Sheet
  const handleLinkExistingSheet = async () => {
    const input = linkSheetInput.trim();
    if (!input) {
      showNotification('Please enter a Google Sheet URL or Spreadsheet ID.', 'error');
      return;
    }

    let parsedId = input;
    // Extract ID from full URL if provided
    const match = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      parsedId = match[1];
    }

    setIsLinkingSheet(true);
    try {
      const token = await obtainValidToken();
      if (!token) {
        setIsLinkingSheet(false);
        return;
      }

      // Ensure the archive tabs exist in this sheet
      const ensureRes = await ensureArchiveSheetsExist(parsedId, token);
      if (!ensureRes.success) {
        throw new Error(ensureRes.message);
      }

      const link = await getSpreadsheetLink(parsedId, token);

      const updatedSettings: AdminSettings = {
        ...settings,
        useDedicatedArchiveSheet: true,
        archiveSpreadsheetId: parsedId,
        archiveSpreadsheetName: 'Dedicated_HRMS_Archive_Sheet',
        archiveSpreadsheetLink: link
      };

      onSaveSettings(updatedSettings);

      // Push current archives to this sheet
      if (archivedEmployees.length > 0) {
        await syncArchivedEmployeesToSheets(parsedId, token, archivedEmployees);
      }
      if (archivedCandidates.length > 0) {
        await syncArchivedCandidatesToSheets(parsedId, token, archivedCandidates);
      }
      if (archivedAttendance.length > 0) {
        await syncArchivedAttendanceToSheets(parsedId, token, archivedAttendance);
      }

      await appendArchiveLogToSheets(
        parsedId,
        token,
        'Dedicated Archive Sheet Linked',
        archivedEmployees.length + archivedCandidates.length + archivedAttendance.length,
        'SUCCESS',
        `Linked existing archive sheet ID: ${parsedId}`
      );

      setShowLinkModal(false);
      setLinkSheetInput('');
      showNotification('Existing Google Sheet linked as Dedicated Archive destination!', 'success');
    } catch (err: any) {
      console.error('Error linking archive sheet:', err);
      showNotification(`Failed to link sheet: ${err.message || 'Check ID and permissions'}`, 'error');
    } finally {
      setIsLinkingSheet(false);
    }
  };

  // 3. Unlink Dedicated Sheet (revert to saving in main active spreadsheet)
  const handleUnlinkDedicatedSheet = () => {
    setConfirmModal({
      title: 'Unlink Dedicated Archive Google Sheet?',
      description: 'Future archives will be stored in the main Payroll spreadsheet instead of the separate dedicated archive sheet.',
      confirmLabel: 'Unlink Archive Sheet',
      variant: 'amber',
      onConfirm: () => {
        const updatedSettings: AdminSettings = {
          ...settings,
          useDedicatedArchiveSheet: false
        };
        onSaveSettings(updatedSettings);
        showNotification('Switched back to standard in-place archive storage.', 'info');
      }
    });
  };

  // 4. Sync All Current Archives to the configured Archive Sheet
  const handleSyncAllToArchiveSheet = async () => {
    const targetId = effectiveArchiveSpreadsheetId;
    if (!targetId) {
      showNotification('No Google Sheet ID configured to sync with.', 'error');
      return;
    }

    setIsSyncingAll(true);
    try {
      const token = await obtainValidToken();
      if (!token) {
        setIsSyncingAll(false);
        return;
      }

      await ensureArchiveSheetsExist(targetId, token);
      await syncArchivedEmployeesToSheets(targetId, token, archivedEmployees);
      await syncArchivedCandidatesToSheets(targetId, token, archivedCandidates);
      await syncArchivedAttendanceToSheets(targetId, token, archivedAttendance);

      await appendArchiveLogToSheets(
        targetId,
        token,
        'Manual Full Archive Sync',
        archivedEmployees.length + archivedCandidates.length + archivedAttendance.length,
        'SUCCESS',
        `Pushed all archived records from UI to Archive Sheet`
      );

      showNotification(`Successfully synchronized ${totalArchivedRows} archived rows to Google Sheet!`, 'success');
    } catch (err: any) {
      console.error('Sync all archives error:', err);
      showNotification(`Synced locally. Cloud notice: ${err.message || 'Check Google Drive permissions'}`, 'info');
    } finally {
      setIsSyncingAll(false);
    }
  };

  // -------------------------------------------------------------
  // CORE ARCHIVE ACTIONS
  // -------------------------------------------------------------

  // 1. Archive Inactive / Left Employees
  const executeArchiveLeftEmployees = async () => {
    if (inactiveEmployees.length === 0) {
      showNotification('No inactive or left employees found to archive.', 'info');
      return;
    }

    const destName = isUsingDedicated ? `Dedicated Archive Sheet ("${settings.archiveSpreadsheetName || 'HRMS Archive'}")` : 'Archive_Employees sheet';
    setIsProcessing(true);
    try {
      const now = new Date().toISOString();
      const newArchivedList: ArchivedEmployeeRecord[] = inactiveEmployees.map(emp => ({
        id: emp.id,
        name: emp.name,
        department: emp.department,
        designation: emp.designation,
        joiningDate: emp.joiningDate,
        leavingDate: emp.confirmationDate || '',
        exitReason: 'Ex-Employee / Inactive',
        archivedAt: now,
        archivedBy: portalUser?.name || 'Admin',
        employeeData: emp
      }));

      const updatedArchivedEmployees = [...newArchivedList, ...archivedEmployees];
      const remainingEmployees = employees.filter(e => e.isActive);

      // Immediately update React state & localStorage
      setArchivedEmployees(updatedArchivedEmployees);
      setEmployees(remainingEmployees);
      localStorage.setItem('cached_archived_employees', JSON.stringify(updatedArchivedEmployees));
      localStorage.setItem('cached_employees', JSON.stringify(remainingEmployees));

      // Non-blocking sync to Google Sheets
      const targetArchiveId = effectiveArchiveSpreadsheetId;
      if (spreadsheetId && googleToken) {
        try {
          await saveEmployees(spreadsheetId, remainingEmployees, googleToken);
        } catch (sErr) {
          console.warn('Google Sheets saveEmployees warning:', sErr);
        }
      }

      if (targetArchiveId && googleToken) {
        try {
          await syncArchivedEmployeesToSheets(targetArchiveId, googleToken, updatedArchivedEmployees);
          await appendArchiveLogToSheets(
            targetArchiveId,
            googleToken,
            'Archive Left Employees',
            inactiveEmployees.length,
            'SUCCESS',
            `Transferred ${inactiveEmployees.length} ex-employees to Archive_Employees`
          );
        } catch (aErr) {
          console.warn('Google Sheets syncArchivedEmployees warning:', aErr);
        }
      }

      // Add log to local settings
      const newLog: ArchiveHistoryLog = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: now,
        type: 'employees',
        count: inactiveEmployees.length,
        performedBy: portalUser?.name || 'Admin',
        details: `Archived ${inactiveEmployees.length} left employees to ${destName}.`
      };

      const updatedLogs = [newLog, ...(settings.archiveHistoryLogs || [])];
      onSaveSettings({
        ...settings,
        archiveHistoryLogs: updatedLogs
      });

      showNotification(`✨ Successfully transferred ${inactiveEmployees.length} left employee(s) to ${destName}!`, 'success');
    } catch (err: any) {
      console.error('Archive employees error:', err);
      showNotification(`Archived in app! Notice: ${err.message || 'Error occurred'}`, 'info');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleArchiveLeftEmployees = () => {
    if (inactiveEmployees.length === 0) {
      showNotification('No inactive or left employees found to archive.', 'info');
      return;
    }
    const destName = isUsingDedicated ? `Dedicated Archive Sheet ("${settings.archiveSpreadsheetName || 'HRMS Archive'}")` : 'Archive_Employees sheet';
    setConfirmModal({
      title: `Transfer ${inactiveEmployees.length} Left Employee(s) to Archive?`,
      description: `This will safely move ${inactiveEmployees.length} ex-employee(s) to ${destName}. The active employee roster will remain fast and uncluttered. You can restore them at any time.`,
      confirmLabel: `Transfer ${inactiveEmployees.length} Left Employee(s)`,
      variant: 'rose',
      onConfirm: executeArchiveLeftEmployees
    });
  };

  // 2. Archive Rejected Candidates
  const executeArchiveRejectedCandidates = async () => {
    if (rejectedCandidates.length === 0) {
      showNotification('No rejected candidates found to archive.', 'info');
      return;
    }

    const destName = isUsingDedicated ? `Dedicated Archive Sheet ("${settings.archiveSpreadsheetName || 'HRMS Archive'}")` : 'Archive_Candidates sheet';
    setIsProcessing(true);
    try {
      const now = new Date().toISOString();
      const newArchivedCandidates: ArchivedCandidateRecord[] = rejectedCandidates.map(can => ({
        id: can.id,
        name: can.name,
        jobTitle: can.jobTitle || 'General Pool',
        phone: can.phone,
        email: can.email,
        stage: can.stage,
        rejectionReason: can.rejectionReason || 'Declined / Not Suitable',
        archivedAt: now,
        archivedBy: portalUser?.name || 'Admin',
        candidateData: can
      }));

      const updatedArchivedCandidates = [...newArchivedCandidates, ...archivedCandidates];
      const remainingCandidates = candidates.filter(c => c.stage !== 'Rejected' && !c.isArchived);

      setArchivedCandidates(updatedArchivedCandidates);
      if (setCandidates) {
        setCandidates(remainingCandidates);
      }
      localStorage.setItem('cached_archived_candidates', JSON.stringify(updatedArchivedCandidates));
      localStorage.setItem('payroll_candidates', JSON.stringify(remainingCandidates));

      const targetArchiveId = effectiveArchiveSpreadsheetId;
      if (spreadsheetId && googleToken) {
        try {
          const jobs = JSON.parse(localStorage.getItem('payroll_jobs') || '[]');
          await syncRecruitmentToSheets(spreadsheetId, googleToken, jobs, remainingCandidates);
        } catch (rErr) {
          console.warn('Recruitment sync warning:', rErr);
        }
      }

      if (targetArchiveId && googleToken) {
        try {
          await syncArchivedCandidatesToSheets(targetArchiveId, googleToken, updatedArchivedCandidates);
          await appendArchiveLogToSheets(
            targetArchiveId,
            googleToken,
            'Archive Rejected Candidates',
            rejectedCandidates.length,
            'SUCCESS',
            `Transferred ${rejectedCandidates.length} candidates to Archive_Candidates`
          );
        } catch (aErr) {
          console.warn('Candidate archive sync warning:', aErr);
        }
      }

      const newLog: ArchiveHistoryLog = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: now,
        type: 'candidates',
        count: rejectedCandidates.length,
        performedBy: portalUser?.name || 'Admin',
        details: `Archived ${rejectedCandidates.length} rejected candidates to ${destName}.`
      };

      const updatedLogs = [newLog, ...(settings.archiveHistoryLogs || [])];
      onSaveSettings({
        ...settings,
        archiveHistoryLogs: updatedLogs
      });

      showNotification(`✨ Successfully moved ${rejectedCandidates.length} rejected candidate(s) to ${destName}!`, 'success');
    } catch (err: any) {
      console.error('Archive candidates error:', err);
      showNotification(`Moved in app! Notice: ${err.message || 'Error occurred'}`, 'info');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleArchiveRejectedCandidates = () => {
    if (rejectedCandidates.length === 0) {
      showNotification('No rejected candidates found to archive.', 'info');
      return;
    }
    const destName = isUsingDedicated ? `Dedicated Archive Sheet ("${settings.archiveSpreadsheetName || 'HRMS Archive'}")` : 'Archive_Candidates sheet';
    setConfirmModal({
      title: `Archive ${rejectedCandidates.length} Rejected Candidate(s)?`,
      description: `This will move ${rejectedCandidates.length} rejected candidate application(s) into ${destName}.`,
      confirmLabel: `Archive ${rejectedCandidates.length} Candidate(s)`,
      variant: 'indigo',
      onConfirm: executeArchiveRejectedCandidates
    });
  };

  // 2b. Archive Single Inactive Employee
  const handleArchiveSingleEmployee = (emp: Employee) => {
    const destName = isUsingDedicated ? `Dedicated Archive Sheet ("${settings.archiveSpreadsheetName || 'HRMS Archive'}")` : 'Archive_Employees sheet';
    setConfirmModal({
      title: `Transfer "${emp.name}" to Archive?`,
      description: `Move ${emp.name} (${emp.id}) from the active roster into ${destName}. You can restore this employee at any time.`,
      confirmLabel: 'Transfer to Archive',
      variant: 'rose',
      onConfirm: async () => {
        setIsProcessing(true);
        try {
          const now = new Date().toISOString();
          const newArchived: ArchivedEmployeeRecord = {
            id: emp.id,
            name: emp.name,
            department: emp.department,
            designation: emp.designation,
            joiningDate: emp.joiningDate,
            leavingDate: emp.confirmationDate || '',
            exitReason: 'Ex-Employee / Inactive',
            archivedAt: now,
            archivedBy: portalUser?.name || 'Admin',
            employeeData: emp
          };

          const updatedArchivedEmployees = [newArchived, ...archivedEmployees];
          const remainingEmployees = employees.filter(e => e.id !== emp.id);

          setArchivedEmployees(updatedArchivedEmployees);
          setEmployees(remainingEmployees);
          localStorage.setItem('cached_archived_employees', JSON.stringify(updatedArchivedEmployees));
          localStorage.setItem('cached_employees', JSON.stringify(remainingEmployees));

          const targetArchiveId = effectiveArchiveSpreadsheetId;
          if (spreadsheetId && googleToken) {
            try {
              await saveEmployees(spreadsheetId, remainingEmployees, googleToken);
            } catch (e) {
              console.warn(e);
            }
          }
          if (targetArchiveId && googleToken) {
            try {
              await syncArchivedEmployeesToSheets(targetArchiveId, googleToken, updatedArchivedEmployees);
              await appendArchiveLogToSheets(
                targetArchiveId,
                googleToken,
                'Archive Employee',
                1,
                'SUCCESS',
                `Transferred ${emp.name} (${emp.id}) to Archive_Employees`
              );
            } catch (e) {
              console.warn(e);
            }
          }

          showNotification(`✨ Transferred "${emp.name}" to ${destName}!`, 'success');
        } catch (err: any) {
          showNotification(`Transferred in app! Notice: ${err.message}`, 'info');
        } finally {
          setIsProcessing(false);
        }
      }
    });
  };

  // 2c. Archive Single Rejected Candidate
  const handleArchiveSingleCandidate = (can: Candidate) => {
    const destName = isUsingDedicated ? `Dedicated Archive Sheet ("${settings.archiveSpreadsheetName || 'HRMS Archive'}")` : 'Archive_Candidates sheet';
    setConfirmModal({
      title: `Archive Candidate "${can.name}"?`,
      description: `Move candidate ${can.name} into ${destName}.`,
      confirmLabel: 'Archive Candidate',
      variant: 'indigo',
      onConfirm: async () => {
        setIsProcessing(true);
        try {
          const now = new Date().toISOString();
          const newArchived: ArchivedCandidateRecord = {
            id: can.id,
            name: can.name,
            jobTitle: can.jobTitle || 'General Pool',
            phone: can.phone,
            email: can.email,
            stage: can.stage,
            rejectionReason: can.rejectionReason || 'Declined / Not Suitable',
            archivedAt: now,
            archivedBy: portalUser?.name || 'Admin',
            candidateData: can
          };

          const updatedArchivedCandidates = [newArchived, ...archivedCandidates];
          const remainingCandidates = candidates.filter(c => c.id !== can.id);

          setArchivedCandidates(updatedArchivedCandidates);
          if (setCandidates) {
            setCandidates(remainingCandidates);
          }
          localStorage.setItem('cached_archived_candidates', JSON.stringify(updatedArchivedCandidates));
          localStorage.setItem('payroll_candidates', JSON.stringify(remainingCandidates));

          const targetArchiveId = effectiveArchiveSpreadsheetId;
          if (spreadsheetId && googleToken) {
            try {
              const jobs = JSON.parse(localStorage.getItem('payroll_jobs') || '[]');
              await syncRecruitmentToSheets(spreadsheetId, googleToken, jobs, remainingCandidates);
            } catch (e) {
              console.warn(e);
            }
          }
          if (targetArchiveId && googleToken) {
            try {
              await syncArchivedCandidatesToSheets(targetArchiveId, googleToken, updatedArchivedCandidates);
              await appendArchiveLogToSheets(
                targetArchiveId,
                googleToken,
                'Archive Candidate',
                1,
                'SUCCESS',
                `Transferred ${can.name} to Archive_Candidates`
              );
            } catch (e) {
              console.warn(e);
            }
          }

          showNotification(`✨ Transferred candidate "${can.name}" to ${destName}!`, 'success');
        } catch (err: any) {
          showNotification(`Transferred in app! Notice: ${err.message}`, 'info');
        } finally {
          setIsProcessing(false);
        }
      }
    });
  };

  // 2d. Archive All Due Records (where remaining days <= 0)
  const executeArchiveDueRecords = async (silent: boolean = false) => {
    const toArchiveEmps = dueEmployees;
    const toArchiveCans = dueCandidates;
    const totalDue = toArchiveEmps.length + toArchiveCans.length;

    if (totalDue === 0) {
      if (!silent) showNotification('No records currently due for archive transfer (Remaining days > 0).', 'info');
      return;
    }

    const destName = isUsingDedicated ? `Dedicated Archive Sheet ("${settings.archiveSpreadsheetName || 'HRMS Archive'}")` : 'Archive Sheets';
    setIsProcessing(true);
    try {
      const now = new Date().toISOString();

      // Process employees
      if (toArchiveEmps.length > 0) {
        const newArchivedEmps: ArchivedEmployeeRecord[] = toArchiveEmps.map(emp => ({
          id: emp.id,
          name: emp.name,
          department: emp.department,
          designation: emp.designation,
          joiningDate: emp.joiningDate,
          leavingDate: emp.confirmationDate || '',
          exitReason: 'Ex-Employee / Inactive (Retention Expired)',
          archivedAt: now,
          archivedBy: portalUser?.name || 'Auto Policy',
          employeeData: emp
        }));

        const updatedArchivedEmployees = [...newArchivedEmps, ...archivedEmployees];
        const dueIds = new Set(toArchiveEmps.map(e => e.id));
        const remainingEmployees = employees.filter(e => !dueIds.has(e.id));

        setArchivedEmployees(updatedArchivedEmployees);
        setEmployees(remainingEmployees);
        localStorage.setItem('cached_archived_employees', JSON.stringify(updatedArchivedEmployees));
        localStorage.setItem('cached_employees', JSON.stringify(remainingEmployees));

        if (spreadsheetId && googleToken) {
          try {
            await saveEmployees(spreadsheetId, remainingEmployees, googleToken);
          } catch (e) {
            console.warn(e);
          }
        }
        if (effectiveArchiveSpreadsheetId && googleToken) {
          try {
            await syncArchivedEmployeesToSheets(effectiveArchiveSpreadsheetId, googleToken, updatedArchivedEmployees);
          } catch (e) {
            console.warn(e);
          }
        }
      }

      // Process candidates
      if (toArchiveCans.length > 0) {
        const newArchivedCans: ArchivedCandidateRecord[] = toArchiveCans.map(can => ({
          id: can.id,
          name: can.name,
          jobTitle: can.jobTitle || 'General Pool',
          phone: can.phone,
          email: can.email,
          stage: can.stage,
          rejectionReason: can.rejectionReason || 'Declined (Retention Expired)',
          archivedAt: now,
          archivedBy: portalUser?.name || 'Auto Policy',
          candidateData: can
        }));

        const updatedArchivedCandidates = [...newArchivedCans, ...archivedCandidates];
        const dueCanIds = new Set(toArchiveCans.map(c => c.id));
        const remainingCandidates = candidates.filter(c => !dueCanIds.has(c.id));

        setArchivedCandidates(updatedArchivedCandidates);
        if (setCandidates) setCandidates(remainingCandidates);
        localStorage.setItem('cached_archived_candidates', JSON.stringify(updatedArchivedCandidates));
        localStorage.setItem('payroll_candidates', JSON.stringify(remainingCandidates));

        if (spreadsheetId && googleToken) {
          try {
            const jobs = JSON.parse(localStorage.getItem('payroll_jobs') || '[]');
            await syncRecruitmentToSheets(spreadsheetId, googleToken, jobs, remainingCandidates);
          } catch (e) {
            console.warn(e);
          }
        }
        if (effectiveArchiveSpreadsheetId && googleToken) {
          try {
            await syncArchivedCandidatesToSheets(effectiveArchiveSpreadsheetId, googleToken, updatedArchivedCandidates);
          } catch (e) {
            console.warn(e);
          }
        }
      }

      if (effectiveArchiveSpreadsheetId && googleToken) {
        try {
          await appendArchiveLogToSheets(
            effectiveArchiveSpreadsheetId,
            googleToken,
            'Auto-Archive Retention Due Transfer',
            totalDue,
            'SUCCESS',
            `Transferred ${toArchiveEmps.length} ex-employees and ${toArchiveCans.length} rejected candidates whose retention days expired.`
          );
        } catch (e) {
          console.warn(e);
        }
      }

      showNotification(`⚡ Successfully transferred ${totalDue} due record(s) to ${destName}!`, 'success');
    } catch (err: any) {
      console.error('Due archive error:', err);
      showNotification(`Transferred in app! Notice: ${err.message || 'Error occurred'}`, 'info');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleArchiveDueRecords = (silent: boolean = false) => {
    const toArchiveEmps = dueEmployees;
    const toArchiveCans = dueCandidates;
    const totalDue = toArchiveEmps.length + toArchiveCans.length;

    if (totalDue === 0) {
      if (!silent) showNotification('No records currently due for archive transfer (Remaining days > 0).', 'info');
      return;
    }

    if (silent) {
      executeArchiveDueRecords(true);
      return;
    }

    const destName = isUsingDedicated ? `Dedicated Archive Sheet ("${settings.archiveSpreadsheetName || 'HRMS Archive'}")` : 'Archive Sheets';
    setConfirmModal({
      title: `Transfer ${totalDue} Due Record(s) to Archive?`,
      description: `Transfer ${toArchiveEmps.length} Left Staff and ${toArchiveCans.length} Rejected Candidate(s) whose retention countdown has reached 0 days to ${destName}.`,
      confirmLabel: `Transfer ${totalDue} Due Records`,
      variant: 'emerald',
      onConfirm: () => executeArchiveDueRecords(false)
    });
  };

  // 3. Archive Old Attendance
  const executeArchiveOldAttendance = async () => {
    if (oldAttendanceRecords.length === 0) {
      showNotification(`No attendance records older than ${selectedDaysThreshold} days found to archive.`, 'info');
      return;
    }

    const destName = isUsingDedicated ? `Dedicated Archive Sheet ("${settings.archiveSpreadsheetName || 'HRMS Archive'}")` : 'Archive_Attendance sheet';
    setIsProcessing(true);
    try {
      const now = new Date().toISOString();
      const updatedArchivedAttendance = [...oldAttendanceRecords, ...archivedAttendance];
      const remainingAttendance = attendance.filter(a => !a.date || a.date >= cutoffDateStr);

      setArchivedAttendance(updatedArchivedAttendance);
      setAttendance(remainingAttendance);
      localStorage.setItem('cached_archived_attendance', JSON.stringify(updatedArchivedAttendance));
      localStorage.setItem('cached_attendance', JSON.stringify(remainingAttendance));

      const targetArchiveId = effectiveArchiveSpreadsheetId;
      if (spreadsheetId && googleToken) {
        try {
          await saveAttendance(spreadsheetId, remainingAttendance, googleToken);
        } catch (e) {
          console.warn(e);
        }
      }

      if (targetArchiveId && googleToken) {
        try {
          await syncArchivedAttendanceToSheets(targetArchiveId, googleToken, updatedArchivedAttendance);
          await appendArchiveLogToSheets(
            targetArchiveId,
            googleToken,
            'Archive Old Attendance',
            oldAttendanceRecords.length,
            'SUCCESS',
            `Transferred ${oldAttendanceRecords.length} attendance logs older than ${cutoffDateStr}`
          );
        } catch (e) {
          console.warn(e);
        }
      }

      const newLog: ArchiveHistoryLog = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: now,
        type: 'attendance',
        count: oldAttendanceRecords.length,
        performedBy: portalUser?.name || 'Admin',
        details: `Archived ${oldAttendanceRecords.length} attendance records older than ${cutoffDateStr} to ${destName}.`
      };

      const updatedLogs = [newLog, ...(settings.archiveHistoryLogs || [])];
      onSaveSettings({
        ...settings,
        archiveHistoryLogs: updatedLogs
      });

      showNotification(`✨ Successfully archived ${oldAttendanceRecords.length} attendance records to ${destName}!`, 'success');
    } catch (err: any) {
      console.error('Archive attendance error:', err);
      showNotification(`Archived in app! Notice: ${err.message || 'Error occurred'}`, 'info');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleArchiveOldAttendance = () => {
    if (oldAttendanceRecords.length === 0) {
      showNotification(`No attendance records older than ${selectedDaysThreshold} days found to archive.`, 'info');
      return;
    }
    const destName = isUsingDedicated ? `Dedicated Archive Sheet ("${settings.archiveSpreadsheetName || 'HRMS Archive'}")` : 'Archive_Attendance sheet';
    setConfirmModal({
      title: `Archive ${oldAttendanceRecords.length} Old Attendance Records?`,
      description: `Move all attendance punch records older than ${selectedDaysThreshold} days (${cutoffDateStr}) to ${destName}.`,
      confirmLabel: `Archive ${oldAttendanceRecords.length} Records`,
      variant: 'amber',
      onConfirm: executeArchiveOldAttendance
    });
  };

  // 4. Master Full Storage Optimization
  const handleRunFullOptimization = () => {
    const totalToMove = inactiveEmployees.length + rejectedCandidates.length + oldAttendanceRecords.length;
    if (totalToMove === 0) {
      showNotification('Active database is already fully optimized! No unused records found to archive.', 'info');
      return;
    }

    const destName = isUsingDedicated ? `Dedicated Archive Google Sheet (${settings.archiveSpreadsheetName || 'HRMS Archive'})` : 'Main Archive Sheets';
    setConfirmModal({
      title: '⚡ Run Full Storage Optimization?',
      description: `This will transfer all unneeded records to ${destName}:\n• ${inactiveEmployees.length} Left/Inactive Employees\n• ${rejectedCandidates.length} Rejected Candidates\n• ${oldAttendanceRecords.length} Historical Attendance Logs (> ${selectedDaysThreshold}d)`,
      confirmLabel: 'Run 1-Click Optimization',
      variant: 'emerald',
      onConfirm: async () => {
        setIsProcessing(true);
        try {
          if (inactiveEmployees.length > 0) {
            await executeArchiveLeftEmployees();
          }
          if (rejectedCandidates.length > 0) {
            await executeArchiveRejectedCandidates();
          }
          if (oldAttendanceRecords.length > 0) {
            await executeArchiveOldAttendance();
          }
          showNotification('⚡ Full HRMS Database Storage Optimization Completed Successfully!', 'success');
        } catch (err: any) {
          showNotification(`Optimization completed with note: ${err.message}`, 'info');
        } finally {
          setIsProcessing(false);
        }
      }
    });
  };

  // 5. Restore Employee from Archive
  const handleRestoreEmployee = (archivedEmp: ArchivedEmployeeRecord) => {
    setConfirmModal({
      title: `Restore "${archivedEmp.name}" to Active Employees?`,
      description: `Restore ${archivedEmp.name} (${archivedEmp.id}) back to the Active Employees roster.`,
      confirmLabel: 'Restore to Active Roster',
      variant: 'emerald',
      onConfirm: async () => {
        setIsProcessing(true);
        try {
          const restoredEmp: Employee = {
            ...archivedEmp.employeeData,
            id: archivedEmp.id,
            name: archivedEmp.name,
            department: archivedEmp.department,
            designation: archivedEmp.designation,
            isActive: true
          };

          const updatedActiveEmployees = [restoredEmp, ...employees];
          const updatedArchivedEmployees = archivedEmployees.filter(e => e.id !== archivedEmp.id);

          setEmployees(updatedActiveEmployees);
          setArchivedEmployees(updatedArchivedEmployees);
          localStorage.setItem('cached_employees', JSON.stringify(updatedActiveEmployees));
          localStorage.setItem('cached_archived_employees', JSON.stringify(updatedArchivedEmployees));

          const targetArchiveId = effectiveArchiveSpreadsheetId;
          if (spreadsheetId && googleToken) {
            try {
              await saveEmployees(spreadsheetId, updatedActiveEmployees, googleToken);
            } catch (e) {
              console.warn(e);
            }
          }

          if (targetArchiveId && googleToken) {
            try {
              await syncArchivedEmployeesToSheets(targetArchiveId, googleToken, updatedArchivedEmployees);
              await appendArchiveLogToSheets(
                targetArchiveId,
                googleToken,
                'Restore Employee',
                1,
                'SUCCESS',
                `Restored ${archivedEmp.name} (${archivedEmp.id}) to active roster`
              );
            } catch (e) {
              console.warn(e);
            }
          }

          showNotification(`✨ "${restoredEmp.name}" successfully restored to Active Employees roster!`, 'success');
        } catch (err: any) {
          showNotification(`Restored in app! Notice: ${err.message}`, 'info');
        } finally {
          setIsProcessing(false);
        }
      }
    });
  };

  // 6. Restore Candidate from Archive
  const handleRestoreCandidate = (archivedCan: ArchivedCandidateRecord) => {
    setConfirmModal({
      title: `Re-Open Candidate "${archivedCan.name}"?`,
      description: `Restore candidate "${archivedCan.name}" back into the Active Recruitment Pipeline (Screening stage).`,
      confirmLabel: 'Re-Open in Pipeline',
      variant: 'emerald',
      onConfirm: async () => {
        setIsProcessing(true);
        try {
          const restoredCandidate: Candidate = {
            ...archivedCan.candidateData,
            id: archivedCan.id,
            name: archivedCan.name,
            stage: 'Screening',
            isArchived: false,
            rejectionReason: undefined
          };

          const updatedActiveCandidates = [restoredCandidate, ...candidates];
          const updatedArchivedCandidates = archivedCandidates.filter(c => c.id !== archivedCan.id);

          if (setCandidates) setCandidates(updatedActiveCandidates);
          setArchivedCandidates(updatedArchivedCandidates);
          localStorage.setItem('payroll_candidates', JSON.stringify(updatedActiveCandidates));
          localStorage.setItem('cached_archived_candidates', JSON.stringify(updatedArchivedCandidates));

          const targetArchiveId = effectiveArchiveSpreadsheetId;
          if (spreadsheetId && googleToken) {
            try {
              const jobs = JSON.parse(localStorage.getItem('payroll_jobs') || '[]');
              await syncRecruitmentToSheets(spreadsheetId, googleToken, jobs, updatedActiveCandidates);
            } catch (e) {
              console.warn(e);
            }
          }

          if (targetArchiveId && googleToken) {
            try {
              await syncArchivedCandidatesToSheets(targetArchiveId, googleToken, updatedArchivedCandidates);
              await appendArchiveLogToSheets(
                targetArchiveId,
                googleToken,
                'Restore Candidate',
                1,
                'SUCCESS',
                `Restored candidate ${archivedCan.name} to active recruitment`
              );
            } catch (e) {
              console.warn(e);
            }
          }

          showNotification(`✨ Candidate "${restoredCandidate.name}" restored to Active Recruitment Pipeline!`, 'success');
        } catch (err: any) {
          showNotification(`Restored in app! Notice: ${err.message}`, 'info');
        } finally {
          setIsProcessing(false);
        }
      }
    });
  };

  // Export Archive to CSV
  const handleExportArchiveCSV = (type: 'employees' | 'candidates' | 'attendance') => {
    let csvContent = '';
    let fileName = '';

    if (type === 'employees') {
      fileName = `Archived_Employees_${new Date().toISOString().slice(0, 10)}.csv`;
      const headers = ['Archived Date', 'Employee ID', 'Name', 'Department', 'Designation', 'Joining Date', 'Leaving Date', 'Exit Reason', 'Basic Salary', 'Phone', 'Email', 'Archived By'];
      const rows = archivedEmployees.map(r => [
        r.archivedAt,
        r.id,
        `"${r.name}"`,
        `"${r.department}"`,
        `"${r.designation}"`,
        r.joiningDate,
        r.leavingDate || '',
        `"${r.exitReason || ''}"`,
        r.employeeData?.basicSalary || 0,
        r.employeeData?.mobileNo || '',
        r.employeeData?.email || '',
        `"${r.archivedBy || ''}"`
      ]);
      csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    } else if (type === 'candidates') {
      fileName = `Archived_Candidates_${new Date().toISOString().slice(0, 10)}.csv`;
      const headers = ['Archived Date', 'Candidate ID', 'Name', 'Job Title', 'Phone', 'Email', 'Stage', 'Rejection Reason', 'Archived By'];
      const rows = archivedCandidates.map(r => [
        r.archivedAt,
        r.id,
        `"${r.name}"`,
        `"${r.jobTitle || ''}"`,
        r.phone,
        r.email,
        r.stage,
        `"${r.rejectionReason || ''}"`,
        `"${r.archivedBy || ''}"`
      ]);
      csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    } else {
      fileName = `Archived_Attendance_${new Date().toISOString().slice(0, 10)}.csv`;
      const headers = ['Attendance Date', 'Employee ID', 'Status', 'Check In', 'Check Out', 'Overtime Hours', 'Remarks'];
      const rows = archivedAttendance.map(r => [
        r.date,
        r.employeeId,
        r.status,
        r.checkIn || '',
        r.checkOut || '',
        r.overtimeHours || 0,
        `"${r.remarks || ''}"`
      ]);
      csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white rounded-2xl p-6 shadow-md border border-slate-700/60 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
              <Archive className="w-3.5 h-3.5" />
              <span>HRMS Archive & Cloud Storage Optimizer</span>
            </div>
            <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Data Archive Sheets & Dedicated Cloud Storage</span>
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Transfer unused records (Left/Resigned Employees, Rejected Candidates, and Historical Attendance) directly to a dedicated Google Sheet to keep your primary payroll database fast, lightweight, and clutter-free.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleRunFullOptimization}
              disabled={isProcessing}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md hover:shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Zap className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>{isProcessing ? 'Optimizing...' : '⚡ 1-Click Optimize All'}</span>
            </button>
            <button
              onClick={handleCopyScript}
              className="bg-slate-800/80 hover:bg-slate-700 text-slate-100 border border-slate-600 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Code className="w-4 h-4 text-indigo-300" />}
              <span>{copiedCode ? 'Script Copied!' : 'Apps Script Code'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dedicated Archive Google Sheet Hub Card */}
      <div className={`p-5 rounded-2xl border transition-all shadow-xs ${
        isUsingDedicated
          ? 'bg-emerald-950/20 border-emerald-300/80 dark:border-emerald-700/60'
          : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
      }`}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
                isUsingDedicated
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isUsingDedicated ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                {isUsingDedicated ? 'Dedicated Archive Google Sheet Active' : 'Standard Storage (Main Payroll Sheet)'}
              </span>

              {isUsingDedicated && settings.archiveSpreadsheetName && (
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <strong>{settings.archiveSpreadsheetName}</strong>
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
              {isUsingDedicated ? (
                <>
                  All archived left staff, rejected candidates, and historical attendance logs are automatically saved in your dedicated Google Sheet (<code className="font-mono text-emerald-700 dark:text-emerald-300 font-bold">{settings.archiveSpreadsheetId}</code>).
                </>
              ) : (
                <>
                  Archives are currently stored in tabs inside your main Payroll Google Sheet. You can create a separate, dedicated Google Spreadsheet to isolate old data and maximize Google Sheets performance.
                </>
              )}
            </p>

            {isUsingDedicated && settings.archiveSpreadsheetId && (
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <span className="text-[11px] text-slate-500 font-mono bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                  ID: {settings.archiveSpreadsheetId}
                </span>
                <button
                  onClick={handleCopyArchiveId}
                  className="text-[11px] font-bold text-slate-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                >
                  {copiedId ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedId ? 'Copied' : 'Copy ID'}</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {isUsingDedicated ? (
              <>
                {(settings.archiveSpreadsheetLink || settings.archiveSpreadsheetId) && (
                  <a
                    href={settings.archiveSpreadsheetLink || `https://docs.google.com/spreadsheets/d/${settings.archiveSpreadsheetId}/edit`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-2xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Archive Sheet ↗</span>
                  </a>
                )}

                <button
                  onClick={handleSyncAllToArchiveSheet}
                  disabled={isSyncingAll}
                  className="bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-3xs disabled:opacity-50"
                  title="Push all current archived data to the dedicated sheet"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isSyncingAll ? 'animate-spin' : ''}`} />
                  <span>{isSyncingAll ? 'Syncing...' : 'Sync All Records'}</span>
                </button>

                <button
                  onClick={() => setShowLinkModal(true)}
                  className="bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                  title="Switch or re-link another spreadsheet"
                >
                  <Link className="w-3.5 h-3.5" />
                  <span>Switch</span>
                </button>

                <button
                  onClick={handleUnlinkDedicatedSheet}
                  className="text-rose-600 hover:text-rose-800 hover:bg-rose-50 text-xs font-bold px-2.5 py-2 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                  title="Disconnect dedicated archive sheet and revert to main sheet"
                >
                  <Unlink className="w-3.5 h-3.5" />
                  <span>Unlink</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>✨ Create Dedicated Archive Sheet</span>
                </button>

                <button
                  onClick={() => setShowLinkModal(true)}
                  className="bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-3xs"
                >
                  <Link className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Link Existing Sheet</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-bold transition-all shadow-sm ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : statusMessage.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-indigo-50 border-indigo-200 text-indigo-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
            {statusMessage.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
            {statusMessage.type === 'info' && <Info className="w-4 h-4 text-indigo-600 shrink-0" />}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 dark:border-[#1e3a2f] gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-t border-x cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-white dark:bg-[#11221b] text-emerald-700 dark:text-emerald-400 border-slate-200 dark:border-[#1e3a2f] border-b-transparent shadow-xs'
              : 'text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/40'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Storage Overview & Quick Actions</span>
        </button>
        <button
          onClick={() => setActiveTab('archived_records')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-t border-x cursor-pointer ${
            activeTab === 'archived_records'
              ? 'bg-white dark:bg-[#11221b] text-emerald-700 dark:text-emerald-400 border-slate-200 dark:border-[#1e3a2f] border-b-transparent shadow-xs'
              : 'text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/40'
          }`}
        >
          <Archive className="w-4 h-4" />
          <span>Archived Records Explorer ({totalArchivedRows})</span>
        </button>
        <button
          onClick={() => setActiveTab('apps_script')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-t border-x cursor-pointer ${
            activeTab === 'apps_script'
              ? 'bg-white dark:bg-[#11221b] text-emerald-700 dark:text-emerald-400 border-slate-200 dark:border-[#1e3a2f] border-b-transparent shadow-xs'
              : 'text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/40'
          }`}
        >
          <Code className="w-4 h-4 text-indigo-500" />
          <span>Google Apps Script Automation</span>
        </button>
        <button
          onClick={() => setActiveTab('policies')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-t border-x cursor-pointer ${
            activeTab === 'policies'
              ? 'bg-white dark:bg-[#11221b] text-emerald-700 dark:text-emerald-400 border-slate-200 dark:border-[#1e3a2f] border-b-transparent shadow-xs'
              : 'text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/40'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-amber-500" />
          <span>Auto-Archive Policies</span>
        </button>
      </div>

      {/* Tab 1: Overview & Quick Actions */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Metrics Bento Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Employee Card */}
            <div className="p-4 bg-white dark:bg-[#11221b] border border-slate-200 dark:border-[#1e3a2f] rounded-2xl shadow-xs space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">Employees Status</span>
                  <Users className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">{activeEmployees.length}</span>
                  <span className="text-xs font-bold text-emerald-600">Active</span>
                  <span className="text-slate-300 dark:text-slate-700">|</span>
                  <span className="text-sm font-black text-rose-600">{inactiveEmployees.length}</span>
                  <span className="text-[10px] font-semibold text-rose-500">Left/Inactive</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">Retention:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                    {employeeRetentionDays === 0 ? '0d (Immediate)' : `${employeeRetentionDays} Days`}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Due Now: <strong className="text-rose-600 font-bold">{dueEmployees.length}</strong> | In Grace: <strong className="text-amber-600">{graceEmployees.length}</strong>
                </p>
              </div>

              <div className="space-y-1.5 pt-1">
                <button
                  onClick={handleArchiveLeftEmployees}
                  disabled={inactiveEmployees.length === 0 || isProcessing}
                  className="w-full bg-rose-50 hover:bg-rose-100 disabled:opacity-40 text-rose-800 border border-rose-200 text-xs font-bold py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
                >
                  <UserX className="w-3.5 h-3.5" />
                  <span>Transfer {inactiveEmployees.length} Left Employees</span>
                </button>
              </div>
            </div>

            {/* Candidate Card */}
            <div className="p-4 bg-white dark:bg-[#11221b] border border-slate-200 dark:border-[#1e3a2f] rounded-2xl shadow-xs space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">Hiring Candidates</span>
                  <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">{activeCandidates.length}</span>
                  <span className="text-xs font-bold text-indigo-600">In Pipeline</span>
                  <span className="text-slate-300 dark:text-slate-700">|</span>
                  <span className="text-sm font-black text-amber-600">{rejectedCandidates.length}</span>
                  <span className="text-[10px] font-semibold text-amber-500">Rejected</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">Retention:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                    {candidateRetentionDays === 0 ? '0d (Immediate)' : `${candidateRetentionDays} Days`}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Due Now: <strong className="text-rose-600 font-bold">{dueCandidates.length}</strong> | In Grace: <strong className="text-amber-600">{graceCandidates.length}</strong>
                </p>
              </div>

              <div className="space-y-1.5 pt-1">
                <button
                  onClick={handleArchiveRejectedCandidates}
                  disabled={rejectedCandidates.length === 0 || isProcessing}
                  className="w-full bg-indigo-50 hover:bg-indigo-100 disabled:opacity-40 text-indigo-800 border border-indigo-200 text-xs font-bold py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>Archive {rejectedCandidates.length} Rejected</span>
                </button>
              </div>
            </div>

            {/* Attendance Card */}
            <div className="p-4 bg-white dark:bg-[#11221b] border border-slate-200 dark:border-[#1e3a2f] rounded-2xl shadow-xs space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">Attendance Logs</span>
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">{attendance.length}</span>
                  <span className="text-xs font-bold text-slate-600">Active</span>
                  <span className="text-slate-300 dark:text-slate-700">|</span>
                  <span className="text-sm font-black text-amber-600">{oldAttendanceRecords.length}</span>
                  <span className="text-[10px] font-semibold text-amber-500">&gt;{selectedDaysThreshold}d</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">Retention:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                    {selectedDaysThreshold} Days
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Archived: <strong className="text-slate-700 dark:text-slate-200">{archivedAttendance.length}</strong> past logs
                </p>
              </div>

              <div className="space-y-1.5 pt-1">
                <button
                  onClick={handleArchiveOldAttendance}
                  disabled={oldAttendanceRecords.length === 0 || isProcessing}
                  className="w-full bg-amber-50 hover:bg-amber-100 disabled:opacity-40 text-amber-800 border border-amber-200 text-xs font-bold py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>Archive {oldAttendanceRecords.length} Old Records</span>
                </button>
              </div>
            </div>

            {/* Database Health Card */}
            <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50/50 dark:from-[#0b1812] dark:to-[#0f241c] border border-emerald-200 dark:border-emerald-900/60 rounded-2xl shadow-xs space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-emerald-800 dark:text-emerald-300 tracking-wider">Storage Health Score</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-emerald-900 dark:text-emerald-100">
                    {totalArchivedRows > 0 ? Math.round((totalArchivedRows / (totalActiveRows + totalArchivedRows)) * 100) : 0}%
                  </span>
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Optimized</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px]">
                  <span className="text-emerald-800/80 dark:text-emerald-300/80">Auto-Transfer on load:</span>
                  <span className={`font-bold px-1.5 py-0.5 rounded text-[9px] ${settings.autoTransferDueArchivesOnLoad ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-200 text-slate-700'}`}>
                    {settings.autoTransferDueArchivesOnLoad ? 'ENABLED' : 'MANUAL'}
                  </span>
                </div>
                <p className="text-[10px] text-emerald-800/80 dark:text-emerald-300/80 mt-1">
                  Active: <strong>{totalActiveRows}</strong> | Archive: <strong>{totalArchivedRows}</strong>
                </p>
              </div>

              <button
                onClick={() => handleArchiveDueRecords()}
                disabled={(dueEmployees.length + dueCandidates.length) === 0 || isProcessing}
                className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white text-xs font-black py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>⚡ Transfer Due Now ({dueEmployees.length + dueCandidates.length})</span>
              </button>
            </div>
          </div>

          {/* Quick Retention Rules Selector Bar */}
          <div className="p-4 bg-slate-50 dark:bg-[#11221b] border border-slate-200 dark:border-[#1e3a2f] rounded-2xl space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Quick Retention Policies (4 - 30 Days Multiple Options)</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Configure auto-archive waiting period for left staff and rejected candidates</p>
                </div>
              </div>

              <button
                onClick={() => {
                  const updated: AdminSettings = {
                    ...settings,
                    employeeArchiveRetentionDays: employeeRetentionDays,
                    candidateArchiveRetentionDays: candidateRetentionDays,
                    attendanceArchiveRetentionDays: selectedDaysThreshold
                  };
                  onSaveSettings(updated);
                  showNotification('Retention policy days saved successfully!', 'success');
                }}
                className="bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Save Retention Settings</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {/* Employee Retention Selector */}
              <div className="bg-white dark:bg-[#0c1813] p-3 rounded-xl border border-slate-200 dark:border-[#1e3a2f] space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Ex-Employee Retention</span>
                  <span className="text-[10px] text-rose-600 font-bold">{employeeRetentionDays}d</span>
                </label>
                <select
                  value={employeeRetentionDays}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setEmployeeRetentionDays(val);
                    onSaveSettings({ ...settings, employeeArchiveRetentionDays: val });
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs rounded-lg p-2 border border-slate-200 dark:border-slate-700 font-medium focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={0}>0 Days (Immediate transfer on Inactive)</option>
                  <option value={4}>4 Days (Quick 4-day grace)</option>
                  <option value={7}>7 Days (1 Week grace)</option>
                  <option value={15}>15 Days (Half-month grace)</option>
                  <option value={30}>30 Days (1 Month - Recommended)</option>
                  <option value={60}>60 Days (2 Months)</option>
                  <option value={90}>90 Days (Quarterly 3 Months)</option>
                </select>
              </div>

              {/* Candidate Retention Selector */}
              <div className="bg-white dark:bg-[#0c1813] p-3 rounded-xl border border-slate-200 dark:border-[#1e3a2f] space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Candidate Retention</span>
                  <span className="text-[10px] text-indigo-600 font-bold">{candidateRetentionDays}d</span>
                </label>
                <select
                  value={candidateRetentionDays}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setCandidateRetentionDays(val);
                    onSaveSettings({ ...settings, candidateArchiveRetentionDays: val });
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs rounded-lg p-2 border border-slate-200 dark:border-slate-700 font-medium focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={0}>0 Days (Immediate transfer on Rejection)</option>
                  <option value={4}>4 Days (Quick 4-day grace)</option>
                  <option value={7}>7 Days (1 Week grace)</option>
                  <option value={15}>15 Days (Half-month grace)</option>
                  <option value={30}>30 Days (1 Month - Recommended)</option>
                  <option value={60}>60 Days (2 Months)</option>
                  <option value={90}>90 Days (Quarterly 3 Months)</option>
                </select>
              </div>

              {/* Attendance Retention Selector */}
              <div className="bg-white dark:bg-[#0c1813] p-3 rounded-xl border border-slate-200 dark:border-[#1e3a2f] space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Attendance History</span>
                  <span className="text-[10px] text-amber-600 font-bold">{selectedDaysThreshold}d</span>
                </label>
                <select
                  value={selectedDaysThreshold}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setSelectedDaysThreshold(val);
                    onSaveSettings({ ...settings, attendanceArchiveRetentionDays: val });
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs rounded-lg p-2 border border-slate-200 dark:border-slate-700 font-medium focus:ring-2 focus:ring-amber-500"
                >
                  <option value={4}>Older than 4 Days</option>
                  <option value={7}>Older than 7 Days</option>
                  <option value={15}>Older than 15 Days</option>
                  <option value={30}>Older than 30 Days (1 Month)</option>
                  <option value={60}>Older than 60 Days (2 Months)</option>
                  <option value={90}>Older than 90 Days (3 Months)</option>
                  <option value={180}>Older than 180 Days (6 Months - Default)</option>
                  <option value={365}>Older than 365 Days (1 Year)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Pending Archive Queue & Retention Remaining Days Section */}
          <div className="bg-white dark:bg-[#11221b] border border-slate-200 dark:border-[#1e3a2f] rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-slate-100 dark:border-[#1e3a2f] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4 text-rose-600" />
                    <span>Pending Archive Queue & Retention Remaining Days</span>
                  </h3>
                  <span className="text-[10px] bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-extrabold px-2 py-0.5 rounded-full">
                    {inactiveEmployees.length + rejectedCandidates.length} Records Pending
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Track remaining days for each record before auto-transfer to Archive sheets. 1-click transfer anytime!
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => handleArchiveDueRecords()}
                  disabled={(dueEmployees.length + dueCandidates.length) === 0 || isProcessing}
                  className="bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-black text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                  title="Archive all records whose retention days countdown reached 0"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Transfer {dueEmployees.length + dueCandidates.length} Due Records</span>
                </button>

                <button
                  onClick={handleRunFullOptimization}
                  disabled={(inactiveEmployees.length + rejectedCandidates.length + oldAttendanceRecords.length) === 0 || isProcessing}
                  className="bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>Transfer All ({inactiveEmployees.length + rejectedCandidates.length})</span>
                </button>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setPendingFilter('all')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  pendingFilter === 'all'
                    ? 'bg-slate-900 text-white dark:bg-emerald-600'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                All Pending ({inactiveEmployees.length + rejectedCandidates.length})
              </button>
              <button
                onClick={() => setPendingFilter('due')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                  pendingFilter === 'due'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 hover:bg-rose-100'
                }`}
              >
                <AlertTriangle className="w-3 h-3" />
                <span>⚠️ Due Now (0d remaining) ({dueEmployees.length + dueCandidates.length})</span>
              </button>
              <button
                onClick={() => setPendingFilter('grace')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                  pendingFilter === 'grace'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 hover:bg-amber-100'
                }`}
              >
                <Clock className="w-3 h-3" />
                <span>⏳ In Grace Period ({graceEmployees.length + graceCandidates.length})</span>
              </button>
              <button
                onClick={() => setPendingFilter('employees')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  pendingFilter === 'employees'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Left Staff ({inactiveEmployees.length})
              </button>
              <button
                onClick={() => setPendingFilter('candidates')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  pendingFilter === 'candidates'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Rejected Candidates ({rejectedCandidates.length})
              </button>
            </div>

            {/* Pending Records Table */}
            <div className="border border-slate-200 dark:border-[#1e3a2f] rounded-xl overflow-hidden">
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 dark:bg-[#0c1813] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] sticky top-0 z-10 border-b border-slate-200 dark:border-[#1e3a2f]">
                    <tr>
                      <th className="p-3">Record Type</th>
                      <th className="p-3">ID / Name</th>
                      <th className="p-3">Department / Role</th>
                      <th className="p-3">Inactive / Exit Date</th>
                      <th className="p-3">Policy Days</th>
                      <th className="p-3">Remaining Days</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#1e3a2f] text-slate-700 dark:text-slate-200">
                    {/* Render Inactive Employees */}
                    {(pendingFilter === 'all' || pendingFilter === 'employees' || pendingFilter === 'due' || pendingFilter === 'grace') &&
                      inactiveEmployees
                        .filter(emp => {
                          const rem = calculateEmployeeRemainingDays(emp);
                          if (pendingFilter === 'due') return rem.isDue;
                          if (pendingFilter === 'grace') return !rem.isDue;
                          return true;
                        })
                        .map(emp => {
                          const rem = calculateEmployeeRemainingDays(emp);
                          return (
                            <tr key={`pending-emp-${emp.id}`} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-all">
                              <td className="p-3">
                                <span className="inline-flex items-center gap-1 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-bold px-2 py-0.5 rounded text-[10px]">
                                  <UserX className="w-3 h-3" />
                                  <span>Ex-Employee</span>
                                </span>
                              </td>
                              <td className="p-3 font-semibold">
                                <div className="font-bold text-slate-900 dark:text-white">{emp.name}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{emp.id}</div>
                              </td>
                              <td className="p-3">
                                <div>{emp.designation || 'Staff'}</div>
                                <div className="text-[10px] text-slate-400">{emp.department || 'General'}</div>
                              </td>
                              <td className="p-3 text-slate-500 dark:text-slate-400">
                                <div>{rem.dateLeftStr}</div>
                                <div className="text-[10px] text-slate-400">{rem.daysPassed} days passed</div>
                              </td>
                              <td className="p-3 font-mono font-bold text-slate-600 dark:text-slate-300">
                                {employeeRetentionDays} Days
                              </td>
                              <td className="p-3">
                                {rem.isDue ? (
                                  <span className="inline-flex items-center gap-1 bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 font-extrabold px-2 py-1 rounded-lg text-[10px] animate-pulse">
                                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                                    <span>⚠️ Due Now (0d left)</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 font-bold px-2 py-1 rounded-lg text-[10px]">
                                    <Clock className="w-3 h-3 text-amber-600" />
                                    <span>⏳ {rem.remainingDays} days remaining</span>
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-right">
                                <button
                                  onClick={() => handleArchiveSingleEmployee(emp)}
                                  disabled={isProcessing}
                                  className="bg-white hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer shadow-3xs"
                                  title="Transfer immediately to Archive_Employees"
                                >
                                  Transfer to Archive
                                </button>
                              </td>
                            </tr>
                          );
                        })}

                    {/* Render Rejected Candidates */}
                    {(pendingFilter === 'all' || pendingFilter === 'candidates' || pendingFilter === 'due' || pendingFilter === 'grace') &&
                      rejectedCandidates
                        .filter(can => {
                          const rem = calculateCandidateRemainingDays(can);
                          if (pendingFilter === 'due') return rem.isDue;
                          if (pendingFilter === 'grace') return !rem.isDue;
                          return true;
                        })
                        .map(can => {
                          const rem = calculateCandidateRemainingDays(can);
                          return (
                            <tr key={`pending-can-${can.id}`} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-all">
                              <td className="p-3">
                                <span className="inline-flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold px-2 py-0.5 rounded text-[10px]">
                                  <FileSpreadsheet className="w-3 h-3" />
                                  <span>Candidate</span>
                                </span>
                              </td>
                              <td className="p-3 font-semibold">
                                <div className="font-bold text-slate-900 dark:text-white">{can.name}</div>
                                <div className="text-[10px] text-slate-400">{can.phone || can.email || 'No contact'}</div>
                              </td>
                              <td className="p-3">
                                <div>{can.jobTitle || 'General Pool'}</div>
                                <div className="text-[10px] text-slate-400">{can.rejectionReason || 'Rejected'}</div>
                              </td>
                              <td className="p-3 text-slate-500 dark:text-slate-400">
                                <div>{rem.rejectedDateStr}</div>
                                <div className="text-[10px] text-slate-400">{rem.daysPassed} days passed</div>
                              </td>
                              <td className="p-3 font-mono font-bold text-slate-600 dark:text-slate-300">
                                {candidateRetentionDays} Days
                              </td>
                              <td className="p-3">
                                {rem.isDue ? (
                                  <span className="inline-flex items-center gap-1 bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 font-extrabold px-2 py-1 rounded-lg text-[10px] animate-pulse">
                                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                                    <span>⚠️ Due Now (0d left)</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 font-bold px-2 py-1 rounded-lg text-[10px]">
                                    <Clock className="w-3 h-3 text-amber-600" />
                                    <span>⏳ {rem.remainingDays} days remaining</span>
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-right">
                                <button
                                  onClick={() => handleArchiveSingleCandidate(can)}
                                  disabled={isProcessing}
                                  className="bg-white hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer shadow-3xs"
                                  title="Transfer immediately to Archive_Candidates"
                                >
                                  Transfer to Archive
                                </button>
                              </td>
                            </tr>
                          );
                        })}

                    {/* Empty State */}
                    {inactiveEmployees.length === 0 && rejectedCandidates.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                          <p className="font-bold text-slate-700 dark:text-slate-200">No Pending Records in Queue!</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">All active roster items are up to date and all inactive records have been archived.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Archived Records Explorer */}
      {activeTab === 'archived_records' && (
        <div className="space-y-4">
          {/* Subtabs & Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 dark:bg-[#11221b] p-3 rounded-2xl border border-slate-200 dark:border-[#1e3a2f]">
            <div className="flex items-center gap-1 flex-wrap">
              <button
                onClick={() => setArchiveSubTab('employees')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  archiveSubTab === 'employees'
                    ? 'bg-slate-900 text-white dark:bg-emerald-700 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
              >
                Ex-Employees ({archivedEmployees.length})
              </button>
              <button
                onClick={() => setArchiveSubTab('candidates')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  archiveSubTab === 'candidates'
                    ? 'bg-slate-900 text-white dark:bg-emerald-700 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
              >
                Rejected Candidates ({archivedCandidates.length})
              </button>
              <button
                onClick={() => setArchiveSubTab('attendance')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  archiveSubTab === 'attendance'
                    ? 'bg-slate-900 text-white dark:bg-emerald-700 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
              >
                Past Attendance ({archivedAttendance.length})
              </button>
              <button
                onClick={() => setArchiveSubTab('logs')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  archiveSubTab === 'logs'
                    ? 'bg-slate-900 text-white dark:bg-emerald-700 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
              >
                Archive History ({settings.archiveHistoryLogs?.length || 0})
              </button>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search archived data..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {archiveSubTab !== 'logs' && (
                <button
                  onClick={() => handleExportArchiveCSV(archiveSubTab as any)}
                  className="px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>CSV Export</span>
                </button>
              )}
            </div>
          </div>

          {/* Sub-view: Archived Employees */}
          {archiveSubTab === 'employees' && (
            <div>
              {archivedEmployees.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-[#11221b] border border-dashed border-slate-200 dark:border-[#1e3a2f] rounded-2xl space-y-2">
                  <UserX className="w-8 h-8 text-slate-300 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">No Archived Employees Yet</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    When you move left/resigned staff, they will appear here with full restore capabilities.
                  </p>
                </div>
              ) : (
                <div className="bg-white dark:bg-[#11221b] border border-slate-200 dark:border-[#1e3a2f] rounded-2xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 dark:bg-[#0b1812] text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider sticky top-0 border-b border-slate-200 dark:border-[#1e3a2f] z-10">
                        <tr>
                          <th className="p-3">Employee ID</th>
                          <th className="p-3">Name & Role</th>
                          <th className="p-3">Department</th>
                          <th className="p-3">Joining Date</th>
                          <th className="p-3">Leaving Date / Reason</th>
                          <th className="p-3">Archived On</th>
                          <th className="p-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-[#1e3a2f] font-medium text-slate-700 dark:text-slate-300">
                        {archivedEmployees
                          .filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.id.toLowerCase().includes(searchQuery.toLowerCase()) || e.department.toLowerCase().includes(searchQuery.toLowerCase()))
                          .map((rec) => (
                            <tr key={rec.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="p-3 font-mono font-bold text-rose-700 dark:text-rose-400">
                                <span className="bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 px-2 py-0.5 rounded text-[11px]">
                                  {rec.id}
                                </span>
                              </td>
                              <td className="p-3">
                                <div className="font-bold text-slate-900 dark:text-white">{rec.name}</div>
                                <div className="text-[10px] text-slate-400">{rec.designation}</div>
                              </td>
                              <td className="p-3">
                                <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded text-[10px] font-bold">
                                  {rec.department}
                                </span>
                              </td>
                              <td className="p-3 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                                {rec.joiningDate || '-'}
                              </td>
                              <td className="p-3 text-[11px]">
                                <div className="text-slate-800 dark:text-slate-200 font-medium">{rec.leavingDate || '-'}</div>
                                <div className="text-[10px] text-rose-600 font-semibold">{rec.exitReason}</div>
                              </td>
                              <td className="p-3 text-slate-400 text-[10px] font-mono">
                                {new Date(rec.archivedAt).toLocaleDateString()}
                              </td>
                              <td className="p-3 text-right">
                                <button
                                  onClick={() => handleRestoreEmployee(rec)}
                                  disabled={isProcessing}
                                  className="bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-[11px] font-bold px-3 py-1 rounded-lg transition-all inline-flex items-center gap-1 cursor-pointer"
                                  title="Restore back to Active Employees"
                                >
                                  <RotateCcw className="w-3 h-3 text-emerald-700" />
                                  <span>Restore</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sub-view: Archived Candidates */}
          {archiveSubTab === 'candidates' && (
            <div>
              {archivedCandidates.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-[#11221b] border border-dashed border-slate-200 dark:border-[#1e3a2f] rounded-2xl space-y-2">
                  <Archive className="w-8 h-8 text-slate-300 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">No Archived Candidates</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Rejected candidates moved to archive will be listed here.
                  </p>
                </div>
              ) : (
                <div className="bg-white dark:bg-[#11221b] border border-slate-200 dark:border-[#1e3a2f] rounded-2xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 dark:bg-[#0b1812] text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider sticky top-0 border-b border-slate-200 dark:border-[#1e3a2f] z-10">
                        <tr>
                          <th className="p-3">Candidate ID</th>
                          <th className="p-3">Name & Contact</th>
                          <th className="p-3">Target Job</th>
                          <th className="p-3">Rejection Reason</th>
                          <th className="p-3">Archived On</th>
                          <th className="p-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-[#1e3a2f] font-medium text-slate-700 dark:text-slate-300">
                        {archivedCandidates
                          .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || (c.jobTitle && c.jobTitle.toLowerCase().includes(searchQuery.toLowerCase())))
                          .map((rec) => (
                            <tr key={rec.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="p-3 font-mono font-bold text-indigo-700 dark:text-indigo-400">
                                <span className="bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded text-[11px]">
                                  {rec.id}
                                </span>
                              </td>
                              <td className="p-3">
                                <div className="font-bold text-slate-900 dark:text-white">{rec.name}</div>
                                <div className="text-[10px] text-slate-400">{rec.phone} | {rec.email}</div>
                              </td>
                              <td className="p-3">
                                <span className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded text-[10px] font-bold">
                                  {rec.jobTitle || 'General Pool'}
                                </span>
                              </td>
                              <td className="p-3 text-[11px] text-rose-700 dark:text-rose-400 font-semibold max-w-[220px] truncate" title={rec.rejectionReason}>
                                {rec.rejectionReason || 'Declined'}
                              </td>
                              <td className="p-3 text-slate-400 text-[10px] font-mono">
                                {new Date(rec.archivedAt).toLocaleDateString()}
                              </td>
                              <td className="p-3 text-right">
                                <button
                                  onClick={() => handleRestoreCandidate(rec)}
                                  disabled={isProcessing}
                                  className="bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-[11px] font-bold px-3 py-1 rounded-lg transition-all inline-flex items-center gap-1 cursor-pointer"
                                  title="Re-open into Active Recruitment Pipeline"
                                >
                                  <RotateCcw className="w-3 h-3 text-emerald-700" />
                                  <span>Re-Open</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sub-view: Archived Attendance */}
          {archiveSubTab === 'attendance' && (
            <div>
              {archivedAttendance.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-[#11221b] border border-dashed border-slate-200 dark:border-[#1e3a2f] rounded-2xl space-y-2">
                  <Clock className="w-8 h-8 text-slate-300 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">No Archived Attendance Records</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Historical attendance records older than threshold will appear here.
                  </p>
                </div>
              ) : (
                <div className="bg-white dark:bg-[#11221b] border border-slate-200 dark:border-[#1e3a2f] rounded-2xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 dark:bg-[#0b1812] text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider sticky top-0 border-b border-slate-200 dark:border-[#1e3a2f] z-10">
                        <tr>
                          <th className="p-3">Attendance Date</th>
                          <th className="p-3">Employee ID</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Check In / Out</th>
                          <th className="p-3">OT Hours</th>
                          <th className="p-3">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-[#1e3a2f] font-medium text-slate-700 dark:text-slate-300">
                        {archivedAttendance
                          .filter(a => a.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) || a.date.includes(searchQuery))
                          .slice(0, 100)
                          .map((att, idx) => (
                            <tr key={`${att.employeeId}-${att.date}-${idx}`} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="p-3 font-mono font-bold text-slate-800 dark:text-white">{att.date}</td>
                              <td className="p-3 font-mono font-bold text-slate-600 dark:text-slate-400">{att.employeeId}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  att.status === 'Present' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                                }`}>
                                  {att.status}
                                </span>
                              </td>
                              <td className="p-3 font-mono text-[11px]">
                                {att.checkIn || '-'} to {att.checkOut || '-'}
                              </td>
                              <td className="p-3 font-mono text-[11px]">{att.overtimeHours || 0} hrs</td>
                              <td className="p-3 text-[10px] text-slate-400">{att.remarks || '-'}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sub-view: Archive History Logs */}
          {archiveSubTab === 'logs' && (
            <div>
              {(!settings.archiveHistoryLogs || settings.archiveHistoryLogs.length === 0) ? (
                <div className="p-12 text-center bg-white dark:bg-[#11221b] border border-dashed border-slate-200 dark:border-[#1e3a2f] rounded-2xl space-y-2">
                  <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">No Archive Operations Logged Yet</h4>
                </div>
              ) : (
                <div className="bg-white dark:bg-[#11221b] border border-slate-200 dark:border-[#1e3a2f] rounded-2xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 dark:bg-[#0b1812] text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-[#1e3a2f]">
                      <tr>
                        <th className="p-3">Timestamp</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Records Moved</th>
                        <th className="p-3">Performed By</th>
                        <th className="p-3">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#1e3a2f] font-medium text-slate-700 dark:text-slate-300">
                      {settings.archiveHistoryLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="p-3 font-mono text-[10px] text-slate-500">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="p-3">
                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded text-[10px] font-black uppercase">
                              {log.type}
                            </span>
                          </td>
                          <td className="p-3 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                            {log.count} records
                          </td>
                          <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{log.performedBy}</td>
                          <td className="p-3 text-[11px] text-slate-500 dark:text-slate-400">{log.details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Google Apps Script Automation Hub */}
      {activeTab === 'apps_script' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#11221b] border border-slate-200 dark:border-[#1e3a2f] rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-[#1e3a2f] pb-4">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Code className="w-4 h-4 text-indigo-600" />
                  <span>Google Apps Script (GAS) Archive Automation</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Paste this script in your active Google Sheets script editor to automate scheduled archiving and nightly database optimization.
                </p>
              </div>

              <button
                onClick={handleCopyScript}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCode ? 'Copied to Clipboard!' : 'Copy Script Code'}</span>
              </button>
            </div>

            {/* Target Destination Status Badge */}
            <div className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-bold ${
              isUsingDedicated
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300'
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300'
            }`}>
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {isUsingDedicated
                  ? `✅ Dedicated Archive Spreadsheet ID (${settings.archiveSpreadsheetId}) is dynamically pre-configured inside this script!`
                  : 'ℹ️ Standard Mode: The script is configured to manage archive sheets in the active spreadsheet.'}
              </span>
            </div>

            {/* Step by step guide */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
              {APPS_SCRIPT_INSTRUCTIONS.map((inst) => (
                <div key={inst.step} className="p-3 bg-slate-50 dark:bg-[#0b1812] border border-slate-200 dark:border-[#1e3a2f] rounded-xl space-y-1">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-black text-[10px] flex items-center justify-center">
                    {inst.step}
                  </span>
                  <h5 className="text-xs font-bold text-slate-800 dark:text-white">{inst.title}</h5>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal font-medium">{inst.description}</p>
                </div>
              ))}
            </div>

            {/* Script Code Viewer */}
            <div className="relative mt-4">
              <div className="bg-slate-950 text-slate-200 rounded-xl p-4 font-mono text-[11px] max-h-[380px] overflow-y-auto leading-relaxed border border-slate-800 select-all">
                <pre>{dynamicAppsScriptCode}</pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Auto-Archive Policies */}
      {activeTab === 'policies' && (
        <div className="bg-white dark:bg-[#11221b] border border-slate-200 dark:border-[#1e3a2f] rounded-2xl p-6 space-y-6 shadow-xs">
          <div className="border-b border-slate-100 dark:border-[#1e3a2f] pb-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Automated Archive Policies & Rules</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Configure automatic archive triggers and storage destinations when employees exit or candidate applications are rejected.
            </p>
          </div>

          <div className="space-y-4 max-w-2xl">
            {/* Storage Destination Selector */}
            <div className="p-4 bg-slate-50 dark:bg-[#0b1812] rounded-xl border border-slate-200 dark:border-[#1e3a2f] space-y-2">
              <label className="block text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Archive Storage Target
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <label className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                  !settings.useDedicatedArchiveSheet
                    ? 'bg-white dark:bg-slate-800 border-emerald-500 ring-2 ring-emerald-500/20'
                    : 'bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-70'
                }`}>
                  <input
                    type="radio"
                    name="archiveTarget"
                    checked={!settings.useDedicatedArchiveSheet}
                    onChange={() => {
                      onSaveSettings({ ...settings, useDedicatedArchiveSheet: false });
                      showNotification('Storage mode: Standard In-Place Sheets', 'info');
                    }}
                    className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">Standard Mode</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Save archive sheets inside main Payroll spreadsheet.</span>
                  </div>
                </label>

                <label className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                  settings.useDedicatedArchiveSheet
                    ? 'bg-white dark:bg-slate-800 border-emerald-500 ring-2 ring-emerald-500/20'
                    : 'bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-70'
                }`}>
                  <input
                    type="radio"
                    name="archiveTarget"
                    checked={!!settings.useDedicatedArchiveSheet}
                    onChange={() => {
                      if (!settings.archiveSpreadsheetId) {
                        setShowCreateModal(true);
                      } else {
                        onSaveSettings({ ...settings, useDedicatedArchiveSheet: true });
                        showNotification('Storage mode: Dedicated Archive Sheet', 'success');
                      }
                    }}
                    className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">Dedicated Sheet Mode</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Route all archives into a separate Google Sheet.</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Auto-Transfer on Load Toggle */}
            <label className="flex items-start gap-3 p-3.5 bg-emerald-50/70 dark:bg-emerald-950/30 hover:bg-emerald-100/50 rounded-xl border border-emerald-200 dark:border-emerald-900/60 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={settings.autoTransferDueArchivesOnLoad !== false}
                onChange={(e) => {
                  onSaveSettings({
                    ...settings,
                    autoTransferDueArchivesOnLoad: e.target.checked
                  });
                  showNotification(`Auto-Transfer on load: ${e.target.checked ? 'Enabled' : 'Disabled'}`, 'success');
                }}
                className="w-4 h-4 mt-0.5 text-emerald-600 focus:ring-emerald-500 rounded border-gray-300"
              />
              <div>
                <span className="block text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Automatic Transfer of Due Records on App Load (Remaining Days = 0)</span>
                </span>
                <span className="text-[11px] text-slate-600 dark:text-slate-300 leading-normal block mt-0.5">
                  Jab kisi Left Employee ya Rejected Candidate ka remaining retention days 0 ho jata hai, app load hote hi unka data automatically Archive Sheet me transfer ho jayega bina kisi manual button click ke.
                </span>
              </div>
            </label>

            {/* Left Employee Retention Policy */}
            <div className="p-3.5 bg-slate-50 dark:bg-[#0b1812] rounded-xl border border-slate-200 dark:border-[#1e3a2f] space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-xs font-bold text-slate-900 dark:text-white">
                    Left / Inactive Employee Archive Retention Policy
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    Kitne din tak inactive employee active roster me grace period me rahega bache hue din ("remaining days") dikhate hue.
                  </span>
                </div>
                <span className="text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-900">
                  {employeeRetentionDays} Days
                </span>
              </div>
              <select
                value={employeeRetentionDays}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setEmployeeRetentionDays(val);
                  onSaveSettings({
                    ...settings,
                    employeeArchiveRetentionDays: val
                  });
                  showNotification(`Ex-employee retention set to ${val} days`, 'success');
                }}
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none w-full sm:w-72"
              >
                <option value={0}>0 Days (Immediate Transfer / Turant Move)</option>
                <option value={4}>4 Days (4 Din ka Grace)</option>
                <option value={7}>7 Days (1 Week / 7 Din)</option>
                <option value={15}>15 Days (Half Month / 15 Din)</option>
                <option value={30}>30 Days (1 Month / 30 Din - Default)</option>
                <option value={60}>60 Days (2 Months / 60 Din)</option>
                <option value={90}>90 Days (3 Months / 90 Din)</option>
              </select>
            </div>

            {/* Candidate Retention Policy */}
            <div className="p-3.5 bg-slate-50 dark:bg-[#0b1812] rounded-xl border border-slate-200 dark:border-[#1e3a2f] space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-xs font-bold text-slate-900 dark:text-white">
                    Rejected Candidate Archive Retention Policy
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    Reject hone ke baad kitne din ke remaining countdown ke baad candidate data archive sheet me transfer hoga.
                  </span>
                </div>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-900">
                  {candidateRetentionDays} Days
                </span>
              </div>
              <select
                value={candidateRetentionDays}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setCandidateRetentionDays(val);
                  onSaveSettings({
                    ...settings,
                    candidateArchiveRetentionDays: val
                  });
                  showNotification(`Candidate retention set to ${val} days`, 'success');
                }}
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none w-full sm:w-72"
              >
                <option value={0}>0 Days (Immediate Transfer / Turant Move)</option>
                <option value={4}>4 Days (4 Din ka Grace)</option>
                <option value={7}>7 Days (1 Week / 7 Din)</option>
                <option value={15}>15 Days (Half Month / 15 Din)</option>
                <option value={30}>30 Days (1 Month / 30 Din - Default)</option>
                <option value={60}>60 Days (2 Months / 60 Din)</option>
                <option value={90}>90 Days (3 Months / 90 Din)</option>
              </select>
            </div>

            {/* Attendance Retention Threshold */}
            <div className="p-3.5 bg-slate-50 dark:bg-[#0b1812] rounded-xl border border-slate-200 dark:border-[#1e3a2f] space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-xs font-bold text-slate-900 dark:text-white">
                    Attendance History Archive Retention Threshold
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    Itne din se purane attendance punch logs ko <code className="font-mono text-slate-800 dark:text-slate-200">Archive_Attendance</code> me bhej diya jayega.
                  </span>
                </div>
                <span className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900">
                  {selectedDaysThreshold} Days
                </span>
              </div>
              <select
                value={selectedDaysThreshold}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setSelectedDaysThreshold(val);
                  onSaveSettings({
                    ...settings,
                    attendanceArchiveRetentionDays: val
                  });
                  showNotification(`Attendance retention set to ${val} days`, 'success');
                }}
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-amber-500 focus:outline-none w-full sm:w-72"
              >
                <option value={4}>Older than 4 Days</option>
                <option value={7}>Older than 7 Days</option>
                <option value={15}>Older than 15 Days</option>
                <option value={30}>30 Days (1 Month)</option>
                <option value={60}>60 Days (2 Months)</option>
                <option value={90}>90 Days (3 Months)</option>
                <option value={180}>180 Days (6 Months - Default)</option>
                <option value={365}>365 Days (1 Year)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 1: CREATE NEW DEDICATED ARCHIVE GOOGLE SHEET */}
      {/* ------------------------------------------------------------- */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#11221b] border border-slate-200 dark:border-[#1e3a2f] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-[#1e3a2f] pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-xl">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Create Dedicated Archive Google Sheet
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Creates a separate spreadsheet with formatted archive tabs.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {/* Google Connection Status Banner */}
              <div className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs ${
                effectiveGoogleToken 
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300'
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${effectiveGoogleToken ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  <div>
                    <span className="font-bold block">
                      {effectiveGoogleToken ? 'Google Account Connected' : 'Google Authorization'}
                    </span>
                    <span className="text-[11px] opacity-80">
                      {effectiveGoogleToken ? 'Ready to auto-create spreadsheet in Google Drive' : 'Click Authorize or proceed with 1-Click Create'}
                    </span>
                  </div>
                </div>
                {!effectiveGoogleToken && (
                  <button
                    type="button"
                    onClick={obtainValidToken}
                    disabled={isAuthorizingGoogle}
                    className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs self-start sm:self-auto shrink-0"
                  >
                    {isAuthorizingGoogle ? <RefreshCw className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
                    <span>{isAuthorizingGoogle ? 'Authorizing...' : 'Authorize Google'}</span>
                  </button>
                )}
              </div>

              {/* Clear Explanation */}
              <div className="p-3 bg-blue-50/70 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900/50 space-y-1">
                <p className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Google Sheet Apne Aap Create Hoga:</span>
                </p>
                <p className="text-[11px] text-blue-800/80 dark:text-blue-300/80 leading-relaxed">
                  "Create & Connect Now" par click karte hi yeh system aapke Google Drive me <strong>HRMS Archive Database</strong> naam se ek brand-new Google Sheet <strong>automatically create kar dega</strong> aur use is app se connect kar dega.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Spreadsheet Name
                </label>
                <input
                  type="text"
                  value={newSheetTitle}
                  onChange={(e) => setNewSheetTitle(e.target.value)}
                  placeholder="e.g. HRMS_Archive_Database"
                  className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-slate-50 dark:bg-[#0b1812] rounded-xl border border-slate-200 dark:border-[#1e3a2f] space-y-1.5">
                <span className="text-[10px] font-black uppercase text-emerald-800 dark:text-emerald-400 tracking-wider block">
                  Tabs Automatically Initialized:
                </span>
                <ul className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span><strong>Archive_Employees</strong> (Left / Ex-Employees)</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span><strong>Archive_Candidates</strong> (Rejected Applications)</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span><strong>Archive_Attendance</strong> (Historical Logs)</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span><strong>Archive_Logs</strong> (Audit Trail)</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-[#1e3a2f]">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                disabled={isCreatingSheet || isAuthorizingGoogle}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateDedicatedSheet}
                disabled={isCreatingSheet || isAuthorizingGoogle}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer shadow-xs transition-all"
              >
                {isCreatingSheet || isAuthorizingGoogle ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>
                  {isAuthorizingGoogle
                    ? 'Authorizing Google...'
                    : isCreatingSheet
                    ? 'Creating Sheet in Google Drive...'
                    : (!effectiveGoogleToken ? 'Authorize & Create Sheet Now' : 'Create & Connect Now')}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 2: LINK EXISTING DEDICATED GOOGLE SHEET */}
      {/* ------------------------------------------------------------- */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#11221b] border border-slate-200 dark:border-[#1e3a2f] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-[#1e3a2f] pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-xl">
                  <Link className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Link Existing Google Spreadsheet
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Paste Google Sheet URL or ID to use as Dedicated Archive.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowLinkModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {/* Google Connection Status Banner */}
              <div className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs ${
                effectiveGoogleToken 
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300'
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${effectiveGoogleToken ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  <div>
                    <span className="font-bold block">
                      {effectiveGoogleToken ? 'Google Account Connected' : 'Google Authorization'}
                    </span>
                    <span className="text-[11px] opacity-80">
                      {effectiveGoogleToken ? 'Ready to verify and format sheet' : 'Click Authorize or proceed with Link'}
                    </span>
                  </div>
                </div>
                {!effectiveGoogleToken && (
                  <button
                    type="button"
                    onClick={obtainValidToken}
                    disabled={isAuthorizingGoogle}
                    className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs self-start sm:self-auto shrink-0"
                  >
                    {isAuthorizingGoogle ? <RefreshCw className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
                    <span>{isAuthorizingGoogle ? 'Authorizing...' : 'Authorize Google'}</span>
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Google Sheet URL or Spreadsheet ID
                </label>
                <input
                  type="text"
                  value={linkSheetInput}
                  onChange={(e) => setLinkSheetInput(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/1aBcD.../edit"
                  className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                />
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                The system will verify the spreadsheet and automatically create any missing archive sheets with formatted headers.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-[#1e3a2f]">
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                disabled={isLinkingSheet || isAuthorizingGoogle}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLinkExistingSheet}
                disabled={isLinkingSheet || isAuthorizingGoogle || !linkSheetInput.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer shadow-xs transition-all"
              >
                {isLinkingSheet || isAuthorizingGoogle ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>{isAuthorizingGoogle ? 'Authorizing Google...' : isLinkingSheet ? 'Verifying & Linking...' : 'Verify & Link Sheet'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 3: IN-APP CONFIRMATION DIALOG (Never blocked by iframe) */}
      {/* ------------------------------------------------------------- */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#11221b] border border-slate-200 dark:border-[#1e3a2f] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-xl shrink-0 ${
                confirmModal.variant === 'rose'
                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                  : confirmModal.variant === 'amber'
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                  : confirmModal.variant === 'indigo'
                  ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                  : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
              }`}>
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  {confirmModal.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                  {confirmModal.description}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-[#1e3a2f]">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                disabled={isProcessing}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const action = confirmModal.onConfirm;
                  setConfirmModal(null);
                  await action();
                }}
                disabled={isProcessing}
                className={`px-5 py-2 rounded-xl text-xs font-black text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                  confirmModal.variant === 'rose'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : confirmModal.variant === 'amber'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : confirmModal.variant === 'indigo'
                    ? 'bg-indigo-600 hover:bg-indigo-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {isProcessing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>{confirmModal.confirmLabel}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
