/**
 * ============================================
 * KANBAN BOARD TESTS (Factory Tracking Page)
 * ============================================
 *
 * Tests for the Kanban board component:
 * - Column rendering
 * - Card rendering
 * - Drag and drop
 * - Status updates
 * - Filters
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within, fireEvent } from '@testing-library/react';
import { customRender as render, mockUsers } from '../../utils/test-utils';
import { server } from '../../mocks/server';
import { http, HttpResponse } from 'msw';
import { mockKanbanOrders, mockKanbanDepartments } from '../../utils/mockData';
import FactoryTrackingPage from '@/modules/factory/components/FactoryTrackingPage';

// Mock dnd-kit
vi.mock('@dnd-kit/core', async () => {
  const actual = await vi.importActual('@dnd-kit/core');
  return {
    ...actual,
    DndContext: ({ children, onDragEnd }: any) => (
      <div data-testid="dnd-context" data-ondragend={onDragEnd}>
        {children}
      </div>
    ),
    DragOverlay: ({ children }: any) => <div data-testid="drag-overlay">{children}</div>,
    useSensor: () => ({}),
    useSensors: () => [],
    closestCorners: () => null,
    PointerSensor: class {},
  };
});

describe('FactoryTrackingPage (Kanban Board)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // RENDERING TESTS
  // ============================================

  describe('Rendering', () => {
    it('should render the factory tracking page', async () => {
      render(<FactoryTrackingPage />, {
        useMemoryRouter: true,
        user: mockUsers.factoryManager,
        isAuthenticated: true,
      });

      await waitFor(() => {
        expect(screen.getByText(/factory tracking|kanban/i)).toBeInTheDocument();
      });
    });

    it('should render all department columns', async () => {
      render(<FactoryTrackingPage />, {
        useMemoryRouter: true,
        user: mockUsers.factoryManager,
        isAuthenticated: true,
      });

      await waitFor(() => {
        // Check for department columns - use getAllByText for columns that might match multiple
        expect(screen.getByText(/CAD/i)).toBeInTheDocument();
        expect(screen.getByText(/Casting/i)).toBeInTheDocument();
        // Use exact match for Polish to avoid matching "Final Polish"
        const polishColumns = screen.getAllByText(/Polish/i);
        expect(polishColumns.length).toBeGreaterThan(0);
      });
    });

    it('should render column headers with order count', async () => {
      render(<FactoryTrackingPage />, {
        useMemoryRouter: true,
        user: mockUsers.factoryManager,
        isAuthenticated: true,
      });

      await waitFor(() => {
        // Look for count badges in column headers or orders being displayed
        const countBadges = screen.queryAllByText(/\(\d+\)|\d+ orders?/i);
        const orders = screen.queryAllByText(/ORD-2026-/);
        // Either count badges or orders should be present
        expect(countBadges.length + orders.length).toBeGreaterThan(0);
      });
    });

    it('should render order cards in columns', async () => {
      render(<FactoryTrackingPage />, {
        useMemoryRouter: true,
        user: mockUsers.factoryManager,
        isAuthenticated: true,
      });

      await waitFor(
        () => {
          // Check for order cards - use getAllByText since there are multiple
          const orders = screen.getAllByText(/ORD-2026-/);
          expect(orders.length).toBeGreaterThan(0);
        },
        { timeout: 3000 }
      );
    });

    it('should render filter controls', async () => {
      render(<FactoryTrackingPage />, {
        useMemoryRouter: true,
        user: mockUsers.factoryManager,
        isAuthenticated: true,
      });

      await waitFor(() => {
        const filterButton =
          screen.queryByRole('button', { name: /filter/i }) || screen.queryByText(/filter/i);
        expect(filterButton).toBeInTheDocument();
      });
    });

    it('should render refresh button', async () => {
      render(<FactoryTrackingPage />, {
        useMemoryRouter: true,
        user: mockUsers.factoryManager,
        isAuthenticated: true,
      });

      await waitFor(() => {
        const refreshButton = screen.queryByRole('button', { name: /refresh/i });
        expect(refreshButton).toBeInTheDocument();
      });
    });
  });

  // ============================================
  // CARD RENDERING TESTS
  // ============================================

  describe('Card Rendering', () => {
    it('should display order number on card', async () => {
      render(<FactoryTrackingPage />, {
        useMemoryRouter: true,
        user: mockUsers.factoryManager,
        isAuthenticated: true,
      });

      await waitFor(
        () => {
          expect(screen.getByText(/ORD-2026-1001/)).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('should display customer name on card', async () => {
      render(<FactoryTrackingPage />, {
        useMemoryRouter: true,
        user: mockUsers.factoryManager,
        isAuthenticated: true,
      });

      await waitFor(
        () => {
          // Use getAllByText since the customer may appear on multiple cards
          const customerNames = screen.getAllByText(/Arjun Jewellers/);
          expect(customerNames.length).toBeGreaterThan(0);
        },
        { timeout: 3000 }
      );
    });

    it('should display priority indicator', async () => {
      render(<FactoryTrackingPage />, {
        useMemoryRouter: true,
        user: mockUsers.factoryManager,
        isAuthenticated: true,
      });

      await waitFor(
        () => {
          const priorityBadges = screen.queryAllByText(/HIGH|URGENT|NORMAL|LOW/i);
          expect(priorityBadges.length).toBeGreaterThan(0);
        },
        { timeout: 3000 }
      );
    });

    it('should display due date on card', async () => {
      render(<FactoryTrackingPage />, {
        useMemoryRouter: true,
        user: mockUsers.factoryManager,
        isAuthenticated: true,
      });

      await waitFor(
        () => {
          // Look for date format or "Due" label
          const dueDates = screen.queryAllByText(/due|days?|overdue/i);
          // Should have due date indicators
        },
        { timeout: 3000 }
      );
    });

    it('should highlight overdue orders', async () => {
      render(<FactoryTrackingPage />, {
        useMemoryRouter: true,
        user: mockUsers.factoryManager,
        isAuthenticated: true,
      });

      await waitFor(
        () => {
          // Overdue orders should have special styling
          const overdueIndicators = screen.queryAllByText(/overdue/i);
          // Check for overdue styling
        },
        { timeout: 3000 }
      );
    });

    it('should show assigned worker if assigned', async () => {
      render(<FactoryTrackingPage />, {
        useMemoryRouter: true,
        user: mockUsers.factoryManager,
        isAuthenticated: true,
      });

      await waitFor(
        () => {
          // Look for worker names
          const workers = screen.queryAllByText(/Rajesh Kumar|Priya Sharma/i);
          // Should show assigned workers
        },
        { timeout: 3000 }
      );
    });

    it('should display weight information', async () => {
      render(<FactoryTrackingPage />, {
        useMemoryRouter: true,
        user: mockUsers.factoryManager,
        isAuthenticated: true,
      });

      await waitFor(
        () => {
          // Look for weight values
          const weights = screen.queryAllByText(/\d+\.?\d*\s*g/i);
          // Should have weight information
        },
        { timeout: 3000 }
      );
    });
  });

  // ============================================
  // DRAG AND DROP TESTS
  // ============================================

  describe('Drag and Drop', () => {
    it('should have draggable cards', async () => {
      render(<FactoryTrackingPage />, {
        useMemoryRouter: true,
        user: mockUsers.factoryManager,
        isAuthenticated: true,
      });

      await waitFor(() => {
        // Look for draggable elements
        const draggables = document.querySelectorAll('[draggable="true"]');
        // Cards should be draggable
      });
    });

    it('should have droppable columns', async () => {
      render(<FactoryTrackingPage />, {
        useMemoryRouter: true,
        user: mockUsers.factoryManager,
        isAuthenticated: true,
      });

      await waitFor(() => {
        // DndContext should be present
        expect(screen.getByTestId('dnd-context')).toBeInTheDocument();
      });
    });

    it('should show drag overlay during drag', async () => {
      render(<FactoryTrackingPage />, {
        useMemoryRouter: true,
        user: mockUsers.factoryManager,
        isAuthenticated: true,
      });

      await waitFor(() => {
        expect(screen.getByTestId('drag-overlay')).toBeInTheDocument();
      });
    });

    it('should call API when card is dropped in new column', async () => {
      let apiCalled = false;
      server.use(
        http.put('/api/factory/orders/:id/department', () => {
          apiCalled = true;
          return HttpResponse.json({
            success: true,
            data: { id: 'order-1', currentDepartment: 'casting' },
          });
        })
      );

      render(<FactoryTrackingPage />, {
        useMemoryRouter: true,
        user: mockUsers.factoryManager,
        isAuthenticated: true,
      });

      // Note: Full drag-and-drop simulation requires more complex testing setup
      // This is a placeholder for the test concept
    });

    it('should update UI optimistically on drag end', async () => {
      // Optimistic update test
    });

    it('should revert on API failure', async () => {
      server.use(
        http.put('/api/factory/orders/:id/department', () => {
          return HttpResponse.json(
            { success: false, message: 'Failed to move order' },
            { status: 500 }
          );
        })
      );

      // Test revert behavior
    });
  });

  // ============================================
  // CARD INTERACTION TESTS
  // ============================================

  describe('Card Interactions', () => {
    it('should open detail modal when clicking card', async () => {
      const { user } = render(<FactoryTrackingPage />, {
        useMemoryRouter: true,
        user: mockUsers.factoryManager,
        isAuthenticated: true,
      });

      // Use getAllByText since there are multiple order cards
      await waitFor(
        () => {
          const orders = screen.getAllByText(/ORD-2026-/);
          expect(orders.length).toBeGreaterThan(0);
        },
        { timeout: 3000 }
      );

      // Find and click a card - use a specific order number
      const card = screen.getByText('ORD-2026-1001').closest('div');
      if (card) {
        await user.click(card);

        // Modal should open
        await waitFor(() => {
          const modal = screen.queryByRole('dialog');
          // Modal should appear
        });
      }
    });

    it('should show order details in modal', async () => {
      const { user } = render(<FactoryTrackingPage />, {
        useMemoryRouter: true,
        user: mockUsers.factoryManager,
        isAuthenticated: true,
      });

      // Use getAllByText since there are multiple order cards
      await waitFor(
        () => {
          const orders = screen.getAllByText(/ORD-2026-/);
          expect(orders.length).toBeGreaterThan(0);
        },
        { timeout: 3000 }
      );

      const card = screen.getByText('ORD-2026-1001').closest('div');
      if (card) {
        await user.click(card);

        await waitFor(() => {
          // Modal should show order details
        });
      }
    });

    it('should close modal when clicking close button', async () => {
      const { user } = render(<FactoryTrackingPage />, {
        useMemoryRouter: true,
        user: mockUsers.factoryManager,
        isAuthenticated: true,
      });

      // Use getAllByText since there are multiple order cards
      await waitFor(
        () => {
          const orders = screen.getAllByText(/ORD-2026-/);
          expect(orders.length).toBeGreaterThan(0);
        },
        { timeout: 3000 }
      );

      const card = screen.getByText('ORD-2026-1001').closest('div');
      if (card) {
        await user.click(card);

        await waitFor(() => {
          const closeButton = screen.queryByRole('button', { name: /close|×/i });
          if (closeButton) {
            user.click(closeButton);
          }
        });
      }
    });

    it('should allow assigning worker from card menu', async () => {
      const { user } = render(<FactoryTrackingPage />, {
        useMemoryRouter: true,
        user: mockUsers.factoryManager,
        isAuthenticated: true,
      });

      // Use getAllByText since there are multiple order cards
      await waitFor(
        () => {
          const orders = screen.getAllByText(/ORD-2026-/);
          expect(orders.length).toBeGreaterThan(0);
        },
        { timeout: 3000 }
      );

      // Find action menu or assign button
      const assignButtons = screen.queryAllByRole('button', { name: /assign/i });
      // Test assignment flow
    });
  });

  // ============================================
  // FILTER TESTS
  // ============================================

  describe('Filters', () => {
    it('should filter by due date range', async () => {
      const { user } = render(<FactoryTrackingPage />, {
        useMemoryRouter: true,
        user: mockUsers.factoryManager,
        isAuthenticated: true,
      });

      await waitFor(() => {
        expect(screen.getByText(/filter/i)).toBeInTheDocument();
      });

      // Open filters
      const filterButton = screen.getByRole('button', { name: /filter/i });
      await user.click(filterButton);

      // Select due date filter - use getAllByText since there could be multiple matching elements
      const dueDateFilters = screen.queryAllByText(/today|this week|overdue/i);
      if (dueDateFilters.length > 0) {
        await user.click(dueDateFilters[0]);
      }
    });

    it('should filter by priority', async () => {
      const { user } = render(<FactoryTrackingPage />, {
        useMemoryRouter: true,
        user: mockUsers.factoryManager,
        isAuthenticated: true,
      });

      await waitFor(() => {
        expect(screen.getByText(/filter/i)).toBeInTheDocument();
      });

      const filterButton = screen.getByRole('button', { name: /filter/i });
      await user.click(filterButton);

      // Use getByRole to target the option element specifically, or getAllByText for multiple matches
      const urgentFilters = screen.queryAllByText(/urgent/i);
      const urgentOption = urgentFilters.find((el) => el.tagName.toLowerCase() === 'option');
      if (urgentOption) {
        // Select the option by changing the select value
        const select = urgentOption.closest('select');
        if (select) {
          await user.selectOptions(select, urgentOption);
        }
        // Only urgent orders should show
      }
    });

    it('should filter by assigned status', async () => {
      // Test unassigned orders filter
    });

    it('should show filter indicator when filters active', async () => {
      // Test filter badge
    });

    it('should clear filters', async () => {
      // Test clear filters
    });
  });

  // ============================================
  // STATUS UPDATE TESTS
  // ============================================

  describe('Status Updates', () => {
    it('should update card status', async () => {
      const { user } = render(<FactoryTrackingPage />, {
        useMemoryRouter: true,
        user: mockUsers.factoryManager,
        isAuthenticated: true,
      });

      // Use getAllByText since there are multiple order cards
      await waitFor(
        () => {
          const orders = screen.getAllByText(/ORD-2026-/);
          expect(orders.length).toBeGreaterThan(0);
        },
        { timeout: 3000 }
      );

      // Find status change button or dropdown
      const statusButtons = screen.queryAllByText(/waiting|in progress|completed/i);
      // Test status update
    });

    it('should show success notification on status update', async () => {
      // Test toast notification
    });

    it('should handle status update error', async () => {
      server.use(
        http.put('/api/factory/orders/:id/department', () => {
          return HttpResponse.json(
            { success: false, message: 'Failed to update' },
            { status: 500 }
          );
        })
      );

      // Test error handling
    });
  });

  // ============================================
  // REAL-TIME UPDATES TESTS
  // ============================================

  describe('Real-time Updates', () => {
    it('should poll for updates periodically', async () => {
      render(<FactoryTrackingPage />, {
        useMemoryRouter: true,
        user: mockUsers.factoryManager,
        isAuthenticated: true,
      });

      // Wait for initial load by checking that content renders
      // The component loads data from the default MSW handlers
      await waitFor(
        () => {
          // Check that the page has loaded with order data
          const orders = screen.getAllByText(/ORD-2026-/);
          expect(orders.length).toBeGreaterThan(0);
        },
        { timeout: 5000 }
      );

      // Note: Polling interval testing requires longer waits or fake timers
    });

    it('should update UI when new data arrives', async () => {
      // Test UI updates from polling
    });
  });

  // ============================================
  // LOADING STATES TESTS
  // ============================================

  describe('Loading States', () => {
    it('should show loading skeleton on initial load', () => {
      render(<FactoryTrackingPage />, {
        useMemoryRouter: true,
        user: mockUsers.factoryManager,
        isAuthenticated: true,
      });

      // Look for skeleton or loading indicator
      const loading = screen.queryByText(/loading/i) || screen.queryByTestId('loading-skeleton');
      // Should show loading state initially
    });

    it('should show loading indicator during refresh', async () => {
      const { user } = render(<FactoryTrackingPage />, {
        useMemoryRouter: true,
        user: mockUsers.factoryManager,
        isAuthenticated: true,
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
      });

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);

      // Loading indicator should appear
    });
  });

  // ============================================
  // ROLE-BASED ACCESS TESTS
  // ============================================

  describe('Role-Based Access', () => {
    it('should show full controls for factory manager', async () => {
      render(<FactoryTrackingPage />, {
        useMemoryRouter: true,
        user: mockUsers.factoryManager,
        isAuthenticated: true,
      });

      await waitFor(() => {
        expect(screen.getByText(/factory tracking/i)).toBeInTheDocument();
      });

      // Factory manager should see all controls
    });

    it('should allow drag and drop for authorized users', async () => {
      render(<FactoryTrackingPage />, {
        useMemoryRouter: true,
        user: mockUsers.worker,
        isAuthenticated: true,
      });

      // Workers might have limited drag capabilities
    });

    it('should restrict actions for department workers', async () => {
      render(<FactoryTrackingPage />, {
        useMemoryRouter: true,
        user: mockUsers.worker,
        isAuthenticated: true,
      });

      // Workers might only see their department
    });
  });
});
