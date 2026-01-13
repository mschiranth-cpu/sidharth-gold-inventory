/**
 * ============================================
 * OVERVIEW TAB - ORDER DETAIL PAGE
 * ============================================
 *
 * Displays all order details in a clean,
 * organized layout with sections.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import React from 'react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { OrderDetail } from '../../types';
import { formatMetalFinish } from '../../../../types/order.types';

interface OverviewTabProps {
  order: OrderDetail;
  isOfficeUser: boolean;
  isEditMode: boolean;
}

const OverviewTab: React.FC<OverviewTabProps> = ({
  order,
  isOfficeUser,
  isEditMode: _isEditMode,
}) => {
  const daysUntilDue = differenceInDays(parseISO(order.dueDate), new Date());
  const isOverdue = daysUntilDue < 0;
  const isDueSoon = daysUntilDue >= 0 && daysUntilDue <= 3;

  const formatDate = (dateStr: string) => {
    return format(parseISO(dateStr), 'MMM dd, yyyy');
  };

  const formatDateTime = (dateStr: string) => {
    return format(parseISO(dateStr), 'MMM dd, yyyy h:mm a');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Gross Weight Card */}
        <div className="group relative bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg hover:border-indigo-200 transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-300" />
          <div className="relative">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">
              Gross Weight
            </p>
            <p className="text-3xl font-bold text-gray-900">{order.grossWeight}g</p>
            {order.netWeight && (
              <p className="text-sm text-indigo-600 mt-1">Net: {order.netWeight}g</p>
            )}
          </div>
        </div>

        {/* Purity Card */}
        <div className="group relative bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg hover:border-purple-200 transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-100 to-violet-100 rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-300" />
          <div className="relative">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">Purity</p>
            <p className="text-3xl font-bold text-purple-600">{order.purity}</p>
            <p className="text-sm text-purple-600 mt-1">{order.metalType}</p>
          </div>
        </div>

        {/* Due Date Card */}
        <div
          className={`group relative bg-white rounded-2xl p-5 shadow-sm border border-gray-100 transition-all duration-300 overflow-hidden ${
            isOverdue
              ? 'hover:shadow-lg hover:border-red-200'
              : isDueSoon
              ? 'hover:shadow-lg hover:border-orange-200'
              : 'hover:shadow-lg hover:border-emerald-200'
          }`}
        >
          <div
            className={`absolute top-0 right-0 w-24 h-24 rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-300 bg-gradient-to-br ${
              isOverdue
                ? 'from-red-100 to-rose-100'
                : isDueSoon
                ? 'from-orange-100 to-amber-100'
                : 'from-emerald-100 to-green-100'
            }`}
          />
          <div className="relative">
            <p
              className={`text-xs font-medium uppercase tracking-wide mb-2 ${
                isOverdue ? 'text-red-600' : isDueSoon ? 'text-orange-600' : 'text-gray-500'
              }`}
            >
              Due Date
            </p>
            <p
              className={`text-3xl font-bold ${
                isOverdue ? 'text-red-600' : isDueSoon ? 'text-orange-600' : 'text-gray-900'
              }`}
            >
              {formatDate(order.dueDate)}
            </p>
            <p
              className={`text-sm mt-1 ${
                isOverdue ? 'text-red-600' : isDueSoon ? 'text-orange-600' : 'text-emerald-600'
              }`}
            >
              {isOverdue ? `${Math.abs(daysUntilDue)} days overdue` : `${daysUntilDue} days left`}
            </p>
          </div>
        </div>

        {/* Current Stage Card */}
        <div className="group relative bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg hover:border-blue-200 transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-300" />
          <div className="relative">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">
              Current Stage
            </p>
            <p className="text-xl font-bold text-blue-600">
              {order.currentDepartment?.displayName || 'Not Started'}
            </p>
            <p className="text-sm text-blue-600 mt-1">
              {order.departmentProgress.filter((d) => d.status === 'completed').length}/
              {order.departmentProgress.length} steps
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Details */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-indigo-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                />
              </svg>
              Product Details
            </h3>
          </div>
          <div className="p-5">
            {order.productImage ? (
              <div className="mb-4">
                <img
                  src={order.productImage}
                  alt={order.productName || 'Product'}
                  className="w-full h-48 object-cover rounded-lg"
                  onError={(e) => {
                    // Hide broken images (e.g., truncated base64)
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            ) : order.productImages && order.productImages.length > 0 ? (
              <div className="mb-4">
                <img
                  src={order.productImages[0]}
                  alt={order.productName || 'Product'}
                  className="w-full h-48 object-cover rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            ) : null}

            <dl className="space-y-3">
              {order.productName && (
                <div>
                  <dt className="text-xs text-gray-500 uppercase tracking-wide">Product Type</dt>
                  <dd className="text-gray-900 font-medium mt-0.5">{order.productName}</dd>
                </div>
              )}

              {order.productDescription && (
                <div>
                  <dt className="text-xs text-gray-500 uppercase tracking-wide">Description</dt>
                  <dd className="text-gray-700 mt-0.5">{order.productDescription}</dd>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {order.size && (
                  <div>
                    <dt className="text-xs text-gray-500 uppercase tracking-wide">Size</dt>
                    <dd className="text-gray-900 mt-0.5">{order.size}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs text-gray-500 uppercase tracking-wide">Quantity</dt>
                  <dd className="text-gray-900 mt-0.5">
                    {order.quantity || 1} pc{(order.quantity || 1) > 1 ? 's' : ''}
                  </dd>
                </div>
              </div>
            </dl>
          </div>
        </div>

        {/* Metal & Weight Details */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-indigo-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
                />
              </svg>
              Metal & Weight
            </h3>
          </div>
          <div className="p-5">
            <dl className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-xs text-gray-500 uppercase tracking-wide">Metal Type</dt>
                  <dd className="text-gray-900 font-medium mt-0.5 flex items-center gap-2">
                    <span
                      className={`w-3 h-3 rounded-full ${
                        order.metalType === 'GOLD'
                          ? 'bg-indigo-400'
                          : order.metalType === 'SILVER'
                          ? 'bg-gray-400'
                          : 'bg-gray-300'
                      }`}
                    />
                    {order.metalType}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500 uppercase tracking-wide">Purity</dt>
                  <dd className="text-gray-900 font-medium mt-0.5">{order.purity}</dd>
                </div>
              </div>

              {/* Metal Finish */}
              {order.metalFinish && (
                <div className="pt-3 border-t border-gray-100">
                  <dt className="text-xs text-gray-500 uppercase tracking-wide">Metal Finish</dt>
                  <dd className="text-gray-900 font-medium mt-0.5">
                    {formatMetalFinish(order.metalFinish, order.customFinish)}
                  </dd>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 pt-3 border-t border-gray-100">
                <div>
                  <dt className="text-xs text-gray-500 uppercase tracking-wide">Gross Weight</dt>
                  <dd className="text-gray-900 font-semibold mt-0.5">{order.grossWeight}g</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500 uppercase tracking-wide">Net Weight</dt>
                  <dd className="text-gray-900 font-semibold mt-0.5">{order.netWeight || '-'}g</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500 uppercase tracking-wide">Waste %</dt>
                  <dd className="text-gray-900 font-semibold mt-0.5">
                    {order.wastePercentage || '-'}%
                  </dd>
                </div>
              </div>
            </dl>
          </div>
        </div>

        {/* Stone Details */}
        {order.hasStones && order.stones && order.stones.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-indigo-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                Stone Details
                <span className="ml-auto text-sm text-gray-500 font-normal">
                  {order.stones.length} stone{order.stones.length !== 1 ? 's' : ''}
                </span>
              </h3>
            </div>
            <div className="p-5">
              <div className="space-y-3">
                {order.stones.map((stone, index) => (
                  <div key={stone.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Type:</span>{' '}
                        <span className="font-medium text-gray-900">{stone.type}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Shape:</span>{' '}
                        <span className="font-medium text-gray-900">{stone.shape}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Qty:</span>{' '}
                        <span className="font-medium text-gray-900">{stone.quantity}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Weight:</span>{' '}
                        <span className="font-medium text-gray-900">{stone.weight}ct</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {order.totalStoneWeight && (
                <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between">
                  <span className="text-gray-600">Total Stone Weight</span>
                  <span className="font-semibold text-gray-900">{order.totalStoneWeight} ct</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Customer Details - Office Only */}
        {isOfficeUser && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-indigo-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Customer Information
                <span className="ml-auto px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                  Office Only
                </span>
              </h3>
            </div>
            <div className="p-5">
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs text-gray-500 uppercase tracking-wide">Customer Name</dt>
                  <dd className="text-gray-900 font-medium mt-0.5">{order.customerName}</dd>
                </div>

                {order.customerPhone && (
                  <div>
                    <dt className="text-xs text-gray-500 uppercase tracking-wide">Phone</dt>
                    <dd className="text-gray-900 mt-0.5 flex items-center gap-2">
                      <a
                        href={`tel:${order.customerPhone}`}
                        className="text-indigo-600 hover:text-indigo-700"
                      >
                        {order.customerPhone}
                      </a>
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <svg
                          className="w-4 h-4 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      </button>
                    </dd>
                  </div>
                )}

                {order.customerEmail && (
                  <div>
                    <dt className="text-xs text-gray-500 uppercase tracking-wide">Email</dt>
                    <dd className="text-gray-900 mt-0.5">
                      <a
                        href={`mailto:${order.customerEmail}`}
                        className="text-indigo-600 hover:text-indigo-700"
                      >
                        {order.customerEmail}
                      </a>
                    </dd>
                  </div>
                )}

                {order.customerAddress && (
                  <div>
                    <dt className="text-xs text-gray-500 uppercase tracking-wide">Address</dt>
                    <dd className="text-gray-700 mt-0.5">{order.customerAddress}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        )}

        {/* Pricing - Office Only */}
        {isOfficeUser && order.totalAmount && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-indigo-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Pricing Summary
                <span className="ml-auto px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                  Office Only
                </span>
              </h3>
            </div>
            <div className="p-5">
              <dl className="space-y-2">
                {order.makingCharges && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Making Charges</dt>
                    <dd className="text-gray-900">{formatCurrency(order.makingCharges)}</dd>
                  </div>
                )}
                {order.stoneCharges && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Stone Charges</dt>
                    <dd className="text-gray-900">{formatCurrency(order.stoneCharges)}</dd>
                  </div>
                )}
                {order.additionalCharges && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Additional Charges</dt>
                    <dd className="text-gray-900">{formatCurrency(order.additionalCharges)}</dd>
                  </div>
                )}

                <div className="flex justify-between pt-3 border-t border-gray-200">
                  <dt className="text-gray-900 font-semibold">Total Amount</dt>
                  <dd className="text-lg font-bold text-gray-900">
                    {formatCurrency(order.totalAmount)}
                  </dd>
                </div>

                {order.advanceReceived !== undefined && (
                  <div className="flex justify-between text-green-600">
                    <dt>Advance Received</dt>
                    <dd>{formatCurrency(order.advanceReceived)}</dd>
                  </div>
                )}

                {order.balanceDue !== undefined && (
                  <div className="flex justify-between text-indigo-600 font-medium">
                    <dt>Balance Due</dt>
                    <dd>{formatCurrency(order.balanceDue)}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        )}
      </div>

      {/* Notes & Instructions */}
      {(order.notes || order.specialInstructions) && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-indigo-500"
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
              Notes & Instructions
            </h3>
          </div>
          <div className="p-5 space-y-4">
            {order.notes && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">General Notes</h4>
                <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{order.notes}</p>
              </div>
            )}
            {order.specialInstructions && (
              <div>
                <h4 className="text-sm font-medium text-indigo-700 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  Special Instructions
                </h4>
                <p className="text-indigo-800 bg-indigo-50 p-3 rounded-lg border border-indigo-200">
                  {order.specialInstructions}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Order Metadata */}
      <div className="bg-gray-50 rounded-xl p-4 flex flex-wrap gap-6 text-sm text-gray-500">
        <div>
          <span className="text-gray-400">Created:</span>{' '}
          <span className="text-gray-600">{formatDateTime(order.createdAt)}</span>
          <span className="text-gray-400"> by </span>
          <span className="text-gray-600">{order.createdBy.name}</span>
        </div>
        <div>
          <span className="text-gray-400">Last Updated:</span>{' '}
          <span className="text-gray-600">{formatDateTime(order.updatedAt)}</span>
        </div>
        {order.completedAt && (
          <div>
            <span className="text-gray-400">Completed:</span>{' '}
            <span className="text-green-600">{formatDateTime(order.completedAt)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default OverviewTab;
