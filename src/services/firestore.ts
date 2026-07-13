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
  lastUpdated?: string;
}

/**
 * Saves all application data to Firestore
 */
export async function saveToFirestore(data: SharedData): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, DOCUMENT_ID);
    await setDoc(docRef, {
      ...data,
      lastUpdated: new Date().toISOString()
    });
    console.log('Successfully synced data to Firestore');
  } catch (error: any) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      console.log('Firestore sync skipped: System is working offline. Local changes saved in browser.');
    } else {
      console.log('Firestore sync skipped (offline or sandbox):', error?.message || error);
    }
  }
}

/**
 * Loads all application data from Firestore
 */
export async function loadFromFirestore(): Promise<SharedData | null> {
  try {
    const docRef = doc(db, COLLECTION_NAME, DOCUMENT_ID);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as SharedData;
    }
    return null;
  } catch (error: any) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      console.log('Firestore loading skipped: System is working offline. Loading local cache.');
    } else {
      console.log('Firestore loading skipped (offline or sandbox):', error?.message || error);
    }
    return null;
  }
}
