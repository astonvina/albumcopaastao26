import React, { useState, useEffect } from 'react';
import { Gift, Save, CheckCircle, RefreshCw, Plus, Trash2, Edit2, Sparkles, Image as ImageIcon, Eye, Palette, Layers, Award } from 'lucide-react';
import { useSystemSettings, DEFAULT_REWARDS_BANNER_CONFIG } from '../context/SystemSettingsContext';
import { RewardsBannerSettings, RewardsBannerItem, Prize } from '../types';
import ImageUploader from './ImageUploader';
import { getPrizesFromSupabase } from '../lib/supabaseData';

export default function RewardsBannerAdminTab() {
  const { settings, updateSettings } = useSystemSettings();
  const [config, setConfig] = useState<RewardsBannerSettings>(
    settings.rewardsBannerConfig || DEFAULT_REWARDS_BANNER_CONFIG
  );
  
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // System Prizes list for reference
  const [systemPrizes, setSystemPrizes] = useState<Prize[]>([]);

  // Item form modal state
  const [newItem, setNewItem] = useState<{ icon: string; title: string; subtitle: string }>({
    icon: '🎁',
    title: '',
    subtitle: ''
  });
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  useEffect(() => {
    if (settings.rewardsBannerConfig) {
      setConfig({
        ...DEFAULT_REWARDS_BANNER_CONFIG,
        ...settings.rewardsBannerConfig,
        colors: {
          ...DEFAULT_REWARDS_BANNER_CONFIG.colors,
          ...(settings.rewardsBannerConfig.colors || {})
        },
        featuredItems: settings.rewardsBannerConfig.featuredItems?.length
          ? settings.rewardsBannerConfig.featuredItems
          : DEFAULT_REWARDS_BANNER_CONFIG.featuredItems
      });
    }
  }, [settings.rewardsBannerConfig]);

  useEffect(() => {
    getPrizesFromSupabase()
      .then((prizes) => {
        setSystemPrizes(prizes);
      })
      .catch((err) => console.error('Erro ao carregar prêmios:', err));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const ok = await updateSettings({ rewardsBannerConfig: config });
      if (ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setSaveError('Erro ao salvar as configurações no servidor.');
      }
    } catch (err: any) {
      setSaveError(err.message || 'Erro inesperado ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddItem = () => {
    if (!newItem.title.trim()) return;

    if (editingItemId) {
      setConfig((prev) => ({
        ...prev,
        featuredItems: prev.featuredItems.map((item) =>
          item.id === editingItemId
            ? { ...item, icon: newItem.icon || '🎁', title: newItem.title.trim(), subtitle: newItem.subtitle.trim() }
            : item
        )
      }));
      setEditingItemId(null);
    } else {
      const item: RewardsBannerItem = {
        id: 'item-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        icon: newItem.icon || '🎁',
        title: newItem.title.trim(),
        subtitle: newItem.subtitle.trim()
      };
      setConfig((prev) => ({
        ...prev,
        featuredItems: [...prev.featuredItems, item]
      }));
    }

    setNewItem({ icon: '🎁', title: '', subtitle: '' });
  };

  const handleEditItem = (item: RewardsBannerItem) => {
    setEditingItemId(item.id);
    setNewItem({
      icon: item.icon || '🎁',
      title: item.title,
      subtitle: item.subtitle || ''
    });
  };

  const handleDeleteItem = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      featuredItems: prev.featuredItems.filter((i) => i.id !== id)
    }));
  };

  const handleResetDefaults = () => {
    if (confirm('Deseja restaurar as configurações padrão do Banner de Premiações?')) {
      setConfig(DEFAULT_REWARDS_BANNER_CONFIG);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12" id="rewards-banner-admin">
      
      {/* Header Banner Admin */}
      <div className="bg-gradient-to-r from-neutral-900 via-brand-surface to-neutral-900 border border-brand-gold/20 p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-brand-gold-glow block font-bold">
              PAINEL ADMINISTRATIVO
            </span>
            <h2 className="font-display text-2xl uppercase tracking-wider text-white">
              🎁 Banner de Premiações
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Personalize o banner em destaque da página inicial para incentivar a conclusão do álbum.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3.5 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs uppercase rounded-xl border border-white/10 flex items-center justify-center gap-1.5 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Restaurar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 sm:flex-none px-6 py-2.5 bg-brand-gold hover:bg-yellow-500 text-black font-display font-extrabold uppercase text-xs rounded-xl shadow-lg shadow-amber-950/40 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvar Alterações
              </>
            )}
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-xs font-bold flex items-center gap-2 shadow-lg animate-fade-in">
          <CheckCircle className="w-5 h-5 shrink-0 text-emerald-400" />
          Configurações do Banner de Premiações atualizadas com sucesso! As alterações já estão visíveis no site.
        </div>
      )}

      {saveError && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-xs font-bold flex items-center gap-2 shadow-lg">
          <span className="shrink-0 font-mono">⚠️</span>
          {saveError}
        </div>
      )}

      {/* LIVE PREVIEW BOX */}
      <div className="bg-brand-surface border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-brand-gold-glow" />
            <h3 className="font-display text-sm uppercase tracking-wider text-white">
              Pré-Visualização em Tempo Real (Página Inicial)
            </h3>
          </div>
          <span className={`text-[10px] font-mono px-2.5 py-1 rounded-full border ${
            config.enabled ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'
          }`}>
            {config.enabled ? '• Banner Ativo' : '• Banner Desativado'}
          </span>
        </div>

        {/* Render Preview Card */}
        <div 
          className="relative overflow-hidden rounded-2xl p-6 sm:p-8 shadow-2xl transition-all border"
          style={{
            backgroundColor: config.colors?.backgroundColor || '#121212',
            borderColor: config.colors?.borderGlowColor || '#E5B80B',
            backgroundImage: config.backgroundImageUrl ? `url(${config.backgroundImageUrl})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {/* Overlay */}
          <div 
            className="absolute inset-0 pointer-events-none" 
            style={{ backgroundColor: config.colors?.overlayColor || 'rgba(0,0,0,0.7)' }} 
          />

          <div className="relative z-10 space-y-6 text-center">
            {/* Header Title & Subtitle */}
            <div className="max-w-2xl mx-auto space-y-2">
              <h3 
                className="font-display text-2xl sm:text-3xl uppercase tracking-wider font-black drop-shadow-md"
                style={{ color: config.colors?.titleColor || '#FECF2E' }}
              >
                {config.title || '🏆 COMPLETE O ÁLBUM E CONCORRA A PRÊMIOS!'}
              </h3>
              <p 
                className="text-xs sm:text-sm font-medium leading-relaxed"
                style={{ color: config.colors?.subtitleColor || '#E2E8F0' }}
              >
                {config.subtitle || 'Colecione todas as figurinhas, suba no ranking e desbloqueie recompensas exclusivas.'}
              </p>
            </div>

            {/* Featured Prizes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto text-center">
              {config.useSystemPrizes && systemPrizes.length > 0 ? (
                systemPrizes.map((p) => (
                  <div
                    key={p.id}
                    className="p-6 sm:p-7 rounded-3xl border-2 flex flex-col items-center text-center gap-3 shadow-xl backdrop-blur-md transition-all hover:border-amber-400 hover:scale-[1.02] duration-300"
                    style={{
                      backgroundColor: config.colors?.cardBackgroundColor || 'rgba(18, 18, 18, 0.85)',
                      borderColor: 'rgba(251, 191, 36, 0.4)'
                    }}
                  >
                    {p.imageUrl ? (
                      <div className="w-36 h-36 sm:w-40 sm:h-40 rounded-2xl bg-black/60 overflow-hidden shrink-0 border-2 border-amber-400/80 p-2.5 flex items-center justify-center shadow-lg shadow-amber-500/20">
                        <img src={p.imageUrl} alt={p.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                      </div>
                    ) : (
                      <div className="w-36 h-36 sm:w-40 sm:h-40 bg-gradient-to-br from-amber-500/30 via-yellow-500/20 to-amber-700/30 text-amber-300 rounded-2xl flex items-center justify-center text-5xl shrink-0 border-2 border-amber-400/80 shadow-lg shadow-amber-500/20">
                        🏆
                      </div>
                    )}
                    <h4 className="font-display text-lg sm:text-xl font-bold text-white uppercase tracking-wide my-1 whitespace-normal text-center">{p.name}</h4>
                    <div className="w-full bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-lg py-2 px-3 flex items-center justify-center gap-2 text-xs font-semibold whitespace-normal text-center break-words shadow-sm">
                      <Award className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="whitespace-normal text-center break-words uppercase font-bold">{p.deliveryCriteria || p.description || 'Sorteio ao completar o álbum'}</span>
                    </div>
                  </div>
                ))
              ) : (
                config.featuredItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-6 sm:p-7 rounded-3xl border-2 flex flex-col items-center text-center gap-3 shadow-xl backdrop-blur-md transition-all hover:border-amber-400 hover:scale-[1.02] duration-300"
                    style={{
                      backgroundColor: config.colors?.cardBackgroundColor || 'rgba(18, 18, 18, 0.85)',
                      borderColor: 'rgba(251, 191, 36, 0.4)'
                    }}
                  >
                    <div className="w-36 h-36 sm:w-40 sm:h-40 bg-gradient-to-br from-amber-500/30 via-yellow-500/20 to-amber-700/30 text-5xl rounded-2xl flex items-center justify-center shrink-0 border-2 border-amber-400/80 shadow-lg shadow-amber-500/20">
                      {item.icon || '🏆'}
                    </div>
                    <h4 className="font-display text-lg sm:text-xl font-bold text-white uppercase tracking-wide my-1 whitespace-normal text-center">{item.title}</h4>
                    {item.subtitle && (
                      <div className="w-full bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-lg py-2 px-3 flex items-center justify-center gap-2 text-xs font-semibold whitespace-normal text-center break-words shadow-sm">
                        <Award className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="whitespace-normal text-center break-words uppercase font-bold">{item.subtitle}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Buttons Row */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                className="w-full sm:w-auto px-6 py-3 font-display font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-transform"
                style={{
                  backgroundColor: config.colors?.primaryButtonColor || '#0099D6',
                  color: config.colors?.primaryButtonTextColor || '#FFFFFF'
                }}
              >
                {config.primaryButtonText || '🖼️ Abrir Meu Álbum'}
              </button>
              <button
                type="button"
                className="w-full sm:w-auto px-6 py-3 font-display font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-transform"
                style={{
                  backgroundColor: config.colors?.secondaryButtonColor || '#E5B80B',
                  color: config.colors?.secondaryButtonTextColor || '#000000'
                }}
              >
                {config.secondaryButtonText || '🏅 Ver Premiações'}
              </button>
            </div>

            {/* Info Message */}
            <p className="text-[11px] text-gray-300 font-medium italic max-w-xl mx-auto pt-1">
              "{config.infoMessage || 'Quanto mais próximo de completar o álbum, maiores são suas chances de conquistar as premiações.'}"
            </p>
          </div>
        </div>
      </div>

      {/* FORM SETTINGS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT COLUMN: GENERAL & TEXTS */}
        <div className="space-y-6">
          
          {/* Activation Switch */}
          <div className="bg-brand-surface border border-white/10 p-6 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-sm uppercase text-white tracking-wider">
                  Status do Banner
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Ative ou desative a exibição do banner na página inicial.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) => setConfig((prev) => ({ ...prev, enabled: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
          </div>

          {/* Texts Section */}
          <div className="bg-brand-surface border border-white/10 p-6 rounded-3xl space-y-4">
            <h3 className="font-display text-sm uppercase text-white tracking-wider border-b border-white/10 pb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-gold-glow" />
              Textos e Conteúdo
            </h3>

            <div>
              <label className="text-xs text-gray-400 font-semibold uppercase block mb-1">
                Título Principal
              </label>
              <input
                type="text"
                value={config.title}
                onChange={(e) => setConfig((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: 🏆 COMPLETE O ÁLBUM E CONCORRA A PRÊMIOS!"
                className="w-full px-3.5 py-2.5 bg-brand-dark border border-white/10 rounded-xl text-white text-xs font-semibold focus:border-brand-gold outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 font-semibold uppercase block mb-1">
                Subtítulo Informativo
              </label>
              <textarea
                value={config.subtitle}
                onChange={(e) => setConfig((prev) => ({ ...prev, subtitle: e.target.value }))}
                rows={2}
                placeholder="Ex: Colecione todas as figurinhas, suba no ranking..."
                className="w-full px-3.5 py-2.5 bg-brand-dark border border-white/10 rounded-xl text-white text-xs leading-relaxed focus:border-brand-gold outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 font-semibold uppercase block mb-1">
                Mensagem de Incentivo Rodapé
              </label>
              <input
                type="text"
                value={config.infoMessage}
                onChange={(e) => setConfig((prev) => ({ ...prev, infoMessage: e.target.value }))}
                placeholder="Ex: Quanto mais próximo de completar o álbum..."
                className="w-full px-3.5 py-2.5 bg-brand-dark border border-white/10 rounded-xl text-white text-xs focus:border-brand-gold outline-none"
              />
            </div>
          </div>

          {/* Buttons Configuration */}
          <div className="bg-brand-surface border border-white/10 p-6 rounded-3xl space-y-4">
            <h3 className="font-display text-sm uppercase text-white tracking-wider border-b border-white/10 pb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-blue-glow" />
              Botões de Ação
            </h3>

            {/* Primary Button */}
            <div className="p-4 bg-brand-dark/60 rounded-2xl border border-white/5 space-y-3">
              <span className="text-[10px] font-mono text-brand-blue-glow font-bold uppercase tracking-wider block">
                Botão Principal (Destaque)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-400 font-semibold uppercase block mb-1">Texto do Botão</label>
                  <input
                    type="text"
                    value={config.primaryButtonText}
                    onChange={(e) => setConfig((prev) => ({ ...prev, primaryButtonText: e.target.value }))}
                    className="w-full px-3 py-2 bg-brand-dark border border-white/10 rounded-lg text-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 font-semibold uppercase block mb-1">Ação ao Clicar</label>
                  <select
                    value={config.primaryButtonAction}
                    onChange={(e) => setConfig((prev) => ({ ...prev, primaryButtonAction: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-brand-dark border border-white/10 rounded-lg text-white text-xs"
                  >
                    <option value="album">Abrir Álbum</option>
                    <option value="open_pack">Abrir Pacote</option>
                    <option value="ranking">Ver Ranking</option>
                    <option value="login">Ir para Login</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Secondary Button */}
            <div className="p-4 bg-brand-dark/60 rounded-2xl border border-white/5 space-y-3">
              <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider block">
                Botão Secundário
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-400 font-semibold uppercase block mb-1">Texto do Botão</label>
                  <input
                    type="text"
                    value={config.secondaryButtonText}
                    onChange={(e) => setConfig((prev) => ({ ...prev, secondaryButtonText: e.target.value }))}
                    className="w-full px-3 py-2 bg-brand-dark border border-white/10 rounded-lg text-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 font-semibold uppercase block mb-1">Ação ao Clicar</label>
                  <select
                    value={config.secondaryButtonAction}
                    onChange={(e) => setConfig((prev) => ({ ...prev, secondaryButtonAction: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-brand-dark border border-white/10 rounded-lg text-white text-xs"
                  >
                    <option value="prizes_modal">Abrir Modal de Premiações</option>
                    <option value="ranking">Ir para o Ranking</option>
                    <option value="album">Abrir Álbum</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: PRIZES HIGHLIGHTS & COLORS */}
        <div className="space-y-6">
          
          {/* Featured Prizes Configuration */}
          <div className="bg-brand-surface border border-white/10 p-6 rounded-3xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-display text-sm uppercase text-white tracking-wider flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                Destaque de Prêmios
              </h3>
              <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
                <input
                  type="checkbox"
                  checked={config.useSystemPrizes}
                  onChange={(e) => setConfig((prev) => ({ ...prev, useSystemPrizes: e.target.checked }))}
                  className="rounded border-white/20 bg-brand-dark text-amber-500 focus:ring-amber-500"
                />
                Usar Prêmios Cadastrados ({systemPrizes.length})
              </label>
            </div>

            {config.useSystemPrizes ? (
              <div className="p-3 bg-brand-dark/60 rounded-xl border border-white/5 space-y-2">
                <p className="text-xs text-gray-300">
                  O banner está configurado para carregar dinamicamente os prêmios cadastrados na aba <strong>Premiações</strong> do painel admin.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {systemPrizes.map((p) => (
                    <span key={p.id} className="text-[10px] bg-white/10 text-amber-300 px-2.5 py-1 rounded-lg border border-white/10 font-bold">
                      🏆 {p.name}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-gray-400">
                  Gerencie os quadros de destaque exibidos no banner:
                </p>

                {/* Add/Edit Custom Item Form */}
                <div className="p-3.5 bg-brand-dark/80 rounded-2xl border border-white/10 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Ícone / Emoji</label>
                      <input
                        type="text"
                        value={newItem.icon}
                        onChange={(e) => setNewItem((prev) => ({ ...prev, icon: e.target.value }))}
                        placeholder="⚽ ou 👕"
                        className="w-full px-2.5 py-1.5 bg-brand-dark border border-white/10 rounded-lg text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Título do Prêmio</label>
                      <input
                        type="text"
                        value={newItem.title}
                        onChange={(e) => setNewItem((prev) => ({ ...prev, title: e.target.value }))}
                        placeholder="1 Mês de Futebol Grátis"
                        className="w-full px-2.5 py-1.5 bg-brand-dark border border-white/10 rounded-lg text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Subtítulo / Categoria</label>
                      <input
                        type="text"
                        value={newItem.subtitle}
                        onChange={(e) => setNewItem((prev) => ({ ...prev, subtitle: e.target.value }))}
                        placeholder="1º Lugar Geral"
                        className="w-full px-2.5 py-1.5 bg-brand-dark border border-white/10 rounded-lg text-white text-xs"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddItem}
                    disabled={!newItem.title.trim()}
                    className="w-full py-2 bg-brand-gold hover:bg-yellow-500 text-black font-bold uppercase text-xs rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    {editingItemId ? 'Atualizar Item de Prêmio' : 'Adicionar Item ao Banner'}
                  </button>
                </div>

                {/* Custom Items List */}
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {config.featuredItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-brand-dark rounded-xl border border-white/5 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <span className="text-lg bg-white/5 p-1.5 rounded-lg shrink-0">{item.icon}</span>
                        <div className="overflow-hidden">
                          <h4 className="text-xs font-bold text-white uppercase truncate">{item.title}</h4>
                          {item.subtitle && <p className="text-[10px] text-gray-400 truncate">{item.subtitle}</p>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleEditItem(item)}
                          className="p-1.5 text-gray-400 hover:text-white"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1.5 text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Background Image Upload */}
          <div className="bg-brand-surface border border-white/10 p-6 rounded-3xl space-y-4">
            <h3 className="font-display text-sm uppercase text-white tracking-wider border-b border-white/10 pb-3 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-brand-gold-glow" />
              Imagem de Fundo do Banner
            </h3>

            <ImageUploader
              label="Upload de Imagem de Fundo"
              bucket="banner"
              currentUrl={config.backgroundImageUrl}
              onUploadSuccess={(url) => setConfig((prev) => ({ ...prev, backgroundImageUrl: url }))}
              onDeleteSuccess={() => setConfig((prev) => ({ ...prev, backgroundImageUrl: '' }))}
            />
          </div>

          {/* Color Customization */}
          <div className="bg-brand-surface border border-white/10 p-6 rounded-3xl space-y-4">
            <h3 className="font-display text-sm uppercase text-white tracking-wider border-b border-white/10 pb-3 flex items-center gap-2">
              <Palette className="w-4 h-4 text-purple-400" />
              Cores e Tema
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Cor do Título</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.colors?.titleColor || '#FECF2E'}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        colors: { ...prev.colors, titleColor: e.target.value }
                      }))
                    }
                    className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer"
                  />
                  <span className="font-mono text-[11px] text-gray-300">{config.colors?.titleColor || '#FECF2E'}</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Cor do Subtítulo</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.colors?.subtitleColor || '#E2E8F0'}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        colors: { ...prev.colors, subtitleColor: e.target.value }
                      }))
                    }
                    className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer"
                  />
                  <span className="font-mono text-[11px] text-gray-300">{config.colors?.subtitleColor || '#E2E8F0'}</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Borda/Brilho</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.colors?.borderGlowColor || '#E5B80B'}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        colors: { ...prev.colors, borderGlowColor: e.target.value }
                      }))
                    }
                    className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer"
                  />
                  <span className="font-mono text-[11px] text-gray-300">{config.colors?.borderGlowColor || '#E5B80B'}</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Botão Principal</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.colors?.primaryButtonColor || '#0099D6'}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        colors: { ...prev.colors, primaryButtonColor: e.target.value }
                      }))
                    }
                    className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer"
                  />
                  <span className="font-mono text-[11px] text-gray-300">{config.colors?.primaryButtonColor || '#0099D6'}</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Botão Secundário</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.colors?.secondaryButtonColor || '#E5B80B'}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        colors: { ...prev.colors, secondaryButtonColor: e.target.value }
                      }))
                    }
                    className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer"
                  />
                  <span className="font-mono text-[11px] text-gray-300">{config.colors?.secondaryButtonColor || '#E5B80B'}</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Fundo do Card</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.colors?.backgroundColor || '#121212'}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        colors: { ...prev.colors, backgroundColor: e.target.value }
                      }))
                    }
                    className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer"
                  />
                  <span className="font-mono text-[11px] text-gray-300">{config.colors?.backgroundColor || '#121212'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
