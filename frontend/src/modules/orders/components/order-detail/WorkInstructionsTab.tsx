/**
 * ============================================
 * WORK INSTRUCTIONS TAB
 * ============================================
 *
 * Displays department-specific work instructions including:
 * - Required form fields
 * - Required photos
 * - Required files
 * - Tips for success
 * - Common mistakes to avoid
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import React from 'react';
import {
  CheckCircleIcon,
  PhotoIcon,
  DocumentArrowUpIcon,
  LightBulbIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { getDepartmentRequirements } from '../../../../config/departmentRequirements';

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

interface WorkInstructionsTabProps {
  departmentName: string | null;
  currentDepartmentStatus?: string;
}

const WorkInstructionsTab: React.FC<WorkInstructionsTabProps> = ({
  departmentName,
  currentDepartmentStatus,
}) => {
  // If no department assigned, show placeholder
  if (!departmentName) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <InformationCircleIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Department</h3>
          <p className="text-gray-500">This order hasn't been assigned to a department yet.</p>
        </div>
      </div>
    );
  }

  // Get config ID from department name
  const configId = departmentNameToConfigId[departmentName];
  const requirements = configId ? getDepartmentRequirements(configId) : null;

  if (!requirements) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-16 h-16 mx-auto mb-4 text-amber-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Instructions Not Available</h3>
          <p className="text-gray-500">No instructions found for department: {departmentName}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-100">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <InformationCircleIcon className="w-7 h-7 text-indigo-600" />
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {requirements.departmentName} - Work Instructions
            </h2>
            <p className="text-gray-600 text-base">{requirements.description}</p>
            {requirements.estimatedTime && (
              <div className="mt-3 flex items-center gap-2 text-sm text-indigo-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="font-medium">Estimated Time: {requirements.estimatedTime}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Requirements Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Fields Required */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Form Fields</h3>
              <p className="text-sm text-gray-500">
                {requirements.formFields.filter((f) => f.required).length} required
              </p>
            </div>
          </div>
          <ul className="space-y-2">
            {requirements.formFields
              .filter((field) => field.required)
              .map((field, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <CheckCircleIcon className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-gray-900 font-medium">{field.label}</span>
                    {field.helpText && (
                      <p className="text-gray-500 text-xs mt-0.5">{field.helpText}</p>
                    )}
                  </div>
                </li>
              ))}
          </ul>
        </div>

        {/* Photo Requirements */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <PhotoIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Photos</h3>
              <p className="text-sm text-gray-500">
                {requirements.photoRequirements.filter((p) => p.required).length} required
              </p>
            </div>
          </div>
          <ul className="space-y-2">
            {requirements.photoRequirements
              .filter((photo) => photo.required)
              .map((photo, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <PhotoIcon className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-gray-900 font-medium">{photo.label}</span>
                    <p className="text-gray-500 text-xs mt-0.5">{photo.description}</p>
                  </div>
                </li>
              ))}
          </ul>
        </div>

        {/* File Requirements */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <DocumentArrowUpIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Files</h3>
              <p className="text-sm text-gray-500">
                {requirements.fileRequirements.filter((f) => f.required).length} required
              </p>
            </div>
          </div>
          <ul className="space-y-2">
            {requirements.fileRequirements
              .filter((file) => file.required)
              .map((file, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <DocumentArrowUpIcon className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-gray-900 font-medium">{file.label}</span>
                    <p className="text-gray-500 text-xs mt-0.5">{file.description}</p>
                    <p className="text-gray-400 text-xs mt-1">
                      Formats: {file.acceptedFormats.slice(0, 5).join(', ')}
                      {file.acceptedFormats.length > 5 && '...'}
                    </p>
                  </div>
                </li>
              ))}
          </ul>
        </div>
      </div>

      {/* Required Tools Section */}
      {requirements.requiredTools && requirements.requiredTools.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-5">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-amber-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Required Tools & Equipment
          </h3>
          <div className="flex flex-wrap gap-2">
            {requirements.requiredTools.map((tool, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-white border border-amber-300 text-amber-800"
              >
                {tool}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tips Section */}
      {requirements.tips && requirements.tips.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <LightBulbIcon className="w-5 h-5 text-green-600" />
            Tips for Success
          </h3>
          <ul className="space-y-2">
            {requirements.tips.map((tip, index) => (
              <li key={index} className="flex items-start gap-3 text-sm text-gray-700">
                <span className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-xs font-semibold text-green-700">
                  {index + 1}
                </span>
                <span className="pt-0.5">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Common Mistakes Section */}
      {requirements.commonMistakes && requirements.commonMistakes.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
            Common Mistakes to Avoid
          </h3>
          <ul className="space-y-2">
            {requirements.commonMistakes.map((mistake, index) => (
              <li key={index} className="flex items-start gap-3 text-sm text-gray-700">
                <span className="flex-shrink-0 w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                  <ExclamationTriangleIcon className="w-4 h-4 text-red-600" />
                </span>
                <span className="pt-0.5">{mistake}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Status Footer */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <InformationCircleIcon className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-600">
            Current Status:{' '}
            <span className="font-medium text-gray-900">
              {currentDepartmentStatus || 'Not Started'}
            </span>
          </span>
        </div>
        <span className="text-xs text-gray-500">Department: {requirements.departmentName}</span>
      </div>
    </div>
  );
};

export default WorkInstructionsTab;
