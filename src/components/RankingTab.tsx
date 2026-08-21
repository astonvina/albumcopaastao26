import React, { useState, useEffect } from 'react';
import { 
  RankingPlayer, 
  RankingStats, 
  RankingEvent, 
  FirstChampionInfo
} from '../types';
import { 
  getRankingFromSupabase
} from '../lib/supabaseData';
import { 
  Trophy, 
  Crown, 
  Medal, 
  Flame, 
  Star, 
  Gem, 
  RefreshCw, 
  Sparkles, 
  Search, 
  Package, 
  Layers, 
  Users, 
  Award, 
  Clock, 
  ChevronRight,
  TrendingUp,
  CheckCircle2
} from 'lucide-react';

interface RankingTabProps {
  onNavigateToAlbum?: () => void;
}

export default function RankingTab({ onNavigateToAlbum }: RankingTabProps) {
  const [leaderboard, setLeaderboard] = useState<RankingPlayer[]>([]);
  const [stats, setStats] = useState<RankingStats | null>(null);
  const [recentEvents, setRecentEvents] = useState<RankingEvent[]>([]);
  const [firstChampion, setFirstChampion] = useState<FirstChampionInfo | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch ranking data
  const fetchRanking = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const { ranking, stats: rankingStats, firstChampion: championInfo } = await getRankingFromSupabase(isManualRefresh);
      setLeaderboard(ranking || []);
      setStats(rankingStats || null);
      
      if (championInfo) {
        setFirstChampion(championInfo);
      } else {
        const champion = ranking.find(p => p.completedAlbum);
        if (champion) {
          setFirstChampion({
            id: champion.id,
            playerId: champion.id,
            nickname: champion.nickname,
            fullName: champion.fullName,
            team: champion.team,
            photoUrl: champion.photoUrl,
            completedAt: champion.completedAt || champion.createdAt || new Date().toISOString(),
            packsOpened: champion.packsOpened || 0
          });
        } else {
          setFirstChampion(null);
        }
      }
      setError(null);
    } catch (err: any) {
      setError('Falha ao carregar ranking do Supabase: ' + err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRanking();

    const handleDataUpdate = () => {
      fetchRanking(false);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('copa_astao_data_updated', handleDataUpdate);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('copa_astao_data_updated', handleDataUpdate);
      }
    };
  }, []);

  // Filter players by search term
  const filteredLeaderboard = leaderboard.filter(p => 
    p.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.team.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const top1 = leaderboard[0];
  const top2 = leaderboard[1];
  const top3 = leaderboard[2];

  const getTeamBadgeStyle = (teamName: string) => {
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

  const formatRelativeTime = (dateStr?: string | null) => {
    if (!dateStr) return 'Sem atividade';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `há ${diffMins} min`;
    if (diffHours < 24) return `há ${diffHours} h`;
    return `há ${diffDays} d`;
  };

  return (
    <div className="space-y-8 animate-fade-in" id="ranking-container">
      
      {/* HEADER TITLE BANNER */}
      <div className="relative overflow-hidden bg-gradient-to-br from-brand-surface via-brand-dark to-brand-surface p-6 sm:p-8 rounded-2xl border border-white/10 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-gold/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-gold/15 border border-brand-gold/30 rounded-full">
              <Trophy className="w-4 h-4 text-brand-gold-glow animate-pulse" />
              <span className="text-xs font-mono font-bold text-brand-gold-glow uppercase tracking-wider">
                Placar Oficial de Colecionadores
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-4xl text-white uppercase tracking-wider flex items-center gap-3">
              🏆 Ranking Global
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 max-w-xl leading-relaxed">
              Acompanhe a evolução de todos os colecionadores em tempo real. Veja quem está mais perto de completar o álbum de figurinhas da Copa Astão 2026!
            </p>
          </div>

          <button
            onClick={() => fetchRanking(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 active:bg-white/15 text-white font-semibold text-xs rounded-xl border border-white/10 transition-all shadow-md self-start md:self-auto"
          >
            <RefreshCw className={`w-4 h-4 text-brand-blue-glow ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Atualizando...' : 'Atualizar Placar'}</span>
          </button>
        </div>
      </div>

      {/* TOP GENERAL STATS (ESTATÍSTICAS GERAIS) */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-4 bg-brand-surface border border-white/10 rounded-xl space-y-1 text-center shadow-lg">
            <Users className="w-5 h-5 text-brand-blue-glow mx-auto" />
            <div className="font-display text-xl text-white font-bold">{stats.totalPlayers}</div>
            <div className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Total Jogadores</div>
          </div>

          <div className="p-4 bg-brand-surface border border-white/10 rounded-xl space-y-1 text-center shadow-lg">
            <Trophy className="w-5 h-5 text-amber-400 mx-auto" />
            <div className="font-display text-xl text-white font-bold">{stats.completedAlbumsCount}</div>
            <div className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Álbuns Completos</div>
          </div>

          <div className="p-4 bg-brand-surface border border-white/10 rounded-xl space-y-1 text-center shadow-lg">
            <Layers className="w-5 h-5 text-emerald-400 mx-auto" />
            <div className="font-display text-xl text-white font-bold">{stats.totalCardsDistributed}</div>
            <div className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Figurinhas Entregues</div>
          </div>

          <div className="p-4 bg-brand-surface border border-white/10 rounded-xl space-y-1 text-center shadow-lg">
            <Star className="w-5 h-5 text-brand-gold-glow mx-auto" />
            <div className="font-display text-xl text-white font-bold">{stats.totalLegendsDistributed}</div>
            <div className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Legends Dadas</div>
          </div>

          <div className="p-4 bg-brand-surface border border-white/10 rounded-xl space-y-1 text-center shadow-lg">
            <Package className="w-5 h-5 text-purple-400 mx-auto" />
            <div className="font-display text-xl text-white font-bold">{stats.totalPacksOpened}</div>
            <div className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Pacotes Abertos</div>
          </div>

          <div className="p-4 bg-brand-surface border border-white/10 rounded-xl space-y-1 text-center shadow-lg">
            <RefreshCw className="w-5 h-5 text-rose-400 mx-auto" />
            <div className="font-display text-xl text-white font-bold">{stats.totalRepeatedCards}</div>
            <div className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Repetidas Geradas</div>
          </div>
        </div>
      )}

      {/* PRIMEIRO CAMPEÃO DO ÁLBUM PERMANENT BADGE */}
      {firstChampion && (
        <div className="p-6 bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-amber-950/40 border border-amber-500/40 rounded-2xl relative overflow-hidden shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="relative w-16 h-16 rounded-full border-2 border-amber-400 overflow-hidden bg-brand-dark shadow-gold flex-shrink-0">
              <img 
                src={firstChampion.photoUrl || '/escudo3atual2.png'} 
                alt={firstChampion.nickname} 
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-0 right-0 p-1 bg-amber-400 text-black rounded-full shadow">
                <Crown className="w-3 h-3" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                  <Crown className="w-3 h-3 text-amber-400 animate-bounce" />
                  Título Permanente
                </span>
              </div>
              <h3 className="font-display text-xl text-amber-200 uppercase tracking-wider mt-1">
                👑 {firstChampion.nickname} — Primeiro Campeão do Álbum
              </h3>
              <p className="text-xs text-amber-200/70 font-mono">
                O primeiro jogador a completar 100% do álbum na história da Copa Astão 2026.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-center sm:text-right font-mono text-xs text-amber-200 relative z-10">
            <div>
              <span className="block text-[10px] uppercase text-amber-300/60">Data da Vitória</span>
              <span className="font-bold text-amber-300">
                {firstChampion.completedAt && !isNaN(new Date(firstChampion.completedAt).getTime())
                  ? new Date(firstChampion.completedAt).toLocaleString('pt-BR')
                  : '---'}
              </span>
            </div>
            <div className="h-8 w-px bg-amber-500/30" />
            <div>
              <span className="block text-[10px] uppercase text-amber-300/60">Pacotes Utilizados</span>
              <span className="font-bold text-amber-300">{(firstChampion.packsOpened ?? 0)} pacotes</span>
            </div>
          </div>
        </div>
      )}

      {/* TOP 3 PODIUM DISPLAY */}
      {leaderboard.length >= 3 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-gold-glow" />
            <h2 className="font-display text-lg text-white uppercase tracking-wider">
              Pódio dos Lideres (Top 3)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            
            {/* 2nd PLACE - SILVER */}
            {top2 && (
              <div 
                className="order-2 md:order-1 bg-gradient-to-b from-slate-800/80 to-brand-surface border border-slate-400/30 rounded-2xl p-5 text-center shadow-xl relative cursor-default"
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-300 text-slate-950 text-xs font-mono font-bold px-3 py-0.5 rounded-full shadow-lg flex items-center gap-1">
                  <Medal className="w-3.5 h-3.5" /> 2º Lugar - Prata
                </div>

                <div className="w-20 h-20 mx-auto rounded-full border-2 border-slate-300 overflow-hidden bg-brand-dark my-3 shadow-lg">
                  <img src={top2.photoUrl || '/escudo3atual2.png'} alt={top2.nickname} className="w-full h-full object-cover" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
                </div>

                <h3 className="font-display text-lg text-white uppercase tracking-wider flex items-center justify-center gap-1.5">
                  🥈 {top2.nickname}
                </h3>
                <span className={`inline-block px-2 py-0.5 text-[10px] font-mono rounded border my-1 ${getTeamBadgeStyle(top2.team)}`}>
                  {top2.team}
                </span>

                <div className="space-y-2 mt-3 pt-3 border-t border-white/10 font-mono text-xs">
                  <div className="flex justify-between text-gray-300">
                    <span>Figurinhas:</span>
                    <span className="font-bold text-white">{top2.uniqueStickers} / {top2.totalStickersAvailable}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Legends:</span>
                    <span className="font-bold text-amber-400">{top2.legendsCount} ⭐</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Pacotes Usados:</span>
                    <span className="font-bold text-slate-300">{top2.packsOpened}</span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-brand-dark h-2 rounded-full overflow-hidden border border-white/10 mt-2">
                    <div className="bg-slate-300 h-full rounded-full" style={{ width: `${top2.progress}%` }} />
                  </div>
                  <div className="text-[10px] text-slate-300 font-bold">{top2.progress}% Completado</div>
                </div>
              </div>
            )}

            {/* 1st PLACE - GOLD (CENTER / HIGHER) */}
            {top1 && (
              <div 
                className="order-1 md:order-2 bg-gradient-to-b from-amber-950/60 via-brand-surface to-brand-surface border-2 border-amber-400/60 rounded-2xl p-6 text-center shadow-gold relative cursor-default md:-translate-y-3"
              >
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-yellow-300 text-black text-xs font-mono font-bold px-4 py-1 rounded-full shadow-gold flex items-center gap-1.5 animate-bounce">
                  <Crown className="w-4 h-4 text-black" /> 1º Lugar - Ouro
                </div>

                <div className="w-24 h-24 mx-auto rounded-full border-4 border-amber-400 overflow-hidden bg-brand-dark my-3 shadow-gold">
                  <img src={top1.photoUrl || '/escudo3atual2.png'} alt={top1.nickname} className="w-full h-full object-cover" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
                </div>

                <h3 className="font-display text-xl text-amber-300 uppercase tracking-wider flex items-center justify-center gap-1.5">
                  🥇 {top1.nickname}
                </h3>
                <span className={`inline-block px-2.5 py-0.5 text-[10px] font-mono font-bold rounded border my-1 ${getTeamBadgeStyle(top1.team)}`}>
                  {top1.team}
                </span>

                <div className="space-y-2.5 mt-4 pt-3 border-t border-amber-500/20 font-mono text-xs">
                  <div className="flex justify-between text-gray-200">
                    <span>Figurinhas:</span>
                    <span className="font-bold text-amber-300">{top1.uniqueStickers} / {top1.totalStickersAvailable}</span>
                  </div>
                  <div className="flex justify-between text-gray-200">
                    <span>Legends:</span>
                    <span className="font-bold text-amber-400">{top1.legendsCount} ⭐</span>
                  </div>
                  <div className="flex justify-between text-gray-200">
                    <span>Pacotes Usados:</span>
                    <span className="font-bold text-amber-300">{top1.packsOpened}</span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-brand-dark h-2.5 rounded-full overflow-hidden border border-amber-500/30 mt-2">
                    <div className="bg-gradient-to-r from-amber-500 to-yellow-300 h-full rounded-full shadow-gold" style={{ width: `${top1.progress}%` }} />
                  </div>
                  <div className="text-xs text-amber-300 font-bold">{top1.progress}% Completado</div>
                </div>
              </div>
            )}

            {/* 3rd PLACE - BRONZE */}
            {top3 && (
              <div 
                className="order-3 bg-gradient-to-b from-amber-950/30 to-brand-surface border border-amber-700/40 rounded-2xl p-5 text-center shadow-xl relative cursor-default"
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-700 text-amber-100 text-xs font-mono font-bold px-3 py-0.5 rounded-full shadow-lg flex items-center gap-1">
                  <Medal className="w-3.5 h-3.5" /> 3º Lugar - Bronze
                </div>

                <div className="w-20 h-20 mx-auto rounded-full border-2 border-amber-600 overflow-hidden bg-brand-dark my-3 shadow-lg">
                  <img src={top3.photoUrl || '/escudo3atual2.png'} alt={top3.nickname} className="w-full h-full object-cover" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
                </div>

                <h3 className="font-display text-lg text-white uppercase tracking-wider flex items-center justify-center gap-1.5">
                  🥉 {top3.nickname}
                </h3>
                <span className={`inline-block px-2 py-0.5 text-[10px] font-mono rounded border my-1 ${getTeamBadgeStyle(top3.team)}`}>
                  {top3.team}
                </span>

                <div className="space-y-2 mt-3 pt-3 border-t border-white/10 font-mono text-xs">
                  <div className="flex justify-between text-gray-300">
                    <span>Figurinhas:</span>
                    <span className="font-bold text-white">{top3.uniqueStickers} / {top3.totalStickersAvailable}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Legends:</span>
                    <span className="font-bold text-amber-400">{top3.legendsCount} ⭐</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Pacotes Usados:</span>
                    <span className="font-bold text-amber-500">{top3.packsOpened}</span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-brand-dark h-2 rounded-full overflow-hidden border border-white/10 mt-2">
                    <div className="bg-amber-600 h-full rounded-full" style={{ width: `${top3.progress}%` }} />
                  </div>
                  <div className="text-[10px] text-amber-400 font-bold">{top3.progress}% Completado</div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* RECENT EVENTS TICKER / FEED (🔥 Últimas Conquistas) */}
      {recentEvents.length > 0 && (
        <div className="p-5 bg-brand-surface border border-white/10 rounded-2xl space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm text-white uppercase tracking-wider flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
              🔥 Últimas Conquistas ao Vivo
            </h2>
            <span className="text-[10px] font-mono text-gray-400 uppercase">
              Atualização Automática
            </span>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10">
            {recentEvents.map(evt => (
              <div 
                key={evt.id} 
                className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 min-w-[260px] max-w-[320px] flex-shrink-0"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 bg-brand-dark flex-shrink-0">
                  <img src={evt.playerPhotoUrl || '/escudo3atual2.png'} alt={evt.playerNickname} className="w-full h-full object-cover" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
                </div>
                <div className="flex-1 min-w-0 space-y-0.5">
                  <p className="text-xs text-white font-medium truncate">
                    {evt.message}
                  </p>
                  <span className="text-[9px] font-mono text-gray-400 block">
                    {formatRelativeTime(evt.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CLASSIFICATION TABLE & SEARCH */}
      <div className="bg-brand-surface border border-white/10 rounded-2xl p-6 space-y-4 shadow-2xl">
        
        {/* BAR OF CONTROLS: SEARCH & CRITERIA INFO */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <h2 className="font-display text-lg text-white uppercase tracking-wider flex items-center gap-2">
              Tabela de Classificação
            </h2>
            <p className="text-xs text-gray-400 font-mono">
              Acompanhe o desempenho e a evolução de todos os colecionadores
            </p>
          </div>

          {/* Search filter */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar jogador..."
              className="w-full bg-brand-dark border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-blue-glow transition-all"
            />
          </div>
        </div>

        {/* TIE-BREAKER RULE NOTE */}
        <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-[11px] font-mono text-gray-400 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-brand-blue-glow flex-shrink-0" />
          <span>
            <strong>Critérios de Desempate:</strong> 1º Figurinhas Obtidas → 2º nº de Legends → 3º Menor nº de Pacotes Abertos → 4º Data/Hora de Conclusão → 5º Ordem Alfabética.
          </span>
        </div>

        {/* DESKTOP TABLE VIEW (md:block hidden) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-[11px] font-mono uppercase text-gray-400 bg-white/5">
                <th className="py-3 px-4 text-center">Pos</th>
                <th className="py-3 px-4">Jogador</th>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Progresso / Figurinhas</th>
                <th className="py-3 px-4 text-center">Legends</th>
                <th className="py-3 px-4 text-center">Pacotes</th>
                <th className="py-3 px-4 text-center">Última Figurinha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs font-mono">
              {filteredLeaderboard.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    Nenhum jogador encontrado para a busca "{searchTerm}".
                  </td>
                </tr>
              ) : (
                filteredLeaderboard.map((p) => (
                  <tr 
                    key={p.id}
                    className="hover:bg-white/[0.02] cursor-default"
                  >
                    {/* Rank */}
                    <td className="py-3.5 px-4 text-center">
                      {p.rank === 1 ? (
                        <span className="text-lg">🥇</span>
                      ) : p.rank === 2 ? (
                        <span className="text-lg">🥈</span>
                      ) : p.rank === 3 ? (
                        <span className="text-lg">🥉</span>
                      ) : (
                        <span className="font-bold text-gray-400">#{p.rank}</span>
                      )}
                    </td>

                    {/* Player Info & Badges */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full overflow-hidden border border-white/20 bg-brand-dark flex-shrink-0">
                          <img src={p.photoUrl || '/escudo3atual2.png'} alt={p.nickname} className="w-full h-full object-cover" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white">
                              {p.nickname}
                            </span>
                            {p.completedAlbum && (
                              <span title="Álbum Completo">
                                <Trophy className="w-3.5 h-3.5 text-amber-400 inline-block" />
                              </span>
                            )}
                            {p.isFirstChampion && (
                              <span title="Primeiro Campeão do Álbum">
                                <Crown className="w-3.5 h-3.5 text-amber-300 inline-block animate-pulse" />
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-400 font-sans block truncate max-w-[140px]">
                            {p.fullName}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Team */}
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 text-[10px] rounded border ${getTeamBadgeStyle(p.team)}`}>
                        {p.team}
                      </span>
                    </td>

                    {/* Progress Bar & Figurinhas */}
                    <td className="py-3.5 px-4 min-w-[180px]">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span className="font-bold text-white">{p.uniqueStickers} / {p.totalStickersAvailable}</span>
                          <span className="text-brand-blue-glow font-bold">{p.progress}%</span>
                        </div>
                        <div className="w-full bg-brand-dark h-2 rounded-full overflow-hidden border border-white/10">
                          <div 
                            className={`h-full rounded-full ${p.completedAlbum ? 'bg-amber-400' : 'bg-brand-blue'}`}
                            style={{ width: `${p.progress}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Legends */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-bold text-amber-400 flex items-center justify-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        {p.legendsCount}
                      </span>
                    </td>

                    {/* Pacotes Utilizados */}
                    <td className="py-3.5 px-4 text-center font-bold text-gray-300">
                      {p.packsOpened}
                    </td>

                    {/* Última Figurinha */}
                    <td className="py-3.5 px-4 text-center text-gray-400 text-[10px]">
                      {formatRelativeTime(p.lastStickerAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARDS VIEW (md:hidden block) */}
        <div className="md:hidden space-y-3">
          {filteredLeaderboard.length === 0 ? (
            <div className="py-8 text-center text-gray-400 font-mono text-xs">
              Nenhum jogador encontrado para "{searchTerm}".
            </div>
          ) : (
            filteredLeaderboard.map((p) => (
              <div
                key={p.id}
                className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3 cursor-default relative"
              >
                {/* Header info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-display font-bold text-sm text-brand-gold-glow">
                      {p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : p.rank === 3 ? '🥉' : `#${p.rank}`}
                    </span>
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20 bg-brand-dark flex-shrink-0">
                      <img src={p.photoUrl || '/escudo3atual2.png'} alt={p.nickname} className="w-full h-full object-cover" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-white text-sm">{p.nickname}</h4>
                        {p.completedAlbum && <Trophy className="w-3.5 h-3.5 text-amber-400" />}
                        {p.isFirstChampion && <Crown className="w-3.5 h-3.5 text-amber-300" />}
                      </div>
                      <span className={`inline-block px-2 py-0.5 text-[9px] font-mono rounded border ${getTeamBadgeStyle(p.team)}`}>
                        {p.team}
                      </span>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-bold text-brand-blue-glow">
                    {p.progress}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-brand-dark h-2 rounded-full overflow-hidden border border-white/10">
                  <div 
                    className={`h-full rounded-full ${p.completedAlbum ? 'bg-amber-400' : 'bg-brand-blue'}`}
                    style={{ width: `${p.progress}%` }}
                  />
                </div>

                {/* Mobile Stats grid */}
                <div className="grid grid-cols-3 gap-2 text-center font-mono text-[11px] bg-black/20 p-2 rounded-lg">
                  <div>
                    <span className="block text-[9px] text-gray-400 uppercase">Figurinhas</span>
                    <span className="font-bold text-white">{p.uniqueStickers} / {p.totalStickersAvailable}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-gray-400 uppercase">Legends</span>
                    <span className="font-bold text-amber-400">{p.legendsCount} ⭐</span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-gray-400 uppercase">Pacotes</span>
                    <span className="font-bold text-gray-300">{p.packsOpened}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>

    </div>
  );
}
