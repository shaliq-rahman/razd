import { test, expect } from '@playwright/test'
import {
  createConfirmedUser,
  deleteUser,
  login,
  addAccount,
  addTransaction,
  type TestUser,
} from './support'

let user: TestUser

test.beforeAll(async () => {
  user = await createConfirmedUser('money')
})

test.afterAll(async () => {
  await deleteUser(user.id)
})

test('a new account seeds default categories and an empty home screen', async ({ page }) => {
  await login(page, user)
  await expect(page.getByText('No accounts yet')).toBeVisible()
  await expect(page.getByText('Nothing logged yet')).toBeVisible()
})

test('total balance sums every account, and the info sheet agrees with it', async ({ page }) => {
  await login(page, user)
  await addAccount(page, 'HDFC', 'bank', '50000')
  await addAccount(page, 'Cash', 'cash', '2000')

  await page.goto('/')
  await expect(page.getByTestId('total-balance')).toHaveText('₹52,000.00')

  await page.getByRole('button', { name: 'Show balance by account' }).click()
  const sheet = page.getByRole('dialog', { name: 'Balance by account' })
  await expect(sheet).toBeVisible()
  await expect(sheet.getByText('HDFC')).toBeVisible()
  await expect(sheet.getByText('₹50,000.00')).toBeVisible()
  await expect(sheet.getByText('₹2,000.00')).toBeVisible()

  // The breakdown total must equal the headline total — they come from one query.
  await expect(page.getByTestId('breakdown-total')).toHaveText('₹52,000.00')

  await page.keyboard.press('Escape')
  await expect(sheet).toBeHidden()
})

test('logging an expense lowers the derived total by exactly that amount', async ({ page }) => {
  await login(page, user)
  await addTransaction(page, { amount: '500', kind: 'expense', category: 'Food', note: 'Lunch' })

  await expect(page.getByTestId('total-balance')).toHaveText('₹51,500.00')
  await expect(page.getByText('Lunch')).toBeVisible()
})

test('logging income raises the derived total', async ({ page }) => {
  await login(page, user)
  await addTransaction(page, { amount: '1500', kind: 'income', category: 'Salary' })

  await expect(page.getByTestId('total-balance')).toHaveText('₹53,000.00')
})

test('spending is grouped by category on the stats screen', async ({ page }) => {
  await login(page, user)
  await page.goto('/stats')

  await expect(page.getByTestId('total-spent')).toHaveText('₹500.00')
  await expect(page.getByText('Food')).toBeVisible()
  await expect(page.getByText('100%')).toBeVisible()
})

test('history lists transactions grouped by day', async ({ page }) => {
  await login(page, user)
  await page.goto('/transactions')

  await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible()
  await expect(page.getByText('Lunch')).toBeVisible()
  await expect(page.getByText('+₹1,500.00')).toBeVisible()
})

test('hiding amounts survives a reload', async ({ page }) => {
  await login(page, user)
  await page.getByRole('button', { name: 'Hide amounts' }).click()
  await expect(page.getByTestId('total-balance')).toHaveText('••••••')

  await page.reload()
  await expect(page.getByTestId('total-balance')).toHaveText('••••••')

  await page.getByRole('button', { name: 'Show amounts' }).click()
  await expect(page.getByTestId('total-balance')).toHaveText('₹53,000.00')
})

test('every bottom-nav tab reaches its screen', async ({ page }) => {
  await login(page, user)

  for (const [tab, heading] of [
    ['Accounts', 'Accounts'],
    ['Add', 'Add transaction'],
    ['Bills', 'Recurring payments'],
    ['Profile', 'Profile'],
    ['Home', 'Your money'],
  ] as const) {
    await page.getByRole('link', { name: tab, exact: true }).click()
    await expect(page.getByRole('heading', { name: heading, level: 1 })).toBeVisible()
  }
})

test('deleting an account removes its balance from the total', async ({ page }) => {
  await login(page, user)
  await page.goto('/accounts')

  // The wallet is a carousel: pick the account, then edit the selected one.
  await page.getByRole('button', { name: 'Select Cash' }).click()
  await page.getByRole('button', { name: 'Edit Cash' }).click()
  await page.getByRole('button', { name: 'Delete account' }).click()
  await page.getByRole('button', { name: 'Delete', exact: true }).click()
  await page.getByRole('dialog').waitFor({ state: 'detached' })

  await page.goto('/')
  await expect(page.getByTestId('total-balance')).toHaveText('₹51,000.00')
})
