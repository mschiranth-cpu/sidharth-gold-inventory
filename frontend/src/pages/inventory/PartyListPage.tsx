/**
 * ============================================
 * PARTY LIST PAGE
 * ============================================
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getAllParties } from '../../services/party.service';
import Button from '../../components/common/Button';

export default function PartyListPage() {
  const [search, setSearch] = useState('');

  const { data: parties = [], isLoading } = useQuery({
    queryKey: ['parties', search],
    queryFn: () => getAllParties({ search }),
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Party Metal Inventory</h1>
            <p className="text-gray-600">Manage customer metal accounts</p>
          </div>
          <Button
            variant="primary"
            iconLeft={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            }
          >
            Add Party
          </Button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100 mb-6">
          <input
            type="text"
            placeholder="Search parties..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Parties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {parties.map((party: any) => (
            <Link
              key={party.id}
              to={`/inventory/parties/${party.id}`}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:border-indigo-300 hover:shadow-xl transition-all"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-2">{party.name}</h3>
              <p className="text-sm text-gray-600 mb-4">{party.type}</p>

              {party.metalAccounts && party.metalAccounts.length > 0 && (
                <div className="space-y-2">
                  {party.metalAccounts.slice(0, 2).map((account: any) => (
                    <div key={account.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {account.metalType} ({account.purity}K)
                      </span>
                      <span className="font-semibold text-gray-900">
                        {account.grossBalance.toFixed(2)}g
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 flex items-center text-indigo-600 font-medium text-sm">
                View Details
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
