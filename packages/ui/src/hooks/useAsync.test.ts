import { act, renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { useAsync } from "./useAsync"

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: Error) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function setup() {
  const calls: {
    args: [string, number]
    d: ReturnType<typeof deferred<string>>
  }[] = []
  const asyncFn = (label: string, n: number) => {
    const d = deferred<string>()
    calls.push({ args: [label, n], d })
    return d.promise
  }
  const hook = renderHook(() => useAsync(asyncFn, "initial"))
  return { calls, hook }
}

describe("useAsync", () => {
  it("reports no promise and no arguments before the first call", () => {
    const { hook } = setup()
    const [state, , meta] = hook.result.current
    expect(state).toEqual({
      status: "not-executed",
      error: undefined,
      result: "initial",
    })
    expect(meta.promise).toBeUndefined()
    expect(meta.lastArgs).toBeUndefined()
  })

  it("exposes the running promise and its arguments while loading and after success", async () => {
    const { calls, hook } = setup()
    act(() => {
      void hook.result.current[1].execute("a", 1)
    })
    const [state, , meta] = hook.result.current
    expect(state.status).toBe("loading")
    expect(meta.promise).toBe(calls[0]?.d.promise)
    expect(meta.lastArgs).toEqual(["a", 1])

    await act(async () => {
      calls[0]?.d.resolve("done")
    })
    const [after, , afterMeta] = hook.result.current
    expect(after).toEqual({
      status: "success",
      error: undefined,
      result: "done",
    })
    expect(afterMeta.promise).toBe(calls[0]?.d.promise)
    expect(afterMeta.lastArgs).toEqual(["a", 1])
  })

  it("replaces the promise and arguments when called again and ignores the stale result", async () => {
    const { calls, hook } = setup()
    act(() => {
      void hook.result.current[1].execute("a", 1)
    })
    act(() => {
      void hook.result.current[1].execute("b", 2)
    })
    expect(hook.result.current[2].promise).toBe(calls[1]?.d.promise)
    expect(hook.result.current[2].lastArgs).toEqual(["b", 2])

    await act(async () => {
      calls[0]?.d.resolve("stale")
    })
    expect(hook.result.current[0].status).toBe("loading")

    await act(async () => {
      calls[1]?.d.resolve("fresh")
    })
    expect(hook.result.current[0].result).toBe("fresh")
    expect(hook.result.current[2].lastArgs).toEqual(["b", 2])
  })

  it("keeps the promise and arguments after an error", async () => {
    const { calls, hook } = setup()
    act(() => {
      void hook.result.current[1].execute("a", 1).catch(() => {})
    })
    const error = new Error("failed")
    await act(async () => {
      calls[0]?.d.reject(error)
    })
    const [state, , meta] = hook.result.current
    expect(state.status).toBe("error")
    expect(state.error).toBe(error)
    expect(meta.promise).toBe(calls[0]?.d.promise)
    expect(meta.lastArgs).toEqual(["a", 1])
  })

  it("clears the promise and arguments on reset", async () => {
    const { calls, hook } = setup()
    act(() => {
      void hook.result.current[1].execute("a", 1)
    })
    act(() => {
      hook.result.current[1].reset()
    })
    const [state, , meta] = hook.result.current
    expect(state.status).toBe("not-executed")
    expect(meta.promise).toBeUndefined()
    expect(meta.lastArgs).toBeUndefined()

    await act(async () => {
      calls[0]?.d.resolve("late")
    })
    expect(hook.result.current[0].status).toBe("not-executed")
  })
})
