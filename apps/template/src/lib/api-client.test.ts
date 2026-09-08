import { afterEach, describe, expect, it, vi } from "vitest"
import { apiClient, ApiError } from "./api-client"

afterEach(() => vi.unstubAllGlobals())

function captureRequest() {
  let request: Request
  vi.stubGlobal("localStorage", { getItem: () => "session-token" })
  vi.stubGlobal("fetch", async (url: string, options: RequestInit) => {
    request = new Request(new URL(url, "http://localhost"), options)
    return new Response(JSON.stringify({ saved: true }), { status: 200 })
  })
  return () => request
}

describe("apiClient", () => {
  it.each([
    { "X-Request": "record" },
    new Headers({ "X-Request": "headers" }),
    [["X-Request", "tuples"]],
  ] satisfies HeadersInit[])(
    "preserves supported header representations",
    async (headers) => {
      const request = captureRequest()
      await apiClient("/save", { headers })
      expect(request().headers.get("X-Request")).toBe(
        new Headers(headers).get("X-Request"),
      )
      expect(request().headers.get("Authorization")).toBe(
        "Bearer session-token",
      )
    },
  )

  it.each([false, 0, "", null])(
    "sends the supplied JSON value %j",
    async (body) => {
      const request = captureRequest()
      await apiClient("/save", { method: "POST", body })
      expect(await request().json()).toEqual(body)
    },
  )

  it("omits an absent body", async () => {
    const request = captureRequest()
    await apiClient("/read")
    expect(await request().text()).toBe("")
  })

  it("still sends a request when storage is denied", async () => {
    const request = captureRequest()
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("Storage denied")
      },
    })
    await expect(apiClient("/read")).resolves.toEqual({ saved: true })
    expect(request().headers.has("Authorization")).toBe(false)
  })

  it("accepts empty successful responses", async () => {
    captureRequest()
    vi.stubGlobal("fetch", async () => new Response(null, { status: 204 }))
    await expect(
      apiClient("/delete", { method: "DELETE" }),
    ).resolves.toBeUndefined()
  })

  it("preserves server error status and message", async () => {
    captureRequest()
    vi.stubGlobal(
      "fetch",
      async () => new Response("Unavailable", { status: 503 }),
    )
    await expect(apiClient("/read")).rejects.toEqual(
      new ApiError(503, "Unavailable"),
    )
  })
})
