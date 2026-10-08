// @vitest-environment node
import path from "node:path"
import ts from "typescript"
import { describe, expect, it } from "vitest"
import { AXIS_KEYS } from "./registry"

function undocumentedAxes(): string[] {
  const config = ts.getParsedCommandLineOfConfigFile(
    "tsconfig.json",
    {},
    {
      ...ts.sys,
      onUnRecoverableConfigFileDiagnostic: (d) => {
        throw new Error(ts.flattenDiagnosticMessageText(d.messageText, "\n"))
      },
    },
  )
  if (!config) throw new Error("tsconfig.json did not parse")
  const file = path.resolve("src/theme/types.ts")
  const program = ts.createProgram([file], config.options)
  const checker = program.getTypeChecker()
  const source = program.getSourceFile(file)
  if (!source) throw new Error("src/theme/types.ts is not in the program")
  const missing: string[] = []
  for (const name of ["ThemeSettings", "ThemeContextValue"]) {
    const node = source.statements.find(
      (s): s is ts.TypeAliasDeclaration | ts.InterfaceDeclaration =>
        (ts.isTypeAliasDeclaration(s) || ts.isInterfaceDeclaration(s)) &&
        s.name.text === name,
    )
    if (!node) throw new Error(`${name} is not declared in types.ts`)
    const type = checker.getTypeAtLocation(node.name)
    for (const axis of AXIS_KEYS) {
      const property = type.getProperty(axis)
      const doc = property
        ? ts.displayPartsToString(property.getDocumentationComment(checker))
        : ""
      if (!doc) missing.push(`${name}.${axis}`)
    }
  }
  return missing
}

describe("axis JSDoc", () => {
  it("reaches every axis of ThemeSettings and ThemeContextValue", () => {
    expect(undocumentedAxes()).toEqual([])
  }, 60_000)
})
