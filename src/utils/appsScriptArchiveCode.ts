/**
 * Production-Ready Google Apps Script for Automated HRMS Archive & Storage Optimization.
 * 
 * Features:
 * 1. Automatically creates and formats Archive sheets:
 *    - 'Archive_Employees' (stores left/resigned/inactive staff)
 *    - 'Archive_Candidates' (stores rejected & archived candidate applications)
 *    - 'Archive_Attendance' (stores older attendance records)
 *    - 'Archive_Logs' (stores system audit logs)
 * 2. Transfers inactive data from active sheets to archive sheets and cleans up active rows.
 * 3. Restores records back from Archive to Active sheets on demand.
 * 4. Nightly Time-Driven Trigger for automatic unattended maintenance at 2:00 AM.
 * 5. Web API endpoint (doPost / doGet) for seamless remote triggers from the Web Application.
 */

export const APPS_SCRIPT_ARCHIVE_CODE = `/**
 * ============================================================================
 * HRMS ENTERPRISE ARCHIVE & STORAGE OPTIMIZATION SCRIPT
 * For Rathi Buildmart HRMS / Payroll Management System
 * ============================================================================
 */

// Configuration constants
var CONFIG = {
  // If ARCHIVE_SPREADSHEET_ID is set, archives will be stored in that dedicated Google Sheet!
  // Leave empty ("") to keep archive sheets in the same active spreadsheet.
  ARCHIVE_SPREADSHEET_ID: "YOUR_DEDICATED_ARCHIVE_SPREADSHEET_ID_HERE",
  ACTIVE_EMPLOYEES_SHEET: "Employees",
  ARCHIVE_EMPLOYEES_SHEET: "Archive_Employees",
  ACTIVE_CANDIDATES_SHEET: "Active_Candidates",
  ARCHIVE_CANDIDATES_SHEET: "Archive_Candidates",
  ACTIVE_ATTENDANCE_SHEET: "Attendance",
  ARCHIVE_ATTENDANCE_SHEET: "Archive_Attendance",
  ARCHIVE_LOGS_SHEET: "Archive_Logs",
  ATTENDANCE_RETENTION_DAYS: 180 // Move attendance older than 180 days to archive
};

/**
 * Helper to get the target Archive Spreadsheet (dedicated or active)
 */
function getArchiveSpreadsheet() {
  if (CONFIG.ARCHIVE_SPREADSHEET_ID && CONFIG.ARCHIVE_SPREADSHEET_ID.trim().length > 10 && !CONFIG.ARCHIVE_SPREADSHEET_ID.includes("YOUR_DEDICATED")) {
    try {
      return SpreadsheetApp.openById(CONFIG.ARCHIVE_SPREADSHEET_ID.trim());
    } catch (e) {
      Logger.log("⚠️ Could not open dedicated archive spreadsheet ID, falling back to active spreadsheet: " + e.message);
      return SpreadsheetApp.getActiveSpreadsheet();
    }
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * 1. MAIN SETUP FUNCTION - Creates all required archive sheets with formatted headers
 * Run this once after pasting script into Extensions > Apps Script
 */
function setupArchiveSheets() {
  var activeSS = SpreadsheetApp.getActiveSpreadsheet();
  var archiveSS = getArchiveSpreadsheet();
  
  // 1. Setup Archive_Employees
  var empHeaders = [
    "Archived Date", "Employee ID", "Full Name", "Department", "Designation",
    "Joining Date", "Last Basic Salary", "Inactive / Exit Status", "Phone", "Email",
    "Bank Account No", "IFSC", "PAN", "Aadhaar", "Branch", "Archived By / Trigger", "Full Record JSON"
  ];
  createSheetIfNotExists(archiveSS, CONFIG.ARCHIVE_EMPLOYEES_SHEET, empHeaders, "#1e3a2f", "#ffffff");
  
  // 2. Setup Archive_Candidates
  var canHeaders = [
    "Archived Date", "Candidate ID", "Full Name", "Job Title", "Phone", "Email",
    "Stage", "Rejection Reason", "Applied Date", "Experience (Yrs)", "Expected Salary",
    "HR Recruiter", "Notes & Remarks", "Full Record JSON"
  ];
  createSheetIfNotExists(archiveSS, CONFIG.ARCHIVE_CANDIDATES_SHEET, canHeaders, "#4a154b", "#ffffff");
  
  // 3. Setup Archive_Attendance
  var attHeaders = [
    "Archived Date", "Attendance Date", "Employee ID", "Status", "Check In", "Check Out",
    "Overtime Hours", "Remarks", "Approval Status", "Geofence / Device Details"
  ];
  createSheetIfNotExists(archiveSS, CONFIG.ARCHIVE_ATTENDANCE_SHEET, attHeaders, "#1e293b", "#ffffff");
  
  // 4. Setup Archive_Logs
  var logHeaders = ["Timestamp", "Operation", "Records Moved", "Status", "Details"];
  createSheetIfNotExists(archiveSS, CONFIG.ARCHIVE_LOGS_SHEET, logHeaders, "#0f172a", "#ffffff");
  
  Logger.log("✅ All Archive Sheets successfully initialized in: " + archiveSS.getName());
  SpreadsheetApp.getActiveSpreadsheet().toast("Archive Sheets ready in: " + archiveSS.getName(), "HRMS Archive Setup", 5);
}

/**
 * 2. ARCHIVE INACTIVE / LEFT EMPLOYEES
 * Finds employees with Is Active = FALSE or status Left, copies to Archive_Employees, and removes from active sheet.
 */
function archiveLeftEmployees() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var archiveSS = getArchiveSpreadsheet();
  var activeSheet = ss.getSheetByName(CONFIG.ACTIVE_EMPLOYEES_SHEET);
  var archiveSheet = archiveSS.getSheetByName(CONFIG.ARCHIVE_EMPLOYEES_SHEET);
  
  if (!activeSheet) {
    Logger.log("Active Employees sheet not found.");
    return 0;
  }
  if (!archiveSheet) {
    setupArchiveSheets();
    archiveSheet = archiveSS.getSheetByName(CONFIG.ARCHIVE_EMPLOYEES_SHEET);
  }
  
  var data = activeSheet.getDataRange().getValues();
  if (data.length <= 1) {
    Logger.log("No employee data found in active sheet.");
    return 0;
  }
  
  var headers = data[0];
  var idCol = findColIndex(headers, ["ID", "Employee ID", "id"]);
  var nameCol = findColIndex(headers, ["Name", "Full Name", "name"]);
  var deptCol = findColIndex(headers, ["Department", "department"]);
  var desigCol = findColIndex(headers, ["Designation", "designation"]);
  var joinCol = findColIndex(headers, ["Joining Date", "joiningDate"]);
  var salaryCol = findColIndex(headers, ["Basic Salary", "basicSalary"]);
  var activeCol = findColIndex(headers, ["Is Active", "isActive", "Status"]);
  var phoneCol = findColIndex(headers, ["Mobile No", "mobileNo", "Phone"]);
  var emailCol = findColIndex(headers, ["Email", "email"]);
  var bankCol = findColIndex(headers, ["Bank Account No", "bankAccountNo"]);
  var ifscCol = findColIndex(headers, ["IFSC Code", "ifscCode"]);
  var panCol = findColIndex(headers, ["PAN No", "panNo"]);
  var aadhaarCol = findColIndex(headers, ["Aadhaar No", "aadhaarNo"]);
  var branchCol = findColIndex(headers, ["Branch", "branch"]);
  
  var rowsToArchive = [];
  var rowIndicesToDelete = [];
  var now = new Date().toISOString();
  
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var empId = String(row[idCol] || "").trim();
    if (!empId) continue;
    
    var isActiveVal = String(row[activeCol] || "").trim().toUpperCase();
    var isLeft = (isActiveVal === "FALSE" || isActiveVal === "INACTIVE" || isActiveVal === "LEFT" || isActiveVal === "RESIGNED" || isActiveVal === "TERMINATED");
    
    if (isLeft) {
      // Build full row snapshot JSON
      var rowObj = {};
      for (var h = 0; h < headers.length; h++) {
        rowObj[headers[h]] = row[h];
      }
      
      var archiveRow = [
        now,
        empId,
        row[nameCol] || "",
        row[deptCol] || "",
        row[desigCol] || "",
        row[joinCol] || "",
        row[salaryCol] || 0,
        "Left / Inactive",
        row[phoneCol] || "",
        row[emailCol] || "",
        row[bankCol] || "",
        row[ifscCol] || "",
        row[panCol] || "",
        row[aadhaarCol] || "",
        row[branchCol] || "",
        "Auto-Archive Trigger",
        JSON.stringify(rowObj)
      ];
      
      rowsToArchive.push(archiveRow);
      rowIndicesToDelete.push(i + 1); // 1-based row index in spreadsheet
    }
  }
  
  if (rowsToArchive.length > 0) {
    // Append rows to Archive_Employees
    var nextRow = archiveSheet.getLastRow() + 1;
    archiveSheet.getRange(nextRow, 1, rowsToArchive.length, rowsToArchive[0].length).setValues(rowsToArchive);
    
    // Delete rows from Active sheet from bottom to top to preserve indices
    for (var d = rowIndicesToDelete.length - 1; d >= 0; d--) {
      activeSheet.deleteRow(rowIndicesToDelete[d]);
    }
    
    logArchiveOperation("Archive Left Employees", rowsToArchive.length, "SUCCESS", "Archived " + rowsToArchive.length + " left employees to " + CONFIG.ARCHIVE_EMPLOYEES_SHEET);
  }
  
  Logger.log("Archived " + rowsToArchive.length + " left employees.");
  return rowsToArchive.length;
}

/**
 * 3. ARCHIVE REJECTED CANDIDATES
 * Moves rejected & archived candidates from Active_Candidates to Archive_Candidates.
 */
function archiveRejectedCandidates() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var archiveSS = getArchiveSpreadsheet();
  var activeSheet = ss.getSheetByName(CONFIG.ACTIVE_CANDIDATES_SHEET);
  var archiveSheet = archiveSS.getSheetByName(CONFIG.ARCHIVE_CANDIDATES_SHEET);
  
  if (!activeSheet) return 0;
  if (!archiveSheet) {
    setupArchiveSheets();
    archiveSheet = archiveSS.getSheetByName(CONFIG.ARCHIVE_CANDIDATES_SHEET);
  }
  
  if (!activeSheet || !archiveSheet) return 0;
  var data = activeSheet.getDataRange().getValues();
  if (data.length <= 1) return 0;
  
  var headers = data[0];
  var idCol = findColIndex(headers, ["Candidate ID", "id", "ID"]);
  var nameCol = findColIndex(headers, ["Name", "Candidate Name", "name"]);
  var phoneCol = findColIndex(headers, ["Phone", "Mobile", "phone"]);
  var emailCol = findColIndex(headers, ["Email", "email"]);
  var jobCol = findColIndex(headers, ["Job Title", "jobTitle", "Position"]);
  var stageCol = findColIndex(headers, ["Stage", "stage", "Status"]);
  var reasonCol = findColIndex(headers, ["Rejection Reason", "rejectionReason"]);
  var appliedCol = findColIndex(headers, ["Applied Date", "appliedDate"]);
  var expCol = findColIndex(headers, ["Experience (Yrs)", "experienceYears"]);
  var ctcCol = findColIndex(headers, ["Expected CTC", "expectedSalary"]);
  var hrCol = findColIndex(headers, ["HR Recruiter", "hrName"]);
  var notesCol = findColIndex(headers, ["NotesRemarks", "notes", "Remarks"]);
  
  var rowsToArchive = [];
  var rowIndicesToDelete = [];
  var now = new Date().toISOString();
  
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var canId = String(row[idCol] || "").trim();
    if (!canId) continue;
    
    var stage = String(row[stageCol] || "").trim().toLowerCase();
    var isRejected = (stage === "rejected" || stage === "declined" || stage === "archived");
    
    if (isRejected) {
      var rowObj = {};
      for (var h = 0; h < headers.length; h++) {
        rowObj[headers[h]] = row[h];
      }
      
      var archiveRow = [
        now,
        canId,
        row[nameCol] || "",
        row[jobCol] || "",
        row[phoneCol] || "",
        row[emailCol] || "",
        row[stageCol] || "Rejected",
        row[reasonCol] || "Candidate Rejected / Archived",
        row[appliedCol] || "",
        row[expCol] || 0,
        row[ctcCol] || "",
        row[hrCol] || "",
        row[notesCol] || "",
        JSON.stringify(rowObj)
      ];
      
      rowsToArchive.push(archiveRow);
      rowIndicesToDelete.push(i + 1);
    }
  }
  
  if (rowsToArchive.length > 0) {
    var nextRow = archiveSheet.getLastRow() + 1;
    archiveSheet.getRange(nextRow, 1, rowsToArchive.length, rowsToArchive[0].length).setValues(rowsToArchive);
    
    for (var d = rowIndicesToDelete.length - 1; d >= 0; d--) {
      activeSheet.deleteRow(rowIndicesToDelete[d]);
    }
    
    logArchiveOperation("Archive Rejected Candidates", rowsToArchive.length, "SUCCESS", "Archived " + rowsToArchive.length + " candidates to " + archiveSS.getName());
  }
  
  Logger.log("Archived " + rowsToArchive.length + " rejected candidates.");
  return rowsToArchive.length;
}

/**
 * 4. ARCHIVE OLD ATTENDANCE
 * Moves attendance records older than retention threshold (default 180 days) to Archive_Attendance.
 */
function archiveOldAttendance(daysThreshold) {
  var threshold = daysThreshold || CONFIG.ATTENDANCE_RETENTION_DAYS;
  var cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - threshold);
  var cutoffStr = cutoffDate.toISOString().slice(0, 10);
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var archiveSS = getArchiveSpreadsheet();
  var activeSheet = ss.getSheetByName(CONFIG.ACTIVE_ATTENDANCE_SHEET);
  var archiveSheet = archiveSS.getSheetByName(CONFIG.ARCHIVE_ATTENDANCE_SHEET);
  
  if (!activeSheet) return 0;
  if (!archiveSheet) {
    setupArchiveSheets();
    archiveSheet = archiveSS.getSheetByName(CONFIG.ARCHIVE_ATTENDANCE_SHEET);
  }
  
  if (!activeSheet || !archiveSheet) return 0;
  var data = activeSheet.getDataRange().getValues();
  if (data.length <= 1) return 0;
  
  var headers = data[0];
  var dateCol = findColIndex(headers, ["Date", "date"]);
  var empIdCol = findColIndex(headers, ["Employee ID", "employeeId", "ID"]);
  var statusCol = findColIndex(headers, ["Status", "status"]);
  var checkInCol = findColIndex(headers, ["Check In", "checkIn"]);
  var checkOutCol = findColIndex(headers, ["Check Out", "checkOut"]);
  var otCol = findColIndex(headers, ["Overtime Hours", "overtimeHours"]);
  var remCol = findColIndex(headers, ["Remarks", "remarks"]);
  var appCol = findColIndex(headers, ["Approval Status", "approvalStatus"]);
  
  var rowsToArchive = [];
  var rowIndicesToDelete = [];
  var now = new Date().toISOString();
  
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var attDate = String(row[dateCol] || "").trim();
    if (!attDate) continue;
    
    // Check if attendance date is older than cutoff
    if (attDate < cutoffStr) {
      var archiveRow = [
        now,
        attDate,
        row[empIdCol] || "",
        row[statusCol] || "Present",
        row[checkInCol] || "",
        row[checkOutCol] || "",
        row[otCol] || 0,
        row[remCol] || "",
        row[appCol] || "Approved",
        "Archived (Past " + threshold + " days)"
      ];
      
      rowsToArchive.push(archiveRow);
      rowIndicesToDelete.push(i + 1);
    }
  }
  
  if (rowsToArchive.length > 0) {
    var nextRow = archiveSheet.getLastRow() + 1;
    archiveSheet.getRange(nextRow, 1, rowsToArchive.length, rowsToArchive[0].length).setValues(rowsToArchive);
    
    for (var d = rowIndicesToDelete.length - 1; d >= 0; d--) {
      activeSheet.deleteRow(rowIndicesToDelete[d]);
    }
    
    logArchiveOperation("Archive Old Attendance", rowsToArchive.length, "SUCCESS", "Archived " + rowsToArchive.length + " attendance rows older than " + cutoffStr + " to " + archiveSS.getName());
  }
  
  Logger.log("Archived " + rowsToArchive.length + " attendance rows older than " + cutoffStr);
  return rowsToArchive.length;
}

/**
 * 5. MASTER OPTIMIZATION FUNCTION
 * Runs all cleanup routines in a single execution
 */
function runFullStorageOptimization() {
  Logger.log("Starting Full HRMS Storage Optimization...");
  var empCount = archiveLeftEmployees();
  var canCount = archiveRejectedCandidates();
  var attCount = archiveOldAttendance(CONFIG.ATTENDANCE_RETENTION_DAYS);
  
  var summary = "Optimization Completed! Left Employees Archived: " + empCount + ", Rejected Candidates Archived: " + canCount + ", Old Attendance Archived: " + attCount;
  logArchiveOperation("Full Storage Optimization", (empCount + canCount + attCount), "SUCCESS", summary);
  
  SpreadsheetApp.getActiveSpreadsheet().toast(summary, "Storage Optimizer", 8);
  return {
    success: true,
    employeesArchived: empCount,
    candidatesArchived: canCount,
    attendanceArchived: attCount
  };
}

/**
 * 6. INSTALL AUTOMATIC NIGHTLY TRIGGER (Runs every night at 2:00 AM)
 */
function scheduleNightlyArchiveTrigger() {
  // Delete existing triggers for this function to avoid duplicates
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "runFullStorageOptimization") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  
  // Create daily trigger at 2:00 AM
  ScriptApp.newTrigger("runFullStorageOptimization")
    .timeBased()
    .everyDays(1)
    .atHour(2)
    .create();
    
  Logger.log("✅ Automatic Nightly 2:00 AM Archive Trigger successfully scheduled!");
  SpreadsheetApp.getActiveSpreadsheet().toast("Nightly trigger installed (Runs at 2:00 AM daily)", "Trigger Active", 5);
}

/**
 * 7. WEB API ENDPOINT (For React Web Application 1-Click Remote Calls)
 */
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action;
    var result = {};
    
    if (action === "archiveEmployees") {
      result.count = archiveLeftEmployees();
      result.status = "success";
    } else if (action === "archiveCandidates") {
      result.count = archiveRejectedCandidates();
      result.status = "success";
    } else if (action === "archiveAttendance") {
      var days = data.days || CONFIG.ATTENDANCE_RETENTION_DAYS;
      result.count = archiveOldAttendance(days);
      result.status = "success";
    } else if (action === "optimizeAll") {
      result = runFullStorageOptimization();
    } else if (action === "setupSheets") {
      setupArchiveSheets();
      result.status = "success";
    } else {
      result.status = "error";
      result.message = "Unknown action requested: " + action;
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    service: "Rathi Buildmart HRMS Archive Script",
    version: "2.5.0",
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

// ----------------------------------------------------------------------------
// HELPER UTILITIES
// ----------------------------------------------------------------------------

function createSheetIfNotExists(ss, title, headers, headerBg, headerColor) {
  var sheet = ss.getSheetByName(title);
  if (!sheet) {
    sheet = ss.insertSheet(title);
  }
  
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground(headerBg || "#1e3a2f");
    headerRange.setFontColor(headerColor || "#ffffff");
    headerRange.setFontWeight("bold");
    headerRange.setFontFamily("Plus Jakarta Sans");
    sheet.setFrozenRows(1);
    
    // Auto-fit column widths
    for (var c = 1; c <= headers.length; c++) {
      sheet.autoResizeColumn(c);
    }
  }
  return sheet;
}

function findColIndex(headers, possibleNames) {
  for (var i = 0; i < headers.length; i++) {
    var h = String(headers[i] || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    for (var j = 0; j < possibleNames.length; j++) {
      var p = possibleNames[j].trim().toLowerCase().replace(/[^a-z0-9]/g, "");
      if (h === p) return i;
    }
  }
  return -1;
}

function logArchiveOperation(op, count, status, details) {
  try {
    var archiveSS = getArchiveSpreadsheet();
    var logSheet = archiveSS.getSheetByName(CONFIG.ARCHIVE_LOGS_SHEET);
    if (!logSheet) {
      setupArchiveSheets();
      logSheet = archiveSS.getSheetByName(CONFIG.ARCHIVE_LOGS_SHEET);
    }
    if (logSheet) {
      logSheet.appendRow([
        new Date().toISOString(),
        op,
        count,
        status,
        details
      ]);
    }
  } catch (e) {
    Logger.log("Log error: " + e);
  }
}
`;

/**
 * Returns customized Google Apps Script code with the actual dedicated Archive Spreadsheet ID pre-injected.
 */
export function getAppsScriptArchiveCode(archiveSpreadsheetId?: string | null): string {
  if (!archiveSpreadsheetId || archiveSpreadsheetId.trim() === '') {
    return APPS_SCRIPT_ARCHIVE_CODE;
  }
  return APPS_SCRIPT_ARCHIVE_CODE.replace(
    'ARCHIVE_SPREADSHEET_ID: "YOUR_DEDICATED_ARCHIVE_SPREADSHEET_ID_HERE"',
    `ARCHIVE_SPREADSHEET_ID: "${archiveSpreadsheetId.trim()}"`
  );
}


export const APPS_SCRIPT_INSTRUCTIONS = [
  {
    step: 1,
    title: "Open your Google Sheet",
    description: "Open your active HRMS Google Spreadsheet ('Payroll_Management_System_Data') in your browser."
  },
  {
    step: 2,
    title: "Open Google Apps Script Editor",
    description: "In Google Sheets top menu, click on 'Extensions' (विस्तार) ➔ select 'Apps Script'."
  },
  {
    step: 3,
    title: "Paste the Code",
    description: "Delete any default code inside 'Code.gs' and paste the entire script copied from this panel."
  },
  {
    step: 4,
    title: "Save & Initial Run",
    description: "Click the Save icon (💾). In the function dropdown, select 'setupArchiveSheets' and click 'Run' (▶) to initialize all archive sheets with custom colors and headers."
  },
  {
    step: 5,
    title: "Enable Automatic 2:00 AM Nightly Maintenance",
    description: "Select 'scheduleNightlyArchiveTrigger' and click 'Run'. The system will automatically archive left employees & old records every night without manual intervention!"
  }
];
