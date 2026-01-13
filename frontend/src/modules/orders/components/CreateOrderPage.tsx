/**
 * ============================================
 * CREATE ORDER PAGE
 * ============================================
 *
 * Multi-step order creation form with:
 * - Step progress indicator
 * - Form state persistence (save draft)
 * - Validation on each step
 * - Back/Next navigation
 * - Submit only when all steps complete
 * - Success notification on submission
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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

const DRAFT_KEY = 'gold-factory-order-draft';

// Generate Order Number
const generateOrderNumber = (): string => {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${year}-${random}`;
};

const CreateOrderPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderNumber] = useState(() => generateOrderNumber());
  const [showDraftPrompt, setShowDraftPrompt] = useState(false);
  const [_hasDraft, setHasDraft] = useState(false);

  // Form hooks for each step
  const basicInfoForm = useForm<BasicInfoFormData>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      orderNumber,
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

  // Check for existing draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        // Only show prompt if draft has meaningful data (not just default values)
        if (
          draft.basicInfo?.customerName ||
          draft.goldDetails?.grossWeight > 0 ||
          draft.currentStep > 1
        ) {
          setHasDraft(true);
          setShowDraftPrompt(true);
        }
      } catch (error) {
        console.error('Error checking draft:', error);
        localStorage.removeItem(DRAFT_KEY);
      }
    }
  }, []);

  // Restore draft data
  const restoreDraft = useCallback(() => {
    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        if (draft.basicInfo) {
          basicInfoForm.reset({
            ...draft.basicInfo,
            orderNumber, // Always use fresh order number
          });
        }
        if (draft.goldDetails) {
          goldDetailsForm.reset(draft.goldDetails);
        }
        if (draft.stoneDetails) {
          stoneDetailsForm.reset(draft.stoneDetails);
        }
        if (draft.additionalInfo) {
          additionalInfoForm.reset({
            ...draft.additionalInfo,
            dueDate: draft.additionalInfo.dueDate
              ? new Date(draft.additionalInfo.dueDate)
              : undefined,
          });
        }
        if (draft.currentStep) {
          setCurrentStep(draft.currentStep);
        }
        if (draft.completedSteps) {
          setCompletedSteps(draft.completedSteps);
        }
        toast.success('Draft restored', { icon: '📝' });
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    }
    setShowDraftPrompt(false);
  }, [orderNumber, basicInfoForm, goldDetailsForm, stoneDetailsForm, additionalInfoForm]);

  // Start fresh (discard draft)
  const startFresh = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY);
    setHasDraft(false);
    setShowDraftPrompt(false);
  }, []);

  // Save draft to localStorage
  const saveDraft = useCallback(() => {
    const draft = {
      basicInfo: basicInfoForm.getValues(),
      goldDetails: goldDetailsForm.getValues(),
      stoneDetails: stoneDetailsForm.getValues(),
      additionalInfo: additionalInfoForm.getValues(),
      currentStep,
      completedSteps,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    toast.success('Draft saved', { duration: 2000, icon: '💾' });
  }, [currentStep, completedSteps]);

  // Clear draft
  const clearDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY);
  }, []);

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
    } else {
      // Show validation errors to the user
      const currentForm =
        currentStep === 1
          ? basicInfoForm
          : currentStep === 2
          ? goldDetailsForm
          : currentStep === 3
          ? stoneDetailsForm
          : additionalInfoForm;
      const errors = currentForm.formState.errors;
      const errorFields = Object.keys(errors);
      if (errorFields.length > 0) {
        // Get first error message safely
        const firstError = errors[errorFields[0] as keyof typeof errors];
        const message =
          typeof firstError?.message === 'string' ? firstError.message : 'Invalid value';
        toast.error(`Please fix: ${errorFields[0]} - ${message}`);
      } else {
        toast.error('Please complete all required fields');
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
  const handleStepClick = async (step: number) => {
    // Can go back freely, but need validation to go forward
    if (step < currentStep) {
      setCurrentStep(step);
    } else if (step === currentStep + 1) {
      const isValid = await validateCurrentStep();
      if (isValid) {
        if (!completedSteps.includes(currentStep)) {
          setCompletedSteps([...completedSteps, currentStep]);
        }
        setCurrentStep(step);
      }
    }
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
        K24: 24,
        K22: 22,
        K18: 18,
        K14: 14,
        CUSTOM: goldDetails.customPurity || 22,
      };

      const priorityMap: Record<string, number> = {
        LOW: 0,
        NORMAL: 1,
        HIGH: 2,
        URGENT: 3,
      };

      // Get the first image preview URL (the primary image)
      const imagePreviews =
        basicInfo.productImages?.map((img) => img.preview).filter(Boolean) || [];
      const primaryImageUrl = imagePreviews[0];

      const orderPayload = {
        customerName: basicInfo.customerName,
        customerPhone: basicInfo.customerPhone || undefined,
        customerEmail: basicInfo.customerEmail || undefined,
        productPhotoUrl: primaryImageUrl,
        priority: priorityMap[additionalInfo.priority] || 0,
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
          dueDate: additionalInfo.dueDate?.toISOString() || new Date().toISOString(),
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

      console.log('Submitting order:', orderPayload);

      // Call actual API
      const response = await ordersService.create(orderPayload as any);

      if (response.success) {
        // Clear draft on success
        clearDraft();

        // Show success toast
        toast.success(
          <div>
            <p className="font-medium">Order Created Successfully!</p>
            <p className="text-sm">Order #{basicInfo.orderNumber}</p>
          </div>,
          { duration: 5000, icon: '✅' }
        );

        // Navigate to orders list
        navigate('/orders');
      } else {
        throw new Error(response.message || 'Failed to create order');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to create order. Please try again.');
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Draft Restore Prompt */}
      {showDraftPrompt && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="group relative bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Decorative background orb */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full -translate-y-12 translate-x-12 group-hover:scale-110 transition-transform duration-300" />

            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/30">
                  <svg
                    className="w-5 h-5 text-white"
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
                </div>
                <h3 className="text-lg font-bold text-gray-900">Unsaved Draft Found</h3>
              </div>

              <p className="text-gray-600 mb-6 leading-relaxed">
                You have an unsaved order draft. Would you like to continue where you left off, or
                start a new order?
              </p>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={startFresh}
                  className="px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-all duration-200 hover:shadow-md"
                >
                  Start Fresh
                </button>
                <button
                  onClick={restoreDraft}
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/30 hover:shadow-xl transition-all duration-200 hover:scale-[1.02]"
                >
                  Restore Draft
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create New Order</h1>
              <p className="mt-1 text-gray-500">
                Order Number:{' '}
                <span className="font-mono font-medium text-indigo-600">{orderNumber}</span>
              </p>
            </div>

            {/* Save Draft Button */}
            <button
              onClick={saveDraft}
              className="px-4 py-2 border border-gray-300 bg-white rounded-xl text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                />
              </svg>
              Save Draft
            </button>
          </div>
        </div>

        {/* Step Progress */}
        <div className="mb-8">
          <StepProgress
            steps={STEPS}
            currentStep={currentStep}
            onStepClick={handleStepClick}
            allowNavigation={true}
            completedSteps={completedSteps}
          />
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 mb-8">
          <div className="min-h-[400px]">{renderStep()}</div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
              currentStep === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
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
            {isLastStep ? (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-medium rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Creating Order...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Create Order
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-medium rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/25"
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
          </div>
        </div>

        {/* Help Text */}
        <p className="text-center text-sm text-gray-400 mt-6">
          Step {currentStep} of {STEPS.length} • {STEPS[currentStep - 1]?.title}
        </p>
      </div>
    </div>
  );
};

export default CreateOrderPage;
