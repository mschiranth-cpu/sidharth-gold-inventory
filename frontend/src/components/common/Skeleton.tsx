/**
 * ============================================
 * SKELETON LOADING COMPONENTS
 * ============================================
 *
 * Skeleton screens for better perceived performance.
 * These display while lazy-loaded components are loading.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import { memo } from 'react';
import clsx from 'clsx';

// ============================================
// BASE SKELETON COMPONENT
// ============================================

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  animate?: boolean;
}

export const Skeleton = memo(function Skeleton({
  className,
  width,
  height,
  rounded = 'md',
  animate = true,
}: SkeletonProps) {
  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  };

  return (
    <div
      className={clsx(
        'bg-gray-200',
        animate && 'animate-pulse',
        roundedClasses[rounded],
        className
      )}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
    />
  );
});

// ============================================
// TEXT SKELETON
// ============================================

interface TextSkeletonProps {
  lines?: number;
  className?: string;
  lastLineWidth?: string;
}

export const TextSkeleton = memo(function TextSkeleton({
  lines = 3,
  className,
  lastLineWidth = '60%',
}: TextSkeletonProps) {
  return (
    <div className={clsx('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={16}
          width={i === lines - 1 ? lastLineWidth : '100%'}
          rounded="sm"
        />
      ))}
    </div>
  );
});

// ============================================
// CARD SKELETON
// ============================================

export const CardSkeleton = memo(function CardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton width={48} height={48} rounded="full" />
        <div className="flex-1 space-y-2">
          <Skeleton height={20} width="60%" />
          <Skeleton height={14} width="40%" />
        </div>
      </div>
      <TextSkeleton lines={2} />
    </div>
  );
});

// ============================================
// STAT CARD SKELETON
// ============================================

export const StatCardSkeleton = memo(function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton height={14} width={100} />
          <Skeleton height={32} width={80} />
        </div>
        <Skeleton width={48} height={48} rounded="lg" />
      </div>
      <div className="mt-4 flex items-center gap-2">
        <Skeleton width={60} height={16} />
        <Skeleton width={80} height={14} />
      </div>
    </div>
  );
});

// ============================================
// TABLE SKELETON
// ============================================

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export const TableSkeleton = memo(function TableSkeleton({
  rows = 5,
  columns = 5,
}: TableSkeletonProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
        <div className="flex items-center justify-between">
          <Skeleton width={200} height={24} />
          <div className="flex gap-2">
            <Skeleton width={100} height={36} rounded="md" />
            <Skeleton width={100} height={36} rounded="md" />
          </div>
        </div>
      </div>

      {/* Table Header */}
      <div className="border-b border-gray-200 px-6 py-3 bg-gray-50">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className="flex-1">
              <Skeleton height={16} width={`${60 + Math.random() * 40}%`} />
            </div>
          ))}
        </div>
      </div>

      {/* Table Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="border-b border-gray-100 px-6 py-4 last:border-b-0">
          <div className="flex gap-4 items-center">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div key={colIndex} className="flex-1">
                <Skeleton height={colIndex === 0 ? 20 : 16} width={`${50 + Math.random() * 50}%`} />
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Pagination */}
      <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <Skeleton width={150} height={16} />
          <div className="flex gap-2">
            <Skeleton width={80} height={32} rounded="md" />
            <Skeleton width={80} height={32} rounded="md" />
          </div>
        </div>
      </div>
    </div>
  );
});

// ============================================
// DASHBOARD SKELETON
// ============================================

export const DashboardSkeleton = memo(function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton width={200} height={28} />
          <Skeleton width={300} height={16} />
        </div>
        <Skeleton width={120} height={40} rounded="md" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <Skeleton width={150} height={20} className="mb-4" />
          <Skeleton height={300} />
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <Skeleton width={180} height={20} className="mb-4" />
          <Skeleton height={300} />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <Skeleton width={200} height={24} className="mb-4" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton width={40} height={40} rounded="full" />
              <div className="flex-1 space-y-2">
                <Skeleton height={16} width="70%" />
                <Skeleton height={14} width="40%" />
              </div>
              <Skeleton width={80} height={14} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

// ============================================
// PAGE SKELETON
// ============================================

export const PageSkeleton = memo(function PageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Skeleton width={250} height={32} className="mb-2" />
          <Skeleton width={400} height={16} />
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="space-y-6">
            <div className="flex gap-4">
              <Skeleton width={120} height={40} rounded="md" />
              <Skeleton width={120} height={40} rounded="md" />
              <Skeleton width={120} height={40} rounded="md" />
            </div>
            <TextSkeleton lines={5} />
            <div className="grid grid-cols-3 gap-4">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

// ============================================
// FORM SKELETON
// ============================================

export const FormSkeleton = memo(function FormSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
      <Skeleton width={200} height={24} />

      <div className="grid grid-cols-2 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton width={100} height={14} />
            <Skeleton height={40} rounded="md" />
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <Skeleton width={120} height={14} />
        <Skeleton height={100} rounded="md" />
      </div>

      <div className="flex justify-end gap-4">
        <Skeleton width={100} height={40} rounded="md" />
        <Skeleton width={120} height={40} rounded="md" />
      </div>
    </div>
  );
});

// ============================================
// KANBAN SKELETON
// ============================================

export const KanbanSkeleton = memo(function KanbanSkeleton() {
  return (
    <div className="flex gap-6 overflow-x-auto pb-4">
      {Array.from({ length: 4 }).map((_, colIndex) => (
        <div key={colIndex} className="flex-shrink-0 w-80 bg-gray-100 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <Skeleton width={120} height={20} />
            <Skeleton width={24} height={24} rounded="full" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 + Math.floor(Math.random() * 3) }).map((_, cardIndex) => (
              <div key={cardIndex} className="bg-white rounded-lg shadow-sm p-4 space-y-3">
                <Skeleton height={16} width="80%" />
                <Skeleton height={14} width="60%" />
                <div className="flex items-center justify-between pt-2">
                  <Skeleton width={60} height={20} rounded="full" />
                  <Skeleton width={24} height={24} rounded="full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
});

// ============================================
// LIST ITEM SKELETON
// ============================================

export const ListItemSkeleton = memo(function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-gray-100">
      <Skeleton width={40} height={40} rounded="full" />
      <div className="flex-1 space-y-2">
        <Skeleton height={16} width="60%" />
        <Skeleton height={14} width="40%" />
      </div>
      <Skeleton width={80} height={28} rounded="md" />
    </div>
  );
});

// ============================================
// AVATAR SKELETON
// ============================================

interface AvatarSkeletonProps {
  size?: 'sm' | 'md' | 'lg';
}

export const AvatarSkeleton = memo(function AvatarSkeleton({ size = 'md' }: AvatarSkeletonProps) {
  const sizes = {
    sm: 32,
    md: 40,
    lg: 56,
  };

  return <Skeleton width={sizes[size]} height={sizes[size]} rounded="full" />;
});

// ============================================
// TAB CONTENT SKELETON (Order Detail Tabs)
// ============================================

export const TabContentSkeleton = memo(function TabContentSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <Skeleton width={180} height={24} />
        <Skeleton width={100} height={36} rounded="md" />
      </div>

      {/* Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton width={120} height={14} />
            <Skeleton height={20} />
          </div>
        ))}
      </div>

      {/* List Section */}
      <div className="space-y-3">
        <Skeleton width={150} height={20} />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
            <Skeleton width={32} height={32} rounded="full" />
            <div className="flex-1 space-y-2">
              <Skeleton height={16} width="70%" />
              <Skeleton height={14} width="50%" />
            </div>
            <Skeleton width={60} height={24} rounded="full" />
          </div>
        ))}
      </div>
    </div>
  );
});

// ============================================
// WORK SUBMISSION FORM SKELETON
// ============================================

export const WorkSubmissionFormSkeleton = memo(function WorkSubmissionFormSkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <Skeleton width={280} height={32} />
        <Skeleton width={400} height={16} />
      </div>

      {/* Order Details Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <Skeleton width={150} height={20} className="mb-4" />
        <div className="grid grid-cols-2 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton width={100} height={14} />
              <Skeleton height={18} />
            </div>
          ))}
        </div>
      </div>

      {/* Department Fields Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <Skeleton width={200} height={24} />

        {/* Field Groups */}
        {Array.from({ length: 3 }).map((_, groupIndex) => (
          <div key={groupIndex} className="space-y-4">
            <Skeleton width={150} height={18} />
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, fieldIndex) => (
                <div key={fieldIndex} className="space-y-2">
                  <Skeleton width={120} height={14} />
                  <Skeleton height={40} rounded="md" />
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Photo Upload Section */}
        <div className="space-y-3 pt-4 border-t border-gray-200">
          <Skeleton width={180} height={18} />
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center"
              >
                <Skeleton width={48} height={48} rounded="full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <Skeleton width={100} height={44} rounded="md" />
        <Skeleton width={150} height={44} rounded="md" />
      </div>
    </div>
  );
});

// ============================================
// PROFILE SKELETON
// ============================================

export const ProfileSkeleton = memo(function ProfileSkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <div className="flex items-center gap-6">
          <Skeleton width={120} height={120} rounded="full" />
          <div className="flex-1 space-y-3">
            <Skeleton width={220} height={32} />
            <Skeleton width={180} height={20} />
            <div className="flex gap-3 pt-2">
              <Skeleton width={100} height={28} rounded="full" />
              <Skeleton width={100} height={28} rounded="full" />
            </div>
          </div>
          <Skeleton width={120} height={40} rounded="md" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-gray-200 p-6 text-center space-y-2"
          >
            <Skeleton width={60} height={32} className="mx-auto" />
            <Skeleton width={100} height={16} className="mx-auto" />
          </div>
        ))}
      </div>

      {/* Profile Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <Skeleton width={150} height={24} />
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
            >
              <Skeleton width={120} height={16} />
              <Skeleton width={200} height={18} />
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <Skeleton width={180} height={24} />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 p-3 border-l-2 border-indigo-200">
              <Skeleton width={8} height={8} rounded="full" />
              <div className="flex-1 space-y-2">
                <Skeleton height={16} width="80%" />
                <Skeleton height={14} width="50%" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

// ============================================
// NOTIFICATION DROPDOWN SKELETON
// ============================================

export const NotificationDropdownSkeleton = memo(function NotificationDropdownSkeleton() {
  return (
    <div className="w-96 max-h-96 divide-y divide-gray-100">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <Skeleton width={120} height={20} />
        <Skeleton width={80} height={16} />
      </div>

      {/* Notification Items */}
      <div className="max-h-80 overflow-y-auto">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-4 hover:bg-gray-50">
            <div className="flex gap-3">
              <Skeleton width={40} height={40} rounded="full" />
              <div className="flex-1 space-y-2">
                <Skeleton height={16} width="90%" />
                <Skeleton height={14} width="70%" />
                <Skeleton height={12} width={100} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-3 text-center">
        <Skeleton height={14} width={120} className="mx-auto" />
      </div>
    </div>
  );
});

// ============================================
// FILE GALLERY SKELETON
// ============================================

export const FileGallerySkeleton = memo(function FileGallerySkeleton() {
  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} width={120} height={36} rounded="full" />
        ))}
      </div>

      {/* Grid View */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <Skeleton height={200} rounded="none" />
            <div className="p-3 space-y-2">
              <Skeleton height={16} width="80%" />
              <Skeleton height={12} width="60%" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

// ============================================
// METRIC CARD SKELETON (Dashboard)
// ============================================

export const MetricCardSkeleton = memo(function MetricCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2 flex-1">
          <Skeleton width={100} height={14} />
          <Skeleton width={80} height={32} />
        </div>
        <Skeleton width={48} height={48} rounded="lg" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton width={16} height={16} rounded="sm" />
        <Skeleton width={60} height={14} />
        <Skeleton width={80} height={12} />
      </div>
    </div>
  );
});
