/**
 * ============================================
 * OVERTIME REPORT PAGE
 * ============================================
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllAttendance } from '../../services/attendance.service';
import Button from '../../components/common/Button';

export default function OvertimeReportPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0] || '');

  const { data: attendance = [], isLoading } = useQuery({
    queryKey: ['overtime-report', selectedDate],
    queryFn: () => getAllAttendance(selectedDate),
  });

  const overtimeRecords = attendance.filter((a: any) => a.overtimeHours && a.overtimeHours > 0);
  const totalOvertimeHours = overtimeRecords.reduce(
    (sum: number, a: any) => sum + (a.overtimeHours || 0),
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Overtime Report</h1>
            <p className="text-gray-600">Track employee overtime hours</p>
          </div>
          <div className="flex gap-3">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
            />
            <Button variant="primary">Export Report</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Employees with OT</p>
            <p className="text-3xl font-bold text-gray-900">{overtimeRecords.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Total OT Hours</p>
            <p className="text-3xl font-bold text-amber-600">{totalOvertimeHours.toFixed(1)}h</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Avg OT/Employee</p>
            <p className="text-2xl font-bold text-gray-900">
              {overtimeRecords.length > 0
                ? (totalOvertimeHours / overtimeRecords.length).toFixed(1)
                : 0}
              h
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Overtime Details</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Check In
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Check Out
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    OT Hours
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {overtimeRecords.map((record: any) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="font-semibold text-gray-900">{record.user?.name}</p>
                        <p className="text-xs text-gray-500">{record.user?.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                      {record.user?.department || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.checkInTime
                        ? new Date(record.checkInTime).toLocaleTimeString('en-IN')
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.checkOutTime
                        ? new Date(record.checkOutTime).toLocaleTimeString('en-IN')
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                      {record.totalHours ? `${record.totalHours.toFixed(1)}h` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-amber-600">
                      {record.overtimeHours ? `${record.overtimeHours.toFixed(1)}h` : '-'}
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
