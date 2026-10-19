import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import AdminDashboard from './components/AdminDashboard';
import { ShieldCheck, LogIn, Mail, Lock, ShieldAlert, LogOut } from 'lucide-react';
import './index.css';

function AdminApp() {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check login session on mount
  useEffect(() => {
    const savedAdmin = localStorage.getItem('active_admin');
    if (savedAdmin) {
      try {
        const parsed = JSON.parse(savedAdmin);
        setIsAdminLoggedIn(true);
        setAdminEmail(parsed.email);
      } catch (err) {
        localStorage.removeItem('active_admin');
      }
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate email format
    if (email.toLowerCase() !== 'admin@dataflow.com') {
      setError('Akses Ditolak. Hanya email administrator resmi yang diizinkan masuk ke halaman ini.');
      setLoading(false);
      return;
    }

    try {
      // Connect to local MySQL database using our authentication endpoints
      const res = await fetch('/api/db/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Email atau kata sandi salah.');
      }

      // Check again to ensure database record is indeed an admin
      if (data.user.role !== 'admin') {
        throw new Error('Akses Ditolak. Akun Anda tidak memiliki hak akses administrator!');
      }

      setIsAdminLoggedIn(true);
      setAdminEmail(data.user.email);
      localStorage.setItem('active_admin', JSON.stringify(data.user));
    } catch (err) {
      console.error(err);
      setError(err.message || 'Gagal terhubung ke database Laragon.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAdminLoggedIn(false);
    setAdminEmail('');
    localStorage.removeItem('active_admin');
  };

  if (!isAdminLoggedIn) {
    /* ADMIN LOGIN PAGE */
    return (
      <div style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at center, #1e1b4b 0%, #09090b 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div className="glass-panel" style={{ 
          width: '100%', 
          maxWidth: '420px', 
          padding: '32px', 
          border: '2px solid rgba(239, 68, 68, 0.25)', 
          boxShadow: '0 8px 32px rgba(239, 68, 68, 0.08)' 
        }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px auto',
              boxShadow: '0 0 20px rgba(239, 68, 68, 0.4)'
            }}>
              <ShieldCheck size={32} color="white" />
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#fca5a5' }}>
              DataFlow Admin Portal
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Silakan login dengan akun administrator MySQL Laragon Anda.
            </p>
          </div>

          {error && (
            <div style={{ 
              background: 'rgba(239, 68, 68, 0.1)', 
              border: '1px solid rgba(239, 68, 68, 0.25)', 
              borderRadius: '8px', 
              padding: '12px', 
              display: 'flex', 
              gap: '8px', 
              alignItems: 'center', 
              marginBottom: '16px' 
            }}>
              <ShieldAlert size={18} color="#ef4444" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '0.78rem', color: '#fca5a5', lineHeight: '1.4' }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>Email Admin</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}>
                  <Mail size={16} />
                </div>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@dataflow.com"
                  className="input-field"
                  style={{ paddingLeft: '38px', width: '100%' }}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>Kata Sandi</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}>
                  <Lock size={16} />
                </div>
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field"
                  style={{ paddingLeft: '38px', width: '100%' }}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ 
                width: '100%', 
                justifyContent: 'center', 
                padding: '12px', 
                marginTop: '8px', 
                fontSize: '0.9rem',
                background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                boxShadow: '0 4px 15px rgba(239, 68, 68, 0.2)'
              }}
              disabled={loading}
            >
              {loading ? (
                'Memproses...'
              ) : (
                <>
                  <LogIn size={16} />
                  Login Administrator
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  /* ADMIN DASHBOARD WORKSPACE */
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#09090b' }}>
      
      {/* Admin Header */}
      <header className="glass-panel" style={{
        borderRadius: 0,
        borderTop: 0,
        borderLeft: 0,
        borderRight: 0,
        borderBottom: '1px solid rgba(239, 68, 68, 0.2)',
        padding: '14px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(239, 68, 68, 0.3)'
          }}>
            <ShieldCheck size={24} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0, color: '#ef4444' }}>
              DataFlow <span style={{ color: 'white' }}>Admin Control Room</span>
            </h1>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
              Sistem Validasi & Pembayaran Token Real-Time
            </p>
          </div>
        </div>

        {/* Admin Meta Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '0.8rem', color: '#fca5a5', fontWeight: 600 }}>
            {adminEmail}
          </span>
          <button 
            onClick={handleLogout}
            className="btn-secondary" 
            style={{ 
              padding: '6px 12px', 
              fontSize: '0.78rem', 
              borderColor: 'rgba(239,68,68,0.3)',
              color: '#fca5a5',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <LogOut size={13} />
            Keluar
          </button>
        </div>
      </header>

      {/* Admin Content Area */}
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        <AdminDashboard />
      </main>

    </div>
  );
}

const rootElement = document.getElementById('admin-root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <AdminApp />
    </React.StrictMode>
  );
}
