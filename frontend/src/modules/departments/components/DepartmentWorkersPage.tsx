/**
 * ============================================
 * DEPARTMENT WORKERS PAGE
 * ============================================
 *
 * Displays and manages workers assigned to a department.
 * Uses real API calls via usersService.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import AlertDialog from '../../../components/common/AlertDialog';
import { usersService } from '../../users/services';
import { departmentsService } from '../services';
import { DepartmentName } from '../../../types/user.types';

interface Worker {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'busy' | 'offline';
  activeItems: number;
  completedToday: number;
  avatar?: string;
}

const DepartmentWorkersPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [showAssignOrderModal, setShowAssignOrderModal] = useState(false);

  // Alert dialog
  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    title?: string;
    message: string;
    variant: 'info' | 'success' | 'warning' | 'error';
  }>({ isOpen: false, message: '', variant: 'success' });

  // Fetch department to get the name
  const { data: departmentResponse } = useQuery({
    queryKey: ['department', id],
    queryFn: () => departmentsService.getById(id!),
    enabled: !!id,
  });

  const departmentName = departmentResponse?.data?.name || 'Department';

  // Fetch workers for this department
  const { data: usersResponse, isLoading } = useQuery({
    queryKey: ['users', { department: id }],
    queryFn: () =>
      usersService.getAll({ department: id as DepartmentName | undefined, limit: 100 }),
    enabled: !!id,
  });

  // Transform users to workers format
  const workers: Worker[] = (usersResponse?.data || []).map((user: any) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.isActive ? 'active' : 'offline',
    activeItems: 0, // Would need additional API call for this
    completedToday: 0, // Would need additional API call for this
    avatar: user.avatar,
  }));

  const filteredWorkers = workers.filter(
    (worker) =>
      worker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      worker.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      worker.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: Worker['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'busy':
        return 'bg-indigo-500';
      case 'offline':
        return 'bg-gray-400';
    }
  };

  const getStatusText = (status: Worker['status']) => {
    switch (status) {
      case 'active':
        return 'Available';
      case 'busy':
        return 'Busy';
      case 'offline':
        return 'Offline';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/departments/${id}`)}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{departmentName} Workers</h1>
            <p className="text-gray-500">{workers.length} workers in this department</p>
          </div>
        </div>
        <button
          onClick={() => setShowAssignModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-xl transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Assign Worker
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
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
          <input
            type="text"
            placeholder="Search workers by name, email, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Workers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredWorkers.map((worker) => (
          <div
            key={worker.id}
            className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-semibold text-lg">
                    {worker.name.charAt(0)}
                  </div>
                  <span
                    className={`absolute bottom-0 right-0 w-3.5 h-3.5 ${getStatusColor(
                      worker.status
                    )} rounded-full border-2 border-white`}
                  ></span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{worker.name}</h3>
                  <p className="text-sm text-gray-500">{worker.role}</p>
                </div>
              </div>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${
                  worker.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : worker.status === 'busy'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {getStatusText(worker.status)}
              </span>
            </div>

            <p className="text-sm text-gray-500 mb-4">{worker.email}</p>

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
              <div className="text-center">
                <p className="text-xl font-bold text-indigo-600">{worker.activeItems}</p>
                <p className="text-xs text-gray-500">Active Items</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-green-600">{worker.completedToday}</p>
                <p className="text-xs text-gray-500">Completed Today</p>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => navigate(`/factory?workerId=${worker.id}`)}
                className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                View Orders
              </button>
              <button
                onClick={() => {
                  setSelectedWorker(worker);
                  setShowAssignOrderModal(true);
                }}
                className="flex-1 px-3 py-2 text-sm font-medium text-indigo-700 bg-indigo-100 hover:bg-indigo-200 rounded-lg transition-colors"
              >
                Assign Order
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredWorkers.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
          <svg
            className="w-16 h-16 mx-auto text-gray-300 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <h3 className="text-lg font-medium text-white mb-1">No workers found</h3>
          <p className="text-gray-300">
            {searchQuery
              ? 'Try a different search term'
              : 'No workers assigned to this department yet'}
          </p>
        </div>
      )}

      {/* Assign Worker Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Assign Worker to {departmentName}
            </h2>
            <p className="text-gray-600 mb-4">
              Select a worker from the available pool to assign to this department.
            </p>

            <div className="space-y-3 mb-6">
              {['Ravi Verma', 'Sanjay Patel', 'Mohan Das'].map((name) => (
                <div
                  key={name}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    setAlertDialog({
                      isOpen: true,
                      title: 'Worker Assigned',
                      message: `${name} assigned to ${departmentName}`,
                      variant: 'success',
                    });
                    setShowAssignModal(false);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
                      {name.charAt(0)}
                    </div>
                    <span className="font-medium text-gray-900">{name}</span>
                  </div>
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAssignModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Order Modal */}
      {showAssignOrderModal && selectedWorker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Assign Order to {selectedWorker.name}
            </h2>
            <p className="text-gray-600 mb-4 text-sm">
              Assign an order in {departmentName} to this worker
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Order</label>
                <select className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500">
                  <option>Select order...</option>
                  <option>ORD-2024-001 - Gold Ring 22K (Due: Jan 15)</option>
                  <option>ORD-2024-002 - Gold Necklace 18K (Due: Jan 12)</option>
                  <option>ORD-2024-003 - Gold Bracelet 24K (Due: Jan 18)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Shows orders currently in or approaching {departmentName}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Hours (Optional)
                </label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="e.g., 4.5"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Add any special instructions or notes..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAssignOrderModal(false);
                  setSelectedWorker(null);
                }}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setAlertDialog({
                    isOpen: true,
                    title: 'Order Assigned',
                    message: `Order assigned to ${selectedWorker.name} in ${departmentName}`,
                    variant: 'success',
                  });
                  setShowAssignOrderModal(false);
                  setSelectedWorker(null);
                }}
                className="flex-1 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium transition-colors"
              >
                Assign Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Dialog */}
      <AlertDialog
        isOpen={alertDialog.isOpen}
        title={alertDialog.title}
        message={alertDialog.message}
        variant={alertDialog.variant}
        onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
      />
    </div>
  );
};

export default DepartmentWorkersPage;
