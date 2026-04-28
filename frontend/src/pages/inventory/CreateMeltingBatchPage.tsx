/**
 * ============================================
 * CREATE MELTING BATCH PAGE
 * ============================================
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createMeltingBatch } from '../../services/metal.service';
import Button from '../../components/common/Button';

export default function CreateMeltingBatchPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [inputMetals, setInputMetals] = useState([{ purity: 22, weight: 0, form: 'SCRAP' }]);
  const [outputData, setOutputData] = useState({
    outputPurity: 22,
    outputWeight: 0,
    outputForm: 'BAR',
    notes: '',
  });

  const createMutation = useMutation({
    mutationFn: createMeltingBatch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['melting-batches'] });
      navigate('/app/inventory/metal/melting');
    },
  });

  const addInputMetal = () => {
    setInputMetals([...inputMetals, { purity: 22, weight: 0, form: 'SCRAP' }]);
  };

  const removeInputMetal = (index: number) => {
    setInputMetals(inputMetals.filter((_, i) => i !== index));
  };

  const updateInputMetal = (index: number, field: string, value: any) => {
    const updated = [...inputMetals];
    const cur = updated[index];
    if (!cur) return;
    updated[index] = { ...cur, [field]: value };
    setInputMetals(updated);
  };

  const totalInputWeight = inputMetals.reduce((sum, m) => sum + m.weight, 0);
  const wastageWeight = totalInputWeight - outputData.outputWeight;
  const wastagePercent = totalInputWeight > 0 ? (wastageWeight / totalInputWeight) * 100 : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      inputMetals,
      outputPurity: outputData.outputPurity,
      outputWeight: outputData.outputWeight,
      outputForm: outputData.outputForm,
      notes: outputData.notes,
    });
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-onyx-900 mb-2">Create Melting Batch</h1>
          <p className="text-onyx-500">Record melting process with wastage tracking</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 border border-champagne-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Input Metals */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-onyx-900">Input Metals</h3>
                <Button type="button" variant="secondary" size="sm" onClick={addInputMetal}>
                  + Add Metal
                </Button>
              </div>

              <div className="space-y-3">
                {inputMetals.map((metal, index) => (
                  <div key={index} className="flex gap-3 items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-semibold text-onyx-700 mb-2">
                        Purity
                      </label>
                      <select
                        value={metal.purity}
                        onChange={(e) =>
                          updateInputMetal(index, 'purity', parseFloat(e.target.value))
                        }
                        className="w-full px-4 py-3 rounded-xl border border-champagne-300 focus:ring-2 focus:ring-champagne-500"
                      >
                        <option value="24">24K</option>
                        <option value="22">22K</option>
                        <option value="18">18K</option>
                        <option value="14">14K</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-semibold text-onyx-700 mb-2">
                        Weight (g)
                      </label>
                      <input
                        type="number"
                        step="0.001"
                        value={metal.weight}
                        onChange={(e) =>
                          updateInputMetal(index, 'weight', parseFloat(e.target.value))
                        }
                        className="w-full px-4 py-3 rounded-xl border border-champagne-300 focus:ring-2 focus:ring-champagne-500"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-semibold text-onyx-700 mb-2">Form</label>
                      <select
                        value={metal.form}
                        onChange={(e) => updateInputMetal(index, 'form', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-champagne-300 focus:ring-2 focus:ring-champagne-500"
                      >
                        <option value="SCRAP">Scrap</option>
                        <option value="BAR">Bar</option>
                        <option value="WIRE">Wire</option>
                      </select>
                    </div>
                    {inputMetals.length > 1 && (
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => removeInputMetal(index)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-4 p-4 bg-champagne-50 rounded-xl">
                <p className="text-sm text-onyx-700">
                  Total Input Weight:{' '}
                  <span className="font-bold">{totalInputWeight.toFixed(3)}g</span>
                </p>
              </div>
            </div>

            {/* Output Metal */}
            <div className="border-t border-champagne-200 pt-6">
              <h3 className="text-lg font-semibold text-onyx-900 mb-4">Output Metal</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-onyx-700 mb-2">
                    Output Purity *
                  </label>
                  <select
                    required
                    value={outputData.outputPurity}
                    onChange={(e) =>
                      setOutputData({ ...outputData, outputPurity: parseFloat(e.target.value) })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-champagne-300 focus:ring-2 focus:ring-champagne-500"
                  >
                    <option value="24">24K</option>
                    <option value="22">22K</option>
                    <option value="18">18K</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-onyx-700 mb-2">
                    Output Weight (g) *
                  </label>
                  <input
                    type="number"
                    required
                    step="0.001"
                    value={outputData.outputWeight}
                    onChange={(e) =>
                      setOutputData({ ...outputData, outputWeight: parseFloat(e.target.value) })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-champagne-300 focus:ring-2 focus:ring-champagne-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-onyx-700 mb-2">
                    Output Form *
                  </label>
                  <select
                    required
                    value={outputData.outputForm}
                    onChange={(e) => setOutputData({ ...outputData, outputForm: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-champagne-300 focus:ring-2 focus:ring-champagne-500"
                  >
                    <option value="BAR">Bar</option>
                    <option value="WIRE">Wire</option>
                    <option value="SHEET">Sheet</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Wastage Calculation */}
            <div
              className={`p-4 rounded-xl ${
                wastagePercent > 2
                  ? 'bg-red-50 border border-accent-ruby/30'
                  : 'bg-green-50 border border-emerald-200'
              }`}
            >
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-onyx-500">Wastage Weight</p>
                  <p className="text-2xl font-bold text-onyx-900">{wastageWeight.toFixed(3)}g</p>
                </div>
                <div>
                  <p className="text-sm text-onyx-500">Wastage %</p>
                  <p
                    className={`text-2xl font-bold ${
                      wastagePercent > 2 ? 'text-accent-ruby' : 'text-accent-emerald'
                    }`}
                  >
                    {wastagePercent.toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-onyx-500">Output Weight</p>
                  <p className="text-2xl font-bold text-onyx-900">
                    {outputData.outputWeight.toFixed(3)}g
                  </p>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-onyx-700 mb-2">Notes</label>
              <textarea
                rows={3}
                value={outputData.notes}
                onChange={(e) => setOutputData({ ...outputData, notes: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-champagne-300 focus:ring-2 focus:ring-champagne-500"
              />
            </div>

            <div className="flex gap-4 pt-6">
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={() => navigate('/app/inventory/metal/melting')}
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
                Create Batch
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
