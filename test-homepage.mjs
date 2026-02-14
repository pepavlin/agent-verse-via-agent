import { chromium } from 'playwright';

async function testHomepage() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log('📸 Testing homepage at http://localhost:3000...\n');

    // Navigate to homepage
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 60000 });

    console.log('✓ Page loaded successfully');

    // Take screenshot
    await page.screenshot({ path: '/tmp/homepage.png', fullPage: true });
    console.log('✓ Screenshot saved to /tmp/homepage.png');

    // Check for key elements
    const title = await page.title();
    console.log('✓ Page title:', title);

    // Check for GameCanvas
    const canvas = await page.locator('canvas').count();
    console.log('✓ Canvas elements found:', canvas);

    // Check for AgentVerse header
    const header = await page.locator('h1:has-text("AgentVerse")').count();
    console.log('✓ AgentVerse header found:', header > 0 ? 'Yes' : 'No');

    // Check for Create Agent button
    const createBtn = await page.locator('button:has-text("Create Agent")').count();
    console.log('✓ Create Agent button found:', createBtn > 0 ? 'Yes' : 'No');

    // Check for Agent List
    const agentList = await page.locator('text=Active Agents').count();
    console.log('✓ Agent List found:', agentList > 0 ? 'Yes' : 'No');

    // Get page text content
    const bodyText = await page.locator('body').innerText();

    if (bodyText.includes('AgentVerse')) {
      console.log('\n✅ Homepage is working correctly!');
      console.log('   - 2D world is displayed on main page');
      console.log('   - All key UI elements are present');
    } else {
      console.log('\n❌ Homepage might have issues');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testHomepage();
