/**
 * ============================================
 * COMMON COMPONENTS INDEX
 * ============================================
 *
 * Central export point for all common/shared components.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

// Skeleton components
export {
  Skeleton,
  TextSkeleton,
  CardSkeleton,
  StatCardSkeleton,
  TableSkeleton,
  DashboardSkeleton,
  PageSkeleton,
  FormSkeleton,
  KanbanSkeleton,
  ListItemSkeleton,
  AvatarSkeleton,
  TabContentSkeleton,
  WorkSubmissionFormSkeleton,
  ProfileSkeleton,
  NotificationDropdownSkeleton,
  FileGallerySkeleton,
  MetricCardSkeleton,
} from './Skeleton';

// Optimized image components
export {
  OptimizedImage,
  ImageWithWebP,
  LazyAvatar,
  LazyBackground,
  generateBlurDataUrl,
  preloadImage,
  preloadImages,
} from './OptimizedImage';

// Virtual list components
export { VirtualList, VirtualTable, InfiniteScrollList, AutoSizer } from './VirtualList';

// Error boundary components
export {
  ErrorBoundary,
  RouteErrorBoundary,
  AsyncBoundary,
  withErrorBoundary,
} from './ErrorBoundary';
