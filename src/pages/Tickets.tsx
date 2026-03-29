import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { MessageCircle, Plus, X, Send, Loader2, Clock, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';

export default function Tickets() {
  const { token, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [ticketMessages, setTicketMessages] = useState<any[]>([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [replying, setReplying] = useState(false);

  const handleSelectTicket = async (ticket: any) => {
    setSelectedTicket(ticket);
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

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    const ticketId = searchParams.get('id');
    if (ticketId && tickets.length > 0) {
      const ticket = tickets.find(t => t.id === parseInt(ticketId));
      if (ticket && (!selectedTicket || selectedTicket.id !== ticket.id)) {
        handleSelectTicket(ticket);
      }
    }
  }, [searchParams, tickets, selectedTicket]);

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/tickets', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ subject, message })
      });

      if (res.ok) {
        toast.success('Tiket berhasil dibuat');
        setIsCreating(false);
        setSubject('');
        setMessage('');
        fetchTickets();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Gagal membuat tiket');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedTicket) return;

    setReplying(true);
    try {
      const res = await fetch(`/api/tickets/${selectedTicket.id}/messages`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ message: replyMessage })
      });

      if (res.ok) {
        setReplyMessage('');
        handleSelectTicket(selectedTicket);
        fetchTickets();
      } else {
        toast.error('Gagal mengirim balasan');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan');
    } finally {
      setReplying(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket) return;
    try {
      const res = await fetch(`/api/tickets/${selectedTicket.id}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ status: 'closed' })
      });

      if (res.ok) {
        toast.success('Tiket berhasil ditutup');
        handleSelectTicket(selectedTicket);
        fetchTickets();
      } else {
        toast.error('Gagal menutup tiket');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bantuan Tiket</h1>
          <p className="text-gray-500 mt-1">
            {user?.role === 'admin' ? 'Kelola tiket bantuan dari pengguna' : 'Hubungi admin untuk bantuan lebih lanjut'}
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition flex items-center gap-2"
        >
          <Plus size={18} /> Buat Tiket Baru
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Ticket List */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[600px]">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h2 className="font-bold text-gray-900">
              {user?.role === 'admin' ? 'Daftar Tiket Masuk' : 'Daftar Tiket Anda'}
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin text-indigo-600" />
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle size={48} className="mx-auto text-gray-300 mb-3" />
                <p>Belum ada tiket bantuan.</p>
              </div>
            ) : (
              tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => handleSelectTicket(ticket)}
                  className={`w-full text-left p-4 rounded-xl border transition ${selectedTicket?.id === ticket.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-900 truncate pr-2">{ticket.subject}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                      ticket.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                      ticket.status === 'answered' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {ticket.status === 'open' ? 'Menunggu' : ticket.status === 'answered' ? 'Dijawab' : 'Selesai'}
                    </span>
                  </div>
                  {ticket.user_name && (
                    <p className="text-xs text-indigo-600 font-medium mb-1">Dari: {ticket.user_name}</p>
                  )}
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock size={12} /> {new Date(ticket.created_at).toLocaleString('id-ID')}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Ticket Details */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[600px]">
          {selectedTicket ? (
            <>
              <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <div>
                  <h2 className="font-bold text-gray-900 text-lg">{selectedTicket.subject}</h2>
                  <p className="text-sm text-gray-500">Tiket #{selectedTicket.id}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                    selectedTicket.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                    selectedTicket.status === 'answered' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedTicket.status === 'open' ? 'Menunggu Balasan Admin' : selectedTicket.status === 'answered' ? 'Sudah Dijawab' : 'Tiket Selesai'}
                  </span>
                  {user?.role === 'admin' && selectedTicket.status !== 'closed' && (
                    <button
                      onClick={handleCloseTicket}
                      className="text-xs bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1 rounded-full font-medium transition"
                    >
                      Tutup Tiket
                    </button>
                  )}
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
                {ticketMessages.map((msg) => {
                  const isOwnMessage = msg.sender_type === user?.role;
                  return (
                    <div key={msg.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-4 rounded-2xl ${
                        isOwnMessage 
                          ? 'bg-indigo-600 text-white rounded-tr-sm' 
                          : 'bg-white border border-gray-200 text-gray-800 shadow-sm rounded-tl-sm'
                      }`}>
                        <div className="flex items-center gap-2 mb-1 opacity-80 text-xs">
                          <span className="font-bold">{isOwnMessage ? 'Anda' : (msg.sender_type === 'admin' ? 'Admin' : 'Pengguna')}</span>
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
                <form onSubmit={handleReply} className="flex gap-3 items-end">
                  <textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder={selectedTicket.status === 'closed' ? "Tiket sudah ditutup. Ketik balasan untuk membuka kembali tiket ini..." : "Ketik balasan Anda secara detail..."}
                    rows={3}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleReply(e);
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
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8 text-center">
              <MessageCircle size={64} className="text-gray-200 mb-4" />
              <h3 className="text-xl font-bold text-gray-700 mb-2">Pilih Tiket</h3>
              <p>Pilih tiket di sebelah kiri untuk melihat detail percakapan atau buat tiket baru.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Ticket Modal */}
      <AnimatePresence>
        {isCreating && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
              onClick={() => setIsCreating(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-xl z-50 overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h2 className="text-xl font-bold text-gray-900">Buat Tiket Baru</h2>
                <button onClick={() => setIsCreating(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subjek Masalah</label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Contoh: QRIS belum aktif"
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Detail Tiket Bantuan</label>
                  <textarea
                    required
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Jelaskan masalah atau pertanyaan Anda secara detail..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                  ></textarea>
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !subject.trim() || !message.trim()}
                    className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    Kirim Tiket
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
