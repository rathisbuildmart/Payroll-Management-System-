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
  Settings as SettingsIcon
} from 'lucide-react';
import { initAuth, googleSignIn, logout } from './services/auth';
import { 
  findSpreadsheet, 
  createSpreadsheet, 
  getSpreadsheetLink,
  fetchEmployees, 
  fetchAttendance, 
  fetchPayrollHistory, 
  saveEmployees, 
  saveAttendance, 
  savePayrollHistory 
} from './services/sheets';
import { Employee, Attendance, PayrollRecord, AdminSettings } from './types';

// Importing Tab Components
import Dashboard from './components/Dashboard';
import EmployeeList from './components/EmployeeList';
import AttendanceTracker from './components/AttendanceTracker';
import PayrollCalculator from './components/PayrollCalculator';
import Settings, { INITIAL_ADMIN_SETTINGS } from './components/Settings';

export default function App() {
  const [needsAuth, setNeedsAuth] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Sheets Metadata
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(null);
  const [spreadsheetLink, setSpreadsheetLink] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');

  // Application Data States
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);

  // UI States
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'employees' | 'attendance' | 'payroll' | 'admin'>('dashboard');
  const [language, setLanguage] = useState<'en' | 'hi'>('hi'); // Defaulting to Hindi/Hinglish as requested
  const [showSeedDialog, setShowSeedDialog] = useState<boolean>(false);

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

  const handleSaveSettings = (updated: AdminSettings) => {
    setAdminSettings(updated);
    localStorage.setItem('payroll_admin_settings', JSON.stringify(updated));
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
      () => {
        setUser(null);
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
    try {
      // 1. Find or create Spreadsheet
      let sheetId = await findSpreadsheet(accessToken);
      if (!sheetId) {
        sheetId = await createSpreadsheet(accessToken);
        // Newly created spreadsheet is empty, offer to seed demo data
        setShowSeedDialog(true);
      }
      setSpreadsheetId(sheetId);

      // 2. Get the web URL of the Google Sheet
      const webLink = await getSpreadsheetLink(sheetId, accessToken);
      setSpreadsheetLink(webLink);

      // 3. Load Employees, Attendance, Payroll
      const fetchedEmployees = await fetchEmployees(sheetId, accessToken);
      const fetchedAttendance = await fetchAttendance(sheetId, accessToken);
      const fetchedPayroll = await fetchPayrollHistory(sheetId, accessToken);

      setEmployees(fetchedEmployees);
      setAttendance(fetchedAttendance);
      setPayroll(fetchedPayroll);

      // If existing employees are found, hide seed dialog
      if (fetchedEmployees.length > 0) {
        setShowSeedDialog(false);
      }

      setSyncStatus('synced');
    } catch (error: any) {
      console.error('Failed to load Google Sheets data', error);
      setSyncStatus('error');
      const errStr = String(error?.message || error);
      if (errStr.includes('401') || errStr.includes('Unauthorized') || errStr.includes('403') || errStr.includes('invalid_grant')) {
        // Clear expired/invalid session token
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

  const handleLogout = async () => {
    const confirmLogout = window.confirm(
      language === 'en' ? 'Are you sure you want to sign out?' : 'क्या आप लॉग आउट करना चाहते हैं?'
    );
    if (!confirmLogout) return;

    try {
      await logout();
      setUser(null);
      setToken(null);
      setEmployees([]);
      setAttendance([]);
      setPayroll([]);
      setSpreadsheetId(null);
      setSpreadsheetLink(null);
      setNeedsAuth(true);
    } catch (err) {
      console.error('Logout error', err);
    }
  };

  // Seeding sample data
  const handleSeedDemoData = async () => {
    if (!spreadsheetId || !token) return;
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

      // Save Employees and Attendance to sheets
      await saveEmployees(spreadsheetId, sampleEmployees, token);
      await saveAttendance(spreadsheetId, sampleAttendance, token);

      // Reload
      setEmployees(sampleEmployees);
      setAttendance(sampleAttendance);
      setShowSeedDialog(false);
      setSyncStatus('synced');
    } catch (err) {
      console.error('Error seeding demo data', err);
      alert('Failed to seed demo data to Sheets.');
    } finally {
      setIsLoadingData(false);
    }
  };

  // Callback functions for syncing mutations
  const handleAddEmployee = async (newEmp: Employee) => {
    if (!spreadsheetId || !token) return;
    setSyncStatus('syncing');
    const updated = [...employees, newEmp];
    setEmployees(updated);
    try {
      await saveEmployees(spreadsheetId, updated, token);
      setSyncStatus('synced');
    } catch (err) {
      setSyncStatus('error');
      throw err;
    }
  };

  const handleBulkAddEmployees = async (newEmployees: Employee[]) => {
    if (!spreadsheetId || !token) return;
    setSyncStatus('syncing');
    
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
    try {
      await saveEmployees(spreadsheetId, updated, token);
      setSyncStatus('synced');
    } catch (err) {
      setSyncStatus('error');
      throw err;
    }
  };

  const handleUpdateEmployee = async (updatedEmp: Employee) => {
    if (!spreadsheetId || !token) return;
    setSyncStatus('syncing');
    const updated = employees.map(emp => emp.id === updatedEmp.id ? updatedEmp : emp);
    setEmployees(updated);
    try {
      await saveEmployees(spreadsheetId, updated, token);
      setSyncStatus('synced');
    } catch (err) {
      setSyncStatus('error');
      throw err;
    }
  };

  const handleSaveAttendance = async (date: string, records: Attendance[]) => {
    if (!spreadsheetId || !token) return;
    setSyncStatus('syncing');

    // Filter out old records for this specific date and append/overwrite new ones
    const filteredOld = attendance.filter(r => r.date !== date);
    const combined = [...filteredOld, ...records];
    
    setAttendance(combined);
    try {
      await saveAttendance(spreadsheetId, combined, token);
      setSyncStatus('synced');
    } catch (err) {
      setSyncStatus('error');
      throw err;
    }
  };

  const handleSavePayroll = async (records: PayrollRecord[]) => {
    if (!spreadsheetId || !token) return;
    setSyncStatus('syncing');
    setPayroll(records);
    try {
      await savePayrollHistory(spreadsheetId, records, token);
      setSyncStatus('synced');
    } catch (err) {
      setSyncStatus('error');
      throw err;
    }
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'hi' : 'en');
  };

  // Translations
  const uiTexts = {
    en: {
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
    },
    hi: {
      appName: "पेरोल पोर्टल",
      tagline: "कर्मचारी उपस्थिति और वेतन गणना प्रणाली - गूगल शीट्स के साथ सिंक",
      googleSheets: "गूगल शीट्स",
      sheetsConnected: "गूगल शीट्स कनेक्टेड है",
      viewSheets: "स्प्रेडशीट खोलें",
      signout: "लॉग आउट",
      dashboard: "डैशबोर्ड",
      employees: "कर्मचारी सूची",
      attendance: "दैनिक उपस्थिति",
      payroll: "सैलरी और पेरोल",
      adminSettings: "एडमिन सेटिंग्स",
      syncing: "सिंक हो रहा है...",
      synced: "गूगल शीट्स में सुरक्षित",
      syncError: "सिंक एरर!",
      refresh: "पुनः लोड करें",
      welcomeBack: "पेरोल मैनेजमेंट सिस्टम",
      googleSignIn: "गूगल के साथ साइन-इन करें",
      secureDriveSheets: "यह ऐप सुरक्षित रूप से आपकी अनुमति से आपके व्यक्तिगत गूगल ड्राइव और गूगल शीट्स का उपयोग करता है।",
      seedingTitle: "नया डेटाबेस तैयार है!",
      seedingDesc: "आपके गूगल ड्राइव में एक खाली स्प्रेडशीट बनाई गई है। क्या आप 3 सैंपल कर्मचारियों का डेटा और 5 दिनों की उपस्थिति इतिहास लोड करना चाहते हैं, ताकि आप तुरंत सिस्टम की वेतन गणना को लाइव देख सकें?",
      seedYes: "हाँ, सैंपल डेटा लोड करें",
      seedNo: "नहीं, खाली रखें",
      benefitOffline: "सुरक्षित क्लाउड स्टोरेज",
      benefitOfflineText: "सभी कर्मचारी रिकॉर्ड और पेरोल सीधे आपके अपने गूगल ड्राइव अकाउंट की शीट्स फाइल में सुरक्षित होते हैं।",
      benefitHinglish: "द्विभाषी व्यवस्था",
      benefitHinglishText: "आसानी से काम करने के लिए हिंदी और अंग्रेजी भाषाओं के बीच तुरंत बदलने की सुविधा उपलब्ध है।",
      benefitSlips: "प्रोफेशनल पे-स्लिप",
      benefitSlipsText: "उपस्थिति के आधार पर कटे हुए वेतन, ओवरटाइम बोनस, और भत्तों की गणना कर आकर्षक रसीदें प्रिंट करें।",
    }
  }[language];

  // 1. Loading Authentication state
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-semibold text-gray-500 font-display">Please wait...</p>
      </div>
    );
  }

  // 2. Render Login Screen if not authenticated
  if (needsAuth) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        
        {/* Language switch button */}
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={toggleLanguage}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold rounded-lg text-gray-600 cursor-pointer shadow-xs"
          >
            <Languages className="w-4 h-4 text-gray-400" />
            {language === 'en' ? 'हिंदी में बदलें' : 'English'}
          </button>
        </div>

        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <div className="inline-flex bg-blue-100 text-blue-700 p-4 rounded-3xl mb-4">
            <CreditCard className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 font-display tracking-tight leading-none">
            {uiTexts.welcomeBack}
          </h2>
          <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto font-medium">
            {uiTexts.tagline}
          </p>
        </div>

        {/* Floating login Card */}
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-6 border border-gray-100 shadow-2xl rounded-2xl space-y-6">
            
            <div className="text-center">
              <button
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="gsi-material-button w-full flex items-center justify-center"
              >
                <div className="gsi-material-button-state"></div>
                <div className="gsi-material-button-content-wrapper">
                  <div className="gsi-material-button-icon">
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      <path fill="none" d="M0 0h48v48H0z"></path>
                    </svg>
                  </div>
                  <span className="gsi-material-button-contents">{uiTexts.googleSignIn}</span>
                </div>
              </button>
            </div>

            <p className="text-xxs text-center text-gray-400 font-medium">
              {uiTexts.secureDriveSheets}
            </p>

            <hr className="border-gray-100" />

            {/* Feature benefits list */}
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="bg-emerald-50 text-emerald-600 p-2 rounded-xl h-fit">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">{uiTexts.benefitOffline}</h4>
                  <p className="text-xxs text-gray-500 mt-0.5">{uiTexts.benefitOfflineText}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="bg-blue-50 text-blue-600 p-2 rounded-xl h-fit">
                  <Languages className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">{uiTexts.benefitHinglish}</h4>
                  <p className="text-xxs text-gray-500 mt-0.5">{uiTexts.benefitHinglishText}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="bg-purple-50 text-purple-600 p-2 rounded-xl h-fit">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">{uiTexts.benefitSlips}</h4>
                  <p className="text-xxs text-gray-500 mt-0.5">{uiTexts.benefitSlipsText}</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // 3. Render Dashboard / Workspace after Login
  return (
    <div className="h-screen w-screen bg-[#f1f5f9] text-[#1e293b] flex overflow-hidden font-sans">
      
      {/* Left Sidebar navigation */}
      <aside className="my-4 ml-4 mr-2 h-[calc(100vh-2rem)] w-[78px] bg-gradient-to-b from-[#031c12] via-[#02110c] to-[#010906] text-[#cbd5e1] flex flex-col justify-between rounded-[2.25rem] border border-emerald-500/15 shadow-[0_20px_50px_-12px_rgba(2,17,12,0.8)] shrink-0 no-print items-center py-6 px-3 relative z-40">
        {/* Brand Logo inside a perfect white squircle */}
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-8 transform hover:scale-105 active:scale-95 hover:rotate-3 transition-all duration-300 cursor-pointer relative group border border-emerald-500/20 shadow-emerald-950/20">
            <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 8C12 8 16 12 20 12C24 12 28 8 28 8" stroke="#03623c" strokeWidth="4" strokeLinecap="round" />
              <path d="M12 20C12 20 18 16 22 22C26 28 28 32 28 32" stroke="#024d2e" strokeWidth="4" strokeLinecap="round" />
              <circle cx="20" cy="20" r="14" stroke="#10b981" strokeWidth="2.5" strokeDasharray="4 4" />
            </svg>
            {/* Logo Tooltip */}
            <div className="absolute left-16 scale-0 group-hover:scale-100 transition-all duration-200 origin-left bg-[#021810] text-white border border-[#10b981]/20 p-2 rounded-xl shadow-xl pointer-events-none z-50 text-[11px] font-bold whitespace-nowrap">
              {uiTexts.appName}
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col items-center gap-4">
            {[
              { id: 'dashboard' as const, label: uiTexts.dashboard, icon: TrendingUp },
              { id: 'employees' as const, label: uiTexts.employees, icon: Users },
              { id: 'attendance' as const, label: uiTexts.attendance, icon: Calendar },
              { id: 'payroll' as const, label: uiTexts.payroll, icon: CreditCard },
              { id: 'admin' as const, label: uiTexts.adminSettings, icon: SettingsIcon },
            ].map((item) => {
              const IconComponent = item.icon;
              const isActive = currentTab === item.id;
              return (
                <div key={item.id} className="relative group flex items-center justify-center">
                  <button
                    onClick={() => setCurrentTab(item.id)}
                    className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-300 cursor-pointer relative ${
                      isActive
                        ? 'bg-emerald-500/15 text-[#10b981] shadow-[0_0_15px_rgba(16,185,129,0.12)] border border-emerald-500/30'
                        : 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/5'
                    }`}
                    id={`tab-${item.id}`}
                  >
                    {isActive && (
                      <span className="absolute left-0 w-1 h-5 bg-[#10b981] rounded-r-full shadow-[0_0_8px_#10b981]" />
                    )}
                    <IconComponent className="w-5 h-5" />
                  </button>
                  {/* Tooltip */}
                  <div className="absolute left-16 scale-0 group-hover:scale-100 transition-all duration-200 origin-left bg-[#021810] text-[#cbd5e1] border border-[#10b981]/20 text-[10px] font-extrabold px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-xl pointer-events-none z-50">
                    {item.label}
                  </div>
                </div>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="flex flex-col items-center gap-3 w-full">
          {/* Divider */}
          <div className="w-8 h-[1px] bg-emerald-950/60" />

          {/* Spreadsheet Link Badge */}
          {spreadsheetLink && (
            <div className="relative group flex items-center justify-center">
              <a
                href={spreadsheetLink}
                target="_blank"
                rel="noreferrer"
                className="w-11 h-11 flex items-center justify-center rounded-xl text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-all"
              >
                <FileSpreadsheet className="w-5 h-5" />
              </a>
              <div className="absolute left-16 scale-0 group-hover:scale-100 transition-all duration-200 origin-left bg-[#021810] text-[#cbd5e1] border border-[#10b981]/20 text-[10px] font-extrabold px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-xl pointer-events-none z-50">
                {uiTexts.viewSheets}
              </div>
            </div>
          )}

          {/* Languages Button */}
          <div className="relative group flex items-center justify-center">
            <button
              onClick={toggleLanguage}
              className="w-11 h-11 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
              title="Switch Language"
            >
              <Languages className="w-5 h-5" />
            </button>
            <div className="absolute left-16 scale-0 group-hover:scale-100 transition-all duration-200 origin-left bg-[#021810] text-[#cbd5e1] border border-[#10b981]/20 text-[10px] font-extrabold px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-xl pointer-events-none z-50">
              {language === 'en' ? 'Switch to Hindi' : 'English में बदलें'}
            </div>
          </div>

          {/* Light/Dark Toggle Mock representing premium dashboard details */}
          <div className="flex flex-col items-center gap-1.5 py-1">
            <div className="relative group flex items-center justify-center">
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
              <div className="absolute left-16 scale-0 group-hover:scale-100 transition-all duration-200 origin-left bg-[#021810] text-[#cbd5e1] border border-[#10b981]/20 text-[10px] font-extrabold px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-xl pointer-events-none z-50">
                Premium Light Mode Active
              </div>
            </div>
            {/* Custom Toggle Switch Capsule */}
            <div className="w-7 h-4 bg-emerald-950 border border-emerald-900 rounded-full p-[2px] cursor-pointer flex items-center justify-start relative shadow-inner">
              <div className="w-3.5 h-3.5 bg-white rounded-full shadow-sm transform translate-x-2.5 transition-transform"></div>
            </div>
          </div>

          {/* Sign Out Button */}
          <div className="relative group flex items-center justify-center">
            <button
              onClick={handleLogout}
              className="w-11 h-11 flex items-center justify-center rounded-xl text-red-400/80 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
              id="btn-signout"
            >
              <LogOut className="w-5 h-5" />
            </button>
            <div className="absolute left-16 scale-0 group-hover:scale-100 transition-all duration-200 origin-left bg-red-950 text-red-200 border border-red-900/30 text-[10px] font-extrabold px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-xl pointer-events-none z-50">
              {uiTexts.signout}
            </div>
          </div>

          {/* User Account with Slide out detail card */}
          <div className="relative group mt-1">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt="Profile"
                className="w-10 h-10 rounded-2xl border-2 border-emerald-500/30 object-cover shadow-md hover:border-emerald-400 cursor-pointer transition-all duration-300"
                referrerPolicy="no-referrer"
              />
            ) : (
              <img
                src="https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=150&q=80"
                alt="Premium User"
                className="w-10 h-10 rounded-2xl border-2 border-emerald-500/30 object-cover shadow-md transition-all duration-300 hover:border-emerald-400 cursor-pointer"
                referrerPolicy="no-referrer"
              />
            )}
            <div className="absolute left-16 bottom-0 scale-0 group-hover:scale-100 transition-all duration-200 origin-left bg-[#021810] text-white border border-[#10b981]/20 p-3 rounded-2xl shadow-2xl pointer-events-none z-50 min-w-[180px]">
              <p className="font-black text-[9px] text-emerald-400 tracking-wider uppercase mb-1">Active Portal Admin</p>
              <p className="text-xs font-bold text-slate-200 truncate">{user?.displayName || 'Rathi Build Mart'}</p>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">{user?.email}</p>
            </div>
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
              {spreadsheetId || 'None'}
            </span>
          </div>

          {/* Controls Area */}
          <div className="flex items-center gap-3">
            
            {/* Sync Badge */}
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${
              syncStatus === 'synced' 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : syncStatus === 'syncing' 
                  ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              <span className={`w-1 h-1 rounded-full ${
                syncStatus === 'synced' 
                  ? 'bg-green-500 animate-pulse' 
                  : syncStatus === 'syncing' 
                    ? 'bg-amber-500 animate-spin border border-t-transparent border-amber-800' 
                    : 'bg-red-500'
              }`}></span>
              {syncStatus === 'synced' ? uiTexts.synced : syncStatus === 'syncing' ? uiTexts.syncing : uiTexts.syncError}
            </span>

            {/* Force Refresh */}
            <button
              onClick={() => token && loadApplicationData(token)}
              disabled={isLoadingData}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded border border-gray-200 shadow-xxs bg-white cursor-pointer transition-all"
              title={uiTexts.refresh}
              id="refresh-data"
            >
              <RefreshCw className={`w-3 h-3 ${isLoadingData ? 'animate-spin text-blue-600' : ''}`} />
            </button>
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
            <div className="max-w-[1500px] mx-auto">
              {currentTab === 'dashboard' && (
                <Dashboard 
                  employees={employees} 
                  attendance={attendance} 
                  payroll={payroll} 
                  language={language} 
                  onNavigate={setCurrentTab}
                />
              )}
              {currentTab === 'employees' && (
                <EmployeeList 
                  employees={employees} 
                  onAddEmployee={handleAddEmployee} 
                  onUpdateEmployee={handleUpdateEmployee} 
                  onBulkAddEmployees={handleBulkAddEmployees}
                  language={language} 
                  adminSettings={adminSettings}
                />
              )}
              {currentTab === 'attendance' && (
                <AttendanceTracker 
                  employees={employees} 
                  attendanceRecords={attendance} 
                  onSaveAttendance={handleSaveAttendance} 
                  language={language} 
                />
              )}
              {currentTab === 'payroll' && (
                <PayrollCalculator 
                  employees={employees} 
                  attendanceRecords={attendance} 
                  payrollRecords={payroll} 
                  onSavePayroll={handleSavePayroll} 
                  onUpdateEmployees={handleBulkAddEmployees}
                  language={language} 
                />
              )}
              {currentTab === 'admin' && (
                <Settings 
                  settings={adminSettings}
                  onSaveSettings={handleSaveSettings}
                  language={language}
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

    </div>
  );
}
