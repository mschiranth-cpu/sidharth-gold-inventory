/**
 * ============================================
 * ORDER APPROVAL PAGE (Admin/Office Staff)
 * ============================================
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrdersPendingApproval, approveClientOrder } from '../../services/clients.service';
import Button from '../../components/common/Button';

export default function OrderApprovalPage() {
  const queryClient = useQueryClient();
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['pending-orders'],
    queryFn: getOrdersPendingApproval,
  });

  const approveMutation = useMutation({
    mutationFn: ({ orderId, approved, rejectionReason }: any) =>
      approveClientOrder(orderId, { approved, rejectionReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-orders'] });
      setSelectedOrder(null);
      setRejectionReason('');
    },
  });

  const handleApprove = (orderId: string, approved: boolean) => {
    approveMutation.mutate({
      orderId,
      approved,
      rejectionReason: approved ? undefined : rejectionReason,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Approval Queue</h1>
          <p className="text-gray-600">
            Review and approve client orders ({orders.length} pending)
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-gray-500 text-lg">No orders pending approval</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{order.orderNumber}</h3>
                    <p className="text-gray-600">
                      Client: {order.client?.user?.name} (
                      {order.client?.businessName || 'Individual'})
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Submitted: {new Date(order.createdAt).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <span className="px-4 py-2 rounded-xl text-sm font-semibold bg-amber-100 text-amber-800">
                    Pending Approval
                  </span>
                </div>

                {/* Order Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-sm text-gray-600">Customer</p>
                    <p className="font-semibold text-gray-900">{order.customerName}</p>
                  </div>
                  {order.orderDetails?.productType && (
                    <div>
                      <p className="text-sm text-gray-600">Product</p>
                      <p className="font-semibold text-gray-900">
                        {order.orderDetails.productType}
                      </p>
                    </div>
                  )}
                  {order.orderDetails?.purity && (
                    <div>
                      <p className="text-sm text-gray-600">Purity</p>
                      <p className="font-semibold text-gray-900">{order.orderDetails.purity}K</p>
                    </div>
                  )}
                  {order.orderDetails?.quantity && (
                    <div>
                      <p className="text-sm text-gray-600">Quantity</p>
                      <p className="font-semibold text-gray-900">{order.orderDetails.quantity}</p>
                    </div>
                  )}
                </div>

                {/* Special Instructions */}
                {order.orderDetails?.specialInstructions && (
                  <div className="mb-4 p-4 bg-blue-50 rounded-xl">
                    <p className="text-sm font-semibold text-blue-900 mb-1">
                      Special Instructions:
                    </p>
                    <p className="text-sm text-blue-800">
                      {order.orderDetails.specialInstructions}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="success"
                    onClick={() => handleApprove(order.id, true)}
                    isLoading={approveMutation.isPending}
                    iconLeft={
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
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    }
                  >
                    Approve Order
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => setSelectedOrder(order.id)}
                    iconLeft={
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    }
                  >
                    Reject Order
                  </Button>
                </div>

                {/* Rejection Modal */}
                {selectedOrder === order.id && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
                      <h3 className="text-xl font-bold text-gray-900 mb-4">Reject Order</h3>
                      <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Rejection Reason *
                        </label>
                        <textarea
                          rows={4}
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder="Please provide a reason for rejection..."
                        />
                      </div>
                      <div className="flex gap-3">
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setSelectedOrder(null);
                            setRejectionReason('');
                          }}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => handleApprove(order.id, false)}
                          isLoading={approveMutation.isPending}
                          disabled={!rejectionReason.trim()}
                          className="flex-1"
                        >
                          Reject Order
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
