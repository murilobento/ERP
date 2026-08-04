import 'dotenv/config'
/* eslint-disable no-console */
import prisma from '../server/src/lib/prisma'
import { hashPassword } from '../server/src/lib/auth'

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@admin.com'
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'admin123'
  const firstName = process.env.SEED_ADMIN_FIRST_NAME ?? 'Admin'
  const lastName = process.env.SEED_ADMIN_LAST_NAME ?? 'Sistema'

  if (process.env.NODE_ENV === 'production' && password === 'admin123') {
    throw new Error(
      'SEED_ADMIN_PASSWORD must be set to a non-default value in production.'
    )
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    console.log(`Admin user already exists: ${email}`)
    return
  }

  const hashed = await hashPassword(password)
  await prisma.user.create({
    data: {
      email,
      password: hashed,
      firstName,
      lastName,
      role: 'admin',
    },
  })

  console.log(`Default admin created: ${email}`)
}

seedAdmin()
  .catch((error) => {
    console.error('Failed to seed admin user:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
