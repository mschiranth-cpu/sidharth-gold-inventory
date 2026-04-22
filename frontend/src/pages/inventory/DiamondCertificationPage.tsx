/**
 * ============================================
 * DIAMOND CERTIFICATION PAGE
 * ============================================
 */

import { useQuery } from '@tanstack/react-query';
import { getAllDiamonds } from '../../services/diamond.service';
import Button from '../../components/common/Button';

export default function DiamondCertificationPage() {
  const { data: diamonds = [], isLoading } = useQuery({
    queryKey: ['diamonds-certified'],
    queryFn: () => getAllDiamonds({}),
  });

  const certifiedDiamonds = diamonds.filter((d: any) => d.certificationLab);
  const uncertifiedDiamonds = diamonds.filter((d: any) => !d.certificationLab);

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Diamond Certification</h1>
          <p className="text-gray-600">View certified and uncertified diamonds</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Total Diamonds</p>
            <p className="text-3xl font-bold text-gray-900">{diamonds.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Certified</p>
            <p className="text-3xl font-bold text-green-600">{certifiedDiamonds.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Uncertified</p>
            <p className="text-3xl font-bold text-amber-600">{uncertifiedDiamonds.length}</p>
          </div>
        </div>

        {/* Certified Diamonds */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Certified Diamonds</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {certifiedDiamonds.map((diamond: any) => (
              <div key={diamond.id} className="p-4 bg-green-50 rounded-xl border border-green-200">
                <h3 className="font-bold text-gray-900 mb-2">{diamond.stockNumber}</h3>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-700">
                    {diamond.caratWeight}ct - {diamond.color} {diamond.clarity}
                  </p>
                  <p className="text-green-700 font-semibold">{diamond.certificationLab}</p>
                  {diamond.certNumber && (
                    <p className="text-xs text-green-600">Cert #: {diamond.certNumber}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Uncertified Diamonds */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Uncertified Diamonds</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {uncertifiedDiamonds.map((diamond: any) => (
              <div key={diamond.id} className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                <h3 className="font-bold text-gray-900 mb-2">{diamond.stockNumber}</h3>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-700">
                    {diamond.caratWeight}ct - {diamond.color} {diamond.clarity}
                  </p>
                  <p className="text-amber-700 font-semibold">No Certification</p>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-3">
                  Add Certification
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
