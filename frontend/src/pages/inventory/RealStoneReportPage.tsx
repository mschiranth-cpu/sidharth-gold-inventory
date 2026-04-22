/**
 * ============================================
 * REAL STONE REPORT PAGE
 * ============================================
 */

import { useQuery } from '@tanstack/react-query';
import { getAllRealStones } from '../../services/stone.service';
import Button from '../../components/common/Button';

export default function RealStoneReportPage() {
  const { data: stones = [], isLoading } = useQuery({
    queryKey: ['real-stones-report'],
    queryFn: () => getAllRealStones({}),
  });

  const byType = stones.reduce((acc: any, s: any) => {
    acc[s.stoneType] = (acc[s.stoneType] || 0) + 1;
    return acc;
  }, {});

  const totalCarats = stones.reduce((sum: number, s: any) => sum + s.caratWeight, 0);
  const totalValue = stones.reduce((sum: number, s: any) => sum + (s.totalPrice || 0), 0);

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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Real Stone Report</h1>
            <p className="text-gray-600">Comprehensive real stone inventory analysis</p>
          </div>
          <Button variant="primary">Export Report</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Total Stones</p>
            <p className="text-3xl font-bold text-gray-900">{stones.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Total Carats</p>
            <p className="text-2xl font-bold text-gray-900">{totalCarats.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Stone Types</p>
            <p className="text-3xl font-bold text-blue-600">{Object.keys(byType).length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Total Value</p>
            <p className="text-xl font-bold text-green-600">
              ₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Stones by Type</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Object.entries(byType).map(([type, count]) => (
              <div key={type} className="p-4 bg-gray-50 rounded-xl text-center">
                <p className="text-sm text-gray-600 mb-1">{type}</p>
                <p className="text-2xl font-bold text-gray-900">{count as number}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
