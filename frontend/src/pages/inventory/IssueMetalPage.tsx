/**
 * ============================================
 * ISSUE METAL PAGE
 * ============================================
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createMetalTransaction } from '../../services/metal.service';
import Button from '../../components/common/Button';

export default function IssueMetalPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    metalType: 'GOLD',
    purity: 22,
    form: 'BAR',
    grossWeight: 0,
    departmentId: '',
    workerId: '',
    notes: '',
  });

  const createMutation = useMutation({
    mutationFn: createMetalTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metal-stock'] });
      queryClient.invalidateQueries({ queryKey: ['metal-transactions'] });
      navigate('/app/inventory/metal');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      transactionType: 'ISSUE_TO_DEPARTMENT',
      metalType: formData.metalType,
      purity: formData.purity,
      form: formData.form,
      grossWeight: formData.grossWeight,
      departmentId: formData.departmentId || undefined,
      workerId: formData.workerId || undefined,
      notes: formData.notes,
    });
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Issue Metal</h1>
          <p className="text-gray-600">Issue metal to department or worker</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
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
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Purity *</label>
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
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200">
              <p className="text-sm text-gray-700 mb-1">Pure Weight:</p>
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
                Issue Metal
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
