import React, { useState } from 'react';
import { AppSettings, User, Transaksi, BankMutationRecord } from '../types';
import { formatRupiah, formatDateIndo, StorageService } from '../services/storage';
import { FirestoreService } from '../services/firestoreService';
import {
  Landmark,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  PlusCircle,
  MinusCircle,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Printer,
  Search,
  Filter,
  Check,
  XCircle,
  Send,
  Building,
} from 'lucide-react';

interface BankPortalViewProps {
  settings: AppSettings;
  activeUser: User;
  transaksiList: Transaksi[];
  onRefreshData: () => void;
}

export const BankPortalView: React.FC<BankPortalViewProps> = ({
  settings,
  activeUser,
  transaksiList,
  onRefreshData,
}) => {
  const [activeFormTab, setActiveFormTab] = useState<'masuk' | 'tarik'>('masuk');

  // Form State
  const todayStr = new Date().toISOString().split('T')[0];
  const [tanggalTx, setTanggalTx] = useState(todayStr);
  const [nominal, setNominal] = useState<number>(0);
  const [noRef, setNoRef] = useState('');
  const [namaBendahara, setNamaBendahara] = useState(settings.bendahara || 'Bendahara Sekolah');
  const [keterangan, setKeterangan] = useState('');
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Approval Queue State
  const [selectedApprovalTxIds, setSelectedApprovalTxIds] = useState<string[]>([]);
  const [approvalRefNo, setApprovalRefNo] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvalMsg, setApprovalMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Filter State
  const [filterJenis, setFilterJenis] = useState<'all' | 'masuk' | 'tarik'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Load Bank Mutations
  const bankMutations = StorageService.getBankMutations();

  // Metrics Calculations
  const totalMasuk = bankMutations
    .filter((m) => m.jenis === 'masuk')
    .reduce((sum, m) => sum + m.nominal, 0);

  const totalTarik = bankMutations
    .filter((m) => m.jenis === 'tarik')
    .reduce((sum, m) => sum + m.nominal, 0);

  const saldoBankSaatIni = settings.saldo_bank || 0;

  // Pending Submissions from Bendahara waiting for Bank Approval
  const pendingApprovalTxList = transaksiList.filter(
    (t) => (t.status_alur === 'Menunggu Approval Bank' || t.status_bank === 'Menunggu Approval Bank') && t.jenis === 'setoran'
  );
  const totalPendingApprovalNominal = pendingApprovalTxList.reduce((sum, t) => sum + t.setoran, 0);

  // Kas Bendahara belum disetor ke Bank
  const belumDisetorKeBank = transaksiList
    .filter((t) => t.status_alur === 'Disetor ke Bendahara' && t.jenis === 'setoran')
    .reduce((sum, t) => sum + t.setoran, 0);

  // Toggle selection for approval
  const toggleSelectApprovalTx = (id: string) => {
    setSelectedApprovalTxIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAllApprovalTx = () => {
    if (selectedApprovalTxIds.length === pendingApprovalTxList.length) {
      setSelectedApprovalTxIds([]);
    } else {
      setSelectedApprovalTxIds(pendingApprovalTxList.map((t) => t.id));
    }
  };

  // Process Bank Approval
  const handleApproveSelected = async () => {
    if (selectedApprovalTxIds.length === 0) {
      alert('Pilih minimal satu transaksi setoran dari Bendahara untuk disetujui.');
      return;
    }

    const res = await FirestoreService.approveSetoranBank(
      selectedApprovalTxIds,
      activeUser.nama,
      approvalRefNo.trim() || undefined
    );

    if (res.success) {
      setApprovalMsg({ text: res.message, type: 'success' });
      setSelectedApprovalTxIds([]);
      setApprovalRefNo('');
      onRefreshData();
    } else {
      setApprovalMsg({ text: res.message, type: 'error' });
    }
  };

  // Process Bank Rejection
  const handleTolakSelected = async () => {
    if (selectedApprovalTxIds.length === 0) {
      alert('Pilih minimal satu transaksi setoran dari Bendahara untuk dikembalikan/ditolak.');
      return;
    }

    const res = await FirestoreService.tolakSetoranBank(
      selectedApprovalTxIds,
      activeUser.nama,
      rejectionReason.trim() || 'Perlu verifikasi ulang nominal dengan Bendahara'
    );

    if (res.success) {
      setApprovalMsg({ text: res.message, type: 'success' });
      setSelectedApprovalTxIds([]);
      setRejectionReason('');
      onRefreshData();
    } else {
      setApprovalMsg({ text: res.message, type: 'error' });
    }
  };

  // Filtered Mutations Table
  const filteredMutations = bankMutations.filter((m) => {
    const matchJenis = filterJenis === 'all' || m.jenis === filterJenis;
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !searchQuery ||
      m.id.toLowerCase().includes(q) ||
      (m.no_referensi && m.no_referensi.toLowerCase().includes(q)) ||
      m.keterangan.toLowerCase().includes(q) ||
      (m.nama_bendahara && m.nama_bendahara.toLowerCase().includes(q));
    return matchJenis && matchSearch;
  });

  const handleSubmitMutation = (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    if (nominal <= 0) {
      setMsg({ text: 'Nominal transaksi harus lebih besar dari Rp 0.', type: 'error' });
      return;
    }

    if (activeFormTab === 'tarik' && nominal > saldoBankSaatIni) {
      setMsg({
        text: `Saldo Kas Bank saat ini (Rp ${saldoBankSaatIni.toLocaleString('id-ID')}) tidak mencukupi untuk penarikan sebesar Rp ${nominal.toLocaleString('id-ID')}`,
        type: 'error',
      });
      return;
    }

    const res = StorageService.addBankMutation({
      jenis: activeFormTab,
      nominal: nominal,
      no_referensi: noRef.trim() || undefined,
      keterangan:
        keterangan.trim() ||
        (activeFormTab === 'masuk'
          ? `Setoran Kas Sekolah dari Bendahara (${namaBendahara})`
          : `Penarikan Kas Sekolah oleh Bendahara (${namaBendahara})`),
      petugas_bank: activeUser.nama,
      nama_bendahara: namaBendahara,
      tanggal: tanggalTx,
    });

    if (res.success) {
      setMsg({ text: res.message, type: 'success' });
      setNominal(0);
      setNoRef('');
      setKeterangan('');
      onRefreshData();
    } else {
      setMsg({ text: res.message, type: 'error' });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className="p-5 bg-gradient-to-r from-cyan-900 via-teal-900 to-slate-900 text-white rounded-2xl shadow-lg border border-cyan-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Landmark className="w-6 h-6 text-cyan-300" />
            <h2 className="text-lg font-black tracking-wide">Portal & Approval Setoran Bank Mitra</h2>
            <span className="px-2.5 py-0.5 bg-cyan-500/30 text-cyan-200 border border-cyan-400/30 text-3xs font-extrabold rounded-full uppercase tracking-wider">
              Role: Admin Bank
            </span>
          </div>
          <p className="text-xs text-cyan-100/90 max-w-2xl leading-relaxed">
            Penyetoran dari Bendahara Sekolah langsung masuk antrean persetujuan (approval) Bank Mitra.
            Admin Bank melakukan konfirmasi penerimaan dana untuk memperbarui saldo rekening resmi sekolah.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-cyan-100 rounded-xl text-xs font-bold border border-cyan-300/30 transition-all cursor-pointer flex items-center gap-2 self-start md:self-auto print:hidden"
        >
          <Printer className="w-4 h-4 text-cyan-300" />
          <span>Cetak Rekap Bank</span>
        </button>
      </div>

      {/* Privacy Notice Banner */}
      <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-900">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs font-medium leading-relaxed">
          <strong>Proteksi Data & Privasi Siswa:</strong> Sesuai protokol kebijakan keamanan, akun Admin Bank hanya diberikan hak akses untuk menyetujui, mencatat, dan merekapitulasi total uang masuk / keluar antara Bendahara dan Bank Mitra. Data detail transaksi per-siswa tetap tersimpan rapi untuk rekonsiliasi kas.
        </p>
      </div>

      {/* Metrics Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Pending Bank Approval */}
        <div className={`p-5 rounded-2xl border shadow-2xs transition-all relative overflow-hidden ${
          pendingApprovalTxList.length > 0 
            ? 'bg-gradient-to-br from-amber-50 to-amber-100/80 border-amber-300 ring-2 ring-amber-400/50' 
            : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-amber-900 uppercase tracking-wider">Menunggu Approval Bank</span>
            <div className="p-2.5 bg-amber-200/80 text-amber-900 rounded-xl relative">
              <Clock className="w-5 h-5" />
              {pendingApprovalTxList.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-600 rounded-full animate-ping" />
              )}
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-black text-amber-950">{formatRupiah(totalPendingApprovalNominal)}</div>
            <p className="text-3xs font-extrabold text-amber-800 mt-1">
              {pendingApprovalTxList.length} Transaksi disetorkan Bendahara
            </p>
          </div>
        </div>

        {/* Card 2: Saldo Bank Terkini */}
        <div className="bg-gradient-to-br from-cyan-700 via-teal-800 to-slate-900 text-white p-5 rounded-2xl shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-cyan-100 uppercase tracking-wider">Saldo Kas Bank Mitra</span>
            <div className="p-2 bg-white/20 rounded-xl">
              <Landmark className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white tracking-tight">{formatRupiah(saldoBankSaatIni)}</div>
            <p className="text-3xs text-cyan-100 mt-1">Saldo resmi terkonfirmasi di Bank</p>
          </div>
        </div>

        {/* Card 3: Total Setoran Masuk */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Total Setoran Disetujui</span>
            <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-black text-emerald-700">{formatRupiah(totalMasuk)}</div>
            <p className="text-3xs text-slate-500 mt-1">Total kas disetujui Admin Bank</p>
          </div>
        </div>

        {/* Card 4: Total Penarikan */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Penarikan Kas Sekolah</span>
            <div className="p-2.5 bg-rose-50 rounded-xl text-rose-600">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-black text-rose-700">{formatRupiah(totalTarik)}</div>
            <p className="text-3xs text-slate-500 mt-1">Kas ditarik oleh Bendahara</p>
          </div>
        </div>
      </div>

      {/* SECTION 1: QUEUE APPROVAL SETORAN BENDAHARA */}
      <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-100 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-3xs font-extrabold uppercase tracking-widest mb-1">
              <Clock className="w-3.5 h-3.5 text-amber-700" />
              <span>Persetujuan Setoran Uang Masuk</span>
            </div>
            <h3 className="text-base font-black text-slate-900">
              Daftar Pengajuan Setoran dari Bendahara Sekolah ({pendingApprovalTxList.length} Transaksi)
            </h3>
            <p className="text-xs text-slate-500">
              Setiap kali Bendahara menyetorkan uang ke Bank, item setoran akan muncul di sini untuk dikonfirmasi/diapprove oleh Admin Bank.
            </p>
          </div>

          {pendingApprovalTxList.length > 0 && (
            <button
              onClick={selectAllApprovalTx}
              className="px-3.5 py-2 bg-amber-100 hover:bg-amber-200 text-amber-950 text-xs font-black rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
            >
              {selectedApprovalTxIds.length === pendingApprovalTxList.length
                ? 'Batal Pilih Semua'
                : 'Pilih Semua Pengajuan Setoran'}
            </button>
          )}
        </div>

        {approvalMsg && (
          <div
            className={`p-3.5 rounded-xl text-xs font-bold flex items-center justify-between gap-2 ${
              approvalMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{approvalMsg.text}</span>
            </div>
            <button onClick={() => setApprovalMsg(null)} className="text-xs font-black cursor-pointer">
              Tutup
            </button>
          </div>
        )}

        {pendingApprovalTxList.length === 0 ? (
          <div className="p-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs font-bold">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
            <span>Tidak ada pengajuan setoran dari Bendahara yang menunggu persetujuan (Approval) saat ini.</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto border border-amber-200 rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-amber-50/80 text-amber-950 font-bold border-b border-amber-200">
                    <th className="p-3 text-center w-12">Pilih</th>
                    <th className="p-3">Tanggal Setor</th>
                    <th className="p-3">Siswa & Kelas</th>
                    <th className="p-3">Penyetor (Bendahara)</th>
                    <th className="p-3">Keterangan</th>
                    <th className="p-3 text-right">Nominal Setoran</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100 font-medium">
                  {pendingApprovalTxList.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => toggleSelectApprovalTx(t.id)}
                      className={`hover:bg-amber-50/50 cursor-pointer transition-colors ${
                        selectedApprovalTxIds.includes(t.id) ? 'bg-amber-100/60 font-semibold' : ''
                      }`}
                    >
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedApprovalTxIds.includes(t.id)}
                          onChange={() => toggleSelectApprovalTx(t.id)}
                          className="w-4 h-4 text-amber-600 rounded-xs focus:ring-amber-500 cursor-pointer"
                        />
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-700">
                        {formatDateIndo(t.tanggal_setor_bank || t.tanggal)}
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{t.nama}</div>
                        <div className="text-3xs text-slate-500 font-mono">
                          Kelas {t.kelas} • NIS: {t.nis}
                        </div>
                      </td>
                      <td className="p-3 font-bold text-amber-900">{t.petugas_bendahara || settings.bendahara}</td>
                      <td className="p-3 text-slate-700">{t.keterangan}</td>
                      <td className="p-3 text-right font-black text-amber-900 text-sm">{formatRupiah(t.setoran)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Approval Action Box */}
            <div className="p-5 bg-gradient-to-r from-amber-500/10 via-amber-50 to-emerald-50 border border-amber-300 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <span className="text-2xs font-extrabold uppercase text-amber-900 tracking-wider block">
                  Aksi Persetujuan Setoran Uang Masuk Bank
                </span>
                <div className="text-sm font-bold text-amber-950 mt-0.5">
                  Terpilih: <strong>{selectedApprovalTxIds.length} Transaksi</strong> • Total Nominal: {' '}
                  <span className="text-emerald-700 font-black text-base">
                    {formatRupiah(
                      pendingApprovalTxList
                        .filter((t) => selectedApprovalTxIds.includes(t.id))
                        .reduce((a, b) => a + b.setoran, 0)
                    )}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="text"
                  value={approvalRefNo}
                  onChange={(e) => setApprovalRefNo(e.target.value)}
                  placeholder="No. Slip / Ref Bank (opsional)..."
                  className="px-3.5 py-2 text-xs border border-amber-300 rounded-xl bg-white w-full sm:w-56 font-bold"
                />

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleApproveSelected}
                    disabled={selectedApprovalTxIds.length === 0}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap flex-1 sm:flex-none"
                  >
                    <Check className="w-4 h-4 text-emerald-200" />
                    <span>Approve & Setujui Setoran Bank</span>
                  </button>

                  <button
                    onClick={handleTolakSelected}
                    disabled={selectedApprovalTxIds.length === 0}
                    className="px-4 py-2.5 bg-rose-100 hover:bg-rose-200 border border-rose-300 text-rose-900 disabled:opacity-50 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>Tolak / Kembalikan</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: FORM MUTASI MANUAL ADMIN BANK */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-5 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Landmark className="w-5 h-5 text-teal-600" />
              <span>Form Pencatatan / Penarikan Kas Langsung Bank Mitra</span>
            </h3>
            <p className="text-xs text-slate-500">
              Digunakan untuk mencatat transaksi khusus atau penarikan kas tunai secara langsung oleh Bendahara Sekolah.
            </p>
          </div>

          {/* Form Mode Selector */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveFormTab('masuk')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeFormTab === 'masuk'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Setoran Masuk Manual</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFormTab('tarik')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeFormTab === 'tarik'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MinusCircle className="w-3.5 h-3.5" />
              <span>Penarikan Kas</span>
            </button>
          </div>
        </div>

        {/* Status Message */}
        {msg && (
          <div
            className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
              msg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{msg.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmitMutation} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Tanggal */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tanggal Transaksi Bank <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={tanggalTx}
              onChange={(e) => setTanggalTx(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 font-bold bg-white"
            />
          </div>

          {/* Nominal */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nominal {activeFormTab === 'masuk' ? 'Setoran Masuk (Rp)' : 'Penarikan Kas (Rp)'}{' '}
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              value={nominal || ''}
              onChange={(e) => setNominal(Number(e.target.value))}
              placeholder="Contoh: 5000000"
              required
              min={1000}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 font-bold bg-white"
            />
            {nominal > 0 && (
              <p className="text-3xs font-extrabold text-emerald-700 mt-1">
                Formatted: {formatRupiah(nominal)}
              </p>
            )}
          </div>

          {/* No Referensi / Slip */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              No. Referensi / Slip Bank / Cek
            </label>
            <input
              type="text"
              value={noRef}
              onChange={(e) => setNoRef(e.target.value)}
              placeholder={activeFormTab === 'masuk' ? 'Contoh: SLIP-SETOR-001' : 'Contoh: CEK-BANK-998'}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 font-mono font-bold bg-white"
            />
          </div>

          {/* Bendahara Sekolah */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Bendahara Penyetor/Penarik
            </label>
            <input
              type="text"
              value={namaBendahara}
              onChange={(e) => setNamaBendahara(e.target.value)}
              placeholder="Siti Rahmawati, S.Pd."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 font-bold bg-white"
            />
          </div>

          {/* Keterangan */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">Keterangan / Keperluan Transaksi</label>
            <input
              type="text"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder={
                activeFormTab === 'masuk'
                  ? 'Contoh: Setoran Kas Kolektif Tabungan Siswa Minggu Ke-1'
                  : 'Contoh: Penarikan Kas untuk Pengembalian Tabungan Siswa Kelulusan'
              }
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 font-bold bg-white"
            />
          </div>

          {/* Submit Button */}
          <div className="md:col-span-3 flex justify-end pt-2">
            <button
              type="submit"
              className={`px-6 py-2.5 rounded-xl font-extrabold text-xs text-white shadow-xs transition-all cursor-pointer flex items-center gap-2 ${
                activeFormTab === 'masuk'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              <Landmark className="w-4 h-4 text-amber-200" />
              <span>
                {activeFormTab === 'masuk' ? 'Catat & Simpan Setoran Masuk' : 'Catat & Simpan Penarikan Kas'}
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* Mutasi & Rekap Kas Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
              <span>Rekapitulasi Mutasi Kas Bank Mitra (Disetujui)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Riwayat lengkap pencatatan arus kas uang masuk yang disetujui dari Bendahara dan penarikan oleh Bendahara.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari ref/keterangan..."
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white font-bold"
              />
            </div>

            <select
              value={filterJenis}
              onChange={(e) => setFilterJenis(e.target.value as any)}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white font-bold cursor-pointer"
            >
              <option value="all">Semua Jenis Mutasi</option>
              <option value="masuk">Setoran Masuk Saja</option>
              <option value="tarik">Penarikan Kas Saja</option>
            </select>
          </div>
        </div>

        {filteredMutations.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs font-medium">
            Belum ada riwayat mutasi kas bank yang tercatat. Silakan approve pengajuan setoran dari Bendahara di atas.
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <th className="p-3">No</th>
                  <th className="p-3">Tanggal & Jam</th>
                  <th className="p-3 text-center">Jenis Mutasi</th>
                  <th className="p-3">No. Referensi</th>
                  <th className="p-3">Bendahara / Penyetor</th>
                  <th className="p-3">Keterangan</th>
                  <th className="p-3 text-right">Nominal</th>
                  <th className="p-3 text-right">Saldo Bank</th>
                  <th className="p-3 text-center">Petugas Bank</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredMutations.map((m, idx) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="p-3 text-slate-400 font-semibold">{idx + 1}</td>
                    <td className="p-3 font-mono text-slate-700">
                      <div className="font-bold">{formatDateIndo(m.tanggal)}</div>
                      <div className="text-3xs text-slate-400">{m.jam}</div>
                    </td>
                    <td className="p-3 text-center">
                      {m.jenis === 'masuk' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-3xs font-extrabold border border-emerald-200">
                          <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                          <span>SETORAN MASUK</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-100 text-rose-800 rounded-full text-3xs font-extrabold border border-rose-200">
                          <ArrowUpRight className="w-3 h-3 text-rose-600" />
                          <span>PENARIKAN KAS</span>
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-800">{m.no_referensi || m.id}</td>
                    <td className="p-3 font-bold text-slate-900">{m.nama_bendahara || settings.bendahara}</td>
                    <td className="p-3 text-slate-700 max-w-xs truncate">{m.keterangan}</td>
                    <td
                      className={`p-3 text-right font-black ${
                        m.jenis === 'masuk' ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {m.jenis === 'masuk' ? `+${formatRupiah(m.nominal)}` : `-${formatRupiah(m.nominal)}`}
                    </td>
                    <td className="p-3 text-right font-black text-slate-900">{formatRupiah(m.saldo_setelah)}</td>
                    <td className="p-3 text-center text-3xs font-bold text-slate-600">{m.petugas_bank}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
