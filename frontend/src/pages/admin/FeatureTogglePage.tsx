/**
 * ============================================
 * FEATURE TOGGLE ADMIN PAGE
 * ============================================
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllFeatures, updateFeaturePermission } from '../../services/features.service';
import { UserRole } from '../../types/auth.types';

export default function FeatureTogglePage() {
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<string>('ADMIN');

  const {
    data: features = [],
    isLoading,
    error,
    isError,
  } = useQuery({
    queryKey: ['features'],
    queryFn: getAllFeatures,
  });

  // Debug logging
  useEffect(() => {
    console.log('🔍 Feature Toggle Debug:', {
      isLoading,
      isError,
      error,
      featuresCount: features?.length,
      features,
    });
  }, [isLoading, isError, error, features]);

  const updatePermissionMutation = useMutation({
    mutationFn: updateFeaturePermission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['features'] });
    },
  });

  const handleToggle = (featureId: string, currentEnabled: boolean) => {
    updatePermissionMutation.mutate({
      featureId,
      role: selectedRole,
      isEnabled: !currentEnabled,
      canRead: true,
      canWrite: selectedRole === 'ADMIN',
      canDelete: selectedRole === 'ADMIN',
    });
  };

  const getRolePermission = (feature: any, role: string) => {
    return feature.permissions?.find((p: any) => p.role === role);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="ml-4 text-gray-600">Loading features...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-bold">Error Loading Features</h2>
          <p className="text-red-600 mt-2">{error?.message || 'Unknown error'}</p>
          <pre className="mt-2 text-xs text-red-500 overflow-auto">
            {JSON.stringify(error, null, 2)}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Feature Toggle Management</h1>
          <p className="text-gray-600">Control which modules are accessible to different roles</p>
          <div className="mt-2 text-sm text-gray-500">Debug: {features.length} features loaded</div>
        </div>

        {/* Debug Warning */}
        {features.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="text-yellow-800 font-bold">⚠️ No Features Found</h3>
            <p className="text-yellow-700 mt-2">
              Database appears empty. Run:{' '}
              <code className="bg-yellow-100 px-2 py-1 rounded">
                cd backend && npx ts-node scripts/seed-modules.ts
              </code>
            </p>
          </div>
        )}

        {/* Role Selector */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Role</h3>
          <div className="flex gap-3 flex-wrap">
            {Object.keys(UserRole).map((role) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
                  selectedRole === role
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {role.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Features List */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
            <h3 className="text-lg font-semibold text-gray-900">
              Features for {selectedRole.replace('_', ' ')} ({features.length})
            </h3>
          </div>

          <div className="divide-y divide-gray-200">
            {features.map((feature) => {
              const permission = getRolePermission(feature, selectedRole);
              const isEnabled = permission?.isEnabled || false;

              return (
                <div key={feature.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      {/* Icon */}
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          isEnabled ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                          />
                        </svg>
                      </div>

                      {/* Feature Info */}
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 text-lg">
                          {feature.displayName}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {feature.description || 'No description'}
                        </p>
                      </div>
                    </div>

                    {/* Toggle Switch */}
                    <button
                      onClick={() => handleToggle(feature.id, isEnabled)}
                      disabled={updatePermissionMutation.isPending}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                        isEnabled ? 'bg-indigo-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${
                          isEnabled ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Permissions Details */}
                  {isEnabled && permission && (
                    <div className="mt-4 ml-16 flex gap-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-lg ${
                          permission.canRead
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {permission.canRead ? '✓' : '✗'} Read
                      </span>
                      <span
                        className={`px-3 py-1 rounded-lg ${
                          permission.canWrite
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {permission.canWrite ? '✓' : '✗'} Write
                      </span>
                      <span
                        className={`px-3 py-1 rounded-lg ${
                          permission.canDelete
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {permission.canDelete ? '✓' : '✗'} Delete
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
