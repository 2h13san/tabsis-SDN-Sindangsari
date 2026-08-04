import React, { useState } from 'react';
import { User, Siswa } from '../types';
import { StorageService } from '../services/storage';
import { QRScannerModal } from './QRScannerModal';
import {
  Lock,
  User as UserIcon,
  X,
  KeyRound,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  Building,
  Users,
  QrCode,
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
  siswaList?: Siswa[];
  usersList?: User[];
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  siswaList: propSiswaList,
  usersList: propUsersList,
}) => {
  const [tab, setTab] = useState<'petugas' | 'orang_tua'>('petugas');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedSiswaId, setSelectedSiswaId] = useState<string>('');
  const [nisnInput, setNisnInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  if (!isOpen) return null;

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
      onClose();
    } else {
      setErrorMsg('Username atau password tidak cocok!');
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
    onClose();
  };

  const handleLoginOrangTua = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    let foundSiswa: Siswa | undefined;

    if (selectedSiswaId) {
      foundSiswa = siswaList.find((s) => s.id === selectedSiswaId);
    } else if (nisnInput.trim()) {
      const cleanNisn = nisnInput.trim();
      foundSiswa = siswaList.find(
        (s) => s.nisn === cleanNisn || s.nis === cleanNisn || s.nama.toLowerCase().includes(cleanNisn.toLowerCase())
      );
    }

    if (foundSiswa) {
      handleLoginSiswaDirect(foundSiswa);
    } else {
      setErrorMsg('Data siswa tidak ditemukan! Pilih siswa dari daftar atau periksa NISN.');
    }
  };

  const handleQuickRoleSelect = (role: string) => {
    let targetUser: User | undefined;
    if (role === 'admin') targetUser = users.find((u) => u.role === 'admin');
    else if (role === 'bendahara') targetUser = users.find((u) => u.role === 'bendahara');
    else if (role === 'guru') targetUser = users.find((u) => u.role === 'guru');
    else if (role === 'orang_tua') {
      const firstSiswa = siswaList[0];
      if (firstSiswa) {
        targetUser = {
          id: `USR-OT-${firstSiswa.id}`,
          username: firstSiswa.nisn,
          nama: `Wali dari ${firstSiswa.nama} (${firstSiswa.kelas})`,
          role: 'orang_tua',
          kelas: firstSiswa.kelas,
          status: 'Aktif',
        };
      }
    }

    if (targetUser) {
      onLoginSuccess(targetUser);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">Masuk TABSIS</h2>
              <p className="text-xs text-emerald-100">Sistem Tabungan Siswa Digital SD</p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
            <button
              onClick={() => {
                setTab('petugas');
                setErrorMsg('');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                tab === 'petugas' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Petugas (Admin / Bendahara / Guru)
            </button>
            <button
              onClick={() => {
                setTab('orang_tua');
                setErrorMsg('');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                tab === 'orang_tua' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Orang Tua / Siswa (NISN)
            </button>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold">
              {errorMsg}
            </div>
          )}

          {tab === 'petugas' ? (
            <form onSubmit={handleLoginPetugas} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Username</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    placeholder="Masukkan username..."
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Masukkan password..."
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Masuk Sesuai Role
              </button>
            </form>
          ) : (
            <form onSubmit={handleLoginOrangTua} className="space-y-4">
              {/* QR Code Scanner Button */}
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer border border-emerald-500/30"
              >
                <QrCode className="w-4 h-4 text-amber-300" />
                <span>SCAN QR CODE KARTU SISWA UNTUK LOGIN</span>
              </button>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Siswa Dari Daftar</label>
                <select
                  value={selectedSiswaId}
                  onChange={(e) => {
                    setSelectedSiswaId(e.target.value);
                    const found = siswaList.find((s) => s.id === e.target.value);
                    if (found) setNisnInput(found.nisn || found.nis);
                  }}
                  className="w-full px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white mb-3"
                >
                  <option value="">-- Pilih Nama Siswa --</option>
                  {siswaList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nama} - Kelas {s.kelas} (NISN: {s.nisn})
                    </option>
                  ))}
                </select>

                <label className="block text-xs font-bold text-slate-700 mb-1">Atau Ketik NISN / NIS Siswa</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={nisnInput}
                    onChange={(e) => {
                      setNisnInput(e.target.value);
                      setSelectedSiswaId('');
                    }}
                    placeholder="Contoh: 0151234501 / NIS 2301"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <p className="text-3xs text-slate-500 mt-1">
                  Masuk sebagai akun siswa/orang tua untuk melihat saldo tabungan & buku tabungan digital secara mandiri.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Masuk ke Tabungan Siswa
              </button>


            </form>
          )}
        </div>
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
            handleLoginSiswaDirect(found);
          } else {
            setErrorMsg(`Siswa dengan NIS/NISN "${nisOrNisn}" tidak ditemukan!`);
          }
        }}
      />
    </div>
  );
};
