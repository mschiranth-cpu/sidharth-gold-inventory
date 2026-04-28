/**
 * ============================================
 * LIVE REAL STONE RATES CARD
 * ============================================
 * Mirror of LiveDiamondRatesCard. Surfaces office rate-card entries from
 * `/stones/real/rates` and lets the user click a row to autofill
 * `pricePerCarat` in the parent form.
 */

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCurrentRealStoneRates, type RealStoneRate } from '../services/stone.service';

interface Props {
  selectedStoneType?: string;
  selectedQuality?: string;
  selectedCarat?: number;
  onUseRate?: (pricePerCarat: number) => void;
}

const fmt = (n: number) =>
  n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export default function LiveRealStoneRatesCard({
  selectedStoneType,
  selectedQuality,
  selectedCarat,
  onUseRate,
}: Props) {
  const [showAll, setShowAll] = useState(false);

  const { data: rates = [], isLoading, error } = useQuery({
    queryKey: ['real-stone-rates'],
    queryFn: getCurrentRealStoneRates,
    staleTime: 60_000,
  });

  const ranked = useMemo(() => {
    const score = (r: RealStoneRate) => {
      let s = 0;
      if (selectedStoneType && r.stoneType === selectedStoneType) s += 8;
      if (selectedQuality && r.quality === selectedQuality) s += 4;
      if (
        selectedCarat &&
        selectedCarat >= r.caratFrom &&
        selectedCarat <= r.caratTo
      )
        s += 1;
      return s;
    };
    return [...rates].sort((a, b) => score(b) - score(a));
  }, [rates, selectedStoneType, selectedQuality, selectedCarat]);

  const visible = showAll ? ranked : ranked.slice(0, 6);

  return (
    <div className="rounded-2xl border border-champagne-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-3 bg-gradient-to-r from-champagne-50 via-pearl-50 to-onyx-50 border-b border-champagne-200 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-onyx-800">Office Rate Card</h3>
          <p className="text-xs text-onyx-400">
            Click any row to apply that price-per-carat.
          </p>
        </div>
        {ranked.length > 6 && (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="text-xs font-medium text-champagne-700 hover:text-champagne-900 underline"
          >
            {showAll ? 'Show less' : `Show all ${ranked.length}`}
          </button>
        )}
      </div>
      <div className="p-3">
        {isLoading ? (
          <p className="text-xs text-onyx-400 px-2 py-3">Loading rates…</p>
        ) : error ? (
          <p className="text-xs text-accent-ruby px-2 py-3">Failed to load rates.</p>
        ) : ranked.length === 0 ? (
          <p className="text-xs text-onyx-400 italic px-2 py-3">
            No rate-card entries yet. Add one from Real Stone → Rate Management.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-onyx-500">
                <tr>
                  <th className="px-2 py-1 text-left font-medium">Stone Type</th>
                  <th className="px-2 py-1 text-left font-medium">Quality</th>
                  <th className="px-2 py-1 text-right font-medium">Carat Range</th>
                  <th className="px-2 py-1 text-right font-medium">₹ / ct</th>
                  <th className="px-2 py-1 text-right font-medium">Effective</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => {
                  const isMatch =
                    (!selectedStoneType || r.stoneType === selectedStoneType) &&
                    (!selectedQuality || r.quality === selectedQuality);
                  return (
                    <tr
                      key={r.id}
                      onClick={() => onUseRate?.(r.pricePerCarat)}
                      className={`border-t border-champagne-100 cursor-pointer hover:bg-champagne-50 ${
                        isMatch ? 'bg-pearl-50/60' : ''
                      }`}
                    >
                      <td className="px-2 py-1.5 text-onyx-800 font-medium">{r.stoneType}</td>
                      <td className="px-2 py-1.5 text-onyx-700">{r.quality ?? '—'}</td>
                      <td className="px-2 py-1.5 text-right text-onyx-700">
                        {r.caratFrom}–{r.caratTo}
                      </td>
                      <td className="px-2 py-1.5 text-right font-bold bg-clip-text text-transparent bg-gradient-to-r from-champagne-800 via-champagne-700 to-onyx-800">
                        ₹{fmt(r.pricePerCarat)}
                      </td>
                      <td className="px-2 py-1.5 text-right text-xs text-onyx-400">
                        {new Date(r.effectiveDate).toLocaleDateString('en-IN')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
