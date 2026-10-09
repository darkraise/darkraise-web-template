// @vitest-environment node
import { readdirSync, readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import ts from "typescript"
import { capitalisedWords } from "@/test/sentence-case"

/** Elements whose text is the label of a button, link, menu row or other action. */
const ACTION_TAG =
  /^(Button|Link|AlertDialogAction|AlertDialogCancel|FileUploadTrigger|DownloadTrigger|CommandItem|MenubarItem|\w*Menu(Checkbox|Radio)?Item|\w*SubTrigger)$/

/** Which elements and attributes hold one kind of label. */
interface LabelKind {
  /** Elements whose text children are labels. */
  tag: RegExp
  /** Attributes whose string values are labels... */
  attribute: RegExp
  /** ...on the elements this matches. */
  on: RegExp
}

const ACTIONS: LabelKind = {
  tag: ACTION_TAG,
  attribute: /^aria-label$/,
  on: ACTION_TAG,
}

/**
 * Titles (dialog, sheet, drawer, card and example headings), accordion
 * triggers and field labels. A page's own name, its ShowcasePage title or
 * h1, is what the navigation lists, so it is left out.
 */
const TITLES: LabelKind = {
  tag: /^(\w*Title|AccordionTrigger|\w*Label|\w*Legend|h[2-6])$/,
  attribute: /^(title|label)$/,
  on: /^(?!ShowcasePage$)/,
}

interface Label {
  text: string
  where: string
  /** True when the label sits in a `code=` sample. */
  sample: boolean
}

/** String literals in a JSX child expression, outside nested JSX attributes. */
function literalsIn(node: ts.Node): ts.StringLiteralLike[] {
  if (ts.isJsxAttributes(node)) return []
  if (ts.isStringLiteralLike(node)) return [node]
  const found: ts.StringLiteralLike[] = []
  ts.forEachChild(node, (child) => {
    found.push(...literalsIn(child))
  })
  return found
}

/** The source text of a `code=` sample, with each substitution read as `x`. */
function sampleText(node: ts.Expression): string | null {
  const text = ts.isStringLiteralLike(node)
    ? node.text
    : ts.isTemplateExpression(node)
      ? [
          node.head.text,
          ...node.templateSpans.map((span) => `x${span.literal.text}`),
        ].join("")
      : null
  // Samples leave out semicolons, so markup after a statement would parse as
  // a less-than comparison. A tag opening a line starts a new statement; in
  // element children the inserted `;` is only text.
  return text?.replace(/^(?=<[A-Za-z>])/gm, ";") ?? null
}

/**
 * Labels of one kind in a TSX source and in its `code=` samples. `line` maps
 * a zero-based line of `text` to the place it is reported at.
 */
function labelsOf(
  kind: LabelKind,
  file: string,
  text: string,
  line: (index: number) => number,
  sample = false,
): Label[] {
  const source = ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  )
  const at = (node: ts.Node) =>
    `${file}:${line(source.getLineAndCharacterOfPosition(node.getStart(source)).line)}`
  const labels: Label[] = []
  const attributeLabels = (tag: string, attributes: ts.JsxAttributes) => {
    if (!kind.on.test(tag)) return
    for (const attribute of attributes.properties) {
      if (
        ts.isJsxAttribute(attribute) &&
        kind.attribute.test(attribute.name.getText(source)) &&
        attribute.initializer
      )
        for (const literal of literalsIn(attribute.initializer))
          labels.push({ text: literal.text, where: at(literal), sample })
    }
  }
  const visit = (node: ts.Node) => {
    if (ts.isJsxElement(node)) {
      const opening = node.openingElement
      const tag = opening.tagName.getText(source)
      attributeLabels(tag, opening.attributes)
      if (kind.tag.test(tag)) {
        const text = node.children
          .filter(ts.isJsxText)
          .map((child) => child.text)
          .join(" ")
          .replace(/\s+/g, " ")
          .trim()
        if (text) labels.push({ text, where: at(node), sample })
        for (const child of node.children)
          if (ts.isJsxExpression(child) && child.expression)
            for (const literal of literalsIn(child.expression))
              labels.push({ text: literal.text, where: at(literal), sample })
      }
    }
    if (ts.isJsxSelfClosingElement(node))
      attributeLabels(node.tagName.getText(source), node.attributes)
    if (
      ts.isJsxAttribute(node) &&
      node.name.getText(source) === "code" &&
      node.initializer
    ) {
      const expression = ts.isJsxExpression(node.initializer)
        ? node.initializer.expression
        : node.initializer
      const code = expression ? sampleText(expression) : null
      if (expression && code !== null) {
        const start = source.getLineAndCharacterOfPosition(
          expression.getStart(source),
        ).line
        labels.push(
          ...labelsOf(kind, file, code, (index) => line(start + index), true),
        )
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  return labels
}

/** Labels of one kind in every showcase route and its shared parts. */
function showcaseLabels(kind: LabelKind): Label[] {
  const directory = new URL("./", import.meta.url)
  return readdirSync(directory, { recursive: true, encoding: "utf8" })
    .map((file) => file.split("\\").join("/"))
    .filter((file) => file.endsWith(".tsx") && !file.includes(".test."))
    .flatMap((file) =>
      labelsOf(
        kind,
        file,
        readFileSync(new URL(file, directory), "utf8"),
        (index) => index + 1,
      ),
    )
}

describe("showcase action labels", () => {
  const labels = showcaseLabels(ACTIONS)

  it("finds button, menu and aria labels in pages and samples", () => {
    const found = (text: string, sample: boolean) =>
      labels.some(
        (label) =>
          label.sample === sample &&
          label.text.toLowerCase() === text.toLowerCase(),
      )
    for (const text of ["Open dialog", "Sign out", "Previous page"]) {
      expect(found(text, false), `${text} on a page`).toBe(true)
      expect(found(text, true), `${text} in a sample`).toBe(true)
    }
    expect(labels.length).toBeGreaterThan(400)
  })

  it("writes every action label in sentence case", () => {
    const capitalised = labels
      .filter((label) => capitalisedWords(label.text).length > 0)
      .map((label) => `${label.where}: "${label.text}"`)
    expect(capitalised).toEqual([])
  })
})

describe("showcase titles, accordion triggers and field labels", () => {
  const labels = showcaseLabels(TITLES)

  it("finds titles, triggers and field labels in pages and samples", () => {
    const found = (text: string, sample: boolean) =>
      labels.some(
        (label) =>
          label.sample === sample &&
          label.text.toLowerCase() === text.toLowerCase(),
      )
    for (const text of ["Edit profile", "Section one", "Display name"]) {
      expect(found(text, false), `${text} on a page`).toBe(true)
      expect(found(text, true), `${text} in a sample`).toBe(true)
    }
    expect(labels.length).toBeGreaterThan(400)
  })

  it("writes every title, trigger and field label in sentence case", () => {
    const capitalised = labels
      .filter((label) => capitalisedWords(label.text).length > 0)
      .map((label) => `${label.where}: "${label.text}"`)
    expect(capitalised).toEqual([])
  })
})
