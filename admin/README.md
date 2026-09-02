# PetConnect Admin

Dashboard web (React + Vite) pour l'équipe de modération PetConnect.

## Lancer en local

```bash
cd admin
cp .env.example .env   # ajuster VITE_API_URL si le backend n'est pas sur localhost:5000
npm install
npm run dev
```

## Créer le premier compte administrateur

Pour des raisons de sécurité, l'inscription publique (`/api/auth/register`) ne permet
jamais de créer un compte `admin` — uniquement `user` ou `association`. Pour créer le
premier administrateur, promouvoir un compte existant directement en base :

```js
// depuis backend/, avec MONGO_URI configuré dans .env
node -e "
require('dotenv').config();
const connectDB = require('./src/config/db');
const User = require('./src/models/User');
connectDB().then(async () => {
  await User.updateOne({ email: 'ton-email@exemple.com' }, { role: 'admin' });
  process.exit(0);
});
"
```

Ensuite, connecte-toi sur le dashboard avec cet email/mot de passe.

## Fonctionnalités

- Tableau de bord : statistiques (utilisateurs, annonces, adoptions, signalements, associations, modération en attente)
- Utilisateurs : bloquer/débloquer, attribuer/retirer le badge vérifié aux associations
- Annonces : liste, suppression
- Signalements : liste, statut, résolution
- Contenus signalés : file de modération (utilisateurs/annonces/signalements signalés par la communauté), traiter ou rejeter
