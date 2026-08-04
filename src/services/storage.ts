import {
  AppSettings,
  User,
  Siswa,
  Transaksi,
  Kelas,
  LogAktivitas,
  BackupRecord,
  PrintablePassbookConfig,
  StatusSetorBank,
  StatusAlurSetoran,
  PenyerahanSetoranRecord,
} from '../types';

const STORAGE_KEYS = {
  SETTINGS: 'tabsis_settings_v1',
  USERS: 'tabsis_users_v1',
  SISWA: 'tabsis_siswa_v1',
  TRANSAKSI: 'tabsis_transaksi_v1',
  KELAS: 'tabsis_kelas_v1',
  LOGS: 'tabsis_logs_v1',
  BACKUPS: 'tabsis_backups_v1',
  ACTIVE_USER: 'tabsis_active_user_v1',
  PASSBOOK_CONFIG: 'tabsis_passbook_config_v1',
  PENYERAHAN_SETORAN: 'tabsis_penyerahan_setoran_v1',
};

// Initial Default Settings
export const defaultSettings: AppSettings = {
  nama_sekolah: 'SD Negeri 01 Nusantara',
  npsn: '20108976',
  alamat: 'Jl. Pendidikan No. 45, Kebayoran, Jakarta Selatan',
  kepala_sekolah: 'Drs. H. Ahmad Wijaya, M.Pd.',
  nip_kepala_sekolah: '19700315 199512 1 002',
  bendahara: 'Siti Rahmawati, S.Pd.',
  nip_bendahara: '19820520 200801 2 015',
  tahun_ajaran: '2025/2026',
  logo_url: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=200',
  saldo_bank: 0,
};

// Initial Default Passbook Print Config
export const defaultPassbookConfig: PrintablePassbookConfig = {
  baris_awal: 1,
  baris_per_halaman: 20,
  tinggi_baris_mm: 8,
  tampilkan_header: true,
  margin_atas_mm: 15,
  margin_kiri_mm: 10,
};

// Default Sample Kelas
export const defaultKelas: Kelas[] = [
  { id: 'K1A', nama_kelas: '1-A', wali_kelas: 'Dewi Lestari, S.Pd.' },
  { id: 'K1B', nama_kelas: '1-B', wali_kelas: 'Sri Wahyuni, S.Pd.' },
  { id: 'K2A', nama_kelas: '2-A', wali_kelas: 'Budi Santoso, S.Pd.' },
  { id: 'K3A', nama_kelas: '3-A', wali_kelas: 'Rina Kusumawati, S.Pd.' },
  { id: 'K4A', nama_kelas: '4-A', wali_kelas: 'Eko Prasetyo, S.Pd.' },
  { id: 'K5A', nama_kelas: '5-A', wali_kelas: 'NURHAYATI, S.Pd.' },
  { id: 'K6A', nama_kelas: '6-A', wali_kelas: 'Bambang Irawan, M.Pd.' },
];

// Default Users
export const defaultUsers: User[] = [
  {
    id: 'USR-001',
    username: 'admin',
    password: 'admin123',
    nama: 'Administrator Utama',
    role: 'admin',
    status: 'Aktif',
    last_login: new Date().toISOString(),
  },
  {
    id: 'USR-002',
    username: 'bendahara',
    password: 'bendahara123',
    nama: 'Siti Rahmawati, S.Pd.',
    role: 'bendahara',
    status: 'Aktif',
    last_login: new Date().toISOString(),
  },
  {
    id: 'USR-003',
    username: 'guru1a',
    password: 'guru123',
    nama: 'Dewi Lestari, S.Pd.',
    role: 'guru',
    kelas: '1-A',
    status: 'Aktif',
    last_login: new Date().toISOString(),
  },
  {
    id: 'USR-004',
    username: 'guru4a',
    password: 'guru123',
    nama: 'Eko Prasetyo, S.Pd.',
    role: 'guru',
    kelas: '4-A',
    status: 'Aktif',
    last_login: new Date().toISOString(),
  },
];

// Default Siswa (Empty - No sample data)
export const defaultSiswa: Siswa[] = [];

// Default Transaksi (Empty - No sample data)
export const defaultTransaksi: Transaksi[] = [];

// Default Logs (Empty - No sample data)
export const defaultLogs: LogAktivitas[] = [];

// Default Backups (Empty - No sample data)
export const defaultBackups: BackupRecord[] = [];

const SAMPLE_SISWA_IDS = new Set(['SIS-001', 'SIS-002', 'SIS-003', 'SIS-004', 'SIS-005', 'SIS-006', 'SIS-007', 'SIS-008']);
const SAMPLE_TX_IDS = new Set([
  'TRX-20260801-001',
  'TRX-20260801-002',
  'TRX-20260802-001',
  'TRX-20260802-002',
  'TRX-20260803-001',
  'TRX-20260803-002',
  'TRX-20260803-003',
  'TRX-20260803-004',
]);
const SAMPLE_LOG_IDS = new Set(['LOG-001', 'LOG-002', 'LOG-003']);
const SAMPLE_BACKUP_IDS = new Set(['BAK-20260801']);

// Helper Storage Functions
export const getStoredData = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    if (!item || item === 'undefined' || item === 'null') {
      return (item === 'null' ? null : defaultValue) as T;
    }
    return JSON.parse(item);
  } catch (e) {
    console.error(`Error reading ${key} from localStorage`, e);
    return defaultValue;
  }
};

export const setStoredData = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error writing ${key} to localStorage`, e);
  }
};

// Storage Store API
export const StorageService = {
  getSettings: (): AppSettings => getStoredData(STORAGE_KEYS.SETTINGS, defaultSettings),
  saveSettings: (settings: AppSettings): void => setStoredData(STORAGE_KEYS.SETTINGS, settings),

  getPassbookConfig: (): PrintablePassbookConfig => getStoredData(STORAGE_KEYS.PASSBOOK_CONFIG, defaultPassbookConfig),
  savePassbookConfig: (cfg: PrintablePassbookConfig): void => setStoredData(STORAGE_KEYS.PASSBOOK_CONFIG, cfg),

  getUsers: (): User[] => getStoredData(STORAGE_KEYS.USERS, defaultUsers),
  saveUsers: (users: User[]): void => setStoredData(STORAGE_KEYS.USERS, users),

  getSiswa: (): Siswa[] => {
    const data = getStoredData<Siswa[]>(STORAGE_KEYS.SISWA, defaultSiswa);
    return data.filter((s) => !SAMPLE_SISWA_IDS.has(s.id));
  },
  saveSiswa: (siswa: Siswa[]): void => setStoredData(STORAGE_KEYS.SISWA, siswa),

  getTransaksi: (): Transaksi[] => {
    const data = getStoredData<Transaksi[]>(STORAGE_KEYS.TRANSAKSI, defaultTransaksi);
    return data.filter((t) => !SAMPLE_TX_IDS.has(t.id));
  },
  saveTransaksi: (tx: Transaksi[]): void => setStoredData(STORAGE_KEYS.TRANSAKSI, tx),

  getKelas: (): Kelas[] => getStoredData(STORAGE_KEYS.KELAS, defaultKelas),
  saveKelas: (k: Kelas[]): void => setStoredData(STORAGE_KEYS.KELAS, k),

  getLogs: (): LogAktivitas[] => {
    const data = getStoredData<LogAktivitas[]>(STORAGE_KEYS.LOGS, defaultLogs);
    return data.filter((l) => !SAMPLE_LOG_IDS.has(l.id));
  },
  addLog: (user: string, aktivitas: string): void => {
    const logs = StorageService.getLogs();
    const now = new Date();
    const newLog: LogAktivitas = {
      id: `LOG-${Date.now()}`,
      tanggal: now.toISOString().split('T')[0],
      jam: now.toTimeString().split(' ')[0],
      user,
      aktivitas,
    };
    const updated = [newLog, ...logs].slice(0, 100);
    setStoredData(STORAGE_KEYS.LOGS, updated);
  },

  getBackups: (): BackupRecord[] => {
    const data = getStoredData<BackupRecord[]>(STORAGE_KEYS.BACKUPS, defaultBackups);
    return data.filter((b) => !SAMPLE_BACKUP_IDS.has(b.id));
  },
  saveBackups: (b: BackupRecord[]): void => setStoredData(STORAGE_KEYS.BACKUPS, b),

  getActiveUser: (): User | null => getStoredData<User | null>(STORAGE_KEYS.ACTIVE_USER, null),
  setActiveUser: (user: User | null): void => setStoredData(STORAGE_KEYS.ACTIVE_USER, user),

  // Reset all local database to default seed
  resetToDefault: (): void => {
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.SISWA);
    localStorage.removeItem(STORAGE_KEYS.TRANSAKSI);
    localStorage.removeItem(STORAGE_KEYS.KELAS);
    localStorage.removeItem(STORAGE_KEYS.LOGS);
    localStorage.removeItem(STORAGE_KEYS.BACKUPS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_USER);
  },

  // Add new transaction with validation
  processTransaction: (data: {
    nis: string;
    jenis: 'setoran' | 'penarikan' | 'koreksi';
    nominal: number;
    keterangan: string;
    petugas: string;
  }): { success: boolean; message: string; transaction?: Transaksi } => {
    const siswaList = StorageService.getSiswa();
    const siswaIndex = siswaList.findIndex((s) => s.nis === data.nis || s.nisn === data.nis);

    if (siswaIndex === -1) {
      return { success: false, message: 'Siswa dengan NIS/NISN tersebut tidak ditemukan.' };
    }

    const targetSiswa = siswaList[siswaIndex];
    let newSaldo = targetSiswa.saldo;
    let setoranAmount = 0;
    let penarikanAmount = 0;

    if (data.jenis === 'setoran') {
      if (data.nominal <= 0) {
        return { success: false, message: 'Nominal setoran harus lebih besar dari 0.' };
      }
      setoranAmount = data.nominal;
      newSaldo += data.nominal;
    } else if (data.jenis === 'penarikan') {
      if (data.nominal <= 0) {
        return { success: false, message: 'Nominal penarikan harus lebih besar dari 0.' };
      }
      if (targetSiswa.saldo < data.nominal) {
        return {
          success: false,
          message: `Saldo tidak mencukupi! Saldo saat ini: Rp ${targetSiswa.saldo.toLocaleString('id-ID')}, Penarikan: Rp ${data.nominal.toLocaleString('id-ID')}`,
        };
      }
      penarikanAmount = data.nominal;
      newSaldo -= data.nominal;
    } else if (data.jenis === 'koreksi') {
      // Koreksi bisa menambah/mengurangi tergantung nominal
      if (data.nominal < 0 && targetSiswa.saldo + data.nominal < 0) {
        return { success: false, message: 'Koreksi ini menyebabkan saldo menjadi minus!' };
      }
      if (data.nominal >= 0) {
        setoranAmount = data.nominal;
      } else {
        penarikanAmount = Math.abs(data.nominal);
      }
      newSaldo += data.nominal;
    }

    // Update Student Saldo
    siswaList[siswaIndex] = { ...targetSiswa, saldo: newSaldo };
    StorageService.saveSiswa(siswaList);

    // Create Transaksi
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0].replace(/-/g, '');
    const txList = StorageService.getTransaksi();
    const countToday = txList.filter((t) => t.tanggal === now.toISOString().split('T')[0]).length + 1;
    const txId = `TRX-${todayStr}-${String(countToday).padStart(3, '0')}`;

    const newTx: Transaksi = {
      id: txId,
      tanggal: now.toISOString().split('T')[0],
      jam: now.toTimeString().split(' ')[0],
      nis: targetSiswa.nis,
      nama: targetSiswa.nama,
      kelas: targetSiswa.kelas,
      jenis: data.jenis,
      setoran: setoranAmount,
      penarikan: penarikanAmount,
      saldo: newSaldo,
      petugas: data.petugas,
      keterangan: data.keterangan || (data.jenis === 'setoran' ? 'Setoran Tabungan' : 'Penarikan Tabungan'),
      status_bank: 'Belum Disetor',
      status_alur: 'Di Wali Kelas',
      created_at: now.toISOString(),
    };

    StorageService.saveTransaksi([newTx, ...txList]);
    StorageService.addLog(data.petugas, `Transaksi ${data.jenis.toUpperCase()} ID ${txId} (${targetSiswa.nama}) Rp ${data.nominal.toLocaleString('id-ID')}`);

    return {
      success: true,
      message: `Transaksi ${data.jenis} berhasil diproses! Saldo baru ${targetSiswa.nama}: Rp ${newSaldo.toLocaleString('id-ID')}`,
      transaction: newTx,
    };
  },

  getPenyerahanRecords: (): PenyerahanSetoranRecord[] => getStoredData(STORAGE_KEYS.PENYERAHAN_SETORAN, []),
  savePenyerahanRecords: (records: PenyerahanSetoranRecord[]): void => setStoredData(STORAGE_KEYS.PENYERAHAN_SETORAN, records),

  // Tier 2: Serahkan Setoran dari Wali Kelas ke Bendahara Sekolah
  serahkanSetoranKeBendahara: (
    txIds: string[],
    petugasWali: string,
    kelas: string,
    catatan?: string
  ): { success: boolean; message: string } => {
    const txList = StorageService.getTransaksi();
    let totalNominal = 0;
    let countUpdated = 0;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const updatedTx = txList.map((t) => {
      if (txIds.includes(t.id) && t.jenis === 'setoran') {
        countUpdated++;
        totalNominal += t.setoran;
        return {
          ...t,
          status_alur: 'Disetor ke Bendahara' as const,
          tanggal_setor_bendahara: todayStr,
          petugas_bendahara: petugasWali,
        };
      }
      return t;
    });

    if (countUpdated === 0) {
      return { success: false, message: 'Tidak ada transaksi setoran valid yang dipilih.' };
    }

    StorageService.saveTransaksi(updatedTx);

    // Record Penyerahan Log
    const records = StorageService.getPenyerahanRecords();
    const newRecord: PenyerahanSetoranRecord = {
      id: `SERAH-${kelas.replace(/\s+/g, '')}-${Date.now()}`,
      tanggal: todayStr,
      jam: now.toTimeString().split(' ')[0],
      kelas: kelas,
      wali_kelas: petugasWali,
      jumlah_transaksi: countUpdated,
      total_nominal: totalNominal,
      status: 'Disetor ke Bendahara',
      catatan: catatan || `Penyerahan Setoran Kas Kelas ${kelas} ke Bendahara Sekolah`,
    };

    StorageService.savePenyerahanRecords([newRecord, ...records]);
    StorageService.addLog(
      petugasWali,
      `Penyerahan Setoran Kelas ${kelas} ke Bendahara Sekolah sebesar Rp ${totalNominal.toLocaleString('id-ID')} (${countUpdated} transaksi)`
    );

    return {
      success: true,
      message: `Berhasil menyerahkan ${countUpdated} transaksi setoran Kelas ${kelas} ke Bendahara dengan total Rp ${totalNominal.toLocaleString('id-ID')}!`,
    };
  },

  // Serahkan Setoran Manual Nominal dari Wali Kelas ke Bendahara Sekolah
  serahkanSetoranManualKeBendahara: (
    manualNominal: number,
    petugasWali: string,
    kelas: string,
    catatan?: string
  ): { success: boolean; message: string } => {
    if (manualNominal <= 0) {
      return { success: false, message: 'Nominal setoran manual harus lebih besar dari Rp 0.' };
    }

    const txList = StorageService.getTransaksi();
    let remaining = manualNominal;
    let countUpdated = 0;
    let totalMatchedFromTx = 0;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const updatedTx = txList.map((t) => {
      const isClassMatch = kelas === 'ALL' || kelas === 'Kolektif' || t.kelas === kelas;
      const isUnsubmitted = (!t.status_alur || t.status_alur === 'Di Wali Kelas') && t.jenis === 'setoran';

      if (isClassMatch && isUnsubmitted && remaining > 0) {
        countUpdated++;
        totalMatchedFromTx += t.setoran;
        remaining -= t.setoran;
        return {
          ...t,
          status_alur: 'Disetor ke Bendahara' as const,
          tanggal_setor_bendahara: todayStr,
          petugas_bendahara: petugasWali,
        };
      }
      return t;
    });

    if (countUpdated > 0) {
      StorageService.saveTransaksi(updatedTx);
    }

    // Record Penyerahan Log
    const records = StorageService.getPenyerahanRecords();
    const newRecord: PenyerahanSetoranRecord = {
      id: `SERAH-MANUAL-${kelas.replace(/\s+/g, '')}-${Date.now()}`,
      tanggal: todayStr,
      jam: now.toTimeString().split(' ')[0],
      kelas: kelas,
      wali_kelas: petugasWali,
      jumlah_transaksi: countUpdated || 1,
      total_nominal: manualNominal,
      status: 'Disetor ke Bendahara',
      catatan: catatan || `Penyerahan Setoran Manual Kas Kelas ${kelas} ke Bendahara Sekolah (Rp ${manualNominal.toLocaleString('id-ID')})`,
    };

    StorageService.savePenyerahanRecords([newRecord, ...records]);
    StorageService.addLog(
      petugasWali,
      `Penyerahan Setoran Manual Kelas ${kelas} ke Bendahara Sekolah sebesar Rp ${manualNominal.toLocaleString('id-ID')}`
    );

    return {
      success: true,
      message: `Berhasil menyetorkan manual Rp ${manualNominal.toLocaleString('id-ID')} dari Kas Kelas ${kelas} ke Bendahara Sekolah! Kas kelas berkurang & Kas Bendahara bertambah.`,
    };
  },

  // Tier 3: Penyetoran Kas Sekolah dari Bendahara ke Bank Mitra
  setorKasKeBankBerjenjang: (
    txIds: string[],
    petugasBendahara: string
  ): { success: boolean; message: string } => {
    const txList = StorageService.getTransaksi();
    const settings = StorageService.getSettings();
    let totalNominal = 0;
    let countUpdated = 0;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const updatedTx = txList.map((t) => {
      if (txIds.includes(t.id) && t.jenis === 'setoran') {
        countUpdated++;
        totalNominal += t.setoran;
        return {
          ...t,
          status_alur: 'Disetor ke Bank' as const,
          status_bank: 'Sudah Disetor' as const,
          tanggal_setor_bank: todayStr,
          petugas_bank: petugasBendahara,
        };
      }
      return t;
    });

    if (countUpdated === 0) {
      return { success: false, message: 'Tidak ada transaksi setoran valid yang dipilih untuk disetor ke Bank.' };
    }

    StorageService.saveTransaksi(updatedTx);

    // Update Bank Balance in Settings
    settings.saldo_bank = (settings.saldo_bank || 0) + totalNominal;
    StorageService.saveSettings(settings);

    StorageService.addLog(
      petugasBendahara,
      `Penyetoran Kas Sekolah dari Bendahara ke Bank Mitra sebesar Rp ${totalNominal.toLocaleString('id-ID')} (${countUpdated} transaksi)`
    );

    return {
      success: true,
      message: `Berhasil menyetor Kas Sekolah sebesar Rp ${totalNominal.toLocaleString('id-ID')} ke Bank Mitra! (${countUpdated} transaksi terkonfirmasi).`,
    };
  },

  // Deposit cash to bank
  setorKeBank: (amount: number, petugas: string): { success: boolean; message: string } => {
    const txList = StorageService.getTransaksi();
    const settings = StorageService.getSettings();

    // Find "Belum Disetor" transactions
    let remainingToSetor = amount;
    let countUpdated = 0;

    const updatedTx = txList.map((t) => {
      if (t.status_bank === 'Belum Disetor' && t.setoran > 0 && remainingToSetor > 0) {
        countUpdated++;
        return { ...t, status_bank: 'Sudah Disetor' as StatusSetorBank };
      }
      return t;
    });

    StorageService.saveTransaksi(updatedTx);

    // Update settings bank balance
    settings.saldo_bank = (settings.saldo_bank || 0) + amount;
    StorageService.saveSettings(settings);

    StorageService.addLog(petugas, `Penyetoran Kas Sekolah ke Bank sebesar Rp ${amount.toLocaleString('id-ID')}`);

    return {
      success: true,
      message: `Berhasil menyetor Rp ${amount.toLocaleString('id-ID')} ke Bank! (${countUpdated} transaksi diperbarui).`,
    };
  },
};

// Formatting utilities
export const formatRupiah = (num: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num);
};

export const formatDateIndo = (dateStr: string): string => {
  if (!dateStr) return '-';
  try {
    const [y, m, d] = dateStr.split('-');
    const months = [
      'Januari',
      'Februari',
      'Maret',
      'April',
      'Mei',
      'Juni',
      'Juli',
      'Agustus',
      'September',
      'Oktober',
      'November',
      'Desember',
    ];
    return `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]} ${y}`;
  } catch (e) {
    return dateStr;
  }
};

// Google Apps Script generator script builder
export const generateGoogleAppsScriptCode = (settings: AppSettings): { codeGs: string; indexHtml: string } => {
  const codeGs = `/**
 * TABSIS - Tabungan Siswa Digital (Google Apps Script Backend)
 * Sekolah: ${settings.nama_sekolah} (NPSN: ${settings.npsn})
 * Dibuat otomatis oleh Aplikasi TABSIS Web System.
 */

const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

function doGet(e) {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('TABSIS - ${settings.nama_sekolah}')
    .setXframeOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * SETUP SPREADSHEET SHEETS IF MISSING
 */
function setupDatabaseSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ['SETTINGS', 'USERS', 'SISWA', 'TRANSAKSI', 'KELAS', 'LOG', 'BACKUP'];
  
  sheets.forEach(function(sheetName) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
  });

  // Setup Headers
  const headers = {
    'SETTINGS': ['Nama Sekolah', 'NPSN', 'Alamat', 'Kepala Sekolah', 'Bendahara', 'Tahun Ajaran', 'Logo'],
    'USERS': ['id', 'username', 'password', 'nama', 'role', 'kelas', 'status', 'last_login'],
    'SISWA': ['id', 'nis', 'nisn', 'nama', 'jenis_kelamin', 'kelas', 'wali_kelas', 'orang_tua', 'telepon', 'saldo', 'status', 'tanggal_daftar'],
    'TRANSAKSI': ['id', 'tanggal', 'jam', 'nis', 'nama', 'kelas', 'jenis', 'setoran', 'penarikan', 'saldo', 'petugas', 'keterangan', 'created_at'],
    'KELAS': ['id', 'nama_kelas', 'wali_kelas'],
    'LOG': ['id', 'tanggal', 'jam', 'user', 'aktivitas'],
    'BACKUP': ['id', 'tanggal', 'jam', 'jumlah_siswa', 'jumlah_transaksi', 'total_saldo', 'file_name', 'status']
  };

  for (let key in headers) {
    let sheet = ss.getSheetByName(key);
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, headers[key].length).setValues([headers[key]]).setFontWeight("bold").setBackground("#e2e8f0");
    }
  }

  return "Inisialisasi Database Google Spreadsheet TABSIS Berhasil!";
}

/**
 * API DATA GETTERS & WRITERS
 */
function getSheetData(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  const headers = data[0];
  const rows = [];
  
  for (let i = 1; i < data.length; i++) {
    let row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = data[i][j];
    }
    rows.push(row);
  }
  return rows;
}

function processTransactionGAS(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetSiswa = ss.getSheetByName('SISWA');
  const sheetTx = ss.getSheetByName('TRANSAKSI');
  const sheetLog = ss.getSheetByName('LOG');

  // Search Siswa
  const siswaData = sheetSiswa.getDataRange().getValues();
  let foundRow = -1;
  let currentSaldo = 0;
  let namaSiswa = "";
  let kelasSiswa = "";

  for (let i = 1; i < siswaData.length; i++) {
    if (String(siswaData[i][1]) === String(data.nis) || String(siswaData[i][2]) === String(data.nis)) {
      foundRow = i + 1; // 1-indexed row
      namaSiswa = siswaData[i][3];
      kelasSiswa = siswaData[i][5];
      currentSaldo = Number(siswaData[i][9]) || 0;
      break;
    }
  }

  if (foundRow === -1) {
    return { success: false, message: "Siswa dengan NIS/NISN tidak ditemukan!" };
  }

  let newSaldo = currentSaldo;
  let setoran = 0;
  let penarikan = 0;

  if (data.jenis === 'setoran') {
    setoran = Number(data.nominal);
    newSaldo += setoran;
  } else if (data.jenis === 'penarikan') {
    penarikan = Number(data.nominal);
    if (currentSaldo < penarikan) {
      return { success: false, message: "Saldo tidak mencukupi untuk penarikan ini!" };
    }
    newSaldo -= penarikan;
  } else if (data.jenis === 'koreksi') {
    let diff = Number(data.nominal);
    if (currentSaldo + diff < 0) {
      return { success: false, message: "Koreksi gagal, saldo menjadi minus!" };
    }
    newSaldo += diff;
    if (diff >= 0) setoran = diff;
    else penarikan = Math.abs(diff);
  }

  // Update Saldo Siswa in Sheet
  sheetSiswa.getRange(foundRow, 10).setValue(newSaldo);

  // Record Transaksi
  const now = new Date();
  const dateStr = Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd");
  const timeStr = Utilities.formatDate(now, Session.getScriptTimeZone(), "HH:mm:ss");
  const txId = "TRX-" + Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyyMMdd") + "-" + (sheetTx.getLastRow());

  sheetTx.appendRow([
    txId, dateStr, timeStr, data.nis, namaSiswa, kelasSiswa, data.jenis, setoran, penarikan, newSaldo, data.petugas, data.keterangan, now.toISOString()
  ]);

  sheetLog.appendRow([
    "LOG-" + Date.now(), dateStr, timeStr, data.petugas, "Transaksi " + data.jenis.toUpperCase() + " " + txId + " (" + namaSiswa + ") Rp " + data.nominal
  ]);

  return {
    success: true,
    message: "Transaksi berhasil! Saldo baru: Rp " + newSaldo,
    txId: txId,
    saldoBaru: newSaldo
  };
}
`;

  const indexHtml = `<!DOCTYPE html>
<html>
<head>
  <base target="_top">
  <title>TABSIS - ${settings.nama_sekolah}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-50 text-slate-800 font-sans">
  <div class="max-w-5xl mx-auto p-6">
    <div class="bg-white rounded-xl shadow-md p-6 mb-6 flex items-center justify-between border border-slate-200">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">${settings.nama_sekolah}</h1>
        <p class="text-sm text-slate-500">Sistem Tabungan Siswa Digital (TABSIS) Google Apps Script</p>
      </div>
      <span class="bg-emerald-100 text-emerald-800 text-xs px-3 py-1.5 rounded-full font-semibold">Database Live Spreadsheet</span>
    </div>
    <div id="app" class="bg-white p-6 rounded-xl shadow-md border border-slate-200">
      <p class="text-slate-600">Sistem TABSIS Google Apps Script siap digunakan dan telah terhubung ke Google Spreadsheet Anda.</p>
    </div>
  </div>
</body>
</html>`;

  return { codeGs, indexHtml };
};
