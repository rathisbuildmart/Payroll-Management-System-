import { Employee, Attendance, PayrollRecord, AdminSettings } from '../types';

const SPREADSHEET_NAME = 'Payroll_Management_System_Data';

// Helper to convert index to Column Letter (e.g., 0 -> A, 25 -> Z, 26 -> AA, 27 -> AB...)
function getColumnLetter(colIndex: number): string {
  let temp = colIndex;
  let letter = '';
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

// Full specifications of Google Sheet columns
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

// Helper to check response
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

  // Initialize headers
  await initHeaders(spreadsheetId, token);

  return spreadsheetId;
}

/**
 * Initialize headers for all sheets dynamically based on columns specifications
 */
export async function initHeaders(spreadsheetId: string, token: string) {
  // Safe check to ensure the 'Settings' sheet exists in the spreadsheet
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
  const empEndLetter = getColumnLetter(EMPLOYEE_COLUMNS.length); // includes Metadata
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

  // Match headers to support both old and new layouts seamlessly
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

    // Merge legacy or additional metadata from the JSON column if available
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
  const attEndLetter = getColumnLetter(ATTENDANCE_COLUMNS.length); // includes Metadata
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
  const payEndLetter = getColumnLetter(PAYROLL_COLUMNS.length); // includes Metadata
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
  const empEndLetter = getColumnLetter(EMPLOYEE_COLUMNS.length); // includes Metadata
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

    // Residual fields that are not defined in the schema go to Metadata column
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
  const attEndLetter = getColumnLetter(ATTENDANCE_COLUMNS.length); // includes Metadata
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
  const payEndLetter = getColumnLetter(PAYROLL_COLUMNS.length); // includes Metadata
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
  const range = 'Settings!A1:B35';
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
    ['adminPassword', settings.adminPassword || '']
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
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Settings!A1:B35`;
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

  dataRows.forEach((row: any[]) => {
    if (row.length < 2) return;
    const key = String(row[0]).trim();
    const val = String(row[1]).trim();

    if (!key) return;

    const numericFields = ['defaultOvertimeRate', 'pfContributionRate', 'esicContributionRate'];
    const arrayFields = [
      'departments', 'branches', 'costCenters', 'employeeGroups',
      'workTimings', 'weeklyOffProfiles', 'leaveTypes'
    ];

    if (numericFields.includes(key)) {
      settings[key] = Number(val) || 0;
    } else if (arrayFields.includes(key)) {
      try {
        if (val.startsWith('[') && val.endsWith(']')) {
          settings[key] = JSON.parse(val);
        } else {
          // Robust comma fallback for manual typing in sheets
          settings[key] = val.split(',').map(s => s.trim()).filter(Boolean);
        }
      } catch (e) {
        settings[key] = val.split(',').map(s => s.trim()).filter(Boolean);
      }
    } else if (key === 'fields' || key === 'holidays') {
      try {
        settings[key] = JSON.parse(val);
      } catch (e) {
        console.error(`Failed to parse ${key} configuration:`, e);
      }
    } else {
      settings[key] = val;
    }
  });

  if (Object.keys(settings).length === 0) return null;
  return settings as AdminSettings;
}
