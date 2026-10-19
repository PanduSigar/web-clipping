import React from 'react';
import { Database, MessageSquareCode, BarChart3, Wand2, FileSpreadsheet, ShieldAlert, GraduationCap, Sparkles, Presentation, Scissors, Flame } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, hasData, appMode, setAppMode }) {
  const dataMenuItems = [
    { id: 'data', label: 'Dataset & Data Table', icon: Database, badge: null },
    { id: 'chat', label: 'AI Agent Assistant', icon: MessageSquareCode, badge: 'AI' },
    { id: 'charts', label: 'Visualizer & Grafik', icon: BarChart3, badge: null },
    { id: 'cleaner', label: 'Pembersih Data', icon: Wand2, badge: 'Auto' },
    { id: 'report', label: 'Laporan Eksekutif', icon: FileSpreadsheet, badge: 'Doc' },
    { id: 'presentation', label: 'Slide Presentasi AI', icon: Presentation, badge: 'Deck' }
  ];

  return (
    <aside className="sidebar">
      {/* Mode Switcher */}
      <div style={{ padding: '0 0 16px 0', borderBottom: '1px solid var(--border-color)', marginBottom: '16px' }}>
        <p style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.08em', marginBottom: '8px' }}>
          Pilih Mode Agent
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px', background: 'rgba(15, 23, 42, 0.6)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <button
            onClick={() => {
              setAppMode('academic');
              setActiveTab('journal');
            }}
            style={{
              padding: '8px 2px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: appMode === 'academic' ? 'var(--gradient-primary)' : 'transparent',
              color: appMode === 'academic' ? '#ffffff' : 'var(--text-muted)',
              fontSize: '0.68rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              transition: 'all 0.2s ease'
            }}
            title="Jurnal & Tugas"
          >
            <GraduationCap size={12} />
            <span>Akademik</span>
          </button>

          <button
            onClick={() => {
              setAppMode('data');
              setActiveTab('data');
            }}
            style={{
              padding: '8px 2px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: appMode === 'data' ? 'var(--gradient-primary)' : 'transparent',
              color: appMode === 'data' ? '#ffffff' : 'var(--text-muted)',
              fontSize: '0.68rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              transition: 'all 0.2s ease'
            }}
            title="Data Analyst"
          >
            <Database size={12} />
            <span>Analyst</span>
          </button>

          <button
            onClick={() => {
              setAppMode('clipper');
              setActiveTab('clipper');
            }}
            style={{
              padding: '8px 2px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: appMode === 'clipper' ? 'var(--gradient-primary)' : 'transparent',
              color: appMode === 'clipper' ? '#ffffff' : 'var(--text-muted)',
              fontSize: '0.68rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              transition: 'all 0.2s ease'
            }}
            title="YouTube Clipper"
          >
            <Scissors size={12} />
            <span>Clipper</span>
          </button>
        </div>
      </div>

      {appMode === 'academic' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ padding: '0 8px 4px 8px' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.08em' }}>
              Menu Akademik & Tugas
            </p>
          </div>

          <button
            onClick={() => setActiveTab('journal')}
            className={`nav-item ${activeTab === 'journal' ? 'active' : ''}`}
            style={{ width: '100%', justifyContent: 'flex-start', cursor: 'pointer' }}
          >
            <GraduationCap size={18} />
            <span style={{ fontSize: '0.875rem' }}>Pembuat Jurnal & Makalah</span>
          </button>

          <button
            onClick={() => setActiveTab('solver')}
            className={`nav-item ${activeTab === 'solver' ? 'active' : ''}`}
            style={{ width: '100%', justifyContent: 'flex-start', cursor: 'pointer' }}
          >
            <Sparkles size={18} color="#a855f7" />
            <span style={{ fontSize: '0.875rem' }}>Penjawab Soal & Ujian</span>
          </button>

          <button
            onClick={() => setActiveTab('presentation')}
            className={`nav-item ${activeTab === 'presentation' ? 'active' : ''}`}
            style={{ width: '100%', justifyContent: 'flex-start', cursor: 'pointer' }}
          >
            <Presentation size={18} color="#6366f1" />
            <span style={{ fontSize: '0.875rem' }}>Pembuat Slide Presentasi</span>
          </button>

          <div style={{ marginTop: '16px', background: 'rgba(99, 102, 241, 0.06)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Sparkles size={16} color="#8b5cf6" />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#a5b4fc' }}>Agent Akademik AI</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              Pilih antara penyusunan Jurnal, Soal & Ujian, atau Pembuat Slide Presentasi otomatis.
            </p>
          </div>
        </div>
      ) : appMode === 'clipper' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ padding: '0 8px 4px 8px' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.08em' }}>
              Menu Video Clipper
            </p>
          </div>

          <button
            onClick={() => setActiveTab('clipper')}
            className={`nav-item ${activeTab === 'clipper' ? 'active' : ''}`}
            style={{ width: '100%', justifyContent: 'flex-start', cursor: 'pointer' }}
          >
            <Scissors size={18} color="#c084fc" />
            <span style={{ fontSize: '0.875rem' }}>YouTube Clipper AI</span>
          </button>

          <div style={{ marginTop: '16px', background: 'rgba(139, 92, 246, 0.06)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Flame size={16} color="#ec4899" />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fbcfe8' }}>FYP Clipper Agent</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              Temukan segmen-segmen viral berpotensi FYP tinggi secara otomatis menggunakan kecerdasan buatan.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div style={{ padding: '4px 8px 12px 8px' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.08em' }}>
              Menu Analyst Data
            </p>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {dataMenuItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isDisabled = !hasData && item.id !== 'data';

              return (
                <button
                  key={item.id}
                  onClick={() => !isDisabled && setActiveTab(item.id)}
                  disabled={isDisabled}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  style={{
                    width: '100%',
                    justifyContent: 'space-between',
                    opacity: isDisabled ? 0.4 : 1,
                    cursor: isDisabled ? 'not-allowed' : 'pointer'
                  }}
                  title={isDisabled ? 'Unggah dataset terlebih dahulu' : ''}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Icon size={18} />
                    <span style={{ fontSize: '0.875rem' }}>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className={`badge ${isActive ? 'badge-indigo' : 'badge-emerald'}`} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {!hasData && (
            <div style={{ marginTop: 'auto', background: 'rgba(99, 102, 241, 0.08)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <ShieldAlert size={16} color="#8b5cf6" />
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#a5b4fc' }}>Belum ada dataset</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                Unggah file Excel, CSV, PDF, atau JSON Anda untuk mulai menganalisis.
              </p>
            </div>
          )}
        </>
      )}
    </aside>
  );
}

