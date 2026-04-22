/**
 * ============================================
 * CLIENT ORDER DETAIL PAGE
 * ============================================
 */

import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyOrders, getOrderComments, addOrderComment } from '../../services/clients.service';
import Button from '../../components/common/Button';

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');

  const { data: orders = [] } = useQuery({
    queryKey: ['client-orders'],
    queryFn: () => getMyOrders(),
  });

  const order = orders.find((o) => o.id === orderId);

  const { data: comments = [] } = useQuery({
    queryKey: ['order-comments', orderId],
    queryFn: () => getOrderComments(orderId!),
    enabled: !!orderId,
  });

  const addCommentMutation = useMutation({
    mutationFn: addOrderComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-comments', orderId] });
      setCommentText('');
    },
  });

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !orderId) return;
    addCommentMutation.mutate({
      orderId,
      message: commentText,
    });
  };

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <p className="text-gray-500 text-lg">Order not found</p>
            <Link to="/client/orders" className="mt-4 inline-block">
              <Button variant="primary">Back to Orders</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const completedDepts =
    order.departmentTracking?.filter((d: any) => d.status === 'COMPLETED').length || 0;
  const totalDepts = order.departmentTracking?.length || 1;
  const progress = (completedDepts / totalDepts) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/client/orders"
            className="text-indigo-600 hover:text-indigo-700 font-medium text-sm mb-4 inline-flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Orders
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">{order.orderNumber}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Status Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Order Status</h2>
                <span
                  className={`px-4 py-2 rounded-xl text-sm font-semibold ${
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
              </div>

              {order.approvalStatus === 'REJECTED' && order.rejectionReason && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm font-semibold text-red-800 mb-1">Rejection Reason:</p>
                  <p className="text-sm text-red-700">{order.rejectionReason}</p>
                </div>
              )}

              {order.status === 'IN_FACTORY' && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">Production Progress</span>
                    <span className="text-sm text-gray-600">{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  {/* Department Timeline */}
                  <div className="space-y-3">
                    {order.departmentTracking?.map((dept: any, index: number) => (
                      <div key={dept.id} className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            dept.status === 'COMPLETED'
                              ? 'bg-green-100 text-green-600'
                              : dept.status === 'IN_PROGRESS'
                              ? 'bg-blue-100 text-blue-600'
                              : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          {dept.status === 'COMPLETED' ? (
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
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          ) : (
                            <span className="text-sm font-bold">{index + 1}</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{dept.departmentName}</p>
                          <p className="text-sm text-gray-600">{dept.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Order Details Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Customer Name</p>
                  <p className="font-semibold text-gray-900">{order.customerName}</p>
                </div>
                {order.orderDetails?.productType && (
                  <div>
                    <p className="text-sm text-gray-600">Product Type</p>
                    <p className="font-semibold text-gray-900">{order.orderDetails.productType}</p>
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
            </div>

            {/* Comments Section */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Comments</h2>

              {/* Comments List */}
              <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                {comments.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No comments yet</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                        {comment.user?.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-semibold text-gray-900">{comment.user?.name}</p>
                            <span className="text-xs text-gray-500">
                              {new Date(comment.createdAt).toLocaleString('en-IN')}
                            </span>
                          </div>
                          <p className="text-gray-700">{comment.message}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment Form */}
              <form onSubmit={handleAddComment} className="flex gap-3">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={addCommentMutation.isPending}
                  disabled={!commentText.trim()}
                >
                  Send
                </Button>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Info */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4">Order Information</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-600">Order Number</p>
                  <p className="font-semibold text-gray-900">{order.orderNumber}</p>
                </div>
                <div>
                  <p className="text-gray-600">Created On</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                {order.orderDetails?.dueDate && (
                  <div>
                    <p className="text-gray-600">Due Date</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(order.orderDetails.dueDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Need Help */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
              <h3 className="font-bold mb-2">Need Help?</h3>
              <p className="text-sm text-indigo-100 mb-4">
                Have questions about your order? Use the comments section to communicate with our
                team.
              </p>
              <Button variant="secondary" size="sm" className="w-full">
                Contact Support
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
