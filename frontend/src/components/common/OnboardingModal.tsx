import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useHelp } from '../../contexts/HelpContext';

// =============================================================================
// Onboarding Steps
// =============================================================================

interface OnboardingStep {
  title: string;
  description: string;
  image: string;
  tip: string;
}

const onboardingSteps: OnboardingStep[] = [
  {
    title: 'Welcome to Gold Factory Inventory!',
    description:
      "This system helps you track gold jewelry orders from creation to delivery. Let's take a quick tour.",
    image: '/images/onboarding/welcome.png',
    tip: 'You can always access help by pressing Ctrl + / or clicking the ? icon.',
  },
  {
    title: 'Dashboard Overview',
    description:
      'Your dashboard shows key metrics at a glance - active orders, due dates, and recent activity. Check here daily for updates.',
    image: '/images/onboarding/dashboard.png',
    tip: 'Click any metric card to see detailed information.',
  },
  {
    title: 'Creating Orders',
    description:
      'Go to Orders and click "New Order" to create customer orders. Fill in details like product, quantity, and due date.',
    image: '/images/onboarding/create-order.png',
    tip: 'Add detailed notes to help factory workers understand special requirements.',
  },
  {
    title: 'Factory Tracking',
    description:
      'The Kanban board shows orders moving through departments. Managers can drag orders between columns.',
    image: '/images/onboarding/kanban.png',
    tip: 'Color coding shows priority - red for urgent, orange for high priority.',
  },
  {
    title: 'Reports & Analytics',
    description:
      'Generate reports on production, orders, and efficiency. Export to PDF or Excel for analysis.',
    image: '/images/onboarding/reports.png',
    tip: 'Set up scheduled reports to automatically receive updates by email.',
  },
  {
    title: "You're Ready!",
    description:
      "That's the basics! Explore the system, and remember - help is always just a click away.",
    image: '/images/onboarding/complete.png',
    tip: 'Check the User Guide for detailed instructions on every feature.',
  },
];

// =============================================================================
// Onboarding Modal Component
// =============================================================================

export const OnboardingModal: React.FC = () => {
  const { showOnboarding, completeOnboarding } = useHelp();
  const [currentStep, setCurrentStep] = useState(0);

  if (!showOnboarding) return null;

  const step = onboardingSteps[currentStep];
  if (!step) return null;

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === onboardingSteps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      completeOnboarding();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="group relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-5">
          {/* Decorative orb in header */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-12 translate-x-12" />
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
            aria-label="Skip onboarding"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-white relative">{step.title}</h2>
        </div>

        {/* Content */}
        <div className="relative p-6">
          {/* Decorative background orb */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-indigo-100/50 to-purple-100/50 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-300 pointer-events-none" />

          <div className="relative">
            {/* Image placeholder */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl h-48 flex items-center justify-center mb-6 border border-gray-100">
              <div className="text-gray-400 text-sm">[Screenshot: {step.image}]</div>
            </div>

            {/* Description */}
            <p className="text-gray-700 text-lg mb-4 leading-relaxed">{step.description}</p>

            {/* Tip */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-4">
              <p className="text-indigo-800 text-sm">
                <strong>💡 Tip:</strong> {step.tip}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-between bg-gray-50/50">
          {/* Progress dots */}
          <div className="flex gap-2">
            {onboardingSteps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                  index === currentStep
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 scale-110'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to step ${index + 1}`}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex gap-3">
            {!isFirstStep && (
              <button
                onClick={handlePrevious}
                className="flex items-center gap-1 px-4 py-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all duration-200 font-medium"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-200 font-medium hover:scale-[1.02]"
            >
              {isLastStep ? 'Get Started' : 'Next'}
              {!isLastStep && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// Feature Spotlight Component
// =============================================================================

interface SpotlightProps {
  target: string; // CSS selector
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  onNext: () => void;
  onSkip: () => void;
  step: number;
  totalSteps: number;
}

export const FeatureSpotlight: React.FC<SpotlightProps> = ({
  title,
  description,
  position = 'bottom',
  onNext,
  onSkip,
  step,
  totalSteps,
}) => {
  const positionClasses = {
    top: 'bottom-full mb-4',
    bottom: 'top-full mt-4',
    left: 'right-full mr-4',
    right: 'left-full ml-4',
  };

  return (
    <div className={`absolute ${positionClasses[position]} z-50 w-80`}>
      <div className="group relative bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* Decorative orb */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-300 pointer-events-none" />

        {/* Arrow */}
        <div
          className={`absolute w-3 h-3 bg-white border-l border-t border-gray-100 transform rotate-45 ${
            position === 'bottom' ? '-top-1.5 left-8' : ''
          }`}
        />

        {/* Content */}
        <div className="relative p-4">
          <h4 className="font-bold text-gray-900 mb-2">{title}</h4>
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">{description}</p>

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">
              {step} of {totalSteps}
            </span>
            <div className="flex gap-2">
              <button
                onClick={onSkip}
                className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 hover:bg-gray-100 rounded-lg transition-all duration-200"
              >
                Skip
              </button>
              <button
                onClick={onNext}
                className="text-sm bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-1.5 rounded-xl hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/30 transition-all duration-200 font-medium"
              >
                {step === totalSteps ? 'Done' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// Help Search Modal
// =============================================================================

import { Search } from 'lucide-react';

export const HelpSearchModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { searchHelp } = useHelp();
  const [query, setQuery] = useState('');
  const results = searchHelp(query);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/40 backdrop-blur-sm">
      <div className="group relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 border border-gray-100 overflow-hidden">
        {/* Decorative orb */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-indigo-100/50 to-purple-100/50 rounded-full -translate-y-16 translate-x-16 pointer-events-none" />

        {/* Search input */}
        <div className="relative border-b border-gray-100">
          <Search className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search help topics..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 pr-12 py-4 text-lg focus:outline-none bg-transparent relative"
            autoFocus
          />
          <button
            onClick={onClose}
            className="absolute right-3 top-3 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto relative">
          {query && results.length === 0 && (
            <div className="p-8 text-center text-gray-500">No results found for "{query}"</div>
          )}

          {results.map((result) => (
            <button
              key={result.key}
              className="w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 border-b border-gray-50 last:border-0 transition-all duration-200"
              onClick={onClose}
            >
              <div className="font-medium text-gray-900">{result.title}</div>
              <div className="text-sm text-gray-600 mt-1">{result.content}</div>
            </button>
          ))}

          {!query && (
            <div className="p-6 text-sm text-gray-500">
              <p className="mb-4 font-medium">Try searching for:</p>
              <div className="flex flex-wrap gap-2">
                {['create order', 'kanban', 'reports', 'password', 'notifications'].map((term) => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className="px-4 py-1.5 bg-gradient-to-r from-gray-100 to-gray-50 rounded-xl hover:from-indigo-100 hover:to-purple-100 transition-all duration-200 border border-gray-100"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;
