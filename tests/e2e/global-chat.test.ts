import { test, expect } from '@playwright/test'

test.describe('Global Chat Component', () => {
  test('should display chat button on home page', async ({ page }) => {
    await page.goto('http://localhost:3000')

    // Check if chat button is visible
    const chatButton = page.locator('button[aria-label="Open chat with project manager"]')
    await expect(chatButton).toBeVisible()

    // Take screenshot
    await page.screenshot({ path: '/tmp/chat-button-home.png' })
  })

  test('should open chat window when button is clicked', async ({ page }) => {
    await page.goto('http://localhost:3000')

    // Click chat button
    const chatButton = page.locator('button[aria-label="Open chat with project manager"]')
    await chatButton.click()

    // Check if chat window is visible
    await expect(page.locator('h3:text("Project Manager")')).toBeVisible()

    // Check if iframe is loaded
    const iframe = page.locator('iframe[title="Project Manager Chat"]')
    await expect(iframe).toBeVisible()

    // Take screenshot
    await page.screenshot({ path: '/tmp/chat-window-open.png' })
  })

  test('should close chat window when close button is clicked', async ({ page }) => {
    await page.goto('http://localhost:3000')

    // Open chat
    const chatButton = page.locator('button[aria-label="Open chat with project manager"]')
    await chatButton.click()

    // Wait for chat window to be visible
    await expect(page.locator('h3:text("Project Manager")')).toBeVisible()

    // Click close button
    const closeButton = page.locator('button[aria-label="Close chat"]')
    await closeButton.click()

    // Chat window should be gone
    await expect(page.locator('h3:text("Project Manager")')).not.toBeVisible()

    // Chat button should be visible again
    await expect(chatButton).toBeVisible()

    // Take screenshot
    await page.screenshot({ path: '/tmp/chat-window-closed.png' })
  })

  test('should display chat button on agents page', async ({ page }) => {
    await page.goto('http://localhost:3000/agents')

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Check if chat button is visible
    const chatButton = page.locator('button[aria-label="Open chat with project manager"]')
    await expect(chatButton).toBeVisible()

    // Take screenshot
    await page.screenshot({ path: '/tmp/chat-button-agents.png' })
  })

  test('should display chat button on login page', async ({ page }) => {
    await page.goto('http://localhost:3000/login')

    // Check if chat button is visible
    const chatButton = page.locator('button[aria-label="Open chat with project manager"]')
    await expect(chatButton).toBeVisible()

    // Take screenshot
    await page.screenshot({ path: '/tmp/chat-button-login.png' })
  })
})
