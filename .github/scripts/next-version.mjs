#!/usr/bin/env node
// Derives the next release version from the commits since the last v* tag:
// any `feat` makes it a minor, anything else a patch.
//
// darkraise-ui and create-darkraise-ui share one version line, so commits to
// either package count, and packages/ui carries the number for both.
//
// A breaking marker is a hard stop rather than a major bump. Breaking changes
// in this package have historically been argued in the CHANGELOG rather than
// declared in a commit footer, so inferring a major from commit text would
// understate some releases and overstate others. Majors are released by
// tagging deliberately.
//
// Writes `version`, `bump`, `previous` and `skip` to $GITHUB_OUTPUT when set,
// and a human summary to stderr.

import { execFileSync } from "node:child_process"
import { appendFileSync, readFileSync } from "node:fs"

const PKG = "packages/ui/package.json"
const PKG_PATHS = ["packages/ui", "create-app"]
const TAG_PREFIX = "v"

const log = (msg) => process.stderr.write(`${msg}\n`)

function fail(msg) {
  log(`[31merror[0m ${msg}`)
  process.exit(1)
}

function output(pairs) {
  const file = process.env.GITHUB_OUTPUT
  const body = Object.entries(pairs)
    .map(([k, v]) => `${k}=${v}`)
    .join("\n")
  if (file) appendFileSync(file, `${body}\n`)
  log(body)
}

function git(...args) {
  return execFileSync("git", args, { encoding: "utf8" })
}

function lastTag() {
  const tags = git(
    "tag",
    "--list",
    `${TAG_PREFIX}*`,
    "--sort=-v:refname",
  ).trim()
  return tags ? tags.split("\n")[0].trim() : null
}

function commitsSince(tag) {
  // NUL-separated so a multi-line body stays one commit.
  const range = tag ? `${tag}..HEAD` : "HEAD"
  const out = git("log", range, "--format=%B%x00", "--", ...PKG_PATHS)
  return out
    .split("\0")
    .map((c) => c.trim())
    .filter(Boolean)
}

const BREAKING_SUBJECT = /^[a-z]+(\([^)]*\))?!:/
const BREAKING_FOOTER = /^BREAKING[ -]CHANGE:/m
const FEATURE_SUBJECT = /^feat(\([^)]*\))?:/

const tag = lastTag()
if (!tag) {
  // Without a baseline the range would be the whole history, which reaches
  // breaking markers from releases that shipped long ago and trips the check
  // below with advice that makes no sense. Ask for the baseline instead.
  const current = JSON.parse(readFileSync(PKG, "utf8")).version
  fail(
    `no ${TAG_PREFIX}* tag exists, so there is no range to derive a version from.\n\n` +
      `Tag the current release point once, then push it:\n` +
      `  git tag ${TAG_PREFIX}${current} && git push origin ${TAG_PREFIX}${current}\n\n` +
      `That releases ${current} and gives every later run a baseline.`,
  )
}

const commits = commitsSince(tag)
if (commits.length === 0) {
  log(
    `no commits touch ${PKG_PATHS.join(" or ")} since ${tag ?? "the start of history"}`,
  )
  output({ skip: "true" })
  process.exit(0)
}

const breaking = commits.filter(
  (c) => BREAKING_SUBJECT.test(c.split("\n")[0]) || BREAKING_FOOTER.test(c),
)
if (breaking.length > 0) {
  const subjects = breaking.map((c) => `  - ${c.split("\n")[0]}`).join("\n")
  fail(
    `${breaking.length} commit(s) declare a breaking change:\n${subjects}\n\n` +
      `This workflow never publishes a major on its own. Decide the version, ` +
      `then release it by tagging: git tag ${TAG_PREFIX}<major>.0.0 && git push origin ${TAG_PREFIX}<major>.0.0`,
  )
}

const previous = JSON.parse(readFileSync(PKG, "utf8")).version
const parsed = /^(\d+)\.(\d+)\.(\d+)$/.exec(previous)
if (!parsed) {
  fail(`${PKG} is at "${previous}"; expected a plain major.minor.patch version`)
}

const [, major, minor, patch] = parsed.map(Number)
const bump = commits.some((c) => FEATURE_SUBJECT.test(c.split("\n")[0]))
  ? "minor"
  : "patch"
const version =
  bump === "minor"
    ? `${major}.${minor + 1}.0`
    : `${major}.${minor}.${patch + 1}`

log(
  `${commits.length} commit(s) since ${tag ?? "the start of history"} → ${bump}`,
)
output({ version, bump, previous, skip: "false" })
