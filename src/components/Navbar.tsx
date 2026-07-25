import React from 'react';
import { ActiveTab } from '../types';
import { ShieldAlert, Home, BookOpen, Trophy, User, LogIn, Bell } from 'lucide-react';
import { useSystemSettings } from '../context/SystemSettingsContext';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isAdminLoggedIn: boolean;
  loggedPlayerNickname?: string | null;
  onLogout: () => void;
  onOpenPlayerLogin: () => void;
  onOpenAdminLogin: () => void;
}

export default function Navbar({
  activeTab,
  setActiveTab,
  isAdminLoggedIn,
  loggedPlayerNickname,
  onLogout,
  onOpenPlayerLogin,
  onOpenAdminLogin
}: NavbarProps) {
  const { settings } = useSystemSettings();

  return (
    <header className="sticky top-0 z-40 bg-brand-dark/90 backdrop-blur-md border-b border-white/10" id="app-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* BRAND LOGO */}
          <div 
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            {/* Escudo do Time Pequeno no Cabeçalho */}
            <div className="w-10 h-10 overflow-hidden rounded-full border-2 border-brand-blue-glow/30 shadow-md group-hover:scale-105 transition-transform flex items-center justify-center bg-brand-dark">
              <img 
                src={settings.logoUrl || "/escudo3atual2.png"} 
                alt="Logo da Copa" 
                className="w-full h-full object-cover scale-110"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="flex flex-col">
              <span className="font-display text-lg leading-none tracking-wider text-white uppercase group-hover:text-brand-blue-glow transition-colors">
                COPA ASTÃO 2026
              </span>
              <span className="text-[9px] font-mono tracking-widest text-brand-gold uppercase">
                Álbum Oficial de Figurinhas
              </span>
            </div>
          </div>

          {/* DESKTOP NAVIGATION */}
          <nav className="hidden md:flex items-center gap-2">
            <button
              onClick={() => setActiveTab('home')}
              className={`px-3.5 py-2 text-xs uppercase tracking-wider font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                activeTab === 'home'
                  ? 'bg-brand-blue/10 text-brand-blue-glow shadow-inner border border-brand-blue/20'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Home className="w-4 h-4" />
              Início
            </button>
            
            <button
              onClick={() => setActiveTab('album')}
              className={`px-3.5 py-2 text-xs uppercase tracking-wider font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                activeTab === 'album'
                  ? 'bg-brand-blue/10 text-brand-blue-glow shadow-inner border border-brand-blue/20'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Meu Álbum
            </button>

            <button
              onClick={() => setActiveTab('ranking')}
              className={`px-3.5 py-2 text-xs uppercase tracking-wider font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                activeTab === 'ranking'
                  ? 'bg-brand-gold/15 text-brand-gold-glow shadow-inner border border-brand-gold/30'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Trophy className="w-4 h-4 text-brand-gold-glow" />
              Ranking
            </button>

            <button
              onClick={onOpenPlayerLogin}
              className={`px-3.5 py-2 text-xs uppercase tracking-wider font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                activeTab === 'login'
                  ? 'bg-brand-blue/10 text-brand-blue-glow shadow-inner border border-brand-blue/20'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <User className="w-4 h-4" />
              {loggedPlayerNickname ? `Conta: ${loggedPlayerNickname}` : 'Login Jogador'}
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`px-3.5 py-2 text-xs uppercase tracking-wider font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                activeTab === 'admin'
                  ? 'bg-brand-gold/10 text-brand-gold-glow shadow-inner border border-brand-gold/20'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              Admin
            </button>
          </nav>

          {/* RIGHT ACTIONS */}
          <div className="flex items-center gap-3">
            {isAdminLoggedIn ? (
              <div className="flex items-center gap-2.5 bg-brand-gold/15 border border-brand-gold/30 px-3 py-1.5 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-brand-gold animate-pulse" />
                <span className="text-xs font-mono font-bold uppercase text-brand-gold-glow hidden sm:inline">
                  Admin Logado
                </span>
                <button
                  onClick={onLogout}
                  className="text-xs text-white/70 hover:text-white font-semibold bg-white/10 hover:bg-white/15 px-2 py-0.5 rounded transition-all"
                >
                  Sair
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAdminLogin}
                className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-xs font-semibold text-white/80 hover:text-white rounded-lg border border-white/10 flex items-center gap-1.5 transition-all"
                id="header-admin-login-btn"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-brand-gold-glow" />
                Painel Admin
              </button>
            )}
          </div>

        </div>
      </div>

      {/* MOBILE BOTTOM NAV BAR FOR EASY HANDHELD USE */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-brand-dark/95 border-t border-white/10 px-2 py-2 flex justify-around">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg text-[9px] uppercase font-bold tracking-wider ${
            activeTab === 'home' ? 'text-brand-blue-glow bg-brand-blue/10' : 'text-gray-400'
          }`}
        >
          <Home className="w-4 h-4" />
          Início
        </button>
        <button
          onClick={() => setActiveTab('album')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg text-[9px] uppercase font-bold tracking-wider ${
            activeTab === 'album' ? 'text-brand-blue-glow bg-brand-blue/10' : 'text-gray-400'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Álbum
        </button>
        <button
          onClick={() => setActiveTab('ranking')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg text-[9px] uppercase font-bold tracking-wider ${
            activeTab === 'ranking' ? 'text-brand-gold-glow bg-brand-gold/15' : 'text-gray-400'
          }`}
        >
          <Trophy className="w-4 h-4 text-brand-gold-glow" />
          Ranking
        </button>
        <button
          onClick={onOpenPlayerLogin}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg text-[9px] uppercase font-bold tracking-wider ${
            activeTab === 'login' ? 'text-brand-blue-glow bg-brand-blue/10' : 'text-gray-400'
          }`}
        >
          <User className="w-4 h-4" />
          {loggedPlayerNickname || 'Login'}
        </button>
        <button
          onClick={() => setActiveTab('admin')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg text-[9px] uppercase font-bold tracking-wider ${
            activeTab === 'admin' ? 'text-brand-gold-glow bg-brand-gold/10' : 'text-gray-400'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Admin
        </button>
      </div>
    </header>
  );
}

