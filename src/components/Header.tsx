import React from 'react';
import { AppSettings, User } from '../types';
import {
  GraduationCap,
  User as UserIcon,
  LogOut,
  Database,
  Building,
  ShieldAlert,
  Coins,
  QrCode,
  Menu,
  X,
  Landmark,
} from 'lucide-react';

interface HeaderProps {
  settings: AppSettings;
  activeUser: User;
  onOpenLoginModal: () => void;
  onLogout: () => void;
  onNavigate: (page: string) => void;
  isMobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  activeUser,
  onOpenLoginModal,
  onLogout,
  onNavigate,
  isMobileMenuOpen = false,
  onToggleMobileMenu,
}) => {
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <span className="bg-purple-100 text-purple-800 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-purple-200">Admin</span>;
      case 'bendahara':
        return <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-emerald-200">Bendahara</span>;
      case 'guru':
        return <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-blue-200">Guru ({activeUser.kelas || 'Wali'})</span>;
      case 'admin_bank':
        return <span className="bg-cyan-100 text-cyan-800 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-cyan-200 flex items-center gap-1"><Landmark className="w-3.5 h-3.5" /> Admin Bank Mitra</span>;
      case 'orang_tua':
        return <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-amber-200">Orang Tua / Siswa</span>;
      default:
        return null;
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Mobile Menu Toggle & Logo */}
        <div className="flex items-center gap-2.5">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer"
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 text-indigo-600" /> : <Menu className="w-5 h-5" />}
            </button>
          )}

          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onNavigate('dashboard')}>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg sm:text-xl shadow-xs overflow-hidden shrink-0">
              {settings.logo_url ? (
                <img
                  src={settings.logo_url}
                  alt="Logo Sekolah"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-slate-900 text-sm sm:text-lg leading-tight line-clamp-1">
                  {settings.nama_sekolah}
                </h1>
                <span className="hidden md:inline-block text-2xs bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-md border border-indigo-100">
                  NPSN: {settings.npsn}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-semibold hidden sm:block">
                TABSIS — Tabungan Siswa Digital (T.A. {settings.tahun_ajaran})
              </p>
            </div>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          {/* Firestore Database Badge */}
          <button
            onClick={() => onNavigate('database')}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors cursor-pointer"
            title="Lihat Inspektur Database Firebase Firestore & Collections"
          >
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>Firebase Firestore DB</span>
          </button>

          {/* User Profile & Role */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1.5 pl-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-slate-900 leading-none mb-1">
                {activeUser.nama}
              </div>
              <div className="flex justify-end">{getRoleBadge(activeUser.role)}</div>
            </div>

            <button
              onClick={onOpenLoginModal}
              className="p-1.5 bg-white rounded-lg border border-slate-200 text-slate-600 hover:text-emerald-600 hover:border-emerald-300 transition-all cursor-pointer shadow-2xs"
              title="Ganti Pengguna / Role"
            >
              <UserIcon className="w-4 h-4" />
            </button>

            <button
              onClick={onLogout}
              className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all cursor-pointer"
              title="Keluar / Reset Session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
