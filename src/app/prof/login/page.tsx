"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { KahootButton } from "@/components/KahootButton";
import { KahootCard } from "@/components/KahootCard";
import { KahootLogo } from "@/components/KahootLogo";
import { useAuth } from "@/lib/auth-context";
import { ALLOWED_TEACHER_EMAILS } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, signingIn, configured, error, signInWithGoogle } = useAuth();

  useEffect(() => {
    if (!loading && user) router.replace("/prof");
  }, [user, loading, router]);

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 gap-8">
      <Link href="/" className="hover:opacity-80">
        <KahootLogo size="md" />
      </Link>

      <KahootCard className="w-full max-w-md flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-3xl font-black uppercase">Espace prof</h1>
          <p className="text-white/80 mt-2">
            Connecte-toi avec ton compte Google autorisé.
          </p>
        </div>

        {!configured ? (
          <div className="bg-kahoot-yellow/20 border-2 border-kahoot-yellow rounded-2xl p-4 text-sm">
            <p className="font-bold text-kahoot-yellow">⚠️ Firebase pas encore configuré</p>
            <p className="text-white/80 mt-1">
              Renseigne les variables <code>NEXT_PUBLIC_FIREBASE_*</code> dans{" "}
              <code>.env.local</code> à la racine du projet, puis relance{" "}
              <code>npm run dev</code>.
            </p>
          </div>
        ) : null}

        {error ? (
          <div className="bg-kahoot-red/20 border-2 border-kahoot-red rounded-2xl p-4 text-sm animate-[shake_0.5s_ease-in-out]">
            <p className="font-bold text-kahoot-red">❌ {error}</p>
          </div>
        ) : null}

        {loading && !signingIn ? (
          <p className="text-center text-white/70 text-sm animate-pulse">
            Vérification de la session…
          </p>
        ) : null}

        <KahootButton
          color="white"
          size="lg"
          disabled={!configured || loading || signingIn}
          onClick={() => signInWithGoogle()}
          className="!font-extrabold"
        >
          <span className="inline-flex items-center gap-3">
            {signingIn ? (
              <>Connexion à Google…</>
            ) : (
              <>
            <svg width="22" height="22" viewBox="0 0 48 48" aria-hidden>
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6 29.2 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 18.9 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6 29.2 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.4 39.6 16.1 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.2 5.2c4.4-4.1 7-10.1 7-16.7 0-1.3-.1-2.7-.4-3.5z"/>
            </svg>
            Se connecter avec Google
              </>
            )}
          </span>
        </KahootButton>

        <div className="text-xs text-white/60 text-center">
          Adresses autorisées :
          <ul className="mt-1 font-bold">
            {ALLOWED_TEACHER_EMAILS.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      </KahootCard>

      <Link href="/" className="text-white/60 hover:text-white">
        ← Retour à l&apos;accueil
      </Link>
    </main>
  );
}
