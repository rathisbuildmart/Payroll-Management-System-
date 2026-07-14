import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './auth';
import { Employee, Attendance, PayrollRecord, AdminSettings, FailedLoginAttempt } from '../types';

const COLLECTION_NAME = 'payroll_system_data';
const DOCUMENT_ID = 'shared_db';

export interface SharedData {
  employees: Employee[];
  attendance: Attendance[];
  payroll: PayrollRecord[];
  adminSettings?: AdminSettings;
  failedLogins?: FailedLoginAttempt[];
  spreadsheetId?: string | null;
  spreadsheetLink?: string | null;
  lastUpdated?: string;
}

/**
 * Saves all application data to Firestore
 */
export async function saveToFirestore(data: SharedData): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, DOCUMENT_ID);
    // Deeply serialize and deserialize to strip undefined values which crash Firestore setDoc
    const sanitizedData = JSON.parse(JSON.stringify(data));
    
    await setDoc(docRef, {
      ...sanitizedData,
      lastUpdated: new Date().toISOString()
    });
    console.log('Successfully synced data to Firestore');
  } catch (error: any) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      console.log('Firestore sync skipped: System is working offline. Local changes saved in browser.');
    } else {
      console.error('Firestore sync failed:', error?.message || error);
    }
  }
}

/**
 * Loads all application data from Firestore
 */
export async function loadFromFirestore(): Promise<{ data: SharedData | null; success: boolean }> {
  try {
    const docRef = doc(db, COLLECTION_NAME, DOCUMENT_ID);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { data: docSnap.data() as SharedData, success: true };
    }
    return { data: null, success: true };
  } catch (error: any) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      console.log('Firestore loading skipped: System is working offline. Loading local cache.');
    } else {
      console.log('Firestore loading skipped (offline or sandbox):', error?.message || error);
    }
    return { data: null, success: false };
  }
}
