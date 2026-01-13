/**
 * ============================================
 * DEPARTMENTS PAGE
 * ============================================
 *
 * Displays factory departments and their current workload.
 * Departments are fixed in the system (from DepartmentName enum).
 *
 * @author Gold Factory Dev Team
 * @version 2.0.0
 */

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DEPARTMENTS, DEPARTMENT_LABELS, type DepartmentName } from '../../../types/user.types';
import { ordersService } from '../../orders/services';
import {
  CubeIcon,
  PrinterIcon,
  FireIcon,
  WrenchScrewdriverIcon,
  SparklesIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

// Department icons and colors mapping
const DEPARTMENT_CONFIG: Record<
  DepartmentName,
  {
    icon: typeof CubeIcon;
    gradient: string;
    description: string;
  }
> = {
  CAD: {
    icon: CubeIcon,
    gradient: 'from-blue-400 to-blue-600',
    description:
      'Transform design concepts into precise 3D models using advanced CAD software. Create detailed blueprints and specifications for jewelry manufacturing.',
  },
  PRINT: {
    icon: PrinterIcon,
    gradient: 'from-purple-400 to-purple-600',
    description:
      'Convert 3D designs into physical wax or resin prototypes using high-resolution printers. Essential for casting preparation and design verification.',
  },
  CASTING: {
    icon: FireIcon,
    gradient: 'from-orange-400 to-red-500',
    description:
      'Transform printed molds into precious metal jewelry through precision lost-wax casting. Expert temperature control ensures flawless metal flow.',
  },
  FILLING: {
    icon: WrenchScrewdriverIcon,
    gradient: 'from-emerald-400 to-emerald-600',
    description:
      'Refine cast pieces by filling imperfections, adjusting dimensions, and shaping the jewelry to exact specifications.',
  },
  MEENA: {
    icon: SparklesIcon,
    gradient: 'from-pink-400 to-pink-600',
    description:
      'Apply traditional Indian enamel artistry using vibrant colored glass. Master craftsmen create intricate patterns through multiple firing cycles.',
  },
  POLISH_1: {
    icon: SparklesIcon,
    gradient: 'from-indigo-400 to-indigo-600',
    description:
      'Initial polishing stage to remove casting marks and surface imperfections. Prepare the piece for stone setting or meena work.',
  },
  SETTING: {
    icon: WrenchScrewdriverIcon,
    gradient: 'from-cyan-400 to-cyan-600',
    description:
      'Precisely mount diamonds, gemstones, and precious stones into prepared settings. Ensure secure placement with perfect alignment.',
  },
  POLISH_2: {
    icon: SparklesIcon,
    gradient: 'from-teal-400 to-teal-600',
    description:
      'Final high-shine polishing to achieve mirror finish. Quality inspection ensures every piece meets luxury standards.',
  },
  ADDITIONAL: {
    icon: WrenchScrewdriverIcon,
    gradient: 'from-amber-400 to-amber-600',
    description:
      'Special finishing touches including rhodium plating, hallmarking, engraving, and final quality assurance before dispatch.',
  },
};

// Department workflow order
const DEPARTMENT_ORDER = DEPARTMENTS.map((dept, index) => ({
  name: dept,
  order: index + 1,
}));

const DepartmentsPage: React.FC = () => {
  const navigate = useNavigate();

  // Fetch orders to calculate department workload
  // Backend limits to max 100 per request
  const { data: ordersResponse, isLoading } = useQuery({
    queryKey: ['orders', 'in-factory'],
    queryFn: () =>
      ordersService.getAll({
        page: 1,
        limit: 100,
        filters: { status: 'IN_FACTORY' },
      }),
    refetchInterval: 30000,
  });

  // Calculate workload per department
  const departmentStats = useMemo(() => {
    const stats: Record<
      DepartmentName,
      {
        inProgress: number;
        pending: number;
        completed: number;
        totalOrders: number;
      }
    > = {} as Record<
      DepartmentName,
      { inProgress: number; pending: number; completed: number; totalOrders: number }
    >;

    DEPARTMENTS.forEach((dept) => {
      stats[dept] = { inProgress: 0, pending: 0, completed: 0, totalOrders: 0 };
    });

    if (ordersResponse?.data) {
      ordersResponse.data.forEach((order: { currentDepartment?: string }) => {
        const currentDept = order.currentDepartment as DepartmentName;
        if (currentDept && stats[currentDept]) {
          stats[currentDept].inProgress++;
          stats[currentDept].totalOrders++;
        }
      });
    }

    return stats;
  }, [ordersResponse?.data]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
          <p className="text-gray-500 mt-1">Factory department workflow</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm animate-pulse">
              <div className="h-12 w-12 bg-gray-200 rounded-xl mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-2/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
        <p className="text-gray-500 mt-1">
          Factory department workflow - {DEPARTMENTS.length} departments
        </p>
      </div>

      {/* Department Workflow Indicator */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <h3 className="text-sm font-medium text-gray-500 mb-3">Production Flow</h3>
        <div className="flex flex-wrap items-center gap-x-1 gap-y-2">
          {DEPARTMENT_ORDER.map((dept, index) => (
            <React.Fragment key={dept.name}>
              <div className="flex items-center gap-1.5">
                <div
                  className={`w-6 h-6 rounded-md bg-gradient-to-r ${
                    DEPARTMENT_CONFIG[dept.name].gradient
                  } flex items-center justify-center text-white text-[10px] font-bold shadow-sm`}
                >
                  {dept.order}
                </div>
                <span className="text-xs font-medium text-gray-700">
                  {DEPARTMENT_LABELS[dept.name]}
                </span>
              </div>
              {index < DEPARTMENT_ORDER.length - 1 && (
                <svg
                  className="w-3 h-3 text-gray-300 mx-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {DEPARTMENTS.map((deptName, index) => {
          const config = DEPARTMENT_CONFIG[deptName];
          const stats = departmentStats[deptName];
          const Icon = config.icon;

          return (
            <div
              key={deptName}
              className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {DEPARTMENT_LABELS[deptName]}
                    </h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      Step {index + 1}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-4">{config.description}</p>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-4 h-4 text-indigo-500" />
                  <span className="text-sm text-gray-600">
                    <span className="font-semibold text-gray-900">{stats.inProgress}</span> in
                    progress
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-600">
                    <span className="font-semibold text-gray-900">{stats.totalOrders}</span> total
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              {stats.totalOrders > 0 && (
                <div className="mt-3">
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${config.gradient} rounded-full transition-all duration-500`}
                      style={{
                        width: `${Math.min(
                          100,
                          (stats.inProgress / Math.max(1, stats.totalOrders)) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => navigate(`/factory?department=${deptName}`)}
                  className="text-indigo-600 hover:text-indigo-700 text-sm font-medium transition-colors"
                >
                  View Orders →
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-indigo-50 rounded-xl">
            <div className="text-3xl font-bold text-indigo-600">{DEPARTMENTS.length}</div>
            <div className="text-sm text-gray-600">Total Departments</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-xl">
            <div className="text-3xl font-bold text-blue-600">
              {Object.values(departmentStats).reduce((sum, s) => sum + s.inProgress, 0)}
            </div>
            <div className="text-sm text-gray-600">Orders In Progress</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-xl">
            <div className="text-3xl font-bold text-green-600">
              {ordersResponse?.data?.length || 0}
            </div>
            <div className="text-sm text-gray-600">Active Orders</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-xl">
            <div className="text-3xl font-bold text-purple-600">{DEPARTMENT_ORDER.length}</div>
            <div className="text-sm text-gray-600">Workflow Steps</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentsPage;
