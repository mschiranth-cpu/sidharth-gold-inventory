/**
 * ============================================
 * ADD DIAMOND PAGE
 * ============================================
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createDiamond } from '../../services/diamond.service';
import Button from '../../components/common/Button';

export default function AddDiamondPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    stockNumber: '',
    caratWeight: 0,
    color: 'D',
    clarity: 'VVS1',
    cut: 'EXCELLENT',
    shape: 'ROUND',
    measurements: '',
    certificationLab: '',
    certNumber: '',
    pricePerCarat: 0,
  });

  const createMutation = useMutation({
    mutationFn: createDiamond,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diamonds'] });
      navigate('/app/inventory/diamonds');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Add Diamond</h1>
          <p className="text-gray-600">Add new diamond to inventory</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Stock Number *
                </label>
                <input
                  type="text"
                  required
                  value={formData.stockNumber}
                  onChange={(e) => setFormData({ ...formData, stockNumber: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Carat Weight *
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={formData.caratWeight}
                  onChange={(e) =>
                    setFormData({ ...formData, caratWeight: parseFloat(e.target.value) })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Shape *</label>
                <select
                  required
                  value={formData.shape}
                  onChange={(e) => setFormData({ ...formData, shape: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="ROUND">Round</option>
                  <option value="PRINCESS">Princess</option>
                  <option value="OVAL">Oval</option>
                  <option value="CUSHION">Cushion</option>
                  <option value="EMERALD">Emerald</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Color *</label>
                <select
                  required
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="D">D</option>
                  <option value="E">E</option>
                  <option value="F">F</option>
                  <option value="G">G</option>
                  <option value="H">H</option>
                  <option value="I">I</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Clarity *</label>
                <select
                  required
                  value={formData.clarity}
                  onChange={(e) => setFormData({ ...formData, clarity: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="FL">FL</option>
                  <option value="IF">IF</option>
                  <option value="VVS1">VVS1</option>
                  <option value="VVS2">VVS2</option>
                  <option value="VS1">VS1</option>
                  <option value="VS2">VS2</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Cut</label>
                <select
                  value={formData.cut}
                  onChange={(e) => setFormData({ ...formData, cut: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="EXCELLENT">Excellent</option>
                  <option value="VERY_GOOD">Very Good</option>
                  <option value="GOOD">Good</option>
                  <option value="FAIR">Fair</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Price per Carat (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.pricePerCarat}
                  onChange={(e) =>
                    setFormData({ ...formData, pricePerCarat: parseFloat(e.target.value) })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Certification Lab
                </label>
                <input
                  type="text"
                  value={formData.certificationLab}
                  onChange={(e) => setFormData({ ...formData, certificationLab: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="GIA, IGI, etc."
                />
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={() => navigate('/app/inventory/diamonds')}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={createMutation.isPending}
                className="flex-1"
              >
                Add Diamond
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
