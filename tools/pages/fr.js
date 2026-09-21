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
  description: 'Sauvegardez vos notes de cours Preply Canvas tant que vous y avez encore accès. Relisez-les hors ligne, en PDF ou en HTML. Extension gratuite.',
  ogTitle: 'Exportez et sauvegardez vos notes Preply Canvas',
  ogDescription: 'Gardez une copie de votre Preply Canvas tant que vous y avez accès&nbsp;: à relire hors ligne, à imprimer en PDF ou à exporter.',
  ogImageAlt: 'Les archives d’une salle de classe Preply et une page de Canvas enregistrée.',
  ldDescription: 'Extension de navigateur qui enregistre les pages Canvas de vos cours Preply sur votre ordinateur, pour les relire hors ligne, les imprimer en PDF ou les exporter en HTML, avec toutes leurs versions.',

  skip: 'Aller au contenu',
  navLabel: 'Langue',

  h1: 'Exportez et sauvegardez vos notes <em>Preply Canvas</em>',
  sub: 'Votre Canvas existe peut-être encore quelque part sur Preply. Encore faut-il le retrouver. Enregistrez-en une copie tant que vous y avez accès&nbsp;: vous pourrez la relire hors ligne, l’imprimer en PDF ou l’exporter.',
  addChrome: 'Ajouter à Chrome',
  addFirefox: 'Ajouter à Firefox',
  addEdge: 'Ajouter à MS Edge',
  shotAlt: 'Les archives&nbsp;: à gauche, les pages d’une salle de classe&nbsp;; à droite, la page enregistrée, avec le zoom, l’historique et l’impression.',
  shotCap: 'Une salle de classe par professeur, chaque page une seule fois, et toutes ses versions à portée de clic.',

  how: {
    h2: 'Sauvegardez un Canvas Preply tant que vous y avez accès',
    p: 'Pendant le cours, Preply Canvas Archiver ajoute un bouton d’archivage à la barre d’outils du Canvas. Un clic suffit pour enregistrer la page dans votre navigateur. Et si vous oubliez, pas de souci&nbsp;: chaque page que vous ouvrez ou modifiez est enregistrée automatiquement dès qu’elle ne bouge plus pendant une minute. Juste à côté, un bouton d’impression vous permet d’obtenir un PDF avant la fin du cours.',
    shotAlt: 'La barre d’outils du Canvas Preply, avec deux boutons en plus à droite (impression et archivage), entourés en rose et légendés «&nbsp;Extra buttons&nbsp;».',
    cap: 'C’est tout ce que l’extension ajoute à Preply, dans le même style que les boutons existants.',
  },

  read: {
    h2: 'Vos notes de cours hors ligne, en PDF ou en HTML',
    p1: 'Ouvrez vos archives quand vous voulez depuis l’icône de l’extension, même sans connexion&nbsp;: tout est stocké dans votre navigateur, et Preply n’est jamais contacté. Chaque version d’une page est conservée, et l’historique vous montre ce que votre professeur a ajouté ou corrigé d’une fois sur l’autre.',
    p2: 'Chaque page s’imprime proprement en PDF ou s’exporte en un seul fichier HTML, facile à garder, à sauvegarder ou à partager. Et la recherche couvre toute une salle de classe, sans se soucier des accents ni des majuscules.',
  },

  privacy: {
    h2: 'Rien ne sort de votre navigateur',
    p1: '<strong>Ni serveur, ni compte, ni statistiques</strong>&nbsp;: il n’y a tout simplement nulle part où envoyer vos données. Tout reste sur votre ordinateur, et désinstaller l’extension efface tout.',
    p2: 'Les seules requêtes réseau qu’elle effectue ont lieu sur la page de cours Preply déjà ouverte, pour récupérer les images de votre Canvas.',
  },

  faq: {
    h2: 'Questions fréquentes',
    items: [
      {
        q: 'Comment exporter un Canvas Preply&#8239;?',
        a: 'Installez l’extension, puis ouvrez le Canvas de votre cours sur Preply. Cliquez sur le bouton d’archivage, à droite de la barre d’outils du Canvas, ou laissez l’enregistrement automatique faire le travail. Ouvrez ensuite vos archives depuis l’icône de l’extension et choisissez <strong>Imprimer / PDF</strong>, ou <strong>Exporter en HTML</strong> dans le menu ⋯.',
      },
      {
        q: 'Peut-on télécharger ses notes Preply Canvas&#8239;?',
        a: 'Oui. Chaque page archivée peut être exportée en fichier HTML autonome, images comprises, ou enregistrée en PDF depuis la fenêtre d’impression.',
      },
      {
        q: 'Comment retrouver un Canvas Preply après le cours&#8239;?',
        a: 'Toutes les pages enregistrées pendant que l’extension était installée restent dans vos archives&nbsp;: un clic sur l’icône de l’extension, et vous les retrouvez. En revanche, une page que vous n’avez jamais ouverte avec l’extension ne peut pas être récupérée.',
      },
      {
        q: 'Peut-on exporter un Preply Canvas en PDF&#8239;?',
        a: 'Oui, de deux façons&nbsp;: avec le bouton d’impression ajouté à la barre du Canvas pendant le cours, ou avec <strong>Imprimer / PDF</strong> dans vos archives. Dans la fenêtre d’impression du navigateur, choisissez «&nbsp;Enregistrer au format PDF&nbsp;».',
      },
      {
        q: 'Peut-on relire ses notes Preply hors ligne&#8239;?',
        a: 'Oui. Vos archives sont stockées dans le navigateur et ne passent jamais par Internet&nbsp;: vos notes s’ouvrent même sans connexion.',
      },
      {
        q: 'Où sont stockées mes notes&#8239;?',
        a: 'Uniquement dans le stockage local de votre navigateur, sur votre ordinateur. Rien n’est envoyé en ligne. Attention&nbsp;: désinstaller l’extension efface les archives, alors exportez d’abord les pages que vous voulez garder.',
      },
    ],
  },

  hard: {
    h2: 'Les vrais défis techniques',
    items: [
      {
        h3: 'Chaque version est complète',
        p: 'Chaque enregistrement est conservé en entier, indépendamment des autres, et non comme une suite de modifications. Si un fichier est abîmé, vous perdez une version, pas tout l’historique.',
      },
      {
        h3: 'Une recherche qui parle polonais',
        p: 'La recherche ignore les accents et les majuscules dans toute la salle de classe, y compris le <code>ł</code>, une lettre qu’aucune normalisation Unicode ne décompose. Tapez <code>slonce</code>, vous trouverez <code>słońce</code>.',
      },
      {
        h3: 'Une mise en page fidèle',
        p: 'Les archives reprennent la largeur, la taille et la police de l’éditeur de Preply&nbsp;: les lignes se coupent exactement comme pendant le cours.',
      },
      {
        h3: 'Des images qui ne disparaissent pas',
        p: 'Preply sert les images via des liens qui expirent. L’extension les copie au moment de l’enregistrement&nbsp;; sans cela, vos archives perdraient peu à peu leurs illustrations.',
      },
    ],
  },

  source: {
    h2: 'Installer depuis le code source',
    intro: 'Le plus simple reste de passer par la boutique de votre navigateur. Mais pour lire le code, le modifier ou essayer la version de <code>master</code> avant sa publication, vous pouvez charger l’extension vous-même, sans attendre les quelques jours de validation des boutiques.',
    firefox: 'Ouvrez <code>about:debugging</code>, puis «&nbsp;Ce Firefox&nbsp;» → «&nbsp;Charger un module complémentaire temporaire…&nbsp;» et sélectionnez <code>src/manifest.json</code>. L’extension disparaît au prochain redémarrage&nbsp;: Firefox n’installe durablement que les extensions signées.',
    chromeTitle: 'Chrome et Edge',
    chrome: 'Lancez <code>bash tools/package.sh</code>, ouvrez <code>chrome://extensions</code> (ou <code>edge://extensions</code>), activez le «&nbsp;Mode développeur&nbsp;», cliquez sur «&nbsp;Charger l’extension non empaquetée&nbsp;» et sélectionnez le dossier <code>dist/chrome/</code>.',
    noBuild: 'Aucune compilation, aucune minification&nbsp;: le dossier <code>src/</code> est exactement ce qui est publié. Le code que vous lisez est celui qui s’exécute.',
    past: 'L’extension n’enregistre que les pages ouvertes après son installation&nbsp;: les cours passés ne peuvent pas être récupérés.',
  },

  thanks: {
    h2: 'Merci',
    p: 'À Paula, qui m’enseigne le polonais et connaît le sękacz mieux que personne, et à Shuang laoshi, qui m’enseigne le chinois. Cet outil est né pour garder ce que j’apprends à leurs côtés.',
  },

  footer: {
    source: 'Code source',
    privacy: 'Confidentialité',
    icons: 'icônes&nbsp;: <a href="https://phosphoricons.com">Phosphor</a>',
    disclaimer: 'Outil non officiel, sans aucun lien avec Preply. Preply est une marque de son propriétaire.',
  },
};
