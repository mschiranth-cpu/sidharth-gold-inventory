/** The supported modules. Reads expose this catalog without seeding production data. */
export const FEATURE_CATALOG = [
  { name: 'CLIENT_PORTAL', displayName: 'Client Portal', description: 'Client registration, orders and tracking', icon: 'Users', aliases: ['client_portal'] },
  { name: 'METAL_INVENTORY', displayName: 'Metal Inventory', description: 'Metal stock, transactions and melting', icon: 'Package', aliases: ['metal_inventory'] },
  { name: 'DIAMOND_INVENTORY', displayName: 'Diamond Inventory', description: 'Diamond stock, transactions and purchase orders', icon: 'Gem', aliases: ['diamond_inventory'] },
  { name: 'REAL_STONE_INVENTORY', displayName: 'Real Stone Inventory', description: 'Precious stone stock and transactions', icon: 'Sparkles', aliases: ['real_stone_inventory'] },
  { name: 'STONE_INVENTORY', displayName: 'Stone Inventory', description: 'Stone packet stock and transactions', icon: 'Circle', aliases: ['stone_inventory'] },
  { name: 'FACTORY_INVENTORY', displayName: 'Factory Inventory', description: 'Tools, equipment and consumables', icon: 'Wrench', aliases: ['factory_inventory'] },
  { name: 'ATTENDANCE', displayName: 'Attendance System', description: 'Attendance, shifts and leave management', icon: 'Calendar', aliases: ['attendance'] },
  { name: 'PAYROLL', displayName: 'Payroll System', description: 'Payroll periods, salaries and payslips', icon: 'DollarSign', aliases: ['payroll'] },
] as const;

export type FeatureName = typeof FEATURE_CATALOG[number]['name'];

export function findCatalogFeature(name: string) {
  return FEATURE_CATALOG.find((feature) => feature.name === name || (feature.aliases as readonly string[]).includes(name));
}
