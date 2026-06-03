import { z } from 'zod'
import { type Company } from './schema'

const optionalUrl = z
  .string()
  .trim()
  .refine((value) => !value || z.url().safeParse(value).success, {
    message: 'Informe uma URL válida.',
  })

export const companyFormSchema = z.object({
  name: z.string().trim().min(1, 'Nome da empresa é obrigatório.'),
  tradeName: z.string(),
  cnpj: z.string(),
  email: z
    .string()
    .trim()
    .refine((value) => !value || z.email().safeParse(value).success, {
      message: 'Informe um e-mail válido.',
    }),
  phone: z.string(),
  logoUrl: optionalUrl,
  zipCode: z.string(),
  street: z.string(),
  number: z.string(),
  complement: z.string(),
  neighborhood: z.string(),
  city: z.string(),
  state: z.string(),
  website: optionalUrl,
  instagram: z.string(),
  facebook: z.string(),
  linkedin: z.string(),
  whatsapp: z.string(),
})

export type CompanyForm = z.infer<typeof companyFormSchema>

export const emptyCompanyValues: CompanyForm = {
  name: '',
  tradeName: '',
  cnpj: '',
  email: '',
  phone: '',
  logoUrl: '',
  zipCode: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  website: '',
  instagram: '',
  facebook: '',
  linkedin: '',
  whatsapp: '',
}

export function formatCnpj(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 14)
  if (digits.length <= 2) return digits
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`
  if (digits.length <= 8) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`
  }
  if (digits.length <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`
  }
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`
}

export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits.length ? `(${digits}` : ''
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export function formatZipCode(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

export function toCompanyFormValues(company: Company | null): CompanyForm {
  if (!company) return emptyCompanyValues

  return {
    name: company.name,
    tradeName: company.tradeName,
    cnpj: company.cnpj,
    email: company.email,
    phone: company.phone,
    logoUrl: company.logoUrl,
    zipCode: company.zipCode,
    street: company.street,
    number: company.number,
    complement: company.complement,
    neighborhood: company.neighborhood,
    city: company.city,
    state: company.state,
    website: company.website,
    instagram: company.instagram,
    facebook: company.facebook,
    linkedin: company.linkedin,
    whatsapp: company.whatsapp,
  }
}
