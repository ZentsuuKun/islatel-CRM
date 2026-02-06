// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// REPLACE THIS WITH YOUR FIREBASE CONFIGURATION OBJECT FROM THE FIREBASE CONSOLE
const firebaseConfig = {
    apiKey: "AIzaSyAQfliZ7-_IIZzBR8_lMdT_Z2iIQM1Imgo",
    authDomain: "isla-65ae2.firebaseapp.com",
    projectId: "isla-65ae2",
    storageBucket: "isla-65ae2.firebasestorage.app",
    messagingSenderId: "193326948774",
    appId: "1:193326948774:web:07d8b5b74d3dfd0c372f67",
    measurementId: "G-RNSRME6W7P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
