/**
 * ============================================
 * DIAMOND VALUATION PAGE
 * ============================================
 */

import { useQuery } from '@tanstack/react-query';
import { getAllDiamonds } from '../../services/diamond.service';

export default function DiamondValuationPage() {
  const { data: diamonds = [], isLoading } = useQuery({
    queryKey: ['diamonds-valuation'],
    queryFn: () => getAllDiamonds({}),
  });

  const totalValue = diamonds.reduce((sum: number, d: any) => sum + (d.totalPrice || 0), 0);
  const totalCarats = diamonds.reduce((sum: number, d: any) => sum + d.caratWeight, 0);
  const avgPricePerCarat = totalCarats > 0 ? totalValue / totalCarats : 0;

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Diamond Valuation</h1>
          <p className="text-gray-600">Total inventory value and statistics</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Total Diamonds</p>
            <p className="text-3xl font-bold text-gray-900">{diamonds.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Total Carats</p>
            <p className="text-3xl font-bold text-gray-900">{totalCarats.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Avg Price/Carat</p>
            <p className="text-2xl font-bold text-gray-900">
              ₹{avgPricePerCarat.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Total Value</p>
            <p className="text-2xl font-bold text-green-600">
              ₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        {/* Diamonds by Value */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Diamonds by Value</h2>
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
                    4C
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Price/Carat
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total Value
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {diamonds
                  .filter((d: any) => d.totalPrice)
                  .sort((a: any, b: any) => (b.totalPrice || 0) - (a.totalPrice || 0))
                  .map((diamond: any) => (
                    <tr key={diamond.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                        {diamond.stockNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        {diamond.caratWeight}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {diamond.color} {diamond.clarity} {diamond.cut || ''} {diamond.shape}
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
