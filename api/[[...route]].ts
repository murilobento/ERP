import { handle } from 'hono/vercel'
import { app } from '../server/src/app'

export const runtime = 'nodejs'
export const maxDuration = 10

export default handle(app)
