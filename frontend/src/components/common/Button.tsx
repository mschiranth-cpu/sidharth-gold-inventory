import React from 'react';
import { cn } from '../../utils/helpers';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  iconAnimate?: boolean;
  pulse?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  iconLeft,
  iconRight,
  iconAnimate = false,
  pulse = false,
  children,
  className,
  disabled,
  ...props
}) => {
  const baseStyles = cn(
    'inline-flex items-center justify-center gap-2 font-semibold',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
    'relative overflow-hidden',
    'transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)]',
    'transform hover:translate-y-[-2px] hover:scale-[1.02]',
    'active:translate-y-0 active:scale-[0.98]'
  );

  const variants = {
    primary: cn(
      'text-white rounded-xl',
      'bg-gradient-to-r from-indigo-500 via-purple-600 to-violet-600',
      'bg-[length:200%_200%] bg-[position:0%_0%]',
      'hover:bg-[position:100%_100%]',
      'shadow-[0_4px_15px_rgba(99,102,241,0.4)]',
      'hover:shadow-[0_8px_25px_rgba(99,102,241,0.5),0_0_20px_rgba(99,102,241,0.3)]',
      'focus:ring-indigo-500'
    ),
    secondary: cn(
      'text-gray-700 rounded-xl',
      'bg-white/90 backdrop-blur-sm',
      'border border-gray-200/50',
      'shadow-[0_2px_10px_rgba(0,0,0,0.05)]',
      'hover:bg-white hover:border-indigo-300/50',
      'hover:shadow-[0_8px_25px_rgba(0,0,0,0.1)]',
      'focus:ring-gray-400'
    ),
    danger: cn(
      'text-white rounded-xl',
      'bg-gradient-to-r from-red-500 via-red-600 to-red-700',
      'bg-[length:200%_200%] bg-[position:0%_0%]',
      'hover:bg-[position:100%_100%]',
      'shadow-[0_4px_15px_rgba(239,68,68,0.4)]',
      'hover:shadow-[0_8px_25px_rgba(239,68,68,0.5),0_0_20px_rgba(239,68,68,0.3)]',
      'focus:ring-red-500'
    ),
    success: cn(
      'text-white rounded-xl',
      'bg-gradient-to-r from-green-500 via-green-600 to-emerald-600',
      'bg-[length:200%_200%] bg-[position:0%_0%]',
      'hover:bg-[position:100%_100%]',
      'shadow-[0_4px_15px_rgba(34,197,94,0.4)]',
      'hover:shadow-[0_8px_25px_rgba(34,197,94,0.5),0_0_20px_rgba(34,197,94,0.3)]',
      'focus:ring-green-500'
    ),
    ghost: cn(
      'text-gray-600 bg-transparent rounded-xl',
      'hover:text-gray-900 hover:bg-gray-100/80',
      'hover:shadow-[0_4px_15px_rgba(0,0,0,0.05)]',
      'focus:ring-gray-400'
    ),
    outline: cn(
      'text-indigo-600 bg-transparent rounded-xl',
      'border-2 border-indigo-500',
      'hover:text-white hover:border-transparent',
      'hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-600',
      'hover:shadow-[0_8px_25px_rgba(99,102,241,0.4)]',
      'focus:ring-indigo-500'
    ),
  };

  const sizes = {
    xs: 'px-3 py-1.5 text-xs rounded-lg',
    sm: 'px-4 py-2 text-sm rounded-lg',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-8 py-3.5 text-base rounded-2xl',
    xl: 'px-10 py-4 text-lg rounded-2xl',
  };

  return (
    <button
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        pulse && !disabled && 'animate-[btn-pulse-effect_2s_cubic-bezier(0.4,0,0.6,1)_infinite]',
        isLoading && 'pointer-events-none',
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {/* Shimmer effect */}
      <span className="absolute inset-0 overflow-hidden rounded-xl">
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 ease-out group-hover:translate-x-full hover:translate-x-full" />
      </span>

      {/* Loading spinner */}
      {isLoading && (
        <svg
          className="animate-spin h-4 w-4 absolute"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}

      {/* Content */}
      <span
        className={cn('relative z-10 inline-flex items-center gap-2', isLoading && 'opacity-0')}
      >
        {iconLeft && (
          <span
            className={cn(
              'transition-transform duration-300',
              iconAnimate && 'group-hover:-translate-x-1'
            )}
          >
            {iconLeft}
          </span>
        )}
        {children}
        {iconRight && (
          <span
            className={cn(
              'transition-transform duration-300',
              iconAnimate && 'group-hover:translate-x-1'
            )}
          >
            {iconRight}
          </span>
        )}
      </span>
    </button>
  );
};

export default Button;
