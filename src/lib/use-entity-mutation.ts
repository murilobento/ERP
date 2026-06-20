import { useState } from 'react'
import { type QueryKey, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { handleServerError } from '@/lib/handle-server-error'

type EntityMutationOptions<T> = {
  mutation: () => Promise<T>
  invalidate?: QueryKey[]
  successMessage?: string
  onSuccess?: (data: T) => void
}

export function useEntityMutation() {
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(false)

  async function run<T>(options: EntityMutationOptions<T>): Promise<void> {
    setIsLoading(true)
    try {
      const data = await options.mutation()
      options.invalidate?.forEach((key) =>
        queryClient.invalidateQueries({ queryKey: key })
      )
      if (options.successMessage) {
        toast.success(options.successMessage)
      }
      options.onSuccess?.(data)
    } catch (error: unknown) {
      handleServerError(error)
    } finally {
      setIsLoading(false)
    }
  }

  return { run, isLoading }
}
