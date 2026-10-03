export interface FontFaceRule {
  family: string
  style: string
  weight: string
  file: string
  format: string
  unicodeRange: string
}

const FACE_RE = /@font-face\s*\{([^}]*)\}/g
const SRC_RE =
  /^url\(\s*["']?\.\/files\/([\w.-]+\.woff2)["']?\s*\)\s*format\(\s*["']?([\w-]+)["']?\s*\)$/

function property(body: string, name: string): string {
  const value = body
    .match(new RegExp(`(?:^|[;\\s])${name}\\s*:\\s*([^;]+);`))?.[1]
    ?.trim()
  if (!value) throw new Error(`font-faces: an @font-face has no ${name}`)
  return value
}

/** The faces a fontsource stylesheet declares; each must load one packaged woff2 file. */
export function parseFontFaces(css: string): FontFaceRule[] {
  return [...css.matchAll(FACE_RE)].map(([, body = ""]) => {
    const src = property(body, "src")
    const [, file, format] = src.match(SRC_RE) ?? []
    if (!file || !format) {
      throw new Error(`font-faces: unexpected @font-face src: ${src}`)
    }
    return {
      family: property(body, "font-family").replace(/^["']|["']$/g, ""),
      style: property(body, "font-style"),
      weight: property(body, "font-weight"),
      file,
      format,
      unicodeRange: property(body, "unicode-range"),
    }
  })
}

/** `@font-face` rules that load each face from `./fonts/` beside the stylesheet. */
export function fontFaceCss(faces: readonly FontFaceRule[]): string {
  return faces
    .map((face) =>
      [
        "@font-face {",
        `  font-family: "${face.family}";`,
        `  font-style: ${face.style};`,
        "  font-display: swap;",
        `  font-weight: ${face.weight};`,
        `  src: url(./fonts/${face.file}) format("${face.format}");`,
        `  unicode-range: ${face.unicodeRange};`,
        "}\n",
      ].join("\n"),
    )
    .join("\n")
}
