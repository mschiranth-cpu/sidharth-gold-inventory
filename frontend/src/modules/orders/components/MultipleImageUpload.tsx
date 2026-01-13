/**
 * ============================================
 * MULTIPLE IMAGE UPLOAD COMPONENT
 * ============================================
 *
 * Upload multiple images with drag and drop support
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import React, { useCallback, useState } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import type { ImagePreview } from '../../../types/order.types';

interface MultipleImageUploadProps {
  value?: ImagePreview[];
  onChange: (images: ImagePreview[]) => void;
  error?: string;
  maxSize?: number; // in MB
  maxImages?: number;
  acceptedFormats?: string[];
}

const MultipleImageUpload: React.FC<MultipleImageUploadProps> = ({
  value = [],
  onChange,
  error,
  maxSize = 5,
  maxImages = 5,
  acceptedFormats = ['image/jpeg', 'image/png', 'image/webp'],
}) => {
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

      if (value.length >= maxImages) {
        setUploadError(`Maximum ${maxImages} images allowed`);
        return;
      }

      if (acceptedFiles.length > 0) {
        const newImages: ImagePreview[] = [];
        let processed = 0;

        acceptedFiles.forEach((file) => {
          if (value.length + newImages.length < maxImages) {
            const reader = new FileReader();
            reader.onloadend = () => {
              newImages.push({
                id: `${Date.now()}-${Math.random()}`,
                file,
                preview: reader.result as string,
              });
              processed++;

              if (
                processed === acceptedFiles.length ||
                value.length + newImages.length >= maxImages
              ) {
                onChange([...value, ...newImages]);
              }
            };
            reader.readAsDataURL(file);
          }
        });
      }
    },
    [onChange, maxSize, maxImages, value]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: acceptedFormats.reduce((acc, format) => ({ ...acc, [format]: [] }), {}),
    maxSize: maxSize * 1024 * 1024,
    multiple: true,
    disabled: value.length >= maxImages,
  });

  const handleRemove = (id: string) => {
    const updatedImages = value.filter((img) => img.id !== id);
    onChange(updatedImages);
  };

  const displayError = error || uploadError;
  const canAddMore = value.length < maxImages;

  return (
    <div className="w-full">
      {/* Image Previews Grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          {value.map((image, index) => (
            <div key={image.id} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-indigo-400 transition-colors">
                <img
                  src={image.preview}
                  alt={`Product ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => handleRemove(image.id)}
                className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg opacity-0 group-hover:opacity-100"
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
              {index === 0 && (
                <span className="absolute top-2 left-2 px-2 py-1 bg-indigo-600 text-white text-xs font-medium rounded-md">
                  Primary
                </span>
              )}
            </div>
          ))}

          {/* Add More Button */}
          {canAddMore && (
            <div
              {...getRootProps()}
              className={`aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
                isDragActive
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/50'
              }`}
            >
              <input {...getInputProps()} />
              <div className="text-center p-4">
                <div className="w-12 h-12 mx-auto rounded-full bg-indigo-100 flex items-center justify-center mb-2">
                  <svg
                    className="w-6 h-6 text-indigo-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-700">Add Image</p>
                <p className="text-xs text-gray-500 mt-1">
                  {value.length}/{maxImages}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Initial Upload Area (shown when no images) */}
      {value.length === 0 && (
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
              <p className="text-indigo-600 font-medium">Drop the images here...</p>
            ) : (
              <>
                <p className="text-gray-700 font-medium">
                  Drag and drop images, or <span className="text-indigo-600">browse</span>
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  PNG, JPG, WEBP up to {maxSize}MB (max {maxImages} images)
                </p>
              </>
            )}
          </div>
        </div>
      )}

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

      {!displayError && value.length > 0 && canAddMore && (
        <p className="mt-2 text-xs text-gray-500">
          You can upload {maxImages - value.length} more image
          {maxImages - value.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
};

export default MultipleImageUpload;
