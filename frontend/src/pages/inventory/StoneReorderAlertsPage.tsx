/**
 * ============================================
 * STONE REORDER ALERTS PAGE
 * ============================================
 */

import { useQuery } from '@tanstack/react-query';
import { getAllStonePackets } from '../../services/stone.service';
import Button from '../../components/common/Button';

export default function StoneReorderAlertsPage() {
  const { data: packets = [], isLoading } = useQuery({
    queryKey: ['stone-packets-reorder'],
    queryFn: () => getAllStonePackets({}),
  });

  const lowStockPackets = packets.filter(
    (p: any) => p.reorderLevel && p.currentWeight < p.reorderLevel
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reorder Alerts</h1>
          <p className="text-gray-600">Stone packets below reorder level</p>
        </div>

        {lowStockPackets.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <svg
              className="w-20 h-20 text-green-300 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-gray-500 text-lg">All stone packets are adequately stocked</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lowStockPackets.map((packet: any) => (
              <div
                key={packet.id}
                className="bg-white rounded-2xl shadow-lg p-6 border-2 border-red-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{packet.packetNumber}</h3>
                    <p className="text-sm text-gray-600">
                      {packet.stoneType} - {packet.size}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                    ⚠️ Low Stock
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Current Stock</span>
                    <span className="font-bold text-red-600">
                      {packet.currentWeight} {packet.unit}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Reorder Level</span>
                    <span className="font-semibold text-gray-900">
                      {packet.reorderLevel} {packet.unit}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shortage</span>
                    <span className="font-bold text-red-600">
                      {(packet.reorderLevel - packet.currentWeight).toFixed(2)} {packet.unit}
                    </span>
                  </div>
                </div>

                <Button variant="primary" size="sm" className="w-full">
                  Create Purchase Order
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
