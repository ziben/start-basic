export class ApiError extends Error {
  status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function isRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null
}

async function readErrorBody(res: Response): Promise<string | null> {
  try {
    const ct = res.headers.get('content-type')?.toLowerCase() ?? ''
    if (ct.includes('application/json')) {
      const data = (await res.json()) as unknown
      if (isRecord(data)) {
        const title = typeof data.title === 'string' ? data.title : undefined
        const message = typeof data.message === 'string' ? data.message : undefined
        return title ?? message ?? JSON.stringify(data)
      }
      return JSON.stringify(data)
    }
    return await res.text()
  } catch {
    return null
  }
}

export async function fetchJson<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init)
  if (res.ok) {
    return (await res.json()) as T
  }

  const body = (await readErrorBody(res)) ?? res.statusText
  throw new ApiError(body || 'Request failed', res.status)
}

export async function fetchJsonWithSchema<T>(
  schema: { parse: (data: unknown) => T },
  input: string,
  init?: RequestInit
): Promise<T> {
  const raw = await fetchJson<unknown>(input, init)
  return schema.parse(raw)
}

export async function fetchText(input: string, init?: RequestInit): Promise<string> {
  const res = await fetch(input, init)
  if (res.ok) return await res.text()
  const body = (await readErrorBody(res)) ?? res.statusText
  throw new ApiError(body || 'Request failed', res.status)
}
