'use client';

import { useState } from 'react';

export default function Tooltip({ children, content, position = 'top', iconOnly = false }) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };
  
  const arrowClasses = {
    top: 'top-full left-1/2 transform -translate-x-1/2 border-t-black/80',
    bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-b-black/80',
    left: 'left-full top-1/2 transform -translate-y-1/2 border-l-black/80',
    right: 'right-full top-1/2 transform -translate-y-1/2 border-r-black/80'
  };

  return (
    <div 
      className="relative inline-flex items-center cursor-help"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onFocus={() => setShowTooltip(true)}
      onBlur={() => setShowTooltip(false)}
    >
      {iconOnly ? (
        <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-indigo-100 text-indigo-500 text-xs font-bold hover:bg-indigo-200">
          ?
        </span>
      ) : (
        children
      )}
      
      {showTooltip && (
        <div className={`absolute z-50 w-fit ${positionClasses[position]}`}>
          <div className="bg-black/80 text-white text-sm rounded py-1 px-2 shadow-lg min-w-xs z-50">
            {content}
          </div>
          <div className={`absolute w-2 h-2 ${arrowClasses[position]}`}></div>
        </div>
      )}
    </div>
  );
}