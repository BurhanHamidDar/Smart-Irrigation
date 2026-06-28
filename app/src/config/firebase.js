import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Full Firebase configuration — all fields required for production APK
const firebaseConfig = {
  apiKey: "AIzaSyCX7fV4-Gt-4vFZAtSm6jwn6TWpbc3bBu4",
  authDomain: "smart-irrigation-e2db4.firebaseapp.com",
  databaseURL: "https://smart-irrigation-e2db4-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "smart-irrigation-e2db4",
  storageBucket: "smart-irrigation-e2db4.appspot.com",
  messagingSenderId: "642123031610",
  appId: "1:642123031610:web:05d5142d48822e6bc64103"
};

// Guard against hot-reload re-initialization (causes crash in dev + APK)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Export the database instance for use in components
export const database = getDatabase(app);

// Export the database URL string directly for REST API calls in Login.js
// (avoids SDK object traversal which can return undefined)
export const DATABASE_URL = firebaseConfig.databaseURL;
