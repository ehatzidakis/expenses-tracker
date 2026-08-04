import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore/lite';
import { environment } from '../environments/environment';

const firebaseConfig = {
  apiKey: environment.apiKey,
  authDomain: 'expenses-tracker-hatz.firebaseapp.com',
  projectId: 'expenses-tracker-hatz',
  storageBucket: 'expenses-tracker-hatz.firebasestorage.app',
  messagingSenderId: '213404650739',
  appId: '1:213404650739:web:ee6fc21e721a5055f0bb86',
};

// Initialize app and export raw Firestore instance
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
