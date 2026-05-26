# QuizKit — Session de travail

> **Usage** : document vivant pour une session Claude Code / Cursor.  
> Mettre à jour **Objectif**, **Fait**, **En cours** et **Prochaines étapes** à chaque pause ou fin de session.  
> Référence globale : [`BIBLE.md`](./BIBLE.md)

---

## Métadonnées session

| Champ | Valeur |
|-------|--------|
| **Date** | 2026-05-26 |
| **Branche** | `main` |
| **Environnement** | local `npm run dev` → http://localhost:3000 |
| **Firebase** | `quizkit-7116e` |
| **GitHub** | https://github.com/jpbolle/quizKit |

---

## Objectif de la session

Construire **QuizKit** : outil de sondage en direct pour apprenants (style Kahoot), avec espace prof (Google) et espace apprenant (PIN + prénom).

---

## Contexte rapide (pour reprendre une session)

### Déjà livré ✅

- [x] Next.js 16 + Tailwind 4 + static export Firebase Hosting
- [x] Design Kahoot (Montserrat, couleurs, composants)
- [x] Auth Google prof (2 emails) — popup + redirect, fix Strict Mode
- [x] CRUD sondages + 4 types de questions
- [x] Lancement live + PIN 6 chiffres
- [x] Vote apprenant temps réel
- [x] Résultats live (prénoms par réponse)
- [x] Répartition en groupes (identique / varié)
- [x] `firestore.rules` + indexes
- [x] Push GitHub `main`
- [x] `.env.local` configuré (non versionné)
- [x] Docs : `BIBLE.md`, `SESSION.md`, `README.md`

### En cours / à valider 🔄

- [ ] Connexion Google **testée de bout en bout** par le prof (popup ou redirect)
- [ ] Firestore **créée** dans la console si pas encore fait
- [ ] Règles Firestore **déployées** (`firebase login --reauth` puis `npm run deploy:rules`)
- [ ] Déploiement **Firebase Hosting** (`npm run deploy:hosting`)

### Bloqueurs connus ⚠️

| Problème | Cause probable | Action |
|----------|----------------|--------|
| Popup Google bloquée | Extensions / navigateur | Utiliser redirect (auto) ou fenêtre privée |
| Hydration mismatch | Extensions (LanguageTool, Das Palecte…) | `suppressHydrationWarning` déjà sur html/body ; tester sans extensions |
| `firebase deploy` échoue | Token CLI expiré | `firebase login --reauth` |
| Erreur console `content.js` | Extension traduction | Ignorer — pas QuizKit |

---

## Prochaines étapes (priorité)

1. **Tester auth** en navigation privée : `/prof/login` → Google → `/prof`
2. **Créer Firestore** + déployer règles
3. **Déployer Hosting** et tester PIN sur l’URL publique
4. (Optionnel) Commit des derniers fix auth + docs si pas encore poussés

---

## Décisions prises (ne pas revenir en arrière sans discussion)

| Sujet | Décision |
|-------|----------|
| Backend | Firebase Firestore + Auth (pas Supabase) |
| Auth prof | Google OAuth, liste blanche 2 emails |
| Rejoindre sondage | PIN 6 chiffres + prénom (localStorage participant) |
| Hébergement | Firebase Hosting, export statique Next |
| Style | Kahoot-like (4 couleurs + 4 formes QCM) |

---

## Fichiers touchés récemment (repères)

```
src/lib/auth-context.tsx    # auth Google popup/redirect
src/lib/sondages.ts         # Firestore CRUD + listeners
src/app/prof/sondage/page.tsx # édition + live + groupes
src/app/jouer/voter/page.tsx  # vote apprenant
firestore.rules
docs/BIBLE.md
docs/SESSION.md
README.md
```

---

## Notes libres (session)

<!-- Coller ici : messages d’erreur, URLs de test, idées du prof -->

- Console Firebase : https://console.firebase.google.com/u/0/project/quizkit-7116e/overview

---

## Template — nouvelle session

Copier ce bloc en haut du fichier pour une **nouvelle** journée :

```markdown
## Session YYYY-MM-DD

**Objectif :** …

**Fait :**
- …

**Prochaines étapes :**
1. …
```
