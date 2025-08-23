import React from 'react';

interface BizCoinIconProps {
  size?: number;
  color?: string;
  className?: string;
}

export const BizCoinIcon: React.FC<BizCoinIconProps> = ({ 
  size = 24, 
  color = 'currentColor',
  className = '' 
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer coin circle */}
      <circle
        cx="12"
        cy="12"
        r="11"
        stroke={color}
        strokeWidth="2"
        fill="none"
      />
      
      {/* Inner decorative circle */}
      <circle
        cx="12"
        cy="12"
        r="8.5"
        stroke={color}
        strokeWidth="1"
        strokeDasharray="2 2"
        fill="none"
        opacity="0.6"
      />
      
      {/* BC text for BizCoin */}
      <text
        x="12"
        y="16"
        textAnchor="middle"
        fontSize="9"
        fontWeight="bold"
        fill={color}
        fontFamily="Arial, sans-serif"
      >
        BC
      </text>
      
      {/* Small rupee symbol at top */}
      <text
        x="12"
        y="8"
        textAnchor="middle"
        fontSize="6"
        fill={color}
        fontFamily="Arial, sans-serif"
      >
        ₹
      </text>
      
      {/* Decorative dots */}
      <circle cx="8" cy="12" r="1" fill={color} opacity="0.4" />
      <circle cx="16" cy="12" r="1" fill={color} opacity="0.4" />
      <circle cx="12" cy="6" r="0.8" fill={color} opacity="0.3" />
      <circle cx="12" cy="18" r="0.8" fill={color} opacity="0.3" />
    </svg>
  );
};

export default BizCoinIcon;