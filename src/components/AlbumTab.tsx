import React, { useState } from 'react';
import { Sticker, UserProfile } from '../types';
import Card3D from './Card3D';
import { Trophy, RefreshCw, Sparkles, Gift, Layers, CheckCircle2, Info, X } from 'lucide-react';

interface AlbumTabProps {
  stickers: Sticker[];
  collectedIds: string[];
  userProfile?: UserProfile | null;
  onClaimRecyclePack?: () => Promise<void>;
  isRecycling?: boolean;
}

export default function AlbumTab({
  stickers,
  collectedIds,
  userProfile,
  onClaimRecyclePack,
  isRecycling
}: AlbumTabProps) {
  const [selectedSticker, setSelectedSticker] = useState<Sticker | null>(null);

  // Derived stats
  const repeatedCount = userProfile?.repeatedStickers ?? 0;
  const freePacksAvailable = Math.floor(repeatedCount / 5);
  const progressStep = repeatedCount % 5;
  const canTrade = repeatedCount >= 5;
  const uniqueCount = userProfile?.uniqueStickers ?? collectedIds.length;
  const totalCount = stickers.length || 30;
  const progressPercentage = Math.min(100, Math.round((uniqueCount / totalCount) * 100));
  const isAlbumCompleted = userProfile?.completedAlbum || uniqueCount >= totalCount;

  // Group stickers by their team
  const teamsList: ('Time Branco' | 'Time Preto' | 'Time Azul' | 'Time Vermelho' | 'Legends')[] = [
    'Time Branco',
    'Time Preto',
    'Time Azul',
    'Time Vermelho',
    'Legends'
  ];

  // Helper to get slot tags/styling
  const getTeamHeaderStyle = (team: string) => {
    switch (team) {
      case 'Time Branco': return 'border-l-4 border-stone-300 text-stone-100';
      case 'Time Preto': return 'border-l-4 border-neutral-700 text-neutral-300';
      case 'Time Azul': return 'border-l-4 border-sky-500 text-sky-400';
      case 'Time Vermelho': return 'border-l-4 border-red-500 text-red-500';
      case 'Legends': return 'border-l-4 border-amber-500 text-amber-400';
      default: return 'border-l-4 border-gray-500 text-gray-400';
    }
  };

  const getTeamSlotHeaderColor = (team: string) => {
    switch (team) {
      case 'Time Branco': return 'bg-stone-100/15 text-stone-200 border-stone-300/30';
      case 'Time Preto': return 'bg-neutral-800/50 text-white border-neutral-700/30';
      case 'Time Azul': return 'bg-sky-500/15 text-sky-300 border-sky-400/30';
      case 'Time Vermelho': return 'bg-red-500/15 text-red-400 border-red-500/30';
      case 'Legends': return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      default: return '';
    }
  };

  return (
    <div className="space-y-8 pb-16" id="album-view">
      
      {/* CELEBRATORY NOTIFICATION BANNER (When >= 5 repeated stickers accumulated) */}
      {canTrade && (
        <section className="bg-gradient-to-r from-emerald-950 via-brand-surface to-emerald-900/80 border-2 border-emerald-500/40 p-5 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-bounce-subtle">
          <div className="flex items-center gap-4 text-left">
            <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-400/50 text-emerald-400 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-emerald-500/30 uppercase">
                  {freePacksAvailable} {freePacksAvailable === 1 ? 'PACOTE GRÁTIS DISPONÍVEL' : 'PACOTES GRÁTIS DISPONÍVEIS'}
                </span>
              </div>
              <h3 className="font-display text-lg text-white uppercase tracking-wider mt-1">
                🎉 Você acumulou {repeatedCount} figurinhas repetidas!
              </h3>
              <p className="text-xs text-emerald-200/80 mt-0.5">
                Troque 5 repetidas e resgate um novo pacote grátis imediatamente com o sistema de reciclagem.
              </p>
            </div>
          </div>

          <button
            onClick={() => onClaimRecyclePack && onClaimRecyclePack()}
            disabled={isRecycling}
            className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-display text-xs uppercase tracking-wider font-bold rounded-xl shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
          >
            {isRecycling ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-black" />
                Sorteando Pacote...
              </>
            ) : (
              <>
                <Gift className="w-4 h-4 text-black" />
                Resgatar Pacote Grátis Agora
              </>
            )}
          </button>
        </section>
      )}

      {/* ALBUM HEADER & RECYCLING CONTROL DASHBOARD */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-gradient-to-br from-neutral-900 via-brand-surface to-neutral-950 border border-white/10 p-6 rounded-2xl shadow-xl">
        
        {/* Left: Album Progress */}
        <div className="lg:col-span-5 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/10 pb-6 lg:pb-0 lg:pr-6 space-y-4">
          <div className="flex items-center gap-4 text-left">
            <div className="w-12 h-12 bg-brand-blue/10 border border-brand-blue/20 text-brand-blue-glow rounded-xl flex items-center justify-center shadow-inner shrink-0">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-display text-2xl uppercase tracking-wider text-white flex items-center gap-2">
                ÁLBUM DIGITAL 
                {isAlbumCompleted && (
                  <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded uppercase">
                    COMPLETO! 🎉
                  </span>
                )}
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                Copa Astão 2026 — Coleção de 30 atletas oficiais.
              </p>
            </div>
          </div>

          <div className="bg-brand-dark/60 border border-white/5 p-4 rounded-xl space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">Álbum Concluído</span>
              <div className="font-mono flex items-baseline gap-1">
                <span className="text-2xl font-bold text-brand-gold-glow">{uniqueCount}</span>
                <span className="text-sm text-gray-500">/ {totalCount}</span>
              </div>
            </div>

            <div className="h-3 w-full bg-neutral-800 rounded-full overflow-hidden relative shadow-inner">
              <div 
                className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-brand-blue via-teal-400 to-brand-gold rounded-full transition-all duration-1000"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            <div className="flex justify-between text-[10px] font-mono text-gray-400 pt-0.5">
              <span>{isAlbumCompleted ? 'Proteção contra repetição desativada' : 'Proteção Inteligente Ativa'}</span>
              <span className="font-bold text-brand-gold">{progressPercentage}% colado</span>
            </div>
          </div>
        </div>

        {/* Right: Smart Recycling Control System (5 Repeats = 1 Free Pack) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-emerald-400" />
              <h2 className="font-display text-base uppercase tracking-wider text-white">
                SISTEMA DE RECICLAGEM
              </h2>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full font-bold uppercase">
              5 Repetidas = 1 Pacote Grátis
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Repeated Stat */}
            <div className="bg-brand-dark/40 border border-white/5 p-3 rounded-xl text-left">
              <span className="text-[10px] font-mono text-gray-400 uppercase block">Repetidas Acumuladas</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-mono font-bold text-amber-400">{repeatedCount}</span>
                <span className="text-[10px] text-gray-500">cards</span>
              </div>
            </div>

            {/* Free Packs Stat */}
            <div className="bg-brand-dark/40 border border-white/5 p-3 rounded-xl text-left">
              <span className="text-[10px] font-mono text-gray-400 uppercase block">Pacotes Grátis</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-mono font-bold text-emerald-400">{freePacksAvailable}</span>
                <span className="text-[10px] text-gray-500">disponíveis</span>
              </div>
            </div>

            {/* Progress to next pack */}
            <div className="col-span-2 sm:col-span-1 bg-brand-dark/40 border border-white/5 p-3 rounded-xl text-left flex flex-col justify-between">
              <span className="text-[10px] font-mono text-gray-400 uppercase block">Meta de Troca</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm font-mono font-bold text-white">
                  {canTrade ? '5/5 (Pronto!)' : `${progressStep}/5`}
                </span>
                <span className="text-[10px] font-mono text-gray-500">
                  {canTrade ? 'Pode Trocar' : `Faltam ${5 - progressStep}`}
                </span>
              </div>
            </div>
          </div>

          {/* Progress Bar 0/5 -> 5/5 */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-mono text-gray-400">
              <span>Progresso para próximo pacote:</span>
              <span className="font-bold text-emerald-400">{canTrade ? '5 / 5 completados' : `${progressStep} / 5 acumuladas`}</span>
            </div>
            <div className="h-2.5 w-full bg-neutral-800 rounded-full overflow-hidden p-0.5 border border-white/5 relative">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  canTrade 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-300 animate-pulse' 
                    : 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                }`}
                style={{ width: `${canTrade ? 100 : (progressStep / 5) * 100}%` }}
              />
            </div>
          </div>

          {/* SWAP BUTTON */}
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={() => onClaimRecyclePack && onClaimRecyclePack()}
              disabled={!canTrade || isRecycling}
              className={`w-full py-3 px-4 rounded-xl font-display text-xs uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-2 ${
                canTrade 
                  ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 text-black shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 cursor-pointer' 
                  : 'bg-white/5 border border-white/10 text-gray-500 cursor-not-allowed opacity-60'
              }`}
            >
              {isRecycling ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Realizando Troca de Figurinhas...
                </>
              ) : (
                <>
                  <RefreshCw className={`w-4 h-4 ${canTrade ? 'text-black' : 'text-gray-500'}`} />
                  Trocar 5 repetidas por 1 pacote
                </>
              )}
            </button>
          </div>

        </div>

      </section>

      {/* CATEGORIES GRID (Teams & Legends) */}
      <div className="space-y-12">
        {teamsList.map(team => {
          // Get all stickers for this team (exactly 6)
          const teamStickers = stickers.filter(s => s.team === team);
          const collectedInTeam = teamStickers.filter(s => collectedIds.includes(s.id)).length;

          return (
            <section key={team} className="space-y-5 bg-brand-surface/40 border border-white/5 p-6 rounded-2xl shadow-sm">
              
              {/* Category Header */}
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className={`pl-3 ${getTeamHeaderStyle(team)}`}>
                  <h2 className="font-display text-xl uppercase tracking-wider text-white">
                    {team === 'Legends' ? 'Itens Especiais' : team}
                  </h2>
                  <p className="text-[10px] font-mono text-gray-500 mt-0.5">
                    CATEGORIA OFICIAL DE ATLETAS
                  </p>
                </div>
                <div className={`px-2.5 py-1 text-xs font-mono font-bold uppercase rounded border ${getTeamSlotHeaderColor(team)}`}>
                  {collectedInTeam} / 6 SLOTS COLADOS
                </div>
              </div>

              {/* 6 Slots Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5">
                {teamStickers.map(sticker => {
                  const isCollected = collectedIds.includes(sticker.id);
                  const countInCollection = userProfile?.collectedCounts?.[sticker.id] || (isCollected ? 1 : 0);
                  const duplicateCount = Math.max(0, countInCollection - 1);

                  if (isCollected) {
                    return (
                      <div 
                        key={sticker.id}
                        className="flex flex-col items-center gap-2 group w-full max-w-[240px] mx-auto relative"
                      >
                        {/* Duplicate badge indicator */}
                        {duplicateCount > 0 && (
                          <div className="absolute -top-2 -right-2 z-20 bg-amber-500 text-black text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-black shadow-lg flex items-center gap-1 animate-pulse">
                            <Layers className="w-3 h-3" />
                            +{duplicateCount} Repetida{duplicateCount > 1 ? 's' : ''}
                          </div>
                        )}

                        <Card3D 
                          sticker={sticker} 
                          size="sm" 
                          interactive={true} 
                          onClick={() => setSelectedSticker(sticker)}
                        />
                        <span className="text-[10px] text-brand-blue-glow font-bold font-mono tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                          Clique para ver detalhe
                        </span>
                      </div>
                    );
                  } else {
                    // Empty uncollected slot matching the mockup
                    return (
                      <div 
                        key={sticker.id}
                        className="flex flex-col items-center justify-between p-4 rounded-xl border-2 border-dashed border-white/10 bg-brand-dark/25 aspect-[608/766] w-full max-w-[240px] mx-auto text-center group hover:border-white/20 transition-all relative overflow-hidden"
                      >
                        {/* Recessed overlay */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10 pointer-events-none" />

                        {/* Silhouette/Avatar placeholder icon */}
                        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-gray-600 mt-2">
                          <svg viewBox="0 0 100 100" className="w-6 h-6 text-gray-600 pulse-shimmer">
                            <circle cx="50" cy="35" r="22" fill="currentColor" />
                            <path d="M50 65 C25 65 15 80 15 100 L85 100 C85 80 75 65 50 65 Z" fill="currentColor" />
                          </svg>
                        </div>

                        {/* Sticker index label */}
                        <div className="mb-2">
                          <span className="font-mono text-[11px] font-bold text-gray-500 block">
                            {sticker.number}
                          </span>
                          <span className="text-[9px] text-gray-600 font-mono uppercase tracking-wider block mt-0.5">
                            Não Encontrado
                          </span>
                        </div>
                      </div>
                    );
                  }
                })}
              </div>

            </section>
          );
        })}
      </div>

      {/* DETAIL MODAL (Exibe informações detalhadas ao clicar em figurinhas obtidas) */}
      {selectedSticker && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative bg-brand-surface border border-white/10 rounded-2xl max-w-xl w-full p-6 shadow-2xl flex flex-col md:flex-row gap-6 items-center">
            
            <button 
              onClick={() => setSelectedSticker(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg bg-white/5 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left side: interactive 3D Card */}
            <div className="shrink-0 w-full max-w-[400px] md:w-[400px]">
              <Card3D sticker={selectedSticker} size="md" interactive={true} />
            </div>

            {/* Right side: details */}
            <div className="flex-grow space-y-4 text-left w-full">
              <div>
                <span className={`px-2 py-0.5 text-[9px] font-mono font-bold tracking-wider uppercase border rounded ${
                  selectedSticker.rarity === 'Legend' 
                    ? 'bg-brand-gold/10 border-brand-gold text-brand-gold-glow' 
                    : 'bg-brand-blue/10 border-brand-blue text-brand-blue-glow'
                }`}>
                  {selectedSticker.rarity === 'Legend' ? 'LENDÁRIA' : 'NORMAL'}
                </span>
                
                <h3 className="font-display text-2xl uppercase text-white tracking-wide mt-2">
                  {selectedSticker.name}
                </h3>
                
                <div className="text-xs font-mono text-gray-400 mt-1">
                  ID: {selectedSticker.id} | Número: {selectedSticker.number}
                </div>
              </div>

              <div className="space-y-2 border-t border-b border-white/5 py-3">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500 font-medium">Equipe:</span>
                  <span className="text-white font-semibold">{selectedSticker.team}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500 font-medium">Quantidade na Coleção:</span>
                  <span className="font-mono text-amber-300 font-bold">
                    {userProfile?.collectedCounts?.[selectedSticker.id] || 1} { (userProfile?.collectedCounts?.[selectedSticker.id] || 1) === 1 ? '(1 colada)' : `(1 no álbum + ${(userProfile?.collectedCounts?.[selectedSticker.id] || 1) - 1} repetida)` }
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500 font-medium">Cor de Alinhamento:</span>
                  <span className="font-mono text-white flex items-center gap-1.5 font-bold">
                    <span className="w-2.5 h-2.5 rounded-full inline-block border border-white/10" style={{ backgroundColor: selectedSticker.color }} />
                    {selectedSticker.color}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs text-gray-500 font-semibold uppercase flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-brand-blue-glow" />
                  Biografia do Atleta
                </h4>
                <p className="text-xs text-gray-300 leading-relaxed italic">
                  "{selectedSticker.description || 'Nenhuma descrição detalhada disponível para este jogador.'}"
                </p>
              </div>

              <button
                onClick={() => setSelectedSticker(null)}
                className="w-full py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-semibold uppercase tracking-wider border border-white/10 transition-all"
              >
                Voltar ao Álbum
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
