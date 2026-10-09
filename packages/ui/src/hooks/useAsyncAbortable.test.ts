import { act, renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { useAsyncAbortable } from "./useAsyncAbortable"

type Call = {
  signal: AbortSignal
  args: [string]
  resolve: (value: string) => void
  reject: (error: Error) => void
}

function setup() {
  const calls: Call[] = []
  const asyncFn = (signal: AbortSignal, label: string) =>
    new Promise<string>((resolve, reject) => {
      calls.push({ signal, args: [label], resolve, reject })
      signal.addEventListener("abort", () => {
        reject(new Error("aborted"))
      })
    })
  const hook = renderHook(() => useAsyncAbortable(asyncFn, "initial"))
  return { calls, hook }
}

describe("useAsyncAbortable", () => {
  it("reports no controller, promise or arguments before the first call", () => {
    const { hook } = setup()
    const meta = hook.result.current[2]
    expect(meta.abortController).toBeUndefined()
    expect(meta.promise).toBeUndefined()
    expect(meta.lastArgs).toBeUndefined()
  })

  it("exposes the running call's controller and arguments, then drops the controller when it settles", async () => {
    const { calls, hook } = setup()
    act(() => {
      void hook.result.current[1].execute("a")
    })
    const meta = hook.result.current[2]
    expect(meta.abortController?.signal).toBe(calls[0]?.signal)
    expect(meta.abortController?.signal.aborted).toBe(false)
    expect(meta.lastArgs).toEqual(["a"])
    expect(meta.promise).toBeInstanceOf(Promise)

    await act(async () => {
      calls[0]?.resolve("done")
    })
    expect(hook.result.current[0].result).toBe("done")
    expect(hook.result.current[2].abortController).toBeUndefined()
    expect(hook.result.current[2].lastArgs).toEqual(["a"])
  })

  it("aborts the previous call and exposes the new controller when called again", () => {
    const { calls, hook } = setup()
    act(() => {
      void hook.result.current[1].execute("a").catch(() => {})
    })
    act(() => {
      void hook.result.current[1].execute("b")
    })
    expect(calls[0]?.signal.aborted).toBe(true)
    expect(hook.result.current[2].abortController?.signal).toBe(
      calls[1]?.signal,
    )
    expect(hook.result.current[2].lastArgs).toEqual(["b"])
  })

  it("aborts the running call on abort and drops the controller once it rejects", async () => {
    const { calls, hook } = setup()
    act(() => {
      void hook.result.current[1].execute("a").catch(() => {})
    })
    await act(async () => {
      hook.result.current[1].abort()
    })
    expect(calls[0]?.signal.aborted).toBe(true)
    expect(hook.result.current[0].status).toBe("error")
    expect(hook.result.current[2].abortController).toBeUndefined()
  })

  it("aborts and clears everything on reset", async () => {
    const { calls, hook } = setup()
    act(() => {
      void hook.result.current[1].execute("a").catch(() => {})
    })
    await act(async () => {
      hook.result.current[1].reset()
    })
    expect(calls[0]?.signal.aborted).toBe(true)
    const [state, , meta] = hook.result.current
    expect(state.status).toBe("not-executed")
    expect(meta.abortController).toBeUndefined()
    expect(meta.promise).toBeUndefined()
    expect(meta.lastArgs).toBeUndefined()
  })
})
