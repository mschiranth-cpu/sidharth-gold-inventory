/**
 * IST (Asia/Kolkata) date helpers.
 *
 * Why this file exists
 * --------------------
 * Bare `new Date(yyyyMmDd)` parses the string as UTC midnight, which when
 * rendered in IST shows up as 05:30 AM IST the same day. Multiply that by
 * every receive form + transaction list and the UI looked like every
 * transaction in the shop happened at exactly 5:30 in the morning.
 *
 * Equally, `toLocaleString('en-IN')` honours the *browser's* timezone, so
 * the same row would render at a different time for a user logging in
 * from outside India.
 *
 * Every transaction in this app represents a real-world event in the
 * shop's IST calendar. So:
 *
 *   - When the form sends a date-only string (`<input type="date">` value),
 *     the backend should receive an ISO timestamp anchored to IST, not
 *     UTC midnight. Use `combineDateWithCurrentIstTimeISO()` when saving.
 *
 *   - When we render any timestamp coming back from the API, force the
 *     IST timezone so every user (Mumbai, Bangalore, London on a VPN,
 *     anywhere) sees the same wall-clock time.
 *
 * NEVER reach for `new Date(x).toLocaleString(...)` for a transaction
 * timestamp \u2014 use the helpers below.
 */

const IST_TIMEZONE = 'Asia/Kolkata';
const IST_LOCALE = 'en-IN';

/**
 * Today's date as `YYYY-MM-DD` in **IST**, suitable as an
 * `<input type="date">` default value. Avoids the bug where
 * `new Date().toISOString().slice(0, 10)` returns yesterday between
 * 18:30\u201323:59 IST (when UTC has already rolled over but IST hasn't).
 */
export function nowIstDateString(): string {
  // `en-CA` formats as `YYYY-MM-DD` natively. `Asia/Kolkata` forces the
  // calculation regardless of where the browser thinks it is.
  return new Date().toLocaleDateString('en-CA', { timeZone: IST_TIMEZONE });
}

/**
 * Returns the current wall-clock time in IST as `HH:mm:ss`.
 * Used internally by `combineDateWithCurrentIstTimeISO`.
 */
function currentIstTimeOfDay(): { h: number; m: number; s: number } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: IST_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const h = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
  const m = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
  const s = Number(parts.find((p) => p.type === 'second')?.value ?? '0');
  return { h, m, s };
}

/**
 * Convert a `YYYY-MM-DD` (the value of an `<input type="date">`) into a
 * proper ISO timestamp anchored at the **current IST wall-clock time**
 * on that date.
 *
 * The transaction date stays whatever the user picked, but the time
 * component always reflects "right now" in IST. So:
 *
 *   - Same-day entry at 14:32 IST → `…T14:32:…` on the picked date.
 *   - Back-dated entry saved at 11:21 IST → `…T11:21:…` on the back-date
 *     (NOT noon, NOT 5:30 AM).
 *   - Future-dated entry → still uses current IST clock time.
 *
 * The returned string is a true UTC ISO that round-trips through Postgres
 * and renders correctly when run back through `formatIstDateTime`.
 *
 * @example
 *   // Called at 11:21:08 IST on 29/04/2026 with a back-dated entry:
 *   combineDateWithCurrentIstTimeISO('2026-04-28')
 *   → '2026-04-28T05:51:08.000Z'  (= 11:21:08 IST on the 28th)
 */
export function combineDateWithCurrentIstTimeISO(yyyyMmDd: string): string {
  if (!yyyyMmDd || !/^\d{4}-\d{2}-\d{2}$/.test(yyyyMmDd)) {
    // Defensive: fall back to the existing behaviour rather than crash.
    return new Date(yyyyMmDd).toISOString();
  }
  const [yStr, moStr, dStr] = yyyyMmDd.split('-');
  const year = Number(yStr);
  const month = Number(moStr); // 1-12
  const day = Number(dStr);

  // Always stamp the current IST wall-clock time, regardless of whether
  // the picked date is today, back-dated, or future. The semantics: the
  // user picks the calendar day; the moment-of-save provides the clock.
  const { h, m, s } = currentIstTimeOfDay();

  // IST is UTC+05:30, no DST. Subtract 5h30m from the IST wall time
  // to get the equivalent UTC instant, then build a UTC Date object.
  // Doing it this way (rather than `new Date(${yyyyMmDd}T${hh}:${mm}+05:30)`)
  // sidesteps any browser quirks with timezone-offset strings.
  const utcMillis = Date.UTC(year, month - 1, day, h, m, s) - (5 * 60 + 30) * 60 * 1000;
  return new Date(utcMillis).toISOString();
}

/**
 * Render a Date / ISO string as `DD/MM/YYYY` in IST.
 * Returns `\u2014` (em-dash) when the input is empty or invalid \u2014 so callers
 * can drop it straight into a table cell.
 */
export function formatIstDate(input: string | Date | null | undefined): string {
  if (!input) return '\u2014';
  const d = typeof input === 'string' ? new Date(input) : input;
  if (isNaN(d.getTime())) return '\u2014';
  return d.toLocaleDateString(IST_LOCALE, {
    timeZone: IST_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Render a Date / ISO string as `h:mm AM/PM` in IST (e.g. `2:32 PM`).
 */
export function formatIstTime(input: string | Date | null | undefined): string {
  if (!input) return '\u2014';
  const d = typeof input === 'string' ? new Date(input) : input;
  if (isNaN(d.getTime())) return '\u2014';
  return d.toLocaleTimeString(IST_LOCALE, {
    timeZone: IST_TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Render a Date / ISO string as `DD/MM/YYYY, h:mm AM/PM` in IST. Use for
 * audit logs / single-line timestamps where date + time both matter.
 */
export function formatIstDateTime(input: string | Date | null | undefined): string {
  if (!input) return '\u2014';
  const d = typeof input === 'string' ? new Date(input) : input;
  if (isNaN(d.getTime())) return '\u2014';
  return `${formatIstDate(d)}, ${formatIstTime(d)}`;
}

/**
 * Convert a Date / ISO string into the `YYYY-MM-DD` value an
 * `<input type="date">` expects, rendered in IST. Use this when
 * pre-populating a form's date input from existing data \u2014 prevents the
 * "browser timezone drift" bug where editing a row in London shows the
 * previous day.
 */
export function toIstDateInputValue(input: string | Date | null | undefined): string {
  if (!input) return '';
  const d = typeof input === 'string' ? new Date(input) : input;
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-CA', { timeZone: IST_TIMEZONE });
}

/**
 * Convert a `YYYY-MM-DD` (interpreted in IST) to its UTC start-of-day
 * and end-of-day epoch milliseconds. Use this for IST-aware date-range
 * filters \u2014 `new Date(yyyyMmDd).setHours(0,0,0,0)` would use the
 * browser's local timezone, which gives wrong results for users outside
 * India.
 */
export function istDayBoundsMs(yyyyMmDd: string): { startMs: number; endMs: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(yyyyMmDd);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
  const startMs = Date.UTC(y, mo - 1, d, 0, 0, 0, 0) - IST_OFFSET_MS;
  const endMs = Date.UTC(y, mo - 1, d, 23, 59, 59, 999) - IST_OFFSET_MS;
  return { startMs, endMs };
}
