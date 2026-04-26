/**
 * ============================================
 * VENDOR DETAIL PAGE
 * ============================================
 * Single-vendor view: identity card, outstanding stat cards, full PURCHASE
 * transaction list with inline Settle action.
 */

import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  getVendor,
  getVendorOutstanding,
  getVendorTransactions,
} from '../../services/vendor.service';
import type { MetalTransaction } from '../../services/metal.service';
import Button from '../../components/common/Button';
import SettlePaymentModal from '../../components/SettlePaymentModal';
import GstInfoCard from '../../components/GstInfoCard';
import { useAuth } from '../../contexts/AuthContext';

const SETTLE_ROLES = new Set(['ADMIN', 'OFFICE_STAFF']);

function fmt(n: number) {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function PaymentBadge({ status }: { status: string }) {
  const cls =
    status === 'COMPLETE'
      ? 'bg-emerald-100 text-emerald-700'
      : status === 'HALF'
      ? 'bg-amber-100 text-amber-800'
      : 'bg-rose-100 text-rose-700';
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{status}</span>
  );
}

function StatCard({
  label,
  value,
  tone = 'gray',
}: {
  label: string;
  value: string;
  tone?: 'gray' | 'emerald' | 'rose' | 'amber';
}) {
  const tones = {
    gray: 'bg-gray-50 border-gray-200 text-gray-900',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    rose: 'bg-rose-50 border-rose-200 text-rose-900',
    amber: 'bg-amber-50 border-amber-200 text-amber-900',
  };
  return (
    <div className={`p-4 rounded-xl border ${tones[tone]}`}>
      <p className="text-xs text-gray-600 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <span className="text-gray-500 text-sm">{label}: </span>
      <span className="text-gray-900 text-sm">{value || '—'}</span>
    </div>
  );
}

export default function VendorDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { user } = useAuth();
  const canSettle = SETTLE_ROLES.has(String(user?.role ?? ''));
  const [settleTxn, setSettleTxn] = useState<MetalTransaction | null>(null);

  const { data: vendor, isLoading: vendorLoading, isError: vendorError } = useQuery({
    queryKey: ['vendor', id],
    queryFn: () => getVendor(id),
    enabled: Boolean(id),
  });
  const { data: outstanding } = useQuery({
    queryKey: ['vendor-outstanding', id],
    queryFn: () => getVendorOutstanding(id),
    enabled: Boolean(id),
  });
  const { data: transactions = [] } = useQuery({
    queryKey: ['vendor-transactions', id],
    queryFn: () => getVendorTransactions(id),
    enabled: Boolean(id),
  });

  if (vendorLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-champagne-700" />
      </div>
    );
  }

  if (vendorError || !vendor) {
    return (
      <div className="p-6">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-12 text-center">
          <p className="text-gray-700 mb-4">Vendor not found.</p>
          <Link to="/app/vendors">
            <Button variant="secondary">← Back to vendors</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link to="/app/vendors" className="text-sm text-champagne-700 hover:underline">
              ← Back to vendors
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mt-1">{vendor.name}</h1>
            <p className="text-gray-600 font-mono text-xs">{vendor.uniqueCode}</p>
          </div>
        </div>

        {/* Vendor info card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 lg:col-span-1">
            <h2 className="font-semibold text-gray-900 mb-3">Vendor Information</h2>
            <div className="space-y-2">
              <InfoRow label="Phone" value={vendor.phone} />
              <InfoRow label="GSTIN" value={vendor.gstNumber} />
              <InfoRow label="Vendor Code" value={vendor.uniqueCode} />
              <InfoRow label="Address" value={vendor.address} />
            </div>
          </div>
          <div className="lg:col-span-2">
            {vendor.gstDetails ? (
              <GstInfoCard gstDetails={vendor.gstDetails} variant="detail" />
            ) : (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 text-center text-sm text-gray-500">
                No GST details on file. Edit the vendor and add a GSTIN to fetch details.
              </div>
            )}
          </div>
        </div>

        {/* Outstanding summary */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <StatCard label="Total Billable" value={`₹${fmt(outstanding?.totalBillable ?? 0)}`} />
          <StatCard label="Total Paid" value={`₹${fmt(outstanding?.totalPaid ?? 0)}`} tone="emerald" />
          <StatCard
            label="Outstanding"
            value={`₹${fmt(outstanding?.outstanding ?? 0)}`}
            tone={outstanding && outstanding.outstanding > 0 ? 'rose' : 'gray'}
          />
          <StatCard
            label="Vendor Credit"
            value={`₹${fmt(vendor?.creditBalance ?? 0)}`}
            tone={vendor && vendor.creditBalance > 0 ? 'emerald' : 'gray'}
          />
          <StatCard label="Open Receipts" value={String(outstanding?.openCount ?? 0)} tone="amber" />
        </div>

        {/* Transactions */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Purchase Transactions</h2>
          </div>
          {transactions.length === 0 ? (
            <p className="px-6 py-12 text-center text-gray-500">No purchases yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 text-xs text-gray-600 uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Date</th>
                    <th className="px-4 py-3 text-left font-medium">Metal</th>
                    <th className="px-4 py-3 text-left font-medium">Purity</th>
                    <th className="px-4 py-3 text-right font-medium">Weight (g)</th>
                    <th className="px-4 py-3 text-right font-medium">Rate</th>
                    <th className="px-4 py-3 text-right font-medium">Total Value</th>
                    <th className="px-4 py-3 text-right font-medium">Paid</th>
                    <th className="px-4 py-3 text-left font-medium">Credit</th>
                    <th className="px-4 py-3 text-left font-medium">Payment</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {transactions.map((txn) => (
                    <tr key={txn.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-700">
                        {new Date(txn.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">{txn.metalType}</td>
                      <td className="px-4 py-3 text-gray-700">{txn.purity}K</td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {txn.grossWeight.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {txn.rate ? `₹${fmt(txn.rate)}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium">
                        {txn.totalValue != null ? `₹${fmt(txn.totalValue)}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {txn.amountPaid != null ? `₹${fmt(txn.amountPaid)}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {txn.creditApplied || txn.creditGenerated ? (
                          <div className="space-y-0.5">
                            {txn.creditApplied ? (
                              <span className="block text-champagne-800">Applied: ₹{fmt(txn.creditApplied)}</span>
                            ) : null}
                            {txn.creditGenerated ? (
                              <span className="block text-emerald-700">Generated: ₹{fmt(txn.creditGenerated)}</span>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {txn.isBillable !== true || !txn.paymentStatus ? (
                          <span className="text-gray-400">—</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <PaymentBadge status={txn.paymentStatus} />
                            {canSettle &&
                              (txn.paymentStatus === 'HALF' || txn.paymentStatus === 'PENDING') && (
                                <button
                                  type="button"
                                  onClick={() => setSettleTxn(txn)}
                                  className="text-xs font-medium text-champagne-700 hover:text-onyx-800 hover:underline"
                                >
                                  Settle
                                </button>
                              )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {settleTxn && (
        <SettlePaymentModal transaction={settleTxn} onClose={() => setSettleTxn(null)} />
      )}
    </div>
  );
}
