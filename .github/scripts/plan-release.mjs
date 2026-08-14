#!/usr/bin/env node
// Plans which packages a run releases, and at which version.
//
// Each package owns its version line and its tag namespace, so a change to
// one never moves the other's number and a release of one never republishes
// the other.
//
// Master mode (no arguments): for each package independently, derive the
// next version from the commits since that package's own last tag — a `feat`
// makes it a minor, anything else a patch. Packages with no new commits are
// left out of the plan entirely.
//
// Tag mode (--tag <name>): release exactly the version the tag names, for
// whichever package owns that tag's prefix.
//
// A breaking marker is a hard stop rather than a major bump. Breaking
// changes here are argued in the CHANGELOG rather than declared in a commit
// footer, so inferring a major from commit text would understate some
// releases. Majors are released by tagging deliberately.
//
// Writes `releases` (a JSON array) and `skip` to $GITHUB_OUTPUT.

import { execFileSync } from "node:child_process"
import { appendFileSync, readFileSync } from "node:fs"

const PACKAGES = [
  { dir: "packages/ui", name: "darkraise-ui", prefix: "ui-v" },
  { dir: "create-app", name: "create-darkraise-ui", prefix: "cli-v" },
]

const log = (msg) => process.stderr.write(`${msg}\n`)
const notice = (msg) => process.stdout.write(`::notice::${msg}\n`)

function fail(msg) {
  log(`error: ${msg}`)
  process.exit(1)
}

function output(pairs) {
  const body = Object.entries(pairs)
    .map(([k, v]) => `${k}=${v}`)
    .join("\n")
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `${body}\n`)
  }
  log(body)
}

const git = (...args) => execFileSync("git", args, { encoding: "utf8" })

function lastTag(prefix) {
  const tags = git("tag", "--list", `${prefix}*`, "--sort=-v:refname").trim()
  return tags ? tags.split("\n")[0].trim() : null
}

function commitsSince(tag, dir) {
  // NUL-separated so a multi-line body stays one commit.
  return git("log", `${tag}..HEAD`, "--format=%B%x00", "--", dir)
    .split("\0")
    .map((c) => c.trim())
    .filter(Boolean)
}

function versionOf(dir) {
  const version = JSON.parse(
    readFileSync(`${dir}/package.json`, "utf8"),
  ).version
  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    fail(`${dir} is at "${version}"; expected a plain major.minor.patch`)
  }
  return version
}

const BREAKING_SUBJECT = /^[a-z]+(\([^)]*\))?!:/
const BREAKING_FOOTER = /^BREAKING[ -]CHANGE:/m
const FEATURE_SUBJECT = /^feat(\([^)]*\))?:/

const tagIndex = process.argv.indexOf("--tag")
const tagArg = tagIndex === -1 ? "" : (process.argv[tagIndex + 1] ?? "")

let releases = []

if (tagArg) {
  const pkg = PACKAGES.find((p) => tagArg.startsWith(p.prefix))
  if (!pkg) {
    fail(
      `tag '${tagArg}' matches no package. Expected one of: ` +
        PACKAGES.map((p) => `${p.prefix}X.Y.Z`).join(", "),
    )
  }
  const version = tagArg.slice(pkg.prefix.length)
  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    fail(`tag '${tagArg}' does not carry a major.minor.patch version`)
  }
  releases = [{ ...pkg, version, tag: tagArg }]
  log(`releasing ${pkg.name} ${version} from tag ${tagArg}`)
} else {
  for (const pkg of PACKAGES) {
    const tag = lastTag(pkg.prefix)
    if (!tag) {
      // Without a baseline the range would be the whole history, which
      // reaches breaking markers from releases that shipped long ago. Ask
      // for the baseline as a notice rather than a failure, so a package
      // that has not started its line yet keeps master green.
      notice(
        `No ${pkg.prefix}* tag exists, so ${pkg.name} has no range to derive from ` +
          `and was not released. Start its line with: ` +
          `git tag ${pkg.prefix}${versionOf(pkg.dir)} && git push origin ${pkg.prefix}${versionOf(pkg.dir)}`,
      )
      continue
    }

    const commits = commitsSince(tag, pkg.dir)
    if (commits.length === 0) {
      log(`${pkg.name}: nothing touches ${pkg.dir} since ${tag}`)
      continue
    }

    const breaking = commits.filter(
      (c) => BREAKING_SUBJECT.test(c.split("\n")[0]) || BREAKING_FOOTER.test(c),
    )
    if (breaking.length > 0) {
      const subjects = breaking.map((c) => `  - ${c.split("\n")[0]}`).join("\n")
      fail(
        `${pkg.name} has ${breaking.length} commit(s) declaring a breaking change:\n${subjects}\n\n` +
          `This workflow never publishes a major on its own. Decide the version, then tag it:\n` +
          `  git tag ${pkg.prefix}<major>.0.0 && git push origin ${pkg.prefix}<major>.0.0`,
      )
    }

    const [major, minor, patch] = versionOf(pkg.dir).split(".").map(Number)
    const bump = commits.some((c) => FEATURE_SUBJECT.test(c.split("\n")[0]))
      ? "minor"
      : "patch"
    const version =
      bump === "minor"
        ? `${major}.${minor + 1}.0`
        : `${major}.${minor}.${patch + 1}`

    log(
      `${pkg.name}: ${commits.length} commit(s) since ${tag} → ${bump} → ${version}`,
    )
    releases.push({ ...pkg, version, tag: `${pkg.prefix}${version}` })
  }
}

output({
  releases: JSON.stringify(
    releases.map(({ dir, name, version, tag }) => ({
      dir,
      name,
      version,
      tag,
    })),
  ),
  skip: releases.length === 0 ? "true" : "false",
})
