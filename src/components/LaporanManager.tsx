import React, { useState } from 'react';
import { Siswa, Transaksi, AppSettings, Kelas, User } from '../types';
import { formatRupiah, formatDateIndo, isSameKelas } from '../services/storage';
import { BankLaporanView } from './BankLaporanView';
import {
  FileSpreadsheet,
  Printer,
  Filter,
  Calendar,
  Building,
  CheckCircle2,
  Table,
  BookOpen,
  Eye,
  BookMarked,
} from 'lucide-react';

interface LaporanManagerProps {
  transaksiList: Transaksi[];
  siswaList: Siswa[];
  kelasList: Kelas[];
  settings: AppSettings;
  activeUser?: User;
}

const BULAN_INDO = [
  'JANUARI',
  'FEBRUARI',
  'MARET',
  'APRIL',
  'MEI',
  'JUNI',
  'JULI',
  'AGUSTUS',
  'SEPTEMBER',
  'OKTOBER',
  'NOVEMBER',
  'DESEMBER',
];

export const LaporanManager: React.FC<LaporanManagerProps> = ({
  transaksiList,
  siswaList,
  kelasList,
  settings,
  activeUser,
}) => {
  // Early return for Bank Partner Role
  if (activeUser?.role === 'admin_bank') {
    return (
      <BankLaporanView
        settings={settings}
        activeUser={activeUser}
      />
    );
  }

  const isGuru = activeUser?.role === 'guru' || Boolean(activeUser?.kelas);

  const [reportMode, setReportMode] = useState<'matriks_fisik' | 'buku_induk_tahunan' | 'jurnal_transaksi'>('matriks_fisik');
  const [filterKelas, setFilterKelas] = useState(
    isGuru && activeUser?.kelas ? activeUser.kelas : (kelasList[0]?.nama_kelas || '1-A')
  );
  const [filterMonth, setFilterMonth] = useState('2026-08');
  const [filterTahunAjaran, setFilterTahunAjaran] = useState(settings.tahun_ajaran || '2026/2027');

  // Parse Year and Month for Monthly Matrix
  const [yearStr, monthStr] = filterMonth.split('-');
  const selectedYear = parseInt(yearStr || '2026', 10);
  const selectedMonthIdx = parseInt(monthStr || '08', 10) - 1;
  const monthNameIndo = BULAN_INDO[selectedMonthIdx] || 'AGUSTUS';

  // Days in selected month (28..31)
  const daysInMonth = new Date(selectedYear, selectedMonthIdx + 1, 0).getDate();
  const dayNumbers = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Filtered Students for selected class
  const classStudents = siswaList.filter((s) => {
    if (isGuru && activeUser?.kelas && !isSameKelas(s.kelas, activeUser.kelas)) return false;
    if (filterKelas === 'Semua') return true;
    return isSameKelas(s.kelas, filterKelas);
  });

  const activeWaliKelas =
    kelasList.find((k) => isSameKelas(k.nama_kelas, filterKelas))?.wali_kelas ||
    classStudents[0]?.wali_kelas ||
    settings.bendahara;

  // Filtered Transactions for Journal mode
  const filteredTx = transaksiList.filter((t) => {
    if (isGuru && activeUser?.kelas && !isSameKelas(t.kelas, activeUser.kelas)) return false;
    if (filterKelas !== 'Semua' && !isSameKelas(t.kelas, filterKelas)) return false;
    if (filterMonth && !t.tanggal.startsWith(filterMonth)) return false;
    return true;
  });

  const totalSetoranJournal = filteredTx
    .filter((t) => t.jenis === 'setoran')
    .reduce((sum, t) => sum + (t.setoran || 0), 0);

  const totalPenarikanJournal = filteredTx
    .filter((t) => t.jenis === 'penarikan')
    .reduce((sum, t) => sum + (t.penarikan || 0), 0);

  const netMutasiJournal = totalSetoranJournal - totalPenarikanJournal;

  // Compute Matrix Ledger Data per Student (Monthly Daily)
  const matrixData = classStudents.map((siswa, idx) => {
    const isStudentMatch = (t: Transaksi) => {
      if (t.nis && siswa.nis && t.nis === siswa.nis) return true;
      if (t.nama && siswa.nama && t.nama.trim().toLowerCase() === siswa.nama.trim().toLowerCase()) return true;
      return false;
    };

    // Tx before filterMonth
    const txBeforeMonth = transaksiList.filter((t) => {
      if (!isStudentMatch(t)) return false;
      return t.tanggal < `${filterMonth}-01`;
    });

    // Saldo akhir bulan lalu
    const setoranSebelumnya = txBeforeMonth
      .filter((t) => t.jenis === 'setoran')
      .reduce((sum, t) => sum + (t.setoran || 0), 0);
    const penarikanSebelumnya = txBeforeMonth
      .filter((t) => t.jenis === 'penarikan')
      .reduce((sum, t) => sum + (t.penarikan || 0), 0);
    const saldoAwalBulanLalu = setoranSebelumnya - penarikanSebelumnya;

    // Tx in filterMonth
    const txThisMonth = transaksiList.filter((t) => {
      if (!isStudentMatch(t)) return false;
      return t.tanggal.startsWith(filterMonth);
    });

    // Map daily setoran amount
    const dailyAmounts: { [day: number]: number } = {};
    let totalSetoranBulanIni = 0;
    let totalPenarikanBulanIni = 0;

    txThisMonth.forEach((t) => {
      const dayNum = parseInt(t.tanggal.split('-')[2], 10);
      if (t.jenis === 'setoran') {
        dailyAmounts[dayNum] = (dailyAmounts[dayNum] || 0) + (t.setoran || 0);
        totalSetoranBulanIni += t.setoran || 0;
      } else if (t.jenis === 'penarikan') {
        totalPenarikanBulanIni += t.penarikan || 0;
      }
    });

    const saldoAkhirBulanIni =
      saldoAwalBulanLalu + totalSetoranBulanIni - totalPenarikanBulanIni;

    return {
      noUrut: idx + 1,
      siswa,
      saldoAwalBulanLalu,
      dailyAmounts,
      totalSetoranBulanIni,
      totalPenarikanBulanIni,
      saldoAkhirBulanIni,
    };
  });

  // Calculate daily column totals
  const dailyTotals: { [day: number]: number } = {};
  let totalBulanLaluSum = 0;
  let totalSetoranBulananSum = 0;
  let totalSaldoAkhirSum = 0;

  matrixData.forEach((row) => {
    totalBulanLaluSum += row.saldoAwalBulanLalu;
    totalSetoranBulananSum += row.totalSetoranBulanIni;
    totalSaldoAkhirSum += row.saldoAkhirBulanIni;

    dayNumbers.forEach((d) => {
      if (row.dailyAmounts[d]) {
        dailyTotals[d] = (dailyTotals[d] || 0) + row.dailyAmounts[d];
      }
    });
  });

  // ==========================================
  // BUKU INDUK TABUNGAN TAHUNAN (12 BULAN)
  // ==========================================
  const startYearAjaran = parseInt(filterTahunAjaran.split('/')[0] || '2026', 10);

  const TAHUN_AJARAN_MONTHS = [
    { name: 'Juli', monthKey: `${startYearAjaran}-07` },
    { name: 'Agustus', monthKey: `${startYearAjaran}-08` },
    { name: 'September', monthKey: `${startYearAjaran}-09` },
    { name: 'Oktober', monthKey: `${startYearAjaran}-10` },
    { name: 'Nopember', monthKey: `${startYearAjaran}-11` },
    { name: 'Desember', monthKey: `${startYearAjaran}-12` },
    { name: 'Januari', monthKey: `${startYearAjaran + 1}-01` },
    { name: 'Pebruari', monthKey: `${startYearAjaran + 1}-02` },
    { name: 'Maret', monthKey: `${startYearAjaran + 1}-03` },
    { name: 'April', monthKey: `${startYearAjaran + 1}-04` },
    { name: 'Mei', monthKey: `${startYearAjaran + 1}-05` },
    { name: 'Juni', monthKey: `${startYearAjaran + 1}-06` },
  ];

  const bukuIndukData = classStudents.map((siswa, idx) => {
    const isStudentMatch = (t: Transaksi) => {
      if (t.nis && siswa.nis && t.nis === siswa.nis) return true;
      if (t.nama && siswa.nama && t.nama.trim().toLowerCase() === siswa.nama.trim().toLowerCase()) return true;
      return false;
    };

    // Initial balance at start of school year (before July 1st of startYearAjaran)
    const txBeforeYear = transaksiList.filter(
      (t) => isStudentMatch(t) && t.tanggal < `${startYearAjaran}-07-01`
    );
    const setoranAwal = txBeforeYear
      .filter((t) => t.jenis === 'setoran')
      .reduce((sum, t) => sum + (t.setoran || 0), 0);
    const penarikanAwal = txBeforeYear
      .filter((t) => t.jenis === 'penarikan')
      .reduce((sum, t) => sum + (t.penarikan || 0), 0);
    const tabAwalThPelajaran = setoranAwal - penarikanAwal;

    let currentRunningSaldo = tabAwalThPelajaran;
    let totalSetoranThIni = 0;
    let totalPenarikanThIni = 0;

    const monthlyBreakdown = TAHUN_AJARAN_MONTHS.map((m) => {
      const txThisMonth = transaksiList.filter(
        (t) => isStudentMatch(t) && t.tanggal.startsWith(m.monthKey)
      );
      const setoran = txThisMonth
        .filter((t) => t.jenis === 'setoran')
        .reduce((sum, t) => sum + (t.setoran || 0), 0);
      const penarikan = txThisMonth
        .filter((t) => t.jenis === 'penarikan')
        .reduce((sum, t) => sum + (t.penarikan || 0), 0);

      currentRunningSaldo = currentRunningSaldo + setoran - penarikan;
      totalSetoranThIni += setoran;
      totalPenarikanThIni += penarikan;

      return {
        monthName: m.name,
        setoran,
        penarikan,
        saldo: currentRunningSaldo,
      };
    });

    const jmlTabThIni = totalSetoranThIni - totalPenarikanThIni;
    const jumlahSeluruhTabungan = tabAwalThPelajaran + jmlTabThIni;

    return {
      noUrut: idx + 1,
      siswa,
      tabAwalThPelajaran,
      monthlyBreakdown,
      jmlTabThIni,
      jumlahSeluruhTabungan,
    };
  });

  // Calculate Column Totals for Buku Induk
  let sumTabAwalThPelajaran = 0;
  const monthlyTotals = TAHUN_AJARAN_MONTHS.map(() => ({ setoran: 0, penarikan: 0, saldo: 0 }));
  let sumJmlTabThIni = 0;
  let sumJumlahSeluruhTabungan = 0;

  bukuIndukData.forEach((row) => {
    sumTabAwalThPelajaran += row.tabAwalThPelajaran;
    sumJmlTabThIni += row.jmlTabThIni;
    sumJumlahSeluruhTabungan += row.jumlahSeluruhTabungan;

    row.monthlyBreakdown.forEach((m, mIdx) => {
      monthlyTotals[mIdx].setoran += m.setoran;
      monthlyTotals[mIdx].penarikan += m.penarikan;
      monthlyTotals[mIdx].saldo += m.saldo;
    });
  });

  const getShortLocationName = (alamat: string): string => {
    if (!alamat) return 'Sindangsari';
    if (alamat.toLowerCase().includes('sindangsari')) return 'Sindangsari';
    const cleaned = alamat.replace(/^(Kp\.|Kampung|Jl\.|Jalan|Desa)\s+/i, '').trim();
    const firstWord = cleaned.split(/[\s,]+/)[0];
    return firstWord || 'Sindangsari';
  };

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          @page {
            size: landscape;
            margin: 8mm;
          }
          body * { visibility: hidden; }
          #printable-report, #printable-report * { visibility: visible; }
          #printable-report { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-indigo-600" />
            <span>Laporan Rekapitulasi Tabungan Siswa</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Format resmi matriks setoran harian bulanan, buku induk tabungan tahunan (format ledger fisik), & jurnal transaksi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex p-1 bg-slate-100 rounded-xl overflow-x-auto">
            <button
              onClick={() => setReportMode('matriks_fisik')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                reportMode === 'matriks_fisik'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Matriks Harian Bulanan</span>
            </button>
            <button
              onClick={() => setReportMode('buku_induk_tahunan')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                reportMode === 'buku_induk_tahunan'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookMarked className="w-3.5 h-3.5" />
              <span>Buku Induk Tahunan (Ledger)</span>
            </button>
            <button
              onClick={() => setReportMode('jurnal_transaksi')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                reportMode === 'jurnal_transaksi'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Jurnal Transaksi</span>
            </button>
          </div>

          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak PDF</span>
          </button>
        </div>
      </div>

      {/* Toolbar Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4 no-print">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-700">Pilih Kelas:</span>
            {isGuru && activeUser?.kelas ? (
              <div className="px-3 py-1.5 text-xs border border-amber-300 rounded-xl bg-amber-50 text-amber-950 font-extrabold">
                Kelas {activeUser.kelas} (Yang Diampu)
              </div>
            ) : (
              <select
                value={filterKelas}
                onChange={(e) => setFilterKelas(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl font-bold bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="Semua">Semua Kelas</option>
                {kelasList.map((k) => (
                  <option key={k.id} value={k.nama_kelas}>
                    Kelas {k.nama_kelas}
                  </option>
                ))}
              </select>
            )}
          </div>

          {reportMode === 'buku_induk_tahunan' ? (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-700">Pilih Tahun Ajaran:</span>
              <select
                value={filterTahunAjaran}
                onChange={(e) => setFilterTahunAjaran(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl font-bold bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="2026/2027">2026/2027</option>
                <option value="2025/2026">2025/2026</option>
                <option value="2024/2025">2024/2025</option>
                <option value="2023/2024">2023/2024</option>
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-700">Pilih Bulan & Tahun:</span>
              <input
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl font-bold bg-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Wali Kelas: <strong className="text-slate-800">{activeWaliKelas}</strong>
        </div>
      </div>

      {/* REPORT VIEW AREA */}
      {reportMode === 'matriks_fisik' ? (
        /* MATRIKS PENERIMAAN TABUNGAN BULAN (FORMAT BUKU LEDGER FISIK HARIAN) */
        <div
          id="printable-report"
          className="bg-white p-6 rounded-2xl border border-slate-300 shadow-sm space-y-4 overflow-x-auto"
        >
          {/* Header Judul Buku Ledger */}
          <div className="text-center space-y-1 pb-3 border-b-2 border-slate-900">
            <h1 className="text-base sm:text-lg font-black uppercase text-slate-900 tracking-wider">
              PENERIMAAN TABUNGAN BULAN {monthNameIndo} {selectedYear}
            </h1>
            <div className="flex flex-wrap justify-between items-center text-xs font-bold text-slate-800 px-2 pt-1">
              <span>SEKOLAH: {settings.nama_sekolah.toUpperCase()}</span>
              <span>KELAS: {filterKelas === 'Semua' ? 'SELURUH KELAS' : filterKelas}</span>
              <span>WALI KELAS: {activeWaliKelas.toUpperCase()}</span>
            </div>
          </div>

          {/* Matrix Daily Deposits Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] border-collapse border border-slate-900 font-mono">
              <thead>
                {/* Header Row 1 */}
                <tr className="bg-slate-200 text-slate-900 font-black text-center border-b border-slate-900">
                  <th rowSpan={2} className="p-1 border-r border-slate-900 w-8">
                    No. PD
                  </th>
                  <th rowSpan={2} className="p-1.5 border-r border-slate-900 font-sans text-left min-w-[140px]">
                    Nama Peserta Didik
                  </th>
                  <th rowSpan={2} className="p-1 border-r border-slate-900 w-16">
                    NIS
                  </th>
                  <th rowSpan={2} className="p-1 border-r border-slate-900 w-24 text-right">
                    Jumlah Akhir Bulan Lalu
                  </th>
                  <th colSpan={daysInMonth} className="p-1 border-r border-slate-900 font-bold bg-slate-300/80">
                    SETORAN TANGGAL
                  </th>
                  <th rowSpan={2} className="p-1 border-r border-slate-900 w-24 text-right bg-emerald-50">
                    Jumlah Setoran
                  </th>
                  <th rowSpan={2} className="p-1 border-r border-slate-900 w-28 text-right bg-indigo-50">
                    Jumlah Akhir Bulan Ini
                  </th>
                  <th rowSpan={2} className="p-1 font-sans w-16">
                    Ket.
                  </th>
                </tr>

                {/* Header Row 2: Date Numbers 1..31 */}
                <tr className="bg-slate-100 text-slate-900 font-bold text-center border-b border-slate-900 text-[10px]">
                  {dayNumbers.map((d) => (
                    <th key={d} className="p-0.5 border-r border-slate-400 min-w-[26px]">
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-300">
                {matrixData.length === 0 ? (
                  <tr>
                    <td colSpan={daysInMonth + 7} className="p-6 text-center text-slate-400 font-sans">
                      Tidak ada data siswa untuk kelas ini.
                    </td>
                  </tr>
                ) : (
                  matrixData.map((row) => (
                    <tr key={row.siswa.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-1 text-center font-bold border-r border-slate-400 text-slate-700">
                        {row.noUrut}.
                      </td>
                      <td className="p-1 border-r border-slate-400 font-sans font-extrabold text-slate-900 truncate max-w-[160px]">
                        {row.siswa.nama}
                      </td>
                      <td className="p-1 border-r border-slate-400 text-center text-slate-600 text-[10px]">
                        {row.siswa.nis}
                      </td>
                      <td className="p-1 border-r border-slate-400 text-right text-slate-800">
                        {row.saldoAwalBulanLalu > 0
                          ? row.saldoAwalBulanLalu.toLocaleString('id-ID')
                          : '-'}
                      </td>

                      {/* Daily Deposit Columns */}
                      {dayNumbers.map((d) => {
                        const val = row.dailyAmounts[d];
                        return (
                          <td
                            key={d}
                            className={`p-0.5 border-r border-slate-300 text-center font-bold text-[10px] ${
                              val ? 'bg-emerald-50 text-emerald-900' : 'text-slate-300'
                            }`}
                          >
                            {val ? (val >= 1000 ? `${val / 1000}k` : val) : ''}
                          </td>
                        );
                      })}

                      <td className="p-1 border-r border-slate-400 text-right font-black text-emerald-800 bg-emerald-50/50">
                        {row.totalSetoranBulanIni > 0
                          ? row.totalSetoranBulanIni.toLocaleString('id-ID')
                          : '-'}
                      </td>
                      <td className="p-1 border-r border-slate-400 text-right font-black text-indigo-950 bg-indigo-50/50">
                        {row.saldoAkhirBulanIni.toLocaleString('id-ID')}
                      </td>
                      <td className="p-1 text-center font-sans text-3xs text-slate-500">
                        {row.totalPenarikanBulanIni > 0 ? 'Ada tarik' : ''}
                      </td>
                    </tr>
                  ))
                )}

                {/* Pad empty rows if student count < 15 to match physical ledger sheet feel */}
                {Array.from({ length: Math.max(0, 15 - matrixData.length) }).map((_, idx) => (
                  <tr key={`empty-${idx}`} className="border-b border-slate-200">
                    <td className="p-1 text-center border-r border-slate-300 text-slate-300">
                      {matrixData.length + idx + 1}.
                    </td>
                    <td className="p-1 border-r border-slate-300"></td>
                    <td className="p-1 border-r border-slate-300"></td>
                    <td className="p-1 border-r border-slate-300"></td>
                    {dayNumbers.map((d) => (
                      <td key={d} className="p-0.5 border-r border-slate-200"></td>
                    ))}
                    <td className="p-1 border-r border-slate-300"></td>
                    <td className="p-1 border-r border-slate-300"></td>
                    <td className="p-1"></td>
                  </tr>
                ))}
              </tbody>

              {/* Total Summary Row */}
              <tfoot>
                <tr className="bg-slate-200 text-slate-900 font-black border-t-2 border-slate-900 text-center">
                  <td colSpan={3} className="p-1.5 border-r border-slate-900 font-sans text-right">
                    JUMLAH TOTAL (Rp):
                  </td>
                  <td className="p-1 border-r border-slate-900 text-right">
                    {totalBulanLaluSum.toLocaleString('id-ID')}
                  </td>

                  {dayNumbers.map((d) => (
                    <td key={d} className="p-0.5 border-r border-slate-400 text-[9px] text-center">
                      {dailyTotals[d] ? `${dailyTotals[d] / 1000}k` : ''}
                    </td>
                  ))}

                  <td className="p-1 border-r border-slate-900 text-right text-emerald-900">
                    {totalSetoranBulananSum.toLocaleString('id-ID')}
                  </td>
                  <td className="p-1 border-r border-slate-900 text-right text-indigo-950">
                    {totalSaldoAkhirSum.toLocaleString('id-ID')}
                  </td>
                  <td className="p-1 font-sans text-3xs"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Physical Ledger Signatures Bottom Footer */}
          <div className="pt-8 flex justify-between text-xs font-semibold px-4">
            <div>
              <p>Mengetahui,</p>
              <p className="mt-1 font-bold">Kepala Sekolah</p>
              <div className="h-16"></div>
              <p className="font-bold underline">{settings.kepala_sekolah}</p>
              <p className="text-3xs text-slate-500 font-mono">NIP. {settings.nip_kepala_sekolah}</p>
            </div>

            <div className="text-right">
              <p>
                {getShortLocationName(settings.alamat)},{' '}
                {formatDateIndo(new Date().toISOString().split('T')[0])}
              </p>
              <p className="mt-1 font-bold">Petugas / Guru / Wali Kelas</p>
              <div className="h-16"></div>
              <p className="font-bold underline">{activeWaliKelas}</p>
              <p className="text-3xs text-slate-500 font-mono">NIP. -</p>
            </div>
          </div>
        </div>
      ) : reportMode === 'buku_induk_tahunan' ? (
        /* BUKU INDUK REKAPITULASI TABUNGAN TAHUNAN (FORMAT LEDGER FISIK 12 BULAN) */
        <div
          id="printable-report"
          className="bg-white p-6 rounded-2xl border border-slate-300 shadow-sm space-y-4 overflow-x-auto"
        >
          {/* Header Title Buku Induk */}
          <div className="text-center space-y-1 pb-3 border-b-2 border-slate-900">
            <h1 className="text-base sm:text-lg font-black uppercase text-slate-900 tracking-wider">
              BUKU INDUK REKAPITULASI TABUNGAN SISWA TAHUNAN
            </h1>
            <div className="flex flex-wrap justify-between items-center text-xs font-bold text-slate-800 px-2 pt-1">
              <span>SEKOLAH: {settings.nama_sekolah.toUpperCase()}</span>
              <span>KELAS: {filterKelas === 'Semua' ? 'SELURUH KELAS' : filterKelas}</span>
              <span>TAHUN AJARAN: {filterTahunAjaran}</span>
              <span>WALI KELAS: {activeWaliKelas.toUpperCase()}</span>
            </div>
          </div>

          {/* Table Matrix 12 Bulan Ledger */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[10px] border-collapse border border-slate-900 font-mono min-w-[1600px]">
              <thead>
                {/* Header Row 1 */}
                <tr className="bg-slate-200 text-slate-900 font-black text-center border-b border-slate-900">
                  <th colSpan={2} className="p-1 border-r border-slate-900">
                    NOMOR
                  </th>
                  <th rowSpan={2} className="p-1.5 border-r border-slate-900 font-sans text-left min-w-[140px]">
                    NAMA PESERTA DIDIK
                  </th>
                  <th rowSpan={2} className="p-1 border-r border-slate-900 w-20 text-right">
                    Tab. Awal Th. Pelajaran
                  </th>
                  {TAHUN_AJARAN_MONTHS.map((m) => (
                    <th key={m.name} colSpan={3} className="p-1 border-r border-slate-900 text-center bg-slate-300/80 font-bold">
                      {m.name}
                    </th>
                  ))}
                  <th rowSpan={2} className="p-1 border-r border-slate-900 w-22 text-right bg-emerald-50">
                    Jml. Tab. Th. ini
                  </th>
                  <th rowSpan={2} className="p-1 border-r border-slate-900 w-24 text-right bg-indigo-50">
                    Jumlah seluruh Tabungan
                  </th>
                  <th rowSpan={2} className="p-1 font-sans w-16">
                    Keterangan
                  </th>
                </tr>

                {/* Header Row 2 */}
                <tr className="bg-slate-100 text-slate-900 font-bold text-center border-b border-slate-900 text-[9px]">
                  <th className="p-0.5 border-r border-slate-900 w-7">Urut</th>
                  <th className="p-0.5 border-r border-slate-900 w-11">Induk</th>
                  {TAHUN_AJARAN_MONTHS.map((m) => (
                    <React.Fragment key={`${m.name}-sub`}>
                      <th className="p-0.5 border-r border-slate-400 w-12 text-emerald-800 bg-emerald-50/50">+</th>
                      <th className="p-0.5 border-r border-slate-400 w-12 text-amber-800 bg-amber-50/50">-</th>
                      <th className="p-0.5 border-r border-slate-900 w-14 font-extrabold bg-slate-200/60">=</th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-300">
                {bukuIndukData.length === 0 ? (
                  <tr>
                    <td colSpan={42} className="p-6 text-center text-slate-400 font-sans">
                      Tidak ada data siswa untuk kelas ini.
                    </td>
                  </tr>
                ) : (
                  bukuIndukData.map((row) => (
                    <tr key={row.siswa.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-1 text-center font-bold border-r border-slate-400 text-slate-700">
                        {row.noUrut}.
                      </td>
                      <td className="p-1 text-center font-mono border-r border-slate-400 text-slate-600 text-[9px]">
                        {row.siswa.nis}
                      </td>
                      <td className="p-1 border-r border-slate-400 font-sans font-extrabold text-slate-900 truncate max-w-[150px]">
                        {row.siswa.nama}
                      </td>
                      <td className="p-1 border-r border-slate-400 text-right text-slate-800 font-bold">
                        {row.tabAwalThPelajaran > 0 ? row.tabAwalThPelajaran.toLocaleString('id-ID') : '-'}
                      </td>

                      {row.monthlyBreakdown.map((m, mIdx) => (
                        <React.Fragment key={mIdx}>
                          <td className="p-0.5 border-r border-slate-300 text-right text-emerald-900 font-bold">
                            {m.setoran > 0 ? m.setoran.toLocaleString('id-ID') : '-'}
                          </td>
                          <td className="p-0.5 border-r border-slate-300 text-right text-amber-900 font-bold">
                            {m.penarikan > 0 ? m.penarikan.toLocaleString('id-ID') : '-'}
                          </td>
                          <td className="p-0.5 border-r border-slate-400 text-right font-black text-slate-900 bg-slate-50">
                            {m.saldo > 0 ? m.saldo.toLocaleString('id-ID') : '-'}
                          </td>
                        </React.Fragment>
                      ))}

                      <td className="p-1 border-r border-slate-400 text-right font-black text-emerald-800 bg-emerald-50/50">
                        {row.jmlTabThIni > 0 ? row.jmlTabThIni.toLocaleString('id-ID') : '-'}
                      </td>
                      <td className="p-1 border-r border-slate-400 text-right font-black text-indigo-950 bg-indigo-50/50">
                        {row.jumlahSeluruhTabungan.toLocaleString('id-ID')}
                      </td>
                      <td className="p-1 text-center font-sans text-3xs text-slate-500"></td>
                    </tr>
                  ))
                )}

                {/* Pad empty rows if student count < 12 to match physical ledger sheet feel */}
                {Array.from({ length: Math.max(0, 12 - bukuIndukData.length) }).map((_, idx) => (
                  <tr key={`empty-${idx}`} className="border-b border-slate-200">
                    <td className="p-1 text-center border-r border-slate-300 text-slate-300">
                      {bukuIndukData.length + idx + 1}.
                    </td>
                    <td className="p-1 border-r border-slate-300"></td>
                    <td className="p-1 border-r border-slate-300"></td>
                    <td className="p-1 border-r border-slate-300"></td>
                    {TAHUN_AJARAN_MONTHS.map((m, mIdx) => (
                      <React.Fragment key={mIdx}>
                        <td className="p-0.5 border-r border-slate-200"></td>
                        <td className="p-0.5 border-r border-slate-200"></td>
                        <td className="p-0.5 border-r border-slate-300"></td>
                      </React.Fragment>
                    ))}
                    <td className="p-1 border-r border-slate-300"></td>
                    <td className="p-1 border-r border-slate-300"></td>
                    <td className="p-1"></td>
                  </tr>
                ))}
              </tbody>

              {/* Total Summary Row */}
              <tfoot>
                <tr className="bg-slate-200 text-slate-900 font-black border-t-2 border-slate-900 text-center">
                  <td colSpan={3} className="p-1.5 border-r border-slate-900 font-sans text-right">
                    JUMLAH TOTAL (Rp):
                  </td>
                  <td className="p-1 border-r border-slate-900 text-right">
                    {sumTabAwalThPelajaran.toLocaleString('id-ID')}
                  </td>

                  {monthlyTotals.map((mt, mtIdx) => (
                    <React.Fragment key={mtIdx}>
                      <td className="p-0.5 border-r border-slate-400 text-right text-emerald-900">
                        {mt.setoran > 0 ? mt.setoran.toLocaleString('id-ID') : '-'}
                      </td>
                      <td className="p-0.5 border-r border-slate-400 text-right text-amber-900">
                        {mt.penarikan > 0 ? mt.penarikan.toLocaleString('id-ID') : '-'}
                      </td>
                      <td className="p-0.5 border-r border-slate-900 text-right font-black">
                        {mt.saldo > 0 ? mt.saldo.toLocaleString('id-ID') : '-'}
                      </td>
                    </React.Fragment>
                  ))}

                  <td className="p-1 border-r border-slate-900 text-right text-emerald-900">
                    {sumJmlTabThIni.toLocaleString('id-ID')}
                  </td>
                  <td className="p-1 border-r border-slate-900 text-right text-indigo-950">
                    {sumJumlahSeluruhTabungan.toLocaleString('id-ID')}
                  </td>
                  <td className="p-1 font-sans text-3xs"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Physical Ledger Signatures Bottom Footer */}
          <div className="pt-8 flex justify-between text-xs font-semibold px-4">
            <div>
              <p>Mengetahui,</p>
              <p className="mt-1 font-bold">Kepala Sekolah</p>
              <div className="h-16"></div>
              <p className="font-bold underline">{settings.kepala_sekolah}</p>
              <p className="text-3xs text-slate-500 font-mono">NIP. {settings.nip_kepala_sekolah}</p>
            </div>

            <div className="text-right">
              <p>
                {getShortLocationName(settings.alamat)},{' '}
                {formatDateIndo(new Date().toISOString().split('T')[0])}
              </p>
              <p className="mt-1 font-bold">Bendahara Sekolah</p>
              <div className="h-16"></div>
              <p className="font-bold underline">{settings.bendahara}</p>
              <p className="text-3xs text-slate-500 font-mono">NIP. {settings.nip_bendahara}</p>
            </div>
          </div>
        </div>
      ) : (
        /* MODE JURNAL TRANSAKSI LIST */
        <div id="printable-report" className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          {/* Header Sekolah Official */}
          <div className="border-b-2 border-slate-900 pb-4 text-center relative">
            <h1 className="text-xl font-black uppercase text-slate-900 tracking-wide">{settings.nama_sekolah}</h1>
            <p className="text-xs text-slate-600">{settings.alamat}</p>
            <p className="text-2xs text-slate-500 font-semibold">
              NPSN: {settings.npsn} • Tahun Ajaran: {settings.tahun_ajaran}
            </p>
            <div className="mt-3 inline-block px-4 py-1 bg-slate-100 border border-slate-300 rounded-full text-xs font-extrabold text-slate-900">
              LAPORAN JURNAL TRANSAKSI TABUNGAN ({filterKelas === 'Semua' ? 'SELURUH KELAS' : `KELAS ${filterKelas}`})
            </div>
          </div>

          {/* Summary Stats Grid */}
          <div className="grid grid-cols-3 gap-4 text-xs font-semibold">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <span className="text-2xs font-bold uppercase text-emerald-800 block">Total Setoran</span>
              <span className="text-lg font-black text-emerald-900">{formatRupiah(totalSetoranJournal)}</span>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <span className="text-2xs font-bold uppercase text-amber-800 block">Total Penarikan</span>
              <span className="text-lg font-black text-amber-900">{formatRupiah(totalPenarikanJournal)}</span>
            </div>

            <div className="p-4 bg-slate-100 border border-slate-300 rounded-xl">
              <span className="text-2xs font-bold uppercase text-slate-700 block">Net Saldo Mutasi</span>
              <span className="text-lg font-black text-slate-900">{formatRupiah(netMutasiJournal)}</span>
            </div>
          </div>

          {/* Transactions Detail Table */}
          <div>
            <h3 className="text-xs font-bold uppercase text-slate-700 mb-2">
              Rincian Jurnal Transaksi ({filteredTx.length} Catatan)
            </h3>
            <div className="overflow-x-auto border border-slate-300 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <th className="p-2.5 border-r border-slate-300">No. TRX</th>
                    <th className="p-2.5 border-r border-slate-300">Tanggal</th>
                    <th className="p-2.5 border-r border-slate-300">NIS & Nama</th>
                    <th className="p-2.5 border-r border-slate-300">Kelas</th>
                    <th className="p-2.5 border-r border-slate-300 text-right">Setoran</th>
                    <th className="p-2.5 border-r border-slate-300 text-right">Penarikan</th>
                    <th className="p-2.5 border-r border-slate-300 text-right">Saldo</th>
                    <th className="p-2.5">Petugas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono">
                  {filteredTx.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-slate-400 font-sans">
                        Tidak ada transaksi tercatat untuk periode dan kelas ini.
                      </td>
                    </tr>
                  ) : (
                    filteredTx.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50">
                        <td className="p-2.5 border-r border-slate-200 font-bold text-slate-700">{tx.id}</td>
                        <td className="p-2.5 border-r border-slate-200 font-sans">{tx.tanggal}</td>
                        <td className="p-2.5 border-r border-slate-200 font-sans font-bold">
                          {tx.nama} ({tx.nis})
                        </td>
                        <td className="p-2.5 border-r border-slate-200 font-sans">{tx.kelas}</td>
                        <td className="p-2.5 border-r border-slate-200 text-right font-bold text-emerald-800">
                          {tx.setoran > 0 ? tx.setoran.toLocaleString('id-ID') : '-'}
                        </td>
                        <td className="p-2.5 border-r border-slate-200 text-right font-bold text-amber-800">
                          {tx.penarikan > 0 ? tx.penarikan.toLocaleString('id-ID') : '-'}
                        </td>
                        <td className="p-2.5 border-r border-slate-200 text-right font-black text-slate-900">
                          {tx.saldo.toLocaleString('id-ID')}
                        </td>
                        <td className="p-2.5 font-sans text-2xs text-slate-600">{tx.petugas}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Signatures */}
          <div className="pt-8 flex justify-between text-xs font-semibold">
            <div>
              <p>Mengetahui,</p>
              <p className="mt-1 font-bold">Kepala Sekolah</p>
              <div className="h-16"></div>
              <p className="font-bold underline">{settings.kepala_sekolah}</p>
              <p className="text-3xs text-slate-500">NIP. {settings.nip_kepala_sekolah}</p>
            </div>

            <div className="text-right">
              <p>
                {getShortLocationName(settings.alamat)},{' '}
                {formatDateIndo(new Date().toISOString().split('T')[0])}
              </p>
              <p className="mt-1 font-bold">Bendahara Sekolah</p>
              <div className="h-16"></div>
              <p className="font-bold underline">{settings.bendahara}</p>
              <p className="text-3xs text-slate-500">NIP. {settings.nip_bendahara}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


