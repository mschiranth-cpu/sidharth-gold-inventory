// Worker activity timeline = same component, but with a worker-flavoured empty text.
import { RecentActivityTimeline } from './RecentActivityTimeline';
import type { RecentActivityItem } from '../../../../types/dashboard.types';

export interface MyActivityTimelineProps {
  data: RecentActivityItem[] | undefined;
  isLoading?: boolean;
  editMode?: boolean;
  dragHandleProps?: Record<string, unknown>;
  onHide?: () => void;
}

export const MyActivityTimeline = (props: MyActivityTimelineProps) => (
  <RecentActivityTimeline {...props} emptyText="No recent activity from you yet today." />
);

export default MyActivityTimeline;
