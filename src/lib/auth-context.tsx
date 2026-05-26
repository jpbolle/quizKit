"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as fbSignOut,
  type User,
} from "firebase/auth";
import {
  ALLOWED_TEACHER_EMAILS,
  getFirebaseAuth,
  googleProvider,
  isFirebaseConfigured,
} from "./firebase";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  configured: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const configured = isFirebaseConfigured();

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(getFirebaseAuth(), (u) => {
      if (u && u.email && !ALLOWED_TEACHER_EMAILS.includes(u.email)) {
        // Email non autorisé : on déconnecte immédiatement
        fbSignOut(getFirebaseAuth());
        setError(
          `L'adresse ${u.email} n'est pas autorisée à accéder à l'espace prof.`
        );
        setUser(null);
      } else {
        setError(null);
        setUser(u);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [configured]);

  async function signInWithGoogle() {
    setError(null);
    try {
      const res = await signInWithPopup(getFirebaseAuth(), googleProvider);
      const email = res.user.email;
      if (!email || !ALLOWED_TEACHER_EMAILS.includes(email)) {
        await fbSignOut(getFirebaseAuth());
        setError(
          `L'adresse ${email ?? "(inconnue)"} n'est pas autorisée à accéder à l'espace prof.`
        );
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Erreur lors de la connexion."
      );
    }
  }

  async function signOut() {
    await fbSignOut(getFirebaseAuth());
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, configured, error, signInWithGoogle, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans <AuthProvider>");
  return ctx;
}
