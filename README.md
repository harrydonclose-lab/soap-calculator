# CorpsGrasCalc — PWA

Calculatrice française des équivalents de corps gras, installable et utilisable hors ligne après son premier chargement.

## Fonctionnalités
- Huile de palme : coefficient `0,142`
- Huile de palmiste : coefficient `0,183`
- Beurre de karité : coefficient `0,138`
- Plusieurs corps gras, sans doublon
- Quantités modifiables et retrait individuel
- Équivalents par corps gras et total
- Rapport PDF créé localement, sans bibliothèque externe
- PWA avec manifeste, icônes et service worker pour le mode hors ligne
- Mise en page adaptée au mobile et à l'ordinateur

## Publier sur GitHub Pages
1. Décompressez le ZIP.
2. Créez un dépôt GitHub, par exemple `corps-gras-pwa`.
3. Téléversez **le contenu** de ce dossier à la racine du dépôt : `index.html`, `app.js`, `style.css`, `manifest.json`, `service-worker.js` et `assets/`.
4. Ouvrez **Settings → Pages**.
5. Dans **Build and deployment**, choisissez **Deploy from a branch**, puis `main` et `/ (root)`, et enregistrez.
6. Attendez la publication puis ouvrez l'URL HTTPS fournie par GitHub Pages.

## Important
- Le service worker et l'installation PWA fonctionnent en HTTPS (GitHub Pages le fournit) ou sur `localhost`; ils ne fonctionnent généralement pas en ouvrant directement `index.html` depuis les fichiers.
- Après publication, ouvrez l'application une première fois en ligne. Elle met ensuite en cache les ressources nécessaires pour les utilisations hors connexion.
- Si vous publiez dans un dépôt de projet, les chemins relatifs `./` permettent à l'application de fonctionner sous `https://utilisateur.github.io/nom-du-depot/`.
- Pour forcer une mise à jour du cache après une modification, changez la valeur `CACHE_NAME` dans `service-worker.js` (par exemple `corps-gras-calc-v2`).
- La génération PDF est intégrée dans `app.js`; aucune dépendance distante n'est utilisée.
