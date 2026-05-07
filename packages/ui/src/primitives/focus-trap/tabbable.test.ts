import { describe, expect, it, beforeEach } from "vitest"
import { getTabbables } from "./tabbable"

function el(
  tag: string,
  attrs: Record<string, string | boolean> = {},
  text?: string,
): HTMLElement {
  const node = document.createElement(tag)
  for (const [k, v] of Object.entries(attrs)) {
    if (v === false) continue
    if (v === true) node.setAttribute(k, "")
    else node.setAttribute(k, v)
  }
  if (text !== undefined) node.textContent = text
  return node
}

function makeRoot(...children: HTMLElement[]): HTMLElement {
  const root = document.createElement("div")
  for (const child of children) root.append(child)
  document.body.append(root)
  return root
}

describe("getTabbables", () => {
  beforeEach(() => {
    document.body.replaceChildren()
  })

  it("returns elements in DOM order", () => {
    const select = el("select")
    select.append(el("option", {}, "x"))
    const root = makeRoot(
      el("button", {}, "a"),
      el("a", { href: "#" }, "b"),
      el("input"),
      el("textarea"),
      select,
      el("div", { tabindex: "0" }, "c"),
    )
    const result = getTabbables(root).map((n) => n.tagName.toLowerCase())
    expect(result).toEqual([
      "button",
      "a",
      "input",
      "textarea",
      "select",
      "div",
    ])
  })

  it("skips elements with tabindex=-1", () => {
    const root = makeRoot(
      el("button", {}, "a"),
      el("button", { tabindex: "-1" }, "b"),
    )
    const result = getTabbables(root).map((n) => n.textContent)
    expect(result).toEqual(["a"])
  })

  it("skips disabled buttons and inputs", () => {
    const root = makeRoot(
      el("button", { disabled: true }, "a"),
      el("button", {}, "b"),
      el("input", { disabled: true }),
    )
    const result = getTabbables(root).map((n) => n.textContent)
    expect(result).toEqual(["b"])
  })

  it("skips elements with hidden attribute", () => {
    const root = makeRoot(
      el("button", { hidden: true }, "a"),
      el("button", {}, "b"),
    )
    const result = getTabbables(root).map((n) => n.textContent)
    expect(result).toEqual(["b"])
  })

  it("skips a[href] without href", () => {
    const root = makeRoot(el("a", {}, "a"), el("a", { href: "#" }, "b"))
    const result = getTabbables(root).map((n) => n.textContent)
    expect(result).toEqual(["b"])
  })
})
