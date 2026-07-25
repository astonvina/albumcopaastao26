import React from 'react';
import { PublicPlayerProfile } from '../types';
import { 
  X, 
  Trophy, 
  Crown, 
  Star, 
  Flame, 
  Gem, 
  Target, 
  RefreshCw, 
  Calendar, 
  Package, 
  Layers, 
  Shield, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';

interface PublicProfileModalProps {
  profile: PublicPlayerProfile | null;
  isLoading: boolean;
  onClose: () => void;
}

export default function PublicProfileModal({
  profile,
  isLoading,
  onClose
}: PublicProfileModalProps) {
  if (!profile && !isLoading) return null;

  // Render badge icon based on ID or icon string
  const renderBadgeIcon = (iconName: string, unlocked: boolean) => {
    const iconClass = `w-5 h-5 ${unlocked ? 'text-brand-gold-glow animate-pulse' : 'text-gray-500'}`;
    switch (iconName) {
      case 'Target':
        return <Target className={iconClass} />;
      case 'Star':
        return <Star className={iconClass} />;
      case 'Flame':
        return <Flame className={iconClass} />;
      case 'Gem':
        return <Gem className={iconClass} />;
      case 'Trophy':
        return <Trophy className={iconClass} />;
      case 'RefreshCw':
        return <RefreshCw className={iconClass} />;
      case 'Crown':
        return <Crown className={iconClass} />;
      default:
        return <Sparkles className={iconClass} />;
    }
  };

  const getTeamColor = (teamName: string) => {
    switch (teamName) {
      case 'Time Branco':
        return 'bg-white/10 text-white border-white/20';
      case 'Time Preto':
        return 'bg-zinc-800 text-zinc-300 border-zinc-700';
      case 'Time Azul':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Time Vermelho':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'Legends':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default:
        return 'bg-brand-blue/10 text-brand-blue-glow border-brand-blue/20';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-2xl bg-brand-surface border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="relative p-6 bg-gradient-to-r from-brand-dark via-brand-surface to-brand-dark border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-gold/10 border border-brand-gold/30 rounded-xl text-brand-gold-glow">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-display text-lg text-white uppercase tracking-wider flex items-center gap-2">
                Perfil Público do Colecionador
              </h2>
              <p className="text-xs text-gray-400 font-mono">
                Estatísticas gerais e conquistas desbloqueadas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 overflow-y-auto space-y-6">
          {isLoading || !profile ? (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin text-brand-blue-glow mx-auto" />
              <p className="text-xs font-mono text-gray-400 uppercase">Carregando Perfil...</p>
            </div>
          ) : (
            <>
              {/* PLAYER HERO HEADER */}
              <div className="flex flex-col sm:flex-row items-center gap-5 p-5 bg-white/5 border border-white/10 rounded-xl relative overflow-hidden">
                {profile.isFirstChampion && (
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500/20 via-amber-500/10 to-transparent border-l border-b border-amber-500/30 px-3 py-1 rounded-bl-xl flex items-center gap-1.5 text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                    <Crown className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                    Primeiro Campeão do Álbum
                  </div>
                )}

                {/* Photo */}
                <div className="relative w-20 h-20 rounded-full border-2 border-brand-gold/40 overflow-hidden bg-brand-dark shadow-xl flex-shrink-0">
                  <img
                    src={profile.photoUrl || '/escudo3atual2.png'}
                    alt={profile.nickname}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  {profile.completedAlbum && (
                    <div className="absolute bottom-0 right-0 p-1 bg-amber-500 text-black rounded-full shadow-lg" title="Álbum Completo">
                      <Trophy className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                {/* Player details */}
                <div className="flex-1 text-center sm:text-left space-y-1.5">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h3 className="font-display text-xl text-white uppercase tracking-wide">
                      {profile.nickname}
                    </h3>
                    <span className={`px-2.5 py-0.5 text-[10px] font-mono font-semibold rounded-full border ${getTeamColor(profile.team)}`}>
                      {profile.team}
                    </span>
                    {profile.completedAlbum && (
                      <span className="px-2.5 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full flex items-center gap-1">
                        <Trophy className="w-3 h-3 text-amber-400" />
                        Álbum Completo
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-400 font-sans">
                    {profile.fullName}
                  </p>

                  <div className="flex items-center justify-center sm:justify-start gap-3 text-[11px] font-mono text-gray-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-brand-blue-glow" />
                      Desde {new Date(profile.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>

              {/* COLLECTION PROGRESS BAR */}
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-gray-300 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-brand-blue-glow" />
                    Progresso da Coleção
                  </span>
                  <span className="text-brand-blue-glow font-bold text-sm">
                    {profile.uniqueStickers} / {profile.totalStickersAvailable} ({profile.progress}%)
                  </span>
                </div>
                <div className="w-full bg-brand-dark/80 h-3.5 rounded-full overflow-hidden border border-white/10 p-0.5">
                  <div 
                    className={`h-full rounded-full transition-all duration-700 ${
                      profile.completedAlbum 
                        ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 shadow-gold' 
                        : 'bg-gradient-to-r from-brand-blue to-brand-blue-glow'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, profile.progress))}%` }}
                  />
                </div>
              </div>

              {/* STATS GRID */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl text-center space-y-1">
                  <Star className="w-5 h-5 text-amber-400 mx-auto" />
                  <div className="font-display text-lg text-white font-bold">{profile.legendsCount}</div>
                  <div className="text-[10px] font-mono uppercase text-gray-400">Legends</div>
                </div>

                <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl text-center space-y-1">
                  <Package className="w-5 h-5 text-brand-blue-glow mx-auto" />
                  <div className="font-display text-lg text-white font-bold">{profile.packsOpened}</div>
                  <div className="text-[10px] font-mono uppercase text-gray-400">Pacotes Abertos</div>
                </div>

                <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl text-center space-y-1">
                  <RefreshCw className="w-5 h-5 text-emerald-400 mx-auto" />
                  <div className="font-display text-lg text-white font-bold">{profile.repeatedStickers}</div>
                  <div className="text-[10px] font-mono uppercase text-gray-400">Repetidas</div>
                </div>

                <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl text-center space-y-1">
                  <Trophy className="w-5 h-5 text-amber-300 mx-auto" />
                  <div className="font-display text-lg text-white font-bold">{profile.progress}%</div>
                  <div className="text-[10px] font-mono uppercase text-gray-400">Completado</div>
                </div>
              </div>

              {/* BADGES & CONQUISTAS */}
              <div className="space-y-3 pt-2">
                <h4 className="font-display text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-brand-gold-glow" />
                  Conquistas Desbloqueadas ({profile.badges.filter(b => b.unlocked).length} / {profile.badges.length})
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {profile.badges.map(badge => (
                    <div
                      key={badge.id}
                      className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                        badge.unlocked
                          ? 'bg-brand-gold/10 border-brand-gold/30 text-white'
                          : 'bg-white/5 border-white/5 text-gray-500 opacity-60'
                      }`}
                    >
                      <div className={`p-2 rounded-lg flex-shrink-0 ${badge.unlocked ? 'bg-brand-gold/20 border border-brand-gold/40' : 'bg-white/5'}`}>
                        {renderBadgeIcon(badge.icon, badge.unlocked)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-xs font-bold uppercase tracking-wide truncate ${badge.unlocked ? 'text-brand-gold-glow' : 'text-gray-400'}`}>
                            {badge.name}
                          </span>
                          {badge.unlocked && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400 leading-tight truncate">
                          {badge.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 bg-brand-dark/90 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-white/10 hover:bg-white/15 text-white font-semibold text-xs rounded-lg uppercase tracking-wider transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
