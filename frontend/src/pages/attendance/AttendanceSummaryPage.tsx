/**
 * ============================================
 * ATTENDANCE SUMMARY PAGE
 * ============================================
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMyAttendance } from '../../services/attendance.service';

export default function AttendanceSummaryPage() {
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());

  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);

  const { data: attendance = [], isLoading } = useQuery({
    queryKey: ['attendance-summary', month, year],
    queryFn: () => getMyAttendance(startDate.toISOString(), endDate.toISOString()),
  });

  const presentDays = attendance.filter((a: any) => a.status === 'PRESENT').length;
  const absentDays = attendance.filter((a: any) => a.status === 'ABSENT').length;
  const leaveDays = attendance.filter((a: any) => a.status === 'LEAVE').length;
  const totalHours = attendance.reduce((sum: number, a: any) => sum + (a.totalHours || 0), 0);
  const overtimeHours = attendance.reduce((sum: number, a: any) => sum + (a.overtimeHours || 0), 0);

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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Attendance Summary</h1>
            <p className="text-gray-600">Monthly attendance overview</p>
          </div>
          <div className="flex gap-3">
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i}>
                  {new Date(0, i).toLocaleString('en-IN', { month: 'long' })}
                </option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
            >
              {[2024, 2025, 2026].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Present</p>
            <p className="text-3xl font-bold text-green-600">{presentDays}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Absent</p>
            <p className="text-3xl font-bold text-red-600">{absentDays}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Leaves</p>
            <p className="text-3xl font-bold text-blue-600">{leaveDays}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Total Hours</p>
            <p className="text-2xl font-bold text-gray-900">{totalHours.toFixed(1)}h</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Overtime</p>
            <p className="text-2xl font-bold text-amber-600">{overtimeHours.toFixed(1)}h</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Daily Breakdown</h2>
          <div className="grid grid-cols-7 gap-2">
            {attendance.map((record: any) => {
              const date = new Date(record.date);
              return (
                <div
                  key={record.id}
                  className={`p-3 rounded-xl text-center ${
                    record.status === 'PRESENT'
                      ? 'bg-green-100 border border-green-200'
                      : record.status === 'ABSENT'
                      ? 'bg-red-100 border border-red-200'
                      : record.status === 'LEAVE'
                      ? 'bg-blue-100 border border-blue-200'
                      : 'bg-gray-100 border border-gray-200'
                  }`}
                >
                  <p className="text-xs text-gray-600">{date.getDate()}</p>
                  <p className="text-xs font-semibold text-gray-900">{record.status.charAt(0)}</p>
                  {record.totalHours && (
                    <p className="text-xs text-gray-600">{record.totalHours.toFixed(1)}h</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
