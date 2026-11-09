import localFont from "next/font/local";

const onestLatin = localFont({
  src: "../../public/fonts/onest/latin-normal.woff2",
  weight: "100 900",
  variable: "--font-onest-latin",
  adjustFontFallback: false,
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD",
    },
  ],
});

const onestCyrillic = localFont({
  src: "../../public/fonts/onest/cyrillic-normal.woff2",
  weight: "100 900",
  variable: "--font-onest-cyrillic",
  adjustFontFallback: false,
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116" }],
});

const monoLatin = localFont({
  src: [
    { path: "../../public/fonts/jetbrains-mono/latin-normal.woff2", style: "normal" },
    { path: "../../public/fonts/jetbrains-mono/latin-italic.woff2", style: "italic" },
  ],
  weight: "100 800",
  variable: "--font-mono-latin",
  adjustFontFallback: false,
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD",
    },
  ],
});

const monoCyrillic = localFont({
  src: [
    { path: "../../public/fonts/jetbrains-mono/cyrillic-normal.woff2", style: "normal" },
    { path: "../../public/fonts/jetbrains-mono/cyrillic-italic.woff2", style: "italic" },
  ],
  weight: "100 800",
  variable: "--font-mono-cyrillic",
  adjustFontFallback: false,
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116" }],
});

export const fontVariables = [
  onestLatin.variable,
  onestCyrillic.variable,
  monoLatin.variable,
  monoCyrillic.variable,
].join(" ");
