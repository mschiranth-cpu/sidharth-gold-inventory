/**
 * ============================================
 * REAL STONE ORIGIN PAGE
 * ============================================
 */

import { useQuery } from '@tanstack/react-query';
import { getAllRealStones } from '../../services/stone.service';

export default function RealStoneOriginPage() {
  const { data: stones = [], isLoading } = useQuery({
    queryKey: ['real-stones-origin'],
    queryFn: () => getAllRealStones({}),
  });

  const stonesByOrigin = stones.reduce((acc: any, stone: any) => {
    const origin = stone.origin || 'Unknown';
    if (!acc[origin]) acc[origin] = [];
    acc[origin].push(stone);
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Stones by Origin</h1>
          <p className="text-gray-600">View stones grouped by origin</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(stonesByOrigin).map(([origin, stones]: [string, any]) => (
            <div key={origin} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4">{origin}</h3>
              <div className="space-y-3">
                {stones.map((stone: any) => (
                  <div key={stone.id} className="p-3 bg-gray-50 rounded-xl">
                    <p className="font-semibold text-gray-900">{stone.stockNumber}</p>
                    <p className="text-sm text-gray-600">
                      {stone.stoneType} - {stone.caratWeight}ct
                    </p>
                    <p className="text-xs text-gray-500">{stone.color}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">Total: {stones.length} stones</p>
                <p className="text-sm text-gray-600">
                  Total Carats:{' '}
                  {stones.reduce((sum: number, s: any) => sum + s.caratWeight, 0).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
