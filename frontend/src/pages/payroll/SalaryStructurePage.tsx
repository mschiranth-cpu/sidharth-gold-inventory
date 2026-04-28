/**
 * ============================================
 * SALARY STRUCTURE PAGE
 * ============================================
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { createSalaryStructure, getSalaryStructure } from '../../services/payroll.service';
import Button from '../../components/common/Button';

export default function SalaryStructurePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: existingStructure } = useQuery({
    queryKey: ['salary-structure', userId],
    queryFn: () => getSalaryStructure(userId!),
    enabled: !!userId,
  });

  const [formData, setFormData] = useState({
    basicSalary: existingStructure?.basicSalary || 0,
    hra: existingStructure?.hra || 0,
    da: existingStructure?.da || 0,
    conveyance: existingStructure?.conveyance || 0,
    medicalAllow: existingStructure?.medicalAllow || 0,
    specialAllow: existingStructure?.specialAllow || 0,
    overtimeRate: existingStructure?.overtimeRate || 0,
    bankName: existingStructure?.bankName || '',
    accountNumber: existingStructure?.accountNumber || '',
    ifscCode: existingStructure?.ifscCode || '',
    effectiveFrom: new Date().toISOString().split('T')[0] || '',
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => createSalaryStructure(userId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-structure', userId] });
      navigate('/app/payroll');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      effectiveFrom: new Date(formData.effectiveFrom),
    });
  };

  const totalSalary =
    formData.basicSalary +
    (formData.hra || 0) +
    (formData.da || 0) +
    (formData.conveyance || 0) +
    (formData.medicalAllow || 0) +
    (formData.specialAllow || 0);

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Salary Structure</h1>
          <p className="text-gray-600">Define employee salary components</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Earnings */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Earnings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Basic Salary (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={formData.basicSalary}
                    onChange={(e) =>
                      setFormData({ ...formData, basicSalary: parseFloat(e.target.value) })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">HRA (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.hra}
                    onChange={(e) => setFormData({ ...formData, hra: parseFloat(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">DA (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.da}
                    onChange={(e) => setFormData({ ...formData, da: parseFloat(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Conveyance (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.conveyance}
                    onChange={(e) =>
                      setFormData({ ...formData, conveyance: parseFloat(e.target.value) })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Medical Allowance (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.medicalAllow}
                    onChange={(e) =>
                      setFormData({ ...formData, medicalAllow: parseFloat(e.target.value) })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Special Allowance (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.specialAllow}
                    onChange={(e) =>
                      setFormData({ ...formData, specialAllow: parseFloat(e.target.value) })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Overtime Rate (₹/hour)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.overtimeRate}
                    onChange={(e) =>
                      setFormData({ ...formData, overtimeRate: parseFloat(e.target.value) })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Total Salary */}
            <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
              <p className="text-sm text-gray-700 mb-1">Total Monthly Salary</p>
              <p className="text-4xl font-bold text-green-600">
                ₹{totalSalary.toLocaleString('en-IN')}
              </p>
            </div>

            {/* Bank Details */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Bank Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    value={formData.ifscCode}
                    onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Effective Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Effective From *
              </label>
              <input
                type="date"
                required
                value={formData.effectiveFrom}
                onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex gap-4 pt-6">
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={() => navigate('/app/payroll')}
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
                Save Salary Structure
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
