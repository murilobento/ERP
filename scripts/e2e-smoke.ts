/* eslint-disable no-console */
import { chromium, type ConsoleMessage } from 'playwright'

const baseUrl = process.env.E2E_BASE_URL || 'http://localhost:5173'
const email = process.env.E2E_EMAIL || 'admin@admin.com'
const password = process.env.E2E_PASSWORD || 'admin123'

async function assertAppIsReachable() {
  try {
    const response = await fetch(baseUrl)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
  } catch (error) {
    throw new Error(
      `E2E app is not reachable at ${baseUrl}. Start the app with "npm run dev" before running test:e2e.`,
      { cause: error }
    )
  }
}

async function main() {
  await assertAppIsReachable()

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const consoleErrors: ConsoleMessage[] = []

  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message)
    }
  })

  try {
    await page.goto(`${baseUrl}/sign-in`, { waitUntil: 'networkidle' })
    await page.getByLabel('E-mail').fill(email)
    await page.getByLabel('Senha').fill(password)
    await page.getByRole('button', { name: 'Entrar' }).click()

    await page.waitForURL((url) => !url.pathname.includes('/sign-in'), {
      timeout: 15000,
    })
    await page.getByRole('heading', { name: 'Painel' }).waitFor({
      timeout: 15000,
    })

    if (consoleErrors.length > 0) {
      throw new Error(
        `Browser console errors detected:\n${consoleErrors
          .map((message) => `- ${message.text()}`)
          .join('\n')}`
      )
    }

    console.log('E2E smoke passed: sign-in redirects to authenticated dashboard.')
  } finally {
    await browser.close()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
