"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  browserLocalPersistence,
  getRedirectResult,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signInWithRedirect,
  signOut as fbSignOut,
  type Auth,
  type User,
  type UserCredential,
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
  signingIn: boolean;
  configured: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Évite que React Strict Mode consomme deux fois le retour Google. */
let redirectResultPromise: Promise<UserCredential | null> | null = null;
let persistenceConfigured = false;

function getRedirectResultOnce(auth: Auth) {
  if (!redirectResultPromise) {
    redirectResultPromise = getRedirectResult(auth);
  }
  return redirectResultPromise;
}

async function ensureAuthPersistence(auth: Auth) {
  if (persistenceConfigured) return;
  await setPersistence(auth, browserLocalPersistence);
  persistenceConfigured = true;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const configured = isFirebaseConfigured();

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    let unsub: (() => void) | undefined;
    const auth = getFirebaseAuth();

    void (async () => {
      try {
        await ensureAuthPersistence(auth);

        // IMPORTANT : traiter le retour Google AVANT de considérer l'auth terminée
        const result = await getRedirectResultOnce(auth);
        if (!cancelled && result?.user) {
          const err = await validerEmailProf(result.user);
          if (err) setError(err);
        }
      } catch (e) {
        if (!cancelled) setError(traduireErreurAuth(e));
      }

      if (cancelled) return;

      unsub = onAuthStateChanged(auth, async (u) => {
        if (cancelled) return;
        await appliquerUtilisateur(u, setUser, setError);
        setLoading(false);
      });
    })();

    return () => {
      cancelled = true;
      unsub?.();
    };
  }, [configured]);

  async function signInWithGoogle() {
    setError(null);
    setSigningIn(true);
    const auth = getFirebaseAuth();

    try {
      await ensureAuthPersistence(auth);

      // 1. Essayer la popup (plus fiable en local si autorisée)
      try {
        const res = await signInWithPopup(auth, googleProvider);
        const err = await validerEmailProf(res.user);
        if (err) setError(err);
        return;
      } catch (e) {
        const code = codeErreurAuth(e);
        if (
          code !== "auth/popup-blocked" &&
          code !== "auth/cancelled-popup-request"
        ) {
          throw e;
        }
      }

      // 2. Pop-up bloquée → redirection pleine page
      await signInWithRedirect(auth, googleProvider);
      // La page va changer ; pas besoin de remettre signingIn à false
    } catch (e) {
      setError(traduireErreurAuth(e));
      setSigningIn(false);
    }
  }

  async function signOut() {
    await fbSignOut(getFirebaseAuth());
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signingIn,
        configured,
        error,
        signInWithGoogle,
        signOut,
      }}
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

async function appliquerUtilisateur(
  u: User | null,
  setUser: (u: User | null) => void,
  setError: (e: string | null) => void
) {
  if (u && u.email && !ALLOWED_TEACHER_EMAILS.includes(u.email)) {
    await fbSignOut(getFirebaseAuth());
    setError(
      `L'adresse ${u.email} n'est pas autorisée à accéder à l'espace prof.`
    );
    setUser(null);
    return;
  }
  if (u) setError(null);
  setUser(u);
}

async function validerEmailProf(u: User): Promise<string | null> {
  const email = u.email;
  if (!email || !ALLOWED_TEACHER_EMAILS.includes(email)) {
    await fbSignOut(getFirebaseAuth());
    return `L'adresse ${email ?? "(inconnue)"} n'est pas autorisée à accéder à l'espace prof.`;
  }
  return null;
}

function codeErreurAuth(e: unknown): string | null {
  if (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    typeof (e as { code: unknown }).code === "string"
  ) {
    return (e as { code: string }).code;
  }
  return null;
}

function traduireErreurAuth(e: unknown): string {
  switch (codeErreurAuth(e)) {
    case "auth/unauthorized-domain":
      return "Domaine non autorisé. Vérifie que « localhost » est bien listé dans Firebase → Authentication → Paramètres → Domaines autorisés.";
    case "auth/operation-not-allowed":
      return "Google Sign-In n'est pas activé dans Firebase Authentication.";
    case "auth/network-request-failed":
      return "Problème réseau. Vérifie ta connexion internet.";
    case "auth/popup-closed-by-user":
      return "Connexion annulée.";
    default:
      return e instanceof Error ? e.message : "Erreur lors de la connexion.";
  }
}
