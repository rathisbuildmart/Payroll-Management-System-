import React, { useState, useEffect } from 'react';
import { Calendar, Check, Save, UserCheck, UserX, AlertTriangle, Clock, RefreshCw } from 'lucide-react';
import { Employee, Attendance } from '../types';

interface AttendanceTrackerProps {
  employees: Employee[];
  attendanceRecords: Attendance[];
  onSaveAttendance: (date: string, records: Attendance[]) => Promise<void>;
  language: 'en' | 'hi';
}

export default function AttendanceTracker({ employees, attendanceRecords, onSaveAttendance, language }: AttendanceTrackerProps) {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [localRecords, setLocalRecords] = useState<{ [empId: string]: Attendance }>({});
  const [isSaving, setIsSaving] = useState(false);

  const activeEmployees = employees.filter(e => e.isActive);

  const t = {
    en: {
      title: "Attendance Tracker",
      selectDate: "Select Work Date",
      bulkPresent: "Mark All Present",
      bulkAbsent: "Mark All Absent",
      colEmp: "Employee Info",
      colStatus: "Attendance Status",
      colTiming: "Working Hours",
      colOvertime: "Overtime (Hrs)",
      colRemarks: "Remarks / Notes",
      present: "Present",
      absent: "Absent",
      halfDay: "Half Day",
      leave: "On Leave",
      checkIn: "In",
      checkOut: "Out",
      saveBtn: "Save & Sync Attendance",
      saving: "Uploading to Sheets...",
      savedSuccess: "Attendance recorded successfully!",
      noEmployees: "Please register active employees first under the Employee tab.",
      autoOvertimeTitle: "Auto-calculate Overtime",
    },
    hi: {
      title: "उपस्थिति ट्रैकर",
      selectDate: "कार्य तिथि चुनें",
      bulkPresent: "सबको उपस्थित करें",
      bulkAbsent: "सबको अनुपस्थित करें",
      colEmp: "कर्मचारी विवरण",
      colStatus: "उपस्थिति की स्थिति",
      colTiming: "काम के घंटे",
      colOvertime: "ओवरटाइम (घंटे)",
      colRemarks: "टिप्पणी / नोट्स",
      present: "उपस्थित",
      absent: "अनुपस्थित",
      halfDay: "हाफ डे",
      leave: "छुट्टी पर",
      checkIn: "आगमन",
      checkOut: "प्रस्थान",
      saveBtn: "उपस्थिति सुरक्षित करें",
      saving: "शीट्स में अपलोड हो रहा है...",
      savedSuccess: "उपस्थिति सफलतापूर्वक दर्ज की गई!",
      noEmployees: "कृपया पहले कर्मचारी टैब के तहत सक्रिय कर्मचारियों को पंजीकृत करें।",
      autoOvertimeTitle: "ऑटो ओवरटाइम गणना",
    }
  }[language];

  // Load existing records or set defaults when selectedDate or employees list changes
  useEffect(() => {
    const recordsForDate = attendanceRecords.filter(r => r.date === selectedDate);
    const newLocalRecords: { [empId: string]: Attendance } = {};

    activeEmployees.forEach(emp => {
      const existing = recordsForDate.find(r => r.employeeId === emp.id);
      if (existing) {
        newLocalRecords[emp.id] = { ...existing };
      } else {
        // Default values
        newLocalRecords[emp.id] = {
          date: selectedDate,
          employeeId: emp.id,
          status: 'Present',
          checkIn: '09:00',
          checkOut: '18:00',
          overtimeHours: 0,
          remarks: '',
        };
      }
    });

    setLocalRecords(newLocalRecords);
  }, [selectedDate, attendanceRecords, employees]);

  const handleStatusChange = (empId: string, status: Attendance['status']) => {
    setLocalRecords(prev => {
      const rec = prev[empId];
      let checkIn = rec.checkIn;
      let checkOut = rec.checkOut;
      let overtimeHours = rec.overtimeHours;

      if (status === 'Absent' || status === 'Leave') {
        checkIn = '';
        checkOut = '';
        overtimeHours = 0;
      } else if (status === 'Present' && (rec.status === 'Miss Punch' || !checkIn || checkIn === '' || !checkOut || checkOut === '')) {
        checkIn = '09:00';
        checkOut = '18:00';
      } else if (status === 'Half Day' && (!checkIn || checkIn === '09:00')) {
        checkIn = '09:00';
        checkOut = '13:30';
        overtimeHours = 0;
      } else if (status === 'Miss Punch') {
        checkIn = rec.checkIn || '09:00';
        checkOut = '';
        overtimeHours = 0;
      }

      return {
        ...prev,
        [empId]: {
          ...rec,
          status,
          checkIn,
          checkOut,
          overtimeHours,
        }
      };
    });
  };

  const handleTimeChange = (empId: string, field: 'checkIn' | 'checkOut', value: string) => {
    setLocalRecords(prev => {
      const rec = prev[empId];
      const updated = { ...rec, [field]: value };

      // Optional auto calculation of overtime if checkIn & checkOut are valid
      if (field === 'checkOut' && rec.checkIn && value) {
        const [inH, inM] = rec.checkIn.split(':').map(Number);
        const [outH, outM] = value.split(':').map(Number);
        
        if (!isNaN(inH) && !isNaN(outH)) {
          const totalHours = (outH + outM / 60) - (inH + inM / 60);
          const regularHours = 9; // standard 9-hour workday (e.g. 9 to 6)
          if (totalHours > regularHours) {
            const calculatedOvertime = Math.round((totalHours - regularHours) * 10) / 10;
            updated.overtimeHours = Math.max(0, calculatedOvertime);
          } else {
            updated.overtimeHours = 0;
          }
        }
      }

      return { ...prev, [empId]: updated };
    });
  };

  const handleNumericChange = (empId: string, value: number) => {
    setLocalRecords(prev => ({
      ...prev,
      [empId]: { ...prev[empId], overtimeHours: Math.max(0, value) }
    }));
  };

  const handleRemarksChange = (empId: string, value: string) => {
    setLocalRecords(prev => ({
      ...prev,
      [empId]: { ...prev[empId], remarks: value }
    }));
  };

  const markBulkStatus = (status: Attendance['status']) => {
    setLocalRecords(prev => {
      const bulk = { ...prev };
      Object.keys(bulk).forEach(empId => {
        bulk[empId] = {
          ...bulk[empId],
          status,
          checkIn: (status === 'Present' ? '09:00' : status === 'Half Day' ? '09:00' : ''),
          checkOut: (status === 'Present' ? '18:00' : status === 'Half Day' ? '13:30' : ''),
          overtimeHours: 0,
        };
      });
      return bulk;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const recordsToSave = Object.values(localRecords) as Attendance[];
      await onSaveAttendance(selectedDate, recordsToSave);
      alert(t.savedSuccess);
    } catch (err) {
      console.error(err);
      alert('Error updating Google Sheets. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Date selector card */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-gray-500" />
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">{t.selectDate}</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#03623c] bg-white cursor-pointer text-gray-800"
              id="attendance-date"
            />
          </div>
        </div>

        {/* Bulk Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => markBulkStatus('Present')}
            className="px-4 py-2 border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            id="bulk-present"
          >
            <UserCheck className="w-4 h-4" />
            {t.bulkPresent}
          </button>
          <button
            onClick={() => markBulkStatus('Absent')}
            className="px-4 py-2 border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            id="bulk-absent"
          >
            <UserX className="w-4 h-4" />
            {t.bulkAbsent}
          </button>
        </div>
      </div>

      {/* Attendance Entries Grid */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        {activeEmployees.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-4 px-6 min-w-[200px]">{t.colEmp}</th>
                  <th className="py-4 px-6 text-center min-w-[280px]">{t.colStatus}</th>
                  <th className="py-4 px-6 text-center min-w-[180px]">{t.colTiming}</th>
                  <th className="py-4 px-6 text-center min-w-[100px]">{t.colOvertime}</th>
                  <th className="py-4 px-6">{t.colRemarks}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {activeEmployees.map((emp) => {
                  const record = localRecords[emp.id] || {
                    date: selectedDate,
                    employeeId: emp.id,
                    status: 'Present',
                    checkIn: '09:00',
                    checkOut: '18:00',
                    overtimeHours: 0,
                    remarks: '',
                  };

                  return (
                    <tr key={emp.id} className="hover:bg-gray-50/30 transition-colors">
                      {/* Employee brief */}
                      <td className="py-4 px-6">
                        <div>
                          <div className="font-semibold text-gray-900">{emp.name}</div>
                          <div className="text-xs font-mono text-gray-400 font-medium">{emp.id} · {emp.designation}</div>
                        </div>
                      </td>

                      {/* Status selectors */}
                      <td className="py-4 px-6 text-center">
                        {record.status === 'Miss Punch' ? (
                          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 bg-amber-50/70 border border-amber-200 p-1.5 rounded-xl">
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-extrabold text-amber-800 uppercase tracking-wider animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              <span>{language === 'en' ? 'Miss Punch (Pending)' : 'मिस पंच (लंबित)'}</span>
                            </div>
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleStatusChange(emp.id, 'Present')}
                                className="px-2.5 py-1 bg-[#03623c] hover:bg-[#024d2e] text-white font-extrabold text-[10px] rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-3xs"
                              >
                                <Check className="w-3 h-3" />
                                <span>{language === 'en' ? 'Approve' : 'मंजूर करें'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(emp.id, 'Absent')}
                                className="px-2 py-1 bg-white hover:bg-red-50 border border-gray-200 hover:border-red-200 text-gray-500 hover:text-red-600 font-bold text-[10px] rounded-lg transition-colors cursor-pointer"
                              >
                                {language === 'en' ? 'Absent' : 'अनुपस्थित'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="inline-flex p-1 bg-gray-100 rounded-xl gap-1">
                            {/* Present */}
                            <button
                              type="button"
                              onClick={() => handleStatusChange(emp.id, 'Present')}
                              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                                record.status === 'Present' 
                                  ? 'bg-[#03623c] text-white shadow-xs' 
                                  : 'text-gray-600 hover:text-gray-900'
                              }`}
                            >
                              {t.present}
                            </button>
                            {/* Half Day */}
                            <button
                              type="button"
                              onClick={() => handleStatusChange(emp.id, 'Half Day')}
                              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                                record.status === 'Half Day' 
                                  ? 'bg-amber-500 text-white shadow-xs' 
                                  : 'text-gray-600 hover:text-gray-900'
                              }`}
                            >
                              {t.halfDay}
                            </button>
                            {/* Absent */}
                            <button
                              type="button"
                              onClick={() => handleStatusChange(emp.id, 'Absent')}
                              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                                record.status === 'Absent' 
                                  ? 'bg-red-600 text-white shadow-xs' 
                                  : 'text-gray-600 hover:text-gray-900'
                              }`}
                            >
                              {t.absent}
                            </button>
                            {/* Leave */}
                            <button
                              type="button"
                              onClick={() => handleStatusChange(emp.id, 'Leave')}
                              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                                record.status === 'Leave' 
                                  ? 'bg-teal-600 text-white shadow-xs' 
                                  : 'text-gray-600 hover:text-gray-900'
                              }`}
                            >
                              {t.leave}
                            </button>
                            {/* Miss Punch */}
                            <button
                              type="button"
                              onClick={() => handleStatusChange(emp.id, 'Miss Punch')}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 animate-pulse"
                            >
                              {language === 'en' ? 'Miss Punch' : 'मिस पंच'}
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Timings */}
                      <td className="py-4 px-6 text-center">
                        {record.status === 'Present' || record.status === 'Half Day' || record.status === 'Miss Punch' ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="flex items-center gap-1">
                              <span className="text-xxs text-gray-400 font-bold uppercase">{t.checkIn}</span>
                              <input
                                type="time"
                                value={record.checkIn}
                                onChange={(e) => handleTimeChange(emp.id, 'checkIn', e.target.value)}
                                className="border border-gray-200 rounded-lg px-1.5 py-1 text-xs text-gray-700 bg-white"
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-xxs text-gray-400 font-bold uppercase">{t.checkOut}</span>
                              <input
                                type="time"
                                value={record.checkOut}
                                onChange={(e) => handleTimeChange(emp.id, 'checkOut', e.target.value)}
                                className="border border-gray-200 rounded-lg px-1.5 py-1 text-xs text-gray-700 bg-white"
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>

                      {/* Overtime Hrs */}
                      <td className="py-4 px-6 text-center">
                        {record.status === 'Present' || record.status === 'Half Day' || record.status === 'Miss Punch' ? (
                          <div className="inline-flex items-center gap-1">
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              value={record.overtimeHours || ''}
                              placeholder="0"
                              onChange={(e) => handleNumericChange(emp.id, Number(e.target.value))}
                              className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-xs text-center font-semibold text-gray-700 bg-white focus:outline-none"
                            />
                            <span className="text-xxs text-gray-400 font-medium">h</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>

                      {/* Remarks */}
                      <td className="py-4 px-6">
                        <input
                          type="text"
                          value={record.remarks}
                          onChange={(e) => handleRemarksChange(emp.id, e.target.value)}
                          placeholder="e.g. Medical emergency, Late entry"
                          className="w-full border border-gray-200 rounded-lg px-3 py-1 text-xs text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#03623c]"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400 bg-gray-50/50">
            <AlertTriangle className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-base font-semibold">{t.noEmployees}</p>
          </div>
        )}

        {/* Footer save strip */}
        {activeEmployees.length > 0 && (
          <div className="bg-gray-50 border-t border-gray-100 p-4 flex justify-between items-center">
            <span className="text-xs text-gray-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {t.autoOvertimeTitle}
            </span>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-[#03623c] hover:bg-[#024d2e] disabled:bg-[#03623c]/50 text-white px-5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer"
              id="save-attendance"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {t.saving}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {t.saveBtn}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
