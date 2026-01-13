/**
 * ============================================
 * REPORTS PAGE
 * ============================================
 *
 * Comprehensive reports page with multiple report
 * types, charts, and export functionality.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import React, { useState, useCallback } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  AlertTriangle,
  Users,
  Calendar,
  Download,
  Printer,
  Filter,
  RefreshCw,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

import { cn } from '../../../lib/utils';
import type { ReportType, ReportFilters } from '../../../types/report.types';

// Import report components
import { DailyProductionChart } from './charts/DailyProductionChart';
import { DepartmentEfficiencyChart } from './charts/DepartmentEfficiencyChart';
import { PendingOrdersReport } from './reports/PendingOrdersReport';
import { OverdueOrdersReport } from './reports/OverdueOrdersReport';
import { WorkerPerformanceReport } from './reports/WorkerPerformanceReport';
import { ReportSummaryCards } from './ReportSummaryCards';
import { DateRangePicker } from './DateRangePicker';
import { ReportFiltersPanel } from './ReportFiltersPanel';

// ============================================
// REPORT TAB CONFIGURATION
// ============================================

interface ReportTab {
  id: ReportType;
  label: string;
  icon: React.FC<{ className?: string }>;
  description: string;
}

const REPORT_TABS: ReportTab[] = [
  {
    id: 'daily-production',
    label: 'Daily Production',
    icon: BarChart3,
    description: 'Orders completed per day',
  },
  {
    id: 'department-efficiency',
    label: 'Department Efficiency',
    icon: TrendingUp,
    description: 'Average time per department',
  },
  {
    id: 'pending-orders',
    label: 'Pending Orders',
    icon: Clock,
    description: 'Orders grouped by department',
  },
  {
    id: 'overdue-orders',
    label: 'Overdue Orders',
    icon: AlertTriangle,
    description: 'With escalation levels',
  },
  {
    id: 'worker-performance',
    label: 'Worker Performance',
    icon: Users,
    description: 'Orders handled per worker',
  },
];

// ============================================
// DATE RANGE PRESETS
// ============================================

interface DatePreset {
  label: string;
  getValue: () => { startDate: Date; endDate: Date };
}

const DATE_PRESETS: DatePreset[] = [
  {
    label: 'Today',
    getValue: () => {
      const today = new Date();
      return { startDate: today, endDate: today };
    },
  },
  {
    label: 'Last 7 Days',
    getValue: () => ({
      startDate: subDays(new Date(), 7),
      endDate: new Date(),
    }),
  },
  {
    label: 'Last 30 Days',
    getValue: () => ({
      startDate: subDays(new Date(), 30),
      endDate: new Date(),
    }),
  },
  {
    label: 'This Month',
    getValue: () => ({
      startDate: startOfMonth(new Date()),
      endDate: endOfMonth(new Date()),
    }),
  },
  {
    label: 'Last Month',
    getValue: () => {
      const lastMonth = subDays(startOfMonth(new Date()), 1);
      return {
        startDate: startOfMonth(lastMonth),
        endDate: endOfMonth(lastMonth),
      };
    },
  },
];

// ============================================
// MAIN COMPONENT
// ============================================

export const ReportsPage: React.FC = () => {
  // State
  const [activeTab, setActiveTab] = useState<ReportType>('daily-production');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });

  // Handle date range change
  const handleDateRangeChange = useCallback((startDate: Date, endDate: Date) => {
    setFilters((prev) => ({
      ...prev,
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
    }));
  }, []);

  // Handle preset selection
  const handlePresetSelect = useCallback(
    (preset: DatePreset) => {
      const { startDate, endDate } = preset.getValue();
      handleDateRangeChange(startDate, endDate);
    },
    [handleDateRangeChange]
  );

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: Partial<ReportFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    // Trigger re-fetch by updating filters with same values
    setFilters((prev) => ({ ...prev }));
    setTimeout(() => setIsRefreshing(false), 500);
  }, []);

  // Handle export
  const handleExport = useCallback(
    async (format: 'excel' | 'pdf' | 'csv') => {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const params = new URLSearchParams({
        startDate: filters.startDate,
        endDate: filters.endDate,
        format: format === 'excel' ? 'csv' : format,
      });

      if (filters.departmentId) params.append('departmentId', filters.departmentId);
      if (filters.workerId) params.append('workerId', filters.workerId);
      if (filters.status) params.append('status', filters.status);

      window.open(`${API_URL}/reports/export/${activeTab}?${params}`, '_blank');
    },
    [activeTab, filters]
  );

  // Handle print
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // Render active report content
  const renderReportContent = () => {
    switch (activeTab) {
      case 'daily-production':
        return <DailyProductionChart filters={filters} />;
      case 'department-efficiency':
        return <DepartmentEfficiencyChart filters={filters} />;
      case 'pending-orders':
        return <PendingOrdersReport filters={filters} />;
      case 'overdue-orders':
        return <OverdueOrdersReport filters={filters} />;
      case 'worker-performance':
        return <WorkerPerformanceReport filters={filters} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-500 mt-1">
            Monitor production, efficiency, and performance metrics
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 print:hidden">
          <button
            onClick={handleRefresh}
            className={cn(
              'p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors',
              isRefreshing && 'animate-spin'
            )}
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>

          <button
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className={cn(
              'p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors',
              isFiltersOpen && 'bg-indigo-50 border-indigo-300'
            )}
            title="Filters"
          >
            <Filter className="w-5 h-5 text-gray-600" />
          </button>

          {/* Export dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button
                onClick={() => handleExport('excel')}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
              >
                <FileSpreadsheet className="w-4 h-4 text-green-600" />
                Export to Excel
              </button>
              <button
                onClick={() => handleExport('csv')}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <FileText className="w-4 h-4 text-blue-600" />
                Export to CSV
              </button>
              <button
                onClick={() => handleExport('pdf')}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-b-lg"
              >
                <FileText className="w-4 h-4 text-red-600" />
                Export to PDF
              </button>
            </div>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Print</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <ReportSummaryCards filters={filters} />

      {/* Date Range Selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 print:hidden">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Date Presets */}
          <div className="flex items-center gap-2 overflow-x-auto">
            <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0" />
            {DATE_PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => handlePresetSelect(preset)}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100 whitespace-nowrap transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Custom Date Range */}
          <DateRangePicker
            startDate={new Date(filters.startDate)}
            endDate={new Date(filters.endDate)}
            onChange={handleDateRangeChange}
          />
        </div>
      </div>

      {/* Filters Panel */}
      {isFiltersOpen && (
        <ReportFiltersPanel
          filters={filters}
          onChange={handleFilterChange}
          onClose={() => setIsFiltersOpen(false)}
        />
      )}

      {/* Report Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 overflow-x-auto scrollbar-hide print:hidden">
          <nav className="flex -mb-px">
            {REPORT_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors',
                    isActive
                      ? 'border-indigo-500 text-indigo-600 bg-indigo-50/50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Tab Header (for print) */}
          <div className="hidden print:block mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {REPORT_TABS.find((t) => t.id === activeTab)?.label}
            </h2>
            <p className="text-sm text-gray-500">
              {format(new Date(filters.startDate), 'MMM d, yyyy')} -{' '}
              {format(new Date(filters.endDate), 'MMM d, yyyy')}
            </p>
          </div>

          {/* Report Content */}
          {renderReportContent()}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
