import React, { useState } from 'react';
import { motion } from 'motion/react';
import { UserCheck, Lock, KeyRound, ShieldCheck, ArrowRight, Shield } from 'lucide-react';
import { UserProfile, Player } from '../types';
import { useSystemSettings } from '../context/SystemSettingsContext';
import { getPlayersFromSupabase, buildUserProfile, savePlayerToSupabase } from '../lib/supabaseData';

interface PlayerLoginProps {
  onLoginSuccess: (player: Player, profile: UserProfile) => void;
  onNavigateToAdmin: () => void;
  onBackToHome: () => void;
}

export default function PlayerLogin({
  onLoginSuccess,
  onNavigateToAdmin,
  onBackToHome
}: PlayerLoginProps) {
  const { settings } = useSystemSettings();
  const [accessCode, setAccessCode] = useState('');

  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  
  // First Access Setup Mode
  const [isFirstAccessMode, setIsFirstAccessMode] = useState(false);
  const [detectedPlayer, setDetectedPlayer] = useState<Player | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status & Error states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Handle standard login submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCode.trim()) {
      setErrorMsg('Informe seu código de jogador.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const codeClean = accessCode.trim().toUpperCase();
      const players = await getPlayersFromSupabase();
      const player = players.find(p => p.accessCode === codeClean);

      if (!player) {
        setErrorMsg('Código de jogador não encontrado.');
        return;
      }

      if (player.status === 'inactive') {
        setErrorMsg('Sua conta está inativa. Entre em contato com a comissão.');
        return;
      }

      if (!player.hasPassword) {
        setDetectedPlayer(player);
        setIsFirstAccessMode(true);
        return;
      }

      const profile = await buildUserProfile(player);

      if (rememberMe) {
        localStorage.setItem('copa_astao_player_code', player.accessCode);
        if (password) {
          localStorage.setItem('copa_astao_player_pass', password.trim());
        }
      } else {
        localStorage.removeItem('copa_astao_player_code');
        localStorage.removeItem('copa_astao_player_pass');
      }

      onLoginSuccess(player, profile);
    } catch (err: any) {
      setErrorMsg('Erro ao realizar login: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Create Password for First Access
  const handleCreatePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.trim().length < 3) {
      setErrorMsg('A senha deve conter pelo menos 3 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('As senhas digitadas não coincidem.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const codeToUse = detectedPlayer?.accessCode || accessCode.trim().toUpperCase();
      const players = await getPlayersFromSupabase();
      const player = players.find(p => p.accessCode === codeToUse);

      if (!player) {
        setErrorMsg('Jogador não encontrado para cadastrar senha.');
        return;
      }

      const updatedPlayer = await savePlayerToSupabase({
        ...player,
        password: newPassword.trim(),
        hasPassword: true
      });

      const profile = await buildUserProfile(updatedPlayer);

      if (rememberMe) {
        localStorage.setItem('copa_astao_player_code', updatedPlayer.accessCode);
        localStorage.setItem('copa_astao_player_pass', newPassword.trim());
      }

      onLoginSuccess(updatedPlayer, profile);
    } catch (err: any) {
      setErrorMsg('Erro ao cadastrar senha: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-8 sm:my-16 px-4" id="player-login-view">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-b from-neutral-900 via-neutral-950 to-brand-surface border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6 relative overflow-hidden"
      >
        {/* Top ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-brand-blue/15 rounded-full blur-3xl pointer-events-none" />

        {!isFirstAccessMode ? (
          /* STANDARD LOGIN FORM */
          <>
            <div className="space-y-3 relative">
              <div className="w-20 h-20 bg-brand-dark border border-white/10 rounded-2xl flex items-center justify-center mx-auto shadow-inner overflow-hidden p-2">
                <img src={settings.logoUrl || '/escudo3atual2.png'} alt="Logo da Copa" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              </div>
              <h2 className="font-display text-2xl uppercase tracking-wider text-white">
                Área do Jogador
              </h2>
              <p className="text-xs text-gray-400">
                Informe seu Código de Jogador para acessar seu álbum e pacotes.
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4 text-left relative">
              <div className="space-y-1.5">
                <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                  Código do Jogador
                </label>
                <input
                  type="text"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                  placeholder="Ex: JOG-001 ou SEU CÓDIGO"
                  className="w-full px-4 py-3 bg-brand-dark border border-white/10 rounded-xl text-white font-mono uppercase text-sm outline-none focus:border-brand-blue transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                  Senha
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha (deixe em branco se for o 1º acesso)"
                  className="w-full px-4 py-3 bg-brand-dark border border-white/10 rounded-xl text-white text-sm outline-none focus:border-brand-blue transition-all"
                />
              </div>

              <div className="flex items-center justify-between pt-1 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-brand-dark text-brand-blue focus:ring-0"
                  />
                  <span>Permanecer conectado</span>
                </label>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-medium">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-brand-blue hover:bg-sky-500 text-white font-display text-base tracking-wider uppercase border-b-4 border-sky-700 rounded-xl shadow-lg shadow-sky-950/40 flex items-center justify-center gap-2 transition-all font-bold disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Entrando...
                  </div>
                ) : (
                  <>
                    Entrar
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          /* FIRST ACCESS: CREATE PASSWORD FORM */
          <>
            <div className="space-y-3 relative">
              <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto text-brand-gold-glow shadow-inner">
                <KeyRound className="w-8 h-8" />
              </div>
              <h2 className="font-display text-2xl uppercase tracking-wider text-white">
                Primeiro Acesso Detectado!
              </h2>
              <p className="text-xs text-gray-300">
                Olá, <strong className="text-brand-gold-glow">{detectedPlayer?.nickname || detectedPlayer?.fullName}</strong>! Crie sua senha de acesso para proteger sua conta.
              </p>
            </div>

            <form onSubmit={handleCreatePasswordSubmit} className="space-y-4 text-left relative">
              <div className="space-y-1.5">
                <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                  Nova Senha
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Digite sua nova senha"
                  className="w-full px-4 py-3 bg-brand-dark border border-white/10 rounded-xl text-white text-sm outline-none focus:border-brand-gold transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                  Confirmar Nova Senha
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Digite a senha novamente"
                  className="w-full px-4 py-3 bg-brand-dark border border-white/10 rounded-xl text-white text-sm outline-none focus:border-brand-gold transition-all"
                  required
                />
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-medium">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-brand-gold hover:bg-yellow-500 text-black font-display text-base tracking-wider uppercase border-b-4 border-amber-700 rounded-xl shadow-lg shadow-amber-950/30 flex items-center justify-center gap-2 transition-all font-bold disabled:opacity-50"
              >
                {loading ? 'Cadastrando Senha...' : 'Criar Senha e Entrar'}
              </button>
            </form>
          </>
        )}

        <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row gap-2 justify-between items-center text-xs text-gray-400">
          <button
            type="button"
            onClick={onBackToHome}
            className="hover:text-white transition-colors"
          >
            ← Voltar para a Início
          </button>
          <button
            type="button"
            onClick={onNavigateToAdmin}
            className="text-brand-gold-glow hover:underline flex items-center gap-1"
          >
            <Shield className="w-3.5 h-3.5" />
            Painel do Administrador
          </button>
        </div>

      </motion.div>
    </div>
  );
}
