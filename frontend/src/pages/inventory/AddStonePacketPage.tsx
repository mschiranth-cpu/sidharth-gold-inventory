/**
 * ============================================
 * ADD STONE PACKET PAGE
 * ============================================
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createStonePacket } from '../../services/stone.service';
import Button from '../../components/common/Button';

export default function AddStonePacketPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    packetNumber: '',
    stoneType: 'CZ',
    shape: 'ROUND',
    size: '2mm',
    color: 'WHITE',
    quality: 'AAA',
    totalWeight: 0,
    unit: 'CARAT',
    pricePerUnit: 0,
    reorderLevel: 0,
  });

  const createMutation = useMutation({
    mutationFn: createStonePacket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stone-packets'] });
      navigate('/app/inventory/stone-packets');
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Add Stone Packet</h1>
          <p className="text-gray-600">Add new stone packet to inventory</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Packet Number *
                </label>
                <input
                  type="text"
                  required
                  value={formData.packetNumber}
                  onChange={(e) => setFormData({ ...formData, packetNumber: e.target.value })}
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
                  <option value="CZ">CZ</option>
                  <option value="AMERICAN_DIAMOND">American Diamond</option>
                  <option value="KUNDAN">Kundan</option>
                  <option value="POLKI">Polki</option>
                  <option value="MOISSANITE">Moissanite</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Shape *</label>
                <input
                  type="text"
                  required
                  value={formData.shape}
                  onChange={(e) => setFormData({ ...formData, shape: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Size *</label>
                <input
                  type="text"
                  required
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                  placeholder="2mm, 3mm, etc."
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
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Quality</label>
                <select
                  value={formData.quality}
                  onChange={(e) => setFormData({ ...formData, quality: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="AAA">AAA</option>
                  <option value="AA">AA</option>
                  <option value="A">A</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Total Weight *
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={formData.totalWeight}
                  onChange={(e) =>
                    setFormData({ ...formData, totalWeight: parseFloat(e.target.value) })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Unit *</label>
                <select
                  required
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="CARAT">Carat</option>
                  <option value="GRAM">Gram</option>
                  <option value="PIECE">Piece</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Price per Unit (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.pricePerUnit}
                  onChange={(e) =>
                    setFormData({ ...formData, pricePerUnit: parseFloat(e.target.value) })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Reorder Level
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.reorderLevel}
                  onChange={(e) =>
                    setFormData({ ...formData, reorderLevel: parseFloat(e.target.value) })
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
                onClick={() => navigate('/app/inventory/stone-packets')}
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
                Add Packet
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
