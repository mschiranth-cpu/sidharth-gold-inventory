/**
 * ============================================
 * ORDER DETAIL MODAL
 * ============================================
 *
 * Modal showing detailed order information
 * and department history timeline.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, differenceInHours } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { KanbanOrder, KANBAN_DEPARTMENTS } from '../types';
import assignmentService from '../../../services/assignment.service';
import { apiGet, api } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import AssignWorkerModal from './AssignWorkerModal';

interface OrderDetailModalProps {
  order: KanbanOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onMoveOrder?: (orderId: string, newDepartmentId: string) => void;
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  isOpen,
  onClose,
  onMoveOrder,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [showReassignDropdown, setShowReassignDropdown] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showUnassignConfirm, setShowUnassignConfirm] = useState(false);

  // Fetch workers for current department
  const { data: workersData } = useQuery({
    queryKey: ['workers', order?.currentDepartment],
    queryFn: async () => {
      if (!order?.currentDepartment) return [];
      const response = await apiGet<any>(
        `/users?department=${order.currentDepartment}&isActive=true`
      );
      return response.data || [];
    },
    enabled: isOpen && !!order?.currentDepartment,
  });

  // Reassignment mutation
  const reassignMutation = useMutation({
    mutationFn: ({ workerId }: { workerId: string }) => {
      if (!order) throw new Error('No order selected');
      return assignmentService.reassignDepartment(order.id, order.currentDepartment, workerId);
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Worker reassigned successfully');
      setShowReassignDropdown(false);
      queryClient.invalidateQueries({ queryKey: ['kanban-orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      // Close modal to show updated data when reopened
      setTimeout(() => {
        onClose();
      }, 500);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to reassign worker');
    },
  });

  // Unassign mutation
  const unassignMutation = useMutation({
    mutationFn: async () => {
      if (!order) throw new Error('No order selected');
      const response = await api.delete(
        `/orders/${order.id}/departments/${order.currentDepartment}/unassign`
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success('Worker unassigned successfully');
      setShowReassignDropdown(false);
      queryClient.invalidateQueries({ queryKey: ['kanban-orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setTimeout(() => {
        onClose();
      }, 500);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error?.message || 'Failed to unassign worker';
      toast.error(message);
    },
  });

  const handleReassign = (workerId: string) => {
    if (!order?.assignedWorker || workerId === order.assignedWorker.id) {
      setShowReassignDropdown(false);
      return;
    }
    reassignMutation.mutate({ workerId });
  };

  // Self-assign mutation for workers
  const selfAssignMutation = useMutation({
    mutationFn: async () => {
      if (!order) throw new Error('No order selected');
      const response = await api.post(
        `/orders/${order.id}/departments/${order.currentDepartment}/self-assign`,
        {}
      );
      return response.data;
    },
    onSuccess: async () => {
      toast.success('Successfully assigned to yourself');
      await queryClient.refetchQueries({ queryKey: ['kanban-orders'] });
      await queryClient.refetchQueries({ queryKey: ['my-work-orders'] });
      onClose();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error?.message || 'Failed to self-assign';
      toast.error(message);
    },
  });

  const handleSelfAssign = () => {
    if (window.confirm('Assign this work to yourself?')) {
      selfAssignMutation.mutate();
    }
  };

  // Check if order needs assignment (either PENDING_ASSIGNMENT status or no worker assigned)
  const needsAssignment = order?.status === 'PENDING_ASSIGNMENT' || !order?.assignedWorker;
  const isAdminOrOfficeStaff = user?.role === 'ADMIN' || user?.role === 'OFFICE_STAFF';
  const isDepartmentWorker = user?.role === 'DEPARTMENT_WORKER';
  const isWorkersDepartment = user?.department === order?.currentDepartment;

  if (!isOpen || !order) return null;

  const currentDept = KANBAN_DEPARTMENTS.find((d) => d.id === order.currentDepartment);
  const dueDate = parseISO(order.dueDate);
  const isOverdue = dueDate < new Date();

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50 transition-opacity" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden pointer-events-auto animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative h-32 bg-gradient-to-r from-indigo-500 to-indigo-600 p-6">
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors z-10"
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

            {/* Assign Worker Button (Admin/Office Staff) */}
            {needsAssignment && isAdminOrOfficeStaff && (
              <button
                onClick={() => setShowAssignModal(true)}
                className="absolute top-4 right-16 px-4 py-2 bg-white/90 hover:bg-white text-indigo-600 rounded-lg font-medium text-sm shadow-lg transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Assign Worker
              </button>
            )}

            {/* Self-Assign Button (Department Workers) */}
            {needsAssignment && isDepartmentWorker && isWorkersDepartment && (
              <button
                onClick={handleSelfAssign}
                disabled={selfAssignMutation.isPending}
                className="absolute top-4 right-16 px-4 py-2 bg-white/90 hover:bg-white text-indigo-600 rounded-lg font-medium text-sm shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11"
                  />
                </svg>
                {selfAssignMutation.isPending ? 'Assigning...' : 'Take This Work'}
              </button>
            )}

            <div className="flex items-start gap-4">
              {/* Product Image */}
              <div className="w-20 h-20 rounded-xl bg-white shadow-lg overflow-hidden flex-shrink-0">
                {order.productImage ? (
                  <img src={order.productImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

              <div className="flex-1 min-w-0 text-white">
                <h2 className="text-xl font-bold">{order.orderNumber}</h2>
                <p className="text-indigo-100 text-sm">{order.customerName}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-sm font-bold shadow-sm ${
                      order.priority === 'LOW'
                        ? 'bg-gray-200 text-gray-700'
                        : order.priority === 'NORMAL'
                        ? 'bg-blue-500 text-white'
                        : order.priority === 'HIGH'
                        ? 'bg-orange-500 text-white'
                        : 'bg-red-500 text-white'
                    }`}
                  >
                    {order.priority}
                  </span>
                  {currentDept && (
                    <span
                      className={`px-2.5 py-1 rounded-lg text-sm font-bold text-white shadow-sm ${currentDept.color}`}
                    >
                      {currentDept.displayName}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1">Weight</p>
                <p className="font-semibold text-gray-900">{order.grossWeight}g</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1">Purity</p>
                <p className="font-semibold text-gray-900">{order.purity}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1">Metal</p>
                <p className="font-semibold text-gray-900">{order.metalType}</p>
              </div>
              <div className={`rounded-xl p-3 ${isOverdue ? 'bg-red-50' : 'bg-gray-50'}`}>
                <p className={`text-xs mb-1 ${isOverdue ? 'text-red-500' : 'text-gray-500'}`}>
                  Due Date
                </p>
                <p className={`font-semibold ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                  {format(dueDate, 'MMM d, yyyy')}
                </p>
              </div>
            </div>

            {/* Assigned Worker */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-700">Assigned To</h3>
                {order.assignedWorker && isAdminOrOfficeStaff && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowUnassignConfirm(true)}
                      disabled={unassignMutation.isPending}
                      className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1 disabled:opacity-50"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      {unassignMutation.isPending ? 'Unassigning...' : 'Unassign'}
                    </button>
                    <button
                      onClick={() => setShowReassignDropdown(!showReassignDropdown)}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                        />
                      </svg>
                      Reassign
                    </button>
                  </div>
                )}
              </div>
              {order.assignedWorker ? (
                <div className="relative">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-medium">
                      {order.assignedWorker.avatar ? (
                        <img
                          src={order.assignedWorker.avatar}
                          alt=""
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        order.assignedWorker.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{order.assignedWorker.name}</p>
                      <p className="text-xs text-gray-500">{order.assignedWorker.department}</p>
                    </div>
                    {reassignMutation.isPending && (
                      <svg
                        className="animate-spin h-4 w-4 text-indigo-600"
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
                    )}
                  </div>
                  {/* Reassign Dropdown */}
                  {showReassignDropdown && workersData && workersData.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                      <div className="p-2">
                        <p className="text-xs text-gray-500 px-2 py-1.5 font-medium">
                          Select Worker
                        </p>
                        {workersData.map((worker: any) => (
                          <button
                            key={worker.id}
                            onClick={() => handleReassign(worker.id)}
                            disabled={
                              worker.id === order.assignedWorker?.id || reassignMutation.isPending
                            }
                            className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${
                              worker.id === order.assignedWorker?.id
                                ? 'bg-indigo-50 text-indigo-600 cursor-default'
                                : 'hover:bg-gray-50 text-gray-700'
                            } disabled:opacity-50`}
                          >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-sm font-medium">
                              {worker.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{worker.name}</p>
                              <p className="text-xs text-gray-500">{worker.department}</p>
                            </div>
                            {worker.id === order.assignedWorker?.id && (
                              <svg
                                className="w-4 h-4 text-indigo-600"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl text-gray-400">
                  <div className="w-10 h-10 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm">No worker assigned</p>
                </div>
              )}
            </div>

            {/* Notes */}
            {order.notes && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Notes</h3>
                <p className="text-gray-600 bg-gray-50 rounded-xl p-3 text-sm">{order.notes}</p>
              </div>
            )}

            {/* Department History Timeline */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Department History</h3>
              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-200" />

                {/* Timeline Items */}
                <div className="space-y-4">
                  {order.history.map((transition, index) => {
                    const dept = KANBAN_DEPARTMENTS.find((d) => d.id === transition.departmentId);
                    const enteredAt = parseISO(transition.enteredAt);
                    const exitedAt = transition.exitedAt ? parseISO(transition.exitedAt) : null;
                    const duration = exitedAt
                      ? differenceInHours(exitedAt, enteredAt)
                      : differenceInHours(new Date(), enteredAt);

                    return (
                      <div key={index} className="relative flex items-start gap-4 pl-2">
                        {/* Timeline Dot */}
                        <div
                          className={`relative z-10 w-5 h-5 rounded-full flex items-center justify-center ${
                            !transition.exitedAt ? 'ring-4 ring-indigo-100' : ''
                          } ${dept?.color || 'bg-gray-400'}`}
                        >
                          {!transition.exitedAt && (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 pb-4">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-gray-900 text-sm">
                              {transition.departmentName}
                            </p>
                            <span className="text-xs text-gray-500">{duration}h</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {format(enteredAt, 'MMM d, h:mm a')}
                            {exitedAt && ` → ${format(exitedAt, 'h:mm a')}`}
                          </p>
                          {transition.workerName && (
                            <p className="text-xs text-gray-400 mt-1">
                              Handled by {transition.workerName}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Quick Move - Only for Admin, Office Staff, and Factory Manager */}
            {onMoveOrder && user?.role !== 'DEPARTMENT_WORKER' && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Move to Department</h3>
                <div className="flex flex-wrap gap-2">
                  {KANBAN_DEPARTMENTS.filter((d) => d.id !== order.currentDepartment).map(
                    (dept) => (
                      <button
                        key={dept.id}
                        onClick={() => onMoveOrder(order.id, dept.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-all hover:scale-105 hover:opacity-90"
                        style={{ backgroundColor: dept.color }}
                      >
                        {dept.displayName}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="border-t border-gray-100 p-4 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                navigate(`/orders/${order.id}`);
                onClose();
              }}
              className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl hover:from-indigo-600 hover:to-indigo-700 transition-all"
            >
              View Full Details
            </button>
          </div>
        </div>
      </div>

      {/* Assign Worker Modal */}
      {showAssignModal && order && (
        <AssignWorkerModal
          orderId={order.id}
          orderNumber={order.orderNumber}
          departmentName={order.currentDepartment}
          onClose={() => setShowAssignModal(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['kanban-orders'] });
            // Close the detail modal to refresh data when reopened
            onClose();
          }}
        />
      )}

      {/* Unassign Worker Confirmation Modal */}
      {showUnassignConfirm && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-[60] transition-opacity"
            onClick={() => setShowUnassignConfirm(false)}
          />
          {/* Modal */}
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full pointer-events-auto animate-in zoom-in-95 duration-200">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Unassign Worker</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to unassign this worker? This action cannot be undone.
                </p>
                <div className="flex items-center gap-3 justify-end">
                  <button
                    onClick={() => setShowUnassignConfirm(false)}
                    className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      unassignMutation.mutate();
                      setShowUnassignConfirm(false);
                    }}
                    disabled={unassignMutation.isPending}
                    className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors disabled:opacity-50"
                  >
                    {unassignMutation.isPending ? 'Unassigning...' : 'Unassign'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default OrderDetailModal;
