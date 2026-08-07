import React, { useState } from 'react';
import { User, Siswa, AppSettings } from '../types';
import { StorageService } from '../services/storage';
import { QRScannerModal } from './QRScannerModal';
import { SiswaPinPromptModal } from './SiswaPinPromptModal';
import {
  Lock,
  User as UserIcon,
  KeyRound,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  Building,
  Users,
  QrCode,
  CheckCircle2,
  Database,
  Search,
} from 'lucide-react';

interface LoginViewProps {
  settings: AppSettings;
  siswaList: Siswa[];
  usersList: User[];
  onLoginSuccess: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  settings,
  siswaList: propSiswaList,
  usersList: propUsersList,
  onLoginSuccess,
}) => {
  const [tab, setTab] = useState<'petugas' | 'orang_tua'>('petugas');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedSiswaId, setSelectedSiswaId] = useState<string>('');
  const [nisnInput, setNisnInput] = useState('');
  const [siswaSearchFilter, setSiswaSearchFilter] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedSiswaForPin, setSelectedSiswaForPin] = useState<Siswa | null>(null);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [fromQrScan, setFromQrScan] = useState(false);

  const users = propUsersList && propUsersList.length > 0 ? propUsersList : StorageService.getUsers();
  const siswaList = propSiswaList && propSiswaList.length > 0 ? propSiswaList : StorageService.getSiswa();

  const handleLoginPetugas = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const foundUser = users.find(
      (u) => u.username.toLowerCase() === username.toLowerCase() && u.password === password
    );

    if (foundUser) {
      if (foundUser.status !== 'Aktif') {
        setErrorMsg('Akun pengguna ini dalam status nonaktif.');
        return;
      }
      StorageService.addLog(foundUser.username, `User ${foundUser.nama} (${foundUser.role}) berhasil masuk.`);
      onLoginSuccess(foundUser);
    } else {
      setErrorMsg('Username atau password tidak cocok! Silakan periksa kembali.');
    }
  };

  const handleLoginSiswaDirect = (siswa: Siswa) => {
    const parentUser: User = {
      id: `USR-OT-${siswa.id}`,
      username: siswa.nisn || siswa.nis,
      nama: `${siswa.nama} (Kelas ${siswa.kelas})`,
      role: 'orang_tua',
      kelas: siswa.kelas,
      status: 'Aktif',
    };
    StorageService.addLog(siswa.nama, `Siswa/Wali ${siswa.nama} masuk ke sistem tabungan.`);
    onLoginSuccess(parentUser);
  };

  const handleLoginOrangTua = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSelectedSiswaForPin(null);
    setFromQrScan(false);
    setIsPinModalOpen(true);
  };

  const handleQuickRoleSelect = (role: string) => {
    let targetUser: User | undefined;
    if (role === 'admin') targetUser = users.find((u) => u.role === 'admin');
    else if (role === 'bendahara') targetUser = users.find((u) => u.role === 'bendahara');
    else if (role === 'guru') targetUser = users.find((u) => u.role === 'guru');
    else if (role === 'admin_bank') targetUser = users.find((u) => u.role === 'admin_bank');
    else if (role === 'orang_tua') {
      const firstSiswa = siswaList[0];
      if (firstSiswa) {
        targetUser = {
          id: `USR-OT-${firstSiswa.id}`,
          username: firstSiswa.nisn,
          nama: `${firstSiswa.nama} (Kelas ${firstSiswa.kelas})`,
          role: 'orang_tua',
          kelas: firstSiswa.kelas,
          status: 'Aktif',
        };
      }
    }

    if (targetUser) {
      onLoginSuccess(targetUser);
    }
  };

  const filteredQuickSiswa = siswaList.filter(
    (s) =>
      s.nama.toLowerCase().includes(siswaSearchFilter.toLowerCase()) ||
      s.nis.includes(siswaSearchFilter) ||
      s.nisn.includes(siswaSearchFilter) ||
      s.kelas.toLowerCase().includes(siswaSearchFilter.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full mx-auto space-y-6">
        {/* School Identity Header Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-md mx-auto overflow-hidden">
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
              <GraduationCap className="w-10 h-10 text-white" />
            )}
          </div>

          <div>
            <span className="text-3xs font-extrabold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 inline-block mb-1">
              PORTAL TABSIS DIGITAL • NPSN {settings.npsn}
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-snug">
              {settings.nama_sekolah}
            </h1>
            <p className="text-xs font-bold text-slate-500">
              Sistem Informasi Tabungan Siswa Digital (TABSIS)
            </p>
          </div>
        </div>

        {/* Main Login Card */}
        <div className="bg-white rounded-3xl shadow-lg border border-slate-200/80 overflow-hidden">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-teal-600 p-6 text-white text-center">
            <h2 className="text-lg font-black tracking-tight">Silakan Masuk Ke Akun Anda</h2>
            <p className="text-2xs text-indigo-100 mt-0.5">
              Pilih jenis pengguna untuk mengakses tabungan siswa
            </p>
          </div>

          <div className="p-6">
            {/* Role Tabs */}
            <div className="flex p-1 bg-slate-100 rounded-2xl mb-6">
              <button
                onClick={() => {
                  setTab('petugas');
                  setErrorMsg('');
                }}
                className={`flex-1 py-2.5 px-3 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                  tab === 'petugas'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Petugas Sekolah
              </button>
              <button
                onClick={() => {
                  setTab('orang_tua');
                  setErrorMsg('');
                }}
                className={`flex-1 py-2.5 px-3 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                  tab === 'orang_tua'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Siswa / Orang Tua
              </button>
            </div>

            {errorMsg && (
              <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                <span>{errorMsg}</span>
              </div>
            )}

            {tab === 'petugas' ? (
              /* PETUGAS FORM */
              <form onSubmit={handleLoginPetugas} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Username Petugas
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      placeholder="Ketik username (admin / bendahara / guru / adminbank)..."
                      className="w-full pl-10 pr-3 py-2.5 text-xs font-bold border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Masukkan password..."
                      className="w-full pl-10 pr-3 py-2.5 text-xs font-bold border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50/50"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-300" />
                  <span>MASUK SEBAGAI PETUGAS</span>
                </button>

              </form>
            ) : (
              /* SISWA / ORANG TUA FORM */
              <form onSubmit={handleLoginOrangTua} className="space-y-4">
                {/* QR Code Scanner Button */}
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-emerald-500/30"
                >
                  <QrCode className="w-4.5 h-4.5 text-amber-300" />
                  <span>SCAN QR CODE KARTU SISWA</span>
                </button>

                <div className="flex items-center my-2 text-slate-400 font-bold text-3xs uppercase tracking-wider">
                  <div className="flex-1 border-t border-slate-200"></div>
                  <span className="px-3 bg-white text-slate-400">Atau Masuk Manual</span>
                  <div className="flex-1 border-t border-slate-200"></div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4 text-amber-300" />
                  <span>MASUK BUKU TABUNGAN SISWA</span>
                </button>

                <p className="text-3xs text-center text-slate-500 font-semibold px-2">
                  Tekan tombol di atas untuk memilih nama siswa & memasukkan PIN Rahasia Tabungan.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div className="text-center text-xs text-slate-400 font-semibold mt-6">
        <p>© 2026 {settings.nama_sekolah} — Tabungan Siswa Digital</p>
      </div>

      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        siswaList={siswaList}
        title="Scan QR Code Untuk Login Siswa"
        subtitle="Dekatkan QR Code kartu siswa ke kamera untuk masuk otomatis"
        onScanSuccess={({ nisOrNisn, siswa }) => {
          let found = siswa;
          if (!found) {
            found = siswaList.find(
              (s) => s.nis === nisOrNisn || s.nisn === nisOrNisn || s.id === nisOrNisn
            );
          }
          if (found) {
            setIsScannerOpen(false);
            setSelectedSiswaForPin(found);
            setFromQrScan(true);
            setIsPinModalOpen(true);
          } else {
            setErrorMsg(`Siswa dengan NIS/NISN "${nisOrNisn}" tidak ditemukan!`);
          }
        }}
      />

      <SiswaPinPromptModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        siswaList={siswaList}
        initialSiswa={selectedSiswaForPin}
        fromQrScan={fromQrScan}
        onSuccess={(siswa) => {
          setIsPinModalOpen(false);
          handleLoginSiswaDirect(siswa);
        }}
      />
    </div>
  );
};
