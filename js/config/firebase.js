import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, update } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { getAuth, signInWithEmailAndPassword, signOut, updatePassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyBJx6S96j90hMYNXerxNx7vXQ8WcuCj3dg",
    authDomain: "charitysystem-5c4d9.firebaseapp.com",
    databaseURL: "https://charitysystem-5c4d9-default-rtdb.firebaseio.com",
    projectId: "charitysystem-5c4d9",
    storageBucket: "charitysystem-5c4d9.firebasestorage.app",
    messagingSenderId: "476037513041",
    appId: "1:476037513041:web:c74b9cd103fb4ee8911d70",
    measurementId: "G-DLQTK078R9"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

export { db, auth, ref, push, onValue, remove, update, signInWithEmailAndPassword, signOut, updatePassword, onAuthStateChanged };
