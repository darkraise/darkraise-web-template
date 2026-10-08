import { execFile } from "node:child_process"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

// Vitest runs from packages/ui.
const SCRIPT = resolve("scripts/check-client-banner.mjs")
const BANNER = '"use client";\n'

interface Run {
  code: number
  stdout: string
  stderr: string
}

let root = ""

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "client-banner-"))
})

afterEach(() => {
  rmSync(root, { recursive: true, force: true })
})

function check(dist: string): Promise<Run> {
  return new Promise((done) => {
    execFile(
      process.execPath,
      [SCRIPT],
      { env: { ...process.env, DIST: dist }, timeout: 30_000 },
      (error, stdout, stderr) => {
        const code =
          error === null ? 0 : typeof error.code === "number" ? error.code : -1
        done({ code, stdout, stderr })
      },
    )
  })
}

/** A dist holding one client entry, `index.js`, and its source map. */
function writeDist(code: string, mappings: string): string {
  const dist = join(root, "dist")
  mkdirSync(dist)
  writeFileSync(join(dist, "index.js"), code)
  writeFileSync(
    join(dist, "index.js.map"),
    JSON.stringify({ version: 3, sources: ["index.ts"], names: [], mappings }),
  )
  return dist
}

describe("check-client-banner", () => {
  it("accepts a client entry whose map is shifted by the banner", async () => {
    const dist = writeDist(`${BANNER}export const a = 1\n`, ";AAAA")
    const run = await check(dist)
    expect(run.stderr).toBe("")
    expect(run.stdout).toContain("check-client-banner: 1 entries ok")
    expect(run.code).toBe(0)
  })

  it("rejects a client entry map the banner did not shift", async () => {
    const dist = writeDist(`${BANNER}export const a = 1\n`, "AAAA")
    const run = await check(dist)
    expect(run.code).toBe(1)
    expect(run.stderr).toContain(
      'dist/index.js.map: mappings do not start with ";"',
    )
  })

  it("rejects a client entry map with more lines than the file", async () => {
    const dist = writeDist(`${BANNER}export const a = 1\n`, ";;;AAAA")
    const run = await check(dist)
    expect(run.code).toBe(1)
    expect(run.stderr).toContain(
      "dist/index.js.map: mappings cover 4 lines but the file has 3",
    )
  })

  it("names a missing dist the way it names an empty one", async () => {
    const empty = join(root, "empty")
    mkdirSync(empty)
    const message = "dist: no entry files found; run the build first"
    for (const dist of [empty, join(root, "missing")]) {
      const run = await check(dist)
      expect(run.code).toBe(1)
      expect(run.stderr.trim()).toBe(message)
    }
  })
})
