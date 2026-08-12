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

/**
 * Generates the next sequential Employee ID for a given Cost Center.
 * E.g., for "Raipur Store" -> "RS001", "RS002", "RS003"...
 * E.g., for "Raipur Store Cash" -> "RSC001", "RSC002"...
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

  //Ensure uniqueness
  while (existingEmployees.some((e) => e.id.toUpperCase() === nextId.toUpperCase())) {
    nextNum += 1;
    nextId = `${prefix}${String(nextNum).padStart(3, '0')}`;
  }

  return nextId;
}
