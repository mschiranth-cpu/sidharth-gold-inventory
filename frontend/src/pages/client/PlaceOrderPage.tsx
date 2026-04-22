/**
 * ============================================
 * CLIENT PLACE ORDER PAGE
 * ============================================
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClientOrder } from '../../services/clients.service';
import Button from '../../components/common/Button';

export default function PlaceOrderPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    productType: '',
    purity: 22,
    goldColor: 'YELLOW',
    metalType: 'GOLD',
    quantity: 1,
    size: '',
    goldWeightInitial: 0,
    dueDate: '',
    specialInstructions: '',
    additionalDescription: '',
    referenceImages: [] as string[],
  });

  const createOrderMutation = useMutation({
    mutationFn: createClientOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-orders'] });
      navigate('/client/orders');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createOrderMutation.mutate({
      ...formData,
      dueDate: new Date(formData.dueDate),
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Place New Order</h1>
          <p className="text-gray-600">Fill in the details for your custom jewelry order</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          {createOrderMutation.isError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {(createOrderMutation.error as any)?.response?.data?.error?.message ||
                'Failed to create order'}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Details */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Product Details */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Product Type *
                  </label>
                  <select
                    required
                    value={formData.productType}
                    onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Select type</option>
                    <option value="RING">Ring</option>
                    <option value="NECKLACE">Necklace</option>
                    <option value="BANGLE">Bangle</option>
                    <option value="EARRING">Earring</option>
                    <option value="PENDANT">Pendant</option>
                    <option value="BRACELET">Bracelet</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: parseInt(e.target.value) })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Metal Specifications */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Metal Specifications</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Metal Type *
                  </label>
                  <select
                    value={formData.metalType}
                    onChange={(e) => setFormData({ ...formData, metalType: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="GOLD">Gold</option>
                    <option value="SILVER">Silver</option>
                    <option value="PLATINUM">Platinum</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Purity (Karat) *
                  </label>
                  <select
                    value={formData.purity}
                    onChange={(e) =>
                      setFormData({ ...formData, purity: parseFloat(e.target.value) })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="24">24K</option>
                    <option value="22">22K</option>
                    <option value="18">18K</option>
                    <option value="14">14K</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Gold Color
                  </label>
                  <select
                    value={formData.goldColor}
                    onChange={(e) => setFormData({ ...formData, goldColor: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="YELLOW">Yellow Gold</option>
                    <option value="WHITE">White Gold</option>
                    <option value="ROSE">Rose Gold</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Approx. Weight (grams)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.goldWeightInitial}
                    onChange={(e) =>
                      setFormData({ ...formData, goldWeightInitial: parseFloat(e.target.value) })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Size</label>
                  <input
                    type="text"
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., 7, 2.6, 18 inches"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Special Instructions
                  </label>
                  <textarea
                    rows={3}
                    value={formData.specialInstructions}
                    onChange={(e) =>
                      setFormData({ ...formData, specialInstructions: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Any specific requirements or design preferences..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={formData.additionalDescription}
                    onChange={(e) =>
                      setFormData({ ...formData, additionalDescription: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Describe the product you want..."
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6">
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={() => navigate('/client/dashboard')}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={createOrderMutation.isPending}
                className="flex-1"
              >
                Submit Order
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
