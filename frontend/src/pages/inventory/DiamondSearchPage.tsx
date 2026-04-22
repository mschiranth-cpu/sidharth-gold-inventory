/**
 * ============================================
 * DIAMOND SEARCH PAGE
 * ============================================
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllDiamonds } from '../../services/diamond.service';
import { Link } from 'react-router-dom';
import Button from '../../components/common/Button';

export default function DiamondSearchPage() {
  const [filters, setFilters] = useState({
    shape: '',
    color: '',
    clarity: '',
    minCarat: '',
    maxCarat: '',
    minPrice: '',
    maxPrice: '',
  });

  const { data: diamonds = [], isLoading } = useQuery({
    queryKey: ['diamonds-search', filters],
    queryFn: () => getAllDiamonds(filters),
  });

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Diamond Search</h1>
          <p className="text-gray-600">Advanced search with 4C parameters</p>
        </div>

        {/* Advanced Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Filters</h3>
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

            <Button variant="primary" className="w-full">
              Search
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <input
              type="number"
              placeholder="Min Carat"
              value={filters.minCarat}
              onChange={(e) => setFilters({ ...filters, minCarat: e.target.value })}
              className="px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="number"
              placeholder="Max Carat"
              value={filters.maxCarat}
              onChange={(e) => setFilters({ ...filters, maxCarat: e.target.value })}
              className="px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="number"
              placeholder="Min Price"
              value={filters.minPrice}
              onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
              className="px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="number"
              placeholder="Max Price"
              value={filters.maxPrice}
              onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
              className="px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-gray-600">{diamonds.length} diamonds found</p>
              <Link to="/app/inventory/diamonds">
                <Button variant="secondary" size="sm">
                  Back to List
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {diamonds.map((diamond: any) => (
                <Link
                  key={diamond.id}
                  to={`/inventory/diamonds/${diamond.id}`}
                  className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:border-indigo-300 hover:shadow-xl transition-all"
                >
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{diamond.stockNumber}</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600">Carat</p>
                      <p className="font-semibold text-gray-900">{diamond.caratWeight}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Color</p>
                      <p className="font-semibold text-gray-900">{diamond.color}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Clarity</p>
                      <p className="font-semibold text-gray-900">{diamond.clarity}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Shape</p>
                      <p className="font-semibold text-gray-900">{diamond.shape}</p>
                    </div>
                  </div>
                  {diamond.pricePerCarat && (
                    <div className="mt-4 p-3 bg-green-50 rounded-xl">
                      <p className="text-sm text-gray-700">Total Price</p>
                      <p className="text-xl font-bold text-green-600">
                        ₹{diamond.totalPrice?.toLocaleString('en-IN')}
                      </p>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
