import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { QrCode, X, Printer, Download, CreditCard, School } from 'lucide-react';
import { Siswa, AppSettings } from '../types';

interface QRCodeDisplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  siswa: Siswa | null;
  settings: AppSettings;
}

export const QRCodeDisplayModal: React.FC<QRCodeDisplayModalProps> = ({
  isOpen,
  onClose,
  siswa,
  settings,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isOpen || !siswa || !canvasRef.current || siswa.qr_image_url) return;

    // QR Data contains custom qr_code string or student NIS/NISN JSON
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
        width: 200,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      },
      (error) => {
        if (error) console.error('Error generating QR code:', error);
      }
    );
  }, [isOpen, siswa]);

  const handleDownloadImage = () => {
    if (!canvasRef.current || !siswa) return;
    const image = canvasRef.current.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = image;
    link.download = `QR_Code_${siswa.nama.replace(/\s+/g, '_')}_${siswa.nis}.png`;
    link.click();
  };

  const handlePrintCard = () => {
    window.print();
  };

  if (!isOpen || !siswa) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-100 overflow-hidden print:shadow-none print:m-0 print:border-none">
        {/* Header - Screen Only */}
        <div className="bg-slate-900 p-4 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold">Kartu Siswa & QR Code</h3>
              <p className="text-3xs text-slate-300">Format Resmi Tabungan Digital</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Card Area */}
        <div className="p-6 text-center bg-slate-50 print:bg-white print:p-0">
          <div className="bg-white rounded-2xl border-2 border-indigo-900 shadow-md p-5 space-y-4 print:shadow-none print:border-2">
            {/* Card Header */}
            <div className="border-b-2 border-indigo-900 pb-3 flex items-center justify-between text-left">
              <div>
                <span className="text-3xs font-black uppercase text-indigo-900 tracking-wider block">
                  KARTU TABUNGAN SISWA
                </span>
                <h4 className="text-xs font-black text-slate-900">{settings.nama_sekolah}</h4>
                <p className="text-3xs text-slate-500">NPSN: {settings.npsn} • T.A. {settings.tahun_ajaran}</p>
              </div>
              <School className="w-6 h-6 text-indigo-900 shrink-0" />
            </div>

            {/* QR Code Canvas or Uploaded Image */}
            <div className="flex justify-center my-2">
              {siswa.qr_image_url ? (
                <img
                  src={siswa.qr_image_url}
                  alt={`QR ${siswa.nama}`}
                  className="w-48 h-48 object-contain rounded-xl border border-slate-200 bg-white p-1 shadow-2xs"
                />
              ) : (
                <canvas ref={canvasRef} className="rounded-xl border border-slate-200 shadow-2xs" />
              )}
            </div>

            {/* Student Info */}
            <div className="bg-indigo-50/60 p-3 rounded-xl border border-indigo-100 text-slate-800 space-y-1 text-xs">
              <div className="font-black text-sm text-indigo-950 uppercase">{siswa.nama}</div>
              <div className="text-2xs font-bold text-indigo-800">
                Kelas: {siswa.kelas} • NIS: {siswa.nis}
              </div>
              <div className="text-3xs text-slate-600 font-mono">NISN: {siswa.nisn || '-'}</div>
            </div>

            <div className="text-3xs text-slate-400 font-medium">
              Gunakan QR Code ini saat menyetor/menarik tabungan dan login mandiri.
            </div>
          </div>
        </div>

        {/* Modal Action Buttons - Screen Only */}
        <div className="bg-white p-4 border-t border-slate-200 flex gap-2 print:hidden">
          <button
            onClick={handleDownloadImage}
            className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Download PNG</span>
          </button>
          <button
            onClick={handlePrintCard}
            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Kartu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
