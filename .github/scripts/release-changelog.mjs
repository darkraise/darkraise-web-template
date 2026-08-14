#!/usr/bin/env node
// Closes the CHANGELOG's [Unreleased] section under the version being
// released and opens an empty one above it, then writes that section's body
// out as the GitHub Release notes.
//
// Usage: node .github/scripts/release-changelog.mjs <version> [iso-date]

import { appendFileSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

const CHANGELOG = "packages/ui/CHANGELOG.md"
const HEADING = "## [Unreleased]"

const log = (msg) => process.stderr.write(`${msg}\n`)

const [version, dateArg] = process.argv.slice(2)
if (!version) {
  log("usage: release-changelog.mjs <version> [iso-date]")
  process.exit(1)
}
// The runner is UTC; an explicit date keeps a local run reproducible.
const date = dateArg ?? new Date().toISOString().slice(0, 10)

const original = readFileSync(CHANGELOG, "utf8")
const lines = original.split("\n")
const start = lines.findIndex((line) => line.trim() === HEADING)
if (start === -1) {
  log(`no "${HEADING}" heading in ${CHANGELOG}`)
  process.exit(1)
}

// The section runs to the next top-level heading, or to the end of the file.
let end = lines.length
for (let i = start + 1; i < lines.length; i += 1) {
  if (lines[i].startsWith("## ")) {
    end = i
    break
  }
}

const body = lines.slice(start + 1, end).join("\n").trim()
// The em dash matches the existing released headings.
const released = `## [${version}] — ${date}`

const rolled = [
  ...lines.slice(0, start + 1),
  "",
  released,
  "",
  ...(body ? [body, ""] : []),
  ...lines.slice(end),
].join("\n")

writeFileSync(CHANGELOG, rolled)
log(`${CHANGELOG}: [Unreleased] → ${released}`)

const notes = body || `See ${CHANGELOG}.`
const notesFile = join(process.env.RUNNER_TEMP ?? ".", "release-notes.md")
writeFileSync(notesFile, `${notes}\n`)

if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `notes-file=${notesFile}\n`)
}
log(`release notes → ${notesFile} (${notes.length} chars)`)
