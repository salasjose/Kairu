"use client";

import {
  Auth,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";

export async function signUp(auth: Auth, email: string, pass: string) {
  return createUserWithEmailAndPassword(auth, email, pass);
}

export async function login(auth: Auth, email: string, pass: string) {
  return signInWithEmailAndPassword(auth, email, pass);
}

export async function resetPassword(auth: Auth, email: string) {
  return sendPasswordResetEmail(auth, email);
}
