import React from 'react';

interface RequiredLabelProps {
  children: React.ReactNode;
  required?: boolean;
  htmlFor?: string;
  className?: string;
}

const RequiredLabel: React.FC<RequiredLabelProps> = ({
  children,
  required = true,
  htmlFor,
  className = '',
}) => {
  return (
    <label
      htmlFor={htmlFor}
      className={`block text-sm font-medium text-gray-700 mb-1 ${className}`}
    >
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
};

export default RequiredLabel;
