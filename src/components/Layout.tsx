import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { useLanguage } from '../contexts/LanguageContext';
import { LogOut, User, Settings, LayoutDashboard, MoreVertical, FileText, Bell, CreditCard, Home, MessageCircle, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Layout() {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const bgStyle = settings?.bg_type === 'color' 
    ? { backgroundColor: settings.bg_value } 
    : settings?.bg_type === 'image' 
      ? { backgroundImage: `url(${settings.bg_value})`, backgroundSize: 'cover', backgroundPosition: 'center' }
      : {};

  return (
    <div className="min-h-screen flex flex-col relative" style={bgStyle}>
      {settings?.bg_type === 'video' && (
        <video 
          autoPlay 
          loop 
          muted 
          className="absolute inset-0 w-full h-full object-cover -z-10"
        >
          <source src={settings.bg_value} type="video/mp4" />
        </video>
      )}
      
      {/* Overlay if background is image or video to ensure text readability */}
      {(settings?.bg_type === 'image' || settings?.bg_type === 'video') && (
        <div className="absolute inset-0 bg-black/50 -z-10"></div>
      )}

      <header className="bg-white/90 backdrop-blur shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/" className="flex items-center gap-2">
              {settings?.logo ? (
                <img src={settings.logo} alt="Logo" className="h-8 w-auto" />
              ) : (
                <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                  Q
                </div>
              )}
              <span className="font-bold text-xl text-gray-900">{settings?.header_title || 'QRIS Maker'}</span>
            </Link>

            <nav className="flex items-center gap-4">
              {/* Language Switcher */}
              <div className="relative">
                <button 
                  onClick={() => setLangOpen(!langOpen)} 
                  className="flex items-center gap-1 text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-lg hover:bg-gray-50 transition"
                >
                  <Globe size={18} />
                  <span className="text-sm font-medium uppercase">{language}</span>
                </button>
                
                <AnimatePresence>
                  {langOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)}></div>
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-32 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50"
                      >
                        <div className="p-1">
                          <button 
                            onClick={() => { setLanguage('id'); setLangOpen(false); }}
                            className={`w-full text-left px-4 py-2 text-sm rounded-lg transition ${language === 'id' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                          >
                            Indonesia
                          </button>
                          <button 
                            onClick={() => { setLanguage('en'); setLangOpen(false); }}
                            className={`w-full text-left px-4 py-2 text-sm rounded-lg transition ${language === 'en' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                          >
                            English
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {user ? (
                <>
                  <div className="relative flex items-center">
                    <button onClick={() => setMenuOpen(!menuOpen)} className="text-gray-500 hover:text-indigo-600 p-2 rounded-md hover:bg-gray-100 transition">
                      <MoreVertical size={24} />
                    </button>

                    {/* Dropdown Menu */}
                    <AnimatePresence>
                      {menuOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)}></div>
                          <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50"
                          >
                            <div className="p-4 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
                              {user.profile_image ? (
                                <img src={user.profile_image} alt="Profile" className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 border border-indigo-200">
                                  <User size={20} />
                                </div>
                              )}
                              <div className="overflow-hidden">
                                <p className="font-medium text-sm text-gray-900 truncate">{user.name}</p>
                                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                              </div>
                            </div>
                            <div className="p-2 space-y-1">
                              <Link to="/" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition">
                                <Home size={16} /> {t('home')}
                              </Link>
                              <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition">
                                <LayoutDashboard size={16} /> {t('dashboard')}
                              </Link>
                              <Link to="/tickets" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition">
                                <MessageCircle size={16} /> {t('ticket_help')}
                              </Link>
                              {user.role === 'admin' && (
                                <Link to="/admin" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition">
                                  <Settings size={16} /> {t('admin')}
                                </Link>
                              )}
                              <Link to="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition">
                                <User size={16} /> {t('merchant_profile')}
                              </Link>
                              <Link to="/transactions" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition">
                                <FileText size={16} /> {t('transactions')}
                              </Link>
                              <Link to="/news" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition">
                                <Bell size={16} /> {t('news')}
                              </Link>
                              <Link to="/withdraw" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition">
                                <CreditCard size={16} /> {t('withdraw')}
                              </Link>
                              <div className="h-px bg-gray-100 my-1"></div>
                              <button onClick={() => { setMenuOpen(false); handleLogout(); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition">
                                <LogOut size={16} /> {t('logout')}
                              </button>
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      location.pathname === '/login' 
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                        : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
                    }`}
                  >
                    {t('login')}
                  </Link>
                  <Link 
                    to="/register" 
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      location.pathname !== '/login' 
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                        : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
                    }`}
                  >
                    {t('register')}
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      <footer 
        className="backdrop-blur border-t border-gray-200 py-8 mt-auto"
        style={{ backgroundColor: settings?.copyright_bg_color || 'rgba(255, 255, 255, 0.9)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-center items-center gap-4">
          <p className="text-gray-500 text-sm text-center">
            {settings?.copyright || '© 2026 QRIS Merchant Maker'}
          </p>
        </div>
      </footer>
    </div>
  );
}
