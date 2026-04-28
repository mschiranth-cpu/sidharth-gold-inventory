/**
 * ============================================
 * STONE PACKET LIST PAGE
 * ============================================
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getAllStonePackets } from '../../services/stone.service';
import Button from '../../components/common/Button';

export default function StonePacketListPage() {
  const [filters, setFilters] = useState({ stoneType: '', size: '' });

  const { data: packets = [], isLoading } = useQuery({
    queryKey: ['stone-packets', filters],
    queryFn: () => getAllStonePackets(filters),
  });

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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Stone Inventory</h1>
            <p className="text-gray-600">Manage CZ, Kundan, Polki stones</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/app/inventory/stone-packets">
              <Button variant="secondary">Back to Dashboard</Button>
            </Link>
            <Link to="/app/inventory/stone-packets/receive">
              <Button variant="primary">Add Packet</Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100 mb-6">
          <div className="flex gap-4">
            <select
              value={filters.stoneType}
              onChange={(e) => setFilters({ ...filters, stoneType: e.target.value })}
              className="px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Types</option>
              <option value="CZ">CZ</option>
              <option value="AMERICAN_DIAMOND">American Diamond</option>
              <option value="KUNDAN">Kundan</option>
              <option value="POLKI">Polki</option>
            </select>
          </div>
        </div>

        {/* Packets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packets.map((packet: any) => (
            <div
              key={packet.id}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-2">{packet.packetNumber}</h3>
              <p className="text-sm text-gray-600 mb-4">
                {packet.stoneType} - {packet.size}
              </p>

              <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                <div>
                  <p className="text-gray-600">Shape</p>
                  <p className="font-semibold text-gray-900">{packet.shape}</p>
                </div>
                <div>
                  <p className="text-gray-600">Color</p>
                  <p className="font-semibold text-gray-900">{packet.color}</p>
                </div>
                <div>
                  <p className="text-gray-600">Current Stock</p>
                  <p className="text-lg font-bold text-gray-900">
                    {packet.currentWeight} {packet.unit}
                  </p>
                </div>
                {packet.pricePerUnit && (
                  <div>
                    <p className="text-gray-600">Price/{packet.unit}</p>
                    <p className="font-semibold text-gray-900">₹{packet.pricePerUnit}</p>
                  </div>
                )}
              </div>

              {packet.currentWeight < (packet.reorderLevel || 0) && (
                <div className="p-3 bg-red-50 rounded-xl">
                  <p className="text-xs text-red-700 font-semibold">
                    ⚠️ Low Stock - Reorder Required
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
