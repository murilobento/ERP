import { Building2, ImageIcon, Loader2, MapPin } from 'lucide-react'
import { type UseFormReturn } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  type CompanyForm,
  formatCnpj,
  formatPhone,
  formatZipCode,
} from '../data/form'

type CompanyFormSectionProps = {
  form: UseFormReturn<CompanyForm>
}

export function CompanyBasicDataForm({ form }: CompanyFormSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados básicos</CardTitle>
        <CardDescription>
          Informações principais para identificar a empresa.
        </CardDescription>
      </CardHeader>
      <CardContent className='grid gap-4 md:grid-cols-2'>
        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da empresa</FormLabel>
              <FormControl>
                <Input
                  placeholder='Empresa Exemplo Ltda'
                  autoComplete='off'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='tradeName'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome fantasia</FormLabel>
              <FormControl>
                <Input
                  placeholder='Empresa Exemplo'
                  autoComplete='off'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='cnpj'
          render={({ field }) => (
            <FormItem>
              <FormLabel>CNPJ</FormLabel>
              <FormControl>
                <Input
                  placeholder='00.000.000/0000-00'
                  autoComplete='off'
                  value={field.value}
                  onChange={(event) =>
                    field.onChange(formatCnpj(event.target.value))
                  }
                />
              </FormControl>
              <FormDescription>Opcional.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail</FormLabel>
              <FormControl>
                <Input
                  placeholder='contato@empresa.com'
                  autoComplete='off'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='phone'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefone</FormLabel>
              <FormControl>
                <Input
                  placeholder='(11) 99999-9999'
                  autoComplete='off'
                  value={field.value}
                  onChange={(event) =>
                    field.onChange(formatPhone(event.target.value))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='logoUrl'
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL da logo</FormLabel>
              <FormControl>
                <Input placeholder='https://...' autoComplete='off' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  )
}

type CompanyAddressFormProps = CompanyFormSectionProps & {
  isLoadingCep: boolean
  onFetchCep: (cep: string) => void
}

export function CompanyAddressForm({
  form,
  isLoadingCep,
  onFetchCep,
}: CompanyAddressFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Endereço</CardTitle>
        <CardDescription>Dados de localização da empresa.</CardDescription>
      </CardHeader>
      <CardContent className='grid gap-4 md:grid-cols-2'>
        <FormField
          control={form.control}
          name='zipCode'
          render={({ field }) => (
            <FormItem>
              <FormLabel>CEP</FormLabel>
              <div className='flex items-center gap-2'>
                <FormControl>
                  <Input
                    placeholder='00000-000'
                    autoComplete='off'
                    value={field.value}
                    onChange={(event) =>
                      field.onChange(formatZipCode(event.target.value))
                    }
                    onBlur={() => {
                      if (field.value) onFetchCep(field.value)
                    }}
                  />
                </FormControl>
                <Button
                  type='button'
                  variant='outline'
                  size='icon'
                  className='shrink-0'
                  disabled={isLoadingCep}
                  onClick={() => {
                    if (field.value) onFetchCep(field.value)
                  }}
                >
                  {isLoadingCep ? (
                    <Loader2 className='animate-spin' />
                  ) : (
                    <MapPin />
                  )}
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='street'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rua</FormLabel>
              <FormControl>
                <Input placeholder='Rua Exemplo' autoComplete='off' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='number'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número</FormLabel>
              <FormControl>
                <Input placeholder='123' autoComplete='off' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='complement'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Complemento</FormLabel>
              <FormControl>
                <Input placeholder='Sala 2' autoComplete='off' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='neighborhood'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bairro</FormLabel>
              <FormControl>
                <Input placeholder='Centro' autoComplete='off' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className='grid gap-4 sm:grid-cols-[1fr_6rem]'>
          <FormField
            control={form.control}
            name='city'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cidade</FormLabel>
                <FormControl>
                  <Input placeholder='São Paulo' autoComplete='off' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='state'
            render={({ field }) => (
              <FormItem>
                <FormLabel>UF</FormLabel>
                <FormControl>
                  <Input
                    placeholder='SP'
                    maxLength={2}
                    autoComplete='off'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  )
}

export function CompanySocialLinksForm({ form }: CompanyFormSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Redes sociais</CardTitle>
        <CardDescription>
          Canais digitais que podem ser usados em documentos futuros.
        </CardDescription>
      </CardHeader>
      <CardContent className='grid gap-4 md:grid-cols-2'>
        <FormField
          control={form.control}
          name='website'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Site</FormLabel>
              <FormControl>
                <Input
                  placeholder='https://empresa.com'
                  autoComplete='off'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='instagram'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Instagram</FormLabel>
              <FormControl>
                <Input placeholder='@empresa' autoComplete='off' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='facebook'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Facebook</FormLabel>
              <FormControl>
                <Input
                  placeholder='facebook.com/empresa'
                  autoComplete='off'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='linkedin'
          render={({ field }) => (
            <FormItem>
              <FormLabel>LinkedIn</FormLabel>
              <FormControl>
                <Input
                  placeholder='linkedin.com/company/empresa'
                  autoComplete='off'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='whatsapp'
          render={({ field }) => (
            <FormItem>
              <FormLabel>WhatsApp</FormLabel>
              <FormControl>
                <Input
                  placeholder='(11) 99999-9999'
                  autoComplete='off'
                  value={field.value}
                  onChange={(event) =>
                    field.onChange(formatPhone(event.target.value))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  )
}

export function CompanyLogoPreview({ logoUrl }: { logoUrl: string }) {
  return (
    <Card className='h-fit'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Building2 className='size-5' />
          Identidade
        </CardTitle>
        <CardDescription>Prévia da logo informada por URL.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='flex aspect-video items-center justify-center overflow-hidden rounded-md border bg-muted/40'>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt='Logo da empresa'
              className='max-h-full max-w-full object-contain p-4'
            />
          ) : (
            <div className='flex flex-col items-center gap-2 text-muted-foreground'>
              <ImageIcon className='size-8' />
              <span className='text-sm'>Sem logo</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
