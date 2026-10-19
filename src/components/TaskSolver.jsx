import React, { useState } from 'react';
import { HelpCircle, Brain, Sparkles, Upload, FileText, CheckCircle2, BookOpen, Layers } from 'lucide-react';

const POPULAR_SUBJECTS = [
  'Matematika & Kalkulus',
  'Pemrograman & Informatika',
  'Ekonomi & Akuntansi',
  'Hukum & Bisnis',
  'Manajemen & Pemasaran',
  'Psikologi & Sosial',
  'Kedokteran & Kesehatan',
  'Fisika & Kimia',
  'Bahasa & Literatur',
  'Umum / Lainnya'
];

export default function TaskSolver({ onSolve, isSolving }) {
  const [questions, setQuestions] = useState('');
  const [subject, setSubject] = useState('Umum / Lainnya');
  const [answerMode, setAnswerMode] = useState('Pembahasan Rinci & Langkah demi Langkah');
  const [uploadedFileName, setUploadedFileName] = useState('');

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;
        if (text && text.trim()) {
          setQuestions(prev => prev ? `${prev}\n\n[Konten Dokumen Soal]:\n${text.slice(0, 2000)}` : `[Konten Dokumen Soal]:\n${text.slice(0, 2000)}`);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!questions.trim()) {
      alert('Silakan masukkan atau tempel soal tugas Anda terlebih dahulu.');
      return;
    }

    onSolve({
      questions,
      subject,
      answerMode
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
          border: '1px solid rgba(139, 92, 246, 0.25)',
          boxShadow: '0 12px 35px rgba(0, 0, 0, 0.4)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ position: 'relative', zIndex: 10, maxWidth: '650px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', background: 'rgba(139, 92, 246, 0.15)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600, color: '#c084fc', marginBottom: '14px' }}>
            <Brain size={16} color="#a855f7" />
            <span>AI Penjawab Soal, Kuis & Tugas Kampus</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', marginBottom: '8px' }}>
            Asisten Penjawab Soal & Pembahasan Tugas
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8', lineHeight: '1.6' }}>
            Tempelkan soal kuis, ujian, atau lembar tugas kuliah Anda. AI akan memberikan kunci jawaban presisi lengkap dengan pembahasan akademik langkah demi langkah.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Subject & Options */}
        <div className="card" style={{ padding: '24px', borderRadius: '18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={16} color="#8b5cf6" />
            1. Bidang Studi & Format Pembahasan
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '8px' }}>
                Mata Kuliah / Bidang Studi
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                style={{ width: '100%' }}
              >
                {POPULAR_SUBJECTS.map((subj, idx) => (
                  <option key={idx} value={subj}>{subj}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '8px' }}>
                Gaya / Detail Pembahasan
              </label>
              <select
                value={answerMode}
                onChange={(e) => setAnswerMode(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="Pembahasan Rinci & Langkah demi Langkah">Pembahasan Rinci & Langkah demi Langkah (Komprehensif)</option>
                <option value="Jawaban Singkat & Tepat Langsung Poin">Jawaban Singkat & Tepat (Langsung Kunci Jawaban)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Question Input */}
        <div className="card" style={{ padding: '24px', borderRadius: '18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HelpCircle size={16} color="#8b5cf6" />
            2. Masukkan / Tempelkan Soal Tugas
          </h2>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '8px' }}>
              Teks Soal / Pertanyaan Kuliah <span style={{ color: '#f43f5e' }}>*</span>
            </label>
            <textarea
              value={questions}
              onChange={(e) => setQuestions(e.target.value)}
              rows={8}
              placeholder="Contoh:&#10;Soal 1: Carilah turunan pertama dari f(x) = 3x^3 + 5x^2 - 7x + 10!&#10;&#10;Soal 2: Jelaskan perbedaan antara Sistem Manajemen Basis Data Relasional (RDBMS) dan NoSQL disertai contoh penggunaannya!"
              style={{ width: '100%', resize: 'vertical', minHeight: '160px' }}
              required
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(15, 23, 42, 0.6)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Upload size={18} color="#8b5cf6" />
              <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                {uploadedFileName ? `Dokumen terlampir: ${uploadedFileName}` : 'Atau upload file lembar soal (.txt, .docx, .pdf)'}
              </span>
            </div>
            <label className="btn-secondary" style={{ fontSize: '0.75rem', padding: '6px 14px', cursor: 'pointer' }}>
              <span>{uploadedFileName ? 'Ganti File' : 'Pilih File'}</span>
              <input type="file" onChange={handleFileUpload} accept=".txt,.docx,.pdf" style={{ display: 'none' }} />
            </label>
          </div>
        </div>

        {/* Action Button */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
          <button
            type="submit"
            disabled={isSolving}
            className="btn-primary"
            style={{
              padding: '16px 36px',
              fontSize: '1rem',
              fontWeight: 800,
              borderRadius: '14px',
              width: '100%',
              maxWidth: '480px',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
              boxShadow: '0 8px 25px rgba(139, 92, 246, 0.4)'
            }}
          >
            {isSolving ? (
              <>
                <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#ffffff', animation: 'spin 1s linear infinite' }} />
                <span>Sedang Menganalisis & Menjawab Soal...</span>
              </>
            ) : (
              <>
                <Sparkles size={20} color="#e0e7ff" />
                <span>Jawab Soal & Tampilkan Pembahasan</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
