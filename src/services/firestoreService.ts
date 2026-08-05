import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  getDocFromServer,
} from 'firebase/firestore';
import { db } from './firebase';
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
} from '../types';
import {
  defaultSettings,
  defaultPassbookConfig,
  defaultKelas,
  defaultUsers,
  defaultSiswa,
  defaultTransaksi,
  defaultLogs,
  defaultBackups,
  StorageService,
} from './storage';

export const COLLECTIONS = {
  SETTINGS: 'settings',
  USERS: 'users',
  SISWA: 'siswa',
  TRANSAKSI: 'transaksi',
  KELAS: 'kelas',
  LOGS: 'logs',
  BACKUPS: 'backups',
  PASSBOOK_CONFIG: 'passbook_config',
};

export const FirestoreService = {
  // Test connection & Initialize Default Data if empty
  initDatabase: async () => {
    try {
      // Test server reachability
      try {
        await getDocFromServer(doc(db, '_healthcheck_', 'ping'));
      } catch (connErr: any) {
        if (connErr?.message?.includes('offline') || connErr?.code === 'unavailable') {
          console.warn('Firestore is currently in offline mode:', connErr.message);
        }
      }

      // 1. Settings
      const settingsDocRef = doc(db, COLLECTIONS.SETTINGS, 'app');
      const settingsSnap = await getDoc(settingsDocRef);
      if (!settingsSnap.exists()) {
        await setDoc(settingsDocRef, defaultSettings);
      }

      // 2. Passbook Config
      const passbookDocRef = doc(db, COLLECTIONS.PASSBOOK_CONFIG, 'default');
      const passbookSnap = await getDoc(passbookDocRef);
      if (!passbookSnap.exists()) {
        await setDoc(passbookDocRef, defaultPassbookConfig);
      }

      // 3. Kelas
      const kelasSnap = await getDocs(collection(db, COLLECTIONS.KELAS));
      if (kelasSnap.empty) {
        for (const k of defaultKelas) {
          await setDoc(doc(db, COLLECTIONS.KELAS, k.id), k);
        }
      }

      // 4. Users
      const usersSnap = await getDocs(collection(db, COLLECTIONS.USERS));
      if (usersSnap.empty) {
        for (const u of defaultUsers) {
          await setDoc(doc(db, COLLECTIONS.USERS, u.id), u);
        }
      }

      console.log('Firebase Firestore Database initialized successfully!');
    } catch (e) {
      console.warn('Firestore initDatabase operate offline / fallback:', e);
    }
  },

  // Real-time Listeners
  subscribeSettings: (callback: (s: AppSettings) => void) => {
    const ref = doc(db, COLLECTIONS.SETTINGS, 'app');
    return onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          callback(snap.data() as AppSettings);
        }
      },
      (error) => {
        console.warn('Firestore subscribeSettings listener error:', error);
      }
    );
  },

  subscribeSiswa: (callback: (list: Siswa[]) => void) => {
    const ref = collection(db, COLLECTIONS.SISWA);
    return onSnapshot(
      ref,
      (snap) => {
        const list: Siswa[] = [];
        snap.forEach((docSnap) => {
          list.push(docSnap.data() as Siswa);
        });
        callback(list);
      },
      (error) => {
        console.warn('Firestore subscribeSiswa listener error:', error);
      }
    );
  },

  subscribeTransaksi: (callback: (list: Transaksi[]) => void) => {
    const ref = collection(db, COLLECTIONS.TRANSAKSI);
    return onSnapshot(
      ref,
      (snap) => {
        const list: Transaksi[] = [];
        snap.forEach((docSnap) => {
          list.push(docSnap.data() as Transaksi);
        });
        // Sort by date/created_at descending
        list.sort((a, b) => ((b.created_at || b.tanggal) > (a.created_at || a.tanggal) ? 1 : -1));
        callback(list);
      },
      (error) => {
        console.warn('Firestore subscribeTransaksi listener error:', error);
      }
    );
  },

  subscribeUsers: (callback: (list: User[]) => void) => {
    const ref = collection(db, COLLECTIONS.USERS);
    return onSnapshot(
      ref,
      (snap) => {
        const list: User[] = [];
        snap.forEach((docSnap) => {
          list.push(docSnap.data() as User);
        });
        callback(list);
      },
      (error) => {
        console.warn('Firestore subscribeUsers listener error:', error);
      }
    );
  },

  subscribeKelas: (callback: (list: Kelas[]) => void) => {
    const ref = collection(db, COLLECTIONS.KELAS);
    return onSnapshot(
      ref,
      (snap) => {
        const list: Kelas[] = [];
        snap.forEach((docSnap) => {
          list.push(docSnap.data() as Kelas);
        });
        callback(list);
      },
      (error) => {
        console.warn('Firestore subscribeKelas listener error:', error);
      }
    );
  },

  subscribeLogs: (callback: (list: LogAktivitas[]) => void) => {
    const ref = collection(db, COLLECTIONS.LOGS);
    return onSnapshot(
      ref,
      (snap) => {
        const list: LogAktivitas[] = [];
        snap.forEach((docSnap) => {
          list.push(docSnap.data() as LogAktivitas);
        });
        list.sort((a, b) => b.id.localeCompare(a.id));
        callback(list);
      },
      (error) => {
        console.warn('Firestore subscribeLogs listener error:', error);
      }
    );
  },

  subscribeBackups: (callback: (list: BackupRecord[]) => void) => {
    const ref = collection(db, COLLECTIONS.BACKUPS);
    return onSnapshot(
      ref,
      (snap) => {
        const list: BackupRecord[] = [];
        snap.forEach((docSnap) => {
          list.push(docSnap.data() as BackupRecord);
        });
        callback(list);
      },
      (error) => {
        console.warn('Firestore subscribeBackups listener error:', error);
      }
    );
  },

  // Save / Update Operations
  saveSettings: async (settings: AppSettings) => {
    const ref = doc(db, COLLECTIONS.SETTINGS, 'app');
    await setDoc(ref, settings);
    StorageService.saveSettings(settings);
  },

  savePassbookConfig: async (cfg: PrintablePassbookConfig) => {
    const ref = doc(db, COLLECTIONS.PASSBOOK_CONFIG, 'default');
    await setDoc(ref, cfg);
    StorageService.savePassbookConfig(cfg);
  },

  saveSiswaItem: async (siswa: Siswa) => {
    const ref = doc(db, COLLECTIONS.SISWA, siswa.id);
    await setDoc(ref, siswa);
  },

  deleteSiswaItem: async (id: string) => {
    await deleteDoc(doc(db, COLLECTIONS.SISWA, id));
  },

  saveUserItem: async (user: User) => {
    const ref = doc(db, COLLECTIONS.USERS, user.id);
    await setDoc(ref, user);
  },

  deleteUserItem: async (id: string) => {
    await deleteDoc(doc(db, COLLECTIONS.USERS, id));
  },

  saveKelasItem: async (k: Kelas) => {
    const ref = doc(db, COLLECTIONS.KELAS, k.id);
    await setDoc(ref, k);
  },

  deleteKelasItem: async (id: string) => {
    await deleteDoc(doc(db, COLLECTIONS.KELAS, id));
  },

  addLog: async (user: string, aktivitas: string) => {
    const now = new Date();
    const logId = `LOG-${Date.now()}`;
    const newLog: LogAktivitas = {
      id: logId,
      tanggal: now.toISOString().split('T')[0],
      jam: now.toTimeString().split(' ')[0],
      user,
      aktivitas,
    };
    await setDoc(doc(db, COLLECTIONS.LOGS, logId), newLog);
  },

  // Process Transaction on Firestore directly
  processTransaction: async (data: {
    nis: string;
    jenis: 'setoran' | 'penarikan' | 'koreksi';
    nominal: number;
    keterangan: string;
    petugas: string;
  }): Promise<{ success: boolean; message: string; transaction?: Transaksi }> => {
    try {
      // Get Siswa List from Firestore
      const siswaSnap = await getDocs(collection(db, COLLECTIONS.SISWA));
      let targetSiswa: Siswa | null = null;
      siswaSnap.forEach((docSnap) => {
        const s = docSnap.data() as Siswa;
        if (s.nis === data.nis || s.nisn === data.nis) {
          targetSiswa = s;
        }
      });

      if (!targetSiswa) {
        return { success: false, message: 'Siswa dengan NIS/NISN tersebut tidak ditemukan.' };
      }

      const s = targetSiswa as Siswa;
      let newSaldo = s.saldo;
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
        if (s.saldo < data.nominal) {
          return {
            success: false,
            message: `Saldo tidak mencukupi! Saldo saat ini: Rp ${s.saldo.toLocaleString('id-ID')}, Penarikan: Rp ${data.nominal.toLocaleString('id-ID')}`,
          };
        }
        penarikanAmount = data.nominal;
        newSaldo -= data.nominal;
      } else if (data.jenis === 'koreksi') {
        if (data.nominal < 0 && s.saldo + data.nominal < 0) {
          return { success: false, message: 'Koreksi ini menyebabkan saldo menjadi minus!' };
        }
        if (data.nominal >= 0) {
          setoranAmount = data.nominal;
        } else {
          penarikanAmount = Math.abs(data.nominal);
        }
        newSaldo += data.nominal;
      }

      // Update student document
      const updatedSiswa = { ...s, saldo: newSaldo };
      await setDoc(doc(db, COLLECTIONS.SISWA, s.id), updatedSiswa);

      // Create transaction document
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0].replace(/-/g, '');
      const txSnap = await getDocs(collection(db, COLLECTIONS.TRANSAKSI));
      const todayTxCount = txSnap.docs.filter(
        (docSnap) => (docSnap.data() as Transaksi).tanggal === now.toISOString().split('T')[0]
      ).length + 1;

      const txId = `TRX-${todayStr}-${String(todayTxCount).padStart(3, '0')}`;
      const newTx: Transaksi = {
        id: txId,
        tanggal: now.toISOString().split('T')[0],
        jam: now.toTimeString().split(' ')[0],
        nis: s.nis,
        nama: s.nama,
        kelas: s.kelas,
        jenis: data.jenis,
        setoran: setoranAmount,
        penarikan: penarikanAmount,
        saldo: newSaldo,
        petugas: data.petugas,
        keterangan: data.keterangan || (data.jenis === 'setoran' ? 'Setoran Tabungan' : 'Penarikan Tabungan'),
        status_bank: 'Belum Disetor',
        created_at: now.toISOString(),
      };

      await setDoc(doc(db, COLLECTIONS.TRANSAKSI, txId), newTx);

      // Add log
      await FirestoreService.addLog(
        data.petugas,
        `Transaksi ${data.jenis.toUpperCase()} ID ${txId} (${s.nama}) Rp ${data.nominal.toLocaleString('id-ID')}`
      );

      // Also mirror to LocalStorage for offline fallback
      StorageService.processTransaction(data);

      return {
        success: true,
        message: `Transaksi ${data.jenis} berhasil diproses di Firebase Firestore! Saldo baru ${s.nama}: Rp ${newSaldo.toLocaleString('id-ID')}`,
        transaction: newTx,
      };
    } catch (e: any) {
      console.warn('Firestore offline/error, falling back to Local Storage:', e);
      // Fallback seamlessly to local storage engine
      return StorageService.processTransaction(data);
    }
  },

  // Setor Ke Bank on Firestore
  setorKeBank: async (amount: number, petugas: string) => {
    try {
      const txSnap = await getDocs(collection(db, COLLECTIONS.TRANSAKSI));
      let countUpdated = 0;

      for (const docSnap of txSnap.docs) {
        const t = docSnap.data() as Transaksi;
        if (t.status_bank === 'Belum Disetor' && t.setoran > 0) {
          countUpdated++;
          await updateDoc(doc(db, COLLECTIONS.TRANSAKSI, t.id), {
            status_bank: 'Sudah Disetor' as StatusSetorBank,
          });
        }
      }

      // Update Settings saldo bank
      const settingsRef = doc(db, COLLECTIONS.SETTINGS, 'app');
      const settingsSnap = await getDoc(settingsRef);
      if (settingsSnap.exists()) {
        const cur = settingsSnap.data() as AppSettings;
        const newSaldoBank = (cur.saldo_bank || 0) + amount;
        await updateDoc(settingsRef, { saldo_bank: newSaldoBank });
      }

      await FirestoreService.addLog(petugas, `Penyetoran Kas Sekolah ke Bank sebesar Rp ${amount.toLocaleString('id-ID')}`);

      return {
        success: true,
        message: `Berhasil menyetor Rp ${amount.toLocaleString('id-ID')} ke Bank! (${countUpdated} transaksi diperbarui).`,
      };
    } catch (e: any) {
      console.warn('Firestore setorkebank error, fallback to StorageService:', e);
      return StorageService.setorKeBank(amount, petugas);
    }
  },

  serahkanSetoranKeBendahara: async (
    txIds: string[],
    petugasWali: string,
    kelas: string,
    catatan?: string
  ) => {
    try {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      for (const txId of txIds) {
        const txRef = doc(db, COLLECTIONS.TRANSAKSI, txId);
        const snap = await getDoc(txRef);
        if (snap.exists()) {
          await updateDoc(txRef, {
            status_alur: 'Disetor ke Bendahara',
            tanggal_setor_bendahara: todayStr,
            petugas_bendahara: petugasWali,
          });
        }
      }

      return StorageService.serahkanSetoranKeBendahara(txIds, petugasWali, kelas, catatan);
    } catch (e) {
      console.error('Firestore serahkanSetoranKeBendahara fallback to StorageService:', e);
      return StorageService.serahkanSetoranKeBendahara(txIds, petugasWali, kelas, catatan);
    }
  },

  serahkanSetoranManualKeBendahara: async (
    manualNominal: number,
    petugasWali: string,
    kelas: string,
    catatan?: string
  ) => {
    try {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const txSnap = await getDocs(collection(db, COLLECTIONS.TRANSAKSI));

      let remaining = manualNominal;
      for (const docSnap of txSnap.docs) {
        const t = docSnap.data() as Transaksi;
        const isClassMatch = kelas === 'ALL' || kelas === 'Kolektif' || t.kelas === kelas;
        const isUnsubmitted = (!t.status_alur || t.status_alur === 'Di Wali Kelas') && t.jenis === 'setoran';

        if (isClassMatch && isUnsubmitted && remaining > 0) {
          remaining -= t.setoran;
          await updateDoc(doc(db, COLLECTIONS.TRANSAKSI, t.id), {
            status_alur: 'Disetor ke Bendahara',
            tanggal_setor_bendahara: todayStr,
            petugas_bendahara: petugasWali,
          });
        }
      }

      return StorageService.serahkanSetoranManualKeBendahara(manualNominal, petugasWali, kelas, catatan);
    } catch (e) {
      console.error('Firestore serahkanSetoranManualKeBendahara fallback to StorageService:', e);
      return StorageService.serahkanSetoranManualKeBendahara(manualNominal, petugasWali, kelas, catatan);
    }
  },

  setorKasKeBankBerjenjang: async (txIds: string[], petugasBendahara: string) => {
    try {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      for (const txId of txIds) {
        const txRef = doc(db, COLLECTIONS.TRANSAKSI, txId);
        const snap = await getDoc(txRef);
        if (snap.exists()) {
          await updateDoc(txRef, {
            status_alur: 'Menunggu Approval Bank',
            status_bank: 'Menunggu Approval Bank',
            tanggal_setor_bank: todayStr,
            petugas_bendahara: petugasBendahara,
          });
        }
      }

      return StorageService.ajukanSetorKasKeBankBerjenjang(txIds, petugasBendahara);
    } catch (e) {
      console.error('Firestore setorKasKeBankBerjenjang fallback to StorageService:', e);
      return StorageService.ajukanSetorKasKeBankBerjenjang(txIds, petugasBendahara);
    }
  },

  approveSetoranBank: async (txIds: string[], petugasBank: string, noRef?: string) => {
    try {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      for (const txId of txIds) {
        const txRef = doc(db, COLLECTIONS.TRANSAKSI, txId);
        const snap = await getDoc(txRef);
        if (snap.exists()) {
          await updateDoc(txRef, {
            status_alur: 'Disetor ke Bank',
            status_bank: 'Sudah Disetor',
            tanggal_setor_bank: todayStr,
            petugas_bank: petugasBank,
          });
        }
      }

      return StorageService.approveSetoranBank(txIds, petugasBank, noRef);
    } catch (e) {
      console.error('Firestore approveSetoranBank fallback to StorageService:', e);
      return StorageService.approveSetoranBank(txIds, petugasBank, noRef);
    }
  },

  tolakSetoranBank: async (txIds: string[], petugasBank: string, alasan?: string) => {
    try {
      for (const txId of txIds) {
        const txRef = doc(db, COLLECTIONS.TRANSAKSI, txId);
        const snap = await getDoc(txRef);
        if (snap.exists()) {
          await updateDoc(txRef, {
            status_alur: 'Disetor ke Bendahara',
            status_bank: 'Belum Disetor',
          });
        }
      }

      return StorageService.tolakSetoranBank(txIds, petugasBank, alasan);
    } catch (e) {
      console.error('Firestore tolakSetoranBank fallback to StorageService:', e);
      return StorageService.tolakSetoranBank(txIds, petugasBank, alasan);
    }
  },
};
