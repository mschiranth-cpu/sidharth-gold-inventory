/**
 * ============================================
 * SHIFT MANAGEMENT PAGE
 * ============================================
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllShifts, createShift } from '../../services/attendance.service';
import Button from '../../components/common/Button';

export default function ShiftManagementPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    startTime: '09:00',
    endTime: '18:00',
    breakMinutes: 60,
    graceMinutes: 15,
    isDefault: false,
  });

  const { data: shifts = [], isLoading } = useQuery({
    queryKey: ['shifts'],
    queryFn: getAllShifts,
  });

  const createMutation = useMutation({
    mutationFn: createShift,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      setShowForm(false);
      setFormData({
        name: '',
        startTime: '09:00',
        endTime: '18:00',
        breakMinutes: 60,
        graceMinutes: 15,
        isDefault: false,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Shift Management</h1>
            <p className="text-gray-600">Manage work shifts</p>
          </div>
          <Button variant="primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Add Shift'}
          </Button>
        </div>

        {showForm && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Shift</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Shift Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                    placeholder="Morning Shift, Evening Shift, etc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    End Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Break Minutes
                  </label>
                  <input
                    type="number"
                    value={formData.breakMinutes}
                    onChange={(e) =>
                      setFormData({ ...formData, breakMinutes: parseInt(e.target.value) })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Grace Minutes
                  </label>
                  <input
                    type="number"
                    value={formData.graceMinutes}
                    onChange={(e) =>
                      setFormData({ ...formData, graceMinutes: parseInt(e.target.value) })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 mt-8">
                    <input
                      type="checkbox"
                      checked={formData.isDefault}
                      onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm font-semibold text-gray-700">
                      Set as default shift
                    </span>
                  </label>
                </div>
              </div>
              <Button type="submit" variant="primary" isLoading={createMutation.isPending}>
                Create Shift
              </Button>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shifts.map((shift: any) => (
            <div
              key={shift.id}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">{shift.name}</h3>
                {shift.isDefault && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
                    Default
                  </span>
                )}
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Timing</span>
                  <span className="font-semibold text-gray-900">
                    {shift.startTime} - {shift.endTime}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Break</span>
                  <span className="font-semibold text-gray-900">{shift.breakMinutes} mins</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Grace Period</span>
                  <span className="font-semibold text-gray-900">{shift.graceMinutes} mins</span>
                </div>
              </div>
              {shift.employees && shift.employees.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    {shift.employees.length} employees assigned
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
