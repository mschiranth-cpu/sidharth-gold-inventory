/**
 * ============================================
 * FACTORY ITEM DETAIL PAGE
 * ============================================
 */

import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getFactoryItemById } from '../../services/factory.service';
import Button from '../../components/common/Button';
import { formatIstDate } from '../../lib/dateUtils';

export default function FactoryItemDetailPage() {
  const { itemId } = useParams<{ itemId: string }>();

  const { data: item, isLoading } = useQuery({
    queryKey: ['factory-item', itemId],
    queryFn: () => getFactoryItemById(itemId!),
    enabled: !!itemId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <p className="text-gray-500 text-lg">Item not found</p>
            <Link to="/app/inventory/factory" className="mt-4 inline-block">
              <Button variant="primary">Back to Factory Inventory</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const stockStatus =
    item.currentStock < (item.minStock || 0)
      ? 'LOW'
      : item.currentStock > (item.maxStock || Infinity)
      ? 'HIGH'
      : 'NORMAL';

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link
            to="/app/inventory/factory"
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
            Back to Factory Inventory
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">{item.name}</h1>
          <p className="text-gray-600">{item.itemCode}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Item Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Category</p>
                  <p className="font-semibold text-gray-900">{item.category?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Unit</p>
                  <p className="font-semibold text-gray-900">{item.unit}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Current Stock</p>
                  <p
                    className={`text-2xl font-bold ${
                      stockStatus === 'LOW'
                        ? 'text-red-600'
                        : stockStatus === 'HIGH'
                        ? 'text-amber-600'
                        : 'text-green-600'
                    }`}
                  >
                    {item.currentStock}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Min Stock</p>
                  <p className="font-semibold text-gray-900">{item.minStock || '-'}</p>
                </div>
                {item.location && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="font-semibold text-gray-900">{item.location}</p>
                  </div>
                )}
                {item.description && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Description</p>
                    <p className="text-gray-900">{item.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Transactions */}
            {item.transactions && item.transactions.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Transactions</h2>
                <div className="space-y-3">
                  {item.transactions.slice(0, 10).map((txn: any) => (
                    <div key={txn.id} className="p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{txn.transactionType}</p>
                          <p className="text-sm text-gray-600">Quantity: {txn.quantity}</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          {formatIstDate(txn.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4">Stock Status</h3>
              <div
                className={`p-4 rounded-xl ${
                  stockStatus === 'LOW'
                    ? 'bg-red-50 border border-red-200'
                    : stockStatus === 'HIGH'
                    ? 'bg-amber-50 border border-amber-200'
                    : 'bg-green-50 border border-green-200'
                }`}
              >
                <p
                  className={`text-sm font-semibold ${
                    stockStatus === 'LOW'
                      ? 'text-red-800'
                      : stockStatus === 'HIGH'
                      ? 'text-amber-800'
                      : 'text-green-800'
                  }`}
                >
                  {stockStatus === 'LOW'
                    ? '⚠️ Low Stock'
                    : stockStatus === 'HIGH'
                    ? '📦 Overstocked'
                    : '✅ Normal Stock'}
                </p>
              </div>
            </div>

            {item.isEquipment && item.maintenanceLogs && item.maintenanceLogs.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4">Maintenance History</h3>
                <div className="space-y-2">
                  {item.maintenanceLogs.slice(0, 5).map((log: any) => (
                    <div key={log.id} className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-sm font-semibold text-gray-900">{log.maintenanceType}</p>
                      <p className="text-xs text-gray-600">
                        {formatIstDate(log.performedAt)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Button variant="primary" size="lg" className="w-full">
                Issue Item
              </Button>
              <Button variant="secondary" size="lg" className="w-full">
                Add Stock
              </Button>
              {item.isEquipment && (
                <Button variant="outline" size="lg" className="w-full">
                  Log Maintenance
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
