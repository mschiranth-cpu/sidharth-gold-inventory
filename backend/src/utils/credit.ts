/**
 * Vendor credit-period utilities — shared across the 4 PURCHASE flows
 * (metal / diamond / real-stone / stone-packet) and the Diamond PO flow.
 *
 * Field name decisions:
 *   - `paymentDueDays` (Int) is the vendor-level default credit period.
 *     Distinct from `Vendor.creditBalance` (Float — monetary balance) and
 *     `Order.paymentTerms` (customer-facing enum).
 *   - For foreign vendors that don't have `paymentDueDays` set, we fall
 *     back to parsing `vendor.gstDetails.foreignDetails.paymentTerms` as a
 *     free-text string like "NET 30".
 */
export interface VendorCreditInput {
  paymentDueDays?: number | null;
  // gstDetails is JSON in Prisma — typed loosely to avoid leaking module shape.
  gstDetails?: unknown;
}

/**
 * Resolve the effective due-days from a vendor row.
 * Order: explicit `paymentDueDays` → foreign `paymentTerms` "NET N" → 0.
 * Defensive against malformed JSON / non-object gstDetails.
 */
export function resolveVendorDueDays(
  vendor: VendorCreditInput | null | undefined
): number {
  if (!vendor) return 0;

  if (
    typeof vendor.paymentDueDays === 'number' &&
    Number.isFinite(vendor.paymentDueDays) &&
    vendor.paymentDueDays >= 0
  ) {
    return Math.floor(vendor.paymentDueDays);
  }

  // Fallback: parse "NET 30" / "Net30" / "net  60" from foreign vendor terms.
  const gst = vendor.gstDetails;
  if (gst && typeof gst === 'object' && !Array.isArray(gst)) {
    const foreign = (gst as Record<string, unknown>).foreignDetails;
    if (foreign && typeof foreign === 'object' && !Array.isArray(foreign)) {
      const terms = (foreign as Record<string, unknown>).paymentTerms;
      if (typeof terms === 'string') {
        const match = terms.match(/NET\s*(\d+)/i);
        if (match) {
          const days = parseInt(match[1], 10);
          if (Number.isFinite(days) && days >= 0) return days;
        }
      }
    }
  }

  return 0;
}

/**
 * Compute the dueDate for a PURCHASE row.
 * Precedence:
 *   1. explicit `override` (admin-set per-invoice override) — wins
 *   2. transactionDate + resolveVendorDueDays(vendor)
 *
 * NOTE: returns a fresh `Date` (never mutates the input).
 */
export function computeDueDate(
  transactionDate: Date | string,
  vendor: VendorCreditInput | null | undefined,
  override?: Date | string | null
): Date {
  if (override !== undefined && override !== null && override !== '') {
    const od = typeof override === 'string' ? new Date(override) : override;
    if (!Number.isNaN(od.getTime())) return od;
  }

  const baseDate =
    typeof transactionDate === 'string'
      ? new Date(transactionDate)
      : transactionDate;
  const safeBase = Number.isNaN(baseDate.getTime()) ? new Date() : baseDate;

  const days = resolveVendorDueDays(vendor);
  const result = new Date(safeBase.getTime());
  result.setDate(result.getDate() + days);
  return result;
}
