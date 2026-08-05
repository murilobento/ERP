import { handle } from 'hono/vercel'
import { app } from '../server/src/app.js'

export const runtime = 'nodejs'
export const maxDuration = 10

const handler = handle(app)

export const GET = handler
export const POST = handler
export const PATCH = handler
export const PUT = handler
export const DELETE = handler
export const OPTIONS = handler
