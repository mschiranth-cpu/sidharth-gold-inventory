/**
 * ============================================
 * CLIENT APPROVAL PAGE (Admin/Office Staff)
 * ============================================
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllClients, approveClient } from '../../services/clients.service';
import Button from '../../components/common/Button';

export default function ClientApprovalPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>('PENDING');
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedClient, setSelectedClient] = useState<string | null>(null);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients', filter],
    queryFn: () => getAllClients({ approvalStatus: filter }),
  });

  const approveMutation = useMutation({
    mutationFn: approveClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setSelectedClient(null);
      setRejectionReason('');
    },
  });

  const handleApprove = (clientId: string, approved: boolean) => {
    approveMutation.mutate({
      clientId,
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Client Management</h1>
          <p className="text-gray-600">Approve or reject client registrations</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('PENDING')}
              className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                filter === 'PENDING'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending ({clients.filter((c) => c.approvalStatus === 'PENDING').length})
            </button>
            <button
              onClick={() => setFilter('APPROVED')}
              className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                filter === 'APPROVED'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => setFilter('REJECTED')}
              className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                filter === 'REJECTED'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Rejected
            </button>
          </div>
        </div>

        {/* Clients List */}
        {clients.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <p className="text-gray-500 text-lg">No clients found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {clients.map((client) => (
              <div
                key={client.id}
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{client.user?.name}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          client.approvalStatus === 'PENDING'
                            ? 'bg-amber-100 text-amber-800'
                            : client.approvalStatus === 'APPROVED'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {client.approvalStatus}
                      </span>
                    </div>
                    <p className="text-gray-600">{client.user?.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {client.businessName && (
                    <div>
                      <p className="text-sm text-gray-600">Business Name</p>
                      <p className="font-semibold text-gray-900">{client.businessName}</p>
                    </div>
                  )}
                  {client.phone && (
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-semibold text-gray-900">{client.phone}</p>
                    </div>
                  )}
                  {client.gstNumber && (
                    <div>
                      <p className="text-sm text-gray-600">GST Number</p>
                      <p className="font-semibold text-gray-900">{client.gstNumber}</p>
                    </div>
                  )}
                </div>

                {client.approvalStatus === 'PENDING' && (
                  <div className="flex gap-3 mt-4">
                    <Button
                      variant="success"
                      onClick={() => handleApprove(client.id, true)}
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
                      onClick={() => setSelectedClient(client.id)}
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
                )}

                {/* Rejection Modal */}
                {selectedClient === client.id && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
                      <h3 className="text-xl font-bold text-gray-900 mb-4">Reject Client</h3>
                      <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Rejection Reason
                        </label>
                        <textarea
                          rows={4}
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder="Please provide a reason..."
                        />
                      </div>
                      <div className="flex gap-3">
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setSelectedClient(null);
                            setRejectionReason('');
                          }}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => handleApprove(client.id, false)}
                          isLoading={approveMutation.isPending}
                          disabled={!rejectionReason.trim()}
                          className="flex-1"
                        >
                          Reject
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
