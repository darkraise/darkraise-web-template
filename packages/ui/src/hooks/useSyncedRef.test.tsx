import { act, render } from "@testing-library/react"
import { Suspense, use, useLayoutEffect } from "react"
import { describe, expect, it } from "vitest"
import { useSyncedRef } from "./useSyncedRef"

const never = new Promise<never>(() => {})

type Synced = { readonly current: string }

function Probe({
  value,
  suspend = false,
  onCommit,
}: {
  value: string
  suspend?: boolean
  onCommit: (synced: Synced, seen: string) => void
}) {
  const synced = useSyncedRef(value)
  if (suspend) use(never)
  useLayoutEffect(() => {
    onCommit(synced, synced.current)
  })
  return null
}

describe("useSyncedRef", () => {
  it("returns the same object on every render", () => {
    const seen: Synced[] = []
    const onCommit = (synced: Synced) => {
      seen.push(synced)
    }
    const { rerender } = render(<Probe value="a" onCommit={onCommit} />)
    rerender(<Probe value="b" onCommit={onCommit} />)
    expect(seen).toHaveLength(2)
    expect(seen[1]).toBe(seen[0])
  })

  it("holds the new value by the time layout effects run", () => {
    const seen: string[] = []
    const onCommit = (_synced: Synced, value: string) => {
      seen.push(value)
    }
    const { rerender } = render(<Probe value="a" onCommit={onCommit} />)
    rerender(<Probe value="b" onCommit={onCommit} />)
    expect(seen).toEqual(["a", "b"])
  })

  it("keeps the committed value when a render is discarded", async () => {
    let synced: Synced | undefined
    const onCommit = (s: Synced) => {
      synced = s
    }
    const { rerender, getByText } = render(
      <Suspense fallback={<span>waiting</span>}>
        <Probe value="committed" onCommit={onCommit} />
      </Suspense>,
    )
    expect(synced?.current).toBe("committed")

    await act(async () => {
      rerender(
        <Suspense fallback={<span>waiting</span>}>
          <Probe value="discarded" suspend onCommit={onCommit} />
        </Suspense>,
      )
    })

    expect(getByText("waiting")).toBeTruthy()
    expect(synced?.current).toBe("committed")
  })
})
