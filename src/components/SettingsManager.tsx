import React, { useState } from 'react';
import { AppSettings } from '../types';
import { StorageService } from '../services/storage';
import { Settings, Save, CheckCircle2, GraduationCap, Building2 } from 'lucide-react';

interface SettingsManagerProps {
  settings: AppSettings;
  onRefreshData: () => void;
}

export const SettingsManager: React.FC<SettingsManagerProps> = ({ settings, onRefreshData }) => {
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.saveSettings(formData);
    onRefreshData();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-emerald-600" />
            <span>Pengaturan Identitas Sekolah (SETTINGS Sheet)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Informasi sekolah yang akan dicetak pada laporan dan buku tabungan fisik.
          </p>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>Pengaturan Sekolah berhasil disimpan!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Nama Sekolah / Madrasah</label>
            <input
              type="text"
              value={formData.nama_sekolah}
              onChange={(e) => setFormData({ ...formData, nama_sekolah: e.target.value })}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">NPSN (Nomor Pokok Sekolah Nasional)</label>
            <input
              type="text"
              value={formData.npsn}
              onChange={(e) => setFormData({ ...formData, npsn: e.target.value })}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">Alamat Lengkap Sekolah</label>
          <input
            type="text"
            value={formData.alamat}
            onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
            required
            className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Nama Kepala Sekolah</label>
            <input
              type="text"
              value={formData.kepala_sekolah}
              onChange={(e) => setFormData({ ...formData, kepala_sekolah: e.target.value })}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">NIP Kepala Sekolah</label>
            <input
              type="text"
              value={formData.nip_kepala_sekolah}
              onChange={(e) => setFormData({ ...formData, nip_kepala_sekolah: e.target.value })}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Nama Bendahara Sekolah</label>
            <input
              type="text"
              value={formData.bendahara}
              onChange={(e) => setFormData({ ...formData, bendahara: e.target.value })}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">NIP Bendahara Sekolah</label>
            <input
              type="text"
              value={formData.nip_bendahara}
              onChange={(e) => setFormData({ ...formData, nip_bendahara: e.target.value })}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Tahun Ajaran Aktif</label>
            <input
              type="text"
              value={formData.tahun_ajaran}
              onChange={(e) => setFormData({ ...formData, tahun_ajaran: e.target.value })}
              required
              placeholder="2025/2026"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">URL Logo Sekolah (PNG/JPG)</label>
            <input
              type="text"
              value={formData.logo_url}
              onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
              placeholder="https://..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Simpan Seluruh Pengaturan Sekolah</span>
        </button>
      </form>
    </div>
  );
};
