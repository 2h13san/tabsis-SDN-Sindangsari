import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { QrCode, X, Camera, Upload, AlertCircle, RefreshCw, Keyboard } from 'lucide-react';
import { Siswa } from '../types';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (data: { nisOrNisn: string; raw: string; siswa?: Siswa }) => void;
  siswaList?: Siswa[];
  title?: string;
  subtitle?: string;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  siswaList = [],
  title = 'Scan QR Code Kartu Siswa',
  subtitle = 'Arahkan kamera ke QR Code kartu siswa atau unggah gambar QR Code',
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'manual'>('camera');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const qrContainerId = 'qr-reader-viewport';

  useEffect(() => {
    if (!isOpen || activeTab !== 'camera') {
      stopCameraScanner();
      return;
    }

    // Small delay to ensure DOM element exists
    const timer = setTimeout(() => {
      startCameraScanner();
    }, 200);

    return () => {
      clearTimeout(timer);
      stopCameraScanner();
    };
  }, [isOpen, activeTab]);

  const stopCameraScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (e) {
        console.error('Error stopping scanner:', e);
      } finally {
        scannerRef.current = null;
        setIsScanning(false);
      }
    }
  };

  const startCameraScanner = async () => {
    setCameraError(null);
    try {
      const containerEl = document.getElementById(qrContainerId);
      if (!containerEl) {
        setIsScanning(false);
        return;
      }

      if (scannerRef.current) {
        await stopCameraScanner();
      }

      const html5Qrcode = new Html5Qrcode(qrContainerId);
      scannerRef.current = html5Qrcode;

      const config = { fps: 10, qrbox: { width: 250, height: 250 } };

      setIsScanning(true);
      await html5Qrcode.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          handleDecodedResult(decodedText);
        },
        () => {
          // ignore scan frame errors
        }
      );
    } catch (err: any) {
      console.warn('Camera scanner start error:', err);
      setIsScanning(false);
      setCameraError(
        'Kamera tidak dapat diakses atau izin ditolak. Anda dapat memilih tab "Upload Gambar" atau "Ketik Manual".'
      );
    }
  };

  const handleDecodedResult = (rawText: string) => {
    let cleanText = rawText.trim();
    // Try to parse JSON if formatted as JSON
    try {
      if (cleanText.startsWith('{') && cleanText.endsWith('}')) {
        const obj = JSON.parse(cleanText);
        cleanText = obj.nis || obj.nisn || obj.id || cleanText;
      }
    } catch {
      // ignore
    }

    // Remove prefixes like "NIS:" or "NISN:"
    cleanText = cleanText.replace(/^(nis|nisn):/i, '').trim();

    // Find student if siswaList is provided (match custom qr_code, nis, nisn, or id)
    const foundSiswa = siswaList.find(
      (s) =>
        (s.qr_code && s.qr_code.trim().toLowerCase() === cleanText.toLowerCase()) ||
        s.nis === cleanText ||
        s.nisn === cleanText ||
        s.id === cleanText
    );

    stopCameraScanner();
    onScanSuccess({
      nisOrNisn: cleanText,
      raw: rawText,
      siswa: foundSiswa,
    });
    onClose();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const html5Qrcode = new Html5Qrcode('qr-reader-file-temp');
      const decodedText = await html5Qrcode.scanFile(file, true);
      handleDecodedResult(decodedText);
    } catch (err) {
      alert('QR Code tidak terdeteksi pada gambar yang diunggah. Silakan coba gambar dengan resolusi lebih baik.');
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    handleDecodedResult(manualInput);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold">{title}</h3>
              <p className="text-3xs text-slate-300">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCameraScanner();
              onClose();
            }}
            className="p-1 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('camera')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'camera' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Kamera Live</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'upload' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload File</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'manual' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Input / USB</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5">
          {activeTab === 'camera' && (
            <div className="space-y-4 text-center">
              <div
                id={qrContainerId}
                className="w-full h-64 bg-slate-900 rounded-xl overflow-hidden relative flex items-center justify-center border border-slate-300 shadow-inner"
              >
                {!isScanning && !cameraError && (
                  <div className="text-white text-xs flex flex-col items-center gap-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                    <span>Membuka kamera...</span>
                  </div>
                )}
              </div>

              {cameraError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-start gap-2 text-left">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Akses Kamera Terkendala</span>
                    <span>{cameraError}</span>
                  </div>
                </div>
              )}

              <p className="text-3xs text-slate-500">
                Pegang kartu QR Code siswa secara stabil tepat di tengah kotak merah/hijau kamera.
              </p>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="space-y-4 text-center py-4">
              <div id="qr-reader-file-temp" className="hidden"></div>
              <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/50 p-8 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-colors group">
                <Upload className="w-10 h-10 text-slate-400 group-hover:text-emerald-600 mb-2 transition-colors" />
                <span className="text-xs font-bold text-slate-700 group-hover:text-emerald-800">
                  Pilih Gambar QR Code Siswa
                </span>
                <span className="text-3xs text-slate-400 mt-1">Format PNG, JPG, JPEG, WEBP</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {activeTab === 'manual' && (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor QR Code / USB Barcode Scanner Input
                </label>
                <input
                  type="text"
                  autoFocus
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="Ketik NIS/NISN atau scan via USB Gun Scanner..."
                  className="w-full px-4 py-3 text-sm font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
                />
                <p className="text-3xs text-slate-500 mt-1">
                  Mendukung alat USB Barcode/QR Scanner fisik yang terhubung ke komputer/laptop.
                </p>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Gunakan Data Tersebut
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
