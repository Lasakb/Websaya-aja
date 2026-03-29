import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { CreditCard, Building, Wallet, CheckCircle, Clock, XCircle, AlertCircle, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

interface Withdrawal {
  id: number;
  amount: number;
  bank_name: string;
  account_number: string;
  account_name: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

const PAYMENT_METHODS = [
  { type: 'bank', name: 'BCA', logo: 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Bank_Central_Asia.svg', fallback: 'https://ui-avatars.com/api/?name=BCA&background=0066AE&color=fff&font-size=0.4&bold=true' },
  { type: 'bank', name: 'Mandiri', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/ad/Bank_Mandiri_logo_2016.svg', fallback: 'https://ui-avatars.com/api/?name=MDR&background=003D79&color=fff&font-size=0.4&bold=true' },
  { type: 'bank', name: 'BNI', logo: 'https://upload.wikimedia.org/wikipedia/id/5/55/BNI_logo.svg', fallback: 'https://ui-avatars.com/api/?name=BNI&background=F15A23&color=fff&font-size=0.4&bold=true' },
  { type: 'bank', name: 'BRI', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2e/BRI_2020.svg', fallback: 'https://ui-avatars.com/api/?name=BRI&background=00529C&color=fff&font-size=0.4&bold=true' },
  { type: 'bank', name: 'BSI', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Bank_Syariah_Indonesia.svg', fallback: 'https://ui-avatars.com/api/?name=BSI&background=00A39D&color=fff&font-size=0.4&bold=true' },
  { type: 'bank', name: 'CIMB Niaga', logo: 'https://upload.wikimedia.org/wikipedia/commons/3/38/CIMB_Niaga_logo.svg', fallback: 'https://ui-avatars.com/api/?name=CMB&background=7E1F31&color=fff&font-size=0.4&bold=true' },
  { type: 'ewallet', name: 'GoPay', logo: 'https://upload.wikimedia.org/wikipedia/commons/8/86/Gopay_logo.svg', fallback: 'https://ui-avatars.com/api/?name=GPY&background=00AED6&color=fff&font-size=0.4&bold=true' },
  { type: 'ewallet', name: 'OVO', logo: 'https://upload.wikimedia.org/wikipedia/commons/e/eb/Logo_ovo_purple.svg', fallback: 'https://ui-avatars.com/api/?name=OVO&background=4C3494&color=fff&font-size=0.4&bold=true' },
  { type: 'ewallet', name: 'DANA', logo: 'https://upload.wikimedia.org/wikipedia/commons/7/72/Logo_dana_blue.svg', fallback: 'https://ui-avatars.com/api/?name=DNA&background=118EEA&color=fff&font-size=0.4&bold=true' },
  { type: 'ewallet', name: 'ShopeePay', logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fe/ShopeePay_Logo.svg', fallback: 'https://ui-avatars.com/api/?name=SPY&background=EE4D2D&color=fff&font-size=0.4&bold=true' },
  { type: 'ewallet', name: 'LinkAja', logo: 'https://upload.wikimedia.org/wikipedia/commons/8/85/LinkAja.svg', fallback: 'https://ui-avatars.com/api/?name=LKA&background=E31837&color=fff&font-size=0.4&bold=true' },
];

export default function Withdraw() {
  const { user, token, updateUser } = useAuth();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [amount, setAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchWithdrawals = async () => {
    try {
      const res = await fetch('/api/withdrawals/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWithdrawals(data);
      } else {
        throw new Error('Gagal memuat data penarikan');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    
    if (numAmount < 10000) return toast.error('Minimal penarikan Rp 10.000');
    if (numAmount > (user?.balance || 0)) return toast.error('Saldo tidak mencukupi');
    if (!bankName || !accountNumber || !accountName) return toast.error('Semua field harus diisi');

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ amount: numAmount, bank_name: bankName, account_number: accountNumber, account_name: accountName })
      });

      if (res.ok) {
        toast.success('Permintaan penarikan berhasil dibuat');
        updateUser({ balance: (user?.balance || 0) - numAmount });
        setAmount('');
        setBankName('');
        setAccountNumber('');
        setAccountName('');
        fetchWithdrawals();
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Gagal melakukan penarikan');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle size={16} className="text-emerald-500" />;
      case 'pending': return <Clock size={16} className="text-amber-500" />;
      case 'rejected': return <XCircle size={16} className="text-red-500" />;
      default: return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Disetujui';
      case 'pending': return 'Menunggu';
      case 'rejected': return 'Ditolak';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'rejected': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="text-indigo-600" />
            Penarikan Saldo
          </h1>
          <p className="text-gray-500 mt-1">Tarik saldo merchant Anda ke rekening bank atau e-wallet</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Penarikan */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="mb-6 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
              <p className="text-sm text-indigo-800 font-medium mb-1">Saldo Tersedia</p>
              <h2 className="text-3xl font-bold text-indigo-900">
                Rp {user?.balance?.toLocaleString('id-ID') || 0}
              </h2>
            </div>

            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Penarikan</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 font-medium">Rp</span>
                  </div>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                    placeholder="Minimal 10.000"
                    min="10000"
                    max={user?.balance || 0}
                    required
                  />
                </div>
              </div>

              <div className="relative" ref={dropdownRef}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank / E-Wallet</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white flex items-center justify-between"
                  >
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building size={18} className="text-gray-400" />
                    </div>
                    {bankName ? (
                      <div className="flex items-center gap-2">
                        <img 
                          src={PAYMENT_METHODS.find(m => m.name === bankName)?.logo} 
                          alt={bankName} 
                          className="h-5 w-auto max-w-[60px] object-contain"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const fallback = PAYMENT_METHODS.find(m => m.name === bankName)?.fallback;
                            if (fallback && e.currentTarget.src !== fallback) {
                              e.currentTarget.src = fallback;
                            }
                          }}
                        />
                        <span className="text-gray-900">{bankName}</span>
                      </div>
                    ) : (
                      <span className="text-gray-500">Pilih Bank/E-Wallet</span>
                    )}
                    <ChevronDown size={18} className={`text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      <div className="p-2">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">Bank</div>
                        {PAYMENT_METHODS.filter(m => m.type === 'bank').map((method) => (
                          <button
                            key={method.name}
                            type="button"
                            onClick={() => {
                              setBankName(method.name);
                              setIsDropdownOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-indigo-50 rounded-md flex items-center gap-3 transition"
                          >
                            <div className="w-12 h-8 flex items-center justify-center bg-white rounded-sm p-1 border border-gray-100 shrink-0">
                              <img 
                                src={method.logo} 
                                alt={method.name} 
                                className="max-w-full max-h-full object-contain" 
                                referrerPolicy="no-referrer" 
                                onError={(e) => {
                                  if (e.currentTarget.src !== method.fallback) {
                                    e.currentTarget.src = method.fallback;
                                  }
                                }}
                              />
                            </div>
                            <span className="text-gray-900">{method.name}</span>
                          </button>
                        ))}
                        
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2 mt-2 border-t border-gray-100 pt-2">E-Wallet</div>
                        {PAYMENT_METHODS.filter(m => m.type === 'ewallet').map((method) => (
                          <button
                            key={method.name}
                            type="button"
                            onClick={() => {
                              setBankName(method.name);
                              setIsDropdownOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-indigo-50 rounded-md flex items-center gap-3 transition"
                          >
                            <div className="w-12 h-8 flex items-center justify-center bg-white rounded-sm p-1 border border-gray-100 shrink-0">
                              <img 
                                src={method.logo} 
                                alt={method.name} 
                                className="max-w-full max-h-full object-contain" 
                                referrerPolicy="no-referrer" 
                                onError={(e) => {
                                  if (e.currentTarget.src !== method.fallback) {
                                    e.currentTarget.src = method.fallback;
                                  }
                                }}
                              />
                            </div>
                            <span className="text-gray-900">{method.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Rekening / HP</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Wallet size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                    placeholder="081234567890"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Pemilik Rekening</label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                  placeholder="Sesuai buku tabungan"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !amount || !bankName || !accountNumber || !accountName}
                  className="w-full bg-indigo-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {isSubmitting ? 'Memproses...' : 'Tarik Saldo'}
                </button>
              </div>
              
              <div className="flex items-start gap-2 mt-4 p-3 bg-blue-50 text-blue-800 rounded-lg text-xs">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <p>Penarikan diproses pada hari kerja (Senin-Jumat, 09:00 - 17:00 WIB). Maksimal 1x24 jam.</p>
              </div>
            </form>
          </div>
        </div>

        {/* Riwayat Penarikan */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Riwayat Penarikan</h2>
            </div>
            
            {loading ? (
              <div className="p-8 text-center text-gray-500">Memuat data...</div>
            ) : withdrawals.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard size={24} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">Belum ada penarikan</h3>
                <p className="text-gray-500">Riwayat penarikan saldo Anda akan muncul di sini.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-sm font-medium text-gray-500">
                      <th className="p-4 pl-6">Tanggal</th>
                      <th className="p-4">Tujuan</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 pr-6 text-right">Jumlah</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {withdrawals.map((wd) => (
                      <tr key={wd.id} className="hover:bg-gray-50/50 transition">
                        <td className="p-4 pl-6 text-sm text-gray-600 whitespace-nowrap">
                          {new Date(wd.created_at).toLocaleString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center overflow-hidden shrink-0 p-1.5 shadow-sm">
                              {PAYMENT_METHODS.find(m => m.name === wd.bank_name)?.logo ? (
                                <img 
                                  src={PAYMENT_METHODS.find(m => m.name === wd.bank_name)?.logo} 
                                  alt={wd.bank_name} 
                                  className="w-full h-full object-contain" 
                                  referrerPolicy="no-referrer" 
                                  onError={(e) => {
                                    const fallback = PAYMENT_METHODS.find(m => m.name === wd.bank_name)?.fallback;
                                    if (fallback && e.currentTarget.src !== fallback) {
                                      e.currentTarget.src = fallback;
                                    }
                                  }}
                                />
                              ) : (
                                <Building size={14} className="text-gray-400" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{wd.bank_name}</div>
                              <div className="text-xs text-gray-500">{wd.account_number} a.n {wd.account_name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(wd.status)}`}>
                            {getStatusIcon(wd.status)}
                            {getStatusText(wd.status)}
                          </span>
                        </td>
                        <td className="p-4 pr-6 text-right font-bold text-gray-900 whitespace-nowrap">
                          Rp {wd.amount.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
