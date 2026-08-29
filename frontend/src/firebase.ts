// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCsvagcE4Quq822oDy0OYSZNmGzd1K9DBk",
  authDomain: "checkpoint-app-cd6fb.firebaseapp.com",
  projectId: "checkpoint-app-cd6fb",
  storageBucket: "checkpoint-app-cd6fb.firebasestorage.app",
  messagingSenderId: "52673405783",
  appId: "1:52673405783:web:302aefc8eee95b69db9412",
  measurementId: "G-MBE20J4S5Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize and export Auth helpers
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();