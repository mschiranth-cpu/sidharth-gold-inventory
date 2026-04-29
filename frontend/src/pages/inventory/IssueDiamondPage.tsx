/**
 * ============================================
 * ISSUE DIAMOND PAGE — V2 (parcel-aware)
 * ============================================
 * Issues a diamond to a department / worker / order.
 *  - SOLITAIRE: whole-stone issue (status flips to ISSUED)
 *  - LOOSE (parcel): partial issue by carat + pieces (drains parcel stock)
 */

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  ArrowUpTrayIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import {
  getAllDiamonds,
  issueDiamondV2,
  type Diamond,
} from '../../services/diamond.service';
import Button from '../../components/common/Button';
import {
  combineDateWithCurrentIstTimeISO,
  nowIstDateString,
} from '../../lib/dateUtils';

interface FormState {
  diamondId: string;
  departmentId: string;
  workerId: string;
  orderId: string;
  quantityPieces: number;
  caratWeight: number;
  notes: string;
  transactionDate: string;
}

interface FieldErrors {
  diamond?: string;
  recipient?: string;
  quantity?: string;
  carats?: string;
}

export default function IssueDiamondPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<FormState>({
    diamondId: '',
    departmentId: '',
    workerId: '',
    orderId: '',
    quantityPieces: 1,
    caratWeight: 0,
    notes: '',
    transactionDate: nowIstDateString(),
  });
  const [serverError, setServerError] = useState<string | null>(null);

  const { data: diamonds = [] } = useQuery({
    queryKey: ['diamonds-issuable'],
    queryFn: () => getAllDiamonds({}),
  });

  const selected: Diamond | undefined = diamonds.find(
    (d: Diamond) => d.id === form.diamondId
  );

  const isParcel = selected?.category === 'LOOSE';

  // Auto-fill carat weight when SOLITAIRE is picked.
  useEffect(() => {
    if (selected && !isParcel) {
      setForm((f) => ({
        ...f,
        caratWeight: selected.caratWeight,
        quantityPieces: 1,
      }));
    }
  }, [selected, isParcel]);

  const errors: FieldErrors = useMemo(() => {
    const e: FieldErrors = {};
    if (!form.diamondId) e.diamond = 'Select a diamond';
    if (!form.departmentId.trim() && !form.workerId.trim())
      e.recipient = 'Provide a department or worker ID';
    if (isParcel) {
      if (!form.quantityPieces || form.quantityPieces <= 0)
        e.quantity = 'Quantity must be > 0';
      if (!form.caratWeight || form.caratWeight <= 0)
        e.carats = 'Carat weight must be > 0';
    }
    return e;
  }, [form, isParcel]);

  const submit = useMutation({
    mutationFn: () =>
      issueDiamondV2({
        diamondId: form.diamondId,
        orderId: form.orderId.trim() || undefined,
        departmentId: form.departmentId.trim() || undefined,
        workerId: form.workerId.trim() || undefined,
        quantityPieces: isParcel ? form.quantityPieces : undefined,
        caratWeight: isParcel ? form.caratWeight : undefined,
        notes: form.notes || undefined,
        transactionDate: form.transactionDate
          ? combineDateWithCurrentIstTimeISO(form.transactionDate)
          : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diamond-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['diamonds'] });
      queryClient.invalidateQueries({ queryKey: ['diamond-stock-summary'] });
      navigate('/app/inventory/diamonds/transactions');
    },
    onError: (e: any) =>
      setServerError(
        e?.response?.data?.error?.message || e?.message || 'Failed to issue'
      ),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    if (Object.keys(errors).length > 0) return;
    submit.mutate();
  };

  const inputCls =
    'w-full px-4 py-3 rounded-xl border border-champagne-300 focus:ring-2 focus:ring-champagne-500 focus:border-transparent';

  return (
    <div className="min-h-screen bg-gradient-to-br from-pearl via-white to-champagne-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="rounded-3xl bg-gradient-to-br from-onyx-900 via-onyx-800 to-onyx-900 p-6 text-white shadow-xl">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 text-pearl-200 hover:text-white text-sm mb-3"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back
          </button>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ArrowUpTrayIcon className="h-8 w-8 text-champagne-300" />
            Issue Diamond
          </h1>
          <p className="text-pearl-200 text-sm mt-1">
            Allocate diamond stock to a department, worker, or order. Parcels
            (LOOSE) support partial issues; solitaires issue the whole stone.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="bg-white rounded-2xl shadow-sm border border-champagne-200 p-6 space-y-5"
        >
          <div>
            <label className="block text-sm font-semibold text-onyx-700 mb-1">
              Select Diamond
            </label>
            <select
              value={form.diamondId}
              onChange={(e) => setForm({ ...form, diamondId: e.target.value })}
              className={inputCls}
            >
              <option value="">— Select a diamond —</option>
              {diamonds.map((d: Diamond) => (
                <option key={d.id} value={d.id}>
                  [{d.category ?? 'SOLITAIRE'}] {d.stockNumber} — {d.caratWeight}ct{' '}
                  {d.color} {d.clarity} {d.shape}
                </option>
              ))}
            </select>
            {errors.diamond && (
              <p className="text-xs text-accent-ruby mt-1">{errors.diamond}</p>
            )}
          </div>

          {selected && (
            <div className="rounded-xl bg-pearl-50 border border-champagne-200 p-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-xs text-onyx-400">Category</p>
                  <p className="font-semibold">{selected.category ?? 'SOLITAIRE'}</p>
                </div>
                <div>
                  <p className="text-xs text-onyx-400">Available Carat</p>
                  <p className="font-semibold">{selected.caratWeight} ct</p>
                </div>
                <div>
                  <p className="text-xs text-onyx-400">Color/Clarity</p>
                  <p className="font-semibold">
                    {selected.color}/{selected.clarity}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-onyx-400">Status</p>
                  <p className="font-semibold">{selected.status}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-onyx-700 mb-1">
                Department ID
              </label>
              <input
                type="text"
                value={form.departmentId}
                onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                className={inputCls}
                placeholder="e.g. SETTING"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-onyx-700 mb-1">
                Worker ID
              </label>
              <input
                type="text"
                value={form.workerId}
                onChange={(e) => setForm({ ...form, workerId: e.target.value })}
                className={inputCls}
                placeholder="Optional if a department is provided"
              />
            </div>
          </div>
          {errors.recipient && (
            <p className="text-xs text-accent-ruby -mt-2">{errors.recipient}</p>
          )}

          <div>
            <label className="block text-sm font-semibold text-onyx-700 mb-1">
              Order ID
            </label>
            <input
              type="text"
              value={form.orderId}
              onChange={(e) => setForm({ ...form, orderId: e.target.value })}
              className={inputCls}
              placeholder="Optional"
            />
          </div>

          {isParcel && (
            <div className="rounded-xl border border-champagne-200 bg-pearl-50/40 p-4">
              <h4 className="font-semibold text-onyx-800 text-sm mb-3">
                Parcel Issue — partial draw
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-onyx-600 mb-1">
                    Pieces to issue
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.quantityPieces || ''}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        quantityPieces: parseInt(e.target.value) || 0,
                      })
                    }
                    className={inputCls}
                  />
                  {errors.quantity && (
                    <p className="text-xs text-accent-ruby mt-1">{errors.quantity}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-onyx-600 mb-1">
                    Carat Weight
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={form.caratWeight || ''}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        caratWeight: parseFloat(e.target.value) || 0,
                      })
                    }
                    className={inputCls}
                  />
                  {errors.carats && (
                    <p className="text-xs text-accent-ruby mt-1">{errors.carats}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-onyx-700 mb-1">
              Transaction Date
            </label>
            <input
              type="date"
              value={form.transactionDate}
              max={nowIstDateString()}
              onChange={(e) => setForm({ ...form, transactionDate: e.target.value })}
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-onyx-700 mb-1">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className={inputCls}
            />
          </div>

          {serverError && (
            <div className="px-3 py-2 rounded-lg bg-accent-ruby/10 text-accent-ruby text-sm flex items-center gap-2">
              <ExclamationCircleIcon className="h-4 w-4" />
              {serverError}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-champagne-200">
            <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={submit.isPending}>
              Issue
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
