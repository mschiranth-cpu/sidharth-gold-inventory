/**
 * ============================================
 * DIAMOND INVENTORY REPORT PAGE
 * ============================================
 */

import { useQuery } from '@tanstack/react-query';
import { getAllDiamonds } from '../../services/diamond.service';
import Button from '../../components/common/Button';

export default function DiamondInventoryReportPage() {
  const { data: diamonds = [], isLoading } = useQuery({
    queryKey: ['diamonds-report'],
    queryFn: () => getAllDiamonds({}),
  });

  const byShape = diamonds.reduce((acc: any, d: any) => {
    acc[d.shape] = (acc[d.shape] || 0) + 1;
    return acc;
  }, {});

  const byColor = diamonds.reduce((acc: any, d: any) => {
    acc[d.color] = (acc[d.color] || 0) + 1;
    return acc;
  }, {});

  const byClarity = diamonds.reduce((acc: any, d: any) => {
    acc[d.clarity] = (acc[d.clarity] || 0) + 1;
    return acc;
  }, {});

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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Diamond Inventory Report</h1>
            <p className="text-gray-600">Comprehensive diamond inventory analysis</p>
          </div>
          <Button variant="primary">Export Report</Button>
        </div>

        {/* By Shape */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Diamonds by Shape</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Object.entries(byShape).map(([shape, count]) => (
              <div key={shape} className="p-4 bg-gray-50 rounded-xl text-center">
                <p className="text-sm text-gray-600 mb-1">{shape}</p>
                <p className="text-2xl font-bold text-gray-900">{count as number}</p>
              </div>
            ))}
          </div>
        </div>

        {/* By Color */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Diamonds by Color</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Object.entries(byColor).map(([color, count]) => (
              <div key={color} className="p-4 bg-gray-50 rounded-xl text-center">
                <p className="text-sm text-gray-600 mb-1">{color}</p>
                <p className="text-2xl font-bold text-gray-900">{count as number}</p>
              </div>
            ))}
          </div>
        </div>

        {/* By Clarity */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Diamonds by Clarity</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Object.entries(byClarity).map(([clarity, count]) => (
              <div key={clarity} className="p-4 bg-gray-50 rounded-xl text-center">
                <p className="text-sm text-gray-600 mb-1">{clarity}</p>
                <p className="text-2xl font-bold text-gray-900">{count as number}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
