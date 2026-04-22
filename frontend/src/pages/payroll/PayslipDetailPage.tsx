/**
 * ============================================
 * PAYSLIP DETAIL PAGE
 * ============================================
 */

import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPayslip } from '../../services/payroll.service';
import Button from '../../components/common/Button';

export default function PayslipDetailPage() {
  const { payslipId } = useParams<{ payslipId: string }>();

  const { data: payslip, isLoading } = useQuery({
    queryKey: ['payslip', payslipId],
    queryFn: () => getPayslip(payslipId!),
    enabled: !!payslipId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!payslip) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <p className="text-gray-500 text-lg">Payslip not found</p>
            <Link to="/app/payroll/my-payslips" className="mt-4 inline-block">
              <Button variant="primary">Back to Payslips</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            to="/app/payroll/my-payslips"
            className="text-indigo-600 hover:text-indigo-700 font-medium text-sm mb-4 inline-flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Payslips
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Payslip Details</h1>
          <p className="text-gray-600">
            {new Date(0, payslip.period.month - 1).toLocaleString('en-IN', { month: 'long' })}{' '}
            {payslip.period.year}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          {/* Employee Info */}
          <div className="mb-6 pb-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Employee Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-semibold text-gray-900">{payslip.user?.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-semibold text-gray-900">{payslip.user?.email}</p>
              </div>
            </div>
          </div>

          {/* Attendance Summary */}
          <div className="mb-6 pb-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Attendance Summary</h2>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Days</p>
                <p className="text-2xl font-bold text-gray-900">{payslip.totalDays}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Present</p>
                <p className="text-2xl font-bold text-green-600">{payslip.presentDays}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Absent</p>
                <p className="text-2xl font-bold text-red-600">{payslip.absentDays}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Leaves</p>
                <p className="text-2xl font-bold text-blue-600">{payslip.leaveDays}</p>
              </div>
            </div>
          </div>

          {/* Earnings */}
          <div className="mb-6 pb-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Earnings</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-700">Basic Salary</span>
                <span className="font-semibold text-gray-900">
                  ₹{payslip.basicEarned.toLocaleString('en-IN')}
                </span>
              </div>
              {payslip.hraEarned && (
                <div className="flex justify-between">
                  <span className="text-gray-700">HRA</span>
                  <span className="font-semibold text-gray-900">
                    ₹{payslip.hraEarned.toLocaleString('en-IN')}
                  </span>
                </div>
              )}
              {payslip.daEarned && (
                <div className="flex justify-between">
                  <span className="text-gray-700">DA</span>
                  <span className="font-semibold text-gray-900">
                    ₹{payslip.daEarned.toLocaleString('en-IN')}
                  </span>
                </div>
              )}
              {payslip.overtimePay && (
                <div className="flex justify-between">
                  <span className="text-gray-700">Overtime ({payslip.overtimeHours}h)</span>
                  <span className="font-semibold text-gray-900">
                    ₹{payslip.overtimePay.toLocaleString('en-IN')}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-3 border-t border-gray-200">
                <span className="font-bold text-gray-900">Gross Earnings</span>
                <span className="text-xl font-bold text-gray-900">
                  ₹{payslip.grossEarnings.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Deductions */}
          <div className="mb-6 pb-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Deductions</h2>
            <div className="space-y-3">
              {payslip.advanceDeduction && (
                <div className="flex justify-between">
                  <span className="text-gray-700">Advance Deduction</span>
                  <span className="font-semibold text-red-600">
                    ₹{payslip.advanceDeduction.toLocaleString('en-IN')}
                  </span>
                </div>
              )}
              {payslip.loanDeduction && (
                <div className="flex justify-between">
                  <span className="text-gray-700">Loan EMI</span>
                  <span className="font-semibold text-red-600">
                    ₹{payslip.loanDeduction.toLocaleString('en-IN')}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-3 border-t border-gray-200">
                <span className="font-bold text-gray-900">Total Deductions</span>
                <span className="text-xl font-bold text-red-600">
                  ₹{payslip.totalDeductions.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Net Salary */}
          <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-gray-900">Net Salary</span>
              <span className="text-4xl font-bold text-green-600">
                ₹{payslip.netSalary.toLocaleString('en-IN')}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Payment Status:{' '}
              <span
                className={`font-semibold ${
                  payslip.paymentStatus === 'PAID' ? 'text-green-700' : 'text-amber-700'
                }`}
              >
                {payslip.paymentStatus}
              </span>
            </p>
          </div>

          <div className="mt-6 flex gap-3">
            <Button variant="primary" className="flex-1">
              Download PDF
            </Button>
            <Button variant="secondary" className="flex-1">
              Email Payslip
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
