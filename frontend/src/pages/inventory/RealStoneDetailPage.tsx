/**
 * ============================================
 * REAL STONE DETAIL PAGE
 * ============================================
 */

import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getAllRealStones } from '../../services/stone.service';
import Button from '../../components/common/Button';

export default function RealStoneDetailPage() {
  const { stoneId } = useParams<{ stoneId: string }>();

  const { data: stones = [] } = useQuery({
    queryKey: ['real-stones'],
    queryFn: () => getAllRealStones(),
  });

  const stone = stones.find((s: any) => s.id === stoneId);

  if (!stone) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <p className="text-gray-500 text-lg">Stone not found</p>
            <Link to="/app/inventory/real-stones" className="mt-4 inline-block">
              <Button variant="primary">Back to Real Stones</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link
            to="/app/inventory/real-stones"
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
            Back to Real Stones
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">{stone.stockNumber}</h1>
          <p className="text-gray-600">{stone.stoneType}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Stone Specifications</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Carat Weight</p>
                  <p className="text-2xl font-bold text-gray-900">{stone.caratWeight}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Shape</p>
                  <p className="text-2xl font-bold text-gray-900">{stone.shape}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Color</p>
                  <p className="text-2xl font-bold text-gray-900">{stone.color}</p>
                </div>
                {stone.clarity && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Clarity</p>
                    <p className="text-2xl font-bold text-gray-900">{stone.clarity}</p>
                  </div>
                )}
                {stone.origin && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600 mb-1">Origin</p>
                    <p className="text-lg font-bold text-gray-900">{stone.origin}</p>
                  </div>
                )}
                {stone.treatment && (
                  <div className="col-span-2 p-4 bg-amber-50 rounded-xl">
                    <p className="text-sm font-semibold text-amber-900">Treatment</p>
                    <p className="text-amber-700">{stone.treatment}</p>
                    {stone.treatmentNotes && (
                      <p className="text-sm text-amber-600 mt-1">{stone.treatmentNotes}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4">Pricing</h3>
              {stone.pricePerCarat && (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Price per Carat</p>
                    <p className="text-lg font-bold text-gray-900">
                      ₹{stone.pricePerCarat.toLocaleString('en-IN')}
                    </p>
                  </div>
                  {stone.totalPrice && (
                    <div>
                      <p className="text-sm text-gray-600">Total Price</p>
                      <p className="text-2xl font-bold text-green-600">
                        ₹{stone.totalPrice.toLocaleString('en-IN')}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4">Status</h3>
              <span className="inline-flex px-4 py-2 rounded-xl text-sm font-semibold bg-green-100 text-green-800">
                {stone.status}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
