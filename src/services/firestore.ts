import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './auth';
import { Employee, Attendance, PayrollRecord, AdminSettings } from '../types';

const COLLECTION_NAME = 'payroll_system_data';
const DOCUMENT_ID = 'shared_db';

export interface SharedData {
  employees: Employee[];
  attendance: Attendance[];
  payroll: PayrollRecord[];
  adminSettings?: AdminSettings;
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
  } catch (error) {
    console.warn('Firestore sync skipped (offline or not provisioned):', error);
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
  } catch (error) {
    console.warn('Firestore load skipped (using offline cache):', error);
    return null;
  }
}
