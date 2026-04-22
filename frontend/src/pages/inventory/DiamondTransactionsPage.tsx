/**
 * ============================================
 * DIAMOND TRANSACTIONS PAGE
 * ============================================
 */

import { useQuery } from '@tanstack/react-query';
import { getAllDiamonds } from '../../services/diamond.service';

export default function DiamondTransactionsPage() {
  const { data: diamonds = [], isLoading } = useQuery({
    queryKey: ['diamonds-transactions'],
    queryFn: () => getAllDiamonds({}),
  });

  const issuedDiamonds = diamonds.filter((d: any) => d.status === 'ISSUED');
  const inStockDiamonds = diamonds.filter((d: any) => d.status === 'IN_STOCK');

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Diamond Transactions</h1>
          <p className="text-gray-600">View diamond movement history</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Total Diamonds</p>
            <p className="text-3xl font-bold text-gray-900">{diamonds.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">In Stock</p>
            <p className="text-3xl font-bold text-green-600">{inStockDiamonds.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Issued</p>
            <p className="text-3xl font-bold text-blue-600">{issuedDiamonds.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Issued Diamonds</h2>
          <div className="space-y-4">
            {issuedDiamonds.map((diamond: any) => (
              <div key={diamond.id} className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900">{diamond.stockNumber}</h3>
                    <p className="text-sm text-gray-600">
                      {diamond.caratWeight}ct - {diamond.color} {diamond.clarity} {diamond.shape}
                    </p>
                    {diamond.issuedAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        Issued: {new Date(diamond.issuedAt).toLocaleDateString('en-IN')}
                      </p>
                    )}
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                    ISSUED
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
