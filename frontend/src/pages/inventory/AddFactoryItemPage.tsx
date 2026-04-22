/**
 * ============================================
 * ADD FACTORY ITEM PAGE
 * ============================================
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { createFactoryItem, getAllCategories } from '../../services/factory.service';
import Button from '../../components/common/Button';

export default function AddFactoryItemPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    itemCode: '',
    name: '',
    description: '',
    categoryId: '',
    unit: 'PCS',
    minStock: 0,
    maxStock: 0,
    reorderQty: 0,
    location: '',
    isEquipment: false,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['factory-categories'],
    queryFn: getAllCategories,
  });

  const createMutation = useMutation({
    mutationFn: createFactoryItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['factory-items'] });
      navigate('/app/inventory/factory');
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Add Factory Item</h1>
          <p className="text-gray-600">Add new item to factory inventory</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Item Code *
                </label>
                <input
                  type="text"
                  required
                  value={formData.itemCode}
                  onChange={(e) => setFormData({ ...formData, itemCode: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                <select
                  required
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select category</option>
                  {categories.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Unit *</label>
                <select
                  required
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="PCS">Pieces</option>
                  <option value="KG">Kilograms</option>
                  <option value="LITER">Liters</option>
                  <option value="METER">Meters</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Min Stock</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.minStock}
                  onChange={(e) =>
                    setFormData({ ...formData, minStock: parseFloat(e.target.value) })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Max Stock</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.maxStock}
                  onChange={(e) =>
                    setFormData({ ...formData, maxStock: parseFloat(e.target.value) })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Reorder Quantity
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.reorderQty}
                  onChange={(e) =>
                    setFormData({ ...formData, reorderQty: parseFloat(e.target.value) })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isEquipment}
                    onChange={(e) => setFormData({ ...formData, isEquipment: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm font-semibold text-gray-700">
                    This is equipment (requires maintenance tracking)
                  </span>
                </label>
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={() => navigate('/app/inventory/factory')}
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
                Add Item
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
