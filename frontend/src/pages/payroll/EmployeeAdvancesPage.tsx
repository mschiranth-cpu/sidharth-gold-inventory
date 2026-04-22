/**
 * ============================================
 * EMPLOYEE ADVANCES PAGE
 * ============================================
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createEmployeeAdvance } from '../../services/payroll.service';
import Button from '../../components/common/Button';

export default function EmployeeAdvancesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    userId: '',
    amount: 0,
    reason: '',
    deductionPerMonth: 0,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => createEmployeeAdvance(data.userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-advances'] });
      setShowForm(false);
      setFormData({ userId: '', amount: 0, reason: '', deductionPerMonth: 0 });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Employee Advances</h1>
            <p className="text-gray-600">Manage salary advances</p>
          </div>
          <Button variant="primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Give Advance'}
          </Button>
        </div>

        {showForm && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Give Advance</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Employee ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.userId}
                    onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: parseFloat(e.target.value) })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Monthly Deduction (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={formData.deductionPerMonth}
                    onChange={(e) =>
                      setFormData({ ...formData, deductionPerMonth: parseFloat(e.target.value) })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Reason</label>
                  <input
                    type="text"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {formData.amount > 0 && formData.deductionPerMonth > 0 && (
                <div className="p-4 bg-blue-50 rounded-xl">
                  <p className="text-sm text-blue-700">
                    Will be recovered in {Math.ceil(formData.amount / formData.deductionPerMonth)}{' '}
                    months
                  </p>
                </div>
              )}

              <Button type="submit" variant="primary" isLoading={createMutation.isPending}>
                Give Advance
              </Button>
            </form>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Active Advances</h2>
          <p className="text-gray-500 text-center py-8">No active advances</p>
        </div>
      </div>
    </div>
  );
}
