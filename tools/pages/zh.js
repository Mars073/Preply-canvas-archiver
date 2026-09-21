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
  description: '趁还能访问，把 Preply Canvas 课堂笔记保存到本地：可以离线查看，也能打印成 PDF 或导出为 HTML。免费浏览器扩展。',
  ogTitle: '导出并保存你的 Preply Canvas 课堂笔记',
  ogDescription: '趁还能访问，给你的 Preply Canvas 留一份本地副本：离线查看、打印成 PDF 或导出都可以。',
  ogImageAlt: 'Preply 课堂的归档，以及一页已保存的 Canvas。',
  ldDescription: '一款浏览器扩展，把 Preply 课程的 Canvas 页面保存到本地，方便离线查看、打印成 PDF 或导出为 HTML，并保留所有版本。',

  skip: '跳到正文',
  navLabel: '语言',

  h1: '导出并保存你的 <em>Preply Canvas</em> 课堂笔记',
  sub: '你的 Canvas 也许还在 Preply 的某个角落，可要再找到它就难说了。趁还能访问，先存一份本地副本：之后离线查看、打印成 PDF 或导出都可以。',
  addChrome: '添加到 Chrome',
  addFirefox: '添加到 Firefox',
  addEdge: '添加到 MS Edge',
  shotAlt: '归档界面：左边是一个课堂的页面列表，右边是已保存的页面，上方有缩放、历史记录和打印按钮。',
  shotCap: '每位老师一个课堂，每个页面只列一次，所有版本随时可查。',

  how: {
    h2: '趁还能访问，保存你的 Preply Canvas',
    p: '上课时，Preply Canvas Archiver 会在 Canvas 工具栏上加一个归档按钮，点一下就能把当前页面保存到浏览器里。就算忘了也不要紧：你打开或编辑过的页面，只要一分钟内没有变化，就会自动保存。旁边还有一个打印按钮，下课前就能导出 PDF。',
    shotAlt: 'Preply 的 Canvas 工具栏右侧多了两个按钮（打印和归档），用粉色框圈出，标注为“Extra buttons”。',
    cap: '扩展在 Preply 里加的就只有这些，样式和原有按钮保持一致。',
  },

  read: {
    h2: '课堂笔记随时看：离线、PDF 或 HTML',
    p1: '随时点击扩展图标就能打开归档，没网也没关系：所有内容都存在浏览器里，完全不需要连接 Preply。每个页面的每个版本都会保留，历史记录里能看到老师每次新增或修改了什么。',
    p2: '任何页面都可以打印成干净的 PDF，或导出成一个 HTML 文件，方便保存、备份或分享。搜索覆盖整个课堂，不区分变音符号和大小写。',
  },

  privacy: {
    h2: '数据不出浏览器',
    p1: '<strong>没有服务器、没有账号、没有统计分析</strong>，你的数据根本无处可传。所有内容都留在你的电脑上，卸载扩展就会全部删除。',
    p2: '扩展只会在你已经打开的 Preply 课程页面上联网，用来复制 Canvas 里的图片。',
  },

  faq: {
    h2: '常见问题',
    items: [
      {
        q: '怎样导出 Preply Canvas？',
        a: '安装扩展后，在 Preply 上打开课程的 Canvas。点击 Canvas 工具栏右侧的归档按钮，或者交给自动保存。然后点击扩展图标打开归档，选择<strong>打印 / PDF</strong>，或在 ⋯ 菜单里选择<strong>导出为 HTML</strong>。',
      },
      {
        q: '能下载 Preply Canvas 的笔记吗？',
        a: '可以。每个归档页面都能导出为带图片的独立 HTML 文件，也可以在打印对话框里保存为 PDF。',
      },
      {
        q: '下课后还能看 Preply Canvas 吗？',
        a: '安装扩展期间保存的页面都会留在归档里，点一下扩展图标就能打开。不过，从未在安装扩展后打开过的页面是找不回来的。',
      },
      {
        q: '能把 Preply Canvas 保存成 PDF 吗？',
        a: '可以，有两种方式：上课时用 Canvas 工具栏上新增的打印按钮，或者在归档里点<strong>打印 / PDF</strong>。在浏览器的打印对话框里选“另存为 PDF”即可。',
      },
      {
        q: '可以离线看 Preply 笔记吗？',
        a: '可以。归档保存在浏览器里，从不联网，没有网络也能打开笔记。',
      },
      {
        q: '我的笔记存在哪里？',
        a: '只存在你电脑上浏览器的本地存储里，不会上传到任何地方。注意：卸载扩展会删除归档，请先导出想保留的页面。',
      },
    ],
  },

  hard: {
    h2: '真正的技术难点',
    items: [
      {
        h3: '每个版本都完整保存',
        p: '每次保存都是完整、独立的一份，而不是一串修改记录。就算某个文件损坏，也只丢一个版本，不会影响整个历史。',
      },
      {
        h3: '懂波兰语的搜索',
        p: '在整个课堂里搜索时忽略变音符号和大小写，连 Unicode 规范化都拆不开的 <code>ł</code> 也能处理。输入 <code>slonce</code>，就能找到 <code>słońce</code>。',
      },
      {
        h3: '版式和原来一样',
        p: '归档还原了 Preply 编辑器的宽度、字号和字体，换行位置和上课时一模一样。',
      },
      {
        h3: '图片不会丢',
        p: 'Preply 的图片链接会过期。扩展在保存时就把图片复制下来，否则归档里的图片会慢慢失效。',
      },
    ],
  },

  source: {
    h2: '从源代码安装',
    intro: '最简单的方式是从浏览器的扩展商店安装。如果你想读代码、改代码，或者在发布前试用 <code>master</code> 上的版本，也可以自己加载扩展，不用等商店好几天的审核。',
    firefox: '打开 <code>about:debugging</code>，进入“此 Firefox”→“临时载入附加组件…”，选择 <code>src/manifest.json</code>。重启 Firefox 后扩展会消失：只有签名过的扩展才能长期安装。',
    chromeTitle: 'Chrome 和 Edge',
    chrome: '运行 <code>bash tools/package.sh</code>，打开 <code>chrome://extensions</code>（或 <code>edge://extensions</code>），开启“开发者模式”，点击“加载已解压的扩展程序”，选择 <code>dist/chrome/</code> 文件夹。',
    noBuild: '没有构建，也没有压缩：<code>src/</code> 文件夹就是发布的内容。你看到的代码，就是实际运行的代码。',
    past: '扩展只能保存安装之后打开的页面，之前的课程无法找回。',
  },

  thanks: {
    h2: '致谢',
    p: '感谢 Paula 的波兰语课，以及关于 sękacz（波兰树桩蛋糕）的无数知识；也感谢 Shuang 老师的中文课。做这个工具，就是为了留住我在这些课上学到的东西。',
  },

  footer: {
    source: '源代码',
    privacy: '隐私',
    icons: '图标：<a href="https://phosphoricons.com">Phosphor</a>',
    disclaimer: '非官方工具，与 Preply 无关。Preply 是其所有者的商标。',
  },
};
