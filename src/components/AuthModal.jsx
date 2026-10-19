import React, { useState, useEffect } from 'react';
import { Mail, Lock, X, LogIn, UserPlus, Database, Settings, ShieldAlert, Check } from 'lucide-react';
import { signInUser, signUpUser } from '../services/supabaseClient';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfig, setShowConfig] = useState(false);

  // Supabase Config States
  const [dbUrl, setDbUrl] = useState('');
  const [dbKey, setDbKey] = useState('');
  const [configSaved, setConfigSaved] = useState(false);

  useEffect(() => {
    setDbUrl(localStorage.getItem('supabase_url') || '');
    setDbKey(localStorage.getItem('supabase_anon_key') || '');
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const result = await signInUser(email, password);
        onAuthSuccess(result);
      } else {
        const result = await signUpUser(email, password);
        onAuthSuccess(result);
      }
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = (e) => {
    e.preventDefault();
    if (dbUrl) localStorage.setItem('supabase_url', dbUrl.trim());
    else localStorage.removeItem('supabase_url');

    if (dbKey) localStorage.setItem('supabase_anon_key', dbKey.trim());
    else localStorage.removeItem('supabase_anon_key');

    setConfigSaved(true);
    setTimeout(() => {
      setConfigSaved(false);
      setShowConfig(false);
    }, 1000);
  };

  const isConfigured = dbUrl.trim().startsWith('https://') && dbKey.trim().length > 10;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      zIndex: 110,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '28px', position: 'relative' }}>
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
          style={{ position: 'absolute', top: '18px', right: '18px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>

        {/* Toggle Mode Tab */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <button
            onClick={() => { setIsLogin(true); setShowConfig(false); setError(''); }}
            style={{
              background: 'none',
              border: 'none',
              color: isLogin && !showConfig ? 'var(--text-main)' : 'var(--text-muted)',
              fontSize: '0.95rem',
              fontWeight: isLogin && !showConfig ? 800 : 500,
              cursor: 'pointer',
              padding: '4px 8px',
              borderBottom: isLogin && !showConfig ? '2px solid var(--accent-purple)' : 'none'
            }}
          >
            Masuk
          </button>
          <button
            onClick={() => { setIsLogin(false); setShowConfig(false); setError(''); }}
            style={{
              background: 'none',
              border: 'none',
              color: !isLogin && !showConfig ? 'var(--text-main)' : 'var(--text-muted)',
              fontSize: '0.95rem',
              fontWeight: !isLogin && !showConfig ? 800 : 500,
              cursor: 'pointer',
              padding: '4px 8px',
              borderBottom: !isLogin && !showConfig ? '2px solid var(--accent-purple)' : 'none'
            }}
          >
            Daftar Akun
          </button>
          <button
            onClick={() => { setShowConfig(true); setError(''); }}
            style={{
              border: 'none',
              color: showConfig ? 'var(--text-main)' : 'var(--text-muted)',
              fontSize: '0.85rem',
              fontWeight: showConfig ? 800 : 500,
              cursor: 'pointer',
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '6px',
              background: showConfig ? 'rgba(255,255,255,0.06)' : 'none'
            }}
          >
            <Settings size={14} />
            Database
          </button>
        </div>

        {showConfig ? (
          /* CONFIG PANEL: Let user configure production Supabase */
          <form onSubmit={handleSaveConfig} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Database size={18} color="#a855f7" />
              <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>Pengaturan Koneksi Supabase</h4>
            </div>
            
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.4' }}>
              Kosongkan kotak input di bawah untuk tetap menggunakan **Mode Simulasi** (menyimpan data di memori browser lokal / LocalStorage).
            </p>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>Supabase Project URL</label>
              <input 
                type="text"
                value={dbUrl}
                onChange={(e) => setDbUrl(e.target.value)}
                placeholder="https://your-project.supabase.co"
                className="input-field"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>Supabase Anon Key</label>
              <input 
                type="password"
                value={dbKey}
                onChange={(e) => setDbKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="input-field"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button type="button" onClick={() => setShowConfig(false)} className="btn-secondary" style={{ fontSize: '0.85rem', padding: '8px 14px' }}>
                Batal
              </button>
              <button type="submit" className="btn-primary" style={{ fontSize: '0.85rem', padding: '8px 16px' }}>
                {configSaved ? <Check size={14} /> : <Database size={14} />}
                {configSaved ? 'Tersimpan!' : 'Simpan Koneksi'}
              </button>
            </div>
          </form>
        ) : (
          /* AUTHENTICATION FORM */
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                {isLogin ? 'Masuk ke Akun Anda' : 'Buat Akun Baru'}
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                {!isConfigured ? (
                  <span style={{ color: '#38bdf8', fontWeight: 600 }}>Menjalankan dalam Mode Simulasi (Lokal)</span>
                ) : (
                  <span style={{ color: '#10b981', fontWeight: 600 }}>Menjalankan dalam Mode Database Real-Time</span>
                )}
              </p>
            </div>

            {error && (
              <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.25)', borderRadius: '8px', padding: '10px 14px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <ShieldAlert size={16} color="#f43f5e" style={{ shrink: 0 }} />
                <span style={{ fontSize: '0.78rem', color: '#fda4af', lineHeight: '1.3' }}>{error}</span>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>Email</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}>
                  <Mail size={16} />
                </div>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
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
              style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: '8px', fontSize: '0.9rem' }}
              disabled={loading}
            >
              {loading ? (
                'Memproses...'
              ) : isLogin ? (
                <>
                  <LogIn size={16} />
                  Masuk Sekarang
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  Daftarkan Akun
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
