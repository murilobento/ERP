import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { authRoutes } from './routes/auth'
import { userRoutes } from './routes/users'
import { clientRoutes } from './routes/clients'
import { supplyRoutes } from './routes/supplies'
import { productRoutes } from './routes/products'
import { productionRoutes } from './routes/productions'
import { stockRoutes } from './routes/stock'
import { purchaseRoutes } from './routes/purchases'
import prisma from './lib/prisma'
import { hashPassword } from './lib/auth'

const app = new Hono()

app.use('*', logger())
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
app.route('/api/supplies', supplyRoutes)
app.route('/api/products', productRoutes)
app.route('/api/productions', productionRoutes)
app.route('/api/stock', stockRoutes)
app.route('/api/purchases', purchaseRoutes)

app.get('/api/health', (c) => c.json({ status: 'ok' }))

const port = Number(process.env.PORT) || 3001

async function seedDefaultUser() {
  const existing = await prisma.user.findUnique({ where: { email: 'admin@admin.com' } })
  if (!existing) {
    const hashed = await hashPassword('admin123')
    await prisma.user.create({
      data: { email: 'admin@admin.com', password: hashed, firstName: 'Admin', lastName: 'Sistema' },
    })
    console.log('Default user created: admin@admin.com / admin123')
  }
}

seedDefaultUser().finally(() => {
  console.log(`Server running on http://localhost:${port}`)
  serve({ fetch: app.fetch, port })
})
