/**
 * ============================================
 * PARTY DETAIL PAGE
 * ============================================
 */

import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  getPartyById,
  getPartyMetalAccounts,
  getPartyMetalTransactions,
} from '../../services/party.service';
import Button from '../../components/common/Button';

export default function PartyDetailPage() {
  const { partyId } = useParams<{ partyId: string }>();

  const { data: party, isLoading: partyLoading } = useQuery({
    queryKey: ['party', partyId],
    queryFn: () => getPartyById(partyId!),
    enabled: !!partyId,
  });

  const { data: accounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ['party-accounts', partyId],
    queryFn: () => getPartyMetalAccounts(partyId!),
    enabled: !!partyId,
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ['party-transactions', partyId],
    queryFn: () => getPartyMetalTransactions(partyId!),
    enabled: !!partyId,
  });

  if (partyLoading || accountsLoading || transactionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!party) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <p className="text-gray-500 text-lg">Party not found</p>
            <Link to="/app/inventory/parties" className="mt-4 inline-block">
              <Button variant="primary">Back to Parties</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link
            to="/app/inventory/parties"
            className="text-indigo-600 hover:text-indigo-700 font-medium text-sm mb-4 inline-flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Parties
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">{party.name}</h1>
          <p className="text-gray-600">{party.type}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Party Info */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Party Information</h2>
            <div className="space-y-3 text-sm">
              {party.phone && (
                <div>
                  <p className="text-gray-600">Phone</p>
                  <p className="font-semibold text-gray-900">{party.phone}</p>
                </div>
              )}
              {party.email && (
                <div>
                  <p className="text-gray-600">Email</p>
                  <p className="font-semibold text-gray-900">{party.email}</p>
                </div>
              )}
              {party.gstNumber && (
                <div>
                  <p className="text-gray-600">GST Number</p>
                  <p className="font-semibold text-gray-900">{party.gstNumber}</p>
                </div>
              )}
              {party.address && (
                <div>
                  <p className="text-gray-600">Address</p>
                  <p className="font-semibold text-gray-900">{party.address}</p>
                </div>
              )}
            </div>
          </div>

          {/* Metal Accounts */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Metal Accounts</h2>
                <Button variant="primary" size="sm">
                  Add Transaction
                </Button>
              </div>
              {accounts.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No metal accounts</p>
              ) : (
                <div className="space-y-3">
                  {accounts.map((account: any) => (
                    <div
                      key={account.id}
                      className="p-4 bg-gray-50 rounded-xl border border-gray-200"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {account.metalType} ({account.purity}K)
                          </p>
                          <p className="text-sm text-gray-600">
                            Pure: {account.pureBalance.toFixed(3)}g
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">
                            {account.grossBalance.toFixed(2)}g
                          </p>
                          <p className="text-xs text-gray-500">Gross Balance</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Transactions</h2>
              {transactions.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No transactions</p>
              ) : (
                <div className="space-y-3">
                  {transactions.slice(0, 10).map((txn: any) => (
                    <div key={txn.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{txn.transactionType}</p>
                          <p className="text-sm text-gray-600">
                            {txn.metalType} ({txn.declaredPurity}K) - {txn.grossWeight.toFixed(2)}g
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(txn.createdAt).toLocaleString('en-IN')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">
                            Voucher: {txn.voucherNumber}
                          </p>
                          <p className="text-xs text-gray-600">{txn.createdBy?.name}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
