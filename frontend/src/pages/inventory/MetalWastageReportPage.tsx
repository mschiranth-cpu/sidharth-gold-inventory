/**
 * ============================================
 * METAL WASTAGE REPORT PAGE
 * ============================================
 */

import { useQuery } from '@tanstack/react-query';
import { getMeltingBatches } from '../../services/metal.service';

export default function MetalWastageReportPage() {
  const { data: batches = [], isLoading } = useQuery({
    queryKey: ['melting-batches-wastage'],
    queryFn: getMeltingBatches,
  });

  const avgWastage =
    batches.length > 0
      ? batches.reduce((sum: number, b: any) => sum + b.wastagePercent, 0) / batches.length
      : 0;

  const totalWastageWeight = batches.reduce((sum: number, b: any) => sum + b.wastageWeight, 0);

  const highWastageBatches = batches.filter((b: any) => b.wastagePercent > 2);

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Metal Wastage Report</h1>
          <p className="text-gray-600">Analyze melting wastage patterns</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Total Batches</p>
            <p className="text-3xl font-bold text-gray-900">{batches.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Avg Wastage %</p>
            <p
              className={`text-3xl font-bold ${avgWastage > 2 ? 'text-red-600' : 'text-green-600'}`}
            >
              {avgWastage.toFixed(2)}%
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Total Wastage</p>
            <p className="text-2xl font-bold text-red-600">{totalWastageWeight.toFixed(2)}g</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">High Wastage</p>
            <p className="text-3xl font-bold text-amber-600">{highWastageBatches.length}</p>
          </div>
        </div>

        {/* Wastage Analysis */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Wastage Analysis</h2>
          <div className="space-y-4">
            {batches.map((batch: any) => (
              <div
                key={batch.id}
                className={`p-4 rounded-xl border ${
                  batch.wastagePercent > 2
                    ? 'bg-red-50 border-red-200'
                    : batch.wastagePercent > 1
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-green-50 border-green-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-gray-900">{batch.batchNumber}</h3>
                    <p className="text-sm text-gray-600">
                      {new Date(batch.meltedAt).toLocaleDateString('en-IN')} by{' '}
                      {batch.meltedBy?.name}
                    </p>
                  </div>
                  <span
                    className={`px-4 py-2 rounded-xl text-sm font-semibold ${
                      batch.wastagePercent > 2
                        ? 'bg-red-100 text-red-800'
                        : batch.wastagePercent > 1
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {batch.wastagePercent.toFixed(2)}%
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Input</p>
                    <p className="font-semibold text-gray-900">
                      {batch.totalInputWeight.toFixed(2)}g
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Output</p>
                    <p className="font-semibold text-gray-900">{batch.outputWeight.toFixed(2)}g</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Wastage</p>
                    <p className="font-semibold text-red-600">{batch.wastageWeight.toFixed(2)}g</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Output Purity</p>
                    <p className="font-semibold text-gray-900">{batch.outputPurity}K</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
