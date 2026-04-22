/**
 * ============================================
 * ISSUE DIAMOND PAGE
 * ============================================
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { issueDiamond, getAllDiamonds } from '../../services/diamond.service';
import Button from '../../components/common/Button';

export default function IssueDiamondPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    diamondId: '',
    orderId: '',
    notes: '',
  });

  const { data: diamonds = [] } = useQuery({
    queryKey: ['diamonds-available'],
    queryFn: () => getAllDiamonds({ status: 'IN_STOCK' }),
  });

  const issueMutation = useMutation({
    mutationFn: issueDiamond,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diamonds'] });
      navigate('/app/inventory/diamonds');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    issueMutation.mutate(formData);
  };

  const selectedDiamond = diamonds.find((d: any) => d.id === formData.diamondId);

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Issue Diamond</h1>
          <p className="text-gray-600">Issue diamond to an order</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Diamond *
              </label>
              <select
                required
                value={formData.diamondId}
                onChange={(e) => setFormData({ ...formData, diamondId: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select diamond</option>
                {diamonds.map((diamond: any) => (
                  <option key={diamond.id} value={diamond.id}>
                    {diamond.stockNumber} - {diamond.caratWeight}ct {diamond.color}{' '}
                    {diamond.clarity}
                  </option>
                ))}
              </select>
            </div>

            {selectedDiamond && (
              <div className="p-4 bg-blue-50 rounded-xl">
                <h4 className="font-semibold text-blue-900 mb-2">Selected Diamond</h4>
                <div className="grid grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-blue-600">Carat</p>
                    <p className="font-bold text-blue-900">{selectedDiamond.caratWeight}</p>
                  </div>
                  <div>
                    <p className="text-blue-600">Color</p>
                    <p className="font-bold text-blue-900">{selectedDiamond.color}</p>
                  </div>
                  <div>
                    <p className="text-blue-600">Clarity</p>
                    <p className="font-bold text-blue-900">{selectedDiamond.clarity}</p>
                  </div>
                  <div>
                    <p className="text-blue-600">Shape</p>
                    <p className="font-bold text-blue-900">{selectedDiamond.shape}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Order ID *</label>
              <input
                type="text"
                required
                value={formData.orderId}
                onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter order ID"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
              />
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
                isLoading={issueMutation.isPending}
                disabled={!formData.diamondId || !formData.orderId}
                className="flex-1"
              >
                Issue Diamond
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
