import React, { useState } from 'react';
import { FileSpreadsheet, Sparkles, Printer, Copy, Check, AlertTriangle, Key } from 'lucide-react';
import { marked } from 'marked';
import { generateExecutiveReport } from '../services/gemini';

export default function ReportGenerator({ dataset, apiKey, selectedModel, onOpenApiKeyModal, verifyAndConsumeQuota }) {
  const [reportText, setReportText] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (verifyAndConsumeQuota) {
      try {
        await verifyAndConsumeQuota(2500);
      } catch (quotaErr) {
        alert(quotaErr.message);
        return;
      }
    }
    if (!apiKey) {
      onOpenApiKeyModal();
      return;
    }
    setLoading(true);
    try {
      const markdown = await generateExecutiveReport({
        fileName: dataset.fileName,
        headers: dataset.headers,
        audit: dataset.audit,
        dataSample: dataset.rawData,
        apiKey,
        modelName: selectedModel
      });
      setReportText(markdown);
    } catch (err) {
      alert(`Gagal membuat laporan: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const copyReport = () => {
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '950px', margin: '0 auto' }}>
      {/* Top Banner / Generator Trigger */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '12px', borderRadius: '16px', background: 'var(--gradient-primary)' }}>
            <FileSpreadsheet size={24} color="white" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Laporan Eksekutif AI Agent</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Hasilkan ringkasan laporan manajerial profesional berbasis AI</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {reportText && (
            <>
              <button onClick={copyReport} className="btn-secondary" style={{ padding: '10px 16px', fontSize: '0.85rem' }}>
                {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                <span>{copied ? 'Tersalin!' : 'Salin Laporan'}</span>
              </button>
              <button onClick={printReport} className="btn-secondary" style={{ padding: '10px 16px', fontSize: '0.85rem' }}>
                <Printer size={16} />
                <span>Cetak / PDF</span>
              </button>
            </>
          )}

          <button onClick={handleGenerate} disabled={loading} className="btn-primary" style={{ padding: '10px 20px', fontSize: '0.85rem' }}>
            <Sparkles size={16} />
            <span>{loading ? 'Menyusun Laporan...' : 'Susun Laporan dengan AI'}</span>
          </button>
        </div>
      </div>

      {!apiKey && (
        <div style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 'var(--radius-md)', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={18} color="#f59e0b" />
            <span style={{ fontSize: '0.85rem', color: '#fcd34d', fontWeight: 600 }}>
              Kunci Gemini API diperlukan untuk membuat laporan otomatis.
            </span>
          </div>
          <button onClick={onOpenApiKeyModal} className="btn-primary" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
            <Key size={14} /> Set Gemini API Key
          </button>
        </div>
      )}

      {/* Report Markdown Container */}
      <div className="glass-panel" style={{ padding: '36px', minHeight: '400px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '16px', color: 'var(--text-muted)' }}>
            <Sparkles size={36} color="#8b5cf6" className="agent-thinking-glow" />
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#a5b4fc' }}>AI Agent sedang menyusun Laporan Eksekutif...</div>
            <div style={{ fontSize: '0.825rem' }}>Menganalisis statistik, korelasi, dan poin strategis data...</div>
          </div>
        ) : reportText ? (
          <div 
            className="markdown-body" 
            dangerouslySetInnerHTML={{ __html: marked.parse(reportText) }}
            style={{ fontSize: '0.95rem', lineHeight: '1.7' }}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <FileSpreadsheet size={48} color="var(--text-dim)" style={{ marginBottom: '14px' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>Belum Ada Laporan Ditampilkan</h3>
            <p style={{ fontSize: '0.85rem', maxWidth: '450px', margin: '0 auto 20px auto' }}>
              Klik tombol <strong>"Susun Laporan dengan AI"</strong> di kanan atas untuk memicu AI Agent menganalisis dataset dan membuat dokumen laporan eksekutif lengkap.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
