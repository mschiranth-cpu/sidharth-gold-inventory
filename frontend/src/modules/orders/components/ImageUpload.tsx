/**
 * ============================================
 * IMAGE UPLOAD COMPONENT
 * ============================================
 *
 * Drag and drop image upload with preview using react-dropzone.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import React, { useCallback, useState } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';

interface ImageUploadProps {
  value?: string;
  onChange: (file: File | null, preview: string) => void;
  error?: string;
  maxSize?: number; // in MB
  acceptedFormats?: string[];
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  error,
  maxSize = 5,
  acceptedFormats = ['image/jpeg', 'image/png', 'image/webp'],
}) => {
  const [preview, setPreview] = useState<string>(value || '');
  const [uploadError, setUploadError] = useState<string>('');

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      setUploadError('');

      if (rejectedFiles.length > 0) {
        const firstRejection = rejectedFiles[0];
        const firstError = firstRejection?.errors[0];
        if (!firstError) {
          setUploadError('Unknown upload error');
          return;
        }
        if (firstError.message.includes('file-too-large')) {
          setUploadError(`File is too large. Max size is ${maxSize}MB`);
        } else if (firstError.message.includes('file-invalid-type')) {
          setUploadError('Invalid file type. Please upload an image');
        } else {
          setUploadError(firstError.message);
        }
        return;
      }

      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
          const previewUrl = reader.result as string;
          setPreview(previewUrl);
          onChange(file, previewUrl);
        };
        reader.readAsDataURL(file);
      }
    },
    [onChange, maxSize]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: acceptedFormats.reduce((acc, format) => ({ ...acc, [format]: [] }), {}),
    maxSize: maxSize * 1024 * 1024,
    maxFiles: 1,
    multiple: false,
  });

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview('');
    onChange(null, '');
  };

  const displayError = error || uploadError;

  return (
    <div className="w-full">
      <div className="relative">
        <div
          {...getRootProps()}
          className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
            isDragActive
              ? 'border-indigo-500 bg-indigo-50'
              : isDragReject
              ? 'border-red-500 bg-red-50'
              : displayError
              ? 'border-red-300 bg-red-50'
              : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/50'
          }`}
        >
          <input {...getInputProps()} />

          {preview ? (
            <div className="relative">
              <img
                src={preview}
                alt="Product preview"
                className="max-h-48 mx-auto rounded-lg object-contain"
              />
              <p className="text-sm text-gray-500 mt-3">Click or drag to replace image</p>
            </div>
          ) : (
            <div className="py-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-indigo-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              {isDragActive ? (
                <p className="text-indigo-600 font-medium">Drop the image here...</p>
              ) : (
                <>
                  <p className="text-gray-700 font-medium">
                    Drag and drop an image, or <span className="text-indigo-600">browse</span>
                  </p>
                  <p className="text-sm text-gray-500 mt-2">PNG, JPG, WEBP up to {maxSize}MB</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Remove button - outside the dropzone */}
        {preview && (
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg z-10"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {displayError && (
        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {displayError}
        </p>
      )}
    </div>
  );
};

export default ImageUpload;
