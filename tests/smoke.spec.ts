import { test, expect } from '@playwright/test'

test('unauthenticated visitors are redirected to the login screen', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))

  await page.goto('/')

  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible()
  await expect(page.locator('input[type="email"]')).toBeVisible()
  await expect(page.locator('input[type="password"]')).toBeVisible()
  expect(errors).toEqual([])
})

test('signup screen renders', async ({ page }) => {
  await page.goto('/signup')
  await expect(page.locator('input[type="password"]').first()).toBeVisible()
})
