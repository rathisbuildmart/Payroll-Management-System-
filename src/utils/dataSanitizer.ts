import { Employee, Attendance, PayrollRecord } from '../types';

const MOCK_EMP_IDS = new Set(['EMP001', 'EMP002', 'EMP003', 'EMP004']);
const MOCK_EMP_NAMES = new Set(['Rajesh Kumar', 'Sunita Sharma', 'Amit Patel', 'Suresh Kumar']);

export function isMockEmployee(emp: Partial<Employee>): boolean {
  if (!emp) return false;
  const idMatch = emp.id && MOCK_EMP_IDS.has(emp.id.trim());
  const nameMatch = emp.name && MOCK_EMP_NAMES.has(emp.name.trim());
  return Boolean(idMatch && nameMatch);
}

export function sanitizeEmployees(list: Employee[]): Employee[] {
  if (!Array.isArray(list)) return [];
  return list.filter(emp => !isMockEmployee(emp));
}

export function sanitizeAttendance(list: Attendance[]): Attendance[] {
  if (!Array.isArray(list)) return [];
  return list.filter(att => {
    if (!att || !att.employeeId) return false;
    const isMockEmp = MOCK_EMP_IDS.has(att.employeeId.trim());
    const isMockRemarks = att.remarks === 'Sick leave' || att.remarks === 'Personal chore' || att.remarks === 'On-time';
    return !(isMockEmp && isMockRemarks);
  });
}

export function sanitizePayroll(list: PayrollRecord[]): PayrollRecord[] {
  if (!Array.isArray(list)) return [];
  return list.filter(p => {
    if (!p || !p.employeeId) return false;
    return !MOCK_EMP_IDS.has(p.employeeId.trim());
  });
}

/**
 * Runs on app initialization to scrub any residual mock or demo data from browser storage
 */
export function scrubMockDataFromStorage(): void {
  if (typeof window === 'undefined') return;

  try {
    // 1. Employees
    const rawEmps = localStorage.getItem('cached_employees');
    if (rawEmps) {
      const parsed = JSON.parse(rawEmps);
      if (Array.isArray(parsed)) {
        const cleaned = sanitizeEmployees(parsed);
        localStorage.setItem('cached_employees', JSON.stringify(cleaned));
      }
    }

    // 2. Attendance
    const rawAtt = localStorage.getItem('cached_attendance');
    if (rawAtt) {
      const parsed = JSON.parse(rawAtt);
      if (Array.isArray(parsed)) {
        const cleaned = sanitizeAttendance(parsed);
        localStorage.setItem('cached_attendance', JSON.stringify(cleaned));
      }
    }

    // 3. Deductions
    const rawDeduct = localStorage.getItem('payroll_one_time_deductions');
    if (rawDeduct) {
      const parsed = JSON.parse(rawDeduct);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter((d: any) => !['REF001', 'REF002', 'REF003'].includes(d.id));
        localStorage.setItem('payroll_one_time_deductions', JSON.stringify(cleaned));
      }
    }

    // 4. Performance reviews
    const rawReviews = localStorage.getItem('payroll_performance_reviews');
    if (rawReviews) {
      const parsed = JSON.parse(rawReviews);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter((r: any) => !['REV-001', 'REV-002'].includes(r.id));
        localStorage.setItem('payroll_performance_reviews', JSON.stringify(cleaned));
      }
    }

    // 5. Assets
    const rawAssets = localStorage.getItem('payroll_company_assets');
    if (rawAssets) {
      const parsed = JSON.parse(rawAssets);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter((a: any) => 
          !['AST-001', 'AST-002', 'AST-003', 'AST-004', 'AST-005'].includes(a.id) &&
          !['AST-LAP-001', 'AST-MOB-002', 'AST-VEH-001', 'AST-TAB-001', 'AST-PER-001', 'AST-LAP-01', 'AST-MOB-02', 'AST-VEH-01'].includes(a.assetTag)
        );
        localStorage.setItem('payroll_company_assets', JSON.stringify(cleaned));
      }
    }

    // 6. Transfers
    const rawTrans = localStorage.getItem('payroll_transfers_promotions');
    if (rawTrans) {
      const parsed = JSON.parse(rawTrans);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter((t: any) => t.id !== 'TPR-001');
        localStorage.setItem('payroll_transfers_promotions', JSON.stringify(cleaned));
      }
    }

    // 7. Exit records
    const rawExits = localStorage.getItem('payroll_exit_records');
    if (rawExits) {
      const parsed = JSON.parse(rawExits);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter((e: any) => e.id !== 'EXT-001');
        localStorage.setItem('payroll_exit_records', JSON.stringify(cleaned));
      }
    }

    // 8. Jobs
    const rawJobs = localStorage.getItem('payroll_jobs');
    if (rawJobs) {
      const parsed = JSON.parse(rawJobs);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter((j: any) => !['JOB-001', 'JOB-002', 'JOB-003', 'JOB-004'].includes(j.id));
        localStorage.setItem('payroll_jobs', JSON.stringify(cleaned));
      }
    }

    // 9. Candidates
    const rawCans = localStorage.getItem('payroll_candidates');
    if (rawCans) {
      const parsed = JSON.parse(rawCans);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter((c: any) => !['CAN-001', 'CAN-002', 'CAN-003', 'CAN-004', 'CAN-005'].includes(c.id));
        localStorage.setItem('payroll_candidates', JSON.stringify(cleaned));
      }
    }

    // 10. Onboarding tasks
    const rawTasks = localStorage.getItem('payroll_onboarding_tasks');
    if (rawTasks) {
      const parsed = JSON.parse(rawTasks);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter((t: any) => !['ONT-001', 'ONT-002', 'ONT-003'].includes(t.id));
        localStorage.setItem('payroll_onboarding_tasks', JSON.stringify(cleaned));
      }
    }

    // 11. Offers
    const rawOffers = localStorage.getItem('payroll_offers');
    if (rawOffers) {
      const parsed = JSON.parse(rawOffers);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter((o: any) => o.id !== 'OFF-001');
        localStorage.setItem('payroll_offers', JSON.stringify(cleaned));
      }
    }

    // 12. Announcements
    const rawAnn = localStorage.getItem('payroll_announcements');
    if (rawAnn) {
      const parsed = JSON.parse(rawAnn);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter((a: any) => !['ann-1', 'ann-2', 'ann-3'].includes(a.id));
        localStorage.setItem('payroll_announcements', JSON.stringify(cleaned));
      }
    }

    // 13. HR Tickets
    const rawTkts = localStorage.getItem('payroll_hr_tickets');
    if (rawTkts) {
      const parsed = JSON.parse(rawTkts);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter((t: any) => !['TKT-8274', 'TKT-3921'].includes(t.id));
        localStorage.setItem('payroll_hr_tickets', JSON.stringify(cleaned));
      }
    }

    // 14. Leave Requests
    const rawLeaves = localStorage.getItem('payroll_leave_requests');
    if (rawLeaves) {
      const parsed = JSON.parse(rawLeaves);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter((l: any) => !['LRQ-1001', 'LRQ-1002'].includes(l.id));
        localStorage.setItem('payroll_leave_requests', JSON.stringify(cleaned));
      }
    }

    // 15. Password Requests
    const rawPw = localStorage.getItem('payroll_password_requests');
    if (rawPw) {
      const parsed = JSON.parse(rawPw);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter((p: any) => p.id !== 'REQ-4819');
        localStorage.setItem('payroll_password_requests', JSON.stringify(cleaned));
      }
    }
  } catch (err) {
    console.error('Error scrubbing mock data from storage', err);
  }
}
