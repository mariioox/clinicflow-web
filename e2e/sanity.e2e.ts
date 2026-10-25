import { test, expect } from '@playwright/test'

test.describe('Harness Sanity & Application Shell Verification', () => {
  test('landing page renders successfully with accessible landmarks and navigation CTAs', async ({
    page,
  }) => {
    // Navigate to root (Vite dev server)
    await page.goto('/')

    // Verify document title matches ClinicFlow branding
    await expect(page).toHaveTitle(/ClinicFlow/i)

    // Verify main brand heading level 1
    const mainHeading = page.getByRole('heading', {
      level: 1,
      name: /Welcome to ClinicFlow/i,
    })
    await expect(mainHeading).toBeVisible()

    // Verify Choice 1: "Book a visit" CTA link and destination
    const bookVisitLink = page.getByRole('link', { name: /Book a visit/i })
    await expect(bookVisitLink).toBeVisible()
    await expect(bookVisitLink).toHaveAttribute('href', '/book')

    // Verify Choice 2: "Check my booking" CTA link and destination
    const checkBookingLink = page.getByRole('link', { name: /Check my booking/i })
    await expect(checkBookingLink).toBeVisible()
    await expect(checkBookingLink).toHaveAttribute('href', '/track')

    // Verify Staff Portal access link and destination
    const staffLoginLink = page.getByRole('link', { name: /Staff Login/i })
    await expect(staffLoginLink).toBeVisible()
    await expect(staffLoginLink).toHaveAttribute('href', '/staff/login')
  })

  test("clicking 'Book a visit' navigates cleanly to the booking route", async ({ page }) => {
    await page.goto('/')

    const bookVisitLink = page.getByRole('link', { name: /Book a visit/i })
    await bookVisitLink.click()

    // Verify URL transitions to /book without page reload error
    await expect(page).toHaveURL(/\/book$/)

    // Verify booking route heading is displayed
    const bookHeading = page.getByRole('heading', { name: /Book an Appointment/i })
    await expect(bookHeading).toBeVisible()
  })

  test("clicking 'Check my booking' navigates cleanly to the tracking route", async ({ page }) => {
    await page.goto('/')

    const checkBookingLink = page.getByRole('link', { name: /Check my booking/i })
    await checkBookingLink.click()

    // Verify URL transitions to /track
    await expect(page).toHaveURL(/\/track$/)
  })

  test("clicking 'Staff Login' navigates cleanly to the staff login route", async ({ page }) => {
    await page.goto('/')

    const staffLoginLink = page.getByRole('link', { name: /Staff Login/i })
    await staffLoginLink.click()

    // Verify URL transitions to /staff/login
    await expect(page).toHaveURL(/\/staff\/login$/)
  })
})
