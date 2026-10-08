import { useLayoutEffect, useRef, useState } from "react"

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

/**
 * Width the wrapper must gain over the width that forced the list before the
 * table returns, so the two modes cannot alternate at one width.
 */
const RETURN_MARGIN = 16

function spills(wrapper: HTMLElement) {
  if (wrapper.scrollWidth > wrapper.clientWidth) return true
  return [...wrapper.querySelectorAll("td")].some(
    (cell) => cell.scrollWidth > cell.clientWidth,
  )
}

/**
 * Cells are capped by max-w-0, so a wide demo spills out of its cell rather
 * than widening the table; when that happens the matrix renders as a list.
 */
function useListMode() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const switchedAt = useRef(0)
  const [list, setList] = useState(false)

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return
    // observe() always delivers a first notification, so recreating the
    // observer on every mode change also re-checks the freshly laid out mode.
    const observer = new ResizeObserver(() => {
      const width = wrapper.clientWidth
      if (!list) {
        if (spills(wrapper)) {
          switchedAt.current = width
          setList(true)
        }
      } else if (width >= switchedAt.current + RETURN_MARGIN) {
        setList(false)
      }
    })
    observer.observe(wrapper)
    return () => observer.disconnect()
  }, [list])

  return { wrapperRef, list }
}

function MatrixList({
  items,
}: {
  items: { key: string; label: string; content: React.ReactNode }[]
}) {
  return (
    <dl className="space-y-3">
      {items.map((item) => (
        <div key={item.key} className="space-y-1">
          <dt className="text-muted-foreground text-xs font-medium">
            {item.label}
          </dt>
          <dd>{item.content}</dd>
        </div>
      ))}
    </dl>
  )
}

export function VariantMatrix<R extends string, C extends string = never>(
  props: SingleAxisProps<R> | DualAxisProps<R, C>,
) {
  const { rows } = props
  const { wrapperRef, list } = useListMode()
  const headerCell =
    "text-muted-foreground px-3 py-2 text-left text-xs font-medium whitespace-nowrap"
  const rowHeaderCell = `${headerCell} w-px`
  const contentCell = "max-w-0 px-3 py-2 align-middle"

  if (!props.cols) {
    const { render } = props
    return (
      <div ref={wrapperRef} data-showcase-matrix="">
        {list ? (
          <MatrixList
            items={rows.values.map((row) => ({
              key: row,
              label: row,
              content: render(row),
            }))}
          />
        ) : (
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
        )}
      </div>
    )
  }

  const { cols, render } = props

  if (list) {
    return (
      <div ref={wrapperRef} data-showcase-matrix="">
        <MatrixList
          items={rows.values.flatMap((row) =>
            cols.values.map((col) => ({
              key: `${row}-${col}`,
              label: `${row} · ${col}`,
              content: render(row, col),
            })),
          )}
        />
      </div>
    )
  }

  // Percentage widths that sum to 100% share the space left by the header
  // column equally; max-w-0 stops a wide child from widening its column.
  const columnWidth = `${100 / cols.values.length}%`

  return (
    <div ref={wrapperRef} data-showcase-matrix="">
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
