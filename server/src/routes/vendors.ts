import { createContactRoutes } from '../lib/contact-routes.js'

const vendorRoutes = createContactRoutes({
  model: 'vendor',
  entityName: 'Fornecedor',
  responseKey: 'vendor',
  pluralResponseKey: 'vendors',
})

export { vendorRoutes }
