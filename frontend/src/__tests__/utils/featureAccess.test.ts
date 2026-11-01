import { describe, expect, it } from 'vitest';
import { featureForPath, canUseFeaturePath } from '../../utils/featureAccess';

const denied = { METAL_INVENTORY: { hasAccess: false, canRead: false, canWrite: false, canDelete: false } };
describe('Feature route restrictions', () => {
  it('maps only the intended inventory and production paths', () => {
    expect(featureForPath('/app/inventory/metal/receive')).toBe('METAL_INVENTORY');
    expect(featureForPath('/app/diamonds/purchase-orders/123')).toBe('DIAMOND_INVENTORY');
    expect(featureForPath('/app/inventory/factory')).toBe('FACTORY_INVENTORY');
    expect(featureForPath('/app/factory')).toBeUndefined();
    expect(featureForPath('/app/inventory/metal-other')).toBeUndefined();
    expect(featureForPath('/app/admin/clients')).toBe('CLIENT_PORTAL');
    expect(featureForPath('/app/admin/order-approvals')).toBe('CLIENT_PORTAL');
    expect(featureForPath('/client/profile/')).toBeUndefined();
  });
  it('restricts a saved feature while preserving admin recovery and unrelated pages', () => {
    expect(canUseFeaturePath('/app/inventory/metal', denied, 'OFFICE_STAFF')).toBe(false);
    expect(canUseFeaturePath('/app/inventory/metal', denied, 'ADMIN')).toBe(true);
    expect(canUseFeaturePath('/app/admin/features', denied, 'ADMIN')).toBe(true);
    expect(canUseFeaturePath('/app/orders', denied, 'OFFICE_STAFF')).toBe(true);
    expect(canUseFeaturePath('/app/inventory/diamonds', denied, 'OFFICE_STAFF')).toBe(true);
  });
  it('requires write on dedicated mutation routes while allowing read-only browsing', () => {
    const readonly = { METAL_INVENTORY: { hasAccess: true, canRead: true, canWrite: false, canDelete: false } };
    expect(canUseFeaturePath('/app/inventory/metal/receive', readonly, 'OFFICE_STAFF')).toBe(false);
    expect(canUseFeaturePath('/app/inventory/metal/receive/', readonly, 'OFFICE_STAFF')).toBe(false);
    expect(canUseFeaturePath('/app/inventory/metal/stock', readonly, 'OFFICE_STAFF')).toBe(true);
    expect(canUseFeaturePath('/client/profile', { CLIENT_PORTAL: denied.METAL_INVENTORY }, 'CLIENT')).toBe(true);
  });
  it('hides aggregate inventory navigation only when every child module is denied', () => {
    const allDenied = Object.fromEntries(['METAL_INVENTORY', 'DIAMOND_INVENTORY', 'REAL_STONE_INVENTORY', 'STONE_INVENTORY'].map((name) => [name, denied.METAL_INVENTORY]));
    expect(canUseFeaturePath('/app/inventory', allDenied, 'OFFICE_STAFF')).toBe(false);
    expect(canUseFeaturePath('/app/inventory', denied, 'OFFICE_STAFF')).toBe(true);
  });
});
