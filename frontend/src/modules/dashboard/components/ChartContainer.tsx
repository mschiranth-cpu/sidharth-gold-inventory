/**
 * ============================================
 * CHART CONTAINER COMPONENT
 * ============================================
 * 
 * Wrapper component for dashboard charts with title, loading state.
 * 
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import React from 'react';

interface ChartContainerProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  isLoading?: boolean;
  className?: string;
  action?: React.ReactNode;
}

// ============================================
// LOADING SKELETON
// ============================================

export const ChartSkeleton: React.FC<{ height?: string }> = ({ height = 'h-64' }) => (
  <div className={`${height} bg-gray-100 rounded-xl animate-pulse flex items-center justify-center`}>
    <div className="flex flex-col items-center gap-2">
      <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
      <div className="h-3 bg-gray-200 rounded w-24"></div>
    </div>
  </div>
);

// ============================================
// COMPONENT
// ============================================

const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  subtitle,
  children,
  isLoading = false,
  className = '',
  action,
}) => {
  return (
    <div className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
      {isLoading ? <ChartSkeleton /> : children}
    </div>
  );
};

export default ChartContainer;
