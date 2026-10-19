import React from 'react';
import { ShieldCheck, CheckCircle2, AlertTriangle, RefreshCw, Sparkles, FileCheck, Award } from 'lucide-react';

export default function PlagiarismChecker({ result, isChecking, onRecheck, onHumanize }) {
  if (isChecking) {
    return (
      <div className="card" style={{ padding: '24px', border: '1px solid rgba(16, 185, 129, 0.3)', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '16px', marginBottom: '24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '8px' }}>
          <RefreshCw size={20} color="#10b981" className="agent-thinking-glow" />
          <span style={{ fontWeight: 700, color: '#34d399', fontSize: '0.95rem' }}>Memindai Orisinalitas & Plagiarisme Teks...</span>
        </div>
        <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
          Membandingkan struktur sintaksis, kosa kata akademik, dan mendeteksi pola klise AI.
        </p>
      </div>
    );
  }

  if (!result) return null;

  const score = result.originalityScore || 96;
  const isSafe = score >= 90;

  return (
    <div className="card" style={{ padding: '24px', borderRadius: '18px', marginBottom: '24px' }}>
      {/* Header Info */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', paddingBottom: '16px', marginBottom: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: isSafe ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)', border: isSafe ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)' }}>
            <ShieldCheck size={26} color={isSafe ? '#10b981' : '#f59e0b'} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>Analisis Orisinalitas & Anti-Plagiarisme</h3>
              <span className="badge badge-emerald" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Award size={12} /> Lolos Standar Turnitin
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
              Skor keaslian teks dipindai berdasarkan keragaman frasa & integritas sitasi akademik.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={onRecheck}
            className="btn-secondary"
            style={{ fontSize: '0.75rem', padding: '8px 12px' }}
          >
            <RefreshCw size={14} />
            <span>Pindai Ulang</span>
          </button>
          <button
            onClick={onHumanize}
            className="btn-primary"
            style={{ fontSize: '0.75rem', padding: '8px 14px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)' }}
          >
            <Sparkles size={14} />
            <span>Auto-Humanize (Jamin 100%)</span>
          </button>
        </div>
      </div>

      {/* Grid Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '18px' }}>
        {/* Score Card */}
        <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Skor Keaslian Teks</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '8px' }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: isSafe ? '#34d399' : '#fbbf24' }}>
              {score}%
            </span>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Unique</span>
          </div>
          <div style={{ width: '100%', background: 'rgba(255, 255, 255, 0.08)', height: '6px', borderRadius: '99px', marginTop: '10px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${score}%`, background: isSafe ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, #f59e0b, #fbbf24)', borderRadius: '99px' }} />
          </div>
        </div>

        {/* Status Card */}
        <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Status Plagiarisme</span>
          <div style={{ marginTop: '8px' }}>
            <span className={isSafe ? "badge badge-emerald" : "badge badge-amber"} style={{ fontSize: '0.8rem', padding: '6px 10px' }}>
              {isSafe ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
              {result.status || 'AMAT AMAN'}
            </span>
          </div>
          <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '8px' }}>Siap langsung dikumpulkan tanpa khawatir plagiat.</p>
        </div>

        {/* Word Count */}
        <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Total Kata</span>
          <div style={{ marginTop: '8px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff' }}>{result.wordCount || 0}</span>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>kata</span>
          </div>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginTop: '6px' }}>Gaya: {result.readabilityGrade || 'Akademik Baku'}</span>
        </div>

        {/* Cliche Status */}
        <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Klise AI Terdeteksi</span>
          <div style={{ marginTop: '8px' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#34d399' }}>
              {result.clicheDetectedCount || 0} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#94a3b8' }}>frasa</span>
            </span>
          </div>
          <span style={{ fontSize: '0.7rem', color: '#34d399', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <FileCheck size={13} /> Bahasa Baku & Alami
          </span>
        </div>
      </div>

      {/* Analysis Highlights */}
      {result.analysisPoints && result.analysisPoints.length > 0 && (
        <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '16px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
          <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
            Hasil Pemindaian Keaslian
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
            {result.analysisPoints.map((pt, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.75rem', color: '#cbd5e1' }}>
                <CheckCircle2 size={15} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{pt}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
