import React, { useState } from 'react';
import { Plus, Boxes, Edit, Trash2, X, Upload } from 'lucide-react';
import { Sticker } from '../types';
import ImageUploader from './ImageUploader';
import { saveStickerToSupabase, deleteStickerFromSupabase } from '../lib/supabaseData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface StickersAdminTabProps {
  stickers: Sticker[];
  onRefreshData: () => void;
}

export default function StickersAdminTab({ stickers, onRefreshData }: StickersAdminTabProps) {
  const [isCreatingSticker, setIsCreatingSticker] = useState(false);
  const [isEditingSticker, setIsEditingSticker] = useState<Sticker | null>(null);
  const [stickerFormData, setStickerFormData] = useState({
    id: '',
    number: '',
    name: '',
    team: 'Time Vermelho' as const,
    rarity: 'Normal' as const,
    image: '',
    color: '#EF4444'
  });
  const [stickerSaveError, setStickerSaveError] = useState<string | null>(null);

  // Bulk state
  const [isBulkCreatingStickers, setIsBulkCreatingStickers] = useState(false);
  const [bulkTeam, setBulkTeam] = useState<'Time Vermelho' | 'Time Azul' | 'Time Branco' | 'Time Preto' | 'Legends'>('Time Vermelho');
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState<string | null>(null);

  const handleOpenCreateSticker = () => {
    setIsEditingSticker(null);
    setStickerFormData({
      id: '',
      number: `VER-${String(stickers.length + 1).padStart(2, '0')}`,
      name: '',
      team: 'Time Vermelho',
      rarity: 'Normal',
      image: '',
      color: '#EF4444'
    });
    setStickerSaveError(null);
    setIsCreatingSticker(true);
  };

  const handleOpenEditSticker = (s: Sticker) => {
    setIsEditingSticker(s);
    setStickerFormData({
      id: s.id,
      number: s.number,
      name: s.name,
      team: s.team as any,
      rarity: s.rarity as any,
      image: s.image,
      color: s.color || '#EF4444'
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
      const stickerData = {
        id: isEditingSticker?.id || stickerFormData.id || undefined,
        numero: parseInt(stickerFormData.number.replace(/\D/g, ''), 10) || 1,
        nome: stickerFormData.name.trim(),
        raridade: stickerFormData.rarity,
        time: stickerFormData.team,
        imagem: stickerFormData.image || '/copa26.png',
        image: stickerFormData.image || '/copa26.png'
      };

      // Upsert using strictly clean payload if Supabase is active
      if (isSupabaseConfigured && supabase) {
        const cleanPayload = {
          id: stickerData.id || undefined,
          numero: parseInt(String(stickerData.numero), 10) || 1,
          nome: stickerData.nome,
          raridade: stickerData.raridade,
          time: stickerData.time,
          imagem: stickerData.imagem || stickerData.image
        };

        const { error } = await supabase.from('stickers').upsert(cleanPayload, { onConflict: 'id' });
        if (error) {
          console.warn('[Supabase Direct Sticker Upsert Warning]:', error.message);
        }
      }

      await saveStickerToSupabase({
        id: stickerData.id,
        number: stickerFormData.number,
        name: stickerData.nome,
        team: stickerData.time as any,
        color: stickerFormData.color,
        rarity: stickerData.raridade as any,
        image: stickerData.imagem
      });

      setIsCreatingSticker(false);
      setIsEditingSticker(null);
      onRefreshData();
    } catch (err: any) {
      setStickerSaveError('Erro ao salvar figurinha: ' + err.message);
    }
  };

  const handleDeleteSticker = async (id: string, name: string) => {
    if (!confirm(`Deseja realmente excluir a figurinha "${name}"?`)) return;
    try {
      await deleteStickerFromSupabase(id);
      onRefreshData();
    } catch (err: any) {
      alert('Erro ao excluir figurinha: ' + err.message);
    }
  };

  // Bulk Upload
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

        const stickerData = {
          id: undefined,
          numero: parseInt(numStr.replace(/\D/g, ''), 10) || (stickers.length + i + 1),
          nome: cleanName,
          raridade: bulkTeam === 'Legends' ? 'Legend' : 'Normal',
          time: bulkTeam,
          imagem: base64Url,
          image: base64Url
        };

        if (isSupabaseConfigured && supabase) {
          const cleanPayload = {
            id: stickerData.id || undefined,
            numero: parseInt(String(stickerData.numero), 10) || 1,
            nome: stickerData.nome,
            raridade: stickerData.raridade,
            time: stickerData.time,
            imagem: stickerData.imagem || stickerData.image
          };

          await supabase.from('stickers').upsert(cleanPayload, { onConflict: 'id' });
        }

        await saveStickerToSupabase({
          number: numStr,
          name: cleanName,
          team: bulkTeam,
          color: bulkTeam === 'Time Vermelho' ? '#EF4444' : bulkTeam === 'Time Azul' ? '#4FA8F4' : bulkTeam === 'Time Branco' ? '#FFFFFF' : bulkTeam === 'Time Preto' ? '#1A1A1A' : '#E5B80B',
          rarity: bulkTeam === 'Legends' ? 'Legend' : 'Normal',
          image: base64Url
        });
      }

      setBulkSuccessMsg(`${files.length} figurinhas enviadas com sucesso!`);
      setTimeout(() => {
        setIsBulkCreatingStickers(false);
        setBulkSuccessMsg(null);
        onRefreshData();
      }, 1500);
    } catch (err: any) {
      alert('Erro no upload em lote: ' + err.message);
    } finally {
      setBulkUploading(false);
    }
  };

  return (
    <div className="space-y-6" id="stickers-panel">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-brand-surface border border-white/10 p-6 rounded-2xl">
        <div>
          <h2 className="font-display text-xl uppercase tracking-wider text-white">CMS de Figurinhas</h2>
          <p className="text-xs text-gray-400 mt-1">Gerencie, envie individualmente ou faça cadastro em lote por time.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsBulkCreatingStickers(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase text-xs rounded-xl flex items-center gap-2 shadow-lg transition-all"
          >
            <Boxes className="w-4 h-4" />
            Cadastrar em Lote
          </button>
          <button
            onClick={handleOpenCreateSticker}
            className="px-4 py-2.5 bg-brand-gold text-black font-bold uppercase text-xs rounded-xl flex items-center gap-2 shadow-lg transition-all"
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
                <img src={stk.image} alt={stk.name} className="w-full h-full object-contain" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
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
  );
}
