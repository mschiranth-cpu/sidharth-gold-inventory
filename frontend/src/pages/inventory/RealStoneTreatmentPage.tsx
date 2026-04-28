/**
 * ============================================
 * REAL STONE TREATMENT & ORIGIN PAGE
 * ============================================
 * Tabbed view grouping stones by treatment and by origin.
 */

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getAllRealStones } from '../../services/stone.service';
import Button from '../../components/common/Button';

type Tab = 'treatment' | 'origin';

export default function RealStoneTreatmentPage() {
  const [tab, setTab] = useState<Tab>('treatment');

  const { data: stones = [], isLoading } = useQuery({
    queryKey: ['real-stones-treatment-origin'],
    queryFn: () => getAllRealStones({}),
  });

  const grouped = useMemo(() => {
    const key = tab === 'treatment' ? 'treatment' : 'origin';
    return (stones as any[]).reduce((acc: Record<string, any[]>, stone: any) => {
      const k = stone[key] || (key === 'treatment' ? 'None' : 'Unknown');
      (acc[k] = acc[k] || []).push(stone);
      return acc;
    }, {});
  }, [stones, tab]);

  return (
    <div className="p-6 bg-gradient-to-b from-pearl to-white min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-champagne-800 via-champagne-700 to-onyx-800 bg-clip-text text-transparent">
              Treatment & Origin
            </h1>
            <p className="text-onyx-500 mt-1">View stones grouped by treatment or origin</p>
          </div>
          <Link to="/app/inventory/real-stones">
            <Button variant="secondary">Back to Dashboard</Button>
          </Link>
        </div>

        <div className="inline-flex rounded-xl border border-champagne-200 bg-white p-1 mb-6 shadow-sm">
          {(['treatment', 'origin'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize ${
                tab === t
                  ? 'bg-champagne-600 text-white shadow'
                  : 'text-onyx-600 hover:bg-champagne-50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {isLoading ? (
          <p className="text-sm text-onyx-400">Loading…</p>
        ) : Object.keys(grouped).length === 0 ? (
          <p className="text-sm text-onyx-400 italic">No stones found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(grouped).map(([k, list]) => (
              <div key={k} className="bg-white rounded-2xl shadow-sm p-6 border border-champagne-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-onyx-900">{k}</h3>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-champagne-50 text-champagne-800 border border-champagne-200">
                    {list.length} stones
                  </span>
                </div>
                <div className="space-y-3">
                  {list.slice(0, 5).map((stone: any) => (
                    <div key={stone.id} className="p-3 bg-pearl/40 rounded-xl">
                      <p className="font-semibold text-onyx-900">{stone.stockNumber}</p>
                      <p className="text-sm text-onyx-600">
                        {stone.stoneType} - {stone.caratWeight}ct
                      </p>
                      <p className="text-xs text-onyx-500">{stone.color}</p>
                    </div>
                  ))}
                  {list.length > 5 && (
                    <p className="text-xs text-onyx-500 text-center">+{list.length - 5} more</p>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-champagne-100">
                  <p className="text-sm text-onyx-600">
                    Total Carats:{' '}
                    {list.reduce((sum, s: any) => sum + (s.caratWeight ?? 0), 0).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
