import React, { useState, useEffect } from 'react';
import { Siswa } from '../types';
import { getEffectiveSiswaPin, verifySiswaPin, isCustomPinSet } from '../utils/pinUtils';
import {
  Lock,
  Eye,
  EyeOff,
  X,
  ShieldCheck,
  AlertCircle,
  KeyRound,
  QrCode,
  HelpCircle,
  UserCheck,
  Search,
} from 'lucide-react';

interface SiswaPinPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  siswaList: Siswa[];
  initialSiswa?: Siswa | null;
  fromQrScan?: boolean;
  onSuccess: (siswa: Siswa) => void;
}

export const SiswaPinPromptModal: React.FC<SiswaPinPromptModalProps> = ({
  isOpen,
  onClose,
  siswaList,
  initialSiswa,
  fromQrScan = false,
  onSuccess,
}) => {
  const [selectedSiswaId, setSelectedSiswaId] = useState('');
  const [nisnInput, setNisnInput] = useState('');
  const [selectedSiswa, setSelectedSiswa] = useState<Siswa | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPinInput('');
      setErrorMsg('');
      setShowPin(false);
      setShowHelp(false);

      if (initialSiswa) {
        setSelectedSiswaId(initialSiswa.id);
        setNisnInput(initialSiswa.nisn || initialSiswa.nis);
        setSelectedSiswa(initialSiswa);
      } else {
        setSelectedSiswaId('');
        setNisnInput('');
        setSelectedSiswa(null);
      }
    }
  }, [isOpen, initialSiswa]);

  if (!isOpen) return null;

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedSiswaId(id);
    const found = siswaList.find((s) => s.id === id);
    if (found) {
      setSelectedSiswa(found);
      setNisnInput(found.nisn || found.nis);
    } else {
      setSelectedSiswa(null);
      setNisnInput('');
    }
    setErrorMsg('');
    setPinInput('');
  };

  const handleNisnInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNisnInput(val);
    const clean = val.trim().toLowerCase();

    if (clean) {
      const found = siswaList.find(
        (s) =>
          (s.nisn && s.nisn.toLowerCase() === clean) ||
          (s.nis && s.nis.toLowerCase() === clean)
      );
      if (found) {
        setSelectedSiswaId(found.id);
        setSelectedSiswa(found);
      } else {
        setSelectedSiswaId('');
        setSelectedSiswa(null);
      }
    } else {
      setSelectedSiswaId('');
      setSelectedSiswa(null);
    }
    setErrorMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedSiswa) {
      setErrorMsg('Pilih nama siswa dari daftar terlebih dahulu!');
      return;
    }

    if (!pinInput.trim()) {
      setErrorMsg('Masukkan PIN rahasia terlebih dahulu!');
      return;
    }

    if (verifySiswaPin(selectedSiswa, pinInput)) {
      onSuccess(selectedSiswa);
    } else {
      setErrorMsg('PIN Rahasia salah! Silakan periksa kembali atau tanyakan Wali Kelas.');
    }
  };

  const defaultPin = selectedSiswa ? getEffectiveSiswaPin(selectedSiswa) : '1234';
  const hasCustomPin = selectedSiswa ? isCustomPinSet(selectedSiswa) : false;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-amber-300 border border-white/20">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">Verifikasi PIN Rahasia Siswa</h3>
              <p className="text-2xs text-emerald-100 font-medium">
                Pilih nama siswa dan masukkan PIN untuk mengakses tabungan
              </p>
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-4">
          {/* QR Code Banner Badge */}
          {fromQrScan && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-center gap-2.5 text-emerald-800 text-xs font-bold">
              <QrCode className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Kartu QR Siswa Terdeteksi! Silakan periksa nama & masukkan PIN.</span>
            </div>
          )}

          {/* Student Selector Section */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Pilih Nama Siswa Dari Daftar
              </label>
              <select
                value={selectedSiswaId}
                onChange={handleSelectChange}
                className="w-full px-3 py-2.5 text-xs font-bold border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white text-slate-800 shadow-2xs"
              >
                <option value="">-- Pilih Nama Siswa --</option>
                {siswaList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nama} - Kelas {s.kelas} (NISN: {s.nisn || s.nis})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Atau Ketik NISN / NIS Siswa
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={nisnInput}
                  onChange={handleNisnInputChange}
                  placeholder="Contoh NISN: 0151234501..."
                  className="w-full pl-10 pr-3 py-2.5 text-xs font-bold border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                />
              </div>
            </div>
          </div>

          {/* Selected Student Profile Badge */}
          {selectedSiswa && (
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3 flex items-center gap-3 animate-in fade-in duration-150">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-2xs">
                {selectedSiswa.nama.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-black text-slate-900 text-xs truncate">{selectedSiswa.nama}</h4>
                  <span className="px-1.5 py-0.5 bg-emerald-200/80 text-emerald-900 rounded font-extrabold text-3xs shrink-0">
                    Kelas {selectedSiswa.kelas}
                  </span>
                </div>
                <div className="text-3xs text-slate-600 font-semibold mt-0.5">
                  NIS: <strong className="text-slate-800">{selectedSiswa.nis}</strong>
                  {selectedSiswa.nisn && <> • NISN: <strong className="text-slate-800">{selectedSiswa.nisn}</strong></>}
                </div>
              </div>
              <UserCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            </div>
          )}

          {/* Error Alert */}
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-in shake duration-200">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* PIN Form */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                  <span>PIN Rahasia Siswa (4 - 6 Digit)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowHelp(!showHelp)}
                  className="text-3xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <HelpCircle className="w-3 h-3" />
                  <span>Bantuan PIN</span>
                </button>
              </div>

              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ketik PIN di sini..."
                  autoFocus
                  className="w-full pl-4 pr-11 py-2.5 text-base font-black tracking-widest text-slate-900 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-emerald-500 focus:bg-white focus:outline-none transition-all placeholder:text-slate-400 placeholder:font-normal placeholder:tracking-normal placeholder:text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-3 p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>



              {showHelp && (
                <div className="mt-2 text-3xs text-slate-600 bg-slate-100 p-2.5 rounded-xl space-y-1">
                  <p className="font-bold text-slate-800">📌 Petunjuk PIN Siswa:</p>
                  <p>• PIN awal adalah 4 digit terakhir NIS/NISN siswa.</p>
                  <p>• Setelah masuk, Anda dapat mengganti PIN di menu Buku Tabungan.</p>
                  <p>• Jika lupa PIN, hubungi Wali Kelas atau Admin Sekolah untuk reset.</p>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-amber-300" />
                <span>Masuk Buku Tabungan</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
