/**
 * ============================================
 * NAVIGATION LOADER
 * ============================================
 *
 * Global loading overlay for ALL page navigations including:
 * - Link clicks
 * - Programmatic navigation (navigate())
 * - Browser back/forward buttons
 * - Direct URL changes
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export const NavigationLoader: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const [previousPath, setPreviousPath] = useState(location.pathname);

  useEffect(() => {
    // Triggers on ALL navigation (links, back/forward buttons, programmatic)
    if (location.pathname !== previousPath) {
      setLoading(true);

      // Hide loader after smooth transition delay
      const timer = setTimeout(() => {
        setLoading(false);
        setPreviousPath(location.pathname);
      }, 400);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [location.pathname, previousPath]);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 bg-gray-900/60 backdrop-blur-sm z-[9999] transition-all duration-300 animate-in fade-in">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4 animate-in zoom-in-95 duration-300">
          <div className="relative">
            <div className="h-16 w-16 border-4 border-indigo-200 rounded-full"></div>
            <div className="absolute inset-0 h-16 w-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <p className="text-gray-700 font-medium">Loading page...</p>
            <p className="text-gray-500 text-sm">Please wait</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavigationLoader;
