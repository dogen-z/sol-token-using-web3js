import React from 'react'
import ReactDOM from "react-dom";

import App from "./App";

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBwvPZvqbzx8KxF-0NiPXevPOO6zubRSx0",
  authDomain: "sol-token-generator.firebaseapp.com",
  projectId: "sol-token-generator",
  storageBucket: "sol-token-generator.appspot.com",
  messagingSenderId: "356888714172",
  appId: "1:356888714172:web:30f4eea796e397d9de69b9",
  measurementId: "G-H68EYDJKJK"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const analytics = getAnalytics(firebaseApp);
 
 
ReactDOM.render(<App />,document.getElementById('root'));