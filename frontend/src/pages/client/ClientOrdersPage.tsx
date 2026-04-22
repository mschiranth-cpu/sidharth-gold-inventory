/**
 * ============================================
 * CLIENT ORDERS LIST PAGE
 * ============================================
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getMyOrders } from '../../services/clients.service';
import Button from '../../components/common/Button';

export default function ClientOrdersPage() {
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['client-orders', statusFilter],
    queryFn: () => getMyOrders(statusFilter || undefined),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
            <p className="text-gray-600">Track and manage your orders</p>
          </div>
          <Link to="/client/orders/new">
            <Button
              variant="primary"
              iconLeft={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              }
            >
              New Order
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100 mb-6">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setStatusFilter('')}
              className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                statusFilter === ''
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Orders
            </button>
            <button
              onClick={() => setStatusFilter('DRAFT')}
              className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                statusFilter === 'DRAFT'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setStatusFilter('IN_FACTORY')}
              className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                statusFilter === 'IN_FACTORY'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              In Production
            </button>
            <button
              onClick={() => setStatusFilter('COMPLETED')}
              className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                statusFilter === 'COMPLETED'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Completed
            </button>
          </div>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 border border-gray-100 text-center">
            <svg
              className="w-20 h-20 text-gray-300 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-gray-500 text-lg mb-6">No orders found</p>
            <Link to="/client/orders/new">
              <Button variant="primary" size="lg">
                Place Your First Order
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {orders.map((order) => (
              <Link
                key={order.id}
                to={`/client/orders/${order.id}`}
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:border-indigo-300 hover:shadow-xl transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{order.orderNumber}</h3>
                    <p className="text-gray-600">{order.customerName}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-flex px-4 py-2 rounded-xl text-sm font-semibold ${
                        order.approvalStatus === 'PENDING_APPROVAL'
                          ? 'bg-amber-100 text-amber-800'
                          : order.approvalStatus === 'REJECTED'
                          ? 'bg-red-100 text-red-800'
                          : order.status === 'COMPLETED'
                          ? 'bg-green-100 text-green-800'
                          : order.status === 'IN_FACTORY'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {order.approvalStatus === 'PENDING_APPROVAL'
                        ? 'Pending Approval'
                        : order.approvalStatus === 'REJECTED'
                        ? 'Rejected'
                        : order.status}
                    </span>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                {/* Progress Bar for In-Factory Orders */}
                {order.status === 'IN_FACTORY' && order.departmentTracking && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Progress</span>
                      <span className="text-sm text-gray-600">
                        {
                          order.departmentTracking.filter((d: any) => d.status === 'COMPLETED')
                            .length
                        }{' '}
                        / {order.departmentTracking.length} departments
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${
                            (order.departmentTracking.filter((d: any) => d.status === 'COMPLETED')
                              .length /
                              order.departmentTracking.length) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* View Details Link */}
                <div className="mt-4 flex items-center text-indigo-600 font-medium text-sm">
                  View Details
                  <svg
                    className="w-4 h-4 ml-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
