/**
 * ============================================
 * MELTING BATCH PAGE
 * ============================================
 */

import { useQuery } from '@tanstack/react-query';
import { getMeltingBatches } from '../../services/metal.service';
import { Link } from 'react-router-dom';
import Button from '../../components/common/Button';

export default function MeltingBatchPage() {
  const { data: batches = [], isLoading } = useQuery({
    queryKey: ['melting-batches'],
    queryFn: getMeltingBatches,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-champagne-700"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-onyx-900 mb-2">Melting Batches</h1>
            <p className="text-onyx-500">Track melting records and wastage</p>
          </div>
          <div className="flex gap-3">
            <Button variant="primary">Create Batch</Button>
            <Link to="/app/inventory/metal">
              <Button variant="secondary">Back to Dashboard</Button>
            </Link>
          </div>
        </div>

        {/* Batches Grid */}
        <div className="grid grid-cols-1 gap-6">
          {batches.map((batch: any) => (
            <div
              key={batch.id}
              className="bg-white rounded-2xl shadow-lg p-6 border border-champagne-100"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-onyx-900">{batch.batchNumber}</h3>
                  <p className="text-sm text-onyx-500">
                    Melted by: {batch.meltedBy?.name} on{' '}
                    {new Date(batch.meltedAt).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <span
                  className={`px-4 py-2 rounded-xl text-sm font-semibold ${
                    batch.wastagePercent > 2
                      ? 'bg-red-100 text-accent-ruby'
                      : batch.wastagePercent > 1
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-green-100 text-accent-emerald'
                  }`}
                >
                  Wastage: {batch.wastagePercent.toFixed(2)}%
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-pearl rounded-xl">
                <div>
                  <p className="text-sm text-onyx-500">Input Weight</p>
                  <p className="text-lg font-bold text-onyx-900">
                    {batch.totalInputWeight.toFixed(2)}g
                  </p>
                </div>
                <div>
                  <p className="text-sm text-onyx-500">Output Weight</p>
                  <p className="text-lg font-bold text-onyx-900">
                    {batch.outputWeight.toFixed(2)}g
                  </p>
                </div>
                <div>
                  <p className="text-sm text-onyx-500">Output Purity</p>
                  <p className="text-lg font-bold text-onyx-900">{batch.outputPurity}K</p>
                </div>
                <div>
                  <p className="text-sm text-onyx-500">Wastage</p>
                  <p className="text-lg font-bold text-accent-ruby">
                    {batch.wastageWeight.toFixed(2)}g
                  </p>
                </div>
              </div>

              {batch.notes && (
                <div className="mt-4 p-3 bg-champagne-50 rounded-xl">
                  <p className="text-sm text-onyx-700">{batch.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
