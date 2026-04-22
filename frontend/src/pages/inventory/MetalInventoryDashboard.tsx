/**
 * ============================================
 * METAL INVENTORY DASHBOARD
 * ============================================
 */

import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getMetalStockSummary, getCurrentMetalRates } from '../../services/metal.service';
import Button from '../../components/common/Button';

export default function MetalInventoryDashboard() {
  const { data: summary = [], isLoading: summaryLoading } = useQuery({
    queryKey: ['metal-stock-summary'],
    queryFn: getMetalStockSummary,
  });

  const { data: rates = [], isLoading: ratesLoading } = useQuery({
    queryKey: ['metal-rates'],
    queryFn: getCurrentMetalRates,
  });

  if (summaryLoading || ratesLoading) {
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Metal Inventory</h1>
            <p className="text-gray-600">Track gold, silver, and platinum stock</p>
          </div>
          <div className="flex gap-3">
            <Link to="/app/inventory/metal/receive">
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
                Receive Metal
              </Button>
            </Link>
            <Link to="/app/inventory/metal/issue">
              <Button variant="secondary">Issue Metal</Button>
            </Link>
          </div>
        </div>

        {/* Current Rates */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Current Gold Rates (INR/gram)</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {rates
              .filter((r) => r.metalType === 'GOLD')
              .map((rate) => (
                <div
                  key={rate.id}
                  className="p-4 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-200"
                >
                  <p className="text-sm text-gray-600 mb-1">{rate.purity}K Gold</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{rate.ratePerGram.toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(rate.effectiveDate).toLocaleDateString('en-IN')}
                  </p>
                </div>
              ))}
          </div>
        </div>

        {/* Stock Summary */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Stock Summary</h2>
            <Link
              to="/app/inventory/metal/stock"
              className="text-indigo-600 hover:text-indigo-700 font-semibold text-sm"
            >
              View Details →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {summary.map((item: any, index: number) => (
              <div key={index} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-700">
                    {item.metalType} ({item.purity}K)
                  </p>
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-indigo-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {item.totalGrossWeight.toFixed(2)}g
                </p>
                <p className="text-sm text-gray-600">Pure: {item.totalPureWeight.toFixed(2)}g</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/app/inventory/metal/transactions"
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:border-indigo-300 hover:shadow-xl transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Transactions</h3>
                <p className="text-sm text-gray-600">View all transactions</p>
              </div>
            </div>
          </Link>

          <Link
            to="/app/inventory/metal/melting"
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:border-indigo-300 hover:shadow-xl transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Melting Batches</h3>
                <p className="text-sm text-gray-600">Track melting records</p>
              </div>
            </div>
          </Link>

          <Link
            to="/app/inventory/metal/rates"
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:border-indigo-300 hover:shadow-xl transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Rate Management</h3>
                <p className="text-sm text-gray-600">Update metal rates</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
