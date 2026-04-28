/**
 * ============================================
 * ATTENDANCE DASHBOARD
 * ============================================
 */

import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getMyAttendance } from '../../services/attendance.service';
import Button from '../../components/common/Button';

export default function AttendanceDashboard() {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const { data: attendance = [], isLoading } = useQuery({
    queryKey: ['my-attendance', firstDay, lastDay],
    queryFn: () => getMyAttendance(firstDay.toISOString(), lastDay.toISOString()),
  });

  const presentDays = attendance.filter((a: any) => a.status === 'PRESENT').length;
  const absentDays = attendance.filter((a: any) => a.status === 'ABSENT').length;
  const totalHours = attendance.reduce((sum: number, a: any) => sum + (a.totalHours || 0), 0);

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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Attendance</h1>
            <p className="text-gray-600">Track your attendance and leaves</p>
          </div>
          <div className="flex gap-3">
            <Link to="/app/attendance/check-in">
              <Button variant="success">Check In</Button>
            </Link>
            <Link to="/app/attendance/check-out">
              <Button variant="danger">Check Out</Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm font-medium">Present Days</span>
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
            <p className="text-3xl font-bold text-gray-900">{presentDays}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm font-medium">Absent Days</span>
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
            <p className="text-3xl font-bold text-gray-900">{absentDays}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm font-medium">Total Hours</span>
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{totalHours.toFixed(1)}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm font-medium">This Month</span>
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{attendance.length}</p>
          </div>
        </div>

        {/* Attendance Records */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Attendance Records</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
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
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                      {new Date(record.date).toLocaleDateString('en-IN')}
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
