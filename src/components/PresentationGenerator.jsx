import React, { useState } from 'react';
import { Presentation, Sparkles, Layout, Palette, Users, FileText, Upload, Sliders } from 'lucide-react';

const AUDIENCE_OPTIONS = [
  'Akademik & Seminar Kuliah',
  'Bisnis & Executive Presentation',
  'Pitch Deck Startup & Investor',
  'Workshop & Training Edukatif',
  'Umum / Publik'
];

export const PRESENTATION_THEMES = [
  {
    id: 'cyber-dark',
    name: 'Cyber Dark Modern',
    bg: 'radial-gradient(ellipse at 85% 15%, rgba(99, 102, 241, 0.25) 0%, #070a12 70%)',
    pureBg: '#070a12',
    cardBg: 'rgba(15, 23, 42, 0.85)',
    accent: '#6366f1',
    gradientAccent: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
    glowColor: 'rgba(99, 102, 241, 0.4)',
    text: '#ffffff',
    subtext: '#94a3b8',
    itemBg: 'rgba(30, 41, 59, 0.6)'
  },
  {
    id: 'midnight-blue',
    name: 'Midnight Navy Luxury',
    bg: 'radial-gradient(ellipse at 85% 15%, rgba(6, 182, 212, 0.25) 0%, #040b19 70%)',
    pureBg: '#040b19',
    cardBg: 'rgba(11, 25, 44, 0.85)',
    accent: '#06b6d4',
    gradientAccent: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
    glowColor: 'rgba(6, 182, 212, 0.4)',
    text: '#ffffff',
    subtext: '#bae6fd',
    itemBg: 'rgba(15, 30, 55, 0.6)'
  },
  {
    id: 'emerald-clean',
    name: 'Emerald Wealth',
    bg: 'radial-gradient(ellipse at 85% 15%, rgba(16, 185, 129, 0.25) 0%, #021a12 70%)',
    pureBg: '#021a12',
    cardBg: 'rgba(4, 44, 30, 0.85)',
    accent: '#10b981',
    gradientAccent: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    text: '#ffffff',
    subtext: '#a7f3d0',
    itemBg: 'rgba(6, 60, 40, 0.6)'
  },
  {
    id: 'sunset-glow',
    name: 'Sunset Bronze Luxury',
    bg: 'radial-gradient(ellipse at 85% 15%, rgba(249, 115, 22, 0.25) 0%, #170c06 70%)',
    pureBg: '#170c06',
    cardBg: 'rgba(35, 20, 12, 0.85)',
    accent: '#f97316',
    gradientAccent: 'linear-gradient(135deg, #f97316 0%, #e11d48 100%)',
    glowColor: 'rgba(249, 115, 22, 0.4)',
    text: '#ffffff',
    subtext: '#fed7aa',
    itemBg: 'rgba(45, 25, 15, 0.6)'
  },
  {
    id: 'minimal-light',
    name: 'Minimalist Platinum Light',
    bg: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    pureBg: '#f8fafc',
    cardBg: '#ffffff',
    accent: '#4f46e5',
    gradientAccent: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    glowColor: 'rgba(79, 70, 229, 0.2)',
    text: '#0f172a',
    subtext: '#475569',
    itemBg: '#f1f5f9'
  }
];

export default function PresentationGenerator({ onGenerate, isGenerating, initialSourceText = '', savedPresentations = [], onSelectPresentation }) {
  const [topic, setTopic] = useState('');
  const [audience, setAudience] = useState('Akademik & Seminar Kuliah');
  const [slideCount, setSlideCount] = useState(6);
  const [theme, setTheme] = useState('cyber-dark');
  const [sourceText, setSourceText] = useState(initialSourceText);
  const [uploadedFileName, setUploadedFileName] = useState('');

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;
        if (text && text.trim()) {
          setSourceText(prev => prev ? `${prev}\n\n[Ringkasan Dokumen ${file.name}]:\n${text.slice(0, 3000)}` : text.slice(0, 3000));
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!topic.trim() && !sourceText.trim()) {
      alert('Silakan masukkan topik presentasi atau sediakan materi sumber teks.');
      return;
    }

    onGenerate({
      topic: topic.trim() || 'Presentasi Rangkuman Dokumen',
      audience,
      slideCount: Number(slideCount),
      theme,
      sourceText
    });
  };

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Banner */}
      <div 
        className="card"
        style={{
          padding: '32px',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 27, 75, 0.9) 50%, rgba(15, 23, 42, 0.95) 100%)',
          borderRadius: '20px',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          boxShadow: '0 12px 35px rgba(0, 0, 0, 0.4)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ position: 'relative', zIndex: 10, maxWidth: '680px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600, color: '#818cf8', marginBottom: '14px' }}>
            <Presentation size={16} color="#6366f1" />
            <span>AI Presentation & Pitch Deck Creator</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', marginBottom: '8px' }}>
            Pembuat Slide Presentasi AI Interaktif
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8', lineHeight: '1.6' }}>
            Ubah topik atau dokumen jurnal/laporan menjadi slide presentasi profesional visual lengkap dengan skrip narasi pembicara (speaker notes) & preview interaktif.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Section 1: Topic & Target Audience */}
        <div className="card" style={{ padding: '24px', borderRadius: '18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={16} color="#6366f1" />
            1. Informasi Presentasi & Audiens
          </h2>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '8px', display: 'block' }}>
              Judul / Topik Utama Presentasi *
            </label>
            <input 
              type="text"
              placeholder="Contoh: Peran Artificial Intelligence dalam Transformasi Digital Pendidikan 2026"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              style={{ width: '100%' }}
              required={!sourceText.trim()}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={14} color="#818cf8" />
                Target Audiens & Konteks
              </label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                style={{ width: '100%' }}
              >
                {AUDIENCE_OPTIONS.map((opt, idx) => (
                  <option key={idx} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Layout size={14} color="#818cf8" />
                Jumlah Slide
              </label>
              <select
                value={slideCount}
                onChange={(e) => setSlideCount(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value={3}>3 Slide (Rangkuman Singkat)</option>
                <option value={5}>5 Slide (Standar Ringkas)</option>
                <option value={6}>6 Slide (Ideal / Rekomendasi)</option>
                <option value={8}>8 Slide (Mendalam)</option>
                <option value={10}>10 Slide (Komprehensif)</option>
                <option value={12}>12 Slide (Lengkap / Full Deck)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Visual Theme Selection */}
        <div className="card" style={{ padding: '24px', borderRadius: '18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Palette size={16} color="#6366f1" />
            2. Pilih Tema Visual & Palet Warna
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
            {PRESENTATION_THEMES.map((t) => {
              const isSelected = theme === t.id;
              return (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  style={{
                    padding: '12px',
                    borderRadius: '12px',
                    border: isSelected ? '2px solid #6366f1' : '1px solid var(--border-color)',
                    background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'rgba(15, 23, 42, 0.4)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    textAlign: 'left',
                    transition: 'all 0.2s ease',
                    boxShadow: isSelected ? '0 0 15px rgba(99, 102, 241, 0.25)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', gap: '4px', height: '14px', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ flex: 2, background: t.cardBg }} />
                    <div style={{ flex: 1, background: t.accent }} />
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isSelected ? '#ffffff' : '#94a3b8' }}>
                    {t.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 3: Optional Source Material */}
        <div className="card" style={{ padding: '24px', borderRadius: '18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <h2 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={16} color="#6366f1" />
              3. Sumber Materi / Catatan Tambahan (Opsional)
            </h2>

            <label className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '6px 12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Upload size={14} />
              <span>{uploadedFileName ? uploadedFileName : 'Unggah File Teks/TXT'}</span>
              <input type="file" accept=".txt,.md,.json,.csv" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
          </div>

          <textarea
            placeholder="Tempelkan abstrak jurnal, laporan data, atau outline yang ingin dirangkum menjadi slide di sini..."
            rows={4}
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            style={{ width: '100%', resize: 'vertical' }}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isGenerating}
          className="btn btn-primary"
          style={{
            padding: '16px 28px',
            fontSize: '1rem',
            fontWeight: 800,
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            background: 'var(--gradient-primary)',
            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.35)',
            opacity: isGenerating ? 0.7 : 1,
            cursor: isGenerating ? 'wait' : 'pointer'
          }}
        >
          {isGenerating ? (
            <>
              <div className="spinner" style={{ width: '20px', height: '20px' }} />
              <span>Menyusun Slide Presentasi Visual AI...</span>
            </>
          ) : (
            <>
              <Sparkles size={20} />
              <span>Buat Slide Presentasi AI Sekarang</span>
            </>
          )}
        </button>
      </form>

      {/* Previously Saved Presentations History */}
      {savedPresentations && savedPresentations.length > 0 && (
        <div style={{ marginTop: '40px', paddingTop: '28px', borderTop: '1px solid var(--border-color)', animation: 'fadeIn 0.5s ease' }}>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Presentation size={18} color="#6366f1" />
            <span>Riwayat Slide Presentasi</span>
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
            {savedPresentations.map((pres) => (
              <div 
                key={pres.id} 
                onClick={() => onSelectPresentation(pres)}
                className="glass-panel glass-panel-hover" 
                style={{ padding: '18px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(255,255,255,0.02)' }}
              >
                <h5 style={{ fontSize: '0.85rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.4' }}>
                  {pres.title}
                </h5>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '0.68rem', color: 'var(--text-dim)', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '8px' }}>
                  <span>{new Date(pres.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <span style={{ color: '#6366f1', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '2px' }}>Buka Slide →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
