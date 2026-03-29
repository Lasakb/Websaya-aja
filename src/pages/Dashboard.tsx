import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Wallet, QrCode, Upload, User as UserIcon, CheckCircle, Clock, AlertCircle, Download, Loader2, ShieldAlert, DollarSign, Activity, TrendingUp, Bell } from 'lucide-react';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const { user, token, updateUser } = useAuth();
  const { settings } = useSettings();
  const { t } = useLanguage();
  const [qrisApp, setQrisApp] = useState<any>(null);
  const [merchantName, setMerchantName] = useState('');
  const [businessType, setBusinessType] = useState('perorangan');
  const [storeName, setStoreName] = useState('');
  const [businessPhoto, setBusinessPhoto] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [topupAmount, setTopupAmount] = useState('');
  const [topupMethod, setTopupMethod] = useState('');
  const [topupProof, setTopupProof] = useState('');
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [transactionNominal, setTransactionNominal] = useState('');
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalTransactions: 0,
    recentTransactions: [] as any[]
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const businessPhotoInputRef = useRef<HTMLInputElement>(null);
  const topupProofInputRef = useRef<HTMLInputElement>(null);
  const qrisCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchQrisApp();
    fetchStats();
    
    // Anti-screenshot / Anti-snipping tool logic
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen') {
        navigator.clipboard.writeText(''); // Attempt to clear clipboard
        toast.error(t('screenshot_not_allowed'), { id: 'screenshot-warn' });
      }
    };

    window.addEventListener('keyup', handleKeyDown);

    return () => {
      window.removeEventListener('keyup', handleKeyDown);
    };
  }, [token]);

  useEffect(() => {
    let interval: any;
    if (timeLeft !== null && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (timeLeft === 0) {
      setTimeLeft(null);
      setTransactionNominal('');
      toast.error(t('transaction_timeout'));
    }
    return () => clearInterval(interval);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const fetchQrisApp = async () => {
    try {
      const res = await fetch('/api/qris/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setQrisApp(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch stats', err);
    }
  };

  const handleApplyQris = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/qris', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          merchant_name: merchantName,
          business_type: businessType,
          store_name: storeName,
          business_photo: businessPhoto
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success(data.message);
      fetchQrisApp();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBusinessPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
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
        setBusinessPhoto(data.url);
        toast.success(t('business_photo_uploaded'));
      } else {
        throw new Error(data.error || 'Gagal mengunggah foto');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleTopupProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingProof(true);
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
        setTopupProof(data.url);
        toast.success(t('transfer_proof_uploaded'));
      } else {
        throw new Error(data.error || 'Gagal mengunggah bukti');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsUploadingProof(false);
    }
  };

  const handleTopup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topupProof) {
      toast.error(t('upload_transfer_proof_first'));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/topup', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ amount: Number(topupAmount) }),
      });

      if (res.ok) {
        updateUser({ balance: (user?.balance || 0) + Number(topupAmount) });
        setTopupAmount('');
        setTopupMethod('');
        setTopupProof('');
        toast.success(t('topup_success'));
        fetchStats();
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Top up gagal');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

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
        // Update user profile
        await fetch('/api/users/profile', {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ name: user?.name, profile_image: data.url })
        });
        updateUser({ profile_image: data.url });
        toast.success(t('profile_photo_updated'));
      } else {
        throw new Error(data.error || 'Gagal mengunggah foto');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadQris = async () => {
    if (!qrisApp) return;
    setIsDownloading(true);
    toast.loading(t('preparing_image'), { id: 'download-qris' });
    try {
      let url = '';
      
      if (settings?.qris_template_url) {
        // Native canvas approach for better reliability and perfect quality
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas not supported');
        
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = settings.qris_template_url;
        
        await new Promise((resolve, reject) => { 
          img.onload = resolve; 
          img.onerror = reject;
        });

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Calculate text position based on original image dimensions
        const yPos = (Number(settings.qris_text_y_pos || 18) / 100) * canvas.height;
        
        // Scale font size relative to image width (assuming base width of ~400px for the 20px font size)
        const scaleFactor = canvas.width / 400;
        const fontSize = Number(settings.qris_text_size || 20) * scaleFactor;
        
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.fillStyle = settings.qris_text_color || '#000000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(qrisApp.merchant_name, canvas.width / 2, yPos);

        url = canvas.toDataURL('image/png');
      } else {
        // Fallback to html2canvas if no template
        if (!qrisCardRef.current) throw new Error('Ref not found');
        
        const canvas = await html2canvas(qrisCardRef.current, { scale: 3, useCORS: true, backgroundColor: '#ffffff' });
        url = canvas.toDataURL('image/png');
      }

      const link = document.createElement('a');
      link.download = `QRIS-${qrisApp.merchant_name}.png`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(t('qris_downloaded'), { id: 'download-qris' });
    } catch (err) {
      console.error('Failed to download QRIS', err);
      toast.error(t('qris_download_failed'), { id: 'download-qris' });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10"
    >
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar / Profile */}
        <div className="w-full md:w-1/3 lg:w-1/4 space-y-6">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center"
          >
            <div className="relative inline-block mb-4">
              {user?.profile_image ? (
                <img src={user.profile_image} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-indigo-50 mx-auto" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mx-auto border-4 border-indigo-50">
                  <UserIcon size={40} />
                </div>
              )}
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 transition shadow-lg disabled:opacity-70 active:scale-95"
              >
                {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleProfileUpload} 
                className="hidden" 
                accept="image/*"
              />
            </div>
            <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
            <p className="text-gray-500 text-sm mb-6">{user?.email}</p>
            
            <div className="bg-indigo-50 rounded-xl p-4 text-left">
              <div className="flex items-center gap-2 text-indigo-600 mb-1">
                <Wallet size={18} />
                <span className="font-medium text-sm">{settings?.balance_text || t('balance')}</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                Rp {user?.balance?.toLocaleString('id-ID')}
              </div>
            </div>
          </motion.div>

          {/* News Announcement Marquee */}
          {settings?.news_content && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="bg-blue-50 border border-blue-100 rounded-xl overflow-hidden flex items-center px-4 py-3 shadow-sm"
            >
              <Bell size={18} className="text-blue-600 mr-3 flex-shrink-0" />
              <div className="overflow-hidden whitespace-nowrap w-full relative">
                <div className="inline-block animate-marquee text-sm text-blue-800 font-medium">
                  {settings.news_content.replace(/\n/g, ' • ')}
                </div>
              </div>
            </motion.div>
          )}

          {/* Top Up Form */}
          {settings?.enable_topup !== 'false' && (
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
            >
              <h3 className="font-bold text-gray-900 mb-4">{t('top_up_balance')}</h3>
              <form onSubmit={handleTopup} className="space-y-4">
                <input
                  type="number"
                  required
                  min="10000"
                  placeholder={t('top_up_amount_placeholder')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(e.target.value)}
                />
                
                <select
                  required
                  value={topupMethod}
                  onChange={(e) => setTopupMethod(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none bg-white"
                >
                  <option value="" disabled>{t('choose_payment_method')}</option>
                  <option value="dana">DANA</option>
                  <option value="gopay">GoPay</option>
                </select>

                {topupMethod && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-sm">
                    <p className="text-gray-600 mb-2">{t('transfer_to')}</p>
                    <div className="font-bold text-lg text-gray-900 mb-4">
                      {topupMethod === 'dana' ? (settings?.dana_number || '-') : (settings?.gopay_number || '-')}
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-gray-700 font-medium">{t('upload_transfer_proof')}</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          placeholder={t('no_proof')}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-500 outline-none text-sm"
                          value={topupProof ? t('proof_uploaded_short') : ''}
                        />
                        <button
                          type="button"
                          onClick={() => topupProofInputRef.current?.click()}
                          disabled={isUploadingProof}
                          className="px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg font-medium hover:bg-indigo-200 transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
                        >
                          {isUploadingProof ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                          {t('upload')}
                        </button>
                        <input
                          type="file"
                          ref={topupProofInputRef}
                          className="hidden"
                          accept="image/*"
                          onChange={handleTopupProofUpload}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !topupProof}
                  className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition-all active:scale-[0.98] disabled:opacity-70 flex justify-center items-center gap-2"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : t('confirm_top_up')}
                </button>
              </form>
            </motion.div>
          )}
        </div>

        {/* Main Content */}
        <div className="w-full md:w-2/3 lg:w-3/4 space-y-6">
          {/* Stats Grid */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <DollarSign size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{t('total_income')}</p>
                <h3 className="text-xl font-bold text-gray-900">Rp {stats.totalIncome.toLocaleString('id-ID')}</h3>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <Activity size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{t('total_transactions')}</p>
                <h3 className="text-xl font-bold text-gray-900">{stats.totalTransactions}</h3>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{t('recent_transactions')}</p>
                <h3 className="text-xl font-bold text-gray-900">
                  {stats.recentTransactions.length > 0 
                    ? `Rp ${stats.recentTransactions[0].amount.toLocaleString('id-ID')}` 
                    : 'Rp 0'}
                </h3>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <QrCode className="text-indigo-600" />
              {t('qris_merchant_status')}
            </h2>

            {!qrisApp ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gray-50 rounded-xl p-8 border border-gray-200 text-center"
              >
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <QrCode size={32} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{t('no_qris_yet')}</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">{t('qris_process_time')}</p>
                
                <form onSubmit={handleApplyQris} className="max-w-md mx-auto text-left space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('business_type')}</label>
                    <select
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none bg-white"
                    >
                      <option value="perorangan">{t('individual')}</option>
                      <option value="bisnis">{t('business')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('store_name')}</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Toko Berkah Jaya"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('merchant_name')}</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: BERKAH JAYA"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none uppercase"
                      value={merchantName}
                      onChange={(e) => setMerchantName(e.target.value.toUpperCase())}
                    />
                    <p className="text-xs text-gray-500 mt-1">{t('merchant_name_hint')}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('business_photo')}</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        placeholder={t('upload_business_photo')}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 outline-none text-sm"
                        value={businessPhoto ? t('photo_uploaded') : ''}
                      />
                      <button
                        type="button"
                        onClick={() => businessPhotoInputRef.current?.click()}
                        disabled={isUploadingPhoto}
                        className="px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg font-medium hover:bg-indigo-200 transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
                      >
                        {isUploadingPhoto ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                        {t('upload')}
                      </button>
                      <input
                        type="file"
                        ref={businessPhotoInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleBusinessPhotoUpload}
                      />
                    </div>
                    {businessPhoto && (
                      <div className="mt-2 w-full h-32 rounded-lg overflow-hidden border border-gray-200">
                        <img src={businessPhoto} alt={t('business_photo')} className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !businessPhoto}
                    className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition-all active:scale-[0.98] disabled:opacity-70 flex justify-center items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        {t('processing')}
                      </>
                    ) : (
                      t('create_qris_now')
                    )}
                  </button>
                </form>
              </motion.div>
            ) : qrisApp.status === 'pending' ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-amber-50 rounded-xl p-8 border border-amber-200 text-center"
              >
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-600">
                  <Clock size={32} />
                </div>
                <h3 className="text-xl font-bold text-amber-900 mb-2">{t('application_processing')}</h3>
                <p className="text-amber-700 max-w-md mx-auto">
                  {t('qris_processing_desc')}
                </p>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-50 rounded-xl p-8 border border-green-200 text-center"
              >
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                  <CheckCircle size={32} />
                </div>
                <h3 className="text-xl font-bold text-green-900 mb-2">{t('qris_active')}</h3>
                <p className="text-green-700 mb-8">{t('merchant')}: <strong>{qrisApp.merchant_name}</strong></p>
                
                <div 
                  ref={qrisCardRef} 
                  className="max-w-sm mx-auto bg-white rounded-xl shadow-md overflow-hidden relative border border-gray-100 transition-all duration-300"
                  onContextMenu={(e) => { 
                    e.preventDefault(); 
                    toast.error(t('save_image_not_allowed'), { id: 'no-save' }); 
                  }}
                  onDragStart={(e) => e.preventDefault()}
                >
                  {settings?.qris_template_url ? (
                    <div className="relative w-full bg-white">
                      <img src={settings.qris_template_url} alt="QRIS" className="w-full h-auto object-contain block pointer-events-none" draggable="false" />
                      <div 
                        className="absolute left-0 right-0 flex justify-center items-center pointer-events-none"
                        style={{ top: `${settings.qris_text_y_pos || 18}%` }}
                      >
                        <div 
                          className="bg-transparent px-2 py-1 text-center font-bold leading-tight"
                          style={{ 
                            fontSize: `${settings.qris_text_size || 20}px`,
                            color: settings.qris_text_color || '#000000',
                            width: `${settings.qris_text_width || 90}%`
                          }}
                        >
                          {qrisApp.merchant_name}
                        </div>
                      </div>
                      {qrisApp.nmid && (
                        <div 
                          className="absolute left-0 right-0 flex justify-center items-center pointer-events-none"
                          style={{ top: `${settings.qris_nmid_y_pos || 22}%` }}
                        >
                          <div 
                            className="bg-transparent px-2 py-1 text-center font-medium leading-tight"
                            style={{ 
                              fontSize: `${settings.qris_nmid_size || 14}px`,
                              color: settings.qris_nmid_color || '#666666',
                              width: `${settings.qris_nmid_width || 90}%`
                            }}
                          >
                            NMID: {qrisApp.nmid}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-6">
                      <h4 className="font-bold text-center mb-4 text-lg">{qrisApp.merchant_name}</h4>
                      <div className="aspect-square bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                        <QrCode size={120} className="text-gray-400" />
                      </div>
                      {qrisApp.nmid && <p className="text-xs text-center text-gray-500">NMID: {qrisApp.nmid}</p>}
                    </div>
                  )}
                </div>
                
                <div className="mt-6 max-w-sm mx-auto">
                  {timeLeft === null ? (
                    <div className="space-y-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                      <h4 className="font-bold text-gray-900 text-left">{t('create_new_transaction')}</h4>
                      <div>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 font-medium">Rp</span>
                          </div>
                          <input
                            type="number"
                            min="10000"
                            value={transactionNominal}
                            onChange={(e) => setTransactionNominal(e.target.value)}
                            className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                            placeholder="10000"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (!transactionNominal || Number(transactionNominal) < 10000) {
                            toast.error(t('min_transaction'));
                            return;
                          }
                          setTimeLeft(300); // 5 minutes
                          toast.success(t('transaction_created'));
                          
                          // Scroll to QRIS card smoothly
                          if (qrisCardRef.current) {
                            qrisCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }
                        }}
                        className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-all active:scale-95"
                      >
                        {t('apply')}
                      </button>
                    </div>
                  ) : (
                    <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm animate-pulse-light">
                      <p className="text-sm text-gray-500 mb-1">{t('waiting_payment')}</p>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Rp {Number(transactionNominal).toLocaleString('id-ID')}</h3>
                      <div className="flex items-center justify-center gap-2 text-amber-600 font-medium bg-amber-50 py-2 rounded-lg">
                        <Clock size={18} />
                        <span>{t('time_remaining')}: {formatTime(timeLeft)}</span>
                      </div>
                      <button
                        onClick={() => {
                          setTimeLeft(null);
                          setTransactionNominal('');
                        }}
                        className="mt-4 w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-all active:scale-95 text-sm"
                      >
                        {t('cancel_transaction')}
                      </button>
                    </div>
                  )}
                </div>

                {qrisApp.custom_link && (
                  <div className="mt-6">
                    <p className="text-sm text-gray-600 mb-2">{t('custom_merchant_link')}</p>
                    <a href={qrisApp.custom_link} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 font-medium underline">
                      {qrisApp.custom_link}
                    </a>
                  </div>
                )}
                
                <button 
                  onClick={handleDownloadQris}
                  disabled={isDownloading}
                  className="mt-6 bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-all active:scale-95 flex items-center gap-2 mx-auto disabled:opacity-70"
                >
                  {isDownloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                  {isDownloading ? t('downloading') : t('download_qris')}
                </button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
