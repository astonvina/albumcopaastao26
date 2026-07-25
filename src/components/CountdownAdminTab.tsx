import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Eye, 
  EyeOff, 
  Calendar, 
  Sparkles, 
  Palette, 
  Image as ImageIcon, 
  Save, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink, 
  Layers, 
  Globe, 
  Type, 
  Tag, 
  MousePointer, 
  Trash2,
  Hourglass,
  Layout,
  MessageSquare
} from 'lucide-react';
import { useSystemSettings, DEFAULT_COUNTDOWN_CONFIG } from '../context/SystemSettingsContext';
import { CountdownSettings } from '../types';
import ImageUploader from './ImageUploader';

const COMMON_TIMEZONES = [
  { value: 'America/Sao_Paulo', label: 'America/Sao_Paulo (Brasília / SP / RJ / Sul)' },
  { value: 'America/Manaus', label: 'America/Manaus (AM / RR)' },
  { value: 'America/Belem', label: 'America/Belem (PA / AP / MA)' },
  { value: 'America/Recife', label: 'America/Recife (NE / PE / BA)' },
  { value: 'America/Cuiaba', label: 'America/Cuiaba (MT / MS)' },
  { value: 'America/Noronha', label: 'America/Noronha (F. de Noronha)' },
  { value: 'UTC', label: 'UTC (Tempo Universal)' }
];

export default function CountdownAdminTab() {
  const { settings, updateSettings } = useSystemSettings();
  const currentConfig: CountdownSettings = settings.countdownConfig || DEFAULT_COUNTDOWN_CONFIG;

  const [form, setForm] = useState<CountdownSettings>(currentConfig);
  const [datePart, setDatePart] = useState('2026-11-01');
  const [timePart, setTimePart] = useState('08:00');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState('');

  // Synchronize initial date & time input values from eventDate
  useEffect(() => {
    if (currentConfig.eventDate) {
      try {
        const d = new Date(currentConfig.eventDate);
        if (!isNaN(d.getTime())) {
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const hours = String(d.getHours()).padStart(2, '0');
          const minutes = String(d.getMinutes()).padStart(2, '0');
          setDatePart(`${year}-${month}-${day}`);
          setTimePart(`${hours}:${minutes}`);
        }
      } catch (err) {
        console.error('Date parse error:', err);
      }
    }
    setForm(currentConfig);
  }, [settings.countdownConfig]);

  // Update form.eventDate when datePart or timePart changes
  const handleDateTimeChange = (newDate: string, newTime: string) => {
    setDatePart(newDate);
    setTimePart(newTime);
    try {
      const [year, month, day] = newDate.split('-').map(Number);
      const [hours, minutes] = newTime.split(':').map(Number);
      const d = new Date(year, month - 1, day, hours, minutes);
      setForm(prev => ({
        ...prev,
        eventDate: d.toISOString()
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus('saving');
    setStatusMsg('');

    try {
      const success = await updateSettings({
        countdownDate: form.eventDate,
        countdownConfig: form
      });

      if (success) {
        setSaveStatus('success');
        setStatusMsg('Configurações salvas e aplicadas na tela inicial!');
        setTimeout(() => setSaveStatus('idle'), 4000);
      } else {
        setSaveStatus('error');
        setStatusMsg('Falha ao salvar as configurações. Tente novamente.');
      }
    } catch (err: any) {
      setSaveStatus('error');
      setStatusMsg('Erro de conexão: ' + err.message);
    }
  };

  // Format date preview in PT-BR
  const getFormattedDatePreview = () => {
    try {
      if (!datePart || !timePart) return '';
      const [y, m, d] = datePart.split('-');
      return `${d}/${m}/${y} às ${timePart} (${form.timezone || 'America/Sao_Paulo'})`;
    } catch {
      return form.eventDate;
    }
  };

  return (
    <div className="space-y-8" id="countdown-admin-panel">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 border border-white/10 p-6 sm:p-8 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="holo-shine" />
        <div className="flex items-center gap-4 z-10">
          <div className="w-14 h-14 bg-brand-gold/10 border border-brand-gold/30 text-brand-gold-glow rounded-2xl flex items-center justify-center shadow-inner">
            <Clock className="w-7 h-7" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-brand-gold/10 border border-brand-gold/20 text-brand-gold-glow rounded-full text-[10px] font-mono uppercase tracking-widest mb-1">
              <Sparkles className="w-3 h-3" />
              CONFIGURAÇÃO DINÂMICA
            </div>
            <h1 className="font-display text-2xl sm:text-3xl uppercase tracking-wider text-white">
              Contagem Regressiva / Evento Principal
            </h1>
            <p className="text-xs text-gray-400 mt-1 max-w-xl">
              Controle total da seção de evento na tela inicial. Altere datas, modos de exibição, cores, botões e imagens sem editar código.
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saveStatus === 'saving'}
          className="px-6 py-3.5 bg-brand-gold hover:bg-yellow-400 text-black font-display font-black uppercase tracking-wider text-xs rounded-xl shadow-xl shadow-amber-500/20 flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-50 z-10 shrink-0"
        >
          {saveStatus === 'saving' ? (
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

      {/* Save status notification bar */}
      {saveStatus === 'success' && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-emerald-400 text-xs font-bold">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {saveStatus === 'error' && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-400 text-xs font-bold">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: CONFIGURATION CONTROLS */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* 1. VISIBILIDADE E MODOS DE EXIBIÇÃO */}
          <div className="bg-brand-surface border border-white/10 p-6 rounded-3xl space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <Layout className="w-5 h-5 text-brand-gold-glow" />
                <h2 className="font-display text-lg uppercase tracking-wider text-white">
                  1. Modos de Exibição
                </h2>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.showCountdown}
                  onChange={(e) => setForm(prev => ({ ...prev, showCountdown: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                <span className="ml-2.5 text-xs font-bold text-gray-300 uppercase">
                  {form.showCountdown ? 'Ativado' : 'Desativado'}
                </span>
              </label>
            </div>

            <p className="text-xs text-gray-400">
              Selecione como deseja apresentar a seção na tela inicial. Quando oculto, o layout se reorganiza automaticamente.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Mode 1 */}
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, mode: 'countdown', showCountdown: true }))}
                className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  form.mode === 'countdown' && form.showCountdown
                    ? 'bg-brand-blue/15 border-brand-blue text-white shadow-lg shadow-sky-950/40'
                    : 'bg-brand-dark/60 border-white/5 text-gray-400 hover:border-white/20'
                }`}
              >
                <div>
                  <div className="w-8 h-8 rounded-xl bg-brand-blue/20 text-brand-blue-glow flex items-center justify-center mb-3">
                    <Hourglass className="w-4 h-4" />
                  </div>
                  <h3 className="font-display text-xs uppercase font-bold text-white">
                    Modo 1: Contagem
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-1 leading-snug">
                    Exibe os contadores em tempo real de Dias, Horas, Minutos e Segundos.
                  </p>
                </div>
                <span className="mt-3 text-[10px] font-mono font-bold text-brand-blue-glow uppercase block">
                  {form.mode === 'countdown' && form.showCountdown ? '✓ Selecionado' : 'Selecionar'}
                </span>
              </button>

              {/* Mode 2 */}
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, mode: 'banner', showCountdown: true }))}
                className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  form.mode === 'banner' && form.showCountdown
                    ? 'bg-amber-500/15 border-amber-400 text-white shadow-lg shadow-amber-950/40'
                    : 'bg-brand-dark/60 border-white/5 text-gray-400 hover:border-white/20'
                }`}
              >
                <div>
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <h3 className="font-display text-xs uppercase font-bold text-white">
                    Modo 2: Banner
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-1 leading-snug">
                    Oculta os números e exibe como banner informativo com Imagem, Título e Botão.
                  </p>
                </div>
                <span className="mt-3 text-[10px] font-mono font-bold text-amber-400 uppercase block">
                  {form.mode === 'banner' && form.showCountdown ? '✓ Selecionado' : 'Selecionar'}
                </span>
              </button>

              {/* Mode 3 */}
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, mode: 'hidden', showCountdown: false }))}
                className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  form.mode === 'hidden' || !form.showCountdown
                    ? 'bg-red-500/15 border-red-500 text-white shadow-lg shadow-red-950/40'
                    : 'bg-brand-dark/60 border-white/5 text-gray-400 hover:border-white/20'
                }`}
              >
                <div>
                  <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center mb-3">
                    <EyeOff className="w-4 h-4" />
                  </div>
                  <h3 className="font-display text-xs uppercase font-bold text-white">
                    Modo 3: Oculto
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-1 leading-snug">
                    Oculta a seção completamente. A página inicial elimina o espaço vazio.
                  </p>
                </div>
                <span className="mt-3 text-[10px] font-mono font-bold text-red-400 uppercase block">
                  {form.mode === 'hidden' || !form.showCountdown ? '✓ Selecionado' : 'Selecionar'}
                </span>
              </button>
            </div>
          </div>

          {/* 2. DATA, HORA E FUSO HORÁRIO */}
          <div className="bg-brand-surface border border-white/10 p-6 rounded-3xl space-y-4 shadow-xl">
            <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
              <Calendar className="w-5 h-5 text-brand-blue-glow" />
              <h2 className="font-display text-lg uppercase tracking-wider text-white">
                2. Data e Hora do Evento
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold uppercase flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-brand-gold-glow" />
                  Data
                </label>
                <input
                  type="date"
                  value={datePart}
                  onChange={(e) => handleDateTimeChange(e.target.value, timePart)}
                  className="w-full px-3.5 py-2.5 bg-brand-dark border border-white/10 rounded-xl text-white text-xs font-mono focus:border-brand-gold focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold uppercase flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-brand-gold-glow" />
                  Hora
                </label>
                <input
                  type="time"
                  value={timePart}
                  onChange={(e) => handleDateTimeChange(datePart, e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-brand-dark border border-white/10 rounded-xl text-white text-xs font-mono focus:border-brand-gold focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold uppercase flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-brand-gold-glow" />
                  Fuso Horário
                </label>
                <select
                  value={form.timezone}
                  onChange={(e) => setForm(prev => ({ ...prev, timezone: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-brand-dark border border-white/10 rounded-xl text-white text-xs focus:border-brand-gold focus:outline-none"
                >
                  {COMMON_TIMEZONES.map(tz => (
                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-3 bg-brand-dark/80 border border-white/5 rounded-xl text-xs text-gray-300 flex items-center justify-between font-mono">
              <span className="text-gray-400">Data e Hora Calculadas:</span>
              <strong className="text-brand-gold-glow">{getFormattedDatePreview()}</strong>
            </div>
          </div>

          {/* 3. TÍTULO E SUBTÍTULO */}
          <div className="bg-brand-surface border border-white/10 p-6 rounded-3xl space-y-4 shadow-xl">
            <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
              <Type className="w-5 h-5 text-amber-400" />
              <h2 className="font-display text-lg uppercase tracking-wider text-white">
                3. Título e Subtítulo
              </h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold uppercase">
                  Título da Seção
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: Grande Evento, Copa Astão 2026, Lançamento do Álbum"
                  className="w-full px-4 py-2.5 bg-brand-dark border border-white/10 rounded-xl text-white text-xs focus:border-brand-gold focus:outline-none"
                />
                <p className="text-[10px] text-gray-500">
                  Exemplos: "Grande Evento", "Copa Astão 2026", "Grande Final", "Início da Copa", "Álbum Oficial", "Lançamento do Álbum"
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold uppercase">
                  Subtítulo / Descrição
                </label>
                <textarea
                  value={form.subtitle}
                  onChange={(e) => setForm(prev => ({ ...prev, subtitle: e.target.value }))}
                  placeholder="Ex: A contagem regressiva começou. Prepare-se para o maior campeonato!"
                  className="w-full px-4 py-2.5 bg-brand-dark border border-white/10 rounded-xl text-white text-xs h-20 focus:border-brand-gold focus:outline-none resize-none"
                />
              </div>
            </div>
          </div>

          {/* 4. CONFIGURAÇÃO DO BOTÃO */}
          <div className="bg-brand-surface border border-white/10 p-6 rounded-3xl space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <MousePointer className="w-5 h-5 text-sky-400" />
                <h2 className="font-display text-lg uppercase tracking-wider text-white">
                  4. Botão de Ação
                </h2>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.showButton}
                  onChange={(e) => setForm(prev => ({ ...prev, showButton: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500"></div>
                <span className="ml-2 text-xs font-bold text-gray-300 uppercase">
                  {form.showButton ? 'Exibir Botão' : 'Ocultar Botão'}
                </span>
              </label>
            </div>

            {form.showButton && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-semibold uppercase">
                    Texto do Botão
                  </label>
                  <input
                    type="text"
                    value={form.buttonText}
                    onChange={(e) => setForm(prev => ({ ...prev, buttonText: e.target.value }))}
                    placeholder="Ex: Ver Ranking, Abrir Álbum, Entrar, Saiba Mais"
                    className="w-full px-3.5 py-2.5 bg-brand-dark border border-white/10 rounded-xl text-white text-xs focus:border-brand-gold focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-semibold uppercase">
                    Destino do Botão
                  </label>
                  <select
                    value={form.buttonAction}
                    onChange={(e) => setForm(prev => ({ ...prev, buttonAction: e.target.value as any }))}
                    className="w-full px-3.5 py-2.5 bg-brand-dark border border-white/10 rounded-xl text-white text-xs focus:border-brand-gold focus:outline-none"
                  >
                    <option value="album">Abrir Álbum Digital</option>
                    <option value="ranking">Ver Ranking Global</option>
                    <option value="login">Entrar no Sistema</option>
                    <option value="open_pack">Abrir Pacotes</option>
                    <option value="external_url">Link / URL Externa</option>
                  </select>
                </div>

                {form.buttonAction === 'external_url' && (
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs text-gray-400 font-semibold uppercase">
                      URL Externa de Destino
                    </label>
                    <input
                      type="url"
                      value={form.buttonUrl || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, buttonUrl: e.target.value }))}
                      placeholder="https://exemplo.com/saiba-mais"
                      className="w-full px-3.5 py-2.5 bg-brand-dark border border-white/10 rounded-xl text-white text-xs focus:border-brand-gold focus:outline-none"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 5. IMAGEM DE FUNDO DA SEÇÃO */}
          <div className="bg-brand-surface border border-white/10 p-6 rounded-3xl space-y-4 shadow-xl">
            <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
              <ImageIcon className="w-5 h-5 text-emerald-400" />
              <h2 className="font-display text-lg uppercase tracking-wider text-white">
                5. Imagem de Fundo da Seção
              </h2>
            </div>

            <ImageUploader
              label="Enviar Imagem de Fundo da Contagem"
              bucket="countdown"
              currentUrl={form.backgroundImageUrl}
              onUploadSuccess={(url) => setForm(prev => ({ ...prev, backgroundImageUrl: url }))}
            />

            {form.backgroundImageUrl && (
              <div className="flex items-center justify-between p-3 bg-brand-dark border border-white/10 rounded-xl text-xs">
                <div className="flex items-center gap-3">
                  <img src={form.backgroundImageUrl} alt="Background" className="w-10 h-10 object-cover rounded-lg border border-white/10" />
                  <span className="text-gray-300 font-mono truncate max-w-xs">{form.backgroundImageUrl}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, backgroundImageUrl: '' }))}
                  className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-bold rounded-lg flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remover
                </button>
              </div>
            )}
          </div>

          {/* 6. CORES PERSONALIZADAS */}
          <div className="bg-brand-surface border border-white/10 p-6 rounded-3xl space-y-4 shadow-xl">
            <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
              <Palette className="w-5 h-5 text-purple-400" />
              <h2 className="font-display text-lg uppercase tracking-wider text-white">
                6. Personalização de Cores
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] text-gray-400 font-semibold uppercase block">
                  Cor do Título
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.colors?.titleColor || '#FFFFFF'}
                    onChange={(e) => setForm(prev => ({ ...prev, colors: { ...prev.colors, titleColor: e.target.value } }))}
                    className="w-9 h-9 rounded-lg bg-transparent border border-white/20 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={form.colors?.titleColor || '#FFFFFF'}
                    onChange={(e) => setForm(prev => ({ ...prev, colors: { ...prev.colors, titleColor: e.target.value } }))}
                    className="w-full px-2 py-1.5 bg-brand-dark border border-white/10 rounded-lg text-white font-mono text-xs uppercase"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-gray-400 font-semibold uppercase block">
                  Cor da Contagem
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.colors?.countdownColor || '#FECF2E'}
                    onChange={(e) => setForm(prev => ({ ...prev, colors: { ...prev.colors, countdownColor: e.target.value } }))}
                    className="w-9 h-9 rounded-lg bg-transparent border border-white/20 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={form.colors?.countdownColor || '#FECF2E'}
                    onChange={(e) => setForm(prev => ({ ...prev, colors: { ...prev.colors, countdownColor: e.target.value } }))}
                    className="w-full px-2 py-1.5 bg-brand-dark border border-white/10 rounded-lg text-white font-mono text-xs uppercase"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-gray-400 font-semibold uppercase block">
                  Cor do Botão
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.colors?.buttonColor || '#0099D6'}
                    onChange={(e) => setForm(prev => ({ ...prev, colors: { ...prev.colors, buttonColor: e.target.value } }))}
                    className="w-9 h-9 rounded-lg bg-transparent border border-white/20 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={form.colors?.buttonColor || '#0099D6'}
                    onChange={(e) => setForm(prev => ({ ...prev, colors: { ...prev.colors, buttonColor: e.target.value } }))}
                    className="w-full px-2 py-1.5 bg-brand-dark border border-white/10 rounded-lg text-white font-mono text-xs uppercase"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-gray-400 font-semibold uppercase block">
                  Texto do Botão
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.colors?.buttonTextColor || '#FFFFFF'}
                    onChange={(e) => setForm(prev => ({ ...prev, colors: { ...prev.colors, buttonTextColor: e.target.value } }))}
                    className="w-9 h-9 rounded-lg bg-transparent border border-white/20 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={form.colors?.buttonTextColor || '#FFFFFF'}
                    onChange={(e) => setForm(prev => ({ ...prev, colors: { ...prev.colors, buttonTextColor: e.target.value } }))}
                    className="w-full px-2 py-1.5 bg-brand-dark border border-white/10 rounded-lg text-white font-mono text-xs uppercase"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-gray-400 font-semibold uppercase block">
                  Cor de Fundo
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.colors?.backgroundColor || '#171717'}
                    onChange={(e) => setForm(prev => ({ ...prev, colors: { ...prev.colors, backgroundColor: e.target.value } }))}
                    className="w-9 h-9 rounded-lg bg-transparent border border-white/20 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={form.colors?.backgroundColor || '#171717'}
                    onChange={(e) => setForm(prev => ({ ...prev, colors: { ...prev.colors, backgroundColor: e.target.value } }))}
                    className="w-full px-2 py-1.5 bg-brand-dark border border-white/10 rounded-lg text-white font-mono text-xs uppercase"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-gray-400 font-semibold uppercase block">
                  Cor Sobreposição (Overlay)
                </label>
                <input
                  type="text"
                  value={form.colors?.overlayColor || 'rgba(0,0,0,0.6)'}
                  onChange={(e) => setForm(prev => ({ ...prev, colors: { ...prev.colors, overlayColor: e.target.value } }))}
                  className="w-full px-2.5 py-2 bg-brand-dark border border-white/10 rounded-lg text-white font-mono text-xs"
                  placeholder="rgba(0,0,0,0.6)"
                />
              </div>
            </div>
          </div>

          {/* 7. APÓS O EVENTO */}
          <div className="bg-brand-surface border border-white/10 p-6 rounded-3xl space-y-4 shadow-xl">
            <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
              <MessageSquare className="w-5 h-5 text-rose-400" />
              <h2 className="font-display text-lg uppercase tracking-wider text-white">
                7. Comportamento Após o Evento
              </h2>
            </div>

            <p className="text-xs text-gray-400">
              Escolha o que acontece na tela inicial assim que a data e hora do evento forem atingidas.
            </p>

            <div className="space-y-3">
              <label className="flex items-start gap-3 p-3 bg-brand-dark/60 border border-white/5 rounded-xl cursor-pointer hover:border-white/20 transition-all">
                <input
                  type="radio"
                  name="postEventBehavior"
                  value="zero"
                  checked={form.postEventBehavior === 'zero'}
                  onChange={() => setForm(prev => ({ ...prev, postEventBehavior: 'zero' }))}
                  className="mt-0.5 text-brand-gold focus:ring-brand-gold"
                />
                <div>
                  <strong className="text-xs text-white uppercase block">Continuar exibindo a contagem zerada</strong>
                  <span className="text-[11px] text-gray-400">Mantém o painel visível mostrando 00d 00h 00m 00s.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 bg-brand-dark/60 border border-white/5 rounded-xl cursor-pointer hover:border-white/20 transition-all">
                <input
                  type="radio"
                  name="postEventBehavior"
                  value="hide"
                  checked={form.postEventBehavior === 'hide'}
                  onChange={() => setForm(prev => ({ ...prev, postEventBehavior: 'hide' }))}
                  className="mt-0.5 text-brand-gold focus:ring-brand-gold"
                />
                <div>
                  <strong className="text-xs text-white uppercase block">Ocultar automaticamente</strong>
                  <span className="text-[11px] text-gray-400">Remove a seção da tela inicial sem deixar nenhum espaço em branco.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 bg-brand-dark/60 border border-white/5 rounded-xl cursor-pointer hover:border-white/20 transition-all">
                <input
                  type="radio"
                  name="postEventBehavior"
                  value="custom_message"
                  checked={form.postEventBehavior === 'custom_message'}
                  onChange={() => setForm(prev => ({ ...prev, postEventBehavior: 'custom_message' }))}
                  className="mt-0.5 text-brand-gold focus:ring-brand-gold"
                />
                <div>
                  <strong className="text-xs text-white uppercase block">Exibir uma mensagem personalizada</strong>
                  <span className="text-[11px] text-gray-400">Exibe uma mensagem declarando que o evento já começou ou encerrou.</span>
                </div>
              </label>
            </div>

            {form.postEventBehavior === 'custom_message' && (
              <div className="pt-2 space-y-1">
                <label className="text-xs text-gray-400 font-semibold uppercase">
                  Mensagem Personalizada
                </label>
                <input
                  type="text"
                  value={form.postEventMessage || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, postEventMessage: e.target.value }))}
                  placeholder="Ex: A Copa Astão 2026 já começou! / Obrigado pela participação!"
                  className="w-full px-3.5 py-2.5 bg-brand-dark border border-white/10 rounded-xl text-white text-xs focus:border-brand-gold focus:outline-none"
                />
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: REAL-TIME INTERACTIVE PREVIEW */}
        <div className="lg:col-span-5 space-y-6">
          <div className="sticky top-6 space-y-4">
            <div className="bg-neutral-900 border border-white/10 p-4 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-brand-gold-glow" />
                <span className="font-display text-xs uppercase tracking-wider text-white font-bold">
                  Pré-visualização em Tempo Real
                </span>
              </div>
              <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full font-mono text-[9px] uppercase font-bold">
                Ao Vivo
              </span>
            </div>

            {/* PREVIEW CONTAINER */}
            {!form.showCountdown || form.mode === 'hidden' ? (
              <div className="bg-brand-surface/40 border border-dashed border-white/20 p-8 rounded-3xl text-center space-y-3 text-gray-400">
                <EyeOff className="w-8 h-8 mx-auto text-gray-500" />
                <h3 className="font-display text-sm uppercase font-bold text-gray-300">
                  Seção Oculta na Tela Inicial
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
                  Os outros elementos da página inicial se reorganizarão automaticamente sem espaços vagos.
                </p>
              </div>
            ) : (
              <div 
                className="relative overflow-hidden rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl transition-all"
                style={{
                  backgroundColor: form.colors?.backgroundColor || '#171717',
                  backgroundImage: form.backgroundImageUrl ? `url(${form.backgroundImageUrl})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                {/* Overlay color */}
                <div 
                  className="absolute inset-0 pointer-events-none"
                  style={{ backgroundColor: form.colors?.overlayColor || 'rgba(0,0,0,0.6)' }}
                />

                <div className="relative z-10 space-y-6">
                  
                  {/* Title & Subtitle */}
                  <div className="text-left space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-mono uppercase tracking-widest text-white border border-white/15">
                      <Calendar className="w-3 h-3 text-brand-gold-glow" />
                      EVENTO PRINCIPAL
                    </div>

                    <h3 
                      className="font-display text-xl sm:text-2xl uppercase tracking-wider font-extrabold leading-tight"
                      style={{ color: form.colors?.titleColor || '#FFFFFF' }}
                    >
                      {form.title || 'PRÓXIMO GRANDE EVENTO'}
                    </h3>

                    {form.subtitle && (
                      <p className="text-xs text-gray-300 leading-relaxed">
                        {form.subtitle}
                      </p>
                    )}
                  </div>

                  {/* Mode 1 Countdown numbers */}
                  {form.mode === 'countdown' && (
                    <div className="flex items-center justify-around bg-black/50 backdrop-blur-md border border-white/10 px-4 py-3 rounded-2xl shadow-inner font-mono text-center">
                      <div>
                        <div 
                          className="text-2xl font-black leading-none"
                          style={{ color: form.colors?.countdownColor || '#FECF2E' }}
                        >
                          99
                        </div>
                        <div className="text-[9px] text-gray-400 uppercase mt-1">Dias</div>
                      </div>
                      <div className="text-white text-base font-bold animate-pulse">:</div>
                      <div>
                        <div 
                          className="text-2xl font-black leading-none"
                          style={{ color: form.colors?.countdownColor || '#FECF2E' }}
                        >
                          08
                        </div>
                        <div className="text-[9px] text-gray-400 uppercase mt-1">Horas</div>
                      </div>
                      <div className="text-white text-base font-bold animate-pulse">:</div>
                      <div>
                        <div 
                          className="text-2xl font-black leading-none"
                          style={{ color: form.colors?.countdownColor || '#FECF2E' }}
                        >
                          45
                        </div>
                        <div className="text-[9px] text-gray-400 uppercase mt-1">Min</div>
                      </div>
                      <div className="text-white text-base font-bold animate-pulse">:</div>
                      <div>
                        <div 
                          className="text-2xl font-black leading-none text-brand-gold-glow"
                          style={{ color: form.colors?.countdownColor || '#FECF2E' }}
                        >
                          30
                        </div>
                        <div className="text-[9px] text-gray-400 uppercase mt-1">Seg</div>
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  {form.showButton && form.buttonText && (
                    <div className="pt-2">
                      <button
                        type="button"
                        className="w-full py-3.5 px-6 font-display text-sm tracking-wider uppercase font-black rounded-xl shadow-xl flex items-center justify-center gap-2 transition-all hover:scale-105"
                        style={{
                          backgroundColor: form.colors?.buttonColor || '#0099D6',
                          color: form.colors?.buttonTextColor || '#FFFFFF'
                        }}
                      >
                        {form.buttonText}
                      </button>
                    </div>
                  )}

                </div>
              </div>
            )}

            <div className="p-4 bg-brand-surface/40 border border-white/5 rounded-2xl text-xs text-gray-400 space-y-2">
              <strong className="text-white block uppercase font-mono">
                📌 Informações de Aplicação:
              </strong>
              <ul className="list-disc list-inside space-y-1 text-[11px] leading-relaxed">
                <li>Alterações de data calculam o tempo exato para todos os usuários.</li>
                <li>Qualquer imagem salva é armazenada com segurança no storage do servidor.</li>
                <li>Os usuários verão as atualizações em tempo real sem precisar reiniciar o sistema.</li>
              </ul>
            </div>

          </div>
        </div>

      </form>
    </div>
  );
}
