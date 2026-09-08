// @vitest-environment node
import { readdirSync, readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import ts from "typescript"
import { en as appEnglish } from "./en"
import { vi as appVietnamese } from "./vi"
import { showcaseEnglish } from "./showcase-en"
import { showcaseVietnamese } from "./showcase-vi"

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
