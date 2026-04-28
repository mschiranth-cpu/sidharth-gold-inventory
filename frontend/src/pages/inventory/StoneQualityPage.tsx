/**
 * ============================================
 * STONE QUALITY PAGE
 * ============================================
 */

import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getAllStonePackets } from '../../services/stone.service';
import Button from '../../components/common/Button';

export default function StoneQualityPage() {
  const { data: packets = [], isLoading } = useQuery({
    queryKey: ['stone-packets-quality'],
    queryFn: () => getAllStonePackets({}),
  });

  const packetsByQuality = packets.reduce((acc: any, packet: any) => {
    const quality = packet.quality || 'Ungraded';
    if (!acc[quality]) acc[quality] = [];
    acc[quality].push(packet);
    return acc;
  }, {});

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
        <div className="mb-8 flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Stones by Quality</h1>
            <p className="text-gray-600">View stone packets grouped by quality grade</p>
          </div>
          <Link to="/app/inventory/stone-packets">
            <Button variant="secondary">Back to Dashboard</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(packetsByQuality).map(([quality, packets]: [string, any]) => (
            <div
              key={quality}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">{quality}</h3>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    quality === 'AAA'
                      ? 'bg-green-100 text-green-800'
                      : quality === 'AA'
                      ? 'bg-blue-100 text-blue-800'
                      : quality === 'A'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {packets.length} packets
                </span>
              </div>
              <div className="space-y-3">
                {packets.map((packet: any) => (
                  <div key={packet.id} className="p-3 bg-gray-50 rounded-xl">
                    <p className="font-semibold text-gray-900">{packet.packetNumber}</p>
                    <p className="text-sm text-gray-600">
                      {packet.stoneType} - {packet.size}
                    </p>
                    <p className="text-xs text-gray-500">
                      {packet.currentWeight} {packet.unit}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Total Weight:{' '}
                  {packets.reduce((sum: number, p: any) => sum + p.currentWeight, 0).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
