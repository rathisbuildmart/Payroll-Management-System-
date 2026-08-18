import { Employee, Attendance, PayrollRecord, AdminSettings, JobPosting, Candidate, CandidateFollowUp, CompanyAsset, ArchivedEmployeeRecord, ArchivedCandidateRecord, ArchiveHistoryLog } from '../types';

const SPREADSHEET_NAME = 'Payroll_Management_System_Data';

//Helper to convert index to Column Letter (e.g., 0 -> A, 25 -> Z, 26 -> AA, 27 -> AB...)
function getColumnLetter(colIndex: number): string {
  let temp = colIndex;
  let letter = '';
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

//Full specifications of Google Sheet columns
export const EMPLOYEE_COLUMNS: { key: keyof Employee; header: string }[] = [
  { key: 'id', header: 'ID' },
  { key: 'name', header: 'Name' },
  { key: 'department', header: 'Department' },
  { key: 'designation', header: 'Designation' },
  { key: 'joiningDate', header: 'Joining Date' },
  { key: 'basicSalary', header: 'Basic Salary' },
  { key: 'allowances', header: 'Allowances' },
  { key: 'deductions', header: 'Deductions' },
  { key: 'hourlyRate', header: 'Hourly Rate' },
  { key: 'paymentMethod', header: 'Payment Method' },
  { key: 'isActive', header: 'Is Active' },
  { key: 'password', header: 'Password' },
  { key: 'hra', header: 'HRA' },
  { key: 'da', header: 'DA' },
  { key: 'conveyanceAllowance', header: 'Conveyance Allowance' },
  { key: 'advanceSalaryBalance', header: 'Advance Salary Balance' },
  { key: 'advanceSalaryDeduction', header: 'Advance Salary Deduction' },
  { key: 'clBalance', header: 'CL Balance' },
  { key: 'elBalance', header: 'EL Balance' },
  { key: 'firstName', header: 'First Name' },
  { key: 'lastName', header: 'Last Name' },
  { key: 'email', header: 'Email' },
  { key: 'mobileNo', header: 'Mobile No' },
  { key: 'personalMobileNo', header: 'Personal Mobile No' },
  { key: 'personalEmail', header: 'Personal Email' },
  { key: 'dob', header: 'DOB' },
  { key: 'bloodGroup', header: 'Blood Group' },
  { key: 'emergencyContactNo', header: 'Emergency Contact No' },
  { key: 'ctcOffered', header: 'CTC Offered' },
  { key: 'gender', header: 'Gender' },
  { key: 'employmentType', header: 'Employment Type' },
  { key: 'linkUser', header: 'Link User' },
  { key: 'probationDate', header: 'Probation Date' },
  { key: 'resLine1', header: 'Res Address Line 1' },
  { key: 'resLine2', header: 'Res Address Line 2' },
  { key: 'resCountry', header: 'Res Country' },
  { key: 'resState', header: 'Res State' },
  { key: 'resCity', header: 'Res City' },
  { key: 'resPinCode', header: 'Res Pin Code' },
  { key: 'permLine1', header: 'Perm Address Line 1' },
  { key: 'permLine2', header: 'Perm Address Line 2' },
  { key: 'permCountry', header: 'Perm Country' },
  { key: 'permState', header: 'Perm State' },
  { key: 'permCity', header: 'Perm City' },
  { key: 'permPinCode', header: 'Perm Pin Code' },
  { key: 'bankAccountNo', header: 'Bank Account No' },
  { key: 'bankAccountHolderName', header: 'Bank Account Holder Name' },
  { key: 'bankName', header: 'Bank Name' },
  { key: 'ifscCode', header: 'IFSC Code' },
  { key: 'panNo', header: 'PAN No' },
  { key: 'pfAccountNo', header: 'PF Account No' },
  { key: 'esicNo', header: 'ESIC No' },
  { key: 'aadhaarNo', header: 'Aadhaar No' },
  { key: 'uan', header: 'UAN' },
  { key: 'confirmationDate', header: 'Confirmation Date' },
  { key: 'branch', header: 'Branch' },
  { key: 'costCenter', header: 'Cost Center' },
  { key: 'reportingTo', header: 'Reporting To' },
  { key: 'noticePeriod', header: 'Notice Period' },
  { key: 'workTiming', header: 'Work Timing' },
  { key: 'employeeGroup', header: 'Employee Group' },
  { key: 'weeklyOffProfile', header: 'Weekly Off Profile' },
  { key: 'leaveType', header: 'Leave Type' },
  { key: 'referenceNumber', header: 'Reference Number' },
  { key: 'photoUrl', header: 'Photo URL' },
  { key: 'increments', header: 'Increments' },
  { key: 'nextIncrementDate', header: 'Next Increment Date' }
];

export const ATTENDANCE_COLUMNS: { key: keyof Attendance; header: string }[] = [
  { key: 'date', header: 'Date' },
  { key: 'employeeId', header: 'Employee ID' },
  { key: 'status', header: 'Status' },
  { key: 'checkIn', header: 'Check In' },
  { key: 'checkOut', header: 'Check Out' },
  { key: 'overtimeHours', header: 'Overtime Hours' },
  { key: 'remarks', header: 'Remarks' },
  { key: 'approvalStatus', header: 'Approval Status' }
];

export const PAYROLL_COLUMNS: { key: keyof PayrollRecord; header: string }[] = [
  { key: 'monthYear', header: 'Month Year' },
  { key: 'employeeId', header: 'Employee ID' },
  { key: 'basicSalary', header: 'Basic Salary' },
  { key: 'allowances', header: 'Allowances' },
  { key: 'deductions', header: 'Deductions' },
  { key: 'overtimePay', header: 'Overtime Pay' },
  { key: 'totalSalary', header: 'Total Salary' },
  { key: 'paymentDate', header: 'Payment Date' },
  { key: 'paymentStatus', header: 'Payment Status' },
  { key: 'hra', header: 'HRA' },
  { key: 'da', header: 'DA' },
  { key: 'conveyanceAllowance', header: 'Conveyance Allowance' },
  { key: 'festivalBonus', header: 'Festival Bonus' },
  { key: 'performanceIncentive', header: 'Performance Incentive' },
  { key: 'leaveAdjustment', header: 'Leave Adjustment' },
  { key: 'advanceDeduction', header: 'Advance Deduction' },
  { key: 'tds', header: 'TDS' },
  { key: 'professionalTax', header: 'Professional Tax' },
  { key: 'providentFund', header: 'Provident Fund' },
  { key: 'esic', header: 'ESIC' },
  { key: 'netSalary', header: 'Net Salary' },
  { key: 'oneTimeRefundAmount', header: 'One Time Refund Amount' },
  { key: 'lateEarlyDays', header: 'Late Early Days' },
  { key: 'attendanceFine', header: 'Attendance Fine' }
];

//Helper to check response
async function checkResponse(res: Response, errorMsg: string) {
  if (!res.ok) {
    const errorText = await res.text();
    console.error(`API Error: ${errorText}`);
    throw new Error(`${errorMsg}: ${res.statusText} (${res.status})`);
  }
}

/**
 * Searches for our spreadsheet in Google Drive.
 * Returns the spreadsheet ID or null if not found.
 */
export async function findSpreadsheet(token: string): Promise<string | null> {
  const query = encodeURIComponent(`name = '${SPREADSHEET_NAME}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`);
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink)`;
  
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
  await checkResponse(res, 'Failed to search Google Drive');
  const data = await res.json();
  
  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }
  return null;
}

/**
 * Retrieves the spreadsheet link.
 */
export async function getSpreadsheetLink(spreadsheetId: string, token: string): Promise<string> {
  const url = `https://www.googleapis.com/drive/v3/files/${spreadsheetId}?fields=webViewLink`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (res.ok) {
    const data = await res.json();
    return data.webViewLink;
  }
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
}

/**
 * Creates a new Spreadsheet with the standard sheets: Employees, Attendance, Payroll_History, and Settings.
 */
export async function createSpreadsheet(token: string): Promise<string> {
  const url = 'https://sheets.googleapis.com/v4/spreadsheets';
  const body = {
    properties: {
      title: SPREADSHEET_NAME,
    },
    sheets: [
      { properties: { title: 'Employees' } },
      { properties: { title: 'Attendance' } },
      { properties: { title: 'Payroll_History' } },
      { properties: { title: 'Settings' } },
    ],
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  await checkResponse(res, 'Failed to create Google Sheet');
  const data = await res.json();
  const spreadsheetId = data.spreadsheetId;

  //Initialize headers
  await initHeaders(spreadsheetId, token);

  return spreadsheetId;
}

/**
 * Initialize headers for all sheets dynamically based on columns specifications
 */
export async function initHeaders(spreadsheetId: string, token: string) {
  //Safe check to ensure the 'Settings' sheet exists in the spreadsheet
  try {
    const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`;
    const metaRes = await fetch(metaUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (metaRes.ok) {
      const metaData = await metaRes.json();
      const sheetTitles = metaData.sheets?.map((s: any) => s.properties?.title) || [];
      if (!sheetTitles.includes('Settings')) {
        const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
        await fetch(updateUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: [
              {
                addSheet: {
                  properties: { title: 'Settings' }
                }
              }
            ]
          })
        });
      }
    }
  } catch (e) {
    console.warn('Failed to ensure Settings sheet exists:', e);
  }

  const employeeHeaders = [...EMPLOYEE_COLUMNS.map(c => c.header), 'Metadata'];
  const attendanceHeaders = [...ATTENDANCE_COLUMNS.map(c => c.header), 'Metadata'];
  const payrollHeaders = [...PAYROLL_COLUMNS.map(c => c.header), 'Metadata'];

  const empEndLetter = getColumnLetter(employeeHeaders.length - 1);
  const attEndLetter = getColumnLetter(attendanceHeaders.length - 1);
  const payEndLetter = getColumnLetter(payrollHeaders.length - 1);

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;
  const body = {
    valueInputOption: 'USER_ENTERED',
    data: [
      {
        range: `Employees!A1:${empEndLetter}1`,
        values: [employeeHeaders],
      },
      {
        range: `Attendance!A1:${attEndLetter}1`,
        values: [attendanceHeaders],
      },
      {
        range: `Payroll_History!A1:${payEndLetter}1`,
        values: [payrollHeaders],
      },
    ],
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  await checkResponse(res, 'Failed to initialize Google Sheet headers');
}

/**
 * Reads Employees from the Google Sheet
 */
export async function fetchEmployees(spreadsheetId: string, token: string): Promise<Employee[]> {
  const empEndLetter = getColumnLetter(EMPLOYEE_COLUMNS.length); //includes Metadata
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Employees!A1:${empEndLetter}2000`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  await checkResponse(res, 'Failed to fetch employees from Google Sheets');
  const data = await res.json();
  const rows = data.values || [];
  if (rows.length === 0) return [];

  //Match headers to support both old and new layouts seamlessly
  const headers: string[] = rows[0] || [];
  const dataRows = rows.slice(1);

  const indexToKeyMap: { [index: number]: keyof Employee } = {};
  let metadataColIdx = -1;

  headers.forEach((header, idx) => {
    const trimmedHeader = String(header).trim().toLowerCase();
    if (trimmedHeader === 'metadata') {
      metadataColIdx = idx;
      return;
    }
    const col = EMPLOYEE_COLUMNS.find(c => 
      c.header.trim().toLowerCase() === trimmedHeader || 
      c.key.toLowerCase() === trimmedHeader.replace(/[^a-z0-9]/gi, '')
    );
    if (col) {
      indexToKeyMap[idx] = col.key;
    }
  });

  return dataRows.map((row: any[]) => {
    const emp: any = {
      id: '',
      name: '',
      department: '',
      designation: '',
      joiningDate: '',
      basicSalary: 0,
      allowances: 0,
      deductions: 0,
      hourlyRate: 0,
      paymentMethod: 'Bank Transfer',
      isActive: true,
    };

    row.forEach((val, idx) => {
      if (val === undefined || val === null || val === '') {
        return;
      }
      const key = indexToKeyMap[idx];
      if (!key) return;

      const numericFields: (keyof Employee)[] = [
        'basicSalary', 'allowances', 'deductions', 'hourlyRate', 'hra', 'da', 
        'conveyanceAllowance', 'advanceSalaryBalance', 'advanceSalaryDeduction', 
        'clBalance', 'elBalance', 'ctcOffered'
      ];

      if (numericFields.includes(key)) {
        emp[key] = Number(val) || 0;
      } else if (key === 'isActive') {
        emp[key] = val === 'TRUE' || val === true || String(val).toUpperCase() === 'TRUE';
      } else if (key === 'increments') {
        try {
          emp[key] = typeof val === 'string' ? JSON.parse(val) : val;
        } catch (e) {
          emp[key] = [];
        }
      } else {
        emp[key] = val;
      }
    });

    //Merge legacy or additional metadata from the JSON column if available
    if (metadataColIdx !== -1 && row[metadataColIdx]) {
      try {
        const metadata = JSON.parse(row[metadataColIdx]);
        Object.assign(emp, metadata);
      } catch (e) {
        console.error('Failed to parse metadata column for employee:', emp.id, e);
      }
    }

    return emp as Employee;
  }).filter((emp: Employee) => emp.id);
}

/**
 * Reads Attendance from the Google Sheet
 */
export async function fetchAttendance(spreadsheetId: string, token: string): Promise<Attendance[]> {
  const attEndLetter = getColumnLetter(ATTENDANCE_COLUMNS.length); //includes Metadata
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Attendance!A1:${attEndLetter}10000`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  await checkResponse(res, 'Failed to fetch attendance from Google Sheets');
  const data = await res.json();
  const rows = data.values || [];
  if (rows.length === 0) return [];

  const headers: string[] = rows[0] || [];
  const dataRows = rows.slice(1);

  const indexToKeyMap: { [index: number]: keyof Attendance } = {};
  let metadataColIdx = -1;

  headers.forEach((header, idx) => {
    const trimmedHeader = String(header).trim().toLowerCase();
    if (trimmedHeader === 'metadata') {
      metadataColIdx = idx;
      return;
    }
    const col = ATTENDANCE_COLUMNS.find(c => 
      c.header.trim().toLowerCase() === trimmedHeader || 
      c.key.toLowerCase() === trimmedHeader.replace(/[^a-z0-9]/gi, '')
    );
    if (col) {
      indexToKeyMap[idx] = col.key;
    }
  });

  return dataRows.map((row: any[]) => {
    const att: any = {
      date: '',
      employeeId: '',
      status: 'Present',
      checkIn: '',
      checkOut: '',
      overtimeHours: 0,
      remarks: ''
    };

    row.forEach((val, idx) => {
      if (val === undefined || val === null || val === '') {
        return;
      }
      const key = indexToKeyMap[idx];
      if (!key) return;

      if (key === 'overtimeHours') {
        att[key] = Number(val) || 0;
      } else {
        att[key] = val;
      }
    });

    if (metadataColIdx !== -1 && row[metadataColIdx]) {
      try {
        const metadata = JSON.parse(row[metadataColIdx]);
        Object.assign(att, metadata);
      } catch (e) {
        console.error('Failed to parse attendance metadata:', e);
      }
    }

    return att as Attendance;
  }).filter((att: Attendance) => att.date && att.employeeId);
}

/**
 * Reads Payroll Records from the Google Sheet
 */
export async function fetchPayrollHistory(spreadsheetId: string, token: string): Promise<PayrollRecord[]> {
  const payEndLetter = getColumnLetter(PAYROLL_COLUMNS.length); //includes Metadata
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Payroll_History!A1:${payEndLetter}5000`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  await checkResponse(res, 'Failed to fetch payroll history from Google Sheets');
  const data = await res.json();
  const rows = data.values || [];
  if (rows.length === 0) return [];

  const headers: string[] = rows[0] || [];
  const dataRows = rows.slice(1);

  const indexToKeyMap: { [index: number]: keyof PayrollRecord } = {};
  let metadataColIdx = -1;

  headers.forEach((header, idx) => {
    const trimmedHeader = String(header).trim().toLowerCase();
    if (trimmedHeader === 'metadata') {
      metadataColIdx = idx;
      return;
    }
    const col = PAYROLL_COLUMNS.find(c => 
      c.header.trim().toLowerCase() === trimmedHeader || 
      c.key.toLowerCase() === trimmedHeader.replace(/[^a-z0-9]/gi, '')
    );
    if (col) {
      indexToKeyMap[idx] = col.key;
    }
  });

  return dataRows.map((row: any[]) => {
    const pay: any = {
      monthYear: '',
      employeeId: '',
      basicSalary: 0,
      allowances: 0,
      deductions: 0,
      overtimePay: 0,
      totalSalary: 0,
      paymentDate: '',
      paymentStatus: 'Pending'
    };

    row.forEach((val, idx) => {
      if (val === undefined || val === null || val === '') {
        return;
      }
      const key = indexToKeyMap[idx];
      if (!key) return;

      const numericFields: (keyof PayrollRecord)[] = [
        'basicSalary', 'allowances', 'deductions', 'overtimePay', 'totalSalary',
        'hra', 'da', 'conveyanceAllowance', 'festivalBonus', 'performanceIncentive',
        'leaveAdjustment', 'advanceDeduction', 'tds', 'professionalTax', 'providentFund',
        'esic', 'netSalary'
      ];
      
      if (numericFields.includes(key)) {
        pay[key] = Number(val) || 0;
      } else {
        pay[key] = val;
      }
    });

    if (metadataColIdx !== -1 && row[metadataColIdx]) {
      try {
        const metadata = JSON.parse(row[metadataColIdx]);
        Object.assign(pay, metadata);
      } catch (e) {
        console.error('Failed to parse payroll metadata:', e);
      }
    }

    return pay as PayrollRecord;
  }).filter((pay: PayrollRecord) => pay.monthYear && pay.employeeId);
}

/**
 * Saves all Employees back to the sheet with explicit columns
 */
export async function saveEmployees(spreadsheetId: string, employees: Employee[], token: string): Promise<void> {
  const empEndLetter = getColumnLetter(EMPLOYEE_COLUMNS.length); //includes Metadata
  const clearRange = `Employees!A2:${empEndLetter}2000`;
  const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${clearRange}:clear`;
  await fetch(clearUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });

  if (employees.length === 0) return;

  const saveRange = `Employees!A2:${empEndLetter}${employees.length + 1}`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${saveRange}?valueInputOption=USER_ENTERED`;
  
  const values = employees.map(emp => {
    const row: any[] = [];
    const mappedKeys = new Set(EMPLOYEE_COLUMNS.map(c => c.key));
    
    EMPLOYEE_COLUMNS.forEach((col) => {
      const val = (emp as any)[col.key];
      if (val === undefined || val === null) {
        row.push('');
      } else if (col.key === 'isActive') {
        row.push(val ? 'TRUE' : 'FALSE');
      } else if (col.key === 'increments') {
        row.push(JSON.stringify(val));
      } else {
        row.push(val);
      }
    });

    //Residual fields that are not defined in the schema go to Metadata column
    const metadata: any = {};
    Object.keys(emp).forEach(key => {
      if (!mappedKeys.has(key as keyof Employee)) {
        metadata[key] = (emp as any)[key];
      }
    });

    row.push(Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : '');
    return row;
  });

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      range: saveRange,
      majorDimension: 'ROWS',
      values,
    }),
  });

  await checkResponse(res, 'Failed to save employees to Google Sheets');
}

/**
 * Saves all Attendance records back to the sheet with explicit columns
 */
export async function saveAttendance(spreadsheetId: string, attendance: Attendance[], token: string): Promise<void> {
  const attEndLetter = getColumnLetter(ATTENDANCE_COLUMNS.length); //includes Metadata
  const clearRange = `Attendance!A2:${attEndLetter}10000`;
  const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${clearRange}:clear`;
  await fetch(clearUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });

  if (attendance.length === 0) return;

  const saveRange = `Attendance!A2:${attEndLetter}${attendance.length + 1}`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${saveRange}?valueInputOption=USER_ENTERED`;
  const values = attendance.map(att => {
    const row: any[] = [];
    const mappedKeys = new Set(ATTENDANCE_COLUMNS.map(c => c.key));

    ATTENDANCE_COLUMNS.forEach((col) => {
      const val = (att as any)[col.key];
      if (val === undefined || val === null) {
        row.push('');
      } else {
        row.push(val);
      }
    });

    const metadata: any = {};
    Object.keys(att).forEach(key => {
      if (!mappedKeys.has(key as keyof Attendance)) {
        metadata[key] = (att as any)[key];
      }
    });

    row.push(Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : '');
    return row;
  });

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      range: saveRange,
      majorDimension: 'ROWS',
      values,
    }),
  });

  await checkResponse(res, 'Failed to save attendance to Google Sheets');
}

/**
 * Saves all Payroll Records back to the sheet with explicit columns
 */
export async function savePayrollHistory(spreadsheetId: string, payroll: PayrollRecord[], token: string): Promise<void> {
  const payEndLetter = getColumnLetter(PAYROLL_COLUMNS.length); //includes Metadata
  const clearRange = `Payroll_History!A2:${payEndLetter}5000`;
  const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${clearRange}:clear`;
  await fetch(clearUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });

  if (payroll.length === 0) return;

  const saveRange = `Payroll_History!A2:${payEndLetter}${payroll.length + 1}`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${saveRange}?valueInputOption=USER_ENTERED`;
  const values = payroll.map(pay => {
    const row: any[] = [];
    const mappedKeys = new Set(PAYROLL_COLUMNS.map(c => c.key));

    PAYROLL_COLUMNS.forEach((col) => {
      const val = (pay as any)[col.key];
      if (val === undefined || val === null) {
        row.push('');
      } else {
        row.push(val);
      }
    });

    const metadata: any = {};
    Object.keys(pay).forEach(key => {
      if (!mappedKeys.has(key as keyof PayrollRecord)) {
        metadata[key] = (pay as any)[key];
      }
    });

    row.push(Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : '');
    return row;
  });

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      range: saveRange,
      majorDimension: 'ROWS',
      values,
    }),
  });

  await checkResponse(res, 'Failed to save payroll records to Google Sheets');
}

/**
 * Saves Admin Settings back to the Settings sheet
 */
export async function saveAdminSettings(spreadsheetId: string, settings: AdminSettings, token: string): Promise<void> {
  const range = 'Settings!A1:B200';
  const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:clear`;
  await fetch(clearUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });

  const values = [
    ['Setting Key', 'Setting Value'],
    ['companyName', settings.companyName || ''],
    ['companyAddress', settings.companyAddress || ''],
    ['companyLogo', settings.companyLogo || ''],
    ['currency', settings.currency || ''],
    ['defaultCheckIn', settings.defaultCheckIn || ''],
    ['defaultCheckOut', settings.defaultCheckOut || ''],
    ['defaultOvertimeRate', settings.defaultOvertimeRate || 0],
    ['pfContributionRate', settings.pfContributionRate || 0],
    ['esicContributionRate', settings.esicContributionRate || 0],
    ['departments', JSON.stringify(settings.departments || [])],
    ['branches', JSON.stringify(settings.branches || [])],
    ['costCenters', JSON.stringify(settings.costCenters || [])],
    ['employeeGroups', JSON.stringify(settings.employeeGroups || [])],
    ['workTimings', JSON.stringify(settings.workTimings || [])],
    ['weeklyOffProfiles', JSON.stringify(settings.weeklyOffProfiles || [])],
    ['leaveTypes', JSON.stringify(settings.leaveTypes || [])],
    ['fields', JSON.stringify(settings.fields || [])],
    ['holidays', JSON.stringify(settings.holidays || [])],
    ['adminUsername', settings.adminUsername || ''],
    ['adminPassword', settings.adminPassword || ''],
    ['enableHra', settings.enableHra !== false ? 'TRUE' : 'FALSE'],
    ['enableDa', settings.enableDa !== false ? 'TRUE' : 'FALSE'],
    ['enableConveyance', settings.enableConveyance !== false ? 'TRUE' : 'FALSE'],
    ['enableProfessionalTax', settings.enableProfessionalTax !== false ? 'TRUE' : 'FALSE'],
    ['enablePaidLeaveCalculation', settings.enablePaidLeaveCalculation !== false ? 'TRUE' : 'FALSE'],
    ['paidLeaveStartAfterMonths', settings.paidLeaveStartAfterMonths || 0],
    ['rulesShiftTiming', settings.rulesShiftTiming || ''],
    ['rulesHalfDaySlot', settings.rulesHalfDaySlot || ''],
    ['rulesLatePunchGrace', settings.rulesLatePunchGrace || ''],
    ['hrContactEmail', settings.hrContactEmail || ''],
    ['hrContactPhone', settings.hrContactPhone || ''],
    ['hrContactManager', settings.hrContactManager || ''],
    ['itContactEmail', settings.itContactEmail || ''],
    ['itContactPhone', settings.itContactPhone || ''],
    ['itContactManager', settings.itContactManager || ''],
    ['roleAccounts', JSON.stringify(settings.roleAccounts || [])],
    ['rolePermissions', JSON.stringify(settings.rolePermissions || {})],
    ['roleColumnPermissions', JSON.stringify(settings.roleColumnPermissions || {})],
    ['customRoles', JSON.stringify(settings.customRoles || [])],
    ['enableEmployeePayslips', settings.enableEmployeePayslips ? 'TRUE' : 'FALSE'],
    ['enableGeofencing', settings.enableGeofencing ? 'TRUE' : 'FALSE'],
    ['enableMobileAttendance', settings.enableMobileAttendance !== false ? 'TRUE' : 'FALSE'],
    ['enablePasswordLoginOtp', settings.enablePasswordLoginOtp ? 'TRUE' : 'FALSE'],
    ['enableAdminWelcomePopup', settings.enableAdminWelcomePopup !== false ? 'TRUE' : 'FALSE'],
    ['geofenceOutlets', JSON.stringify(settings.geofenceOutlets || [])],
    ['smtpHost', settings.smtpHost || ''],
    ['smtpPort', settings.smtpPort || 587],
    ['smtpUsername', settings.smtpUsername || ''],
    ['smtpPassword', settings.smtpPassword || ''],
    ['senderName', settings.senderName || ''],
    ['senderEmail', settings.senderEmail || ''],
    ['enableWhatsappAutomation', settings.enableWhatsappAutomation !== false ? 'TRUE' : 'FALSE'],
    ['whatsappUsername', settings.whatsappUsername || ''],
    ['whatsappPassword', settings.whatsappPassword || ''],
    ['whatsappSenderNo', settings.whatsappSenderNo || ''],
    ['whatsappTemplates', JSON.stringify(settings.whatsappTemplates || {})],
    ['emailTemplates', JSON.stringify(settings.emailTemplates || {})]
  ];

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Settings!A1:B${values.length}?valueInputOption=USER_ENTERED`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      range: `Settings!A1:B${values.length}`,
      majorDimension: 'ROWS',
      values,
    }),
  });

  await checkResponse(res, 'Failed to save admin settings to Google Sheets');
}

/**
 * Reads Admin Settings from the Settings sheet
 */
export async function fetchAdminSettings(spreadsheetId: string, token: string): Promise<AdminSettings | null> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Settings!A1:B200`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    return null;
  }

  const data = await res.json();
  const rows = data.values || [];
  if (rows.length === 0) return null;

  const settings: any = {};
  const dataRows = rows.slice(1);

  const numericFields = ['defaultOvertimeRate', 'pfContributionRate', 'esicContributionRate', 'paidLeaveStartAfterMonths', 'smtpPort'];
  const booleanFields = [
    'enableHra', 'enableDa', 'enableConveyance', 'enableProfessionalTax', 
    'enablePaidLeaveCalculation', 'enableEmployeePayslips', 'enableGeofencing', 
    'enableMobileAttendance', 'enablePasswordLoginOtp', 'enableWhatsappAutomation',
    'enableAdminWelcomePopup'
  ];
  const jsonFields = [
    'departments', 'branches', 'costCenters', 'employeeGroups',
    'workTimings', 'weeklyOffProfiles', 'leaveTypes', 'fields', 'holidays',
    'roleAccounts', 'rolePermissions', 'roleColumnPermissions', 'customRoles', 'geofenceOutlets', 'whatsappTemplates', 'emailTemplates'
  ];

  dataRows.forEach((row: any[]) => {
    if (row.length < 2) return;
    const key = String(row[0]).trim();
    const val = String(row[1]).trim();

    if (!key) return;

    if (numericFields.includes(key)) {
      settings[key] = Number(val) || (key === 'smtpPort' ? 587 : 0);
    } else if (booleanFields.includes(key)) {
      settings[key] = val === 'TRUE' || val === 'true' || val === '1';
    } else if (jsonFields.includes(key)) {
      try {
        if (val.startsWith('{') || val.startsWith('[')) {
          settings[key] = JSON.parse(val);
        } else if (['departments', 'branches', 'costCenters', 'employeeGroups', 'workTimings', 'weeklyOffProfiles', 'leaveTypes'].includes(key)) {
          settings[key] = val.split(',').map(s => s.trim()).filter(Boolean);
        }
      } catch (e) {
        if (['departments', 'branches', 'costCenters', 'employeeGroups', 'workTimings', 'weeklyOffProfiles', 'leaveTypes'].includes(key)) {
          settings[key] = val.split(',').map(s => s.trim()).filter(Boolean);
        }
      }
    } else {
      settings[key] = val;
    }
  });

  if (Object.keys(settings).length === 0) return null;
  return settings as AdminSettings;
}

/**
 * Ensures recruitment sheets exist in the spreadsheet and syncs:
 * 1. Job_Openings
 * 2. Active_Candidates
 * 3. Candidate_FollowUps (Interview & Discussion Logs)
 * 4. Rejected_Candidates (Archived auto-transferred candidates)
 */
export async function syncRecruitmentToSheets(
  spreadsheetId: string,
  token: string,
  jobs: JobPosting[],
  candidates: Candidate[]
): Promise<{ success: boolean; message: string }> {
  try {
    //Step 1: Ensure sheets exist
    const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`;
    const metaRes = await fetch(metaUrl, { headers: { Authorization: `Bearer ${token}` } });
    if (!metaRes.ok) {
      throw new Error('Failed to retrieve spreadsheet metadata');
    }

    const metaData = await metaRes.json();
    const existingTitles: string[] = metaData.sheets?.map((s: any) => s.properties?.title) || [];

    const requiredSheets = ['Job_Openings', 'Active_Candidates', 'Candidate_FollowUps', 'Rejected_Candidates'];
    const sheetsToAdd = requiredSheets.filter(t => !existingTitles.includes(t));

    if (sheetsToAdd.length > 0) {
      const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
      await fetch(updateUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: sheetsToAdd.map(title => ({
            addSheet: { properties: { title } }
          }))
        })
      });
    }

    //Step 2: Prepare Job_Openings sheet
    const jobHeaders = ['Job ID', 'Job Title', 'Department', 'Branch Location', 'Type', 'Openings', 'Status', 'Target CTC Range', 'Urgency', 'Director Name', 'Target Date', 'Posted Date'];
    const jobRows = jobs.map(j => [
      j.id,
      j.title,
      j.department,
      j.location,
      j.type,
      j.openings,
      j.status,
      `₹${(j.targetCtcMin || 0).toLocaleString()} - ₹${(j.targetCtcMax || 0).toLocaleString()}`,
      j.urgency || 'Medium',
      j.directorName || '',
      j.targetDate || '',
      j.postedDate
    ]);

    //Step 3: Separate Active vs Rejected Candidates
    const activeCandidates = candidates.filter(c => c.stage !== 'Rejected' && !c.isArchived);
    const rejectedCandidates = candidates.filter(c => c.stage === 'Rejected' || c.isArchived);

    //Active Candidates rows
    const candidateHeaders = ['Candidate ID', 'Name', 'Phone', 'Email', 'Job Title', 'Stage', 'Interview Round', 'Mode (Telephonic/Physical/Online)', 'Interview Date & Time', 'Interviewer', 'Expected CTC', 'Experience (Yrs)', 'Applied Date', 'HR Recruiter', 'NotesRemarks'];
    const candidateRows = activeCandidates.map(c => [
      c.id,
      c.name,
      c.phone,
      c.email,
      c.jobTitle || 'General Pool',
      c.stage,
      c.interviewRound || '-',
      c.interviewType || 'Telephonic',
      c.interviewDate ? `${c.interviewDate} ${c.interviewTime || ''}` : '-',
      c.interviewerName || '-',
      c.expectedSalary ? `₹${c.expectedSalary.toLocaleString()}` : '-',
      c.experienceYears || 0,
      c.appliedDate,
      c.hrName || 'HR Team',
      c.notes || ''
    ]);

    //Step 4: Candidate FollowUp Discussion Logs
    const followUpHeaders = ['FollowUp ID', 'Candidate ID', 'Candidate Name', 'Date & Time', 'Round Name', 'Interview Mode', 'Conducted ByInterviewer', 'Stage', 'Discussion Summary (Kya baat hua)'];
    const allFollowUps: CandidateFollowUp[] = [];
    candidates.forEach(c => {
      if (c.followUpHistory && c.followUpHistory.length > 0) {
        allFollowUps.push(...c.followUpHistory);
      }
    });

    const followUpRows = allFollowUps.map(f => [
      f.id,
      f.candidateId,
      f.candidateName,
      `${f.date} ${f.time || ''}`,
      f.round,
      f.interviewType,
      f.interviewer || f.conductedBy || '-',
      f.stageAtTime,
      f.discussionSummary
    ]);

    //Step 5: Rejected Candidates rows
    const rejectedHeaders = ['Candidate ID', 'Name', 'Phone', 'Email', 'Job Title', 'Rejection Reason', 'Rejection Date', 'Final Stage', 'RemarksNotes'];
    const rejectedRows = rejectedCandidates.map(c => [
      c.id,
      c.name,
      c.phone,
      c.email,
      c.jobTitle || 'General Pool',
      c.rejectionReason || 'DeclinedNot Suitable',
      c.rejectedDate || c.appliedDate,
      c.stage,
      c.notes || ''
    ]);

    //Step 6: Batch Update Values to Google Sheets
    const batchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;

    //Clear existing contents first
    const clearRanges = [
      'Job_Openings!A1:Z5000',
      'Active_Candidates!A1:Z5000',
      'Candidate_FollowUps!A1:Z5000',
      'Rejected_Candidates!A1:Z5000'
    ];

    for (const range of clearRanges) {
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:clear`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
    }

    const payload = {
      valueInputOption: 'USER_ENTERED',
      data: [
        { range: `Job_Openings!A1:L${jobRows.length + 1}`, values: [jobHeaders, ...jobRows] },
        { range: `Active_Candidates!A1:O${candidateRows.length + 1}`, values: [candidateHeaders, ...candidateRows] },
        { range: `Candidate_FollowUps!A1:I${followUpRows.length + 1}`, values: [followUpHeaders, ...followUpRows] },
        { range: `Rejected_Candidates!A1:I${rejectedRows.length + 1}`, values: [rejectedHeaders, ...rejectedRows] }
      ]
    };

    const saveRes = await fetch(batchUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!saveRes.ok) {
      const errText = await saveRes.text();
      throw new Error(`Google Sheets API Error: ${errText}`);
    }

    return {
      success: true,
      message: `Successfully synced ${jobs.length} Job Openings, ${activeCandidates.length} Active Candidates, ${allFollowUps.length} FollowUp Logs, and ${rejectedCandidates.length} Rejected Candidates to Google Sheets!`
    };
  } catch (e: any) {
    console.error('Recruitment Google Sheet Sync Error:', e);
    return {
      success: false,
      message: e.message || 'Failed to sync recruitment data to Google Sheets.'
    };
  }
}

/**
 * Company Assets Sheet Sync & Fetch
 */
export async function syncAssetsToSheets(
  spreadsheetId: string,
  token: string,
  assets: CompanyAsset[]
): Promise<{ success: boolean; message: string }> {
  try {
    const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`;
    const metaRes = await fetch(metaUrl, { headers: { Authorization: `Bearer ${token}` } });
    if (!metaRes.ok) {
      throw new Error('Failed to retrieve spreadsheet metadata');
    }

    const metaData = await metaRes.json();
    const existingTitles: string[] = metaData.sheets?.map((s: any) => s.properties?.title) || [];

    if (!existingTitles.includes('Company_Assets')) {
      const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
      await fetch(updateUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [{ addSheet: { properties: { title: 'Company_Assets' } } }]
        })
      });
    }

    const headers = [
      'Asset ID', 'Asset Tag Code', 'Asset Name', 'Category', 'Serial Number',
      'Brand', 'Model', 'Branch Location', 'Assigned Emp ID', 'Assigned Emp Name',
      'Assigned Date', 'Expected Return Date', 'Condition', 'Status',
      'Purchase Date', 'Purchase Price', 'Warranty Expiry', 'Vendor Name', 'Notes'
    ];

    const rows = assets.map(a => [
      a.id,
      a.assetTag || '',
      a.name || '',
      a.category || '',
      a.serialNumber || '',
      a.brand || '',
      a.model || '',
      a.branch || 'Head Office',
      a.assignedToEmployeeId || '',
      a.assignedToEmployeeName || '',
      a.assignedDate || '',
      a.expectedReturnDate || '',
      a.condition || 'Good',
      a.status || 'Available',
      a.purchaseDate || '',
      a.purchasePrice || 0,
      a.warrantyExpiryDate || '',
      a.vendorName || '',
      a.notes || ''
    ]);

    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Company_Assets!A1:Z5000:clear`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });

    const batchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;
    const payload = {
      valueInputOption: 'USER_ENTERED',
      data: [
        { range: `Company_Assets!A1:S${rows.length + 1}`, values: [headers, ...rows] }
      ]
    };

    const saveRes = await fetch(batchUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!saveRes.ok) {
      const errText = await saveRes.text();
      throw new Error(`Google Sheets API Error: ${errText}`);
    }

    return {
      success: true,
      message: `Successfully synced ${assets.length} Company Assets to Google Sheet (Company_Assets tab)!`
    };
  } catch (e: any) {
    console.error('Company Assets Google Sheet Sync Error:', e);
    return {
      success: false,
      message: e.message || 'Failed to sync company assets to Google Sheet.'
    };
  }
}

export async function fetchAssetsFromSheets(
  spreadsheetId: string,
  token: string
): Promise<CompanyAsset[]> {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Company_Assets!A2:Z5000`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return [];

    const data = await res.json();
    const rows: string[][] = data.values || [];

    return rows.map((row) => ({
      id: row[0] || `AST-${Math.floor(Math.random() * 10000)}`,
      assetTag: row[1] || '',
      name: row[2] || '',
      category: (row[3] as any) || 'Other',
      serialNumber: row[4] || '',
      brand: row[5] || '',
      model: row[6] || '',
      branch: row[7] || '',
      assignedToEmployeeId: row[8] || undefined,
      assignedToEmployeeName: row[9] || undefined,
      assignedDate: row[10] || undefined,
      expectedReturnDate: row[11] || undefined,
      condition: (row[12] as any) || 'Good',
      status: (row[13] as any) || 'Available',
      purchaseDate: row[14] || undefined,
      purchasePrice: row[15] ? parseFloat(row[15].replace(/[^0-9.]/g, '')) : undefined,
      warrantyExpiryDate: row[16] || undefined,
      vendorName: row[17] || undefined,
      notes: row[18] || undefined
    }));
  } catch (e) {
    console.error('Failed to fetch assets from Google Sheet:', e);
    return [];
  }
}

/**
 * ============================================================================
 * ARCHIVE GOOGLE SHEETS MANAGEMENT SYSTEM
 * ============================================================================
 */

export const ARCHIVE_EMPLOYEE_HEADERS = [
  'Archived Date', 'Employee ID', 'Full Name', 'Department', 'Designation',
  'Joining Date', 'Leaving Date', 'Exit Reason', 'Basic Salary', 'Phone', 'Email',
  'Bank Account No', 'IFSC Code', 'PAN No', 'Aadhaar No', 'Branch', 'Archived By', 'Snapshot JSON'
];

export const ARCHIVE_CANDIDATE_HEADERS = [
  'Archived Date', 'Candidate ID', 'Full Name', 'Job Title', 'Phone', 'Email',
  'Final Stage', 'Rejection Reason', 'Applied Date', 'Experience (Yrs)', 'Expected Salary',
  'HR Recruiter', 'Notes & Remarks', 'Archived By', 'Snapshot JSON'
];

export const ARCHIVE_ATTENDANCE_HEADERS = [
  'Archived Date', 'Attendance Date', 'Employee ID', 'Status', 'Check In', 'Check Out',
  'Overtime Hours', 'Remarks', 'Approval Status', 'Notes'
];

export const DEDICATED_ARCHIVE_SPREADSHEET_NAME = 'HRMS_Archive_Database';

/**
 * Searches Google Drive for an existing dedicated Archive Spreadsheet.
 */
export async function findDedicatedArchiveSpreadsheet(
  token: string,
  spreadsheetTitle: string = DEDICATED_ARCHIVE_SPREADSHEET_NAME
): Promise<{ id: string; name: string; webViewLink: string } | null> {
  try {
    const query = encodeURIComponent(`name = '${spreadsheetTitle}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`);
    const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink)`;
    
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!res.ok) return null;
    const data = await res.json();
    
    if (data.files && data.files.length > 0) {
      return {
        id: data.files[0].id,
        name: data.files[0].name,
        webViewLink: data.files[0].webViewLink || `https://docs.google.com/spreadsheets/d/${data.files[0].id}/edit`
      };
    }
    return null;
  } catch (e) {
    console.error('Error finding dedicated archive spreadsheet:', e);
    return null;
  }
}

/**
 * Creates a brand-new, dedicated Google Spreadsheet exclusively for Archives
 * (Left Employees, Rejected Candidates, Past Attendance, and System Audit Logs).
 */
export async function createDedicatedArchiveSpreadsheet(
  token: string,
  customTitle?: string
): Promise<{ spreadsheetId: string; webViewLink: string; title: string }> {
  const title = customTitle?.trim() || DEDICATED_ARCHIVE_SPREADSHEET_NAME;
  const url = 'https://sheets.googleapis.com/v4/spreadsheets';
  
  const body = {
    properties: {
      title: title,
    },
    sheets: [
      {
        properties: {
          title: 'Archive_Employees',
          gridProperties: { frozenRowCount: 1 }
        }
      },
      {
        properties: {
          title: 'Archive_Candidates',
          gridProperties: { frozenRowCount: 1 }
        }
      },
      {
        properties: {
          title: 'Archive_Attendance',
          gridProperties: { frozenRowCount: 1 }
        }
      },
      {
        properties: {
          title: 'Archive_Logs',
          gridProperties: { frozenRowCount: 1 }
        }
      },
    ],
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  await checkResponse(res, 'Failed to create dedicated Archive Google Spreadsheet');
  const data = await res.json();
  const spreadsheetId = data.spreadsheetId;

  // Initialize all headers in the new dedicated sheet
  const batchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;
  const payload = {
    valueInputOption: 'USER_ENTERED',
    data: [
      { range: `Archive_Employees!A1:R1`, values: [ARCHIVE_EMPLOYEE_HEADERS] },
      { range: `Archive_Candidates!A1:O1`, values: [ARCHIVE_CANDIDATE_HEADERS] },
      { range: `Archive_Attendance!A1:J1`, values: [ARCHIVE_ATTENDANCE_HEADERS] },
      { range: `Archive_Logs!A1:E1`, values: [['Timestamp', 'Operation', 'Records Moved', 'Status', 'Details']] }
    ]
  };

  await fetch(batchUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  // Log initial creation into Archive_Logs
  const logUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Archive_Logs!A2:E2:append?valueInputOption=USER_ENTERED`;
  await fetch(logUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      range: 'Archive_Logs!A2:E2',
      majorDimension: 'ROWS',
      values: [[
        new Date().toISOString(),
        'Dedicated Archive Spreadsheet Created',
        '0',
        'SUCCESS',
        `Initialized new archive database: ${title}`
      ]]
    })
  }).catch(() => {});

  const link = await getSpreadsheetLink(spreadsheetId, token);

  return {
    spreadsheetId,
    webViewLink: link,
    title
  };
}

/**
 * Ensures Archive sheets exist in the spreadsheet with custom styled headers
 */
export async function ensureArchiveSheetsExist(
  spreadsheetId: string,
  token: string
): Promise<{ success: boolean; message: string }> {
  try {
    const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`;
    const metaRes = await fetch(metaUrl, { headers: { Authorization: `Bearer ${token}` } });
    if (!metaRes.ok) throw new Error('Failed to fetch spreadsheet metadata');
    
    const metaData = await metaRes.json();
    const existingTitles: string[] = metaData.sheets?.map((s: any) => s.properties?.title) || [];
    
    const requiredArchiveSheets = ['Archive_Employees', 'Archive_Candidates', 'Archive_Attendance', 'Archive_Logs'];
    const sheetsToAdd = requiredArchiveSheets.filter(t => !existingTitles.includes(t));
    
    if (sheetsToAdd.length > 0) {
      const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
      await fetch(updateUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: sheetsToAdd.map(title => ({
            addSheet: { properties: { title } }
          }))
        })
      });
    }

    // Initialize headers if sheets are newly created or empty
    const batchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;
    const payload = {
      valueInputOption: 'USER_ENTERED',
      data: [
        { range: `Archive_Employees!A1:R1`, values: [ARCHIVE_EMPLOYEE_HEADERS] },
        { range: `Archive_Candidates!A1:O1`, values: [ARCHIVE_CANDIDATE_HEADERS] },
        { range: `Archive_Attendance!A1:J1`, values: [ARCHIVE_ATTENDANCE_HEADERS] },
        { range: `Archive_Logs!A1:E1`, values: [['Timestamp', 'Operation', 'Records Moved', 'Status', 'Details']] }
      ]
    };

    await fetch(batchUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    return { success: true, message: 'All Archive sheets verified and ready in Google Sheets!' };
  } catch (e: any) {
    console.error('Error ensuring archive sheets:', e);
    return { success: false, message: e.message || 'Failed to ensure archive sheets.' };
  }
}

/**
 * Saves/Syncs all Archived Employees to Archive_Employees sheet
 */
export async function syncArchivedEmployeesToSheets(
  spreadsheetId: string,
  token: string,
  archivedEmployees: ArchivedEmployeeRecord[]
): Promise<{ success: boolean; message: string }> {
  try {
    await ensureArchiveSheetsExist(spreadsheetId, token);

    // Clear old rows
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Archive_Employees!A2:R5000:clear`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });

    if (archivedEmployees.length === 0) {
      return { success: true, message: 'Archive_Employees sheet cleared.' };
    }

    const rows = archivedEmployees.map(rec => {
      const emp = rec.employeeData || ({} as Employee);
      return [
        rec.archivedAt || new Date().toISOString(),
        rec.id || emp.id || '',
        rec.name || emp.name || '',
        rec.department || emp.department || '',
        rec.designation || emp.designation || '',
        rec.joiningDate || emp.joiningDate || '',
        rec.leavingDate || emp.confirmationDate || '',
        rec.exitReason || 'Resigned / Inactive / Transferred',
        emp.basicSalary || 0,
        emp.mobileNo || emp.personalMobileNo || '',
        emp.email || emp.personalEmail || '',
        emp.bankAccountNo || '',
        emp.ifscCode || '',
        emp.panNo || '',
        emp.aadhaarNo || '',
        emp.branch || 'Main Branch',
        rec.archivedBy || 'System Admin',
        JSON.stringify(emp)
      ];
    });

    const batchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Archive_Employees!A2:R${rows.length + 1}?valueInputOption=USER_ENTERED`;
    const res = await fetch(batchUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        range: `Archive_Employees!A2:R${rows.length + 1}`,
        majorDimension: 'ROWS',
        values: rows
      })
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Google Sheets API Error: ${err}`);
    }

    return {
      success: true,
      message: `Successfully stored ${archivedEmployees.length} Ex-Employees in Archive_Employees sheet!`
    };
  } catch (e: any) {
    console.error('Error syncing archived employees to sheets:', e);
    return { success: false, message: e.message || 'Failed to sync archived employees.' };
  }
}

/**
 * Fetches Archived Employees from Archive_Employees sheet
 */
export async function fetchArchivedEmployeesFromSheets(
  spreadsheetId: string,
  token: string
): Promise<ArchivedEmployeeRecord[]> {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Archive_Employees!A2:R5000`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return [];

    const data = await res.json();
    const rows: any[][] = data.values || [];
    if (rows.length === 0) return [];

    return rows.map((row, idx) => {
      let empData: Employee;
      try {
        empData = row[17] ? JSON.parse(row[17]) : null;
      } catch (e) {
        empData = null as any;
      }

      if (!empData || !empData.id) {
        empData = {
          id: row[1] || `ARC-EMP-${idx + 1}`,
          name: row[2] || '',
          department: row[3] || 'General',
          designation: row[4] || 'Staff',
          joiningDate: row[5] || '',
          basicSalary: Number(row[8]) || 0,
          allowances: 0,
          deductions: 0,
          hourlyRate: 0,
          paymentMethod: 'Bank Transfer',
          isActive: false,
          mobileNo: row[9] || '',
          email: row[10] || '',
          bankAccountNo: row[11] || '',
          ifscCode: row[12] || '',
          panNo: row[13] || '',
          aadhaarNo: row[14] || '',
          branch: row[15] || ''
        };
      }

      return {
        id: row[1] || empData.id,
        name: row[2] || empData.name,
        department: row[3] || empData.department,
        designation: row[4] || empData.designation,
        joiningDate: row[5] || empData.joiningDate,
        leavingDate: row[6] || '',
        exitReason: row[7] || 'Left / Inactive',
        archivedAt: row[0] || new Date().toISOString(),
        archivedBy: row[16] || 'System',
        employeeData: empData
      };
    }).filter(r => r.id);
  } catch (e) {
    console.error('Failed to fetch archived employees from sheets:', e);
    return [];
  }
}

/**
 * Saves/Syncs all Archived Candidates to Archive_Candidates sheet
 */
export async function syncArchivedCandidatesToSheets(
  spreadsheetId: string,
  token: string,
  archivedCandidates: ArchivedCandidateRecord[]
): Promise<{ success: boolean; message: string }> {
  try {
    await ensureArchiveSheetsExist(spreadsheetId, token);

    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Archive_Candidates!A2:O5000:clear`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });

    if (archivedCandidates.length === 0) {
      return { success: true, message: 'Archive_Candidates sheet cleared.' };
    }

    const rows = archivedCandidates.map(rec => {
      const can = rec.candidateData || ({} as Candidate);
      return [
        rec.archivedAt || new Date().toISOString(),
        rec.id || can.id || '',
        rec.name || can.name || '',
        rec.jobTitle || can.jobTitle || 'General Pool',
        rec.phone || can.phone || '',
        rec.email || can.email || '',
        rec.stage || can.stage || 'Rejected',
        rec.rejectionReason || can.rejectionReason || 'Declined / Archived',
        can.appliedDate || '',
        can.experienceYears || 0,
        can.expectedSalary ? `₹${can.expectedSalary.toLocaleString()}` : '',
        can.hrName || 'HR Team',
        can.notes || '',
        rec.archivedBy || 'System Admin',
        JSON.stringify(can)
      ];
    });

    const batchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Archive_Candidates!A2:O${rows.length + 1}?valueInputOption=USER_ENTERED`;
    const res = await fetch(batchUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        range: `Archive_Candidates!A2:O${rows.length + 1}`,
        majorDimension: 'ROWS',
        values: rows
      })
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Google Sheets API Error: ${err}`);
    }

    return {
      success: true,
      message: `Successfully stored ${archivedCandidates.length} Rejected Candidates in Archive_Candidates sheet!`
    };
  } catch (e: any) {
    console.error('Error syncing archived candidates to sheets:', e);
    return { success: false, message: e.message || 'Failed to sync archived candidates.' };
  }
}

/**
 * Fetches Archived Candidates from Archive_Candidates sheet
 */
export async function fetchArchivedCandidatesFromSheets(
  spreadsheetId: string,
  token: string
): Promise<ArchivedCandidateRecord[]> {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Archive_Candidates!A2:O5000`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return [];

    const data = await res.json();
    const rows: any[][] = data.values || [];
    if (rows.length === 0) return [];

    return rows.map((row, idx) => {
      let canData: Candidate;
      try {
        canData = row[14] ? JSON.parse(row[14]) : null;
      } catch (e) {
        canData = null as any;
      }

      if (!canData || !canData.id) {
        canData = {
          id: row[1] || `CAN-ARC-${idx + 1}`,
          name: row[2] || '',
          jobTitle: row[3] || 'General Pool',
          phone: row[4] || '',
          email: row[5] || '',
          stage: (row[6] as any) || 'Rejected',
          rejectionReason: row[7] || '',
          appliedDate: row[8] || '',
          experienceYears: Number(row[9]) || 0,
          expectedSalary: row[10] ? parseFloat(String(row[10]).replace(/[^0-9.]/g, '')) : undefined,
          hrName: row[11] || '',
          notes: row[12] || '',
          isArchived: true
        };
      }

      return {
        id: row[1] || canData.id,
        name: row[2] || canData.name,
        jobTitle: row[3] || canData.jobTitle,
        phone: row[4] || canData.phone,
        email: row[5] || canData.email,
        stage: row[6] || canData.stage,
        rejectionReason: row[7] || canData.rejectionReason,
        archivedAt: row[0] || new Date().toISOString(),
        archivedBy: row[13] || 'System',
        candidateData: canData
      };
    }).filter(r => r.id);
  } catch (e) {
    console.error('Failed to fetch archived candidates from sheets:', e);
    return [];
  }
}

/**
 * Saves/Syncs all Archived Attendance to Archive_Attendance sheet
 */
export async function syncArchivedAttendanceToSheets(
  spreadsheetId: string,
  token: string,
  archivedAttendance: Attendance[]
): Promise<{ success: boolean; message: string }> {
  try {
    await ensureArchiveSheetsExist(spreadsheetId, token);

    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Archive_Attendance!A2:J10000:clear`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });

    if (archivedAttendance.length === 0) {
      return { success: true, message: 'Archive_Attendance sheet cleared.' };
    }

    const now = new Date().toISOString();
    const rows = archivedAttendance.map(att => [
      now,
      att.date,
      att.employeeId,
      att.status,
      att.checkIn || '',
      att.checkOut || '',
      att.overtimeHours || 0,
      att.remarks || '',
      att.approvalStatus || 'Approved',
      att.punchInOutlet || ''
    ]);

    const batchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Archive_Attendance!A2:J${rows.length + 1}?valueInputOption=USER_ENTERED`;
    const res = await fetch(batchUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        range: `Archive_Attendance!A2:J${rows.length + 1}`,
        majorDimension: 'ROWS',
        values: rows
      })
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Google Sheets API Error: ${err}`);
    }

    return {
      success: true,
      message: `Successfully stored ${archivedAttendance.length} attendance rows in Archive_Attendance sheet!`
    };
  } catch (e: any) {
    console.error('Error syncing archived attendance to sheets:', e);
    return { success: false, message: e.message || 'Failed to sync archived attendance.' };
  }
}

/**
 * Fetches Archived Attendance from Archive_Attendance sheet
 */
export async function fetchArchivedAttendanceFromSheets(
  spreadsheetId: string,
  token: string
): Promise<Attendance[]> {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Archive_Attendance!A2:J10000`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return [];

    const data = await res.json();
    const rows: any[][] = data.values || [];
    if (rows.length === 0) return [];

    return rows.map((row) => ({
      date: row[1] || '',
      employeeId: row[2] || '',
      status: (row[3] as any) || 'Present',
      checkIn: row[4] || '',
      checkOut: row[5] || '',
      overtimeHours: Number(row[6]) || 0,
      remarks: row[7] || '',
      approvalStatus: (row[8] as any) || 'Approved',
      punchInOutlet: row[9] || ''
    })).filter(a => a.employeeId && a.date);
  } catch (e) {
    console.error('Failed to fetch archived attendance from sheets:', e);
    return [];
  }
}

/**
 * Appends a log entry to the Archive_Logs sheet
 */
export async function appendArchiveLogToSheets(
  spreadsheetId: string,
  token: string,
  operation: string,
  recordsMoved: number,
  status: 'SUCCESS' | 'WARNING' | 'FAILED',
  details: string
) {
  try {
    const logUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Archive_Logs!A2:E2:append?valueInputOption=USER_ENTERED`;
    await fetch(logUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        range: 'Archive_Logs!A2:E2',
        majorDimension: 'ROWS',
        values: [[
          new Date().toISOString(),
          operation,
          String(recordsMoved),
          status,
          details
        ]]
      })
    });
  } catch (e) {
    console.warn('Failed to append to Archive_Logs:', e);
  }
}


