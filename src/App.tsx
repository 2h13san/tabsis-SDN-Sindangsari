import React, { useState, useEffect } from 'react';
import { StorageService } from './services/storage';
import { FirestoreService } from './services/firestoreService';
import { AppSettings, User, Siswa, Transaksi, Kelas, LogAktivitas, BackupRecord } from './types';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { LoginModal } from './components/LoginModal';
import { LoginView } from './components/LoginView';
import { Dashboard } from './components/Dashboard';
import { SiswaManager } from './components/SiswaManager';
import { TransaksiManager } from './components/TransaksiManager';
import { BukuTabunganManager } from './components/BukuTabunganManager';
import { LaporanManager } from './components/LaporanManager';
import { KelasManager } from './components/KelasManager';
import { UserManager } from './components/UserManager';
import { DatabaseSpreadsheetView } from './components/DatabaseSpreadsheetView';
import { SettingsManager } from './components/SettingsManager';
import { BackupManager } from './components/BackupManager';
import { AlurSetoranManager } from './components/AlurSetoranManager';
import { QRCodeManager } from './components/QRCodeManager';

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(StorageService.getSettings());
  const [activeUser, setActiveUser] = useState<User | null>(StorageService.getActiveUser());
  const [siswaList, setSiswaList] = useState<Siswa[]>(StorageService.getSiswa());
  const [transaksiList, setTransaksiList] = useState<Transaksi[]>(StorageService.getTransaksi());
  const [kelasList, setKelasList] = useState<Kelas[]>(StorageService.getKelas());
  const [usersList, setUsersList] = useState<User[]>(StorageService.getUsers());
  const [logsList, setLogsList] = useState<LogAktivitas[]>(StorageService.getLogs());
  const [backupsList, setBackupsList] = useState<BackupRecord[]>(StorageService.getBackups());

  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [navParams, setNavParams] = useState<any>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Initialize and subscribe to Firestore
  useEffect(() => {
    FirestoreService.initDatabase().catch((err) => {
      console.warn('Firestore initDatabase failed:', err);
    });

    const unsubSettings = FirestoreService.subscribeSettings((data) => {
      if (data) setSettings(data);
    });
    const unsubSiswa = FirestoreService.subscribeSiswa((data) => {
      if (data) setSiswaList(data);
    });
    const unsubTx = FirestoreService.subscribeTransaksi((data) => {
      if (data) setTransaksiList(data);
    });
    const unsubUsers = FirestoreService.subscribeUsers((data) => {
      if (data) setUsersList(data);
    });
    const unsubKelas = FirestoreService.subscribeKelas((data) => {
      if (data) setKelasList(data);
    });
    const unsubLogs = FirestoreService.subscribeLogs((data) => {
      if (data) setLogsList(data);
    });
    const unsubBackups = FirestoreService.subscribeBackups((data) => {
      if (data) setBackupsList(data);
    });

    return () => {
      unsubSettings();
      unsubSiswa();
      unsubTx();
      unsubUsers();
      unsubKelas();
      unsubLogs();
      unsubBackups();
    };
  }, []);

  // Sync state from StorageService
  const refreshAllData = () => {
    setSettings(StorageService.getSettings());
    setActiveUser(StorageService.getActiveUser());
    setSiswaList(StorageService.getSiswa());
    setTransaksiList(StorageService.getTransaksi());
    setKelasList(StorageService.getKelas());
    setUsersList(StorageService.getUsers());
    setLogsList(StorageService.getLogs());
    setBackupsList(StorageService.getBackups());
  };

  const handleNavigate = (page: string, params?: any) => {
    setCurrentPage(page);
    setNavParams(params || null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSuccess = (user: User) => {
    StorageService.setActiveUser(user);
    setActiveUser(user);
    refreshAllData();
  };

  const handleLogout = () => {
    StorageService.setActiveUser(null);
    setActiveUser(null);
    refreshAllData();
    setCurrentPage('dashboard');
  };

  // Initial screen for all roles: Login Screen
  if (!activeUser) {
    return (
      <LoginView
        settings={settings}
        siswaList={siswaList}
        usersList={usersList}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        settings={settings}
        activeUser={activeUser}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        onNavigate={handleNavigate}
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto">
        {/* Navigation Sidebar */}
        <Sidebar
          activeRole={activeUser.role}
          currentPage={currentPage}
          onNavigate={handleNavigate}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Main Content View Container */}
        <main className="flex-1 p-4 sm:p-6 space-y-6 overflow-x-hidden">
          {currentPage === 'dashboard' && (
            <Dashboard
              settings={settings}
              activeUser={activeUser}
              siswaList={siswaList}
              transaksiList={transaksiList}
              onNavigate={handleNavigate}
              onRefreshData={refreshAllData}
            />
          )}

          {currentPage === 'transaksi' && (
            <TransaksiManager
              siswaList={siswaList}
              kelasList={kelasList}
              activeUser={activeUser}
              initialJenis={navParams?.jenis}
              onRefreshData={refreshAllData}
              onNavigateToPassbook={(nis) => handleNavigate('buku-tabungan', { nis })}
            />
          )}

          {currentPage === 'alur-setoran' && (
            <AlurSetoranManager
              transaksiList={transaksiList}
              activeUser={activeUser}
              kelasList={kelasList}
              settings={settings}
              onRefreshData={refreshAllData}
            />
          )}

          {currentPage === 'siswa' && (
            <SiswaManager
              siswaList={siswaList}
              kelasList={kelasList}
              activeUser={activeUser}
              onRefreshData={refreshAllData}
              onNavigateToPassbook={(nis) => handleNavigate('buku-tabungan', { nis })}
            />
          )}

          {currentPage === 'qr-manager' && (
            <QRCodeManager
              siswaList={siswaList}
              kelasList={kelasList}
              settings={settings}
              activeUser={activeUser}
              onRefreshData={refreshAllData}
            />
          )}

          {currentPage === 'buku-tabungan' && (
            <BukuTabunganManager
              siswaList={siswaList}
              transaksiList={transaksiList}
              settings={settings}
              preselectedNis={navParams?.nis}
              activeUser={activeUser}
              onRefreshData={refreshAllData}
            />
          )}

          {currentPage === 'laporan' && (
            <LaporanManager
              transaksiList={transaksiList}
              siswaList={siswaList}
              kelasList={kelasList}
              settings={settings}
              activeUser={activeUser}
            />
          )}

          {currentPage === 'kelas' && (
            <KelasManager
              kelasList={kelasList}
              siswaList={siswaList}
              onRefreshData={refreshAllData}
            />
          )}

          {currentPage === 'users' && (
            <UserManager
              usersList={usersList}
              kelasList={kelasList}
              onRefreshData={refreshAllData}
            />
          )}

          {currentPage === 'database' && (
            <DatabaseSpreadsheetView
              settings={settings}
              usersList={usersList}
              siswaList={siswaList}
              transaksiList={transaksiList}
              kelasList={kelasList}
              logsList={logsList}
              backupsList={backupsList}
              onRefreshData={refreshAllData}
            />
          )}

          {currentPage === 'settings' && (
            <SettingsManager settings={settings} onRefreshData={refreshAllData} />
          )}

          {currentPage === 'backup' && (
            <BackupManager
              siswaList={siswaList}
              transaksiList={transaksiList}
              backupsList={backupsList}
              onRefreshData={refreshAllData}
            />
          )}
        </main>
      </div>

      {/* Status Bar Footer */}
      <footer className="h-8 bg-slate-900 text-slate-400 px-6 flex items-center justify-between text-[10px] border-t border-slate-800 shrink-0">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Database Firestore (Live Realtime)
          </span>
          <span className="hidden sm:inline">Firebase Cloud Firestore Backend Engine</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Auto-Sync: Active</span>
          <span className="text-amber-400 font-bold uppercase tracking-wider">TABSIS v2.2.0-Firestore</span>
        </div>
      </footer>

      {/* Role Switch & Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        siswaList={siswaList}
        usersList={usersList}
      />
    </div>
  );
}
