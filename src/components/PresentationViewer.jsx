import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, ChevronRight, Maximize2, Mic, Palette, Download, 
  Printer, Copy, Edit3, ArrowLeft, Check, Sparkles, Quote, Layers, TrendingUp,
  Plus, Trash2, ArrowUp, ArrowDown, Layout, PlusCircle, X, Sliders,
  Play, Pause, RotateCcw
} from 'lucide-react';
import { PRESENTATION_THEMES } from './PresentationGenerator';

// Helper to format bullet content smoothly without showing raw ** asterisks
const formatBulletContent = (str) => {
  if (!str) return null;
  const match = str.match(/^\*\*(.*?)\*\*\s*(.*)/);
  if (match) {
    const title = match[1].replace(/:$/, '').trim();
    const rest = match[2].trim();
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <strong style={{ fontWeight: 800, color: '#ffffff', fontSize: '1.05rem', letterSpacing: '-0.01em' }}>
          {title}
        </strong>
        <span style={{ fontSize: '0.92rem', opacity: 0.88, lineHeight: '1.5', color: '#cbd5e1' }}>
          {rest}
        </span>
      </div>
    );
  }
  const cleanStr = str.replace(/\*\*/g, '');
  return <span style={{ fontSize: '0.98rem', lineHeight: '1.5', color: '#f1f5f9' }}>{cleanStr}</span>;
};

// Helper for HTML Export strings
const formatHtmlBulletContent = (str) => {
  if (!str) return '';
  const match = str.match(/^\*\*(.*?)\*\*\s*(.*)/);
  if (match) {
    const title = match[1].replace(/:$/, '').trim();
    const rest = match[2].trim();
    return `<strong style="font-weight: 800; font-size: 1rem; color: #ffffff; display: block; margin-bottom: 3px;">${title}</strong><span style="opacity: 0.88; font-size: 0.9rem; color: #cbd5e1; line-height: 1.5;">${rest}</span>`;
  }
  return str.replace(/\*\*/g, '');
};

export default function PresentationViewer({ data, onBackToForm }) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [slides, setSlides] = useState(data.slides || []);
  const [selectedThemeId, setSelectedThemeId] = useState(data.theme || 'cyber-dark');
  const [showSpeakerNotes, setShowSpeakerNotes] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Animation & Auto-Play States
  const [slideDirection, setSlideDirection] = useState('next');
  const [isPlayingAuto, setIsPlayingAuto] = useState(false);
  const [autoProgress, setAutoProgress] = useState(0);

  const currentTheme = PRESENTATION_THEMES.find(t => t.id === selectedThemeId) || PRESENTATION_THEMES[0];
  const currentSlide = slides[currentSlideIndex] || slides[0] || {};

  // Slide Navigation Handlers with Animation Direction
  const handleNextSlide = () => {
    if (currentSlideIndex < slides.length - 1) {
      setSlideDirection('next');
      setCurrentSlideIndex(prev => prev + 1);
    } else if (isPlayingAuto) {
      // Loop back to start in auto-play
      setSlideDirection('next');
      setCurrentSlideIndex(0);
    }
  };

  const handlePrevSlide = () => {
    if (currentSlideIndex > 0) {
      setSlideDirection('prev');
      setCurrentSlideIndex(prev => prev - 1);
    }
  };

  const handleSelectSlideIndex = (index) => {
    setSlideDirection(index >= currentSlideIndex ? 'next' : 'prev');
    setCurrentSlideIndex(index);
  };

  // Keyboard navigation for presentation mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isEditing) return; // Disable shortcut while typing in form fields
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        e.preventDefault();
        handleNextSlide();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevSlide();
      } else if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slides.length, isFullscreen, isEditing, currentSlideIndex]);

  // Auto Slideshow Play Timer (Every 4.5 seconds)
  useEffect(() => {
    let timer;
    let progressTimer;
    if (isPlayingAuto) {
      setAutoProgress(0);
      progressTimer = setInterval(() => {
        setAutoProgress(prev => Math.min(prev + 2, 100));
      }, 90);

      timer = setInterval(() => {
        handleNextSlide();
      }, 4500);
    } else {
      setAutoProgress(0);
    }
    return () => {
      clearInterval(timer);
      clearInterval(progressTimer);
    };
  }, [isPlayingAuto, currentSlideIndex]);

  // Update field on active slide
  const handleUpdateSlideField = (field, value) => {
    const updated = [...slides];
    updated[currentSlideIndex] = {
      ...updated[currentSlideIndex],
      [field]: value
    };
    setSlides(updated);
  };

  // Add a brand new slide
  const handleAddNewSlide = () => {
    const newSlide = {
      slideNumber: slides.length + 1,
      layout: 'bullets',
      title: 'Judul Slide Baru',
      subtitle: 'Sub-judul atau penjelasan ringkas slide',
      bullets: [
        'Poin utama pertama presentasi Anda',
        'Poin pendukung kedua dengan data faktual',
        'Langkah tindakan atau kesimpulan ketiga'
      ],
      speakerNotes: 'Skrip narasi pembicara untuk slide baru ini.',
      keyTakeaway: 'Poin inti yang ingin disampaikan pada slide ini'
    };
    setSlides([...slides, newSlide]);
    setSlideDirection('next');
    setCurrentSlideIndex(slides.length);
  };

  // Delete current active slide
  const handleDeleteCurrentSlide = () => {
    if (slides.length <= 1) {
      alert('Presentasi harus memiliki minimal 1 slide.');
      return;
    }
    if (window.confirm(`Apakah Anda yakin ingin menghapus Slide ${currentSlideIndex + 1}?`)) {
      const updated = slides.filter((_, idx) => idx !== currentSlideIndex);
      setSlides(updated);
      setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1));
    }
  };

  // Reorder slide up / down
  const handleMoveSlide = (direction) => {
    const newIndex = direction === 'up' ? currentSlideIndex - 1 : currentSlideIndex + 1;
    if (newIndex < 0 || newIndex >= slides.length) return;
    const updated = [...slides];
    const temp = updated[currentSlideIndex];
    updated[currentSlideIndex] = updated[newIndex];
    updated[newIndex] = temp;
    setSlides(updated);
    setCurrentSlideIndex(newIndex);
  };

  // Bullet items add/update/delete
  const handleUpdateBullet = (index, value) => {
    const bullets = [...(currentSlide.bullets || [])];
    bullets[index] = value;
    handleUpdateSlideField('bullets', bullets);
  };

  const handleAddBullet = () => {
    const bullets = [...(currentSlide.bullets || []), 'Poin baru presentasi'];
    handleUpdateSlideField('bullets', bullets);
  };

  const handleDeleteBullet = (index) => {
    const bullets = (currentSlide.bullets || []).filter((_, idx) => idx !== index);
    handleUpdateSlideField('bullets', bullets);
  };

  // Two columns left/right bullets update
  const handleUpdateColBullet = (col, index, value) => {
    const field = col === 'left' ? 'leftBullets' : 'rightBullets';
    const items = [...(currentSlide[field] || [])];
    items[index] = value;
    handleUpdateSlideField(field, items);
  };

  const handleAddColBullet = (col) => {
    const field = col === 'left' ? 'leftBullets' : 'rightBullets';
    const items = [...(currentSlide[field] || []), 'Item poin baru'];
    handleUpdateSlideField(field, items);
  };

  const handleDeleteColBullet = (col, index) => {
    const field = col === 'left' ? 'leftBullets' : 'rightBullets';
    const items = (currentSlide[field] || []).filter((_, idx) => idx !== index);
    handleUpdateSlideField(field, items);
  };

  // Metrics update & add/delete
  const handleUpdateMetric = (index, key, value) => {
    const metrics = [...(currentSlide.metrics || [])];
    metrics[index] = { ...metrics[index], [key]: value };
    handleUpdateSlideField('metrics', metrics);
  };

  const handleAddMetric = () => {
    const metrics = [...(currentSlide.metrics || []), { value: '100%', label: 'Label Metrik Baru' }];
    handleUpdateSlideField('metrics', metrics);
  };

  const handleDeleteMetric = (index) => {
    const metrics = (currentSlide.metrics || []).filter((_, idx) => idx !== index);
    handleUpdateSlideField('metrics', metrics);
  };

  // Copy Markdown presentation outline
  const handleCopyMarkdown = () => {
    let md = `# ${data.presentationTitle || 'Presentasi'}\n\n`;
    if (data.subtitle) md += `*${data.subtitle}*\n\n---\n\n`;

    slides.forEach((s, idx) => {
      md += `## Slide ${idx + 1}: ${s.title}\n`;
      if (s.subtitle) md += `*${s.subtitle}*\n\n`;
      
      if (s.bullets && s.bullets.length > 0) {
        s.bullets.forEach(b => { md += `- ${b.replace(/\*\*/g, '')}\n`; });
        md += '\n';
      }

      if (s.leftBullets && s.rightBullets) {
        md += `### ${s.leftColumnTitle || 'Bagian 1'}\n`;
        s.leftBullets.forEach(b => { md += `- ${b.replace(/\*\*/g, '')}\n`; });
        md += `\n### ${s.rightColumnTitle || 'Bagian 2'}\n`;
        s.rightBullets.forEach(b => { md += `- ${b.replace(/\*\*/g, '')}\n`; });
        md += '\n';
      }

      if (s.speakerNotes) {
        md += `> **Catatan Pembicara:** ${s.speakerNotes}\n\n`;
      }
      md += '---\n\n';
    });

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Export Standalone Animated HTML Presentation File
  const handleExportHTML = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.presentationTitle || 'Presentasi Animasi AI'}</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bulma@1.0.2/css/bulma.min.css">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', sans-serif; }
    body { background: ${currentTheme.pureBg || '#070a12'}; color: ${currentTheme.text}; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; overflow-x: hidden; padding: 20px; }
    .slide-card { 
      background: ${currentTheme.cardBg}; 
      border: 1px solid rgba(255,255,255,0.15); 
      border-radius: 32px; 
      padding: 56px; 
      width: 100%; 
      max-width: 1020px; 
      min-height: 560px; 
      display: none; 
      flex-direction: column; 
      justify-content: space-between; 
      box-shadow: 0 30px 80px -15px rgba(0,0,0,0.7); 
      position: relative; 
      backdrop-filter: blur(24px); 
      overflow: hidden; 
      background-image: radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px);
      background-size: 24px 24px;
    }
    .slide-card.active { display: flex; animation: slideEnterRight 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    @keyframes slideEnterRight { from { opacity: 0; transform: translateX(50px) scale(0.96); filter: blur(4px); } to { opacity: 1; transform: translateX(0) scale(1); filter: blur(0); } }
    h1 { font-size: 2.8rem; font-weight: 900; line-height: 1.2; margin-bottom: 14px; background: ${currentTheme.gradientAccent || currentTheme.accent}; -webkit-background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: -0.02em; }
    h2 { font-size: 2.2rem; font-weight: 800; line-height: 1.25; margin-bottom: 14px; color: ${currentTheme.text}; letter-spacing: -0.01em; }
    p.subtitle { font-size: 1.15rem; color: ${currentTheme.subtext}; margin-bottom: 28px; line-height: 1.6; font-weight: 500; }
    .bullets { display: grid; gap: 16px; margin-top: 20px; }
    .bullet-item { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-left: 5px solid ${currentTheme.accent}; padding: 18px 24px; border-radius: 18px; font-size: 1rem; line-height: 1.5; color: ${currentTheme.text}; display: flex; gap: 16px; align-items: flex-start; backdrop-filter: blur(12px); transition: all 0.3s cubic-bezier(0.16,1,0.3,1); }
    .bullet-item:hover { transform: translateY(-4px); box-shadow: 0 10px 25px rgba(99,102,241,0.3); border-color: rgba(255,255,255,0.2); }
    .num-chip { background: ${currentTheme.gradientAccent || currentTheme.accent}; color: #ffffff; width: 32px; height: 32px; border-radius: 10px; font-weight: 800; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px; }
    .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 20px; }
    .col-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 24px; border-radius: 20px; transition: all 0.3s ease; }
    .col-card:hover { transform: translateY(-4px); border-color: rgba(255,255,255,0.2); }
    .col-title { font-size: 1.1rem; font-weight: 800; color: ${currentTheme.accent}; margin-bottom: 16px; }
    .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 24px; margin-top: 28px; }
    .metric-card { background: rgba(255,255,255,0.04); border: 2px solid ${currentTheme.accent}; border-radius: 24px; padding: 28px; text-align: center; box-shadow: 0 10px 30px ${currentTheme.glowColor || 'rgba(99,102,241,0.2)'}; transition: all 0.3s ease; }
    .metric-card:hover { transform: translateY(-6px) scale(1.02); }
    .metric-val { font-size: 3.2rem; font-weight: 900; color: ${currentTheme.accent}; letter-spacing: -0.02em; }
    .metric-lbl { font-size: 0.92rem; color: ${currentTheme.subtext}; font-weight: 700; margin-top: 6px; }
    .controls { display: flex; align-items: center; justify-content: space-between; width: 100%; max-width: 1020px; margin-top: 24px; }
  </style>
</head>
<body>
  ${slides.map((s, idx) => `
    <div class="slide-card ${idx === 0 ? 'active' : ''}" id="slide-${idx}">
      <div style="position: relative; z-index: 10;">
        <div class="tags has-addons mb-5">
          <span class="tag is-link is-medium font-bold">SLIDE ${idx + 1}</span>
          <span class="tag is-dark is-medium">${slides.length} SLIDES</span>
        </div>
        ${s.layout === 'title-slide' ? `
          <h1>${s.title}</h1>
          <p class="subtitle">${s.subtitle || ''}</p>
        ` : `
          <h2>${s.title}</h2>
          ${s.subtitle ? `<p class="subtitle">${s.subtitle}</p>` : ''}
        `}

        ${s.bullets && s.bullets.length > 0 ? `
          <div class="bullets">
            ${s.bullets.map((b, bIdx) => `
              <div class="bullet-item">
                <div class="num-chip">0${bIdx + 1}</div>
                <div>${formatHtmlBulletContent(b)}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${s.leftBullets && s.rightBullets ? `
          <div class="columns mt-4">
            <div class="column">
              <div class="col-card">
                <div class="col-title">${s.leftColumnTitle || 'Fokus Utama A'}</div>
                <div class="bullets">${s.leftBullets.map((b, bIdx) => `
                  <div class="bullet-item">
                    <div class="num-chip">0${bIdx + 1}</div>
                    <div>${formatHtmlBulletContent(b)}</div>
                  </div>
                `).join('')}</div>
              </div>
            </div>
            <div class="column">
              <div class="col-card">
                <div class="col-title">${s.rightColumnTitle || 'Fokus Utama B'}</div>
                <div class="bullets">${s.rightBullets.map((b, bIdx) => `
                  <div class="bullet-item">
                    <div class="num-chip">0${bIdx + 1}</div>
                    <div>${formatHtmlBulletContent(b)}</div>
                  </div>
                `).join('')}</div>
              </div>
            </div>
          </div>
        ` : ''}

        ${s.metrics && s.metrics.length > 0 ? `
          <div class="metrics-grid">
            ${s.metrics.map(m => `
              <div class="metric-card">
                <div class="metric-val">${m.value}</div>
                <div class="metric-lbl">${m.label}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${s.quoteText ? `
          <div style="background: rgba(255,255,255,0.04); border-left: 6px solid ${currentTheme.accent}; padding: 32px; border-radius: 0 24px 24px 0; margin-top: 28px;">
            <p style="font-size: 1.35rem; font-style: italic; font-weight: 600; margin-bottom: 12px; color: ${currentTheme.text};">"${s.quoteText}"</p>
            ${s.quoteAuthor ? `<span style="font-size: 0.95rem; font-weight: 800; color: ${currentTheme.accent};">— ${s.quoteAuthor}</span>` : ''}
          </div>
        ` : ''}
      </div>

      ${s.keyTakeaway ? `
        <div style="margin-top: 36px; padding-top: 18px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 0.88rem; color: ${currentTheme.subtext}; position: relative; z-index: 10;">
          💡 <strong>Key Takeaway:</strong> ${s.keyTakeaway}
        </div>
      ` : ''}
    </div>
  `).join('')}

  <div class="controls level mt-5">
    <div class="level-left">
      <button class="button is-link is-rounded font-bold" id="prevBtn" onclick="prevSlide()" disabled>← Prev</button>
      <button class="button is-primary is-rounded font-bold ml-2" id="playBtn" onclick="togglePlay()">▶ Auto Play</button>
    </div>
    <div class="level-item">
      <span class="tag is-dark is-medium" id="indicator">Slide 1 / ${slides.length}</span>
    </div>
    <div class="level-right">
      <button class="button is-link is-rounded font-bold" id="nextBtn" onclick="nextSlide()">Next →</button>
    </div>
  </div>

  <script>
    let current = 0;
    let playing = false;
    let timer = null;
    const total = ${slides.length};
    function update() {
      document.querySelectorAll('.slide-card').forEach((el, idx) => {
        el.classList.toggle('active', idx === current);
      });
      document.getElementById('indicator').innerText = 'Slide ' + (current + 1) + ' / ' + total;
      document.getElementById('prevBtn').disabled = current === 0;
      document.getElementById('nextBtn').disabled = current === total - 1;
    }
    function nextSlide() { if(current < total - 1) { current++; update(); } else if(playing) { current = 0; update(); } }
    function prevSlide() { if(current > 0) { current--; update(); } }
    function togglePlay() {
      playing = !playing;
      document.getElementById('playBtn').innerText = playing ? '⏸ Pause' : '▶ Auto Play';
      if(playing) { timer = setInterval(nextSlide, 4500); } else { clearInterval(timer); }
    }
    window.addEventListener('keydown', (e) => {
      if(e.key === 'ArrowRight' || e.key === 'Space') nextSlide();
      if(e.key === 'ArrowLeft') prevSlide();
    });
  </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(data.presentationTitle || 'presentasi').toLowerCase().replace(/\s+/g, '_')}_slide.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export Canva-Style Widescreen PDF (16:9 Print Page Layout)
  const handleExportCanvaPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Gagal membuka jendela cetak. Pastikan pop-up blocker diizinkan.');
      return;
    }

    const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>${data.presentationTitle || 'Presentasi Modern Canva AI'}</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bulma@1.0.2/css/bulma.min.css">
  <style>
    @page {
      size: 11in 6.1875in;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Plus Jakarta Sans', sans-serif;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      background: ${currentTheme.pureBg || '#070a12'};
      color: ${currentTheme.text};
      width: 100%;
    }
    .slide-page {
      width: 11in;
      height: 6.1875in;
      padding: 0.55in 0.75in;
      background: ${currentTheme.bg};
      color: ${currentTheme.text};
      page-break-after: always;
      break-after: page;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      overflow: hidden;
      background-image: radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px);
      background-size: 24px 24px;
    }
    .slide-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.15in;
      position: relative;
      z-index: 10;
    }
    .slide-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      position: relative;
      z-index: 10;
    }
    h1.title-main {
      font-size: 2.5rem;
      font-weight: 900;
      line-height: 1.2;
      color: ${currentTheme.text};
      margin-bottom: 0.12in;
      letter-spacing: -0.02em;
    }
    h2.slide-title {
      font-size: 1.9rem;
      font-weight: 800;
      line-height: 1.25;
      color: ${currentTheme.text};
      margin-bottom: 0.1in;
      letter-spacing: -0.01em;
    }
    p.subtitle {
      font-size: 1.08rem;
      color: ${currentTheme.subtext};
      font-weight: 500;
      line-height: 1.5;
      margin-bottom: 0.18in;
    }
    .bullets {
      display: grid;
      gap: 0.12in;
    }
    .bullet-item {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-left: 5px solid ${currentTheme.accent};
      padding: 0.14in 0.2in;
      border-radius: 16px;
      font-size: 0.95rem;
      line-height: 1.45;
      color: ${currentTheme.text};
      display: flex;
      gap: 0.14in;
      align-items: flex-start;
    }
    .num-chip {
      background: ${currentTheme.gradientAccent || currentTheme.accent};
      color: #ffffff;
      width: 26px;
      height: 26px;
      border-radius: 8px;
      font-weight: 800;
      font-size: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 2px;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(1.8in, 1fr));
      gap: 0.15in;
    }
    .metric-card {
      background: rgba(255, 255, 255, 0.05);
      border: 2px solid ${currentTheme.accent};
      border-radius: 20px;
      padding: 0.18in;
      text-align: center;
    }
    .metric-val {
      font-size: 2.5rem;
      font-weight: 900;
      color: ${currentTheme.accent};
    }
    .metric-lbl {
      font-size: 0.85rem;
      color: ${currentTheme.subtext};
      font-weight: 700;
      margin-top: 4px;
    }
    .quote-box {
      background: rgba(255, 255, 255, 0.04);
      border-left: 6px solid ${currentTheme.accent};
      padding: 0.22in 0.28in;
      border-radius: 0 20px 20px 0;
    }
    .quote-text {
      font-size: 1.25rem;
      font-style: italic;
      font-weight: 600;
      line-height: 1.5;
      margin-bottom: 0.1in;
    }
    .quote-author {
      font-size: 0.88rem;
      font-weight: 800;
      color: ${currentTheme.accent};
    }
    .slide-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 0.12in;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      font-size: 0.75rem;
      color: ${currentTheme.subtext};
      font-weight: 700;
      position: relative;
      z-index: 10;
    }
  </style>
</head>
<body>
  ${slides.map((s, idx) => `
    <div class="slide-page">
      <div>
        <div class="slide-header">
          <div class="tags has-addons">
            <span class="tag is-link font-bold">SLIDE ${idx + 1}</span>
            <span class="tag is-dark">OF ${slides.length}</span>
          </div>
          <div style="font-size: 0.75rem; font-weight: 800; color: ${currentTheme.accent}; letter-spacing: 0.05em;">
            ${data.presentationTitle ? data.presentationTitle.toUpperCase() : 'CANVA AI KEYNOTE'}
          </div>
        </div>

        <div class="slide-body">
          ${s.layout === 'title-slide' ? `
            <div style="text-align: center; padding: 0.3in 0;">
              <h1 class="title-main">${s.title}</h1>
              ${s.subtitle ? `<p class="subtitle" style="max-width: 8in; margin: 0 auto;">${s.subtitle}</p>` : ''}
            </div>
          ` : `
            <h2 class="slide-title">${s.title}</h2>
            ${s.subtitle ? `<p class="subtitle">${s.subtitle}</p>` : ''}
          `}

          ${s.bullets && s.bullets.length > 0 ? `
            <div class="bullets">
              ${s.bullets.map((b, bIdx) => `
                <div class="bullet-item">
                  <div class="num-chip">0${bIdx + 1}</div>
                  <div>${formatHtmlBulletContent(b)}</div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${s.leftBullets && s.rightBullets ? `
            <div class="columns mt-2">
              <div class="column">
                <div className="box p-4" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px;">
                  <div style="font-size: 0.95rem; font-weight: 800; color: ${currentTheme.accent}; margin-bottom: 0.1in;">${s.leftColumnTitle || 'Fokus Utama A'}</div>
                  <div class="bullets">${s.leftBullets.map((b, bIdx) => `
                    <div class="bullet-item">
                      <div class="num-chip">0${bIdx + 1}</div>
                      <div>${formatHtmlBulletContent(b)}</div>
                    </div>
                  `).join('')}</div>
                </div>
              </div>
              <div class="column">
                <div className="box p-4" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px;">
                  <div style="font-size: 0.95rem; font-weight: 800; color: ${currentTheme.accent}; margin-bottom: 0.1in;">${s.rightColumnTitle || 'Fokus Utama B'}</div>
                  <div class="bullets">${s.rightBullets.map((b, bIdx) => `
                    <div class="bullet-item">
                      <div class="num-chip">0${bIdx + 1}</div>
                      <div>${formatHtmlBulletContent(b)}</div>
                    </div>
                  `).join('')}</div>
                </div>
              </div>
            </div>
          ` : ''}

          ${s.metrics && s.metrics.length > 0 ? `
            <div class="metrics-grid">
              ${s.metrics.map(m => `
                <div class="metric-card">
                  <div class="metric-val">${m.value}</div>
                  <div class="metric-lbl">${m.label}</div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${s.quoteText ? `
            <div class="quote-box">
              <div class="quote-text">"${s.quoteText}"</div>
              ${s.quoteAuthor ? `<div class="quote-author">— ${s.quoteAuthor}</div>` : ''}
            </div>
          ` : ''}
        </div>
      </div>

      <div class="slide-footer">
        <div>${s.keyTakeaway ? `💡 <strong>Key Takeaway:</strong> ${s.keyTakeaway}` : `DataFlow AI Presentation Deck`}</div>
        <div>Canva Modern Ultra-Luxury PDF • 16:9 Widescreen</div>
      </div>
    </div>
  `).join('')}

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>`;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Rate Limit Fallback Notification Toast */}
      {data.isFallback && (
        <div className="notification is-warning is-light p-3 mb-0" style={{ borderRadius: '14px', border: '1px solid rgba(245, 158, 11, 0.4)', fontSize: '0.82rem' }}>
          💡 <strong>Mode Generator Cerdas Responsif:</strong> Batas kuota gratis API Gemini (429 Rate Limit) sedang tercapai secara temporer. Slide presentasi disusun secara otomatis menggunakan Generator Cerdas Lokal agar pekerjaan Anda tidak terhenti!
        </div>
      )}

      {/* Top Header Navigation Bar (Bulma Hero + Glassmorphism) */}
      <section className="hero is-small mb-2" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', borderRadius: '20px', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '16px 24px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
        <div className="hero-body p-0">
          <div className="level is-mobile mb-0">
            <div className="level-left">
              <button
                onClick={onBackToForm}
                className="button is-dark is-rounded is-small font-bold"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <ArrowLeft size={16} />
                <span>Kembali ke Form</span>
              </button>
            </div>

            <div className="level-right">
              <div className="buttons">
                {/* Auto Play Slideshow Button */}
                <button
                  onClick={() => setIsPlayingAuto(prev => !prev)}
                  className={`button is-small is-rounded font-bold ${isPlayingAuto ? 'is-danger' : 'is-success'}`}
                  style={{ boxShadow: isPlayingAuto ? '0 0 14px rgba(239,68,68,0.5)' : '0 0 14px rgba(16,185,129,0.3)' }}
                >
                  {isPlayingAuto ? <Pause size={14} className="mr-1" /> : <Play size={14} className="mr-1" />}
                  <span>{isPlayingAuto ? 'Jeda Presentasi' : 'Putar Slideshow Otomatis'}</span>
                </button>

                {/* Theme Selector Pill */}
                <div className="select is-small is-rounded">
                  <select
                    value={selectedThemeId}
                    onChange={(e) => setSelectedThemeId(e.target.value)}
                    style={{ background: '#0f172a', color: '#fff', borderColor: '#4f46e5', fontWeight: 600 }}
                  >
                    {PRESENTATION_THEMES.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                {/* Toggle Speaker Notes */}
                <button
                  onClick={() => setShowSpeakerNotes(prev => !prev)}
                  className={`button is-small is-rounded font-bold ${showSpeakerNotes ? 'is-primary' : 'is-dark'}`}
                >
                  <Mic size={14} className="mr-1" />
                  <span>{showSpeakerNotes ? 'Sembunyikan Narasi' : 'Tampilkan Narasi'}</span>
                </button>

                {/* Toggle Full Interactive Edit Mode */}
                <button
                  onClick={() => setIsEditing(prev => !prev)}
                  className={`button is-small is-rounded font-bold ${isEditing ? 'is-link' : 'is-dark'}`}
                >
                  <Edit3 size={14} className="mr-1" />
                  <span>{isEditing ? 'Tutup Panel Editor' : 'Buka Editor Slide'}</span>
                </button>

                {/* Fullscreen Mode */}
                <button
                  onClick={() => setIsFullscreen(true)}
                  className="button is-dark is-small is-rounded font-bold"
                >
                  <Maximize2 size={14} className="mr-1" />
                  <span>Fullscreen</span>
                </button>

                {/* Export Canva PDF */}
                <button
                  onClick={handleExportCanvaPDF}
                  className="button is-info is-small is-rounded font-bold"
                  style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)', border: 'none' }}
                >
                  <Printer size={14} className="mr-1" />
                  <span>Unduh PDF Canva (16:9)</span>
                </button>

                {/* Export HTML */}
                <button
                  onClick={handleExportHTML}
                  className="button is-success is-outlined is-small is-rounded font-bold"
                >
                  <Download size={14} className="mr-1" />
                  <span>Unduh HTML Slide</span>
                </button>

                {/* Copy Outline */}
                <button
                  onClick={handleCopyMarkdown}
                  className="button is-dark is-small is-rounded font-bold"
                >
                  {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                  <span className="ml-1">{copied ? 'Tersalin!' : 'Salin Markdown'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Auto-Play Progress Bar Indicator */}
      {isPlayingAuto && (
        <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '99px', overflow: 'hidden', margin: '-10px 0 10px 0' }}>
          <div 
            style={{ 
              height: '100%', 
              width: `${autoProgress}%`, 
              background: 'linear-gradient(90deg, #10b981, #6366f1)', 
              transition: 'width 0.1s linear' 
            }} 
          />
        </div>
      )}

      {/* Bulma Slide Control Level Toolbar */}
      <div 
        className="box p-3 mb-0"
        style={{
          borderRadius: '16px',
          background: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid var(--border-color)'
        }}
      >
        <div className="level is-mobile mb-0">
          <div className="level-left">
            <div className="buttons are-small">
              <button
                onClick={handleAddNewSlide}
                className="button is-primary is-light is-rounded font-bold"
              >
                <Plus size={14} className="mr-1" />
                <span>Tambah Slide Baru</span>
              </button>

              <button
                onClick={handleDeleteCurrentSlide}
                className="button is-danger is-light is-rounded font-bold"
              >
                <Trash2 size={14} className="mr-1" />
                <span>Hapus Slide Ini</span>
              </button>

              <div className="field has-addons mb-0">
                <p className="control">
                  <button
                    disabled={currentSlideIndex === 0}
                    onClick={() => handleMoveSlide('up')}
                    className="button is-dark"
                    title="Geser Slide ke Atas"
                  >
                    <ArrowUp size={14} />
                  </button>
                </p>
                <p className="control">
                  <button
                    disabled={currentSlideIndex === slides.length - 1}
                    onClick={() => handleMoveSlide('down')}
                    className="button is-dark"
                    title="Geser Slide ke Bawah"
                  >
                    <ArrowDown size={14} />
                  </button>
                </p>
              </div>
            </div>
          </div>

          <div className="level-right">
            <div className="field is-horizontal mb-0">
              <div className="field-label is-normal">
                <label className="label text-xs has-text-grey-light" style={{ whiteSpace: 'nowrap' }}>Layout Slide:</label>
              </div>
              <div className="field-body">
                <div className="select is-small">
                  <select
                    value={currentSlide.layout || 'bullets'}
                    onChange={(e) => handleUpdateSlideField('layout', e.target.value)}
                    style={{ background: '#0f172a', color: '#fff', fontWeight: 600 }}
                  >
                    <option value="title-slide">Title Slide (Pembuka)</option>
                    <option value="bullets">Bullets / Step Cards</option>
                    <option value="two-columns">Two Columns (Dua Kolom)</option>
                    <option value="key-metrics">Key Metrics (Statistik)</option>
                    <option value="quote">Quote (Kutipan Tokoh)</option>
                    <option value="conclusion">Conclusion (Penutup)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace Layout (Thumbnail Strip + Animated Presentation Canvas) */}
      <div className="columns is-desktop gap-3">
        {/* Left Column: Thumbnail Overview */}
        <div className="column is-3-desktop">
          <div className="box p-4" style={{ borderRadius: '20px', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid var(--border-color)', maxHeight: '740px', overflowY: 'auto' }}>
            <div className="tags has-addons mb-3">
              <span className="tag is-link is-light font-bold">SLIDE OVERVIEW</span>
              <span className="tag is-link">{slides.length}</span>
            </div>

            <div className="is-flex is-flex-direction-column gap-2">
              {slides.map((s, idx) => {
                const isActive = idx === currentSlideIndex;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectSlideIndex(idx)}
                    className="button is-fullwidth text-left"
                    style={{
                      height: 'auto',
                      padding: '14px',
                      borderRadius: '16px',
                      border: isActive ? `2px solid ${currentTheme.accent}` : '1px solid var(--border-color)',
                      background: isActive ? 'rgba(99, 102, 241, 0.22)' : 'rgba(15, 23, 42, 0.5)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: '4px',
                      transition: 'all 0.25s ease',
                      boxShadow: isActive ? `0 0 16px ${currentTheme.glowColor || 'rgba(99,102,241,0.35)'}` : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                      <span className="tag is-primary is-small font-bold">Slide 0{idx + 1}</span>
                      <span style={{ fontSize: '0.6rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
                        {s.layout || 'standard'}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: isActive ? '#ffffff' : '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                      {s.title}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleAddNewSlide}
              className="button is-dashed is-fullwidth mt-3 is-small is-rounded font-bold"
              style={{ border: '1px dashed #818cf8', color: '#818cf8', background: 'transparent' }}
            >
              <Plus size={14} className="mr-1" />
              <span>+ Tambah Slide Baru</span>
            </button>
          </div>
        </div>

        {/* Center Area: Animated Presentation Canvas */}
        <div className={isEditing ? "column is-6-desktop" : "column is-9-desktop"}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Animated Slide Canvas Container */}
            <div 
              key={currentSlideIndex}
              className={`box p-6 mb-0 ${slideDirection === 'next' ? 'slide-anim-next' : 'slide-anim-prev'}`}
              style={{
                background: currentTheme.bg,
                color: currentTheme.text,
                borderRadius: '32px',
                minHeight: '540px',
                border: `1px solid rgba(255, 255, 255, 0.15)`,
                boxShadow: `0 35px 85px -15px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255,255,255,0.15)`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden',
                backdropFilter: 'blur(24px)',
                backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.07) 1px, transparent 1px)',
                backgroundSize: '24px 24px'
              }}
            >
              {/* Dual Background Ambient Glowing Orbs with Pulsing Motion */}
              <div 
                className="aura-orb-animated"
                style={{
                  position: 'absolute',
                  top: '-100px',
                  right: '-100px',
                  width: '400px',
                  height: '400px',
                  background: currentTheme.glowColor || 'rgba(99, 102, 241, 0.35)',
                  filter: 'blur(100px)',
                  borderRadius: '50%',
                  pointerEvents: 'none'
                }}
              />
              <div 
                className="aura-orb-animated"
                style={{
                  position: 'absolute',
                  bottom: '-120px',
                  left: '-120px',
                  width: '350px',
                  height: '350px',
                  background: currentTheme.accent,
                  filter: 'blur(110px)',
                  borderRadius: '50%',
                  pointerEvents: 'none'
                }}
              />

              {/* Slide Content Header */}
              <div style={{ position: 'relative', zIndex: 10 }}>
                <div className="level is-mobile mb-4">
                  <div className="level-left">
                    <div className="tags has-addons mb-0">
                      <span className="tag is-link is-rounded font-bold" style={{ fontSize: '0.78rem', background: currentTheme.accent }}>SLIDE 0{currentSlideIndex + 1} / 0{slides.length}</span>
                      <span className="tag is-dark is-rounded" style={{ fontSize: '0.78rem', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>{currentSlide.layout || 'Bullets'}</span>
                    </div>
                  </div>

                  <div className="level-right">
                    <div className="buttons are-small mb-0">
                      <button
                        disabled={currentSlideIndex === 0}
                        onClick={handlePrevSlide}
                        className="button is-dark is-small is-rounded font-bold"
                        style={{ opacity: currentSlideIndex === 0 ? 0.3 : 1 }}
                      >
                        <ChevronLeft size={16} />
                        <span>Sebelumnya</span>
                      </button>
                      <button
                        disabled={currentSlideIndex === slides.length - 1}
                        onClick={handleNextSlide}
                        className="button is-dark is-small is-rounded font-bold"
                        style={{ opacity: currentSlideIndex === slides.length - 1 ? 0.3 : 1 }}
                      >
                        <span>Berikutnya</span>
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Title & Subtitle Display */}
                <div className="mb-5">
                  {currentSlide.layout === 'title-slide' ? (
                    <div style={{ textAlign: 'center', padding: '42px 0' }}>
                      <h1 style={{ fontSize: '3rem', fontWeight: 900, lineHeight: '1.2', marginBottom: '18px', letterSpacing: '-0.02em', background: currentTheme.gradientAccent || `linear-gradient(135deg, ${currentTheme.text} 0%, ${currentTheme.accent} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        {currentSlide.title}
                      </h1>
                      {currentSlide.subtitle && (
                        <p style={{ fontSize: '1.25rem', color: currentTheme.subtext, fontWeight: 500, maxWidth: '780px', margin: '0 auto', lineHeight: '1.6' }}>
                          {currentSlide.subtitle}
                        </p>
                      )}
                    </div>
                  ) : (
                    <>
                      <h2 style={{ fontSize: '2.3rem', fontWeight: 800, lineHeight: '1.25', marginBottom: '10px', color: currentTheme.text, letterSpacing: '-0.01em' }}>
                        {currentSlide.title}
                      </h2>
                      {currentSlide.subtitle && (
                        <p style={{ fontSize: '1.08rem', color: currentTheme.subtext, fontWeight: 500, lineHeight: '1.5' }}>
                          {currentSlide.subtitle}
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* Dynamic Layout: Bullets */}
                {currentSlide.bullets && currentSlide.bullets.length > 0 && (
                  <div style={{ display: 'grid', gap: '16px', marginTop: '22px' }}>
                    {currentSlide.bullets.map((b, bIdx) => (
                      <div 
                        key={bIdx}
                        className="slide-card-interactive"
                        style={{
                          padding: '20px 24px',
                          borderRadius: '18px',
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.09)',
                          borderLeft: `5px solid ${currentTheme.accent}`,
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '18px',
                          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
                          backdropFilter: 'blur(12px)'
                        }}
                      >
                        <div 
                          style={{ 
                            background: currentTheme.gradientAccent || currentTheme.accent, 
                            color: '#ffffff', 
                            width: '32px', 
                            height: '32px', 
                            borderRadius: '10px', 
                            fontWeight: 800, 
                            fontSize: '0.88rem', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            flexShrink: 0,
                            marginTop: '2px',
                            boxShadow: `0 4px 14px ${currentTheme.glowColor || 'rgba(99,102,241,0.35)'}`
                          }}
                        >
                          0{bIdx + 1}
                        </div>
                        <div style={{ flex: 1 }}>{formatBulletContent(b)}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Dynamic Layout: Two Columns */}
                {currentSlide.leftBullets && currentSlide.rightBullets && (
                  <div className="columns mt-4">
                    <div className="column">
                      <div className="box p-5 slide-card-interactive" style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '22px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: currentTheme.accent, marginBottom: '16px' }}>
                          {currentSlide.leftColumnTitle || 'Fokus Utama A'}
                        </h3>
                        <div style={{ display: 'grid', gap: '14px' }}>
                          {currentSlide.leftBullets.map((lb, idx) => (
                            <div key={idx} style={{ padding: '14px 18px', background: 'rgba(0,0,0,0.25)', borderRadius: '14px', borderLeft: `3px solid ${currentTheme.accent}` }}>
                              {formatBulletContent(lb)}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="column">
                      <div className="box p-5 slide-card-interactive" style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '22px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: currentTheme.accent, marginBottom: '16px' }}>
                          {currentSlide.rightColumnTitle || 'Fokus Utama B'}
                        </h3>
                        <div style={{ display: 'grid', gap: '14px' }}>
                          {currentSlide.rightBullets.map((rb, idx) => (
                            <div key={idx} style={{ padding: '14px 18px', background: 'rgba(0,0,0,0.25)', borderRadius: '14px', borderLeft: `3px solid ${currentTheme.accent}` }}>
                              {formatBulletContent(rb)}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Dynamic Layout: Key Metrics */}
                {currentSlide.metrics && currentSlide.metrics.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginTop: '30px' }}>
                    {currentSlide.metrics.map((m, mIdx) => (
                      <div key={mIdx} className="slide-card-interactive" style={{ background: 'rgba(255, 255, 255, 0.04)', border: `2px solid ${currentTheme.accent}`, borderRadius: '24px', padding: '30px', textAlign: 'center', boxShadow: `0 12px 35px ${currentTheme.glowColor || 'rgba(99,102,241,0.25)'}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '8px' }}>
                          <TrendingUp size={22} color={currentTheme.accent} />
                        </div>
                        <div style={{ fontSize: '3.2rem', fontWeight: 900, color: currentTheme.accent, letterSpacing: '-0.02em' }}>{m.value}</div>
                        <div style={{ fontSize: '0.92rem', color: currentTheme.subtext, fontWeight: 700, marginTop: '6px' }}>{m.label}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Dynamic Layout: Quote */}
                {currentSlide.quoteText && (
                  <div className="slide-card-interactive" style={{ background: 'rgba(255, 255, 255, 0.04)', borderLeft: `6px solid ${currentTheme.accent}`, padding: '38px', borderRadius: '0 26px 26px 0', marginTop: '30px', position: 'relative' }}>
                    <Quote size={44} color={currentTheme.accent} style={{ position: 'absolute', top: '24px', right: '28px', opacity: 0.2 }} />
                    <p style={{ fontSize: '1.4rem', fontStyle: 'italic', fontWeight: 600, lineHeight: '1.6', marginBottom: '16px', color: currentTheme.text }}>
                      "{currentSlide.quoteText}"
                    </p>
                    {currentSlide.quoteAuthor && (
                      <span style={{ fontSize: '0.98rem', fontWeight: 800, color: currentTheme.accent }}>
                        — {currentSlide.quoteAuthor}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Slide Footer / Key Takeaway */}
              {currentSlide.keyTakeaway && (
                <div style={{ marginTop: '38px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: currentTheme.subtext, position: 'relative', zIndex: 10 }}>
                  <Sparkles size={18} color={currentTheme.accent} />
                  <span><strong>Key Takeaway:</strong> {currentSlide.keyTakeaway}</span>
                </div>
              )}
            </div>

            {/* Speaker Notes Panel */}
            {showSpeakerNotes && (
              <div className="notification is-dark mb-0 p-4" style={{ borderRadius: '20px', background: 'rgba(15, 23, 42, 0.92)', border: '1px solid rgba(139, 92, 246, 0.35)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Mic size={16} color="#a855f7" />
                  <span className="tag is-primary is-light font-bold" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Catatan Pembicara & Skrip Narasi (Slide 0{currentSlideIndex + 1})
                  </span>
                </div>

                <p style={{ fontSize: '0.875rem', color: '#cbd5e1', lineHeight: '1.6', fontStyle: 'italic', margin: 0 }}>
                  "{currentSlide.speakerNotes || 'Tidak ada catatan pembicara khusus untuk slide ini.'}"
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Interactive Slide Editor Form Drawer */}
        {isEditing && (
          <div className="column is-3-desktop">
            <div className="box p-4" style={{ borderRadius: '22px', background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(168, 85, 247, 0.4)', maxHeight: '780px', overflowY: 'auto' }}>
              <div className="level is-mobile mb-3 pb-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <div className="level-left">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sliders size={16} color="#a855f7" />
                    <span className="font-bold text-xs" style={{ textTransform: 'uppercase', color: '#fff' }}>Editor Slide 0{currentSlideIndex + 1}</span>
                  </div>
                </div>
                <div className="level-right">
                  <button onClick={() => setIsEditing(false)} className="delete is-small" title="Tutup Editor"></button>
                </div>
              </div>

              {/* Title & Subtitle Inputs */}
              <div className="field mb-3">
                <label className="label text-xs">Judul Slide</label>
                <div className="control">
                  <input
                    type="text"
                    className="input is-small"
                    value={currentSlide.title || ''}
                    onChange={(e) => handleUpdateSlideField('title', e.target.value)}
                  />
                </div>
              </div>

              <div className="field mb-3">
                <label className="label text-xs">Sub-judul / Subtitle</label>
                <div className="control">
                  <input
                    type="text"
                    className="input is-small"
                    value={currentSlide.subtitle || ''}
                    onChange={(e) => handleUpdateSlideField('subtitle', e.target.value)}
                  />
                </div>
              </div>

              {/* Layout Specific Bullets Editor */}
              {currentSlide.bullets && (
                <div className="field mb-3">
                  <div className="level is-mobile mb-2">
                    <div className="level-left"><label className="label text-xs mb-0">Bullets ({currentSlide.bullets.length})</label></div>
                    <div className="level-right">
                      <button onClick={handleAddBullet} className="button is-primary is-light is-small py-0 px-2" style={{ fontSize: '0.7rem' }}>+ Poin</button>
                    </div>
                  </div>

                  <div className="is-flex is-flex-direction-column gap-2">
                    {currentSlide.bullets.map((b, idx) => (
                      <div key={idx} className="field has-addons mb-0">
                        <p className="control"><button className="button is-small is-static py-0 px-2 text-xs font-bold" style={{ color: '#818cf8' }}>0{idx + 1}</button></p>
                        <p className="control is-expanded">
                          <input
                            type="text"
                            className="input is-small"
                            value={b}
                            onChange={(e) => handleUpdateBullet(idx, e.target.value)}
                          />
                        </p>
                        <p className="control">
                          <button onClick={() => handleDeleteBullet(idx)} className="button is-danger is-outlined is-small py-0 px-2"><X size={12} /></button>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Takeaway */}
              <div className="field mb-3">
                <label className="label text-xs">Key Takeaway</label>
                <div className="control">
                  <input
                    type="text"
                    className="input is-small"
                    value={currentSlide.keyTakeaway || ''}
                    onChange={(e) => handleUpdateSlideField('keyTakeaway', e.target.value)}
                  />
                </div>
              </div>

              {/* Speaker Notes */}
              <div className="field mb-2">
                <label className="label text-xs">Catatan Pembicara</label>
                <div className="control">
                  <textarea
                    className="textarea is-small"
                    rows={3}
                    value={currentSlide.speakerNotes || ''}
                    onChange={(e) => handleUpdateSlideField('speakerNotes', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Overlay Presentation Mode */}
      {isFullscreen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: currentTheme.pureBg || '#070a12',
            color: currentTheme.text,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '60px 80px',
            overflow: 'hidden'
          }}
        >
          <div className="level is-mobile mb-4">
            <div className="level-left">
              <span className="tag is-primary is-medium font-bold">
                MODE PRESENTASI • SLIDE 0{currentSlideIndex + 1} / 0{slides.length}
              </span>
            </div>
            <div className="level-right">
              <button
                onClick={() => setIsFullscreen(false)}
                className="button is-light is-outlined font-bold"
              >
                Keluar Fullscreen (Esc)
              </button>
            </div>
          </div>

          <div style={{ maxWidth: '1050px', width: '100%', margin: '0 auto' }}>
            <h1 style={{ fontSize: '3.4rem', fontWeight: 900, marginBottom: '18px', color: currentTheme.text }}>
              {currentSlide.title}
            </h1>
            {currentSlide.subtitle && (
              <p style={{ fontSize: '1.45rem', color: currentTheme.subtext, marginBottom: '36px' }}>
                {currentSlide.subtitle}
              </p>
            )}

            {currentSlide.bullets && (
              <div style={{ display: 'grid', gap: '22px' }}>
                {currentSlide.bullets.map((b, idx) => (
                  <div key={idx} className="slide-card-interactive" style={{ background: 'rgba(255,255,255,0.05)', padding: '22px 28px', borderRadius: '18px', fontSize: '1.4rem', borderLeft: `6px solid ${currentTheme.accent}` }}>
                    {formatBulletContent(b)}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="level is-mobile mt-5">
            <div className="level-left">
              <button
                disabled={currentSlideIndex === 0}
                onClick={handlePrevSlide}
                className="button is-link is-medium font-bold"
                style={{ opacity: currentSlideIndex === 0 ? 0.3 : 1 }}
              >
                ← Previous Slide
              </button>
            </div>
            <div className="level-item">
              <span className="has-text-grey-light font-medium">
                Gunakan Panah Kiri / Kanan atau Tombol Spasi di Keyboard
              </span>
            </div>
            <div className="level-right">
              <button
                disabled={currentSlideIndex === slides.length - 1}
                onClick={handleNextSlide}
                className="button is-link is-medium font-bold"
                style={{ opacity: currentSlideIndex === slides.length - 1 ? 0.3 : 1 }}
              >
                Next Slide →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
