export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || ""
  const { body, headers: customHeaders, ...rest } = options

  let token: string | null = null
  try {
    token = localStorage.getItem("auth-token")
  } catch {
    // Storage can be unavailable in embedded or private browsing contexts.
  }

  const headers = new Headers(customHeaders)
  if (!headers.has("Content-Type"))
    headers.set("Content-Type", "application/json")

  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  const response = await fetch(`${baseUrl}${endpoint}`, {
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...rest,
  })

  if (!response.ok) {
    throw new ApiError(response.status, await response.text())
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json()
}
