/**
 * ============================================
 * DIAMOND PRICING PAGE
 * ============================================
 */

import { useQuery } from '@tanstack/react-query';
import { getAllDiamonds } from '../../services/diamond.service';

export default function DiamondPricingPage() {
  const { data: diamonds = [], isLoading } = useQuery({
    queryKey: ['diamonds-pricing'],
    queryFn: () => getAllDiamonds({}),
  });

  const pricedDiamonds = diamonds.filter((d: any) => d.pricePerCarat);
  const unpricedDiamonds = diamonds.filter((d: any) => !d.pricePerCarat);

  const avgPricePerCarat =
    pricedDiamonds.length > 0
      ? pricedDiamonds.reduce((sum: number, d: any) => sum + (d.pricePerCarat || 0), 0) /
        pricedDiamonds.length
      : 0;

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Diamond Pricing</h1>
          <p className="text-gray-600">View diamond pricing information</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Priced Diamonds</p>
            <p className="text-3xl font-bold text-green-600">{pricedDiamonds.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Unpriced Diamonds</p>
            <p className="text-3xl font-bold text-amber-600">{unpricedDiamonds.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Avg Price/Carat</p>
            <p className="text-2xl font-bold text-gray-900">
              ₹{avgPricePerCarat.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Price Range by 4C</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Stock Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Carat
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Color
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Clarity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Cut
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
                {pricedDiamonds.map((diamond: any) => (
                  <tr key={diamond.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                      {diamond.stockNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                      {diamond.caratWeight}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">{diamond.color}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">{diamond.clarity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                      {diamond.cut || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                      ₹{diamond.pricePerCarat?.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-green-600">
                      ₹{diamond.totalPrice?.toLocaleString('en-IN')}
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
