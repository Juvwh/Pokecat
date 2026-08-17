# Pokécat — Mise en route pas à pas

Ce document t'explique **exactement** quoi faire, dans l'ordre, pour que Pokécat
fonctionne et que ta copine et toi partagiez le même catalogue de chats depuis vos
téléphones et vos PC.

Compte environ **30 minutes** la première fois. Tout est gratuit : aucune carte
bancaire n'est demandée à aucun moment.

---

## Vue d'ensemble

| Élément | Rôle | Coût |
|---|---|---|
| **Firebase Authentication** | Vos deux comptes (email + mot de passe) | Gratuit |
| **Firestore** | La base de données commune : les chats et leurs photos | Gratuit (plan Spark) |
| **GitHub Pages** | Héberge le site pour qu'il soit accessible partout | Gratuit |
| **OpenStreetMap** | Le fond de carte | Gratuit, sans compte |

> **Pourquoi pas Firebase Storage pour les photos ?**
> Depuis fin 2024, activer Firebase Storage impose de passer au plan **Blaze**,
> qui exige une carte bancaire. Pokécat contourne ça : les photos sont
> **compressées dans le navigateur** puis enregistrées directement dans Firestore.
> C'est largement suffisant pour un usage à deux (voir la section « Limites » en bas).

---

## Étape 1 — Créer le projet Firebase

1. Va sur **https://console.firebase.google.com** et connecte-toi avec ton compte Google.
2. Clique sur **« Créer un projet »**.
3. Nom du projet : `pokecat`. Clique **Continuer**.
4. **Décoche** « Activer Google Analytics » (inutile ici). Clique **Créer le projet**.
5. Attends une trentaine de secondes, puis clique **Continuer**.

---

## Étape 2 — Créer la base de données Firestore

1. Dans le menu de gauche : **Créer** → **Firestore Database**.
2. Clique sur **« Créer une base de données »**.
3. **Emplacement** : choisis `eur3 (europe-west)` ou `europe-west1 (Belgique)`.
   ⚠️ Ce choix est **définitif**, on ne peut pas le changer après.
4. **Règles de sécurité** : choisis **« Démarrer en mode test »** pour l'instant.
   On les remplacera par les vraies règles à l'étape 5.
5. Clique **Créer**.

Tu arrives sur une base vide. C'est normal : la collection `cats` sera créée
automatiquement quand tu enregistreras ton premier chat.

---

## Étape 3 — Créer vos deux comptes (et bloquer les inscriptions)

L'application **n'a pas de bouton « S'inscrire »** : c'est volontaire, pour que
personne d'autre que vous deux ne puisse se créer un compte. Les comptes se créent
donc à la main, ici.

### 3.1 — Activer la connexion par email

1. Menu de gauche : **Créer** → **Authentication**.
2. Clique **« Commencer »**.
3. Dans l'onglet **Sign-in method**, clique sur **« E-mail/Mot de passe »**.
4. Active le premier interrupteur (**Activer**). Laisse « Lien de connexion » désactivé.
5. Clique **Enregistrer**.

### 3.2 — Créer les deux comptes à la main

1. Onglet **Users** (Utilisateurs) → bouton **« Add user »** / **« Ajouter un utilisateur »**.
2. Saisis **ton** email et un mot de passe (minimum 6 caractères). Valide.
3. Recommence pour le compte de ta copine.

> Note bien les deux adresses exactes : ce sont elles qu'il faudra recopier dans les
> règles de sécurité à l'étape 5.

Si l'un de vous oublie son mot de passe, tu peux le réinitialiser depuis cette même
page : les trois points ⋮ au bout de la ligne → **« Reset password »**.

### 3.3 — Interdire la création de nouveaux comptes

C'est la ceinture de sécurité : même si quelqu'un récupérait vos clés Firebase, il
ne pourrait pas se fabriquer un compte.

1. Onglet **Settings** (Paramètres) → section **« User actions »** (Actions utilisateur).
2. **Décoche** **« Enable create (sign-up) »** / « Autoriser la création de comptes ».
3. Clique **Enregistrer**.

> ⚠️ Fais ça **après** avoir créé vos deux comptes à l'étape 3.2. Si tu dois ajouter
> un compte plus tard, il faudra recocher la case, créer le compte, puis la décocher
> à nouveau — l'ajout depuis le bouton « Add user » de la console reste possible dans
> tous les cas.

---

## Étape 4 — Récupérer les clés et remplir `.env.local`

1. Clique sur la **roue dentée ⚙️** en haut à gauche → **Paramètres du projet**.
2. Descends jusqu'à la section **« Vos applications »**.
3. Clique sur l'icône **Web** `</>`.
4. Surnom de l'application : `pokecat-web`.
   **Ne coche pas** « Configurer Firebase Hosting ». Clique **Enregistrer l'application**.
5. Firebase affiche un bloc de code contenant `const firebaseConfig = { … }`.
   Garde cette page ouverte.
6. Dans le dossier du projet sur ton PC, **duplique** le fichier `.env.example` et
   renomme la copie en **`.env.local`**.
7. Recopie chaque valeur de Firebase dans `.env.local` :

```
VITE_FIREBASE_API_KEY=AIzaSy…            <- apiKey
VITE_FIREBASE_AUTH_DOMAIN=pokecat-xxxx.firebaseapp.com   <- authDomain
VITE_FIREBASE_PROJECT_ID=pokecat-xxxx    <- projectId
VITE_FIREBASE_STORAGE_BUCKET=pokecat-xxxx.firebasestorage.app  <- storageBucket
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789   <- messagingSenderId
VITE_FIREBASE_APP_ID=1:123456789:web:abc…     <- appId
```

> Pas de guillemets, pas d'espace autour du `=`.

> **Ces clés sont-elles secrètes ?** Non. Elles finissent forcément dans le code
> JavaScript envoyé au navigateur, c'est prévu ainsi par Google. Ce qui protège
> vraiment vos données, ce sont les **règles Firestore** de l'étape 5.

---

## Étape 5 — Verrouiller la base avec les règles de sécurité

Le « mode test » de l'étape 2 laisse la base **ouverte à tout le monde** pendant
30 jours. On la referme maintenant.

1. Ouvre le fichier **`firestore.rules`** du projet.
2. Remplace les deux adresses email de la fonction `membres()` par **vos deux
   vraies adresses** (celles que vous utiliserez pour vous connecter) :

```
function membres() {
  return [
    'ton.email@gmail.com',
    'email.de.ta.copine@gmail.com'
  ];
}
```

3. Dans la console Firebase : **Firestore Database** → onglet **Règles**.
4. **Efface tout** le contenu de l'éditeur et **colle** le contenu complet de ton
   fichier `firestore.rules`.
5. Clique **Publier**.

À partir de maintenant, seules vos deux adresses peuvent lire ou écrire des chats.
N'importe qui d'autre, même avec les clés de l'étape 4, sera refusé.

---

## Étape 6 — Lancer l'application sur ton PC

Ouvre un terminal dans le dossier du projet :

```bash
npm install
```

```bash
npm run dev
```

Ouvre **http://localhost:5173** dans ton navigateur.

Sur l'écran de connexion, saisis l'email et le mot de passe du compte créé à
l'étape 3.2. Tu arrives sur le Pokédex vide : ajoute un premier chat pour tester ! 🐈

Ta copine se connecte de son côté avec **son** compte. Vous verrez tous les deux
exactement les mêmes chats, en temps réel.

> **Tester depuis ton téléphone pendant le développement** : le terminal affiche une
> ligne « Network: http://192.168.x.x:5173 ». Ouvre cette adresse sur ton téléphone
> connecté au **même wifi**. (L'appareil photo et le GPS ne marcheront pas en `http://`
> sur mobile — c'est normal, ils exigent `https://`. Ils fonctionneront une fois le
> site publié sur GitHub Pages, qui est en `https`.)

---

## Étape 7 — Publier sur GitHub Pages

C'est ce qui vous permettra d'utiliser Pokécat n'importe où, depuis n'importe quel
téléphone, sans lancer quoi que ce soit sur le PC.

### 7.1 — Envoyer le code sur GitHub

Si le dépôt distant n'existe pas encore, crée-le sur **https://github.com/new**
(nom suggéré : `Pokecat`, visibilité **Public** — Pages est gratuit pour les dépôts publics).

Puis, dans le terminal du projet :

```bash
git add . && git commit -m "Pokecat: application complete"
```

```bash
git remote add origin https://github.com/TON-PSEUDO/Pokecat.git
```

```bash
git push -u origin main
```

> Si `git remote add` répond que « origin existe déjà », c'est que le dépôt distant
> est déjà configuré : passe directement au `git push`.

⚠️ Le fichier `.env.local` **n'est pas envoyé** sur GitHub (il est dans `.gitignore`).
C'est voulu — on passe les clés autrement, voir 7.3.

### 7.2 — Activer GitHub Pages

1. Sur GitHub, ouvre ton dépôt → onglet **Settings** → menu de gauche **Pages**.
2. Dans **« Source »**, choisis **« GitHub Actions »** (et non « Deploy from a branch »).
3. C'est tout, il n'y a rien à valider.

### 7.3 — Donner les clés Firebase à GitHub

1. Toujours dans **Settings** → **Secrets and variables** → **Actions**.
2. Clique **« New repository secret »** et crée **six** secrets, un par ligne du
   fichier `.env.local` (même nom, même valeur) :

   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

### 7.4 — Lancer le déploiement

Le déploiement démarre tout seul à chaque `git push` sur `main`. Pour le déclencher
maintenant (après avoir créé les secrets) :

1. Onglet **Actions** du dépôt → workflow **« Déploiement GitHub Pages »**.
2. Bouton **« Run workflow »** → **Run workflow**.
3. Attends le ✅ vert (environ 1 à 2 minutes).

Ton site est en ligne à l'adresse :

```
https://TON-PSEUDO.github.io/Pokecat/
```

### 7.5 — Autoriser cette adresse dans Firebase

Sans ça, la connexion sera refusée depuis le site publié.

1. Console Firebase → **Authentication** → onglet **Settings** (Paramètres).
2. Section **« Domaines autorisés »** → **« Ajouter un domaine »**.
3. Saisis : `TON-PSEUDO.github.io` (juste le domaine, sans `https://` ni `/Pokecat/`).
4. Valide.

---

## Étape 8 — Installer Pokécat comme une app sur vos téléphones

Pokécat est une **PWA** : elle s'installe sur l'écran d'accueil comme une vraie app.

- **Android (Chrome)** : ouvre le site → menu ⋮ → **« Ajouter à l'écran d'accueil »**.
- **iPhone (Safari)** : ouvre le site → bouton **Partager** ⬆️ → **« Sur l'écran d'accueil »**.

Une icône Pokécat apparaît, l'app s'ouvre en plein écran sans barre d'adresse.

---

## Utilisation au quotidien

| Onglet | À quoi ça sert |
|---|---|
| 📕 **Dex** | Le catalogue de tous les chats croisés, avec la barre de recherche (nom ou adresse) |
| ➕ **Ajouter** | Enregistrer un nouveau chat : photo, nom, adresse, point sur la carte, caractère, date de la première rencontre |
| 🗺️ **Carte** | Tous les points de rencontre. Tape sur un chat pour ouvrir sa fiche |

Quand vous ajoutez un chat, **l'autre le voit apparaître immédiatement** sur son écran,
sans rien rafraîchir.

### Le carnet de rencontres

Chaque chat garde l'historique de **toutes** les fois où vous l'avez croisé.

- À la création, la **date de la première rencontre** est demandée (aujourd'hui par
  défaut — pratique si tu encodes un chat croisé il y a deux semaines).
- Quand vous le recroisez, ouvrez sa fiche et cliquez sur **« 👋 Je l'ai recroisé »**.
  Vous pouvez choisir la date et ajouter une petite note (« il dormait sur la voiture
  rouge »).
- La fiche affiche en gros **depuis combien de temps vous ne l'avez plus vu**, le
  nombre total de rencontres, et la frise complète de l'historique.
- Dans le catalogue, chaque vignette montre « 👀 il y a 3 jours » et un badge
  **×4** si le chat a été croisé plusieurs fois.

Une rencontre encodée par erreur se supprime avec le petit **×** à droite de la ligne
(la toute dernière rencontre restante ne peut pas être supprimée).

Sur la fiche d'un chat, tu peux aussi **ajouter d'autres photos**, **modifier** les
infos ou **supprimer** le chat.

---

## Modifier l'application plus tard

Après n'importe quelle modification du code :

```bash
git add . && git commit -m "ce que j'ai changé"
```

```bash
git push
```

GitHub Pages se met à jour tout seul en 1–2 minutes.

---

## Limites à connaître

- **Taille des photos** : chaque photo est compressée à ~200–500 Ko avant l'envoi.
  Firestore limite un document à 1 Mo — la compression s'ajuste automatiquement pour
  rester en dessous.
- **Quota gratuit Firestore** : 1 Gio de stockage, 50 000 lectures et 20 000 écritures
  par jour. À deux, c'est de l'ordre de **plusieurs milliers de chats** avant de s'en
  approcher. Aucun risque de facturation : sur le plan Spark, en cas de dépassement
  l'accès est simplement bloqué jusqu'au lendemain, jamais facturé.
- **Adresses automatiques** : le bouton « Ma position » utilise Nominatim
  (OpenStreetMap), gratuit mais parfois lent ou imprécis. L'adresse reste toujours
  modifiable à la main.

---

## En cas de problème

| Symptôme | Cause probable et solution |
|---|---|
| Écran « Configuration Firebase manquante » | `.env.local` absent ou mal rempli. Refais l'étape 4, puis **relance `npm run dev`** (les variables ne sont lues qu'au démarrage). |
| « La connexion par email n'est pas activée » | Étape 3.1 non faite. |
| « Email ou mot de passe incorrect » alors que c'est bon | Le compte n'existe pas encore : il faut le créer à la main (étape 3.2). Il n'y a pas d'inscription depuis l'app. |
| « Accès refusé par Firestore » | Les emails de `membres()` dans les règles ne correspondent pas à ceux utilisés pour se connecter. Vérifie l'orthographe exacte, puis republie les règles (étape 5). |
| Connexion impossible depuis le site GitHub Pages | Étape 7.5 non faite (domaine non autorisé). |
| Page blanche sur GitHub Pages | Les six secrets de l'étape 7.3 ne sont pas tous créés. Vérifie, puis relance le workflow (étape 7.4). |
| L'appareil photo ne s'ouvre pas sur mobile | Tu es en `http://` (serveur local). Utilise l'adresse GitHub Pages en `https://`. |
| Le bouton « Ma position » échoue | La permission de localisation a été refusée dans le navigateur. Tu peux toujours placer le point à la main sur la carte. |
