# Store listing copy

Text to paste into the AMO, Chrome Web Store and Microsoft Edge Add-ons
submission forms. Kept in the repository so the wording stays consistent across
the three stores and across versions — it is submission material, not
documentation of the code.

The store dashboards hold the live copy, not this file. Text is kept here only
when it is used more than once — across the three stores, across locales, or
across versions. A field that exists once, in one dashboard that remembers it,
does not belong here: the duplicate would drift the first time it is edited
there and never here.

Short descriptions are held under **132 characters**, the Chrome Web Store
limit; AMO allows 250 and Edge takes its short description from the manifest,
but there is no reason to diverge.

Long descriptions must clear **250 characters** for Edge, which is the only
store with a floor. Every one of them does, by a wide margin.

Screenshots live in `docs/screenshots/`. The `store-` prefixed files are 1280x800,
the size the Chrome Web Store expects, and one of the two sizes Edge accepts;
AMO accepts the originals as they are.

---

## For reviewers — English only

### Single purpose

Archives the Canvas pages of the user's own Preply lessons into local browser
storage, and displays them again afterwards.

### Permission justifications

| Permission | Justification |
|---|---|
| `host_permissions: https://preply.com/*` | The extension reads the Canvas document of a lesson page the user is already viewing, in order to save a copy. It runs on no other site. |
| `storage` | Saved pages, their versions and the user's display preferences are kept in local extension storage. |
| `unlimitedStorage` | A single lesson accumulates dozens of HTML versions over time; the default quota would silently truncate a user's archive. |
| `data_collection_permissions: { required: ["none"] }` | Nothing is transmitted outside the extension. Declared explicitly so Firefox’s built-in consent screen states it. |

### Data handling

No user data is collected, transmitted or sold. The extension has no server and
no analytics. Everything it writes stays in the browser's local storage on the
user's own machine. The only outbound requests go to `preply.com` itself, to
download images already displayed on the page being archived.

### Linter warnings

Since 0.4.0 the validator reports no `UNSAFE_VAR_ASSIGNMENT`. The two remaining
warnings concern `data_collection_permissions`, which Firefox before 140 does
not know and ignores; the add-on still supports Firefox 115 ESR.

The add-on archives an HTML document and shows it again, so it handles HTML.
The content originates from the Preply Canvas, so a tutor could in principle
paste hostile markup into it. `sanitize.js` holds the one rule, applied at
capture and again before anything is displayed or exported: elements,
attributes and URL schemes are kept only if allowlisted — no script, style,
frame, object, SVG, form or event handler, links limited to `http`, `https` and
`mailto`, and no inline style that positions content or fetches a resource. The
viewer parses stored markup with `DOMParser`, which is inert, and never assigns
it to `innerHTML`.

Beyond that, the extension declares **no** `content_security_policy`, so the
default MV3 policy (`script-src 'self'`) applies to extension pages. No `eval`,
no remote script, no inline script anywhere — `viewer.html` loads five local
files.

The metadata also lists `content.js` and `viewer.js` under
`unknownMinifiedFiles`. Neither is minified or generated: both are the
hand-written sources, commented and JSDoc-annotated. The whole add-on is
built without a bundler, a transpiler or a minifier, and the repository is
public at https://github.com/Mars073/Preply-canvas-archiver.

### Testing instructions

The archive button only appears on a Preply lesson Canvas, which requires a
Preply account and an active lesson, so a reviewer cannot exercise it directly.

The rest of the extension is reachable without any account: click the toolbar
icon to open the archive viewer. With no archive stored it shows its empty
state. The extension does nothing at all on any site other than `preply.com`.

---

## User-facing copy

Product name, identical in every locale: **Preply Canvas Archiver**

Every long description ends with the same disclaimer, translated: this is an
unofficial tool, not affiliated with or endorsed by Preply.

### English

**Short**
Archive the Canvas pages of your Preply lessons and read them back offline, at any time.

**Long**
Preply lets you open a lesson's Canvas during class, and not afterwards. This
extension saves it, so your notes stay yours.

• One click on the archive button in the Canvas toolbar stores the page. It also
saves on its own a minute after the last edit.
• Every version is kept, and the history panel shows exactly what your tutor
added or corrected since the previous one.
• Read your archive offline, in a viewer that never contacts Preply.
• Print to PDF, or export a self-contained HTML file.
• Search across a classroom, ignoring accents and case: type "slonce" and find
"słońce".

Everything stays in your browser. No account, no server, no tracking.

Unofficial tool. Not affiliated with, nor endorsed by, Preply.

### Français

**Short**
Archivez les pages Canvas de vos cours Preply et relisez-les hors ligne, à tout moment.

**Long**
Preply ne permet d'ouvrir le Canvas d'un cours que pendant la séance, jamais
après. Cette extension l'enregistre, pour que vos notes restent les vôtres.

• Un clic sur le bouton d'archivage dans la barre du Canvas enregistre la page.
Une sauvegarde automatique se déclenche aussi une minute après la dernière
modification.
• Chaque version est conservée, et le volet d'historique montre précisément ce
que votre professeur a ajouté ou corrigé depuis la précédente.
• Relisez vos archives hors ligne, dans une interface qui ne contacte jamais
Preply.
• Imprimez en PDF, ou exportez un fichier HTML autonome.
• Cherchez dans toute une salle de classe, sans vous soucier des accents ni de
la casse : tapez « slonce » et trouvez « słońce ».

Tout reste dans votre navigateur. Aucun compte, aucun serveur, aucun pistage.

Outil non officiel, sans affiliation avec Preply.

### Español

**Short**
Archiva las páginas del Canvas de tus clases de Preply y léelas sin conexión cuando quieras.

**Long**
Preply solo permite abrir el Canvas de una clase durante la sesión, nunca
después. Esta extensión lo guarda, para que tus apuntes sigan siendo tuyos.

• Un clic en el botón de archivado de la barra del Canvas guarda la página.
También se guarda solo un minuto después de la última modificación.
• Se conserva cada versión, y el panel de historial muestra exactamente lo que
tu profesor añadió o corrigió desde la anterior.
• Lee tu archivo sin conexión, en una interfaz que nunca contacta con Preply.
• Imprime en PDF o exporta un archivo HTML autónomo.
• Busca en toda un aula sin preocuparte por acentos ni mayúsculas: escribe
«slonce» y encuentra «słońce».

Todo permanece en tu navegador. Sin cuenta, sin servidor, sin rastreo.

Herramienta no oficial, sin afiliación con Preply.

### Русский

**Short**
Сохраняйте страницы Canvas с уроков Preply и читайте их офлайн в любое время.

**Long**
Preply позволяет открыть Canvas урока только во время занятия и никогда после
него. Это расширение сохраняет его, чтобы ваши записи остались вашими.

• Одно нажатие на кнопку архивации на панели Canvas сохраняет страницу.
Автосохранение также срабатывает через минуту после последнего изменения.
• Сохраняется каждая версия, а панель истории показывает, что именно
преподаватель добавил или исправил по сравнению с предыдущей.
• Читайте архив офлайн — интерфейс никогда не обращается к Preply.
• Печатайте в PDF или экспортируйте автономный HTML-файл.
• Ищите по всему классу, не думая о диакритике и регистре: наберите «slonce» и
найдёте «słońce».

Всё остаётся в вашем браузере. Без аккаунта, без сервера, без слежки.

Неофициальный инструмент, не связанный с Preply.

### Polski

**Short**
Archiwizuj strony Canvas z lekcji Preply i czytaj je offline, kiedy tylko chcesz.

**Long**
Preply pozwala otworzyć Canvas lekcji tylko w trakcie zajęć, nigdy później. To
rozszerzenie go zapisuje, żeby twoje notatki pozostały twoje.

• Jedno kliknięcie przycisku archiwizacji na pasku Canvas zapisuje stronę.
Automatyczny zapis następuje też minutę po ostatniej zmianie.
• Zachowywana jest każda wersja, a panel historii pokazuje dokładnie, co
nauczyciel dodał lub poprawił od poprzedniej.
• Czytaj archiwum offline, w interfejsie, który nigdy nie łączy się z Preply.
• Drukuj do PDF albo eksportuj samodzielny plik HTML.
• Szukaj w całej klasie, nie przejmując się znakami diakrytycznymi ani
wielkością liter: wpisz „slonce” i znajdź „słońce”.

Wszystko zostaje w twojej przeglądarce. Bez konta, bez serwera, bez śledzenia.

Narzędzie nieoficjalne, niepowiązane z Preply.

### 中文（简体）

**Short**
归档 Preply 课程的 Canvas 页面，随时离线查看。

**Long**
Preply 只允许在上课期间打开课程的 Canvas，课后就无法访问。这个扩展会把它保存下来，
让你的笔记真正属于你。

• 点击 Canvas 工具栏上的归档按钮即可保存当前页面。最后一次修改一分钟后也会自动保存。
• 每个版本都会保留，历史面板会清楚显示老师相比上一版新增或修改了什么。
• 离线阅读你的归档，界面从不连接 Preply。
• 打印为 PDF，或导出独立的 HTML 文件。
• 在整个课堂中搜索，无需在意变音符号和大小写：输入「slonce」即可找到「słońce」。

一切都保存在你的浏览器中。无需账号，没有服务器，不做任何追踪。

非官方工具，与 Preply 无关联。

---

## Chrome Web Store and Edge — Privacy practices

Chrome asks for each of these as a separate field, where AMO inferred them from
the reviewer notes. Partner Center asks the same set again on its **Privacy**
page: single purpose, one justification per permission, remote code, data usage
certification, privacy policy URL. Kept here so all three stores answer
identically.

Edge additionally requires a **Privacy Policy URL**, which Chrome leaves
optional for an extension collecting nothing:
https://github.com/Mars073/Preply-canvas-archiver/blob/master/PRIVACY.md

### Single purpose description

Preply only lets a student open a lesson's Canvas — the shared notes document —
while the lesson is running. This extension saves a copy of that Canvas page to
local browser storage and shows it again afterwards. That is its only function.
It does nothing on any site other than preply.com.

### Host permission justification — https://preply.com/*

The extension reads the Canvas document of a Preply lesson page the user is
already viewing, so it can save a copy, and it fetches the images displayed on
that page so they can be stored inline. Preply serves those images from
presigned URLs that expire, so an archive that merely linked to them would break
within days. No other host is requested and the extension runs on no other site.

### storage justification

Saved Canvas pages, their successive versions, the page order within a
classroom, the tutor avatars and the user's display preferences are all kept in
local extension storage. None of it is transmitted anywhere.

### unlimitedStorage justification

One lesson accumulates dozens of whole HTML versions over months, each carrying
its images inline. The default quota would silently truncate the user's archive
once it filled — which is precisely the loss this extension exists to prevent.
Snapshots are stored whole and independent by design, so the archive grows
rather than being compacted into fragile delta chains.

### Remote code

**No, I am not using remote code.** Every line of JavaScript that runs ships
inside the package. There is no bundler, no CDN, no eval, no remotely hosted
script and no inline script; viewer.html loads five local files. The images
fetched from preply.com are data, not code: they are inlined as `data:` URIs and
never executed. The extension declares no `content_security_policy`, so the
default MV3 policy (`script-src 'self'`) applies unchanged.

### Data usage certification

No user data is collected, transmitted or sold, so none of the data categories
apply. Everything the extension writes stays in `storage.local` on the user's
own machine. Certify all three clauses.

### Test instructions

No account is needed to review this extension, and none can be supplied for the
part that needs one — see below.

WHAT CAN BE TESTED WITHOUT AN ACCOUNT
Click the toolbar icon. It opens the archive viewer in a new tab (there is no
popup). With nothing archived yet it shows its empty state, which confirms the
service worker starts, the page loads and the interface is localised — the
extension ships English, French, Spanish, Russian, Polish and Chinese.
On any site other than preply.com the extension does nothing at all: no script
runs, no storage is written.

WHAT CANNOT BE TESTED, AND WHY
The archive button is injected into the toolbar of a Preply lesson Canvas. That
page only exists while a paid lesson is in progress, on the account that booked
it. We cannot provide credentials: the lesson is a private conversation with a
real tutor, and sharing the account would breach Preply's own terms.

The full source is public if you would rather read the capture path than run it:
https://github.com/Mars073/Preply-canvas-archiver — content.js injects the
button and builds the snapshot, background.js is the sole writer to
storage.local, viewer.js renders it back. Screenshots of the populated viewer
are on the listing.
