import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  X,
  HelpCircle,
  RefreshCw,
  Info,
  Check,
  Table,
} from 'lucide-react';
import { Siswa, Kelas, User } from '../types';
import {
  downloadSiswaTemplateXls,
  downloadSiswaTemplateCsv,
  exportSiswaToExcel,
  exportSiswaToCsv,
  parseSiswaCsvContent,
  ParsedSiswaRow,
} from '../utils/csvHelper';
import { StorageService } from '../services/storage';
import { FirestoreService } from '../services/firestoreService';

interface SiswaImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  siswaList: Siswa[];
  kelasList: Kelas[];
  activeUser: User;
  onRefreshData: () => void;
}

export const SiswaImportExportModal: React.FC<SiswaImportExportModalProps> = ({
  isOpen,
  onClose,
  siswaList,
  kelasList,
  activeUser,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');

  // Import Mode / State
  const [importMode, setImportMode] = useState<'upsert' | 'skip_existing'>('upsert');
  const [pasteContent, setPasteContent] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedSiswaRow[]>([]);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');

  if (!isOpen) return null;

  // Handle File Input Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    setIsProcessingFile(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = (event.target?.result as string) || '';
      const rows = parseSiswaCsvContent(content, siswaList, kelasList);
      setParsedRows(rows);
      setIsProcessingFile(false);
    };
    reader.onerror = () => {
      alert('Gagal membaca file CSV/Excel.');
      setIsProcessingFile(false);
    };
    reader.readAsText(file);
  };

  // Handle Pasted Raw Text Parse
  const handleParsePastedText = () => {
    if (!pasteContent.trim()) {
      alert('Silakan tempelkan (paste) teks data siswa terlebih dahulu!');
      return;
    }
    const rows = parseSiswaCsvContent(pasteContent, siswaList, kelasList);
    setParsedRows(rows);
    setSelectedFileName('Teks Ditempel (Copy-Paste)');
  };

  // Perform Final Batch Import
  const handleExecuteImport = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      alert('Tidak ada data siswa yang valid untuk diimpor. Periksa kembali kolom file Anda.');
      return;
    }

    setIsSaving(true);
    try {
      const existingMap = new Map<string, Siswa>(siswaList.map((s) => [s.nis, s]));
      const updatedSiswaList = [...siswaList];
      let newAddedCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;

      for (const row of validRows) {
        const existingSiswa = existingMap.get(row.nis);

        if (existingSiswa) {
          if (importMode === 'skip_existing') {
            skippedCount++;
            continue;
          }

          // Update existing
          const updatedObj: Siswa = {
            ...existingSiswa,
            nisn: row.nisn || existingSiswa.nisn,
            nama: row.nama,
            jenis_kelamin: row.jenis_kelamin,
            kelas: row.kelas,
            wali_kelas: row.wali_kelas || existingSiswa.wali_kelas,
            orang_tua: row.orang_tua || existingSiswa.orang_tua,
            telepon: row.telepon || existingSiswa.telepon,
            status: row.status,
            // Keep existing balance if row saldo is 0 and existing > 0, else update if specified
            saldo: row.saldo > 0 ? row.saldo : existingSiswa.saldo,
          };

          const idx = updatedSiswaList.findIndex((s) => s.id === existingSiswa.id);
          if (idx !== -1) {
            updatedSiswaList[idx] = updatedObj;
          }
          await FirestoreService.saveSiswaItem(updatedObj);
          updatedCount++;
        } else {
          // Create new student
          const newSiswaObj: Siswa = {
            id: `SIS-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            nis: row.nis,
            nisn: row.nisn,
            nama: row.nama,
            jenis_kelamin: row.jenis_kelamin,
            kelas: row.kelas,
            wali_kelas: row.wali_kelas,
            orang_tua: row.orang_tua,
            telepon: row.telepon,
            saldo: row.saldo,
            status: row.status,
            tanggal_daftar: new Date().toISOString().split('T')[0],
          };

          updatedSiswaList.push(newSiswaObj);
          existingMap.set(row.nis, newSiswaObj);
          await FirestoreService.saveSiswaItem(newSiswaObj);
          newAddedCount++;
        }
      }

      // Save to localStorage
      StorageService.saveSiswa(updatedSiswaList);
      await FirestoreService.addLog(
        activeUser.nama || activeUser.username,
        `Impor Siswa Massal: ${newAddedCount} baru ditambahkan, ${updatedCount} diperbarui, ${skippedCount} dilewati`
      );

      setSuccessMessage(
        `Berhasil mengimpor! ${newAddedCount} siswa baru ditambahkan, ${updatedCount} siswa diperbarui.`
      );
      onRefreshData();

      setTimeout(() => {
        setSuccessMessage('');
        setParsedRows([]);
        setSelectedFileName('');
        setPasteContent('');
        onClose();
      }, 2500);
    } catch (error) {
      console.error('Error importing siswa:', error);
      alert('Terjadi kesalahan saat menyimpan data impor. Pastikan koneksi internet lancar.');
    } finally {
      setIsSaving(false);
    }
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.filter((r) => !r.isValid).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-auto animate-scaleIn">
        {/* Header Modal */}
        <div className="bg-slate-900 p-4 sm:p-5 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-emerald-600/40 rounded-xl text-emerald-400 border border-emerald-500/30">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-black tracking-tight">Eksport & Impor Data Siswa</h3>
              <p className="text-3xs text-slate-300">
                Kelola data murid sekaligus dalam jumlah banyak via file Excel / CSV.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50 px-5 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('import')}
            className={`px-4 py-2.5 text-xs font-extrabold rounded-t-xl transition-all flex items-center gap-2 cursor-pointer border-b-2 ${
              activeTab === 'import'
                ? 'bg-white text-emerald-800 border-emerald-600 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 border-transparent'
            }`}
          >
            <Upload className="w-4 h-4 text-emerald-600" />
            <span>Impor Data Siswa</span>
          </button>

          <button
            onClick={() => setActiveTab('export')}
            className={`px-4 py-2.5 text-xs font-extrabold rounded-t-xl transition-all flex items-center gap-2 cursor-pointer border-b-2 ${
              activeTab === 'export'
                ? 'bg-white text-indigo-800 border-indigo-600 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 border-transparent'
            }`}
          >
            <Download className="w-4 h-4 text-indigo-600" />
            <span>Eksport Data Siswa</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 max-h-[75vh] overflow-y-auto space-y-5">
          {/* Success Message Banner */}
          {successMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="text-xs font-extrabold">{successMessage}</span>
            </div>
          )}

          {/* ================= TAB IMPOR ================= */}
          {activeTab === 'import' && (
            <div className="space-y-5">
              {/* Step 1: Format & Template Guide */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-extrabold text-slate-900">Format File Yang Didukung</h4>
                    <p className="text-3xs text-slate-500 mt-0.5">
                      Gunakan file CSV atau copy-paste tabel Excel dengan kolom: <b>NIS, NISN, Nama Lengkap, Jenis Kelamin (L/P), Kelas, Wali Kelas, Orang Tua, Telepon, Saldo Awal, Status</b>.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={downloadSiswaTemplateXls}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-3xs rounded-xl shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Unduh Template Excel (.xls)</span>
                  </button>

                  <button
                    onClick={downloadSiswaTemplateCsv}
                    className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 font-extrabold text-3xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Unduh Template CSV (.csv)</span>
                  </button>
                </div>
              </div>

              {/* Upload or Paste Area */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Upload File */}
                <div className="p-5 border-2 border-dashed border-slate-300 rounded-2xl hover:border-emerald-500 bg-white transition-all text-center flex flex-col items-center justify-center">
                  <Upload className="w-8 h-8 text-emerald-600 mb-2" />
                  <span className="text-xs font-black text-slate-800">Unggah File CSV / Spreadsheet</span>
                  <span className="text-3xs text-slate-400 mt-1 mb-3">
                    Pilih file .csv, .txt dari komputer Anda
                  </span>

                  <label className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors inline-flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Pilih File CSV</span>
                    <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
                  </label>

                  {selectedFileName && (
                    <span className="mt-2 text-3xs font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      📄 {selectedFileName}
                    </span>
                  )}
                </div>

                {/* Paste Direct Text */}
                <div className="p-4 border border-slate-200 rounded-2xl bg-white flex flex-col space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <Table className="w-4 h-4 text-indigo-600" />
                      <span>Atau Copy-Paste Langsung Dari Excel</span>
                    </span>
                  </div>

                  <textarea
                    value={pasteContent}
                    onChange={(e) => setPasteContent(e.target.value)}
                    rows={3}
                    placeholder="Salin baris dari Excel / Google Sheets lalu tempelkan di sini..."
                    className="w-full p-2.5 text-3xs font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />

                  <button
                    onClick={handleParsePastedText}
                    className="py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-3xs rounded-xl transition-colors cursor-pointer self-end px-3"
                  >
                    Proses Teks
                  </button>
                </div>
              </div>

              {/* Import Rules Radio */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <span className="block text-3xs font-black uppercase text-slate-500 tracking-wider">
                  Aturan Penanganan Jika NIS Sudah Ada:
                </span>
                <div className="flex flex-wrap items-center gap-4 text-xs font-bold">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-800">
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'upsert'}
                      onChange={() => setImportMode('upsert')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Perbarui Data Jika NIS Sudah Ada (Rekomendasi)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-800">
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'skip_existing'}
                      onChange={() => setImportMode('skip_existing')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Lewati (Hanya Tambahkan NIS Baru)</span>
                  </label>
                </div>
              </div>

              {/* Preview Table parsed rows */}
              {parsedRows.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900">
                        Hasil Pratinjau Data Impor ({parsedRows.length} Baris)
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-3xs font-bold rounded-full">
                        {validCount} Valid
                      </span>
                      {invalidCount > 0 && (
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-3xs font-bold rounded-full">
                          {invalidCount} Bermasalah
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => setParsedRows([])}
                      className="text-3xs text-slate-500 hover:text-slate-800 font-bold"
                    >
                      Bersihkan Tabel
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-3xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-600 font-extrabold border-b border-slate-200 sticky top-0">
                          <th className="p-2">Status</th>
                          <th className="p-2">NIS</th>
                          <th className="p-2">NISN</th>
                          <th className="p-2">Nama Siswa</th>
                          <th className="p-2">L/P</th>
                          <th className="p-2">Kelas</th>
                          <th className="p-2">Orang Tua</th>
                          <th className="p-2">No HP</th>
                          <th className="p-2 text-right">Saldo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedRows.map((r, idx) => (
                          <tr
                            key={idx}
                            className={r.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/60 text-rose-900'}
                          >
                            <td className="p-2">
                              {r.isValid ? (
                                <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                                  <Check className="w-3.5 h-3.5" /> Valid
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-rose-700 font-bold" title={r.errors.join(', ')}>
                                  <AlertTriangle className="w-3.5 h-3.5" /> {r.errors[0]}
                                </span>
                              )}
                            </td>
                            <td className="p-2 font-mono font-bold">{r.nis}</td>
                            <td className="p-2 font-mono">{r.nisn || '-'}</td>
                            <td className="p-2 font-bold text-slate-900">{r.nama}</td>
                            <td className="p-2 font-bold">{r.jenis_kelamin}</td>
                            <td className="p-2 font-bold">{r.kelas}</td>
                            <td className="p-2">{r.orang_tua}</td>
                            <td className="p-2">{r.telepon}</td>
                            <td className="p-2 text-right font-black text-emerald-700">
                              Rp {r.saldo.toLocaleString('id-ID')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Save Execute Button */}
                  <div className="pt-2">
                    <button
                      onClick={handleExecuteImport}
                      disabled={isSaving || validCount === 0}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {isSaving
                          ? 'Sedang Mengimpor Data Ke Sistem...'
                          : `Simpan & Impor ${validCount} Data Siswa Valid`}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= TAB EKSPORT ================= */}
          {activeTab === 'export' && (
            <div className="space-y-5">
              <div className="p-5 bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-2xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-600/50 rounded-xl text-amber-300">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black">Eksport Seluruh Data Siswa</h4>
                    <p className="text-3xs text-slate-300">
                      Unduh seluruh record siswa tabungan beserta NISN, kelas, nomor kontak orang tua, dan saldo terkini.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-indigo-800/60">
                  <span className="text-xs font-bold text-indigo-200">
                    Total Murid Terdaftar: <b>{siswaList.length} Siswa</b>
                  </span>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => exportSiswaToExcel(siswaList)}
                      className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>Download Format Excel (.xls)</span>
                    </button>

                    <button
                      onClick={() => exportSiswaToCsv(siswaList)}
                      className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Format CSV (.csv)</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
