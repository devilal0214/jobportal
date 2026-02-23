import React from 'react';

interface BrandButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
}

export default function BrandButton({ 
  variant = 'primary', 
  children, 
  className = '',
  disabled,
  ...props 
}: BrandButtonProps) {
  const baseStyles = "px-5 py-2 rounded-full font-medium transition-all duration-400 relative overflow-hidden";
  
  const variantStyles = variant === 'primary' 
    ? "brand-button-animated"
    : "border border-gray-300 text-gray-700 hover:bg-gray-50";

  const disabledStyles = disabled ? "opacity-60 cursor-not-allowed" : "";

  return (
    <>
      <style jsx>{`
        /* Brand Button Default Styling */
        .brand-button-animated {
          background: #ffffff;
          border: 1px solid #29256a;
          color: #29256a;
          font-size: 15px;
          height: 41px;
          cursor: pointer;
          transition: all 0.4s ease;
          position: relative;
          overflow: hidden;
          z-index: 1;
        }

        /* Gradient Animation on Hover */
        .brand-button-animated:not(:disabled):hover {
          background-image: linear-gradient(
            270deg,
            #ee4038,
            #fbbc16,
            #00994d,
            #29256a,
            #ee4038
          ) !important;
          background-size: 800% 800%;
          animation: gradientFlow 6s ease infinite;
          color: #ffffff !important;
          border-color: transparent;
        }

        .brand-button-animated:disabled {
          animation: none !important;
          background: #f3f4f6;
          border-color: #d1d5db;
          color: #9ca3af;
          cursor: not-allowed;
        }

        @keyframes gradientFlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
      
      <button
        className={`${baseStyles} ${variantStyles} ${disabledStyles} ${className}`}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    </>
  );
}

