import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { motion } from 'framer-motion';
import { Bell, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function News() {
  const { user, token } = useAuth();
  const { settings, refreshSettings } = useSettings();
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (settings?.news_content) {
      setContent(settings.news_content);
    } else {
      setContent(user?.role === 'admin' ? '' : 'Belum ada pengumuman saat ini.');
    }
  }, [settings, user?.role]);

  const handleSave = async (newContent: string) => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ news_content: newContent })
      });

      if (res.ok) {
        toast.success('Pengumuman otomatis tersimpan!');
        refreshSettings();
      } else {
        throw new Error('Gagal memperbarui pengumuman');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      handleSave(newContent);
    }, 1500); // Auto save after 1.5 seconds of no typing
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="text-indigo-600" />
            Berita & Pengumuman
          </h1>
          <p className="text-gray-500 mt-1">Informasi terbaru seputar layanan kami</p>
        </div>
        
        {isSaving && (
          <div className="flex items-center gap-2 text-indigo-600 text-sm font-medium bg-indigo-50 px-3 py-1.5 rounded-full">
            <Loader2 size={16} className="animate-spin" />
            Menyimpan otomatis...
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {user?.role === 'admin' ? (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Edit Konten Berita</h2>
            <textarea
              value={content}
              onChange={handleChange}
              className="w-full h-64 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition resize-none"
              placeholder="Tulis pengumuman di sini... (Akan tersimpan otomatis saat Anda berhenti mengetik)"
            />
          </div>
        ) : (
          <div className="p-8">
            <div className="prose prose-indigo max-w-none">
              {content ? content.split('\n').map((paragraph, idx) => (
                <p key={idx} className="text-gray-700 leading-relaxed mb-4 last:mb-0">
                  {paragraph}
                </p>
              )) : (
                <p className="text-gray-500 italic">Belum ada pengumuman saat ini.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
