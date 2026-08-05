import React, { useState } from 'react';
import { Transaksi, User, AppSettings, Kelas, PenyerahanSetoranRecord } from '../types';
import { formatRupiah, formatDateIndo, StorageService } from '../services/storage';
import { FirestoreService } from '../services/firestoreService';
import { BankPortalView } from './BankPortalView';
import {
  GitMerge,
  ArrowRight,
  CheckCircle2,
  Clock,
  Building2,
  Landmark,
  UserCheck,
  Send,
  Printer,
  FileCheck2,
  Filter,
  Users,
  ShieldCheck,
  Building,
  Zap,
  PlusCircle,
  FileText,
} from 'lucide-react';

interface AlurSetoranManagerProps {
  transaksiList: Transaksi[];
  activeUser: User;
  kelasList: Kelas[];
  settings: AppSettings;
  onRefreshData: () => void;
}

export const AlurSetoranManager: React.FC<AlurSetoranManagerProps> = ({
  transaksiList,
  activeUser,
  kelasList,
  settings,
  onRefreshData,
}) => {
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

  const isGuru = activeUser.role === 'guru';
  const isWaliKelasUser = activeUser.role === 'wali_kelas' || Boolean(activeUser.kelas);
  const userAssignedClass = activeUser.kelas || (kelasList[0]?.nama_kelas || '1A');

  const [activeTab, setActiveTab] = useState<'wali_kelas' | 'bendahara' | 'menunggu_bank' | 'bank' | 'riwayat'>('wali_kelas');
  const [selectedKelasFilter, setSelectedKelasFilter] = useState<string>(
    isWaliKelasUser && activeUser.kelas ? activeUser.kelas : 'ALL'
  );
  const [selectedTxIds, setSelectedTxIds] = useState<string[]>([]);
  const [catatanPenyerahan, setCatatanPenyerahan] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedBAST, setSelectedBAST] = useState<PenyerahanSetoranRecord | null>(null);

  // Mode Handover for Wali Kelas: 'rincian' (per transaksi) vs 'manual' (input nominal)
  const [modeHandover, setModeHandover] = useState<'rincian' | 'manual'>('rincian');
  const [manualNominal, setManualNominal] = useState<number>(0);
  const [manualKelas, setManualKelas] = useState<string>(userAssignedClass);
  const [manualCatatan, setManualCatatan] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  // Filter transactions for setoran only
  const setoranList = transaksiList.filter((t) => t.jenis === 'setoran');

  // Tier 1: At Wali Kelas
  const txDiWaliKelas = setoranList.filter((t) => {
    const isWaliState = !t.status_alur || t.status_alur === 'Di Wali Kelas';
    if (selectedKelasFilter === 'ALL') return isWaliState;
    return isWaliState && t.kelas === selectedKelasFilter;
  });

  // Filter transactions created today in Tier 1
  const txTodayDiWaliKelas = txDiWaliKelas.filter((t) => t.tanggal === todayStr);
  const totalTodayDiWaliKelas = txTodayDiWaliKelas.reduce((acc, curr) => acc + curr.setoran, 0);

  // Tier 2: At Bendahara
  const txDiBendahara = setoranList.filter((t) => t.status_alur === 'Disetor ke Bendahara');

  // Tier 2.5: Menunggu Approval Bank
  const txMenungguBank = setoranList.filter((t) => t.status_alur === 'Menunggu Approval Bank' || t.status_bank === 'Menunggu Approval Bank');

  // Tier 3: At Bank
  const txDiBank = setoranList.filter((t) => t.status_alur === 'Disetor ke Bank');

  // Penyerahan Records
  const penyerahanRecords = StorageService.getPenyerahanRecords();

  // Summary Metrics
  const totalDiWaliKelas = setoranList
    .filter((t) => !t.status_alur || t.status_alur === 'Di Wali Kelas')
    .reduce((acc, curr) => acc + curr.setoran, 0);

  const totalDiBendahara = txDiBendahara.reduce((acc, curr) => acc + curr.setoran, 0);
  const totalDiBank = txDiBank.reduce((acc, curr) => acc + curr.setoran, 0);

  // Toggle selection
  const toggleSelectTx = (id: string) => {
    if (selectedTxIds.includes(id)) {
      setSelectedTxIds(selectedTxIds.filter((item) => item !== id));
    } else {
      setSelectedTxIds([...selectedTxIds, id]);
    }
  };

  const selectAllInTab = (list: Transaksi[]) => {
    if (selectedTxIds.length === list.length) {
      setSelectedTxIds([]);
    } else {
      setSelectedTxIds(list.map((t) => t.id));
    }
  };

  // Shortcut: Select all transactions from today
  const handleSelectAllToday = () => {
    const todayIds = txTodayDiWaliKelas.map((t) => t.id);
    setSelectedTxIds(todayIds);
  };

  // Process Handover from Wali Kelas to Bendahara (Itemized)
  const handleSerahkanKeBendahara = async () => {
    if (selectedTxIds.length === 0) {
      alert('Pilih minimal satu transaksi setoran siswa untuk diserahkan ke Bendahara.');
      return;
    }

    const kelasName = selectedKelasFilter === 'ALL' ? 'Kolektif' : selectedKelasFilter;
    const res = await FirestoreService.serahkanSetoranKeBendahara(
      selectedTxIds,
      activeUser.nama,
      kelasName,
      catatanPenyerahan
    );

    if (res.success) {
      setSuccessMessage(res.message);
      setSelectedTxIds([]);
      setCatatanPenyerahan('');
      onRefreshData();
    } else {
      alert(res.message);
    }
  };

  // Process Manual Setoran to Bendahara
  const handleSerahkanManualKeBendahara = async (e: React.FormEvent) => {
    e.preventDefault();
    if (manualNominal <= 0) {
      alert('Nominal setoran manual harus lebih besar dari Rp 0.');
      return;
    }

    const res = await FirestoreService.serahkanSetoranManualKeBendahara(
      manualNominal,
      activeUser.nama,
      manualKelas,
      manualCatatan
    );

    if (res.success) {
      setSuccessMessage(res.message);
      setManualNominal(0);
      setManualCatatan('');
      onRefreshData();
    } else {
      alert(res.message);
    }
  };

  // Process Deposit from Bendahara to Bank
  const handleSetorKeBank = async () => {
    if (selectedTxIds.length === 0) {
      alert('Pilih minimal satu transaksi setoran di Bendahara untuk disetor ke Bank.');
      return;
    }

    const res = await FirestoreService.setorKasKeBankBerjenjang(selectedTxIds, activeUser.nama);

    if (res.success) {
      setSuccessMessage(res.message);
      setSelectedTxIds([]);
      onRefreshData();
    } else {
      alert(res.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner & Title */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-indigo-900/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-2xs font-extrabold text-amber-300 uppercase tracking-widest">
              <GitMerge className="w-3.5 h-3.5" />
              <span>ALUR PENYETORAN DANA BERJENJANG TABSIS</span>
            </div>
            <h2 className="text-2xl font-black text-white">Verifikasi & Penyetoran Berjenjang Kas Sekolah</h2>
            <p className="text-xs text-indigo-200 max-w-2xl font-medium">
              Sistem tata kelola setoran siswa berjenjang: {isGuru ? (
                <strong>Siswa → Wali Kelas → Bendahara Sekolah</strong>
              ) : (
                <strong>Siswa → Wali Kelas → Bendahara Sekolah → Bank Mitra</strong>
              )}. Menjamin akuntabilitas dan transparansi penerimaan kas.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-right min-w-[200px]">
            <span className="text-3xs font-extrabold text-indigo-300 uppercase block tracking-wider">
              Saldo Rekening Bank Sekolah
            </span>
            <div className="text-2xl font-black text-emerald-400">{formatRupiah(settings.saldo_bank || 0)}</div>
            <span className="text-3xs text-indigo-200">Tersimpan di Bank Mitra</span>
          </div>
        </div>

        {/* Workflow Tier Diagram */}
        <div className={`mt-8 grid grid-cols-1 ${isGuru ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-4 pt-6 border-t border-indigo-900/60`}>
          {/* Step 1 */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-amber-400 font-black text-xs">
                <Users className="w-4 h-4" />
                <span>1. Siswa → Wali Kelas</span>
              </div>
              <span className="px-2 py-0.5 bg-amber-400/20 text-amber-300 text-3xs font-bold rounded-full">
                Kas di Wali Kelas
              </span>
            </div>
            <div className="text-lg font-black text-white">{formatRupiah(totalDiWaliKelas)}</div>
            <p className="text-3xs text-slate-300 mt-1">Uang setoran harian dipegang oleh Wali Kelas/Guru.</p>
          </div>

          {/* Step 2 */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-cyan-400 font-black text-xs">
                <Building className="w-4 h-4" />
                <span>2. Wali Kelas → Bendahara</span>
              </div>
              <span className="px-2 py-0.5 bg-cyan-400/20 text-cyan-300 text-3xs font-bold rounded-full">
                Kas di Bendahara
              </span>
            </div>
            <div className="text-lg font-black text-white">{formatRupiah(totalDiBendahara)}</div>
            <p className="text-3xs text-slate-300 mt-1">Wali Kelas menyerahkan rekap kas ke Bendahara Sekolah.</p>
          </div>

          {/* Step 3 (Only shown for Admin & Bendahara) */}
          {!isGuru && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 relative overflow-hidden group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-emerald-400 font-black text-xs">
                  <Landmark className="w-4 h-4" />
                  <span>3. Bendahara → Bank Mitra</span>
                </div>
                <span className="px-2 py-0.5 bg-emerald-400/20 text-emerald-300 text-3xs font-bold rounded-full">
                  Terverifikasi Bank
                </span>
              </div>
              <div className="text-lg font-black text-white">{formatRupiah(totalDiBank)}</div>
              <p className="text-3xs text-slate-300 mt-1">Bendahara menyetorkan kas sekolah ke Rekening Bank Mitra.</p>
            </div>
          )}
        </div>
      </div>

      {/* Tabs Control */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => {
              setActiveTab('wali_kelas');
              setSelectedTxIds([]);
            }}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'wali_kelas' ? 'bg-white text-indigo-900 shadow-2xs font-extrabold' : 'text-slate-600'
            }`}
          >
            <Users className="w-4 h-4 text-amber-500" />
            <span>1. Kas di Wali Kelas ({txDiWaliKelas.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('bendahara');
              setSelectedTxIds([]);
            }}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'bendahara' ? 'bg-white text-indigo-900 shadow-2xs font-extrabold' : 'text-slate-600'
            }`}
          >
            <Building className="w-4 h-4 text-cyan-600" />
            <span>2. Kas di Bendahara ({txDiBendahara.length})</span>
          </button>

          {!isGuru && (
            <button
              onClick={() => {
                setActiveTab('menunggu_bank');
                setSelectedTxIds([]);
              }}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'menunggu_bank' ? 'bg-amber-100 text-amber-950 shadow-2xs font-extrabold border border-amber-300' : 'text-slate-600'
              }`}
            >
              <Clock className="w-4 h-4 text-amber-600" />
              <span>2.5 Menunggu Approval Bank ({txMenungguBank.length})</span>
            </button>
          )}

          {!isGuru && (
            <button
              onClick={() => {
                setActiveTab('bank');
                setSelectedTxIds([]);
              }}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'bank' ? 'bg-white text-indigo-900 shadow-2xs font-extrabold' : 'text-slate-600'
              }`}
            >
              <Landmark className="w-4 h-4 text-emerald-600" />
              <span>3. Terbuku di Bank ({txDiBank.length})</span>
            </button>
          )}

          <button
            onClick={() => {
              setActiveTab('riwayat');
              setSelectedTxIds([]);
            }}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'riwayat' ? 'bg-white text-indigo-900 shadow-2xs font-extrabold' : 'text-slate-600'
            }`}
          >
            <FileCheck2 className="w-4 h-4 text-purple-600" />
            <span>Berita Acara (BAST)</span>
          </button>
        </div>

        {/* Class Filter */}
        {activeTab === 'wali_kelas' && (
          isWaliKelasUser ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-extrabold shadow-2xs">
              <Users className="w-3.5 h-3.5 text-amber-600" />
              <span>Kelas yang Diampu: Kelas {activeUser.kelas || selectedKelasFilter}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-700">Filter Kelas:</span>
              <select
                value={selectedKelasFilter}
                onChange={(e) => setSelectedKelasFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white cursor-pointer"
              >
                <option value="ALL">Semua Kelas</option>
                {kelasList.map((k) => (
                  <option key={k.id} value={k.nama_kelas}>
                    Kelas {k.nama_kelas} ({k.wali_kelas})
                  </option>
                ))}
              </select>
            </div>
          )
        )}
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 font-black cursor-pointer text-xs"
          >
            Tutup
          </button>
        </div>
      )}

      {/* TIER 1: KAS DI WALI KELAS */}
      {activeTab === 'wali_kelas' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-500" />
                <span>Tier 1: Penyetoran Tabungan dari Wali Kelas ke Bendahara Sekolah</span>
              </h3>
              <p className="text-xs text-slate-500">
                Pilih transaksi setoran siswa atau masukkan nominal setoran manual secara kolektif untuk menyerahkan kas kelas ke Bendahara.
              </p>
            </div>

            {/* Mode Handover Toggle */}
            <div className="flex p-1 bg-slate-100 rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => setModeHandover('rincian')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  modeHandover === 'rincian'
                    ? 'bg-white text-indigo-950 shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-amber-600" />
                <span>📋 Rincian Transaksi</span>
              </button>
              <button
                type="button"
                onClick={() => setModeHandover('manual')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  modeHandover === 'manual'
                    ? 'bg-white text-indigo-950 shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Send className="w-3.5 h-3.5 text-emerald-600" />
                <span>✍️ Input Manual Nominal</span>
              </button>
            </div>
          </div>

          {/* MODE 1: RINCIAN TRANSAKSI SISWA */}
          {modeHandover === 'rincian' && (
            <div className="space-y-4">
              {/* Shortcut Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-amber-50/80 border border-amber-200/80 rounded-2xl">
                <div className="flex items-center gap-2">
                  <span className="text-2xs font-black uppercase text-amber-900 tracking-wider">
                    Pilihan Cepat Setoran:
                  </span>
                  {txTodayDiWaliKelas.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSelectAllToday}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-2xs font-extrabold rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-200 fill-amber-200" />
                      <span>
                        Setorkan Semua Setoran Hari Ini ({formatDateIndo(todayStr)} - {formatRupiah(totalTodayDiWaliKelas)})
                      </span>
                    </button>
                  )}
                </div>

                {txDiWaliKelas.length > 0 && (
                  <button
                    type="button"
                    onClick={() => selectAllInTab(txDiWaliKelas)}
                    className="px-3 py-1.5 bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 text-2xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    {selectedTxIds.length === txDiWaliKelas.length ? 'Batal Pilih Semua' : 'Pilih Semua Setoran Belum Disetor'}
                  </button>
                )}
              </div>

              {txDiWaliKelas.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs font-medium">
                  Tidak ada dana setoran siswa yang mengendap di Wali Kelas untuk filter ini.
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                          <th className="p-3 text-center w-12">Pilih</th>
                          <th className="p-3">Tanggal & Jam</th>
                          <th className="p-3">Siswa & Kelas</th>
                          <th className="p-3">Penerima (Guru)</th>
                          <th className="p-3">Keterangan</th>
                          <th className="p-3 text-right">Nominal Setoran</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {txDiWaliKelas.map((t) => (
                          <tr
                            key={t.id}
                            onClick={() => toggleSelectTx(t.id)}
                            className={`hover:bg-amber-50/50 cursor-pointer transition-colors ${
                              selectedTxIds.includes(t.id) ? 'bg-amber-50' : ''
                            }`}
                          >
                            <td className="p-3 text-center">
                              <input
                                type="checkbox"
                                checked={selectedTxIds.includes(t.id)}
                                onChange={() => toggleSelectTx(t.id)}
                                className="w-4 h-4 text-emerald-600 rounded-xs focus:ring-emerald-500 cursor-pointer"
                              />
                            </td>
                            <td className="p-3 font-mono font-bold text-slate-600">
                              {formatDateIndo(t.tanggal)} <span className="text-3xs text-slate-400">{t.jam}</span>
                            </td>
                            <td className="p-3">
                              <div className="font-bold text-slate-900">{t.nama}</div>
                              <div className="text-3xs text-slate-500 font-mono">
                                Kelas {t.kelas} • NIS: {t.nis}
                              </div>
                            </td>
                            <td className="p-3 font-medium text-slate-700">{t.petugas}</td>
                            <td className="p-3 text-slate-600">{t.keterangan}</td>
                            <td className="p-3 text-right font-black text-amber-700">{formatRupiah(t.setoran)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Handover Action Panel */}
                  <div className="p-5 bg-gradient-to-r from-amber-500/10 via-amber-50 to-amber-100/50 border border-amber-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <span className="text-2xs font-extrabold uppercase text-amber-900 tracking-wider block">
                        Penyerahan Ke Bendahara Sekolah
                      </span>
                      <div className="text-sm font-bold text-amber-950 mt-0.5">
                        Terpilih: <strong>{selectedTxIds.length} Transaksi</strong> • Total Nominal: {' '}
                        <span className="text-emerald-700 font-black">
                          {formatRupiah(
                            txDiWaliKelas
                              .filter((t) => selectedTxIds.includes(t.id))
                              .reduce((a, b) => a + b.setoran, 0)
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                      <input
                        type="text"
                        value={catatanPenyerahan}
                        onChange={(e) => setCatatanPenyerahan(e.target.value)}
                        placeholder="Catatan penyerahan (opsional)..."
                        className="px-3 py-2 text-xs border border-amber-300 rounded-xl bg-white w-full sm:w-64 font-medium"
                      />
                      <button
                        onClick={handleSerahkanKeBendahara}
                        disabled={selectedTxIds.length === 0}
                        className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap w-full sm:w-auto"
                      >
                        <Send className="w-4 h-4" />
                        <span>Serahkan Ke Bendahara</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* MODE 2: INPUT MANUAL NOMINAL SETORAN */}
          {modeHandover === 'manual' && (
            <form onSubmit={handleSerahkanManualKeBendahara} className="space-y-6 bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Target Kelas */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kelas Setoran:</label>
                  {isWaliKelasUser ? (
                    <div className="w-full px-4 py-2.5 text-xs font-extrabold border border-amber-300 rounded-xl bg-amber-50 text-amber-950 flex items-center justify-between shadow-2xs">
                      <span>Kelas {manualKelas} ({activeUser.nama})</span>
                      <span className="px-2 py-0.5 bg-amber-200 text-amber-900 text-3xs font-black rounded-md">
                        Kelas yang Diampu
                      </span>
                    </div>
                  ) : (
                    <select
                      value={manualKelas}
                      onChange={(e) => setManualKelas(e.target.value)}
                      className="w-full px-4 py-2.5 text-xs font-bold border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    >
                      {kelasList.map((k) => (
                        <option key={k.id} value={k.nama_kelas}>
                          Kelas {k.nama_kelas} ({k.wali_kelas})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Info Saldo Kas Kelas */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <span className="text-3xs font-extrabold text-amber-800 uppercase block tracking-wider">
                      Saldo Kas Kelas {manualKelas} di Wali Kelas:
                    </span>
                    <div className="text-lg font-black text-amber-900">
                      {formatRupiah(
                        setoranList
                          .filter(
                            (t) =>
                              (!t.status_alur || t.status_alur === 'Di Wali Kelas') &&
                              t.kelas === manualKelas
                          )
                          .reduce((acc, curr) => acc + curr.setoran, 0)
                      )}
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-amber-200/80 text-amber-900 text-3xs font-bold rounded-lg">
                    Setoran Hari Ini:{' '}
                    {formatRupiah(
                      setoranList
                        .filter(
                          (t) =>
                            (!t.status_alur || t.status_alur === 'Di Wali Kelas') &&
                            t.kelas === manualKelas &&
                            t.tanggal === todayStr
                        )
                        .reduce((acc, curr) => acc + curr.setoran, 0)
                    )}
                  </span>
                </div>
              </div>

              {/* Nominal Setoran Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nominal Setoran Manual Ke Bendahara (Rp):
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-lg font-black text-slate-400 font-mono">Rp</span>
                  <input
                    type="number"
                    value={manualNominal || ''}
                    onChange={(e) => setManualNominal(Number(e.target.value))}
                    placeholder="Masukkan jumlah setoran manual..."
                    className="w-full pl-12 pr-4 py-3 text-lg font-black border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                {/* Quick Nominal Chips */}
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      const kasKelasAmount = setoranList
                        .filter(
                          (t) =>
                            (!t.status_alur || t.status_alur === 'Di Wali Kelas') &&
                            t.kelas === manualKelas
                        )
                        .reduce((acc, curr) => acc + curr.setoran, 0);
                      setManualNominal(kasKelasAmount);
                    }}
                    className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 text-3xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    ⚡ Gunakan Seluruh Kas Kelas (
                    {formatRupiah(
                      setoranList
                        .filter(
                          (t) =>
                            (!t.status_alur || t.status_alur === 'Di Wali Kelas') &&
                            t.kelas === manualKelas
                        )
                        .reduce((acc, curr) => acc + curr.setoran, 0)
                    )}
                    )
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const todayAmount = setoranList
                        .filter(
                          (t) =>
                            (!t.status_alur || t.status_alur === 'Di Wali Kelas') &&
                            t.kelas === manualKelas &&
                            t.tanggal === todayStr
                        )
                        .reduce((acc, curr) => acc + curr.setoran, 0);
                      setManualNominal(todayAmount);
                    }}
                    className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-3xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    📅 Gunakan Setoran Hari Ini (
                    {formatRupiah(
                      setoranList
                        .filter(
                          (t) =>
                            (!t.status_alur || t.status_alur === 'Di Wali Kelas') &&
                            t.kelas === manualKelas &&
                            t.tanggal === todayStr
                        )
                        .reduce((acc, curr) => acc + curr.setoran, 0)
                    )}
                    )
                  </button>

                  {[100000, 200000, 500000, 1000000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setManualNominal((prev) => (prev || 0) + amt)}
                      className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-3xs font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      +{formatRupiah(amt)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Catatan Penyerahan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Penyerahan / BAST (Opsional):
                </label>
                <input
                  type="text"
                  value={manualCatatan}
                  onChange={(e) => setManualCatatan(e.target.value)}
                  placeholder="Contoh: Penyerahan setoran tabungan siswa tanggal..."
                  className="w-full px-4 py-2.5 text-xs font-medium border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Live Info Banner */}
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-medium flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>
                  Otomatisasi Sistem: Menyetorkan <strong>{formatRupiah(manualNominal || 0)}</strong> akan otomatis{' '}
                  <strong className="text-amber-800 font-extrabold">mengurangi Kas Kelas {manualKelas}</strong> dan{' '}
                  <strong className="text-emerald-800 font-extrabold">menambahkan Kas di Bendahara Sekolah</strong>.
                </span>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={manualNominal <= 0}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Proses & Serahkan Setoran Manual Ke Bendahara ({formatRupiah(manualNominal || 0)})</span>
              </button>
            </form>
          )}
        </div>
      )}

      {/* TIER 2: KAS DI BENDAHARA */}
      {activeTab === 'bendahara' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building className="w-5 h-5 text-cyan-600" />
                <span>Tier 2: Dana Kas Tabungan Terkumpul di Bendahara Sekolah</span>
              </h3>
              <p className="text-xs text-slate-500">
                Pilih setoran kas yang telah diserahkan oleh Wali Kelas untuk disetorkan oleh Bendahara ke Rekening Bank Mitra Sekolah.
              </p>
            </div>

            {txDiBendahara.length > 0 && (
              <button
                onClick={() => selectAllInTab(txDiBendahara)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                {selectedTxIds.length === txDiBendahara.length ? 'Batal Pilih Semua' : 'Pilih Semua Kas Bendahara'}
              </button>
            )}
          </div>

          {txDiBendahara.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs font-medium">
              Tidak ada kas setoran yang belum disetor ke Bank di Bendahara saat ini.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                      <th className="p-3 text-center w-12">Pilih</th>
                      <th className="p-3">Tanggal Setor</th>
                      <th className="p-3">Siswa & Kelas</th>
                      <th className="p-3">Diserahkan Oleh</th>
                      <th className="p-3">Keterangan</th>
                      <th className="p-3 text-right">Nominal Kas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {txDiBendahara.map((t) => (
                      <tr
                        key={t.id}
                        onClick={() => toggleSelectTx(t.id)}
                        className={`hover:bg-cyan-50/50 cursor-pointer transition-colors ${
                          selectedTxIds.includes(t.id) ? 'bg-cyan-50' : ''
                        }`}
                      >
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={selectedTxIds.includes(t.id)}
                            onChange={() => toggleSelectTx(t.id)}
                            className="w-4 h-4 text-cyan-600 rounded-xs focus:ring-cyan-500 cursor-pointer"
                          />
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-600">
                          {formatDateIndo(t.tanggal_setor_bendahara || t.tanggal)}
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{t.nama}</div>
                          <div className="text-3xs text-slate-500 font-mono">
                            Kelas {t.kelas} • NIS: {t.nis}
                          </div>
                        </td>
                        <td className="p-3 font-medium text-slate-700">{t.petugas_bendahara || t.petugas}</td>
                        <td className="p-3 text-slate-600">{t.keterangan}</td>
                        <td className="p-3 text-right font-black text-cyan-700">{formatRupiah(t.setoran)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Deposit to Bank Action Panel */}
              <div className="p-5 bg-gradient-to-r from-cyan-500/10 via-cyan-50 to-teal-100/50 border border-cyan-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-2xs font-extrabold uppercase text-cyan-900 tracking-wider block">
                    Penyetoran Kas Sekolah Ke Bank Mitra
                  </span>
                  <div className="text-sm font-bold text-cyan-950 mt-0.5">
                    Terpilih: <strong>{selectedTxIds.length} Transaksi</strong> • Total Nominal Kas: {' '}
                    <span className="text-emerald-700 font-black">
                      {formatRupiah(
                        txDiBendahara
                          .filter((t) => selectedTxIds.includes(t.id))
                          .reduce((a, b) => a + b.setoran, 0)
                      )}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleSetorKeBank}
                  disabled={selectedTxIds.length === 0}
                  className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <Landmark className="w-4 h-4 text-amber-300" />
                  <span>Ajukan Setoran Ke Bank (Proses Approval)</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* TIER 2.5: MENUNGGU APPROVAL BANK */}
      {activeTab === 'menunggu_bank' && (
        <div className="bg-white rounded-2xl border border-amber-200 shadow-2xs p-6 space-y-6">
          <div className="border-b border-amber-100 pb-4">
            <h3 className="text-sm font-bold text-amber-950 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <span>Status: Pengajuan Setoran Menunggu Approval Admin Bank Mitra</span>
            </h3>
            <p className="text-xs text-slate-500">
              Daftar transaksi yang telah diajukan Bendahara dan saat ini sedang menunggu konfirmasi/persetujuan penerimaan dana fisik dari pihak Admin Bank Mitra.
            </p>
          </div>

          {txMenungguBank.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs font-medium">
              Tidak ada transaksi setoran yang sedang menunggu approval Bank saat ini.
            </div>
          ) : (
            <div className="overflow-x-auto border border-amber-200 rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-amber-50 text-amber-950 font-bold border-b border-amber-200">
                    <th className="p-3">No</th>
                    <th className="p-3">Tanggal Pengajuan</th>
                    <th className="p-3">Siswa & Kelas</th>
                    <th className="p-3">Petugas Bendahara</th>
                    <th className="p-3">Keterangan</th>
                    <th className="p-3 text-right">Nominal Setoran</th>
                    <th className="p-3 text-center">Status Approval</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100 font-medium">
                  {txMenungguBank.map((t, idx) => (
                    <tr key={t.id} className="hover:bg-amber-50/50">
                      <td className="p-3 text-slate-400 font-semibold">{idx + 1}</td>
                      <td className="p-3 font-mono font-bold text-slate-700">
                        {formatDateIndo(t.tanggal_setor_bank || t.tanggal)}
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{t.nama}</div>
                        <div className="text-3xs text-slate-500 font-mono">
                          Kelas {t.kelas} • NIS: {t.nis}
                        </div>
                      </td>
                      <td className="p-3 font-bold text-slate-800">{t.petugas_bendahara || settings.bendahara}</td>
                      <td className="p-3 text-slate-700">{t.keterangan}</td>
                      <td className="p-3 text-right font-black text-amber-900">{formatRupiah(t.setoran)}</td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-3xs font-black uppercase tracking-wider">
                          <Clock className="w-3 h-3 text-amber-700 animate-pulse" />
                          <span>Menunggu Approval Bank</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TIER 3: TERSETOR DI BANK */}
      {activeTab === 'bank' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Landmark className="w-5 h-5 text-emerald-600" />
              <span>Tier 3: Setoran Terverifikasi & Terbuku di Bank Mitra Sekolah</span>
            </h3>
            <p className="text-xs text-slate-500">
              Daftar seluruh setoran tabungan siswa yang telah sukses disetorkan Bendahara dan tersimpan secara aman di Bank.
            </p>
          </div>

          {txDiBank.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs font-medium">
              Belum ada riwayat transaksi setoran yang masuk ke status disetor ke Bank.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <th className="p-3">No</th>
                    <th className="p-3">Tanggal Bank</th>
                    <th className="p-3">Siswa & Kelas</th>
                    <th className="p-3">Petugas Bendahara</th>
                    <th className="p-3 text-center">Status Bank</th>
                    <th className="p-3 text-right">Nominal Setoran</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {txDiBank.map((t, idx) => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="p-3 text-slate-400 font-semibold">{idx + 1}</td>
                      <td className="p-3 font-mono font-bold text-slate-700">
                        {formatDateIndo(t.tanggal_setor_bank || t.tanggal)}
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{t.nama}</div>
                        <div className="text-3xs text-slate-500 font-mono">
                          Kelas {t.kelas} • NIS: {t.nis}
                        </div>
                      </td>
                      <td className="p-3 font-medium text-slate-700">{t.petugas_bank || t.petugas}</td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-3xs font-extrabold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Terbuku di Bank</span>
                        </span>
                      </td>
                      <td className="p-3 text-right font-black text-emerald-700">{formatRupiah(t.setoran)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* RIWAYAT BERITA ACARA (BAST) */}
      {activeTab === 'riwayat' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-purple-600" />
              <span>Dokumen Berita Acara Serah Terima (BAST) Penyerahan Kas</span>
            </h3>
            <p className="text-xs text-slate-500">
              Arsip resmi bukti penyerahan uang setoran tabungan dari Wali Kelas ke Bendahara Sekolah.
            </p>
          </div>

          {penyerahanRecords.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs font-medium">
              Belum ada dokumen Berita Acara Serah Terima (BAST) penyerahan kas yang tercatat.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <th className="p-3">No. BAST</th>
                    <th className="p-3">Tanggal & Jam</th>
                    <th className="p-3">Kelas / Sumber</th>
                    <th className="p-3">Penyerah (Wali)</th>
                    <th className="p-3 text-center">Jumlah Transaksi</th>
                    <th className="p-3 text-right">Total Nominal</th>
                    <th className="p-3 text-center">Cetak Document</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {penyerahanRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-indigo-900">{r.id}</td>
                      <td className="p-3 font-medium text-slate-600">
                        {formatDateIndo(r.tanggal)} <span className="text-3xs text-slate-400">{r.jam}</span>
                      </td>
                      <td className="p-3 font-bold text-slate-900">Kelas {r.kelas}</td>
                      <td className="p-3 font-medium text-slate-700">{r.wali_kelas}</td>
                      <td className="p-3 text-center font-bold text-slate-800">{r.jumlah_transaksi} Transaksi</td>
                      <td className="p-3 text-right font-black text-emerald-700">{formatRupiah(r.total_nominal)}</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => setSelectedBAST(r)}
                          className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-bold rounded-lg text-3xs transition-colors cursor-pointer inline-flex items-center gap-1 border border-indigo-200"
                        >
                          <Printer className="w-3.5 h-3.5 text-indigo-700" />
                          <span>Cetak BAST</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* BAST Printable Modal */}
      {selectedBAST && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden print:shadow-none print:m-0 print:border-none">
            {/* Action Bar (Screen Only) */}
            <div className="bg-slate-900 p-4 text-white flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold">Preview Berita Acara Serah Terima (BAST)</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Dokumen</span>
                </button>
                <button
                  onClick={() => setSelectedBAST(null)}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>

            {/* Printable Document Body */}
            <div className="p-8 space-y-6 text-slate-900 font-serif">
              {/* Kop Surat Header */}
              <div className="text-center border-b-2 border-slate-900 pb-4">
                <h2 className="text-lg font-black uppercase tracking-wider">{settings.nama_sekolah}</h2>
                <p className="text-xs font-sans text-slate-600">{settings.alamat} • NPSN: {settings.npsn}</p>
                <div className="mt-2 inline-block border-b-2 border-slate-900 font-sans font-black text-sm uppercase tracking-widest px-4 py-0.5">
                  BERITA ACARA SERAH TERIMA KAS TABUNGAN SISWA
                </div>
                <div className="text-3xs font-mono text-slate-500 mt-1">Nomor BAST: {selectedBAST.id}</div>
              </div>

              {/* Statement Body */}
              <div className="text-xs font-sans space-y-3 leading-relaxed">
                <p>
                  Pada hari ini, <strong>{formatDateIndo(selectedBAST.tanggal)}</strong>, telah dilakukan penyerahan fisik uang tunai hasil setoran tabungan siswa dengan rincian sebagai berikut:
                </p>

                <table className="w-full text-xs border border-slate-300 border-collapse my-4">
                  <tbody>
                    <tr className="border-b border-slate-300 bg-slate-50">
                      <td className="p-2.5 font-bold w-1/3">Kelas / Sumber Dana:</td>
                      <td className="p-2.5 font-black text-indigo-950">Kelas {selectedBAST.kelas}</td>
                    </tr>
                    <tr className="border-b border-slate-300">
                      <td className="p-2.5 font-bold">Wali Kelas / Pihak Penyerah:</td>
                      <td className="p-2.5 font-bold">{selectedBAST.wali_kelas}</td>
                    </tr>
                    <tr className="border-b border-slate-300 bg-slate-50">
                      <td className="p-2.5 font-bold">Penerima Kas (Bendahara):</td>
                      <td className="p-2.5 font-bold">{settings.bendahara}</td>
                    </tr>
                    <tr className="border-b border-slate-300">
                      <td className="p-2.5 font-bold">Jumlah Transaksi Setoran:</td>
                      <td className="p-2.5 font-bold">{selectedBAST.jumlah_transaksi} Transaksi Siswa</td>
                    </tr>
                    <tr className="bg-emerald-50">
                      <td className="p-2.5 font-bold text-emerald-950">Total Nominal Diserahkan:</td>
                      <td className="p-2.5 font-black text-emerald-950 text-sm">
                        {formatRupiah(selectedBAST.total_nominal)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <p className="italic text-slate-600">
                  Catatan: "{selectedBAST.catatan || 'Penyerahan kas dalam keadaan cukup dan terverifikasi.'}"
                </p>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 text-center text-xs font-sans pt-8">
                <div>
                  <p className="text-slate-500">Pihak Yang Menyerahkan (Wali Kelas),</p>
                  <div className="h-16"></div>
                  <p className="font-bold underline uppercase">{selectedBAST.wali_kelas}</p>
                </div>
                <div>
                  <p className="text-slate-500">Pihak Yang Menerima (Bendahara Sekolah),</p>
                  <div className="h-16"></div>
                  <p className="font-bold underline uppercase">{settings.bendahara}</p>
                  <p className="text-3xs text-slate-500">NIP: {settings.nip_bendahara}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
