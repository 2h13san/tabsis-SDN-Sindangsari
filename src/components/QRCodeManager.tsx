import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  Search,
  Plus,
  Edit3,
  Trash2,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileImage,
  CreditCard,
  Building2,
  Filter,
  Eye,
  Download,
  Sparkles,
  School,
  X,
  Layers,
  Check,
} from 'lucide-react';
import { Siswa, AppSettings, User, Kelas } from '../types';
import { StorageService } from '../services/storage';
import { FirestoreService } from '../services/firestoreService';
import { QRCodeDisplayModal } from './QRCodeDisplayModal';

interface QRCodeManagerProps {
  siswaList: Siswa[];
  kelasList: Kelas[];
  settings: AppSettings;
  activeUser: User;
  onRefreshData: () => void;
}

// Helper component to render QR Code preview thumbnail (Canvas or Image)
const StudentQRThumbnail: React.FC<{ siswa: Siswa; size?: number }> = ({ siswa, size = 64 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (siswa.qr_image_url || !canvasRef.current) return;

    const qrData = siswa.qr_code
      ? siswa.qr_code
      : JSON.stringify({
          type: 'TABSIS_SISWA',
          nis: siswa.nis,
          nisn: siswa.nisn,
          nama: siswa.nama,
          kelas: siswa.kelas,
        });

    QRCode.toCanvas(
      canvasRef.current,
      qrData,
      {
        width: size,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      },
      (error) => {
        if (error) console.error('Error drawing thumbnail:', error);
      }
    );
  }, [siswa.qr_code, siswa.qr_image_url, siswa.nis, siswa.nisn, size]);

  if (siswa.qr_image_url) {
    return (
      <img
        src={siswa.qr_image_url}
        alt={`QR ${siswa.nama}`}
        className="object-contain rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs"
        style={{ width: `${size}px`, height: `${size}px` }}
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="rounded-lg border border-slate-200 bg-white shadow-2xs shrink-0"
      width={size}
      height={size}
    />
  );
};

export const QRCodeManager: React.FC<QRCodeManagerProps> = ({
  siswaList,
  kelasList,
  settings,
  activeUser,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<'siswa' | 'qris'>('siswa');

  // Student Filter & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKelas, setFilterKelas] = useState('Semua');
  const [filterQrStatus, setFilterQrStatus] = useState<'semua' | 'custom' | 'image' | 'default'>('semua');

  // Edit Student QR Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSiswa, setSelectedSiswa] = useState<Siswa | null>(null);
  const [inputStudentId, setInputStudentId] = useState('');
  const [qrTypeMode, setQrTypeMode] = useState<'text' | 'image' | 'default'>('text');
  const [customQrCodeInput, setCustomQrCodeInput] = useState('');
  const [uploadedQrImageUrl, setUploadedQrImageUrl] = useState('');
  const [modalPreviewCanvasRef, setModalPreviewCanvasRef] = useState<HTMLCanvasElement | null>(null);

  // Display Full QR Card Modal
  const [isDisplayModalOpen, setIsDisplayModalOpen] = useState(false);
  const [displaySiswa, setDisplaySiswa] = useState<Siswa | null>(null);

  // School QRIS State
  const [qrisBank, setQrisBank] = useState(settings.qris_nama_bank || 'Bank Jateng / BRI / QRIS Nasional');
  const [qrisNorek, setQrisNorek] = useState(settings.qris_no_rekening || '1029-3849-5028');
  const [qrisAtasNama, setQrisAtasNama] = useState(settings.qris_atas_nama || `KAS TABUNGAN ${settings.nama_sekolah.toUpperCase()}`);
  const [qrisPayload, setQrisPayload] = useState(settings.qris_code || '00020101021126620014ID.LINKAJA.WWW01189360091100000000005204581253033605802ID5920SDN 01 NUSANTARA6007JAKARTA6105121106304C92E');
  const [qrisImageBase64, setQrisImageBase64] = useState(settings.qris_image_url || '');

  // Notifications / Feedback
  const [successMsg, setSuccessMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Synchronize modal preview QR drawing
  useEffect(() => {
    if (!isEditModalOpen || !modalPreviewCanvasRef) return;
    if (qrTypeMode === 'image') return;

    let stringToDraw = '';
    if (qrTypeMode === 'default') {
      const targetS = siswaList.find((s) => s.id === inputStudentId) || selectedSiswa;
      stringToDraw = targetS
        ? JSON.stringify({
            type: 'TABSIS_SISWA',
            nis: targetS.nis,
            nisn: targetS.nisn,
            nama: targetS.nama,
            kelas: targetS.kelas,
          })
        : 'SAMPLE-QR-CODE';
    } else {
      stringToDraw = customQrCodeInput.trim() || 'SAMPLE-CUSTOM-QR-CODE';
    }

    QRCode.toCanvas(
      modalPreviewCanvasRef,
      stringToDraw,
      {
        width: 180,
        margin: 2,
        color: { dark: '#0f172a', light: '#ffffff' },
      },
      (err) => {
        if (err) console.error('Error drawing preview canvas:', err);
      }
    );
  }, [isEditModalOpen, modalPreviewCanvasRef, qrTypeMode, customQrCodeInput, inputStudentId, selectedSiswa, siswaList]);

  // Statistics calculation
  const totalSiswaCount = siswaList.length;
  const customTextQrCount = siswaList.filter((s) => s.qr_code && !s.qr_image_url).length;
  const customImageQrCount = siswaList.filter((s) => s.qr_image_url).length;
  const defaultNisQrCount = siswaList.filter((s) => !s.qr_code && !s.qr_image_url).length;

  // Filtered Siswa List
  const filteredSiswa = siswaList.filter((s) => {
    // Search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchNama = s.nama.toLowerCase().includes(q);
      const matchNis = s.nis.toLowerCase().includes(q);
      const matchNisn = s.nisn?.toLowerCase().includes(q);
      const matchQr = s.qr_code?.toLowerCase().includes(q);
      if (!matchNama && !matchNis && !matchNisn && !matchQr) return false;
    }

    // Filter Kelas
    if (filterKelas !== 'Semua' && s.kelas !== filterKelas) return false;

    // Filter Status QR
    if (filterQrStatus === 'custom' && (!s.qr_code || s.qr_image_url)) return false;
    if (filterQrStatus === 'image' && !s.qr_image_url) return false;
    if (filterQrStatus === 'default' && (s.qr_code || s.qr_image_url)) return false;

    return true;
  });

  // Open Modal For Editing or Creating
  const handleOpenEditModal = (siswa?: Siswa) => {
    if (siswa) {
      setSelectedSiswa(siswa);
      setInputStudentId(siswa.id);
      if (siswa.qr_image_url) {
        setQrTypeMode('image');
        setUploadedQrImageUrl(siswa.qr_image_url);
        setCustomQrCodeInput(siswa.qr_code || '');
      } else if (siswa.qr_code) {
        setQrTypeMode('text');
        setCustomQrCodeInput(siswa.qr_code);
        setUploadedQrImageUrl('');
      } else {
        setQrTypeMode('text');
        setCustomQrCodeInput(`QR-${siswa.nis}`);
        setUploadedQrImageUrl('');
      }
    } else {
      setSelectedSiswa(null);
      const firstS = siswaList[0];
      setInputStudentId(firstS ? firstS.id : '');
      setQrTypeMode('text');
      setCustomQrCodeInput(firstS ? `QR-${firstS.nis}` : '');
      setUploadedQrImageUrl('');
    }
    setIsEditModalOpen(true);
  };

  // Handle Image File Upload for Student QR
  const handleStudentImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file gambar QR terlalu besar! Maksimal 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setUploadedQrImageUrl(base64);
      setQrTypeMode('image');
    };
    reader.readAsDataURL(file);
  };

  // Handle Image Upload for School QRIS
  const handleQrisImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert('Ukuran file gambar QRIS terlalu besar! Maksimal 3MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setQrisImageBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  // Save Custom QR for Student
  const handleSaveStudentQr = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetS = siswaList.find((s) => s.id === inputStudentId) || selectedSiswa;
    if (!targetS) {
      alert('Pilih siswa terlebih dahulu!');
      return;
    }

    setIsSaving(true);
    try {
      let updatedCode: string | undefined = undefined;
      let updatedImageUrl: string | undefined = undefined;

      if (qrTypeMode === 'text') {
        if (!customQrCodeInput.trim()) {
          alert('Masukkan kode QR / Barcode custom untuk siswa!');
          setIsSaving(false);
          return;
        }
        updatedCode = customQrCodeInput.trim();
        updatedImageUrl = undefined;
      } else if (qrTypeMode === 'image') {
        if (!uploadedQrImageUrl) {
          alert('Unggah file gambar QR Code terlebih dahulu!');
          setIsSaving(false);
          return;
        }
        updatedImageUrl = uploadedQrImageUrl;
        updatedCode = customQrCodeInput.trim() || undefined;
      } else {
        // Default NIS
        updatedCode = undefined;
        updatedImageUrl = undefined;
      }

      const updatedSiswaObj: Siswa = {
        ...targetS,
        qr_code: updatedCode,
        qr_image_url: updatedImageUrl,
        qr_updated_at: new Date().toISOString(),
      };

      const newSiswaList = siswaList.map((s) => (s.id === targetS.id ? updatedSiswaObj : s));

      StorageService.saveSiswa(newSiswaList);
      await FirestoreService.saveSiswaItem(updatedSiswaObj);
      await FirestoreService.addLog(
        activeUser.username,
        `Memperbarui QR Code khusus untuk siswa ${targetS.nama} (${targetS.nis})`
      );

      setSuccessMsg(`Berhasil menyimpan QR Code untuk siswa "${targetS.nama}"!`);
      setIsEditModalOpen(false);
      onRefreshData();

      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Error saving student QR:', err);
      alert('Gagal menyimpan QR Code. Pastikan jaringan stabil.');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset Student QR to Default
  const handleResetStudentQr = async (siswa: Siswa) => {
    if (!confirm(`Kembalikan QR Code siswa "${siswa.nama}" ke format standar NIS/NISN?`)) return;

    try {
      const updatedSiswaObj: Siswa = {
        ...siswa,
        qr_code: undefined,
        qr_image_url: undefined,
        qr_updated_at: undefined,
      };

      const newSiswaList = siswaList.map((s) => (s.id === siswa.id ? updatedSiswaObj : s));

      StorageService.saveSiswa(newSiswaList);
      await FirestoreService.saveSiswaItem(updatedSiswaObj);
      await FirestoreService.addLog(
        activeUser.username,
        `Mereset QR Code siswa ${siswa.nama} (${siswa.nis}) ke NIS standar`
      );

      setSuccessMsg(`QR Code "${siswa.nama}" telah dikembalikan ke format NIS default.`);
      onRefreshData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Error resetting QR:', err);
      alert('Gagal mereset QR Code.');
    }
  };

  // Auto Assign Batch Default Format
  const handleBatchAutoAssignQr = async () => {
    if (!confirm('Otomatis tetapkan kode QR berformat "QR-[NIS]" untuk seluruh siswa yang belum memiliki QR khusus?')) {
      return;
    }

    setIsSaving(true);
    try {
      let updateCount = 0;
      const updatedList = await Promise.all(
        siswaList.map(async (s) => {
          if (!s.qr_code && !s.qr_image_url) {
            updateCount++;
            const updatedObj: Siswa = {
              ...s,
              qr_code: `QR-${s.nis}`,
              qr_updated_at: new Date().toISOString(),
            };
            await FirestoreService.saveSiswaItem(updatedObj);
            return updatedObj;
          }
          return s;
        })
      );

      StorageService.saveSiswa(updatedList);
      await FirestoreService.addLog(
        activeUser.username,
        `Generate otomatis QR Code custom "QR-[NIS]" untuk ${updateCount} siswa`
      );

      setSuccessMsg(`Berhasil menetapkan Kode QR khusus untuk ${updateCount} siswa!`);
      onRefreshData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Error batch assigning QR:', err);
      alert('Terjadi kesalahan saat batch generate QR.');
    } finally {
      setIsSaving(false);
    }
  };

  // Save School QRIS
  const handleSaveSchoolQris = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const newSettings: AppSettings = {
        ...settings,
        qris_nama_bank: qrisBank,
        qris_no_rekening: qrisNorek,
        qris_atas_nama: qrisAtasNama,
        qris_code: qrisPayload,
        qris_image_url: qrisImageBase64,
      };

      await FirestoreService.saveSettings(newSettings);
      await FirestoreService.addLog(
        activeUser.username,
        'Memperbarui data QRIS / Rekening Bank Sekolah untuk setoran tabungan'
      );

      setSuccessMsg('Berhasil memperbarui data QRIS / Rekening Bank Sekolah!');
      onRefreshData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Error saving QRIS:', err);
      alert('Gagal menyimpan data QRIS Sekolah.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 rounded-2xl shadow-lg border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="p-2 bg-indigo-600/50 rounded-xl text-amber-400 border border-indigo-500/40">
              <QrCode className="w-6 h-6" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">Manajemen QR Code</h1>
          </div>
          <p className="text-xs text-slate-300 max-w-xl">
            Kelola kode QR khusus kartu siswa, unggah gambar barcode fisik Anda sendiri, atau atur QRIS
            pembayaran kas sekolah.
          </p>
        </div>

        {/* Action Button Header */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleOpenEditModal()}
            className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah / Set QR Siswa</span>
          </button>
          <button
            onClick={() => setActiveTab('qris')}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl border border-indigo-400/30 transition-all flex items-center gap-2 cursor-pointer"
          >
            <CreditCard className="w-4 h-4 text-amber-300" />
            <span>QRIS Sekolah</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl shadow-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-xs font-bold">{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-700 hover:text-emerald-950 text-xs font-black">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('siswa')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'siswa'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>QR Code Kartu Siswa ({totalSiswaCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('qris')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'qris'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>QRIS / Rekening Pembayaran Bank</span>
        </button>
      </div>

      {/* ================= TAB 1: QR CODE KARTU SISWA ================= */}
      {activeTab === 'siswa' && (
        <div className="space-y-5">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
              <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <span className="text-3xs font-extrabold uppercase text-slate-400 block">Total Murid</span>
                <span className="text-lg font-black text-slate-900">{totalSiswaCount} Siswa</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-3xs font-extrabold uppercase text-slate-400 block">Kode QR Custom</span>
                <span className="text-lg font-black text-emerald-700">{customTextQrCount} Siswa</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
              <div className="p-3 bg-sky-50 text-sky-700 rounded-xl">
                <FileImage className="w-5 h-5" />
              </div>
              <div>
                <span className="text-3xs font-extrabold uppercase text-slate-400 block">Gambar QR Upload</span>
                <span className="text-lg font-black text-sky-700">{customImageQrCount} Siswa</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
              <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <span className="text-3xs font-extrabold uppercase text-slate-400 block">Standard (NIS)</span>
                <span className="text-lg font-black text-amber-700">{defaultNisQrCount} Siswa</span>
              </div>
            </div>
          </div>

          {/* Filter Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
              {/* Search Box */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cari nama, NIS, NISN, atau Kode QR..."
                  className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold"
                />
              </div>

              {/* Filter Kelas */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                <select
                  value={filterKelas}
                  onChange={(e) => setFilterKelas(e.target.value)}
                  className="px-3 py-2 text-xs border border-slate-200 rounded-xl font-bold bg-white focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="Semua">Semua Kelas ({siswaList.length})</option>
                  {kelasList.map((k) => (
                    <option key={k.id} value={k.nama_kelas}>
                      Kelas {k.nama_kelas}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Status QR */}
              <select
                value={filterQrStatus}
                onChange={(e) => setFilterQrStatus(e.target.value as any)}
                className="px-3 py-2 text-xs border border-slate-200 rounded-xl font-bold bg-white focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="semua">Semua Tipe QR</option>
                <option value="custom">Kode QR String Custom</option>
                <option value="image">Gambar Upload</option>
                <option value="default">Default NIS/NISN</option>
              </select>
            </div>

            {/* Batch Auto Assign */}
            <button
              onClick={handleBatchAutoAssignQr}
              disabled={isSaving}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              title="Otomatis berikan kode QR 'QR-[NIS]' untuk semua siswa yang belum memiliki QR"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${isSaving ? 'animate-spin' : ''}`} />
              <span>Auto-Generate Default QR</span>
            </button>
          </div>

          {/* Student QR Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-3xs font-extrabold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Siswa</th>
                    <th className="py-3 px-4">Kelas</th>
                    <th className="py-3 px-4">Kode QR Code</th>
                    <th className="py-3 px-4">Status / Tipe</th>
                    <th className="py-3 px-4 text-center">Visual QR Code</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredSiswa.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <QrCode className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                        <p className="font-bold">Tidak ada data siswa ditemukan</p>
                        <p className="text-3xs">Coba ubah kata kunci pencarian atau filter kelas.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredSiswa.map((s) => {
                      const isCustomText = Boolean(s.qr_code && !s.qr_image_url);
                      const isCustomImage = Boolean(s.qr_image_url);

                      return (
                        <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{s.nama}</div>
                            <div className="text-3xs text-slate-500">
                              NIS: <span className="font-mono font-bold text-slate-700">{s.nis}</span> • NISN:{' '}
                              <span className="font-mono">{s.nisn || '-'}</span>
                            </div>
                          </td>

                          <td className="py-3 px-4 font-bold text-slate-700">
                            Kelas {s.kelas}
                          </td>

                          <td className="py-3 px-4 font-mono font-extrabold">
                            {s.qr_code ? (
                              <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-900 rounded-lg text-2xs">
                                {s.qr_code}
                              </span>
                            ) : s.qr_image_url ? (
                              <span className="px-2.5 py-1 bg-sky-50 border border-sky-200 text-sky-800 rounded-lg text-3xs font-sans font-bold">
                                File Gambar Upload
                              </span>
                            ) : (
                              <span className="text-slate-400 font-sans text-3xs italic">
                                Default (NIS: {s.nis})
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            {isCustomImage ? (
                              <span className="px-2 py-0.5 rounded-full text-3xs font-extrabold bg-sky-100 text-sky-800 border border-sky-200 flex items-center gap-1 w-fit">
                                <FileImage className="w-3 h-3" />
                                Gambar Upload
                              </span>
                            ) : isCustomText ? (
                              <span className="px-2 py-0.5 rounded-full text-3xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 w-fit">
                                <Sparkles className="w-3 h-3" />
                                Kode Custom
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-3xs font-extrabold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1 w-fit">
                                <Layers className="w-3 h-3" />
                                Standard NIS
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-center">
                            <div className="flex justify-center">
                              <StudentQRThumbnail siswa={s} size={48} />
                            </div>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => {
                                  setDisplaySiswa(s);
                                  setIsDisplayModalOpen(true);
                                }}
                                title="Lihat / Cetak Kartu QR"
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleOpenEditModal(s)}
                                title="Edit Kode / Upload Gambar QR"
                                className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors cursor-pointer font-bold text-3xs flex items-center gap-1 px-2"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>

                              {(s.qr_code || s.qr_image_url) && (
                                <button
                                  onClick={() => handleResetStudentQr(s)}
                                  title="Reset ke Default NIS"
                                  className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: QRIS / REKENING SEKOLAH ================= */}
      {activeTab === 'qris' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs max-w-3xl space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              <span>QRIS & Rekening Bank Penampung Tabungan</span>
            </h2>
            <p className="text-xs text-slate-500">
              Pengaturan QRIS ini digunakan ketika guru/petugas atau orang tua ingin melakukan transfer setoran
              tabungan sekolah langsung via bank/e-wallet.
            </p>
          </div>

          <form onSubmit={handleSaveSchoolQris} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-2xs font-extrabold uppercase text-slate-500 mb-1">
                  Nama Bank / Penyedia QRIS
                </label>
                <input
                  type="text"
                  value={qrisBank}
                  onChange={(e) => setQrisBank(e.target.value)}
                  placeholder="Misal: Bank Jateng / BRI / QRIS Nasional"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-2xs font-extrabold uppercase text-slate-500 mb-1">
                  Nomor Rekening / Merchant ID
                </label>
                <input
                  type="text"
                  value={qrisNorek}
                  onChange={(e) => setQrisNorek(e.target.value)}
                  placeholder="Misal: 1029-3849-5028"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-2xs font-extrabold uppercase text-slate-500 mb-1">
                Atas Nama / Merchant Name
              </label>
              <input
                type="text"
                value={qrisAtasNama}
                onChange={(e) => setQrisAtasNama(e.target.value)}
                placeholder={`Misal: KAS TABUNGAN ${settings.nama_sekolah}`}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold"
                required
              />
            </div>

            {/* QRIS Upload / Raw Code */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <span className="block text-xs font-black text-slate-800">
                File Gambar QRIS / Barcode Pembayaran:
              </span>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                {qrisImageBase64 ? (
                  <div className="relative group shrink-0">
                    <img
                      src={qrisImageBase64}
                      alt="QRIS Sekolah"
                      className="w-32 h-32 object-contain bg-white p-2 rounded-xl border border-slate-300 shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setQrisImageBase64('')}
                      className="absolute -top-2 -right-2 p-1 bg-rose-600 text-white rounded-full shadow-md hover:bg-rose-700 cursor-pointer"
                      title="Hapus Gambar QRIS"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-32 bg-white rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center p-2 text-center text-slate-400 shrink-0">
                    <Upload className="w-6 h-6 mb-1 text-slate-300" />
                    <span className="text-3xs font-bold">Belum Ada Gambar</span>
                  </div>
                )}

                <div className="flex-1 space-y-2">
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-2xs transition-colors">
                    <Upload className="w-4 h-4" />
                    <span>Upload File QRIS (PNG/JPG)</span>
                    <input type="file" accept="image/*" onChange={handleQrisImageUpload} className="hidden" />
                  </label>
                  <p className="text-3xs text-slate-500">
                    Unggah gambar QRIS asli dari bank agar pengguna tinggal scan saat melakukan transfer.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-2xs font-extrabold uppercase text-slate-500 mb-1">
                Kode Raw Payloads QRIS (Opsional)
              </label>
              <textarea
                value={qrisPayload}
                onChange={(e) => setQrisPayload(e.target.value)}
                rows={2}
                placeholder="String EMVCo QRIS..."
                className="w-full px-3 py-2 text-3xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? 'Menyimpan...' : 'Simpan Pengaturan QRIS Sekolah'}</span>
            </button>
          </form>
        </div>
      )}

      {/* ================= MODAL: EDIT / TAMBAH QR SISWA ================= */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-scaleIn">
            <div className="bg-slate-900 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold">
                  {selectedSiswa ? `Set QR Code: ${selectedSiswa.nama}` : 'Tambah / Set QR Code Siswa'}
                </h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudentQr} className="p-5 space-y-4 text-xs">
              {/* Select Student if not specified */}
              {!selectedSiswa && (
                <div>
                  <label className="block text-2xs font-extrabold uppercase text-slate-500 mb-1">Pilih Siswa:</label>
                  <select
                    value={inputStudentId}
                    onChange={(e) => {
                      setInputStudentId(e.target.value);
                      const s = siswaList.find((item) => item.id === e.target.value);
                      if (s) {
                        setCustomQrCodeInput(s.qr_code || `QR-${s.nis}`);
                        if (s.qr_image_url) setUploadedQrImageUrl(s.qr_image_url);
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold bg-white"
                  >
                    {siswaList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nama} - Kelas {s.kelas} (NIS: {s.nis})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Mode Selection */}
              <div>
                <label className="block text-2xs font-extrabold uppercase text-slate-500 mb-1.5">
                  Tipe / Sumber QR Code:
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setQrTypeMode('text')}
                    className={`py-1.5 px-2 rounded-lg text-3xs font-extrabold transition-all cursor-pointer ${
                      qrTypeMode === 'text' ? 'bg-white text-indigo-900 shadow-2xs font-black' : 'text-slate-600'
                    }`}
                  >
                    Kode Custom (Text)
                  </button>
                  <button
                    type="button"
                    onClick={() => setQrTypeMode('image')}
                    className={`py-1.5 px-2 rounded-lg text-3xs font-extrabold transition-all cursor-pointer ${
                      qrTypeMode === 'image' ? 'bg-white text-indigo-900 shadow-2xs font-black' : 'text-slate-600'
                    }`}
                  >
                    Upload Gambar
                  </button>
                  <button
                    type="button"
                    onClick={() => setQrTypeMode('default')}
                    className={`py-1.5 px-2 rounded-lg text-3xs font-extrabold transition-all cursor-pointer ${
                      qrTypeMode === 'default' ? 'bg-white text-indigo-900 shadow-2xs font-black' : 'text-slate-600'
                    }`}
                  >
                    Standard NIS
                  </button>
                </div>
              </div>

              {/* Mode 1: Custom Text Input */}
              {qrTypeMode === 'text' && (
                <div>
                  <label className="block text-2xs font-extrabold uppercase text-slate-500 mb-1">
                    Masukkan Kode QR / Barcode Kartu Fisik:
                  </label>
                  <input
                    type="text"
                    value={customQrCodeInput}
                    onChange={(e) => setCustomQrCodeInput(e.target.value)}
                    placeholder="Misal: QR-2026-0012 atau Serial Barcode Kartu"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                    required
                  />
                  <p className="text-3xs text-slate-500 mt-1">
                    Ketik string/kode yang tercetak pada kartu fisik Anda. Scanner akan otomatis mengenali kode ini.
                  </p>
                </div>
              )}

              {/* Mode 2: Image Upload */}
              {qrTypeMode === 'image' && (
                <div className="space-y-2">
                  <label className="block text-2xs font-extrabold uppercase text-slate-500 mb-1">
                    Upload File Gambar QR Code Siswa:
                  </label>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    {uploadedQrImageUrl ? (
                      <div className="relative group shrink-0">
                        <img
                          src={uploadedQrImageUrl}
                          alt="Uploaded QR"
                          className="w-20 h-20 object-contain bg-white p-1 rounded-lg border border-slate-300"
                        />
                        <button
                          type="button"
                          onClick={() => setUploadedQrImageUrl('')}
                          className="absolute -top-1.5 -right-1.5 p-0.5 bg-rose-600 text-white rounded-full shadow-xs hover:bg-rose-700 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-20 h-20 bg-white rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-300 shrink-0">
                        <Upload className="w-6 h-6" />
                      </div>
                    )}

                    <div className="flex-1 space-y-1">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-3xs font-bold rounded-lg cursor-pointer hover:bg-slate-800 transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Pilih File Gambar</span>
                        <input type="file" accept="image/*" onChange={handleStudentImageUpload} className="hidden" />
                      </label>
                      <p className="text-3xs text-slate-500">Mendukung format PNG / JPG (Maks. 2MB).</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Mode 3: Default NIS Info */}
              {qrTypeMode === 'default' && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-3xs space-y-1">
                  <div className="font-bold">Menggunakan QR Code Standar NIS/NISN</div>
                  <p>QR Code akan dibuat secara otomatis dari data NIS/NISN bawaan siswa.</p>
                </div>
              )}

              {/* Live Preview Canvas / Image Box */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                <span className="block text-3xs font-extrabold uppercase text-slate-400 mb-2">Pratinjau QR Code</span>
                <div className="flex justify-center">
                  {qrTypeMode === 'image' && uploadedQrImageUrl ? (
                    <img
                      src={uploadedQrImageUrl}
                      alt="Preview"
                      className="w-32 h-32 object-contain bg-white p-1 rounded-xl border border-slate-200 shadow-2xs"
                    />
                  ) : (
                    <canvas
                      ref={(ref) => setModalPreviewCanvasRef(ref)}
                      className="rounded-xl border border-slate-200 bg-white shadow-2xs"
                    />
                  )}
                </div>
              </div>

              {/* Action Submit */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSaving ? 'Menyimpan...' : 'Simpan Kode QR'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: DISPLAY FULL QR CARD ================= */}
      {isDisplayModalOpen && displaySiswa && (
        <QRCodeDisplayModal
          isOpen={isDisplayModalOpen}
          onClose={() => {
            setIsDisplayModalOpen(false);
            setDisplaySiswa(null);
          }}
          siswa={displaySiswa}
          settings={settings}
        />
      )}
    </div>
  );
};
