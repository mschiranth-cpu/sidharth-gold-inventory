/**
 * ============================================
 * PROFILE PAGE — Luxe Edition
 * ============================================
 *
 * View / edit own profile. Includes avatar upload (resized to 256x256 JPEG
 * data URL, persisted via PUT /api/users/me).
 */

import React, { useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon,
  PencilIcon,
  XMarkIcon,
  CheckIcon,
  CameraIcon,
  TrashIcon,
  IdentificationIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { USER_ROLE_LABELS } from '../../types/auth.types';
import { DEPARTMENT_LABELS } from '../../types/user.types';
import { usersService } from '../../modules/users/services';
import AlertDialog from '../../components/common/AlertDialog';
import PhoneInput, { validatePhone } from '../../components/common/PhoneInput';
import { resizeImageToDataUrl } from '../../utils/imageResize';

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);
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
  const fileRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const phoneError = validatePhone(formData.phone) || undefined;
  const nameError = formData.name.trim().length < 2 ? 'Name must be at least 2 characters' : undefined;

  const showToast = (title: string, message: string, variant: 'success' | 'error' | 'info' | 'warning') =>
    setAlertDialog({ isOpen: true, title, message, variant });

  const handleEdit = () => {
    setFormData({ name: user.name || '', phone: user.phone || '' });
    setPhoneTouched(false);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({ name: user.name || '', phone: user.phone || '' });
    setPhoneTouched(false);
  };

  const persistUpdate = async (
    payload: { name?: string; phone?: string | null; avatar?: string | null },
    successMsg: string,
  ) => {
    const response = await usersService.updateMe(payload);
    if (response.success && response.data) {
      updateUser(response.data as any);
      showToast('Saved', successMsg, 'success');
      return true;
    }
    return false;
  };

  const handleSave = async () => {
    if (nameError || phoneError) {
      setPhoneTouched(true);
      return;
    }
    try {
      setLoading(true);
      await persistUpdate(
        { name: formData.name.trim(), phone: formData.phone.trim() || null },
        'Profile updated successfully',
      );
      setIsEditing(false);
    } catch (err: any) {
      showToast('Error', err?.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarPick = () => fileRef.current?.click();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting same file
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      showToast('Image too large', 'Please choose a picture under 8 MB.', 'warning');
      return;
    }
    try {
      setUploadingAvatar(true);
      const dataUrl = await resizeImageToDataUrl(file, { size: 320, quality: 0.85 });
      await persistUpdate({ avatar: dataUrl }, 'Profile photo updated');
    } catch (err: any) {
      showToast('Upload failed', err?.response?.data?.message || err?.message || 'Could not upload photo', 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAvatarRemove = async () => {
    if (!user.avatar) return;
    try {
      setUploadingAvatar(true);
      await persistUpdate({ avatar: null }, 'Profile photo removed');
    } catch (err: any) {
      showToast('Error', err?.response?.data?.message || 'Could not remove photo', 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h1 className="text-3xl font-serif font-semibold text-onyx-900 tracking-tight">Your Profile</h1>
          <p className="mt-1 text-sm text-onyx-500">Manage your personal information and account preferences.</p>
        </div>
      </div>

      {/* Profile card */}
      <div className="rounded-2xl border border-champagne-200 bg-white shadow-sm overflow-hidden">
        {/* Cover */}
        <div className="relative h-44 bg-gradient-to-br from-onyx-900 via-onyx-800 to-champagne-800">
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_55%)]" />
          {/* Top-right action */}
          <div className="absolute top-4 right-4 z-10">
            {!isEditing ? (
              <button
                onClick={handleEdit}
                className="flex items-center gap-2 px-3.5 py-2 bg-white/95 backdrop-blur text-onyx-900 rounded-lg hover:bg-white transition shadow-sm text-sm font-medium border border-champagne-100"
              >
                <PencilIcon className="h-4 w-4" />
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center gap-2 px-3.5 py-2 bg-white text-onyx-900 rounded-lg hover:bg-pearl transition shadow-sm text-sm font-semibold disabled:opacity-50"
                >
                  <CheckIcon className="h-4 w-4 text-emerald-600" />
                  {loading ? 'Saving…' : 'Save'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex items-center gap-2 px-3.5 py-2 bg-white/85 backdrop-blur text-onyx-700 rounded-lg hover:bg-white transition shadow-sm text-sm font-medium disabled:opacity-50"
                >
                  <XMarkIcon className="h-4 w-4" />
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Identity row — avatar overlaps cover */}
        <div className="px-6 sm:px-8 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-5 -mt-16 sm:-mt-14">
            <AvatarBlock
              avatar={user.avatar}
              initials={initials}
              uploading={uploadingAvatar}
              onPick={handleAvatarPick}
              onRemove={handleAvatarRemove}
            />
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <div className="sm:pb-2 flex-1 min-w-0">
              <h2 className="text-2xl font-serif font-semibold text-onyx-900 truncate">{user.name}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-champagne-100 text-champagne-900 border border-champagne-200">
                  <ShieldCheckIcon className="h-3 w-3" />
                  {USER_ROLE_LABELS[user.role]}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                    user.isActive
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
                <span className="text-xs text-onyx-500 truncate">{user.email}</span>
              </div>
            </div>
          </div>

          {/* Details grid */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
            {/* Email */}
            <DetailItem
              icon={<EnvelopeIcon className="h-5 w-5" />}
              label="Email Address"
              hint="Cannot be changed"
            >
              <p className="text-base font-medium text-onyx-900 break-all">{user.email}</p>
            </DetailItem>

            {/* Phone */}
            <DetailItem icon={<PhoneIcon className="h-5 w-5" />} label="Phone Number">
              {isEditing ? (
                <div>
                  <PhoneInput
                    value={formData.phone}
                    onChange={(v) => setFormData({ ...formData, phone: v })}
                    onBlur={() => setPhoneTouched(true)}
                    hasError={phoneTouched && !!phoneError}
                  />
                  {phoneTouched && phoneError && (
                    <p className="mt-1 text-xs text-rose-600">{phoneError}</p>
                  )}
                </div>
              ) : (
                <p className="text-base font-medium text-onyx-900">{user.phone || <span className="text-onyx-400">—</span>}</p>
              )}
            </DetailItem>

            {/* Name */}
            <DetailItem icon={<UserCircleIcon className="h-5 w-5" />} label="Full Name">
              {isEditing ? (
                <div>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter full name"
                    className={`mt-0.5 w-full px-3 py-2.5 text-sm rounded-lg border bg-white focus:ring-2 focus:border-transparent outline-none ${
                      nameError ? 'border-rose-400 focus:ring-rose-500' : 'border-champagne-200 focus:ring-champagne-600'
                    }`}
                  />
                  {nameError && <p className="mt-1 text-xs text-rose-600">{nameError}</p>}
                </div>
              ) : (
                <p className="text-base font-medium text-onyx-900">{user.name}</p>
              )}
            </DetailItem>

            {/* Department */}
            {user.department && (
              <DetailItem
                icon={<BuildingOfficeIcon className="h-5 w-5" />}
                label="Department"
                hint="Assigned by administrator"
              >
                <p className="text-base font-medium text-onyx-900">
                  {DEPARTMENT_LABELS[user.department as keyof typeof DEPARTMENT_LABELS]}
                </p>
              </DetailItem>
            )}

            {/* Role */}
            <DetailItem icon={<ShieldCheckIcon className="h-5 w-5" />} label="Role" hint="Assigned by administrator">
              <p className="text-base font-medium text-onyx-900">{USER_ROLE_LABELS[user.role]}</p>
            </DetailItem>

            {/* Account ID */}
            <DetailItem icon={<IdentificationIcon className="h-5 w-5" />} label="Account ID">
              <p className="text-xs font-mono text-onyx-700 break-all">{user.id}</p>
            </DetailItem>
          </div>
        </div>
      </div>

      {/* Footer note */}
      {!isEditing && (
        <div className="rounded-xl border border-champagne-200 bg-pearl/50 p-4 text-sm text-onyx-700">
          <span className="font-semibold text-onyx-900">Note:</span>{' '}
          You can update your name, phone number, and profile photo. For role or department changes, please contact your system administrator.
        </div>
      )}

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

// ---------- Subcomponents ----------

interface AvatarBlockProps {
  avatar: string | null | undefined;
  initials: string;
  uploading: boolean;
  onPick: () => void;
  onRemove: () => void;
}

function AvatarBlock({ avatar, initials, uploading, onPick, onRemove }: AvatarBlockProps) {
  return (
    <div className="relative group flex-shrink-0">
      <div className="h-32 w-32 rounded-full bg-white p-1.5 shadow-xl ring-1 ring-champagne-200">
        {avatar ? (
          <img
            src={avatar}
            alt="Profile"
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          <div className="h-full w-full rounded-full bg-gradient-to-br from-champagne-700 via-champagne-800 to-onyx-800 flex items-center justify-center text-pearl text-3xl font-serif font-semibold tracking-wide">
            {initials || '·'}
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 rounded-full bg-onyx-900/55 flex items-center justify-center">
            <svg className="animate-spin h-6 w-6 text-pearl" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z" />
            </svg>
          </div>
        )}
      </div>

      {/* Camera button (always visible on touch, hover on desktop) */}
      <button
        type="button"
        onClick={onPick}
        disabled={uploading}
        title={avatar ? 'Change photo' : 'Upload photo'}
        className="absolute bottom-1 right-1 h-9 w-9 rounded-full bg-onyx-900 text-pearl flex items-center justify-center shadow-lg ring-2 ring-white hover:bg-onyx-800 transition disabled:opacity-50"
      >
        <CameraIcon className="h-4 w-4" />
      </button>

      {/* Remove button (only when an avatar exists) */}
      {avatar && (
        <button
          type="button"
          onClick={onRemove}
          disabled={uploading}
          title="Remove photo"
          className="absolute top-1 right-1 h-7 w-7 rounded-full bg-white text-rose-600 flex items-center justify-center shadow ring-1 ring-rose-200 hover:bg-rose-50 transition opacity-0 group-hover:opacity-100 disabled:opacity-50"
        >
          <TrashIcon className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

interface DetailItemProps {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  children: React.ReactNode;
}

function DetailItem({ icon, label, hint, children }: DetailItemProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 h-9 w-9 rounded-lg bg-champagne-50 border border-champagne-100 text-champagne-800 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-onyx-500">{label}</p>
        <div className="mt-0.5">{children}</div>
        {hint && <p className="mt-1 text-[11px] text-onyx-400">{hint}</p>}
      </div>
    </div>
  );
}
