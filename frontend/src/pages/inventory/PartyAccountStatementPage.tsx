/**
 * ============================================
 * PARTY ACCOUNT STATEMENT PAGE
 * ============================================
 */

import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPartyMetalAccounts, getPartyMetalTransactions } from '../../services/party.service';
import Button from '../../components/common/Button';

export default function PartyAccountStatementPage() {
  const { partyId } = useParams<{ partyId: string }>();

  const { data: accounts = [] } = useQuery({
    queryKey: ['party-accounts', partyId],
    queryFn: () => getPartyMetalAccounts(partyId!),
    enabled: !!partyId,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['party-transactions', partyId],
    queryFn: () => getPartyMetalTransactions(partyId!),
    enabled: !!partyId,
  });

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Party Account Statement</h1>
            <p className="text-gray-600">Metal balance and transaction history</p>
          </div>
          <Button variant="primary">Export Statement</Button>
        </div>

        {/* Account Balances */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Current Balances</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {accounts.map((account: any) => (
              <div
                key={account.id}
                className="p-4 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-200"
              >
                <p className="text-sm text-gray-600 mb-1">
                  {account.metalType} ({account.purity}K)
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {account.grossBalance.toFixed(3)}g
                </p>
                <p className="text-sm text-gray-600">Pure: {account.pureBalance.toFixed(3)}g</p>
              </div>
            ))}
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Transaction History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Metal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Gross Weight
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Purity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Pure Weight
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Voucher
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((txn: any) => (
                  <tr key={txn.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(txn.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          txn.transactionType === 'RECEIVED'
                            ? 'bg-green-100 text-green-800'
                            : txn.transactionType === 'RETURNED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {txn.transactionType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                      {txn.metalType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                      {txn.grossWeight.toFixed(3)}g
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                      {txn.testedPurity
                        ? `${txn.testedPurity}K (tested)`
                        : `${txn.declaredPurity}K`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                      {txn.pureWeight.toFixed(3)}g
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {txn.voucherNumber}
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
