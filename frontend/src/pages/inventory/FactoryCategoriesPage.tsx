/**
 * ============================================
 * FACTORY CATEGORIES PAGE
 * ============================================
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllCategories, createCategory } from '../../services/factory.service';
import Button from '../../components/common/Button';

export default function FactoryCategoriesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parentId: '',
  });

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['factory-categories'],
    queryFn: getAllCategories,
  });

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['factory-categories'] });
      setShowForm(false);
      setFormData({ name: '', description: '', parentId: '' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
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
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Item Categories</h1>
            <p className="text-gray-600">Manage factory inventory categories</p>
          </div>
          <Button variant="primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Add Category'}
          </Button>
        </div>

        {showForm && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Category</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Parent Category
                  </label>
                  <select
                    value={formData.parentId}
                    onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">None (Top Level)</option>
                    {categories.map((cat: any) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <Button type="submit" variant="primary" isLoading={createMutation.isPending}>
                Create Category
              </Button>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category: any) => (
            <div
              key={category.id}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-2">{category.name}</h3>
              {category.description && (
                <p className="text-sm text-gray-600 mb-4">{category.description}</p>
              )}
              {category.items && (
                <p className="text-xs text-gray-500">{category.items.length} items</p>
              )}
              {category.children && category.children.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">Subcategories:</p>
                  <div className="space-y-1">
                    {category.children.map((child: any) => (
                      <p key={child.id} className="text-sm text-gray-700">
                        • {child.name}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
