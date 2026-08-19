import React, { useState, useEffect } from 'react';
import { 
  X, AlertTriangle, CheckCircle2, Clock, Calendar, User, ShieldCheck, 
  Send, Lock, Unlock, FileText, Sparkles, Building, Briefcase, ChevronRight,
  HelpCircle, Check, ArrowRight
} from 'lucide-react';
import { Employee, Attendance, AttendanceChangeRequest } from '../types';
import { getShiftTimings, getHalfDayCheckOut } from '../utils/shift';

interface AttendanceChangeRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  attendanceDate: string;
  currentRecord: Attendance;
  portalUser?: any;
  canDirectEdit: boolean;
  isLockedForUser: boolean;
  onSubmitRequest: (request: Omit<AttendanceChangeRequest, 'id' | 'requestedAt' | 'status'>) => Promise<void>;
  onDirectApply: (updatedRecord: Attendance, reason: string, remarks: string) => Promise<void>;
}

const COMMON_REASONS = [
  "Biometric Machine Issue / Punch Not Recorded",
  "Employee Forgot to Punch (Biometric/Card)",
  "Official Duty (OD) / Client Visit / Field Work",
  "Pre-Approved Late Coming / Early Leaving by HOD",
  "Medical / Emergency Reason",
  "Shift Timing Correction / Roster Mismatch",
  "Manual Attendance Adjustment by Management",
  "Other (Specified in Remarks)"
];

export default function AttendanceChangeRequestModal({
  isOpen,
  onClose,
  employee,
  attendanceDate,
  currentRecord,
  portalUser,
  canDirectEdit,
  isLockedForUser,
  onSubmitRequest,
  onDirectApply
}: AttendanceChangeRequestModalProps) {
  if (!isOpen || !employee) return null;

  const [newStatus, setNewStatus] = useState<Attendance['status']>(currentRecord.status || 'Present');
  const [newCheckIn, setNewCheckIn] = useState<string>(currentRecord.checkIn || '');
  const [newCheckOut, setNewCheckOut] = useState<string>(currentRecord.checkOut || '');
  const [newOvertimeHours, setNewOvertimeHours] = useState<number>(currentRecord.overtimeHours || 0);
  const [selectedReason, setSelectedReason] = useState<string>(COMMON_REASONS[0]);
  const [customReason, setCustomReason] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [applyDirectly, setApplyDirectly] = useState<boolean>(canDirectEdit);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Reset or update state when record changes
  useEffect(() => {
    setNewStatus(currentRecord.status || 'Present');
    setNewCheckIn(currentRecord.checkIn || '');
    setNewCheckOut(currentRecord.checkOut || '');
    setNewOvertimeHours(currentRecord.overtimeHours || 0);
    setRemarks('');
    setSelectedReason(COMMON_REASONS[0]);
    setCustomReason('');
    setApplyDirectly(canDirectEdit);
    setErrorMessage('');
  }, [currentRecord, canDirectEdit, isOpen]);

  // Quick fill with shift timings
  const handleUseShiftTimings = () => {
    const timings = getShiftTimings(employee.workTiming, '09:00', '18:00');
    setNewCheckIn(timings.checkIn);
    setNewCheckOut(newStatus === 'Half Day' ? getHalfDayCheckOut(timings.checkIn) : timings.checkOut);
  };

  // Adjust timing based on status
  const handleStatusSelect = (status: Attendance['status']) => {
    setNewStatus(status);
    const timings = getShiftTimings(employee.workTiming, '09:00', '18:00');
    if (status === 'Absent' || status === 'Leave') {
      setNewCheckIn('');
      setNewCheckOut('');
      setNewOvertimeHours(0);
    } else if (status === 'Present') {
      if (!newCheckIn) setNewCheckIn(timings.checkIn);
      if (!newCheckOut) setNewCheckOut(timings.checkOut);
    } else if (status === 'Half Day') {
      if (!newCheckIn) setNewCheckIn(timings.checkIn);
      setNewCheckOut(getHalfDayCheckOut(timings.checkIn));
      setNewOvertimeHours(0);
    } else if (status === 'Miss Punch') {
      if (!newCheckIn) setNewCheckIn(timings.checkIn);
      setNewCheckOut('');
      setNewOvertimeHours(0);
    }
  };

  const finalReason = selectedReason === 'Other (Specified in Remarks)' && customReason.trim()
    ? `Other: ${customReason.trim()}`
    : selectedReason;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!remarks.trim()) {
      setErrorMessage('Please enter mandatory justification remarks explaining why this attendance update is required.');
      return;
    }

    if (selectedReason === 'Other (Specified in Remarks)' && !customReason.trim()) {
      setErrorMessage('Please specify the custom reason.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (applyDirectly && canDirectEdit) {
        // Apply directly as Admin/Director or granted HR
        const updatedRecord: Attendance = {
          ...currentRecord,
          date: attendanceDate,
          employeeId: employee.id,
          status: newStatus,
          checkIn: newCheckIn,
          checkOut: newCheckOut,
          overtimeHours: newOvertimeHours,
          remarks: remarks.trim()
        };
        await onDirectApply(updatedRecord, finalReason, remarks.trim());
      } else {
        // Submit as pending request for Director/Admin approval
        const requestData: Omit<AttendanceChangeRequest, 'id' | 'requestedAt' | 'status'> = {
          attendanceDate,
          employeeId: employee.id,
          employeeName: employee.name,
          department: employee.department || '',
          branch: employee.branch || '',
          designation: employee.designation || '',
          currentStatus: currentRecord.status,
          currentCheckIn: currentRecord.checkIn || '',
          currentCheckOut: currentRecord.checkOut || '',
          currentOvertimeHours: currentRecord.overtimeHours || 0,
          requestedStatus: newStatus,
          requestedCheckIn: newCheckIn,
          requestedCheckOut: newCheckOut,
          requestedOvertimeHours: newOvertimeHours,
          reason: finalReason,
          remarks: remarks.trim(),
          requestedByUsername: portalUser?.username || 'hr_user',
          requestedByName: portalUser?.name || portalUser?.username || 'HR Officer',
          requestedByRole: portalUser?.role || 'hr',
          actionType: 'change_request'
        };
        await onSubmitRequest(requestData);
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.message || 'Failed to process attendance update request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-[#11221b] border border-slate-200 dark:border-[#1e3a2f] rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-6">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-[#03623c] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400 border border-white/10 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">
                  {canDirectEdit && applyDirectly 
                    ? 'Attendance Modification & Audit' 
                    : 'Request Attendance Change / Approval'}
                </h3>
                {isLockedForUser && (
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    {'Locked Mode'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300">
                {'Modify attendance record with mandatory reason and justification remarks.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Employee Summary Ribbon */}
        <div className="bg-slate-50 dark:bg-[#0c1a14] px-6 py-3 border-b border-slate-100 dark:border-[#1e3a2f] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-600/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-extrabold flex items-center justify-center text-xs">
              {employee.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-bold text-slate-900 dark:text-slate-100">{employee.name}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                {employee.id} • {employee.department || 'General'} • {employee.designation || 'Staff'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-[#0b1812] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#1e3a2f]">
            <Calendar className="w-4 h-4 text-[#03623c] dark:text-emerald-400" />
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
              {attendanceDate}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>{errorMessage}</div>
            </div>
          )}

          {/* Current vs Requested Value Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Current Recorded Values */}
            <div className="bg-slate-50 dark:bg-[#0c1a14] p-4 rounded-xl border border-slate-200 dark:border-[#1e3a2f] space-y-2.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>{'Current Recorded Values'}</span>
                <span className="text-[10px] font-mono bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300">As on file</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-800">
                  <span className="text-slate-500">Status:</span>
                  <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                    currentRecord.status === 'Present' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                    currentRecord.status === 'Half Day' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                    currentRecord.status === 'Absent' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                    currentRecord.status === 'Leave' ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300' :
                    'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}>
                    {currentRecord.status}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-800">
                  <span className="text-slate-500">Check In:</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{currentRecord.checkIn || '—'}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-800">
                  <span className="text-slate-500">Check Out:</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{currentRecord.checkOut || '—'}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">Overtime:</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{currentRecord.overtimeHours || 0} hrs</span>
                </div>
              </div>
            </div>

            {/* Proposed / New Values */}
            <div className="bg-emerald-50/40 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-200/70 dark:border-emerald-900/50 space-y-2.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 flex items-center justify-between">
                <span>{'New / Requested Values'}</span>
                <button
                  type="button"
                  onClick={handleUseShiftTimings}
                  className="text-[10px] text-emerald-700 dark:text-emerald-300 hover:underline font-bold cursor-pointer"
                >
                  ⚡ Shift Default
                </button>
              </div>

              {/* Status Chips */}
              <div>
                <label className="block text-[10px] font-extrabold text-slate-600 dark:text-slate-400 uppercase mb-1">New Status:</label>
                <div className="grid grid-cols-3 gap-1">
                  {(['Present', 'Half Day', 'Absent', 'Leave', 'Miss Punch'] as Attendance['status'][]).map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleStatusSelect(st)}
                      className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer text-center ${
                        newStatus === st 
                          ? 'bg-[#03623c] text-white shadow-xs' 
                          : 'bg-white dark:bg-[#0b1812] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#1e3a2f] hover:bg-slate-50'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Timings */}
              {(newStatus === 'Present' || newStatus === 'Half Day' || newStatus === 'Miss Punch') && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-0.5">In Time:</label>
                    <input
                      type="time"
                      value={newCheckIn}
                      onChange={(e) => setNewCheckIn(e.target.value)}
                      className="w-full border border-slate-200 dark:border-[#1e3a2f] rounded-lg px-2 py-1 text-xs font-semibold bg-white dark:bg-[#0b1812] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#03623c]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-0.5">Out Time:</label>
                    <input
                      type="time"
                      value={newCheckOut}
                      onChange={(e) => setNewCheckOut(e.target.value)}
                      className="w-full border border-slate-200 dark:border-[#1e3a2f] rounded-lg px-2 py-1 text-xs font-semibold bg-white dark:bg-[#0b1812] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#03623c]"
                    />
                  </div>
                </div>
              )}

              {/* Overtime */}
              {(newStatus === 'Present' || newStatus === 'Half Day') && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-0.5">Overtime (Hours):</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={newOvertimeHours}
                    onChange={(e) => setNewOvertimeHours(Number(e.target.value))}
                    className="w-full border border-slate-200 dark:border-[#1e3a2f] rounded-lg px-2 py-1 text-xs font-semibold bg-white dark:bg-[#0b1812] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#03623c]"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Reason Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
              Reason for Attendance Change <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full border border-slate-200 dark:border-[#1e3a2f] rounded-xl px-3 py-2 text-xs font-medium bg-white dark:bg-[#0b1812] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#03623c] cursor-pointer"
            >
              {COMMON_REASONS.map((r) => (
                <option key={r} value={r} className="dark:bg-[#11221b]">{r}</option>
              ))}
            </select>

            {selectedReason === 'Other (Specified in Remarks)' && (
              <input
                type="text"
                placeholder="Specify reason..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="w-full mt-2 border border-slate-200 dark:border-[#1e3a2f] rounded-xl px-3 py-2 text-xs bg-white dark:bg-[#0b1812] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#03623c]"
              />
            )}
          </div>

          {/* Remarks & Justification */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                Detailed Remarks / Justification <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">Mandatory for Audit Trail</span>
            </div>
            <textarea
              rows={3}
              required
              placeholder="e.g. Employee came on time but machine thumb sensor failed. Verified by Supervisor Mr. Sharma."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full border border-slate-200 dark:border-[#1e3a2f] rounded-xl p-3 text-xs bg-white dark:bg-[#0b1812] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#03623c] leading-relaxed"
            />
          </div>

          {/* Admin Override Option */}
          {canDirectEdit && (
            <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                    {'Administrative Direct Override'}
                  </div>
                  <div className="text-[11px] text-indigo-700 dark:text-indigo-400">
                    {'Apply modification immediately and log directly into the Audit History.'}
                  </div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={applyDirectly}
                  onChange={(e) => setApplyDirectly(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          )}

          {!canDirectEdit && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
              <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Approval Required:</span> This change request will be submitted to the <strong>Director / Super Admin</strong> for verification and approval.
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-[#1e3a2f] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 bg-slate-100 dark:bg-[#0b1812] hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 ${
                applyDirectly && canDirectEdit 
                  ? 'bg-indigo-600 hover:bg-indigo-700' 
                  : 'bg-[#03623c] hover:bg-[#024d2e]'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : applyDirectly && canDirectEdit ? (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Apply & Record Audit</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Change Request</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
