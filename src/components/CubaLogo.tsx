import React from 'react';
import { cn } from '../lib/utils';

export const CubaLogo = ({ className, size = 12 }: { className?: string, size?: number }) => {
  return (
    <div className={cn("flex flex-col items-center justify-center shrink-0 drop-shadow-md rounded-2xl overflow-hidden", className)}>
      <img src="/logobaru.png" alt="Cuba Logo" style={{ width: `${size * 6}px`, height: `${size * 6}px` }} className="object-contain rounded-2xl" />
    </div>
  );
};
