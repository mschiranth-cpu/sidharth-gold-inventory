/**
 * ============================================
 * ADMIN ATTENDANCE PAGE
 * ============================================
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllAttendance } from '../../services/attendance.service';
import Button from '../../components/common/Button';

export default function AdminAttendancePage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0] || '');

  const { data: attendance = [], isLoading } = useQuery({
    queryKey: ['all-attendance', selectedDate],
    queryFn: () => getAllAttendance(selectedDate),
  });

  const presentCount = attendance.filter((a: any) => a.status === 'PRESENT').length;
  const absentCount = attendance.filter((a: any) => a.status === 'ABSENT').length;

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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Attendance Management</h1>
            <p className="text-gray-600">View and manage employee attendance</p>
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

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm font-medium">Total Employees</span>
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{attendance.length}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm font-medium">Present</span>
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-green-600">{presentCount}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm font-medium">Absent</span>
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-red-600">{absentCount}</p>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
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
                    Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendance.map((record: any) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="font-semibold text-gray-900">{record.user?.name}</p>
                        <p className="text-sm text-gray-500">{record.user?.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                      {record.user?.department || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                      {record.checkInTime
                        ? new Date(record.checkInTime).toLocaleTimeString('en-IN')
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                      {record.checkOutTime
                        ? new Date(record.checkOutTime).toLocaleTimeString('en-IN')
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                      {record.totalHours ? `${record.totalHours.toFixed(1)}h` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          record.status === 'PRESENT'
                            ? 'bg-green-100 text-green-800'
                            : record.status === 'ABSENT'
                            ? 'bg-red-100 text-red-800'
                            : record.status === 'LEAVE'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {record.status}
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
