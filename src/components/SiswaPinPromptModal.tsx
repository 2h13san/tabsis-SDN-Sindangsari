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
  GraduationCap,
  QrCode,
  HelpCircle,
} from 'lucide-react';

interface SiswaPinPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  siswa: Siswa | null;
  fromQrScan?: boolean;
  onSuccess: (siswa: Siswa) => void;
}

export const SiswaPinPromptModal: React.FC<SiswaPinPromptModalProps> = ({
  isOpen,
  onClose,
  siswa,
  fromQrScan = false,
  onSuccess,
}) => {
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
    }
  }, [isOpen, siswa]);

  if (!isOpen || !siswa) return null;

  const defaultPin = getEffectiveSiswaPin(siswa);
  const hasCustomPin = isCustomPinSet(siswa);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!pinInput.trim()) {
      setErrorMsg('Masukkan PIN rahasia terlebih dahulu!');
      return;
    }

    if (verifySiswaPin(siswa, pinInput)) {
      onSuccess(siswa);
    } else {
      setErrorMsg('PIN Rahasia salah! Silakan periksa kembali atau tanyakan Wali Kelas.');
    }
  };

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
              <h3 className="text-base font-black tracking-tight">Verifikasi PIN Rahasia</h3>
              <p className="text-2xs text-emerald-100 font-medium">
                Sistem keamanan Buku Tabungan Siswa
              </p>
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5">
          {/* QR Code Banner Badge */}
          {fromQrScan && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-center gap-2.5 text-emerald-800 text-xs font-bold">
              <QrCode className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Kartu QR Siswa Terdeteksi! Silakan masukkan PIN untuk melanjutkan.</span>
            </div>
          )}

          {/* Student Profile Identity Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-black text-base flex items-center justify-center shadow-2xs shrink-0">
              {siswa.nama.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-black text-slate-900 text-sm truncate">{siswa.nama}</h4>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-extrabold text-3xs shrink-0 border border-emerald-200">
                  Kelas {siswa.kelas}
                </span>
              </div>
              <div className="text-3xs text-slate-500 font-semibold mt-0.5 flex items-center gap-2">
                <span>NIS: <strong className="text-slate-700">{siswa.nis}</strong></span>
                {siswa.nisn && <span>• NISN: <strong className="text-slate-700">{siswa.nisn}</strong></span>}
              </div>
            </div>
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-in shake duration-200">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* PIN Input Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                  <span>PIN Rahasia (4 - 6 Digit)</span>
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
                  onChange={(e) => {
                    // Only allow numeric input
                    const val = e.target.value.replace(/\D/g, '');
                    setPinInput(val);
                  }}
                  placeholder="Ketik PIN di sini..."
                  autoFocus
                  className="w-full pl-4 pr-11 py-3 text-base font-black tracking-widest text-slate-900 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-emerald-500 focus:bg-white focus:outline-none transition-all placeholder:text-slate-400 placeholder:font-normal placeholder:tracking-normal placeholder:text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-3.5 p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Hint Box */}
              {!hasCustomPin && (
                <div className="mt-2 text-3xs text-slate-500 font-semibold bg-amber-50/80 border border-amber-200/70 p-2 rounded-xl flex items-start gap-1.5">
                  <span className="text-amber-600 font-bold">💡 Hint:</span>
                  <span>
                    Belum ubah PIN? Gunakan PIN Default: <strong>{defaultPin}</strong> (4 digit terakhir NIS/NISN).
                  </span>
                </div>
              )}

              {showHelp && (
                <div className="mt-2 text-3xs text-slate-600 bg-slate-100 p-2.5 rounded-xl space-y-1">
                  <p className="font-bold text-slate-800">📌 Petunjuk PIN Siswa:</p>
                  <p>• PIN bawaan awal adalah 4 digit terakhir NIS/NISN siswa.</p>
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
                <span>Masuk Sekarang</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
