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
import { workersService } from '../../services/workers.service';

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
  const { user } = useAuth(); // Get user for role checking
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'FACTORY_MANAGER';

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
      navigate('/app/my-work');
    },
    onError: (err: unknown) => {
      const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
      const errorMsg =
        axiosError?.response?.data?.message || axiosError?.message || 'Unknown error';
      toast.error(`Failed to submit work: ${errorMsg}`);
    },
  });

  // Reopen work mutation (Admin only)
  const reopenWorkMutation = useMutation({
    mutationFn: async () => {
      if (!orderId || !workDetails?.departmentName) {
        throw new Error('Order ID or department name not found');
      }
      return await workersService.reopenWork(orderId, workDetails.departmentName);
    },
    onSuccess: () => {
      toast.success('Work reopened for editing');
      queryClient.invalidateQueries({ queryKey: ['orderWork', orderId] });
      queryClient.invalidateQueries({ queryKey: ['kanban-orders'] });
    },
    onError: (err: unknown) => {
      const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
      const errorMsg =
        axiosError?.response?.data?.message || axiosError?.message || 'Failed to reopen work';
      toast.error(errorMsg);
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
            errors[`photo_${photoReq.name}`] =
              `${photoReq.label} requires at least ${minCount} photo(s)`;
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
  void isDepartmentEnabled(configId); // reserved for future feature flag gating

  const isWorkComplete = workDetails.workData?.isComplete || false;
  const orderDetails = workDetails.order.orderDetails;

  // State for collapsible sections
  const [showTips, setShowTips] = useState(true);
  const [showMistakes, setShowMistakes] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Compact */}
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {requirements.departmentName}
                </h1>
                <p className="text-xs text-gray-500">Order: {workDetails.order.orderNumber}</p>
              </div>
            </div>

            {/* Status Badge */}
            {isWorkComplete ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                <CheckCircleSolidIcon className="w-4 h-4" />
                Completed
              </span>
            ) : workDetails.workData?.isDraft ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                <ClockIcon className="w-4 h-4" />
                Draft
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                <ArrowPathIcon className="w-4 h-4" />
                In Progress
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Two-Column Layout */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Left Sidebar - Sticky */}
          <aside className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-20 space-y-4">
              {/* Order Summary Card - Sidebar */}
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Order Details</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">Product Type</p>
                    <p className="text-sm font-medium text-gray-900">
                      {orderDetails?.productType || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Metal Type</p>
                    <p className="text-sm font-medium text-gray-900">
                      {orderDetails?.metalType || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Gold Weight</p>
                    <p className="text-sm font-medium text-gray-900">
                      {orderDetails?.goldWeightInitial
                        ? `${orderDetails.goldWeightInitial}g`
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Purity</p>
                    <p className="text-sm font-medium text-gray-900">
                      {orderDetails?.purity || 'N/A'}
                    </p>
                  </div>
                </div>

                {orderDetails?.specialInstructions && (
                  <div className="mt-3 p-2 bg-yellow-50 rounded border border-yellow-200">
                    <p className="text-xs font-medium text-yellow-800">Special Instructions:</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      {orderDetails.specialInstructions}
                    </p>
                  </div>
                )}

                {orderDetails?.productSpecifications &&
                  Object.keys(orderDetails.productSpecifications).length > 0 && (
                    <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                      <p className="text-xs font-medium text-blue-800 mb-2">Specifications:</p>
                      <div className="space-y-1">
                        {Object.entries(orderDetails.productSpecifications)
                          .filter(
                            ([_, value]) => value !== null && value !== undefined && value !== ''
                          )
                          .slice(0, 5)
                          .map(([key, value]) => (
                            <div key={key} className="text-xs">
                              <span className="text-blue-600 font-medium">
                                {formatSpecLabel(key)}:
                              </span>
                              <span className="text-blue-900 ml-1">{formatSpecValue(value)}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
              </div>

              {/* Tips Section - Collapsible */}
              {requirements.tips && requirements.tips.length > 0 && (
                <div className="bg-blue-50 rounded-lg border border-blue-200 overflow-hidden">
                  <button
                    onClick={() => setShowTips(!showTips)}
                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-blue-100 transition-colors"
                  >
                    <h3 className="text-sm font-medium text-blue-800 flex items-center gap-2">
                      <InformationCircleIcon className="w-4 h-4" />
                      Tips
                    </h3>
                    <svg
                      className={`w-4 h-4 text-blue-600 transition-transform ${showTips ? 'rotate-180' : ''}`}
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
                  {showTips && (
                    <ul className="px-4 pb-3 space-y-1">
                      {requirements.tips.map((tip, index) => (
                        <li key={index} className="text-xs text-blue-700 flex items-start gap-2">
                          <span className="text-blue-400 mt-0.5">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Common Mistakes - Collapsible */}
              {requirements.commonMistakes && requirements.commonMistakes.length > 0 && (
                <div className="bg-orange-50 rounded-lg border border-orange-200 overflow-hidden">
                  <button
                    onClick={() => setShowMistakes(!showMistakes)}
                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-orange-100 transition-colors"
                  >
                    <h3 className="text-sm font-medium text-orange-800 flex items-center gap-2">
                      <ExclamationTriangleIcon className="w-4 h-4" />
                      Common Mistakes
                    </h3>
                    <svg
                      className={`w-4 h-4 text-orange-600 transition-transform ${showMistakes ? 'rotate-180' : ''}`}
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
                  {showMistakes && (
                    <ul className="px-4 pb-3 space-y-1">
                      {requirements.commonMistakes.map((mistake, index) => (
                        <li key={index} className="text-xs text-orange-700 flex items-start gap-2">
                          <span className="text-orange-400 mt-0.5">•</span>
                          <span>{mistake}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 min-w-0 space-y-6">
            {/* Form Fields Section - Two Column Grid */}
            {requirements.formFields && requirements.formFields.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Work Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {requirements.formFields.map((field: FormField) => (
                    <div
                      key={field.name}
                      className={field.type === 'textarea' ? 'md:col-span-2' : ''}
                    >
                      {field.type !== 'checkbox' && (
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                      )}
                      {renderFormField(field)}
                      {field.helpText && (
                        <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>
                      )}
                      {validationErrors[field.name] && (
                        <p className="mt-1 text-xs text-red-500">{validationErrors[field.name]}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Photo Upload Section - Optimized */}
            {requirements.photoRequirements && requirements.photoRequirements.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <PhotoIcon className="w-5 h-5" />
                  Photo Documentation
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                          <div className="grid grid-cols-2 gap-2">
                            {categoryPhotos.map((photo) => (
                              <div key={photo.id} className="relative group">
                                <img
                                  src={photo.thumbnailUrl || photo.url}
                                  alt={photo.originalName}
                                  className="w-full h-20 object-cover rounded-lg"
                                />
                                {!isWorkComplete && (
                                  <button
                                    onClick={() => handleDeletePhoto(photo.id)}
                                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <XMarkIcon className="w-3 h-3" />
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
                    const categoryFiles = uploadedFiles.filter(
                      (f) => f && f.category === fileReq.name
                    );
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

            {/* Completed Notice */}
            {isWorkComplete && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-center">
                  <CheckCircleSolidIcon className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <h3 className="text-lg font-medium text-green-800">Work Completed</h3>
                  <p className="text-sm text-green-600">
                    This work has been submitted and marked as complete.
                  </p>
                  {workDetails.workData?.workCompletedAt && (
                    <p className="text-xs text-green-500 mt-1">
                      Completed at:{' '}
                      {new Date(workDetails.workData.workCompletedAt).toLocaleString()}
                    </p>
                  )}
                </div>

                {/* Admin-only: Reopen for Editing button */}
                {isAdmin && (
                  <div className="mt-4 pt-4 border-t border-green-200">
                    <button
                      onClick={() => reopenWorkMutation.mutate()}
                      disabled={reopenWorkMutation.isPending}
                      className="w-full px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {reopenWorkMutation.isPending ? (
                        <>
                          <ArrowPathIcon className="w-4 h-4 animate-spin" />
                          Reopening...
                        </>
                      ) : (
                        <>
                          <ArrowPathIcon className="w-4 h-4" />
                          Reopen for Editing
                        </>
                      )}
                    </button>
                    <p className="text-xs text-amber-700 mt-2 text-center">
                      Admin: Reopen this work to allow the worker to make corrections
                    </p>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Floating Action Bar */}
      {!isWorkComplete && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-10">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Auto-save Status */}
              <div className="flex items-center gap-3">
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
                      <span>
                        ✓ Last saved: {new Date(lastSavedRef.current).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                )}
                {!autoSaveMutation.isPending && !lastSavedRef.current && isDirty && (
                  <div className="text-sm text-amber-600">● Unsaved changes</div>
                )}

                {/* Keyboard Shortcuts Hint */}
                <div className="hidden lg:flex items-center gap-3 text-xs text-gray-400 ml-4">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-gray-100 border rounded text-gray-600 font-mono text-xs">
                      Ctrl+S
                    </kbd>
                    <span>Save</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-gray-100 border rounded text-gray-600 font-mono text-xs">
                      Ctrl+Enter
                    </kbd>
                    <span>Submit</span>
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleSaveDraft}
                  disabled={saveDraftMutation.isPending}
                  className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 font-medium"
                >
                  {saveDraftMutation.isPending ? 'Saving...' : 'Save Draft'}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || submitWorkMutation.isPending}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 font-medium shadow-sm"
                >
                  {isSubmitting ? (
                    <>
                      <ArrowPathIcon className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-5 h-5" />
                      Submit Work
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
