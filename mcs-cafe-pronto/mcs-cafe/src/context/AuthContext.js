import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { createProfile, subscribeProfile } from '../services/db';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => onAuthStateChanged(auth, (u) => {
    setUser(u);
    if (!u) { setProfile(null); setLoading(false); }
  }), []);

  useEffect(() => {
    if (!user) return;
    return subscribeProfile(user.uid, (p) => { setProfile(p); setLoading(false); });
  }, [user]);

  const value = {
    user, profile, loading,
    login: (email, pass) => signInWithEmailAndPassword(auth, email.trim(), pass),
    register: async ({ email, pass, name }) => {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      await createProfile(cred.user.uid, { name: name.trim(), email: email.trim() });
    },
    resetPassword: (email) => sendPasswordResetEmail(auth, email.trim()),
    logout: () => signOut(auth),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
