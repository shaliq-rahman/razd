import { test, expect, type Page } from '@playwright/test'
import { createConfirmedUser, deleteUser, login, type TestUser } from './support'

let user: TestUser

test.beforeAll(async () => {
  user = await createConfirmedUser('recurring')
})

test.afterAll(async () => {
  await deleteUser(user.id)
})

/** A card with a 50,000 limit and 40,000 available, i.e. 10,000 outstanding. */
async function addCard(page: Page, name: string) {
  await page.goto('/accounts')
  await page
    .getByRole('button', { name: /^New$|Add your first account/ })
    .first()
    .click()
  await page.getByLabel('Account name').fill(name)
  await page.locator('select[name=type]').selectOption('card')
  await page.getByLabel('Total limit').fill('50000')
  await page.getByLabel('Due day').first().fill('5')
  await page.getByLabel('Opening balance').fill('40000')
  await page.getByRole('button', { name: 'Add account' }).click()
  await page.getByRole('dialog').waitFor({ state: 'detached' })
}

async function addPayment(page: Page, name: string, amount: string, dueDay: string) {
  await page.goto('/recurring')
  await page.getByRole('button', { name: 'Add' }).click()
  await page.getByLabel('Name').fill(name)
  await page.getByLabel('Amount').fill(amount)
  await page.getByLabel('Due day').fill(dueDay)
  await page.locator('select[name=account_id]').selectOption({ label: 'EMI Card' })
  await page.getByLabel('Ends on').fill('2030-12-31')
  await page.getByRole('button', { name: 'Add payment' }).click()
  await page.getByRole('dialog').waitFor({ state: 'detached' })
}

function cardOutstanding(page: Page) {
  return page
    .locator('li', { hasText: 'EMI Card' })
    .locator('[data-testid^="card-outstanding-"]')
    .first()
}

/**
 * Puts the payment into the wanted state, whatever it was left in. Each test
 * then starts from a known point instead of depending on the previous one.
 */
async function ensurePaid(page: Page, paid: boolean) {
  await page.goto('/recurring')
  const settle = page.getByRole('button', { name: /Mark paid|Pay early/ }).first()
  const undo = page.getByRole('button', { name: 'Mark unpaid' }).first()

  // count() does not auto-wait, so wait for whichever control rendered before
  // deciding. Without this the helper silently does nothing on a slow render.
  await settle.or(undo).waitFor({ state: 'visible' })

  if (paid && (await settle.isVisible())) {
    await settle.click()
    await expect(undo).toBeVisible()
  } else if (!paid && (await undo.isVisible())) {
    await undo.click()
    await expect(settle).toBeVisible()
  }
}

test('a payment repeats monthly on a chosen day', async ({ page }) => {
  await login(page, user)
  await addCard(page, 'EMI Card')
  await addPayment(page, 'Card EMI', '2000', '5')

  await expect(page.getByText('5th of every month').first()).toBeVisible()
  await expect(page.getByTestId('total-due')).toHaveText('₹2,000.00')
  await expect(cardOutstanding(page)).toHaveText('₹10,000.00')
})

test('marking it paid reduces both the total due and the card outstanding', async ({ page }) => {
  await login(page, user)
  await ensurePaid(page, false)
  await expect(page.getByTestId('total-due')).toHaveText('₹2,000.00')
  await expect(cardOutstanding(page)).toHaveText('₹10,000.00')

  await page.getByRole('button', { name: /Mark paid|Pay early/ }).first().click()

  await expect(page.getByTestId('total-due')).toHaveText('₹0.00')
  await expect(cardOutstanding(page)).toHaveText('₹8,000.00')
  await expect(page.getByText(/^Paid for /)).toBeVisible()
})

test('un-marking it restores both figures', async ({ page }) => {
  await login(page, user)
  await ensurePaid(page, true)

  await page.getByRole('button', { name: 'Mark unpaid' }).first().click()

  await expect(page.getByTestId('total-due')).toHaveText('₹2,000.00')
  await expect(cardOutstanding(page)).toHaveText('₹10,000.00')
})

test('settling a payment shows up as a real transaction', async ({ page }) => {
  await login(page, user)
  await ensurePaid(page, true)

  // The outstanding moved because an actual repayment was recorded, not a flag.
  await page.goto('/transactions')
  await expect(page.getByText('Card EMI').first()).toBeVisible()
})
