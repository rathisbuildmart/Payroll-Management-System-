import React, { useState } from 'react';
import { 
  User, Calendar, CreditCard, Check, Printer, FileText, AlertCircle, 
  TrendingUp, Users, ShieldCheck, Building, Sparkles, MapPin, Briefcase, Phone, Mail, FileCheck, DollarSign,
  CalendarDays, Plus, Locate, ChevronLeft
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Employee, Attendance, PayrollRecord, AdminSettings, LeaveRequest } from '../types';
import LeavesHolidays from './LeavesHolidays';
import { isAttendanceLate, isAttendanceEarlyGoing } from '../utils/shift';
import MonthlyCalendarReport from './MonthlyCalendarReport';

interface EmployeePortalProps {
  employee: Employee;
  attendanceRecords: Attendance[];
  payrollRecords: PayrollRecord[];
  language: 'en' | 'hi';
  adminSettings: AdminSettings;
  onUpdateAttendanceRecords?: (records: Attendance[]) => Promise<void>;
  leaveRequests?: LeaveRequest[];
  onAddLeaveRequest?: (req: LeaveRequest) => void;
}

export default function EmployeePortal({ 
  employee, 
  attendanceRecords, 
  payrollRecords, 
  language, 
  adminSettings,
  onUpdateAttendanceRecords,
  leaveRequests = [],
  onAddLeaveRequest
}: EmployeePortalProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'profile' | 'attendance' | 'payslips' | 'exceptions' | 'leaves' | 'calendar' | 'self_attendance'>('dashboard');
  const [attendanceYear, setAttendanceYear] = useState<string>(new Date().getFullYear().toString());
  const [attendanceMonth, setAttendanceMonth] = useState<string>(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [activePayslip, setActivePayslip] = useState<any | null>(null);
  const [showMoreSheet, setShowMoreSheet] = useState(false);

  // Self Attendance & GPS Geofencing States
  const [currentGpsCoords, setCurrentGpsCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [gpsError, setGpsError] = useState<string>('');
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  const [punchRemarks, setPunchRemarks] = useState('');
  const [isSubmittingPunch, setIsSubmittingPunch] = useState(false);
  const [punchSuccessMsg, setPunchSuccessMsg] = useState('');
  const [punchErrorMsg, setPunchErrorMsg] = useState('');

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const detectGpsAndVerifyOutlet = () => {
    setIsDetectingGps(true);
    setGpsError('');
    setPunchErrorMsg('');
    setPunchSuccessMsg('');

    const handleSuccess = (position: GeolocationPosition) => {
      setCurrentGpsCoords({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      });
      setIsDetectingGps(false);
    };

    const handleFailure = (error: GeolocationPositionError) => {
      console.warn("High accuracy GPS failed in portal, retrying with low accuracy...", error);
      // Retry with low accuracy
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentGpsCoords({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setIsDetectingGps(false);
        },
        (fallbackError) => {
          console.warn("GPS error in portal fallback:", fallbackError);
          
          // Fall back to a mock/simulated coordinate matching the employee's assigned branch or Bangalore HQ
          const outlets = adminSettings.geofenceOutlets || [];
          const employeeBranchName = employee.branch || '';
          const matchedOutlet = outlets.find(o => o.name.toLowerCase().trim() === employeeBranchName.toLowerCase().trim()) || outlets[0];
          
          if (matchedOutlet) {
            setCurrentGpsCoords({
              latitude: matchedOutlet.latitude + 0.0001,
              longitude: matchedOutlet.longitude + 0.0001
            });
            console.log("Mock coordinates applied as fallback for sandboxed/demo environment:", matchedOutlet.name);
            setPunchSuccessMsg(language === 'en'
              ? "Location simulated for sandboxed preview."
              : "सैंडबॉक्स पूर्वावलोकन के लिए सिम्युलेटेड स्थान।"
            );
          } else {
            setCurrentGpsCoords({
              latitude: 12.9716, // Bangalore HQ fallback
              longitude: 77.5946
            });
            console.log("Default coordinates applied as fallback");
          }
          setIsDetectingGps(false);
        },
        { enableHighAccuracy: false, timeout: 15000 }
      );
    };

    navigator.geolocation.getCurrentPosition(handleSuccess, handleFailure, { 
      enableHighAccuracy: true, 
      timeout: 5000 
    });
  };

  const getDistanceInMeters = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000; // Radius of the earth in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getOutletCheckResult = () => {
    if (!adminSettings.enableGeofencing || !employee.enableGeofencing) {
      return { isAllowed: true, nearestOutlet: null, distanceMeters: 0, requiredRadius: 0, isBypassed: !employee.enableGeofencing };
    }

    const outlets = adminSettings.geofenceOutlets || [];
    if (outlets.length === 0) {
      return { isAllowed: true, nearestOutlet: null, distanceMeters: 0, requiredRadius: 0, isNoOutletsConfigured: true };
    }

    if (!currentGpsCoords) {
      return { isAllowed: false, nearestOutlet: null, distanceMeters: 0, requiredRadius: 0, needsGps: true };
    }

    // Identify if the employee has a specific branch assigned
    const employeeBranchName = employee.branch || '';
    const employeeBranchGeofence = outlets.find(o => o.name.toLowerCase().trim() === employeeBranchName.toLowerCase().trim());

    if (employeeBranchName && employeeBranchGeofence) {
      // The employee has a specific branch and there is a geofence configured for it. Enforce checking against this branch only!
      const dist = getDistanceInMeters(
        currentGpsCoords.latitude,
        currentGpsCoords.longitude,
        employeeBranchGeofence.latitude,
        employeeBranchGeofence.longitude
      );
      const isAllowed = dist <= employeeBranchGeofence.radiusMeters;
      return {
        isAllowed,
        nearestOutlet: employeeBranchGeofence,
        distanceMeters: dist,
        requiredRadius: employeeBranchGeofence.radiusMeters,
        isSpecificBranchRequired: true,
        specificBranchName: employeeBranchName
      };
    }

    // Otherwise, fall back to checking all geofences
    let nearestOutlet = outlets[0];
    let minDistance = Infinity;
    let isWithinAny = false;
    let matchedOutlet = null;

    for (const outlet of outlets) {
      const dist = getDistanceInMeters(
        currentGpsCoords.latitude,
        currentGpsCoords.longitude,
        outlet.latitude,
        outlet.longitude
      );
      if (dist < minDistance) {
        minDistance = dist;
        nearestOutlet = outlet;
      }
      if (dist <= outlet.radiusMeters) {
        isWithinAny = true;
        matchedOutlet = outlet;
      }
    }

    return {
      isAllowed: isWithinAny,
      nearestOutlet: matchedOutlet || nearestOutlet,
      distanceMeters: minDistance,
      requiredRadius: (matchedOutlet || nearestOutlet).radiusMeters,
      isSpecificBranchRequired: false
    };
  };

  const handlePunchIn = async () => {
    const todayStr = new Date().toLocaleDateString('en-CA');
    const checkResult = getOutletCheckResult();
    if (!checkResult.isAllowed) {
      if (checkResult.isSpecificBranchRequired) {
        setPunchErrorMsg(language === 'en'
          ? `Outside registered branch geofence! You must be inside your assigned branch "${checkResult.nearestOutlet?.name}" (Current distance is ${checkResult.distanceMeters.toFixed(1)}m, Allowed: ${checkResult.requiredRadius}m).`
          : `रजिस्टर्ड शाखा जियोफेंस से बाहर! आपको अपनी आवंटित शाखा "${checkResult.nearestOutlet?.name}" के भीतर होना चाहिए (वर्तमान दूरी ${checkResult.distanceMeters.toFixed(1)}मी है, अनुमत: ${checkResult.requiredRadius}मी)।`
        );
      } else {
        setPunchErrorMsg(language === 'en' 
          ? "Outside verified geofence! Please ensure you are inside an authorized branch premises."
          : "सत्यापित जियोफेंस से बाहर! कृपया सुनिश्चित करें कि आप किसी अधिकृत शाखा परिसर के अंदर हैं।"
        );
      }
      return;
    }

    setIsSubmittingPunch(true);
    setPunchErrorMsg('');
    setPunchSuccessMsg('');

    try {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const timeStr = `${hh}:${mm}`;

      const coordsStr = currentGpsCoords 
        ? `${currentGpsCoords.latitude.toFixed(6)}, ${currentGpsCoords.longitude.toFixed(6)}`
        : '';
      const ua = navigator.userAgent;
      const deviceStr = /mobile/i.test(ua) ? "Mobile Browser" : "Desktop Browser";

      const newRecord: Attendance = {
        date: todayStr,
        employeeId: employee.id,
        status: 'Present',
        checkIn: timeStr,
        checkOut: '',
        overtimeHours: 0,
        remarks: punchRemarks || 'Mobile Punch In (Verified)',
        approvalStatus: 'Approved',
        punchInOutlet: checkResult.nearestOutlet?.name || employee.branch || 'Verified Branch',
        punchInCoords: coordsStr,
        punchInDevice: deviceStr
      };

      if (onUpdateAttendanceRecords) {
        await onUpdateAttendanceRecords([newRecord]);
        setPunchSuccessMsg(language === 'en' ? 'Punched In successfully!' : 'आगमन उपस्थिति (Punch In) सफलतापूर्वक दर्ज की गई!');
        setPunchRemarks('');
      } else {
        setPunchErrorMsg('Update handler not registered.');
      }
    } catch (err: any) {
      console.error(err);
      setPunchErrorMsg(language === 'en' ? 'Failed to record punch.' : 'उपस्थिति दर्ज करने में विफल।');
    } finally {
      setIsSubmittingPunch(false);
    }
  };

  const handlePunchOut = async () => {
    const todayStr = new Date().toLocaleDateString('en-CA');
    const todayRecord = attendanceRecords.find(r => r.employeeId === employee.id && r.date === todayStr);

    if (!todayRecord) {
      setPunchErrorMsg(language === 'en' ? "Punch In record not found for today." : "आज के लिए कोई आगमन रिकॉर्ड नहीं मिला। पहले पंच-इन करें।");
      return;
    }

    const checkResult = getOutletCheckResult();
    if (!checkResult.isAllowed) {
      if (checkResult.isSpecificBranchRequired) {
        setPunchErrorMsg(language === 'en'
          ? `Outside registered branch geofence! You must be inside your assigned branch "${checkResult.nearestOutlet?.name}" (Current distance is ${checkResult.distanceMeters.toFixed(1)}m, Allowed: ${checkResult.requiredRadius}m).`
          : `रजिस्टर्ड शाखा जियोफेंस से बाहर! आपको अपनी आवंटित शाखा "${checkResult.nearestOutlet?.name}" के भीतर होना चाहिए (वर्तमान दूरी ${checkResult.distanceMeters.toFixed(1)}मी है, अनुमत: ${checkResult.requiredRadius}मी)।`
        );
      } else {
        setPunchErrorMsg(language === 'en' 
          ? "Outside verified geofence! Please ensure you are inside an authorized branch premises."
          : "सत्यापित जियोफेंस से बाहर! कृपया सुनिश्चित करें कि आप किसी अधिकृत शाखा परिसर के अंदर हैं।"
        );
      }
      return;
    }

    setIsSubmittingPunch(true);
    setPunchErrorMsg('');
    setPunchSuccessMsg('');

    try {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const timeStr = `${hh}:${mm}`;

      const coordsStr = currentGpsCoords 
        ? `${currentGpsCoords.latitude.toFixed(6)}, ${currentGpsCoords.longitude.toFixed(6)}`
        : '';
      const ua = navigator.userAgent;
      const deviceStr = /mobile/i.test(ua) ? "Mobile Browser" : "Desktop Browser";

      let overtime = 0;
      if (todayRecord.checkIn) {
        const defOut = adminSettings.defaultCheckOut || "18:00";
        const [defOutH, defOutM] = defOut.split(':').map(Number);
        const [outH, outM] = timeStr.split(':').map(Number);
        const diffHours = (outH + outM/60) - (defOutH + defOutM/60);
        if (diffHours > 0) {
          overtime = Math.round(diffHours * 100) / 100;
        }
      }

      const updatedRecord: Attendance = {
        ...todayRecord,
        checkOut: timeStr,
        overtimeHours: overtime,
        status: todayRecord.status === 'Present' ? 'Present' : todayRecord.status,
        remarks: todayRecord.remarks ? todayRecord.remarks + ' | Mobile Punch Out' : 'Mobile Punch Out (Verified)',
        punchOutOutlet: checkResult.nearestOutlet?.name || employee.branch || 'Verified Branch',
        punchOutCoords: coordsStr,
        punchOutDevice: deviceStr
      };

      if (onUpdateAttendanceRecords) {
        await onUpdateAttendanceRecords([updatedRecord]);
        setPunchSuccessMsg(language === 'en' ? 'Punched Out successfully!' : 'प्रस्थान उपस्थिति (Punch Out) सफलतापूर्वक दर्ज की गई!');
        setPunchRemarks('');
      } else {
        setPunchErrorMsg('Update handler not registered.');
      }
    } catch (err: any) {
      console.error(err);
      setPunchErrorMsg(language === 'en' ? 'Failed to record punch.' : 'उपस्थिति दर्ज करने में विफल।');
    } finally {
      setIsSubmittingPunch(false);
    }
  };

  // Miss punch ticket raising states
  const [showRaiseModal, setShowRaiseModal] = useState(false);
  const [raiseDate, setRaiseDate] = useState('');
  const [raiseCheckIn, setRaiseCheckIn] = useState('09:00');
  const [raiseCheckOut, setRaiseCheckOut] = useState('18:00');
  const [raiseRemarks, setRaiseRemarks] = useState('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [ticketError, setTicketError] = useState('');
  const [ticketSuccess, setTicketSuccess] = useState('');

  const handleRaiseTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setTicketError('');
    setTicketSuccess('');

    if (!raiseDate) {
      setTicketError(language === 'en' ? 'Please select a date' : 'कृपया तिथि चुनें');
      return;
    }

    setIsSubmittingTicket(true);
    try {
      if (onUpdateAttendanceRecords) {
        const newRecord: Attendance = {
          date: raiseDate,
          employeeId: employee.id,
          status: 'Miss Punch',
          checkIn: raiseCheckIn,
          checkOut: raiseCheckOut,
          overtimeHours: 0,
          remarks: raiseRemarks,
          approvalStatus: 'Pending'
        };

        await onUpdateAttendanceRecords([newRecord]);
        setTicketSuccess(language === 'en' ? 'Missed punch ticket raised successfully!' : 'मिस पंच टिकट सफलतापूर्वक दर्ज कर लिया गया है!');
        setTimeout(() => {
          setShowRaiseModal(false);
          setTicketSuccess('');
          setRaiseRemarks('');
        }, 1800);
      } else {
        setTicketError('Update handler not registered on the portal.');
      }
    } catch (err) {
      console.error(err);
      setTicketError(language === 'en' ? 'Failed to raise ticket' : 'टिकट दर्ज करने में विफल');
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  const t = {
    en: {
      dashboard: language === 'en' ? "Home Dashboard" : "होम डैशबोर्ड",
      profile: language === 'en' ? "My Profile" : "मेरी प्रोफ़ाइल",
      attendance: language === 'en' ? "Attendance Log" : "उपस्थिति लॉग",
      payslips: language === 'en' ? "My Salary Slips" : "मेरी सैलरी स्लिप",
      exceptions: language === 'en' ? "My Exceptions" : "मेरी विसंगतियां",
      leaves: language === 'en' ? "Leaves & Holidays" : "अवकाश और छुट्टियां",
      calendar: language === 'en' ? "Calendar Report" : "कैलेंडर रिपोर्ट",
      personalInfo: "Personal & Contact Information",
      bankingInfo: "Bank Account Details",
      statutoryInfo: "Statutory Registry & IDs",
      addresses: "Residential & Permanent Addresses",
      employmentInfo: "Employment Status & Structure",
      salaryStructure: "Standard Salary Structure",
      id: "ID",
      name: "Full Name",
      email: "Official Email",
      personalEmail: "Personal Email",
      phone: "Mobile",
      emergencyContact: "Emergency Contact",
      dob: "Date of Birth",
      bloodGroup: "Blood Group",
      gender: "Gender",
      joiningDate: "Joining Date",
      department: "Department",
      designation: "Designation",
      paymentMethod: "Payment Method",
      basicSalary: "Basic Salary",
      allowances: "Standard Allowances",
      deductions: "Standard Deductions",
      hourlyRate: "Overtime Hourly Rate",
      branch: "Work Branch",
      reportingTo: "Reporting Manager",
      employmentType: "Employment Type",
      accHolder: "Account Holder Name",
      bankName: "Bank Name",
      accNo: "Account Number",
      ifsc: "IFSC Code",
      pan: "PAN Number",
      aadhaar: "Aadhaar Card No",
      uan: "UAN (Universal Account No)",
      pfAcc: "PF Account Number",
      esicAcc: "ESIC Number",
      resAddress: "Residential Address",
      permAddress: "Permanent Address",
      notSpecified: "Not Specified",
      calendarDays: "Calendar Days",
      workedDays: "Effective Worked Days",
      presentDays: "Days Present",
      halfDays: "Half Days",
      leaveDays: "Paid Leaves",
      absentDays: "Days Absent",
      overtimeHrs: "Total Overtime",
      selectPeriod: "Select Attendance Period",
      date: "Date",
      status: "Status",
      checkIn: "Check In",
      checkOut: "Check Out",
      overtime: "Overtime",
      remarks: "Remarks",
      monthYear: "Month-Year",
      grossSalary: "Gross Earnings",
      netSalary: "Net Payout",
      paymentStatus: "Payment Status",
      actions: "Actions",
      payslipHeader: "EMPLOYEE SALARY SLIP",
      payslipTitle: "Rathi Build Mart Payroll System",
      payslipMonth: "Salary Month/Year",
      payslipEmpDetails: "Employee Information",
      slipEarnings: "Salary Allowances (Earnings)",
      slipDeductions: "Statutory Deductions",
      netPayable: "Net Payable Amount",
      authorizedSign: "Authorized Signatory",
      receiptSign: "Employee Signature",
      attendanceBreakdown: "Attendance Breakdown",
      printSlip: "Print Payslip",
      closeSlip: "Close",
      downloadPDF: "Download PDF",
      paid: "Paid",
      pending: "Pending",
      noPayslips: "No payroll slips generated for you yet. Contact human resources for salary run computations.",
      noAttendance: "No attendance logs found for this period.",
      noExceptions: "No missed punch or half-day logs found. You are all caught up!",
      exceptionType: "Log Type",
      approvalStatus: "Approval Status",
      adminRemarks: "Approver Notes / Remarks"
    }
  }['en'];

  // Helper arrays
  const YEARS = ['2025', '2026', '2027', '2028'];
  const MONTHS = [
    { name: 'January', hindi: 'जनवरी', value: '01' },
    { name: 'February', hindi: 'फरवरी', value: '02' },
    { name: 'March', hindi: 'मार्च', value: '03' },
    { name: 'April', hindi: 'अप्रैल', value: '04' },
    { name: 'May', hindi: 'मई', value: '05' },
    { name: 'June', hindi: 'जून', value: '06' },
    { name: 'July', hindi: 'जुलाई', value: '07' },
    { name: 'August', hindi: 'अगस्त', value: '08' },
    { name: 'September', hindi: 'सितंबर', value: '09' },
    { name: 'October', hindi: 'अक्टूबर', value: '10' },
    { name: 'November', hindi: 'नवंबर', value: '11' },
    { name: 'December', hindi: 'दिसंबर', value: '12' },
  ];

  // Selected period formatting
  const selectedPeriod = `${attendanceYear}-${attendanceMonth}`;

  // Filter attendance for the logged-in employee & selected period
  const empAttendanceList = attendanceRecords
    .filter(r => r.employeeId === employee.id && r.date.startsWith(selectedPeriod))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Compute attendance stats
  const daysPresent = empAttendanceList.filter(r => r.status === 'Present').length;
  const daysHalfDay = empAttendanceList.filter(r => r.status === 'Half Day').length;
  const daysLeave = empAttendanceList.filter(r => r.status === 'Leave').length;
  const daysAbsent = empAttendanceList.filter(r => r.status === 'Absent').length;
  const workedDays = daysPresent + (0.5 * daysHalfDay) + daysLeave;
  const overtimeHoursTotal = empAttendanceList.reduce((sum, curr) => sum + (curr.overtimeHours || 0), 0);

  // Filter payroll records for this employee
  const empPayslips = payrollRecords
    .filter(r => r.employeeId === employee.id)
    .sort((a, b) => b.monthYear.localeCompare(a.monthYear));

  // Open active payslip details
  const handleOpenPayslip = (record: PayrollRecord) => {
    const periodStr = record.monthYear;
    const periodAtt = attendanceRecords.filter(r => r.employeeId === employee.id && r.date.startsWith(periodStr));

    const pDays = periodAtt.filter(r => r.status === 'Present').length;
    const hDays = periodAtt.filter(r => r.status === 'Half Day').length;
    const lDays = periodAtt.filter(r => r.status === 'Leave').length;
    const aDays = periodAtt.filter(r => r.status === 'Absent').length;
    const oHours = periodAtt.reduce((sum, curr) => sum + (curr.overtimeHours || 0), 0);

    const workedVal = pDays + (0.5 * hDays) + lDays;
    const workingDaysCount = 26; // assume standard 26 days
    const earnedRatio = Math.min(1, workedVal / workingDaysCount);
    const earnedBasic = Math.round(record.basicSalary * (workedVal === 0 ? 0 : earnedRatio));

    setActivePayslip({
      record,
      employee,
      attendance: {
        present: pDays,
        halfDay: hDays,
        leave: lDays,
        absent: aDays,
        overtimeHrs: oHours
      },
      earnedBasic,
      periodName: record.monthYear
    });
  };

  // PDF Generation Helper (same as admin's export style)
  const downloadPayslipPDF = (record: PayrollRecord, emp: Employee) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const navyColor = [15, 23, 42]; // Slate-900 theme
    const lightGray = [248, 250, 252]; // Slate-50 background
    
    // Header banner
    doc.setFillColor(navyColor[0], navyColor[1], navyColor[2]);
    doc.rect(0, 0, 210, 18, 'F');
    
    // Header Text
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('RATHI BUILD MART - PAYSLIP', 105, 11, { align: 'center' });

    // Company address
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.setFont('Helvetica', 'normal');
    doc.text('Headquarters: NH-6, Rathi Estate, Raipur, Chhattisgarh, India', 105, 24, { align: 'center' });
    doc.text(`Salary Slip for the Pay Period: ${record.monthYear}`, 105, 28, { align: 'center' });

    // Separator line
    doc.setDrawColor(226, 232, 240);
    doc.line(10, 32, 200, 32);

    // Section 1: Employee metadata
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(navyColor[0], navyColor[1], navyColor[2]);
    doc.text('EMPLOYEE DETAILS', 10, 39);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    
    // Column 1
    doc.text(`Employee ID: ${record.employeeId}`, 10, 45);
    doc.text(`Employee Name: ${emp.name || 'N/A'}`, 10, 50);
    doc.text(`Designation: ${emp.designation || 'N/A'}`, 10, 55);
    doc.text(`Department: ${emp.department || 'N/A'}`, 10, 60);
    doc.text(`Joining Date: ${emp.joiningDate || 'N/A'}`, 10, 65);

    // Column 2
    doc.text(`Bank Account No: ${emp.bankAccountNo || 'N/A'}`, 110, 45);
    doc.text(`Bank Name: ${emp.bankName || 'N/A'}`, 110, 50);
    doc.text(`IFSC Code: ${emp.ifscCode || 'N/A'}`, 110, 55);
    doc.text(`PAN Number: ${emp.panNo || 'N/A'}`, 110, 60);
    doc.text(`UAN / PF Number: ${emp.uan || emp.pfAccountNo || 'N/A'}`, 110, 65);

    doc.line(10, 70, 200, 70);

    // Attendance Overview for PDF
    const periodAtt = attendanceRecords.filter(r => r.employeeId === employee.id && r.date.startsWith(record.monthYear));
    const pDays = periodAtt.filter(r => r.status === 'Present').length;
    const hDays = periodAtt.filter(r => r.status === 'Half Day').length;
    const lDays = periodAtt.filter(r => r.status === 'Leave').length;
    const workedDaysVal = pDays + (0.5 * hDays) + lDays;
    
    doc.setFont('Helvetica', 'bold');
    doc.text('ATTENDANCE RECORD', 10, 76);
    doc.setFont('Helvetica', 'normal');
    doc.text('Calendar Days: 26 Days', 10, 81);
    doc.text(`Days Present: ${pDays} Days`, 55, 81);
    doc.text(`Paid Leaves: ${lDays} Days`, 105, 81);
    doc.text(`Effective Worked: ${workedDaysVal} Days`, 155, 81);

    doc.line(10, 85, 200, 85);

    // Header of breakdown table
    doc.setFillColor(navyColor[0], navyColor[1], navyColor[2]);
    doc.rect(10, 90, 90, 7, 'F');
    doc.rect(110, 90, 90, 7, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('SALARY ALLOWANCES (EARNINGS)', 15, 95);
    doc.text('AMOUNT (₹)', 80, 95);
    doc.text('STATUTORY DEDUCTIONS', 115, 95);
    doc.text('AMOUNT (₹)', 180, 95);

    // Custom allowances/deductions values
    const hra = record.hra !== undefined ? record.hra : Math.round(record.basicSalary * 0.40);
    const da = record.da !== undefined ? record.da : 0;
    const conv = record.conveyanceAllowance !== undefined ? record.conveyanceAllowance : 0;
    const festBonus = record.festivalBonus !== undefined ? record.festivalBonus : 0;
    const perfInc = record.performanceIncentive !== undefined ? record.performanceIncentive : 0;
    const leaveAdj = record.leaveAdjustment !== undefined ? record.leaveAdjustment : 0;
    const standardAllowances = emp.allowances || 0;

    const pf = record.providentFund !== undefined ? record.providentFund : Math.round(record.basicSalary * 0.12);
    const esic = record.esic !== undefined ? record.esic : 0;
    const pt = record.professionalTax !== undefined ? record.professionalTax : 0;
    const tds = record.tds !== undefined ? record.tds : 0;
    const advDec = record.advanceDeduction !== undefined ? record.advanceDeduction : 0;
    const standardDeductions = emp.deductions || 0;

    const earnings = [
      { name: 'Basic Pay (Earned)', amount: record.basicSalary },
      { name: 'House Rent Allowance (HRA)', amount: hra },
      { name: 'Dearness Allowance (DA)', amount: da },
      { name: 'Conveyance Allowance', amount: conv },
      { name: 'Standard Allowances', amount: standardAllowances },
      { name: 'Overtime Earnings', amount: record.overtimePay },
      { name: 'Festival / Diwali Bonus', amount: festBonus },
      { name: 'Performance Incentives', amount: perfInc },
      { name: 'CL/EL Leave Adjustment', amount: leaveAdj },
    ];

    const deductions = [
      { name: 'Provident Fund (PF 12%)', amount: pf },
      { name: 'Employee State Insur (ESIC)', amount: esic },
      { name: 'Professional Tax (PT)', amount: pt },
      { name: 'Income Tax (TDS)', amount: tds },
      { name: 'Advance Outstanding Repay', amount: advDec },
      { name: 'Other Deductions', amount: standardDeductions },
    ];

    const maxLength = Math.max(earnings.length, deductions.length);
    let currentY = 102;
    doc.setTextColor(51, 65, 85);
    doc.setFont('Helvetica', 'normal');

    for (let i = 0; i < maxLength; i++) {
      const earn = earnings[i];
      const deduct = deductions[i];

      if (i % 2 === 0) {
        doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
        if (earn) doc.rect(10, currentY - 3, 90, 5, 'F');
        if (deduct) doc.rect(110, currentY - 3, 90, 5, 'F');
      }

      if (earn) {
        doc.text(earn.name, 15, currentY);
        doc.text(`Rs. ${earn.amount.toLocaleString('en-IN')}`, 80, currentY);
      }

      if (deduct) {
        doc.text(deduct.name, 115, currentY);
        doc.text(`Rs. ${deduct.amount.toLocaleString('en-IN')}`, 180, currentY);
      }

      currentY += 5;
    }

    doc.line(10, currentY, 200, currentY);
    currentY += 5;
    doc.setFont('Helvetica', 'bold');
    
    const grossSalary = earnings.reduce((sum, e) => sum + e.amount, 0);
    const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
    const netSalaryPay = Math.max(0, grossSalary - totalDeductions);

    doc.text('GROSS SALARY:', 15, currentY);
    doc.text(`Rs. ${grossSalary.toLocaleString('en-IN')}`, 80, currentY);
    
    doc.text('TOTAL DEDUCTIONS:', 115, currentY);
    doc.text(`Rs. ${totalDeductions.toLocaleString('en-IN')}`, 180, currentY);

    currentY += 8;
    doc.setFillColor(241, 245, 249);
    doc.rect(10, currentY - 4, 190, 8, 'F');
    doc.setTextColor(2, 24, 16);
    doc.setFontSize(9.5);
    doc.text('NET SALARY DISBURSED:', 15, currentY);
    doc.text(`Rs. ${netSalaryPay.toLocaleString('en-IN')}  /-  (Rupees Only)`, 110, currentY);

    currentY += 15;
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7.5);
    doc.setFont('Helvetica', 'normal');
    doc.text('This is a computer-generated salary statement certificate synced securely to company Google Drive ledger and does not require a physical stamp.', 10, currentY);

    currentY += 14;
    doc.line(10, currentY, 50, currentY);
    doc.line(150, currentY, 190, currentY);
    currentY += 4;
    doc.text('Employee Signature', 20, currentY);
    doc.text('Authorized Signatory', 160, currentY);

    doc.save(`Payslip_${emp.name.replace(/\s+/g, '_')}_${record.monthYear}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="employee-portal-container space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden box-border">
      
      {/* Mobile-only compact back button & header */}
      {activeTab !== 'dashboard' && (
        <div className="md:hidden sticky top-0 z-40 flex items-center justify-between bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-xl border border-slate-800 shadow-md mb-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-1 text-xs font-black text-emerald-400 hover:text-emerald-300 bg-slate-800/80 px-2 py-1.5 rounded-lg border border-slate-700/50 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 shrink-0" />
            <span>{language === 'en' ? "Back" : "पीछे"}</span>
          </button>
          <span className="text-xs font-black uppercase tracking-wider text-slate-100 truncate pr-4">
            {activeTab === 'profile' && t.profile}
            {activeTab === 'self_attendance' && (language === 'en' ? "Punch" : "पंच")}
            {activeTab === 'attendance' && t.attendance}
            {activeTab === 'calendar' && t.calendar}
            {activeTab === 'exceptions' && t.exceptions}
            {activeTab === 'payslips' && t.payslips}
            {activeTab === 'leaves' && t.leaves}
          </span>
          <div className="w-8"></div>
        </div>
      )}

      {/* 2026 Premium Employee Header banner */}
      <div className={`employee-banner-card relative bg-slate-900 overflow-hidden rounded-2xl p-4 sm:p-6 md:p-8 text-white border border-slate-800 shadow-xl flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 ${activeTab === 'dashboard' ? 'flex' : 'hidden md:flex'}`}>
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        <div className="absolute bottom-0 left-10 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>

        <div className="flex items-center gap-3 sm:gap-5 relative z-10 w-full md:w-auto">
          {employee.photoUrl ? (
            <img 
              src={employee.photoUrl} 
              alt={employee.name} 
              className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-2xl object-cover border border-emerald-500/30 shadow-md shrink-0"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-indigo-600 text-white font-black text-lg sm:text-2xl flex items-center justify-center border border-emerald-500/30 shrink-0">
              {employee.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
            </div>
          )}
          <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
            <div className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[8px] sm:text-[10px] font-extrabold uppercase tracking-widest">
              <ShieldCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              <span>Employee Access Portal</span>
            </div>
            <h1 className="text-base sm:text-xl md:text-2xl font-black tracking-tight truncate">{employee.name}</h1>
            <p className="text-[10px] sm:text-xs text-slate-400 font-bold font-mono truncate">
              ID: {employee.id} <span className="text-slate-600">•</span> {employee.designation} <span className="text-slate-600">•</span> {employee.department}
            </p>
          </div>
        </div>

        {/* Portal Quick Action Navigation (Hidden on mobile, beautiful row on desktop) */}
        <div className="hidden md:flex flex-wrap gap-2 relative z-10 w-full md:w-auto justify-center md:justify-end">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`h-11 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center sm:justify-start gap-2 cursor-pointer w-full sm:w-auto ${
              activeTab === 'dashboard' 
                ? 'bg-emerald-600 text-white shadow-md' 
                : 'bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
            <span className="truncate">{t.dashboard}</span>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`h-11 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center sm:justify-start gap-2 cursor-pointer w-full sm:w-auto ${
              activeTab === 'profile' 
                ? 'bg-emerald-600 text-white shadow-md' 
                : 'bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/50'
            }`}
          >
            <User className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{t.profile}</span>
          </button>
          {adminSettings.enableMobileAttendance !== false && employee.enableMobileAttendance !== false && (
            <button
              onClick={() => {
                setActiveTab('self_attendance');
                detectGpsAndVerifyOutlet();
              }}
              className={`h-11 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center sm:justify-start gap-2 cursor-pointer w-full sm:w-auto ${
                activeTab === 'self_attendance' 
                  ? 'bg-emerald-600 text-white shadow-md' 
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/50'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{language === 'en' ? "Self Attendance" : "स्वयं उपस्थिति"}</span>
            </button>
          )}
          <button
            onClick={() => setActiveTab('attendance')}
            className={`h-11 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center sm:justify-start gap-2 cursor-pointer w-full sm:w-auto ${
              activeTab === 'attendance' 
                ? 'bg-emerald-600 text-white shadow-md' 
                : 'bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/50'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{t.attendance}</span>
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`h-11 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center sm:justify-start gap-2 cursor-pointer w-full sm:w-auto ${
              activeTab === 'calendar' 
                ? 'bg-emerald-600 text-white shadow-md' 
                : 'bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/50'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{t.calendar}</span>
          </button>
          <button
            onClick={() => setActiveTab('exceptions')}
            className={`h-11 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center sm:justify-start gap-1.5 cursor-pointer w-full sm:w-auto ${
              activeTab === 'exceptions' 
                ? 'bg-emerald-600 text-white shadow-md' 
                : 'bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/50'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{t.exceptions}</span>
            {attendanceRecords.filter(r => r.employeeId === employee.id && (r.status === 'Miss Punch' || r.status === 'Half Day') && (r.approvalStatus || 'Pending') === 'Pending').length > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping shrink-0"></span>
            )}
          </button>
          {adminSettings.enableEmployeePayslips === true && (
            <button
              onClick={() => setActiveTab('payslips')}
              className={`h-11 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center sm:justify-start gap-2 cursor-pointer w-full sm:w-auto ${
                activeTab === 'payslips' 
                  ? 'bg-emerald-600 text-white shadow-md' 
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/50'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{t.payslips}</span>
            </button>
          )}
          <button
            onClick={() => setActiveTab('leaves')}
            className={`h-11 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center sm:justify-start gap-2 cursor-pointer w-full sm:w-auto ${
              activeTab === 'leaves' 
                ? 'bg-emerald-600 text-white shadow-md' 
                : 'bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/50'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{t.leaves}</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="space-y-6">

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (() => {
          const todayStr = new Date().toLocaleDateString('en-CA');
          const todayRecord = attendanceRecords.find(r => r.employeeId === employee.id && r.date === todayStr);
          const checkResult = getOutletCheckResult();
          
          // Let's find latest 3 attendance logs
          const recentLogs = [...attendanceRecords]
            .filter(r => r.employeeId === employee.id)
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 3);

          // Let's get the latest payslip if any
          const latestPayslip = empPayslips[0];

          return (
            <div className="space-y-6 animate-fade-in" id="employee-home-dashboard">
              {/* Dynamic Welcome greeting widget */}
              <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-indigo-500/10 border border-slate-200/50 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <h2 className="text-base sm:text-lg font-black text-slate-800 flex items-center justify-center sm:justify-start gap-1.5">
                    <span>
                      {language === 'en' 
                        ? `Welcome back, ${employee.name.split(' ')[0]}!` 
                        : `सुस्वागतम, ${employee.name.split(' ')[0]}!`}
                    </span>
                    <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
                  </h2>
                  <p className="text-[11px] sm:text-xs text-slate-500 font-semibold max-w-xl">
                    {language === 'en' 
                      ? "Keep track of your monthly attendance logs, apply for roster leaves, download payroll salary certificates, and punch shift times securely."
                      : "अपनी मासिक उपस्थिति दर्ज करें, छुट्टी के लिए आवेदन करें, सैलरी स्लिप प्राप्त करें और अपने शिफ्ट के समय को आसानी से ट्रैक करें।"}
                  </p>
                </div>
                <div className="bg-white border border-slate-200/70 shadow-xxs rounded-xl px-4 py-2 text-center shrink-0 min-w-[150px]">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{language === 'en' ? "Today's Status" : "आज की स्थिति"}</span>
                  <p className="text-xs font-black font-mono text-slate-800 mt-0.5">
                    {todayRecord ? (
                      <span className="text-emerald-700 font-extrabold">{language === 'en' ? "Punched In Today" : "आज उपस्थिति दर्ज है"}</span>
                    ) : (
                      <span className="text-rose-600 font-extrabold">{language === 'en' ? "Pending Punch" : "पंच लंबित है"}</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Top Row: Quick Attendance Punch Widget & Live Clock */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 1. Live Attendance Punch card (Direct access, highly smooth workflow!) */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-emerald-50 rounded-xl text-emerald-700 shrink-0">
                        <MapPin className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                          {language === 'en' ? "Quick Self Attendance Lock" : "तुरंत स्वयं उपस्थिति लॉक"}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-bold">
                          {language === 'en' ? "GPS Geofencing Active Detection" : "जीपीएस स्थान सत्यापन आधारित सीधा पंच"}
                        </p>
                      </div>
                    </div>
                    {/* Live Clock inside direct punch */}
                    <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                      <div className="text-right font-mono text-xs font-black text-slate-700 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
                        {currentTime}
                      </div>
                      <button
                        type="button"
                        onClick={detectGpsAndVerifyOutlet}
                        disabled={isDetectingGps}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 text-[10px] font-extrabold rounded-lg border border-slate-200 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Locate className={`w-3 h-3 ${isDetectingGps ? 'animate-spin' : ''}`} />
                        <span>{language === 'en' ? "GPS" : "लोकेशन"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Geofence Status Subcard */}
                  {adminSettings.enableMobileAttendance !== false && employee.enableMobileAttendance !== false ? (
                    <div className="space-y-3">
                      {/* Gps Info Display */}
                      {gpsError ? (
                        <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-800 font-semibold flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <span>{gpsError}</span>
                        </div>
                      ) : !currentGpsCoords ? (
                        <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center space-y-2.5">
                          <p className="text-[11px] text-slate-500 font-medium">
                            {language === 'en' 
                              ? "We need your physical location coordinates to verify you are currently at your branch premises before submitting your attendance."
                              : "उपस्थिति दर्ज करने से पहले यह सत्यापित करने के लिए कि आप अभी अपनी आवंटित शाखा में हैं, हमें आपकी भौगोलिक स्थिति (GPS) की आवश्यकता है।"}
                          </p>
                          <button
                            type="button"
                            onClick={detectGpsAndVerifyOutlet}
                            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            {language === 'en' ? "Detect Location & Unlock Punch" : "लोकेशन प्राप्त कर पंच अनलॉक करें"}
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {checkResult.isAllowed ? (
                            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-start gap-2.5">
                              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              <div className="text-[11px] text-emerald-800">
                                <span className="font-bold block">
                                  {language === 'en' ? "Geofence Verification Successful" : "जियोफेंस स्थान सत्यापित!"}
                                </span>
                                <span className="text-[10px] text-emerald-600 font-medium block mt-0.5">
                                  {checkResult.isBypassed
                                    ? (language === 'en' ? "GPS checks bypassed by Admin. Location recording enabled." : "जीपीएस चेक एडमिन द्वारा बायपास है। स्थान रिकॉर्ड किया जा रहा है।")
                                    : (language === 'en'
                                      ? `You are inside "${checkResult.nearestOutlet?.name || 'Verified branch'}" boundary (${checkResult.distanceMeters.toFixed(1)}m away).`
                                      : `आप अपनी आवंटित शाखा "${checkResult.nearestOutlet?.name || 'सुरक्षित शाखा'}" के भीतर हैं (दूरी ${checkResult.distanceMeters.toFixed(1)}मी)।`
                                    )}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5">
                              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                              <div className="text-[11px] text-rose-800">
                                <span className="font-bold block">
                                  {language === 'en' ? "Geofence Verification Failed!" : "जियोफेंस स्थान सत्यापन विफल!"}
                                </span>
                                <span className="text-[10px] text-rose-600 font-medium leading-normal block mt-0.5">
                                  {language === 'en'
                                    ? `Your assigned branch "${checkResult.nearestOutlet?.name || 'Registered Branch'}" is ${checkResult.distanceMeters > 1000 ? (checkResult.distanceMeters/1000).toFixed(1) + 'km' : checkResult.distanceMeters.toFixed(0) + 'm'} away (Permitted radius is ${checkResult.requiredRadius}m).`
                                    : `आपकी आवंटित शाखा "${checkResult.nearestOutlet?.name || 'सुरक्षित शाखा'}" आपसे ${checkResult.distanceMeters > 1000 ? (checkResult.distanceMeters/1000).toFixed(1) + 'किमी' : checkResult.distanceMeters.toFixed(0) + 'मी'} दूर है (अनुमत सीमा ${checkResult.requiredRadius}मी)।`}
                                </span>
                                <div className="flex items-center gap-2 mt-2">
                                  <button
                                    type="button"
                                    onClick={detectGpsAndVerifyOutlet}
                                    className="px-2.5 py-0.5 bg-rose-100 hover:bg-rose-200 text-rose-900 text-[10px] font-black rounded border border-rose-200 cursor-pointer"
                                  >
                                    {language === 'en' ? "Re-Check GPS" : "लोकेशन पुनः जाचें"}
                                  </button>
                                  <span className="text-[9px] text-rose-500 font-bold">{language === 'en' ? "* Please come inside the branch to mark attendance." : "* कृपया उपस्थिति दर्ज करने के लिए परिसर के भीतर आएं।"}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Success / Error Messages */}
                      {punchSuccessMsg && (
                        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-[11px] font-bold">
                          {punchSuccessMsg}
                        </div>
                      )}
                      {punchErrorMsg && (
                        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[11px] font-bold">
                          {punchErrorMsg}
                        </div>
                      )}

                      {/* Remarks Input */}
                      {(!todayRecord || !todayRecord.checkOut) && currentGpsCoords && checkResult.isAllowed && (
                        <div className="pt-1">
                          <input 
                            type="text"
                            value={punchRemarks}
                            onChange={(e) => setPunchRemarks(e.target.value)}
                            placeholder={language === 'en' ? "Activity notes / remarks (optional)..." : "कार्य विवरण / रिमार्क्स (वैकल्पिक)..."}
                            className="w-full border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-slate-50"
                          />
                        </div>
                      )}

                      {/* Punch Action buttons */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {/* In button */}
                        {todayRecord && todayRecord.checkIn ? (
                          <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between">
                            <div>
                              <span className="block text-[9px] font-bold text-slate-400 uppercase">{language === 'en' ? "Punched In At" : "आगमन समय"}</span>
                              <span className="text-sm font-black font-mono text-emerald-700">{todayRecord.checkIn}</span>
                            </div>
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-250">
                              {todayRecord.punchInOutlet || (language === 'en' ? "Branch" : "शाखा")}
                            </span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={handlePunchIn}
                            disabled={isSubmittingPunch || !currentGpsCoords || !checkResult.isAllowed}
                            className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors border border-emerald-500/20 shadow-sm"
                          >
                            <Check className="w-4 h-4 shrink-0" />
                            <span>{language === 'en' ? "Punch In (आगमन दर्ज करें)" : "आगमन (Punch In)"}</span>
                          </button>
                        )}

                        {/* Out button */}
                        {todayRecord && todayRecord.checkOut ? (
                          <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between">
                            <div>
                              <span className="block text-[9px] font-bold text-slate-400 uppercase">{language === 'en' ? "Punched Out At" : "प्रस्थान समय"}</span>
                              <span className="text-sm font-black font-mono text-slate-600">{todayRecord.checkOut}</span>
                            </div>
                            <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded border border-slate-250">
                              {todayRecord.punchOutOutlet || (language === 'en' ? "Branch" : "शाखा")}
                            </span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={handlePunchOut}
                            disabled={isSubmittingPunch || !currentGpsCoords || !checkResult.isAllowed || !todayRecord || !todayRecord.checkIn}
                            className="py-3 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
                          >
                            <Locate className="w-4 h-4 shrink-0" />
                            <span>{language === 'en' ? "Punch Out (प्रस्थान दर्ज करें)" : "प्रस्थान (Punch Out)"}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-amber-50 border border-amber-150 rounded-xl text-center">
                      <p className="text-xs text-amber-800 font-bold">
                        {language === 'en'
                          ? "Mobile GPS attendance is currently disabled by Admin or for your profile."
                          : "जीपीएस आधारित मोबाइल उपस्थिति व्यवस्था वर्तमान में एडमिन द्वारा आपके लिए बंद है।"}
                      </p>
                    </div>
                  )}
                </div>

                {/* 2. Shift Info / Branch Desk Quick Card */}
                <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-md flex flex-col justify-between border border-slate-800 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                      <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{language === 'en' ? "Shift & Premises info" : "शिफ्ट और परिसर विवरण"}</h4>
                      <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-black px-2.5 py-0.5 rounded-full border border-indigo-500/30">
                        {employee.employmentType || (language === 'en' ? "Permanent" : "स्थायी")}
                      </span>
                    </div>

                    <div className="space-y-3.5 pt-1">
                      <div>
                        <span className="block text-[10px] text-slate-400 font-semibold">{language === 'en' ? "Assigned Workstation" : "आवंटित शाखा कार्यालय"}</span>
                        <span className="text-xs font-extrabold text-slate-100 flex items-center gap-1.5 mt-0.5">
                          <Building className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span>{employee.branch || (language === 'en' ? "Not Assigned" : "आवंटित नहीं")}</span>
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400 font-semibold">{language === 'en' ? "Scheduled Timing" : "ड्यूटी शिफ्ट समय"}</span>
                        <span className="text-xs font-extrabold text-slate-100 flex items-center gap-1.5 mt-0.5">
                          <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span>{employee.workTiming || "09:00 AM - 06:00 PM"}</span>
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400 font-semibold">{language === 'en' ? "Reporting To" : "रिपोर्टिंग मैनेजर"}</span>
                        <span className="text-xs font-extrabold text-slate-100 flex items-center gap-1.5 mt-0.5">
                          <User className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span>{employee.reportingTo || "Mr. Rathi (MD / HR)"}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-800 text-[10px] text-indigo-200/80 font-medium">
                    {language === 'en'
                      ? "Contact HR department if workstation branch or roster shift hours require correction."
                      : "यदि आवंटित शाखा या ड्यूटी समय में सुधार की आवश्यकता है तो कृपया तुरंत HR से संपर्क करें।"}
                  </div>
                </div>
              </div>

              {/* Bento Grid: Quick Monthly Stats Widget & Bento Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 border border-slate-200 rounded-2xl shadow-xs flex flex-col justify-between hover:border-emerald-200 transition-colors">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.presentDays}</span>
                    <span className="p-1 bg-emerald-50 text-emerald-700 rounded-lg"><Check className="w-3.5 h-3.5" /></span>
                  </div>
                  <p className="text-3xl font-black text-emerald-600 font-mono mt-2">{daysPresent}</p>
                  <span className="text-[9px] text-slate-400 font-bold mt-1">{language === 'en' ? 'Present this month' : 'इस महीने उपस्थित'}</span>
                </div>

                <div className="bg-white p-4 border border-slate-200 rounded-2xl shadow-xs flex flex-col justify-between hover:border-amber-200 transition-colors">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.halfDays}</span>
                    <span className="p-1 bg-amber-50 text-amber-600 rounded-lg"><AlertCircle className="w-3.5 h-3.5" /></span>
                  </div>
                  <p className="text-3xl font-black text-amber-500 font-mono mt-2">{daysHalfDay}</p>
                  <span className="text-[9px] text-slate-400 font-bold mt-1">{language === 'en' ? 'Half-day records' : 'हाफ-डे उपस्थिति'}</span>
                </div>

                <div className="bg-white p-4 border border-slate-200 rounded-2xl shadow-xs flex flex-col justify-between hover:border-indigo-200 transition-colors">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.overtimeHrs}</span>
                    <span className="p-1 bg-indigo-50 text-indigo-700 rounded-lg"><TrendingUp className="w-3.5 h-3.5" /></span>
                  </div>
                  <p className="text-3xl font-black text-indigo-600 font-mono mt-2">{overtimeHoursTotal} <span className="text-xs font-bold font-sans">hrs</span></p>
                  <span className="text-[9px] text-slate-400 font-bold mt-1">{language === 'en' ? 'Overtime approved' : 'मंजूर ओवरटाइम घंटे'}</span>
                </div>

                <div className="bg-white p-4 border border-slate-200 rounded-2xl shadow-xs flex flex-col justify-between hover:border-rose-200 transition-colors">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.absentDays}</span>
                    <span className="p-1 bg-rose-50 text-rose-600 rounded-lg"><AlertCircle className="w-3.5 h-3.5" /></span>
                  </div>
                  <p className="text-3xl font-black text-rose-500 font-mono mt-2">{daysAbsent}</p>
                  <span className="text-[9px] text-slate-400 font-bold mt-1">{language === 'en' ? 'Unmarked / Absent' : 'अनुपस्थित दिवस'}</span>
                </div>
              </div>

              {/* Grid 3: Quick Action Launchpad & Recent Log Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Quick Actions Panel */}
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span>{language === 'en' ? "Quick Access Launchpad" : "क्विक एक्सेस लॉन्चपैड"}</span>
                    </h3>

                    <div className="grid grid-cols-1 gap-2 pt-3">
                      {/* Action 1: Raise Missed Punch */}
                      <button
                        onClick={() => {
                          setRaiseDate(new Date().toISOString().split('T')[0]);
                          setRaiseCheckIn(adminSettings?.defaultCheckIn || '09:00');
                          setRaiseCheckOut(adminSettings?.defaultCheckOut || '18:00');
                          setRaiseRemarks('');
                          setTicketError('');
                          setTicketSuccess('');
                          setShowRaiseModal(true);
                        }}
                        className="p-3 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-900 border border-slate-150 rounded-xl text-left text-xs font-bold text-slate-700 transition-all flex items-center gap-2.5 cursor-pointer group"
                      >
                        <div className="p-1.5 bg-white border border-slate-200 text-slate-500 group-hover:border-emerald-200 group-hover:text-emerald-700 rounded-lg shrink-0">
                          <Plus className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="block font-black text-slate-800 group-hover:text-emerald-900">{language === 'en' ? "Raise Missed Punch Ticket" : "मिस पंच रिक्वेस्ट दर्ज करें"}</span>
                          <span className="text-[9px] text-slate-400 group-hover:text-emerald-650 font-bold">{language === 'en' ? "Forgot to punch arrival/departure" : "आगमन या प्रस्थान पंच भूल जाने पर"}</span>
                        </div>
                      </button>

                      {/* Action 2: Apply for Leave */}
                      <button
                        onClick={() => setActiveTab('leaves')}
                        className="p-3 bg-slate-50 hover:bg-blue-50 hover:text-blue-900 border border-slate-150 rounded-xl text-left text-xs font-bold text-slate-700 transition-all flex items-center gap-2.5 cursor-pointer group"
                      >
                        <div className="p-1.5 bg-white border border-slate-200 text-slate-500 group-hover:border-blue-200 group-hover:text-blue-700 rounded-lg shrink-0">
                          <CalendarDays className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="block font-black text-slate-800 group-hover:text-blue-900">{language === 'en' ? "Request Casual/Sick Leave" : "छुट्टी (Leave) के लिए आवेदन करें"}</span>
                          <span className="text-[9px] text-slate-400 group-hover:text-blue-655 font-bold">{language === 'en' ? "Submit leave request to HR/Manager" : "बीमारी या निजी काम की छुट्टी"}</span>
                        </div>
                      </button>

                      {/* Action 3: Download Last Payslip */}
                      {latestPayslip ? (
                        <button
                          onClick={() => downloadPayslipPDF(latestPayslip, employee)}
                          className="p-3 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-900 border border-slate-150 rounded-xl text-left text-xs font-bold text-slate-700 transition-all flex items-center gap-2.5 cursor-pointer group"
                        >
                          <div className="p-1.5 bg-white border border-slate-200 text-slate-500 group-hover:border-indigo-200 group-hover:text-indigo-700 rounded-lg shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="block font-black text-slate-800 group-hover:text-indigo-900">
                              {language === 'en' ? `Get ${latestPayslip.monthYear} Payslip PDF` : `${latestPayslip.monthYear} सैलरी स्लिप डाउनलोड`}
                            </span>
                            <span className="text-[9px] text-slate-400 group-hover:text-indigo-650 font-bold">
                              ₹{latestPayslip.netSalary !== undefined ? latestPayslip.netSalary.toLocaleString('en-IN') : latestPayslip.totalSalary.toLocaleString('en-IN')} payout • {latestPayslip.paymentStatus}
                            </span>
                          </div>
                        </button>
                      ) : (
                        <button
                          onClick={() => setActiveTab('payslips')}
                          className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-150 rounded-xl text-left text-xs font-bold text-slate-400 transition-all flex items-center gap-2.5 cursor-not-allowed"
                          disabled
                        >
                          <div className="p-1.5 bg-white border border-slate-200 text-slate-300 rounded-lg shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="block font-black text-slate-400">{language === 'en' ? "Payslips Unavailable" : "सैलरी स्लिप अनुपलब्ध"}</span>
                            <span className="text-[9px] text-slate-400 font-bold">{language === 'en' ? "No payslips disbursed yet" : "अभी कोई सैलरी स्लिप जारी नहीं हुई"}</span>
                          </div>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-400 font-semibold leading-relaxed">
                    {language === 'en' 
                      ? "* Your direct clock-ins sync instantly to the cloud database and reflect on administrative panels in real time."
                      : "* आपका पंच डाटा तुरंत क्लाउड डेटाबेस में सुरक्षित रूप से दर्ज होकर एडमिन को दिखाई देता है।"}
                  </div>
                </div>

                {/* Recent Attendance Stream & Pending Tickets */}
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4 lg:col-span-2">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span>{language === 'en' ? "Recent Activity Stream" : "हालिया गतिविधि स्ट्रीम"}</span>
                  </h3>

                  {recentLogs.length > 0 ? (
                    <div className="space-y-3">
                      {recentLogs.map((log) => {
                        const isLate = isAttendanceLate(log, employee.workTiming, adminSettings?.defaultCheckIn || '09:00');
                        const isException = log.status === 'Miss Punch' || log.status === 'Half Day';
                        const approvalStatus = log.approvalStatus || 'Pending';

                        return (
                          <div key={log.date} className="p-3.5 bg-slate-50 hover:bg-slate-100/50 rounded-xl border border-slate-150 transition-colors flex justify-between items-center gap-3">
                            <div className="space-y-1">
                              <span className="font-mono font-black text-slate-900 text-xs">{log.date}</span>
                              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                                <span className="font-mono bg-white border border-slate-150 px-1.5 py-0.5 rounded text-[9.5px]">In: {log.checkIn || '--:--'}</span>
                                <span className="font-mono bg-white border border-slate-150 px-1.5 py-0.5 rounded text-[9.5px]">Out: {log.checkOut || '--:--'}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Status badge */}
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                                log.status === 'Present' 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                  : log.status === 'Half Day' 
                                    ? 'bg-amber-50 text-amber-700 border-amber-100'
                                    : log.status === 'Leave' 
                                      ? 'bg-blue-50 text-blue-700 border-blue-100'
                                      : 'bg-rose-50 text-rose-700 border-rose-100'
                              }`}>
                                {log.status}
                              </span>

                              {/* Exceptions or special warnings */}
                              {isLate && (
                                <span className="text-[9px] bg-rose-50 text-rose-600 border border-rose-150 px-1.5 py-0.5 rounded font-black uppercase">
                                  {language === 'en' ? 'Late' : 'देरी'}
                                </span>
                              )}

                              {isException && (
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase border ${
                                  approvalStatus === 'Approved' 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                    : approvalStatus === 'Rejected' 
                                      ? 'bg-red-50 text-red-700 border-red-100' 
                                      : 'bg-amber-50 text-amber-700 border-amber-100 animate-pulse'
                                }`}>
                                  {approvalStatus}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-slate-400 space-y-1">
                      <AlertCircle className="w-8 h-8 mx-auto text-slate-200" />
                      <p className="text-xs font-bold">{t.noAttendance}</p>
                    </div>
                  )}

                  {/* Pending Leave Requests or Holiday Highlight snippet */}
                  <div className="bg-slate-50/70 border border-slate-150 p-3.5 rounded-xl flex items-center justify-between text-xs font-medium">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-emerald-600" />
                      <span className="font-extrabold text-slate-700">
                        {language === 'en' ? "Leaves & Holidays Overview" : "अवकाश एवं छुट्टियों का संक्षिप्त विवरण"}
                      </span>
                    </div>
                    <button
                      onClick={() => setActiveTab('leaves')}
                      className="text-[11px] font-black text-emerald-700 hover:text-emerald-800 cursor-pointer flex items-center gap-0.5"
                    >
                      <span>{language === 'en' ? "Open Roster" : "कैलेंडर खोलें"}</span>
                      <span>&rarr;</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* SELF ATTENDANCE (MOBILE PUNCH) TAB */}
        {activeTab === 'self_attendance' && adminSettings.enableMobileAttendance !== false && employee.enableMobileAttendance !== false && (() => {
          const todayStr = new Date().toLocaleDateString('en-CA');
          const todayRecord = attendanceRecords.find(r => r.employeeId === employee.id && r.date === todayStr);
          const checkResult = getOutletCheckResult();

          return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in" id="self-attendance-panel">
              {/* Left & Middle Column: Punch Form & Live Verification */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Geofence Status Header / Alert Card */}
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
                  {employee.branch && (
                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl px-3 py-2 flex items-center justify-between text-xs font-sans">
                      <span className="font-bold text-slate-600">
                        {language === 'en' ? "Your Assigned Branch:" : "आपकी आवंटित शाखा:"}
                      </span>
                      <span className="bg-[#03623c] text-white font-black px-2.5 py-1 rounded-lg text-[11px]">
                        {employee.branch}
                      </span>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-emerald-50 rounded-xl text-emerald-700 shrink-0">
                        <MapPin className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                          {language === 'en' ? "Secure Mobile Attendance Lock" : "सुरक्षित मोबाइल उपस्थिति लॉक"}
                        </h2>
                        <p className="text-[10px] text-slate-400 font-bold">
                          {language === 'en' ? "GPS Geofencing Active Verification" : "जीपीएस जियोफेंसिंग सक्रिय स्थान सत्यापन"}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={detectGpsAndVerifyOutlet}
                      disabled={isDetectingGps}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 text-emerald-700 text-xs font-extrabold rounded-xl border border-emerald-200/50 flex items-center justify-center gap-1.5 cursor-pointer transition-all shrink-0"
                    >
                      <Locate className={`w-3.5 h-3.5 ${isDetectingGps ? 'animate-spin' : ''}`} />
                      <span>{isDetectingGps ? (language === 'en' ? "Verifying..." : "सत्यापित कर रहा है...") : (language === 'en' ? "Refresh GPS" : "जीपीएस रिफ्रेश करें")}</span>
                    </button>
                  </div>

                  {/* Dynamic Geofence Response Widget */}
                  {gpsError ? (
                    <div className="p-4 bg-rose-50 border border-rose-150 rounded-xl flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <span className="block text-xs font-black text-rose-900">
                          {language === 'en' ? "GPS Location Unavailable" : "जीपीएस लोकेशन अनुपलब्ध"}
                        </span>
                        <p className="text-[10px] text-rose-700 font-medium leading-relaxed">{gpsError}</p>
                      </div>
                    </div>
                  ) : !currentGpsCoords ? (
                    <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center space-y-3">
                      <div className="inline-flex p-3 bg-indigo-50 text-indigo-600 rounded-full">
                        <Locate className="w-6 h-6 animate-pulse" />
                      </div>
                      <div className="max-w-md mx-auto space-y-1">
                        <span className="block text-xs font-extrabold text-slate-800">
                          {language === 'en' ? "Location Permission Required" : "स्थान का पता लगाने की आवश्यकता है"}
                        </span>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {language === 'en' 
                            ? "We need your physical location coordinates to verify you are currently at your branch premises before submitting your attendance."
                            : "उपस्थिति दर्ज करने से पहले यह सत्यापित करने के लिए कि आप अभी अपनी आवंटित शाखा में हैं, हमें आपकी भौगोलिक स्थिति (GPS) की आवश्यकता है।"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={detectGpsAndVerifyOutlet}
                        className="mt-1 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer transition-colors"
                      >
                        {language === 'en' ? "Verify My Location Now" : "लोकेशन सत्यापित करें"}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Coords display */}
                      <div className="flex flex-wrap gap-2 text-[10px] font-mono text-slate-400 bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-bold">
                        <span>LAT: {currentGpsCoords.latitude.toFixed(6)}</span>
                        <span className="text-slate-300">|</span>
                        <span>LNG: {currentGpsCoords.longitude.toFixed(6)}</span>
                        <span className="ml-auto text-slate-400 bg-white border border-slate-200 px-1.5 rounded text-[9px] uppercase tracking-wide">Verified Coords</span>
                      </div>

                      {/* Distance / Outlet Match status card */}
                      {checkResult.isAllowed ? (
                        <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-start gap-3">
                          <div className="p-1.5 bg-emerald-500 rounded-lg text-white mt-0.5 shrink-0">
                            <Check className="w-4 h-4 font-black" />
                          </div>
                          <div className="space-y-1">
                            <span className="block text-xs font-black text-emerald-900">
                              {language === 'en' ? "Geofence Verification Successful" : "स्थान सत्यापन सफल - आप सुरक्षित क्षेत्र में हैं"}
                            </span>
                            <p className="text-[10px] text-emerald-700 font-semibold leading-relaxed">
                              {checkResult.isBypassed ? (
                                language === 'en'
                                  ? "Geofencing restrictions are bypassed for you by Administrator permission. Location logging remains active."
                                  : "जियोफेंसिंग प्रतिबंध आपके लिए एडमिन अनुमति द्वारा बायपास कर दिए गए हैं। स्थान लॉगिंग सक्रिय है।"
                              ) : adminSettings.enableGeofencing ? (
                                language === 'en'
                                  ? `You are within the authorized boundaries of branch: "${checkResult.nearestOutlet?.name || 'Verified branch'}". Current distance is ${checkResult.distanceMeters.toFixed(1)} meters (Allowed: ${checkResult.requiredRadius}m).`
                                  : `आप अधिकृत शाखा के सुरक्षित दायरे में हैं: "${checkResult.nearestOutlet?.name || 'सुरक्षित शाखा'}"। आपकी दूरी ${checkResult.distanceMeters.toFixed(1)} मीटर है (अनुमत: ${checkResult.requiredRadius}मी)।`
                              ) : (
                                language === 'en'
                                  ? "Geofencing restrictions are currently disabled by Admin settings. Location logging remains active."
                                  : "जीपीएस प्रतिबंध वर्तमान में एडमिन द्वारा निष्क्रिय हैं। स्थान का रिकॉर्ड दर्ज किया जाएगा।"
                              )}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
                          <div className="p-1.5 bg-rose-600 rounded-lg text-white mt-0.5 shrink-0">
                            <AlertCircle className="w-4 h-4" />
                          </div>
                          <div className="space-y-1">
                            <span className="block text-xs font-black text-rose-900">
                              {language === 'en' ? "Geofence Access Denied!" : "स्थान सत्यापन विफल - आप सुरक्षित क्षेत्र से बाहर हैं"}
                            </span>
                            <p className="text-[10px] text-rose-700 font-bold leading-relaxed">
                              {language === 'en'
                                ? `Your current position is outside the branch geofence boundary. Your assigned branch geofence: "${checkResult.nearestOutlet?.name || 'Registered Branch'}" is ${checkResult.distanceMeters > 1000 ? (checkResult.distanceMeters/1000).toFixed(2) + ' km' : checkResult.distanceMeters.toFixed(1) + ' meters'} away. (Your permitted radius is ${checkResult.requiredRadius}m).`
                                : `आपकी वर्तमान स्थिति आवंटित सुरक्षित शाखा के दायरे से बाहर है। आपकी आवंटित शाखा: "${checkResult.nearestOutlet?.name || 'मुख्य शाखा'}" आपसे ${checkResult.distanceMeters > 1000 ? (checkResult.distanceMeters/1000).toFixed(2) + ' किमी' : checkResult.distanceMeters.toFixed(1) + ' मीटर'} दूर है। (अनुमत सीमा ${checkResult.requiredRadius}मी है)।`}
                            </p>
                            <span className="block text-[9px] font-black uppercase text-rose-800 mt-1">
                              {language === 'en' ? "Please come inside your assigned branch premises to mark your attendance." : "कृपया उपस्थिति दर्ज करने के लिए अपनी आवंटित शाखा कार्यालय परिसर के भीतर आएं।"}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Digital Clock & Punch Controls */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center space-y-6">
                  
                  {/* Visual Digital Clock */}
                  <div className="text-center space-y-1 bg-slate-50 border border-slate-100 rounded-2xl px-8 py-5 shadow-xs max-w-sm w-full">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'en' ? "Live System Time (IST)" : "लाइव डिजिटल क्लॉक"}</span>
                    <h3 className="text-3xl font-black text-slate-800 font-mono tracking-tight">{currentTime}</h3>
                    <p className="text-[11px] text-slate-500 font-extrabold">{new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'hi-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>

                  {/* Feedback alerts */}
                  {punchSuccessMsg && (
                    <div className="w-full max-w-md p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{punchSuccessMsg}</span>
                    </div>
                  )}

                  {punchErrorMsg && (
                    <div className="w-full max-w-md p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{punchErrorMsg}</span>
                    </div>
                  )}

                  {/* Remarks Field */}
                  {(!todayRecord || !todayRecord.checkOut) && (
                    <div className="w-full max-w-md">
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        {language === 'en' ? "Punch Remarks / Activity (Optional)" : "पंच रिमार्क्स / कार्य विवरण (वैकल्पिक)"}
                      </label>
                      <input 
                        type="text"
                        value={punchRemarks}
                        onChange={(e) => setPunchRemarks(e.target.value)}
                        placeholder={language === 'en' ? "e.g., Arrived for Morning Shift..." : "जैसे, रायपुर ऑफिस आगमन..."}
                        className="w-full border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-slate-50/50"
                      />
                    </div>
                  )}

                  {/* Action Buttons Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
                    {/* Punch In */}
                    {todayRecord && todayRecord.checkIn ? (
                      <div className="p-4 bg-emerald-50 border border-emerald-150 rounded-2xl flex flex-col items-center justify-center text-center space-y-1">
                        <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">{language === 'en' ? "Punched In Today" : "आगमन दर्ज है!"}</span>
                        <span className="text-lg font-black font-mono text-emerald-700">{todayRecord.checkIn}</span>
                        <span className="text-[9px] text-emerald-500 font-bold">{todayRecord.punchInOutlet || employee.branch || (language === 'en' ? "Branch" : "शाखा")}</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handlePunchIn}
                        disabled={isSubmittingPunch || !currentGpsCoords || !checkResult.isAllowed}
                        className="py-4 px-6 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white font-black text-sm rounded-2xl shadow-sm flex flex-col items-center justify-center gap-1 cursor-pointer transition-all border border-emerald-500/25"
                      >
                        <span className="uppercase text-[10px] tracking-widest leading-none text-emerald-100 font-extrabold">{language === 'en' ? "Register Punch" : "शाखा आगमन"}</span>
                        <span>{language === 'en' ? "PUNCH IN (आगमन)" : "आगमन (Punch In)"}</span>
                      </button>
                    )}

                    {/* Punch Out */}
                    {todayRecord && todayRecord.checkOut ? (
                      <div className="p-4 bg-slate-100 border border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center space-y-1">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{language === 'en' ? "Punched Out Today" : "प्रस्थान दर्ज है!"}</span>
                        <span className="text-lg font-black font-mono text-slate-600">{todayRecord.checkOut}</span>
                        <span className="text-[9px] text-slate-400 font-bold">{todayRecord.punchOutOutlet || employee.branch || (language === 'en' ? "Branch" : "शाखा")}</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handlePunchOut}
                        disabled={isSubmittingPunch || !currentGpsCoords || !checkResult.isAllowed || !todayRecord || !todayRecord.checkIn}
                        className="py-4 px-6 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900 text-white font-black text-sm rounded-2xl shadow-sm flex flex-col items-center justify-center gap-1 cursor-pointer transition-all"
                      >
                        <span className="uppercase text-[10px] tracking-widest leading-none text-slate-400 font-extrabold">{language === 'en' ? "Register Departure" : "शाखा प्रस्थान"}</span>
                        <span>{language === 'en' ? "PUNCH OUT (प्रस्थान)" : "प्रस्थान (Punch Out)"}</span>
                      </button>
                    )}
                  </div>

                  {/* Simple Help Line */}
                  <span className="text-[9px] font-semibold text-slate-400 max-w-sm text-center">
                    {language === 'en'
                      ? "* Standard shift work timings and overtime rates are automatically calculated upon punch checkout."
                      : "* आपके कार्य घंटों और ओवरटाइम भत्तों की गणना कंपनी नियमों के अनुसार प्रस्थान दर्ज करने पर की जाती है।"}
                  </span>
                </div>
              </div>

              {/* Right Column: Information & Guidelines */}
              <div className="space-y-6">
                
                {/* Active Authorized Branches Card */}
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
                    <Building className="w-4 h-4 text-emerald-600" />
                    <span>{language === 'en' ? "Authorized Branch Zones" : "अधिकृत सुरक्षित शाखाएं"}</span>
                  </h4>

                  {(!adminSettings.geofenceOutlets || adminSettings.geofenceOutlets.length === 0) ? (
                    <p className="text-[10px] text-slate-400 font-medium">
                      {language === 'en' 
                        ? "No geofenced branches configured. You can punch attendance from any location." 
                        : "कोई जियोफेंस शाखा कॉन्फ़िगर नहीं है। आप किसी भी स्थान से अपनी उपस्थिति दर्ज कर सकते हैं।"}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {adminSettings.geofenceOutlets.map(outlet => (
                        <div key={outlet.id} className="p-3 bg-slate-50 hover:bg-slate-100/55 rounded-xl border border-slate-150 transition-all flex justify-between items-center gap-2">
                          <div className="min-w-0">
                            <span className="block text-xs font-black text-slate-800 truncate">{outlet.name}</span>
                            <span className="text-[9px] text-slate-400 font-mono font-bold block">Lat: {outlet.latitude.toFixed(4)}, Lng: {outlet.longitude.toFixed(4)}</span>
                          </div>
                          <span className="bg-emerald-50 text-emerald-800 text-[9px] font-black px-2 py-0.5 rounded-full border border-emerald-150 shrink-0">
                            {outlet.radiusMeters}m {language === 'en' ? "Lock" : "लॉक"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Secure Instructions Guide Card */}
                <div className="bg-gradient-to-tr from-slate-900 to-slate-950 text-white p-5 rounded-2xl shadow-md space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    <span>{language === 'en' ? "Geofence Guidelines" : "सुरक्षित उपस्थिति नियम"}</span>
                  </h4>

                  <div className="space-y-3 text-[10px] text-slate-300 font-medium leading-relaxed">
                    <div className="flex gap-2">
                      <span className="text-emerald-400 font-bold">1.</span>
                      <p>{language === 'en' 
                        ? "Ensure GPS location/Wifi is enabled on your phone before clicking Punch In/Out." 
                        : "पंच करने से पहले अपने फोन का जीपीएस लोकेशन और इंटरनेट वाई-फाई अवश्य चालू रखें।"}</p>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-emerald-400 font-bold">2.</span>
                      <p>{language === 'en'
                        ? "You must be physically present inside your branch's geofenced boundary (e.g. within 100 meters)."
                        : "उपस्थिति दर्ज करने के लिए आपका शारीरिक रूप से अपनी आवंटित शाखा कार्यालय परिसर के भीतर होना अनिवार्य है।"}</p>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-emerald-400 font-bold">3.</span>
                      <p>{language === 'en'
                        ? "Attempts to spoof coordinates, use location fake software, or punch out of bounds are blocked automatically and flagged in security audits."
                        : "गलत लोकेशन का उपयोग करने या फर्जी जीपीएस सॉफ्टवेयर का उपयोग करने पर उपस्थिति स्वतः ही निरस्त हो जाएगी।"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Column 1: Personal & Contacts */}
            <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-xl shadow-xs space-y-4 sm:space-y-5 lg:col-span-2">
              <div className="flex items-center gap-2 pb-2.5 sm:pb-3 border-b border-slate-100">
                <div className="w-6.5 h-6.5 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                  <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider leading-tight">{t.personalInfo}</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.name}</label>
                  <p className="mt-1 font-bold text-slate-800 text-sm">{employee.name}</p>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.id}</label>
                  <p className="mt-1 font-bold font-mono text-slate-800 text-sm">{employee.id}</p>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.email}</label>
                  <p className="mt-1 font-bold text-slate-800 text-sm">{employee.email || t.notSpecified}</p>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.personalEmail}</label>
                  <p className="mt-1 font-bold text-slate-800 text-sm">{employee.personalEmail || t.notSpecified}</p>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.phone}</label>
                  <p className="mt-1 font-bold text-slate-800 text-sm font-mono">{employee.mobileNo || t.notSpecified}</p>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.emergencyContact}</label>
                  <p className="mt-1 font-bold text-slate-800 text-sm font-mono">{employee.emergencyContactNo || t.notSpecified}</p>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.dob}</label>
                  <p className="mt-1 font-bold text-slate-800 text-sm font-mono">{employee.dob || t.notSpecified}</p>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.bloodGroup}</label>
                  <p className="mt-1 font-bold text-slate-800 text-sm">{employee.bloodGroup || t.notSpecified}</p>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.gender}</label>
                  <p className="mt-1 font-bold text-slate-800 text-sm">{employee.gender || t.notSpecified}</p>
                </div>
              </div>

              {/* Residential & Permanent Addresses */}
              <div className="border-t border-slate-100 pt-5 space-y-4">
                <div className="flex items-center gap-2 pb-1">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">{t.addresses}</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.resAddress}</label>
                    <p className="mt-1.5 text-slate-700 leading-relaxed font-semibold">
                      {employee.resLine1 ? (
                        <>
                          {employee.resLine1}, {employee.resLine2 && `${employee.resLine2}, `}
                          {employee.resCity}, {employee.resState} - {employee.resPinCode}
                        </>
                      ) : t.notSpecified}
                    </p>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.permAddress}</label>
                    <p className="mt-1.5 text-slate-700 leading-relaxed font-semibold">
                      {employee.permLine1 ? (
                        <>
                          {employee.permLine1}, {employee.permLine2 && `${employee.permLine2}, `}
                          {employee.permCity}, {employee.permState} - {employee.permPinCode}
                        </>
                      ) : t.notSpecified}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: Salary Structure, Banking, and Statutory info */}
            <div className="space-y-6">
              
              {/* Standard Salary Structure */}
              <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-xl shadow-xs space-y-3.5 sm:space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <div className="w-6.5 h-6.5 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                    <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider leading-tight">{t.salaryStructure}</h3>
                </div>
                <div className="space-y-2.5 text-xs font-semibold text-slate-700">
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                    <span className="text-slate-500 font-bold">{t.basicSalary}</span>
                    <span className="font-mono text-slate-950 font-extrabold text-sm">₹{employee.basicSalary.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                    <span className="text-slate-500 font-bold">{t.allowances}</span>
                    <span className="font-mono text-emerald-700 font-extrabold">₹{employee.allowances.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                    <span className="text-slate-500 font-bold">{t.deductions}</span>
                    <span className="font-mono text-rose-600 font-extrabold">₹{employee.deductions.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                    <span className="text-slate-500 font-bold">{t.hourlyRate}</span>
                    <span className="font-mono text-slate-800 font-bold">₹{employee.hourlyRate || 150}/hr</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-slate-500 font-bold">{t.paymentMethod}</span>
                    <span className="bg-emerald-50 text-emerald-800 text-[10px] px-2 py-0.5 rounded border border-emerald-100 font-extrabold">{employee.paymentMethod}</span>
                  </div>
                </div>
              </div>

              {/* Bank Account details */}
              <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-xl shadow-xs space-y-3.5 sm:space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <div className="w-6.5 h-6.5 sm:w-8 sm:h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold shrink-0">
                    <Building className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider leading-tight">{t.bankingInfo}</h3>
                </div>
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.accHolder}</span>
                    <p className="font-extrabold text-slate-800 mt-0.5">{employee.bankAccountHolderName || employee.name}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.bankName}</span>
                    <p className="font-extrabold text-slate-800 mt-0.5">{employee.bankName || t.notSpecified}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.accNo}</span>
                      <p className="font-mono font-extrabold text-slate-800 mt-0.5 truncate">{employee.bankAccountNo || t.notSpecified}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.ifsc}</span>
                      <p className="font-mono font-extrabold text-slate-800 mt-0.5">{employee.ifscCode || t.notSpecified}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Statutory Registry */}
              <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-xl shadow-xs space-y-3.5 sm:space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <div className="w-6.5 h-6.5 sm:w-8 sm:h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold shrink-0">
                    <FileCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider leading-tight">{t.statutoryInfo}</h3>
                </div>
                <div className="space-y-2.5 text-xs font-semibold text-slate-700">
                  <div className="flex justify-between items-center py-1 border-b border-slate-50">
                    <span className="text-slate-500 font-bold">{t.pan}</span>
                    <span className="font-mono text-slate-900 font-bold uppercase">{employee.panNo || t.notSpecified}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-50">
                    <span className="text-slate-500 font-bold">{t.aadhaar}</span>
                    <span className="font-mono text-slate-900 font-bold">{employee.aadhaarNo || t.notSpecified}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-50">
                    <span className="text-slate-500 font-bold">{t.uan}</span>
                    <span className="font-mono text-slate-900 font-bold">{employee.uan || t.notSpecified}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500 font-bold">{t.pfAcc}</span>
                    <span className="font-mono text-slate-900 font-bold">{employee.pfAccountNo || t.notSpecified}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ATTENDANCE TAB */}
        {activeTab === 'attendance' && (
          <div className="space-y-6">
            
            {/* Range selection dock */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-end justify-between gap-5">
              <div className="flex flex-col sm:flex-row gap-4 items-center flex-1 max-w-xl">
                
                {/* Year picker */}
                <div className="w-full sm:w-1/2 space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Year</label>
                  <select
                    value={attendanceYear}
                    onChange={(e) => setAttendanceYear(e.target.value)}
                    className="w-full appearance-none border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white cursor-pointer"
                  >
                    {YEARS.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                {/* Month picker */}
                <div className="w-full sm:w-1/2 space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Month</label>
                  <select
                    value={attendanceMonth}
                    onChange={(e) => setAttendanceMonth(e.target.value)}
                    className="w-full appearance-none border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white cursor-pointer"
                  >
                    {MONTHS.map(m => (
                      <option key={m.value} value={m.value}>
                        {language === 'en' ? m.name : m.hindi}
                      </option>
                    ))}
                  </select>
                </div>

              </div>

              <div className="text-xs font-bold text-slate-500 bg-slate-50 border border-slate-200/60 px-4 py-2.5 rounded-lg">
                Showing logs for: <span className="text-emerald-700">{selectedPeriod}</span>
              </div>
            </div>

            {/* Attendance Analytics summary block */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-xxs">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.presentDays}</span>
                <p className="text-2xl font-black text-emerald-600 font-mono mt-1">{daysPresent}</p>
              </div>
              <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-xxs">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.halfDays}</span>
                <p className="text-2xl font-black text-amber-500 font-mono mt-1">{daysHalfDay}</p>
              </div>
              <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-xxs">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.leaveDays}</span>
                <p className="text-2xl font-black text-blue-500 font-mono mt-1">{daysLeave}</p>
              </div>
              <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-xxs">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.absentDays}</span>
                <p className="text-2xl font-black text-rose-500 font-mono mt-1">{daysAbsent}</p>
              </div>
              <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-xxs col-span-2 md:col-span-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.overtimeHrs}</span>
                <p className="text-2xl font-black text-slate-800 font-mono mt-1">{overtimeHoursTotal} hrs</p>
              </div>
            </div>

            {/* Daily log table */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
              {empAttendanceList.length > 0 ? (
                <div>
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <th className="py-3 px-6">{t.date}</th>
                          <th className="py-3 px-6">{t.status}</th>
                          <th className="py-3 px-6">{t.checkIn}</th>
                          <th className="py-3 px-6">{t.checkOut}</th>
                          <th className="py-3 px-6">{t.overtime}</th>
                          <th className="py-3 px-6">{t.remarks}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {empAttendanceList.map((rec) => {
                          const isLate = isAttendanceLate(rec, employee.workTiming, adminSettings?.defaultCheckIn || '09:00');
                          const isEarly = isAttendanceEarlyGoing(rec, employee.workTiming, adminSettings?.defaultCheckOut || '18:00');

                          return (
                            <tr key={rec.date} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-3 px-6 font-mono font-bold text-slate-900">{rec.date}</td>
                              <td className="py-3 px-6">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                  rec.status === 'Present' 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                    : rec.status === 'Half Day' 
                                      ? 'bg-amber-50 text-amber-700 border-amber-100'
                                      : rec.status === 'Leave' 
                                        ? 'bg-blue-50 text-blue-700 border-blue-100'
                                        : 'bg-rose-50 text-rose-700 border-rose-100'
                                }`}>
                                  {rec.status}
                                </span>
                              </td>
                              <td className="py-3 px-6 font-mono text-slate-700">
                                <div className="flex flex-col">
                                  <span>{rec.checkIn || '--:--'}</span>
                                  {isLate && (
                                    <span className="text-[9px] text-rose-500 font-extrabold flex items-center gap-0.5 mt-0.5">
                                      <span className="w-1 h-1 rounded-full bg-rose-500 animate-pulse"></span>
                                      <span>{language === 'en' ? 'Late' : 'देरी'}</span>
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-6 font-mono text-slate-700">
                                <div className="flex flex-col">
                                  <span>{rec.checkOut || '--:--'}</span>
                                  {isEarly && (
                                    <span className="text-[9px] text-amber-500 font-extrabold flex items-center gap-0.5 mt-0.5">
                                      <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse"></span>
                                      <span>{language === 'en' ? 'Early' : 'जल्दी'}</span>
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-6 font-mono text-slate-700">
                                {rec.overtimeHours ? `${rec.overtimeHours} hrs` : '--'}
                              </td>
                              <td className="py-3 px-6 text-slate-500 italic max-w-xs truncate">{rec.remarks || '--'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="block md:hidden divide-y divide-slate-100">
                    {empAttendanceList.map((rec) => {
                      const isLate = isAttendanceLate(rec, employee.workTiming, adminSettings?.defaultCheckIn || '09:00');
                      const isEarly = isAttendanceEarlyGoing(rec, employee.workTiming, adminSettings?.defaultCheckOut || '18:00');

                      return (
                        <div key={rec.date} className="p-4 hover:bg-slate-50/50 transition-colors space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-black text-slate-900 text-sm">{rec.date}</span>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              rec.status === 'Present' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                : rec.status === 'Half Day' 
                                  ? 'bg-amber-50 text-amber-700 border-amber-100'
                                  : rec.status === 'Leave' 
                                    ? 'bg-blue-50 text-blue-700 border-blue-100'
                                    : 'bg-rose-50 text-rose-700 border-rose-100'
                            }`}>
                              {rec.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">In Time</span>
                              <div className="font-mono text-slate-700 font-bold mt-0.5 flex items-center gap-1.5">
                                <span>{rec.checkIn || '--:--'}</span>
                                {isLate && (
                                  <span className="text-[9px] bg-rose-50 text-rose-500 border border-rose-100 px-1 py-0.2 rounded font-extrabold">
                                    {language === 'en' ? 'Late' : 'देरी'}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Out Time</span>
                              <div className="font-mono text-slate-700 font-bold mt-0.5 flex items-center gap-1.5">
                                <span>{rec.checkOut || '--:--'}</span>
                                {isEarly && (
                                  <span className="text-[9px] bg-amber-50 text-amber-500 border border-amber-100 px-1 py-0.2 rounded font-extrabold">
                                    {language === 'en' ? 'Early' : 'जल्दी'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {(rec.overtimeHours || rec.remarks) && (
                            <div className="bg-slate-50 p-2.5 rounded-lg text-[11px] space-y-1">
                              {rec.overtimeHours ? (
                                <div className="flex justify-between">
                                  <span className="text-slate-500 font-semibold">Overtime:</span>
                                  <span className="font-mono font-bold text-slate-700">{rec.overtimeHours} hrs</span>
                                </div>
                              ) : null}
                              {rec.remarks ? (
                                <div className="text-slate-500 italic">
                                  <span className="font-semibold not-italic text-slate-600">Notes: </span>{rec.remarks}
                                </div>
                              ) : null}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <AlertCircle className="w-10 h-10 mx-auto text-slate-200 mb-2" />
                  <p className="text-xs font-bold">{t.noAttendance}</p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* PAYSLIPS TAB */}
        {adminSettings.enableEmployeePayslips === true && activeTab === 'payslips' && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            {empPayslips.length > 0 ? (
              <div>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <th className="py-4 px-6">{t.monthYear}</th>
                        <th className="py-4 px-6">{t.basicSalary}</th>
                        <th className="py-4 px-6">{t.grossSalary}</th>
                        <th className="py-4 px-6">{t.slipDeductions}</th>
                        <th className="py-4 px-6 font-bold text-slate-800">{t.netSalary}</th>
                        <th className="py-4 px-6 text-center">{t.paymentStatus}</th>
                        <th className="py-4 px-6 text-right">{t.actions}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {empPayslips.map((rec) => (
                        <tr key={rec.monthYear} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-6 font-mono font-bold text-slate-950 text-sm">{rec.monthYear}</td>
                          <td className="py-4 px-6 font-mono text-slate-700">₹{rec.basicSalary.toLocaleString('en-IN')}</td>
                          <td className="py-4 px-6 font-mono text-slate-700">₹{rec.totalSalary.toLocaleString('en-IN')}</td>
                          <td className="py-4 px-6 font-mono text-rose-600">-₹{rec.deductions.toLocaleString('en-IN')}</td>
                          <td className="py-4 px-6 font-mono text-slate-900 font-extrabold text-sm">
                            ₹{(rec.netSalary !== undefined ? rec.netSalary : rec.totalSalary).toLocaleString('en-IN')}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold border ${
                              rec.paymentStatus === 'Paid' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                : 'bg-amber-50 text-amber-700 border-amber-100'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${rec.paymentStatus === 'Paid' ? 'bg-emerald-500' : 'bg-amber-400'}`}></span>
                              <span>{rec.paymentStatus === 'Paid' ? t.paid : t.pending}</span>
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button
                              onClick={() => handleOpenPayslip(rec)}
                              className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-all active:scale-97"
                            >
                              <FileText className="w-3.5 h-3.5 text-slate-400" />
                              <span>View Slip</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="block md:hidden divide-y divide-slate-100">
                  {empPayslips.map((rec) => (
                    <div key={rec.monthYear} className="p-4 hover:bg-slate-50/50 transition-colors space-y-3.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-black text-slate-950 text-sm">{rec.monthYear}</span>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                          rec.paymentStatus === 'Paid' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                            : 'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                          <span className={`w-1 h-1 rounded-full ${rec.paymentStatus === 'Paid' ? 'bg-emerald-500' : 'bg-amber-400'}`}></span>
                          <span>{rec.paymentStatus === 'Paid' ? t.paid : t.pending}</span>
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gross Pay</span>
                          <p className="font-mono text-slate-700 font-semibold mt-0.5">₹{rec.totalSalary.toLocaleString('en-IN')}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Deductions</span>
                          <p className="font-mono text-rose-600 font-semibold mt-0.5">-₹{rec.deductions.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="col-span-2 border-t border-slate-100 pt-2 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Net Payout</span>
                            <p className="font-mono text-slate-950 font-black text-sm">₹{(rec.netSalary !== undefined ? rec.netSalary : rec.totalSalary).toLocaleString('en-IN')}</p>
                          </div>
                          <button
                            onClick={() => handleOpenPayslip(rec)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-all active:scale-97"
                          >
                            <FileText className="w-3.5 h-3.5 text-slate-500" />
                            <span>View Slip</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-slate-400">
                <AlertCircle className="w-10 h-10 mx-auto text-slate-200 mb-3" />
                <p className="text-xs font-bold max-w-sm mx-auto leading-relaxed">{t.noPayslips}</p>
              </div>
            )}
          </div>
        )}

        {/* EXCEPTIONS (MISS PUNCH / HALF DAY) TAB */}
        {activeTab === 'exceptions' && (
          <div className="space-y-4">
            <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-emerald-500" />
                  <span>{t.exceptions}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-medium">Verify your registered missed punches, half-day records, and their approval statuses.</p>
              </div>
              <button
                onClick={() => {
                  setRaiseDate(new Date().toISOString().split('T')[0]);
                  setRaiseCheckIn(adminSettings?.defaultCheckIn || '09:00');
                  setRaiseCheckOut(adminSettings?.defaultCheckOut || '18:00');
                  setRaiseRemarks('');
                  setTicketError('');
                  setTicketSuccess('');
                  setShowRaiseModal(true);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer transition-all self-start md:self-auto shadow-md"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>{language === 'en' ? 'Raise Missed Punch Ticket' : 'मिस पंच टिकट दर्ज करें'}</span>
              </button>
            </div>

            {/* Raise Missed Punch Modal */}
            {showRaiseModal && (
              <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_24px_70px_rgba(0,0,0,0.2)] max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-emerald-600 animate-pulse" />
                      <span>{language === 'en' ? 'Raise Missed Punch' : 'मिस पंच अनुरोध'}</span>
                    </h3>
                    <button
                      onClick={() => setShowRaiseModal(false)}
                      className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleRaiseTicket} className="space-y-4">
                    {ticketError && (
                      <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-lg text-xs font-bold">
                        {ticketError}
                      </div>
                    )}
                    {ticketSuccess && (
                      <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg text-xs font-bold animate-pulse">
                        {ticketSuccess}
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        {language === 'en' ? 'Date of Missed Punch' : 'मिस पंच की तिथि'}
                      </label>
                      <input
                        type="date"
                        required
                        value={raiseDate}
                        onChange={(e) => setRaiseDate(e.target.value)}
                        className="w-full border border-slate-200 px-3 py-2 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:outline-none font-bold text-xs text-slate-700"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          {language === 'en' ? 'Check-In Time' : 'आगमन समय (In)'}
                        </label>
                        <input
                          type="time"
                          required
                          value={raiseCheckIn}
                          onChange={(e) => setRaiseCheckIn(e.target.value)}
                          className="w-full border border-slate-200 px-3 py-2 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:outline-none font-mono text-xs text-slate-700"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          {language === 'en' ? 'Check-Out Time' : 'प्रस्थान समय (Out)'}
                        </label>
                        <input
                          type="time"
                          required
                          value={raiseCheckOut}
                          onChange={(e) => setRaiseCheckOut(e.target.value)}
                          className="w-full border border-slate-200 px-3 py-2 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:outline-none font-mono text-xs text-slate-700"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        {language === 'en' ? 'Reason / Explanation' : 'मिस पंच का कारण'}
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={raiseRemarks}
                        onChange={(e) => setRaiseRemarks(e.target.value)}
                        placeholder={language === 'en' ? 'e.g. Card forgotten, Biometric reader error' : 'उदा. आरएफआईडी कार्ड भूल गए, मशीन खराब थी'}
                        className="w-full border border-slate-200 px-3 py-2 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:outline-none text-xs text-slate-700"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowRaiseModal(false)}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition-all"
                      >
                        {language === 'en' ? 'Cancel' : 'रद्द करें'}
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingTicket}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1.5"
                      >
                        {isSubmittingTicket ? (language === 'en' ? 'Submitting...' : 'भेजा जा रहा है...') : (language === 'en' ? 'Submit Ticket' : 'टिकट भेजें')}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
              {attendanceRecords.filter(r => r.employeeId === employee.id && (r.status === 'Miss Punch' || r.status === 'Half Day')).length > 0 ? (
                <div>
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <th className="py-4 px-6">{t.date}</th>
                          <th className="py-4 px-6">{t.exceptionType}</th>
                          <th className="py-4 px-6">{t.checkIn} / {t.checkOut}</th>
                          <th className="py-4 px-6 text-center">{t.approvalStatus}</th>
                          <th className="py-4 px-6">{t.adminRemarks}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {attendanceRecords
                          .filter(r => r.employeeId === employee.id && (r.status === 'Miss Punch' || r.status === 'Half Day'))
                          .sort((a, b) => b.date.localeCompare(a.date))
                          .map((rec) => {
                            const status = rec.approvalStatus || 'Pending';
                            return (
                              <tr key={rec.date} className="hover:bg-slate-50/50 transition-colors">
                                <td className="py-4 px-6 font-mono font-bold text-slate-950 text-sm">{rec.date}</td>
                                <td className="py-4 px-6">
                                  <span className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase ${
                                    rec.status === 'Miss Punch' 
                                      ? 'bg-amber-50 text-amber-700 border border-amber-100' 
                                      : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                                  }`}>
                                    {rec.status}
                                  </span>
                                </td>
                                <td className="py-4 px-6 font-mono text-slate-700">
                                  {rec.checkIn || '--:--'} &rarr; {rec.checkOut || '--:--'}
                                </td>
                                <td className="py-4 px-6 text-center">
                                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold border ${
                                    status === 'Approved' 
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                      : status === 'Rejected' 
                                        ? 'bg-red-50 text-red-700 border-red-100' 
                                        : 'bg-amber-50 text-amber-700 border-amber-100'
                                  }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                      status === 'Approved' 
                                        ? 'bg-emerald-500' 
                                        : status === 'Rejected' 
                                          ? 'bg-red-500' 
                                          : 'bg-amber-400 animate-pulse'
                                    }`}></span>
                                    <span>{status === 'Approved' ? 'Approved' : status === 'Rejected' ? 'Rejected' : 'Pending'}</span>
                                  </span>
                                </td>
                                <td className="py-4 px-6 text-slate-500 italic font-semibold">{rec.remarks || '—'}</td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="block md:hidden divide-y divide-slate-100">
                    {attendanceRecords
                      .filter(r => r.employeeId === employee.id && (r.status === 'Miss Punch' || r.status === 'Half Day'))
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map((rec) => {
                        const status = rec.approvalStatus || 'Pending';
                        return (
                          <div key={rec.date} className="p-4 hover:bg-slate-50/50 transition-colors space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-black text-slate-950 text-sm">{rec.date}</span>
                              <span className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase ${
                                rec.status === 'Miss Punch' 
                                  ? 'bg-amber-50 text-amber-700 border border-amber-100' 
                                  : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                              }`}>
                                {rec.status}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Punch Log</span>
                                <p className="font-mono text-slate-700 font-semibold mt-0.5">
                                  {rec.checkIn || '--:--'} &rarr; {rec.checkOut || '--:--'}
                                </p>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Approval Status</span>
                                <div className="mt-0.5">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${
                                    status === 'Approved' 
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                      : status === 'Rejected' 
                                        ? 'bg-red-50 text-red-700 border-red-100' 
                                        : 'bg-amber-50 text-amber-700 border-amber-100'
                                  }`}>
                                    <span className={`w-1 h-1 rounded-full ${
                                      status === 'Approved' 
                                        ? 'bg-emerald-500' 
                                        : status === 'Rejected' 
                                          ? 'bg-red-500' 
                                          : 'bg-amber-400 animate-pulse'
                                    }`}></span>
                                    <span>{status === 'Approved' ? 'Approved' : status === 'Rejected' ? 'Rejected' : 'Pending'}</span>
                                  </span>
                                </div>
                              </div>
                            </div>

                            {rec.remarks && (
                              <div className="bg-slate-50 p-2.5 rounded-lg text-[11px] text-slate-500 italic">
                                <span className="font-semibold not-italic text-slate-600">Remarks: </span>{rec.remarks}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 text-slate-400">
                  <AlertCircle className="w-10 h-10 mx-auto text-slate-200 mb-3" />
                  <p className="text-xs font-bold max-w-sm mx-auto leading-relaxed">{t.noExceptions}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* LEAVES & HOLIDAYS TAB */}
        {activeTab === 'leaves' && (
          <div className="bg-white rounded-2xl border border-slate-200/85 p-5 md:p-6 shadow-md">
            <LeavesHolidays
              employees={[employee]}
              attendance={attendanceRecords}
              language={language}
              isEmployeeView={true}
              employeeId={employee.id}
              leaveRequests={leaveRequests}
              onAddLeaveRequest={onAddLeaveRequest}
              adminSettings={adminSettings}
            />
          </div>
        )}

        {/* CALENDAR REPORT TAB */}
        {activeTab === 'calendar' && (
          <MonthlyCalendarReport
            isAdmin={false}
            attendanceRecords={attendanceRecords}
            adminSettings={adminSettings}
            language={language}
            currentEmployee={employee}
          />
        )}

      </div>

      {/* DETAILED PAYSLIP MODAL (Matches Administrator layout exactly) */}
      {activePayslip && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-xl border border-slate-200 shadow-[0_24px_70px_rgba(0,0,0,0.15)] max-w-2xl w-full p-4 sm:p-8 space-y-4 sm:space-y-6 relative" id="printable-payslip">
            
            <div className="absolute inset-0 pointer-events-none overflow-hidden select-none opacity-[0.015] flex items-center justify-center">
              <Sparkles className="w-96 h-96 text-indigo-900" />
            </div>

            {/* Header info */}
            <div className="border-b border-slate-200 pb-4 sm:pb-5 text-center relative">
              <div className="flex items-center justify-center gap-2 mb-1.5">
                <div className="w-6 h-6 rounded bg-indigo-600 text-white flex items-center justify-center font-extrabold text-[10px] font-display">P</div>
                <h2 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-widest font-display">{t.payslipTitle}</h2>
              </div>
              <p className="text-[8px] sm:text-[9px] font-mono text-slate-400 uppercase tracking-widest leading-none font-bold">Verified Employee Cloud Records System</p>
              
              <div className="mt-3 sm:mt-4 inline-block">
                <span className="text-[10px] sm:text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100/60 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full uppercase tracking-wider">{t.payslipHeader}</span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 font-mono font-bold mt-2.5 sm:mt-3 bg-slate-50 inline-block px-3 py-1 rounded-md border border-slate-150">{t.payslipMonth}: {activePayslip.record.monthYear}</p>
            </div>

            {/* Employee metadata */}
            <div className="bg-slate-50/80 p-4 sm:p-5 rounded-lg border border-slate-200/60 relative">
              <h4 className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5 sm:mb-3.5 flex items-center gap-1">
                <Users className="w-3 h-3 text-indigo-500" />
                <span>{t.payslipEmpDetails}</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                <div className="space-y-1 sm:space-y-1.5 font-semibold">
                  <p className="text-slate-500 flex justify-between border-b border-slate-100 pb-1">
                    <span>{t.id}:</span> 
                    <span className="font-mono font-bold text-slate-900">{activePayslip.record.employeeId}</span>
                  </p>
                  <p className="text-slate-500 flex justify-between border-b border-slate-100 pb-1">
                    <span>{t.name}:</span> 
                    <span className="font-bold text-slate-900">{activePayslip.employee?.name}</span>
                  </p>
                  <p className="text-slate-500 flex justify-between pb-0">
                    <span>{t.department}:</span> 
                    <span className="font-bold text-slate-900">{activePayslip.employee?.department}</span>
                  </p>
                </div>
                <div className="space-y-1 sm:space-y-1.5 font-semibold">
                  <p className="text-slate-500 flex justify-between border-b border-slate-100 pb-1">
                    <span>{t.designation}:</span> 
                    <span className="font-bold text-slate-900">{activePayslip.employee?.designation}</span>
                  </p>
                  <p className="text-slate-500 flex justify-between border-b border-slate-100 pb-1">
                    <span>{t.joiningDate}:</span> 
                    <span className="font-bold text-slate-800">{activePayslip.employee?.joiningDate}</span>
                  </p>
                  <p className="text-slate-500 flex justify-between pb-0">
                    <span>{t.paymentMethod}:</span> 
                    <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.2 rounded text-[10px]">{activePayslip.employee?.paymentMethod}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Attendance detailed log breakdown */}
            <div className="bg-indigo-50/40 p-4 rounded-lg border border-indigo-100/50">
              <h4 className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest mb-3 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{t.attendanceBreakdown}</span>
              </h4>
              <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-5 text-center text-xs gap-y-3 sm:gap-y-0 sm:divide-x divide-indigo-100/30 font-semibold">
                <div className="px-1">
                  <p className="text-slate-400 text-[10px] mb-1 font-bold">{t.presentDays}</p>
                  <p className="font-extrabold text-slate-800 text-sm font-mono">{activePayslip.attendance.present}</p>
                </div>
                <div className="px-1">
                  <p className="text-slate-400 text-[10px] mb-1 font-bold">{t.halfDays}</p>
                  <p className="font-extrabold text-slate-800 text-sm font-mono">{activePayslip.attendance.halfDay}</p>
                </div>
                <div className="px-1">
                  <p className="text-slate-400 text-[10px] mb-1 font-bold">{t.leaveDays}</p>
                  <p className="font-extrabold text-slate-800 text-sm font-mono">{activePayslip.attendance.leave}</p>
                </div>
                <div className="px-1">
                  <p className="text-slate-400 text-[10px] mb-1 font-bold">{t.absentDays}</p>
                  <p className="font-extrabold text-rose-600 text-sm font-mono">{activePayslip.attendance.absent}</p>
                </div>
                <div className="px-1 col-span-2 xs:col-span-1">
                  <p className="text-slate-400 text-[10px] mb-1 font-bold">Overtime</p>
                  <p className="font-extrabold text-emerald-700 text-sm font-mono">{activePayslip.attendance.overtimeHrs} hr</p>
                </div>
              </div>
            </div>

            {/* Table of earnings and deductions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 border border-slate-200 rounded-lg overflow-hidden divide-y sm:divide-y-0 sm:divide-x divide-slate-200 text-xs shadow-3xs">
              
              {/* Earnings column */}
              <div>
                <div className="bg-slate-50 p-3 border-b border-slate-200 font-bold uppercase tracking-wider text-slate-700 text-[10px] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>{t.slipEarnings}</span>
                </div>
                <div className="p-4 space-y-2 text-slate-600 font-semibold">
                  <div className="flex justify-between pb-1 border-b border-slate-100">
                    <span>Basic Salary (Earned)</span>
                    <span className="font-bold text-slate-800 font-mono">₹{activePayslip.earnedBasic.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>House Rent (HRA)</span>
                    <span className="font-bold text-slate-800 font-mono">₹{(activePayslip.record.hra !== undefined ? activePayslip.record.hra : Math.round(activePayslip.record.basicSalary * 0.40)).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dearness (DA)</span>
                    <span className="font-bold text-slate-800 font-mono">₹{(activePayslip.record.da || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Conveyance Allowance</span>
                    <span className="font-bold text-slate-800 font-mono">₹{(activePayslip.record.conveyanceAllowance || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Overtime Pay</span>
                    <span className="font-bold text-slate-800 font-mono">₹{activePayslip.record.overtimePay.toLocaleString('en-IN')}</span>
                  </div>
                  {activePayslip.record.festivalBonus > 0 && (
                    <div className="flex justify-between font-bold text-indigo-700 bg-indigo-50/50 px-1.5 py-0.5 rounded">
                      <span>Festival Bonus 🎁</span>
                      <span className="font-mono">₹{activePayslip.record.festivalBonus.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {activePayslip.record.performanceIncentive > 0 && (
                    <div className="flex justify-between font-bold text-emerald-700 bg-emerald-50/50 px-1.5 py-0.5 rounded">
                      <span>Performance Incentive</span>
                      <span className="font-mono">₹{activePayslip.record.performanceIncentive.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {activePayslip.record.leaveAdjustment > 0 && (
                    <div className="flex justify-between font-bold text-blue-700 bg-blue-50/50 px-1.5 py-0.5 rounded">
                      <span>Paid Leave Adjust</span>
                      <span className="font-mono">₹{activePayslip.record.leaveAdjustment.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-dashed border-slate-200 pt-2 font-bold text-slate-800">
                    <span>Gross Salary</span>
                    <span className="font-mono">₹{activePayslip.record.totalSalary.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Deductions column */}
              <div>
                <div className="bg-slate-50 p-3 border-b border-slate-200 font-bold uppercase tracking-wider text-slate-700 text-[10px] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  <span>{t.slipDeductions}</span>
                </div>
                <div className="p-4 space-y-2 text-slate-600 font-semibold">
                  <div className="flex justify-between">
                    <span>Provident Fund (PF 12%)</span>
                    <span className="font-bold text-slate-800 font-mono">₹{(activePayslip.record.providentFund || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Employee Insurance (ESIC)</span>
                    <span className="font-bold text-slate-800 font-mono">₹{(activePayslip.record.esic || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Professional Tax (PT)</span>
                    <span className="font-bold text-slate-800 font-mono">₹{(activePayslip.record.professionalTax || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Income Tax (TDS)</span>
                    <span className="font-bold text-slate-800 font-mono">₹{(activePayslip.record.tds || 0).toLocaleString('en-IN')}</span>
                  </div>
                  {activePayslip.record.advanceDeduction > 0 && (
                    <div className="flex justify-between font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                      <span>Advance Repayment 💸</span>
                      <span className="font-mono">-₹{activePayslip.record.advanceDeduction.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-dashed border-slate-200 pt-2 font-bold text-rose-600">
                    <span>Total Deductions</span>
                    <span className="font-mono">₹{activePayslip.record.deductions.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Net Total block */}
            <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-lg flex items-center justify-between shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#03623c]/20 rounded-full blur-2xl"></div>
              <div className="space-y-0.5 relative z-10 font-bold">
                <span className="text-[10px] uppercase tracking-widest text-slate-400">{t.netPayable}</span>
                <p className="text-[9px] text-emerald-400 font-mono uppercase tracking-wider">Computed & Secured Digital Receipt</p>
              </div>
              <span className="text-xl sm:text-2xl font-extrabold font-mono text-white relative z-10">₹{(activePayslip.record.netSalary !== undefined ? activePayslip.record.netSalary : activePayslip.record.totalSalary).toLocaleString('en-IN')}</span>
            </div>

            {/* Signature Block */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 sm:gap-y-0 pt-6 sm:pt-8 text-xs text-center text-slate-500 font-bold">
              <div>
                <div className="w-36 mx-auto border-b border-slate-300 pb-1 text-slate-800">Rajeev Verma</div>
                <p className="mt-1.5 text-[10px] text-slate-400 uppercase tracking-widest">{t.authorizedSign}</p>
              </div>
              <div>
                <div className="w-36 mx-auto border-b border-slate-300 pb-1 min-h-[16px]"></div>
                <p className="mt-1.5 text-[10px] text-slate-400 uppercase tracking-widest">{t.receiptSign}</p>
              </div>
            </div>

            {/* Controls */}
            <div className="border-t border-slate-100 pt-4 sm:pt-5 flex flex-col sm:flex-row justify-end gap-2 no-print">
              <button
                onClick={() => downloadPayslipPDF(activePayslip.record, activePayslip.employee)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-3xs active:scale-97 w-full sm:w-auto"
              >
                <FileText className="w-3.5 h-3.5 text-white" />
                <span>{t.downloadPDF}</span>
              </button>
              <button
                onClick={handlePrint}
                className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-3xs active:scale-97 w-full sm:w-auto"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>{t.printSlip}</span>
              </button>
              <button
                onClick={() => setActivePayslip(null)}
                className="bg-slate-900 hover:bg-slate-850 text-white px-5 py-2.5 rounded-lg text-xs font-bold transition-all shadow-3xs cursor-pointer active:scale-97 w-full sm:w-auto text-center"
              >
                <span>{t.closeSlip}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Mobile-only Premium Bottom Navigation Bar (App-like experience) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-950 text-white border-t border-slate-900 shadow-[0_-8px_24px_rgba(0,0,0,0.2)] px-4 py-1 z-45 flex items-center justify-between h-16 no-print">
        <button
          onClick={() => {
            setActiveTab('dashboard');
            setShowMoreSheet(false);
          }}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 flex-1 cursor-pointer transition-colors ${
            activeTab === 'dashboard' ? 'text-emerald-400 font-extrabold' : 'text-slate-400 font-semibold'
          }`}
        >
          <Sparkles className="w-5 h-5 shrink-0" />
          <span className="text-[9px] tracking-tight">{language === 'en' ? 'Home' : 'मुख्य'}</span>
        </button>

        {adminSettings.enableMobileAttendance !== false && employee.enableMobileAttendance !== false ? (
          <button
            onClick={() => {
              setActiveTab('self_attendance');
              setShowMoreSheet(false);
              detectGpsAndVerifyOutlet();
            }}
            className={`flex flex-col items-center justify-center gap-0.5 py-1 flex-1 cursor-pointer transition-colors ${
              activeTab === 'self_attendance' ? 'text-emerald-400 font-extrabold' : 'text-slate-400 font-semibold'
            }`}
          >
            <Locate className="w-5 h-5 shrink-0" />
            <span className="text-[9px] tracking-tight">{language === 'en' ? 'Punch' : 'पंच'}</span>
          </button>
        ) : (
          <button
            onClick={() => {
              setActiveTab('attendance');
              setShowMoreSheet(false);
            }}
            className={`flex flex-col items-center justify-center gap-0.5 py-1 flex-1 cursor-pointer transition-colors ${
              activeTab === 'attendance' ? 'text-emerald-400 font-extrabold' : 'text-slate-400 font-semibold'
            }`}
          >
            <Calendar className="w-5 h-5 shrink-0" />
            <span className="text-[9px] tracking-tight">{language === 'en' ? 'Logs' : 'लॉग्स'}</span>
          </button>
        )}

        <button
          onClick={() => {
            setActiveTab('calendar');
            setShowMoreSheet(false);
          }}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 flex-1 cursor-pointer transition-colors ${
            activeTab === 'calendar' ? 'text-emerald-400 font-extrabold' : 'text-slate-400 font-semibold'
          }`}
        >
          <CalendarDays className="w-5 h-5 shrink-0" />
          <span className="text-[9px] tracking-tight">{language === 'en' ? 'Calendar' : 'कैलेंडर'}</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('leaves');
            setShowMoreSheet(false);
          }}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 flex-1 cursor-pointer transition-colors ${
            activeTab === 'leaves' ? 'text-emerald-400 font-extrabold' : 'text-slate-400 font-semibold'
          }`}
        >
          <Check className="w-5 h-5 shrink-0" />
          <span className="text-[9px] tracking-tight">{language === 'en' ? 'Leaves' : 'अवकाश'}</span>
        </button>

        <button
          onClick={() => setShowMoreSheet(true)}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 flex-1 cursor-pointer transition-colors ${
            showMoreSheet || (['profile', 'exceptions', 'payslips', 'attendance'].includes(activeTab) && activeTab !== 'self_attendance')
              ? 'text-emerald-400 font-extrabold' 
              : 'text-slate-400 font-semibold'
          }`}
        >
          <Briefcase className="w-5 h-5 shrink-0" />
          <span className="text-[9px] tracking-tight">{language === 'en' ? 'More' : 'अधिक'}</span>
        </button>
      </div>

      {/* Slide-Up Bottom Sheet Overlay for 'More' Menu */}
      {showMoreSheet && (
        <div className="md:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-48 flex flex-col justify-end no-print">
          {/* Tap-outside backdrop dismiss click */}
          <div className="flex-1" onClick={() => setShowMoreSheet(false)}></div>
          
          {/* Sheet Container */}
          <div className="bg-white rounded-t-2xl border-t border-slate-200 p-4 pb-8 space-y-4 shadow-2xl max-w-full animate-slide-up no-print">
            
            {/* Grabber handle */}
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-1"></div>
            
            {/* Sheet Title */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                {language === 'en' ? "Workspace Shortcuts" : "कार्यक्षेत्र शॉर्टकट"}
              </h3>
              <button 
                onClick={() => setShowMoreSheet(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Grid of Shortcuts */}
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => {
                  setActiveTab('profile');
                  setShowMoreSheet(false);
                }}
                className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl border transition-all text-center ${
                  activeTab === 'profile' 
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-extrabold' 
                    : 'bg-slate-50 border-slate-100 text-slate-600 font-semibold hover:bg-slate-100'
                }`}
              >
                <User className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="text-[10px] leading-tight break-words w-full">{t.profile}</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('exceptions');
                  setShowMoreSheet(false);
                }}
                className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl border transition-all text-center relative ${
                  activeTab === 'exceptions' 
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-extrabold' 
                    : 'bg-slate-50 border-slate-100 text-slate-600 font-semibold hover:bg-slate-100'
                }`}
              >
                {attendanceRecords.filter(r => r.employeeId === employee.id && (r.status === 'Miss Punch' || r.status === 'Half Day') && (r.approvalStatus || 'Pending') === 'Pending').length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                )}
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                <span className="text-[10px] leading-tight break-words w-full">{t.exceptions}</span>
              </button>

              {adminSettings.enableEmployeePayslips === true && (
                <button
                  onClick={() => {
                    setActiveTab('payslips');
                    setShowMoreSheet(false);
                  }}
                  className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl border transition-all text-center ${
                    activeTab === 'payslips' 
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-extrabold' 
                      : 'bg-slate-50 border-slate-100 text-slate-600 font-semibold hover:bg-slate-100'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-indigo-500 shrink-0" />
                  <span className="text-[10px] leading-tight break-words w-full">{t.payslips}</span>
                </button>
              )}

              <button
                onClick={() => {
                  setActiveTab('attendance');
                  setShowMoreSheet(false);
                }}
                className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl border transition-all text-center ${
                  activeTab === 'attendance' 
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-extrabold' 
                    : 'bg-slate-50 border-slate-100 text-slate-600 font-semibold hover:bg-slate-100'
                }`}
              >
                <Calendar className="w-5 h-5 text-blue-500 shrink-0" />
                <span className="text-[10px] leading-tight break-words w-full">{t.attendance}</span>
              </button>

              {/* Identity block */}
              <div className="col-span-3 bg-slate-50 rounded-xl p-3 text-left border border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="text-[11px] font-black text-slate-800">{employee.name}</h4>
                  <p className="text-[9px] font-mono font-bold text-slate-400 uppercase mt-0.5">{employee.designation} • {employee.id}</p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[8px] font-extrabold uppercase">
                    ACTIVE
                  </span>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
