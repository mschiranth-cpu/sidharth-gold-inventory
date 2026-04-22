/**
 * ============================================
 * STONE INVENTORY REPORT PAGE
 * ============================================
 */

import { useQuery } from '@tanstack/react-query';
import { getAllStonePackets } from '../../services/stone.service';
import Button from '../../components/common/Button';

export default function StoneInventoryReportPage() {
  const { data: packets = [], isLoading } = useQuery({
    queryKey: ['stone-packets-report'],
    queryFn: () => getAllStonePackets({}),
  });

  const byType = packets.reduce((acc: any, p: any) => {
    acc[p.stoneType] = (acc[p.stoneType] || 0) + 1;
    return acc;
  }, {});

  const bySize = packets.reduce((acc: any, p: any) => {
    acc[p.size] = (acc[p.size] || 0) + 1;
    return acc;
  }, {});

  const totalWeight = packets.reduce((sum: number, p: any) => sum + p.currentWeight, 0);
  const totalValue = packets.reduce(
    (sum: number, p: any) => sum + p.currentWeight * (p.pricePerUnit || 0),
    0
  );

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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Stone Inventory Report</h1>
            <p className="text-gray-600">Comprehensive stone inventory analysis</p>
          </div>
          <Button variant="primary">Export Report</Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Total Packets</p>
            <p className="text-3xl font-bold text-gray-900">{packets.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Total Weight</p>
            <p className="text-2xl font-bold text-gray-900">{totalWeight.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Total Value</p>
            <p className="text-2xl font-bold text-green-600">
              ₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Stone Types</p>
            <p className="text-3xl font-bold text-gray-900">{Object.keys(byType).length}</p>
          </div>
        </div>

        {/* By Type */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Packets by Stone Type</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Object.entries(byType).map(([type, count]) => (
              <div key={type} className="p-4 bg-gray-50 rounded-xl text-center">
                <p className="text-sm text-gray-600 mb-1">{type}</p>
                <p className="text-2xl font-bold text-gray-900">{count as number}</p>
              </div>
            ))}
          </div>
        </div>

        {/* By Size */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Packets by Size</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Object.entries(bySize).map(([size, count]) => (
              <div key={size} className="p-4 bg-gray-50 rounded-xl text-center">
                <p className="text-sm text-gray-600 mb-1">{size}</p>
                <p className="text-2xl font-bold text-gray-900">{count as number}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
