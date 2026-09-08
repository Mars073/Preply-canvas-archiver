# Store listing copy

Text to paste into the AMO and Chrome Web Store submission forms. Kept in the
repository so the wording stays consistent between the two stores and across
versions — it is submission material, not documentation of the code.

Short descriptions are held under **132 characters**, the Chrome Web Store
limit; AMO allows 250 but there is no reason to diverge.

Screenshots live in `screenshots/`. The `store-` prefixed files are 1280x800,
the size the Chrome Web Store expects; AMO accepts the originals as they are.

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

### Data handling

No user data is collected, transmitted or sold. The extension has no server and
no analytics. Everything it writes stays in the browser's local storage on the
user's own machine. The only outbound requests go to `preply.com` itself, to
download images already displayed on the page being archived.

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
