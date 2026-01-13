/**
 * ============================================
 * ORDER VALIDATION SCHEMAS
 * ============================================
 *
 * Zod schemas for order form validation.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import { z } from 'zod';
import {
  GoldPurity,
  StoneType,
  GoldFinish,
  SilverFinish,
  PlatinumFinish,
  ProductType,
  StoneShape,
  StoneSetting,
  StoneClarity,
  StoneCut,
} from './order.types';

// ============================================
// STEP 1: BASIC INFO SCHEMA
// ============================================

export const basicInfoSchema = z.object({
  orderNumber: z.string().min(1, 'Order number is required'),
  customerName: z
    .string()
    .min(1, 'Customer name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  customerPhone: z
    .string()
    .min(1, 'Phone number is required')
    .refine(
      (val) => /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/.test(val),
      'Please enter a valid phone number'
    ),
  customerEmail: z
    .string()
    .min(1, 'Email address is required')
    .refine((val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), 'Please enter a valid email address'),
  productImages: z
    .array(z.any())
    .min(1, 'At least one product image is required')
    .max(5, 'Maximum 5 images allowed'),
  // Legacy support
  productImage: z.any().optional(),
  productImagePreview: z.string().optional(),
});

// ============================================
// STEP 2: GOLD DETAILS SCHEMA
// ============================================

// Create a union of all finish enums
const metalFinishSchema = z.union([
  z.nativeEnum(GoldFinish),
  z.nativeEnum(SilverFinish),
  z.nativeEnum(PlatinumFinish),
]);

export const goldDetailsSchema = z
  .object({
    grossWeight: z.preprocess(
      (val) =>
        val === '' || val === undefined || val === null || Number.isNaN(val)
          ? undefined
          : Number(val),
      z
        .number()
        .min(0, 'Weight cannot be negative')
        .max(10000, 'Weight seems too high, please verify')
        .optional()
    ),
    netWeight: z.preprocess(
      (val) =>
        val === '' || val === undefined || val === null || Number.isNaN(val)
          ? undefined
          : Number(val),
      z.number().min(0, 'Net weight cannot be negative').optional()
    ),
    purity: z.nativeEnum(GoldPurity, {
      errorMap: () => ({ message: 'Please select gold purity' }),
    }),
    customPurity: z
      .number()
      .min(1, 'Custom purity must be at least 1%')
      .max(99.9, 'Custom purity must be less than 100%')
      .optional(),
    metalType: z.enum(['GOLD', 'SILVER', 'PLATINUM']),
    metalFinish: metalFinishSchema,
    customFinish: z.string().optional(),
    productType: z.nativeEnum(ProductType, {
      errorMap: () => ({ message: 'Please select product type' }),
    }),
    customProductType: z.string().optional(),
    quantity: z
      .number({ required_error: 'Quantity is required' })
      .int('Quantity must be a whole number')
      .min(1, 'Quantity must be at least 1')
      .max(1000, 'Quantity seems too high, please verify'),
  })
  .refine(
    (data) => {
      if (data.purity === GoldPurity.CUSTOM) {
        return data.customPurity !== undefined && data.customPurity > 0;
      }
      return true;
    },
    {
      message: 'Custom purity percentage is required',
      path: ['customPurity'],
    }
  )
  .refine(
    (data) => {
      // Check if "Other" finish is selected and customFinish is required
      const isOtherFinish =
        data.metalFinish === GoldFinish.OTHER_GOLD ||
        data.metalFinish === SilverFinish.OTHER_SILVER ||
        data.metalFinish === PlatinumFinish.OTHER_PLATINUM;

      if (isOtherFinish) {
        return data.customFinish !== undefined && data.customFinish.trim().length > 0;
      }
      return true;
    },
    {
      message: 'Please specify the custom finish',
      path: ['customFinish'],
    }
  )
  .refine(
    (data) => {
      // Check if "Other" product type is selected and customProductType is required
      if (data.productType === ProductType.OTHER) {
        return data.customProductType !== undefined && data.customProductType.trim().length > 0;
      }
      return true;
    },
    {
      message: 'Please specify the product type',
      path: ['customProductType'],
    }
  );

// ============================================
// STEP 3: STONE DETAILS SCHEMA
// ============================================

export const stoneItemSchema = z
  .object({
    id: z.string(),
    type: z.preprocess(
      (val) => (val === '' ? undefined : val),
      z.nativeEnum(StoneType, {
        errorMap: () => ({ message: 'Please select stone type' }),
      })
    ),
    customType: z.string().optional(),
    weight: z
      .number({
        required_error: 'Stone weight is required',
        invalid_type_error: 'Weight must be a number',
      })
      .positive('Weight must be greater than 0'),
    quantity: z
      .number({ required_error: 'Quantity is required' })
      .int('Quantity must be a whole number')
      .positive('Quantity must be at least 1'),
    shape: z.preprocess(
      (val) => (val === '' ? undefined : val),
      z.nativeEnum(StoneShape).optional()
    ),
    customShape: z.string().optional(),
    setting: z.preprocess(
      (val) => (val === '' ? undefined : val),
      z.nativeEnum(StoneSetting).optional()
    ),
    customSetting: z.string().optional(),
    color: z.string().optional(),
    clarity: z.preprocess(
      (val) => (val === '' ? undefined : val),
      z.nativeEnum(StoneClarity).optional()
    ),
    cut: z.preprocess((val) => (val === '' ? undefined : val), z.nativeEnum(StoneCut).optional()),
    description: z.string().optional(),
  })
  .refine(
    (data) => {
      // If "Other" stone type is selected, customType is required
      if (data.type === StoneType.OTHER) {
        return data.customType !== undefined && data.customType.trim().length > 0;
      }
      return true;
    },
    {
      message: 'Please specify the stone type',
      path: ['customType'],
    }
  )
  .refine(
    (data) => {
      // If "Other" shape is selected, customShape is required
      if (data.shape === StoneShape.OTHER) {
        return data.customShape !== undefined && data.customShape.trim().length > 0;
      }
      return true;
    },
    {
      message: 'Please specify the stone shape',
      path: ['customShape'],
    }
  )
  .refine(
    (data) => {
      // If "Other" setting is selected, customSetting is required
      if (data.setting === StoneSetting.OTHER) {
        return data.customSetting !== undefined && data.customSetting.trim().length > 0;
      }
      return true;
    },
    {
      message: 'Please specify the stone setting',
      path: ['customSetting'],
    }
  );

export const stoneDetailsSchema = z
  .object({
    hasStones: z.boolean(),
    stones: z.array(stoneItemSchema),
    totalStoneWeight: z.number().min(0).optional(),
  })
  .refine(
    (data) => {
      if (data.hasStones && data.stones.length === 0) {
        return false;
      }
      return true;
    },
    {
      message: 'Please add at least one stone or uncheck "Has Stones"',
      path: ['stones'],
    }
  );

// ============================================
// STEP 4: ADDITIONAL INFO SCHEMA
// ============================================

export const additionalInfoSchema = z.object({
  size: z.string().optional(),
  dueDate: z
    .date({
      required_error: 'Due date is required',
      invalid_type_error: 'Please select a valid date',
    })
    .refine(
      (date) => date >= new Date(new Date().setHours(0, 0, 0, 0)),
      'Due date cannot be in the past'
    ),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  specialInstructions: z
    .string()
    .max(500, 'Special instructions must be less than 500 characters')
    .optional(),
});

// ============================================
// COMPLETE ORDER SCHEMA
// ============================================

export const completeOrderSchema = z.object({
  basicInfo: basicInfoSchema,
  goldDetails: goldDetailsSchema,
  stoneDetails: stoneDetailsSchema,
  additionalInfo: additionalInfoSchema,
});

export type BasicInfoFormValues = z.infer<typeof basicInfoSchema>;
export type GoldDetailsFormValues = z.infer<typeof goldDetailsSchema>;
export type StoneDetailsFormValues = z.infer<typeof stoneDetailsSchema>;
export type AdditionalInfoFormValues = z.infer<typeof additionalInfoSchema>;
export type CompleteOrderFormValues = z.infer<typeof completeOrderSchema>;
