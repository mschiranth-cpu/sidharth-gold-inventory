/**
 * ============================================
 * AUTH SETUP - Creates authenticated state for tests
 * ============================================
 *
 * This runs before other test projects to create
 * authenticated browser contexts with mocked API.
 */

import { test as setup, expect } from '@playwright/test';
import { testUsers } from './fixtures';
import { setupApiMocks } from './mocks/api-mocks';

const authFile = (role: string) => `./e2e/.auth/${role}.json`;

setup('authenticate as admin', async ({ page }) => {
  // Setup API mocks first
  await setupApiMocks(page);

  await page.goto('/login');
  await page.fill('input[type="email"], input[name="email"]', testUsers.admin.email);
  await page.fill('input[type="password"], input[name="password"]', testUsers.admin.password);
  await page.click('button[type="submit"]');

  // Wait for redirect
  await page.waitForURL(/\/(dashboard|orders)/, { timeout: 15000 });
  await expect(page.locator('nav, [data-testid="sidebar"], aside')).toBeVisible({ timeout: 10000 });

  await page.context().storageState({ path: authFile('admin') });
});

setup('authenticate as office staff', async ({ page }) => {
  await setupApiMocks(page);

  await page.goto('/login');
  await page.fill('input[type="email"], input[name="email"]', testUsers.officeStaff.email);
  await page.fill('input[type="password"], input[name="password"]', testUsers.officeStaff.password);
  await page.click('button[type="submit"]');

  await page.waitForURL(/\/(dashboard|orders)/, { timeout: 15000 });

  await page.context().storageState({ path: authFile('officeStaff') });
});

setup('authenticate as factory manager', async ({ page }) => {
  await setupApiMocks(page);

  await page.goto('/login');
  await page.fill('input[type="email"], input[name="email"]', testUsers.factoryManager.email);
  await page.fill(
    'input[type="password"], input[name="password"]',
    testUsers.factoryManager.password
  );
  await page.click('button[type="submit"]');

  await page.waitForURL(/\/(dashboard|factory)/, { timeout: 15000 });

  await page.context().storageState({ path: authFile('factoryManager') });
});

setup('authenticate as worker', async ({ page }) => {
  await setupApiMocks(page);

  await page.goto('/login');
  await page.fill('input[type="email"], input[name="email"]', testUsers.worker.email);
  await page.fill('input[type="password"], input[name="password"]', testUsers.worker.password);
  await page.click('button[type="submit"]');

  // Workers may redirect to my-work, factory, orders, dashboard, or unauthorized
  await page.waitForURL(/\/(dashboard|orders|factory|my-work|unauthorized)/, { timeout: 15000 });

  await page.context().storageState({ path: authFile('worker') });
});
