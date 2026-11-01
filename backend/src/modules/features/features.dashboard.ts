import type { DashboardOverview, InventorySnapshot, WorkerDashboardOverview } from '../dashboard/dashboard.types';
import type { UserFeatures } from './features.types';

/** Public projection of a cached aggregate; a restricted value is not a zero. */
type RestrictedInventorySnapshot = Omit<InventorySnapshot, 'metalStockGrams' | 'diamondPieces' | 'realStonePieces' | 'stonePackets'> & {
  metalStockGrams: number | null; diamondPieces: number | null; realStonePieces: number | null; stonePackets: number | null;
};
export type FeatureDashboardOverview = Omit<DashboardOverview, 'inventorySnapshot' | 'attendanceToday'> & {
  inventorySnapshot: RestrictedInventorySnapshot;
  attendanceToday: DashboardOverview['attendanceToday'] | null;
};
export type FeatureWorkerOverview = Omit<WorkerDashboardOverview, 'myAttendanceToday'> & {
  myAttendanceToday: WorkerDashboardOverview['myAttendanceToday'] | null;
};

function canRead(features: UserFeatures, name: string) {
  return Boolean(features[name]?.hasAccess && features[name]?.canRead);
}

/** Never mutate the cached input: evaluate fresh feature policy for each response. */
export function filterDashboardFeatures(data: DashboardOverview, features: UserFeatures): FeatureDashboardOverview {
  const stockFeatures = { METAL: 'METAL_INVENTORY', DIAMOND: 'DIAMOND_INVENTORY', STONE_PACKET: 'STONE_INVENTORY' };
  return {
    ...data,
    inventorySnapshot: {
      ...data.inventorySnapshot,
      metalStockGrams: canRead(features, 'METAL_INVENTORY') ? data.inventorySnapshot.metalStockGrams : null,
      diamondPieces: canRead(features, 'DIAMOND_INVENTORY') ? data.inventorySnapshot.diamondPieces : null,
      realStonePieces: canRead(features, 'REAL_STONE_INVENTORY') ? data.inventorySnapshot.realStonePieces : null,
      stonePackets: canRead(features, 'STONE_INVENTORY') ? data.inventorySnapshot.stonePackets : null,
      lowStockItems: data.inventorySnapshot.lowStockItems.filter((item) => canRead(features, stockFeatures[item.type])),
    },
    attendanceToday: canRead(features, 'ATTENDANCE') ? data.attendanceToday : null,
  };
}

export function filterWorkerDashboardFeatures(data: WorkerDashboardOverview, features: UserFeatures): FeatureWorkerOverview {
  return { ...data, myAttendanceToday: canRead(features, 'ATTENDANCE') ? data.myAttendanceToday : null };
}
