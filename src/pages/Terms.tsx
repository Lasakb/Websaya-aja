import React from 'react';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

export default function Terms() {
  const { settings } = useSettings();

  const defaultTermsText = `Syarat dan Ketentuan Layanan ini mengatur penggunaan Anda atas platform QRIS Merchant Maker.

1. Penerimaan Syarat
Dengan mengakses dan menggunakan layanan kami, Anda setuju untuk terikat oleh Syarat dan Ketentuan ini. Jika Anda tidak setuju, mohon untuk tidak menggunakan layanan kami.

2. Penggunaan Layanan
Anda setuju untuk menggunakan layanan ini hanya untuk tujuan yang sah dan sesuai dengan hukum yang berlaku di Indonesia terkait transaksi elektronik dan perbankan.

3. Tanggung Jawab Pengguna
Anda bertanggung jawab atas keakuratan data yang Anda berikan saat pendaftaran. Kami tidak bertanggung jawab atas kesalahan pembuatan QRIS yang disebabkan oleh data yang tidak valid.

4. Penghentian Layanan
Kami berhak untuk menangguhkan atau menghentikan akses Anda ke layanan kami kapan saja, tanpa pemberitahuan sebelumnya, jika Anda melanggar Syarat dan Ketentuan ini.`;

  const termsText = settings?.terms_of_service_text || defaultTermsText;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
    >
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
        <div className="flex items-center gap-4 mb-8 border-b border-gray-100 pb-6">
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
            <FileText size={24} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Layanan Privasi (Terms of Service)</h1>
        </div>
        
        <div className="prose prose-indigo max-w-none text-gray-600 space-y-6 whitespace-pre-wrap">
          {termsText}
        </div>
      </div>
    </motion.div>
  );
}
