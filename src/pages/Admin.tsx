import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { Users, Settings as SettingsIcon, ShieldAlert, Image as ImageIcon, Video, Type, Loader2, MessageCircle, X, Send, Clock, Globe, QrCode } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function Admin() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { settings, refreshSettings } = useSettings();
  const [users, setUsers] = useState<any[]>([]);
  const [qrisApps, setQrisApps] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('settings');
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Ticket Modal States
  const [selectedTicketAdmin, setSelectedTicketAdmin] = useState<any>(null);
  const [ticketMessages, setTicketMessages] = useState<any[]>([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [replying, setReplying] = useState(false);

  const handleSelectTicketAdmin = async (ticket: any) => {
    setSelectedTicketAdmin(ticket);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTicketMessages(data.messages);
      }
    } catch (error) {
      console.error('Failed to fetch ticket details:', error);
    }
  };

  const handleReplyAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedTicketAdmin) return;

    setReplying(true);
    try {
      const res = await fetch(`/api/tickets/${selectedTicketAdmin.id}/messages`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ message: replyMessage })
      });

      if (res.ok) {
        setReplyMessage('');
        handleSelectTicketAdmin(selectedTicketAdmin);
        fetchData();
      } else {
        toast.error('Gagal mengirim balasan');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan');
    } finally {
      setReplying(false);
    }
  };

  const handleCloseTicketAdmin = async () => {
    if (!selectedTicketAdmin) return;
    try {
      const res = await fetch(`/api/tickets/${selectedTicketAdmin.id}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ status: 'closed' })
      });

      if (res.ok) {
        toast.success('Tiket berhasil ditutup');
        handleSelectTicketAdmin({ ...selectedTicketAdmin, status: 'closed' });
        fetchData();
      } else {
        toast.error('Gagal menutup tiket');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan');
    }
  };

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
    fetchData();
  }, [settings, token]);

  const fetchData = async () => {
    try {
      const [usersRes, qrisRes, ticketsRes] = await Promise.all([
        fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/qris', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/tickets', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      if (usersRes.ok) setUsers(await usersRes.json());
      if (qrisRes.ok) setQrisApps(await qrisRes.json());
      if (ticketsRes.ok) setTickets(await ticketsRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  const handleSettingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        toast.success('Pengaturan berhasil disimpan');
        refreshSettings();
      } else {
        throw new Error('Gagal menyimpan pengaturan');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Gagal menyimpan pengaturan');
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (userId: number, isBanned: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/ban`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ is_banned: isBanned })
      });
      if (res.ok) {
        toast.success(`User berhasil di-${isBanned ? 'ban' : 'unban'}`);
        fetchData();
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengubah status user');
    }
  };

  const handleUpdateQris = async (id: number, status: string, custom_link: string, merchant_name: string, nmid: string) => {
    try {
      const res = await fetch(`/api/admin/qris/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status, custom_link, merchant_name, nmid })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Data QRIS berhasil diperbarui');
        fetchData();
      } else {
        toast.error(data.error || 'Gagal memperbarui data QRIS');
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal memperbarui data QRIS');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append('file', file);
    
    toast.loading('Mengunggah file...', { id: 'upload' });

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: uploadData
      });
      const data = await res.json();
      if (res.ok) {
        setFormData(prev => ({ ...prev, [fieldName]: data.url }));
        toast.success('File berhasil diunggah', { id: 'upload' });
      } else {
        throw new Error('Gagal mengunggah file');
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengunggah file', { id: 'upload' });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Panel Admin</h1>
        <p className="text-gray-600">Kelola pengaturan website dan pengguna.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            <button 
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-3 text-left font-medium flex items-center gap-3 transition ${activeTab === 'settings' ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <SettingsIcon size={18} /> Pengaturan Web
            </button>
            <button 
              onClick={() => setActiveTab('landing_text')}
              className={`px-4 py-3 text-left font-medium flex items-center gap-3 transition ${activeTab === 'landing_text' ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <Type size={18} /> Teks Halaman Depan
            </button>
            <button 
              onClick={() => setActiveTab('users')}
              className={`px-4 py-3 text-left font-medium flex items-center gap-3 transition ${activeTab === 'users' ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <Users size={18} /> Data Pengguna
            </button>
            <button 
              onClick={() => setActiveTab('qris')}
              className={`px-4 py-3 text-left font-medium flex items-center gap-3 transition ${activeTab === 'qris' ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <ShieldAlert size={18} /> Data QRIS
            </button>
            <button 
              onClick={() => setActiveTab('tickets')}
              className={`px-4 py-3 text-left font-medium flex items-center gap-3 transition ${activeTab === 'tickets' ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <MessageCircle size={18} /> Bantuan Tiket
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8"
          >
            {activeTab === 'settings' && (
              <form onSubmit={handleSaveSettings} className="space-y-8">
                {/* General Settings */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-2">
                    <Type size={20} className="text-indigo-600" /> Teks & Konten
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Judul Header Web</label>
                      <input type="text" name="header_title" value={formData.header_title || ''} onChange={handleSettingChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Teks Copyright</label>
                      <input type="text" name="copyright" value={formData.copyright || ''} onChange={handleSettingChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Warna Latar Belakang Copyright</label>
                      <input type="color" name="copyright_bg_color" value={formData.copyright_bg_color || '#ffffff'} onChange={handleSettingChange} className="w-full h-10 px-1 py-1 border border-gray-300 rounded-lg cursor-pointer" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Halaman Depan</label>
                      <textarea name="page_description" rows={3} value={formData.page_description || ''} onChange={handleSettingChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"></textarea>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Kontak WhatsApp</label>
                      <input type="text" name="contact_wa" value={formData.contact_wa || ''} onChange={handleSettingChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="6281234567890" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Kontak Email</label>
                      <input type="email" name="contact_email" value={formData.contact_email || ''} onChange={handleSettingChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi Web (Footer)</label>
                      <input type="text" name="footer_location" value={formData.footer_location || ''} onChange={handleSettingChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="Jakarta, Indonesia" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fitur Top Up Saldo</label>
                      <select name="enable_topup" value={formData.enable_topup || 'true'} onChange={handleSettingChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
                        <option value="true">Buka (Aktif)</option>
                        <option value="false">Sembunyikan (Nonaktif)</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">Sembunyikan atau tampilkan fitur top up saldo di dashboard merchant.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Teks Saldo Merchant</label>
                      <input type="text" name="balance_text" value={formData.balance_text || ''} onChange={handleSettingChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="Saldo Merchant Anda" />
                      <p className="text-xs text-gray-500 mt-1">Teks yang ditampilkan di atas nominal saldo pada dashboard.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nomor DANA (Top Up)</label>
                      <input type="text" name="dana_number" value={formData.dana_number || ''} onChange={handleSettingChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="081234567890" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nomor GoPay (Top Up)</label>
                      <input type="text" name="gopay_number" value={formData.gopay_number || ''} onChange={handleSettingChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="081234567890" />
                    </div>
                  </div>
                </div>

                {/* Media Settings */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-2">
                    <ImageIcon size={20} className="text-indigo-600" /> Media & Gambar
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Logo Web</label>
                      <div className="flex gap-2">
                        <input type="text" name="logo" value={formData.logo || ''} onChange={handleSettingChange} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="URL Logo" />
                        <label className="bg-gray-100 px-3 py-2 rounded-lg border border-gray-300 cursor-pointer hover:bg-gray-200">
                          Upload <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} />
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Favicon</label>
                      <div className="flex gap-2">
                        <input type="text" name="favicon" value={formData.favicon || ''} onChange={handleSettingChange} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="URL Favicon" />
                        <label className="bg-gray-100 px-3 py-2 rounded-lg border border-gray-300 cursor-pointer hover:bg-gray-200">
                          Upload <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'favicon')} />
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gambar Hero (Halaman Depan Kanan)</label>
                      <div className="flex gap-2">
                        <input type="text" name="hero_image" value={formData.hero_image || ''} onChange={handleSettingChange} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="URL Gambar" />
                        <label className="bg-gray-100 px-3 py-2 rounded-lg border border-gray-300 cursor-pointer hover:bg-gray-200">
                          Upload <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'hero_image')} />
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gambar Tengah Hero (Bawah Badge)</label>
                      <div className="flex gap-2">
                        <input type="text" name="hero_bg_image" value={formData.hero_bg_image || ''} onChange={handleSettingChange} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="URL Gambar" />
                        <label className="bg-gray-100 px-3 py-2 rounded-lg border border-gray-300 cursor-pointer hover:bg-gray-200">
                          Upload <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'hero_bg_image')} />
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ukuran Gambar Tengah Hero (px)</label>
                      <input type="number" name="hero_bg_image_size" value={formData.hero_bg_image_size || '128'} onChange={handleSettingChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="128" />
                      <p className="text-xs text-gray-500 mt-1">Tinggi maksimal gambar dalam pixel (default: 128).</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Template QRIS (Custom Image Link)</label>
                      <div className="flex gap-2">
                        <input type="text" name="qris_template_url" value={formData.qris_template_url || ''} onChange={handleSettingChange} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="URL Template QRIS" />
                        <label className="bg-gray-100 px-3 py-2 rounded-lg border border-gray-300 cursor-pointer hover:bg-gray-200">
                          Upload <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'qris_template_url')} />
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Posisi Teks Merchant (Posisi Y %)</label>
                      <input type="number" name="qris_text_y_pos" value={formData.qris_text_y_pos || '18'} onChange={handleSettingChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="18" />
                      <p className="text-xs text-gray-500 mt-1">Jarak dari atas gambar (dalam persentase, misal: 18).</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ukuran Teks Merchant (px)</label>
                      <input type="number" name="qris_text_size" value={formData.qris_text_size || '20'} onChange={handleSettingChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="20" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Lebar Area Teks Merchant (%)</label>
                      <input type="number" name="qris_text_width" value={formData.qris_text_width || '90'} onChange={handleSettingChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="90" />
                      <p className="text-xs text-gray-500 mt-1">Lebar maksimal teks (1-100).</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Warna Teks Merchant</label>
                      <input type="color" name="qris_text_color" value={formData.qris_text_color || '#000000'} onChange={handleSettingChange} className="w-full h-10 px-1 py-1 border border-gray-300 rounded-lg cursor-pointer" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Posisi Teks NMID (Posisi Y %)</label>
                      <input type="number" name="qris_nmid_y_pos" value={formData.qris_nmid_y_pos || '22'} onChange={handleSettingChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="22" />
                      <p className="text-xs text-gray-500 mt-1">Jarak dari atas gambar (dalam persentase, misal: 22).</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ukuran Teks NMID (px)</label>
                      <input type="number" name="qris_nmid_size" value={formData.qris_nmid_size || '14'} onChange={handleSettingChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="14" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Lebar Area Teks NMID (%)</label>
                      <input type="number" name="qris_nmid_width" value={formData.qris_nmid_width || '90'} onChange={handleSettingChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="90" />
                      <p className="text-xs text-gray-500 mt-1">Lebar maksimal teks (1-100).</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Warna Teks NMID</label>
                      <input type="color" name="qris_nmid_color" value={formData.qris_nmid_color || '#666666'} onChange={handleSettingChange} className="w-full h-10 px-1 py-1 border border-gray-300 rounded-lg cursor-pointer" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Logo Bank Indonesia (BI)</label>
                      <div className="flex gap-2">
                        <input type="text" name="logo_bi" value={formData.logo_bi || ''} onChange={handleSettingChange} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="URL Logo BI" />
                        <label className="bg-gray-100 px-3 py-2 rounded-lg border border-gray-300 cursor-pointer hover:bg-gray-200">
                          Upload <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo_bi')} />
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Teks Bank Indonesia</label>
                      <input type="text" name="text_bi" value={formData.text_bi || ''} onChange={handleSettingChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="Bank Indonesia" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Logo Kominfo</label>
                      <div className="flex gap-2">
                        <input type="text" name="logo_kominfo" value={formData.logo_kominfo || ''} onChange={handleSettingChange} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="URL Logo Kominfo" />
                        <label className="bg-gray-100 px-3 py-2 rounded-lg border border-gray-300 cursor-pointer hover:bg-gray-200">
                          Upload <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo_kominfo')} />
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Teks Kominfo</label>
                      <input type="text" name="text_kominfo" value={formData.text_kominfo || ''} onChange={handleSettingChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="Kementerian Kominfo" />
                    </div>
                  </div>

                  {/* Live Preview Section */}
                  <div className="mt-8 border-t border-gray-200 pt-6">
                    <h4 className="text-md font-bold text-gray-900 mb-4">Live Preview Template QRIS</h4>
                    <p className="text-sm text-gray-500 mb-4">Preview ini menunjukkan bagaimana nama merchant dan NMID akan ditampilkan di atas template QRIS yang Anda upload.</p>
                    <div className="max-w-sm mx-auto bg-white rounded-xl shadow-md overflow-hidden relative border border-gray-100">
                      <div className="relative w-full bg-white">
                        {formData.qris_template_url ? (
                          <img src={formData.qris_template_url} alt="QRIS Preview" className="w-full h-auto object-contain block" />
                        ) : (
                          <div className="w-full aspect-[3/4] min-h-[400px] flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                            <QrCode size={64} className="mb-2" />
                            <p className="text-sm">Upload template QRIS untuk melihat preview</p>
                          </div>
                        )}
                        <div 
                          className="absolute left-0 right-0 flex justify-center items-center pointer-events-none"
                          style={{ top: `${formData.qris_text_y_pos || 18}%` }}
                        >
                          <div 
                            className="bg-transparent px-2 py-1 text-center font-bold leading-tight"
                            style={{ 
                              fontSize: `${formData.qris_text_size || 20}px`,
                              color: formData.qris_text_color || '#000000',
                              width: `${formData.qris_text_width || 90}%`
                            }}
                          >
                            NAMA MERCHANT CONTOH
                          </div>
                        </div>
                        <div 
                          className="absolute left-0 right-0 flex justify-center items-center pointer-events-none"
                          style={{ top: `${formData.qris_nmid_y_pos || 22}%` }}
                        >
                          <div 
                            className="bg-transparent px-2 py-1 text-center font-medium leading-tight"
                            style={{ 
                              fontSize: `${formData.qris_nmid_size || 14}px`,
                              color: formData.qris_nmid_color || '#666666',
                              width: `${formData.qris_nmid_width || 90}%`
                            }}
                          >
                            NMID: ID1234567890123
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Background Settings */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-2">
                    <Video size={20} className="text-indigo-600" /> Latar Belakang & Video
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Latar Belakang Web</label>
                      <select name="bg_type" value={formData.bg_type || 'color'} onChange={handleSettingChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
                        <option value="color">Warna Solid</option>
                        <option value="image">Gambar</option>
                        <option value="video">Video</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nilai Latar Belakang</label>
                      <div className="flex gap-2">
                        {formData.bg_type === 'color' ? (
                          <input type="color" name="bg_value" value={formData.bg_value || '#f3f4f6'} onChange={handleSettingChange} className="w-full h-10 px-1 py-1 border border-gray-300 rounded-lg cursor-pointer" />
                        ) : (
                          <>
                            <input type="text" name="bg_value" value={formData.bg_value || ''} onChange={handleSettingChange} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="URL Gambar/Video" />
                            <label className="bg-gray-100 px-3 py-2 rounded-lg border border-gray-300 cursor-pointer hover:bg-gray-200">
                              Upload <input type="file" className="hidden" accept={formData.bg_type === 'video' ? 'video/*' : 'image/*'} onChange={(e) => handleFileUpload(e, 'bg_value')} />
                            </label>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Video Tutorial (Halaman Depan)</label>
                      <div className="flex gap-2">
                        <input type="text" name="tutorial_video" value={formData.tutorial_video || ''} onChange={handleSettingChange} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="URL Video MP4" />
                        <label className="bg-gray-100 px-3 py-2 rounded-lg border border-gray-300 cursor-pointer hover:bg-gray-200">
                          Upload <input type="file" className="hidden" accept="video/*" onChange={(e) => handleFileUpload(e, 'tutorial_video')} />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pop-up Settings */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-2">
                    <ImageIcon size={20} className="text-indigo-600" /> Pop-up Promo
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status Pop-up</label>
                      <select name="popup_enabled" value={formData.popup_enabled || 'false'} onChange={handleSettingChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
                        <option value="false">Nonaktif</option>
                        <option value="true">Aktif</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Link Tujuan (Opsional)</label>
                      <input type="text" name="popup_link" value={formData.popup_link || ''} onChange={handleSettingChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="https://..." />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gambar Pop-up</label>
                      <div className="flex gap-2">
                        <input type="text" name="popup_image" value={formData.popup_image || ''} onChange={handleSettingChange} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="URL Gambar" />
                        <label className="bg-gray-100 px-3 py-2 rounded-lg border border-gray-300 cursor-pointer hover:bg-gray-200">
                          Upload <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'popup_image')} />
                        </label>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Gambar ini akan muncul sebagai pop-up saat pengunjung membuka halaman depan.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Durasi Pop-up (Detik)</label>
                      <input type="number" name="popup_duration" value={formData.popup_duration || '0'} onChange={handleSettingChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="0 untuk manual close" min="0" />
                      <p className="text-xs text-gray-500 mt-1">Isi 0 jika pop-up hanya bisa ditutup manual.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Frekuensi Muncul</label>
                      <select name="popup_frequency" value={formData.popup_frequency || 'once_session'} onChange={handleSettingChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
                        <option value="once_session">Sekali per sesi (Browser dibuka)</option>
                        <option value="once_day">Sekali sehari</option>
                        <option value="always">Selalu muncul</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bisa Ditutup Manual?</label>
                      <select name="popup_closable" value={formData.popup_closable || 'true'} onChange={handleSettingChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
                        <option value="true">Ya (Tampilkan tombol X)</option>
                        <option value="false">Tidak (Hanya tertutup otomatis)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Footer Logo & Name Settings */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-2">
                    <ImageIcon size={20} className="text-indigo-600" /> Logo & Nama Web (Footer)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nama Web (Footer)</label>
                      <input type="text" name="footer_logo_name" value={formData.footer_logo_name || ''} onChange={handleSettingChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="Nama Website" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Logo Web (Footer)</label>
                      <div className="flex gap-2">
                        <input type="text" name="footer_logo_image" value={formData.footer_logo_image || ''} onChange={handleSettingChange} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="URL Logo" />
                        <label className="bg-gray-100 px-3 py-2 rounded-lg border border-gray-300 cursor-pointer hover:bg-gray-200">
                          Upload <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'footer_logo_image')} />
                        </label>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Logo ini akan ditampilkan di atas menu Kebijakan Privasi di halaman depan.</p>
                    </div>
                  </div>
                </div>

                {/* Social Media Settings */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-2">
                    <Globe size={20} className="text-indigo-600" /> Media Sosial & Tata Letak (Footer)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tata Letak Footer</label>
                      <select name="footer_layout_style" value={formData.footer_layout_style || 'left_right'} onChange={handleSettingChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
                        <option value="left_right">Kiri (Menu) - Kanan (Sosmed/Lokasi)</option>
                        <option value="right_left">Kiri (Sosmed/Lokasi) - Kanan (Menu)</option>
                        <option value="center">Tengah (Semua di tengah)</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">YouTube URL</label>
                      <input type="text" name="social_youtube" value={formData.social_youtube || ''} onChange={handleSettingChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="https://youtube.com/..." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Instagram URL</label>
                      <input type="text" name="social_instagram" value={formData.social_instagram || ''} onChange={handleSettingChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="https://instagram.com/..." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Facebook URL</label>
                      <input type="text" name="social_facebook" value={formData.social_facebook || ''} onChange={handleSettingChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="https://facebook.com/..." />
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button type="submit" disabled={loading} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-70">
                    {loading ? <Loader2 size={20} className="animate-spin" /> : null}
                    {loading ? 'Menyimpan...' : 'Simpan Pengaturan'}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'tickets' && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-2">
                  <MessageCircle size={20} className="text-indigo-600" /> Bantuan Tiket
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="p-3 text-sm font-semibold text-gray-600">ID</th>
                        <th className="p-3 text-sm font-semibold text-gray-600">User</th>
                        <th className="p-3 text-sm font-semibold text-gray-600">Subjek</th>
                        <th className="p-3 text-sm font-semibold text-gray-600">Status</th>
                        <th className="p-3 text-sm font-semibold text-gray-600">Tanggal</th>
                        <th className="p-3 text-sm font-semibold text-gray-600 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tickets.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-gray-500">
                            Belum ada tiket
                          </td>
                        </tr>
                      ) : (
                        tickets.map((ticket) => (
                          <tr key={ticket.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                            <td className="p-3 text-sm text-gray-900">#{ticket.id}</td>
                            <td className="p-3 text-sm text-gray-900">
                              <div>{ticket.user_name}</div>
                              <div className="text-xs text-gray-500">{ticket.user_email}</div>
                            </td>
                            <td className="p-3 text-sm text-gray-900">{ticket.subject}</td>
                            <td className="p-3 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                ticket.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                                ticket.status === 'answered' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {ticket.status === 'open' ? 'Menunggu' : ticket.status === 'answered' ? 'Dijawab' : 'Selesai'}
                              </span>
                            </td>
                            <td className="p-3 text-sm text-gray-500">{new Date(ticket.created_at).toLocaleDateString('id-ID')}</td>
                            <td className="p-3 text-sm text-center">
                              <button 
                                onClick={() => handleSelectTicketAdmin(ticket)}
                                className="text-indigo-600 hover:text-indigo-800 font-medium text-sm bg-indigo-50 px-3 py-1 rounded-lg transition"
                              >
                                Balas
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'landing_text' && (
              <form onSubmit={handleSaveSettings} className="space-y-8">
                {/* Hero Section Text */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Teks Bagian Atas (Hero)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Teks Badge (Kiri Atas)</label>
                      <input type="text" name="hero_badge_text" value={formData.hero_badge_text || ''} onChange={handleSettingChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="Resmi & Terpercaya" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fitur Singkat 1</label>
                      <input type="text" name="hero_feature_1" value={formData.hero_feature_1 || ''} onChange={handleSettingChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="Proses Otomatis" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fitur Singkat 2</label>
                      <input type="text" name="hero_feature_2" value={formData.hero_feature_2 || ''} onChange={handleSettingChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="Tanpa Biaya Tersembunyi" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fitur Singkat 3</label>
                      <input type="text" name="hero_feature_3" value={formData.hero_feature_3 || ''} onChange={handleSettingChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="Support 24/7" />
                    </div>
                  </div>
                </div>

                {/* Trust Section Text */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Teks Bagian Kepercayaan (Trust)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Judul Kepercayaan</label>
                      <input type="text" name="trust_title" value={formData.trust_title || ''} onChange={handleSettingChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="Diawasi & Terdaftar Resmi Oleh" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Teks Merchant 1</label>
                      <input type="text" name="trust_item_1" value={formData.trust_item_1 || ''} onChange={handleSettingChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="Toko Retail" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Teks Merchant 2</label>
                      <input type="text" name="trust_item_2" value={formData.trust_item_2 || ''} onChange={handleSettingChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="F&B Cafe" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Teks Merchant 3</label>
                      <input type="text" name="trust_item_3" value={formData.trust_item_3 || ''} onChange={handleSettingChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="Jasa Online" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Teks Merchant 4</label>
                      <input type="text" name="trust_item_4" value={formData.trust_item_4 || ''} onChange={handleSettingChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="Minimarket" />
                    </div>
                  </div>
                </div>

                {/* Features Section Text */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Teks Bagian Fitur</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Judul Fitur Utama</label>
                      <input type="text" name="features_title" value={formData.features_title || ''} onChange={handleSettingChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="Kenapa Memilih Kami?" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sub-judul Fitur Utama</label>
                      <input type="text" name="features_subtitle" value={formData.features_subtitle || ''} onChange={handleSettingChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="Kami memberikan layanan pembuatan QRIS terbaik..." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Judul Fitur 1</label>
                      <input type="text" name="feature_1_title" value={formData.feature_1_title || ''} onChange={handleSettingChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="Proses Cepat" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Fitur 1</label>
                      <input type="text" name="feature_1_desc" value={formData.feature_1_desc || ''} onChange={handleSettingChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="Daftar hari ini, QRIS Anda akan otomatis jadi..." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Judul Fitur 2</label>
                      <input type="text" name="feature_2_title" value={formData.feature_2_title || ''} onChange={handleSettingChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="Aman & Terpercaya" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Fitur 2</label>
                      <input type="text" name="feature_2_desc" value={formData.feature_2_desc || ''} onChange={handleSettingChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="Data Anda dijamin keamanannya..." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Judul Fitur 3</label>
                      <input type="text" name="feature_3_title" value={formData.feature_3_title || ''} onChange={handleSettingChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="Otomatis" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Fitur 3</label>
                      <input type="text" name="feature_3_desc" value={formData.feature_3_desc || ''} onChange={handleSettingChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="Sistem kami berjalan secara otomatis..." />
                    </div>
                  </div>
                </div>

                {/* Steps Section Text */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Teks Bagian Cara Membuat</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Judul Cara Membuat</label>
                      <input type="text" name="steps_title" value={formData.steps_title || ''} onChange={handleSettingChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="Cara Membuat QRIS Merchant" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sub-judul Cara Membuat</label>
                      <input type="text" name="steps_subtitle" value={formData.steps_subtitle || ''} onChange={handleSettingChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="Ikuti langkah mudah berikut..." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Judul Langkah 1</label>
                      <input type="text" name="step_1_title" value={formData.step_1_title || ''} onChange={handleSettingChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="Daftar Akun" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Langkah 1</label>
                      <input type="text" name="step_1_desc" value={formData.step_1_desc || ''} onChange={handleSettingChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="Buat akun baru dengan mengisi data diri..." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Judul Langkah 2</label>
                      <input type="text" name="step_2_title" value={formData.step_2_title || ''} onChange={handleSettingChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="Isi Data Merchant" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Langkah 2</label>
                      <input type="text" name="step_2_desc" value={formData.step_2_desc || ''} onChange={handleSettingChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="Masuk ke dashboard dan isi nama merchant..." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Judul Langkah 3</label>
                      <input type="text" name="step_3_title" value={formData.step_3_title || ''} onChange={handleSettingChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="Tunggu 1 Hari Kerja" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Langkah 3</label>
                      <input type="text" name="step_3_desc" value={formData.step_3_desc || ''} onChange={handleSettingChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="Sistem akan memproses pengajuan Anda..." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Judul Langkah 4</label>
                      <input type="text" name="step_4_title" value={formData.step_4_title || ''} onChange={handleSettingChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="QRIS Siap Digunakan" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Langkah 4</label>
                      <input type="text" name="step_4_desc" value={formData.step_4_desc || ''} onChange={handleSettingChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="QRIS otomatis muncul di dashboard Anda..." />
                    </div>
                  </div>
                </div>

                {/* Privacy & Terms Section */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Kebijakan Privasi & Layanan Privasi</h3>
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Teks Kebijakan Privasi</label>
                      <textarea 
                        name="privacy_policy_text" 
                        value={formData.privacy_policy_text || ''} 
                        onChange={handleSettingChange} 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" 
                        rows={6}
                        placeholder="Masukkan teks kebijakan privasi di sini..."
                      ></textarea>
                      <p className="text-xs text-gray-500 mt-1">Gunakan baris baru (Enter) untuk memisahkan paragraf.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Teks Layanan Privasi (Terms of Service)</label>
                      <textarea 
                        name="terms_of_service_text" 
                        value={formData.terms_of_service_text || ''} 
                        onChange={handleSettingChange} 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" 
                        rows={6}
                        placeholder="Masukkan teks layanan privasi di sini..."
                      ></textarea>
                      <p className="text-xs text-gray-500 mt-1">Gunakan baris baru (Enter) untuk memisahkan paragraf.</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button type="submit" disabled={loading} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-70">
                    {loading ? <Loader2 size={20} className="animate-spin" /> : null}
                    {loading ? 'Menyimpan...' : 'Simpan Pengaturan'}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'users' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lokasi</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {u.kota ? `${u.kota}, ${u.provinsi}` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.role}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${u.is_banned ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                            {u.is_banned ? 'Banned' : 'Active'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {u.role !== 'admin' && (
                            <button 
                              onClick={() => handleBanUser(u.id, !u.is_banned)}
                              className={`${u.is_banned ? 'text-green-600 hover:text-green-900' : 'text-red-600 hover:text-red-900'}`}
                            >
                              {u.is_banned ? 'Unban' : 'Ban'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'qris' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pengguna</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Info Usaha</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Merchant</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NMID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Custom Link</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {qrisApps.map((q) => (
                      <tr key={q.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{q.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{q.user_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex flex-col gap-1">
                            <span className="capitalize font-medium">{q.business_type || 'Perorangan'}</span>
                            <span>{q.store_name || '-'}</span>
                            {q.business_photo && (
                              <a href={q.business_photo} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline text-xs">Lihat Foto</a>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <input 
                            type="text" 
                            defaultValue={q.merchant_name || ''} 
                            onBlur={(e) => handleUpdateQris(q.id, q.status, q.custom_link, e.target.value, q.nmid)}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Nama Merchant"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <input 
                            type="text" 
                            defaultValue={q.nmid || ''} 
                            onBlur={(e) => handleUpdateQris(q.id, q.status, q.custom_link, q.merchant_name, e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="NMID"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <select 
                            value={q.status} 
                            onChange={(e) => handleUpdateQris(q.id, e.target.value, q.custom_link, q.merchant_name, q.nmid)}
                            className="text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          >
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <input 
                            type="text" 
                            defaultValue={q.custom_link || ''} 
                            onBlur={(e) => handleUpdateQris(q.id, q.status, e.target.value, q.merchant_name, q.nmid)}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Custom Link"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(q.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Ticket Reply Modal */}
      <AnimatePresence>
        {selectedTicketAdmin && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
              onClick={() => setSelectedTicketAdmin(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{selectedTicketAdmin.subject}</h2>
                  <p className="text-xs text-gray-500">Dari: {selectedTicketAdmin.user_name} ({selectedTicketAdmin.user_email})</p>
                </div>
                <div className="flex items-center gap-3">
                  {selectedTicketAdmin.status !== 'closed' && (
                    <button
                      onClick={handleCloseTicketAdmin}
                      className="text-xs bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1 rounded-full font-medium transition"
                    >
                      Tutup Tiket
                    </button>
                  )}
                  <button onClick={() => setSelectedTicketAdmin(null)} className="text-gray-400 hover:text-gray-600">
                    <X size={24} />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
                {ticketMessages.map((msg) => {
                  const isOwnMessage = msg.sender_type === 'admin';
                  return (
                    <div key={msg.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-4 rounded-2xl ${
                        isOwnMessage 
                          ? 'bg-indigo-600 text-white rounded-tr-sm' 
                          : 'bg-white border border-gray-200 text-gray-800 shadow-sm rounded-tl-sm'
                      }`}>
                        <div className="flex items-center gap-2 mb-1 opacity-80 text-xs">
                          <span className="font-bold">{isOwnMessage ? 'Admin' : 'Pengguna'}</span>
                          <span>•</span>
                          <span>{new Date(msg.created_at).toLocaleString('id-ID')}</span>
                        </div>
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 border-t border-gray-100 bg-white">
                <form onSubmit={handleReplyAdmin} className="flex gap-3 items-end">
                  <textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder={selectedTicketAdmin.status === 'closed' ? "Tiket sudah ditutup. Ketik balasan untuk membuka kembali tiket ini..." : "Ketik balasan Anda secara detail..."}
                    rows={3}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleReplyAdmin(e);
                      }
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!replyMessage.trim() || replying}
                    className="bg-indigo-600 text-white px-5 py-3 rounded-xl font-medium hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center min-w-[100px] h-[50px]"
                  >
                    {replying ? <Loader2 size={18} className="animate-spin" /> : <><Send size={18} className="mr-2" /> Kirim</>}
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
