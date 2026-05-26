# QuizKit

Outil de **sondage en direct** pour vos cours — esthétique fun type **Kahoot**, pensé pour un prof et ses apprenants.

- **Prof** : crée des sondages, lance une session avec un **code PIN**, affiche les réponses en temps réel, répartit les apprenants en **groupes**.
- **Apprenant** : entre le PIN + son prénom, répond depuis son téléphone ou ordinateur.

## Démo locale

```bash
npm install
cp .env.local.example .env.local   # puis remplir les clés Firebase
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

| Parcours | URL |
|----------|-----|
| Accueil | `/` |
| Espace prof | `/prof/login` |
| Rejoindre un sondage | `/jouer` |

## Stack

- [Next.js 16](https://nextjs.org) (App Router, export statique)
- React 19 + Tailwind CSS 4
- [Firebase](https://firebase.google.com) : Authentication (Google), Firestore, Hosting

**Projet Firebase :** `quizkit-7116e`  
**Dépôt :** https://github.com/jpbolle/quizKit

## Types de questions

| Type | Description |
|------|-------------|
| QCM | 2 à 4 choix, couleurs + formes Kahoot |
| Vrai / Faux | Deux boutons verts / rouges |
| Nuage de mots | Mots-clés agrégés en direct |
| Évaluation 1 → 5 | Plusieurs critères (1 = absent, 5 = présent) |

## Configuration Firebase

1. Créer / ouvrir le projet [quizkit-7116e](https://console.firebase.google.com/u/0/project/quizkit-7116e/overview).
2. **Authentication** → activer **Google** (email d’assistance : `jeanphilippe@pedagokit.be`).
3. **Firestore** → créer une base (région Europe recommandée).
4. **Paramètres projet** → application Web → copier la config dans `.env.local`.
5. **Authentication → Domaines autorisés** : `localhost`, `quizkit-7116e.web.app`, `quizkit-7116e.firebaseapp.com`.

Comptes prof autorisés :

- `jeanphilippe@pedagokit.be`
- `jeanphilippe.bolle@cnddinant.be`

## Déploiement

```bash
firebase login --reauth
npm run deploy:rules      # règles Firestore
npm run deploy:hosting    # build + Firebase Hosting
```

Le site statique est généré dans le dossier `out/`.

## Documentation pour les agents IA

| Fichier | Rôle |
|---------|------|
| [`docs/BIBLE.md`](docs/BIBLE.md) | Référence globale (architecture, données, conventions) |
| [`docs/SESSION.md`](docs/SESSION.md) | Journal et objectifs de la session en cours |
| [`CLAUDE.md`](CLAUDE.md) | Point d’entrée Claude Code |
| [`AGENTS.md`](AGENTS.md) | Règles Next.js spécifiques au projet |

## Scripts

| Commande | Action |
|----------|--------|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build production (`out/`) |
| `npm run typecheck` | Vérification TypeScript |
| `npm run deploy:rules` | Déployer `firestore.rules` |
| `npm run deploy:hosting` | Build + Hosting |

## Licence

Usage privé — Jean-Philippe Bolle / Pedagokit.
