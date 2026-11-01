import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useFeatures } from '../../hooks/useFeatures';
import { featureForPath } from '../../utils/featureAccess';

export default function FeatureAccessBoundary({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { isChecking, isError, isAdmin, canUsePath, refetch } = useFeatures();
  if (isAdmin || !featureForPath(pathname)) return <>{children}</>;
  if (isChecking) return <p className="p-6 text-onyx-600" role="status">Checking module access...</p>;
  if (isError) return (
    <div className="rounded-xl border border-champagne-200 bg-white p-6" role="alert">
      <h1 className="text-xl font-semibold text-onyx-900">Unable to check module access</h1>
      <p className="mt-2 text-onyx-600">Your permissions could not be loaded. Please try again.</p>
      <button type="button" onClick={() => refetch()} className="mt-4 rounded-lg bg-onyx-900 px-4 py-2 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-champagne-600">Try again</button>
    </div>
  );
  if (!canUsePath(pathname)) return (
    <div className="rounded-xl border border-champagne-200 bg-white p-6" role="alert">
      <h1 className="text-xl font-semibold text-onyx-900">Module access unavailable</h1>
      <p className="mt-2 max-w-prose text-onyx-600">Your feature permissions do not allow this page or action. Ask your administrator to review your module access.</p>
    </div>
  );
  return <>{children}</>;
}
