import { z } from 'zod'
import { type Company } from './schema'
import {
  formatCnpj as _formatCnpj,
  formatPhone as _formatPhone,
  formatZipCode as _formatZipCode,
} from '@/lib/formatters'

export { _formatCnpj as formatCnpj, _formatPhone as formatPhone, _formatZipCode as formatZipCode }

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
  whatsapp: '',
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
    whatsapp: company.whatsapp,
  }
}
