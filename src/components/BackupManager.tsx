import React, { useState } from 'react';
import { BackupRecord, Siswa, Transaksi } from '../types';
import { StorageService } from '../services/storage';
import { Archive, Download, RefreshCw, CheckCircle2, CloudUpload } from 'lucide-react';

interface BackupManagerProps {
  siswaList: Siswa[];
  transaksiList: Transaksi[];
  backupsList: BackupRecord[];
  onRefreshData: () => void;
}

export const BackupManager: React.FC<BackupManagerProps> = ({
  siswaList,
  transaksiList,
  backupsList,
  onRefreshData,
}) => {
  const [msg, setMsg] = useState('');

  const handleCreateBackup = () => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const totalSaldo = siswaList.reduce((sum, s) => sum + s.saldo, 0);

    const newBackup: BackupRecord = {
      id: `BAK-${Date.now()}`,
      tanggal: todayStr,
      jam: now.toTimeString().split(' ')[0],
      jumlah_siswa: siswaList.length,
      jumlah_transaksi: transaksiList.length,
      total_saldo: totalSaldo,
      file_name: `TABSIS_Backup_${todayStr.replace(/-/g, '')}.json`,
      status: 'Success',
    };

    StorageService.saveBackups([newBackup, ...backupsList]);

    // Download JSON dump
    const dataDump = {
      settings: StorageService.getSettings(),
      siswa: siswaList,
      transaksi: transaksiList,
      kelas: StorageService.getKelas(),
      users: StorageService.getUsers(),
      backupTime: now.toISOString(),
    };

    const element = document.createElement('a');
    const file = new Blob([JSON.stringify(dataDump, null, 2)], { type: 'application/json' });
    element.href = URL.createObjectURL(file);
    element.download = newBackup.file_name;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    onRefreshData();
    setMsg('Backup otomatis berhasil dibuat dan diunduh ke komputer Anda!');
    setTimeout(() => setMsg(''), 4000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Archive className="w-6 h-6 text-emerald-600" />
            <span>Backup & Restore Google Spreadsheet (BACKUP Sheet)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pencadangan berkala database tabungan siswa ke Google Drive & unduhan file lokal.
          </p>
        </div>

        <button
          onClick={handleCreateBackup}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
        >
          <CloudUpload className="w-4 h-4" />
          <span>Buat Backup Baru</span>
        </button>
      </div>

      {msg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>{msg}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700">
          Histori Riwayat Backup (BACKUP Sheet)
        </div>

        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
              <th className="p-3">ID Backup</th>
              <th className="p-3">Waktu Backup</th>
              <th className="p-3">Jumlah Siswa</th>
              <th className="p-3">Total Transaksi</th>
              <th className="p-3">Total Saldo Ter-backup</th>
              <th className="p-3">Nama File Backup</th>
              <th className="p-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {backupsList.map((b) => (
              <tr key={b.id} className="hover:bg-slate-50 font-mono">
                <td className="p-3 font-bold text-slate-800">{b.id}</td>
                <td className="p-3 font-sans">
                  {b.tanggal} {b.jam}
                </td>
                <td className="p-3 font-sans">{b.jumlah_siswa} Siswa</td>
                <td className="p-3 font-sans">{b.jumlah_transaksi} TRX</td>
                <td className="p-3 font-sans font-bold text-emerald-700">
                  Rp {b.total_saldo.toLocaleString('id-ID')}
                </td>
                <td className="p-3 font-sans font-semibold text-slate-700">{b.file_name}</td>
                <td className="p-3 text-center">
                  <span className="bg-emerald-100 text-emerald-800 font-bold text-3xs px-2.5 py-0.5 rounded-full font-sans">
                    {b.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
