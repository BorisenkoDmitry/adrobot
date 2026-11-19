const API_PREFIX = '/api/v1'

export class ApiError extends Error {
  constructor(readonly status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

const FALLBACK_MESSAGES: Record<number, string> = {
  400: 'Проверьте введённые данные.',
  403: 'Нет доступа к этому действию.',
  404: 'Запись не найдена.',
  409: 'Данные изменились. Обновите их и повторите действие.',
  422: 'Проверьте введённые данные.',
  502: 'Keitaro не ответил. Повторите запрос чуть позже.',
  503: 'Сервис временно недоступен.',
}

function errorDetail(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object' || !('detail' in payload)) return

  const { detail } = payload
  if (typeof detail === 'string') return detail.trim() || undefined
  if (Array.isArray(detail)) {
    const messages = detail.flatMap((issue: unknown) =>
      issue && typeof issue === 'object' && 'msg' in issue && typeof issue.msg === 'string'
        ? [issue.msg]
        : [],
    )
    return messages.length ? messages.join(' ') : undefined
  }
}

async function request<T>(path: string, options: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_PREFIX}${path}`, {
      ...options,
      headers: { Accept: 'application/json', ...options.headers },
    })
  } catch (error) {
    if (options.signal?.aborted) throw error
    throw new ApiError(0, 'Не удалось подключиться к сервису. Повторите запрос.')
  }

  const data: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    throw new ApiError(response.status, errorDetail(data)
      ?? FALLBACK_MESSAGES[response.status]
      ?? `Запрос завершился ошибкой (${response.status}).`)
  }
  if (data === null) throw new ApiError(response.status, 'Сервис вернул пустой ответ.')
  return data as T
}

export function get<T>(path: string, signal?: AbortSignal) {
  return request<T>(path, { signal })
}

export function post<T>(path: string, body: object) {
  return request<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}
