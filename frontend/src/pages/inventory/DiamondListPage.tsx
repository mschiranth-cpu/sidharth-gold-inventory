/**
 * ============================================
 * DIAMOND LIST PAGE
 * ============================================
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getAllDiamonds } from '../../services/diamond.service';
import Button from '../../components/common/Button';

export default function DiamondListPage() {
  const [filters, setFilters] = useState({ shape: '', color: '', clarity: '', status: 'IN_STOCK' });

  const { data: diamonds = [], isLoading } = useQuery({
    queryKey: ['diamonds', filters],
    queryFn: () => getAllDiamonds(filters),
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Diamond Inventory</h1>
            <p className="text-gray-600">Manage diamond stock with 4C grading</p>
          </div>
          <Button
            variant="primary"
            iconLeft={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            }
          >
            Add Diamond
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={filters.shape}
              onChange={(e) => setFilters({ ...filters, shape: e.target.value })}
              className="px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Shapes</option>
              <option value="ROUND">Round</option>
              <option value="PRINCESS">Princess</option>
              <option value="OVAL">Oval</option>
              <option value="CUSHION">Cushion</option>
            </select>
            <select
              value={filters.color}
              onChange={(e) => setFilters({ ...filters, color: e.target.value })}
              className="px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Colors</option>
              <option value="D">D</option>
              <option value="E">E</option>
              <option value="F">F</option>
              <option value="G">G</option>
              <option value="H">H</option>
            </select>
            <select
              value={filters.clarity}
              onChange={(e) => setFilters({ ...filters, clarity: e.target.value })}
              className="px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Clarity</option>
              <option value="FL">FL</option>
              <option value="IF">IF</option>
              <option value="VVS1">VVS1</option>
              <option value="VVS2">VVS2</option>
              <option value="VS1">VS1</option>
              <option value="VS2">VS2</option>
            </select>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Status</option>
              <option value="IN_STOCK">In Stock</option>
              <option value="ISSUED">Issued</option>
              <option value="SET">Set</option>
            </select>
          </div>
        </div>

        {/* Diamonds Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {diamonds.map((diamond: any) => (
            <div
              key={diamond.id}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:border-indigo-300 hover:shadow-xl transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{diamond.stockNumber}</h3>
                  <p className="text-sm text-gray-600">
                    {diamond.shape} - {diamond.caratWeight} ct
                  </p>
                </div>
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
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                <div>
                  <p className="text-gray-600">Color</p>
                  <p className="font-semibold text-gray-900">{diamond.color}</p>
                </div>
                <div>
                  <p className="text-gray-600">Clarity</p>
                  <p className="font-semibold text-gray-900">{diamond.clarity}</p>
                </div>
                {diamond.cut && (
                  <div>
                    <p className="text-gray-600">Cut</p>
                    <p className="font-semibold text-gray-900">{diamond.cut}</p>
                  </div>
                )}
                {diamond.pricePerCarat && (
                  <div>
                    <p className="text-gray-600">Price/ct</p>
                    <p className="font-semibold text-gray-900">
                      ₹{diamond.pricePerCarat.toLocaleString('en-IN')}
                    </p>
                  </div>
                )}
              </div>

              {diamond.certificationLab && (
                <div className="p-3 bg-blue-50 rounded-xl mb-3">
                  <p className="text-xs text-blue-700 font-semibold">{diamond.certificationLab}</p>
                  {diamond.certNumber && (
                    <p className="text-xs text-blue-600">{diamond.certNumber}</p>
                  )}
                </div>
              )}

              <Link to={`/inventory/diamonds/${diamond.id}`} className="block">
                <Button variant="outline" size="sm" className="w-full">
                  View Details
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
