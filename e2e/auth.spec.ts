import { test, expect } from '@playwright/test'
import { createConfirmedUser, deleteUser, login, addAccount } from './support'

test('signed-out visitors are redirected to login', async ({ page }) => {
  for (const path of ['/', '/accounts', '/add', '/stats', '/profile', '/transactions']) {
    await page.goto(path)
    await expect(page).toHaveURL('/login')
  }
})

test('the signup form rejects a short password before submitting', async ({ page }) => {
  await page.goto('/signup')
  await page.getByPlaceholder('Email').fill('someone@example.com')
  await page.getByPlaceholder(/^Password/).fill('short')
  await page.getByRole('button', { name: 'Create account' }).click()

  // Scope to the form: Next's route announcer is also role=alert.
  await expect(page.locator('form').getByRole('alert')).toContainText('at least 8 characters')
})

test('signing in with the wrong password shows a plain-language error', async ({ page }) => {
  const user = await createConfirmedUser('wrongpw')
  try {
    await page.goto('/login')
    await page.getByPlaceholder('Email').fill(user.email)
    await page.getByPlaceholder('Password').fill('definitely-not-it')
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page.locator('form').getByRole('alert')).toHaveText('Wrong email or password.')
    await expect(page).toHaveURL('/login')
  } finally {
    await deleteUser(user.id)
  }
})

test('one user cannot see another user\'s data', async ({ browser }) => {
  const owner = await createConfirmedUser('owner')
  const stranger = await createConfirmedUser('stranger')

  try {
    const ownerCtx = await browser.newContext()
    const ownerPage = await ownerCtx.newPage()
    await login(ownerPage, owner)
    await addAccount(ownerPage, 'Private Savings', 'bank', '99000')
    await ownerPage.goto('/')
    await expect(ownerPage.getByTestId('total-balance')).toHaveText('₹99,000.00')

    const strangerCtx = await browser.newContext()
    const strangerPage = await strangerCtx.newPage()
    await login(strangerPage, stranger)

    // Row Level Security isolates this in the database, not in the UI.
    await strangerPage.goto('/accounts')
    await expect(strangerPage.getByText('Private Savings')).toHaveCount(0)
    await expect(strangerPage.getByText('No accounts yet')).toBeVisible()

    await ownerCtx.close()
    await strangerCtx.close()
  } finally {
    await deleteUser(owner.id)
    await deleteUser(stranger.id)
  }
})

test('signing out ends the session', async ({ page }) => {
  const user = await createConfirmedUser('signout')
  try {
    await login(page, user)
    await page.goto('/profile')
    await page.getByRole('button', { name: 'Sign out' }).click()
    await expect(page).toHaveURL('/login')

    await page.goto('/')
    await expect(page).toHaveURL('/login')
  } finally {
    await deleteUser(user.id)
  }
})
