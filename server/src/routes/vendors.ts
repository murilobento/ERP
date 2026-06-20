import { createContactRoutes } from '../lib/contact-routes'

const vendorRoutes = createContactRoutes({
  model: 'vendor',
  entityName: 'Fornecedor',
  responseKey: 'vendor',
  pluralResponseKey: 'vendors',
})

export { vendorRoutes }
