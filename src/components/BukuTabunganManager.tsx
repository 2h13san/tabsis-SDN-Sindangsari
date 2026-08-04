import React, { useState, useEffect } from 'react';
import { Siswa, Transaksi, AppSettings, PrintablePassbookConfig, User } from '../types';
import { formatRupiah, formatDateIndo, StorageService } from '../services/storage';
import { QRCodeDisplayModal } from './QRCodeDisplayModal';
import { QRScannerModal } from './QRScannerModal';
import {
  BookOpenCheck,
  Printer,
  Search,
  Settings2,
  FileSpreadsheet,
  CheckCircle2,
  Sparkles,
  ArrowDownUp,
  Layout,
  Sliders,
  ChevronRight,
  Eye,
  QrCode,
} from 'lucide-react';

interface BukuTabunganManagerProps {
  siswaList: Siswa[];
  transaksiList: Transaksi[];
  settings: AppSettings;
  preselectedNis?: string;
  activeUser?: User;
  onRefreshData: () => void;
}

export const BukuTabunganManager: React.FC<BukuTabunganManagerProps> = ({
  siswaList,
  transaksiList,
  settings,
  preselectedNis,
  activeUser,
}) => {
  // If active user is student/orang_tua, find their matching student record
  const currentStudent = activeUser?.role === 'orang_tua'
    ? siswaList.find((s) => s.nisn === activeUser.username || s.nis === activeUser.username || activeUser.id.includes(s.id))
    : null;

  const isGuru = activeUser?.role === 'guru' || Boolean(activeUser?.kelas);

  // Filter student list according to user role (Guru gets only their assigned class)
  const availableSiswaList = siswaList.filter((s) => {
    if (isGuru && activeUser?.kelas && s.kelas !== activeUser.kelas) return false;
    if (activeUser?.role === 'orang_tua' && currentStudent && s.nis !== currentStudent.nis) return false;
    return true;
  });

  const initialNis = currentStudent ? currentStudent.nis : preselectedNis || availableSiswaList[0]?.nis || '';
  const [selectedNis, setSelectedNis] = useState<string>(initialNis);
  const [printMode, setPrintMode] = useState<'digital' | 'cetak_fisik'>('digital');

  // QR Modals State
  const [showQrCardModal, setShowQrCardModal] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Printable Passbook Physical Offset Config
  const [config, setConfig] = useState<PrintablePassbookConfig>(StorageService.getPassbookConfig());
  const [showConfigModal, setShowConfigModal] = useState(false);

  useEffect(() => {
    if (currentStudent) {
      setSelectedNis(currentStudent.nis);
    } else if (preselectedNis) {
      setSelectedNis(preselectedNis);
    }
  }, [preselectedNis, currentStudent]);

  const selectedSiswa = siswaList.find((s) => s.nis === selectedNis || s.nisn === selectedNis);

  const studentTxList = transaksiList
    .filter((t) => t.nis === selectedSiswa?.nis)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.savePassbookConfig(config);
    setShowConfigModal(false);
  };

  const handleTriggerPrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Printable CSS Rules for Physical Book Printing */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-passbook, #printable-passbook * {
            visibility: visible;
          }
          #printable-passbook {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <BookOpenCheck className="w-6 h-6 text-emerald-600" />
            <span>Buku Tabungan Siswa (Digital & Cetak Fisik)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Format resmi buku tabungan sekolah dengan fitur pengatur posisi cetak per baris kertas.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPrintMode('digital')}
            className={`px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              printMode === 'digital'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Mode Digital</span>
          </button>
          <button
            onClick={() => setPrintMode('cetak_fisik')}
            className={`px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              printMode === 'cetak_fisik'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Buku Fisik</span>
          </button>
        </div>
      </div>

      {/* Student Selection Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4 no-print">
        <div className="flex-1 w-full flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-xs font-bold text-slate-700 shrink-0">Pilih Siswa:</span>
          <select
            value={selectedNis}
            onChange={(e) => setSelectedNis(e.target.value)}
            className="w-full px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            {availableSiswaList.map((s) => (
              <option key={s.id} value={s.nis}>
                {s.nis} - {s.nama} ({s.kelas}) - Saldo: Rp {s.saldo.toLocaleString('id-ID')}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="px-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-2xs rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <QrCode className="w-3.5 h-3.5 text-amber-300" />
            <span>Scan QR</span>
          </button>
        </div>

        {printMode === 'cetak_fisik' && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowConfigModal(true)}
              className="px-3 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Sliders className="w-4 h-4" />
              <span>Setting Baris Cetak</span>
            </button>
            <button
              onClick={handleTriggerPrint}
              className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Sekarang</span>
            </button>
          </div>
        )}
      </div>

      {/* Display Student Book Header Card */}
      {selectedSiswa && (
        <div className="bg-gradient-to-r from-emerald-700 to-teal-800 p-6 rounded-2xl text-white shadow-xs no-print flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-2xs uppercase tracking-wider text-emerald-200 font-bold flex items-center gap-2">
              <span>BUKU TABUNGAN SISWA DIGITAL</span>
              <button
                onClick={() => setShowQrCardModal(true)}
                className="px-2.5 py-0.5 bg-amber-400 hover:bg-amber-300 text-indigo-950 font-black text-3xs rounded-full transition-all flex items-center gap-1 cursor-pointer"
              >
                <QrCode className="w-3 h-3 text-indigo-900" />
                <span>Kartu QR Code Siswa</span>
              </button>
            </div>
            <h3 className="text-2xl font-black">{selectedSiswa.nama}</h3>
            <p className="text-xs text-emerald-100 font-medium">
              NIS: {selectedSiswa.nis} • NISN: {selectedSiswa.nisn} • Kelas: {selectedSiswa.kelas} ({selectedSiswa.wali_kelas})
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-xs p-4 rounded-xl border border-white/20 text-right">
              <span className="text-3xs uppercase font-bold text-emerald-200 block">Total Saldo Aktif</span>
              <span className="text-2xl font-black text-white">{formatRupiah(selectedSiswa.saldo)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Passbook View Content */}
      {printMode === 'digital' ? (
        /* DIGITAL PASSBOOK MODE */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden no-print">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Rincian Mutasi Rekening Tabungan ({studentTxList.length} Transaksi)
            </h3>
            <span className="text-3xs text-slate-500 font-semibold">T.A. {settings.tahun_ajaran}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 font-extrabold border-b border-slate-200">
                  <th className="p-3 text-center w-12">No</th>
                  <th className="p-3">Tanggal & Jam</th>
                  <th className="p-3">Keterangan Transaksi</th>
                  <th className="p-3 text-right text-emerald-700">Setoran (Rp)</th>
                  <th className="p-3 text-right text-amber-700">Penarikan (Rp)</th>
                  <th className="p-3 text-right text-slate-900 font-black">Saldo (Rp)</th>
                  <th className="p-3 text-center">Petugas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studentTxList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      Belum ada transaksi tabungan tercatat untuk siswa ini.
                    </td>
                  </tr>
                ) : (
                  studentTxList.map((tx, idx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="p-3 font-semibold text-slate-700">
                        {formatDateIndo(tx.tanggal)}{' '}
                        <span className="text-3xs font-mono text-slate-400">({tx.jam})</span>
                      </td>
                      <td className="p-3 font-medium text-slate-900">{tx.keterangan}</td>
                      <td className="p-3 text-right font-bold text-emerald-700">
                        {tx.setoran > 0 ? formatRupiah(tx.setoran) : '-'}
                      </td>
                      <td className="p-3 text-right font-bold text-amber-700">
                        {tx.penarikan > 0 ? formatRupiah(tx.penarikan) : '-'}
                      </td>
                      <td className="p-3 text-right font-black text-slate-900">
                        {formatRupiah(tx.saldo)}
                      </td>
                      <td className="p-3 text-center text-3xs text-slate-500 font-semibold">{tx.petugas}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* PHYSICAL PAPER PRINTABLE SIMULATOR MODE */
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs text-amber-900 font-medium flex items-center justify-between no-print">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
              <span>
                <strong>Mode Cetak Fisik Buku Tabungan:</strong> Halaman di bawah disesuaikan khusus untuk pencetakan langsung pada kertas/buku tabungan sekolah fisik (Dot Matrix / Inkjet). Gunakan tombol <strong>Setting Baris Cetak</strong> untuk menentukan posisi awal baris (misal: mulai baris ke-{config.baris_awal}).
              </span>
            </div>
          </div>

          {/* PRINTABLE BUKU TABUNGAN AREA */}
          <div id="printable-passbook" className="bg-white p-8 rounded-2xl border border-slate-300 shadow-md">
            {/* Header Sekolah (Optional in Physical Passbook) */}
            {config.tampilkan_header && (
              <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-end">
                <div>
                  <h1 className="text-lg font-black uppercase text-slate-900">{settings.nama_sekolah}</h1>
                  <p className="text-xs text-slate-600">{settings.alamat}</p>
                  <p className="text-3xs text-slate-500">NPSN: {settings.npsn} • T.A {settings.tahun_ajaran}</p>
                </div>
                <div className="text-right text-xs">
                  <div className="font-extrabold text-slate-900">BUKU TABUNGAN SISWA</div>
                  <div className="text-2xs text-slate-600 font-mono">NIS: {selectedSiswa?.nis}</div>
                </div>
              </div>
            )}

            {/* Student Meta Table */}
            {selectedSiswa && (
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold mb-6 border border-slate-200 p-3 rounded-lg bg-slate-50">
                <div>
                  <span className="text-slate-500">Nama Siswa:</span>{' '}
                  <strong className="text-slate-900">{selectedSiswa.nama}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Kelas / Wali:</span>{' '}
                  <strong className="text-slate-900">{selectedSiswa.kelas} ({selectedSiswa.wali_kelas})</strong>
                </div>
                <div>
                  <span className="text-slate-500">NISN:</span>{' '}
                  <strong className="text-slate-900">{selectedSiswa.nisn}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Orang Tua / HP:</span>{' '}
                  <strong className="text-slate-900">{selectedSiswa.orang_tua} ({selectedSiswa.telepon})</strong>
                </div>
              </div>
            )}

            {/* Passbook Lines Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse border border-slate-800">
                <thead>
                  <tr className="bg-slate-200 text-slate-900 font-bold border-b border-slate-800">
                    <th className="p-2 border-r border-slate-800 text-center w-10">NO</th>
                    <th className="p-2 border-r border-slate-800 w-28">TANGGAL</th>
                    <th className="p-2 border-r border-slate-800">KETERANGAN</th>
                    <th className="p-2 border-r border-slate-800 text-right w-32">SETORAN</th>
                    <th className="p-2 border-r border-slate-800 text-right w-32">PENARIKAN</th>
                    <th className="p-2 border-r border-slate-800 text-right w-36">SALDO</th>
                    <th className="p-2 text-center w-24">PARAF</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Empty Spacer Rows if baris_awal > 1 */}
                  {Array.from({ length: Math.max(0, config.baris_awal - 1) }).map((_, i) => (
                    <tr key={`spacer-${i}`} className="border-b border-slate-200 opacity-20">
                      <td className="p-2 border-r border-slate-300 text-center font-mono">{i + 1}</td>
                      <td colSpan={6} className="p-2 italic text-2xs text-slate-400">
                        [Baris ini sudah tercetak pada fisik buku sebelumnya]
                      </td>
                    </tr>
                  ))}

                  {/* Actual Transactions */}
                  {studentTxList.map((tx, idx) => (
                    <tr key={tx.id} className="border-b border-slate-400 hover:bg-slate-50">
                      <td className="p-2 border-r border-slate-400 text-center font-mono font-bold">
                        {config.baris_awal + idx}
                      </td>
                      <td className="p-2 border-r border-slate-400 font-semibold">{tx.tanggal}</td>
                      <td className="p-2 border-r border-slate-400 font-medium">{tx.keterangan}</td>
                      <td className="p-2 border-r border-slate-400 text-right font-mono font-bold text-emerald-800">
                        {tx.setoran > 0 ? tx.setoran.toLocaleString('id-ID') : '-'}
                      </td>
                      <td className="p-2 border-r border-slate-400 text-right font-mono font-bold text-rose-800">
                        {tx.penarikan > 0 ? tx.penarikan.toLocaleString('id-ID') : '-'}
                      </td>
                      <td className="p-2 border-r border-slate-400 text-right font-mono font-black text-slate-900">
                        {tx.saldo.toLocaleString('id-ID')}
                      </td>
                      <td className="p-2 text-center text-3xs font-semibold text-slate-500">
                        {tx.petugas.split(' ')[0]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Signature Footer for Physical Printing */}
            <div className="mt-8 flex justify-between text-xs font-semibold pt-6 border-t border-dashed border-slate-300">
              <div>
                <p>Mengetahui,</p>
                <p className="mt-1 font-bold">Kepala Sekolah</p>
                <div className="h-12"></div>
                <p className="font-bold underline">{settings.kepala_sekolah}</p>
                <p className="text-3xs text-slate-500">NIP. {settings.nip_kepala_sekolah}</p>
              </div>

              <div className="text-right">
                <p>Jakarta, {formatDateIndo(new Date().toISOString().split('T')[0])}</p>
                <p className="mt-1 font-bold">Bendahara Sekolah</p>
                <div className="h-12"></div>
                <p className="font-bold underline">{settings.bendahara}</p>
                <p className="text-3xs text-slate-500">NIP. {settings.nip_bendahara}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Config Modal for Passbook Print Positioning */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6">
            <h3 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-emerald-600" />
              <span>Pengaturan Posisi Cetak Buku Fisik</span>
            </h3>

            <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Mulai Dari Baris Ke- (Baris Awal Offset)
                </label>
                <input
                  type="number"
                  value={config.baris_awal}
                  onChange={(e) => setConfig({ ...config, baris_awal: Number(e.target.value) })}
                  required
                  min={1}
                  max={50}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold"
                />
                <p className="text-3xs text-slate-500 mt-1">
                  Contoh: Jika pada buku tabungan kertas sudah terisi 5 baris, masukkan angka 6.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="chkHeader"
                  checked={config.tampilkan_header}
                  onChange={(e) => setConfig({ ...config, tampilkan_header: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded-sm"
                />
                <label htmlFor="chkHeader" className="font-bold text-slate-700">
                  Tampilkan Header Nama Sekolah di Atas Halaman
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="flex-1 py-2 text-xs font-bold border border-slate-200 rounded-xl hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer"
                >
                  Simpan Setting Cetak
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Display Modal */}
      <QRCodeDisplayModal
        isOpen={showQrCardModal}
        onClose={() => setShowQrCardModal(false)}
        siswa={selectedSiswa || null}
        settings={settings}
      />

      {/* QR Code Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        siswaList={siswaList}
        title="Scan QR Siswa Untuk Buku Tabungan"
        subtitle="Dekatkan QR Code kartu siswa untuk membuka buku tabungan"
        onScanSuccess={({ nisOrNisn, siswa }) => {
          let found = siswa;
          if (!found) {
            found = siswaList.find(
              (s) => s.nis === nisOrNisn || s.nisn === nisOrNisn || s.id === nisOrNisn
            );
          }
          if (found) {
            setSelectedNis(found.nis);
          } else {
            alert(`Siswa dengan NIS/NISN "${nisOrNisn}" tidak ditemukan!`);
          }
        }}
      />
    </div>
  );
};
