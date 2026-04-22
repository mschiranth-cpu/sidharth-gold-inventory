/**
 * ============================================
 * RECEIVE METAL PAGE
 * ============================================
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createMetalTransaction } from '../../services/metal.service';
import Button from '../../components/common/Button';
import LiveMetalRatesCard from '../../components/LiveMetalRatesCard';

export default function ReceiveMetalPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    metalType: 'GOLD',
    purity: 24,
    form: 'BAR',
    grossWeight: 0,
    rate: 0,
    supplierName: '',
    referenceNumber: '',
    notes: '',
  });

  const createMutation = useMutation({
    mutationFn: createMetalTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metal-stock'] });
      queryClient.invalidateQueries({ queryKey: ['metal-stock-summary'] });
      navigate('/app/inventory/metal');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      transactionType: 'PURCHASE',
      metalType: formData.metalType,
      purity: formData.purity,
      form: formData.form,
      grossWeight: formData.grossWeight,
      rate: formData.rate,
      notes: formData.notes,
      referenceNumber: formData.referenceNumber,
    });
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Receive Metal</h1>
          <p className="text-gray-600">Record metal received from supplier</p>
        </div>

        {/* Live market rates — click "Use this rate" to auto-fill */}
        <LiveMetalRatesCard
          selectedMetal={formData.metalType as 'GOLD' | 'SILVER' | 'PLATINUM' | 'PALLADIUM'}
          selectedPurity={formData.purity}
          onUseRate={(rate) => setFormData((prev) => ({ ...prev, rate }))}
        />

        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          {createMutation.isError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              Failed to record transaction
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Metal Type *
                </label>
                <select
                  required
                  value={formData.metalType}
                  onChange={(e) => setFormData({ ...formData, metalType: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="GOLD">Gold</option>
                  <option value="SILVER">Silver</option>
                  <option value="PLATINUM">Platinum</option>
                  <option value="PALLADIUM">Palladium</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Purity (Karat) *
                </label>
                <select
                  required
                  value={formData.purity}
                  onChange={(e) => setFormData({ ...formData, purity: parseFloat(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="24">24K</option>
                  <option value="22">22K</option>
                  <option value="18">18K</option>
                  <option value="14">14K</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Form *</label>
                <select
                  required
                  value={formData.form}
                  onChange={(e) => setFormData({ ...formData, form: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="BAR">Bar</option>
                  <option value="WIRE">Wire</option>
                  <option value="SHEET">Sheet</option>
                  <option value="GRAIN">Grain</option>
                  <option value="SCRAP">Scrap</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Gross Weight (grams) *
                </label>
                <input
                  type="number"
                  required
                  step="0.001"
                  value={formData.grossWeight}
                  onChange={(e) =>
                    setFormData({ ...formData, grossWeight: parseFloat(e.target.value) })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Rate per Gram (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Reference Number
                </label>
                <input
                  type="text"
                  value={formData.referenceNumber}
                  onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Invoice/Bill number"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Any additional notes..."
              />
            </div>

            {/* Calculated Pure Weight */}
            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200">
              <p className="text-sm text-gray-700 mb-1">Calculated Pure Weight:</p>
              <p className="text-2xl font-bold text-indigo-900">
                {((formData.grossWeight * formData.purity) / 24).toFixed(3)} grams
              </p>
            </div>

            <div className="flex gap-4 pt-6">
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={() => navigate('/app/inventory/metal')}
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
                Record Receipt
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
