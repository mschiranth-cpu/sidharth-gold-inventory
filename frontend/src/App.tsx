import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import { AuthProvider } from './contexts/AuthContext';
import {
  ProtectedRoute,
  AdminRoute,
  OfficeRoute,
  FactoryRoute,
  AuthenticatedRoute,
} from './components/auth';
import { UserRole } from './types/auth.types';
import { PageSkeleton, DashboardSkeleton, TableSkeleton } from './components/common/Skeleton';
import NavigationLoader from './components/common/NavigationLoader';
import { WorkerNotification } from './components/WorkerNotification';
import NotificationPermissionPrompt from './components/NotificationPermissionPrompt';

// ============================================
// LAZY LOADED ROUTE COMPONENTS
// ============================================

// Auth pages
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const UnauthorizedPage = lazy(() => import('./pages/auth/UnauthorizedPage'));

// Dashboard
const Dashboard = lazy(() =>
  import('./modules/dashboard').then((module) => ({ default: module.Dashboard }))
);

// Orders
const CreateOrderPage = lazy(() =>
  import('./modules/orders').then((module) => ({ default: module.CreateOrderPage }))
);
const EditOrderPage = lazy(() =>
  import('./modules/orders').then((module) => ({ default: module.EditOrderPage }))
);
const OrdersListPage = lazy(() =>
  import('./modules/orders').then((module) => ({ default: module.OrdersListPage }))
);
const OrderDetailPage = lazy(() =>
  import('./modules/orders').then((module) => ({ default: module.OrderDetailPage }))
);

// Factory
const FactoryTrackingPage = lazy(() =>
  import('./modules/factory').then((module) => ({ default: module.FactoryTrackingPage }))
);

// Reports (heavy charts - load separately)
const ReportsPage = lazy(() =>
  import('./modules/reports').then((module) => ({ default: module.ReportsPage }))
);

// Users
const UsersPage = lazy(() =>
  import('./modules/users').then((module) => ({ default: module.UsersPage }))
);

// Placeholder pages - will be expanded
const InventoryPage = lazy(() =>
  Promise.resolve({
    default: () => (
      <div className="card">
        <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
        <p className="mt-2 text-gray-600">Track your gold inventory</p>
      </div>
    ),
  })
);

const DepartmentsPage = lazy(() => import('./modules/departments/components/DepartmentsPage'));
const DepartmentDetailPage = lazy(
  () => import('./modules/departments/components/DepartmentDetailPage')
);
const DepartmentEditPage = lazy(
  () => import('./modules/departments/components/DepartmentEditPage')
);
const DepartmentWorkersPage = lazy(
  () => import('./modules/departments/components/DepartmentWorkersPage')
);

const MyWorkPage = lazy(() => import('./pages/mywork/MyWorkPage'));
const WorkSubmissionPage = lazy(() => import('./pages/work/WorkSubmissionPage'));

const ProfilePage = lazy(() => import('./pages/profile/ProfilePage'));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'));
const SubmissionsPage = lazy(() => import('./pages/submissions/SubmissionsPage'));

// ============================================
// SUSPENSE WRAPPER COMPONENT
// ============================================

interface LazyRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

function LazyRoute({ children, fallback }: LazyRouteProps) {
  return <Suspense fallback={fallback || <PageSkeleton />}>{children}</Suspense>;
}

function App() {
  return (
    <AuthProvider>
      <NavigationLoader />
      <WorkerNotification />
      <NotificationPermissionPrompt />
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <LoginPage />
            </Suspense>
          }
        />
        <Route
          path="/unauthorized"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <UnauthorizedPage />
            </Suspense>
          }
        />

        {/* Protected Routes with Main Layout */}
        <Route
          path="/"
          element={
            <AuthenticatedRoute>
              <MainLayout />
            </AuthenticatedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />

          {/* Dashboard - All authenticated users */}
          <Route
            path="dashboard"
            element={
              <LazyRoute fallback={<DashboardSkeleton />}>
                <Dashboard />
              </LazyRoute>
            }
          />

          {/* Profile - All authenticated users */}
          <Route
            path="profile"
            element={
              <LazyRoute>
                <ProfilePage />
              </LazyRoute>
            }
          />

          {/* Settings - All authenticated users */}
          <Route
            path="settings"
            element={
              <LazyRoute>
                <SettingsPage />
              </LazyRoute>
            }
          />

          {/* Orders - Admin, Office Staff, and Department Workers */}
          <Route
            path="orders"
            element={
              <ProtectedRoute
                allowedRoles={[UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.DEPARTMENT_WORKER]}
              >
                <LazyRoute fallback={<TableSkeleton />}>
                  <OrdersListPage />
                </LazyRoute>
              </ProtectedRoute>
            }
          />

          {/* Create Order - Admin and Office Staff */}
          <Route
            path="orders/new"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.OFFICE_STAFF]}>
                <LazyRoute>
                  <CreateOrderPage />
                </LazyRoute>
              </ProtectedRoute>
            }
          />

          {/* Order Detail - Admin, Office Staff, Factory Manager, and Department Workers */}
          <Route
            path="orders/:id"
            element={
              <ProtectedRoute
                allowedRoles={[
                  UserRole.ADMIN,
                  UserRole.OFFICE_STAFF,
                  UserRole.FACTORY_MANAGER,
                  UserRole.DEPARTMENT_WORKER,
                ]}
              >
                <LazyRoute>
                  <OrderDetailPage />
                </LazyRoute>
              </ProtectedRoute>
            }
          />

          {/* Edit Order - Admin and Office Staff */}
          <Route
            path="orders/:id/edit"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.OFFICE_STAFF]}>
                <LazyRoute>
                  <EditOrderPage />
                </LazyRoute>
              </ProtectedRoute>
            }
          />

          {/* Inventory - Admin and Office Staff */}
          <Route
            path="inventory"
            element={
              <OfficeRoute>
                <LazyRoute>
                  <InventoryPage />
                </LazyRoute>
              </OfficeRoute>
            }
          />

          {/* Users - Admin only */}
          <Route
            path="users"
            element={
              <AdminRoute>
                <LazyRoute fallback={<TableSkeleton />}>
                  <UsersPage />
                </LazyRoute>
              </AdminRoute>
            }
          />

          {/* Register new user - Admin only */}
          <Route
            path="users/new"
            element={
              <AdminRoute>
                <LazyRoute>
                  <RegisterPage />
                </LazyRoute>
              </AdminRoute>
            }
          />

          {/* Departments - Admin and Factory Manager */}
          <Route
            path="departments"
            element={
              <FactoryRoute>
                <LazyRoute>
                  <DepartmentsPage />
                </LazyRoute>
              </FactoryRoute>
            }
          />

          {/* Department Detail - Admin and Factory Manager */}
          <Route
            path="departments/:id"
            element={
              <FactoryRoute>
                <LazyRoute>
                  <DepartmentDetailPage />
                </LazyRoute>
              </FactoryRoute>
            }
          />

          {/* Department Edit - Admin and Factory Manager */}
          <Route
            path="departments/:id/edit"
            element={
              <FactoryRoute>
                <LazyRoute>
                  <DepartmentEditPage />
                </LazyRoute>
              </FactoryRoute>
            }
          />

          {/* Department Workers - Admin and Factory Manager */}
          <Route
            path="departments/:id/workers"
            element={
              <FactoryRoute>
                <LazyRoute>
                  <DepartmentWorkersPage />
                </LazyRoute>
              </FactoryRoute>
            }
          />

          {/* Factory Tracking (Kanban) - Admin and Factory Manager */}
          <Route
            path="factory"
            element={
              <FactoryRoute>
                <LazyRoute fallback={<DashboardSkeleton />}>
                  <FactoryTrackingPage />
                </LazyRoute>
              </FactoryRoute>
            }
          />

          {/* Submissions - Admin, Office Staff, Factory Manager, and Department Worker */}
          <Route
            path="submissions"
            element={
              <ProtectedRoute
                allowedRoles={[
                  UserRole.ADMIN,
                  UserRole.OFFICE_STAFF,
                  UserRole.FACTORY_MANAGER,
                  UserRole.DEPARTMENT_WORKER,
                ]}
              >
                <LazyRoute>
                  <SubmissionsPage />
                </LazyRoute>
              </ProtectedRoute>
            }
          />

          {/* Reports - Admin and Manager */}
          <Route
            path="reports"
            element={
              <ProtectedRoute
                allowedRoles={[UserRole.ADMIN, UserRole.FACTORY_MANAGER, UserRole.OFFICE_STAFF]}
              >
                <LazyRoute fallback={<DashboardSkeleton />}>
                  <ReportsPage />
                </LazyRoute>
              </ProtectedRoute>
            }
          />

          {/* My Work - Department Workers and Factory Managers */}
          <Route
            path="my-work"
            element={
              <ProtectedRoute
                allowedRoles={[
                  UserRole.ADMIN,
                  UserRole.FACTORY_MANAGER,
                  UserRole.DEPARTMENT_WORKER,
                ]}
              >
                <LazyRoute>
                  <MyWorkPage />
                </LazyRoute>
              </ProtectedRoute>
            }
          />

          {/* Work Submission - Department Workers */}
          <Route
            path="orders/:id/work"
            element={
              <ProtectedRoute
                allowedRoles={[
                  UserRole.ADMIN,
                  UserRole.FACTORY_MANAGER,
                  UserRole.DEPARTMENT_WORKER,
                ]}
              >
                <LazyRoute>
                  <WorkSubmissionPage />
                </LazyRoute>
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
