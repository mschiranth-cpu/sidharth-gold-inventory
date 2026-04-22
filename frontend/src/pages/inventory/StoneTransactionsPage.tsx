/**
 * ============================================
 * STONE TRANSACTIONS PAGE
 * ============================================
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createStonePacketTransaction } from '../../services/stone.service';
import Button from '../../components/common/Button';

export default function StoneTransactionsPage() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    packetId: '',
    transactionType: 'ISSUE',
    quantity: 0,
    unit: 'CARAT',
    orderId: '',
    notes: '',
  });

  const createMutation = useMutation({
    mutationFn: createStonePacketTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stone-packets'] });
      setFormData({
        packetId: '',
        transactionType: 'ISSUE',
        quantity: 0,
        unit: 'CARAT',
        orderId: '',
        notes: '',
      });
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Stone Transactions</h1>
          <p className="text-gray-600">Issue or return stone packets</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Packet ID *
                </label>
                <input
                  type="text"
                  required
                  value={formData.packetId}
                  onChange={(e) => setFormData({ ...formData, packetId: e.target.value })}
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">Unit *</label>
                <select
                  required
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="CARAT">Carat</option>
                  <option value="GRAM">Gram</option>
                  <option value="PIECE">Piece</option>
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

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={createMutation.isPending}
              className="w-full"
            >
              Record Transaction
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
