/**
 * ============================================
 * EMPLOYEE LOANS PAGE
 * ============================================
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createEmployeeLoan } from '../../services/payroll.service';
import Button from '../../components/common/Button';

export default function EmployeeLoansPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    userId: '',
    loanAmount: 0,
    interestRate: 0,
    tenure: 12,
    emiAmount: 0,
    reason: '',
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => createEmployeeLoan(data.userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-loans'] });
      setShowForm(false);
      setFormData({ userId: '', loanAmount: 0, interestRate: 0, tenure: 12, emiAmount: 0, reason: '' });
    },
  });

  const calculateEMI = () => {
    if (formData.loanAmount > 0 && formData.tenure > 0) {
      const principal = formData.loanAmount;
      const rate = (formData.interestRate || 0) / 100 / 12;
      const tenure = formData.tenure;

      if (rate === 0) {
        return principal / tenure;
      }

      const emi =
        (principal * rate * Math.pow(1 + rate, tenure)) / (Math.pow(1 + rate, tenure) - 1);
      return emi;
    }
    return 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emi = calculateEMI();
    createMutation.mutate({
      ...formData,
      emiAmount: emi,
    });
  };

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Employee Loans</h1>
            <p className="text-gray-600">Manage employee loans</p>
          </div>
          <Button variant="primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Give Loan'}
          </Button>
        </div>

        {showForm && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Give Loan</h2>
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
                    Loan Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={formData.loanAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, loanAmount: parseFloat(e.target.value) })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Interest Rate (% p.a.)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.interestRate}
                    onChange={(e) =>
                      setFormData({ ...formData, interestRate: parseFloat(e.target.value) })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tenure (months) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.tenure}
                    onChange={(e) => setFormData({ ...formData, tenure: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Reason</label>
                  <textarea
                    rows={2}
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {formData.loanAmount > 0 && formData.tenure > 0 && (
                <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                  <p className="text-sm text-gray-700 mb-1">Monthly EMI</p>
                  <p className="text-3xl font-bold text-green-600">
                    ₹{calculateEMI().toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-gray-600 mt-2">
                    Total Repayment: ₹
                    {(calculateEMI() * formData.tenure).toLocaleString('en-IN', {
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              )}

              <Button type="submit" variant="primary" isLoading={createMutation.isPending}>
                Give Loan
              </Button>
            </form>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Active Loans</h2>
          <p className="text-gray-500 text-center py-8">No active loans</p>
        </div>
      </div>
    </div>
  );
}
