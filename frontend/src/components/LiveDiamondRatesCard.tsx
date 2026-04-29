/**
 * ============================================
 * LIVE DIAMOND RATES CARD
 * ============================================
 * Shows the most recent rate-card entries from our own DB
 * (`/diamonds/rates`) and lets the user click a row to autofill
 * `pricePerCarat` in the parent form. Diamonds have no global spot
 * index like metals — pricing is set internally by the office.
 */

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCurrentDiamondRates, type DiamondRate } from '../services/diamond.service';
import { formatIstDate } from '../lib/dateUtils';

interface Props {
  selectedShape?: string;
  selectedColor?: string;
  selectedClarity?: string;
  selectedCarat?: number;
  onUseRate?: (pricePerCarat: number) => void;
}

const fmt = (n: number) =>
  n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export default function LiveDiamondRatesCard({
  selectedShape,
  selectedColor,
  selectedClarity,
  selectedCarat,
  onUseRate,
}: Props) {
  const [showAll, setShowAll] = useState(false);

  const { data: rates = [], isLoading, error } = useQuery({
    queryKey: ['diamond-rates'],
    queryFn: getCurrentDiamondRates,
    staleTime: 60_000,
  });

  // When the parent has selected attributes, surface matching rates first.
  const ranked = useMemo(() => {
    const score = (r: DiamondRate) => {
      let s = 0;
      if (selectedShape && r.shape === selectedShape) s += 8;
      if (selectedColor && r.color === selectedColor) s += 4;
      if (selectedClarity && r.clarity === selectedClarity) s += 2;
      if (
        selectedCarat &&
        selectedCarat >= r.caratFrom &&
        selectedCarat <= r.caratTo
      )
        s += 1;
      return s;
    };
    return [...rates].sort((a, b) => score(b) - score(a));
  }, [rates, selectedShape, selectedColor, selectedClarity, selectedCarat]);

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
            No rate-card entries yet. Add one from Diamond → Rate Management.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-onyx-500">
                <tr>
                  <th className="px-2 py-1 text-left font-medium">Shape</th>
                  <th className="px-2 py-1 text-left font-medium">Color</th>
                  <th className="px-2 py-1 text-left font-medium">Clarity</th>
                  <th className="px-2 py-1 text-right font-medium">Carat Range</th>
                  <th className="px-2 py-1 text-right font-medium">₹ / ct</th>
                  <th className="px-2 py-1 text-right font-medium">Effective</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => {
                  const isMatch =
                    (!selectedShape || r.shape === selectedShape) &&
                    (!selectedColor || r.color === selectedColor) &&
                    (!selectedClarity || r.clarity === selectedClarity);
                  return (
                    <tr
                      key={r.id}
                      onClick={() => onUseRate?.(r.pricePerCarat)}
                      className={`border-t border-champagne-100 cursor-pointer hover:bg-champagne-50 ${
                        isMatch ? 'bg-pearl-50/60' : ''
                      }`}
                    >
                      <td className="px-2 py-1.5 text-onyx-800 font-medium">{r.shape}</td>
                      <td className="px-2 py-1.5 text-onyx-700">{r.color}</td>
                      <td className="px-2 py-1.5 text-onyx-700">{r.clarity}</td>
                      <td className="px-2 py-1.5 text-right text-onyx-700">
                        {r.caratFrom}–{r.caratTo}
                      </td>
                      <td className="px-2 py-1.5 text-right font-bold bg-clip-text text-transparent bg-gradient-to-r from-champagne-800 via-champagne-700 to-onyx-800">
                        ₹{fmt(r.pricePerCarat)}
                      </td>
                      <td className="px-2 py-1.5 text-right text-xs text-onyx-400">
                        {formatIstDate(r.effectiveDate)}
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
