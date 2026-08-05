import { getRequestListener } from '@hono/node-server'
import { app } from '../server/src/app.js'

export const runtime = 'nodejs'
export const maxDuration = 10

export default getRequestListener(app.fetch)
