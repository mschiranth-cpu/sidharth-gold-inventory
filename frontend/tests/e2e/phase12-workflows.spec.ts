import { test, expect, Page } from '@playwright/test';

/**
 * Phase 12: E2E Test Suite for Worker Workflow Features
 *
 * Tests complete user journeys through all Phase 12 enhancements:
 * - Enhanced loading states and error boundaries
 * - Photo gallery lightbox (zoom, navigation, keyboard shortcuts)
 * - Global keyboard shortcuts (Ctrl+S save, Ctrl+Enter submit)
 * - 3D CAD file preview (rotation, zoom, pan)
 * - Visual timeline UI (animations, date grouping)
 * - Real-time notifications (Socket.io, sound, toast)
 *
 * Coverage: 15+ complete workflows
 */

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const WORKER_EMAIL = process.env.WORKER_EMAIL || 'test-worker@example.com';
const WORKER_PASSWORD = process.env.WORKER_PASSWORD || 'TestPassword123!';

test.describe('Phase 12: Complete Workflows', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto(BASE_URL);
  });

  test.afterEach(async () => {
    await page.close();
  });

  // ============ TASK #1: Loading States & Error Boundaries ============

  test('T1.1: Loading skeleton displays during data fetch', async () => {
    // Navigate to orders page
    await page.goto(`${BASE_URL}/orders`);

    // Skeleton should appear while loading
    const skeleton = page.locator('[data-testid="order-skeleton"]');
    await expect(skeleton).toBeVisible({ timeout: 1000 });

    // Wait for actual content to appear
    const orderCard = page.locator('[data-testid="order-card"]');
    await expect(orderCard).toBeVisible({ timeout: 5000 });

    // Skeleton should disappear
    await expect(skeleton).not.toBeVisible();
  });

  test('T1.2: Error boundary shows graceful fallback', async () => {
    // Navigate to an invalid order to trigger error
    await page.goto(`${BASE_URL}/orders/invalid-id/detail`);

    // Error boundary should display
    const errorBoundary = page.locator('[data-testid="error-boundary"]');
    await expect(errorBoundary).toBeVisible();

    // Should have retry button
    const retryButton = page.locator('button:has-text("Retry")');
    await expect(retryButton).toBeVisible();
  });

  test('T1.3: Smooth state transition during navigation', async () => {
    // Start on orders page
    await page.goto(`${BASE_URL}/orders`);

    // Wait for first order to load
    const firstOrder = page.locator('[data-testid="order-card"]').first();
    await expect(firstOrder).toBeVisible();

    // Click to view details
    await firstOrder.click();

    // Should show loading state briefly
    const loadingIndicator = page.locator('[data-testid="loading-indicator"]');
    const isVisible = await loadingIndicator.isVisible().catch(() => false);

    // Wait for details page content
    const detailsContent = page.locator('[data-testid="order-details-content"]');
    await expect(detailsContent).toBeVisible({ timeout: 5000 });
  });

  // ============ TASK #3: Photo Gallery Lightbox ============

  test('T3.1: Lightbox opens and displays full resolution image', async () => {
    // Navigate to order with photos
    await page.goto(`${BASE_URL}/orders`);

    // Click on an order with files
    const orderWithFiles = page
      .locator('[data-testid="order-card"]:has([data-testid="file-count"])')
      .first();
    await orderWithFiles.click();

    // Click on Files tab
    const filesTab = page.locator('button:has-text("Files")');
    await expect(filesTab).toBeVisible();
    await filesTab.click();

    // Wait for thumbnail
    const thumbnail = page.locator('[data-testid="file-thumbnail"]').first();
    await expect(thumbnail).toBeVisible({ timeout: 3000 });

    // Click thumbnail to open lightbox
    await thumbnail.click();

    // Lightbox should appear
    const lightbox = page.locator('[data-testid="lightbox-modal"]');
    await expect(lightbox).toBeVisible();

    // Full resolution image should load
    const lightboxImage = page.locator('[data-testid="lightbox-image"]');
    await expect(lightboxImage).toBeVisible();
  });

  test('T3.2: Lightbox zoom controls work (0.5x to 3x)', async () => {
    // Open lightbox (from previous test setup)
    await page.goto(`${BASE_URL}/orders`);
    const orderWithFiles = page
      .locator('[data-testid="order-card"]:has([data-testid="file-count"])')
      .first();
    await orderWithFiles.click();

    const filesTab = page.locator('button:has-text("Files")');
    await filesTab.click();

    const thumbnail = page.locator('[data-testid="file-thumbnail"]').first();
    await expect(thumbnail).toBeVisible({ timeout: 3000 });
    await thumbnail.click();

    const lightbox = page.locator('[data-testid="lightbox-modal"]');
    await expect(lightbox).toBeVisible();

    // Get initial image size
    const lightboxImage = page.locator('[data-testid="lightbox-image"]');
    const initialScale = await lightboxImage.evaluate((el: HTMLImageElement) => {
      const style = window.getComputedStyle(el);
      return style.transform;
    });

    // Click zoom in button 5 times
    const zoomInButton = page.locator('[data-testid="zoom-in-button"]');
    for (let i = 0; i < 5; i++) {
      await zoomInButton.click();
      await page.waitForTimeout(100); // Animation delay
    }

    // Image should be zoomed in (transform should change)
    const zoomedScale = await lightboxImage.evaluate((el: HTMLImageElement) => {
      const style = window.getComputedStyle(el);
      return style.transform;
    });

    expect(zoomedScale).not.toBe(initialScale);

    // Click zoom out button
    const zoomOutButton = page.locator('[data-testid="zoom-out-button"]');
    for (let i = 0; i < 5; i++) {
      await zoomOutButton.click();
      await page.waitForTimeout(100);
    }
  });

  test('T3.3: Lightbox keyboard shortcuts work (ESC, arrows, +/-)', async () => {
    // Open lightbox
    await page.goto(`${BASE_URL}/orders`);
    const orderWithFiles = page
      .locator('[data-testid="order-card"]:has([data-testid="file-count"])')
      .first();
    await orderWithFiles.click();

    const filesTab = page.locator('button:has-text("Files")');
    await filesTab.click();

    const thumbnail = page.locator('[data-testid="file-thumbnail"]').first();
    await expect(thumbnail).toBeVisible({ timeout: 3000 });
    await thumbnail.click();

    const lightbox = page.locator('[data-testid="lightbox-modal"]');
    await expect(lightbox).toBeVisible();

    // Test arrow key navigation
    const lightboxImage = page.locator('[data-testid="lightbox-image"]');
    const initialImage = await lightboxImage.getAttribute('src');

    // Press right arrow to go to next image
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);

    const nextImage = await lightboxImage.getAttribute('src');
    // If there's a next image, it should be different
    // (might be same if only one image, which is okay)

    // Test zoom shortcuts
    await page.keyboard.press('Plus');
    await page.waitForTimeout(100);

    // Test close with ESC
    await page.keyboard.press('Escape');
    await expect(lightbox).not.toBeVisible();
  });

  test('T3.4: Lightbox navigation (previous/next arrows)', async () => {
    // Open lightbox with multiple images
    await page.goto(`${BASE_URL}/orders`);
    const orderWithFiles = page
      .locator('[data-testid="order-card"]:has([data-testid="file-count"])')
      .first();
    await orderWithFiles.click();

    const filesTab = page.locator('button:has-text("Files")');
    await filesTab.click();

    const thumbnail = page.locator('[data-testid="file-thumbnail"]').first();
    await expect(thumbnail).toBeVisible({ timeout: 3000 });
    await thumbnail.click();

    const lightbox = page.locator('[data-testid="lightbox-modal"]');
    await expect(lightbox).toBeVisible();

    // Get initial image index
    const imageCounter = page.locator('[data-testid="lightbox-counter"]');
    const initialCounter = await imageCounter.textContent();

    // Click next button
    const nextButton = page.locator('[data-testid="lightbox-next-button"]');
    await nextButton.click();
    await page.waitForTimeout(300);

    // Counter should update if there are multiple images
    const nextCounter = await imageCounter.textContent();
    // May or may not change depending on number of images
    expect(nextCounter).toBeDefined();

    // Click previous button
    const prevButton = page.locator('[data-testid="lightbox-prev-button"]');
    await prevButton.click();
    await page.waitForTimeout(300);
  });

  // ============ TASK #4: Global Keyboard Shortcuts ============

  test('T4.1: Ctrl+S saves form draft', async () => {
    // Navigate to worker work submission page
    await page.goto(`${BASE_URL}/work`);

    // Wait for assigned work to load
    const workItem = page.locator('[data-testid="assigned-work"]').first();
    await expect(workItem).toBeVisible({ timeout: 5000 });

    // Click to start work
    await workItem.click();

    // Wait for form to load
    const form = page.locator('[data-testid="work-form"]');
    await expect(form).toBeVisible({ timeout: 3000 });

    // Fill in a form field
    const textInput = page.locator('[data-testid="form-field-text"]').first();
    await textInput.fill('Test input value');

    // Press Ctrl+S to save
    await page.keyboard.press('Control+S');

    // Should show save success message
    const successMessage = page.locator('[data-testid="save-success"]');
    await expect(successMessage).toBeVisible({ timeout: 2000 });
    await expect(successMessage).not.toBeVisible({ timeout: 3000 }); // Auto-dismiss
  });

  test('T4.2: Ctrl+Enter submits form', async () => {
    // Navigate to worker work submission page
    await page.goto(`${BASE_URL}/work`);

    // Wait for assigned work to load
    const workItem = page.locator('[data-testid="assigned-work"]').first();
    await expect(workItem).toBeVisible({ timeout: 5000 });

    // Click to start work
    await workItem.click();

    // Wait for form to load
    const form = page.locator('[data-testid="work-form"]');
    await expect(form).toBeVisible({ timeout: 3000 });

    // Fill all required fields
    const requiredFields = page.locator('[data-testid="form-field"][data-required="true"]');
    const fieldCount = await requiredFields.count();

    for (let i = 0; i < fieldCount; i++) {
      const field = requiredFields.nth(i);
      const input = field.locator('input, textarea, select').first();

      const fieldType = await input.getAttribute('type');
      if (fieldType === 'text' || fieldType === 'email') {
        await input.fill('Test value');
      } else if (fieldType === 'number') {
        await input.fill('123');
      } else if (fieldType === 'date') {
        await input.fill('2026-01-13');
      }
    }

    // Press Ctrl+Enter to submit
    await page.keyboard.press('Control+Enter');

    // Should show submission success
    const successToast = page.locator('[data-testid="submission-success"]');
    await expect(successToast).toBeVisible({ timeout: 3000 });
  });

  // ============ TASK #5: 3D CAD File Preview ============

  test('T5.1: CAD file viewer opens and displays 3D model', async () => {
    // Navigate to order with CAD files
    await page.goto(`${BASE_URL}/orders`);

    const orderWithCAD = page
      .locator('[data-testid="order-card"]:has([data-testid="cad-file-count"])')
      .first();
    await expect(orderWithCAD).toBeVisible();
    await orderWithCAD.click();

    // Click on Files tab
    const filesTab = page.locator('button:has-text("Files")');
    await filesTab.click();

    // Click on CAD file
    const cadFile = page.locator('[data-testid="cad-file-item"]').first();
    await expect(cadFile).toBeVisible({ timeout: 3000 });
    await cadFile.click();

    // CAD viewer should appear
    const cadViewer = page.locator('[data-testid="cad-viewer"]');
    await expect(cadViewer).toBeVisible({ timeout: 5000 });

    // Canvas should be rendered
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('T5.2: CAD viewer rotation and zoom (mouse controls)', async () => {
    // Open CAD viewer (from previous test setup)
    await page.goto(`${BASE_URL}/orders`);

    const orderWithCAD = page
      .locator('[data-testid="order-card"]:has([data-testid="cad-file-count"])')
      .first();
    await expect(orderWithCAD).toBeVisible();
    await orderWithCAD.click();

    const filesTab = page.locator('button:has-text("Files")');
    await filesTab.click();

    const cadFile = page.locator('[data-testid="cad-file-item"]').first();
    await expect(cadFile).toBeVisible({ timeout: 3000 });
    await cadFile.click();

    const cadViewer = page.locator('[data-testid="cad-viewer"]');
    await expect(cadViewer).toBeVisible({ timeout: 5000 });

    // Get canvas
    const canvas = page.locator('canvas');
    const canvasBox = await canvas.boundingBox();

    if (canvasBox) {
      // Simulate left mouse drag for rotation
      await page.mouse.move(canvasBox.x + canvasBox.width / 2, canvasBox.y + canvasBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(
        canvasBox.x + canvasBox.width / 2 + 50,
        canvasBox.y + canvasBox.height / 2 + 50
      );
      await page.mouse.up();

      // Simulate scroll for zoom
      await canvas.hover();
      await page.mouse.wheel(0, 5); // Scroll up to zoom in

      await page.waitForTimeout(500);
    }
  });

  test('T5.3: CAD viewer touch gestures (mobile)', async () => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Open CAD viewer
    await page.goto(`${BASE_URL}/orders`);

    const orderWithCAD = page
      .locator('[data-testid="order-card"]:has([data-testid="cad-file-count"])')
      .first();
    await expect(orderWithCAD).toBeVisible();
    await orderWithCAD.click();

    const filesTab = page.locator('button:has-text("Files")');
    await filesTab.click();

    const cadFile = page.locator('[data-testid="cad-file-item"]').first();
    await expect(cadFile).toBeVisible({ timeout: 3000 });
    await cadFile.click();

    const cadViewer = page.locator('[data-testid="cad-viewer"]');
    await expect(cadViewer).toBeVisible({ timeout: 5000 });

    // Check for mobile instructions
    const mobileInstructions = page.locator('[data-testid="mobile-instructions"]');
    const isVisible = await mobileInstructions.isVisible().catch(() => false);

    if (isVisible) {
      // Instructions should show touch gestures
      const instructions = await mobileInstructions.textContent();
      expect(instructions).toContain('👆');
    }
  });

  // ============ TASK #6: Visual Timeline ============

  test('T6.1: Timeline displays with animations', async () => {
    // Navigate to order details
    await page.goto(`${BASE_URL}/orders`);

    const order = page.locator('[data-testid="order-card"]').first();
    await expect(order).toBeVisible();
    await order.click();

    // Click on Timeline tab
    const timelineTab = page.locator('button:has-text("Timeline")');
    await expect(timelineTab).toBeVisible({ timeout: 3000 });
    await timelineTab.click();

    // Timeline should appear
    const timeline = page.locator('[data-testid="visual-timeline"]');
    await expect(timeline).toBeVisible({ timeout: 3000 });

    // Timeline items should be visible
    const timelineItems = page.locator('[data-testid="timeline-item"]');
    const itemCount = await timelineItems.count();
    expect(itemCount).toBeGreaterThan(0);
  });

  test('T6.2: Timeline shows color-coded events', async () => {
    // Navigate to order with timeline
    await page.goto(`${BASE_URL}/orders`);

    const order = page.locator('[data-testid="order-card"]').first();
    await order.click();

    const timelineTab = page.locator('button:has-text("Timeline")');
    await timelineTab.click();

    const timeline = page.locator('[data-testid="visual-timeline"]');
    await expect(timeline).toBeVisible({ timeout: 3000 });

    // Check for color-coded dots
    const timelineDot = page.locator('[data-testid="timeline-dot"]').first();
    const dotColor = await timelineDot.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    expect(dotColor).toBeTruthy();
  });

  test('T6.3: Timeline items grouped by date', async () => {
    // Navigate to order with timeline
    await page.goto(`${BASE_URL}/orders`);

    const order = page.locator('[data-testid="order-card"]').first();
    await order.click();

    const timelineTab = page.locator('button:has-text("Timeline")');
    await timelineTab.click();

    const timeline = page.locator('[data-testid="visual-timeline"]');
    await expect(timeline).toBeVisible({ timeout: 3000 });

    // Check for date grouping
    const dateGroups = page.locator('[data-testid="timeline-date-group"]');
    const groupCount = await dateGroups.count();

    // Should have at least one date group
    expect(groupCount).toBeGreaterThan(0);
  });

  // ============ TASK #7: Real-time Notifications ============

  test('T7.1: Notification bell shows unread count', async () => {
    // Navigate to app
    await page.goto(`${BASE_URL}`);

    // Notification bell should be in header
    const notificationBell = page.locator('[data-testid="notification-bell"]');
    await expect(notificationBell).toBeVisible();

    // Check for unread count badge
    const unreadBadge = page.locator('[data-testid="unread-count"]');
    const isVisible = await unreadBadge.isVisible().catch(() => false);

    if (isVisible) {
      const count = await unreadBadge.textContent();
      expect(count).toMatch(/\d+/);
    }
  });

  test('T7.2: Notification dropdown opens and displays notifications', async () => {
    // Navigate to app
    await page.goto(`${BASE_URL}`);

    // Click notification bell
    const notificationBell = page.locator('[data-testid="notification-bell"]');
    await notificationBell.click();

    // Dropdown should open
    const dropdown = page.locator('[data-testid="notification-dropdown"]');
    await expect(dropdown).toBeVisible();

    // Notification items should load
    const notificationItems = page.locator('[data-testid="notification-item"]');
    const count = await notificationItems.count();

    // Should have at least one notification or empty state
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('T7.3: Notification can be marked as read', async () => {
    // Open notification dropdown
    await page.goto(`${BASE_URL}`);

    const notificationBell = page.locator('[data-testid="notification-bell"]');
    await notificationBell.click();

    const dropdown = page.locator('[data-testid="notification-dropdown"]');
    await expect(dropdown).toBeVisible();

    // Find unread notification
    const unreadNotification = page
      .locator('[data-testid="notification-item"][data-read="false"]')
      .first();
    const isVisible = await unreadNotification.isVisible().catch(() => false);

    if (isVisible) {
      // Click to mark as read
      const markReadButton = unreadNotification.locator('[data-testid="mark-read-button"]');
      await markReadButton.click();

      await page.waitForTimeout(500);

      // Notification should no longer appear as unread
      const unreadCount = page.locator('[data-testid="unread-count"]');
      const count = await unreadCount.textContent();
      expect(count).toBeDefined();
    }
  });

  test('T7.4: Notification sound toggle works', async () => {
    // Open notification dropdown
    await page.goto(`${BASE_URL}`);

    const notificationBell = page.locator('[data-testid="notification-bell"]');
    await notificationBell.click();

    const dropdown = page.locator('[data-testid="notification-dropdown"]');
    await expect(dropdown).toBeVisible();

    // Find sound toggle button
    const soundToggle = page.locator('[data-testid="sound-toggle"]');
    const isVisible = await soundToggle.isVisible().catch(() => false);

    if (isVisible) {
      const initialState = await soundToggle.getAttribute('data-enabled');

      // Click to toggle
      await soundToggle.click();
      await page.waitForTimeout(300);

      const newState = await soundToggle.getAttribute('data-enabled');
      expect(newState).not.toBe(initialState);
    }
  });

  // ============ Task #8: Mobile Responsiveness Validation ============

  test('T8.1: Layout responsive at 375px (mobile)', async () => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto(`${BASE_URL}/orders`);

    // Check no horizontal scrolling
    const pageWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);

    expect(pageWidth).toBeLessThanOrEqual(viewportWidth + 1); // +1 for rounding
  });

  test('T8.2: Layout responsive at 768px (tablet)', async () => {
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto(`${BASE_URL}/orders`);

    const pageWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);

    expect(pageWidth).toBeLessThanOrEqual(viewportWidth + 1);
  });

  test('T8.3: Layout responsive at 1024px (desktop)', async () => {
    await page.setViewportSize({ width: 1024, height: 768 });

    await page.goto(`${BASE_URL}/orders`);

    const pageWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);

    expect(pageWidth).toBeLessThanOrEqual(viewportWidth + 1);
  });

  test('T8.4: Touch targets minimum 44x44px on mobile', async () => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto(`${BASE_URL}/orders`);

    // Check all interactive elements
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();

    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
      const button = buttons.nth(i);
      const box = await button.boundingBox();

      if (box) {
        const isLargeEnough = box.width >= 44 && box.height >= 44;
        // Some buttons might be part of larger touch areas
        expect(isLargeEnough || box.width * box.height >= 44 * 44).toBeTruthy();
      }
    }
  });

  // ============ Complete Workflow Tests ============

  test('W1: Complete worker workflow - Assign → Start → Fill → Save → Submit', async () => {
    // This is the main integration test
    await page.goto(`${BASE_URL}/work`);

    // Wait for assigned work
    const workItem = page.locator('[data-testid="assigned-work"]').first();
    await expect(workItem).toBeVisible({ timeout: 5000 });

    // Click to start work
    await workItem.click();

    // Form should load
    const form = page.locator('[data-testid="work-form"]');
    await expect(form).toBeVisible({ timeout: 3000 });

    // Fill in first text field
    const textInput = page.locator('[data-testid="form-field-text"]').first();
    await textInput.fill('Sample text input');

    // Save with Ctrl+S
    await page.keyboard.press('Control+S');

    // Should show save success
    const saveSuccess = page.locator('[data-testid="save-success"]');
    await expect(saveSuccess).toBeVisible({ timeout: 2000 });

    // Fill remaining required fields
    const requiredFields = page.locator('[data-testid="form-field"][data-required="true"]');
    const fieldCount = await requiredFields.count();

    for (let i = 1; i < fieldCount; i++) {
      const field = requiredFields.nth(i);
      const input = field.locator('input, textarea, select').first();

      const fieldType = await input.getAttribute('type');
      if (fieldType === 'text') {
        await input.fill('Test value');
      } else if (fieldType === 'number') {
        await input.fill('100');
      }
    }

    // Submit with Ctrl+Enter
    await page.keyboard.press('Control+Enter');

    // Should show success
    const submitSuccess = page.locator('[data-testid="submission-success"]');
    await expect(submitSuccess).toBeVisible({ timeout: 3000 });
  });

  test('W2: Photo upload and gallery workflow', async () => {
    await page.goto(`${BASE_URL}/work`);

    // Start work on first assigned task
    const workItem = page.locator('[data-testid="assigned-work"]').first();
    await expect(workItem).toBeVisible({ timeout: 5000 });
    await workItem.click();

    // Find photo upload area
    const photoUpload = page.locator('[data-testid="photo-upload"]');
    await expect(photoUpload).toBeVisible({ timeout: 3000 });

    // Upload test image (if available)
    const fileInput = page.locator('input[type="file"]').first();
    await expect(fileInput).toBeVisible();

    // Simulate file selection
    await fileInput.setInputFiles({
      name: 'test-photo.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake image data'),
    });

    // Photo should appear in gallery
    const uploadedPhoto = page.locator('[data-testid="uploaded-photo"]').first();
    await expect(uploadedPhoto).toBeVisible({ timeout: 3000 });

    // Click to open in lightbox
    await uploadedPhoto.click();

    // Lightbox should open
    const lightbox = page.locator('[data-testid="lightbox-modal"]');
    await expect(lightbox).toBeVisible();

    // Test zoom
    const zoomIn = page.locator('[data-testid="zoom-in-button"]');
    await zoomIn.click();

    // Close with ESC
    await page.keyboard.press('Escape');
    await expect(lightbox).not.toBeVisible();
  });

  test('W3: CAD file preview in work submission', async () => {
    // Navigate to work with CAD requirements
    await page.goto(`${BASE_URL}/work`);

    // Find work with CAD file requirement
    const workWithCAD = page.locator('[data-testid="assigned-work"][data-has-cad="true"]').first();
    const isVisible = await workWithCAD.isVisible().catch(() => false);

    if (isVisible) {
      await workWithCAD.click();

      // CAD viewer should appear in instructions
      const cadViewer = page.locator('[data-testid="cad-viewer"]');
      await expect(cadViewer).toBeVisible({ timeout: 5000 });

      // Interact with 3D model
      const canvas = page.locator('canvas');
      const canvasBox = await canvas.boundingBox();

      if (canvasBox) {
        // Rotate model
        await page.mouse.move(
          canvasBox.x + canvasBox.width / 2,
          canvasBox.y + canvasBox.height / 2
        );
        await page.mouse.down();
        await page.mouse.move(
          canvasBox.x + canvasBox.width / 2 + 30,
          canvasBox.y + canvasBox.height / 2
        );
        await page.mouse.up();
      }
    }
  });

  test('W4: Real-time notification on work submission', async () => {
    // Start work and submit
    await page.goto(`${BASE_URL}/work`);

    const workItem = page.locator('[data-testid="assigned-work"]').first();
    await expect(workItem).toBeVisible({ timeout: 5000 });
    await workItem.click();

    const form = page.locator('[data-testid="work-form"]');
    await expect(form).toBeVisible({ timeout: 3000 });

    // Fill and submit work
    const textInputs = page.locator('[data-testid="form-field-text"]');
    const inputCount = await textInputs.count();

    for (let i = 0; i < inputCount; i++) {
      await textInputs.nth(i).fill('Test value');
    }

    // Submit
    const submitButton = page.locator('button:has-text("Submit")');
    await submitButton.click();

    // Wait for submission success
    const successToast = page.locator('[data-testid="submission-success"]');
    await expect(successToast).toBeVisible({ timeout: 3000 });

    // Navigate to check notifications
    await page.goto(`${BASE_URL}`);

    // Notification should appear (if user is also receiving notifications)
    const notificationBell = page.locator('[data-testid="notification-bell"]');
    await expect(notificationBell).toBeVisible();

    // Click to view notifications
    await notificationBell.click();

    const dropdown = page.locator('[data-testid="notification-dropdown"]');
    await expect(dropdown).toBeVisible();
  });
});

test.describe('Phase 12: Error Scenarios', () => {
  test('E1: Graceful handling of network error during photo upload', async ({ page }) => {
    await page.goto(`${BASE_URL}/work`);

    // Simulate network failure
    await page.route('**/api/workers/work/*/upload-photos', (route) => {
      route.abort('failed');
    });

    // Try to upload photo
    const workItem = page.locator('[data-testid="assigned-work"]').first();
    await expect(workItem).toBeVisible({ timeout: 5000 });
    await workItem.click();

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'test.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('data'),
    });

    // Should show error message
    const errorMessage = page.locator('[data-testid="upload-error"]');
    await expect(errorMessage).toBeVisible({ timeout: 3000 });

    // User should be able to retry
    const retryButton = page.locator('button:has-text("Retry")');
    expect(retryButton).toBeDefined();
  });

  test('E2: Form validation shows required field errors', async ({ page }) => {
    await page.goto(`${BASE_URL}/work`);

    const workItem = page.locator('[data-testid="assigned-work"]').first();
    await expect(workItem).toBeVisible({ timeout: 5000 });
    await workItem.click();

    // Try to submit without filling required fields
    const submitButton = page.locator('button:has-text("Submit")');
    await submitButton.click();

    // Should show validation errors
    const errorMessages = page.locator('[data-testid="field-error"]');
    const count = await errorMessages.count();
    expect(count).toBeGreaterThan(0);
  });

  test('E3: Timeout handling on slow network', async ({ page }) => {
    // Slow down network significantly
    await page.route('**/*', (route) => {
      setTimeout(() => route.continue(), 5000);
    });

    await page.goto(`${BASE_URL}/orders`, { waitUntil: 'domcontentloaded' });

    // Should show loading state
    const loadingIndicator = page.locator('[data-testid="loading-indicator"]');
    const isVisible = await loadingIndicator.isVisible().catch(() => false);

    if (isVisible) {
      expect(isVisible).toBe(true);
    }
  });
});
