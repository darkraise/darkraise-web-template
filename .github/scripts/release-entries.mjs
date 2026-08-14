#!/usr/bin/env node
// Prints the release plan from $RELEASES as space-separated fields, one
// package per line, so a shell can iterate it with `read`:
//
//   while read -r dir name version tag; do ... done < <(release-entries.mjs)
//
// None of the fields can contain a space: dirs and package names are fixed
// by this repository, and versions and tags are validated in plan-release.

const releases = JSON.parse(process.env.RELEASES ?? "[]")

for (const { dir, name, version, tag } of releases) {
  console.log([dir, name, version, tag].join(" "))
}
