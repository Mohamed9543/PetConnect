# PetConnect

Application mobile d'adoption et de signalement d'animaux (perdu/trouvé), avec API backend.

## Structure

```
found/
├── backend/   API Node.js + Express + MongoDB
└── mobile/    App React Native (Expo Router + NativeWind + TypeScript)
```

## Backend

```bash
cd backend
cp .env.example .env   # renseigner MONGO_URI, JWT_SECRET, Cloudinary...
npm install
npm run dev             # nécessite nodemon (déjà en devDependency)
```

Nécessite une instance MongoDB accessible (locale via `mongod`, ou MongoDB Atlas) dans `MONGO_URI`.

L'API écoute par défaut sur `http://localhost:5000`, avec les routes sous `/api/*` :
`auth`, `users`, `animals`, `reports`, `adoptions`, `favorites`, `messages`, `admin`.
Socket.IO est monté sur le même serveur HTTP pour la messagerie temps réel.

## Mobile

```bash
cd mobile
npm install
npx expo start
```

Avant de lancer sur un appareil physique, mets à jour l'URL de l'API dans
`mobile/src/api/client.ts` (ou variable d'env `EXPO_PUBLIC_API_URL`) avec l'IP
locale de ta machine (`http://192.168.x.x:5000/api`), `localhost` ne fonctionnant
pas depuis un téléphone/émulateur.

### Écrans déjà en place

- Onboarding (3 slides) → Login / Register
- Tabs : Accueil, Animaux (adoption + filtres), Publier (modal), Messages, Profil
- Détails animal (contact, demande d'adoption, favoris)
- Signalement animal perdu / trouvé (photos, localisation GPS, formulaire)
- Publication d'un animal à l'adoption
- Carte (react-native-maps) avec calques Adoption / Perdu / Trouvé
- Messagerie temps réel (Socket.IO)
- Favoris, Notifications (liste statique à brancher sur Expo Notifications)

### Reste à faire

- Espace administrateur (web React) : les endpoints `/api/admin/*` existent déjà côté API.
- Brancher Expo Notifications (push tokens déjà stockés côté `User.pushToken`).
- Écran de sélection de localisation sur carte (actuellement géolocalisation directe).
- Upload d'avatar à l'inscription (l'API l'accepte déjà via `multipart/form-data`).
