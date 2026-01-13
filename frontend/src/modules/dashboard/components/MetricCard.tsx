/**
 * ============================================
 * METRIC CARD COMPONENT - MODERN UI
 * ============================================
 *
 * Premium metric card with glassmorphism, gradients, and animations.
 *
 * @author Gold Factory Dev Team
 * @version 2.0.0
 */

import React from 'react';
import type { MetricChange } from '../../../types/dashboard.types';

// ============================================
// TYPES
// ============================================

interface MetricCardProps {
  title: string;
  value: number | string;
  change?: MetricChange;
  icon: React.ReactNode;
  color: 'gold' | 'blue' | 'green' | 'red' | 'purple';
  isLoading?: boolean;
}

// ============================================
// COLOR MAPPINGS - ENHANCED
// ============================================

const colorClasses = {
  gold: {
    gradient: 'from-indigo-400 via-indigo-500 to-purple-500',
    glow: 'shadow-indigo-500/25',
    light: 'bg-indigo-50',
    text: 'text-indigo-600',
    border: 'border-indigo-200/50',
    iconBg: 'bg-gradient-to-br from-indigo-400 to-purple-500',
  },
  blue: {
    gradient: 'from-blue-400 via-blue-500 to-indigo-500',
    glow: 'shadow-blue-500/25',
    light: 'bg-blue-50',
    text: 'text-blue-600',
    border: 'border-blue-200/50',
    iconBg: 'bg-gradient-to-br from-blue-400 to-indigo-500',
  },
  green: {
    gradient: 'from-emerald-400 via-emerald-500 to-teal-500',
    glow: 'shadow-emerald-500/25',
    light: 'bg-emerald-50',
    text: 'text-emerald-600',
    border: 'border-emerald-200/50',
    iconBg: 'bg-gradient-to-br from-emerald-400 to-teal-500',
  },
  red: {
    gradient: 'from-red-400 via-red-500 to-rose-500',
    glow: 'shadow-red-500/25',
    light: 'bg-red-50',
    text: 'text-red-600',
    border: 'border-red-200/50',
    iconBg: 'bg-gradient-to-br from-red-400 to-rose-500',
  },
  purple: {
    gradient: 'from-purple-400 via-purple-500 to-violet-500',
    glow: 'shadow-purple-500/25',
    light: 'bg-purple-50',
    text: 'text-purple-600',
    border: 'border-purple-200/50',
    iconBg: 'bg-gradient-to-br from-purple-400 to-violet-500',
  },
};

// ============================================
// LOADING SKELETON - ENHANCED
// ============================================

export const MetricCardSkeleton: React.FC = () => (
  <div className="relative overflow-hidden bg-white/90 backdrop-blur-xl rounded-2xl p-6 border border-gray-100/50">
    <div className="absolute inset-0 shimmer opacity-50"></div>
    <div className="relative flex items-start justify-between">
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded-full w-24 mb-4"></div>
        <div className="h-10 bg-gray-200 rounded-xl w-20 mb-3"></div>
        <div className="h-3 bg-gray-200 rounded-full w-28"></div>
      </div>
      <div className="w-14 h-14 bg-gray-200 rounded-2xl"></div>
    </div>
  </div>
);

// ============================================
// COMPONENT
// ============================================

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  icon,
  color,
  isLoading = false,
}) => {
  if (isLoading) {
    return <MetricCardSkeleton />;
  }

  const colors = colorClasses[color];

  return (
    <div
      className={`
        group relative overflow-hidden
        bg-white/95 backdrop-blur-xl rounded-2xl p-6
        border ${colors.border}
        shadow-lg ${colors.glow}
        hover:shadow-xl hover:${colors.glow}
        transform hover:-translate-y-1 hover:scale-[1.02]
        transition-all duration-300 ease-out
        cursor-default
      `}
    >
      {/* Subtle gradient overlay on hover */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300`}
      ></div>

      {/* Content */}
      <div className="relative flex items-start justify-between">
        <div className="flex-1 space-y-1">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{title}</p>
          <p className="text-4xl font-bold text-gray-900 tracking-tight">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {change && (
            <div className="flex items-center gap-2 pt-2">
              <div
                className={`flex items-center gap-1 px-2 py-1 rounded-full ${
                  change.isPositive ? 'bg-emerald-100' : 'bg-red-100'
                }`}
              >
                {change.isPositive ? (
                  <svg
                    className="w-3.5 h-3.5 text-emerald-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 10l7-7m0 0l7 7m-7-7v18"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-3.5 h-3.5 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                )}
                <span
                  className={`text-xs font-bold ${
                    change.isPositive ? 'text-emerald-700' : 'text-red-700'
                  }`}
                >
                  {change.percentage}%
                </span>
              </div>
              <span className="text-xs text-gray-400 font-medium">vs last week</span>
            </div>
          )}
        </div>

        {/* Icon with enhanced styling */}
        <div
          className={`
          w-14 h-14 ${colors.iconBg} rounded-2xl 
          flex items-center justify-center 
          shadow-lg ${colors.glow}
          transform group-hover:scale-110 group-hover:rotate-3
          transition-all duration-300
        `}
        >
          {icon}
        </div>
      </div>

      {/* Bottom accent line */}
      <div
        className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${colors.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
      ></div>
    </div>
  );
};

export default MetricCard;
