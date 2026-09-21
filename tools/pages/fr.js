/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

'use strict';

module.exports = {
  path: 'fr/',
  hreflang: 'fr',
  ogLocale: 'fr_FR',
  label: 'Français',

  title: 'Exporter et sauvegarder un Preply Canvas — Preply Canvas Archiver',
  description: 'Sauvegardez vos notes de cours Preply Canvas tant que vous y avez accès. Relisez-les hors ligne, exportez-les en PDF ou en HTML. Extension gratuite.',
  ogTitle: 'Exportez et sauvegardez vos notes Preply Canvas',
  ogDescription: 'Gardez une copie locale de votre Preply Canvas tant que vous y avez accès&nbsp;: relisez-la hors ligne, imprimez-la en PDF, exportez-la.',
  ogImageAlt: 'La liseuse d’archives&nbsp;: les pages d’une salle de classe et une page Preply Canvas archivée.',
  ldDescription: 'Extension de navigateur qui sauvegarde localement les pages Canvas des cours Preply, pour les relire hors ligne, les imprimer en PDF ou les exporter en HTML, en conservant chaque version.',

  skip: 'Aller au contenu',
  navLabel: 'Langue',

  h1: 'Exportez et sauvegardez vos notes <em>Preply Canvas</em>',
  sub: 'Votre Canvas existe peut-être encore sur Preply. Le retrouver, c’est une autre histoire. Gardez-en une copie locale tant que vous y avez accès, puis relisez-la hors ligne, imprimez-la en PDF ou exportez-la.',
  addChrome: 'Ajouter à Chrome',
  addFirefox: 'Ajouter à Firefox',
  addEdge: 'Ajouter à MS Edge',
  shotAlt: 'La liseuse d’archives&nbsp;: les pages d’une salle de classe à gauche, le document archivé à droite, avec zoom, historique et impression au-dessus.',
  shotCap: 'Une salle de classe par professeur. Chaque page listée une seule fois, avec toutes ses versions derrière elle.',

  how: {
    h2: 'Sauvegardez un Canvas Preply tant que vous y avez accès.',
    p: 'Preply Canvas Archiver ajoute un bouton d’archivage à la barre d’outils du Canvas pendant le cours. Un clic, et la page est enregistrée dans votre navigateur. Un oubli, et chaque page ouverte ou modifiée s’enregistre d’elle-même après une minute sans changement. Un bouton d’impression l’accompagne, pour obtenir un PDF avant de quitter le cours.',
    shotAlt: 'La barre d’outils du Canvas Preply avec deux boutons supplémentaires à droite, impression et archivage, encadrés en rose avec la mention Extra buttons.',
    cap: 'Toute la présence de l’extension dans Preply, dessinée d’après les boutons déjà en place.',
  },

  read: {
    h2: 'Vos notes de cours, hors ligne, en PDF ou en HTML.',
    p1: 'Ouvrez les archives depuis l’icône de l’extension quand vous le voulez, même sans connexion&nbsp;: tout est lu depuis votre navigateur, sans jamais contacter Preply. Chaque version d’une page est conservée, et l’historique montre ce que votre professeur a ajouté ou corrigé depuis la précédente.',
    p2: 'Chaque page s’imprime en un PDF propre, ou s’exporte en un seul fichier HTML à conserver, sauvegarder ou envoyer. La recherche parcourt toute une salle de classe, sans tenir compte des accents ni de la casse.',
  },

  privacy: {
    h2: 'Rien ne quitte votre navigateur.',
    p1: '<strong>Pas de serveur, pas de compte, pas de statistiques</strong>&nbsp;: il n’y a nulle part où envoyer quoi que ce soit. Tout est enregistré dans le stockage local de votre machine, et la désinstallation efface tout.',
    p2: 'Ses seules requêtes réseau ont lieu sur la page de cours Preply que vous avez déjà ouverte, pour copier les images de votre Canvas.',
  },

  faq: {
    h2: 'Questions fréquentes',
    items: [
      {
        q: 'Comment exporter un Canvas Preply&#8239;?',
        a: 'Installez l’extension, puis ouvrez le Canvas du cours sur Preply. Cliquez sur le bouton d’archivage à droite de la barre d’outils du Canvas, ou laissez la sauvegarde automatique s’en charger. Ouvrez ensuite les archives depuis l’icône de l’extension et choisissez <strong>Imprimer / PDF</strong>, ou <strong>Exporter en HTML</strong> dans le menu ⋯.',
      },
      {
        q: 'Peut-on télécharger ses notes Preply Canvas&#8239;?',
        a: 'Oui. Chaque page archivée s’exporte en un fichier HTML autonome, images comprises, ou s’enregistre en PDF depuis la fenêtre d’impression.',
      },
      {
        q: 'Comment retrouver un Canvas Preply après le cours&#8239;?',
        a: 'Toute page enregistrée pendant que l’extension était installée reste dans vos archives&nbsp;: cliquez sur l’icône de l’extension pour les ouvrir, à tout moment. Elle ne peut pas récupérer une page qui n’a jamais été ouverte avec l’extension installée.',
      },
      {
        q: 'Peut-on exporter un Preply Canvas en PDF&#8239;?',
        a: 'Oui, à deux endroits&nbsp;: le bouton d’impression ajouté à la barre du Canvas pendant le cours, et <strong>Imprimer / PDF</strong> dans les archives. Choisissez «&nbsp;Enregistrer au format PDF&nbsp;» dans la fenêtre d’impression du navigateur.',
      },
      {
        q: 'Peut-on relire ses notes Preply hors ligne&#8239;?',
        a: 'Oui. Les archives sont stockées dans votre navigateur et la liseuse ne se connecte jamais&nbsp;: vos notes s’ouvrent sans connexion.',
      },
      {
        q: 'Où sont stockées mes notes&#8239;?',
        a: 'Uniquement dans le stockage local de votre navigateur, sur votre machine. Rien n’est envoyé en ligne. Désinstaller l’extension efface les archives&nbsp;: exportez d’abord les pages que vous voulez garder.',
      },
    ],
  },

  hard: {
    h2: 'Ce qui a vraiment été difficile.',
    items: [
      {
        h3: 'Des versions entières',
        p: 'Chaque enregistrement est stocké complet et indépendant, jamais comme une chaîne de différences. Un fichier abîmé coûte une version, pas l’historique qui la précède.',
      },
      {
        h3: 'Une recherche qui connaît le polonais',
        p: 'Accents et casse ignorés dans toute une salle de classe — et <code>ł</code> est une lettre qu’aucune normalisation ne décompose. Tapez <code>slonce</code>, trouvez <code>słońce</code>.',
      },
      {
        h3: 'Les lignes se coupent au même endroit',
        p: 'La liseuse reproduit la largeur, la taille et la police de l’éditeur de Preply&nbsp;: une page archivée se met en page exactement comme en cours.',
      },
      {
        h3: 'Des images qui tiennent',
        p: 'Preply les sert depuis des liens qui expirent. Elles sont copiées au moment de la capture, sinon l’archive se dégraderait sans bruit.',
      },
    ],
  },

  source: {
    h2: 'L’exécuter depuis les sources.',
    intro: 'Les trois boutiques d’extensions sont la voie normale. Voici l’autre&nbsp;: pour lire le code, le modifier, ou utiliser ce qui est sur <code>master</code> avant qu’une boutique ne le publie. La validation prend des jours, une branche aucun.',
    firefox: '<code>about:debugging</code> → Ce Firefox → Charger un module complémentaire temporaire… → choisissez <code>src/manifest.json</code>. Il disparaît au redémarrage de Firefox&nbsp;: une installation permanente doit être signée.',
    chromeTitle: 'Chrome et Edge',
    chrome: 'lancez <code>bash tools/package.sh</code>, puis <code>chrome://extensions</code> (ou <code>edge://extensions</code>) → Mode développeur → Charger l’extension non empaquetée → choisissez <code>dist/chrome/</code>',
    noBuild: 'Pas d’étape de build, pas de bundler, pas de minification&nbsp;: <code>src/</code> est ce qui est livré. Ce que vous lisez est ce qui s’exécute.',
    past: 'Seules les pages ouvertes pendant que l’extension est installée peuvent être capturées. Les cours déjà passés sont hors d’atteinte.',
  },

  thanks: {
    h2: 'Merci.',
    p: 'À Paula, qui m’enseigne le polonais et fait autorité en matière de sękacz, et à Shuang laoshi, qui m’enseigne le chinois. Cet outil existe pour garder ce que j’apprends dans leurs cours.',
  },

  footer: {
    source: 'Code source',
    privacy: 'Confidentialité',
    icons: 'icônes de <a href="https://phosphoricons.com">Phosphor</a>',
    disclaimer: 'Outil non officiel, sans lien avec Preply. Preply est une marque de son propriétaire.',
  },
};
