/**
 * ============================================
 * LEAVE APPROVAL PAGE (Admin)
 * ============================================
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLeaves, approveLeave } from '../../services/attendance.service';
import Button from '../../components/common/Button';

export default function LeaveApprovalPage() {
  const queryClient = useQueryClient();
  const [selectedLeave, setSelectedLeave] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const { data: leaves = [], isLoading } = useQuery({
    queryKey: ['pending-leaves'],
    queryFn: () => getLeaves(undefined, 'PENDING'),
  });

  const approveMutation = useMutation({
    mutationFn: ({ leaveId, approved, rejectionReason }: any) =>
      approveLeave(leaveId, { approved, rejectionReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-leaves'] });
      setSelectedLeave(null);
      setRejectionReason('');
    },
  });

  const handleApprove = (leaveId: string, approved: boolean) => {
    approveMutation.mutate({
      leaveId,
      approved,
      rejectionReason: approved ? undefined : rejectionReason,
    });
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
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Leave Approvals</h1>
          <p className="text-gray-600">
            Review and approve leave applications ({leaves.length} pending)
          </p>
        </div>

        {leaves.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <svg
              className="w-20 h-20 text-gray-300 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-gray-500 text-lg">No pending leave applications</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {leaves.map((leave: any) => (
              <div
                key={leave.id}
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{leave.user?.name}</h3>
                    <p className="text-sm text-gray-600">{leave.user?.email}</p>
                    <p className="text-sm text-gray-600 mt-2">
                      {new Date(leave.startDate).toLocaleDateString('en-IN')} -{' '}
                      {new Date(leave.endDate).toLocaleDateString('en-IN')}
                    </p>
                    <p className="text-xs text-gray-500">{leave.totalDays} days</p>
                  </div>
                  <span className="px-4 py-2 rounded-xl text-sm font-semibold bg-amber-100 text-amber-800">
                    {leave.leaveType}
                  </span>
                </div>

                {leave.reason && (
                  <div className="mb-4 p-4 bg-blue-50 rounded-xl">
                    <p className="text-sm font-semibold text-blue-900 mb-1">Reason:</p>
                    <p className="text-sm text-blue-800">{leave.reason}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="success"
                    onClick={() => handleApprove(leave.id, true)}
                    isLoading={approveMutation.isPending}
                    iconLeft={
                      <svg
                        className="w-4 h-4"
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
                    }
                  >
                    Approve
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => setSelectedLeave(leave.id)}
                    iconLeft={
                      <svg
                        className="w-4 h-4"
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
                    }
                  >
                    Reject
                  </Button>
                </div>

                {selectedLeave === leave.id && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
                      <h3 className="text-xl font-bold text-gray-900 mb-4">Reject Leave</h3>
                      <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Rejection Reason *
                        </label>
                        <textarea
                          rows={4}
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                          placeholder="Please provide a reason..."
                        />
                      </div>
                      <div className="flex gap-3">
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setSelectedLeave(null);
                            setRejectionReason('');
                          }}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => handleApprove(leave.id, false)}
                          isLoading={approveMutation.isPending}
                          disabled={!rejectionReason.trim()}
                          className="flex-1"
                        >
                          Reject Leave
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
