#!/usr/bin/env node

import { execFileSync, execSync } from "child_process"
import { existsSync } from "fs"
import { resolve } from "path"

const REPO = "https://github.com/darkraise/darkraise-web-template.git"
const BRANCH = "main"

const projectName = process.argv[2]

if (!projectName) {
  console.error("Usage: npm create darkraise-web-template <project-name>")
  process.exit(1)
}

if (!/^[a-zA-Z0-9_-]+$/.test(projectName)) {
  console.error(
    "Error: project name must contain only letters, numbers, hyphens, and underscores.",
  )
  process.exit(1)
}

const targetDir = resolve(process.cwd(), projectName)

if (existsSync(targetDir)) {
  console.error(`Error: directory "${projectName}" already exists.`)
  process.exit(1)
}

console.log(`\nCreating project: ${projectName}\n`)

execFileSync("npx", ["--yes", "degit", `${REPO}#${BRANCH}`, projectName], {
  stdio: "inherit",
  cwd: process.cwd(),
})

console.log("\nStripping demo code and initializing...\n")
execFileSync("node", ["scripts/init.mjs", projectName], {
  cwd: targetDir,
  stdio: "inherit",
})

console.log("Installing dependencies...\n")
execFileSync("npm", ["install"], { cwd: targetDir, stdio: "inherit" })

console.log("Initializing git repository...\n")
execFileSync("git", ["init"], { cwd: targetDir, stdio: "inherit" })
execFileSync("git", ["add", "-A"], { cwd: targetDir, stdio: "inherit" })
execFileSync("git", ["commit", "-m", "chore: scaffold from web-template"], {
  cwd: targetDir,
  stdio: "inherit",
})

console.log(`
Success! Created ${projectName} at ${targetDir}

  cd ${projectName}
  npm run dev        Start development server
  npm run storybook  Browse component library
  npm run test       Run tests
`)
