import React, { useState } from 'react';
import { AppSettings, User, BankMutationRecord } from '../types';
import { formatRupiah, formatDateIndo, StorageService } from '../services/storage';
import {
  Landmark,
  Printer,
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  FileText,
  Calendar,
  Building,
} from 'lucide-react';

interface BankLaporanViewProps {
  settings: AppSettings;
  activeUser: User;
}

export const BankLaporanView: React.FC<BankLaporanViewProps> = ({
  settings,
  activeUser,
}) => {
  const bankMutations: BankMutationRecord[] = StorageService.getBankMutations();
  const saldoBankSaatIni = settings.saldo_bank || 0;

  const [searchQuery, setSearchQuery] = useState('');
  const [filterJenis, setFilterJenis] = useState<'all' | 'masuk' | 'tarik'>('all');
  const [filterMonth, setFilterMonth] = useState('');

  // Calculate Totals
  const totalMasuk = bankMutations
    .filter((m) => m.jenis === 'masuk')
    .reduce((sum, m) => sum + m.nominal, 0);

  const totalTarik = bankMutations
    .filter((m) => m.jenis === 'tarik')
    .reduce((sum, m) => sum + m.nominal, 0);

  // Filtered Mutations
  const filteredMutations = bankMutations.filter((m) => {
    const matchJenis = filterJenis === 'all' || m.jenis === filterJenis;
    const matchQuery =
      searchQuery === '' ||
      m.keterangan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.no_referensi && m.no_referensi.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.nama_bendahara && m.nama_bendahara.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchMonth = filterMonth === '' || m.tanggal.startsWith(filterMonth);
    return matchJenis && matchQuery && matchMonth;
  });

  const filteredMasuk = filteredMutations
    .filter((m) => m.jenis === 'masuk')
    .reduce((sum, m) => sum + m.nominal, 0);

  const filteredTarik = filteredMutations
    .filter((m) => m.jenis === 'tarik')
    .reduce((sum, m) => sum + m.nominal, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner - Screen Only */}
      <div className="p-6 bg-gradient-to-r from-teal-900 via-cyan-900 to-slate-900 text-white rounded-2xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Landmark className="w-6 h-6 text-cyan-300" />
            <h2 className="text-xl font-black tracking-wide">Laporan Rekapitulasi Kas Bank Mitra</h2>
            <span className="px-2.5 py-0.5 bg-cyan-500/30 text-cyan-200 border border-cyan-400/30 text-3xs font-extrabold rounded-full uppercase tracking-wider">
              Format Rekon
            </span>
          </div>
          <p className="text-xs text-cyan-100/90 max-w-2xl leading-relaxed">
            Ringkasan rekapitulasi mutasi arus kas uang masuk (setoran disetujui) dan uang keluar (penarikan kas) serta saldo akhir rekening sekolah di Bank Mitra.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak Laporan Kas Bank</span>
        </button>
      </div>

      {/* Printable Header (Appears only on print) */}
      <div className="hidden print:block text-center space-y-2 border-b-2 border-slate-900 pb-4 mb-6">
        <div className="flex items-center justify-center gap-3">
          <Building className="w-8 h-8 text-slate-800" />
          <div>
            <h1 className="text-lg font-black text-slate-900 uppercase tracking-wide">
              {settings.nama_sekolah || 'SEKOLAH MITRA'}
            </h1>
            <p className="text-xs text-slate-600 font-medium">
              BANK MITRA REKAPITULASI MUTASI KAS REKENING SEKOLAH
            </p>
          </div>
        </div>
        <div className="text-xs font-mono text-slate-500">
          Dicetak pada: {new Date().toLocaleString('id-ID')} • Petugas: {activeUser.nama}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Total Uang Masuk</span>
            <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-700">{formatRupiah(totalMasuk)}</div>
            <p className="text-3xs text-slate-500 mt-1">Setoran diterima dari Bendahara</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Total Uang Keluar</span>
            <div className="p-2.5 bg-rose-50 rounded-xl text-rose-600">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-rose-700">{formatRupiah(totalTarik)}</div>
            <p className="text-3xs text-slate-500 mt-1">Penarikan kas oleh Bendahara</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-cyan-800 to-slate-900 text-white p-5 rounded-2xl shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-cyan-200 uppercase tracking-wider">Saldo Rekening Bank</span>
            <div className="p-2 bg-white/20 rounded-xl">
              <Landmark className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white">{formatRupiah(saldoBankSaatIni)}</div>
            <p className="text-3xs text-cyan-200 mt-1">Saldo kas terkonfirmasi di Bank</p>
          </div>
        </div>
      </div>

      {/* Filter Toolbar - Screen Only */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={filterJenis}
            onChange={(e) => setFilterJenis(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-cyan-500 outline-hidden"
          >
            <option value="all">Semua Jenis Transaksi</option>
            <option value="masuk">Uang Masuk (Setoran)</option>
            <option value="tarik">Uang Keluar (Penarikan)</option>
          </select>

          <input
            type="month"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-cyan-500 outline-hidden"
          />
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari ref, bendahara, atau catatan..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl text-xs font-medium focus:ring-2 focus:ring-cyan-500 outline-hidden"
          />
        </div>
      </div>

      {/* Main Rekapitulasi Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-600" />
            <span>Tabel Rekapitulasi Uang Masuk, Uang Keluar & Saldo Kas</span>
          </h3>
          <span className="text-3xs font-mono font-bold text-slate-500">
            Total Data: {filteredMutations.length} Transaksi
          </span>
        </div>

        {filteredMutations.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs font-medium">
            Tidak ada data transaksi mutasi bank yang sesuai dengan filter.
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200 uppercase text-3xs tracking-wider">
                  <th className="p-3 text-center w-12">No</th>
                  <th className="p-3">Tanggal & Waktu</th>
                  <th className="p-3">No. Referensi / Slip</th>
                  <th className="p-3 text-right text-emerald-700">Uang Masuk (Rp)</th>
                  <th className="p-3 text-right text-rose-700">Uang Keluar (Rp)</th>
                  <th className="p-3 text-right text-cyan-900">Saldo Bank (Rp)</th>
                  <th className="p-3">Keterangan & Bendahara</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredMutations.map((m, idx) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="p-3 font-mono">
                      <div className="font-bold text-slate-900">{formatDateIndo(m.tanggal)}</div>
                      <div className="text-3xs text-slate-400">{m.jam || '08:00 WIB'}</div>
                    </td>
                    <td className="p-3 font-mono font-bold text-cyan-800">{m.no_referensi || '-'}</td>
                    <td className="p-3 text-right font-black text-emerald-700">
                      {m.jenis === 'masuk' ? formatRupiah(m.nominal) : '-'}
                    </td>
                    <td className="p-3 text-right font-black text-rose-700">
                      {m.jenis === 'tarik' ? formatRupiah(m.nominal) : '-'}
                    </td>
                    <td className="p-3 text-right font-black text-slate-900 bg-slate-50/50">
                      {formatRupiah(m.saldo_setelah)}
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-800">{m.keterangan}</div>
                      <div className="text-3xs text-slate-500 font-medium">
                        Bendahara: {m.nama_bendahara || '-'} • Petugas Bank: {m.petugas_bank}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-900 text-white font-extrabold border-t-2 border-slate-900 text-xs">
                  <td colSpan={3} className="p-3.5 text-right uppercase tracking-wider">
                    Total Rekapitulasi:
                  </td>
                  <td className="p-3.5 text-right font-black text-emerald-400">
                    {formatRupiah(filteredMasuk)}
                  </td>
                  <td className="p-3.5 text-right font-black text-rose-300">
                    {formatRupiah(filteredTarik)}
                  </td>
                  <td className="p-3.5 text-right font-black text-cyan-300">
                    {formatRupiah(saldoBankSaatIni)}
                  </td>
                  <td className="p-3.5 text-3xs text-slate-300 font-normal">
                    Saldo Akhir Rekening Sekolah
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Footer Signatures for Print */}
      <div className="hidden print:grid grid-cols-2 gap-8 pt-8 mt-6 text-center text-xs font-semibold text-slate-800">
        <div>
          <p className="text-slate-500">Pihak Sekolah (Bendahara),</p>
          <div className="h-16"></div>
          <p className="font-bold underline uppercase">{settings.bendahara || 'BENDAHARA SEKOLAH'}</p>
          <p className="text-3xs text-slate-400">NIP. {settings.nip_bendahara || '-'}</p>
        </div>
        <div>
          <p className="text-slate-500">Pihak Bank Mitra (Admin Bank),</p>
          <div className="h-16"></div>
          <p className="font-bold underline uppercase">{activeUser.nama || 'ADMIN BANK MITRA'}</p>
          <p className="text-3xs text-slate-400">Petugas Resmi Bank Mitra</p>
        </div>
      </div>
    </div>
  );
};
