/**
 * ============================================
 * EDIT ORDER PAGE
 * ============================================
 *
 * Multi-step order editing form that mirrors CreateOrderPage
 * but pre-populates with existing order data.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

// Types & Schemas
import {
  BasicInfoFormData,
  GoldDetailsFormData,
  StoneDetailsFormData,
  AdditionalInfoFormData,
  GoldPurity,
  GoldFinish,
  ProductType,
} from '../../../types/order.types';
import {
  basicInfoSchema,
  goldDetailsSchema,
  stoneDetailsSchema,
  additionalInfoSchema,
} from '../../../types/order.schema';

// API Service
import { ordersService } from '../services';

// Components
import StepProgress from './StepProgress';
import BasicInfoStep from './BasicInfoStep';
import GoldDetailsStep from './GoldDetailsStep';
import StoneDetailsStep from './StoneDetailsStep';
import AdditionalInfoStep from './AdditionalInfoStep';

// Constants
const STEPS = [
  { id: 1, title: 'Basic Info', description: 'Customer & product details' },
  { id: 2, title: 'Gold Details', description: 'Metal specifications' },
  { id: 3, title: 'Stone Details', description: 'Gemstones (if any)' },
  { id: 4, title: 'Additional Info', description: 'Due date & priority' },
];

// Utility function to convert purity number to enum
const purityToEnum = (purity: number | string | null | undefined): GoldPurity => {
  const p = typeof purity === 'string' ? parseInt(purity, 10) : purity;
  switch (p) {
    case 22:
      return GoldPurity.K22;
    case 18:
      return GoldPurity.K18;
    case 14:
      return GoldPurity.K14;
    default:
      return GoldPurity.K22;
  }
};

// Utility function to convert priority number to string
const priorityToString = (priority: number): 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' => {
  switch (priority) {
    case 0:
      return 'LOW';
    case 1:
      return 'NORMAL';
    case 2:
      return 'HIGH';
    case 3:
      return 'URGENT';
    default:
      return 'NORMAL';
  }
};

const EditOrderPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([1, 2, 3, 4]); // All completed by default for edit
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  // Fetch order data - use different key to get raw API response
  const {
    data: orderResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['order-edit', id],
    queryFn: async () => {
      if (!id) throw new Error('Order ID is required');
      return ordersService.getById(id);
    },
    enabled: !!id,
  });

  const order = orderResponse?.data;

  // Form hooks for each step
  const basicInfoForm = useForm<BasicInfoFormData>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      orderNumber: '',
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      productImages: [],
      productImage: null,
    },
    mode: 'onChange',
  });

  const goldDetailsForm = useForm<GoldDetailsFormData>({
    resolver: zodResolver(goldDetailsSchema),
    defaultValues: {
      metalType: 'GOLD',
      metalFinish: GoldFinish.YELLOW_GOLD,
      grossWeight: undefined,
      netWeight: undefined,
      purity: GoldPurity.K22,
      customPurity: undefined,
      customFinish: undefined,
      productType: ProductType.RING,
      customProductType: undefined,
      quantity: 1,
    },
    mode: 'onChange',
  });

  const stoneDetailsForm = useForm<StoneDetailsFormData>({
    resolver: zodResolver(stoneDetailsSchema),
    defaultValues: {
      hasStones: false,
      stones: [],
      totalStoneWeight: 0,
    },
    mode: 'onChange',
  });

  const additionalInfoForm = useForm<AdditionalInfoFormData>({
    resolver: zodResolver(additionalInfoSchema),
    defaultValues: {
      size: '',
      dueDate: undefined,
      priority: 'NORMAL',
      description: '',
      specialInstructions: '',
    },
    mode: 'onChange',
  });

  // Populate forms when order data loads
  useEffect(() => {
    if (order) {
      const apiOrder = order as any;
      const orderDetails = apiOrder.orderDetails || {};
      const referenceImages = orderDetails.referenceImages || [];

      setOrderNumber(apiOrder.orderNumber);

      // Populate Basic Info
      basicInfoForm.reset({
        orderNumber: apiOrder.orderNumber,
        customerName: apiOrder.customerName || '',
        customerPhone: apiOrder.customerPhone || '',
        customerEmail: apiOrder.customerEmail || '',
        productImages: referenceImages.map((url: string, idx: number) => ({
          id: `existing-${idx}`,
          file: null as any,
          preview: url,
          name: `Image ${idx + 1}`,
        })),
        productImage: null,
      });

      // Populate Gold Details
      goldDetailsForm.reset({
        metalType: orderDetails.metalType || 'GOLD',
        metalFinish: (orderDetails.metalFinish as GoldFinish) || GoldFinish.YELLOW_GOLD,
        grossWeight: orderDetails.goldWeightInitial || undefined,
        netWeight: orderDetails.goldWeightInitial || undefined,
        purity: purityToEnum(orderDetails.purity),
        customPurity: undefined,
        customFinish: orderDetails.customFinish || undefined,
        productType: (orderDetails.productType as ProductType) || ProductType.RING,
        customProductType: orderDetails.customProductType || undefined,
        quantity: orderDetails.quantity || 1,
      });

      // Populate Stone Details
      const stones = apiOrder.stones || [];
      stoneDetailsForm.reset({
        hasStones: stones.length > 0,
        stones: stones.map((stone: any) => ({
          id: stone.id,
          type: stone.stoneType || 'DIAMOND',
          customType: stone.customType || stone.stoneName || '',
          weight: stone.weight || 0,
          quantity: stone.quantity || 1,
          color: stone.color || '',
          clarity: stone.clarity || '',
          cut: stone.cut || '',
          shape: stone.shape || '',
          customShape: stone.customShape || '',
          setting: stone.setting || '',
          customSetting: stone.customSetting || '',
          description: stone.notes || '',
        })),
        totalStoneWeight: stones.reduce((sum: number, s: any) => sum + (s.weight || 0), 0),
      });

      // Populate Additional Info
      additionalInfoForm.reset({
        size: orderDetails.size || '',
        dueDate: orderDetails.dueDate ? new Date(orderDetails.dueDate) : undefined,
        priority: priorityToString(apiOrder.priority || 1),
        description: orderDetails.additionalDescription || '',
        specialInstructions: orderDetails.specialInstructions || '',
      });
    }
  }, [order]);

  // Update mutation
  const updateOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!id) throw new Error('Order ID is required');
      return ordersService.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['order-edit', id] });
      toast.success('Order updated successfully');
      navigate(`/orders/${id}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to update order');
    },
  });

  // Validate current step
  const validateCurrentStep = async (): Promise<boolean> => {
    let isValid = false;

    switch (currentStep) {
      case 1:
        isValid = await basicInfoForm.trigger();
        break;
      case 2:
        isValid = await goldDetailsForm.trigger();
        break;
      case 3:
        isValid = await stoneDetailsForm.trigger();
        break;
      case 4:
        isValid = await additionalInfoForm.trigger();
        break;
    }

    return isValid;
  };

  // Handle next step
  const handleNext = async () => {
    const isValid = await validateCurrentStep();

    if (isValid) {
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps([...completedSteps, currentStep]);
      }
      if (currentStep < STEPS.length) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle step click
  const handleStepClick = (step: number) => {
    // For edit mode, allow clicking any step
    setCurrentStep(step);
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Validate all steps
    const validations = await Promise.all([
      basicInfoForm.trigger(),
      goldDetailsForm.trigger(),
      stoneDetailsForm.trigger(),
      additionalInfoForm.trigger(),
    ]);

    if (!validations.every(Boolean)) {
      toast.error('Please complete all required fields');
      return;
    }

    setIsSubmitting(true);

    // Compile order data
    const basicInfo = basicInfoForm.getValues();
    const goldDetails = goldDetailsForm.getValues();
    const stoneDetails = stoneDetailsForm.getValues();
    const additionalInfo = additionalInfoForm.getValues();

    try {
      // Transform form data to backend format
      const purityMap: Record<string, number> = {
        '22K': 22,
        '18K': 18,
        '14K': 14,
        CUSTOM: goldDetails.customPurity || 22,
      };

      const priorityMap: Record<string, number> = {
        LOW: 0,
        NORMAL: 1,
        HIGH: 2,
        URGENT: 3,
      };

      // Get image preview URLs
      const imagePreviews =
        basicInfo.productImages?.map((img) => img.preview).filter(Boolean) || [];
      const primaryImageUrl = imagePreviews[0];

      const updatePayload = {
        customerName: basicInfo.customerName,
        customerPhone: basicInfo.customerPhone || undefined,
        customerEmail: basicInfo.customerEmail || undefined,
        productPhotoUrl: primaryImageUrl,
        priority: priorityMap[additionalInfo.priority] || 1,
        orderDetails: {
          goldWeightInitial: goldDetails.grossWeight || undefined,
          purity: purityMap[goldDetails.purity] || 22,
          goldColor: goldDetails.metalFinish || undefined,
          metalType: goldDetails.metalType || 'GOLD',
          metalFinish: goldDetails.metalFinish || undefined,
          customFinish: goldDetails.customFinish || undefined,
          size: additionalInfo.size || undefined,
          quantity: goldDetails.quantity || 1,
          productType: goldDetails.productType || undefined,
          customProductType: goldDetails.customProductType || undefined,
          dueDate: additionalInfo.dueDate?.toISOString() || undefined,
          additionalDescription: additionalInfo.description || undefined,
          specialInstructions: additionalInfo.specialInstructions || undefined,
          referenceImages: imagePreviews,
        },
        stones: stoneDetails.hasStones
          ? stoneDetails.stones.map((stone) => ({
              stoneType: stone.type,
              stoneName: stone.customType || undefined,
              customType: stone.customType || undefined,
              weight: stone.weight,
              quantity: stone.quantity || 1,
              color: stone.color || undefined,
              clarity: stone.clarity || undefined,
              cut: stone.cut || undefined,
              shape: stone.shape || undefined,
              customShape: stone.customShape || undefined,
              setting: stone.setting || undefined,
              customSetting: stone.customSetting || undefined,
              notes: stone.description || undefined,
            }))
          : [],
      };

      console.log('Updating order:', updatePayload);

      await updateOrderMutation.mutateAsync(updatePayload);
    } catch (error) {
      console.error('Error updating order:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <BasicInfoStep form={basicInfoForm} orderNumber={orderNumber} />;
      case 2:
        return <GoldDetailsStep form={goldDetailsForm} />;
      case 3:
        return <StoneDetailsStep form={stoneDetailsForm} />;
      case 4:
        return <AdditionalInfoStep form={additionalInfoForm} />;
      default:
        return null;
    }
  };

  const isLastStep = currentStep === STEPS.length;

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
            <div className="text-red-500 mb-4">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Order Not Found</h2>
            <p className="text-gray-600 mb-4">
              The order you're trying to edit doesn't exist or you don't have permission to view it.
            </p>
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (currentStep > 1) {
                  setCurrentStep(currentStep - 1);
                } else {
                  navigate(-1);
                }
              }}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Order</h1>
              <p className="text-sm text-gray-500">Order #{orderNumber}</p>
            </div>
          </div>

          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>

        {/* Step Progress */}
        <div className="mb-8">
          <StepProgress
            steps={STEPS}
            currentStep={currentStep}
            completedSteps={completedSteps}
            onStepClick={handleStepClick}
          />
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 lg:p-8">{renderStep()}</div>

          {/* Navigation Buttons */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                currentStep === 1
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:shadow-md'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Previous
            </button>

            <div className="flex items-center gap-3">
              {!isLastStep && (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-200 hover:-translate-y-0.5"
                >
                  Next
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              )}

              {isLastStep && (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                    isSubmitting
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:-translate-y-0.5'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5"
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
                      Save Changes
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditOrderPage;
