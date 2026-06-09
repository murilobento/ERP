export type Contact = {
  id: string
  name: string
  phone: string
  zipCode: string
  street: string
  number: string
  complement: string
  neighborhood: string
  city: string
  state: string
  status: string
  createdAt: string
  updatedAt: string
}

export type ContactConfig = {
  entityLabel: string
  entityLabelLower: string
  endpoint: string
  queryKey: string
  formId: string
  namePlaceholder: string
  entityPlural: string
}
