/**
 * ============================================
 * PROFILE PAGE
 * ============================================
 *
 * User profile page for viewing and editing personal information
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  UserCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon,
  PencilIcon,
  XMarkIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { USER_ROLE_LABELS, USER_ROLE_COLORS } from '../../types/auth.types';
import { DEPARTMENT_LABELS } from '../../types/user.types';
import { cn } from '../../lib/utils';
import { usersService } from '../../modules/users/services';
import AlertDialog from '../../components/common/AlertDialog';

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });
  const [alertDialog, setAlertDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    variant: 'info' as 'info' | 'success' | 'warning' | 'error',
  });

  const handleEdit = () => {
    setFormData({
      name: user?.name || '',
      phone: user?.phone || '',
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      name: user?.name || '',
      phone: user?.phone || '',
    });
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await usersService.update(user.id, {
        name: formData.name,
        phone: formData.phone,
      });

      if (response.success && response.data) {
        // Update the user in auth context
        updateUser(response.data);
        setIsEditing(false);
        setAlertDialog({
          isOpen: true,
          title: 'Success',
          message: 'Profile updated successfully',
          variant: 'success',
        });
      }
    } catch (err: any) {
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: err.response?.data?.message || 'Failed to update profile',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Your Profile</h1>
        <p className="mt-1 text-gray-500">View and manage your account information</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {/* Cover Section with Profile Info */}
        <div className="h-36 bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-t-xl relative px-6">
          <div className="absolute inset-x-6 bottom-0 transform translate-y-1/2 flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Avatar */}
              <div className="h-32 w-32 rounded-full bg-white p-2 shadow-lg flex-shrink-0">
                <div className="h-full w-full rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-4xl font-bold">
                  {user.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
              </div>
              {/* Name & Title in Yellow Section */}
              <div className="text-center sm:text-left -mt-16 sm:-mt-8">
                <h2 className="text-2xl font-bold text-white drop-shadow-lg">{user.name}</h2>
                <span
                  className={cn(
                    'inline-block mt-2 px-3 py-1 text-sm font-medium rounded-full bg-white/90 backdrop-blur-sm',
                    USER_ROLE_COLORS[user.role]
                  )}
                >
                  {USER_ROLE_LABELS[user.role]}
                </span>
              </div>
            </div>

            {/* Edit Button */}
            {!isEditing ? (
              <button
                onClick={handleEdit}
                className="flex items-center gap-2 px-4 py-2 bg-white text-indigo-600 rounded-xl hover:bg-white/90 transition-colors shadow-lg"
              >
                <PencilIcon className="h-4 w-4" />
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  <CheckIcon className="h-4 w-4" />
                  {loading ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-xl hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  <XMarkIcon className="h-4 w-4" />
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Profile Info */}
        <div className="px-6 pb-6 pt-20">
          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email (Read-only) */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <EnvelopeIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">Email Address</p>
                <p className="text-base font-medium text-gray-900">{user.email}</p>
                <p className="text-xs text-gray-400 mt-1">Cannot be changed</p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <PhoneIcon className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">Phone Number</p>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Enter phone number"
                    className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                ) : (
                  <p className="text-base font-medium text-gray-900">{user.phone || '-'}</p>
                )}
              </div>
            </div>

            {/* Name (editable) */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <UserCircleIcon className="h-5 w-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">Full Name</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter full name"
                    className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                ) : (
                  <p className="text-base font-medium text-gray-900">{user.name}</p>
                )}
              </div>
            </div>

            {/* Department (Read-only) */}
            {user.department && (
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <BuildingOfficeIcon className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Department</p>
                  <p className="text-base font-medium text-gray-900">
                    {DEPARTMENT_LABELS[user.department as keyof typeof DEPARTMENT_LABELS]}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Assigned by administrator</p>
                </div>
              </div>
            )}

            {/* Role (Read-only) */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <ShieldCheckIcon className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">Role</p>
                <p className="text-base font-medium text-gray-900">{USER_ROLE_LABELS[user.role]}</p>
                <p className="text-xs text-gray-400 mt-1">Assigned by administrator</p>
              </div>
            </div>

            {/* Account Status (Read-only) */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <UserCircleIcon className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">Account Status</p>
                <p className="text-base font-medium text-green-600">Active</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      {!isEditing && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-800">
            <span className="font-medium">Note:</span> You can update your name and phone number.
            For role or department changes, please contact your system administrator.
          </p>
        </div>
      )}

      {/* Alert Dialog */}
      <AlertDialog
        isOpen={alertDialog.isOpen}
        onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
        title={alertDialog.title}
        message={alertDialog.message}
        variant={alertDialog.variant}
      />
    </div>
  );
};

export default ProfilePage;
