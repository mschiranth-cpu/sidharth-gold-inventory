/**
 * ============================================
 * EQUIPMENT MAINTENANCE PAGE
 * ============================================
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getEquipmentMaintenance,
  createEquipmentMaintenance,
} from '../../services/factory.service';
import Button from '../../components/common/Button';
import { formatIstDate } from '../../lib/dateUtils';

export default function EquipmentMaintenancePage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    equipmentId: '',
    maintenanceType: 'PREVENTIVE',
    description: '',
    cost: 0,
    performedBy: '',
    performedAt: new Date().toISOString().split('T')[0] || '',
    nextDueDate: '',
  });

  const { data: maintenanceLogs = [], isLoading } = useQuery({
    queryKey: ['equipment-maintenance'],
    queryFn: () => getEquipmentMaintenance(),
  });

  const createMutation = useMutation({
    mutationFn: createEquipmentMaintenance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-maintenance'] });
      setShowForm(false);
      setFormData({
        equipmentId: '',
        maintenanceType: 'PREVENTIVE',
        description: '',
        cost: 0,
        performedBy: '',
        performedAt: new Date().toISOString().split('T')[0] || '',
        nextDueDate: '',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      performedAt: new Date(formData.performedAt),
      nextDueDate: formData.nextDueDate ? new Date(formData.nextDueDate) : undefined,
    });
  };

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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Equipment Maintenance</h1>
            <p className="text-gray-600">Track equipment maintenance and servicing</p>
          </div>
          <Button variant="primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Log Maintenance'}
          </Button>
        </div>

        {showForm && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Log Maintenance</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Equipment ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.equipmentId}
                    onChange={(e) => setFormData({ ...formData, equipmentId: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Maintenance Type *
                  </label>
                  <select
                    required
                    value={formData.maintenanceType}
                    onChange={(e) => setFormData({ ...formData, maintenanceType: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="PREVENTIVE">Preventive</option>
                    <option value="CORRECTIVE">Corrective</option>
                    <option value="CALIBRATION">Calibration</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Cost (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Performed By
                  </label>
                  <input
                    type="text"
                    value={formData.performedBy}
                    onChange={(e) => setFormData({ ...formData, performedBy: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Performed At *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.performedAt}
                    onChange={(e) => setFormData({ ...formData, performedAt: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Next Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.nextDueDate}
                    onChange={(e) => setFormData({ ...formData, nextDueDate: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <Button type="submit" variant="primary" isLoading={createMutation.isPending}>
                Log Maintenance
              </Button>
            </form>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Maintenance History</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {maintenanceLogs.length === 0 ? (
              <p className="text-gray-500 text-center py-12">No maintenance records</p>
            ) : (
              maintenanceLogs.map((log: any) => (
                <div key={log.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{log.equipment?.name}</h3>
                      <p className="text-sm text-gray-600">{log.equipment?.itemCode}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        log.maintenanceType === 'PREVENTIVE'
                          ? 'bg-green-100 text-green-800'
                          : log.maintenanceType === 'CORRECTIVE'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {log.maintenanceType}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{log.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Performed: {formatIstDate(log.performedAt)}</span>
                    {log.performedBy && <span>By: {log.performedBy}</span>}
                    {log.cost && <span>Cost: ₹{log.cost.toLocaleString('en-IN')}</span>}
                    {log.nextDueDate && (
                      <span className="text-amber-600">
                        Next Due: {formatIstDate(log.nextDueDate)}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
