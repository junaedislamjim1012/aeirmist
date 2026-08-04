import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';

import {
  initializeFirestore,
  memoryLocalCache,
  getFirestore,
  clearIndexedDbPersistence
} from 'firebase/firestore';

import { getStorage } from 'firebase/storage';

import config from '../../firebase-applet-config.json';

if (!config || !config.projectId) {
  console.error('❌ Firebase config invalid or missing:', config);
  throw new Error(
    'Invalid Firebase configuration. Ensure firebase-applet-config.json exists and contains valid projectId.'
  );
}

console.log('✅ [Firebase] Initializing with project:', config.projectId);
const activeConfig = config;

const app =
  getApps().length > 0
    ? getApp()
    : initializeApp(activeConfig);

export const auth = getAuth(app);

setPersistence(auth, browserLocalPersistence)
  .catch(console.error);

const dbId = (!activeConfig.firestoreDatabaseId || activeConfig.firestoreDatabaseId === '(default)') ? undefined : activeConfig.firestoreDatabaseId;

let firestoreInstance;
try {
  firestoreInstance = initializeFirestore(app, {
    localCache: memoryLocalCache()
  }, dbId);
} catch (e) {
  firestoreInstance = getFirestore(app, dbId);
}

// Clear any stale persistent IndexedDB cache from prior sessions to prevent prefixPath/IndexedDbTransactionError
clearIndexedDbPersistence(firestoreInstance).catch(() => {});

if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const msg = event?.reason?.message || String(event?.reason || '');
    if (
      msg.includes('IndexedDbTransactionError') ||
      msg.includes('prefixPath') ||
      msg.includes('Failed to fetch dynamically imported module') ||
      msg.includes('AbortError')
    ) {
      console.warn('Prevented uncaught background error:', msg);
      event.preventDefault();
    }
  });
}

export const db = firestoreInstance;

export const storage = getStorage(app);

export const isConfigValid = true;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
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
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  const errorJson = JSON.stringify(errInfo);
  console.error('Firestore Error: ', errorJson);
  throw new Error(errorJson);
}

export default app;
