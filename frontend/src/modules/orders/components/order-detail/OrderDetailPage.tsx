/**
 * ============================================
 * ORDER DETAIL PAGE
 * ============================================
 *
 * Comprehensive order detail view with tabs,
 * edit mode, PDF export, and print support.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import React, { useState, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useReactToPrint } from 'react-to-print';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

import { useAuth } from '../../../../contexts/AuthContext';
import { OrderDetail, OrderActivityLog } from '../../types';
import { ordersService } from '../../services';
import { DEPARTMENT_LABELS, DepartmentName } from '../../../../types/user.types';
import { useDeleteOrder } from '../../hooks';
import activityService from '../../../../services/activity.service';
import OverviewTab from './OverviewTab';
import TimelineTab from './TimelineTab';
import DepartmentProgressTab from './DepartmentProgressTab';
import FilesTab from './FilesTab';
import ActivityLogTab from './ActivityLogTab';
import WorkInstructionsTab from './WorkInstructionsTab';
import { ErrorBoundary } from '../../../../components/common';
import { FileUploadModal } from '../../../../components/modals/FileUploadModal';

// ============================================
// TYPES
// ============================================

type TabId = 'overview' | 'timeline' | 'progress' | 'files' | 'activity' | 'instructions';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

// ============================================
// MAIN COMPONENT
// ============================================

const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);
  const deleteOrder = useDeleteOrder();

  // Check if edit mode was requested via query param
  const editRequested = searchParams.get('edit') === 'true';

  // State
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [_isEditMode, _setIsEditMode] = useState(editRequested);
  const [_showShareModal, setShowShareModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Check if user is office staff (can see customer details)
  const isOfficeUser = user?.role === 'ADMIN' || user?.role === 'OFFICE_STAFF';

  const handleCancelOrder = () => {
    if (!id) return;
    const confirmed = window.confirm('Cancel this order? This will remove it from the list.');
    if (!confirmed) return;

    deleteOrder.mutate(id, {
      onSuccess: () => {
        toast.success('Order cancelled');
        navigate('/orders');
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.error?.message || 'Failed to cancel order');
      },
    });
  };
  const canEdit =
    user?.role === 'ADMIN' || user?.role === 'OFFICE_STAFF' || user?.role === 'FACTORY_MANAGER';

  // Fetch order data
  const {
    data: order,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      if (!id) throw new Error('Order ID is required');
      const response = await ordersService.getById(id);
      if (!response.data) throw new Error('Order not found');

      // Transform API response to OrderDetail type
      const apiOrder = response.data as any;

      const referenceImages = apiOrder.orderDetails?.referenceImages || [];
      const allImages = referenceImages.length
        ? referenceImages
        : apiOrder.productPhotoUrl
        ? [apiOrder.productPhotoUrl]
        : [];

      const orderDetail: OrderDetail = {
        id: apiOrder.id,
        orderNumber: apiOrder.orderNumber,
        customerId: apiOrder.customerId,
        customerName: apiOrder.customerName || 'Customer',
        customerPhone: apiOrder.customerPhone,
        customerEmail: apiOrder.customerEmail,
        customerAddress: apiOrder.customerAddress,
        status: apiOrder.status,
        priority:
          apiOrder.priority === 3
            ? 'URGENT'
            : apiOrder.priority === 2
            ? 'HIGH'
            : apiOrder.priority === 1
            ? 'NORMAL'
            : 'LOW',
        createdAt: apiOrder.createdAt,
        updatedAt: apiOrder.updatedAt,
        dueDate: apiOrder.orderDetails?.dueDate || new Date().toISOString(),
        estimatedCompletionDate: apiOrder.orderDetails?.dueDate,
        productName: apiOrder.orderDetails?.productType || 'Custom Jewelry',
        productDescription: apiOrder.orderDetails?.additionalDescription,
        productImage: allImages[0],
        productImages: allImages,
        category: apiOrder.orderDetails?.productType,
        size: apiOrder.orderDetails?.size,
        quantity: apiOrder.orderDetails?.quantity || 1,
        metalType: apiOrder.orderDetails?.metalType || 'GOLD',
        metalFinish: apiOrder.orderDetails?.metalFinish,
        customFinish: apiOrder.orderDetails?.customFinish,
        purity: apiOrder.orderDetails?.purity ? `${apiOrder.orderDetails.purity}K` : '22K',
        grossWeight: apiOrder.orderDetails?.goldWeightInitial || 0,
        netWeight: apiOrder.orderDetails?.goldWeightInitial,
        hasStones: apiOrder.stones && apiOrder.stones.length > 0,
        stones:
          apiOrder.stones?.map((stone: any) => ({
            id: stone.id,
            type: stone.stoneName || stone.stoneType,
            shape: stone.shape || 'Round',
            size: '2mm',
            quantity: stone.quantity || 1,
            weight: stone.weight || 0,
            color: stone.color,
            clarity: stone.clarity,
            setting: stone.setting,
          })) || [],
        totalStoneWeight:
          apiOrder.stones?.reduce((sum: number, s: any) => sum + (s.weight || 0), 0) || 0,
        currentDepartment: apiOrder.currentDepartment
          ? {
              id: apiOrder.currentDepartment,
              name: apiOrder.currentDepartment,
              displayName:
                DEPARTMENT_LABELS[apiOrder.currentDepartment as DepartmentName] ||
                apiOrder.currentDepartment,
            }
          : undefined,
        departmentProgress:
          apiOrder.departmentTracking?.map((dt: any, index: number) => ({
            departmentId: dt.departmentName,
            departmentName: dt.departmentName,
            displayName:
              DEPARTMENT_LABELS[dt.departmentName as DepartmentName] || dt.departmentName,
            order: dt.sequenceOrder || index,
            status:
              dt.status === 'COMPLETED'
                ? 'completed'
                : dt.status === 'IN_PROGRESS'
                ? 'current'
                : 'pending',
            assignedWorker: dt.assignedTo
              ? {
                  id: dt.assignedTo.id,
                  name: dt.assignedTo.name,
                  role: 'Artisan',
                }
              : undefined,
            enteredAt: dt.startedAt,
            exitedAt: dt.completedAt,
            notes: dt.notes,
          })) || [],
        // Use files from API response, or fallback to reference images for backward compatibility
        files:
          apiOrder.files && apiOrder.files.length > 0
            ? apiOrder.files.map((file: any) => ({
                id: file.id,
                url: file.url,
                thumbnailUrl: file.thumbnailUrl || file.url,
                filename: file.filename,
                fileType: file.fileType as 'image' | 'document' | 'video',
                category: file.category as
                  | 'product'
                  | 'department'
                  | 'completion'
                  | 'reference'
                  | 'other',
                uploadedBy: file.uploadedBy || 'Unknown',
                uploadedAt: file.uploadedAt || apiOrder.createdAt,
                departmentId: file.departmentId,
                departmentName: file.departmentName,
                size: file.size || 0,
              }))
            : allImages.map((url: string, index: number) => ({
                id: `ref-image-${index}`,
                url: url,
                thumbnailUrl: url,
                filename: `Reference Image ${index + 1}`,
                fileType: 'image' as const,
                category: 'reference' as const,
                uploadedBy: apiOrder.createdBy?.name || 'Unknown',
                uploadedAt: apiOrder.createdAt,
                size: url.length, // Approximate size from base64 string length
              })),
        activityLog: [],
        notes: apiOrder.orderDetails?.additionalDescription,
        specialInstructions: apiOrder.orderDetails?.specialInstructions,
        createdBy: {
          id: apiOrder.createdBy?.id || 'unknown',
          name: apiOrder.createdBy?.name || 'Unknown User',
        },
      };
      return orderDetail;
    },
    enabled: !!id,
  });

  // Fetch activities for this order
  const { data: activities = [] } = useQuery({
    queryKey: ['order-activities', id],
    queryFn: async (): Promise<OrderActivityLog[]> => {
      if (!id) return [];
      const apiActivities = await activityService.getOrderActivities(id);

      // Map API activities to OrderActivityLog format
      return apiActivities.map((activity) => ({
        id: activity.id,
        action: mapActivityAction(activity.action),
        description: activity.title + (activity.description ? ` - ${activity.description}` : ''),
        userId: activity.user?.id || 'unknown',
        userName: activity.user?.name || 'System',
        userAvatar: activity.user?.avatar,
        timestamp: activity.createdAt,
        metadata: activity.metadata,
      }));
    },
    enabled: !!id,
  });

  // Map backend activity actions to frontend action types
  function mapActivityAction(action: string): OrderActivityLog['action'] {
    const actionMap: Record<string, OrderActivityLog['action']> = {
      STATUS_CHANGE: 'status_changed',
      DEPT_MOVE: 'department_changed',
      DEPT_COMPLETED: 'completed',
      WORKER_ASSIGNED: 'assigned',
      WORKER_REASSIGNED: 'assigned',
      FILE_UPLOADED: 'file_uploaded',
      ORDER_CREATED: 'created',
      ORDER_SUBMITTED: 'completed',
      NOTES_UPDATED: 'note_added',
    };
    return actionMap[action] || 'updated';
  }

  // Print handler
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: order ? `Order-${order.orderNumber}` : 'Order',
    pageStyle: `
      @page { size: A4; margin: 20mm; }
      @media print {
        body { -webkit-print-color-adjust: exact; }
        .no-print { display: none !important; }
      }
    `,
  });

  // Copy share link
  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
    setShowShareModal(false);
  };

  // Status badge
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; dot: string; label: string }> = {
      DRAFT: {
        bg: 'bg-amber-100',
        text: 'text-amber-700',
        dot: 'bg-amber-400',
        label: 'Pending Assignment',
      },
      PENDING: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400', label: 'Pending' },
      CONFIRMED: {
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        dot: 'bg-blue-400',
        label: 'Confirmed',
      },
      IN_FACTORY: {
        bg: 'bg-indigo-100',
        text: 'text-indigo-700',
        dot: 'bg-indigo-400',
        label: 'In Factory',
      },
      IN_PRODUCTION: {
        bg: 'bg-indigo-100',
        text: 'text-indigo-700',
        dot: 'bg-indigo-400',
        label: 'In Production',
      },
      QUALITY_CHECK: {
        bg: 'bg-purple-100',
        text: 'text-purple-700',
        dot: 'bg-purple-400',
        label: 'Quality Check',
      },
      COMPLETED: {
        bg: 'bg-green-100',
        text: 'text-green-700',
        dot: 'bg-green-400',
        label: 'Completed',
      },
      SHIPPED: { bg: 'bg-cyan-100', text: 'text-cyan-700', dot: 'bg-cyan-400', label: 'Shipped' },
      CANCELLED: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-400', label: 'Cancelled' },
    };

    const config = statusConfig[status] ?? statusConfig.PENDING;
    const configResolved = config ?? {
      bg: 'bg-gray-100',
      text: 'text-gray-600',
      dot: 'bg-gray-400',
      label: status.replace('_', ' '),
    };
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${configResolved.bg} ${configResolved.text}`}
      >
        <span className={`w-2 h-2 rounded-full ${configResolved.dot}`} />
        {configResolved.label}
      </span>
    );
  };

  // Priority badge
  const getPriorityBadge = (priority: string) => {
    const priorityConfig: Record<string, { bg: string; text: string }> = {
      LOW: { bg: 'bg-gray-100', text: 'text-gray-600' },
      NORMAL: { bg: 'bg-blue-100', text: 'text-blue-600' },
      HIGH: { bg: 'bg-indigo-100', text: 'text-indigo-600' },
      URGENT: { bg: 'bg-red-100', text: 'text-red-600' },
    };

    const config = priorityConfig[priority] ?? priorityConfig.NORMAL;
    const configResolved = config ?? { bg: 'bg-blue-100', text: 'text-blue-600' };
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${configResolved.bg} ${configResolved.text}`}
      >
        {priority}
      </span>
    );
  };

  // Tabs configuration
  const tabs: Tab[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
    },
    {
      id: 'timeline',
      label: 'Timeline',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      id: 'progress',
      label: 'Department Progress',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      ),
    },
    {
      id: 'files',
      label: 'Files',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      id: 'activity',
      label: 'Activity Log',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      ),
    },
    {
      id: 'instructions',
      label: 'Work Instructions',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <svg
            className="w-12 h-12 mx-auto mb-4 text-indigo-500 animate-spin"
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
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="text-gray-500">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-red-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-1">Order not found</h3>
          <p className="text-gray-500 mb-4">The order you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm no-print">
        <Link to="/orders" className="text-gray-500 hover:text-gray-700">
          Orders
        </Link>
        <svg
          className="w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-900 font-medium">{order.orderNumber}</span>
      </nav>

      {/* Printable Content */}
      <div ref={printRef}>
        {/* Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            {/* Left Side */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <h1 className="text-2xl font-bold text-gray-900">{order.orderNumber}</h1>
                {getStatusBadge(order.status)}
                {getPriorityBadge(order.priority)}
              </div>

              {order.productName && (
                <p className="text-lg text-gray-600 mb-2">{order.productName}</p>
              )}

              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                {isOfficeUser && (
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    {order.customerName}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Due: {format(parseISO(order.dueDate), 'MMM dd, yyyy')}
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  {order.currentDepartment?.displayName || 'Not Started'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 no-print">
              {/* Edit Button - Navigate to edit page */}
              {canEdit && (
                <button
                  onClick={() => navigate(`/orders/${id}/edit`)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Edit
                </button>
              )}

              {/* Print */}
              <button
                onClick={() => handlePrint()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  />
                </svg>
                Print
              </button>

              {/* Share */}
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
                Share
              </button>

              {/* More Actions */}
              <div className="relative">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                    />
                  </svg>
                </button>

                {mobileMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMobileMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                      <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
                          />
                        </svg>
                        Duplicate Order
                      </button>
                      <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        Export as PDF
                      </button>
                      <hr className="my-1" />
                      <button
                        onClick={handleCancelOrder}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        Cancel Order
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="no-print">
          {/* Desktop Tabs */}
          <div className="hidden md:block border-b border-gray-200 bg-white rounded-t-xl mt-6">
            <nav className="flex -mb-px">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors
                    ${
                      activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  {tab.icon}
                  {tab.label}
                  {tab.id === 'files' && order.files.length > 0 && (
                    <span className="ml-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                      {order.files.length}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Mobile Tab Dropdown */}
          <div className="md:hidden mt-6">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as TabId)}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {tabs.map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {tab.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white md:rounded-b-xl md:rounded-t-none rounded-xl border border-gray-200 md:border-t-0 p-6 mt-6 md:mt-0">
          {activeTab === 'overview' && (
            <OverviewTab order={order} isOfficeUser={isOfficeUser} isEditMode={_isEditMode} />
          )}
          {activeTab === 'timeline' && <TimelineTab order={order} />}
          {activeTab === 'progress' && (
            <DepartmentProgressTab
              order={order}
              canEdit={canEdit && _isEditMode}
              onAssignWorker={(deptId) => toast('Assign worker modal would open for ' + deptId)}
              onMarkComplete={(deptId) => toast.success('Department marked complete: ' + deptId)}
            />
          )}
          {activeTab === 'files' && (
            <FilesTab
              files={order.files}
              canUpload={canEdit}
              onUpload={() => setShowUploadModal(true)}
              onDelete={(fileId) => toast.success('File deleted: ' + fileId)}
            />
          )}
          {activeTab === 'activity' && <ActivityLogTab activities={activities} />}
          {activeTab === 'instructions' && (
            <WorkInstructionsTab
              departmentName={order.currentDepartment?.name || null}
              currentDepartmentStatus={
                order.departmentProgress?.find(
                  (p) => p.departmentId === order.currentDepartment?.id
                )?.status
              }
            />
          )}
        </div>
      </div>

      {/* File Upload Modal */}
      <FileUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        orderId={order.id}
        orderNumber={order.orderNumber}
      />

      {/* Print Styles - hidden but included for print */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
        }
      `}</style>
    </div>
  );
};

// Wrap with Error Boundary
const OrderDetailPageWithErrorBoundary = () => (
  <ErrorBoundary>
    <OrderDetailPage />
  </ErrorBoundary>
);

export default OrderDetailPageWithErrorBoundary;
