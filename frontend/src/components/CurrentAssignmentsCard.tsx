/**
 * ============================================
 * CURRENT ASSIGNMENTS CARD COMPONENT
 * ============================================
 *
 * Compact assignment card with accordion checklist
 * Displays progress in header with expandable details
 *
 * @author Gold Factory Dev Team
 * @version 2.0.0
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { format, parseISO, differenceInHours } from 'date-fns';
import { getDepartmentRequirements } from '../config/departmentRequirements';
import { workersService } from '../services/workers.service';
import { withErrorBoundary } from './common';

// Mapping from backend DepartmentName enum to frontend config IDs
const departmentNameToConfigId: Record<string, string> = {
  CAD: 'CAD_DESIGN',
  PRINT: '3D_PRINTING',
  CASTING: 'CASTING',
  FILLING: 'FILLING_SHAPING',
  MEENA: 'MEENA_WORK',
  POLISH_1: 'PRIMARY_POLISH',
  SETTING: 'STONE_SETTING',
  POLISH_2: 'FINAL_POLISH',
  ADDITIONAL: 'FINISHING_TOUCH',
};

interface CurrentAssignmentsCardProps {
  order: {
    id: string;
    orderNumber: string;
    // customerName intentionally removed - workers should not see customer info for privacy
    productPhotoUrl?: string;
    productType?: string;
    priority: number;
    dueDate?: string;
    departmentTracking?: {
      departmentName: string;
      status: string;
      startedAt?: string;
      workData?: {
        formData?: Record<string, any>;
        uploadedPhotos?: any[];
        uploadedFiles?: any[];
        isComplete?: boolean;
      };
    }[];
  };
  userDepartment: string;
}

export const CurrentAssignmentsCard: React.FC<CurrentAssignmentsCardProps> = ({
  order,
  userDepartment,
}) => {
  const navigate = useNavigate();

  // Get department tracking for user's department
  const departmentTracking = order.departmentTracking?.find(
    (dt) => dt.departmentName === userDepartment
  );

  if (!departmentTracking) {
    console.log('No department tracking found for:', userDepartment, 'Order:', order.orderNumber);
    return null;
  }

  // Get department requirements
  // Map backend department name to frontend config ID
  const configId = departmentNameToConfigId[departmentTracking.departmentName];
  const requirements = configId ? getDepartmentRequirements(configId) : null;

  if (!requirements) {
    console.log(
      'No requirements found for department:',
      departmentTracking.departmentName,
      'Config ID:',
      configId
    );
  }

  const workData = departmentTracking.workData;
  const isStarted = departmentTracking.status === 'IN_PROGRESS';
  const isNotStarted = departmentTracking.status === 'NOT_STARTED';

  // Calculate completion progress - handle when requirements is undefined
  const requiredFields = requirements?.formFields?.filter((f) => f.required) || [];
  const completedFields =
    requiredFields.filter((f) => {
      const value = workData?.formData?.[f.name];
      return value !== undefined && value !== null && value !== '';
    }).length || 0;

  // Calculate required photos directly from requirements object
  const requiredPhotos =
    requirements?.photoRequirements
      ?.filter((photo) => photo.required)
      .reduce((sum, photo) => sum + (photo.minCount || 1), 0) || 0;

  // Count only photos in REQUIRED categories (not optional ones)
  const uploadedPhotosInRequiredCategories =
    requirements?.photoRequirements
      ?.filter((photo) => photo.required)
      .reduce((sum, photoReq) => {
        const categoryPhotos =
          workData?.uploadedPhotos?.filter((p: any) => p.category === photoReq.name) || [];
        return sum + categoryPhotos.length;
      }, 0) || 0;

  // Check if all required photo categories have minimum uploads
  const areRequiredPhotosUploaded =
    requirements?.photoRequirements
      ?.filter((photo) => photo.required)
      .every((photoReq) => {
        const categoryPhotos =
          workData?.uploadedPhotos?.filter((p: any) => p.category === photoReq.name) || [];
        return categoryPhotos.length >= (photoReq.minCount || 1);
      }) ?? false;

  // Calculate required files directly from requirements object
  const requiredFiles = requirements?.fileRequirements?.filter((file) => file.required).length || 0;

  // Count only files in REQUIRED categories
  const uploadedFilesInRequiredCategories =
    requirements?.fileRequirements
      ?.filter((file) => file.required)
      .reduce((sum, fileReq) => {
        const categoryFiles =
          workData?.uploadedFiles?.filter((f: any) => f.category === fileReq.name) || [];
        return sum + categoryFiles.length;
      }, 0) || 0;

  // Check if all required file categories have uploads
  const areRequiredFilesUploaded =
    requirements?.fileRequirements
      ?.filter((file) => file.required)
      .every((fileReq) => {
        const categoryFiles =
          workData?.uploadedFiles?.filter((f: any) => f.category === fileReq.name) || [];
        return categoryFiles.length > 0;
      }) ?? false;

  // Count as 3 categories (fields, photos, files) not individual items
  const totalRequirements =
    (requiredFields.length > 0 ? 1 : 0) +
    (requiredPhotos > 0 ? 1 : 0) +
    (requiredFiles > 0 ? 1 : 0);
  const completedRequirements =
    (requiredFields.length > 0 && completedFields === requiredFields.length ? 1 : 0) +
    (requiredPhotos > 0 && areRequiredPhotosUploaded ? 1 : 0) +
    (requiredFiles > 0 && areRequiredFilesUploaded ? 1 : 0);

  const completionPercentage =
    totalRequirements > 0 ? Math.round((completedRequirements / totalRequirements) * 100) : 0;

  // Calculate time in progress
  const timeInProgress = departmentTracking.startedAt
    ? differenceInHours(new Date(), parseISO(departmentTracking.startedAt))
    : 0;

  const getTimeLabel = () => {
    if (!isStarted) return null;
    if (timeInProgress < 1) return 'Just started';
    if (timeInProgress < 24) return `${timeInProgress}h ago`;
    const days = Math.floor(timeInProgress / 24);
    return `${days}d ${timeInProgress % 24}h ago`;
  };

  const queryClient = useQueryClient();

  // Start work mutation
  const startWorkMutation = useMutation({
    mutationFn: async () => {
      return await workersService.startWork(order.id);
    },
    onSuccess: () => {
      toast.success('Work started successfully!');
      queryClient.invalidateQueries({ queryKey: ['my-work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['orderWork', order.id] });
      navigate(`/orders/${order.id}/work`);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to start work');
    },
  });

  const handleStartWork = () => {
    // Confirm before starting
    if (
      window.confirm(
        `Start work on order ${order.orderNumber}?\n\nThis will record your work start time and update the status to "In Progress".`
      )
    ) {
      startWorkMutation.mutate();
    }
  };

  const handleContinueWork = () => {
    navigate(`/orders/${order.id}/work`);
  };

  const handleViewDetails = () => {
    navigate(`/orders/${order.id}`);
  };

  // State for accordion
  const [isExpanded, setIsExpanded] = useState(false);

  // Progress bar color based on completion
  const getProgressColor = () => {
    if (completionPercentage === 100) return 'bg-green-500';
    if (completionPercentage >= 50) return 'bg-blue-500';
    return 'bg-amber-500';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Compact Header - All in one row */}
      <div className="p-3 sm:p-4">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Product Image - Smaller */}
          {order.productPhotoUrl ? (
            <img
              src={order.productPhotoUrl}
              alt={order.orderNumber}
              className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-lg border border-gray-200 flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg border border-gray-200 flex items-center justify-center flex-shrink-0">
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}

          {/* Order Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                {order.orderNumber}
              </h3>
              {order.priority === 3 && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Urgent
                </span>
              )}
              {isStarted && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  In Progress
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
              {order.productType && (
                <>
                  <span className="font-medium text-gray-700">{order.productType}</span>
                  <span>•</span>
                </>
              )}
              {order.dueDate && <span>Due: {format(parseISO(order.dueDate), 'MMM d')}</span>}
              {getTimeLabel() && (
                <>
                  <span>•</span>
                  <span>{getTimeLabel()}</span>
                </>
              )}
            </div>
          </div>

          {/* Progress Bar (compact) */}
          <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
            <div className="w-20 bg-gray-200 rounded-full h-1.5">
              <div
                className={`${getProgressColor()} h-1.5 rounded-full transition-all duration-300`}
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <span
              className={`text-xs font-semibold min-w-[32px] ${
                completionPercentage === 100 ? 'text-green-600' : 'text-gray-600'
              }`}
            >
              {completionPercentage}%
            </span>
          </div>

          {/* Expand/Collapse Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
          >
            <svg
              className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-500 transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {isNotStarted && (
              <button
                onClick={handleStartWork}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-sm"
              >
                <svg
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="hidden sm:inline">Start Work</span>
                <span className="sm:hidden">Start</span>
              </button>
            )}

            {isStarted && (
              <button
                onClick={handleContinueWork}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all shadow-sm"
              >
                <svg
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4"
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
                <span className="hidden sm:inline">Continue</span>
                <span className="sm:hidden">Edit</span>
              </button>
            )}

            <button
              onClick={handleViewDetails}
              className="px-3 py-1.5 sm:px-4 sm:py-2 text-gray-600 text-xs sm:text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="hidden sm:inline">View Details</span>
              <span className="sm:hidden">View</span>
            </button>
          </div>
        </div>

        {/* Mobile Progress Bar */}
        <div className="sm:hidden mt-3 flex items-center gap-2">
          <div className="flex-1 bg-gray-200 rounded-full h-1.5">
            <div
              className={`${getProgressColor()} h-1.5 rounded-full transition-all duration-300`}
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <span
            className={`text-xs font-semibold ${
              completionPercentage === 100 ? 'text-green-600' : 'text-gray-600'
            }`}
          >
            {completionPercentage}%
          </span>
        </div>
      </div>

      {/* Expandable Checklist Section */}
      {isExpanded && (
        <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-0 border-t border-gray-100 bg-gray-50">
          <div className="pt-3 sm:pt-4">
            {/* Quick Stats Row */}
            <div className="flex flex-wrap gap-2 sm:gap-4 mb-3">
              {requiredFields.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      completedFields === requiredFields.length ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    {completedFields === requiredFields.length && (
                      <svg
                        className="w-2.5 h-2.5 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="text-xs sm:text-sm text-gray-700">
                    Fields:{' '}
                    <span className="font-medium">
                      {completedFields}/{requiredFields.length}
                    </span>
                  </span>
                </div>
              )}

              {requiredPhotos > 0 && (
                <div className="flex items-center gap-1.5">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      areRequiredPhotosUploaded ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    {areRequiredPhotosUploaded && (
                      <svg
                        className="w-2.5 h-2.5 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="text-xs sm:text-sm text-gray-700">
                    Photos:{' '}
                    <span className="font-medium">
                      {uploadedPhotosInRequiredCategories}/{requiredPhotos}
                    </span>
                  </span>
                </div>
              )}

              {requiredFiles > 0 && (
                <div className="flex items-center gap-1.5">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      areRequiredFilesUploaded ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    {areRequiredFilesUploaded && (
                      <svg
                        className="w-2.5 h-2.5 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="text-xs sm:text-sm text-gray-700">
                    Files:{' '}
                    <span className="font-medium">
                      {uploadedFilesInRequiredCategories}/{requiredFiles}
                    </span>
                  </span>
                </div>
              )}
            </div>

            {/* Detailed Checklist */}
            <div className="space-y-2">
              {requiredFields.length > 0 && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-gray-200">
                  <div
                    className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      completedFields === requiredFields.length
                        ? 'bg-green-500 border-green-500'
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    {completedFields === requiredFields.length && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">Fill Required Fields</p>
                    <p className="text-xs text-gray-500">
                      {completedFields} of {requiredFields.length} fields completed
                    </p>
                  </div>
                </div>
              )}

              {requiredPhotos > 0 && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-gray-200">
                  <div
                    className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      areRequiredPhotosUploaded
                        ? 'bg-green-500 border-green-500'
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    {areRequiredPhotosUploaded && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">Upload Photos</p>
                    <p className="text-xs text-gray-500">
                      {areRequiredPhotosUploaded
                        ? `${requiredPhotos} required photos uploaded`
                        : `${uploadedPhotosInRequiredCategories} of ${requiredPhotos} photos uploaded`}
                    </p>
                  </div>
                </div>
              )}

              {requiredFiles > 0 && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-gray-200">
                  <div
                    className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      areRequiredFilesUploaded
                        ? 'bg-green-500 border-green-500'
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    {areRequiredFilesUploaded && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">Upload Files</p>
                    <p className="text-xs text-gray-500">
                      {areRequiredFilesUploaded
                        ? `${requiredFiles} required files uploaded`
                        : `${uploadedFilesInRequiredCategories} of ${requiredFiles} files uploaded`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Wrap with Error Boundary HOC
export default withErrorBoundary(
  CurrentAssignmentsCard,
  <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
    <p className="text-sm text-gray-500">Unable to load assignment</p>
  </div>
);
