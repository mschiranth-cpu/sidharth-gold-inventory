/**
 * ============================================
 * REPORT SUMMARY CARDS
 * ============================================
 *
 * Summary statistics cards for the reports page.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import React, { useEffect, useState } from 'react';
import { Package, CheckCircle, Clock, AlertTriangle, Timer, Scale } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { ReportFilters, ReportSummary } from '../../../types/report.types';
import { getAccessToken } from '../../../services/auth.service';

interface ReportSummaryCardsProps {
  filters: ReportFilters;
}

interface SummaryCard {
  id: string;
  label: string;
  value: string | number;
  icon: React.FC<{ className?: string }>;
  color: string;
  bgColor: string;
  change?: number;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const ReportSummaryCards: React.FC<ReportSummaryCardsProps> = ({ filters }) => {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setIsLoading(true);
        const token = getAccessToken();
        const params = new URLSearchParams({
          startDate: filters.startDate,
          endDate: filters.endDate,
        });

        const response = await fetch(`${API_URL}/reports/summary?${params}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setSummary(data.data);
        }
      } catch (error) {
        console.error('Error fetching report summary:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummary();
  }, [filters]);

  const cards: SummaryCard[] = summary
    ? [
        {
          id: 'total',
          label: 'Total Orders',
          value: summary.totalOrders,
          icon: Package,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
        },
        {
          id: 'completed',
          label: 'Completed',
          value: summary.completedOrders,
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
        },
        {
          id: 'inFactory',
          label: 'In Factory',
          value: summary.ordersInFactory,
          icon: Clock,
          color: 'text-indigo-600',
          bgColor: 'bg-indigo-100',
        },
        {
          id: 'overdue',
          label: 'Overdue',
          value: summary.overdueOrders,
          icon: AlertTriangle,
          color: 'text-red-600',
          bgColor: 'bg-red-100',
        },
        {
          id: 'recentlyCompleted',
          label: 'Completed (30d)',
          value: summary.recentlyCompleted,
          icon: Timer,
          color: 'text-purple-600',
          bgColor: 'bg-purple-100',
        },
        {
          id: 'departments',
          label: 'Active Depts',
          value: summary.departmentSummary?.filter((d) => d.active > 0).length || 0,
          icon: Scale,
          color: 'text-indigo-600',
          bgColor: 'bg-indigo-100',
        },
      ]
    : [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse overflow-hidden"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-200 rounded-xl" />
              <div className="flex-1">
                <div className="h-3 bg-gray-200 rounded w-16 mb-2" />
                <div className="h-7 bg-gray-200 rounded w-14" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Enhanced color mappings for cards
  const cardStyles: Record<
    string,
    { gradient: string; orb: string; shadow: string; borderHover: string }
  > = {
    'text-blue-600': {
      gradient: 'from-blue-500 to-cyan-600',
      orb: 'from-blue-100 to-cyan-100',
      shadow: 'shadow-blue-500/30',
      borderHover: 'hover:border-blue-200',
    },
    'text-green-600': {
      gradient: 'from-emerald-500 to-green-600',
      orb: 'from-emerald-100 to-green-100',
      shadow: 'shadow-emerald-500/30',
      borderHover: 'hover:border-emerald-200',
    },
    'text-indigo-600': {
      gradient: 'from-indigo-500 to-purple-600',
      orb: 'from-indigo-100 to-purple-100',
      shadow: 'shadow-indigo-500/30',
      borderHover: 'hover:border-indigo-200',
    },
    'text-red-600': {
      gradient: 'from-red-500 to-rose-600',
      orb: 'from-red-100 to-rose-100',
      shadow: 'shadow-red-500/30',
      borderHover: 'hover:border-red-200',
    },
    'text-purple-600': {
      gradient: 'from-purple-500 to-violet-600',
      orb: 'from-purple-100 to-violet-100',
      shadow: 'shadow-purple-500/30',
      borderHover: 'hover:border-purple-200',
    },
  };

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 print:grid-cols-6">
      {cards.map((card) => {
        const Icon = card.icon;
        const styles = cardStyles[card.color] || cardStyles['text-indigo-600'];

        return (
          <div
            key={card.id}
            className={cn(
              'group relative bg-white rounded-2xl border border-gray-100 p-5 transition-all duration-300 overflow-hidden',
              styles?.borderHover,
              'hover:shadow-lg'
            )}
          >
            <div
              className={cn(
                'absolute top-0 right-0 w-20 h-20 bg-gradient-to-br rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-300',
                styles?.orb
              )}
            />
            <div className="relative">
              <div className="flex items-center gap-3 mb-2">
                <div
                  className={cn(
                    'p-2.5 bg-gradient-to-br rounded-xl shadow-lg',
                    styles?.gradient,
                    styles?.shadow
                  )}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-xs text-gray-500 font-medium mb-1">{card.label}</p>
              <p
                className={cn(
                  'text-2xl font-bold',
                  card.color === 'text-blue-600' || card.color === 'text-green-600'
                    ? 'text-gray-900'
                    : card.color
                )}
              >
                {card.value}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ReportSummaryCards;
