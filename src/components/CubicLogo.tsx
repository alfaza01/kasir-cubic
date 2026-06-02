import React from 'react';
import { cn } from '../lib/utils';

export const CubicLogo = ({ className, size = 12 }: { className?: string, size?: number }) => {
  return (
    <div className={cn("flex flex-col items-center justify-center shrink-0 drop-shadow-md bg-gradient-to-br from-red-600 to-red-700 p-2 rounded-2xl border border-red-500", className)}>
      <div 
         className="bg-gradient-to-br from-blue-400 to-blue-800 rounded-xl relative flex items-center justify-center shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)] border border-blue-400/50"
         style={{ width: `${size * 4}px`, height: `${size * 4}px` }}
      >
        <div className="absolute inset-0 bg-blue-600/20 mix-blend-overlay rounded-xl"></div>
        {/* Glow inner yellow 'C' approximation */}
        <div 
          className="absolute shadow-[0_0_10px_rgba(250,204,21,0.8)] border-[3px] border-yellow-400 rounded-md"
          style={{ 
            width: `${size * 2}px`, 
            height: `${size * 2.5}px`, 
            borderRightWidth: 0,
            borderTopRightRadius: 0,
            borderBottomRightRadius: 0
          }}
        ></div>
        <div 
          className="absolute bg-gradient-to-b from-yellow-300 to-yellow-500 rounded-[2px]"
          style={{ width: `${size * 2}px`, height: `${size * 0.8}px` }}
        ></div>
      </div>
      <span 
         className="font-black text-slate-800 uppercase tracking-[0.2em] mt-1.5"
         style={{ fontSize: `${Math.max(8, size * 0.7)}px` }}
      >
        CUBIC
      </span>
    </div>
  );
};
