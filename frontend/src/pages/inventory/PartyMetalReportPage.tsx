/**
 * ============================================
 * PARTY METAL REPORT PAGE
 * ============================================
 */

import { useQuery } from '@tanstack/react-query';
import { getAllParties } from '../../services/party.service';
import Button from '../../components/common/Button';

export default function PartyMetalReportPage() {
  const { data: parties = [], isLoading } = useQuery({
    queryKey: ['parties-report'],
    queryFn: () => getAllParties({}),
  });

  const totalParties = parties.length;
  const partiesWithBalance = parties.filter(
    (p: any) => p.metalAccounts && p.metalAccounts.length > 0
  ).length;

  const totalGrossBalance = parties.reduce(
    (sum: number, p: any) =>
      sum + (p.metalAccounts?.reduce((s: number, a: any) => s + a.grossBalance, 0) || 0),
    0
  );

  const totalPureBalance = parties.reduce(
    (sum: number, p: any) =>
      sum + (p.metalAccounts?.reduce((s: number, a: any) => s + a.pureBalance, 0) || 0),
    0
  );

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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Party Metal Report</h1>
            <p className="text-gray-600">Comprehensive party metal analysis</p>
          </div>
          <Button variant="primary">Export Report</Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Total Parties</p>
            <p className="text-3xl font-bold text-gray-900">{totalParties}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">With Balance</p>
            <p className="text-3xl font-bold text-blue-600">{partiesWithBalance}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Total Gross</p>
            <p className="text-2xl font-bold text-gray-900">{totalGrossBalance.toFixed(2)}g</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Total Pure</p>
            <p className="text-2xl font-bold text-green-600">{totalPureBalance.toFixed(2)}g</p>
          </div>
        </div>

        {/* Party-wise Balances */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Party-wise Metal Balances</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Party Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Accounts
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total Gross
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total Pure
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {parties.map((party: any) => {
                  const grossBalance =
                    party.metalAccounts?.reduce((sum: number, a: any) => sum + a.grossBalance, 0) ||
                    0;
                  const pureBalance =
                    party.metalAccounts?.reduce((sum: number, a: any) => sum + a.pureBalance, 0) ||
                    0;

                  return (
                    <tr key={party.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                        {party.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">{party.type}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        {party.metalAccounts?.length || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                        {grossBalance.toFixed(2)}g
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-semibold text-green-600">
                        {pureBalance.toFixed(2)}g
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
