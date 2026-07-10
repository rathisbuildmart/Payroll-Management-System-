import { Employee, Attendance, PayrollRecord } from '../types';

const SPREADSHEET_NAME = 'Payroll_Management_System_Data';

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
 * Creates a new Spreadsheet with the three standard sheets: Employees, Attendance, and Payroll_History.
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
 * Initialize headers for all sheets
 */
async function initHeaders(spreadsheetId: string, token: string) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;
  const body = {
    valueInputOption: 'USER_ENTERED',
    data: [
      {
        range: 'Employees!A1:L1',
        values: [
          ['ID', 'Name', 'Department', 'Designation', 'JoiningDate', 'BasicSalary', 'Allowances', 'Deductions', 'HourlyRate', 'PaymentMethod', 'IsActive', 'Metadata']
        ],
      },
      {
        range: 'Attendance!A1:G1',
        values: [
          ['Date', 'EmployeeID', 'Status', 'CheckIn', 'CheckOut', 'OvertimeHours', 'Remarks']
        ],
      },
      {
        range: 'Payroll_History!A1:J1',
        values: [
          ['MonthYear', 'EmployeeID', 'BasicSalary', 'Allowances', 'Deductions', 'OvertimePay', 'TotalSalary', 'PaymentDate', 'PaymentStatus', 'Metadata']
        ],
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
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Employees!A2:L1000`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  await checkResponse(res, 'Failed to fetch employees from Google Sheets');
  const data = await res.json();
  const rows = data.values || [];

  return rows.map((row: any) => {
    const baseEmp: Employee = {
      id: row[0] || '',
      name: row[1] || '',
      department: row[2] || '',
      designation: row[3] || '',
      joiningDate: row[4] || '',
      basicSalary: Number(row[5]) || 0,
      allowances: Number(row[6]) || 0,
      deductions: Number(row[7]) || 0,
      hourlyRate: Number(row[8]) || 0,
      paymentMethod: (row[9] as Employee['paymentMethod']) || 'Bank Transfer',
      isActive: row[10] === 'TRUE' || row[10] === true || String(row[10]).toUpperCase() === 'TRUE',
    };

    // If metadata is present in column L (row[11]), merge it
    if (row[11]) {
      try {
        const metadata = JSON.parse(row[11]);
        Object.assign(baseEmp, metadata);
      } catch (e) {
        console.error('Failed to parse metadata for employee:', baseEmp.id, e);
      }
    }

    return baseEmp;
  }).filter((emp: Employee) => emp.id);
}

/**
 * Reads Attendance from the Google Sheet
 */
export async function fetchAttendance(spreadsheetId: string, token: string): Promise<Attendance[]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Attendance!A2:G5000`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  await checkResponse(res, 'Failed to fetch attendance from Google Sheets');
  const data = await res.json();
  const rows = data.values || [];

  return rows.map((row: any) => ({
    date: row[0] || '',
    employeeId: row[1] || '',
    status: (row[2] as Attendance['status']) || 'Present',
    checkIn: row[3] || '',
    checkOut: row[4] || '',
    overtimeHours: Number(row[5]) || 0,
    remarks: row[6] || '',
  })).filter((att: Attendance) => att.date && att.employeeId);
}

/**
 * Reads Payroll Records from the Google Sheet
 */
export async function fetchPayrollHistory(spreadsheetId: string, token: string): Promise<PayrollRecord[]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Payroll_History!A2:J2000`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  await checkResponse(res, 'Failed to fetch payroll history from Google Sheets');
  const data = await res.json();
  const rows = data.values || [];

  return rows.map((row: any) => {
    const baseRecord: PayrollRecord = {
      monthYear: row[0] || '',
      employeeId: row[1] || '',
      basicSalary: Number(row[2]) || 0,
      allowances: Number(row[3]) || 0,
      deductions: Number(row[4]) || 0,
      overtimePay: Number(row[5]) || 0,
      totalSalary: Number(row[6]) || 0,
      paymentDate: row[7] || '',
      paymentStatus: (row[8] as PayrollRecord['paymentStatus']) || 'Pending',
    };

    if (row[9]) {
      try {
        const metadata = JSON.parse(row[9]);
        Object.assign(baseRecord, metadata);
      } catch (e) {
        console.error('Failed to parse payroll metadata:', e);
      }
    }

    return baseRecord;
  }).filter((pay: PayrollRecord) => pay.monthYear && pay.employeeId);
}

/**
 * Saves all Employees back to the sheet
 */
export async function saveEmployees(spreadsheetId: string, employees: Employee[], token: string): Promise<void> {
  // Clear existing first (including Metadata column L)
  const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Employees!A2:L1000:clear`;
  await fetch(clearUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });

  if (employees.length === 0) return;

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Employees!A2:L${employees.length + 1}?valueInputOption=USER_ENTERED`;
  const values = employees.map(emp => {
    // Separate core fields and custom metadata
    const {
      id,
      name,
      department,
      designation,
      joiningDate,
      basicSalary,
      allowances,
      deductions,
      hourlyRate,
      paymentMethod,
      isActive,
      ...metadata
    } = emp;

    return [
      id,
      name,
      department,
      designation,
      joiningDate,
      basicSalary,
      allowances,
      deductions,
      hourlyRate,
      paymentMethod,
      isActive ? 'TRUE' : 'FALSE',
      JSON.stringify(metadata)
    ];
  });

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      range: `Employees!A2:L${employees.length + 1}`,
      majorDimension: 'ROWS',
      values,
    }),
  });

  await checkResponse(res, 'Failed to save employees to Google Sheets');
}

/**
 * Saves all Attendance records back to the sheet
 */
export async function saveAttendance(spreadsheetId: string, attendance: Attendance[], token: string): Promise<void> {
  // Clear existing first
  const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Attendance!A2:G5000:clear`;
  await fetch(clearUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });

  if (attendance.length === 0) return;

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Attendance!A2:G${attendance.length + 1}?valueInputOption=USER_ENTERED`;
  const values = attendance.map(att => [
    att.date,
    att.employeeId,
    att.status,
    att.checkIn,
    att.checkOut,
    att.overtimeHours,
    att.remarks,
  ]);

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      range: `Attendance!A2:G${attendance.length + 1}`,
      majorDimension: 'ROWS',
      values,
    }),
  });

  await checkResponse(res, 'Failed to save attendance to Google Sheets');
}

/**
 * Saves all Payroll Records back to the sheet
 */
export async function savePayrollHistory(spreadsheetId: string, payroll: PayrollRecord[], token: string): Promise<void> {
  // Clear existing first
  const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Payroll_History!A2:J2000:clear`;
  await fetch(clearUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });

  if (payroll.length === 0) return;

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Payroll_History!A2:J${payroll.length + 1}?valueInputOption=USER_ENTERED`;
  const values = payroll.map(pay => {
    const {
      monthYear,
      employeeId,
      basicSalary,
      allowances,
      deductions,
      overtimePay,
      totalSalary,
      paymentDate,
      paymentStatus,
      ...metadata
    } = pay;

    return [
      monthYear,
      employeeId,
      basicSalary,
      allowances,
      deductions,
      overtimePay,
      totalSalary,
      paymentDate,
      paymentStatus,
      JSON.stringify(metadata)
    ];
  });

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      range: `Payroll_History!A2:J${payroll.length + 1}`,
      majorDimension: 'ROWS',
      values,
    }),
  });

  await checkResponse(res, 'Failed to save payroll records to Google Sheets');
}
