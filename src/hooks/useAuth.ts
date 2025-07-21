import { useState, useEffect } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendEmailVerification } from 'firebase/auth';
import { auth } from '../lib/firebase';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Send email verification immediately after registration
    await sendEmailVerification(userCredential.user);
    return userCredential;
  };

  const sendVerificationEmail = async () => {
    if (user) {
      return sendEmailVerification(user);
    }
    throw new Error('No user logged in');
  };

  const logout = async () => {
    return signOut(auth);
  };

  return { user, loading, signIn, signUp, logout, sendVerificationEmail };
};