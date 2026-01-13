/**
 * DepartmentFeatureToggle.tsx
 *
 * Admin component to enable/disable department features.
 * Allows admins to toggle "Coming Soon" features on/off.
 */

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import {
  getDepartmentFeatureFlags,
  toggleDepartment,
  resetFeatureFlags,
} from '../../config/departmentFeatureFlags';
import { DEPARTMENT_REQUIREMENTS } from '../../config/departmentRequirements';

export const DepartmentFeatureToggle: React.FC = () => {
  const [featureFlags, setFeatureFlags] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Load initial feature flags
    setFeatureFlags(getDepartmentFeatureFlags());

    // Listen for changes from other components/tabs
    const handleFlagsChanged = (event: CustomEvent) => {
      setFeatureFlags(event.detail);
    };

    window.addEventListener('departmentFlagsChanged', handleFlagsChanged as EventListener);
    return () => {
      window.removeEventListener('departmentFlagsChanged', handleFlagsChanged as EventListener);
    };
  }, []);

  const handleToggle = (departmentId: string, departmentName: string) => {
    const newState = toggleDepartment(departmentId);
    setFeatureFlags(getDepartmentFeatureFlags());

    toast.success(`${departmentName} ${newState ? 'enabled' : 'disabled'}`, { duration: 3000 });
  };

  const handleReset = () => {
    if (window.confirm('Reset all department features to defaults?')) {
      resetFeatureFlags();
      setFeatureFlags(getDepartmentFeatureFlags());
      toast.success('Feature flags reset to defaults');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Department Features</h2>
          <p className="text-sm text-gray-600 mt-1">
            Enable or disable advanced department features. When disabled, departments use
            simplified workflows.
          </p>
        </div>
        <button
          onClick={handleReset}
          className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Reset to Defaults
        </button>
      </div>

      <div className="space-y-3">
        {Object.entries(DEPARTMENT_REQUIREMENTS).map(([id, dept]) => {
          const isEnabled = featureFlags[id] ?? true;
          const hasComingSoonFlag = dept.isComingSoon;

          return (
            <div
              key={id}
              className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                isEnabled ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="flex-shrink-0">
                  {isEnabled ? (
                    <CheckCircleIcon className="w-6 h-6 text-green-600" />
                  ) : (
                    <XCircleIcon className="w-6 h-6 text-gray-400" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900">{dept.departmentName}</h3>
                    {hasComingSoonFlag && !isEnabled && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                        <ClockIcon className="w-3 h-3" />
                        Coming Soon
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">{dept.description}</p>
                  {dept.comingSoonMessage && !isEnabled && (
                    <p className="text-xs text-gray-500 mt-1 italic">"{dept.comingSoonMessage}"</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`text-sm font-medium ${
                    isEnabled ? 'text-green-700' : 'text-gray-500'
                  }`}
                >
                  {isEnabled ? 'Enabled' : 'Disabled'}
                </span>

                <button
                  onClick={() => handleToggle(id, dept.departmentName)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    isEnabled ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="text-sm font-medium text-blue-900 mb-2">How it works:</h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Enabled departments show advanced features (e.g., in-house printing settings)</li>
          <li>Disabled departments use simplified workflows (e.g., outsourcing forms)</li>
          <li>Workers can always submit work - the toggle only affects which fields are shown</li>
          <li>Changes take effect immediately for all users</li>
          <li>Settings are stored locally in the browser</li>
        </ul>
      </div>
    </div>
  );
};
