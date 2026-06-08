import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { authRoutes } from './routes/auth'
import { userRoutes } from './routes/users'
import { clientRoutes } from './routes/clients'
import { vendorRoutes } from './routes/vendors'
import { supplyRoutes } from './routes/supplies'
import { productRoutes } from './routes/products'
import { productionRoutes } from './routes/productions'
import { stockRoutes } from './routes/stock'
import { purchaseRoutes } from './routes/purchases'
import { saleRoutes } from './routes/sales'
import { categoryRoutes } from './routes/categories'
import { kitRoutes } from './routes/kits'
import { companyRoutes } from './routes/company'

export function createApp({ enableLogger = true } = {}) {
  const app = new Hono()

  if (enableLogger) {
    app.use('*', logger())
  }

  app.use(
    '/api/*',
    cors({
      origin: ['http://localhost:5173'],
      credentials: true,
    })
  )

  app.route('/api/auth', authRoutes)
  app.route('/api/users', userRoutes)
  app.route('/api/clients', clientRoutes)
  app.route('/api/vendors', vendorRoutes)
  app.route('/api/supplies', supplyRoutes)
  app.route('/api/products', productRoutes)
  app.route('/api/productions', productionRoutes)
  app.route('/api/stock', stockRoutes)
  app.route('/api/purchases', purchaseRoutes)
  app.route('/api/sales', saleRoutes)
  app.route('/api/categories', categoryRoutes)
  app.route('/api/kits', kitRoutes)
  app.route('/api/company', companyRoutes)

  app.get('/api/health', (c) => c.json({ status: 'ok' }))

  app.onError((_err, c) => {
    return c.json({ error: 'Erro interno do servidor.' }, 500)
  })

  return app
}

export const app = createApp()
