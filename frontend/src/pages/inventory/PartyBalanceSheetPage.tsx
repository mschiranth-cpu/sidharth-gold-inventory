/**
 * ============================================
 * PARTY BALANCE SHEET PAGE
 * ============================================
 */

import { useQuery } from '@tanstack/react-query';
import { getAllParties } from '../../services/party.service';
import Button from '../../components/common/Button';

export default function PartyBalanceSheetPage() {
  const { data: parties = [], isLoading } = useQuery({
    queryKey: ['parties-balance-sheet'],
    queryFn: () => getAllParties({}),
  });

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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Party Balance Sheet</h1>
            <p className="text-gray-600">Consolidated party metal balances</p>
          </div>
          <Button variant="primary">Export Balance Sheet</Button>
        </div>

        <div className="space-y-6">
          {parties.map((party: any) => (
            <div
              key={party.id}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{party.name}</h3>
                  <p className="text-sm text-gray-600">{party.type}</p>
                  {party.phone && <p className="text-sm text-gray-500">📞 {party.phone}</p>}
                </div>
                <span className="px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-100 text-indigo-800">
                  {party.metalAccounts?.length || 0} Accounts
                </span>
              </div>

              {party.metalAccounts && party.metalAccounts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {party.metalAccounts.map((account: any) => (
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
                      <p className="text-xs text-gray-600">
                        Pure: {account.pureBalance.toFixed(3)}g
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No metal accounts</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
