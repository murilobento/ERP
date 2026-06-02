import axios, {
  AxiosError,
  type AxiosAdapter,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { afterEach, describe, expect, it, vi } from 'vitest'

async function loadApi() {
  vi.resetModules()
  const api = (await import('./api')).default as AxiosInstance
  return api
}

function okResponse(
  config: InternalAxiosRequestConfig,
  data: unknown
): AxiosResponse {
  return {
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  }
}

function unauthorized(config: InternalAxiosRequestConfig) {
  return new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, undefined, {
    data: { error: 'Unauthorized' },
    status: 401,
    statusText: 'Unauthorized',
    headers: {},
    config,
  })
}

describe('api client', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('creates an axios client that sends credentials to the API base URL', async () => {
    const api = await loadApi()

    expect(api.defaults.baseURL).toBe('/api')
    expect(api.defaults.withCredentials).toBe(true)
  })

  it('refreshes once and retries the original request after a 401', async () => {
    const api = await loadApi()
    const refresh = vi
      .spyOn(axios, 'post')
      .mockResolvedValue(
        okResponse({} as InternalAxiosRequestConfig, { ok: true })
      )
    const adapter = vi
      .fn<AxiosAdapter>()
      .mockImplementationOnce((config) => Promise.reject(unauthorized(config)))
      .mockImplementationOnce((config) =>
        Promise.resolve(okResponse(config, 'retried'))
      )
    api.defaults.adapter = adapter

    await expect(api.get('/clients')).resolves.toMatchObject({
      data: 'retried',
    })

    expect(refresh).toHaveBeenCalledWith(
      '/api/auth/refresh',
      {},
      { withCredentials: true }
    )
    expect(adapter).toHaveBeenCalledTimes(2)
  })

  it('queues concurrent 401 responses behind the in-flight refresh', async () => {
    const api = await loadApi()
    let resolveRefresh: (value: AxiosResponse) => void = () => {}
    vi.spyOn(axios, 'post').mockReturnValue(
      new Promise((resolve) => {
        resolveRefresh = resolve
      })
    )
    const adapter = vi
      .fn<AxiosAdapter>()
      .mockImplementationOnce((config) => Promise.reject(unauthorized(config)))
      .mockImplementationOnce((config) => Promise.reject(unauthorized(config)))
      .mockImplementationOnce((config) =>
        Promise.resolve(okResponse(config, 'first retried'))
      )
      .mockImplementationOnce((config) =>
        Promise.resolve(okResponse(config, 'second retried'))
      )
    api.defaults.adapter = adapter

    const first = api.get('/clients')
    const second = api.get('/products')

    await vi.waitFor(() => expect(axios.post).toHaveBeenCalledTimes(1))

    resolveRefresh(okResponse({} as InternalAxiosRequestConfig, { ok: true }))

    await expect(first).resolves.toMatchObject({ data: 'first retried' })
    await expect(second).resolves.toMatchObject({ data: 'second retried' })
    expect(adapter).toHaveBeenCalledTimes(4)
  })

  it('rejects the queued requests when refresh fails', async () => {
    const api = await loadApi()
    let rejectRefresh: (reason: unknown) => void = () => {}
    const refreshError = new Error('refresh failed')
    vi.spyOn(axios, 'post').mockReturnValue(
      new Promise((_resolve, reject) => {
        rejectRefresh = reject
      })
    )
    const adapter = vi
      .fn<AxiosAdapter>()
      .mockImplementation((config) => Promise.reject(unauthorized(config)))
    api.defaults.adapter = adapter

    const first = api.get('/clients')
    const second = api.get('/products')
    const firstExpectation = expect(first).rejects.toBe(refreshError)
    const secondExpectation = expect(second).rejects.toBe(refreshError)

    await vi.waitFor(() => expect(axios.post).toHaveBeenCalledTimes(1))
    rejectRefresh(refreshError)

    await firstExpectation
    await secondExpectation
    expect(adapter).toHaveBeenCalledTimes(2)
  })

  it('does not retry non-401 errors or requests that already retried', async () => {
    const api = await loadApi()
    const serverError = new AxiosError(
      'Server error',
      'ERR_BAD_RESPONSE',
      { url: '/clients' } as InternalAxiosRequestConfig,
      undefined,
      {
        data: {},
        status: 500,
        statusText: 'Server Error',
        headers: {},
        config: { url: '/clients' } as InternalAxiosRequestConfig,
      }
    )
    const retriedError = unauthorized({
      url: '/clients',
      _retry: true,
    } as InternalAxiosRequestConfig & { _retry: boolean })
    const adapter = vi
      .fn<AxiosAdapter>()
      .mockRejectedValueOnce(serverError)
      .mockRejectedValueOnce(retriedError)
    api.defaults.adapter = adapter
    const refresh = vi.spyOn(axios, 'post')

    await expect(api.get('/clients')).rejects.toBe(serverError)
    await expect(api.get('/clients')).rejects.toBe(retriedError)
    expect(refresh).not.toHaveBeenCalled()
    expect(adapter).toHaveBeenCalledTimes(2)
  })
})
