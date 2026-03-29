import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';
import { useLanguage } from '../contexts/LanguageContext';
import { QrCode, Zap, ShieldCheck, Clock, CheckCircle2, Building2, Phone, Mail, Shield, FileText, MapPin, X, Youtube, Instagram, Facebook } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const { settings } = useSettings();
  const { t } = useLanguage();
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    if (settings?.popup_enabled === 'true' && settings?.popup_image) {
      const frequency = settings.popup_frequency || 'once_session';
      let shouldShow = false;

      if (frequency === 'always') {
        shouldShow = true;
      } else if (frequency === 'once_day') {
        const lastSeen = localStorage.getItem('lastSeenPopupDate');
        const today = new Date().toDateString();
        if (lastSeen !== today) {
          shouldShow = true;
        }
      } else {
        // once_session
        const hasSeenPopup = sessionStorage.getItem('hasSeenPopup');
        if (!hasSeenPopup) {
          shouldShow = true;
        }
      }

      if (shouldShow) {
        const timer = setTimeout(() => {
          setShowPopup(true);
          
          // Auto close logic
          const duration = parseInt(settings.popup_duration || '0', 10);
          if (duration > 0) {
            setTimeout(() => {
              closePopup();
            }, duration * 1000);
          }
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [settings]);

  const closePopup = () => {
    setShowPopup(false);
    const frequency = settings?.popup_frequency || 'once_session';
    
    if (frequency === 'once_day') {
      localStorage.setItem('lastSeenPopupDate', new Date().toDateString());
    } else if (frequency === 'once_session') {
      sessionStorage.setItem('hasSeenPopup', 'true');
    }
  };

  return (
    <div className="flex flex-col items-center w-full relative">
      {/* Pop-up Promo */}
      <AnimatePresence>
        {showPopup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative max-w-lg w-full bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              {settings?.popup_closable !== 'false' && (
                <button 
                  onClick={closePopup}
                  className="absolute top-3 right-3 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-colors"
                >
                  <X size={20} />
                </button>
              )}
              {settings?.popup_link ? (
                <a href={settings.popup_link} target="_blank" rel="noopener noreferrer" onClick={settings?.popup_closable !== 'false' ? closePopup : undefined}>
                  <img src={settings.popup_image} alt="Promo" className="w-full h-auto object-cover" />
                </a>
              ) : (
                <img src={settings.popup_image} alt="Promo" className="w-full h-auto object-cover" />
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Background Motif / Pattern */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
      
      {/* Hero Section */}
      <section className="w-full relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-50/80 via-white to-blue-50/80 overflow-hidden border-b border-indigo-100/50">
        {/* Decorative Blobs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob z-0"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000 z-0"></div>
        <div className="absolute -bottom-32 left-1/2 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000 z-0"></div>

        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 relative z-10">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex-1 text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 font-medium text-sm mb-6 border border-indigo-200 shadow-sm">
              <ShieldCheck size={16} /> {settings?.hero_badge_text || t('hero_badge')}
            </div>
            
            {settings?.hero_bg_image && (
              <div className="mb-6 flex justify-center lg:justify-start">
                <img 
                  src={settings.hero_bg_image} 
                  alt="Custom Hero" 
                  className="w-auto object-contain drop-shadow-sm" 
                  style={{ maxHeight: `${settings.hero_bg_image_size || '128'}px` }}
                />
              </div>
            )}

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight mb-6 leading-tight">
              {settings?.header_title || 'Buat QRIS Merchant Anda Sekarang'}
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              {settings?.page_description || 'Platform pembuatan QRIS Merchant otomatis. Daftar hari ini, besok jam 1 siang QRIS Anda sudah jadi dan siap digunakan.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link to="/register" className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition shadow-lg hover:shadow-indigo-500/30 transform hover:-translate-y-1 flex items-center justify-center gap-2">
                <QrCode size={20} /> {t('start_now')}
              </Link>
              <a href="#tutorial" className="bg-white text-indigo-600 border-2 border-indigo-100 px-8 py-4 rounded-xl font-bold text-lg hover:bg-indigo-50 transition flex items-center justify-center">
                {t('view_tutorial')}
              </a>
            </div>
            
            <div className="mt-10 pt-6 border-t border-gray-200/60 flex flex-col sm:flex-row items-center gap-6 justify-center lg:justify-start text-sm text-gray-500 font-medium">
              <div className="flex items-center gap-2"><CheckCircle2 className="text-green-500" size={18} /> {settings?.hero_feature_1 || t('hero_feature_1')}</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="text-green-500" size={18} /> {settings?.hero_feature_2 || t('hero_feature_2')}</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="text-green-500" size={18} /> {settings?.hero_feature_3 || t('hero_feature_3')}</div>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex-1 w-full max-w-lg relative"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-200 to-blue-200 rounded-full blur-3xl opacity-40 animate-pulse"></div>
            <div className="relative bg-white p-4 rounded-3xl shadow-2xl border border-gray-100/50 transform rotate-2 hover:rotate-0 transition duration-500">
              {settings?.hero_image ? (
                <img src={settings.hero_image} alt="Hero" className="w-full h-auto rounded-2xl object-cover" />
              ) : (
                <div className="w-full aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex flex-col items-center justify-center p-8 border border-gray-200 border-dashed">
                  <QrCode size={120} className="text-indigo-400 mb-4" />
                  <p className="text-gray-400 font-medium text-center">{t('qris_illustration')}</p>
                </div>
              )}
              {/* Floating Badge */}
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-4 animate-bounce" style={{ animationDuration: '3s' }}>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">{t('security_status')}</p>
                  <p className="font-bold text-gray-900">{t('verified')}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="w-full py-12 bg-white border-b border-gray-100 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-7xl mx-auto px-4 text-center"
        >
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-8">{settings?.trust_title || t('trust_title')}</p>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24">
            {/* Bank Indonesia Logo */}
            <div className="flex flex-col items-center gap-3 transition-all duration-300 hover:-translate-y-1">
              {settings?.logo_bi ? (
                <img src={settings.logo_bi} alt={settings?.text_bi || 'Bank Indonesia'} className="h-16 object-contain drop-shadow-md" />
              ) : (
                <div className="w-16 h-16 bg-blue-900 rounded-full flex items-center justify-center text-white font-serif font-bold text-2xl shadow-md">
                  BI
                </div>
              )}
              <span className="font-bold text-sm text-gray-900">{settings?.text_bi || 'Bank Indonesia'}</span>
            </div>
            
            {/* Kominfo Logo */}
            <div className="flex flex-col items-center gap-3 transition-all duration-300 hover:-translate-y-1">
              {settings?.logo_kominfo ? (
                <img src={settings.logo_kominfo} alt={settings?.text_kominfo || 'Kementerian Kominfo'} className="h-16 object-contain drop-shadow-md" />
              ) : (
                <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center text-white font-sans font-black text-xl shadow-md transform rotate-3">
                  KOMINFO
                </div>
              )}
              <span className="font-bold text-sm text-gray-900">{settings?.text_kominfo || 'Kementerian Kominfo'}</span>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-gray-100 flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale text-sm">
            <div className="flex items-center gap-2 font-bold text-gray-600"><Building2 size={18} /> {settings?.trust_item_1 || t('trust_item_1')}</div>
            <div className="flex items-center gap-2 font-bold text-gray-600"><Building2 size={18} /> {settings?.trust_item_2 || t('trust_item_2')}</div>
            <div className="flex items-center gap-2 font-bold text-gray-600"><Building2 size={18} /> {settings?.trust_item_3 || t('trust_item_3')}</div>
            <div className="flex items-center gap-2 font-bold text-gray-600"><Building2 size={18} /> {settings?.trust_item_4 || t('trust_item_4')}</div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="w-full py-24 bg-gray-50/50 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{settings?.features_title || t('features_title')}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">{settings?.features_subtitle || t('features_subtitle')}</p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-gray-50 p-8 rounded-2xl border border-gray-100 hover:shadow-lg transition"
            >
              <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
                <Zap className="text-indigo-600" size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{settings?.feature_1_title || t('feature_1_title')}</h3>
              <p className="text-gray-600">{settings?.feature_1_desc || t('feature_1_desc')}</p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-gray-50 p-8 rounded-2xl border border-gray-100 hover:shadow-lg transition"
            >
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <ShieldCheck className="text-green-600" size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{settings?.feature_2_title || t('feature_2_title')}</h3>
              <p className="text-gray-600">{settings?.feature_2_desc || t('feature_2_desc')}</p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="bg-gray-50 p-8 rounded-2xl border border-gray-100 hover:shadow-lg transition"
            >
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <Clock className="text-blue-600" size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{settings?.feature_3_title || t('feature_3_title')}</h3>
              <p className="text-gray-600">{settings?.feature_3_desc || t('feature_3_desc')}</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Tutorial Section */}
      <section id="tutorial" className="w-full py-24 bg-white px-4 sm:px-6 lg:px-8 relative z-10 border-t border-gray-100">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{settings?.steps_title || t('steps_title')}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">{settings?.steps_subtitle || t('steps_subtitle')}</p>
          </motion.div>
          
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex-1 space-y-8"
            >
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0">1</div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">{settings?.step_1_title || t('step_1_title')}</h4>
                  <p className="text-gray-600">{settings?.step_1_desc || t('step_1_desc')}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0">2</div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">{settings?.step_2_title || t('step_2_title')}</h4>
                  <p className="text-gray-600">{settings?.step_2_desc || t('step_2_desc')}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0">3</div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">{settings?.step_3_title || t('step_3_title')}</h4>
                  <p className="text-gray-600">{settings?.step_3_desc || t('step_3_desc')}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold shrink-0">4</div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">{settings?.step_4_title || t('step_4_title')}</h4>
                  <p className="text-gray-600">{settings?.step_4_desc || t('step_4_desc')}</p>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="flex-1 w-full"
            >
              {settings?.tutorial_video ? (
                <div className="aspect-video rounded-2xl overflow-hidden shadow-xl bg-black">
                  <video src={settings.tutorial_video} controls className="w-full h-full object-cover"></video>
                </div>
              ) : (
                <div className="aspect-video rounded-2xl bg-gray-200 flex items-center justify-center shadow-xl border border-gray-300">
                  <p className="text-gray-500 font-medium">{t('video_tutorial_not_available')}</p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer Links Section */}
      <section className="w-full py-12 bg-gray-50 px-4 sm:px-6 lg:px-8 relative z-10 border-t border-gray-200">
        <div className="max-w-7xl mx-auto flex flex-col gap-8">
          {/* Footer Logo & Name */}
          {(settings?.footer_logo_image || settings?.footer_logo_name) && (
            <div className="flex items-center gap-3 border-b border-gray-200 pb-6">
              {settings?.footer_logo_image && (
                <img src={settings.footer_logo_image} alt="Logo" className="h-10 w-auto object-contain" />
              )}
              {settings?.footer_logo_name && (
                <h3 className="text-xl font-bold text-gray-900">{settings.footer_logo_name}</h3>
              )}
            </div>
          )}

          {/* Footer Links Section */}
          <div className={`flex flex-col md:flex-row ${settings?.footer_layout_style === 'center' ? 'justify-center items-center text-center gap-8' : settings?.footer_layout_style === 'right_left' ? 'justify-between items-start md:items-center flex-row-reverse' : 'justify-between items-start md:items-center'} gap-6 w-full`}>
            
            {/* Menu Links */}
            <div className={`flex flex-wrap items-center ${settings?.footer_layout_style === 'center' ? 'justify-center' : ''} gap-6 md:gap-12`}>
              <Link to="/privacy" className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 font-medium transition">
                <Shield size={18} />
                {t('privacy_policy')}
              </Link>
              <Link to="/terms" className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 font-medium transition">
                <FileText size={18} />
                {t('terms_of_service')}
              </Link>
              {settings?.contact_wa && (
                <a href={`https://wa.me/${settings.contact_wa}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-gray-600 hover:text-green-600 font-medium transition">
                  <Phone size={18} />
                  WhatsApp
                </a>
              )}
              {settings?.contact_email && (
                <a href={`mailto:${settings.contact_email}`} className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 font-medium transition">
                  <Mail size={18} />
                  Email
                </a>
              )}
            </div>

            {/* Location & Social */}
            <div className={`flex flex-wrap items-center ${settings?.footer_layout_style === 'center' ? 'justify-center mt-0' : 'mt-4 md:mt-0'} gap-6 md:gap-8`}>
              {settings?.footer_location && (
                <div className="flex items-center gap-2 text-gray-600 font-medium">
                  <MapPin size={18} />
                  {settings.footer_location}
                </div>
              )}
              
              {/* Social Media Links */}
              <div className="flex items-center gap-4">
                {settings?.social_youtube && (
                  <a href={settings.social_youtube} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-red-600 transition-colors" aria-label="YouTube">
                    <Youtube size={20} />
                  </a>
                )}
                {settings?.social_instagram && (
                  <a href={settings.social_instagram} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-pink-600 transition-colors" aria-label="Instagram">
                    <Instagram size={20} />
                  </a>
                )}
                {settings?.social_facebook && (
                  <a href={settings.social_facebook} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-blue-600 transition-colors" aria-label="Facebook">
                    <Facebook size={20} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
