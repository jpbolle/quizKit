# Claude Code — QuizKit

@AGENTS.md

## Documents projet (à lire selon le besoin)

| Priorité | Fichier | Quand |
|----------|---------|--------|
| 1 | [`docs/BIBLE.md`](docs/BIBLE.md) | Architecture, Firebase, routes, conventions — **référence globale** |
| 2 | [`docs/SESSION.md`](docs/SESSION.md) | Objectifs, blocages et prochaines étapes de la **session en cours** |
| 3 | [`README.md`](README.md) | Installation, déploiement, liens utiles |

## Règles rapides

- Répondre en **français** à l’utilisateur.
- Ne pas committer sans demande explicite.
- Ne pas committer `.env.local` (secrets Firebase).
- Avant du code Next.js : lire `node_modules/next/dist/docs/` si API incertaine.
- Firebase **client-side only** (`"use client"` pour auth/Firestore).
- Minimiser le scope des changements ; réutiliser les composants Kahoot existants.

## Contexte produit (une ligne)

Sondages live pour cours : prof (Google) + apprenants (PIN + prénom), 4 types de questions, résultats et groupes en temps réel, style Kahoot.
