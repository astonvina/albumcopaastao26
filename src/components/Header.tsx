import React from 'react';
import Navbar from './Navbar';
import { ActiveTab } from '../types';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isAdminLoggedIn: boolean;
  loggedPlayerNickname?: string | null;
  onLogout: () => void;
  onPlayerLogout?: () => void;
  onOpenPlayerLogin: () => void;
  onOpenAdminLogin: () => void;
}

export default function Header(props: HeaderProps) {
  return <Navbar {...props} />;
}
