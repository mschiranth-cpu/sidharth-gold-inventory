/**
 * ============================================
 * STEP 3: STONE DETAILS
 * ============================================
 *
 * Third step of order creation - stone specifications.
 * Dynamic table to add/remove multiple stones.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import React from 'react';
import { UseFormReturn, Controller, useFieldArray } from 'react-hook-form';
import {
  STONE_TYPE_OPTIONS,
  STONE_SHAPE_OPTIONS,
  STONE_SETTING_OPTIONS,
  STONE_CLARITY_OPTIONS,
  STONE_CUT_OPTIONS,
  StoneType,
  StoneShape,
  StoneSetting,
} from '../../../types/order.types';
import type { StoneDetailsFormData, StoneItem } from '../../../types/order.types';

interface StoneDetailsStepProps {
  form: UseFormReturn<StoneDetailsFormData>;
}

const emptyStone: Omit<StoneItem, 'id'> & { id: string } = {
  id: '',
  type: 'DIAMOND' as StoneType, // Default to DIAMOND, user will change
  weight: 0,
  quantity: 1,
  shape: undefined,
  setting: undefined,
  color: '',
  clarity: undefined,
  cut: undefined,
  description: '',
};

const StoneDetailsStep: React.FC<StoneDetailsStepProps> = ({ form }) => {
  const {
    register,
    control,
    formState: { errors },
    watch,
  } = form;

  const hasStones = watch('hasStones');
  const stones = watch('stones') || [];

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'stones',
  });

  const addStone = () => {
    append({
      ...emptyStone,
      id: `stone-${Date.now()}`,
    });
  };

  const totalStoneWeight = stones.reduce((sum, stone) => {
    return sum + (stone.weight || 0) * (stone.quantity || 1);
  }, 0);

  const totalStoneCount = stones.reduce((sum, stone) => {
    return sum + (stone.quantity || 0);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-xl font-semibold text-gray-900">Stone Details</h2>
        <p className="mt-1 text-sm text-gray-500">Add gemstones and diamonds (if applicable)</p>
      </div>

      {/* Has Stones Toggle */}
      <div className="bg-gray-50 rounded-xl p-4">
        <Controller
          name="hasStones"
          control={control}
          render={({ field }) => (
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg
                    className="w-6 h-6 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Does this order include stones?</p>
                  <p className="text-sm text-gray-500">Toggle to add gemstones and diamonds</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const newValue = !field.value;
                  field.onChange(newValue);
                  if (newValue && fields.length === 0) {
                    addStone();
                  }
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  field.value ? 'bg-indigo-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    field.value ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </label>
          )}
        />
      </div>

      {/* Stones Table */}
      {hasStones && (
        <div className="animate-in slide-in-from-top-2 duration-200 space-y-4">
          {/* Summary Cards */}
          {stones.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                <p className="text-sm text-purple-600 font-medium">Total Stone Count</p>
                <p className="text-2xl font-bold text-purple-700">{totalStoneCount}</p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                <p className="text-sm text-purple-600 font-medium">Total Stone Weight</p>
                <p className="text-2xl font-bold text-purple-700">
                  {totalStoneWeight.toFixed(2)} <span className="text-sm font-normal">ct</span>
                </p>
              </div>
            </div>
          )}

          {/* Stone Entries */}
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </span>
                    Stone #{index + 1}
                  </h4>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove stone"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Stone Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Stone Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register(`stones.${index}.type`)}
                      className="w-full px-3 py-2.5 border border-gray-200 bg-gray-50 hover:bg-white focus:bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    >
                      <option value="">Select type</option>
                      {STONE_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {errors.stones?.[index]?.type && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.stones[index]?.type?.message}
                      </p>
                    )}
                  </div>

                  {/* Custom Stone Type (if Other selected) */}
                  {watch(`stones.${index}.type`) === StoneType.OTHER && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Specify Stone Type <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        {...register(`stones.${index}.customType`)}
                        className={`w-full px-3 py-2.5 border rounded-xl transition-colors ${
                          errors.stones?.[index]?.customType
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-200 bg-gray-50 hover:bg-white focus:bg-white'
                        } focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                        placeholder="Enter stone type"
                      />
                      {errors.stones?.[index]?.customType && (
                        <p className="mt-1 text-xs text-red-600">
                          {errors.stones[index]?.customType?.message}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Weight */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Weight (ct) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        {...register(`stones.${index}.weight`, { valueAsNumber: true })}
                        className={`w-full px-3 py-2.5 pr-10 border rounded-xl transition-colors ${
                          errors.stones?.[index]?.weight
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-200 bg-gray-50 hover:bg-white focus:bg-white'
                        } focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                        placeholder="0.00"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-400 text-sm">ct</span>
                      </div>
                    </div>
                    {errors.stones?.[index]?.weight && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.stones[index]?.weight?.message}
                      </p>
                    )}
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      {...register(`stones.${index}.quantity`, { valueAsNumber: true })}
                      className={`w-full px-3 py-2.5 border rounded-xl transition-colors ${
                        errors.stones?.[index]?.quantity
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-200 bg-gray-50 hover:bg-white focus:bg-white'
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                      placeholder="1"
                    />
                    {errors.stones?.[index]?.quantity && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.stones[index]?.quantity?.message}
                      </p>
                    )}
                  </div>

                  {/* Shape */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Shape</label>
                    <select
                      {...register(`stones.${index}.shape`)}
                      className="w-full px-3 py-2.5 border border-gray-200 bg-gray-50 hover:bg-white focus:bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    >
                      <option value="">Select shape</option>
                      {STONE_SHAPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Custom Shape (if Other selected) */}
                  {watch(`stones.${index}.shape`) === StoneShape.OTHER && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Specify Shape <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        {...register(`stones.${index}.customShape`)}
                        className={`w-full px-3 py-2.5 border rounded-xl transition-colors ${
                          errors.stones?.[index]?.customShape
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-200 bg-gray-50 hover:bg-white focus:bg-white'
                        } focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                        placeholder="Enter shape"
                      />
                      {errors.stones?.[index]?.customShape && (
                        <p className="mt-1 text-xs text-red-600">
                          {errors.stones[index]?.customShape?.message}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Row 2: Setting, Color, Clarity, Cut */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                  {/* Setting */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Setting
                    </label>
                    <select
                      {...register(`stones.${index}.setting`)}
                      className="w-full px-3 py-2.5 border border-gray-200 bg-gray-50 hover:bg-white focus:bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    >
                      <option value="">Select setting</option>
                      {STONE_SETTING_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Custom Setting (if Other selected) */}
                  {watch(`stones.${index}.setting`) === StoneSetting.OTHER && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Specify Setting <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        {...register(`stones.${index}.customSetting`)}
                        className={`w-full px-3 py-2.5 border rounded-xl transition-colors ${
                          errors.stones?.[index]?.customSetting
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-200 bg-gray-50 hover:bg-white focus:bg-white'
                        } focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                        placeholder="Enter setting type"
                      />
                      {errors.stones?.[index]?.customSetting && (
                        <p className="mt-1 text-xs text-red-600">
                          {errors.stones[index]?.customSetting?.message}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Color */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Color</label>
                    <input
                      type="text"
                      {...register(`stones.${index}.color`)}
                      className="w-full px-3 py-2.5 border border-gray-200 bg-gray-50 hover:bg-white focus:bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      placeholder="e.g. D, E, F, Blue"
                    />
                  </div>

                  {/* Clarity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Clarity
                    </label>
                    <select
                      {...register(`stones.${index}.clarity`)}
                      className="w-full px-3 py-2.5 border border-gray-200 bg-gray-50 hover:bg-white focus:bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    >
                      <option value="">Select clarity</option>
                      {STONE_CLARITY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Cut */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Cut</label>
                    <select
                      {...register(`stones.${index}.cut`)}
                      className="w-full px-3 py-2.5 border border-gray-200 bg-gray-50 hover:bg-white focus:bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    >
                      <option value="">Select cut</option>
                      {STONE_CUT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Row 3: Description */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Notes / Description
                  </label>
                  <input
                    type="text"
                    {...register(`stones.${index}.description`)}
                    className="w-full px-3 py-2.5 border border-gray-200 bg-gray-50 hover:bg-white focus:bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    placeholder="Additional notes about this stone"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Add Stone Button */}
          <button
            type="button"
            onClick={addStone}
            className="w-full py-3 border-2 border-dashed border-gray-300 hover:border-indigo-500 rounded-xl text-gray-500 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Add Another Stone
          </button>

          {/* Validation Error */}
          {errors.stones && typeof errors.stones.message === 'string' && (
            <p className="text-sm text-red-600 flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {errors.stones.message}
            </p>
          )}
        </div>
      )}

      {/* No Stones Info */}
      {!hasStones && (
        <div className="text-center py-8 text-gray-500">
          <svg
            className="w-12 h-12 mx-auto mb-3 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
          <p>No stones will be added to this order</p>
          <p className="text-sm text-gray-400 mt-1">Toggle the switch above to add stones</p>
        </div>
      )}
    </div>
  );
};

export default StoneDetailsStep;
