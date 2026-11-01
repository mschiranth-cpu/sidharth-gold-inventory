import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { getMyFeatures } from '../services/features.service';
import { canUseFeaturePath } from '../utils/featureAccess';

export function useFeatures() {
  const { user, isAuthenticated } = useAuth();
  const query = useQuery({
    queryKey: ['my-features', user?.id, user?.role, user?.department],
    queryFn: getMyFeatures,
    enabled: isAuthenticated && !!user && user.role !== 'ADMIN',
    staleTime: 30_000,
    refetchOnWindowFocus: 'always',
    refetchOnMount: 'always',
    // Other administrators may change this session's permissions. Refresh only
    // visible clients; the API independently enforces current grants per request.
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    retry: 1,
  });
  return {
    ...query,
    isChecking: user?.role !== 'ADMIN' && query.isPending && query.fetchStatus !== 'idle',
    canUsePath: (path: string) => canUseFeaturePath(path, query.data, user?.role),
    canPerform: (feature: string, operation: 'read' | 'write' | 'delete') => {
      if (user?.role === 'ADMIN') return true;
      if (!isAuthenticated || !user || query.isPending || query.isError) return false;
      const permission = query.data?.[feature];
      if (!permission) return true;
      return permission.hasAccess && permission.canRead && permission[operation === 'read' ? 'canRead' : operation === 'write' ? 'canWrite' : 'canDelete'];
    },
    isAdmin: user?.role === 'ADMIN',
  };
}
