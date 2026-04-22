/**
 * ============================================
 * ADD REAL STONE PAGE
 * ============================================
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createRealStone } from '../../services/stone.service';
import Button from '../../components/common/Button';

export default function AddRealStonePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    stockNumber: '',
    stoneType: 'RUBY',
    caratWeight: 0,
    shape: 'OVAL',
    color: '',
    clarity: '',
    origin: '',
    treatment: 'NONE',
    pricePerCarat: 0,
  });

  const createMutation = useMutation({
    mutationFn: createRealStone,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['real-stones'] });
      navigate('/app/inventory/real-stones');
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Add Real Stone</h1>
          <p className="text-gray-600">Add precious stone to inventory</p>
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Stone Type *
                </label>
                <select
                  required
                  value={formData.stoneType}
                  onChange={(e) => setFormData({ ...formData, stoneType: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="RUBY">Ruby</option>
                  <option value="EMERALD">Emerald</option>
                  <option value="BLUE_SAPPHIRE">Blue Sapphire</option>
                  <option value="YELLOW_SAPPHIRE">Yellow Sapphire</option>
                  <option value="PINK_SAPPHIRE">Pink Sapphire</option>
                </select>
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Shape *</label>
                <input
                  type="text"
                  required
                  value={formData.shape}
                  onChange={(e) => setFormData({ ...formData, shape: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                  placeholder="Oval, Round, Cushion, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Color *</label>
                <input
                  type="text"
                  required
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                  placeholder="Pigeon Blood, Royal Blue, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Origin</label>
                <input
                  type="text"
                  value={formData.origin}
                  onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                  placeholder="Burma, Colombia, Kashmir, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Treatment</label>
                <select
                  value={formData.treatment}
                  onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="NONE">None</option>
                  <option value="HEATED">Heated</option>
                  <option value="FILLED">Filled</option>
                  <option value="IRRADIATED">Irradiated</option>
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={() => navigate('/app/inventory/real-stones')}
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
                Add Stone
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
