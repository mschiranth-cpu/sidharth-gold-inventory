/**
 * ============================================
 * METAL INVENTORY REPORT PAGE
 * ============================================
 */

import { useQuery } from '@tanstack/react-query';
import { getMetalStockSummary, getAllMetalTransactions } from '../../services/metal.service';
import Button from '../../components/common/Button';

export default function MetalInventoryReportPage() {
  const { data: summary = [], isLoading: summaryLoading } = useQuery({
    queryKey: ['metal-stock-summary-report'],
    queryFn: getMetalStockSummary,
  });

  const { data: transactions = [], isLoading: txnLoading } = useQuery({
    queryKey: ['metal-transactions-report'],
    queryFn: () => getAllMetalTransactions({}),
  });

  const totalGrossWeight = summary.reduce((sum: number, s: any) => sum + s.totalGrossWeight, 0);
  const totalPureWeight = summary.reduce((sum: number, s: any) => sum + s.totalPureWeight, 0);

  const purchases = transactions.filter((t: any) => t.transactionType === 'PURCHASE');
  const issues = transactions.filter((t: any) => t.transactionType === 'ISSUE_TO_DEPARTMENT');
  const wastage = transactions.filter((t: any) => t.transactionType === 'WASTAGE');

  if (summaryLoading || txnLoading) {
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Metal Inventory Report</h1>
            <p className="text-gray-600">Comprehensive metal inventory analysis</p>
          </div>
          <Button variant="primary">Export Report</Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Total Gross Weight</p>
            <p className="text-2xl font-bold text-gray-900">{totalGrossWeight.toFixed(2)}g</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Total Pure Weight</p>
            <p className="text-2xl font-bold text-gray-900">{totalPureWeight.toFixed(2)}g</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Total Purchases</p>
            <p className="text-3xl font-bold text-green-600">{purchases.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Total Issues</p>
            <p className="text-3xl font-bold text-blue-600">{issues.length}</p>
          </div>
        </div>

        {/* Stock by Metal Type and Purity */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Stock by Metal Type & Purity</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {summary.map((item: any, index: number) => (
              <div
                key={index}
                className="p-4 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-200"
              >
                <h3 className="font-bold text-gray-900 mb-2">
                  {item.metalType} ({item.purity}K)
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gross Weight</span>
                    <span className="font-semibold text-gray-900">
                      {item.totalGrossWeight.toFixed(2)}g
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pure Weight</span>
                    <span className="font-semibold text-gray-900">
                      {item.totalPureWeight.toFixed(2)}g
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Transaction Summary */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Transaction Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-green-50 rounded-xl border border-green-200">
              <p className="text-sm text-gray-600 mb-1">Purchases</p>
              <p className="text-3xl font-bold text-green-600">{purchases.length}</p>
              <p className="text-xs text-gray-500 mt-2">
                Total:{' '}
                {purchases.reduce((sum: number, p: any) => sum + p.grossWeight, 0).toFixed(2)}g
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <p className="text-sm text-gray-600 mb-1">Issues</p>
              <p className="text-3xl font-bold text-blue-600">{issues.length}</p>
              <p className="text-xs text-gray-500 mt-2">
                Total: {issues.reduce((sum: number, i: any) => sum + i.grossWeight, 0).toFixed(2)}g
              </p>
            </div>
            <div className="p-4 bg-red-50 rounded-xl border border-red-200">
              <p className="text-sm text-gray-600 mb-1">Wastage</p>
              <p className="text-3xl font-bold text-red-600">{wastage.length}</p>
              <p className="text-xs text-gray-500 mt-2">
                Total: {wastage.reduce((sum: number, w: any) => sum + w.grossWeight, 0).toFixed(2)}g
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
