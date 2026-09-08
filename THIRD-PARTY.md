# Third-party notices

This extension redistributes work from the projects below. Their licence terms
travel with it.

## Phosphor Icons

Every icon in the interface comes from Phosphor Icons. The SVG sources live in
`assets/phosphor/`, and their path data is embedded verbatim into the generated
`src/icons.js`, which ships inside both packages. That embedding is a
substantial portion of the work, so the MIT notice below is required — a
mention in the README would not be enough on its own.

<https://phosphoricons.com> · <https://github.com/phosphor-icons/core>

```
MIT License

Copyright (c) 2023 Phosphor Icons

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Figtree

The viewer's stylesheet asks for Figtree, the typeface Preply's editor renders
in, so an archived page keeps the proportions of the original.

The font is bundled: `src/fonts/Figtree-variable.woff2` and its italic
counterpart, converted to woff2 from the variable TTFs published on Google
Fonts. Redistribution therefore takes place, and the SIL Open Font License 1.1
requires its full text to travel with the font files — `src/fonts/OFL.txt`
does exactly that, inside every package.

```
Copyright 2022 The Figtree Project Authors
(https://github.com/erikdkennedy/figtree)

This Font Software is licensed under the SIL Open Font License, Version 1.1.
Full text in src/fonts/OFL.txt, shipped alongside the fonts.
```

<https://fonts.google.com/specimen/Figtree>

## Preply

Not a dependency. Preply is a third-party service this extension reads from;
its name is a trademark of its owner, and this project is neither affiliated
with nor endorsed by it.
