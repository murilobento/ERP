import 'dotenv/config'
/* eslint-disable no-console */
import { serve } from '@hono/node-server'
import { app } from './app'
import prisma from './lib/prisma'
import { hashPassword } from './lib/auth'

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

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    await seedDefaultUser()
  }

  console.log(`Server running on http://localhost:${port}`)
  const server = serve({ fetch: app.fetch, port })

  async function shutdown(signal: NodeJS.Signals) {
    console.log(`${signal} received, shutting down...`)
    server.close()
    await prisma.$disconnect()
    process.exit(0)
  }

  process.once('SIGINT', shutdown)
  process.once('SIGTERM', shutdown)
}

startServer()
