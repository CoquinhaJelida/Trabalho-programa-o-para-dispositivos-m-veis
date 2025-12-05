import { initializeApp } from 'firebase/app';
// Importações novas para persistência de login
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// SUAS CHAVES (Mantenha as suas chaves originais aqui!)
const firebaseConfig = {
  apiKey: "AIzaSyAN2OfRfdrYIbNfegQNWZ3er3RINLTz_7M",
  authDomain: "aplicativo-dieta.firebaseapp.com",
  projectId: "aplicativo-dieta",
  storageBucket: "aplicativo-dieta.firebasestorage.app",
  messagingSenderId: "688856795950",
  appId: "1:688856795950:web:9ba4f14d22601b2cb508bf"
};

// Inicializa o App
const app = initializeApp(firebaseConfig);

// --- AQUI ESTÁ O SEGREDO DO LOGIN AUTOMÁTICO ---
// Inicializa a autenticação dizendo: "Use o AsyncStorage para lembrar de mim"
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch (e) {
  // Fallback caso já tenha sido inicializado (evita erros de hot reload)
  auth = getAuth(app);
}

const db = getFirestore(app);

export { auth, db };