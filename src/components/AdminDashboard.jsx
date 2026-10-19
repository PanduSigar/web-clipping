import React, { useState, useEffect } from 'react';
import { ShieldCheck, Eye, Check, X, RefreshCw, Search, DollarSign, Users, Award, AlertCircle } from 'lucide-react';

export default function AdminDashboard() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchTransactions = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/db/admin/transactions');
      if (!res.ok) throw new Error('Gagal memuat daftar transaksi.');
      const data = await res.json();
      setTransactions(data);
      setError('');
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    if (!isAutoRefresh) return;
    const interval = setInterval(() => {
      fetchTransactions(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoRefresh]);

  const handleApprove = async (txId) => {
    if (!confirm('Apakah Anda yakin menyetujui transaksi ini? Token akan otomatis masuk ke akun user.')) return;
    setActionLoading(txId);
    try {
      const res = await fetch('/api/db/admin/approve-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: txId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyetujui transaksi.');
      alert('Transaksi BERHASIL disetujui! Kuota token pengguna telah ditambahkan.');
      fetchTransactions(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (txId) => {
    if (!confirm('Apakah Anda yakin menolak transaksi ini?')) return;
    setActionLoading(txId);
    try {
      const res = await fetch('/api/db/admin/reject-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: txId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menolak transaksi.');
      alert('Transaksi telah DITOLAK.');
      fetchTransactions(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Stats calculation
  const totalTransactions = transactions.length;
  const pendingCount = transactions.filter(t => t.status === 'Pending').length;
  const successTransactions = transactions.filter(t => t.status === 'Success');
  const successCount = successTransactions.length;
  const rejectedCount = transactions.filter(t => t.status === 'Rejected').length;
  const totalRevenue = successTransactions.reduce((acc, t) => acc + Number(t.price), 0);

  // Filtering
  const filteredTransactions = transactions.filter(t => 
    t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '24px', 
      animation: 'fadeIn 0.4s ease',
      border: '1px dashed rgba(239, 68, 68, 0.25)',
      padding: '24px',
      borderRadius: 'var(--radius-lg)',
      background: 'rgba(239, 68, 68, 0.02)',
      boxShadow: '0 8px 32px rgba(239, 68, 68, 0.05)'
    }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={28} color="#ef4444" />
            <span style={{ color: '#ef4444' }}>Admin Control Center</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 500, padding: '4px 8px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              Verifikasi Struk Real-time
            </span>
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Validasi bukti transfer pembayaran QRIS e-wallet/m-banking untuk top-up token pengguna.
          </p>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', cursor: 'pointer', userSelect: 'none' }}>
            <input 
              type="checkbox" 
              checked={isAutoRefresh} 
              onChange={(e) => setIsAutoRefresh(e.target.checked)}
              style={{ accentColor: '#ef4444', cursor: 'pointer' }}
            />
            <span style={{ color: isAutoRefresh ? '#a7f3d0' : 'var(--text-muted)' }}>
              Auto-refresh (5d) {isAutoRefresh && '🟢'}
            </span>
          </label>

          <button 
            onClick={() => fetchTransactions(false)} 
            className="btn-secondary" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '0.8rem' }}
          >
            <RefreshCw size={14} className={loading ? "spin-animation" : ""} />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        
        {/* Revenue */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DollarSign size={22} color="#10b981" />
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Total Pendapatan</p>
            <h4 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '2px 0 0 0', color: '#10b981' }}>
              Rp {totalRevenue.toLocaleString('id-ID')}
            </h4>
          </div>
        </div>

        {/* Pending */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertCircle size={22} color="#f59e0b" />
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Menunggu Validasi</p>
            <h4 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '2px 0 0 0', color: '#f59e0b' }}>
              {pendingCount} Transaksi
            </h4>
          </div>
        </div>

        {/* Success */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Award size={22} color="#fca5a5" />
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Transaksi Sukses</p>
            <h4 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '2px 0 0 0', color: '#fca5a5' }}>
              {successCount} / {totalTransactions}
            </h4>
          </div>
        </div>

      </div>

      {/* Error Notice */}
      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '8px', padding: '12px 16px', color: '#fca5a5', fontSize: '0.85rem' }}>
          ⚠️ Gagal sinkronisasi dengan database Laragon: {error}
        </div>
      )}

      {/* Search Bar */}
      <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
        <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}>
          <Search size={16} />
        </div>
        <input 
          type="text" 
          placeholder="Cari berdasarkan email atau Order ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-field"
          style={{ width: '100%', paddingLeft: '38px' }}
        />
      </div>

      {/* Transaction Table */}
      <div className="glass-panel" style={{ overflowX: 'auto', padding: '8px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '12px 16px' }}>Tanggal</th>
              <th style={{ padding: '12px 16px' }}>Order ID</th>
              <th style={{ padding: '12px 16px' }}>Email Pembeli</th>
              <th style={{ padding: '12px 16px' }}>Paket</th>
              <th style={{ padding: '12px 16px' }}>Nominal</th>
              <th style={{ padding: '12px 16px' }}>Token</th>
              <th style={{ padding: '12px 16px' }}>Struk Bukti</th>
              <th style={{ padding: '12px 16px' }}>Status</th>
              <th style={{ padding: '12px 16px' }}>Verifikator</th>
              <th style={{ padding: '12px 16px' }}>Catatan / Alasan AI</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={11} style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-dim)' }}>
                  Tidak ada data transaksi yang ditemukan.
                </td>
              </tr>
            ) : (
              filteredTransactions.map((tx) => (
                <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s', ':hover': { background: 'rgba(255,255,255,0.01)' } }}>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                    {new Date(tx.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 'bold' }}>{tx.id}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-main)' }}>{tx.email}</td>
                  <td style={{ padding: '12px 16px' }}>{tx.package_name}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>Rp {Number(tx.price).toLocaleString('id-ID')}</td>
                  <td style={{ padding: '12px 16px', color: '#38bdf8', fontWeight: 600 }}>+{Number(tx.tokens).toLocaleString('id-ID')}</td>
                  <td style={{ padding: '12px 16px' }}>
                    {tx.receipt ? (
                      <button 
                        onClick={() => setSelectedReceipt(tx.receipt)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '6px',
                          color: '#fca5a5',
                          padding: '4px 8px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.75rem'
                        }}
                      >
                        <Eye size={12} />
                        Lihat Struk
                      </button>
                    ) : (
                      <span style={{ color: 'var(--text-dim)' }}>Tidak ada</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '3px 8px',
                      borderRadius: '99px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      background: 
                        tx.status === 'Success' ? 'rgba(16, 185, 129, 0.15)' :
                        tx.status === 'Rejected' ? 'rgba(239, 68, 68, 0.15)' :
                        'rgba(245, 158, 11, 0.15)',
                      color:
                        tx.status === 'Success' ? '#34d399' :
                        tx.status === 'Rejected' ? '#f87171' :
                        '#fbbf24',
                      border: `1px solid ${
                        tx.status === 'Success' ? 'rgba(16, 185, 129, 0.3)' :
                        tx.status === 'Rejected' ? 'rgba(239, 68, 68, 0.3)' :
                        'rgba(245, 158, 11, 0.3)'
                      }`
                    }}>
                      {tx.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {tx.approved_by === 'AI Agent' ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px',
                        borderRadius: '99px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        background: 'rgba(6, 182, 212, 0.15)',
                        color: '#22d3ee',
                        border: '1px solid rgba(6, 182, 212, 0.3)'
                      }}>
                        🤖 AI Agent
                      </span>
                    ) : tx.approved_by === 'Admin' ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px',
                        borderRadius: '99px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        background: 'rgba(239, 68, 68, 0.15)',
                        color: '#fca5a5',
                        border: '1px solid rgba(239, 68, 68, 0.3)'
                      }}>
                        👤 Admin
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-dim)' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={tx.notes || ''}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      {tx.notes || '—'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    {tx.status === 'Pending' ? (
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button 
                          onClick={() => handleApprove(tx.id)}
                          disabled={actionLoading !== null}
                          className="btn-primary"
                          style={{
                            background: '#10b981',
                            padding: '4px 8px',
                            fontSize: '0.75rem',
                            borderRadius: '4px'
                          }}
                        >
                          <Check size={12} />
                          Setujui
                        </button>
                        <button 
                          onClick={() => handleReject(tx.id)}
                          disabled={actionLoading !== null}
                          className="btn-secondary"
                          style={{
                            borderColor: 'rgba(239, 68, 68, 0.4)',
                            color: '#f87171',
                            background: 'rgba(239, 68, 68, 0.05)',
                            padding: '4px 8px',
                            fontSize: '0.75rem',
                            borderRadius: '4px'
                          }}
                        >
                          <X size={12} />
                          Tolak
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>Sudah Diproses</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Receipt Preview Modal */}
      {selectedReceipt && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="glass-panel" style={{ position: 'relative', width: '100%', maxWidth: '480px', padding: '16px', textAlign: 'center' }}>
            <button 
              onClick={() => setSelectedReceipt(null)}
              style={{
                position: 'absolute',
                top: '-12px',
                right: '-12px',
                background: '#f43f5e',
                border: 'none',
                color: 'white',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
              }}
            >
              <X size={16} />
            </button>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', fontWeight: 800 }}>Struk Bukti Transfer Pembeli</h4>
            <div style={{ maxHeight: '70vh', overflowY: 'auto', borderRadius: '8px', background: 'rgba(0,0,0,0.4)', padding: '8px' }}>
              <img 
                src={selectedReceipt} 
                alt="Receipt Proof" 
                style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '6px' }}
              />
            </div>
            <button 
              onClick={() => setSelectedReceipt(null)}
              className="btn-secondary"
              style={{ marginTop: '14px', width: '100%', justifyContent: 'center' }}
            >
              Tutup Pratinjau
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
