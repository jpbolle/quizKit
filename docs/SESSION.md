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
| **Firebase** | `quizkit-7116e` (App Hosting) |
| **GitHub** | https://github.com/jpbolle/quizKit |

---

## Objectif de la session

Construire **QuizKit** : outil de sondage en direct pour apprenants (style Kahoot), avec espace prof (Google) et espace apprenant (PIN + prénom).

---

## Session 2026-05-26 — UX prof + migration App Hosting

**Objectif :** stabiliser l'UX prof (dead keys, contrôle question par question, groupes) et passer en CI/CD auto sur Firebase.

**Fait :**
- Fix dead keys (`^`, `¨`) dans les inputs de questions → nouveau composant `DebouncedTextInput` (état local + composition events + debounce 400 ms) dans `src/components/QuestionEditor.tsx`.
- Nouveau champ `questionVisible: boolean` sur `Sondage` : la question ne s'affiche aux apprenants que sur clic prof « 🚀 Lancer la question » (vue Live). Bouton + badge visible/masquée + nouvelle fonction `afficherQuestion`.
- Fix `permission-denied` côté apprenant à l'arrêt du sondage : `voter/page.tsx` teardown les listeners dès `isLive: false` au lieu d'attendre la redirection.
- Migration **Firebase Hosting → Firebase App Hosting** : retrait de `output: "export"`, création de `apphosting.yaml` avec les `NEXT_PUBLIC_FIREBASE_*` inlinés (BUILD+RUNTIME). Auto-deploy sur push main via la connexion GitHub de la console App Hosting.
- Fix copier-coller du PIN apprenant : `maxLength` HTML retiré au profit de `replace(/\D/g, "").slice(0, 6)` (l'espace « 123 456 » bouffait un chiffre).
- **GroupesPanel** refondu : drag & drop manuel des prénoms entre groupes ; bouton « ➕ Groupe vide » et « 🧹 Tout vider » ; bouton « 🎯 Recette » par groupe (sélection de valeurs à mixer) ; « 📥 Remplir auto (recettes) » qui distribue les non-assignés en round-robin sur les valeurs de chaque recette.
- Liste sondages : nouveaux boutons **📋 Dupliquer** (clone questions, état vierge) et **🔄 Réinitialiser** (vide participants + réponses, conserve les questions). Fonctions `dupliquerSondage` et `reinitialiserSondage` dans `src/lib/sondages.ts`.

**En cours / à valider :**
- [ ] Premier rollout App Hosting réussi avec URL publique fonctionnelle
- [ ] Auth Google ajoutée au domaine `*.hosted.app` dans Firebase → Authentication → Domaines autorisés
- [ ] Tester le scénario complet de bout en bout sur l'URL prod (PIN, vote, groupes, recettes)

**Prochaines étapes :**
1. Valider le déploiement App Hosting (premier rollout vert, auth OK sur le nouveau domaine).
2. Si besoin pédagogique : ajouter le drag & drop tactile (tablette/écran tactile) — actuellement souris/trackpad uniquement (HTML5 native DnD).
3. (Optionnel) Brancher le déploiement automatique des `firestore.rules` via un GitHub Action séparé (App Hosting ne déploie que l'app).
4. Continuer le polish UX selon retour terrain.

---

## Historique livré ✅

- [x] Next.js 16 + Tailwind 4 (initialement static export, désormais SSR sur App Hosting)
- [x] Design Kahoot (Montserrat, couleurs, composants)
- [x] Auth Google prof (2 emails) — popup + redirect, fix Strict Mode
- [x] CRUD sondages + 4 types de questions
- [x] Lancement live + PIN 6 chiffres
- [x] Vote apprenant temps réel avec écran d'attente entre questions
- [x] Résultats live (prénoms par réponse)
- [x] Répartition en groupes : identique / varié / recettes par groupe / drag & drop manuel
- [x] Duplication et réinitialisation de sondages
- [x] `firestore.rules` + indexes
- [x] Migration Firebase App Hosting (auto-deploy sur push main)

### Bloqueurs connus ⚠️

| Problème | Cause probable | Action |
|----------|----------------|--------|
| Popup Google bloquée | Extensions / navigateur | Utiliser redirect (auto) ou fenêtre privée |
| Hydration mismatch | Extensions (LanguageTool, Das Palecte…) | `suppressHydrationWarning` déjà sur html/body ; tester sans extensions |
| Erreur console `content.js` | Extension traduction | Ignorer — pas QuizKit |
| `NEXT_PUBLIC_*` absentes en prod App Hosting | Vars définies en RUNTIME seulement | **Doivent être BUILD+RUNTIME** — la voie sûre est de les mettre dans `apphosting.yaml` |

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
src/lib/auth-context.tsx          # auth Google popup/redirect
src/lib/sondages.ts               # CRUD + listeners + dupliquer/réinitialiser + afficherQuestion
src/lib/groupes.ts                # cleCanonique exporté, regroupements identique/varié
src/lib/types.ts                  # Sondage.questionVisible
src/app/prof/page.tsx             # liste + dupliquer + réinitialiser + supprimer
src/app/prof/sondage/page.tsx     # édition + live + bouton Lancer la question
src/app/jouer/page.tsx            # PIN apprenant (fix collage avec espace)
src/app/jouer/voter/page.tsx      # vote apprenant + teardown listeners propre
src/components/QuestionEditor.tsx # DebouncedTextInput (fix dead keys)
src/components/GroupesPanel.tsx   # drag & drop + recettes par groupe
firestore.rules
apphosting.yaml                   # config App Hosting + env vars (NEXT_PUBLIC_*)
next.config.ts                    # SSR (output:"export" retiré)
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
