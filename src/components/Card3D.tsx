import React, { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'motion/react';
import { Sticker } from '../types';
import { Sparkles, Star } from 'lucide-react';

interface Card3DProps {
  sticker: Sticker;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  revealed?: boolean;
  interactive?: boolean;
  onClick?: () => void;
}

export default function Card3D({
  sticker,
  size = 'md',
  revealed = true,
  interactive = true,
  onClick
 }: Card3DProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Motion values for 3D tilt effect on mouse hover
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Transform motion values to rotateX and rotateY degrees
  const rotateX = useTransform(y, [-100, 100], [15, -15]);
  const rotateY = useTransform(x, [-100, 100], [-15, 15]);

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    if (!interactive) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = event.clientX - rect.left - width / 2;
    const mouseY = event.clientY - rect.top - height / 2;
    x.set(mouseX);
    y.set(mouseY);
  }

  function handleMouseLeave() {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  }

  // Sizing definitions - locked to exact 608x766 px aspect ratio (0.7937)
  // Sizes are significantly enlarged for impressive visualization!
  const baseWidths = {
    sm: 240, // Height will be 302px (perfect for responsive grids)
    md: 400, // Height will be 504px
    lg: 520, // Height will be 655px
    xl: 608  // Height will be exactly 766px!
  };

  const baseWidth = baseWidths[size];

  // Font sizing definitions relative to chosen card size
  const fontSizes = {
    sm: { name: 'text-sm sm:text-base', badge: 'text-[10px]', desc: 'text-xs' },
    md: { name: 'text-base sm:text-lg', badge: 'text-xs', desc: 'text-xs sm:text-sm' },
    lg: { name: 'text-lg sm:text-xl', badge: 'text-sm', desc: 'text-sm' },
    xl: { name: 'text-xl sm:text-2xl', badge: 'text-base', desc: 'text-base' }
  };

  const badgeSizes = {
    sm: { container: 'w-3.5 h-4 text-[8px]', font: 'text-[9px]' },
    md: { container: 'w-4 h-4.5 text-[10px]', font: 'text-xs' },
    lg: { container: 'w-5 h-5.5 text-xs', font: 'text-sm' },
    xl: { container: 'w-6 h-6.5 text-sm', font: 'text-base' }
  };

  const isLegend = sticker.rarity === 'Legend';

  const cardColor = sticker.color || (isLegend ? '#E5B80B' : '#FFFFFF');

  return (
    <div 
      className="flex flex-col items-center select-none w-full" 
      id={`card-container-${sticker.id}`}
      style={{ width: '100%', maxWidth: `${baseWidth}px` }}
    >
      {/* O quadrado da figurinha (3D Card) - adjusts dynamically to 608/766 aspect ratio */}
      <motion.div
        style={{
          rotateX: isHovered ? rotateX : 0,
          rotateY: isHovered ? rotateY : 0,
          transformStyle: 'preserve-3d',
          width: '100%',
          maxWidth: `${baseWidth}px`,
          aspectRatio: '608/766',
          boxShadow: isHovered 
            ? `0 20px 40px -10px rgba(0, 0, 0, 0.8), 0 0 15px ${cardColor}44` 
            : '0 8px 20px -6px rgba(0, 0, 0, 0.6)',
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
        className={`relative rounded-xl cursor-pointer select-none transition-all duration-300 border border-white/10 overflow-hidden bg-gradient-to-b from-neutral-900 via-neutral-950 to-black text-white ${onClick ? 'hover:scale-[1.02]' : ''}`}
        id={`card-${sticker.id}`}
      >
        {/* Interactive holographic shine reflection */}
        {(isLegend || isHovered) && <div className="holo-shine" />}

        {/* Legend glow animation border */}
        {isLegend && (
          <div className="absolute inset-0 border border-amber-300/30 rounded-xl animate-pulse pointer-events-none z-10" />
        )}

        {/* Full-bleed sticker image filling the box */}
        {sticker.image ? (
          <img 
            src={sticker.image} 
            alt={sticker.name || 'Figurinha'} 
            className="absolute inset-0 w-full h-full object-cover filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)] transition-transform duration-500 hover:scale-[1.05]"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/copa26.png';
            }}
          />
        ) : (
          // Tailored Vector Silhouette
          <div className="absolute inset-0 flex items-center justify-center bg-black/25">
            <svg viewBox="0 0 100 100" className={`w-3/4 h-3/4 ${isLegend ? 'text-amber-100/30' : 'text-white/10'}`}>
              <circle cx="50" cy="35" r="20" fill="currentColor" />
              <path d="M50 60 C25 60 15 75 15 100 L85 100 C85 75 75 60 50 60 Z" fill="currentColor" />
            </svg>
          </div>
        )}

        {/* Alignment line on the exact contour of the card/image */}
        <div 
          className="absolute inset-0 pointer-events-none border-[3px] rounded-xl z-20 transition-all duration-300" 
          style={{ borderColor: cardColor }}
        />

        {/* Golden Sparkles for Legends */}
        {isLegend && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <Sparkles className="w-8 h-8 text-amber-200/40 animate-pulse" />
          </div>
        )}

        {/* Shiny edge overlay */}
        <div className="absolute inset-0 pointer-events-none border border-white/10 rounded-xl z-20" />
      </motion.div>

      {/* Informações para fora do quadrado (Text / Details below) */}
      <div 
        className="mt-3 text-center flex flex-col items-center w-full px-2" 
        style={{ 
          transform: 'translateZ(10px)',
          maxWidth: `${baseWidth}px`
        }}
      >
        {/* Number & Name Tag */}
        <div className="flex items-center gap-1.5 justify-center w-full">
          <span className="font-mono font-bold text-[10px] bg-black/40 px-1.5 py-0.5 rounded text-white border border-white/10 shrink-0">
            {sticker.number}
          </span>
          <h4 className={`font-display tracking-wide text-white leading-tight uppercase truncate font-semibold ${fontSizes[size].name}`}>
            {sticker.name}
          </h4>
          {isLegend && (
            <span className="text-brand-gold-glow animate-pulse">
              <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
            </span>
          )}
        </div>

        {/* Team crest / badge */}
        <div className="flex items-center justify-center gap-1 mt-1.5">
          <div className={`${badgeSizes[size].container} bg-amber-400 rounded-sm flex items-center justify-center font-bold text-black border border-black/25`}>
            🥕
          </div>
          <span className={`${fontSizes[size].badge} font-bold tracking-wider uppercase px-1.5 py-0.5 rounded-sm border bg-black/40 text-white`} style={{ borderColor: cardColor }}>
            {sticker.team === 'Legends' ? 'Lendas' : sticker.team.replace('Time ', '')}
          </span>
        </div>

        {/* Description/Bio Snippet */}
        {sticker.description && size !== 'sm' && (
          <p className={`${fontSizes[size].desc} text-gray-400 mt-2 line-clamp-2 italic font-light w-full`}>
            {sticker.description}
          </p>
        )}
      </div>
    </div>
  );
}

