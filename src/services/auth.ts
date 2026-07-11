import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Request Workspace scopes
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/spreadsheets');

let isSigningIn = false;
let cachedAccessToken: string | null = typeof window !== 'undefined' ? localStorage.getItem('google_access_token') : null;

// Helper to check if the stored token has expired
const isTokenExpired = (): boolean => {
  if (typeof window === 'undefined') return true;
  const expiresAt = localStorage.getItem('google_access_token_expires_at');
  if (!expiresAt) return true;
  // If current time is past expiration, it is expired
  return Date.now() >= Number(expiresAt);
};

// Initialize auth listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: (user: User | null) => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (typeof window !== 'undefined') {
        if (isTokenExpired()) {
          // Token is expired. Don't auto-success, clear it.
          cachedAccessToken = null;
          localStorage.removeItem('google_access_token');
          localStorage.removeItem('google_access_token_expires_at');
          if (onAuthFailure) onAuthFailure(user);
          return;
        }
        cachedAccessToken = localStorage.getItem('google_access_token');
      }
      
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        if (onAuthFailure) onAuthFailure(user);
      }
    } else {
      // NOTE: Do NOT clear the google_access_token from localStorage here, 
      // as onAuthStateChanged can fire null briefly on page reload before restoring the session.
      // This is the key fix that prevents users from being forced to authorize repeatedly.
      if (onAuthFailure) onAuthFailure(null);
    }
  });
};

// Sign in with popup
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Google Auth');
    }

    cachedAccessToken = credential.accessToken;
    if (typeof window !== 'undefined') {
      localStorage.setItem('google_access_token', cachedAccessToken);
      // Set expiration to 55 minutes from now (Google tokens last 1 hour)
      localStorage.setItem('google_access_token_expires_at', String(Date.now() + 55 * 60 * 1000));
    }
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  if (isTokenExpired()) {
    cachedAccessToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('google_access_token');
      localStorage.removeItem('google_access_token_expires_at');
    }
    return null;
  }
  if (!cachedAccessToken && typeof window !== 'undefined') {
    cachedAccessToken = localStorage.getItem('google_access_token');
  }
  return cachedAccessToken;
};

export const setAccessToken = (token: string) => {
  cachedAccessToken = token;
  if (typeof window !== 'undefined') {
    localStorage.setItem('google_access_token', token);
    localStorage.setItem('google_access_token_expires_at', String(Date.now() + 55 * 60 * 1000));
  }
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('google_access_token_expires_at');
  }
};
