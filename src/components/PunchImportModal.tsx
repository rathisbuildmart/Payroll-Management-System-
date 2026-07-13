import React, { useState, useRef } from 'react';
import { 
  X, FileSpreadsheet, Upload, AlertCircle, CheckCircle, Info, RefreshCw, ChevronRight, HelpCircle 
} from 'lucide-react';
import { Employee, Attendance, AdminSettings } from '../types';
import { 
  getShiftTimings, 
  getHalfDayCheckOut, 
  getShiftDurationHours 
} from '../utils/shift';

interface PunchImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  onImportComplete: (records: Attendance[]) => Promise<void>;
  language: 'en' | 'hi';
  adminSettings?: AdminSettings;
}

export default function PunchImportModal({
  isOpen,
  onClose,
  employees,
  onImportComplete,
  language,
  adminSettings
}: PunchImportModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Upload, 2: Map, 3: Preview
  const [fileContent, setFileContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [error, setError] = useState<string>('');
  
  // CSV Raw Rows
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  
  // Column Mapping
  const [mapEmpId, setMapEmpId] = useState<number>(-1);
  const [mapDate, setMapDate] = useState<number>(-1);
  const [mapCheckIn, setMapCheckIn] = useState<number>(-1);
  const [mapCheckOut, setMapCheckOut] = useState<number>(-1);
  
  // Parsed and previewed records
  const [parsedRecords, setParsedRecords] = useState<Attendance[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const t = {
    en: {
      modalTitle: "Import Punch Machine Data",
      modalSub: "Upload weekly or monthly attendance reports directly from biometric devices",
      step1: "1. Upload File",
      step2: "2. Map Columns",
      step3: "3. Review & Import",
      dragDropText: "Drag and drop your biometric CSV / TXT file here, or click to browse",
      sampleCsvTip: "Tip: Most punch machines export CSV or TXT sheets containing Employee ID, Date, In Time and Out Time.",
      selectCols: "Map CSV Columns to Portal Fields",
      selectColsSub: "Select which columns in your punch machine file match the required system fields.",
      colEmpId: "Employee ID (e.g. EMP001)",
      colDate: "Punch Date (e.g. 13-07-2026 or 2026-07-13)",
      colCheckIn: "Check-In / Swipe In Time",
      colCheckOut: "Check-Out / Swipe Out Time (Optional)",
      previewTitle: "Verify Parsed Punch Logs",
      previewSub: "Review the matching employees and punch timings before final sync.",
      totalRecords: "Total rows parsed:",
      matchedEmp: "Matched Employees:",
      matchedDates: "Date Range:",
      btnNext: "Next Step",
      btnBack: "Back",
      btnImport: "Import & Sync Records",
      btnImporting: "Syncing with Firestore...",
      colTableEmp: "Employee",
      colTableDate: "Date",
      colTableIn: "In Time",
      colTableOut: "Out Time",
      colTableStatus: "Status",
      colTableOT: "Overtime (Hrs)",
      statusPresent: "Present",
      statusMissPunch: "Miss Punch",
      statusInvalid: "Employee Not Found",
      errEmptyFile: "The selected file is empty.",
      errParsing: "Could not parse file. Ensure it is a valid comma, tab or semicolon separated text file.",
      errMapping: "Please select columns for Employee ID and Punch Date to proceed.",
      successMsg: "Weekly punch logs imported and synced successfully!",
    },
    hi: {
      modalTitle: "पंच मशीन डेटा आयात करें",
      modalSub: "बायोमेट्रिक उपकरणों से सीधे साप्ताहिक या मासिक उपस्थिति रिपोर्ट अपलोड करें",
      step1: "1. फ़ाइल अपलोड करें",
      step2: "2. कॉलम मैप करें",
      step3: "3. समीक्षा करें",
      dragDropText: "अपनी बायोमेट्रिक CSV / TXT फ़ाइल को यहाँ खींचें या ब्राउज़ करने के लिए क्लिक करें",
      sampleCsvTip: "सलाह: अधिकांश पंच मशीनें CSV या TXT निर्यात करती हैं जिनमें कर्मचारी आईडी, दिनांक, आने का समय और जाने का समय होता है।",
      selectCols: "CSV कॉलम को पोर्टल फ़ील्ड से मैप करें",
      selectColsSub: "चुनें कि आपकी फ़ाइल के कौन से कॉलम आवश्यक सिस्टम फ़ील्ड से मेल खाते हैं।",
      colEmpId: "कर्मचारी आईडी (जैसे EMP001)",
      colDate: "पंच दिनांक (जैसे 13-07-2026 या 2026-07-13)",
      colCheckIn: "चेक-इन / आने का समय",
      colCheckOut: "चेक-आउट / जाने का समय (वैकल्पिक)",
      previewTitle: "पार्स किए गए पंच लॉग्स सत्यापित करें",
      previewSub: "अंतिम सिंक से पहले मेल खाने वाले कर्मचारियों और समय की समीक्षा करें।",
      totalRecords: "कुल पंक्तियाँ:",
      matchedEmp: "कर्मचारी मिले:",
      matchedDates: "दिनांक सीमा:",
      btnNext: "अगला चरण",
      btnBack: "पीछे",
      btnImport: "आयात करें और सिंक करें",
      btnImporting: "सिंक हो रहा है...",
      colTableEmp: "कर्मचारी",
      colTableDate: "तारीख",
      colTableIn: "आगमन",
      colTableOut: "प्रस्थान",
      colTableStatus: "स्थिति",
      colTableOT: "ओवरटाइम (घंटे)",
      statusPresent: "उपस्थित",
      statusMissPunch: "मिस पंच",
      statusInvalid: "कर्मचारी नहीं मिला",
      errEmptyFile: "चुनी गई फ़ाइल खाली है।",
      errParsing: "फ़ाइल पार्स नहीं की जा सकी। सुनिश्चित करें कि यह वैध CSV, टैब या सेमीकोलन फ़ाइल है।",
      errMapping: "आगे बढ़ने के लिए कृपया कर्मचारी आईडी और पंच तिथि के कॉलम चुनें।",
      successMsg: "साप्ताहिक पंच लॉग सफलतापूर्वक आयात और सिंक किए गए!",
    }
  }[language];

  // Robust Date Parser
  const parseDateRobustly = (raw: string): string => {
    if (!raw) return '';
    const cleaned = raw.trim();
    
    // Matches YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
      return cleaned;
    }
    
    // Matches DD-MM-YYYY or DD/MM/YYYY
    const dmyMatch = cleaned.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
    if (dmyMatch) {
      const day = dmyMatch[1].padStart(2, '0');
      const month = dmyMatch[2].padStart(2, '0');
      const year = dmyMatch[3];
      return `${year}-${month}-${day}`;
    }
    
    // Matches DD-MM-YY or DD/MM/YY
    const dmyShortMatch = cleaned.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2})$/);
    if (dmyShortMatch) {
      const day = dmyShortMatch[1].padStart(2, '0');
      const month = dmyShortMatch[2].padStart(2, '0');
      const year = '20' + dmyShortMatch[3];
      return `${year}-${month}-${day}`;
    }

    // Matches YYYY/MM/DD
    const ymdMatch = cleaned.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
    if (ymdMatch) {
      const year = ymdMatch[1];
      const month = ymdMatch[2].padStart(2, '0');
      const day = ymdMatch[3].padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    return '';
  };

  // Robust Time Parser
  const parseTimeRobustly = (raw: string): string => {
    if (!raw) return '';
    const cleaned = raw.trim();

    // If it has a full timestamp e.g. "13/07/2026 09:15:22" or "2026-07-13 09:15"
    const timeOnlyMatch = cleaned.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?/i);
    if (timeOnlyMatch) {
      let hours = parseInt(timeOnlyMatch[1], 10);
      const minutes = timeOnlyMatch[2].padStart(2, '0');
      const ampm = timeOnlyMatch[4];
      
      if (ampm) {
        if (ampm.toUpperCase() === 'PM' && hours < 12) hours += 12;
        if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
      }
      
      return `${String(hours).padStart(2, '0')}:${minutes}`;
    }

    return '';
  };

  const handleFileLoad = (text: string, name: string) => {
    if (!text || text.trim() === '') {
      setError(t.errEmptyFile);
      return;
    }
    
    setError('');
    setFileName(name);
    setFileContent(text);

    // Auto-detect separator
    const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line !== '');
    if (lines.length === 0) {
      setError(t.errEmptyFile);
      return;
    }

    const firstLine = lines[0];
    const commas = (firstLine.match(/,/g) || []).length;
    const semicolons = (firstLine.match(/;/g) || []).length;
    const tabs = (firstLine.match(/\t/g) || []).length;

    let sep = ',';
    if (tabs > commas && tabs > semicolons) sep = '\t';
    else if (semicolons > commas && semicolons > tabs) sep = ';';

    // Parse CSV rows safely keeping quotes in mind
    const parsedRows: string[][] = [];
    
    lines.forEach(line => {
      let cols: string[] = [];
      if (sep === '\t') {
        cols = line.split('\t');
      } else if (sep === ';') {
        cols = line.split(';');
      } else {
        // Regex to parse comma separated values respecting double quotes
        const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
        cols = matches.map(val => val.replace(/^"|"$/g, '').trim());
      }
      parsedRows.push(cols);
    });

    if (parsedRows.length === 0) {
      setError(t.errParsing);
      return;
    }

    const headerCols = parsedRows[0];
    setHeaders(headerCols);
    setRows(parsedRows.slice(1));

    // Guess column indices based on header names
    let empIdIdx = -1;
    let dateIdx = -1;
    let checkInIdx = -1;
    let checkOutIdx = -1;

    headerCols.forEach((h, i) => {
      const lower = h.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (['empid', 'id', 'employeeid', 'card', 'no', 'code', 'member', 'emp'].some(keyword => lower.includes(keyword))) {
        if (empIdIdx === -1) empIdIdx = i;
      }
      if (['date', 'punchdate', 'workdate', 'day', 'attendance', 'date'].some(keyword => lower.includes(keyword))) {
        if (dateIdx === -1) dateIdx = i;
      }
      if (['checkin', 'intime', 'timein', 'in', 'punchin', 'swipe1', 'start'].some(keyword => lower.includes(keyword))) {
        if (checkInIdx === -1) checkInIdx = i;
      }
      if (['checkout', 'outtime', 'timeout', 'out', 'punchout', 'swipe2', 'end'].some(keyword => lower.includes(keyword))) {
        if (checkOutIdx === -1) checkOutIdx = i;
      }
    });

    // If still undecided, use default first few indices
    setMapEmpId(empIdIdx !== -1 ? empIdIdx : 0);
    setMapDate(dateIdx !== -1 ? dateIdx : 1);
    setMapCheckIn(checkInIdx !== -1 ? checkInIdx : 2);
    setMapCheckOut(checkOutIdx !== -1 ? checkOutIdx : (headerCols.length > 3 ? 3 : -1));

    setStep(2);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      handleFileLoad(text, file.name);
    };
    reader.readAsText(file);
  };

  // Drag and Drop support
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      handleFileLoad(text, file.name);
    };
    reader.readAsText(file);
  };

  const proceedToPreview = () => {
    if (mapEmpId === -1 || mapDate === -1) {
      setError(t.errMapping);
      return;
    }

    setError('');
    
    // Group records by Employee ID and Date to merge duplicates if necessary
    // Some machines write checkIn and checkOut as separate rows, or write multiple swipe logs
    const punchLogsGrouped: { [key: string]: { checkInRaw: string; checkOutRaw: string; empId: string; dateStr: string } } = {};

    rows.forEach(row => {
      const rawEmpId = row[mapEmpId]?.trim();
      const rawDate = row[mapDate]?.trim();
      if (!rawEmpId || !rawDate) return;

      const parsedDate = parseDateRobustly(rawDate);
      if (!parsedDate) return;

      // Match Employee cleanly (fuzzy match or exact)
      const matchedEmp = employees.find(e => 
        e.id.trim().toLowerCase() === rawEmpId.toLowerCase() || 
        // Handles cases where excel exports numeric ID e.g. "1" but employee ID is "EMP001"
        e.id.trim().toLowerCase().replace(/^emp0*/, '') === rawEmpId.toLowerCase().replace(/^0*/, '')
      );

      const empId = matchedEmp ? matchedEmp.id : rawEmpId;

      const key = `${empId}_${parsedDate}`;
      const rawIn = mapCheckIn !== -1 ? row[mapCheckIn]?.trim() : '';
      const rawOut = mapCheckOut !== -1 ? row[mapCheckOut]?.trim() : '';

      const checkInParsed = parseTimeRobustly(rawIn);
      const checkOutParsed = parseTimeRobustly(rawOut);

      if (!punchLogsGrouped[key]) {
        punchLogsGrouped[key] = {
          empId,
          dateStr: parsedDate,
          checkInRaw: checkInParsed,
          checkOutRaw: checkOutParsed
        };
      } else {
        // If row already exists, merge swipe times intelligently
        if (checkInParsed) {
          if (!punchLogsGrouped[key].checkInRaw || checkInParsed < punchLogsGrouped[key].checkInRaw) {
            punchLogsGrouped[key].checkInRaw = checkInParsed;
          }
        }
        if (checkOutParsed) {
          if (!punchLogsGrouped[key].checkOutRaw || checkOutParsed > punchLogsGrouped[key].checkOutRaw) {
            punchLogsGrouped[key].checkOutRaw = checkOutParsed;
          }
        }
      }
    });

    // Create final Attendance list and calculate Overtime
    const finalAttendanceRecords: Attendance[] = [];

    Object.values(punchLogsGrouped).forEach(log => {
      const emp = employees.find(e => e.id === log.empId);
      
      let status: Attendance['status'] = 'Present';
      let checkIn = log.checkInRaw;
      let checkOut = log.checkOutRaw;
      let overtimeHours = 0;

      // If no checkIn but checkOut exists, or checkIn but no checkOut -> Miss Punch
      if (checkIn && !checkOut) {
        status = 'Miss Punch';
      } else if (!checkIn && checkOut) {
        checkIn = checkOut;
        checkOut = '';
        status = 'Miss Punch';
      } else if (!checkIn && !checkOut) {
        status = 'Absent';
      }

      // Calculate Overtime automatically
      if (emp && status === 'Present' && checkIn && checkOut) {
        const timings = getShiftTimings(emp.workTiming, adminSettings?.defaultCheckIn || '09:00', adminSettings?.defaultCheckOut || '18:00');
        const regularHours = getShiftDurationHours(timings.checkIn, timings.checkOut);

        const [inH, inM] = checkIn.split(':').map(Number);
        const [outH, outM] = checkOut.split(':').map(Number);

        if (!isNaN(inH) && !isNaN(outH)) {
          let totalHours = (outH + outM / 60) - (inH + inM / 60);
          if (totalHours < 0) totalHours += 24; // overnight shift

          if (totalHours > regularHours) {
            const calculatedOvertime = Math.round((totalHours - regularHours) * 10) / 10;
            overtimeHours = Math.max(0, calculatedOvertime);
          }
        }
      }

      finalAttendanceRecords.push({
        date: log.dateStr,
        employeeId: log.empId,
        status,
        checkIn,
        checkOut,
        overtimeHours,
        remarks: language === 'en' ? 'Punch Machine Imported' : 'पंच मशीन से आयातित',
        approvalStatus: status === 'Miss Punch' ? 'Pending' : 'Approved'
      });
    });

    // Sort by date then employeeId
    finalAttendanceRecords.sort((a, b) => a.date.localeCompare(b.date) || a.employeeId.localeCompare(b.employeeId));

    setParsedRecords(finalAttendanceRecords);
    setStep(3);
  };

  const handleImportSave = async () => {
    setIsSubmitting(true);
    try {
      await onImportComplete(parsedRecords);
      onClose();
      // Reset State
      setStep(1);
      setParsedRecords([]);
      setFileName('');
      setFileContent('');
    } catch (err) {
      console.error(err);
      setError('Import failed. Please check Google Sheets Sync permissions.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-[#03623c] text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-green-300" />
              {t.modalTitle}
            </h3>
            <p className="text-xs text-green-100 font-medium">{t.modalSub}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors cursor-pointer text-green-100 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Steps indicator */}
        <div className="bg-gray-50 border-b border-gray-100 px-6 py-3 flex gap-4 md:gap-8 justify-center">
          <div className={`text-xs font-bold flex items-center gap-1.5 ${step === 1 ? 'text-[#03623c]' : 'text-gray-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${step === 1 ? 'bg-[#03623c] text-white' : 'bg-gray-200 text-gray-500'}`}>1</span>
            <span>{t.step1}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 self-center hidden sm:block" />
          
          <div className={`text-xs font-bold flex items-center gap-1.5 ${step === 2 ? 'text-[#03623c]' : 'text-gray-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${step === 2 ? 'bg-[#03623c] text-white' : 'bg-gray-200 text-gray-500'}`}>2</span>
            <span>{t.step2}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 self-center hidden sm:block" />
          
          <div className={`text-xs font-bold flex items-center gap-1.5 ${step === 3 ? 'text-[#03623c]' : 'text-gray-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${step === 3 ? 'bg-[#03623c] text-white' : 'bg-gray-200 text-gray-500'}`}>3</span>
            <span>{t.step3}</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 min-h-[300px]">
          
          {error && (
            <div className="mb-4 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-semibold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: UPLOAD */}
          {step === 1 && (
            <div className="space-y-6">
              <div 
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-200 hover:border-[#03623c] bg-gray-50/50 hover:bg-green-50/10 rounded-2xl p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-4 group"
              >
                <div className="p-4 bg-green-50 rounded-full text-[#03623c] group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">{t.dragDropText}</p>
                  <p className="text-xs text-gray-400 mt-1 font-medium">{language === 'en' ? "Supports CSV or TXT file exports" : "CSV या TXT फ़ाइल एक्सपोर्ट्स का समर्थन करता है"}</p>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload}
                  accept=".csv,.txt"
                  className="hidden" 
                />
              </div>

              <div className="p-4 bg-amber-50/50 border border-amber-200/50 rounded-2xl flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800 leading-relaxed font-semibold">
                  {t.sampleCsvTip}
                  <div className="mt-2 text-[10px] text-amber-700 bg-white/70 px-3 py-2 rounded-lg font-mono border border-amber-100">
                    Employee ID, Date, In Time, Out Time<br />
                    EMP001, 13-07-2026, 09:12, 18:05<br />
                    EMP002, 13-07-2026, 09:30, 18:15
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: COLUMN MAPPING */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h4 className="text-base font-bold text-gray-800 tracking-tight">{t.selectCols}</h4>
                <p className="text-xs text-gray-400 font-medium">{t.selectColsSub}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Employee ID Mapping */}
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col gap-2">
                  <label className="text-xs font-bold text-gray-700">{t.colEmpId}</label>
                  <select
                    value={mapEmpId}
                    onChange={(e) => setMapEmpId(Number(e.target.value))}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 font-semibold focus:outline-none"
                  >
                    <option value={-1}>-- Select Column --</option>
                    {headers.map((h, idx) => (
                      <option key={idx} value={idx}>{h} (Col {idx + 1})</option>
                    ))}
                  </select>
                </div>

                {/* Date Mapping */}
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col gap-2">
                  <label className="text-xs font-bold text-gray-700">{t.colDate}</label>
                  <select
                    value={mapDate}
                    onChange={(e) => setMapDate(Number(e.target.value))}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 font-semibold focus:outline-none"
                  >
                    <option value={-1}>-- Select Column --</option>
                    {headers.map((h, idx) => (
                      <option key={idx} value={idx}>{h} (Col {idx + 1})</option>
                    ))}
                  </select>
                </div>

                {/* Check In Time Mapping */}
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col gap-2">
                  <label className="text-xs font-bold text-gray-700">{t.colCheckIn}</label>
                  <select
                    value={mapCheckIn}
                    onChange={(e) => setMapCheckIn(Number(e.target.value))}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 font-semibold focus:outline-none"
                  >
                    <option value={-1}>-- Select Column --</option>
                    {headers.map((h, idx) => (
                      <option key={idx} value={idx}>{h} (Col {idx + 1})</option>
                    ))}
                  </select>
                </div>

                {/* Check Out Time Mapping */}
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col gap-2">
                  <label className="text-xs font-bold text-gray-700">{t.colCheckOut}</label>
                  <select
                    value={mapCheckOut}
                    onChange={(e) => setMapCheckOut(Number(e.target.value))}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 font-semibold focus:outline-none"
                  >
                    <option value={-1}>-- Select Column (Optional) --</option>
                    {headers.map((h, idx) => (
                      <option key={idx} value={idx}>{h} (Col {idx + 1})</option>
                    ))}
                  </select>
                </div>

              </div>

              {/* Sample First Row Review */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <HelpCircle className="w-4 h-4 text-gray-400" />
                  {language === 'en' ? "Sample data preview (First row):" : "डेटा पूर्वावलोकन (पहली पंक्ति):"}
                </h5>
                <div className="overflow-x-auto text-xs font-mono bg-white p-3 rounded-xl border border-gray-200/60 leading-relaxed text-gray-600">
                  {headers.map((h, idx) => {
                    const sampleVal = rows[0]?.[idx] || '—';
                    return (
                      <div key={idx} className="flex py-1 border-b border-gray-50 last:border-0 justify-between">
                        <span className="font-bold text-gray-700">{h}:</span>
                        <span className="text-[#03623c] font-semibold">{sampleVal}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PREVIEW & REVIEW */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h4 className="text-base font-bold text-gray-800 tracking-tight">{t.previewTitle}</h4>
                  <p className="text-xs text-gray-400 font-medium">{t.previewSub}</p>
                </div>
                
                {/* Micro Stats */}
                <div className="flex gap-4 text-xs font-bold text-gray-600">
                  <div className="bg-gray-100 px-3 py-1.5 rounded-lg">
                    {t.totalRecords} <span className="text-gray-900 font-black">{parsedRecords.length}</span>
                  </div>
                  <div className="bg-green-50 text-[#03623c] px-3 py-1.5 rounded-lg">
                    {t.matchedEmp} <span className="font-black">{parsedRecords.filter(r => employees.some(e => e.id === r.employeeId)).length}</span>
                  </div>
                </div>
              </div>

              {/* Live Preview Grid */}
              <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-3xs max-h-[350px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                      <th className="py-3 px-4">{t.colTableEmp}</th>
                      <th className="py-3 px-4 text-center">{t.colTableDate}</th>
                      <th className="py-3 px-4 text-center">{t.colTableIn}</th>
                      <th className="py-3 px-4 text-center">{t.colTableOut}</th>
                      <th className="py-3 px-4 text-center">{t.colTableOT}</th>
                      <th className="py-3 px-4 text-center">{t.colTableStatus}</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs divide-y divide-gray-100">
                    {parsedRecords.map((rec, idx) => {
                      const emp = employees.find(e => e.id === rec.employeeId);
                      const isValid = !!emp;

                      return (
                        <tr key={idx} className={`hover:bg-gray-50/50 ${!isValid ? 'bg-red-50/20' : ''}`}>
                          <td className="py-3 px-4">
                            {isValid ? (
                              <div>
                                <div className="font-semibold text-gray-900">{emp.name}</div>
                                <div className="text-[10px] text-gray-400 font-mono font-bold uppercase">{rec.employeeId}</div>
                              </div>
                            ) : (
                              <div className="text-red-600 font-extrabold flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>{rec.employeeId} ({t.statusInvalid})</span>
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-semibold text-gray-700">{rec.date}</td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-gray-600">{rec.checkIn || '—'}</td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-gray-600">{rec.checkOut || '—'}</td>
                          <td className="py-3 px-4 text-center">
                            {rec.overtimeHours > 0 ? (
                              <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded font-black">{rec.overtimeHours}h</span>
                            ) : '—'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {rec.status === 'Present' && (
                              <span className="bg-green-50 text-green-700 px-2 py-1 rounded-full font-black text-[10px] uppercase">{t.statusPresent}</span>
                            )}
                            {rec.status === 'Miss Punch' && (
                              <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded-full font-black text-[10px] uppercase">{t.statusMissPunch}</span>
                            )}
                            {rec.status === 'Absent' && (
                              <span className="bg-red-50 text-red-600 px-2 py-1 rounded-full font-black text-[10px] uppercase">Absent</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Footer controls */}
        <div className="bg-gray-50 border-t border-gray-100 px-6 py-4 flex justify-between gap-3">
          {step > 1 ? (
            <button
              onClick={() => setStep((step - 1) as any)}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              {t.btnBack}
            </button>
          ) : (
            <div />
          )}

          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-200 hover:bg-gray-100 text-gray-500 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              {language === 'en' ? 'Cancel' : 'रद्द करें'}
            </button>
            
            {step === 1 && (
              <button
                onClick={() => proceedToPreview()}
                disabled={!fileContent}
                className="px-5 py-2 bg-[#03623c] hover:bg-[#024e2f] text-white text-xs font-black rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-3xs"
              >
                {t.btnNext}
              </button>
            )}

            {step === 2 && (
              <button
                onClick={() => proceedToPreview()}
                className="px-5 py-2 bg-[#03623c] hover:bg-[#024e2f] text-white text-xs font-black rounded-xl transition-all shadow-3xs"
              >
                {t.btnNext}
              </button>
            )}

            {step === 3 && (
              <button
                onClick={handleImportSave}
                disabled={isSubmitting || parsedRecords.length === 0}
                className="px-5 py-2 bg-[#03623c] hover:bg-[#024e2f] text-white text-xs font-black rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{t.btnImporting}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>{t.btnImport}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
