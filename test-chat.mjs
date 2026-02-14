import { chromium } from 'playwright'

async function testGlobalChat() {
  console.log('Starting browser...')
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  try {
    // Test 1: Home page with chat button
    console.log('Testing home page...')
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' })
    await page.screenshot({ path: '/tmp/01-home-with-chat-button.png', fullPage: true })
    console.log('✓ Screenshot saved: /tmp/01-home-with-chat-button.png')

    // Test 2: Open chat window
    console.log('Opening chat window...')
    await page.click('button[aria-label="Open chat with project manager"]')
    await page.waitForTimeout(1000)
    await page.screenshot({ path: '/tmp/02-chat-window-open.png', fullPage: true })
    console.log('✓ Screenshot saved: /tmp/02-chat-window-open.png')

    // Test 3: Close chat window
    console.log('Closing chat window...')
    await page.click('button[aria-label="Close chat"]')
    await page.waitForTimeout(500)
    await page.screenshot({ path: '/tmp/03-chat-window-closed.png', fullPage: true })
    console.log('✓ Screenshot saved: /tmp/03-chat-window-closed.png')

    // Test 4: Login page with chat button
    console.log('Testing login page...')
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' })
    await page.screenshot({ path: '/tmp/04-login-with-chat-button.png', fullPage: true })
    console.log('✓ Screenshot saved: /tmp/04-login-with-chat-button.png')

    // Test 5: Agents page (might redirect to login)
    console.log('Testing agents page...')
    await page.goto('http://localhost:3000/agents', { waitUntil: 'networkidle' })
    await page.screenshot({ path: '/tmp/05-agents-page.png', fullPage: true })
    console.log('✓ Screenshot saved: /tmp/05-agents-page.png')

    console.log('\n✅ All tests completed successfully!')
    console.log('\nScreenshots saved in /tmp/')
    console.log('  - 01-home-with-chat-button.png')
    console.log('  - 02-chat-window-open.png')
    console.log('  - 03-chat-window-closed.png')
    console.log('  - 04-login-with-chat-button.png')
    console.log('  - 05-agents-page.png')

  } catch (error) {
    console.error('Error during testing:', error)
  } finally {
    await browser.close()
  }
}

testGlobalChat()
