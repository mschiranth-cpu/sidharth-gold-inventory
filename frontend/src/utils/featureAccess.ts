import type { UserFeatures } from '../services/features.service';

const featurePaths: [string, string][] = [
  ['/app/inventory/metal', 'METAL_INVENTORY'],
  ['/app/inventory/diamonds', 'DIAMOND_INVENTORY'],
  ['/app/diamonds/purchase-orders', 'DIAMOND_INVENTORY'],
  ['/app/inventory/real-stones', 'REAL_STONE_INVENTORY'],
  ['/app/inventory/stone-packets', 'STONE_INVENTORY'],
  ['/app/inventory/factory', 'FACTORY_INVENTORY'],
  ['/app/attendance', 'ATTENDANCE'],
  ['/app/payroll', 'PAYROLL'],
  ['/app/admin/clients', 'CLIENT_PORTAL'],
  ['/app/admin/order-approvals', 'CLIENT_PORTAL'],
  ['/client', 'CLIENT_PORTAL'],
];

export function featureForPath(pathname: string): string | undefined {
  pathname = pathname.replace(/\/+$/, '') || '/';
  // Account recovery and public client authentication remain available.
  if (['/client/profile', '/client/login', '/client/register'].some((path) => pathname === path)) return undefined;
  return featurePaths.find(([prefix]) => pathname === prefix || pathname.startsWith(prefix + '/'))?.[1];
}

export function canUseFeaturePath(pathname: string, features: UserFeatures | undefined, role?: string): boolean {
  pathname = pathname.replace(/\/+$/, '') || '/';
  if (role === 'ADMIN') return true;
  if (pathname === '/app/inventory') {
    return ['METAL_INVENTORY', 'DIAMOND_INVENTORY', 'REAL_STONE_INVENTORY', 'STONE_INVENTORY'].some((feature) => !features?.[feature] || (features[feature].hasAccess && features[feature].canRead));
  }
  const name = featureForPath(pathname);
  if (!name || !features?.[name]) return true;
  const permission = features[name];
  if (!permission.hasAccess || !permission.canRead) return false;
  const parts = pathname.split('/');
  const operation = parts[parts.length - 1];
  if (operation && ['new', 'receive', 'issue', 'transfer', 'melting', 'treatment', 'check-in', 'check-out'].includes(operation)) {
    return permission.canWrite;
  }
  return true;
}
