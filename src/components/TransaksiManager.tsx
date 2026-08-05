import React, { useState, useEffect } from 'react';
import { Siswa, Transaksi, User, JenisTransaksi, Kelas } from '../types';
import { formatRupiah, StorageService, isSameKelas } from '../services/storage';
import { QRScannerModal } from './QRScannerModal';
import { SearchableSiswaSelect } from './SearchableSiswaSelect';
import {
  ArrowDownUp,
  PlusCircle,
  MinusCircle,
  AlertTriangle,
  CheckCircle2,
  Users,
  Search,
  Receipt,
  Printer,
  Sparkles,
  Zap,
  QrCode,
} from 'lucide-react';

interface TransaksiManagerProps {
  siswaList: Siswa[];
  kelasList?: Kelas[];
  activeUser: User;
  initialJenis?: 'setoran' | 'penarikan';
  onRefreshData: () => void;
  onNavigateToPassbook: (nis: string) => void;
}

export const TransaksiManager: React.FC<TransaksiManagerProps> = ({
  siswaList,
  kelasList = [],
  activeUser,
  initialJenis = 'setoran',
  onRefreshData,
  onNavigateToPassbook,
}) => {
  const [tabMode, setTabMode] = useState<'single' | 'batch'>('single');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [qrNotice, setQrNotice] = useState<string | null>(null);

  // Single Form State
  const [selectedNis, setSelectedNis] = useState('');
  const [tanggalTx, setTanggalTx] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [jenis, setJenis] = useState<JenisTransaksi>(initialJenis);
  const [nominal, setNominal] = useState<number>(0);
  const [keterangan, setKeterangan] = useState('Setoran Tabungan Siswa');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [createdTx, setCreatedTx] = useState<Transaksi | null>(null);

  // Available classes list for dropdown
  const classOptions = Array.from(
    new Set([
      ...(kelasList && kelasList.length > 0 ? kelasList.map((k) => k.nama_kelas) : []),
      ...siswaList.map((s) => s.kelas),
      '1-A', '1-B', '2-A', '2-B', '3-A', '3-B', '4-A', '4-B', '5-A', '5-B', '6-A', '6-B'
    ].filter(Boolean))
  ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  // Only users with role === 'guru' are restricted to their class
  const isGuru = activeUser.role === 'guru';

  // Batch Form State (Setoran Per Kelas)
  const [selectedBatchKelas, setSelectedBatchKelas] = useState(() => {
    if (isGuru && activeUser.kelas) {
      return activeUser.kelas;
    }
    return classOptions[0] || '1-A';
  });
  const [batchTanggal, setBatchTanggal] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [batchAmounts, setBatchAmounts] = useState<{ [nis: string]: number }>({});
  const [batchSuccessMsg, setBatchSuccessMsg] = useState('');

  // Filtered active student list based on role
  const filteredSiswaList = siswaList.filter((s) => {
    if (s.status !== 'Aktif') return false;
    if (isGuru && activeUser.kelas && !isSameKelas(s.kelas, activeUser.kelas)) return false;
    return true;
  });

  // Selected Student Details for Single Form
  const selectedSiswa = siswaList.find((s) => s.nis === selectedNis || s.nisn === selectedNis);

  useEffect(() => {
    if (initialJenis) setJenis(initialJenis);
  }, [initialJenis]);

  // Handle Single Transaction Submission
  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setCreatedTx(null);

    if (!selectedNis) {
      setMessage({ type: 'error', text: 'Pilih siswa terlebih dahulu.' });
      return;
    }

    const res = StorageService.processTransaction({
      nis: selectedNis,
      jenis,
      nominal,
      keterangan,
      petugas: activeUser.nama,
      tanggal: tanggalTx,
    });

    if (res.success && res.transaction) {
      setMessage({ type: 'success', text: res.message });
      setCreatedTx(res.transaction);
      setNominal(0);
      onRefreshData();
    } else {
      setMessage({ type: 'error', text: res.message });
    }
  };

  // Handle Batch Class Savings Submission
  const handleBatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBatchSuccessMsg('');

    const targetStudents = siswaList.filter((s) => isSameKelas(s.kelas, selectedBatchKelas) && s.status === 'Aktif');
    let countProcessed = 0;
    let totalBatchAmount = 0;

    targetStudents.forEach((s) => {
      const amt = batchAmounts[s.nis] || 0;
      if (amt > 0) {
        StorageService.processTransaction({
          nis: s.nis,
          jenis: 'setoran',
          nominal: amt,
          keterangan: `Setoran Kolektif Kelas ${selectedBatchKelas}`,
          petugas: activeUser.nama,
          tanggal: batchTanggal,
        });
        countProcessed++;
        totalBatchAmount += amt;
      }
    });

    if (countProcessed > 0) {
      setBatchSuccessMsg(
        `Berhasil memproses setoran kolektif untuk ${countProcessed} siswa Kelas ${selectedBatchKelas} dengan total Rp ${totalBatchAmount.toLocaleString('id-ID')}!`
      );
      setBatchAmounts({});
      onRefreshData();
    } else {
      alert('Masukkan nominal setoran untuk minimal 1 siswa.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <ArrowDownUp className="w-6 h-6 text-emerald-600" />
            <span>Sistem Input Transaksi Tabungan</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pencatatan setoran, penarikan, dan koreksi saldo siswa secara cepat & real-time.
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setTabMode('single')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              tabMode === 'single' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600'
            }`}
          >
            Transaksi Individu
          </button>
          <button
            onClick={() => setTabMode('batch')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              tabMode === 'batch' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Setoran Kolektif Kelas</span>
          </button>
        </div>
      </div>

      {tabMode === 'single' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Transaction Form */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Form Transaksi Tabungan Single
            </h3>

            {message && (
              <div
                className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  message.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                )}
                <span>{message.text}</span>
              </div>
            )}

            <form onSubmit={handleSingleSubmit} className="space-y-4">
              {/* Select Student */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Pilih Siswa (Ketik NIS/NISN atau Nama)
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsScannerOpen(true)}
                    className="px-2.5 py-1 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-2xs rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5 text-amber-300" />
                    <span>Scan QR Siswa</span>
                  </button>
                </div>

                {qrNotice && (
                  <div className="mb-2 p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-2xs font-bold rounded-xl flex items-center gap-1.5 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{qrNotice}</span>
                  </div>
                )}

                <SearchableSiswaSelect
                  siswaList={filteredSiswaList}
                  selectedNis={selectedNis}
                  onSelectSiswa={(nis) => {
                    setSelectedNis(nis);
                    setQrNotice(null);
                  }}
                  required
                />
              </div>

              {/* Tanggal Penyetoran / Transaksi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tanggal Penyetoran / Transaksi
                </label>
                <input
                  type="date"
                  value={tanggalTx}
                  onChange={(e) => setTanggalTx(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white font-bold text-slate-800"
                />
                <p className="text-3xs text-slate-500 mt-1">
                  Otomatis terisi tanggal hari ini. Silakan ubah jika ingin menginput tanggal lain.
                </p>
              </div>

              {/* Transaction Type Radio Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Jenis Transaksi</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setJenis('setoran');
                      setKeterangan('Setoran Tabungan Siswa');
                    }}
                    className={`py-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      jenis === 'setoran'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <PlusCircle className="w-5 h-5" />
                    <span>SETORAN</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setJenis('penarikan');
                      setKeterangan('Penarikan Tabungan Siswa');
                    }}
                    className={`py-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      jenis === 'penarikan'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <MinusCircle className="w-5 h-5" />
                    <span>PENARIKAN</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setJenis('koreksi');
                      setKeterangan('Koreksi Saldo Tabungan');
                    }}
                    className={`py-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      jenis === 'koreksi'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowDownUp className="w-5 h-5" />
                    <span>KOREKSI</span>
                  </button>
                </div>
              </div>

              {/* Nominal Amount Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nominal Transaksi (Rp)
                </label>
                <input
                  type="number"
                  value={nominal || ''}
                  onChange={(e) => setNominal(Number(e.target.value))}
                  required
                  min={1}
                  placeholder="Masukkan jumlah uang..."
                  className="w-full px-4 py-3 text-lg font-black border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
                />
                {/* Quick nominal chip buttons for Indonesian Rupee denominations */}
                <div className="space-y-1.5 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-3xs font-semibold text-slate-500">Pecahan Uang Rupiah (Tambah Nominal):</span>
                    {nominal > 0 && (
                      <button
                        type="button"
                        onClick={() => setNominal(0)}
                        className="text-3xs font-bold text-red-500 hover:text-red-700 underline cursor-pointer"
                      >
                        Reset Nominal
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[500, 1000, 2000, 5000, 10000, 20000, 50000, 100000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setNominal((prev) => (prev || 0) + amt)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 text-3xs font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        +{formatRupiah(amt)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Keterangan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Keterangan Catatan</label>
                <input
                  type="text"
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Proses & Simpan Transaksi
              </button>
            </form>
          </div>

          {/* Student Account Summary Panel */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Informasi Rekening Siswa
            </h3>

            {selectedSiswa ? (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                  <span className="text-2xs font-bold uppercase text-emerald-800 block">Saldo Saat Ini</span>
                  <div className="text-2xl font-black text-emerald-900 mt-1">
                    {formatRupiah(selectedSiswa.saldo)}
                  </div>
                  {jenis === 'penarikan' && (
                    <div className="mt-2 text-3xs font-bold text-amber-800 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Sisa Saldo Setelah Penarikan: {formatRupiah(selectedSiswa.saldo - nominal)}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-slate-600">
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span>Nama Siswa:</span>
                    <span className="font-bold text-slate-900">{selectedSiswa.nama}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span>NIS / NISN:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {selectedSiswa.nis} / {selectedSiswa.nisn}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span>Kelas:</span>
                    <span className="font-bold text-slate-900">{selectedSiswa.kelas}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span>Orang Tua:</span>
                    <span className="font-bold text-slate-900">{selectedSiswa.orang_tua}</span>
                  </div>
                </div>

                <button
                  onClick={() => onNavigateToPassbook(selectedSiswa.nis)}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Lihat Buku Tabungan Digital
                </button>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                Silakan pilih siswa dari dropdown di sebelah kiri untuk melihat saldo dan informasi tabungan.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* BATCH SETORAN KOLEKTIF KELAS */
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Setoran Tabungan Kolektif Kelas</h3>
              <p className="text-xs text-slate-500">
                Input setoran tabungan pagi untuk seluruh siswa dalam satu kelas sekaligus.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-700">Tanggal:</span>
                <input
                  type="date"
                  value={batchTanggal}
                  onChange={(e) => setBatchTanggal(e.target.value)}
                  required
                  className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white font-bold cursor-pointer"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-700">Pilih Kelas:</span>
                {isGuru && activeUser.kelas ? (
                  <div className="px-3 py-1.5 text-xs border border-amber-300 rounded-xl bg-amber-50 text-amber-950 font-extrabold">
                    Kelas {activeUser.kelas} (Yang Diampu)
                  </div>
                ) : (
                  <select
                    value={selectedBatchKelas}
                    onChange={(e) => {
                      setSelectedBatchKelas(e.target.value);
                      setBatchSuccessMsg('');
                    }}
                    className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white font-bold cursor-pointer"
                  >
                    {classOptions.map((k) => (
                      <option key={k} value={k}>
                        Kelas {k}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          {batchSuccessMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 rounded-xl">
              {batchSuccessMsg}
            </div>
          )}

          {siswaList.filter((s) => isSameKelas(s.kelas, selectedBatchKelas) && s.status === 'Aktif').length === 0 ? (
            <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">Belum ada siswa aktif di Kelas {selectedBatchKelas}</p>
              <p className="text-2xs text-slate-500 mt-1">
                Silakan ganti ke kelas lain melalui dropdown di atas atau tambahkan data siswa di menu Data Siswa.
              </p>
            </div>
          ) : (
            <form onSubmit={handleBatchSubmit} className="space-y-4">
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                      <th className="p-3">No</th>
                      <th className="p-3">NIS</th>
                      <th className="p-3">Nama Siswa</th>
                      <th className="p-3 text-right">Saldo Saat Ini</th>
                      <th className="p-3 text-right">Setoran Hari Ini (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {siswaList
                      .filter((s) => isSameKelas(s.kelas, selectedBatchKelas) && s.status === 'Aktif')
                      .map((s, idx) => (
                        <tr key={s.id} className="hover:bg-slate-50">
                          <td className="p-3 text-slate-400 font-semibold">{idx + 1}</td>
                          <td className="p-3 font-mono font-bold text-slate-700">{s.nis}</td>
                          <td className="p-3 font-bold text-slate-900">{s.nama}</td>
                          <td className="p-3 text-right font-bold text-emerald-700">{formatRupiah(s.saldo)}</td>
                          <td className="p-3 text-right">
                            <input
                              type="number"
                              value={batchAmounts[s.nis] || ''}
                              onChange={(e) =>
                                setBatchAmounts({ ...batchAmounts, [s.nis]: Number(e.target.value) })
                              }
                              placeholder="0"
                              className="w-36 px-3 py-1.5 text-xs text-right border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold"
                            />
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Simpan Semua Setoran Kelas {selectedBatchKelas}
              </button>
            </form>
          )}
        </div>
      )}

      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        siswaList={siswaList}
        title="Scan QR Siswa Untuk Transaksi"
        subtitle="Dekatkan QR Code kartu siswa untuk otomatis mengisi data transaksi"
        onScanSuccess={({ nisOrNisn, siswa }) => {
          let targetSiswa = siswa;
          if (!targetSiswa) {
            targetSiswa = siswaList.find(
              (s) => s.nis === nisOrNisn || s.nisn === nisOrNisn || s.id === nisOrNisn
            );
          }
          if (targetSiswa) {
            setSelectedNis(targetSiswa.nis);
            setQrNotice(`QR Code Terdeteksi! Siswa "${targetSiswa.nama}" (Kelas ${targetSiswa.kelas}) otomatis terpilih.`);
            setMessage(null);
          } else {
            alert(`QR Code dengan NIS/NISN "${nisOrNisn}" tidak ditemukan dalam data siswa.`);
          }
        }}
      />
    </div>
  );
};
