import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubUserDoc;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Fetch or create user profile in Firestore
        const userRef = doc(db, "users", firebaseUser.uid);
        try {
          const snapshot = await getDoc(userRef);
          if (!snapshot.exists()) {
            // Create Bettor Profile
            const newProfile = {
              email: firebaseUser.email || "",
              role: "bettor",
              balance: 1000,
            };
            await setDoc(userRef, newProfile);
          }

          unsubUserDoc = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
              setProfile({ uid: firebaseUser.uid, ...docSnap.data() });
            }
          });
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      } else {
        setProfile(null);
        if (unsubUserDoc) unsubUserDoc();
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (unsubUserDoc) unsubUserDoc();
    };
  }, []);

  const login = async (email, pass) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signup = async (email, pass) => {
    await createUserWithEmailAndPassword(auth, email, pass);
  };

  const logOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const updateBalance = async (newBalance) => {
    if (!user || !profile) return;
    try {
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, { balance: newBalance }, { merge: true });
      setProfile((prev) => (prev ? { ...prev, balance: newBalance } : null));
    } catch (error) {
      console.error("Error updating balance", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, login, signup, logOut, updateBalance }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
