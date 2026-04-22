/**
 * ============================================
 * METAL TRANSACTIONS PAGE
 * ============================================
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllMetalTransactions } from '../../services/metal.service';
import { Link } from 'react-router-dom';
import Button from '../../components/common/Button';

export default function MetalTransactionsPage() {
  const [filters, setFilters] = useState({ metalType: '', transactionType: '' });

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['metal-transactions', filters],
    queryFn: () => getAllMetalTransactions(filters),
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Metal Transactions</h1>
            <p className="text-gray-600">View all metal transactions</p>
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
            <select
              value={filters.transactionType}
              onChange={(e) => setFilters({ ...filters, transactionType: e.target.value })}
              className="px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Types</option>
              <option value="PURCHASE">Purchase</option>
              <option value="SALE">Sale</option>
              <option value="ISSUE_TO_DEPARTMENT">Issue to Department</option>
              <option value="RETURN_FROM_DEPARTMENT">Return from Department</option>
              <option value="WASTAGE">Wastage</option>
            </select>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Metal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Purity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Weight
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Created By
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((txn: any) => (
                  <tr key={txn.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(txn.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          txn.transactionType === 'PURCHASE'
                            ? 'bg-green-100 text-green-800'
                            : txn.transactionType === 'SALE'
                            ? 'bg-blue-100 text-blue-800'
                            : txn.transactionType === 'WASTAGE'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {txn.transactionType.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                      {txn.metalType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">{txn.purity}K</td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                      {txn.grossWeight.toFixed(2)}g
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                      {txn.totalValue ? `₹${txn.totalValue.toLocaleString('en-IN')}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {txn.createdBy?.name || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
