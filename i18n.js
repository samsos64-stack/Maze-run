// ═══════════════════════════════════════════════════════════════════
//  Corn Maze — traduction français / anglais
//  Fonctionne par observation de la page : aucun texte du jeu n'est
//  modifié dans le code, tout est traduit au moment de l'affichage.
//  Les clés internes (noms de décors : briques, buissons, maïs)
//  ne sont JAMAIS touchées — le moteur 3D s'en sert.
// ═══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  const DICT = {
    // ── Menu et navigation ──
    "Jouer": "Play",
    "Reprendre": "Resume",
    "PAUSE": "PAUSED",
    "Pause": "Pause",
    "Reset": "Reset",
    "Effacer": "Clear",
    "Confirmer ?": "Confirm?",
    "Confirmer ? (progression perdue)": "Confirm? (progress lost)",
    "Recommencer à zéro": "Start over",
    "Chargement…": "Loading…",
    "Génération…": "Generating…",
    "Continuer": "Continue",
    "Annuler": "Cancel",
    "Fermer": "Close",
    "? Aide": "? Help",
    "? Comment jouer": "? How to play",
    "🗺️ Retour à la carte": "🗺️ Back to map",
    "🏆 Classement": "🏆 Leaderboard",
    "🎁 Coffre": "🎁 Chest",
    "⭐ Défi du jour": "⭐ Daily challenge",
    "DÉFI DU JOUR": "DAILY CHALLENGE",
    "🎵 Musique": "🎵 Music",
    "🔊 Sons": "🔊 Sound",
    "Son": "Sound",
    "📢 Publicité": "📢 Advertising",
    "🚫 Sans pub": "🚫 No ads",
    "Sans pub": "No ads",
    "🚫 Supprimer les pubs — 2,99 €": "🚫 Remove ads — €2.99",
    "Espace AdMob": "AdMob space",
    "Pub réelle sur l'app publiée": "Real ad in the published app",
    "Voir la carte (pub)": "View map (ad)",

    // ── HUD ──
    "TEMPS": "TIME",
    "PAS": "STEPS",
    "NIV": "LVL",
    "POINTS": "POINTS",
    "LIMITE": "LIMIT",
    "CARTE ▲": "MAP ▲",
    "CARTE ▼": "MAP ▼",
    "📍 Niv.": "📍 Lvl",

    // ── Phases et modes ──
    "APPRENTI": "APPRENTICE",
    "DÉFI": "CHALLENGE",
    "EXPERT": "EXPERT",
    "☠ CAUCHEMAR": "☠ NIGHTMARE",
    "CAUCHEMAR": "NIGHTMARE",
    "🏃 SPRINT": "🏃 SPRINT",
    "SPRINT": "SPRINT",
    "🌙 NUIT NOIRE": "🌙 DARK NIGHT",
    "NUIT NOIRE": "DARK NIGHT",
    "♾️ INFINI": "♾️ ENDLESS",
    "INFINI": "ENDLESS",
    "⭐ DÉFI DU JOUR": "⭐ DAILY CHALLENGE",

    // ── Décors (affichage seulement) ──
    "Décor : Auto": "Scenery: Auto",
    "Décor : Briques": "Scenery: Bricks",
    "Décor : Buissons": "Scenery: Hedges",
    "Décor : Maïs": "Scenery: Corn",
    "Auto": "Auto",
    "BRIQUES": "BRICKS",
    "BUISSONS": "HEDGES",
    "MAÏS": "CORN",

    // ── Objets ──
    "Marteau": "Hammer",
    "Chrono": "Stopwatch",
    "Carte": "Map",
    "Boussole": "Compass",
    "Fil d'Ariane": "Thread",
    "Marques": "Marks",
    "Casse un mur devant toi": "Breaks a wall ahead of you",
    "+45 secondes": "+45 seconds",
    "+45 secondes !": "+45 seconds!",
    "Révèle la carte 20s": "Reveals the map for 20s",
    "Direction de la sortie 15s": "Points to the exit for 15s",
    "15 secondes": "15 seconds",
    "Trace ton chemin 20s": "Traces your path for 20s",
    "Marque les chemins déjà pris 30s": "Marks paths already taken, 30s",

    // ── Messages ──
    "❌ Impossible de casser le mur extérieur": "❌ Can't break the outer wall",
    "❌ Vise un mur pour le casser": "❌ Aim at a wall to break it",
    "❌ La carte est déjà visible": "❌ The map is already visible",
    "❌ Pas de limite de temps ici": "❌ No time limit here",
    "❌ Pas d'objets sur le défi du jour": "❌ No items in the daily challenge",
    "Achat annulé": "Purchase cancelled",
    "Résultat copié !": "Result copied!",
    "Score copié dans le presse-papier !": "Score copied to clipboard!",
    "Aucun score enregistré.": "No score saved yet.",
    "SORTIE !": "EXIT!",
    "Niveau suivant": "Next level",

    // ── Didacticiel / aide ──
    "Avancer / Reculer": "Forward / Back",
    "Déplacement latéral": "Strafe",
    "Tourner": "Turn",
    "Ou glissez le doigt sur l'écran.": "Or swipe your finger on the screen.",
    "Explorez le labyrinthe en vue première personne et trouvez la ligne d'arrivée 🏁":
      "Explore the maze in first person and find the finish line 🏁",
    "📈 Niveaux 1-10 :": "📈 Levels 1-10:",
    "entraînement, carte visible.": "training, map visible.",
    "⏱ Niveau 11+ :": "⏱ Level 11+:",
    "carte cachée + temps limité !": "hidden map + time limit!",
    "🐛 ERREUR (touche pour fermer)": "🐛 ERROR (tap to close)"
  };

  // Motifs pour les phrases contenant des nombres ou des noms variables
  const PATTERNS = [
    [/\bNiveau\s+(\d+)/g,            "Level $1"],
    [/\bNiv\.?\s*(\d+)/g,            "Lvl $1"],
    [/\bNiv\b/g,                     "LVL"],
    [/(\d+)\s+pas\b/g,               "$1 steps"],
    [/(\d+)\s+points?\b/gi,          "$1 points"],
    [/Trésor caché\s*:/g,            "Hidden treasure:"],
    [/Trésor caché/g,                "Hidden treasure"],
    [/Carte visible pendant/g,       "Map visible for"],
    [/Meilleur score/g,              "Best score"],
    [/Nouveau record/g,              "New record"],
    [/\bsecondes?\b/g,               "seconds"],
    [/\bTemps écoulé\b/g,            "Time's up"],
    [/\bBravo\b/g,                   "Well done"],
    [/\bdébloqué\b/g,                "unlocked"],
    [/\bdéverrouillé\b/g,            "unlocked"],
    [/\bVerrouillé\b/gi,             "Locked"]
  ];

  // ── Langue ──
  const stored = (function () { try { return localStorage.getItem('cm_lang'); } catch (e) { return null; } })();
  let LANG = stored || ((navigator.language || 'fr').toLowerCase().indexOf('fr') === 0 ? 'fr' : 'en');
  window.CM_LANG = LANG;

  function trStr(str) {
    if (LANG !== 'en' || !str) return str;
    const key = str.trim();
    if (!key) return str;
    if (DICT[key] !== undefined) return str.replace(key, DICT[key]);
    // texte contenant une expression connue au milieu d'une phrase
    let out = str, hit = false;
    for (const k in DICT) {
      if (k.length > 3 && out.indexOf(k) !== -1) { out = out.split(k).join(DICT[k]); hit = true; }
    }
    for (const [re, rep] of PATTERNS) {
      if (re.test(out)) { out = out.replace(re, rep); hit = true; }
      re.lastIndex = 0;
    }
    return hit ? out : str;
  }

  const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];

  function trNode(node) {
    if (!node) return;
    if (node.nodeType === 3) {                       // nœud de texte
      const v = node.nodeValue;
      if (v && /[A-Za-zÀ-ÿ]/.test(v)) {
        const t = trStr(v);
        if (t !== v) node.nodeValue = t;
      }
      return;
    }
    if (node.nodeType !== 1) return;
    if (node.id === 'cmLangBtn' || (node.getAttribute && node.getAttribute('data-no-tr'))) return;
    const tag = node.tagName;
    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'CANVAS') return;
    for (const a of ATTRS) {
      if (node.hasAttribute && node.hasAttribute(a)) {
        const v = node.getAttribute(a), t = trStr(v);
        if (t !== v) node.setAttribute(a, t);
      }
    }
    const kids = node.childNodes;
    for (let i = 0; i < kids.length; i++) trNode(kids[i]);
  }

  let observer = null;
  function translateAll() {
    if (LANG !== 'en') return;
    if (observer) observer.disconnect();
    trNode(document.body);
    if (observer) observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  function start() {
    if (!document.body) { setTimeout(start, 50); return; }
    translateAll();
    observer = new MutationObserver(function (muts) {
      if (LANG !== 'en') return;
      observer.disconnect();
      for (const m of muts) {
        if (m.type === 'characterData') trNode(m.target);
        else m.addedNodes && m.addedNodes.forEach(trNode);
      }
      observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    addLangButton();
  }

  // ── Bouton de langue, dans le MENU PRINCIPAL uniquement ──
  // (surtout pas dans le HUD de jeu : cette zone est recouverte par le canvas
  //  qui capte les gestes de déplacement, les clics n'y arrivent jamais)
  function addLangButton() {
    if (document.getElementById('cmLangBtn')) return;
    const anchor = document.getElementById('menuMusicBtn')
                || document.getElementById('noAdsBtn')
                || document.getElementById('leaderboardBtn');
    if (!anchor) { setTimeout(addLangButton, 700); return; }

    const btn = document.createElement('button');
    btn.id = 'cmLangBtn';
    btn.type = 'button';
    btn.className = anchor.className || 'btn';
    const st = anchor.getAttribute('style');
    if (st) btn.setAttribute('style', st);
    btn.textContent = (LANG === 'fr') ? '🌐 EN' : '🌐 FR';
    btn.setAttribute('data-no-tr', '1');

    function toggle(e) {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      const next = (LANG === 'fr') ? 'en' : 'fr';
      try { localStorage.setItem('cm_lang', next); } catch (err) {}
      location.reload();
    }
    btn.addEventListener('click', toggle);
    btn.addEventListener('touchend', toggle, { passive: false });

    anchor.parentNode.insertBefore(btn, anchor.nextSibling);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

  window.CM_setLang = function (l) {
    try { localStorage.setItem('cm_lang', l); } catch (e) {}
    location.reload();
  };
})();
