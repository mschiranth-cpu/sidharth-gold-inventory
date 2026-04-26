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
      'bg-gradient-to-r from-champagne-700 via-champagne-800 to-onyx-800',
      'bg-[length:200%_200%] bg-[position:0%_0%]',
      'hover:bg-[position:100%_100%]',
      'shadow-[0_4px_15px_rgba(58,44,22,0.35)]',
      'hover:shadow-[0_8px_25px_rgba(58,44,22,0.5),0_0_20px_rgba(201,165,92,0.25)]',
      'focus:ring-champagne-500'
    ),
    secondary: cn(
      'text-onyx-700 rounded-xl',
      'bg-white/90 backdrop-blur-sm',
      'border border-champagne-200/70',
      'shadow-[0_2px_10px_rgba(58,44,22,0.06)]',
      'hover:bg-white hover:border-champagne-400/70',
      'hover:shadow-[0_8px_25px_rgba(58,44,22,0.1)]',
      'focus:ring-champagne-400'
    ),
    danger: cn(
      'text-white rounded-xl',
      'bg-gradient-to-r from-accent-ruby via-accent-ruby to-accent-ruby/85',
      'bg-[length:200%_200%] bg-[position:0%_0%]',
      'hover:bg-[position:100%_100%]',
      'shadow-[0_4px_15px_rgba(180,58,74,0.4)]',
      'hover:shadow-[0_8px_25px_rgba(180,58,74,0.5)]',
      'focus:ring-accent-ruby'
    ),
    success: cn(
      'text-white rounded-xl',
      'bg-gradient-to-r from-accent-emerald via-accent-emerald to-accent-emerald/85',
      'bg-[length:200%_200%] bg-[position:0%_0%]',
      'hover:bg-[position:100%_100%]',
      'shadow-[0_4px_15px_rgba(31,138,111,0.4)]',
      'hover:shadow-[0_8px_25px_rgba(31,138,111,0.5)]',
      'focus:ring-accent-emerald'
    ),
    ghost: cn(
      'text-onyx-500 bg-transparent rounded-xl',
      'hover:text-onyx-900 hover:bg-champagne-100/60',
      'hover:shadow-[0_4px_15px_rgba(58,44,22,0.05)]',
      'focus:ring-champagne-300'
    ),
    outline: cn(
      'text-champagne-800 bg-transparent rounded-xl',
      'border-2 border-champagne-500',
      'hover:text-white hover:border-transparent',
      'hover:bg-gradient-to-r hover:from-champagne-700 hover:to-onyx-800',
      'hover:shadow-[0_8px_25px_rgba(58,44,22,0.3)]',
      'focus:ring-champagne-500'
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
