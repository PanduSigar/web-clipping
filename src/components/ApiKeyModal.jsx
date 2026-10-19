import React, { useState, useEffect } from 'react';
import { Key, ExternalLink, CheckCircle2, ShieldCheck, X } from 'lucide-react';

export default function ApiKeyModal({ isOpen, onClose, apiKey, onSaveApiKey }) {
  const [inputKey, setInputKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setInputKey(apiKey || '');
  }, [apiKey, isOpen]);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    onSaveApiKey(inputKey.trim());
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1000);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '28px', position: 'relative' }}>
        <button 
          onClick={onClose} 
          style={{ position: 'absolute', top: '18px', right: '18px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
            <Key size={22} color="#a5b4fc" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>Pengaturan Gemini API Key</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Diperlukan untuk menghubungkan AI Agent dengan Google Gemini</p>
          </div>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
              API Key Google Gemini
            </label>
            <input 
              type="password" 
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="Masukkan API Key (AIzaSy...)"
              className="input-field"
              required
            />
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', fontWeight: 600, color: 'var(--text-main)' }}>
              <ShieldCheck size={16} color="#10b981" />
              <span>Cara Mendapatkan API Key Gratis:</span>
            </div>
            <ol style={{ paddingLeft: '20px', margin: '6px 0' }}>
              <li>Buka <strong>Google AI Studio</strong>.</li>
              <li>Klik tombol <strong>"Create API key"</strong>.</li>
              <li>Salin API Key dan tempel di kotak atas.</li>
            </ol>
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#06b6d4', fontWeight: 600, textDecoration: 'none', marginTop: '6px' }}
            >
              Dapatkan Free API Key di Google AI Studio <ExternalLink size={13} />
            </a>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              Batal
            </button>
            <button type="submit" className="btn-primary">
              {saved ? <CheckCircle2 size={16} /> : <Key size={16} />}
              {saved ? 'Tersimpan!' : 'Simpan API Key'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
