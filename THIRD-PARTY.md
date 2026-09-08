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

**The font file is not currently bundled**: `src/fonts/` does not exist and the
`@font-face` rule falls back to a system font. No redistribution therefore takes
place, and no notice is owed yet.

That changes the moment a `.woff2` is added to the package. Figtree is published
under the SIL Open Font License 1.1 (`ofl/figtree` in `google/fonts`), which
requires the full licence text to travel with the font file. Add `OFL.txt`
alongside it and extend this file at the same time.

<https://fonts.google.com/specimen/Figtree>

## Preply

Not a dependency. Preply is a third-party service this extension reads from;
its name is a trademark of its owner, and this project is neither affiliated
with nor endorsed by it.
