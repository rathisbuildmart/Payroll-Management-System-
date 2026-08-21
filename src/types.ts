export interface Employee {
  id: string;
  name: string;
  department: string;
  designation: string;
  joiningDate: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  hourlyRate: number;
  paymentMethod: 'Bank Transfer' | 'Cash' | 'Cheque';
  isActive: boolean;
  password?: string; // Optional portal login password

  // Custom salary structures (recurring values)
  hra?: number;
  da?: number;
  conveyanceAllowance?: number;
  advanceSalaryBalance?: number; // Total loan/advance outstanding
  advanceSalaryDeduction?: number; // Repayment deduction amount per month
  clBalance?: number; // Casual Leave balance
  elBalance?: number; // Earned Leave balance

  // Personal Detail Custom Fields
  firstName?: string;
  lastName?: string;
  email?: string;
  mobileNo?: string;
  personalMobileNo?: string;
  personalEmail?: string;
  dob?: string;
  bloodGroup?: string;
  emergencyContactNo?: string;
  ctcOffered?: number;
  gender?: 'Male' | 'Female' | 'Other';
  employmentType?: 'Fresher' | 'Experienced';
  linkUser?: string;
  probationDate?: string;

  // Residential Address Custom Fields
  resLine1?: string;
  resLine2?: string;
  resCountry?: string;
  resState?: string;
  resCity?: string;
  resPinCode?: string;

  // Permanent Address Custom Fields
  permLine1?: string;
  permLine2?: string;
  permCountry?: string;
  permState?: string;
  permCity?: string;
  permPinCode?: string;

  // Bank Detail Custom Fields
  bankAccountNo?: string;
  bankAccountHolderName?: string;
  bankName?: string;
  ifscCode?: string;

  // Other Detail Custom Fields
  panNo?: string;
  pfAccountNo?: string;
  esicNo?: string;
  aadhaarNo?: string;
  uan?: string;

  // Employment Detail Custom Fields
  confirmationDate?: string;
  branch?: string;
  costCenter?: string;
  reportingTo?: string;
  noticePeriod?: string;
  workTiming?: string;
  employeeGroup?: string;
  weeklyOffProfile?: string;
  leaveType?: string;
  referenceNumber?: string;
  photoUrl?: string; // base64 or link
  increments?: SalaryIncrement[];
  nextIncrementDate?: string;

  // Employee-specific payroll rule applicability toggles
  isPfApplicable?: boolean;
  isEsicApplicable?: boolean;
  isPtApplicable?: boolean;
  isHraApplicable?: boolean;
  isDaApplicable?: boolean;
  isConveyanceApplicable?: boolean;
  isPaidLeaveApplicable?: boolean;
  enableGeofencing?: boolean;
  enableMobileAttendance?: boolean;
  isApproved?: boolean;
  approvedDeviceId?: string;
  allowMultipleDevices?: boolean;
  pendingDeviceApprovalCode?: string;
  pendingDeviceApprovalOtp?: string;
  loggedDevices?: Array<{
    deviceId: string;
    browser: string;
    lastUsed: string;
  }>;
}

export interface SalaryIncrement {
  id: string;
  date: string;       // YYYY-MM-DD
  amount: number;     // how much was the increment
  previousSalary: number;
  newSalary: number;
  remarks?: string;
}

export const getCurrentBasicSalary = (emp: Employee | null | undefined): number => {
  if (!emp) return 0;
  if (emp.increments && emp.increments.length > 0) {
    const sorted = [...emp.increments].sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return (Number(b.id) || 0) - (Number(a.id) || 0);
    });
    const latest = sorted[0];
    if (latest && typeof latest.newSalary === 'number' && latest.newSalary > 0) {
      return Math.max(emp.basicSalary || 0, latest.newSalary);
    }
  }
  return emp.basicSalary || 0;
};

export interface FieldSetting {
  id: keyof Employee;
  label: string;
  group: 'detail' | 'residential' | 'permanent' | 'bank' | 'other' | 'employment';
  isHidden: boolean;
  isMandatory: boolean;
}

export interface Holiday {
  occasion: string;
  hindiOccasion: string;
  type: string;
  hindiType: string;
  date: string;
  duration: string;
  hindiDuration: string;
  imgUrl?: string;
}

export interface UserRoleAccount {
  id: string;
  username: string;
  password?: string;
  role: UserRole;
  name: string;
  email?: string;
  mobileNo?: string;
  branch?: string; // Legacy single-branch
  branches?: string[]; // Multiple branch selection
  createdAt: string;
}

export interface GeofenceOutlet {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number; // Allowed distance in meters, e.g., 100
}

export interface AdminSettings {
  companyName: string;
  companyAddress: string;
  companyLogo?: string;
  currency: string;
  defaultCheckIn: string; // "09:00"
  defaultCheckOut: string; // "18:00"
  defaultOvertimeRate: number; // 150
  pfContributionRate: number; // 12
  esicContributionRate: number; // 0.75
  departments: string[];
  branches: string[];
  costCenters: string[];
  costCenterCodes?: Record<string, string>;
  employeeGroups: string[];
  workTimings: string[];
  weeklyOffProfiles: string[];
  leaveTypes: string[];
  fields: FieldSetting[];
  adminUsername?: string;
  adminPassword?: string;
  holidays?: Holiday[];
  enableHra?: boolean;
  enableDa?: boolean;
  enableConveyance?: boolean;
  enableProfessionalTax?: boolean;
  enablePaidLeaveCalculation?: boolean;
  paidLeaveStartAfterMonths?: number;
  roleAccounts?: UserRoleAccount[];
  rolePermissions?: Record<string, string[]>;
  roleColumnPermissions?: Record<string, string[]>;
  customRoles?: CustomRole[];
  enableEmployeePayslips?: boolean;
  geofenceOutlets?: GeofenceOutlet[];
  enableGeofencing?: boolean;
  enableMobileAttendance?: boolean;
  smtpHost?: string;
  smtpPort?: number;
  smtpUsername?: string;
  smtpPassword?: string;
  senderName?: string;
  senderEmail?: string;
  enablePasswordLoginOtp?: boolean;
  enableAdminWelcomePopup?: boolean;
  // Recruitment & Hiring Settings
  recruitmentAutoNotify?: boolean;
  defaultInterviewVenue?: string;
  defaultInterviewTime?: string;
  jobOpeningsList?: string[];
  // WhatsApp & Email Automation Settings
  whatsappUsername?: string;
  whatsappPassword?: string;
  whatsappSenderNo?: string;
  enableWhatsappAutomation?: boolean;
  whatsappTemplates?: {
    payslip?: string;
    missPunch?: string;
    leaveStatus?: string;
    lateWarning?: string;
    salaryDisbursed?: string;
    customNotice?: string;
    [key: string]: string | undefined;
  };
  emailTemplates?: {
    payslipSubject?: string;
    payslipBody?: string;
    missPunchSubject?: string;
    missPunchBody?: string;
    leaveSubject?: string;
    leaveBody?: string;
    [key: string]: string | undefined;
  };
  customMessageTemplates?: Array<{
    id: string;
    name: string;
    category: 'whatsapp' | 'email' | 'both';
    purpose?: string;
    whatsappBody?: string;
    emailSubject?: string;
    emailBody?: string;
    createdAt?: string;
  }>;
  // Dynamic HR, IT & Timings settings for Login subtabs
  hrContactEmail?: string;
  hrContactPhone?: string;
  hrContactManager?: string;
  itContactEmail?: string;
  itContactPhone?: string;
  itContactManager?: string;
  rulesShiftTiming?: string;
  rulesHalfDaySlot?: string;
  rulesLatePunchGrace?: string;
  // Archive & Database Storage Optimization Settings
  autoArchiveLeftEmployees?: boolean;
  autoArchiveRejectedCandidates?: boolean;
  employeeArchiveRetentionDays?: number; // 0, 4, 7, 15, 30, 60, 90
  candidateArchiveRetentionDays?: number; // 0, 4, 7, 15, 30, 60, 90
  attendanceArchiveRetentionDays?: number; // 4, 7, 15, 30, 60, 90, 180, 365
  autoTransferDueArchivesOnLoad?: boolean;
  archiveHistoryLogs?: ArchiveHistoryLog[];
  archiveSpreadsheetId?: string;
  archiveSpreadsheetName?: string;
  archiveSpreadsheetLink?: string;
  useDedicatedArchiveSheet?: boolean;
  // Attendance Lock & HR Access Permission Settings
  attendanceLockSettings?: {
    isLocked: boolean; // Default true: Attendance editing requires approval
    hrDirectAccessEnabled?: boolean; // Admin can toggle HR direct edit access
    hrAccessExpiresAt?: string; // Optional expiry timestamp for timed access (ISO string)
    hrAccessGrantedBy?: string;
    hrAccessGrantedAt?: string;
    requireReasonAndRemarks?: boolean; // Always record reason & remarks for audit
  };
  // Time-Bound Employee Dashboard Salary Visibility Settings
  salaryVisibilitySettings?: {
    enabled?: boolean; // Default true: show latest calculated salary breakdown on employee dashboard
    visibilityDurationDays?: number; // Days to keep visible after payroll cycle (e.g. 3, 5, 7, 10, 15, 30; 0 for permanent)
    autoHideAfterDays?: boolean; // Auto hide breakdown once time limit duration expires
    showEarningsAndDeductionsBreakdown?: boolean; // Show itemized gross vs deductions
    customNoticeWhenExpired?: string; // Optional custom message to display once expired
  };
  // Employee Portal Profile Section Visibility Access Settings
  employeeProfileVisibility?: {
    showSalaryStructure?: boolean; // Standard Salary Structure
    showBankDetails?: boolean; // Bank Account Details
    showStatutoryIds?: boolean; // Statutory Registry & IDs (PAN, Aadhaar, UAN, PF)
    showPersonalInfo?: boolean; // Personal & Contact Information
    showAddresses?: boolean; // Residential & Permanent Addresses
  };
}

export interface EmployeeProfileVisibilitySettings {
  showSalaryStructure?: boolean;
  showBankDetails?: boolean;
  showStatutoryIds?: boolean;
  showPersonalInfo?: boolean;
  showAddresses?: boolean;
}

export interface AttendanceChangeRequest {
  id: string;
  attendanceDate: string; // YYYY-MM-DD
  employeeId: string;
  employeeName: string;
  department?: string;
  branch?: string;
  designation?: string;
  currentStatus: Attendance['status'];
  currentCheckIn: string;
  currentCheckOut: string;
  currentOvertimeHours: number;
  requestedStatus: Attendance['status'];
  requestedCheckIn: string;
  requestedCheckOut: string;
  requestedOvertimeHours: number;
  reason: string; // e.g. "Biometric Machine Issue", "Forgot to Punch", "Official Duty (OD)", "Manager Manual Approval", "Medical Reason", "Other"
  remarks: string;
  requestedByUsername: string;
  requestedByName: string;
  requestedByRole: string;
  requestedAt: string; // ISO String
  status: 'Pending' | 'Approved' | 'Rejected';
  actionType?: 'change_request' | 'direct_admin_edit';
  reviewedBy?: string;
  reviewedByRole?: string;
  reviewedAt?: string;
  reviewerRemarks?: string;
}

export interface Attendance {
  date: string; // YYYY-MM-DD
  employeeId: string;
  status: 'Present' | 'Absent' | 'Half Day' | 'Leave' | 'Miss Punch';
  checkIn: string; // HH:MM
  checkOut: string; // HH:MM
  overtimeHours: number;
  remarks: string;
  approvalStatus?: 'Pending' | 'Approved' | 'Rejected';
  punchInOutlet?: string;
  punchOutOutlet?: string;
  punchInCoords?: string;
  punchOutCoords?: string;
  punchInDevice?: string;
  punchOutDevice?: string;
}

export interface PayrollRecord {
  monthYear: string; // YYYY-MM
  employeeId: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  overtimePay: number;
  totalSalary: number; // Gross total salary (Basic + Allowances + Bonuses + Overtime)
  paymentDate: string; // YYYY-MM-DD or empty
  paymentStatus: 'Paid' | 'Pending';

  // Custom structures detail breakdown
  hra?: number;
  da?: number;
  conveyanceAllowance?: number;
  festivalBonus?: number;
  performanceIncentive?: number;
  leaveAdjustment?: number; // Paid leaves salary re-add/adjustment
  advanceDeduction?: number; // Monthly advance deduction
  tds?: number; // Tax Deducted at Source
  professionalTax?: number; // Professional Tax
  providentFund?: number; // PF deduction
  esic?: number; // ESIC deduction
  netSalary?: number; // Net payable salary (Gross - Deductions - Advance - TDS - PT - PF - ESIC)
  oneTimeRefundAmount?: number; // Month-wise installment refund amount (e.g. for Uniform/Tour)
  lateEarlyDays?: number; // Total days with late arrival or early going
  attendanceFine?: number; // Fine calculated for late/early going above free 3 days
}

export interface OneTimeDeduction {
  id: string;
  employeeId: string;
  type: 'Uniform' | 'Tour' | 'Other';
  totalAmount: number;
  monthlyRefundInstallment: number;
  refundedAmount: number; // Sum of what has been paid back so far
  description?: string;
  createdAt: string; // YYYY-MM-DD
  status: 'Pending' | 'Partially Refunded' | 'Fully Refunded';
}

export interface SyncLog {
  id: string;
  timestamp: string;
  operation: string;
  status: 'success' | 'error' | 'syncing';
  details: string;
}

export interface FailedLoginAttempt {
  id: string;
  enteredId: string;
  timestamp: string; // ISO string
  reason: 'Incorrect Password' | 'User ID not found' | 'Admin Incorrect Password' | 'Account pending approval' | 'Device lock active';
  browserInfo?: string;
  ipAddress?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorUsername: string;
  actorRole: string;
  employeeId: string;
  employeeName: string;
  date: string;
  actionType: 'create' | 'update' | 'approve' | 'reject' | 'delete_logs';
  fieldChanged: string;
  oldValue: string;
  newValue: string;
  remarks?: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: 'Vacation' | 'Sick' | 'Casual' | 'Half Day (Before Lunch)' | 'Half Day (After Lunch)' | 'Late Coming' | 'Early Going';
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  durationDays: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  appliedOn: string; // YYYY-MM-DD
  approvedBy?: string;
  remarks?: string;
}

export interface TransactionalEmailLog {
  id: string;
  recipientEmail: string;
  recipientName?: string;
  type: 'OTP' | 'Welcome Message' | 'Leave Update' | 'SMTP Test' | 'Payslip' | 'Custom Notice';
  subject: string;
  status: 'Sent (SMTP)' | 'Simulated' | 'Failed';
  sentAt: string; // ISO String
  otpCode?: string;
  purpose?: string;
  method?: 'SMTP' | 'SIMULATION' | 'Direct';
  errorMessage?: string;
  senderEmail?: string;
  bodyPreview?: string;
}

// Phase 2 — Hiring (Recruitment & Onboarding)
export interface JobPosting {
  id: string;
  title: string;
  department: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
  openings: number;
  status: 'Open' | 'Closed' | 'Draft' | 'On Hold';
  postedDate: string;
  description: string;
  requirements?: string;
  targetCtcMin?: number;
  targetCtcMax?: number;
  hiringManager?: string;
  urgency?: 'High' | 'Medium' | 'Low';
  experienceLevel?: string;
  directorName?: string;
  targetDate?: string;
}

export interface CandidateFollowUp {
  id: string;
  candidateId: string;
  candidateName: string;
  timestamp: string; // ISO string or format
  date: string; // YYYY-MM-DD
  time?: string;
  round: 'First Round' | 'Second Round' | 'HR Interview' | 'Director Interview' | 'Technical Round' | 'Final Round' | 'Screening' | string;
  interviewType: 'Telephonic' | 'Physical' | 'Online';
  interviewer?: string;
  stageAtTime: Candidate['stage'];
  discussionSummary: string; // What was discussed with candidate ("kya baat hua hai")
  nextFollowUpDate?: string;
  conductedBy?: string;
}

export interface Candidate {
  id: string;
  jobId?: string;
  jobTitle?: string;
  name: string;
  email: string;
  phone: string;
  experienceYears: number;
  stage: 'Applied' | 'Screening' | 'HR Interview' | 'Director Interview' | 'Interview' | 'Offered' | 'Hired' | 'Rejected';
  appliedDate: string;
  interviewDate?: string;
  interviewTime?: string;
  interviewType?: 'Telephonic' | 'Physical' | 'Online';
  interviewRound?: 'First Round' | 'Second Round' | 'HR Interview' | 'Director Interview' | 'Technical Round' | 'Final Round';
  interviewerName?: string;
  interviewVenue?: string;
  resumeUrl?: string;
  notes?: string;
  expectedSalary?: number;
  gender?: string;
  highestEducation?: string;
  hrName?: string;
  location?: string;
  source?: string;
  rejectionReason?: string;
  rejectedDate?: string;
  isArchived?: boolean;
  followUpHistory?: CandidateFollowUp[];
}

export interface OnboardingTask {
  id: string;
  employeeId: string;
  employeeName: string;
  taskName: string;
  category: 'Documents' | 'IT Setup' | 'HR Orientation' | 'Training' | 'Asset Handover';
  dueDate: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  assignedTo?: string;
  completedDate?: string;
}

export interface OfferLetter {
  id: string;
  candidateName: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  offeredCtc: number;
  joiningDate: string;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Declined';
  issuedDate: string;
  termsNotes?: string;
}

// Phase 3 — Employee Lifecycle (Performance, Assets, Transfer & Promotion)
export interface PerformanceReview {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  reviewPeriod: string;
  rating: number; // 1-5
  keyAchievements: string;
  areasOfImprovement: string;
  goalsForNextPeriod: string;
  reviewerName: string;
  reviewDate: string;
  status: 'Draft' | 'Submitted' | 'Approved';
}

export interface AssetMaintenanceLog {
  id: string;
  assetId: string;
  issueDescription: string;
  loggedDate: string;
  vendorName?: string;
  cost?: number;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Scrapped';
  resolvedDate?: string;
  notes?: string;
}

export interface AssetAllocationHistory {
  id: string;
  assetId: string;
  employeeId: string;
  employeeName: string;
  assignedDate: string;
  returnedDate?: string;
  assignedCondition: string;
  returnedCondition?: string;
  handoverNotes?: string;
  returnNotes?: string;
  status: 'Active' | 'Returned';
}

export interface CompanyAsset {
  id: string;
  assetTag: string;
  name: string;
  category: 'Laptop' | 'Mobile Phone' | 'Tablet' | 'Vehicle' | 'ID Card / Key' | 'Peripheral' | 'Furniture' | 'Tools / Machinery' | 'Other';
  serialNumber: string;
  brand?: string;
  model?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  warrantyExpiryDate?: string;
  vendorName?: string;
  branch?: string;
  assignedToEmployeeId?: string;
  assignedToEmployeeName?: string;
  assignedDate?: string;
  expectedReturnDate?: string;
  condition: 'New' | 'Good' | 'Damaged' | 'In Repair';
  status: 'Available' | 'Assigned' | 'Maintenance' | 'Scrapped';
  notes?: string;
  maintenanceLogs?: AssetMaintenanceLog[];
  allocationHistory?: AssetAllocationHistory[];
}

export interface TransferPromotionRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'Transfer' | 'Promotion' | 'Transfer & Promotion' | 'Salary Revision';
  currentDepartment: string;
  newDepartment: string;
  currentDesignation: string;
  newDesignation: string;
  currentSalary: number;
  newSalary: number;
  effectiveDate: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  approvedBy?: string;
  reason?: string;
  createdDate: string;
}

// Phase 5 — Exit (Exit Management & Exit Clearance)
export interface ClearanceTaskItem {
  id: string;
  title: string;
  department: 'IT' | 'HR' | 'Finance' | 'Operations' | 'Admin' | 'Security' | 'Store';
  assignedTo?: string;
  status: 'Pending' | 'Completed' | 'Waived';
  completedAt?: string;
  completedBy?: string;
  notes?: string;
  requiredForFnF?: boolean;
}

export interface ExitRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
  resignationDate: string;
  lastWorkingDay: string;
  reason: 'Better Opportunity' | 'Personal Reasons' | 'Relocation' | 'Higher Studies' | 'Health' | 'Performance / Termination' | 'Other';
  status: 'Resigned' | 'In Clearance' | 'FnF Completed' | 'Relieved' | 'Rejected';
  noticePeriodDays: number;
  exitInterviewNotes?: string;
  clearance: {
    departmentManager: boolean;
    itAssets: boolean;
    financeDues: boolean;
    hrDocuments: boolean;
  };
  customChecklist?: ClearanceTaskItem[];
  completionNotified?: boolean;
  completionNotificationDate?: string;
  fnfAmount?: number;
  fnfStatus?: 'Pending' | 'Approved' | 'Paid';
  relievingLetterIssued: boolean;
  createdDate: string;
}

export interface ArchivedEmployeeRecord {
  id: string;
  name: string;
  department: string;
  designation: string;
  joiningDate: string;
  leavingDate?: string;
  exitReason?: string;
  archivedAt: string;
  archivedBy?: string;
  employeeData: Employee;
}

export interface ArchivedCandidateRecord {
  id: string;
  name: string;
  jobTitle?: string;
  phone: string;
  email: string;
  stage: string;
  rejectionReason?: string;
  archivedAt: string;
  archivedBy?: string;
  candidateData: Candidate;
}

export interface ArchiveHistoryLog {
  id: string;
  timestamp: string;
  type: 'employees' | 'candidates' | 'attendance' | 'all';
  count: number;
  performedBy: string;
  details: string;
}

export interface CustomRole {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
  isCustom?: boolean;
}

export type UserRole = 
  | 'super_admin' 
  | 'admin' 
  | 'hr' 
  | 'asset_manager'
  | 'recruiter' 
  | 'branch_manager' 
  | 'director' 
  | 'sub_admin' 
  | 'employee'
  | (string & {});

export interface PortalUser {
  id: string;
  name: string;
  role: UserRole;
  employee?: Employee;
  branch?: string;
  branches?: string[];
  isPrimarySuperAdmin?: boolean;
}


