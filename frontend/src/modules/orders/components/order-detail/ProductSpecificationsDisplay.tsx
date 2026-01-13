/**
 * ============================================
 * PRODUCT SPECIFICATIONS DISPLAY
 * ============================================
 *
 * Displays product specifications in read-only
 * format based on product type
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import React from 'react';
import { OrderDetail } from '../../types';

interface ProductSpecificationsDisplayProps {
  order: OrderDetail;
}

/**
 * Format specification label from camelCase to Title Case
 */
const formatLabel = (key: string): string => {
  // Remove custom prefix if present
  if (key.startsWith('custom')) {
    return key
      .replace('custom', '')
      .replace(/([A-Z])/g, ' $1')
      .trim();
  }

  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
};

/**
 * Format specification value for display
 */
const formatValue = (value: any): string => {
  if (value === null || value === undefined) return 'Not specified';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return value.toString();
  return value.toString();
};

const ProductSpecificationsDisplay: React.FC<ProductSpecificationsDisplayProps> = ({ order }) => {
  if (!order.productSpecifications || Object.keys(order.productSpecifications).length === 0) {
    return null;
  }

  const specs = order.productSpecifications as Record<string, any>;

  return (
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
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Product Specifications
        </h3>
      </div>
      <div className="p-5">
        <dl className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(specs)
              .filter(([_, value]) => value !== null && value !== undefined && value !== '')
              .map(([key, value]) => (
                <div key={key}>
                  <dt className="text-xs text-gray-500 uppercase tracking-wide">
                    {formatLabel(key)}
                  </dt>
                  <dd className="text-gray-900 mt-0.5 font-medium">{formatValue(value)}</dd>
                </div>
              ))}
          </div>
        </dl>
      </div>
    </div>
  );
};

export default ProductSpecificationsDisplay;
