import React, { useState } from 'react';
import { marked } from 'marked';
import { Download, Edit3, Eye, Sparkles, Copy, Check, ArrowLeft, RefreshCw, FileText, FileSpreadsheet, Presentation } from 'lucide-react';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import PlagiarismChecker from './PlagiarismChecker';

export default function JournalEditor({
  content,
  onUpdateContent,
  plagiarismResult,
  isPlagiarismChecking,
  onRecheckPlagiarism,
  onHumanize,
  onRefineSection,
  isRefining,
  onBackToForm,
  onConvertToPresentation
}) {
  const [activeTab, setActiveTab] = useState('preview');
  const [copied, setCopied] = useState(false);
  const [refineInstruction, setRefineInstruction] = useState('');
  const [selectedSection, setSelectedSection] = useState('Semua / Umum');
  const [isExportingWord, setIsExportingWord] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefineSubmit = (e) => {
    e.preventDefault();
    if (!refineInstruction.trim()) return;
    onRefineSection({
      sectionName: selectedSection,
      instruction: refineInstruction
    });
    setRefineInstruction('');
  };

  const exportToWord = async () => {
    try {
      setIsExportingWord(true);
      if (!content) return;
      
      const lines = content.split('\n');
      const docElements = [];

      lines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed) {
          docElements.push(new Paragraph({ text: '', spacing: { after: 120 } }));
          return;
        }

        if (trimmed.startsWith('# ')) {
          docElements.push(
            new Paragraph({
              text: trimmed.replace('# ', ''),
              heading: HeadingLevel.TITLE,
              alignment: AlignmentType.CENTER,
              spacing: { before: 240, after: 240 }
            })
          );
        } else if (trimmed.startsWith('## ')) {
          docElements.push(
            new Paragraph({
              text: trimmed.replace('## ', ''),
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 200, after: 120 }
            })
          );
        } else if (trimmed.startsWith('### ')) {
          docElements.push(
            new Paragraph({
              text: trimmed.replace('### ', ''),
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 160, after: 80 }
            })
          );
        } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          docElements.push(
            new Paragraph({
              text: trimmed.replace(/^[-*]\s+/, ''),
              bullet: { level: 0 },
              spacing: { after: 80 }
            })
          );
        } else {
          const cleanText = trimmed.replace(/\*\*/g, '').replace(/\*/g, '');
          docElements.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: cleanText,
                  font: 'Times New Roman',
                  size: 24
                })
              ],
              spacing: { after: 140, line: 360 },
              alignment: AlignmentType.JUSTIFY
            })
          );
        }
      });

      const doc = new Document({
        sections: [
          {
            properties: {
              page: {
                margin: {
                  top: 1440,
                  bottom: 1440,
                  left: 1440,
                  right: 1440
                }
              }
            },
            children: docElements
          }
        ]
      });

      const blob = await Packer.toBlob(doc);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Jurnal_Akademik_Lengkap.docx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Word export error:', err);
      alert('Gagal mengekspor dokumen Word: ' + err.message);
    } finally {
      setIsExportingWord(false);
    }
  };

  const exportToPDF = () => {
    window.print();
  };

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Action Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', paddingBottom: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onBackToForm}
            className="btn-secondary"
            style={{ padding: '10px' }}
            title="Kembali ke Form"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={20} color="#8b5cf6" />
              Dokumen Jurnal & Tugas Berhasil Dibuat
            </h2>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Hasil telah dipindai otomatis dan siap disunting atau diunduh ke Word (.docx).
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
          {onConvertToPresentation && (
            <button
              onClick={() => onConvertToPresentation(content)}
              className="btn-secondary"
              style={{ fontSize: '0.75rem', padding: '8px 14px', color: '#818cf8', borderColor: 'rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.1)' }}
            >
              <Presentation size={14} />
              <span>Buat Slide Presentasi AI</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            className="btn-secondary"
            style={{ fontSize: '0.75rem', padding: '8px 14px' }}
          >
            {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
            <span>{copied ? 'Tersalin!' : 'Salin Teks'}</span>
          </button>

          <button
            onClick={exportToPDF}
            className="btn-secondary"
            style={{ fontSize: '0.75rem', padding: '8px 14px' }}
          >
            <Download size={14} />
            <span>Cetak / PDF</span>
          </button>

          <button
            onClick={exportToWord}
            disabled={isExportingWord}
            className="btn-primary"
            style={{ fontSize: '0.8rem', padding: '10px 18px', background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)' }}
          >
            {isExportingWord ? (
              <RefreshCw size={14} className="agent-thinking-glow" />
            ) : (
              <FileSpreadsheet size={16} />
            )}
            <span>{isExportingWord ? 'Mengekspor Word...' : 'Unduh ke Word (.docx)'}</span>
          </button>
        </div>
      </div>

      {/* Plagiarism Checker Card */}
      <PlagiarismChecker
        result={plagiarismResult}
        isChecking={isPlagiarismChecking}
        onRecheck={onRecheckPlagiarism}
        onHumanize={onHumanize}
      />

      {/* AI Co-Pilot Refine Bar */}
      <div className="card" style={{ padding: '16px 20px', borderRadius: '14px' }}>
        <form onSubmit={handleRefineSubmit} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={16} color="#8b5cf6" />
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#e2e8f0', textTransform: 'uppercase' }}>AI Co-Pilot:</span>
          </div>

          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            style={{ fontSize: '0.75rem', padding: '8px 12px' }}
          >
            <option value="Semua / Umum">Seluruh Dokumen</option>
            <option value="Abstrak">Abstrak</option>
            <option value="Bab I Pendahuluan">Bab I Pendahuluan</option>
            <option value="Bab II Tinjauan Pustaka">Bab II Tinjauan Pustaka</option>
            <option value="Bab III Metodologi">Bab III Metodologi</option>
            <option value="Bab IV Pembahasan">Bab IV Pembahasan</option>
            <option value="Bab V Kesimpulan">Bab V Kesimpulan</option>
          </select>

          <input
            type="text"
            value={refineInstruction}
            onChange={(e) => setRefineInstruction(e.target.value)}
            placeholder="Instruksi perbaikan AI (Contoh: Perluas bagian pembahasan dengan studi kasus perbankan...)"
            style={{ flex: 1, minWidth: '240px', fontSize: '0.75rem', padding: '8px 12px' }}
          />

          <button
            type="submit"
            disabled={isRefining}
            className="btn-primary"
            style={{ fontSize: '0.75rem', padding: '8px 16px' }}
          >
            {isRefining ? (
              <RefreshCw size={14} className="agent-thinking-glow" />
            ) : (
              <Sparkles size={14} />
            )}
            <span>{isRefining ? 'Memproses...' : 'Sempurnakan Bagian'}</span>
          </button>
        </form>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '8px' }}>
        <button
          onClick={() => setActiveTab('preview')}
          className={`btn-ghost ${activeTab === 'preview' ? 'active' : ''}`}
          style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            padding: '8px 16px',
            background: activeTab === 'preview' ? '#6366f1' : 'transparent',
            color: activeTab === 'preview' ? '#ffffff' : '#94a3b8',
            borderRadius: '10px'
          }}
        >
          <Eye size={16} />
          <span>Pratinjau Jurnal (Formatted)</span>
        </button>

        <button
          onClick={() => setActiveTab('edit')}
          className={`btn-ghost ${activeTab === 'edit' ? 'active' : ''}`}
          style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            padding: '8px 16px',
            background: activeTab === 'edit' ? '#6366f1' : 'transparent',
            color: activeTab === 'edit' ? '#ffffff' : '#94a3b8',
            borderRadius: '10px'
          }}
        >
          <Edit3 size={16} />
          <span>Edit Markdown Teks</span>
        </button>
      </div>

      {/* Document View Content */}
      <div className="card" style={{ padding: '36px', borderRadius: '20px', minHeight: '600px', background: '#0b0f19' }}>
        {activeTab === 'preview' ? (
          <div
            className="markdown-body"
            style={{ lineHeight: '1.8', textAlign: 'justify' }}
            dangerouslySetInnerHTML={{ __html: marked(content || '') }}
          />
        ) : (
          <textarea
            value={content}
            onChange={(e) => onUpdateContent(e.target.value)}
            rows={28}
            style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: '0.875rem', lineHeight: '1.6', minHeight: '550px' }}
          />
        )}
      </div>
    </div>
  );
}
