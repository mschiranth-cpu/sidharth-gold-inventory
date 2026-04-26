/**
 * Rich GST details card. Used by VendorFormModal (with action buttons) and
 * VendorDetailPage (read-only). Renders header, sectioned grid, address with
 * copy, jurisdictions, business activity pills, and (optionally) action row.
 */
import { useState } from 'react';
import type { GstDetails } from '../services/vendor.service';

// ---------- Helpers ----------
export function formatGstDate(s: string | null | undefined): string {
  if (!s) return '';
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  const slashMatch = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(s);
  let d: Date | null = null;
  if (isoMatch) d = new Date(`${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}T00:00:00Z`);
  else if (slashMatch) d = new Date(`${slashMatch[3]}-${slashMatch[2]}-${slashMatch[1]}T00:00:00Z`);
  if (!d || isNaN(d.getTime())) return s;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function statusBadgeClass(status: string | null | undefined): string {
  const s = (status || '').trim().toLowerCase();
  if (s === 'active') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  if (s === 'cancelled' || s === 'canceled') return 'bg-rose-100 text-rose-800 border-rose-200';
  if (s === 'suspended') return 'bg-amber-100 text-amber-800 border-amber-200';
  if (s === 'provisional') return 'bg-indigo-100 text-indigo-800 border-indigo-200';
  if (s === 'inactive') return 'bg-slate-100 text-slate-700 border-slate-200';
  return 'bg-slate-100 text-slate-700 border-slate-200';
}

export function sourceLabel(source: GstDetails['source']): string {
  if (source === 'rapidapi') return 'Live · RapidAPI';
  if (source === 'gstincheck') return 'Live · gstincheck';
  if (source === 'mastergst') return 'Live · MasterGST';
  if (source === 'manual') return 'Manual entry';
  return 'Structural (offline)';
}

export function isLiveSource(source: GstDetails['source']): boolean {
  return source === 'rapidapi' || source === 'gstincheck' || source === 'mastergst';
}

// ---------- Card ----------
interface Props {
  gstDetails: GstDetails;
  /** When provided, shows the action footer with "Use these details". */
  onUseDetails?: () => void;
  /** When provided + canRevert true, shows "Revert auto-fill". */
  onRevert?: () => void;
  canRevert?: boolean;
  /** "modal" = inline within form, "detail" = standalone page card. */
  variant?: 'modal' | 'detail';
}

export default function GstInfoCard({
  gstDetails,
  onUseDetails,
  onRevert,
  canRevert,
  variant = 'modal',
}: Props) {
  const [copiedAddr, setCopiedAddr] = useState(false);
  const [showJurisdiction, setShowJurisdiction] = useState(false);
  const live = isLiveSource(gstDetails.source);
  const isCancelled = (gstDetails.status || '').toLowerCase().startsWith('cancel');
  const eInvoice = (gstDetails.eInvoiceStatus || '').toLowerCase();

  const copyAddress = async () => {
    if (!gstDetails.address) return;
    try {
      await navigator.clipboard.writeText(gstDetails.address);
      setCopiedAddr(true);
      window.setTimeout(() => setCopiedAddr(false), 1500);
    } catch {
      /* clipboard denied — silent */
    }
  };

  const ringClass = live
    ? 'border-emerald-200 from-emerald-50'
    : 'border-slate-200 from-slate-50';

  return (
    <div
      className={`rounded-xl border bg-gradient-to-br ${ringClass} to-white shadow-sm overflow-hidden`}
    >
      {/* Header */}
      <div className="px-4 py-2.5 bg-white/60 border-b border-emerald-100/60 flex flex-wrap items-center gap-2">
        <span className="font-mono text-sm font-semibold text-gray-800">{gstDetails.gstin}</span>
        {gstDetails.status && (
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statusBadgeClass(gstDetails.status)}`}
          >
            {gstDetails.status}
          </span>
        )}
        {eInvoice && (
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
              eInvoice === 'yes'
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}
            title="e-Invoice eligibility (per GSTN)"
          >
            ⚡ e-Invoice {eInvoice === 'yes' ? 'enabled' : 'not enabled'}
          </span>
        )}
        <span
          className={`ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
            live
              ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
              : 'bg-slate-50 text-slate-600 border-slate-200'
          }`}
        >
          {live && <span>✓</span>}
          {sourceLabel(gstDetails.source)}
        </span>
      </div>

      {gstDetails.notice && (
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-100 text-xs text-amber-800">
          ⚠ {gstDetails.notice}
        </div>
      )}

      {isCancelled && gstDetails.cancelledDate && (
        <div className="px-4 py-2 bg-rose-50 border-b border-rose-100 text-xs text-rose-800">
          ⛔ Cancelled on {formatGstDate(gstDetails.cancelledDate)} — verify before transacting.
        </div>
      )}

      {/* Identity section */}
      <Section title="Identity">
        <Grid>
          {gstDetails.legalName && <DetailRow label="Legal Name" value={gstDetails.legalName} />}
          {gstDetails.tradeName && <DetailRow label="Trade Name" value={gstDetails.tradeName} />}
          {gstDetails.businessType && (
            <DetailRow label="Constitution" value={gstDetails.businessType} />
          )}
          {gstDetails.taxType && <DetailRow label="Taxpayer Type" value={gstDetails.taxType} />}
          {gstDetails.registrationDate && (
            <DetailRow label="Registered" value={formatGstDate(gstDetails.registrationDate)} />
          )}
          {gstDetails.lastUpdateDate && (
            <DetailRow label="Last Updated" value={formatGstDate(gstDetails.lastUpdateDate)} />
          )}
          <DetailRow label="State" value={`${gstDetails.state} (${gstDetails.stateCode})`} />
          <DetailRow label="PAN" value={gstDetails.pan} mono />
        </Grid>
      </Section>

      {/* Address */}
      {(gstDetails.address || gstDetails.city || gstDetails.pincode) && (
        <Section title="Registered Address" rightAction={
          gstDetails.address ? (
            <button
              type="button"
              onClick={copyAddress}
              className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800"
            >
              {copiedAddr ? '✓ Copied' : '📋 Copy'}
            </button>
          ) : null
        }>
          <Grid>
            {gstDetails.city && <DetailRow label="City / District" value={gstDetails.city} />}
            {gstDetails.pincode && <DetailRow label="Pincode" value={gstDetails.pincode} mono />}
          </Grid>
          {gstDetails.address && (
            <p className="mt-2 text-xs text-gray-800 leading-relaxed bg-white border border-gray-100 rounded-lg p-2.5">
              {gstDetails.address}
            </p>
          )}
        </Section>
      )}

      {/* Business activity */}
      {gstDetails.natureOfBusinessActivity && gstDetails.natureOfBusinessActivity.length > 0 && (
        <Section title="Nature of Business">
          <div className="flex flex-wrap gap-1.5">
            {gstDetails.natureOfBusinessActivity.map((n) => (
              <span
                key={n}
                className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-[11px] font-medium"
              >
                {n}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Jurisdictions (collapsible) */}
      {(gstDetails.centerJurisdiction || gstDetails.stateJurisdiction) && (
        <div className="px-4 pb-3">
          <button
            type="button"
            onClick={() => setShowJurisdiction((v) => !v)}
            className="text-[11px] font-medium text-gray-500 hover:text-gray-700"
          >
            {showJurisdiction ? '▾' : '▸'} Jurisdiction
          </button>
          {showJurisdiction && (
            <div className="mt-2">
              <Grid>
                {gstDetails.centerJurisdiction && (
                  <DetailRow label="Centre" value={gstDetails.centerJurisdiction} />
                )}
                {gstDetails.stateJurisdiction && (
                  <DetailRow label="State" value={gstDetails.stateJurisdiction} />
                )}
              </Grid>
            </div>
          )}
        </div>
      )}

      {/* Action footer */}
      {variant === 'modal' && onUseDetails && (
        <div className="px-4 pb-3 pt-1 flex flex-wrap items-center justify-end gap-2 border-t border-emerald-100/60">
          {canRevert && onRevert && (
            <button
              type="button"
              onClick={onRevert}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
            >
              ↶ Revert auto-fill
            </button>
          )}
          <button
            type="button"
            onClick={onUseDetails}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700"
          >
            Use these details
          </button>
        </div>
      )}
    </div>
  );
}

// ---------- Subcomponents ----------
function Section({
  title,
  rightAction,
  children,
}: {
  title: string;
  rightAction?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="px-4 py-3 border-t border-emerald-100/60 first:border-t-0">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-wider font-bold text-gray-500">
          {title}
        </span>
        {rightAction}
      </div>
      {children}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs">{children}</div>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-wider font-bold text-gray-500">{label}</span>
      <span className={`text-gray-900 font-medium ${mono ? 'font-mono' : ''} truncate`} title={value}>
        {value}
      </span>
    </div>
  );
}
