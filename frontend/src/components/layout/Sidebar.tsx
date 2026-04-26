import React, { Fragment, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  CubeIcon,
  UsersIcon,
  BuildingOfficeIcon,
  TruckIcon,
  DocumentCheckIcon,
  ChartBarIcon,
  ArchiveBoxIcon,
} from '@heroicons/react/24/outline';
import { cn } from '../../utils/helpers';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types/auth.types';
import BrandMark from '../common/BrandMark';

// Navigation items with role-based visibility
type NavItem = {
  name: string;
  href: string;
  icon: React.ForwardRefExoticComponent<any>;
  roles: UserRole[] | 'all';
  children?: { name: string; href: string }[];
};

const getNavigation = (userRole: UserRole): NavItem[] => {
  const allItems: NavItem[] = [
    { name: 'Dashboard', href: '/app/dashboard', icon: HomeIcon, roles: 'all' },
    {
      name: 'Main Inventory',
      href: '/app/inventory',
      icon: ArchiveBoxIcon,
      roles: [UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.FACTORY_MANAGER],
      children: [
        { name: 'Metal Inventory', href: '/app/inventory/metal' },
        { name: 'Diamond Inventory', href: '/app/inventory/diamonds' },
        { name: 'Real Stone', href: '/app/inventory/real-stones' },
        { name: 'Stone Inventory', href: '/app/inventory/stone-packets' },
      ],
    },
    {
      name: 'Orders',
      href: '/app/orders',
      icon: ClipboardDocumentListIcon,
      roles: [UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.DEPARTMENT_WORKER],
    },
    {
      name: 'Factory Tracking',
      href: '/app/factory',
      icon: TruckIcon,
      roles: [UserRole.ADMIN, UserRole.FACTORY_MANAGER, UserRole.DEPARTMENT_WORKER],
    },
    {
      name: 'Submissions',
      href: '/app/submissions',
      icon: DocumentCheckIcon,
      roles: [UserRole.ADMIN, UserRole.FACTORY_MANAGER, UserRole.DEPARTMENT_WORKER],
    },
    {
      name: 'My Work',
      href: '/app/my-work',
      icon: CubeIcon,
      roles: [UserRole.FACTORY_MANAGER, UserRole.DEPARTMENT_WORKER],
    },
    {
      name: 'Departments',
      href: '/app/departments',
      icon: BuildingOfficeIcon,
      roles: [UserRole.ADMIN, UserRole.FACTORY_MANAGER],
    },
    { name: 'Users', href: '/app/users', icon: UsersIcon, roles: [UserRole.ADMIN] },
    {
      name: 'Reports',
      href: '/app/reports',
      icon: ChartBarIcon,
      roles: [UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.FACTORY_MANAGER],
    },
    {
      name: 'Client Management',
      href: '/app/admin/clients',
      icon: UsersIcon,
      roles: [UserRole.ADMIN, UserRole.OFFICE_STAFF],
    },
    {
      name: 'Vendor Info',
      href: '/app/vendors',
      icon: BuildingOfficeIcon,
      roles: [UserRole.ADMIN, UserRole.OFFICE_STAFF],
    },
    {
      name: 'Order Approvals',
      href: '/app/admin/order-approvals',
      icon: DocumentCheckIcon,
      roles: [UserRole.ADMIN, UserRole.OFFICE_STAFF],
    },
    {
      name: 'Feature Toggle',
      href: '/app/admin/features',
      icon: CubeIcon,
      roles: [UserRole.ADMIN],
    },
    {
      name: 'Factory Inventory',
      href: '/app/inventory/factory',
      icon: BuildingOfficeIcon,
      roles: [UserRole.ADMIN, UserRole.FACTORY_MANAGER],
    },
    {
      name: 'Attendance',
      href: '/app/attendance/dashboard',
      icon: ClipboardDocumentListIcon,
      roles: 'all',
    },
    {
      name: 'Payroll',
      href: '/app/payroll',
      icon: ChartBarIcon,
      roles: [UserRole.ADMIN, UserRole.FACTORY_MANAGER],
    },
  ];

  return allItems.filter((item) => {
    if (item.roles === 'all') return true;
    return (item.roles as UserRole[]).includes(userRole);
  });
};

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const navigation = getNavigation(user?.role || UserRole.DEPARTMENT_WORKER);
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean | undefined>>({});
  const location = useLocation();

  // Auto-expand the inventory group if we're on a child inventory page
  // (but NOT Factory Inventory, which is a separate sidebar item).
  const inventoryChildPaths = ['/app/inventory/metal', '/app/inventory/diamonds', '/app/inventory/real-stones', '/app/inventory/stone-packets'];
  const isInventoryActive = location.pathname === '/app/inventory' || inventoryChildPaths.some((p) => location.pathname.startsWith(p));

  const isGroupOpen = (name: string) => {
    // If user explicitly toggled, respect their choice
    if (expandedGroups[name] !== undefined) return expandedGroups[name]!;
    // Otherwise auto-expand if on an inventory child page
    return isInventoryActive;
  };

  const toggleGroup = (name: string) => {
    setExpandedGroups((prev) => {
      const current = prev[name] !== undefined ? prev[name]! : isInventoryActive;
      return { ...prev, [name]: !current };
    });
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Desktop collapsed sidebar (icons only with hover tooltips)
  const CollapsedSidebar = () => (
    <div
      className={cn(
        'flex flex-col h-full bg-pearl/95 backdrop-blur-xl border-r border-champagne-200/60 relative overflow-hidden',
        'transition-[width,padding] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]',
        isExpanded ? 'w-72 px-4' : 'w-20 px-3'
      )}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Decorative gradient orbs */}
      <div
        className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-champagne-300/30 to-gold-leaf/15 rounded-full blur-3xl pointer-events-none transition-opacity duration-700"
        style={{ opacity: isExpanded ? 1 : 0.5 }}
      />
      <div className="absolute bottom-20 left-0 w-24 h-24 bg-gradient-to-tr from-gold-leaf/15 to-champagne-200/10 rounded-full blur-2xl pointer-events-none" />

      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center pt-2">
        <div
          className={cn(
            'flex items-center transition-all duration-500 ease-out',
            isExpanded ? 'gap-3' : 'gap-0 justify-center w-full'
          )}
        >
          <div
            className={cn(
              'rounded-xl bg-gradient-to-br from-onyx-800 via-onyx-900 to-onyx-700 flex items-center justify-center shadow-xl shadow-onyx flex-shrink-0 transition-all duration-500 ease-out ring-1 ring-champagne-300/30',
              isExpanded ? 'h-12 w-12' : 'h-11 w-11'
            )}
          >
            <BrandMark
              className={cn(
                'drop-shadow-sm transition-all duration-500',
                isExpanded ? 'w-9 h-9' : 'w-8 h-8'
              )}
            />
          </div>
          <div
            className={cn(
              'overflow-hidden whitespace-nowrap transition-all duration-500 ease-out',
              isExpanded ? 'opacity-100 max-w-[150px] ml-0' : 'opacity-0 max-w-0 ml-0'
            )}
          >
            <span className="text-onyx-900 font-bold text-base tracking-tight block">
              Gold Factory
            </span>
            <p className="text-xs text-champagne-700 font-medium">Inventory System</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col mt-4 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-champagne-300 scrollbar-track-transparent">
        <ul role="list" className="flex flex-1 flex-col gap-y-2 pb-4">
          <li>
            <ul role="list" className="space-y-0.5">
              {navigation.map((item) => {
                const hasChildren = item.children && item.children.length > 0;
                const groupOpen = hasChildren && isGroupOpen(item.name);
                const isParentActive =
                  hasChildren && (location.pathname === item.href || item.children!.some((c) => location.pathname.startsWith(c.href)));

                if (hasChildren) {
                  // Collapsed: render as a regular NavLink (pixel-perfect match with other icons)
                  if (!isExpanded) {
                    return (
                      <li key={item.name} className="relative group">
                        <NavLink
                          to={item.href}
                          className={({ isActive }) =>
                            cn(
                              isActive || isParentActive
                                ? 'bg-gradient-to-r from-champagne-700 to-champagne-800 text-pearl shadow-lg shadow-luxe'
                                : 'text-onyx-600 hover:text-onyx-900 hover:bg-champagne-100/70',
                              'flex items-center rounded-xl p-2 text-sm font-medium',
                              'transition-all duration-300 ease-out',
                              'hover:translate-x-1',
                              'justify-center'
                            )
                          }
                        >
                          {({ isActive }) => (
                            <div
                              className={cn(
                                'flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0',
                                'transition-all duration-300 ease-out',
                                isActive || isParentActive
                                  ? 'bg-white/20 shadow-inner'
                                  : 'bg-champagne-50 group-hover:bg-champagne-100 group-hover:scale-110'
                              )}
                            >
                              <item.icon
                                className={cn(
                                  'shrink-0 h-6 w-6 transition-transform duration-300',
                                  !(isActive || isParentActive) && 'group-hover:scale-110 group-hover:text-champagne-800'
                                )}
                                aria-hidden="true"
                              />
                            </div>
                          )}
                        </NavLink>
                        <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-4 py-2.5 bg-onyx-900 backdrop-blur-sm text-white text-sm font-medium rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-out whitespace-nowrap z-50 shadow-2xl border border-onyx-700/60 group-hover:translate-x-1">
                          <span className="relative z-10">{item.name}</span>
                          <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0 border-8 border-transparent border-r-onyx-900" />
                        </div>
                      </li>
                    );
                  }

                  // Expanded: render as toggle button with collapsible children
                  return (
                    <li key={item.name} className="relative group">
                      <button
                        onClick={() => toggleGroup(item.name)}
                        className={cn(
                          isParentActive
                            ? 'bg-gradient-to-r from-champagne-700 to-champagne-800 text-pearl shadow-lg shadow-luxe'
                            : 'text-onyx-600 hover:text-onyx-900 hover:bg-champagne-100/70',
                          'w-full flex items-center gap-x-3 rounded-xl p-2 text-sm font-medium',
                          'transition-all duration-300 ease-out',
                          'hover:translate-x-1'
                        )}
                      >
                        <div
                          className={cn(
                            'flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0',
                            'transition-all duration-300 ease-out',
                            isParentActive
                              ? 'bg-white/20 shadow-inner'
                              : 'bg-champagne-50 group-hover:bg-champagne-100 group-hover:scale-110'
                          )}
                        >
                          <item.icon
                            className={cn(
                              'shrink-0 h-6 w-6 transition-transform duration-300',
                              !isParentActive && 'group-hover:scale-110 group-hover:text-champagne-800'
                            )}
                            aria-hidden="true"
                          />
                        </div>
                        <span className="whitespace-nowrap flex-1 text-left">
                          {item.name}
                        </span>
                        <ChevronDownIcon
                          className={cn(
                            'h-4 w-4 flex-shrink-0 transition-transform duration-300',
                            groupOpen ? 'rotate-180' : ''
                          )}
                        />
                      </button>

                      {/* Children */}
                      <div
                        className={cn(
                          'overflow-hidden transition-all duration-300 ease-out',
                          groupOpen ? 'max-h-96 opacity-100 mt-1' : 'max-h-0 opacity-0'
                        )}
                      >
                        <ul className="ml-6 pl-4 border-l-2 border-champagne-200/60 space-y-0.5">
                          {item.children!.map((child) => (
                            <li key={child.name}>
                              <NavLink
                                to={child.href}
                                onClick={() => setIsExpanded(false)}
                                className={({ isActive }) =>
                                  cn(
                                    isActive
                                      ? 'text-champagne-800 font-semibold bg-champagne-100'
                                      : 'text-onyx-500 hover:text-onyx-900 hover:bg-champagne-50',
                                    'block rounded-lg px-3 py-2 text-sm transition-all duration-200'
                                  )
                                }
                              >
                                {child.name}
                              </NavLink>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </li>
                  );
                }

                return (
                <li key={item.name} className="relative group">
                  <NavLink
                    to={item.href}
                    onClick={() => setIsExpanded(false)}
                    className={({ isActive }) =>
                      cn(
                        isActive
                          ? 'bg-gradient-to-r from-champagne-700 to-champagne-800 text-pearl shadow-lg shadow-luxe'
                          : 'text-onyx-600 hover:text-onyx-900 hover:bg-champagne-100/70',
                        'flex items-center rounded-xl p-2 text-sm font-medium',
                        'transition-all duration-300 ease-out',
                        'hover:translate-x-1',
                        isExpanded ? 'gap-x-3' : 'justify-center'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div
                          className={cn(
                            'flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0',
                            'transition-all duration-300 ease-out',
                            isActive
                              ? 'bg-white/20 shadow-inner'
                              : 'bg-champagne-50 group-hover:bg-champagne-100 group-hover:scale-110'
                          )}
                        >
                          <item.icon
                            className={cn(
                              'shrink-0 transition-transform duration-300',
                              isActive
                                ? 'h-6 w-6'
                                : 'h-6 w-6 group-hover:scale-110 group-hover:text-champagne-800'
                            )}
                            aria-hidden="true"
                          />
                        </div>
                        <span
                          className={cn(
                            'whitespace-nowrap transition-all duration-500 ease-out overflow-hidden',
                            isExpanded ? 'opacity-100 max-w-[180px]' : 'opacity-0 max-w-0'
                          )}
                        >
                          {item.name}
                        </span>
                        <div
                          className={cn(
                            'ml-auto w-2 h-2 rounded-full bg-white transition-all duration-300',
                            isActive && isExpanded ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
                          )}
                        />
                      </>
                    )}
                  </NavLink>

                  {/* Tooltip for collapsed state */}
                  {!isExpanded && (
                    <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-4 py-2.5 bg-onyx-900 backdrop-blur-sm text-white text-sm font-medium rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-out whitespace-nowrap z-50 shadow-2xl border border-onyx-700/60 group-hover:translate-x-1">
                      <span className="relative z-10">{item.name}</span>
                      <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0 border-8 border-transparent border-r-onyx-900" />
                    </div>
                  )}
                </li>
                );
              })}
            </ul>
          </li>

          {/* User Info & Logout at bottom */}
          <li className="mt-auto pb-4">
            <div className="border-t border-champagne-200/60 pt-4">
              {user && (
                <div
                  className={cn(
                    'flex items-center mb-3 bg-gradient-to-r from-champagne-50/80 to-pearl/80 rounded-xl border border-champagne-200/60 relative group backdrop-blur-sm',
                    'transition-all duration-500 ease-out hover:border-champagne-400/60',
                    isExpanded ? 'gap-3 px-3 py-3' : 'justify-center p-2.5'
                  )}
                >
                  <div
                    className={cn(
                      'rounded-xl bg-gradient-to-br from-onyx-800 via-onyx-900 to-onyx-700 flex items-center justify-center text-white font-bold shadow-lg shadow-luxe flex-shrink-0',
                      'transition-all duration-500 ease-out',
                      isExpanded ? 'h-10 w-10 text-sm' : 'h-9 w-9 text-xs'
                    )}
                  >
                    {user.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                  <div
                    className={cn(
                      'flex-1 min-w-0 transition-all duration-500 ease-out overflow-hidden',
                      isExpanded ? 'opacity-100 max-w-[150px]' : 'opacity-0 max-w-0'
                    )}
                  >
                    <p className="text-sm font-semibold text-onyx-900 truncate">{user.name}</p>
                    <p className="text-xs text-onyx-500 truncate">{user.email}</p>
                  </div>

                  {/* Tooltip for collapsed state */}
                  {!isExpanded && (
                    <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-4 py-3 bg-onyx-900 backdrop-blur-sm text-white text-sm rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-out whitespace-nowrap z-50 shadow-2xl border border-onyx-700/60 group-hover:translate-x-1">
                      <p className="font-semibold text-white">{user.name}</p>
                      <p className="text-xs text-champagne-300 mt-0.5">{user.email}</p>
                      <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0 border-8 border-transparent border-r-onyx-900" />
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={handleLogout}
                className={cn(
                  'w-full flex items-center text-onyx-500 hover:text-accent-ruby hover:bg-accent-ruby/10 rounded-xl text-sm font-medium group relative',
                  'transition-all duration-300 ease-out hover:translate-x-1',
                  isExpanded ? 'gap-3 px-3 py-2.5' : 'justify-center p-2.5'
                )}
              >
                <div
                  className={cn(
                    'flex items-center justify-center rounded-xl bg-champagne-50 flex-shrink-0',
                    'transition-all duration-300 ease-out',
                    'group-hover:bg-accent-ruby/15 group-hover:scale-110',
                    isExpanded ? 'w-9 h-9' : 'w-9 h-9'
                  )}
                >
                  <svg
                    className="h-5 w-5 transition-transform duration-300 group-hover:scale-110"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                </div>
                <span
                  className={cn(
                    'whitespace-nowrap transition-all duration-500 ease-out overflow-hidden',
                    isExpanded ? 'opacity-100 max-w-[100px]' : 'opacity-0 max-w-0'
                  )}
                >
                  Sign Out
                </span>

                {/* Tooltip for collapsed state */}
                {!isExpanded && (
                  <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-4 py-2.5 bg-onyx-900/95 backdrop-blur-sm text-white text-sm font-medium rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-out whitespace-nowrap z-50 shadow-2xl border border-onyx-700/60 group-hover:translate-x-1">
                    Sign Out
                    <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0 border-8 border-transparent border-r-onyx-900/95" />
                  </div>
                )}
              </button>
            </div>
          </li>
        </ul>
      </nav>
    </div>
  );

  // Full sidebar content for mobile
  const MobileSidebarContent = () => (
    <div className="flex grow flex-col gap-y-3 overflow-y-auto bg-white px-4 pb-3 relative">
      {/* Decorative gradient orb */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-champagne-300/30 to-gold-leaf/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex h-16 shrink-0 items-center pt-1">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-onyx-800 via-onyx-900 to-onyx-700 flex items-center justify-center shadow-xl shadow-onyx ring-1 ring-champagne-300/30">
            <BrandMark className="w-8 h-8 drop-shadow-sm" />
          </div>
          <div>
            <span className="text-onyx-900 font-bold text-lg tracking-tight">Gold Factory</span>
            <p className="text-xs text-champagne-700 font-medium">Inventory System</p>
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-4">
          <li>
            <p className="text-xs font-semibold text-onyx-500 uppercase tracking-wider mb-2 px-2">
              Main Menu
            </p>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => {
                const hasChildren = item.children && item.children.length > 0;
                const groupOpen = hasChildren && isGroupOpen(item.name);
                const isParentActive =
                  hasChildren && (location.pathname === item.href || item.children!.some((c) => location.pathname.startsWith(c.href)));

                if (hasChildren) {
                  return (
                    <li key={item.name}>
                      <button
                        onClick={() => toggleGroup(item.name)}
                        className={cn(
                          isParentActive
                            ? 'bg-gradient-to-r from-champagne-700 to-champagne-800 text-pearl shadow-lg shadow-luxe'
                            : 'text-onyx-600 hover:text-onyx-900 hover:bg-champagne-100',
                          'w-full group flex gap-x-2.5 rounded-lg p-2 text-sm leading-5 font-medium transition-all duration-300'
                        )}
                      >
                        <div
                          className={cn(
                            'flex items-center justify-center w-7 h-7 rounded-md transition-all duration-300',
                            isParentActive ? 'bg-white/20' : 'bg-champagne-50 group-hover:bg-champagne-100'
                          )}
                        >
                          <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                        </div>
                        <span className="my-auto flex-1 text-left">{item.name}</span>
                        <ChevronDownIcon
                          className={cn(
                            'h-4 w-4 my-auto transition-transform duration-300',
                            groupOpen ? 'rotate-180' : ''
                          )}
                        />
                      </button>
                      <div
                        className={cn(
                          'overflow-hidden transition-all duration-300',
                          groupOpen ? 'max-h-96 opacity-100 mt-1' : 'max-h-0 opacity-0'
                        )}
                      >
                        <ul className="ml-4 pl-4 border-l-2 border-champagne-200/60 space-y-0.5">
                          {item.children!.map((child) => (
                            <li key={child.name}>
                              <NavLink
                                to={child.href}
                                onClick={() => setSidebarOpen(false)}
                                className={({ isActive }) =>
                                  cn(
                                    isActive
                                      ? 'text-champagne-800 font-semibold bg-champagne-100'
                                      : 'text-onyx-500 hover:text-onyx-900 hover:bg-champagne-50',
                                    'block rounded-lg px-3 py-2 text-sm transition-all duration-200'
                                  )
                                }
                              >
                                {child.name}
                              </NavLink>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </li>
                  );
                }

                return (
                <li key={item.name}>
                  <NavLink
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        isActive
                          ? 'bg-gradient-to-r from-champagne-700 to-champagne-800 text-pearl shadow-lg shadow-luxe'
                          : 'text-onyx-600 hover:text-onyx-900 hover:bg-champagne-100',
                        'group flex gap-x-2.5 rounded-lg p-2 text-sm leading-5 font-medium transition-all duration-300'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div
                          className={cn(
                            'flex items-center justify-center w-7 h-7 rounded-md transition-all duration-300',
                            isActive ? 'bg-white/20' : 'bg-champagne-50 group-hover:bg-champagne-100'
                          )}
                        >
                          <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                        </div>
                        <span className="my-auto">{item.name}</span>
                        {isActive && (
                          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        )}
                      </>
                    )}
                  </NavLink>
                </li>
                );
              })}
            </ul>
          </li>

          {/* User Info & Logout at bottom */}
          <li className="mt-auto">
            <div className="border-t border-champagne-200/60 pt-3">
              {user && (
                <div className="flex items-center gap-2.5 px-2.5 py-2.5 mb-2 bg-gradient-to-r from-champagne-50/80 to-pearl/80 rounded-lg border border-champagne-200/60">
                  <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-onyx-800 via-onyx-900 to-onyx-700 flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-luxe">
                    {user.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-onyx-900 truncate">{user.name}</p>
                    <p className="text-xs text-onyx-500 truncate">{user.email}</p>
                  </div>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 text-onyx-500 hover:text-accent-ruby hover:bg-accent-ruby/10 rounded-lg text-sm font-medium transition-all duration-300 group"
              >
                <div className="flex items-center justify-center w-7 h-7 rounded-md bg-champagne-50 group-hover:bg-accent-ruby/15 transition-all duration-300">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                </div>
                Sign Out
              </button>
            </div>
          </li>
        </ul>
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile sidebar */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-onyx-900/80 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button
                      type="button"
                      className="-m-2.5 p-2.5 rounded-lg hover:bg-white/10 transition-colors"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                <MobileSidebarContent />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Desktop sidebar - collapsible with hover */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex">
        <CollapsedSidebar />
      </div>
    </>
  );
};

export default Sidebar;
