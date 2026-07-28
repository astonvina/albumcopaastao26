import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, ShieldCheck, Calendar, Play, Trophy, Gift, HelpCircle, RefreshCw, UserCheck, Shield, Package, Award } from 'lucide-react';
import { UserProfile, Prize } from '../types';
import { useSystemSettings, DEFAULT_COUNTDOWN_CONFIG, DEFAULT_REWARDS_BANNER_CONFIG } from '../context/SystemSettingsContext';
import { getPrizesFromSupabase } from '../lib/supabaseData';

interface HomeTabProps {
  onNavigateToLogin: () => void;
  onNavigateToAdmin: () => void;
  onOpenPack: () => Promise<void>;
  isLoadingPack: boolean;
  packError: string | null;
  onNavigateToAlbum: () => void;
  onNavigateToRanking?: () => void;
  userProfile?: UserProfile | null;
  onClaimRecyclePack?: () => Promise<void>;
  isRecycling?: boolean;
}

function EventCountdownSection({
  onNavigateToAlbum,
  onNavigateToRanking,
  onNavigateToLogin,
  onOpenPack
}: {
  onNavigateToAlbum: () => void;
  onNavigateToRanking?: () => void;
  onNavigateToLogin: () => void;
  onOpenPack: () => Promise<void>;
}) {
  const { settings } = useSystemSettings();
  const config = settings.countdownConfig || DEFAULT_COUNTDOWN_CONFIG;

  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number; total: number }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const targetTime = new Date(config.eventDate || settings.countdownDate || '2026-11-01T08:00:00.000Z').getTime();
      const now = Date.now();
      const diff = Math.max(0, targetTime - now);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds, total: diff });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [config.eventDate, settings.countdownDate]);

  // Mode or Visibility check
  if (!config.showCountdown || config.mode === 'hidden') {
    return null;
  }

  const isEventEnded = timeLeft.total <= 0;

  // Post-event behavior check
  if (isEventEnded) {
    if (config.postEventBehavior === 'hide') {
      return null;
    }
    if (config.postEventBehavior === 'custom_message') {
      return (
        <section 
          className="relative overflow-hidden bg-brand-surface border border-brand-gold/30 rounded-3xl p-6 sm:p-8 shadow-2xl text-center max-w-4xl mx-auto space-y-3"
          style={{
            backgroundColor: config.colors?.backgroundColor || '#171717',
            backgroundImage: config.backgroundImageUrl ? `url(${config.backgroundImageUrl})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: config.colors?.overlayColor || 'rgba(0,0,0,0.6)' }} />
          <div className="relative z-10 space-y-2">
            <span className="px-3 py-1 bg-brand-gold/20 text-brand-gold-glow rounded-full text-[10px] font-mono uppercase tracking-widest border border-brand-gold/30">
              {config.title || 'EVENTO PRINCIPAL'}
            </span>
            <h3 
              className="font-display text-xl sm:text-2xl uppercase tracking-wider font-extrabold"
              style={{ color: config.colors?.titleColor || '#FFFFFF' }}
            >
              {config.postEventMessage || 'A Copa Astão 2026 já começou!'}
            </h3>
          </div>
        </section>
      );
    }
  }

  const handleButtonClick = () => {
    switch (config.buttonAction) {
      case 'album':
        onNavigateToAlbum();
        break;
      case 'ranking':
        onNavigateToRanking?.();
        break;
      case 'login':
        onNavigateToLogin();
        break;
      case 'open_pack':
        onOpenPack();
        break;
      case 'external_url':
        if (config.buttonUrl) {
          window.open(config.buttonUrl, '_blank');
        }
        break;
      default:
        onNavigateToAlbum();
    }
  };

  return (
    <section 
      className="relative overflow-hidden border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 transition-all"
      style={{
        backgroundColor: config.colors?.backgroundColor || '#171717',
        backgroundImage: config.backgroundImageUrl ? `url(${config.backgroundImageUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundColor: config.colors?.overlayColor || 'rgba(0,0,0,0.6)' }}
      />

      {/* Content */}
      <div className="relative z-10 flex items-center gap-4 text-left">
        <div className="w-12 h-12 bg-white/10 border border-white/20 text-brand-gold-glow rounded-2xl flex items-center justify-center shadow-inner shrink-0 backdrop-blur-sm">
          <Calendar className="w-6 h-6" />
        </div>
        <div>
          <span className="text-[10px] font-mono tracking-widest uppercase text-brand-gold-glow block mb-0.5">
            EVENTO PRINCIPAL
          </span>
          <h3 
            className="font-display text-lg sm:text-xl uppercase tracking-wider font-extrabold leading-tight"
            style={{ color: config.colors?.titleColor || '#FFFFFF' }}
          >
            {config.title || 'PRÓXIMO GRANDE EVENTO'}
          </h3>
          {config.subtitle && (
            <p className="text-xs text-gray-300 mt-1 max-w-md leading-relaxed">
              {config.subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Countdown Clock or Banner Button */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 shrink-0 w-full md:w-auto">
        {config.mode === 'countdown' && (
          <div className="flex items-center gap-2 sm:gap-3 bg-black/60 backdrop-blur-md border border-white/10 px-5 py-3 rounded-2xl shadow-inner font-mono text-center w-full justify-center">
            <div>
              <div 
                className="text-xl sm:text-2xl font-black leading-none"
                style={{ color: config.colors?.countdownColor || '#FECF2E' }}
              >
                {String(timeLeft.days).padStart(2, '0')}
              </div>
              <div className="text-[9px] text-gray-400 font-semibold uppercase mt-1">Dias</div>
            </div>
            <div className="text-white text-base font-bold animate-pulse">:</div>
            <div>
              <div 
                className="text-xl sm:text-2xl font-black leading-none"
                style={{ color: config.colors?.countdownColor || '#FECF2E' }}
              >
                {String(timeLeft.hours).padStart(2, '0')}
              </div>
              <div className="text-[9px] text-gray-400 font-semibold uppercase mt-1">Horas</div>
            </div>
            <div className="text-white text-base font-bold animate-pulse">:</div>
            <div>
              <div 
                className="text-xl sm:text-2xl font-black leading-none"
                style={{ color: config.colors?.countdownColor || '#FECF2E' }}
              >
                {String(timeLeft.minutes).padStart(2, '0')}
              </div>
              <div className="text-[9px] text-gray-400 font-semibold uppercase mt-1">Min</div>
            </div>
            <div className="text-white text-base font-bold animate-pulse">:</div>
            <div>
              <div 
                className="text-xl sm:text-2xl font-black leading-none"
                style={{ color: config.colors?.countdownColor || '#FECF2E' }}
              >
                {String(timeLeft.seconds).padStart(2, '0')}
              </div>
              <div className="text-[9px] text-gray-400 font-semibold uppercase mt-1">Seg</div>
            </div>
          </div>
        )}

        {config.showButton && config.buttonText && (
          <button
            type="button"
            onClick={handleButtonClick}
            className="w-full sm:w-auto px-6 py-3.5 font-display text-xs uppercase tracking-wider font-black rounded-xl shadow-xl transition-all hover:scale-105 shrink-0"
            style={{
              backgroundColor: config.colors?.buttonColor || '#0099D6',
              color: config.colors?.buttonTextColor || '#FFFFFF'
            }}
          >
            {config.buttonText}
          </button>
        )}
      </div>
    </section>
  );
}

function RewardsBannerSection({
  onNavigateToAlbum,
  onNavigateToRanking
}: {
  onNavigateToAlbum: () => void;
  onNavigateToRanking?: () => void;
}) {
  const { settings } = useSystemSettings();
  const config = settings.rewardsBannerConfig || DEFAULT_REWARDS_BANNER_CONFIG;
  const [systemPrizes, setSystemPrizes] = useState<Prize[]>([]);
  const [isPrizesModalOpen, setIsPrizesModalOpen] = useState(false);

  useEffect(() => {
    if (config.useSystemPrizes) {
      getPrizesFromSupabase()
        .then((prizes) => {
          setSystemPrizes(prizes);
        })
        .catch((err) => console.error('Erro ao buscar prêmios do sistema:', err));
    }
  }, [config.useSystemPrizes]);

  if (!config.enabled) {
    return null;
  }

  const handlePrimaryClick = () => {
    if (config.primaryButtonAction === 'album') {
      onNavigateToAlbum();
    } else if (config.primaryButtonAction === 'ranking' && onNavigateToRanking) {
      onNavigateToRanking();
    }
  };

  const handleSecondaryClick = () => {
    if (config.secondaryButtonAction === 'prizes_modal') {
      setIsPrizesModalOpen(true);
    } else if (config.secondaryButtonAction === 'ranking' && onNavigateToRanking) {
      onNavigateToRanking();
    } else if (config.secondaryButtonAction === 'album') {
      onNavigateToAlbum();
    }
  };

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 25, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-3xl p-6 sm:p-10 shadow-2xl max-w-5xl mx-auto border transition-all"
        style={{
          backgroundColor: config.colors?.backgroundColor || '#121212',
          borderColor: config.colors?.borderGlowColor || '#E5B80B',
          backgroundImage: config.backgroundImageUrl ? `url(${config.backgroundImageUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {/* Glow ambient background effects */}
        <div 
          className="absolute inset-0 pointer-events-none transition-opacity" 
          style={{ backgroundColor: config.colors?.overlayColor || 'rgba(0, 0, 0, 0.7)' }} 
        />
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-brand-blue/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-8 text-center">
          
          {/* Header Title & Subtitle */}
          <div className="max-w-3xl mx-auto space-y-3">
            <motion.div
              animate={{ opacity: [0.85, 1, 0.85] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full text-xs font-mono font-bold uppercase tracking-widest text-amber-300 shadow-inner"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              DESTAQUE DE PREMIAÇÕES DO ÁLBUM
            </motion.div>

            <h2 
              className="font-display text-3xl sm:text-4xl lg:text-5xl uppercase tracking-wider font-black leading-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
              style={{ color: config.colors?.titleColor || '#FECF2E' }}
            >
              {config.title || '🏆 COMPLETE O ÁLBUM E CONCORRA A PRÊMIOS!'}
            </h2>

            <p 
              className="text-sm sm:text-base font-medium max-w-2xl mx-auto leading-relaxed"
              style={{ color: config.colors?.subtitleColor || '#E2E8F0' }}
            >
              {config.subtitle || 'Colecione todas as figurinhas, suba no ranking e desbloqueie recompensas exclusivas da Copa Astão.'}
            </p>
          </div>

          {/* Featured Prizes Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {config.useSystemPrizes && systemPrizes.length > 0 ? (
              systemPrizes.map((prize, idx) => (
                <motion.div
                  key={prize.id}
                  whileHover={{ y: -6, scale: 1.04 }}
                  transition={{ duration: 0.3 }}
                  className="p-6 sm:p-8 rounded-3xl border-2 flex flex-col items-center text-center gap-3 shadow-2xl backdrop-blur-xl transition-all duration-300 group hover:border-amber-400 hover:shadow-amber-500/20"
                  style={{
                    backgroundColor: config.colors?.cardBackgroundColor || 'rgba(18, 18, 18, 0.85)',
                    borderColor: 'rgba(251, 191, 36, 0.4)'
                  }}
                >
                  {/* Prize Image */}
                  {prize.imageUrl ? (
                    <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-2xl bg-black/60 overflow-hidden shrink-0 border-2 border-amber-400/80 p-3 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 group-hover:border-amber-300 transition-all duration-300">
                      <img src={prize.imageUrl} alt={prize.name} className="w-full h-full object-contain drop-shadow-md" referrerPolicy="no-referrer" />
                    </div>
                  ) : (
                    <div className="w-36 h-36 sm:w-44 sm:h-44 bg-gradient-to-br from-amber-500/30 via-yellow-500/20 to-amber-700/30 text-amber-300 rounded-2xl flex items-center justify-center text-5xl sm:text-6xl shrink-0 border-2 border-amber-400/80 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-all duration-300">
                      {idx === 0 ? '⚽' : idx === 1 ? '👕' : idx === 2 ? '🧢' : '🏆'}
                    </div>
                  )}

                  {/* Prize Name */}
                  <h4 className="font-display text-xl sm:text-2xl font-bold text-white uppercase tracking-wide my-2 group-hover:text-amber-300 transition-colors leading-snug whitespace-normal break-words text-center">
                    {prize.name}
                  </h4>

                  {/* Requirement Badge (full row, no clipping) */}
                  {(prize.deliveryCriteria || prize.description) && (
                    <div className="w-full bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-lg py-2.5 px-3 flex items-center justify-center gap-2 text-xs font-semibold whitespace-normal text-center break-words shadow-sm">
                      <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="whitespace-normal text-center break-words uppercase font-bold">
                        {prize.deliveryCriteria || 'Sorteio ao completar o álbum'}
                      </span>
                    </div>
                  )}

                  {prize.description && prize.deliveryCriteria && (
                    <p className="text-xs sm:text-sm text-gray-300 font-medium leading-relaxed whitespace-normal text-center break-words pt-1">
                      {prize.description}
                    </p>
                  )}
                </motion.div>
              ))
            ) : (
              config.featuredItems.map((item) => (
                <motion.div
                  key={item.id}
                  whileHover={{ y: -6, scale: 1.04 }}
                  transition={{ duration: 0.3 }}
                  className="p-6 sm:p-8 rounded-3xl border-2 flex flex-col items-center text-center gap-3 shadow-2xl backdrop-blur-xl transition-all duration-300 group hover:border-amber-400 hover:shadow-amber-500/20"
                  style={{
                    backgroundColor: config.colors?.cardBackgroundColor || 'rgba(18, 18, 18, 0.85)',
                    borderColor: 'rgba(251, 191, 36, 0.4)'
                  }}
                >
                  <div className="w-36 h-36 sm:w-44 sm:h-44 bg-gradient-to-br from-amber-500/30 via-yellow-500/20 to-amber-700/30 text-5xl sm:text-6xl rounded-2xl flex items-center justify-center shrink-0 border-2 border-amber-400/80 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-all duration-300">
                    {item.icon || '🏆'}
                  </div>
                  <h4 className="font-display text-xl sm:text-2xl font-bold text-white uppercase tracking-wide my-2 group-hover:text-amber-300 transition-colors leading-snug whitespace-normal break-words text-center">
                    {item.title}
                  </h4>
                  {item.subtitle && (
                    <div className="w-full bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-lg py-2.5 px-3 flex items-center justify-center gap-2 text-xs font-semibold whitespace-normal text-center break-words shadow-sm">
                      <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="whitespace-normal text-center break-words uppercase font-bold">{item.subtitle}</span>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>

          {/* Action Buttons Row */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8 max-w-md mx-auto">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={handlePrimaryClick}
              className="w-full sm:w-auto px-8 py-4 font-display text-base font-black uppercase tracking-wider rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2"
              style={{
                backgroundColor: config.colors?.primaryButtonColor || '#0099D6',
                color: config.colors?.primaryButtonTextColor || '#FFFFFF'
              }}
            >
              {config.primaryButtonText || '🖼️ Abrir Meu Álbum'}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleSecondaryClick}
              className="w-full sm:w-auto px-8 py-4 font-display text-base font-black uppercase tracking-wider rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2"
              style={{
                backgroundColor: config.colors?.secondaryButtonColor || '#E5B80B',
                color: config.colors?.secondaryButtonTextColor || '#000000'
              }}
            >
              {config.secondaryButtonText || '🏅 Ver Premiações'}
            </motion.button>
          </div>

          {/* Information Message Below */}
          <div className="pt-2 border-t border-white/10 max-w-2xl mx-auto">
            <p className="text-xs text-gray-300 font-medium italic">
              "{config.infoMessage || 'Quanto mais próximo de completar o álbum, maiores são suas chances de conquistar as premiações.'}"
            </p>
          </div>
        </div>
      </motion.section>

      {/* PRIZES MODAL */}
      {isPrizesModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-brand-surface border border-brand-gold/30 p-6 sm:p-8 rounded-3xl max-w-2xl w-full space-y-6 shadow-2xl relative overflow-hidden"
          >
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/20 text-amber-400 rounded-xl flex items-center justify-center font-bold text-xl">
                  🏆
                </div>
                <div>
                  <h3 className="font-display text-xl uppercase tracking-wider text-white">
                    Premiações Oficiais da Copa Astão
                  </h3>
                  <p className="text-xs text-gray-400">
                    Confira as recompensas para os maiores colecionadores
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsPrizesModalOpen(false)}
                className="text-gray-400 hover:text-white p-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5 max-h-[65vh] overflow-y-auto pr-1">
              {systemPrizes.length > 0 ? (
                systemPrizes.map((p) => (
                  <div key={p.id} className="p-6 bg-gradient-to-br from-brand-surface via-brand-dark to-black/90 border-2 border-amber-400/40 rounded-3xl flex flex-col items-center text-center gap-4 shadow-2xl hover:scale-[1.02] hover:border-amber-400 hover:shadow-amber-500/20 transition-all duration-300">
                    <div className="w-36 h-36 sm:w-44 sm:h-44 bg-black/60 rounded-2xl p-3 shrink-0 border-2 border-amber-400/80 shadow-lg shadow-amber-500/20 flex items-center justify-center">
                      <img src={p.imageUrl || '/copa26.png'} alt={p.name} className="w-full h-full object-contain drop-shadow-md" referrerPolicy="no-referrer" />
                    </div>
                    <div className="space-y-3 flex-1 w-full flex flex-col items-center text-center">
                      <h4 className="font-display text-xl sm:text-2xl text-amber-300 font-bold uppercase tracking-wide whitespace-normal text-center my-1">{p.name}</h4>
                      
                      {p.description && (
                        <p className="text-xs sm:text-sm text-gray-200 leading-relaxed font-medium whitespace-normal text-center break-words">{p.description}</p>
                      )}

                      <div className="w-full bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-lg py-2.5 px-3 flex items-center justify-center gap-2 text-xs font-semibold whitespace-normal text-center break-words shadow-sm">
                        <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="whitespace-normal text-center break-words uppercase font-bold">{p.deliveryCriteria || 'Sorteio ao completar o álbum'}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400 text-xs">
                  Nenhum prêmio cadastrado no momento.
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-white/10">
              {onNavigateToRanking && (
                <button
                  onClick={() => {
                    setIsPrizesModalOpen(false);
                    onNavigateToRanking();
                  }}
                  className="px-5 py-2.5 bg-brand-gold text-black font-bold uppercase text-xs rounded-xl shadow-lg"
                >
                  Ver Ranking Atual
                </button>
              )}
              <button
                onClick={() => setIsPrizesModalOpen(false)}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white font-bold uppercase text-xs rounded-xl"
              >
                Fechar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}

export default function HomeTab({
  onNavigateToLogin,
  onNavigateToAdmin,
  onOpenPack,
  isLoadingPack,
  packError,
  onNavigateToAlbum,
  onNavigateToRanking,
  userProfile,
  onClaimRecyclePack,
  isRecycling
}: HomeTabProps) {
  const { settings } = useSystemSettings();
  const [countdown, setCountdown] = useState({ days: 4, hours: 12, minutes: 45, seconds: 32 });


  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        } else {
          return { days: 4, hours: 12, minutes: 45, seconds: 0 };
        }
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-10 pb-16" id="home-view">
      
      {/* 1. EVENT COUNTDOWN BANNER (No topo da área principal, logo abaixo da Navbar) */}
      <EventCountdownSection
        onNavigateToAlbum={onNavigateToAlbum}
        onNavigateToRanking={onNavigateToRanking}
        onNavigateToLogin={onNavigateToLogin}
        onOpenPack={onOpenPack}
      />

      {/* 2. HERO BANNER MAIN */}
      <section className="relative overflow-hidden bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 border border-white/5 rounded-3xl p-6 sm:p-10 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-8">
        
        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-brand-blue/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-brand-gold/5 rounded-full blur-[80px] pointer-events-none" />

        {/* Left Content */}
        <div className="max-w-2xl space-y-6 z-10 text-center lg:text-left">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-brand-blue/10 border border-brand-blue/20 text-brand-blue-glow rounded-full text-xs uppercase font-mono tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            ÁLBUM OFICIAL DE FIGURINHAS • COPA ASTÃO 2026
          </div>
          
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-none tracking-tight text-white uppercase">
            COPA ASTÃO <span className="text-brand-gold-glow drop-shadow-[0_0_15px_rgba(254,207,46,0.3)]">2026</span>
          </h1>

          <p className="text-gray-300 text-base sm:text-lg max-w-xl leading-relaxed">
            Bem-vindo ao álbum digital oficial. Acesse sua conta de jogador para rasgar pacotes, 
            colecionar cards exclusivos, trocar figurinhas repetidas e completar seu álbum!
          </p>

          {/* User Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2">
            {!userProfile ? (
              <>
                <button
                  onClick={onNavigateToLogin}
                  className="px-8 py-4 bg-brand-blue hover:bg-sky-500 text-white rounded-xl font-display text-lg tracking-wider uppercase border-b-4 border-sky-700 shadow-xl shadow-sky-950/50 flex items-center justify-center gap-2.5 transition-all hover:scale-105"
                >
                  <UserCheck className="w-5 h-5" />
                  Entrar no Sistema
                </button>
                <button
                  onClick={onNavigateToAdmin}
                  className="px-6 py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-display text-base tracking-wider uppercase border border-white/15 hover:border-white/25 flex items-center justify-center gap-2 transition-all hover:scale-105"
                >
                  <Shield className="w-4 h-4 text-brand-gold-glow" />
                  Painel do Administrador
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onOpenPack}
                  disabled={isLoadingPack || userProfile.totalPacksAvailable <= 0}
                  className="px-8 py-4 bg-gradient-to-r from-amber-500 to-brand-gold hover:from-amber-400 hover:to-yellow-400 text-black font-display text-lg tracking-wider uppercase border-b-4 border-amber-700 rounded-xl shadow-xl shadow-amber-950/50 flex items-center justify-center gap-2.5 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Package className="w-5 h-5 fill-black" />
                  {isLoadingPack ? 'Abrindo Pacote...' : `Abrir Pacote (${userProfile.totalPacksAvailable} disp.)`}
                </button>
                <button
                  onClick={onNavigateToAlbum}
                  className="px-6 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-display text-base tracking-wider uppercase border border-white/20 flex items-center justify-center gap-2 transition-all hover:scale-105"
                >
                  <ShieldCheck className="w-5 h-5 text-brand-blue-glow" />
                  Meu Álbum ({userProfile.collectionProgress}%)
                </button>
              </>
            )}
          </div>
        </div>

        {/* Official Logo Shield */}
        <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center z-10">
          <motion.div
            animate={{ 
              y: [0, -8, 0],
              rotateY: [0, 5, -5, 0]
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-full h-full flex items-center justify-center p-3 bg-brand-dark/40 backdrop-blur-md rounded-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,153,214,0.2)] relative overflow-hidden"
          >
            <div className="holo-shine" />
            <img 
              src={settings.logoUrl || "/copa26.png"} 
              alt="Copa Astão 2026 Logo Oficial" 
              className="w-full h-full object-contain rounded-2xl drop-shadow-[0_10px_30px_rgba(254,207,46,0.3)]"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </div>
      </section>

      {/* BANNER DE DESTAQUE DE PREMIAÇÕES DO ÁLBUM */}
      <RewardsBannerSection 
        onNavigateToAlbum={onNavigateToAlbum} 
        onNavigateToRanking={onNavigateToRanking} 
      />

      {/* 3. LOGGED PLAYER QUICK STATUS & OPEN PACK STATION */}
      {userProfile && (
        <section className="bg-gradient-to-b from-neutral-900 to-brand-surface border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/10">
            <img 
              src={userProfile.photoUrl || '/copa26.png'} 
              alt={userProfile.nickname} 
              className="w-16 h-16 rounded-2xl object-cover border-2 border-brand-gold shadow-md"
              referrerPolicy="no-referrer"
            />
            <div className="text-left flex-1">
              <span className="text-xs font-mono font-bold text-brand-gold-glow uppercase tracking-wider block">
                {userProfile.team}
              </span>
              <h2 className="font-display text-2xl text-white uppercase tracking-wider">
                {userProfile.nickname}
              </h2>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                <span>Código: <strong className="text-white font-mono">{userProfile.accessCode}</strong></span>
                <span>•</span>
                <span>Progresso: <strong className="text-brand-blue-glow">{userProfile.collectionProgress}%</strong></span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 text-center">
            <div className="bg-brand-dark/60 p-3 rounded-xl border border-white/5">
              <span className="text-[10px] text-gray-400 uppercase font-mono block">Pacotes Disp.</span>
              <span className="text-2xl font-bold font-mono text-brand-gold-glow">{userProfile.totalPacksAvailable}</span>
            </div>
            <div className="bg-brand-dark/60 p-3 rounded-xl border border-white/5">
              <span className="text-[10px] text-gray-400 uppercase font-mono block">Pacotes Grátis</span>
              <span className="text-2xl font-bold font-mono text-white">{userProfile.freePacks}</span>
            </div>
            <div className="bg-brand-dark/60 p-3 rounded-xl border border-white/5">
              <span className="text-[10px] text-gray-400 uppercase font-mono block">Figurinhas</span>
              <span className="text-2xl font-bold font-mono text-brand-blue-glow">{userProfile.uniqueStickers}</span>
            </div>
            <div className="bg-brand-dark/60 p-3 rounded-xl border border-white/5">
              <span className="text-[10px] text-gray-400 uppercase font-mono block">Repetidas</span>
              <span className="text-2xl font-bold font-mono text-amber-400">{userProfile.repeatedStickers}</span>
            </div>
          </div>

          {packError && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs text-left">
              <strong>Erro:</strong> {packError}
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onOpenPack}
            disabled={isLoadingPack || userProfile.totalPacksAvailable <= 0}
            className="w-full py-4 bg-gradient-to-r from-amber-500 to-brand-gold hover:from-amber-400 hover:to-yellow-400 text-black font-display text-xl tracking-wider uppercase font-black rounded-xl shadow-lg shadow-amber-950/40 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isLoadingPack ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Sorteando Figurinhas...
              </div>
            ) : (
              <>
                <Package className="w-6 h-6 fill-black" />
                {userProfile.totalPacksAvailable > 0 ? 'ABRIR PACOTE AGORA' : 'SEM PACOTES DISPONÍVEIS'}
              </>
            )}
          </motion.button>

          {/* Recycling trade banner */}
          {userProfile.repeatedStickers >= 5 && (
            <div className="mt-5 p-4 bg-gradient-to-r from-emerald-950/80 to-teal-950/80 border border-emerald-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center shrink-0">
                  <RefreshCw className="w-5 h-5 animate-spin-slow" />
                </div>
                <div>
                  <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-widest block">
                    Troca Disponível!
                  </span>
                  <p className="text-xs text-white font-bold">
                    Você tem {userProfile.repeatedStickers} repetidas ({Math.floor(userProfile.repeatedStickers / 5)} pacote(s) grátis)
                  </p>
                </div>
              </div>
              <button
                onClick={() => onClaimRecyclePack && onClaimRecyclePack()}
                disabled={isRecycling}
                className="w-full sm:w-auto px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-display text-xs uppercase font-bold rounded-lg shadow-md transition-all flex items-center justify-center gap-1.5 shrink-0"
              >
                {isRecycling ? 'Trocando...' : 'Resgatar 1 Pacote'}
              </button>
            </div>
          )}
        </section>
      )}

      {/* 4. FOOTER STATS */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t border-white/5">
        <div className="bg-brand-surface/40 p-5 rounded-xl text-center border border-white/5">
          <div className="font-display text-3xl sm:text-4xl text-brand-blue-glow leading-none font-bold">100%</div>
          <div className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider mt-1.5 font-medium">Contas Individuais</div>
        </div>
        <div className="bg-brand-surface/40 p-5 rounded-xl text-center border border-white/5">
          <div className="font-display text-3xl sm:text-4xl text-brand-blue-glow leading-none font-bold">48</div>
          <div className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider mt-1.5 font-medium">Figurinhas no Álbum</div>
        </div>
        <div className="bg-brand-surface/40 p-5 rounded-xl text-center border border-white/5">
          <div className="font-display text-3xl sm:text-4xl text-brand-blue-glow leading-none font-bold">4</div>
          <div className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider mt-1.5 font-medium">Times Oficiais</div>
        </div>
        <div className="bg-brand-surface/40 p-5 rounded-xl text-center border border-white/5">
          <div className="font-display text-3xl sm:text-4xl text-brand-gold-glow leading-none font-bold">6</div>
          <div className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider mt-1.5 font-medium">Lendas Douradas</div>
        </div>
      </section>

    </div>
  );
}
