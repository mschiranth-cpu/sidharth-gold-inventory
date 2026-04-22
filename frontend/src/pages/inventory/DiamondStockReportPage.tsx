/**
 * ============================================
 * DIAMOND STOCK REPORT PAGE
 * ============================================
 */

import { useQuery } from '@tanstack/react-query';
import { getAllDiamonds } from '../../services/diamond.service';
import Button from '../../components/common/Button';

export default function DiamondStockReportPage() {
  const { data: diamonds = [], isLoading } = useQuery({
    queryKey: ['diamonds-stock-report'],
    queryFn: () => getAllDiamonds({}),
  });

  const totalCarats = diamonds.reduce((sum: number, d: any) => sum + d.caratWeight, 0);
  const totalValue = diamonds.reduce((sum: number, d: any) => sum + (d.totalPrice || 0), 0);
  const inStock = diamonds.filter((d: any) => d.status === 'IN_STOCK');
  const issued = diamonds.filter((d: any) => d.status === 'ISSUED');

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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Diamond Stock Report</h1>
            <p className="text-gray-600">Current diamond stock status</p>
          </div>
          <Button variant="primary">Export Report</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Total Diamonds</p>
            <p className="text-3xl font-bold text-gray-900">{diamonds.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Total Carats</p>
            <p className="text-2xl font-bold text-gray-900">{totalCarats.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">In Stock</p>
            <p className="text-3xl font-bold text-green-600">{inStock.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Total Value</p>
            <p className="text-xl font-bold text-green-600">
              ₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Stock Details</h2>
          </div>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {diamonds.map((diamond: any) => (
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
                      {diamond.pricePerCarat
                        ? `₹${diamond.pricePerCarat.toLocaleString('en-IN')}`
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-green-600">
                      {diamond.totalPrice ? `₹${diamond.totalPrice.toLocaleString('en-IN')}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
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
