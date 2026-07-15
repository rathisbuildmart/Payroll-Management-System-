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
  CheckCircle2
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
  saveAdminSettings
} from './services/sheets';
import { Employee, Attendance, PayrollRecord, AdminSettings, SyncLog, FailedLoginAttempt } from './types';
import { saveToFirestore, loadFromFirestore } from './services/firestore';

// Importing Tab Components
import Dashboard from './components/Dashboard';
import EmployeeList from './components/EmployeeList';
import AttendanceTracker from './components/AttendanceTracker';
import PayrollCalculator from './components/PayrollCalculator';
import Settings, { INITIAL_ADMIN_SETTINGS } from './components/Settings';
import EmployeePortal from './components/EmployeePortal';
import LeavesHolidays from './components/LeavesHolidays';
import EmployeeLedger from './components/EmployeeLedger';

export interface PortalUser {
  id: string;
  name: string;
  role: 'admin' | 'director' | 'hr' | 'branch_manager' | 'employee';
  employee?: Employee;
  branch?: string;
  branches?: string[];
}

// Merge utility functions to handle offline modifications merging back with Google Sheets
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
      // Remote (Google Sheets) is the absolute source of truth.
      // Remote properties must override local stale default properties (e.g. Suresh Kumar vs Aashish Sahu)
      merged[idx] = { ...localEmp, ...merged[idx] };
    } else {
      // If employee exists in local but not remote, only merge if they are NOT a default demo employee
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
  const fallback = '/src/assets/images/rathi_favicon_1783945713829.jpg';
  if (!url || !url.trim()) return fallback;
  
  const trimmed = url.trim();
  
  // If it's already a local asset, data URL, or blob, return as is
  if (trimmed.startsWith('/') || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }
  
  // Google Drive URL patterns:
  // 1. /file/d/{ID}/view or /file/d/{ID}/edit or similar
  const fileDMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]{25,50})/);
  if (fileDMatch && fileDMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${fileDMatch[1]}`;
  }
  
  // 2. id={ID} query parameter (e.g. open?id=..., uc?id=..., uc?export=download&id=...)
  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]{25,50})/);
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

  // Sheets Metadata
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(null);
  const [spreadsheetLink, setSpreadsheetLink] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');

  // Sync Status, Logs & Last Successful Sync
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

  const addSyncLog = (operation: string, status: 'success' | 'error' | 'syncing', details: string) => {
    setSyncLogs(prev => {
      const newLog: SyncLog = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toISOString(),
        operation,
        status,
        details
      };
      const updated = [newLog, ...prev].slice(0, 50); // Keep last 50 logs
      localStorage.setItem('payroll_sync_logs', JSON.stringify(updated));
      return updated;
    });
    if (status === 'success') {
      const now = new Date().toISOString();
      setLastSuccessfulSyncTime(now);
      localStorage.setItem('payroll_last_success_sync', now);
    }
  };

  // Application Data States (with local cache fallbacks for instant offline load)
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const defaultEmployees: Employee[] = [
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
      },
      {
        id: 'EMP004',
        name: 'Suresh Kumar',
        department: 'Sales',
        designation: 'Sales Executive',
        joiningDate: '2026-04-01',
        basicSalary: 19000,
        allowances: 1600,
        deductions: 900,
        hourlyRate: 105,
        paymentMethod: 'Bank Transfer',
        isActive: true,
        password: '123456'
      }
    ];

    const saved = localStorage.getItem('cached_employees');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Employee[];
        if (parsed.length > 0) {
          return parsed;
        }
      } catch (err) {
        console.error("Error parsing cached employees", err);
      }
    }
    
    localStorage.setItem('cached_employees', JSON.stringify(defaultEmployees));
    return defaultEmployees;
  });

  const [attendance, setAttendance] = useState<Attendance[]>(() => {
    const saved = localStorage.getItem('cached_attendance');
    if (saved) {
      try {
        return JSON.parse(saved) as Attendance[];
      } catch (err) {
        console.error("Error parsing cached attendance", err);
      }
    }

    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const sampleAttendance: Attendance[] = [];
    const empIds = ['EMP001', 'EMP002', 'EMP003'];
    
    for (let day = 1; day <= 15; day++) {
      const dateStr = `${currentMonth}-${String(day).padStart(2, '0')}`;
      empIds.forEach((id, index) => {
        const isAbsent = day === 3 && index === 2;
        const isHalfDay = day === 4 && index === 1;

        sampleAttendance.push({
          date: dateStr,
          employeeId: id,
          status: isAbsent ? 'Absent' : isHalfDay ? 'Half Day' : 'Present',
          checkIn: isAbsent ? '' : '09:00',
          checkOut: isAbsent ? '' : isHalfDay ? '13:30' : '18:30',
          overtimeHours: (!isAbsent && !isHalfDay && index === 0) ? 0.5 : 0,
          remarks: isAbsent ? 'Sick leave' : isHalfDay ? 'Personal chore' : 'On-time'
        });
      });
    }
    localStorage.setItem('cached_attendance', JSON.stringify(sampleAttendance));
    return sampleAttendance;
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

  // Unsuccessful login attempts state
  const [failedLogins, setFailedLogins] = useState<FailedLoginAttempt[]>(() => {
    const saved = localStorage.getItem('cached_failed_logins');
    return saved ? JSON.parse(saved) : [];
  });

  // Portal login states
  const [loginId, setLoginId] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginErr, setLoginErr] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showLoginHelp, setShowLoginHelp] = useState(false);

  // Corporate notices & support gateway states
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

  const [announcements, setAnnouncements] = useState<any[]>(() => {
    const saved = localStorage.getItem('payroll_announcements');
    return saved ? JSON.parse(saved) : [
      {
        id: 'ann-1',
        title: 'Implementation of Biometric Punch System',
        titleHi: 'बायोमेट्रिक पंच प्रणाली का कार्यान्वयन',
        date: '2026-07-12',
        content: 'All departments must ensure staff punches via the integrated biometric portal. Late punches after standard 15-min grace period will record automatic late penalty checks.',
        contentHi: 'सभी विभागों को एकीकृत बायोमेट्रिक पोर्टल के माध्यम से कर्मचारियों का पंच सुनिश्चित करना होगा। 15 मिनट की छूट अवधि के बाद देर से पंच करने पर स्वचालित विलंब पेनल्टी दर्ज होगी।',
        badge: 'Critical',
        badgeHi: 'महत्वपूर्ण'
      },
      {
        id: 'ann-2',
        title: 'Upcoming Public Holiday Notice',
        titleHi: 'आगामी सार्वजनिक अवकाश सूचना',
        date: '2026-07-20',
        content: 'The workspace will remain closed on July 25th in observation of the regional festival. Off-duty profiles are auto-applied.',
        contentHi: 'क्षेत्रीय त्योहार के अवसर पर 25 जुलाई को कार्यक्षेत्र बंद रहेगा। ऑफ-ड्यूटी प्रोफाइल स्वचालित रूप से लागू हो गई हैं।',
        badge: 'Holiday',
        badgeHi: 'छुट्टी'
      },
      {
        id: 'ann-3',
        title: 'Revised Provident Fund Policies',
        titleHi: 'संशोधित भविष्य निधि (PF) नीतियां',
        date: '2026-07-08',
        content: 'Effective from this payroll cycle, PF calculations adhere to the updated 12% statutory caps. Review your salary slips structure under settings.',
        contentHi: 'इस पेरोल चक्र से प्रभावी, पीएफ गणना अपडेटेड 12% वैधानिक सीमा के अनुरूप है। सेटिंग्स के तहत अपनी सैलरी स्लिप संरचना की समीक्षा करें।',
        badge: 'Policy',
        badgeHi: 'नीति'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('payroll_announcements', JSON.stringify(announcements));
  }, [announcements]);

  const [hrTickets, setHrTickets] = useState<any[]>(() => {
    const saved = localStorage.getItem('payroll_hr_tickets');
    return saved ? JSON.parse(saved) : [
      {
        id: 'TKT-8274',
        name: 'Rohan Sharma',
        empId: 'EMP001',
        email: 'rohan@rathibuildmart.com',
        category: 'Attendance Adjustment',
        categoryHi: 'उपस्थिति समायोजन',
        message: 'Forgot to punch out yesterday due to emergency on-site meeting. Please approve my miss punch adjustment request.',
        date: '2026-07-12T14:30:00Z',
        status: 'Pending'
      },
      {
        id: 'TKT-3921',
        name: 'Sunita Verma',
        empId: 'EMP003',
        email: 'sunita@rathibuildmart.com',
        category: 'Salary Discrepancy',
        categoryHi: 'वेतन विसंगति',
        message: 'My PF contribution seems to have a mismatch of 200 INR. Kindly assist.',
        date: '2026-07-10T11:15:00Z',
        status: 'Resolved'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('payroll_hr_tickets', JSON.stringify(hrTickets));
  }, [hrTickets]);

  const [passwordRequests, setPasswordRequests] = useState<any[]>(() => {
    const saved = localStorage.getItem('payroll_password_requests');
    return saved ? JSON.parse(saved) : [
      {
        id: 'REQ-4819',
        empId: 'EMP002',
        email: 'amit@rathibuildmart.com',
        mobile: '9876543210',
        date: '2026-07-13T09:12:00Z',
        status: 'Pending'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('payroll_password_requests', JSON.stringify(passwordRequests));
  }, [passwordRequests]);

  // Live time for login clock
  const [liveTime, setLiveTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // We disable the automatic Google Sheets redirect on page load because it causes infinite redirect loops 
  // on custom/Render domains if the Authorized Domains list is not fully configured yet.
  // Instead, the administrator can stably click the "Authorize Google Sheets" button manually in the dashboard.
  useEffect(() => {
    // Automatic redirect is disabled to ensure maximum stability and offline-first usage.
    // The admin can manually click "Authorize Google Sheets" when ready.
  }, []);

  // Sync state changes to local storage caches automatically
  useEffect(() => {
    localStorage.setItem('cached_employees', JSON.stringify(employees));
  }, [employees]);

  // Keep portalUser (employee profile) updated with latest employee details from employees state
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

  // UI States
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

  const [currentTab, setCurrentTab] = useState<'dashboard' | 'employees' | 'attendance' | 'payroll' | 'leaves' | 'admin' | 'ledger'>('dashboard');

  const [isSidebarHovered, setIsSidebarHovered] = useState<boolean>(false);
  const [language, setLanguage] = useState<'en' | 'hi'>('en'); // Set default to English as bilingual toggle is disabled
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

  // Admin settings loaded from localStorage with standard static fallback
  const [adminSettings, setAdminSettings] = useState<AdminSettings>(() => {
    const saved = localStorage.getItem('payroll_admin_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse admin settings', e);
      }
    }
    return INITIAL_ADMIN_SETTINGS;
  });

  // Auto-redirect to first allowed tab based on user role permissions
  useEffect(() => {
    if (!portalUser || portalUser.role === 'employee') return;
    
    const allowed = portalUser.role === 'admin'
      ? ['dashboard', 'employees', 'attendance', 'payroll', 'leaves', 'ledger', 'admin']
      : adminSettings.rolePermissions?.[portalUser.role] || [];
      
    if (allowed.length > 0 && !allowed.includes(currentTab)) {
      setCurrentTab(allowed[0] as any);
    }
  }, [portalUser, adminSettings, currentTab]);

  // Dynamically update document title and favicon when company name or logo changes
  useEffect(() => {
    document.title = `${adminSettings.companyName || 'Rathi Buildmart'} - Payroll & Attendance Portal`;
    
    const updateFavicon = () => {
      // Remove any existing favicons to avoid conflicts
      const linkElements = document.querySelectorAll("link[rel*='icon']");
      linkElements.forEach(el => el.parentNode?.removeChild(el));
      
      // Create and append the new custom favicon
      const newLink = document.createElement('link');
      newLink.type = adminSettings.companyLogo ? 'image/png' : 'image/jpeg';
      newLink.rel = 'shortcut icon';
      newLink.href = getDirectImageUrl(adminSettings.companyLogo);
      document.getElementsByTagName('head')[0].appendChild(newLink);
    };
    
    updateFavicon();
  }, [adminSettings.companyName, adminSettings.companyLogo]);

  // Load global data from Firestore on startup to allow any device/browser to log in with up-to-date credentials
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
            setAdminSettings(globalData.adminSettings);
            localStorage.setItem('payroll_admin_settings', JSON.stringify(globalData.adminSettings));
          }
          if (globalData.failedLogins) {
            setFailedLogins(globalData.failedLogins);
          }
          if (globalData.spreadsheetId) {
            setSpreadsheetId(globalData.spreadsheetId);
          }
          if (globalData.spreadsheetLink) {
            setSpreadsheetLink(globalData.spreadsheetLink);
          }
          console.log('Successfully loaded synced credentials from cloud Firestore');
        } else if (result && result.success && !result.data) {
          // Cloud Firestore is empty. Trigger a save so the baseline default employees/attendance
          // are automatically registered in the cloud database.
          setIsDataModified(true);
          console.log('Cloud Firestore is empty. Automatically syncing baseline default data to Firestore...');
        }
      } catch (err) {
        console.warn('Failed to load global data from Firestore on startup:', err);
      } finally {
        setHasLoadedFromCloud(true);
        // If we didn't trigger an automatic baseline sync, clear modified status
        // otherwise let the auto-save effect handle it and reset it.
      }
    };
    fetchGlobalData();
  }, []);

  // Synchronize state changes to Firestore when we have finished loading from the cloud and user has modified data
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
          spreadsheetId,
          spreadsheetLink
        });
        setIsDataModified(false);
        console.log('Central Firestore database synchronized successfully.');
      } catch (err) {
        console.warn('Auto-syncing to Firestore failed:', err);
      }
    };

    // Debounce cloud writes by 1.5 seconds to avoid rapid write limits
    const timer = setTimeout(() => {
      syncToCloud();
    }, 1500);

    return () => clearTimeout(timer);
  }, [employees, attendance, payroll, adminSettings, failedLogins, spreadsheetId, spreadsheetLink, hasLoadedFromCloud, isDataModified]);

  const handleSaveSettings = async (updated: AdminSettings) => {
    setAdminSettings(updated);
    setIsDataModified(true);
    localStorage.setItem('payroll_admin_settings', JSON.stringify(updated));
    if (spreadsheetId && token) {
      try {
        setSyncStatus('syncing');
        addSyncLog(
          language === 'en' ? 'Save Settings' : 'सेटिंग्स सहेजें',
          'syncing',
          language === 'en' ? 'Saving updated workspace settings to Google Sheets...' : 'Google Sheets में अपडेट की गई सेटिंग्स सहेज रहे हैं...'
        );
        await saveAdminSettings(spreadsheetId, updated, token);
        setSyncStatus('synced');
        addSyncLog(
          language === 'en' ? 'Save Settings' : 'सेटिंग्स सहेजें',
          'success',
          language === 'en' ? 'Workspace settings synced successfully to Google Sheets.' : 'सेटिंग्स सफलतापूर्वक Google Sheets में सिंक हो गईं।'
        );
      } catch (e: any) {
        console.error('Failed to save settings to Google Sheets:', e);
        setSyncStatus('error');
        addSyncLog(
          language === 'en' ? 'Save Settings' : 'सेटिंग्स सहेजें',
          'error',
          language === 'en' ? `Failed to save settings: ${e?.message || e}` : `सेटिंग्स सहेजने में विफल: ${e?.message || e}`
        );
      }
    }
  };

  // Initialize Firebase Auth
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

  // Sync / Load data from Sheets when authenticated
  useEffect(() => {
    if (token) {
      loadApplicationData(token);
    }
  }, [token]);

  const loadApplicationData = async (accessToken: string) => {
    setIsLoadingData(true);
    setSyncStatus('syncing');
    addSyncLog(
      language === 'en' ? 'Load Application Data' : 'एप्लिकेशन डेटा लोड करें',
      'syncing',
      language === 'en' ? 'Initializing Google Sheets API connection and updating headers...' : 'Google Sheets API कनेक्शन शुरू किया जा रहा है और हेडर अपडेट किए जा रहे हैं...'
    );
    try {
      // 1. Find or create Spreadsheet
      let sheetId = await findSpreadsheet(accessToken);
      if (!sheetId) {
        sheetId = await createSpreadsheet(accessToken);
        // Newly created spreadsheet is empty, offer to seed demo data
        setShowSeedDialog(true);
      } else {
        // If the spreadsheet already exists, ensure all new headers/columns are added to row 1
        try {
          await initHeaders(sheetId, accessToken);
        } catch (e) {
          console.warn('Failed to update Google Sheet headers on load:', e);
        }
      }
      setSpreadsheetId(sheetId);

      // 2. Get the web URL of the Google Sheet
      const webLink = await getSpreadsheetLink(sheetId, accessToken);
      setSpreadsheetLink(webLink);

      // 3. Load Employees, Attendance, Payroll, and Admin Settings
      const fetchedEmployees = await fetchEmployees(sheetId, accessToken);
      const fetchedAttendance = await fetchAttendance(sheetId, accessToken);
      const fetchedPayroll = await fetchPayrollHistory(sheetId, accessToken);

      // Perform bidirectional merge to preserve offline modifications
      const mergedEmployees = mergeEmployees(employees, fetchedEmployees);
      const mergedAttendance = mergeAttendance(attendance, fetchedAttendance);
      const mergedPayroll = mergePayroll(payroll, fetchedPayroll);

      setEmployees(mergedEmployees);
      setAttendance(mergedAttendance);
      setPayroll(mergedPayroll);
      setIsDataModified(true);

      // Save merged results back to Google Sheets if they contain changes not present on remote
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

      // Load Settings from Google Sheets
      let activeSettings = adminSettings;
      try {
        const fetchedSettings = await fetchAdminSettings(sheetId, accessToken);
        if (fetchedSettings) {
          setAdminSettings(fetchedSettings);
          activeSettings = fetchedSettings;
          localStorage.setItem('payroll_admin_settings', JSON.stringify(fetchedSettings));
        } else {
          // If the sheet doesn't have settings yet, write current local settings to Google Sheets
          await saveAdminSettings(sheetId, adminSettings, accessToken);
        }
      } catch (e) {
        console.warn('Failed to load/sync settings from Google Sheets:', e);
      }

      // Sync portalUser with fresh details from Google Sheets
      if (portalUser && portalUser.role === 'employee') {
        const freshEmp = fetchedEmployees.find(e => e.id.trim().toLowerCase() === portalUser.id.trim().toLowerCase());
        if (freshEmp) {
          const updatedUser: PortalUser = { ...portalUser, name: freshEmp.name, employee: freshEmp };
          setPortalUser(updatedUser);
          localStorage.setItem('payroll_portal_user', JSON.stringify(updatedUser));
        }
      }

      // If existing employees are found, hide seed dialog
      if (fetchedEmployees.length > 0) {
        setShowSeedDialog(false);
      }

      // Force direct, immediate synchronization of loaded real data to central Firestore database
      // so other devices, browsers, and employee portals can access the real data immediately.
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
        setIsDataModified(false); // Directly saved, clear modified state
        console.log('Central Firestore database successfully synchronized with fresh Google Sheets data.');
      } catch (fErr) {
        console.warn('Failed to save fresh Google Sheets data directly to Firestore:', fErr);
      }

      setSyncStatus('synced');
      addSyncLog(
        language === 'en' ? 'Data Loaded Successfully' : 'डेटा सफलतापूर्वक लोड हुआ',
        'success',
        language === 'en' 
          ? `Loaded ${mergedEmployees.length} employees, ${mergedAttendance.length} attendance, and ${mergedPayroll.length} payroll records.`
          : `सफलतापूर्वक ${mergedEmployees.length} कर्मचारी, ${mergedAttendance.length} उपस्थिति, और ${mergedPayroll.length} वेतन प्रविष्टियां लोड की गईं।`
      );
    } catch (error: any) {
      console.error('Failed to load Google Sheets data', error);
      setSyncStatus('error');
      addSyncLog(
        language === 'en' ? 'Load Error' : 'लोड त्रुटि',
        'error',
        language === 'en' 
          ? `Failed to sync: ${error?.message || error}`
          : `सिंक करने में विफल: ${error?.message || error}`
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
        // Clear expired/invalid session token to prevent persistent lockout loops
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

  const handlePortalLogout = () => {
    setConfirmDialog({
      isOpen: true,
      title: language === 'en' ? 'Sign Out' : 'लॉग आउट करें',
      message: language === 'en' 
        ? 'Are you sure you want to log out from the portal?' 
        : 'क्या आप पोर्टल से लॉग आउट करना चाहते हैं?',
      onConfirm: () => {
        setPortalUser(null);
        localStorage.removeItem('payroll_portal_user');
        setCurrentTab('dashboard');
        setConfirmDialog(null);
      }
    });
  };

  const recordUnsuccessfulLogin = (enteredId: string, reason: 'Incorrect Password' | 'User ID not found' | 'Admin Incorrect Password') => {
    const newAttempt: FailedLoginAttempt = {
      id: `fail-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      enteredId,
      timestamp: new Date().toISOString(),
      reason,
      browserInfo: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
    };
    setFailedLogins(prev => [newAttempt, ...(prev || [])]);
    setIsDataModified(true);
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
      title: language === 'en' ? 'Sign Out Admin' : 'डैशबोर्ड लॉग आउट',
      message: language === 'en' 
        ? 'Are you sure you want to sign out from the Admin Dashboard?' 
        : 'क्या आप एडमिन डैशबोर्ड से लॉग आउट करना चाहते हैं?',
      onConfirm: async () => {
        setPortalUser(null);
        localStorage.removeItem('payroll_portal_user');
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

  // Seeding sample data
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

      // Seed 5 days of attendance for current month
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const sampleAttendance: Attendance[] = [];
      
      for (let day = 1; day <= 5; day++) {
        const dateStr = `${currentMonth}-${String(day).padStart(2, '0')}`;
        sampleEmployees.forEach((emp, index) => {
          // Rajesh & Sunita present, Amit absent on day 3
          const isAbsent = day === 3 && index === 2;
          const isHalfDay = day === 4 && index === 1;

          sampleAttendance.push({
            date: dateStr,
            employeeId: emp.id,
            status: isAbsent ? 'Absent' : isHalfDay ? 'Half Day' : 'Present',
            checkIn: isAbsent ? '' : '09:00',
            checkOut: isAbsent ? '' : isHalfDay ? '13:30' : '18:30', // राजेश worked some overtime
            overtimeHours: (!isAbsent && !isHalfDay && index === 0) ? 0.5 : 0,
            remarks: isAbsent ? 'Sick leave' : isHalfDay ? 'Personal chore' : 'On-time'
          });
        });
      }

      // Save Employees and Attendance to sheets if connected
      if (spreadsheetId && token) {
        addSyncLog(
          language === 'en' ? 'Seed Database' : 'डेटाबेस सीड करें',
          'syncing',
          language === 'en' ? 'Writing sample employees and attendance history...' : 'नमूना कर्मचारी और उपस्थिति इतिहास लिखा जा रहा है...'
        );
        await saveEmployees(spreadsheetId, sampleEmployees, token);
        await saveAttendance(spreadsheetId, sampleAttendance, token);
      }

      // Reload
      setEmployees(sampleEmployees);
      setAttendance(sampleAttendance);
      setIsDataModified(true);
      setShowSeedDialog(false);
      setSyncStatus('synced');
      addSyncLog(
        language === 'en' ? 'Seed Database' : 'डेटाबेस सीड करें',
        'success',
        language === 'en' ? 'Seeded 3 demo employees and 5 days of attendance history.' : '3 नमूना कर्मचारी और 5 दिनों का उपस्थिति इतिहास सफलतापूर्वक सीड किया गया।'
      );
    } catch (err: any) {
      console.error('Error seeding demo data', err);
      addSyncLog(
        language === 'en' ? 'Seed Database Error' : 'डेटाबेस सीड त्रुटि',
        'error',
        language === 'en' ? `Failed to seed: ${err?.message || err}` : `सीड करने में विफल: ${err?.message || err}`
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

  // Callback functions for syncing mutations
  const handleAddEmployee = async (newEmp: Employee) => {
    const updated = [...employees, newEmp];
    setEmployees(updated);
    setIsDataModified(true);
    if (!spreadsheetId || !token) {
      setSyncStatus('error');
      addSyncLog(
        language === 'en' ? 'Add Employee (Local)' : 'कर्मचारी जोड़ें (स्थानीय)',
        'success',
        language === 'en' ? `Added ${newEmp.name} to local database (offline).` : `स्थानीय डेटाबेस में ${newEmp.name} को जोड़ा गया (ऑफ़लाइन)।`
      );
      return;
    }
    setSyncStatus('syncing');
    addSyncLog(
      language === 'en' ? 'Add Employee' : 'कर्मचारी जोड़ें',
      'syncing',
      language === 'en' ? `Saving employee ${newEmp.name} to Google Sheets...` : `कर्मचारी ${newEmp.name} को Google Sheets में सहेजा जा रहा है...`
    );
    try {
      await saveEmployees(spreadsheetId, updated, token);
      setSyncStatus('synced');
      addSyncLog(
        language === 'en' ? 'Add Employee' : 'कर्मचारी जोड़ें',
        'success',
        language === 'en' ? `Employee ${newEmp.name} successfully saved in Sheets.` : `कर्मचारी ${newEmp.name} को सफलतापूर्वक Sheets में सुरक्षित किया गया।`
      );
    } catch (err: any) {
      setSyncStatus('error');
      addSyncLog(
        language === 'en' ? 'Add Employee Error' : 'कर्मचारी जोड़ने में त्रुटि',
        'error',
        language === 'en' ? `Failed to save ${newEmp.name}: ${err?.message || err}` : `कर्मचारी ${newEmp.name} को सहेजने में विफल: ${err?.message || err}`
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
      setSyncStatus('error');
      addSyncLog(
        language === 'en' ? 'Bulk Add (Local)' : 'थोक में जोड़ें (स्थानीय)',
        'success',
        language === 'en' ? `Imported ${newEmployees.length} employees to local database (offline).` : `स्थानीय डेटाबेस में ${newEmployees.length} कर्मचारियों को इम्पोर्ट किया गया (ऑफ़लाइन)।`
      );
      return;
    }
    setSyncStatus('syncing');
    addSyncLog(
      language === 'en' ? 'Bulk Add Employees' : 'थोक में कर्मचारी जोड़ें',
      'syncing',
      language === 'en' ? `Saving ${newEmployees.length} employees to Google Sheets...` : `${newEmployees.length} कर्मचारियों को Google Sheets में सहेजा जा रहा है...`
    );
    try {
      await saveEmployees(spreadsheetId, updated, token);
      setSyncStatus('synced');
      addSyncLog(
        language === 'en' ? 'Bulk Add Employees' : 'थोक में कर्मचारी जोड़ें',
        'success',
        language === 'en' ? `Successfully saved ${newEmployees.length} employees in Sheets.` : `${newEmployees.length} कर्मचारियों को सफलतापूर्वक Sheets में सुरक्षित किया गया।`
      );
    } catch (err: any) {
      setSyncStatus('error');
      addSyncLog(
        language === 'en' ? 'Bulk Add Error' : 'थोक जोड़ने में त्रुटि',
        'error',
        language === 'en' ? `Failed to bulk add: ${err?.message || err}` : `थोक जोड़ने में विफल: ${err?.message || err}`
      );
      throw err;
    }
  };

  const handleUpdateEmployee = async (updatedEmp: Employee) => {
    const updated = employees.map(emp => emp.id === updatedEmp.id ? updatedEmp : emp);
    setEmployees(updated);
    setIsDataModified(true);
    if (!spreadsheetId || !token) {
      setSyncStatus('error');
      addSyncLog(
        language === 'en' ? 'Update Employee (Local)' : 'कर्मचारी अपडेट करें (स्थानीय)',
        'success',
        language === 'en' ? `Updated ${updatedEmp.name} details in local database (offline).` : `स्थानीय डेटाबेस में ${updatedEmp.name} का विवरण अपडेट किया गया (ऑफ़लाइन)।`
      );
      return;
    }
    setSyncStatus('syncing');
    addSyncLog(
      language === 'en' ? 'Update Employee' : 'कर्मचारी अपडेट करें',
      'syncing',
      language === 'en' ? `Saving details for ${updatedEmp.name} to Google Sheets...` : `कर्मचारी ${updatedEmp.name} का विवरण Google Sheets में सहेजा जा रहा है...`
    );
    try {
      await saveEmployees(spreadsheetId, updated, token);
      setSyncStatus('synced');
      addSyncLog(
        language === 'en' ? 'Update Employee' : 'कर्मचारी अपडेट करें',
        'success',
        language === 'en' ? `Details for ${updatedEmp.name} successfully updated in Sheets.` : `कर्मचारी ${updatedEmp.name} का विवरण सफलतापूर्वक Sheets में सुरक्षित किया गया।`
      );
    } catch (err: any) {
      setSyncStatus('error');
      addSyncLog(
        language === 'en' ? 'Update Employee Error' : 'कर्मचारी अपडेट त्रुटि',
        'error',
        language === 'en' ? `Failed to update ${updatedEmp.name}: ${err?.message || err}` : `${updatedEmp.name} को अपडेट करने में विफल: ${err?.message || err}`
      );
      throw err;
    }
  };

  const handleSaveAttendance = async (date: string, records: Attendance[]) => {
    // Filter out old records for this specific date and append/overwrite new ones
    const filteredOld = attendance.filter(r => r.date !== date);
    const combined = [...filteredOld, ...records];
    
    setAttendance(combined);
    setIsDataModified(true);
    if (!spreadsheetId || !token) {
      setSyncStatus('error');
      addSyncLog(
        language === 'en' ? 'Save Attendance (Local)' : 'उपस्थिति सहेजें (स्थानीय)',
        'success',
        language === 'en' ? `Saved ${records.length} attendance records for ${date} (offline).` : `दिनांक ${date} के लिए ${records.length} उपस्थिति रिकॉर्ड स्थानीय रूप से सहेजे गए (ऑफ़लाइन)।`
      );
      return;
    }
    setSyncStatus('syncing');
    addSyncLog(
      language === 'en' ? 'Save Attendance' : 'उपस्थिति सहेजें',
      'syncing',
      language === 'en' ? `Saving ${records.length} attendance records for ${date} to Google Sheets...` : `दिनांक ${date} के लिए ${records.length} उपस्थिति रिकॉर्ड Google Sheets में सहेजे जा रहे हैं...`
    );
    try {
      await saveAttendance(spreadsheetId, combined, token);
      setSyncStatus('synced');
      addSyncLog(
        language === 'en' ? 'Save Attendance' : 'उपस्थिति सहेजें',
        'success',
        language === 'en' ? `Attendance for ${date} successfully saved in Sheets.` : `दिनांक ${date} की उपस्थिति को सफलतापूर्वक Sheets में सुरक्षित किया गया।`
      );
    } catch (err: any) {
      setSyncStatus('error');
      addSyncLog(
        language === 'en' ? 'Save Attendance Error' : 'उपस्थिति सहेजने में त्रुटि',
        'error',
        language === 'en' ? `Failed to save attendance: ${err?.message || err}` : `उपस्थिति सहेजने में विफल: ${err?.message || err}`
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
      setSyncStatus('error');
      addSyncLog(
        language === 'en' ? 'Update Attendance (Local)' : 'उपस्थिति अपडेट (स्थानीय)',
        'success',
        language === 'en' ? `Updated ${updatedRecords.length} attendance logs (offline).` : `स्थानीय रूप से ${updatedRecords.length} उपस्थिति रिकॉर्ड अपडेट किए गए (ऑफ़लाइन)।`
      );
      return;
    }
    setSyncStatus('syncing');
    addSyncLog(
      language === 'en' ? 'Update Attendance Logs' : 'उपस्थिति रिकॉर्ड अपडेट करें',
      'syncing',
      language === 'en' ? `Saving ${updatedRecords.length} attendance updates to Google Sheets...` : `${updatedRecords.length} उपस्थिति अपडेट Google Sheets में सहेजे जा रहे हैं...`
    );
    try {
      await saveAttendance(spreadsheetId, updated, token);
      setSyncStatus('synced');
      addSyncLog(
        language === 'en' ? 'Update Attendance Logs' : 'उपस्थिति रिकॉर्ड अपडेट करें',
        'success',
        language === 'en' ? `Attendance updates successfully saved in Sheets.` : `उपस्थिति अपडेट सफलतापूर्वक Sheets में सुरक्षित किए गए।`
      );
    } catch (err: any) {
      setSyncStatus('error');
      addSyncLog(
        language === 'en' ? 'Attendance Update Error' : 'उपस्थिति अपडेट त्रुटि',
        'error',
        language === 'en' ? `Failed to update attendance: ${err?.message || err}` : `उपस्थिति अपडेट करने में विफल: ${err?.message || err}`
      );
      throw err;
    }
  };

  const handleSavePayroll = async (records: PayrollRecord[]) => {
    setPayroll(records);
    setIsDataModified(true);
    if (!spreadsheetId || !token) {
      setSyncStatus('error');
      addSyncLog(
        language === 'en' ? 'Save Payroll (Local)' : 'वेतन सहेजें (स्थानीय)',
        'success',
        language === 'en' ? `Saved ${records.length} payroll records locally (offline).` : `स्थानीय रूप से ${records.length} वेतन प्रविष्टियां सहेजी गईं (ऑफ़लाइन)।`
      );
      return;
    }
    setSyncStatus('syncing');
    addSyncLog(
      language === 'en' ? 'Save Payroll History' : 'वेतन इतिहास सहेजें',
      'syncing',
      language === 'en' ? `Saving ${records.length} payroll history items to Google Sheets...` : `${records.length} वेतन इतिहास प्रविष्टियां Google Sheets में सहेजी जा रही हैं...`
    );
    try {
      await savePayrollHistory(spreadsheetId, records, token);
      setSyncStatus('synced');
      addSyncLog(
        language === 'en' ? 'Save Payroll History' : 'वेतन इतिहास सहेजें',
        'success',
        language === 'en' ? `Payroll history successfully updated in Sheets.` : `वेतन इतिहास सफलतापूर्वक Sheets में सुरक्षित किया गया।`
      );
    } catch (err: any) {
      setSyncStatus('error');
      addSyncLog(
        language === 'en' ? 'Payroll Sync Error' : 'वेतन सिंक त्रुटि',
        'error',
        language === 'en' ? `Failed to save payroll history: ${err?.message || err}` : `वेतन इतिहास सुरक्षित करने में विफल: ${err?.message || err}`
      );
      throw err;
    }
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'hi' : 'en');
  };

  // Translations
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
    leaves: language === 'en' ? "Leaves & Holidays" : "अवकाश और छुट्टियां",
    ledger: language === 'en' ? "Employee Ledger" : "कर्मचारी लेजर",
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

  // 1. Loading Portal Session state
  if (!portalUser && isLoadingAuth) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-extrabold text-slate-500 uppercase tracking-widest font-mono">Loading Portal Workspace...</p>
      </div>
    );
  }

  // 2. Render Custom Login Screen if not authenticated via Portal
  if (!portalUser) {
    const formattedTime = liveTime.toLocaleTimeString(undefined, { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: true 
    });
    const formattedDate = liveTime.toLocaleDateString(undefined, { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:grid lg:grid-cols-12 font-sans relative overflow-hidden selection:bg-emerald-500/30 selection:text-emerald-100">
        
        {/* Top-Right Language Switcher (Visible on all screens) */}
        <div className="absolute top-4 right-4 z-50">
          <button
            onClick={toggleLanguage}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-slate-900/80 backdrop-blur-md hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 transition-all duration-150 cursor-pointer shadow-md active:scale-95"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>{language === 'en' ? 'हिन्दी (Hindi)' : 'English (अंग्रेजी)'}</span>
          </button>
        </div>

        {/* LEFT PANEL - Beautiful Brand Showcase (5 Columns) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-8 md:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800/80 shrink-0 min-h-[340px] lg:min-h-screen">
          {/* Subtle Glowing Background Accents */}
          <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 -right-40 w-80 h-80 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />
          
          {/* Top Brand Logo header */}
          <div className="flex items-center gap-3 relative z-10">
            <img 
              src={getDirectImageUrl(adminSettings.companyLogo)} 
              alt={adminSettings.companyName || 'Rathi Buildmart'} 
              className="w-10 h-10 rounded-2xl object-cover shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400/25"
              referrerPolicy="no-referrer"
            />
            <div>
              <h1 className="text-sm font-black uppercase tracking-widest text-slate-100 font-display">
                {adminSettings.companyName || 'Rathi Build Mart'}
              </h1>
              <p className="text-[9px] font-black tracking-widest uppercase text-emerald-400 font-mono mt-0.5">
                {language === 'en' ? 'Secure Payroll Portal' : 'सुरक्षित वेतन पोर्टल'}
              </p>
            </div>
          </div>

          {/* Middle Content - Display Header / Stats */}
          <div className="my-auto py-8 lg:py-0 relative z-10 max-w-sm">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-4 uppercase tracking-wider">
              <Sparkles className="w-3 h-3 animate-pulse" />
              {language === 'en' ? 'SaaS Level Security' : 'SaaS स्तर की सुरक्षा'}
            </span>
            <h2 className="text-3xl lg:text-4xl font-black text-white font-display tracking-tight leading-tight">
              {language === 'en' 
                ? 'Modern payroll & attendance workspace.' 
                : 'आधुनिक वेतन और उपस्थिति कार्यक्षेत्र।'}
            </h2>
            <p className="mt-3 text-xs text-slate-400 leading-relaxed font-semibold">
              {language === 'en'
                ? 'Empowering employees with self-service receipt printing, real-time leaves requests, and secure administrator portal ledger reviews.'
                : 'कर्मचारियों को वेतन पर्ची मुद्रण, वास्तविक समय छुट्टी अनुरोधों और सुरक्षित प्रशासनिक पोर्टल बहीखाता समीक्षाओं के साथ सशक्त बनाना।'}
            </p>

            {/* Quick Live stats cards */}
            <div className="grid grid-cols-2 gap-3 mt-8">
              <div className="bg-slate-900/60 backdrop-blur-xs border border-slate-800/80 p-3.5 rounded-xl">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block">
                  {language === 'en' ? 'Active Roster' : 'सक्रिय कर्मचारी'}
                </span>
                <span className="text-sm font-black text-white font-mono block mt-1">
                  {employees.length} {language === 'en' ? 'Staff' : 'कर्मचारी'}
                </span>
              </div>
              <div className="bg-slate-900/60 backdrop-blur-xs border border-slate-800/80 p-3.5 rounded-xl">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block">
                  {language === 'en' ? 'System Status' : 'सिस्टम की स्थिति'}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-400 mt-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {language === 'en' ? 'Operational' : 'सक्रिय है'}
                </span>
              </div>
            </div>

            {/* Notice & Announcement Board */}
            <div className="mt-6 border-t border-slate-800/60 pt-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <Megaphone className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  {language === 'en' ? 'Notice Board & Circulars' : 'सूचना पट्ट और परिपत्र'}
                </span>
                <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                  {announcements.length} {language === 'en' ? 'Active' : 'सक्रिय'}
                </span>
              </div>

              <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1 select-none custom-scrollbar">
                {announcements.length === 0 ? (
                  <p className="text-[10px] text-slate-500 italic">
                    {language === 'en' ? 'No recent company announcements.' : 'कोई हालिया कंपनी घोषणाएं नहीं हैं।'}
                  </p>
                ) : (
                  announcements.map((ann) => {
                    let badgeBg = 'bg-slate-900 border-slate-800 text-slate-400';
                    if (ann.badge === 'Critical') badgeBg = 'bg-rose-950/40 border-rose-900/30 text-rose-400';
                    if (ann.badge === 'Holiday') badgeBg = 'bg-amber-950/40 border-amber-900/30 text-amber-400';
                    if (ann.badge === 'Policy') badgeBg = 'bg-sky-950/40 border-sky-900/30 text-sky-400';
                    
                    return (
                      <div key={ann.id} className="bg-slate-900/40 hover:bg-slate-900/70 border border-slate-800/80 p-3 rounded-xl transition-all">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-bold text-slate-200 line-clamp-1">
                            {language === 'en' ? ann.title : ann.titleHi}
                          </h4>
                          <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${badgeBg} shrink-0`}>
                            {language === 'en' ? ann.badge : ann.badgeHi}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 leading-relaxed line-clamp-2">
                          {language === 'en' ? ann.content : ann.contentHi}
                        </p>
                        <div className="flex justify-between items-center mt-1.5 pt-1.5 border-t border-slate-800/40">
                          <span className="text-[9px] font-mono text-slate-500">{ann.date}</span>
                          <span className="text-[8px] text-slate-500 italic">HR Department</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Bottom Live Workspace Clock */}
          <div className="relative z-10 border-t border-slate-800/60 pt-6 mt-6 lg:mt-0">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block mb-1.5">
              {language === 'en' ? 'System Reference Time' : 'सिस्टम संदर्भ समय'}
            </span>
            <div className="flex items-center gap-3">
              <div className="bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl font-mono text-xs font-bold text-emerald-400 tracking-wider shadow-sm flex items-center justify-center min-w-[110px]">
                {formattedTime}
              </div>
              <div className="text-[10px] text-slate-400 font-bold leading-normal">
                <span className="block">{formattedDate}</span>
                <span className="text-slate-500 text-[9px] font-semibold">UTC-07:00 • {language === 'en' ? 'Secure Connection' : 'सुरक्षित कनेक्शन'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL - Secure Sign In Card (7 Columns) */}
        <div className="lg:col-span-7 bg-slate-900 p-6 md:p-12 lg:p-16 flex flex-col justify-center items-center relative min-h-[500px]">
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
                  {language === 'en' ? 'Secure Gateway' : 'सुरक्षित गेटवे'}
                </div>
                <h3 className="text-2xl font-black text-white font-display tracking-tight mt-2 leading-none">
                  {language === 'en' ? 'Sign In to Portal' : 'पोर्टल में लॉगिन करें'}
                </h3>
                <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                  {language === 'en' 
                    ? 'Enter your unique Employee ID or administrator credentials to enter the workspace.' 
                    : 'कार्यक्षेत्र में प्रवेश करने के लिए अपनी कर्मचारी आईडी या एडमिनिस्ट्रेटर क्रेडेंशियल दर्ज करें।'}
                </p>
              </div>

              {/* Error Alert Box */}
              {loginErr && (
                <div className="bg-rose-500/10 text-rose-300 border border-rose-500/20 p-3.5 rounded-xl text-xs font-semibold flex items-start gap-2.5 mt-5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5 animate-bounce" />
                  <span className="leading-normal">{loginErr}</span>
                </div>
              )}

              {/* Main Credentials Form */}
              <form onSubmit={(e) => {
                e.preventDefault();
                const inputID = loginId.trim();
                const inputPass = loginPass;
                if (!inputID || !inputPass) {
                  setLoginErr(language === 'en' ? 'Please fill in all fields.' : 'कृपया सभी फ़ील्ड भरें।');
                  return;
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
                    setPortalUser(adminUser);
                    localStorage.setItem('payroll_portal_user', JSON.stringify(adminUser));
                    setLoginId('');
                    setLoginPass('');
                    setLoginErr(null);
                  } else {
                    recordUnsuccessfulLogin(inputID, 'Admin Incorrect Password');
                    setLoginErr(language === 'en' ? 'Incorrect Administrator password.' : 'अमान्य एडमिनिस्ट्रेटर पासवर्ड।');
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
                      setPortalUser(portalUserObj);
                      localStorage.setItem('payroll_portal_user', JSON.stringify(portalUserObj));
                      setLoginId('');
                      setLoginPass('');
                      setLoginErr(null);
                    } else {
                      recordUnsuccessfulLogin(inputID, 'Incorrect Password');
                      setLoginErr(language === 'en' ? 'Incorrect Password.' : 'गलत पासवर्ड।');
                    }
                  } else {
                    const emp = employees.find(e => e.id.trim().toLowerCase() === inputID.trim().toLowerCase());
                    if (emp) {
                      const targetPass = (emp.password || '').trim();
                      const isCorrectPass = targetPass 
                        ? (inputPass.trim() === targetPass) 
                        : (inputPass.trim() === '123456' || inputPass.trim().toLowerCase() === emp.id.trim().toLowerCase());

                      if (isCorrectPass) {
                        const empUser: PortalUser = {
                          id: emp.id,
                          name: emp.name,
                          role: 'employee',
                          employee: emp
                        };
                        setPortalUser(empUser);
                        localStorage.setItem('payroll_portal_user', JSON.stringify(empUser));
                        setLoginId('');
                        setLoginPass('');
                        setLoginErr(null);
                      } else {
                        recordUnsuccessfulLogin(inputID, 'Incorrect Password');
                        setLoginErr(language === 'en' ? "Incorrect Password! Standard password is your Employee ID or '123456'." : "गलत पासवर्ड! मानक पासवर्ड आपकी कर्मचारी आईडी या '123456' है।");
                      }
                    } else {
                      recordUnsuccessfulLogin(inputID, 'User ID not found');
                      setLoginErr(language === 'en' ? "User ID / Employee ID not found. Contact administration." : "उपयोगकर्ता आईडी / कर्मचारी आईडी नहीं मिली। प्रशासन से संपर्क करें।");
                    }
                  }
                }
              }} className="space-y-4 mt-6">
                
                {/* User ID Field */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">
                    {language === 'en' ? 'User ID / Employee ID' : 'उपयोगकर्ता आईडी / कर्मचारी आईडी'}
                  </label>
                  <div className="relative">
                    <LucideUser className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={loginId}
                      onChange={(e) => setLoginId(e.target.value)}
                      placeholder={language === 'en' ? 'e.g., admin or EMP001' : 'उदा., admin या EMP001'}
                      className="w-full border border-slate-800 rounded-xl pl-10 pr-3.5 py-3 text-xs font-bold bg-slate-900/60 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">
                      {language === 'en' ? 'Password' : 'पासवर्ड'}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotModal(true);
                        setForgotSubmitted(false);
                        setForgotEmpId('');
                        setForgotEmail('');
                        setForgotMobile('');
                        setForgotError(null);
                      }}
                      className="text-[10px] font-black uppercase text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                    >
                      {language === 'en' ? 'Forgot Password?' : 'पासवर्ड भूल गए?'}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={loginPass}
                      onChange={(e) => setLoginPass(e.target.value)}
                      placeholder="••••••••"
                      className="w-full border border-slate-800 rounded-xl pl-10 pr-10 py-3 text-xs font-bold bg-slate-900/60 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-sans"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 focus:outline-none p-1 rounded-md transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs py-3 px-4 rounded-xl cursor-pointer shadow-lg shadow-emerald-950/40 hover:shadow-emerald-500/10 transition-all duration-200 text-center uppercase tracking-wider active:scale-98 mt-2"
                >
                  {language === 'en' ? 'Sign In to Workspace' : 'कार्यक्षेत्र में साइन इन करें'}
                </button>

              </form>

              {/* Help & FAQ Accordion Section */}
              <div className="mt-6 pt-5 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setShowLoginHelp(!showLoginHelp)}
                  className="w-full flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                    {language === 'en' ? 'Struggling with Sign In?' : 'लॉगिन करने में समस्या?'}
                  </span>
                  <span className="text-[12px] font-bold text-slate-500">{showLoginHelp ? '−' : '+'}</span>
                </button>

                {showLoginHelp && (
                  <div className="mt-3 p-3 bg-slate-900/80 rounded-xl border border-slate-800/60 text-[10px] text-slate-400 font-semibold space-y-2 leading-relaxed animate-fadeIn">
                    <p>
                      💡 <strong className="text-slate-200">{language === 'en' ? 'Standard Employees:' : 'मानक कर्मचारी:'}</strong>{' '}
                      {language === 'en' 
                        ? "Your standard default password is your unique Employee ID (e.g., EMP001) or '123456' unless modified by admin."
                        : "आपका मानक डिफ़ॉल्ट पासवर्ड आपकी विशिष्ट कर्मचारी आईडी (जैसे, EMP001) या '123456' है जब तक कि एडमिन द्वारा बदला न गया हो।"}
                    </p>
                    <p>
                      ⚙️ <strong className="text-slate-200">{language === 'en' ? 'System Administrator:' : 'सिस्टम एडमिनिस्ट्रेटर:'}</strong>{' '}
                      {language === 'en'
                        ? "Login with username 'admin' and standard password to enter admin workspace."
                        : "प्रशासनिक कार्यक्षेत्र में प्रवेश करने के लिए उपयोगकर्ता नाम 'admin' और मानक पासवर्ड के साथ लॉगिन करें।"}
                    </p>
                    <p className="text-slate-500 text-[9px] italic border-t border-slate-800/40 pt-1.5 font-mono">
                      {language === 'en' 
                        ? 'All unsuccessful sign-in attempts are logged securely in our Firestore security audit database.' 
                        : 'सभी असफल लॉगिन प्रयास हमारे फ़ायरस्टोर सुरक्षा ऑडिट डेटाबेस में सुरक्षित रूप से दर्ज किए जाते हैं।'}
                    </p>
                    <div className="border-t border-slate-800/40 pt-2.5 mt-1.5 flex justify-center">
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
                        className="w-full bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/20 hover:border-emerald-500 text-emerald-400 hover:text-white px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <LifeBuoy className="w-3.5 h-3.5 shrink-0" />
                        {language === 'en' ? 'Contact HR Helpdesk Support' : 'एचआर हेल्पडेस्क से संपर्क करें'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Subtle Footer branding info */}
            <p className="text-center text-[10px] text-slate-500 font-semibold mt-6 uppercase tracking-wider">
              © {new Date().getFullYear()} {adminSettings.companyName || 'Rathi Build Mart'} • {language === 'en' ? 'All Rights Reserved' : 'सर्वाधिकार सुरक्षित'}
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

              {!forgotSubmitted ? (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const targetEmp = employees.find(emp => emp.id.trim().toLowerCase() === forgotEmpId.trim().toLowerCase());
                  if (!targetEmp) {
                    setForgotError(language === 'en' 
                      ? "Employee ID not found in Rathi Build Mart roster." 
                      : "राठी बिल्डमार्ट रजिस्टर में कर्मचारी आईडी नहीं मिली।");
                    return;
                  }

                  const newReq = {
                    id: `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
                    empId: forgotEmpId.trim().toUpperCase(),
                    email: forgotEmail.trim(),
                    mobile: forgotMobile.trim(),
                    date: new Date().toISOString(),
                    status: 'Pending'
                  };
                  setPasswordRequests(prev => [newReq, ...prev]);
                  setForgotSubmitted(true);
                  setForgotError(null);
                }} className="space-y-4">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest bg-emerald-950/50 text-emerald-400 border border-emerald-900/30">
                      <KeyRound className="w-3 h-3 text-emerald-400" />
                      {language === 'en' ? 'Reset Gateway' : 'रीसेट गेटवे'}
                    </div>
                    <h3 className="text-lg font-black text-white font-display tracking-tight mt-1.5">
                      {language === 'en' ? 'Forgot Your Password?' : 'पासवर्ड भूल गए?'}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-semibold leading-normal">
                      {language === 'en' 
                        ? 'Submit your registered employee details. A password reset request will be dispatched to the HR Administrator instantly.'
                        : 'अपने पंजीकृत कर्मचारी विवरण सबमिट करें। एक पासवर्ड रीसेट अनुरोध तुरंत एचआर एडमिनिस्ट्रेटर को भेजा जाएगा।'}
                    </p>
                  </div>

                  {forgotError && (
                    <div className="bg-rose-500/10 text-rose-300 border border-rose-500/20 p-3 rounded-xl text-[11px] font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{forgotError}</span>
                    </div>
                  )}

                  <div className="space-y-3 mt-4">
                    <div className="space-y-1">
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">
                        {language === 'en' ? 'Employee ID (Required)' : 'कर्मचारी आईडी (आवश्यक)'}
                      </label>
                      <input
                        type="text"
                        required
                        value={forgotEmpId}
                        onChange={(e) => setForgotEmpId(e.target.value)}
                        placeholder="e.g. EMP001"
                        className="w-full border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold bg-slate-950/60 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono uppercase"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">
                        {language === 'en' ? 'Registered Email' : 'पंजीकृत ईमेल'}
                      </label>
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="e.g. staff@rathibuildmart.com"
                        className="w-full border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold bg-slate-950/60 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-sans"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">
                        {language === 'en' ? 'Mobile Number' : 'मोबाइल नंबर'}
                      </label>
                      <input
                        type="tel"
                        required
                        value={forgotMobile}
                        onChange={(e) => setForgotMobile(e.target.value)}
                        placeholder="e.g. 9876543210"
                        className="w-full border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold bg-slate-950/60 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs py-2.5 px-4 rounded-xl cursor-pointer shadow-lg transition-all duration-200 text-center uppercase tracking-wider"
                  >
                    {language === 'en' ? 'Submit Reset Request' : 'रीसेट अनुरोध सबमिट करें'}
                  </button>
                </form>
              ) : (
                <div className="text-center py-6 space-y-4 animate-fadeIn">
                  <div className="w-12 h-12 rounded-full bg-emerald-950/50 text-emerald-400 border border-emerald-900/50 flex items-center justify-center mx-auto animate-pulse">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-base font-black text-white">
                      {language === 'en' ? 'Request Registered!' : 'अनुरोध पंजीकृत!'}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-semibold leading-relaxed max-w-xs mx-auto">
                      {language === 'en' 
                        ? 'Your request has been securely registered. Your shift manager or payroll admin has been notified and will reset your password shortly.'
                        : 'आपका अनुरोध सफलतापूर्वक पंजीकृत हो गया है। आपके शिफ्ट मैनेजर या पेरोल एडमिन को सूचित कर दिया गया है और वे जल्द ही आपका पासवर्ड रीसेट करेंगे।'}
                    </p>
                  </div>
                  <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/80 text-[10px] font-mono text-slate-500">
                    ID: REQ-{Math.floor(10000 + Math.random() * 90000)} • Status: PENDING_HR
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold py-2 px-4 rounded-xl transition-all cursor-pointer"
                  >
                    {language === 'en' ? 'Return to Login' : 'लॉगिन पर लौटें'}
                  </button>
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
                      {language === 'en' ? 'HR Helpdesk' : 'एचआर हेल्पडेस्क'}
                    </div>
                    <h3 className="text-lg font-black text-white font-display tracking-tight mt-1.5 font-sans">
                      {language === 'en' ? 'Contact HR Helpdesk' : 'एचआर हेल्पडेस्क से संपर्क करें'}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-semibold leading-normal">
                      {language === 'en' 
                        ? 'Having issues with attendance logs, salary slips, or profile registrations? Leave a message for Rathi HR.'
                        : 'उपस्थिति लॉग, वेतन पर्ची या प्रोफ़ाइल पंजीकरण में समस्या आ रही है? राठी एचआर के लिए एक संदेश छोड़ें।'}
                    </p>
                  </div>

                  <div className="space-y-3 mt-4 overflow-y-auto max-h-[300px] pr-1">
                    <div className="space-y-1">
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">
                        {language === 'en' ? 'Full Name' : 'पूरा नाम'}
                      </label>
                      <input
                        type="text"
                        required
                        value={supportName}
                        onChange={(e) => setSupportName(e.target.value)}
                        placeholder="e.g. Amit Kumar"
                        className="w-full border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold bg-slate-950/60 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">
                        {language === 'en' ? 'Employee ID (Optional)' : 'कर्मचारी आईडी (वैकल्पिक)'}
                      </label>
                      <input
                        type="text"
                        value={supportEmpId}
                        onChange={(e) => setSupportEmpId(e.target.value)}
                        placeholder="e.g. EMP001"
                        className="w-full border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold bg-slate-950/60 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono uppercase"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">
                        {language === 'en' ? 'Contact Email' : 'संपर्क ईमेल'}
                      </label>
                      <input
                        type="email"
                        required
                        value={supportEmail}
                        onChange={(e) => setSupportEmail(e.target.value)}
                        placeholder="e.g. amit@rathibuildmart.com"
                        className="w-full border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold bg-slate-950/60 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">
                        {language === 'en' ? 'Issue Category' : 'समस्या की श्रेणी'}
                      </label>
                      <select
                        value={supportCategory}
                        onChange={(e) => setSupportCategory(e.target.value)}
                        className="w-full border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold bg-slate-950/60 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
                      >
                        <option value="Attendance / Punch Issue">{language === 'en' ? 'Attendance / Punch Issue' : 'उपस्थिति / पंच समस्या'}</option>
                        <option value="Salary Slip Discrepancy">{language === 'en' ? 'Salary Slip Discrepancy' : 'वेतन पर्ची विसंगति'}</option>
                        <option value="Login / Password Problem">{language === 'en' ? 'Login / Password Problem' : 'लॉगिन / पासवर्ड समस्या'}</option>
                        <option value="Profile Registration Error">{language === 'en' ? 'Profile Registration Error' : 'प्रोफ़ाइल पंजीकरण त्रुटि'}</option>
                        <option value="Other HR General Query">{language === 'en' ? 'Other HR General Query' : 'अन्य एचआर सामान्य प्रश्न'}</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">
                        {language === 'en' ? 'Message / Support Description' : 'संदेश / विवरण'}
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={supportMsg}
                        onChange={(e) => setSupportMsg(e.target.value)}
                        placeholder={language === 'en' ? "Describe your issue in detail..." : "अपनी समस्या का विस्तार से वर्णन करें..."}
                        className="w-full border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold bg-slate-950/60 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs py-2.5 px-4 rounded-xl cursor-pointer shadow-lg transition-all duration-200 text-center uppercase tracking-wider flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {language === 'en' ? 'Send Support Ticket' : 'सपोर्ट टिकट भेजें'}
                  </button>
                </form>
              ) : (
                <div className="text-center py-6 space-y-4 animate-fadeIn">
                  <div className="w-12 h-12 rounded-full bg-emerald-950/50 text-emerald-400 border border-emerald-900/50 flex items-center justify-center mx-auto animate-pulse">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-base font-black text-white">
                      {language === 'en' ? 'Support Ticket Dispatched!' : 'सपोर्ट टिकट भेजा गया!'}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-semibold leading-relaxed max-w-xs mx-auto">
                      {language === 'en' 
                        ? 'Your support inquiry has been submitted. The HR helpdesk team will review your ticket and reach out to you via your registered contact coordinates shortly.'
                        : 'आपकी सहायता पूछताछ सबमिट कर दी गई है। एचआर हेल्पडेस्क टीम आपके टिकट की समीक्षा करेगी और जल्द ही आपके पंजीकृत संपर्क विवरणों के माध्यम से आपसे संपर्क करेगी।'}
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
                    {language === 'en' ? 'Return to Login' : 'लॉगिन पर लौटें'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    );
  }

  // 3. Render Employee Portal if user is logged in as employee
  if (portalUser?.role === 'employee') {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-[#1e293b] flex flex-col font-sans">
        {/* Portal Header */}
        <header className="bg-slate-950 text-white border-b border-slate-900 py-3 px-4 md:py-4 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md relative no-print shrink-0">
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2.5">
              <img 
                src={getDirectImageUrl(adminSettings.companyLogo)} 
                alt="Logo" 
                className="w-8 h-8 rounded-lg object-cover" 
                referrerPolicy="no-referrer"
              />
              <div className="max-w-[180px] sm:max-w-none">
                <h1 className="text-xs sm:text-sm font-black uppercase tracking-widest truncate">{adminSettings.companyName || 'Rathi Build Mart'}</h1>
                <p className="text-[8px] sm:text-[9px] font-mono font-bold text-emerald-400 tracking-wider">Employee Workspace Portal</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto border-t border-slate-900/50 sm:border-t-0 pt-2 sm:pt-0">
            {/* Connection Status Indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-slate-900 border border-slate-800">
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className={isOnline ? 'text-green-400 font-sans' : 'text-amber-400 font-sans'}>
                {isOnline ? (language === 'en' ? 'Connected' : 'कनेक्टेड') : (language === 'en' ? 'Offline' : 'ऑफ़लाइन')}
              </span>
            </div>

            {/* Logout Button */}
            <button
              onClick={handlePortalLogout}
              className="bg-rose-600/10 hover:bg-rose-600 hover:text-white border border-rose-600/20 text-rose-400 text-xs font-bold px-2.5 py-1.5 rounded-lg cursor-pointer flex items-center gap-1.5 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Sign Out' : 'लॉग आउट'}</span>
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 w-full">
          <EmployeePortal 
            employee={portalUser.employee!}
            attendanceRecords={attendance}
            payrollRecords={payroll}
            language={language}
            adminSettings={adminSettings}
            onUpdateAttendanceRecords={handleUpdateAttendanceRecords}
          />
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
                  {language === 'en' ? 'Yes, Proceed' : 'हाँ, आगे बढ़ें'}
                </button>
                <button
                  onClick={() => setConfirmDialog(null)}
                  className="w-full bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-97"
                >
                  {language === 'en' ? 'Cancel' : 'रद्द करें'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Filter data for Branch Manager & Director restrictions
  const filteredEmployees = (() => {
    if (portalUser?.role !== 'branch_manager' && portalUser?.role !== 'director') return employees;
    
    const allowedBranches = portalUser.branches || [];
    if (allowedBranches.length > 0) {
      const allowedLower = allowedBranches.map(b => b.trim().toLowerCase());
      return employees.filter(emp => allowedLower.includes((emp.branch || '').trim().toLowerCase()));
    }
    
    if (portalUser.branch) {
      const singleLower = portalUser.branch.trim().toLowerCase();
      return employees.filter(emp => (emp.branch || '').trim().toLowerCase() === singleLower);
    }
    
    return employees; // If no branches or branch is restricted, allow all branches
  })();

  const filteredEmployeesIds = new Set(filteredEmployees.map(e => e.id));

  const filteredAttendance = (portalUser?.role === 'branch_manager' || portalUser?.role === 'director')
    ? attendance.filter(rec => filteredEmployeesIds.has(rec.employeeId))
    : attendance;

  const filteredPayroll = (portalUser?.role === 'branch_manager' || portalUser?.role === 'director')
    ? payroll.filter(rec => filteredEmployeesIds.has(rec.employeeId))
    : payroll;

  // 3. Render Dashboard / Workspace after Login
  return (
    <div className="h-screen w-screen bg-[#f1f5f9] text-[#1e293b] flex overflow-hidden font-sans">
      
      {/* Left Sidebar navigation */}
      <aside 
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
        className={`my-4 ml-4 mr-2 h-[calc(100vh-2rem)] bg-gradient-to-b from-[#031c12] via-[#02110c] to-[#010906] text-[#cbd5e1] flex flex-col justify-between rounded-[2.25rem] border border-emerald-500/15 shadow-[0_20px_50px_-12px_rgba(2,17,12,0.8)] shrink-0 no-print py-6 transition-all duration-300 ease-in-out relative z-40 ${
          isSidebarHovered ? 'w-[240px] px-5 items-start' : 'w-[78px] px-3 items-center'
        }`}
      >
        {/* Brand Logo inside a perfect white squircle */}
        <div className={`flex flex-col ${isSidebarHovered ? 'items-start w-full' : 'items-center'}`}>
          <div className="flex items-center gap-3 mb-8 w-full">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 active:scale-95 hover:rotate-3 transition-all duration-300 cursor-pointer relative group border border-emerald-500/20 shadow-emerald-950/20 shrink-0 overflow-hidden">
              <img 
                src={getDirectImageUrl(adminSettings.companyLogo)} 
                alt={adminSettings.companyName || 'Rathi Buildmart'} 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
              />
              {/* Logo Tooltip */}
              {!isSidebarHovered && (
                <div className="absolute left-16 scale-0 group-hover:scale-100 transition-all duration-200 origin-left bg-[#021810] text-white border border-[#10b981]/20 p-2 rounded-xl shadow-xl pointer-events-none z-50 text-[11px] font-bold whitespace-nowrap">
                  {uiTexts.appName}
                </div>
              )}
            </div>
            {isSidebarHovered && (
              <div className="flex flex-col min-w-0 animate-fadeIn">
                <span className="text-[12px] font-black tracking-wider text-white uppercase font-sans truncate">
                  {adminSettings.companyName || 'RATHI MART'}
                </span>
                <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest font-mono truncate">
                  {uiTexts.appName}
                </span>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className={`flex flex-col ${isSidebarHovered ? 'items-start w-full gap-2' : 'items-center gap-4'}`}>
            {(() => {
              const allowedTabs = portalUser?.role === 'admin'
                ? ['dashboard', 'employees', 'attendance', 'payroll', 'leaves', 'ledger', 'admin']
                : adminSettings.rolePermissions?.[portalUser?.role || 'employee'] || [];

              return [
                { id: 'dashboard' as const, label: uiTexts.dashboard, icon: TrendingUp },
                { id: 'employees' as const, label: uiTexts.employees, icon: Users },
                { id: 'attendance' as const, label: uiTexts.attendance, icon: Calendar },
                { id: 'payroll' as const, label: uiTexts.payroll, icon: CreditCard },
                { id: 'leaves' as const, label: uiTexts.leaves, icon: CalendarDays },
                { id: 'ledger' as const, label: uiTexts.ledger, icon: FileSpreadsheet },
                { id: 'admin' as const, label: uiTexts.adminSettings, icon: SettingsIcon },
              ].filter(item => allowedTabs.includes(item.id));
            })().map((item) => {
              const IconComponent = item.icon;
              const isActive = currentTab === item.id;
              return (
                <div key={item.id} className="relative group flex items-center justify-start w-full">
                  <button
                    onClick={() => setCurrentTab(item.id)}
                    className={`flex items-center rounded-2xl transition-all duration-300 cursor-pointer relative ${
                      isSidebarHovered ? 'w-full h-11 px-3 justify-start gap-3' : 'w-12 h-12 justify-center'
                    } ${
                      isActive
                        ? 'bg-emerald-500/15 text-[#10b981] shadow-[0_0_15px_rgba(16,185,129,0.12)] border border-emerald-500/30'
                        : 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/5'
                    }`}
                    id={`tab-${item.id}`}
                  >
                    {isActive && (
                      <span className={`absolute left-0 w-1 bg-[#10b981] rounded-r-full shadow-[0_0_8px_#10b981] ${
                        isSidebarHovered ? 'h-4' : 'h-5'
                      }`} />
                    )}
                    <IconComponent className="w-5 h-5 shrink-0" />
                    {isSidebarHovered && (
                      <span className="text-[11px] font-bold tracking-wide whitespace-nowrap animate-fadeIn">
                        {item.label}
                      </span>
                    )}
                  </button>
                  {/* Tooltip */}
                  {!isSidebarHovered && (
                    <div className="absolute left-16 scale-0 group-hover:scale-100 transition-all duration-200 origin-left bg-[#021810] text-[#cbd5e1] border border-[#10b981]/20 text-[10px] font-extrabold px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-xl pointer-events-none z-50">
                      {item.label}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className={`flex flex-col ${isSidebarHovered ? 'items-start w-full' : 'items-center'} gap-3 w-full`}>
          {/* Divider */}
          <div className={`${isSidebarHovered ? 'w-full' : 'w-8'} h-[1px] bg-emerald-950/60 transition-all`} />

          {/* Spreadsheet Link Badge */}
          {spreadsheetLink && (
            <div className="relative group flex items-center justify-start w-full">
              <a
                href={spreadsheetLink}
                target="_blank"
                rel="noreferrer"
                className={`flex items-center rounded-xl text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-all ${
                  isSidebarHovered ? 'w-full h-11 px-3.5 justify-start gap-3.5' : 'w-11 h-11 justify-center'
                }`}
              >
                <FileSpreadsheet className="w-5 h-5 shrink-0" />
                {isSidebarHovered && (
                  <span className="text-[11px] font-bold whitespace-nowrap animate-fadeIn text-[#cbd5e1]">
                    {uiTexts.viewSheets}
                  </span>
                )}
              </a>
              {!isSidebarHovered && (
                <div className="absolute left-16 scale-0 group-hover:scale-100 transition-all duration-200 origin-left bg-[#021810] text-[#cbd5e1] border border-[#10b981]/20 text-[10px] font-extrabold px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-xl pointer-events-none z-50">
                  {uiTexts.viewSheets}
                </div>
              )}
            </div>
          )}

          {/* Light/Dark Toggle Mock representing premium dashboard details */}
          <div className={`flex ${isSidebarHovered ? 'flex-row items-center justify-between w-full px-3.5 py-1.5 rounded-xl hover:bg-emerald-500/5' : 'flex-col items-center gap-1.5 py-1'}`}>
            <div className="relative group flex items-center">
              <span className="text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sun w-4 h-4">
                  <circle cx="12" cy="12" r="4"/>
                  <path d="M12 2v2"/>
                  <path d="M12 20v2"/>
                  <path d="m4.93 4.93 1.41 1.41"/>
                  <path d="m17.66 17.66 1.41 1.41"/>
                  <path d="M2 12h2"/>
                  <path d="M20 12h2"/>
                  <path d="m6.34 17.66-1.41 1.41"/>
                  <path d="m19.07 4.93-1.41 1.41"/>
                </svg>
              </span>
              {isSidebarHovered && (
                <span className="text-[11px] font-bold text-slate-300 ml-3.5 whitespace-nowrap animate-fadeIn">
                  Premium Light Mode
                </span>
              )}
              {!isSidebarHovered && (
                <div className="absolute left-16 scale-0 group-hover:scale-100 transition-all duration-200 origin-left bg-[#021810] text-[#cbd5e1] border border-[#10b981]/20 text-[10px] font-extrabold px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-xl pointer-events-none z-50">
                  Premium Light Mode Active
                </div>
              )}
            </div>
            {/* Custom Toggle Switch Capsule */}
            <div className="w-7 h-4 bg-emerald-950 border border-emerald-900 rounded-full p-[2px] cursor-pointer flex items-center justify-start relative shadow-inner shrink-0">
              <div className="w-3.5 h-3.5 bg-white rounded-full shadow-sm transform translate-x-2.5 transition-transform"></div>
            </div>
          </div>

          {/* Sign Out Button */}
          <div className="relative group flex items-center justify-start w-full">
            <button
              onClick={handleLogout}
              className={`flex items-center rounded-xl text-red-400/80 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer ${
                isSidebarHovered ? 'w-full h-11 px-3.5 justify-start gap-3.5' : 'w-11 h-11 justify-center'
              }`}
              id="btn-signout"
            >
              <LogOut className="w-5 h-5 shrink-0" />
              {isSidebarHovered && (
                <span className="text-[11px] font-bold whitespace-nowrap animate-fadeIn">
                  {uiTexts.signout}
                </span>
              )}
            </button>
            {!isSidebarHovered && (
              <div className="absolute left-16 scale-0 group-hover:scale-100 transition-all duration-200 origin-left bg-red-950 text-red-200 border border-red-900/30 text-[10px] font-extrabold px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-xl pointer-events-none z-50">
                {uiTexts.signout}
              </div>
            )}
          </div>

          {/* User Account with Slide out detail card */}
          <div className={`relative group mt-1 flex items-center justify-start ${isSidebarHovered ? 'w-full px-1.5 gap-3' : ''}`}>
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt="Profile"
                className="w-10 h-10 rounded-2xl border-2 border-emerald-500/30 object-cover shadow-md hover:border-emerald-400 cursor-pointer transition-all duration-300 shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <img
                src="https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=150&q=80"
                alt="Premium User"
                className="w-10 h-10 rounded-2xl border-2 border-emerald-500/30 object-cover shadow-md transition-all duration-300 hover:border-emerald-400 cursor-pointer shrink-0"
                referrerPolicy="no-referrer"
              />
            )}
            {isSidebarHovered && (
              <div className="flex flex-col min-w-0 animate-fadeIn">
                <p className="text-[11px] font-black text-slate-100 truncate">
                  {user?.displayName || 'Admin'}
                </p>
                <p className="text-[9px] font-medium text-emerald-400 truncate">
                  {user?.email || 'rathi@buildmart.com'}
                </p>
              </div>
            )}
            {!isSidebarHovered && (
              <div className="absolute left-16 bottom-0 scale-0 group-hover:scale-100 transition-all duration-200 origin-left bg-[#021810] text-white border border-[#10b981]/20 p-3 rounded-2xl shadow-2xl pointer-events-none z-50 min-w-[180px]">
                <p className="font-black text-[9px] text-emerald-400 tracking-wider uppercase mb-1">Active Portal Admin</p>
                <p className="text-xs font-bold text-slate-200 truncate">{user?.displayName || 'Rathi Build Mart'}</p>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">{user?.email}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Compact Header */}
        <header className="h-[52px] bg-white border-b border-[#e2e8f0] px-5 flex items-center justify-between shrink-0 shadow-xxs">
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] font-semibold text-gray-500">
              {language === 'en' ? 'Database:' : 'डेटाबेस:'}
            </span>
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 text-[10px] font-mono px-2 py-0.5 rounded font-bold max-w-[200px] truncate">
              {spreadsheetId ? 'Google Sheet & Firestore' : 'Cloud Firestore (Active)'}
            </span>

            {/* Real-time Connection Badge */}
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
              isOnline 
                ? 'bg-emerald-50/50 text-emerald-700 border-emerald-200/50' 
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              <span className={`w-1 h-1 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              {isOnline ? (language === 'en' ? 'Online' : 'ऑनलाइन') : (language === 'en' ? 'Offline' : 'ऑफ़लाइन')}
            </span>
          </div>

          {/* Controls Area */}
          <div className="flex items-center gap-3 relative">
            
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
              title={language === 'en' ? 'Click to view Sync History & Log' : 'सिंक इतिहास और लॉग देखने के लिए क्लिक करें'}
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
              onClick={() => token && loadApplicationData(token)}
              disabled={isLoadingData}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200 shadow-xxs bg-white cursor-pointer transition-all active:scale-95"
              title={uiTexts.refresh}
              id="refresh-data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? 'animate-spin text-blue-600' : ''}`} />
            </button>

            {/* Detailed Sync Log Panel Popover */}
            {isSyncPanelOpen && (
              <>
                {/* Backdrop overlay to close when clicking outside */}
                <div 
                  className="fixed inset-0 z-40 cursor-default" 
                  onClick={() => setIsSyncPanelOpen(false)}
                />
                
                {/* Panel Container */}
                <div className="absolute right-0 top-10 w-96 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 p-4 space-y-4 text-left overflow-hidden font-sans animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-slate-500" />
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                        {language === 'en' ? 'Database Sync Control' : 'डेटाबेस सिंक नियंत्रण'}
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
                      <span>{language === 'en' ? 'Connection Status' : 'कनेक्शन स्थिति'}</span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                        token ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {token ? (language === 'en' ? 'Connected' : 'कनेक्टेड') : (language === 'en' ? 'Offline Mode' : 'ऑफ़लाइन मोड')}
                      </span>
                    </div>

                    {spreadsheetId && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-600">
                          <span className="font-semibold">{language === 'en' ? 'Spreadsheet ID:' : 'स्प्रेडशीट आईडी:'}</span>
                          <span className="font-mono text-[10px] text-slate-500 truncate max-w-[180px]" title={spreadsheetId}>
                            {spreadsheetId}
                          </span>
                        </div>
                        {spreadsheetLink && (
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

                    {/* Last Sync Time */}
                    <div className="flex justify-between items-center text-xs text-slate-600 border-t border-slate-100 pt-2 mt-2">
                      <span className="font-semibold">{language === 'en' ? 'Last Successful Sync:' : 'अंतिम सफल सिंक:'}</span>
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
                          language === 'en' ? 'Never' : 'कभी नहीं'
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Actions inside panel */}
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        if (token) {
                          loadApplicationData(token);
                        } else {
                          setIsLoadingData(true);
                          try {
                            const result = await loadFromFirestore();
                            if (result && result.success && result.data) {
                              const globalData = result.data;
                              if (globalData.employees) setEmployees(globalData.employees);
                              if (globalData.attendance) setAttendance(globalData.attendance);
                              if (globalData.payroll) setPayroll(globalData.payroll);
                              if (globalData.adminSettings) setAdminSettings(globalData.adminSettings);
                              alert(language === 'en' ? 'Cloud Firestore database loaded successfully!' : 'क्लाउड फ़ायरस्टोर डेटाबेस सफलतापूर्वक लोड किया गया!');
                            } else {
                              const errorDetail = result?.error ? `\n\nError: ${result.error}` : '';
                              alert(
                                language === 'en' 
                                  ? `Failed to load from Cloud Firestore. Working with local cache.${errorDetail}` 
                                  : `क्लाउड फ़ायरस्टोर से लोड करने में विफल। स्थानीय कैश के साथ काम किया जा रहा है।${errorDetail}`
                              );
                            }
                          } catch (err: any) {
                            const errorDetail = err?.message || String(err);
                            alert(
                              language === 'en' 
                                ? `Cloud Firestore connection error. Working with local cache.\n\nError: ${errorDetail}` 
                                : `क्लाउड फ़ायरस्टोर कनेक्शन त्रुटि। स्थानीय कैश के साथ काम किया जा रहा है।\n\nत्रुटि: ${errorDetail}`
                            );
                          } finally {
                            setIsLoadingData(false);
                          }
                        }
                      }}
                      disabled={isLoadingData}
                      className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoadingData ? 'animate-spin' : ''}`} />
                      {language === 'en' ? 'Force Sync Now' : 'अभी सिंक करें'}
                    </button>
                    <button
                      onClick={() => {
                        setSyncLogs([
                          {
                            id: 'cleared',
                            timestamp: new Date().toISOString(),
                            operation: 'Log Cleared',
                            status: 'success',
                            details: language === 'en' ? 'Recent sync log cleared.' : 'हालिया सिंक लॉग साफ कर दिया गया।'
                          }
                        ]);
                        localStorage.setItem('payroll_sync_logs', JSON.stringify([{
                          id: 'cleared',
                          timestamp: new Date().toISOString(),
                          operation: 'Log Cleared',
                          status: 'success',
                          details: language === 'en' ? 'Recent sync log cleared.' : 'हालिया सिंक लॉग साफ कर दिया गया।'
                        }]));
                      }}
                      className="bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      {language === 'en' ? 'Clear Logs' : 'लॉग साफ़ करें'}
                    </button>
                  </div>

                  {/* Troubleshooting Reset for Sync Errors */}
                  {syncStatus === 'error' && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2 font-sans">
                      <p className="text-[10px] text-amber-800 leading-normal font-semibold">
                        {language === 'en' 
                          ? 'Persistent "Failed to Fetch" or "Sync Error"? This is usually caused by expired credentials, browser tracking blocks, or local adblockers. Click below to clear Google session cache and re-authenticate.'
                          : 'लगातार "Failed to Fetch" या "सिंक त्रुटि" दिख रही है? यह आमतौर पर समाप्त क्रेडेंशियल्स, ब्राउज़र ट्रैकिंग ब्लॉक या एडब्लॉकर्स के कारण होता है। Google सत्र कैश साफ़ करने और फिर से प्रमाणित करने के लिए नीचे क्लिक करें।'}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          handleClearSheetsSession();
                          alert(language === 'en'
                            ? 'Google Sheets cache cleared. Please click "Connect Google Account" in the banner to log back in.'
                            : 'Google Sheets कैश साफ़ कर दिया गया है। फिर से लॉग इन करने के लिए बैनर में "Google खाता कनेक्ट करें" पर क्लिक करें।');
                        }}
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 shadow-3xs"
                      >
                        <RefreshCw className="w-3 h-3 animate-spin" style={{ animationDuration: '3s' }} />
                        {language === 'en' ? 'Reset Google Sheets Session & Relogin' : 'Google Sheets सत्र रीसेट करें और पुनः लॉगिन करें'}
                      </button>
                    </div>
                  )}

                  {/* Sync Logs list */}
                  <div className="space-y-2">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {language === 'en' ? 'Recent Operations Log' : 'हालिया संचालन लॉग'}
                    </h5>
                    
                    <div className="max-h-56 overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-50 bg-slate-50/50">
                      {syncLogs.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400 font-medium">
                          {language === 'en' ? 'No recent logs' : 'कोई हालिया लॉग नहीं'}
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
          {portalUser?.role === 'admin' && needsAuth && !isLoadingAuth && showSheetsNotice && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm bg-emerald-50/50 text-emerald-900 mb-2 font-sans relative">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-100 text-emerald-800 p-2.5 rounded-xl shrink-0">
                  <Database className="w-5 h-5 text-emerald-800" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold tracking-tight">Cloud Firestore Database Active</h4>
                  <p className="text-[11px] text-slate-700 font-medium mt-0.5 leading-normal font-semibold">
                    Your database is securely connected and active on Cloud Firestore. Google Sheets integration is optional. Connect your Google Account if you wish to also sync and backup all payroll records to a live Google Sheet.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 self-end md:self-auto">
                <button
                  onClick={() => {
                    setShowSheetsNotice(false);
                    localStorage.setItem('dismiss_sheets_notice', 'true');
                  }}
                  className="bg-transparent hover:bg-slate-100 text-slate-500 text-xs font-bold px-3 py-2 rounded-xl cursor-pointer transition-all border border-slate-200"
                >
                  Hide Notice
                </button>
                <button
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                  className="bg-emerald-750 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shrink-0 cursor-pointer transition-all flex items-center gap-2 shadow-sm"
                >
                  {isLoggingIn ? (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <Database className="w-3.5 h-3.5" />
                  )}
                  <span>Connect Google Sheets</span>
                </button>
              </div>
            </div>
          )}

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
                  onNavigate={setCurrentTab}
                />
              )}
              {currentTab === 'employees' && (
                <EmployeeList 
                  employees={filteredEmployees} 
                  onAddEmployee={handleAddEmployee} 
                  onUpdateEmployee={handleUpdateEmployee} 
                  onBulkAddEmployees={handleBulkAddEmployees}
                  language={language} 
                  adminSettings={adminSettings}
                />
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
                />
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
                />
              )}
              {currentTab === 'leaves' && (
                <LeavesHolidays 
                  employees={filteredEmployees}
                  attendance={filteredAttendance}
                  language={language}
                  adminSettings={adminSettings}
                  onUpdateSettings={handleSaveSettings}
                />
              )}
              {currentTab === 'ledger' && (
                <EmployeeLedger 
                  employees={filteredEmployees}
                  payrollRecords={filteredPayroll}
                  language={language}
                  adminSettings={adminSettings}
                />
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
                  attendance={attendance}
                  payroll={payroll}
                  onImportData={handleImportDatabase}
                  onClearSheetsSession={handleClearSheetsSession}
                />
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
                {language === 'en' ? 'Yes, Proceed' : 'हाँ, आगे बढ़ें'}
              </button>
              <button
                onClick={() => setConfirmDialog(null)}
                className="w-full bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-97"
              >
                {language === 'en' ? 'Cancel' : 'रद्द करें'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
