/**
 * ============================================
 * E2E TEST FIXTURES AND HELPERS
 * ============================================
 *
 * Custom fixtures extending Playwright's test capabilities:
 * - Authenticated user contexts
 * - API helpers
 * - Test data factories
 */

import { test as base, expect, Page, BrowserContext } from '@playwright/test';
import { setupApiMocks } from './mocks/api-mocks';

// ============================================
// TYPES
// ============================================

export interface TestUser {
  email: string;
  password: string;
  role: 'ADMIN' | 'OFFICE_STAFF' | 'FACTORY_MANAGER' | 'DEPARTMENT_HEAD' | 'WORKER';
  name: string;
}

export interface TestOrder {
  id?: string;
  orderNumber?: string;
  customerName: string;
  mobileNumber: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  expectedDeliveryDate: string;
  jewelryType: string;
  goldType: string;
  weight: number;
  quantity: number;
}

// ============================================
// TEST USERS
// ============================================

export const testUsers: Record<string, TestUser> = {
  admin: {
    email: 'admin@goldfactory.com',
    password: 'Admin@123',
    role: 'ADMIN',
    name: 'Admin User',
  },
  officeStaff: {
    email: 'office@goldfactory.com',
    password: 'Office@123',
    role: 'OFFICE_STAFF',
    name: 'Office Staff',
  },
  factoryManager: {
    email: 'factory@goldfactory.com',
    password: 'Factory@123',
    role: 'FACTORY_MANAGER',
    name: 'Factory Manager',
  },
  departmentHead: {
    email: 'depthead@goldfactory.com',
    password: 'DeptHead@123',
    role: 'DEPARTMENT_HEAD',
    name: 'Department Head',
  },
  worker: {
    email: 'worker@goldfactory.com',
    password: 'Worker@123',
    role: 'WORKER',
    name: 'Worker User',
  },
};

// ============================================
// CUSTOM FIXTURES
// ============================================

interface CustomFixtures {
  // Authenticated page for different user roles
  adminPage: Page;
  officeStaffPage: Page;
  factoryManagerPage: Page;
  workerPage: Page;

  // Helper functions
  loginAs: (page: Page, user: TestUser) => Promise<void>;
  logout: (page: Page) => Promise<void>;
  createOrder: (page: Page, order: Partial<TestOrder>) => Promise<string>;
  waitForToast: (page: Page, text: string) => Promise<void>;
  takeScreenshotForVisualRegression: (page: Page, name: string) => Promise<void>;

  // API helpers
  apiLogin: (user: TestUser) => Promise<string>;
  apiCreateOrder: (token: string, order: Partial<TestOrder>) => Promise<TestOrder>;
  apiDeleteOrder: (token: string, orderId: string) => Promise<void>;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function login(page: Page, user: TestUser): Promise<void> {
  // Setup API mocks before login
  await setupApiMocks(page);

  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  // Fill login form
  await page.fill('input[type="email"], input[name="email"]', user.email);
  await page.fill('input[type="password"], input[name="password"]', user.password);

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for navigation to complete (workers may go to different routes)
  await page.waitForURL(/\/(dashboard|factory|orders|my-work|unauthorized)/, { timeout: 15000 });

  // Verify logged in - on mobile, navigation may be hidden but main content should be visible
  // Check for any of these indicators: nav, sidebar, main content, or unauthorized page
  const contentElement = page.locator(
    'nav, [data-testid="sidebar"], aside, main, h1, h2, [data-testid="dashboard"]'
  );
  await contentElement
    .or(page.locator('text=Unauthorized'))
    .first()
    .waitFor({ state: 'attached', timeout: 10000 });
}

async function logout(page: Page): Promise<void> {
  const viewport = page.viewportSize();
  const isMobile = viewport && viewport.width < 768;

  // On mobile, we need to open the sidebar/menu first
  if (isMobile) {
    // Try to open mobile menu
    const menuButton = page
      .locator(
        'button[aria-label*="menu"], [data-testid="mobile-menu"], button.hamburger, button:has(svg)'
      )
      .first();
    if (await menuButton.isVisible().catch(() => false)) {
      await menuButton.click();
      await page.waitForTimeout(300);
    }
  }

  // Look for Sign Out button in sidebar or header
  const signOutButton = page.locator(
    'button:has-text("Sign Out"), button:has-text("Logout"), a:has-text("Sign Out"), a:has-text("Logout"), [data-testid="logout"]'
  );

  // Wait for the logout button to be visible
  await signOutButton
    .first()
    .waitFor({ state: 'visible', timeout: 5000 })
    .catch(() => {});

  if (await signOutButton.first().isVisible()) {
    await signOutButton.first().click({ force: true });
  } else {
    // Try user menu dropdown in header
    const userMenu = page.locator(
      '[data-testid="user-menu"], button:has([data-testid="user-avatar"]), .user-menu-trigger'
    );
    if (await userMenu.isVisible()) {
      await userMenu.click();
      await page.waitForTimeout(300);
      const menuLogout = page.locator('text=Sign Out').or(page.locator('text=Logout'));
      if (await menuLogout.isVisible()) {
        await menuLogout.click();
      }
    } else {
      // Fallback: clear localStorage and navigate to login
      await page.evaluate(() => localStorage.clear());
      await page.goto('/login');
    }
  }

  // Wait for redirect to login with longer timeout
  await page.waitForURL(/\/login/, { timeout: 10000 });
}

async function createOrder(page: Page, orderData: Partial<TestOrder>): Promise<string> {
  const order: TestOrder = {
    customerName: orderData.customerName || 'Test Customer',
    mobileNumber: orderData.mobileNumber || '9876543210',
    priority: orderData.priority || 'NORMAL',
    expectedDeliveryDate: orderData.expectedDeliveryDate || getDateString(7),
    jewelryType: orderData.jewelryType || 'Ring',
    goldType: orderData.goldType || '22K',
    weight: orderData.weight || 10,
    quantity: orderData.quantity || 1,
  };

  await page.goto('/orders/new');
  await page.waitForLoadState('networkidle');

  // Step 1: Basic Info - use the actual form field IDs/names
  const customerNameInput = page.locator('#customerName, input[name="customerName"]');
  const customerPhoneInput = page.locator('#customerPhone, input[name="customerPhone"]');

  await customerNameInput.fill(order.customerName);
  await customerPhoneInput.fill(order.mobileNumber);

  // Click Next to go to step 2
  await page.click('button:has-text("Next")');

  // Step 2: Gold Details - use actual form fields
  await page.waitForSelector('#grossWeight, input[name="grossWeight"]', { timeout: 5000 });

  const grossWeightInput = page.locator('#grossWeight, input[name="grossWeight"]');
  await grossWeightInput.fill(order.weight.toString());

  // Try to select purity if available
  const puritySelect = page.locator('#purity, select[name="purity"]');
  if (await puritySelect.isVisible()) {
    await puritySelect.selectOption(order.goldType);
  }

  await page.click('button:has-text("Next")');

  // Step 3: Stone Details - skip if no stones
  await page.waitForTimeout(500);
  await page.click('button:has-text("Next")');

  // Step 4: Additional Info
  await page.waitForTimeout(500);

  // Set priority if available
  const prioritySelect = page.locator('#priority, select[name="priority"]');
  if (await prioritySelect.isVisible()) {
    await prioritySelect.selectOption(order.priority);
  }

  // Submit the form
  await page.click('button:has-text("Create Order"), button:has-text("Submit")');

  // Wait for redirect to order detail or orders list
  await page.waitForURL(/\/orders/, { timeout: 15000 });

  // Try to extract order number from URL or page content
  const url = page.url();
  const orderNumberMatch = url.match(/\/orders\/(ORD-\d{4}-\d+)/);
  if (orderNumberMatch) {
    return orderNumberMatch[1];
  }

  // If not in URL, try to find in page content
  const orderNumberElement = await page.locator('text=ORD-').first().textContent();
  const extractedNumber = orderNumberElement?.match(/(ORD-\d{4}-\d+)/);
  return extractedNumber ? extractedNumber[1] : 'ORD-TEST-0001';
}

async function waitForToast(page: Page, text: string): Promise<void> {
  await expect(
    page.locator(
      `[role="status"]:has-text("${text}"), .toast:has-text("${text}"), [data-testid="toast"]:has-text("${text}")`
    )
  ).toBeVisible({ timeout: 10000 });
}

async function takeScreenshotForVisualRegression(page: Page, name: string): Promise<void> {
  // Wait for animations to complete
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // Take screenshot
  await expect(page).toHaveScreenshot(`${name}.png`, {
    fullPage: false,
    animations: 'disabled',
  });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function getDateString(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
}

export function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `ORD-${year}-${random}`;
}

// ============================================
// EXTENDED TEST
// ============================================

export const test = base.extend<CustomFixtures>({
  // Admin authenticated page
  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await setupApiMocks(page);
    await login(page, testUsers.admin);
    await use(page);
    await context.close();
  },

  // Office staff authenticated page
  officeStaffPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await setupApiMocks(page);
    await login(page, testUsers.officeStaff);
    await use(page);
    await context.close();
  },

  // Factory manager authenticated page
  factoryManagerPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await setupApiMocks(page);
    await login(page, testUsers.factoryManager);
    await use(page);
    await context.close();
  },

  // Worker authenticated page
  workerPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await setupApiMocks(page);
    await login(page, testUsers.worker);
    await use(page);
    await context.close();
  },

  // Login helper function
  loginAs: async ({}, use) => {
    await use(login);
  },

  // Logout helper function
  logout: async ({}, use) => {
    await use(logout);
  },

  // Create order helper
  createOrder: async ({}, use) => {
    await use(createOrder);
  },

  // Toast helper
  waitForToast: async ({}, use) => {
    await use(waitForToast);
  },

  // Visual regression helper
  takeScreenshotForVisualRegression: async ({}, use) => {
    await use(takeScreenshotForVisualRegression);
  },

  // API login helper
  apiLogin: async ({ request }, use) => {
    const apiLogin = async (user: TestUser): Promise<string> => {
      const response = await request.post('/api/auth/login', {
        data: {
          email: user.email,
          password: user.password,
        },
      });
      const data = await response.json();
      return data.data?.accessToken || data.accessToken;
    };
    await use(apiLogin);
  },

  // API create order helper
  apiCreateOrder: async ({ request }, use) => {
    const apiCreateOrder = async (
      token: string,
      orderData: Partial<TestOrder>
    ): Promise<TestOrder> => {
      const response = await request.post('/api/orders', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: {
          customerName: orderData.customerName || 'API Test Customer',
          mobileNumber: orderData.mobileNumber || '9876543210',
          priority: orderData.priority || 'NORMAL',
          expectedDeliveryDate: orderData.expectedDeliveryDate || getDateString(7),
          items: [
            {
              jewelryType: orderData.jewelryType || 'Ring',
              goldType: orderData.goldType || '22K',
              weight: orderData.weight || 10,
              quantity: orderData.quantity || 1,
            },
          ],
        },
      });
      return await response.json();
    };
    await use(apiCreateOrder);
  },

  // API delete order helper
  apiDeleteOrder: async ({ request }, use) => {
    const apiDeleteOrder = async (token: string, orderId: string): Promise<void> => {
      await request.delete(`/api/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    };
    await use(apiDeleteOrder);
  },
});

export { expect } from '@playwright/test';

// ============================================
// PAGE OBJECT MODELS
// ============================================

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    // Setup API mocks before navigation
    await setupApiMocks(this.page);
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.page.fill('input[type="email"], input[name="email"]', email);
    await this.page.fill('input[type="password"], input[name="password"]', password);
    await this.page.click('button[type="submit"]');
  }

  async getErrorMessage() {
    return this.page
      .locator('[data-testid="error-message"], .text-red-500, [role="alert"]')
      .textContent();
  }

  get emailInput() {
    return this.page.locator('input[type="email"], input[name="email"]');
  }

  get passwordInput() {
    return this.page.locator('input[type="password"], input[name="password"]');
  }

  get submitButton() {
    return this.page.locator('button[type="submit"]');
  }
}

export class DashboardPage {
  constructor(private page: Page) {}

  async goto() {
    await setupApiMocks(this.page);
    await this.page.goto('/dashboard');
  }

  get totalOrdersCard() {
    return this.page.locator('[data-testid="total-orders"], :has-text("Total Orders")');
  }

  get inProgressCard() {
    return this.page.locator('[data-testid="in-progress"], :has-text("In Progress")');
  }

  get completedCard() {
    return this.page.locator('[data-testid="completed"], :has-text("Completed")');
  }

  get recentActivity() {
    return this.page.locator('[data-testid="recent-activity"], :has-text("Recent Activity")');
  }
}

export class OrdersPage {
  constructor(private page: Page) {}

  async goto() {
    await setupApiMocks(this.page);
    await this.page.goto('/orders');
  }

  async gotoCreate() {
    await setupApiMocks(this.page);
    await this.page.goto('/orders/create');
  }

  async gotoOrder(orderNumber: string) {
    await setupApiMocks(this.page);
    await this.page.goto(`/orders/${orderNumber}`);
  }

  async search(term: string) {
    await this.page.fill('input[placeholder*="Search"], input[name="search"]', term);
  }

  async filterByStatus(status: string) {
    await this.page.click('button:has-text("Status"), [data-testid="status-filter"]');
    await this.page.click(`text=${status}`);
  }

  get orderTable() {
    return this.page.locator('table, [data-testid="orders-table"]');
  }

  get createButton() {
    return this.page.locator('a:has-text("Create"), button:has-text("Create")');
  }

  getOrderRow(orderNumber: string) {
    return this.page.locator(`tr:has-text("${orderNumber}")`);
  }
}

export class FactoryTrackingPage {
  constructor(private page: Page) {}

  async goto() {
    await setupApiMocks(this.page);
    await this.page.goto('/factory/tracking');
  }

  getColumn(departmentName: string) {
    return this.page
      .locator(`[data-testid="column-${departmentName}"], :has-text("${departmentName}")`)
      .first();
  }

  getCard(orderNumber: string) {
    return this.page.locator(`[data-testid="card-${orderNumber}"], :has-text("${orderNumber}")`);
  }

  async dragCardToColumn(orderNumber: string, targetColumn: string) {
    const card = this.getCard(orderNumber);
    const column = this.getColumn(targetColumn);
    await card.dragTo(column);
  }
}
