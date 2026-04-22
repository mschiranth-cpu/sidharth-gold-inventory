/**
 * ============================================
 * DIAMOND LOTS PAGE
 * ============================================
 */

import { useQuery } from '@tanstack/react-query';
import { getAllDiamondLots } from '../../services/diamond.service';
import Button from '../../components/common/Button';

export default function DiamondLotsPage() {
  const { data: lots = [], isLoading } = useQuery({
    queryKey: ['diamond-lots'],
    queryFn: getAllDiamondLots,
  });

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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Diamond Lots</h1>
            <p className="text-gray-600">Manage diamond lots and parcels</p>
          </div>
          <Button variant="primary">Create Lot</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lots.map((lot: any) => (
            <div key={lot.id} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{lot.lotNumber}</h3>
              {lot.description && <p className="text-sm text-gray-600 mb-4">{lot.description}</p>}

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Total Pieces</p>
                  <p className="text-lg font-bold text-gray-900">{lot.totalPieces}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Carats</p>
                  <p className="text-lg font-bold text-gray-900">{lot.totalCarats}</p>
                </div>
              </div>

              {lot.avgPricePerCarat && (
                <div className="p-3 bg-green-50 rounded-xl">
                  <p className="text-sm text-gray-700">Avg Price/Carat</p>
                  <p className="text-xl font-bold text-green-600">
                    ₹{lot.avgPricePerCarat.toLocaleString('en-IN')}
                  </p>
                </div>
              )}

              {lot.diamonds && lot.diamonds.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    {lot.diamonds.length} diamonds in this lot
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
