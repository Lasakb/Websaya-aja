import React from 'react';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

export default function Privacy() {
  const { settings } = useSettings();

  const defaultPrivacyText = `Selamat datang di halaman Kebijakan Privasi kami. Kami sangat menghargai privasi Anda dan berkomitmen untuk melindungi informasi pribadi Anda.

1. Informasi yang Kami Kumpulkan
Kami mengumpulkan informasi yang Anda berikan secara langsung kepada kami saat mendaftar, seperti nama, alamat email, dan data merchant yang diperlukan untuk pembuatan QRIS.

2. Penggunaan Informasi
Informasi yang kami kumpulkan digunakan semata-mata untuk memproses pembuatan QRIS Anda, mengelola akun Anda, dan memberikan layanan pelanggan yang lebih baik.

3. Keamanan Data
Kami menggunakan langkah-langkah keamanan standar industri untuk melindungi data pribadi Anda dari akses, penggunaan, atau pengungkapan yang tidak sah.

4. Perubahan Kebijakan Privasi
Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu. Setiap perubahan akan diumumkan di halaman ini.`;

  const privacyText = settings?.privacy_policy_text || defaultPrivacyText;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
    >
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
        <div className="flex items-center gap-4 mb-8 border-b border-gray-100 pb-6">
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
            <Shield size={24} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Kebijakan Privasi</h1>
        </div>
        
        <div className="prose prose-indigo max-w-none text-gray-600 space-y-6 whitespace-pre-wrap">
          {privacyText}
        </div>
      </div>
    </motion.div>
  );
}
