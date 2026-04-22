/**
 * ============================================
 * PROCESS PAYROLL PAGE
 * ============================================
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { processPayroll } from '../../services/payroll.service';
import Button from '../../components/common/Button';

export default function ProcessPayrollPage() {
  const { periodId } = useParams<{ periodId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [confirmed, setConfirmed] = useState(false);

  const processMutation = useMutation({
    mutationFn: () => processPayroll(periodId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-periods'] });
      navigate('/app/payroll');
    },
  });

  const handleProcess = () => {
    if (!confirmed) {
      alert('Please confirm before processing');
      return;
    }
    processMutation.mutate();
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Process Payroll</h1>
          <p className="text-gray-600">Calculate salaries for all employees</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <div className="mb-6 p-6 bg-amber-50 border border-amber-200 rounded-xl">
            <h3 className="font-bold text-amber-900 mb-2">⚠️ Important</h3>
            <p className="text-sm text-amber-800">
              Processing payroll will calculate salaries for all employees based on their attendance
              records. This action cannot be undone. Please review all attendance data before
              proceeding.
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Payroll Processing Steps:</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Fetch all active employees</li>
              <li>Calculate present days from attendance</li>
              <li>Calculate basic salary (per day rate × present days)</li>
              <li>Add allowances (HRA, DA, Conveyance, etc.)</li>
              <li>Calculate overtime pay</li>
              <li>Deduct advances and loans</li>
              <li>Generate payslips</li>
            </ol>
          </div>

          <div className="mb-6">
            <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm font-semibold text-gray-700">
                I confirm that all attendance data is accurate and I want to process payroll
              </span>
            </label>
          </div>

          <div className="flex gap-4">
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
              type="button"
              variant="primary"
              size="lg"
              onClick={handleProcess}
              disabled={!confirmed}
              isLoading={processMutation.isPending}
              className="flex-1"
            >
              Process Payroll
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
