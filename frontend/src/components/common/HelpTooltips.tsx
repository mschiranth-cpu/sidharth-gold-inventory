import React, { useState, ReactNode } from 'react';
import { HelpCircle, X } from 'lucide-react';

// =============================================================================
// Help Tooltip Content
// =============================================================================

export const helpContent = {
  // Dashboard
  dashboard: {
    title: 'Dashboard Overview',
    content:
      'Your command center showing key metrics, recent activity, and quick actions. Data updates in real-time.',
  },
  totalOrders: {
    title: 'Total Active Orders',
    content:
      'Number of orders currently in the production pipeline. Excludes delivered and cancelled orders.',
  },
  dueToday: {
    title: 'Due Today',
    content:
      'Orders with a due date of today. These should be prioritized to meet customer expectations.',
  },
  overdueOrders: {
    title: 'Overdue Orders',
    content:
      'Orders past their due date. Click to view and take immediate action on these delayed items.',
  },

  // Orders
  orderNumber: {
    title: 'Order Number',
    content:
      'Unique identifier automatically generated when an order is created. Format: ORD-YYYY-XXXXX',
  },
  customerName: {
    title: 'Customer Name',
    content:
      'Enter the customer or company name. This will appear on all order documents and reports.',
  },
  product: {
    title: 'Product Description',
    content:
      'Describe the jewelry item being ordered. Include type (necklace, ring, etc.) and key specifications.',
  },
  quantity: {
    title: 'Quantity',
    content: 'Number of identical pieces to produce. Each piece will have the same specifications.',
  },
  goldWeight: {
    title: 'Gold Weight (grams)',
    content:
      'Total weight of gold required for this order. Used for material planning and cost calculation.',
  },
  purity: {
    title: 'Gold Purity',
    content:
      '24K = 99.9% pure gold\n22K = 91.6% pure (common for jewelry)\n18K = 75% pure\n14K = 58.3% pure',
  },
  priority: {
    title: 'Order Priority',
    content:
      'LOW: Flexible timeline\nMEDIUM: Standard priority\nHIGH: Important customer/deadline\nURGENT: Rush order, top priority',
  },
  dueDate: {
    title: 'Due Date',
    content:
      'When the customer expects delivery. Orders are sorted by due date to help prioritize work.',
  },
  orderNotes: {
    title: 'Order Notes',
    content:
      'Add special instructions, design specifications, or customer preferences. All team members can view these notes.',
  },
  orderStatus: {
    title: 'Order Status',
    content:
      'PENDING: Not started\nIN_PROGRESS: Being worked on\nQUALITY_CHECK: Ready for inspection\nCOMPLETED: Finished\nDELIVERED: Given to customer',
  },

  // Factory Tracking
  kanbanBoard: {
    title: 'Kanban Board',
    content:
      'Visual workflow showing orders in each department. Managers can drag orders between columns to move them through production.',
  },
  department: {
    title: 'Department',
    content:
      'Production stage where the order is currently located. Orders flow from left to right through departments.',
  },
  timeInDepartment: {
    title: 'Time in Department',
    content:
      'How long the order has been at the current stage. Long times may indicate bottlenecks or issues.',
  },
  moveOrder: {
    title: 'Move Order',
    content:
      'Transfer this order to the next department. Add notes about completed work before moving.',
  },

  // Users
  userRole: {
    title: 'User Role',
    content:
      'ADMIN: Full system access\nMANAGER: Department oversight\nWORKER: Department-specific orders',
  },
  userDepartment: {
    title: 'Assigned Department',
    content:
      'The department this user belongs to. Workers only see orders in their assigned department.',
  },
  userStatus: {
    title: 'Account Status',
    content: 'Active: Can log in and use the system\nInactive: Cannot log in (data preserved)',
  },

  // Reports
  dateRange: {
    title: 'Date Range',
    content: 'Select the time period for your report. Data outside this range will be excluded.',
  },
  reportType: {
    title: 'Report Type',
    content:
      'Orders: Complete order details\nProduction: Output by department\nEfficiency: Time analysis\nGold Usage: Material consumption',
  },
  exportFormat: {
    title: 'Export Format',
    content:
      'PDF: For printing and sharing\nExcel: For further analysis\nCSV: For data import/export',
  },

  // Notifications
  notifications: {
    title: 'Notifications',
    content: 'Alerts about order updates, assignments, and system events. Click to mark as read.',
  },
  notificationSettings: {
    title: 'Notification Preferences',
    content:
      'Choose which events trigger notifications and how you receive them (in-app, email, or both).',
  },

  // General
  search: {
    title: 'Search',
    content:
      'Type to search by order number, customer name, or product. Results update as you type.',
  },
  filter: {
    title: 'Filters',
    content:
      'Narrow down the list by status, priority, department, or date. Click Reset to clear all filters.',
  },
  sort: {
    title: 'Sorting',
    content: 'Click any column header to sort. Click again to reverse the order.',
  },
  refresh: {
    title: 'Refresh Data',
    content: 'Data updates automatically. Click refresh to manually reload the current view.',
  },
  logout: {
    title: 'Log Out',
    content:
      'End your session and return to the login page. Remember to log out on shared computers.',
  },
};

// =============================================================================
// Help Tooltip Component
// =============================================================================

interface HelpTooltipProps {
  helpKey: keyof typeof helpContent;
  position?: 'top' | 'bottom' | 'left' | 'right';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const HelpTooltip: React.FC<HelpTooltipProps> = ({
  helpKey,
  position = 'top',
  size = 'sm',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const content = helpContent[helpKey];

  if (!content) return null;

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-800 border-x-transparent border-b-transparent',
    bottom:
      'bottom-full left-1/2 -translate-x-1/2 border-b-gray-800 border-x-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-800 border-y-transparent border-r-transparent',
    right:
      'right-full top-1/2 -translate-y-1/2 border-r-gray-800 border-y-transparent border-l-transparent',
  };

  return (
    <div className={`relative inline-flex ${className}`}>
      <button
        type="button"
        className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Help: ${content.title}`}
      >
        <HelpCircle className={sizeClasses[size]} />
      </button>

      {isOpen && (
        <div className={`absolute z-50 ${positionClasses[position]}`} role="tooltip">
          <div className="bg-gray-800 text-white text-sm rounded-lg shadow-lg p-3 max-w-xs">
            <div className="font-semibold mb-1">{content.title}</div>
            <div className="text-gray-300 whitespace-pre-line">{content.content}</div>
          </div>
          <div className={`absolute w-0 h-0 border-4 ${arrowClasses[position]}`} />
        </div>
      )}
    </div>
  );
};

// =============================================================================
// Help Popover Component (Larger, Dismissible)
// =============================================================================

interface HelpPopoverProps {
  helpKey: keyof typeof helpContent;
  children?: ReactNode;
  className?: string;
}

export const HelpPopover: React.FC<HelpPopoverProps> = ({ helpKey, children, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const content = helpContent[helpKey];

  if (!content) return null;

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      {children}
      <button
        type="button"
        className="ml-2 text-gray-400 hover:text-blue-500 transition-colors focus:outline-none"
        onClick={() => setIsOpen(true)}
        aria-label={`Help: ${content.title}`}
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          {/* Popover */}
          <div className="absolute z-50 top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">{content.title}</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 text-sm text-gray-600 whitespace-pre-line">{content.content}</div>
          </div>
        </>
      )}
    </div>
  );
};

// =============================================================================
// Form Field with Help
// =============================================================================

interface FormFieldWithHelpProps {
  label: string;
  helpKey: keyof typeof helpContent;
  required?: boolean;
  children: ReactNode;
  error?: string;
}

export const FormFieldWithHelp: React.FC<FormFieldWithHelpProps> = ({
  label,
  helpKey,
  required = false,
  children,
  error,
}) => {
  return (
    <div className="space-y-1">
      <div className="flex items-center">
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <HelpTooltip helpKey={helpKey} className="ml-1" />
      </div>
      {children}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};

// =============================================================================
// Contextual Help Panel
// =============================================================================

interface HelpPanelProps {
  page: 'dashboard' | 'orders' | 'factory' | 'reports' | 'users';
  isOpen: boolean;
  onClose: () => void;
}

const pageHelpContent = {
  dashboard: {
    title: 'Dashboard Help',
    sections: [
      {
        title: 'Overview',
        content: 'The dashboard provides a real-time snapshot of your factory operations.',
      },
      {
        title: 'Statistics',
        content: 'Cards at the top show key metrics. Click any card to see more details.',
      },
      {
        title: 'Quick Actions',
        content: 'Use the action buttons to quickly create orders or access common tasks.',
      },
      {
        title: 'Activity Feed',
        content: 'Recent activity shows the latest updates across all departments.',
      },
    ],
  },
  orders: {
    title: 'Orders Help',
    sections: [
      {
        title: 'Creating Orders',
        content: 'Click "+ New Order" to create an order. Fill in customer and product details.',
      },
      {
        title: 'Filtering',
        content: 'Use filters to find specific orders by status, priority, or date.',
      },
      {
        title: 'Order Details',
        content: 'Click any order to see full details, timeline, and activity history.',
      },
      {
        title: 'Bulk Actions',
        content: 'Select multiple orders to perform bulk operations like export or status change.',
      },
    ],
  },
  factory: {
    title: 'Factory Tracking Help',
    sections: [
      {
        title: 'Kanban Board',
        content: 'Orders are shown as cards in columns representing departments.',
      },
      {
        title: 'Moving Orders',
        content: 'Managers can drag cards between columns to move orders through production.',
      },
      {
        title: 'Priority Colors',
        content: 'Red = Urgent, Orange = High, Blue = Medium, Gray = Low priority.',
      },
      {
        title: 'Order Cards',
        content: 'Each card shows order number, customer, and time in current department.',
      },
    ],
  },
  reports: {
    title: 'Reports Help',
    sections: [
      {
        title: 'Generating Reports',
        content: 'Select report type, date range, and filters, then click Generate.',
      },
      {
        title: 'Export Options',
        content: 'Download reports as PDF, Excel, or CSV for further analysis.',
      },
      {
        title: 'Scheduled Reports',
        content: 'Set up automatic reports to be emailed daily, weekly, or monthly.',
      },
      {
        title: 'Custom Reports',
        content: 'Save filter configurations as templates for quick access.',
      },
    ],
  },
  users: {
    title: 'User Management Help',
    sections: [
      {
        title: 'Adding Users',
        content: 'Click "+ Add User" to create accounts. Users receive email invitations.',
      },
      {
        title: 'Roles',
        content: 'Assign appropriate roles: Admin, Manager, or Worker based on responsibilities.',
      },
      {
        title: 'Departments',
        content: 'Workers must be assigned to a department to see relevant orders.',
      },
      {
        title: 'Deactivating',
        content: 'Deactivate instead of delete to preserve user history and audit trails.',
      },
    ],
  },
};

export const HelpPanel: React.FC<HelpPanelProps> = ({ page, isOpen, onClose }) => {
  const content = pageHelpContent[page];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-25 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl z-50 overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{content.title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {content.sections.map((section, index) => (
            <div key={index}>
              <h3 className="font-medium text-gray-900 mb-2">{section.title}</h3>
              <p className="text-sm text-gray-600">{section.content}</p>
            </div>
          ))}

          <div className="pt-4 border-t border-gray-200">
            <h3 className="font-medium text-gray-900 mb-2">Need More Help?</h3>
            <div className="space-y-2 text-sm">
              <a href="/docs/USER_GUIDE.md" className="block text-blue-600 hover:underline">
                📖 Read the User Guide
              </a>
              <a href="/tutorials" className="block text-blue-600 hover:underline">
                🎥 Watch Video Tutorials
              </a>
              <a
                href="mailto:support@goldfactory.com"
                className="block text-blue-600 hover:underline"
              >
                ✉️ Contact Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// =============================================================================
// Help Button (Floating)
// =============================================================================

interface FloatingHelpButtonProps {
  page: 'dashboard' | 'orders' | 'factory' | 'reports' | 'users';
}

export const FloatingHelpButton: React.FC<FloatingHelpButtonProps> = ({ page }) => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsPanelOpen(true)}
        className="fixed bottom-6 right-6 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center z-30"
        aria-label="Open help panel"
      >
        <HelpCircle className="w-6 h-6" />
      </button>

      <HelpPanel page={page} isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />
    </>
  );
};

// =============================================================================
// Usage Examples
// =============================================================================

/*
// In a form:
<FormFieldWithHelp label="Customer Name" helpKey="customerName" required>
  <input type="text" className="form-input" />
</FormFieldWithHelp>

// Inline tooltip:
<div className="flex items-center">
  <span>Order Priority</span>
  <HelpTooltip helpKey="priority" />
</div>

// On a page:
<FloatingHelpButton page="orders" />

// With label:
<HelpPopover helpKey="kanbanBoard">
  <h2>Factory Tracking</h2>
</HelpPopover>
*/

export default {
  HelpTooltip,
  HelpPopover,
  FormFieldWithHelp,
  HelpPanel,
  FloatingHelpButton,
  helpContent,
};
