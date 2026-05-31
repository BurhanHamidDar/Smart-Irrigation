import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

export const firebaseConfig = {
 apiKey: "AIzaSyCX7fV4-Gt-4vFZAtSm6jwn6TWpbc3bBu4",
  authDomain: "smart-irrigation-e2db4.firebaseapp.com",
  databaseURL: "https://smart-irrigation-e2db4-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "smart-irrigation-e2db4",
  storageBucket: "smart-irrigation-e2db4.appspot.com",
  messagingSenderId: "642123031610",
  appId: "1:642123031610:web:05d5142d48822e6bc64103"
};

// Initialize Firebase app, guard against duplicate initializations
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const database = getDatabase(app);
