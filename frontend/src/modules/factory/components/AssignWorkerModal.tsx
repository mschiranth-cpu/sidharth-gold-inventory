/**
 * ============================================
 * ASSIGN WORKER MODAL COMPONENT
 * ============================================
 *
 * Modal for assigning a worker to a pending order.
 * Shows list of workers in the department with their workload.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { api } from '../../../services/api';

interface Worker {
  id: string;
  name: string;
  email: string;
  currentWorkload: number;
}

interface AssignWorkerModalProps {
  orderId: string;
  orderNumber: string;
  departmentName: string;
  onClose: () => void;
  onSuccess: () => void;
}

const AssignWorkerModal: React.FC<AssignWorkerModalProps> = ({
  orderId,
  orderNumber,
  departmentName,
  onClose,
  onSuccess,
}) => {
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');
  const queryClient = useQueryClient();

  // Fetch workers for this department
  const { data: workers, isLoading } = useQuery({
    queryKey: ['department-workers', departmentName],
    queryFn: async () => {
      const response = await api.get<{ data: Worker[] }>(
        `/orders/departments/${departmentName}/workers`
      );
      return response.data.data || [];
    },
  });

  // Assign worker mutation
  const assignMutation = useMutation({
    mutationFn: async (workerId: string) => {
      const response = await api.patch(`/orders/${orderId}/departments/${departmentName}/assign`, {
        workerId,
      });
      return response.data;
    },
    onSuccess: async () => {
      toast.success('Worker assigned successfully');
      // Refetch immediately to update UI
      await queryClient.refetchQueries({ queryKey: ['kanban-orders'] });
      await queryClient.refetchQueries({ queryKey: ['order', orderId] });
      onSuccess();
      onClose();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error?.message || 'Failed to assign worker';
      toast.error(message);
    },
  });

  const handleAssign = () => {
    if (!selectedWorkerId) {
      toast.error('Please select a worker');
      return;
    }
    assignMutation.mutate(selectedWorkerId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Assign Worker</h3>
            <p className="text-sm text-indigo-100 mt-0.5">{departmentName} Department</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
            <XMarkIcon className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Order: <span className="font-semibold text-gray-900">{orderNumber}</span>
            </p>
          </div>

          {/* Workers List */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Worker:</label>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : workers && workers.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {workers.map((worker) => (
                  <button
                    key={worker.id}
                    onClick={() => setSelectedWorkerId(worker.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                      selectedWorkerId === worker.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{worker.name}</p>
                        <p className="text-xs text-gray-500">{worker.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Current workload</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {worker.currentWorkload}{' '}
                          {worker.currentWorkload === 1 ? 'order' : 'orders'}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No workers available in this department</p>
                <p className="text-xs mt-1">Please add workers to continue</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={assignMutation.isPending}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              disabled={!selectedWorkerId || assignMutation.isPending}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-lg shadow-indigo-500/30"
            >
              {assignMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Assigning...
                </span>
              ) : (
                'Assign Worker'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignWorkerModal;
