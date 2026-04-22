/**
 * ============================================
 * ADVANCES & LOANS REPORT PAGE
 * ============================================
 */

import Button from '../../components/common/Button';

export default function AdvancesLoansReportPage() {
  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Advances & Loans Report</h1>
            <p className="text-gray-600">Track employee advances and loans</p>
          </div>
          <Button variant="primary">Export Report</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Active Advances</h2>
            <p className="text-gray-500 text-center py-8">No active advances</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Active Loans</h2>
            <p className="text-gray-500 text-center py-8">No active loans</p>
          </div>
        </div>
      </div>
    </div>
  );
}
