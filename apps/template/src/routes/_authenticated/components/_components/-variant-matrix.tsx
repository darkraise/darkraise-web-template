interface Axis<T extends string> {
  label: string
  values: readonly T[]
}

interface SingleAxisProps<R extends string> {
  rows: Axis<R>
  cols?: undefined
  render: (row: R) => React.ReactNode
}

interface DualAxisProps<R extends string, C extends string> {
  rows: Axis<R>
  cols: Axis<C>
  render: (row: R, col: C) => React.ReactNode
}

export function VariantMatrix<R extends string, C extends string = never>(
  props: SingleAxisProps<R> | DualAxisProps<R, C>,
) {
  const { rows } = props
  const headerCell =
    "text-muted-foreground px-3 py-2 text-left text-xs font-medium whitespace-nowrap"
  const rowHeaderCell = `${headerCell} w-px`
  const contentCell = "max-w-0 px-3 py-2 align-middle"

  if (!props.cols) {
    const { render } = props
    return (
      <div data-showcase-matrix="">
        <table className="w-full border-collapse">
          <tbody>
            {rows.values.map((row) => (
              <tr key={row}>
                <th scope="row" className={rowHeaderCell}>
                  {row}
                </th>
                <td className={`${contentCell} w-full`}>{render(row)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const { cols, render } = props
  // Percentage widths that sum to 100% share the space left by the header
  // column equally; max-w-0 stops a wide child from widening its column.
  const columnWidth = `${100 / cols.values.length}%`

  return (
    <div data-showcase-matrix="">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th scope="col" className={rowHeaderCell}>
              {rows.label} \ {cols.label}
            </th>
            {cols.values.map((col) => (
              <th key={col} scope="col" className={headerCell}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.values.map((row) => (
            <tr key={row}>
              <th scope="row" className={rowHeaderCell}>
                {row}
              </th>
              {cols.values.map((col) => (
                <td
                  key={col}
                  className={contentCell}
                  style={{ width: columnWidth }}
                >
                  {render(row, col)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
