/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

'use strict';

module.exports = {
  path: 'es/',
  hreflang: 'es',
  ogLocale: 'es_ES',
  label: 'Español',

  title: 'Exportar y guardar tu Preply Canvas — Preply Canvas Archiver',
  description: 'Guarda las notas de tus clases de Preply Canvas mientras aún tengas acceso. Léelas sin conexión, en PDF o en HTML. Extensión gratuita.',
  ogTitle: 'Exporta y guarda tus notas de Preply Canvas',
  ogDescription: 'Guarda una copia de tu Preply Canvas mientras aún tengas acceso: para leerla sin conexión, imprimirla en PDF o exportarla.',
  ogImageAlt: 'El archivo de un aula de Preply y una página del Canvas guardada.',
  ldDescription: 'Extensión de navegador que guarda en tu equipo las páginas del Canvas de tus clases de Preply para leerlas sin conexión, imprimirlas en PDF o exportarlas en HTML, con todas sus versiones.',

  skip: 'Ir al contenido',
  navLabel: 'Idioma',

  h1: 'Exporta y guarda tus notas de <em>Preply Canvas</em>',
  sub: 'Puede que tu Canvas siga en algún rincón de Preply. Otra cosa es volver a encontrarlo. Guarda una copia mientras aún tengas acceso: podrás leerla sin conexión, imprimirla en PDF o exportarla.',
  addChrome: 'Añadir a Chrome',
  addFirefox: 'Añadir a Firefox',
  addEdge: 'Añadir a MS Edge',
  shotAlt: 'El archivo: a la izquierda, las páginas de un aula; a la derecha, la página guardada, con el zoom, el historial y la impresión.',
  shotCap: 'Un aula por profesor, cada página una sola vez y todas sus versiones a un clic.',

  how: {
    h2: 'Guarda tu Preply Canvas mientras aún tengas acceso',
    p: 'Durante la clase, Preply Canvas Archiver añade un botón de archivado a la barra de herramientas del Canvas. Con un clic, la página queda guardada en tu navegador. Y si se te olvida, no pasa nada: cada página que abres o editas se guarda sola en cuanto pasa un minuto sin cambios. Justo al lado tienes un botón de impresión para sacar un PDF antes de que termine la clase.',
    shotAlt: 'La barra de herramientas del Canvas de Preply con dos botones nuevos a la derecha (imprimir y archivar), rodeados en rosa con el rótulo «Extra buttons».',
    cap: 'Es todo lo que la extensión añade a Preply, con el mismo estilo que los botones que ya había.',
  },

  read: {
    h2: 'Tus notas de clase sin conexión, en PDF o en HTML',
    p1: 'Abre tu archivo cuando quieras desde el icono de la extensión, incluso sin internet: todo se guarda en tu navegador y nunca se conecta con Preply. Se conserva cada versión de cada página, y el historial te muestra qué ha añadido o corregido tu profesor de una vez a otra.',
    p2: 'Cualquier página se imprime limpia en PDF o se exporta en un único archivo HTML, fácil de guardar, copiar o compartir. Y el buscador recorre toda el aula sin fijarse en tildes ni mayúsculas.',
  },

  privacy: {
    h2: 'Nada sale de tu navegador',
    p1: '<strong>Sin servidor, sin cuenta y sin analíticas</strong>: sencillamente, no hay adónde enviar tus datos. Todo se queda en tu equipo, y al desinstalar la extensión se borra todo.',
    p2: 'Las únicas peticiones de red que hace ocurren en la página de la clase de Preply que ya tienes abierta, para copiar las imágenes de tu Canvas.',
  },

  faq: {
    h2: 'Preguntas frecuentes',
    items: [
      {
        q: '¿Cómo exportar un Canvas de Preply?',
        a: 'Instala la extensión y abre el Canvas de tu clase en Preply. Pulsa el botón de archivado, a la derecha de la barra de herramientas del Canvas, o deja que el guardado automático se encargue. Después, abre tu archivo desde el icono de la extensión y elige <strong>Imprimir / PDF</strong>, o <strong>Exportar como HTML</strong> en el menú ⋯.',
      },
      {
        q: '¿Se pueden descargar las notas de Preply Canvas?',
        a: 'Sí. Cada página archivada se puede exportar como archivo HTML independiente, con sus imágenes, o guardar en PDF desde el diálogo de impresión.',
      },
      {
        q: '¿Cómo acceder a un Canvas de Preply después de la clase?',
        a: 'Todas las páginas guardadas mientras la extensión estaba instalada siguen en tu archivo: basta con pulsar el icono de la extensión para abrirlo. Eso sí, una página que nunca abriste con la extensión instalada no se puede recuperar.',
      },
      {
        q: '¿Se puede exportar un Preply Canvas a PDF?',
        a: 'Sí, de dos maneras: con el botón de impresión que aparece en la barra del Canvas durante la clase, o con <strong>Imprimir / PDF</strong> en tu archivo. En el diálogo de impresión del navegador, elige «Guardar como PDF».',
      },
      {
        q: '¿Puedo leer mis notas de Preply sin conexión?',
        a: 'Sí. Tu archivo vive en el navegador y nunca pasa por internet, así que tus notas se abren aunque no tengas conexión.',
      },
      {
        q: '¿Dónde se guardan mis notas?',
        a: 'Solo en el almacenamiento local de tu navegador, en tu equipo. No se sube nada a ningún sitio. Ojo: al desinstalar la extensión se borra el archivo, así que exporta antes las páginas que quieras conservar.',
      },
    ],
  },

  hard: {
    h2: 'Los verdaderos retos técnicos',
    items: [
      {
        h3: 'Cada versión, completa',
        p: 'Cada guardado se conserva entero e independiente, no como una cadena de cambios. Si un archivo se estropea, pierdes una versión, no todo el historial.',
      },
      {
        h3: 'Un buscador que habla polaco',
        p: 'Ignora tildes y mayúsculas en toda el aula, incluida la <code>ł</code>, una letra que ninguna normalización Unicode descompone. Escribe <code>slonce</code> y encontrarás <code>słońce</code>.',
      },
      {
        h3: 'Un diseño fiel al original',
        p: 'El archivo reproduce el ancho, el tamaño y la tipografía del editor de Preply, así que las líneas se cortan exactamente igual que en clase.',
      },
      {
        h3: 'Imágenes que no desaparecen',
        p: 'Preply sirve las imágenes con enlaces que caducan. La extensión las copia al guardar la página; si no, tu archivo iría perdiendo sus imágenes poco a poco.',
      },
    ],
  },

  source: {
    h2: 'Instalar desde el código fuente',
    intro: 'Lo más sencillo es instalarla desde la tienda de tu navegador. Pero si quieres leer el código, modificarlo o probar la versión de <code>master</code> antes de que se publique, puedes cargar la extensión por tu cuenta, sin esperar los días de revisión de las tiendas.',
    firefox: 'Abre <code>about:debugging</code>, entra en «Este Firefox» → «Cargar complemento temporal…» y selecciona <code>src/manifest.json</code>. La extensión desaparece al reiniciar Firefox: solo las extensiones firmadas se instalan de forma permanente.',
    chromeTitle: 'Chrome y Edge',
    chrome: 'Ejecuta <code>bash tools/package.sh</code>, abre <code>chrome://extensions</code> (o <code>edge://extensions</code>), activa el «Modo de desarrollador», pulsa «Cargar descomprimida» y selecciona la carpeta <code>dist/chrome/</code>.',
    noBuild: 'Sin compilación ni minificación: la carpeta <code>src/</code> es exactamente lo que se publica. El código que lees es el que se ejecuta.',
    past: 'La extensión solo guarda las páginas que abras después de instalarla: las clases anteriores no se pueden recuperar.',
  },

  thanks: {
    h2: 'Gracias',
    p: 'A Paula, que me enseña polaco y sabe de sękacz como nadie, y a Shuang laoshi, que me enseña chino. Esta herramienta nació para conservar lo que aprendo en sus clases.',
  },

  footer: {
    source: 'Código fuente',
    privacy: 'Privacidad',
    icons: 'iconos: <a href="https://phosphoricons.com">Phosphor</a>',
    disclaimer: 'Herramienta no oficial, sin relación con Preply. Preply es una marca de su propietario.',
  },
};
