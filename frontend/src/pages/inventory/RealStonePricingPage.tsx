/**
 * ============================================
 * REAL STONE PRICING PAGE
 * ============================================
 */

import { useQuery } from '@tanstack/react-query';
import { getAllRealStones } from '../../services/stone.service';

export default function RealStonePricingPage() {
  const { data: stones = [], isLoading } = useQuery({
    queryKey: ['real-stones-pricing'],
    queryFn: () => getAllRealStones({}),
  });

  const pricedStones = stones.filter((s: any) => s.pricePerCarat);
  const unpricedStones = stones.filter((s: any) => !s.pricePerCarat);

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Real Stone Pricing</h1>
          <p className="text-gray-600">View real stone pricing information</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Priced Stones</p>
            <p className="text-3xl font-bold text-green-600">{pricedStones.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Unpriced Stones</p>
            <p className="text-3xl font-bold text-amber-600">{unpricedStones.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Priced Stones</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Stock Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Carat
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Color
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Origin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Price/Carat
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total Price
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pricedStones.map((stone: any) => (
                  <tr key={stone.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                      {stone.stockNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">{stone.stoneType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                      {stone.caratWeight}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">{stone.color}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {stone.origin || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                      ₹{stone.pricePerCarat?.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-green-600">
                      ₹{stone.totalPrice?.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
