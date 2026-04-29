/**
 * ============================================
 * PAYROLL DASHBOARD
 * ============================================
 */

import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPayrollPeriods } from '../../services/payroll.service';
import Button from '../../components/common/Button';
import { formatIstDate } from '../../lib/dateUtils';

export default function PayrollDashboard() {
  const { data: periods = [], isLoading } = useQuery({
    queryKey: ['payroll-periods'],
    queryFn: getPayrollPeriods,
  });

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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Payroll Management</h1>
            <p className="text-gray-600">Process monthly payroll and manage salaries</p>
          </div>
          <Button variant="primary">Create Payroll Period</Button>
        </div>

        {/* Payroll Periods */}
        <div className="grid grid-cols-1 gap-6">
          {periods.map((period: any) => (
            <div
              key={period.id}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {new Date(0, period.month - 1).toLocaleString('en-IN', { month: 'long' })}{' '}
                    {period.year}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {formatIstDate(period.startDate)} -{' '}
                    {formatIstDate(period.endDate)}
                  </p>
                  <p className="text-sm text-gray-600">Working Days: {period.workingDays}</p>
                </div>
                <span
                  className={`px-4 py-2 rounded-xl text-sm font-semibold ${
                    period.status === 'DRAFT'
                      ? 'bg-gray-100 text-gray-800'
                      : period.status === 'PROCESSING'
                      ? 'bg-blue-100 text-blue-800'
                      : period.status === 'FINALIZED'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-purple-100 text-purple-800'
                  }`}
                >
                  {period.status}
                </span>
              </div>

              {period.payslips && period.payslips.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-sm text-gray-600">Employees</p>
                    <p className="text-lg font-bold text-gray-900">{period.payslips.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Gross</p>
                    <p className="text-lg font-bold text-gray-900">
                      ₹
                      {period.payslips
                        .reduce((sum: number, p: any) => sum + p.grossEarnings, 0)
                        .toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Deductions</p>
                    <p className="text-lg font-bold text-gray-900">
                      ₹
                      {period.payslips
                        .reduce((sum: number, p: any) => sum + p.totalDeductions, 0)
                        .toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Net</p>
                    <p className="text-lg font-bold text-green-600">
                      ₹
                      {period.payslips
                        .reduce((sum: number, p: any) => sum + p.netSalary, 0)
                        .toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-4 flex gap-3">
                {period.status === 'DRAFT' && (
                  <Button variant="primary" size="sm">
                    Process Payroll
                  </Button>
                )}
                <Link to={`/payroll/periods/${period.id}`}>
                  <Button variant="secondary" size="sm">
                    View Details
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
