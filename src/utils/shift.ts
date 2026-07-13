/**
 * Utilities for parsing and calculating shift timings, late coming, and early going.
 */

export interface TimeObject {
  hour: number;
  minute: number;
}

export interface AttendanceLike {
  status?: string;
  checkIn?: string;
  checkOut?: string;
}

/**
 * Parses a "HH:MM" string in 24-hour format into an hour and minute object.
 */
export const parseTime = (timeStr?: string): TimeObject | null => {
  if (!timeStr) return null;
  const match = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return { hour: parseInt(match[1], 10), minute: parseInt(match[2], 10) };
};

/**
 * Parses the start time from an employee's workTiming description string (e.g., "General Shift (09:00 AM - 06:00 PM)").
 * Supports AM/PM or 24-hour formats. Falls back to a default value if parsing fails.
 */
export const parseShiftStart = (workTiming?: string, fallback: string = "09:00"): TimeObject => {
  if (!workTiming) {
    const p = parseTime(fallback);
    return p || { hour: 9, minute: 0 };
  }
  const match = workTiming.match(/(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?/i);
  if (match) {
    let hour = parseInt(match[1], 10);
    const minute = parseInt(match[2], 10);
    const ampm = match[3];
    if (ampm) {
      const isPm = ampm.toUpperCase() === 'PM';
      if (isPm && hour < 12) hour += 12;
      if (!isPm && hour === 12) hour = 0;
    }
    return { hour, minute };
  }
  const p = parseTime(fallback);
  return p || { hour: 9, minute: 0 };
};

/**
 * Parses the end time from an employee's workTiming description string (e.g., "General Shift (09:00 AM - 06:00 PM)").
 * Supports AM/PM or 24-hour formats. Falls back to a default value if parsing fails.
 */
export const parseShiftEnd = (workTiming?: string, fallback: string = "18:00"): TimeObject => {
  if (!workTiming) {
    const p = parseTime(fallback);
    return p || { hour: 18, minute: 0 };
  }
  const matches = [...workTiming.matchAll(/(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?/gi)];
  if (matches.length >= 2) {
    const match = matches[1];
    let hour = parseInt(match[1], 10);
    const minute = parseInt(match[2], 10);
    const ampm = match[3];
    if (ampm) {
      const isPm = ampm.toUpperCase() === 'PM';
      if (isPm && hour < 12) hour += 12;
      if (!isPm && hour === 12) hour = 0;
    }
    return { hour, minute };
  }
  const p = parseTime(fallback);
  return p || { hour: 18, minute: 0 };
};

/**
 * Extract clean "HH:MM" start and end strings in 24-hour format from a workTiming string.
 */
export const getShiftTimings = (
  workTiming?: string,
  defaultIn: string = "09:00",
  defaultOut: string = "18:00"
): { checkIn: string; checkOut: string } => {
  const start = parseShiftStart(workTiming, defaultIn);
  const end = parseShiftEnd(workTiming, defaultOut);
  
  const checkIn = `${String(start.hour).padStart(2, '0')}:${String(start.minute).padStart(2, '0')}`;
  const checkOut = `${String(end.hour).padStart(2, '0')}:${String(end.minute).padStart(2, '0')}`;
  return { checkIn, checkOut };
};

/**
 * Computes checkout time for half-day (typically 4.5 hours after start).
 */
export const getHalfDayCheckOut = (checkInStr: string): string => {
  const [h, m] = checkInStr.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return "13:30";
  let outH = h + 4;
  let outM = m + 30;
  if (outM >= 60) {
    outH += 1;
    outM -= 60;
  }
  outH = outH % 24;
  return `${String(outH).padStart(2, '0')}:${String(outM).padStart(2, '0')}`;
};

/**
 * Checks if a check-in is late compared to the shift start timing (allowing for a grace period).
 * Default grace period is 5 minutes.
 */
export const isAttendanceLate = (
  record: AttendanceLike,
  workTiming?: string,
  defaultCheckIn: string = "09:00",
  graceMinutes: number = 5
): boolean => {
  if (!record.checkIn || record.checkIn === '--:--' || record.checkIn === '') return false;
  const checkInTime = parseTime(record.checkIn);
  if (!checkInTime) return false;
  const shiftStart = parseShiftStart(workTiming, defaultCheckIn);
  
  const checkInMin = checkInTime.hour * 60 + checkInTime.minute;
  const shiftStartMin = shiftStart.hour * 60 + shiftStart.minute;
  
  // Late if check-in is beyond shift start + grace period
  return checkInMin > (shiftStartMin + graceMinutes);
};

/**
 * Checks if a check-out is early compared to the shift end timing.
 */
export const isAttendanceEarlyGoing = (
  record: AttendanceLike,
  workTiming?: string,
  defaultCheckOut: string = "18:00"
): boolean => {
  if (record.status === 'Half Day') return false; // Half day has its own logic
  if (!record.checkOut || record.checkOut === '--:--' || record.checkOut === '') return false;
  const checkOutTime = parseTime(record.checkOut);
  if (!checkOutTime) return false;
  const shiftEnd = parseShiftEnd(workTiming, defaultCheckOut);
  
  const checkOutMin = checkOutTime.hour * 60 + checkOutTime.minute;
  const shiftEndMin = shiftEnd.hour * 60 + shiftEnd.minute;
  
  // Early if checkout is before shift end
  return checkOutMin < shiftEndMin;
};

/**
 * Computes standard shift duration in hours (handles night shift wrapping around midnight).
 */
export const getShiftDurationHours = (checkInStr: string, checkOutStr: string): number => {
  const [inH, inM] = checkInStr.split(':').map(Number);
  const [outH, outM] = checkOutStr.split(':').map(Number);
  if (isNaN(inH) || isNaN(outH)) return 9; // Default 9 hours
  
  let diff = (outH + outM / 60) - (inH + inM / 60);
  if (diff < 0) {
    // Night shift (ends next day)
    diff += 24;
  }
  return diff;
};
