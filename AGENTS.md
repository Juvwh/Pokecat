# AGENTS.md — Pokécat

> **Ce fichier doit être mis à jour à chaque itération de l'application.**
> Si tu ajoutes un écran, un champ, une dépendance ou que tu changes une décision
> d'architecture, reflète-le ici avant de terminer ta tâche. La section
> « Journal des itérations » en bas sert d'historique.

---

## 1. Ce qu'est Pokécat

Une application web personnelle, pour **deux utilisateurs** (Justin et sa copine),
qui sert de **Pokédex des chats croisés dans la rue**. Chaque chat rencontré est
« capturé » : photos, nom, point GPS, traits de caractère.

Les deux comptes partagent **une seule et même collection** : ce que l'un ajoute
apparaît en temps réel chez l'autre. Il n'y a pas de notion de collection privée.

L'application est utilisée **majoritairement au téléphone, en balade** : la
conception est mobile-first et les actions clés (prendre une photo, poser le point
GPS) sont accessibles en deux taps.

Langue de l'interface, des commentaires et de la documentation : **français**.

---

## 2. Stack technique

| Domaine | Choix | Pourquoi |
|---|---|---|
| Build | Vite 6 + React 18 + TypeScript (strict) | Rapide, simple, zéro config serveur |
| Routing | `react-router-dom` v6, **`HashRouter`** | GitHub Pages ne sait pas rediriger les routes SPA vers `index.html` |
| Données | Firebase Firestore (`onSnapshot`) | Temps réel gratuit, sync entre les deux appareils |
| Auth | Firebase Auth, email + mot de passe, **connexion seule** | Comptes créés à la main dans la console ; l'email sert d'identité dans les règles |
| Photos | **base64 dans Firestore**, pas Firebase Storage | Storage impose le plan Blaze (carte bancaire). Voir §5 |
| Carte | Leaflet + `react-leaflet` v4, tuiles OpenStreetMap | Gratuit, sans clé API |
| Hébergement | **GitHub Pages** via GitHub Actions | Gratuit, HTTPS (indispensable pour caméra + GPS) |
| Styles | CSS unique, variables CSS | Pas de framework ; tout le thème tient dans des tokens `:root` |

**Pas de gestionnaire d'état externe** (Redux, Zustand…) : deux React Contexts suffisent.

---

## 3. Arborescence

```
index.html                     Fonts (Press Start 2P + Nunito), CSS Leaflet, manifest PWA
firestore.rules                Règles de sécurité — à publier dans la console Firebase
explications.md                Guide de mise en route destiné à l'utilisateur (pas aux agents)
.env.example / .env.local      Clés Firebase (.env.local est gitignored)
.github/workflows/deploy.yml   Build + déploiement GitHub Pages
public/
  manifest.webmanifest         PWA (chemins relatifs obligatoires : `./`)
  logo.png                     Favicon + icône PWA (512 px, fond blanc opaque)
src/
  main.tsx                     Point d'entrée
  App.tsx                      HashRouter, providers, routes, garde d'authentification
  firebase.ts                  Init Firebase + `isFirebaseConfigured`
  types.ts                     `Cat`, `CatPhoto`, `CatDraft`, helpers de traits libres
  context/
    AuthContext.tsx            Session + messages d'erreur Firebase traduits en français
    CatsContext.tsx            Abonnement temps réel, `nextNumber`, `filterCats`
  lib/
    cats.ts                    Toutes les opérations Firestore (aucune ailleurs)
    image.ts                   Redimensionnement + compression JPEG
    geo.ts                     Géolocalisation du navigateur
    time.ts                    Dates relatives en français + conversions `<input type="date">`
  components/
    logo-source.png            Logo d'origine fourni par l'utilisateur (1186 px) — à ne pas supprimer
    logo.png                   Version optimisée (512 px, 72 Ko) réellement importée
    Logo.tsx                   Composant unique qui importe `logo.png`
    Header.tsx                 Barre supérieure : logo + titre + déconnexion + recherche
    Nav.tsx                    Navigation basse flottante (Dex / Ajouter / Carte)
    CatCard.tsx                Vignette du catalogue + helper `padNumber`
    Badges.tsx                 Pastilles de caractère (variantes `full` / `dot`)
    TraitPicker.tsx            Saisie des traits : bouton « caresses » + création libre + suggestions
    map.tsx                    `catPin`, `Recenter`, `MapPicker`, constantes de tuiles
    SightingHistory.tsx        Frise des rencontres + formulaire « je l'ai recroisé »
    States.tsx                 `Loading`, `EmptyState`, `Alert`
    SetupNotice.tsx            Écran affiché si `.env.local` est absent
  pages/
    Login.tsx                  Connexion / inscription
    Home.tsx                   Catalogue (route `/`)
    CatDetail.tsx              Fiche d'un chat (`/chat/:id`)
    CatForm.tsx                Création et édition (`/nouveau`, `/chat/:id/modifier`)
    MapPage.tsx                Carte de toutes les rencontres (`/carte`)
  styles/index.css             Toute la feuille de style
```

---

## 4. Modèle de données Firestore

```
cats/{catId}
  number: number          // n° de Pokédex, 1, 2, 3… (affiché « N°001 »)
  name: string
  location: { lat, lng } | null
  traits: string[]        // libellés libres : 'Se laisse caresser', 'Chasseur', 'Adore les voitures'…
  rarity: number          // 1 à 5
  notes: string
  thumbnail: string|null  // data URL JPEG ~400px — sert au catalogue ET aux pins de la carte
  photoCount: number
  firstSeenAt: number     // résumé de l'historique (voir plus bas)
  lastSeenAt: number
  sightingCount: number
  createdBy: string       // uid
  createdByEmail: string  // affiché sur la fiche : « repéré par »
  createdAt / updatedAt: number   // Date.now()

cats/{catId}/photos/{photoId}
  dataUrl: string         // data URL JPEG ~1280px
  createdAt: number

cats/{catId}/sightings/{sightingId}
  at: number              // date DE LA RENCONTRE, pas de la saisie
  note: string
  byEmail: string
```

**Règle structurante :** le document `cats/{catId}` doit rester **léger**. La liste
complète des chats est chargée en permanence via `onSnapshot`, donc seule la
`thumbnail` y vit. Les photos pleine taille sont dans la sous-collection `photos`,
chargées uniquement à l'ouverture d'une fiche (`fetchPhotos`).

Firestore ne supprime pas les sous-collections en cascade : `deleteCat` supprime
explicitement les photos **et les rencontres** avant le document.

### Historique des rencontres

`sightings` est la source de vérité ; `firstSeenAt` / `lastSeenAt` / `sightingCount`
en sont une **copie dénormalisée** sur le document du chat, pour que le catalogue
affiche « vu il y a 3 jours » sans lire une sous-collection par chat.

**Après tout ajout ou suppression d'une rencontre, il faut appeler
`syncSightingSummary(catId, sightings)`** — sinon le catalogue ment. C'est le seul
endroit qui écrit ces trois champs.

La création d'un chat écrit **aussi** une première rencontre (note « Première
rencontre »), pour que l'historique ne soit jamais vide. Pour les documents créés
avant cette fonctionnalité, `toCat` retombe sur `createdAt` et `CatDetail`
reconstitue une entrée d'historique synthétique (id `origine`) ; le bouton de
suppression est masqué quand il ne reste qu'une rencontre, ce qui évite de tenter
de supprimer cette entrée fictive.

Le `number` est calculé côté client (`max(number) + 1` dans `CatsContext`). À deux
utilisateurs, le risque de collision est négligeable et assumé — ne pas le
« corriger » avec une transaction sans raison.

---

## 5. Décisions à ne pas défaire sans raison

1. **Photos en base64 dans Firestore.** Firebase Storage exigerait le plan Blaze
   (carte bancaire). `lib/image.ts` compresse en boucle jusqu'à passer sous
   `MAX_PHOTO_BYTES` (700 Ko), sous la limite Firestore de 1 Mo par document.
   Si un jour l'utilisateur active Blaze, migrer vers Storage devient pertinent.
2. **`HashRouter`.** Les URLs sont de la forme `…/Pokecat/#/carte`. C'est la seule
   façon fiable d'avoir des routes qui survivent au rafraîchissement sur GitHub Pages.
3. **`base: './'` dans `vite.config.ts`.** Permet de servir le build depuis un
   sous-dossier (`/Pokecat/`) sans coder le nom du dépôt en dur. Tous les chemins de
   `index.html` et du manifest doivent donc rester **relatifs** (`./`), jamais `/`.
4. **Les clés Firebase ne sont pas des secrets.** Elles sont publiques par
   construction. La sécurité repose entièrement sur `firestore.rules`, qui
   restreint l'accès à une liste blanche d'emails.
5. **Accès Firestore centralisé dans `lib/cats.ts`.** Aucun composant n'importe
   `firebase/firestore` directement.
6. **Aucune inscription depuis l'application.** L'utilisateur veut un Pokédex
   strictement privé à deux. `AuthContext` n'expose volontairement **pas** de
   `register`, et `Login.tsx` n'a qu'un formulaire de connexion. Les comptes se
   créent dans la console Firebase (Authentication → Users → Add user), et
   « Enable create (sign-up) » y est désactivé. **Ne pas réintroduire d'écran
   d'inscription**, même « pour dépanner ».
7. **Toutes les erreurs sont affichées en français et de façon actionnable**
   (cf. `humanError` dans `AuthContext.tsx`, les messages de `CatsContext`).
   Ne jamais laisser remonter un code d'erreur Firebase brut à l'écran.

---

## 6. Charte visuelle — clair, doux, moderne

L'identité vient du **logo** : une Pokéball dont la moitié haute est rose et la
moitié basse bleue, avec un chat qui fait un clin d'œil. Ces **deux couleurs sont
imposées par l'utilisateur** et structurent toute l'interface.

### Couleurs de marque (ne pas changer)

| Token | Valeur | Usage |
|---|---|---|
| `--blue` | `#a9e8fc` | Dégradé de fond, dégradé des actions, badge « bavard », bordure de focus |
| `--pink` | `#f0cbf0` | Dégradé de fond, dégradé des actions, badge « sauvage », bordure des pins |
| `--blue-soft` / `--pink-soft` | `#ddf5ff` / `#fbeafb` | Fonds de vignettes, zones d'ajout de photo |
| `--blue-deep` / `--pink-deep` | `#1f93bd` / `#b0559f` | **Texte et icônes uniquement** : les couleurs de marque sont trop claires pour du texte |

`--ink` `#24243a` (texte), `--ink-soft`, `--ink-faint`, surfaces blanches
`--surface` / `--surface-2` / `--surface-3`, ombres `--shadow-sm|shadow|shadow-lg`.

### Principes

- **Fond** : dégradé « mesh » fixe sur `body` — bleu en haut à gauche, rose en bas à
  droite, sur une base très claire. Il ne défile jamais (`background-attachment: fixed`).
- **Contenu** : des **cartes blanches** (`.panel`, `.cat-card`) posées dessus, coins
  très arrondis (`--radius` 20 px, `--radius-lg` 28 px), **ombres douces et diffuses,
  jamais de bordure marquée**. C'est ce qui donne l'aspect moderne — ne pas
  réintroduire de grosses bordures.
- **Actions principales** : dégradé `linear-gradient(100deg, var(--blue), var(--pink))`
  avec du **texte foncé** (`--ink`). Même dégradé pour le compteur et l'onglet actif.
- **Header et nav** : translucides + `backdrop-filter: blur()`. La nav est une
  **barre pilule flottante** détachée du bas de l'écran.
- **Typographie** : `Outfit` partout (700/800 pour les titres, `letter-spacing`
  légèrement négatif sur les gros titres). `Press Start 2P` (`--pixel`) survit
  **uniquement** sur les numéros de dex `N°001` — c'est le seul clin d'œil rétro,
  ne pas l'étendre.
- **Traits de caractère** : pastilles pastel. Les traits étant libres, leur
  couleur est **déduite du libellé** (`traitColor`, `src/types.ts`) et propagée en
  CSS via `--badge-color` / `--trait-color`. La palette ne contient que des teintes
  claires : le texte des badges est foncé. Ne pas y ajouter de couleur soutenue.
- **Mobile-first** : conteneur `max-width: 640px`, `env(safe-area-inset-bottom)`
  respecté sous la nav, cibles tactiles ≥ 42 px, `prefers-reduced-motion` honoré.

### Logo

Source unique : le composant `<Logo />`, qui importe `src/components/logo.png`.
Ne jamais importer le PNG ailleurs. Pour le remplacer, il faut mettre à jour
**deux** fichiers : `src/components/logo.png` (dans l'app) et `public/logo.png`
(favicon + icône PWA, référencés en chemins relatifs `./logo.png`).
L'original haute résolution est conservé dans `src/components/logo-source.png` ;
la version utilisée est réduite à 512 px (1,19 Mo → 72 Ko) car elle est chargée
sur chaque écran.

Il n'y a plus de catalogue de traits : ils se créent depuis le formulaire. Les
libellés déjà utilisés dans le dex sont proposés en suggestions par `CatForm`,
complétés par `TRAIT_SUGGESTIONS` (`src/types.ts`) tant que le dex est vide.

---

## 7. Écrans

| Route | Fichier | Contenu |
|---|---|---|
| `/` | `Home.tsx` | Grille des vignettes, compteur, filtrée par la recherche. Le **n°001 est épinglé en tête** et sa vignette est mise en avant |
| `/carte` | `MapPage.tsx` | Carte plein écran, pins = miniatures, popup → lien vers la fiche. Même filtre de recherche |
| `/nouveau` | `CatForm.tsx` (`mode="create"`) | Nom, photos (caméra `capture="environment"` / galerie), `MapPicker`, traits, rareté, notes |
| `/chat/:id` | `CatDetail.tsx` | Photo principale + miniatures + lightbox, bandeau « vu pour la dernière fois », fiche stats, mini-carte, **historique des rencontres**, ajout/suppression de photo, modifier, supprimer |
| `/chat/:id/modifier` | `CatForm.tsx` (`mode="edit"`) | Mêmes champs, sans les photos ni la date de première rencontre (elles se gèrent depuis la fiche) |

La **barre de recherche vit dans le `Header`** et n'est affichée que sur `/` et
`/carte`. Son état est détenu par `Shell` (`App.tsx`) et passé en prop — c'est
volontaire, il n'y a pas de contexte de recherche.

`filterCats` (dans `CatsContext.tsx`) cherche dans **nom + traits + notes**,
insensible à la casse et aux accents, tous les mots de la requête devant
correspondre.

---

## 8. Commandes

```bash
npm install      # dépendances
npm run dev      # serveur local, exposé sur le réseau (test téléphone via wifi)
npm run build    # vérification TypeScript + build de production dans dist/
npm run preview  # servir le build de production localement
```

`npm run build` **doit passer** avant de considérer une tâche terminée.

Le déploiement est automatique : tout `push` sur `main` déclenche
`.github/workflows/deploy.yml`. Les clés Firebase sont injectées depuis les
**Secrets GitHub** (six variables `VITE_FIREBASE_*`).

---

## 9. Pièges connus

- Sans `.env.local`, l'app affiche `SetupNotice` au lieu de planter. Vite ne relit
  les variables d'environnement **qu'au démarrage** : redémarrer après modification.
- La caméra et le GPS exigent **HTTPS** : ils ne marchent pas sur le `http://192.168.x.x`
  du serveur de dev, uniquement sur le site GitHub Pages.
- Après publication, le domaine `<pseudo>.github.io` doit être ajouté dans
  **Firebase → Authentication → Settings → Domaines autorisés**, sinon la connexion échoue.
- Ne pas mettre de photo pleine taille sur le document `cats/{id}` : la liste
  complète est chargée en permanence, cela ruinerait les performances et le quota.
- `react-leaflet` v4 est requis pour React 18 (la v5 exige React 19).
- Le bundle dépasse 500 Ko (Firebase + Leaflet) et Vite émet un avertissement.
  C'est connu et accepté pour une app à deux utilisateurs.

---

## 10. Journal des itérations

### v1.4 — 19 août 2026 — Traits libres, fin des adresses, scroll figé
**Traits de caractère libres.** Le catalogue figé `TRAITS` disparaît : `traits`
est désormais une liste de **libellés** (`string[]`) inventés au moment de
remplir la fiche, via le nouveau `TraitPicker`. Seul « Se laisse caresser »
(`CUDDLY_TRAIT`) garde un bouton dédié, car la fiche lui réserve une ligne.
La couleur d'un trait est déduite de son libellé (`traitColor`), et les anciens
identifiants (`grosLard`…) sont retraduits à la lecture dans `toCat` — donc
**aucune migration Firestore n'est nécessaire**, ne pas en écrire une.

**Suppression du champ `address`.** Seul le point sur la carte est utilisé.
Le champ a disparu du modèle, du formulaire, de la fiche, des vignettes et de la
popup de la carte ; `reverseGeocode` et la dépendance Nominatim ont été retirés.
Les anciens documents gardent leur champ `address` en base, simplement ignoré.
La recherche porte maintenant sur **nom + traits + notes**.

**Scroll figé aux extrémités.** Le défilement appartient à `#root`
(`html, body { overflow: hidden }`), ce qui supprime le rebond du document quand
on continue de scroller alors qu'on est déjà tout en haut ou tout en bas. Ne pas
remettre le défilement sur `body` : le rebond reviendrait.

**Chat n°001 épinglé** en tête du catalogue (`Home`, tri stable) avec une
vignette mise en avant (`.cat-card--featured`). Placeholder des notes tiré au
sort parmi trois exemples.

### v1.3 — 17 août 2026 — Ajustements de contenu
Carte centrée par défaut sur **Profondsart** (hameau de Limal, Wavre —
`DEFAULT_CENTER` dans `lib/geo.ts`) au lieu de Bruxelles : c'est là que le couple
se balade. Placeholders du formulaire adaptés à leur quartier. Retrait des textes
d'aide superflus (compression des photos, date par défaut) — l'interface doit
rester sobre, ne pas les réintroduire. « Chats capturés » → « Chats rencontrés »,
« Ajouter au Pokédex » → « Ajouter au PokéCat », mention « Accès réservé »
retirée de l'écran de connexion.

### v1.2 — 17 août 2026 — Carnet de rencontres et accès fermé
Suppression de l'inscription depuis l'app (comptes créés à la main dans la console
Firebase, sign-up désactivé côté Firebase) ; `register` retiré d'`AuthContext`.
Sous-titre passé à « Caressons-les tous ! ». Ajout de l'**historique des
rencontres** : sous-collection `sightings`, résumé dénormalisé
`firstSeenAt`/`lastSeenAt`/`sightingCount`, date de première rencontre demandée à
la création, bouton « Je l'ai recroisé » et frise antéchronologique sur la fiche,
temps écoulé affiché sur la fiche et sur les vignettes du catalogue. Nouveau
module `lib/time.ts` pour les dates relatives en français.

### v1.1 — 17 août 2026 — Refonte visuelle
Abandon du thème « boîtier Pokédex rouge sombre » au profit d'une interface
**claire et moderne** construite sur les deux couleurs de marque `#a9e8fc` et
`#f0cbf0` fournies par l'utilisateur. Intégration du **logo.png** (Pokéball
rose/bleue au chat) comme logo principal, favicon et icône PWA, via le composant
`<Logo />` ; l'image a été réduite de 1,19 Mo à 72 Ko. Typographie passée à
`Outfit`, `Press Start 2P` restreinte aux numéros de dex. Classe `.screen`
renommée `.panel`, `.btn--ghost` renommée `.btn--outline`, badges de traits
repassés en pastel, navigation transformée en barre pilule flottante.

### v1.0 — 17 août 2026 — Version initiale
Application complète : authentification email, catalogue, fiche détaillée,
formulaire de création/édition, carte des rencontres, recherche nom/adresse,
photos (caméra + galerie) compressées dans Firestore, six traits de caractère,
rareté sur 5, thème Pokédex, PWA installable, déploiement GitHub Pages,
`firestore.rules` avec liste blanche d'emails.
