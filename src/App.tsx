import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  LogOut, 
  RefreshCw, 
  FileSpreadsheet, 
  Languages, 
  Users, 
  Calendar, 
  CreditCard, 
  TrendingUp,
  Briefcase,
  AlertCircle,
  Database,
  ArrowRight,
  Bell,
  Settings as SettingsIcon,
  ShieldCheck,
  User as LucideUser,
  CalendarDays,
  Eye,
  EyeOff,
  Lock,
  Building2,
  Sparkles,
  Globe,
  HelpCircle,
  Megaphone,
  Send,
  LifeBuoy,
  KeyRound,
  X,
  CheckCircle2,
  Menu,
  Mail,
  ChevronRight,
  Clock,
  UserCheck,
  PhoneCall,
  Monitor,
  Sun,
  Moon,
  UserPlus,
  Award,
  UserX,
  Package
} from 'lucide-react';
import { initAuth, googleSignIn, googleSignInRedirect, logout } from './services/auth';
import { 
  findSpreadsheet, 
  createSpreadsheet, 
  getSpreadsheetLink,
  fetchEmployees, 
  fetchAttendance, 
  fetchPayrollHistory, 
  saveEmployees, 
  saveAttendance, 
  savePayrollHistory,
  initHeaders,
  fetchAdminSettings,
  saveAdminSettings,
  fetchArchivedEmployeesFromSheets,
  fetchArchivedCandidatesFromSheets,
  fetchArchivedAttendanceFromSheets
} from './services/sheets';
import { Employee, Attendance, PayrollRecord, AdminSettings, SyncLog, FailedLoginAttempt, AuditLog, LeaveRequest, TransactionalEmailLog, UserRole, PortalUser, Candidate, ArchivedEmployeeRecord, ArchivedCandidateRecord } from './types';
import { saveToFirestore, loadFromFirestore } from './services/firestore';

//Unique device fingerprint generator for browser lock
const getDeviceFingerprint = (): string => {
  let fingerprint = localStorage.getItem('payroll_device_fingerprint');
  if (!fingerprint) {
    fingerprint = 'dev_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('payroll_device_fingerprint', fingerprint);
  }
  return fingerprint;
};

//Helper to detect human-readable Browser & Operating System
const getBrowserAndOSName = (): string => {
  const ua = navigator.userAgent;
  let browser = "Browser";
  let os = "OS";

  if (ua.indexOf("Firefox") > -1) {
    browser = "Firefox";
  } else if (ua.indexOf("SamsungBrowser") > -1) {
    browser = "Samsung Internet";
  } else if (ua.indexOf("Opera") > -1 || ua.indexOf("OPR") > -1) {
    browser = "Opera";
  } else if (ua.indexOf("Edge") > -1 || ua.indexOf("Edg") > -1) {
    browser = "Edge";
  } else if (ua.indexOf("Chrome") > -1) {
    browser = "Chrome";
  } else if (ua.indexOf("Safari") > -1) {
    browser = "Safari";
  }

  if (ua.indexOf("Windows NT 10.0") > -1) os = "Windows 10/11";
  else if (ua.indexOf("Windows NT 6.2") > -1) os = "Windows 8";
  else if (ua.indexOf("Windows NT 6.1") > -1) os = "Windows 7";
  else if (ua.indexOf("Macintosh") > -1) os = "macOS";
  else if (ua.indexOf("Android") > -1) os = "Android";
  else if (ua.indexOf("iPhone") > -1 || ua.indexOf("iPad") > -1) os = "iOS";
  else if (ua.indexOf("Linux") > -1) os = "Linux";

  return `${browser} (${os})`;
};

//Update an employee's loggedDevices list with the current device
const updateLoggedDevicesForEmployee = (emp: Employee, deviceId: string): Employee => {
  const browser = getBrowserAndOSName();
  const lastUsed = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
  const loggedDevices = emp.loggedDevices || [];

  const existingIdx = loggedDevices.findIndex(d => d.deviceId === deviceId);
  let updatedDevices = [...loggedDevices];
  if (existingIdx !== -1) {
    updatedDevices[existingIdx] = {
      deviceId,
      browser,
      lastUsed
    };
  } else {
    updatedDevices.push({
      deviceId,
      browser,
      lastUsed
    });
  }

  return {
    ...emp,
    loggedDevices: updatedDevices
  };
};

//Importing Tab Components
import Dashboard from './components/Dashboard';
import EmployeeList from './components/EmployeeList';
import AttendanceTracker from './components/AttendanceTracker';
import PayrollCalculator from './components/PayrollCalculator';
import Settings, { INITIAL_ADMIN_SETTINGS, DEFAULT_ROLE_PERMISSIONS } from './components/Settings';
import EmployeePortal from './components/EmployeePortal';
import LeavesHolidays from './components/LeavesHolidays';
import EmployeeLedger from './components/EmployeeLedger';
import NoticesSupport from './components/NoticesSupport';
import RichTextRenderer from './components/RichTextRenderer';
import FirebaseStorageMonitor from './components/FirebaseStorageMonitor';
import AdminWelcomeModal from './components/AdminWelcomeModal';
import HiringOnboarding from './components/HiringOnboarding';
import EmployeeLifecycleModule from './components/EmployeeLifecycleModule';
import ExitManagementModule from './components/ExitManagementModule';
import AssetManagementModule from './components/AssetManagementModule';
import { useModalBackHandler } from './utils/useHistoryBackHandler';

//PortalUser imported from ./types

//Merge utility functions to handle offline modifications merging back with Google Sheets
const isDefaultDemoEmployee = (emp: Employee): boolean => {
  const defaults = [
    { id: 'emp001', name: 'rajesh kumar' },
    { id: 'emp002', name: 'sunita sharma' },
    { id: 'emp003', name: 'amit patel' },
    { id: 'emp004', name: 'suresh kumar' }
  ];
  const targetId = emp.id.trim().toLowerCase();
  const targetName = emp.name.trim().toLowerCase();
  return defaults.some(d => d.id === targetId || d.name === targetName);
};

const mergeEmployees = (local: Employee[], remote: Employee[]): Employee[] => {
  if (remote.length === 0) return local;

  const merged = [...remote];
  local.forEach(localEmp => {
    const idx = merged.findIndex(e => e.id.trim().toLowerCase() === localEmp.id.trim().toLowerCase());
    if (idx > -1) {
      //Remote (Google Sheets) is the absolute source of truth.
      //Remote properties must override local stale default properties (e.g. Suresh Kumar vs Aashish Sahu)
      merged[idx] = { ...localEmp, ...merged[idx] };
    } else {
      //If employee exists in local but not remote, only merge if they are NOT a default demo employee
      if (!isDefaultDemoEmployee(localEmp)) {
        merged.push(localEmp);
      }
    }
  });
  return merged;
};

const mergeAttendance = (local: Attendance[], remote: Attendance[]): Attendance[] => {
  if (remote.length === 0) return local;

  const merged = [...remote];
  local.forEach(localRec => {
    const idx = merged.findIndex(r => r.employeeId.trim().toLowerCase() === localRec.employeeId.trim().toLowerCase() && r.date === localRec.date);
    if (idx > -1) {
      merged[idx] = { ...localRec, ...merged[idx] };
    } else {
      merged.push(localRec);
    }
  });
  return merged;
};

const mergePayroll = (local: PayrollRecord[], remote: PayrollRecord[]): PayrollRecord[] => {
  if (remote.length === 0) return local;

  const merged = [...remote];
  local.forEach(localRec => {
    const idx = merged.findIndex(r => r.employeeId.trim().toLowerCase() === localRec.employeeId.trim().toLowerCase() && r.monthYear === localRec.monthYear);
    if (idx > -1) {
      merged[idx] = { ...localRec, ...merged[idx] };
    } else {
      merged.push(localRec);
    }
  });
  return merged;
};

export function getDirectImageUrl(url: string | undefined): string {
  const fallback = ' //src/assets/images/rathi_favicon_1783945713829.jpg';
  if (!url || !url.trim()) return fallback;
  
  const trimmed = url.trim();
  
  //If it's already a local asset, data URL, or blob, return as is
  if (trimmed.startsWith(' //') || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }
  
  // Google Drive URL patterns:/1. /file/d/{ID}/view or /file/d/{ID}/edit or similar
  const fileDMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]{25,50})\//);
  if (fileDMatch && fileDMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${fileDMatch[1]}`;
  }
  
  // 2. id={ID} query parameter (e.g. open?id=..., uc?id=..., uc?export=download&id=...)
  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]{25,50})(?:[&/]|$)/);
  if (idMatch && idMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
  }
  
  return trimmed;
}

export default function App() {
  const [portalUser, setPortalUser] = useState<PortalUser | null>(() => {
    const saved = localStorage.getItem('payroll_portal_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse portal user session', e);
      }
    }
    return null;
  });

  const [needsAuth, setNeedsAuth] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [hasLoadedFromCloud, setHasLoadedFromCloud] = useState<boolean>(false);
  const [isDataModified, setIsDataModified] = useState<boolean>(false);

  //Theme Mode (LightDark) State
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('payroll_theme_mode') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    if (themeMode === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    localStorage.setItem('payroll_theme_mode', themeMode);
  }, [themeMode]);

  //Sheets Metadata
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(null);
  const [spreadsheetLink, setSpreadsheetLink] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');

  //Sync Status, Logs & Last Successful Sync
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>(() => {
    const saved = localStorage.getItem('payroll_sync_logs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse sync logs', e);
      }
    }
    return [
      {
        id: 'initial',
        timestamp: new Date().toISOString(),
        operation: 'System Initialization',
        status: 'success',
        details: 'Offline mode active, synced with local storage cache.'
      }
    ];
  });
  const [lastSuccessfulSyncTime, setLastSuccessfulSyncTime] = useState<string | null>(() => {
    return localStorage.getItem('payroll_last_success_sync') || null;
  });
  const [isSyncPanelOpen, setIsSyncPanelOpen] = useState(false);
  const [isBellPopoverOpen, setIsBellPopoverOpen] = useState(false);

  const addSyncLog = (operation: string, status: 'success' | 'error' | 'syncing', details: string) => {
    setSyncLogs(prev => {
      const newLog: SyncLog = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toISOString(),
        operation,
        status,
        details
      };
      const updated = [newLog, ...prev].slice(0, 50); //Keep last 50 logs
      localStorage.setItem('payroll_sync_logs', JSON.stringify(updated));
      return updated;
    });
    if (status === 'success') {
      const now = new Date().toISOString();
      setLastSuccessfulSyncTime(now);
      localStorage.setItem('payroll_last_success_sync', now);
    }
  };

  const handleRoleSwitch = (newRole: UserRole) => {
    if (!portalUser) return;
    const updatedUser: PortalUser = {
      ...portalUser,
      role: newRole,
      isPrimarySuperAdmin: true
    };
    setPortalUser(updatedUser);
    localStorage.setItem('payroll_portal_user', JSON.stringify(updatedUser));

    const allowed = (newRole === 'super_admin')
      ? ['dashboard', 'employees', 'hiring_onboarding', 'employee_lifecycle', 'asset_management', 'attendance', 'payroll', 'leaves', 'exit_management', 'ledger', 'admin', 'notices_support']
      : (adminSettings.rolePermissions?.[newRole] ?? DEFAULT_ROLE_PERMISSIONS[newRole] ?? []);

    const isTabAllowed = (tabId: string) => allowed.includes(tabId) || allowed.includes(`${tabId}:view`);

    if (!isTabAllowed(currentTab)) {
      const allTabs = ['dashboard', 'employees', 'hiring_onboarding', 'employee_lifecycle', 'asset_management', 'attendance', 'payroll', 'leaves', 'exit_management', 'ledger', 'notices_support', 'admin'] as const;
      const firstAllowedTab = allTabs.find(tab => isTabAllowed(tab));
      if (firstAllowedTab) {
        setCurrentTab(firstAllowedTab);
      }
    }
  };

  //Application Data States (with local cache fallbacks for instant offline load)
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('cached_employees');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Employee[];
        if (Array.isArray(parsed)) {
          const MOCK_EMP_IDS = new Set(['EMP001', 'EMP002', 'EMP003', 'EMP004']);
          const MOCK_EMP_NAMES = new Set(['Rajesh Kumar', 'Sunita Sharma', 'Amit Patel', 'Suresh Kumar']);
          const realOnly = parsed.filter(e => !(MOCK_EMP_IDS.has(e.id) && MOCK_EMP_NAMES.has(e.name)));
          localStorage.setItem('cached_employees', JSON.stringify(realOnly));
          return realOnly;
        }
      } catch (err) {
        console.error("Error parsing cached employees", err);
      }
    }
    return [];
  });

  const [attendance, setAttendance] = useState<Attendance[]>(() => {
    const saved = localStorage.getItem('cached_attendance');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Attendance[];
        if (Array.isArray(parsed)) {
          const MOCK_EMP_IDS = new Set(['EMP001', 'EMP002', 'EMP003', 'EMP004']);
          const realOnly = parsed.filter(a => !(MOCK_EMP_IDS.has(a.employeeId) && (a.remarks === 'Sick leave' || a.remarks === 'Personal chore' || a.remarks === 'On-time')));
          localStorage.setItem('cached_attendance', JSON.stringify(realOnly));
          return realOnly;
        }
      } catch (err) {
        console.error("Error parsing cached attendance", err);
      }
    }
    return [];
  });

  const [payroll, setPayroll] = useState<PayrollRecord[]>(() => {
    const saved = localStorage.getItem('cached_payroll');
    if (saved) {
      try {
        return JSON.parse(saved) as PayrollRecord[];
      } catch (err) {
        console.error("Error parsing cached payroll", err);
      }
    }
    return [];
  });

  //Unsuccessful login attempts state
  const [failedLogins, setFailedLogins] = useState<FailedLoginAttempt[]>(() => {
    const saved = localStorage.getItem('cached_failed_logins');
    return saved ? JSON.parse(saved) : [];
  });

  //User Audit Logs state
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('cached_audit_logs');
    return saved ? JSON.parse(saved) : [];
  });

  // Archive and Storage Optimization States
  const [archivedEmployees, setArchivedEmployees] = useState<ArchivedEmployeeRecord[]>(() => {
    const saved = localStorage.getItem('cached_archived_employees');
    return saved ? JSON.parse(saved) : [];
  });

  const [archivedCandidates, setArchivedCandidates] = useState<ArchivedCandidateRecord[]>(() => {
    const saved = localStorage.getItem('cached_archived_candidates');
    return saved ? JSON.parse(saved) : [];
  });

  const [archivedAttendance, setArchivedAttendance] = useState<Attendance[]>(() => {
    const saved = localStorage.getItem('cached_archived_attendance');
    return saved ? JSON.parse(saved) : [];
  });

  const [candidates, setCandidates] = useState<Candidate[]>(() => {
    const saved = localStorage.getItem('payroll_candidates');
    return saved ? JSON.parse(saved) : [];
  });

  const handleClearAuditLogs = () => {
    if (!portalUser || portalUser.role !== 'admin') {
      alert('Only Admin can clear audit logs!');
      return;
    }
    const deleteLog: AuditLog = {
      id: `audit-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
      actorUsername: portalUser.username,
      actorRole: portalUser.role,
      employeeId: 'SYSTEM',
      employeeName: 'ALL AUDIT LOGS',
      date: new Date().toISOString().substring(0, 10),
      actionType: 'delete_logs',
      fieldChanged: 'ALL',
      oldValue: `${auditLogs.length} logs existed`,
      newValue: '0 logs (Cleared)',
      remarks: 'All audit logs cleared by System Admin'
    };
    const cleared = [deleteLog];
    setAuditLogs(cleared);
    localStorage.setItem('cached_audit_logs', JSON.stringify(cleared));
    setIsDataModified(true);
    addSyncLog('Clear Audit Logs', 'success', 'All system audit logs cleared permanently.');
  };

  const handleAddAuditLogs = (newLogs: AuditLog[]) => {
    setAuditLogs(prev => {
      const updated = [...newLogs, ...prev];
      localStorage.setItem('cached_audit_logs', JSON.stringify(updated));
      return updated;
    });
    setIsDataModified(true);
  };

  //Transactional Email Logs state
  const [emailLogs, setEmailLogs] = useState<TransactionalEmailLog[]>(() => {
    const saved = localStorage.getItem('cached_email_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const addEmailLog = (log: TransactionalEmailLog) => {
    if (!log) return;
    setEmailLogs(prev => {
      if (prev.some(l => l.id === log.id)) return prev;
      const updated = [log, ...prev].slice(0, 300);
      localStorage.setItem('cached_email_logs', JSON.stringify(updated));
      return updated;
    });
    setIsDataModified(true);
  };

  const handleClearEmailLogs = async () => {
    if (!portalUser || portalUser.role !== 'admin') {
      alert('Only Admin can clear email history!');
      return;
    }
    setEmailLogs([]);
    localStorage.setItem('cached_email_logs', JSON.stringify([]));
    setIsDataModified(true);
    try {
      await fetch(' //api/email-logs/clear', { method: 'POST' });
    } catch (e) {
      console.warn('Failed to clear server email logs:', e);
    }
  };

  const handleSendTestEmail = async (recipient: string, type: 'OTP' | 'Welcome Message' | 'Custom Notice', subject: string, customBody?: string) => {
    try {
      const res = await fetch(' //api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: recipient,
          otp: type === 'OTP' ? Math.floor(100000 + Math.random() * 900000).toString() : '123456',
          empName: 'Recipient User',
          purpose: type === 'OTP' ? 'login' : 'custom_notice',
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
      const data = await res.json();
      if (data.logEntry) {
        addEmailLog(data.logEntry);
      }
      return { success: data.success, message: data.message, error: data.error };
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error' };
    }
  };

  const handleResendEmail = async (log: TransactionalEmailLog) => {
    try {
      const endpoint = log.type === 'Welcome Message' 
        ? ' //api/send-welcome' 
        : log.type === 'Leave Update' 
        ? ' //api/send-leave-update' 
        : ' //api/send-otp';
      
      const payload: any = {
        email: log.recipientEmail,
        empName: log.recipientName || 'Employee',
        language,
        smtpSettings: {
          host: adminSettings.smtpHost,
          port: adminSettings.smtpPort,
          username: adminSettings.smtpUsername,
          password: adminSettings.smtpPassword,
          senderName: adminSettings.senderName,
          senderEmail: adminSettings.senderEmail
        }
      };

      if (log.type === 'OTP') {
        payload.otp = log.otpCode || Math.floor(100000 + Math.random() * 900000).toString();
        payload.purpose = log.purpose?.includes('Reset') ? 'password_reset' : 'login';
      } else if (log.type === 'Welcome Message') {
        payload.empId = 'EMP_RESEND';
        payload.tempPassword = '••••••';
      } else if (log.type === 'Leave Update') {
        payload.leaveType = 'Leave Notice';
        payload.startDate = new Date().toISOString().substring(0, 10);
        payload.status = 'Approved';
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.logEntry) {
        addEmailLog(data.logEntry);
      }
      return { success: data.success, message: data.message, error: data.error };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to resend email' };
    }
  };

  //Portal login & enhanced login UX states
  const [rememberMe, setRememberMe] = useState<boolean>(() => {
    return localStorage.getItem('payroll_remember_me') === 'true';
  });
  const [loginId, setLoginId] = useState<string>(() => {
    if (localStorage.getItem('payroll_remember_me') === 'true') {
      return localStorage.getItem('payroll_remembered_login_id') || '';
    }
    return '';
  });
  const [loginPass, setLoginPass] = useState('');
  const [loginErr, setLoginErr] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showLoginHelp, setShowLoginHelp] = useState(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);
  const [showLoginNotice, setShowLoginNotice] = useState(true);

  //Corporate notices & support gateway states
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [supportSubmitted, setSupportSubmitted] = useState(false);
  const [forgotSubmitted, setForgotSubmitted] = useState(false);
  
  const [supportName, setSupportName] = useState('');
  const [supportEmpId, setSupportEmpId] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [supportMsg, setSupportMsg] = useState('');
  const [supportCategory, setSupportCategory] = useState('sign_in_issue');
  const [forgotEmpId, setForgotEmpId] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMobile, setForgotMobile] = useState('');
  const [forgotError, setForgotError] = useState<string | null>(null);

  //OTP Reset and OTP Login States
  const [lastSentEmail, setLastSentEmail] = useState<any>(null);
  const [showEmailViewer, setShowEmailViewer] = useState(false);
  const [fallbackOtpPayload, setFallbackOtpPayload] = useState<any | null>(null);
  
  //Forgot Password Self-Service Flow States
  const [forgotStep, setForgotStep] = useState<'request' | 'verify_otp' | 'new_password'>('request');
  const [forgotGeneratedOtp, setForgotGeneratedOtp] = useState('');
  const [forgotEnteredOtp, setForgotEnteredOtp] = useState('');
  const [forgotNewPass, setForgotNewPass] = useState('');
  const [isSendingForgotOtp, setIsSendingForgotOtp] = useState(false);

  //OTP Login Flow States
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');
  const [loginOtpStep, setLoginOtpStep] = useState<'request_otp' | 'enter_otp'>('request_otp');
  const [loginGeneratedOtp, setLoginGeneratedOtp] = useState('');
  const [loginEnteredOtp, setLoginEnteredOtp] = useState('');
  const [isSendingLoginOtp, setIsSendingLoginOtp] = useState(false);
  const [loginOtpEmail, setLoginOtpEmail] = useState('');
  const [loginMobileTab, setLoginMobileTab] = useState<'signin' | 'info'>('signin');
  const [infoSubTab, setInfoSubTab] = useState<'notices' | 'hr' | 'it' | 'rules'>('notices');

  //Password 2FA OTP States
  const [passwordLoginOtpStep, setPasswordLoginOtpStep] = useState<'password' | 'enter_otp'>('password');
  const [passwordLoginPendingUser, setPasswordLoginPendingUser] = useState<{
    type: 'admin' | 'role' | 'employee';
    userObj: any;
  } | null>(null);
  const [passwordLoginEnteredOtp, setPasswordLoginEnteredOtp] = useState('');
  const [isSendingPasswordLoginOtp, setIsSendingPasswordLoginOtp] = useState(false);

  //First-Time Login Security Verification States
  const [isFirstLoginVerification, setIsFirstLoginVerification] = useState<boolean>(false);
  const [firstLoginEmployee, setFirstLoginEmployee] = useState<Employee | null>(null);
  const [firstLoginStep, setFirstLoginStep] = useState<'select_option' | 'email_otp' | 'admin_approval'>('select_option');
  const [firstLoginGeneratedOtp, setFirstLoginGeneratedOtp] = useState<string>('');
  const [firstLoginEnteredOtp, setFirstLoginEnteredOtp] = useState<string>('');
  const [firstLoginAdminCode, setFirstLoginAdminCode] = useState<string>('');
  const [firstLoginSendingOtp, setFirstLoginSendingOtp] = useState<boolean>(false);

  const [announcements, setAnnouncements] = useState<any[]>(() => {
    const saved = localStorage.getItem('payroll_announcements');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(a => !['ann-1', 'ann-2', 'ann-3'].includes(a.id));
        }
      } catch (e) {}
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('payroll_announcements', JSON.stringify(announcements));
  }, [announcements]);

  const [hrTickets, setHrTickets] = useState<any[]>(() => {
    const saved = localStorage.getItem('payroll_hr_tickets');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(t => !['TKT-8274', 'TKT-3921'].includes(t.id));
        }
      } catch (e) {}
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('payroll_hr_tickets', JSON.stringify(hrTickets));
  }, [hrTickets]);

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => {
    const saved = localStorage.getItem('payroll_leave_requests');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as LeaveRequest[];
        if (Array.isArray(parsed)) {
          return parsed.filter(r => !['LRQ-1001', 'LRQ-1002'].includes(r.id));
        }
      } catch (e) {
        console.error("Error parsing leave requests", e);
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('payroll_leave_requests', JSON.stringify(leaveRequests));
  }, [leaveRequests]);

  const [passwordRequests, setPasswordRequests] = useState<any[]>(() => {
    const saved = localStorage.getItem('payroll_password_requests');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(r => r.id !== 'REQ-4819');
        }
      } catch (e) {}
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('payroll_password_requests', JSON.stringify(passwordRequests));
  }, [passwordRequests]);

  //Live time for login clock
  const [liveTime, setLiveTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  //We disable the automatic Google Sheets redirect on page load because it causes infinite redirect loops 
  //on custom/Render domains if the Authorized Domains list is not fully configured yet.
  //Instead, the administrator can stably click the "Authorize Google Sheets" button manually in the dashboard.
  useEffect(() => {
    //Automatic redirect is disabled to ensure maximum stability and offline-first usage.
    //The admin can manually click "Authorize Google Sheets" when ready.
  }, []);

  //Manage login-page-active class on body/html/root to allow scrolling on mobile when logged out
  useEffect(() => {
    const rootEl = document.getElementById('root');
    if (!portalUser) {
      document.documentElement.classList.add('login-page-active');
      document.body.classList.add('login-page-active');
      rootEl?.classList.add('login-page-active');
    } else {
      document.documentElement.classList.remove('login-page-active');
      document.body.classList.remove('login-page-active');
      rootEl?.classList.remove('login-page-active');
    }
    return () => {
      document.documentElement.classList.remove('login-page-active');
      document.body.classList.remove('login-page-active');
      rootEl?.classList.remove('login-page-active');
    };
  }, [portalUser]);

  //Sync state changes to local storage caches automatically
  useEffect(() => {
    localStorage.setItem('cached_employees', JSON.stringify(employees));
  }, [employees]);

  //Keep portalUser (employee profile) updated with latest employee details from employees state
  useEffect(() => {
    if (portalUser && portalUser.role === 'employee' && portalUser.id) {
      const currentEmp = employees.find(e => e.id.trim().toLowerCase() === portalUser.id.trim().toLowerCase());
      if (currentEmp) {
        const hasDiff = !portalUser.employee || 
                        portalUser.name !== currentEmp.name || 
                        portalUser.employee.department !== currentEmp.department ||
                        portalUser.employee.designation !== currentEmp.designation ||
                        portalUser.employee.basicSalary !== currentEmp.basicSalary ||
                        portalUser.employee.photoUrl !== currentEmp.photoUrl ||
                        JSON.stringify(portalUser.employee) !== JSON.stringify(currentEmp);
        if (hasDiff) {
          const updatedUser: PortalUser = {
            ...portalUser,
            name: currentEmp.name,
            employee: currentEmp
          };
          setPortalUser(updatedUser);
          localStorage.setItem('payroll_portal_user', JSON.stringify(updatedUser));
        }
      }
    }
  }, [employees, portalUser?.id, portalUser?.name, portalUser?.employee?.id]);

  useEffect(() => {
    localStorage.setItem('cached_attendance', JSON.stringify(attendance));
  }, [attendance]);

  useEffect(() => {
    localStorage.setItem('cached_payroll', JSON.stringify(payroll));
  }, [payroll]);

  useEffect(() => {
    localStorage.setItem('cached_failed_logins', JSON.stringify(failedLogins));
  }, [failedLogins]);

  //UI States
  const [isOnline, setIsOnline] = useState<boolean>(typeof window !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const [currentTab, setCurrentTab] = useState<'dashboard' | 'employees' | 'attendance' | 'payroll' | 'leaves' | 'admin' | 'ledger' | 'notices_support' | 'hiring_onboarding' | 'employee_lifecycle' | 'asset_management' | 'exit_management'>('dashboard');
  const [activeNoticeSubTab, setActiveNoticeSubTab] = useState<'announcements' | 'passwords' | 'tickets'>('announcements');

  //Helper for navigating between tabs with Browser History support (enables Browser Back button)
  const navigateToTab = (
    tab: 'dashboard' | 'employees' | 'attendance' | 'payroll' | 'leaves' | 'admin' | 'ledger' | 'notices_support' | 'hiring_onboarding' | 'employee_lifecycle' | 'asset_management' | 'exit_management',
    noticeSubTab?: 'announcements' | 'passwords' | 'tickets' | 'notices' | string
  ) => {
    const validNoticeSubTab = (noticeSubTab === 'notices' || !noticeSubTab)
      ? activeNoticeSubTab
      : (noticeSubTab as 'announcements' | 'passwords' | 'tickets');

    if (tab !== currentTab || (noticeSubTab && validNoticeSubTab !== activeNoticeSubTab)) {
      if (typeof window !== 'undefined') {
        window.history.pushState({ page: 'app', tab, activeNoticeSubTab: validNoticeSubTab }, '');
      }
      setCurrentTab(tab);
      if (validNoticeSubTab) {
        setActiveNoticeSubTab(validNoticeSubTab);
      }
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    //Set initial state in browser history stack
    if (!window.history.state || !window.history.state.tab) {
      window.history.replaceState({ page: 'app', tab: currentTab, activeNoticeSubTab }, '');
    }

    const handlePopState = (e: PopStateEvent) => {
      if (e.state && e.state.tab) {
        setCurrentTab(e.state.tab);
        if (e.state.activeNoticeSubTab) {
          setActiveNoticeSubTab(e.state.activeNoticeSubTab);
        }
      } else {
        setCurrentTab('dashboard');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [isSidebarHovered, setIsSidebarHovered] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [language, setLanguage] = useState<'en' | 'hi'>('en'); //Set default to English as bilingual toggle is disabled
  const [showSeedDialog, setShowSeedDialog] = useState<boolean>(false);
  const [showSheetsNotice, setShowSheetsNotice] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('dismiss_sheets_notice') !== 'true';
  });
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const [showPendingAlertModal, setShowPendingAlertModal] = useState<boolean>(false);

  //Register Back-Button Handlers for Modals and Mobile Sidebar Drawers
  useModalBackHandler(isMobileMenuOpen, () => setIsMobileMenuOpen(false), 'mobile-menu');
  useModalBackHandler(showSeedDialog, () => setShowSeedDialog(false), 'seed-dialog');
  useModalBackHandler(showPendingAlertModal, () => setShowPendingAlertModal(false), 'pending-alert-modal');
  useModalBackHandler(!!confirmDialog?.isOpen, () => setConfirmDialog(null), 'confirm-dialog');

  useEffect(() => {
    if (!portalUser || portalUser.role === 'employee') {
      setShowPendingAlertModal(false);
      return;
    }
    
    const pendingPasswords = passwordRequests.filter(r => r.status === 'Pending').length;
    const pendingTkts = hrTickets.filter(r => r.status === 'Pending').length;
    const totalPending = pendingPasswords + pendingTkts;

    const isDismissed = sessionStorage.getItem('dismissed_pending_alert') === 'true';

    if (totalPending > 0 && !isDismissed) {
      setShowPendingAlertModal(true);
    } else {
      setShowPendingAlertModal(false);
    }
  }, [portalUser, passwordRequests, hrTickets]);

  //Admin settings loaded from localStorage with standard static fallback
  const [adminSettings, setAdminSettings] = useState<AdminSettings>(() => {
    const saved = localStorage.getItem('payroll_admin_settings');
    if (saved) {
      try {
        return { ...INITIAL_ADMIN_SETTINGS, ...JSON.parse(saved) };
      } catch (e) {
        console.error('Failed to parse admin settings', e);
      }
    }
    return INITIAL_ADMIN_SETTINGS;
  });

  //Auto-redirect to first allowed tab based on user role permissions
  useEffect(() => {
    if (!portalUser) return;
    
    const userRole = portalUser.role || 'employee';
    const allowed = (userRole === 'super_admin')
      ? ['dashboard', 'employees', 'hiring_onboarding', 'employee_lifecycle', 'asset_management', 'attendance', 'payroll', 'leaves', 'exit_management', 'ledger', 'admin', 'notices_support']
      : adminSettings.rolePermissions?.[userRole] || DEFAULT_ROLE_PERMISSIONS[userRole] || [];
      
    const isAllowed = (tabId: string) => allowed.includes(tabId) || allowed.includes(`${tabId}:view`);
    
    if (!isAllowed(currentTab) && allowed.length > 0) {
      const allTabs = ['dashboard', 'employees', 'hiring_onboarding', 'employee_lifecycle', 'asset_management', 'attendance', 'payroll', 'leaves', 'exit_management', 'ledger', 'notices_support', 'admin'] as const;
      const firstAllowedTab = allTabs.find(tab => isAllowed(tab));
      if (firstAllowedTab) {
        setCurrentTab(firstAllowedTab);
      }
    }
  }, [portalUser, adminSettings, currentTab]);

  //State for Admin Welcome Boss Popup
  const [showAdminWelcomeModal, setShowAdminWelcomeModal] = useState(false);

  //Trigger Admin Welcome Popup once per session when Admin or Manager logs in
  useEffect(() => {
    if (
      portalUser &&
      portalUser.role !== 'employee' &&
      adminSettings.enableAdminWelcomePopup !== false
    ) {
      const hasShown = sessionStorage.getItem('has_shown_admin_welcome_popup');
      if (!hasShown) {
        setShowAdminWelcomeModal(true);
        sessionStorage.setItem('has_shown_admin_welcome_popup', 'true');
      }
    }
  }, [portalUser, adminSettings.enableAdminWelcomePopup]);

  //Dynamically update document title and favicon when company name or logo changes
  useEffect(() => {
    document.title = `${adminSettings.companyName || 'Rathi Buildmart'} - Payroll & Attendance Portal`;
    
    const updateFavicon = () => {
      //Remove any existing favicons to avoid conflicts
      const linkElements = document.querySelectorAll("link[rel*='icon']");
      linkElements.forEach(el => el.parentNode?.removeChild(el));
      
      //Create and append the new custom favicon
      const newLink = document.createElement('link');
      newLink.type = adminSettings.companyLogo ? 'image/png' : 'image/jpeg';
      newLink.rel = 'shortcut icon';
      newLink.href = getDirectImageUrl(adminSettings.companyLogo);
      document.getElementsByTagName('head')[0].appendChild(newLink);
    };
    
    updateFavicon();
  }, [adminSettings.companyName, adminSettings.companyLogo]);

  //Load global data from Firestore on startup to allow any device/browser to log in with up-to-date credentials
  useEffect(() => {
    const fetchGlobalData = async () => {
      try {
        const result = await loadFromFirestore();
        if (result && result.success && result.data) {
          const globalData = result.data;
          if (globalData.employees && globalData.employees.length > 0) {
            setEmployees(globalData.employees);
          }
          if (globalData.attendance && globalData.attendance.length > 0) {
            setAttendance(globalData.attendance);
          }
          if (globalData.payroll && globalData.payroll.length > 0) {
            setPayroll(globalData.payroll);
          }
          if (globalData.adminSettings) {
            setAdminSettings(prev => {
              const merged = { ...INITIAL_ADMIN_SETTINGS, ...prev, ...globalData.adminSettings };
              localStorage.setItem('payroll_admin_settings', JSON.stringify(merged));
              return merged;
            });
          }
          if (globalData.failedLogins) {
            setFailedLogins(globalData.failedLogins);
          }
          if (globalData.emailLogs && globalData.emailLogs.length > 0) {
            setEmailLogs(prev => {
              const map = new Map();
              [...globalData.emailLogs!, ...prev].forEach(l => map.set(l.id, l));
              const merged = Array.from(map.values()).slice(0, 300);
              localStorage.setItem('cached_email_logs', JSON.stringify(merged));
              return merged;
            });
          }
          if (globalData.spreadsheetId) {
            setSpreadsheetId(globalData.spreadsheetId);
          }
          if (globalData.spreadsheetLink) {
            setSpreadsheetLink(globalData.spreadsheetLink);
          }
          
          //Also fetch server-side recorded email logs
          try {
            const serverRes = await fetch(' //api/email-logs');
            const serverData = await serverRes.json();
            if (serverData.success && serverData.logs && serverData.logs.length > 0) {
              setEmailLogs(prev => {
                const map = new Map();
                [...serverData.logs, ...prev].forEach(l => map.set(l.id, l));
                const merged = Array.from(map.values()).slice(0, 300);
                localStorage.setItem('cached_email_logs', JSON.stringify(merged));
                return merged;
              });
            }
          } catch (e) {
            console.warn('Could not fetch server email logs on boot:', e);
          }

          console.log('Successfully loaded synced credentials from cloud Firestore');
        } else if (result && result.success && !result.data) {
          //Cloud Firestore is empty. Trigger a save so the baseline default employees/attendance
          //are automatically registered in the cloud database.
          setIsDataModified(true);
          console.log('Cloud Firestore is empty. Automatically syncing baseline default data to Firestore...');
        }
      } catch (err) {
        console.warn('Failed to load global data from Firestore on startup:', err);
      } finally {
        setHasLoadedFromCloud(true);
        //If we didn't trigger an automatic baseline sync, clear modified status
        //otherwise let the auto-save effect handle it and reset it.
      }
    };
    fetchGlobalData();
  }, []);

  //Synchronize state changes to Firestore when we have finished loading from the cloud and user has modified data
  useEffect(() => {
    if (!hasLoadedFromCloud || !isDataModified) return;

    const syncToCloud = async () => {
      try {
        await saveToFirestore({
          employees,
          attendance,
          payroll,
          adminSettings,
          failedLogins,
          emailLogs,
          spreadsheetId,
          spreadsheetLink
        });
        setIsDataModified(false);
        console.log('Central Firestore database synchronized successfully.');
      } catch (err) {
        console.warn('Auto-syncing to Firestore failed:', err);
      }
    };

    //Debounce cloud writes by 1.5 seconds to avoid rapid write limits
    const timer = setTimeout(() => {
      syncToCloud();
    }, 1500);

    return () => clearTimeout(timer);
  }, [employees, attendance, payroll, adminSettings, failedLogins, spreadsheetId, spreadsheetLink, hasLoadedFromCloud, isDataModified]);

  //Periodically fetch fresh data from Firestore to keep admin/employee views in sync in real-time
  useEffect(() => {
    if (!hasLoadedFromCloud || isDataModified) return;

    const interval = setInterval(async () => {
      try {
        const result = await loadFromFirestore();
        if (result && result.success && result.data) {
          const globalData = result.data;
          //Only update if something changed to avoid unnecessary re-renders
          if (globalData.employees && JSON.stringify(employees) !== JSON.stringify(globalData.employees)) {
            setEmployees(globalData.employees);
          }
          if (globalData.attendance && JSON.stringify(attendance) !== JSON.stringify(globalData.attendance)) {
            setAttendance(globalData.attendance);
          }
          if (globalData.payroll && JSON.stringify(payroll) !== JSON.stringify(globalData.payroll)) {
            setPayroll(globalData.payroll);
          }
          if (globalData.failedLogins && JSON.stringify(failedLogins) !== JSON.stringify(globalData.failedLogins)) {
            setFailedLogins(globalData.failedLogins);
          }
        }
      } catch (err) {
        console.warn('Failed to auto-refresh data from Firestore:', err);
      }
    }, 12000); //Check every 12 seconds

    return () => clearInterval(interval);
  }, [hasLoadedFromCloud, isDataModified, employees, attendance, payroll, failedLogins]);

  const handleSaveSettings = async (updated: AdminSettings) => {
    setAdminSettings(updated);
    setIsDataModified(true);
    localStorage.setItem('payroll_admin_settings', JSON.stringify(updated));
    if (spreadsheetId && token) {
      try {
        setSyncStatus('syncing');
        addSyncLog(
          'Save Settings',
          'syncing',
          'Saving updated workspace settings to Google Sheets...'
        );
        await saveAdminSettings(spreadsheetId, updated, token);
        setSyncStatus('synced');
        addSyncLog(
          'Save Settings',
          'success',
          'Workspace settings synced successfully to Google Sheets.'
        );
      } catch (e: any) {
        console.error('Failed to save settings to Google Sheets:', e);
        setSyncStatus('error');
        addSyncLog(
          'Save Settings',
          'error',
          `Failed to save settings: ${e?.message || e}`
        );
      }
    }
  };

  //Initialize Firebase Auth
  useEffect(() => {
    const unsubscribe = initAuth(
      (userInstance, accessToken) => {
        setUser(userInstance);
        setToken(accessToken);
        setNeedsAuth(false);
        setIsLoadingAuth(false);
      },
      (userInstance) => {
        setUser(userInstance);
        setToken(null);
        setNeedsAuth(true);
        setIsLoadingAuth(false);
      }
    );
    return () => unsubscribe();
  }, []);

  //SyncLoad data from Sheets when authenticated
  useEffect(() => {
    if (token) {
      loadApplicationData(token);
    }
  }, [token]);

  const loadApplicationData = async (accessToken: string) => {
    setIsLoadingData(true);
    setSyncStatus('syncing');
    addSyncLog(
      'Load Application Data',
      'syncing',
      'Initializing Google Sheets API connection and updating headers...'
    );
    try {
      //1. Find or create Spreadsheet
      let sheetId = await findSpreadsheet(accessToken);
      if (!sheetId) {
        sheetId = await createSpreadsheet(accessToken);
        //Newly created spreadsheet is empty, offer to seed demo data
        setShowSeedDialog(true);
      } else {
        //If the spreadsheet already exists, ensure all new headers/columns are added to row 1
        try {
          await initHeaders(sheetId, accessToken);
        } catch (e) {
          console.warn('Failed to update Google Sheet headers on load:', e);
        }
      }
      setSpreadsheetId(sheetId);

      //2. Get the web URL of the Google Sheet
      const webLink = await getSpreadsheetLink(sheetId, accessToken);
      setSpreadsheetLink(webLink);

      //3. Load Employees, Attendance, Payroll, and Admin Settings
      const fetchedEmployees = await fetchEmployees(sheetId, accessToken);
      const fetchedAttendance = await fetchAttendance(sheetId, accessToken);
      const fetchedPayroll = await fetchPayrollHistory(sheetId, accessToken);

      //Perform bidirectional merge to preserve offline modifications
      const mergedEmployees = mergeEmployees(employees, fetchedEmployees);
      const mergedAttendance = mergeAttendance(attendance, fetchedAttendance);
      const mergedPayroll = mergePayroll(payroll, fetchedPayroll);

      setEmployees(mergedEmployees);
      setAttendance(mergedAttendance);
      setPayroll(mergedPayroll);
      setIsDataModified(true);

      //Save merged results back to Google Sheets if they contain changes not present on remote
      if (mergedEmployees.length > fetchedEmployees.length || JSON.stringify(mergedEmployees) !== JSON.stringify(fetchedEmployees)) {
        try {
          await saveEmployees(sheetId, mergedEmployees, accessToken);
        } catch (e) {
          console.warn('Failed to sync merged employees back to Google Sheets:', e);
        }
      }
      if (mergedAttendance.length > fetchedAttendance.length || JSON.stringify(mergedAttendance) !== JSON.stringify(fetchedAttendance)) {
        try {
          await saveAttendance(sheetId, mergedAttendance, accessToken);
        } catch (e) {
          console.warn('Failed to sync merged attendance back to Google Sheets:', e);
        }
      }
      if (mergedPayroll.length > fetchedPayroll.length || JSON.stringify(mergedPayroll) !== JSON.stringify(fetchedPayroll)) {
        try {
          await savePayrollHistory(sheetId, mergedPayroll, accessToken);
        } catch (e) {
          console.warn('Failed to sync merged payroll back to Google Sheets:', e);
        }
      }

      //Load Settings from Google Sheets
      let activeSettings = adminSettings;
      try {
        const fetchedSettings = await fetchAdminSettings(sheetId, accessToken);
        if (fetchedSettings) {
          activeSettings = { ...INITIAL_ADMIN_SETTINGS, ...adminSettings, ...fetchedSettings };
          setAdminSettings(activeSettings);
          localStorage.setItem('payroll_admin_settings', JSON.stringify(activeSettings));
          //Ensure all 52 setting keys (SMTP, Rules, Roles, Automation) are populated in Google Sheets
          await saveAdminSettings(sheetId, activeSettings, accessToken);
        } else {
          //If the sheet doesn't have settings yet, write current local settings to Google Sheets
          await saveAdminSettings(sheetId, adminSettings, accessToken);
        }
      } catch (e) {
        console.warn('Failed to load/sync settings from Google Sheets:', e);
      }

      //Load Archived records from Google Sheets (either dedicated Archive Spreadsheet or main spreadsheet)
      try {
        const targetArchiveSheetId = (activeSettings.useDedicatedArchiveSheet && activeSettings.archiveSpreadsheetId)
          ? activeSettings.archiveSpreadsheetId
          : sheetId;

        const fetchedArchivedEmps = await fetchArchivedEmployeesFromSheets(targetArchiveSheetId, accessToken);
        if (fetchedArchivedEmps.length > 0) {
          setArchivedEmployees(fetchedArchivedEmps);
          localStorage.setItem('cached_archived_employees', JSON.stringify(fetchedArchivedEmps));
        }
        const fetchedArchivedCans = await fetchArchivedCandidatesFromSheets(targetArchiveSheetId, accessToken);
        if (fetchedArchivedCans.length > 0) {
          setArchivedCandidates(fetchedArchivedCans);
          localStorage.setItem('cached_archived_candidates', JSON.stringify(fetchedArchivedCans));
        }
        const fetchedArchivedAtt = await fetchArchivedAttendanceFromSheets(targetArchiveSheetId, accessToken);
        if (fetchedArchivedAtt.length > 0) {
          setArchivedAttendance(fetchedArchivedAtt);
          localStorage.setItem('cached_archived_attendance', JSON.stringify(fetchedArchivedAtt));
        }
      } catch (e) {
        console.warn('Failed to load archived sheets:', e);
      }

      //Sync portalUser with fresh details from Google Sheets
      if (portalUser && portalUser.role === 'employee') {
        const freshEmp = fetchedEmployees.find(e => e.id.trim().toLowerCase() === portalUser.id.trim().toLowerCase());
        if (freshEmp) {
          const updatedUser: PortalUser = { ...portalUser, name: freshEmp.name, employee: freshEmp };
          setPortalUser(updatedUser);
          localStorage.setItem('payroll_portal_user', JSON.stringify(updatedUser));
        }
      }

      //If existing employees are found, hide seed dialog
      if (fetchedEmployees.length > 0) {
        setShowSeedDialog(false);
      }

      //Force direct, immediate synchronization of loaded real data to central Firestore database
      //so other devices, browsers, and employee portals can access the real data immediately.
      try {
        await saveToFirestore({
          employees: mergedEmployees,
          attendance: mergedAttendance,
          payroll: mergedPayroll,
          adminSettings: activeSettings,
          failedLogins,
          spreadsheetId: sheetId,
          spreadsheetLink: webLink
        });
        setIsDataModified(false); //Directly saved, clear modified state
        console.log('Central Firestore database successfully synchronized with fresh Google Sheets data.');
      } catch (fErr) {
        console.warn('Failed to save fresh Google Sheets data directly to Firestore:', fErr);
      }

      setSyncStatus('synced');
      addSyncLog(
        'Data Loaded Successfully',
        'success',
        `Loaded ${mergedEmployees.length} employees, ${mergedAttendance.length} attendance, and ${mergedPayroll.length} payroll records.`
      );
    } catch (error: any) {
      console.warn('Failed to load Google Sheets data, checking Firestore fallback:', error);
      
      //Attempt Firestore fallback before flagging sync error
      try {
        const fsResult = await loadFromFirestore();
        if (fsResult && fsResult.success && fsResult.data) {
          if (fsResult.data.employees) setEmployees(fsResult.data.employees);
          if (fsResult.data.attendance) setAttendance(fsResult.data.attendance);
          if (fsResult.data.payroll) setPayroll(fsResult.data.payroll);
          if (fsResult.data.adminSettings) setAdminSettings(fsResult.data.adminSettings);
          setSyncStatus('synced');
          addSyncLog(
            'Loaded Active Cloud Database',
            'success',
            'Safely loaded active database from Cloud Firestore.'
          );
          return;
        }
      } catch (fErr) {
        console.warn('Firestore fallback check failed:', fErr);
      }

      setSyncStatus('error');
      addSyncLog(
        'Load Error',
        'error',
        `Failed to sync: ${error?.message || error}`
      );
      const errStr = String(error?.message || error);
      if (
        errStr.includes('401') || 
        errStr.includes('Unauthorized') || 
        errStr.includes('403') || 
        errStr.includes('invalid_grant') ||
        errStr.includes('Failed to fetch') ||
        errStr.includes('TypeError')
      ) {
        //Clear expired/invalid session token to prevent persistent lockout loops
        console.warn('Stale or blocked token detected, resetting sheets session state:', errStr);
        logout();
        setUser(null);
        setToken(null);
        setNeedsAuth(true);
      }
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleForceSyncNow = async () => {
    setIsLoadingData(true);
    setSyncStatus('syncing');
    const nowIso = new Date().toISOString();

    addSyncLog(
      'Force Sync Started',
      'syncing',
      'Synchronizing database collections with Cloud Firestore and Google Sheets...'
    );

    try {
      //1. First push local state to Cloud Firestore so unsaved local changes are preserved
      await saveToFirestore({
        employees,
        attendance,
        payroll,
        adminSettings,
        failedLogins,
        spreadsheetId,
        spreadsheetLink,
        lastUpdated: nowIso
      });

      //2. If Google OAuth token is active, save to Google Sheets and refresh
      if (token) {
        await loadApplicationData(token);
      } else {
        //3. Otherwise reload fresh state from Cloud Firestore
        const fsResult = await loadFromFirestore();
        if (fsResult && fsResult.success && fsResult.data) {
          const globalData = fsResult.data;
          if (globalData.employees) setEmployees(globalData.employees);
          if (globalData.attendance) setAttendance(globalData.attendance);
          if (globalData.payroll) setPayroll(globalData.payroll);
          if (globalData.adminSettings) setAdminSettings(prev => ({ ...prev, ...globalData.adminSettings }));
          if (globalData.failedLogins) setFailedLogins(globalData.failedLogins);
          if (globalData.spreadsheetId) setSpreadsheetId(globalData.spreadsheetId);
          if (globalData.spreadsheetLink) setSpreadsheetLink(globalData.spreadsheetLink);
        }
      }

      setSyncStatus('synced');
      setIsDataModified(false);
      setLastSuccessfulSyncTime(nowIso);
      localStorage.setItem('payroll_last_success_sync', nowIso);

      addSyncLog(
        'Force Sync Completed',
        'success',
        `All collections successfully synchronized at ${new Date().toLocaleTimeString()}.`
      );

      alert(
        'Database successfully synchronized with Cloud Firestore & Google Sheets!'
      );
    } catch (err: any) {
      console.error('Force Sync error:', err);
      setSyncStatus('error');
      const errMsg = err?.message || String(err);
      addSyncLog(
        'Force Sync Failed',
        'error',
        `Sync failed: ${errMsg}`
      );
      alert(
        `Sync failed: ${errMsg}`
      );
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        setNeedsAuth(false);
      }
    } catch (err) {
      console.error('Google Sign in failed', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const sendPassword2faOtp = async (email: string, userObj: any, type: 'admin' | 'role' | 'employee', name: string) => {
    setLoginErr(null);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setLoginGeneratedOtp(otp);
    setLoginOtpEmail(email);
    setPasswordLoginPendingUser({ type, userObj });
    setIsSendingPasswordLoginOtp(true);

    try {
      const res = await fetch(' //api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          otp,
          empName: name,
          purpose: 'login_2fa',
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
      
      let data;
      try {
        data = await res.json();
      } catch (err) {
        try {
          const text = await res.text();
          data = { success: false, error: text || `Server error ${res.status}` };
        } catch (e2) {
          data = { success: false, error: `Server error ${res.status}` };
        }
      }

      setIsSendingPasswordLoginOtp(false);
      if (data.logEntry) addEmailLog(data.logEntry);
      if (data.success) {
        setPasswordLoginOtpStep('enter_otp');
        if (data.method === 'SIMULATION') {
          setLastSentEmail(data.debugPayload);
          setShowEmailViewer(true);
        }
      } else {
        setLoginErr(data.error || 'Failed to dispatch login 2FA OTP.');
        if (data.smtpError && data.debugPayload) {
          setFallbackOtpPayload(data.debugPayload);
        }
      }
    } catch (err: any) {
      console.error('[2FA Login OTP Send Error]', err);
      setIsSendingPasswordLoginOtp(false);
      setLoginErr(`Network error sending 2FA OTP: ${err.message || err}`);
    }
  };

  const handlePortalLogout = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Sign Out',
      message: 'Are you sure you want to log out from the portal?',
      onConfirm: () => {
        setPortalUser(null);
        localStorage.removeItem('payroll_portal_user');
        sessionStorage.removeItem('has_shown_admin_welcome_popup');
        if (localStorage.getItem('payroll_remember_me') === 'true') {
          setLoginId(localStorage.getItem('payroll_remembered_login_id') || '');
        } else {
          setLoginId('');
        }
        setCurrentTab('dashboard');
        setConfirmDialog(null);
      }
    });
  };

  const recordUnsuccessfulLogin = async (enteredId: string, reason: 'Incorrect Password' | 'User ID not found' | 'Admin Incorrect Password' | 'Account pending approval' | 'Device lock active') => {
    const newAttempt: FailedLoginAttempt = {
      id: `fail-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      enteredId,
      timestamp: new Date().toISOString(),
      reason,
      browserInfo: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
    };
    const updatedFailures = [newAttempt, ...(failedLogins || [])];
    setFailedLogins(updatedFailures);
    setIsDataModified(true);

    //Sync to Firestore immediately so that admin sees the device approval alert instantly
    try {
      await saveToFirestore({
        employees,
        attendance,
        payroll,
        adminSettings,
        failedLogins: updatedFailures,
        spreadsheetId,
        spreadsheetLink
      });
    } catch (err) {
      console.warn("Immediate failed login sync failed:", err);
    }
  };

  const handleClearFailedLogins = () => {
    setFailedLogins([]);
    setIsDataModified(true);
  };

  const handleImportDatabase = async (importedData: any) => {
    try {
      const { employees: importedEmps, attendance: importedAtt, payroll: importedPay, adminSettings: importedSettings } = importedData;

      const newEmps = Array.isArray(importedEmps) ? importedEmps : employees;
      const newAtt = Array.isArray(importedAtt) ? importedAtt : attendance;
      const newPay = Array.isArray(importedPay) ? importedPay : payroll;
      const newSettings = importedSettings && typeof importedSettings === 'object' ? importedSettings : adminSettings;

      setEmployees(newEmps);
      setAttendance(newAtt);
      setPayroll(newPay);
      setAdminSettings(newSettings);
      
      setIsDataModified(true);
      
      await saveToFirestore({
        employees: newEmps,
        attendance: newAtt,
        payroll: newPay,
        adminSettings: newSettings,
        failedLogins
      });

      localStorage.removeItem('dismiss_sheets_notice');
      setShowSheetsNotice(true);
    } catch (err: any) {
      console.error("Import failed in App", err);
      alert("Failed to import database: " + (err?.message || err));
    }
  };

  const handleClearSheetsSession = () => {
    try {
      logout();
      localStorage.removeItem('google_access_token');
      localStorage.removeItem('google_access_token_expires_at');
      setToken(null);
      setNeedsAuth(true);
      setSyncStatus('idle');
    } catch (err) {
      console.error("Clear sheets session failed", err);
    }
  };

  const handleLogout = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Sign Out Admin',
      message: 'Are you sure you want to sign out from the Admin Dashboard?',
      onConfirm: async () => {
        setPortalUser(null);
        localStorage.removeItem('payroll_portal_user');
        sessionStorage.removeItem('has_shown_admin_welcome_popup');
        if (localStorage.getItem('payroll_remember_me') === 'true') {
          setLoginId(localStorage.getItem('payroll_remembered_login_id') || '');
        } else {
          setLoginId('');
        }
        setCurrentTab('dashboard');
        setConfirmDialog(null);

        try {
          await logout();
          setUser(null);
          setToken(null);
          setNeedsAuth(true);
        } catch (err) {
          console.error('Logout error', err);
        }
      }
    });
  };

  //Seeding sample data
  const handleSeedDemoData = async () => {
    setIsLoadingData(true);
    setSyncStatus('syncing');

    try {
      const sampleEmployees: Employee[] = [
        {
          id: 'EMP001',
          name: 'Rajesh Kumar',
          department: 'Management',
          designation: 'Senior Supervisor',
          joiningDate: '2025-01-10',
          basicSalary: 38000,
          allowances: 3500,
          deductions: 1500,
          hourlyRate: 150,
          paymentMethod: 'Bank Transfer',
          isActive: true,
        },
        {
          id: 'EMP002',
          name: 'Sunita Sharma',
          department: 'Finance',
          designation: 'Accounts Executive',
          joiningDate: '2025-06-15',
          basicSalary: 28000,
          allowances: 2000,
          deductions: 1000,
          hourlyRate: 120,
          paymentMethod: 'Bank Transfer',
          isActive: true,
        },
        {
          id: 'EMP003',
          name: 'Amit Patel',
          department: 'Operations',
          designation: 'Dispatch Officer',
          joiningDate: '2026-02-01',
          basicSalary: 18000,
          allowances: 1500,
          deductions: 800,
          hourlyRate: 100,
          paymentMethod: 'Cash',
          isActive: true,
        }
      ];

      //Seed 5 days of attendance for current month
      const currentMonth = new Date().toISOString().slice(0, 7); //YYYY-MM
      const sampleAttendance: Attendance[] = [];
      
      for (let day = 1; day <= 5; day++) {
        const dateStr = `${currentMonth}-${String(day).padStart(2, '0')}`;
        sampleEmployees.forEach((emp, index) => {
          //Rajesh & Sunita present, Amit absent on day 3
          const isAbsent = day === 3 && index === 2;
          const isHalfDay = day === 4 && index === 1;

          sampleAttendance.push({
            date: dateStr,
            employeeId: emp.id,
            status: isAbsent ? 'Absent' : isHalfDay ? 'Half Day' : 'Present',
            checkIn: isAbsent ? '' : '09:00',
            checkOut: isAbsent ? '' : isHalfDay ? '13:30' : '18:30', //worked some overtime
            overtimeHours: (!isAbsent && !isHalfDay && index === 0) ? 0.5 : 0,
            remarks: isAbsent ? 'Sick leave' : isHalfDay ? 'Personal chore' : 'On-time'
          });
        });
      }

      //Save Employees and Attendance to sheets if connected
      if (spreadsheetId && token) {
        addSyncLog(
          'Seed Database',
          'syncing',
          'Writing sample employees and attendance history...'
        );
        await saveEmployees(spreadsheetId, sampleEmployees, token);
        await saveAttendance(spreadsheetId, sampleAttendance, token);
      }

      //Reload
      setEmployees(sampleEmployees);
      setAttendance(sampleAttendance);
      setIsDataModified(true);
      setShowSeedDialog(false);
      setSyncStatus('synced');
      addSyncLog(
        'Seed Database',
        'success',
        'Seeded 3 demo employees and 5 days of attendance history.'
      );
    } catch (err: any) {
      console.error('Error seeding demo data', err);
      addSyncLog(
        'Seed Database Error',
        'error',
        `Failed to seed: ${err?.message || err}`
      );
      if (spreadsheetId && token) {
        alert('Failed to seed demo data to Sheets.');
      } else {
        alert('Failed to seed demo data.');
      }
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleAddLeaveRequest = (newRequest: LeaveRequest) => {
    setLeaveRequests(prev => {
      const updated = [newRequest, ...prev];
      localStorage.setItem('payroll_leave_requests', JSON.stringify(updated));
      return updated;
    });
    setIsDataModified(true);
    addSyncLog('Apply for Leave', 'success', `Leave request ${newRequest.id} submitted for ${newRequest.employeeName}.`);
  };

  const handleUpdateLeaveRequestStatus = async (id: string, status: 'Approved' | 'Rejected', remarks?: string) => {
    let affectedReq: LeaveRequest | undefined;
    
    setLeaveRequests(prev => {
      const updated = prev.map(req => {
        if (req.id === id) {
          affectedReq = {
            ...req,
            status,
            remarks: remarks || '',
            approvedBy: portalUser?.name || 'Administrator'
          };
          return affectedReq;
        }
        return req;
      });
      localStorage.setItem('payroll_leave_requests', JSON.stringify(updated));
      return updated;
    });

    if (affectedReq) {
      setIsDataModified(true);
      addSyncLog('Process Leave Request', 'success', `Leave request ${id} has been ${status.toLowerCase()}.`);

      //If approved, insert or update the corresponding days in the attendance state
      if (status === 'Approved') {
        const empId = affectedReq.employeeId;
        const start = new Date(affectedReq.startDate);
        const end = new Date(affectedReq.endDate);
        const lType = affectedReq.leaveType;

        //Generate all dates in range
        const dates: string[] = [];
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          dates.push(d.toISOString().split('T')[0]);
        }

        setAttendance(prev => {
          const updated = [...prev];
          dates.forEach(dStr => {
            const idx = updated.findIndex(r => r.employeeId === empId && r.date === dStr);
            let attStatus: 'Present' | 'Absent' | 'Half Day' | 'Leave' | 'Miss Punch' = 'Leave';
            let checkIn = '';
            let checkOut = '';

            if (lType === 'Half Day (Before Lunch)') {
              attStatus = 'Half Day';
              checkIn = '13:30';
              checkOut = '18:30';
            } else if (lType === 'Half Day (After Lunch)') {
              attStatus = 'Half Day';
              checkIn = '09:00';
              checkOut = '13:30';
            } else if (lType === 'Late Coming') {
              attStatus = 'Present';
              checkIn = '10:30'; //Late marking
              checkOut = '18:30';
            } else if (lType === 'Early Going') {
              attStatus = 'Present';
              checkIn = '09:00';
              checkOut = '16:00'; //Early departure
            }

            if (idx >= 0) {
              updated[idx] = {
                ...updated[idx],
                status: attStatus,
                checkIn: checkIn || updated[idx].checkIn || '',
                checkOut: checkOut || updated[idx].checkOut || '',
                remarks: `${lType} Approved: ${affectedReq?.reason || ''}`
              };
            } else {
              updated.push({
                date: dStr,
                employeeId: empId,
                status: attStatus,
                checkIn,
                checkOut,
                overtimeHours: 0,
                remarks: `${lType} Approved: ${affectedReq?.reason || ''}`,
                approvalStatus: 'Approved'
              });
            }
          });
          localStorage.setItem('cached_attendance', JSON.stringify(updated));
          return updated;
        });
      }

      //Trigger outbound SMTP/simulation email to the employee
      const emp = employees.find(e => e.id === affectedReq?.employeeId);
      if (emp && emp.email && emp.email.trim()) {
        try {
          const res = await fetch(' //api/send-leave-update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: emp.email.trim(),
              empName: emp.name,
              leaveType: affectedReq.leaveType,
              startDate: affectedReq.startDate,
              endDate: affectedReq.endDate,
              status: affectedReq.status,
              approvedBy: affectedReq.approvedBy,
              remarks: affectedReq.remarks,
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
          const data = await res.json();
          if (data.logEntry) addEmailLog(data.logEntry);
          if (data.success && data.method === 'SIMULATION') {
            setLastSentEmail(data.debugPayload);
            setShowEmailViewer(true);
          }
        } catch (e) {
          console.error("Failed to dispatch leave update email", e);
        }
      }
    }
  };

  //Callback functions for syncing mutations
  const handleAddEmployee = async (newEmp: Employee) => {
    //Dispatch Welcome Email Notification
    if (newEmp.email && newEmp.email.trim()) {
      fetch(' //api/send-welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newEmp.email.trim(),
          empId: newEmp.id,
          empName: newEmp.name,
          tempPassword: newEmp.password || '123456',
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
      })
      .then(res => res.json())
      .then(data => {
        console.log('Welcome email API response:', data);
        if (data.logEntry) addEmailLog(data.logEntry);
        if (data.success && data.method === 'SIMULATION') {
          setLastSentEmail(data.debugPayload);
          setShowEmailViewer(true);
        }
      })
      .catch(err => console.error('Welcome email dispatch error:', err));
    }

    const updated = [...employees, newEmp];
    setEmployees(updated);
    setIsDataModified(true);
    if (!spreadsheetId || !token) {
      setSyncStatus('synced');
      addSyncLog(
        'Add Employee (Local)',
        'success',
        `Added ${newEmp.name} to local database (offline).`
      );
      return;
    }
    setSyncStatus('syncing');
    addSyncLog(
      'Add Employee',
      'syncing',
      `Saving employee ${newEmp.name} to Google Sheets...`
    );
    try {
      await saveEmployees(spreadsheetId, updated, token);
      setSyncStatus('synced');
      addSyncLog(
        'Add Employee',
        'success',
        `Employee ${newEmp.name} successfully saved in Sheets.`
      );
    } catch (err: any) {
      setSyncStatus('error');
      addSyncLog(
        'Add Employee Error',
        'error',
        `Failed to save ${newEmp.name}: ${err?.message || err}`
      );
      throw err;
    }
  };

  const handleBulkAddEmployees = async (newEmployees: Employee[]) => {
    const updated = [...employees];
    newEmployees.forEach(newEmp => {
      const idx = updated.findIndex(emp => emp.id.trim().toLowerCase() === newEmp.id.trim().toLowerCase());
      if (idx > -1) {
        updated[idx] = newEmp;
      } else {
        updated.push(newEmp);
      }
    });

    setEmployees(updated);
    setIsDataModified(true);
    if (!spreadsheetId || !token) {
      setSyncStatus('synced');
      addSyncLog(
        'Bulk Add (Local)',
        'success',
        `Imported ${newEmployees.length} employees to local database (offline).`
      );
      return;
    }
    setSyncStatus('syncing');
    addSyncLog(
      'Bulk Add Employees',
      'syncing',
      `Saving ${newEmployees.length} employees to Google Sheets...`
    );
    try {
      await saveEmployees(spreadsheetId, updated, token);
      setSyncStatus('synced');
      addSyncLog(
        'Bulk Add Employees',
        'success',
        `Successfully saved ${newEmployees.length} employees in Sheets.`
      );
    } catch (err: any) {
      setSyncStatus('error');
      addSyncLog(
        'Bulk Add Error',
        'error',
        `Failed to bulk add: ${err?.message || err}`
      );
      throw err;
    }
  };

  const handleDeleteEmployee = async (empIdToDelete: string) => {
    const targetEmp = employees.find(e => e.id === empIdToDelete);
    const updated = employees.filter(emp => emp.id !== empIdToDelete);
    setEmployees(updated);
    setIsDataModified(true);
    if (!spreadsheetId || !token) {
      setSyncStatus('synced');
      addSyncLog(
        'Delete Employee (Local)',
        'success',
        `Deleted employee ${targetEmp?.name || empIdToDelete} from local database.`
      );
      return;
    }
    setSyncStatus('syncing');
    addSyncLog(
      'Delete Employee',
      'syncing',
      `Removing ${targetEmp?.name || empIdToDelete} from Google Sheets...`
    );
    try {
      await saveEmployees(spreadsheetId, updated, token);
      setSyncStatus('synced');
    } catch (err: any) {
      setSyncStatus('error');
      throw err;
    }
  };

  const handleUpdateEmployee = async (updatedEmp: Employee, oldEmpId?: string) => {
    const targetId = oldEmpId || updatedEmp.id;
    const updated = employees.map(emp => (emp.id === targetId || emp.id === updatedEmp.id) ? updatedEmp : emp);
    setEmployees(updated);

    if (oldEmpId && oldEmpId !== updatedEmp.id) {
      setAttendance(prev => prev.map(a => a.employeeId === oldEmpId ? { ...a, employeeId: updatedEmp.id } : a));
      setPayroll(prev => prev.map(p => p.employeeId === oldEmpId ? { ...p, employeeId: updatedEmp.id } : p));
      setLeaveRequests(prev => prev.map(l => l.employeeId === oldEmpId ? { ...l, employeeId: updatedEmp.id } : l));
      setPasswordRequests(prev => prev.map(p => p.empId === oldEmpId ? { ...p, empId: updatedEmp.id } : p));
      setHrTickets(prev => prev.map(t => t.empId === oldEmpId ? { ...t, empId: updatedEmp.id } : t));
    }

    setIsDataModified(true);
    if (!spreadsheetId || !token) {
      setSyncStatus('synced');
      addSyncLog(
        'Update Employee (Local)',
        'success',
        `Updated ${updatedEmp.name} (${updatedEmp.id}) details in local database (offline).`
      );
      return;
    }
    setSyncStatus('syncing');
    addSyncLog(
      'Update Employee',
      'syncing',
      `Saving details for ${updatedEmp.name} to Google Sheets...`
    );
    try {
      await saveEmployees(spreadsheetId, updated, token);
      setSyncStatus('synced');
      addSyncLog(
        'Update Employee',
        'success',
        `Details for ${updatedEmp.name} successfully updated in Sheets.`
      );
    } catch (err: any) {
      setSyncStatus('error');
      addSyncLog(
        'Update Employee Error',
        'error',
        `Failed to update ${updatedEmp.name}: ${err?.message || err}`
      );
      throw err;
    }
  };

  const handleSaveAttendance = async (date: string, records: Attendance[]) => {
    //Filter out old records for this specific date and append/overwrite new ones
    const filteredOld = attendance.filter(r => r.date !== date);
    const combined = [...filteredOld, ...records];
    
    setAttendance(combined);
    setIsDataModified(true);
    if (!spreadsheetId || !token) {
      setSyncStatus('synced');
      addSyncLog(
        'Save Attendance (Local)',
        'success',
        `Saved ${records.length} attendance records for ${date} (offline).`
      );
      return;
    }
    setSyncStatus('syncing');
    addSyncLog(
      'Save Attendance',
      'syncing',
      `Saving ${records.length} attendance records for ${date} to Google Sheets...`
    );
    try {
      await saveAttendance(spreadsheetId, combined, token);
      setSyncStatus('synced');
      addSyncLog(
        'Save Attendance',
        'success',
        `Attendance for ${date} successfully saved in Sheets.`
      );
    } catch (err: any) {
      setSyncStatus('error');
      addSyncLog(
        'Save Attendance Error',
        'error',
        `Failed to save attendance: ${err?.message || err}`
      );
      throw err;
    }
  };

  const handleUpdateAttendanceRecords = async (updatedRecords: Attendance[]) => {
    const updated = attendance.map(rec => {
      const match = updatedRecords.find(ur => ur.employeeId === rec.employeeId && ur.date === rec.date);
      return match ? { ...rec, ...match } : rec;
    });

    updatedRecords.forEach(ur => {
      const exists = updated.some(rec => rec.employeeId === ur.employeeId && rec.date === ur.date);
      if (!exists) {
        updated.push(ur);
      }
    });

    setAttendance(updated);
    setIsDataModified(true);
    if (!spreadsheetId || !token) {
      setSyncStatus('synced');
      addSyncLog(
        'Update Attendance (Local)',
        'success',
        `Updated ${updatedRecords.length} attendance logs (offline).`
      );
      return;
    }
    setSyncStatus('syncing');
    addSyncLog(
      'Update Attendance Logs',
      'syncing',
      `Saving ${updatedRecords.length} attendance updates to Google Sheets...`
    );
    try {
      await saveAttendance(spreadsheetId, updated, token);
      setSyncStatus('synced');
      addSyncLog(
        'Update Attendance Logs',
        'success',
        `Attendance updates successfully saved in Sheets.`
      );
    } catch (err: any) {
      setSyncStatus('error');
      addSyncLog(
        'Attendance Update Error',
        'error',
        `Failed to update attendance: ${err?.message || err}`
      );
      throw err;
    }
  };

  const handleSavePayroll = async (records: PayrollRecord[]) => {
    setPayroll(records);
    setIsDataModified(true);
    if (!spreadsheetId || !token) {
      setSyncStatus('synced');
      addSyncLog(
        'Save Payroll (Local)',
        'success',
        `Saved ${records.length} payroll records locally (offline).`
      );
      return;
    }
    setSyncStatus('syncing');
    addSyncLog(
      'Save Payroll History',
      'syncing',
      `Saving ${records.length} payroll history items to Google Sheets...`
    );
    try {
      await savePayrollHistory(spreadsheetId, records, token);
      setSyncStatus('synced');
      addSyncLog(
        'Save Payroll History',
        'success',
        `Payroll history successfully updated in Sheets.`
      );
    } catch (err: any) {
      setSyncStatus('error');
      addSyncLog(
        'Payroll Sync Error',
        'error',
        `Failed to save payroll history: ${err?.message || err}`
      );
      throw err;
    }
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'hi' : 'en');
  };

  //Translations
  const uiTexts = {
    appName: "Payroll Portal",
    tagline: "Secure Employee Payroll & Attendance Tracking synced to Google Sheets",
    googleSheets: "Google Sheets",
    sheetsConnected: "Google Sheets connected",
    viewSheets: "View Spreadsheet",
    signout: "Sign out",
    dashboard: "Dashboard",
    employees: "Employees",
    attendance: "Attendance",
    payroll: "Salary & Payroll",
    adminSettings: "Admin Settings",
    leaves: "Leaves & Holidays",
    ledger: "Employee Ledger",
    syncing: "Syncing...",
    synced: "Saved in Sheets",
    syncError: "Sync Error!",
    refresh: "Force Refresh",
    welcomeBack: "Payroll Management Portal",
    googleSignIn: "Sign in with Google",
    secureDriveSheets: "Securely connects to your personal Google Drive & Google Sheets with permissions.",
    seedingTitle: "New Database Created!",
    seedingDesc: "We found an empty sheet named 'Payroll_Management_System_Data' in your Google Drive. Would you like to seed 3 demo employees and 5 days of attendance history so you can see how calculations and charts work immediately?",
    seedYes: "Yes, Seed Demo Data",
    seedNo: "No, keep it blank",
    benefitOffline: "Cloud Storage",
    benefitOfflineText: "All payroll sheets are created and saved directly inside your personal Google Drive account.",
    benefitHinglish: "Bilingual System",
    benefitHinglishText: "Built with comprehensive Hindi & English translation toggles for seamless business control.",
    benefitSlips: "Professional Payslips",
    benefitSlipsText: "Auto-calculate pro-rated salaries, deductions, overtime, and generate beautiful printable receipts.",
  };

  //1. Loading Portal Session state
  if (!portalUser && isLoadingAuth) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-extrabold text-slate-500 uppercase tracking-widest font-mono">Loading Portal Workspace...</p>
      </div>
    );
  }

  //2. Render Custom Login Screen if not authenticated via Portal
  if (!portalUser) {
    const formattedTime = liveTime.toLocaleTimeString('en-US', { 
      timeZone: 'Asia/Kolkata',
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: true 
    });
    const formattedDate = liveTime.toLocaleDateString('en-US', { 
      timeZone: 'Asia/Kolkata',
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:grid lg:grid-cols-12 font-sans relative overflow-y-auto lg:overflow-hidden selection:bg-emerald-500/30 selection:text-emerald-100 login-screen">
        
        {/* Mobile View Header & Tab Switcher (Visible on mobile/tablet only, hidden on desktop) */}
        <div className="lg:hidden flex flex-col gap-1 p-1.5 bg-slate-950/95 border-b border-slate-800/80 sticky top-0 z-40 backdrop-blur-md">
          <div className="flex items-center justify-between w-full px-1">
            <div className="flex items-center gap-1.5">
              <img 
                src={getDirectImageUrl(adminSettings.companyLogo)} 
                alt="Logo" 
                className="w-5 h-5 rounded object-cover shadow-md ring-1 ring-emerald-400/25"
                referrerPolicy="no-referrer" />
              <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-100 font-display">
                {adminSettings.companyName || 'Rathi Build Mart'}
              </span>
            </div>

            {/* Compact Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="px-1.5 py-0.5 rounded text-[8px] font-black bg-slate-900 border border-slate-800 text-slate-200 transition-all duration-150 cursor-pointer shrink-0"
            >
              🌐 {'English'}
            </button>
          </div>

          {/* Main Switcher */}
          <div className="flex bg-slate-900 border border-slate-800 rounded p-0.5 w-full">
            <button
              type="button"
              onClick={() => setLoginMobileTab('signin')}
              className={`flex-1 text-center py-0.5 rounded text-[8px] font-black uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                loginMobileTab === 'signin'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🔑 {'Sign In'}
            </button>
            <button
              type="button"
              onClick={() => setLoginMobileTab('info')}
              className={`flex-1 text-center py-0.5 rounded text-[8px] font-black uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                loginMobileTab === 'info'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              📢 {'Notices & Info'}
            </button>
          </div>
        </div>

        {/* Top-Right Language Switcher (Visible on desktop/large screens only) */}
        <div className="hidden lg:block absolute top-4 right-4 z-50">
          <button
            onClick={toggleLanguage}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-slate-900/80 backdrop-blur-md hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 transition-all duration-150 cursor-pointer shadow-md active:scale-95"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>{'English'}</span>
          </button>
        </div>

        {/* LEFT PANEL - Beautiful Brand Showcase (5 Columns) */}
        <div className={`lg:col-span-5 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-4 pb-12 md:p-12 lg:p-16 flex flex-col justify-between relative overflow-y-auto lg:overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800/80 shrink-0 min-h-[340px] lg:min-h-screen ${
          loginMobileTab === 'info' ? 'flex' : 'hidden lg:flex'
        }`}>
          {/* Subtle Glowing Background Accents */}
          <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 -right-40 w-80 h-80 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />
          
          {/* Top Brand Logo header */}
          <div className="flex items-center gap-3 relative z-10">
            <img 
              src={getDirectImageUrl(adminSettings.companyLogo)} 
              alt={adminSettings.companyName || 'Rathi Buildmart'} 
              className="w-10 h-10 rounded-2xl object-cover shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400/25"
              referrerPolicy="no-referrer" />
            <div>
              <h1 className="text-sm font-black uppercase tracking-widest text-slate-100 font-display">
                {adminSettings.companyName || 'Rathi Build Mart'}
              </h1>
              <p className="text-[9px] font-black tracking-widest uppercase text-emerald-400 font-mono mt-0.5">
                {'Secure Payroll Portal'}
              </p>
            </div>
          </div>

          {/* Middle Content - Display HeaderStats */}
          <div className="my-auto py-3 md:py-8 lg:py-0 relative z-10 max-w-sm">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-2 uppercase tracking-wider">
              <Sparkles className="w-3 h-3 animate-pulse" />
              {'SaaS Level Security'}
            </span>
            <h2 className="text-xl md:text-2xl lg:text-4xl font-black text-white font-display tracking-tight leading-tight">
              {'Modern payroll & attendance workspace.'}
            </h2>
            <p className="mt-2 text-[10.5px] md:text-xs text-slate-400 leading-relaxed font-semibold">
              {'Empowering employees with self-service receipt printing, real-time leaves requests, and secure administrator portal ledger reviews.'}
            </p>
 
            {/* Quick Live stats cards */}
            <div className="grid grid-cols-2 gap-2 mt-4 md:mt-8">
              <div className="bg-slate-900/60 backdrop-blur-xs border border-slate-800/80 p-2.5 rounded-lg">
                <span className="text-[8px] font-black uppercase tracking-wider text-slate-500 block">
                  {'Active Roster'}
                </span>
                <span className="text-xs font-black text-white font-mono block mt-0.5">
                  {employees.filter(e => e.isActive !== false).length} {'Staff'}
                </span>
              </div>
              <div className="bg-slate-900/60 backdrop-blur-xs border border-slate-800/80 p-2.5 rounded-lg">
                <span className="text-[8px] font-black uppercase tracking-wider text-slate-500 block">
                  {'System Status'}
                </span>
                <span className="inline-flex items-center gap-1 text-[10.5px] font-black text-emerald-400 mt-1">
                  <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                  {'Operational'}
                </span>
              </div>
            </div>
 
            {/* Notice & Announcement Board with Sub-tabs */}
            <div className="mt-4 border-t border-slate-800/40 pt-3.5 md:mt-6 md:pt-5 space-y-3">
              {/* Info Sub-tabs switcher */}
              <div className="flex bg-slate-950/60 border border-slate-850/80 rounded-lg p-0.5 w-full">
                <button
                  type="button"
                  onClick={() => setInfoSubTab('notices')}
                  className={`flex-1 text-center py-1 rounded text-[7.5px] md:text-[9px] font-black uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                    infoSubTab === 'notices'
                      ? 'bg-slate-850 text-emerald-400 shadow-sm border border-slate-800/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  📢 {'Notices'}
                </button>
                <button
                  type="button"
                  onClick={() => setInfoSubTab('hr')}
                  className={`flex-1 text-center py-1 rounded text-[7.5px] md:text-[9px] font-black uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                    infoSubTab === 'hr'
                      ? 'bg-slate-850 text-emerald-400 shadow-sm border border-slate-800/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  👤 {'HR Help'}
                </button>
                <button
                  type="button"
                  onClick={() => setInfoSubTab('it')}
                  className={`flex-1 text-center py-1 rounded text-[7.5px] md:text-[9px] font-black uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                    infoSubTab === 'it'
                      ? 'bg-slate-850 text-teal-400 shadow-sm border border-slate-800/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  💻 {'IT Mgmt'}
                </button>
                <button
                  type="button"
                  onClick={() => setInfoSubTab('rules')}
                  className={`flex-1 text-center py-1 rounded text-[7.5px] md:text-[9px] font-black uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                    infoSubTab === 'rules'
                      ? 'bg-slate-850 text-emerald-400 shadow-sm border border-slate-800/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ⏱️ {'Timings'}
                </button>
              </div>

              {/* Sub-tab content - Announcements */}
              {infoSubTab === 'notices' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-slate-400">
                      <Megaphone className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                      {'Notice Board & Circulars'}
                    </span>
                    <span className="text-[7.5px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      {announcements.filter(a => (!a.scheduledDate || a.scheduledDate <= new Date().toISOString().split('T')[0]) && (!a.expiryDate || a.expiryDate >= new Date().toISOString().split('T')[0])).length} {'Active'}
                    </span>
                  </div>

                  <div className="space-y-2 max-h-[160px] md:max-h-[140px] overflow-y-auto pr-1 select-none custom-scrollbar">
                    {(() => {
                      const todayStr = new Date().toISOString().split('T')[0];
                      const activeList = announcements.filter(ann => {
                        if (ann.scheduledDate && ann.scheduledDate > todayStr) return false;
                        if (ann.expiryDate && ann.expiryDate < todayStr) return false;
                        return true;
                      }).sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));

                      if (activeList.length === 0) {
                        return (
                          <p className="text-[10px] text-slate-500 italic">
                            {'No active company announcements at this time.'}
                          </p>
                        );
                      }

                      return activeList.map((ann) => {
                        let badgeBg = 'bg-slate-900 border-slate-800 text-slate-400';
                        if (ann.badge === 'Critical') badgeBg = 'bg-rose-950/40 border-rose-900/30 text-rose-400';
                        if (ann.badge === 'Urgent') badgeBg = 'bg-rose-950/60 border-rose-800 text-rose-300';
                        if (ann.badge === 'Holiday') badgeBg = 'bg-amber-950/40 border-amber-900/30 text-amber-400';
                        if (ann.badge === 'Policy') badgeBg = 'bg-sky-950/40 border-sky-900/30 text-sky-400';
                        
                        return (
                          <div key={ann.id} className={`p-2.5 rounded-lg transition-all border ${ann.isPinned ? 'bg-amber-950/20 border-amber-500/30' : 'bg-slate-900/40 hover:bg-slate-900/70 border-slate-800/80'}`}>
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-[11px] font-bold text-slate-200 line-clamp-1 flex items-center gap-1">
                                {ann.isPinned && <span className="text-amber-400 text-[9px]" title="Pinned">📌</span>}
                                {language === 'en' ? ann.title : ann.titleHi}
                              </h4>
                              <span className={`text-[7.5px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${badgeBg} shrink-0`}>
                                {language === 'en' ? ann.badge : ann.badgeHi}
                              </span>
                            </div>
                            <RichTextRenderer
                              content={language === 'en' ? ann.content : ann.contentHi}
                              className="text-[9.5px] text-slate-300 dark:text-slate-300 mt-1" />
                            <div className="flex justify-between items-center mt-1.5 pt-1 border-t border-slate-800/40">
                              <span className="text-[8px] font-mono text-slate-500">📅 {ann.scheduledDate || ann.date}</span>
                              {ann.attachmentUrl ? (
                                <a href={ann.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-[8px] font-bold text-emerald-400 hover:underline flex items-center gap-0.5">
                                  <span>📎 Document</span>
                                </a>
                              ) : (
                                <span className="text-[7.5px] text-slate-500 italic">HR Department</span>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}

              {/* Sub-tab content - HR Support Detail */}
              {infoSubTab === 'hr' && (
                <div className="space-y-2">
                  <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-slate-400">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                    {'Human Resources (HR) Support'}
                  </span>
                  <div className="bg-slate-900/40 border border-slate-800/80 p-2.5 rounded-lg space-y-2.5 max-h-[170px] md:max-h-[150px] overflow-y-auto custom-scrollbar">
                    {/* Managed By Info */}
                    <div>
                      <span className="text-[7.5px] font-black uppercase tracking-widest text-slate-500 block">
                        {'HR Department Head'}
                      </span>
                      <p className="text-[10px] font-bold text-slate-200 mt-0.5">
                        {adminSettings.hrContactManager || 'Rathi HR Helpdesk'}
                      </p>
                      <p className="text-[9px] text-slate-400 mt-0.5 leading-normal">
                        {'Contact HR for salary slip queries, leave approvals, attendance records, and company policies.'}
                      </p>
                    </div>

                    {/* HR Contact Direct Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-slate-800/50 pt-2">
                      <a
                        href={`tel:${(adminSettings.hrContactPhone || '+91 91111 22222').replace(/\s+/g, '')}`}
                        className="flex items-center justify-center gap-1.5 bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold text-[9.5px] py-2 px-2.5 rounded-lg transition-all shadow-sm active:scale-95 cursor-pointer text-center"
                      >
                        <PhoneCall className="w-3.5 h-3.5 shrink-0 text-white" />
                        <span>{'Call HR'}: {adminSettings.hrContactPhone || '+91 91111 22222'}</span>
                      </a>

                      <a
                        href={`mailto:${adminSettings.hrContactEmail || 'hr@rathibuildmart.com'}`}
                        className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-750 text-emerald-300 hover:text-white font-bold text-[9.5px] py-2 px-2.5 rounded-lg border border-slate-700/80 transition-all active:scale-95 cursor-pointer truncate text-center"
                      >
                        <Mail className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                        <span className="truncate">{'Email HR'}</span>
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-tab content - IT Management Detail */}
              {infoSubTab === 'it' && (
                <div className="space-y-2">
                  <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-slate-400">
                    <Monitor className="w-3.5 h-3.5 text-teal-400" />
                    {'IT Management & System Desk'}
                  </span>
                  <div className="bg-slate-900/40 border border-slate-800/80 p-2.5 rounded-lg space-y-2.5 max-h-[170px] md:max-h-[150px] overflow-y-auto custom-scrollbar">
                    {/* Managed By Info */}
                    <div>
                      <span className="text-[7.5px] font-black uppercase tracking-widest text-slate-500 block">
                        {'IT ManagerTech Desk'}
                      </span>
                      <p className="text-[10px] font-bold text-slate-200 mt-0.5">
                        {adminSettings.itContactManager || 'Rathi IT Management Desk'}
                      </p>
                      <p className="text-[9px] text-slate-400 mt-0.5 leading-normal">
                        {'Contact IT Management for login issues, password reset, device restriction unblock, and software support.'}
                      </p>
                    </div>

                    {/* IT Contact Direct Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-slate-800/50 pt-2">
                      <a
                        href={`tel:${(adminSettings.itContactPhone || '+91 98888 77777').replace(/\s+/g, '')}`}
                        className="flex items-center justify-center gap-1.5 bg-teal-600/90 hover:bg-teal-500 text-white font-bold text-[9.5px] py-2 px-2.5 rounded-lg transition-all shadow-sm active:scale-95 cursor-pointer text-center"
                      >
                        <PhoneCall className="w-3.5 h-3.5 shrink-0 text-white" />
                        <span>{'Call IT Desk'}: {adminSettings.itContactPhone || '+91 98888 77777'}</span>
                      </a>

                      <a
                        href={`mailto:${adminSettings.itContactEmail || 'it.support@rathibuildmart.com'}`}
                        className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-750 text-teal-300 hover:text-white font-bold text-[9.5px] py-2 px-2.5 rounded-lg border border-slate-700/80 transition-all active:scale-95 cursor-pointer truncate text-center"
                      >
                        <Mail className="w-3.5 h-3.5 shrink-0 text-teal-400" />
                        <span className="truncate">{'Email IT Desk'}</span>
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-tab content - Attendance Timings & Rules */}
              {infoSubTab === 'rules' && (
                <div className="space-y-2">
                  <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    {'Attendance Policies & Shifts'}
                  </span>
                  <div className="bg-slate-900/40 border border-slate-800/80 p-2.5 rounded-lg space-y-2 max-h-[150px] md:max-h-[130px] overflow-y-auto custom-scrollbar">
                    {/* Timings */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[9.5px]">
                        <span className="text-slate-400 font-bold">{'Standard Shift'}</span>
                        <span className="text-emerald-400 font-mono font-black">{adminSettings.rulesShiftTiming || '09:30 AM - 06:30 PM'}</span>
                      </div>
                      <div className="flex items-center justify-between text-[9.5px]">
                        <span className="text-slate-400 font-bold">{'Half-Day Slot'}</span>
                        <span className="text-amber-400 font-mono font-black">
                          {language === 'en' 
                            ? (adminSettings.rulesHalfDaySlot || 'Before 01:30 PM')
                            : (adminSettings.rulesHalfDaySlot === 'Before 01:30 PM' || !adminSettings.rulesHalfDaySlot ? 'Before 01:30 PM' : adminSettings.rulesHalfDaySlot)}
                        </span>
                      </div>
                    </div>

                    {/* Rule points */}
                    <div className="border-t border-slate-800/50 pt-2 space-y-1">
                      <span className="text-[7.5px] font-black uppercase tracking-widest text-slate-500 block">
                        {'Crucial Punch Policies'}
                      </span>
                      <ul className="list-disc pl-3 text-[9px] text-slate-400 space-y-0.5 font-semibold">
                        <li>
                          {`Clock in by ${adminSettings.rulesLatePunchGrace || '09:45 AM'} to avoid auto late flag.`}
                        </li>
                        <li>
                          {'Every 3 late punches will mark a automatic half-day.'}
                        </li>
                        <li>
                          {`Check out after ${adminSettings.rulesShiftTiming?.split('-')?.[1]?.trim() || '06:30 PM'} to complete the standard day roster.`}
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
 
          {/* Bottom Live Workspace Clock */}
          <div className="relative z-10 border-t border-slate-800/60 pt-3.5 mt-4 md:pt-6 md:mt-6 lg:mt-0 pb-12 lg:pb-0">
            <span className="text-[8px] font-black uppercase tracking-wider text-slate-500 block mb-1">
              {'System Reference Time'}
            </span>
            <div className="flex items-center gap-2">
              <div className="bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded-lg font-mono text-[10.5px] font-bold text-emerald-400 tracking-wider shadow-sm flex items-center justify-center min-w-[95px]">
                {formattedTime}
              </div>
              <div className="text-[9px] text-slate-400 font-bold leading-tight">
                <span className="block">{formattedDate}</span>
                <span className="text-slate-500 text-[8px] font-semibold">IST (UTC+05:30) • {'Secure Connection'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL - Secure Sign In Card (7 Columns) */}
        <div className={`lg:col-span-7 bg-slate-900 p-6 md:p-12 lg:p-16 flex flex-col justify-center items-center relative min-h-[500px] ${
          loginMobileTab === 'signin' ? 'flex' : 'hidden lg:flex'
        }`}>
          {/* Abstract background grids */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />
          
          <div className="w-full max-w-md relative z-10">
            
            {/* Main Login Card */}
            <div className="bg-slate-950/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500" />
              
              {/* Header */}
              <div className="space-y-1.5 text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest bg-emerald-950/50 text-emerald-400 border border-emerald-900/30">
                  <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                  {'Secure Gateway'}
                </div>
                <h3 className="text-2xl font-black text-white font-display tracking-tight mt-2 leading-none">
                  {'Sign In to Portal'}
                </h3>
                <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                  {'Enter your unique Employee ID or administrator credentials to enter the workspace.'}
                </p>
              </div>

              {/* Login Screen AnnouncementNotice Banner */}
              {showLoginNotice && (
                <div className="mt-4 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-indigo-950/80 border border-emerald-500/30 rounded-xl p-3.5 shadow-md relative group animate-fadeIn">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg shrink-0 mt-0.5 border border-emerald-500/30">
                        <Megaphone className="w-4 h-4 animate-bounce" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 font-mono">
                            {'Portal Notice & Operational Update'}
                          </span>
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        </div>
                        <p className="text-[11px] font-semibold text-slate-200 leading-snug">
                          {adminSettings.noticeMessage || (
                            '📢 Monthly Payroll & Attendance logs updated for current cycle. Sign in using your Employee ID or request Email OTP.'
                          )}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowLoginNotice(false)}
                      className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer shrink-0"
                      title="Dismiss Announcement"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Error Alert Box */}
              {loginErr && (
                <div className="bg-rose-500/10 text-rose-300 border border-rose-500/20 p-3.5 rounded-xl text-xs font-semibold flex flex-col gap-2.5 mt-5">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5 animate-bounce" />
                    <span className="leading-normal">{loginErr}</span>
                  </div>
                  {fallbackOtpPayload && (
                    <div className="pt-2 border-t border-rose-500/10 flex flex-col gap-2">
                      <p className="text-[10px] text-slate-300 font-medium">
                        {'SMTP Dispatch failed. You can bypass this using the Developer Fallback Sandbox:'}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setLastSentEmail(fallbackOtpPayload);
                          setShowEmailViewer(true);
                          setFallbackOtpPayload(null);
                          setLoginErr(null);
                          if (isFirstLoginVerification) {
                            setFirstLoginStep('email_otp');
                          } else if (loginMethod === 'otp') {
                            setLoginOtpStep('enter_otp');
                          } else {
                            setPasswordLoginOtpStep('enter_otp');
                          }
                        }}
                        className="self-start text-[10px] px-3 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 rounded-lg cursor-pointer font-bold uppercase tracking-wider transition-all"
                      >
                        {'Bypass & View OTP in Sandbox'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* First-Time Login Security Verification vs Standard Forms */}
              {isFirstLoginVerification && firstLoginEmployee ? (
                <div className="space-y-5 mt-6 animate-fadeIn text-white">
                  <div className="bg-slate-900 border border-slate-800 p-4.5 rounded-xl text-center space-y-2">
                    <div className="inline-flex p-2 bg-emerald-500/10 text-emerald-400 rounded-full">
                      <Lock className="w-5 h-5 animate-pulse" />
                    </div>
                    <h4 className="text-sm font-black text-white uppercase tracking-wider font-mono">
                      {'First-Time Login Security Setup'}
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-normal font-semibold">
                      {'For your security, you must bind your device on your first login. Please choose one verification method below.'}
                    </p>
                  </div>

                  {firstLoginStep === 'select_option' && (
                    <div className="space-y-3 animate-fadeIn">
                      {/* Option 1: Email OTP */}
                      <button
                        type="button"
                        onClick={async () => {
                          setLoginErr(null);
                          if (!firstLoginEmployee.email || !firstLoginEmployee.email.trim()) {
                            setLoginErr('No email address registered. Please use HR/Admin approval.');
                            return;
                          }

                          const otp = Math.floor(100000 + Math.random() * 900000).toString();
                          setFirstLoginGeneratedOtp(otp);
                          setFirstLoginSendingOtp(true);

                          try {
                            const res = await fetch(' //api/send-otp', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                email: firstLoginEmployee.email.trim(),
                                otp,
                                empName: firstLoginEmployee.name,
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
                            
                            let data;
                            try {
                              data = await res.json();
                            } catch (err) {
                              try {
                                const text = await res.text();
                                data = { success: false, error: text || `Server error ${res.status}` };
                              } catch (e2) {
                                data = { success: false, error: `Server error ${res.status}` };
                              }
                            }

                            setFirstLoginSendingOtp(false);
                            if (data.logEntry) addEmailLog(data.logEntry);
                            if (data.success) {
                              setFirstLoginStep('email_otp');
                              if (data.method === 'SIMULATION') {
                                setLastSentEmail(data.debugPayload);
                                setShowEmailViewer(true);
                              }
                            } else {
                              setLoginErr(data.error || 'Failed to dispatch verification OTP.');
                              if (data.smtpError && data.debugPayload) {
                                setFallbackOtpPayload(data.debugPayload);
                              }
                            }
                          } catch (err: any) {
                            console.error('[First Login Security OTP Send Error]', err);
                            setFirstLoginSendingOtp(false);
                            setLoginErr(`Network error sending OTP: ${err.message || err}`);
                          }
                        }}
                        disabled={firstLoginSendingOtp}
                        className="w-full text-left p-4.5 bg-slate-905 hover:bg-slate-800 border border-slate-800 rounded-xl cursor-pointer transition-all flex items-center justify-between group disabled:opacity-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg group-hover:bg-emerald-500/20 transition-all">
                            <Mail className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="block text-xs font-black text-white font-mono uppercase tracking-wider">
                              {'Option 1: Email OTP'}
                            </span>
                            <span className="block text-[10px] text-slate-400 font-semibold mt-0.5">
                              {`Send code to ${firstLoginEmployee.email ? firstLoginEmployee.email.replace(/(.{3})(.*)(@.*)/, "$1***$3") : 'registered email'}`}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-all transform group-hover:translate-x-1" />
                      </button>

                      {/* Option 2: HR/Admin Approval */}
                      <button
                        type="button"
                        onClick={async () => {
                          setLoginErr(null);
                          let code = firstLoginEmployee.pendingDeviceApprovalCode || '';
                          if (!code) {
                            code = Math.floor(100000 + Math.random() * 900000).toString();
                          }
                          const updated = {
                            ...firstLoginEmployee,
                            pendingDeviceApprovalCode: code,
                            pendingDeviceApprovalOtp: firstLoginEmployee.pendingDeviceApprovalOtp || ''
                          };
                          
                          setFirstLoginEmployee(updated);
                          setFirstLoginStep('admin_approval');

                          //Sync to server immediately so the Admin sees it
                          try {
                            const updatedEmps = employees.map(e => e.id === updated.id ? updated : e);
                            setEmployees(updatedEmps);
                            await saveToFirestore({
                              employees: updatedEmps,
                              attendance,
                              payroll,
                              adminSettings,
                              failedLogins,
                              spreadsheetId,
                              spreadsheetLink
                            });
                          } catch (err) {
                            console.warn("Failed to sync pending code to Firestore:", err);
                          }
                        }}
                        className="w-full text-left p-4.5 bg-slate-905 hover:bg-slate-800 border border-slate-800 rounded-xl cursor-pointer transition-all flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-lg group-hover:bg-indigo-500/20 transition-all">
                            <Users className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="block text-xs font-black text-white font-mono uppercase tracking-wider">
                              {'Option 2: HR/Admin Approval'}
                            </span>
                            <span className="block text-[10px] text-slate-400 font-semibold mt-0.5">
                              {'Generate request code to share with HR/Admin'}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-all transform group-hover:translate-x-1" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsFirstLoginVerification(false);
                          setFirstLoginEmployee(null);
                          setLoginErr(null);
                        }}
                        className="w-full text-center text-[10px] uppercase font-bold text-slate-500 hover:text-slate-300 mt-2 py-2 cursor-pointer transition-colors"
                      >
                        {'Cancel & Return to Login'}
                      </button>
                    </div>
                  )}

                  {firstLoginStep === 'email_otp' && (
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      setLoginErr(null);
                      if (firstLoginEnteredOtp.trim() === firstLoginGeneratedOtp) {
                        const currentDeviceId = getDeviceFingerprint();
                        const updatedEmp = updateLoggedDevicesForEmployee({
                          ...firstLoginEmployee!,
                          approvedDeviceId: currentDeviceId
                        }, currentDeviceId);

                        //Sync updated employee to database
                        const updatedEmps = employees.map(emp => emp.id === updatedEmp.id ? updatedEmp : emp);
                        setEmployees(updatedEmps);
                        try {
                          await saveToFirestore({
                            employees: updatedEmps,
                            attendance,
                            payroll,
                            adminSettings,
                            failedLogins,
                            spreadsheetId,
                            spreadsheetLink
                          });
                        } catch (err) {
                          console.warn("Failed to sync approved employee to Firestore:", err);
                        }

                        //Success Login
                        const empUser: PortalUser = {
                          id: updatedEmp.id,
                          name: updatedEmp.name,
                          role: 'employee',
                          employee: updatedEmp
                        };
                        setPortalUser(empUser);
                        localStorage.setItem('payroll_portal_user', JSON.stringify(empUser));
                        setIsFirstLoginVerification(false);
                        setFirstLoginEmployee(null);
                        setLoginErr(null);
                      } else {
                        setLoginErr('Invalid OTP. Please try again.');
                      }
                    }} className="space-y-4 animate-fadeIn">
                      <div className="bg-emerald-950/20 text-emerald-300 border border-emerald-900/30 p-3.5 rounded-xl text-[11px] font-semibold leading-normal">
                        📧 {`A security OTP has been sent to ${firstLoginEmployee.email?.replace(/(.{3})(.*)(@.*)/, "$1***$3")}. Please enter the code below.`}
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">
                          {'6-Digit Verification OTP'}
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={firstLoginEnteredOtp}
                          onChange={(e) => setFirstLoginEnteredOtp(e.target.value)}
                          placeholder="e.g. 123456"
                          className="w-full text-center tracking-[12px] text-lg border border-slate-800 rounded-xl px-3 py-3 font-bold bg-slate-900/60 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono" />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs py-3 px-4 rounded-xl cursor-pointer shadow-lg transition-all duration-200 text-center uppercase tracking-wider"
                      >
                        {'Verify & Sign In'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setFirstLoginStep('select_option');
                          setLoginErr(null);
                        }}
                        className="w-full text-center text-[10px] uppercase font-bold text-slate-500 hover:text-slate-300 transition-colors py-1 cursor-pointer"
                      >
                        {'Back'}
                      </button>
                    </form>
                  )}

                  {firstLoginStep === 'admin_approval' && (
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      setLoginErr(null);

                      //Load latest employees list from Firestore to verify any changes
                      let latestEmployees = employees;
                      try {
                        const result = await loadFromFirestore();
                        if (result && result.success && result.data && result.data.employees) {
                          latestEmployees = result.data.employees;
                          setEmployees(latestEmployees);
                        }
                      } catch (err) {
                        console.warn("Failed to retrieve latest employees:", err);
                      }

                      const currentEmp = latestEmployees.find(emp => emp.id === firstLoginEmployee.id);
                      if (!currentEmp) {
                        setLoginErr('Employee not found.');
                        return;
                      }

                      const currentDeviceId = getDeviceFingerprint();

                      //Auto login if already approved by Admin directly on their dashboard
                      const isAlreadyApproved = currentEmp.approvedDeviceId === currentDeviceId;
                      const enteredOtpMatches = firstLoginAdminCode.trim() && currentEmp.pendingDeviceApprovalOtp && (firstLoginAdminCode.trim() === currentEmp.pendingDeviceApprovalOtp.trim());

                      if (isAlreadyApproved || enteredOtpMatches) {
                        const updatedEmp = updateLoggedDevicesForEmployee({
                          ...currentEmp,
                          approvedDeviceId: currentDeviceId,
                          pendingDeviceApprovalCode: '',
                          pendingDeviceApprovalOtp: ''
                        }, currentDeviceId);

                        const updatedEmps = latestEmployees.map(emp => emp.id === updatedEmp.id ? updatedEmp : emp);
                        setEmployees(updatedEmps);
                        try {
                          await saveToFirestore({
                            employees: updatedEmps,
                            attendance,
                            payroll,
                            adminSettings,
                            failedLogins,
                            spreadsheetId,
                            spreadsheetLink
                          });
                        } catch (err) {
                          console.warn("Failed to sync approved employee to Firestore:", err);
                        }

                        const empUser: PortalUser = {
                          id: updatedEmp.id,
                          name: updatedEmp.name,
                          role: 'employee',
                          employee: updatedEmp
                        };
                        setPortalUser(empUser);
                        localStorage.setItem('payroll_portal_user', JSON.stringify(empUser));
                        setIsFirstLoginVerification(false);
                        setFirstLoginEmployee(null);
                        setLoginErr(null);
                      } else {
                        setLoginErr('Invalid Admin Approval OTP code. Please ask Admin/HR to generate the OTP, or wait for them to click Approve on their dashboard.');
                      }
                    }} className="space-y-4 animate-fadeIn">
                      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3.5">
                        <div className="text-center">
                          <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">
                            {'Your Request Share Code'}
                          </span>
                          <span className="block text-2xl font-black text-emerald-400 font-mono tracking-wider mt-1 bg-slate-950 py-2.5 px-4 rounded-lg inline-block border border-slate-800">
                            {firstLoginEmployee.pendingDeviceApprovalCode}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-semibold leading-relaxed text-center">
                          {'Provide this code to HR/Admin. Once they approve your request, they will share an OTP with you or approve it directly.'}
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono flex justify-between items-center">
                          <span>{'6-Digit Admin Approval OTP'}</span>
                          <button
                            type="button"
                            onClick={async () => {
                              //Reload latest status from DB
                              try {
                                const result = await loadFromFirestore();
                                if (result && result.success && result.data && result.data.employees) {
                                  const latestEmps = result.data.employees;
                                  setEmployees(latestEmps);
                                  const match = latestEmps.find(e => e.id === firstLoginEmployee.id);
                                  if (match && match.approvedDeviceId === getDeviceFingerprint()) {
                                    //Already approved directly by admin!
                                    const empUser: PortalUser = {
                                      id: match.id,
                                      name: match.name,
                                      role: 'employee',
                                      employee: match
                                    };
                                    setPortalUser(empUser);
                                    localStorage.setItem('payroll_portal_user', JSON.stringify(empUser));
                                    setIsFirstLoginVerification(false);
                                    setFirstLoginEmployee(null);
                                    setLoginErr(null);
                                  }
                                }
                              } catch (e) {
                                console.warn("Auto-check failed:", e);
                              }
                            }}
                            className="text-[9px] text-emerald-400 uppercase font-black tracking-widest font-mono hover:text-emerald-300 transition-colors"
                          >
                            🔄 {'Check Status'}
                          </button>
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={firstLoginAdminCode}
                          onChange={(e) => setFirstLoginAdminCode(e.target.value)}
                          placeholder="e.g. 123456"
                          className="w-full text-center tracking-[12px] text-lg border border-slate-800 rounded-xl px-3 py-3 font-bold bg-slate-900/60 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono" />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-black text-xs py-3 px-4 rounded-xl cursor-pointer shadow-lg transition-all duration-200 text-center uppercase tracking-wider"
                      >
                        {'Verify Approval & Sign In'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setFirstLoginStep('select_option');
                          setLoginErr(null);
                        }}
                        className="w-full text-center text-[10px] uppercase font-bold text-slate-500 hover:text-slate-300 transition-colors py-1 cursor-pointer"
                      >
                        {'Back'}
                      </button>
                    </form>
                  )}
                </div>
              ) : (
                <>
                  {/* Login Method Toggle Tabs */}
                  <div className="flex border-b border-slate-800/80 mt-6 font-mono text-[10px] font-black uppercase tracking-wider">
                    <button
                      type="button"
                      onClick={() => {
                        setLoginMethod('password');
                        setLoginErr(null);
                        setPasswordLoginOtpStep('password');
                        setPasswordLoginPendingUser(null);
                        setPasswordLoginEnteredOtp('');
                      }}
                      className={`flex-1 pb-3 text-center border-b-2 cursor-pointer transition-all ${
                        loginMethod === 'password'
                          ? 'border-emerald-500 text-white font-extrabold'
                          : 'border-transparent text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      🔑 {'Password Login'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLoginMethod('otp');
                        setLoginErr(null);
                        setLoginOtpStep('request_otp');
                        setLoginEnteredOtp('');
                      }}
                      className={`flex-1 pb-3 text-center border-b-2 cursor-pointer transition-all ${
                        loginMethod === 'otp'
                          ? 'border-emerald-500 text-white font-extrabold'
                          : 'border-transparent text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      📨 {'Email OTP Login'}
                    </button>
                  </div>

              {loginMethod === 'password' ? (
                passwordLoginOtpStep === 'enter_otp' ? (
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    setLoginErr(null);
                    if (passwordLoginEnteredOtp.trim() === loginGeneratedOtp) {
                      if (!passwordLoginPendingUser) return;
                      const { type, userObj } = passwordLoginPendingUser;
                      
                      if (type === 'admin') {
                        const adminUserObj: PortalUser = {
                          id: 'admin',
                          name: 'Administrator',
                          role: 'admin'
                        };
                        setPortalUser(adminUserObj);
                        localStorage.setItem('payroll_portal_user', JSON.stringify(adminUserObj));
                        setLoginId('');
                        setLoginPass('');
                        setLoginErr(null);
                      } else if (type === 'role') {
                        const portalUserObj: PortalUser = {
                          id: userObj.id,
                          name: userObj.name,
                          role: userObj.role,
                          branch: userObj.branch,
                          branches: userObj.branches
                        };
                        setPortalUser(portalUserObj);
                        localStorage.setItem('payroll_portal_user', JSON.stringify(portalUserObj));
                        setLoginId('');
                        setLoginPass('');
                        setLoginErr(null);
                      } else if (type === 'employee') {
                        const currentDeviceId = getDeviceFingerprint();
                        const emp = userObj;
                        
                        let latestEmployees = employees;
                        try {
                          const result = await loadFromFirestore();
                          if (result && result.success && result.data && result.data.employees) {
                            latestEmployees = result.data.employees;
                            setEmployees(latestEmployees);
                          }
                        } catch (err) {
                          console.warn("Failed to retrieve latest employees for login check:", err);
                        }

                        const updatedEmp = updateLoggedDevicesForEmployee(emp, currentDeviceId);
                        const updatedEmps = latestEmployees.map(e => e.id === updatedEmp.id ? updatedEmp : e);
                        setEmployees(updatedEmps);
                        try {
                          await saveToFirestore({
                            employees: updatedEmps,
                            attendance,
                            payroll,
                            adminSettings,
                            failedLogins,
                            spreadsheetId,
                            spreadsheetLink
                          });
                        } catch (err) {
                          console.warn("Failed to sync logged devices list:", err);
                        }

                        const empUser: PortalUser = {
                          id: updatedEmp.id,
                          name: updatedEmp.name,
                          role: 'employee',
                          employee: updatedEmp
                        };
                        setPortalUser(empUser);
                        localStorage.setItem('payroll_portal_user', JSON.stringify(empUser));
                        setLoginId('');
                        setLoginPass('');
                        setLoginErr(null);
                      }
                      setPasswordLoginOtpStep('password');
                      setPasswordLoginPendingUser(null);
                      setPasswordLoginEnteredOtp('');
                    } else {
                      setLoginErr('Invalid 2FA OTP. Please try again.');
                    }
                  }} className="space-y-4 mt-6 animate-fadeIn">
                    <div className="bg-emerald-950/20 text-emerald-300 border border-emerald-900/30 p-3 rounded-xl text-[11px] font-semibold leading-normal animate-pulse">
                      🛡️ {`Two-Factor Authentication is active. A secure login OTP has been sent to ${loginOtpEmail.replace(/(.{3})(.*)(@.*)/, "$1***$3")}.`}
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">
                        {'6-Digit OTP Code'}
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={passwordLoginEnteredOtp}
                        onChange={(e) => setPasswordLoginEnteredOtp(e.target.value)}
                        placeholder="e.g. 123456"
                        className="w-full text-center tracking-[12px] text-lg border border-slate-800 rounded-xl px-3 py-3 font-bold bg-slate-900/60 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono" />
                    </div>

                    <button
                      type="submit"
                      disabled={isSendingPasswordLoginOtp}
                      className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs py-3 px-4 rounded-xl cursor-pointer shadow-lg transition-all duration-200 text-center uppercase tracking-wider disabled:opacity-50"
                    >
                      {isSendingPasswordLoginOtp
                        ? ('Verifying...')
                        : ('Verify & Sign In')}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPasswordLoginOtpStep('password');
                        setPasswordLoginPendingUser(null);
                        setPasswordLoginEnteredOtp('');
                        setLoginErr(null);
                      }}
                      className="w-full text-center text-[10px] uppercase font-bold text-slate-500 hover:text-slate-300 mt-1 transition-colors"
                    >
                      {'Back'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const inputID = loginId.trim();
                    const inputPass = loginPass;
                    if (!inputID || !inputPass) {
                      setLoginErr('Please fill in all fields.');
                      return;
                    }

                    if (rememberMe) {
                      localStorage.setItem('payroll_remember_me', 'true');
                      localStorage.setItem('payroll_remembered_login_id', inputID);
                    } else {
                      localStorage.removeItem('payroll_remember_me');
                      localStorage.removeItem('payroll_remembered_login_id');
                    }

                    //Load latest employees list from Firestore to verify correct and updated device lock and multi-device status
                    let latestEmployees = employees;
                    try {
                      const result = await loadFromFirestore();
                      if (result && result.success && result.data && result.data.employees) {
                        latestEmployees = result.data.employees;
                        setEmployees(latestEmployees);
                      }
                    } catch (err) {
                      console.warn("Failed to retrieve latest employees for login check:", err);
                    }

                    const adminUsername = adminSettings.adminUsername || 'admin';
                    const adminPassword = adminSettings.adminPassword || 'admin123';

                    if (inputID.toLowerCase() === adminUsername.toLowerCase()) {
                      if (inputPass === adminPassword) {
                        const adminUser: PortalUser = {
                          id: 'admin',
                          name: 'Administrator',
                          role: 'admin'
                        };
                        if (adminSettings.enablePasswordLoginOtp) {
                          const email = adminSettings.senderEmail || adminSettings.smtpUsername || 'admin@rathibuildmart.com';
                          await sendPassword2faOtp(email, adminUser, 'admin', 'Administrator');
                        } else {
                          setPortalUser(adminUser);
                          localStorage.setItem('payroll_portal_user', JSON.stringify(adminUser));
                          setLoginId('');
                          setLoginPass('');
                          setLoginErr(null);
                        }
                      } else {
                        recordUnsuccessfulLogin(inputID, 'Admin Incorrect Password');
                        setLoginErr('Incorrect Administrator password.');
                      }
                    } else {
                      const roleAccounts = adminSettings.roleAccounts || [];
                      const matchedRoleAcc = roleAccounts.find(
                        acc => acc.username.trim().toLowerCase() === inputID.toLowerCase()
                      );

                      if (matchedRoleAcc) {
                        if (inputPass === matchedRoleAcc.password) {
                          const portalUserObj: PortalUser = {
                            id: matchedRoleAcc.id,
                            name: matchedRoleAcc.name,
                            role: matchedRoleAcc.role,
                            branch: matchedRoleAcc.branch,
                            branches: matchedRoleAcc.branches
                          };
                          if (adminSettings.enablePasswordLoginOtp) {
                            const email = matchedRoleAcc.email || '';
                            if (!email || !email.trim()) {
                              setLoginErr('Email address is not configured for this user. Please contact administrator.');
                              return;
                            }
                            await sendPassword2faOtp(email, matchedRoleAcc, 'role', matchedRoleAcc.name);
                          } else {
                            setPortalUser(portalUserObj);
                            localStorage.setItem('payroll_portal_user', JSON.stringify(portalUserObj));
                            setLoginId('');
                            setLoginPass('');
                            setLoginErr(null);
                          }
                        } else {
                          recordUnsuccessfulLogin(inputID, 'Incorrect Password');
                          setLoginErr('Incorrect Password.');
                        }
                      } else {
                        const emp = latestEmployees.find(e => e.id.trim().toLowerCase() === inputID.trim().toLowerCase());
                        if (emp) {
                          const targetPass = (emp.password || '').trim();
                          const isCorrectPass = targetPass 
                            ? (inputPass.trim() === targetPass) 
                            : (inputPass.trim() === '123456' || inputPass.trim().toLowerCase() === emp.id.trim().toLowerCase());

                          if (isCorrectPass) {
                            //1. Approval Check
                            if (emp.isApproved === false) {
                              recordUnsuccessfulLogin(inputID, 'Account pending approval');
                              setLoginErr(
                                "Login blocked. HR or Administrator approval is required before your first login."
                              );
                              return;
                            }

                            //2. Device Fingerprint Check
                            const currentDeviceId = getDeviceFingerprint();
                            if (emp.approvedDeviceId && emp.approvedDeviceId !== currentDeviceId && !emp.allowMultipleDevices) {
                              recordUnsuccessfulLogin(inputID, 'Device lock active');
                              setLoginErr(
                                "Login blocked. Device restriction is active. You can only log in from your registered device. Please contact HR/Admin."
                              );
                              return;
                            }

                            //If no device bound yet, enforce mandatory first-time verification flow
                            if (!emp.approvedDeviceId) {
                              setFirstLoginEmployee(emp);
                              setIsFirstLoginVerification(true);
                              setFirstLoginStep('select_option');
                              setFirstLoginGeneratedOtp('');
                              setFirstLoginEnteredOtp('');
                              setFirstLoginAdminCode('');
                              setLoginErr(null);
                              return;
                            }

                            //If OTP is enabled, send OTP
                            if (adminSettings.enablePasswordLoginOtp) {
                              const email = emp.email || '';
                              if (!email || !email.trim()) {
                                setLoginErr('Email address is not configured for this user. Please contact HR.');
                                return;
                              }
                              await sendPassword2faOtp(email, emp, 'employee', emp.name);
                            } else {
                              const updatedEmp = updateLoggedDevicesForEmployee(emp, currentDeviceId);
                              const updatedEmps = latestEmployees.map(e => e.id === updatedEmp.id ? updatedEmp : e);
                              setEmployees(updatedEmps);
                              try {
                                await saveToFirestore({
                                  employees: updatedEmps,
                                  attendance,
                                  payroll,
                                  adminSettings,
                                  failedLogins,
                                  spreadsheetId,
                                  spreadsheetLink
                                });
                              } catch (err) {
                                console.warn("Failed to sync logged devices list:", err);
                              }

                              const empUser: PortalUser = {
                                id: updatedEmp.id,
                                name: updatedEmp.name,
                                role: 'employee',
                                employee: updatedEmp
                              };
                              setPortalUser(empUser);
                              localStorage.setItem('payroll_portal_user', JSON.stringify(empUser));
                              setLoginId('');
                              setLoginPass('');
                              setLoginErr(null);
                            }
                          } else {
                            recordUnsuccessfulLogin(inputID, 'Incorrect Password');
                            setLoginErr("Incorrect Password! Standard password is your Employee ID or '123456'.");
                          }
                        } else {
                          recordUnsuccessfulLogin(inputID, 'User ID not found');
                          setLoginErr("User IDEmployee ID not found. Contact administration.");
                        }
                      }
                    }
                  }} className="space-y-4 mt-6 animate-fadeIn">
                    
                    {/* User ID Field */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">
                        {'User IDEmployee ID'}
                      </label>
                      <div className="relative">
                        <LucideUser className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          required
                          value={loginId}
                          onChange={(e) => setLoginId(e.target.value)}
                          placeholder={'e.g., admin or EMP001'}
                          className="w-full border border-slate-800 rounded-xl pl-10 pr-3.5 py-3 text-xs font-bold bg-slate-900/60 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono" />
                      </div>
                    </div>

                    {/* Password Field */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">
                          {'Password'}
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setShowForgotModal(true);
                            setForgotStep('request');
                            setForgotSubmitted(false);
                            setForgotEmpId('');
                            setForgotEmail('');
                            setForgotMobile('');
                            setForgotError(null);
                          }}
                          className="text-[10px] font-black uppercase text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                        >
                          {'Forgot Password?'}
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          value={loginPass}
                          onKeyDown={(e) => {
                            if (e.getModifierState) {
                              setIsCapsLockOn(e.getModifierState('CapsLock'));
                            }
                          }}
                          onKeyUp={(e) => {
                            if (e.getModifierState) {
                              setIsCapsLockOn(e.getModifierState('CapsLock'));
                            }
                          }}
                          onBlur={() => setIsCapsLockOn(false)}
                          onChange={(e) => setLoginPass(e.target.value)}
                          placeholder="••••••••"
                          className="w-full border border-slate-800 rounded-xl pl-10 pr-10 py-3 text-xs font-bold bg-slate-900/60 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-sans" />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 focus:outline-none p-1 rounded-md transition-colors cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Caps Lock Alert Indicator */}
                      {isCapsLockOn && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/90 border border-amber-600/70 text-amber-300 text-[10px] font-bold font-mono animate-pulse shadow-sm mt-1">
                          <span className="text-xs font-black">⇪</span>
                          <span>{'CAPS LOCK IS ON'}</span>
                        </div>
                      )}
                    </div>

                    {/* Remember MeSave Login ID Checkbox */}
                    <div className="flex items-center justify-between pt-0.5">
                      <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300 hover:text-white transition-colors">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setRememberMe(checked);
                            if (checked && loginId.trim()) {
                              localStorage.setItem('payroll_remember_me', 'true');
                              localStorage.setItem('payroll_remembered_login_id', loginId.trim());
                            } else if (!checked) {
                              localStorage.removeItem('payroll_remember_me');
                              localStorage.removeItem('payroll_remembered_login_id');
                            }
                          }}
                          className="w-3.5 h-3.5 rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500/20 focus:ring-offset-0 cursor-pointer accent-emerald-500" />
                        <span className="text-[10px] font-bold text-slate-300">
                          {'Remember MeSave Login ID'}
                        </span>
                      </label>
                      {rememberMe && loginId.trim() && (
                        <span className="text-[9px] font-mono text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-900/50">
                          ✓ Saved
                        </span>
                      )}
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs py-3 px-4 rounded-xl cursor-pointer shadow-lg shadow-emerald-950/40 hover:shadow-emerald-500/10 transition-all duration-200 text-center uppercase tracking-wider active:scale-98 mt-2"
                    >
                      {'Sign In to Workspace'}
                    </button>
                  </form>
                )
              ) : (
                //OTP Login Form
                <div className="mt-6 animate-fadeIn">
                  {loginOtpStep === 'request_otp' ? (
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      setLoginErr(null);
                      const inputID = loginId.trim();
                      if (!inputID) {
                        setLoginErr('Please enter your Employee ID.');
                        return;
                      }

                      const emp = employees.find(e => e.id.trim().toLowerCase() === inputID.trim().toLowerCase());
                      if (!emp) {
                        setLoginErr('Employee ID not found.');
                        return;
                      }

                      if (!emp.email || !emp.email.trim()) {
                        setLoginErr('Email address is not configured for this user. Please use password login or contact HR.');
                        return;
                      }

                      const otp = Math.floor(100000 + Math.random() * 900000).toString();
                      setLoginGeneratedOtp(otp);
                      setLoginOtpEmail(emp.email.trim());
                      setIsSendingLoginOtp(true);

                      const triggerSendOtp = async () => {
                        try {
                          const res = await fetch(' //api/send-otp', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              email: emp.email.trim(),
                              otp,
                              empName: emp.name,
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
                          
                          let data;
                          try {
                            data = await res.json();
                          } catch (err) {
                            try {
                              const text = await res.text();
                              data = { success: false, error: text || `Server error ${res.status}` };
                            } catch (e2) {
                              data = { success: false, error: `Server error ${res.status}` };
                            }
                          }

                          setIsSendingLoginOtp(false);
                          if (data.logEntry) addEmailLog(data.logEntry);
                          if (data.success) {
                            setLoginOtpStep('enter_otp');
                            if (data.method === 'SIMULATION') {
                              setLastSentEmail(data.debugPayload);
                              setShowEmailViewer(true);
                            }
                          } else {
                            setLoginErr(data.error || 'Failed to dispatch login OTP.');
                            if (data.smtpError && data.debugPayload) {
                              setFallbackOtpPayload(data.debugPayload);
                            }
                          }
                        } catch (err: any) {
                          console.error('[Standard Login OTP Send Error]', err);
                          setIsSendingLoginOtp(false);
                          setLoginErr(`Network error sending OTP: ${err.message || err}`);
                        }
                      };
                      triggerSendOtp();
                    }} className="space-y-4">
                      
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">
                          {'Employee ID (Required)'}
                        </label>
                        <div className="relative">
                          <LucideUser className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                          <input
                            type="text"
                            required
                            value={loginId}
                            onChange={(e) => setLoginId(e.target.value)}
                            placeholder="e.g. EMP001"
                            className="w-full border border-slate-800 rounded-xl pl-10 pr-3.5 py-3 text-xs font-bold bg-slate-900/60 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono uppercase" />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSendingLoginOtp}
                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs py-3 px-4 rounded-xl cursor-pointer shadow-lg transition-all duration-200 text-center uppercase tracking-wider disabled:opacity-50"
                      >
                        {isSendingLoginOtp 
                          ? ('Dispatching OTP...') 
                          : ('Get Login OTP')}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      setLoginErr(null);
                      if (loginEnteredOtp.trim() === loginGeneratedOtp) {
                        //Load latest employees list from Firestore to verify correct and updated device lock and multi-device status
                        let latestEmployees = employees;
                        try {
                          const result = await loadFromFirestore();
                          if (result && result.success && result.data && result.data.employees) {
                            latestEmployees = result.data.employees;
                            setEmployees(latestEmployees);
                          }
                        } catch (err) {
                          console.warn("Failed to retrieve latest employees for OTP login check:", err);
                        }

                        const emp = latestEmployees.find(e => e.id.trim().toLowerCase() === loginId.trim().toLowerCase());
                        if (emp) {
                          //1. Approval Check
                          if (emp.isApproved === false) {
                            recordUnsuccessfulLogin(emp.id, 'Account pending approval');
                            setLoginErr(
                              "Login blocked. HR or Administrator approval is required before your first login."
                            );
                            return;
                          }

                          //2. Device Fingerprint Check
                          const currentDeviceId = getDeviceFingerprint();
                          if (emp.approvedDeviceId && emp.approvedDeviceId !== currentDeviceId && !emp.allowMultipleDevices) {
                            recordUnsuccessfulLogin(emp.id, 'Device lock active');
                            setLoginErr(
                              "Login blocked. Device restriction is active. You can only log in from your registered device. Please contact HR/Admin."
                            );
                            return;
                          }

                          //If no device bound yet, enforce mandatory first-time verification flow
                          if (!emp.approvedDeviceId) {
                            setFirstLoginEmployee(emp);
                            setIsFirstLoginVerification(true);
                            setFirstLoginStep('select_option');
                            setFirstLoginGeneratedOtp('');
                            setFirstLoginEnteredOtp('');
                            setFirstLoginAdminCode('');
                            setLoginErr(null);
                            return;
                          }

                          const updatedEmp = updateLoggedDevicesForEmployee(emp, currentDeviceId);
                          const updatedEmps = latestEmployees.map(e => e.id === updatedEmp.id ? updatedEmp : e);
                          setEmployees(updatedEmps);
                          try {
                            await saveToFirestore({
                              employees: updatedEmps,
                              attendance,
                              payroll,
                              adminSettings,
                              failedLogins,
                              spreadsheetId,
                              spreadsheetLink
                            });
                          } catch (err) {
                            console.warn("Failed to sync logged devices list:", err);
                          }

                          const empUser: PortalUser = {
                            id: updatedEmp.id,
                            name: updatedEmp.name,
                            role: 'employee',
                            employee: updatedEmp
                          };
                          setPortalUser(empUser);
                          localStorage.setItem('payroll_portal_user', JSON.stringify(empUser));
                          setLoginId('');
                          setLoginPass('');
                          setLoginEnteredOtp('');
                          setLoginGeneratedOtp('');
                          setLoginOtpStep('request_otp');
                          setLoginErr(null);
                        }
                      } else {
                        setLoginErr('Invalid OTP. Please try again.');
                      }
                    }} className="space-y-4">
                      
                      <div className="bg-emerald-950/20 text-emerald-300 border border-emerald-900/30 p-3 rounded-xl text-[11px] font-semibold leading-normal animate-pulse">
                        📧 {`A secure login OTP has been sent to ${loginOtpEmail.replace(/(.{3})(.*)(@.*)/, "$1***$3")}. Please enter the code below to sign in.`}
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">
                          {'6-Digit OTP Code'}
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={loginEnteredOtp}
                          onChange={(e) => setLoginEnteredOtp(e.target.value)}
                          placeholder="e.g. 123456"
                          className="w-full text-center tracking-[12px] text-lg border border-slate-800 rounded-xl px-3 py-3 font-bold bg-slate-900/60 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono" />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs py-3 px-4 rounded-xl cursor-pointer shadow-lg transition-all duration-200 text-center uppercase tracking-wider"
                      >
                        {'Verify & Sign In'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setLoginOtpStep('request_otp');
                          setLoginErr(null);
                        }}
                        className="w-full text-center text-[10px] uppercase font-bold text-slate-500 hover:text-slate-300 mt-1 transition-colors"
                      >
                        {'Back'}
                      </button>
                    </form>
                  )}
                </div>
              )}
                </>
              )}

              {/* Help & FAQ Accordion Section */}
              <div className="mt-6 pt-5 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setShowLoginHelp(!showLoginHelp)}
                  className="w-full flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                    {'Struggling with Sign In?'}
                  </span>
                  <span className="text-[12px] font-bold text-slate-500">{showLoginHelp ? '−' : '+'}</span>
                </button>

                {showLoginHelp && (
                  <div className="mt-3 p-3 bg-slate-900/80 rounded-xl border border-slate-800/60 text-[10px] text-slate-400 font-semibold space-y-2 leading-relaxed animate-fadeIn">
                    <p>
                      💡 <strong className="text-slate-200">{'Standard Employees:'}</strong>{' '}
                      {"Your standard default password is your unique Employee ID (e.g., EMP001) or '123456' unless modified by admin."}
                    </p>
                    <p>
                      ⚙️ <strong className="text-slate-200">{'System Administrator:'}</strong>{' '}
                      {"Login with username 'admin' and standard password to enter admin workspace."}
                    </p>
                    <p className="text-slate-500 text-[9px] italic border-t border-slate-800/40 pt-1.5 font-mono">
                      {'All unsuccessful sign-in attempts are logged securely in our Firestore security audit database.'}
                    </p>
                    <div className="border-t border-slate-800/40 pt-2.5 mt-1.5 space-y-2">
                      <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block text-center font-mono">
                        {'Direct Help Contacts'}
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <a
                          href={`tel:${(adminSettings.hrContactPhone || '+91 91111 22222').replace(/\s+/g, '')}`}
                          className="flex items-center justify-center gap-1 bg-emerald-600/80 hover:bg-emerald-500 text-white font-bold text-[8.5px] py-1.5 px-1.5 rounded-lg transition-all text-center"
                        >
                          <PhoneCall className="w-3 h-3 shrink-0" />
                          <span>HR: {adminSettings.hrContactPhone || '+91 91111 22222'}</span>
                        </a>
                        <a
                          href={`tel:${(adminSettings.itContactPhone || '+91 98888 77777').replace(/\s+/g, '')}`}
                          className="flex items-center justify-center gap-1 bg-teal-600/80 hover:bg-teal-500 text-white font-bold text-[8.5px] py-1.5 px-1.5 rounded-lg transition-all text-center"
                        >
                          <PhoneCall className="w-3 h-3 shrink-0" />
                          <span>IT: {adminSettings.itContactPhone || '+91 98888 77777'}</span>
                        </a>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <a
                          href={`mailto:${adminSettings.hrContactEmail || 'hr@rathibuildmart.com'}`}
                          className="flex items-center justify-center gap-1 bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-[8.5px] py-1.5 px-1.5 rounded-lg border border-slate-700 transition-all text-center truncate"
                        >
                          <Mail className="w-3 h-3 shrink-0 text-emerald-400" />
                          <span className="truncate">Email HR</span>
                        </a>
                        <a
                          href={`mailto:${adminSettings.itContactEmail || 'it.support@rathibuildmart.com'}`}
                          className="flex items-center justify-center gap-1 bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold text-[8.5px] py-1.5 px-1.5 rounded-lg border border-slate-700 transition-all text-center truncate"
                        >
                          <Mail className="w-3 h-3 shrink-0 text-teal-400" />
                          <span className="truncate">Email IT</span>
                        </a>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setShowSupportModal(true);
                          setSupportSubmitted(false);
                          setSupportName('');
                          setSupportEmpId('');
                          setSupportEmail('');
                          setSupportMsg('');
                          setSupportCategory('sign_in_issue');
                        }}
                        className="w-full bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 mt-1"
                      >
                        <LifeBuoy className="w-3 h-3 shrink-0 text-emerald-400" />
                        {'Submit Support Ticket'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Live System Security & Sync Status Badge */}
              <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-2.5">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-slate-400 font-bold uppercase tracking-wider">
                    {'Live Gateway Security:'}
                  </span>
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 font-black">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span>{'🟢 Operational'}</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[9.5px] font-semibold">
                  <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-lg flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <div>
                      <span className="block text-slate-200 font-bold leading-none">
                        {'2FA & Device Guard'}
                      </span>
                      <span className="text-[8.5px] text-emerald-400/90 font-mono">
                        {adminSettings.enablePasswordLoginOtp ? 'Strict 2FA Active' : 'AES-256 Protected'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-lg flex items-center gap-2">
                    <Database className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <div>
                      <span className="block text-slate-200 font-bold leading-none">
                        {'Google Sheets Sync'}
                      </span>
                      <span className="text-[8.5px] text-indigo-300/90 font-mono">
                        {spreadsheetId ? 'Cloud Live Synced' : 'Auto-Sync Ready'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Subtle Footer branding info */}
            <p className="text-center text-[10px] text-slate-500 font-semibold mt-6 uppercase tracking-wider">
              © {new Date().getFullYear()} {adminSettings.companyName || 'Rathi Build Mart'} • {'All Rights Reserved'}
            </p>

          </div>
        </div>

        {/* ============================================== */}
        {/* FORGOT PASSWORD? REQUEST GATEWAY MODAL */}
        {/* ============================================== */}
        {showForgotModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-teal-500 to-emerald-500" />
              
              <button 
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {forgotSubmitted ? (
                <div className="text-center py-6 space-y-4 animate-fadeIn">
                  <div className="w-12 h-12 rounded-full bg-emerald-950/50 text-emerald-400 border border-emerald-900/50 flex items-center justify-center mx-auto animate-pulse">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-base font-black text-white">
                      {'Password Reset Successfully!'}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-semibold leading-relaxed max-w-xs mx-auto">
                      {'Your password has been changed successfully. You can now use your new password to sign into the Employee Portal.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotModal(false);
                      setForgotSubmitted(false);
                      setForgotStep('request');
                      setForgotEmpId('');
                      setForgotEmail('');
                      setForgotMobile('');
                      setForgotEnteredOtp('');
                      setForgotNewPass('');
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all cursor-pointer"
                  >
                    {'Return to Login'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest bg-emerald-950/50 text-emerald-400 border border-emerald-900/30">
                      <KeyRound className="w-3 h-3 text-emerald-400" />
                      {'Self-Service Reset'}
                    </div>
                    <h3 className="text-lg font-black text-white font-display tracking-tight mt-1.5">
                      {'Reset Your Password'}
                    </h3>
                  </div>

                  {forgotError && (
                    <div className="bg-rose-500/10 text-rose-300 border border-rose-500/20 p-3 rounded-xl text-[11px] font-semibold flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>{forgotError}</span>
                      </div>
                      {fallbackOtpPayload && (
                        <div className="pt-2 border-t border-rose-500/10 flex flex-col gap-1.5">
                          <p className="text-[9px] text-slate-300 font-medium">
                            {'SMTP Dispatch failed. You can bypass this using the Developer Fallback Sandbox:'}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setLastSentEmail(fallbackOtpPayload);
                              setShowEmailViewer(true);
                              setFallbackOtpPayload(null);
                              setForgotError(null);
                              setForgotStep('verify_otp');
                            }}
                            className="self-start text-[9px] px-2.5 py-0.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 rounded-lg cursor-pointer font-bold uppercase tracking-wider transition-all"
                          >
                            {'Bypass & View OTP'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {forgotStep === 'request' && (
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      setForgotError(null);
                      const targetEmp = employees.find(emp => emp.id.trim().toLowerCase() === forgotEmpId.trim().toLowerCase());
                      if (!targetEmp) {
                        setForgotError("Employee ID not found in Rathi Build Mart roster.");
                        return;
                      }

                      if (!targetEmp.email || targetEmp.email.trim().toLowerCase() !== forgotEmail.trim().toLowerCase()) {
                        setForgotError("Registered email address does not match this Employee ID.");
                        return;
                      }

                      //Generate OTP
                      const otp = Math.floor(100000 + Math.random() * 900000).toString();
                      setForgotGeneratedOtp(otp);
                      setIsSendingForgotOtp(true);

                      const triggerForgotSendOtp = async () => {
                        try {
                          const res = await fetch(' //api/send-otp', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              email: forgotEmail.trim(),
                              otp,
                              empName: targetEmp.name,
                              purpose: 'forgot_password',
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
                          
                          let data;
                          try {
                            data = await res.json();
                          } catch (err) {
                            try {
                              const text = await res.text();
                              data = { success: false, error: text || `Server error ${res.status}` };
                            } catch (e2) {
                              data = { success: false, error: `Server error ${res.status}` };
                            }
                          }

                          setIsSendingForgotOtp(false);
                          if (data.logEntry) addEmailLog(data.logEntry);
                          if (data.success) {
                            setForgotStep('verify_otp');
                            if (data.method === 'SIMULATION') {
                              setLastSentEmail(data.debugPayload);
                              setShowEmailViewer(true);
                            }
                          } else {
                            setForgotError(data.error || 'Failed to dispatch OTP. Please check SMTP settings.');
                            if (data.smtpError && data.debugPayload) {
                              setFallbackOtpPayload(data.debugPayload);
                            }
                          }
                        } catch (err: any) {
                          console.error('[Forgot Password OTP Send Error]', err);
                          setIsSendingForgotOtp(false);
                          setForgotError(`Network error while sending OTP: ${err.message || err}`);
                        }
                      };
                      triggerForgotSendOtp();
                    }} className="space-y-4">
                      <p className="text-[11px] text-slate-400 font-semibold leading-normal">
                        {'Enter your employee details below. We will send a secure 6-digit verification code to your registered email.'}
                      </p>

                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">
                            {'Employee ID (User ID)'}
                          </label>
                          <input
                            type="text"
                            required
                            value={forgotEmpId}
                            onChange={(e) => setForgotEmpId(e.target.value)}
                            placeholder="e.g. EMP001"
                            className="w-full border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold bg-slate-950/60 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono uppercase" />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">
                            {'Registered Email Address'}
                          </label>
                          <input
                            type="email"
                            required
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            placeholder="e.g. staff@rathibuildmart.com"
                            className="w-full border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold bg-slate-950/60 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-sans" />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">
                            {'Mobile Number'}
                          </label>
                          <input
                            type="tel"
                            required
                            value={forgotMobile}
                            onChange={(e) => setForgotMobile(e.target.value)}
                            placeholder="e.g. 9876543210"
                            className="w-full border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold bg-slate-950/60 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono" />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSendingForgotOtp}
                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs py-2.5 px-4 rounded-xl cursor-pointer shadow-lg transition-all duration-200 text-center uppercase tracking-wider disabled:opacity-50"
                      >
                        {isSendingForgotOtp 
                          ? ('Sending Code...') 
                          : ('Send Verification OTP')}
                      </button>
                    </form>
                  )}

                  {forgotStep === 'verify_otp' && (
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      if (forgotEnteredOtp.trim() === forgotGeneratedOtp) {
                        setForgotStep('new_password');
                        setForgotError(null);
                      } else {
                        setForgotError('Invalid 6-digit OTP code.');
                      }
                    }} className="space-y-4">
                      <p className="text-[11px] text-slate-400 font-semibold leading-normal">
                        {`A secure verification OTP has been sent to ${forgotEmail}. Please enter the 6-digit code below.`}
                      </p>

                      <div className="space-y-1">
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">
                          {'6-Digit Verification Code'}
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={forgotEnteredOtp}
                          onChange={(e) => setForgotEnteredOtp(e.target.value)}
                          placeholder="e.g. 123456"
                          className="w-full text-center tracking-[12px] text-lg border border-slate-800 rounded-xl px-3 py-2.5 font-bold bg-slate-950/60 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono" />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs py-2.5 px-4 rounded-xl cursor-pointer shadow-lg transition-all duration-200 text-center uppercase tracking-wider"
                      >
                        {'Verify OTP Code'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setForgotStep('request');
                          setForgotError(null);
                        }}
                        className="w-full text-center text-[10px] uppercase font-bold text-slate-400 hover:text-white mt-1 transition-colors"
                      >
                        {'Back'}
                      </button>
                    </form>
                  )}

                  {forgotStep === 'new_password' && (
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      if (forgotNewPass.trim().length < 4) {
                        setForgotError('Password must be at least 4 characters.');
                        return;
                      }

                      const targetEmp = employees.find(emp => emp.id.trim().toLowerCase() === forgotEmpId.trim().toLowerCase());
                      if (targetEmp) {
                        const updatedEmp = { ...targetEmp, password: forgotNewPass.trim() };
                        handleUpdateEmployee(updatedEmp);

                        //Also add an audit log
                        const newReq = {
                          id: `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
                          empId: forgotEmpId.trim().toUpperCase(),
                          email: forgotEmail.trim(),
                          mobile: forgotMobile.trim(),
                          date: new Date().toISOString(),
                          status: 'Resolved'
                        };
                        setPasswordRequests(prev => [newReq, ...prev]);
                        setForgotSubmitted(true);
                        setForgotError(null);
                      } else {
                        setForgotError('Employee not found.');
                      }
                    }} className="space-y-4">
                      <p className="text-[11px] text-slate-400 font-semibold leading-normal">
                        {'Your identity is verified! Please enter your new secure password below to update your account.'}
                      </p>

                      <div className="space-y-1">
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">
                          {'Choose New Password'}
                        </label>
                        <input
                          type="password"
                          required
                          value={forgotNewPass}
                          onChange={(e) => setForgotNewPass(e.target.value)}
                          placeholder="••••••••"
                          className="w-full border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold bg-slate-950/60 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-sans" />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs py-2.5 px-4 rounded-xl cursor-pointer shadow-lg transition-all duration-200 text-center uppercase tracking-wider"
                      >
                        {'Update & Reset Password'}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================== */}
        {/* HR HELPDESK SUPPORT MODAL */}
        {/* ============================================== */}
        {showSupportModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-blue-500 via-emerald-500 to-teal-500" />
              
              <button 
                type="button"
                onClick={() => setShowSupportModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {!supportSubmitted ? (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const newTicket = {
                    id: `TKT-${Math.floor(1000 + Math.random() * 9000)}`,
                    name: supportName.trim(),
                    empId: supportEmpId.trim().toUpperCase() || 'N/A',
                    email: supportEmail.trim(),
                    category: supportCategory,
                    message: supportMsg.trim(),
                    date: new Date().toISOString(),
                    status: 'Pending'
                  };
                  setHrTickets(prev => [newTicket, ...prev]);
                  setSupportSubmitted(true);
                }} className="space-y-4 font-sans">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest bg-emerald-950/50 text-emerald-400 border border-emerald-900/30">
                      <LifeBuoy className="w-3 h-3 text-emerald-400" />
                      {'HR Helpdesk'}
                    </div>
                    <h3 className="text-lg font-black text-white font-display tracking-tight mt-1.5 font-sans">
                      {'Contact HR Helpdesk'}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-semibold leading-normal">
                      {'Having issues with attendance logs, salary slips, or profile registrations? Contact HR or IT directly below or submit a support ticket.'}
                    </p>

                    {/* Direct Contact Bar for HR & IT */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-left">
                      <div className="space-y-1">
                        <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400 block font-mono">
                          👤 HR Support
                        </span>
                        <div className="flex flex-col gap-1">
                          <a 
                            href={`tel:${(adminSettings.hrContactPhone || '+91 91111 22222').replace(/\s+/g, '')}`} 
                            className="flex items-center gap-1 text-[8.5px] text-white hover:text-emerald-300 font-mono font-bold bg-emerald-950/60 hover:bg-emerald-900/80 px-2 py-1 rounded border border-emerald-800/50"
                          >
                            <PhoneCall className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span className="truncate">{adminSettings.hrContactPhone || '+91 91111 22222'}</span>
                          </a>
                          <a 
                            href={`mailto:${adminSettings.hrContactEmail || 'hr@rathibuildmart.com'}`} 
                            className="flex items-center gap-1 text-[8.5px] text-slate-300 hover:text-white font-mono bg-slate-900 px-2 py-1 rounded border border-slate-800 truncate"
                          >
                            <Mail className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span className="truncate">{adminSettings.hrContactEmail || 'hr@rathibuildmart.com'}</span>
                          </a>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[8px] font-black uppercase tracking-widest text-teal-400 block font-mono">
                          💻 IT Management
                        </span>
                        <div className="flex flex-col gap-1">
                          <a 
                            href={`tel:${(adminSettings.itContactPhone || '+91 98888 77777').replace(/\s+/g, '')}`} 
                            className="flex items-center gap-1 text-[8.5px] text-white hover:text-teal-300 font-mono font-bold bg-teal-950/60 hover:bg-teal-900/80 px-2 py-1 rounded border border-teal-800/50"
                          >
                            <PhoneCall className="w-3 h-3 text-teal-400 shrink-0" />
                            <span className="truncate">{adminSettings.itContactPhone || '+91 98888 77777'}</span>
                          </a>
                          <a 
                            href={`mailto:${adminSettings.itContactEmail || 'it.support@rathibuildmart.com'}`} 
                            className="flex items-center gap-1 text-[8.5px] text-slate-300 hover:text-white font-mono bg-slate-900 px-2 py-1 rounded border border-slate-800 truncate"
                          >
                            <Mail className="w-3 h-3 text-teal-400 shrink-0" />
                            <span className="truncate">{adminSettings.itContactEmail || 'it.support@rathibuildmart.com'}</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mt-4 overflow-y-auto max-h-[300px] pr-1">
                    <div className="space-y-1">
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">
                        {'Full Name'}
                      </label>
                      <input
                        type="text"
                        required
                        value={supportName}
                        onChange={(e) => setSupportName(e.target.value)}
                        placeholder="e.g. Amit Kumar"
                        className="w-full border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold bg-slate-950/60 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">
                        {'Employee ID (Optional)'}
                      </label>
                      <input
                        type="text"
                        value={supportEmpId}
                        onChange={(e) => setSupportEmpId(e.target.value)}
                        placeholder="e.g. EMP001"
                        className="w-full border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold bg-slate-950/60 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono uppercase" />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">
                        {'Contact Email'}
                      </label>
                      <input
                        type="email"
                        required
                        value={supportEmail}
                        onChange={(e) => setSupportEmail(e.target.value)}
                        placeholder="e.g. amit@rathibuildmart.com"
                        className="w-full border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold bg-slate-950/60 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">
                        {'Issue Category'}
                      </label>
                      <select
                        value={supportCategory}
                        onChange={(e) => setSupportCategory(e.target.value)}
                        className="w-full border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold bg-slate-950/60 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
                      >
                        <option value="AttendancePunch Issue">{'AttendancePunch Issue'}</option>
                        <option value="Salary Slip Discrepancy">{'Salary Slip Discrepancy'}</option>
                        <option value="LoginPassword Problem">{'LoginPassword Problem'}</option>
                        <option value="Profile Registration Error">{'Profile Registration Error'}</option>
                        <option value="Other HR General Query">{'Other HR General Query'}</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">
                        {'MessageSupport Description'}
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={supportMsg}
                        onChange={(e) => setSupportMsg(e.target.value)}
                        placeholder={"Describe your issue in detail..."}
                        className="w-full border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold bg-slate-950/60 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs py-2.5 px-4 rounded-xl cursor-pointer shadow-lg transition-all duration-200 text-center uppercase tracking-wider flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {'Send Support Ticket'}
                  </button>
                </form>
              ) : (
                <div className="text-center py-6 space-y-4 animate-fadeIn">
                  <div className="w-12 h-12 rounded-full bg-emerald-950/50 text-emerald-400 border border-emerald-900/50 flex items-center justify-center mx-auto animate-pulse">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-base font-black text-white">
                      {'Support Ticket Dispatched!'}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-semibold leading-relaxed max-w-xs mx-auto">
                      {'Your support inquiry has been submitted. The HR helpdesk team will review your ticket and reach out to you via your registered contact coordinates shortly.'}
                    </p>
                  </div>
                  <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/80 text-[10px] font-mono text-slate-500">
                    TICKET: TKT-{Math.floor(1000 + Math.random() * 9000)} • Status: QUEUED
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSupportModal(false)}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold py-2 px-4 rounded-xl transition-all cursor-pointer"
                  >
                    {'Return to Login'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    );
  }

  //3. Render Employee Portal if user is logged in as employee
  if (portalUser?.role === 'employee') {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-[#1e293b] flex flex-col font-sans max-w-full overflow-x-hidden">
        {/* Portal Header */}
        <header className="bg-slate-950 text-white border-b border-slate-900 py-2.5 px-3 md:py-4 md:px-8 flex flex-row items-center justify-between gap-2 shadow-md relative no-print shrink-0">
          <div className="flex items-center gap-2">
            <img 
              src={getDirectImageUrl(adminSettings.companyLogo)} 
              alt="Logo" 
              className="w-7 h-7 md:w-8 md:h-8 rounded-lg object-cover" 
              referrerPolicy="no-referrer" />
            <div className="min-w-0">
              <h1 className="text-[10px] md:text-sm font-black uppercase tracking-widest truncate">{adminSettings.companyName || 'Rathi Build Mart'}</h1>
              <p className="text-[7px] md:text-[9px] font-mono font-bold text-emerald-400 tracking-wider">Employee Workspace Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Connection Status Indicator */}
            <div className="flex items-center gap-1 px-1.5 py-1 md:px-2.5 md:py-1.5 rounded-lg text-[8px] md:text-[10px] font-bold uppercase tracking-wider bg-slate-900 border border-slate-800">
              <span className={`w-1 h-1 md:w-1.5 md:h-1.5 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className={isOnline ? 'text-green-400 font-sans' : 'text-amber-400 font-sans'}>
                {isOnline ? 'CONNECTED' : 'OFFLINE'}
              </span>
            </div>

            {/* Logout Button */}
            <button
              onClick={handlePortalLogout}
              className="bg-rose-600/10 hover:bg-rose-600 hover:text-white border border-rose-600/20 text-rose-400 text-[10px] md:text-xs font-bold px-2 py-1 md:px-2.5 md:py-1.5 rounded-lg cursor-pointer flex items-center gap-1 transition-all"
            >
              <LogOut className="w-3 h-3 md:w-3.5 md:h-3.5" />
              <span>{'Sign Out'}</span>
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-3 md:p-6 w-full max-w-full overflow-x-hidden box-border">
          <EmployeePortal 
            employee={portalUser.employee!}
            attendanceRecords={attendance}
            payrollRecords={payroll}
            language={language}
            adminSettings={adminSettings}
            onUpdateAttendanceRecords={handleUpdateAttendanceRecords}
            leaveRequests={leaveRequests}
            onAddLeaveRequest={handleAddLeaveRequest} />
        </main>

        <footer className="bg-white border-t border-slate-200 py-3 text-center text-[9px] font-mono text-gray-400 font-semibold no-print shrink-0">
          &copy; {new Date().getFullYear()} {adminSettings.companyName || 'Rathi Build Mart'} | Verified Cloud Payroll Receipt System
        </footer>

        {/* Custom Reusable Confirmation Modal */}
        {confirmDialog && confirmDialog.isOpen && (
          <div className="fixed inset-0 bg-[#020617]/70 z-[150] flex items-center justify-center p-4 backdrop-blur-xs">
            <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center space-y-4">
              <div className="inline-flex bg-red-500/10 text-red-400 p-3 rounded-full">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider">{confirmDialog.title}</h3>
              <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                {confirmDialog.message}
              </p>
              <div className="pt-2 flex gap-3 justify-center">
                <button
                  onClick={confirmDialog.onConfirm}
                  className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-97"
                >
                  {'Yes, Proceed'}
                </button>
                <button
                  onClick={() => setConfirmDialog(null)}
                  className="w-full bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-97"
                >
                  {'Cancel'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  //Filter data for Branch Manager, Director & Sub Admin restrictions
  const filteredEmployees = (() => {
    if (portalUser?.role !== 'branch_manager' && portalUser?.role !== 'director' && portalUser?.role !== 'sub_admin') return employees;
    
    const allowedBranches = portalUser.branches || [];
    if (allowedBranches.length > 0) {
      const allowedLower = allowedBranches.map(b => b.trim().toLowerCase());
      return employees.filter(emp => allowedLower.includes((emp.branch || '').trim().toLowerCase()));
    }
    
    if (portalUser.branch) {
      const singleLower = portalUser.branch.trim().toLowerCase();
      return employees.filter(emp => (emp.branch || '').trim().toLowerCase() === singleLower);
    }
    
    return employees; //If no branches or branch is restricted, allow all branches
  })();

  const filteredEmployeesIds = new Set(filteredEmployees.map(e => e.id));

  const filteredAttendance = (portalUser?.role === 'branch_manager' || portalUser?.role === 'director' || portalUser?.role === 'sub_admin')
    ? attendance.filter(rec => filteredEmployeesIds.has(rec.employeeId))
    : attendance;

  const filteredPayroll = (portalUser?.role === 'branch_manager' || portalUser?.role === 'director' || portalUser?.role === 'sub_admin')
    ? payroll.filter(rec => filteredEmployeesIds.has(rec.employeeId))
    : payroll;

  const renderSidebarContent = (isMobile: boolean) => {
    const showExpanded = isMobile || isSidebarHovered;
    const userRole = portalUser?.role || 'employee';
    const allowed = (userRole === 'super_admin')
      ? ['dashboard', 'employees', 'hiring_onboarding', 'employee_lifecycle', 'asset_management', 'attendance', 'payroll', 'leaves', 'exit_management', 'ledger', 'admin', 'notices_support']
      : (adminSettings.rolePermissions?.[userRole] ?? DEFAULT_ROLE_PERMISSIONS[userRole] ?? []);

    const isTabAllowed = (tabId: string) => allowed.includes(tabId) || allowed.includes(`${tabId}:view`);

    const isPasswordGatewayAllowed = ['super_admin', 'admin', 'hr', 'sub_admin', 'director'].includes(userRole);
    const isTicketsAllowed = userRole !== 'recruiter';

    const pendingPasswordRequests = isPasswordGatewayAllowed ? passwordRequests.filter(r => r.status === 'Pending').length : 0;
    const pendingTickets = isTicketsAllowed ? hrTickets.filter(tk => tk.status === 'Pending').length : 0;
    const totalPending = pendingPasswordRequests + pendingTickets;

    const tabs = [
      { id: 'dashboard' as const, label: uiTexts.dashboard, icon: TrendingUp },
      { id: 'employees' as const, label: uiTexts.employees, icon: Users },
      { id: 'hiring_onboarding' as const, label: 'Hiring & Onboarding', icon: UserPlus },
      { id: 'employee_lifecycle' as const, label: 'Lifecycle', icon: Award },
      { id: 'asset_management' as const, label: 'Asset Management', icon: Package },
      { id: 'attendance' as const, label: uiTexts.attendance, icon: Calendar },
      { id: 'payroll' as const, label: uiTexts.payroll, icon: CreditCard },
      { id: 'leaves' as const, label: uiTexts.leaves, icon: CalendarDays },
      { id: 'exit_management' as const, label: 'Exit & Clearance', icon: UserX },
      { id: 'ledger' as const, label: uiTexts.ledger, icon: FileSpreadsheet },
      { id: 'notices_support' as const, label: userRole === 'recruiter' ? ('Company Notices & Circulars') : ('Notices & HR Support Helpdesk'), icon: Megaphone },
      { id: 'admin' as const, label: uiTexts.adminSettings, icon: SettingsIcon },
    ].filter(item => isTabAllowed(item.id));

    return (
      <div className="flex flex-col h-full justify-between w-full select-none">
        <div className={`flex flex-col ${showExpanded ? 'items-start w-full' : 'items-center'}`}>
          {/* Header & Logo */}
          <div className="flex items-center justify-between w-full mb-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-xs transform hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer relative group border border-emerald-500/20 shadow-emerald-950/20 shrink-0 overflow-hidden">
                <img 
                  src={getDirectImageUrl(adminSettings.companyLogo)} 
                  alt={adminSettings.companyName || 'Rathi Buildmart'} 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer" />
                {!showExpanded && (
                  <div className="absolute left-11 scale-0 group-hover:scale-100 transition-all duration-200 origin-left bg-[#021810] text-white border border-[#10b981]/20 px-2 py-0.5 rounded shadow-xl pointer-events-none z-50 text-[9px] font-bold whitespace-nowrap">
                    {uiTexts.appName}
                  </div>
                )}
              </div>
              {showExpanded && (
                <div className="flex flex-col min-w-0 animate-fadeIn">
                  <span className="text-[10px] font-black tracking-wider text-white uppercase font-sans truncate">
                    {adminSettings.companyName || 'RATHI MART'}
                  </span>
                  <span className="text-[7.5px] font-bold text-emerald-400 uppercase tracking-widest font-mono truncate">
                    {uiTexts.appName}
                  </span>
                </div>
              )}
            </div>

            {/* Close button for Mobile only */}
            {isMobile && (
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 rounded-lg bg-emerald-950/50 border border-emerald-500/20 text-emerald-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Tabs */}
          <nav className={`flex flex-col ${showExpanded ? 'items-start w-full gap-1' : 'items-center gap-1'}`}>
            {tabs.map((item) => {
              const IconComponent = item.icon;
              const isActive = currentTab === item.id;
              
              if (item.id === 'notices_support') {
                return (
                  <div key={item.id} className="relative group flex flex-col items-start w-full">
                    <div className="relative flex items-center justify-start w-full">
                      <button
                        onClick={() => {
                          navigateToTab(item.id);
                          if (isMobile) {
                            setIsMobileMenuOpen(false);
                          }
                        }}
                        className={`flex items-center rounded-lg transition-all duration-200 cursor-pointer relative ${
                          showExpanded ? 'w-full h-8 px-2 justify-start gap-2' : 'w-8 h-8 justify-center'
                        } ${
                          isActive
                            ? 'bg-emerald-500/15 text-[#10b981] shadow-[0_0_10px_rgba(16,185,129,0.12)] border border-emerald-500/30 font-bold'
                            : 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/5'
                        }`}
                        id={`tab-${item.id}`}
                      >
                        {isActive && (
                          <span className={`absolute left-0 w-1 bg-[#10b981] rounded-r-full shadow-[0_0_6px_#10b981] ${
                            showExpanded ? 'h-3' : 'h-3.5'
                          }`} />
                        )}
                        <div className="relative flex items-center justify-center shrink-0">
                          <IconComponent className="w-4 h-4" />
                          {!showExpanded && totalPending > 0 && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-rose-500 ring-2 ring-slate-950 flex items-center justify-center text-[7px] text-white font-black animate-pulse">
                              {totalPending}
                            </span>
                          )}
                        </div>
                        {showExpanded && (
                          <div className="flex items-center justify-between w-full min-w-0 pr-0.5 gap-1.5">
                            <span className="text-[9.5px] font-semibold tracking-wide whitespace-nowrap animate-fadeIn truncate">
                              {item.label}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              <Bell className={`w-2.5 h-2.5 ${totalPending > 0 ? 'text-rose-500 animate-pulse' : 'text-slate-500'}`} />
                              {totalPending > 0 && (
                                <span className="px-1 py-0.25 rounded-full bg-rose-500 text-white text-[7.5px] font-black animate-pulse leading-none">
                                  {totalPending}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </button>
                      {!showExpanded && (
                        <div className="absolute left-11 scale-0 group-hover:scale-100 transition-all duration-200 origin-left bg-[#021810] text-[#cbd5e1] border border-[#10b981]/20 text-[8.5px] font-bold px-2 py-0.5 rounded whitespace-nowrap shadow-xl pointer-events-none z-50">
                          {item.label}
                        </div>
                      )}
                    </div>

                    {/* SUB-MENU: Only when notices_support and showExpanded */}
                    {showExpanded && (
                      <div className={`w-full flex-col gap-0.5 pl-2.5 ml-2.5 border-l border-emerald-500/20 my-0.5 animate-fadeIn ${isActive ? 'flex' : 'hidden group-hover:flex'}`}>
                        {/* Sub-item: Manage Announcements */}
                        <button
                          onClick={() => {
                            navigateToTab('notices_support', 'announcements');
                            if (isMobile) {
                              setIsMobileMenuOpen(false);
                            }
                          }}
                          className={`flex items-center justify-between w-full h-6.5 px-1.5 rounded-md transition-all duration-200 text-left ${
                            isActive && activeNoticeSubTab === 'announcements'
                              ? 'bg-emerald-500/10 text-[#10b981] font-bold border border-emerald-500/20'
                              : 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/5'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Megaphone className="w-2.5 h-2.5 shrink-0" />
                            <span className="text-[8.5px] font-semibold truncate">
                              {'Manage Announcements'}
                            </span>
                          </div>
                          <span className="px-1 py-0.25 text-[7px] font-bold rounded-full bg-slate-800 text-slate-300 font-mono">
                            {announcements.length}
                          </span>
                        </button>

                        {/* Sub-item: Forgot Password Gateways */}
                        {isPasswordGatewayAllowed && (
                          <button
                            onClick={() => {
                              navigateToTab('notices_support', 'passwords');
                              if (isMobile) {
                                setIsMobileMenuOpen(false);
                              }
                            }}
                            className={`flex items-center justify-between w-full h-6.5 px-1.5 rounded-md transition-all duration-200 text-left ${
                              isActive && activeNoticeSubTab === 'passwords'
                                ? 'bg-emerald-500/10 text-[#10b981] font-bold border border-emerald-500/20'
                                : 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/5'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <KeyRound className="w-2.5 h-2.5 shrink-0" />
                              <span className="text-[8.5px] font-semibold truncate">
                                {'Forgot Password Gateways'}
                              </span>
                            </div>
                            {pendingPasswordRequests > 0 && (
                              <span className="px-1 py-0.25 text-[7px] font-black rounded-full bg-rose-500 text-white font-mono animate-pulse">
                                {pendingPasswordRequests}
                              </span>
                            )}
                          </button>
                        )}

                        {/* Sub-item: HR Helpdesk Support Tickets */}
                        {isTicketsAllowed && (
                          <button
                            onClick={() => {
                              navigateToTab('notices_support', 'tickets');
                              if (isMobile) {
                                setIsMobileMenuOpen(false);
                              }
                            }}
                            className={`flex items-center justify-between w-full h-6.5 px-1.5 rounded-md transition-all duration-200 text-left ${
                              isActive && activeNoticeSubTab === 'tickets'
                                ? 'bg-emerald-500/10 text-[#10b981] font-bold border border-emerald-500/20'
                                : 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/5'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <LifeBuoy className="w-2.5 h-2.5 shrink-0" />
                              <span className="text-[8.5px] font-semibold truncate">
                                {'HR Helpdesk Support Tickets'}
                              </span>
                            </div>
                            {pendingTickets > 0 && (
                              <span className="px-1 py-0.25 text-[7px] font-black rounded-full bg-rose-500 text-white font-mono animate-pulse">
                                {pendingTickets}
                              </span>
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <div key={item.id} className="relative group flex items-center justify-start w-full">
                  <button
                    onClick={() => {
                      navigateToTab(item.id);
                      if (isMobile) {
                        setIsMobileMenuOpen(false);
                      }
                    }}
                    className={`flex items-center rounded-lg transition-all duration-200 cursor-pointer relative ${
                      showExpanded ? 'w-full h-8 px-2 justify-start gap-2' : 'w-8 h-8 justify-center'
                    } ${
                      isActive
                        ? 'bg-emerald-500/15 text-[#10b981] shadow-[0_0_10px_rgba(16,185,129,0.12)] border border-emerald-500/30 font-bold'
                        : 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/5'
                    }`}
                    id={`tab-${item.id}`}
                  >
                    {isActive && (
                      <span className={`absolute left-0 w-1 bg-[#10b981] rounded-r-full shadow-[0_0_6px_#10b981] ${
                        showExpanded ? 'h-3' : 'h-3.5'
                      }`} />
                    )}
                    <div className="relative flex items-center justify-center shrink-0">
                      <IconComponent className="w-4 h-4" />
                      {!showExpanded && item.id === 'employees' && employees.filter(emp => emp.isApproved === false).length > 0 && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-slate-950 animate-pulse" />
                      )}
                    </div>
                    {showExpanded && (
                      <div className="flex items-center justify-between w-full min-w-0 pr-0.5 gap-1.5">
                        <span className="text-[9.5px] font-semibold tracking-wide whitespace-nowrap animate-fadeIn truncate">
                          {item.label}
                        </span>
                        {item.id === 'employees' && employees.filter(emp => emp.isApproved === false).length > 0 && (
                          <span className="px-1.5 py-0.25 rounded-full bg-amber-500 text-slate-950 text-[7.5px] font-black animate-pulse leading-none shrink-0">
                            {employees.filter(emp => emp.isApproved === false).length}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                  {!showExpanded && (
                    <div className="absolute left-11 scale-0 group-hover:scale-100 transition-all duration-200 origin-left bg-[#021810] text-[#cbd5e1] border border-[#10b981]/20 text-[8.5px] font-bold px-2 py-0.5 rounded whitespace-nowrap shadow-xl pointer-events-none z-50">
                      {item.label}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className={`flex flex-col ${showExpanded ? 'items-start w-full' : 'items-center'} gap-1.5 w-full mt-2 pt-1.5 border-t border-emerald-950/60`}>

          {spreadsheetLink && (userRole === 'admin' || userRole === 'super_admin') && (
            <div className="relative group flex items-center justify-start w-full">
              <a
                href={spreadsheetLink}
                target="_blank"
                rel="noreferrer"
                className={`flex items-center rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-all ${
                  showExpanded ? 'w-full h-7.5 px-2 justify-start gap-2' : 'w-7.5 h-7.5 justify-center'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
                {showExpanded && (
                  <span className="text-[9px] font-semibold whitespace-nowrap animate-fadeIn text-[#cbd5e1]">
                    {uiTexts.viewSheets}
                  </span>
                )}
              </a>
              {!showExpanded && (
                <div className="absolute left-11 scale-0 group-hover:scale-100 transition-all duration-200 origin-left bg-[#021810] text-[#cbd5e1] border border-[#10b981]/20 text-[8.5px] font-bold px-2 py-0.5 rounded whitespace-nowrap shadow-xl pointer-events-none z-50">
                  {uiTexts.viewSheets}
                </div>
              )}
            </div>
          )}

          {/* Theme Toggle */}
          <div 
            onClick={() => setThemeMode(prev => prev === 'light' ? 'dark' : 'light')}
            className={`flex cursor-pointer select-none transition-all duration-200 ${
              showExpanded 
                ? 'flex-row items-center justify-between w-full px-2 py-1 rounded-lg hover:bg-emerald-500/10' 
                : 'flex-col items-center gap-0.5 py-1 px-1 rounded-lg hover:bg-emerald-500/10'
            }`}
            title={themeMode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            id="btn-theme-toggle"
          >
            <div className="relative group flex items-center">
              <span className={themeMode === 'dark' ? 'text-amber-400' : 'text-emerald-400'}>
                {themeMode === 'dark' ? (
                  <Moon className="w-3 h-3 text-amber-300" />
                ) : (
                  <Sun className="w-3 h-3 text-emerald-400" />
                )}
              </span>
              {showExpanded && (
                <span className="text-[9px] font-semibold text-slate-300 ml-2 whitespace-nowrap animate-fadeIn">
                  {themeMode === 'dark' 
                    ? ('Dark Mode') 
                    : ('Light Mode')}
                </span>
              )}
              {!showExpanded && (
                <div className="absolute left-11 scale-0 group-hover:scale-100 transition-all duration-200 origin-left bg-[#021810] text-[#cbd5e1] border border-[#10b981]/20 text-[8.5px] font-bold px-2 py-0.5 rounded whitespace-nowrap shadow-xl pointer-events-none z-50">
                  {themeMode === 'dark' 
                    ? ('Dark Mode Active') 
                    : ('Light Mode Active')}
                </div>
              )}
            </div>
            
            <div className={`w-6 h-3.5 rounded-full p-[2px] transition-all flex items-center shadow-inner shrink-0 ${
              themeMode === 'dark' ? 'bg-amber-500/30 border border-amber-400 justify-end' : 'bg-emerald-950 border border-emerald-900 justify-start'
            }`}>
              <div className={`w-2.5 h-2.5 rounded-full shadow-xs transform transition-all ${
                themeMode === 'dark' ? 'bg-amber-400' : 'bg-white translate-x-1.5'
              }`} />
            </div>
          </div>

          {/* Logout */}
          <div className="relative group flex items-center justify-start w-full">
            <button
              onClick={handleLogout}
              className={`flex items-center rounded-lg text-red-400/80 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer ${
                showExpanded ? 'w-full h-7.5 px-2 justify-start gap-2' : 'w-7.5 h-7.5 justify-center'
              }`}
              id="btn-signout"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              {showExpanded && (
                <span className="text-[9px] font-semibold whitespace-nowrap animate-fadeIn">
                  {uiTexts.signout}
                </span>
              )}
            </button>
            {!showExpanded && (
              <div className="absolute left-11 scale-0 group-hover:scale-100 transition-all duration-200 origin-left bg-red-950 text-red-200 border border-red-900/30 text-[8.5px] font-bold px-2 py-0.5 rounded whitespace-nowrap shadow-xl pointer-events-none z-50">
                {uiTexts.signout}
              </div>
            )}
          </div>

          {/* User profile */}
          <div className={`relative group mt-0.5 flex items-center justify-start ${showExpanded ? 'w-full px-0.5 gap-2' : ''}`}>
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt="Profile"
                className="w-7 h-7 rounded-lg border border-emerald-500/30 object-cover shadow-xs hover:border-emerald-400 cursor-pointer transition-all duration-300 shrink-0"
                referrerPolicy="no-referrer" />
            ) : (
              <img
                src="https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=150&q=80"
                alt="Premium User"
                className="w-7 h-7 rounded-lg border border-emerald-500/30 object-cover shadow-xs transition-all duration-300 hover:border-emerald-400 cursor-pointer shrink-0"
                referrerPolicy="no-referrer" />
            )}
            {showExpanded && (
              <div className="flex flex-col min-w-0 animate-fadeIn">
                <p className="text-[9.5px] font-black text-slate-100 truncate">
                  {user?.displayName || 'Admin'}
                </p>
                <p className="text-[7.5px] font-medium text-emerald-400 truncate">
                  {user?.email || 'admin@rathibuildmart.com'}
                </p>
              </div>
            )}
            {!showExpanded && (
              <div className="absolute left-11 bottom-0 scale-0 group-hover:scale-100 transition-all duration-200 origin-left bg-[#021810] text-white border border-[#10b981]/20 p-2 rounded-lg shadow-2xl pointer-events-none z-50 min-w-[140px]">
                <p className="font-black text-[7.5px] text-emerald-400 tracking-wider uppercase mb-0.5">Active Portal User</p>
                <p className="text-[10px] font-bold text-slate-200 truncate">{user?.displayName || 'Rathi Build Mart'}</p>
                <p className="text-[8.5px] text-slate-400 truncate mt-0.5">{user?.email || 'admin@rathibuildmart.com'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  //Role-Specific Actionable System Notifications Engine
  const userNotifications = (() => {
    const userRole = portalUser?.role || 'employee';
    const list: Array<{
      id: string;
      title: string;
      description: string;
      category: string;
      color: 'emerald' | 'amber' | 'blue' | 'rose' | 'purple';
      targetTab: 'dashboard' | 'employees' | 'hiring_onboarding' | 'attendance' | 'payroll' | 'leaves' | 'exit_management' | 'notices_support' | 'admin';
      subTab?: 'announcements' | 'passwords' | 'tickets';
      badgeCount?: number;
    }> = [];

    if (userRole === 'recruiter') {
      let candidates: any[] = [];
      try {
        const saved = localStorage.getItem('payroll_candidates');
        if (saved) candidates = JSON.parse(saved);
      } catch (e) {}
      const openApplicants = candidates.filter(c => c.status === 'Applied' || c.status === 'Screening');
      if (openApplicants.length > 0) {
        list.push({
          id: 'n-rec-cand',
          title: `${openApplicants.length} New Candidate Applications`,
          description: 'Applicants waiting for screening & scorecards',
          category: 'Recruitment',
          color: 'blue',
          targetTab: 'hiring_onboarding',
          badgeCount: openApplicants.length
        });
      }

      let offers: any[] = [];
      try {
        const saved = localStorage.getItem('payroll_offers');
        if (saved) offers = JSON.parse(saved);
      } catch (e) {}
      if (offers.length > 0) {
        list.push({
          id: 'n-rec-off',
          title: `${offers.length} Active Offer Letters`,
          description: 'Candidate offer rollouts & onboarding tracking',
          category: 'Onboarding',
          color: 'emerald',
          targetTab: 'hiring_onboarding'
        });
      }

      let exits: any[] = [];
      try {
        const saved = localStorage.getItem('payroll_exit_records');
        if (saved) exits = JSON.parse(saved);
      } catch (e) {}
      const activeExits = exits.filter(e => e.status !== 'Relieved' && e.status !== 'Rejected');
      if (activeExits.length > 0) {
        list.push({
          id: 'n-rec-ext',
          title: `${activeExits.length} Pending Exit Clearances`,
          description: 'Staff resignation and No-Dues clearance tasks',
          category: 'Separation',
          color: 'rose',
          targetTab: 'exit_management',
          badgeCount: activeExits.length
        });
      }
    } else if (['super_admin', 'admin', 'hr', 'sub_admin', 'director'].includes(userRole)) {
      const pendingPwd = (passwordRequests || []).filter(p => p.status === 'Pending');
      if (pendingPwd.length > 0) {
        list.push({
          id: 'n-pwd-req',
          title: `${pendingPwd.length} Password Reset Requests`,
          description: 'Employee requests for portal login credential reset',
          category: 'Security Gateway',
          color: 'amber',
          targetTab: 'notices_support',
          subTab: 'passwords',
          badgeCount: pendingPwd.length
        });
      }

      const pendingLeaves = (leaveRequests || []).filter(l => l.status === 'Pending');
      if (pendingLeaves.length > 0) {
        list.push({
          id: 'n-leaves-req',
          title: `${pendingLeaves.length} Pending Leave Applications`,
          description: 'Staff leave applications awaiting approval',
          category: 'Leave Approvals',
          color: 'blue',
          targetTab: 'leaves',
          badgeCount: pendingLeaves.length
        });
      }

      const pendingTkts = (hrTickets || []).filter(t => t.status === 'Pending');
      if (pendingTkts.length > 0) {
        list.push({
          id: 'n-tkts-req',
          title: `${pendingTkts.length} HR Support Tickets`,
          description: 'Grievance or payroll support tickets raised by staff',
          category: 'HR Helpdesk',
          color: 'purple',
          targetTab: 'notices_support',
          subTab: 'tickets',
          badgeCount: pendingTkts.length
        });
      }

      if ((failedLogins || []).length > 0) {
        list.push({
          id: 'n-failed-logins',
          title: `${failedLogins.length} SecurityDevice Lock Logs`,
          description: 'Failed login attempts or mobile device lock alerts',
          category: 'Audit',
          color: 'rose',
          targetTab: 'admin'
        });
      }
    } else if (userRole === 'branch_manager') {
      const pendingLeaves = (leaveRequests || []).filter(l => l.status === 'Pending');
      if (pendingLeaves.length > 0) {
        list.push({
          id: 'n-bm-leaves',
          title: `${pendingLeaves.length} Branch Staff Leaves`,
          description: 'Leave applications from your branch team',
          category: 'Branch',
          color: 'blue',
          targetTab: 'leaves',
          badgeCount: pendingLeaves.length
        });
      }
    } else {
      const myLeaves = (leaveRequests || []).filter(l => l.employeeId === portalUser?.employee?.id || l.employeeName === portalUser?.name);
      if (myLeaves.length > 0) {
        list.push({
          id: 'n-emp-leaves',
          title: 'My Leave Applications',
          description: 'Track approval status of submitted leave requests',
          category: 'My Portal',
          color: 'emerald',
          targetTab: 'leaves'
        });
      }
    }

    const activeAnns = (announcements || []).filter(a => !a.expiryDate || a.expiryDate >= new Date().toISOString().split('T')[0]);
    if (activeAnns.length > 0) {
      list.push({
        id: 'n-active-anns',
        title: `${activeAnns.length} Company Circulars`,
        description: 'Latest policy updates and general announcements',
        category: 'Circulars',
        color: 'emerald',
        targetTab: 'notices_support',
        subTab: 'announcements'
      });
    }

    return list;
  })();

  //3. Render DashboardWorkspace after Login
  return (
    <div className={`h-screen w-screen flex overflow-hidden font-sans transition-colors duration-300 ${
      themeMode === 'dark' ? 'bg-[#0a120e] text-slate-100 dark' : 'bg-[#f1f5f9] text-[#1e293b]'
    }`}>
      
      {/* Mobile Drawer Overlay Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 md:hidden animate-fadeIn"
          onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Mobile Sidebar Navigation Drawer */}
      <aside 
        className={`fixed inset-y-0 left-0 h-full bg-gradient-to-b from-[#031c12] via-[#02110c] to-[#010906] text-[#cbd5e1] flex flex-col justify-between z-50 p-4.5 no-print w-[220px] border-r border-emerald-500/15 transition-transform duration-300 ease-in-out transform md:hidden shadow-2xl ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {renderSidebarContent(true)}
      </aside>

      {/* Left Sidebar navigation */}
      <aside 
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
        className={`my-2.5 ml-2.5 mr-1 h-[calc(100vh-1.25rem)] bg-gradient-to-b from-[#031c12] via-[#02110c] to-[#010906] text-[#cbd5e1] flex flex-col justify-between rounded-[1.75rem] border border-emerald-500/15 shadow-[0_20px_50px_-12px_rgba(2,17,12,0.8)] shrink-0 no-print py-3.5 transition-all duration-300 ease-in-out relative z-40 hidden md:flex ${
          isSidebarHovered ? 'w-[205px] px-3 items-start' : 'w-[52px] px-1.5 items-center'
        }`}
      >
        {renderSidebarContent(false)}
      </aside>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Compact Header */}
        <header className={`h-[52px] border-b px-3 sm:px-5 flex items-center justify-between shrink-0 shadow-xxs transition-colors duration-300 ${
          themeMode === 'dark' ? 'bg-[#11221b] border-[#1e3a2f] text-slate-100' : 'bg-white border-[#e2e8f0]'
        }`}>
          <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
            {/* Mobile Toggle Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-200 bg-white cursor-pointer mr-1 shrink-0 transition-all active:scale-95"
              title="Open Navigation Menu"
            >
              <Menu className="w-4 h-4" />
            </button>

            <span className="text-[11px] font-semibold text-gray-500 hidden sm:inline">
              {'Database:'}
            </span>
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 text-[10px] font-mono px-2 py-0.5 rounded font-bold max-w-[120px] sm:max-w-[200px] truncate">
              {spreadsheetId ? 'Google Sheet & Firestore' : 'Cloud Firestore (Active)'}
            </span>

            {/* Real-time Connection Badge */}
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border shrink-0 ${
              isOnline 
                ? 'bg-emerald-50/50 text-emerald-700 border-emerald-200/50' 
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              <span className={`w-1 h-1 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              {isOnline ? ('Online') : ('Offline')}
            </span>

            {/* Live Compact Storage Indicator */}
            {portalUser?.role === 'admin' && (
              <FirebaseStorageMonitor
                compact
                language={language}
                employees={employees}
                attendance={attendance}
                payroll={payroll}
                adminSettings={adminSettings}
                emailLogs={emailLogs}
                announcements={announcements}
                failedLogins={failedLogins} />
            )}
          </div>

          {/* Controls Area */}
          <div className="flex items-center gap-3 relative">
            
            {/* Super Admin Role Switcher Dropdown - ONLY Visible to Super Admin */}
            {(portalUser?.isPrimarySuperAdmin || portalUser?.role === 'super_admin' || portalUser?.id === 'admin') && (
              <div className="relative inline-flex items-center">
                <div className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 dark:from-emerald-950/40 dark:via-teal-950/40 dark:to-slate-900/60 border border-emerald-500/30 rounded-xl px-2.5 py-1 text-slate-800 dark:text-slate-200 shadow-3xs">
                  <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400 flex items-center gap-1 font-mono">
                    👑 {'Role:'}
                  </span>
                  <select
                    value={portalUser?.role || 'super_admin'}
                    onChange={(e) => handleRoleSwitch(e.target.value as UserRole)}
                    className="bg-transparent text-[11px] font-black text-slate-900 dark:text-emerald-300 border-none outline-none cursor-pointer pr-1 font-sans focus:ring-0"
                  >
                    <option value="super_admin" className="dark:bg-[#11221b] text-slate-900 dark:text-white">1. Super Admin</option>
                    <option value="admin" className="dark:bg-[#11221b] text-slate-900 dark:text-white">2. Admin</option>
                    <option value="hr" className="dark:bg-[#11221b] text-slate-900 dark:text-white">3. HR</option>
                    <option value="asset_manager" className="dark:bg-[#11221b] text-slate-900 dark:text-white">4. Asset Manager</option>
                    <option value="recruiter" className="dark:bg-[#11221b] text-slate-900 dark:text-white">5. Recruiter</option>
                    <option value="branch_manager" className="dark:bg-[#11221b] text-slate-900 dark:text-white">6. Branch Manager</option>
                    <option value="director" className="dark:bg-[#11221b] text-slate-900 dark:text-white">7. Director</option>
                  </select>
                </div>
              </div>
            )}
            
            {/* Sync Badge Button */}
            <button
              onClick={() => setIsSyncPanelOpen(!isSyncPanelOpen)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider transition-all duration-200 cursor-pointer hover:shadow-xs active:scale-95 ${
                syncStatus === 'synced' 
                  ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100' 
                  : syncStatus === 'syncing' 
                    ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100' 
                    : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
              }`}
              title={'Click to view Sync History & Log'}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${
                syncStatus === 'synced' 
                  ? 'bg-green-500 animate-pulse' 
                  : syncStatus === 'syncing' 
                    ? 'bg-amber-500 animate-spin border border-t-transparent border-amber-800' 
                    : 'bg-red-500'
              }`}></span>
              {syncStatus === 'synced' ? uiTexts.synced : syncStatus === 'syncing' ? uiTexts.syncing : uiTexts.syncError}
            </button>

            {/* Force Refresh */}
            <button
              onClick={handleForceSyncNow}
              disabled={isLoadingData}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200 shadow-xxs bg-white cursor-pointer transition-all active:scale-95"
              title={uiTexts.refresh}
              id="refresh-data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? 'animate-spin text-blue-600' : ''}`} />
            </button>

            {/* Role-Aware System Notifications Bell */}
            {portalUser && (
              <div className="relative flex items-center">
                <button
                  onClick={() => setIsBellPopoverOpen(!isBellPopoverOpen)}
                  className={`p-1.5 rounded-lg border shadow-xxs cursor-pointer transition-all active:scale-95 relative ${
                    userNotifications.length > 0
                      ? 'bg-emerald-50/80 text-[#03623c] border-emerald-200/80 hover:bg-emerald-100'
                      : 'bg-white text-gray-400 hover:text-gray-600 hover:bg-gray-100 border-gray-200'
                  }`}
                  title={'System Notifications'}
                  id="btn-bell-notifications"
                >
                  <Bell className={`w-3.5 h-3.5 ${userNotifications.length > 0 ? 'text-[#03623c]' : ''}`} />
                  {userNotifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 px-1.5 py-0.2 text-[9px] font-black bg-rose-500 text-white rounded-full border border-white font-mono shadow-xs">
                      {userNotifications.length}
                    </span>
                  )}
                </button>

                {isBellPopoverOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40 cursor-default" 
                      onClick={() => setIsBellPopoverOpen(false)} />
                    <div className="absolute right-0 top-10 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 p-4 space-y-3 text-left animate-in fade-in slide-in-from-top-2 duration-200 max-h-[85vh] flex flex-col">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 shrink-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider">
                            {'Notifications'}
                          </span>
                          <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-emerald-100 text-emerald-800 uppercase font-mono">
                            {(portalUser.role || 'user').replace('_', ' ')}
                          </span>
                        </div>
                        <button 
                          onClick={() => setIsBellPopoverOpen(false)}
                          className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      
                      <div className="space-y-2.5 font-sans overflow-y-auto pr-1 flex-1 scrollbar-none">
                        {/* Cloud status card for super adminsadmins */}
                        {['super_admin', 'admin'].includes(portalUser.role) && (
                          <div className="flex items-start gap-2.5 bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-100">
                            <Database className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <div className="space-y-0.5">
                              <p className="text-[11px] font-bold text-slate-800 leading-tight">
                                {'Cloud Firestore Active'}
                              </p>
                              <p className="text-[9px] text-slate-500 leading-normal font-semibold">
                                {'Database synced with Cloud Firestore. Google Sheets integration optional.'}
                              </p>
                            </div>
                          </div>
                        )}

                        {userNotifications.length === 0 ? (
                          <div className="text-center py-6 text-slate-400 space-y-1">
                            <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-500 opacity-80" />
                            <p className="text-[11px] font-bold text-slate-600">
                              {'All caught up!'}
                            </p>
                            <p className="text-[9px] text-slate-400 font-semibold">
                              {'No pending tasks requiring immediate action'}
                            </p>
                          </div>
                        ) : (
                          userNotifications.map((notif) => (
                            <div 
                              key={notif.id}
                              onClick={() => {
                                setIsBellPopoverOpen(false);
                                navigateToTab(notif.targetTab, notif.subTab);
                              }}
                              className="p-3 rounded-xl border border-slate-100 hover:border-emerald-200 bg-slate-50/50 hover:bg-emerald-50/30 transition-all cursor-pointer group space-y-1"
                            >
                              <div className="flex items-center justify-between">
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono ${
                                  notif.color === 'rose' ? 'bg-rose-100 text-rose-700' :
                                  notif.color === 'amber' ? 'bg-amber-100 text-amber-700' :
                                  notif.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                                  notif.color === 'purple' ? 'bg-purple-100 text-purple-700' :
                                  'bg-emerald-100 text-emerald-700'
                                }`}>
                                  {notif.category}
                                </span>
                                <span className="text-[9px] font-bold text-emerald-700 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                                  {'Open'} <ChevronRight className="w-3 h-3" />
                                </span>
                              </div>
                              <p className="text-[11px] font-bold text-slate-800 leading-tight">
                                {notif.title}
                              </p>
                              <p className="text-[9.5px] text-slate-500 font-semibold leading-normal">
                                {notif.description}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Detailed Sync Log Panel Popover */}
            {isSyncPanelOpen && (
              <>
                {/* Backdrop overlay to close when clicking outside */}
                <div 
                  className="fixed inset-0 z-40 cursor-default" 
                  onClick={() => setIsSyncPanelOpen(false)} />
                
                {/* Panel Container */}
                <div className="absolute right-0 top-10 w-96 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 p-4 space-y-4 text-left overflow-hidden font-sans animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-slate-500" />
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                        {'Database Sync Control'}
                      </h4>
                    </div>
                    <button
                      onClick={() => setIsSyncPanelOpen(false)}
                      className="text-slate-400 hover:text-slate-600 text-xs font-bold px-1.5 py-0.5 rounded hover:bg-slate-50"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Connection Details */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <span>{'Connection Status'}</span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                        token 
                          ? 'bg-green-100 text-green-700' 
                          : isOnline 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-rose-100 text-rose-700'
                      }`}>
                        {token 
                          ? ('Google Sheets & Firestore Connected')
                          : isOnline
                            ? ('Firestore Cloud Online (Sheet Unlinked)')
                            : ('Offline Mode (Local Cache)')}
                      </span>
                    </div>

                    {spreadsheetId && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-600">
                          <span className="font-semibold">{'Spreadsheet ID:'}</span>
                          <span className="font-mono text-[10px] text-slate-500 truncate max-w-[180px]" title={spreadsheetId}>
                            {spreadsheetId}
                          </span>
                        </div>
                        {spreadsheetLink && (portalUser?.role === 'admin' || portalUser?.role === 'super_admin') && (
                          <div className="flex justify-end pt-1">
                            <a
                              href={spreadsheetLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                            >
                              {uiTexts.viewSheets} →
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Option to Link Google Sheets if currently unlinked */}
                    {!token && (
                      <div className="pt-1.5 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={handleLogin}
                          disabled={isLoggingIn}
                          className="w-full bg-[#03623c] hover:bg-[#024a2d] text-white py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-3xs active:scale-95"
                        >
                          {isLoggingIn ? (
                            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                              <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032 s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2 C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.761H12.545z" />
                            </svg>
                          )}
                          <span>{'Link Google Sheets Account'}</span>
                        </button>
                      </div>
                    )}

                    {/* Last Sync Time */}
                    <div className="flex justify-between items-center text-xs text-slate-600 border-t border-slate-100 pt-2 mt-2">
                      <span className="font-semibold">{'Last Successful Sync:'}</span>
                      <span className="font-mono text-[11px] font-bold text-slate-700">
                        {lastSuccessfulSyncTime ? (
                          new Date(lastSuccessfulSyncTime).toLocaleTimeString(undefined, {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          }) + ' ' + new Date(lastSuccessfulSyncTime).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric'
                          })
                        ) : (
                          'Never'
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Actions inside panel */}
                  <div className="flex gap-2">
                    <button
                      onClick={handleForceSyncNow}
                      disabled={isLoadingData}
                      className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white border border-emerald-800 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-3xs active:scale-95 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? 'animate-spin' : ''}`} />
                      {'Force Sync Now'}
                    </button>
                    <button
                      onClick={() => {
                        setSyncLogs([
                          {
                            id: 'cleared',
                            timestamp: new Date().toISOString(),
                            operation: 'Log Cleared',
                            status: 'success',
                            details: 'Recent sync log cleared.'
                          }
                        ]);
                        localStorage.setItem('payroll_sync_logs', JSON.stringify([{
                          id: 'cleared',
                          timestamp: new Date().toISOString(),
                          operation: 'Log Cleared',
                          status: 'success',
                          details: 'Recent sync log cleared.'
                        }]));
                      }}
                      className="bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      {'Clear Logs'}
                    </button>
                  </div>

                  {/* Troubleshooting Reset for Sync Errors */}
                  {syncStatus === 'error' && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2 font-sans">
                      <p className="text-[10px] text-amber-800 leading-normal font-semibold">
                        {'Persistent "Failed to Fetch" or "Sync Error"? Click below to dismiss error, or reset session.'}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSyncStatus('synced');
                        }}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 shadow-3xs"
                      >
                        ✓ {'Dismiss Error & Use Active Database'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleClearSheetsSession();
                          setSyncStatus('synced');
                          alert('Google Sheets cache cleared. Working safely with Firestore & Local storage.');
                        }}
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 shadow-3xs"
                      >
                        <RefreshCw className="w-3 h-3 animate-spin" style={{ animationDuration: '3s' }} />
                        {'Reset Google Sheets Session & Relogin'}
                      </button>
                    </div>
                  )}

                  {/* Sync Logs list */}
                  <div className="space-y-2">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {'Recent Operations Log'}
                    </h5>
                    
                    <div className="max-h-56 overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-50 bg-slate-50/50">
                      {syncLogs.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400 font-medium">
                          {'No recent logs'}
                        </div>
                      ) : (
                        syncLogs.map((log) => {
                          const dateObj = new Date(log.timestamp);
                          const timeStr = dateObj.toLocaleTimeString(undefined, {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          });
                          return (
                            <div key={log.id} className="p-2.5 flex items-start gap-2.5 hover:bg-slate-50 transition-colors">
                              {/* Status Bullet */}
                              <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                                log.status === 'success' 
                                  ? 'bg-green-500' 
                                  : log.status === 'syncing' 
                                    ? 'bg-amber-500 animate-pulse' 
                                    : 'bg-red-500'
                              }`} />
                              
                              <div className="flex-1 min-w-0 space-y-0.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-slate-700 truncate">{log.operation}</span>
                                  <span className="text-[9px] font-mono text-slate-400 font-semibold shrink-0">{timeStr}</span>
                                </div>
                                <p className="text-[10px] text-slate-500 leading-normal font-medium break-words">
                                  {log.details}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Scrollable Workspace Wrapper */}
        <main className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoadingData && employees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white/50 rounded-lg border border-gray-200">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-2 text-xs text-gray-400 font-semibold">{uiTexts.syncing}</p>
            </div>
          ) : (
            <div className="w-full">
              {currentTab === 'dashboard' && (
                <Dashboard 
                  employees={filteredEmployees} 
                  attendance={filteredAttendance} 
                  payroll={filteredPayroll} 
                  language={language} 
                  onNavigate={navigateToTab}
                  passwordRequests={passwordRequests}
                  hrTickets={hrTickets}
                  onNavigateNoticeSubTab={(subTab) => {
                    navigateToTab('notices_support', subTab);
                  }}
                  failedLogins={failedLogins}
                  onUpdateEmployee={handleUpdateEmployee}
                  leaveRequests={leaveRequests}
                  onUpdateLeaveRequestStatus={handleUpdateLeaveRequestStatus}
                  userRole={portalUser?.role || 'employee'}
                  portalUser={portalUser} />
              )}
              {currentTab === 'employees' && (
                <EmployeeList 
                  employees={filteredEmployees} 
                  onAddEmployee={handleAddEmployee} 
                  onUpdateEmployee={handleUpdateEmployee} 
                  onDeleteEmployee={handleDeleteEmployee}
                  onBulkAddEmployees={handleBulkAddEmployees}
                  language={language} 
                  adminSettings={adminSettings}
                  portalUser={portalUser} />
              )}
              {currentTab === 'hiring_onboarding' && (
                <HiringOnboarding 
                  employees={filteredEmployees}
                  language={language}
                  adminSettings={adminSettings}
                  spreadsheetId={spreadsheetId}
                  googleToken={token} />
              )}
              {currentTab === 'employee_lifecycle' && (
                <EmployeeLifecycleModule 
                  employees={filteredEmployees}
                  language={language} />
              )}
              {currentTab === 'asset_management' && (
                <AssetManagementModule 
                  employees={filteredEmployees}
                  language={language}
                  userRole={portalUser?.role || 'employee'}
                  portalUser={portalUser}
                  adminSettings={adminSettings}
                  spreadsheetId={spreadsheetId}
                  googleToken={token} />
              )}
              {currentTab === 'exit_management' && (
                <ExitManagementModule 
                  employees={filteredEmployees}
                  language={language} />
              )}
              {currentTab === 'attendance' && (
                <AttendanceTracker 
                  employees={filteredEmployees} 
                  attendanceRecords={filteredAttendance} 
                  onSaveAttendance={handleSaveAttendance} 
                  onUpdateAttendanceRecords={handleUpdateAttendanceRecords}
                  language={language} 
                  adminSettings={adminSettings}
                  portalUser={portalUser}
                  auditLogs={auditLogs}
                  onAddAuditLogs={handleAddAuditLogs} />
              )}
              {currentTab === 'payroll' && (
                <PayrollCalculator 
                  employees={filteredEmployees} 
                  attendanceRecords={filteredAttendance} 
                  payrollRecords={filteredPayroll} 
                  onSavePayroll={handleSavePayroll} 
                  onUpdateEmployees={handleBulkAddEmployees}
                  language={language} 
                  adminSettings={adminSettings}
                  portalUser={portalUser} />
              )}
              {currentTab === 'leaves' && (
                <LeavesHolidays 
                  employees={filteredEmployees}
                  attendance={filteredAttendance}
                  language={language}
                  adminSettings={adminSettings}
                  onUpdateSettings={handleSaveSettings}
                  portalUser={portalUser}
                  leaveRequests={leaveRequests}
                  onAddLeaveRequest={handleAddLeaveRequest}
                  onUpdateLeaveRequestStatus={handleUpdateLeaveRequestStatus} />
              )}
              {currentTab === 'ledger' && (
                <EmployeeLedger 
                  employees={filteredEmployees}
                  payrollRecords={filteredPayroll}
                  language={language}
                  adminSettings={adminSettings} />
              )}
              {currentTab === 'notices_support' && (
                <NoticesSupport 
                  language={language}
                  announcements={announcements}
                  setAnnouncements={setAnnouncements}
                  hrTickets={hrTickets}
                  setHrTickets={setHrTickets}
                  passwordRequests={passwordRequests}
                  setPasswordRequests={setPasswordRequests}
                  portalUser={portalUser}
                  activeSubTab={activeNoticeSubTab}
                  setActiveSubTab={setActiveNoticeSubTab} />
              )}
              {currentTab === 'admin' && (
                <Settings 
                  settings={adminSettings}
                  onSaveSettings={handleSaveSettings}
                  language={language}
                  failedLogins={failedLogins}
                  onClearFailedLogins={handleClearFailedLogins}
                  announcements={announcements}
                  setAnnouncements={setAnnouncements}
                  hrTickets={hrTickets}
                  setHrTickets={setHrTickets}
                  passwordRequests={passwordRequests}
                  setPasswordRequests={setPasswordRequests}
                  employees={employees}
                  setEmployees={setEmployees}
                  candidates={candidates}
                  setCandidates={setCandidates}
                  attendance={attendance}
                  setAttendance={setAttendance}
                  archivedEmployees={archivedEmployees}
                  setArchivedEmployees={setArchivedEmployees}
                  archivedCandidates={archivedCandidates}
                  setArchivedCandidates={setArchivedCandidates}
                  archivedAttendance={archivedAttendance}
                  setArchivedAttendance={setArchivedAttendance}
                  spreadsheetId={spreadsheetId}
                  googleToken={token}
                  payroll={payroll}
                  onImportData={handleImportDatabase}
                  onClearSheetsSession={handleClearSheetsSession}
                  auditLogs={auditLogs}
                  onClearAuditLogs={handleClearAuditLogs}
                  portalUser={portalUser}
                  emailLogs={emailLogs}
                  onClearEmailLogs={handleClearEmailLogs}
                  onSendTestEmail={handleSendTestEmail}
                  onResendEmail={handleResendEmail} />
              )}
            </div>
          )}
        </main>

        {/* Compact Footer */}
        <footer className="bg-white border-t border-[#e2e8f0] py-2 text-center text-[9px] font-mono text-gray-400 font-semibold no-print shrink-0">
          &copy; {new Date().getFullYear()} Payroll Management System | Powered by Google Workspace Integration API
        </footer>
      </div>

      {/* Beautiful Modal Seed Dialog on Newly Created Empty Sheets */}
      {showSeedDialog && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-lg border border-gray-200 shadow-2xl max-w-sm w-full p-5 text-center space-y-3.5">
            <div className="inline-flex bg-blue-50 text-blue-600 p-3 rounded-full">
              <AlertCircle className="w-6 h-6 animate-bounce" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 font-display">{uiTexts.seedingTitle}</h3>
            <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
              {uiTexts.seedingDesc}
            </p>
            <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
              <button
                onClick={handleSeedDemoData}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                id="btn-seed"
              >
                {uiTexts.seedYes}
                <ArrowRight className="w-3 h-3" />
              </button>
              <button
                onClick={() => setShowSeedDialog(false)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer"
                id="btn-cancel-seed"
              >
                {uiTexts.seedNo}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Reusable Confirmation Modal */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-[#020617]/70 z-[150] flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center space-y-4">
            <div className="inline-flex bg-red-500/10 text-red-400 p-3 rounded-full">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider">{confirmDialog.title}</h3>
            <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
              {confirmDialog.message}
            </p>
            <div className="pt-2 flex gap-3 justify-center">
              <button
                onClick={confirmDialog.onConfirm}
                className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-97"
              >
                {'Yes, Proceed'}
              </button>
              <button
                onClick={() => setConfirmDialog(null)}
                className="w-full bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-97"
              >
                {'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Automatic Pending Items Alert Modal Popup */}
      {showPendingAlertModal && (
        <div className="fixed inset-0 bg-slate-950/80 z-[150] flex items-center justify-center p-4 backdrop-blur-md font-sans animate-fadeIn">
          <div 
            style={{ borderRadius: '24px' }}
            className="bg-slate-950 border border-[#10b981]/30 shadow-[0_25px_60px_rgba(2,21,14,0.6)] max-w-lg w-full overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200 text-left text-white"
          >
            {/* Header with deep premium gradient */}
            <div className="bg-gradient-to-r from-slate-900 via-[#041f15] to-[#01140e] border-b border-[#10b981]/15 px-6 py-4.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg animate-pulse">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#10b981] font-mono">
                    {'Action Required'}
                  </h3>
                  <h4 className="text-sm font-bold text-slate-100 tracking-tight">
                    {'Unresolved Action Items'}
                  </h4>
                </div>
              </div>
              <button
                onClick={() => {
                  sessionStorage.setItem('dismissed_pending_alert', 'true');
                  setShowPendingAlertModal(false);
                }}
                className="text-slate-400 hover:text-white hover:bg-white/5 p-2 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
              <div className="bg-gradient-to-r from-rose-500/10 to-transparent border border-rose-500/20 rounded-xl p-3.5 flex gap-3 items-start text-xs text-rose-200 leading-relaxed">
                <AlertCircle className="w-4.5 h-4.5 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  {'Outstanding items require immediate attention. Employees may be locked out of their accounts, or have pressing payroll and helpdesk queries.'}
                </div>
              </div>

              {/* Stats overview row with beautiful glow */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/60 border border-amber-500/20 p-4 rounded-2xl text-center shadow-inner relative overflow-hidden group hover:border-amber-500/40 transition-all duration-300">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-full blur-xl" />
                  <span className="text-3xl font-black text-amber-400 font-mono tracking-tight block">
                    {passwordRequests.filter(r => r.status === 'Pending').length}
                  </span>
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-1.5 block">
                    {'Password Resets'}
                  </span>
                </div>
                <div className="bg-slate-900/60 border border-emerald-500/20 p-4 rounded-2xl text-center shadow-inner relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-300">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl" />
                  <span className="text-3xl font-black text-emerald-400 font-mono tracking-tight block">
                    {hrTickets.filter(r => r.status === 'Pending').length}
                  </span>
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-1.5 block">
                    {'Support Tickets'}
                  </span>
                </div>
              </div>

              {/* Pending Password Requests Sub-section */}
              {passwordRequests.filter(r => r.status === 'Pending').length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 font-mono pl-1">
                    <KeyRound className="w-4 h-4 text-amber-500" />
                    {'Password Reset Queue'}
                  </h4>
                  <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                    {passwordRequests.filter(r => r.status === 'Pending').map((req: any) => (
                      <div key={req.id} className="flex items-center justify-between p-3.5 bg-slate-900/40 hover:bg-slate-900 border border-slate-800 rounded-xl transition-all duration-200">
                        <div className="min-w-0 space-y-0.5">
                          <span className="font-mono font-black text-xs text-slate-100 block tracking-wider">{req.empId}</span>
                          <span className="text-[10.5px] text-slate-400 font-medium block truncate max-w-[220px] font-mono">{req.email}</span>
                        </div>
                        <span className="text-[9.5px] font-mono text-slate-500 font-bold shrink-0">
                          {new Date(req.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pending Tickets Sub-section */}
              {hrTickets.filter(r => r.status === 'Pending').length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 font-mono pl-1">
                    <LifeBuoy className="w-4 h-4 text-emerald-400" />
                    {'Active Support Tickets'}
                  </h4>
                  <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                    {hrTickets.filter(r => r.status === 'Pending').map((tkt: any) => (
                      <div key={tkt.id} className="p-3.5 bg-[#041a12]/30 hover:bg-[#041a12]/60 border border-emerald-950 rounded-xl transition-all duration-200 space-y-1.5">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-bold text-xs text-slate-100 truncate">{tkt.name}</span>
                            <span className="text-[9.5px] font-mono font-bold text-slate-500 uppercase">({tkt.empId})</span>
                          </div>
                          <span className="text-[9.5px] font-mono text-slate-500 font-bold shrink-0 font-mono">
                            {new Date(tkt.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <span className="text-[9.5px] text-emerald-400 font-black uppercase tracking-wider font-mono block">{tkt.category}</span>
                        <p className="text-[11px] text-slate-350 font-medium italic truncate">"{tkt.message}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer with high contrast layout */}
            <div className="bg-slate-950 px-6 py-4.5 border-t border-slate-900 flex flex-col sm:flex-row gap-3 justify-end shrink-0">
              <button
                onClick={() => {
                  sessionStorage.setItem('dismissed_pending_alert', 'true');
                  setShowPendingAlertModal(false);
                }}
                className="w-full sm:w-auto bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-850 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer text-center duration-200"
              >
                {'Acknowledge'}
              </button>
              <button
                onClick={() => {
                  sessionStorage.setItem('dismissed_pending_alert', 'true');
                  setShowPendingAlertModal(false);
                  navigateToTab('notices_support', 'passwords');
                }}
                className="w-full sm:w-auto bg-[#10b981] hover:bg-[#059669] text-slate-950 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(16,185,129,0.25)] hover:scale-[1.02]"
              >
                <span>{'Resolve Now'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================== */}
      {/* SIMULATED SANDBOX EMAIL VIEWER */}
      {/* ============================================== */}
      {showEmailViewer && lastSentEmail && (
        <div className="fixed bottom-4 right-4 z-[1000] max-w-sm w-full bg-slate-900 border border-emerald-500/40 rounded-2xl shadow-2xl overflow-hidden font-sans animate-slideUp text-white">
          <div className="bg-gradient-to-r from-emerald-950 to-slate-900 border-b border-emerald-900/40 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="text-[10px] font-black uppercase tracking-wider text-emerald-400 font-mono">
                {'Sandbox Email Terminal'}
              </h3>
            </div>
            <button
              onClick={() => setShowEmailViewer(false)}
              className="text-slate-400 hover:text-white hover:bg-slate-800 p-1 rounded-lg transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4 space-y-3">
            <div className="text-[9px] font-semibold text-slate-400 space-y-1 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 font-mono">
              <div><span className="text-slate-500">FROM:</span> {lastSentEmail.from}</div>
              <div><span className="text-slate-500">TO:</span> {lastSentEmail.to}</div>
              <div><span className="text-slate-500">SUBJECT:</span> {lastSentEmail.subject}</div>
            </div>
            <div className="bg-slate-950 rounded-xl border border-slate-800/60 overflow-hidden">
              <div className="bg-slate-900 px-3 py-1 text-[8px] font-black uppercase text-slate-500 font-mono tracking-widest border-b border-slate-800/40 flex justify-between items-center">
                <span>{'Rendered HTML Email Content'}</span>
                <span className="text-[9px] text-emerald-400 font-semibold">{'Simulated'}</span>
              </div>
              <div 
                className="p-4 text-xs bg-slate-950/45 text-slate-300 leading-relaxed overflow-y-auto max-h-48 custom-scrollbar scrollbar-thin scrollbar-thumb-emerald-800/30 scrollbar-track-transparent"
                dangerouslySetInnerHTML={{ __html: lastSentEmail.html }} />
            </div>
            <button
              onClick={() => setShowEmailViewer(false)}
              className="w-full bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 font-black text-[10px] uppercase tracking-wider py-2 rounded-xl transition-all cursor-pointer"
            >
              {'Acknowledge & Close'}
            </button>
          </div>
        </div>
      )}

      {/* Admin "Welcome Boss" Animated Greeting Popup Modal */}
      {showAdminWelcomeModal && portalUser && portalUser.role !== 'employee' && (
        <AdminWelcomeModal
          isOpen={showAdminWelcomeModal}
          onClose={() => setShowAdminWelcomeModal(false)}
          adminName={portalUser.name || 'Boss'}
          role={portalUser.role}
          language={language}
          companyName={adminSettings.companyName} />
      )}

    </div>
  );
}
