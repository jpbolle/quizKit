import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export → déployable sur Firebase Hosting sans Cloud Functions
  output: "export",
  images: {
    unoptimized: true,
  },
  // Active des barres obliques finales pour les URLs (utile pour le hosting statique)
  trailingSlash: true,
  // Silence le warning « multiple lockfiles »
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
