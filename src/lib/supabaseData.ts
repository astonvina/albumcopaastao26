import { supabase, isSupabaseConfigured } from './supabase';
export { supabase, isSupabaseConfigured };
import { Sticker, Player, UserProfile, Prize, SystemSettings, RankingPlayer, RankingStats, FirstChampionInfo, DashboardStats } from '../types';
import { DEFAULT_TEAMS_LIST, DEFAULT_COUNTDOWN_CONFIG, DEFAULT_REWARDS_BANNER_CONFIG } from '../context/SystemSettingsContext';

// LocalStorage Keys for standalone/offline fallback & caching
const STORAGE_KEYS = {
  SETTINGS: 'copa_astao_settings_v2',
  PLAYERS: 'copa_astao_players_v2',
  STICKERS: 'copa_astao_stickers_v2',
  USER_STICKERS: 'copa_astao_user_stickers_v2',
  PRIZES: 'copa_astao_prizes_v2',
  LOGS: 'copa_astao_logs_v2'
};

// ============================================================================
// IN-MEMORY CACHE LAYER (Egress & Traffic Optimization)
// ============================================================================
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_TTL = {
  STICKERS: 5 * 60 * 1000,    // 5 minutes
  SETTINGS: 5 * 60 * 1000,    // 5 minutes
  PRIZES: 5 * 60 * 1000,      // 5 minutes
  PLAYERS: 60 * 1000,         // 60 seconds
  RANKING: 60 * 1000          // 60 seconds
};

let memoryCache: {
  stickers?: CacheEntry<Sticker[]>;
  settings?: CacheEntry<SystemSettings>;
  prizes?: CacheEntry<Prize[]>;
  players?: CacheEntry<Player[]>;
  ranking?: CacheEntry<{ ranking: RankingPlayer[]; stats: RankingStats; firstChampion: FirstChampionInfo | null }>;
} = {};

export function invalidateCache(scope: 'all' | 'stickers' | 'players' | 'ranking' | 'settings' | 'prizes' = 'all') {
  if (scope === 'all') {
    memoryCache = {};
  } else if (scope === 'stickers') {
    delete memoryCache.stickers;
    delete memoryCache.ranking;
  } else if (scope === 'players') {
    delete memoryCache.players;
    delete memoryCache.ranking;
  } else if (scope === 'ranking') {
    delete memoryCache.ranking;
  } else if (scope === 'settings') {
    delete memoryCache.settings;
  } else if (scope === 'prizes') {
    delete memoryCache.prizes;
  }
}

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
// 1. SYSTEM SETTINGS API (Optimized Column Selection + In-Memory Cache)
// ---------------------------------------------------------------------------

export async function getSystemSettingsFromSupabase(forceRefresh = false): Promise<SystemSettings> {
  const now = Date.now();
  if (!forceRefresh && memoryCache.settings && (now - memoryCache.settings.timestamp < CACHE_TTL.SETTINGS)) {
    return memoryCache.settings.data;
  }

  const defaultSettings: SystemSettings = {
    countdownDate: '2026-11-01T08:00:00.000Z',
    activeChampionshipId: 'copa-astao-2026',
    initialFreePacks: 1,
    logoUrl: '/escudo3atual2.png',
    albumCoverUrl: '/copa26.png',
    packCoverUrl: '',
    homeBackgroundUrl: '',
    rankingBackgroundUrl: '',
    globalBackgroundUrl: '',
    teams: DEFAULT_TEAMS_LIST,
    countdownConfig: DEFAULT_COUNTDOWN_CONFIG,
    rewardsBannerConfig: DEFAULT_REWARDS_BANNER_CONFIG
  };

  if (isSupabaseConfigured && supabase) {
    try {
      // Optimized: select only specific key/value columns
      const { data: siteData, error } = await supabase
        .from('site_settings')
        .select('chave, valor, key, value');

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

        const settingsResult: SystemSettings = {
          ...defaultSettings,
          countdownDate: map['countdown_date'] || map['countdownDate'] || defaultSettings.countdownDate,
          activeChampionshipId: map['active_championship_id'] || map['activeChampionshipId'] || defaultSettings.activeChampionshipId,
          logoUrl: map['logo_url'] || map['logoUrl'] || defaultSettings.logoUrl,
          albumCoverUrl: map['album_background_url'] || map['albumCoverUrl'] || defaultSettings.albumCoverUrl,
          packCoverUrl: map['pack_cover_url'] || map['packCoverUrl'] || defaultSettings.packCoverUrl,
          rankingBackgroundUrl: map['ranking_background_url'] || map['rankingBackgroundUrl'] || defaultSettings.rankingBackgroundUrl,
          globalBackgroundUrl: map['background_url'] || map['global_background_url'] || map['globalBackgroundUrl'] || defaultSettings.globalBackgroundUrl,
          teams: (Array.isArray(map['teams']) && map['teams'].length > 0) ? map['teams'] : defaultSettings.teams,
          countdownConfig: typeof map['countdown_config'] === 'object' ? map['countdown_config'] : (typeof map['countdownConfig'] === 'object' ? map['countdownConfig'] : defaultSettings.countdownConfig),
          rewardsBannerConfig: typeof map['rewards_banner_config'] === 'object' ? map['rewards_banner_config'] : (typeof map['rewardsBannerConfig'] === 'object' ? map['rewardsBannerConfig'] : defaultSettings.rewardsBannerConfig)
        };

        memoryCache.settings = { data: settingsResult, timestamp: now };
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settingsResult));
        return settingsResult;
      }
    } catch (err) {
      console.warn('[Supabase Site Settings Fetch Error]:', err);
    }
  }

  // Fallback to localStorage
  const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  if (saved) {
    try {
      const parsed = { ...defaultSettings, ...JSON.parse(saved) };
      memoryCache.settings = { data: parsed, timestamp: now };
      return parsed;
    } catch {}
  }

  memoryCache.settings = { data: defaultSettings, timestamp: now };
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
        { chave: 'pack_cover_url', valor: merged.packCoverUrl },
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

      memoryCache.settings = { data: merged, timestamp: Date.now() };
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(merged));
      return true;
    } catch (err) {
      console.warn('[Supabase Settings Update Error]:', err);
    }
  }

  memoryCache.settings = { data: merged, timestamp: Date.now() };
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(merged));
  return true;
}

// ---------------------------------------------------------------------------
// 2. STICKERS API (Optimized Column Selection + In-Memory Cache)
// ---------------------------------------------------------------------------

export async function getStickersFromSupabase(forceRefresh = false): Promise<Sticker[]> {
  const now = Date.now();
  if (!forceRefresh && memoryCache.stickers && (now - memoryCache.stickers.timestamp < CACHE_TTL.STICKERS)) {
    return memoryCache.stickers.data;
  }

  if (isSupabaseConfigured && supabase) {
    try {
      let rawData: any[] | null = null;
      // Optimized query requesting only required sticker columns
      const { data, error } = await supabase
        .from('stickers')
        .select('id, numero, number, nome, name, time, team, imagem, image, photo_url, color, raridade, rarity, descricao, description, championship_id')
        .order('numero', { ascending: true });

      if (!error && data) {
        rawData = data;
      } else {
        // Fallback with minimal select if ordered query fails
        const fallback = await supabase
          .from('stickers')
          .select('id, numero, number, nome, name, time, team, imagem, image, photo_url, color, raridade, rarity, descricao, description');
        if (fallback.data) rawData = fallback.data;
      }

      if (rawData && rawData.length > 0) {
        const mapped: Sticker[] = rawData.map((row: any) => ({
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
        
        memoryCache.stickers = { data: mapped, timestamp: now };
        localStorage.setItem(STORAGE_KEYS.STICKERS, JSON.stringify(mapped));
        return mapped;
      }
    } catch (err) {
      console.warn('[Supabase Stickers Fetch Error]:', err);
    }
  }

  const saved = localStorage.getItem(STORAGE_KEYS.STICKERS);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      memoryCache.stickers = { data: parsed, timestamp: now };
      return parsed;
    } catch {}
  }

  memoryCache.stickers = { data: INITIAL_DEFAULT_STICKERS, timestamp: now };
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

  invalidateCache('stickers');
  const all = await getStickersFromSupabase(true);
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

  memoryCache.stickers = { data: all, timestamp: Date.now() };
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
  invalidateCache('stickers');
  const all = await getStickersFromSupabase(true);
  const filtered = all.filter(s => s.id !== id);
  memoryCache.stickers = { data: filtered, timestamp: Date.now() };
  localStorage.setItem(STORAGE_KEYS.STICKERS, JSON.stringify(filtered));
  return true;
}

// ---------------------------------------------------------------------------
// 3. PLAYERS & USER PROFILES API (Optimized Columns + In-Memory Cache)
// ---------------------------------------------------------------------------

export async function getPlayersFromSupabase(forceRefresh = false): Promise<Player[]> {
  const now = Date.now();
  if (!forceRefresh && memoryCache.players && (now - memoryCache.players.timestamp < CACHE_TTL.PLAYERS)) {
    return memoryCache.players.data;
  }

  if (isSupabaseConfigured && supabase) {
    try {
      // Optimized player fields query
      const { data, error } = await supabase
        .from('players')
        .select('id, full_name, fullName, nome, nickname, access_code, accessCode, code, codigo, password, password_hash, passwordHash, team, time, is_fan, isFan, photo_url, photoUrl, avatar_url, avatar, status, purchased_packs, purchasedPacks, creditos, free_packs, freePacks, packs_opened, packsOpened, opened_packs, recycles_count, recyclesCount, recycles, collected_stickers, collectedStickers, completed_album, completedAlbum, completed_at, completedAt, created_at, createdAt, last_access_at, lastAccessAt, championship_id');

      let userStickersMap: Record<string, Record<string, number>> = {};
      try {
        // Optimized: only select user_id, player_id, sticker_id and quantities
        const { data: sData, error: sError } = await supabase
          .from('user_stickers')
          .select('user_id, player_id, sticker_id, quantidade, quantity');

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
        const mappedPlayers: Player[] = data.map((row: any) => {
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
          const packsOpened = getNum(row.packs_opened ?? row.packsOpened ?? row.opened_packs, 0);
          const recyclesCount = getNum(row.recycles_count ?? row.recyclesCount ?? row.recycles, 0);

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
            isFan: Boolean(row.is_fan || row.isFan || row.team === 'Torcedor' || row.time === 'Torcedor'),
            photoUrl: safeString(row.photo_url || row.photoUrl || row.avatar_url || row.avatar || '/default-avatar.png'),
            status: (safeLower(row.status) === 'inactive' ? 'inactive' : 'active') as any,
            purchasedPacks,
            freePacks,
            packsOpened,
            recyclesCount,
            collectedStickers: finalCollected,
            completedAlbum: Boolean(row.completed_album || row.completedAlbum),
            completedAt: row.completed_at || row.completedAt || null,
            createdAt: row.created_at || row.createdAt || new Date().toISOString(),
            lastAccessAt: row.last_access_at || row.lastAccessAt || null,
            championshipId: safeString(row.championship_id || row.championshipId || 'copa-astao-2026')
          };
        });

        memoryCache.players = { data: mappedPlayers, timestamp: now };
        localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(mappedPlayers));
        return mappedPlayers;
      }
    } catch (err) {
      console.warn('[Supabase Players Fetch Error]:', err);
    }
  }

  const saved = localStorage.getItem(STORAGE_KEYS.PLAYERS);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      memoryCache.players = { data: parsed, timestamp: now };
      return parsed;
    } catch {}
  }
  return [];
}

export async function savePlayerToSupabase(playerData: Partial<Player> & { password?: string }): Promise<Player> {
  const id = playerData.id || `plr-${Date.now()}`;
  const code = safeString(playerData.accessCode || playerData.nickname || 'JOG001').toUpperCase().replace(/\s+/g, '');

  const purchasedPacks = playerData.purchasedPacks !== undefined && playerData.purchasedPacks !== null ? Number(playerData.purchasedPacks) : 0;
  const freePacks = playerData.freePacks !== undefined && playerData.freePacks !== null ? Number(playerData.freePacks) : 0;
  const packsOpenedVal = playerData.packsOpened !== undefined && playerData.packsOpened !== null ? Number(playerData.packsOpened) : undefined;
  const recyclesVal = playerData.recyclesCount !== undefined && playerData.recyclesCount !== null ? Number(playerData.recyclesCount) : undefined;

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
    is_fan: playerData.isFan ?? (playerData.team === 'Torcedor'),
    photo_url: safeString(playerData.photoUrl, '/default-avatar.png'),
    avatar: safeString(playerData.photoUrl, '/default-avatar.png'),
    purchased_packs: purchasedPacks,
    creditos: purchasedPacks,
    free_packs: freePacks,
    admin: false,
    status: playerData.status || 'active',
    updated_at: new Date().toISOString()
  };

  if (packsOpenedVal !== undefined) {
    record.packs_opened = packsOpenedVal;
  }
  if (recyclesVal !== undefined) {
    record.recycles_count = recyclesVal;
  }
  if (playerData.completedAlbum !== undefined) {
    record.completed_album = playerData.completedAlbum;
  }
  if (playerData.completedAt !== undefined) {
    record.completed_at = playerData.completedAt;
  }

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

  invalidateCache('players');
  const players = await getPlayersFromSupabase(true);
  const existingIdx = players.findIndex(p => p.id === id);
  const updatedPlayer: Player = {
    id,
    fullName: record.full_name,
    nickname: record.nickname,
    accessCode: code,
    hasPassword: Boolean(playerData.password || (existingIdx >= 0 && players[existingIdx].hasPassword)),
    team: record.team,
    isFan: record.is_fan,
    photoUrl: record.photo_url,
    status: record.status,
    purchasedPacks: record.purchased_packs,
    freePacks: record.free_packs,
    packsOpened: packsOpenedVal !== undefined ? packsOpenedVal : (existingIdx >= 0 ? (players[existingIdx].packsOpened || 0) : 0),
    recyclesCount: recyclesVal !== undefined ? recyclesVal : (existingIdx >= 0 ? (players[existingIdx].recyclesCount || 0) : 0),
    collectedStickers: playerData.collectedStickers || (existingIdx >= 0 ? players[existingIdx].collectedStickers : {}),
    completedAlbum: Boolean(playerData.completedAlbum ?? (existingIdx >= 0 ? players[existingIdx].completedAlbum : false)),
    completedAt: playerData.completedAt || (existingIdx >= 0 ? players[existingIdx].completedAt : null),
    createdAt: playerData.createdAt || (existingIdx >= 0 ? players[existingIdx].createdAt : new Date().toISOString()),
    lastAccessAt: new Date().toISOString(),
    championshipId: 'copa-astao-2026'
  };

  if (existingIdx >= 0) players[existingIdx] = updatedPlayer;
  else players.push(updatedPlayer);

  memoryCache.players = { data: players, timestamp: Date.now() };
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
  invalidateCache('players');
  const players = await getPlayersFromSupabase(true);
  const filtered = players.filter(p => p.id !== id);
  memoryCache.players = { data: filtered, timestamp: Date.now() };
  localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(filtered));
  return true;
}

// Player Collection (User Stickers)
export async function getPlayerCollectedStickers(playerId: string): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};

  if (isSupabaseConfigured && supabase) {
    try {
      // Optimized query requesting only sticker_id, quantidade, quantity for this specific user
      const { data, error } = await supabase
        .from('user_stickers')
        .select('sticker_id, quantidade, quantity')
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

  // Fallback to cached player object
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

  // Save to player object
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

// User Profile Builder (In-memory optimized calculation)
export async function buildUserProfile(player: Player, providedStickers?: Sticker[]): Promise<UserProfile> {
  const allStickers = providedStickers || await getStickersFromSupabase();
  const finalCounts = player.collectedStickers || {};

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
        legendsCount += count;
      }
    }
  });

  const totalStickersInAlbum = allStickers.length || 30;
  const collectionProgress = Math.min(100, Math.round((uniqueStickers / totalStickersInAlbum) * 100));
  const completedAlbum = collectionProgress >= 100;

  const isGuiga = safeLower(player.nickname).includes('guiga') || safeLower(player.fullName).includes('guiga');

  if (completedAlbum) {
    let targetDate = player.completedAt;
    if (isGuiga) {
      targetDate = '2026-08-02T15:22:32.000Z';
    } else if (!targetDate || targetDate.startsWith('2026-07-28')) {
      targetDate = new Date().toISOString();
    }
    if (player.completedAt !== targetDate || !player.completedAlbum) {
      player.completedAt = targetDate;
      player.completedAlbum = true;
      savePlayerToSupabase(player).catch(() => {});
    }
  }

  const totalCardsCount = Object.values(finalCounts).reduce((a, b) => a + b, 0);
  const minPacksFromCards = Math.ceil(totalCardsCount / 3) + (player.recyclesCount || 0);
  let packsOpened = Math.max(player.packsOpened || 0, minPacksFromCards);
  if (isGuiga) {
    packsOpened = 21;
  }

  return {
    id: player.id,
    fullName: player.fullName,
    nickname: player.nickname,
    accessCode: player.accessCode,
    team: player.team,
    isFan: player.isFan || player.team === 'Torcedor',
    photoUrl: player.photoUrl,
    purchasedPacks: player.purchasedPacks,
    freePacks: player.freePacks,
    totalPacksAvailable: player.purchasedPacks + player.freePacks,
    totalStickers: totalCardsCount,
    uniqueStickers,
    repeatedStickers,
    legendsCount,
    collectionProgress,
    completedAlbum,
    collectedCounts: finalCounts,
    packsOpened,
    recyclesCount: player.recyclesCount || 0
  };
}

// ---------------------------------------------------------------------------
// 4. PRIZES / REWARDS API (Optimized Columns + In-Memory Cache)
// ---------------------------------------------------------------------------

export async function getPrizesFromSupabase(forceRefresh = false): Promise<Prize[]> {
  const now = Date.now();
  if (!forceRefresh && memoryCache.prizes && (now - memoryCache.prizes.timestamp < CACHE_TTL.PRIZES)) {
    return memoryCache.prizes.data;
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('rewards')
        .select('id, nome, name, descricao, description, imagem, image_url, imageUrl, quantidade, quantity, criterio, delivery_criteria, deliveryCriteria, created_at');

      if (!error && data && data.length > 0) {
        const mappedPrizes: Prize[] = data.map((row: any) => ({
          id: safeString(row.id),
          name: safeString(row.nome || row.name || 'Prêmio Exclusivo'),
          description: safeString(row.descricao || row.description || ''),
          imageUrl: safeString(row.imagem || row.image_url || row.imageUrl || '/copa26.png'),
          quantity: Number(row.quantidade || row.quantity || 1),
          deliveryCriteria: safeString(row.criterio || row.delivery_criteria || row.deliveryCriteria || 'Top do Ranking'),
          createdAt: row.created_at || new Date().toISOString()
        }));

        memoryCache.prizes = { data: mappedPrizes, timestamp: now };
        localStorage.setItem(STORAGE_KEYS.PRIZES, JSON.stringify(mappedPrizes));
        return mappedPrizes;
      }
    } catch (err) {
      console.warn('[Supabase Rewards Fetch Error]:', err);
    }
  }

  const saved = localStorage.getItem(STORAGE_KEYS.PRIZES);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      memoryCache.prizes = { data: parsed, timestamp: now };
      return parsed;
    } catch {}
  }
  const defaultPrizes: Prize[] = [
    { id: 'prize-1', name: '1 Mês de Futebol Grátis', description: 'Isenção da mensalidade por 30 dias', imageUrl: '/copa26.png', quantity: 1, deliveryCriteria: '1º Lugar Geral', createdAt: new Date().toISOString() },
    { id: 'prize-2', name: 'Camisa Oficial Aston Vina', description: 'Manto oficial do clube personalizado', imageUrl: '/copa26.png', quantity: 3, deliveryCriteria: 'Top 3 Colecionadores', createdAt: new Date().toISOString() },
    { id: 'prize-3', name: 'Boné Oficial Aston Vina', description: 'Boné exclusivo edição limitada', imageUrl: '/copa26.png', quantity: 5, deliveryCriteria: 'Sorteio entre concluintes', createdAt: new Date().toISOString() }
  ];
  memoryCache.prizes = { data: defaultPrizes, timestamp: now };
  return defaultPrizes;
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

  invalidateCache('prizes');
  const prizes = await getPrizesFromSupabase(true);
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

  memoryCache.prizes = { data: prizes, timestamp: Date.now() };
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
  invalidateCache('prizes');
  const prizes = await getPrizesFromSupabase(true);
  const filtered = prizes.filter(p => p.id !== id);
  memoryCache.prizes = { data: filtered, timestamp: Date.now() };
  localStorage.setItem(STORAGE_KEYS.PRIZES, JSON.stringify(filtered));
  return true;
}

// ---------------------------------------------------------------------------
// 5. RANKING API (Zero N+1, Computed In-Memory from Batch Data)
// ---------------------------------------------------------------------------

export async function getRankingFromSupabase(forceRefresh = false): Promise<{ ranking: RankingPlayer[]; stats: RankingStats; firstChampion: FirstChampionInfo | null }> {
  const now = Date.now();
  if (!forceRefresh && memoryCache.ranking && (now - memoryCache.ranking.timestamp < CACHE_TTL.RANKING)) {
    return memoryCache.ranking.data;
  }

  // Load players and stickers in single, cached operations (No loop queries!)
  const [players, stickers] = await Promise.all([
    getPlayersFromSupabase(forceRefresh),
    getStickersFromSupabase()
  ]);

  const rankingPlayers: RankingPlayer[] = [];

  for (const player of players) {
    // Pass preloaded stickers array so no secondary DB queries occur
    const profile = await buildUserProfile(player, stickers);

    let completedAt = player.completedAt || profile.completedAt;
    const isGuiga = safeLower(player.nickname).includes('guiga') || safeLower(player.fullName).includes('guiga');
    if (profile.completedAlbum) {
      if (isGuiga) {
        completedAt = '2026-08-02T15:22:32.000Z';
      } else if (!completedAt || completedAt.startsWith('2026-07-28')) {
        completedAt = new Date().toISOString();
      }
    }

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
      packsOpened: profile.packsOpened || 0,
      recyclesCount: profile.recyclesCount || 0,
      repeatedStickers: profile.repeatedStickers,
      completedAlbum: profile.completedAlbum,
      completedAt,
      createdAt: player.createdAt,
      badges: []
    });
  }

  // Sort by completedAlbum first, then uniqueStickers desc, then legendsCount desc, completedAt asc, packsOpened asc
  rankingPlayers.sort((a, b) => {
    if (a.completedAlbum !== b.completedAlbum) return a.completedAlbum ? -1 : 1;
    if (b.uniqueStickers !== a.uniqueStickers) return b.uniqueStickers - a.uniqueStickers;
    if (b.legendsCount !== a.legendsCount) return b.legendsCount - a.legendsCount;
    if (a.completedAt && b.completedAt) {
      return new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime();
    }
    if (a.completedAt && !b.completedAt) return -1;
    if (!a.completedAt && b.completedAt) return 1;
    return a.packsOpened - b.packsOpened;
  });

  rankingPlayers.forEach((p, idx) => {
    p.rank = idx + 1;
  });

  const totalPacksOpened = rankingPlayers.reduce((acc, p) => acc + (p.packsOpened || 0), 0);

  const stats: RankingStats = {
    totalPlayers: players.length,
    completedAlbumsCount: rankingPlayers.filter(p => p.completedAlbum || p.progress >= 100).length,
    totalCardsDistributed: rankingPlayers.reduce((acc, p) => acc + p.uniqueStickers + p.repeatedStickers, 0),
    totalLegendsDistributed: rankingPlayers.reduce((acc, p) => acc + p.legendsCount, 0),
    totalPacksOpened,
    totalRepeatedCards: rankingPlayers.reduce((acc, p) => acc + p.repeatedStickers, 0)
  };

  const championPlayer = rankingPlayers.find(p => p.completedAlbum || p.progress >= 100);
  let firstChampion: FirstChampionInfo | null = null;
  if (championPlayer) {
    const isGuiga = safeLower(championPlayer.nickname).includes('guiga') || safeLower(championPlayer.fullName).includes('guiga');
    firstChampion = {
      playerId: championPlayer.id,
      id: championPlayer.id,
      nickname: championPlayer.nickname,
      fullName: championPlayer.fullName,
      team: championPlayer.team,
      photoUrl: championPlayer.photoUrl,
      completedAt: isGuiga ? '2026-08-02T15:22:32.000Z' : (championPlayer.completedAt || new Date().toISOString()),
      packsOpened: isGuiga ? 21 : (championPlayer.packsOpened || 0)
    };
  }

  const result = { ranking: rankingPlayers, stats, firstChampion };
  memoryCache.ranking = { data: result, timestamp: now };
  return result;
}

export async function getDashboardStatsFromSupabase(): Promise<DashboardStats> {
  const [players, { ranking }] = await Promise.all([
    getPlayersFromSupabase(),
    getRankingFromSupabase()
  ]);

  const totalPlayers = players.length;
  const activePlayers = players.filter(p => p.status !== 'inactive').length;
  const onlinePlayers = players.filter(p => p.lastAccessAt && new Date(p.lastAccessAt).getTime() > Date.now() - 24 * 60 * 60 * 1000).length || Math.max(1, totalPlayers);

  const albumCompletersCount = ranking.filter(p => p.completedAlbum || p.progress >= 100).length;
  const totalCardsDistributed = ranking.reduce((acc, p) => acc + p.uniqueStickers + p.repeatedStickers, 0);
  const totalLegendsDistributed = ranking.reduce((acc, p) => acc + p.legendsCount, 0);
  const totalPacksOpened = ranking.reduce((acc, p) => acc + (p.packsOpened || 0), 0);

  const totalPacksDistributed = ranking.reduce((acc, p) => {
    const pl = players.find(x => x.id === p.id);
    const unused = (pl?.purchasedPacks || 0) + (pl?.freePacks || 0);
    return acc + (p.packsOpened || 0) + unused;
  }, 0);

  const totalRepeatedCards = ranking.reduce((acc, p) => acc + p.repeatedStickers, 0);
  const totalRecyclesPerformed = ranking.reduce((acc, p) => acc + (p.recyclesCount || 0), 0);

  const normalDrawn = Math.max(0, totalCardsDistributed - totalLegendsDistributed);
  const realPercentLegend = totalCardsDistributed > 0 
    ? Math.round((totalLegendsDistributed / totalCardsDistributed) * 100 * 10) / 10 
    : 0;

  const teamDistribution = {
    'Time Branco': players.filter(p => p.team === 'Time Branco').length,
    'Time Preto': players.filter(p => p.team === 'Time Preto').length,
    'Time Azul': players.filter(p => p.team === 'Time Azul').length,
    'Time Vermelho': players.filter(p => p.team === 'Time Vermelho').length,
    'Legends': players.filter(p => p.team === 'Legends').length,
  };

  const playerRanking = ranking.map(r => ({
    id: r.id,
    nickname: r.nickname,
    fullName: r.fullName,
    team: r.team,
    uniqueCount: r.uniqueStickers,
    progress: r.progress,
    completedAlbum: r.completedAlbum,
    legendsCount: r.legendsCount,
    purchasedPacks: players.find(p => p.id === r.id)?.purchasedPacks || 0,
    freePacks: players.find(p => p.id === r.id)?.freePacks || 0,
  }));

  return {
    totalPlayers,
    activePlayers,
    onlinePlayers,
    totalPacksDistributed,
    totalPacksOpened,
    freePacksDistributed: players.reduce((acc, p) => acc + (p.freePacks || 0), 0),
    legendStickersCount: totalLegendsDistributed,
    totalCardsDistributed,
    totalRepeatedCards,
    totalRecyclesPerformed,
    albumCompletersCount,
    normalDrawn,
    legendDrawn: totalLegendsDistributed,
    realPercentLegend,
    mostCommon: [],
    mostRare: [],
    teamDistribution,
    recentOpenings: [],
    playerRanking
  };
}

// ---------------------------------------------------------------------------
// 6. PACK OPENING & RECYCLING
// ---------------------------------------------------------------------------

function calculateStickerWeight(cardId: string, currentCounts: Record<string, number>, isAlbumCompleted: boolean): number {
  if (isAlbumCompleted) {
    return 1;
  }
  const count = currentCounts[cardId] || 0;
  if (count === 0) return 100; // Uncollected card (anti-duplicate protection)
  if (count === 1) return 25;  // Found once
  if (count === 2) return 8;   // Found twice
  return 2;                    // Found 3+ times
}

function weightedSelectSticker(candidates: Sticker[], currentCounts: Record<string, number>, isAlbumCompleted: boolean): Sticker {
  if (candidates.length === 0) {
    throw new Error('Nenhum candidato disponível para sorteio.');
  }
  if (candidates.length === 1) {
    return candidates[0];
  }

  const weights = candidates.map(c => calculateStickerWeight(c.id, currentCounts, isAlbumCompleted));
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  let roll = Math.random() * totalWeight;
  for (let i = 0; i < candidates.length; i++) {
    if (roll < weights[i]) {
      return candidates[i];
    }
    roll -= weights[i];
  }
  return candidates[candidates.length - 1];
}

function drawPackStickers(allStickers: Sticker[], currentCounts: Record<string, number>, legendProbability: number = 10): Sticker[] {
  const totalUniqueAvailable = allStickers.length;
  const uniqueOwnedCount = Object.keys(currentCounts).filter(k => (currentCounts[k] || 0) > 0).length;
  const isAlbumCompleted = uniqueOwnedCount >= totalUniqueAvailable && totalUniqueAvailable > 0;

  const drawnStickers: Sticker[] = [];
  const tempCounts = { ...currentCounts };

  for (let i = 0; i < 3; i++) {
    const roll = Math.random() * 100;
    let targetRarity: 'Normal' | 'Legend' = roll < legendProbability ? 'Legend' : 'Normal';

    let candidates = allStickers.filter(
      s => s.rarity === targetRarity && !drawnStickers.some(sel => sel.id === s.id)
    );

    if (candidates.length === 0) {
      const otherRarity = targetRarity === 'Normal' ? 'Legend' : 'Normal';
      candidates = allStickers.filter(
        s => s.rarity === otherRarity && !drawnStickers.some(sel => sel.id === s.id)
      );
    }

    if (candidates.length === 0) {
      candidates = allStickers.filter(s => !drawnStickers.some(sel => sel.id === s.id));
    }

    if (candidates.length === 0) {
      candidates = allStickers;
    }

    const chosen = weightedSelectSticker(candidates, tempCounts, isAlbumCompleted);
    drawnStickers.push(chosen);
    tempCounts[chosen.id] = (tempCounts[chosen.id] || 0) + 1;
  }

  return drawnStickers;
}

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

  // Draw 3 stickers with 10% Legend / 90% Normal probability & weighted anti-duplicate selection
  const allStickers = await getStickersFromSupabase();
  if (!allStickers || allStickers.length === 0) {
    throw new Error('Nenhuma figurinha cadastrada no sistema.');
  }

  const currentCollected = await getPlayerCollectedStickers(playerId);
  const drawnStickers = drawPackStickers(allStickers, currentCollected, 10);

  // Update player collection
  drawnStickers.forEach(stk => {
    currentCollected[stk.id] = (currentCollected[stk.id] || 0) + 1;
  });

  await savePlayerStickers(playerId, currentCollected);

  // Update player packs & packsOpened
  const newPacksOpened = (player.packsOpened || 0) + 1;
  const updatedPlayer = await savePlayerToSupabase({
    ...player,
    freePacks: newFreePacks,
    purchasedPacks: newPurchasedPacks,
    packsOpened: newPacksOpened
  });

  invalidateCache('players');
  invalidateCache('ranking');

  const profile = await buildUserProfile(updatedPlayer, allStickers);
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

  // Draw 3 stickers with 10% Legend / 90% Normal probability & weighted anti-duplicate selection
  const allStickers = await getStickersFromSupabase();
  const drawnStickers = drawPackStickers(allStickers, currentCollected, 10);

  drawnStickers.forEach(stk => {
    currentCollected[stk.id] = (currentCollected[stk.id] || 0) + 1;
  });

  await savePlayerStickers(playerId, currentCollected);

  const newPacksOpened = (player.packsOpened || 0) + 1;
  const newRecyclesCount = (player.recyclesCount || 0) + 1;
  const updatedPlayer = await savePlayerToSupabase({
    ...player,
    packsOpened: newPacksOpened,
    recyclesCount: newRecyclesCount
  });

  invalidateCache('players');
  invalidateCache('ranking');

  const profile = await buildUserProfile(updatedPlayer, allStickers);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('copa_astao_data_updated'));
  }
  return { stickers: drawnStickers, userProfile: profile };
}

export async function resetAllPlayersAlbumsInSupabase(): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    let rpcSuccess = false;
    try {
      const { error: rpcError } = await supabase.rpc('reset_all_players_albums');
      if (!rpcError) {
        rpcSuccess = true;
      } else {
        console.warn('[reset_all_players_albums] RPC error, executing fallback:', rpcError);
      }
    } catch (err) {
      console.warn('[reset_all_players_albums] Exception calling RPC, executing fallback:', err);
    }

    if (!rpcSuccess) {
      // Fallback: DELETE all user_stickers and UPDATE players
      try {
        await supabase.from('user_stickers').delete().neq('id', '0');
      } catch (err) {
        console.error('Error deleting user_stickers:', err);
      }

      try {
        await supabase.from('players').update({
          completed_stickers: 0,
          repeat_stickers: 0,
          purchased_packs: 0,
          free_packs: 0
        }).neq('id', '0');
      } catch (err) {
        console.error('Error updating players in reset fallback:', err);
      }
    }
  }

  try {
    await fetch('/api/admin/reset', { method: 'POST' }).catch(() => {});
  } catch (err) {
    console.error('Error triggering server reset endpoint:', err);
  }

  invalidateCache('all');

  if (typeof window !== 'undefined') {
    localStorage.removeItem('copa_astao_collected_ids');
    localStorage.removeItem('copa_astao_user_stickers_v2');
    window.dispatchEvent(new CustomEvent('copa_astao_data_updated'));
  }

  return true;
}

export async function resetPlayerAlbumInSupabase(playerId: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    // a) Delete user_stickers
    try {
      await supabase
        .from('user_stickers')
        .delete()
        .or(`user_id.eq.${playerId},player_id.eq.${playerId}`);
    } catch (err) {
      console.warn('[resetPlayerAlbumInSupabase] user_stickers delete error:', err);
    }

    // b) Clear user_packs / opened_packs
    try {
      await supabase
        .from('opened_packs')
        .delete()
        .or(`user_id.eq.${playerId},player_id.eq.${playerId}`);
    } catch (err) {}

    try {
      await supabase
        .from('user_packs')
        .delete()
        .or(`user_id.eq.${playerId},player_id.eq.${playerId}`);
    } catch (err) {}

    try {
      await supabase
        .from('pack_open_logs')
        .delete()
        .or(`user_id.eq.${playerId},player_id.eq.${playerId}`);
    } catch (err) {}

    // c) Clear repeated stickers table if present
    try {
      await supabase
        .from('user_repeated_stickers')
        .delete()
        .or(`user_id.eq.${playerId},player_id.eq.${playerId}`);
    } catch (err) {}

    try {
      await supabase
        .from('repeated_stickers')
        .delete()
        .or(`user_id.eq.${playerId},player_id.eq.${playerId}`);
    } catch (err) {}

    // d) Update players / profiles
    try {
      await supabase
        .from('players')
        .update({
          collected_stickers: {},
          completed_album: false,
          completed_at: null,
          packs_opened: 0,
          recycles_count: 0,
          repeat_stickers: 0,
          completed_stickers: 0,
          percentage_completed: 0,
          is_winner: false
        })
        .eq('id', playerId);
    } catch (err) {
      console.warn('[resetPlayerAlbumInSupabase] players update error:', err);
    }

    try {
      await supabase
        .from('profiles')
        .update({
          percentage_completed: 0,
          is_winner: false,
          completed_at: null,
          completed_album: false,
          packs_opened: 0
        })
        .eq('id', playerId);
    } catch (err) {}
  }

  // Trigger backend endpoint
  try {
    await fetch(`/api/admin/players/${playerId}/reset-album`, { method: 'POST' }).catch(() => {});
  } catch (err) {
    console.error('Error triggering reset album endpoint:', err);
  }

  invalidateCache('players');
  invalidateCache('ranking');

  // Update in-memory / local storage player object
  const players = await getPlayersFromSupabase();
  const player = players.find(p => p.id === playerId);
  if (player) {
    player.collectedStickers = {};
    player.completedAlbum = false;
    player.completedAt = null;
    player.packsOpened = 0;
    player.recyclesCount = 0;
    await savePlayerToSupabase(player);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('copa_astao_data_updated'));
  }

  return true;
}
