/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

'use strict';

module.exports = {
  path: 'es/',
  hreflang: 'es',
  ogLocale: 'es_ES',
  label: 'Español',

  title: 'Exportar y guardar Preply Canvas — Preply Canvas Archiver',
  description: 'Guarda tus notas de clase de Preply Canvas mientras aún tienes acceso. Léelas sin conexión, expórtalas a PDF o HTML. Extensión gratuita.',
  ogTitle: 'Exporta y guarda tus notas de Preply Canvas',
  ogDescription: 'Guarda una copia local de tu Preply Canvas mientras aún tienes acceso: léela sin conexión, imprímela en PDF, expórtala.',
  ogImageAlt: 'El lector del archivo: las páginas de un aula y una página archivada de Preply Canvas.',
  ldDescription: 'Extensión de navegador que guarda localmente las páginas del Canvas de las clases de Preply para leerlas sin conexión, imprimirlas en PDF o exportarlas en HTML, conservando cada versión.',

  skip: 'Saltar al contenido',
  navLabel: 'Idioma',

  h1: 'Exporta y guarda tus notas de <em>Preply Canvas</em>',
  sub: 'Puede que tu Canvas siga existiendo en Preply. Volver a encontrarlo ya es otra historia. Guarda una copia local mientras aún tienes acceso y luego léela sin conexión, imprímela en PDF o expórtala.',
  addChrome: 'Añadir a Chrome',
  addFirefox: 'Añadir a Firefox',
  addEdge: 'Añadir a MS Edge',
  shotAlt: 'El lector del archivo: las páginas de un aula a la izquierda, el documento archivado a la derecha, con zoom, historial e impresión encima.',
  shotCap: 'Un aula por profesor. Cada página aparece una sola vez, con todas sus versiones detrás.',

  how: {
    h2: 'Guarda un Preply Canvas mientras aún tienes acceso.',
    p: 'Preply Canvas Archiver añade un botón de archivado a la barra de herramientas del Canvas durante la clase. Un clic y la página queda guardada en tu navegador. Si se te olvida, cada página que abres o editas se guarda sola tras un minuto sin cambios. A su lado hay un botón de impresión, para tener un PDF antes de salir de la clase.',
    shotAlt: 'La barra de herramientas del Canvas de Preply con dos botones extra a la derecha, imprimir y archivar, enmarcados en rosa con el texto Extra buttons.',
    cap: 'Todo lo que la extensión añade a Preply, con el estilo de los botones que ya estaban.',
  },

  read: {
    h2: 'Tus notas de clase, sin conexión, en PDF o HTML.',
    p1: 'Abre el archivo desde el icono de la extensión cuando quieras, incluso sin conexión: se lee desde tu navegador y nunca contacta con Preply. Se conserva cada versión de una página, y el historial muestra lo que tu profesor añadió o corrigió desde la anterior.',
    p2: 'Cualquier página se imprime en un PDF limpio o se exporta como un único archivo HTML que puedes guardar, copiar o enviar. La búsqueda recorre un aula entera, sin distinguir tildes ni mayúsculas.',
  },

  privacy: {
    h2: 'Nada sale de tu navegador.',
    p1: '<strong>Sin servidor, sin cuenta, sin analíticas</strong>: no hay adónde enviar nada. Todo se guarda en el almacenamiento local de tu equipo, y al desinstalar se borra todo.',
    p2: 'Sus únicas peticiones de red se hacen en la página de la clase de Preply que ya tienes abierta, para copiar las imágenes de tu Canvas.',
  },

  faq: {
    h2: 'Preguntas frecuentes',
    items: [
      {
        q: '¿Cómo exportar un Canvas de Preply?',
        a: 'Instala la extensión y abre el Canvas de la clase en Preply. Haz clic en el botón de archivado, a la derecha de la barra de herramientas del Canvas, o deja que se guarde solo. Después abre el archivo desde el icono de la extensión y elige <strong>Imprimir / PDF</strong>, o <strong>Exportar como HTML</strong> en el menú ⋯.',
      },
      {
        q: '¿Puedo descargar mis notas de Preply Canvas?',
        a: 'Sí. Cada página archivada se exporta como un archivo HTML autónomo, con sus imágenes, o se guarda en PDF desde el diálogo de impresión.',
      },
      {
        q: '¿Cómo acceder a un Canvas de Preply después de la clase?',
        a: 'Todas las páginas guardadas mientras la extensión estaba instalada siguen en tu archivo: haz clic en el icono de la extensión para abrirlo cuando quieras. No puede recuperar páginas que nunca se abrieron con la extensión instalada.',
      },
      {
        q: '¿Puedo exportar un Preply Canvas a PDF?',
        a: 'Sí, desde dos sitios: el botón de impresión que añade a la barra del Canvas durante la clase y <strong>Imprimir / PDF</strong> en el archivo. Elige «Guardar como PDF» en el diálogo de impresión del navegador.',
      },
      {
        q: '¿Puedo leer mis notas de Preply sin conexión?',
        a: 'Sí. El archivo está en el almacenamiento de tu navegador y el lector nunca se conecta a internet, así que tus notas se abren sin conexión.',
      },
      {
        q: '¿Dónde se guardan mis notas?',
        a: 'Solo en el almacenamiento local de tu navegador, en tu equipo. No se sube nada. Desinstalar la extensión borra el archivo, así que exporta antes las páginas que quieras conservar.',
      },
    ],
  },

  hard: {
    h2: 'Lo que de verdad fue difícil.',
    items: [
      {
        h3: 'Versiones completas',
        p: 'Cada guardado se almacena completo e independiente, nunca como una cadena de diferencias. Un archivo dañado cuesta una versión, no el historial que hay detrás.',
      },
      {
        h3: 'Una búsqueda que sabe polaco',
        p: 'Ignora tildes y mayúsculas en todo un aula, y <code>ł</code> es una letra que ninguna normalización descompone. Escribe <code>slonce</code> y encuentra <code>słońce</code>.',
      },
      {
        h3: 'Las líneas se cortan donde se cortaban',
        p: 'El lector reproduce el ancho, el tamaño y la tipografía del editor de Preply, así que una página archivada se ajusta igual que en clase.',
      },
      {
        h3: 'Imágenes que sobreviven',
        p: 'Preply las sirve desde enlaces que caducan. Se copian en el momento de la captura; si no, el archivo se iría deteriorando sin avisar.',
      },
    ],
  },

  source: {
    h2: 'Ejecutarlo desde el código fuente.',
    intro: 'Las tres tiendas son la vía normal. Esta es la otra: para leer el código, cambiarlo o usar lo que hay en <code>master</code> antes de que llegue a una tienda. La revisión tarda días; una rama, nada.',
    firefox: '<code>about:debugging</code> → Este Firefox → Cargar complemento temporal… → elige <code>src/manifest.json</code>. Desaparece al reiniciar Firefox: una instalación permanente tiene que estar firmada.',
    chromeTitle: 'Chrome y Edge',
    chrome: 'ejecuta <code>bash tools/package.sh</code> y luego <code>chrome://extensions</code> (o <code>edge://extensions</code>) → Modo de desarrollador → Cargar descomprimida → elige <code>dist/chrome/</code>',
    noBuild: 'Sin compilación, sin bundler, sin minificador: <code>src/</code> es lo que se publica. Lo que lees es lo que se ejecuta.',
    past: 'Solo se pueden capturar las páginas que abras con la extensión instalada. Las clases ya pasadas quedan fuera de alcance.',
  },

  thanks: {
    h2: 'Gracias.',
    p: 'A Paula, que me enseña polaco y es toda una autoridad en sękacz, y a Shuang laoshi, que me enseña chino. Esta herramienta existe para conservar lo que aprendo en sus clases.',
  },

  footer: {
    source: 'Código fuente',
    privacy: 'Privacidad',
    icons: 'iconos de <a href="https://phosphoricons.com">Phosphor</a>',
    disclaimer: 'Herramienta no oficial, sin relación con Preply. Preply es una marca de su propietario.',
  },
};
