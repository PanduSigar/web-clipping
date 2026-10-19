import React, { useState } from 'react';
import { Wand2, Download, CheckCircle2, ShieldCheck, Sparkles, RefreshCw } from 'lucide-react';
import { cleanDataset, exportToCSV, auditDataset } from '../services/dataParser';

export default function DataCleaner({ dataset, onDatasetUpdate }) {
  const [removeDupes, setRemoveDupes] = useState(true);
  const [fillMissing, setFillMissing] = useState(true);
  const [trimStrings, setTrimStrings] = useState(true);
  const [isCleaned, setIsCleaned] = useState(false);

  const handleClean = () => {
    const cleanedRaw = cleanDataset(dataset.rawData, {
      removeDuplicates: removeDupes,
      fillMissingNumeric: fillMissing,
      trimStrings
    });

    const newAudit = auditDataset(cleanedRaw, dataset.headers);

    onDatasetUpdate({
      ...dataset,
      rawData: cleanedRaw,
      audit: newAudit
    });

    setIsCleaned(true);
    setTimeout(() => setIsCleaned(false), 3000);
  };

  const handleExport = () => {
    exportToCSV(dataset.rawData, `Cleaned_${dataset.fileName.replace(/\.[^/.]+$/, "")}.csv`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <div className="glass-panel" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
          <div style={{ padding: '12px', borderRadius: '16px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <Wand2 size={24} color="#6ee7b7" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Studio Pembersihan Data 1-Klik</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Otomatisasi pembersihan kualitas data untuk meminimalkan error</p>
          </div>
        </div>

        {/* Cleaning Options Checklist */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '14px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={removeDupes} 
              onChange={(e) => setRemoveDupes(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: '#6366f1' }}
            />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Deteksi & Hapus Baris Duplikat</div>
              <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Menghilangkan baris identik secara tepat untuk menghindari data ganda.</div>
            </div>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '14px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={fillMissing} 
              onChange={(e) => setFillMissing(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: '#6366f1' }}
            />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Isi Nilai Kosong (Missing Values)</div>
              <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Mengisi sel bernilai null/blank dengan standar 0 untuk angka atau "N/A" untuk teks.</div>
            </div>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '14px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={trimStrings} 
              onChange={(e) => setTrimStrings(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: '#6366f1' }}
            />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Normalisasi Teks & Trim Spasi</div>
              <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Menghapus spasi berlebih di awal/akhir kata.</div>
            </div>
          </label>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: '12px' }}>
          <button onClick={handleClean} className="btn-primary" style={{ padding: '12px 24px', fontSize: '0.9rem' }}>
            {isCleaned ? <CheckCircle2 size={18} color="#6ee7b7" /> : <Wand2 size={18} />}
            <span>{isCleaned ? 'Berhasil Dibersihkan!' : 'Terapkan Pembersihan Data'}</span>
          </button>

          <button onClick={handleExport} className="btn-secondary" style={{ padding: '12px 20px', fontSize: '0.9rem' }}>
            <Download size={18} color="#06b6d4" />
            <span>Ekspor Hasil ke CSV</span>
          </button>
        </div>
      </div>

      {/* Health Score After Card */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
        <ShieldCheck size={32} color="#10b981" />
        <div>
          <div style={{ fontWeight: 700, color: '#6ee7b7', fontSize: '0.95rem' }}>Skor Kualitas Dataset Saat Ini: {dataset.audit.healthScore}/100</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Jumlah baris aktif: {dataset.audit.rowCount} baris | Tidak ada duplikasi fatal terdeteksi.
          </div>
        </div>
      </div>
    </div>
  );
}
