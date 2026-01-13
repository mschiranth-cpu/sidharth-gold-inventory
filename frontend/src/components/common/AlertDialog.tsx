/**
 * ============================================
 * ALERT DIALOG COMPONENT
 * ============================================
 *
 * Custom alert dialog that matches the application theme.
 * Replaces native browser alert() dialogs.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0
 */

import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';

interface AlertDialogProps {
  isOpen: boolean;
  title?: string;
  message: string;
  variant?: 'info' | 'success' | 'warning' | 'error';
  buttonText?: string;
  onClose: () => void;
}

const AlertDialog: React.FC<AlertDialogProps> = ({
  isOpen,
  title,
  message,
  variant = 'info',
  buttonText = 'OK',
  onClose,
}) => {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          icon: <CheckCircle className="w-6 h-6 text-white" />,
          iconGradient: 'from-emerald-500 to-green-600',
          iconShadow: 'shadow-emerald-500/30',
          orbGradient: 'from-emerald-100 to-green-100',
          buttonClass:
            'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-lg shadow-emerald-500/30',
          borderHover: 'hover:border-emerald-200',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-6 h-6 text-white" />,
          iconGradient: 'from-amber-500 to-orange-600',
          iconShadow: 'shadow-amber-500/30',
          orbGradient: 'from-amber-100 to-orange-100',
          buttonClass:
            'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-lg shadow-amber-500/30',
          borderHover: 'hover:border-amber-200',
        };
      case 'error':
        return {
          icon: <XCircle className="w-6 h-6 text-white" />,
          iconGradient: 'from-red-500 to-rose-600',
          iconShadow: 'shadow-red-500/30',
          orbGradient: 'from-red-100 to-rose-100',
          buttonClass:
            'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-lg shadow-red-500/30',
          borderHover: 'hover:border-red-200',
        };
      case 'info':
      default:
        return {
          icon: <Info className="w-6 h-6 text-white" />,
          iconGradient: 'from-blue-500 to-indigo-600',
          iconShadow: 'shadow-blue-500/30',
          orbGradient: 'from-blue-100 to-indigo-100',
          buttonClass:
            'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg shadow-blue-500/30',
          borderHover: 'hover:border-blue-200',
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
          <div className="flex items-start gap-4 mb-6">
            <div
              className={`flex-shrink-0 p-3 bg-gradient-to-br ${styles.iconGradient} rounded-xl shadow-lg ${styles.iconShadow}`}
            >
              {styles.icon}
            </div>
            <div className="flex-1 pt-1">
              {title && <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>}
              <p className="text-gray-600 leading-relaxed">{message}</p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className={`px-6 py-2.5 rounded-xl font-medium text-white transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${styles.buttonClass}`}
            >
              {buttonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertDialog;
