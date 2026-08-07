import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Page } from '@playwright/test'

/**
 * Reads .env directly. Next.js loads it for the app, but Playwright's own process
 * does not, and the admin calls below need the service credentials.
 */
function env(): Record<string, string> {
  const raw = readFileSync(join(process.cwd(), '.env'), 'utf8')
  const out: Record<string, string> = {}
  for (const line of raw.split('\n')) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim())
    if (m) out[m[1]] = m[2]
  }
  return out
}

const { SUPABASE_URL, SUPABASE_SECRET_KEY } = env()

export type TestUser = { id: string; email: string; password: string }

const ADMIN_HEADERS = {
  apikey: SUPABASE_SECRET_KEY,
  Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
  'Content-Type': 'application/json',
}

/** Retries the admin call: the connection to Supabase occasionally times out. */
async function adminFetch(path: string, init: RequestInit, attempts = 3): Promise<Response> {
  let lastError: unknown
  for (let i = 0; i < attempts; i++) {
    try {
      return await fetch(`${SUPABASE_URL}${path}`, {
        ...init,
        headers: ADMIN_HEADERS,
        signal: AbortSignal.timeout(30_000),
      })
    } catch (err) {
      lastError = err
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)))
    }
  }
  throw new Error(`Admin request to ${path} failed after ${attempts} attempts: ${lastError}`)
}

/**
 * Creates a pre-confirmed user through the admin API.
 *
 * Signing up through the UI would be a better test of the real path, but Supabase
 * projects require email confirmation by default, so a UI signup yields no session
 * and the run cannot continue. Creating the user confirmed keeps these tests
 * runnable without weakening the project's auth settings. `signup.spec.ts` covers
 * the UI signup form itself.
 */
export async function createConfirmedUser(label: string): Promise<TestUser> {
  const email = `e2e-${label}-${process.pid}-${Math.floor(performance.now())}@razd.test`
  const password = 'e2e-password-1234'

  const res = await adminFetch('/auth/v1/admin/users', {
    method: 'POST',
    body: JSON.stringify({ email, password, email_confirm: true }),
  })

  const body = await res.json()
  if (!res.ok || !body.id) {
    throw new Error(`Could not create test user: ${JSON.stringify(body)}`)
  }
  return { id: body.id, email, password }
}

/** Removes the user and, by cascade, every row they own. */
export async function deleteUser(id: string): Promise<void> {
  await adminFetch(`/auth/v1/admin/users/${id}`, { method: 'DELETE' })
}

export async function login(page: Page, user: TestUser): Promise<void> {
  await page.goto('/login')
  await page.getByPlaceholder('Email').fill(user.email)
  await page.getByPlaceholder('Password').fill(user.password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL('/')
}

export async function addAccount(
  page: Page,
  name: string,
  type: string,
  openingBalance: string
): Promise<void> {
  await page.goto('/accounts')
  await page
    .getByRole('button', { name: /^\+ New$|Add your first account/ })
    .first()
    .click()
  await page.getByPlaceholder('Account name').fill(name)
  await page.locator('select[name=type]').selectOption(type)
  await page.getByLabel(/Opening balance/).fill(openingBalance)
  await page.getByRole('button', { name: 'Add account' }).click()
  await page.getByRole('dialog').waitFor({ state: 'detached' })
}

export async function addTransaction(
  page: Page,
  opts: { amount: string; kind: 'income' | 'expense'; category: string; note?: string }
): Promise<void> {
  await page.goto('/add')
  if (opts.kind === 'income') {
    await page.getByRole('button', { name: 'income', exact: true }).click()
  }
  await page.getByLabel('Amount').fill(opts.amount)
  await page.getByRole('button', { name: new RegExp(opts.category) }).click()
  if (opts.note) await page.getByPlaceholder('Note (optional)').fill(opts.note)
  await page.getByRole('button', { name: 'Save transaction' }).click()
  await page.waitForURL('/')
}
