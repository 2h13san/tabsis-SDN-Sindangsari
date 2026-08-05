import React, { useState } from 'react';
import { User, UserRole, Kelas } from '../types';
import { StorageService } from '../services/storage';
import { UserCog, Plus, Edit2, Trash2, ShieldCheck, X } from 'lucide-react';

interface UserManagerProps {
  usersList: User[];
  kelasList: Kelas[];
  onRefreshData: () => void;
}

export const UserManager: React.FC<UserManagerProps> = ({ usersList, kelasList, onRefreshData }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nama, setNama] = useState('');
  const [role, setRole] = useState<UserRole>('guru');
  const [kelas, setKelas] = useState(kelasList[0]?.nama_kelas || '1-A');
  const [status, setStatus] = useState<'Aktif' | 'Nonaktif'>('Aktif');

  const openAddModal = () => {
    setEditingUser(null);
    setUsername('');
    setPassword('123456');
    setNama('');
    setRole('guru');
    setKelas(kelasList[0]?.nama_kelas || '1-A');
    setStatus('Aktif');
    setShowModal(true);
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setUsername(u.username);
    setPassword(u.password || '');
    setNama(u.nama);
    setRole(u.role);
    setKelas(u.kelas || kelasList[0]?.nama_kelas || '1-A');
    setStatus(u.status);
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      const updated = usersList.map((u) =>
        u.id === editingUser.id
          ? { ...u, username, password, nama, role, kelas: role === 'guru' ? kelas : undefined, status }
          : u
      );
      StorageService.saveUsers(updated);
    } else {
      const newU: User = {
        id: `USR-${Date.now()}`,
        username,
        password,
        nama,
        role,
        kelas: role === 'guru' ? kelas : undefined,
        status,
        last_login: new Date().toISOString(),
      };
      StorageService.saveUsers([...usersList, newU]);
    }
    onRefreshData();
    setShowModal(false);
  };

  const handleDelete = (id: string, namaUser: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus user ${namaUser}?`)) {
      const updated = usersList.filter((u) => u.id !== id);
      StorageService.saveUsers(updated);
      onRefreshData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <UserCog className="w-6 h-6 text-emerald-600" />
            <span>Kelola Pengguna System (USERS Sheet)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Daftar pengguna dengan role Admin, Bendahara, Guru, dan Admin Bank.</p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Pengguna</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
              <th className="p-3">ID</th>
              <th className="p-3">Username</th>
              <th className="p-3">Nama Lengkap</th>
              <th className="p-3">Role</th>
              <th className="p-3">Kelas (Khusus Guru)</th>
              <th className="p-3 text-center">Status</th>
              <th className="p-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {usersList.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="p-3 font-mono font-bold text-slate-500 text-2xs">{u.id}</td>
                <td className="p-3 font-mono font-bold text-slate-800">{u.username}</td>
                <td className="p-3 font-bold text-slate-900">{u.nama}</td>
                <td className="p-3 font-bold uppercase text-slate-700">
                  {u.role === 'admin_bank' ? (
                    <span className="bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-full text-3xs font-extrabold border border-cyan-200">
                      ADMIN BANK
                    </span>
                  ) : (
                    u.role
                  )}
                </td>
                <td className="p-3 text-slate-600">{u.kelas || '-'}</td>
                <td className="p-3 text-center">
                  <span
                    className={`text-3xs font-bold px-2 py-0.5 rounded-full ${
                      u.status === 'Aktif' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {u.status}
                  </span>
                </td>
                <td className="p-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => openEditModal(u)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {u.username !== 'admin' && (
                      <button
                        onClick={() => handleDelete(u.id, u.nama)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-extrabold text-slate-900">
                {editingUser ? 'Edit User' : 'Tambah User Baru'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Role Akses</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold bg-white"
                  >
                    <option value="admin">Admin</option>
                    <option value="bendahara">Bendahara</option>
                    <option value="guru">Guru (Wali Kelas)</option>
                    <option value="admin_bank">Admin Bank Mitra</option>
                  </select>
                </div>

                {role === 'guru' && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Kelas Pengampu</label>
                    <select
                      value={kelas}
                      onChange={(e) => setKelas(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold bg-white"
                    >
                      {kelasList.map((k) => (
                        <option key={k.id} value={k.nama_kelas}>
                          Kelas {k.nama_kelas}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold bg-white"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Nonaktif">Nonaktif</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 text-xs font-bold border border-slate-200 rounded-xl hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer"
                >
                  Simpan User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
