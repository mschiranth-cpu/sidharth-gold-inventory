/**
 * ============================================
 * METAL STOCK REGISTER PAGE
 * ============================================
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllMetalStock } from '../../services/metal.service';
import { Link } from 'react-router-dom';
import Button from '../../components/common/Button';

export default function MetalStockPage() {
  const [filters, setFilters] = useState({ metalType: '', purity: 0 });

  const { data: stocks = [], isLoading } = useQuery({
    queryKey: ['metal-stock', filters],
    queryFn: () => getAllMetalStock(filters.metalType ? filters : undefined),
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Metal Stock Register</h1>
            <p className="text-gray-600">View all metal inventory</p>
          </div>
          <Link to="/app/inventory/metal">
            <Button variant="secondary">Back to Dashboard</Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100 mb-6">
          <div className="flex gap-4">
            <select
              value={filters.metalType}
              onChange={(e) => setFilters({ ...filters, metalType: e.target.value })}
              className="px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Metals</option>
              <option value="GOLD">Gold</option>
              <option value="SILVER">Silver</option>
              <option value="PLATINUM">Platinum</option>
            </select>
          </div>
        </div>

        {/* Stock Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Metal Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Purity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Form
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gross Weight
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pure Weight
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stocks.map((stock: any) => (
                <tr key={stock.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-semibold text-gray-900">{stock.metalType}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">{stock.purity}K</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">{stock.form}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                    {stock.grossWeight.toFixed(2)}g
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                    {stock.pureWeight.toFixed(2)}g
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {stock.location || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
