/**
 * ============================================
 * REAL STONE LIST PAGE
 * ============================================
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllRealStones } from '../../services/stone.service';
import Button from '../../components/common/Button';

export default function RealStoneListPage() {
  const [filters, setFilters] = useState({ stoneType: '', status: 'IN_STOCK' });

  const { data: stones = [], isLoading } = useQuery({
    queryKey: ['real-stones', filters],
    queryFn: () => getAllRealStones(filters),
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Real Stone Inventory</h1>
            <p className="text-gray-600">Manage precious stones (Ruby, Emerald, Sapphire)</p>
          </div>
          <Button variant="primary">Add Stone</Button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100 mb-6">
          <div className="flex gap-4">
            <select
              value={filters.stoneType}
              onChange={(e) => setFilters({ ...filters, stoneType: e.target.value })}
              className="px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Stones</option>
              <option value="RUBY">Ruby</option>
              <option value="EMERALD">Emerald</option>
              <option value="BLUE_SAPPHIRE">Blue Sapphire</option>
              <option value="YELLOW_SAPPHIRE">Yellow Sapphire</option>
            </select>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Status</option>
              <option value="IN_STOCK">In Stock</option>
              <option value="ISSUED">Issued</option>
            </select>
          </div>
        </div>

        {/* Stones Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stones.map((stone: any) => (
            <div
              key={stone.id}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{stone.stockNumber}</h3>
                  <p className="text-sm text-gray-600">
                    {stone.stoneType} - {stone.caratWeight} ct
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                  {stone.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600">Shape</p>
                  <p className="font-semibold text-gray-900">{stone.shape}</p>
                </div>
                <div>
                  <p className="text-gray-600">Color</p>
                  <p className="font-semibold text-gray-900">{stone.color}</p>
                </div>
                {stone.origin && (
                  <div className="col-span-2">
                    <p className="text-gray-600">Origin</p>
                    <p className="font-semibold text-gray-900">{stone.origin}</p>
                  </div>
                )}
                {stone.pricePerCarat && (
                  <div className="col-span-2">
                    <p className="text-gray-600">Total Price</p>
                    <p className="text-lg font-bold text-gray-900">
                      ₹{stone.totalPrice?.toLocaleString('en-IN')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
