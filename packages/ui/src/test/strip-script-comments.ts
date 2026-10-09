import ts from "typescript"

const { SyntaxKind } = ts

// A slash after one of these ends an operand, so it divides; after anything
// else it opens a regex literal.
const OPERAND_ENDS = new Set<ts.SyntaxKind>([
  SyntaxKind.Identifier,
  SyntaxKind.PrivateIdentifier,
  SyntaxKind.NumericLiteral,
  SyntaxKind.BigIntLiteral,
  SyntaxKind.StringLiteral,
  SyntaxKind.RegularExpressionLiteral,
  SyntaxKind.NoSubstitutionTemplateLiteral,
  SyntaxKind.TemplateTail,
  SyntaxKind.CloseParenToken,
  SyntaxKind.CloseBracketToken,
  SyntaxKind.CloseBraceToken,
  SyntaxKind.PlusPlusToken,
  SyntaxKind.MinusMinusToken,
  SyntaxKind.ThisKeyword,
  SyntaxKind.SuperKeyword,
  SyntaxKind.NullKeyword,
  SyntaxKind.TrueKeyword,
  SyntaxKind.FalseKeyword,
])

const TRIVIA = new Set<ts.SyntaxKind>([
  SyntaxKind.WhitespaceTrivia,
  SyntaxKind.NewLineTrivia,
  SyntaxKind.SingleLineCommentTrivia,
  SyntaxKind.MultiLineCommentTrivia,
  SyntaxKind.ShebangTrivia,
  SyntaxKind.ConflictMarkerTrivia,
])

/**
 * TypeScript source with its comments removed, as the TypeScript scanner
 * reads them, so a comment marker inside a string, a regex literal or a
 * template literal is text. Each comment leaves its newlines behind, so line
 * numbers in the result still match the source. With no parser behind the
 * scanner, a slash is a regex literal unless it follows an operand, and JSX
 * text is read as code.
 */
export function stripScriptComments(source: string): string {
  const scanner = ts.createScanner(
    ts.ScriptTarget.Latest,
    false,
    ts.LanguageVariant.Standard,
    source,
  )
  let out = ""
  let previous: ts.SyntaxKind = SyntaxKind.Unknown
  let braces = 0
  // The brace depth at which each open template substitution started.
  const substitutions: number[] = []
  for (
    let kind = scanner.scan();
    kind !== SyntaxKind.EndOfFileToken;
    kind = scanner.scan()
  ) {
    if (
      (kind === SyntaxKind.SlashToken ||
        kind === SyntaxKind.SlashEqualsToken) &&
      !OPERAND_ENDS.has(previous)
    ) {
      kind = scanner.reScanSlashToken()
    } else if (kind === SyntaxKind.OpenBraceToken) {
      braces++
    } else if (kind === SyntaxKind.CloseBraceToken) {
      if (substitutions[substitutions.length - 1] === braces) {
        kind = scanner.reScanTemplateToken(false)
        if (kind === SyntaxKind.TemplateTail) substitutions.pop()
      } else {
        braces--
      }
    }
    if (kind === SyntaxKind.TemplateHead) substitutions.push(braces)
    const text = scanner.getTokenText()
    if (
      kind === SyntaxKind.SingleLineCommentTrivia ||
      kind === SyntaxKind.MultiLineCommentTrivia
    ) {
      out += text.replace(/[^\r\n]/g, "")
    } else {
      out += text
    }
    if (!TRIVIA.has(kind)) previous = kind
  }
  return out
}
