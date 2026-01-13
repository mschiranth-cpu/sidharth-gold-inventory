/**
 * ============================================
 * ORDERS LIST PAGE
 * ============================================
 *
 * Comprehensive orders listing with:
 * - Data table with sorting, filtering, pagination
 * - Search with debouncing
 * - Bulk actions (export, delete)
 * - Responsive design (cards on mobile)
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  createColumnHelper,
  flexRender,
  SortingState,
  RowSelectionState,
} from '@tanstack/react-table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO, isBefore, startOfDay as _startOfDay } from 'date-fns';
import toast from 'react-hot-toast';

// import { useDeleteOrder, useBulkDeleteOrders, useExportOrders } from '../hooks';
import { useDeleteOrder, useBulkDeleteOrders } from '../hooks';
import { OrderListItem, OrderFilters } from '../types';
import { ordersService } from '../services';
import { useAuth } from '../../../contexts/AuthContext';
import assignmentService from '../../../services/assignment.service';
import { DEPARTMENT_LABELS, DepartmentName } from '../../../types/user.types';

// ============================================
// CONSTANTS
// ============================================

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Pending Assignment' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'QUALITY_CHECK', label: 'Quality Check' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const PAGE_SIZE_OPTIONS = [10, 25, 50];

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-amber-100 text-amber-700',
  PENDING: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-700',
  QUALITY_CHECK: 'bg-purple-100 text-purple-700',
  COMPLETED: 'bg-green-100 text-green-700',
  DELIVERED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const PRIORITY_STYLES: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-600',
  NORMAL: 'bg-blue-100 text-blue-600',
  HIGH: 'bg-purple-100 text-purple-600',
  URGENT: 'bg-red-100 text-red-600',
};

// ============================================
// HELPER COMPONENTS
// ============================================

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Pending Assignment',
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  IN_FACTORY: 'In Factory',
  QUALITY_CHECK: 'Quality Check',
  COMPLETED: 'Completed',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <span
    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
      STATUS_STYLES[status] || 'bg-gray-100 text-gray-700'
    }`}
  >
    {STATUS_LABELS[status] || status.replace('_', ' ')}
  </span>
);

const PriorityBadge: React.FC<{ priority: string }> = ({ priority }) => (
  <span
    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
      PRIORITY_STYLES[priority] || 'bg-gray-100 text-gray-600'
    }`}
  >
    {priority}
  </span>
);

const TableSkeleton: React.FC = () => (
  <div className="animate-pulse">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex items-center gap-4 py-4 border-b border-gray-100">
        <div className="w-4 h-4 bg-gray-200 rounded" />
        <div className="w-12 h-12 bg-gray-200 rounded-lg" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="h-3 bg-gray-200 rounded w-1/3" />
        </div>
        <div className="w-20 h-6 bg-gray-200 rounded-full" />
        <div className="w-24 h-4 bg-gray-200 rounded" />
        <div className="w-20 h-8 bg-gray-200 rounded" />
      </div>
    ))}
  </div>
);

const MobileOrderCard: React.FC<{
  order: OrderListItem;
  isSelected: boolean;
  onSelect: () => void;
  onView: () => void;
  onEdit: () => void;
  onTrack: () => void;
  onDelete: () => void;
  isWorker?: boolean;
}> = ({ order, isSelected, onSelect, onView, onEdit, onTrack, onDelete, isWorker }) => (
  <div
    className={`bg-white rounded-xl border p-4 mb-3 transition-all ${
      isSelected ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-200'
    }`}
  >
    <div className="flex items-start gap-3">
      {!isWorker && (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
      )}

      <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
        {order.productImage ? (
          <img src={order.productImage} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 truncate">{order.orderNumber}</h3>
          <StatusBadge status={order.status} />
        </div>
        <p className="text-sm text-gray-600 mt-0.5">{order.customerName}</p>
        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
          <span>
            {order.grossWeight}g {order.purity}
          </span>
          <span>•</span>
          <span>Due: {format(parseISO(order.dueDate), 'MMM d')}</span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <PriorityBadge priority={order.priority} />
          {order.department && (
            <span className="text-xs text-gray-500">{order.department.name}</span>
          )}
        </div>
      </div>
    </div>

    <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
      <button
        onClick={onView}
        className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
      </button>
      {!isWorker && (
        <button
          onClick={onEdit}
          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </button>
      )}
      <button
        onClick={onTrack}
        className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
          />
        </svg>
      </button>
      {!isWorker && (
        <button
          onClick={onDelete}
          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      )}
    </div>
  </div>
);

const EmptyState: React.FC<{ onCreateOrder: () => void }> = ({ onCreateOrder }) => (
  <div className="text-center py-12">
    <div className="w-16 h-16 mx-auto mb-4 bg-indigo-100 rounded-full flex items-center justify-center">
      <svg
        className="w-8 h-8 text-indigo-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-1">No orders found</h3>
    <p className="text-gray-500 mb-6">Get started by creating your first order</p>
    <button
      onClick={onCreateOrder}
      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
        />
      </svg>
      Create Order
    </button>
  </div>
);

// ============================================
// MAIN COMPONENT
// ============================================

const OrdersListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const isOfficeStaff = user?.role === 'ADMIN' || user?.role === 'OFFICE_STAFF';
  const isWorker = user?.role === 'DEPARTMENT_WORKER';
  const canSelect = !!user && !isWorker;

  // Get initial search from URL
  const initialSearch = searchParams.get('search') || '';

  // State
  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [filters, setFilters] = useState<OrderFilters>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Update search from URL when navigating from header search
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    if (urlSearch !== search) {
      setSearch(urlSearch);
      setDebouncedSearch(urlSearch);
    }
  }, [searchParams]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Data fetching from real API
  const {
    data: apiData,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ['orders', pageIndex, pageSize, sorting, filters, debouncedSearch, user?.id],
    queryFn: () => {
      // For workers, filter to show only orders assigned to them
      const queryFilters = { ...filters, search: debouncedSearch };
      if (isWorker && user?.id) {
        queryFilters.assignedToId = user.id;
      }
      return ordersService.getAll({
        page: pageIndex + 1,
        limit: pageSize,
        sortBy: sorting[0]?.id,
        sortOrder: sorting[0]?.desc ? 'desc' : 'asc',
        filters: queryFilters,
      });
    },
    staleTime: 30000, // 30 seconds
  });

  // Transform API data to match OrderListItem type
  const ordersData = useMemo(() => {
    if (apiData?.data) {
      return apiData.data.map((order: any) => {
        // Get the primary image - check multiple sources
        const primaryImage =
          order.productPhotoUrl ||
          order.orderDetails?.referenceImages?.[0] ||
          order.productImage ||
          null;

        return {
          id: order.id,
          orderNumber: order.orderNumber,
          customerName: order.customerName || 'N/A',
          customerPhone: order.customerPhone,
          customerEmail: order.customerEmail,
          productImage: primaryImage,
          status: order.status,
          priority:
            order.priority === 0
              ? 'LOW'
              : order.priority === 1
              ? 'NORMAL'
              : order.priority === 2
              ? 'HIGH'
              : order.priority >= 3
              ? 'URGENT'
              : 'NORMAL',
          dueDate: order.dueDate || order.orderDetails?.dueDate || new Date().toISOString(),
          grossWeight: order.orderDetails?.goldWeightInitial || order.grossWeight || 0,
          metalType: order.orderDetails?.metalType || order.metalType || 'GOLD',
          purity: order.orderDetails?.purity
            ? `${order.orderDetails.purity}K`
            : order.purity || '22K',
          department: order.currentDepartment
            ? {
                id: order.currentDepartment,
                name:
                  DEPARTMENT_LABELS[order.currentDepartment as DepartmentName] ||
                  order.currentDepartment,
              }
            : undefined,
          currentStep: order.currentDepartment,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        };
      }) as OrderListItem[];
    }
    return [] as OrderListItem[];
  }, [apiData?.data]);

  // Use API data - no fallback to mock data
  const filteredData = useMemo(() => {
    // Return API data directly (already filtered server-side)
    return ordersData;
  }, [ordersData]);

  // Pagination - use API pagination
  const paginatedData = useMemo(() => {
    // API already returns paginated data
    return ordersData;
  }, [ordersData]);

  const totalPages = apiData?.pagination?.totalPages || 1;
  // Total count available via: apiData?.pagination?.total || filteredData.length

  // Mutations
  const deleteOrder = useDeleteOrder();
  const bulkDelete = useBulkDeleteOrders();
  // const exportOrders = useExportOrders();

  // Column definitions
  const columnHelper = createColumnHelper<OrderListItem>();

  const columns = useMemo(() => {
    const cols = [
      columnHelper.accessor('productImage', {
        header: 'Photo',
        cell: (info) => (
          <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden">
            {info.getValue() ? (
              <img src={info.getValue()} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            )}
          </div>
        ),
        size: 60,
        enableSorting: false,
      }),
      columnHelper.accessor('orderNumber', {
        header: 'Order #',
        cell: (info) => (
          <div>
            <p className="font-medium text-gray-900">{info.getValue()}</p>
            <p className="text-xs text-gray-500">{info.row.original.customerName}</p>
          </div>
        ),
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => (
          <div className="text-center">
            <StatusBadge status={info.getValue()} />
          </div>
        ),
        meta: { align: 'center' },
      }),
      columnHelper.accessor('priority', {
        header: 'Priority',
        cell: (info) => (
          <div className="text-center">
            <PriorityBadge priority={info.getValue()} />
          </div>
        ),
        meta: { align: 'center' },
      }),
      columnHelper.accessor('grossWeight', {
        header: 'Weight',
        cell: (info) => (
          <span className="text-gray-700">
            {info.getValue()}g <span className="text-gray-400">{info.row.original.purity}</span>
          </span>
        ),
      }),
      columnHelper.accessor('dueDate', {
        header: 'Due Date',
        cell: (info) => {
          const date = parseISO(info.getValue());
          const status = info.row.original.status;
          const isOverdue = isBefore(date, new Date()) && status !== 'COMPLETED';
          return (
            <span className={isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}>
              {format(date, 'MMM d, yyyy')}
            </span>
          );
        },
      }),
      columnHelper.accessor('department', {
        header: 'Department',
        cell: (info) => <span className="text-gray-600">{info.getValue()?.name || '-'}</span>,
        enableSorting: false,
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/orders/${row.original.id}`);
              }}
              className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              title="View"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </button>
            {!isWorker && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/orders/${row.original.id}/edit`);
                }}
                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Edit"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/factory?order=${row.original.orderNumber}`);
              }}
              className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              title="Track"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
            </button>
            {!isWorker && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteConfirmId(row.original.id);
                }}
                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            )}
          </div>
        ),
        size: 120,
      }),
    ];

    if (canSelect) {
      cols.unshift(
        columnHelper.display({
          id: 'select',
          header: ({ table }) => (
            <input
              type="checkbox"
              checked={table.getIsAllRowsSelected()}
              onChange={table.getToggleAllRowsSelectedHandler()}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
          ),
          cell: ({ row }) => (
            <input
              type="checkbox"
              checked={row.getIsSelected()}
              onChange={row.getToggleSelectedHandler()}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
          ),
          size: 40,
        })
      );
    }

    return cols;
  }, [navigate, columnHelper, isWorker, canSelect]);

  // Clear any lingering selection when switching to worker
  useEffect(() => {
    if (!canSelect && Object.keys(rowSelection).length > 0) {
      setRowSelection({});
    }
  }, [canSelect, rowSelection]);

  // Table instance
  const table = useReactTable({
    data: paginatedData,
    columns,
    state: {
      sorting,
      rowSelection,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: canSelect ? setRowSelection : undefined,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    manualSorting: true,
    pageCount: totalPages,
  });

  // Query client for invalidation
  const queryClient = useQueryClient();

  // Send to Factory mutation
  const sendToFactoryMutation = useMutation({
    mutationFn: (orderIds: string[]) => assignmentService.sendToFactory(orderIds),
    onSuccess: (data) => {
      if (data.successCount > 0) {
        toast.success(
          `${data.successCount} order${data.successCount > 1 ? 's' : ''} sent to factory`
        );
        // Show assignment info for each order
        data.results.forEach((result) => {
          if (result.firstDepartmentAssignment.assigned) {
            toast.success(
              `${result.orderNumber}: Assigned to ${result.firstDepartmentAssignment.workerName}`,
              { duration: 4000 }
            );
          } else if (result.firstDepartmentAssignment.queued) {
            toast.success(
              `${result.orderNumber}: Added to CAD queue (position ${result.firstDepartmentAssignment.queuePosition})`,
              { duration: 4000, icon: '📋' }
            );
          }
        });
      }
      if (data.failedCount > 0) {
        toast.error(`${data.failedCount} order${data.failedCount > 1 ? 's' : ''} failed`);
      }
      setRowSelection({});
      // Refresh orders list and kanban board
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['kanban-orders'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send orders to factory');
    },
  });

  // Handlers
  const handleSendToFactory = () => {
    const selectedIds = Object.keys(rowSelection)
      .map((index) => paginatedData[parseInt(index)]?.id)
      .filter(Boolean) as string[];

    if (selectedIds.length === 0) {
      toast.error('No orders selected');
      return;
    }

    // Check if all selected orders are in DRAFT status
    const selectedOrders = Object.keys(rowSelection)
      .map((index) => paginatedData[parseInt(index)])
      .filter(Boolean);

    const nonDraftOrders = selectedOrders.filter((order) => order && order.status !== 'DRAFT');
    if (nonDraftOrders.length > 0) {
      toast.error(`${nonDraftOrders.length} order(s) are not in "Pending Assignment" status`);
      return;
    }

    sendToFactoryMutation.mutate(selectedIds);
  };

  const handleBulkDelete = () => {
    const selectedIds = Object.keys(rowSelection)
      .map((index) => paginatedData[parseInt(index)]?.id)
      .filter((id): id is string => Boolean(id));
    if (selectedIds.length === 0) {
      toast.error('No orders selected');
      return;
    }
    bulkDelete.mutate(selectedIds);
    setRowSelection({});
  };

  const handleExport = () => {
    const selectedIds = Object.keys(rowSelection)
      .map((index) => paginatedData[parseInt(index)]?.id)
      .filter((id): id is string => Boolean(id));
    if (selectedIds.length === 0) {
      toast.error('No orders selected');
      return;
    }
    // exportOrders.mutate(selectedIds);
    toast.success(`${selectedIds.length} orders would be exported`);
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirmId) {
      deleteOrder.mutate(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const clearFilters = () => {
    setFilters({});
    setSearch('');
  };

  const selectedCount = Object.keys(rowSelection).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
            {isWorker && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Your Assignments
              </span>
            )}
          </div>
          <p className="text-gray-500 mt-1">
            {filteredData.length} total order{filteredData.length !== 1 ? 's' : ''}
          </p>
        </div>
        {!isWorker && (
          <button
            onClick={() => navigate('/orders/new')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/25"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            New Order
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                isOfficeStaff ? 'Search by order #, customer name...' : 'Search by order #...'
              }
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 border rounded-xl transition-colors ${
              showFilters || Object.values(filters).some(Boolean)
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                : 'border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            Filters
            {Object.values(filters).filter(Boolean).length > 0 && (
              <span className="w-5 h-5 rounded-full bg-indigo-500 text-white text-xs flex items-center justify-center">
                {Object.values(filters).filter(Boolean).length}
              </span>
            )}
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-100 animate-in slide-in-from-top-2 duration-200">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
              <select
                value={filters.status || ''}
                onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Department Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Department</label>
              <select
                value={filters.departmentId || ''}
                onChange={(e) => setFilters({ ...filters, departmentId: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Departments</option>
                <option value="1">Casting</option>
                <option value="2">Polishing</option>
                <option value="3">Stone Setting</option>
                <option value="4">Quality Control</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">From Date</label>
              <input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">To Date</label>
              <input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Clear Filters */}
            {Object.values(filters).some(Boolean) && (
              <div className="sm:col-span-2 lg:col-span-4">
                <button
                  onClick={clearFilters}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Bulk Actions */}
        {!isWorker && selectedCount > 0 && (
          <div className="flex items-center gap-3 pt-4 border-t border-gray-100 animate-in slide-in-from-bottom-2 duration-200">
            <span className="text-sm text-gray-600">{selectedCount} order(s) selected</span>
            <div className="flex-1" />
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 bg-white rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              Export
            </button>
            <button
              onClick={handleBulkDelete}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-red-200 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <TableSkeleton />
          </div>
        ) : filteredData.length === 0 ? (
          isWorker ? (
            <div className="p-10 text-center text-gray-500">No orders assigned to you yet.</div>
          ) : (
            <EmptyState onCreateOrder={() => navigate('/orders/new')} />
          )
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        const align = (header.column.columnDef.meta as any)?.align;
                        return (
                          <th
                            key={header.id}
                            className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                              align === 'center' ? 'text-center' : 'text-left'
                            }`}
                            style={{ width: header.getSize() }}
                          >
                            {header.isPlaceholder ? null : (
                              <div
                                className={`flex items-center gap-1 ${
                                  align === 'center' ? 'justify-center' : ''
                                } ${
                                  header.column.getCanSort()
                                    ? 'cursor-pointer select-none hover:text-gray-700'
                                    : ''
                                }`}
                                onClick={header.column.getToggleSortingHandler()}
                              >
                                {flexRender(header.column.columnDef.header, header.getContext())}
                                {header.column.getCanSort() && (
                                  <span className="text-gray-400">
                                    {{
                                      asc: ' ↑',
                                      desc: ' ↓',
                                    }[header.column.getIsSorted() as string] ?? ''}
                                  </span>
                                )}
                              </div>
                            )}
                          </th>
                        );
                      })}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        row.getIsSelected() ? 'bg-indigo-50' : ''
                      }`}
                    >
                      {row.getVisibleCells().map((cell) => {
                        const align = (cell.column.columnDef.meta as any)?.align;
                        return (
                          <td
                            key={cell.id}
                            className={`px-4 py-3 whitespace-nowrap ${
                              align === 'center' ? 'text-center' : ''
                            }`}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden p-4">
              {paginatedData.map((order, index) => (
                <MobileOrderCard
                  key={order.id}
                  order={order}
                  isSelected={rowSelection[index] || false}
                  onSelect={() => {
                    if (isWorker) return;
                    setRowSelection((prev) => ({
                      ...prev,
                      [index]: !prev[index],
                    }));
                  }}
                  onView={() => navigate(`/orders/${order.id}`)}
                  onEdit={() => navigate(`/orders/${order.id}/edit`)}
                  onTrack={() => navigate(`/factory?order=${order.orderNumber}`)}
                  onDelete={() => setDeleteConfirmId(order.id)}
                  isWorker={isWorker}
                />
              ))}
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPageIndex(0);
                  }}
                  className="px-2 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  Page {pageIndex + 1} of {totalPages || 1}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPageIndex(0)}
                    disabled={pageIndex === 0}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => setPageIndex((prev) => Math.max(0, prev - 1))}
                    disabled={pageIndex === 0}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => setPageIndex((prev) => Math.min(totalPages - 1, prev + 1))}
                    disabled={pageIndex >= totalPages - 1}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => setPageIndex(totalPages - 1)}
                    disabled={pageIndex >= totalPages - 1}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 5l7 7-7 7M5 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Loading Overlay */}
      {isFetching && !isLoading && (
        <div className="fixed inset-0 bg-black/10 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-4 shadow-lg flex items-center gap-3">
            <svg className="w-5 h-5 animate-spin text-indigo-600" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="text-gray-600">Loading...</span>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Order</h3>
                <p className="text-gray-500">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 border border-gray-200 bg-white rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selection Action Bar - Fixed at bottom when orders selected */}
      {!isWorker && selectedCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40 animate-in slide-in-from-bottom duration-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span className="text-lg font-bold text-indigo-600">{selectedCount}</span>
                  </div>
                  <span className="text-gray-700 font-medium">
                    order{selectedCount > 1 ? 's' : ''} selected
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Send to Factory button - only show if there are DRAFT orders selected */}
                <button
                  onClick={handleSendToFactory}
                  disabled={sendToFactoryMutation.isPending}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendToFactoryMutation.isPending ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 5l7 7-7 7M5 5l7 7-7 7"
                        />
                      </svg>
                      Send to Factory
                    </>
                  )}
                </button>
                {/* Clear Selection button */}
                <button
                  onClick={() => setRowSelection({})}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersListPage;
