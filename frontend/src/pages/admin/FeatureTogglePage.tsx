import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowPathIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import {
  getFeatureCatalog, getFeatureSubjects, getFeatureAudit, updateFeaturePermission, bulkUpdateFeaturePermissions,
  type FeatureScope, type FeatureCatalogItem, type FeatureCapabilities, type FeatureAuditItem,
} from '../../services/features.service';
import { USER_ROLE_LABELS, type UserRole } from '../../types/auth.types';

const controlClass = 'rounded-lg border border-champagne-300 bg-white px-3 py-2 text-base text-onyx-900 focus:border-champagne-600 focus:outline-none focus:ring-2 focus:ring-champagne-200 disabled:cursor-not-allowed disabled:opacity-50';
const buttonClass = 'rounded-lg border border-champagne-300 bg-white px-3 py-2 text-sm font-semibold text-onyx-800 hover:bg-champagne-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-champagne-600 disabled:cursor-not-allowed disabled:opacity-50';
const checkClass = 'h-5 w-5 cursor-pointer rounded border-champagne-400 accent-champagne-700 focus:ring-2 focus:ring-champagne-500 disabled:cursor-not-allowed disabled:opacity-50';
const sourceLabels: Record<string, string> = {
  admin: 'Administrator safeguard', user: 'User override', department: 'Department override',
  role: 'Role override', global: 'Global default', default: 'Existing role access',
};

function label(value: string) {
  return USER_ROLE_LABELS[value as UserRole] || value.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function capabilities(feature: FeatureCatalogItem): FeatureCapabilities {
  return feature.override ? {
    isEnabled: feature.override.isEnabled, canRead: feature.override.canRead,
    canWrite: feature.override.canWrite, canDelete: feature.override.canDelete,
  } : {
    isEnabled: feature.effective.hasAccess, canRead: feature.effective.canRead,
    canWrite: feature.effective.canWrite, canDelete: feature.effective.canDelete,
  };
}

function auditSummary(item: FeatureAuditItem) {
  const values = item.newValues || item.oldValues;
  const permission = values?.permission;
  return {
    module: values?.featureName ? label(values.featureName) : 'Module permissions',
    target: item.action === 'CONFIGURE' ? 'Module catalog' : values?.scope ? label(values.scope.type) + ': ' + label(values.scope.id) : 'Selected scope',
    action: item.action === 'CONFIGURE' ? 'Configured module' : values?.permission === null ? 'Restored inheritance' : values?.permission?.isEnabled === false ? 'Disabled module' : 'Updated permissions',
    details: item.action === 'CONFIGURE' ? 'Catalog configuration saved' : permission ? 'Read ' + (permission.canRead ? 'allowed' : 'blocked') + ' · Write ' + (permission.canWrite ? 'allowed' : 'blocked') + ' · Delete ' + (permission.canDelete ? 'allowed' : 'blocked') : 'Uses inherited permissions',
  };
}

export default function FeatureTogglePage() {
  const queryClient = useQueryClient();
  const [scope, setScope] = useState<FeatureScope>({ type: 'role', id: 'ADMIN' });
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState<{ error: boolean; text: string } | null>(null);
  const [bulkAction, setBulkAction] = useState<'enable' | 'disable' | 'inherit' | null>(null);
  const [auditCursor, setAuditCursor] = useState<string | undefined>();
  const [auditBack, setAuditBack] = useState<(string | undefined)[]>([]);

  const subjects = useQuery({ queryKey: ['feature-subjects'], queryFn: getFeatureSubjects });
  const catalog = useQuery({ queryKey: ['features', scope.type, scope.id], queryFn: () => getFeatureCatalog(scope), enabled: !!scope.id });
  const audit = useQuery({ queryKey: ['feature-audit', auditCursor], queryFn: () => getFeatureAudit(auditCursor) });
  const features = catalog.data || [];
  const selectedUser = subjects.data?.users.find((user) => user.id === scope.id);
  const locked = (scope.type === 'role' && scope.id === 'ADMIN') || (scope.type === 'user' && selectedUser?.role === 'ADMIN');

  const saved = () => {
    queryClient.invalidateQueries({ queryKey: ['features'] });
    queryClient.invalidateQueries({ queryKey: ['my-features'] });
    queryClient.invalidateQueries({ queryKey: ['feature-audit'] });
    setFeedback({ error: false, text: 'Feature permissions saved.' });
    setAuditCursor(undefined); setAuditBack([]);
    setBulkAction(null);
  };
  const failed = () => {
    queryClient.invalidateQueries({ queryKey: ['features'] });
    queryClient.invalidateQueries({ queryKey: ['my-features'] });
    queryClient.invalidateQueries({ queryKey: ['feature-audit'] });
    setFeedback({ error: true, text: 'Save could not be confirmed. Check the refreshed permissions before trying again.' });
  };
  const update = useMutation({ mutationFn: updateFeaturePermission, onSuccess: saved, onError: failed });
  const bulk = useMutation({ mutationFn: bulkUpdateFeaturePermissions, onSuccess: saved, onError: failed });
  const busy = update.isPending || bulk.isPending;

  function changeScope(type: FeatureScope['type']) {
    setFeedback(null); setBulkAction(null); setSearch('');
    const id = type === 'role' ? 'ADMIN' : type === 'user' ? subjects.data?.users[0]?.id || '' : subjects.data?.departments[0]?.id || '';
    setScope({ type, id });
  }

  function setPermission(feature: FeatureCatalogItem, key: keyof FeatureCapabilities, value: boolean) {
    const next = { ...capabilities(feature), [key]: value };
    if (key === 'canRead' && !value) { next.canWrite = false; next.canDelete = false; }
    if ((key === 'canWrite' || key === 'canDelete') && value) { next.canRead = true; next.isEnabled = true; }
    setFeedback(null); update.mutate({ featureId: feature.id, scope, ...next });
  }

  function applyBulk() {
    if (!bulkAction || locked || busy || catalog.isFetching || catalog.isError) return;
    const data = { scope, featureIds: features.map((feature) => feature.id) };
    if (bulkAction === 'inherit') bulk.mutate({ ...data, inherit: true });
    else if (bulkAction === 'disable') bulk.mutate({ ...data, isEnabled: false });
    else bulk.mutate({ ...data, isEnabled: true, canRead: true, canWrite: true, canDelete: true });
  }

  const visible = features.filter((feature) => (feature.displayName + ' ' + (feature.description || '')).toLowerCase().includes(search.toLowerCase()));
  const scopeLabel = scope.type === 'role' ? label(scope.id) : scope.type === 'user' ? selectedUser?.name || 'Select a user' : subjects.data?.departments.find((department) => department.id === scope.id)?.name || 'Select a department';

  return (
    <div className="mx-auto max-w-7xl space-y-6 text-onyx-900">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Feature Toggle Management</h1>
        <p className="mt-2 max-w-3xl text-base text-onyx-600">Manage module permissions for a role, a person, or a department. Feature settings can restrict existing role access; they cannot grant access beyond it.</p>
      </header>
      <section className="rounded-xl border border-champagne-200 bg-white p-5 sm:p-6" aria-label="Permission scope">
        <div className="flex flex-wrap gap-2" aria-label="Choose permission scope">
          {(['role', 'user', 'department'] as const).map((type) => <button type="button" key={type} disabled={busy} aria-pressed={scope.type === type} onClick={() => changeScope(type)}
            className={scope.type === type ? 'rounded-lg border border-onyx-800 bg-onyx-900 px-3 py-2 text-sm font-semibold text-white hover:bg-onyx-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-champagne-600 disabled:opacity-50' : buttonClass}>{type === 'role' ? 'Roles' : type === 'user' ? 'Users' : 'Departments'}</button>)}
        </div>
        <div className="mt-5 flex flex-wrap items-end gap-5">
          <div className="min-w-0 flex-1 sm:max-w-md">
            <label htmlFor="feature-subject" className="mb-2 block text-sm font-semibold">{label(scope.type)}</label>
            <select id="feature-subject" value={scope.id} disabled={busy || subjects.isPending || subjects.isError} className={controlClass + ' w-full'} onChange={(event) => { setScope({ ...scope, id: event.target.value }); setFeedback(null); setBulkAction(null); }}>
              {scope.type === 'role' && (subjects.data?.roles || ['ADMIN', 'OFFICE_STAFF', 'FACTORY_MANAGER', 'DEPARTMENT_WORKER', 'CLIENT']).map((role) => <option key={role} value={role}>{label(role)}</option>)}
              {scope.type === 'user' && (subjects.data?.users || []).map((user) => <option key={user.id} value={user.id}>{user.name} · {label(user.role)}</option>)}
              {scope.type === 'department' && (subjects.data?.departments || []).map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
              {!scope.id && <option value="">{subjects.isPending ? 'Loading...' : 'No subjects available'}</option>}
            </select>
          </div>
          <p className="max-w-xl text-sm leading-relaxed text-onyx-600">User overrides take priority, then department, role, and existing defaults. Use inherited permissions to remove an override.</p>
        </div>
        {subjects.isError && <p role="alert" className="mt-4 text-sm text-red-700">Users and departments could not be loaded. <button type="button" onClick={() => subjects.refetch()} className="font-semibold underline underline-offset-4">Retry loading subjects</button></p>}
        {locked && <p className="mt-4 flex items-start gap-2 rounded-lg bg-champagne-50 p-3 text-sm text-champagne-900"><ShieldCheckIcon className="h-5 w-5 shrink-0" aria-hidden="true" />Administrator access stays available so an administrator can always recover module permissions.</p>}
      </section>
      {feedback && <div role={feedback.error ? 'alert' : 'status'} className={'rounded-lg p-4 text-sm ' + (feedback.error ? 'bg-red-50 text-red-800' : 'bg-emerald-50 text-emerald-800')}><p>{feedback.text}</p>{feedback.error && <button type="button" className={buttonClass + ' mt-3'} disabled={catalog.isFetching} onClick={() => catalog.refetch()}>Refresh permissions</button>}</div>}
      <section className="overflow-hidden rounded-xl border border-champagne-200 bg-white" aria-label="Module permissions">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-champagne-200 p-5 sm:p-6">
          <div><h2 className="text-xl font-semibold">Modules for {scopeLabel}</h2><p className="mt-1 text-sm text-onyx-600">{features.length} modules · {features.filter((feature) => feature.override).length} saved overrides</p></div>
          <label className="min-w-0 sm:w-64"><span className="sr-only">Search modules</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search modules" className={controlClass + ' w-full'} /></label>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-b border-champagne-200 bg-champagne-50/50 px-5 py-3 sm:px-6">
          <span className="mr-2 text-sm text-onyx-600">All modules in this scope</span>
          <button type="button" className={buttonClass} disabled={locked || busy || catalog.isFetching || catalog.isError || !features.length} onClick={() => setBulkAction('enable')}>Enable all</button>
          <button type="button" className={buttonClass} disabled={locked || busy || catalog.isFetching || catalog.isError || !features.length} onClick={() => setBulkAction('disable')}>Disable all</button>
          <button type="button" className={buttonClass} disabled={locked || busy || catalog.isFetching || catalog.isError || !features.some((feature) => feature.override)} onClick={() => setBulkAction('inherit')}>Use inherited for all</button>
          {busy && <span role="status" className="ml-auto text-sm text-onyx-600">Saving permissions...</span>}
        </div>
        {bulkAction && <div role="group" aria-label="Confirm bulk permission change" className="border-b border-champagne-200 bg-amber-50 p-5 text-amber-950"><p className="text-sm">{bulkAction === 'inherit' ? 'Remove all saved overrides' : bulkAction === 'disable' ? 'Disable all modules' : 'Enable all feature permissions'} for {scopeLabel}? Existing role restrictions still apply.</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={busy || catalog.isFetching || catalog.isError} className={buttonClass} onClick={applyBulk}>{bulkAction === 'inherit' ? 'Confirm use inherited' : bulkAction === 'disable' ? 'Confirm disable all' : 'Confirm enable all'}</button><button type="button" disabled={busy} className={buttonClass} onClick={() => setBulkAction(null)}>Cancel</button></div></div>}
        {!scope.id ? <p className="p-6 text-onyx-600">Choose a {scope.type} to review permissions.</p> : catalog.isPending ? <p role="status" className="p-6 text-onyx-600">Loading feature permissions...</p> : catalog.isError ? <div role="alert" className="p-6"><h3 className="font-semibold">Unable to load feature permissions</h3><p className="mt-2 text-sm text-onyx-600">Please check your connection and try again.</p><button type="button" className={buttonClass + ' mt-4'} onClick={() => catalog.refetch()}>Try again</button></div> : !features.length ? <p className="p-6 text-onyx-600">No modules are available. Refresh the list or contact your administrator.</p> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[800px] text-left text-sm"><caption className="sr-only">Feature permissions for {scopeLabel}</caption>
            <thead className="bg-champagne-50/40 text-onyx-600"><tr><th scope="col" className="px-6 py-3 font-semibold">Module</th>{['Enabled', 'Read', 'Write', 'Delete'].map((name) => <th key={name} scope="col" className="px-4 py-3 text-center font-semibold">{name}</th>)}<th scope="col" className="px-6 py-3 font-semibold">Permission source</th></tr></thead>
            <tbody className="divide-y divide-champagne-100">{visible.map((feature) => {
              const permission = capabilities(feature);
              return <tr key={feature.id}>
                <th scope="row" className="max-w-sm px-6 py-5 align-top font-normal"><span className="block text-base font-semibold text-onyx-900">{feature.displayName}</span><span className="mt-1 block text-sm leading-relaxed text-onyx-600">{feature.description}</span></th>
                {(['isEnabled', 'canRead', 'canWrite', 'canDelete'] as const).map((key) => <td key={key} className="px-4 py-5 text-center align-top"><input type="checkbox" aria-label={feature.displayName + ' ' + ({ isEnabled: 'access', canRead: 'read', canWrite: 'write', canDelete: 'delete' }[key])} checked={permission[key]} disabled={locked || busy || catalog.isFetching || catalog.isError || (key !== 'isEnabled' && !permission.isEnabled)} className={checkClass} onChange={(event) => setPermission(feature, key, event.target.checked)} /></td>)}
                <td className="min-w-52 px-6 py-5 align-top"><p className="font-medium">{feature.override ? 'Saved override' : 'Using inherited permissions'}</p><p className="mt-1 text-sm text-onyx-600">{sourceLabels[feature.effective.source] || 'Inherited'}</p>{feature.override && !locked && <button type="button" aria-label={'Use inherited permissions for ' + feature.displayName} className="mt-2 rounded text-sm font-semibold text-champagne-800 underline underline-offset-4 hover:text-onyx-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-champagne-600 disabled:opacity-50" disabled={busy || catalog.isFetching || catalog.isError} onClick={() => { setFeedback(null); update.mutate({ featureId: feature.id, scope, inherit: true }); }}>Use inherited</button>}</td>
              </tr>;
            })}</tbody>
          </table>{!visible.length && <p className="p-6 text-onyx-600">No modules match your search.</p>}</div>
        )}
      </section>
      <section className="rounded-xl border border-champagne-200 bg-white p-5 sm:p-6" aria-label="Permission activity">
        <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-semibold">Permission activity</h2><button type="button" className={buttonClass + ' inline-flex items-center gap-2'} onClick={() => audit.refetch()} disabled={audit.isFetching}><ArrowPathIcon className="h-4 w-4" aria-hidden="true" />Refresh activity</button></div>
        {audit.isPending ? <p role="status" className="mt-4 text-sm text-onyx-600">Loading activity...</p> : audit.isError ? <p role="alert" className="mt-4 text-sm text-red-700">Activity could not be loaded. Use Refresh activity to try again.</p> : !audit.data?.items.length ? <p className="mt-4 text-sm text-onyx-600">No feature permission changes have been recorded.</p> : <ol className="mt-4 divide-y divide-champagne-100">{audit.data.items.map((item) => { const summary = auditSummary(item); return <li key={item.id} className="flex flex-wrap justify-between gap-3 py-4"><div><p className="text-sm font-semibold">{summary.action} · {summary.module}</p><p className="mt-1 text-sm text-onyx-600">{summary.target} · <span>{item.actorName || 'Unknown administrator'}</span></p><p className="mt-1 text-sm text-onyx-600">{summary.details}</p></div><time dateTime={item.createdAt} className="text-sm tabular-nums text-onyx-600">{new Date(item.createdAt).toLocaleString()}</time></li>; })}</ol>}
        {(auditBack.length > 0 || audit.data?.nextCursor) && <div className="mt-4 flex justify-between gap-3"><button type="button" className={buttonClass} disabled={!auditBack.length || audit.isFetching} onClick={() => { setAuditCursor(auditBack[auditBack.length - 1]); setAuditBack((old) => old.slice(0, -1)); }}>Newer activity</button><button type="button" className={buttonClass} disabled={!audit.data?.nextCursor || audit.isFetching} onClick={() => { setAuditBack((old) => [...old, auditCursor]); setAuditCursor(audit.data?.nextCursor || undefined); }}>Older activity</button></div>}
      </section>
    </div>
  );
}
