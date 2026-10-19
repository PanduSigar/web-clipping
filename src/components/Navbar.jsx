import React from 'react';
import { Bot, Key, Sparkles, Database, Trash2, Cpu } from 'lucide-react';

export default function Navbar({
  hasApiKey,
  onOpenApiKeyModal,
  selectedModel,
  onSelectModel,
  currentFile,
  onClearData,
  user,
  userProfile,
  onOpenAuth,
  onOpenPricing,
  onLogout
}) {
  return (
    <header className="glass-panel" style={{ borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0, padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 50 }}>
      {/* Brand & Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          background: 'var(--gradient-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-glow)'
        }}>
          <Bot size={24} color="white" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
              DataFlow <span className="gradient-text">AI Agent</span>
            </h1>
            <span className="badge badge-indigo">v1.0</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
            Asisten Otomatisasi Tugas & Analisis Data Cerdas
          </p>
        </div>
      </div>

      {/* Middle Status Info */}
      {currentFile && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.03)', padding: '6px 14px', borderRadius: '99px', border: '1px solid var(--border-color)' }}>
          <Database size={15} color="#06b6d4" />
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{currentFile.fileName}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>({currentFile.audit.rowCount} baris)</span>
          <button 
            onClick={onClearData} 
            title="Hapus Data & Upload Baru"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', padding: '2px', marginLeft: '4px' }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* User Quota & Login Button */}
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div 
              onClick={onOpenPricing}
              title="Klik untuk Top Up Kuota Token"
              style={{ 
                background: 'rgba(139, 92, 246, 0.08)', 
                border: '1px solid rgba(139, 92, 246, 0.25)', 
                padding: '6px 12px', 
                borderRadius: 'var(--radius-md)', 
                fontSize: '0.8rem', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              <Sparkles size={13} color="#c084fc" fill="#c084fc" />
              <span>
                Kuota: <strong style={{ color: 'var(--text-main)' }}>{Math.max(0, (userProfile?.token_limit || 0) - (userProfile?.token_used || 0)).toLocaleString('id-ID')}</strong> Token
              </span>
            </div>
            
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }} title={user.email}>
              {user.email.split('@')[0]}
            </div>
            
            <button 
              onClick={onLogout}
              className="btn-ghost" 
              style={{ padding: '6px 10px', fontSize: '0.75rem', color: 'var(--accent-rose)' }}
            >
              Keluar
            </button>
          </div>
        ) : (
          <button 
            onClick={onOpenAuth}
            className="btn-secondary"
            style={{ padding: '8px 14px', fontSize: '0.825rem', borderColor: 'rgba(139, 92, 246, 0.4)' }}
          >
            Masuk / Daftar
          </button>
        )}

        {/* Model Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-input)', padding: '4px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <Cpu size={14} color="#8b5cf6" />
          <select 
            value={selectedModel} 
            onChange={(e) => onSelectModel(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '0.8rem', fontWeight: 600, outline: 'none', cursor: 'pointer' }}
          >
            <option value="gemini-2.5-flash" style={{ background: '#0f172a' }}>Gemini 2.5 Flash (Super Cepat)</option>
            <option value="gemini-2.0-flash" style={{ background: '#0f172a' }}>Gemini 2.0 Flash (Sangat Akurat)</option>
            <option value="gemini-flash-latest" style={{ background: '#0f172a' }}>Gemini Flash (Versi Terbaru)</option>
          </select>
        </div>

        {/* API Key Status Button */}
        <button 
          onClick={onOpenApiKeyModal} 
          className={hasApiKey ? "btn-secondary" : "btn-primary"}
          style={{ padding: '8px 14px', fontSize: '0.825rem' }}
        >
          <Key size={15} />
          {hasApiKey ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              API Key Terhubung <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
            </span>
          ) : (
            <span>Set Gemini API Key</span>
          )}
        </button>
      </div>
    </header>
  );
}
