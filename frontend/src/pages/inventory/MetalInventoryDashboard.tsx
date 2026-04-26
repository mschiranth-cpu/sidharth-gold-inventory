/**
 * ============================================
 * METAL INVENTORY DASHBOARD
 * ============================================
 */

import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getMetalStockSummary } from '../../services/metal.service';
import Button from '../../components/common/Button';
import LiveMetalRatesCard from '../../components/LiveMetalRatesCard';

export default function MetalInventoryDashboard() {
  const { data: summary = [], isLoading: summaryLoading } = useQuery({
    queryKey: ['metal-stock-summary'],
    queryFn: getMetalStockSummary,
  });

  return (
    <div className="p-6 bg-gradient-to-b from-pearl to-white min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl bg-onyx-gradient text-pearl shadow-onyx mb-8 p-6 md:p-8">
          <div className="absolute inset-0 bg-gold-leaf-gradient opacity-10 pointer-events-none" />
          <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-champagne-300 font-medium mb-2">Inventory · Precious Metal</p>
            <h1 className="font-display text-3xl md:text-4xl font-semibold text-pearl mb-2">Metal Inventory</h1>
            <p className="text-champagne-100/80 text-sm">Track gold, silver, platinum &amp; palladium stock at a glance.</p>
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
        </div>

        {/* Live Market Rates */}
        <LiveMetalRatesCard />

        {/* Stock Summary */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-champagne-100 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-onyx-900">Stock Summary</h2>
            <Link
              to="/app/inventory/metal/stock"
              className="text-champagne-700 hover:text-champagne-800 font-semibold text-sm"
            >
              View Details →
            </Link>
          </div>
          {summaryLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4 bg-pearl rounded-xl border border-champagne-200 animate-pulse">
                  <div className="h-4 w-24 bg-champagne-200 rounded mb-3" />
                  <div className="h-7 w-32 bg-champagne-200 rounded mb-2" />
                  <div className="h-3 w-20 bg-champagne-100 rounded" />
                </div>
              ))}
            </div>
          ) : summary.length === 0 ? (
            <p className="text-onyx-400 text-center py-8">No stock entries yet. Receive metal to start tracking inventory.</p>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {summary.map((item: any, index: number) => (
              <div key={index} className="p-4 bg-pearl rounded-xl border border-champagne-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-onyx-700">
                    {item.metalType} ({item.purity}K)
                  </p>
                  <div className="w-10 h-10 rounded-xl bg-champagne-100 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-champagne-700"
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
                <p className="text-2xl font-bold text-onyx-900">
                  {item.totalGrossWeight.toFixed(2)}g
                </p>
                <p className="text-sm text-onyx-500">Pure: {item.totalPureWeight.toFixed(2)}g</p>
              </div>
            ))}
          </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/app/inventory/metal/transactions"
            className="bg-white rounded-2xl shadow-lg p-6 border border-champagne-100 hover:border-champagne-400 hover:shadow-xl transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-champagne-100 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-champagne-700"
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
                <h3 className="font-bold text-onyx-900">Transactions</h3>
                <p className="text-sm text-onyx-500">View all transactions</p>
              </div>
            </div>
          </Link>

          <Link
            to="/app/inventory/metal/melting"
            className="bg-white rounded-2xl shadow-lg p-6 border border-champagne-100 hover:border-champagne-400 hover:shadow-xl transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-champagne-100 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-champagne-700"
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
                <h3 className="font-bold text-onyx-900">Melting Batches</h3>
                <p className="text-sm text-onyx-500">Track melting records</p>
              </div>
            </div>
          </Link>

          <Link
            to="/app/inventory/metal/rates"
            className="bg-white rounded-2xl shadow-lg p-6 border border-champagne-100 hover:border-champagne-400 hover:shadow-xl transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-champagne-100 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-accent-emerald"
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
                <h3 className="font-bold text-onyx-900">Rate Management</h3>
                <p className="text-sm text-onyx-500">Update metal rates</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
