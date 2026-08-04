import React, { useState } from 'react';
import { Siswa, Kelas, User, AppSettings } from '../types';
import { formatRupiah, formatDateIndo, StorageService } from '../services/storage';
import { QRCodeDisplayModal } from './QRCodeDisplayModal';
import { QRScannerModal } from './QRScannerModal';
import { SiswaImportExportModal } from './SiswaImportExportModal';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Filter,
  CheckCircle,
  XCircle,
  Phone,
  UserCheck,
  Building,
  GraduationCap,
  X,
  FileSpreadsheet,
  QrCode,
  Upload,
  Download,
} from 'lucide-react';

interface SiswaManagerProps {
  siswaList: Siswa[];
  kelasList: Kelas[];
  activeUser: User;
  settings?: AppSettings;
  onRefreshData: () => void;
  onNavigateToPassbook: (nis: string) => void;
}

export const SiswaManager: React.FC<SiswaManagerProps> = ({
  siswaList,
  kelasList,
  activeUser,
  settings = {
    nama_sekolah: 'SD NEGERI 1 TABSIS DIGITAL',
    npsn: '20198822',
    tahun_ajaran: '2025/2026',
    semester: 'Ganjil',
    nama_kepala_sekolah: 'Dr. Hj. Siti Aminah, M.Pd.',
    nip_kepala_sekolah: '19750812 199903 2 001',
    nama_bendahara: 'Budi Santoso, S.Pd.',
    nip_bendahara: '19820415 200604 1 005',
    alamat_sekolah: 'Jl. Education No. 45, Kompleks Pendidikan',
    telepon_sekolah: '(021) 555-0192',
    logo_url: '',
    min_saldo_mengendap: 10000,
  },
  onRefreshData,
  onNavigateToPassbook,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKelas, setFilterKelas] = useState('Semua');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSiswa, setEditingSiswa] = useState<Siswa | null>(null);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);

  // QR Modal States
  const [qrSiswa, setQrSiswa] = useState<Siswa | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Form State
  const [formNis, setFormNis] = useState('');
  const [formNisn, setFormNisn] = useState('');
  const [formNama, setFormNama] = useState('');
  const [formJk, setFormJk] = useState<'L' | 'P'>('L');
  const [formKelas, setFormKelas] = useState(kelasList[0]?.nama_kelas || '1-A');
  const [formOrangTua, setFormOrangTua] = useState('');
  const [formTelepon, setFormTelepon] = useState('');
  const [formSaldoAwal, setFormSaldoAwal] = useState<number>(0);
  const [formStatus, setFormStatus] = useState<'Aktif' | 'Lulus' | 'Pindah'>('Aktif');
  const [formTanggalDaftar, setFormTanggalDaftar] = useState<string>(() => new Date().toISOString().split('T')[0]);

  const canEdit = activeUser.role === 'admin' || activeUser.role === 'bendahara';

  // Filtered List
  const isGuru = activeUser.role === 'guru' || Boolean(activeUser.kelas);
  const isOrangTua = activeUser.role === 'orang_tua';

  const displayedSiswa = siswaList.filter((s) => {
    if (isGuru && activeUser.kelas && s.kelas !== activeUser.kelas) return false;
    if (isOrangTua && s.nisn !== activeUser.username && s.kelas !== activeUser.kelas) return false;

    if (filterKelas !== 'Semua' && s.kelas !== filterKelas) return false;

    const matchesSearch =
      s.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nis.includes(searchTerm) ||
      s.nisn.includes(searchTerm);

    return matchesSearch;
  });

  const openAddModal = () => {
    setEditingSiswa(null);
    setFormNis(`230${siswaList.length + 1}`);
    setFormNisn(`0151234${100 + siswaList.length}`);
    setFormNama('');
    setFormJk('L');
    setFormKelas(kelasList[0]?.nama_kelas || '1-A');
    setFormOrangTua('');
    setFormTelepon('081234567890');
    setFormSaldoAwal(0);
    setFormStatus('Aktif');
    setFormTanggalDaftar(new Date().toISOString().split('T')[0]);
    setShowAddModal(true);
  };

  const openEditModal = (siswa: Siswa) => {
    setEditingSiswa(siswa);
    setFormNis(siswa.nis);
    setFormNisn(siswa.nisn);
    setFormNama(siswa.nama);
    setFormJk(siswa.jenis_kelamin);
    setFormKelas(siswa.kelas);
    setFormOrangTua(siswa.orang_tua);
    setFormTelepon(siswa.telepon);
    setFormSaldoAwal(siswa.saldo);
    setFormStatus(siswa.status);
    setFormTanggalDaftar(siswa.tanggal_daftar || new Date().toISOString().split('T')[0]);
    setShowAddModal(true);
  };

  const handleSaveSiswa = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedK = kelasList.find((k) => k.nama_kelas === formKelas);
    const waliKelasName = selectedK ? selectedK.wali_kelas : 'Wali Kelas';

    if (editingSiswa) {
      const updated = siswaList.map((s) =>
        s.id === editingSiswa.id
          ? {
              ...s,
              nis: formNis,
              nisn: formNisn,
              nama: formNama,
              jenis_kelamin: formJk,
              kelas: formKelas,
              wali_kelas: waliKelasName,
              orang_tua: formOrangTua,
              telepon: formTelepon,
              saldo: formSaldoAwal,
              status: formStatus,
              tanggal_daftar: formTanggalDaftar,
            }
          : s
      );
      StorageService.saveSiswa(updated);
      StorageService.addLog(activeUser.nama, `Mengedit data siswa ${formNama} (NIS: ${formNis})`);
    } else {
      const newSiswaObj: Siswa = {
        id: `SIS-${Date.now()}`,
        nis: formNis,
        nisn: formNisn,
        nama: formNama,
        jenis_kelamin: formJk,
        kelas: formKelas,
        wali_kelas: waliKelasName,
        orang_tua: formOrangTua,
        telepon: formTelepon,
        saldo: formSaldoAwal,
        status: formStatus,
        tanggal_daftar: formTanggalDaftar || new Date().toISOString().split('T')[0],
      };
      StorageService.saveSiswa([...siswaList, newSiswaObj]);
      StorageService.addLog(activeUser.nama, `Menambahkan siswa baru ${formNama} (Kelas ${formKelas})`);
    }

    onRefreshData();
    setShowAddModal(false);
  };

  const handleDeleteSiswa = (id: string, nama: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus data siswa ${nama}?`)) {
      const updated = siswaList.filter((s) => s.id !== id);
      StorageService.saveSiswa(updated);
      StorageService.addLog(activeUser.nama, `Menghapus data siswa ${nama}`);
      onRefreshData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" />
            <span>Data Siswa Tabungan</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola data murid, NISN, kelas, dan informasi kontak orang tua.
          </p>
        </div>

        {canEdit && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsImportExportOpen(true)}
              className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 rounded-xl text-xs font-bold shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
              <span>Eksport / Impor Data</span>
            </button>
            <button
              onClick={openAddModal}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Siswa Baru</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari berdasarkan Nama, NIS, atau NISN..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        {/* Filter Kelas */}
        {isGuru && activeUser.kelas ? (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-extrabold shadow-2xs">
            <GraduationCap className="w-4 h-4 text-amber-600" />
            <span>Kelas yang Diampu: Kelas {activeUser.kelas}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-700">Kelas:</span>
            <select
              value={filterKelas}
              onChange={(e) => setFilterKelas(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-semibold cursor-pointer"
            >
              <option value="Semua">Semua Kelas ({siswaList.length})</option>
              {kelasList.map((k) => (
                <option key={k.id} value={k.nama_kelas}>
                  Kelas {k.nama_kelas}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Siswa Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <th className="p-3">No</th>
                <th className="p-3">NIS / NISN</th>
                <th className="p-3">Nama Siswa</th>
                <th className="p-3">L/P</th>
                <th className="p-3">Kelas</th>
                <th className="p-3">Wali Kelas</th>
                <th className="p-3">Orang Tua / HP</th>
                <th className="p-3 text-right">Saldo Tabungan</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedSiswa.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">
                    Tidak ada data siswa yang cocok dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                displayedSiswa.map((s, index) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-semibold text-slate-400">{index + 1}</td>
                    <td className="p-3 font-mono">
                      <div className="font-bold text-slate-800">{s.nis}</div>
                      <div className="text-3xs text-slate-400">{s.nisn}</div>
                    </td>
                    <td className="p-3 font-bold text-slate-900">{s.nama}</td>
                    <td className="p-3 font-bold text-slate-600">{s.jenis_kelamin}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-3xs">
                        {s.kelas}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">{s.wali_kelas}</td>
                    <td className="p-3 text-slate-600">
                      <div className="font-semibold text-slate-800">{s.orang_tua}</div>
                      <div className="text-3xs text-slate-500 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{s.telepon}</span>
                      </div>
                    </td>
                    <td className="p-3 text-right font-black text-emerald-700 text-sm">
                      {formatRupiah(s.saldo)}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`text-3xs font-bold px-2 py-0.5 rounded-full ${
                          s.status === 'Aktif'
                            ? 'bg-emerald-100 text-emerald-800'
                            : s.status === 'Lulus'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setQrSiswa(s)}
                          className="px-2 py-1 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded-lg text-3xs font-bold transition-colors cursor-pointer flex items-center gap-1 border border-amber-200"
                          title="Tampilkan & Cetak QR Code Kartu Siswa"
                        >
                          <QrCode className="w-3 h-3 text-amber-600" />
                          <span>QR Kartu</span>
                        </button>
                        <button
                          onClick={() => onNavigateToPassbook(s.nis)}
                          className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-3xs font-bold transition-colors cursor-pointer"
                          title="Cetak Buku Tabungan Siswa"
                        >
                          Buku Tabungan
                        </button>
                        {canEdit && (
                          <>
                            <button
                              onClick={() => openEditModal(s)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Edit Data Siswa"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteSiswa(s.id, s.nama)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Hapus Siswa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">
                {editingSiswa ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSiswa} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">NIS (Nomor Induk)</label>
                  <input
                    type="text"
                    value={formNis}
                    onChange={(e) => setFormNis(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">NISN (Nasional)</label>
                  <input
                    type="text"
                    value={formNisn}
                    onChange={(e) => setFormNisn(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Siswa</label>
                <input
                  type="text"
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  required
                  placeholder="Contoh: Muhammad Rizky Pratama"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jenis Kelamin</label>
                  <select
                    value={formJk}
                    onChange={(e) => setFormJk(e.target.value as 'L' | 'P')}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold bg-white"
                  >
                    <option value="L">Laki-Laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kelas</label>
                  <select
                    value={formKelas}
                    onChange={(e) => setFormKelas(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold bg-white"
                  >
                    {kelasList.map((k) => (
                      <option key={k.id} value={k.nama_kelas}>
                        Kelas {k.nama_kelas}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Orang Tua / Wali</label>
                  <input
                    type="text"
                    value={formOrangTua}
                    onChange={(e) => setFormOrangTua(e.target.value)}
                    required
                    placeholder="Nama ayah/ibu"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">No. WhatsApp / HP</label>
                  <input
                    type="text"
                    value={formTelepon}
                    onChange={(e) => setFormTelepon(e.target.value)}
                    required
                    placeholder="081234567890"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Saldo Awal Tabungan (Rp)</label>
                  <input
                    type="number"
                    value={formSaldoAwal}
                    onChange={(e) => setFormSaldoAwal(Number(e.target.value))}
                    disabled={!!editingSiswa} // Cant manually edit balance if editing, must use transactions!
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-black text-emerald-700 bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Murid</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold bg-white"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Lulus">Lulus</option>
                    <option value="Pindah">Pindah Sekolah</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tanggal Pendaftaran / Masuk</label>
                <input
                  type="date"
                  value={formTanggalDaftar}
                  onChange={(e) => setFormTanggalDaftar(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold bg-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 text-xs font-bold border border-slate-200 rounded-xl hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer"
                >
                  Simpan Data Siswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Card Modal */}
      <QRCodeDisplayModal
        isOpen={!!qrSiswa}
        onClose={() => setQrSiswa(null)}
        siswa={qrSiswa}
        settings={settings}
      />

      {/* QR Code Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        siswaList={siswaList}
        title="Scan QR Code Kartu Siswa"
        subtitle="Arahkan kamera ke QR Code kartu siswa"
        onScanSuccess={({ nisOrNisn, siswa }) => {
          let found = siswa;
          if (!found) {
            found = siswaList.find(
              (s) => s.nis === nisOrNisn || s.nisn === nisOrNisn || s.id === nisOrNisn
            );
          }
          if (found) {
            onNavigateToPassbook(found.nis);
          } else {
            alert(`Siswa dengan NIS/NISN "${nisOrNisn}" tidak ditemukan!`);
          }
        }}
      />

      {/* Import Export Batch Modal */}
      <SiswaImportExportModal
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
        siswaList={siswaList}
        kelasList={kelasList}
        activeUser={activeUser}
        onRefreshData={onRefreshData}
      />
    </div>
  );
};
