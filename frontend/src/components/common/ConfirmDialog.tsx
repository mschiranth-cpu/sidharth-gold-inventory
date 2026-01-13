/**
 * ============================================
 * CONFIRM DIALOG COMPONENT
 * ============================================
 *
 * Custom confirmation dialog that matches the application theme.
 * Replaces native browser confirm() dialogs.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import React from 'react';
import { AlertTriangle, Trash2, CheckCircle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'danger' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (confirmVariant) {
      case 'danger':
        return {
          icon: <Trash2 className="w-6 h-6 text-white" />,
          iconGradient: 'from-red-500 to-rose-600',
          iconShadow: 'shadow-red-500/30',
          orbGradient: 'from-red-100 to-rose-100',
          buttonClass:
            'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-lg shadow-red-500/30',
          borderHover: 'hover:border-red-200',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-6 h-6 text-white" />,
          iconGradient: 'from-amber-500 to-orange-600',
          iconShadow: 'shadow-amber-500/30',
          orbGradient: 'from-amber-100 to-orange-100',
          buttonClass:
            'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-amber-500/30',
          borderHover: 'hover:border-amber-200',
        };
      case 'primary':
      default:
        return {
          icon: <CheckCircle className="w-6 h-6 text-white" />,
          iconGradient: 'from-indigo-500 to-purple-600',
          iconShadow: 'shadow-indigo-500/30',
          orbGradient: 'from-indigo-100 to-purple-100',
          buttonClass:
            'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/30',
          borderHover: 'hover:border-indigo-200',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div
        className={`group relative bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl border border-gray-100 ${styles.borderHover} transition-all duration-300 overflow-hidden animate-in zoom-in-95 duration-200`}
      >
        {/* Decorative background orb */}
        <div
          className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${styles.orbGradient} rounded-full -translate-y-12 translate-x-12 group-hover:scale-110 transition-transform duration-300`}
        />

        <div className="relative">
          {/* Icon and Title Section */}
          <div className="flex items-start gap-4 mb-4">
            <div
              className={`flex-shrink-0 p-3 bg-gradient-to-br ${styles.iconGradient} rounded-xl shadow-lg ${styles.iconShadow}`}
            >
              {styles.icon}
            </div>
            <div className="flex-1 pt-1">
              <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            </div>
          </div>

          <p className="text-gray-600 mb-6 leading-relaxed">{message}</p>

          <div className="flex gap-3 justify-end">
            <button
              onClick={onCancel}
              className="px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-all duration-200 hover:shadow-md"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${styles.buttonClass}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
