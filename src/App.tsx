import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HomeTab from './components/HomeTab';
import AlbumTab from './components/AlbumTab';
import RankingTab from './components/RankingTab';
import AdminPanel from './components/AdminPanel';
import PlayerLogin from './components/PlayerLogin';
import PackOpening from './components/PackOpening';
import { Sticker, ActiveTab, UserProfile, Player } from './types';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { 
  getStickersFromSupabase, 
  getPlayersFromSupabase, 
  buildUserProfile, 
  openPackFromSupabase, 
  claimRecyclePackFromSupabase 
} from './lib/supabaseData';

export default function App() {
  // Navigation & authentication states
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  // Sticker data states
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [loadingStickers, setLoadingStickers] = useState(true);
  const [stickersError, setStickersError] = useState<string | null>(null);

  // Logged-in player & user profile
  const [loggedPlayer, setLoggedPlayer] = useState<Player | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [collectedIds, setCollectedIds] = useState<string[]>([]);

  // Pack Opening state
  const [openedPackStickers, setOpenedPackStickers] = useState<Sticker[] | null>(null);
  const [isLoadingPack, setIsLoadingPack] = useState(false);
  const [isRecycling, setIsRecycling] = useState(false);
  const [packError, setPackError] = useState<string | null>(null);

  // Load user profile from Supabase
  const loadUserProfile = async (playerId?: string) => {
    try {
      const targetId = playerId || loggedPlayer?.id;
      if (!targetId) return;

      const players = await getPlayersFromSupabase();
      const player = players.find(p => p.id === targetId);
      if (!player) return;

      const profile = await buildUserProfile(player);
      setUserProfile(profile);
      const uniqueIds = Object.keys(profile.collectedCounts).filter(
        id => profile.collectedCounts[id] > 0
      );
      setCollectedIds(uniqueIds);
      localStorage.setItem('copa_astao_collected_ids', JSON.stringify(uniqueIds));
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  // Attempt auto-login if player code is saved
  const attemptAutoLogin = async () => {
    const savedCode = localStorage.getItem('copa_astao_player_code');
    if (!savedCode) return;

    try {
      const players = await getPlayersFromSupabase();
      const player = players.find(p => p.accessCode === savedCode.toUpperCase());
      if (player && player.status === 'active') {
        const profile = await buildUserProfile(player);
        setLoggedPlayer(player);
        setUserProfile(profile);
        const uniqueIds = Object.keys(profile.collectedCounts).filter(
          id => profile.collectedCounts[id] > 0
        );
        setCollectedIds(uniqueIds);
      }
    } catch (err) {
      console.error('Error during auto login:', err);
    }
  };

  // Load stickers from Supabase on mount
  const loadStickers = async () => {
    setLoadingStickers(true);
    setStickersError(null);
    try {
      const data = await getStickersFromSupabase();
      setStickers(data);
    } catch (err: any) {
      setStickersError('Não foi possível carregar as figurinhas do Supabase: ' + err.message);
    } finally {
      setLoadingStickers(false);
    }
  };

  useEffect(() => {
    loadStickers();
    attemptAutoLogin();

    // Check if admin is logged in from session storage
    const logged = sessionStorage.getItem('copa_astao_admin_logged');
    if (logged === 'true') {
      setIsAdminLoggedIn(true);
    }
  }, []);

  // Handle Admin Login submission
  const handleAdminLogin = async (password: string): Promise<boolean> => {
    try {
      if (password.trim() === 'copa2026' || password.trim() === 'admin123') {
        setIsAdminLoggedIn(true);
        sessionStorage.setItem('copa_astao_admin_logged', 'true');
        setActiveTab('admin');
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error logging in:', err);
      return false;
    }
  };

  // Handle Admin Logout
  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    sessionStorage.removeItem('copa_astao_admin_logged');
    if (activeTab === 'admin') {
      setActiveTab('home');
    }
  };

  // Handle Player Login Success
  const handlePlayerLoginSuccess = (player: Player, profile: UserProfile) => {
    setLoggedPlayer(player);
    setUserProfile(profile);
    const uniqueIds = Object.keys(profile.collectedCounts).filter(
      id => profile.collectedCounts[id] > 0
    );
    setCollectedIds(uniqueIds);
    setActiveTab('home');
  };

  // Open Pack for Logged-In Player
  const handleOpenPack = async () => {
    if (!loggedPlayer) {
      setActiveTab('login');
      return;
    }

    setIsLoadingPack(true);
    setPackError(null);
    try {
      const result = await openPackFromSupabase(loggedPlayer.id);
      setOpenedPackStickers(result.stickers);
      setUserProfile(result.userProfile);
      const uniqueIds = Object.keys(result.userProfile.collectedCounts).filter(
        id => result.userProfile.collectedCounts[id] > 0
      );
      setCollectedIds(uniqueIds);
    } catch (err: any) {
      setPackError(err.message || 'Não foi possível abrir o pacote.');
    } finally {
      setIsLoadingPack(false);
    }
  };

  // Claim free pack by recycling 5 duplicates
  const handleClaimRecyclePack = async () => {
    if (!loggedPlayer) {
      setActiveTab('login');
      return;
    }

    setIsRecycling(true);
    setPackError(null);
    try {
      const result = await claimRecyclePackFromSupabase(loggedPlayer.id);
      setOpenedPackStickers(result.stickers);
      setUserProfile(result.userProfile);
      const uniqueIds = Object.keys(result.userProfile.collectedCounts).filter(
        id => result.userProfile.collectedCounts[id] > 0
      );
      setCollectedIds(uniqueIds);
    } catch (err: any) {
      setPackError(err.message || 'Você precisa de 5 figurinhas repetidas para realizar a troca.');
    } finally {
      setIsRecycling(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col" id="app-root-container">
      
      {/* Dynamic Header/Navbar Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAdminLoggedIn={isAdminLoggedIn}
        loggedPlayerNickname={loggedPlayer?.nickname || userProfile?.nickname}
        onLogout={handleAdminLogout}
        onOpenPlayerLogin={() => setActiveTab('login')}
        onOpenAdminLogin={() => setActiveTab('admin')}
      />

      {/* MAIN LAYOUT WRAPPER */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:pb-24">
        {loadingStickers ? (
          // Loading spinner
          <div className="flex flex-col items-center justify-center py-32 space-y-3" id="loading-spinner">
            <RefreshCw className="w-10 h-10 animate-spin text-brand-blue-glow" />
            <p className="font-mono text-xs text-gray-400 uppercase tracking-widest">
              Conectando à Arena Copa Astão...
            </p>
          </div>
        ) : stickersError ? (
          // Connection Error panel
          <div className="max-w-md mx-auto py-20 text-center bg-brand-surface border border-white/5 p-8 rounded-2xl space-y-4" id="error-panel">
            <div className="w-12 h-12 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-display text-lg text-white uppercase tracking-wider">Falha de Comunicação</h3>
            <p className="text-xs text-gray-400 leading-relaxed">{stickersError}</p>
            <button
              onClick={loadStickers}
              className="px-6 py-2.5 bg-brand-blue text-white rounded-lg text-xs font-semibold uppercase tracking-wider"
            >
              Tentar Novamente
            </button>
          </div>
        ) : (
          // Active Tabs content
          <div>
            {activeTab === 'home' && (
              <HomeTab
                onOpenPack={handleOpenPack}
                isLoadingPack={isLoadingPack}
                packError={packError}
                onNavigateToAlbum={() => setActiveTab('album')}
                onNavigateToRanking={() => setActiveTab('ranking')}
                onNavigateToLogin={() => setActiveTab('login')}
                onNavigateToAdmin={() => setActiveTab('admin')}
                userProfile={userProfile}
                onClaimRecyclePack={handleClaimRecyclePack}
                isRecycling={isRecycling}
              />
            )}

            {activeTab === 'album' && (
              <AlbumTab
                stickers={stickers}
                collectedIds={collectedIds}
                userProfile={userProfile}
                onClaimRecyclePack={handleClaimRecyclePack}
                isRecycling={isRecycling}
              />
            )}

            {activeTab === 'ranking' && (
              <RankingTab
                onNavigateToAlbum={() => setActiveTab('album')}
              />
            )}

            {activeTab === 'login' && (
              <PlayerLogin
                onLoginSuccess={handlePlayerLoginSuccess}
                onNavigateToAdmin={() => setActiveTab('admin')}
                onBackToHome={() => setActiveTab('home')}
              />
            )}

            {activeTab === 'admin' && (
              <AdminPanel
                stickers={stickers}
                onRefreshData={loadStickers}
                isAdminLoggedIn={isAdminLoggedIn}
                onLogin={(pass) => handleAdminLogin(pass)}
                onLogout={handleAdminLogout}
              />
            )}
          </div>
        )}
      </main>

      {/* FOOTER METADATA BAR */}
      <footer className="hidden md:block py-6 border-t border-white/5 bg-brand-surface/25 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center font-mono">
          <span className="flex items-center gap-1">
            ⚽ Copa Astão © 2026 - Todos os direitos reservados.
          </span>
          <span className="text-gray-600">v2.0.0 - Sistema de Créditos</span>
        </div>
      </footer>

      {/* FULL-SCREEN OVERLAY: 3D UT-STYLE PACK OPENER ANIMATION */}
      {openedPackStickers && (
        <PackOpening
          stickers={openedPackStickers}
          userProfile={userProfile}
          onClaimRecyclePack={handleClaimRecyclePack}
          isRecycling={isRecycling}
          onClose={() => {
            setOpenedPackStickers(null);
            setPackError(null);
            setActiveTab('album'); // Direct user to look at their newly glued stickers!
          }}
        />
      )}

    </div>
  );
}
