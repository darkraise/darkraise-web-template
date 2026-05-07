import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { buildCsv, exportToCsv } from "./exportCsv"

const UTF8_BOM = "﻿"

interface Row extends Record<string, unknown> {
  name: string
  amount: number | string
}

const cols: Array<{ key: keyof Row; header: string }> = [
  { key: "name", header: "Name" },
  { key: "amount", header: "Amount" },
]

describe("buildCsv", () => {
  it("starts with a UTF-8 BOM", () => {
    const csv = buildCsv<Row>([{ name: "a", amount: 1 }], cols)
    expect(csv.startsWith(UTF8_BOM)).toBe(true)
  })

  it("uses CRLF row separators", () => {
    const csv = buildCsv<Row>(
      [
        { name: "a", amount: 1 },
        { name: "b", amount: 2 },
      ],
      cols,
    )
    expect(csv).toContain("\r\n")
    expect(csv.split("\r\n")).toHaveLength(3)
    expect(csv.includes("\n\r")).toBe(false)
  })

  it("prefixes formula-leading cells with a single quote", () => {
    const cases = [
      "=SUM(A1:A2)",
      "+1+1",
      "-1+1",
      "@cmd",
      "\tnot-tab",
      "\rnot-cr",
    ]
    for (const value of cases) {
      const csv = buildCsv<Row>([{ name: value, amount: 0 }], cols)
      const cell = csv.split("\r\n")[1] ?? ""
      expect(
        cell.startsWith(`'${value[0]}`) || cell.startsWith(`"'${value[0]}`),
      ).toBe(true)
    }
  })

  it("quotes cells containing commas", () => {
    const csv = buildCsv<Row>([{ name: "a, b", amount: 0 }], cols)
    expect(csv).toContain('"a, b"')
  })

  it("doubles embedded double quotes inside a quoted cell", () => {
    const csv = buildCsv<Row>([{ name: 'he said "hi"', amount: 0 }], cols)
    expect(csv).toContain('"he said ""hi"""')
  })

  it("quotes cells containing newlines or carriage returns", () => {
    const csvLf = buildCsv<Row>([{ name: "line1\nline2", amount: 0 }], cols)
    expect(csvLf).toContain('"line1\nline2"')
    const csvCr = buildCsv<Row>([{ name: "x\ry", amount: 0 }], cols)
    expect(csvCr).toContain('"x\ry"')
  })

  it("escapes header cells too", () => {
    const csv = buildCsv<Row>(
      [{ name: "n", amount: 0 }],
      [
        { key: "name", header: "=evil()" },
        { key: "amount", header: "Amount" },
      ],
    )
    const headerLine = csv.slice(UTF8_BOM.length).split("\r\n")[0] ?? ""
    expect(
      headerLine.startsWith("'=evil()") || headerLine.startsWith("\"'=evil()"),
    ).toBe(true)
  })

  it("renders nullish values as empty strings", () => {
    const csv = buildCsv<Row>(
      [
        {
          name: null as unknown as string,
          amount: undefined as unknown as number,
        },
      ],
      cols,
    )
    const row = csv.split("\r\n")[1] ?? ""
    expect(row).toBe(",")
  })
})

describe("exportToCsv", () => {
  beforeEach(() => {
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:test"),
      revokeObjectURL: vi.fn(),
    })
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("sanitizes the filename before assigning to link.download", () => {
    const click = vi.fn()
    const link = {
      href: "",
      download: "",
      click,
    } as unknown as HTMLAnchorElement
    vi.spyOn(document, "createElement").mockReturnValueOnce(link)
    exportToCsv<Row>([{ name: "a", amount: 1 }], "../../etc/passwd?<x>", cols)
    expect(link.download).toBe("_.._etc_passwd__x_.csv")
    expect(click).toHaveBeenCalled()
  })

  it("falls back to 'export' when filename sanitizes to empty", () => {
    const click = vi.fn()
    const link = {
      href: "",
      download: "",
      click,
    } as unknown as HTMLAnchorElement
    vi.spyOn(document, "createElement").mockReturnValueOnce(link)
    exportToCsv<Row>([{ name: "a", amount: 1 }], "...", cols)
    expect(link.download).toBe("export.csv")
  })
})
