import fs from 'fs';
import path from 'path';

import { 
  Sticker, 
  Player, 
  Championship, 
  Prize,
  PackCreditLog, 
  PackOpenLog, 
  RecycleLog, 
  UserProfile, 
  ProbabilitySettings, 
  DashboardStats,
  Badge,
  RankingPlayer,
  RankingStats,
  RankingEvent,
  FirstChampionInfo,
  PublicPlayerProfile,
  TeamSetting,
  SystemSettings
} from '../types';

export interface Admin {
  id: string;
  username: string;
  passwordHash: string;
}

export const DEFAULT_TEAMS: TeamSetting[] = [
  { id: 'team-vermelho', name: 'Time Vermelho', color: '#EF4444', shieldUrl: '/escudo3atual2.png' },
  { id: 'team-azul', name: 'Time Azul', color: '#4FA8F4', shieldUrl: '/escudo3atual2.png' },
  { id: 'team-branco', name: 'Time Branco', color: '#FFFFFF', shieldUrl: '/escudo3atual2.png' },
  { id: 'team-preto', name: 'Time Preto', color: '#1A1A1A', shieldUrl: '/escudo3atual2.png' },
  { id: 'team-legends', name: 'Legends', color: '#E5B80B', shieldUrl: '/escudo3atual2.png' }
];


export interface Log {
  id: string;
  action: string;
  details: string;
  createdAt: string;
}

export interface DatabaseSchema {
  admins: Admin[];
  stickers: Sticker[];
  players: Player[];
  championships: Championship[];
  prizes?: Prize[];
  packCreditLogs: PackCreditLog[];
  packOpenLogs: PackOpenLog[];
  recycleLogs: RecycleLog[];
  probabilitySettings: ProbabilitySettings;
  systemSettings: SystemSettings;
  logs: Log[];
  firstChampion?: FirstChampionInfo | null;
  rankingEvents?: RankingEvent[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Default initial stickers seed (30 stickers)
const INITIAL_STICKERS: Sticker[] = [
  // Time Branco (6)
  { id: 'BRA-01', number: 'BRA-01', name: 'Sube', team: 'Time Branco', image: '/uploads/img-1784136429079-ww483c.png', color: '#FFFFFF', rarity: 'Normal', description: 'Zagueiro clássico e líder nato do sistema defensivo.' },
  { id: 'BRA-02', number: 'BRA-02', name: 'Soldado', team: 'Time Branco', image: '/uploads/img-1784138340987-tmwjrt.png', color: '#FFFFFF', rarity: 'Normal', description: 'Goleiro de envergadura gigante e defesas seguras.' },
  { id: 'BRA-03', number: 'BRA-03', name: 'Guilherme Pinheiro', team: 'Time Branco', image: '/uploads/img-1784136487166-6vvl61.png', color: '#FFFFFF', rarity: 'Normal', description: 'O maestro que distribui passes milimétricos no meio campo.' },
  { id: 'BRA-04', number: 'BRA-04', name: 'Hélder', team: 'Time Branco', image: '/uploads/img-1784138352362-n7daq9.png', color: '#FFFFFF', rarity: 'Normal', description: 'Ponta habilidoso que rasga as defesas adversárias.' },
  { id: 'BRA-05', number: 'BRA-05', name: 'Enzo', team: 'Time Branco', image: '/uploads/img-1784136558420-4qk3oj.png', color: '#FFFFFF', rarity: 'Normal', description: 'Especialista em finalizações venenosas de longa distância.' },
  { id: 'BRA-06', number: 'BRA-06', name: 'Adrian Baranhuk', team: 'Time Branco', image: '/uploads/img-1784136576925-c31qit.png', color: '#FFFFFF', rarity: 'Normal', description: 'Lateral impecável na recomposição e no apoio ofensivo.' },

  // Time Preto (6)
  { id: 'PRE-01', number: 'PRE-01', name: 'Vitor Tanque', team: 'Time Preto', image: '/uploads/img-1784136605692-2cfs8r.png', color: '#1A1A1A', rarity: 'Normal', description: 'Centroavante de muita força física que joga de pivô.' },
  { id: 'PRE-02', number: 'PRE-02', name: 'Gabriel Raio', team: 'Time Preto', image: '/uploads/img-1784136627313-76t78g.png', color: '#1A1A1A', rarity: 'Normal', description: 'Extrema com velocidade máxima e arrancadas imparáveis.' },
  { id: 'PRE-03', number: 'PRE-03', name: 'Henrique Motor', team: 'Time Preto', image: '/uploads/img-1784136639431-hne2et.png', color: '#1A1A1A', rarity: 'Normal', description: 'Meio-campo aguerrido que corre o campo todo marcando.' },
  { id: 'PRE-04', number: 'PRE-04', name: 'Mateus Xerife', team: 'Time Preto', image: '/uploads/img-1784136651907-yakmdx.png', color: '#1A1A1A', rarity: 'Normal', description: 'Zagueiro central imponente com desarme preciso por baixo.' },
  { id: 'PRE-05', number: 'PRE-05', name: 'Daniel Apoio', team: 'Time Preto', image: '/uploads/img-1784136671857-zgmaxa.png', color: '#1A1A1A', rarity: 'Normal', description: 'Lateral tático de cruzamentos cirúrgicos na grande área.' },
  { id: 'PRE-06', number: 'PRE-06', name: 'Goleiro Sombra', team: 'Time Preto', image: '/uploads/img-1784136849172-abykkt.png', color: '#1A1A1A', rarity: 'Normal', description: 'Goleiro de posicionamento excelente e saída de bola refinada.' },

  // Time Azul (6)
  { id: 'AZU-01', number: 'AZU-01', name: 'Denner Jesus', team: 'Time Azul', image: '/uploads/img-1784136703591-zoer9w.png', color: '#4FA8F4', rarity: 'Normal', description: 'Visão de jogo periférica e passes que quebram linhas.' },
  { id: 'AZU-02', number: 'AZU-02', name: 'Bruno Canhão', team: 'Time Azul', image: '/uploads/img-1784136723442-8c6sob.png', color: '#4FA8F4', rarity: 'Normal', description: 'Dono de uma canhota avassaladora em cobranças de falta.' },
  { id: 'AZU-03', number: 'AZU-03', name: 'Nicolas Técnico', team: 'Time Azul', image: '/uploads/img-1784136739257-yewasm.png', color: '#4FA8F4', rarity: 'Normal', description: 'Zagueiro construtor com excelente qualidade de passe.' },
  { id: 'AZU-04', number: 'AZU-04', name: 'Caio Driblador', team: 'Time Azul', image: '/uploads/img-1784136751774-0v046y.png', color: '#4FA8F4', rarity: 'Normal', description: 'O rei dos dribles em curto espaço físico. Improviso puro.' },
  { id: 'AZU-05', number: 'AZU-05', name: 'Rodrigo Firme', team: 'Time Azul', image: '/uploads/img-1784136860560-ywh2qc.png', color: '#4FA8F4', rarity: 'Normal', description: 'Defensor polivalente que atua em qualquer setor da zaga.' },
  { id: 'AZU-06', number: 'AZU-06', name: 'Igor Felino', team: 'Time Azul', image: '/uploads/img-1784136891144-jk9r8u.png', color: '#4FA8F4', rarity: 'Normal', description: 'Reflexos impressionantes à queima-roupa sob as traves.' },

  // Time Vermelho (6)
  { id: 'VER-01', number: 'VER-01', name: 'Chummy', team: 'Time Vermelho', image: '/uploads/img-1784136923872-nx53rr.png', color: '#EF4444', rarity: 'Normal', description: 'Faro de gol apurado. Sempre bem posicionado na área.' },
  { id: 'VER-02', number: 'VER-02', name: 'Nathan', team: 'Time Vermelho', image: '/uploads/img-1784136938806-c4isd4.png', color: '#EF4444', rarity: 'Normal', description: 'Cão de caça do meio de campo que não dá espaços.' },
  { id: 'VER-03', number: 'VER-03', name: 'Leonardo Torre', team: 'Time Vermelho', image: '/uploads/img-1784136955927-8jez8p.png', color: '#EF4444', rarity: 'Normal', description: 'Poder aéreo imbatível tanto no ataque quanto na defesa.' },
  { id: 'VER-04', number: 'VER-04', name: 'Samuel Meia', team: 'Time Vermelho', image: '/uploads/img-1784136966904-jyuhbw.png', color: '#EF4444', rarity: 'Normal', description: 'Infiltra na área de surpresa e tem ótima finalização.' },
  { id: 'VER-05', number: 'VER-05', name: 'Thiago Turbo', team: 'Time Vermelho', image: '/uploads/img-1784137143897-1fr5ki.png', color: '#EF4444', rarity: 'Normal', description: 'Aceleração vertical esmagadora pelas alas do campo.' },
  { id: 'VER-06', number: 'VER-06', name: 'Marcos Muralha', team: 'Time Vermelho', image: '/uploads/img-1784137155678-w03uf9.png', color: '#EF4444', rarity: 'Normal', description: 'Segurança absoluta nas saídas aéreas e liderança vocal.' },

  // Legends (6)
  { id: 'LEG-01', number: 'LEG-01', name: 'Diego Rivas', team: 'Legends', image: '/uploads/img-1784137002154-8k2hrv.png', color: '#E5B80B', rarity: 'Legend', description: 'Mão de Ferro - Goleiro lendário de defesas impossíveis em finais.' },
  { id: 'LEG-02', number: 'LEG-02', name: 'Leo Silva', team: 'Legends', image: '/uploads/img-1784137015715-iw6d1p.png', color: '#E5B80B', rarity: 'Legend', description: 'O Capitão - Legendary Striker, o maior goleador da história da Copa.' },
  { id: 'LEG-03', number: 'LEG-03', name: 'Mestre Astão', team: 'Legends', image: '', color: '#E5B80B', rarity: 'Legend', description: 'O criador e lenda máxima da competição. Técnica incomparável.' },
  { id: 'LEG-04', number: 'LEG-04', name: 'Ronaldinho Astão', team: 'Legends', image: '', color: '#E5B80B', rarity: 'Legend', description: 'Magia pura nos pés e alegria contagiante em campo.' },
  { id: 'LEG-05', number: 'LEG-05', name: 'Neymar Astão', team: 'Legends', image: '', color: '#E5B80B', rarity: 'Legend', description: 'O rei dos dribles mágicos e jogadas plásticas geniais.' },
  { id: 'LEG-06', number: 'LEG-06', name: 'Kaiser Astão', team: 'Legends', image: '', color: '#E5B80B', rarity: 'Legend', description: 'Defensor supremo e lendário que parou os melhores ataques.' }
];

// Initial default seed players for Copa Astão 2026
const INITIAL_PLAYERS: Player[] = [
  {
    id: 'player-chummy',
    fullName: 'Chummy Atleta',
    nickname: 'Chummy',
    accessCode: 'CHUMMY',
    passwordHash: null,
    hasPassword: false,
    team: 'Time Vermelho',
    photoUrl: '/uploads/img-1784136923872-nx53rr.png',
    status: 'active',
    purchasedPacks: 0,
    freePacks: 1,
    collectedStickers: {},
    completedAlbum: false,
    createdAt: new Date().toISOString(),
    lastAccessAt: null,
    championshipId: 'copa-astao-2026'
  },
  {
    id: 'player-china',
    fullName: 'China Atleta',
    nickname: 'China',
    accessCode: 'CHINA',
    passwordHash: null,
    hasPassword: false,
    team: 'Time Branco',
    photoUrl: '/uploads/img-1784136429079-ww483c.png',
    status: 'active',
    purchasedPacks: 0,
    freePacks: 1,
    collectedStickers: {},
    completedAlbum: false,
    createdAt: new Date().toISOString(),
    lastAccessAt: null,
    championshipId: 'copa-astao-2026'
  },
  {
    id: 'player-nathan',
    fullName: 'Nathan Atleta',
    nickname: 'Nathan',
    accessCode: 'NATHAN',
    passwordHash: null,
    hasPassword: false,
    team: 'Time Vermelho',
    photoUrl: '/uploads/img-1784136938806-c4isd4.png',
    status: 'active',
    purchasedPacks: 0,
    freePacks: 1,
    collectedStickers: {},
    completedAlbum: false,
    createdAt: new Date().toISOString(),
    lastAccessAt: null,
    championshipId: 'copa-astao-2026'
  },
  {
    id: 'player-ph',
    fullName: 'Paulo Henrique',
    nickname: 'PH',
    accessCode: 'PH',
    passwordHash: null,
    hasPassword: false,
    team: 'Time Azul',
    photoUrl: '/uploads/img-1784136703591-zoer9w.png',
    status: 'active',
    purchasedPacks: 0,
    freePacks: 1,
    collectedStickers: {},
    completedAlbum: false,
    createdAt: new Date().toISOString(),
    lastAccessAt: null,
    championshipId: 'copa-astao-2026'
  },
  {
    id: 'player-pods',
    fullName: 'Pods Atleta',
    nickname: 'Pods',
    accessCode: 'PODS',
    passwordHash: null,
    hasPassword: false,
    team: 'Time Preto',
    photoUrl: '/uploads/img-1784136605692-2cfs8r.png',
    status: 'active',
    purchasedPacks: 0,
    freePacks: 1,
    collectedStickers: {},
    completedAlbum: false,
    createdAt: new Date().toISOString(),
    lastAccessAt: null,
    championshipId: 'copa-astao-2026'
  },
  {
    id: 'player-adrian',
    fullName: 'Adrian Baranhuk',
    nickname: 'Adrian',
    accessCode: 'ADRIAN',
    passwordHash: null,
    hasPassword: false,
    team: 'Time Branco',
    photoUrl: '/uploads/img-1784136576925-c31qit.png',
    status: 'active',
    purchasedPacks: 0,
    freePacks: 1,
    collectedStickers: {},
    completedAlbum: false,
    createdAt: new Date().toISOString(),
    lastAccessAt: null,
    championshipId: 'copa-astao-2026'
  },
  {
    id: 'player-dias',
    fullName: 'Dias Atleta',
    nickname: 'Dias',
    accessCode: 'DIAS',
    passwordHash: null,
    hasPassword: false,
    team: 'Time Azul',
    photoUrl: '/uploads/img-1784136739257-yewasm.png',
    status: 'active',
    purchasedPacks: 0,
    freePacks: 1,
    collectedStickers: {},
    completedAlbum: false,
    createdAt: new Date().toISOString(),
    lastAccessAt: null,
    championshipId: 'copa-astao-2026'
  },
  {
    id: 'player-cruz',
    fullName: 'Cruz Atleta',
    nickname: 'Cruz',
    accessCode: 'CRUZ',
    passwordHash: null,
    hasPassword: false,
    team: 'Time Preto',
    photoUrl: '/uploads/img-1784136651907-yakmdx.png',
    status: 'active',
    purchasedPacks: 0,
    freePacks: 1,
    collectedStickers: {},
    completedAlbum: false,
    createdAt: new Date().toISOString(),
    lastAccessAt: null,
    championshipId: 'copa-astao-2026'
  }
];

export class Database {
  private static instance: Database;
  private cache: DatabaseSchema | null = null;

  private constructor() {
    this.ensureDbExists();
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  private ensureDbExists() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DB_FILE)) {
      const initialDb: DatabaseSchema = {
        admins: [
          {
            id: 'admin-1',
            username: 'admin',
            passwordHash: 'faz1leva3'
          }
        ],
        stickers: INITIAL_STICKERS,
        players: INITIAL_PLAYERS,
        championships: [
          {
            id: 'copa-astao-2026',
            name: 'Copa Astão 2026',
            year: 2026,
            status: 'active',
            createdAt: new Date().toISOString()
          }
        ],
        packCreditLogs: [],
        packOpenLogs: [],
        recycleLogs: [],
        probabilitySettings: {
          normalProbability: 90,
          legendProbability: 10
        },
        systemSettings: {
          countdownDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
          activeChampionshipId: 'copa-astao-2026',
          initialFreePacks: 1
        },
        logs: [
          { id: 'log-1', action: 'DB_INIT', details: 'Banco de dados com contas de jogadores inicializado.', createdAt: new Date().toISOString() }
        ]
      };

      fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf-8');
      this.cache = initialDb;
    } else {
      try {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(fileContent);

        // Ensure missing arrays are initialized for backward compatibility
        if (!parsed.players) parsed.players = INITIAL_PLAYERS;
        if (!parsed.championships) parsed.championships = [{ id: 'copa-astao-2026', name: 'Copa Astão 2026', year: 2026, status: 'active', createdAt: new Date().toISOString() }];
        if (!parsed.packCreditLogs) parsed.packCreditLogs = [];
        if (!parsed.packOpenLogs) parsed.packOpenLogs = [];
        if (!parsed.recycleLogs) parsed.recycleLogs = [];
        if (!parsed.systemSettings) parsed.systemSettings = { countdownDate: new Date().toISOString(), activeChampionshipId: 'copa-astao-2026', initialFreePacks: 1 };
        if (!parsed.systemSettings.activeChampionshipId) parsed.systemSettings.activeChampionshipId = 'copa-astao-2026';
        if (parsed.systemSettings.initialFreePacks === undefined) parsed.systemSettings.initialFreePacks = 1;

        this.cache = parsed;
      } catch (err) {
        console.error('Error reading database file, resetting schema...', err);
        if (fs.existsSync(DB_FILE)) {
          fs.renameSync(DB_FILE, DB_FILE + '.corrupted.' + Date.now());
        }
        this.cache = null;
        this.ensureDbExists();
      }
    }
  }

  private load(): DatabaseSchema {
    this.ensureDbExists();
    if (this.cache) return this.cache;
    const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
    this.cache = JSON.parse(fileContent);
    return this.cache!;
  }

  private save(data: DatabaseSchema) {
    this.cache = data;
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  }

  // LOGS
  public getSystemLogs(): Log[] {
    return this.load().logs || [];
  }

  public addLog(action: string, details: string) {
    const db = this.load();
    const newLog: Log = {
      id: 'log-' + Math.random().toString(36).substr(2, 9),
      action,
      details,
      createdAt: new Date().toISOString()
    };
    db.logs.unshift(newLog);
    if (db.logs.length > 500) {
      db.logs = db.logs.slice(0, 500);
    }
    this.save(db);
  }

  // ADMINS
  public getAdmins(): Admin[] {
    return this.load().admins;
  }

  public validateAdmin(username: string, passwordPlain: string): Admin | null {
    const admins = this.getAdmins();
    const found = admins.find(a => a.username.toLowerCase() === username.toLowerCase() && a.passwordHash === passwordPlain);
    if (found) {
      this.addLog('ADMIN_LOGIN_SUCCESS', `Admin '${username}' logado com sucesso.`);
      return found;
    } else {
      this.addLog('ADMIN_LOGIN_FAILED', `Tentativa de login de Admin inválida para '${username}'.`);
      return null;
    }
  }

  // PLAYERS & AUTHENTICATION
  public getPlayers(): Player[] {
    return this.load().players || [];
  }

  public getPlayerByAccessCode(accessCode: string): Player | undefined {
    const codeUpper = accessCode.trim().toUpperCase();
    return this.getPlayers().find(p => p.accessCode.toUpperCase() === codeUpper);
  }

  public getPlayerById(id: string): Player | undefined {
    return this.getPlayers().find(p => p.id === id);
  }

  public validatePlayerLogin(accessCode: string, passwordPlain?: string): {
    status: 'SUCCESS' | 'NEEDS_PASSWORD_SETUP' | 'INVALID_PASSWORD' | 'INACTIVE_ACCOUNT' | 'NOT_FOUND';
    player?: Player;
    error?: string;
  } {
    const db = this.load();
    const player = this.getPlayerByAccessCode(accessCode);

    if (!player) {
      return { status: 'NOT_FOUND', error: 'Código de acesso não encontrado.' };
    }

    if (player.status === 'inactive') {
      return { status: 'INACTIVE_ACCOUNT', error: 'Esta conta de jogador está inativa. Fale com o administrador.' };
    }

    // First access logic: player has no password configured yet
    if (!player.hasPassword || !player.passwordHash) {
      return { status: 'NEEDS_PASSWORD_SETUP', player };
    }

    if (!passwordPlain) {
      return { status: 'INVALID_PASSWORD', error: 'Informe sua senha para entrar.' };
    }

    if (player.passwordHash !== passwordPlain) {
      return { status: 'INVALID_PASSWORD', error: 'Senha incorreta. Tente novamente.' };
    }

    // Success
    player.lastAccessAt = new Date().toISOString();
    this.save(db);
    this.addLog('PLAYER_LOGIN', `Jogador '${player.nickname}' (${player.accessCode}) realizou login.`);

    return { status: 'SUCCESS', player };
  }

  public setupPlayerPassword(accessCode: string, newPasswordPlain: string): { success: boolean; player?: Player; error?: string } {
    const db = this.load();
    const player = db.players.find(p => p.accessCode.toUpperCase() === accessCode.trim().toUpperCase());

    if (!player) {
      return { success: false, error: 'Jogador não encontrado.' };
    }

    if (!newPasswordPlain || newPasswordPlain.trim().length < 3) {
      return { success: false, error: 'A senha deve conter no mínimo 3 caracteres.' };
    }

    player.passwordHash = newPasswordPlain.trim();
    player.hasPassword = true;
    player.lastAccessAt = new Date().toISOString();

    this.save(db);
    this.addLog('PLAYER_PASSWORD_CREATED', `Senha criada com sucesso para o jogador '${player.nickname}'.`);

    return { success: true, player };
  }

  public addPlayer(playerData: {
    fullName: string;
    nickname: string;
    accessCode: string;
    team: string;
    photoUrl?: string;
    purchasedPacks?: number;
    freePacks?: number;
  }): { success: boolean; player?: Player; error?: string } {
    const db = this.load();
    const formattedCode = playerData.accessCode.trim().toUpperCase();

    if (!formattedCode) {
      return { success: false, error: 'Código de acesso é obrigatório.' };
    }

    // Uniqueness check
    if (db.players.some(p => p.accessCode.toUpperCase() === formattedCode)) {
      return { success: false, error: `O código de acesso '${formattedCode}' já pertence a outro jogador.` };
    }

    const defaultInitialFreePacks = db.systemSettings.initialFreePacks !== undefined ? db.systemSettings.initialFreePacks : 1;
    const initialFree = playerData.freePacks !== undefined ? playerData.freePacks : defaultInitialFreePacks;
    const initialPurchased = playerData.purchasedPacks !== undefined ? playerData.purchasedPacks : 0;

    const newPlayer: Player = {
      id: 'player-' + Math.random().toString(36).substr(2, 9),
      fullName: playerData.fullName.trim(),
      nickname: playerData.nickname.trim(),
      accessCode: formattedCode,
      passwordHash: null,
      hasPassword: false,
      team: playerData.team || 'Time Branco',
      photoUrl: playerData.photoUrl || '',
      status: 'active',
      purchasedPacks: initialPurchased,
      freePacks: initialFree,
      collectedStickers: {},
      completedAlbum: false,
      createdAt: new Date().toISOString(),
      lastAccessAt: null,
      championshipId: db.systemSettings.activeChampionshipId || 'copa-astao-2026'
    };

    db.players.push(newPlayer);
    this.save(db);
    this.addLog('PLAYER_CREATED', `Jogador criado: ${newPlayer.fullName} (${newPlayer.accessCode})`);

    return { success: true, player: newPlayer };
  }

  public updatePlayer(id: string, fields: Partial<Player>): { success: boolean; player?: Player; error?: string } {
    const db = this.load();
    const index = db.players.findIndex(p => p.id === id);
    if (index === -1) return { success: false, error: 'Jogador não encontrado.' };

    if (fields.accessCode) {
      const formattedCode = fields.accessCode.trim().toUpperCase();
      const existing = db.players.find(p => p.id !== id && p.accessCode.toUpperCase() === formattedCode);
      if (existing) {
        return { success: false, error: `O código de acesso '${formattedCode}' já pertence a outro jogador.` };
      }
      fields.accessCode = formattedCode;
    }

    // Delete old photo if photoUrl changed
    if (fields.photoUrl !== undefined && fields.photoUrl !== db.players[index].photoUrl) {
      if (db.players[index].photoUrl) {
        this.deleteStorageFile(db.players[index].photoUrl);
      }
    }

    db.players[index] = {
      ...db.players[index],
      ...fields
    };

    this.save(db);
    this.addLog('PLAYER_UPDATED', `Dados do jogador '${db.players[index].nickname}' foram atualizados.`);

    return { success: true, player: db.players[index] };
  }

  public deletePlayer(id: string): boolean {
    const db = this.load();
    const index = db.players.findIndex(p => p.id === id);
    if (index === -1) return false;

    const player = db.players[index];
    if (player.photoUrl) {
      this.deleteStorageFile(player.photoUrl);
    }

    db.players.splice(index, 1);
    this.save(db);
    this.addLog('PLAYER_DELETED', `Jogador '${player.nickname}' foi excluído.`);
    return true;
  }

  public togglePlayerStatus(id: string): { success: boolean; newStatus?: 'active' | 'inactive' } {
    const db = this.load();
    const player = db.players.find(p => p.id === id);
    if (!player) return { success: false };

    player.status = player.status === 'active' ? 'inactive' : 'active';
    this.save(db);
    this.addLog('PLAYER_STATUS_TOGGLED', `Status do jogador '${player.nickname}' alterado para ${player.status}.`);
    return { success: true, newStatus: player.status };
  }

  public resetPlayerPassword(id: string): { success: boolean } {
    const db = this.load();
    const player = db.players.find(p => p.id === id);
    if (!player) return { success: false };

    player.passwordHash = null;
    player.hasPassword = false;
    this.save(db);
    this.addLog('PLAYER_PASSWORD_RESET', `Senha do jogador '${player.nickname}' foi resetada pelo administrador.`);
    return { success: true };
  }

  // PACK CREDITS ADJUSTMENT (ADMIN "PACOTES")
  public adjustPlayerPacks(
    playerId: string,
    type: 'purchased' | 'free',
    amount: number,
    reason: 'Compra' | 'Bônus' | 'Reciclagem' | 'Premiação' | 'Ajuste Manual' | 'Conclusão de Álbum',
    adminUsername: string
  ): { success: boolean; player?: Player; error?: string } {
    const db = this.load();
    const player = db.players.find(p => p.id === playerId);
    if (!player) return { success: false, error: 'Jogador não encontrado.' };

    if (type === 'purchased') {
      player.purchasedPacks = Math.max(0, player.purchasedPacks + amount);
    } else {
      player.freePacks = Math.max(0, player.freePacks + amount);
    }

    const logEntry: PackCreditLog = {
      id: 'log-' + Math.random().toString(36).substr(2, 9),
      playerId: player.id,
      playerNickname: player.nickname,
      type,
      amount,
      adminUsername,
      reason,
      createdAt: new Date().toISOString()
    };

    db.packCreditLogs.unshift(logEntry);
    this.save(db);

    this.addLog(
      'PACK_CREDIT_ADJUSTED',
      `Admin '${adminUsername}' alterou ${amount > 0 ? '+' : ''}${amount} pacote(s) (${type}) para '${player.nickname}'. Motivo: ${reason}`
    );

    return { success: true, player };
  }

  // STICKERS (CRUD)
  public getStickers(): Sticker[] {
    return this.load().stickers;
  }

  public getStickerById(id: string): Sticker | undefined {
    return this.getStickers().find(s => s.id === id);
  }

  public addSticker(sticker: Omit<Sticker, 'id'> & { id?: string }): Sticker {
    const db = this.load();
    const id = sticker.id || `${sticker.team.substring(0, 3).toUpperCase()}-${String(db.stickers.length + 1).padStart(2, '0')}`;
    const newSticker: Sticker = {
      ...sticker,
      id
    };
    db.stickers.push(newSticker);
    this.save(db);
    this.addLog('STICKER_CREATED', `Figurinha criada: ${newSticker.name} (${newSticker.id})`);
    return newSticker;
  }

  public updateSticker(id: string, updatedFields: Partial<Omit<Sticker, 'id'>>): Sticker | null {
    const db = this.load();
    const index = db.stickers.findIndex(s => s.id === id);
    if (index === -1) return null;

    if (updatedFields.image !== undefined && updatedFields.image !== db.stickers[index].image) {
      if (db.stickers[index].image) {
        this.deleteStorageFile(db.stickers[index].image);
      }
    }

    db.stickers[index] = {
      ...db.stickers[index],
      ...updatedFields
    };
    this.save(db);
    this.addLog('STICKER_UPDATED', `Figurinha atualizada: ${db.stickers[index].name} (${id})`);
    return db.stickers[index];
  }

  // HELPER TO DELETE FILE FROM STORAGE IF EXISTS
  public deleteStorageFile(url?: string | null): boolean {
    if (!url || !url.startsWith('/uploads/')) return false;
    try {
      const relativePath = url.replace(/^\/uploads\//, '');
      const fullPath = path.join(process.cwd(), 'data', 'uploads', relativePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        return true;
      }
    } catch (err) {
      console.error('Error deleting file from storage:', err);
    }
    return false;
  }

  public deleteSticker(id: string): boolean {
    const db = this.load();
    const index = db.stickers.findIndex(s => s.id === id);
    if (index === -1) return false;

    const sticker = db.stickers[index];
    if (sticker.image) {
      this.deleteStorageFile(sticker.image);
    }

    db.stickers.splice(index, 1);
    this.save(db);
    this.addLog('STICKER_DELETED', `Figurinha removida: ${sticker.name} (${id})`);
    return true;
  }

  public addStickersBulk(stickers: Array<Omit<Sticker, 'id'> & { id?: string }>): Sticker[] {
    const db = this.load();
    const created: Sticker[] = [];

    stickers.forEach((sticker) => {
      const id = sticker.id || `${sticker.team.substring(0, 3).toUpperCase()}-${String(db.stickers.length + 1).padStart(2, '0')}`;
      const newSticker: Sticker = {
        ...sticker,
        id
      };
      db.stickers.push(newSticker);
      created.push(newSticker);
    });

    this.save(db);
    this.addLog('STICKERS_BULK_CREATED', `${created.length} figurinhas criadas em lote.`);
    return created;
  }

  // CHAMPIONSHIPS
  public getChampionships(): Championship[] {
    return this.load().championships || [];
  }

  public getChampionshipById(id: string): Championship | undefined {
    return this.getChampionships().find(c => c.id === id);
  }

  public addChampionship(data: Partial<Championship> & { name: string; year: number }): Championship {
    const db = this.load();
    const id = 'champ-' + Math.random().toString(36).substr(2, 9);
    const newChamp: Championship = {
      id,
      name: data.name,
      year: data.year,
      logoUrl: data.logoUrl || '/escudo3atual2.png',
      description: data.description || 'Nova Edição da Copa Astão',
      startDate: data.startDate || new Date().toISOString().split('T')[0],
      endDate: data.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: data.status || 'active',
      stickersCount: data.stickersCount || 30,
      playersCount: data.playersCount || 0,
      legendsCount: data.legendsCount || 6,
      normalProbability: data.normalProbability || 90,
      legendProbability: data.legendProbability || 10,
      createdAt: new Date().toISOString()
    };

    if (!db.championships) db.championships = [];
    db.championships.unshift(newChamp);
    this.save(db);
    this.addLog('CHAMPIONSHIP_CREATED', `Novo campeonato criado: ${data.name} (${data.year})`);
    return newChamp;
  }

  public updateChampionship(id: string, fields: Partial<Championship>): Championship | null {
    const db = this.load();
    if (!db.championships) return null;
    const idx = db.championships.findIndex(c => c.id === id);
    if (idx === -1) return null;

    db.championships[idx] = {
      ...db.championships[idx],
      ...fields
    };
    this.save(db);
    this.addLog('CHAMPIONSHIP_UPDATED', `Campeonato atualizado: ${db.championships[idx].name}`);
    return db.championships[idx];
  }

  public closeChampionship(id: string): Championship | null {
    return this.updateChampionship(id, { status: 'closed' });
  }

  public archiveChampionship(id: string): Championship | null {
    return this.updateChampionship(id, { status: 'archived' });
  }

  public duplicateChampionship(id: string): Championship | null {
    const existing = this.getChampionshipById(id);
    if (!existing) return null;

    const dup = this.addChampionship({
      ...existing,
      name: `${existing.name} (Cópia)`,
      year: existing.year + 1,
      status: 'active'
    });
    this.addLog('CHAMPIONSHIP_DUPLICATED', `Campeonato duplicado de: ${existing.name}`);
    return dup;
  }

  public setActiveChampionship(id: string): boolean {
    const db = this.load();
    if (!db.championships.some(c => c.id === id)) return false;
    db.systemSettings.activeChampionshipId = id;
    this.save(db);
    this.addLog('ACTIVE_CHAMPIONSHIP_SET', `Campeonato ativo definido para: ${id}`);
    return true;
  }

  // PRIZES / PREMIAÇÕES
  public getPrizes(): Prize[] {
    const db = this.load();
    if (!db.prizes || db.prizes.length === 0) {
      db.prizes = [
        {
          id: 'prize-1',
          name: '1 Mês de Futebol Grátis',
          description: 'Isenção total da mensalidade do futebol para o 1º lugar do ranking.',
          imageUrl: '/uploads/img-1784137002154-8k2hrv.png',
          quantity: 1,
          deliveryCriteria: '1º Lugar Geral do Ranking ou Primeiro a Completar o Álbum',
          createdAt: new Date().toISOString()
        },
        {
          id: 'prize-2',
          name: 'Camisa Oficial Copa Astão',
          description: 'Manto oficial exclusivo com personalização da edição.',
          imageUrl: '/copa26.png',
          quantity: 3,
          deliveryCriteria: 'Top 3 do Ranking Geral',
          createdAt: new Date().toISOString()
        },
        {
          id: 'prize-3',
          name: 'Troféu & Medalha do Álbum',
          description: 'Troféu físico gravado com o nome do colecionador campeão.',
          imageUrl: '/escudo3atual2.png',
          quantity: 1,
          deliveryCriteria: 'Primeiro colecionador a completar 100% do álbum',
          createdAt: new Date().toISOString()
        }
      ];
      this.save(db);
    }
    return db.prizes;
  }

  public addPrize(prizeData: Omit<Prize, 'id' | 'createdAt'>): Prize {
    const db = this.load();
    if (!db.prizes) db.prizes = [];
    const newPrize: Prize = {
      ...prizeData,
      id: 'prize-' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    db.prizes.unshift(newPrize);
    this.save(db);
    this.addLog('PRIZE_CREATED', `Prêmio cadastrado: ${newPrize.name}`);
    return newPrize;
  }

  public updatePrize(id: string, fields: Partial<Omit<Prize, 'id'>>): Prize | null {
    const db = this.load();
    if (!db.prizes) return null;
    const idx = db.prizes.findIndex(p => p.id === id);
    if (idx === -1) return null;

    if (fields.imageUrl !== undefined && fields.imageUrl !== db.prizes[idx].imageUrl) {
      this.deleteStorageFile(db.prizes[idx].imageUrl);
    }

    db.prizes[idx] = {
      ...db.prizes[idx],
      ...fields
    };
    this.save(db);
    this.addLog('PRIZE_UPDATED', `Prêmio atualizado: ${db.prizes[idx].name}`);
    return db.prizes[idx];
  }

  public deletePrize(id: string): boolean {
    const db = this.load();
    if (!db.prizes) return false;
    const idx = db.prizes.findIndex(p => p.id === id);
    if (idx === -1) return false;

    const prize = db.prizes[idx];
    if (prize.imageUrl) {
      this.deleteStorageFile(prize.imageUrl);
    }

    db.prizes.splice(idx, 1);
    this.save(db);
    this.addLog('PRIZE_DELETED', `Prêmio removido: ${prize.name}`);
    return true;
  }

  // PROBABILITIES & SYSTEM SETTINGS
  public getProbabilitySettings(): ProbabilitySettings {
    return this.load().probabilitySettings;
  }

  public updateProbabilitySettings(normal: number, legend: number) {
    const db = this.load();
    db.probabilitySettings = {
      normalProbability: normal,
      legendProbability: legend
    };
    this.save(db);
    this.addLog('PROBABILITY_SETTINGS_UPDATED', `Novas probabilidades: Normais = ${normal}%, Legends = ${legend}%`);
    return db.probabilitySettings;
  }

  public getSystemSettings(): SystemSettings {
    const raw = (this.load().systemSettings || {}) as Partial<SystemSettings>;
    const sys: SystemSettings = {
      countdownDate: raw.countdownDate || '2026-11-01T08:00:00.000Z',
      activeChampionshipId: raw.activeChampionshipId || 'copa_astao_2026',
      initialFreePacks: raw.initialFreePacks !== undefined ? raw.initialFreePacks : 1,
      logoUrl: raw.logoUrl || '/escudo3atual2.png',
      albumCoverUrl: raw.albumCoverUrl || '/copa26.png',
      packCoverUrl: raw.packCoverUrl,
      homeBackgroundUrl: raw.homeBackgroundUrl,
      rankingBackgroundUrl: raw.rankingBackgroundUrl,
      globalBackgroundUrl: raw.globalBackgroundUrl,
      teams: raw.teams && raw.teams.length > 0 ? raw.teams : DEFAULT_TEAMS,
      countdownConfig: raw.countdownConfig
    };
    return sys;
  }

  public updateSystemSettings(updates: Partial<SystemSettings>) {
    const db = this.load();
    const current = this.getSystemSettings();

    // If logo was changed or removed, delete old image file if needed
    if (updates.logoUrl !== undefined && updates.logoUrl !== current.logoUrl) {
      if (current.logoUrl && current.logoUrl.startsWith('/uploads/')) {
        this.deleteStorageFile(current.logoUrl);
      }
    }

    // If album cover was changed
    if (updates.albumCoverUrl !== undefined && updates.albumCoverUrl !== current.albumCoverUrl) {
      if (current.albumCoverUrl && current.albumCoverUrl.startsWith('/uploads/')) {
        this.deleteStorageFile(current.albumCoverUrl);
      }
    }

    db.systemSettings = {
      ...current,
      ...updates,
      countdownDate: updates.countdownDate || current.countdownDate || '2026-11-01T08:00:00.000Z',
      activeChampionshipId: updates.activeChampionshipId || current.activeChampionshipId || 'copa-astao-2026',
      initialFreePacks: updates.initialFreePacks !== undefined && !isNaN(updates.initialFreePacks)
        ? Math.max(0, updates.initialFreePacks)
        : current.initialFreePacks,
      countdownConfig: updates.countdownConfig !== undefined
        ? updates.countdownConfig
        : current.countdownConfig,
      rewardsBannerConfig: updates.rewardsBannerConfig !== undefined
        ? updates.rewardsBannerConfig
        : current.rewardsBannerConfig
    };
    this.save(db);
    this.addLog('SYSTEM_SETTINGS_UPDATED', 'Configurações do sistema, contagem regressiva e imagens foram atualizadas.');
    return db.systemSettings;
  }


  // INTELLIGENT WEIGHTED CARD SELECTION ALGORITHM
  private calculateCardWeight(cardId: string, currentCounts: Record<string, number>, isAlbumCompleted: boolean): number {
    if (isAlbumCompleted) {
      return 1; // Equal weights after album is completed
    }
    const count = currentCounts[cardId] || 0;
    if (count === 0) return 100; // Never found
    if (count === 1) return 25;  // Found once
    if (count === 2) return 8;   // Found twice
    return 2;                    // Found 3+ times
  }

  private weightedRandomSelect(candidates: Sticker[], currentCounts: Record<string, number>, isAlbumCompleted: boolean): Sticker {
    if (candidates.length === 0) {
      throw new Error('Nenhum candidato disponível para sorteio.');
    }
    if (candidates.length === 1) {
      return candidates[0];
    }

    const weights = candidates.map(c => this.calculateCardWeight(c.id, currentCounts, isAlbumCompleted));
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

  // OPEN PLAYER PACK (Backend Authoritative Draw)
  public openPlayerPack(playerId: string): {
    success: boolean;
    error?: string;
    stickers?: Sticker[];
    userProfile?: UserProfile;
    usedFreePack?: boolean;
    justCompletedAlbum?: boolean;
  } {
    const db = this.load();
    const player = db.players.find(p => p.id === playerId);

    if (!player) {
      return { success: false, error: 'Jogador não encontrado.' };
    }

    const totalAvailable = player.freePacks + player.purchasedPacks;
    if (totalAvailable <= 0) {
      return { success: false, error: 'Você não possui pacotes disponíveis.' };
    }

    // Determine pack consumed (Free packs first, then purchased)
    let usedFreePack = false;
    if (player.freePacks > 0) {
      player.freePacks -= 1;
      usedFreePack = true;
    } else {
      player.purchasedPacks -= 1;
      usedFreePack = false;
    }

    const allStickers = db.stickers;
    const settings = db.probabilitySettings;

    const totalUniqueAvailable = allStickers.length;
    const uniqueOwnedCount = Object.keys(player.collectedStickers).filter(k => (player.collectedStickers[k] || 0) > 0).length;
    const isAlbumCompleted = uniqueOwnedCount >= totalUniqueAvailable && totalUniqueAvailable > 0;

    const selectedStickers: Sticker[] = [];
    const tempCounts = { ...player.collectedStickers };

    for (let i = 0; i < 3; i++) {
      const roll = Math.random() * 100;
      let targetRarity: 'Normal' | 'Legend' = roll < settings.legendProbability ? 'Legend' : 'Normal';

      // Candidate list of target rarity not yet selected in this pack
      let candidates = allStickers.filter(
        s => s.rarity === targetRarity && !selectedStickers.some(sel => sel.id === s.id)
      );

      if (candidates.length === 0) {
        const otherRarity = targetRarity === 'Normal' ? 'Legend' : 'Normal';
        candidates = allStickers.filter(
          s => s.rarity === otherRarity && !selectedStickers.some(sel => sel.id === s.id)
        );
      }

      if (candidates.length === 0) {
        candidates = allStickers.filter(s => !selectedStickers.some(sel => sel.id === s.id));
      }

      if (candidates.length === 0) {
        candidates = allStickers;
      }

      const chosen = this.weightedRandomSelect(candidates, tempCounts, isAlbumCompleted);
      selectedStickers.push(chosen);
      tempCounts[chosen.id] = (tempCounts[chosen.id] || 0) + 1;
    }

    // Apply cards to player's collection
    selectedStickers.forEach(s => {
      player.collectedStickers[s.id] = (player.collectedStickers[s.id] || 0) + 1;
    });

    const playerPacksOpened = db.packOpenLogs.filter(l => l.playerId === player.id).length + 1;

    // Check if album completed just now
    const newUniqueOwnedCount = Object.keys(player.collectedStickers).filter(k => (player.collectedStickers[k] || 0) > 0).length;
    let justCompletedAlbum = false;

    if (!player.completedAlbum && newUniqueOwnedCount >= totalUniqueAvailable && totalUniqueAvailable > 0) {
      player.completedAlbum = true;
      player.completedAt = new Date().toISOString();
      player.freePacks += 5; // +5 Bonus Free Packs for completing album!
      justCompletedAlbum = true;

      // Check if this is the first champion in history!
      if (!db.firstChampion) {
        db.firstChampion = {
          playerId: player.id,
          nickname: player.nickname,
          fullName: player.fullName,
          photoUrl: player.photoUrl,
          completedAt: player.completedAt,
          packsOpened: playerPacksOpened
        };
      }

      // Log credit bonus
      db.packCreditLogs.unshift({
        id: 'log-' + Math.random().toString(36).substr(2, 9),
        playerId: player.id,
        playerNickname: player.nickname,
        type: 'free',
        amount: 5,
        adminUsername: 'Sistema (Bônus Conclusão)',
        reason: 'Conclusão de Álbum',
        createdAt: new Date().toISOString()
      });
    }

    // Log pack opening
    const openLog: PackOpenLog = {
      id: 'open-' + Math.random().toString(36).substr(2, 9),
      playerId: player.id,
      playerNickname: player.nickname,
      stickersObtained: selectedStickers.map(s => s.id),
      usedFreePack,
      openedAt: new Date().toISOString()
    };
    db.packOpenLogs.unshift(openLog);

    // RANKING EVENTS GENERATION
    if (!db.rankingEvents) db.rankingEvents = [];

    // 1. First pack opened event
    if (playerPacksOpened === 1) {
      db.rankingEvents.unshift({
        id: 'evt-' + Math.random().toString(36).substr(2, 9),
        playerId: player.id,
        playerNickname: player.nickname,
        playerPhotoUrl: player.photoUrl,
        type: 'first_pack',
        message: `${player.nickname} abriu o seu primeiro pacote!`,
        createdAt: new Date().toISOString()
      });
    }

    // 2. Legend cards found
    selectedStickers.forEach(st => {
      if (st.rarity === 'Legend') {
        db.rankingEvents!.unshift({
          id: 'evt-' + Math.random().toString(36).substr(2, 9),
          playerId: player.id,
          playerNickname: player.nickname,
          playerPhotoUrl: player.photoUrl,
          type: 'legend',
          message: `${player.nickname} encontrou uma Legend (${st.name})!`,
          createdAt: new Date().toISOString()
        });
      }
    });

    // 3. Team completion event check
    const teamsList: ('Time Branco' | 'Time Preto' | 'Time Azul' | 'Time Vermelho')[] = [
      'Time Branco', 'Time Preto', 'Time Azul', 'Time Vermelho'
    ];
    teamsList.forEach(tName => {
      const teamStickers = allStickers.filter(s => s.team === tName);
      if (teamStickers.length > 0) {
        const ownedInTeam = teamStickers.filter(s => (player.collectedStickers[s.id] || 0) > 0).length;
        const drawnFromThisTeam = selectedStickers.some(s => s.team === tName);
        if (ownedInTeam === teamStickers.length && drawnFromThisTeam) {
          db.rankingEvents!.unshift({
            id: 'evt-' + Math.random().toString(36).substr(2, 9),
            playerId: player.id,
            playerNickname: player.nickname,
            playerPhotoUrl: player.photoUrl,
            type: 'team',
            message: `${player.nickname} completou o ${tName}!`,
            createdAt: new Date().toISOString()
          });
        }
      }
    });

    // 4. Album completed event
    if (justCompletedAlbum) {
      db.rankingEvents.unshift({
        id: 'evt-' + Math.random().toString(36).substr(2, 9),
        playerId: player.id,
        playerNickname: player.nickname,
        playerPhotoUrl: player.photoUrl,
        type: 'album',
        message: `🏆 ${player.nickname} completou 100% do álbum!`,
        createdAt: new Date().toISOString()
      });
    }

    if (db.rankingEvents.length > 50) {
      db.rankingEvents = db.rankingEvents.slice(0, 50);
    }

    this.save(db);
    this.addLog(
      'PLAYER_PACK_OPENED',
      `Jogador '${player.nickname}' abriu 1 pacote (${usedFreePack ? 'Grátis' : 'Comprado'}): [${selectedStickers.map(s => s.name).join(', ')}]`
    );

    return {
      success: true,
      stickers: selectedStickers,
      userProfile: this.getProfileForPlayer(player),
      usedFreePack,
      justCompletedAlbum
    };
  }

  // RECYCLING: Swap 5 duplicates for 1 Free Pack
  public recyclePlayerCards(playerId: string): { success: boolean; error?: string; userProfile?: UserProfile } {
    const db = this.load();
    const player = db.players.find(p => p.id === playerId);

    if (!player) {
      return { success: false, error: 'Jogador não encontrado.' };
    }

    // Calculate total accumulated repeated stickers
    let totalRepeated = 0;
    Object.values(player.collectedStickers).forEach(count => {
      if (count > 1) {
        totalRepeated += (count - 1);
      }
    });

    if (totalRepeated < 5) {
      return { success: false, error: 'Você precisa de pelo menos 5 figurinhas repetidas para realizar a troca.' };
    }

    // Add 1 Free Pack
    player.freePacks += 1;

    // To consume 5 duplicates from counts, decrement 5 duplicate copies from collection counts (keeping at least 1 copy)
    let neededToDeduct = 5;
    for (const cardId in player.collectedStickers) {
      if (neededToDeduct <= 0) break;
      const count = player.collectedStickers[cardId];
      if (count > 1) {
        const canDeduct = Math.min(neededToDeduct, count - 1);
        player.collectedStickers[cardId] -= canDeduct;
        neededToDeduct -= canDeduct;
      }
    }

    // Log recycling
    const recycleLog: RecycleLog = {
      id: 'rec-' + Math.random().toString(36).substr(2, 9),
      playerId: player.id,
      playerNickname: player.nickname,
      consumedCount: 5,
      freePacksAwarded: 1,
      createdAt: new Date().toISOString()
    };
    db.recycleLogs.unshift(recycleLog);

    db.packCreditLogs.unshift({
      id: 'log-' + Math.random().toString(36).substr(2, 9),
      playerId: player.id,
      playerNickname: player.nickname,
      type: 'free',
      amount: 1,
      adminUsername: 'Sistema (Reciclagem)',
      reason: 'Reciclagem',
      createdAt: new Date().toISOString()
    });

    if (!db.rankingEvents) db.rankingEvents = [];
    db.rankingEvents.unshift({
      id: 'evt-' + Math.random().toString(36).substr(2, 9),
      playerId: player.id,
      playerNickname: player.nickname,
      playerPhotoUrl: player.photoUrl,
      type: 'recycle',
      message: `${player.nickname} reciclou 5 repetidas.`,
      createdAt: new Date().toISOString()
    });
    if (db.rankingEvents.length > 50) {
      db.rankingEvents = db.rankingEvents.slice(0, 50);
    }

    this.save(db);
    this.addLog('PLAYER_RECYCLED', `Jogador '${player.nickname}' trocou 5 figurinhas repetidas por +1 pacote grátis.`);

    return {
      success: true,
      userProfile: this.getProfileForPlayer(player)
    };
  }

  // COMPUTE BADGES FOR A PLAYER
  public computeBadgesForPlayer(
    player: Player,
    packsOpened: number,
    recyclesCount: number,
    isFirstChampion: boolean,
    allStickers: Sticker[]
  ): Badge[] {
    const totalUniqueAvailable = allStickers.length || 30;
    const legendStickers = allStickers.filter(s => s.rarity === 'Legend');
    const totalLegendsAvailable = legendStickers.length;

    let uniqueOwned = 0;
    let legendsOwned = 0;

    Object.entries(player.collectedStickers || {}).forEach(([cardId, count]) => {
      if (count > 0) {
        uniqueOwned++;
        const st = allStickers.find(s => s.id === cardId);
        if (st && st.rarity === 'Legend') {
          legendsOwned++;
        }
      }
    });

    const isCompleted = player.completedAlbum || uniqueOwned >= totalUniqueAvailable;

    return [
      {
        id: 'first_pack',
        name: '🎯 Primeiro Pacote',
        description: 'Abriu pelo menos 1 pacote de figurinhas.',
        icon: 'Target',
        unlocked: packsOpened >= 1
      },
      {
        id: 'first_legend',
        name: '⭐ Primeira Legend',
        description: 'Encontrou pelo menos 1 figurinha Legend.',
        icon: 'Star',
        unlocked: legendsOwned >= 1
      },
      {
        id: '10_stickers',
        name: '🔥 10 Figurinhas',
        description: 'Colecionou pelo menos 10 figurinhas diferentes.',
        icon: 'Flame',
        unlocked: uniqueOwned >= 10
      },
      {
        id: 'all_legends',
        name: '💎 Todas as Legends',
        description: 'Encontrou todas as cartas Legends do álbum.',
        icon: 'Gem',
        unlocked: totalLegendsAvailable > 0 && legendsOwned >= totalLegendsAvailable
      },
      {
        id: 'completed_album',
        name: '🏆 Álbum Completo',
        description: 'Completou 100% do álbum de figurinhas da Copa Astão 2026.',
        icon: 'Trophy',
        unlocked: isCompleted
      },
      {
        id: 'recycler',
        name: '♻ Mestre da Reciclagem',
        description: 'Realizou a troca de 5 figurinhas repetidas por pacote grátis.',
        icon: 'RefreshCw',
        unlocked: recyclesCount >= 1
      },
      {
        id: 'first_champion',
        name: '👑 Primeiro Campeão do Álbum',
        description: 'O primeiro colecionador a completar o álbum em definitivo na história.',
        icon: 'Crown',
        unlocked: isFirstChampion
      }
    ];
  }

  public getGlobalRanking() {
    return this.getRankingData();
  }

  // GET GLOBAL RANKING LEADERBOARD AND STATS
  public getRankingData(): {
    leaderboard: RankingPlayer[];
    stats: RankingStats;
    recentEvents: RankingEvent[];
    firstChampion: FirstChampionInfo | null;
  } {
    const db = this.load();
    const allStickers = db.stickers || [];
    const totalUniqueAvailable = allStickers.length || 30;

    const players = (db.players || []).filter(p => p.status === 'active');
    const packOpenLogs = db.packOpenLogs || [];
    const recycleLogs = db.recycleLogs || [];
    const firstChampion = db.firstChampion || null;

    const playerStatsList = players.map(p => {
      const playerPacksLogs = packOpenLogs.filter(l => l.playerId === p.id);
      const packsOpened = playerPacksLogs.length;
      const playerRecycleLogs = recycleLogs.filter(l => l.playerId === p.id);
      const recyclesCount = playerRecycleLogs.length;

      let uniqueOwned = 0;
      let repeatedCount = 0;
      let legendsOwned = 0;

      Object.entries(p.collectedStickers || {}).forEach(([cardId, count]) => {
        if (count > 0) {
          uniqueOwned++;
          if (count > 1) {
            repeatedCount += (count - 1);
          }
          const st = allStickers.find(s => s.id === cardId);
          if (st && st.rarity === 'Legend') {
            legendsOwned++;
          }
        }
      });

      const progress = Math.round((uniqueOwned / totalUniqueAvailable) * 100);
      const isCompleted = p.completedAlbum || uniqueOwned >= totalUniqueAvailable;

      const lastLog = playerPacksLogs[0];
      const lastStickerAt = lastLog ? lastLog.openedAt : null;

      const isFirstChamp = firstChampion?.playerId === p.id;
      const badges = this.computeBadgesForPlayer(p, packsOpened, recyclesCount, isFirstChamp, allStickers);

      return {
        id: p.id,
        nickname: p.nickname,
        fullName: p.fullName,
        team: p.team,
        photoUrl: p.photoUrl,
        uniqueStickers: uniqueOwned,
        totalStickersAvailable: totalUniqueAvailable,
        legendsCount: legendsOwned,
        progress,
        packsOpened,
        repeatedStickers: repeatedCount,
        completedAlbum: isCompleted,
        completedAt: p.completedAt || null,
        lastStickerAt,
        isFirstChampion: isFirstChamp,
        createdAt: p.createdAt,
        badges
      };
    });

    // SORT BY TIE-BREAKER CRITERIA:
    // 1st: uniqueStickers (descending)
    // 2nd: legendsCount (descending)
    // 3rd: packsOpened (ascending - fewer packs used)
    // 4th: completedAt (ascending - completed earlier comes first)
    // 5th: nickname (alphabetical ascending)
    playerStatsList.sort((a, b) => {
      if (b.uniqueStickers !== a.uniqueStickers) {
        return b.uniqueStickers - a.uniqueStickers;
      }
      if (b.legendsCount !== a.legendsCount) {
        return b.legendsCount - a.legendsCount;
      }
      if (a.packsOpened !== b.packsOpened) {
        return a.packsOpened - b.packsOpened;
      }
      if (a.completedAt && b.completedAt) {
        return new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime();
      }
      if (a.completedAt && !b.completedAt) return -1;
      if (!a.completedAt && b.completedAt) return 1;

      return a.nickname.localeCompare(b.nickname, 'pt-BR');
    });

    const leaderboard: RankingPlayer[] = playerStatsList.map((p, idx) => ({
      ...p,
      rank: idx + 1
    }));

    let totalCardsDistributed = packOpenLogs.length * 3;
    let totalLegendsDistributed = 0;
    let totalRepeatedCards = 0;
    let completedAlbumsCount = 0;

    packOpenLogs.forEach(log => {
      log.stickersObtained.forEach(sid => {
        const st = allStickers.find(s => s.id === sid);
        if (st && st.rarity === 'Legend') {
          totalLegendsDistributed++;
        }
      });
    });

    players.forEach(p => {
      let uCount = 0;
      Object.entries(p.collectedStickers || {}).forEach(([cardId, count]) => {
        if (count > 0) {
          uCount++;
          if (count > 1) totalRepeatedCards += (count - 1);
        }
      });
      if (p.completedAlbum || uCount >= totalUniqueAvailable) {
        completedAlbumsCount++;
      }
    });

    let recentEvents = db.rankingEvents || [];
    if (recentEvents.length === 0) {
      recentEvents = [
        {
          id: 'evt-init-1',
          playerId: 'player-nathan',
          playerNickname: 'Nathan',
          playerPhotoUrl: '/uploads/img-1784136938806-c4isd4.png',
          type: 'legend',
          message: 'Nathan encontrou a Legend Diego Rivas!',
          createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString()
        },
        {
          id: 'evt-init-2',
          playerId: 'player-chummy',
          playerNickname: 'Chummy',
          playerPhotoUrl: '/uploads/img-1784136923872-nx53rr.png',
          type: 'recycle',
          message: 'Chummy reciclou 5 repetidas e ganhou +1 pacote.',
          createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString()
        },
        {
          id: 'evt-init-3',
          playerId: 'player-ph',
          playerNickname: 'PH',
          playerPhotoUrl: '/uploads/img-1784136703591-zoer9w.png',
          type: 'first_pack',
          message: 'PH abriu o seu primeiro pacote!',
          createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString()
        }
      ];
    }

    return {
      leaderboard,
      stats: {
        totalPlayers: (db.players || []).length,
        completedAlbumsCount,
        totalCardsDistributed,
        totalLegendsDistributed,
        totalPacksOpened: packOpenLogs.length,
        totalRepeatedCards
      },
      recentEvents,
      firstChampion
    };
  }

  // GET PUBLIC PLAYER PROFILE FOR MODAL
  public getPublicPlayerProfile(playerId: string): PublicPlayerProfile | null {
    const db = this.load();
    const player = db.players.find(p => p.id === playerId);
    if (!player) return null;

    const allStickers = db.stickers || [];
    const totalUniqueAvailable = allStickers.length || 30;

    const playerPacksLogs = (db.packOpenLogs || []).filter(l => l.playerId === player.id);
    const packsOpened = playerPacksLogs.length;
    const playerRecycleLogs = (db.recycleLogs || []).filter(l => l.playerId === player.id);
    const recyclesCount = playerRecycleLogs.length;

    let uniqueOwned = 0;
    let repeatedCount = 0;
    let legendsOwned = 0;

    Object.entries(player.collectedStickers || {}).forEach(([cardId, count]) => {
      if (count > 0) {
        uniqueOwned++;
        if (count > 1) {
          repeatedCount += (count - 1);
        }
        const st = allStickers.find(s => s.id === cardId);
        if (st && st.rarity === 'Legend') {
          legendsOwned++;
        }
      }
    });

    const progress = Math.round((uniqueOwned / totalUniqueAvailable) * 100);
    const isCompleted = player.completedAlbum || uniqueOwned >= totalUniqueAvailable;
    const lastLog = playerPacksLogs[0];
    const lastStickerAt = lastLog ? lastLog.openedAt : null;

    const isFirstChamp = db.firstChampion?.playerId === player.id;
    const badges = this.computeBadgesForPlayer(player, packsOpened, recyclesCount, isFirstChamp, allStickers);

    return {
      id: player.id,
      fullName: player.fullName,
      nickname: player.nickname,
      team: player.team,
      photoUrl: player.photoUrl,
      uniqueStickers: uniqueOwned,
      totalStickersAvailable: totalUniqueAvailable,
      legendsCount: legendsOwned,
      repeatedStickers: repeatedCount,
      packsOpened,
      progress,
      completedAlbum: isCompleted,
      completedAt: player.completedAt || null,
      createdAt: player.createdAt,
      lastStickerAt,
      isFirstChampion: isFirstChamp,
      badges
    };
  }

  // GET USER PROFILE VIEW MODEL FOR FRONTEND
  public getProfileForPlayer(player: Player): UserProfile {
    const allStickers = this.getStickers();
    const totalUniqueAvailable = allStickers.length || 30;

    let uniqueCount = 0;
    let repeatedCount = 0;
    let legendsCount = 0;
    let totalCardsCount = 0;

    Object.entries(player.collectedStickers).forEach(([cardId, count]) => {
      if (count > 0) {
        uniqueCount++;
        totalCardsCount += count;
        if (count > 1) {
          repeatedCount += (count - 1);
        }
        const st = allStickers.find(s => s.id === cardId);
        if (st && st.rarity === 'Legend') {
          legendsCount++;
        }
      }
    });

    const progress = Math.round((uniqueCount / totalUniqueAvailable) * 100);

    // Find last opening date
    const db = this.load();
    const lastOpen = db.packOpenLogs.find(l => l.playerId === player.id);

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
      totalStickers: totalCardsCount,
      uniqueStickers: uniqueCount,
      repeatedStickers: repeatedCount,
      legendsCount,
      collectionProgress: progress,
      completedAlbum: player.completedAlbum || uniqueCount >= totalUniqueAvailable,
      collectedCounts: player.collectedStickers,
      lastOpeningAt: lastOpen ? lastOpen.openedAt : null
    };
  }

  // GET ADMIN DASHBOARD STATS
  public getDashboardStats(): DashboardStats {
    const db = this.load();
    const players = db.players || [];
    const allStickers = db.stickers || [];

    const totalPlayers = players.length;
    const activePlayers = players.filter(p => p.status === 'active').length;

    // Online players (logged in in last 24h)
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const onlinePlayers = players.filter(p => p.lastAccessAt && p.lastAccessAt >= dayAgo).length;

    let totalPacksDistributed = 0;
    let freePacksDistributed = 0;
    db.packCreditLogs.forEach(l => {
      if (l.amount > 0) {
        totalPacksDistributed += l.amount;
        if (l.type === 'free') {
          freePacksDistributed += l.amount;
        }
      }
    });

    const totalPacksOpened = db.packOpenLogs.length;
    const totalCardsDistributed = totalPacksOpened * 3;

    let totalRepeatedCards = 0;
    let albumCompletersCount = 0;
    let legendDrawn = 0;
    let normalDrawn = 0;

    const drawnCounts: Record<string, number> = {};

    db.packOpenLogs.forEach(log => {
      log.stickersObtained.forEach(sid => {
        drawnCounts[sid] = (drawnCounts[sid] || 0) + 1;
        const st = allStickers.find(s => s.id === sid);
        if (st) {
          if (st.rarity === 'Legend') legendDrawn++;
          else normalDrawn++;
        }
      });
    });

    players.forEach(p => {
      if (p.completedAlbum) albumCompletersCount++;
      Object.values(p.collectedStickers).forEach(count => {
        if (count > 1) totalRepeatedCards += (count - 1);
      });
    });

    const totalRecyclesPerformed = db.recycleLogs.length;

    const realPercentLegend = totalCardsDistributed > 0 
      ? Math.round((legendDrawn / totalCardsDistributed) * 100 * 10) / 10 
      : 0;

    const stickersWithCounts = allStickers.map(s => ({
      ...s,
      count: drawnCounts[s.id] || 0
    }));

    const mostCommon = [...stickersWithCounts].sort((a, b) => b.count - a.count).slice(0, 5);
    const mostRare = [...stickersWithCounts].sort((a, b) => a.count - b.count).slice(0, 5);

    const teamDistribution = {
      'Time Branco': 0,
      'Time Preto': 0,
      'Time Azul': 0,
      'Time Vermelho': 0,
      'Legends': 0
    };

    db.packOpenLogs.forEach(log => {
      log.stickersObtained.forEach(sid => {
        const s = allStickers.find(st => st.id === sid);
        if (s && s.team in teamDistribution) {
          teamDistribution[s.team as keyof typeof teamDistribution]++;
        }
      });
    });

    // Recent 5 openings
    const recentOpenings = db.packOpenLogs.slice(0, 5).map(log => ({
      id: log.id,
      playerNickname: log.playerNickname,
      openedAt: log.openedAt,
      stickers: log.stickersObtained.map(sid => allStickers.find(s => s.id === sid)).filter(Boolean) as Sticker[],
      usedFreePack: log.usedFreePack
    }));

    // Player ranking
    const playerRanking = players.map(p => {
      const prof = this.getProfileForPlayer(p);
      return {
        id: p.id,
        nickname: p.nickname,
        fullName: p.fullName,
        team: p.team,
        uniqueCount: prof.uniqueStickers,
        progress: prof.collectionProgress,
        completedAlbum: prof.completedAlbum,
        legendsCount: prof.legendsCount,
        purchasedPacks: p.purchasedPacks,
        freePacks: p.freePacks
      };
    }).sort((a, b) => b.uniqueCount - a.uniqueCount || b.progress - a.progress);

    return {
      totalPlayers,
      activePlayers,
      onlinePlayers,
      totalPacksDistributed,
      totalPacksOpened,
      freePacksDistributed,
      legendStickersCount: allStickers.filter(s => s.rarity === 'Legend').length,
      totalCardsDistributed,
      totalRepeatedCards,
      totalRecyclesPerformed,
      albumCompletersCount,
      normalDrawn,
      legendDrawn,
      realPercentLegend,
      mostCommon,
      mostRare,
      teamDistribution,
      recentOpenings,
      playerRanking
    };
  }

  public resetSystem(): boolean {
    const db = this.load();
    db.packOpenLogs = [];
    db.packCreditLogs = [];
    db.recycleLogs = [];

    const initialFree = db.systemSettings.initialFreePacks !== undefined ? db.systemSettings.initialFreePacks : 1;
    db.players.forEach(p => {
      p.collectedStickers = {};
      p.completedAlbum = false;
      p.completedAt = null;
      p.purchasedPacks = 0;
      p.freePacks = initialFree;
    });

    db.logs = [
      { id: 'log-' + Math.random().toString(36).substr(2, 9), action: 'SYSTEM_RESET', details: 'O sistema e o álbum de figurinhas foram resetados pelo administrador.', createdAt: new Date().toISOString() }
    ];
    this.save(db);
    return true;
  }

  public adjustPlayerCredits(
    playerId: string,
    amount: number,
    type: 'purchased' | 'free',
    reason: any,
    adminUsername: string
  ) {
    return this.adjustPlayerPacks(playerId, type, amount, reason, adminUsername);
  }
}

export const dbInstance = Database.getInstance();

