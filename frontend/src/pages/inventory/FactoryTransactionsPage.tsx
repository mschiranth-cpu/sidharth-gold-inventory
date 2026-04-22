/**
 * ============================================
 * FACTORY TRANSACTIONS PAGE
 * ============================================
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createFactoryItemTransaction } from '../../services/factory.service';
import Button from '../../components/common/Button';

export default function FactoryTransactionsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    itemId: '',
    transactionType: 'ISSUE',
    quantity: 0,
    rate: 0,
    departmentId: '',
    notes: '',
  });

  const createMutation = useMutation({
    mutationFn: createFactoryItemTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['factory-items'] });
      navigate('/app/inventory/factory');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Factory Item Transaction</h1>
          <p className="text-gray-600">Issue or return factory items</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Item ID *</label>
                <input
                  type="text"
                  required
                  value={formData.itemId}
                  onChange={(e) => setFormData({ ...formData, itemId: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Transaction Type *
                </label>
                <select
                  required
                  value={formData.transactionType}
                  onChange={(e) => setFormData({ ...formData, transactionType: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ISSUE">Issue</option>
                  <option value="RETURN">Return</option>
                  <option value="PURCHASE">Purchase</option>
                  <option value="ADJUSTMENT">Adjustment</option>
                  <option value="SCRAP">Scrap</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity *</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: parseFloat(e.target.value) })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Rate (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {formData.quantity > 0 && formData.rate > 0 && (
              <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                <p className="text-sm text-gray-700">Total Value</p>
                <p className="text-2xl font-bold text-green-600">
                  ₹{(formData.quantity * formData.rate).toLocaleString('en-IN')}
                </p>
              </div>
            )}

            <div className="flex gap-4 pt-6">
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={() => navigate('/app/inventory/factory')}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={createMutation.isPending}
                className="flex-1"
              >
                Record Transaction
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
