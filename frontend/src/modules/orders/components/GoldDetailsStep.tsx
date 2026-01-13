/**
 * ============================================
 * STEP 2: GOLD DETAILS
 * ============================================
 *
 * Second step of order creation - gold specifications.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import React, { useEffect } from 'react';
import { UseFormReturn, Controller } from 'react-hook-form';
import {
  GoldPurity,
  PURITY_OPTIONS,
  GoldFinish,
  SilverFinish,
  PlatinumFinish,
  GOLD_FINISH_OPTIONS,
  SILVER_FINISH_OPTIONS,
  PLATINUM_FINISH_OPTIONS,
  PRODUCT_TYPE_OPTIONS,
  ProductType,
} from '../../../types/order.types';
import type { GoldDetailsFormData } from '../../../types/order.types';
import { ProductSpecificationsFields } from './ProductSpecificationsFields';

interface GoldDetailsStepProps {
  form: UseFormReturn<GoldDetailsFormData>;
}

const GoldDetailsStep: React.FC<GoldDetailsStepProps> = ({ form }) => {
  const {
    register,
    control,
    formState: { errors },
    watch,
    setValue,
  } = form;

  const selectedPurity = watch('purity');
  const metalType = watch('metalType');
  const metalFinish = watch('metalFinish');
  const productType = watch('productType');

  // Get finish options based on metal type
  const getFinishOptions = () => {
    switch (metalType) {
      case 'GOLD':
        return GOLD_FINISH_OPTIONS;
      case 'SILVER':
        return SILVER_FINISH_OPTIONS;
      case 'PLATINUM':
        return PLATINUM_FINISH_OPTIONS;
      default:
        return GOLD_FINISH_OPTIONS;
    }
  };

  // Get default finish for metal type
  const getDefaultFinish = (type: string) => {
    switch (type) {
      case 'GOLD':
        return GoldFinish.YELLOW_GOLD;
      case 'SILVER':
        return SilverFinish.STERLING_SILVER;
      case 'PLATINUM':
        return PlatinumFinish.POLISHED_PLATINUM;
      default:
        return GoldFinish.YELLOW_GOLD;
    }
  };

  // Check if current finish is "Other"
  const isOtherFinish =
    metalFinish === GoldFinish.OTHER_GOLD ||
    metalFinish === SilverFinish.OTHER_SILVER ||
    metalFinish === PlatinumFinish.OTHER_PLATINUM;

  // Reset finish when metal type changes
  useEffect(() => {
    setValue('metalFinish', getDefaultFinish(metalType));
    setValue('customFinish', '');
  }, [metalType, setValue]);

  const finishOptions = getFinishOptions();

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-xl font-semibold text-gray-900">Gold Details</h2>
        <p className="mt-1 text-sm text-gray-500">Specify the metal type, weight, and purity</p>
      </div>

      {/* Metal Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Metal Type <span className="text-red-500">*</span>
        </label>
        <Controller
          name="metalType"
          control={control}
          render={({ field }) => (
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'GOLD', label: 'Gold', icon: '🥇', color: 'amber' },
                { value: 'SILVER', label: 'Silver', icon: '🥈', color: 'gray' },
                { value: 'PLATINUM', label: 'Platinum', icon: '✨', color: 'slate' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => field.onChange(option.value)}
                  className={`relative flex flex-col items-center p-4 rounded-xl border-2 transition-all ${
                    field.value === option.value
                      ? option.color === 'amber'
                        ? 'border-indigo-500 bg-indigo-50'
                        : option.color === 'gray'
                        ? 'border-gray-400 bg-gray-50'
                        : 'border-slate-400 bg-slate-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <span className="text-2xl mb-1">{option.icon}</span>
                  <span
                    className={`font-medium ${
                      field.value === option.value
                        ? option.color === 'amber'
                          ? 'text-indigo-700'
                          : option.color === 'gray'
                          ? 'text-gray-700'
                          : 'text-slate-700'
                        : 'text-gray-600'
                    }`}
                  >
                    {option.label}
                  </span>
                  {field.value === option.value && (
                    <div
                      className={`absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center ${
                        option.color === 'amber'
                          ? 'bg-indigo-500'
                          : option.color === 'gray'
                          ? 'bg-gray-500'
                          : 'bg-slate-500'
                      }`}
                    >
                      <svg
                        className="w-3 h-3 text-white"
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
              ))}
            </div>
          )}
        />
      </div>

      {/* Metal Finish Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          {metalType === 'GOLD' ? 'Gold' : metalType === 'SILVER' ? 'Silver' : 'Platinum'} Finish{' '}
          <span className="text-red-500">*</span>
        </label>
        <Controller
          name="metalFinish"
          control={control}
          render={({ field }) => (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {finishOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => field.onChange(option.value)}
                  className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                    field.value === option.value
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <span
                        className={`block font-semibold ${
                          field.value === option.value ? 'text-indigo-700' : 'text-gray-700'
                        }`}
                      >
                        {option.label}
                      </span>
                      <span
                        className={`block text-xs mt-1 leading-tight ${
                          field.value === option.value ? 'text-indigo-600' : 'text-gray-500'
                        }`}
                      >
                        {option.description}
                      </span>
                    </div>
                    {field.value === option.value && (
                      <div className="flex-shrink-0 ml-2 w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center">
                        <svg
                          className="w-3 h-3 text-white"
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
                  </div>
                </button>
              ))}
            </div>
          )}
        />
        {errors.metalFinish && (
          <p className="mt-1.5 text-sm text-red-600">{errors.metalFinish.message}</p>
        )}
      </div>

      {/* Custom Finish Input (when "Other" is selected) */}
      {isOtherFinish && (
        <div className="animate-in slide-in-from-top-2 duration-200">
          <label htmlFor="customFinish" className="block text-sm font-medium text-gray-700 mb-1.5">
            Specify Custom Finish <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              id="customFinish"
              type="text"
              {...register('customFinish')}
              className={`w-full px-4 py-2.5 border rounded-xl transition-colors ${
                errors.customFinish
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-200 bg-gray-50 hover:bg-white focus:bg-white'
              } focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
              placeholder="Enter the custom finish name/description"
            />
          </div>
          {errors.customFinish && (
            <p className="mt-1.5 text-sm text-red-600">{errors.customFinish.message}</p>
          )}
        </div>
      )}

      {/* Product Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Product Type <span className="text-red-500">*</span>
        </label>
        <Controller
          name="productType"
          control={control}
          render={({ field }) => (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {PRODUCT_TYPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => field.onChange(option.value)}
                  className={`relative flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
                    field.value === option.value
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <span className="text-xl mb-1">{option.icon}</span>
                  <span
                    className={`text-sm font-medium ${
                      field.value === option.value ? 'text-indigo-700' : 'text-gray-600'
                    }`}
                  >
                    {option.label}
                  </span>
                  {field.value === option.value && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center">
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
              ))}
            </div>
          )}
        />
        {errors.productType && (
          <p className="mt-1.5 text-sm text-red-600">{errors.productType.message}</p>
        )}
      </div>

      {/* Custom Product Type Input (shown when "Other" is selected) */}
      {productType === ProductType.OTHER && (
        <div>
          <label
            htmlFor="customProductType"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            Specify Product Type <span className="text-red-500">*</span>
          </label>
          <input
            id="customProductType"
            type="text"
            {...register('customProductType')}
            className={`w-full px-4 py-2.5 border rounded-xl transition-colors ${
              errors.customProductType
                ? 'border-red-300 bg-red-50'
                : 'border-gray-200 bg-gray-50 hover:bg-white focus:bg-white'
            } focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
            placeholder="e.g., Hair Pin, Belly Button Ring, etc."
          />
          {errors.customProductType && (
            <p className="mt-1.5 text-sm text-red-600">{errors.customProductType.message}</p>
          )}
        </div>
      )}

      {/* Quantity Input */}
      <div>
        <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1.5">
          Quantity <span className="text-red-500">*</span>
        </label>
        <div className="relative w-full md:w-48">
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
                d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
              />
            </svg>
          </div>
          <input
            id="quantity"
            type="number"
            min="1"
            {...register('quantity', { valueAsNumber: true })}
            className={`w-full pl-10 pr-12 py-2.5 border rounded-xl transition-colors ${
              errors.quantity
                ? 'border-red-300 bg-red-50'
                : 'border-gray-200 bg-gray-50 hover:bg-white focus:bg-white'
            } focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
            placeholder="1"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-400 text-sm">pcs</span>
          </div>
        </div>
        <p className="mt-1 text-xs text-gray-400">Number of pieces to create</p>
        {errors.quantity && (
          <p className="mt-1.5 text-sm text-red-600">{errors.quantity.message}</p>
        )}
      </div>

      {/* Weight Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gross Weight */}
        <div>
          <label htmlFor="grossWeight" className="block text-sm font-medium text-gray-700 mb-1.5">
            Gross Weight (grams){' '}
            <span className="text-amber-600 text-xs">(at least one required)</span>
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
                  d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
                />
              </svg>
            </div>
            <input
              id="grossWeight"
              type="number"
              step="0.01"
              {...register('grossWeight', { valueAsNumber: true })}
              className={`w-full pl-10 pr-12 py-2.5 border rounded-xl transition-colors ${
                errors.grossWeight
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-200 bg-gray-50 hover:bg-white focus:bg-white'
              } focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
              placeholder="0.00"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-400 text-sm">g</span>
            </div>
          </div>
          {errors.grossWeight && (
            <p className="mt-1.5 text-sm text-red-600">{errors.grossWeight.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-400">Total weight including stones</p>
        </div>

        {/* Net Weight */}
        <div>
          <label htmlFor="netWeight" className="block text-sm font-medium text-gray-700 mb-1.5">
            Net Weight (grams){' '}
            <span className="text-amber-600 text-xs">(at least one required)</span>
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
                  d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
                />
              </svg>
            </div>
            <input
              id="netWeight"
              type="number"
              step="0.01"
              {...register('netWeight', { valueAsNumber: true })}
              className="w-full pl-10 pr-12 py-2.5 border border-gray-200 bg-gray-50 hover:bg-white focus:bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              placeholder="0.00"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-400 text-sm">g</span>
            </div>
          </div>
          <p className="mt-1 text-xs text-gray-400">Weight excluding stones</p>
        </div>
      </div>

      {/* Purity Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          {metalType === 'GOLD' ? 'Gold' : metalType === 'SILVER' ? 'Silver' : 'Platinum'} Purity{' '}
          <span className="text-red-500">*</span>
        </label>
        <Controller
          name="purity"
          control={control}
          render={({ field }) => (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {PURITY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => field.onChange(option.value)}
                  className={`relative p-4 rounded-xl border-2 text-center transition-all ${
                    field.value === option.value
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <span
                    className={`block text-lg font-bold ${
                      field.value === option.value ? 'text-indigo-700' : 'text-gray-700'
                    }`}
                  >
                    {option.value === GoldPurity.CUSTOM ? 'Custom' : option.value}
                  </span>
                  {option.value !== GoldPurity.CUSTOM && (
                    <span className="block text-xs text-gray-500 mt-0.5">
                      {option.percentage}% pure
                    </span>
                  )}
                  {field.value === option.value && (
                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center">
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
              ))}
            </div>
          )}
        />
        {errors.purity && <p className="mt-1.5 text-sm text-red-600">{errors.purity.message}</p>}
      </div>

      {/* Custom Purity Input */}
      {selectedPurity === GoldPurity.CUSTOM && (
        <div className="animate-in slide-in-from-top-2 duration-200">
          <label htmlFor="customPurity" className="block text-sm font-medium text-gray-700 mb-1.5">
            Custom Purity Percentage <span className="text-red-500">*</span>
          </label>
          <div className="relative max-w-xs">
            <input
              id="customPurity"
              type="number"
              step="0.1"
              min="1"
              max="99.9"
              {...register('customPurity', { valueAsNumber: true })}
              className={`w-full px-4 py-2.5 pr-12 border rounded-xl transition-colors ${
                errors.customPurity
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-200 bg-gray-50 hover:bg-white focus:bg-white'
              } focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
              placeholder="e.g. 85.5"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-400 text-sm">%</span>
            </div>
          </div>
          {errors.customPurity && (
            <p className="mt-1.5 text-sm text-red-600">{errors.customPurity.message}</p>
          )}
        </div>
      )}

      {/* Quick Reference Card */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
        <h4 className="font-medium text-indigo-800 mb-2 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Purity Reference
        </h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="font-medium text-indigo-700">22K</p>
            <p className="text-indigo-600">91.6% gold</p>
          </div>
          <div>
            <p className="font-medium text-indigo-700">18K</p>
            <p className="text-indigo-600">75% gold</p>
          </div>
          <div>
            <p className="font-medium text-indigo-700">14K</p>
            <p className="text-indigo-600">58.3% gold</p>
          </div>
        </div>
      </div>

      {/* Product Specifications - Dynamic based on product type */}
      <ProductSpecificationsFields form={form} />
    </div>
  );
};

export default GoldDetailsStep;
