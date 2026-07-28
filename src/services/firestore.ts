import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './auth';
import { Employee, Attendance, PayrollRecord, AdminSettings, FailedLoginAttempt, TransactionalEmailLog } from '../types';

const COLLECTION_NAME = 'payroll_system_data';
const DOCUMENT_ID = 'shared_db';

export interface SharedData {
  employees: Employee[];
  attendance: Attendance[];
  payroll: PayrollRecord[];
  adminSettings?: AdminSettings;
  failedLogins?: FailedLoginAttempt[];
  emailLogs?: TransactionalEmailLog[];
  spreadsheetId?: string | null;
  spreadsheetLink?: string | null;
  lastUpdated?: string;
}

// Timeout helper to prevent Firestore network stalls or unhandled rejections
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number = 10000): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Firestore network operation timed out'));
    }, timeoutMs);

    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
};

/**
 * Saves all application data to Firestore
 */
export async function saveToFirestore(data: SharedData): Promise<{ success: boolean; error?: string }> {
  try {
    const docRef = doc(db, COLLECTION_NAME, DOCUMENT_ID);
    // Deeply serialize and deserialize to strip undefined values which crash Firestore setDoc
    const sanitizedData = JSON.parse(JSON.stringify(data));
    
    await withTimeout(
      setDoc(docRef, {
        ...sanitizedData,
        lastUpdated: new Date().toISOString()
      }),
      10000
    );
    console.log('Successfully synced data to Firestore');
    return { success: true };
  } catch (error: any) {
    const errMsg = error?.message || String(error);
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      console.log('Firestore sync skipped: System is working offline. Local changes saved in browser.');
    } else {
      console.warn('Firestore sync skipped (offline or unavailable):', errMsg);
    }
    return { success: false, error: errMsg };
  }
}

/**
 * Loads all application data from Firestore
 */
export async function loadFromFirestore(): Promise<{ data: SharedData | null; success: boolean; error?: string }> {
  try {
    const docRef = doc(db, COLLECTION_NAME, DOCUMENT_ID);
    const docSnap = await withTimeout(getDoc(docRef), 10000);
    if (docSnap.exists()) {
      return { data: docSnap.data() as SharedData, success: true };
    }
    return { data: null, success: true };
  } catch (error: any) {
    const errMsg = error?.message || String(error);
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      console.log('Firestore loading skipped: System is working offline. Loading local cache.');
    } else {
      console.warn('Firestore loading skipped (offline or unavailable):', errMsg);
    }
    return { data: null, success: false, error: errMsg };
  }
}
