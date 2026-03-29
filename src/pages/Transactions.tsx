import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { FileText, ArrowUpRight, ArrowDownRight, Clock, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Transaction {
  id: number;
  amount: number;
  type: 'income' | 'withdraw';
  status: 'success' | 'pending' | 'failed';
  description: string;
  created_at: string;
}

export default function Transactions() {
  const { token } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/transactions/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      } else {
        throw new Error('Gagal memuat transaksi');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle size={16} className="text-emerald-500" />;
      case 'pending': return <Clock size={16} className="text-amber-500" />;
      case 'failed': return <XCircle size={16} className="text-red-500" />;
      default: return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'success': return 'Berhasil';
      case 'pending': return 'Menunggu';
      case 'failed': return 'Gagal';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'failed': return 'bg-red-50 text-red-700 border-red-200';
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
            <FileText className="text-indigo-600" />
            Riwayat Transaksi
          </h1>
          <p className="text-gray-500 mt-1">Pantau semua aktivitas transaksi Anda</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Memuat data...</div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">Belum ada transaksi</h3>
            <p className="text-gray-500">Transaksi Anda akan muncul di sini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-sm font-medium text-gray-500">
                  <th className="p-4 pl-6">Tanggal</th>
                  <th className="p-4">Deskripsi</th>
                  <th className="p-4">Tipe</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6 text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50/50 transition">
                    <td className="p-4 pl-6 text-sm text-gray-600 whitespace-nowrap">
                      {new Date(tx.created_at).toLocaleString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="p-4 text-sm text-gray-900 font-medium">
                      {tx.description}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        {tx.type === 'income' ? (
                          <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                            <ArrowDownRight size={14} /> Pemasukan
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-md border border-red-100">
                            <ArrowUpRight size={14} /> Pengeluaran
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(tx.status)}`}>
                        {getStatusIcon(tx.status)}
                        {getStatusText(tx.status)}
                      </span>
                    </td>
                    <td className={`p-4 pr-6 text-right font-bold whitespace-nowrap ${tx.type === 'income' ? 'text-emerald-600' : 'text-gray-900'}`}>
                      {tx.type === 'income' ? '+' : '-'} Rp {tx.amount.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}
