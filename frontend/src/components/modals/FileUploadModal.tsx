/**
 * ============================================
 * FILE UPLOAD MODAL
 * ============================================
 *
 * Modal for uploading files/photos to an order.
 * Supports drag & drop and file category selection.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import React, { useState, useCallback, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { XMarkIcon, CloudArrowUpIcon, DocumentIcon, TrashIcon } from '@heroicons/react/24/outline';
import { ordersService } from '../../modules/orders/services';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber: string;
}

type FileCategory = 'product' | 'completion' | 'reference';

interface UploadFile {
  id: string;
  file: File;
  preview: string;
  category: FileCategory;
  uploading: boolean;
  error?: string;
}

const CATEGORY_OPTIONS: { value: FileCategory; label: string; description: string }[] = [
  {
    value: 'product',
    label: 'Product Photo',
    description: 'Main product reference photo',
  },
  {
    value: 'reference',
    label: 'Reference Image',
    description: 'Additional reference images for the order',
  },
  {
    value: 'completion',
    label: 'Completion Photo',
    description: 'Final completed product photos',
  },
];

export function FileUploadModal({ isOpen, onClose, orderId, orderNumber }: FileUploadModalProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<FileCategory>('reference');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (uploadFile: UploadFile) => {
      // Convert file to base64
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          resolve(base64);
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(uploadFile.file);
      });
    },
  });

  // Handle file drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const droppedFiles = Array.from(e.dataTransfer.files);
      const imageFiles = droppedFiles.filter((file) => file.type.startsWith('image/'));

      if (imageFiles.length === 0) {
        toast.error('Please drop image files only');
        return;
      }

      const newFiles: UploadFile[] = imageFiles.map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        preview: URL.createObjectURL(file),
        category: selectedCategory,
        uploading: false,
      }));

      setFiles((prev) => [...prev, ...newFiles]);
    },
    [selectedCategory]
  );

  // Handle file select
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = e.target.files;
      if (!selectedFiles) return;

      const imageFiles = Array.from(selectedFiles).filter((file) => file.type.startsWith('image/'));

      if (imageFiles.length === 0) {
        toast.error('Please select image files only');
        return;
      }

      const newFiles: UploadFile[] = imageFiles.map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        preview: URL.createObjectURL(file),
        category: selectedCategory,
        uploading: false,
      }));

      setFiles((prev) => [...prev, ...newFiles]);

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [selectedCategory]
  );

  // Remove file
  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  // Update file category
  const updateFileCategory = useCallback((id: string, category: FileCategory) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, category } : f)));
  }, []);

  // Upload all files
  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Please select files to upload');
      return;
    }

    // Mark all as uploading
    setFiles((prev) => prev.map((f) => ({ ...f, uploading: true, error: undefined })));

    let successCount = 0;
    let errorCount = 0;

    for (const uploadFile of files) {
      try {
        const base64 = await uploadMutation.mutateAsync(uploadFile);

        // Upload based on category
        if (uploadFile.category === 'product') {
          // Update product photo
          await ordersService.uploadPhoto(orderId, base64);
        } else if (uploadFile.category === 'reference') {
          // Add to reference images
          await ordersService.addReferenceImage(orderId, base64);
        } else if (uploadFile.category === 'completion') {
          // Add to completion photos
          await ordersService.addCompletionPhoto(orderId, base64);
        }

        successCount++;
        setFiles((prev) => prev.filter((f) => f.id !== uploadFile.id));
        URL.revokeObjectURL(uploadFile.preview);
      } catch (error) {
        errorCount++;
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id ? { ...f, uploading: false, error: 'Upload failed' } : f
          )
        );
      }
    }

    // Show results
    if (successCount > 0) {
      toast.success(`${successCount} file(s) uploaded successfully`);
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} file(s) failed to upload`);
    }

    // Close if all succeeded
    if (errorCount === 0) {
      onClose();
    }
  };

  // Cleanup on close
  const handleClose = useCallback(() => {
    files.forEach((f) => URL.revokeObjectURL(f.preview));
    setFiles([]);
    onClose();
  }, [files, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Upload Files</h2>
              <p className="text-sm text-gray-500 mt-0.5">Order: {orderNumber}</p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
            {/* Category Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">File Category</label>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedCategory(option.value)}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      selectedCategory === option.value
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-sm text-gray-900">{option.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{option.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
                ${
                  isDragging
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-300 hover:border-gray-400'
                }
              `}
            >
              <CloudArrowUpIcon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-sm font-medium text-gray-900">
                Drop files here or click to browse
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Supports: JPG, PNG, GIF, WebP (Max 10MB each)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="mt-4 space-y-3">
                <div className="text-sm font-medium text-gray-700">
                  {files.length} file(s) selected
                </div>
                {files.map((file) => (
                  <div
                    key={file.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      file.error ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    {/* Preview */}
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                      {file.file.type.startsWith('image/') ? (
                        <img
                          src={file.preview}
                          alt={file.file.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <DocumentIcon className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{file.file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(file.file.size / 1024).toFixed(1)} KB
                      </p>
                      {file.error && <p className="text-xs text-red-600 mt-0.5">{file.error}</p>}
                    </div>

                    {/* Category Selector */}
                    <select
                      value={file.category}
                      onChange={(e) => updateFileCategory(file.id, e.target.value as FileCategory)}
                      disabled={file.uploading}
                      className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                    >
                      {CATEGORY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>

                    {/* Status / Remove */}
                    {file.uploading ? (
                      <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(file.id);
                        }}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={files.length === 0 || uploadMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {uploadMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <CloudArrowUpIcon className="w-4 h-4" />
                  Upload {files.length > 0 ? `(${files.length})` : ''}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FileUploadModal;
