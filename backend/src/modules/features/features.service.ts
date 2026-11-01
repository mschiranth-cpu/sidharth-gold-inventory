import { DepartmentName, FeatureModule, FeaturePermission, Prisma, PrismaClient, UserRole } from '@prisma/client';
import { z } from 'zod';
import { FEATURE_CATALOG, findCatalogFeature } from './features.catalog';
import { BulkFeaturePermissionRequest, CreateFeatureModuleRequest, FeatureAccessCheck, FeatureScope, UpdateFeaturePermissionRequest, UserFeatures } from './features.types';

const prisma = new PrismaClient();
type Database = Pick<Prisma.TransactionClient, 'featureModule' | 'featurePermission' | 'user' | 'auditLog'>;
type StoredModule = FeatureModule & { permissions: FeaturePermission[] };
type CatalogModule = NonNullable<ReturnType<typeof findCatalogFeature>>;
type Context = { role?: UserRole; userId?: string; departmentId?: string | null };
type Entry = { catalog: CatalogModule; modules: StoredModule[]; permissions: FeaturePermission[] };

export class FeatureRequestError extends Error {
  constructor(public status: number, message: string) { super(message); this.name = 'FeatureRequestError'; }
}

const idSchema = z.string().trim().min(1).max(128);
const scopeSchema = z.object({ type: z.enum(['role', 'user', 'department']), id: idSchema }).strict();
const changeSchema = z.object({
  featureId: idSchema.optional(), featureIds: z.array(idSchema).min(1).max(FEATURE_CATALOG.length).optional(),
  scope: scopeSchema.optional(), userId: idSchema.optional(), role: idSchema.optional(), departmentId: idSchema.optional(),
  isEnabled: z.boolean().optional(), canRead: z.boolean().optional(), canWrite: z.boolean().optional(), canDelete: z.boolean().optional(), inherit: z.boolean().optional(),
}).strict();

function invalid(message: string): never { throw new FeatureRequestError(400, message); }

export function parseFeatureScope(type: unknown = 'role', id: unknown = 'ADMIN'): FeatureScope {
  const parsed = scopeSchema.safeParse({ type, id });
  if (!parsed.success) return invalid('Select a valid role, user or department scope.');
  const scope = parsed.data;
  if (scope.type === 'role' && !Object.values(UserRole).includes(scope.id as UserRole)) invalid('Unknown role.');
  if (scope.type === 'department' && !Object.values(DepartmentName).includes(scope.id as DepartmentName)) invalid('Unknown department.');
  return { type: scope.type!, id: scope.id! };
}

function parseChange(input: unknown, bulk: boolean) {
  const result = changeSchema.safeParse(input);
  if (!result.success) return invalid('Invalid feature permission request.');
  const data = result.data;
  if (bulk ? (!data.featureIds || data.featureId !== undefined) : (!data.featureId || data.featureIds !== undefined)) invalid('Select the feature or features to change.');
  const legacy = [['user', data.userId], ['role', data.role], ['department', data.departmentId]].filter(([, value]) => value !== undefined);
  if ((data.scope && legacy.length) || (!data.scope && legacy.length !== 1)) invalid('Specify exactly one permission scope.');
  const scope = data.scope ? parseFeatureScope(data.scope.type, data.scope.id) : parseFeatureScope(legacy[0][0], legacy[0][1]);
  if (data.inherit === true) {
    if (['isEnabled', 'canRead', 'canWrite', 'canDelete'].some((key) => data[key as keyof typeof data] !== undefined)) invalid('An inheritance reset cannot include permission values.');
  } else if (typeof data.isEnabled !== 'boolean') invalid('isEnabled must be a boolean.');
  if (data.isEnabled && data.canRead === false && (data.canWrite === true || data.canDelete === true)) invalid('Read access is required for write or delete access.');
  return { data, scope, identifiers: bulk ? data.featureIds! : [data.featureId!] };
}

async function readCatalog(db: Database, context?: Context): Promise<Entry[]> {
  const subjects: Prisma.FeaturePermissionWhereInput[] = [];
  if (context?.userId) subjects.push({ userId: context.userId });
  if (context?.departmentId) subjects.push({ departmentId: context.departmentId });
  if (context?.role) subjects.push({ role: context.role });
  const stored = await db.featureModule.findMany({
    where: { name: { in: FEATURE_CATALOG.flatMap((feature) => [feature.name, ...feature.aliases]) } },
    include: { permissions: { where: context ? { OR: subjects } : undefined } },
    orderBy: { displayName: 'asc' },
  });
  return FEATURE_CATALOG.map((catalog) => {
    const modules = stored.filter((module) => findCatalogFeature(module.name)?.name === catalog.name)
      .sort((a, b) => Number(b.name === catalog.name) - Number(a.name === catalog.name) || a.id.localeCompare(b.id));
    // Old schemas have no department uniqueness constraint. Preserve their
    // rows, but resolve legacy duplicates deterministically until reset.
    const permissions = modules.flatMap((module) => [...module.permissions].sort((a, b) =>
      (b.enabledAt?.getTime() ?? 0) - (a.enabledAt?.getTime() ?? 0) || a.id.localeCompare(b.id)));
    return { catalog, modules, permissions };
  });
}

function findEntry(entries: Entry[], identifier: string): Entry {
  const canonical = findCatalogFeature(identifier)?.name;
  const entry = entries.find((item) => item.catalog.name === canonical || item.modules.some((module) => module.id === identifier));
  if (!entry) return invalid('Unknown or retired feature.');
  return entry;
}

function matchesScope(permission: FeaturePermission, scope: FeatureScope) {
  // Preserve legacy user overrides that also carried a role. A row belongs
  // only to its most specific scope, so it cannot affect other users' roles.
  return scope.type === 'user' ? permission.userId === scope.id
    : scope.type === 'department' ? permission.departmentId === scope.id && !permission.userId
    : permission.role === scope.id && !permission.userId && !permission.departmentId;
}

async function scopeContext(scope: FeatureScope, db: Database): Promise<Context> {
  if (scope.type === 'role') return { role: scope.id as UserRole };
  if (scope.type === 'department') return { departmentId: scope.id };
  const user = await db.user.findUnique({ where: { id: scope.id }, select: { role: true, department: true, isActive: true } });
  if (!user || !user.isActive) return invalid('Select an active user.');
  return { role: user.role, userId: scope.id, departmentId: user.department };
}

const allow: FeatureAccessCheck = { hasAccess: true, canRead: true, canWrite: true, canDelete: true };
const deny: FeatureAccessCheck = { hasAccess: false, canRead: false, canWrite: false, canDelete: false };

function effectiveAccess(entry: Entry, context: Context): FeatureAccessCheck {
  if (context.role === UserRole.ADMIN) return { ...allow, source: 'admin' };
  const scopes: FeatureScope[] = [];
  if (context.userId) scopes.push({ type: 'user', id: context.userId });
  if (context.departmentId) scopes.push({ type: 'department', id: context.departmentId });
  if (context.role) scopes.push({ type: 'role', id: context.role });
  for (const scope of scopes) {
    const permission = entry.permissions.find((row) => matchesScope(row, scope));
    if (permission) return {
      hasAccess: permission.isEnabled,
      canRead: permission.isEnabled && permission.canRead,
      canWrite: permission.isEnabled && permission.canRead && permission.canWrite,
      canDelete: permission.isEnabled && permission.canRead && permission.canDelete,
      source: scope.type,
    };
  }
  // Feature policy only restricts existing RBAC/ownership access. An empty
  // configuration must preserve the behavior of the live application.
  return { ...allow, source: entry.modules[0]?.isGlobal ? 'global' : 'default' };
}

function present(entry: Entry, scope: FeatureScope, context: Context) {
  const module = entry.modules[0];
  return {
    id: entry.catalog.name, name: entry.catalog.name, displayName: entry.catalog.displayName,
    description: entry.catalog.description, icon: entry.catalog.icon, isGlobal: module?.isGlobal ?? false,
    isConfigured: entry.modules.length > 0, createdAt: module?.createdAt ?? null, updatedAt: module?.updatedAt ?? null,
    permissions: entry.permissions,
    override: entry.permissions.find((permission) => matchesScope(permission, scope)) ?? null,
    effective: effectiveAccess(entry, context),
  };
}

export async function getAllFeatureModules(scope: FeatureScope = { type: 'role', id: 'ADMIN' }) {
  const validated = parseFeatureScope(scope.type, scope.id);
  const context = await scopeContext(validated, prisma);
  const entries = await readCatalog(prisma, context);
  return entries.map((entry) => present(entry, validated, context));
}

export async function getFeatureModuleByName(name: string) {
  const entry = findEntry(await readCatalog(prisma), name);
  return present(entry, { type: 'role', id: 'ADMIN' }, { role: UserRole.ADMIN });
}

async function requireAdmin(actorId: string, db: Database) {
  const actor = await db.user.findUnique({ where: { id: actorId }, select: { role: true, isActive: true } });
  if (!actor?.isActive || actor.role !== UserRole.ADMIN) throw new FeatureRequestError(403, 'Administrator access required.');
}

function scopeWhere(entry: Entry, scope: FeatureScope) {
  const featureId = { in: entry.modules.map((module) => module.id) };
  if (scope.type === 'user') return { featureId, userId: scope.id };
  if (scope.type === 'department') return { featureId, userId: null, departmentId: scope.id };
  return {
    featureId, userId: null, role: scope.id as UserRole, departmentId: null,
  };
}

async function materialize(entry: Entry, db: Database) {
  if (entry.modules.length) return entry.modules[0];
  const { name, displayName, description, icon } = entry.catalog;
  return db.featureModule.upsert({ where: { name }, update: {}, create: { name, displayName, description, icon, isGlobal: false } });
}

function permissionValue(permission: Pick<FeaturePermission, 'isEnabled' | 'canRead' | 'canWrite' | 'canDelete'> | undefined) {
  return permission ? { isEnabled: permission.isEnabled, canRead: permission.canRead, canWrite: permission.canWrite, canDelete: permission.canDelete } : null;
}

async function changePermissions(input: unknown, actorId: string, bulk: boolean) {
  const { data, scope, identifiers } = parseChange(input, bulk);
  return prisma.$transaction(async (tx) => {
    await requireAdmin(actorId, tx);
    const context = await scopeContext(scope, tx);
    if (context.role === UserRole.ADMIN) return invalid('Administrator feature access is protected for recovery.');
    const catalog = await readCatalog(tx, context);
    // Validate every item before the first mutation, including aliases and IDs.
    const entries = identifiers.map((identifier) => findEntry(catalog, identifier));
    if (new Set(entries.map((entry) => entry.catalog.name)).size !== entries.length) invalid('A feature can appear only once in a bulk change.');
    const changes = entries.map((entry) => {
      const previous = entry.permissions.find((row) => matchesScope(row, scope));
      const inherited = effectiveAccess(entry, context);
      const permission = data.inherit ? null : {
        isEnabled: data.isEnabled!,
        canRead: data.canRead ?? previous?.canRead ?? inherited.canRead,
        canWrite: data.canWrite ?? previous?.canWrite ?? inherited.canWrite,
        canDelete: data.canDelete ?? previous?.canDelete ?? inherited.canDelete,
      };
      if (permission?.isEnabled && !permission.canRead && (permission.canWrite || permission.canDelete)) invalid('Read access is required for write or delete access.');
      return { entry, previous, permission };
    });
    const results = [];
    for (const { entry, previous, permission } of changes) {
      let saved: FeaturePermission | null = null;
      if (!permission) {
        if (entry.modules.length) await tx.featurePermission.deleteMany({ where: scopeWhere(entry, scope) });
      } else {
        const module = await materialize(entry, tx);
        const values = {
          userId: scope.type === 'user' ? scope.id : null,
          role: scope.type === 'role' ? scope.id as UserRole : null,
          departmentId: scope.type === 'department' ? scope.id : null,
          ...permission, enabledById: actorId, enabledAt: new Date(),
        };
        saved = previous
          ? await tx.featurePermission.update({ where: { id: previous.id }, data: values })
          : await tx.featurePermission.create({ data: { featureId: module.id, ...values } });
      }
      // The policy and audit commit together or roll back together.
      await tx.auditLog.create({ data: {
        entityType: 'FeaturePermission', entityId: entry.catalog.name, action: permission ? 'UPDATE' : 'RESET', userId: actorId,
        oldValues: { featureName: entry.catalog.name, scope: { type: scope.type, id: scope.id }, permission: permissionValue(previous) },
        newValues: { featureName: entry.catalog.name, scope: { type: scope.type, id: scope.id }, permission },
      } });
      results.push({ featureId: entry.catalog.name, scope, override: saved });
    }
    return results;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 5000, timeout: 15000 });
}

export async function createFeatureModule(data: CreateFeatureModuleRequest, createdById: string) {
  const catalog = findCatalogFeature(data?.name);
  if (!catalog) return invalid('Only supported feature modules can be configured.');
  return prisma.$transaction(async (tx) => {
    await requireAdmin(createdById, tx);
    const entry = findEntry(await readCatalog(tx), catalog.name);
    const saved = await materialize(entry, tx);
    await tx.auditLog.create({ data: { entityType: 'FeatureModule', entityId: catalog.name, action: 'CONFIGURE', userId: createdById, newValues: { featureName: catalog.name } } });
    return saved;
  });
}

export async function updateFeaturePermission(data: UpdateFeaturePermissionRequest, enabledById: string) {
  return (await changePermissions(data, enabledById, false))[0];
}

export async function bulkUpdateFeaturePermissions(data: BulkFeaturePermissionRequest, enabledById: string) {
  return changePermissions(data, enabledById, true);
}

export async function getRoleFeatureAccess(role: UserRole, featureName: string): Promise<FeatureAccessCheck> {
  const entry = findEntry(await readCatalog(prisma, { role }), featureName);
  return effectiveAccess(entry, { role });
}

export async function checkFeatureAccess(userId: string, featureName: string): Promise<FeatureAccessCheck> {
  const features = await getUserFeatures(userId);
  return features[findCatalogFeature(featureName)?.name ?? featureName] ?? { ...deny };
}

export async function getUserFeatures(userId: string): Promise<UserFeatures> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, department: true, isActive: true } });
  if (!user?.isActive) return {};
  if (user.role === UserRole.ADMIN) return Object.fromEntries(FEATURE_CATALOG.map((feature) => [feature.name, { ...allow, source: 'admin' }]));
  const context = { userId, role: user.role, departmentId: user.department };
  const catalog = await readCatalog(prisma, context);
  return Object.fromEntries(catalog.map((entry) => [entry.catalog.name, effectiveAccess(entry, context)]));
}

export async function getFeaturePermissions(featureId: string) {
  return findEntry(await readCatalog(prisma), featureId).permissions;
}

export async function deleteFeaturePermission(permissionId: string, actorId: string) {
  const row = await prisma.featurePermission.findUnique({ where: { id: permissionId }, include: { feature: true } });
  if (!row) throw new FeatureRequestError(404, 'Permission not found.');
  const scope: FeatureScope | null = row.userId ? { type: 'user', id: row.userId }
    : row.departmentId ? { type: 'department', id: row.departmentId }
    : row.role ? { type: 'role', id: row.role } : null;
  if (!scope) return invalid('This legacy permission has no valid scope.');
  return updateFeaturePermission({ featureId: row.featureId, scope, inherit: true }, actorId);
}

export async function getFeatureSubjects() {
  const users = await prisma.user.findMany({ where: { isActive: true }, select: { id: true, name: true, role: true, department: true }, orderBy: { name: 'asc' } });
  return { roles: Object.values(UserRole), users, departments: Object.values(DepartmentName).map((id) => ({ id, name: id.replace(/_/g, ' ') })) };
}

export async function getFeatureAudit(input: { limit?: unknown; cursor?: unknown } = {}) {
  const parsed = z.object({ limit: z.coerce.number().int().min(1).max(100).default(25), cursor: idSchema.optional() }).safeParse(input);
  if (!parsed.success) return invalid('Invalid history cursor or limit.');
  const { limit, cursor } = parsed.data;
  const rows = await prisma.auditLog.findMany({
    where: { entityType: { in: ['FeaturePermission', 'FeatureModule'] } },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  const page = rows.slice(0, limit);
  const actors = await prisma.user.findMany({ where: { id: { in: [...new Set(page.map((row) => row.userId))] } }, select: { id: true, name: true } });
  return { items: page.map((row) => ({ ...row, actorName: actors.find((actor) => actor.id === row.userId)?.name ?? 'Former user' })), nextCursor: rows.length > limit ? page[page.length - 1].id : null };
}
