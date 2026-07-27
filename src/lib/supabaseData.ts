import { supabase, isSupabaseConfigured } from './supabase';
export { supabase, isSupabaseConfigured };
import { Sticker, Player, UserProfile, Prize, SystemSettings, RankingPlayer } from '../types';
import { DEFAULT_TEAMS_LIST, DEFAULT_COUNTDOWN_CONFIG, DEFAULT_REWARDS_BANNER_CONFIG } from '../context/SystemSettingsContext';

// LocalStorage Keys for standalone/offline fallback
const STORAGE_KEYS = {
  SETTINGS: 'copa_astao_settings_v2',
  PLAYERS: 'copa_astao_players_v2',
  STICKERS: 'copa_astao_stickers_v2',
  USER_STICKERS: 'copa_astao_user_stickers_v2',
  PRIZES: 'copa_astao_prizes_v2',
  LOGS: 'copa_astao_logs_v2'
};

// Default initial stickers if database is brand new
const INITIAL_DEFAULT_STICKERS: Sticker[] = [
  { id: 'stk-1', number: '1', name: 'Escudo Aston Vina', team: 'Time Vermelho', image: '/escudo3atual2.png', color: '#EF4444', rarity: 'Normal', description: 'Escudo oficial' },
  { id: 'stk-2', number: '2', name: 'Mascote Astão', team: 'Time Azul', image: '/copa26.png', color: '#3B82F6', rarity: 'Normal', description: 'Mascote do torneio' },
  { id: 'stk-3', number: '3', name: 'Troféu Ouro', team: 'Legends', image: '/copa26.png', color: '#E5B80B', rarity: 'Legend', description: 'Taça do Campeão' }
];

// Helper: Safely normalize strings
export function safeString(val: any, fallback = ''): string {
  if (val === null || val === undefined) return fallback;
  return String(val);
}

export function safeLower(val: any, fallback = ''): string {
  return safeString(val, fallback).toLowerCase();
}

// ---------------------------------------------------------------------------
// 1. SYSTEM SETTINGS API
// ---------------------------------------------------------------------------

export async function getSystemSettingsFromSupabase(): Promise<SystemSettings> {
  const defaultSettings: SystemSettings = {
    countdownDate: '2026-11-01T08:00:00.000Z',
    activeChampionshipId: 'copa-astao-2026',
    initialFreePacks: 1,
    logoUrl: '/escudo3atual2.png',
    albumCoverUrl: '/copa26.png',
    homeBackgroundUrl: '',
    rankingBackgroundUrl: '',
    globalBackgroundUrl: '',
    teams: DEFAULT_TEAMS_LIST,
    countdownConfig: DEFAULT_COUNTDOWN_CONFIG,
    rewardsBannerConfig: DEFAULT_REWARDS_BANNER_CONFIG
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data: siteData, error } = await supabase.from('site_settings').select('*');
      if (!error && siteData && Array.isArray(siteData) && siteData.length > 0) {
        const map: Record<string, any> = {};
        for (const row of siteData) {
          const k = row.chave || row.key;
          let v = row.valor !== undefined ? row.valor : row.value;
          if (k) {
            if (typeof v === 'string' && (v.startsWith('{') || v.startsWith('['))) {
              try { v = JSON.parse(v); } catch {}
            }
            map[k] = v;
          }
        }

        return {
          ...defaultSettings,
          countdownDate: map['countdown_date'] || map['countdownDate'] || defaultSettings.countdownDate,
          activeChampionshipId: map['active_championship_id'] || map['activeChampionshipId'] || defaultSettings.activeChampionshipId,
          logoUrl: map['logo_url'] || map['logoUrl'] || defaultSettings.logoUrl,
          albumCoverUrl: map['album_background_url'] || map['albumCoverUrl'] || defaultSettings.albumCoverUrl,
          rankingBackgroundUrl: map['ranking_background_url'] || map['rankingBackgroundUrl'] || defaultSettings.rankingBackgroundUrl,
          globalBackgroundUrl: map['background_url'] || map['global_background_url'] || map['globalBackgroundUrl'] || defaultSettings.globalBackgroundUrl,
          teams: (Array.isArray(map['teams']) && map['teams'].length > 0) ? map['teams'] : defaultSettings.teams,
          countdownConfig: typeof map['countdown_config'] === 'object' ? map['countdown_config'] : (typeof map['countdownConfig'] === 'object' ? map['countdownConfig'] : defaultSettings.countdownConfig),
          rewardsBannerConfig: typeof map['rewards_banner_config'] === 'object' ? map['rewards_banner_config'] : (typeof map['rewardsBannerConfig'] === 'object' ? map['rewardsBannerConfig'] : defaultSettings.rewardsBannerConfig)
        };
      }
    } catch (err) {
      console.warn('[Supabase Site Settings Fetch Error]:', err);
    }
  }

  // Fallback to localStorage
  const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  if (saved) {
    try {
      return { ...defaultSettings, ...JSON.parse(saved) };
    } catch {}
  }

  return defaultSettings;
}

export async function updateSystemSettingsInSupabase(newSettings: Partial<SystemSettings>): Promise<boolean> {
  const current = await getSystemSettingsFromSupabase();
  const merged = { ...current, ...newSettings };

  if (isSupabaseConfigured && supabase) {
    try {
      const siteEntries = [
        { chave: 'logo_url', valor: merged.logoUrl },
        { chave: 'background_url', valor: merged.globalBackgroundUrl || merged.homeBackgroundUrl },
        { chave: 'album_background_url', valor: merged.albumCoverUrl },
        { chave: 'ranking_background_url', valor: merged.rankingBackgroundUrl },
        { chave: 'countdown_date', valor: merged.countdownDate },
        { chave: 'active_championship_id', valor: merged.activeChampionshipId },
        { chave: 'teams', valor: typeof merged.teams === 'object' ? JSON.stringify(merged.teams) : merged.teams },
        { chave: 'countdown_config', valor: typeof merged.countdownConfig === 'object' ? JSON.stringify(merged.countdownConfig) : merged.countdownConfig },
        { chave: 'rewards_banner_config', valor: typeof merged.rewardsBannerConfig === 'object' ? JSON.stringify(merged.rewardsBannerConfig) : merged.rewardsBannerConfig }
      ];

      for (const entry of siteEntries) {
        if (entry.valor !== undefined && entry.valor !== null) {
          try {
            await supabase
              .from('site_settings')
              .upsert({
                chave: entry.chave,
                valor: String(entry.valor),
                key: entry.chave,
                value: String(entry.valor),
                updated_at: new Date().toISOString()
              }, { onConflict: 'chave' });
          } catch {
            // Ignore if schema lacks specific columns
          }
        }
      }

      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(merged));
      return true;
    } catch (err) {
      console.warn('[Supabase Settings Update Error]:', err);
    }
  }

  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(merged));
  return true;
}

// ---------------------------------------------------------------------------
// 2. STICKERS API
// ---------------------------------------------------------------------------

export async function getStickersFromSupabase(): Promise<Sticker[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      let rawData: any[] | null = null;
      const { data, error } = await supabase.from('stickers').select('*').order('numero', { ascending: true });
      if (!error && data) {
        rawData = data;
      } else {
        // Fallback without ordering in case column index issue
        const fallback = await supabase.from('stickers').select('*');
        if (fallback.data) rawData = fallback.data;
      }

      if (rawData && rawData.length > 0) {
        const mapped = rawData.map((row: any) => ({
          id: safeString(row.id),
          number: safeString(row.numero || row.number || '0'),
          name: safeString(row.nome || row.name || 'Figurinha'),
          team: (row.time || row.team || 'Time Vermelho') as any,
          image: safeString(row.imagem || row.image || row.photo_url || '/copa26.png'),
          color: safeString(row.color || '#EF4444'),
          rarity: (safeLower(row.raridade || row.rarity).includes('legend') || safeLower(row.raridade || row.rarity).includes('lendaria') ? 'Legend' : 'Normal') as any,
          description: safeString(row.descricao || row.description || ''),
          championshipId: safeString(row.championship_id || row.championshipId || 'copa-astao-2026')
        }));

        mapped.sort((a, b) => (parseInt(a.number, 10) || 0) - (parseInt(b.number, 10) || 0));
        return mapped;
      }
    } catch (err) {
      console.warn('[Supabase Stickers Fetch Error]:', err);
    }
  }

  const saved = localStorage.getItem(STORAGE_KEYS.STICKERS);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {}
  }
  return INITIAL_DEFAULT_STICKERS;
}

export async function saveStickerToSupabase(sticker: Partial<Sticker> & { numero?: any; nome?: string; raridade?: string; time?: string; imagem?: string }): Promise<Sticker | null> {
  const id = sticker.id || undefined;
  const rawNumStr = safeString(sticker.number || sticker.numero, '1');
  const numInt = parseInt(rawNumStr.replace(/\D/g, ''), 10) || (parseInt(safeString(sticker.numero), 10) || 1);
  const imgUrl = safeString(sticker.image || sticker.imagem) || '/copa26.png';
  const nameStr = safeString(sticker.name || sticker.nome, 'Figurinha');
  const teamStr = safeString(sticker.team || sticker.time, 'Time Vermelho');
  const rarityStr = safeString(sticker.rarity || sticker.raridade, 'Normal');

  // STRICTLY CLEAN payload containing ONLY the accepted table columns
  const cleanPayload = {
    id: id || undefined,
    numero: numInt,
    nome: nameStr,
    raridade: rarityStr,
    time: teamStr,
    imagem: imgUrl
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('stickers').upsert(cleanPayload, { onConflict: 'id' });
      if (error) console.warn('[Supabase Sticker Upsert Error]:', error.message);
    } catch (err) {
      console.warn('[Supabase Sticker Save Exception]:', err);
    }
  }

  const all = await getStickersFromSupabase();
  const localId = id || `stk-${Date.now()}`;
  const idx = all.findIndex(s => s.id === localId);
  const updatedSticker: Sticker = {
    id: localId,
    number: String(numInt),
    name: nameStr,
    team: teamStr as any,
    image: imgUrl,
    color: sticker.color || '#EF4444',
    rarity: (rarityStr === 'Legend' ? 'Legend' : 'Normal') as any,
    description: sticker.description || ''
  };

  if (idx >= 0) all[idx] = updatedSticker;
  else all.push(updatedSticker);

  localStorage.setItem(STORAGE_KEYS.STICKERS, JSON.stringify(all));
  return updatedSticker;
}

export async function deleteStickerFromSupabase(id: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('stickers').delete().eq('id', id);
    } catch (err) {
      console.warn('[Supabase Delete Sticker Error]:', err);
    }
  }
  const all = await getStickersFromSupabase();
  const filtered = all.filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEYS.STICKERS, JSON.stringify(filtered));
  return true;
}

// ---------------------------------------------------------------------------
// 3. PLAYERS & USER PROFILES API
// ---------------------------------------------------------------------------

export async function getPlayersFromSupabase(): Promise<Player[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from('players').select('*');

      let userStickersMap: Record<string, Record<string, number>> = {};
      try {
        const { data: sData, error: sError } = await supabase.from('user_stickers').select('*');
        if (!sError && sData) {
          sData.forEach((row: any) => {
            const uId = safeString(row.user_id || row.userId || row.player_id || row.playerId);
            const stkId = safeString(row.sticker_id || row.stickerId);
            const qty = Number(row.quantidade ?? row.quantity ?? 1);
            if (uId && stkId) {
              if (!userStickersMap[uId]) userStickersMap[uId] = {};
              userStickersMap[uId][stkId] = (userStickersMap[uId][stkId] || 0) + (isNaN(qty) || qty <= 0 ? 1 : qty);
            }
          });
        }
      } catch (err) {
        console.warn('[Supabase user_stickers Fetch Warning]:', err);
      }

      if (!error && data) {
        return data.map((row: any) => {
          const id = safeString(row.id);
          const getNum = (val: any, fallback: number) => {
            if (val !== undefined && val !== null && val !== '') {
              const parsed = Number(val);
              if (!isNaN(parsed)) return parsed;
            }
            return fallback;
          };

          const purchasedPacks = getNum(row.purchased_packs ?? row.purchasedPacks ?? row.creditos, 0);
          const freePacks = getNum(row.free_packs ?? row.freePacks, 0);

          const tableStickers = row.collected_stickers || row.collectedStickers || {};
          const userStickers = userStickersMap[id] || {};
          const finalCollected = Object.keys(userStickers).length > 0 ? userStickers : tableStickers;

          return {
            id,
            fullName: safeString(row.full_name || row.fullName || row.nome || 'Jogador'),
            nickname: safeString(row.nickname || row.nome || row.full_name || 'Jogador'),
            accessCode: safeString(row.access_code || row.accessCode || row.code || row.codigo || '').toUpperCase(),
            hasPassword: Boolean(row.password || row.password_hash || row.passwordHash),
            team: safeString(row.team || row.time || 'Time Branco'),
            photoUrl: safeString(row.photo_url || row.photoUrl || row.avatar_url || row.avatar || '/default-avatar.png'),
            status: (safeLower(row.status) === 'inactive' ? 'inactive' : 'active') as any,
            purchasedPacks,
            freePacks,
            collectedStickers: finalCollected,
            completedAlbum: Boolean(row.completed_album || row.completedAlbum),
            completedAt: row.completed_at || row.completedAt || null,
            createdAt: row.created_at || row.createdAt || new Date().toISOString(),
            lastAccessAt: row.last_access_at || row.lastAccessAt || null,
            championshipId: safeString(row.championship_id || row.championshipId || 'copa-astao-2026')
          };
        });
      }
    } catch (err) {
      console.warn('[Supabase Players Fetch Error]:', err);
    }
  }

  const saved = localStorage.getItem(STORAGE_KEYS.PLAYERS);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {}
  }
  return [];
}

export async function savePlayerToSupabase(playerData: Partial<Player> & { password?: string }): Promise<Player> {
  const id = playerData.id || `plr-${Date.now()}`;
  const code = safeString(playerData.accessCode || playerData.nickname || 'JOG001').toUpperCase().replace(/\s+/g, '');

  const purchasedPacks = playerData.purchasedPacks !== undefined && playerData.purchasedPacks !== null ? Number(playerData.purchasedPacks) : 0;
  const freePacks = playerData.freePacks !== undefined && playerData.freePacks !== null ? Number(playerData.freePacks) : 0;

  const record: any = {
    id,
    code,
    codigo: code,
    access_code: code,
    name: safeString(playerData.fullName || playerData.nickname, 'Jogador'),
    nome: safeString(playerData.fullName || playerData.nickname, 'Jogador'),
    full_name: safeString(playerData.fullName, 'Jogador'),
    nickname: safeString(playerData.nickname, 'Jogador'),
    team: safeString(playerData.team, 'Time Branco'),
    time: safeString(playerData.team, 'Time Branco'),
    photo_url: safeString(playerData.photoUrl, '/default-avatar.png'),
    avatar: safeString(playerData.photoUrl, '/default-avatar.png'),
    purchased_packs: purchasedPacks,
    creditos: purchasedPacks,
    free_packs: freePacks,
    admin: false,
    status: playerData.status || 'active',
    updated_at: new Date().toISOString()
  };

  if (playerData.password) {
    record.password = playerData.password;
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('players').upsert(record, { onConflict: 'id' });
      if (error) console.warn('[Supabase Player Upsert Error]:', error.message);
    } catch (err) {
      console.warn('[Supabase Player Save Exception]:', err);
    }
  }

  const players = await getPlayersFromSupabase();
  const existingIdx = players.findIndex(p => p.id === id);
  const updatedPlayer: Player = {
    id,
    fullName: record.full_name,
    nickname: record.nickname,
    accessCode: code,
    hasPassword: Boolean(playerData.password || existingIdx >= 0 && players[existingIdx].hasPassword),
    team: record.team,
    photoUrl: record.photo_url,
    status: record.status,
    purchasedPacks: record.purchased_packs,
    freePacks: record.free_packs,
    collectedStickers: playerData.collectedStickers || (existingIdx >= 0 ? players[existingIdx].collectedStickers : {}),
    completedAlbum: Boolean(playerData.completedAlbum || existingIdx >= 0 && players[existingIdx].completedAlbum),
    completedAt: playerData.completedAt || (existingIdx >= 0 ? players[existingIdx].completedAt : null),
    createdAt: playerData.createdAt || (existingIdx >= 0 ? players[existingIdx].createdAt : new Date().toISOString()),
    lastAccessAt: new Date().toISOString(),
    championshipId: 'copa-astao-2026'
  };

  if (existingIdx >= 0) players[existingIdx] = updatedPlayer;
  else players.push(updatedPlayer);

  localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(players));
  return updatedPlayer;
}

export async function deletePlayerFromSupabase(id: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('players').delete().eq('id', id);
    } catch (err) {
      console.warn('[Supabase Player Delete Error]:', err);
    }
  }
  const players = await getPlayersFromSupabase();
  const filtered = players.filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(filtered));
  return true;
}

// Player Collection (User Stickers)
export async function getPlayerCollectedStickers(playerId: string): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};

  if (isSupabaseConfigured && supabase) {
    try {
      // Query user_stickers or player_stickers
      const { data, error } = await supabase
        .from('user_stickers')
        .select('*')
        .or(`user_id.eq.${playerId},player_id.eq.${playerId}`);

      if (!error && data && data.length > 0) {
        data.forEach((row: any) => {
          const stkId = safeString(row.sticker_id || row.stickerId);
          const qty = Number(row.quantidade ?? row.quantity ?? 1);
          if (stkId) {
            counts[stkId] = (counts[stkId] || 0) + (isNaN(qty) || qty <= 0 ? 1 : qty);
          }
        });
        return counts;
      }
    } catch (err) {
      console.warn('[Supabase User Stickers Fetch Error]:', err);
    }
  }

  // Fallback to player object
  const players = await getPlayersFromSupabase();
  const player = players.find(p => p.id === playerId);
  return player?.collectedStickers || {};
}

export async function addStickersToPlayerCollection(
  playerId: string,
  stickerIds: string[]
): Promise<Record<string, number>> {
  const currentCounts = await getPlayerCollectedStickers(playerId);

  stickerIds.forEach(id => {
    currentCounts[id] = (currentCounts[id] || 0) + 1;
  });

  if (isSupabaseConfigured && supabase) {
    try {
      for (const stkId of stickerIds) {
        const qty = currentCounts[stkId];
        await supabase
          .from('user_stickers')
          .upsert({
            user_id: playerId,
            sticker_id: stkId,
            quantity: qty,
            quantidade: qty
          }, { onConflict: 'user_id,sticker_id' as any });
      }
    } catch (err) {
      console.warn('[Supabase Add User Stickers Error]:', err);
    }
  }

  // Save to player object as backup
  const players = await getPlayersFromSupabase();
  const player = players.find(p => p.id === playerId);
  if (player) {
    player.collectedStickers = currentCounts;
    await savePlayerToSupabase(player);
  }

  return currentCounts;
}

export async function savePlayerStickers(
  playerId: string,
  counts: Record<string, number>
): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      for (const [stkId, qty] of Object.entries(counts)) {
        await supabase
          .from('user_stickers')
          .upsert({
            user_id: playerId,
            sticker_id: stkId,
            quantity: qty,
            quantidade: qty
          }, { onConflict: 'user_id,sticker_id' as any });
      }
    } catch (err) {
      console.warn('[Supabase Save User Stickers Error]:', err);
    }
  }

  const players = await getPlayersFromSupabase();
  const player = players.find(p => p.id === playerId);
  if (player) {
    player.collectedStickers = counts;
    await savePlayerToSupabase(player);
  }
}

export async function buildUserProfile(player: Player): Promise<UserProfile> {
  const allStickers = await getStickersFromSupabase();
  const collectedCounts = await getPlayerCollectedStickers(player.id);
  const finalCounts = { ...(player.collectedStickers || {}), ...collectedCounts };

  let uniqueStickers = 0;
  let repeatedStickers = 0;
  let legendsCount = 0;

  Object.entries(finalCounts).forEach(([stkId, count]) => {
    if (count > 0) {
      uniqueStickers += 1;
      if (count > 1) {
        repeatedStickers += (count - 1);
      }
      const stk = allStickers.find(s => s.id === stkId);
      if (stk && safeLower(stk.rarity).includes('legend')) {
        legendsCount += 1;
      }
    }
  });

  const totalStickersInAlbum = allStickers.length || 30;
  const collectionProgress = Math.min(100, Math.round((uniqueStickers / totalStickersInAlbum) * 100));
  const completedAlbum = collectionProgress >= 100;

  return {
    id: player.id,
    fullName: player.fullName,
    nickname: player.nickname,
    accessCode: player.accessCode,
    team: player.team,
    photoUrl: player.photoUrl,
    purchasedPacks: player.purchasedPacks,
    freePacks: player.freePacks,
    totalPacksAvailable: player.purchasedPacks + player.freePacks,
    totalStickers: Object.values(finalCounts).reduce((a, b) => a + b, 0),
    uniqueStickers,
    repeatedStickers,
    legendsCount,
    collectionProgress,
    completedAlbum,
    collectedCounts: finalCounts
  };
}

// ---------------------------------------------------------------------------
// 4. PRIZES / REWARDS API
// ---------------------------------------------------------------------------

export async function getPrizesFromSupabase(): Promise<Prize[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from('rewards').select('*');
      if (!error && data && data.length > 0) {
        return data.map((row: any) => ({
          id: safeString(row.id),
          name: safeString(row.nome || row.name || 'Prêmio Exclusivo'),
          description: safeString(row.descricao || row.description || ''),
          imageUrl: safeString(row.imagem || row.image_url || row.imageUrl || '/copa26.png'),
          quantity: Number(row.quantidade || row.quantity || 1),
          deliveryCriteria: safeString(row.criterio || row.delivery_criteria || row.deliveryCriteria || 'Top do Ranking'),
          createdAt: row.created_at || new Date().toISOString()
        }));
      }
    } catch (err) {
      console.warn('[Supabase Rewards Fetch Error]:', err);
    }
  }

  const saved = localStorage.getItem(STORAGE_KEYS.PRIZES);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {}
  }
  return [
    { id: 'prize-1', name: '1 Mês de Futebol Grátis', description: 'Isenção da mensalidade por 30 dias', imageUrl: '/copa26.png', quantity: 1, deliveryCriteria: '1º Lugar Geral', createdAt: new Date().toISOString() },
    { id: 'prize-2', name: 'Camisa Oficial Aston Vina', description: 'Manto oficial do clube personalizado', imageUrl: '/copa26.png', quantity: 3, deliveryCriteria: 'Top 3 Colecionadores', createdAt: new Date().toISOString() },
    { id: 'prize-3', name: 'Boné Oficial Aston Vina', description: 'Boné exclusivo edição limitada', imageUrl: '/copa26.png', quantity: 5, deliveryCriteria: 'Sorteio entre concluintes', createdAt: new Date().toISOString() }
  ];
}

export async function savePrizeToSupabase(prizeData: Partial<Prize>): Promise<Prize> {
  const id = prizeData.id || `priz-${Date.now()}`;
  const record = {
    id,
    name: safeString(prizeData.name, 'Prêmio'),
    nome: safeString(prizeData.name, 'Prêmio'),
    description: safeString(prizeData.description, ''),
    descricao: safeString(prizeData.description, ''),
    image_url: safeString(prizeData.imageUrl, '/copa26.png'),
    imageUrl: safeString(prizeData.imageUrl, '/copa26.png'),
    imagem: safeString(prizeData.imageUrl, '/copa26.png'),
    quantity: prizeData.quantity || 1,
    quantidade: prizeData.quantity || 1,
    delivery_criteria: safeString(prizeData.deliveryCriteria, 'Top Ranking'),
    criterio: safeString(prizeData.deliveryCriteria, 'Top Ranking')
  };

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('rewards').upsert(record, { onConflict: 'id' });
    } catch (err) {
      console.warn('[Supabase Reward Save Error]:', err);
    }
  }

  const prizes = await getPrizesFromSupabase();
  const idx = prizes.findIndex(p => p.id === id);
  const updatedPrize: Prize = {
    id,
    name: record.name,
    description: record.description,
    imageUrl: record.image_url,
    quantity: record.quantity,
    deliveryCriteria: record.delivery_criteria,
    createdAt: new Date().toISOString()
  };

  if (idx >= 0) prizes[idx] = updatedPrize;
  else prizes.push(updatedPrize);

  localStorage.setItem(STORAGE_KEYS.PRIZES, JSON.stringify(prizes));
  return updatedPrize;
}

export async function deletePrizeFromSupabase(id: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('rewards').delete().eq('id', id);
    } catch (err) {
      console.warn('[Supabase Reward Delete Error]:', err);
    }
  }
  const prizes = await getPrizesFromSupabase();
  const filtered = prizes.filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEYS.PRIZES, JSON.stringify(filtered));
  return true;
}

// ---------------------------------------------------------------------------
// 5. RANKING API
// ---------------------------------------------------------------------------

export async function getRankingFromSupabase(): Promise<{ ranking: RankingPlayer[]; stats: any }> {
  const players = await getPlayersFromSupabase();
  const stickers = await getStickersFromSupabase();

  const rankingPlayers: RankingPlayer[] = [];

  for (const player of players) {
    const profile = await buildUserProfile(player);
    rankingPlayers.push({
      rank: 0,
      id: player.id,
      nickname: player.nickname,
      fullName: player.fullName,
      team: player.team,
      photoUrl: player.photoUrl,
      uniqueStickers: profile.uniqueStickers,
      totalStickersAvailable: stickers.length || 30,
      legendsCount: profile.legendsCount,
      progress: profile.collectionProgress,
      packsOpened: player.purchasedPacks,
      repeatedStickers: profile.repeatedStickers,
      completedAlbum: profile.completedAlbum,
      completedAt: player.completedAt,
      createdAt: player.createdAt,
      badges: []
    });
  }

  // Sort by completedAlbum first, then uniqueStickers desc, then legendsCount desc
  rankingPlayers.sort((a, b) => {
    if (a.completedAlbum !== b.completedAlbum) return a.completedAlbum ? -1 : 1;
    if (b.uniqueStickers !== a.uniqueStickers) return b.uniqueStickers - a.uniqueStickers;
    return b.legendsCount - a.legendsCount;
  });

  rankingPlayers.forEach((p, idx) => {
    p.rank = idx + 1;
  });

  const stats = {
    totalPlayers: players.length,
    completedAlbumsCount: rankingPlayers.filter(p => p.completedAlbum).length,
    totalCardsDistributed: rankingPlayers.reduce((acc, p) => acc + p.uniqueStickers + p.repeatedStickers, 0),
    totalLegendsDistributed: rankingPlayers.reduce((acc, p) => acc + p.legendsCount, 0),
    totalPacksOpened: rankingPlayers.reduce((acc, p) => acc + p.packsOpened, 0),
    totalRepeatedCards: rankingPlayers.reduce((acc, p) => acc + p.repeatedStickers, 0)
  };

  return { ranking: rankingPlayers, stats };
}

// ---------------------------------------------------------------------------
// 6. PACK OPENING & RECYCLING
// ---------------------------------------------------------------------------

export async function openPackFromSupabase(playerId: string): Promise<{ stickers: Sticker[]; userProfile: UserProfile }> {
  const players = await getPlayersFromSupabase();
  const player = players.find(p => p.id === playerId);

  if (!player) {
    throw new Error('Jogador não encontrado.');
  }

  const totalPacks = (player.freePacks || 0) + (player.purchasedPacks || 0);
  if (totalPacks <= 0) {
    throw new Error('Você não possui pacotes disponíveis.');
  }

  // Deduct 1 pack
  let newFreePacks = player.freePacks || 0;
  let newPurchasedPacks = player.purchasedPacks || 0;

  if (newFreePacks > 0) {
    newFreePacks--;
  } else if (newPurchasedPacks > 0) {
    newPurchasedPacks--;
  }

  // Draw 3 random stickers
  const allStickers = await getStickersFromSupabase();
  if (!allStickers || allStickers.length === 0) {
    throw new Error('Nenhuma figurinha cadastrada no sistema.');
  }

  const drawnStickers: Sticker[] = [];
  for (let i = 0; i < 3; i++) {
    const idx = Math.floor(Math.random() * allStickers.length);
    drawnStickers.push(allStickers[idx]);
  }

  // Update player collection
  const currentCollected = await getPlayerCollectedStickers(playerId);
  drawnStickers.forEach(stk => {
    currentCollected[stk.id] = (currentCollected[stk.id] || 0) + 1;
  });

  await savePlayerStickers(playerId, currentCollected);

  // Update player packs
  const updatedPlayer = await savePlayerToSupabase({
    ...player,
    freePacks: newFreePacks,
    purchasedPacks: newPurchasedPacks
  });

  const profile = await buildUserProfile(updatedPlayer);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('copa_astao_data_updated'));
  }
  return { stickers: drawnStickers, userProfile: profile };
}

export async function claimRecyclePackFromSupabase(playerId: string): Promise<{ stickers: Sticker[]; userProfile: UserProfile }> {
  const players = await getPlayersFromSupabase();
  const player = players.find(p => p.id === playerId);

  if (!player) {
    throw new Error('Jogador não encontrado.');
  }

  const currentCollected = await getPlayerCollectedStickers(playerId);
  const repeatedItemIds = Object.keys(currentCollected).filter(id => currentCollected[id] > 1);

  let totalRepeated = 0;
  repeatedItemIds.forEach(id => {
    totalRepeated += (currentCollected[id] - 1);
  });

  if (totalRepeated < 5) {
    throw new Error('Você precisa de pelo menos 5 figurinhas repetidas para realizar a reciclagem.');
  }

  // Remove 5 duplicates
  let removedCount = 0;
  for (const id of repeatedItemIds) {
    while (currentCollected[id] > 1 && removedCount < 5) {
      currentCollected[id]--;
      removedCount++;
    }
    if (removedCount >= 5) break;
  }

  // Draw 3 random stickers
  const allStickers = await getStickersFromSupabase();
  const drawnStickers: Sticker[] = [];
  for (let i = 0; i < 3; i++) {
    const idx = Math.floor(Math.random() * allStickers.length);
    drawnStickers.push(allStickers[idx]);
  }

  drawnStickers.forEach(stk => {
    currentCollected[stk.id] = (currentCollected[stk.id] || 0) + 1;
  });

  await savePlayerStickers(playerId, currentCollected);

  const profile = await buildUserProfile(player);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('copa_astao_data_updated'));
  }
  return { stickers: drawnStickers, userProfile: profile };
}
