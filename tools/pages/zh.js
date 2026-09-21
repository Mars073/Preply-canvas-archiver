/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

'use strict';

module.exports = {
  path: 'zh/',
  hreflang: 'zh-Hans',
  ogLocale: 'zh_CN',
  label: '简体中文',

  title: '导出并保存 Preply Canvas 课堂笔记 — Preply Canvas Archiver',
  description: '趁还能访问时保存你的 Preply Canvas 课堂笔记：离线查看，打印为 PDF 或导出为 HTML。免费浏览器扩展。',
  ogTitle: '导出并保存你的 Preply Canvas 课堂笔记',
  ogDescription: '趁还能访问时为 Preply Canvas 保存一份本地副本：离线查看、打印为 PDF、导出保存。',
  ogImageAlt: '归档阅读界面：一个课堂的页面列表和一页已归档的 Preply Canvas。',
  ldDescription: '将 Preply 课程的 Canvas 页面保存在本地的浏览器扩展，可离线查看、打印为 PDF 或导出为 HTML，并保留每个版本。',

  skip: '跳到内容',
  navLabel: '语言',

  h1: '导出并保存你的 <em>Preply Canvas</em> 课堂笔记',
  sub: '你的 Canvas 也许还留在 Preply 上，但要再找到它就是另一回事了。趁还能访问时保存一份本地副本，之后可以离线查看、打印为 PDF 或导出保存。',
  addChrome: '添加到 Chrome',
  addFirefox: '添加到 Firefox',
  addEdge: '添加到 MS Edge',
  shotAlt: '归档阅读界面：左侧是课堂的页面列表，右侧是已归档的文档，上方有缩放、历史记录和打印按钮。',
  shotCap: '每位老师一个课堂。每个页面只列出一次，它的所有版本都保留在后面。',

  how: {
    h2: '趁还能访问，保存你的 Preply Canvas。',
    p: '上课时，Preply Canvas Archiver 会在 Canvas 工具栏上添加一个归档按钮。点一下，页面就保存到你的浏览器里。忘了也没关系：你打开或编辑过的每个页面，在一分钟没有变化后都会自动保存。旁边还有一个打印按钮，下课前就能拿到 PDF。',
    shotAlt: 'Preply Canvas 工具栏右侧多了两个按钮，分别是打印和归档，用粉色框标出，并标注 Extra buttons。',
    cap: '扩展在 Preply 中添加的全部内容，样式沿用原有按钮。',
  },

  read: {
    h2: '课堂笔记：离线查看，PDF 或 HTML。',
    p1: '随时点击扩展图标打开归档，没有网络也可以：内容从浏览器中读取，从不连接 Preply。每个页面的所有版本都会保留，历史记录会显示老师相比上一版新增或修改了什么。',
    p2: '任何页面都能打印成整洁的 PDF，或导出为单个 HTML 文件，方便保存、备份或发送。搜索覆盖整个课堂，不区分变音符号和大小写。',
  },

  privacy: {
    h2: '数据不会离开你的浏览器。',
    p1: '<strong>没有服务器、没有账号、没有统计分析</strong>，根本没有可以发送数据的地方。所有内容都保存在你电脑的本地存储中，卸载扩展即全部删除。',
    p2: '它只会在你已经打开的 Preply 课程页面上发出网络请求，用来复制 Canvas 中的图片。',
  },

  faq: {
    h2: '常见问题',
    items: [
      {
        q: '如何导出 Preply Canvas？',
        a: '安装扩展后，在 Preply 上打开课程的 Canvas。点击 Canvas 工具栏右侧的归档按钮，或者让它自动保存。之后点击扩展图标打开归档，选择<strong>打印 / PDF</strong>，或在 ⋯ 菜单中选择<strong>导出为 HTML</strong>。',
      },
      {
        q: '可以下载 Preply Canvas 笔记吗？',
        a: '可以。每个已归档的页面都能导出为包含图片的独立 HTML 文件，也可以在打印对话框中保存为 PDF。',
      },
      {
        q: '下课后怎么查看 Preply Canvas？',
        a: '安装扩展期间保存的页面都会留在归档里，随时点击扩展图标就能打开。没有在安装扩展后打开过的页面无法找回。',
      },
      {
        q: '可以把 Preply Canvas 保存为 PDF 吗？',
        a: '可以，有两个入口：上课时扩展在 Canvas 工具栏添加的打印按钮，以及归档中的<strong>打印 / PDF</strong>。在浏览器的打印对话框中选择“另存为 PDF”即可。',
      },
      {
        q: '可以离线查看 Preply 笔记吗？',
        a: '可以。归档保存在浏览器中，阅读界面从不联网，没有网络也能打开笔记。',
      },
      {
        q: '我的笔记保存在哪里？',
        a: '只保存在你电脑上浏览器的本地存储中，不会上传到任何地方。卸载扩展会删除归档，所以请先导出想保留的页面。',
      },
    ],
  },

  hard: {
    h2: '真正困难的部分。',
    items: [
      {
        h3: '版本完整独立',
        p: '每次保存都完整、独立地存储，而不是一串差异记录。某个文件损坏只会损失一个版本，不会牵连之前的历史。',
      },
      {
        h3: '懂波兰语的搜索',
        p: '在整个课堂中搜索时忽略变音符号和大小写，而 <code>ł</code> 是任何规范化都无法分解的字母。输入 <code>slonce</code>，就能找到 <code>słońce</code>。',
      },
      {
        h3: '换行位置与课上一致',
        p: '阅读界面还原了 Preply 编辑器的宽度、字号和字体，归档页面的换行与上课时完全相同。',
      },
      {
        h3: '图片不会失效',
        p: 'Preply 通过会过期的链接提供图片。保存页面时会把图片一并复制下来，否则归档会悄悄损坏。',
      },
    ],
  },

  source: {
    h2: '从源代码运行。',
    intro: '三个扩展商店是主要的安装途径，这里是另一条路：阅读代码、修改代码，或在商店上架之前运行 <code>master</code> 上的版本。商店审核要几天，分支则随时可用。',
    firefox: '<code>about:debugging</code> → 此 Firefox → 临时载入附加组件… → 选择 <code>src/manifest.json</code>。重启 Firefox 后会消失：永久安装需要签名。',
    chromeTitle: 'Chrome 和 Edge',
    chrome: '运行 <code>bash tools/package.sh</code>，然后打开 <code>chrome://extensions</code>（或 <code>edge://extensions</code>）→ 开发者模式 → 加载已解压的扩展程序 → 选择 <code>dist/chrome/</code>',
    noBuild: '没有构建步骤、没有打包工具、没有压缩：<code>src/</code> 就是发布的内容。你读到的代码就是运行的代码。',
    past: '只有在安装扩展后打开过的页面才能被保存，已经结束的课程无法找回。',
  },

  thanks: {
    h2: '致谢。',
    p: '感谢 Paula，我的波兰语老师，也是 sękacz（波兰树桩蛋糕）的权威；也感谢 Shuang 老师，我的中文老师。这个工具就是为了留住两位老师教给我的东西。',
  },

  footer: {
    source: '源代码',
    privacy: '隐私',
    icons: '图标来自 <a href="https://phosphoricons.com">Phosphor</a>',
    disclaimer: '非官方工具，与 Preply 无关联。Preply 是其所有者的商标。',
  },
};
