/**
 * ============================================
 * STEP 1: BASIC INFO
 * ============================================
 *
 * First step of order creation - basic order information.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import MultipleImageUpload from './MultipleImageUpload';
import type { BasicInfoFormData, ImagePreview } from '../../../types/order.types';

interface BasicInfoStepProps {
  form: UseFormReturn<BasicInfoFormData>;
  orderNumber: string;
}

const BasicInfoStep: React.FC<BasicInfoStepProps> = ({ form, orderNumber }) => {
  const {
    register,
    formState: { errors },
    setValue,
    watch,
  } = form;

  const productImages = watch('productImages') || [];

  const handleImagesChange = (images: ImagePreview[]) => {
    setValue('productImages', images, { shouldValidate: true });
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
        <p className="mt-1 text-sm text-gray-500">Enter the basic details for this order</p>
      </div>

      {/* Order Number (Auto-generated) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Order Number</label>
        <input
          type="text"
          value={orderNumber}
          disabled
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-100 text-gray-600 cursor-not-allowed"
        />
        <input type="hidden" {...register('orderNumber')} value={orderNumber} />
        <p className="mt-1 text-xs text-gray-400">Auto-generated order number</p>
      </div>

      {/* Customer Name */}
      <div>
        <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1.5">
          Customer Name <span className="text-red-500">*</span>
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
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <input
            id="customerName"
            type="text"
            {...register('customerName')}
            className={`w-full pl-10 pr-4 py-2.5 border rounded-xl transition-colors ${
              errors.customerName
                ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-200 bg-gray-50 hover:bg-white focus:bg-white focus:ring-indigo-500 focus:border-indigo-500'
            } focus:outline-none focus:ring-2`}
            placeholder="Enter customer name"
          />
        </div>
        {errors.customerName && (
          <p className="mt-1.5 text-sm text-red-600">{errors.customerName.message}</p>
        )}
      </div>

      {/* Customer Contact Info Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Phone */}
        <div>
          <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 mb-1.5">
            Phone Number <span className="text-red-500">*</span>
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
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
            </div>
            <input
              id="customerPhone"
              type="tel"
              {...register('customerPhone')}
              maxLength={10}
              onInput={(e) => {
                const target = e.target as HTMLInputElement;
                target.value = target.value.replace(/[^0-9]/g, '');
              }}
              className={`w-full pl-10 pr-4 py-2.5 border rounded-xl transition-colors ${
                errors.customerPhone
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-200 bg-gray-50 hover:bg-white focus:bg-white'
              } focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
              placeholder="9876543210"
            />
          </div>
          {errors.customerPhone && (
            <p className="mt-1.5 text-sm text-red-600">{errors.customerPhone.message}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700 mb-1.5">
            Email Address <span className="text-red-500">*</span>
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
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <input
              id="customerEmail"
              type="email"
              {...register('customerEmail')}
              className={`w-full pl-10 pr-4 py-2.5 border rounded-xl transition-colors ${
                errors.customerEmail
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-200 bg-gray-50 hover:bg-white focus:bg-white'
              } focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
              placeholder="customer@example.com"
            />
          </div>
          {errors.customerEmail && (
            <p className="mt-1.5 text-sm text-red-600">{errors.customerEmail.message}</p>
          )}
        </div>
      </div>

      {/* Product Image Upload */}
      {/* Product Images Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Product Images <span className="text-red-500">*</span>
        </label>
        <MultipleImageUpload
          value={productImages}
          onChange={handleImagesChange}
          error={errors.productImages?.message as string}
          maxSize={5}
          maxImages={5}
        />
        <p className="mt-2 text-xs text-gray-400">
          Upload reference images for the jewelry design (first image will be primary)
        </p>
      </div>
    </div>
  );
};

export default BasicInfoStep;
