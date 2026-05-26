import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // App Hosting : Next.js en mode serveur (SSR) sur Cloud Run.
  // Pas de output:"export" → on bénéficie du rendu serveur natif.
  trailingSlash: true,
  // Silence le warning « multiple lockfiles »
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
