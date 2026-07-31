import React from 'react';

interface AppLogoProps {
  className?: string;
  size?: number;
}

export const AppLogo: React.FC<AppLogoProps> = ({ className = 'w-10 h-10', size }) => {
  return (
    <div 
      className={`relative inline-flex items-center justify-center overflow-hidden rounded-xl shadow-md border border-amber-400/80 bg-slate-900 shrink-0 ${className}`} 
      style={size ? { width: size, height: size } : undefined}
    >
      <img
        src="/app-icon.jpg"
        alt="ImportHour - Importações Inteligentes"
        className="w-full h-full object-contain p-0.5 bg-white rounded-lg"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

