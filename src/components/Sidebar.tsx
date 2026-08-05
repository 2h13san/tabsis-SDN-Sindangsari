import React from 'react';
import { UserRole } from '../types';
import {
  LayoutDashboard,
  ArrowDownUp,
  GitMerge,
  Users,
  BookOpenCheck,
  FileSpreadsheet,
  Building2,
  UserCog,
  Database,
  Settings,
  Archive,
  History,
  Printer,
  ShieldAlert,
  QrCode,
} from 'lucide-react';

interface SidebarProps {
  activeRole: UserRole;
  currentPage: string;
  onNavigate: (page: string) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeRole,
  currentPage,
  onNavigate,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'bendahara', 'guru', 'orang_tua', 'admin_bank'],
    },
    {
      id: 'transaksi',
      label: 'Input Transaksi',
      icon: ArrowDownUp,
      roles: ['admin', 'bendahara', 'guru'],
      badge: 'Setoran/Penarikan',
    },
    {
      id: 'alur-setoran',
      label: 'Alur Setoran Berjenjang',
      icon: GitMerge,
      roles: ['admin', 'bendahara', 'guru'],
      badge: 'Siswa → Guru → Bank',
    },
    {
      id: 'siswa',
      label: 'Data Siswa',
      icon: Users,
      roles: ['admin', 'bendahara', 'guru'],
    },
    {
      id: 'qr-manager',
      label: 'Manajemen QR Code',
      icon: QrCode,
      roles: ['admin', 'bendahara'],
      badge: 'Kelola QR',
    },
    {
      id: 'buku-tabungan',
      label: 'Buku Tabungan',
      icon: BookOpenCheck,
      roles: ['admin', 'bendahara', 'guru', 'orang_tua'],
      badge: 'Digital & Cetak',
    },
    {
      id: 'laporan',
      label: 'Laporan Keuangan',
      icon: FileSpreadsheet,
      roles: ['admin', 'bendahara', 'admin_bank'],
    },
    {
      id: 'kelas',
      label: 'Data Kelas',
      icon: Building2,
      roles: ['admin'],
    },
    {
      id: 'users',
      label: 'Pengguna System',
      icon: UserCog,
      roles: ['admin'],
    },
    {
      id: 'database',
      label: 'Database Inspector',
      icon: Database,
      roles: ['admin'],
      badge: 'Firebase Firestore',
    },
    {
      id: 'settings',
      label: 'Pengaturan Sekolah',
      icon: Settings,
      roles: ['admin'],
    },
    {
      id: 'backup',
      label: 'Backup Data',
      icon: Archive,
      roles: ['admin'],
    },
  ];

  const filteredItems = navItems.filter((item) => item.roles.includes(activeRole));

  const handleNavClick = (pageId: string) => {
    onNavigate(pageId);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const navContent = (
    <div className="flex flex-col justify-between h-full space-y-6">
      <div>
        <div className="mb-4 px-2 flex items-center justify-between">
          <p className="text-2xs font-extrabold text-indigo-200 uppercase tracking-wider">
            Menu Utama ({activeRole.toUpperCase()})
          </p>
        </div>

        <nav className="space-y-1">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer min-h-[44px] ${
                  isActive
                    ? 'bg-indigo-700 border-l-4 border-amber-400 text-white shadow-sm font-bold pl-3'
                    : 'text-indigo-100 hover:bg-indigo-500 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-400' : 'text-indigo-200'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-3xs px-2 py-0.5 rounded-full font-extrabold shrink-0 ${
                      isActive ? 'bg-amber-400 text-indigo-950' : 'bg-indigo-500/60 text-indigo-100'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Database Quick Info Footer */}
      <div className="p-3 rounded-xl bg-indigo-800 border border-indigo-700/60 text-indigo-100">
        <div className="flex items-center gap-2 mb-1">
          <Database className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-2xs font-bold text-white">Database Firestore Active</span>
        </div>
        <p className="text-3xs text-indigo-200 leading-snug">
          Terhubung ke Google Firebase Cloud Firestore (Realtime Sync & Storage).
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-indigo-600 text-white shrink-0 p-4 flex-col justify-between min-h-[calc(100vh-4rem)] shadow-md">
        {navContent}
      </aside>

      {/* Mobile Drawer Slide-over */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />

          {/* Drawer content */}
          <div className="relative w-4/5 max-w-xs bg-indigo-600 text-white p-4 shadow-2xl flex flex-col h-full overflow-y-auto animate-slideRight z-10">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};
