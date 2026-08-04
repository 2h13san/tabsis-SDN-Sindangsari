export type UserRole = 'admin' | 'bendahara' | 'guru' | 'orang_tua';

export interface AppSettings {
  nama_sekolah: string;
  npsn: string;
  alamat: string;
  kepala_sekolah: string;
  nip_kepala_sekolah: string;
  bendahara: string;
  nip_bendahara: string;
  tahun_ajaran: string;
  logo_url: string;
  saldo_bank: number; // Saldo yang sudah disetor ke bank
  qris_code?: string;
  qris_image_url?: string;
  qris_nama_bank?: string;
  qris_no_rekening?: string;
  qris_atas_nama?: string;
}

export interface User {
  id: string;
  username: string;
  password?: string;
  nama: string;
  role: UserRole;
  kelas?: string; // Khusus guru
  status: 'Aktif' | 'Nonaktif';
  last_login?: string;
}

export interface Siswa {
  id: string;
  nis: string;
  nisn: string;
  nama: string;
  jenis_kelamin: 'L' | 'P';
  kelas: string;
  wali_kelas: string;
  orang_tua: string;
  telepon: string;
  saldo: number;
  status: 'Aktif' | 'Lulus' | 'Pindah';
  tanggal_daftar: string;
  qr_code?: string;
  qr_image_url?: string;
  qr_updated_at?: string;
}

export type JenisTransaksi = 'setoran' | 'penarikan' | 'koreksi';
export type StatusSetorBank = 'Belum Disetor' | 'Sudah Disetor';
export type StatusAlurSetoran = 'Di Wali Kelas' | 'Disetor ke Bendahara' | 'Disetor ke Bank';

export interface Transaksi {
  id: string; // Nomor transaksi otomatis (misal: TRX-20260803-001)
  tanggal: string; // YYYY-MM-DD
  jam: string; // HH:mm:ss
  nis: string;
  nama: string;
  kelas: string;
  jenis: JenisTransaksi;
  setoran: number;
  penarikan: number;
  saldo: number; // Saldo setelah transaksi
  petugas: string;
  keterangan: string;
  status_bank?: StatusSetorBank;
  status_alur?: StatusAlurSetoran;
  tanggal_setor_bendahara?: string;
  petugas_bendahara?: string;
  tanggal_setor_bank?: string;
  petugas_bank?: string;
  created_at: string;
}

export interface PenyerahanSetoranRecord {
  id: string; // E.g., SERAH-K1A-20260803-001
  tanggal: string;
  jam: string;
  kelas: string;
  wali_kelas: string;
  jumlah_transaksi: number;
  total_nominal: number;
  status: 'Disetor ke Bendahara' | 'Disetor ke Bank';
  penerima_bendahara?: string;
  tanggal_terima_bendahara?: string;
  disetor_bank_oleh?: string;
  tanggal_setor_bank?: string;
  catatan?: string;
}

export interface Kelas {
  id: string;
  nama_kelas: string;
  wali_kelas: string;
}

export interface LogAktivitas {
  id: string;
  tanggal: string;
  jam: string;
  user: string;
  aktivitas: string;
}

export interface BackupRecord {
  id: string;
  tanggal: string;
  jam: string;
  jumlah_siswa: number;
  jumlah_transaksi: number;
  total_saldo: number;
  file_name: string;
  status: 'Success' | 'Pending';
}

export interface PrintablePassbookConfig {
  baris_awal: number; // Row offset on physical paper
  baris_per_halaman: number;
  tinggi_baris_mm: number;
  tampilkan_header: boolean;
  margin_atas_mm: number;
  margin_kiri_mm: number;
}
