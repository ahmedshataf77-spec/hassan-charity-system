import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, push, onValue, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyBJXx6S96j90hMYNXerxNx7vXQ8WcuCj3dg",
    authDomain: "charitysystem-5c4d9.firebaseapp.com",
    projectId: "charitysystem-5c4d9",
    storageBucket: "charitysystem-5c4d9.firebasestorage.app",
    messagingSenderId: "4760375130441",
    appId: "1:476037513041:web:c74b9cd103fb4ee8911d70",
    measurementId: "G-DLQTK078R9"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const storage = getStorage(app);

export { db, storage, ref, push, onValue, remove, storageRef, uploadBytes, getDownloadURL };
