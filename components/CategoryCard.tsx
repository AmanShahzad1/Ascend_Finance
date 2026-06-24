'use client';

import { FiPlus } from 'react-icons/fi';

interface CategoryCardProps {
  category: string;
  title: string;
  description: string;
  color: 'red' | 'yellow' | 'green' | 'blue';
  amount: number;
  onClick: () => void;
}

const colorConfig = {
  red: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-900',
    textLight: 'text-red-700',
    textAccent: 'text-red-600',
    hover: 'hover:bg-red-100',
    icon: 'text-red-500'
  },
  yellow: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-900',
    textLight: 'text-yellow-700',
    textAccent: 'text-yellow-600',
    hover: 'hover:bg-yellow-100',
    icon: 'text-yellow-500'
  },
  green: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-900',
    textLight: 'text-green-700',
    textAccent: 'text-green-600',
    hover: 'hover:bg-green-100',
    icon: 'text-green-500'
  },
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-900',
    textLight: 'text-blue-700',
    textAccent: 'text-blue-600',
    hover: 'hover:bg-blue-100',
    icon: 'text-blue-500'
  }
};

export default function CategoryCard({ 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  category, 
  title, 
  description, 
  color, 
  amount, 
  onClick 
}: CategoryCardProps) {
  const colors = colorConfig[color];

  return (
    <div 
      className={`
        ${colors.bg} ${colors.border} ${colors.hover}
        border rounded-xl p-4 sm:p-6 text-center cursor-pointer
        transition-all duration-300 transform hover:scale-105 hover:shadow-md
        shadow-sm ios-touch-optimize
      `}
      onClick={onClick}
    >
      <div className="mb-3 sm:mb-4">
        <div className={`w-12 h-12 sm:w-16 sm:h-16 ${colors.bg} ${colors.border} border-2 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3`}>
          <FiPlus className={`h-6 w-6 sm:h-8 sm:w-8 ${colors.icon}`} />
        </div>
        <h3 className={`text-base sm:text-lg font-semibold ${colors.text} mb-1 sm:mb-2`}>
          {title}
        </h3>
        <p className={`${colors.textLight} text-xs sm:text-sm mb-2 sm:mb-3`}>
          {description}
        </p>
      </div>
      
      <div className="space-y-1 sm:space-y-2">
        <p className={`${colors.textAccent} text-xl sm:text-2xl font-bold`}>
          ${amount.toFixed(2)}
        </p>
        <p className={`${colors.textLight} text-xs`}>
          Click to add expense
        </p>
      </div>
    </div>
  );
}
