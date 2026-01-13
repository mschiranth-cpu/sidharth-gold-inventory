import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// =============================================================================
// Help Context Types
// =============================================================================

interface HelpContextType {
  // Help panel state
  isHelpPanelOpen: boolean;
  openHelpPanel: () => void;
  closeHelpPanel: () => void;
  toggleHelpPanel: () => void;

  // Current page context
  currentPage: string;
  setCurrentPage: (page: string) => void;

  // Tooltip visibility
  tooltipsEnabled: boolean;
  enableTooltips: () => void;
  disableTooltips: () => void;
  toggleTooltips: () => void;

  // First-time user guide
  showOnboarding: boolean;
  completeOnboarding: () => void;
  resetOnboarding: () => void;

  // Search help content
  searchHelp: (query: string) => HelpSearchResult[];
}

interface HelpSearchResult {
  key: string;
  title: string;
  content: string;
  relevance: number;
}

// =============================================================================
// Help Content Database
// =============================================================================

export const helpDatabase: Record<string, { title: string; content: string; keywords: string[] }> =
  {
    // Dashboard
    dashboard: {
      title: 'Dashboard Overview',
      content: 'Your command center showing key metrics and recent activity.',
      keywords: ['home', 'main', 'overview', 'stats', 'statistics'],
    },
    totalOrders: {
      title: 'Total Active Orders',
      content: 'Number of orders currently in the production pipeline.',
      keywords: ['count', 'active', 'orders', 'total'],
    },
    dueToday: {
      title: 'Orders Due Today',
      content: 'Orders that need to be completed by end of day.',
      keywords: ['today', 'due', 'urgent', 'deadline'],
    },
    overdueOrders: {
      title: 'Overdue Orders',
      content: 'Orders that have passed their due date and need immediate attention.',
      keywords: ['late', 'overdue', 'delayed', 'past due'],
    },

    // Orders
    createOrder: {
      title: 'Creating Orders',
      content: 'Go to Orders > New Order. Fill in customer info, product details, and due date.',
      keywords: ['new', 'create', 'add', 'order', 'customer'],
    },
    editOrder: {
      title: 'Editing Orders',
      content:
        'Click on an order to open details. Click Edit to modify. Only managers can edit orders in production.',
      keywords: ['edit', 'modify', 'update', 'change'],
    },
    deleteOrder: {
      title: 'Canceling Orders',
      content:
        'Orders cannot be deleted but can be canceled by managers. Canceled orders are preserved for records.',
      keywords: ['delete', 'cancel', 'remove'],
    },
    orderStatus: {
      title: 'Order Status',
      content:
        'Status shows progress: Pending > In Progress > Quality Check > Completed > Delivered.',
      keywords: ['status', 'progress', 'state', 'stage'],
    },
    orderPriority: {
      title: 'Order Priority',
      content: 'Low = flexible, Medium = standard, High = important, Urgent = rush order.',
      keywords: ['priority', 'urgent', 'important', 'rush'],
    },

    // Factory
    kanbanBoard: {
      title: 'Kanban Board',
      content: 'Visual board showing orders in each department. Drag cards to move orders.',
      keywords: ['kanban', 'board', 'visual', 'tracking', 'factory'],
    },
    movingOrders: {
      title: 'Moving Orders',
      content: 'Managers can drag order cards between departments or use the Move Order button.',
      keywords: ['move', 'transfer', 'next', 'department'],
    },
    departments: {
      title: 'Departments',
      content:
        'Production stages: Receiving > Melting > Designing > Moulding > Polishing > QC > Packaging > Dispatch.',
      keywords: ['department', 'stage', 'production', 'workflow'],
    },

    // Reports
    generateReport: {
      title: 'Generating Reports',
      content: 'Go to Reports, select type, set date range, apply filters, click Generate.',
      keywords: ['report', 'generate', 'create', 'analytics'],
    },
    exportReport: {
      title: 'Exporting Reports',
      content: 'After generating, click Export and choose PDF, Excel, or CSV format.',
      keywords: ['export', 'download', 'pdf', 'excel', 'csv'],
    },
    scheduledReports: {
      title: 'Scheduled Reports',
      content: 'Set up automatic reports to be emailed daily, weekly, or monthly.',
      keywords: ['schedule', 'automatic', 'email', 'recurring'],
    },

    // Users
    addUser: {
      title: 'Adding Users',
      content: 'Go to Admin > Users > Add User. Enter email, name, role, and department.',
      keywords: ['add', 'create', 'new', 'user', 'account'],
    },
    userRoles: {
      title: 'User Roles',
      content: 'Admin = full access, Manager = oversight, Worker = department orders.',
      keywords: ['role', 'permission', 'access', 'admin', 'manager', 'worker'],
    },
    resetPassword: {
      title: 'Password Reset',
      content: 'Admin can reset user passwords from User Management. User receives email.',
      keywords: ['password', 'reset', 'forgot', 'login'],
    },

    // General
    notifications: {
      title: 'Notifications',
      content: 'Click bell icon to see alerts. Configure preferences in Settings > Notifications.',
      keywords: ['notification', 'alert', 'bell', 'message'],
    },
    search: {
      title: 'Search',
      content:
        'Use the search bar to find orders by number, customer, or product. Ctrl+K for quick search.',
      keywords: ['search', 'find', 'lookup', 'filter'],
    },
    settings: {
      title: 'Settings',
      content: 'Access profile, preferences, and account settings from the user menu.',
      keywords: ['settings', 'preferences', 'profile', 'account'],
    },
    logout: {
      title: 'Logging Out',
      content: 'Click your avatar > Log Out. Always log out on shared computers.',
      keywords: ['logout', 'sign out', 'exit'],
    },
  };

// =============================================================================
// Help Context Provider
// =============================================================================

const HelpContext = createContext<HelpContextType | undefined>(undefined);

interface HelpProviderProps {
  children: ReactNode;
}

export const HelpProvider: React.FC<HelpProviderProps> = ({ children }) => {
  const [isHelpPanelOpen, setIsHelpPanelOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [tooltipsEnabled, setTooltipsEnabled] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    // Check localStorage for onboarding status
    if (typeof window !== 'undefined') {
      return localStorage.getItem('onboarding_completed') !== 'true';
    }
    return true;
  });

  const openHelpPanel = useCallback(() => setIsHelpPanelOpen(true), []);
  const closeHelpPanel = useCallback(() => setIsHelpPanelOpen(false), []);
  const toggleHelpPanel = useCallback(() => setIsHelpPanelOpen((prev) => !prev), []);

  const enableTooltips = useCallback(() => setTooltipsEnabled(true), []);
  const disableTooltips = useCallback(() => setTooltipsEnabled(false), []);
  const toggleTooltips = useCallback(() => setTooltipsEnabled((prev) => !prev), []);

  const completeOnboarding = useCallback(() => {
    setShowOnboarding(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('onboarding_completed', 'true');
    }
  }, []);

  const resetOnboarding = useCallback(() => {
    setShowOnboarding(true);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('onboarding_completed');
    }
  }, []);

  const searchHelp = useCallback((query: string): HelpSearchResult[] => {
    if (!query.trim()) return [];

    const lowerQuery = query.toLowerCase();
    const results: HelpSearchResult[] = [];

    Object.entries(helpDatabase).forEach(([key, item]) => {
      let relevance = 0;

      // Check title match
      if (item.title.toLowerCase().includes(lowerQuery)) {
        relevance += 10;
      }

      // Check content match
      if (item.content.toLowerCase().includes(lowerQuery)) {
        relevance += 5;
      }

      // Check keyword matches
      item.keywords.forEach((keyword) => {
        if (keyword.includes(lowerQuery) || lowerQuery.includes(keyword)) {
          relevance += 3;
        }
      });

      if (relevance > 0) {
        results.push({
          key,
          title: item.title,
          content: item.content,
          relevance,
        });
      }
    });

    // Sort by relevance
    return results.sort((a, b) => b.relevance - a.relevance).slice(0, 5);
  }, []);

  const value: HelpContextType = {
    isHelpPanelOpen,
    openHelpPanel,
    closeHelpPanel,
    toggleHelpPanel,
    currentPage,
    setCurrentPage,
    tooltipsEnabled,
    enableTooltips,
    disableTooltips,
    toggleTooltips,
    showOnboarding,
    completeOnboarding,
    resetOnboarding,
    searchHelp,
  };

  return <HelpContext.Provider value={value}>{children}</HelpContext.Provider>;
};

// =============================================================================
// Hook
// =============================================================================

export const useHelp = (): HelpContextType => {
  const context = useContext(HelpContext);
  if (context === undefined) {
    throw new Error('useHelp must be used within a HelpProvider');
  }
  return context;
};

// =============================================================================
// Keyboard Shortcut Hook
// =============================================================================

export const useHelpKeyboardShortcuts = () => {
  const { toggleHelpPanel } = useHelp();

  // Set up keyboard listener
  useState(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl + / or F1 to toggle help
      if ((event.ctrlKey && event.key === '/') || event.key === 'F1') {
        event.preventDefault();
        toggleHelpPanel();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
    return undefined;
  });
};

export default HelpProvider;
