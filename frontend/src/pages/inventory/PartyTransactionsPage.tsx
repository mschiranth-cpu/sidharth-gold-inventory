/**
 * ============================================
 * PARTY TRANSACTIONS PAGE
 * ============================================
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { createPartyMetalTransaction, getAllParties } from '../../services/party.service';
import Button from '../../components/common/Button';

export default function PartyTransactionsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    partyId: '',
    transactionType: 'RETURNED',
    metalType: 'GOLD',
    grossWeight: 0,
    declaredPurity: 22,
    testedPurity: 0,
    orderId: '',
    voucherNumber: '',
    notes: '',
  });

  const { data: parties = [] } = useQuery({
    queryKey: ['parties'],
    queryFn: () => getAllParties({}),
  });

  const createMutation = useMutation({
    mutationFn: createPartyMetalTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['party-transactions'] });
      navigate('/app/inventory/parties');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      testedPurity: formData.testedPurity || undefined,
    });
  };

  const purityToUse = formData.testedPurity || formData.declaredPurity;
  const pureWeight = (formData.grossWeight * purityToUse) / 24;

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Party Metal Transaction</h1>
          <p className="text-gray-600">Return metal to party or issue for order</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Party *
                </label>
                <select
                  required
                  value={formData.partyId}
                  onChange={(e) => setFormData({ ...formData, partyId: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select party</option>
                  {parties.map((party: any) => (
                    <option key={party.id} value={party.id}>
                      {party.name}
                    </option>
                  ))}
                </select>
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
                  <option value="RECEIVED">Received from Party</option>
                  <option value="RETURNED">Returned to Party</option>
                  <option value="ISSUED_FOR_ORDER">Issued for Order</option>
                  <option value="WASTAGE_DEBIT">Wastage Debit</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Metal Type *
                </label>
                <select
                  required
                  value={formData.metalType}
                  onChange={(e) => setFormData({ ...formData, metalType: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="GOLD">Gold</option>
                  <option value="SILVER">Silver</option>
                  <option value="PLATINUM">Platinum</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Gross Weight (g) *
                </label>
                <input
                  type="number"
                  required
                  step="0.001"
                  value={formData.grossWeight}
                  onChange={(e) =>
                    setFormData({ ...formData, grossWeight: parseFloat(e.target.value) })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Declared Purity (K) *
                </label>
                <select
                  required
                  value={formData.declaredPurity}
                  onChange={(e) =>
                    setFormData({ ...formData, declaredPurity: parseFloat(e.target.value) })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="24">24K</option>
                  <option value="22">22K</option>
                  <option value="18">18K</option>
                  <option value="14">14K</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tested Purity (K)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.testedPurity}
                  onChange={(e) =>
                    setFormData({ ...formData, testedPurity: parseFloat(e.target.value) })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                  placeholder="Leave blank if not tested"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Voucher Number *
                </label>
                <input
                  type="text"
                  required
                  value={formData.voucherNumber}
                  onChange={(e) => setFormData({ ...formData, voucherNumber: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Order ID (if applicable)
                </label>
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

            <div className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-700">Gross Weight</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formData.grossWeight.toFixed(3)}g
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-700">Purity Used</p>
                  <p className="text-2xl font-bold text-indigo-900">{purityToUse}K</p>
                </div>
                <div>
                  <p className="text-sm text-gray-700">Pure Weight</p>
                  <p className="text-2xl font-bold text-purple-900">{pureWeight.toFixed(3)}g</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={() => navigate('/app/inventory/parties')}
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
