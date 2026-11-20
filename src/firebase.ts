import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signInAnonymously,
  OAuthProvider,
  onAuthStateChanged
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { User, StudentUpdate } from './types';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export { onAuthStateChanged };
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
const googleProvider = new GoogleAuthProvider();
const appleProvider = new OAuthProvider('apple.com');

/**
 * Sign in Anonymously - Used for demo mode.
 */
export async function signInAnonymouslyFunc() {
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error) {
    console.error('Anonymous Sign-In Error:', error);
    throw error;
  }
}

/**
 * Syncs a user from the local SQLite/Express backend to Firebase Auth and Firestore.
 * This ensures that Firestore security rules can verify the user's identity and role.
 */
export async function syncUserWithFirebase(user: User) {
  try {
    // 1. Check if we already have an authenticated user (Google, Apple, or Anonymous)
    let fbUser = auth.currentUser;

    if (!fbUser) {
      console.log('No Firebase user found, attempting to sign in anonymously...');
      try {
        const userCredential = await signInAnonymously(auth);
        fbUser = userCredential.user;
        console.log('Anonymous sign-in successful:', fbUser.uid);
      } catch (authError) {
        console.error('Anonymous Sign-In failed during sync:', authError);
        return null;
      }
    }

    if (!fbUser) return null;

    // 2. Ensure Firestore user document exists with correct role and metadata
    const userDocRef = doc(db, 'users', fbUser.uid);
    console.log(`Syncing user ${user.username} (UID: ${fbUser.uid}) with Firestore...`);
    
    let userDoc;
    try {
      userDoc = await getDoc(userDocRef);
    } catch (getDocError) {
      handleFirestoreError(getDocError, OperationType.GET, `users/${fbUser.uid}`);
      // If we can't read it, we might still be able to write it if we are the owner
      // But let's log it and re-throw to be safe
      throw getDocError;
    }

    if (!userDoc.exists()) {
      console.log(`Creating new user document for ${user.username}...`);
      await setDoc(userDocRef, {
        username: user.username,
        role: user.role,
        full_name: user.full_name,
        uid: fbUser.uid,
        is_anonymous: fbUser.isAnonymous || false,
        created_at: serverTimestamp(),
        last_sync: serverTimestamp()
      });
      console.log(`User document created successfully.`);
    } else {
      console.log(`Updating existing user document for ${user.username}...`);
      // Update role if it changed (e.g. demo user switching roles)
      await setDoc(userDocRef, {
        role: user.role,
        full_name: user.full_name,
        last_sync: serverTimestamp()
      }, { merge: true });
      console.log(`User document updated successfully.`);
    }
    
    return fbUser;
  } catch (error: any) {
    console.error('Firebase sync error:', error);
    handleFirestoreError(error, OperationType.WRITE, `users`);
    return null;
  }
}

/**
 * Sign in with Google - This is the preferred method in this environment.
 */
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
}

/**
 * Sign in with Apple.
 */
export async function signInWithApple() {
  try {
    const result = await signInWithPopup(auth, appleProvider);
    return result.user;
  } catch (error) {
    console.error('Apple Sign-In Error:', error);
    throw error;
  }
}

/**
 * Submit teacher input for a student.
 */
export async function submitTeacherInput(data: Omit<StudentUpdate, 'id'>) {
  try {
    const docRef = await addDoc(collection(db, 'student_updates'), data);
    return docRef.id;
  } catch (error) {
    console.error('Error submitting teacher input:', error);
    throw error;
  }
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo, null, 2));
  throw new Error(JSON.stringify(errInfo));
}

export default app;
