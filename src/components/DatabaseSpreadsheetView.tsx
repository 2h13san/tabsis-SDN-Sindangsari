import React, { useState } from 'react';
import { AppSettings, User, Siswa, Transaksi, Kelas, LogAktivitas, BackupRecord } from '../types';
import { generateGoogleAppsScriptCode, StorageService } from '../services/storage';
import {
  Database,
  Table,
  Code2,
  Copy,
  Check,
  Download,
  RefreshCw,
  FileSpreadsheet,
  Layers,
  Sparkles,
} from 'lucide-react';

interface DatabaseSpreadsheetViewProps {
  settings: AppSettings;
  usersList: User[];
  siswaList: Siswa[];
  transaksiList: Transaksi[];
  kelasList: Kelas[];
  logsList: LogAktivitas[];
  backupsList: BackupRecord[];
  onRefreshData: () => void;
}

export const DatabaseSpreadsheetView: React.FC<DatabaseSpreadsheetViewProps> = ({
  settings,
  usersList,
  siswaList,
  transaksiList,
  kelasList,
  logsList,
  backupsList,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<'inspector' | 'gas_code'>('inspector');
  const [selectedSheet, setSelectedSheet] = useState<
    'SETTINGS' | 'USERS' | 'SISWA' | 'TRANSAKSI' | 'KELAS' | 'LOG' | 'BACKUP'
  >('SISWA');

  const [copiedGs, setCopiedGs] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);

  const gasCodeObj = generateGoogleAppsScriptCode(settings);

  const handleCopy = (text: string, type: 'gs' | 'html') => {
    navigator.clipboard.writeText(text);
    if (type === 'gs') {
      setCopiedGs(true);
      setTimeout(() => setCopiedGs(false), 2000);
    } else {
      setCopiedHtml(true);
      setTimeout(() => setCopiedHtml(false), 2000);
    }
  };

  const handleDownloadGasFile = (content: string, filename: string) => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleResetDatabase = () => {
    if (
      confirm(
        'APAKAH ANDA YAKIN INGIN MERESET DATABASE? Semua data lokal akan dikembalikan ke data awal sampel sekolah.'
      )
    ) {
      StorageService.resetToDefault();
      onRefreshData();
      alert('Database Google Spreadsheet berhasil di-reset ke data default.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Database className="w-6 h-6 text-emerald-600" />
            <span>Firebase Firestore Database Inspector</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Inspektur Data Collection Realtime di Google Firebase Cloud Firestore.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveTab('inspector')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'inspector'
                ? 'bg-white text-emerald-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>Grid Inspector Sheet</span>
          </button>
          <button
            onClick={() => setActiveTab('gas_code')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'gas_code'
                ? 'bg-white text-emerald-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Export Code.gs & HTML</span>
          </button>
        </div>
      </div>

      {activeTab === 'inspector' ? (
        <div className="space-y-4">
          {/* Sheet/Collection Selector Pills */}
          <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
            {(
              ['SETTINGS', 'USERS', 'SISWA', 'TRANSAKSI', 'KELAS', 'LOG', 'BACKUP'] as const
            ).map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSheet(s)}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedSheet === s
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Collection: {s.toLowerCase()}</span>
              </button>
            ))}

            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={handleResetDatabase}
                className="px-3 py-1.5 text-2xs font-bold bg-rose-50 text-rose-700 border border-rose-200 rounded-xl hover:bg-rose-100 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset Sample Data</span>
              </button>
            </div>
          </div>

          {/* Grid View Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-3 bg-emerald-50 border-b border-emerald-100 text-2xs font-bold text-emerald-800 uppercase flex justify-between items-center">
              <span>View Data Live Collection Firestore: /{selectedSheet.toLowerCase()}</span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Firebase Realtime Active
              </span>
            </div>

            <div className="overflow-x-auto">
              {selectedSheet === 'SETTINGS' && (
                <div className="p-6 grid grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 font-bold block text-2xs">Nama Sekolah</span>
                    <p className="font-bold text-slate-900">{settings.nama_sekolah}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 font-bold block text-2xs">NPSN</span>
                    <p className="font-bold text-slate-900">{settings.npsn}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 font-bold block text-2xs">Kepala Sekolah</span>
                    <p className="font-bold text-slate-900">{settings.kepala_sekolah}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 font-bold block text-2xs">Bendahara</span>
                    <p className="font-bold text-slate-900">{settings.bendahara}</p>
                  </div>
                </div>
              )}

              {selectedSheet === 'USERS' && (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 font-bold text-slate-600">
                      <th className="p-3">id</th>
                      <th className="p-3">username</th>
                      <th className="p-3">nama</th>
                      <th className="p-3">role</th>
                      <th className="p-3">kelas</th>
                      <th className="p-3">status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {usersList.map((u) => (
                      <tr key={u.id}>
                        <td className="p-3">{u.id}</td>
                        <td className="p-3 font-bold">{u.username}</td>
                        <td className="p-3 font-sans font-bold">{u.nama}</td>
                        <td className="p-3">{u.role}</td>
                        <td className="p-3">{u.kelas || '-'}</td>
                        <td className="p-3">{u.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {selectedSheet === 'SISWA' && (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 font-bold text-slate-600">
                      <th className="p-3">id</th>
                      <th className="p-3">nis</th>
                      <th className="p-3">nisn</th>
                      <th className="p-3">nama</th>
                      <th className="p-3">jenis_kelamin</th>
                      <th className="p-3">kelas</th>
                      <th className="p-3">wali_kelas</th>
                      <th className="p-3">orang_tua</th>
                      <th className="p-3 text-right">saldo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {siswaList.map((s) => (
                      <tr key={s.id}>
                        <td className="p-3">{s.id}</td>
                        <td className="p-3 font-bold">{s.nis}</td>
                        <td className="p-3">{s.nisn}</td>
                        <td className="p-3 font-sans font-bold">{s.nama}</td>
                        <td className="p-3">{s.jenis_kelamin}</td>
                        <td className="p-3">{s.kelas}</td>
                        <td className="p-3 font-sans">{s.wali_kelas}</td>
                        <td className="p-3 font-sans">{s.orang_tua}</td>
                        <td className="p-3 text-right font-bold text-emerald-700">
                          Rp {s.saldo.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {selectedSheet === 'TRANSAKSI' && (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 font-bold text-slate-600">
                      <th className="p-3">id</th>
                      <th className="p-3">tanggal</th>
                      <th className="p-3">nis</th>
                      <th className="p-3">nama</th>
                      <th className="p-3">jenis</th>
                      <th className="p-3 text-right">setoran</th>
                      <th className="p-3 text-right">penarikan</th>
                      <th className="p-3 text-right">saldo</th>
                      <th className="p-3">petugas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {transaksiList.map((t) => (
                      <tr key={t.id}>
                        <td className="p-3 font-bold">{t.id}</td>
                        <td className="p-3">{t.tanggal}</td>
                        <td className="p-3">{t.nis}</td>
                        <td className="p-3 font-sans font-bold">{t.nama}</td>
                        <td className="p-3 uppercase">{t.jenis}</td>
                        <td className="p-3 text-right">{t.setoran || 0}</td>
                        <td className="p-3 text-right">{t.penarikan || 0}</td>
                        <td className="p-3 text-right font-bold">{t.saldo}</td>
                        <td className="p-3 font-sans">{t.petugas}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {selectedSheet === 'KELAS' && (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 font-bold text-slate-600">
                      <th className="p-3">id</th>
                      <th className="p-3">nama_kelas</th>
                      <th className="p-3">wali_kelas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {kelasList.map((k) => (
                      <tr key={k.id}>
                        <td className="p-3">{k.id}</td>
                        <td className="p-3 font-bold">{k.nama_kelas}</td>
                        <td className="p-3 font-sans">{k.wali_kelas}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {selectedSheet === 'LOG' && (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 font-bold text-slate-600">
                      <th className="p-3">id</th>
                      <th className="p-3">tanggal / jam</th>
                      <th className="p-3">user</th>
                      <th className="p-3">aktivitas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {logsList.map((l) => (
                      <tr key={l.id}>
                        <td className="p-3">{l.id}</td>
                        <td className="p-3">
                          {l.tanggal} {l.jam}
                        </td>
                        <td className="p-3 font-bold">{l.user}</td>
                        <td className="p-3 font-sans">{l.aktivitas}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {selectedSheet === 'BACKUP' && (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 font-bold text-slate-600">
                      <th className="p-3">id</th>
                      <th className="p-3">tanggal</th>
                      <th className="p-3">jumlah_siswa</th>
                      <th className="p-3">jumlah_transaksi</th>
                      <th className="p-3">total_saldo</th>
                      <th className="p-3">status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {backupsList.map((b) => (
                      <tr key={b.id}>
                        <td className="p-3">{b.id}</td>
                        <td className="p-3">{b.tanggal}</td>
                        <td className="p-3">{b.jumlah_siswa}</td>
                        <td className="p-3">{b.jumlah_transaksi}</td>
                        <td className="p-3">Rp {b.total_saldo.toLocaleString('id-ID')}</td>
                        <td className="p-3 font-bold text-emerald-700">{b.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* GAS CODE EXPORTER TAB */
        <div className="space-y-6">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 font-medium">
            <h3 className="font-extrabold text-sm mb-1 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Script Google Apps Script Siap Deploy (Code.gs & Index.html)</span>
            </h3>
            <p>
              Salin atau unduh kode di bawah untuk dipasang pada Google Apps Script project Anda. Script ini mengelola
              `SpreadsheetApp`, `DriveApp`, `HtmlService`, serta fungsi `doGet` dan `doPost`.
            </p>
          </div>

          {/* Code.gs Section */}
          <div className="bg-slate-900 rounded-2xl p-6 text-slate-100 space-y-4 font-mono text-xs shadow-md">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 font-sans">
              <div>
                <span className="font-bold text-emerald-400">Code.gs</span>
                <span className="text-3xs text-slate-400 block">Server-side Google Apps Script backend</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleCopy(gasCodeObj.codeGs, 'gs')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  {copiedGs ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedGs ? 'Tersalin!' : 'Salin Code.gs'}</span>
                </button>
                <button
                  onClick={() => handleDownloadGasFile(gasCodeObj.codeGs, 'Code.gs')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Code.gs</span>
                </button>
              </div>
            </div>

            <pre className="max-h-80 overflow-y-auto text-emerald-300/90 text-2xs leading-relaxed p-2">
              {gasCodeObj.codeGs}
            </pre>
          </div>

          {/* Index.html Section */}
          <div className="bg-slate-900 rounded-2xl p-6 text-slate-100 space-y-4 font-mono text-xs shadow-md">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 font-sans">
              <div>
                <span className="font-bold text-emerald-400">Index.html</span>
                <span className="text-3xs text-slate-400 block">Frontend HTML/CSS/JS template for HtmlService</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleCopy(gasCodeObj.indexHtml, 'html')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  {copiedHtml ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedHtml ? 'Tersalin!' : 'Salin Index.html'}</span>
                </button>
                <button
                  onClick={() => handleDownloadGasFile(gasCodeObj.indexHtml, 'Index.html')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Index.html</span>
                </button>
              </div>
            </div>

            <pre className="max-h-60 overflow-y-auto text-amber-200/90 text-2xs leading-relaxed p-2">
              {gasCodeObj.indexHtml}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
