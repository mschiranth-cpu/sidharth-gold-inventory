/**
 * ============================================
 * FACTORY REORDER PAGE
 * ============================================
 */

import { useQuery } from '@tanstack/react-query';
import { getAllFactoryItems } from '../../services/factory.service';
import Button from '../../components/common/Button';

export default function FactoryReorderPage() {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['factory-items-reorder'],
    queryFn: () => getAllFactoryItems({}),
  });

  const lowStockItems = items.filter(
    (item: any) => item.minStock && item.currentStock < item.minStock
  );

  const reorderItems = items.filter(
    (item: any) => item.reorderQty && item.currentStock < item.reorderQty
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
          <p className="text-gray-600">Items below minimum stock or reorder level</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Total Items</p>
            <p className="text-3xl font-bold text-gray-900">{items.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Low Stock</p>
            <p className="text-3xl font-bold text-red-600">{lowStockItems.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Reorder Required</p>
            <p className="text-3xl font-bold text-amber-600">{reorderItems.length}</p>
          </div>
        </div>

        {/* Low Stock Items */}
        {lowStockItems.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Low Stock Items</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lowStockItems.map((item: any) => (
                <div key={item.id} className="p-4 bg-red-50 rounded-xl border-2 border-red-200">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-600">{item.itemCode}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                      ⚠️ Low
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current</span>
                      <span className="font-bold text-red-600">
                        {item.currentStock} {item.unit}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Min Stock</span>
                      <span className="font-semibold text-gray-900">
                        {item.minStock} {item.unit}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shortage</span>
                      <span className="font-bold text-red-600">
                        {(item.minStock - item.currentStock).toFixed(2)} {item.unit}
                      </span>
                    </div>
                  </div>
                  <Button variant="primary" size="sm" className="w-full mt-3">
                    Create PO
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reorder Items */}
        {reorderItems.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Reorder Required</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reorderItems.map((item: any) => (
                <div key={item.id} className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <h3 className="font-bold text-gray-900 mb-2">{item.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{item.itemCode}</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current</span>
                      <span className="font-semibold text-gray-900">
                        {item.currentStock} {item.unit}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reorder Qty</span>
                      <span className="font-semibold text-amber-700">
                        {item.reorderQty} {item.unit}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {lowStockItems.length === 0 && reorderItems.length === 0 && (
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
            <p className="text-gray-500 text-lg">All items are adequately stocked</p>
          </div>
        )}
      </div>
    </div>
  );
}
