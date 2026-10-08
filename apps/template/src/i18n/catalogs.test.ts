// @vitest-environment node
import { readdirSync, readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import ts from "typescript"
import { en as appEnglish } from "./en"
import { vi as appVietnamese } from "./vi"
import { showcaseEnglish } from "./showcase-en"
import { showcaseVietnamese } from "./showcase-vi"
import { capitalisedWords } from "@/test/sentence-case"

const en = { ...showcaseEnglish, ...appEnglish }
const vi = { ...showcaseVietnamese, ...appVietnamese }

describe("demo translation catalogs", () => {
  it("keeps matching application keys and interpolation variables", () => {
    expect(Object.keys(vi).sort()).toEqual(Object.keys(en).sort())
    const variables = (text: string) =>
      [...text.matchAll(/\{\{(.*?)\}\}/g)].map((match) => match[1]).sort()
    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      expect(variables(vi[key]), key).toEqual(variables(en[key]))
    }
  })

  it("registers every shared showcase description and example heading", () => {
    const directory = new URL(
      "../routes/_authenticated/components/",
      import.meta.url,
    )
    const missing: string[] = []
    for (const file of readdirSync(directory).filter((name) =>
      name.endsWith(".tsx"),
    )) {
      const source = ts.createSourceFile(
        file,
        readFileSync(new URL(file, directory), "utf8"),
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX,
      )
      const check = (text: string) => {
        if (
          !Object.prototype.hasOwnProperty.call(en, text) ||
          !Object.prototype.hasOwnProperty.call(vi, text)
        )
          missing.push(`${file}: ${text}`)
      }
      function visit(node: ts.Node) {
        if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
          const tag = node.tagName.getText(source)
          for (const attribute of node.attributes.properties) {
            if (
              !ts.isJsxAttribute(attribute) ||
              !attribute.initializer ||
              !ts.isStringLiteral(attribute.initializer)
            )
              continue
            const name = attribute.name.getText(source)
            if (
              (tag === "ShowcasePage" && name === "description") ||
              (tag === "ShowcaseExample" && name === "title")
            )
              check(attribute.initializer.text)
          }
        }
        if (
          ts.isVariableDeclaration(node) &&
          node.name.getText(source) === "DESCRIPTIONS" &&
          node.initializer &&
          ts.isObjectLiteralExpression(node.initializer)
        ) {
          for (const property of node.initializer.properties)
            if (
              ts.isPropertyAssignment(property) &&
              ts.isStringLiteral(property.initializer)
            )
              check(property.initializer.text)
        }
        ts.forEachChild(node, visit)
      }
      visit(source)
    }
    expect(missing).toEqual([])
  })
})

/** Elements whose text is the label of a button, link or other action. */
const ACTION_TAGS = new Set([
  "Button",
  "AlertDialogAction",
  "AlertDialogCancel",
  "FileUploadTrigger",
  "Link",
])

interface DemoLabels {
  /** Keys rendered as action labels, with the place each one is used. */
  actions: Map<string, string>
  /** Keys rendered as field placeholders. */
  placeholders: Set<string>
}

/** Translated literals in the demo app, outside the component showcase. */
function demoLabels(): DemoLabels {
  const directory = new URL("../", import.meta.url)
  const actions = new Map<string, string>()
  const placeholders = new Set<string>()
  const files = readdirSync(directory, { recursive: true, encoding: "utf8" })
    .map((file) => file.split("\\").join("/"))
    .filter((file) => file.endsWith(".tsx") && !file.includes(".test."))
    .filter((file) => !file.startsWith("routes/_authenticated/components/"))
  for (const file of files) {
    const source = ts.createSourceFile(
      file,
      readFileSync(new URL(file, directory), "utf8"),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    )
    const role = (call: ts.Node): "action" | "placeholder" | null => {
      for (let node = call.parent; node; node = node.parent) {
        if (ts.isFunctionLike(node)) return null
        if (ts.isJsxAttribute(node)) {
          const name = node.name.getText(source)
          if (/placeholder/i.test(name)) return "placeholder"
          if (name === "submitLabel") return "action"
          const tag = node.parent.parent.tagName.getText(source)
          return name === "aria-label" && ACTION_TAGS.has(tag) ? "action" : null
        }
        if (ts.isPropertyAssignment(node)) {
          const object = node.parent
          const isAction =
            node.name.getText(source) === "label" &&
            object.properties.some(
              (property) => property.name?.getText(source) === "onClick",
            )
          return isAction ? "action" : null
        }
        if (
          ts.isJsxElement(node) &&
          ACTION_TAGS.has(node.openingElement.tagName.getText(source))
        )
          return "action"
      }
      return null
    }
    const visit = (node: ts.Node) => {
      if (
        ts.isCallExpression(node) &&
        node.expression.getText(source) === "t" &&
        node.arguments[0] &&
        ts.isStringLiteral(node.arguments[0])
      ) {
        const key = node.arguments[0].text
        const kind = role(node)
        const line =
          source.getLineAndCharacterOfPosition(node.getStart()).line + 1
        if (kind === "action") actions.set(key, `${file}:${line}`)
        if (kind === "placeholder") placeholders.add(key)
      }
      ts.forEachChild(node, visit)
    }
    visit(source)
  }
  return { actions, placeholders }
}

describe("demo action labels", () => {
  const { actions, placeholders } = demoLabels()

  it("finds the action labels of the demo app", () => {
    for (const key of ["Save profile", "Update password", "Export CSV"]) {
      expect(actions.has(key), key).toBe(true)
    }
    expect(actions.size).toBeGreaterThan(30)
  })

  it("registers every action label in the English catalog", () => {
    const missing = [...actions]
      .filter(([key]) => !Object.prototype.hasOwnProperty.call(en, key))
      .map(([key, where]) => `${where}: ${key}`)
    expect(missing).toEqual([])
  })

  it("writes every action label in sentence case", () => {
    const capitalised = [...actions].flatMap(([key, where]) => {
      const text = en[key as keyof typeof en] ?? key
      return capitalisedWords(text).length > 0 ? [`${where}: "${text}"`] : []
    })
    expect(capitalised).toEqual([])
  })

  it("ends progress labels with the ellipsis character", () => {
    const dotted = Object.entries(en)
      .filter(([key, text]) => text.includes("...") && !placeholders.has(key))
      .map(([key]) => key)
    expect(dotted).toEqual([])
  })
})
