/**
 * ============================================
 * LEAVE APPLICATION PAGE
 * ============================================
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { applyLeave, getLeaves } from '../../services/attendance.service';
import Button from '../../components/common/Button';

export default function LeaveApplicationPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    leaveType: 'CASUAL',
    startDate: '',
    endDate: '',
    reason: '',
  });

  const { data: myLeaves = [] } = useQuery({
    queryKey: ['my-leaves'],
    queryFn: () => getLeaves(),
  });

  const applyMutation = useMutation({
    mutationFn: applyLeave,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-leaves'] });
      setFormData({ leaveType: 'CASUAL', startDate: '', endDate: '', reason: '' });
    },
  });

  const calculateDays = () => {
    if (!formData.startDate || !formData.endDate) return 0;
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const totalDays = calculateDays();
    applyMutation.mutate({
      leaveType: formData.leaveType,
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
      totalDays,
      reason: formData.reason,
    });
  };

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Leave Application</h1>
          <p className="text-gray-600">Apply for leave and view your leave history</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Application Form */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Apply for Leave</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Leave Type *
                </label>
                <select
                  required
                  value={formData.leaveType}
                  onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="CASUAL">Casual Leave</option>
                  <option value="SICK">Sick Leave</option>
                  <option value="EARNED">Earned Leave</option>
                  <option value="UNPAID">Unpaid Leave</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">End Date *</label>
                <input
                  type="date"
                  required
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {formData.startDate && formData.endDate && (
                <div className="p-3 bg-blue-50 rounded-xl">
                  <p className="text-sm text-blue-700">
                    Total Days: <span className="font-bold">{calculateDays()}</span>
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Reason</label>
                <textarea
                  rows={3}
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                  placeholder="Reason for leave..."
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={applyMutation.isPending}
                className="w-full"
              >
                Submit Application
              </Button>
            </form>
          </div>

          {/* Leave History */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6">My Leave History</h2>
            <div className="space-y-3">
              {myLeaves.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No leave applications</p>
              ) : (
                myLeaves.map((leave: any) => (
                  <div key={leave.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">{leave.leaveType}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(leave.startDate).toLocaleDateString('en-IN')} -{' '}
                          {new Date(leave.endDate).toLocaleDateString('en-IN')}
                        </p>
                        <p className="text-xs text-gray-500">{leave.totalDays} days</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          leave.status === 'APPROVED'
                            ? 'bg-green-100 text-green-800'
                            : leave.status === 'REJECTED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {leave.status}
                      </span>
                    </div>
                    {leave.reason && <p className="text-sm text-gray-600 mt-2">{leave.reason}</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
