/**
 * Vendor Info — list, add, edit, delete with realtime GST auto-fetch.
 */
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Vendor,
  VendorInput,
  GstDetails,
  listVendors,
  createVendor,
  updateVendor,
  deleteVendor,
  lookupGstin,
  getNextVendorCode,
} from '../../services/vendor.service';
import Button from '../../components/common/Button';

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export default function VendorsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Vendor | null>(null);

  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ['vendors', search],
    queryFn: () => listVendors(search || undefined),
  });

  const removeMut = useMutation({
    mutationFn: deleteVendor,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vendors'] }),
  });

  const handleEdit = (v: Vendor) => {
    setEditing(v);
    setIsOpen(true);
  };
  const handleAdd = () => {
    setEditing(null);
    setIsOpen(true);
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Vendor Info</h1>
            <p className="text-gray-600">
              Manage vendors with realtime GST auto-fetch
            </p>
          </div>
          <Button variant="primary" onClick={handleAdd}>
            + Add Vendor
          </Button>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100 mb-6">
          <input
            type="text"
            placeholder="Search by name, code, GSTIN or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          </div>
        ) : vendors.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center text-gray-500">
            No vendors yet. Click <span className="font-semibold">Add Vendor</span> to create one.
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Unique Code</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">GSTIN</th>
                  <th className="px-4 py-3">State</th>
                  <th className="px-4 py-3">Address</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {vendors.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {v.name}
                      {v.gstDetails?.legalName && (
                        <div className="text-xs font-normal text-gray-500">
                          {v.gstDetails.legalName}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{v.uniqueCode}</td>
                    <td className="px-4 py-3">{v.phone || '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs">{v.gstNumber || '—'}</td>
                    <td className="px-4 py-3">{v.gstDetails?.state || '—'}</td>
                    <td className="px-4 py-3 max-w-xs truncate" title={v.address || ''}>
                      {v.address || '—'}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => handleEdit(v)}
                        className="text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete vendor "${v.name}"?`)) removeMut.mutate(v.id);
                        }}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {isOpen && (
          <VendorFormModal
            vendor={editing}
            onClose={() => setIsOpen(false)}
            onSaved={() => {
              setIsOpen(false);
              qc.invalidateQueries({ queryKey: ['vendors'] });
            }}
          />
        )}
      </div>
    </div>
  );
}

// ============ Modal ============

function VendorFormModal({
  vendor,
  onClose,
  onSaved,
}: {
  vendor: Vendor | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<VendorInput>({
    name: vendor?.name ?? '',
    phone: vendor?.phone ?? '',
    gstNumber: vendor?.gstNumber ?? '',
    address: vendor?.address ?? '',
  });
  const [previewCode, setPreviewCode] = useState<string>(vendor?.uniqueCode ?? '…');

  // Fetch the next auto-generated code when creating a new vendor
  useEffect(() => {
    if (vendor) return;
    let cancelled = false;
    getNextVendorCode()
      .then((c) => {
        if (!cancelled) setPreviewCode(c);
      })
      .catch(() => {
        if (!cancelled) setPreviewCode('VEN-001');
      });
    return () => {
      cancelled = true;
    };
  }, [vendor]);
  const [gstDetails, setGstDetails] = useState<GstDetails | null>(vendor?.gstDetails ?? null);
  const [gstStatus, setGstStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [gstError, setGstError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const gstinUpper = (form.gstNumber || '').toUpperCase().trim();
  const gstinValid = useMemo(() => GSTIN_REGEX.test(gstinUpper), [gstinUpper]);

  // Auto-fetch GST details after user finishes typing a valid GSTIN (debounced 500 ms)
  useEffect(() => {
    if (!gstinValid) {
      if (gstinUpper.length === 0) {
        setGstStatus('idle');
        setGstError(null);
        setGstDetails(null);
      } else {
        setGstStatus('idle');
      }
      return;
    }
    let cancelled = false;
    setGstStatus('loading');
    setGstError(null);
    const t = window.setTimeout(async () => {
      try {
        const d = await lookupGstin(gstinUpper);
        if (cancelled) return;
        setGstDetails(d);
        setGstStatus('ok');
        // Auto-fill Name and Address from GST when the provider returns them.
        // Only fill empty fields so we don't clobber user input.
        setForm((f) => {
          const gstName = d.legalName || d.tradeName || '';
          return {
            ...f,
            name: f.name && f.name.trim() ? f.name : gstName || f.name,
            address: f.address && f.address.trim() ? f.address : d.address || f.address,
          };
        });
      } catch (e: any) {
        if (cancelled) return;
        setGstStatus('error');
        setGstError(e?.response?.data?.error || e?.message || 'Lookup failed');
      }
    }, 500);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [gstinUpper, gstinValid]);

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload: VendorInput = {
        name: form.name.trim(),
        phone: form.phone?.trim() || undefined,
        gstNumber: gstinUpper || undefined,
        address: form.address?.trim() || undefined,
      };
      if (vendor) return updateVendor(vendor.id, payload);
      return createVendor(payload);
    },
    onSuccess: onSaved,
    onError: (e: any) => setSubmitError(e?.response?.data?.error || 'Save failed'),
  });

  const canSave =
    form.name.trim().length > 0 && (gstinUpper.length === 0 || gstinValid);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-gray-900">
            {vendor ? 'Edit Vendor' : 'Add Vendor'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">
            ×
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitError(null);
            if (canSave) saveMut.mutate();
          }}
          className="p-6 space-y-4"
        >
          <Field label="Name *">
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </Field>

          <Field
            label="Unique Code"
            hint={vendor ? 'Auto-generated and immutable' : 'Auto-generated on save'}
          >
            <input
              readOnly
              value={previewCode}
              tabIndex={-1}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-100 text-gray-700 font-mono cursor-not-allowed select-all"
            />
          </Field>

          <Field label="Phone Number" hint="Not available from GST — enter manually">
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="+91 9XXXXXXXXX"
            />
          </Field>

          <Field label="GSTIN" hint="15-character GST number — auto-fetches details">
            <div className="relative">
              <input
                value={form.gstNumber}
                onChange={(e) =>
                  setForm({ ...form, gstNumber: e.target.value.toUpperCase() })
                }
                maxLength={15}
                className={`w-full px-4 py-2.5 pr-28 rounded-lg border font-mono uppercase focus:ring-2 focus:border-transparent ${
                  gstinUpper.length === 0
                    ? 'border-gray-300 focus:ring-indigo-500'
                    : gstinValid
                    ? 'border-emerald-400 focus:ring-emerald-500'
                    : 'border-red-400 focus:ring-red-500'
                }`}
                placeholder="29AABCU9603R1ZX"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs">
                {gstStatus === 'loading' && (
                  <span className="text-indigo-600 flex items-center gap-1">
                    <span className="inline-block w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    Fetching…
                  </span>
                )}
                {gstStatus === 'ok' && (
                  <span className="text-emerald-600 font-semibold">✓ Verified</span>
                )}
                {gstStatus === 'error' && (
                  <span className="text-red-600 font-semibold">✗ Failed</span>
                )}
                {gstStatus === 'idle' && gstinUpper.length > 0 && !gstinValid && (
                  <span className="text-red-500">Invalid format</span>
                )}
              </div>
            </div>
            {gstError && <p className="mt-1 text-xs text-red-600">{gstError}</p>}
            {gstDetails && gstStatus !== 'error' && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs space-y-1">
                <Row k="State" v={`${gstDetails.state} (${gstDetails.stateCode})`} />
                <Row k="PAN" v={gstDetails.pan} mono />
                {gstDetails.legalName && <Row k="Legal Name" v={gstDetails.legalName} />}
                {gstDetails.tradeName && <Row k="Trade Name" v={gstDetails.tradeName} />}
                {gstDetails.status && <Row k="Status" v={gstDetails.status} />}
                <Row
                  k="Source"
                  v={
                    gstDetails.source === 'parsed'
                      ? 'Structural (offline)'
                      : gstDetails.source
                  }
                />
                {gstDetails.source === 'parsed' && (
                  <div className="mt-2 pt-2 border-t border-emerald-200 text-[11px] text-emerald-800">
                    💡 To fetch <strong>Legal Name</strong> &amp; <strong>Address</strong>{' '}
                    automatically, set <code className="font-mono bg-white px-1 rounded">GST_API_KEY</code>{' '}
                    in <code className="font-mono bg-white px-1 rounded">backend/.env</code>{' '}
                    (gstincheck.co.in or mastergst.com). Phone numbers are not
                    published via GSTN — always entered manually.
                  </div>
                )}
              </div>
            )}
          </Field>

          <Field label="Address">
            <textarea
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              placeholder="Street, City, State, PIN"
            />
          </Field>

          {submitError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {submitError}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={saveMut.isPending}
              disabled={!canSave || saveMut.isPending}
            >
              {vendor ? 'Save Changes' : 'Create Vendor'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex">
      <span className="text-gray-600 w-24 flex-shrink-0">{k}:</span>
      <span className={`text-gray-900 font-medium ${mono ? 'font-mono' : ''}`}>{v}</span>
    </div>
  );
}
