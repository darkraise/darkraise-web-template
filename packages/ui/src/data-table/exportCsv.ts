const FORMULA_PREFIX_RE = /^[=+\-@\t\r]/
const NEEDS_QUOTING_RE = /["\n\r,]/
// eslint-disable-next-line no-control-regex -- intentional: strip ASCII control chars from filenames
const FILENAME_INVALID_RE = /[\\/:*?"<>|\x00-\x1f]/g
const UTF8_BOM = "﻿"

function escapeCsvCell(value: unknown): string {
  let str = String(value ?? "")
  if (FORMULA_PREFIX_RE.test(str)) {
    str = `'${str}`
  }
  if (NEEDS_QUOTING_RE.test(str)) {
    str = `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function sanitizeFilename(name: string): string {
  const cleaned = name
    .replace(FILENAME_INVALID_RE, "_")
    .replace(/^[\s.]+|[\s.]+$/g, "")
  return cleaned || "export"
}

export function buildCsv<TData extends Record<string, unknown>>(
  data: TData[],
  columns: Array<{ key: keyof TData; header: string }>,
): string {
  const header = columns.map((c) => escapeCsvCell(c.header)).join(",")
  const rows = data.map((row) =>
    columns.map((c) => escapeCsvCell(row[c.key])).join(","),
  )
  return UTF8_BOM + [header, ...rows].join("\r\n")
}

export function exportToCsv<TData extends Record<string, unknown>>(
  data: TData[],
  filename: string,
  columns: Array<{ key: keyof TData; header: string }>,
) {
  const csv = buildCsv(data, columns)
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `${sanitizeFilename(filename)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
