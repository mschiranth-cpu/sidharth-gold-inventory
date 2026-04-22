/**
 * ============================================
 * PAYROLL PERIOD DETAIL PAGE
 * ============================================
 */

import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPayrollPeriods } from '../../services/payroll.service';
import Button from '../../components/common/Button';

export default function PayrollPeriodDetailPage() {
  const { periodId } = useParams<{ periodId: string }>();

  const { data: periods = [] } = useQuery({
    queryKey: ['payroll-periods'],
    queryFn: getPayrollPeriods,
  });

  const period = periods.find((p: any) => p.id === periodId);

  if (!period) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <p className="text-gray-500 text-lg">Period not found</p>
            <Link to="/app/payroll" className="mt-4 inline-block">
              <Button variant="primary">Back to Payroll</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link
            to="/app/payroll"
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
            Back to Payroll
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">
            {new Date(0, period.month - 1).toLocaleString('en-IN', { month: 'long' })} {period.year}
          </h1>
          <p className="text-gray-600">
            {new Date(period.startDate).toLocaleDateString('en-IN')} -{' '}
            {new Date(period.endDate).toLocaleDateString('en-IN')}
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Employees</p>
            <p className="text-3xl font-bold text-gray-900">{period.payslips?.length || 0}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Total Gross</p>
            <p className="text-2xl font-bold text-gray-900">
              ₹
              {period.payslips
                ?.reduce((sum: number, p: any) => sum + p.grossEarnings, 0)
                .toLocaleString('en-IN')}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Total Deductions</p>
            <p className="text-2xl font-bold text-red-600">
              ₹
              {period.payslips
                ?.reduce((sum: number, p: any) => sum + p.totalDeductions, 0)
                .toLocaleString('en-IN')}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Total Net</p>
            <p className="text-2xl font-bold text-green-600">
              ₹
              {period.payslips
                ?.reduce((sum: number, p: any) => sum + p.netSalary, 0)
                .toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {/* Payslips Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Employee Payslips</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Present Days
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Gross
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Deductions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Net Salary
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {period.payslips?.map((payslip: any) => (
                  <tr key={payslip.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="font-semibold text-gray-900">{payslip.user?.name}</p>
                        <p className="text-sm text-gray-500">{payslip.user?.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                      {payslip.presentDays}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                      ₹{payslip.grossEarnings.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-red-600">
                      ₹{payslip.totalDeductions.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-green-600">
                      ₹{payslip.netSalary.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          payslip.paymentStatus === 'PAID'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {payslip.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
