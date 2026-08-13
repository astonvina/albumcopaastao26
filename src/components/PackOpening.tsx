import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sticker, UserProfile } from '../types';
import Card3D from './Card3D';
import { Sparkles, Zap, RotateCcw, Volume2, Shield, RefreshCw, Gift, X } from 'lucide-react';
import { useSystemSettings } from '../context/SystemSettingsContext';

interface PackOpeningProps {
  stickers: Sticker[];
  onClose: () => void;
  userProfile?: UserProfile | null;
  onClaimRecyclePack?: () => Promise<void>;
  isRecycling?: boolean;
}

// Custom real-time audio synthesizer for zero-dependency sound effects
function playSound(type: 'regular' | 'legend' | 'explosion') {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    if (type === 'explosion') {
      // White noise explosion with low bass kick
      const bufferSize = ctx.sampleRate * 1.5;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(40, now + 1.2);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.6, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 1.4);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(now);

      // Low sub bass rumble
      const osc = ctx.createOscillator();
      const subGain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.linearRampToValueAtTime(30, now + 0.8);
      subGain.gain.setValueAtTime(0.8, now);
      subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.9);
      osc.connect(subGain);
      subGain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.0);
    } 
    else if (type === 'legend') {
      // Epic sports fanfare chord (C Major Chord: C4, E4, G4, C5, E5) with brass filter sweeps
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25];
      
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + 0.05);
        osc.frequency.linearRampToValueAtTime(freq * 1.008, now + 0.3);
        osc.frequency.linearRampToValueAtTime(freq * 0.992, now + 0.6);
        osc.frequency.linearRampToValueAtTime(freq, now + 1.5);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(100, now);
        filter.frequency.exponentialRampToValueAtTime(3000, now + 0.4 + idx * 0.05);
        filter.frequency.exponentialRampToValueAtTime(800, now + 1.8);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.25, now + 0.1 + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now);
        osc.stop(now + 2.4);
      });
    } 
    else if (type === 'regular') {
      // Sleek electronic card swoosh/reveal
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.3);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.5);
    }
  } catch (err) {
    console.warn('AudioContext failed:', err);
  }
}

export default function PackOpening({
  stickers,
  onClose,
  userProfile,
  onClaimRecyclePack,
  isRecycling
}: PackOpeningProps) {
  const { settings } = useSystemSettings();
  const packCover = settings.packCoverUrl || settings.albumCoverUrl || '/copa26.png';

  const [phase, setPhase] = useState<'sealed' | 'exploding' | 'reveal-cards' | 'summary'>('sealed');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState([false, false, false]);
  const [screenShake, setScreenShake] = useState(false);
  const [hasUnmuted, setHasUnmuted] = useState(false);

  // Auto trigger explosion phase after a slight transition if desired, 
  // but let's make it interactive so the user clicks "ABRIR PACONTINHO" first!

  const handleOpenPack = () => {
    setPhase('exploding');
    playSound('explosion');
    
    // Simulate explosion and transition to cards reveal
    setTimeout(() => {
      setPhase('reveal-cards');
      revealCard(0);
    }, 1800);
  };

  const revealCard = (index: number) => {
    setCurrentCardIndex(index);
    const sticker = stickers[index];
    const isLegend = sticker?.rarity === 'Legend';

    // Play corresponding sound
    if (isLegend) {
      playSound('legend');
      // Trigger screenshake for Legend!
      setScreenShake(true);
      setTimeout(() => setScreenShake(false), 800);
    } else {
      playSound('regular');
    }

    // Mark flipped
    setIsFlipped(prev => {
      const next = [...prev];
      next[index] = true;
      return next;
    });
  };

  const handleNextCard = () => {
    if (currentCardIndex < 2) {
      revealCard(currentCardIndex + 1);
    } else {
      setPhase('summary');
    }
  };

  // Helper for team color ring glows during pack burst
  const activeHasLegend = stickers.some(s => s.rarity === 'Legend');

  return (
    <div 
      className={`fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-start sm:justify-center p-3 sm:p-4 min-h-[100dvh] h-[100dvh] overflow-y-auto pb-28 sm:pb-6 transition-all duration-300 ${screenShake ? 'animate-[shake_0.5s_infinite]' : ''}`}
      id="pack-opening-container"
    >
      {/* Absolute CSS Shake keyframe injecting dynamically */}
      <style>{`
        @keyframes shake {
          0% { transform: translate(0, 0) rotate(0deg); }
          10% { transform: translate(-4px, 2px) rotate(-1deg); }
          20% { transform: translate(3px, -3px) rotate(1deg); }
          30% { transform: translate(-2px, -2px) rotate(0deg); }
          40% { transform: translate(2px, 2px) rotate(1deg); }
          50% { transform: translate(-3px, 1px) rotate(-1deg); }
          60% { transform: translate(4px, -2px) rotate(0deg); }
          70% { transform: translate(-2px, 3px) rotate(1deg); }
          85% { transform: translate(3px, -1px) rotate(-1deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }
      `}</style>

      {/* FIXED CLOSE "X" BUTTON FOR MOBILE & DESKTOP */}
      <button
        onClick={onClose}
        className="fixed top-4 right-4 z-[9999] p-2.5 bg-black/80 hover:bg-neutral-800 border border-white/20 text-white rounded-full shadow-2xl backdrop-blur-md transition-all flex items-center justify-center active:scale-95 cursor-pointer"
        title="Fechar e voltar ao álbum"
        aria-label="Fechar"
        id="pack-opening-close-x-btn"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      {/* Floating Sparkles & Stadium Background Lights */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-brand-blue/15 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-brand-gold/15 blur-3xl" />
        {phase === 'exploding' && (
          <div className="absolute inset-0 bg-white animate-ping opacity-25" />
        )}
      </div>

      <AnimatePresence mode="wait">
        
        {/* PHASE 1: SEALED PACK */}
        {phase === 'sealed' && (
          <motion.div
            key="sealed"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.1, opacity: 0 }}
            className="flex flex-col items-center max-w-sm text-center my-auto py-6"
            id="sealed-pack-view"
          >
            {/* Title Badge */}
            <div className="mb-3 sm:mb-4 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-full text-xs uppercase font-mono tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Pacote de Figurinhas Oficial
            </div>

            {/* Pack Foil Graphic */}
            <motion.div
              animate={{ 
                y: [0, -8, 0],
                rotate: [0, 0.5, -0.5, 0]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              onClick={handleOpenPack}
              className="relative w-56 h-[340px] sm:w-64 sm:h-[380px] rounded-2xl cursor-pointer bg-gradient-to-b from-neutral-800 via-neutral-900 to-black border-4 border-brand-blue shadow-[0_0_40px_rgba(0,153,214,0.35)] flex flex-col justify-between p-5 sm:p-6 overflow-hidden select-none hover:scale-105 transition-all group"
            >
              {/* Foil lines design */}
              <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.15)_50%,transparent_75%)] bg-[length:250px_250px]" />
              
              {/* Top Tear zig-zag line */}
              <div className="absolute top-0 left-0 right-0 h-4 bg-brand-blue/30 flex justify-between px-2 overflow-hidden">
                {Array.from({ length: 15 }).map((_, i) => (
                  <div key={i} className="w-4 h-4 bg-neutral-950 rotate-45 transform origin-top-left -mt-2" />
                ))}
              </div>

              {/* Pack Crest */}
              <div className="flex flex-col items-center mt-4 sm:mt-6">
                <div className="w-20 h-20 sm:w-24 sm:h-24 overflow-hidden rounded-full border-2 border-brand-blue-glow shadow-md group-hover:scale-110 transition-transform duration-300 flex items-center justify-center bg-brand-dark">
                  <img 
                    src={packCover} 
                    alt="Copa Astão 2026" 
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <h3 className="font-display text-xl sm:text-2xl uppercase tracking-wide text-white mt-3 sm:mt-4">
                  COPA ASTÃO
                </h3>
                <span className="text-[9px] sm:text-[10px] font-mono tracking-widest text-brand-blue-glow bg-brand-blue/10 border border-brand-blue/20 px-2.5 py-0.5 rounded-sm uppercase">
                  Álbum Oficial 2026
                </span>
              </div>

              {/* Middle Graphics */}
              <div className="text-center">
                <div className="font-display text-3xl sm:text-4xl text-brand-gold font-bold tracking-tight">
                  3 cartas
                </div>
                <div className="text-[9px] sm:text-[10px] text-gray-400 font-mono tracking-wider mt-0.5 uppercase">
                  Sorteio Real em Servidor
                </div>
              </div>

              {/* Bottom Pack details */}
              <div className="text-center mb-1 sm:mb-2 z-10">
                <span className="text-[9px] sm:text-[10px] font-semibold text-white/50 block">CLIQUE PARA RASGAR</span>
                <div className="h-1 w-16 sm:w-20 bg-brand-blue mx-auto mt-1 rounded-full group-hover:w-28 transition-all" />
              </div>

              {/* Metallic corner shines */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rotate-45 translate-x-10 -translate-y-10" />
            </motion.div>

            {/* Hint message */}
            <p className="text-gray-400 text-xs sm:text-sm mt-4 sm:mt-6">
              Toque no pacotinho para iniciar a abertura épica!
            </p>
          </motion.div>
        )}

        {/* PHASE 2: EXPLODING PACK (Luzes, explosão e partículas) */}
        {phase === 'exploding' && (
          <motion.div
            key="exploding"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center text-center z-10 my-auto"
            id="pack-explosion-view"
          >
            {/* Glowing orb inside pack center */}
            <motion.div
              initial={{ scale: 0.1, rotate: 0 }}
              animate={{ 
                scale: [1, 2, 80],
                rotate: 360,
                opacity: [1, 1, 0]
              }}
              transition={{ duration: 1.8, ease: 'easeIn' }}
              className={`w-24 h-24 rounded-full bg-gradient-to-r ${activeHasLegend ? 'from-brand-gold to-white shadow-[0_0_80px_#fecf2e]' : 'from-brand-blue to-white shadow-[0_0_80px_#4fa8f4]'} flex items-center justify-center`}
            />

            {/* Glowing particle rings */}
            <div className="absolute inset-0 flex items-center justify-center">
              {Array.from({ length: 18 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.5, x: 0, y: 0 }}
                  animate={{ 
                    opacity: [0, 1, 0],
                    scale: [0.5, 2, 0.1],
                    x: Math.cos((i * 20 * Math.PI) / 180) * 350,
                    y: Math.sin((i * 20 * Math.PI) / 180) * 350
                  }}
                  transition={{ duration: 1.5, ease: 'easeOut', delay: i * 0.02 }}
                  className={`absolute w-3 h-3 rounded-full ${activeHasLegend ? 'bg-brand-gold-glow' : 'bg-brand-blue-glow'}`}
                />
              ))}
            </div>

            <motion.h2 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: [1, 1.3, 1], opacity: 1 }}
              className="font-display text-2xl sm:text-4xl text-white tracking-widest uppercase mt-6 animate-pulse"
            >
              RASGANDO ENVELOPE...
            </motion.h2>
          </motion.div>
        )}

        {/* PHASE 3: REVEAL CARDS (Cartas abrem uma por vez) */}
        {phase === 'reveal-cards' && (
          <motion.div
            key="reveal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-between sm:justify-center w-full max-w-md my-auto py-2 sm:py-4 min-h-[calc(100dvh-90px)] sm:min-h-0"
            id="card-reveal-view"
          >
            <div className="text-center mb-2 sm:mb-6">
              <span className="font-mono text-[10px] sm:text-xs tracking-widest text-brand-blue-glow block uppercase mb-0.5 sm:mb-1">
                REVELAÇÃO DE CARTAS ({currentCardIndex + 1} de 3)
              </span>
              <h2 className="font-display text-lg sm:text-2xl text-white uppercase tracking-wider">
                {stickers[currentCardIndex]?.rarity === 'Legend' ? (
                  <span className="text-brand-gold animate-bounce flex items-center justify-center gap-1.5">
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 fill-brand-gold text-amber-200" />
                    ITEM LENDÁRIO ENCONTRADO!
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 fill-brand-gold text-amber-200" />
                  </span>
                ) : (
                  "CARTA OBTIDA"
                )}
              </h2>
            </div>

            {/* Displaying Current Card with animated entrance flip */}
            <div className="relative mb-4 sm:mb-8 min-h-[280px] xs:min-h-[320px] sm:min-h-[450px] md:min-h-[660px] flex items-center justify-center w-full max-w-[220px] xs:max-w-[260px] sm:max-w-[380px] md:max-w-[520px] mx-auto">
              {/* Specialized visual effects for Legends */}
              {stickers[currentCardIndex]?.rarity === 'Legend' && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-0 scale-100 sm:scale-125">
                  {/* Glowing background circles */}
                  <div className="absolute w-48 h-48 sm:w-72 sm:h-72 rounded-full bg-brand-gold/20 blur-3xl animate-pulse" />
                  
                  {/* Floating gold glitter particles */}
                  {Array.from({ length: 15 }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ y: 200, x: (i - 7) * 20, opacity: 0, scale: 0.5 }}
                      animate={{ 
                        y: [-100, -350], 
                        opacity: [0, 1, 0],
                        scale: [0.5, 1.2, 0.5]
                      }}
                      transition={{ 
                        duration: 2.2, 
                        repeat: Infinity, 
                        ease: 'easeOut',
                        delay: i * 0.15 
                      }}
                      className="absolute text-brand-gold-glow"
                    >
                      ✦
                    </motion.div>
                  ))}
                </div>
              )}

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentCardIndex}
                  initial={{ rotateY: 90, scale: 0.7, opacity: 0 }}
                  animate={{ rotateY: 0, scale: 1, opacity: 1 }}
                  exit={{ rotateY: -90, scale: 0.7, opacity: 0 }}
                  transition={{ type: 'spring', damping: 15, stiffness: 100 }}
                  className="z-10 w-full flex justify-center mx-auto"
                >
                  <Card3D 
                    sticker={stickers[currentCardIndex]} 
                    size="lg" 
                    interactive={true} 
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Button to show next card or summary */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNextCard}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-xs sm:static sm:translate-x-0 sm:w-auto z-[9999] px-6 py-3.5 sm:px-8 sm:py-3.5 bg-brand-blue text-white rounded-xl font-display text-base sm:text-lg tracking-wider uppercase border-b-4 border-sky-700 shadow-2xl shadow-sky-900/50 flex items-center justify-center gap-2 backdrop-blur-md"
              id="next-card-btn"
            >
              {currentCardIndex < 2 ? (
                <>
                  Ver Próxima Carta
                  <Zap className="w-5 h-5 fill-white text-brand-blue-glow" />
                </>
              ) : (
                <>
                  Ver Resumo das Cartas
                  <Sparkles className="w-5 h-5 fill-white text-brand-gold-glow" />
                </>
              )}
            </motion.button>
          </motion.div>
        )}

        {/* PHASE 4: FINAL SUMMARY SCREEN */}
        {phase === 'summary' && (
          <motion.div
            key="summary"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center w-full max-w-4xl text-center my-auto py-2 sm:py-4"
            id="summary-pack-view"
          >
            {/* Celebration Title */}
            <div className="mb-2 sm:mb-4">
              <span className="font-mono text-[10px] sm:text-xs text-brand-gold-glow tracking-widest uppercase block">
                PACOTE ABERTO COM SUCESSO!
              </span>
              <h2 className="font-display text-xl sm:text-4xl text-white tracking-wider uppercase mt-0.5">
                SUAS NOVAS FIGURINHAS
              </h2>
              <p className="text-gray-400 text-xs sm:text-sm mt-0.5 sm:mt-1 px-2">
                Estas figurinhas foram adicionadas automaticamente ao banco do seu álbum.
              </p>
            </div>

            {/* 3 Cards Grid side-by-side */}
            <div className="grid grid-cols-3 gap-1.5 xs:gap-3 sm:gap-6 my-2 sm:my-8 justify-center items-center w-full max-w-3xl px-1 sm:px-4">
              {stickers.map((sticker, idx) => (
                <motion.div
                  key={sticker.id}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.2, type: 'spring', damping: 12 }}
                  className="flex justify-center max-w-[105px] xs:max-w-[130px] sm:max-w-none mx-auto w-full"
                >
                  <Card3D sticker={sticker} size="sm" interactive={true} />
                </motion.div>
              ))}
            </div>

            {/* Action buttons fixed at bottom on mobile, static on desktop */}
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-xs sm:max-w-none sm:static sm:translate-x-0 sm:w-auto z-[9999] flex flex-col sm:flex-row gap-2.5 sm:gap-4 justify-center items-center p-2 sm:p-0 bg-neutral-950/90 sm:bg-transparent rounded-2xl sm:rounded-none backdrop-blur-md sm:backdrop-blur-none border border-white/10 sm:border-none shadow-2xl">
              {userProfile && userProfile.repeatedStickers >= 5 && onClaimRecyclePack && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={isRecycling}
                  onClick={async () => {
                    setPhase('sealed');
                    setCurrentCardIndex(0);
                    await onClaimRecyclePack();
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 sm:px-8 sm:py-4 bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-display text-xs sm:text-lg tracking-wider uppercase font-bold rounded-xl shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${isRecycling ? 'animate-spin' : ''}`} />
                  Trocar Repetidas ({userProfile.repeatedStickers})
                </motion.button>
              )}

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-3.5 sm:px-8 sm:py-4 bg-brand-blue text-white rounded-xl font-display text-sm sm:text-lg tracking-wider uppercase border-b-4 border-sky-700 shadow-xl shadow-black/80 flex items-center justify-center gap-2"
                id="finish-open-pack-btn"
              >
                <RotateCcw className="w-5 h-5" />
                Ir para o Álbum / Início
              </motion.button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
