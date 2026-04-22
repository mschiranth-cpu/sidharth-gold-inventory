/**
 * ============================================
 * LANDING PAGE
 * ============================================
 * Main landing page with company info and CTAs
 */

import { Link } from 'react-router-dom';
import {
  SparklesIcon,
  CubeIcon,
  ChartBarIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                <SparklesIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Sidharth Gold Inventory</h1>
                <p className="text-xs text-gray-600">Factory Management System</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Staff Login
              </Link>
              <Link
                to="/client/login"
                className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                Client Login
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl mb-6 shadow-2xl">
            <SparklesIcon className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Welcome to{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              Sidharth Gold
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            A comprehensive factory management system for gold jewelry manufacturing. Track orders,
            manage departments, and streamline your production workflow with ease.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/client/register"
              className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
            >
              <UserGroupIcon className="w-6 h-6" />
              Register as Client
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 bg-white text-gray-900 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 border-2 border-gray-200"
            >
              Staff Login
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Why Choose Sidharth Gold?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Our comprehensive system helps you manage every aspect of your gold jewelry
            manufacturing process
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
            <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
              <CubeIcon className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Order Management</h3>
            <p className="text-gray-600">
              Create and track orders through all 9 departments - from CAD design to final
              submission. Real-time status updates and comprehensive order history.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
            <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
              <ChartBarIcon className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Factory Tracking</h3>
            <p className="text-gray-600">
              Visual Kanban board for tracking orders across departments. Drag-and-drop interface
              for easy order movement and assignment management.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
            <div className="w-14 h-14 bg-pink-100 rounded-xl flex items-center justify-center mb-4">
              <UserGroupIcon className="w-8 h-8 text-pink-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Worker Management</h3>
            <p className="text-gray-600">
              Assign tasks to department workers, track work progress, and manage submissions with
              photo documentation and quality checks.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-4">
              <ShieldCheckIcon className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Quality Control</h3>
            <p className="text-gray-600">
              Department-specific work requirements, photo documentation, file uploads, and admin
              approval workflows ensure quality at every step.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
            <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center mb-4">
              <ClockIcon className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Real-time Updates</h3>
            <p className="text-gray-600">
              Live notifications, activity logs, and instant updates keep everyone informed about
              order progress and important changes.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <SparklesIcon className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Client Portal</h3>
            <p className="text-gray-600">
              Clients can register, place orders, track progress, and communicate with the factory
              team through a dedicated portal.
            </p>
          </div>
        </div>
      </section>

      {/* Departments Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 shadow-xl border border-gray-100">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              9-Department Production Flow
            </h2>
            <p className="text-lg text-gray-600">
              Every order goes through our comprehensive production pipeline
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { name: 'CAD Design', icon: '🎨' },
              { name: '3D Print', icon: '🖨️' },
              { name: 'Casting', icon: '🔥' },
              { name: 'Filling', icon: '⚒️' },
              { name: 'Meena Work', icon: '🎭' },
              { name: 'Polish 1', icon: '✨' },
              { name: 'Stone Setting', icon: '💎' },
              { name: 'Polish 2', icon: '✨' },
              { name: 'Finishing Touch', icon: '🎯' },
            ].map((dept, index) => (
              <div
                key={dept.name}
                className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 text-center border border-indigo-100"
              >
                <div className="text-3xl mb-2">{dept.icon}</div>
                <div className="text-xs font-semibold text-gray-500 mb-1">Step {index + 1}</div>
                <div className="text-sm font-bold text-gray-900">{dept.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-12 text-center shadow-2xl">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
            Join our platform today and experience seamless gold jewelry manufacturing management
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/client/register"
              className="px-8 py-4 bg-white text-indigo-600 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
            >
              <UserGroupIcon className="w-6 h-6" />
              Register as Client
            </Link>
            <Link
              to="/client/login"
              className="px-8 py-4 bg-indigo-700 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 border-2 border-indigo-500"
            >
              Already a Client? Login
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-md border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <SparklesIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-bold text-gray-900">Sidharth Gold Inventory</div>
                <div className="text-xs text-gray-600">Factory Management System</div>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              © 2026 Gold Factory Inventory System. All rights reserved.
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900">
                Staff Login
              </Link>
              <Link to="/client/login" className="text-sm text-gray-600 hover:text-gray-900">
                Client Login
              </Link>
              <Link
                to="/client/register"
                className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
