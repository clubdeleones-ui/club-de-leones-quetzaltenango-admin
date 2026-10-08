import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

interface AnimatedLionsLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  withBadge?: boolean;
  badgeText?: string;
  interactive?: boolean;
  className?: string;
  onClick?: () => void;
}

export const AnimatedLionsLogo: React.FC<AnimatedLionsLogoProps> = ({
  size = 'hero',
  withBadge = true,
  badgeText = 'Desde 1947 sirviendo',
  interactive = true,
  className = '',
  onClick
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Mapeo responsivo de dimensiones según prop size
  const sizeConfig = {
    sm: {
      wrapper: 'w-14 h-14',
      img: 'w-10 h-10',
      badgeText: 'text-[8.5px]',
      badgePadding: 'px-2 py-0.5',
      starSize: 10,
    },
    md: {
      wrapper: 'w-20 h-20',
      img: 'w-14 h-14',
      badgeText: 'text-[9.5px]',
      badgePadding: 'px-2.5 py-0.5',
      starSize: 12,
    },
    lg: {
      wrapper: 'w-28 h-28',
      img: 'w-20 h-20',
      badgeText: 'text-[10px]',
      badgePadding: 'px-3 py-1',
      starSize: 14,
    },
    xl: {
      wrapper: 'w-36 h-36',
      img: 'w-26 h-26',
      badgeText: 'text-xs',
      badgePadding: 'px-3.5 py-1',
      starSize: 16,
    },
    hero: {
      wrapper: 'w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36',
      img: 'w-16 h-16 sm:w-22 sm:h-22 md:w-24 md:h-24',
      badgeText: 'text-[10px] sm:text-xs',
      badgePadding: 'px-3.5 sm:px-4 py-1 sm:py-1.5',
      starSize: 14,
    }
  }[size];

  return (
    <div 
      className={`inline-flex flex-col items-center justify-center relative select-none ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Contenedor Flotante Principal (Efecto de Levitación Orgánica) */}
      <div 
        className={`relative flex items-center justify-center transition-transform duration-500 ease-out animate-lions-float ${
          interactive ? 'cursor-pointer hover:scale-105 active:scale-95' : ''
        }`}
      >
        {/* 1. Halo Exterior Cónico Giratorio (Aura Lions Gold & Royal Blue) */}
        <div 
          className={`absolute inset-[-8px] sm:inset-[-12px] rounded-full blur-md sm:blur-lg opacity-70 transition-opacity duration-500 animate-lions-spin-slow pointer-events-none ${
            isHovered ? 'opacity-100 blur-xl scale-110' : ''
          }`}
          style={{
            background: 'conic-gradient(from 0deg, #F59E0B, #1D4ED8, #FBBF24, #2563EB, #F59E0B)',
          }}
        />

        {/* 2. Resplandor Pulsante Central (Pulso Lumínico) */}
        <div 
          className={`absolute inset-[-4px] rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 blur-sm animate-lions-pulse-glow pointer-events-none transition-all duration-300 ${
            isHovered ? 'scale-115 opacity-90' : ''
          }`} 
        />

        {/* 3. Chispas / Destellos Estelares Flotantes */}
        <div className="absolute -top-2 -right-2 text-yellow-300 animate-lions-twinkle pointer-events-none z-30 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]">
          <Sparkles size={sizeConfig.starSize + 2} />
        </div>
        <div 
          className="absolute -bottom-1 -left-2 text-amber-300 animate-lions-twinkle pointer-events-none z-30 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]"
          style={{ animationDelay: '1.4s' }}
        >
          <Sparkles size={sizeConfig.starSize} />
        </div>

        {/* 4. Base Circular / Medallón del Escudo */}
        <div 
          className={`${sizeConfig.wrapper} relative z-20 rounded-full bg-white p-2.5 sm:p-3 shadow-2xl border-2 sm:border-[3px] border-amber-400/90 flex items-center justify-center overflow-hidden transition-all duration-300 ring-4 ring-yellow-400/20`}
          style={{
            boxShadow: isHovered 
              ? '0 0 35px rgba(245, 158, 11, 0.65), 0 0 15px rgba(29, 78, 216, 0.4)' 
              : '0 12px 30px -8px rgba(0, 0, 0, 0.45), 0 0 20px rgba(245, 158, 11, 0.35)',
          }}
        >
          {/* Imagen Oficial del Escudo Lions Clubs */}
          <img
            src="/images/logo.png"
            alt="Logo Club de Leones Quetzaltenango"
            className={`${sizeConfig.img} object-contain transition-transform duration-500 relative z-10 ${
              isHovered ? 'scale-108 rotate-1' : ''
            }`}
            draggable={false}
          />

          {/* 5. Destello Metálico de Luz (Gold Shimmer Sweep) */}
          <div 
            className="absolute inset-0 pointer-events-none z-20 overflow-hidden rounded-full"
          >
            <div 
              className="absolute inset-0 w-[45%] h-full bg-gradient-to-r from-transparent via-white/80 to-transparent transform -skew-x-25 animate-lions-shimmer"
            />
          </div>
        </div>
      </div>

      {/* 6. Badge Conmemorativo / Lema Oficial */}
      {withBadge && (
        <div className="relative z-30 mt-3 sm:mt-4 transition-all duration-300">
          <div 
            className={`inline-flex items-center gap-1.5 bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500 text-blue-950 font-black ${sizeConfig.badgeText} ${sizeConfig.badgePadding} rounded-full uppercase tracking-widest shadow-lg border border-yellow-200/60 backdrop-blur-xs transition-transform duration-300 ${
              isHovered ? 'scale-105 shadow-amber-400/50 -translate-y-0.5' : ''
            }`}
          >
            <span className="text-blue-900 text-[10px]">★</span>
            <span>{badgeText}</span>
            <span className="text-blue-900 text-[10px]">★</span>
          </div>
        </div>
      )}
    </div>
  );
};
