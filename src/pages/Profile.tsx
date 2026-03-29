import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { User as UserIcon, Camera, Save, Mail, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, token, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProfileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      
      if (res.ok) {
        await fetch('/api/users/profile', {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ name: user?.name, profile_image: data.url })
        });
        updateUser({ profile_image: data.url });
        toast.success('Foto profil berhasil diperbarui!');
      } else {
        throw new Error(data.error || 'Gagal mengunggah foto');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) return toast.error('Nama tidak boleh kosong');
    
    setIsSaving(true);
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, profile_image: user?.profile_image })
      });
      
      if (res.ok) {
        updateUser({ name });
        toast.success('Profil berhasil disimpan!');
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Gagal menyimpan profil');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10"
    >
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-indigo-600 h-32"></div>
        <div className="px-6 sm:px-10 pb-10">
          <div className="relative flex justify-between items-end -mt-12 mb-8">
            <div className="relative">
              {user?.profile_image ? (
                <img src={user.profile_image} alt="Profile" className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white bg-white shadow-md" />
              ) : (
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 border-4 border-white shadow-md">
                  <UserIcon size={48} />
                </div>
              )}
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-md border border-gray-100 text-gray-600 hover:text-indigo-600 hover:bg-gray-50 transition disabled:opacity-50"
              >
                <Camera size={20} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleProfileUpload} 
                className="hidden" 
                accept="image/*" 
              />
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Merchant Profile</h1>
              <p className="text-gray-500 text-sm">Kelola informasi data pengguna Anda</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                    placeholder="Nama Lengkap"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="pl-10 w-full px-4 py-2 border border-gray-200 bg-gray-50 rounded-lg text-gray-500 outline-none"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Email tidak dapat diubah.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Shield size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={user?.role === 'admin' ? 'Administrator' : 'Merchant'}
                    disabled
                    className="pl-10 w-full px-4 py-2 border border-gray-200 bg-gray-50 rounded-lg text-gray-500 outline-none capitalize"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={handleSaveProfile}
                disabled={isSaving || !name.trim() || name === user?.name}
                className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <Save size={18} />
                {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
