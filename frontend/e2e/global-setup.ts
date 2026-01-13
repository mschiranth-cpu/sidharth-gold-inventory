/**
 * ============================================
 * GLOBAL SETUP FOR PLAYWRIGHT
 * ============================================
 *
 * Runs once before all tests:
 * - Setup authentication state
 * - Configure API mocks
 */

import { chromium, FullConfig } from '@playwright/test';
import { testUsers } from './fixtures';
import { setupApiMocks } from './mocks/api-mocks';

async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL || 'http://localhost:5173';

  console.log('🚀 Starting global setup...');
  console.log(`📍 Base URL: ${baseURL}`);

  // Launch browser for setup
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Setup API mocks
    await setupApiMocks(page);

    // Wait for the app to be ready
    await page.goto(baseURL, { timeout: 30000 });
    console.log('✅ Application is running');

    // Verify test users can login
    // This also warms up the server
    await page.goto(`${baseURL}/login`);
    await page.fill('input[type="email"], input[name="email"]', testUsers.admin.email);
    await page.fill('input[type="password"], input[name="password"]', testUsers.admin.password);
    await page.click('button[type="submit"]');

    // Wait for login to complete
    await page.waitForURL(/\/(dashboard|orders|factory)/, { timeout: 15000 });
    console.log('✅ Admin login verified');

    // Store authentication state for reuse
    await context.storageState({ path: './e2e/.auth/admin.json' });
    console.log('✅ Admin auth state saved');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }

  console.log('✅ Global setup complete');
}

export default globalSetup;
