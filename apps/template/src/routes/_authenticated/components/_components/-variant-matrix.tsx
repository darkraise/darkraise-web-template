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

  if (!props.cols) {
    const { render } = props
    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <tbody>
            {rows.values.map((row) => (
              <tr key={row}>
                <th scope="row" className={headerCell}>
                  {row}
                </th>
                <td className="px-3 py-2 align-middle">{render(row)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const { cols, render } = props

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th scope="col" className={headerCell}>
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
              <th scope="row" className={headerCell}>
                {row}
              </th>
              {cols.values.map((col) => (
                <td key={col} className="px-3 py-2 align-middle">
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
