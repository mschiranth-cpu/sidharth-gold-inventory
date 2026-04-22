/**
 * ============================================
 * STONE PACKET DETAIL PAGE
 * ============================================
 */

import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getAllStonePackets } from '../../services/stone.service';
import Button from '../../components/common/Button';

export default function StonePacketDetailPage() {
  const { packetId } = useParams<{ packetId: string }>();

  const { data: packets = [] } = useQuery({
    queryKey: ['stone-packets'],
    queryFn: () => getAllStonePackets(),
  });

  const packet = packets.find((p: any) => p.id === packetId);

  if (!packet) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <p className="text-gray-500 text-lg">Packet not found</p>
            <Link to="/app/inventory/stone-packets" className="mt-4 inline-block">
              <Button variant="primary">Back to Stone Packets</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const stockPercent = (packet.currentWeight / packet.totalWeight) * 100;

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link
            to="/app/inventory/stone-packets"
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
            Back to Stone Packets
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">{packet.packetNumber}</h1>
          <p className="text-gray-600">
            {packet.stoneType} - {packet.size}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Packet Details</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600">Stone Type</p>
                  <p className="font-semibold text-gray-900">{packet.stoneType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Size</p>
                  <p className="font-semibold text-gray-900">{packet.size}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Shape</p>
                  <p className="font-semibold text-gray-900">{packet.shape}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Color</p>
                  <p className="font-semibold text-gray-900">{packet.color}</p>
                </div>
                {packet.quality && (
                  <div>
                    <p className="text-sm text-gray-600">Quality</p>
                    <p className="font-semibold text-gray-900">{packet.quality}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Unit</p>
                  <p className="font-semibold text-gray-900">{packet.unit}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Stock Information</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Stock Level</span>
                    <span className="text-sm text-gray-600">{stockPercent.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        stockPercent < 30
                          ? 'bg-red-500'
                          : stockPercent < 60
                          ? 'bg-amber-500'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${stockPercent}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Weight</p>
                    <p className="text-lg font-bold text-gray-900">
                      {packet.totalWeight} {packet.unit}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Current Weight</p>
                    <p className="text-lg font-bold text-gray-900">
                      {packet.currentWeight} {packet.unit}
                    </p>
                  </div>
                </div>

                {packet.reorderLevel && packet.currentWeight < packet.reorderLevel && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-sm font-semibold text-red-800">⚠️ Below Reorder Level</p>
                    <p className="text-xs text-red-600 mt-1">
                      Reorder Level: {packet.reorderLevel} {packet.unit}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {packet.pricePerUnit && (
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4">Pricing</h3>
                <div>
                  <p className="text-sm text-gray-600">Price per {packet.unit}</p>
                  <p className="text-2xl font-bold text-green-600">
                    ₹{packet.pricePerUnit.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">Total Value</p>
                  <p className="text-xl font-bold text-gray-900">
                    ₹{(packet.currentWeight * packet.pricePerUnit).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Button variant="primary" size="lg" className="w-full">
                Issue Stones
              </Button>
              <Button variant="secondary" size="lg" className="w-full">
                Add Stock
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
