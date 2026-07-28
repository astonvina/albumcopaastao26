import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  Key, 
  Package, 
  QrCode, 
  Eye, 
  Download, 
  CheckCircle2, 
  XCircle, 
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Award,
  Sparkles,
  X,
  Copy,
  Check,
  RotateCcw
} from 'lucide-react';
import QRCode from 'qrcode';
import { Player, UserProfile, Sticker } from '../types';
import ImageUploader from './ImageUploader';
import { 
  getPlayersFromSupabase, 
  savePlayerToSupabase, 
  deletePlayerFromSupabase, 
  buildUserProfile,
  resetAllPlayersAlbumsInSupabase
} from '../lib/supabaseData';


interface PlayersAdminTabProps {
  stickers: Sticker[];
  onRefreshData: () => void;
}

export default function PlayersAdminTab({ stickers, onRefreshData }: PlayersAdminTabProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals & Active Selections
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [creditsPlayer, setCreditsPlayer] = useState<Player | null>(null);
  const [resetPassPlayer, setResetPassPlayer] = useState<Player | null>(null);
  const [qrPlayer, setQrPlayer] = useState<Player | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [viewingPlayerProfile, setViewingPlayerProfile] = useState<{ player: Player; profile: UserProfile } | null>(null);

  // Form States
  const [addForm, setAddForm] = useState({
    fullName: '',
    nickname: '',
    team: 'Time Branco',
    photoUrl: '',
    password: '',
    initialPacks: 0
  });

  const [editForm, setEditForm] = useState({
    fullName: '',
    nickname: '',
    team: 'Time Branco',
    photoUrl: '',
    status: 'active' as 'active' | 'inactive',
    purchasedPacks: 0,
    freePacks: 0
  });

  const [creditForm, setCreditForm] = useState({
    amount: 5,
    type: 'purchased' as 'purchased' | 'free',
    reason: 'Compra de pacotes na comissão'
  });

  const [newPassword, setNewPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isResettingAll, setIsResettingAll] = useState(false);

  // Reset All Players Albums Function
  const handleResetAllAlbums = async () => {
    if (!window.confirm("Tem certeza que deseja resetar o álbum de TODOS os jogadores para zero? Esta ação apagará todas as figurinhas coladas e zerará os saldos de pacotes.")) {
      return;
    }

    setIsResettingAll(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await resetAllPlayersAlbumsInSupabase();

      // Update local React state for all players immediately
      setPlayers(prev => prev.map(p => ({
        ...p,
        collectedStickers: {},
        completedAlbum: false,
        completedAt: null,
        purchasedPacks: 0,
        freePacks: 0
      })));

      onRefreshData();
      setSuccessMsg("Todos os álbuns foram resetados com sucesso!");
      alert("Todos os álbuns foram resetados com sucesso!");
    } catch (err: any) {
      console.error('Erro ao resetar álbuns:', err);
      setErrorMsg('Erro ao resetar os álbuns: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setIsResettingAll(false);
    }
  };

  // Fetch Players List
  const fetchPlayers = async () => {
    setLoading(true);
    try {
      const data = await getPlayersFromSupabase();
      setPlayers(data);
    } catch (err) {
      console.error('Erro ao buscar jogadores:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  // Handle Add Player
  const handleAddPlayerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      const initialPacksNum = addForm.initialPacks !== undefined && addForm.initialPacks !== null && !isNaN(addForm.initialPacks)
        ? Number(addForm.initialPacks)
        : 0;

      const newPlayer = await savePlayerToSupabase({
        fullName: addForm.fullName,
        nickname: addForm.nickname,
        team: addForm.team,
        photoUrl: addForm.photoUrl,
        password: addForm.password || '123456',
        purchasedPacks: initialPacksNum,
        freePacks: 0,
        status: 'active'
      });

      setSuccessMsg(`Jogador ${newPlayer.nickname} criado com sucesso! Code: ${newPlayer.accessCode}`);
      setShowAddModal(false);
      setAddForm({
        fullName: '',
        nickname: '',
        team: 'Time Branco',
        photoUrl: '',
        password: '',
        initialPacks: 0
      });
      fetchPlayers();
      onRefreshData();
    } catch (err: any) {
      setErrorMsg('Erro ao cadastrar jogador: ' + err.message);
    }
  };

  // Handle Edit Player
  const handleEditPlayerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlayer) return;
    setErrorMsg(null);
    try {
      const updated = await savePlayerToSupabase({
        ...editingPlayer,
        fullName: editForm.fullName,
        nickname: editForm.nickname,
        team: editForm.team,
        photoUrl: editForm.photoUrl,
        status: editForm.status,
        purchasedPacks: Number(editForm.purchasedPacks),
        freePacks: Number(editForm.freePacks)
      });

      setSuccessMsg(`Jogador ${updated.nickname} atualizado!`);
      setEditingPlayer(null);
      fetchPlayers();
      onRefreshData();
    } catch (err: any) {
      setErrorMsg('Erro ao atualizar: ' + err.message);
    }
  };

  // Handle Adjust Credits
  const handleAdjustCreditsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creditsPlayer) return;
    setErrorMsg(null);
    try {
      const isPurchased = creditForm.type === 'purchased';
      const updatedPacks = isPurchased 
        ? Math.max(0, creditsPlayer.purchasedPacks + creditForm.amount)
        : creditsPlayer.purchasedPacks;
      const updatedFreePacks = !isPurchased 
        ? Math.max(0, creditsPlayer.freePacks + creditForm.amount)
        : creditsPlayer.freePacks;

      const updated = await savePlayerToSupabase({
        ...creditsPlayer,
        purchasedPacks: updatedPacks,
        freePacks: updatedFreePacks
      });

      setSuccessMsg(`Créditos alterados para ${updated.nickname}!`);
      setCreditsPlayer(null);
      fetchPlayers();
      onRefreshData();
    } catch (err: any) {
      setErrorMsg('Erro ao ajustar créditos: ' + err.message);
    }
  };

  // Handle Reset Password
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPassPlayer || !newPassword) return;
    setErrorMsg(null);
    try {
      const updated = await savePlayerToSupabase({
        ...resetPassPlayer,
        password: newPassword.trim(),
        hasPassword: true
      });

      setSuccessMsg(`Senha alterada para ${updated.nickname}!`);
      setResetPassPlayer(null);
      setNewPassword('');
      fetchPlayers();
    } catch (err: any) {
      setErrorMsg('Erro ao resetar senha: ' + err.message);
    }
  };

  // Handle Delete Player
  const handleDeletePlayer = async (id: string, name: string) => {
    if (!window.confirm(`Deseja realmente remover o jogador '${name}'? Todo o histórico dele será excluído.`)) return;
    try {
      await deletePlayerFromSupabase(id);
      setSuccessMsg(`Jogador ${name} removido com sucesso.`);
      fetchPlayers();
      onRefreshData();
    } catch (err: any) {
      console.error('Erro ao excluir jogador:', err);
    }
  };

  // Generate QR Code
  const handleOpenQrCode = async (player: Player) => {
    setQrPlayer(player);
    try {
      const accessUrl = `${window.location.origin}?loginCode=${player.accessCode}`;
      const url = await QRCode.toDataURL(accessUrl, {
        width: 300,
        margin: 2,
        color: { dark: '#111827', light: '#FFFFFF' }
      });
      setQrCodeDataUrl(url);
    } catch (err) {
      console.error('Erro ao gerar QR Code:', err);
    }
  };

  // View Player Album Stats
  const handleViewPlayerProfile = async (player: Player) => {
    try {
      const profile = await buildUserProfile(player);
      setViewingPlayerProfile({ player, profile });
    } catch (err) {
      console.error('Erro ao buscar perfil do jogador:', err);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const filtered = players.filter(p => {
      const matchesSearch = p.fullName.toLowerCase().includes(search.toLowerCase()) || 
                            p.nickname.toLowerCase().includes(search.toLowerCase()) ||
                            p.accessCode.toLowerCase().includes(search.toLowerCase());
      const matchesTeam = teamFilter === 'all' || p.team === teamFilter;
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchesSearch && matchesTeam && matchesStatus;
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + "ID,Nome Completo,Apelido,Time,Codigo Acesso,Status,Pacotes Comprados,Pacotes Gratis,Figurinhas Coletadas\n"
      + filtered.map(p => {
          const totalCol = Object.values(p.collectedStickers || {}).reduce((a: number, b: number) => a + b, 0);
          return `"${p.id}","${p.fullName}","${p.nickname}","${p.team}","${p.accessCode}","${p.status}",${p.purchasedPacks},${p.freePacks},${totalCol}`;
        }).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `jogadores_copa_astao_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Players
  const filteredPlayers = players.filter(p => {
    const matchesSearch = p.fullName.toLowerCase().includes(search.toLowerCase()) || 
                          p.nickname.toLowerCase().includes(search.toLowerCase()) ||
                          p.accessCode.toLowerCase().includes(search.toLowerCase());
    const matchesTeam = teamFilter === 'all' || p.team === teamFilter;
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesTeam && matchesStatus;
  });

  return (
    <div className="space-y-6 text-left" id="players-admin-tab">
      
      {/* Notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-semibold flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-xs font-semibold flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Controls Bar */}
      <div className="bg-brand-surface border border-white/5 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, apelido ou código..."
              className="w-full pl-9 pr-4 py-2 bg-brand-dark border border-white/10 rounded-lg text-xs text-white outline-none focus:border-brand-gold transition-all"
            />
          </div>

          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="px-3 py-2 bg-brand-dark border border-white/10 rounded-lg text-xs text-white outline-none focus:border-brand-gold transition-all"
          >
            <option value="all">Todos os Times</option>
            <option value="Time Branco">Time Branco</option>
            <option value="Time Preto">Time Preto</option>
            <option value="Time Azul">Time Azul</option>
            <option value="Time Vermelho">Time Vermelho</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-brand-dark border border-white/10 rounded-lg text-xs text-white outline-none focus:border-brand-gold transition-all"
          >
            <option value="all">Todos os Status</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <button
            onClick={handleResetAllAlbums}
            disabled={isResettingAll}
            className="px-3.5 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {isResettingAll ? 'Resetando...' : 'Resetar Todos os Álbuns'}
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5 text-brand-gold" />
            Exportar CSV
          </button>

          <button
            onClick={() => {
              setShowAddModal(true);
              setAddForm({
                fullName: '',
                nickname: '',
                team: 'Time Branco',
                photoUrl: '',
                password: '',
                initialPacks: 10
              });
            }}
            className="px-4 py-2 bg-brand-gold hover:bg-yellow-500 text-black rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md border-b-2 border-amber-700 transition-all"
          >
            <Plus className="w-4 h-4" />
            Cadastrar Jogador
          </button>
        </div>

      </div>

      {/* Players List Table */}
      <div className="bg-brand-surface border border-white/5 rounded-2xl overflow-hidden shadow-lg">
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-xs">Carregando lista de jogadores...</div>
        ) : filteredPlayers.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-xs italic">Nenhum jogador encontrado com os filtros aplicados.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-brand-dark/80 uppercase text-[10px] font-mono tracking-wider text-gray-400 border-b border-white/5">
                <tr>
                  <th className="p-4">Jogador</th>
                  <th className="p-4">Time</th>
                  <th className="p-4">Código Acesso</th>
                  <th className="p-4">Pacotes Disponíveis</th>
                  <th className="p-4">Progresso Álbum</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredPlayers.map(p => {
                  const uniqueCount = Object.keys(p.collectedStickers || {}).filter(k => (p.collectedStickers[k] || 0) > 0).length;
                  const totalStickersCount = stickers.length || 30;
                  const progressPct = Math.round((uniqueCount / totalStickersCount) * 100);

                  return (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Player Name & Photo */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
                            alt={p.nickname}
                            className="w-9 h-9 rounded-full object-cover border border-white/10"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <div className="font-bold text-white text-sm">{p.nickname}</div>
                            <div className="text-[10px] text-gray-400">{p.fullName}</div>
                          </div>
                        </div>
                      </td>

                      {/* Team */}
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold border ${
                          p.team === 'Time Branco' ? 'bg-white/10 border-white/20 text-white' :
                          p.team === 'Time Preto' ? 'bg-neutral-800 border-neutral-600 text-gray-300' :
                          p.team === 'Time Azul' ? 'bg-sky-500/10 border-sky-500/30 text-sky-400' :
                          'bg-red-500/10 border-red-500/30 text-red-400'
                        }`}>
                          {p.team}
                        </span>
                      </td>

                      {/* Code */}
                      <td className="p-4">
                        <span className="font-mono font-bold text-brand-gold bg-brand-gold/10 px-2.5 py-1 rounded border border-brand-gold/20">
                          {p.accessCode}
                        </span>
                      </td>

                      {/* Packs Available */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-brand-gold-glow" />
                          <div>
                            <span className="font-bold text-white text-sm">{p.purchasedPacks + p.freePacks}</span>
                            <span className="text-[10px] text-gray-500 block font-mono">
                              ({p.purchasedPacks} Comprados / {p.freePacks} Grátis)
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Album Progress */}
                      <td className="p-4 min-w-[140px]">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span className="text-gray-400">{uniqueCount}/{totalStickersCount}</span>
                            <span className="text-brand-blue-glow font-bold">{progressPct}%</span>
                          </div>
                          <div className="h-1.5 bg-brand-dark rounded-full overflow-hidden border border-white/5">
                            <div 
                              className={`h-full ${p.completedAlbum ? 'bg-emerald-400' : 'bg-brand-blue'}`} 
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        {p.status === 'active' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
                            <XCircle className="w-3 h-3" />
                            Inativo
                          </span>
                        )}
                      </td>

                      {/* Action icons */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* QR Code */}
                          <button
                            onClick={() => handleOpenQrCode(p)}
                            title="Gerar QR Code de Acesso"
                            className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg transition-all"
                          >
                            <QrCode className="w-4 h-4 text-brand-gold-glow" />
                          </button>

                          {/* View Profile */}
                          <button
                            onClick={() => handleViewPlayerProfile(p)}
                            title="Ver Álbum do Jogador"
                            className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg transition-all"
                          >
                            <Eye className="w-4 h-4 text-brand-blue-glow" />
                          </button>

                          {/* Manage Credits */}
                          <button
                            onClick={() => {
                              setCreditsPlayer(p);
                              setCreditForm({ amount: 5, type: 'purchased', reason: 'Adição manual via Admin' });
                            }}
                            title="Gerenciar Créditos de Pacotes"
                            className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg transition-all"
                          >
                            <Package className="w-4 h-4 text-emerald-400" />
                          </button>

                          {/* Reset Password */}
                          <button
                            onClick={() => {
                              setResetPassPlayer(p);
                              setNewPassword('');
                            }}
                            title="Resetar Senha"
                            className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg transition-all"
                          >
                            <Key className="w-4 h-4 text-amber-400" />
                          </button>

                          {/* Edit Player */}
                          <button
                            onClick={() => {
                              setEditingPlayer(p);
                              setEditForm({
                                fullName: p.fullName,
                                nickname: p.nickname,
                                team: p.team,
                                photoUrl: p.photoUrl,
                                status: p.status,
                                purchasedPacks: p.purchasedPacks ?? 0,
                                freePacks: p.freePacks ?? 0
                              });
                            }}
                            title="Editar Jogador"
                            className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg transition-all"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Delete Player */}
                          <button
                            onClick={() => handleDeletePlayer(p.id, p.nickname)}
                            title="Excluir Jogador"
                            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: ADD PLAYER */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-brand-surface border border-white/10 p-6 rounded-2xl w-full max-w-md space-y-5 relative text-left">
            <button 
              onClick={() => setShowAddModal(false)} 
              className="absolute right-4 top-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-display text-xl uppercase tracking-wider text-white">
              Cadastrar Novo Jogador
            </h3>

            <form onSubmit={handleAddPlayerSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold uppercase">Nome Completo *</label>
                <input
                  type="text"
                  value={addForm.fullName}
                  onChange={(e) => setAddForm(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Ex: Gabriel Guimarães"
                  className="w-full px-3.5 py-2.5 bg-brand-dark border border-white/10 rounded-xl text-white text-xs outline-none focus:border-brand-gold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-semibold uppercase">Apelido *</label>
                  <input
                    type="text"
                    value={addForm.nickname}
                    onChange={(e) => setAddForm(prev => ({ ...prev, nickname: e.target.value }))}
                    placeholder="Ex: Gabriel"
                    className="w-full px-3.5 py-2.5 bg-brand-dark border border-white/10 rounded-xl text-white text-xs outline-none focus:border-brand-gold"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-semibold uppercase">Time *</label>
                  <select
                    value={addForm.team}
                    onChange={(e) => setAddForm(prev => ({ ...prev, team: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-brand-dark border border-white/10 rounded-xl text-white text-xs outline-none focus:border-brand-gold"
                  >
                    <option value="Time Branco">Time Branco</option>
                    <option value="Time Preto">Time Preto</option>
                    <option value="Time Azul">Time Azul</option>
                    <option value="Time Vermelho">Time Vermelho</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-semibold uppercase">Senha Inicial</label>
                  <input
                    type="password"
                    value={addForm.password}
                    onChange={(e) => setAddForm(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Padrão: 123456"
                    className="w-full px-3.5 py-2.5 bg-brand-dark border border-white/10 rounded-xl text-white text-xs outline-none focus:border-brand-gold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-semibold uppercase">Pacotes Iniciais</label>
                  <input
                    type="number"
                    value={addForm.initialPacks}
                    onChange={(e) => setAddForm(prev => ({ ...prev, initialPacks: parseInt(e.target.value, 10) || 0 }))}
                    className="w-full px-3.5 py-2.5 bg-brand-dark border border-white/10 rounded-xl text-white text-xs outline-none focus:border-brand-gold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <ImageUploader
                  label="Foto do Jogador"
                  bucket="players"
                  customName={addForm.nickname ? `player_${addForm.nickname}` : 'player'}
                  currentUrl={addForm.photoUrl}
                  onUploadSuccess={(url) => setAddForm(prev => ({ ...prev, photoUrl: url }))}
                  onDeleteSuccess={() => setAddForm(prev => ({ ...prev, photoUrl: '' }))}
                  description="Formatos: PNG, JPG, WEBP (Máx. 10MB)"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-white/5 text-white rounded-lg text-xs font-semibold uppercase"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-gold text-black rounded-lg text-xs font-bold uppercase shadow-md"
                >
                  Criar Jogador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT PLAYER */}
      {editingPlayer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-brand-surface border border-white/10 p-6 rounded-2xl w-full max-w-md space-y-5 relative text-left">
            <button 
              onClick={() => setEditingPlayer(null)} 
              className="absolute right-4 top-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-display text-xl uppercase tracking-wider text-white">
              Editar Jogador: {editingPlayer.nickname}
            </h3>

            <form onSubmit={handleEditPlayerSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold uppercase">Nome Completo</label>
                <input
                  type="text"
                  value={editForm.fullName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, fullName: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-brand-dark border border-white/10 rounded-xl text-white text-xs outline-none focus:border-brand-gold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-semibold uppercase">Apelido</label>
                  <input
                    type="text"
                    value={editForm.nickname}
                    onChange={(e) => setEditForm(prev => ({ ...prev, nickname: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-brand-dark border border-white/10 rounded-xl text-white text-xs outline-none focus:border-brand-gold"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-semibold uppercase">Time</label>
                  <select
                    value={editForm.team}
                    onChange={(e) => setEditForm(prev => ({ ...prev, team: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-brand-dark border border-white/10 rounded-xl text-white text-xs outline-none focus:border-brand-gold"
                  >
                    <option value="Time Branco">Time Branco</option>
                    <option value="Time Preto">Time Preto</option>
                    <option value="Time Azul">Time Azul</option>
                    <option value="Time Vermelho">Time Vermelho</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-semibold uppercase">Pacotes Comprados</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.purchasedPacks}
                    onChange={(e) => setEditForm(prev => ({ ...prev, purchasedPacks: parseInt(e.target.value, 10) || 0 }))}
                    className="w-full px-3.5 py-2.5 bg-brand-dark border border-white/10 rounded-xl text-white text-xs outline-none focus:border-brand-gold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-semibold uppercase">Pacotes Grátis</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.freePacks}
                    onChange={(e) => setEditForm(prev => ({ ...prev, freePacks: parseInt(e.target.value, 10) || 0 }))}
                    className="w-full px-3.5 py-2.5 bg-brand-dark border border-white/10 rounded-xl text-white text-xs outline-none focus:border-brand-gold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold uppercase">Status da Conta</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full px-3.5 py-2.5 bg-brand-dark border border-white/10 rounded-xl text-white text-xs outline-none focus:border-brand-gold"
                >
                  <option value="active">Ativo (Permitir Acesso)</option>
                  <option value="inactive">Inativo (Bloquear Acesso)</option>
                </select>
              </div>

              <div className="space-y-1">
                <ImageUploader
                  label="Foto do Jogador"
                  bucket="players"
                  customName={editForm.nickname ? `player_${editForm.nickname}` : 'player'}
                  currentUrl={editForm.photoUrl}
                  onUploadSuccess={(url) => setEditForm(prev => ({ ...prev, photoUrl: url }))}
                  onDeleteSuccess={() => setEditForm(prev => ({ ...prev, photoUrl: '' }))}
                  description="Formatos: PNG, JPG, WEBP (Máx. 10MB)"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingPlayer(null)}
                  className="px-4 py-2 bg-white/5 text-white rounded-lg text-xs font-semibold uppercase"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-gold text-black rounded-lg text-xs font-bold uppercase shadow-md"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CREDITS MANAGEMENT */}
      {creditsPlayer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-brand-surface border border-white/10 p-6 rounded-2xl w-full max-w-md space-y-5 relative text-left">
            <button 
              onClick={() => setCreditsPlayer(null)} 
              className="absolute right-4 top-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="font-display text-xl uppercase tracking-wider text-white">
                Gerenciar Pacotes: {creditsPlayer.nickname}
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Saldo atual: <span className="text-brand-gold font-bold">{creditsPlayer.purchasedPacks} Comprados</span> | <span className="text-brand-blue-glow font-bold">{creditsPlayer.freePacks} Grátis</span>
              </p>
            </div>

            <form onSubmit={handleAdjustCreditsSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-semibold uppercase">Quantidade (+ ou -)</label>
                  <input
                    type="number"
                    value={creditForm.amount}
                    onChange={(e) => setCreditForm(prev => ({ ...prev, amount: parseInt(e.target.value, 10) || 0 }))}
                    placeholder="Ex: 5 ou -2"
                    className="w-full px-3.5 py-2.5 bg-brand-dark border border-white/10 rounded-xl text-white text-xs outline-none focus:border-brand-gold font-mono font-bold"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-semibold uppercase">Tipo do Crédito</label>
                  <select
                    value={creditForm.type}
                    onChange={(e) => setCreditForm(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full px-3.5 py-2.5 bg-brand-dark border border-white/10 rounded-xl text-white text-xs outline-none focus:border-brand-gold"
                  >
                    <option value="purchased">Comprado</option>
                    <option value="free">Grátis (Bônus)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold uppercase">Motivo / Justificativa *</label>
                <input
                  type="text"
                  value={creditForm.reason}
                  onChange={(e) => setCreditForm(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Ex: Pagamento Pix recebido / Bônus do torneio"
                  className="w-full px-3.5 py-2.5 bg-brand-dark border border-white/10 rounded-xl text-white text-xs outline-none focus:border-brand-gold"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setCreditsPlayer(null)}
                  className="px-4 py-2 bg-white/5 text-white rounded-lg text-xs font-semibold uppercase"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs uppercase shadow-md"
                >
                  Confirmar Ajuste
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: RESET PASSWORD */}
      {resetPassPlayer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-brand-surface border border-white/10 p-6 rounded-2xl w-full max-w-sm space-y-5 relative text-left">
            <button 
              onClick={() => setResetPassPlayer(null)} 
              className="absolute right-4 top-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-display text-xl uppercase tracking-wider text-white">
              Resetar Senha: {resetPassPlayer.nickname}
            </h3>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold uppercase">Nova Senha *</label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Digite a nova senha..."
                  className="w-full px-3.5 py-2.5 bg-brand-dark border border-white/10 rounded-xl text-white text-xs outline-none focus:border-brand-gold font-mono"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setResetPassPlayer(null)}
                  className="px-4 py-2 bg-white/5 text-white rounded-lg text-xs font-semibold uppercase"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs uppercase shadow-md"
                >
                  Alterar Senha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: QR CODE VIEW */}
      {qrPlayer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-brand-surface border border-white/10 p-6 rounded-2xl w-full max-w-sm text-center space-y-5 relative">
            <button 
              onClick={() => setQrPlayer(null)} 
              className="absolute right-4 top-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="font-display text-xl uppercase tracking-wider text-white">
                QR Code de Acesso
              </h3>
              <p className="text-xs text-gray-400">{qrPlayer.fullName} ({qrPlayer.nickname})</p>
            </div>

            {qrCodeDataUrl ? (
              <div className="bg-white p-4 rounded-2xl inline-block shadow-xl border border-white/20">
                <img src={qrCodeDataUrl} alt="QR Code" className="w-48 h-48 mx-auto" />
              </div>
            ) : (
              <div className="w-48 h-48 bg-white/5 rounded-2xl flex items-center justify-center mx-auto animate-pulse">
                Gerando QR Code...
              </div>
            )}

            <div className="space-y-2 bg-brand-dark/60 p-3 rounded-xl border border-white/5 text-left">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">Código de Acesso:</span>
                <span className="font-mono font-bold text-brand-gold">{qrPlayer.accessCode}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">Time:</span>
                <span className="font-semibold text-white">{qrPlayer.team}</span>
              </div>
            </div>

            <p className="text-[10px] text-gray-500">
              O jogador pode escanear este QR Code para ser direcionado direto à tela de login.
            </p>
          </div>
        </div>
      )}

      {/* MODAL 6: VIEW PLAYER PROFILE / ALBUM */}
      {viewingPlayerProfile && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-brand-surface border border-white/10 p-6 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto space-y-6 relative text-left">
            <button 
              onClick={() => setViewingPlayerProfile(null)} 
              className="absolute right-4 top-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Profile Header */}
            <div className="flex items-center gap-4 border-b border-white/10 pb-5">
              <img 
                src={viewingPlayerProfile.player.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'} 
                alt={viewingPlayerProfile.player.nickname} 
                className="w-16 h-16 rounded-full object-cover border-2 border-brand-gold"
                referrerPolicy="no-referrer"
              />
              <div>
                <h3 className="font-display text-2xl uppercase tracking-wider text-white">
                  Álbum de {viewingPlayerProfile.player.nickname}
                </h3>
                <p className="text-xs text-gray-400">{viewingPlayerProfile.player.fullName} • {viewingPlayerProfile.player.team}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-[10px] text-brand-gold bg-brand-gold/10 px-2 py-0.5 rounded border border-brand-gold/20">
                    Código: {viewingPlayerProfile.player.accessCode}
                  </span>
                  {viewingPlayerProfile.profile.completedAlbum && (
                    <span className="font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                      🏆 ÁLBUM COMPLETO
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-brand-dark p-3.5 rounded-xl border border-white/5">
                <span className="text-[10px] text-gray-400 uppercase font-mono block">Progresso</span>
                <span className="text-xl font-display text-brand-gold">{viewingPlayerProfile.profile.collectionProgress}%</span>
              </div>
              <div className="bg-brand-dark p-3.5 rounded-xl border border-white/5">
                <span className="text-[10px] text-gray-400 uppercase font-mono block">Inéditas</span>
                <span className="text-xl font-display text-white">{viewingPlayerProfile.profile.uniqueStickers}/{stickers.length}</span>
              </div>
              <div className="bg-brand-dark p-3.5 rounded-xl border border-white/5">
                <span className="text-[10px] text-gray-400 uppercase font-mono block">Repetidas</span>
                <span className="text-xl font-display text-amber-400">{viewingPlayerProfile.profile.repeatedStickers}</span>
              </div>
              <div className="bg-brand-dark p-3.5 rounded-xl border border-white/5">
                <span className="text-[10px] text-gray-400 uppercase font-mono block">Legends</span>
                <span className="text-xl font-display text-sky-400">{viewingPlayerProfile.profile.legendsCount}</span>
              </div>
            </div>

            {/* Collected vs Missing grid */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono font-bold uppercase text-gray-400 tracking-wider">
                Figurinhas da Coleção ({stickers.length} Totais)
              </h4>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {stickers.map(st => {
                  const count = viewingPlayerProfile.profile.collectedCounts[st.id] || 0;
                  const isOwned = count > 0;
                  return (
                    <div 
                      key={st.id} 
                      className={`p-2 rounded-lg border text-center transition-all ${
                        isOwned 
                          ? 'bg-brand-dark border-brand-gold/30 text-white' 
                          : 'bg-black/30 border-white/5 text-gray-600 opacity-60'
                      }`}
                    >
                      <div className="text-[10px] font-mono font-bold">{st.number}</div>
                      <div className="text-[9px] truncate font-semibold">{st.name}</div>
                      {isOwned && (
                        <span className="inline-block mt-1 text-[9px] font-mono bg-brand-gold/20 text-brand-gold px-1.5 py-0.2 rounded">
                          x{count}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
