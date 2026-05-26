import Link from "next/link";
import { KahootLogo } from "@/components/KahootLogo";

export default function HomePage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center gap-16 px-6 py-12">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="animate-[float_3s_ease-in-out_infinite]">
          <KahootLogo size="lg" />
        </div>
        <p className="text-white/85 text-lg md:text-xl max-w-2xl font-medium">
          Des sondages <span className="text-kahoot-yellow font-extrabold">fun</span> et en direct
          pour vos apprenants. Lancez une question, voyez les réponses arriver,
          répartissez en groupes en un clic.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 w-full max-w-3xl">
        <Link
          href="/jouer"
          className="kahoot-card kahoot-shadow-red bg-kahoot-red/90 hover:scale-[1.02] transition-transform p-8 flex flex-col items-center gap-3 text-center"
        >
          <div className="text-6xl">🙋</div>
          <h2 className="text-3xl font-black uppercase">Je suis apprenant</h2>
          <p className="text-white/90">Entrez un code PIN pour rejoindre un sondage.</p>
        </Link>

        <Link
          href="/prof"
          className="kahoot-card kahoot-shadow-blue bg-kahoot-blue/90 hover:scale-[1.02] transition-transform p-8 flex flex-col items-center gap-3 text-center"
        >
          <div className="text-6xl">🎓</div>
          <h2 className="text-3xl font-black uppercase">Je suis prof</h2>
          <p className="text-white/90">Créez et lancez des sondages pour vos cours.</p>
        </Link>
      </div>

      <footer className="text-white/50 text-sm">
        Fait avec ❤️ pour les apprenants de Jean-Philippe.
      </footer>
    </main>
  );
}
