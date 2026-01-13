/**
 * ============================================
 * REPORT FILTERS PANEL
 * ============================================
 *
 * Filter panel for reports with department,
 * worker, and status selection.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import React, { useEffect, useState } from 'react';
import { X, Building2, User, Tag } from 'lucide-react';
import type { ReportFilters } from '../../../types/report.types';
import { getAccessToken } from '../../../services/auth.service';

interface ReportFiltersPanelProps {
  filters: ReportFilters;
  onChange: (filters: Partial<ReportFilters>) => void;
  onClose: () => void;
}

interface Department {
  id: string;
  name: string;
}

interface Worker {
  id: string;
  name: string;
  department?: string;
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const ReportFiltersPanel: React.FC<ReportFiltersPanelProps> = ({
  filters,
  onChange,
  onClose,
}) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        setIsLoading(true);
        const token = getAccessToken();

        // Fetch departments and workers in parallel
        const [deptResponse, workersResponse] = await Promise.all([
          fetch(`${API_URL}/factory/departments`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/users?role=DEPARTMENT_WORKER`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (deptResponse.ok) {
          const deptData = await deptResponse.json();
          setDepartments(deptData.data || deptData);
        }

        if (workersResponse.ok) {
          const workersData = await workersResponse.json();
          setWorkers(workersData.data || workersData);
        }
      } catch (error) {
        console.error('Error fetching filter data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFilterData();
  }, []);

  const handleClear = () => {
    onChange({
      departmentId: undefined,
      workerId: undefined,
      status: undefined,
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Filters</h3>
        <div className="flex items-center gap-2">
          <button onClick={handleClear} className="text-sm text-gray-500 hover:text-gray-700">
            Clear all
          </button>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Department Filter */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Building2 className="w-4 h-4" />
              Department
            </label>
            <select
              value={filters.departmentId || ''}
              onChange={(e) => onChange({ departmentId: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          {/* Worker Filter */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4" />
              Worker
            </label>
            <select
              value={filters.workerId || ''}
              onChange={(e) => onChange({ workerId: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Workers</option>
              {workers.map((worker) => (
                <option key={worker.id} value={worker.id}>
                  {worker.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Tag className="w-4 h-4" />
              Status
            </label>
            <select
              value={filters.status || ''}
              onChange={(e) => onChange({ status: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportFiltersPanel;
