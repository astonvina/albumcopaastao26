export interface Sticker {
  id: string;
  number: string;
  name: string;
  team: 'Time Branco' | 'Time Preto' | 'Time Azul' | 'Time Vermelho' | 'Legends';
  image: string;
  color: string;
  team_color?: string;
  isLegend?: boolean;
  rarity: 'Normal' | 'Legend';
  description: string;
  championshipId?: string;
  obtainedAt?: string;
}

export interface Player {
  id: string;
  fullName: string;
  nickname: string;
  accessCode: string; // Uppercase, unique, e.g. "CHUMMY"
  passwordHash?: string | null;
  hasPassword: boolean;
  team: string;
  isFan?: boolean;
  photoUrl: string;
  status: 'active' | 'inactive';
  purchasedPacks: number;
  freePacks: number;
  collectedStickers: Record<string, number>; // cardId -> count
  completedAlbum: boolean;
  completedAt?: string | null;
  createdAt: string;
  lastAccessAt: string | null;
  championshipId: string;
}

export interface Championship {
  id: string;
  name: string;
  year: number;
  logoUrl?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status: 'active' | 'archived' | 'closed';
  stickersCount?: number;
  playersCount?: number;
  legendsCount?: number;
  normalProbability?: number;
  legendProbability?: number;
  createdAt: string;
}

export interface Prize {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  quantity: number;
  deliveryCriteria: string;
  championshipId?: string;
  createdAt: string;
}

export interface SystemLog {
  id: string;
  action: string;
  details: string;
  adminUsername?: string;
  createdAt: string;
}

export interface PackCreditLog {
  id: string;
  playerId: string;
  playerNickname: string;
  type: 'purchased' | 'free';
  amount: number;
  adminUsername: string;
  reason: 'Compra' | 'Bônus' | 'Reciclagem' | 'Premiação' | 'Ajuste Manual' | 'Conclusão de Álbum';
  createdAt: string;
}

export interface PackOpenLog {
  id: string;
  playerId: string;
  playerNickname: string;
  stickersObtained: string[]; // card IDs
  usedFreePack: boolean;
  openedAt: string;
}

export interface RecycleLog {
  id: string;
  playerId: string;
  playerNickname: string;
  consumedCount: number;
  freePacksAwarded: number;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  fullName: string;
  nickname: string;
  accessCode: string;
  team: string;
  isFan?: boolean;
  photoUrl: string;
  purchasedPacks: number;
  freePacks: number;
  totalPacksAvailable: number;
  totalStickers: number;
  uniqueStickers: number;
  repeatedStickers: number;
  legendsCount: number;
  collectionProgress: number;
  completedAlbum: boolean;
  collectedCounts: Record<string, number>;
  obtainedDates?: Record<string, string>;
  lastOpeningAt?: string | null;
}

export interface ProbabilitySettings {
  normalProbability: number;
  legendProbability: number;
}

export interface DashboardStats {
  totalPlayers: number;
  activePlayers: number;
  onlinePlayers: number;
  totalPacksDistributed: number;
  totalPacksOpened: number;
  freePacksDistributed: number;
  legendStickersCount: number;
  totalCardsDistributed: number;
  totalRepeatedCards: number;
  totalRecyclesPerformed: number;
  albumCompletersCount: number;
  normalDrawn: number;
  legendDrawn: number;
  realPercentLegend: number;
  mostCommon: (Sticker & { count: number })[];
  mostRare: (Sticker & { count: number })[];
  teamDistribution: {
    'Time Branco': number;
    'Time Preto': number;
    'Time Azul': number;
    'Time Vermelho': number;
    'Legends': number;
  };
  recentOpenings: {
    id: string;
    playerNickname: string;
    openedAt: string;
    stickers: Sticker[];
    usedFreePack: boolean;
  }[];
  playerRanking: {
    id: string;
    nickname: string;
    fullName: string;
    team: string;
    uniqueCount: number;
    progress: number;
    completedAlbum: boolean;
    legendsCount: number;
    purchasedPacks: number;
    freePacks: number;
  }[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string | null;
}

export interface RankingPlayer {
  rank: number;
  id: string;
  nickname: string;
  fullName: string;
  team: string;
  photoUrl: string;
  uniqueStickers: number;
  totalStickersAvailable: number;
  legendsCount: number;
  progress: number;
  packsOpened: number;
  repeatedStickers: number;
  completedAlbum: boolean;
  completedAt?: string | null;
  lastStickerAt?: string | null;
  isFirstChampion?: boolean;
  createdAt: string;
  badges: Badge[];
}

export interface RankingStats {
  totalPlayers: number;
  completedAlbumsCount: number;
  totalCardsDistributed: number;
  totalLegendsDistributed: number;
  totalPacksOpened: number;
  totalRepeatedCards: number;
}

export interface RankingEvent {
  id: string;
  playerId: string;
  playerNickname: string;
  playerPhotoUrl: string;
  type: 'legend' | 'album' | 'team' | 'recycle' | 'first_pack';
  message: string;
  createdAt: string;
}

export interface FirstChampionInfo {
  playerId: string;
  nickname: string;
  fullName: string;
  photoUrl: string;
  completedAt: string;
  packsOpened: number;
}

export interface PublicPlayerProfile {
  id: string;
  fullName: string;
  nickname: string;
  team: string;
  photoUrl: string;
  uniqueStickers: number;
  totalStickersAvailable: number;
  legendsCount: number;
  repeatedStickers: number;
  packsOpened: number;
  progress: number;
  completedAlbum: boolean;
  completedAt?: string | null;
  createdAt: string;
  lastStickerAt?: string | null;
  isFirstChampion?: boolean;
  badges: Badge[];
}

export interface TeamSetting {
  id: string;
  name: 'Time Vermelho' | 'Time Azul' | 'Time Branco' | 'Time Preto' | 'Legends' | string;
  color: string;
  shieldUrl: string;
}

export interface CountdownSettings {
  showCountdown: boolean;
  mode: 'countdown' | 'banner' | 'hidden';
  title: string;
  subtitle: string;
  eventDate: string;
  timezone: string;
  showButton: boolean;
  buttonText: string;
  buttonAction: 'album' | 'ranking' | 'login' | 'open_pack' | 'external_url';
  buttonUrl?: string;
  backgroundImageUrl?: string;
  colors: {
    titleColor: string;
    countdownColor: string;
    buttonColor: string;
    buttonTextColor?: string;
    backgroundColor: string;
    overlayColor: string;
  };
  postEventBehavior: 'zero' | 'hide' | 'custom_message';
  postEventMessage?: string;
}

export interface RewardsBannerItem {
  id: string;
  icon: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
}

export interface RewardsBannerSettings {
  enabled: boolean;
  title: string;
  subtitle: string;
  primaryButtonText: string;
  primaryButtonAction: 'album' | 'ranking' | 'login' | 'open_pack' | 'external_url';
  primaryButtonUrl?: string;
  secondaryButtonText: string;
  secondaryButtonAction: 'ranking' | 'prizes_modal' | 'album' | 'external_url';
  secondaryButtonUrl?: string;
  infoMessage: string;
  useSystemPrizes: boolean;
  featuredItems: RewardsBannerItem[];
  backgroundImageUrl?: string;
  colors: {
    titleColor: string;
    subtitleColor: string;
    backgroundColor: string;
    cardBackgroundColor: string;
    overlayColor: string;
    primaryButtonColor: string;
    primaryButtonTextColor: string;
    secondaryButtonColor: string;
    secondaryButtonTextColor: string;
    borderGlowColor: string;
  };
}

export interface SystemSettings {
  countdownDate: string;
  activeChampionshipId: string;
  initialFreePacks: number;
  logoUrl?: string;
  albumCoverUrl?: string;
  packCoverUrl?: string;
  homeBackgroundUrl?: string;
  rankingBackgroundUrl?: string;
  globalBackgroundUrl?: string;
  teams?: TeamSetting[];
  countdownConfig?: CountdownSettings;
  rewardsBannerConfig?: RewardsBannerSettings;
}

export type ActiveTab = 'home' | 'album' | 'ranking' | 'login' | 'admin' | 'players' | 'packs';


