import React, { useState } from 'react';
import { Kelas, Siswa } from '../types';
import { StorageService, isSameKelas } from '../services/storage';
import { Building2, Plus, Edit2, Trash2, Users, X } from 'lucide-react';

interface KelasManagerProps {
  kelasList: Kelas[];
  siswaList: Siswa[];
  onRefreshData: () => void;
}

export const KelasManager: React.FC<KelasManagerProps> = ({
  kelasList,
  siswaList,
  onRefreshData,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingKelas, setEditingKelas] = useState<Kelas | null>(null);
  const [namaKelas, setNamaKelas] = useState('');
  const [waliKelas, setWaliKelas] = useState('');

  const openAddModal = () => {
    setEditingKelas(null);
    setNamaKelas('');
    setWaliKelas('');
    setShowModal(true);
  };

  const openEditModal = (k: Kelas) => {
    setEditingKelas(k);
    setNamaKelas(k.nama_kelas);
    setWaliKelas(k.wali_kelas);
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingKelas) {
      const updated = kelasList.map((k) =>
        k.id === editingKelas.id ? { ...k, nama_kelas: namaKelas, wali_kelas: waliKelas } : k
      );
      StorageService.saveKelas(updated);
    } else {
      const newK: Kelas = {
        id: `K${Date.now()}`,
        nama_kelas: namaKelas,
        wali_kelas: waliKelas,
      };
      StorageService.saveKelas([...kelasList, newK]);
    }
    onRefreshData();
    setShowModal(false);
  };

  const handleDelete = (id: string, nama: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus data Kelas ${nama}?`)) {
      const updated = kelasList.filter((k) => k.id !== id);
      StorageService.saveKelas(updated);
      onRefreshData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-emerald-600" />
            <span>Kelola Data Kelas & Wali Kelas</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Daftar rombel kelas dan pengampu wali kelas.</p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Kelas Baru</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kelasList.map((k) => {
          const studentCount = siswaList.filter((s) => isSameKelas(s.kelas, k.nama_kelas)).length;
          const totalClassSaldo = siswaList
            .filter((s) => isSameKelas(s.kelas, k.nama_kelas))
            .reduce((sum, s) => sum + s.saldo, 0);

          return (
            <div key={k.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-2xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                    Rombel {k.nama_kelas}
                  </span>
                  <h3 className="text-lg font-black text-slate-900 mt-2">Kelas {k.nama_kelas}</h3>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEditModal(k)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(k.id, k.nama_kelas)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="text-xs space-y-1 pt-2 border-t border-slate-100">
                <div className="flex justify-between text-slate-600">
                  <span>Wali Kelas:</span>
                  <strong className="text-slate-900">{k.wali_kelas}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Jumlah Siswa:</span>
                  <strong className="text-slate-900">{studentCount} Murid</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Total Tabungan:</span>
                  <strong className="text-emerald-700 font-black">
                    Rp {totalClassSaldo.toLocaleString('id-ID')}
                  </strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-extrabold text-slate-900">
                {editingKelas ? 'Edit Data Kelas' : 'Tambah Kelas Baru'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Kelas (Contoh: 1-A)</label>
                <input
                  type="text"
                  value={namaKelas}
                  onChange={(e) => setNamaKelas(e.target.value)}
                  required
                  placeholder="1-A"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Wali Kelas</label>
                <input
                  type="text"
                  value={waliKelas}
                  onChange={(e) => setWaliKelas(e.target.value)}
                  required
                  placeholder="Nama Lengkap & Gelar S.Pd."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 text-xs font-bold border border-slate-200 rounded-xl hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer"
                >
                  Simpan Kelas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
