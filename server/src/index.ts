import 'dotenv/config'
/* eslint-disable no-console */
/**
 * Local long-running server entrypoint.
 * Production on Vercel uses api/[[...route]].ts via hono/vercel.
 */
import { serve } from '@hono/node-server'
import { app } from './app'
import prisma from './lib/prisma'

const port = Number(process.env.PORT) || 3001

async function startServer() {
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
