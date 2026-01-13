/**
 * WorkSubmissionPage.tsx
 *
 * Main work submission page for department workers to fill out forms,
 * upload files/photos, and submit their work for an assigned order.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  ArrowLeftIcon,
  DocumentArrowUpIcon,
  PhotoIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  XMarkIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';

import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  DEPARTMENT_REQUIREMENTS,
  type FormField,
  type PhotoRequirement,
  type FileRequirement,
  type DepartmentRequirement,
} from '../../config/departmentRequirements';
import { isDepartmentEnabled } from '../../config/departmentFeatureFlags';
import { ErrorBoundary } from '../../components/common';
import {
  useKeyboardShortcuts,
  createSaveShortcut,
  createSubmitShortcut,
} from '../../hooks/useKeyboardShortcuts';

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

/**
 * Format specification label from camelCase to Title Case
 */
const formatSpecLabel = (key: string): string => {
  if (key.startsWith('custom')) {
    return key
      .replace('custom', '')
      .replace(/([A-Z])/g, ' $1')
      .trim();
  }
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
};

/**
 * Format specification value for display
 */
const formatSpecValue = (value: any): string => {
  if (value === null || value === undefined) return 'Not specified';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return value.toString();
  return value.toString();
};

interface WorkData {
  id: string;
  departmentTrackingId: string;
  formData: Record<string, unknown> | null;
  uploadedFiles: Array<{
    id: string;
    name: string;
    originalName: string;
    url: string;
    mimeType: string;
    size: number;
    uploadedAt: string;
  }>;
  uploadedPhotos: Array<{
    id: string;
    name: string;
    originalName: string;
    url: string;
    thumbnailUrl?: string;
    category: string;
    uploadedAt: string;
  }>;
  workStartedAt: string | null;
  workCompletedAt: string | null;
  timeSpent: number | null;
  isComplete: boolean;
  isDraft: boolean;
  lastSavedAt: string | null;
  autoSaveData: Record<string, unknown> | null;
}

interface OrderWorkDetails {
  departmentName: string;
  order: {
    id: string;
    orderNumber: string;
    productPhotoUrl?: string;
    priority: number;
    status: string;
    orderDetails?: {
      productType: string | null;
      goldWeightInitial: number;
      purity: string;
      metalType: string;
      specialInstructions?: string | null;
      referenceImages?: string[] | null;
      productSpecifications?: Record<string, any>;
    } | null;
  };
  tracking: {
    id: string;
    status: string;
    startedAt: string | null;
    completedAt: string | null;
  };
  workData: WorkData | null;
}

interface UploadedFile {
  id: string;
  name: string;
  originalName: string;
  url: string;
  category?: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}

interface UploadedPhoto {
  id: string;
  name: string;
  originalName: string;
  url: string;
  thumbnailUrl?: string;
  category: string;
  uploadedAt: string;
}

function WorkSubmissionPage() {
  const { id: orderId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  useAuth(); // Ensures user is authenticated
  const queryClient = useQueryClient();

  // Form state
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedPhoto[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Auto-save timer
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string | null>(null);

  // Fetch order work details
  const {
    data: workDetails,
    isLoading,
    error,
  } = useQuery<OrderWorkDetails>({
    queryKey: ['orderWork', orderId],
    queryFn: async () => {
      console.log('Fetching work data for order:', orderId);
      try {
        const response = await api.get(`/workers/work/${orderId}`);
        console.log('Work data response:', response.data);
        // API returns { success: true, data: workData }
        return response.data.data || response.data;
      } catch (err) {
        console.error('API error:', err);
        throw err;
      }
    },
    enabled: !!orderId,
    staleTime: 30000,
    retry: false, // Don't retry on error so we can see the issue
  });

  // Get department requirements based on department name
  const getDepartmentRequirements = useCallback((): DepartmentRequirement | null => {
    if (!workDetails?.departmentName) return null;

    // Map backend department name to frontend config ID
    const configId =
      departmentNameToConfigId[workDetails.departmentName] || workDetails.departmentName;
    return DEPARTMENT_REQUIREMENTS[configId] || null;
  }, [workDetails?.departmentName]);

  const requirements = getDepartmentRequirements();

  // Initialize form data from existing work data
  useEffect(() => {
    if (workDetails?.workData) {
      const savedData = workDetails.workData.formData || workDetails.workData.autoSaveData || {};
      setFormData(savedData);
      setUploadedFiles(workDetails.workData.uploadedFiles || []);
      setUploadedPhotos(workDetails.workData.uploadedPhotos || []);
      lastSavedRef.current = workDetails.workData.lastSavedAt || null;
    }
  }, [workDetails]);

  // Auto-save functionality - saves every 2 minutes when data changes
  useEffect(() => {
    if (isDirty && workDetails) {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      autoSaveTimerRef.current = setTimeout(() => {
        handleAutoSave();
      }, 120000); // 2 minutes (120000ms)
    }
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [isDirty, formData, workDetails]);

  // Warn before leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Handle form field change
  const handleFieldChange = (fieldName: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
    setIsDirty(true);

    // Clear validation error for this field
    if (validationErrors[fieldName]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  // Auto-save mutation
  const autoSaveMutation = useMutation({
    mutationFn: async (data: {
      formData: Record<string, unknown>;
      uploadedFiles: UploadedFile[];
      uploadedPhotos: UploadedPhoto[];
    }) => {
      const response = await api.post(`/workers/work/${orderId}/save`, data);
      return response.data;
    },
    onSuccess: () => {
      lastSavedRef.current = new Date().toISOString();
      setIsDirty(false);
      // Show subtle success indicator
      toast.success('Auto-saved', {
        duration: 2000,
        icon: '💾',
      });
    },
    onError: (err) => {
      console.error('Auto-save failed:', err);
      toast.error('Auto-save failed. Please save manually.', {
        duration: 3000,
      });
    },
  });

  const handleAutoSave = () => {
    if (!isDirty) return;
    autoSaveMutation.mutate({
      formData,
      uploadedFiles,
      uploadedPhotos,
    });
  };

  // Save draft mutation
  const saveDraftMutation = useMutation({
    mutationFn: async (data: {
      formData: Record<string, unknown>;
      uploadedFiles: UploadedFile[];
      uploadedPhotos: UploadedPhoto[];
    }) => {
      const response = await api.post(`/workers/work/${orderId}/save`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Draft saved successfully');
      setIsDirty(false);
      lastSavedRef.current = new Date().toISOString();
      // Clear any pending auto-save timer since we just saved
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
      queryClient.invalidateQueries({ queryKey: ['orderWork', orderId] });
      queryClient.invalidateQueries({ queryKey: ['my-work-orders'] });
    },
    onError: (err: unknown) => {
      const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
      const errorMsg =
        axiosError?.response?.data?.message || axiosError?.message || 'Unknown error';
      toast.error(`Failed to save draft: ${errorMsg}`);
    },
  });

  const handleSaveDraft = () => {
    // Clear auto-save timer when manually saving
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }

    // Send full photo/file objects instead of just IDs
    const filteredFiles = uploadedFiles.filter((f) => f && f.id);
    const filteredPhotos = uploadedPhotos.filter((p) => p && p.id);

    console.log('Saving draft with:', { formData, filteredFiles, filteredPhotos });

    saveDraftMutation.mutate({
      formData,
      uploadedFiles: filteredFiles,
      uploadedPhotos: filteredPhotos,
    });
  };

  // Submit work mutation
  const submitWorkMutation = useMutation({
    mutationFn: async (data: {
      formData: Record<string, unknown>;
      uploadedFiles: UploadedFile[];
      uploadedPhotos: UploadedPhoto[];
    }) => {
      const response = await api.post(`/workers/work/${orderId}/complete`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Work submitted successfully!');
      // Clear auto-save timer since work is complete
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
      queryClient.invalidateQueries({ queryKey: ['orderWork', orderId] });
      queryClient.invalidateQueries({ queryKey: ['workerAssignments'] });
      queryClient.invalidateQueries({ queryKey: ['my-work-orders'] });
      navigate('/my-work');
    },
    onError: (err: unknown) => {
      const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
      const errorMsg =
        axiosError?.response?.data?.message || axiosError?.message || 'Unknown error';
      toast.error(`Failed to submit work: ${errorMsg}`);
    },
  });

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (requirements?.formFields) {
      requirements.formFields.forEach((field: FormField) => {
        if (field.required) {
          const value = formData[field.name];

          // Checkbox validation - must be checked (true)
          if (field.type === 'checkbox') {
            if (value !== true) {
              errors[field.name] = `${field.label} must be checked`;
            }
          } else {
            // Other field types - must not be empty
            if (value === undefined || value === null || value === '') {
              errors[field.name] = `${field.label} is required`;
            }
          }
        }

        // Number validation
        if (field.type === 'number' && formData[field.name] !== undefined) {
          const numValue = Number(formData[field.name]);
          if (field.min !== undefined && numValue < field.min) {
            errors[field.name] = `${field.label} must be at least ${field.min}`;
          }
          if (field.max !== undefined && numValue > field.max) {
            errors[field.name] = `${field.label} must be at most ${field.max}`;
          }
        }

        // Text validation
        if (field.type === 'text' || field.type === 'textarea') {
          const textValue = String(formData[field.name] || '');
          if (field.minLength && textValue.length < field.minLength) {
            errors[field.name] = `${field.label} must be at least ${field.minLength} characters`;
          }
          if (field.maxLength && textValue.length > field.maxLength) {
            errors[field.name] = `${field.label} must be at most ${field.maxLength} characters`;
          }
        }
      });
    }

    // Validate photo requirements
    if (requirements?.photoRequirements) {
      requirements.photoRequirements.forEach((photoReq: PhotoRequirement) => {
        if (photoReq.required) {
          const categoryPhotos = uploadedPhotos.filter((p) => p && p.category === photoReq.name);
          const minCount = photoReq.minCount || 1;
          if (categoryPhotos.length < minCount) {
            errors[
              `photo_${photoReq.name}`
            ] = `${photoReq.label} requires at least ${minCount} photo(s)`;
          }
        }
      });
    }

    // Validate file requirements
    if (requirements?.fileRequirements) {
      requirements.fileRequirements.forEach((fileReq: FileRequirement) => {
        if (fileReq.required) {
          const hasFile = uploadedFiles.some((f) => f && f.category === fileReq.name);
          if (!hasFile) {
            errors[`file_${fileReq.name}`] = `${fileReq.label} is required`;
          }
        }
      });
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fix the validation errors before submitting');
      return;
    }

    setIsSubmitting(true);
    try {
      // Send full photo/file objects instead of just IDs
      await submitWorkMutation.mutateAsync({
        formData,
        uploadedFiles: uploadedFiles.filter((f) => f && f.id),
        uploadedPhotos: uploadedPhotos.filter((p) => p && p.id),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate if all requirements are met
  const isAllRequirementsMet = (() => {
    if (!requirements) return false;

    // Check form fields
    if (requirements.formFields) {
      for (const field of requirements.formFields) {
        if (field.required && !formData[field.name]) return false;
      }
    }

    // Check photos
    if (requirements.photoRequirements) {
      for (const photoReq of requirements.photoRequirements) {
        if (photoReq.required) {
          const categoryPhotos = uploadedPhotos.filter((p) => p && p.category === photoReq.name);
          const minCount = photoReq.minCount || 1;
          if (categoryPhotos.length < minCount) return false;
        }
      }
    }

    // Check files
    if (requirements.fileRequirements) {
      for (const fileReq of requirements.fileRequirements) {
        if (fileReq.required) {
          const hasFile = uploadedFiles.some((f) => f && f.category === fileReq.name);
          if (!hasFile) return false;
        }
      }
    }

    return true;
  })();

  // Keyboard shortcuts
  const isFormReady = !saveDraftMutation.isPending && !isSubmitting;
  const isSubmitReady = isFormReady && isAllRequirementsMet;

  useKeyboardShortcuts({
    shortcuts: [
      createSaveShortcut(() => {
        if (isFormReady && isDirty) {
          handleSaveDraft();
        }
      }),
      createSubmitShortcut(() => {
        if (isSubmitReady) {
          handleSubmit();
        }
      }),
    ],
    enabled: !isSubmitting,
  });

  // File upload handler
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    fileReqName: string
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file) return;

    const formDataUpload = new FormData();
    formDataUpload.append('file', file);
    formDataUpload.append('category', fileReqName);

    try {
      const response = await api.post(`/workers/work/${orderId}/upload-file`, formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const newFile: UploadedFile = response.data.file;
      setUploadedFiles((prev) => [...prev, newFile]);
      setIsDirty(true);
      toast.success('File uploaded successfully');
    } catch (err) {
      console.error('File upload error:', err);
      const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
      const errorMsg =
        axiosError?.response?.data?.message || axiosError?.message || 'Failed to upload file';
      toast.error(errorMsg);
    }
  };

  // Photo upload handler
  const handlePhotoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    photoCategory: string
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const formDataUpload = new FormData();
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file) {
        formDataUpload.append('photos', file);
      }
    }
    formDataUpload.append('category', photoCategory);

    try {
      const response = await api.post(`/workers/work/${orderId}/upload-photos`, formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const newPhotos: UploadedPhoto[] = response.data.photos;
      setUploadedPhotos((prev) => [...prev, ...newPhotos]);
      setIsDirty(true);
      toast.success('Photo(s) uploaded successfully');
    } catch (err) {
      console.error('Photo upload error:', err);
      const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
      const errorMsg =
        axiosError?.response?.data?.message || axiosError?.message || 'Failed to upload photo';
      toast.error(errorMsg);
    }
  };

  // Delete file handler
  const handleDeleteFile = async (fileId: string) => {
    try {
      await api.delete(`/workers/work/${orderId}/files/${fileId}`);
      setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
      setIsDirty(true);
      toast.success('File deleted');
    } catch (err) {
      console.error('Delete file error:', err);
      const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
      const errorMsg =
        axiosError?.response?.data?.message || axiosError?.message || 'Failed to delete file';
      toast.error(errorMsg);
    }
  };

  // Delete photo handler
  const handleDeletePhoto = async (photoId: string) => {
    try {
      await api.delete(`/workers/work/${orderId}/photos/${photoId}`);
      setUploadedPhotos((prev) => prev.filter((p) => p.id !== photoId));
      setIsDirty(true);
      toast.success('Photo deleted');
    } catch (err) {
      console.error('Delete photo error:', err);
      const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
      const errorMsg =
        axiosError?.response?.data?.message || axiosError?.message || 'Failed to delete photo';
      toast.error(errorMsg);
    }
  };

  // Render form field based on type
  const renderFormField = (field: FormField) => {
    const value = formData[field.name] ?? '';
    const error = validationErrors[field.name];

    const baseInputClass = `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      error ? 'border-red-500' : 'border-gray-300'
    }`;

    switch (field.type) {
      case 'select':
        return (
          <select
            value={String(value)}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className={baseInputClass}
          >
            <option value="">Select {field.label}</option>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'textarea':
        return (
          <textarea
            value={String(value)}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            className={baseInputClass}
            maxLength={field.maxLength}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={String(value)}
            onChange={(e) =>
              handleFieldChange(field.name, e.target.value ? parseFloat(e.target.value) : '')
            }
            placeholder={field.placeholder}
            min={field.min}
            max={field.max}
            step="0.01"
            className={baseInputClass}
          />
        );

      case 'checkbox':
        return (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => handleFieldChange(field.name, e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </span>
          </label>
        );

      case 'date':
        return (
          <input
            type="date"
            value={String(value)}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className={baseInputClass}
          />
        );

      default: // text
        return (
          <input
            type="text"
            value={String(value)}
            onChange={(e) => {
              let inputValue = e.target.value;

              // Auto-format dimensions field (e.g., "20 15 8" → "20 x 15 x 8")
              if (field.name === 'dimensions') {
                // Replace single/multiple spaces between numbers with " x "
                inputValue = inputValue.replace(/(\d+)\s+(\d+)/g, '$1 x $2');
              }

              handleFieldChange(field.name, inputValue);
            }}
            placeholder={field.placeholder}
            maxLength={field.maxLength}
            className={baseInputClass}
          />
        );
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ArrowPathIcon className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  // Error state
  if (error || !workDetails) {
    console.error('WorkSubmissionPage error:', error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : error && typeof error === 'object' && 'message' in error
        ? String((error as { message: string }).message)
        : 'An error occurred';
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Work Details</h2>
        <p className="text-gray-600 mb-4">{errorMessage}</p>
        <p className="text-xs text-gray-400 mb-4">Order ID: {orderId}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  // No requirements found
  if (!requirements) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <InformationCircleIcon className="w-16 h-16 text-yellow-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Department Configuration Missing
        </h2>
        <p className="text-gray-600 mb-4">
          No configuration found for department: {workDetails.departmentName}
        </p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Check if advanced features are enabled (for future use)
  const configId =
    departmentNameToConfigId[workDetails.departmentName] || workDetails.departmentName;
  const isFeatureEnabled = isDepartmentEnabled(configId);

  const isWorkComplete = workDetails.workData?.isComplete || false;
  const orderDetails = workDetails.order.orderDetails;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Mobile responsive */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <button
                onClick={() => navigate(-1)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg flex-shrink-0"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                  {requirements.departmentName}
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 truncate">
                  Order: {workDetails.order.orderNumber}
                </p>
              </div>
            </div>

            {/* Status Badge - Mobile responsive */}
            <div className="flex items-center gap-2">
              {isWorkComplete ? (
                <span className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap">
                  <CheckCircleSolidIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Completed</span>
                  <span className="sm:hidden">Done</span>
                </span>
              ) : workDetails.workData?.isDraft ? (
                <span className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap">
                  <ClockIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Draft</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap">
                  <ArrowPathIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">In Progress</span>
                  <span className="sm:hidden">Active</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Order Summary Card */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Product Type</p>
              <p className="font-medium text-gray-900">{orderDetails?.productType || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Metal Type</p>
              <p className="font-medium text-gray-900">{orderDetails?.metalType || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Gold Weight</p>
              <p className="font-medium text-gray-900">
                {orderDetails?.goldWeightInitial ? `${orderDetails.goldWeightInitial}g` : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Purity</p>
              <p className="font-medium text-gray-900">{orderDetails?.purity || 'N/A'}</p>
            </div>
          </div>

          {orderDetails?.specialInstructions && (
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm font-medium text-yellow-800">Special Instructions:</p>
              <p className="text-sm text-yellow-700">{orderDetails.specialInstructions}</p>
            </div>
          )}

          {orderDetails?.productSpecifications &&
            Object.keys(orderDetails.productSpecifications).length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-800 mb-3">Product Specifications:</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(orderDetails.productSpecifications)
                    .filter(([_, value]) => value !== null && value !== undefined && value !== '')
                    .map(([key, value]) => (
                      <div key={key} className="text-sm">
                        <p className="text-blue-600 font-medium">{formatSpecLabel(key)}</p>
                        <p className="text-blue-900">{formatSpecValue(value)}</p>
                      </div>
                    ))}
                </div>
              </div>
            )}
        </div>

        {/* Tips Section */}
        {requirements.tips && requirements.tips.length > 0 && (
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-2">
              <InformationCircleIcon className="w-5 h-5" />
              Tips for {requirements.departmentName}
            </h3>
            <ul className="list-disc list-inside space-y-1">
              {requirements.tips.map((tip, index) => (
                <li key={index} className="text-sm text-blue-700">
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Department Context Note */}
        <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
          <div className="flex items-start gap-2">
            <InformationCircleIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Department Worker View</p>
              <p className="text-sm text-amber-700 mt-1">
                You are filling out this form as a {requirements.departmentName} department worker.
                All fields and uploads are specific to your department's work requirements.
              </p>
            </div>
          </div>
        </div>

        {/* Common Mistakes Warning */}
        {requirements.commonMistakes && requirements.commonMistakes.length > 0 && (
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <h3 className="text-sm font-medium text-orange-800 mb-2 flex items-center gap-2">
              <ExclamationTriangleIcon className="w-5 h-5" />
              Common Mistakes to Avoid
            </h3>
            <ul className="list-disc list-inside space-y-1">
              {requirements.commonMistakes.map((mistake, index) => (
                <li key={index} className="text-sm text-orange-700">
                  {mistake}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Form Fields Section */}
        {requirements.formFields && requirements.formFields.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Work Details</h2>
            <div className="space-y-4">
              {requirements.formFields.map((field: FormField) => (
                <div key={field.name}>
                  {field.type !== 'checkbox' && (
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                  )}
                  {renderFormField(field)}
                  {field.helpText && <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>}
                  {validationErrors[field.name] && (
                    <p className="mt-1 text-xs text-red-500">{validationErrors[field.name]}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Photo Upload Section */}
        {requirements.photoRequirements && requirements.photoRequirements.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <PhotoIcon className="w-5 h-5" />
              Photo Documentation
            </h2>
            <div className="space-y-6">
              {requirements.photoRequirements.map((photoReq: PhotoRequirement) => {
                const categoryPhotos = uploadedPhotos.filter(
                  (p) => p && p.category === photoReq.name
                );
                const error = validationErrors[`photo_${photoReq.name}`];

                return (
                  <div key={photoReq.name} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {photoReq.label}
                          {photoReq.required && <span className="text-red-500 ml-1">*</span>}
                        </h3>
                        <p className="text-sm text-gray-500">{photoReq.description}</p>
                        <p className="text-xs text-gray-600 font-medium mt-1">
                          {categoryPhotos.length} uploaded
                        </p>
                        {(photoReq.minCount ?? 0) > 0 && (
                          <p className="text-xs text-gray-400">
                            Minimum: {photoReq.minCount} photo(s)
                          </p>
                        )}
                      </div>
                      <label className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700">
                        <PhotoIcon className="w-4 h-4" />
                        <span className="text-sm">Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => handlePhotoUpload(e, photoReq.name)}
                          disabled={isWorkComplete}
                        />
                      </label>
                    </div>

                    {/* Photo Grid */}
                    {categoryPhotos.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {categoryPhotos.map((photo) => (
                          <div key={photo.id} className="relative group">
                            <img
                              src={photo.thumbnailUrl || photo.url}
                              alt={photo.originalName}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                            {!isWorkComplete && (
                              <button
                                onClick={() => handleDeletePhoto(photo.id)}
                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <XMarkIcon className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* File Upload Section */}
        {requirements.fileRequirements && requirements.fileRequirements.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DocumentArrowUpIcon className="w-5 h-5" />
              File Uploads
            </h2>
            <div className="space-y-4">
              {requirements.fileRequirements.map((fileReq: FileRequirement) => {
                const categoryFiles = uploadedFiles.filter((f) => f && f.category === fileReq.name);
                const error = validationErrors[`file_${fileReq.name}`];
                const acceptedFormats = fileReq.acceptedFormats || [];

                return (
                  <div key={fileReq.name} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {fileReq.label}
                          {fileReq.required && <span className="text-red-500 ml-1">*</span>}
                        </h3>
                        <p className="text-sm text-gray-500">{fileReq.description}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Accepted formats: {acceptedFormats.join(', ') || 'Any'}
                          {fileReq.maxSize && ` | Max size: ${fileReq.maxSize}MB`}
                        </p>
                      </div>
                      <label className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg cursor-pointer hover:bg-gray-700">
                        <DocumentArrowUpIcon className="w-4 h-4" />
                        <span className="text-sm">Upload</span>
                        <input
                          type="file"
                          accept={
                            acceptedFormats.length > 0 ? acceptedFormats.join(',') : undefined
                          }
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, fileReq.name)}
                          disabled={isWorkComplete}
                        />
                      </label>
                    </div>

                    {/* Uploaded Files List */}
                    {categoryFiles.length > 0 && (
                      <div className="space-y-2">
                        {categoryFiles.map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-2">
                              <DocumentArrowUpIcon className="w-5 h-5 text-gray-400" />
                              <span className="text-sm text-gray-700">{file.originalName}</span>
                              <span className="text-xs text-gray-400">
                                ({(file.size / 1024 / 1024).toFixed(2)} MB)
                              </span>
                            </div>
                            {!isWorkComplete && (
                              <button
                                onClick={() => handleDeleteFile(file.id)}
                                className="p-1 text-red-500 hover:bg-red-50 rounded"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Auto-save Status */}
        <div className="text-center py-2">
          {autoSaveMutation.isPending && (
            <div className="inline-flex items-center gap-2 text-sm text-blue-600">
              <ArrowPathIcon className="w-4 h-4 animate-spin" />
              <span>Auto-saving...</span>
            </div>
          )}
          {!autoSaveMutation.isPending && lastSavedRef.current && (
            <div className="text-sm text-gray-500">
              {isDirty ? (
                <span className="text-amber-600">● Unsaved changes</span>
              ) : (
                <span>✓ Last saved: {new Date(lastSavedRef.current).toLocaleString()}</span>
              )}
            </div>
          )}
          {!autoSaveMutation.isPending && !lastSavedRef.current && isDirty && (
            <div className="text-sm text-amber-600">● Unsaved changes</div>
          )}
        </div>

        {/* Action Buttons */}
        {!isWorkComplete && (
          <div className="sticky bottom-0 bg-white border-t p-4 -mx-4">
            {/* Keyboard Shortcuts Hint */}
            <div className="mb-3 hidden sm:flex items-center justify-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-gray-700 font-mono">
                  Ctrl
                </kbd>
                <span>+</span>
                <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-gray-700 font-mono">
                  S
                </kbd>
                <span className="ml-1">Save Draft</span>
              </div>
              <div className="flex items-center gap-1.5">
                <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-gray-700 font-mono">
                  Ctrl
                </kbd>
                <span>+</span>
                <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-gray-700 font-mono">
                  Enter
                </kbd>
                <span className="ml-1">Submit Work</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 justify-end">
              <button
                onClick={handleSaveDraft}
                disabled={saveDraftMutation.isPending}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                {saveDraftMutation.isPending ? 'Saving...' : 'Save Draft'}
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || submitWorkMutation.isPending}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-4 h-4" />
                    Submit Work
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Completed Notice */}
        {isWorkComplete && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <CheckCircleSolidIcon className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <h3 className="text-lg font-medium text-green-800">Work Completed</h3>
            <p className="text-sm text-green-600">
              This work has been submitted and marked as complete.
            </p>
            {workDetails.workData?.workCompletedAt && (
              <p className="text-xs text-green-500 mt-1">
                Completed at: {new Date(workDetails.workData.workCompletedAt).toLocaleString()}
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// Wrap with Error Boundary
const WorkSubmissionPageWithErrorBoundary = () => (
  <ErrorBoundary>
    <WorkSubmissionPage />
  </ErrorBoundary>
);

export default WorkSubmissionPageWithErrorBoundary;
