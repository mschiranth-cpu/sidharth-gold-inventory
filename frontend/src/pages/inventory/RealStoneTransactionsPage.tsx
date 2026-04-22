/**
 * ============================================
 * REAL STONE TRANSACTIONS PAGE
 * ============================================
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createRealStone } from '../../services/stone.service';
import Button from '../../components/common/Button';

export default function RealStoneTransactionsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    stoneId: '',
    transactionType: 'ISSUE',
    orderId: '',
    notes: '',
  });

  const createMutation = useMutation({
    mutationFn: createRealStone,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['real-stones'] });
      navigate('/app/inventory/real-stones');
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Real Stone Transactions</h1>
          <p className="text-gray-600">Issue or return real stones</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Stone ID *</label>
                <input
                  type="text"
                  required
                  value={formData.stoneId}
                  onChange={(e) => setFormData({ ...formData, stoneId: e.target.value })}
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
                  <option value="SALE">Sale</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Order ID</label>
                <input
                  type="text"
                  value={formData.orderId}
                  onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
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

            <div className="flex gap-4 pt-6">
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={() => navigate('/app/inventory/real-stones')}
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
