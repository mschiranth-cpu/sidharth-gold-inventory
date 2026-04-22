/**
 * ============================================
 * DIAMOND LOT DETAIL PAGE
 * ============================================
 */

import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getAllDiamondLots } from '../../services/diamond.service';
import Button from '../../components/common/Button';

export default function DiamondLotDetailPage() {
  const { lotId } = useParams<{ lotId: string }>();

  const { data: lots = [] } = useQuery({
    queryKey: ['diamond-lots'],
    queryFn: getAllDiamondLots,
  });

  const lot = lots.find((l: any) => l.id === lotId);

  if (!lot) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <p className="text-gray-500 text-lg">Lot not found</p>
            <Link to="/app/inventory/diamonds/lots" className="mt-4 inline-block">
              <Button variant="primary">Back to Lots</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link
            to="/app/inventory/diamonds/lots"
            className="text-indigo-600 hover:text-indigo-700 font-medium text-sm mb-4 inline-flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Lots
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">{lot.lotNumber}</h1>
          {lot.description && <p className="text-gray-600">{lot.description}</p>}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Lot Summary</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Pieces</p>
                  <p className="text-3xl font-bold text-gray-900">{lot.totalPieces}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Carats</p>
                  <p className="text-3xl font-bold text-gray-900">{lot.totalCarats}</p>
                </div>
                {lot.avgPricePerCarat && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600 mb-1">Average Price per Carat</p>
                    <p className="text-2xl font-bold text-green-600">
                      ₹{lot.avgPricePerCarat.toLocaleString('en-IN')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {lot.diamonds && lot.diamonds.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Diamonds in this Lot</h2>
                <div className="space-y-3">
                  {lot.diamonds.map((diamond: any) => (
                    <div key={diamond.id} className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{diamond.stockNumber}</p>
                          <p className="text-sm text-gray-600">
                            {diamond.caratWeight}ct - {diamond.color} {diamond.clarity}{' '}
                            {diamond.shape}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            diamond.status === 'IN_STOCK'
                              ? 'bg-green-100 text-green-800'
                              : diamond.status === 'ISSUED'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {diamond.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4">Lot Information</h3>
              <div className="space-y-3 text-sm">
                {lot.purchaseDate && (
                  <div>
                    <p className="text-gray-600">Purchase Date</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(lot.purchaseDate).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-gray-600">Created</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(lot.createdAt).toLocaleDateString('en-IN')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
