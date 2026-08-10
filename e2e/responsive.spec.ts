import { expect, test } from '@playwright/test'
import {
  addAccount,
  createConfirmedUser,
  deleteUser,
  login,
  type TestUser,
} from './support'

let user: TestUser | undefined

test.beforeAll(async ({}, testInfo) => {
  if (testInfo.project.name !== 'mobile') return
  user = await createConfirmedUser('responsive')
})

test.afterAll(async () => {
  if (user) await deleteUser(user.id)
})

test('navbar stays fixed and Accounts remains vertically scrollable on phones', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Runs with the mobile browser profile')
  if (!user) throw new Error('Responsive test user was not created')

  await login(page, user)
  await addAccount(page, 'Mobile bank', 'bank', '50000')

  for (const viewport of [
    { width: 390, height: 664 }, // iPhone 13 CSS viewport
    { width: 412, height: 915 }, // common modern Android viewport
  ]) {
    await page.setViewportSize(viewport)
    await page.goto('/accounts')
    await expect(page.getByRole('heading', { name: 'Accounts', level: 1 })).toBeVisible()
    // Simulate a populated transaction history without coupling this layout
    // regression to transaction creation. If any ancestor blocks page scroll,
    // the increased content height still will not move the viewport.
    await page.locator('.accounts-viewport').evaluate((element) => {
      (element as HTMLElement).style.minHeight = '1200px'
    })

    const nav = page.getByRole('navigation', { name: 'Primary' })
    await expect(nav).toBeVisible()
    await expect(nav).toHaveCSS('position', 'fixed')

    const before = await nav.boundingBox()
    expect(before).not.toBeNull()
    expect(before!.y + before!.height).toBeLessThanOrEqual(viewport.height)

    const pageCanScroll = await page.evaluate(
      () => document.documentElement.scrollHeight > window.innerHeight
    )
    expect(pageCanScroll).toBe(true)

    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0)

    const after = await nav.boundingBox()
    expect(after).not.toBeNull()
    expect(Math.abs(after!.y - before!.y)).toBeLessThan(2)
  }
})
