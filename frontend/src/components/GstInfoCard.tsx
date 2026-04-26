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
  if (s === 'provisional') return 'bg-champagne-100 text-champagne-800 border-champagne-200';
  if (s === 'inactive') return 'bg-slate-100 text-slate-700 border-slate-200';
  return 'bg-slate-100 text-slate-700 border-slate-200';
}

export function sourceLabel(source: GstDetails['source']): string {
  if (source === 'rapidapi') return 'Live · RapidAPI';
  if (source === 'rapidapi-tool') return 'Live · RapidAPI';
  if (source === 'gstincheck') return 'Live · gstincheck';
  if (source === 'mastergst') return 'Live · MasterGST';
  if (source === 'manual') return 'Manual entry';
  return 'Structural (offline)';
}

export function isLiveSource(source: GstDetails['source']): boolean {
  return source === 'rapidapi' || source === 'rapidapi-tool' || source === 'gstincheck' || source === 'mastergst';
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
  const [copiedGstin, setCopiedGstin] = useState(false);
  const live = isLiveSource(gstDetails.source);
  const isCancelled = (gstDetails.status || '').toLowerCase().startsWith('cancel');
  const eInvoice = (gstDetails.eInvoiceStatus || '').toLowerCase();

  const copyText = async (text: string, setter: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      setter(true);
      window.setTimeout(() => setter(false), 1500);
    } catch {
      /* clipboard denied — silent */
    }
  };

  // Build a friendly multi-line breakdown of address parts (only non-empty).
  const ap = gstDetails.addressParts || {};
  const addressLines: Array<[string, string]> = [];
  if (ap.buildingNumber) addressLines.push(['Door / No.', ap.buildingNumber]);
  if (ap.buildingName) addressLines.push(['Building', ap.buildingName]);
  if (ap.floorNumber) addressLines.push(['Floor', ap.floorNumber]);
  if (ap.street && ap.street !== '-') addressLines.push(['Street', ap.street]);
  if (ap.locality && ap.locality !== ap.location) addressLines.push(['Locality', ap.locality]);
  if (ap.location) addressLines.push(['Location', ap.location]);

  const headerGradient = live
    ? 'bg-gradient-to-r from-champagne-50 via-white to-pearl'
    : 'bg-gradient-to-r from-slate-50 via-white to-slate-50';
  const accentBorder = live ? 'border-champagne-200' : 'border-slate-200';

  return (
    <div
      className={`rounded-2xl border ${accentBorder} bg-white shadow-sm overflow-hidden`}
    >
      {/* Header */}
      <div
        className={`px-4 py-3 ${headerGradient} border-b ${accentBorder} flex flex-wrap items-center gap-2`}
      >
        <button
          type="button"
          onClick={() => copyText(gstDetails.gstin, setCopiedGstin)}
          className="font-mono text-sm font-semibold text-onyx-900 hover:text-champagne-800 transition flex items-center gap-1.5"
          title="Copy GSTIN"
        >
          {gstDetails.gstin}
          <span className="text-[10px] font-sans font-medium text-onyx-500">
            {copiedGstin ? '✓ copied' : '📋'}
          </span>
        </button>
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
                ? 'bg-champagne-50 text-champagne-800 border-champagne-200'
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
              ? 'bg-onyx-900 text-pearl border-onyx-900'
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
          {gstDetails.entityNumber && (
            <DetailRow label="Entity Number" value={gstDetails.entityNumber} mono />
          )}
        </Grid>
      </Section>

      {/* Address */}
      {(gstDetails.address || gstDetails.city || gstDetails.pincode || addressLines.length > 0) && (
        <Section
          title="Registered Address"
          rightAction={
            gstDetails.address ? (
              <button
                type="button"
                onClick={() => copyText(gstDetails.address!, setCopiedAddr)}
                className="text-[11px] font-medium text-champagne-700 hover:text-champagne-800"
              >
                {copiedAddr ? '✓ Copied' : '📋 Copy'}
              </button>
            ) : null
          }
        >
          <Grid>
            {gstDetails.city && <DetailRow label="City / District" value={gstDetails.city} />}
            {gstDetails.pincode && <DetailRow label="Pincode" value={gstDetails.pincode} mono />}
            {addressLines.map(([label, value]) => (
              <DetailRow key={label} label={label} value={value} />
            ))}
          </Grid>
          {gstDetails.address && (
            <p className="mt-2.5 text-xs text-onyx-800 leading-relaxed bg-pearl/50 border border-champagne-100 rounded-lg p-2.5">
              {gstDetails.address}
            </p>
          )}
        </Section>
      )}

      {/* Business activity */}
      {gstDetails.natureOfBusinessActivity && gstDetails.natureOfBusinessActivity.length > 0 && (
        <Section title={`Nature of Business (${gstDetails.natureOfBusinessActivity.length})`}>
          <div className="flex flex-wrap gap-1.5">
            {gstDetails.natureOfBusinessActivity.map((n) => (
              <span
                key={n}
                className="px-2 py-0.5 rounded-full bg-champagne-50 text-champagne-800 border border-champagne-200 text-[11px] font-medium"
              >
                {n}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Jurisdictions */}
      {(gstDetails.centerJurisdiction || gstDetails.stateJurisdiction) && (
        <Section title="Jurisdiction">
          <Grid>
            {gstDetails.centerJurisdiction && (
              <DetailRow label="Centre" value={gstDetails.centerJurisdiction} />
            )}
            {gstDetails.stateJurisdiction && (
              <DetailRow label="State" value={gstDetails.stateJurisdiction} />
            )}
          </Grid>
        </Section>
      )}

      {/* Action footer */}
      {variant === 'modal' && onUseDetails && (
        <div className="px-4 py-3 flex flex-wrap items-center justify-end gap-2 border-t border-champagne-100 bg-pearl/40">
          {canRevert && onRevert && (
            <button
              type="button"
              onClick={onRevert}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-onyx-700 bg-white border border-champagne-300 hover:bg-champagne-50"
            >
              ↶ Revert auto-fill
            </button>
          )}
          <button
            type="button"
            onClick={onUseDetails}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-champagne-700 via-champagne-800 to-onyx-800 hover:from-champagne-800 hover:via-onyx-700 hover:to-onyx-900 shadow-sm"
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
    <div className="px-4 py-3 border-t border-champagne-100 first:border-t-0">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-[0.12em] font-bold text-onyx-500">
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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 text-xs">{children}</div>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col min-w-0">
      <span className="text-[10px] uppercase tracking-wider font-semibold text-onyx-500">{label}</span>
      <span className={`text-onyx-900 font-medium ${mono ? 'font-mono' : ''} break-words`} title={value}>
        {value}
      </span>
    </div>
  );
}

