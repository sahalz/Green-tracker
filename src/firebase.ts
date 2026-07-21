import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Default public demonstration configuration.
// Replace these with your own Firebase project credentials from the Firebase Console.
const firebaseConfig = {
  apiKey: "AIzaSyC3ykpHlETY-LFByb4LHsG4e4qrPbiobcE",
  authDomain: "greentracker-da9f3.firebaseapp.com",
  projectId: "greentracker-da9f3",
  storageBucket: "greentracker-da9f3.firebasestorage.app",
  messagingSenderId: "233484384323",
  appId: "1:233484384323:web:41b0de467460fdd9853cf6",
  measurementId: "G-JLFJJE4KXZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore
export const db = getFirestore(app);
