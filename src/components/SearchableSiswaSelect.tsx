import React, { useState, useRef, useEffect } from 'react';
import { Siswa } from '../types';
import { Search, ChevronDown, X, Check, User } from 'lucide-react';

interface SearchableSiswaSelectProps {
  siswaList: Siswa[];
  selectedNis: string;
  onSelectSiswa: (nis: string, student?: Siswa) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
  displayFormat?: (s: Siswa) => string;
}

export const SearchableSiswaSelect: React.FC<SearchableSiswaSelectProps> = ({
  siswaList,
  selectedNis,
  onSelectSiswa,
  placeholder = '-- Ketik 1 Huruf/Angka atau Pilih Murid --',
  required = false,
  className = '',
  disabled = false,
  displayFormat,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Find currently selected student by NIS or ID
  const selectedStudent = siswaList.find(
    (s) => s.nis === selectedNis || s.id === selectedNis
  );

  // Filter student list based on query (even 1 character)
  const filteredSiswa = siswaList.filter((s) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    return (
      (s.nama && s.nama.toLowerCase().includes(query)) ||
      (s.nis && s.nis.toLowerCase().includes(query)) ||
      (s.nisn && s.nisn.toLowerCase().includes(query)) ||
      (s.kelas && s.kelas.toLowerCase().includes(query))
    );
  });

  // Default label display for option items
  const formatStudentLabel = (s: Siswa) => {
    if (displayFormat) return displayFormat(s);
    return `${s.nis} - ${s.nama} (${s.kelas}) - Saldo: Rp ${s.saldo.toLocaleString('id-ID')}`;
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset active index when filtered list changes
  useEffect(() => {
    setActiveIndex(0);
  }, [searchQuery]);

  const handleSelect = (student: Siswa) => {
    onSelectSiswa(student.nis, student);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectSiswa('');
    setSearchQuery('');
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      e.preventDefault();
      setIsOpen(true);
      return;
    }

    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < filteredSiswa.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : filteredSiswa.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredSiswa.length > 0 && activeIndex < filteredSiswa.length) {
        handleSelect(filteredSiswa[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Hidden input for HTML form validation if required */}
      {required && (
        <input
          type="text"
          value={selectedNis}
          required={required}
          onChange={() => {}}
          tabIndex={-1}
          className="sr-only"
        />
      )}

      {/* Control / Display Bar */}
      <div
        onClick={() => {
          if (!disabled) {
            setIsOpen(true);
            setTimeout(() => inputRef.current?.focus(), 50);
          }
        }}
        className={`w-full px-3 py-2.5 bg-white border text-xs rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-2xs ${
          isOpen
            ? 'border-emerald-500 ring-2 ring-emerald-500/20'
            : selectedStudent
            ? 'border-emerald-300 bg-emerald-50/30'
            : 'border-slate-200 hover:border-slate-300'
        } ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-100' : ''}`}
      >
        <Search className={`w-4 h-4 shrink-0 ${isOpen || selectedStudent ? 'text-emerald-600' : 'text-slate-400'}`} />

        {isOpen ? (
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ketik NIS, NISN, atau Nama siswa..."
            disabled={disabled}
            className="w-full bg-transparent font-bold text-slate-800 focus:outline-none placeholder:text-slate-400 placeholder:font-normal"
            autoFocus
          />
        ) : (
          <div className="flex-1 truncate font-bold text-slate-800">
            {selectedStudent ? (
              formatStudentLabel(selectedStudent)
            ) : (
              <span className="text-slate-400 font-normal">{placeholder}</span>
            )}
          </div>
        )}

        {selectedStudent && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            title="Hapus pilihan"
            className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-emerald-600' : ''
          }`}
        />
      </div>

      {/* Dropdown Options Popup */}
      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Quick Search Header Indicator */}
          <div className="p-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-3xs font-semibold text-slate-500">
            <span>
              {searchQuery.trim()
                ? `Hasil pencarian "${searchQuery}" (${filteredSiswa.length})`
                : `Daftar Semua Murid (${siswaList.length}) - Ketik untuk memfilter`}
            </span>
            <span className="text-emerald-600 font-bold">Tekan Enter untuk memilih</span>
          </div>

          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
            {filteredSiswa.length === 0 ? (
              <div className="p-4 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-1">
                <User className="w-6 h-6 text-slate-300" />
                <p className="font-semibold text-slate-700">Siswa tidak ditemukan</p>
                <p className="text-3xs text-slate-400">
                  Coba ketik kata kunci lain (misal huruf nama atau nomor NIS)
                </p>
              </div>
            ) : (
              filteredSiswa.map((student, idx) => {
                const isSelected = selectedStudent?.id === student.id;
                const isActive = activeIndex === idx;

                return (
                  <div
                    key={student.id}
                    onClick={() => handleSelect(student)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`p-2.5 text-xs font-semibold cursor-pointer transition-colors flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-emerald-50 text-emerald-900 font-bold'
                        : isActive
                        ? 'bg-slate-100 text-slate-900'
                        : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex-1 truncate">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900">{student.nama}</span>
                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-3xs font-bold border border-slate-200">
                          Kelas {student.kelas}
                        </span>
                      </div>
                      <div className="text-3xs text-slate-500 mt-0.5 flex items-center gap-2 font-normal">
                        <span>NIS: <strong className="text-slate-700 font-semibold">{student.nis}</strong></span>
                        {student.nisn && <span>• NISN: <strong className="text-slate-700 font-semibold">{student.nisn}</strong></span>}
                        <span>• Saldo: <strong className="text-emerald-700 font-semibold">Rp {student.saldo.toLocaleString('id-ID')}</strong></span>
                      </div>
                    </div>

                    {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
