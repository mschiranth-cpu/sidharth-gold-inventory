/**
 * ============================================
 * FACTORY INVENTORY PAGE
 * ============================================
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllFactoryItems, getAllCategories } from '../../services/factory.service';
import Button from '../../components/common/Button';

export default function FactoryInventoryPage() {
  const [filters, setFilters] = useState({ categoryId: '', isEquipment: false });

  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['factory-items', filters],
    queryFn: () => getAllFactoryItems(filters),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['factory-categories'],
    queryFn: getAllCategories,
  });

  if (itemsLoading) {
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Factory Inventory</h1>
            <p className="text-gray-600">Manage tools, consumables, and equipment</p>
          </div>
          <div className="flex gap-3">
            <Button variant="primary">Add Item</Button>
            <Button variant="secondary">Add Category</Button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100 mb-6">
          <div className="flex gap-4">
            <select
              value={filters.categoryId}
              onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
              className="px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Categories</option>
              {categories.map((cat: any) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 px-4 py-2">
              <input
                type="checkbox"
                checked={filters.isEquipment}
                onChange={(e) => setFilters({ ...filters, isEquipment: e.target.checked })}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">Equipment Only</span>
            </label>
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Item Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Current Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Unit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item: any) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                    {item.itemCode}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">{item.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {item.category?.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`font-semibold ${
                        item.currentStock < (item.minStock || 0)
                          ? 'text-red-600'
                          : item.currentStock < (item.reorderQty || 0)
                          ? 'text-amber-600'
                          : 'text-green-600'
                      }`}
                    >
                      {item.currentStock}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">{item.unit}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.currentStock < (item.minStock || 0) ? (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                        Low Stock
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                        In Stock
                      </span>
                    )}
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
