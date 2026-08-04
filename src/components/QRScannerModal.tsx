import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { QrCode, X, Camera, Upload, AlertCircle, RefreshCw, Keyboard, SwitchCamera, Zap, ScanLine, Image as ImageIcon } from 'lucide-react';
import { Siswa } from '../types';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (data: { nisOrNisn: string; raw: string; siswa?: Siswa }) => void;
  siswaList?: Siswa[];
  title?: string;
  subtitle?: string;
}

interface CameraDevice {
  id: string;
  label: string;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  siswaList = [],
  title = 'Scan Barcode / QR Code Kartu Siswa',
  subtitle = 'Arahkan kamera HP ke Barcode/QR Code kartu siswa atau ambil foto langsung',
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'manual'>('camera');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const qrContainerId = 'qr-reader-viewport';

  useEffect(() => {
    if (!isOpen) {
      stopCameraScanner();
      return;
    }

    // Load camera list on open
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          const mapped = devices.map((d) => ({ id: d.id, label: d.label || `Kamera ${d.id}` }));
          setCameras(mapped);
          // Prefer back camera if label includes back/rear/environment
          const backCam = mapped.find(
            (c) =>
              c.label.toLowerCase().includes('back') ||
              c.label.toLowerCase().includes('rear') ||
              c.label.toLowerCase().includes('belakang') ||
              c.label.toLowerCase().includes('environment')
          );
          if (backCam) {
            setSelectedCameraId(backCam.id);
          }
        }
      })
      .catch((err) => {
        console.warn('Could not enumerate cameras:', err);
      });

    if (activeTab === 'camera') {
      const timer = setTimeout(() => {
        startCameraScanner();
      }, 250);

      return () => {
        clearTimeout(timer);
        stopCameraScanner();
      };
    } else {
      stopCameraScanner();
    }
  }, [isOpen, activeTab, selectedCameraId]);

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
        setTorchOn(false);
        setHasTorch(false);
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

      // Support all standard 1D barcodes and 2D QR codes
      const html5Qrcode = new Html5Qrcode(qrContainerId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODABAR,
          Html5QrcodeSupportedFormats.ITF,
        ],
        verbose: false,
      });

      scannerRef.current = html5Qrcode;

      // Dynamic viewbox optimized for HP aspect ratios and 1D/2D barcodes
      const qrboxFunction = (viewfinderWidth: number, viewfinderHeight: number) => {
        const boxWidth = Math.min(viewfinderWidth * 0.88, 340);
        const boxHeight = Math.min(viewfinderHeight * 0.60, 220);
        return {
          width: Math.max(180, Math.floor(boxWidth)),
          height: Math.max(120, Math.floor(boxHeight)),
        };
      };

      const config = {
        fps: 20,
        qrbox: qrboxFunction,
        aspectRatio: 1.333333,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true,
        },
      };

      setIsScanning(true);

      // Prefer facingMode environment for HP smartphones
      const cameraConstraint: any = selectedCameraId
        ? { deviceId: { exact: selectedCameraId } }
        : { facingMode: 'environment' };

      try {
        await html5Qrcode.start(
          cameraConstraint,
          config,
          (decodedText) => {
            handleDecodedResult(decodedText);
          },
          () => {}
        );
      } catch (firstErr) {
        // Fallback to basic facingMode if exact deviceId failed
        console.warn('First camera start failed, trying basic facingMode environment:', firstErr);
        await html5Qrcode.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            handleDecodedResult(decodedText);
          },
          () => {}
        );
      }

      // Check if torch feature is available on HP camera
      try {
        const capabilities = html5Qrcode.getRunningTrackCapabilities();
        if (capabilities && (capabilities as any).torch) {
          setHasTorch(true);
        }
      } catch {
        setHasTorch(false);
      }
    } catch (err: any) {
      console.warn('Camera scanner start error:', err);
      setIsScanning(false);

      setCameraError(
        'Kamera live HP tidak dapat terbuka atau izin ditolak. Silakan tekan tombol "Foto Barcode via Kamera HP" di bawah atau buka lewat tab "Foto / File HP".'
      );
    }
  };

  const toggleTorch = async () => {
    if (!scannerRef.current || !hasTorch) return;
    try {
      const nextState = !torchOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: nextState } as any],
      });
      setTorchOn(nextState);
    } catch (err) {
      console.warn('Torch toggle error:', err);
    }
  };

  const switchNextCamera = () => {
    if (cameras.length <= 1) return;
    const currentIndex = cameras.findIndex((c) => c.id === selectedCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    setSelectedCameraId(cameras[nextIndex].id);
  };

  const handleDecodedResult = (rawText: string) => {
    let cleanText = rawText.trim();
    
    // Try to parse JSON if formatted as JSON
    try {
      if (cleanText.startsWith('{') && cleanText.endsWith('}')) {
        const obj = JSON.parse(cleanText);
        cleanText = obj.nis || obj.nisn || obj.id || obj.code || cleanText;
      }
    } catch {
      // ignore
    }

    // Remove prefixes like "NIS:", "NISN:", "BARCODE:"
    cleanText = cleanText.replace(/^(nis|nisn|barcode|code):/i, '').trim();

    // Find student if siswaList is provided (match custom qr_code, nis, nisn, or id)
    const foundSiswa = siswaList.find(
      (s) =>
        (s.qr_code && s.qr_code.trim().toLowerCase() === cleanText.toLowerCase()) ||
        s.nis === cleanText ||
        s.nisn === cleanText ||
        s.id === cleanText
    );

    // Vibration feedback on smartphones
    if (navigator.vibrate) {
      try {
        navigator.vibrate(100);
      } catch {
        // ignore
      }
    }

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
      // 1. Try native browser BarcodeDetector API if available (Android Chrome / Edge / Opera)
      if ('BarcodeDetector' in window) {
        try {
          const detector = new (window as any).BarcodeDetector({
            formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'codabar', 'itf'],
          });
          const imageBitmap = await createImageBitmap(file);
          const detected = await detector.detect(imageBitmap);
          if (detected && detected.length > 0) {
            handleDecodedResult(detected[0].rawValue);
            return;
          }
        } catch (nativeErr) {
          console.warn('Native BarcodeDetector failed, falling back to html5Qrcode:', nativeErr);
        }
      }

      // 2. Fallback to html5Qrcode scanFile
      const html5Qrcode = new Html5Qrcode('qr-reader-file-temp', {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODABAR,
          Html5QrcodeSupportedFormats.ITF,
        ],
        verbose: false,
      });
      const decodedText = await html5Qrcode.scanFile(file, true);
      handleDecodedResult(decodedText);
    } catch (err) {
      alert(
        'Barcode / QR Code tidak terdeteksi pada gambar. Pastikan foto kartu cukup terang, fokus, dan tegak.'
      );
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    handleDecodedResult(manualInput);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-slate-900 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{title}</h3>
              <p className="text-3xs text-slate-300">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCameraScanner();
              onClose();
            }}
            className="p-1.5 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher (Mobile Friendly 44px height) */}
        <div className="flex border-b border-slate-200 bg-slate-100 p-1 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('camera')}
            className={`flex-1 min-h-[44px] text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'camera' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Kamera Live</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 min-h-[44px] text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'upload' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Foto / File HP</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`flex-1 min-h-[44px] text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'manual' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Keyboard className="w-4 h-4" />
            <span>Input USB</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5">
          {activeTab === 'camera' && (
            <div className="space-y-3 text-center">
              {/* Camera Viewport */}
              <div
                id={qrContainerId}
                className="w-full h-64 sm:h-72 bg-slate-950 rounded-2xl overflow-hidden relative flex items-center justify-center border border-slate-800 shadow-inner"
              >
                {!isScanning && !cameraError && (
                  <div className="text-white text-xs flex flex-col items-center gap-2 p-4">
                    <RefreshCw className="w-7 h-7 animate-spin text-emerald-400" />
                    <span className="font-medium">Membuka kamera HP...</span>
                    <span className="text-3xs text-slate-400">Pastikan memberi izin akses kamera</span>
                  </div>
                )}
              </div>

              {/* Camera Toolbar Actions (Torch & Switch Camera) */}
              <div className="flex items-center justify-between gap-2 pt-1">
                {cameras.length > 1 ? (
                  <button
                    type="button"
                    onClick={switchNextCamera}
                    className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <SwitchCamera className="w-4 h-4 text-emerald-600" />
                    <span>Ganti Kamera HP</span>
                  </button>
                ) : (
                  <div className="text-3xs text-slate-400 font-medium">Mode Kamera Aktif</div>
                )}

                {hasTorch && (
                  <button
                    type="button"
                    onClick={toggleTorch}
                    className={`py-2 px-3 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                      torchOn
                        ? 'bg-amber-500 text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                    <span>{torchOn ? 'Senter ON' : 'Senter HP'}</span>
                  </button>
                )}
              </div>

              {cameraError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-start gap-2.5 text-left">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold block text-rose-900">Kamera HP Terkendala</span>
                    <p className="text-3xs text-rose-700 leading-relaxed">{cameraError}</p>
                    <button
                      type="button"
                      onClick={startCameraScanner}
                      className="mt-1.5 px-3 py-1 bg-rose-600 text-white font-bold text-3xs rounded-lg hover:bg-rose-700 cursor-pointer"
                    >
                      Coba Buka Kamera Lagi
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl text-left flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ScanLine className="w-4 h-4 text-emerald-600 shrink-0" />
                  <p className="text-3xs text-emerald-900 font-medium leading-tight">
                    Mendukung <strong>Barcode Garis 1D</strong> (NIS/NISN) & <strong>QR Code 2D</strong>.
                  </p>
                </div>
              </div>

              {/* Direct HP Camera Snap Action for Blurry/Difficult HP Cameras */}
              <label className="w-full min-h-[44px] py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all">
                <Camera className="w-4 h-4 text-emerald-200" />
                <span>Atau Ambil Foto Barcode (Kamera HP)</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="space-y-3 py-2">
              <div id="qr-reader-file-temp" className="hidden"></div>
              
              {/* Option 1: Direct Camera Capture on HP */}
              <label className="border-2 border-emerald-300 hover:border-emerald-500 bg-emerald-50/60 hover:bg-emerald-100/60 p-5 rounded-2xl flex items-center gap-3 cursor-pointer transition-all group">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Camera className="w-5 h-5" />
                </div>
                <div className="text-left flex-1">
                  <span className="text-xs font-bold text-emerald-950 block">
                    Ambil Foto Langsung dengan Kamera HP
                  </span>
                  <span className="text-3xs text-emerald-700 font-medium block mt-0.5">
                    Membuka aplikasi kamera bawaan HP untuk foto kartu siswa
                  </span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* Option 2: Choose from Gallery / Storage */}
              <label className="border-2 border-dashed border-slate-300 hover:border-slate-400 bg-slate-50 hover:bg-slate-100 p-5 rounded-2xl flex items-center gap-3 cursor-pointer transition-all group">
                <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="text-left flex-1">
                  <span className="text-xs font-bold text-slate-800 block">
                    Pilih Foto / File dari Galeri HP
                  </span>
                  <span className="text-3xs text-slate-500 font-medium block mt-0.5">
                    Pilih gambar yang tersimpan (Format PNG, JPG, WEBP)
                  </span>
                </div>
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
            <form onSubmit={handleManualSubmit} className="space-y-4 py-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor NIS / NISN / USB Barcode Scanner
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
                  Dapat digunakan jika kamera HP berhalangan atau menggunakan barcode scanner USB fisik.
                </p>
              </div>
              <button
                type="submit"
                className="w-full min-h-[44px] py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors"
              >
                Gunakan Kode Tersebut
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

