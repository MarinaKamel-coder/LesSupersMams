# 🚗 GreenCommute

**GreenCommute** est une application web full-stack de covoiturage écologique. Elle permet de mettre en relation des conducteurs proposant des trajets et des passagers cherchant à se déplacer de manière durable et économique.

---

## 🚀 Fonctionnalités principales

### 👤 Gestion des Utilisateurs

- **Authentification sécurisée** : Inscription et connexion avec gestion de sessions via JWT.
- **Profils Utilisateurs** : Profil public avec informations du chauffeur et gestion du profil personnel.
- **Rôles** : Distinction entre les utilisateurs standards et les administrateurs.

### 🛣️ Trajets & Réservations

- **Recherche de trajets** : Filtres dynamiques par ville de départ, destination et date.
- **Création de trajets** : Interface dédiée aux chauffeurs pour proposer des itinéraires.
- **Détails du trajet** : Affichage des informations complètes (prix, places disponibles, profil chauffeur).
- **Système de Réservation** : Les passagers peuvent demander une place sur un trajet.
- **Mes Réservations** : Page de suivi avec statuts en temps réel (PENDING, ACCEPTED, REJECTED).
- **Dashboard Chauffeur** : Création, modification et suivi des trajets proposés.

### ⭐ Confiance & Interaction

- **Système d'Avis** : Publication de notes (étoiles) et commentaires après un trajet terminé.
- **Messagerie** : Canal de communication dédié entre passagers et chauffeurs pour chaque trajet.

---

## 🛠️ Stack Technique

- **Frontend**  : React, TypeScript, Vite, React Router Dom.

- **Backend**  : Node.js, Express, TypeScript.

- **Base de données**  : PostgreSQL (gérée avec Prisma).

- **Authentification**  : JSON Web Token (JWT) et contextes React sécurisés.

---

---

## ⚓ Hooks Personnalisés & Gestion d'État

Le projet utilise les Hooks React pour une gestion fluide du cycle de vie des composants et de l'état global :

***`useAuth`** : Centralise l'accès au contexte d'authentification. Il permet de récupérer facilement l'utilisateur actuel, le jeton JWT, et les fonctions de connexion/déconnexion partout dans l'application.

***`useState`** : Utilisé pour la gestion des états locaux (chargement, erreurs, données des formulaires, listes de trajets).

***`useEffect`** : Gère les appels asynchrones vers l'API lors du montage des composants (ex: chargement automatique des avis ou des réservations dès que le jeton est disponible).

***`useParams` & `useNavigate`** : Utilisés pour la gestion dynamique des routes (récupération d'ID dans l'URL et navigation programmatique après une action).

---

## ⚙️ Installation et Lancement

### 1. Cloner le projet

```bash
git clone [https://github.com/MarinaKamel-coder/LesSupersMams.git](https://github.com/MarinaKamel-coder/LesSupersMams.git)
cd LesSupersMams
```

### 2. Configuration du Backend

```bash
cd backend
npm install
Créez votre fichier .env
npx prisma migrate dev
npx prisma generate
npm run dev
```

### 3. Configuration du Frontend

```bash
cd ../frontend
npm install
npm run dev
L'application sera lancée sur : http://localhost:5173
```
