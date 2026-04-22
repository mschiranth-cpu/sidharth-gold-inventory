/**
 * ============================================
 * DIAMOND DETAIL PAGE
 * ============================================
 */

import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getDiamondById } from '../../services/diamond.service';
import Button from '../../components/common/Button';

export default function DiamondDetailPage() {
  const { diamondId } = useParams<{ diamondId: string }>();

  const { data: diamond, isLoading } = useQuery({
    queryKey: ['diamond', diamondId],
    queryFn: () => getDiamondById(diamondId!),
    enabled: !!diamondId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!diamond) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <p className="text-gray-500 text-lg">Diamond not found</p>
            <Link to="/app/inventory/diamonds" className="mt-4 inline-block">
              <Button variant="primary">Back to Diamonds</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link
            to="/app/inventory/diamonds"
            className="text-indigo-600 hover:text-indigo-700 font-medium text-sm mb-4 inline-flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Diamonds
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">{diamond.stockNumber}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6">4C Specifications</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Carat</p>
                  <p className="text-2xl font-bold text-gray-900">{diamond.caratWeight}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Color</p>
                  <p className="text-2xl font-bold text-gray-900">{diamond.color}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Clarity</p>
                  <p className="text-2xl font-bold text-gray-900">{diamond.clarity}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Cut</p>
                  <p className="text-2xl font-bold text-gray-900">{diamond.cut || '-'}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Additional Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Shape</p>
                  <p className="font-semibold text-gray-900">{diamond.shape}</p>
                </div>
                {diamond.measurements && (
                  <div>
                    <p className="text-sm text-gray-600">Measurements</p>
                    <p className="font-semibold text-gray-900">{diamond.measurements}</p>
                  </div>
                )}
                {diamond.certificationLab && (
                  <div className="col-span-2 p-4 bg-blue-50 rounded-xl">
                    <p className="text-sm font-semibold text-blue-900">Certification</p>
                    <p className="text-blue-700">{diamond.certificationLab}</p>
                    {diamond.certNumber && (
                      <p className="text-sm text-blue-600 mt-1">Cert #: {diamond.certNumber}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4">Pricing</h3>
              {diamond.pricePerCarat && (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Price per Carat</p>
                    <p className="text-lg font-bold text-gray-900">
                      ₹{diamond.pricePerCarat.toLocaleString('en-IN')}
                    </p>
                  </div>
                  {diamond.totalPrice && (
                    <div>
                      <p className="text-sm text-gray-600">Total Price</p>
                      <p className="text-2xl font-bold text-green-600">
                        ₹{diamond.totalPrice.toLocaleString('en-IN')}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4">Status</h3>
              <span
                className={`inline-flex px-4 py-2 rounded-xl text-sm font-semibold ${
                  diamond.status === 'IN_STOCK'
                    ? 'bg-green-100 text-green-800'
                    : diamond.status === 'ISSUED'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {diamond.status}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
