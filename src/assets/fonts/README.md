# Bundled fonts

Fonts are served with `next/font/local`, so production builds do not fetch Google Fonts. This avoids the intermittent extensionless font URL issue tracked at https://github.com/vercel/next.js/issues/99114.

Sources: https://github.com/google/fonts, downloaded 2026-10-30. The corresponding SIL Open Font License files are included unchanged.

| Asset | Upstream path | Upstream Git blob |
| --- | --- | --- |
| inter.woff2 | ofl/inter/Inter[opsz,wght].ttf | 047c92f6e2212473dc436020afed689527076d44 |
| manrope.woff2 | ofl/manrope/Manrope[wght].ttf | 75274da58537d6123b14f2cd0c355ad4681fc2b3 |
| cormorant-normal.woff2 | ofl/cormorantgaramond/CormorantGaramond[wght].ttf | d992a83ce525c330fad3a19087746bcb2dc038ee |
| cormorant-italic.woff2 | ofl/cormorantgaramond/CormorantGaramond-Italic[wght].ttf | 0d914e7663b7a1429d06ec60a5c5bb026031a2ef |
| playfair.ttf | ofl/playfairdisplay/PlayfairDisplay[wght].ttf | 7a09eb71f10622fd083134ac9ed46f59b21bee18 |

Playfair Display is the unmodified upstream binary, retaining its reserved font name. The other four files are Latin/Latin-extended WOFF2 subsets, including Turkish characters and currency symbols. Their upstream licenses declare no reserved font names. Variable weights, layout features and font name/license metadata are retained.

Generated once with FontTools 4.60.1 (not a server/runtime dependency):

```sh
pyftsubset SOURCE.ttf --output-file=OUTPUT.woff2 --flavor=woff2 --unicodes='U+0000-024F,U+1E00-1EFF,U+2000-206F,U+20A0-20CF,U+2100-214F,U+2190-21FF,U+2212,U+FEFF,U+FFFD' --layout-features='*' --name-IDs='*' --name-legacy --name-languages='*' --notdef-glyph --notdef-outline --recommended-glyphs
```

Commit these binaries and their licenses with the application. No font download or Python installation is needed during deployment.
