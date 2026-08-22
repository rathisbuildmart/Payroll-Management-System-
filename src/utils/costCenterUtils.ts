/**
 * Utility functions to manage Cost Center prefixes and Employee ID series generation.
 */
export function getCostCenterPrefix(
  costCenterName?: string,
  customCodes?: Record<string, string>
): string {
  if (!costCenterName || !costCenterName.trim()) {
    return 'EMP';
  }

  const trimmed = costCenterName.trim();

  //1. Check custom overrides first if present
  if (customCodes && customCodes[trimmed] && customCodes[trimmed].trim()) {
    return customCodes[trimmed].trim().toUpperCase();
  }

  //2. Clean and split words by spaces, dashes, or slashes
  const words = trimmed.split(/[\s\-_/]+/).filter(Boolean);

  if (words.length === 0) {
    return 'EMP';
  }

  //Single word case: e.g. "Raipur" -> "RAI"
  if (words.length === 1) {
    const letters = words[0].replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (letters.length <= 3) return letters || 'EMP';
    return letters.slice(0, 3) || 'EMP';
  }

  //Multi-word case:
  //e.g. "Raipur Store" -> "RS" //"Raipur Store Cash" -> "RSC" //"Raipur Warehouse" -> "RW" //"Raipur Warehouse Cash" -> "RWC" //"Bilaspur Store Cash" -> "BSC" //"Jagdalpur Store" -> "JS" //"Jagdalpur Store Cash" -> "JSC"
  let prefix = '';
  for (const word of words) {
    const letters = word.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (letters) {
      //If word is short all-caps like "HR" or "IT", preserve it
      if (word === word.toUpperCase() && letters.length <= 2) {
        prefix += letters;
      } else {
        prefix += letters[0];
      }
    }
  }

  return prefix.toUpperCase() || 'EMP';
}

export interface AvailableEmployeeIdOption {
  id: string;
  type: 'next_sequential' | 'left_employee' | 'sequence_gap';
  label: string;
  details?: string;
  previousEmployeeName?: string;
  previousDesignation?: string;
  previousDepartment?: string;
  leavingDate?: string;
  numericValue: number;
}

/**
 * Finds all available Employee ID options for a given Cost Center / Prefix:
 * 1. IDs from Left / Inactive employees (prevents ID gap and allows reuse)
 * 2. Missing numeric sequence gaps (e.g. if RS003 and RS007 are missing)
 * 3. Fresh next sequential ID (e.g. RS101)
 */
export function getAvailableEmployeeIdsWithGaps(
  costCenterName: string,
  existingEmployees: Array<{ id: string; name?: string; isActive?: boolean; designation?: string; department?: string; leavingDate?: string }>,
  customCodes?: Record<string, string>
): {
  prefix: string;
  nextSequentialId: string;
  options: AvailableEmployeeIdOption[];
  leftEmployeeIds: AvailableEmployeeIdOption[];
  gapIds: AvailableEmployeeIdOption[];
  totalAvailableGaps: number;
} {
  const prefix = getCostCenterPrefix(costCenterName, customCodes);
  const regex = new RegExp(`^${prefix}(\\d+)$`, 'i');

  const activeEmpMap = new Map<number, typeof existingEmployees[0]>();
  const inactiveEmpMap = new Map<number, typeof existingEmployees[0]>();
  const allUsedNums = new Set<number>();
  let maxNum = 0;

  for (const emp of existingEmployees) {
    if (!emp.id) continue;
    const match = emp.id.trim().match(regex);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num)) {
        allUsedNums.add(num);
        if (num > maxNum) maxNum = num;

        if (emp.isActive === false) {
          inactiveEmpMap.set(num, emp);
        } else {
          activeEmpMap.set(num, emp);
        }
      }
    }
  }

  // 1. Next Sequential ID
  const nextNum = maxNum + 1;
  const nextSequentialId = `${prefix}${String(nextNum).padStart(3, '0')}`;

  const leftEmployeeIds: AvailableEmployeeIdOption[] = [];
  const gapIds: AvailableEmployeeIdOption[] = [];

  // 2. Identify Inactive / Left Employees
  inactiveEmpMap.forEach((emp, num) => {
    const formattedId = `${prefix}${String(num).padStart(3, '0')}`;
    const descParts = [
      emp.name ? `Ex-Employee: ${emp.name}` : 'Inactive Record',
      emp.designation || emp.department || '',
      emp.leavingDate ? `Left: ${emp.leavingDate}` : 'Status: Inactive'
    ].filter(Boolean);

    leftEmployeeIds.push({
      id: formattedId,
      type: 'left_employee',
      label: `${formattedId} (Left: ${emp.name || 'Ex-Employee'})`,
      details: descParts.join(' • '),
      previousEmployeeName: emp.name,
      previousDesignation: emp.designation,
      previousDepartment: emp.department,
      leavingDate: emp.leavingDate,
      numericValue: num
    });
  });

  // Sort left employees by ID number
  leftEmployeeIds.sort((a, b) => a.numericValue - b.numericValue);

  // 3. Identify Missing Numeric Sequence Gaps (numbers between 1 and maxNum that have no record at all)
  for (let n = 1; n < maxNum; n++) {
    if (!allUsedNums.has(n)) {
      const formattedId = `${prefix}${String(n).padStart(3, '0')}`;
      gapIds.push({
        id: formattedId,
        type: 'sequence_gap',
        label: `${formattedId} (Vacant Sequence Gap #${n})`,
        details: `Missing sequence number ${n} — assigning fills series gap`,
        numericValue: n
      });
    }
  }

  const allOptions: AvailableEmployeeIdOption[] = [
    {
      id: nextSequentialId,
      type: 'next_sequential',
      label: `${nextSequentialId} (Fresh Next Sequential ID)`,
      details: `Next in series (${prefix}${String(maxNum).padStart(3, '0')} ➔ ${nextSequentialId})`,
      numericValue: nextNum
    },
    ...leftEmployeeIds,
    ...gapIds
  ];

  return {
    prefix,
    nextSequentialId,
    options: allOptions,
    leftEmployeeIds,
    gapIds,
    totalAvailableGaps: leftEmployeeIds.length + gapIds.length
  };
}

/**
 * Generates the next sequential Employee ID for a given Cost Center.
 * E.g., for "Raipur Store" -> "RS001", "RS002", "RS003"...
 */
export function generateNextEmployeeId(
  costCenterName: string,
  existingEmployees: Array<{ id: string }>,
  customCodes?: Record<string, string>
): string {
  const prefix = getCostCenterPrefix(costCenterName, customCodes);
  const regex = new RegExp(`^${prefix}(\\d+)$`, 'i');

  let maxNum = 0;

  for (const emp of existingEmployees) {
    if (!emp.id) continue;
    const match = emp.id.trim().match(regex);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }

  let nextNum = maxNum + 1;
  let nextId = `${prefix}${String(nextNum).padStart(3, '0')}`;

  // Ensure uniqueness
  while (existingEmployees.some((e) => e.id.toUpperCase() === nextId.toUpperCase())) {
    nextNum += 1;
    nextId = `${prefix}${String(nextNum).padStart(3, '0')}`;
  }

  return nextId;
}


