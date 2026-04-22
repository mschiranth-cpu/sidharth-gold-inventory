/**
 * ============================================
 * FACTORY INVENTORY REPORT PAGE
 * ============================================
 */

import { useQuery } from '@tanstack/react-query';
import { getAllFactoryItems } from '../../services/factory.service';
import Button from '../../components/common/Button';

export default function FactoryInventoryReportPage() {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['factory-items-report'],
    queryFn: () => getAllFactoryItems({}),
  });

  const lowStockItems = items.filter((i: any) => i.minStock && i.currentStock < i.minStock);
  const equipmentItems = items.filter((i: any) => i.isEquipment);
  const consumableItems = items.filter((i: any) => !i.isEquipment);

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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Factory Inventory Report</h1>
            <p className="text-gray-600">Comprehensive factory inventory analysis</p>
          </div>
          <Button variant="primary">Export Report</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Total Items</p>
            <p className="text-3xl font-bold text-gray-900">{items.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Equipment</p>
            <p className="text-3xl font-bold text-blue-600">{equipmentItems.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Consumables</p>
            <p className="text-3xl font-bold text-green-600">{consumableItems.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Low Stock</p>
            <p className="text-3xl font-bold text-red-600">{lowStockItems.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Inventory Details</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Item Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Current Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Min Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                      {item.itemCode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">{item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {item.category?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`font-semibold ${
                          item.minStock && item.currentStock < item.minStock
                            ? 'text-red-600'
                            : 'text-green-600'
                        }`}
                      >
                        {item.currentStock} {item.unit}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                      {item.minStock || '-'} {item.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          item.isEquipment
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {item.isEquipment ? 'Equipment' : 'Consumable'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.minStock && item.currentStock < item.minStock ? (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                          Low Stock
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          In Stock
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
