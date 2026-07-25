import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Database, 
  Settings, 
  Lock, 
  LogOut, 
  RefreshCw, 
  AlertTriangle,
  Upload,
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  X,
  Users,
  Package,
  TrendingUp,
  Award,
  Sparkles,
  HelpCircle,
  Image as ImageIcon,
  Shield,
  Layers,
  Trophy,
  Gift,
  Palette,
  FileText,
  Copy,
  Archive,
  Eye,
  Calendar,
  Check,
  ChevronRight,
  Boxes,
  Zap,
  UserCheck,
  Clock
} from 'lucide-react';
import { 
  Sticker, 
  DashboardStats, 
  Player, 
  TeamSetting, 
  Championship, 
  Prize, 
  SystemLog, 
  RankingPlayer 
} from '../types';
import PlayersAdminTab from './PlayersAdminTab';
import CountdownAdminTab from './CountdownAdminTab';
import RewardsBannerAdminTab from './RewardsBannerAdminTab';
import ImageUploader from './ImageUploader';
import { useSystemSettings } from '../context/SystemSettingsContext';
import { 
  getPlayersFromSupabase, 
  savePlayerToSupabase, 
  getStickersFromSupabase, 
  saveStickerToSupabase, 
  deleteStickerFromSupabase, 
  getPrizesFromSupabase, 
  savePrizeToSupabase, 
  deletePrizeFromSupabase, 
  getRankingFromSupabase 
} from '../lib/supabaseData';

interface AdminPanelProps {
  isAdminLoggedIn: boolean;
  stickers: Sticker[];
  onRefreshData: () => void;
  onLogout: () => void;
  onLogin: (pass: string) => Promise<boolean>;
}

type AdminSubTab = 
  | 'dashboard'
  | 'championships'
  | 'players'
  | 'stickers'
  | 'packs'
  | 'ranking'
  | 'prizes'
  | 'rewards_banner'
  | 'appearance'
  | 'countdown'
  | 'settings'
  | 'logs';

export default function AdminPanel({
  isAdminLoggedIn,
  stickers,
  onRefreshData,
  onLogout,
  onLogin
}: AdminPanelProps) {
  // Login states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // System Settings Context
  const { settings, updateSettings, refreshSettings } = useSystemSettings();

  // Panel states
  const [activeSubTab, setActiveSubTab] = useState<AdminSubTab>('dashboard');
  const [appearanceTab, setAppearanceTab] = useState<'logo' | 'teams' | 'backgrounds' | 'album'>('logo');

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Players list for pack management
  const [playersList, setPlayersList] = useState<Player[]>([]);
  const [selectedPlayerForPack, setSelectedPlayerForPack] = useState<string>('');
  const [packAmountToAdd, setPackAmountToAdd] = useState<number>(5);
  const [packType, setPackType] = useState<'purchased' | 'free'>('purchased');
  const [packReason, setPackReason] = useState<string>('Compra');
  const [addingPackCredits, setAddingPackCredits] = useState(false);
  const [packSuccessMsg, setPackSuccessMsg] = useState<string | null>(null);
  const [packErrorMsg, setPackErrorMsg] = useState<string | null>(null);

  // Probability & System settings edit states
  const [probNormal, setProbNormal] = useState(85);
  const [probLegend, setProbLegend] = useState(15);
  const [initialFreePacks, setInitialFreePacks] = useState<number>(1);
  const [probSaveStatus, setProbSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [probErrorMsg, setProbErrorMsg] = useState('');

  // Sticker CRUD states
  const [isEditingSticker, setIsEditingSticker] = useState<Sticker | null>(null);
  const [isCreatingSticker, setIsCreatingSticker] = useState(false);
  const [isBulkCreatingStickers, setIsBulkCreatingStickers] = useState(false);
  const [bulkTeam, setBulkTeam] = useState<'Time Branco' | 'Time Preto' | 'Time Azul' | 'Time Vermelho' | 'Legends'>('Time Vermelho');
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState<string | null>(null);

  const [stickerFormData, setStickerFormData] = useState<Omit<Sticker, 'id'> & { id?: string }>({
    id: '',
    number: '',
    name: '',
    team: 'Time Branco',
    color: '#FFFFFF',
    rarity: 'Normal',
    image: '',
    description: ''
  });
  const [stickerSaveError, setStickerSaveError] = useState<string | null>(null);

  // Championships states
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [isChampionshipModalOpen, setIsChampionshipModalOpen] = useState(false);
  const [editingChampionship, setEditingChampionship] = useState<Championship | null>(null);
  const [champFormData, setChampFormData] = useState<Partial<Championship>>({
    name: '',
    year: 2026,
    logoUrl: '/escudo3atual2.png',
    description: '',
    startDate: '',
    endDate: '',
    status: 'active',
    normalProbability: 85,
    legendProbability: 15
  });

  // Prizes states
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [isPrizeModalOpen, setIsPrizeModalOpen] = useState(false);
  const [editingPrize, setEditingPrize] = useState<Prize | null>(null);
  const [prizeFormData, setPrizeFormData] = useState<Omit<Prize, 'id' | 'createdAt'>>({
    name: '',
    description: '',
    imageUrl: '',
    quantity: 1,
    deliveryCriteria: ''
  });

  // System Logs
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);

  // Reset modal states
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  useEffect(() => {
    if (isAdminLoggedIn) {
      fetchStatsAndData();
      fetchChampionships();
      fetchPrizes();
      fetchLogs();
    }
  }, [isAdminLoggedIn]);

  const fetchStatsAndData = async () => {
    setLoadingStats(true);
    try {
      const [rankingData, playersData] = await Promise.all([
        getRankingFromSupabase(),
        getPlayersFromSupabase()
      ]);

      const totalStickers = stickers.length || 30;
      setStats({
        totalPlayers: rankingData.stats.totalPlayers,
        totalStickers: totalStickers,
        completedAlbums: rankingData.stats.completedAlbumsCount,
        totalPacksOpened: rankingData.stats.totalPacksOpened,
        totalCardsDistributed: rankingData.stats.totalCardsDistributed,
        totalLegendsDistributed: rankingData.stats.totalLegendsDistributed,
        totalRepeatedCards: rankingData.stats.totalRepeatedCards
      });

      setPlayersList(playersData);
      if (settings.initialFreePacks !== undefined) {
        setInitialFreePacks(settings.initialFreePacks);
      }
    } catch (err) {
      console.error('Erro ao carregar métricas:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchChampionships = async () => {
    setChampionships([
      {
        id: 'copa-astao-2026',
        name: 'Copa Astão 2026',
        year: 2026,
        logoUrl: settings.logoUrl || '/escudo3atual2.png',
        description: 'Campeonato oficial da Copa Astão',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        status: 'active',
        normalProbability: probNormal,
        legendProbability: probLegend
      }
    ]);
  };

  const fetchPrizes = async () => {
    try {
      const data = await getPrizesFromSupabase();
      setPrizes(data);
    } catch (err) {
      console.error('Erro ao carregar premiações:', err);
    }
  };

  const fetchLogs = async () => {
    setSystemLogs([
      {
        id: 'log-1',
        timestamp: new Date().toISOString(),
        user: 'Sistema',
        action: 'Sistema inicializado em modo Client-Side',
        category: 'system'
      }
    ]);
  };

  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      const ok = await onLogin(password);
      if (!ok) {
        setLoginError('Senha de administrador incorreta.');
      }
    } catch (err: any) {
      setLoginError('Erro ao autenticar: ' + err.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Add Pack Credits
  const handleAddPackCredits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayerForPack) {
      setPackErrorMsg('Selecione um jogador.');
      return;
    }
    setAddingPackCredits(true);
    setPackSuccessMsg(null);
    setPackErrorMsg(null);

    try {
      const player = playersList.find(p => p.id === selectedPlayerForPack);
      if (!player) {
        setPackErrorMsg('Jogador não encontrado.');
        return;
      }

      const isPurchased = packType === 'purchased';
      const updatedPacks = isPurchased ? player.purchasedPacks + packAmountToAdd : player.purchasedPacks;
      const updatedFreePacks = !isPurchased ? player.freePacks + packAmountToAdd : player.freePacks;

      await savePlayerToSupabase({
        ...player,
        purchasedPacks: Math.max(0, updatedPacks),
        freePacks: Math.max(0, updatedFreePacks)
      });

      setPackSuccessMsg(`Adicionados +${packAmountToAdd} pacote(s) (${packType}) para o jogador.`);
      fetchStatsAndData();
      onRefreshData();
    } catch (err: any) {
      setPackErrorMsg('Erro ao adicionar pacotes: ' + err.message);
    } finally {
      setAddingPackCredits(false);
    }
  };

  // Probabilities & Settings Save
  const handleSaveProbabilities = async (e: React.FormEvent) => {
    e.preventDefault();
    setProbSaveStatus('saving');
    setProbErrorMsg('');

    try {
      await updateSettings({ initialFreePacks });
      setProbSaveStatus('success');
      setTimeout(() => setProbSaveStatus('idle'), 3000);
    } catch (err: any) {
      setProbSaveStatus('error');
      setProbErrorMsg(err.message);
    }
  };

  // Single Sticker Creation / Editing
  const handleOpenCreateSticker = () => {
    setStickerFormData({
      id: '',
      number: '',
      name: '',
      team: 'Time Branco',
      color: '#FFFFFF',
      rarity: 'Normal',
      image: '',
      description: ''
    });
    setIsEditingSticker(null);
    setStickerSaveError(null);
    setIsCreatingSticker(true);
  };

  const handleOpenEditSticker = (s: Sticker) => {
    setIsEditingSticker(s);
    setStickerFormData({
      id: s.id,
      number: s.number,
      name: s.name,
      team: s.team,
      color: s.color,
      rarity: s.rarity,
      image: s.image,
      description: s.description || ''
    });
    setStickerSaveError(null);
    setIsCreatingSticker(true);
  };

  const handleSaveSticker = async (e: React.FormEvent) => {
    e.preventDefault();
    setStickerSaveError(null);

    if (!stickerFormData.name.trim() || !stickerFormData.number.trim()) {
      setStickerSaveError('Nome e número da figurinha são obrigatórios.');
      return;
    }

    try {
      await saveStickerToSupabase({
        id: isEditingSticker?.id,
        number: stickerFormData.number,
        name: stickerFormData.name,
        team: stickerFormData.team,
        color: stickerFormData.color,
        rarity: stickerFormData.rarity,
        image: stickerFormData.image,
        description: stickerFormData.description
      });

      setIsCreatingSticker(false);
      setIsEditingSticker(null);
      onRefreshData();
      fetchStatsAndData();
    } catch (err: any) {
      setStickerSaveError('Erro ao salvar figurinha: ' + err.message);
    }
  };

  const handleDeleteSticker = async (id: string, name: string) => {
    if (!confirm(`Deseja realmente excluir a figurinha "${name}"?`)) return;
    try {
      await deleteStickerFromSupabase(id);
      onRefreshData();
      fetchStatsAndData();
    } catch (err: any) {
      alert('Erro ao excluir figurinha: ' + err.message);
    }
  };

  // Bulk Sticker Creation
  const handleBulkFilesSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setBulkUploading(true);
    setBulkSuccessMsg(null);

    try {
      const teamPrefix = bulkTeam === 'Time Vermelho' ? 'VER' :
                         bulkTeam === 'Time Azul' ? 'AZU' :
                         bulkTeam === 'Time Branco' ? 'BRA' :
                         bulkTeam === 'Time Preto' ? 'PRE' : 'LEG';

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const numStr = `${teamPrefix}-${String(stickers.length + i + 1).padStart(2, '0')}`;
        const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");

        const reader = new FileReader();
        const base64Url = await new Promise<string>((resolve) => {
          reader.onload = (ev) => resolve(ev.target?.result as string || '/copa26.png');
          reader.readAsDataURL(file);
        });

        await saveStickerToSupabase({
          number: numStr,
          name: cleanName,
          team: bulkTeam,
          color: bulkTeam === 'Time Vermelho' ? '#EF4444' : bulkTeam === 'Time Azul' ? '#4FA8F4' : bulkTeam === 'Time Branco' ? '#FFFFFF' : bulkTeam === 'Time Preto' ? '#1A1A1A' : '#E5B80B',
          rarity: bulkTeam === 'Legends' ? 'Legend' : 'Normal',
          image: base64Url,
          description: `Atleta do ${bulkTeam}`
        });
      }

      setBulkSuccessMsg(`${files.length} figurinhas cadastradas com sucesso para o ${bulkTeam}!`);
      onRefreshData();
      fetchStatsAndData();
      setTimeout(() => {
        setIsBulkCreatingStickers(false);
        setBulkSuccessMsg(null);
      }, 2000);
    } catch (err: any) {
      alert('Erro ao enviar figurinhas em lote: ' + err.message);
    } finally {
      setBulkUploading(false);
    }
  };

  // Championship Actions
  const handleSaveChampionship = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newChamp: Championship = {
        id: editingChampionship ? editingChampionship.id : `champ-${Date.now()}`,
        name: champFormData.name,
        year: champFormData.year,
        logoUrl: champFormData.logoUrl || '/escudo3atual2.png',
        description: champFormData.description,
        startDate: champFormData.startDate,
        endDate: champFormData.endDate,
        status: editingChampionship ? editingChampionship.status : 'active',
        normalProbability: probNormal,
        legendProbability: probLegend,
        createdAt: editingChampionship?.createdAt || new Date().toISOString()
      };

      setChampionships(prev => {
        const exists = prev.some(c => c.id === newChamp.id);
        if (exists) return prev.map(c => c.id === newChamp.id ? newChamp : c);
        return [...prev, newChamp];
      });

      setIsChampionshipModalOpen(false);
    } catch (err: any) {
      alert('Erro ao salvar campeonato: ' + err.message);
    }
  };

  const handleDuplicateChampionship = async (id: string) => {
    const champ = championships.find(c => c.id === id);
    if (!champ) return;
    const duplicated: Championship = {
      ...champ,
      id: `champ-${Date.now()}`,
      name: `${champ.name} (Cópia)`,
      status: 'upcoming'
    };
    setChampionships(prev => [...prev, duplicated]);
  };

  const handleArchiveChampionship = async (id: string) => {
    setChampionships(prev => prev.map(c => c.id === id ? { ...c, status: 'archived' } : c));
  };

  const handleActivateChampionship = async (id: string) => {
    setChampionships(prev => prev.map(c => ({
      ...c,
      status: c.id === id ? 'active' : 'archived'
    })));
    await updateSettings({ activeChampionshipId: id });
  };

  // Prize Actions
  const handleSavePrize = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await savePrizeToSupabase({
        id: editingPrize?.id,
        name: prizeFormData.name,
        description: prizeFormData.description,
        imageUrl: prizeFormData.imageUrl,
        quantity: prizeFormData.quantity,
        deliveryCriteria: prizeFormData.deliveryCriteria
      });
      setIsPrizeModalOpen(false);
      fetchPrizes();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePrize = async (id: string) => {
    if (!confirm('Excluir este prêmio permanentemente?')) return;
    try {
      await deletePrizeFromSupabase(id);
      fetchPrizes();
    } catch (err) {
      console.error(err);
    }
  };

  // Reset System
  const handleResetSystem = async () => {
    setIsResetting(true);
    setResetError(null);
    try {
      localStorage.removeItem('copa_astao_collected_ids');
      localStorage.removeItem('copa_astao_user_stickers_v2');
      onRefreshData();
      fetchStatsAndData();
      setResetSuccess(true);
      setTimeout(() => {
        setResetSuccess(false);
        setShowResetConfirm(false);
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setResetError(err.message || 'Erro ao resetar o sistema.');
    } finally {
      setIsResetting(false);
    }
  };

  // Unauthenticated Login Screen
  if (!isAdminLoggedIn) {
    return (
      <div className="max-w-md mx-auto py-12 px-4" id="admin-login-screen">
        <div className="bg-brand-surface border border-white/10 p-8 rounded-3xl shadow-2xl text-center space-y-6 relative overflow-hidden">
          <div className="holo-shine" />

          <div className="w-16 h-16 bg-brand-gold/10 border border-brand-gold/30 rounded-2xl flex items-center justify-center mx-auto text-brand-gold-glow shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <h2 className="font-display text-2xl uppercase tracking-wider text-white">
              CMS Painel Administrativo
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Gerenciador Geral da Copa Astão 2026
            </p>
          </div>

          <form onSubmit={handleAdminLoginSubmit} className="space-y-4 text-left">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Usuário</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full px-4 py-3 bg-brand-dark border border-white/10 rounded-xl text-white text-sm outline-none focus:border-brand-gold"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Senha de Administrador</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-brand-dark border border-white/10 rounded-xl text-white text-sm outline-none focus:border-brand-gold"
                required
              />
            </div>

            {loginError && (
              <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-4 bg-brand-gold hover:bg-yellow-500 text-black font-display text-base tracking-wider uppercase border-b-4 border-amber-700 shadow-lg shadow-amber-900/20 rounded-2xl transition-all font-bold"
            >
              {isLoggingIn ? 'Autenticando...' : 'Acessar CMS'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8" id="admin-panel-main">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-brand-surface/80 border border-white/10 p-6 rounded-3xl backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 border border-brand-gold/30 flex items-center justify-center text-brand-gold-glow">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase text-brand-gold-glow tracking-widest block">
              SISTEMA CMS GERENCIAL
            </span>
            <h1 className="font-display text-2xl uppercase tracking-wider text-white">
              Copa Astão 2026
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setShowResetConfirm(true)}
            className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Resetar Sistema
          </button>
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </div>

      {/* LATERAL / TOP MENU NAVIGATION */}
      <div className="bg-brand-dark/90 border border-white/10 p-2 rounded-2xl overflow-x-auto no-scrollbar shadow-xl">
        <div className="flex items-center gap-1.5 min-w-max">
          <button
            onClick={() => setActiveSubTab('dashboard')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-2 transition-all ${
              activeSubTab === 'dashboard' ? 'bg-brand-gold text-black shadow-lg shadow-amber-500/20 font-extrabold' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            📊 Dashboard
          </button>

          <button
            onClick={() => setActiveSubTab('championships')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-2 transition-all ${
              activeSubTab === 'championships' ? 'bg-brand-gold text-black shadow-lg shadow-amber-500/20 font-extrabold' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Trophy className="w-4 h-4" />
            🏆 Campeonatos
          </button>

          <button
            onClick={() => setActiveSubTab('players')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-2 transition-all ${
              activeSubTab === 'players' ? 'bg-brand-gold text-black shadow-lg shadow-amber-500/20 font-extrabold' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-4 h-4" />
            👥 Jogadores
          </button>

          <button
            onClick={() => setActiveSubTab('stickers')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-2 transition-all ${
              activeSubTab === 'stickers' ? 'bg-brand-gold text-black shadow-lg shadow-amber-500/20 font-extrabold' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Database className="w-4 h-4" />
            🖼️ Figurinhas
          </button>

          <button
            onClick={() => setActiveSubTab('packs')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-2 transition-all ${
              activeSubTab === 'packs' ? 'bg-brand-gold text-black shadow-lg shadow-amber-500/20 font-extrabold' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Package className="w-4 h-4" />
            📦 Pacotes
          </button>

          <button
            onClick={() => setActiveSubTab('ranking')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-2 transition-all ${
              activeSubTab === 'ranking' ? 'bg-brand-gold text-black shadow-lg shadow-amber-500/20 font-extrabold' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Award className="w-4 h-4" />
            🏅 Ranking
          </button>

          <button
            onClick={() => setActiveSubTab('prizes')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-2 transition-all ${
              activeSubTab === 'prizes' ? 'bg-brand-gold text-black shadow-lg shadow-amber-500/20 font-extrabold' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Gift className="w-4 h-4" />
            🎁 Premiações
          </button>

          <button
            onClick={() => setActiveSubTab('rewards_banner')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-2 transition-all ${
              activeSubTab === 'rewards_banner' ? 'bg-brand-gold text-black shadow-lg shadow-amber-500/20 font-extrabold' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            🎁 Banner de Premiações
          </button>

          <button
            onClick={() => setActiveSubTab('appearance')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-2 transition-all ${
              activeSubTab === 'appearance' ? 'bg-brand-gold text-black shadow-lg shadow-amber-500/20 font-extrabold' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Palette className="w-4 h-4" />
            🎨 Aparência
          </button>

          <button
            onClick={() => setActiveSubTab('countdown')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-2 transition-all ${
              activeSubTab === 'countdown' ? 'bg-brand-gold text-black shadow-lg shadow-amber-500/20 font-extrabold' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Clock className="w-4 h-4" />
            ⏳ Contagem Regressiva
          </button>

          <button
            onClick={() => setActiveSubTab('settings')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-2 transition-all ${
              activeSubTab === 'settings' ? 'bg-brand-gold text-black shadow-lg shadow-amber-500/20 font-extrabold' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Settings className="w-4 h-4" />
            ⚙️ Configurações
          </button>

          <button
            onClick={() => setActiveSubTab('logs')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-2 transition-all ${
              activeSubTab === 'logs' ? 'bg-brand-gold text-black shadow-lg shadow-amber-500/20 font-extrabold' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText className="w-4 h-4" />
            📜 Logs
          </button>
        </div>
      </div>

      {/* 1. DASHBOARD TAB */}
      {activeSubTab === 'dashboard' && (
        <div className="space-y-8" id="admin-dashboard-panel">
          {/* STATS GRID */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="bg-brand-surface border border-white/10 p-5 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-mono font-bold uppercase text-gray-400">Total de Jogadores</p>
                <h3 className="text-2xl font-display font-bold text-white">{stats?.totalPlayers || playersList.length}</h3>
              </div>
            </div>

            <div className="bg-brand-surface border border-white/10 p-5 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-mono font-bold uppercase text-gray-400">Total de Figurinhas</p>
                <h3 className="text-2xl font-display font-bold text-white">{stickers.length}</h3>
              </div>
            </div>

            <div className="bg-brand-surface border border-white/10 p-5 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-mono font-bold uppercase text-gray-400">Pacotes Distribuídos</p>
                <h3 className="text-2xl font-display font-bold text-white">{stats?.totalPacksDistributed || 0}</h3>
              </div>
            </div>

            <div className="bg-brand-surface border border-white/10 p-5 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-mono font-bold uppercase text-gray-400">Pacotes Abertos</p>
                <h3 className="text-2xl font-display font-bold text-white">{stats?.totalPacksOpened || 0}</h3>
              </div>
            </div>

            <div className="bg-brand-surface border border-white/10 p-5 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-mono font-bold uppercase text-gray-400">Legends Encontradas</p>
                <h3 className="text-2xl font-display font-bold text-yellow-400">{stats?.legendDrawn || 0}</h3>
              </div>
            </div>

            <div className="bg-brand-surface border border-white/10 p-5 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <RefreshCw className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-mono font-bold uppercase text-gray-400">Total Reciclagens</p>
                <h3 className="text-2xl font-display font-bold text-white">{stats?.totalRecyclesPerformed || 0}</h3>
              </div>
            </div>

            <div className="bg-brand-surface border border-white/10 p-5 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-mono font-bold uppercase text-gray-400">Jogadores Online</p>
                <h3 className="text-2xl font-display font-bold text-green-400">{stats?.onlinePlayers || 1}</h3>
              </div>
            </div>

            <div className="bg-brand-surface border border-white/10 p-5 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-mono font-bold uppercase text-gray-400">Álbuns Completos</p>
                <h3 className="text-2xl font-display font-bold text-rose-400">{stats?.albumCompletersCount || 0}</h3>
              </div>
            </div>
          </div>

          {/* RECENT OPENINGS & RANKING SUMMARY */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-brand-surface border border-white/10 p-6 rounded-2xl space-y-4">
              <h3 className="font-display text-lg uppercase tracking-wider text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-brand-gold" />
                Últimas Aberturas de Pacotes
              </h3>
              <div className="space-y-3">
                {stats?.recentOpenings && stats.recentOpenings.length > 0 ? (
                  stats.recentOpenings.map((opening) => (
                    <div key={opening.id} className="p-3 bg-brand-dark rounded-xl border border-white/5 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-white text-xs">{opening.playerNickname}</span>
                        <p className="text-[10px] text-gray-400">
                          {new Date(opening.openedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} • {opening.stickers.length} figurinhas
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {opening.stickers.map((s) => (
                          <span key={s.id} className="text-[9px] font-mono px-1.5 py-0.5 bg-white/10 rounded text-gray-300">
                            {s.number}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 italic">Nenhuma abertura registrada ainda.</p>
                )}
              </div>
            </div>

            <div className="bg-brand-surface border border-white/10 p-6 rounded-2xl space-y-4">
              <h3 className="font-display text-lg uppercase tracking-wider text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-brand-gold" />
                Líderes do Ranking
              </h3>
              <div className="space-y-2">
                {stats?.playerRanking && stats.playerRanking.length > 0 ? (
                  stats.playerRanking.slice(0, 5).map((p, idx) => (
                    <div key={p.id} className="p-3 bg-brand-dark rounded-xl border border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                          idx === 0 ? 'bg-amber-500 text-black' : idx === 1 ? 'bg-gray-300 text-black' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-white/10 text-gray-400'
                        }`}>
                          #{idx + 1}
                        </span>
                        <div>
                          <span className="font-bold text-white text-xs">{p.nickname}</span>
                          <span className="text-[10px] text-gray-400 block">{p.team}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-brand-gold">{p.uniqueCount} de 30</span>
                        <span className="text-[10px] text-gray-400 block">{p.progress}%</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 italic">Nenhum jogador classificado ainda.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. CAMPEONATOS TAB */}
      {activeSubTab === 'championships' && (
        <div className="space-y-6" id="championships-panel">
          <div className="flex justify-between items-center bg-brand-surface border border-white/10 p-6 rounded-2xl">
            <div>
              <h2 className="font-display text-xl uppercase tracking-wider text-white">Edições da Copa Astão</h2>
              <p className="text-xs text-gray-400 mt-1">Gerencie os campeonatos, altere a edição ativa ou crie uma nova temporada.</p>
            </div>
            <button
              onClick={() => {
                setEditingChampionship(null);
                setChampFormData({
                  name: '',
                  year: new Date().getFullYear(),
                  logoUrl: '/escudo3atual2.png',
                  description: '',
                  startDate: '',
                  endDate: '',
                  status: 'active'
                });
                setIsChampionshipModalOpen(true);
              }}
              className="px-4 py-2.5 bg-brand-gold text-black font-bold uppercase text-xs rounded-xl flex items-center gap-2 shadow-lg"
            >
              <Plus className="w-4 h-4" />
              Criar Campeonato
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {championships.map((champ) => (
              <div key={champ.id} className="bg-brand-surface border border-white/10 p-6 rounded-2xl space-y-4 relative overflow-hidden flex flex-col justify-between">
                <div className="flex items-start gap-4">
                  <img src={champ.logoUrl || '/escudo3atual2.png'} alt={champ.name} className="w-14 h-14 object-contain rounded-xl bg-black/40 p-1 border border-white/10" referrerPolicy="no-referrer" />
                  <div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      champ.status === 'active' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {champ.status === 'active' ? 'Ativo' : champ.status === 'closed' ? 'Encerrado' : 'Arquivado'}
                    </span>
                    <h3 className="font-display text-lg font-bold text-white uppercase mt-1">{champ.name}</h3>
                    <p className="text-xs font-mono text-gray-400">{champ.year}</p>
                  </div>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed">{champ.description || 'Edição oficial da Copa Astão.'}</p>

                <div className="pt-4 border-t border-white/10 flex flex-wrap gap-2">
                  {champ.status !== 'active' && (
                    <button
                      onClick={() => handleActivateChampionship(champ.id)}
                      className="px-3 py-1.5 bg-green-500/20 text-green-400 border border-green-500/30 text-xs font-bold rounded-lg uppercase"
                    >
                      Ativar
                    </button>
                  )}
                  <button
                    onClick={() => handleDuplicateChampionship(champ.id)}
                    className="px-3 py-1.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold rounded-lg uppercase flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" /> Duplicar
                  </button>
                  <button
                    onClick={() => handleArchiveChampionship(champ.id)}
                    className="px-3 py-1.5 bg-gray-500/20 text-gray-400 border border-gray-500/30 text-xs font-bold rounded-lg uppercase flex items-center gap-1"
                  >
                    <Archive className="w-3 h-3" /> Arquivar
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* CHAMPIONSHIP MODAL */}
          {isChampionshipModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-brand-surface border border-white/10 p-6 rounded-2xl max-w-lg w-full space-y-4">
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <h3 className="font-display text-lg uppercase text-white">
                    {editingChampionship ? 'Editar Campeonato' : 'Novo Campeonato'}
                  </h3>
                  <button onClick={() => setIsChampionshipModalOpen(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
                </div>

                <form onSubmit={handleSaveChampionship} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400 font-semibold uppercase">Nome do Campeonato</label>
                    <input
                      type="text"
                      value={champFormData.name}
                      onChange={(e) => setChampFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Copa Astão 2027"
                      className="w-full px-3 py-2 bg-brand-dark border border-white/10 rounded-lg text-white text-xs"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-gray-400 font-semibold uppercase">Ano</label>
                      <input
                        type="number"
                        value={champFormData.year}
                        onChange={(e) => setChampFormData(prev => ({ ...prev, year: parseInt(e.target.value, 10) }))}
                        className="w-full px-3 py-2 bg-brand-dark border border-white/10 rounded-lg text-white text-xs"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-400 font-semibold uppercase">Status</label>
                      <select
                        value={champFormData.status}
                        onChange={(e) => setChampFormData(prev => ({ ...prev, status: e.target.value as any }))}
                        className="w-full px-3 py-2 bg-brand-dark border border-white/10 rounded-lg text-white text-xs"
                      >
                        <option value="active">Ativo</option>
                        <option value="closed">Encerrado</option>
                        <option value="archived">Arquivado</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-gray-400 font-semibold uppercase">Descrição</label>
                    <textarea
                      value={champFormData.description}
                      onChange={(e) => setChampFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descrição da edição..."
                      className="w-full px-3 py-2 bg-brand-dark border border-white/10 rounded-lg text-white text-xs h-20"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-brand-gold text-black font-bold uppercase text-xs rounded-xl shadow-lg"
                  >
                    Salvar Campeonato
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. JOGADORES TAB */}
      {activeSubTab === 'players' && (
        <PlayersAdminTab stickers={stickers} onRefreshData={onRefreshData} />
      )}

      {/* 4. FIGURINHAS TAB */}
      {activeSubTab === 'stickers' && (
        <div className="space-y-6" id="stickers-panel">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-brand-surface border border-white/10 p-6 rounded-2xl">
            <div>
              <h2 className="font-display text-xl uppercase tracking-wider text-white">CMS de Figurinhas</h2>
              <p className="text-xs text-gray-400 mt-1">Gerencie, envie individualmente ou faça cadastro em lote por time.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setIsBulkCreatingStickers(true)}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase text-xs rounded-xl flex items-center gap-2 shadow-lg"
              >
                <Boxes className="w-4 h-4" />
                Cadastrar em Lote
              </button>
              <button
                onClick={handleOpenCreateSticker}
                className="px-4 py-2.5 bg-brand-gold text-black font-bold uppercase text-xs rounded-xl flex items-center gap-2 shadow-lg"
              >
                <Plus className="w-4 h-4" />
                Nova Figurinha
              </button>
            </div>
          </div>

          {/* STICKERS GRID */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {stickers.map((stk) => (
              <div key={stk.id} className="bg-brand-surface border border-white/10 p-3 rounded-2xl flex flex-col justify-between space-y-2 relative group hover:border-brand-gold/50 transition-all">
                <div className="flex justify-between items-center text-[10px] font-mono text-gray-400">
                  <span className="font-bold text-white">{stk.number}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${stk.rarity === 'Legend' ? 'bg-amber-500 text-black' : 'bg-white/10 text-gray-300'}`}>
                    {stk.rarity}
                  </span>
                </div>

                <div className="h-32 bg-black/40 rounded-xl overflow-hidden p-1 flex items-center justify-center border border-white/5">
                  {stk.image ? (
                    <img src={stk.image} alt={stk.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="text-[10px] text-gray-500 italic">Sem foto</span>
                  )}
                </div>

                <div>
                  <h4 className="font-display text-xs font-bold text-white truncate">{stk.name}</h4>
                  <span className="text-[10px] text-gray-400 block">{stk.team}</span>
                </div>

                <div className="flex gap-1 pt-1 border-t border-white/10">
                  <button onClick={() => handleOpenEditSticker(stk)} className="flex-1 py-1 bg-white/5 hover:bg-white/10 text-gray-300 text-[10px] font-bold uppercase rounded flex items-center justify-center gap-1">
                    <Edit className="w-3 h-3" />
                  </button>
                  <button onClick={() => handleDeleteSticker(stk.id, stk.name)} className="py-1 px-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-bold uppercase rounded">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* BULK UPLOAD MODAL */}
          {isBulkCreatingStickers && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-brand-surface border border-white/10 p-6 rounded-2xl max-w-md w-full space-y-4">
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <h3 className="font-display text-lg uppercase text-white">Cadastrar Figurinhas em Lote</h3>
                  <button onClick={() => setIsBulkCreatingStickers(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
                </div>

                <div className="space-y-3">
                  <label className="text-xs text-gray-400 font-semibold uppercase">Selecione o Time Destino</label>
                  <select
                    value={bulkTeam}
                    onChange={(e) => setBulkTeam(e.target.value as any)}
                    className="w-full px-3 py-2 bg-brand-dark border border-white/10 rounded-lg text-white text-xs"
                  >
                    <option value="Time Vermelho">Time Vermelho</option>
                    <option value="Time Azul">Time Azul</option>
                    <option value="Time Branco">Time Branco</option>
                    <option value="Time Preto">Time Preto</option>
                    <option value="Legends">Legends</option>
                  </select>

                  <div className="border-2 border-dashed border-white/20 p-6 rounded-2xl text-center space-y-3 bg-black/20">
                    <Upload className="w-8 h-8 text-brand-gold mx-auto" />
                    <p className="text-xs text-gray-300">
                      Selecione simultaneamente as fotos do {bulkTeam}
                    </p>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleBulkFilesSelect}
                      disabled={bulkUploading}
                      className="block w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-gold file:text-black hover:file:bg-yellow-500 cursor-pointer"
                    />
                  </div>

                  {bulkUploading && <p className="text-xs text-yellow-400 text-center animate-pulse">Processando e enviando figurinhas para o Storage...</p>}
                  {bulkSuccessMsg && <p className="text-xs text-green-400 text-center font-bold">{bulkSuccessMsg}</p>}
                </div>
              </div>
            </div>
          )}

          {/* SINGLE STICKER MODAL */}
          {isCreatingSticker && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-brand-surface border border-white/10 p-6 rounded-2xl max-w-2xl w-full space-y-4">
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <h3 className="font-display text-lg uppercase text-white">
                    {isEditingSticker ? 'Editar Figurinha' : 'Nova Figurinha'}
                  </h3>
                  <button onClick={() => setIsCreatingSticker(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <form onSubmit={handleSaveSticker} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-400 font-semibold uppercase">Número *</label>
                        <input
                          type="text"
                          value={stickerFormData.number}
                          onChange={(e) => setStickerFormData(prev => ({ ...prev, number: e.target.value }))}
                          placeholder="VER-01"
                          className="w-full px-3 py-2 bg-brand-dark border border-white/10 rounded-lg text-white text-xs"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 font-semibold uppercase">Raridade</label>
                        <select
                          value={stickerFormData.rarity}
                          onChange={(e) => setStickerFormData(prev => ({ ...prev, rarity: e.target.value as any }))}
                          className="w-full px-3 py-2 bg-brand-dark border border-white/10 rounded-lg text-white text-xs"
                        >
                          <option value="Normal">Normal</option>
                          <option value="Legend">Legend</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-gray-400 font-semibold uppercase">Nome *</label>
                      <input
                        type="text"
                        value={stickerFormData.name}
                        onChange={(e) => setStickerFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Nome do jogador"
                        className="w-full px-3 py-2 bg-brand-dark border border-white/10 rounded-lg text-white text-xs"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-400 font-semibold uppercase">Time *</label>
                      <select
                        value={stickerFormData.team}
                        onChange={(e) => setStickerFormData(prev => ({ ...prev, team: e.target.value as any }))}
                        className="w-full px-3 py-2 bg-brand-dark border border-white/10 rounded-lg text-white text-xs"
                      >
                        <option value="Time Branco">Time Branco</option>
                        <option value="Time Preto">Time Preto</option>
                        <option value="Time Azul">Time Azul</option>
                        <option value="Time Vermelho">Time Vermelho</option>
                        <option value="Legends">Legends</option>
                      </select>
                    </div>

                    <ImageUploader
                      label="Foto do Atleta"
                      bucket={`stickers/${stickerFormData.team.toLowerCase().replace('time ', '').trim()}`}
                      currentUrl={stickerFormData.image}
                      onUploadSuccess={(url) => setStickerFormData(prev => ({ ...prev, image: url }))}
                      onDeleteSuccess={() => setStickerFormData(prev => ({ ...prev, image: '' }))}
                    />

                    {stickerSaveError && <p className="text-xs text-red-400 bg-red-500/10 p-2 rounded">{stickerSaveError}</p>}

                    <button type="submit" className="w-full py-3 bg-brand-gold text-black font-bold uppercase text-xs rounded-xl shadow-lg">
                      Salvar Figurinha
                    </button>
                  </form>

                  {/* PREVIEW */}
                  <div className="bg-brand-dark p-4 rounded-xl flex flex-col items-center justify-center border border-white/10">
                    <span className="text-[10px] text-gray-400 uppercase font-mono mb-2">Preview do Card</span>
                    <div className="w-44 h-60 border-2 border-white/20 rounded-xl bg-gradient-to-b from-gray-900 to-black p-3 flex flex-col justify-between">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-mono text-white font-bold">#{stickerFormData.number || '00'}</span>
                        <span className="font-bold text-amber-400">{stickerFormData.rarity}</span>
                      </div>
                      <div className="flex-1 my-2 bg-black/50 rounded flex items-center justify-center overflow-hidden border border-white/5">
                        {stickerFormData.image ? (
                          <img src={stickerFormData.image} alt="Preview" className="w-full h-full object-contain" />
                        ) : (
                          <span className="text-[10px] text-gray-600">Sem Foto</span>
                        )}
                      </div>
                      <div className="text-center">
                        <span className="font-display text-xs font-bold text-white block">{stickerFormData.name || 'Nome do Atleta'}</span>
                        <span className="text-[9px] text-gray-400 block">{stickerFormData.team}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. PACOTES TAB */}
      {activeSubTab === 'packs' && (
        <div className="space-y-6" id="packs-panel">
          <div className="bg-brand-surface border border-white/10 p-6 rounded-2xl max-w-xl mx-auto space-y-6">
            <div>
              <h2 className="font-display text-xl uppercase tracking-wider text-white">Gerenciar Créditos de Pacotes</h2>
              <p className="text-xs text-gray-400 mt-1">Adicione ou ajuste o saldo de pacotes grátis ou comprados dos jogadores.</p>
            </div>

            <form onSubmit={handleAddPackCredits} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold uppercase">Jogador Target</label>
                <select
                  value={selectedPlayerForPack}
                  onChange={(e) => setSelectedPlayerForPack(e.target.value)}
                  className="w-full px-4 py-3 bg-brand-dark border border-white/10 rounded-xl text-white text-sm"
                  required
                >
                  <option value="">Selecione um jogador...</option>
                  {playersList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nickname} ({p.fullName}) — {p.team}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 font-semibold uppercase">Tipo de Pacote</label>
                  <select
                    value={packType}
                    onChange={(e) => setPackType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-brand-dark border border-white/10 rounded-lg text-white text-xs"
                  >
                    <option value="purchased">Comprado</option>
                    <option value="free">Grátis (Bônus)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-semibold uppercase">Motivo</label>
                  <select
                    value={packReason}
                    onChange={(e) => setPackReason(e.target.value)}
                    className="w-full px-3 py-2 bg-brand-dark border border-white/10 rounded-lg text-white text-xs"
                  >
                    <option value="Compra">Compra</option>
                    <option value="Bônus">Bônus</option>
                    <option value="Premiação">Premiação</option>
                    <option value="Ajuste Manual">Ajuste Manual</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 font-semibold uppercase block mb-2">Atalhos Rápidos de Quantidade</label>
                <div className="grid grid-cols-7 gap-2">
                  {[1, 3, 5, 10, 20, 50, 100].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setPackAmountToAdd(amt)}
                      className={`py-2 text-xs font-bold rounded-lg border ${
                        packAmountToAdd === amt ? 'bg-brand-gold text-black border-amber-500' : 'bg-white/5 text-gray-300 border-white/10'
                      }`}
                    >
                      +{amt}
                    </button>
                  ))}
                </div>
              </div>

              {packSuccessMsg && <p className="text-xs text-green-400 bg-green-500/10 p-3 rounded-xl border border-green-500/20">{packSuccessMsg}</p>}
              {packErrorMsg && <p className="text-xs text-red-400 bg-red-500/10 p-3 rounded-xl border border-red-500/20">{packErrorMsg}</p>}

              <button
                type="submit"
                disabled={addingPackCredits}
                className="w-full py-4 bg-brand-gold hover:bg-yellow-500 text-black font-display text-sm tracking-wider uppercase rounded-xl font-bold shadow-lg"
              >
                {addingPackCredits ? 'Adicionando...' : 'Confirmar Adição de Pacotes'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 6. RANKING TAB */}
      {activeSubTab === 'ranking' && (
        <div className="space-y-6" id="ranking-panel">
          <div className="bg-brand-surface border border-white/10 p-6 rounded-2xl">
            <h2 className="font-display text-xl uppercase tracking-wider text-white">Classificação Geral do Álbum</h2>
            <p className="text-xs text-gray-400 mt-1">Ranking em tempo real baseado em figurinhas únicas coladas.</p>
          </div>

          <div className="bg-brand-surface border border-white/10 p-6 rounded-2xl space-y-3">
            {stats?.playerRanking && stats.playerRanking.length > 0 ? (
              stats.playerRanking.map((p, idx) => (
                <div key={p.id} className="p-4 bg-brand-dark rounded-xl border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      idx === 0 ? 'bg-amber-500 text-black' : idx === 1 ? 'bg-gray-300 text-black' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-white/10 text-gray-400'
                    }`}>
                      #{idx + 1}
                    </span>
                    <div>
                      <span className="font-bold text-white text-sm">{p.nickname}</span>
                      <span className="text-xs text-gray-400 block">{p.fullName} • {p.team}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-mono font-bold text-brand-gold block">{p.uniqueCount} / 30 Figurinhas</span>
                    <span className="text-xs text-gray-400">{p.progress}% Completo</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500 italic text-center py-4">Sem dados no ranking.</p>
            )}
          </div>
        </div>
      )}

      {/* 7. PREMIAÇÕES TAB */}
      {activeSubTab === 'prizes' && (
        <div className="space-y-6" id="prizes-panel">
          <div className="flex justify-between items-center bg-brand-surface border border-white/10 p-6 rounded-2xl">
            <div>
              <h2 className="font-display text-xl uppercase tracking-wider text-white">Prêmios da Copa Astão</h2>
              <p className="text-xs text-gray-400 mt-1">Cadastre troféus, mantos e premiações oficiais entregues aos colecionadores.</p>
            </div>
            <button
              onClick={() => {
                setEditingPrize(null);
                setPrizeFormData({ name: '', description: '', imageUrl: '', quantity: 1, deliveryCriteria: '' });
                setIsPrizeModalOpen(true);
              }}
              className="px-4 py-2.5 bg-brand-gold text-black font-bold uppercase text-xs rounded-xl flex items-center gap-2 shadow-lg"
            >
              <Plus className="w-4 h-4" />
              Novo Prêmio
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {prizes.map((p) => (
              <div key={p.id} className="bg-brand-surface border border-white/10 p-5 rounded-2xl space-y-3 relative overflow-hidden">
                <div className="h-40 bg-black/40 rounded-xl overflow-hidden p-2 flex items-center justify-center border border-white/5">
                  <img src={p.imageUrl || '/copa26.png'} alt={p.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-white uppercase">{p.name}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed mt-1">{p.description}</p>
                </div>
                <div className="text-[11px] font-mono text-brand-gold bg-black/30 p-2 rounded-lg border border-white/5">
                  🏆 Critério: {p.deliveryCriteria}
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-white/10">
                  <span className="text-xs text-gray-400">Qtd: {p.quantity} unid.</span>
                  <button onClick={() => handleDeletePrize(p.id)} className="text-red-400 hover:text-red-300 text-xs font-bold">
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* PRIZE MODAL */}
          {isPrizeModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-brand-surface border border-white/10 p-6 rounded-2xl max-w-md w-full space-y-4">
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <h3 className="font-display text-lg uppercase text-white">Cadastrar Prêmio</h3>
                  <button onClick={() => setIsPrizeModalOpen(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
                </div>

                <form onSubmit={handleSavePrize} className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-400 font-semibold uppercase">Nome do Prêmio</label>
                    <input
                      type="text"
                      value={prizeFormData.name}
                      onChange={(e) => setPrizeFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Camisa Oficial Copa Astão"
                      className="w-full px-3 py-2 bg-brand-dark border border-white/10 rounded-lg text-white text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 font-semibold uppercase">Descrição</label>
                    <input
                      type="text"
                      value={prizeFormData.description}
                      onChange={(e) => setPrizeFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Detalhes da premiação..."
                      className="w-full px-3 py-2 bg-brand-dark border border-white/10 rounded-lg text-white text-xs"
                    />
                  </div>

                  <ImageUploader
                    label="Imagem do Prêmio"
                    bucket="premios"
                    currentUrl={prizeFormData.imageUrl}
                    onUploadSuccess={(url) => setPrizeFormData(prev => ({ ...prev, imageUrl: url }))}
                    onDeleteSuccess={() => setPrizeFormData(prev => ({ ...prev, imageUrl: '' }))}
                  />

                  <div>
                    <label className="text-xs text-gray-400 font-semibold uppercase">Critério de Entrega</label>
                    <input
                      type="text"
                      value={prizeFormData.deliveryCriteria}
                      onChange={(e) => setPrizeFormData(prev => ({ ...prev, deliveryCriteria: e.target.value }))}
                      placeholder="Ex: Top 1º lugar do Ranking"
                      className="w-full px-3 py-2 bg-brand-dark border border-white/10 rounded-lg text-white text-xs"
                    />
                  </div>

                  <button type="submit" className="w-full py-3 bg-brand-gold text-black font-bold uppercase text-xs rounded-xl shadow-lg">
                    Salvar Prêmio
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* REWARDS BANNER TAB */}
      {activeSubTab === 'rewards_banner' && (
        <RewardsBannerAdminTab />
      )}

      {/* 8. APARÊNCIA TAB */}
      {activeSubTab === 'appearance' && (
        <div className="space-y-6" id="appearance-panel">
          <div className="bg-brand-surface border border-white/10 p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="font-display text-xl uppercase tracking-wider text-white">Customização Visual & Aparência</h2>
              <p className="text-xs text-gray-400 mt-1">Altere logotipos, escudos dos 5 times e capas do álbum com upload direto no storage.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setAppearanceTab('logo')}
                className={`px-3 py-1.5 text-xs font-bold uppercase rounded-lg border ${appearanceTab === 'logo' ? 'bg-brand-gold text-black border-amber-500' : 'bg-white/5 text-gray-300 border-white/10'}`}
              >
                Logo
              </button>
              <button
                onClick={() => setAppearanceTab('teams')}
                className={`px-3 py-1.5 text-xs font-bold uppercase rounded-lg border ${appearanceTab === 'teams' ? 'bg-brand-gold text-black border-amber-500' : 'bg-white/5 text-gray-300 border-white/10'}`}
              >
                Escudos
              </button>
              <button
                onClick={() => setAppearanceTab('backgrounds')}
                className={`px-3 py-1.5 text-xs font-bold uppercase rounded-lg border ${appearanceTab === 'backgrounds' ? 'bg-brand-gold text-black border-amber-500' : 'bg-white/5 text-gray-300 border-white/10'}`}
              >
                Fundos
              </button>
              <button
                onClick={() => setAppearanceTab('album')}
                className={`px-3 py-1.5 text-xs font-bold uppercase rounded-lg border ${appearanceTab === 'album' ? 'bg-brand-gold text-black border-amber-500' : 'bg-white/5 text-gray-300 border-white/10'}`}
              >
                Capa Álbum
              </button>
            </div>
          </div>

          {appearanceTab === 'logo' && (
            <div className="bg-brand-surface border border-white/10 p-6 rounded-2xl max-w-lg mx-auto space-y-4">
              <h3 className="font-display text-lg uppercase text-white">Logo Oficial da Copa</h3>
              <ImageUploader
                label="Logotipo da Competição"
                bucket="logos"
                currentUrl={settings.logoUrl || '/escudo3atual2.png'}
                onUploadSuccess={(url) => updateSettings({ logoUrl: url })}
                onDeleteSuccess={() => updateSettings({ logoUrl: '/escudo3atual2.png' })}
              />
            </div>
          )}

          {appearanceTab === 'teams' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(settings.teams || []).map((t, idx) => (
                <div key={t.id} className="bg-brand-surface border border-white/10 p-5 rounded-2xl space-y-3">
                  <h4 className="font-display text-base font-bold text-white uppercase">{t.name}</h4>
                  <ImageUploader
                    label={`Escudo ${t.name}`}
                    bucket="teams"
                    currentUrl={t.shieldUrl}
                    onUploadSuccess={(url) => {
                      const updatedTeams = [...(settings.teams || [])];
                      updatedTeams[idx] = { ...updatedTeams[idx], shieldUrl: url };
                      updateSettings({ teams: updatedTeams });
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {appearanceTab === 'backgrounds' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-brand-surface border border-white/10 p-5 rounded-2xl space-y-3">
                <h4 className="font-display text-base font-bold text-white uppercase">Fundo Tela Inicial</h4>
                <ImageUploader
                  label="Imagem de Fundo Home"
                  bucket="backgrounds"
                  currentUrl={settings.homeBackgroundUrl}
                  onUploadSuccess={(url) => updateSettings({ homeBackgroundUrl: url })}
                />
              </div>
              <div className="bg-brand-surface border border-white/10 p-5 rounded-2xl space-y-3">
                <h4 className="font-display text-base font-bold text-white uppercase">Fundo do Ranking</h4>
                <ImageUploader
                  label="Imagem de Fundo Ranking"
                  bucket="backgrounds"
                  currentUrl={settings.rankingBackgroundUrl}
                  onUploadSuccess={(url) => updateSettings({ rankingBackgroundUrl: url })}
                />
              </div>
            </div>
          )}

          {appearanceTab === 'album' && (
            <div className="bg-brand-surface border border-white/10 p-6 rounded-2xl max-w-lg mx-auto space-y-4">
              <h3 className="font-display text-lg uppercase text-white">Capa do Álbum</h3>
              <ImageUploader
                label="Banner Capa do Álbum"
                bucket="album"
                currentUrl={settings.albumCoverUrl || '/copa26.png'}
                onUploadSuccess={(url) => updateSettings({ albumCoverUrl: url })}
              />
            </div>
          )}
        </div>
      )}

      {/* 9. CONTAGEM REGRESSIVA TAB */}
      {activeSubTab === 'countdown' && (
        <CountdownAdminTab />
      )}

      {/* 10. CONFIGURAÇÕES TAB */}
      {activeSubTab === 'settings' && (
        <div className="space-y-6" id="settings-panel">
          <div className="bg-brand-surface border border-white/10 p-6 sm:p-8 rounded-2xl max-w-xl mx-auto space-y-6">
            <div>
              <h3 className="font-display text-xl uppercase tracking-wider text-white">Configurações e Regras</h3>
              <p className="text-xs text-gray-400 mt-1">Ajuste probabilidades, contadores e políticas do sistema.</p>
            </div>

            <form onSubmit={handleSaveProbabilities} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs text-gray-400 font-semibold uppercase">Cartas Normais ({probNormal}%)</label>
                <input
                  type="range"
                  min="50"
                  max="99"
                  value={probNormal}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setProbNormal(val);
                    setProbLegend(100 - val);
                  }}
                  className="w-full accent-brand-blue"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-gray-400 font-semibold uppercase text-brand-gold-glow">Cartas Legends ({probLegend}%)</label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={probLegend}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setProbLegend(val);
                    setProbNormal(100 - val);
                  }}
                  className="w-full accent-brand-gold"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-white/10">
                <label className="text-xs text-gray-400 font-semibold uppercase">Pacotes Grátis Iniciais</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={initialFreePacks}
                  onChange={(e) => setInitialFreePacks(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-4 py-3 bg-brand-dark border border-white/10 rounded-xl text-white text-sm"
                />
              </div>

              {probSaveStatus === 'success' && <p className="text-xs text-green-400 text-center">Salvo com sucesso!</p>}

              <button type="submit" className="w-full py-4 bg-brand-gold text-black font-bold uppercase text-xs rounded-xl shadow-lg">
                Salvar Configurações
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 10. LOGS TAB */}
      {activeSubTab === 'logs' && (
        <div className="space-y-6" id="logs-panel">
          <div className="bg-brand-surface border border-white/10 p-6 rounded-2xl">
            <h2 className="font-display text-xl uppercase tracking-wider text-white">Logs do Sistema</h2>
            <p className="text-xs text-gray-400 mt-1">Histórico auditável das ações executadas no painel administrativo.</p>
          </div>

          <div className="bg-brand-surface border border-white/10 p-6 rounded-2xl space-y-2 max-h-[600px] overflow-y-auto">
            {systemLogs.length > 0 ? (
              systemLogs.map((log) => (
                <div key={log.id} className="p-3 bg-brand-dark rounded-xl border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs">
                  <div className="space-y-1">
                    <span className="font-mono text-brand-gold font-bold px-2 py-0.5 bg-brand-gold/10 rounded border border-brand-gold/20 mr-2">
                      {log.action}
                    </span>
                    <span className="text-gray-200">{log.details}</span>
                  </div>
                  <span className="text-[10px] font-mono text-gray-500 mt-1 sm:mt-0">
                    {new Date(log.createdAt).toLocaleString('pt-BR')}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500 italic text-center py-4">Nenhum log registrado ainda.</p>
            )}
          </div>
        </div>
      )}

      {/* RESET CONFIRMATION MODAL */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-neutral-900 to-brand-surface border border-red-500/30 p-6 sm:p-8 rounded-2xl max-w-md w-full shadow-2xl text-center space-y-6 relative overflow-hidden">
            <div className="w-12 h-12 bg-red-500/15 border border-red-500/30 rounded-xl flex items-center justify-center mx-auto text-red-400 shadow-inner">
              <AlertTriangle className="w-6 h-6 animate-bounce" />
            </div>

            <div className="space-y-2">
              <h3 className="font-display text-xl uppercase tracking-wider text-white">Confirmar Reset Geral</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Atenção: Esta ação irá limpar as figurinhas coladas e histórico de todos os jogadores, 
                resetando saldos para os valores iniciais configurados.
              </p>
            </div>

            {resetError && <div className="text-xs bg-red-500/10 text-red-400 p-3 rounded-lg text-left">{resetError}</div>}

            {resetSuccess ? (
              <div className="text-xs bg-green-500/10 text-green-400 p-3 rounded-lg text-center font-bold">
                Álbum resetado com sucesso! Recarregando...
              </div>
            ) : (
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-gray-300 font-display text-sm tracking-wider uppercase border border-white/10 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isResetting}
                  onClick={handleResetSystem}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-display text-sm tracking-wider uppercase rounded-xl font-bold"
                >
                  {isResetting ? 'Resetando...' : 'Resetar Agora'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
