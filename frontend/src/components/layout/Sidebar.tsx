import React, { Fragment, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  CubeIcon,
  UsersIcon,
  BuildingOfficeIcon,
  TruckIcon,
  DocumentCheckIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { cn } from '../../utils/helpers';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types/auth.types';

// Navigation items with role-based visibility
const getNavigation = (userRole: UserRole) => {
  const allItems = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, roles: 'all' },
    {
      name: 'Orders',
      href: '/orders',
      icon: ClipboardDocumentListIcon,
      roles: [UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.DEPARTMENT_WORKER],
    },
    {
      name: 'Factory Tracking',
      href: '/factory',
      icon: TruckIcon,
      roles: [UserRole.ADMIN, UserRole.FACTORY_MANAGER, UserRole.DEPARTMENT_WORKER],
    },
    {
      name: 'Submissions',
      href: '/submissions',
      icon: DocumentCheckIcon,
      roles: [UserRole.ADMIN, UserRole.FACTORY_MANAGER, UserRole.DEPARTMENT_WORKER],
    },
    {
      name: 'My Work',
      href: '/my-work',
      icon: CubeIcon,
      roles: [UserRole.FACTORY_MANAGER, UserRole.DEPARTMENT_WORKER],
    },
    {
      name: 'Departments',
      href: '/departments',
      icon: BuildingOfficeIcon,
      roles: [UserRole.ADMIN, UserRole.FACTORY_MANAGER],
    },
    { name: 'Users', href: '/users', icon: UsersIcon, roles: [UserRole.ADMIN] },
    {
      name: 'Reports',
      href: '/reports',
      icon: ChartBarIcon,
      roles: [UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.FACTORY_MANAGER],
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
  const navigation = getNavigation(user?.role || UserRole.DEPARTMENT_WORKER);
  const [isExpanded, setIsExpanded] = useState(false);

  // Desktop collapsed sidebar (icons only with hover tooltips)
  const CollapsedSidebar = () => (
    <div
      className={cn(
        'flex flex-col h-full bg-white/95 backdrop-blur-xl border-r border-gray-200/50 relative overflow-hidden',
        'transition-[width,padding] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]',
        isExpanded ? 'w-64 px-4' : 'w-20 px-3'
      )}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Decorative gradient orbs */}
      <div
        className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl pointer-events-none transition-opacity duration-700"
        style={{ opacity: isExpanded ? 1 : 0.5 }}
      />
      <div className="absolute bottom-20 left-0 w-24 h-24 bg-gradient-to-tr from-violet-500/10 to-fuchsia-500/5 rounded-full blur-2xl pointer-events-none" />

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
              'rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-violet-600 flex items-center justify-center shadow-xl shadow-indigo-500/30 flex-shrink-0 transition-all duration-500 ease-out',
              isExpanded ? 'h-11 w-11' : 'h-10 w-10'
            )}
          >
            <svg
              className={cn(
                'text-white drop-shadow-sm transition-all duration-500',
                isExpanded ? 'w-6 h-6' : 'w-5 h-5'
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div
            className={cn(
              'overflow-hidden whitespace-nowrap transition-all duration-500 ease-out',
              isExpanded ? 'opacity-100 max-w-[150px] ml-0' : 'opacity-0 max-w-0 ml-0'
            )}
          >
            <span className="text-gray-900 font-bold text-base tracking-tight block">
              Gold Factory
            </span>
            <p className="text-xs text-indigo-500 font-medium">Inventory System</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col mt-4">
        <ul role="list" className="flex flex-1 flex-col gap-y-2">
          <li>
            <ul role="list" className="space-y-1">
              {navigation.map((item) => (
                <li key={item.name} className="relative group">
                  <NavLink
                    to={item.href}
                    className={({ isActive }) =>
                      cn(
                        isActive
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80',
                        'flex items-center rounded-xl p-2.5 text-sm font-medium',
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
                            'flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0',
                            'transition-all duration-300 ease-out',
                            isActive
                              ? 'bg-white/20 shadow-inner'
                              : 'bg-gray-100 group-hover:bg-indigo-100 group-hover:scale-110'
                          )}
                        >
                          <item.icon
                            className={cn(
                              'shrink-0 transition-transform duration-300',
                              isActive
                                ? 'h-5 w-5'
                                : 'h-5 w-5 group-hover:scale-110 group-hover:text-indigo-600'
                            )}
                            aria-hidden="true"
                          />
                        </div>
                        <span
                          className={cn(
                            'whitespace-nowrap transition-all duration-500 ease-out overflow-hidden',
                            isExpanded ? 'opacity-100 max-w-[150px]' : 'opacity-0 max-w-0'
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
                    <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-4 py-2.5 bg-gray-900 backdrop-blur-sm text-white text-sm font-medium rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-out whitespace-nowrap z-50 shadow-2xl border border-gray-700/50 group-hover:translate-x-1">
                      <span className="relative z-10">{item.name}</span>
                      <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0 border-8 border-transparent border-r-gray-900" />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </li>

          {/* User Info & Logout at bottom */}
          <li className="mt-auto pb-4">
            <div className="border-t border-gray-200/50 pt-4">
              {user && (
                <div
                  className={cn(
                    'flex items-center mb-3 bg-gradient-to-r from-gray-100/80 to-gray-50/80 rounded-xl border border-gray-200/50 relative group backdrop-blur-sm',
                    'transition-all duration-500 ease-out hover:border-indigo-300/50',
                    isExpanded ? 'gap-3 px-3 py-3' : 'justify-center p-2.5'
                  )}
                >
                  <div
                    className={cn(
                      'rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-violet-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/25 flex-shrink-0',
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
                    <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>

                  {/* Tooltip for collapsed state */}
                  {!isExpanded && (
                    <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-4 py-3 bg-gray-900 backdrop-blur-sm text-white text-sm rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-out whitespace-nowrap z-50 shadow-2xl border border-gray-700/50 group-hover:translate-x-1">
                      <p className="font-semibold text-white">{user.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>
                      <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0 border-8 border-transparent border-r-gray-900" />
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => logout()}
                className={cn(
                  'w-full flex items-center text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-xl text-sm font-medium group relative',
                  'transition-all duration-300 ease-out hover:translate-x-1',
                  isExpanded ? 'gap-3 px-3 py-2.5' : 'justify-center p-2.5'
                )}
              >
                <div
                  className={cn(
                    'flex items-center justify-center rounded-xl bg-gray-100 flex-shrink-0',
                    'transition-all duration-300 ease-out',
                    'group-hover:bg-red-100 group-hover:scale-110',
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
                  <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-4 py-2.5 bg-gray-900/95 backdrop-blur-sm text-white text-sm font-medium rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-out whitespace-nowrap z-50 shadow-2xl border border-gray-700/50 group-hover:translate-x-1">
                    Sign Out
                    <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0 border-8 border-transparent border-r-gray-900/95" />
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
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex h-16 shrink-0 items-center pt-1">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-violet-600 flex items-center justify-center shadow-xl shadow-indigo-500/30">
            <svg
              className="w-6 h-6 text-white drop-shadow-sm"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <span className="text-gray-900 font-bold text-lg tracking-tight">Gold Factory</span>
            <p className="text-xs text-indigo-500 font-medium">Inventory System</p>
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-4">
          <li>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
              Main Menu
            </p>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  <NavLink
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        isActive
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
                        'group flex gap-x-2.5 rounded-lg p-2 text-sm leading-5 font-medium transition-all duration-300'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div
                          className={cn(
                            'flex items-center justify-center w-7 h-7 rounded-md transition-all duration-300',
                            isActive ? 'bg-white/20' : 'bg-gray-100 group-hover:bg-indigo-100'
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
              ))}
            </ul>
          </li>

          {/* User Info & Logout at bottom */}
          <li className="mt-auto">
            <div className="border-t border-gray-200/50 pt-3">
              {user && (
                <div className="flex items-center gap-2.5 px-2.5 py-2.5 mb-2 bg-gradient-to-r from-gray-100/80 to-gray-50/80 rounded-lg border border-gray-200/50">
                  <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-violet-600 flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-indigo-500/20">
                    {user.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>
              )}
              <button
                onClick={() => logout()}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg text-sm font-medium transition-all duration-300 group"
              >
                <div className="flex items-center justify-center w-7 h-7 rounded-md bg-gray-100 group-hover:bg-red-100 transition-all duration-300">
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
            <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm" />
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
