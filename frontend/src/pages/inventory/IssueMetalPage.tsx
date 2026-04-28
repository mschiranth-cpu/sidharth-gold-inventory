/**
 * ============================================
 * ISSUE METAL PAGE — Enhanced
 * ============================================
 *
 * Issues stock to a department or worker. Mirrors the repo conventions:
 *   - Luxe gradient backdrop, onyx hero header, heroicons
 *   - React-side validation (no native browser bubbles), `noValidate` form
 *   - Inline field errors + summary banner on invalid submit
 *   - Live "pure weight" calculator card
 *   - Submit always enabled (only disabled while mutation pending)
 *   - Server error displayed in a red box near the submit row
 */

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  ArrowUpTrayIcon,
  ScaleIcon,
  ExclamationCircleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { createMetalTransaction } from '../../services/metal.service';

const METAL_OPTIONS = [
  { value: 'GOLD', label: 'Gold', symbol: 'Au', gradient: 'from-amber-400 via-amber-500 to-yellow-600' },
  { value: 'SILVER', label: 'Silver', symbol: 'Ag', gradient: 'from-slate-300 via-slate-400 to-slate-600' },
  { value: 'PLATINUM', label: 'Platinum', symbol: 'Pt', gradient: 'from-cyan-300 via-sky-400 to-sky-600' },
  { value: 'PALLADIUM', label: 'Palladium', symbol: 'Pd', gradient: 'from-violet-400 via-violet-500 to-violet-700' },
];

const PURITY_OPTIONS = [24, 22, 18, 14];
const FORM_OPTIONS = ['BAR', 'WIRE', 'SHEET', 'GRAIN', 'GRANULE'];

interface FormState {
  metalType: string;
  purity: number;
  form: string;
  grossWeight: number;
  departmentId: string;
  workerId: string;
  notes: string;
}

interface FieldErrors {
  metalType?: string;
  purity?: string;
  form?: string;
  grossWeight?: string;
  recipient?: string;
}

export default function IssueMetalPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<FormState>({
    metalType: 'GOLD',
    purity: 22,
    form: 'BAR',
    grossWeight: 0,
    departmentId: '',
    workerId: '',
    notes: '',
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showAllErrors, setShowAllErrors] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  /* ── derived ──────────────────────────────────────────────────── */

  const pureWeight = useMemo(
    () => (form.grossWeight * form.purity) / 24,
    [form.grossWeight, form.purity]
  );

  const errors: FieldErrors = useMemo(() => {
    const e: FieldErrors = {};
    if (!form.metalType) e.metalType = 'Select a metal';
    if (!form.purity || ![24, 22, 18, 14].includes(form.purity)) e.purity = 'Pick a purity';
    if (!form.form) e.form = 'Select a form';
    if (!form.grossWeight || form.grossWeight <= 0)
      e.grossWeight = 'Enter a weight greater than 0';
    if (!form.departmentId.trim() && !form.workerId.trim())
      e.recipient = 'Provide a department or worker ID';
    return e;
  }, [form]);

  const errorList = Object.entries(errors).filter(([, v]) => !!v);

  const showError = (k: keyof FieldErrors) =>
    (touched[k as string] || showAllErrors) ? errors[k] : undefined;

  /* ── mutation ─────────────────────────────────────────────────── */

  const createMutation = useMutation({
    mutationFn: createMetalTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metal-stock-all'] });
      queryClient.invalidateQueries({ queryKey: ['metal-stock-summary'] });
      queryClient.invalidateQueries({ queryKey: ['metal-transactions-recent'] });
      navigate('/app/inventory/metal');
    },
    onError: (e: any) => {
      setSubmitError(
        e?.response?.data?.error || e?.message || 'Failed to issue metal'
      );
    },
  });

  /* ── handlers ─────────────────────────────────────────────────── */

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (errorList.length > 0) {
      setShowAllErrors(true);
      // Auto-focus first invalid field
      const firstKey = errorList[0]![0];
      const map: Record<string, string> = {
        metalType: 'metalType',
        purity: 'purity',
        form: 'form',
        grossWeight: 'grossWeight',
        recipient: 'departmentId',
      };
      requestAnimationFrame(() => {
        const node = document.querySelector(
          `[data-field="${map[firstKey]}"]`
        ) as HTMLElement | null;
        node?.focus();
      });
      return;
    }

    createMutation.mutate({
      transactionType: 'ISSUE_TO_DEPARTMENT',
      metalType: form.metalType,
      purity: form.purity,
      form: form.form,
      grossWeight: form.grossWeight,
      departmentId: form.departmentId.trim() || undefined,
      workerId: form.workerId.trim() || undefined,
      notes: form.notes.trim() || undefined,
    });
  };

  const blur = (k: string) => () => setTouched((t) => ({ ...t, [k]: true }));

  const selectedMetal = METAL_OPTIONS.find((m) => m.value === form.metalType) ?? METAL_OPTIONS[0]!;

  /* ── render ──────────────────────────────────────────────────── */

  return (
    <div className="p-6 bg-gradient-to-br from-pearl via-white to-champagne-50/30 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Back link */}
        <button
          type="button"
          onClick={() => navigate('/app/inventory/metal')}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-onyx-500 hover:text-champagne-800 transition"
        >
          <ArrowLeftIcon className="w-4 h-4" /> Back to Metal Inventory
        </button>

        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-onyx-900 via-onyx-800 to-onyx-700 text-pearl shadow-onyx mb-6 p-6 md:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sky-500/15 via-transparent to-transparent pointer-events-none" />
          <div className="relative flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-champagne-300 font-medium mb-2 flex items-center gap-2">
                <SparklesIcon className="w-3.5 h-3.5" />
                Inventory · Issue
              </p>
              <h1 className="font-display text-3xl font-semibold text-pearl mb-2">Issue Metal</h1>
              <p className="text-champagne-100/80 text-sm max-w-md">
                Allocate stock from inventory to a department or assigned worker.
              </p>
            </div>
            <div
              className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${selectedMetal.gradient} text-white text-xl font-bold flex items-center justify-center shadow-lg`}
              aria-hidden
            >
              {selectedMetal.symbol}
            </div>
          </div>
        </div>

        {/* Form card */}
        <form
          noValidate
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm border border-champagne-100 p-6 md:p-8 space-y-6"
        >
          {/* Summary error banner */}
          {showAllErrors && errorList.length > 0 && (
            <div
              role="alert"
              className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm"
            >
              <div className="flex items-start gap-2 mb-1.5">
                <ExclamationCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <span className="font-semibold text-red-800">
                  Please fix {errorList.length} issue{errorList.length > 1 ? 's' : ''} before continuing:
                </span>
              </div>
              <ul className="list-disc pl-9 text-red-700 space-y-0.5">
                {errorList.map(([k, v]) => (
                  <li key={k}>{v}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Metal Type" required error={showError('metalType')}>
              <select
                data-field="metalType"
                value={form.metalType}
                onChange={(e) => setForm({ ...form, metalType: e.target.value })}
                onBlur={blur('metalType')}
                className={inputCls(!!showError('metalType'))}
              >
                {METAL_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Purity" required error={showError('purity')}>
              <select
                data-field="purity"
                value={form.purity}
                onChange={(e) => setForm({ ...form, purity: parseFloat(e.target.value) })}
                onBlur={blur('purity')}
                className={inputCls(!!showError('purity'))}
              >
                {PURITY_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}K
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Form" required error={showError('form')}>
              <select
                data-field="form"
                value={form.form}
                onChange={(e) => setForm({ ...form, form: e.target.value })}
                onBlur={blur('form')}
                className={inputCls(!!showError('form'))}
              >
                {FORM_OPTIONS.map((f) => (
                  <option key={f} value={f}>
                    {f.charAt(0) + f.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="Gross Weight (g)"
              required
              error={showError('grossWeight')}
              hint="Three-decimal precision supported"
            >
              <input
                type="number"
                inputMode="decimal"
                step="0.001"
                min={0}
                data-field="grossWeight"
                value={form.grossWeight || ''}
                onChange={(e) =>
                  setForm({ ...form, grossWeight: parseFloat(e.target.value) || 0 })
                }
                onBlur={blur('grossWeight')}
                placeholder="e.g. 50.000"
                className={inputCls(!!showError('grossWeight'))}
              />
            </Field>
          </div>

          {/* Recipient */}
          <div>
            <h3 className="text-xs font-bold tracking-wider text-onyx-400 uppercase mb-3">
              Recipient
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field
                label="Department ID"
                hint="Provide either a Department ID or a Worker ID"
                error={showError('recipient')}
              >
                <input
                  type="text"
                  data-field="departmentId"
                  value={form.departmentId}
                  onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                  onBlur={blur('recipient')}
                  placeholder="e.g. POLISH-A"
                  className={inputCls(!!showError('recipient'))}
                />
              </Field>
              <Field label="Worker ID" hint="Optional if a department is provided">
                <input
                  type="text"
                  data-field="workerId"
                  value={form.workerId}
                  onChange={(e) => setForm({ ...form, workerId: e.target.value })}
                  onBlur={blur('recipient')}
                  placeholder="e.g. W-1024"
                  className={inputCls(false)}
                />
              </Field>
            </div>
          </div>

          {/* Notes */}
          <Field label="Notes" hint="Optional context for the issue">
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="e.g. order # / batch reference"
              className={inputCls(false)}
            />
          </Field>

          {/* Pure-weight calculator */}
          <div className="rounded-2xl bg-gradient-to-br from-champagne-50 via-white to-pearl border border-champagne-100 p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-champagne-100 text-champagne-700">
              <ScaleIcon className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="text-[11px] font-semibold text-onyx-500 uppercase tracking-wide">
                Pure Weight
              </div>
              <div className="text-2xl font-bold text-onyx-900 tabular-nums">
                {pureWeight.toFixed(3)} <span className="text-base font-medium text-onyx-500">g</span>
              </div>
              <div className="text-xs text-onyx-400">
                {form.grossWeight || 0} g × {form.purity}K ÷ 24
              </div>
            </div>
          </div>

          {/* Server error */}
          {submitError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-2">
              <ExclamationCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
              {submitError}
            </div>
          )}

          {/* Footer */}
          <div className="flex flex-col-reverse md:flex-row gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => navigate('/app/inventory/metal')}
              disabled={createMutation.isPending}
              className="md:flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-champagne-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="md:flex-[2] px-4 py-3 rounded-xl bg-gradient-to-r from-champagne-700 via-champagne-800 to-onyx-800 hover:from-champagne-800 hover:via-onyx-700 hover:to-onyx-900 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-md shadow-onyx-700/20 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-champagne-400"
            >
              {createMutation.isPending ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Issuing…
                </>
              ) : (
                <>
                  <ArrowUpTrayIcon className="w-4 h-4" /> Issue Metal
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────── */
/* Helpers                                                           */
/* ──────────────────────────────────────────────────────────────── */

function inputCls(hasError: boolean) {
  return [
    'w-full px-3.5 py-2.5 rounded-xl border bg-white text-sm transition',
    'focus:outline-none focus:ring-2',
    hasError
      ? 'border-red-400 focus:ring-red-500'
      : 'border-gray-200 focus:ring-champagne-500 focus:border-transparent',
  ].join(' ');
}

function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-onyx-700 mb-1.5">
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-onyx-400">{hint}</p>
      ) : null}
    </div>
  );
}
