import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { type UseFormReturn, type FieldValues } from 'react-hook-form'

export function useCepLookup<TFieldValues extends FieldValues = FieldValues>(
  form: UseFormReturn<TFieldValues>,
) {
  const [isLoadingCep, setIsLoadingCep] = useState(false)

  const fetchCep = useCallback(
    async (rawCep: string) => {
      const cep = rawCep.replace(/\D/g, '')
      if (cep.length !== 8) return

      setIsLoadingCep(true)
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
        const data = await res.json()

        if (data.erro) {
          toast.error('CEP não encontrado.')
          return
        }

        form.setValue('street', data.logradouro || '')
        form.setValue('neighborhood', data.bairro || '')
        form.setValue('city', data.localidade || '')
        form.setValue('state', data.uf || '')
      } catch {
        toast.error('Erro ao buscar CEP.')
      } finally {
        setIsLoadingCep(false)
      }
    },
    [form],
  )

  return { fetchCep, isLoadingCep }
}
