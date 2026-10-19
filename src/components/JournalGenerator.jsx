import React, { useState } from 'react';
import { BookOpen, FileText, Sparkles, Upload, ShieldCheck, Feather, GraduationCap, Brain } from 'lucide-react';

const DOCUMENT_TEMPLATES = [
  {
    id: 'jurnal',
    title: 'Jurnal Ilmiah (APA/IEEE)',
    desc: 'Format publikasi bereputasi lengkap dengan Abstrak ID & EN, Metodologi, dan Pembahasan.',
    icon: GraduationCap,
    badge: 'Standard Jurnal / Skripsi'
  },
  {
    id: 'makalah',
    title: 'Makalah Tugas Kuliah',
    desc: 'Format Bab I Pendahuluan hingga Bab V Kesimpulan standar perkuliahan.',
    icon: BookOpen,
    badge: 'Tugas Kuliah / Sekolah'
  },
  {
    id: 'esai',
    title: 'Esai Akademik & Opini',
    desc: 'Tulisan ilmiah argumentatif kritis dengan analisis teori mendalam.',
    icon: Feather,
    badge: 'Argumentatif & Kritis'
  },
  {
    id: 'laporan',
    title: 'Laporan Riset & Studi',
    desc: 'Format laporan hasil studi kasus, survei, atau analisis proyek.',
    icon: FileText,
    badge: 'Laporan Eksperimen'
  },
  {
    id: 'soal',
    title: 'Penjawab Soal & Kuis Kuliah',
    desc: 'Solusi kunci jawaban presisi & pembahasan langkah demi langkah untuk ujian/tugas.',
    icon: Brain,
    badge: 'Kuis & Exam Solver'
  }
];

export default function JournalGenerator({ onGenerate, isGenerating, savedJournals = [], onSelectJournal }) {
  const [topic, setTopic] = useState('');
  const [documentType, setDocumentType] = useState('Jurnal Ilmiah (APA/IEEE)');
  const [subject, setSubject] = useState('');
  const [targetWords, setTargetWords] = useState('1500 - 2500 kata');
  const [language, setLanguage] = useState('Bahasa Indonesia');
  const [citationStyle, setCitationStyle] = useState('APA 7th Edition');
  const [guidelines, setGuidelines] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;
        if (text && text.trim()) {
          setGuidelines(prev => prev ? `${prev}\n\n[Konten Dokumen Referensi]:\n${text.slice(0, 1500)}` : `[Konten Dokumen Referensi]:\n${text.slice(0, 1500)}`);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!topic.trim()) {
      alert('Silakan masukkan topik atau judul tugas terlebih dahulu.');
      return;
    }

    onGenerate({
      topic,
      documentType,
      subject,
      targetWords,
      language,
      citationStyle,
      guidelines
    });
  };

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Banner */}
      <div 
        className="card" 
        style={{
          padding: '32px',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 27, 75, 0.9) 50%, rgba(15, 23, 42, 0.95) 100%)',
          borderRadius: '20px',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          boxShadow: '0 12px 35px rgba(0, 0, 0, 0.4)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ position: 'relative', zIndex: 10, maxWidth: '650px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600, color: '#a5b4fc', marginBottom: '14px' }}>
            <ShieldCheck size={16} color="#10b981" />
            <span>Agent AI Akademik + Auto Check Plagiarisme</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', marginBottom: '8px' }}>
            Pembuat Jurnal & Tugas Akademik Otomatis
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8', lineHeight: '1.6' }}>
            Kirimkan judul, topik, atau upload dokumen draf Anda. AI akan menyusun Jurnal Ilmiah utuh, Makalah, atau Tugas lengkap dengan Abstrak, Pembahasan Metodologis, dan Pemindaian Plagiarisme otomatis yang dijamin lolos Turnitin.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Template Selection */}
        <div className="card" style={{ padding: '24px', borderRadius: '18px' }}>
          <h2 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={16} color="#8b5cf6" />
            1. Pilih Format Dokumen Akademik
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            {DOCUMENT_TEMPLATES.map((tmpl) => {
              const Icon = tmpl.icon;
              const isSelected = documentType === tmpl.title;
              return (
                <div
                  key={tmpl.id}
                  onClick={() => setDocumentType(tmpl.title)}
                  style={{
                    padding: '16px',
                    borderRadius: '14px',
                    border: isSelected ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.08)',
                    background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'rgba(15, 23, 42, 0.5)',
                    boxShadow: isSelected ? '0 0 20px rgba(99, 102, 241, 0.2)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px'
                  }}
                >
                  <div style={{ padding: '10px', borderRadius: '10px', background: isSelected ? '#6366f1' : 'rgba(255, 255, 255, 0.05)', color: isSelected ? '#ffffff' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>{tmpl.title}</h3>
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.06)', color: '#a5b4fc', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        {tmpl.badge}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: '1.4' }}>{tmpl.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Input Form Fields */}
        <div className="card" style={{ padding: '24px', borderRadius: '18px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={16} color="#8b5cf6" />
            2. Topik & Detail Penulisan
          </h2>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '8px' }}>
              Topik Utama / Judul Jurnal atau Tugas <span style={{ color: '#f43f5e' }}>*</span>
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Contoh: Analisis Penerapan Artificial Intelligence dalam Meningkatkan Efisiensi Layanan Perbankan Digital di Indonesia"
              style={{ width: '100%' }}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '8px' }}>
                Mata Kuliah / Bidang Studi (Opsional)
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Contoh: Sistem Informasi / Ekonomi Digital"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '8px' }}>
                Target Panjang Tulisan
              </label>
              <select
                value={targetWords}
                onChange={(e) => setTargetWords(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="1000 - 1500 kata">Singkat (1000 - 1500 kata)</option>
                <option value="1500 - 2500 kata">Standar Jurnal (1500 - 2500 kata)</option>
                <option value="2500 - 4000 kata">Mendalam / Lengkap (2500 - 4000 kata)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '8px' }}>
                Bahasa Dokumen
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="Bahasa Indonesia">Bahasa Indonesia (Akademik Baku)</option>
                <option value="English">English (Academic Standard)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '8px' }}>
                Gaya Sitasi & Referensi
              </label>
              <select
                value={citationStyle}
                onChange={(e) => setCitationStyle(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="APA 7th Edition">APA 7th Edition (Standar Umum)</option>
                <option value="IEEE Format">IEEE Format (Teknik & Komputer)</option>
                <option value="Harvard Style">Harvard Style</option>
                <option value="Chicago Manual">Chicago Manual of Style</option>
              </select>
            </div>
          </div>

          {/* Guidelines & Upload */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '8px' }}>
              Panduan Khusus / Catatan Dosen / Upload Dokumen Referensi
            </label>
            <textarea
              value={guidelines}
              onChange={(e) => setGuidelines(e.target.value)}
              rows={3}
              placeholder="Masukkan garis besar khusus, teori yang harus digunakan, atau poin pembahasan tertentu..."
              style={{ width: '100%', resize: 'vertical' }}
            />
            
            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(15, 23, 42, 0.6)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Upload size={18} color="#8b5cf6" />
                <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                  {uploadedFileName ? `Dokumen terlampir: ${uploadedFileName}` : 'Upload file referensi / draf kasar (.txt, .docx, .pdf)'}
                </span>
              </div>
              <label className="btn-secondary" style={{ fontSize: '0.75rem', padding: '6px 14px', cursor: 'pointer' }}>
                <span>{uploadedFileName ? 'Ganti File' : 'Pilih File'}</span>
                <input type="file" onChange={handleFileUpload} accept=".txt,.docx,.pdf" style={{ display: 'none' }} />
              </label>
            </div>
          </div>
        </div>

        {/* Generate Action Button */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
          <button
            type="submit"
            disabled={isGenerating}
            className="btn-primary"
            style={{
              padding: '16px 36px',
              fontSize: '1rem',
              fontWeight: 800,
              borderRadius: '14px',
              width: '100%',
              maxWidth: '480px',
              justifyContent: 'center',
              boxShadow: '0 8px 25px rgba(99, 102, 241, 0.4)'
            }}
          >
            {isGenerating ? (
              <>
                <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#ffffff', animation: 'spin 1s linear infinite' }} />
                <span>Sedang Menyusun Jurnal & Scan Plagiarisme...</span>
              </>
            ) : (
              <>
                <Sparkles size={20} color="#e0e7ff" />
                <span>Buat Jurnal Otomatis & Scan Plagiarisme</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Previously Saved Journals History */}
      {savedJournals && savedJournals.length > 0 && (
        <div style={{ marginTop: '40px', paddingTop: '28px', borderTop: '1px solid var(--border-color)', animation: 'fadeIn 0.5s ease' }}>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} color="#c084fc" />
            <span>Riwayat Pembuatan Jurnal & Tugas</span>
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
            {savedJournals.map((journal) => (
              <div 
                key={journal.id} 
                onClick={() => onSelectJournal(journal)}
                className="glass-panel glass-panel-hover" 
                style={{ padding: '18px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(255,255,255,0.02)' }}
              >
                <h5 style={{ fontSize: '0.85rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.4' }}>
                  {journal.title}
                </h5>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  Topik: {journal.topic || '-'}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '0.68rem', color: 'var(--text-dim)', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '8px' }}>
                  <span>{new Date(journal.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <span style={{ color: '#c084fc', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '2px' }}>Buka Dokumen →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
