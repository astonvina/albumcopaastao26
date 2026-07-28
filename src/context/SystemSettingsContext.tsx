import React, { createContext, useContext, useState, useEffect } from 'react';
import { SystemSettings, TeamSetting, CountdownSettings, RewardsBannerSettings } from '../types';
import { getSystemSettingsFromSupabase, updateSystemSettingsInSupabase } from '../lib/supabaseData';

export const DEFAULT_TEAMS_LIST: TeamSetting[] = [
  { id: 'team-vermelho', name: 'Time Vermelho', color: '#EF4444', shieldUrl: '/escudo3atual2.png' },
  { id: 'team-azul', name: 'Time Azul', color: '#4FA8F4', shieldUrl: '/escudo3atual2.png' },
  { id: 'team-branco', name: 'Time Branco', color: '#FFFFFF', shieldUrl: '/escudo3atual2.png' },
  { id: 'team-preto', name: 'Time Preto', color: '#1A1A1A', shieldUrl: '/escudo3atual2.png' },
  { id: 'team-legends', name: 'Legends', color: '#E5B80B', shieldUrl: '/escudo3atual2.png' }
];

export const DEFAULT_COUNTDOWN_CONFIG: CountdownSettings = {
  showCountdown: true,
  mode: 'countdown',
  title: 'PRÓXIMO GRANDE EVENTO',
  subtitle: 'Liberação do Pacote Especial "Lendas de Ouro"',
  eventDate: '2026-11-01T08:00:00.000Z',
  timezone: 'America/Sao_Paulo',
  showButton: true,
  buttonText: 'Abrir Álbum',
  buttonAction: 'album',
  buttonUrl: '',
  backgroundImageUrl: '',
  colors: {
    titleColor: '#FFFFFF',
    countdownColor: '#FECF2E',
    buttonColor: '#0099D6',
    buttonTextColor: '#FFFFFF',
    backgroundColor: '#171717',
    overlayColor: 'rgba(0, 0, 0, 0.6)'
  },
  postEventBehavior: 'custom_message',
  postEventMessage: 'A Copa Astão 2026 já começou!'
};

export const DEFAULT_REWARDS_BANNER_CONFIG: RewardsBannerSettings = {
  enabled: true,
  title: '🏆 COMPLETE O ÁLBUM E CONCORRA A PRÊMIOS!',
  subtitle: 'Colecione todas as figurinhas, suba no ranking e desbloqueie recompensas exclusivas da Copa Astão.',
  primaryButtonText: '🖼️ Abrir Meu Álbum',
  primaryButtonAction: 'album',
  secondaryButtonText: '🏅 Ver Premiações',
  secondaryButtonAction: 'prizes_modal',
  infoMessage: 'Quanto mais próximo de completar o álbum, maiores são suas chances de conquistar as premiações.',
  useSystemPrizes: true,
  featuredItems: [
    { id: '1', icon: '⚽', title: '1 Mês de Futebol Grátis', subtitle: '1º Lugar Geral' },
    { id: '2', icon: '👕', title: 'Camisa Oficial Aston Vina', subtitle: 'Top 3 do Ranking' },
    { id: '3', icon: '🧢', title: 'Boné Oficial Aston Vina', subtitle: 'Sorteio Especial' },
    { id: '4', icon: '🏆', title: 'Prêmios Exclusivos', subtitle: 'Para quem completar' }
  ],
  backgroundImageUrl: '',
  colors: {
    titleColor: '#FECF2E',
    subtitleColor: '#E2E8F0',
    backgroundColor: '#121212',
    cardBackgroundColor: 'rgba(255, 255, 255, 0.08)',
    overlayColor: 'rgba(0, 0, 0, 0.70)',
    primaryButtonColor: '#0099D6',
    primaryButtonTextColor: '#FFFFFF',
    secondaryButtonColor: '#E5B80B',
    secondaryButtonTextColor: '#000000',
    borderGlowColor: '#E5B80B'
  }
};

const DEFAULT_SETTINGS: SystemSettings = {
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

interface SystemSettingsContextType {
  settings: SystemSettings;
  loading: boolean;
  refreshSettings: () => Promise<void>;
  updateSettings: (newSettings: Partial<SystemSettings>) => Promise<boolean>;
  getTeamShield: (teamName: string) => string;
}

const SystemSettingsContext = createContext<SystemSettingsContextType>({
  settings: DEFAULT_SETTINGS,
  loading: true,
  refreshSettings: async () => {},
  updateSettings: async () => false,
  getTeamShield: () => '/escudo3atual2.png'
});

export const SystemSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const data = await getSystemSettingsFromSupabase();
      setSettings(data);
    } catch (err) {
      console.error('Error fetching system settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateSettings = async (newFields: Partial<SystemSettings>): Promise<boolean> => {
    try {
      const success = await updateSystemSettingsInSupabase(newFields);
      if (success) {
        const updated = await getSystemSettingsFromSupabase();
        setSettings(updated);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error updating system settings:', err);
      return false;
    }
  };

  const getTeamShield = (teamName: string): string => {
    if (!teamName) return settings.logoUrl || '/escudo3atual2.png';
    const clean = teamName.toLowerCase().trim();
    const found = settings.teams?.find(t => 
      t.name.toLowerCase().trim() === clean || 
      t.id.toLowerCase() === clean ||
      t.name.toLowerCase().includes(clean)
    );
    return found?.shieldUrl || settings.logoUrl || '/escudo3atual2.png';
  };

  return (
    <SystemSettingsContext.Provider
      value={{
        settings,
        loading,
        refreshSettings: fetchSettings,
        updateSettings,
        getTeamShield
      }}
    >
      {children}
    </SystemSettingsContext.Provider>
  );
};

export const useSystemSettings = () => useContext(SystemSettingsContext);
