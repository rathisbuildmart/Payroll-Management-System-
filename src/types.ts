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
}

export interface SalaryIncrement {
  id: string;
  date: string;       // YYYY-MM-DD
  amount: number;     // how much was the increment
  previousSalary: number;
  newSalary: number;
  remarks?: string;
}

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
  reason: 'Incorrect Password' | 'User ID not found' | 'Admin Incorrect Password';
  browserInfo?: string;
  ipAddress?: string;
}
