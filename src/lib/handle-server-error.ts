import { AxiosError } from 'axios'
import { toast } from 'sonner'

function getErrorResponseData(error: unknown): { title?: string; error?: string } | undefined {
  if (
    error &&
    typeof error === 'object' &&
    'response' in error &&
    error.response &&
    typeof error.response === 'object' &&
    'data' in error.response
  ) {
    return error.response.data as { title?: string; error?: string }
  }
  return undefined
}

export function getServerError(error: unknown): string {
  let errMsg = 'Algo deu errado!'

  if (
    error &&
    typeof error === 'object' &&
    'status' in error &&
    Number(error.status) === 204
  ) {
    return 'Sem conteúdo.'
  }

  if (error instanceof AxiosError) {
    const data = error.response?.data as
      | { title?: string; error?: string }
      | undefined
    const title = data?.title
    const errorMsg = data?.error
    if (typeof title === 'string' && title.length > 0) {
      errMsg = title
    } else if (typeof errorMsg === 'string' && errorMsg.length > 0) {
      errMsg = errorMsg
    }
  } else {
    const data = getErrorResponseData(error)
    const title = data?.title
    const errorMsg = data?.error
    if (typeof title === 'string' && title.length > 0) {
      errMsg = title
    } else if (typeof errorMsg === 'string' && errorMsg.length > 0) {
      errMsg = errorMsg
    }
  }

  return errMsg
}

export function handleServerError(error: unknown) {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log(error)
  }

  toast.error(getServerError(error))
}
