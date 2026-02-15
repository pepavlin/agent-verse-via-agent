import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to homepage
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);
    
    // Click Enter World
    await page.click('text=Enter World');
    await page.waitForTimeout(2000);
    
    // Wait for username input and fill it
    await page.waitForSelector('input#username', { state: 'visible', timeout: 10000 });
    await page.fill('input#username', 'TestUser');
    await page.click('button:has-text("Enter World")');
    await page.waitForTimeout(3000);
    
    // Navigate to game page
    console.log('Navigating to game page');
    await page.goto('http://localhost:3000/game');
    await page.waitForTimeout(4000);
    
    // Screenshot game page
    await page.screenshot({ path: '/tmp/game_page_initial.png', fullPage: false });
    console.log('Screenshot saved: /tmp/game_page_initial.png');
    
    // Look for and click the Create Agent button
    console.log('Clicking Create Agent button');
    await page.waitForSelector('button:has-text("Create Agent")', { state: 'visible', timeout: 10000 });
    await page.click('button:has-text("Create Agent")');
    await page.waitForTimeout(2000);
    
    // Screenshot modal
    await page.screenshot({ path: '/tmp/create_agent_modal.png' });
    console.log('Screenshot saved: /tmp/create_agent_modal.png');
    
    // Fill out the form
    console.log('Filling agent creation form');
    await page.fill('input#name', 'MyTestAgent');
    
    // Select role
    await page.selectOption('select#role', 'researcher');
    
    // Select a color (click on the third color button - skip close button)
    await page.waitForTimeout(500);
    const colorSection = await page.locator('label:has-text("Agent Color")').first();
    const colorButtons = await colorSection.locator('..').locator('button[type="button"]').all();
    if (colorButtons.length > 2) {
      await colorButtons[2].click();  // Click third color
      await page.waitForTimeout(300);
    }
    
    // Select size
    await page.selectOption('select#size', '25');
    
    // Screenshot before submit
    await page.screenshot({ path: '/tmp/modal_filled.png' });
    console.log('Screenshot saved: /tmp/modal_filled.png');
    
    // Submit form
    await page.click('button[type="submit"]:has-text("Create Agent")');
    await page.waitForTimeout(4000);
    
    // Screenshot after creating agent
    await page.screenshot({ path: '/tmp/game_page_with_agent.png' });
    console.log('Screenshot saved: /tmp/game_page_with_agent.png');
    
    console.log('Test completed successfully!');
    
  } catch (error) {
    console.error('Error:', error);
    await page.screenshot({ path: '/tmp/error_screenshot.png' });
  } finally {
    await browser.close();
  }
})();
