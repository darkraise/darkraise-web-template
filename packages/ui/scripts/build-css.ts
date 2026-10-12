import {
  copyFileSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { createRequire } from "node:module"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { fontFaceCss, parseFontFaces, type FontFaceRule } from "./font-faces"

const thisFile = fileURLToPath(import.meta.url)
const packageRoot = resolve(dirname(thisFile), "..")
export const themePath = resolve(packageRoot, "src/styles/theme.css")
const outPath = resolve(packageRoot, "dist/styles.css")
const fontsOutDir = resolve(packageRoot, "dist/fonts")

/** `@fontsource-variable/<name>` packages whose faces ship in `dist/fonts/`. */
export const FONT_PACKAGES = [
  "inter",
  "geist",
  "ibm-plex-sans",
  "jetbrains-mono",
  "newsreader",
] as const

export interface FontPackage {
  name: (typeof FONT_PACKAGES)[number]
  dir: string
  faces: FontFaceRule[]
}

const requireFromHere = createRequire(import.meta.url)

const RELATIVE_IMPORT_RE = /^@import\s+"((?:\.\.?\/)[^"]+)";\s*$/gm

function inlineRelativeImports(
  source: string,
  fromPath: string,
  seen: ReadonlySet<string> = new Set(),
): string {
  if (seen.has(fromPath)) {
    throw new Error(`CSS import cycle detected: ${fromPath}`)
  }
  const nextSeen = new Set(seen).add(fromPath)
  return source.replace(RELATIVE_IMPORT_RE, (_, importPath: string) => {
    const resolved = resolve(dirname(fromPath), importPath)
    const child = readFileSync(resolved, "utf8")
    return inlineRelativeImports(child, resolved, nextSeen)
  })
}

const ABSOLUTE_IMPORT_RE = /@import\s+(?:url\(\s*)?["']?https?:/
const ABSOLUTE_URL_RE = /url\(\s*["']?(?:https?:)?\/\//i

export function assertFirstParty(css: string): void {
  if (ABSOLUTE_IMPORT_RE.test(css)) {
    throw new Error(
      "build-css: an absolute @import reached the bundle. Consumers must not " +
        "make third-party requests at stylesheet load time.",
    )
  }
  const absolute = css.match(ABSOLUTE_URL_RE)
  if (absolute) {
    throw new Error(
      `build-css: an absolute url() reached the bundle (${absolute[0]}…). ` +
        "Consumers must not make third-party requests at stylesheet load time.",
    )
  }
}

export function readFontPackages(): FontPackage[] {
  return FONT_PACKAGES.map((name) => {
    const dir = dirname(
      requireFromHere.resolve(`@fontsource-variable/${name}/package.json`),
    )
    const faces = parseFontFaces(
      readFileSync(resolve(dir, "index.css"), "utf8"),
    ).filter(
      (face) =>
        face.style === "normal" && face.file.endsWith("-wght-normal.woff2"),
    )
    if (faces.length === 0) {
      throw new Error(
        `build-css: @fontsource-variable/${name} declares no wght-normal face`,
      )
    }
    return { name, dir, faces }
  })
}

export function buildStylesheet(
  fonts: readonly FontPackage[] = readFontPackages(),
): string {
  const theme = readFileSync(themePath, "utf8")
  const flat = inlineRelativeImports(theme, themePath)
  const css = `${flat.trimEnd()}\n\n${fontFaceCss(fonts.flatMap((font) => font.faces))}`
  assertFirstParty(css)
  return css
}

function copyFonts(fonts: readonly FontPackage[]) {
  rmSync(fontsOutDir, { recursive: true, force: true })
  mkdirSync(fontsOutDir, { recursive: true })
  for (const font of fonts) {
    for (const face of font.faces) {
      copyFileSync(
        resolve(font.dir, "files", face.file),
        resolve(fontsOutDir, face.file),
      )
    }
    copyFileSync(
      resolve(font.dir, "LICENSE"),
      resolve(fontsOutDir, `${font.name}-LICENSE`),
    )
  }
}

function main() {
  const fonts = readFontPackages()
  const css = buildStylesheet(fonts)
  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, css)
  copyFonts(fonts)
  const faceCount = fonts.reduce((count, font) => count + font.faces.length, 0)
  console.log(
    `[build-css] wrote ${outPath} (${css.length} bytes) and ${faceCount} font files to ${fontsOutDir}`,
  )
}

if (process.argv[1] && resolve(process.argv[1]) === thisFile) {
  main()
}
