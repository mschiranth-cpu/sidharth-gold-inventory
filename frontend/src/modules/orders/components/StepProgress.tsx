/**
 * ============================================
 * STEP PROGRESS INDICATOR
 * ============================================
 * 
 * Visual progress indicator for multi-step forms.
 * 
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import React from 'react';

interface Step {
  id: number;
  title: string;
  description?: string;
}

interface StepProgressProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (step: number) => void;
  allowNavigation?: boolean;
  completedSteps?: number[];
}

const StepProgress: React.FC<StepProgressProps> = ({
  steps,
  currentStep,
  onStepClick,
  allowNavigation = false,
  completedSteps = [],
}) => {
  const handleStepClick = (stepId: number) => {
    if (allowNavigation && onStepClick) {
      // Only allow navigation to completed steps or the next step
      if (completedSteps.includes(stepId) || stepId <= Math.max(...completedSteps, 0) + 1) {
        onStepClick(stepId);
      }
    }
  };

  return (
    <nav aria-label="Progress" className="w-full">
      {/* Desktop view */}
      <ol className="hidden md:flex items-center w-full">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = step.id === currentStep;
          const isClickable = allowNavigation && (isCompleted || step.id <= Math.max(...completedSteps, 0) + 1);

          return (
            <li key={step.id} className={`flex-1 ${index !== steps.length - 1 ? 'pr-4' : ''}`}>
              <div
                className={`group flex flex-col items-center ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
                onClick={() => handleStepClick(step.id)}
              >
                {/* Step line and circle */}
                <div className="flex items-center w-full">
                  {/* Left line */}
                  {index > 0 && (
                    <div
                      className={`flex-1 h-0.5 ${
                        isCompleted || isCurrent ? 'bg-indigo-500' : 'bg-gray-200'
                      }`}
                    />
                  )}

                  {/* Circle */}
                  <div
                    className={`relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200 ${
                      isCompleted
                        ? 'bg-indigo-500 border-indigo-500 text-white'
                        : isCurrent
                        ? 'bg-white border-indigo-500 text-indigo-500'
                        : 'bg-white border-gray-300 text-gray-400'
                    } ${isClickable ? 'group-hover:shadow-md' : ''}`}
                  >
                    {isCompleted ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="text-sm font-semibold">{step.id}</span>
                    )}
                  </div>

                  {/* Right line */}
                  {index < steps.length - 1 && (() => {
                    const nextStep = steps[index + 1];
                    if (!nextStep) return null;
                    return (
                      <div
                        className={`flex-1 h-0.5 ${
                          completedSteps.includes(nextStep.id) || nextStep.id === currentStep
                            ? 'bg-indigo-500'
                            : 'bg-gray-200'
                        }`}
                      />
                    );
                  })()}
                </div>

                {/* Labels */}
                <div className="mt-3 text-center">
                  <p
                    className={`text-sm font-medium ${
                      isCompleted || isCurrent ? 'text-indigo-600' : 'text-gray-500'
                    }`}
                  >
                    {step.title}
                  </p>
                  {step.description && (
                    <p className="text-xs text-gray-400 mt-0.5">{step.description}</p>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {/* Mobile view */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-indigo-600">
            Step {currentStep} of {steps.length}
          </span>
          <span className="text-sm text-gray-500">
            {steps.find(s => s.id === currentStep)?.title}
          </span>
        </div>
        <div className="relative">
          <div className="overflow-hidden h-2 text-xs flex rounded-full bg-gray-200">
            <div
              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500 transition-all duration-300"
            />
          </div>
        </div>
        <div className="flex justify-between mt-2">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`w-4 h-4 rounded-full flex items-center justify-center ${
                completedSteps.includes(step.id)
                  ? 'bg-indigo-500'
                  : step.id === currentStep
                  ? 'bg-indigo-500'
                  : 'bg-gray-300'
              }`}
            >
              {completedSteps.includes(step.id) && (
                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default StepProgress;
