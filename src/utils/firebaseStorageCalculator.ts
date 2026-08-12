/**
 * Helper utility to calculate exact byte, KB, and MB size of Firebase Cloud StorageFirestore data.
 */
export interface StorageCategoryBreakdown {
  category: string;
  categoryHi: string;
  bytes: number;
  kb: number;
  mb: number;
  count: number;
  percentageOfTotal: number;
  iconName: string;
}

export interface FirebaseStorageMetrics {
  totalBytes: number;
  totalKb: number;
  totalMb: number;
  totalDocEstimate: number;
  quotaPercentOf1GB: number;
  formattedSize: string;
  formattedSizeKb: string;
  formattedSizeMb: string;
  lastCalculatedAt: string;
  categories: StorageCategoryBreakdown[];
}

/**
 * Calculates UTF-8 byte length of a string safely in browser or node
 */
export function getUtf8ByteLength(str: string): number {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(str).length;
  }
  return encodeURIComponent(str).replace(/%[89AB][0-9AM]/gi, '2').length;
}

/**
 * Formats a byte count into clean human-readable text (Bytes, KB, or MB)
 */
export function formatStorageUnits(bytes: number, decimals: number = 2): string {
  if (bytes <= 0) return '0 KB';
  if (bytes < 1024) return `${bytes} Bytes`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(decimals)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(decimals)} MB`;
}

/**
 * Calculates comprehensive Firestore storage usage across all app collections
 */
export function calculateFirebaseStorageUsage(data: {
  employees?: any[];
  attendance?: any[];
  payroll?: any[];
  adminSettings?: any;
  failedLogins?: any[];
  emailLogs?: any[];
  announcements?: any[];
  hrTickets?: any[];
  passwordRequests?: any[];
  auditLogs?: any[];
}): FirebaseStorageMetrics {
  const FIRESTORE_DOC_OVERHEAD_BYTES = 32; //Standard Firestore metadata overhead per document

  const getCollectionMetrics = (
    key: string,
    keyHi: string,
    items: any[] | any,
    iconName: string
  ): { bytes: number; count: number; category: string; categoryHi: string; iconName: string } => {
    if (!items) {
      return { bytes: 0, count: 0, category: key, categoryHi: keyHi, iconName };
    }

    if (Array.isArray(items)) {
      const count = items.length;
      if (count === 0) {
        return { bytes: 0, count: 0, category: key, categoryHi: keyHi, iconName };
      }
      const jsonStr = JSON.stringify(items);
      const rawBytes = getUtf8ByteLength(jsonStr);
      const totalBytes = rawBytes + count * FIRESTORE_DOC_OVERHEAD_BYTES;
      return { bytes: totalBytes, count, category: key, categoryHi: keyHi, iconName };
    } else {
      const jsonStr = JSON.stringify(items);
      const rawBytes = getUtf8ByteLength(jsonStr);
      const totalBytes = rawBytes + FIRESTORE_DOC_OVERHEAD_BYTES;
      return { bytes: totalBytes, count: 1, category: key, categoryHi: keyHi, iconName };
    }
  };

  const rawCategories = [
    getCollectionMetrics('Employees Directory', 'Employees Directory', data.employees, 'Users'),
    getCollectionMetrics('Attendance Archives', 'Attendance Archives', data.attendance, 'Calendar'),
    getCollectionMetrics('Payroll Slips', 'Payroll Slips', data.payroll, 'CreditCard'),
    getCollectionMetrics('Transactional Email Logs', 'Transactional Email Logs', data.emailLogs, 'Mail'),
    getCollectionMetrics('Notices & Circulars', 'Notices & Circulars', data.announcements, 'Megaphone'),
    getCollectionMetrics('System Settings & Config', 'System Settings & Config', data.adminSettings, 'Settings'),
    getCollectionMetrics('Security & Failed Logins', 'Security & Failed Logins', data.failedLogins, 'ShieldAlert'),
    getCollectionMetrics('HR Tickets & Requests', 'HR Tickets & Requests', data.hrTickets, 'LifeBuoy'),
    getCollectionMetrics('Audit Activity Trail', 'Audit Activity Trail', data.auditLogs, 'Activity'),
  ];

  const totalBytes = rawCategories.reduce((acc, c) => acc + c.bytes, 0);
  const totalDocEstimate = rawCategories.reduce((acc, c) => acc + c.count, 0);

  const totalKb = totalBytes / 1024;
  const totalMb = totalKb / 1024;

  //Free Spark Tier Firestore Limit = 1 GB (1,024 MB = 1,073,741,824 bytes)
  const FREE_TIER_BYTES = 1024 * 1024 * 1024;
  const quotaPercentOf1GB = Math.min(100, Number(((totalBytes / FREE_TIER_BYTES) * 100).toFixed(4)));

  const categories: StorageCategoryBreakdown[] = rawCategories.map((c) => {
    const kb = c.bytes / 1024;
    const mb = kb / 1024;
    const percentageOfTotal = totalBytes > 0 ? Number(((c.bytes / totalBytes) * 100).toFixed(1)) : 0;
    return {
      category: c.category,
      categoryHi: c.categoryHi,
      bytes: c.bytes,
      kb,
      mb,
      count: c.count,
      percentageOfTotal,
      iconName: c.iconName,
    };
  });

  return {
    totalBytes,
    totalKb,
    totalMb,
    totalDocEstimate,
    quotaPercentOf1GB,
    formattedSize: formatStorageUnits(totalBytes, 2),
    formattedSizeKb: `${totalKb.toFixed(2)} KB`,
    formattedSizeMb: `${totalMb.toFixed(3)} MB`,
    lastCalculatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    categories,
  };
}
