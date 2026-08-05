import React, { useState } from 'react';
import { AppSettings, User, Siswa, Transaksi } from '../types';
import { formatRupiah, formatDateIndo, StorageService } from '../services/storage';
import { BankPortalView } from './BankPortalView';
import {
  Users,
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  Building,
  Landmark,
  TrendingUp,
  Receipt,
  PlusCircle,
  MinusCircle,
  BookOpenCheck,
  Printer,
  CheckCircle2,
  Clock,
  Send,
  AlertCircle,
  X,
  GitMerge,
  Trophy,
  Award,
  Flame,
  Medal,
  BarChart3,
} from 'lucide-react';

interface DashboardProps {
  settings: AppSettings;
  activeUser: User;
  siswaList: Siswa[];
  transaksiList: Transaksi[];
  onNavigate: (page: string, params?: any) => void;
  onRefreshData: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  settings,
  activeUser,
  siswaList,
  transaksiList,
  onNavigate,
  onRefreshData,
}) => {
  const [selectedReceipt, setSelectedReceipt] = useState<Transaksi | null>(null);
  const [showSetorBankModal, setShowSetorBankModal] = useState(false);
  const [setorBankAmount, setSetorBankAmount] = useState<number>(0);
  const [bankMsg, setBankMsg] = useState('');

  // Early return for Bank Partner Role
  if (activeUser.role === 'admin_bank') {
    return (
      <BankPortalView
        settings={settings}
        activeUser={activeUser}
        transaksiList={transaksiList}
        onRefreshData={onRefreshData}
      />
    );
  }

  // Filtering for active role
  const isGuru = activeUser.role === 'guru' || activeUser.role === 'wali_kelas' || Boolean(activeUser.kelas);
  const isOrangTua = activeUser.role === 'orang_tua';

  const loggedInSiswa = isOrangTua
    ? siswaList.find(
        (s) =>
          s.nis === activeUser.username ||
          s.nisn === activeUser.username ||
          s.nis === activeUser.nis ||
          s.nama.toLowerCase() === activeUser.nama.toLowerCase() ||
          activeUser.id.includes(s.id)
      ) || siswaList[0]
    : null;

  const filteredSiswa = isGuru
    ? siswaList.filter((s) => s.kelas === activeUser.kelas)
    : isOrangTua
    ? loggedInSiswa ? [loggedInSiswa] : []
    : siswaList;

  const filteredTx = isGuru
    ? transaksiList.filter((t) => t.kelas === activeUser.kelas)
    : isOrangTua
    ? loggedInSiswa ? transaksiList.filter((t) => t.nis === loggedInSiswa.nis) : []
    : transaksiList;

  const activeSiswaCount = filteredSiswa.filter((s) => s.status === 'Aktif').length;
  const totalSaldoSiswa = filteredSiswa.reduce((sum, s) => sum + (s.saldo || 0), 0);

  const todayStr = new Date().toISOString().split('T')[0];

  const setoranHariIni = filteredTx
    .filter((t) => t.tanggal === todayStr && t.jenis === 'setoran')
    .reduce((sum, t) => sum + (t.setoran || 0), 0);

  const penarikanHariIni = filteredTx
    .filter((t) => t.tanggal === todayStr && t.jenis === 'penarikan')
    .reduce((sum, t) => sum + (t.penarikan || 0), 0);

  const belumDisetorKeBank = filteredTx
    .filter((t) => t.status_bank === 'Belum Disetor' && t.setoran > 0)
    .reduce((sum, t) => sum + (t.setoran || 0), 0);

  const sudahDisetorKeBank = settings.saldo_bank || 0;

  const last10Tx = filteredTx.slice(0, 10);

  const handleBankDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (setorBankAmount <= 0) {
      setBankMsg('Nominal penyetoran harus lebih dari 0.');
      return;
    }
    if (setorBankAmount > belumDisetorKeBank) {
      setBankMsg(`Nominal penyetoran melebihi dana tunai yang belum disetor (Rp ${belumDisetorKeBank.toLocaleString('id-ID')})`);
      return;
    }

    const res = StorageService.setorKeBank(setorBankAmount, activeUser.nama);
    setBankMsg(res.message);
    onRefreshData();
    setTimeout(() => {
      setShowSetorBankModal(false);
      setBankMsg('');
    }, 1500);
  };

  const totalSetoranSaya = isOrangTua
    ? filteredTx.reduce((sum, t) => sum + (t.setoran || 0), 0)
    : 0;

  const totalPenarikanSaya = isOrangTua
    ? filteredTx.reduce((sum, t) => sum + (t.penarikan || 0), 0)
    : 0;

  // 1. Top Siswa Terbesar Menabung (Saldo Terbanyak)
  const topSiswaTerbesar = [...filteredSiswa]
    .sort((a, b) => b.saldo - a.saldo)
    .slice(0, 5);
  const maxSaldoTop = topSiswaTerbesar[0]?.saldo || 1;

  // 2. Top Siswa Terajin Menabung (Frekuensi Setoran Terbanyak)
  const topSiswaTerajin = [...filteredSiswa]
    .map((s) => {
      const studentTx = filteredTx.filter((t) => t.nis === s.nis && t.jenis === 'setoran');
      return {
        siswa: s,
        count: studentTx.length,
        totalSetor: studentTx.reduce((sum, t) => sum + (t.setoran || 0), 0),
      };
    })
    .sort((a, b) => b.count - a.count || b.totalSetor - a.totalSetor)
    .slice(0, 5);
  const maxCountTop = topSiswaTerajin[0]?.count || 1;

  return (
    <div className="space-y-6">
      {/* Banner Header */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center">
          <Landmark className="w-64 h-64 text-white" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-amber-400 text-indigo-950 text-2xs px-3 py-1 rounded-full font-black mb-2 shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-900" />
              <span>Sistem Tabungan Digital Aktif • T.A. {settings.tahun_ajaran}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {isOrangTua ? `Tabungan Siswa: ${loggedInSiswa ? loggedInSiswa.nama : activeUser.nama}` : `Selamat Datang, ${activeUser.nama}!`}
            </h2>
            <p className="text-xs sm:text-sm text-indigo-100 mt-1 max-w-xl font-medium">
              {isOrangTua
                ? `Selamat datang di portal informasi tabungan mandiri siswa. Anda dapat memantau mutasi setoran & saldo tabungan secara realtime.`
                : `Aplikasi TABSIS siap melayani pencatatan setoran, penarikan, cetak buku tabungan fisik, dan pelaporan keuangan sekolah.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!isOrangTua && (
              <>
                <button
                  onClick={() => onNavigate('transaksi', { jenis: 'setoran' })}
                  className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Setoran Baru</span>
                </button>
                <button
                  onClick={() => onNavigate('alur-setoran')}
                  className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <GitMerge className="w-4 h-4" />
                  <span>Alur Setoran</span>
                </button>
                <button
                  onClick={() => onNavigate('transaksi', { jenis: 'penarikan' })}
                  className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-indigo-950 rounded-xl text-xs font-extrabold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <MinusCircle className="w-4 h-4" />
                  <span>- Penarikan</span>
                </button>
              </>
            )}
            <button
              onClick={() => onNavigate('buku-tabungan', { nis: loggedInSiswa?.nis })}
              className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-indigo-950 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Printer className="w-4 h-4 text-indigo-900" />
              <span>Buku Tabungan Digital</span>
            </button>
          </div>
        </div>
      </div>

      {/* Special Student Profile Card if logged in as OrangTua/Siswa */}
      {isOrangTua && loggedInSiswa && (
        <div className="bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-800 rounded-2xl p-6 text-white shadow-lg border border-emerald-500/30 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-2xs font-extrabold tracking-wider text-emerald-100 uppercase">
              <Users className="w-3.5 h-3.5" />
              <span>Kartu Tabungan Digital Siswa</span>
            </div>
            <h3 className="text-2xl font-black">{loggedInSiswa.nama}</h3>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-emerald-100 font-medium">
              <span>NIS: <strong className="text-white font-bold">{loggedInSiswa.nis}</strong></span>
              <span>•</span>
              <span>NISN: <strong className="text-white font-bold">{loggedInSiswa.nisn}</strong></span>
              <span>•</span>
              <span>Kelas: <strong className="text-white font-bold">{loggedInSiswa.kelas}</strong></span>
              <span>•</span>
              <span>Wali Kelas: <strong className="text-white font-bold">{loggedInSiswa.wali_kelas}</strong></span>
            </div>
            <p className="text-3xs text-emerald-200">
              Nama Orang Tua / Wali: <strong>{loggedInSiswa.orang_tua}</strong> ({loggedInSiswa.telepon})
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20 text-left sm:text-right min-w-[240px]">
            <span className="text-3xs font-extrabold text-emerald-200 uppercase tracking-widest block mb-1">
              Saldo Tabungan Aktif
            </span>
            <div className="text-3xl font-black text-amber-300 drop-shadow-xs">
              {formatRupiah(loggedInSiswa.saldo)}
            </div>
            <button
              onClick={() => onNavigate('buku-tabungan', { nis: loggedInSiswa.nis })}
              className="mt-3 w-full py-2 bg-white hover:bg-emerald-50 text-emerald-900 font-extrabold text-2xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <BookOpenCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Cetak / Lihat Buku Tabungan</span>
            </button>
          </div>
        </div>
      )}

      {/* KPI Stat Cards */}
      {isOrangTua ? (
        /* Personal Student Stat Cards */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xs font-bold text-slate-500 uppercase">Saldo Saya</span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-black text-emerald-700">{formatRupiah(loggedInSiswa?.saldo || 0)}</div>
            <p className="text-3xs text-slate-500 mt-1">Saldo aktif tabungan</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xs font-bold text-slate-500 uppercase">Total Setoran Saya</span>
              <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
                <ArrowDownRight className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-black text-teal-700">{formatRupiah(totalSetoranSaya)}</div>
            <p className="text-3xs text-slate-500 mt-1">Akumulasi uang disetor</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xs font-bold text-slate-500 uppercase">Total Penarikan Saya</span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-black text-amber-700">{formatRupiah(totalPenarikanSaya)}</div>
            <p className="text-3xs text-slate-500 mt-1">Akumulasi uang ditarik</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xs font-bold text-slate-500 uppercase">Jumlah Transaksi</span>
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-black text-indigo-700">{filteredTx.length} Transaksi</div>
            <p className="text-3xs text-slate-500 mt-1">Total riwayat mutasi</p>
          </div>
        </div>
      ) : (
        /* Global Admin/Guru KPI Stat Cards (6 Required Indicators) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* 1. Jumlah Siswa */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xs font-bold text-slate-500 uppercase">Jumlah Siswa</span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">{activeSiswaCount}</div>
            <p className="text-3xs text-slate-500 mt-1">Siswa Aktif {isGuru ? `(${activeUser.kelas})` : ''}</p>
          </div>

          {/* 2. Total Saldo */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xs font-bold text-slate-500 uppercase">Total Saldo</span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="text-lg font-black text-emerald-700">{formatRupiah(totalSaldoSiswa)}</div>
            <p className="text-3xs text-slate-500 mt-1">Saldo akumulasi tabungan</p>
          </div>

          {/* 3. Setoran Hari Ini */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xs font-bold text-slate-500 uppercase">Setoran Hari Ini</span>
              <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
                <ArrowDownRight className="w-4 h-4" />
              </div>
            </div>
            <div className="text-lg font-black text-teal-700">{formatRupiah(setoranHariIni)}</div>
            <p className="text-3xs text-slate-500 mt-1">{formatDateIndo(todayStr)}</p>
          </div>

          {/* 4. Penarikan Hari Ini */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xs font-bold text-slate-500 uppercase">Penarikan Hari Ini</span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <div className="text-lg font-black text-amber-700">{formatRupiah(penarikanHariIni)}</div>
            <p className="text-3xs text-slate-500 mt-1">{formatDateIndo(todayStr)}</p>
          </div>

          {/* 5. Belum Disetor ke Bank */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xs font-bold text-slate-500 uppercase">Belum Ke Bank</span>
              <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-lg font-black text-rose-700">{formatRupiah(belumDisetorKeBank)}</div>
            {activeUser.role === 'bendahara' || activeUser.role === 'admin' ? (
              <button
                onClick={() => {
                  setSetorBankAmount(belumDisetorKeBank);
                  setShowSetorBankModal(true);
                }}
                className="mt-1 text-3xs font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Send className="w-3 h-3" />
                <span>Setor ke Bank</span>
              </button>
            ) : (
              <p className="text-3xs text-slate-500 mt-1">Tunai di Bendahara</p>
            )}
          </div>

          {/* 6. Sudah Disetor ke Bank */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xs font-bold text-slate-500 uppercase">Sudah di Bank</span>
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <Landmark className="w-4 h-4" />
              </div>
            </div>
            <div className="text-lg font-black text-indigo-700">{formatRupiah(sudahDisetorKeBank)}</div>
            <p className="text-3xs text-slate-500 mt-1">Rekening Bank Sekolah</p>
          </div>
        </div>
      )}

      {/* Visual Charts: Siswa Terbesar & Siswa Terajin (Admin / Guru only) */}
      {!isOrangTua && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Siswa Terbesar Menabung */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <span>Grafik Siswa Terbesar Menabung</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Top 5 siswa dengan akumulasi saldo tabungan tertinggi
                </p>
              </div>
              <span className="text-3xs font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full">
                Saldo Terbanyak
              </span>
            </div>

            <div className="space-y-4">
              {topSiswaTerbesar.map((s, idx) => {
                const percent = Math.min(100, Math.round((s.saldo / maxSaldoTop) * 100));
                const rankBadges = ['🏆 #1', '🥈 #2', '🥉 #3', '#4', '#5'];
                const rankColors = [
                  'bg-amber-100 text-amber-800 border-amber-300 font-black',
                  'bg-slate-100 text-slate-700 border-slate-300 font-bold',
                  'bg-amber-50 text-amber-700 border-amber-200 font-bold',
                  'bg-slate-50 text-slate-500 border-slate-200 font-semibold',
                  'bg-slate-50 text-slate-500 border-slate-200 font-semibold',
                ];

                return (
                  <div key={s.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-3xs px-2 py-0.5 rounded-md border ${rankColors[idx]}`}
                        >
                          {rankBadges[idx]}
                        </span>
                        <span className="font-extrabold text-slate-800">{s.nama}</span>
                        <span className="text-3xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-semibold">
                          Kelas {s.kelas}
                        </span>
                      </div>
                      <span className="font-black text-emerald-700">{formatRupiah(s.saldo)}</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 flex">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-700 shadow-2xs"
                        style={{ width: `${Math.max(6, percent)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chart 2: Siswa Terajin Menabung */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
                    <Flame className="w-4 h-4" />
                  </div>
                  <span>Grafik Siswa Terajin Menabung</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Top 5 siswa dengan frekuensi setoran terbanyak
                </p>
              </div>
              <span className="text-3xs font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full">
                Frekuensi Setoran
              </span>
            </div>

            <div className="space-y-4">
              {topSiswaTerajin.map((item, idx) => {
                const percent = Math.min(100, Math.round((item.count / maxCountTop) * 100));
                const rankBadges = ['🥇 #1', '🥈 #2', '🥉 #3', '#4', '#5'];
                const rankColors = [
                  'bg-amber-100 text-amber-800 border-amber-300 font-black',
                  'bg-slate-100 text-slate-700 border-slate-300 font-bold',
                  'bg-amber-50 text-amber-700 border-amber-200 font-bold',
                  'bg-slate-50 text-slate-500 border-slate-200 font-semibold',
                  'bg-slate-50 text-slate-500 border-slate-200 font-semibold',
                ];

                return (
                  <div key={item.siswa.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-3xs px-2 py-0.5 rounded-md border ${rankColors[idx]}`}
                        >
                          {rankBadges[idx]}
                        </span>
                        <span className="font-extrabold text-slate-800">{item.siswa.nama}</span>
                        <span className="text-3xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-semibold">
                          Kelas {item.siswa.kelas}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-3xs font-black text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-200">
                          {item.count}x Setoran
                        </span>
                        <span className="font-bold text-slate-600 text-2xs">
                          ({formatRupiah(item.totalSetor)})
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 flex">
                      <div
                        className="bg-gradient-to-r from-amber-500 via-orange-500 to-indigo-500 h-full rounded-full transition-all duration-700 shadow-2xs"
                        style={{ width: `${Math.max(6, percent)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 10 Transaksi Terakhir Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              {isOrangTua ? 'Riwayat Transaksi Tabungan Saya' : '10 Transaksi Terakhir'}
            </h3>
            <p className="text-xs text-slate-500">
              {isOrangTua ? 'Histori mutasi tabungan pribadi terbaru' : 'Histori mutasi tabungan siswa paling baru'}
            </p>
          </div>
          <button
            onClick={() => onNavigate('buku-tabungan')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 underline flex items-center gap-1 cursor-pointer"
          >
            <BookOpenCheck className="w-4 h-4" />
            <span>Lihat Seluruh Histori Transaksi</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-y border-slate-200">
                <th className="p-3">No. TRX</th>
                <th className="p-3">Waktu</th>
                <th className="p-3">NIS</th>
                <th className="p-3">Nama Siswa</th>
                <th className="p-3">Kelas</th>
                <th className="p-3">Jenis</th>
                <th className="p-3 text-right">Setoran</th>
                <th className="p-3 text-right">Penarikan</th>
                <th className="p-3 text-right">Saldo Akhir</th>
                <th className="p-3 text-center">Struk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {last10Tx.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-6 text-center text-slate-400">
                    Belum ada transaksi recorded.
                  </td>
                </tr>
              ) : (
                last10Tx.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-mono text-2xs font-bold text-slate-700">{tx.id}</td>
                    <td className="p-3 text-slate-600">
                      <div>{formatDateIndo(tx.tanggal)}</div>
                      <div className="text-3xs text-slate-400">{tx.jam}</div>
                    </td>
                    <td className="p-3 font-semibold text-slate-700">{tx.nis}</td>
                    <td className="p-3 font-bold text-slate-900">{tx.nama}</td>
                    <td className="p-3 font-semibold text-slate-600">{tx.kelas}</td>
                    <td className="p-3">
                      {tx.jenis === 'setoran' ? (
                        <span className="bg-emerald-100 text-emerald-800 text-3xs font-bold px-2 py-0.5 rounded-full">
                          Setoran
                        </span>
                      ) : tx.jenis === 'penarikan' ? (
                        <span className="bg-amber-100 text-amber-800 text-3xs font-bold px-2 py-0.5 rounded-full">
                          Penarikan
                        </span>
                      ) : (
                        <span className="bg-purple-100 text-purple-800 text-3xs font-bold px-2 py-0.5 rounded-full">
                          Koreksi
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right font-bold text-emerald-700">
                      {tx.setoran > 0 ? formatRupiah(tx.setoran) : '-'}
                    </td>
                    <td className="p-3 text-right font-bold text-amber-700">
                      {tx.penarikan > 0 ? formatRupiah(tx.penarikan) : '-'}
                    </td>
                    <td className="p-3 text-right font-black text-slate-900">{formatRupiah(tx.saldo)}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => setSelectedReceipt(tx)}
                        className="p-1.5 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-700 text-slate-600 rounded-lg transition-colors cursor-pointer"
                        title="Cetak Struk Bukti Transaksi"
                      >
                        <Receipt className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Setor Ke Bank Modal */}
      {showSetorBankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Landmark className="w-5 h-5 text-emerald-600" />
                <span>Penyetoran Kas Sekolah ke Bank</span>
              </h3>
              <button onClick={() => setShowSetorBankModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {bankMsg && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 rounded-xl">
                {bankMsg}
              </div>
            )}

            <form onSubmit={handleBankDeposit} className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Kas Tunai Belum Disetor:</span>
                  <span className="font-bold text-rose-700">{formatRupiah(belumDisetorKeBank)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Petugas Penyetor:</span>
                  <span className="font-bold text-slate-900">{activeUser.nama}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nominal Disetor ke Rekening Bank (Rp)</label>
                <input
                  type="number"
                  value={setorBankAmount}
                  onChange={(e) => setSetorBankAmount(Number(e.target.value))}
                  required
                  min={1}
                  max={belumDisetorKeBank}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowSetorBankModal(false)}
                  className="flex-1 py-2 text-xs font-bold border border-slate-200 rounded-xl hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer"
                >
                  Proses Setor Bank
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 space-y-4">
            <div className="text-center border-b border-dashed border-slate-300 pb-3">
              <h3 className="font-black text-base text-slate-900 uppercase">{settings.nama_sekolah}</h3>
              <p className="text-3xs text-slate-500">{settings.alamat}</p>
              <div className="mt-2 text-xs font-extrabold text-emerald-700 bg-emerald-50 py-1 rounded-lg">
                STRUK BUKTI TRANSAKSI TABUNGAN
              </div>
            </div>

            <div className="text-xs space-y-1.5 font-mono">
              <div className="flex justify-between text-slate-500">
                <span>No. Transaksi:</span>
                <span className="font-bold text-slate-800">{selectedReceipt.id}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Tanggal / Jam:</span>
                <span className="font-bold text-slate-800">
                  {selectedReceipt.tanggal} {selectedReceipt.jam}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>NIS / Nama:</span>
                <span className="font-bold text-slate-800">
                  {selectedReceipt.nis} - {selectedReceipt.nama}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Kelas:</span>
                <span className="font-bold text-slate-800">{selectedReceipt.kelas}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Jenis Transaksi:</span>
                <span className="font-bold uppercase text-slate-800">{selectedReceipt.jenis}</span>
              </div>

              <div className="border-y border-dashed border-slate-300 py-2 my-2 space-y-1 font-sans">
                {selectedReceipt.setoran > 0 && (
                  <div className="flex justify-between font-bold text-emerald-700 text-sm">
                    <span>Setoran:</span>
                    <span>{formatRupiah(selectedReceipt.setoran)}</span>
                  </div>
                )}
                {selectedReceipt.penarikan > 0 && (
                  <div className="flex justify-between font-bold text-amber-700 text-sm">
                    <span>Penarikan:</span>
                    <span>{formatRupiah(selectedReceipt.penarikan)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-slate-900 text-base pt-1">
                  <span>Saldo Akhir:</span>
                  <span>{formatRupiah(selectedReceipt.saldo)}</span>
                </div>
              </div>

              <div className="flex justify-between text-3xs text-slate-500">
                <span>Petugas:</span>
                <span>{selectedReceipt.petugas}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setSelectedReceipt(null)}
                className="flex-1 py-2 text-xs font-bold border border-slate-200 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                Tutup
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs flex items-center justify-center gap-1 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Struk</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
