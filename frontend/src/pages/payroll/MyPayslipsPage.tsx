/**
 * ============================================
 * MY PAYSLIPS PAGE
 * ============================================
 */

import { useQuery } from '@tanstack/react-query';
import { getMyPayslips } from '../../services/payroll.service';
import Button from '../../components/common/Button';
import { formatIstDate } from '../../lib/dateUtils';

export default function MyPayslipsPage() {
  const { data: payslips = [], isLoading } = useQuery({
    queryKey: ['my-payslips'],
    queryFn: getMyPayslips,
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Payslips</h1>
          <p className="text-gray-600">View your salary history</p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {payslips.map((payslip: any) => (
            <div
              key={payslip.id}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {new Date(0, payslip.period.month - 1).toLocaleString('en-IN', {
                      month: 'long',
                    })}{' '}
                    {payslip.period.year}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {formatIstDate(payslip.period.startDate)} -{' '}
                    {formatIstDate(payslip.period.endDate)}
                  </p>
                </div>
                <span
                  className={`px-4 py-2 rounded-xl text-sm font-semibold ${
                    payslip.paymentStatus === 'PAID'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {payslip.paymentStatus}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Present Days</p>
                  <p className="text-lg font-bold text-gray-900">{payslip.presentDays}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Gross Earnings</p>
                  <p className="text-lg font-bold text-gray-900">
                    ₹{payslip.grossEarnings.toLocaleString('en-IN')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Deductions</p>
                  <p className="text-lg font-bold text-red-600">
                    ₹{payslip.totalDeductions.toLocaleString('en-IN')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Net Salary</p>
                  <p className="text-2xl font-bold text-green-600">
                    ₹{payslip.netSalary.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="primary" size="sm">
                  Download Payslip
                </Button>
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
