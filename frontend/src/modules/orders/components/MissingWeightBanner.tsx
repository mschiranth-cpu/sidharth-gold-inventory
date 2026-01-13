/**
 * ============================================
 * MISSING WEIGHT BANNER
 * ============================================
 *
 * Warning banner shown when weight information is missing from an order.
 * Visible to Admins, Factory Managers, and Office Staff.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import React from 'react';

interface MissingWeightBannerProps {
  orderId: string;
  missingGrossWeight?: boolean;
  missingNetWeight?: boolean;
  onUpdate?: () => void;
}

const MissingWeightBanner: React.FC<MissingWeightBannerProps> = ({
  missingGrossWeight,
  missingNetWeight,
  onUpdate,
}) => {
  if (!missingGrossWeight && !missingNetWeight) {
    return null;
  }

  const getMissingFields = () => {
    const fields = [];
    if (missingGrossWeight) fields.push('Gross Weight');
    if (missingNetWeight) fields.push('Net Weight');
    return fields.join(' and ');
  };

  return (
    <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg mb-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-amber-400"
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
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-amber-800">Missing Weight Information</h3>
          <div className="mt-2 text-sm text-amber-700">
            <p>
              <strong>{getMissingFields()}</strong> has not been filled for this order. Please
              update the weight details to proceed with accurate calculations.
            </p>
          </div>
          {onUpdate && (
            <div className="mt-4">
              <button
                type="button"
                onClick={onUpdate}
                className="inline-flex items-center px-3 py-1.5 border border-amber-300 shadow-sm text-sm font-medium rounded-md text-amber-800 bg-white hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors"
              >
                <svg
                  className="w-4 h-4 mr-1.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Update Weight Details
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MissingWeightBanner;
