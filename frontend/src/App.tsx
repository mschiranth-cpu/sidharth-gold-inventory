import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import ClientPortalLayout from './components/layout/ClientPortalLayout';
import { AuthProvider } from './contexts/AuthContext';
import { RefreshIntervalProvider } from './contexts/RefreshIntervalContext';
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

// Landing page
const LandingPage = lazy(() => import('./pages/LandingPage'));

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

// Client Portal Pages
const ClientLoginPage = lazy(() => import('./pages/client/ClientLoginPage'));
const ClientRegisterPage = lazy(() => import('./pages/client/ClientRegisterPage'));
const ClientDashboardPage = lazy(() => import('./pages/client/ClientDashboardPage'));
const ClientOrdersPage = lazy(() => import('./pages/client/ClientOrdersPage'));
const ClientOrderDetailPage = lazy(() => import('./pages/client/OrderDetailPage'));
const ClientProfilePage = lazy(() => import('./pages/client/ClientProfilePage'));
const PlaceOrderPage = lazy(() => import('./pages/client/PlaceOrderPage'));

// Admin Pages
const FeatureTogglePage = lazy(() => import('./pages/admin/FeatureTogglePage'));
const ClientApprovalPage = lazy(() => import('./pages/admin/ClientApprovalPage'));
const OrderApprovalPage = lazy(() => import('./pages/admin/OrderApprovalPage'));
const VendorsPage = lazy(() => import('./pages/vendors/VendorsPage'));
const VendorDetailPage = lazy(() => import('./pages/vendors/VendorDetailPage'));

// Inventory Pages (Phase 2)
const MainInventoryDashboard = lazy(() => import('./pages/inventory/MainInventoryDashboard'));
const MetalInventoryDashboard = lazy(() => import('./pages/inventory/MetalInventoryDashboard'));
const MetalStockPage = lazy(() => import('./pages/inventory/MetalStockPage'));
const ReceiveMetalPage = lazy(() => import('./pages/inventory/ReceiveMetalPage'));
const IssueMetalPage = lazy(() => import('./pages/inventory/IssueMetalPage'));
const MetalTransactionsPage = lazy(() => import('./pages/inventory/MetalTransactionsPage'));
const MeltingBatchPage = lazy(() => import('./pages/inventory/MeltingBatchPage'));
const RateManagementPage = lazy(() => import('./pages/inventory/RateManagementPage'));

// Phase 3 Inventory Pages
const AddDiamondPage = lazy(() => import('./pages/inventory/AddDiamondPage'));
const DiamondInventoryDashboard = lazy(
  () => import('./pages/inventory/DiamondInventoryDashboard')
);
const ReceiveDiamondPage = lazy(() => import('./pages/inventory/ReceiveDiamondPage'));
const IssueDiamondPage = lazy(() => import('./pages/inventory/IssueDiamondPage'));
const TransferDiamondPage = lazy(() => import('./pages/inventory/TransferDiamondPage'));
const DiamondTransactionsPage = lazy(
  () => import('./pages/inventory/DiamondTransactionsPage')
);
const DiamondRateManagementPage = lazy(
  () => import('./pages/inventory/DiamondRateManagementPage')
);
const DiamondLotsPage = lazy(() => import('./pages/inventory/DiamondLotsPage'));

// Real Stone module
const RealStoneInventoryDashboard = lazy(
  () => import('./pages/inventory/RealStoneInventoryDashboard')
);
const ReceiveRealStonePage = lazy(() => import('./pages/inventory/ReceiveRealStonePage'));
const IssueRealStonePage = lazy(() => import('./pages/inventory/IssueRealStonePage'));
const TransferRealStonePage = lazy(() => import('./pages/inventory/TransferRealStonePage'));
const RealStoneTransactionsPage = lazy(
  () => import('./pages/inventory/RealStoneTransactionsPage')
);
const RealStoneListPage = lazy(() => import('./pages/inventory/RealStoneListPage'));
const RealStoneTreatmentPage = lazy(
  () => import('./pages/inventory/RealStoneTreatmentPage')
);
const RealStoneRateManagementPage = lazy(
  () => import('./pages/inventory/RealStoneRateManagementPage')
);
const RealStoneReportPage = lazy(() => import('./pages/inventory/RealStoneReportPage'));
const RealStoneDetailPage = lazy(() => import('./pages/inventory/RealStoneDetailPage'));

// Stone Packet module
const StonePacketInventoryDashboard = lazy(
  () => import('./pages/inventory/StonePacketInventoryDashboard')
);
const ReceiveStonePacketPage = lazy(
  () => import('./pages/inventory/ReceiveStonePacketPage')
);
const IssueStonePacketPage = lazy(() => import('./pages/inventory/IssueStonePacketPage'));
const TransferStonePacketPage = lazy(
  () => import('./pages/inventory/TransferStonePacketPage')
);
const StonePacketTransactionsPage = lazy(
  () => import('./pages/inventory/StonePacketTransactionsPage')
);
const StonePacketListPage = lazy(() => import('./pages/inventory/StonePacketListPage'));
const StoneQualityPage = lazy(() => import('./pages/inventory/StoneQualityPage'));
const StoneReorderAlertsPage = lazy(
  () => import('./pages/inventory/StoneReorderAlertsPage')
);
const StoneInventoryReportPage = lazy(
  () => import('./pages/inventory/StoneInventoryReportPage')
);
const StonePacketDetailPage = lazy(
  () => import('./pages/inventory/StonePacketDetailPage')
);

// Phase 4 Inventory Pages
const FactoryInventoryPage = lazy(() => import('./pages/inventory/FactoryInventoryPage'));

// Phase 5 Attendance & Payroll Pages
const CheckInPage = lazy(() => import('./pages/attendance/CheckInPage'));
const CheckOutPage = lazy(() => import('./pages/attendance/CheckOutPage'));
const AttendanceDashboard = lazy(() => import('./pages/attendance/AttendanceDashboard'));
const PayrollDashboard = lazy(() => import('./pages/payroll/PayrollDashboard'));

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
      <RefreshIntervalProvider>
        <NavigationLoader />
        <WorkerNotification />
        <WorkerNotification />
      <NotificationPermissionPrompt />
      <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <LandingPage />
            </Suspense>
          }
        />
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
          path="/app"
          element={
            <AuthenticatedRoute>
              <MainLayout />
            </AuthenticatedRoute>
          }
        >
          <Route index element={<Navigate to="/app/dashboard" replace />} />

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

          {/* Feature Toggle - Admin only */}
          <Route
            path="admin/features"
            element={
              <AdminRoute>
                <LazyRoute>
                  <FeatureTogglePage />
                </LazyRoute>
              </AdminRoute>
            }
          />

          {/* Client Approval - Admin/Office Staff */}
          <Route
            path="admin/clients"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.OFFICE_STAFF]}>
                <LazyRoute>
                  <ClientApprovalPage />
                </LazyRoute>
              </ProtectedRoute>
            }
          />

          {/* Vendor Info - Admin/Office Staff */}
          <Route
            path="vendors"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.OFFICE_STAFF]}>
                <LazyRoute>
                  <VendorsPage />
                </LazyRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="vendors/:id"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.OFFICE_STAFF]}>
                <LazyRoute>
                  <VendorDetailPage />
                </LazyRoute>
              </ProtectedRoute>
            }
          />

          {/* Order Approval - Admin/Office Staff */}
          <Route
            path="admin/order-approvals"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.OFFICE_STAFF]}>
                <LazyRoute>
                  <OrderApprovalPage />
                </LazyRoute>
              </ProtectedRoute>
            }
          />

          {/* Main Inventory Dashboard */}
          <Route
            path="inventory"
            element={
              <ProtectedRoute
                allowedRoles={[UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.FACTORY_MANAGER]}
              >
                <LazyRoute>
                  <MainInventoryDashboard />
                </LazyRoute>
              </ProtectedRoute>
            }
          />

          {/* Metal Inventory - Admin/Office Staff/Factory Manager */}
          <Route
            path="inventory/metal"
            element={
              <ProtectedRoute
                allowedRoles={[UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.FACTORY_MANAGER]}
              >
                <LazyRoute>
                  <MetalInventoryDashboard />
                </LazyRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory/metal/stock"
            element={
              <ProtectedRoute
                allowedRoles={[UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.FACTORY_MANAGER]}
              >
                <LazyRoute>
                  <MetalStockPage />
                </LazyRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory/metal/receive"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.OFFICE_STAFF]}>
                <LazyRoute>
                  <ReceiveMetalPage />
                </LazyRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory/metal/issue"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.OFFICE_STAFF]}>
                <LazyRoute>
                  <IssueMetalPage />
                </LazyRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory/metal/transactions"
            element={
              <ProtectedRoute
                allowedRoles={[UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.FACTORY_MANAGER]}
              >
                <LazyRoute>
                  <MetalTransactionsPage />
                </LazyRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory/metal/melting"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.FACTORY_MANAGER]}>
                <LazyRoute>
                  <MeltingBatchPage />
                </LazyRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory/metal/rates"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <LazyRoute>
                  <RateManagementPage />
                </LazyRoute>
              </ProtectedRoute>
            }
          />

          {/* Diamond Inventory - Admin/Office Staff/Factory Manager */}
          <Route
            path="inventory/diamonds"
            element={
              <ProtectedRoute
                allowedRoles={[UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.FACTORY_MANAGER]}
              >
                <LazyRoute>
                  <DiamondInventoryDashboard />
                </LazyRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory/diamonds/new"
            element={
              <ProtectedRoute
                allowedRoles={[UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.FACTORY_MANAGER]}
              >
                <LazyRoute>
                  <AddDiamondPage />
                </LazyRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory/diamonds/receive"
            element={
              <ProtectedRoute
                allowedRoles={[UserRole.ADMIN, UserRole.OFFICE_STAFF]}
              >
                <LazyRoute>
                  <ReceiveDiamondPage />
                </LazyRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory/diamonds/issue"
            element={
              <ProtectedRoute
                allowedRoles={[UserRole.ADMIN, UserRole.OFFICE_STAFF]}
              >
                <LazyRoute>
                  <IssueDiamondPage />
                </LazyRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory/diamonds/transfer"
            element={
              <ProtectedRoute
                allowedRoles={[UserRole.ADMIN, UserRole.OFFICE_STAFF]}
              >
                <LazyRoute>
                  <TransferDiamondPage />
                </LazyRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory/diamonds/transactions"
            element={
              <ProtectedRoute
                allowedRoles={[UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.FACTORY_MANAGER]}
              >
                <LazyRoute>
                  <DiamondTransactionsPage />
                </LazyRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory/diamonds/rates"
            element={
              <ProtectedRoute
                allowedRoles={[UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.FACTORY_MANAGER]}
              >
                <LazyRoute>
                  <DiamondRateManagementPage />
                </LazyRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory/diamonds/lots"
            element={
              <ProtectedRoute
                allowedRoles={[UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.FACTORY_MANAGER]}
              >
                <LazyRoute>
                  <DiamondLotsPage />
                </LazyRoute>
              </ProtectedRoute>
            }
          />

          {/* Real Stone Inventory - Admin/Office Staff/Factory Manager */}
          <Route
            path="inventory/real-stones"
            element={<Navigate to="./dashboard" replace />}
          />
          <Route
            path="inventory/real-stones/dashboard"
            element={
              <ProtectedRoute
                allowedRoles={[UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.FACTORY_MANAGER]}
              >
                <LazyRoute>
                  <RealStoneInventoryDashboard />
                </LazyRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory/real-stones/receive"
            element={
              <ProtectedRoute
                allowedRoles={[UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.FACTORY_MANAGER]}
              >
                <LazyRoute>
                  <ReceiveRealStonePage />
                </LazyRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory/real-stones/issue"
            element={
              <ProtectedRoute
                allowedRoles={[UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.FACTORY_MANAGER]}
              >
                <LazyRoute>
                  <IssueRealStonePage />
                </LazyRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory/real-stones/transfer"
            element={
              <ProtectedRoute
                allowedRoles={[UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.FACTORY_MANAGER]}
              >
                <LazyRoute>
                  <TransferRealStonePage />
                </LazyRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory/real-stones/transactions"
            element={
              <ProtectedRoute
                allowedRoles={[UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.FACTORY_MANAGER]}
              >
                <LazyRoute>
                  <RealStoneTransactionsPage />
                </LazyRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory/real-stones/list"
            element={
              <ProtectedRoute
                allowedRoles={[UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.FACTORY_MANAGER]}
              >
                <LazyRoute>
                  <RealStoneListPage />
                </LazyRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory/real-stones/treatment"
            element={
              <ProtectedRoute
                allowedRoles={[UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.FACTORY_MANAGER]}
              >
                <LazyRoute>
                  <RealStoneTreatmentPage />
                </LazyRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory/real-stones/rates"
            element={
              <ProtectedRoute
                allowedRoles={[UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.FACTORY_MANAGER]}
              >
                <LazyRoute>
                  <RealStoneRateManagementPage />
                </LazyRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory/real-stones/report"
            element={
              <ProtectedRoute
                allowedRoles={[UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.FACTORY_MANAGER]}
              >
                <LazyRoute>
                  <RealStoneReportPage />
                </LazyRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory/real-stones/detail/:id"
            element={
              <ProtectedRoute
                allowedRoles={[UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.FACTORY_MANAGER]}
              >
                <LazyRoute>
                  <RealStoneDetailPage />
                </LazyRoute>
              </ProtectedRoute>
            }
          />

          {/* Stone Packet Inventory - Admin/Office Staff/Factory Manager */}
          <Route
            path="inventory/stone-packets"
            element={<Navigate to="./dashboard" replace />}
          />
          <Route
            path="inventory/stone-packets/dashboard"
            element={
              <ProtectedRoute
                allowedRoles={[UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.FACTORY_MANAGER]}
              >
                <LazyRoute>
                  <StonePacketInventoryDashboard />
                </LazyRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory/stone-packets/receive"
            element={
              <ProtectedRoute
                allowedRoles={[UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.FACTORY_MANAGER]}
              >
                <LazyRoute>
                  <ReceiveStonePacketPage />
                </LazyRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory/stone-packets/issue"
            element={
              <ProtectedRoute
                allowedRoles={[UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.FACTORY_MANAGER]}
              >
                <LazyRoute>
                  <IssueStonePacketPage />
                </LazyRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory/stone-packets/transfer"
            element={
              <ProtectedRoute
                allowedRoles={[UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.FACTORY_MANAGER]}
              >
                <LazyRoute>
                  <TransferStonePacketPage />
                </LazyRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory/stone-packets/transactions"
            element={
              <ProtectedRoute
                allowedRoles={[UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.FACTORY_MANAGER]}
              >
                <LazyRoute>
                  <StonePacketTransactionsPage />
                </LazyRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory/stone-packets/list"
            element={
              <ProtectedRoute
                allowedRoles={[UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.FACTORY_MANAGER]}
              >
                <LazyRoute>
                  <StonePacketListPage />
                </LazyRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory/stone-packets/quality"
            element={
              <ProtectedRoute
                allowedRoles={[UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.FACTORY_MANAGER]}
              >
                <LazyRoute>
                  <StoneQualityPage />
                </LazyRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory/stone-packets/reorder"
            element={
              <ProtectedRoute
                allowedRoles={[UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.FACTORY_MANAGER]}
              >
                <LazyRoute>
                  <StoneReorderAlertsPage />
                </LazyRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory/stone-packets/report"
            element={
              <ProtectedRoute
                allowedRoles={[UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.FACTORY_MANAGER]}
              >
                <LazyRoute>
                  <StoneInventoryReportPage />
                </LazyRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory/stone-packets/detail/:id"
            element={
              <ProtectedRoute
                allowedRoles={[UserRole.ADMIN, UserRole.OFFICE_STAFF, UserRole.FACTORY_MANAGER]}
              >
                <LazyRoute>
                  <StonePacketDetailPage />
                </LazyRoute>
              </ProtectedRoute>
            }
          />

          {/* Factory Inventory - Admin/Factory Manager */}
          <Route
            path="inventory/factory"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.FACTORY_MANAGER]}>
                <LazyRoute>
                  <FactoryInventoryPage />
                </LazyRoute>
              </ProtectedRoute>
            }
          />

          {/* Attendance - All authenticated users */}
          <Route
            path="attendance/check-in"
            element={
              <AuthenticatedRoute>
                <LazyRoute>
                  <CheckInPage />
                </LazyRoute>
              </AuthenticatedRoute>
            }
          />
          <Route
            path="attendance/check-out"
            element={
              <AuthenticatedRoute>
                <LazyRoute>
                  <CheckOutPage />
                </LazyRoute>
              </AuthenticatedRoute>
            }
          />
          <Route
            path="attendance/dashboard"
            element={
              <AuthenticatedRoute>
                <LazyRoute>
                  <AttendanceDashboard />
                </LazyRoute>
              </AuthenticatedRoute>
            }
          />

          {/* Payroll - Admin/Factory Manager */}
          <Route
            path="payroll"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.FACTORY_MANAGER]}>
                <LazyRoute>
                  <PayrollDashboard />
                </LazyRoute>
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Client Portal Routes (Public) */}
        <Route
          path="/client/login"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <ClientLoginPage />
            </Suspense>
          }
        />
        <Route
          path="/client/register"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <ClientRegisterPage />
            </Suspense>
          }
        />

        {/* Client Portal Routes (Protected) */}
        <Route path="/client" element={<ClientPortalLayout />}>
          <Route index element={<Navigate to="/client/dashboard" replace />} />
          <Route
            path="dashboard"
            element={
              <LazyRoute>
                <ClientDashboardPage />
              </LazyRoute>
            }
          />
          <Route
            path="orders"
            element={
              <LazyRoute>
                <ClientOrdersPage />
              </LazyRoute>
            }
          />
          <Route
            path="orders/new"
            element={
              <LazyRoute>
                <PlaceOrderPage />
              </LazyRoute>
            }
          />
          <Route
            path="orders/:orderId"
            element={
              <LazyRoute>
                <ClientOrderDetailPage />
              </LazyRoute>
            }
          />
          <Route
            path="profile"
            element={
              <LazyRoute>
                <ClientProfilePage />
              </LazyRoute>
            }
          />
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
      </Routes>
      </RefreshIntervalProvider>
    </AuthProvider>
  );
}

export default App;
