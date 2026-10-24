// Real-mode source only. The fixture build does NOT copy or import this file.
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, setPersistence, inMemoryPersistence, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup,
  sendPasswordResetEmail, signOut } from 'firebase/auth';

export async function createFirebaseClient(config) {
  const app = initializeApp(config, 'comos-auth');
  const auth = getAuth(app);
  try { await setPersistence(auth, inMemoryPersistence); }
  catch (error) { await deleteApp(app);throw error; }
  return Object.freeze({
    email: (email, password, signup = false) => signup
      ? createUserWithEmailAndPassword(auth, email, password)
      : signInWithEmailAndPassword(auth, email, password),
    google: () => signInWithPopup(auth, new GoogleAuthProvider()),
    reset: email => sendPasswordResetEmail(auth, email),
    signOut: () => signOut(auth),
    close: () => deleteApp(app),
  });
}
