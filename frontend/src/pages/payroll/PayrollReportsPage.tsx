/**
 * ============================================
 * PAYROLL REPORTS PAGE
 * ============================================
 */

import { useQuery } from '@tanstack/react-query';
import { getPayrollPeriods } from '../../services/payroll.service';
import Button from '../../components/common/Button';

export default function PayrollReportsPage() {
  const { data: periods = [], isLoading } = useQuery({
    queryKey: ['payroll-periods-report'],
    queryFn: getPayrollPeriods,
  });

  const totalGross = periods.reduce(
    (sum: number, p: any) =>
      sum + (p.payslips?.reduce((s: number, ps: any) => s + ps.grossEarnings, 0) || 0),
    0
  );

  const totalNet = periods.reduce(
    (sum: number, p: any) =>
      sum + (p.payslips?.reduce((s: number, ps: any) => s + ps.netSalary, 0) || 0),
    0
  );

  const totalDeductions = periods.reduce(
    (sum: number, p: any) =>
      sum + (p.payslips?.reduce((s: number, ps: any) => s + ps.totalDeductions, 0) || 0),
    0
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Payroll Reports</h1>
            <p className="text-gray-600">Comprehensive payroll analysis</p>
          </div>
          <Button variant="primary">Export Report</Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Total Periods</p>
            <p className="text-3xl font-bold text-gray-900">{periods.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Total Gross</p>
            <p className="text-2xl font-bold text-gray-900">
              ₹{totalGross.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Total Deductions</p>
            <p className="text-2xl font-bold text-red-600">
              ₹{totalDeductions.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Total Net</p>
            <p className="text-2xl font-bold text-green-600">
              ₹{totalNet.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        {/* Period-wise Breakdown */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Period-wise Breakdown</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Employees
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Working Days
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Gross
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Deductions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Net
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {periods.map((period: any) => {
                  const gross =
                    period.payslips?.reduce((sum: number, p: any) => sum + p.grossEarnings, 0) || 0;
                  const deductions =
                    period.payslips?.reduce((sum: number, p: any) => sum + p.totalDeductions, 0) ||
                    0;
                  const net =
                    period.payslips?.reduce((sum: number, p: any) => sum + p.netSalary, 0) || 0;

                  return (
                    <tr key={period.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                        {new Date(0, period.month - 1).toLocaleString('en-IN', { month: 'long' })}{' '}
                        {period.year}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        {period.payslips?.length || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        {period.workingDays}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                        ₹{gross.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-red-600">
                        ₹{deductions.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-green-600">
                        ₹{net.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            period.status === 'FINALIZED'
                              ? 'bg-green-100 text-green-800'
                              : period.status === 'PROCESSING'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {period.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
