/**
 * ============================================
 * RATE MANAGEMENT PAGE
 * ============================================
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCurrentMetalRates, createMetalRate } from '../../services/metal.service';
import Button from '../../components/common/Button';

export default function RateManagementPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    metalType: 'GOLD',
    purity: 22,
    ratePerGram: 0,
    effectiveDate: new Date().toISOString().split('T')[0],
    source: 'MANUAL',
  });

  const { data: rates = [], isLoading } = useQuery({
    queryKey: ['metal-rates'],
    queryFn: getCurrentMetalRates,
  });

  const createMutation = useMutation({
    mutationFn: createMetalRate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metal-rates'] });
      setShowForm(false);
      setFormData({
        metalType: 'GOLD',
        purity: 22,
        ratePerGram: 0,
        effectiveDate: new Date().toISOString().split('T')[0],
        source: 'MANUAL',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      effectiveDate: new Date(formData.effectiveDate),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-champagne-700"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-onyx-900 mb-2">Rate Management</h1>
            <p className="text-onyx-500">Manage metal rates</p>
          </div>
          <Button variant="primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Add Rate'}
          </Button>
        </div>

        {/* Add Rate Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-champagne-100 mb-6">
            <h2 className="text-xl font-bold text-onyx-900 mb-4">Add New Rate</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-onyx-700 mb-2">
                    Metal Type *
                  </label>
                  <select
                    required
                    value={formData.metalType}
                    onChange={(e) => setFormData({ ...formData, metalType: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-champagne-300 focus:ring-2 focus:ring-champagne-500"
                  >
                    <option value="GOLD">Gold</option>
                    <option value="SILVER">Silver</option>
                    <option value="PLATINUM">Platinum</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-onyx-700 mb-2">Purity *</label>
                  <select
                    required
                    value={formData.purity}
                    onChange={(e) =>
                      setFormData({ ...formData, purity: parseFloat(e.target.value) })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-champagne-300 focus:ring-2 focus:ring-champagne-500"
                  >
                    <option value="24">24K</option>
                    <option value="22">22K</option>
                    <option value="18">18K</option>
                    <option value="14">14K</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-onyx-700 mb-2">
                    Rate/Gram (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={formData.ratePerGram}
                    onChange={(e) =>
                      setFormData({ ...formData, ratePerGram: parseFloat(e.target.value) })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-champagne-300 focus:ring-2 focus:ring-champagne-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-onyx-700 mb-2">
                    Effective Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.effectiveDate}
                    onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-champagne-300 focus:ring-2 focus:ring-champagne-500"
                  />
                </div>
              </div>
              <Button type="submit" variant="primary" isLoading={createMutation.isPending}>
                Save Rate
              </Button>
            </form>
          </div>
        )}

        {/* Current Rates */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-champagne-100">
          <h2 className="text-xl font-bold text-onyx-900 mb-6">Current Rates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {rates.map((rate: any) => (
              <div
                key={rate.id}
                className="p-6 bg-gradient-to-br from-amber-50 to-amber-50 rounded-xl border border-amber-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-onyx-700">{rate.metalType}</p>
                  <span className="px-2 py-1 bg-amber-200 text-amber-800 rounded-lg text-xs font-semibold">
                    {rate.purity}K
                  </span>
                </div>
                <p className="text-3xl font-bold text-onyx-900 mb-1">
                  ₹{rate.ratePerGram.toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-onyx-500">per gram</p>
                <p className="text-xs text-onyx-400 mt-2">
                  {new Date(rate.effectiveDate).toLocaleDateString('en-IN')}
                </p>
                {rate.source && <p className="text-xs text-onyx-400 mt-1">Source: {rate.source}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
