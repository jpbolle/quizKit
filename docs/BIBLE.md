# QuizKit — Bible projet (référence globale)

Document de référence pour **Claude Code**, **Cursor** et tout contributeur.  
À lire en début de session ou avant toute modification importante.

---

## 1. Vision produit

**QuizKit** est un outil de **sondage en direct** pour des apprenants en cours, avec une esthétique **fun type Kahoot** (couleurs vives, Montserrat, formes géométriques sur les QCM).

| Rôle | Accès | Parcours |
|------|--------|----------|
| **Prof** | Google OAuth (2 emails autorisés) | Créer sondages → éditer questions → lancer (PIN) → voir réponses live → répartir en groupes |
| **Apprenant** | Aucun compte | PIN 6 chiffres + prénom → voter en temps réel |

**Propriétaire / prof autorisé :**
- `jeanphilippe@pedagokit.be`
- `jeanphilippe.bolle@cnddinant.be`

---

## 2. Stack technique

| Couche | Choix |
|--------|--------|
| Framework | **Next.js 16** (App Router, `src/app/`) |
| UI | **React 19**, **Tailwind CSS 4** |
| Backend | **Firebase** : Auth (Google), **Firestore** (temps réel) |
| Hébergement | **Firebase App Hosting** (SSR sur Cloud Run, auto-deploy GitHub) |
| Repo | https://github.com/jpbolle/quizKit |
| Projet Firebase | `quizkit-7116e` |

### Règle Next.js importante

> Ce n’est **pas** le Next.js « classique » des modèles d’entraînement.  
> Avant d’écrire du code Next, consulter `node_modules/next/dist/docs/` et respecter les dépréciations.  
> Voir aussi `AGENTS.md` à la racine.

### Scripts npm

```bash
npm run dev          # http://localhost:3000
npm run build        # build Next.js SSR (.next/)
npm run typecheck
npm run deploy:rules # firestore.rules + indexes (Firebase CLI, manuel)
```

> Le déploiement de l'application est automatique sur push `main` via Firebase App Hosting (config `apphosting.yaml`). Les anciens scripts `deploy:hosting` / `deploy` (basés sur l'export statique) ne sont plus utilisés.

---

## 3. Structure du dépôt

```
quizKit/
├── docs/
│   ├── BIBLE.md          ← ce fichier
│   └── SESSION.md        ← journal / objectifs de la session en cours
├── src/
│   ├── app/              # pages (App Router)
│   │   ├── page.tsx      # landing prof / apprenant
│   │   ├── prof/         # espace prof
│   │   └── jouer/        # espace apprenant
│   ├── components/       # UI Kahoot réutilisable
│   └── lib/              # Firebase, auth, Firestore, types, groupes
├── firestore.rules
├── firestore.indexes.json
├── firebase.json
├── apphosting.yaml       # config App Hosting (runConfig + env NEXT_PUBLIC_*)
├── .firebaserc           # default: quizkit-7116e
└── .env.local.example    # variables NEXT_PUBLIC_FIREBASE_* (dev local)
```

---

## 4. Routes applicatives

| Route | Rôle | Description |
|-------|------|-------------|
| `/` | Tous | Accueil : choix prof ou apprenant |
| `/prof/login` | Prof | Connexion Google |
| `/prof` | Prof | Liste + création de sondages |
| `/prof/sondage?id=` | Prof | Édition, lancement, direct, groupes |
| `/jouer` | Apprenant | Saisie PIN + prénom |
| `/jouer/voter?pin=` | Apprenant | Vote + résultats si révélés |

`trailingSlash: true` dans `next.config.ts` → URLs avec `/` final.

---

## 5. Modèle de données Firestore

### Collection `sondages/{sondageId}`

```ts
{
  title: string
  ownerEmail, ownerUid: string
  createdAt, updatedAt: Timestamp
  isLive: boolean
  pin: string | null
  currentQuestionIndex: number   // -1 = pas démarré
  questionVisible: boolean       // false = écran d'attente côté apprenant
  showResults: boolean
  questions: Question[]          // embarqué dans le doc
}
```

> `questionVisible` est remis à `false` à chaque `naviguerQuestion` : le prof contrôle question par question quand l'apprenant la voit (bouton « 🚀 Lancer la question »).

### Sous-collections

- `sondages/{id}/participants/{participantId}` → `{ prenom, joinedAt }`
- `sondages/{id}/reponses/{reponseId}` → id = `{participantId}_{questionIndex}`

### Collection `pins/{pin}`

```ts
{ sondageId: string, createdAt: Timestamp }
```

### Types de questions (`src/lib/types.ts`)

| `type` | Comportement vote |
|--------|-------------------|
| `qcm` | Index option(s) ; `multiAllowed` optionnel |
| `vrai-faux` | `boolean` |
| `nuage-mots` | `string[]` (max `maxMots`) |
| `evaluation` | `Record<itemIndex, 1..5>` (1 = absent, 5 = présent) |

---

## 6. Authentification prof

- Fichiers : `src/lib/firebase.ts`, `src/lib/auth-context.tsx`
- **Popup Google en priorité**, repli **redirect** si popup bloquée
- `getRedirectResult` appelé **une seule fois** (singleton) pour éviter les bugs React Strict Mode
- Emails hors liste → déconnexion immédiate + message d’erreur
- **Domaines autorisés** Firebase : `localhost`, `quizkit-7116e.firebaseapp.com`, `quizkit-7116e.web.app`

### Pièges connus

- Extensions navigateur (LanguageTool, Das Palecte, etc.) → erreurs console / hydration sur `<html>` → `suppressHydrationWarning` dans `layout.tsx`
- CLI Firebase expirée → `firebase login --reauth`

---

## 7. Temps réel

Toute la synchro passe par **`onSnapshot`** Firestore :

- `ecouterSondage`, `ecouterParticipants`, `ecouterReponses` dans `src/lib/sondages.ts`
- Le prof pilote `currentQuestionIndex` et `showResults`
- Les apprenants écoutent le même document sondage

---

## 8. Groupes (`src/lib/groupes.ts` + `GroupesPanel.tsx`)

| Mode | Comportement auto |
|------|----------------|
| `identique` | Un groupe par valeur de réponse |
| `different` | Répartition diversifiée (taille cible, round-robin + évite doublons de valeur) |

Sur la vue Direct prof, en plus de la répartition automatique :

- **Drag & drop** : chaque prénom est `draggable`, on peut le déposer dans un autre groupe (souris/trackpad — HTML5 DnD natif, pas de tactile pour l'instant).
- **➕ Groupe vide** / **🧹 Tout vider** / **🧹 Vider ce groupe** / **✕ Supprimer (si vide)**.
- **🎯 Recette par groupe** (mode varié) : sur chaque groupe, le prof choisit un sous-ensemble de valeurs à mixer dans CE groupe (ex : groupe 1 = A+B, groupe 2 = A+C, groupe 3 = B+C).
- **📥 Remplir auto (recettes)** : pioche dans les non-assignés en round-robin sur les valeurs de chaque recette, jusqu'à atteindre la taille cible. Les apprenants non couverts par une recette vont dans les groupes sans recette.
- À l'arrivée d'un nouveau vote en cours de répartition, l'apprenant est ajouté au plus petit groupe compatible (priorité aux groupes dont la recette accepte sa valeur).

`cleCanonique(q, valeur)` est exporté pour permettre le filtrage par valeur dans l'UI.

---

## 9. Design system Kahoot

- **Police** : Montserrat (Google Font) via `layout.tsx`
- **Couleurs Tailwind** : `kahoot-red`, `blue`, `yellow`, `green`, `purple`, `magenta`, `cream`
- **Composants** : `KahootButton`, `KahootCard`, `KahootLogo`, `KahootShape` (triangle, losange, cercle, carré)
- **Classes utilitaires** : `.kahoot-card`, `.kahoot-shadow-*`, animations `bounce-in`, `float`, etc. dans `globals.css`

**Principe UI** : gros boutons, uppercase, ombres « 3D », fond dégradé violet.

---

## 10. Sécurité Firestore

Règles dans `firestore.rules` :

- Écriture `sondages` : prof authentifié + `ownerUid` correspondant
- Lecture `sondages` : prof propriétaire **ou** `isLive == true` (apprenants)
- `participants` / `reponses` : écriture si sondage live
- `pins` : lecture publique, écriture prof

**Déployer après modification :** `npm run deploy:rules`

---

## 11. Configuration

### En local

Copier `.env.local.example` → `.env.local` :

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=quizkit-7116e.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=quizkit-7116e
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=quizkit-7116e.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

`.env.local` est `.gitignore`d (jamais commit).

### En prod (App Hosting)

Les mêmes variables sont dans `apphosting.yaml` (au repo, OK car `NEXT_PUBLIC_*` part de toute façon dans le bundle client). Disponibilité **BUILD ET RUNTIME** obligatoire pour Next.js (les `NEXT_PUBLIC_*` sont inlinés au build).

---

## 12. Conventions de code

1. **Minimiser le scope** — pas de refacto hors sujet
2. **Client Firebase uniquement** — `getFirebaseAuth()` / `getDb()` dans composants `"use client"` ou effets
3. **Pas de sur-abstraction** — réutiliser `sondages.ts`, `utils.ts`, composants Kahoot existants
4. **Commentaires** — seulement pour logique métier non évidente
5. **Tests** — uniquement si demandés ou couverture métier utile
6. **Langue UI** : français
7. **Commits** : uniquement sur demande explicite de l’utilisateur

---

## 13. Déploiement

### Application (auto)

`git push origin main` → Firebase App Hosting détecte le commit via la connexion GitHub configurée dans la console, exécute Cloud Build (Next.js SSR) puis redéploie sur Cloud Run derrière la CDN.

- Surveiller : Firebase Console → App Hosting → Rollouts.
- Plan **Blaze** requis (App Hosting tourne sur Cloud Run / Cloud Build).
- Domaines auth à jour dans Firebase → Authentication → Domaines autorisés (`*.hosted.app` ou custom).

### Règles Firestore (manuel)

App Hosting **ne déploie pas** les règles. À chaque modif de `firestore.rules` :

```bash
firebase login --reauth   # si token expiré
npm run deploy:rules
```

(À terme : un GitHub Action séparé pour automatiser ce point.)

---

## 14. Évolutions possibles (non implémentées)

- QR code pour rejoindre un sondage
- Export CSV des réponses
- Historique des sessions par cours
- Mode « présentation » plein écran pour le prof
- Analytics Firebase (`measurementId` déjà dans la config)

---

*Dernière mise à jour : 2026-05-26 — migration App Hosting, refonte UI groupes (drag & drop + recettes), questionVisible, dupliquer/réinitialiser sondage.*
