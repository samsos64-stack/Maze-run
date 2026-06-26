# Maze Run — Guide de publication

## Ce que tu as dans ce dossier

| Fichier | Rôle |
|---|---|
| `index.html` | Le jeu complet |
| `manifest.json` | Identité de l'app (nom, icônes, couleurs) |
| `sw.js` | Service Worker — jeu jouable hors ligne |
| `icon-*.png` | Icônes dans toutes les tailles requises |

---

## Étape 1 — Tester en local

Ouvre `index.html` dans Chrome sur ton téléphone Android via un serveur local,
ou utilise l'extension **Live Server** dans VS Code.

---

## Étape 2 — Héberger gratuitement (obligatoire pour les stores)

La PWA doit être accessible via une URL HTTPS publique.

### Option recommandée : GitHub Pages (gratuit, simple)

1. Crée un compte sur [github.com](https://github.com)
2. Crée un nouveau dépôt public nommé `maze-run`
3. Upload tous les fichiers de ce dossier
4. Va dans Settings → Pages → Source : `main` / `root`
5. Ton jeu sera disponible sur `https://TON-PSEUDO.github.io/maze-run`

---

## Étape 3 — Google Play Store (Android)

### Outil : PWABuilder (gratuit, fait par Microsoft)

1. Va sur [pwabuilder.com](https://pwabuilder.com)
2. Entre l'URL de ton jeu hébergé
3. Clique **Package for stores** → **Android**
4. Télécharge le `.aab` généré
5. Crée un compte développeur Google Play : [play.google.com/console](https://play.google.com/console) — **25 $ une seule fois**
6. Soumets l'app → délai de validation : 2-7 jours

---

## Étape 4 — Apple App Store (iPhone/iPad)

Apple est plus strict et demande un Mac ou un abonnement développeur.

### Outil : Capacitor (gratuit)

1. Installe Node.js sur ton ordinateur : [nodejs.org](https://nodejs.org)
2. Dans un terminal : `npm install -g @capacitor/cli`
3. Crée un projet Capacitor avec `index.html` comme source
4. Génère le projet Xcode
5. Compte développeur Apple : **99 €/an** sur [developer.apple.com](https://developer.apple.com)

> 💡 Si tu n'as pas de Mac, des services comme **Expo EAS** ou **Codemagic** peuvent builder pour toi dans le cloud.

---

## Étape 5 — Intégrer de vraies publicités

### Pour le web (Chrome, PWA) : Google AdSense
- Crée un compte sur [adsense.google.com](https://adsense.google.com)
- Remplace le bloc `<!-- Espace publicitaire -->` dans `index.html` par ton tag AdSense

### Pour les apps mobiles : Google AdMob
- Crée un compte sur [admob.google.com](https://admob.google.com)
- Intègre le plugin Capacitor AdMob : `npm install capacitor-admob`
- Remplace la fonction `showInterstitialAd()` par l'appel SDK AdMob

### Revenu estimé réaliste
- 1 000 parties/jour × 0,01 € par pub = ~10 €/mois au démarrage
- 10 000 parties/jour = ~100 €/mois
- Achats "sans pub" à 2,99 € = revenu direct supplémentaire

---

## Étape 6 — Fiche store (ce dont tu as besoin)

- **Nom** : Maze Run
- **Icône** : `icon-512.png` (déjà générée)
- **Captures d'écran** : 3-5 captures sur téléphone (obligatoires)
- **Description courte** : Explorez des labyrinthes en vue 3D. Trouvez la sortie !
- **Description longue** : Maze Run est un jeu de labyrinthe en vue première personne avec des textures procédurales, des thèmes variés (briques, maïs, buissons), un système météo dynamique et des défis de temps progressifs. Parfait pour quelques minutes de jeu partout !
- **Catégorie** : Jeux → Puzzle / Réflexion
- **Classification** : Tout public (PEGI 3)

---

## Questions ?

Ce jeu a été développé avec Claude (Anthropic). Pour continuer à l'améliorer
ou intégrer les pubs réelles, reprends simplement la conversation !
