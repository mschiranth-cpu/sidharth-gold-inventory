/**
 * ============================================
 * STEP 4: ADDITIONAL INFO
 * ============================================
 *
 * Fourth step of order creation - additional details.
 * Size, due date, priority, and description.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import React, { useRef } from 'react';
import { UseFormReturn, Controller } from 'react-hook-form';
import {
  PRIORITY_OPTIONS,
  MAKING_CHARGE_TYPE_OPTIONS,
  CLASP_TYPE_OPTIONS,
  POLISH_TYPE_OPTIONS,
  CERTIFICATION_OPTIONS,
  PURITY_OPTIONS,
  DELIVERY_METHOD_OPTIONS,
  OCCASION_OPTIONS,
  DESIGN_CATEGORY_OPTIONS,
  WARRANTY_PERIOD_OPTIONS,
  PAYMENT_TERMS_OPTIONS,
} from '../../../types/order.types';
import type { AdditionalInfoFormData } from '../../../types/order.types';
import DatePicker from './DatePicker';

interface AdditionalInfoStepProps {
  form: UseFormReturn<AdditionalInfoFormData>;
}

const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_CAD_FILES = 3;
const MAX_CAD_SIZE = 50 * 1024 * 1024; // 50MB for CAD files
const CAD_EXTENSIONS = ['.stl', '.3dm', '.dwg', '.step', '.iges', '.obj'];

const AdditionalInfoStep: React.FC<AdditionalInfoStepProps> = ({ form }) => {
  const {
    register,
    control,
    formState: { errors },
    watch,
    setValue,
  } = form;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cadInputRef = useRef<HTMLInputElement>(null);
  const selectedPriority = watch('priority');
  const referenceImages = watch('referenceImages') || [];
  const referenceImagePreviews = watch('referenceImagePreviews') || [];
  const cadFiles = watch('cadFiles') || [];
  const cadFilePreviews = watch('cadFilePreviews') || [];
  const usingCustomerGold = watch('usingCustomerGold');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const currentCount = referenceImages.length;
    const remainingSlots = MAX_IMAGES - currentCount;

    if (remainingSlots <= 0) {
      alert(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }

    const newFiles: File[] = [];
    const newPreviews: string[] = [];

    Array.from(files)
      .slice(0, remainingSlots)
      .forEach((file) => {
        if (file.size > MAX_IMAGE_SIZE) {
          alert(`${file.name} is too large. Max size is 5MB`);
          return;
        }
        if (!file.type.startsWith('image/')) {
          alert(`${file.name} is not an image`);
          return;
        }
        newFiles.push(file);
        newPreviews.push(URL.createObjectURL(file));
      });

    setValue('referenceImages', [...referenceImages, ...newFiles]);
    setValue('referenceImagePreviews', [...referenceImagePreviews, ...newPreviews]);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = [...referenceImages];
    const newPreviews = [...referenceImagePreviews];

    // Revoke URL to prevent memory leak
    URL.revokeObjectURL(newPreviews[index] || '');

    newImages.splice(index, 1);
    newPreviews.splice(index, 1);

    setValue('referenceImages', newImages);
    setValue('referenceImagePreviews', newPreviews);
  };

  // CAD File Handlers
  const handleCadUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const currentCount = cadFiles.length;
    const remainingSlots = MAX_CAD_FILES - currentCount;

    if (remainingSlots <= 0) {
      alert(`Maximum ${MAX_CAD_FILES} CAD files allowed`);
      return;
    }

    const newFiles: File[] = [];
    const newPreviews: string[] = [];

    Array.from(files)
      .slice(0, remainingSlots)
      .forEach((file) => {
        const ext = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!CAD_EXTENSIONS.includes(ext)) {
          alert(`${file.name} is not a valid CAD file`);
          return;
        }
        if (file.size > MAX_CAD_SIZE) {
          alert(`${file.name} is too large. Max size is 50MB`);
          return;
        }
        newFiles.push(file);
        newPreviews.push(file.name);
      });

    setValue('cadFiles', [...cadFiles, ...newFiles]);
    setValue('cadFilePreviews', [...cadFilePreviews, ...newPreviews]);

    if (cadInputRef.current) {
      cadInputRef.current.value = '';
    }
  };

  const handleRemoveCad = (index: number) => {
    const newFiles = [...cadFiles];
    const newPreviews = [...cadFilePreviews];
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);
    setValue('cadFiles', newFiles);
    setValue('cadFilePreviews', newPreviews);
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-xl font-semibold text-gray-900">Additional Information</h2>
        <p className="mt-1 text-sm text-gray-500">
          Set the due date, priority, and any special requirements
        </p>
      </div>

      {/* Size and Due Date Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Size */}
        <div>
          <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-1.5">
            Size
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
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
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              </svg>
            </div>
            <input
              id="size"
              type="text"
              {...register('size')}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 bg-gray-50 hover:bg-white focus:bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              placeholder="e.g. 7, 16 inches, etc."
            />
          </div>
          <p className="mt-1 text-xs text-gray-400">Ring size, chain length, or bangle diameter</p>
        </div>

        {/* Due Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Due Date <span className="text-red-500">*</span>
          </label>
          <Controller
            name="dueDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                value={field.value}
                onChange={field.onChange}
                minDate={new Date()}
                placeholder="Select due date"
                error={errors.dueDate?.message}
              />
            )}
          />
        </div>
      </div>

      {/* Priority Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Priority <span className="text-red-500">*</span>
        </label>
        <Controller
          name="priority"
          control={control}
          render={({ field }) => (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {PRIORITY_OPTIONS.map((option) => {
                const isSelected = field.value === option.value;
                const colorClasses = {
                  LOW: {
                    selected: 'border-green-500 bg-green-50',
                    text: 'text-green-700',
                    icon: 'bg-green-500',
                  },
                  NORMAL: {
                    selected: 'border-blue-500 bg-blue-50',
                    text: 'text-blue-700',
                    icon: 'bg-blue-500',
                  },
                  HIGH: {
                    selected: 'border-orange-500 bg-orange-50',
                    text: 'text-orange-700',
                    icon: 'bg-orange-500',
                  },
                  URGENT: {
                    selected: 'border-red-500 bg-red-50',
                    text: 'text-red-700',
                    icon: 'bg-red-500',
                  },
                };
                const colors = colorClasses[option.value as keyof typeof colorClasses];

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => field.onChange(option.value)}
                    className={`relative p-4 rounded-xl border-2 text-center transition-all ${
                      isSelected
                        ? colors.selected
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <span
                      className={`block text-lg font-semibold ${
                        isSelected ? colors.text : 'text-gray-700'
                      }`}
                    >
                      {option.label}
                    </span>
                    {isSelected && (
                      <div
                        className={`absolute top-2 right-2 w-4 h-4 rounded-full ${colors.icon} flex items-center justify-center`}
                      >
                        <svg
                          className="w-2.5 h-2.5 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        />
        {errors.priority && (
          <p className="mt-1.5 text-sm text-red-600">{errors.priority.message}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">
          Description
        </label>
        <textarea
          id="description"
          rows={4}
          {...register('description')}
          className="w-full px-4 py-3 border border-gray-200 bg-gray-50 hover:bg-white focus:bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
          placeholder="Describe the jewelry item (e.g., style, design elements, etc.)"
        />
        <p className="mt-1 text-xs text-gray-400">
          Provide details about the design and specifications
        </p>
      </div>

      {/* Special Instructions */}
      <div>
        <label
          htmlFor="specialInstructions"
          className="block text-sm font-medium text-gray-700 mb-1.5"
        >
          Special Instructions
        </label>
        <textarea
          id="specialInstructions"
          rows={3}
          {...register('specialInstructions')}
          className="w-full px-4 py-3 border border-gray-200 bg-gray-50 hover:bg-white focus:bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
          placeholder="Any special requirements or handling instructions"
        />
      </div>

      {/* Reference Images (Multiple) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Additional Reference Images
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Upload additional reference images (design sketches, inspiration photos, etc.)
        </p>

        {/* Image Previews */}
        {referenceImagePreviews && referenceImagePreviews.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-3">
            {referenceImagePreviews.map((preview, index) => (
              <div key={index} className="relative group">
                <img
                  src={preview}
                  alt={`Reference ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
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
              </div>
            ))}
          </div>
        )}

        {/* Upload Area */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 hover:border-indigo-400 rounded-xl p-6 text-center cursor-pointer transition-colors hover:bg-indigo-50/30"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />
          <svg
            className="w-10 h-10 mx-auto text-gray-400 mb-2"
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
          <p className="text-sm text-gray-600">Click to upload images</p>
          <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP up to 5MB each (max 5 images)</p>
        </div>
      </div>

      {/* CAD Files Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Design/CAD Files</label>
        <p className="text-xs text-gray-500 mb-3">
          Upload CAD files (.STL, .3DM, .DWG, .STEP, .IGES, .OBJ) - max 50MB each
        </p>

        {/* CAD File List */}
        {cadFilePreviews && cadFilePreviews.length > 0 && (
          <div className="mb-3 space-y-2">
            {cadFilePreviews.map((preview, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200"
              >
                <span className="text-sm text-gray-700">{preview}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveCad(index)}
                  className="text-red-500 hover:text-red-700"
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
              </div>
            ))}
          </div>
        )}

        <div
          onClick={() => cadInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 hover:border-indigo-400 rounded-xl p-6 text-center cursor-pointer transition-colors hover:bg-indigo-50/30"
        >
          <input
            ref={cadInputRef}
            type="file"
            accept=".stl,.3dm,.dwg,.step,.iges,.obj"
            multiple
            onChange={handleCadUpload}
            className="hidden"
          />
          <svg
            className="w-10 h-10 mx-auto text-gray-400 mb-2"
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
          <p className="text-sm text-gray-600">Click to upload CAD files</p>
          <p className="text-xs text-gray-400 mt-1">Max 3 files, 50MB each</p>
        </div>
      </div>

      {/* Hallmark Details */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <label className="flex items-center gap-3 cursor-pointer mb-3">
          <input type="checkbox" {...register('hallmarkRequired')} className="w-4 h-4" />
          <span className="text-sm font-medium text-gray-700">Hallmark Required (India)</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 space-y-0">
          <input
            type="text"
            {...register('huidNumber')}
            placeholder="HUID Number"
            className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm"
          />
          <input
            type="text"
            {...register('bisHallmark')}
            placeholder="BIS Hallmark"
            className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm"
          />
        </div>
      </div>

      {/* Pricing Details */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">Pricing Details</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Controller
            name="makingChargeType"
            control={control}
            render={({ field }) => (
              <select {...field} className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm">
                <option value="">Making Charge Type</option>
                {MAKING_CHARGE_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}
          />
          <input
            type="number"
            step="0.01"
            {...register('makingChargeValue', { valueAsNumber: true })}
            placeholder="Value"
            className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm"
          />
          <input
            type="number"
            step="0.1"
            {...register('wastagePercentage', { valueAsNumber: true })}
            placeholder="Wastage %"
            className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm"
          />
        </div>
        <input
          type="number"
          step="0.01"
          {...register('laborCharges', { valueAsNumber: true })}
          placeholder="Labor Charges"
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm"
        />
      </div>

      {/* Manufacturing Instructions */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">Manufacturing Details</label>
        <textarea
          {...register('meltingInstructions')}
          rows={2}
          placeholder="Alloy composition requirements..."
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Controller
            name="claspType"
            control={control}
            render={({ field }) => (
              <select {...field} className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm">
                <option value="">Clasp/Lock Type</option>
                {CLASP_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}
          />
          <input
            type="text"
            {...register('engravingText')}
            placeholder="Engraving text"
            className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Controller
            name="polishType"
            control={control}
            render={({ field }) => (
              <select {...field} className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm">
                <option value="">Polish Type</option>
                {POLISH_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}
          />
          <label className="flex items-center gap-2 py-2.5">
            <input type="checkbox" {...register('rhodiumPlating')} className="w-4 h-4" />
            <span className="text-sm text-gray-700">Rhodium Plating (for white gold)</span>
          </label>
        </div>
      </div>

      {/* Certification & Gold */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Controller
          name="certificationRequired"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Certification
              </label>
              <select
                {...field}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm"
              >
                {CERTIFICATION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        />
        <label className="flex items-center gap-2 pt-7">
          <input type="checkbox" {...register('usingCustomerGold')} className="w-4 h-4" />
          <span className="text-sm font-medium text-gray-700">Using Customer's Old Gold</span>
        </label>
      </div>

      {/* Customer's Old Gold Details */}
      {usingCustomerGold && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Customer Gold Weight (g)
            </label>
            <input
              type="number"
              step="0.01"
              {...register('customerGoldWeight', { valueAsNumber: true })}
              placeholder="grams"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Customer Gold Purity
            </label>
            <Controller
              name="customerGoldPurity"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                >
                  <option value="">Select purity</option>
                  {PURITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.percentage}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}
            />
          </div>
        </div>
      )}

      {/* Priority Info Card */}
      {selectedPriority && (
        <div
          className={`rounded-xl p-4 ${
            selectedPriority === 'URGENT'
              ? 'bg-red-50 border border-red-200'
              : selectedPriority === 'HIGH'
              ? 'bg-orange-50 border border-orange-200'
              : selectedPriority === 'NORMAL'
              ? 'bg-blue-50 border border-blue-200'
              : 'bg-green-50 border border-green-200'
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`p-2 rounded-lg ${
                selectedPriority === 'URGENT'
                  ? 'bg-red-100'
                  : selectedPriority === 'HIGH'
                  ? 'bg-orange-100'
                  : selectedPriority === 'NORMAL'
                  ? 'bg-blue-100'
                  : 'bg-green-100'
              }`}
            >
              {selectedPriority === 'URGENT' ? (
                <svg
                  className="w-5 h-5 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              ) : selectedPriority === 'HIGH' ? (
                <svg
                  className="w-5 h-5 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 15l7-7 7 7"
                  />
                </svg>
              ) : selectedPriority === 'NORMAL' ? (
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
            <div>
              <h4
                className={`font-medium ${
                  selectedPriority === 'URGENT'
                    ? 'text-red-700'
                    : selectedPriority === 'HIGH'
                    ? 'text-orange-700'
                    : selectedPriority === 'NORMAL'
                    ? 'text-blue-700'
                    : 'text-green-700'
                }`}
              >
                {selectedPriority === 'URGENT'
                  ? 'Urgent Priority'
                  : selectedPriority === 'HIGH'
                  ? 'High Priority'
                  : selectedPriority === 'NORMAL'
                  ? 'Normal Priority'
                  : 'Low Priority'}
              </h4>
              <p
                className={`text-sm ${
                  selectedPriority === 'URGENT'
                    ? 'text-red-600'
                    : selectedPriority === 'HIGH'
                    ? 'text-orange-600'
                    : selectedPriority === 'NORMAL'
                    ? 'text-blue-600'
                    : 'text-green-600'
                }`}
              >
                {selectedPriority === 'URGENT'
                  ? 'This order will be processed immediately and prioritized over all others.'
                  : selectedPriority === 'HIGH'
                  ? 'This order will be given priority in the production queue.'
                  : selectedPriority === 'NORMAL'
                  ? 'This order will be processed in standard production queue.'
                  : 'This order can be processed when there is available capacity.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================
        LOGISTICS & CLASSIFICATION
      ============================================ */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Logistics & Classification</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Delivery Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Delivery Method *
            </label>
            <select
              {...register('deliveryMethod')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select delivery method</option>
              {DELIVERY_METHOD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Customer Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Address</label>
            <textarea
              {...register('customerAddress')}
              placeholder="Enter customer address"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          {/* Occasion/Purpose */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Occasion/Purpose</label>
            <select
              {...register('occasion')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select occasion</option>
              {OCCASION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Design Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Design Category</label>
            <select
              {...register('designCategory')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select category</option>
              {DESIGN_CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Warranty Period */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Warranty Period</label>
            <select
              {...register('warrantyPeriod')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select warranty</option>
              {WARRANTY_PERIOD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Exchange Policy */}
          <div className="flex items-center pt-2">
            <input
              type="checkbox"
              {...register('exchangeAllowed')}
              id="exchangeAllowed"
              className="h-4 w-4 text-blue-600"
            />
            <label htmlFor="exchangeAllowed" className="ml-2 text-sm text-gray-700">
              Exchange allowed for this order
            </label>
          </div>
        </div>
      </div>

      {/* ============================================
          PAYMENT TERMS & GOLD RATE
        ============================================ */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment & Gold Rate</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Payment Terms */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Terms *</label>
            <select
              {...register('paymentTerms')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select payment terms</option>
              {PAYMENT_TERMS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Advance Percentage (show if ADVANCE_50 or CUSTOM selected) */}
          {['ADVANCE_50', 'CUSTOM'].includes(watch('paymentTerms') || '') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Advance Percentage (%)
              </label>
              <input
                type="number"
                {...register('advancePercentage', {
                  min: 0,
                  max: 100,
                })}
                placeholder="Enter advance percentage"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          )}

          {/* Gold Rate Lock */}
          <div className="flex items-center pt-2">
            <input
              type="checkbox"
              {...register('goldRateLocked')}
              id="goldRateLocked"
              className="h-4 w-4 text-blue-600"
            />
            <label htmlFor="goldRateLocked" className="ml-2 text-sm text-gray-700">
              Lock gold rate at time of order
            </label>
          </div>

          {/* Expected Gold Rate (show if locked) */}
          {watch('goldRateLocked') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expected Gold Rate (per gram)
              </label>
              <input
                type="number"
                {...register('expectedGoldRate', {
                  min: 0,
                })}
                placeholder="Enter gold rate"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          )}
        </div>
      </div>

      {/* ============================================
        PRICE ESTIMATION
      ============================================ */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Price Estimation</h3>
        <p className="text-sm text-gray-600 mb-4">
          Provide cost estimates for this order. These can be manually entered or auto-calculated
          based on current rates.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Estimated Gold Cost */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estimated Gold Cost (₹)
            </label>
            <input
              type="number"
              {...register('estimatedGoldCost', {
                min: 0,
              })}
              placeholder="Gold cost"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          {/* Estimated Stone Cost */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estimated Stone Cost (₹)
            </label>
            <input
              type="number"
              {...register('estimatedStoneCost', {
                min: 0,
              })}
              placeholder="Stone cost"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          {/* Estimated Making Charges */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estimated Making Charges (₹)
            </label>
            <input
              type="number"
              {...register('estimatedMakingCharges', {
                min: 0,
              })}
              placeholder="Making charges"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          {/* Estimated Other Charges */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estimated Other Charges (₹)
            </label>
            <input
              type="number"
              {...register('estimatedOtherCharges', {
                min: 0,
              })}
              placeholder="Other charges (certification, etc.)"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          {/* Estimated Total Cost */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estimated Total Cost (₹)
            </label>
            <input
              type="number"
              {...register('estimatedTotalCost', {
                min: 0,
              })}
              placeholder="Total estimated cost"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg font-semibold text-lg"
            />
            <p className="text-xs text-gray-500 mt-1">
              This can be manually entered or calculated from the above fields
            </p>
          </div>
        </div>
      </div>

      {/* ============================================
        TEMPLATE & CLONING
      ============================================ */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Template & Order Management</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Save as Template */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Save as Template (Optional)
            </label>
            <input
              type="text"
              {...register('templateName')}
              placeholder="e.g., 'Gold Ring - 10g Standard'"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">
              Save this order configuration as a reusable template
            </p>
          </div>

          {/* Clone Reference */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cloned From Order ID (Read-only)
            </label>
            <input
              type="text"
              {...register('clonedFromOrderId')}
              placeholder="Auto-filled if cloned"
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
            <p className="text-xs text-gray-500 mt-1">
              Tracks if this order was cloned from another order
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdditionalInfoStep;
