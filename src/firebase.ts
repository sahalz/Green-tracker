import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';
import { 
  initializeAuth, 
  getAuth, 
  // @ts-ignore
  getReactNativePersistence, 
  signInAnonymously, 
  onAuthStateChanged,
  Auth 
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Default public demonstration configuration.
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyC3ykpHlETY-LFByb4LHsG4e4qrPbiobcE',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'greentracker-da9f3.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'greentracker-da9f3',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'greentracker-da9f3.firebasestorage.app',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '233484384323',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:233484384323:web:41b0de467460fdd9853cf6',
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-JLFJJE4KXZ'
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Cloud Firestore with Long Polling for React Native / Android network stability
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

// Initialize Auth with AsyncStorage persistence for React Native
let authInstance: Auth;
if (Platform.OS === 'web') {
  authInstance = getAuth(app);
} else {
  try {
    authInstance = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    authInstance = getAuth(app);
  }
}

export const auth = authInstance;

export const ensureAuthenticated = (): Promise<void> => {
  return new Promise((resolve) => {
    if (auth.currentUser) {
      resolve();
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        unsubscribe();
        resolve();
      } else {
        signInAnonymously(auth)
          .then(() => resolve())
          .catch((err) => {
            console.warn('Firebase Anonymous Auth failed:', err);
            resolve();
          });
      }
    });
  });
};

onAuthStateChanged(auth, (user) => {
  if (!user) {
    signInAnonymously(auth).catch((err) => {
      console.warn('Firebase Anonymous Auth failed:', err);
    });
  }
});



